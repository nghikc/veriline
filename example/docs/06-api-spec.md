# Đặc tả API — TeamTasks

> Quy ước: REST, JSON, HTTPS bắt buộc. Tên trường giữ tiếng Anh (snake_case). Mô tả tiếng Việt.
> Authentication: Bearer JWT (Authorization: Bearer <access_token>), trừ các endpoint công khai.

## 1. Bảng tổng endpoint

| Method | Path | Mô tả | Trace F.. | Auth |
|--------|------|-------|-----------|------|
| POST | /auth/register | Đăng ký tài khoản + tạo tổ chức mới | F12 | Không |
| POST | /auth/login | Đăng nhập, lấy token | F01 | Không |
| POST | /auth/logout | Đăng xuất, thu hồi refresh token | F02 | Có |
| POST | /auth/refresh | Gia hạn access token dùng refresh token | F01 | Không (cookie) |
| GET | /users/me | Lấy thông tin tài khoản hiện tại | F10 | Có |
| PATCH | /users/me | Cập nhật hồ sơ cá nhân | F10 | Có |
| PATCH | /users/me/password | Đổi mật khẩu | F10 | Có |
| GET | /tasks | Danh sách công việc (lọc/phân trang) | F03 | Có |
| POST | /reports/export | *(CR-01)* Xuất báo cáo tiến độ (PDF/Excel) theo bộ lọc | F14 | Team Lead+ |
| POST | /tasks | Tạo công việc mới | F04 | Có |
| GET | /tasks/:id | Chi tiết một công việc | F05 | Có |
| PATCH | /tasks/:id | Cập nhật thông tin công việc | F06 | Có |
| PATCH | /tasks/:id/status | Cập nhật trạng thái công việc | F06 | Có |
| GET | /tasks/:id/history | Lịch sử thay đổi công việc | F05 | Có |
| POST | /tasks/:id/comments | Thêm bình luận vào công việc | F07 | Có |
| GET | /tasks/:id/comments | Danh sách bình luận của công việc | F07 | Có |
| GET | /notifications | Danh sách thông báo của người dùng | F08 | Có |
| PATCH | /notifications/:id/read | Đánh dấu đã đọc một thông báo | F08 | Có |
| PATCH | /notifications/read-all | Đánh dấu đã đọc tất cả thông báo | F08 | Có |
| GET | /organizations/me | Thông tin tổ chức hiện tại | F11 | Có |
| PATCH | /organizations/me | Cập nhật thông tin tổ chức | F11 | Team Lead+ |
| GET | /organizations/me/members | Danh sách thành viên | F13 *(F04 dùng lại cho dropdown người thực hiện)* | Có |
| POST | /organizations/me/members | Mời thành viên mới | F13 | Org Admin |
| PATCH | /organizations/me/members/:userId | Cập nhật vai trò / vô hiệu hoá | F13 | Org Admin |

---

## 2. Chi tiết endpoint

