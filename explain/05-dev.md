---
type: skill-explainer
group: dev
updated: 2026-07-15
---

# Nhóm dev — biến kế hoạch thành code thật

> Đây là **11 skill `dev-*`**: một bộ **kỷ luật lập trình/QA** đi kèm toolkit. Chúng là bản sao (clone) của framework **superpowers v5.1.0**, nội dung gốc **tiếng Anh**, chỉ đổi tham chiếu nội bộ sang tiền tố `dev-` để toolkit tự chứa — dự án đích không cần cài thêm plugin. Nhóm này bắt đầu vai trò **sau `ba-build`**: khi mỗi màn đã có `plan.md`, nhóm dev biến kế hoạch đó thành code.

## Vì sao người dùng BA cần biết nhóm này?

Người dùng nghiệp vụ thường **không trực tiếp gọi** các skill `dev-*` lẻ — bạn chỉ cần biết một điều: **`dev-run` là cửa vào**. Bạn giao cho nó các màn đã có plan, nó tự điều phối phần còn lại (viết test trước, code, debug, review, kiểm chứng) bằng các skill kỷ luật bên dưới. Phần này giải thích nhóm ở mức "để hiểu", không phải để bạn thao tác từng skill.

Một câu để nhớ: **`ba-build` viết kế hoạch (`plan.md`) → `dev-run` biến kế hoạch thành code, dùng 10 skill kỷ luật còn lại làm công cụ.**

---

## dev-run — Cửa vào của cả khâu dev (bước 8)

**Làm gì.** Điều phối việc **viết code thật** cho những màn được chỉ định: đọc `plan.md`, dựng khung dự án nếu repo còn trống, rồi với mỗi màn chạy quy trình có kỷ luật — viết test trước (TDD), thực thi plan, review, kiểm chứng — và cập nhật `test.md` (Pass/Fail + roll-up) cùng **cột `dev`** trong `00-tracking.md` (⚠️ đang dev / ✅ dev xong).

**Có gate cả đầu lẫn cuối (siết chặt).** Đầu: gate `ba-review build` + **branch-first** (đang ở nhánh mặc định thì tạo `feat/` trước, cấm commit dev thẳng vào main). Mỗi màn: `dev = ✅` chỉ khi **test xanh + lint sạch + typecheck sạch** (không chốt chỉ vì test pass). Cuối: **regression toàn suite** (bắt màn sau làm vỡ test màn trước) + **gate chốt `ba-review build`** trước khi bàn giao. Nếu dự án đã chốt kiến trúc (`10-architecture.md`, ADR Accepted) → dev-run **đọc stack + cấu trúc thư mục từ đó, không hỏi ad-hoc**.

**Khi nào dùng.** `ba-build` đã sinh `plan.md` cho các màn và bạn muốn có code chạy được. Là **Giai đoạn 3**, do **người dùng chủ động trigger**.

**KHÔNG dùng khi.** Màn chưa có `plan.md` (chạy `ba-build` trước). Kiến trúc còn Draft chưa chốt → chốt trước (xem `ba-architecture`). Mọi tài liệu BA nên đã sạch gap trước khi build.

**Đầu vào.** Các màn có `plan.md` (ô plan = ✅); `test.md` để lấy test case; `10-architecture.md` (nếu có) cho stack/cấu trúc.

**Đầu ra.** Code thật trong repo; `test.md` cập nhật trạng thái từng test + roll-up; cột `dev` trong tracking cập nhật.

**Bước kế.** Dev xong phase → **`ba-accept`** (Giai đoạn 4): nghiệm thu UAT → đóng gói phát hành → RTM → xuất bản → ký. Khép vòng đời.

**Ví dụ.** `dev-run Login Dashboard` → viết code hai màn đó theo plan, chạy test+lint+typecheck, đánh dấu ✅ ở cột dev.

---

## 10 skill kỷ luật còn lại — công cụ mà dev-run dùng

Bạn hiếm khi gọi trực tiếp, nhưng biết vai trò của chúng giúp bạn hiểu `dev-run` làm gì bên trong:

