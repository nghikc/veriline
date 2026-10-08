---
name: dev-run
description: Use when tài liệu và plan.md của các màn hình đã đủ (ba-build đã chạy) và cần triển khai code thật cho những màn chỉ định; bước 8 của BA toolkit, sau ba-build.
---

# dev-run — Orchestrator chạy dev từ plan BA

## Mục tiêu
Từ tài liệu + `plan.md` mà pipeline BA đã sinh, dev các màn chỉ định thành code chạy được — kỷ luật dev và QA bằng bộ skill `dev-*` (clone từ framework superpowers, tự chứa trong project). Cập nhật trạng thái test (`test.md`) và tracking (cột `dev`).

## Cách gọi
`dev-run <màn>` · `dev-run <màn1, màn2>` · `dev-run all` (= mọi màn có `plan = ✅` và `dev = ⬜`). Dev **trọn vẹn từng màn một** theo thứ tự chỉ định rồi mới sang màn kế — không dở dang chéo.

## Gate đầu + scaffold
1. Đọc `conventions.md` của `ba-toolkit` + `docs/00-tracking.md`; lọc màn chỉ định có `plan = ✅`. Màn thiếu plan → báo, loại khỏi đợt chạy.
2. **Gate:** invoke `ba-review build`. Còn 🔴/🟡 → dừng, báo người dùng. **Kèm cổng thu nợ 🟠:** gap 🟠 có `Mốc = ba-build`/`dev-run` trong mục "Nợ có hạn" của `00-gaps.md` (giả định `⚠️ chưa xác nhận`, ADR còn `Draft`) → **DỪNG** — không code trên nền chưa chốt (`conv-gates.md` → "Quy ước gate").
3. **Branch-first (BẮT BUỘC):** nếu đang ở nhánh mặc định (`main`/`master`) → tạo nhánh `feat/<màn|phase>` (hoặc `dev-using-git-worktrees` khi chạy nhiều việc song song) **TRƯỚC** khi commit bất cứ gì. **Cấm commit code dev thẳng vào nhánh mặc định** (khớp quy tắc repo).
4. **Repo chưa có codebase:** xác định stack + cấu trúc:
   - **Có `docs/10-architecture.md` với ADR `Accepted`** (đã qua cổng chốt) → **đọc stack + §Cấu trúc thư mục chuẩn + phân tầng từ đây, KHÔNG hỏi lại**. Scaffold đúng cấu trúc đã chốt. *(ADR còn Draft/chưa chốt → dừng, route `ba-architecture` chốt trước — không scaffold theo bản chưa chốt.)*
   - **Không có** → fallback: đọc §Ràng buộc `01-requirements.md`, hỏi người dùng stack (1 câu, vd Next.js / Express+React / khác), scaffold `src/` khớp file path trong plan.
   Scaffold tối thiểu (test runner + **lint + typecheck** chạy được), commit scaffold. Ghi stack + **lệnh test/lint/typecheck** vào `docs/Ho-so/dev-notes.md` — các lần chạy sau đọc file này, **không hỏi lại**. (File kỹ thuật của dev-run: chỉ *lệnh thực tế*; *quyết định* kiến trúc nằm ở `10-architecture.md`. KHÔNG đánh số như deliverable BA, không vào portal mặc định.)

