# WCAG 2.1 AA — bảng tra cho `ac-auditor`

> Mục đích: mỗi phát hiện `AU-nn` trục WCAG phải trích **đúng một tiêu chí `x.y.z`** và gán **mức** theo bảng này — không phán "xấu/khó dùng" mà không có số hiệu. Cột "Ai kiểm" nói phần nào máy (`scan-html.js` / Lighthouse) đã đếm, phần nào agent phải **mở file/trang bằng mắt**. Bốn nguyên tắc POUR: **P**erceivable (thấy được) · **O**perable (thao tác được) · **U**nderstandable (hiểu được) · **R**obust (máy hỗ trợ đọc được). Mức A là tối thiểu, AA là mục tiêu của toolkit; AAA không bắt.

## Mức cho trục WCAG
| Mức | Khi nào | Ví dụ |
|---|---|---|
| 🔴 chặn bàn giao | người dùng khuyết tật **không hoàn thành được việc** của màn | input không nhãn · nút/link không tên · tương phản chữ < 3:1 · bẫy bàn phím · tắt zoom · thiếu `lang` · thao tác chỉ bằng chuột không có đường bàn phím · lỗi form không được nêu (3.3.1) |
| 🟠 sửa trước release | làm được nhưng **khó/dễ nhầm** | tương phản 3–4.5:1 chữ thường · thiếu focus-visible · heading nhảy bậc/không có h1 · `tabindex>0` · id trùng làm label trỏ nhầm · thông báo trạng thái không `aria-live` (4.1.3) · thiếu skip link ở trang dài (2.4.1) |
| 🟡 nên | chuẩn khuyên, ít cản | link "xem thêm" trong ngữ cảnh bảng vẫn hiểu được · alt hơi chung · thiếu `autocomplete` (1.3.5) · `title` trang chưa mô tả |

