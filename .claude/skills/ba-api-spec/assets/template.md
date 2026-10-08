# Đặc tả API — <Tên App>

> Thiết kế theo **Resource-Oriented REST**: path là danh từ tài nguyên, thao tác qua HTTP method.

## 1. Bảng tổng endpoint
| Method | Path | Mô tả | Trace F.. | Auth |
|--------|------|-------|-----------|------|
| POST | /auth/login | Đăng nhập | F01 | Không |
| GET | /tasks | Danh sách công việc | F03 | Có |
| POST | /tasks | Tạo công việc | F04 | Có |

## 2. Ma trận CRUD-to-Endpoint (soát độ phủ)
| Thực thể \ Thao tác | Create | List | Read | Update | Delete |
|---|---|---|---|---|---|
| Task | POST /tasks | GET /tasks | GET /tasks/{id} | PATCH /tasks/{id} | DELETE /tasks/{id} |
| <Thực thể B> | ... | ... | ... | — (chỉ đọc) | — (luật cấm xoá) |

## 3. Error envelope chuẩn (dùng chung mọi endpoint)
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Mô tả lỗi", "fields": { "email": "Email không hợp lệ" } } }
```
> Mã trạng thái chuẩn: 200/201/204 · 400 sai định dạng · 401 chưa xác thực · 403 không quyền · 404 không tồn tại · 409 xung đột · 422 validation · 429 throttle · 5xx lỗi máy chủ.

## 4. Chi tiết endpoint

### POST /auth/login — Đăng nhập (F01)
- **Mô tả:** Xác thực email + mật khẩu, cấp phiên.
- **Request body:**
```json
{ "email": "user@example.com", "password": "..." }
```
- **Response 200:**
```json
{ "token": "...", "user": { "id": "u1", "ho_ten": "..." } }
```
- **Mã trạng thái:** 200 thành công · 400 thiếu/sai định dạng · 401 sai thông tin · 429 quá số lần thử.

### GET /tasks — Danh sách công việc (F03)
- **Mô tả:** Lấy công việc của người dùng hiện tại.
- **Tham số query:** `status` (tùy chọn), `page`, `limit`.
- **Response 200:**
```json
{ "items": [ { "id": "t1", "tieu_de": "..." } ], "total": 12 }
```
- **Mã trạng thái:** 200 · 401 chưa đăng nhập.

## Thuật ngữ
| Thuật ngữ | Giải thích |
|-----------|-----------|
| API (Application Programming Interface) | Giao diện lập trình ứng dụng |
| REST | Kiểu thiết kế API theo tài nguyên qua phương thức HTTP |
| Endpoint | Một đường dẫn API (phương thức + path) |
| HTTP method | Phương thức thao tác: GET / POST / PATCH / PUT / DELETE |
| Status code | Mã trạng thái phản hồi (200, 400, 401, 404, 422, 5xx…) |
| Error envelope | Cấu trúc lỗi chuẩn dùng chung cho mọi endpoint |

> Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`.
