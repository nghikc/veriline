# User story — Chi tiết công việc

## US-S03-01: Chi tiết công việc - Xem đầy đủ thông tin và lịch sử

Là **thành viên trong tổ chức**, tôi muốn **mở một công việc và thấy đầy đủ thông tin cùng lịch sử thay đổi của nó**, để **biết chính xác việc đang ở đâu và ai đã làm gì với nó**.

- **Trace:** R-S03-01, R-S03-02, R-S03-03, R-S03-04, R-S03-17 / F05
- **Story point:** 5
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** một công việc có đủ tiêu đề, mô tả, người giao, người thực hiện, deadline, ưu tiên, **When** tôi mở `/tasks/:id`, **Then** cả 9 trường thông tin hiển thị đúng giá trị lấy từ `GET /tasks/:id`.
  - GWT-2: **Given** một công việc có deadline hôm qua và trạng thái Đang làm, **When** tôi mở màn chi tiết, **Then** deadline hiển thị màu đỏ kèm biểu tượng ⚠.
  - GWT-3: **Given** cùng công việc đó nhưng trạng thái Hoàn thành, **When** tôi mở màn chi tiết, **Then** deadline **không** tô đỏ và **không** có biểu tượng cảnh báo.
  - GWT-4: **Given** công việc đã qua 3 lần thay đổi, **When** tôi xem dòng thời gian lịch sử, **Then** 3 mục hiển thị theo thứ tự mới → cũ, mỗi mục ghi rõ người thay đổi, trường thay đổi, giá trị cũ → giá trị mới và thời điểm; mục dưới cùng là "Tạo công việc".
  - GWT-5: **Given** một `taskId` thuộc tổ chức khác, **When** tôi mở URL đó, **Then** tôi thấy trang "Không tìm thấy công việc" — giống hệt trường hợp id không tồn tại, và phản hồi API là `404` chứ không phải `403`.
  - GWT-6: **Given** công việc chưa có bình luận nào, **When** tôi mở màn chi tiết, **Then** khu bình luận hiện "Chưa có bình luận nào. Hãy là người đầu tiên trao đổi về công việc này."
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S03-02: Chi tiết công việc - Cập nhật tiến độ công việc của tôi

Là **người thực hiện công việc**, tôi muốn **tự đánh dấu việc mình bắt đầu làm và gửi duyệt khi xong**, để **quản lý biết tiến độ mà tôi không phải báo cáo thủ công qua chat**.

- **Trace:** R-S03-07, R-S03-08, R-S03-09, R-S03-15 / F06
- **Story point:** 3
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** tôi là người thực hiện một công việc trạng thái Cần làm, **When** tôi mở màn chi tiết, **Then** tôi thấy nút "Bắt đầu làm" và **không** thấy nút "Gửi duyệt".
  - GWT-2: **Given** tình huống trên, **When** tôi nhấn "Bắt đầu làm", **Then** badge chuyển sang "Đang làm", một dòng lịch sử mới xuất hiện ở đầu dòng thời gian trong ≤ 500ms, và thanh hành động đổi thành nút "Gửi duyệt".
  - GWT-3: **Given** công việc đang ở Đang làm và tôi là người thực hiện, **When** tôi nhấn "Gửi duyệt", **Then** badge chuyển "Chờ duyệt" và thanh hành động của tôi chỉ còn chữ "Đang chờ duyệt", không còn nút bấm nào.
  - GWT-4: **Given** tôi **không phải** người thực hiện công việc đó, **When** tôi mở màn chi tiết, **Then** nút "Bắt đầu làm" và "Gửi duyệt" không tồn tại trong DOM.
  - GWT-5: **Given** tôi có access token của người thực hiện và công việc đang ở Cần làm, **When** tôi gọi thẳng `PATCH /tasks/:id/status` với `DONE`, **Then** API trả `400` và trạng thái trong cơ sở dữ liệu không đổi.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S03-03: Chi tiết công việc - Duyệt hoặc từ chối việc đã gửi

Là **Team Lead**, tôi muốn **duyệt việc đạt yêu cầu hoặc trả lại kèm lý do rõ ràng**, để **chất lượng công việc được kiểm soát và người làm biết chính xác cần sửa gì**.

