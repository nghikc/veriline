---
name: ac-audit-web
description: Use when cần AUDIT giao diện người dùng thấy (html-design.html, prototype.html hay app thật qua URL) theo WCAG 2.1 AA, UX, Core Web Vitals; ghi phát hiện AU-nn có file:line.
---

# ac-audit-web — Audit cái người dùng thấy: WCAG · UX · Core Web Vitals

> `lighthouse.js` (đo Core Web Vitals) chưa chạy CLI thật trên dự án nào — `scan-html.js` đã bắt lỗi thật (10 FORM-LABEL ở dự án desktop) và agent `ac-auditor` dùng bình thường.

## Mục tiêu
Toolkit có ba tầng giao diện mà chưa tầng nào được soát theo chuẩn: `html-design.html` mỗi màn (`ba-html-design`, tĩnh, mở bằng file), `docs/Ho-so/prototype.html`/wireframe (`ba-proto-html`, `ba-wireframe-lofi`), và app thật sau `dev-run`. `check-shell.js` chỉ soát **khung** giống nhau giữa các màn; `ac-judge` soi **code**; không ai hỏi *"người dùng khiếm thị/không chuột/đang ở 3G có dùng được màn này không"*. Skill này lấy cơ chế của web-accessibility · web-design-guidelines · core-web-vitals/perf-lighthouse (tech-leads-club) và ghép vào toolkit: **máy đếm trước** (`scan-html.js` tĩnh không cần trình duyệt; `lighthouse.js` đo CWV khi có Chrome + lighthouse, không có thì nói "không đo được", không bịa số), **agent mới mở file/trang** ghi từng phát hiện `AU-nn` có `file:line` · tiêu chí WCAG `x.y.z`/guideline · mức · cách sửa · trace về `R-S..`/`NFR-..`/`design-spec`, và **`check-audit.js` từ chối** bản audit thiếu tiêu chí hay verdict ĐẠT khi còn 🔴. Kết quả là **bằng chứng** cho NFR accessibility/performance (`ba-accept`) và cho TC `Manual` về giao diện (`ac-eval` nâng điểm được). Luật đội agent: `conv-gates.md` → "Đội agent".

## Điều kiện
- Có ít nhất một đầu vào: `docs/Screen-spec/<…>/html-design.html` của màn (`ac-audit-web S01`), mọi html-design (`ac-audit-web all`), `docs/Ho-so/prototype.html`/`wireframe.html` (`ac-audit-web proto`), hoặc URL `http(s)://` app đang chạy (`ac-audit-web https://…`). Không có gì → báo và dừng, không audit ascii-screen.
- Với màn: `srs.md` tồn tại (bảng phần tử, ma trận lỗi `E-S..`, BRule); `design-spec.md` nếu có (hồ sơ `mini` không có — agent đọc `srs.md`, nói ra khi bỏ qua); `01-requirements.md` phần NFR; `test.md` để nối TC `Manual`.
- CWV chỉ đo được với URL http(s) + Chrome + `lighthouse` (npm) trên máy. `node .claude/skills/ac-audit-web/scripts/lighthouse.js --check` nói có hay không. Không có → audit vẫn chạy hai trục WCAG/UX, mục CWV ghi "không đo được: <lý do>".
- Người gọi là orchestrator (`ba-html-design` sau khi sinh, `ba-accept` trước ký, `ac-eval` cần bằng chứng) hoặc người dùng gọi tay. Agent vừa dựng HTML/code không gọi để tự chấm.

## Quy trình

### 0. Máy chạy trước (chưa ghi gì)
```bash
node .claude/skills/ac-audit-web/scripts/scan-html.js "docs/Screen-spec/<…>/html-design.html" --plain   # hoặc thư mục / prototype.html
node .claude/skills/ac-audit-web/scripts/scan-html.js "…" --json > .claude/ac-audit-<Mã>.json                  # đưa cho agent
node .claude/skills/ac-audit-web/scripts/lighthouse.js <url> --out .claude/ac-lh-<Mã>.json --plain          # chỉ khi có URL
```
`scan-html` bỏ qua khung dùng chung (`app-header`/`app-nav`/`statebar` — việc của `check-shell.js`), báo ❌ máy chắc (alt, label, button rỗng, tabindex>0, lang, id trùng, tắt zoom, outline:none không thay thế, tương phản tính được) và ⚠️ máy nghi (heading nhảy bậc, link chung chung, `<div onclick>`, `transition:all`, thiếu reduced-motion). Exit = số ❌ — dùng làm **cổng nhanh** trong `ba-html-design`: ❌ > 0 thì sửa HTML trước khi gọi agent (tốn agent cho lỗi máy đã chỉ dòng là phí). `lighthouse` không đo được → in lý do, exit 0; **không** thay bằng số đoán. URL sau đăng nhập → người dùng tự chạy `lighthouse --extra-headers` rồi đưa `--from <report.json>`.