| Skill | Vai trò (một dòng) |
|---|---|
| `dev-writing-plans` | Viết kế hoạch triển khai từ spec/yêu cầu, trước khi động vào code (chuẩn mà `ba-build` tuân theo) |
| `dev-executing-plans` | Thực thi một kế hoạch đã viết, có các checkpoint để review giữa chừng |
| `dev-subagent-driven-development` | Thực thi các task độc lập trong plan bằng subagent, ngay trong phiên hiện tại |
| `dev-dispatching-parallel-agents` | Chạy song song nhiều việc **độc lập** (không phụ thuộc nhau) cho nhanh — cũng được các skill BA dùng để đặc tả nhiều màn cùng lúc |
| `dev-test-driven-development` | Viết test trước, code sau (TDD) cho mọi tính năng/sửa lỗi |
| `dev-systematic-debugging` | Quy trình gỡ lỗi có hệ thống khi gặp bug/test fail, trước khi vá bừa |
| `dev-requesting-code-review` | Rà soát chất lượng công việc trước khi merge |
| `dev-verification-before-completion` | Bắt buộc chạy lệnh kiểm chứng và xem output thật trước khi tuyên bố "xong" |
| `dev-finishing-a-development-branch` | Hướng dẫn khép lại một nhánh phát triển (merge/PR/dọn dẹp) khi code đã xong |
| `dev-using-git-worktrees` | Tạo không gian làm việc cô lập (git worktree) trước khi bắt đầu một mảng việc |

**Điểm chung của cả nhóm.** Chúng áp một **kỷ luật kỹ sư**: kế hoạch trước code, test trước cài đặt, gỡ lỗi có phương pháp thay vì đoán mò, và **kiểm chứng bằng bằng chứng** trước khi nói "hoàn tất". Nhờ vậy code sinh ra bám sát tài liệu BA (đặc biệt là `test.md`) chứ không đi lệch.

---

## Ranh giới với phần BA

- Mọi skill `ba-*` dừng lại ở **tài liệu và kế hoạch** — kể cả `ba-build` chỉ viết `plan.md`, **không** chạy code.
- Mọi skill `dev-*` bắt đầu từ **kế hoạch trở đi** — biến `plan.md` thành phần mềm thật.
- Cầu nối giữa hai bên là `plan.md` + `test.md`: BA định nghĩa "phải làm gì và kiểm thử ra sao", dev lo "làm cho nó chạy đúng".

---

## Họ `ac-*` — đội agent viết code (agentcode, từ 15/09/2026)

`dev-*` là **kỷ luật của một người**; `ac-*` là **cách một đội** làm việc: ai viết, ai chấm, ai được đụng gì, "xong" được quyết bằng gì. Giai đoạn 1 có hai skill; các giai đoạn sau thêm điều phối lô (`ac-team`), review PR có bằng chứng (`ac-judge`), trí nhớ codebase và hội đồng quyết định. Luật chung: `conv-gates.md` → "Đội agent".

## ac-agent — Tạo một "vai" trong đội (agent có hợp đồng)

**Làm gì.** Phỏng vấn 8 câu rồi sinh một agent trong `.claude/agents/` theo khuôn cố định: làm việc gì · **ai phái nó** · nhận đúng file nào · **trả kết quả về ai** (luôn là người điều phối, không bao giờ về tay người vừa làm việc bị soát) · được đụng gì (`ro`/`rw`). Đăng ký vào **sổ đội** (`agents.roster`) và soát bằng máy — agent nào có trong sổ thì mới được phái.

**Khi nào dùng.** Khi thấy cần "một con mắt khác" cho một việc: soát tài liệu vừa viết, chứng minh code vừa build. Skill hỏi trước: *bỏ cô lập ngữ cảnh thì có tệ đi không?* — không thì viết skill/script, đừng đẻ agent.

**Khác skill gần kề.** `ba-new-skill` sinh *skill* (kiến thức + quy trình); `ac-agent` sinh *agent* (một vai có ngữ cảnh riêng). Sáu agent reviewer `ba-*` cũ nay cũng nằm trong sổ đội này.

