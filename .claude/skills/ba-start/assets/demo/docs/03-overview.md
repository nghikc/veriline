# Tổng quan màn hình — TeamTasks

## Danh sách màn hình

| Mã | Màn hình | Nhóm | Chức năng liên quan | Mô tả ngắn |
|----|----------|------|---------------------|------------|
| S01 | Đăng nhập | Authentication | F01, F02 | Form đăng nhập email/mật khẩu; xử lý throttle/lockout; redirect Dashboard sau xác thực thành công |
| S06 | Đăng ký | Authentication | F12 | Form đăng ký tài khoản mới + tên tổ chức; kiểm tra email chưa tồn tại, mật khẩu mạnh, xác nhận mật khẩu; tạo tổ chức và đăng nhập luôn sau khi thành công |
| S02 | Dashboard | — | F03, F04, F08 | Bảng điều khiển tổng quan: danh sách công việc nhóm theo trạng thái, thẻ thống kê nhanh, nút tạo công việc, badge thông báo |
| S03 | Chi tiết công việc | — | F05, F06, F07 | Trang xem đầy đủ thông tin công việc, cập nhật trạng thái, thêm comment, lịch sử thay đổi |
| S04 | Hồ sơ cá nhân | — | F10 | Trang xem/chỉnh sửa thông tin cá nhân: họ tên, ảnh đại diện, đổi mật khẩu |
| S05 | Tổ chức | — | F11, F13 | Trang quản lý thông tin tổ chức: tên, logo (F11); danh sách thành viên, mời/sửa vai trò/vô hiệu hoá thành viên (F13) |

## Sơ đồ điều hướng

```
[Bất kỳ URL nào khi chưa đăng nhập]
        |
        v (redirect)
[S01: Đăng nhập] <──[Đã có tài khoản?]── [S06: Đăng ký]
        |   └──[Chưa có tài khoản? Đăng ký]──> [S06: Đăng ký]
        |                                           |
        |                       (đăng ký thành công → tạo tổ chức)
        |<──────────────────────────────────────────┘
        v (đăng nhập thành công)
[S02: Dashboard] <─────────────────────────────────────────────────┐
        |                                                           |
        |── [Nhấn vào công việc] ──────────> [S03: Chi tiết CV]    |
        |                                           |               |
        |                                           v               |
        |                                    [Cập nhật trạng thái] |
        |                                    [Thêm comment]        |
        |                                    [← Quay lại] ─────────┘
        |
        |── [Avatar / Menu cá nhân] ──────> [S04: Hồ sơ cá nhân]
        |                                           |
        |                                           v
        |                                    [← Quay lại] ─────────┐
        |                                                           |
        |── [Menu: Tổ chức] ─────────────> [S05: Tổ chức]          |
        |           (Team Lead/Admin)               |               |
        |                                           v               |
        |                                    [← Quay lại] ──────────┘
        |
        └── [Đăng xuất] ────────────────> [S01: Đăng nhập]
```

**Ghi chú luồng:**
- Mọi URL khi chưa xác thực → redirect về S01.
- Sau đăng nhập thành công → redirect về URL gốc (nếu có), mặc định là S02.
- S04 và S05 chỉ truy cập qua menu header; không có deep link trực tiếp từ Dashboard.
- S05 hiển thị trong menu chỉ với vai trò Team Lead và Org Admin.

## Map chức năng ↔ màn hình

| Mã CN | Chức năng | Màn hình |
|-------|-----------|----------|
| F01 | Đăng nhập | S01 — Đăng nhập |
| F12 | Đăng ký tài khoản & tạo tổ chức | S06 — Đăng ký |
| F02 | Đăng xuất | S02 — Dashboard (nút Đăng xuất trong header/menu) |
| F03 | Xem dashboard tổng quan | S02 — Dashboard |
| F04 | Tạo công việc | S02 — Dashboard (modal/trang tạo mới từ nút CTA) |
| F05 | Xem chi tiết công việc | S03 — Chi tiết công việc |
| F06 | Cập nhật trạng thái công việc | S03 — Chi tiết công việc |
| F07 | Bình luận công việc | S03 — Chi tiết công việc |
| F08 | Thông báo in-app | S02 — Dashboard (badge + panel thông báo trong header) |
| F09 | Nhắc nhở deadline qua email | *(background — không có màn riêng; kết quả nhìn thấy qua email)* |
| F10 | Quản lý hồ sơ cá nhân | S04 — Hồ sơ cá nhân |
| F11 | Quản lý thông tin tổ chức | S05 — Tổ chức |
| F13 | Quản trị thành viên | S05 — Tổ chức (danh sách thành viên: mời/sửa vai trò/vô hiệu hoá) |

## Ma trận CRUD-to-Screen (thực thể × màn hình)

Kiểm chéo với "Ma trận CRUD" của `02-functions.md`: mọi thao tác C/R/U/D đều phải có **một màn** thực hiện được (trừ thao tác chạy nền).

| Thực thể | S01 Login | S02 Dashboard | S03 TaskDetail | S04 UserProfile | S05 Organization | S06 Register | Nền (không màn) |
|---|---|---|---|---|---|---|---|
| ToChuc | — | R | — | — | R U | **C** | — |
| NguoiDung | R U | R | R | R U | **C** R U **D** | **C** | — |
| CongViec | — | **C** R | R U | — | — | — | — |
| BinhLuan | — | — | **C** R | — | — | — | — |
| LichSuCongViec | — | — | R | — | — | — | **C** (sinh tự động) |
| ThongBao | — | R U | — | — | — | — | **C** (sự kiện + cron F09) |
| PhienDangNhap | **C** **D** | — | — | **D** | **D** | **C** | — |

**Soát đủ bộ List/Detail/Create/Edit cho thực thể quản lý chính:**

| Thực thể chính | List | Detail | Create | Edit | Ghi chú |
|---|---|---|---|---|---|
| CongViec | S02 (bảng) | S03 | S02 (modal) | S03 | Đủ bộ |
| NguoiDung | S05 (danh sách thành viên) | S04 (hồ sơ) | S05 (mời) · S06 (tự đăng ký) | S04 · S05 (đổi vai trò) | Đủ bộ |
| ToChuc | *(không cần — mỗi người dùng thuộc đúng 1 tổ chức)* | S05 | S06 | S05 | Không có màn List **có chủ đích**: dữ liệu cách ly theo tenant (`BR-03`), người dùng không bao giờ thấy tổ chức khác |

**Không có màn mồ côi:** cả 6 màn đều xuất hiện trong sơ đồ điều hướng ở trên và đều có ≥1 chức năng `F` trong bảng map bên dưới.

## Thuật ngữ
| Thuật ngữ | Giải thích |
|---|---|
| S (Screen) | Màn hình — một trang/khung giao diện người dùng thao tác |
| Sơ đồ điều hướng | Sơ đồ đường đi giữa các màn (ai vào màn nào từ đâu) |
| CRUD-to-Screen | Bảng thực thể × màn: thao tác dữ liệu nào làm được ở màn nào |
| Màn mồ côi | Màn không có đường vào trong sơ đồ điều hướng |
| Background (nền) | Chức năng chạy tự động, không có màn riêng (vd cron gửi email) |

> Từ điển đầy đủ toàn dự án: `docs/00-glossary.md`.
