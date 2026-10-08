# Hướng dẫn sử dụng BA Toolkit (kèm ví dụ)

Tài liệu này hướng dẫn **thực hành** bộ skill `ba-*` qua một ví dụ hoàn chỉnh: app **TeamTasks** (quản lý công việc nhóm). Toàn bộ tài liệu mẫu nằm trong `example/docs/` — vừa đọc hướng dẫn vừa mở file thật để đối chiếu.

> Tài liệu tham chiếu đầy đủ (bảng skill, mọi use case): xem `../README.md`.
> Quy ước (mã định danh, cấu trúc thư mục): xem `../.claude/skills/ba-toolkit/references/conventions.md`.

---

## 0. Mở ví dụ để xem trước
```
example/docs/
├── 00-brainstorm.md      ← phỏng vấn sâu (có Deep-dive khoá tài khoản)
├── 01-requirements.md    ← yêu cầu phân tầng BR/StR/FR/NFR/TR
├── 02-functions.md       ← 11 chức năng F01..F11 theo module
├── 03-overview.md        ← 5 màn hình + sơ đồ điều hướng
├── 00-tracking.md        ← ma trận: Login ✅ đủ, 4 màn khác ⬜
├── 04-stakeholders.md    ← RACI + Quyền lực/Quan tâm
├── 05-data-model.md      ← ERD Mermaid + từ điển dữ liệu
├── 06-api-spec.md        ← 21 endpoint, trace về F..
├── 07-design-system.md   ← token màu/typography/component… (reverse từ Login+Register)
├── Authentication/Login/    ← 1 màn ĐẶC TẢ ĐẦY ĐỦ (9 file) — đọc kỹ folder này
├── Authentication/Register/ ← màn thứ 2; design-spec có mục "Bản Figma (preview)" (4 state)
└── portal.html           ← mở bằng trình duyệt để xem tất cả ở 1 chỗ
```
👉 **Bắt đầu bằng cách mở `example/docs/Ho-so/portal.html`** trên trình duyệt — đây là cách stakeholder đọc tài liệu.

> Bản công khai không kèm các HTML **sinh ra** (portal, sitemap, onepager, gói phát hành — mỗi file vài MB). Dựng lại từ gốc repo:
> ```bash
> node .claude/skills/ba-portal/scripts/build.js example/docs example/docs/Ho-so/portal.html
> node .claude/skills/ba-sitemap/scripts/build.js example/docs example/docs/Ho-so/sitemap.html
> node .claude/skills/ba-portal/scripts/build.js --single example/docs/Ho-so/00-onepager.md example/docs/Ho-so/00-onepager.html
> node .claude/skills/ba-portal/scripts/build.js --single example/docs/Ho-so/releases/phase-1.md example/docs/Ho-so/releases/phase-1.html
> ```
👉 Muốn hiểu "1 màn hình trông thế nào khi làm xong" → mở 9 file trong `Authentication/Login/`.

---

## 1. Walkthrough: làm mới một dự án (như TeamTasks)

> Mẹo: chạy `/ba-init` để tự động cả chuỗi dưới đây trong 1 lệnh (có gate dò gap). Phần dưới giải thích từng bước để bạn hiểu mỗi bước sinh ra gì.

### Bước 0 — Phỏng vấn ý tưởng → `/ba-brainstorm`
Cấp ý tưởng thô, trả lời phỏng vấn 7 phần (từng câu một). Khi gặp tính năng phức tạp (vd đăng nhập có khoá tài khoản), skill tự bật **Deep-dive** vẽ ASCII flow/bảng state.
📄 Kết quả: `example/docs/00-brainstorm.md` — xem mục "4. Deep-dive" có sơ đồ trạng thái khoá tài khoản.

### Bước 1 — Yêu cầu → `/ba-requirements`
Đọc brainstorm, viết yêu cầu **phân tầng**: Business need → BR → StR → Solution (FR/NFR) → Transition, mỗi yêu cầu có ưu tiên MoSCoW.
📄 `example/docs/01-requirements.md`.

### Bước 2 — Chức năng → `/ba-functions`
Bóc yêu cầu thành chức năng `F01..`, nhóm theo module, trace về FR/BR.
📄 `example/docs/02-functions.md`.

### Bước 3 — Màn hình → `/ba-screens`
Suy ra danh sách màn, viết overview + sơ đồ điều hướng, **tạo khung folder** mỗi màn, khởi tạo ma trận tracking (mọi ô ⬜).
📄 `example/docs/03-overview.md` + `00-tracking.md`.