## ac-verify — "Xong" do người khác chấm

**Làm gì.** Khi một màn đã build hết task của `plan.md`, skill này (1) soát máy xem plan có đủ **Proof** — lệnh có exit code — cho từng task chưa (`check-plan.js`), (2) phái một agent **mới**, ngữ cảnh trống (`ac-verifier`) chạy từng Proof y nguyên, mở test đối chiếu với `test.md`, chạy cổng tầng TC, ghi `verification.md` có `file:line`, (3) `validate-done.js` đọc báo cáo đó và trả PASS/FAIL. Chỉ khi PASS, `dev-run` mới được đánh `dev = ✅`.

**Khi nào dùng.** Tự động ở bước 7b của `dev-run`; hoặc gọi tay `ac-verify S03` khi muốn chấm lại một màn đã build ở phiên khác.

**Khác skill gần kề.** `dev-verification-before-completion` là **tác giả tự kiểm** trước khi đưa ra — vẫn chạy; `ac-verify` là **người khác chấm**. `ba-conformance` đối chiếu code ↔ toàn bộ tài liệu ở cấp dự án sau dev; `ac-verify` chấm **một màn theo Proof của plan** ngay khi màn vừa xong.

## ac-team — Một đội thay vì một người: chia lô, giao việc, giữ sổ

**Làm gì.** Với plan lớn (> 8 task), chia task thành **lô theo tầng phụ thuộc** (~7 task/lô, không cắt đôi một tầng), phái **một worker `ac-builder` cho mỗi lô, tuần tự**; worker chỉ được trả **tóm tắt 4 dòng** (task nào xong với commit nào · test · lệch plan · chặn), không đổ log. Trạng thái đội ghi ra `.claude/ac-state.json` — mở phiên mới gõ `resume` là biết đang ở lô nào, và script **đối chiếu với git** trước khi tin sổ. Hết lô cuối, chính người điều phối gọi `ac-verify`; worker không bao giờ tự chấm.

**Khi nào dùng.** `dev-run` bước 2 tự đề nghị khi plan > 8 task (anh gật mới chạy). Plan nhỏ thì đội là tốn lượt — nó tự nói "chạy inline".

**Khác skill gần kề.** `dev-subagent-driven-development` là mỗi task một agent, không lô, không sổ. `ba-batch` chạy **song song theo màn** cho *tài liệu*; `ac-team` chạy **tuần tự theo lô** cho *code* vì lô sau phụ thuộc lô trước.

## ac-judge — Review code như senior engineer, ít lời, có bằng chứng

**Làm gì.** Khi một màn vừa có code, skill này (1) cho máy chạy trước — lint, typecheck, test của dự án và `scan-bypasses.js` quét diff tìm dấu hiệu "lách" (tắt cảnh báo, bỏ test, nới assert, để quên `console.log`, khoá bí mật trong code), (2) phái một agent mới `ac-judge` đọc diff đối chiếu `srs.md`/`test.md`, chỉ ghi finding nào chỉ ra được đúng `file:line`, mỗi finding một mức 🔴/🟠/🟡, (3) `review-gate.js` từ chối bản review nào thiếu bằng chứng, dùng từ "có vẻ", hay nêu quá 5 nit. Kết luận là một trong ba: APPROVE · COMMENT · REQUEST_CHANGES, ghi ở `docs/Ho-so/reviews/`. Vòng đầu nêu hết; vòng sau chỉ kiểm từng mã đã sửa chưa — không kéo dài vô tận.

**Khi nào dùng.** Ở bước 6 của `dev-run` (thay review văn xuôi), sau khi build xong một màn; hoặc gọi tay `ac-judge S03` / `ac-judge` cho một khoảng commit hay PR trước khi merge.

