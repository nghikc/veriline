# Wireframe — Đăng ký (Register)

```
+----------------------------------------------------------+
|                                                          |
|                  [Logo TeamTasks]                        |
|               Quản lý công việc nhóm                    |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|   +--------------------------------------------------+   |
|           Tạo tài khoản mới                             |
|   +--------------------------------------------------+   |
|                                                          |
|   Email *                                                |
|   +--------------------------------------------------+   |
|   | nguyen.van.a@cty.vn                              |   |
|   +--------------------------------------------------+   |
|   ! Email đã được sử dụng. (chỉ hiển thị khi lỗi)      |
|                                                          |
|   Mật khẩu *                                             |
|   +--------------------------------------------------+   |
|   | ••••••••••••••••                        [👁 Ẩn] |   |
|   +--------------------------------------------------+   |
|   [==============----] Độ mạnh: Trung bình               |
|   ! Mật khẩu phải có ít nhất 8 ký tự. (khi lỗi)        |
|                                                          |
|   Xác nhận mật khẩu *                                   |
|   +--------------------------------------------------+   |
|   | ••••••••••••••••                        [👁 Ẩn] |   |
|   +--------------------------------------------------+   |
|   ! Mật khẩu xác nhận không khớp. (khi lỗi)            |
|                                                          |
|   Tên tổ chức *                                          |
|   +--------------------------------------------------+   |
|   | Công ty TNHH ABC                                 |   |
|   +--------------------------------------------------+   |
|   ! Tên tổ chức không được để trống. (khi lỗi)         |
|                                                          |
|   +--------------------------------------------------+   |
|   |            [  Tạo tài khoản  ]                  |   |
|   +--------------------------------------------------+   |
|     (disable + spinner khi đang gọi API)                 |
|                                                          |
|   Đã có tài khoản? [Đăng nhập]                          |
|                                                          |
+----------------------------------------------------------+
|  Phiên bản 1.0 · © 2026 TeamTasks                       |
+----------------------------------------------------------+
```

**Trạng thái mật khẩu quá yếu:**
```
   [====----------------] Độ mạnh: Yếu
   ! Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số.
```

**Trạng thái mật khẩu mạnh:**
```
   [====================] Độ mạnh: Mạnh ✓
```

**Trạng thái loading (sau khi nhấn "Tạo tài khoản"):**
```
   +--------------------------------------------------+
   |   ◌  Đang tạo tài khoản...                      |
   +--------------------------------------------------+
   (tất cả trường input bị disabled)
```

---

**Chú thích các thành phần:**

| Thành phần | Mục đích | Hành vi |
|------------|---------|---------|
| Logo + tiêu đề | Nhận diện thương hiệu | Tĩnh, không có liên kết |
| Trường Email | Nhập địa chỉ email để tạo tài khoản | Validate định dạng RFC 5321 khi blur; trim tự động; báo lỗi inline nếu đã tồn tại (sau khi gọi API) |
| Trường Mật khẩu | Nhập mật khẩu bảo mật | Ẩn mặc định; icon mắt để toggle hiện/ẩn; hiển thị thanh đo độ mạnh ngay khi nhập |
| Thanh đo độ mạnh mật khẩu | Phản hồi chất lượng mật khẩu theo thời gian thực | Hiển thị Yếu / Trung bình / Mạnh; màu sắc thay đổi tương ứng; xuất hiện ngay khi người dùng bắt đầu gõ |
| Trường Xác nhận mật khẩu | Đảm bảo người dùng nhập đúng mật khẩu | Ẩn mặc định; icon mắt toggle; kiểm tra khớp với trường Mật khẩu khi blur |
| Trường Tên tổ chức | Nhập tên tổ chức mới được tạo kèm theo | Bắt buộc; tối đa 100 ký tự; trim tự động |
| Thông báo lỗi inline | Phản hồi lỗi từng trường | Xuất hiện ngay dưới trường tương ứng; ẩn khi hợp lệ |
| Nút Tạo tài khoản | Gửi form đăng ký | Disable khi loading hoặc còn lỗi validation; hiện spinner trong nút khi loading |
| Link "Đã có tài khoản? Đăng nhập" | Điều hướng về màn Đăng nhập | Chuyển đến /login |
| Footer | Thông tin phiên bản | Tĩnh |
