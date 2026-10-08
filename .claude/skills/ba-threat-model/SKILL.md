---
name: ba-threat-model
description: Use when đã có 10-architecture.md và cần MÔ HÌNH ĐE DOẠ — ranh giới tin cậy, tài sản, kẻ tấn công, đường lạm dụng TM-.. trace NFR/ADR; ra 00-threat-model.md.
---

# ba-threat-model — Kiến trúc đã chốt bị tấn công ở đâu, bằng tài liệu thật

> ⚗️ **Thử nghiệm** (canon `skills.experimental`, 25/09/2026) — `ba-export` mặc định không cài (`--with-experimental` để cài). Vì sao: phần LLM (TM-.., biện pháp trace) chưa chạy trên dự án thật; `scan-threat.js` chạy một lần ở dự án desktop và ra 0 tài sản — sai hình, chưa phải bằng chứng. Skill khác (`ba-architecture`, `ba-next`, `ac-judge`) chỉ gợi/đọc nó *nếu đã cài*. Thoát nhãn khi: chạy thật trên một dự án tiêu dùng **và** có bằng chứng bắt được lỗi thật (commit/file:line ở dự án đó) → gỡ tên khỏi khoá registry `skills.experimental`.

## Mục tiêu
`ba-architecture` chốt *hệ thống dựng thế nào*; không tài liệu nào trả lời *nó bị đánh ở đâu và đã chặn chưa*. Kết quả là bảo mật chỉ xuất hiện dưới dạng vài `NFR` rời rạc, `BRule` phân quyền rải trong từng màn, và một ADR nói "guard `org_id`" mà không ai liệt kê chuyện gì xảy ra khi quên. Skill này sinh `docs/Ho-so/00-threat-model.md`: **ranh giới tin cậy** (từ sơ đồ ngữ cảnh/triển khai) × **tài sản** (từ mô hình dữ liệu + NFR) × **kẻ tấn công theo vai** (từ StR/SH/enum vai trò) → **đường lạm dụng `TM-..`** có mức, có biện pháp **trace về `NFR`/`BRule`/`ADR`** hoặc **mở `WI`/`OQ`/`PD`** khi chưa có. STRIDE là khung để hỏi, không phải sáu ô phải điền. Cơ chế lấy từ security-threat-model + security-best-practices (openai/skills, MIT): *mọi khẳng định có neo trong repo* — ở GĐ2, repo là tài liệu đã chốt.

Sản phẩm thứ hai: **§6 checklist bảo mật cho review code**, cắt từ `.claude/skills/ba-toolkit/references/security-checklist.md` theo đúng stack ADR đã chốt — `ac-judge` lượt B đọc bảng này khi review diff.

## Điều kiện
- **Cần:** `docs/10-architecture.md` với ADR **Accepted** (qua cổng chốt của `ba-architecture`) — ranh giới lấy từ sơ đồ §4, kiểm soát lấy từ §8/ADR. Chưa có kiến trúc → vẫn chạy được từ `01-requirements.md` + `05-data-model.md` (+ `srs.md` các màn), nhưng §1 chỉ có ranh giới suy từ actor ↔ hệ thống ↔ dữ liệu và phải ghi rõ `⚠️ chưa có kiến trúc — ranh giới sẽ đổi sau ba-architecture`.
- **Nên có:** `05-data-model.md` (tài sản), `srs.md` các màn (BRule phân quyền/phiên), `12-api-integration.md`/`11-integration.md` (hệ ngoài `EXT`), `Ho-so/04-stakeholders.md` (vai), `00-backlog.md`/`00-decisions.md` (nơi ghi nợ).
- **Hồ sơ dự án** (`conv-gates.md` → "Hồ sơ dự án", đọc qua `ba-toolkit/profile.js`): `lite`/`mini` không tắt skill này — nguồn đọc (01/05/10 + `srs.md`) có ở mọi hồ sơ. Khác biệt duy nhất: `lite`/`mini` **tắt sổ WI** → nợ `Mở` ghi `PD-..` vào `00-decisions.md` (hoặc `CR` nếu là đổi baseline), không mở WI; `scan-threat.js` in `⚙️ hồ sơ lite: sổ WI tắt — nợ Mở ghi PD…` để không ai im lặng bỏ WI. **Phạm vi `docs`** vẫn có nghĩa: mô hình đe doạ là tài liệu bàn giao cho đội build — chỉ bỏ câu "ac-judge sẽ đọc §6".
- Không có cả 01/05/10 → `scan-threat.js` exit ≠ 0, dừng: chưa có gì để mô hình hoá.