**Khác skill gần kề.** `ac-verify` chứng minh code **đúng đặc tả** bằng lệnh Proof của plan (PASS/FAIL); `ac-judge` phán **chất lượng và rủi ro** của diff (logic, bảo mật, cấu trúc, lách). `ba-conformance` đối chiếu code ↔ toàn bộ tài liệu cấp dự án sau dev; `ac-judge` là một diff, một màn, ngay khi vừa viết. `dev-requesting-code-review` là review không có cổng máy.

## ac-eval — Chấm điểm mức code làm đúng đặc tả

**Làm gì.** Lấy từng test case trong `test.md` và từng tiêu chí chấp nhận của màn, cho một agent chấm mới xem code có làm đúng điều đó chưa — mỗi ca một điểm 2 (đạt, có bằng chứng chạy được) · 1 (một phần) · 0 (chưa có) · — (không áp dụng), rồi máy cộng thành một con số phần trăm, kèm phân rã theo Must/Should và Auto/Manual, và danh sách việc cần sửa để lên 100%. Ghi `docs/Ho-so/eval/<Mã>-<ngày>.md`.

**Khi nào dùng.** Trước ngày phát hành hoặc khi PM hỏi "màn này xong bao nhiêu phần?"; chạy lại sau mỗi đợt sửa để thấy điểm nhích lên; chạy `all` để so các màn hoặc hai nhánh.

**Khác skill gần kề.** `ac-verify` chỉ trả lời đạt/không đạt cho cả màn ngay khi dev xong; `ba-conformance` liệt kê chỗ lệch nhưng không ra số; `ac-judge` nhìn chất lượng code chứ không nhìn đặc tả.

## ac-memory — Trí nhớ của đội dev: sổ codebase và sổ bài học

**Làm gì.** Giữ hai cuốn sổ trong `docs/Ho-so/` để đội agent không phải học lại từ đầu mỗi phiên. **Sổ codebase** (`notes/`): mỗi ghi chú một trang về *cách code này chạy* — luồng, cách làm quen thuộc, cái bẫy đã tốn công, thuật ngữ hiện thực ra sao — có `INDEX.md` để agent đọc trước khi bắt tay vào một lô, và ghi thêm sau khi xong (Debrief). **Sổ bài học** (`00-lessons.md`): mỗi dòng một câu "lần sau nên làm khác gì", có mã `LS-NN`; agent chỉ được *đề xuất* (`candidate`), người mới *chốt* (`confirmed`), và chỉ dòng đã chốt mới được đưa vào brief của worker. Hai script đếm phần cơ giới: ghi chú trỏ file code đã xoá (mồ côi), INDEX lệch file thật, code đổi sau ngày ghi chú (có thể cũ), mã bài học lặp/lùi, ứng viên quá 30 ngày chưa ai quyết.

**Khi nào dùng.** Tự động trong `ac-team`/`dev-run`: worker đọc `INDEX.md` lúc nhận lô, ghi chú lúc trả tóm tắt; orchestrator dựng lại INDEX và đề xuất bài học từ lô hỏng/verdict FAIL. Gọi tay `ac-memory notes` để soát sổ codebase, `ac-memory lessons` để chốt hoặc gỡ bài học cuối phase. Dự án chỉ tài liệu (phạm vi `docs`) không cần.

**Khác skill gần kề.** `dev-notes.md` (của `dev-run`) là nhật ký *sự kiện* theo ngày; `notes/` là tri thức *theo chủ đề*, không có trục thời gian. ADR trong `10-architecture.md` (`ba-architecture`) là *quyết định* kiến trúc; `00-lessons.md` là *bài học vận hành* — bài học nào thực chất là quyết định thì mở ADR, sổ này chỉ trỏ. `ba-index` là chỉ mục máy sinh của tài liệu BA, không phải ghi chú viết tay về code.

## ac-jury — Hội đồng bỏ phiếu mù cho quyết định khó *(⚗️ thử nghiệm)*

