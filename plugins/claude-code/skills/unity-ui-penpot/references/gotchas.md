# Penpot MCP: lỗi đã gặp và cách tránh

- `penpot.currentUser` lỗi "Permission user:read is not granted". Không cần đọc nó để kiểm tra kết nối; đọc `penpot.currentFile.name`, `penpotUtils.getPages()`.
- `export_shape` với `shapeId: "page"` bị timeout 500. Luôn xuất theo id board.
- `storage` mất khi plugin reload. Nếu `storage.ui` là undefined, nạp lại `scripts/helpers.js`. Lấy shape bằng tên hoặc id (`penpotUtils.findShapeById`), đừng tin object cũ trong storage.
- Tên token không được là tiền tố của token khác: không thể có cả `icon.tab` và `icon.tab.active`.
- Token không sửa value tại chỗ được; dùng `ui.setToken(type, name, value)` (xoá rồi tạo lại).
- Đổi `x`/`y` của board sẽ dời luôn các con. Đừng dời con rồi dời board, nếu không sẽ bị dời hai lần.
- `resize()` trên text đặt `growType` về fixed. Muốn căn giữa: resize(w, h) → `growType='auto-height'` → `align='center'` → chờ ~150ms rồi mới đọc height (`ui.centerY`).
- Shadow đặt trên board bám theo hình các con (icon nổi, badge có glow) và tạo mảng tối xấu. Đặt fill và shadow lên một rect con riêng ở index 0 (`Frame`, `Nav Shadow`), board để trong suốt.
- Drop-shadow blur lớn (60–90) gần như không hiện khi export. Dải bóng mờ dài thì dùng rect gradient (`ui.shade`).
- Instance component resize bị méo nếu main component không có constraints. `ui.button` đã đặt sẵn: Edge/Face = leftright+topbottom, Gloss = leftright+top, Label = leftright+center.
- Flex layout: đổi thứ tự con bằng `child.setParentIndex(i)`. Con cần vị trí tự do trong flex: `child.layoutChild.absolute = true`.
- Stroke của board được vẽ đè lên các con, nên icon tab active nổi lên sẽ bị viền navbar cắt ngang. Đặt stroke lên rect `Nav Shadow` nằm dưới, còn `Bottom Nav` để `strokes = []`.
- Icon nổi lên khỏi tab hoặc board cha: đặt `clipContent = false` cho cha.
- Thêm nhiều phần tử vào board flex: chờ ~300ms để layout tính xong rồi mới đọc vị trí và đặt con bên trong.
- Card sprite trong các board "UI Pack" có dạng `Card - <file>.png`; ảnh là shape có `fillImage` bên trong card (`ui.spriteSrc`). Một số card có thể trống: xuất board pack ra xem trước khi gán.
- `ui.audit` là hàm async (đo chữ thật trong nút bằng cách tạm chuyển `growType` sang auto-width rồi trả lại): luôn `await ui.audit(screen)`. Nó nằm trong `scripts/audit.js`, phải nạp sau `helpers.js`.
