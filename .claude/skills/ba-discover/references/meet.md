# `ba-discover meet` — Biên bản họp (Minutes of Meeting)

> Chi tiết của chế độ `meet` (`SKILL.md` → "Chế độ `meet`"). Trước là skill `ba-meet`.

## Mục tiêu
Từ ghi chú họp lộn xộn (bút ký, transcript, chat) → một **biên bản họp** dùng được: ai họp, bàn gì, **chốt gì** (`DEC`), **ai làm gì trước khi nào** (`ACT`), câu hỏi còn mở. Biên bản là **nguồn sự thật của quyết định vận hành**; action item là **thay đổi** thì mở CR để nối vào pipeline. Sinh `docs/Ho-so/meetings/<ngày>-<chủ-đề>.md`.

## Điều kiện
- **Đầu vào:** ghi chú/transcript (dán vào chat, hoặc trỏ file). Không có ghi chú thật → không bịa nội dung họp.
- Đọc được `docs/` của dự án thì tốt (để nối `DEC`/`ACT` với `FR`/`S`/`CR` có sẵn).

## Quy trình
1. Đọc `conventions.md` + `conv-gates.md`. Nếu `docs/Ho-so/meetings/` đã có biên bản trước → đọc để **mang các `ACT` còn mở** sang mục "Việc tồn từ họp trước".
1b. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Đọc xong ghi chú thô → trình phương án đủ 6 phần **trước khi ghi biên bản**: hiểu cuộc họp bàn gì, **những `DEC`/`ACT` định tách ra** (liệt kê thô), file MoM sẽ tạo, và **quan trọng nhất — action nào sẽ đẻ ra `CR`/`WI`** (mở sổ = chạm tài liệu dự án, phải được duyệt trước). `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Chỉ ghi MoM thuần, không mở CR/WI nào → dưới ngưỡng, được IN phương án rồi chạy thẳng.
2. **Chuẩn hóa metadata:** ngày họp, hình thức, **người tham dự** (+ vắng), người chủ trì, người ghi, chương trình nghị sự (agenda). Thiếu → hỏi ngắn hoặc để `(chưa rõ)`, không đoán tên người.
3. **Tóm tắt thảo luận theo agenda** — mỗi mục vài gạch đầu dòng **trung lập**, bám điều đã nói; không thêm ý kiến/không suy diễn động cơ. Trích nguyên văn các **con số/cam kết** quan trọng.
4. **Tách QUYẾT ĐỊNH `DEC-01`:** điều đã CHỐT (khác điều mới bàn) — mỗi quyết định: nội dung · người quyết · lý do ngắn · **ảnh hưởng** (trỏ `FR/S/ADR/CR` nếu chạm tài liệu). Quyết định kiến trúc lớn → gợi ý ghi thành `ADR` ở `10`/`12`.
5. **Tách ACTION ITEM `ACT-01`:** mỗi việc — **người phụ trách (1 người)** · **hạn (ngày cụ thể)** · trạng thái (`Mở`/`Đang làm`/`Xong`) · liên quan (`S..`/`F..`/`DEC-..`). Việc không có chủ/hạn = việc sẽ trôi → hỏi để chốt, đừng để trống.
6. **Câu hỏi mở & lịch họp sau:** `OQ` chưa giải trong họp; thời điểm/nội dung họp kế (nếu có).
7. Viết `docs/Ho-so/meetings/<YYYY-MM-DD>-<chủ-đề-không-dấu>.md` theo `assets/meet-template.md`.
8. **Nối pipeline (BẮT BUỘC rà):**
   - `ACT`/`DEC` là **thay đổi chức năng/màn đã có** → **mở CR**: gọi `ba-change-request` (cấp `CR-..` vào `00-cr.md`, ghi nguồn "họp <ngày> · DEC-.."). Biên bản ghi chéo `→ CR-..`.
   - `DEC` **đổi yêu cầu/kiến trúc đã chốt** → nhắc chạy skill tương ứng (`ba-requirements`/`ba-architecture`/`ba-api-spec partner` qua CR).
   - `ACT` chạm màn cụ thể → nhắc `ba-track` màn đó.
9. **Báo người dùng:** liệt kê `DEC`, `ACT` (kèm chủ/hạn), CR vừa mở, việc còn thiếu chủ/hạn cần bổ sung.

## Lưu ý
- **Biên bản ≠ transcript:** cô đọng thành quyết định + việc, không chép lại từng câu.
- **Trung lập & chính xác:** không gán quan điểm cho người tham dự ngoài điều họ nói; số liệu/cam kết trích đúng.
- **Không xoá biên bản cũ** — mỗi họp một file, là lịch sử; cập nhật trạng thái `ACT` ở họp sau (hoặc khi việc xong).
- `meetings/` **không vào portal mặc định** (đối tượng đọc riêng), giống `releases/`, `userguide/`.
- **Xác nhận giả định:** phần suy ra (vd hiểu ý một quyết định mơ hồ) → `GĐ`/`OQ`, hỏi lại; đừng tự chốt thay người họp.
- Tiếng Việt; tên file không dấu (`2026-07-21-kickoff.md`).
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
