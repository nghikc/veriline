# Template — `docs/Ho-so/meetings/<YYYY-MM-DD>-<chủ-đề>.md`

```markdown
# Biên bản họp — <Chủ đề>

| | |
|---|---|
| **Ngày** | 2026-07-21 · 14:00–15:00 |
| **Hình thức** | Online (Google Meet) |
| **Chủ trì** | (tên) |
| **Người ghi** | (tên) |
| **Tham dự** | A, B, C |
| **Vắng** | D (báo trước) |

## Chương trình nghị sự
1. Chốt phạm vi phase 1
2. Chọn cổng thanh toán
3. Kế hoạch demo

## Việc tồn từ họp trước
| Mã | Việc | Người | Hạn | Trạng thái |
|----|------|-------|-----|------------|
| ACT-03 | Gửi hợp đồng VNPAY | B | 2026-07-18 | ✅ Xong |

## Thảo luận (theo agenda)
**1. Phạm vi phase 1** — thống nhất chỉ làm Đăng nhập + Dashboard; Tổ chức lùi phase 2.
**2. Cổng thanh toán** — cân nhắc VNPAY vs MoMo; ưu tiên VNPAY vì phí thấp hơn cho B2B.
**3. Demo** — chốt demo cuối tháng 7.

## Quyết định (DEC)
| Mã | Quyết định | Người quyết | Lý do | Ảnh hưởng |
|----|-----------|-------------|-------|-----------|
| DEC-01 | Phase 1 chỉ gồm S01, S02 | (chủ trì) | Kịp deadline | S05 lùi phase 2 |
| DEC-02 | Dùng VNPAY cho thanh toán | (chủ trì) | Phí thấp | → EXT-01 · ADR-01 (12-api-integration) |

## Action item (ACT)
| Mã | Việc | Người | Hạn | Trạng thái | Liên quan |
|----|------|-------|-----|------------|-----------|
| ACT-04 | Cập nhật roadmap: lùi S05 | (BA) | 2026-07-23 | Mở | DEC-01 → CR-05 |
| ACT-05 | Đặc tả tích hợp VNPAY | (BA) | 2026-07-25 | Mở | DEC-02 · 12-api-integration |

## Câu hỏi mở (OQ)
- **OQ-01** — Ngân sách phase 2 chưa rõ, chờ tài chính duyệt.

## Họp kế tiếp
2026-07-28 · Review tiến độ dev.

---
> Action item là thay đổi tài liệu/chức năng đã chốt → đã mở **CR-05** trong `docs/00-cr.md`.
```

## Ghi chú khi điền
- **`DEC` vs "thảo luận":** chỉ ghi vào bảng Quyết định điều đã CHỐT; điều mới bàn để ở mục Thảo luận.
- **Mỗi `ACT` một người + một hạn** — nhiều người → tách nhiều dòng.
- Cột **Liên quan** nối `DEC/S/F/CR` để về sau truy vết; đã mở CR thì ghi `→ CR-..`.
