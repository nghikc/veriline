# Brainstorm — Đăng nhập (Login)

## Mục đích màn hình
Người dùng đến màn này để xác thực danh tính và bắt đầu phiên làm việc. Đây là điểm vào duy nhất của toàn bộ ứng dụng — mọi URL chưa xác thực đều redirect về đây. Sau khi đăng nhập thành công, hệ thống chuyển người dùng đến Dashboard (hoặc URL gốc ban đầu nếu bị redirect).

## Thành phần & hành vi

- **Logo / tên ứng dụng** → hiển thị để người dùng nhận biết đúng ứng dụng; không có hành động.
- **Trường Email** → người dùng nhập địa chỉ email; validate định dạng email client-side khi blur; tự động trim khoảng trắng đầu/cuối.
- **Trường Mật khẩu** → nhập mật khẩu; ẩn bằng `***` mặc định; có icon mắt để toggle hiện/ẩn.
- **Nút "Đăng nhập"** → submit form; disable khi đang loading; hiện spinner trong nút khi chờ phản hồi API.
- **Thông báo lỗi inline** → xuất hiện bên dưới form khi xác thực thất bại; wording khác nhau theo loại lỗi (sai MK, khoá tạm, khoá vĩnh viễn).
- **Bộ đếm lần thử** → hiển thị "Còn X lần thử" khi fail_count ≥ 1; ẩn khi fail_count = 0.
- **Đồng hồ đếm ngược** → hiển thị thời gian còn lại khi tài khoản bị khoá tạm; ẩn hoàn toàn khi không khoá.

## Trạng thái & edge case

- **Idle (rỗng):** Form trắng, nút Đăng nhập active, không có thông báo nào.
- **Loading:** Sau khi nhấn Submit — nút disabled + spinner; trường input disabled để tránh chỉnh sửa giữa chừng.
- **Lỗi — sai email/MK (lần 1–4):** Thông báo lỗi inline với số lần còn lại; trường Mật khẩu xoá nội dung để nhập lại; trường Email giữ nguyên.
- **Lỗi — tài khoản khoá tạm:** Thông báo khoá + đồng hồ đếm ngược; nút Đăng nhập disable cho đến hết thời gian khoá.
- **Lỗi — tài khoản khoá vĩnh viễn:** Thông báo tĩnh, không có đồng hồ; khuyến nghị liên hệ admin.
- **Lỗi — mất mạng:** Snackbar "Lỗi kết nối. Vui lòng thử lại."; dữ liệu form giữ nguyên; nút Đăng nhập được enable lại.
- **Success:** Redirect ngầm về Dashboard (hoặc URL gốc); không có toast.
- **Session còn hiệu lực:** Nếu người dùng mở /login khi đã có session hợp lệ → redirect thẳng về Dashboard (không hiển thị form đăng nhập).

## Câu hỏi mở
- Có cần hiển thị tên/logo của tổ chức cụ thể trên trang Login không (multi-tenant branding)?
- Có cần link "Quên mật khẩu" hiển thị (dù chức năng chưa có) để tránh nhầm lẫn UX không?
