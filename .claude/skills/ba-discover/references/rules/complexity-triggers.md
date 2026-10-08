# Rule: Complexity triggers

Ở **Phase A**, quét ý tưởng và mô tả để phát hiện tín hiệu phức tạp. Nếu trigger bật → **bắt buộc** sinh artifact tương ứng ở **P4 (Deep-dive)**.

| Tín hiệu (keyword) | Trigger | Artifact bắt buộc ở P4 |
|---|---|---|
| OAuth, thanh toán, redirect ra ngoài, webhook | `has_external_redirect` | Ma trận giao dịch gián đoạn + **ASCII flow** |
| đăng ký, checkout, xác minh email, hàng đợi, xử lý nền (async) | `has_async_flow` | Ma trận giao dịch gián đoạn + **ASCII flow** |
| admin/user, nhiều vai trò, free/paid, phân quyền | `has_multi_role` | **Scenario matrix** (vai trò × trường hợp) |
| pending→active, draft→published, nhiều trạng thái | `has_state_machine` | **Bảng state transitions** |
| rate limit, khoá tài khoản, captcha, hạn mức/quota | `has_throttle_rules` | **Ép số chính xác** (ở P5) |

## Quy tắc artifact
- **ASCII flow**: vẽ bằng ASCII (KHÔNG dùng Mermaid). Tối đa **3 vòng** review với người dùng rồi chốt.
- **Ma trận giao dịch gián đoạn**: liệt kê các điểm có thể đứt (mất mạng, đóng tab, dịch vụ ngoài chậm) × trạng thái hệ thống × cách phục hồi.
- **Scenario matrix**: hàng = vai trò/điều kiện, cột = trường hợp; ô = hành vi mong đợi.
- **Bảng state transitions**: Trạng thái hiện tại | Sự kiện | Trạng thái kế | Điều kiện.
- Không có trigger nào bật → **bỏ qua P4**, đi thẳng P5.
