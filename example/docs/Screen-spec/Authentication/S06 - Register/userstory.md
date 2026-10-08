# User story — Đăng ký (Mã màn: S06)

---

## US-S06-01: Tạo tài khoản mới và tổ chức bằng email/mật khẩu
Là **người dùng mới chưa có tài khoản**, tôi muốn **tự đăng ký bằng email và mật khẩu, đồng thời tạo tổ chức của mình**, để **bắt đầu sử dụng TeamTasks ngay mà không cần được mời**.

- **Trace:** R-S06-01, R-S06-06, R-S06-08 / F12
- **Story point:** 5
- **Tiêu chí chấp nhận (Given-When-Then):**
  - **GWT-1:** **Given** tôi chưa có tài khoản và truy cập /register, **When** tôi nhập email hợp lệ chưa tồn tại, mật khẩu đủ mạnh, xác nhận khớp, tên tổ chức hợp lệ rồi nhấn "Tạo tài khoản", **Then** hệ thống tạo tài khoản, tạo tổ chức, tự động đăng nhập và đưa tôi vào Dashboard trong vòng 3 giây với vai trò Org Admin.
  - **GWT-2:** **Given** form đang hiển thị, **When** tôi nhấn Tab liên tiếp từ trường Email, **Then** focus chuyển theo thứ tự Email → Mật khẩu → Xác nhận mật khẩu → Tên tổ chức → Nút Tạo tài khoản.
  - **GWT-3:** **Given** tôi vừa đăng ký thành công, **When** tôi vào Dashboard, **Then** tôi thấy tên tổ chức vừa tạo và vai trò của tôi là Org Admin.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## US-S06-02: Nhận phản hồi rõ khi email đã tồn tại
Là **người dùng mới**, tôi muốn **được thông báo ngay khi email của tôi đã có tài khoản**, để **biết nên đăng nhập thay vì đăng ký lần nữa**.

- **Trace:** R-S06-07, BRule-S06-01 / F12
- **Story point:** 2
- **Tiêu chí chấp nhận (Given-When-Then):**
  - **GWT-4:** **Given** email `an.nguyen@cty.vn` đã tồn tại trong hệ thống, **When** tôi điền email đó vào form và nhấn "Tạo tài khoản", **Then** hệ thống hiển thị lỗi inline ngay dưới trường Email "Email đã được sử dụng. Vui lòng dùng địa chỉ khác hoặc đăng nhập." và focus tự động về trường Email; không tạo tài khoản hay tổ chức mới.
  - **GWT-5:** **Given** lỗi email trùng đang hiển thị, **When** tôi thay đổi email sang địa chỉ mới chưa tồn tại và submit lại, **Then** lỗi inline biến mất và form tiếp tục xử lý bình thường.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## US-S06-03: Tạo mật khẩu đủ mạnh với phản hồi trực quan
Là **người dùng mới**, tôi muốn **thấy mức độ mạnh của mật khẩu ngay khi tôi gõ**, để **tạo được mật khẩu bảo mật mà không cần đọc hướng dẫn dài**.

- **Trace:** R-S06-03, R-S06-N02, BRule-S06-03 / F12
- **Story point:** 3
- **Tiêu chí chấp nhận (Given-When-Then):**
  - **GWT-6:** **Given** trường Mật khẩu đang trống, **When** tôi bắt đầu gõ ký tự đầu tiên, **Then** thanh đo độ mạnh xuất hiện ngay bên dưới trường và hiển thị mức "Yếu".
  - **GWT-7:** **Given** tôi nhập mật khẩu `abc12345` (8 ký tự, có chữ và số), **When** thanh cập nhật, **Then** thanh hiển thị mức "Trung bình" và nút Tạo tài khoản có thể nhấn.
  - **GWT-8:** **Given** tôi nhập mật khẩu `abc` (chỉ 3 chữ, không có số), **When** tôi blur khỏi trường, **Then** lỗi inline "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái và chữ số." xuất hiện và nút Tạo tài khoản bị disable.
  - **GWT-9:** **Given** mật khẩu đang "Yếu", **When** tôi thêm ký tự đạt ≥ 12 ký tự có chữ, số, và ký tự đặc biệt, **Then** thanh chuyển sang "Mạnh".
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## US-S06-04: Xác nhận mật khẩu khớp trước khi gửi
Là **người dùng mới**, tôi muốn **được cảnh báo ngay khi hai trường mật khẩu không khớp**, để **không mắc lỗi nhập nhầm và bị từ chối khi submit**.

