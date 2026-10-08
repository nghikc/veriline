# Guideline UX — trục `UX` của `ac-auditor`

> Lấy cơ chế từ Web Interface Guidelines (Vercel) + web-quality-audit (Lighthouse best-practices), giữ lại **những gì soi được trên html-design/prototype/app của toolkit** và nối vào tài liệu BA sẵn có: `design-spec.md` §4 (trạng thái UI) · §6 (edge case) · §7 (animation) · `07-design-system.md` (token) · `conventions.md` → "Animation chuyển cảnh". Mỗi phát hiện trục UX ghi **tên guideline** ở cột Tiêu chí (vd `Touch target ≥ 44×44`), không cần số hiệu.

## Mức cho trục UX
| Mức | Khi nào |
|---|---|
| 🔴 | trạng thái bắt buộc **không tồn tại** trong khi `srs.md`/`design-spec.md` có (vd srs có `E-S01-03` "mất kết nối" mà HTML không có khối lỗi đó) · hành động phá huỷ (xoá, huỷ đơn) **không** xác nhận/hoàn tác dù BRule đòi · form mất dữ liệu khi rời trang mà không cảnh báo (design-spec §6 ghi) |
| 🟠 | touch target < 44×44 ở mobile · loading không có chỉ báo · empty state là khoảng trắng · lỗi không nêu cách sửa · layout nhảy (ảnh không kích thước, font swap không dự phòng) · thiếu `prefers-reduced-motion` khi có animation (conventions bắt buộc) · nhãn nút mơ hồ ("Tiếp tục" cho việc "Xoá tài khoản") |
| 🟡 | `transition: all` · `...` thay `…` · số không `tabular-nums` trong cột số · placeholder không có ví dụ mẫu · thiếu `autocomplete` · thiếu hover state |

## Danh sách kiểm (agent mở file/trang, đánh dấu từng mục ở "Đã kiểm, không lỗi" hoặc thành `AU-nn`)

### Trạng thái giao diện (đối chiếu design-spec §4 và statebar của html-design)
- **Bốn trạng thái** `Mặc định · Đang tải · Rỗng · Lỗi` — màn có trạng thái nào thì HTML **phải có khối** cho trạng thái đó; khối rỗng/loading không phải chỉ đổi chữ nút.
- **Đang tải**: skeleton/spinner **giữ đúng chỗ** nội dung sắp hiện (không nhảy layout); nút submit disable + spinner **trong lúc** request, không disable trước khi hợp lệ.
- **Rỗng**: có chữ giải thích + hành động kế tiếp ("Chưa có công việc nào — Tạo công việc"), không phải bảng trống.
- **Lỗi**: chữ lỗi khớp ma trận `E-S..` của `srs.md` (câu chữ, không chỉ mã), nằm cạnh field (inline), focus nhảy về lỗi đầu tiên khi submit.
- **Ca lỗi có `data-trace`** trong statebar phải có khối HTML tương ứng (check-shell soát nhãn, đây soát **nội dung**).

### Form
- Label bấm được (`for`/bọc); placeholder là **ví dụ** (`vd: ten@congty.vn`), không phải label.
- `type` đúng (`email`/`tel`/`number`/`url`) + `inputmode`; `autocomplete` cho field cá nhân; **không** chặn paste.
- Checkbox/radio: nhãn + ô là **một** vùng bấm.
- Rời trang khi form dở → cảnh báo (nếu design-spec §6 ghi); nút submit giữ enable tới khi gửi.

### Touch & mục tiêu bấm
- Mục tiêu bấm ≥ **44×44 CSS px** (icon-button 20px là 🟠); khoảng cách giữa hai mục tiêu ≥ 8px.
- `touch-action: manipulation` trên nút để bỏ delay double-tap (🟡).
- Modal/drawer có `overscroll-behavior: contain`.

### Không nhảy layout (CLS ở tầng tĩnh)
- `<img>` có `width`/`height` hoặc `aspect-ratio`; iframe/embed có chỗ giữ.
- Font web: `font-display: swap` + fallback cùng metric, hoặc `optional`.
- Nội dung chèn động (toast, banner) **không đẩy** nội dung đang đọc — đặt ngoài luồng (`position: fixed`) hoặc chèn dưới viewport.

### Animation (conventions → "Animation chuyển cảnh")
- Có `@media (prefers-reduced-motion: reduce)`; chỉ animate `transform`/`opacity`; **không** `transition: all`; duration theo token (`07-design-system.md`) hoặc mặc định 150–300ms.
- Section vào/ra (modal, toast, panel) có cả **in và out**; animation ngắt được bởi thao tác người dùng.

### Nhất quán
- Cùng hành động cùng nhãn ở mọi màn (đối chiếu `02-functions.md`/`03-overview.md`); màu/độ đậm của nút chính/phụ theo `07-design-system.md`.
- Menu chính giống nhau (đã có `check-shell.js` — không báo lại), breadcrumb ở màn cấp 2.

### Nội dung & copy
- Nút nói **việc** ("Lưu thay đổi", "Gửi lời mời"), không "OK"/"Tiếp tục" cho hành động có hậu quả.
- Lỗi nêu **cách sửa**, giọng thứ hai, chủ động; số đếm bằng chữ số ("8 công việc").
- Dấu ba chấm `…` (một ký tự) cho trạng thái đang làm: "Đang lưu…".
- Chuỗi dài: `text-overflow: ellipsis`/`line-clamp`/`overflow-wrap`; flex con có `min-width: 0`.

### Điều hướng & trạng thái
- Link là `<a href>` (Cmd/Ctrl+click mở tab mới) — không `onclick="location=…"`.
- Bộ lọc/tab/phân trang **nằm trong URL** (deep-link) — chỉ soát được ở tầng app.
- Hành động phá huỷ: xác nhận **hoặc** hoàn tác — đối chiếu BRule/`3.3.4`.

### Dark mode & i18n (chỉ khi dự án khai)
- `color-scheme` trên `<html>`; `<meta name="theme-color">` khớp nền; `<select>` có `background-color` + `color` rõ.
- Ngày/số qua `Intl.*` — chỉ soát được ở tầng app (đọc code khi có `--root`).

## Nguồn
- Web Interface Guidelines (Vercel) — https://github.com/vercel-labs/web-interface-guidelines
- web.dev — Core Web Vitals (LCP/INP/CLS) — https://web.dev/articles/vitals
- Lighthouse best-practices audits — https://developer.chrome.com/docs/lighthouse/best-practices/
