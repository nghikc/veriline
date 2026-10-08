# User story — Hồ sơ cá nhân

## US-S04-01: Hồ sơ cá nhân - Xem thông tin tài khoản của tôi

Là **người dùng đã đăng nhập**, tôi muốn **xem hồ sơ của mình gồm email, vai trò và tổ chức**, để **biết chắc mình đang dùng đúng tài khoản và đang ở đúng tổ chức nào**.

- **Trace:** R-S04-01, R-S04-02, R-S04-05 / F10
- **Story point:** 2
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** tôi đã đăng nhập bằng `le.c@acme.vn`, **When** tôi mở màn Hồ sơ cá nhân, **Then** khối nhận diện hiển thị đủ 6 thông tin: ảnh đại diện, họ tên, email, vai trò, tổ chức, ngày tham gia — đúng giá trị từ `GET /users/me`.
  - GWT-2: **Given** tài khoản của tôi chưa có ảnh đại diện, **When** tôi mở màn hồ sơ, **Then** ô ảnh hiển thị chữ cái đầu họ tên viết hoa trên nền màu, và màu đó không đổi giữa các lần tải lại.
  - GWT-3: **Given** màn hồ sơ đang mở, **When** tôi nhìn ba trường Email, Vai trò, Tổ chức, **Then** cả ba ở chế độ chỉ đọc kèm biểu tượng khoá và một câu giải thích vì sao không sửa được.
  - GWT-4: **Given** đường dẫn ảnh đại diện của tôi trỏ tới một ảnh không tải được, **When** tôi mở màn hồ sơ, **Then** hệ thống hiển thị chữ cái đầu họ tên thay vì ô ảnh vỡ.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S04-02: Hồ sơ cá nhân - Cập nhật tên hiển thị và ảnh đại diện

Là **người dùng**, tôi muốn **sửa họ tên và ảnh đại diện của mình**, để **đồng nghiệp nhận ra tôi trên các công việc và bình luận**.

- **Trace:** R-S04-03, R-S04-04, R-S04-06, R-S04-07, R-S04-08 / F10
- **Story point:** 3
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** màn hồ sơ vừa tải xong và tôi chưa sửa gì, **When** tôi nhìn nút "Lưu thay đổi", **Then** nút ở trạng thái disable.
  - GWT-2: **Given** tôi đổi họ tên từ "Lê Văn C" thành "Lê C", **When** tôi nhấn "Lưu thay đổi", **Then** `PATCH /users/me` được gọi đúng một lần chỉ với trường `ho_ten`, khối nhận diện và tên trên header đổi theo, và toast "Đã cập nhật hồ sơ" hiện ra.
  - GWT-3: **Given** tôi đã sửa họ tên rồi gõ lại đúng như cũ, **When** tôi nhìn nút "Lưu thay đổi", **Then** nút disable trở lại và không có lời gọi API nào.
  - GWT-4: **Given** tôi xoá trắng trường Họ tên, **When** tôi rời khỏi ô nhập, **Then** lỗi "Vui lòng nhập họ tên" hiện ra và nút "Lưu thay đổi" disable.
  - GWT-5: **Given** tôi nhập đường dẫn ảnh bắt đầu bằng `http://`, **When** tôi rời khỏi ô nhập, **Then** lỗi "Đường dẫn ảnh phải bắt đầu bằng https://" hiện ra.
  - GWT-6: **Given** tôi đã sửa họ tên và mạng bị mất, **When** tôi nhấn "Lưu thay đổi", **Then** giá trị tôi đã nhập **còn nguyên** trong form kèm thông báo lỗi — không bị reset về giá trị cũ.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S04-03: Hồ sơ cá nhân - Tự đổi mật khẩu

Là **người dùng**, tôi muốn **tự đổi mật khẩu mà không cần nhờ quản trị viên**, để **giữ tài khoản an toàn khi tôi nghi ngờ mật khẩu bị lộ**.

