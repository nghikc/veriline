---
name: ba-new-skill
description: Use when cần tạo skill MỚI cho chính BA toolkit — phỏng vấn 10 câu, soát trùng skill cũ, dừng duyệt khung rồi sinh SKILL.md + template + script và đăng ký vào registry.
---

# ba-new-skill — Xưởng sản xuất skill cho BA toolkit

## Mục tiêu
Biến một ý tưởng thô (*"tôi muốn skill sản xuất dashboard"*) thành một skill **đúng chuẩn toolkit, chạy được, đã test, đã đăng ký** — thay vì một `SKILL.md` viết vội rồi lint bắt 6 lỗi và chạy lần đầu là lộ 4 chỗ hụt.

> **Chỉ sinh skill `ba-*` cho repo này.** Skill cho dự án khác không chịu ràng buộc `conventions.md` — dùng prompt mẫu ở `explain/` thay vì skill này.

## Vì sao 6 câu là chưa đủ
Khung 6 câu kinh điển (mục đích · input · context · cách xử lý · điểm dừng · output) đủ để **mô tả** một skill, nhưng skill sinh ra trong toolkit này còn phải sống chung với 54 skill khác + `lint.js` + 4 loại cổng. Nên khung ở đây là **8 câu** — hai câu thêm chính là hai chỗ hay hỏng nhất:

| # | Câu | Vì sao |
|---|---|---|
| 1 | **Mục đích** — giúp làm việc gì, cho ai | |
| 2 | **Input** — nhận gì (chat/file/tên màn/mã) | |
| 3 | **Context** — đọc tài liệu nào, ở đâu | Nhớ luật `docs/Ho-so/` (tìm cả hai chỗ) |
| 4 | **Cách xử lý** — các bước | |
| 5 | **Điểm dừng** — thiếu gì thì hỏi, bước nào cần duyệt | Ghi >2 file → **bắt buộc có Cổng phương án** |
| 6 | **Output** — file gì, template nào, ghi ở đâu | Doc cấp dự án phải khai vào registry `doc.00`/`doc.NN` |
| **7** | **Ranh giới** — KHÁC skill nào sẵn có ở điểm nào | Chồng lấn là lỗi bị `conventions.md` cấm thẳng; 3 lần gần đây đều suýt vấp |
| **8** | **Cơ giới hoá** — phần nào đếm được, không cần LLM | Phần đếm-được để LLM làm = chậm, đắt, sót. `scan.js`/`status.js`/`ledger.js` ra đời từ câu này |
| **9** | **Rule cứng** — **cái gì TUYỆT ĐỐI không được bịa** | "Điểm dừng" nói *khi nào hỏi*; câu này liệt kê **đích danh** thứ cấm suy đoán (status, deadline, owner, số liệu, công thức, wording lỗi). Cụ thể hơn = khó lách hơn |
| **10** | **Thứ tự ưu tiên** khi hai rule đánh nhau | Vd `Chính xác > Toàn vẹn dữ liệu > Đầy đủ > Trình bày`. Không khai thì skill tự chọn "cho đẹp" khi thiếu dữ liệu — đúng thứ sinh ra báo cáo trông ổn mà sai |

## Quy trình

### Giai đoạn 1 — Phỏng vấn + soát trùng lặp (KHÔNG ghi file)

1. Đọc `conventions.md` + `conv-gates.md` (toàn bộ — skill mới phải tuân mọi luật ở đó) + `ba-toolkit/SKILL.md` (index).
2. **Hỏi 10 câu** bằng `AskUserQuestion`, **từng nhóm một**, không dồn một lượt. Người dùng trả lời mơ hồ ("đầy đủ", "chuyên nghiệp") → hỏi lại bằng ví dụ cụ thể, đừng nhận tính từ làm đặc tả.
3. **Soát trùng lặp (BẮT BUỘC — chạy trước khi bàn tiếp):**
   ```bash
   grep -h "^description:" .claude/skills/*/SKILL.md
   ```
   Đối chiếu mục đích của skill định làm với từng dòng. Ba kết cục:
   - **Trùng >60%** → **DỪNG**, đề xuất *mở rộng skill cũ* thay vì đẻ skill mới. Nói rõ skill nào, trùng ở đâu.
   - **Giao nhau một phần** → phải phát biểu được **một câu ranh giới** dạng *"X soi A, skill mới soi B, không chồng"*. Không phát biểu được = chưa đủ rõ để làm.
   - **Không trùng** → đi tiếp.