- **Trace:** R-S03-10, R-S03-11, R-S03-16 / F06
- **Story point:** 5
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** một công việc ở trạng thái Chờ duyệt và tôi là Team Lead, **When** tôi nhấn "Duyệt hoàn thành", **Then** badge chuyển "Hoàn thành", thanh hành động ẩn hẳn, và một dòng lịch sử mới được ghi.
  - GWT-2: **Given** cùng công việc đó, **When** tôi nhấn "Từ chối", **Then** modal mở ra với nút "Xác nhận từ chối" đang disable cho tới khi tôi nhập lý do.
  - GWT-3: **Given** modal từ chối đang mở, **When** tôi nhập lý do "Thiếu ví dụ cho mã lỗi 409" và xác nhận, **Then** badge về "Đang làm", có **một** dòng lịch sử mới **và** một bình luận mới chứa đúng lý do đó.
  - GWT-4: **Given** modal từ chối đang mở, **When** tôi chỉ nhập 3 dấu cách, **Then** nút "Xác nhận từ chối" vẫn disable và không có lời gọi API nào.
  - GWT-5: **Given** tôi là Member (không phải người duyệt) và công việc đang Chờ duyệt, **When** tôi mở màn chi tiết, **Then** tôi không thấy nút "Duyệt hoàn thành" lẫn "Từ chối"; gọi thẳng API trả `403`.
  - GWT-6: **Given** tôi vừa từ chối một công việc mà tôi không phải người thực hiện, **When** thao tác thành công, **Then** người thực hiện nhận đúng 1 thông báo `STATUS_CHANGED` còn tôi không nhận thông báo nào.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S03-04: Chi tiết công việc - Trao đổi qua bình luận

Là **thành viên trong tổ chức**, tôi muốn **bình luận ngay dưới công việc**, để **mọi trao đổi về việc đó nằm cùng một chỗ thay vì rải rác trên chat** (`BR-01`).

- **Trace:** R-S03-04, R-S03-05, R-S03-06, R-S03-N06 / F07
- **Story point:** 3
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** màn chi tiết đang mở, **When** tôi gõ "Đã xong phần endpoint chính." và nhấn "Gửi", **Then** bình luận xuất hiện ở **cuối** danh sách trong ≤ 300ms kèm tên tôi và thời điểm, ô nhập trống lại, bộ đếm số bình luận tăng 1.
  - GWT-2: **Given** ô nhập đang trống hoặc chỉ có khoảng trắng, **When** tôi nhìn nút "Gửi", **Then** nút ở trạng thái disable.
  - GWT-3: **Given** tôi dán một chuỗi 1001 ký tự vào ô bình luận, **When** tôi rời khỏi ô nhập, **Then** hiện lỗi "Bình luận tối đa 1000 ký tự", bộ đếm chuyển đỏ và nút "Gửi" disable.
  - GWT-4: **Given** tôi đã gõ xong một bình luận dài, **When** lời gọi API thất bại do mất mạng, **Then** nội dung tôi gõ **còn nguyên** trong ô nhập kèm thông báo lỗi và nút "Thử lại".
  - GWT-5: **Given** một bình luận do chính tôi viết đã gửi xong, **When** tôi tìm cách sửa hoặc xoá nó, **Then** không có nút sửa/xoá nào tồn tại trong giao diện.
  - GWT-6: **Given** công việc có 60 bình luận, **When** tôi mở màn chi tiết, **Then** 50 bình luận mới nhất hiển thị kèm nút "Xem bình luận cũ hơn".
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S03-05: Chi tiết công việc - Sửa thông tin việc đã giao

Là **Team Lead**, tôi muốn **sửa lại thông tin một công việc đã giao (deadline, người thực hiện, ưu tiên…)**, để **điều chỉnh khi kế hoạch thay đổi mà không phải huỷ đi tạo lại**.

