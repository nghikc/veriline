---
name: ac-judge
description: Use when diff của một màn, khoảng base..HEAD hay PR cần REVIEW như senior engineer khắt khe — finding có file:line, mức, verdict; phán chất lượng diff. dev-run bước 6.
---

# ac-judge — Review diff bằng bằng chứng, ít finding, một vòng

## Mục tiêu
`dev-run` bước 6 review code bằng `dev-requesting-code-review` (superpowers): một agent đọc diff rồi viết văn xuôi — không ngưỡng bằng chứng, không trần nhiễu, không cổng máy, và finding thường rải qua nhiều vòng. `ac-judge` thay bước đó bằng cơ chế của the-judge: **máy chạy trước** (lint/typecheck/test + `scan-bypasses.js`), agent chỉ phán thứ máy không phán được, **mỗi finding có `file:line` đã mở đọc**, mức quyết verdict theo bảng cố định, và `review-gate.js` từ chối bản review nào thiếu bằng chứng hay dùng từ mơ hồ. Vòng 1 là **cả** review; vòng 2+ chỉ kiểm giải quyết. Luật đội agent: `conv-gates.md` → "Đội agent".

## Điều kiện
- Có code để so: diff của màn (commit từ task đầu tới HEAD), hoặc khoảng `<base>..<HEAD>` người dùng đưa, hoặc PR (`gh pr diff <n>`, khi repo có `gh` đăng nhập). Phạm vi `docs` (đọc bằng `node .claude/skills/ba-toolkit/scripts/profile.js docs`) → không có việc, báo và dừng.
- Với review theo màn: `srs.md` · `test.md` · `plan.md` của màn tồn tại — judge đối chiếu BRule/Error/TC với code. Hồ sơ dự án `mini` → không có `usecase.md`, luồng ở `srs.md`; nói ra khi bỏ qua.
- Người gọi là **orchestrator** (`dev-run`, `ac-team` sau `ac-verify`, hoặc người dùng gọi tay). Builder/subagent viết code không gọi skill này — kẻ vừa viết lô cuối viết brief thì judge thừa hưởng phạm vi của nó.

## Quy trình

### 1. Xác định khoảng diff và vòng
- Màn: base = commit trước task đầu (đọc `plan.md` / `dev-notes.md` / `.claude/ac-state.json` / `git log --grep <Mã>`); không xác định được → **hỏi, không đoán**. PR: `gh pr view <n> --json baseRefName,headRefName,additions,deletions,changedFiles` rồi `gh pr diff <n> > .claude/ac-judge-<Mã>.diff`.
- Vòng: có `docs/Ho-so/reviews/<Mã>-*.md` chưa? Không → vòng 1. Có → vòng N+1, nạp bảng mã `J-..` của file mới nhất làm sổ giải quyết.

### 2. Bậc thang cơ giới (trước khi tốn agent)
```bash
# lệnh lint / typecheck / test: đọc từ docs/Ho-so/dev-notes.md (dòng có backtick) hoặc package.json scripts;
# không có → ghi "không có lệnh", KHÔNG đoán, KHÔNG cài gì
node .claude/skills/ac-judge/scripts/scan-bypasses.js --range <base>..HEAD --per-commit --plain   # hoặc <diff-file> (không --per-commit)
node .claude/skills/ac-judge/scripts/rules.js check --range <base>..HEAD --plain         # luật máy từ finding cũ (seed toolkit ∪ .claude/ac-rules.jsonl) — hit = đã có người trả giá cho lỗi này ở màn khác
```
Ghi lại exit code + số passed/failed/skipped nguyên văn. `scan-bypasses` là **mồi**, không phải cổng: exit 0 khi chạy được (2 = lỗi hạ tầng — báo, đừng coi là sạch), số phát hiện ở dòng tổng `N phát hiện` — chép dòng đó, đưa danh sách vào prompt agent để lượt F phán từng hit. Thứ lint/typecheck **đã bắt** nằm ngoài phạm vi finding. `--per-commit` đi từng commit trong khoảng: test viết chặt rồi nới ở commit sau (`assert-loose@sha`), test thêm rồi xoá (`test-removed`) — diff gộp không thấy hai thứ đó. Ba loại đợt 5: `protected-edit` (dòng Proof/Trace test/DoD của plan.md, test.md, `.claude/settings*`/hooks/ac-rules — builder sửa đề), `config-loosen` (passWithNoTests, exclude/ignore, strict false, eslint off, ngưỡng coverage hạ, script `test` đổi), `env-dodge` (`process.env.CI`/`NODE_ENV==='test'` trong code non-test) — đếm, không phán: CR/ba-test đổi test.md là hợp lệ. `scan-bypasses` báo **VƯỢT ~400 dòng lõi** → nói với người dùng: chia review theo file (mỗi lượt agent một nhóm file), không nhồi cả diff vào một agent.

