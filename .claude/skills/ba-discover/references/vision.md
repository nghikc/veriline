# `ba-discover vision` — Tầm nhìn & Phạm vi / Business Case

> Chi tiết của chế độ `vision` (`SKILL.md` → "Chế độ `vision`"). Trước là skill `ba-vision`.

## Mục tiêu
Sinh `docs/Ho-so/00-vision.md` — tài liệu **Tầm nhìn & Phạm vi / Business Case (Vision & Scope)**: trả lời **vì sao làm dự án**, mục tiêu kinh doanh, phương án, phạm vi và cách **đo lường thành công**. Là tài liệu chiến lược **cấp tổng, 1 file/dự án**, chạy **ĐẦU TIÊN** (trước `ba-requirements`) và là **đầu vào** cho nó — "Business Need" trong `01-requirements.md` lấy từ đây thay vì viết lại mỏng.

## Quy trình
1. Đọc `conventions.md` của `ba-toolkit`; đọc `docs/Ho-so/00-brainstorm.md` và `docs/Ho-so/04-stakeholders.md` nếu có.
2. **Làm rõ vấn đề/cơ hội:** pain thật sự là gì · **ai chịu** (nhóm nào, quy mô) · **chi phí của việc KHÔNG làm** (mất tiền/thời gian/khách hàng). Đây là nền cho mọi mục sau. **Xen kẽ brainstorm:** nếu vấn đề còn mơ hồ / thiếu số liệu → **invoke `ba-discover brainstorm` (focused vào pain·ai·vì sao·quy mô)** để phỏng vấn sâu trước, thay vì hỏi hời hợt; kết quả nối vào `00-brainstorm.md` và dùng cho mục này (đúng cách `ba-discover` xen kẽ).
3. **Mục tiêu kinh doanh SMART:** mỗi mục tiêu đo được, có **mốc thời gian** — cấp mã `BO-01`, `BO-02`… (Business Objective). Tránh mục tiêu chung chung ("tăng trải nghiệm").
4. **Các phương án (options) & đề xuất:** liệt kê **≥2 phương án** cân nhắc (kể cả "không làm gì" / mua sẵn / tự xây), mỗi option kèm **cost-benefit ngắn** (lợi ích · chi phí/rủi ro) → nêu **đề xuất chọn + lý do**. "Không làm" / "chưa làm" cũng là một cược, không phải mặc định trung lập — nêu cái giá của việc giữ nguyên **cùng đơn vị** với cái giá của việc làm (tuần công ↔ tiền/giờ mất, không phải tính từ). Người dùng chốt không/chưa làm → ghi dòng `Trạng thái:` đầu file theo template (ai xác nhận · ngày · điều kiện mở lại) và dừng ở §3.
5. **Phạm vi:** **In-scope / Out-of-scope** rõ ràng; dùng **MoSCoW** cho các hạng mục in-scope (Must/Should/Could/Won't). Out-of-scope ghi cụ thể để chặn scope creep.
6. **Chỉ số thành công (KPI/success metrics):** mỗi KPI **gắn 1 mục tiêu `BO-..`**, có **ngưỡng số** + cách đo + baseline (nếu có).
7. **Ràng buộc, giả định & rủi ro cấp dự án:** ràng buộc (ngân sách/thời hạn/công nghệ/pháp lý) · rủi ro chính + hướng giảm thiểu.
8. **Xác nhận giả định (BẮT BUỘC):** gom giả định ở mục Giả định (đánh số `GĐ-..`), chạy vòng xác nhận theo "Xác nhận giả định" trong `conventions.md` — rà **từng giả định một** bằng `AskUserQuestion` → bảng summary → người dùng đồng ý "đi tiếp" mới chốt; cập nhật trạng thái + giá trị chốt.
9. Viết `docs/Ho-so/00-vision.md` đúng các mục trong `assets/vision-template.md`. **Bàn giao:** trình tóm tắt và nêu rõ đây là đầu vào cho `ba-requirements` (Business Need + phạm vi + tiêu chí thành công lấy từ file này).

## Kỹ thuật áp dụng
- **MOST (Mission / Objectives / Strategy / Tactics)** hoặc **Vision-to-Scope:** neo từ sứ mệnh/tầm nhìn xuống mục tiêu đo được rồi mới tới phạm vi — bảo đảm phạm vi phục vụ đúng mục tiêu.
- **SWOT:** soi Điểm mạnh/Yếu (nội bộ) + Cơ hội/Thách thức (bên ngoài) để định vị vấn đề và chọn phương án.
- **Cost-Benefit / ROI ngắn:** mỗi phương án cân lợi ích ↔ chi phí + rủi ro để đề xuất có căn cứ (không cần mô hình tài chính nặng — đủ để so sánh).
- **SMART:** mọi mục tiêu kinh doanh phải Specific/Measurable/Achievable/Relevant/Time-bound.
- **MoSCoW:** xếp ưu tiên hạng mục trong phạm vi.
- **Success Metrics gắn mục tiêu:** mỗi KPI ánh xạ về đúng một `BO-..`, đo được — không có KPI "mồ côi" không gắn mục tiêu nào.

## Tiêu chí chất lượng (BẮT BUỘC)
- **Mục tiêu SMART:** mỗi `BO-..` đo được, có **chỉ số + mốc thời gian**; cấm mục tiêu mơ hồ kiểu "cải thiện trải nghiệm/tăng hiệu quả" mà không có số.
- **Có phương án & đề xuất:** ≥2 option được cân nhắc; option đề xuất có **lý do rõ** dựa trên cost-benefit.
- **Phạm vi rõ:** In-scope **và** Out-of-scope đều liệt kê cụ thể (không mơ hồ); hạng mục in-scope có mức MoSCoW.
- **KPI gắn mục tiêu + có ngưỡng:** mỗi KPI trace về đúng 1 `BO-..` và có **ngưỡng số** (không phải phát biểu định tính).
- **Không bịa số liệu:** thiếu số (chi phí, baseline, quy mô) thì **hỏi** người dùng; batch/không tương tác thì ghi thành giả định và đánh dấu **`⚠️ chưa xác nhận`** (xem "Xác nhận giả định" trong `conventions.md`).

## Lưu ý
- Tài liệu bằng tiếng Việt. Tài liệu chiến lược **cấp tổng, 1 file/dự án**, đứng **trước** `ba-requirements`.
- **Văn phong & Thuật ngữ:** viết rõ ràng, chủ động; mở rộng từ viết tắt ở lần đầu dùng (vd "KPI (Key Performance Indicator)", "ROI (Return on Investment)"); thêm footer `## Thuật ngữ` cuối `00-vision.md`. Vì `ba-discover vision` chạy **trước** `ba-requirements` nên `docs/Ho-so/00-glossary.md` thường **chưa tồn tại** — trong trường hợp đó **giải thích thuật ngữ tại chỗ** ở footer (không tạo glossary trung tâm ở đây); `ba-requirements` sẽ seed `00-glossary.md` sau. Nếu `00-glossary.md` đã có thì bổ sung thuật ngữ mới theo `conventions.md`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
