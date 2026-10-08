# User story — Dashboard

## US-S02-01: Xem tổng quan công việc ngay khi đăng nhập
Là **thành viên nhóm (Member)**, tôi muốn **thấy thống kê và danh sách công việc của mình ngay khi vào Dashboard**, để **biết hôm nay cần làm gì mà không phải hỏi ai**.

- Trace: R-S02-01, R-S02-02, R-S02-05 / F03
- Story point: 5
- Tiêu chí chấp nhận (Given-When-Then):
  - GWT-1: **Given** tôi là Member có 8 việc liên quan (mình thực hiện hoặc mình giao): 3 TODO, 3 IN_PROGRESS (1 quá hạn), 2 DONE, **When** tôi vào /dashboard, **Then** 5 thẻ thống kê hiện đúng: Tổng=8, Cần làm=3, Đang làm=3, Hoàn thành=2, Quá hạn=1 và danh sách chỉ chứa việc tôi liên quan.
  - GWT-2: **Given** một việc có deadline hôm qua và trạng thái IN_PROGRESS, **When** danh sách hiển thị, **Then** deadline của dòng đó tô đỏ kèm ⚠ và được đếm vào thẻ Quá hạn.
  - GWT-3: **Given** tôi là Team Lead, **When** tôi vào /dashboard, **Then** tôi thấy công việc của toàn tổ chức chứ không chỉ của tôi.
- INVEST: [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S02-02: Lọc và tìm nhanh công việc
Là **thành viên nhóm**, tôi muốn **lọc theo trạng thái/ưu tiên và tìm theo tiêu đề**, để **tìm đúng việc cần xem trong danh sách dài**.

- Trace: R-S02-03, R-S02-04 / F03
- Story point: 3
- Tiêu chí chấp nhận (Given-When-Then):
  - GWT-1: **Given** danh sách có 24 việc thuộc nhiều trạng thái, **When** tôi chọn lọc "Đang làm", **Then** danh sách chỉ còn việc IN_PROGRESS, không reload trang.
  - GWT-2: **Given** tôi gõ "API" vào ô tìm kiếm, **When** ngừng gõ 300ms, **Then** danh sách chỉ còn việc có tiêu đề chứa "API" (không phân biệt hoa thường).
  - GWT-3: **Given** tôi click thẻ "Cần làm", **When** thẻ được chọn, **Then** danh sách lọc theo TODO và thẻ có viền nhấn; click lại thẻ thì bỏ lọc.
- INVEST: [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S02-03: Tạo và giao việc trong 3 bước
Là **Team Lead**, tôi muốn **tạo công việc mới với người thực hiện và deadline ngay từ Dashboard**, để **giao việc nhanh mà không rời màn hình chính** (NFR-05).

- Trace: R-S02-07 … R-S02-11 / F04
- Story point: 8
- Tiêu chí chấp nhận (Given-When-Then):
  - GWT-1: **Given** tôi là Team Lead, **When** tôi nhấn "+ Tạo công việc", điền "Viết tài liệu API" + chọn Lê C + deadline 20/06/2026 17:00, nhấn "Tạo công việc", **Then** modal đóng, toast "Đã tạo công việc" hiện và việc mới nằm đầu danh sách — đúng 3 bước.
  - GWT-2: **Given** modal đang mở, **When** tôi chọn deadline ở quá khứ, **Then** lỗi inline "Deadline không được ở quá khứ" hiện và nút Tạo disable.
  - GWT-3: **Given** tôi là Member, **When** tôi mở Dashboard, **Then** nút "+ Tạo công việc" không xuất hiện; gọi thẳng POST /tasks bị từ chối 403.
  - GWT-4: **Given** tôi đã điền đủ form, **When** mất mạng lúc nhấn Tạo, **Then** modal giữ nguyên dữ liệu và hiện "Lỗi kết nối — thử lại".
- INVEST: [x] Independent [x] Negotiable [x] Valuable [x] Estimable [ ] Small (8 điểm — chấp nhận vì là CTA chính) [x] Testable

## US-S02-04: Không bỏ lỡ thông báo công việc
Là **thành viên nhóm**, tôi muốn **thấy badge thông báo và đọc nhanh trong panel**, để **biết ngay khi được giao việc hoặc việc của tôi có thay đổi**.

- Trace: R-S02-12 … R-S02-16 / F08
- Story point: 5
- Tiêu chí chấp nhận (Given-When-Then):
  - GWT-1: **Given** tôi có 3 thông báo chưa đọc, **When** tôi mở Dashboard, **Then** chuông hiện badge "3"; **When** tôi có 120 thông báo chưa đọc, **Then** badge hiện "99+".
  - GWT-2: **Given** panel đang mở, **When** tôi click thông báo "Bạn được giao Viết tài liệu API", **Then** thông báo chuyển đã đọc, badge giảm 1 và tôi được điều hướng đến trang chi tiết của đúng việc đó.
  - GWT-3: **Given** tôi có 5 thông báo chưa đọc, **When** tôi nhấn "Đọc tất cả", **Then** badge ẩn và mọi dòng trong panel chuyển trạng thái đã đọc.
  - GWT-4: **Given** tab Dashboard đang mở và ai đó giao việc cho tôi, **When** tối đa 60 giây trôi qua, **Then** badge tự tăng mà tôi không cần reload.
- INVEST: [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable
