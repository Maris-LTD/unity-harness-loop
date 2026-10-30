# Luật UI/UX game (do user đặt ra, bắt buộc)

Nếu project có luật riêng mâu thuẫn với file này, luật của project thắng. Hai luật xung đột với nhau, hoặc áp đúng luật mà nhìn vẫn xấu → báo user kèm ảnh, không tự phá luật.

## Khung và bố cục
- Khung mặc định 1080×2340. Vùng an toàn trên 150px, dưới 70px: không đặt chữ, icon hay nút ở đó, chỉ nền của header/navbar được tràn vào.
- Chữ nhỏ nhất 28px; nhãn khoảng 34px trở lên, mô tả 40px, nút 60px, tiêu đề 64px, chữ Play khoảng 104px (tỉ lệ trong popup theo luật 16).
- Vùng chạm nhỏ nhất 120×120px.
- Một font duy nhất, mặc định Lilita One (kiểu chữ game casual, dày, bo tròn).

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

## Luật 15–19: bộ "Design UI rules" trên Notion
Nguồn: trang Notion "Design UI rules". Notion đo ở màn nhỏ; số px được quy đổi theo mốc chung với các luật trước là vùng chạm (44px Notion ↔ `touch.min` 120px), hệ số khoảng 2.7, rồi làm tròn về token sẵn có. Số gốc trên Notion ghi trong ngoặc. Các tỉ lệ % giữ nguyên.

Luật 10 cũ (Title Case) đã bỏ: căn giữa chữ trong nút chuyển sang luật 17, cách viết hoa theo luật 16.

## 15. Bố cục popup: không khoảng trống chết, padding lồng lớp
- **Zero Dead Space**: chiều cao popup co theo nội dung (wrap-content), không kéo dài Frame khi không đủ phần tử lấp đầy. Đáy Frame cách phần tử thấp nhất đúng bằng padding. Dùng `ui.stack(...)` rồi `ui.wrap(frame, bottom)`.
- Khoảng cách dọc giữa các khối liền kề (Content Frame → Description → nút) nhất quán trong 32–54px (Notion 12–20), mặc định `space.lg` 40.
- Padding từ viền Frame đến khối nội dung bên trong đều 4 phía, 54–65px (Notion 20–24), mặc định `space.xl` 64.
- Khối con (Content Frame, khung nhận thưởng) bo góc nhỏ hơn khung cha 11–22px (Notion 4–8) để hai đường cong song song: Frame `radius.panel` 36 → Content Frame `radius.tile` 24.
- `ui.audit` báo lỗi khi padding lệch hai bên hoặc ngoài khoảng, khoảng cách dọc ngoài 32–54px, đáy thừa trống, hoặc chênh bo góc sai.

## 16. Typography: một font, viền tương phản, tỉ lệ cỡ chữ
- **Một font duy nhất** cho cả màn/popup (casual hoạt hoạ, dày, bo tròn), không trộn font.
- **Viết IN HOA** toàn bộ chữ tiêu đề (`Title`, tên màn) và chữ trong nút: `PLAY`, `CLAIM REWARD`, `NO THANKS`. Số và ký hiệu (`x2`) giữ nguyên. Chữ mô tả viết thường bình thường.
- **Stroke & contrast**: chữ sáng (trắng, vàng) bắt buộc có viền đậm tối màu (xanh thẫm, nâu đậm, đen) dày tối thiểu 5px (Notion 2–4, `ui.text` tự tính `max(5, size×0.08)`) và bóng nhẹ phía dưới (underlay, luật 12). Không dùng viền nhạt hơn hoặc cùng tông sáng với màu chữ.
- **Tỉ lệ cỡ chữ** so với Title của popup (Title = 100%, to nhất, viền dày nhất):
  - Chữ nút CTA: 90–95% (Title 64 → nút 58–61, mặc định `font.button` 60), đủ to để đọc lướt trong 0.5 giây.
  - Description/Subtitle: 60–70% (Title 64 → 38–45, mặc định `font.body` 40), màu tương phản cao với nền, **tối đa 2 dòng**.