**Làm gì.** Khi một quyết định mà "một người nghĩ rồi tự chốt" là mỏng — phương án kiến trúc A/B/C còn Draft, một quyết định nghiệp vụ đang treo trong sổ PD, hay hai tài liệu chọi nhau mà bên nào cũng có lý — skill này lập một hội đồng 3–5 "thẩm phán" máy. Mỗi người được giao một vai (một người bênh, một người bắt buộc phản, một người cầm thang chấm) và một *cách hỏi* khác nhau (giả định đã thất bại rồi viết lại vì sao · đứng về phía kẻ phá · soát từng bằng chứng · lật giả định · nhìn 12 tháng sau). Họ bỏ phiếu **mù** — không ai thấy ai — rồi mới được đọc luận điểm ẩn danh của nhau và nghị án; ai đổi phiếu phải nói được *luận điểm mới* nào thuyết phục, "đa số nghĩ vậy" bị loại. Kết quả là **một đề xuất** kèm độ tin cậy đã hiệu chỉnh, ý kiến thiểu số, và *giả định nào nếu sai thì đề xuất đổ* — ghi vào `docs/Ho-so/jury/`. Máy chỉ đề xuất; ADR/PD vẫn do người có thẩm quyền chốt.

**Khi nào dùng.** Trước khi bấm "Chốt" ở cổng kiến trúc mà chưa đủ tin; khi sổ PD có dòng treo mà chưa ai muốn quyết; khi `ba-review` báo mâu thuẫn tài liệu mà không rõ bên nào đúng. Không dùng cho tra cứu sự kiện hay review code.

**Khác skill gần kề.** `ba-architecture` là nơi *chốt* ADR — `ac-jury` là bước *cân* trước đó, trả đề xuất về cho cổng. `ba-consistency-reviewer` *phát hiện* mâu thuẫn (một agent) — `ac-jury` *phân xử* (nhiều agent, mù, có phản biện bắt buộc). `ac-judge` chấm *code* — `ac-jury` chấm *quyết định*.

## ac-audit-web — Soát giao diện theo chuẩn: người khuyết tật, người dùng mobile, mạng chậm có dùng được không

**Làm gì.** Lấy đúng thứ người dùng sẽ nhìn thấy — bản `html-design.html` của một màn, bản prototype bấm được, hay app thật đang chạy — rồi soát theo ba thước: chuẩn tiếp cận WCAG 2.1 AA (ảnh có mô tả, ô nhập có nhãn, màu chữ đủ tương phản, đi được bằng bàn phím…), guideline UX (có màn "đang tải/rỗng/lỗi" thật không, nút đủ to để chạm, không nhảy layout…), và Core Web Vitals (trang hiện nhanh không, có giật không — chỉ đo được khi có app thật và máy có Chrome; không đo được thì ghi rõ, không đoán số). Máy quét trước và chỉ đúng dòng; một agent mới mở file/trang ra xem phần máy không thấy được; mỗi phát hiện `AU-nn` có vị trí, tiêu chí, mức 🔴/🟠/🟡, cách sửa và trace về yêu cầu/NFR. Ghi `docs/Ho-so/audit/<Mã>-<ngày>.md`, verdict ĐẠT/CHƯA ĐẠT.

**Khi nào dùng.** Ngay sau khi `ba-html-design` dựng xong một màn (cổng nhanh: máy quét, đỏ thì sửa trước); trước khi `ba-accept` ký nghiệm thu NFR accessibility/hiệu năng trên app thật; khi `ac-eval` cần bằng chứng cho các test case "Manual" về giao diện. Gọi `ac-audit-web S01`, `ac-audit-web all`, hoặc `ac-audit-web https://…`.

**Khác skill gần kề.** `ac-judge` đọc code trong diff — đây nhìn cái người dùng thấy, không đọc logic; `check-shell.js` của `ba-html-design` chỉ soát khung dùng chung (menu, class) giống nhau giữa các màn — đây soát nội dung màn theo chuẩn; `ba-review` soát tài liệu có đủ mục không — đây soát HTML có làm đúng mục đó không.

## ac-ci — Vòng CI: đọc check đỏ, dựng lô sửa, canh tới xanh

**Làm gì:** Sau khi đội dev xong một màn và PR đã mở, CI (bộ kiểm tự động trên GitHub) có thể báo đỏ. `ac-ci` không đọc cả nhật ký dài hàng nghìn dòng — script cắt đúng ~30 dòng quanh chỗ lỗi của từng check đỏ, chỉ ra file và dòng, đoán lỗi thuộc loại gì (test sai, lint, kiểu dữ liệu, build, hay hạ tầng), và tìm sẵn **lệnh chạy lại lỗi đó trên máy** từ file cấu hình CI. Từ đó nó dựng một "lô sửa" cho agent `ac-builder` — mỗi check đỏ một việc, có lệnh chứng minh — chờ người gật (theo mức tự chủ), builder sửa và commit, người push, rồi script canh CI tới khi xanh hoặc dừng ở cầu dao. Lỗi hạ tầng (runner, secret, quota) thì hỏi người, không sửa code; lỗi chập chờn (flaky) thì ghi nhận vào sổ dev-notes và mở việc, không sửa mò.

**Khi nào dùng:** CI của PR đang đỏ sau `dev-run`/`ac-team`, hoặc vừa push và muốn "canh giúp tôi tới khi xanh" (`ac-ci --watch`). Không dùng để mở PR hay push — đó vẫn là người làm.

**Khác skill gần kề:** `dev-finishing-a-development-branch` quyết merge/PR (người); `ac-judge` review *nội dung* diff; `ac-verify` chứng minh code đúng *đặc tả* — `ac-ci` chỉ lo một việc: CI xanh, bằng lệnh tái hiện chứ không bằng đoán.

## ac-po — Người đứng đầu đội: chọn việc, giao đội, nhận bằng bằng chứng

**Làm gì.** Đóng vai Product Owner cho đội agent: đọc lộ trình (`08-roadmap.md`), sổ việc (`00-backlog.md`), sổ thay đổi (`00-cr.md`) và ma trận tracking, rồi xếp việc theo một thứ tự có lý do — lỗi 🔴 chặn trước, thay đổi đã duyệt mà chưa làm tiếp theo, rồi các màn của phase đang mở theo đúng thứ tự roadmap, cuối cùng là work item theo ưu tiên. Với mỗi việc, PO gọi đúng chuỗi (đặc tả nếu thiếu → plan → đội dev → review → chấm điểm) và chỉ **nhận** khi máy nói đủ bốn cổng: người chấm độc lập PASS, review không đòi sửa, điểm đặc tả ≥ 80%, test xanh ở đúng tầng. Không đủ → trả lại đội sửa, tối đa hai vòng, rồi dừng hỏi bạn. Trạng thái lần chạy nằm trên đĩa nên đóng phiên giữa chừng mở lại vẫn tiếp được. Cuối lần chạy có một con số: **bao nhiêu % việc đội tự làm xong mà không cần bạn**.

**Khi nào dùng.** Dự án đã có tài liệu và roadmap, muốn "chạy một phase" mà chỉ can thiệp ở những chỗ thật sự cần người: thay đổi baseline, quyết định nghiệp vụ, đổi phạm vi, đẩy code lên. Gọi `ac-po plan` để xem hàng đợi và duyệt, `ac-po run` để chạy, `ac-po resume` khi mở phiên mới, `ac-po report` để lấy con số.

**Khác skill gần kề.** `ba-auto` chạy một lượt từ code có sẵn tới MVP — `ac-po` chạy nhiều lượt theo backlog và nhận từng việc bằng bằng chứng. `ac-team` là động cơ làm *một* màn — `ac-po` quyết *màn nào* và *xong chưa*. `ba-next` gợi bước kế cho bạn — `ac-po` gợi việc kế cho đội và nói rõ việc nào nó không được tự quyết.

## Xem thêm

- `01-pipeline-core.md` — `ba-build` (bước ngay trước, sinh `plan.md`).
- `03-orchestrator.md` — các orchestrator cũng gọi `dev-dispatching-parallel-agents` để chạy song song.
- `README.md` — index + bảng chọn theo tình huống.