### POST /auth/login — Đăng nhập (F01)
- **Mô tả:** Xác thực email + mật khẩu. Trả về access token (JWT) và set refresh token qua HttpOnly cookie. Xử lý throttle/lockout theo R-S01-06.
- **Request body:**
```json
{
  "email": "an.nguyen@cty.vn",
  "password": "MatKhau123"
}
```
- **Response 200 — thành công:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiJ9...",
  "expires_in": 28800,
  "user": {
    "id": "u_01J...",
    "email": "an.nguyen@cty.vn",
    "ho_ten": "Nguyễn Văn An",
    "vai_tro": "MEMBER",
    "to_chuc_id": "org_01J...",
    "anh_dai_dien_url": "https://cdn.example.com/avatars/u1.jpg"
  },
  "phai_doi_mat_khau": false
}
```
*(Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=2592000)*
- *(CR-02)* **`phai_doi_mat_khau`** (boolean): `true` khi tài khoản đăng nhập bằng mật khẩu tạm chưa đổi (`NguoiDung.phai_doi_mat_khau = true`). Client nhận `true` → buộc chuyển sang màn đổi mật khẩu, **chặn mọi màn khác** cho tới khi đổi xong (`R-S01-11`). Trace: `CR-02` · `BR-03`.
- **Mã trạng thái:**
  - `200` — Thành công
  - `400` — Thiếu trường hoặc sai định dạng (`{"error": "VALIDATION_ERROR", "fields": {...}}`)
  - `401` — Sai email/mật khẩu (`{"error": "INVALID_CREDENTIALS", "fail_count": 3, "remaining": 2}`)
  - `423` — Tài khoản khoá tạm (`{"error": "TEMP_LOCKED", "lock_expires": "2026-06-10T10:15:00Z"}`)
  - `403` — Tài khoản khoá vĩnh viễn (`{"error": "PERM_LOCKED"}`)
  - `429` — Rate limit IP vượt ngưỡng (`{"error": "RATE_LIMIT_EXCEEDED"}`)

---

### POST /auth/logout — Đăng xuất (F02)
- **Mô tả:** Thu hồi refresh token phía server. Yêu cầu Authorization header hoặc cookie hợp lệ.
- **Request:** Không có body. Refresh token đọc từ HttpOnly cookie.
- **Response 204:** Không có body (No Content).
- **Mã trạng thái:**
  - `204` — Đăng xuất thành công
  - `401` — Không có token hợp lệ (vẫn coi là thành công ở client)

---

### POST /auth/register — Đăng ký tài khoản & tạo tổ chức (F12)
- **Mô tả:** Người dùng mới tự đăng ký. Tạo **đồng thời** tài khoản và tổ chức trong một giao dịch — nửa vời (có tài khoản, không tổ chức) sẽ để lại người dùng không vào được đâu. Người tạo trở thành `Org Admin` của tổ chức đó (`BRule-S06-02`).
- **Request body:**
```json
{
  "email": "an.nguyen@cty.vn",
  "mat_khau": "Secure@2024",
  "ten_to_chuc": "Công ty ABC"
}
```
- **Response 201:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiJ9...",
  "nguoi_dung": { "id": "u-1", "email": "an.nguyen@cty.vn", "vai_tro": "ORG_ADMIN" },
  "to_chuc": { "id": "o-1", "ten": "Công ty ABC" }
}
```
*(Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=2592000)*
- **Mã trạng thái:** `201` · `400` dữ liệu không hợp lệ · `409` `EMAIL_ALREADY_EXISTS` (email đã đăng ký — `E-S06-05`) · `429` quá 10 request/phút cùng IP (`R-S06-N03`)
- **Trace:** `F12` / `FR-13` · `R-S06-06` · `BRule-S06-02`, `BRule-S06-04`, `BRule-S06-06`

---

