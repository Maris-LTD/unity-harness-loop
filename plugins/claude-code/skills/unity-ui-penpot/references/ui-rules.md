# Luật UI/UX game (do user đặt ra, bắt buộc)

Nếu project có luật riêng mâu thuẫn với file này, luật của project thắng. Hai luật xung đột với nhau, hoặc áp đúng luật mà nhìn vẫn xấu → báo user kèm ảnh, không tự phá luật.

## Khung và bố cục
- Khung mặc định 1080×2340. Vùng an toàn trên 150px, dưới 70px: không đặt chữ, icon hay nút ở đó, chỉ nền của header/navbar được tràn vào.
- Chữ nhỏ nhất 28px; nhãn khoảng 34px trở lên, nút 52px, tiêu đề 64px, chữ Play khoảng 104px.
- Vùng chạm nhỏ nhất 120×120px.
- Font mặc định Lilita One (kiểu chữ game casual).

## 1. Nút PLAY theo độ khó level
Normal = xanh lá, Hard = tím, Super Hard = đỏ. Dùng component `Play Button` (Difficulty).

## 2. Nút trong popup theo mức độ muốn người chơi bấm
- Primary (muốn bấm nhiều nhất) = xanh lá, có thể to hơn (luật 7)
- Secondary (bấm vừa) = xanh dương
- Negative (không muốn người chơi bấm: đóng, từ chối, huỷ) = đỏ. Nút X đóng popup cũng tính là Negative.

## 3. Chữ trong nút
Chữ trắng, outline cùng màu nền nút nhưng đậm hơn một chút (`btn.<màu>.outline`), kèm underlay (bóng cứng, không blur) cùng màu lệch xuống. Chữ trong nút không dùng shadow mềm (luật 12). Chữ đặt trên khung navy thì outline `theme.ink`.

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

## 9. Glow chỉ để nhấn mạnh icon, không đặt trên nút
- **Dùng glow** ở những icon cần làm nổi: icon chính trên popup (phần thưởng, vật phẩm), icon coin/gem trong gói shop, icon nhân vật hoặc vật phẩm được giới thiệu. Dùng `ui.iconGlow(icon)`. Số lượng thưởng đi kèm icon được glow nhẹ theo.
- **Không glow** ở chỗ cần rõ ràng: mọi button (PLAY, nút popup, nút X, tab, nút bên, nhãn trên nút), chữ tiêu đề, khung popup, avatar. Thứ bậc nút thể hiện bằng màu (luật 2) và kích thước (luật 7), không bằng glow.
- Badge thông báo (chấm đỏ, "!") được glow nhẹ vì là tín hiệu chú ý, không phải vùng bấm.
- `ui.audit` báo lỗi khi một nút hoặc phần tử con của nút có glow.

## 10. Chữ trong nút căn giữa, viết hoa chữ cái đầu mỗi từ
- **Căn giữa** cả ngang lẫn dọc so với mặt nút (`Face`, không tính phần đáy dày): `align='center'`, text rộng bằng nút, dùng `ui.centerY`. Có icon đi kèm (ví dụ giá kèm icon gem) thì cả cụm icon + chữ căn giữa nút.
- **Camel case kiểu tiêu đề**: mỗi từ viết hoa chữ cái đầu, còn lại viết thường: `Play`, `Claim Reward`, `Watch Ad`, `No Thanks`. Không viết ALL CAPS (`PLAY`, `CLAIM`), không viết thường toàn bộ. Chữ viết tắt ngắn (`OK`, `VIP`, `x2`) và số giữ nguyên. Đổi nhanh bằng `ui.titleCase('claim reward')`.
- `ui.audit` báo lỗi khi chữ trong nút lệch tâm quá 4px ngang / 6px dọc, hoặc sai kiểu viết hoa.

## 11. Popup ưu tiên icon và ảnh minh hoạ, hạn chế chữ
- Truyền đạt nội dung popup bằng icon/ảnh minh hoạ trước (phần thưởng, vật phẩm, nhân vật); chữ chỉ bổ sung.
- Ảnh minh hoạ phải nổi bật hơn chữ: đặt ở trung tâm popup, chiếm nhiều diện tích hơn khối chữ, có `ui.iconGlow` (luật 9).
- Đặt tên layer ảnh minh hoạ kết thúc bằng `Icon` hoặc chứa `Illustration`/`Reward` để `ui.audit` nhận ra.
- `ui.audit` báo lỗi khi popup không có ảnh minh hoạ, ảnh thấp hơn tổng chiều cao chữ, hoặc chữ ngoài nút quá 90 ký tự.

## 12. Shadow chỉ cho header lớn, còn lại outline + underlay
- **Shadow mềm** (có blur) chỉ dùng cho chữ cấp header lớn (≥ `font.title`, ví dụ tiêu đề popup, tên màn): `ui.text(..., { outline, shadow: true })`.
- **Mọi chữ khác** (mô tả, nhãn, số lượng, chữ trong nút): chỉ outline + underlay (bóng cứng lệch xuống, không blur), đúng như `ui.text(..., { outline })` tạo ra. Glow nhẹ cho số lượng thưởng theo luật 9 vẫn được phép.
- `ui.audit` báo lỗi khi chữ không phải header có shadow mềm, hoặc thiếu outline/underlay.

## 13. Vị trí popup dễ thao tác
- Popup căn giữa màn hoặc hơi thấp hơn giữa (tâm popup ở khoảng 50–58% chiều cao màn), không dồn lên trên.
- Các nút hành động nằm ở nửa dưới màn (vùng ngón cái), nút Primary gần ngón cái nhất. Ngoại lệ duy nhất là nút X đóng ở góc trên phải popup.
- `ui.audit` báo lỗi khi tâm popup hoặc tâm một nút hành động (trừ nút có tên `Close`/`X`) cao hơn 45% chiều cao màn.

## 14. Cấp chữ trong popup: Title → Description, tối đa 3 cấp
- Nội dung chữ của popup chỉ gồm `Title` (trên ribbon) rồi `Description` (ngắn, trong Body). Cấp thứ 3 chỉ dùng khi thật cần (ví dụ số lượng thưởng cạnh icon). Chữ trong nút không tính.
- Mỗi cấp một cỡ chữ cố định, Title luôn nằm trên Description. Đặt tên layer `Title`, `Description`.
- `ui.audit` báo lỗi khi popup có hơn 3 cỡ chữ (ngoài nút) hoặc Title nằm dưới Description.

## Nền màn
Mặc định không dùng ảnh phong cảnh: gradient dọc cùng tông, quầng sáng giữa màn, vài bokeh trắng 6%, lưới chấm tròn so le trắng 9% (`ui.backgroundFX`). Nếu có ảnh nền thì ẩn đi, không xoá.