- **Trace:** R-S03-14, R-S03-15 / F06
- **Story point:** 5
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** tôi là Team Lead đang xem một công việc, **When** tôi nhấn "Sửa thông tin", **Then** modal mở ra với 5 trường đã điền sẵn giá trị hiện tại.
  - GWT-2: **Given** modal đang mở, **When** tôi đổi deadline và mức ưu tiên rồi nhấn "Lưu", **Then** thông tin trên màn cập nhật ngay và có **đúng 2** dòng lịch sử mới (một cho mỗi trường đổi).
  - GWT-3: **Given** modal đang mở, **When** tôi nhấn "Lưu" mà không sửa gì, **Then** modal đóng, không có lời gọi API và không sinh dòng lịch sử nào.
  - GWT-4: **Given** modal đang mở, **When** tôi xoá trắng tiêu đề, **Then** hiện lỗi "Vui lòng nhập tiêu đề" và nút "Lưu" disable.
  - GWT-5: **Given** tổ chức có một thành viên trạng thái INACTIVE, **When** tôi mở danh sách chọn người thực hiện, **Then** thành viên đó không xuất hiện.
  - GWT-6: **Given** tôi đổi người thực hiện từ Lê C sang Trần B, **When** lưu thành công, **Then** Trần B nhận thông báo `TASK_ASSIGNED` và Lê C nhận thông báo `STATUS_CHANGED`.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S03-06: Chi tiết công việc - Huỷ công việc không còn cần

Là **Team Lead**, tôi muốn **huỷ một công việc không còn cần làm nữa**, để **danh sách của nhóm không bị nhiễu bởi việc đã bỏ, mà vẫn giữ được dấu vết là nó từng tồn tại**.

- **Trace:** R-S03-12, R-S03-13, R-S03-16 / F06
- **Story point:** 2
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** một công việc ở trạng thái Cần làm, Đang làm hoặc Chờ duyệt và tôi là Team Lead, **When** tôi mở màn chi tiết, **Then** tôi thấy nút "Huỷ công việc".
  - GWT-2: **Given** tình huống trên, **When** tôi nhấn "Huỷ công việc", **Then** hộp xác nhận "Huỷ công việc này? Thao tác không hoàn tác được." hiện ra trước khi có bất kỳ lời gọi API nào.
  - GWT-3: **Given** hộp xác nhận đang mở, **When** tôi xác nhận, **Then** badge chuyển "Đã huỷ", banner "Công việc đã huỷ" hiện ra, thanh hành động ẩn hẳn, và ô nhập bình luận bị vô hiệu hoá.
  - GWT-4: **Given** hộp xác nhận đang mở, **When** tôi chọn "Không", **Then** không có lời gọi API nào và trạng thái giữ nguyên.
  - GWT-5: **Given** một công việc đã ở trạng thái Hoàn thành, **When** tôi mở màn chi tiết, **Then** nút "Huỷ công việc" không tồn tại; gọi thẳng API với `CANCELLED` trả `400`.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## Tổng hợp

| Story | Trace R-S03 | Point | Use case liên quan |
|---|---|---|---|
| US-S03-01 Xem đầy đủ thông tin và lịch sử | 01, 02, 03, 04, 17 | 5 | UC-S03-01 |
| US-S03-02 Cập nhật tiến độ công việc của tôi | 07, 08, 09, 15 | 3 | UC-S03-02 |
| US-S03-03 Duyệt hoặc từ chối việc đã gửi | 10, 11, 16 | 5 | UC-S03-03 |
| US-S03-04 Trao đổi qua bình luận | 04, 05, 06, N06 | 3 | UC-S03-04 |
| US-S03-05 Sửa thông tin việc đã giao | 14, 15 | 5 | UC-S03-05 |
| US-S03-06 Huỷ công việc không còn cần | 12, 13, 16 | 2 | UC-S03-06 |
| **Tổng** | | **23** | |

> Yêu cầu `R-S03-18` (quay lại Dashboard giữ bộ lọc, ưu tiên Could) chưa gắn story riêng — gộp vào công việc kỹ thuật khi triển khai `US-S03-01`. Các yêu cầu phi chức năng `R-S03-N01`…`R-S03-N05` được kiểm qua test case chuyên biệt trong `test.md`, không tách story.
