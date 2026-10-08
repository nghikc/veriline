---
name: ac-verify
description: Use when một màn đã dev xong mọi task của plan.md và cần CHỨNG MINH độc lập PASS/FAIL trước khi đánh dev = ✅ — agent mới chạy từng Proof. Gọi `ac-verify [màn]`.
---

# ac-verify — Chứng minh "xong" bằng người chấm không phải người viết

## Mục tiêu
Trước 15/09/2026, "xong" của `dev-run` là tác giả tự kiểm (`dev-verification-before-completion`) — kỷ luật tốt, nhưng là **tự khai**. Skill này tách hai vai: **builder** viết, **`ac-verifier`** (agent mới, ngữ cảnh trống) chấm; và biến "xong" thành exit code của `validate-done.js`. Luật gốc: `conv-gates.md` → "Đội agent".

## Cách gọi
- `ac-verify <màn>` — gọi tay, hoặc **`dev-run` bước 7b** gọi sau khi mọi task của màn đã commit.
- Người gọi phải là **orchestrator** (phiên chính đang cầm cả màn). Subagent builder không được gọi skill này — nó sẽ phái verifier với *phạm vi của lô cuối* thay vì cả màn.

## Quy trình
1. **Đọc hồ sơ dự án** (`ba-toolkit/profile.js`, `conv-gates.md` → "Hồ sơ dự án"): hồ sơ `mini` → không có `usecase.md`, luồng ở `srs.md`; nói ra khi bỏ qua. Phạm vi `docs` → skill này không có việc (không plan) — báo và dừng.
2. **Soát hình plan trước khi tốn agent:**
   ```bash
   node .claude/skills/ac-verify/scripts/check-plan.js docs --screen <Mã> --plain
   ```
   Exit ≠ 0 (task thiếu `Proof`/`Trace test`/DoD, phụ thuộc vòng) → **dừng**, route `ba-build` sửa plan. Không tự thêm Proof thay plan — đó là quyết định của người lập kế hoạch.
3. **Xác định khoảng diff** `<base>..HEAD`: base = commit trước task đầu của màn (đọc `plan.md`/`dev-notes.md`/`git log --grep <Mã>`); không xác định được → hỏi, không đoán.
4. **Phái `ac-verifier`** — **một** Agent, fresh (một verifier một màn một vòng; trước khi phái: `node .claude/skills/ba-toolkit/scripts/state.js spawn ac-verifier <Mã>` — từ chối khi vòng này đã có; sau khi về ghi `node .claude/skills/ba-toolkit/scripts/cost.js add --agent <tên> --role "<việc>" --tokens <n> --tools <n> --ms <n> --model <m> --viec <Mã> --skill <skill này>`), prompt gồm đúng: đường dẫn `plan.md` · `srs.md` · `test.md` · **`design-spec.md` · `html-design.html`** (nguồn binding: TC giao diện đối chiếu với thiết kế, không chỉ với test.md — thiếu file thì ghi "không có", không bỏ lặng) · khoảng diff · `--root` code · hồ sơ · nơi ghi `verification.md` · nhắc "không sửa gì, không spawn agent con". Không truyền diff nội dung hay đoán trước kết quả.
5. **Cổng máy:**
   ```bash
   node .claude/skills/ac-verify/scripts/validate-done.js docs <Mã> --root <root> --plain
   ```
   `--root` cho phép grep mã TC của `Trace test` trong file `- Test:` của plan (thiếu → đỏ); bỏ `--root` thì chỉ soát chữ trong verification.md.
   - exit 0 → báo **PASS** về orchestrator; `dev-run` mới được đánh `dev = ✅`.
   - exit ≠ 0 → báo **FAIL** kèm danh sách từ `verification.md`; orchestrator quyết: quay vòng TDD (`dev-run` bước 3) hay hỏi người dùng. **Không** đưa verdict cho builder tự xử.
   - `## Vế thiếu` (19/09): dòng `LOẠI: thiếu-test` mà verdict PASS → `validate-done` đỏ "PASS nhưng còn vế thiếu test"; `ngoài-tầng` phải có lý do. Verifier dùng `ve.js docs --screen <Mã>` để tách vế trước khi đối chiếu — chấm từng vế, không chấm "test có chạy".
   - `## Lỗi gieo` (24/09): verifier, **sau khi mọi Proof xanh**, chọn ≤ 5 đột biến mức hành vi (lật điều kiện · lệch biên 1 · đổi giá trị trả · bỏ side effect), mỗi cái nhắm một assert khác, chạy `scripts/mutate.js <loi.json> --root <root>` (worktree tạm từ HEAD, gieo từng lỗi riêng, dọn, so porcelain cây thật — exit = số lỗi `sống`, 10 hạ tầng, 11 cây thật đổi, 12 sai tham số) rồi dán bảng. validate-done chặn PASS khi thiếu mục / bảng rỗng / còn `sống` / không dòng `bắt`; màn không có code logic → `n/a — <lý do>`. `--json` có `lỗiGieo`. Lỗi sống là việc của builder (siết assert), không phải của verifier.
   - **Test tồn tại và đã chạy** (24/09, đợt 5 — tlc-spec-lean `verify.md` §2): mỗi dòng Task có số `N passed / M skipped` chép từ output (jest/vitest/pytest/mocha/node:test đều nhận). Khi PASS: N = 0 / `no tests ran` → đỏ · mã TC của `Trace test` vắng trên dòng → đỏ · `phủ bởi full suite <sha>` khác đầu `diff:` → đỏ · `ngoài-tầng` không có `đã thử: <lệnh> → <trích lỗi>` → đỏ. Bảng **kiểu cũ** (không dòng nào có số) chỉ ra `⚠` cảnh báo; đã có số ở một dòng thì dòng thiếu số là đỏ. Khối ``` bị bỏ trước khi đọc. Verdict FAIL không bị thêm lý do: mọi luật hình trừ nhãn TC (V6) vào `cảnhBáo` kèm mã, `luật` = đúng `['V1b']` — accept.js route go-live/tài-liệu **theo mã**. Ô `exit` chỉ cần **bắt đầu** bằng số (`0 · phủ bởi full suite <sha>`, `**0** *(chạy lại)*`). Verification có `ngày:` **trước 2026-09-24** → luật đòi hình mới (V8a thiếu Lỗi gieo · V9a · V9c · V9d · V11) chỉ cảnh báo; V9b/V10/V8b–h vẫn đỏ; không có `ngày:` thì không miễn. Không `--root` → suy từ header `gốc code:`; file plan `.ts` mà thật `.tsx` vẫn nhận; TC vắng file của task nhưng có ở file test khác → cảnh báo "Proof task không phủ Trace" (sửa plan/Proof), vắng khắp nơi → V9d. `--json` thêm `cảnhBáo` · `luậtCảnhBáo` · `verdict` · `miễnLuậtMới` · `gốcCode` · `đãChạy` · `kiểuCũ` · `vếThiếu.ngoàiTầng[].đãThử` · `biênLai` · `integrity`.
   - **Biên lai Proof** (07/10/2026, hook-review): verifier chạy mọi Proof qua `node .claude/skills/ba-toolkit/scripts/evidence.js run --screen <Mã> -- <Proof>` (trong suốt: stdout/exit nguyên vẹn). Khi PASS, **V-RECEIPT** đỏ nếu Task có Proof mà không biên lai khớp lệnh Proof của plan (chuẩn hoá token) · exit ≠ 0 · head ngoài khoảng `diff:` (sau `b` mà chỉ chạm docs/.claude thì nhận) · passed khác số trên dòng; dòng `phủ bởi full suite <sha>` cần biên lai exit 0 ở head đó. **V9f**: có `--root`/`gốc code:` mà file `- Test:` của task không có trên đĩa → đỏ. Verification `ngày:` trước 2026-10-07 → hai luật này chỉ ⚠ (`biênLai.cảnhBáo`). **V0d**: `integrity.js` báo toolkit lệch nguồn không duyệt → đỏ trước mọi luật (integrity vắng → chỉ in "integrity chưa cài").
   - `--json` có `phânLoại` (từ mục `## TC ngoài code màn / sai tiền đề`, nhãn `verify.tc.labels`): `lỗiCode` → lô sửa builder; `tcSaiTiềnĐề` (có trích srs) → **sửa `test.md` theo srs** (`ba-test`, ghi tracking), không phái builder; `chỉCònTcSai = true` khi mọi dòng FAIL chỉ thuộc TC sai tiền đề → vòng kế verifier chỉ chạy lại các TC đó. Nhãn `tc-sai-tiền-đề` thiếu trích dẫn = lý do đỏ riêng (máy không tin lời "test sai" không dẫn chứng).