## Bảng tiêu chí (chỉ những cái gặp trong giao diện web nghiệp vụ)
| Tiêu chí | Tên | Kiểm gì | Ai kiểm |
|---|---|---|---|
| 1.1.1 | Nội dung phi văn bản | mọi `<img>` có `alt` mô tả; ảnh trang trí `alt=""`; icon trong nút có `aria-hidden` + nút có tên | máy: thiếu `alt` · agent: alt có **mô tả đúng** không ("image1" là thiếu) |
| 1.3.1 | Thông tin & quan hệ | heading đúng cấp; bảng có `<th>`; nhóm radio có `fieldset/legend`; danh sách là `<ul>/<ol>` | máy: heading nhảy bậc (⚠️) · agent: bảng/fieldset |
| 1.3.2 | Thứ tự có nghĩa | thứ tự DOM = thứ tự đọc (CSS `order`/`float` không đảo nghĩa) | agent |
| 1.3.5 | Nhận diện mục đích input | `autocomplete="email|username|current-password|tel|name"` trên field cá nhân | agent (🟡) |
| 1.4.1 | Không chỉ dùng màu | lỗi/trạng thái có icon hoặc chữ kèm màu; link trong đoạn có gạch chân hoặc tương phản 3:1 với chữ | agent |
| 1.4.3 | Tương phản tối thiểu | chữ thường ≥ 4.5:1; chữ lớn (≥ 24px hoặc ≥ 18.66px đậm) ≥ 3:1; placeholder cũng tính; disabled miễn | máy: rule có cả `color`+`background` · agent: nền **thừa kế** (chữ trên card trên nền app) — tự tính bằng `node -e` với `contrast()` của `scan-html.js` |
| 1.4.4 | Phóng to chữ | không `user-scalable=no`/`maximum-scale=1`; 200% không mất nội dung | máy: meta viewport · agent: đơn vị `px` cứng cho container |
| 1.4.10 | Reflow | 320px không cuộn ngang (trừ bảng/sơ đồ) | agent: xem media query, bảng có `overflow-x:auto` |
| 1.4.11 | Tương phản phi văn bản | viền input, icon, focus ring ≥ 3:1 với nền | agent |
| 1.4.12 | Khoảng cách chữ | không `height` cố định kẹp chữ | agent |
| 1.4.13 | Nội dung khi hover/focus | tooltip/dropdown đóng được bằng Esc, không che nội dung | agent |
| 2.1.1 | Bàn phím | mọi thao tác có đường bàn phím; `<div onclick>` phải có `role`+`tabindex`+phím | máy: `<div onclick>` (⚠️) · agent: xác nhận |
| 2.1.2 | Không bẫy bàn phím | modal: Tab quay vòng trong modal, Esc đóng, focus trả về nút mở | agent (🔴) |
| 2.4.1 | Bỏ qua khối | trang dài có skip link hoặc landmark (`<main>`, `<nav>`) | agent (🟠) |
| 2.4.2 | Tiêu đề trang | `<title>` mô tả (`<Tên app> — <Tên màn>`) | máy: thiếu · agent: nội dung |
| 2.4.3 | Thứ tự focus | không `tabindex>0`; thứ tự Tab theo bố cục thị giác | máy: `tabindex>0` · agent: đọc thứ tự DOM |
| 2.4.4 | Mục đích link | chữ link nói đích; "bấm vào đây"/"xem thêm" chỉ chấp nhận khi ngữ cảnh (cùng hàng bảng) đủ | máy: chữ chung chung (⚠️) · agent: phán theo ngữ cảnh |
| 2.4.6 | Heading & nhãn | heading/nhãn mô tả đúng nội dung | agent |
| 2.4.7 | Focus thấy được | `:focus-visible` có outline/box-shadow; không `outline:none` trần | máy: `outline:none` không thay thế · agent: màu ring ≥ 3:1 |
| 2.5.3 | Nhãn trong tên | `aria-label` chứa chữ nhìn thấy của nút (nút ghi "Lưu", aria-label không được là "Gửi") | agent |
| 2.5.5 | Kích thước mục tiêu (AAA — toolkit lấy làm UX) | ≥ 44×44 CSS px cho touch (xem `ux-guidelines.md`) | agent (trục UX) |
| 3.1.1 | Ngôn ngữ trang | `<html lang="vi">` | máy |
| 3.2.1 / 3.2.2 | Không đổi ngữ cảnh khi focus/nhập | focus vào field không tự submit; chọn dropdown không tự chuyển trang mà không báo | agent |
| 3.2.3 / 3.2.4 | Điều hướng & nhận diện nhất quán | menu cùng thứ tự mọi màn (`check-shell.js` đã soát); cùng chức năng cùng nhãn | agent: đối chiếu `03-overview.md` |
| 3.3.1 | Nhận diện lỗi | lỗi form nêu **bằng chữ**, gắn field (`aria-describedby`), `aria-invalid="true"` | agent (🔴 nếu lỗi chỉ đổi màu viền) |
| 3.3.2 | Nhãn hoặc hướng dẫn | mọi input có `<label>`/`aria-label`; placeholder **không** thay label | máy: thiếu nhãn · agent: placeholder-làm-label |
| 3.3.3 | Gợi ý sửa lỗi | lỗi nói cách sửa ("Email phải có @") — đối chiếu ma trận lỗi `E-S..` trong `srs.md` | agent |
| 3.3.4 | Ngăn lỗi (pháp lý/tài chính/dữ liệu) | hành động xoá/thanh toán có xác nhận hoặc hoàn tác | agent: đối chiếu BRule |
| 4.1.1 | Phân tích cú pháp | id không trùng; thẻ lồng hợp lệ (`<button>` không trong `<a>`) | máy: id trùng · agent: lồng |
| 4.1.2 | Tên, vai trò, giá trị | control tuỳ biến có `role` + tên + trạng thái (`aria-expanded`, `aria-selected`, `aria-checked`) | máy: button rỗng · agent: role/trạng thái |
| 4.1.3 | Thông báo trạng thái | toast/"đã lưu"/số kết quả lọc trong `aria-live="polite"` hoặc `role="status"`; lỗi khẩn `role="alert"` | agent |

## Cách gán mức khi máy và mắt khác nhau
- Máy nói ❌ mà agent mở file thấy **có** đường thay thế (vd `<div onclick>` là backdrop, hộp thoại có nút đóng) → không thành `AU-nn`, ghi ở "Máy nói gì" là *bỏ vì sao*.
- Máy im mà agent thấy lỗi (nền thừa kế, thứ tự đọc) → vẫn là `AU-nn`, vị trí `file:line` đã mở.
- Không mở được (URL cần đăng nhập, file thiếu) → "Ngoài phạm vi · không đo được", **không** đoán.

## Nguồn
- W3C WCAG 2.1 Quick Reference — https://www.w3.org/WAI/WCAG21/quickref/
- WAI-ARIA Authoring Practices (pattern modal/tabs/menu) — https://www.w3.org/WAI/ARIA/apg/
- Deque axe rules (ánh xạ id Lighthouse → tiêu chí) — https://dequeuniversity.com/rules/axe/