## Vòng dev mỗi màn
1. Đánh dấu tracking `dev = ⚠️` (đang dev) + cột "Cập nhật cuối".
2. **Thực thi `plan.md`:** chạy `node .claude/skills/ba-toolkit/scripts/batch-plan.js docs <Mã> --plain` trước. Plan **≤ 8 task** (`inline: true`) → một agent, **không hỏi**, không đề nghị đội. Plan **> 8 task** (`inline: false`) → **DỪNG hỏi một câu, nêu đủ hai lối ra kèm cái giá** — không tự spawn (offer-then-confirm):
   - **Đội** (`ac-team <Mã>`): lô nguyên tầng ~5 task, một `ac-builder` mỗi lô **tuần tự, chỉ đi tiếp khi lô trước xanh**; giá: nhiều lượt phái + brief mỗi lô.
   - **Một agent** (dev-executing-plans): ở lại phiên này, **chấp nhận compaction** (mất chi tiết ngữ cảnh giữa chừng); giá: phải phục hồi từ đĩa sau mỗi lần compaction.
   Lựa chọn **được ghi** trước task đầu: đội → `ac-team` tự `state.js init --mode team`; một agent → `node .claude/skills/ba-toolkit/scripts/state.js init <Mã> --mode single --base <sha>`. Đừng hỏi cắt ở đâu — cắt lô là việc của `batch-plan`, chỉ *cơ chế* là quyết định của người. Một agent (plan nhỏ hoặc người dùng chọn): REQUIRED SUB-SKILL: Use dev-executing-plans (chạy tương tác, checkpoint theo batch task); nhiều task độc lập muốn song song trong phiên: Use dev-subagent-driven-development.
   **Phục hồi:** mở phiên mới giữa chừng, **hoặc thấy vừa compaction trong phiên** (tóm tắt thay cho hội thoại, không nhớ task đang dở) → `state.js resume` + **đọc lại `plan.md`** + `git diff <base>..HEAD` TRƯỚC khi sửa gì. Không thấy giới hạn đang tới, nhưng thấy được compaction đã xảy ra — phục hồi dựa trên tín hiệu đó, không dựa trí nhớ.
3. **Mỗi task:** REQUIRED BACKGROUND: dev-test-driven-development — viết test thất bại từ `TC-S..` mà task trace → code tối thiểu cho pass → tick checkbox trong `plan.md` → commit theo message plan ghi.
   - **Tên test phải ghi ĐỦ từng mã TC, viết rời:** `TC-S01-09 · TC-S01-10: …`, **không** gộp thành `TC-S01-09/10`. Mọi thứ đối chiếu độ phủ (`scan-code.js`, `ba-trace`, bước 5 dưới đây) đều tìm mã bằng khớp chuỗi, nên dạng gộp làm TC thứ hai trở đi **vô hình**: đo ra "chưa chạy" trong khi test có kiểm thật. Đây là dương tính giả im lặng — nó không báo lỗi, chỉ báo thiếu.
4. **Test fail không rõ nguyên nhân:** REQUIRED SUB-SKILL: Use dev-systematic-debugging — tìm nguyên nhân gốc trước khi sửa; cấm sửa mò.
5. **Xong mọi task của màn:** chạy **toàn bộ** test suite. Cập nhật `test.md` của màn:
   - TC có `Cách chạy = Auto`: đặt `Trạng thái = Đã chạy` và `Kết quả = Pass` nếu test pass; `Kết quả = Fail` (kèm ghi chú lỗi) nếu fail.
   - Cập nhật bảng **roll-up** (đếm theo cột Kết quả + % Pass + "Lần chạy cuối").
   - TC `Manual` giữ `Trạng thái = Chưa chạy` (Kết quả `—`) → xuất **checklist test tay** cho người dùng ở báo cáo cuối.
6. **QA code:** gọi `ac-judge <Mã>` — bậc thang cơ giới (lint/typecheck/test + `scan-bypasses.js`) chạy trước, agent MỚI `ac-judge` review diff đối chiếu `srs.md`/`plan.md`, mỗi finding có `file:line`, `review-gate.js` chặn review mơ hồ → `docs/Ho-so/reviews/`. Verdict REQUEST_CHANGES (có 🔴) → sửa (lặp vòng TDD bước 3) → vòng 2 chỉ kiểm mã đã sửa. *(Dự án chưa cài `ac-*` → Use dev-requesting-code-review như cũ.)*
7. **Trước khi chốt:** REQUIRED SUB-SKILL: Use dev-verification-before-completion — phải có **bằng chứng (output lệnh thật)** cho CẢ BỐN điều: test suite của màn **xanh**, **lint sạch (0 lỗi)**, **typecheck sạch (0 lỗi)**, và **cổng tầng TC sạch**:

   ```bash
   node .claude/skills/ba-conformance/scripts/check-tc-layer.js docs --root . --plain
   ```

   Cổng này hỏi thứ mà "test xanh" KHÔNG trả lời được: *test thoả một TC có nằm đúng tầng TC đó mô tả không?* Ca thật 04/09/2026: một màn có **43/43 TC xanh, lint 0, typecheck 0** mà **21/43 là xanh giả** — TC mô tả thông báo trên giao diện nhưng chỉ có test tầng service, và màn hình thật thì đăng nhập sai **không hiện gì cả**. Một TC xanh ở sai tầng nguy hiểm hơn TC chưa có test, vì nó **trông như đã xong**. Còn lỗi lint/typecheck → **chưa được chốt màn**, sửa trước (không chốt chỉ vì test pass).