4. **Phân loại skill** (quyết định khung file):

   | Loại | Dấu hiệu | Khung |
   |---|---|---|
   | **Nguyên tử** | làm đúng một việc, sinh 1–2 file | `SKILL.md` + `assets/template.md` |
   | **Orchestrator** | gọi ≥2 skill con, có gate | `SKILL.md` (bắt buộc Cổng phương án) |
   | **Tiện ích** | rà soát/xuất bản/đồng bộ, không sinh tài liệu nghiệp vụ | `SKILL.md` (+ script nếu có phần cơ giới) |

5. **Tách việc theo câu 8** — trình bảng **"LLM làm gì · script làm gì"**. Luật: *đếm được, so được, liệt kê được* → script; *phán đoán, diễn giải, viết* → LLM. Có phần cơ giới đáng kể → khai luôn tên script (`<skill>/<tên>.js`, zero-dep CommonJS).
6. **Quyết định người soát:** cần con mắt độc lập không? Chỉ tách agent read-only khi việc soát là **phán đoán trên nội dung do chính agent vừa sinh** VÀ **không trùng** 6 agent hiện có. Kiểm cơ học → viết script, đừng đẻ agent (luật ở `conv-gates.md` → "Review agent độc lập").

### Giai đoạn 2 — HARD STOP: duyệt khung (đây là Cổng phương án của skill này)

7. Trình **khung skill** ra chat, đủ 6 phần của Cổng phương án (`conventions.md`):
   - **Đã đọc** · **Hiểu** (8 câu đã chốt, tóm mỗi câu một dòng)
   - **Sẽ làm**: bảng `file sẽ TẠO · nội dung chính · vì sao cần` — gồm cả 6 chỗ đăng ký sẽ bị SỬA
   - **Giả định** · **Câu hỏi chặn** · **Ngoài phạm vi**
   - Kèm **câu ranh giới** ở bước 3 và **bảng LLM/script** ở bước 5.
8. **DỪNG.** Chỉ sang GĐ3 khi người dùng duyệt. Không "tiện tay" tạo file trước.

### Giai đoạn 3 — Sinh file

8b. **Dựng thư mục theo bố cục chuẩn** (`CLAUDE.md` → "Skill anatomy"). Gốc skill CHỈ có `SKILL.md`; mọi thứ khác vào một trong ba thư mục:

   | Thư mục | Đựng gì | Ví dụ |
   |---|---|---|
   | `scripts/` | mã chạy được | `scan.js`, `check-*.js` |
   | `references/` | thứ skill **đọc để quyết định** | `rules/*.md`, prompt cho subagent |
   | `assets/` | thứ được **chép/điền vào dự án** | `template.md`, seed, `vendor/` |

   Chia theo **vai trò**, không theo đuôi file: một file `.ts` làm ví dụ minh hoạ là `references/`, không phải `scripts/`. `lint.js` check 23 báo lỗi nếu có gì khác `SKILL.md` nằm ở gốc.

9. `SKILL.md` theo `assets/template.md` (trong chính skill này). Luật cứng khi viết:
   - **`description` bắt đầu bằng `Use when …`** — đây là thứ DUY NHẤT agent tự nạp để quyết định gọi skill; viết mơ hồ = skill không bao giờ được trigger. Nêu cả **khi nào KHÔNG dùng** nếu dễ nhầm với skill khác.
   - **Khoá output bằng template, không bằng tính từ** — đưa bảng/tên file/đường dẫn cụ thể.
   - Ghi >2 file hoặc gọi ≥2 skill con → **thêm mục Cổng phương án** (không thì `lint` check 11 báo lỗi).
   - Đường dẫn tài liệu bổ trợ dùng `docs/Ho-so/<tên>` + nhắc "không thấy thì tìm ở gốc `docs/`".
10. `template.md` nếu skill sinh tài liệu — khung output thật, có bảng mẫu, **không** để tính từ.
11. Script nếu GĐ1 bước 5 quyết có: zero-dep CommonJS, header comment nêu **vì sao có script này**, in JSON + cờ `--plain`, **không phán xét gì** (chỉ trả sự thật đếm được).

### Giai đoạn 4 — Đăng ký (cơ giới)

12. Chạy:
    ```bash
    node .claude/skills/ba-new-skill/scripts/register.js <ten-skill> --group <pipeline|he-thong|orchestrator|tien-ich|phan-tich>
    ```
    Script sửa **4 chỗ cơ giới**: index `ba-toolkit/SKILL.md` · `explain/README.md` §2 · mục trong file explain của nhóm + bump số ở header · số đếm trong `CLAUDE.md`. Thêm `--dry` để xem trước.
