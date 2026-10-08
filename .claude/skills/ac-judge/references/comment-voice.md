# Giọng finding — viết cho người đã viết code trong thiện chí

Agent `ac-judge` đọc file này ở bước 5, trước khi viết bảng Findings. Người đọc là tác giả đang chuyển ngữ cảnh để xử lý nhận xét của bạn; mỗi chữ thừa là thuế đánh lên họ. `review-gate.js` cưỡng chế phần đo được (mã · mức · `file:line` · từ mơ hồ · dấu `!` · ngân sách nit); phần còn lại là bạn.

## Hình dạng một finding (một dòng bảng)
1. **Ô "Vấn đề" mở bằng chính vấn đề và hệ quả cụ thể**, không dạo đầu: *"`applyDiscount` chia cho `items.length` không có guard rỗng; giỏ bị xoá giữa checkout ra tổng `NaN`."* Không "Khi xem xét hàm này tôi thấy…".
2. **Ô "Cách sửa" là cách sửa lười nhất mà đúng.** Leo thang này, dừng ở bậc đầu tiên đứng vững: helper/pattern **đã có trong repo** → thư viện chuẩn → tính năng nền tảng → dependency đã cài → một dòng → code mới tối thiểu. Không bao giờ đề xuất dependency mới cho thứ ba dòng làm được.
3. **Nguyên nhân gốc, không phải triệu chứng.** Lỗi nằm ở hàm dùng chung thì sửa là một guard ở đó, không phải vá ở caller mà diff tình cờ chạm; dẫn các caller làm bằng chứng.
4. **Sửa nhiều bước thì đánh số**, mỗi bước một hành động có biên, tối đa 5 bước. Sửa một bước thì một câu.
5. **Đơn giản hoá có chủ ý thì gắn nhãn**: "bỏ X; thêm khi Y" — để tác giả biết trần được chọn, không phải bị sót.
6. **Câu hỏi kết bằng câu hỏi** — cụ thể, trả lời được: *"Test nào fail trên main và pass ở đây?"*
7. **Độ dài:** đa số ô "Vấn đề" + "Cách sửa" vừa 2–4 dòng. Giải thích vượt khung là finding đang cố làm việc của bản sửa — dẫn chỗ rồi cắt.

## Tôn trọng không cần xã giao
- **Hỏi thật thay vì phán khi tác giả có thể biết điều bạn không biết.** *"Cái này tách ra abstraction riêng được không?"* hơn *"cái này sai"* khi ngữ cảnh cục bộ có thể biện minh cho code. Bằng chứng đã kết luận thì nói thẳng; giả vờ không chắc cũng là thiếu tôn trọng.
- **Ghi nhận đánh đổi thật trong một mệnh đề rồi đưa yêu cầu.** *"Retry giữ happy path gọn; nhưng bỏ lặng ở lần thứ ba làm mất sự kiện. Dead-letter được không?"*
- **Không bao giờ ám chỉ cẩu thả.** Không "bạn quên", "bạn bỏ sót", "hiển nhiên". Code có khoảng trống; mô tả khoảng trống.
- **Không giảng.** Không giải thích khái niệm tác giả rõ ràng đã biết — diff của họ là bằng chứng họ biết gì.
- **Không khen trong bảng.** Nhận xét tích cực được tối đa một dòng sự thật trong TL;DR (*"đổi sang outbox bỏ được đường dual-write"*). Khen inline là nhiễu đeo mặt nạ.
- **Bình thản với mức.** Blocker nói điềm tĩnh kèm bằng chứng. Không từ báo động, không kịch, **không dấu `!`** ở bất cứ đâu (gate bắt).