7b. **Người khác chấm (BẮT BUỘC, từ 15/09/2026):** bước 7 là tác giả tự kiểm — cần nhưng là tự khai. Xong mọi task và commit → **chính `dev-run` (orchestrator)** gọi `ac-verify <màn>`: nó soát hình plan, phái agent **mới** `ac-verifier` chạy từng `Proof` qua `evidence.js run --screen <Mã> -- <Proof>` (biên lai `.claude/ac-runs/`; thiếu biên lai → `validate-done` V-RECEIPT đỏ), đối chiếu test ↔ `test.md`, chạy cổng tầng TC, ghi `verification.md`, rồi `validate-done.js` quyết. **Subagent builder không bao giờ gọi `ac-verify`** — nó sẽ phái verifier với phạm vi của lô cuối thay vì cả màn. FAIL → quay bước 3 với danh sách fail (verdict về tay orchestrator, không đưa builder tự xử). Chỉ khi `validate-done.js` exit 0 mới sang bước 8.
8. Tracking `dev = ✅` + "Cập nhật cuối". **Debrief** (`ac-memory`): bẫy tốn > 1 vòng debug → ghi chú vào `docs/Ho-so/notes/` + `notes.js --write-index`; lô hỏng/verdict FAIL → `lessons.js add` (candidate) và trình người dùng confirm. Báo màn xong, sang màn kế.

## Kỹ thuật áp dụng
- **TDD Red–Green:** mỗi TC trace → test fail trước, code tối thiểu cho pass; cấm viết code trước test (chi tiết: dev-test-driven-development).
- **Vertical Slice theo plan:** đi đúng thứ tự phụ thuộc task trong `plan.md`; không nhảy cóc qua task bị chặn.
- **Systematic Debugging:** fail → đọc lỗi, cô lập, lập giả thuyết, tìm nguyên nhân gốc — không thử-sai ngẫu nhiên.
- **Code Review gate:** mọi màn phải qua dev-requesting-code-review trước khi đánh ✅.
- **Evidence-based completion:** không tuyên bố pass khi chưa có output lệnh thật (dev-verification-before-completion).

## Tiêu chí chất lượng (BẮT BUỘC)
- Task chỉ tick ✅ khi test trace **pass thật** (có output) và **Definition of Done** trong plan thoả.
- Sau dev một màn: không TC `Auto` nào còn `Trạng thái = Chưa chạy`; bảng roll-up khớp đếm cột **Kết quả** từng TC.
- **Cấm đánh `dev = ✅`** khi: test suite còn đỏ · **lint hoặc typecheck còn lỗi** · **cổng tầng TC còn xanh giả** · review còn finding nghiêm trọng chưa xử lý · DoD chưa thoả.
- **File code không `plan.md` nào khai = plan sai, không phải code sai** (trừ file cấu hình). Chạy `ba-conformance/scan-code.js` thấy mục "File code không plan nào khai" thì bổ sung khai vào plan rồi mới chốt — file dùng chung (hằng số nghiệp vụ, cổng thời gian, vỏ lỗi) hay bị bỏ sót vì không thuộc riêng task nào.
- UI bám `html-design.html` + `docs/07-design-system.md`; logic bám `srs.md`/`BRule-S..`.

