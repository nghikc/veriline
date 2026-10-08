# Danh sách chức năng — TeamTasks

> Mỗi chức năng decompose từ Solution Functional Requirement (FR) và trace ngược về Business Requirement (BR).
> Ưu tiên dùng MoSCoW (Must/Should/Could/Won't).

## Module: Xác thực (Authentication)

| Mã | Chức năng | Mô tả | Trace FR/BR | Ưu tiên | Nguồn | Trạng thái |
|----|-----------|-------|-------------|---------|-------|-----------|
| F01 | Đăng nhập | Người dùng nhập email + mật khẩu để xác thực; hệ thống cấp JWT session; khoá tài khoản sau 5 lần sai trong 15 phút | FR-01, BR-03 | Must | Tất cả vai trò | Đề xuất |
| F02 | Đăng xuất | Huỷ session hiện tại (revoke refresh token), xoá cookie, redirect về trang Login | FR-01, BR-03 | Must | Tất cả vai trò | Đề xuất |
| F12 | Đăng ký tài khoản & tạo tổ chức | Người dùng mới tự đăng ký bằng email + mật khẩu, tạo tổ chức mới và trở thành Org Admin; email phải chưa tồn tại trong hệ thống | FR-13, BR-01, BR-03 | Must | Khách (chưa đăng nhập) | Đề xuất |

## Module: Quản lý công việc (Task Management)

| Mã | Chức năng | Mô tả | Trace FR/BR | Ưu tiên | Nguồn | Trạng thái |
|----|-----------|-------|-------------|---------|-------|-----------|
| F03 | Xem dashboard tổng quan | Hiển thị danh sách công việc của người dùng nhóm theo trạng thái + thẻ thống kê nhanh (tổng, cần làm, đang làm, hoàn thành, quá hạn) | FR-03, BR-01, BR-04 | Must | Member, Team Lead | Đề xuất |
| F04 | Tạo công việc | Tạo công việc mới với tiêu đề, mô tả, người thực hiện, deadline và mức ưu tiên (Thấp/Trung bình/Cao/Khẩn cấp) | FR-04, FR-05, BR-01, BR-02 | Must | Team Lead, Org Admin | Đề xuất |
| F05 | Xem chi tiết công việc | Xem đầy đủ thông tin công việc, lịch sử thay đổi trạng thái và comment | FR-07, BR-01 | Must | Tất cả vai trò | Đề xuất |
| F06 | Cập nhật trạng thái công việc | Chuyển trạng thái công việc theo luồng: TODO → IN_PROGRESS → IN_REVIEW → DONE (hoặc CANCELLED); có luồng từ chối (IN_REVIEW → IN_PROGRESS) | FR-06, BR-01, BR-02 | Must | Member (làm), Team Lead (duyệt) | Đề xuất |
| F07 | Bình luận công việc | Thêm comment văn bản vào công việc; mọi thành viên trong tổ chức có thể đọc comment | FR-08, BR-01 | Should | Tất cả vai trò | Đề xuất |
| F14 | Xuất báo cáo tiến độ | *(CR-01)* Xuất thống kê + danh sách công việc theo bộ lọc đang xem trên Dashboard ra tệp PDF/Excel; phục vụ Team Lead tổng hợp cho ban lãnh đạo (`BR-04`) — hiển thị trên **S02 Dashboard** | FR-14, BR-04 | Should | Team Lead, Org Admin | CR-01 |

## Module: Thông báo (Notification)

| Mã | Chức năng | Mô tả | Trace FR/BR | Ưu tiên | Nguồn | Trạng thái |
|----|-----------|-------|-------------|---------|-------|-----------|
| F08 | Thông báo in-app | Gửi thông báo trong ứng dụng khi: được giao việc mới, trạng thái công việc thay đổi (thông báo comment đi kèm F07 ở Phase 2) | FR-09, BR-05 | Must | Tất cả vai trò | Đề xuất |
| F09 | Nhắc nhở deadline qua email | Cron job 08:00 hàng ngày gửi email nhắc công việc đến hạn trong ngày hoặc đã quá hạn chưa hoàn thành | FR-10, BR-05 | Should | Member, Team Lead | Đề xuất |

## Module: Hồ sơ & Tổ chức (Profile & Organization)

| Mã | Chức năng | Mô tả | Trace FR/BR | Ưu tiên | Nguồn | Trạng thái |
|----|-----------|-------|-------------|---------|-------|-----------|
| F10 | Quản lý hồ sơ cá nhân | Xem và cập nhật thông tin cá nhân: họ tên hiển thị, ảnh đại diện, đổi mật khẩu | FR-11, BR-03 | Should | Tất cả vai trò | Đề xuất |
| F11 | Quản lý thông tin tổ chức | Xem và cập nhật tên tổ chức, logo | FR-12, BR-03 | Should | Team Lead, Org Admin | Đề xuất |
| F13 | Quản trị thành viên | Mời thành viên vào tổ chức, sửa vai trò, vô hiệu hoá tài khoản thành viên | FR-02, BR-03 | Must | Org Admin | Đề xuất |

## Ma trận phân quyền (vai trò × chức năng)

> Ai được làm gì — bảng tổng cho dev cài guard và stakeholder duyệt; chi tiết từng màn ở BRule của srs. Ký hiệu: ✅ được dùng · ⛔ không · ❓ chưa chốt (chốt khi đặc tả màn). Vai trò theo `01-requirements.md`; "Khách" = chưa đăng nhập.

| Mã | Chức năng | Khách | Member | Team Lead | Org Admin | Nguồn/BRule |
|----|-----------|-------|--------|-----------|-----------|-------------|
| F01 | Đăng nhập | ✅ | — | — | — | FR-01 (đăng nhập để thành vai trò) |
| F02 | Đăng xuất | ⛔ | ✅ | ✅ | ✅ | FR-01 |
| F12 | Đăng ký & tạo tổ chức | ✅ | ⛔ | ⛔ | ⛔ | FR-13, BRule-S06-02 (đã đăng nhập → redirect) |
| F03 | Xem dashboard | ⛔ | ✅ | ✅ | ✅ | FR-03; phạm vi dữ liệu khác nhau theo BRule-S02-01 |
| F04 | Tạo công việc | ⛔ | ⛔ | ✅ | ✅ | BRule-S02-03 (Member không thấy nút, API trả 403) |
| F05 | Xem chi tiết công việc | ⛔ | ✅ | ✅ | ✅ | FR-07 — đã chốt tại S03: mở trong toàn tổ chức (`BRule-S03-10`) |
| F06 | Cập nhật trạng thái | ⛔ | ✅ (làm) | ✅ (duyệt) | ✅ (duyệt) | FR-06 — đã chốt tại S03 (2026-07-22): Org Admin duyệt như Team Lead (`BRule-S03-04`) |
| F07 | Bình luận công việc | ⛔ | ✅ | ✅ | ✅ | FR-08 |
| F08 | Thông báo in-app | ⛔ | ✅ | ✅ | ✅ | FR-09 |
| F09 | Email nhắc deadline | ⛔ | ✅ | ✅ | ❓ | FR-10 (nguồn ghi Member/Team Lead — Org Admin chốt sau) |
| F10 | Hồ sơ cá nhân | ⛔ | ✅ | ✅ | ✅ | FR-11 |
| F11 | Thông tin tổ chức | ⛔ | ⛔ | ✅ | ✅ | FR-12 — chi tiết chốt khi đặc tả S05 |
| F13 | Quản trị thành viên | ⛔ | ⛔ | ⛔ | ✅ | FR-02 — chi tiết chốt khi đặc tả S05 |
| F14 | Xuất báo cáo tiến độ | ⛔ | ⛔ | ✅ | ✅ | *(CR-01)* FR-14 — cùng ranh giới quyền F04 (chỉ vai trò điều phối); Member không thấy nút xuất |

## Ma trận CRUD (thực thể × chức năng)

Đối chiếu với `05-data-model.md`. **C** = tạo · **R** = đọc · **U** = sửa · **D** = xoá/vô hiệu hoá · **—** = không chạm.

| Thực thể | F01 Đăng nhập | F02 Đăng xuất | F12 Đăng ký | F03 Dashboard | F04 Tạo CV | F05 Chi tiết CV | F06 Cập nhật TT | F07 Bình luận | F08 TB in-app | F09 Email nhắc | F10 Hồ sơ | F11 Tổ chức | F13 Thành viên |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ToChuc | — | — | **C** | R | — | — | — | — | — | — | — | R U | R |
| NguoiDung | R U¹ | — | **C** | R | R² | R | — | R | R | R | R U | — | **C** R U **D**³ |
| CongViec | — | — | — | R | **C** | R | U | R | R | R | — | — | — |
| BinhLuan | — | — | — | — | — | R | — | **C** R | — | — | — | — | — |
| LichSuCongViec | — | — | — | — | **C**⁴ | R | **C** | — | — | — | — | — | — |
| ThongBao | — | — | — | R U⁵ | **C** | — | **C** | **C** | R U⁵ | **C** | — | — | — |
| PhienDangNhap | **C** | **D** | **C** | — | — | — | — | — | — | — | **D**⁶ | — | **D**⁷ |

¹ Cập nhật `fail_count`/`lock_expires`/`trang_thai` khi đăng nhập sai — xem `BRule-S01-01…03`.
² Đọc danh sách thành viên cùng tổ chức để chọn người thực hiện.
³ "Xoá" = **vô hiệu hoá** (`trang_thai = INACTIVE`), không xoá vật lý — giữ lịch sử công việc đã giao.
⁴ Bản ghi lịch sử đầu tiên khi công việc được tạo.
⁵ Đánh dấu đã đọc (`da_doc`).
⁶ Đổi mật khẩu → thu hồi các phiên khác.
⁷ Vô hiệu hoá tài khoản → thu hồi mọi phiên của người đó.

**Soát đủ bộ CRUD:**
- `CongViec` **không có D** — có chủ đích: công việc không xoá, chỉ chuyển `trang_thai = CANCELLED` (`BRule-S02-05`) để giữ truy vết.
- `BinhLuan` **không có U/D** — phạm vi giai đoạn 1: bình luận là bản ghi bất biến (`F07`); sửa/xoá bình luận là ứng viên `U-..` cho phase sau.
- `LichSuCongViec` **chỉ C/R** — đúng bản chất nhật ký, không được sửa hay xoá.
- `ToChuc` **không có D** — vòng đời xoá tổ chức nằm ngoài phạm vi giai đoạn 1.

## Thuật ngữ
| Thuật ngữ | Giải thích |
|---|---|
| F (Function) | Chức năng — một việc hệ thống làm được, gom từ một hoặc nhiều `FR` |
| Module | Nhóm chức năng cùng miền nghiệp vụ (Xác thực, Quản lý công việc…) |
| Ma trận phân quyền | Bảng vai trò × chức năng: ai được dùng chức năng nào |
| CRUD | Bốn thao tác dữ liệu cơ bản: Create/Read/Update/Delete |
| MoSCoW | Cách xếp ưu tiên: Must / Should / Could / Won't |
| Tenant | Một tổ chức trong hệ thống nhiều tổ chức; dữ liệu các tenant cách ly nhau |

> Từ điển đầy đủ toàn dự án: `docs/00-glossary.md`.