### POST /auth/refresh — Gia hạn token (F01)
- **Mô tả:** Dùng refresh token trong cookie để cấp access token mới (silent refresh). *(CR-04)* Chỉ cấp khi **cả hai** còn thoả: `lan_dung_cuoi` cách hiện tại ≤ **7 ngày** và `het_han` chưa tới (trần **30 ngày**). Refresh thành công thì cập nhật `lan_dung_cuoi = now`.
- **Request:** Không có body. Refresh token từ cookie.
- **Response 200:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiJ9...",
  "expires_in": 28800
}
```
- **Mã trạng thái:** `200` · `401` refresh token hết hạn (quá 7 ngày không hoạt động **hoặc** chạm trần 30 ngày) hoặc đã thu hồi → client hiển thị `E-S01-12` và đưa về `/login`; server thu hồi luôn phiên đó

---

### POST /reports/export — Xuất báo cáo tiến độ (F14) *(CR-01)*
- **Mô tả:** Dựng báo cáo tiến độ (5 số thống kê + danh sách công việc) theo **bộ lọc gửi lên** và trả tệp PDF hoặc Excel. Chỉ Team Lead/Org Admin (`R-S02-17`, `R-S02-N07`). Phạm vi dữ liệu theo vai trò như `GET /tasks` (`BRule-S02-01`, `BRule-S02-08`).
- **Request body:**
```json
{
  "dinh_dang": "pdf",
  "loc": { "status": "IN_PROGRESS", "priority": null, "q": "" }
}
```
  - `dinh_dang` (bắt buộc): `pdf | xlsx`.
  - `loc` (tuỳ chọn): cùng bộ tham số lọc của `GET /tasks` — báo cáo phản ánh **đúng** bộ lọc người dùng đang xem.
- **Response 200:** thân là tệp nhị phân; header `Content-Type: application/pdf` hoặc `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`; `Content-Disposition: attachment; filename="bao-cao-tien-do-<ngày>.<ext>"`. Bộ lọc cho 0 kết quả vẫn trả tệp hợp lệ ghi "Không có công việc" (`UC-S02-04 [5a]`).
- **Mã trạng thái:**
  - `200` — Xuất thành công (trả tệp)
  - `400` — `dinh_dang` không hợp lệ
  - `403` — Không phải Team Lead/Org Admin (`R-S02-N07`)
  - `500` — Lỗi dựng báo cáo (`UC-S02-04 [6a]`)

---

### GET /tasks — Danh sách công việc (F03)
- **Mô tả:** Lấy danh sách công việc của người dùng hiện tại (là người giao hoặc người nhận) trong tổ chức. Hỗ trợ lọc và phân trang.
- **Tham số query:**
  - `status` (tuỳ chọn): `TODO | IN_PROGRESS | IN_REVIEW | DONE | CANCELLED`
  - `assignee_id` (tuỳ chọn): lọc theo người thực hiện (Team Lead+)
  - `priority` (tuỳ chọn): `LOW | MEDIUM | HIGH | URGENT`
  - `overdue` (tuỳ chọn): `true` — chỉ lấy công việc quá hạn
  - `page` (mặc định 1), `limit` (mặc định 20, tối đa 100)
- **Response 200:**
```json
{
  "items": [
    {
      "id": "task_01J...",
      "tieu_de": "Thiết kế màn hình Dashboard",
      "trang_thai": "IN_PROGRESS",
      "uu_tien": "HIGH",
      "deadline": "2026-06-15T17:00:00Z",
      "nguoi_giao": { "id": "u_02J...", "ho_ten": "Trần Thị B" },
      "nguoi_nhan": { "id": "u_01J...", "ho_ten": "Nguyễn Văn An" },
      "tao_luc": "2026-06-08T09:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```
- **Mã trạng thái:** `200` · `401` chưa đăng nhập

---

### POST /tasks — Tạo công việc (F04)
- **Mô tả:** Tạo công việc mới trong tổ chức. Người tạo tự động là `nguoi_giao`.
- **Request body:**
```json
{
  "tieu_de": "Thiết kế màn hình Dashboard",
  "mo_ta": "Bao gồm wireframe và design spec theo template BA toolkit",
  "assignee_id": "u_01J...",
  "deadline": "2026-06-15T17:00:00Z",
  "uu_tien": "HIGH"
}
```
- **Response 201:**
```json
{
  "id": "task_01J...",
  "tieu_de": "Thiết kế màn hình Dashboard",
  "trang_thai": "TODO",
  "tao_luc": "2026-06-10T08:30:00Z"
}
```
- **Mã trạng thái:**
  - `201` — Tạo thành công
  - `400` — Thiếu trường bắt buộc hoặc sai định dạng
  - `403` — Không có quyền tạo (chỉ Team Lead+ trong tổ chức)
  - `404` — `assignee_id` không tồn tại hoặc không thuộc tổ chức

---

### PATCH /tasks/:id/status — Cập nhật trạng thái (F06)
- **Mô tả:** Chuyển trạng thái công việc. Kiểm tra quyền theo vai trò (Member chỉ chuyển trạng thái mình được giao; Team Lead+ có thể duyệt).
- **Request body:**
```json
{
  "trang_thai": "IN_REVIEW",
  "ghi_chu": "Đã hoàn thành task, chờ review"
}
```
- **Response 200:**
```json
{
  "id": "task_01J...",
  "trang_thai": "IN_REVIEW",
  "cap_nhat_luc": "2026-06-10T14:25:00Z"
}
```
- **Mã trạng thái:**
  - `200` — Cập nhật thành công
  - `400` — Chuyển trạng thái không hợp lệ theo luồng (vd: TODO → DONE không được)
  - `403` — Không có quyền chuyển trạng thái này (vd: Member không thể duyệt DONE)
  - `404` — Công việc không tìm thấy

---

### POST /tasks/:id/comments — Thêm bình luận (F07)
- **Mô tả:** Thêm bình luận vào công việc. Mọi thành viên trong tổ chức có quyền bình luận.
- **Request body:**
```json
{
  "noi_dung": "Đã check lại logic, có thể merge."
}
```
- **Response 201:**
```json
{
  "id": "cmt_01J...",
  "noi_dung": "Đã check lại logic, có thể merge.",
  "nguoi_viet": { "id": "u_03J...", "ho_ten": "Lê Văn C" },
  "tao_luc": "2026-06-10T15:00:00Z"
}
```
- **Mã trạng thái:** `201` · `400` nội dung rỗng hoặc quá dài · `404` công việc không tìm thấy

---

### GET /notifications — Danh sách thông báo (F08)
- **Mô tả:** Lấy thông báo của người dùng hiện tại, mới nhất lên đầu.
- **Tham số query:** `unread_only=true` (tuỳ chọn), `page`, `limit` (mặc định 20)
- **Response 200:**
```json
{
  "items": [
    {
      "id": "ntf_01J...",
      "loai": "TASK_ASSIGNED",
      "noi_dung": "Bạn được giao công việc: Thiết kế màn hình Dashboard",
      "tham_chieu_id": "task_01J...",
      "da_doc": false,
      "tao_luc": "2026-06-10T08:30:00Z"
    }
  ],
  "total_unread": 3,
  "total": 15
}
```
- **Mã trạng thái:** `200` · `401` chưa đăng nhập

---

### POST /organizations/me/members — Mời thành viên (F13)
- **Mô tả:** Tạo tài khoản mới cho thành viên trong tổ chức. Chỉ Org Admin.
- **Request body:**
```json
{
  "email": "moi.nguoi@cty.vn",
  "ho_ten": "Người Mới",
  "vai_tro": "MEMBER",
  "mat_khau_tam": "ChangeMe@123"
}
```
- **Response 201:**
```json
{
  "id": "u_04J...",
  "email": "moi.nguoi@cty.vn",
  "ho_ten": "Người Mới",
  "vai_tro": "MEMBER",
  "trang_thai": "ACTIVE",
  "phai_doi_mat_khau": true
}
```
- *(CR-02)* Tài khoản tạo qua endpoint này luôn có **`phai_doi_mat_khau = true`** — người mới buộc đổi mật khẩu tạm ở lần đăng nhập đầu. Trace: `CR-02` · `BR-03`.
- **Mã trạng thái:**
  - `201` — Tạo thành công
  - `400` — Thiếu trường hoặc email không hợp lệ
  - `403` — Không phải Org Admin
  - `409` — Email đã tồn tại trong hệ thống

---

### PATCH /users/me/password — Đổi mật khẩu (F10)
- **Mô tả:** Đổi mật khẩu của chính người đăng nhập. Bắt buộc đúng mật khẩu hiện tại; thu hồi mọi phiên khác, giữ phiên hiện tại (`R-S04-15`).
- **Request body:** `{ "mat_khau_hien_tai": "...", "mat_khau_moi": "..." }`
- **Response 200:** `{ "da_doi": true }`
- *(CR-02)* Đổi mật khẩu thành công **xoá cờ `NguoiDung.phai_doi_mat_khau` về `false`** — gỡ trạng thái buộc đổi. Đây là đường **duy nhất** gỡ cờ. Trace: `CR-02` · `R-S01-11` · `R-S04-14`.
- **Mã trạng thái:**
  - `200` — Đổi thành công
  - `400` — Mật khẩu mới không đạt luật (`R-S04-N02`) hoặc trùng mật khẩu hiện tại (`BRule-S04-05`)
  - `401` — Sai mật khẩu hiện tại (`R-S04-14`) hoặc chưa xác thực
  - `429` — Thử sai quá nhiều (`R-S04-N04`)

## Thuật ngữ
| Thuật ngữ | Giải thích |
|---|---|
| API (Application Programming Interface) | Giao diện để phần mềm khác gọi vào hệ thống |
| REST | Kiểu thiết kế API theo tài nguyên, dùng động từ HTTP (GET/POST/PUT/DELETE) |
| Endpoint | Một địa chỉ cụ thể của API (vd `POST /auth/login`) |
| JWT (JSON Web Token) | Chuỗi token chứng minh danh tính người gọi, có chữ ký |
| access_token / refresh_token | Token ngắn hạn để gọi API / token dài hạn để xin token mới |
| HTTP status | Mã kết quả: 200 thành công · 401 chưa xác thực · 403 không đủ quyền · 423 bị khoá · 429 vượt giới hạn |
| Error envelope | Khuôn phản hồi lỗi thống nhất cho mọi endpoint |
| Rate limit | Giới hạn số request trong một khoảng thời gian |

> Từ điển đầy đủ toàn dự án: `docs/00-glossary.md`.
