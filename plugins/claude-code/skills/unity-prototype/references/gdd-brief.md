# GDD brief template (gameplay-only, Vietnamese)

The user's original prompt for Snap Jam 3D, turned into a template. When the user pastes their own prompt, keep its
section structure and wording; use this template only to fill gaps or when they ask for one. The GDD is written in
Vietnamese. Every number in it must come from the tuning class in code (see `test-patterns.md`).

```markdown
Bạn là một Lead Game Designer chuyên về mảng Mobile Hybrid-Casual Puzzle, từng phát triển các sản phẩm đạt doanh thu
lớn hợp tác cùng các publisher hàng đầu như Voodoo, Rollic và SayGames.

Hãy viết một tài liệu Game Design Document (GDD) chuyên sâu, TẬP TRUNG 100% VÀO GAMEPLAY & MECHANICS (không bàn về
cốt truyện, monetization phức tạp hay marketing) cho tựa game có tên tạm gọi: "<Tên game>".

### THÔNG TIN CỐT LÕI CỦA TRÒ CHƠI:
1. Thể loại (Genre): <vd. Hybrid-Casual Puzzle / Layered Tray Sort>.
2. Nền tảng: Mobile (iOS / Android), màn hình <dọc 9:16>, camera <2.5D isometric cố định, nghiêng 45-60 độ>.
3. Core Interaction Hook: <thao tác chính + điều kiện kích hoạt + hệ thống phân loại/khay>.
4. Cảm giác game (Game Feel): <tactile ASMR, phản hồi đàn hồi, âm thanh, bảng màu>.

### YÊU CẦU CẤU TRÚC GDD:

#### 1. CORE LOOP & GAMEPLAY FLOW
- Sơ đồ vòng lặp (Input -> Physics/Logic Check -> Action -> Resolution -> Level Win/Lose).
- Thời lượng mục tiêu một màn (session length) và nhịp độ (pacing).

#### 2. CORE MECHANICS & LOGIC RULES (rất chi tiết)
- <Luật tương tác hợp lệ: điều kiện để một vật thể được chạm/kéo, xử lý khi chạm vật bị chặn>.
- <Các pha của thao tác chính: nghỉ -> thao tác -> cận ngưỡng -> kích hoạt; xử lý khi bỏ giữa chừng>.
- <Khay/hệ thống chứa: quy tắc vào khay, sắp xếp, điều kiện triệt tiêu>.
- <Thắng / thua và tâm lý "thua công bằng">.

#### 3. INPUT & PLAYER CONTROLS (UX)
- Định nghĩa Touch Down, Pointer Drag, Pointer Up.
- Hitbox / touch radius và input latency target.

#### 4. LEVEL PROGRESSION & MECHANICS ROLLOUT
- Màn 1-5 (onboarding): <cơ chế cơ bản, số màu, độ thoáng>.
- Màn 6-15: <chướng ngại mới>.
- Màn 16-30: <cơ chế nâng cao>.

#### 5. JUICINESS & MULTI-SENSORY FEEDBACK
- Bảng: Hành động | Visual VFX | Audio SFX (tần số) | Haptic, cho các hành động: <chạm vật bị chặn, cận ngưỡng,
  kích hoạt, match thành công, sắp thua>.

Trình bày dạng văn bản kỹ thuật, có bảng biểu và bullet để lập trình viên và level designer bắt tay vào làm ngay.
```

## What the delivered GDD added (keep these)
- `## 0. Pitch trong một câu` at the top, and a source note: every number comes from `<Game>Tuning` and the level
  data; `GddTuningConsistencyTests` checks them.
- Section 2 split into numbered sub-rules with exact predicates, e.g. "a band is top when no band with a higher layer
  that is still on the board shares a peg with it or crosses any of its edges".
- Section 4 with one rules table per mechanic and a level table, one row per level:
  `| Level | Bands | Items | Colors | Layers | Frozen slots |`. The consistency test matches these rows.
- `## Phụ lục A — Bảng hằng số <Game>Tuning`: one row `| \`Name\` | value |` per constant, in code order.
- `## Phụ lục B` for layout sizes and the color palette in hex, kept in sync by hand. The test does not cover it, so
  grep it after every theme change.