- **Trace:** R-S06-04 / F12
- **Story point:** 2
- **Tiêu chí chấp nhận (Given-When-Then):**
  - **GWT-10:** **Given** tôi nhập Mật khẩu là `Abc123456` và Xác nhận mật khẩu là `Abc123457`, **When** tôi blur khỏi trường Xác nhận mật khẩu, **Then** lỗi inline "Mật khẩu xác nhận không khớp." xuất hiện dưới trường Xác nhận và nút Tạo tài khoản bị disable.
  - **GWT-11:** **Given** lỗi không khớp đang hiển thị, **When** tôi sửa trường Xác nhận để khớp với Mật khẩu gốc, **Then** lỗi inline biến mất và nút Tạo tài khoản được enable lại.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## US-S06-05: Điền tên tổ chức để tạo không gian làm việc
Là **người dùng mới**, tôi muốn **đặt tên tổ chức ngay khi đăng ký**, để **tổ chức của tôi được khởi tạo sẵn và tôi có thể mời thành viên ngay sau khi vào Dashboard**.

- **Trace:** R-S06-05, BRule-S06-02, BRule-S06-04 / F12
- **Story point:** 1
- **Tiêu chí chấp nhận (Given-When-Then):**
  - **GWT-12:** **Given** tôi để trống trường Tên tổ chức và nhấn "Tạo tài khoản", **Then** lỗi inline "Tên tổ chức không được để trống." xuất hiện dưới trường Tên tổ chức; không gọi API.
  - **GWT-13:** **Given** tôi nhập tên tổ chức hợp lệ và hoàn thiện các trường khác, **When** đăng ký thành công, **Then** tên tổ chức hiển thị đúng trên Dashboard và trong thông tin profile.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## US-S06-06: Điều hướng nhanh về màn Đăng nhập
Là **người dùng đã có tài khoản nhưng vô tình vào trang Đăng ký**, tôi muốn **thấy link rõ ràng để về màn Đăng nhập**, để **không phải gõ lại URL thủ công**.

- **Trace:** R-S06-01 / F12
- **Story point:** 1
- **Tiêu chí chấp nhận (Given-When-Then):**
  - **GWT-14:** **Given** tôi đang ở màn Đăng ký, **When** tôi nhấn link "Đã có tài khoản? Đăng nhập", **Then** trình duyệt chuyển về /login mà không mất dữ liệu đã nhập (hoặc form mới ở Login).
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## US-S06-07: Hiển thị/ẩn mật khẩu khi nhập
Là **người dùng mới**, tôi muốn **xem lại ký tự mật khẩu đã nhập trước khi gửi**, để **kiểm tra không bị nhập nhầm khi tạo mật khẩu mới**.

- **Trace:** R-S06-10 / F12
- **Story point:** 1
- **Tiêu chí chấp nhận (Given-When-Then):**
  - **GWT-15:** **Given** trường Mật khẩu đang ẩn (type=password), **When** tôi nhấn icon mắt trên trường đó, **Then** nội dung hiện rõ (type=text) và icon chuyển thành "Ẩn"; nhấn lại → quay về ẩn.
  - **GWT-16:** **Given** trường Xác nhận mật khẩu đang ẩn, **When** tôi nhấn icon mắt trên trường đó, **Then** nội dung trường Xác nhận hiện rõ (độc lập với trường Mật khẩu).
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable
