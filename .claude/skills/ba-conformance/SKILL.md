---
name: ba-conformance
description: Use when cần đối chiếu CODE THẬT với tài liệu BA — chỗ code lệch đặc tả, chưa làm, hay làm mà tài liệu không mô tả; sinh docs/Ho-so/00-conformance.md. Sau dev-run, trước ba-accept.
---

> **Hồ sơ `lite`**: skill này không chạy tự động và `ba-accept` không bắt buộc gọi (`conv-gates.md` → "Hồ sơ dự án"), nhưng **gọi tay vẫn chạy đầy đủ** — lite tắt phần *bắt buộc*, không tắt phần *dùng được*.

# ba-conformance — Đối chiếu code ↔ tài liệu

## Mục tiêu
Trả lời ba câu mà **không skill nào khác trả lời được**:

| Hướng | Câu hỏi | Ai phát hiện |
|---|---|---|
| **CHƯA LÀM** | đặc tả có, code không có | `scan-code.js` (cơ giới) + agent (ca "file có mà nội dung rỗng") |
| **LỆCH** | cả hai có, hành vi khác nhau | agent `ba-inference-reviewer` chế độ `conformance` |
| **KHÔNG CÓ TÀI LIỆU** | code có hành vi nghiệp vụ mà tài liệu không mô tả | script (file lạc) + agent (quy tắc/nhánh giấu trong code) |

Sinh `docs/Ho-so/00-conformance.md`. Xem quy ước ở `conventions.md` → **"Đối chiếu code ↔ tài liệu"**.

> **Trục khác hẳn các skill soát sẵn có.** `ba-review`/`ba-trace`/`ba-consistency-reviewer`/`ba-changelog` đều soát **tài liệu ↔ tài liệu**. Cột `dev` của `00-tracking.md` chỉ nói *"màn này đã code"* (do `dev-run` tự khai), **không** nói *"code có đúng đặc tả không"*. Đây là skill duy nhất đi qua ranh giới đó.

## Cổng TẦNG của test — chạy TRƯỚC phần đọc code

```bash
node .claude/skills/ba-conformance/scripts/check-tc-layer.js docs --root . --plain
```

Hỏi một câu mà không cổng nào khác hỏi: **test thoả một TC có nằm đúng tầng mà TC đó mô tả không?**

Ca thật, đo được trong repo mẫu ngày 04/09/2026: `TC-S01-15` viết *"Mở `/login` → nhập sai mật khẩu → **thông báo inline** Sai email hoặc mật khẩu. Còn 4 lần thử"*. Test mang mã đó nằm ở `tests/modules/auth/dem-sai.test.ts`, gọi thẳng `dv.dangNhap()` ở **tầng service**, và pass. Còn màn hình thì chỉ có `if (r.ok) dieuHuong(...)` — **không có nhánh else**: đăng nhập sai, người dùng không thấy gì cả.

Lúc đó **43/43 TC "pass"**, `ba-trace` 0 ref gãy, `ba-feasible` sạch, lint và typecheck 0 lỗi. Chạy cổng này lên: **21/43 TC là xanh giả** — một nửa màn hình.

Mọi cổng khác đếm *"TC có test nào mang mã không"*. Cổng này hỏi *"test đó có kiểm đúng thứ TC mô tả không"*. Còn 🔴 → **dừng, không chốt màn**: một TC xanh ở sai tầng nguy hiểm hơn một TC chưa có test, vì nó **trông như đã xong**.

Script tự khai giới hạn (`gioiHan`) — đọc trước khi kết luận: nó phân tầng bằng **từ ngữ**, không hiểu ngữ nghĩa; và "đúng tầng" **không** có nghĩa "kiểm đúng điều TC mô tả" — phần đó là việc của agent ở bước dưới.

## Điều kiện
- **Cần:** ≥1 màn có `plan.md` (`ba-build` sinh) — đây là **cầu nối doc↔code**: nó khai sẵn `Files:`, `Trace test:`, checkbox từng bước. Không có plan nào → script không suy được gốc code, báo và dừng; chạy `ba-build` trước.
- **Nên có:** `docs/Ho-so/dev-notes.md` (stack + lệnh test/lint do `dev-run` ghi), `10-architecture.md` (cấu trúc phân tầng). Thiếu thì vẫn chạy được nhưng agent phải mò cấu trúc.
- **Code ở đâu:** mặc định cùng repo với `docs/`. Khác chỗ → truyền `--root <thư-mục-code>`.
- Chưa dev gì (mọi file khai đều thiếu) → script báo ngay, **không spawn agent** (không có code để đọc thì đọc gì).