- **Mã chưa nối** — `node .claude/skills/ac-judge/scripts/scan-wiring.js <base>..HEAD --plain`: file/export MỚI trong diff mà không file non-test nào import, nhắc đường dẫn hay đăng ký route (`mồ-côi` · `chỉ-nhắc-tên` · `export-mồ-côi`; entry theo quy ước bỏ qua, danh sách ở gioiHan). "Nối" chỉ tính file mã + cấu hình thật — `.md`, `docs/**`, `.claude/**`, `*.jsonl`, `.json` tuỳ ý KHÔNG nối mã dự án (backlog hay bản chấm nhắc tên file không phải người gọi). `chỉ-test-dùng` (🟢, không tính exit): export chỉ file test nhắc — setter `dat*` làm đường nối cho test là hợp lệ, bỏ qua; nhưng HANDLER/entry chỉ test gọi thì soi như `mồ-côi`. Exit = số ứng viên — đếm, không phán: agent mở từng file, xác nhận không có đăng ký kiểu glob/DI rồi mới ghi finding 🟠 "mã chết/chưa nối" có `file:1`. Test gọi thẳng component KHÔNG tính là nối — đúng cách `TrangChan.tsx` (S12) qua verifier PASS + judge APPROVE. Đưa output vào prompt agent cùng scan-bypasses.

- **Trùng logic** (mồi, không cổng) — `node .claude/skills/ba-review/scripts/scan-dup-code.js --root <code> --json`, lọc nhóm có ≥1 vị trí nằm trong file của diff trước khi đưa vào prompt (diff chạm một bản → hỏi bản kia có cần sửa theo không). Không đưa số nhóm toàn repo vào brief judge — chạy thật cho thấy phần lớn là tiện ích trùng ngẫu nhiên, chỉ nhóm giao với diff mới đáng soi.

### 2b. Diff lớn → tóm tắt máy trước khi tốn agent
```bash
node .claude/skills/ac-judge/scripts/diff-digest.js --range <base>..HEAD --root . --plain
```
Mỗi file một dòng: tầng (domain/service/controller/infra/migration/ui/test/docs) · +/− · hàm/route/bảng đổi · cờ **nhạy** (auth/guard/permission/password/token/secret/migration/transaction). Diff > 3 000 dòng lõi → dán digest vào prompt và chỉ định **đọc kỹ** các file nhạy + controller/service (theo digest), UI/test đọc theo mẫu, phần còn lại judge ghi "chưa đọc" — thay vì để agent mở 137 file (S15: 16 k dòng, 397 k token vòng 1).

### 3. Phái `ac-judge` — một Agent, ngữ cảnh trống
**Một judge một màn một vòng** — không phái theo lô/task (đo 17/09/2026: hai phiên phái 16 judge cho một màn). Trước khi phái: `node .claude/skills/ba-toolkit/scripts/state.js spawn ac-judge <Mã>` (từ chối khi vòng này đã có judge); sau khi về: ghi `node .claude/skills/ba-toolkit/scripts/cost.js add --agent <tên> --role "<việc>" --tokens <n> --tools <n> --ms <n> --model <m> --viec <Mã> --skill <skill này>`.
Prompt gồm đúng: khoảng diff (hoặc đường dẫn file diff) · `--root` code · đường dẫn `srs.md` · `test.md` · `plan.md` của màn (hoặc mô tả PR/commit message khi review theo khoảng) · output bậc thang (exit code, số test, danh sách phát hiện của scan) · vòng + bảng `J-..` vòng trước (nếu vòng ≥ 2) · hồ sơ dự án · nơi ghi `docs/Ho-so/reviews/<Mã>-<YYYY-MM-DD>.md` (vòng N ≥ 2 → hậu tố `-r<N>`) · nhắc "chỉ đọc, không sửa, không spawn agent con". Không truyền kết luận trước; không nói "tôi nghĩ có lỗi ở X".

### 4. Cổng máy
```bash
node .claude/skills/ac-judge/scripts/review-gate.js docs/Ho-so/reviews/<file>.md --root <root> [--prev <file vòng trước>] --plain
```
Exit ≠ 0 → trả lỗi cho **cùng agent** sửa bản review (không phải sửa code), tối đa 2 lượt; vẫn đỏ → báo người dùng. **Không nộp review chưa qua gate**, không ép xanh bằng cách xoá finding có bằng chứng.

