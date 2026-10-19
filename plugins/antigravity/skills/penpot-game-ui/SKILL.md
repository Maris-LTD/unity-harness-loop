---
name: penpot-game-ui
description: Design mobile game UI screens and popups in Penpot via the Penpot MCP from a sprite pack or demo image, following fixed game UI rules. Use for "thiết kế màn hình", "làm popup", "tạo UI game trong Penpot", "review UI Penpot".
---

# Penpot game UI

Dựng UI game mobile trong Penpot bằng Penpot MCP (gọi qua `call_mcp_tool(ServerName="penpot", ToolName="execute_code", ...)`). Phần khó không phải là vẽ mà là **giữ đúng luật và tự kiểm bằng ảnh**: mọi thay đổi đều phải xuất ảnh để xem trước khi báo xong.

Cần Penpot MCP server đã kết nối với file Penpot qua Penpot MCP Plugin. Không cần Unity Editor.

Tài liệu đi kèm (đường dẫn tính từ thư mục chứa SKILL.md này):
- `references/ui-rules.md`: luật UI/UX bắt buộc của user. **Đọc trước khi dựng bất cứ thứ gì.**
- `references/gotchas.md`: các lỗi Penpot MCP đã gặp. Đọc khi có gì chạy sai.
- `scripts/helpers.js`: thư viện hàm, nạp vào `storage.ui`.

## Bước 0: Kết nối và nạp thư viện
1. Kiểm tra Penpot MCP server bằng `call_mcp_tool(ServerName="penpot", ToolName="high_level_overview", Arguments={})`.
2. Kiểm tra kết nối: trả về `penpot.currentFile.name`, `penpotUtils.getPages()` và tên các board ở root. Không đọc `currentUser`, vì plugin không cấp quyền này.
3. Read `<skill dir>/scripts/helpers.js`, rồi truyền **nguyên văn** nội dung làm `code` cho `call_mcp_tool(ServerName="penpot", ToolName="execute_code", Arguments={"code": ...})`. Sau đó mọi lần gọi đều bắt đầu bằng `const ui = storage.ui;`. Nếu `storage.ui` là undefined (plugin reload) thì nạp lại.
4. Chạy `ui.ensureTokens()` để tạo token set "Game UI" nếu chưa có. Đổi tông màu theo game: `ui.ensureTokens({ 'theme.primary': '#...' })` cho token mới, hoặc `ui.setToken(...)` cho token đã có.

## Bước 1: Thu thập đầu vào
Cần biết: nguồn asset (board sprite trong Penpot hoặc file ảnh), demo hay ảnh tham khảo nếu có, danh sách tính năng của màn (tiền tệ, số tab, nút sự kiện…), thiết bị đích. Chỉ hỏi những gì không suy ra được. Có demo thì Read ảnh và mô tả lại bố cục trước khi dựng.

## Bước 2: Kiểm kê asset
- Xuất board chứa sprite ra ảnh, lập bảng sprite → vai trò (icon tab, tiền tệ, khung nút, nút +, icon sự kiện…).
- Lấy sprite bằng `ui.spriteSrc('<tên card>')`; đặt sprite bằng `ui.sprite(parent, name, src, x, y, w)` (giữ đúng tỉ lệ ảnh).
- Sprite mơ hồ (một khối màu không rõ dùng làm gì), trống, hoặc trông như placeholder thì hỏi user, không tự gán. Thiếu asset thì vẽ bằng shape theo đúng phong cách và báo lại.

## Bước 3: Component dùng chung
Nếu chưa có board `UI Kit - Buttons` thì dựng:
- `Play Button` (Difficulty: Normal/green, Hard/purple, Super Hard/red), 420×200, `radius.button.lg`, chữ `font.display`.
- `Popup Button` (Type: Primary/green, Secondary/blue, Negative/red), 400×140, `radius.button.md`, chữ `font.button`.
- Tạo bằng `await ui.button(kit, {name, x, y, w, h, color, label, size, radius})`, sau đó `ui.makeVariants([{shape, properties}], 'Play Button')`.
- Dùng instance qua `ui.variant('Popup Button', { Type: 'Primary' })`, đổi chữ qua child `Label`, resize thoải mái vì constraints đã đặt sẵn.

## Bước 4: Dựng màn hình
`const s = ui.screen(name, x, y)`. Đặt ở chỗ trống bên phải các board đã có, không đè lên board khác. Thứ tự lớp từ dưới lên:
1. `ui.backgroundFX(s)` (hoặc ảnh nền nếu user muốn)
2. `Header Shade`: `ui.shade(s, 'Header Shade', s.x, headerBottom + 8, 1080, 170, true)`
3. `Top Bar`: gradient sky → primary, cao khoảng 330 (gồm vùng an toàn 150), viền cứng dưới `ui.drop('#0D47A1', 8)`. Bên trong là bộ đếm tiền tệ (pill `theme.deep`, icon `ui.optical(…, 96)`, nút +) và avatar tròn (không glow).
4. Nội dung: nút bên trái/phải là khung sprite đặt trong **rect `Frame` riêng** (không đặt shadow lên board), CTA chính và các phần khác.
5. `Nav Shade`, rồi `Nav Shadow` (rect cùng kích thước navbar, mang viền cứng `ui.drop(ink, -6)`), rồi `Bottom Nav`: board flex row, gap 4, padding dưới 66, các tab `horizontalSizing='fill'`. Tab active nền vàng (`btn.yellow.*`) và icon to nổi lên trên (`clipContent=false`, không glow). Tab thường chỉ có icon.

Popup: thêm `Dim Overlay` (#06173A, 70%) rồi board `Popup` gồm `Frame` (gradient primary → deep, viền ink, không glow), `Title Ribbon` (sky → primary), `Body` (surface), nội dung, rồi các nút theo luật 2, 7, 8. Nút đóng X là nút đỏ nhỏ, radius sm. Icon chính của popup (phần thưởng) được nhấn bằng `ui.iconGlow(icon)` (quầng radial vàng phía sau và glow nhẹ quanh icon).

Đặt tên layer rõ nghĩa (`Coin Counter`, `Btn - Events`, `Tab - Home`…) để dev Unity map được.

## Bước 5: Kiểm tra (bắt buộc)
1. `export_shape` theo id board màn hình, rồi tự xem ảnh: lệch, tràn khung, chữ đè nhau, mảng tối lạ do shadow, chỗ nào chìm vào nền.
2. `ui.audit(screen)` → `issues` phải rỗng. So `iconOpticalSizes` giữa các icon cùng cấp.
3. Rà theo checklist ở `references/ui-rules.md` (đặc biệt luật 2, 3, 6, 7, 8, 9).
4. Sửa, xuất ảnh lại, lặp đến khi sạch. Chỉ báo xong khi ảnh cuối cùng đã được xem.

## Báo cáo
Ngắn gọn, tiếng Việt: đã dựng gì (tên board), luật nào đã áp, chỗ nào phải đoán hoặc vẽ thay asset, những điểm cần user quyết. Không lặp lại toàn bộ luật.

## Sửa màn đã có
Đọc cấu trúc bằng `penpotUtils.shapeStructure(board, 3)` và xuất ảnh trước khi sửa. Nhân bản màn làm nền cho popup bằng `board.clone()`. Ảnh nền cũ thì ẩn (`hidden = true`), không xoá. Không sửa các board user bảo giữ nguyên.
