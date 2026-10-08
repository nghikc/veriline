# Luật viết code cho `ac-builder` — đọc TRƯỚC khi mở file đầu tiên của lô

> Đây là **luật hành vi** cho thứ máy không bắt được. Cái máy bắt được (`scan-bypasses.js`, `ac-verifier`, `ac-judge`) chỉ ghi một dòng "máy sẽ bắt" để bạn khỏi thử. Mỗi dòng: *Làm X, không làm Y — vì Z (ví dụ)*. Ví dụ `J-..` lấy từ dogfood S06 15/09/2026 — lỗi thật, worker thật, 46/46 test xanh mà judge vẫn REQUEST_CHANGES.
> Cơ chế gốc: Karpathy Guidelines (`coding-guidelines`, skills-catalog, CC-BY-4.0) — "nghĩ trước khi gõ · tối giản · sửa có phẫu thuật · mục tiêu kiểm được" — viết lại cho worker một lô có `plan.md`/`srs.md`/`test.md` sẵn, nên "hỏi người dùng" ở gốc thành "ghi `deviations`/`blockers`" ở đây.

## 1. Đọc trước khi viết
- Trước khi tạo helper/validator/hằng/regex, **grep tên và nội dung** trong `src/` — không viết bản thứ hai — vì hai bản sẽ trôi và không ai biết bản nào là luật (J-03: `validate` + `EMAIL_RE` + `MSG` chép 3 nơi, chính sách mật khẩu `\p{L}` vs `[A-Za-z]` → form và server báo hai câu khác nhau cùng lúc).
- Khi cần dùng chung giữa UI và service, **đưa hàm về tầng thấp nhất cả hai import được** (`src/domain/…`), không để UI import module service — vì UI kéo theo `bcryptjs`/`node:crypto` vào bundle client (J-03 phần hai).
- Đặt file **đúng layout `10-architecture.md`** dán trong brief; plan ghi "Edit" mà file chưa có → tạo mới **và ghi `deviations`** — vì plan sai trước, code không được im (lô 1 S06: `auth-guard.ts` không tồn tại ở base).
- Đọc `srs.md` phần task trace **trước** khi đọc code cũ; thấy plan ↔ srs mâu thuẫn → **srs thắng**, ghi `deviations` — vì srs là baseline đã duyệt, plan chỉ là cách làm (J-05: plan viết "Mạnh" = VÀ, srs viết HOẶC; worker theo plan → judge 🟠).
- Câu chữ thông báo/nhãn lấy từ `srs.md` cột E-S../Kết quả mong đợi, **không lấy từ brief** — vì brief là bản chép tay của orchestrator (LS-03: brief chép sai một câu, worker phải sửa lại theo srs).
- Đọc `docs/Ho-so/notes/INDEX.md` và *Bài học đã xác nhận* trong brief trước — vì bẫy đã trả giá một lần không được trả lần hai (LS-01: test tầng domain mang mã TC giao diện = xanh giả).

- Đọc `srs`/`test.md` **theo ID qua `ba-index/query.js`** (`get <ID>`, `find "…" --man S..`), không Read trọn file > 20 KB — vì bốn file một màn ≈ 60 k token nạp cho *mỗi* worker (S15 dự án helpdesk 16/09/2026), gấp đôi phần token dùng để viết code.
- Trong vòng TDD chỉ chạy **Proof của task** với reporter gọn (`--reporter=dot`/`--silent`/`-q`); full suite **một lần** cuối lô và chỉ đọc đuôi — vì mỗi lượt suite 900 test in ~30 k ký tự, và lô 11 task chạy vài chục lượt.

## 2. Viết code
- Viết **ít nhất đủ để Proof xanh**, không thêm tham số/cờ/abstraction "cho sau này" — vì code một implementation mà có abstraction là nợ ngay hôm nay (`getPasswordStrength(pw, opts?)` khi chỉ một chỗ gọi → bỏ `opts`).
- Mỗi dòng đổi phải **truy về một Step của task**; không "tiện tay" format/đổi tên/xoá dead code cạnh đó — vì diff lẫn tạp làm judge và `git bisect` mù (thấy dead code → ghi `deviations`, không xoá).
- Chỉ **xoá import/biến mà chính bạn** làm thành thừa; dead code có sẵn để nguyên — vì đó là việc của task khác hoặc WI, không phải của lô này.
- **Không đổi API/schema/interface** ngoài `Files` của task; cần đổi → dừng, ghi `blockers` — vì màn khác và `06-api-spec.md` đang trỏ vào đó (lô 2 S06: giữ `src/app/(auth)/register/page.tsx` theo plan dù không phải Next page, ghi deviation thay vì đổi layout).
- Secret/khoá/cost/URL môi trường **đọc từ env, thiếu thì ném lỗi lúc nạp module** — không đặt giá trị mặc định trong source — vì mặc định "cho tiện test" đi thẳng lên production (J-02: `AUTH_JWT_SECRET ?? 'dev-secret'` → ai đọc repo cũng ký được token OrgAdmin). Test đặt env trong `tests/setup.ts`. *Máy sẽ bắt:* chuỗi dạng `AKIA…`/`sk-…`/`password = "…"` (`secret-like`); mặc định kiểu `?? 'dev'` thì **không**, tự giữ.
- Thuật toán/thư viện mà **ADR đã chốt** (`10-architecture.md`) không được thay bằng cái "có sẵn hơn"; không làm được đúng ADR → ghi `blockers` kèm mã ADR — vì ADR đã duyệt là baseline, lệch im lặng là vượt quyền (J-02: HS256 trong khi ADR-03 chốt RS256 và ghi rõ *vì sao không HS256*).
- Theo **style file xung quanh** (tên biến tiếng Việt không dấu, cách import, dấu chấm phẩy) kể cả khi bạn thích kiểu khác — vì file đọc như hai người viết là mùi review đầu tiên judge ghi.
- Bình luận chỉ viết **VÌ SAO** (ràng buộc, đánh đổi, mã srs/TC), không kể CÁI GÌ dòng dưới làm, không nhật ký `// đổi từ X sang Y` — vì judge lượt D xoá chúng và tính là slop. *Máy sẽ bắt:* `TODO/FIXME` mới (`todo-new`), `as any` (`type-bypass`); `console.log`/`debugger` còn sót thì judge lượt D tự đọc (máy không quét — toàn báo oan).

## 3. Lỗi và biên
- Lỗi caller cần biết phải **lan lên hoặc thành kết quả có mã** (`{status: 409}`), không nuốt, không `return null` im lặng — vì caller không thấy lỗi thì trạng thái nửa chừng ở lại kho. *Máy sẽ bắt:* `catch {}` trống (`error-swallow`); `catch (e) { return null }` thì **không**, tự giữ.
- Mọi cặp **kiểm-rồi-ghi** (email trùng, số dư, tồn kho, slot) phải **nguyên tử tại nơi ghi** — kho ném lỗi khi trùng, unique index, transaction — không chỉ kiểm ở service — vì giữa kiểm và ghi có `await` là hai request chen được (J-01 🔴: kiểm email → `await bcrypt.hash` → ghi → double-submit cho hai user cùng email). Viết test `Promise.all([f(x), f(x)])` assert đúng một thành công.
- Ghi nhiều bản ghi liên quan (user + org) → **một transaction hoặc thứ tự có dọn** (ghi cha trước, lỗi thì xoá) — vì ghi nửa chừng để lại bản ghi mồ côi (J-01 phần hai: org tạo trước, user ném lỗi → org mồ côi).
- Object lỗi/field chỉ chứa **khoá thật sự có lỗi**; không `{ email: f.email, password: f.password }` với giá trị `undefined` — vì `Object.keys()` đếm cả khoá `undefined`, còn `if (loi[k])` thì không, hai phép kiểm lệch nhau khoá UI vĩnh viễn (J-04: sau 422 nút disabled tới khi tải lại trang). Dùng `setLoiServer(kq.body.fields)` — cái server trả.
- Nút gửi **khoá khi đang gửi, mở lại ở mọi nhánh kết thúc** (`finally`), kể cả reject — vì nhánh lỗi quên mở là double-submit hoặc kẹt (lô 2 S06 Task 7: mở lại ngay sau reject, không delay nhân tạo).
- Chờ **điều kiện**, không chờ **thời gian**: `useEffect` theo state, `waitFor`, polling có điều kiện — không `setTimeout(…, 0)` để "qua tick" — vì thứ tự tick là chi tiết runtime, đổi phiên bản là vỡ (J-07). *Máy không bắt* — `sleep(`/`await new Promise(r => setTimeout` trong test hay `setTimeout(fn, 0)` trong code đều do judge lượt F (gambiarra) đọc, tự giữ.
- Biên số học và chuỗi **test đúng hai bên ranh** (100 OK / 101 lỗi, 8 ký tự OK / 7 lỗi), không chỉ một bên — vì lệch một đơn vị chỉ lộ ở đúng ranh (lô 2 S06 Task 5: TC-S06-20 test cả 100 lẫn 101).
- Mã trạng thái/luật srs nêu mà **không task nào nhận** (429 rate-limit, R-S06-N03) → **không tự làm**, ghi `deviations` "chưa task nào phủ" — vì tự làm là vượt lô, im là rơi khỏi độ phủ (J-06).