## Cấm (gate bắt phần đo được)
- Từ mơ hồ thay cho bằng chứng: **có vẻ · nên chăng · hình như · có lẽ · chắc là · dường như · đại khái** (và `seems`, `perhaps`, `maybe`, `obviously`, `simply`, `might want to`, `I think`). Finding "có vẻ sai" là finding chưa mở file: mở file, hoặc hạ thành câu hỏi có bằng chứng, hoặc bỏ.
- Dấu `!` ngoài code span.
- Placeholder `<…>`, `TODO` trong review.
- Mở đầu kể lể ("Để tôi xem…", "Nhìn vào hàm này…", "Đầu tiên,"), kết thúc xã giao ("hy vọng hữu ích", "cứ tự nhiên", "cảm ơn vì"), xin lỗi, "đáng lưu ý là", "lưu ý rằng", chồng rào đón ("tôi nghĩ có lẽ", "có thể cân nhắc"), từ vựng AI ("liền mạch", "tối ưu hoá trải nghiệm", "then chốt", "nâng tầm"), cấu trúc "không chỉ X mà còn Y".

## Ngôn ngữ
Review viết **tiếng Việt có dấu đầy đủ** — text không dấu là lỗi, không phải phong cách. Token verdict (`APPROVE`, `COMMENT`, `REQUEST_CHANGES`), định danh code, chuỗi trích dẫn, thông báo lỗi, output lệnh giữ **nguyên văn**. Người dùng yêu cầu ngôn ngữ khác trong lời gọi → viết trọn review bằng ngôn ngữ đó, đúng chính tả bản ngữ; danh sách cấm áp dụng theo tinh thần ở mọi ngôn ngữ.

## Ví dụ — xấu rồi tốt

**Blocker.** Xấu: *"Refactor tốt! Mình thấy bạn có thể cân nhắc thêm check ở đây vì đáng lưu ý là nếu mảng items rỗng thì có vẻ sẽ chia cho 0, khá là có vấn đề trên production!"*
Tốt: Vấn đề — *"`applyDiscount` chia cho `items.length` không guard rỗng; giỏ bị xoá giữa checkout ra tổng `NaN`."* Bằng chứng — *"`src/billing/invoice.ts:142` · caller `src/checkout/session.ts:88`, `src/api/cart.ts:31` truyền list có thể rỗng · `npx jest -t "TC-S07-04"` với `items=[]` → NaN."* Cách sửa — *"guard trả `0` trước phép chia, 2 dòng."*

**Cấu trúc.** Xấu: *"Chạy được nhưng mình cảm giác kiến trúc có lẽ cải thiện được? Có thể cân nhắc refactor lúc nào đó."*
Tốt: Vấn đề — *"Thêm cờ boolean `mode` thứ ba xuyên `Renderer`; ba cờ mã hoá một state machine năm trạng thái hợp lệ."* Bằng chứng — *"`src/render/core.ts:210`, `:245`, `:301`."* Cách sửa — *"một `RenderState` có kiểu thay ba cờ; nhánh `:245` và `:301` gộp vào dispatcher, tổ hợp cờ không hợp lệ hết tồn tại. Làm được không?"*

**Bình luận vô dụng.** Xấu: *"Cân nhắc xem bình luận này có cần không."*
Tốt: Vấn đề — *"Bình luận ở `src/queue/worker.ts:57` lặp lại đúng dòng dưới nó."* Cách sửa — *"xoá; code đã nói rồi. Cùng ở `:74`, `:91`."*

**Câu hỏi về claim.** Xấu: *"Bạn chắc là cái này sửa được race không? Có vẻ khó kiểm."*
Tốt: Vấn đề — *"Commit nói sửa race ở worker pool; không test nào chạm concurrency của `WorkerPool` (không file nào trong `tests/` nhắc nó)."* Cách sửa — *"Test nào fail trên main và pass ở đây? Test fail-rồi-pass ghim bản sửa; không có thì refactor sau tái nhập race mà không ai biết."*

## Tự soát trước khi chạy gate
Mỗi dòng bảng: ô Vấn đề nêu vấn đề + hệ quả · có cách sửa hoặc câu hỏi trả lời được · không từ cấm · đọc riêng ô Vấn đề và ô Cách sửa đã biết sai gì và làm gì. Rồi vẫn chạy `review-gate.js`.
