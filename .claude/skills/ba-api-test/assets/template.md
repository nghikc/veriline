# Checklist kiểm thử API — <Tên dự án>

> Nguồn: `06-api-spec.md` (API tự phát) · `12-api-integration.md` (API đối tác) · Ngày: `YYYY-MM-DD`
> Đây là **outline để duyệt trước**. Ca chi tiết + file chạy được: `ba-api-test` → `api.http`.
> Độ phủ: `<n>/<tổng>` endpoint có đủ đặc tả để viết ca.

## 1. API của mình

### `POST /auth/login` — Đăng nhập *(F01)*
| ID | Nhóm | Kịch bản | Kỳ vọng | Trace |
|----|------|----------|---------|-------|
| ACL-01 | Happy | Email + mật khẩu đúng | `200` · có `access_token`, `expires_in`, `user` | F01 |
| ACL-02 | Mã lỗi | Thiếu trường `password` | `400` · `VALIDATION_ERROR` | F01 |
| ACL-03 | Mã lỗi | Sai mật khẩu | `401` · `INVALID_CREDENTIALS`, có `remaining` | F01 |
| ACL-04 | Mã lỗi | Tài khoản khoá tạm | `423` · `TEMP_LOCKED`, có `lock_expires` | F01 |
| ACL-05 | Biên | Email sai định dạng | `400` | F01 |
| — | Phân quyền | Không áp dụng — endpoint công khai | — | — |

## 2. API đối tác *(nếu có `12-api-integration.md`)*
> Trọng tâm khác: **không test hành vi của đối tác** (mình không sở hữu), mà test **hợp đồng** — đúng field mình cần, đúng mã lỗi mình phải xử, và retry/idempotency/timeout **phía mình**.

| ID | Hệ ngoài | Kịch bản | Kỳ vọng | Bắn thật được? | Trace |
|----|----------|----------|---------|----------------|-------|
| ACL-20 | EXT-01 | Trả về đủ field bắt buộc theo mapping | có đủ field ở `api-map` | Có (sandbox) | EXT-01 |
| ACL-21 | EXT-01 | Đối tác trả `503` | mình retry 3 lần rồi vào DLQ | **Mô phỏng** | EXT-01 |

## 3. Endpoint CHƯA ĐỦ ĐẶC TẢ (không viết ca)
> Khai ở bảng tổng nhưng thiếu mục chi tiết → không có request/response/mã lỗi để dựa. **Viết ca cho những cái này là bịa.**

| Endpoint | Thiếu gì | Cần ai bổ sung |
|----------|----------|----------------|
| `GET /users/me` | không có mục chi tiết | `ba-api-spec` |

## 4. Câu hỏi còn mở
| Mã | Câu hỏi | Chặn ca nào |
|----|---------|-------------|
| GĐ-01 | Vai trò nào được gọi `POST /reports/export`? | ACL-.. nhóm Phân quyền |

## Thuật ngữ
| Thuật ngữ | Giải thích |
|-----------|-----------|
| ACL | Mục checklist kiểm thử API (API CheckList) |

> Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`.
