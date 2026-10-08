# Brainstorm — Đăng ký (Register)

## Mục đích màn hình
Người dùng mới — chưa có tài khoản — đến màn này để tự tạo tài khoản bằng email/mật khẩu và đồng thời khởi tạo một tổ chức mới. Sau khi đăng ký thành công, hệ thống tự động đăng nhập và đưa người dùng thẳng vào Dashboard với vai trò Org Admin của tổ chức vừa tạo. Đây là điểm khởi đầu của toàn bộ vòng đời sử dụng sản phẩm.

## Thành phần & hành vi

- **Logo / tên ứng dụng** → hiển thị để người dùng nhận biết đúng ứng dụng; không có hành động.
- **Trường Email** → người dùng nhập địa chỉ email dùng để đăng nhập; validate định dạng RFC 5321 client-side khi blur; trim khoảng trắng đầu/cuối; sau khi gọi API nếu email đã tồn tại hiển thị lỗi inline.
- **Trường Mật khẩu** → nhập mật khẩu bảo mật; ẩn ký tự mặc định; icon mắt toggle hiện/ẩn; thanh đo độ mạnh cập nhật theo từng ký tự gõ (Yếu / Trung bình / Mạnh).
- **Thanh đo độ mạnh mật khẩu** → hiển thị phản hồi trực quan giúp người dùng tạo mật khẩu đủ mạnh; cập nhật ngay khi nhập; ẩn khi trường trống.
- **Trường Xác nhận mật khẩu** → nhập lại mật khẩu để xác nhận; kiểm tra khớp khi blur; không hiển thị thanh độ mạnh.
- **Trường Tên tổ chức** → nhập tên tổ chức mới sẽ được tạo; bắt buộc; tối đa 100 ký tự; đây là tên hiển thị trong hệ thống sau khi đăng ký.
- **Nút "Tạo tài khoản"** → submit form; disable khi đang loading; hiện spinner trong nút khi chờ API phản hồi.
- **Link "Đăng nhập"** → điều hướng về màn Đăng nhập (S01) cho người dùng đã có tài khoản.
- **Thông báo lỗi inline theo trường** → xuất hiện ngay dưới trường tương ứng khi validate thất bại; giúp người dùng sửa từng trường một thay vì thấy lỗi chung chung.

## Trạng thái & edge case

- **Idle (rỗng):** Tất cả trường trống, thanh độ mạnh ẩn, nút "Tạo tài khoản" active, không có thông báo lỗi.
- **Nhập dần:** Thanh độ mạnh xuất hiện và thay đổi theo thời gian thực khi gõ vào trường Mật khẩu; lỗi inline chỉ xuất hiện sau khi blur.
- **Loading:** Sau khi nhấn Submit — nút disabled + spinner; tất cả trường input disabled để tránh chỉnh sửa giữa chừng; gọi POST /auth/register.
- **Lỗi — email đã tồn tại:** Thông báo lỗi inline ngay dưới trường Email "Email đã được sử dụng. Vui lòng dùng địa chỉ khác hoặc đăng nhập."; các trường khác giữ nguyên; trường Email được focus.
- **Lỗi — mật khẩu quá yếu:** Lỗi inline dưới trường Mật khẩu; thanh độ mạnh hiển thị màu đỏ/cam; nút Tạo tài khoản không enable cho đến khi mật khẩu đạt mức "Trung bình" trở lên.
- **Lỗi — mật khẩu không khớp:** Lỗi inline dưới trường Xác nhận mật khẩu khi blur; nút Tạo tài khoản disable.
- **Lỗi — tên tổ chức trống:** Lỗi inline dưới trường Tên tổ chức.
- **Lỗi — mất mạng:** Snackbar "Lỗi kết nối. Vui lòng thử lại."; dữ liệu form giữ nguyên; nút được enable lại.
- **Success:** Hệ thống tạo tổ chức, đặt người dùng là Org Admin, auto-login, redirect về Dashboard mà không hỏi thêm.
- **Truy cập /register khi đã đăng nhập:** Redirect thẳng về Dashboard (không hiển thị form đăng ký).

## Câu hỏi mở
- Có cần xác nhận email (email verification) sau khi đăng ký không, hay auto-login ngay?
- Hệ thống có hỗ trợ đăng ký qua OAuth (Google/GitHub) trong tương lai không — nên để lại hook trong UI?
- Tên tổ chức có phải duy nhất trong hệ thống không, hay chỉ tự do điền?
- Có cần điều khoản sử dụng (Terms of Service) và checkbox chấp nhận trước khi đăng ký không?
- Slug/subdomain của tổ chức có tự động sinh từ tên tổ chức hay người dùng tự điền?
