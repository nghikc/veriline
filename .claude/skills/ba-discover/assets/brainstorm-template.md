# Brainstorm — <Tên ý tưởng / tính năng>

> Đầu ra của phỏng vấn IT-BA. Là đầu vào cho `ba-requirements`.

## 1. Tổng quan
- Làm gì: <...>
- Giải quyết vấn đề gì: <...>
- Vì sao bây giờ: <...>

## 2. Người dùng & quyền truy cập
- Vai trò sử dụng: <...>
- Điều kiện gating / điểm vào: <...>
- Quy mô dự kiến: <...>

## 3. Luồng chính (happy path)
> Mỗi **luồng nghiệp vụ** riêng một tiểu mục `3.x` — một tính năng thường có nhiều luồng (vd đăng ký · đăng nhập · quên mật khẩu · đăng xuất). Chỉ một luồng thì để `3.1`; đừng nhồi nhiều luồng vào một bảng.

### 3.1 <Tên luồng>
| Bước | Người dùng làm gì | Hệ thống làm gì | Người dùng thấy gì |
|------|-------------------|-----------------|--------------------|
| 1 | <...> | <...> | <...> |

### 3.2 <Tên luồng tiếp theo> *(nếu có)*
| Bước | Người dùng làm gì | Hệ thống làm gì | Người dùng thấy gì |
|------|-------------------|-----------------|--------------------|
| 1 | <...> | <...> | <...> |

## 4. Deep-dive *(chỉ khi có complexity trigger)*
<ASCII flow diagram / scenario matrix / bảng state transitions / ma trận giao dịch gián đoạn — tuỳ trigger bật.>

## 5. Validation & wording
- Trường bắt buộc: <...>
- Giới hạn/định mức (số chính xác): <vd: 5 lần/phút>
- Wording chính xác — **tách 3 nhóm** (không dồn chung):
  - **Lỗi:** <vd: "Email đã tồn tại">
  - **Thành công:** <vd: "Đăng ký thành công, kiểm tra email để kích hoạt">
  - **Thông tin / trung tính:** <vd: "Đã gửi email xác nhận tới {email}">

## 6. Ngữ cảnh hệ thống
- Loại thông tin cần lưu: <email, trạng thái, ngày...>
- Dịch vụ ngoài (tên + mục đích): <Google — đăng nhập; Stripe — thanh toán>
- Kênh thông báo: <email / push / in-app>
- Xử lý nền / real-time: <nhu cầu nghiệp vụ>

## 7. Edge case & rủi ro
- Mất mạng / đóng tab giữa chừng: <...>
- Dịch vụ ngoài chết: <...>
- Người dùng đồng thời: <...>
- Rủi ro nghiệp vụ: <...>

## 8. Tiêu chí thành công (sơ bộ)
> Phác thảo "làm sao biết tính năng này thành công" ở mức brainstorm. **Chi tiết đặt ở nơi chuyên trách, không lặp lại ở đây:** mục tiêu kinh doanh `BO-..` trong `00-vision.md`, tiêu chí người dùng `USC-..` trong `00-urd.md`, kịch bản nghiệm thu trong `09-uat.md`.

- Kết quả nghiệp vụ mong đợi: <vd: người mới hoàn tất đăng ký mà không cần hỗ trợ>
- Chỉ số sơ bộ (nếu đã rõ — ghi số đo được, chưa rõ thì `TBD`): <vd: ≥ 80% tài khoản mới xác thực email trong 24h>

## Open Questions
- [ ] OQ-01: <điều chưa chốt>

## Giả định
> Mỗi giả định phải được rà & xác nhận (xem "Xác nhận giả định" trong `conventions.md`). Trạng thái: Đề xuất / Đã xác nhận / Đã sửa / Đã bỏ / ⚠️ chưa xác nhận (batch).

| Mã | Giả định | Vì sao cần (chỗ thiếu) | Ảnh hưởng nếu sai | Trạng thái |
|----|----------|------------------------|-------------------|-----------|
| GĐ-01 | <giả định đã đưa ra khi thiếu thông tin> | <...> | <...> | Đề xuất |