## 4. Test
- Assert **đúng cột "Kết quả mong đợi"** của `test.md` (giá trị, câu chữ, mã lỗi), không assert "không ném lỗi"/`toBeDefined` — vì verifier đọc test ↔ test.md từng dòng, không đọc implementation; test có tên đúng mà assert khác = **lệch** = FAIL. *Máy sẽ bắt:* đổi `toBe` thành `toBeTruthy` (`assert-loose`), test bị xoá (`test-removed`), `.skip`/`.only` (`test-dodge`).
- Tên test ghi **từng mã TC, viết rời**: `TC-S01-09 · TC-S01-10: …`, không `TC-S01-09/10` — vì `check-tc-layer.js` và verifier grep từng mã; gộp là mã thứ hai biến mất khỏi độ phủ.
- Viết test từ **TC + srs**, chưa mở file implementation; test phải **FAIL trước** với lý do đúng (assert sai, không phải import lỗi) — vì test viết sau khi đọc code chỉ chứng minh code làm điều code làm (`dev-test-driven-development`, không nhắc lại ở đây).
- TC mô tả **giao diện** (nút, thông báo, focus, Tab) phải có test **tầng component/page** mang mã đó; test tầng domain cùng mã không tính — vì cổng tầng TC (`ba-conformance/scripts/check-tc-layer.js`) FAIL cả màn dù 46/46 xanh (LS-01, verifier vòng 1 S06).
- TC trong `Trace test` mà `Steps` quên liệt kê → **vẫn viết test**; TC thuộc màn khác (TC-S06-05 là của S02) → **không viết**, ghi `deviations` — vì trace là hợp đồng, Steps chỉ là gợi ý.
- Fixture khớp **Test Data của TC** (`password: 'Abc12345'`) — không bịa dữ liệu "cho tiện" — vì `test.md` là nguồn để người kiểm tay tái hiện; và dùng `$2[ab]$` khi thư viện khác plan (bcryptjs sinh `$2a$`), ghi deviation thay vì nới regex thành `.*`.
- Không thêm delay để test xanh, không chỉnh timeout — test flaky là lỗi thật (race, thứ tự async) → `dev-systematic-debugging`.