6. Ghi một dòng vào `docs/Ho-so/dev-notes.md`: ngày · màn · verdict · diff.

7. **Vòng ≥ 2 (sau TRẢ):** phái với `model: sonnet` (canon `agents.sonnet.roles` → verifier-vòng≥2: việc cơ giới — chạy lại Proof hỏng + một full suite, bảng vế/lệch giữ từ vòng 1; ghi `model:` sonnet ở header, `cost.js add --model sonnet`). Verdict lệch bất thường với vòng 1 (PASS thành FAIL ở task không bị lô sửa chạm) → phái lại opus, ghi vào dev-notes để so. verifier mới vẫn chấm toàn bộ bảng, nhưng **chạy lại từng Proof chỉ với task hỏng vòng trước + task bị lô sửa chạm**; các task còn lại phủ bằng **một lượt full suite** (`npm test`/tương đương, reporter gọn) — dòng verification ghi `exit 0 · phủ bởi full suite <sha>`. Vì Proof là tập con của suite, 18 lượt vitest mỗi vòng (S15 dự án helpdesk: 3 vòng = 54 lượt) chỉ đắt chứ không thêm bằng chứng. Vòng 1 vẫn chạy y nguyên từng Proof. `## Lỗi gieo` vòng ≥ 2: chạy lại `mutate.js` chỉ với lỗi `sống` vòng trước + lỗi nằm trong file lô sửa chạm; dòng `bắt` khác giữ từ vòng 1.

## Tiêu chí chất lượng (BẮT BUỘC)
- Verifier là agent **mới** mỗi lần; không tái dùng agent đã viết code của màn.
- `verification.md` có `model:` + `diff:`, một dòng mỗi task, exit code là số, bằng chứng `file:line`, mục `## Lỗi gieo` không còn `sống`.
- Một chỗ đỏ = FAIL. Không có "PASS có điều kiện", không có "PASS trừ Task 3".

## Ranh giới
- **`dev-verification-before-completion`** (superpowers): tác giả tự kiểm trước khi *đưa* ra chấm — vẫn chạy ở bước 7. `ac-verify` là bước 7b: người khác chấm.
- **`ba-conformance`**: đối chiếu code ↔ *toàn bộ* tài liệu sau dev, cấp dự án, sinh `00-conformance.md`. `ac-verify` chấm **một màn**, theo **Proof của plan**, ngay khi màn vừa xong.
- **`dev-requesting-code-review`**: chất lượng code (bước 6). Verifier không review code — nó chứng minh *đúng đặc tả*.

## Lưu ý
- Blast radius: plan đã duyệt cho phép sửa + commit cục bộ; `git push`/deploy/dữ liệu production cần người dùng gật từng lần — verifier càng không được.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
