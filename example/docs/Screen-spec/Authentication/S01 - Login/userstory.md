# User story — Đăng nhập (Mã màn: S01)

---

## US-S01-01: Đăng nhập - Đăng nhập bằng email và mật khẩu
Là **thành viên tổ chức**, tôi muốn **đăng nhập bằng email và mật khẩu**, để **truy cập hệ thống và bắt đầu làm việc**.

- **Trace:** R-S01-01, R-S01-03, R-S01-04 / F01
- **Story point:** 3
- **Tiêu chí chấp nhận (Given-When-Then):**
  - **GWT-1:** **Given** tôi có tài khoản ACTIVE và chưa đăng nhập, **When** tôi nhập đúng email và mật khẩu rồi nhấn "Đăng nhập", **Then** hệ thống chuyển tôi về Dashboard trong vòng 2 giây mà không hiển thị thông báo lỗi.
  - **GWT-2:** **Given** tôi chưa đăng nhập, **When** tôi nhập email sai định dạng (vd: `abc@`) và nhấn hoặc blur khỏi trường, **Then** lỗi inline "Vui lòng nhập địa chỉ email hợp lệ." xuất hiện ngay mà không gọi API.
  - **GWT-3:** **Given** tôi đang điền form, **When** tôi nhấn Tab, **Then** focus chuyển theo thứ tự Email → Mật khẩu → Nút Đăng nhập.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## US-S01-02: Đăng nhập - Nhận phản hồi rõ khi đăng nhập thất bại
Là **thành viên tổ chức**, tôi muốn **thấy thông báo rõ ràng khi đăng nhập sai**, để **biết còn bao nhiêu lần thử và không bị khoá bất ngờ**.

- **Trace:** R-S01-05 / F01
- **Story point:** 2
- **Tiêu chí chấp nhận (Given-When-Then):**
  - **GWT-4:** **Given** tài khoản ACTIVE và fail_count = 2, **When** tôi nhập sai mật khẩu lần 3, **Then** hệ thống hiển thị "Sai email hoặc mật khẩu. Còn 2 lần thử." và xoá trường Mật khẩu, Email giữ nguyên.
  - **GWT-5:** **Given** tôi vừa nhập sai, **When** trường Mật khẩu được xoá, **Then** cursor focus tự động vào trường Mật khẩu để tôi nhập lại ngay.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## US-S01-03: Đăng nhập - Tài khoản bị khoá tạm sau nhiều lần sai
Là **chủ tài khoản**, tôi muốn **hệ thống tự động khoá tài khoản sau 5 lần nhập sai**, để **bảo vệ tổ chức khỏi tấn công brute force**.

- **Trace:** R-S01-06, BRule-S01-01 / F01
- **Story point:** 3
- **Tiêu chí chấp nhận (Given-When-Then):**
  - **GWT-6:** **Given** fail_count = 4 (lần sai thứ 4), **When** tôi nhập sai mật khẩu lần thứ 5, **Then** hệ thống hiển thị "Tài khoản đang bị khoá. Vui lòng thử lại sau 15 phút 00 giây." và đồng hồ đếm ngược; nút Đăng nhập bị disable.
  - **GWT-7:** **Given** tài khoản đang TEMP_LOCKED còn 5 phút, **When** tôi nhấn nút Đăng nhập (dù không thể — nút disabled), **Then** trạng thái không thay đổi và đồng hồ vẫn đếm.
  - **GWT-8:** **Given** đồng hồ đếm ngược về 0, **When** thời gian khoá hết, **Then** thông báo khoá biến mất, form reset (trường trống), nút Đăng nhập được enable lại.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## US-S01-04: Đăng nhập - Xử lý tài khoản khoá vĩnh viễn
Là **thành viên**, tôi muốn **thấy thông báo rõ khi tài khoản bị khoá vĩnh viễn**, để **biết mình cần liên hệ ai để được hỗ trợ**.