## 5. Commit và báo cáo
- Một task = **một commit**, message có chuỗi `Task N` đúng số plan (`feat(S06): Task 3 — …`) — vì `ba-toolkit/scripts/state.js resume` đối chiếu git bằng chuỗi đó; thiếu là task "chưa làm" và lô chạy lại từ đầu. Plan có message riêng nhưng không có `Task N` → dùng dạng brief, ghi deviation (lô 1 S06).
- Tick `- [x]` **đúng Step đã xong**, cùng commit với code — không tick trước, không tick cả task khi còn Step hở — vì `ac-verify/scripts/check-plan.js` và người đọc plan tin dấu tick.
- Tóm tắt **đúng 4 trường + `model`**, mỗi deviation một câu **có `Task N` + vì sao + chỗ** — không log, không kể quá trình — vì orchestrator Debrief từ đó và judge đối chiếu claim với diff (`ac-judge/references/review-standards.md` lượt E: claim không bằng chứng thành câu hỏi 🟠).
- Mọi thứ lệch plan/srs/stack **đều là `deviations`**, kể cả khi bạn tin mình đúng — không im lặng, không sửa đề trong `plan.md` — vì lệch ghi ra là dữ liệu cho LS/CR, lệch im là bug tương lai (lô 1+2 S06: 14 deviation, 5 thành PD/CR).
- Thấy điều **chỉ người quyết được** (a11y vs "đúng 4 Tab", mật khẩu chữ Việt có tính là chữ không) → ghi `deviations` "đề nghị PD", làm theo TC hiện có — không tự chốt nghiệp vụ.

## 6. Khi bí
- Test đỏ không hiểu vì sao → **`dev-systematic-debugging` Phase 1 trước**: đọc lỗi nguyên văn, tái hiện nhỏ nhất, trace ngược — không đổi code theo phỏng đoán rồi chạy lại xem sao — vì sửa mò đúng cũng không biết vì sao đúng.
- Đã thử **2 cách** mà chưa xanh → dừng task, ghi `blockers` (task · vì sao · `file:line` · đã thử gì) — không thử cách thứ ba, không nới assertion — vì lô sau và orchestrator cần biết chỗ kẹt hơn là một Proof xanh giả.
- Task hỏng → **dừng cả lô tại đó**, trả tóm tắt với task đã xong — không nhảy sang task kế "để tận dụng thời gian" — vì task sau phụ thuộc task trước (tầng phụ thuộc là lý do lô tồn tại).
- Thiếu dữ liệu để quyết (env, endpoint, hằng nghiệp vụ, câu chữ) → `blockers`, không bịa giá trị hợp lý — vì giá trị bịa qua được test của bạn và trở thành spec ngầm.
- Cần góc nhìn khác (review, kiến trúc) → ghi `blockers`; **không tự phái agent**, không gọi `ac-verify`/`ac-judge` — orchestrator phái.

## Không có trong file này (đã có chỗ giữ, đừng tìm ở đây)
- Vòng RED → GREEN → REFACTOR, "xem test fail trước", anti-pattern test → `dev-test-driven-development/SKILL.md`.
- Bốn pha tìm nguyên nhân gốc, dấu hiệu "đang sửa mò" → `dev-systematic-debugging/SKILL.md`.
- "Chạy lệnh rồi mới nói xong", không khai xanh khi chưa chạy → `dev-verification-before-completion/SKILL.md`.
- Mẫu lách bị quét cơ giới làm MỒI cho judge (canon `bypass.cats`: suppression · test-dodge · test-removed · assert-loose · todo-new · secret-like · type-bypass · tls-bypass · error-swallow · hook-bypass · config-loosen · env-dodge · protected-edit) → `ac-judge/scripts/scan-bypasses.js`.
- Sáu lượt đọc của reviewer và thứ KHÔNG được báo → `ac-judge/references/review-standards.md`.
- Proof y nguyên, test ↔ test.md, cổng tầng TC, verdict PASS/FAIL → `.claude/agents/ac-verifier.md` · `ac-verify/scripts/validate-done.js`.
- Blast radius (không push/rebase/đổi nhánh), không đánh `dev = ✅`, không sửa `plan.md` Proof/Trace/DoD, mức tự chủ → `.claude/agents/ac-builder.md` · `conv-gates.md` → "Đội agent".
- Sổ codebase và sổ bài học (đọc INDEX trước, LS chỉ `confirmed` vào brief) → `ac-memory/SKILL.md`.