13. **Phần script KHÔNG làm (cần phán đoán, tự tay):** khai `doc.00`/`doc.NN` nếu skill sinh tài liệu cấp dự án · thêm vào `gate.plan.skills` nếu có Cổng phương án · viết đoạn mô tả nghiệp vụ trong file explain (script chỉ chèn khung).
13b. **Trigger golden (skill có `description` tự kích hoạt):** thêm **≥3 câu** người dùng gõ tự nhiên vào `ba-toolkit/references/trigger-golden.jsonl` — `{"cum","cau","dung":"<ten-skill>","khong":[skill anh em dễ nhầm]}`, câu không chép description, ít nhất một câu không nhắc tên file/skill; `cum` = cụm của skill anh em (mới hẳn thì đặt cụm mới). Rồi chạy `node .claude/skills/ba-toolkit/scripts/trigger-eval.js --only <cụm> --runs 3` (gọi `claude -p` thật): câu sai = mô tả mới giành chỗ hoặc bị skill cũ giành → sửa `description`/`## Ranh giới`, không sửa câu cho khớp.
14. `node .claude/skills/ba-toolkit/scripts/lint.js` → **phải 0 lỗi** mới đi tiếp. Còn lỗi → sửa, đừng bỏ qua.

### Giai đoạn 5 — Test 2 ca (BẮT BUỘC, đây là khâu hay bị bỏ nhất)

15. **Ca 1 — đủ thông tin:** chạy skill với đầu vào đầy đủ. Soát: output đúng template chưa · file đúng chỗ chưa · có cập nhật `00-tracking.md` không (nếu chạm màn).
16. **Ca 2 — THIẾU thông tin:** cố tình bỏ trống một đầu vào quan trọng. **Kỳ vọng: skill DỪNG LẠI HỎI, không tự đoán.** Nó tự bịa = skill hỏng ở đúng chỗ nguy hiểm nhất, quay lại sửa mục "Điểm dừng".
17. Ghi mọi lỗi thấy được → sửa `SKILL.md` → chạy lại **ca khác** (không phải ca cũ).
18. **Skill có checker/cổng (script `check-*`/`validate-*`/`scan-*`/`inspect-*`, hoặc luật hook mới) → CHẠY THẬT trước khi vào main.** Chạy nó trên **một dự án thật** (không phải `example/`, không phải fixture tự viết) rồi ghi lần chạy vào `ba-toolkit/references/realrun.json` — `{duAn, ngay, ref, ketQua: bắt|im|oan}`. `realrun.js --strict` (CI) đỏ với checker mới chưa có lần chạy thật; không có dự án thật để chạy → nói rõ với người dùng, chỉ họ mới chốt được `--write-baseline --allow-grow` (nhận nợ). Luật: `conv-gates.md` → "Cổng mới phải chạy thật trước main".
19. **Báo cáo:** file đã tạo · 4+3 chỗ đã đăng ký · kết quả 2 ca test · lần chạy thật (checker) · lint · gợi ý bước kế (`ba-export update` cho các dự án tiêu dùng nếu skill này cần lan ra).

## Tiêu chí chất lượng (BẮT BUỘC)
- **Không chồng lấn**: phát biểu được một câu ranh giới với mọi skill gần kề.
- **`description` trigger được**: đọc dòng đó, một agent lạ phải biết khi nào gọi và khi nào không.
- **Output khoá bằng template**, không bằng tính từ.
- **Điểm dừng có thật**: ca thiếu thông tin phải làm skill dừng lại hỏi.
- **`lint.js` sạch** — 0 lỗi, kể cả check 11 (Cổng phương án) nếu skill trên ngưỡng.
- **Phần cơ giới đã tách khỏi LLM** nếu có.

## Ranh giới
- **Không** dùng để sinh skill cho dự án ngoài toolkit này. Trước khi báo xong phải chạy thử 2 ca: đủ thông tin và thiếu thông tin.

## Lưu ý
- **Không đẻ skill khi mở rộng skill cũ là đủ.** Toolkit đã 55 skill; thêm một cái trùng việc làm cả bộ khó dùng hơn, không dễ hơn.
- **Không đẻ agent cho việc kiểm cơ học** — viết script. Agent chỉ dành cho phán đoán trên nội dung phức tạp.
- Skill sinh ra **thuộc repo này**; muốn nó tới các dự án đang dùng toolkit thì chạy `ba-export update` ở từng dự án.
- Tiếng Việt; tên skill kebab-case, tiền tố `ba-`.

## Tham chiếu
- `conventions.md` — mọi luật skill mới phải theo (Cổng phương án · Review agent độc lập · registry · `docs/Ho-so/`).
- `ba-toolkit/SKILL.md` — index, để soát trùng lặp.
- `ba-toolkit/lint.js` — 11 check; chạy sau mỗi lần sinh/đăng ký.
- `template.md` (cùng thư mục) — khung `SKILL.md` sinh ra.
