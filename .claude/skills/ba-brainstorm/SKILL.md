---
name: ba-brainstorm
description: Use when có ý tưởng/tính năng thô và cần phỏng vấn sâu làm rõ trước khi viết yêu cầu — hỏi nghiệp vụ, không hỏi kỹ thuật; trước ba-requirements, sinh docs/Ho-so/00-brainstorm.md.
---

# ba-brainstorm — Phỏng vấn sâu IT-BA

## Mục tiêu
Biến ý tưởng/tính năng thô thành `docs/Ho-so/00-brainstorm.md` rõ ràng, làm đầu vào cho `ba-requirements`. Trọng tâm là **khai thác nghiệp vụ**, không quyết định kỹ thuật.

## Trước khi bắt đầu — đọc 3 rule (cùng thư mục)
- `rules/it-ba-framing.md` — chỉ hỏi nghiệp vụ, cấm hỏi kỹ thuật.
- `rules/complexity-triggers.md` — phát hiện tín hiệu phức tạp → artifact bắt buộc.
- `rules/interview-discipline.md` — hỏi từng câu, no-re-ask, ép giá trị chính xác.

## Quy trình
1. **Phase A — nhận nguồn, quét trigger, chọn chế độ:**
   - **Nguồn ý tưởng:** text người dùng gõ trực tiếp; **`@<đường-dẫn-file>`** → đọc file làm ý tưởng; **ảnh** → đọc bằng vision (cảnh báo độ chính xác có thể thấp). Không có gì → hỏi "Bạn brainstorm ý tưởng gì?".
   - **Continuation (chạy lại):** `docs/Ho-so/00-brainstorm.md` đã tồn tại → **đọc HẾT file trước**, chỉ phỏng vấn phần còn thiếu/`⚠️ chưa xác nhận`, KHÔNG hỏi lại điều đã có (no-re-ask, xem `interview-discipline.md`).
   - **Chọn chế độ:** người dùng nói **"nhanh gọn / làm nhanh / shallow"** (ý nhỏ, MVP, prototype) → **chế độ nhanh** (xem cuối file). Ngược lại → deep (7 phần chính + P8 nhẹ).
   - **Quét trigger:** đối chiếu `complexity-triggers.md`, ghi nhận trigger bật (chỉ dùng cho deep mode).
2. **Phỏng vấn 7 phần chính + 1 mục nhẹ (P8) TUẦN TỰ** *(deep mode)*, mỗi phần hỏi **từng câu một**, tuân `interview-discipline.md` và `it-ba-framing.md`:
   - **P1. Tổng quan** — làm gì, giải quyết vấn đề gì, vì sao bây giờ.
   - **P2. Người dùng & quyền** — vai trò nào dùng, điều kiện gating, điểm vào, quy mô dự kiến.
   - **P3. Luồng chính (happy path)** — hỏi & ghi **từng luồng nghiệp vụ một tiểu mục `3.x`** (tính năng nhiều luồng: đăng ký/đăng nhập/quên mật khẩu/… → mỗi luồng một bảng, KHÔNG dồn chung): mỗi bước người dùng làm gì → hệ thống làm gì → người dùng thấy gì.
   - **P4. Deep-dive** — **CHỈ KHI có trigger ở Phase A**: sinh artifact bắt buộc tương ứng (ASCII flow / scenario matrix / bảng state / ma trận giao dịch gián đoạn). ASCII, không Mermaid, tối đa 3 vòng review.
   - **P5. Validation & wording** — trường bắt buộc, giới hạn/định mức **chính xác**, wording **chính xác tách 3 nhóm**: **lỗi / thành công / thông tin-trung tính** (không dồn chung 1 mục).
   - **P6. Ngữ cảnh hệ thống** — loại thông tin cần lưu, dịch vụ ngoài (tên + mục đích), kênh thông báo, xử lý nền, có cần real-time.
   - **P7. Edge case & rủi ro** — mất mạng, dịch vụ ngoài chết, người dùng đồng thời, rủi ro nghiệp vụ.
   - **P8. Tiêu chí thành công (sơ bộ, nhẹ)** — hỏi **1 câu** "làm sao biết tính năng này thành công" → ghi phác thảo + chỉ số nếu đã rõ. **Trỏ chi tiết sang `00-vision` (BO)/`00-urd` (USC)/`09-uat`; KHÔNG đào sâu metric ở đây** (tránh trùng vision/urd).
3. **Cổng chất lượng (trước khi ghi):** tự soát checklist — fail mục nào thì đề xuất hỏi thêm hoặc ghi `TBD` + Open Question, KHÔNG âm thầm ghi thiếu:
   - [ ] Mỗi **luồng nghiệp vụ** ở P3 có tiểu mục `3.x` riêng + bước đánh số (người dùng làm gì → hệ thống làm gì → thấy gì); nhiều luồng KHÔNG dồn 1 bảng.
   - [ ] Trigger bật ở Phase A → có artifact tương ứng ở P4 (ASCII flow / scenario matrix / bảng state / ma trận giao dịch gián đoạn).
   - [ ] Giới hạn/định mức ở P5 có **số chính xác** (không "phù hợp/vài").
   - [ ] Wording P5 là **string thật**, tách 3 nhóm lỗi/thành công/thông tin.
   - [ ] Open Questions có mã `OQ-01…`; Giả định có mã `GĐ-01…`.
   - [ ] §8 Tiêu chí thành công (sơ bộ) có phác thảo (hoặc `TBD` + Open Question nếu chưa rõ); không lặp lại metric của `00-vision`/`00-urd`.