## Quy trình

0. **Cổng phương án** (`conv-gates.md` → "Cổng phương án"). Skill ghi **một** file `docs/Ho-so/00-threat-model.md` (+ dòng `WI`/`PD` qua `ba-task`/`00-decisions.md`) → **dưới ngưỡng nhỏ**: chạy script trước (bước 1), **IN** phương án đủ sáu phần (Đã đọc · Hiểu = số tài sản/ranh giới/NFR/BRule script đo được · Sẽ làm = `TẠO` hay `GHI ĐÈ` `00-threat-model.md`, số WI/PD dự kiến mở · Giả định · Câu hỏi chặn · Ngoài phạm vi = không sửa `srs.md`/`01-requirements.md`/ADR, không đọc code) rồi làm tiếp, **không chờ**. **Trừ khi** `00-threat-model.md` **đã có nội dung** (`scan-threat.js` (f) báo N TM) → đây là ghi đè file có nội dung, **phải chờ duyệt** `AskUserQuestion` **Chạy / Sửa phương án / Hủy**; phương án phải nói rõ TM nào giữ trạng thái (`Chấp nhận`/`Mở` là phần sống — không được reset). Gọi từ orchestrator đã qua cổng → in rút gọn, không hỏi lại.

1. **Gom cơ giới (0 token):**
   ```bash
   node .claude/skills/ba-threat-model/scripts/scan-threat.js docs --plain
   ```
   Đọc output, **không tự đi đếm lại**: (a) trường nhạy cảm theo nhóm · (b) NFR bảo mật + ràng buộc pháp lý · (c) BRule phân quyền/phiên theo màn · (d) `EXT` · (e) cạnh xuyên vùng của từng sơ đồ + ADR + **nhóm checklist theo stack** · vai trò · (f) hiện trạng `00-threat-model.md` nếu đã có. Script đếm, không phán: trường trúng từ khoá mà không nhạy cảm (`phai_doi_mat_khau` là cờ) do bạn loại — ghi lý do ở cuối §2.

2. **Đọc nguồn** — đúng những file script liệt kê ✓: `10-architecture.md` (§1 driver, §4 sơ đồ, §7 API/authz, §8 cross-cutting, §9 triển khai, ADR Accepted), `05-data-model.md` (chỉ thực thể script gọi tên + thực thể có `to_chuc_id`/tenant), `01-requirements.md` §5.2 + §7, các `srs.md` có BRule script liệt kê (mục "Quy tắc nghiệp vụ" + "Tác nhân & hệ thống ngoài"), `12-api-integration.md` §4–§6 nếu có `EXT`. Đọc `references/stride-hints.md`.

3. **§1 Ranh giới tin cậy.** Mỗi cạnh xuyên vùng ở (e) là một ứng viên; gộp cạnh cùng cặp vùng, thêm ranh giới sơ đồ không vẽ (cron ↔ DB, migration, CI/CD ↔ prod, backup, proxy ↔ API — danh sách ở `stride-hints.md`). Mỗi dòng `B<n>`: kênh/giao thức, ai đi qua, **kiểm soát đã chốt có mã** (`NFR`/`ADR`/`BRule`), nguồn. Vẽ **một** `flowchart` (LR/TB) — **mỗi vùng tin cậy một `subgraph`**, cạnh xuyên vùng mang nhãn `B..`, nhãn tiếng Việt **có dấu** bọc `"…"`, ID nút ASCII (`conventions.md` → "Bộ chọn sơ đồ Mermaid"). Không dùng `architecture-beta`/`C4Context`.

