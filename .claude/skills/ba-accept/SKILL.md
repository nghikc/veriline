---
name: ba-accept
description: Use when đã dev xong một phase và cần NGHIỆM THU & PHÁT HÀNH trọn một lệnh — UAT, release, RTM, gate, ký; chế độ `uat` kế hoạch UAT, `release [phase]` gói phát hành, `userguide` cẩm nang vận hành.
---

# ba-accept — Orchestrator nghiệm thu & phát hành (Giai đoạn 4)

## Chế độ
| Gọi | Làm gì |
|---|---|
| `ba-accept [<phase>]` | **Nghiệm thu trọn** (không đối số chế độ) — chuỗi Quy trình 0–10 bên dưới. Cần dev: phạm vi `docs` → từ chối |
| `ba-accept uat` | Kế hoạch nghiệm thu UAT cấp dự án → `docs/Ho-so/09-uat.md` (trước là `ba-uat`) |
| `ba-accept release <phase>\|full\|--all` | Gói phát hành một phase (roadmap + tiêu chí nghiệm thu) → `docs/Ho-so/releases/<phase>.md` + `.html` (trước là `ba-release`) |
| `ba-accept userguide` | Cẩm nang vận hành Diátaxis, mục lục chờ duyệt → `docs/Ho-so/userguide/` (trước là `ba-userguide`) |

Đối số đầu là `uat`/`release`/`userguide` → nhảy thẳng tới mục "Chế độ …" tương ứng ở cuối file, **không** chạy chuỗi trọn. Ba chế độ này là phần **bàn giao tài liệu** — chạy được cả khi phạm vi `docs`.

## Mục tiêu
**Khép vòng đời BA:** từ code đã dev xong (`dev-run`) → nghiệm thu người dùng → đóng gói phát hành theo phase → cập nhật truy vết → xuất bản. Skill điều phối: lần lượt invoke skill con, dừng ở gate nếu có gap. Đây là **Giai đoạn 4** (Nghiệm thu & Vận hành), đứng **sau `dev-run`**.

## Cách gọi
`ba-accept <phase>` (vd `ba-accept phase-1`) · `ba-accept` (tự nhận phase đang tới lượt từ `08-roadmap.md` + trạng thái `dev` trong tracking).

## Tiền đề
- **Phạm vi dự án** (đọc bằng `node .claude/skills/ba-toolkit/scripts/profile.js docs`, `conv-gates.md` → "Hồ sơ dự án" → "Phạm vi"): **`Phạm vi: docs` → TỪ CHỐI chế độ nghiệm thu trọn** — dự án chỉ tài liệu không có code để nghiệm thu, không có `ba-conformance`/`ba-test-e2e`/cột `dev`. Báo và dừng, gợi phần bàn giao tài liệu: `ba-accept uat` (kịch bản nghiệm thu cho đội build/khách) · `ba-accept release <phase>` (gói phát hành) · `ba-accept userguide` (cẩm nang, ảnh mockup tới khi có app) · `ba-review all` (gate bàn giao).
- Các màn thuộc phase có **`dev = ✅`** trong `docs/00-tracking.md` (`dev-run` đã chạy xong). Còn màn `dev = ⬜/⚠️` → cảnh báo, hỏi người dùng có nghiệm thu **phần đã xong** không.
- Cần `docs/Ho-so/08-roadmap.md` (chia phase) cho bước đóng gói. Thiếu → route `ba-discover roadmap` trước.

## Quy trình
Đọc `conventions.md` + `conv-gates.md` của `ba-toolkit`.

0. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Đọc `08-roadmap.md` (phạm vi phase) + `00-tracking.md` (màn nào ✅/⚠️, cột `dev`) + `09-uat.md` nếu có TRƯỚC → trình phương án đủ 6 phần; phần "Sẽ làm" nêu rõ: **phase nào nghiệm thu**, bao nhiêu màn/TC trong phạm vi, có chạy E2E thật không, có xuất bản ra ngoài không (**`ba-doc-public` = đẩy tài liệu LÊN INTERNET — phải hỏi riêng, không gộp**), có viết cẩm nang không → `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Giai đoạn 4 chạm tài liệu đã chốt + publish ra ngoài → **luôn phải chờ duyệt**.
0b. **Đối chiếu code ↔ đặc tả TRƯỚC khi nghiệm thu (BẮT BUỘC).** Invoke `ba-conformance` cho các màn của phase → `docs/Ho-so/00-conformance.md`. Còn phát hiện **🔴** (lệch quy tắc nghiệp vụ/phân quyền, hoặc code có hành vi không ai duyệt) → **DỪNG**, xử lý trước: tài liệu đúng thì sửa code (`ba-task` kiểu Bug), code đúng thì `ba-change-request`. *Nghiệm thu một bản code lệch đặc tả là nghiệm thu nhầm — UAT chỉ kiểm cái người dùng thấy, không kiểm được quy tắc ẩn trong code.* Chưa deploy được / chưa có code → bỏ qua bước này, ghi rõ trong báo cáo cuối là **chưa đối chiếu**. **Hồ sơ `lite`** (`conv-gates.md` → "Hồ sơ dự án") → bước này **không bắt buộc**: hỏi người dùng có muốn chạy không, họ từ chối thì ghi `⚙️ lite: bỏ đối chiếu code` vào báo cáo ký nghiệm thu — người ký cần biết bản này chưa được soát code.

   Muốn một **con số** cho báo cáo nghiệm thu ("phase này xong bao nhiêu % đặc tả") → `ac-eval all` (chấm từng TC/AC, điểm so sánh được, `docs/Ho-so/eval/all-<ngày>.md`) — tùy chọn, không thay `ba-conformance`.
   Chạy kèm **cổng tầng TC** — rẻ và bắt lớp lỗi mà `ba-conformance` cũng có thể bỏ sót:
   ```bash
   node .claude/skills/ba-conformance/scripts/check-tc-layer.js docs --root . --plain
   ```
   Còn xanh giả → **không nghiệm thu**: nghiệm thu một màn có TC xanh ở sai tầng là ký nhận một thứ chưa được kiểm ở nơi người dùng thật sự chạm vào.
0c. **NFR giao diện (accessibility/hiệu năng) — khi app đã deploy được:** `ac-audit-web <URL>` (hoặc `ac-audit-web all` trên html-design nếu chưa có app) → `docs/Ho-so/audit/` là bằng chứng cho NFR accessibility/performance và các TC `Manual` về giao diện; 🔴 WCAG chưa sửa → ghi vào báo cáo ký như 🟠 có mốc, không lờ. Tùy chọn khi phase không có NFR loại này.
1. **(Kịch bản nghiệm thu)** Chưa có `docs/Ho-so/09-uat.md` hoặc thiếu kịch bản cho phase → chạy chế độ `uat` (mục "Chế độ `uat`" — soạn/cập nhật kịch bản UAT cấp dự án, phủ **mọi `FR` Must của phase**).
1b. **(E2E — tùy chọn, chỉ khi app đã deploy được)** với mỗi màn của phase: chưa có script E2E → invoke `ba-test-e2e <màn>`; đã có nhưng cột `e2e` = ⚠️ (test.md đổi sau khi sinh) → chạy lại để đồng bộ. Sau đó **chạy thật** bộ E2E trên app đã deploy — kết quả là bằng chứng cho các TC `Auto` ở bước 2. Không deploy được → bỏ qua, mọi TC coi như `Manual`.
2. **Chạy UAT.** Với mỗi kịch bản `UAT-..` của phase: ghi kết quả **Pass / Fail / Blocked** vào `09-uat.md`. TC `Auto` tham chiếu kết quả `dev-run` (test.md) **và kết quả chạy `e2e.spec.ts` ở bước 1b nếu có**; TC `Manual` → xuất **checklist chạy tay** cho người dùng. UAT Fail do **yêu cầu sai** → dừng, đề xuất `ba-change-request` (không tự sửa tài liệu).
3. **Gate nghiệm thu:** mọi `FR` **Must** của phase phải có ≥1 `UAT` **Pass**; còn Fail/Blocked ở Must → **DỪNG**, báo người dùng.
4. **(Đóng gói phát hành)** chạy chế độ `release <phase>` (mục "Chế độ `release`") → `docs/Ho-so/releases/<phase>.md` + HTML (ghép roadmap(phase)+UAT(phase); Gantt re-level theo nhân sự).
5. **(Truy vết)** invoke `ba-trace` → sinh/cập nhật RTM `docs/Ho-so/00-traceability.md` (độ phủ end-to-end BR→…→TC).
6. invoke `ba-track refresh` (đồng bộ ma trận + cột "Cập nhật cuối"; giữ nguyên cột `dev`).
7. **Gate cuối:** invoke `ba-review all` (kèm `ba-consistency-reviewer` project-mode) — theo "Quy ước gate" của `conventions.md`. Còn 🔴/🟡 → dừng/sửa rồi chạy lại. **Kèm cổng thu nợ 🟠 cuối cùng:** mọi gap 🟠 còn lại đều đã tới hạn ở đây (`Mốc = ba-accept`: `e2e` lệch `test.md`, `plan.md` không đủ căn cứ đối chiếu — và cả nợ `ba-build` nào lọt qua) → **DỪNG**, không ký nghiệm thu khi còn nợ chưa thu. Chỉ 🟢/sạch → tiếp.
7b. **(Cẩm nang vận hành — tùy chọn)** hỏi người dùng có viết/cập nhật cẩm nang cho phần vừa nghiệm thu không → chạy chế độ `userguide` (mục "Chế độ `userguide`" — đọc ngược tài liệu các màn ✅ → mục lục Diátaxis → HARD STOP duyệt → viết trang + ảnh → `docs/Ho-so/userguide/*.html`). Phase đầu → viết mới; phase sau → update mode.
8. **(Xuất bản)** trước khi build portal, chạy `node .claude/skills/ba-portal/scripts/render-check.js docs --json`: exit 1 → 🟡 chặn gói phát hành (portal gửi khách không được có hộp đỏ) — ghi danh sách `file:dòng` vào biên bản gate; exit 2 → 🟡 "lỗi-đo", chạy lại/kiểm Chrome trước khi ký; `bỏQua` → ghi rõ trong biên bản "cú pháp sơ đồ chưa kiểm (không Chrome)", không chặn. Sạch → invoke `ba-portal` làm mới cổng đọc; *(tùy chọn)* `ba-doc-public` đẩy `releases/<phase>.html`, portal, hoặc cẩm nang `userguide` online (mỗi cái một slug).
8b. **(Ảnh chụp trước khi ký — khuyến nghị)** invoke `ba-dashboard` → `docs/Ho-so/00-dashboard.md`: một trang gom tiến độ/CR/WI/UAT/gap/đối chiếu code tại đúng thời điểm nghiệm thu. Đây là **bằng chứng trạng thái** kèm bảng ký, để về sau còn đối chiếu "lúc ký thì dự án đang thế nào".
9. **Ký nghiệm thu.** Tổng kết: FR Must đã Pass · độ phủ E2E (cột `e2e` của các màn trong phase) · gói phát hành (`.md`+`.html`) · RTM · gap còn lại. Xuất **bảng ký** (vai trò từ `09-uat.md`). Nếu phase gắn CR → cập nhật sổ `00-cr.md` (Đã triển khai/Đóng). **Nhắc 2 mục sống của gói phát hành:** kế hoạch Chuyển đổi & Go-live (Mục 7) đã có phụ trách chưa, và **lịch Đo lường sau phát hành (Mục 8)** — hẹn ngày đo cụ thể với người dùng; kết quả đo lệch mục tiêu → `ba-change-request`, không lặng lẽ bỏ qua.

10. **(Trả số về toolkit — best-effort)** chạy `node .claude/skills/ba-export/scripts/report.js --plain` → `.claude/ba-toolkit-report.json`: số liệu **ẩn danh** của dự án này (hồ sơ, gap theo mức, CR/WI, **file toolkit bị sửa tại đích**, tần suất skill). Đây là chỗ duy nhất toolkit biết được nó chạy ra sao ngoài đời thay vì suy đoán từ đồ thị tham chiếu tĩnh. **Hỏng thì im và đi tiếp** — báo cáo không bao giờ được chặn nghiệm thu.

## Lưu ý
- Chế độ trọn chạy **sau `dev-run`**; do người dùng trigger, không tự chạy sau dev. Ba chế độ `uat`/`release`/`userguide` chạy lẻ được bất cứ lúc nào đủ điều kiện.
- **Nghiệm thu theo PHASE** — chỉ chức năng/kịch bản của phase, không nghiệm thu chức năng ngoài phase.
- UAT Fail do yêu cầu sai → `ba-change-request` (vòng đời CR + gate consistency), KHÔNG tự đổi tài liệu ở đây.
- **`ba-test-e2e` (bước 1b) có điều kiện:** cần app deploy được + `test.md` của màn đã ổn định. script E2E là **code** (nằm ở `e2e/tests/`, ngoài `docs/`), tracked ở cột `e2e` — không tính vào bộ file hoàn thành của hồ sơ (9/9 ở `full`/`lite` · 5/5 ở `mini`), không chặn cổng nghiệm thu (chỉ là bằng chứng bổ trợ).
- **Buổi nghiệm thu/ký là một cuộc họp:** ghi chú thô → `ba-discover meet` → MoM `docs/Ho-so/meetings/<ngày>-nghiem-thu-<phase>.md` (chốt `DEC` ký hay không ký + `ACT` tồn đọng); `ACT` là thay đổi chức năng → `ba-change-request`, đừng để trôi trong ghi chú.
- Đây là **Giai đoạn 4** khép vòng đời: `ba-discover` (GĐ1) → `ba-init` (GĐ2) → `dev-run` (GĐ3) → **`ba-accept` (GĐ4)**.
- Tiếng Việt khi báo cáo.
## Chế độ `uat` — Kế hoạch nghiệm thu người dùng cấp dự án
**Đọc `references/uat.md` trước khi chạy** — đủ quy trình 7 bước, kỹ thuật, tiêu chí chất lượng. Tóm tắt:
- Sinh `docs/Ho-so/09-uat.md` (một file cho cả dự án) theo `assets/uat-template.md`: kịch bản `UAT-01..` **end-to-end xuyên màn**, ngôn ngữ nghiệp vụ, do PO/người dùng chạy — KHÁC `ba-test` (TC kỹ thuật per màn).
- Nguồn: `01-requirements.md` (FR/NFR/BR + MoSCoW), `03-overview.md`, tiêu chí GWT của từng màn. **Hồ sơ `mini`** (`conv-gates.md` → "Hồ sơ dự án"): GWT gom từ mục "Tiêu chí chấp nhận" của `srs.md` — các file màn bị bỏ ở `mini` không tồn tại theo thiết kế, nói ra trong báo cáo (`⚙️ mini: …`).
- Tiêu chí gom theo **luồng nghiệp vụ**, không theo màn; tiêu chí mơ hồ → `ba-discover brainstorm` (điều kiện nghiệm thu) trước khi viết, không tự suy.
- Mỗi kịch bản: tiền điều kiện · bước nghiệp vụ · **kết quả mong đợi đo được** (cấm "chạy ổn") · dữ liệu mẫu cụ thể · trace `FR`/`BR`/`UC` · trạng thái `Chưa chạy`.
- **RTM hai chiều**: mỗi `FR` Must ≥1 `UAT`, không `UAT` mồ côi. **Checklist ký** đo được + bảng vai trò ký (PO · BA · khách · QA lead).
- **Xác nhận giả định (BẮT BUỘC)** `GĐ-..` qua `AskUserQuestion`; batch → `⚠️ chưa xác nhận`. Footer `## Thuật ngữ` + bổ sung `00-glossary.md`.

## Chế độ `release` — Gói phát hành theo phase
**Đọc `references/release.md` trước khi chạy** — đủ quy trình, luật Gantt re-level, chức năng bị chẻ. Tóm tắt:
- Gọi `ba-accept release <phase>` (một phase → `releases/<phase>.md`) · `release full` (mọi phase một file → `all-phases.md`) · `release --all` (mỗi phase một file).
- **Bắt buộc `docs/Ho-so/08-roadmap.md`** — thiếu → dừng, route `ba-discover roadmap`. `09-uat.md` nên có; thiếu → rút tạm tiêu chí GWT các màn + ghi chú "nên chạy `ba-accept uat`".
- **Cổng phương án (BẮT BUỘC)** sau khi đọc nguồn: phase nào, `F..` nào, file TẠO vs GHI ĐÈ, có render HTML, có đẩy online không → `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. `full`/`--all` luôn chờ duyệt. **Gọi từ chuỗi nghiệm thu trọn (đã qua cổng) → in phương án rút gọn rồi chạy tiếp, KHÔNG hỏi duyệt lại** (`conv-gates.md` → "Cổng cha bao phủ cổng con") — **trừ nhánh đẩy online `ba-doc-public`**, luôn hỏi riêng vì đưa tài liệu ra Internet.
- Mỗi phase: chỉ phần của phase (roadmap + `UAT-..` neo theo **FR + MoSCoW**, không theo mã `F`); Mục 7 Chuyển đổi & Go-live (`TR-..`) · Mục 8 Đo lường sau phát hành (lịch đo cụ thể). Gantt **re-level theo nhân sự** (`section` = track/người, trục tuần tương đối, không bịa ngày).
- Viết theo `assets/release-template.md` → render `ba-portal --single docs/Ho-so/releases/<phase>.md docs/Ho-so/releases/<phase>.html` → (tùy chọn) `ba-doc-public … --slug roadmap-<phase>`.

## Chế độ `userguide` — Cẩm nang vận hành
**Đọc `references/userguide.md` trước khi chạy** — đủ bảng nguồn Diátaxis, 10 bước hai giai đoạn, luật ảnh, tiêu chí chất lượng. Tóm tắt:
- Cho người vận hành (admin/CSKH/người dùng cuối) — dạy CÁCH DÙNG, khác `ba-portal` (tài liệu BA) và chế độ `release` (kế hoạch + nghiệm thu). Cần `02-functions.md` + `00-tracking.md` + ≥1 màn ✅/⚠️; màn ⬜ không có trang. Phạm vi `docs` vẫn chạy được (tài liệu bàn giao) — chưa có app thì ảnh là mockup có ghi chú.
- **GĐ1 — mục lục, KHÔNG ghi file nội dung:** inventory nguồn → hỏi phạm vi (đối tượng, luồng, giọng, độ chi tiết) → mục lục 6 trụ (how-to tiêu đề bắt đầu bằng động từ, không trộn loại) → **gate agent `ba-manual-reviewer`** (prompt kèm nguyên văn mục lục + đường dẫn nguồn + khuôn findings; ≤2 vòng).
- **HARD STOP = Cổng phương án của chế độ này:** in mục lục + 6 phần phương án + dòng **`Ước tính: …`** từ `node .claude/skills/ba-toolkit/scripts/cost.js estimate ba-accept` (số của chế độ userguide) → **DỪNG** chờ `tiếp`/`ok`. Không có nhánh bỏ chờ. Gọi từ chuỗi nghiệm thu trọn (đã qua cổng) **vẫn phải HARD STOP** — ngoại lệ cố ý của "Cổng cha bao phủ cổng con": cha chưa nhìn thấy mục lục thì không duyệt thay được.
- **GĐ2 — viết:** ghi `docs/Ho-so/userguide/<bundle>/index.md` (mọi trang `pending`) trước tiên → trang `pages/<slug>.md` theo `assets/userguide-section.md` (slug không tiền tố số; thiếu nguồn → `<!-- TBD OQ-n -->`, không bịa) → ảnh (A engine chụp app thật · B người dùng tự chụp · C mockup chỉ khi chưa deploy, BẮT BUỘC ghi chú) → `data.js` + copy `assets/userguide-preview.html` thành cửa vào → gom OQ.
- Engine ảnh: `node .claude/skills/ba-accept/scripts/engine/check-playwright.mjs` (thiếu Playwright → **hỏi** rồi mới `npm install`/`npx playwright install chromium`), chụp bằng `scripts/engine/capture.mjs <job.json>`. Clip có giọng đọc → `ba-userguide-video`.

## Kết thúc
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
