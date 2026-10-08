# Wireframe — Tổ chức

## Bố cục chính — góc nhìn Org Admin (desktop ≥ 1024px)

```
+------------------------------------------------------------------------------+
| [TeamTasks]                                              [🔔 3]  [Avatar ▾]  |
+------------------------------------------------------------------------------+
| [← Quay lại Dashboard]                                                       |
+------------------------------------------------------------------------------+
|  ┌── Thông tin tổ chức ──────────────────────────────────────────────────┐   |
|  │                                                                       │   |
|  │   +--------+    Tên tổ chức *                                         │   |
|  │   |  LOGO  |    [ Acme                                    ]  4/100    │   |
|  │   |        |                                                          │   |
|  │   +--------+    Logo (đường dẫn ảnh)                                  │   |
|  │                 [ https://cdn.acme.vn/logo.png           ]            │   |
|  │                                                                       │   |
|  │   Định danh (slug)   acme            🔒 không đổi được                │   |
|  │   Ngày tạo           02/06/2026                                       │   |
|  │   Tổng thành viên    12                                               │   |
|  │                                                                       │   |
|  │                                        [ Huỷ ]  [ Lưu thay đổi ]      │   |
|  └───────────────────────────────────────────────────────────────────────┘   |
+------------------------------------------------------------------------------+
|  ┌── Thành viên (12) ────────────────────────────────────────────────────┐   |
|  │  [🔍 Tìm theo tên hoặc email    ]  [Vai trò ▾] [Trạng thái ▾]         │   |
|  │                                            [ + Mời thành viên ]       │   |
|  ├───────────────────────────────────────────────────────────────────────┤   |
|  │ Họ tên           Email             Vai trò      T.thái   Tham gia  ⋮  │   |
|  ├───────────────────────────────────────────────────────────────────────┤   |
|  │ (A) Nguyễn A     lead1@acme.vn     Quản lý     Hoạt động 02/06   [⋮] │   |
|  │ (B) Trần B       member2@acme.vn   Thành viên  Hoạt động 05/06   [⋮] │   |
|  │ (L) Lê C         le.c@acme.vn      Thành viên  Hoạt động 02/06   [⋮] │   |
|  │ (P) Phạm D       member3@acme.vn   Thành viên  Vô hiệu   08/06   [⋮] │   |
|  │ (Q) Quản Trị     admin@acme.vn     Quản trị    Hoạt động 02/06   [⋮] │   |
|  ├───────────────────────────────────────────────────────────────────────┤   |
|  │                       [ Tải thêm ]        Hiển thị 5 / 12             │   |
|  └───────────────────────────────────────────────────────────────────────┘   |
+------------------------------------------------------------------------------+
```

## Menu hành động mỗi dòng `[⋮]` — chỉ render với Org Admin

```
Với thành viên ĐANG HOẠT ĐỘNG:        Với thành viên ĐÃ VÔ HIỆU HOÁ:
+---------------------------+          +---------------------------+
| Đổi vai trò            ▸  |          | Kích hoạt lại             |
| Vô hiệu hoá tài khoản     |          +---------------------------+
+---------------------------+
```

## Góc nhìn Team Lead — cùng danh sách, KHÔNG có thao tác

```
|  ┌── Thành viên (12) ────────────────────────────────────────────────────┐   |
|  │  [🔍 Tìm theo tên hoặc email    ]  [Vai trò ▾] [Trạng thái ▾]         │   |
|  │                                     <- KHÔNG có nút "+ Mời thành viên"|   |
|  ├───────────────────────────────────────────────────────────────────────┤   |
|  │ Họ tên           Email             Vai trò      T.thái   Tham gia     │   |
|  │ (A) Nguyễn A     lead1@acme.vn     Quản lý     Hoạt động 02/06        │   |
|  │ ...                                            <- KHÔNG có cột [⋮]    │   |
|  └───────────────────────────────────────────────────────────────────────┘   |
```

## Modal "Mời thành viên"

```
+---------------------------------------------------+
|  Mời thành viên                              [×]  |
+---------------------------------------------------+
|  Email *                                          |
|  [ moi.nguoi@acme.vn                          ]   |
|                                                   |
|  Họ tên *                                         |
|  [ Người Mới                                  ]   |
|                                                   |
|  Vai trò *                                        |
|  ( ) Thành viên   ( ) Quản lý nhóm   ( ) Quản trị |
|                                                   |
|  Mật khẩu tạm *                                   |
|  [ ChangeMe@123                        ] [👁][⟳]  |
|  ▓▓▓▓▓▓▓▓▓▓░░░░  Mạnh                             |
|  ⓘ Bạn cần tự chuyển mật khẩu này cho người mới.  |
|    Hệ thống không gửi email.                      |
|                                                   |
|                 [ Huỷ bỏ ]   [ Tạo tài khoản ]    |
+---------------------------------------------------+
```

### Sau khi tạo thành công

