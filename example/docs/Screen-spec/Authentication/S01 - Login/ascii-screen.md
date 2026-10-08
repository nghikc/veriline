# Wireframe — Đăng nhập (Login)

```
+----------------------------------------------------------+
|                                                          |
|                  [Logo TeamTasks]                        |
|               Quản lý công việc nhóm                    |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|   +--------------------------------------------------+   |
|   |           Đăng nhập vào tài khoản               |   |
|   +--------------------------------------------------+   |
|                                                          |
|   Email *                                                |
|   +--------------------------------------------------+   |
|   | nguyen.van.a@cty.vn                              |   |
|   +--------------------------------------------------+   |
|                                                          |
|   Mật khẩu *                                             |
|   +--------------------------------------------------+   |
|   | ••••••••••••••••                        [👁 Ẩn] |   |
|   +--------------------------------------------------+   |
|                                                          |
|   ! Sai email hoặc mật khẩu. Còn 3 lần thử.            |
|     (chỉ hiển thị khi có lỗi)                           |
|                                                          |
|   +--------------------------------------------------+   |
|   |              [  Đăng nhập  ]                    |   |
|   +--------------------------------------------------+   |
|     (disable + spinner khi đang gọi API)                 |
|                                                          |
+----------------------------------------------------------+
|  Phiên bản 1.0 · © 2026 TeamTasks                       |
+----------------------------------------------------------+
```

**Trạng thái khoá tài khoản tạm (thay thế thông báo lỗi thông thường):**
```
   ⚠️  Tài khoản đang bị khoá. Vui lòng thử lại sau 12 phút 34 giây.
       [===========           ] đếm ngược
```

**Trạng thái khoá vĩnh viễn:**
```
   🔒  Tài khoản của bạn bị khoá vĩnh viễn.
       Liên hệ quản trị viên để được hỗ trợ.
```

---

**Chú thích các thành phần:**

| Thành phần | Mục đích | Hành vi |
|------------|---------|---------|
| Logo + tiêu đề | Nhận diện thương hiệu | Tĩnh, không có liên kết |
| Trường Email | Nhập địa chỉ đăng nhập | Validate định dạng email khi blur; trim tự động |
| Trường Mật khẩu | Nhập mật khẩu bảo mật | Ẩn mặc định; icon mắt để toggle hiện/ẩn; xoá nội dung khi có lỗi xác thực |
| Thông báo lỗi inline | Phản hồi lỗi xác thực | Xuất hiện dưới form; wording khác theo loại lỗi; ẩn ở trạng thái idle/success |
| Đồng hồ đếm ngược | Thông báo thời gian khoá còn lại | Chỉ hiện khi TEMP_LOCKED; đếm ngược theo giây; nút Đăng nhập disable |
| Nút Đăng nhập | Gửi form xác thực | Disable khi loading hoặc tài khoản đang khoá; hiện spinner trong nút khi loading |
| Footer | Thông tin phiên bản | Tĩnh |