## Kết thúc (sau mọi màn chỉ định)
1. **Regression toàn suite (BẮT BUỘC):** chạy **TOÀN BỘ** test suite của dự án một lần cuối (xuyên mọi màn đã dev, không chỉ màn cuối) + **lint + typecheck** toàn repo. Màn dev sau có thể làm vỡ test màn trước → còn đỏ/lỗi → quay lại sửa (dev-systematic-debugging), đánh lại `dev = ⚠️` màn bị ảnh hưởng.
2. **Gate chốt:** invoke `ba-review build` → bắt màn `dev = ✅` mà `test.md` còn TC **Fail** hoặc TC `Auto` **Chưa chạy** (luật "Sau dev"). Còn 🔴/🟡 → dừng, sửa rồi chạy lại; chỉ 🟢/sạch → tiếp.
3. Báo bảng tổng kết: mỗi màn × (task xong / TC Pass / TC Fail / TC Manual chờ test tay); kèm bằng chứng regression + lint/typecheck.
4. Liệt kê checklist TC Manual cần người dùng chạy tay (mã TC + các bước rút gọn).
5. Nếu dev trên nhánh riêng: REQUIRED SUB-SKILL: Use dev-finishing-a-development-branch (chọn merge / PR / giữ nhánh).
5b. Chọn PR và CI của PR đỏ → **`ac-ci`** (`inspect-checks.js` cắt log + Proof tái hiện, lô sửa cho `ac-builder`, `watch-checks.js` canh tới xanh; infra hỏi người, flaky ghi dev-notes). Chỉ khi PR đã mở — `ac-ci` không push, không mở PR.
6. *(Tùy chọn)* nếu dự án có `docs/Ho-so/portal.html`, invoke `ba-portal` làm mới cổng đọc.
6b. **Đối chiếu code vừa viết với đặc tả:** dev xong một màn → gợi ý invoke **`ba-conformance <màn>`** — dò ba thứ mà test xanh KHÔNG chứng minh được: code **lệch** quy tắc trong `srs.md`, phần đặc tả **chưa làm** (hàm rỗng/TODO), và code có **hành vi nghiệp vụ không nằm trong tài liệu** (validation ẩn, guard, tác dụng phụ). Chạy sớm ở đây rẻ hơn nhiều so với để `ba-accept` phát hiện lúc nghiệm thu.
7. **Bàn giao — Giai đoạn 4:** dev xong phase → gợi ý invoke **`ba-accept <phase>`** để chạy nghiệm thu (UAT) → đóng gói phát hành (`ba-release`) → RTM (`ba-trace`) → xuất bản. Khép vòng đời BA.

## Lưu ý
- `ba-build` dừng ở plan; `dev-run` là bước kế tiếp do người dùng trigger — không tự chạy sau ba-build.
- Cột `dev` trong tracking do skill này quản; `ba-track refresh` không reset nó (không map ra file tài liệu).
- Nếu màn đang dev có **Work Item** liên quan trong `docs/00-backlog.md` (`ba-task`) → cập nhật WI đó song song cột `dev` (Đang làm → Đang review → Xong, điền commit khi Xong). Cột `dev` roll-up theo màn; sổ WI giữ vòng đời + xuất xứ từng việc (kể cả việc phi-màn như refactor/CI).
- TC bị sửa nội dung trong lúc dev (phát hiện yêu cầu sai) → dừng, đề xuất `ba-change-request` thay vì tự đổi tài liệu.
- Cần workspace cách ly (nhiều việc song song trong repo) → Use dev-using-git-worktrees.
- **Blast radius:** plan đã duyệt cho phép **sửa file + commit cục bộ** trên nhánh feature. `git push`, force-push, deploy, chạm dữ liệu production, xoá nhánh của người khác → **hỏi người dùng từng lần**, kể cả khi plan có ghi. Agent con (builder/verifier) không được làm những việc này dù được bảo.
- Tiếng Việt khi báo cáo; code/comment theo chuẩn dự án.