```
+---------------------------------------------------+
|  ✅ Đã tạo tài khoản                         [×]  |
+---------------------------------------------------+
|  Người Mới · moi.nguoi@acme.vn                    |
|                                                   |
|  Mật khẩu tạm:                                    |
|  +---------------------------+                    |
|  |  ChangeMe@123             |  [ Sao chép ]      |
|  +---------------------------+                    |
|                                                   |
|  ⚠ Mật khẩu này sẽ KHÔNG hiển thị lại sau khi     |
|    bạn đóng hộp thoại. Hãy sao chép ngay.         |
|                                                   |
|                                    [ Đã hiểu ]    |
+---------------------------------------------------+
```

## Hộp xác nhận "Vô hiệu hoá tài khoản"

```
+---------------------------------------------------+
|  Vô hiệu hoá tài khoản của Lê C?             [×]  |
+---------------------------------------------------+
|  Sau khi vô hiệu hoá:                             |
|   · Lê C bị đăng xuất khỏi mọi thiết bị.          |
|   · Lê C không đăng nhập được nữa.                |
|   · 4 công việc đang giao cho Lê C vẫn giữ        |
|     nguyên người thực hiện — bạn cần giao lại     |
|     thủ công nếu muốn.                            |
|                                                   |
|  Tài khoản không bị xoá, có thể kích hoạt lại.    |
|                                                   |
|          [ Huỷ bỏ ]   [ Vô hiệu hoá ]             |
+---------------------------------------------------+
```

## Trạng thái bị chặn — Org Admin duy nhất

```
|  (Q) Quản Trị     admin@acme.vn     Quản trị    Hoạt động 02/06   [⋮] |
                                                                     |
                            +----------------------------------------+
                            | Đổi vai trò            ▸  (mờ, khoá)   |
                            | Vô hiệu hoá tài khoản     (mờ, khoá)   |
                            +----------------------------------------+
                            | ⓘ Đây là quản trị viên duy nhất đang   |
                            |   hoạt động. Hãy chỉ định một quản trị |
                            |   viên khác trước.                     |
                            +----------------------------------------+
```

## Trạng thái lọc rỗng

```
|  ┌───────────────────────────────────────────────────────────────────┐  |
|  │                        (  🔍  )                                   │  |
|  │              Không tìm thấy thành viên phù hợp                    │  |
|  │                     [ Xoá bộ lọc ]                                │  |
|  └───────────────────────────────────────────────────────────────────┘  |
```

## Bố cục hẹp (mobile < 768px)

Bảng chuyển thành **danh sách thẻ**, mỗi thành viên một thẻ:

```
+--------------------------------+
| [←] Tổ chức              [🔔3] |
+--------------------------------+
| Thông tin tổ chức              |
|   +------+                     |
|   | LOGO |                     |
|   +------+                     |
| Tên tổ chức *                  |
| [ Acme                     ]   |
| Logo (đường dẫn ảnh)           |
| [ https://...              ]   |
| Slug     acme              🔒  |
|          [ Lưu thay đổi ]      |
+--------------------------------+
| Thành viên (12)                |
| [🔍 Tìm...                 ]   |
| [Vai trò ▾] [Trạng thái ▾]     |
| [ + Mời thành viên ]           |
+--------------------------------+
| (A) Nguyễn A              [⋮]  |
|     lead1@acme.vn              |
|     Quản lý · Hoạt động        |
|     Tham gia 02/06/2026        |
+--------------------------------+
| (P) Phạm D                [⋮]  |
|     member3@acme.vn            |
|     Thành viên · Vô hiệu       |
|     Tham gia 08/06/2026        |
+--------------------------------+
|        [ Tải thêm ]            |
+--------------------------------+
```

## Chú thích các thành phần

- **Hai khối tách biệt**: "Thông tin tổ chức" (F11 — Team Lead + Org Admin) và "Thành viên" (F13 — chỉ Org Admin thao tác). Ranh giới quyền nằm ở **cụm hành động**, không phải ở việc ẩn cả khối.
- **Slug 🔒**: hiển thị dạng dòng văn bản kèm khoá và giải thích — không phải ô nhập bị disable.
- **Nút "+ Mời thành viên"** và **cột `[⋮]`**: **không render** với Team Lead (không phải làm mờ) — cùng nguyên tắc với thanh hành động của S03.
- **Badge trạng thái**: Hoạt động · Vô hiệu · Khoá tạm · Khoá vĩnh viễn — luôn kèm chữ, không chỉ dựa vào màu.
- **Nút `⟳` trong ô Mật khẩu tạm**: sinh ngẫu nhiên một mật khẩu mạnh, tiện hơn để Admin tự nghĩ.
- **Hộp xác nhận vô hiệu hoá**: nêu **ba hệ quả cụ thể** kèm **số công việc đang gán** — người quản trị cần biết đủ trước khi bấm, không chỉ một câu "bạn có chắc không".
- **Màn xác nhận sau khi tạo**: hiện mật khẩu tạm **một lần duy nhất** kèm nút sao chép và cảnh báo sẽ không hiện lại — vì hệ thống không gửi email (`GĐ-02`).
- **Menu bị khoá với Org Admin duy nhất**: hai mục làm mờ **kèm câu giải thích ngay trong menu**, không để người dùng bấm rồi mới báo lỗi.