### 1. Cổng phương án
- `ac-audit-web <màn>` / `proto` / `<url>` ghi **1 file** (`docs/Ho-so/audit/<Mã|app>-<YYYY-MM-DD>.md`) → **không cần** cổng; in một dòng "sẽ ghi <file>, đầu vào <…>, lighthouse <đo được|không>" rồi chạy.
- `ac-audit-web all` ghi **> 2 file** (mỗi màn một bản + tổng) → trình đủ **6 phần** (Đã đọc · Hiểu · Sẽ làm dạng bảng `màn · file TẠO · số ❌/⚠️ của scan` · Giả định · Câu hỏi chặn · Ngoài phạm vi) và **chờ duyệt** (`AskUserQuestion`: Chạy / Thu hẹp màn / Hủy).
- Gọi từ `ba-html-design`/`ba-accept`/`ac-eval` **đã qua cổng** → in rút gọn, **không hỏi lại** (luật "Cổng cha bao phủ cổng con"). Ngoại lệ (a) vẫn áp: phát hiện phải audit màn/URL ngoài phương án cha → dừng, xin duyệt phần chênh.

### 2. Xác định tầng và bộ đối chiếu
| Tầng | Đầu vào | Đối chiếu | CWV |
|---|---|---|---|
| `html-design` | `docs/Screen-spec/<…>/html-design.html` | `srs.md` · `design-spec.md` §4/§6/§7 (hồ sơ `mini` không có — đối chiếu `srs.md`) · NFR · `test.md` Manual · `07-design-system.md` | không đo được (file tĩnh) |
| `prototype` | `docs/Ho-so/prototype.html` / `wireframe.html` | `00-flows.md` · `00-decisions.md` (PD) — chưa có srs thì chỉ WCAG/UX chung | không đo được |
| `app` | URL http(s) | như `html-design` của màn tương ứng (người dùng nói URL ↔ `S..`; không nói → `app`) + code khi có `--root` | đo nếu có Chrome + lighthouse |

### 3. Phái `ac-auditor` — một agent mỗi đầu vào, ngữ cảnh trống
Prompt gồm đúng: đường dẫn file hoặc URL · tầng · `srs.md`/`design-spec.md`/`test.md` của màn · `01-requirements.md` (NFR) · output `scan-html.js --json` · output `lighthouse.js --json` hoặc câu "không đo được: <lý do>" · hồ sơ dự án · nơi ghi `docs/Ho-so/audit/<Mã|app>-<YYYY-MM-DD>.md` · nhắc "đọc `references/wcag-aa.md` + `references/ux-guidelines.md` trước; mở file/trang thật; không sửa gì; không spawn agent con; chạy `check-audit.js` trước khi trả". Không truyền kết luận trước ("tôi thấy màu hơi nhạt"). `all` → phái **tuần tự** từng màn, tối đa 8 agent một lượt theo trần `conv-gates.md`.

### 4. Cổng máy
```bash
node .claude/skills/ac-audit-web/scripts/check-audit.js docs/Ho-so/audit/<file>.md --plain
```
Exit ≠ 0 → bản audit không hợp lệ (thiếu tiêu chí WCAG, vị trí không `file:line`, CWV có số mà không nguồn, verdict ĐẠT dù còn 🔴, số đếm lệch, placeholder) → trả lại **agent đó** sửa *bản audit* (không phải HTML); vẫn đỏ sau 2 vòng → báo người dùng. Không dùng bản audit chưa qua cổng làm bằng chứng.

