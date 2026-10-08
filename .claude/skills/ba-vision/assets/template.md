# Tầm nhìn & Phạm vi — <Tên App>

> **Business Case / Vision & Scope** — tài liệu chiến lược cấp tổng, đầu vào cho `docs/01-requirements.md`.
> Ngày lập: <ngày> · Người lập: <tên> · Trạng thái: Đề xuất / Đã duyệt / Không làm / Chưa làm
> *(Chỉ khi Không làm / Chưa làm — thay dòng trên, không thêm mục "Kết luận":)* `Trạng thái: Chưa làm — xác nhận: <ai> · <ngày> · mở lại khi: <điều kiện đo được, cùng đơn vị với "Chi phí của việc KHÔNG làm">`. Khi đó chỉ giữ §1 và §3 (lý lẽ của lựa chọn); các mục sau bỏ trống — không bịa mục tiêu/phạm vi/KPI cho việc đã từ chối.

## 1. Vấn đề & cơ hội
- **Bối cảnh:** <tình huống hiện tại, vì sao đặt vấn đề bây giờ>
- **Vấn đề / pain:** <mô tả rõ nỗi đau nghiệp vụ đang tồn tại>
- **Ai chịu ảnh hưởng:** <nhóm người dùng/bộ phận + quy mô nếu biết>
- **Chi phí của việc KHÔNG làm:** <mất tiền/thời gian/khách hàng/cơ hội — có số nếu có, thiếu thì ghi giả định>
- **Cơ hội:** <lợi thế/khoảng trống thị trường/hiệu quả có thể đạt>

*(Tùy chọn) SWOT tóm tắt:*

| Điểm mạnh (S) | Điểm yếu (W) | Cơ hội (O) | Thách thức (T) |
|---------------|--------------|------------|----------------|
| … | … | … | … |

## 2. Mục tiêu kinh doanh (SMART)
Mỗi mục tiêu đo được, có mốc thời gian.

| Mã | Mục tiêu (SMART) | Chỉ số đo | Mốc thời gian |
|------|------------------|-----------|---------------|
| BO-01 | <mục tiêu cụ thể, đo được> | <chỉ số + đơn vị> | <vd Q4/2026> |
| BO-02 | … | … | … |

## 3. Các phương án & đề xuất
Cân nhắc ≥2 phương án (kể cả "không làm gì" / mua sẵn / tự xây).

| Option | Mô tả | Lợi ích | Chi phí / Rủi ro | Chọn? |
|--------|-------|---------|------------------|-------|
| A | <không làm gì / giữ nguyên> | … | … | ✗ |
| B | <mua giải pháp có sẵn> | … | … | ✗ |
| C | <tự xây> | … | … | ✓ |

**Đề xuất:** chọn **Option <…>** vì <lý do dựa trên cost-benefit: cân bằng lợi ích, chi phí, rủi ro và mục tiêu `BO-..`>.

## 4. Phạm vi (Scope)
### In-scope
| Hạng mục | Mô tả | Ưu tiên (MoSCoW) |
|----------|-------|------------------|
| <hạng mục 1> | … | Must |
| <hạng mục 2> | … | Should |
| <hạng mục 3> | … | Could |

### Out-of-scope
- <hạng mục KHÔNG làm trong phạm vi này — ghi cụ thể để chặn scope creep>
- <hạng mục hoãn / thuộc giai đoạn sau> — (Won't lần này)

## 5. Chỉ số thành công (Success Metrics / KPI)
Mỗi KPI gắn 1 mục tiêu `BO-..` và có ngưỡng số.

| KPI | Gắn mục tiêu | Baseline | Ngưỡng mục tiêu | Cách đo |
|-----|--------------|----------|-----------------|---------|
| <tên KPI> | BO-01 | <hiện tại, hoặc ⚠️ chưa có> | <ngưỡng số> | <nguồn/công cụ đo> |
| <tên KPI> | BO-02 | … | … | … |

## 6. Ràng buộc & Rủi ro
### Ràng buộc
- **Ngân sách:** <…> · **Thời hạn:** <…> · **Công nghệ:** <…> · **Pháp lý/tuân thủ:** <…>

### Rủi ro cấp dự án
| Rủi ro | Khả năng | Ảnh hưởng | Hướng giảm thiểu |
|--------|----------|-----------|------------------|
| <rủi ro 1> | Cao/TB/Thấp | Cao/TB/Thấp | … |
| <rủi ro 2> | … | … | … |

## 7. Giả định
Trạng thái mỗi dòng: `Đề xuất → Đã xác nhận / Đã sửa / Đã bỏ` (xem "Xác nhận giả định" trong `conventions.md`).

| Mã | Nội dung giả định | Vì sao cần (chỗ thiếu) | Ảnh hưởng nếu sai | Trạng thái |
|------|-------------------|------------------------|-------------------|-----------|
| GĐ-01 | … | … | … | Đề xuất |
| GĐ-02 | … | … | … | Đề xuất |

---

## Thuật ngữ
| Thuật ngữ | Giải thích |
|-----------|-----------|
| SMART | Tiêu chí mục tiêu tốt: Specific/Measurable/Achievable/Relevant/Time-bound |
| MoSCoW | Cách xếp ưu tiên: Must / Should / Could / Won't |
| KPI (Key Performance Indicator) | Chỉ số đo lường mức đạt mục tiêu |
| ROI (Return on Investment) | Tỷ suất lợi ích thu được trên chi phí bỏ ra |
| SWOT | Khung phân tích Điểm mạnh/Yếu · Cơ hội/Thách thức |
| BO (Business Objective) | Mục tiêu kinh doanh cấp dự án |

> Nếu đã có `docs/Ho-so/00-glossary.md`: trỏ "Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`". Nếu chưa (ba-vision chạy trước ba-requirements) thì giải thích tại chỗ như trên; `ba-requirements` sẽ seed từ điển trung tâm sau.