### Bước 4 — Đặc tả từng màn (lặp) — `/ba-screen-spec`, `/ba-test`, `/ba-html-design`
Với mỗi màn: `ba-screen-spec` sinh 6 file phân tích (ascii, brainstorm, srs, usecase, userstory, **design-spec**) → `ba-test` viết test case → *(tùy chọn)* `ba-figma-draw` dựng **preview Figma** từ design-spec (qua MCP Figma đang cài, lưu link node vào design-spec) → `ba-html-design` dựng HTML.
> Nếu đã chạy `/ba-design-system` (có `07-design-system.md`) thì `ba-figma-draw` & `ba-html-design` bám token trong đó — mọi màn cùng một bộ màu/typography.
📄 Xem trọn bộ ở `Authentication/Login/`:
- `srs.md` — yêu cầu chức năng `R-S01-..` + phi chức năng, kèm acceptance criteria.
- `usecase.md` — `UC-S01-..` có trigger/guarantees.
- `userstory.md` — `US-S01-..` viết **Given-When-Then** + INVEST.
- `design-spec.md` — **UI brief cho Designer**: UI States (Empty/Loading/Error/Locked...), CTA, microcopy.
- `html-design.html` — bản dựng tương tác (mở thử trên trình duyệt).
- `test.md` — `TC-S01-..` phân Positive/Negative/Edge, trace về `R-S`/`GWT`/`UC`.
> Nhiều màn: bảo Claude "dùng dispatching-parallel-agents chạy ba-screen-spec cho các màn X, Y, Z".

### Bước 5 — Kế hoạch build → `/ba-build`
Sinh `plan.md` trong mỗi folder màn (kế hoạch TDD theo từng chức năng). **Không tự chạy code.**
📄 `Authentication/S01 - Login/plan.md`.

### Bước 6 — Build
Tự chủ động: "Thực thi `example/docs/Screen-spec/Authentication/S01 - Login/plan.md`" → Claude dùng `executing-plans` (TDD, lấy test từ `test.md`).

### (Tùy chọn) Tài liệu cấp hệ thống
`/ba-stakeholder`, `/ba-data-model`, `/ba-api-spec`, `/ba-design-system` → `04/05/06/07-*.md`.
> Ví dụ `07-design-system.md` được sinh bằng **reverse**: gom token từ `html-design.html` của Login + Register, chuẩn hoá 6 chỗ lệch (nền, sắc đen, bề rộng card, cỡ brand, font, `100vh`).

### (Tùy chọn) Cổng đọc
`node .claude/skills/ba-portal/scripts/build.js example/docs example/docs/portal.html` → mở `portal.html`.

---

## 2. Đọc ma trận truy vết (quan trọng nhất)
Mở `example/docs/00-tracking.md`: **mỗi dòng = 1 màn hình**, cột = trạng thái từng tài liệu (✅/⬜/⚠️). Trong ví dụ, **Login ✅ hết**, 4 màn còn lại ⬜ — đây là trạng thái "đang làm" thật.

Chuỗi truy vết liền mạch (sửa 1 chỗ biết kiểm ở đâu):
```
BR → StR → FR/NFR → F01 → S01/Login → R-S01-.. → UC/US(GWT) → TC-S01-.. → plan
```

---

## 3. Các tình huống khác (tóm tắt — chi tiết ở README mục 5)
| Tình huống | Lệnh |
|---|---|
| Thêm 1 màn hình | `/ba-add-screen` |
| Thêm 1 chức năng (nhiều màn) | `/ba-add-feature` |
| Đổi 1 chức năng (change request) | `/ba-change-request` (tự sync + đánh ⚠️ tài liệu lệch) |
| Kiểm tra/dò gap | `/ba-review` → `00-gaps.md` (gap có mức 🔴/🟡/🟢) |
| Đồng bộ ma trận | `/ba-track refresh` |
| Dự án đã có code | `/ba-reverse` (sinh docs từ code, gắn 🔶 chỗ suy luận) |
| Lập design system / preview Figma | `/ba-design-system` → `07-design-system.md`; `/ba-figma-draw <màn>` → preview Figma |

**Nguyên tắc vàng:** sửa ở đâu, chạy `/ba-track` ở đó; kết thúc bằng `/ba-track refresh`.

---

## 4. Tự thử nhanh
Trong thư mục dự án, mở Claude Code và gõ:
```
/ba-brainstorm
```
rồi mô tả ý tưởng của bạn. Cứ theo gate và câu hỏi của skill — đối chiếu kết quả với `example/docs/` để biết "đúng" trông thế nào.