### 5. Trả kết quả cho orchestrator
- Verdict + bảng `AU-nn` về **orchestrator/người dùng**, không về agent dựng HTML. `CHƯA ĐẠT` (có 🔴): `ba-html-design` sửa html-design rồi chạy lại scan (cổng nhanh) → agent lần 2 chỉ kiểm giải quyết; `ba-accept` không ký NFR accessibility. `ĐẠT` có 🟠 → orchestrator quyết sửa ngay hay ghi WI (`ba-task`) với `Mốc = release`.
- `all` → thêm `docs/Ho-so/audit/all-<YYYY-MM-DD>.md`: bảng `| Màn | Verdict | 🔴 | 🟠 | 🟡 | File |` + 5 🔴 lặp nhiều màn nhất (cùng một rule CSS sai ở 6 màn là **một** việc sửa ở `07-design-system.md`, không phải 6).
- **Không** đụng `00-tracking.md` (audit không phải trạng thái tài liệu/dev), không mở CR/WI — việc sửa là quyết định của người đọc bản audit.

## Tiêu chí chất lượng (BẮT BUỘC)
- Máy trước, người sau: mọi ❌/⚠️ của `scan-html` và audit không đạt của Lighthouse được phán trong mục "Máy nói gì" (thành `AU-nn` hoặc bỏ có lý do); không `AU` nào trùng thứ máy đã chỉ mà thiếu `file:line` máy đã cho.
- **Mở rồi mới nói:** mọi `AU-nn` có `file:line` đã Read hoặc URL + selector; trục WCAG có tiêu chí `x.y.z`; trục UX có tên guideline; trục CWV có số + run id — không đo thì không có `AU` trục CWV.
- Mức theo bảng cố định trong `references/wcag-aa.md`/`ux-guidelines.md`; verdict: có 🔴 → `CHƯA ĐẠT`, không → `ĐẠT`. 🟠 không chặn verdict nhưng là nợ có `Mốc`.
- Mục "Đã kiểm, không lỗi" chỉ ghi thứ đã mở xem, có `file:line` — đó là phần thành bằng chứng cho NFR/TC.
- `check-audit.js` exit 0 trước khi bản audit rời khỏi skill.

## Ranh giới
- **`ac-judge`**: soi **code** trong diff (đúng đắn, bảo mật, cấu trúc). `ac-audit-web` soi **cái người dùng thấy** (HTML render, màu, nhãn, thứ tự tab, CWV) — không đọc logic. Cùng orchestrator, hai agent.
- **`check-shell.js`** (`ba-html-design`): khung dùng chung giống nhau giữa các màn (menu, class, statebar). `ac-audit-web` bỏ qua khung, soát **nội dung màn** theo WCAG/UX/CWV.
- **`ac-verify`/`ac-eval`**: chứng minh/chấm code theo Proof/TC. `ac-audit-web` không chạy test; bản audit là **đầu vào bằng chứng** cho `ac-eval` ở TC `Manual` giao diện (`docs/Ho-so/audit/<Mã>-*.md`).
- **`ba-conformance`**: code ↔ tài liệu cấp dự án. Đây là giao diện ↔ chuẩn a11y/UX/CWV + đặc tả màn.
- **`ba-review`**: độ phủ/truy vết tài liệu. Thiếu mục Animation trong design-spec là gap của `ba-review`; HTML có animation mà không có reduced-motion là `AU` của skill này.
- **Chỗ cắm** (orchestrator nối, file kia không đổi ở đợt này): `ba-html-design` sau khi sinh → chạy `scan-html.js` như cổng nhanh (❌ > 0 sửa ngay); `ba-accept` → `ac-audit-web <url>` app thật trước ký NFR; `ac-eval` → đọc `docs/Ho-so/audit/<Mã>-*.md` làm bằng chứng TC Manual.

## Lưu ý
- Tương phản: máy chỉ tính khi màu chữ và nền cùng một khối khai báo; chữ trên card trên nền app là việc của agent — tính bằng `contrast()` của `scan-html.js`, ghi tỉ lệ vào bản audit.
- Lighthouse dao động ±10% giữa các lượt; số trong bản audit là **một lượt** có run id. Cần số ổn định → chạy 3 lần lấy giữa (người dùng làm, đưa `--from`).
- Hồ sơ `mini`: không có `design-spec.md` → trạng thái/animation đối chiếu `srs.md`; `lite`: không có WI nên 🟠 ghi thẳng vào bản audit, không mở sổ.
- Blast radius: agent chỉ đọc + chạy scan/lighthouse; không sửa HTML, không commit, không push, không mở URL ngoài URL được giao.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