Qua gate → `node .claude/skills/ac-judge/scripts/rules.js from-review docs/Ho-so/reviews/<file>.md`: khối ```` ```rules ```` trong "Chuyển thành luật lint" thành luật **candidate** (`.claude/ac-rules.jsonl`); người `rules.js confirm RL-nn` thì mới chạy ở bậc thang của mọi màn sau. Finding không viết được thành regex theo dòng/file thì để ở notes (`ac-memory`), đừng ép. Vì sao: J-01 (S12) sửa xong, S16 y nguyên tới khi eval thấy — `docs/decisions/15-lo-trinh-sau-dogfood.md` B.

### 5. Trả kết quả cho orchestrator
- Verdict + bảng Findings về **`dev-run` / người dùng**, không về builder. `REQUEST_CHANGES` → `dev-run` quay bước 3 với danh sách `J-..` 🔴/🟠; `COMMENT` → orchestrator quyết sửa ngay hay ghi WI (`ba-task`); `APPROVE` → sang bước 7.
- Ghi một dòng vào `docs/Ho-so/dev-notes.md`: ngày · màn · vòng · verdict · số 🔴/🟠/🟡 · file review.
- **Đăng lên PR** (`gh pr review <n> --body-file … --request-changes|--comment|--approve`) chỉ khi người dùng **yêu cầu rõ** và sau khi hỏi lại một lần (blast radius: review đăng là thứ người khác đọc, không rút được). Own-PR: GitHub từ chối APPROVE/REQUEST_CHANGES trên PR của chính mình → đăng `--comment`, TL;DR vẫn mang verdict thật.

### 6. Vòng 2+ (Convergence)
Chỉ hai việc: (a) mỗi mã vòng trước → `đã sửa <sha>` / `còn mở` / `từ chối — chấp nhận` (lý do tác giả đứng vững thì ghi nhận rồi bỏ hẳn; không đứng vững thì tranh luận lại **một** lần với bằng chứng mới, sau đó "còn mở" và đưa ra ngoài review); (b) diff kể từ commit đã review chỉ soi **🔴 mới** do chính bản sửa gây ra — không 🟠/🟡/🟣 mới; thứ vòng 1 nhìn thấy mà không nêu là reviewer chịu. Vòng 3: mọi mã còn mở phải sửa, thành WI, hoặc thoát khỏi review; không có vòng 4. `review-gate.js --prev` cưỡng chế phần đo được.

## Tiêu chí chất lượng (BẮT BUỘC)
- Máy trước, người sau: không finding nào trùng thứ lint/typecheck đã báo; mọi phát hiện của `scan-bypasses` được phán (thành finding hoặc bỏ có lý do) trong mục "Bậc thang cơ giới".
- **Bằng chứng hay im:** 🔴/🟠 có `file:line` đã mở + (lệnh tái hiện hoặc caller hoặc dòng srs/test.md); khẳng định về thư viện/API ngoài có URL `https://` nguồn chính thức tra trong review này, không có → câu hỏi hoặc bỏ.
- Ngân sách nhiễu: ≤ 5 🟡 trong bảng; 🟣 chỉ ở tóm tắt; không chồng nit lên khối mà một 🔴/🟠 sẽ viết lại.
- Verdict đúng bảng: 🔴 → `REQUEST_CHANGES` · 0 🔴 và 0 🟠 → `APPROVE` · còn lại `COMMENT`. Nit không bao giờ chặn APPROVE.
- `review-gate.js` exit 0 trước khi review rời khỏi skill.

## Ranh giới
- **`dev-requesting-code-review`** (superpowers): review văn xuôi, không gate, không ngân sách. `dev-run` bước 6 **có thể gọi `ac-judge` thay** khi dự án muốn review có cổng máy; file `dev-run` không đổi ở GĐ này.
- **`ac-verify`**: chứng minh code **đúng đặc tả** bằng Proof của plan (PASS/FAIL) — không nhìn chất lượng code. `ac-judge` nhìn **chất lượng và rủi ro** của diff (đúng đắn, bảo mật, cấu trúc, lách) — không chạy Proof. Hai bước, hai agent, cùng orchestrator.
- **`ba-conformance`**: code ↔ toàn bộ tài liệu, cấp dự án, sau dev. `ac-judge` là một diff, một màn, ngay khi vừa viết.
- **`code-review`** (Claude Code built-in): review chung không biết `srs.md`/`test.md`/`BRule`; `ac-judge` đối chiếu đặc tả BA và ghi vào `docs/Ho-so/reviews/` để trace.

## Lưu ý
- Diff **> ~400 dòng lõi**: chia theo file/nhóm file, mỗi lượt một agent, gộp verdict theo bảng mức (có 🔴 ở bất kỳ nhóm nào → REQUEST_CHANGES). Judge không tự chia — orchestrator chia.
- File cơ giới (lockfile, snapshot, dist/, vendor/, `*.min.js`) bỏ qua và liệt kê; code **di chuyển** (≥3 dòng xoá một chỗ, thêm y nguyên chỗ khác) không review lại như code mới.
- Hồ sơ dự án: `lite`/`mini` không tắt skill này (review là cơ chế kiểm chứng, không phải sổ sách); `mini` chỉ đổi nguồn đối chiếu (không `usecase.md`).
- Blast radius: judge chỉ đọc; đăng review lên PR, push, đóng PR đều hỏi người dùng từng lần.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
