# Antigravity Integration & IPC Gotchas

Tài liệu này ghi lại các bài học kỹ thuật cốt lõi và các "bẫy" (gotchas) khi xây dựng plugin, hook và subagent tích hợp với Google Antigravity.

---

## 1. PreToolUse Hook & Mô hình Phân quyền (Permission Model)

### Nguy cơ tự động duyệt quyền (Auto-allow vulnerability)
- **Tài liệu Antigravity quy định**: `"allow"` nghĩa là *"Automatically allow the tool execution"*.
- **Quy tắc bắt buộc**: Hook **TUYỆT ĐỐI KHÔNG** được trả về `{"decision": "allow"}` cho các lệnh bình thường. Nếu hook không có lý do để chặn (`deny`), hook không nên trả về `"allow"` (mà trả về rỗng `{}` hoặc không can thiệp), để giữ nguyên cơ chế bảo mật và xin quyền của người dùng theo tài liệu. *(Lưu ý: cơ chế hiện modal xin quyền khi trả `{}` là suy luận từ tài liệu và thiết kế spec, chưa qua đo kiểm trực tiếp trên UI modal).*
- **Hậu quả nếu vi phạm**: Trả về `"allow"` sẽ tự động cho phép chạy mọi lệnh shell (`run_command`) hoặc sửa file (`write_to_file`, `replace_file_content`) mà không cần user duyệt, kể cả các thao tác của agent chính.

### Giới hạn Payload của PreToolUse
- Payload Antigravity gửi tới `stdin` của hook `PreToolUse` **KHÔNG** chứa thông tin định danh agent đang chạy (`agent_type`, `agentName`, `subagent_type` đều không tồn tại trong spec).
- **Hậu quả**: Không thể dùng `PreToolUse` ở cấp độ plugin để phân biệt agent nào là read-only (như `unity-verifier`, `unity-reviewer`) nhằm chặn riêng agent đó.
- **Quy tắc kiểm thử**: Khi viết unit test cho hook, **KHÔNG ĐƯỢC** tự chế thêm các trường dữ liệu ảo (như tự nhét `agent_type` vào payload mock). Nếu test chỉ pass nhờ dữ liệu ảo, đó là false positive.

---

## 2. Stop Hook & Vòng đời dừng (Termination Reason Contract)

### Phải đọc `terminationReason`
Payload của `Stop` hook luôn đi kèm trường `terminationReason` (thuộc enum `ExecutorTerminationReason` đã bỏ tiền tố):
- `NO_TOOL_CALL`: Agent kết thúc lượt bình thường vì đã xong việc (không gọi thêm tool).
- `USER_CANCELED`: Người dùng chủ động bấm Hủy / Dừng lượt chạy.
- `ERROR`: Lượt chạy gặp lỗi hệ thống hoặc ngoại lệ runtime.
- `MAX_INVOCATIONS` / `MAX_FORCED_INVOCATIONS`: Chạm ngưỡng giới hạn lượt gọi tối đa.
- `MAX_TOKEN_BUDGET_EXCEEDED`: Vượt quá ngân sách token.

### Quy tắc xử lý Stop Gate
- **CHỈ chặn và yêu cầu tiếp tục (`{"decision": "continue", "reason": "..."}`)** khi:
  `terminationReason === "NO_TOOL_CALL"` (hoặc trường này không tồn tại như trong Claude Code).
- **BẮT BUỘC cho phép dừng (`agent.allowStop()`)** khi `terminationReason` là:
  `USER_CANCELED`, `ERROR`, `MAX_INVOCATIONS`, v.v.
- **Hậu quả nếu vi phạm**: Nếu user bấm Cancel hoặc session bị lỗi, Stop gate vẫn trả về `continue`, ép Antigravity tiếp tục vòng lặp và tước quyền kiểm soát của user.

---

## 3. Step Types vs Tool Names

- Tài liệu Antigravity mô tả matcher trong `hooks.json` so khớp tên dựa trên `step type` (được chuyển thành chữ thường và bỏ tiền tố `CORTEX_STEP_TYPE_`).
- Trong log Antigravity thực tế, các thao tác sửa file mang step type `CODE_ACTION` (`code_action`), trong khi tên tool là `write_to_file`, `replace_file_content`, `multi_replace_file_content`. *(Lưu ý: giả thuyết matcher so theo `code_action` thay vì tên tool là suy luận đối chiếu từ tài liệu/log, chưa được kiểm chứng qua một hook test bắt độc lập).*
- Khi cần nhận diện công cụ sửa file, danh sách `WRITE_TOOLS` phải bao gồm cả `multi_replace_file_content`.

---

## 4. Xử lý dữ liệu phòng thủ (Type Safety & Defensive Parsing)

- Metadata nhận từ Antigravity hoặc Claude Code có thể biến thiên giữa các phiên bản runtime.
- Trường `agent` hoặc `subagent` trong payload có thể là một `string` hoặc một `object` (ví dụ: `{"name": "unity-verifier"}`).
- **Quy tắc**: Luôn kiểm tra `typeof` trước khi gọi các hàm xử lý chuỗi như `.slice()`, `.lastIndexOf()`, `.toLowerCase()`:
  ```javascript
  const raw = payload.agent_type || (typeof payload.agent === 'string' ? payload.agent : payload.agent?.name) || '';
  const type = typeof raw === 'string' ? raw : '';
  ```

---

## 5. Quét ngữ nghĩa Skills (Cross-Platform Semantic Audit)

- Khi chuyển đổi skills giữa Claude Code và Antigravity, không được chỉ quét các token template `{{...}}`.
- Phải quét ngữ nghĩa để phát hiện các API hardcode:
  - Claude Code: `Workflow(...)`, `/workflows`, `ToolSearch`, `mcp__<server>__<tool>`.
  - Antigravity: `run_workflow(...)`, `call_mcp_tool(ServerName=..., ToolName=...)`, `ask_question`, `invoke_subagent`.