## Quy trình

0. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Skill này đọc code, spawn nhiều agent, chi phí cao → luôn trên ngưỡng. Chạy script trước (rẻ, 0 token) rồi trình phương án đủ 6 phần: **Hiểu** = hiện trạng script đo được (bao nhiêu màn, bao nhiêu file thiếu, bao nhiêu file code lạc); **Sẽ làm** = màn nào sẽ đối chiếu sâu, ước lượng bao nhiêu lượt agent; **Ngoài phạm vi** = không sửa code, không sửa tài liệu. `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp (chọn màn) / Hủy**. **Gọi từ `ba-accept` (đã qua cổng) → in phương án rút gọn rồi chạy tiếp, KHÔNG hỏi duyệt lại** (`conv-gates.md` → "Cổng cha bao phủ cổng con") — skill này chỉ đọc, không ghi vào tài liệu nghiệp vụ nên hỏi lại chỉ tổ làm loãng cổng của cha.

1. Đọc `conventions.md` + `conv-gates.md` (skill có cổng + spawn agent), rồi **chạy script (cơ giới, 0 token):**
   ```bash
   node .claude/skills/ba-conformance/scripts/scan-code.js [docsDir=docs] [--root <thư-mục-code>] [--plain]
   ```
   Trả JSON: mỗi màn — `plan` (số task, bước đã tick) · `files.missing` (file plan khai mà **không có trên đĩa**) · `tests.byStatus` · `tcKhongCoTrongPlan` (TC không task nào trace tới → dev không có đường biết phải làm) · `tcPlanTroSai` (plan trỏ TC ma) · `taskThieuTrace` · `moTaKhongPhaiDuongDan` (ô `Files:` viết văn xuôi); và `codeKhongCoTrongPlan` (file code không plan nào khai).
   **Đọc JSON, đừng tự đi đếm lại.** Script là nguồn cho hướng "CHƯA LÀM"; nó không phán gì, chỉ đếm.

   **Cùng lượt, chạy máy đo câu chữ (cơ giới, 0 token):**
   ```bash
   node .claude/skills/ba-conformance/scripts/scan-microcopy.js [docsDir=docs] [--root <thư-mục-code>] [--screen Sxx] [--plain]
   ```
   Lấy chuỗi người dùng thấy trong tài liệu màn (cột "Người dùng thấy gì"/"Thông báo" của ma trận lỗi `E-S..` và bảng validation trong `srs.md`; mục microcopy + nhãn nút của `design-spec.md` — hồ sơ `mini` không có file này thì chỉ soát `srs.md`) rồi tìm trong code (literal, chữ JSX, file locale). Mỗi chuỗi: `khớp` (file:line) · **`gần`** (lệch vài ký tự, lệch DẤU tiếng Việt, thiếu một câu — kèm diff) · `không thấy`. **`gần` là loại đáng soi nhất** — gần như luôn là lỗi thật (câu chữ trôi so với đặc tả); đưa từng dòng `gần` và các `không thấy` của ma trận `E-S..` vào prompt bước 3 làm ứng viên hướng **LỆCH**/**CHƯA LÀM**. `không thấy` có oan (thông điệp ghép qua hàm, map mã lỗi ở repo khác, dữ liệu ví dụ trong tài liệu) — đọc `gioiHan` trước khi kết luận. Mồi 🟡, exit 0 (không cổng); `--strict` → exit = số `gần`.

2. **Lọc ứng viên trước khi tốn token.** `codeKhongCoTrongPlan` gồm cả file hạ tầng hợp lệ (config, helper, style, migration) — **không** phải cái nào cũng là "dev lậu". Loại nhóm rõ ràng vô hại theo tên/vị trí, giữ lại file **có mùi nghiệp vụ** (nằm trong `api/`, `services/`, `pages/`, `controllers/`, `modules/`, có tên trùng thực thể trong `05-data-model.md`) cho bước 3.

3. **Spawn `ba-inference-reviewer` chế độ `conformance`** — **một lượt mỗi màn** (không gộp cả dự án: agent cần đọc `srs.md` trọn vẹn của màn đó). Trong prompt phải nói rõ:
   - **`Chế độ: conformance`** — nếu không, agent chạy chế độ `inference` mặc định và kết luận **ngược dấu** ("doc bịa" thay vì "code sai").
   - Đường dẫn `srs.md`/`usecase.md`/`test.md` của màn (hồ sơ `mini`: không có `usecase.md`, chỉ đưa `srs.md`/`test.md`) + danh sách file code **có thật** của màn đó (lấy `files.present` từ script, đừng đưa file đã thiếu).
   - Trích đoạn JSON của màn đó + danh sách ứng viên "code lạc" đã lọc ở bước 2.
   - Màn nào script báo **0 file có thật** → bỏ qua, không spawn (đã kết luận "chưa làm" từ script).
   - Có output `scan-dup-code.js` (`ba-review luật-lặp`) cho nhóm `luat-nhieu-ban`/`loc-khac` chạm màn này → giao thêm cho agent kiểm **mỗi bản** có khớp BRule không: tài liệu một luật, code hai câu trả lời là lệch đặc tả (WI-53: phạm vi xem vs phạm vi phụ trách). Nhóm `nguon-doi`/`hinh-bang` (hằng mang cột bảng, WI-44) → xếp vào hướng **KHÔNG CÓ TÀI LIỆU**: nguồn dữ liệu nào là chuẩn.

4. **Gộp kết quả** theo ba hướng, giữ nguyên mức 🔴/🟡/🟢 của agent. Trùng nhau (script báo thiếu file + agent báo chưa làm) → gộp một dòng, ghi cả hai nguồn.

5. **Ghi `docs/Ho-so/00-conformance.md`** theo `template.md` (cùng thư mục). Mỗi lần chạy **ghi đè** phần báo cáo nhưng **giữ nguyên cột "Xử lý"** mà người dùng đã điền ở lần trước (giống cách `ba-track refresh` giữ cột `dev`) — nếu không, mọi ghi chú xử lý sẽ bay sau mỗi lần chạy.

6. **Định tuyến (BẮT BUỘC nêu, không tự làm):**
   - **Lệch** mà **tài liệu đúng** → việc của dev: đề xuất `ba-task` (WI kiểu Bug) hoặc `dev-run` sửa.
   - **Lệch** mà **code đúng, tài liệu lỗi thời** → **`ba-change-request`** (đổi baseline phải qua CR, không sửa lén tài liệu cho khớp code).
   - **Chưa làm** → `dev-run <màn>` theo `plan.md`.
   - **Không có tài liệu** → `ba-change-request` nếu là nghiệp vụ thật cần bổ sung đặc tả; hoặc `ba-task` nếu là code thừa cần gỡ.
   - `taskThieuTrace`/`tcKhongCoTrongPlan` → lỗi của `plan.md`, đề xuất chạy lại `ba-build` cho màn đó.

7. **Báo cáo:** số phát hiện theo hướng × mức · màn nào sạch · việc đề xuất. Nhắc: đây là **ảnh chụp tại thời điểm chạy**, code đổi là phải chạy lại.

## Nối luồng
- **`dev-run`** — chạy xong một màn thì `ba-conformance <màn>` là bước soát tự nhiên ngay sau.
- **`ba-accept`** — GĐ4 nên chạy trước khi nghiệm thu: nghiệm thu bản code lệch đặc tả là nghiệm thu nhầm.
- **`ba-changelog`** — nó soát tài liệu-đã-chốt bị sửa; skill này soát code so với tài liệu. Hai trục vuông góc, không thay nhau.
- **`ba-reverse`** — chiều ngược hẳn: sinh tài liệu **mới** từ code. Dùng khi dự án **chưa có** tài liệu; `ba-conformance` dùng khi **đã có** và muốn biết code có bám không.

## Lưu ý
- **Không sửa gì cả** — không sửa code, không sửa tài liệu, không tự mở CR/WI. Chỉ báo cáo + định tuyến. Sửa là việc của skill khác, sau khi người dùng quyết.
- **Không phán "code sai hay tài liệu lỗi thời"** — nêu cả hai khả năng kèm bằng chứng; BA/PO chốt. Đây là chỗ dễ sai nhất: code mới hơn tài liệu không có nghĩa code đúng.
- **File code lạc không đồng nghĩa dev lậu** — hạ tầng, helper, migration thường không nằm trong plan nào. Ghi rõ mức chắc chắn.
- Script bỏ qua `node_modules`, `dist`, `build`, `.next`, `coverage`, `vendor`, `prototype`, `.claude`; gốc code **suy ra từ chính plan.md**, không hardcode `src/`.
- Tiếng Việt; ngày `YYYY-MM-DD`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
