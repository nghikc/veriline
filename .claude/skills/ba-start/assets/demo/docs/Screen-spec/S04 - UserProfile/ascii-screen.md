# Wireframe — Hồ sơ cá nhân

## Bố cục chính (desktop ≥ 1024px)

```
+----------------------------------------------------------------------+
| [TeamTasks]                                      [🔔 3]  [Avatar ▾]  |
+----------------------------------------------------------------------+
| [← Quay lại Dashboard]                                               |
+----------------------------------------------------------------------+
|                                                                      |
|   +--------+                                                         |
|   |        |   Lê Văn C                                              |
|   |  Ảnh   |   le.c@acme.vn                                          |
|   |  ĐD    |   [Thành viên]  ·  Tổ chức: Acme                        |
|   |        |   Tham gia: 02/06/2026                                  |
|   +--------+                                                         |
|                                                                      |
+----------------------------------------------------------------------+
|  ┌── Thông tin cá nhân ────────────────────────────────────────────┐ |
|  │                                                                 │ |
|  │  Họ tên *                                                       │ |
|  │  [ Lê Văn C                                          ]  8/100   │ |
|  │                                                                 │ |
|  │  Ảnh đại diện (đường dẫn ảnh)                                   │ |
|  │  [ https://cdn.acme.vn/avatar/le-c.png               ]          │ |
|  │  ⓘ Dán đường dẫn ảnh công khai (https). Bỏ trống để dùng chữ    │ |
|  │    cái đầu tên bạn.                                             │ |
|  │                                                                 │ |
|  │  Email          le.c@acme.vn          🔒 không đổi được         │ |
|  │  Vai trò        Thành viên            🔒 do quản trị viên đặt   │ |
|  │  Tổ chức        Acme                  🔒                        │ |
|  │                                                                 │ |
|  │                                     [ Huỷ ]  [ Lưu thay đổi ]   │ |
|  └─────────────────────────────────────────────────────────────────┘ |
|                                                                      |
|  ┌── Đổi mật khẩu ─────────────────────────────────────────────────┐ |
|  │                                                                 │ |
|  │  Mật khẩu hiện tại *                                            │ |
|  │  [ ••••••••••                                        ]  [👁]    │ |
|  │                                                                 │ |
|  │  Mật khẩu mới *                                                 │ |
|  │  [ ••••••••••                                        ]  [👁]    │ |
|  │  ▓▓▓▓▓▓▓▓░░░░░░  Trung bình                                     │ |
|  │  ⓘ Tối thiểu 8 ký tự, gồm ít nhất một chữ cái và một chữ số.    │ |
|  │                                                                 │ |
|  │  Xác nhận mật khẩu mới *                                        │ |
|  │  [ ••••••••••                                        ]  [👁]    │ |
|  │                                                                 │ |
|  │  ⚠ Đổi mật khẩu sẽ đăng xuất bạn khỏi mọi thiết bị khác.        │ |
|  │                                                                 │ |
|  │                                      [ Đổi mật khẩu ]           │ |
|  └─────────────────────────────────────────────────────────────────┘ |
+----------------------------------------------------------------------+
```

## Trạng thái lỗi — sai mật khẩu hiện tại

```
|  Mật khẩu hiện tại *                                            |
|  [ ••••••••••                                        ]  [👁]    |
|  🔴 Mật khẩu hiện tại không đúng.                               |
|                                                                 |
|  Mật khẩu mới *          <- giá trị đã nhập GIỮ NGUYÊN          |
|  [ ••••••••••                                        ]  [👁]    |
```

## Trạng thái chưa có ảnh đại diện

```
   +--------+
   |        |
   |   L    |   <- chữ cái đầu họ tên trên nền màu sinh từ tên
   |        |
   +--------+
```

## Cảnh báo rời màn khi chưa lưu

```
+---------------------------------------------+
|  Bạn có thay đổi chưa lưu               [×] |
+---------------------------------------------+
|  Rời khỏi trang này sẽ mất các thay đổi     |
|  chưa được lưu.                             |
|                                             |
|            [ Ở lại ]   [ Rời đi ]           |
+---------------------------------------------+
```

## Bố cục hẹp (mobile < 768px)

Hai form xếp dọc, khối nhận diện thu gọn nằm trên cùng:

```
+--------------------------------+
| [←] Hồ sơ cá nhân        [🔔3] |
+--------------------------------+
|      +--------+                |
|      |   L    |                |
|      +--------+                |
|      Lê Văn C                  |
|      le.c@acme.vn              |
|      [Thành viên] · Acme       |
+--------------------------------+
| Thông tin cá nhân              |
| Họ tên *                       |
| [ Lê Văn C                 ]   |
| Ảnh đại diện                   |
| [ https://...              ]   |
| Email  le.c@acme.vn        🔒  |
| Vai trò Thành viên         🔒  |
|          [ Lưu thay đổi ]      |
+--------------------------------+
| Đổi mật khẩu                   |
| Mật khẩu hiện tại *            |
| [ ••••••••         ]  [👁]     |
| Mật khẩu mới *                 |
| [ ••••••••         ]  [👁]     |
| ▓▓▓▓▓░░░░ Trung bình           |
| Xác nhận mật khẩu mới *        |
| [ ••••••••         ]  [👁]     |
| ⚠ Sẽ đăng xuất thiết bị khác.  |
|          [ Đổi mật khẩu ]      |
+--------------------------------+
```

## Chú thích các thành phần

- **Khối nhận diện**: chỉ đọc, không phải form — cho người dùng xác nhận "đúng là tài khoản của tôi" trước khi sửa gì.
- **Ảnh đại diện**: ô nhập **đường dẫn** (giai đoạn 1 không tải tệp lên — `GĐ-01`); bỏ trống thì hiển thị chữ cái đầu họ tên trên nền màu sinh từ chính tên đó.
- **Trường khoá 🔒**: email, vai trò, tổ chức hiển thị kèm biểu tượng khoá **và một câu giải thích ngắn** — không để người dùng đoán vì sao không sửa được.
- **Nút "Lưu thay đổi"**: disable cho tới khi có ít nhất một trường khác giá trị gốc; nút "Huỷ" khôi phục về giá trị gốc.
- **Hai form tách biệt**: mỗi form một nút riêng, một lời gọi API riêng — sửa họ tên không cần nhập mật khẩu.
- **Thanh đo độ mạnh mật khẩu**: cùng quy tắc và cùng 3 mức (Yếu / Trung bình / Mạnh) với màn S06 Đăng ký, để người dùng không phải học lại.
- **Toggle 👁**: chuyển giữa che và hiện nội dung từng trường mật khẩu, độc lập nhau.
- **Cảnh báo thu hồi phiên**: đặt **ngay trên nút** "Đổi mật khẩu", không giấu ở chân trang — đây là hệ quả người dùng cần biết trước khi bấm.