4. **Viết** `docs/Ho-so/00-brainstorm.md` theo `template.md`, gồm Open Questions + Giả định (đánh số `GĐ-01`…, mỗi giả định ghi lý do cần + ảnh hưởng nếu sai).
5. **Xác nhận giả định (BẮT BUỘC):** chạy vòng xác nhận theo "Xác nhận giả định" trong `conventions.md` — rà **từng `GĐ-..` một** bằng `AskUserQuestion` (Đồng ý/Sửa/Bỏ) → bảng summary → người dùng đồng ý "đi tiếp" mới bàn giao; cập nhật trạng thái từng dòng trong mục Giả định.
6. **Bàn giao:** báo người dùng brainstorm xong, là đầu vào cho `ba-requirements`.

## Kỹ thuật elicitation áp dụng
- **Structured Interviewing:** phỏng vấn theo bộ câu hỏi tổ chức trước (7 phần chính + P8 nhẹ, tuần tự ở trên), hỏi từng câu một — không tự do ngẫu hứng.
- **5 Whys:** với mỗi mục tiêu/yêu cầu thô, hỏi "vì sao" liên tiếp để đào tới *nhu cầu nghiệp vụ gốc* thay vì dừng ở giải pháp bề mặt.
- **Scenario / Happy-path Walkthrough:** đi qua từng bước luồng chính (người dùng làm gì → hệ thống làm gì → thấy gì) để lộ bước thiếu và ngoại lệ (P3, P4).
- **Assumptions & Constraints Log:** mọi điều chưa xác nhận ghi vào mục Giả định + Open Questions, không coi là sự thật.
- **Complexity Triggers → Artifact:** khi bật trigger (redirect ngoài / async / đa vai trò / state machine / throttle) → sinh artifact bắt buộc tương ứng (xem `rules/complexity-triggers.md`).

## Tiêu chí chất lượng (BẮT BUỘC)
- **Mỗi điều thu được là atomic + kiểm chứng được:** giới hạn/định mức/wording ghi **giá trị chính xác** (ép theo `interview-discipline.md`), không để "khoảng vài...", "đủ nhanh".
- **Không hỏi kỹ thuật** (tuân `it-ba-framing.md`); mọi câu ở tầng nghiệp vụ.
- **Trigger bật → có artifact tương ứng**; điều chưa rõ → vào Open Questions, không bịa.

## Chế độ nhanh (shallow)
Khi người dùng nói **"nhanh gọn / làm nhanh / shallow thôi"** (ý tưởng nhỏ, MVP, prototype — vd bật/tắt dark mode) → **bỏ chế độ deep**, chạy gọn:
- Hỏi **1 lượt gộp** vài câu cốt lõi (làm gì · ai dùng · luồng chính · ràng buộc/giới hạn nếu có).
- **Bỏ qua P4 artifact** (ASCII flow / scenario matrix / state) kể cả khi có trigger — trừ khi người dùng yêu cầu.
- **P8 tiêu chí thành công**: chỉ ghi 1 dòng nếu người dùng tự nêu, KHÔNG hỏi thêm.
- Cổng chất lượng rút gọn (chỉ soát: có luồng chính + Open Questions).
- Vẫn giữ vòng **Xác nhận giả định** nếu có `GĐ-..`.
- Trong báo cáo cuối, **khuyến nghị**: "chạy lại deep nếu tính năng vượt phạm vi prototype".

Đừng ép người dùng trả lời 6 câu deep-dive cho một feature vặt — nhưng cũng **không tự chọn shallow**; chỉ shallow khi người dùng nói.

## Lưu ý
- Một câu hỏi mỗi lần; không gộp.
- Tiếng Việt; wording tự nhiên.
- **Văn phong dễ hiểu:** giải thích ngay mọi thuật ngữ nghiệp vụ đặc thù xuất hiện trong `00-brainstorm.md` (brainstorm chạy trước khi có `00-glossary.md` — các thuật ngữ này sẽ được `ba-requirements` đưa vào từ điển trung tâm). Xem "Văn phong tài liệu" trong `conventions.md`.
- Nếu chạy không tương tác (batch/test): tự giả định hợp lý và ghi rõ vào mục Giả định + Open Questions thay vì chờ trả lời — đánh dấu mỗi dòng **`⚠️ chưa xác nhận`** để vòng tương tác sau / `ba-review` nhắc rà (xem "Xác nhận giả định" trong `conventions.md`).
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