4. **§2 Tài sản.** Từ (a) sau khi loại; thêm tài sản không phải bảng dữ liệu: khoá ký JWT/bí mật cấu hình (ADR auth), nhật ký audit (toàn vẹn), tính sẵn sàng của thành phần điểm-hỏng-đơn (ADR nói "in-process", "một replica"). Mỗi `A<n>`: ở đâu (thực thể.trường / thành phần), vì sao quan trọng **theo nghiệp vụ này** (không chép định nghĩa PII), mục tiêu C/I/A, nguồn có mã.

5. **§3 Kẻ tấn công theo vai.** Vai = StR/SH/enum script in + ba vai hay quên (kẻ lạ chưa đăng nhập · người vận hành · hệ ngoài bị chiếm). **Cột "KHÔNG có năng lực" bắt buộc** và phải trích `BRule`/`NFR` làm căn cứ — đây là thứ giữ mức không bị thổi.

6. **§4 Bảng đe doạ `TM-01…`** — ghép `B × A × vai` theo câu hỏi STRIDE ở `stride-hints.md`. Mỗi dòng: ranh giới `B..`, tài sản `A..`, chữ STRIDE, **đường lạm dụng dạng `ai → bước → bước → hậu quả`** (bắt buộc có `→`), mức `Cao/Vừa/Thấp` (khả năng × tác động, **đã trừ kiểm soát đang có trong tài liệu chốt**, chưa trừ WI mở), biện pháp có trace, trạng thái. Ngưỡng: mỗi ranh giới 1–3 đe doạ thật; dự án 6 màn ~6–12 dòng; **không** ghi đe doạ mà kẻ tấn công ở §3 không với tới. Đã có file cũ → **giữ nguyên mã và trạng thái** TM cũ còn đúng, chỉ thêm/cập nhật; TM không còn đúng (ranh giới biến mất) ghi `Chấp nhận — <ai> · <ngày> · hết áp dụng vì …`, không xoá dòng.

7. **§5 Biện pháp & nợ.** `Giảm nhẹ` → trích **vị trí** kiểm soát chạy (tầng repository, middleware, cổng) để `ac-judge`/`ac-verify` tìm trong code. `Mở` → mở sổ **trước khi ghi trạng thái**: `ba-task` (WI — hồ sơ `full`), hoặc `PD-..` vào `00-decisions.md` (quyết định người mới trả lời / hồ sơ `lite`·`mini`), hoặc `OQ` khi là câu hỏi cho đối tác; ghi mã vào cột Biện pháp và bảng "Còn nợ" kèm **mốc** (`ba-build` · `dev-run <màn>` · `ba-accept`). **Không** viết biện pháp mới thẳng vào `srs.md`/`01-requirements.md`/ADR — đó là đổi baseline → `ba-change-request`. `Chấp nhận` → ai (`SH-..`/tên) + ngày + lý do.

8. **§6 Checklist bảo mật cho review code.** Mở `.claude/skills/ba-toolkit/references/security-checklist.md`, lấy **đúng các nhóm** ở dòng `nhóm checklist:` của script; chọn mục có tài sản/ranh giới tương ứng trong §1–§2, viết lại cột "Soi ở đâu" theo cây thư mục `10-architecture.md` §10, nối `TM`. Mục không áp thì ghi rõ vì sao (vd `SEC-HTTP-03 không áp — Bearer header, ADR-03`) thay vì lặng lẽ bỏ. Trên 25 mục là chưa cắt.

9. **Cổng máy — chạy trước khi báo cáo:**
   ```bash
   node .claude/skills/ba-threat-model/scripts/check-threat.js docs --plain
   ```
   Exit ≠ 0 → sửa đúng dòng script chỉ (trace tới mã không tồn tại, `Giảm nhẹ` không có NFR/BRule/ADR, `Mở` không có sổ, `Chấp nhận` không ai ký, ranh giới không TM, placeholder). Không nộp file chưa qua cổng; không ép xanh bằng cách xoá TM có căn cứ.