- `ui.audit` báo lỗi khi có hơn 1 font, chữ sáng thiếu viền tối hoặc viền mỏng hơn 5px, Title hoặc chữ nút không in hoa, tỉ lệ cỡ chữ sai, Description quá 2 dòng.

## 17. Nút bấm: tỉ lệ chữ trên nút và khối 3D
- **Căn giữa** chữ cả ngang lẫn dọc so với mặt nút (`Face`, không tính phần đáy dày): `align='center'`, text rộng bằng nút, dùng `ui.centerY`. Có icon đi kèm (giá kèm icon gem) thì cả cụm icon + chữ căn giữa nút. `ui.audit` báo lỗi khi lệch quá 4px ngang / 6px dọc.
- **Occupancy**: chữ trong nút chiếm 60–75% chiều ngang và 50–60% chiều cao mặt nút (`Face`); khoảng trống trên/dưới chữ chỉ khoảng 0.5–0.75 chiều cao ký tự. Chỉnh bằng `await ui.fitButtons([btn, ...], fill)`: các nút truyền chung một lần thì bằng nhau (luật 7, xếp ngang), xếp dọc thì fit riêng, Primary `fill` 0.62 (to hơn), Secondary 0.74.
- **3 lớp bắt buộc cho Primary CTA** (xanh lá, hoặc vàng cam nổi trên nền xanh dương):
  1. Viền ngoài (Outer Stroke) vàng kim hoặc trắng tạo ranh giới: `ui.button(..., { rim: '#FFE45C' })` (hoặc `'#FFFFFF'`).
  2. Mặt nút gradient sáng dần về đỉnh (`Face`, top → base).
  3. Chân đế (Bevel) dày 11–22px (Notion 4–8), tối hơn thân nút (`Edge`), `ui.button` tự tính theo chiều cao.
- `ui.audit` đo chữ thật trong từng nút (trừ nút X và nút có icon kèm chữ) và báo lỗi khi ngoài khoảng occupancy.

## 18. Title Banner và nút đóng
- **Header Anchor**: Title Ribbon căn giữa trục dọc của Frame, đè lên mép trên Frame, phần nhô lên trên bằng 1/3–1/2 chiều cao ribbon, để phá sự thô cứng của hình chữ nhật.
- **Nút X**: đỏ (Negative, luật 2), luôn ở góc trên phải; tâm nút gióng thẳng mép ngoài cùng của Frame (hoặc mép ngoài Title Ribbon); cao 70–80% chiều cao ribbon. Hitbox tối thiểu `touch.min` 120×120 (Notion 44): nếu hình X nhỏ hơn thì báo dev Unity nới vùng chạm.
- Đặt cả hai bằng `ui.placeHeader(frame, ribbon, close)`. `ui.audit` báo lỗi khi ribbon lệch tâm, nhô sai tỉ lệ, X lệch mép hoặc sai kích thước.

## 19. Khung minh hoạ (Content Frame)
- Ảnh minh hoạ (icon quà, mất mạng, nhân vật) đặt trong rect/board riêng tên `Content Frame`, nền nhạt hơn Frame popup (`theme.surface` xanh pastel hoặc trắng kem `#FFF8E7`).
- Description (giải thích, lỗi, số thưởng) nằm ngay dưới Content Frame, rồi mới đến nút: mắt đi tự nhiên **Ảnh → Nội dung → Nút hành động**.
- `ui.audit` báo lỗi khi popup có ảnh minh hoạ mà không có Content Frame, ảnh nằm ngoài Content Frame, Content Frame không nhạt hơn Frame, hoặc sai thứ tự Ảnh → Chữ → Nút.

## Nền màn
Mặc định không dùng ảnh phong cảnh: gradient dọc cùng tông, quầng sáng giữa màn, vài bokeh trắng 6%, lưới chấm tròn so le trắng 9% (`ui.backgroundFX`). Nếu có ảnh nền thì ẩn đi, không xoá.
