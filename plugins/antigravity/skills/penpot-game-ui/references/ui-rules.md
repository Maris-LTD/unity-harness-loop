# Luật UI/UX game (do user đặt ra, bắt buộc)

Nếu project có luật riêng mâu thuẫn với file này, luật của project thắng. Hai luật xung đột với nhau, hoặc áp đúng luật mà nhìn vẫn xấu → báo user kèm ảnh, không tự phá luật.

## Khung và bố cục
- Khung mặc định 1080×2340. Vùng an toàn trên 150px, dưới 70px: không đặt chữ, icon hay nút ở đó, chỉ nền của header/navbar được tràn vào.
- Chữ nhỏ nhất 28px; nhãn khoảng 34px trở lên, nút 52px, tiêu đề 64px, chữ PLAY khoảng 104px.
- Vùng chạm nhỏ nhất 120×120px.
- Font mặc định Lilita One (kiểu chữ game casual).

## 1. Nút PLAY theo độ khó level
Normal = xanh lá, Hard = tím, Super Hard = đỏ. Dùng component `Play Button` (Difficulty).

## 2. Nút trong popup theo mức độ muốn người chơi bấm
- Primary (muốn bấm nhiều nhất) = xanh lá, glow mạnh
- Secondary (bấm vừa) = xanh dương, glow vừa
- Negative (không muốn người chơi bấm: đóng, từ chối, huỷ) = đỏ, glow nhẹ. Nút X đóng popup cũng tính là Negative.

## 3. Chữ trong nút
Chữ trắng, outline cùng màu nền nút nhưng đậm hơn một chút (`btn.<màu>.outline`), kèm drop-shadow cùng màu lệch xuống. Chữ đặt trên khung navy thì outline `theme.ink`.

## 4. Icon cùng cấp to bằng nhau về mặt thị giác
Không ép cùng width. Dùng `ui.optical(shape, target)`: scale để sqrt(w×h) bằng target. Các mức hiện có: currency 96, nút bên 112, tab thường 128, tab active 200 (cấp khác, cố ý to hơn).

## 5. Đồng bộ tông màu
Header, navbar, popup và nền các màn (shop, settings…) dùng cùng một tông (mặc định xanh dương: sky #4FC3F7 → primary #1E88E5 → deep #0B3D91 → ink #0A2A5E). Được thay đổi độ đậm nhạt và gradient, không đổi tông. Màu nhấn (vàng cho tab active hoặc nhãn, đỏ cho badge) dùng ít.

## 6. Khối phải nổi lên khỏi nền
Header và navbar có dải bóng mờ khá dài đổ vào nền: header từ trên xuống, navbar từ dưới lên. Làm bằng `ui.shade(...)` (rect gradient ink 0.55 → 0, cao khoảng 170px), cộng một viền cứng 6–8px tối hơn ở mép.

## 7. Kích thước nút trong popup
- Xếp ngang → các nút bằng nhau.
- Xếp dọc → nút muốn bấm nhất to hơn (ví dụ Primary 540×164, Secondary 400×130).
- Hai nút cùng loại → bằng nhau.

## 8. Không trùng màu nút trong một popup
Mỗi popup tối đa một nút mỗi màu. `ui.audit` kiểm tra luật này.

## 9. Dùng glow nhiều
Nút PLAY, nút Primary, phần thưởng (quầng radial vàng sau icon), tab hoặc icon đang chọn, badge thông báo, avatar, khung popup. Cường độ glow cũng thể hiện thứ bậc (Primary > Secondary > Negative).

## Nền màn
Mặc định không dùng ảnh phong cảnh: gradient dọc cùng tông, quầng sáng giữa màn, vài bokeh trắng 6%, lưới chấm tròn so le trắng 9% (`ui.backgroundFX`). Nếu có ảnh nền thì ẩn đi, không xoá.