10. **Báo cáo:** số TM theo mức × trạng thái · ranh giới/tài sản · WI/PD đã mở · giả định đổi mức nhiều nhất · nhắc rằng đây là **ảnh chụp kiến trúc** — ADR mới/supersede, thực thể mới, `EXT` mới, màn mới có phân quyền → chạy lại (`ba-change-request`/`ba-add-screen` nên nhắc). Không chạm `00-tracking.md` (tài liệu cấp dự án, không phải màn).

## Tiêu chí chất lượng (BẮT BUỘC)
- **Neo hay im:** mọi ranh giới, tài sản, kiểm soát có nguồn (file + §/mã). Không bịa component, endpoint, kiểm soát mà tài liệu không có; thiếu thì thành `GĐ`/`OQ` ở mục cuối, không thành khẳng định.
- Mỗi `TM` đủ 8 cột và qua `check-threat.js` exit 0; đường lạm dụng là **chuỗi bước** của một vai ở §3, không phải tên loại lỗ hổng.
- Mức đã trừ kiểm soát **đã chốt**; cột "KHÔNG có năng lực" ở §3 là căn cứ hạ mức, có trích `BRule`/`NFR`.
- `Giảm nhẹ` chỉ khi kiểm soát có mã trong tài liệu **Accepted**; `Mở` chỉ khi đã có `WI`/`PD`/`OQ`/`CR` thật; `Chấp nhận` có ai + ngày.
- §6 chỉ chứa nhóm đúng stack; mỗi mục có "soi ở đâu" bằng đường dẫn thật của dự án.
- Tiếng Việt có dấu, kể cả trong sơ đồ; không lộ giá trị bí mật nào (chỉ ghi *có/ở đâu*).

## Ranh giới
- **`ba-architecture`**: chốt kiến trúc và ADR — skill này **soi kiến trúc đó bị tấn công ở đâu**, không đề xuất đổi stack; muốn đổi → ADR mới qua `ba-architecture`/`ba-change-request`.
- **`ac-judge`** (lượt B Bảo mật): review **diff code** — dùng **§6 của `00-threat-model.md`** (đã cắt theo stack) làm bảng soi có chủ đích; chưa có file thì đọc nhóm `chung` ở `.claude/skills/ba-toolkit/references/security-checklist.md`. **Orchestrator sẽ cắm đường dẫn `.claude/skills/ba-toolkit/references/security-checklist.md` vào `ac-judge`**; skill này không sửa `ac-judge`. Judge vẫn giữ ngưỡng của nó (khai thác được thật mới báo) — checklist không biến "thiếu hardening" thành finding.
- **`ac-verify`/`ba-conformance`**: chứng minh kiểm soát `Giảm nhẹ` **có trong code** (guard, rate-limit, hash) — skill này chỉ nói kiểm soát *phải* ở đâu.
- **`ba-review`**: soát độ phủ/truy vết tài liệu — **không soát bảo mật**, không đọc file này ngoài việc thấy nó tồn tại.
- **`ba-feasible`**: khả thi của đặc tả để viết code; không nhìn đe doạ.
- **`ba-api-integration` §6 readiness**: checklist vận hành trước production cho từng `EXT` — ở đây `EXT` chỉ là một ranh giới `B..` với đe doạ cụ thể.

## Lưu ý
- **Không phái agent**: nguồn là tài liệu, một lượt đọc đủ; review độc lập của mô hình đe doạ là việc người (kiến trúc sư/AppSec) — skill không giả vờ thay. Sau khi có code, `ac-judge`/`ba-conformance` là nơi kiểm chéo.
- Kẻ tấn công **không** bao gồm "nhà phát triển cố ý gài" — ngoài phạm vi mô hình này; ghi ở "Ngoài phạm vi" của phương án.
- DoS chỉ ghi khi `NFR` sẵn sàng có con số và ranh giới có kẻ lạ đi qua; `ac-judge` sẽ không báo DoS nên biện pháp DoS đi đường hạ tầng (WI), không đường review code.
- Bố cục cũ (không `Ho-so/`): `docpath.js` tìm thấy ở gốc `docs/` thì ghi đè tại chỗ, không tự di chuyển.
- Đổi kiến trúc/dữ liệu/hệ ngoài → chạy lại; trạng thái `TM` cũ là phần sống, mang sang.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