- **Trace:** R-S04-10 … R-S04-14, R-S04-16, R-S04-17, R-S04-N02 / F10
- **Story point:** 5
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** màn hồ sơ đang mở, **When** tôi chỉ muốn sửa họ tên, **Then** tôi **không** phải nhập mật khẩu — hai form tách riêng với hai nút riêng.
  - GWT-2: **Given** tôi nhập mật khẩu hiện tại đúng, mật khẩu mới `Abcd1234!` và xác nhận khớp, **When** tôi nhấn "Đổi mật khẩu", **Then** API trả 200, toast "Đã đổi mật khẩu" hiện ra, cả ba trường bị xoá trắng và tôi **vẫn ở lại** màn hồ sơ.
  - GWT-3: **Given** tôi nhập sai mật khẩu hiện tại, **When** tôi nhấn "Đổi mật khẩu", **Then** lỗi "Mật khẩu hiện tại không đúng." hiện ngay dưới trường đó, còn hai trường mật khẩu mới **giữ nguyên giá trị đã nhập**.
  - GWT-4: **Given** tôi nhập mật khẩu mới giống hệt mật khẩu hiện tại, **When** tôi rời khỏi ô nhập, **Then** lỗi "Mật khẩu mới phải khác mật khẩu hiện tại" hiện ra và không có lời gọi API nào.
  - GWT-5: **Given** tôi nhập mật khẩu mới `Abcd1234!` và xác nhận `Abcd12345`, **When** tôi rời khỏi trường xác nhận, **Then** lỗi "Mật khẩu xác nhận không khớp." hiện ra và nút "Đổi mật khẩu" disable.
  - GWT-6: **Given** tôi đang gõ vào trường Mật khẩu mới, **When** tôi gõ ký tự đầu tiên, **Then** thanh đo độ mạnh xuất hiện và cập nhật theo từng ký tự với ba mức Yếu / Trung bình / Mạnh.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S04-04: Hồ sơ cá nhân - Đẩy thiết bị lạ ra khi đổi mật khẩu

Là **người dùng nghi ngờ tài khoản bị truy cập trái phép**, tôi muốn **việc đổi mật khẩu tự động đăng xuất mọi thiết bị khác**, để **người đang dùng trộm tài khoản mất quyền truy cập ngay lập tức**.

- **Trace:** R-S04-15 / F10; `BRule-S04-06`
- **Story point:** 3
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** tôi đang đăng nhập trên hai trình duyệt A và B, **When** tôi đổi mật khẩu thành công ở A, **Then** ở B lời gọi API kế tiếp trả `401` và B bị chuyển về `/login`.
  - GWT-2: **Given** tình huống trên, **When** tôi đổi mật khẩu ở A, **Then** phiên ở A **không** bị thu hồi — tôi vẫn ở lại màn hồ sơ, không bị đá ra đăng nhập lại.
  - GWT-3: **Given** tôi chỉ đăng nhập trên đúng một thiết bị, **When** tôi đổi mật khẩu, **Then** thao tác vẫn thành công bình thường, không lỗi vì "không có phiên nào để thu hồi".
  - GWT-4: **Given** màn hồ sơ đang mở, **When** tôi nhìn form Đổi mật khẩu, **Then** dòng cảnh báo "Đổi mật khẩu sẽ đăng xuất bạn khỏi mọi thiết bị khác." hiển thị ngay trên nút bấm, trước khi tôi thao tác.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S04-05: Hồ sơ cá nhân - Không mất thay đổi khi lỡ rời trang

Là **người dùng đang sửa hồ sơ**, tôi muốn **được cảnh báo khi rời trang lúc chưa lưu**, để **không mất công gõ lại**.

- **Trace:** R-S04-09 / F10
- **Story point:** 2
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** tôi đã sửa họ tên nhưng chưa nhấn Lưu, **When** tôi nhấn "← Quay lại Dashboard", **Then** hộp "Bạn có thay đổi chưa lưu" hiện ra và điều hướng bị chặn lại.
  - GWT-2: **Given** hộp cảnh báo đang mở, **When** tôi chọn "Ở lại", **Then** hộp đóng và mọi giá trị tôi đã nhập còn nguyên.
  - GWT-3: **Given** tôi chưa sửa gì cả, **When** tôi nhấn "← Quay lại Dashboard", **Then** điều hướng đi thẳng, **không** hiện hộp cảnh báo.
  - GWT-4: **Given** tôi mới gõ dở vào form Đổi mật khẩu (chưa nhấn nút), **When** tôi rời trang, **Then** **không** hiện cảnh báo — mật khẩu gõ dở không cần cứu.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## Tổng hợp

| Story | Trace R-S04 | Point | Use case liên quan |
|---|---|---|---|
| US-S04-01 Xem thông tin tài khoản của tôi | 01, 02, 05 | 2 | UC-S04-01 |
| US-S04-02 Cập nhật tên hiển thị và ảnh đại diện | 03, 04, 06, 07, 08 | 3 | UC-S04-02 |
| US-S04-03 Tự đổi mật khẩu | 10–14, 16, 17, N02 | 5 | UC-S04-03 |
| US-S04-04 Đẩy thiết bị lạ ra khi đổi mật khẩu | 15 | 3 | UC-S04-04 |
| US-S04-05 Không mất thay đổi khi lỡ rời trang | 09 | 2 | UC-S04-05 |
| **Tổng** | | **15** | |

> Các yêu cầu phi chức năng `R-S04-N01`, `R-S04-N03`…`R-S04-N07` được kiểm qua test case chuyên biệt trong `test.md`, không tách story riêng.