- **Trace:** R-S01-07, BRule-S01-03 / F01
- **Story point:** 1
- **Tiêu chí chấp nhận (Given-When-Then):**
  - **GWT-9:** **Given** tài khoản PERM_LOCKED, **When** tôi cố đăng nhập với bất kỳ email/mật khẩu nào, **Then** hệ thống hiển thị "Tài khoản của bạn bị khoá vĩnh viễn. Liên hệ quản trị viên để được hỗ trợ." và nút Đăng nhập bị disable vĩnh viễn.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## US-S01-05: Đăng nhập - Không hiển thị form login khi đã đăng nhập
Là **thành viên đã đăng nhập**, tôi muốn **không thấy form đăng nhập khi nhấn Back**, để **không bị nhầm lẫn và vào lại được ngay**.

- **Trace:** R-S01-08 / F01
- **Story point:** 1
- **Tiêu chí chấp nhận (Given-When-Then):**
  - **GWT-10:** **Given** tôi đã đăng nhập thành công và đang ở Dashboard, **When** tôi gõ trực tiếp URL /login hoặc nhấn Back về /login, **Then** hệ thống redirect ngay về Dashboard mà không render form Login.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## US-S01-06: Đăng nhập - Đăng xuất an toàn
Là **thành viên**, tôi muốn **đăng xuất và huỷ phiên hoàn toàn**, để **đảm bảo người khác không dùng máy tính của tôi để truy cập tài khoản**.

- **Trace:** R-S01-09 / F02
- **Story point:** 2
- **Tiêu chí chấp nhận (Given-When-Then):**
  - **GWT-11:** **Given** tôi đang đăng nhập, **When** tôi nhấn "Đăng xuất", **Then** hệ thống revoke session phía server, xoá token client, redirect về /login trong vòng 500ms.
  - **GWT-12:** **Given** tôi vừa đăng xuất, **When** tôi thử dùng access token cũ để gọi API, **Then** server trả về 401 Unauthorized.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## US-S01-07: Đăng nhập - Hiển thị/ẩn mật khẩu
Là **thành viên**, tôi muốn **chuyển đổi hiển thị/ẩn mật khẩu khi nhập**, để **kiểm tra lại trước khi gửi nếu nghi ngờ nhập sai**.

- **Trace:** R-S01-10 / F01
- **Story point:** 1
- **Tiêu chí chấp nhận (Given-When-Then):**
  - **GWT-13:** **Given** trường Mật khẩu đang ẩn (type=password), **When** tôi nhấn icon mắt, **Then** nội dung hiện rõ (type=text) và icon chuyển thành "Ẩn"; nhấn lại → quay về ẩn.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S01-08: Đăng nhập - Buộc đổi mật khẩu tạm *(CR-02)*
Là **người dùng được quản trị viên cấp mật khẩu tạm**, tôi muốn **được đưa thẳng tới màn đổi mật khẩu ngay sau khi đăng nhập**, để **không dùng tiếp mật khẩu người khác biết**.

- **Trace:** `R-S01-11` · `BRule-S01-07` · `E-S01-11` · `UC-S01-07`
- **Tiêu chí chấp nhận:**
  - **GWT-15:** **Given** tài khoản có cờ `phai_doi_mat_khau = true`, **When** tôi đăng nhập đúng email và mật khẩu tạm, **Then** hệ thống **không** vào Dashboard mà chuyển thẳng sang màn đổi mật khẩu `S04` kèm giải thích lý do.
  - **GWT-16:** **Given** tôi đang bị giữ ở trạng thái buộc đổi mật khẩu, **When** tôi gõ thẳng URL của một màn khác, **Then** hệ thống chặn và đưa lại màn đổi mật khẩu (`E-S01-11`).
  - **GWT-17:** **Given** tôi đang ở màn đổi mật khẩu, **When** mật khẩu mới không đạt luật hoặc trùng mật khẩu tạm, **Then** hệ thống báo lỗi và **giữ nguyên cờ** `phai_doi_mat_khau = true` (`UC-S01-07 [4a]`).
