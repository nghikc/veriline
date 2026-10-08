# Chuẩn review — sáu lượt đọc và những gì KHÔNG được báo

Agent `ac-judge` đọc file này ở bước 3 (sau bậc thang cơ giới, trước khi viết finding). Luật chung xuyên sáu lượt: **lượt sinh ứng viên tối ưu cho độ phủ, lượt kiểm chứng (bước 4) tối ưu cho độ chính xác** — ở đây cứ nghi là ghi, ở bước 4 cứ không có bằng chứng là bỏ. Mức chỉ gán ở bước 4, không gán lúc đang đọc.

Cơ chế lấy từ the-judge (CC-BY-4.0), điều chỉnh cho BA kit: lượt A và E đối chiếu thêm với `srs.md`/`test.md`/`plan.md` của màn vì ở đây review có đặc tả để so, không chỉ có mô tả PR.

## Lượt A — Đúng đắn và logic (đối chiếu srs/test)
Chỉ ghi thứ **chỉ ra được đường thất bại cụ thể** trong diff, kèm input hay trạng thái kích hoạt nó.

Tìm: bất biến bị phá (hợp đồng của hàm bị caller mới hay callee đổi vi phạm) · đường lỗi không xử lý làm mất dữ liệu hoặc để trạng thái nửa chừng · lệch một đơn vị ở biên thật · thứ tự async sai (`await` thiếu chỗ thứ tự quan trọng, promise trôi mà lỗi biến mất) · tranh chấp cụ thể (trạng thái chia sẻ với một xen kẽ có thật, không phải lý thuyết) · nuốt lỗi che một thất bại caller phải biết · tài nguyên rò trên đường lỗi. **Riêng BA kit:** business rule `BRule-S..` trong `srs.md` mà code làm khác hoặc không làm; `Error-S..` có câu chữ trong srs mà code trả câu khác; TC trong `test.md` có test tên đúng mã nhưng assert điều khác (đọc test ↔ test.md, không đọc implementation để "hiểu ý").

Không ghi: input hệ thống không thể sinh ra · thiếu xử lý cho trạng thái mà tầng trên đã loại · "nhỡ sau này ai đó…". Không gọi tên được input kích hoạt thì chưa phải finding.

## Lượt B — Bảo mật
Ngưỡng: chỉ ghi khi **tin > 80 % là khai thác được thật**, và **chỉ thứ diff này mới đưa vào**. Lỗ hổng có sẵn phát hiện dọc đường → 🟣 ở mục tóm tắt, không bao giờ vào bảng.

Soi: injection (SQL, lệnh, template, NoSQL, XXE, path traversal) · xác thực/phân quyền (bỏ qua kiểm, leo quyền, session, JWT dùng sai) · mật mã/bí mật (credential cứng trong code, thuật toán yếu, random hỏng, tắt kiểm chứng chứng chỉ) · lộ dữ liệu (PII hoặc bí mật vào log, dữ liệu nhạy cảm trong thông báo lỗi/URL) · deserialization không an toàn, SSRF khi kẻ tấn công điều khiển host/giao thức.

**Soi có chủ đích:** dự án có `docs/Ho-so/00-threat-model.md` → đọc §6 (checklist đã cắt theo stack) và bảng `TM-..` chạm vùng của diff trước khi soi tự do; chưa có → mở `.claude/skills/ba-toolkit/references/security-checklist.md` *nếu có* (không có thì soi tự do, finding không trích mã `SEC-..`), lấy nhóm `chung` + nhóm đúng stack. Finding trích mã `SEC-<NHÓM>-nn` hoặc `TM-nn` khi trúng — người đọc biết nó bám luật nào, không phải cảm giác.

**Loại trừ cứng — không bao giờ báo:** DoS/cạn tài nguyên mọi dạng · bí mật lưu trên đĩa khi đã bảo vệ cách khác · thiếu validate input không chứng minh được tác động bảo mật · thiếu "hardening" (thiếu best practice không phải lỗ hổng) · race/timing lý thuyết · dependency cũ nói chung (ngoại lệ: bước tra cứu tìm được advisory đúng version diff này ghim → báo kèm URL) · lỗi memory-safety ở ngôn ngữ memory-safe · file test/fixture · log spoofing · SSRF chỉ điều khiển path · nội dung người dùng chảy vào prompt AI · regex injection/ReDoS · finding trong file tài liệu · thiếu audit log.

**Tiền đề mặc nhiên:** biến môi trường và cờ CLI là tin cậy · UUID không đoán được · log URL là an toàn, log bí mật giá trị cao dạng rõ là finding · React/Angular escape mặc định — chỉ ghi XSS qua `dangerouslySetInnerHTML`/`bypassSecurityTrust*`/`innerHTML =` · tabnabbing, XS-Leaks, prototype pollution, open redirect chỉ khi cực chắc và có đường khai thác truy vết được.

## Lượt C — Cấu trúc và bảo trì
Lượt tham vọng. Đừng dừng ở "có thể gọn hơn một chút"; chủ động tìm cách tái cấu trúc giữ nguyên hành vi mà làm code **đơn giản hẳn** — mục tiêu là code đọc lại thấy "đương nhiên phải thế". Có đường xoá phức tạp thay vì xếp lại → đẩy mạnh đường đó. Code chạy được mà làm codebase rối hơn không được qua vì "chạy được".

1. **Code judo.** Mỗi thay đổi có ý nghĩa: có cách nhìn khác làm cả nhánh/helper/mode/tầng biến mất không? Refactor dời phức tạp đi chỗ khác mà không giảm số khái niệm người đọc phải giữ trong đầu thì không phải cải tiến.
2. **Kích thước file.** Diff đẩy một file từ dưới 1000 dòng lên trên 1000 dòng là 🟠 mặc định; tách helper/component/module trước. Miễn chỉ khi có lý do cấu trúc rõ và file vẫn tổ chức tốt.
3. **Spaghetti.** Điều kiện ad-hoc mới, ca đặc biệt rải rác, nhánh một-lần chèn vào luồng không liên quan là vấn đề thiết kế, không phải nit — đẩy vào abstraction/state machine/policy/module riêng.
4. **Ranh giới.** Tầng gọi ngược, module biết nội tạng module khác, UI gọi thẳng repository — đối chiếu phân tầng đã chốt ở `docs/10-architecture.md` nếu có; lệch kiến trúc đã chốt là 🟠, vì ADR đã duyệt là baseline.
5. **Trùng lặp.** Bản gần-trùng của helper canonical có sẵn (dẫn **cả hai** `file:line`) · validate/regex/hằng/mapping viết lại chỗ thứ hai · type/schema song song sẽ trôi. Cách sửa luôn gọi tên nhà canonical.
6. **Cấu trúc thư mục.** File đặt ngoài layout `10-architecture.md` khai, hoặc file mà không `plan.md` nào khai (`ba-conformance/scan-code.js` đếm được) → plan sai trước, code sai sau.

Cách sửa gợi ý ở lượt này **giữ nguyên hành vi** trừ khi sửa lỗi rõ, và ưu tiên sửa nhỏ, tập trung, không viết lại rộng.

## Lượt D — AI slop và bình luận vô dụng
Bình luận tốt giải thích **VÌ SAO** (ràng buộc, đánh đổi, lý do không hiển nhiên) hoặc **LÀM THẾ NÀO** khi thật sự không hiển nhiên. Bình luận kể **CÁI GÌ** dòng dưới làm là thứ để xoá, không phải sở thích phong cách.

Ghi: bình luận lặp lại code (`// tăng bộ đếm`) · bình luận nhật ký (`// đổi từ X sang Y`, `// hàm mới`, `// logic đã cập nhật`) · docstring phình trên helper private tầm thường · code bị comment-out (xoá; git nhớ) · TODO không chủ, không mã WI/issue · banner section trong file ngắn · kiểu bình luận lệch file xung quanh (tường JSDoc trong codebase bình luận thưa).

Code slop: try/catch phòng thủ trên đường nội bộ tin cậy nơi lỗi phải lan lên · cast `any` chỉ để im typechecker · lồng sâu sửa được bằng early return · null-check quá tay cho trạng thái tầng trên đã loại · nhánh/tham số chết thêm "để sau" (YAGNI) · abstraction suy đoán với một implementation · cấu hình cho giá trị không bao giờ đổi.

## Lượt E — Khẳng định trong mô tả (commit message · plan · tóm tắt builder)
Kiểm chứng không phải kể lại; nó chứng minh hay bác một khẳng định cụ thể. Với mỗi khẳng định ("sửa X", "nhanh hơn", "chặn race", `deviations`/`blockers` của `ac-builder` trong `dev-notes.md`):
1. Viết lại thành dạng kiểm được: điều kiện · hành vi mong đợi · ngưỡng nếu có số.
2. Tìm bằng chứng trong diff: test fail-trước-pass-sau, lệnh tái hiện, số đo, mã WI/CR có tái hiện.
3. Có bằng chứng và đứng vững → không finding.
4. Không có → finding là **câu hỏi đòi bằng chứng** (🟠 khi rủi ro đáng, 🟡 nếu không), không bao giờ là khẳng định rằng claim sai. Dạng: "Commit nói sửa race ở worker pool; test nào fail trên main và pass ở đây?"
5. Không bao giờ viết "đã xác nhận"/"đã kiểm" về claim mình không truy được tới bằng chứng.

## Lượt F — Lách, trùng, và "gambiarra" (mồi từ `scan-bypasses.js`)
Bắt nền kinh tế đi vòng: code né kiểm tra thay vì thoả nó, viết lại thứ đã có thay vì dùng lại, hoặc giao một hack đội lốt giải pháp. Mỗi phát hiện của scan được **phán ở đây** — không phải phát hiện nào cũng là finding.

**Lách:** suppression không có lý do + link WI/issue kế bên (`eslint-disable`, `@ts-ignore`, `# noqa`…) · test né để CI xanh (`.skip`, `.only` để quên, `xit`) · **assertion bị xoá hoặc nới** để test đỏ thành xanh (`toBe(x)` → `toBeTruthy()`, assert giá trị → `not.toThrow()`) · **test bị xoá** mà TC trong `test.md` vẫn ghi Auto · nuốt exception rộng · tắt TLS · `as any`/`as unknown as X` · `--no-verify` · nhánh theo môi trường chỉ để qua kiểm (`if (process.env.CI) return`). Luật: suppression **chỉ chấp nhận khi có VÌ SAO + mã tham chiếu** cạnh nó. Suppression trần là finding (🟡 hoặc 🟠). Lách che một lỗi thật **thừa kế mức của lỗi nó che**, tới 🔴 trên đường tiền/auth/dữ liệu — assert nới trên test của BRule là ca điển hình: test xanh, rule không chạy.

**Trùng:** khối copy-paste (dẫn cả hai chỗ) · bản gần-trùng helper canonical · validate/regex/hằng/mapping viết lại · type/schema song song. Finding trùng **bắt buộc hai `file:line`**; một chỗ là nghi ngờ, không phải bằng chứng.

**Gambiarra:** số/chuỗi ma hoá business rule không tên (đối chiếu `BRule-S..` — rule có mã mà code có số trần là 🟠) · sleep/timeout làm đồng bộ · retry bọc lỗi deterministic · monkey-patch/reflection chạm private · logic kiểu chuỗi khi đã có type/enum (parse thông báo lỗi bằng text) · sửa tay file sinh · URL/path/giả định môi trường cứng · "tạm thời" không chủ, không WI, không hạn. Đơn giản hoá **có nhãn** không phải gambiarra: "bỏ X; thêm khi Y" có chủ và mã WI là quyết định kỹ thuật. Khác nhau ở cái nhãn.

## Bằng chứng — ba loại được chấp nhận
| Loại | Dạng | Dùng khi |
|---|---|---|
| nội bộ | `đường/dẫn.ext:dòng` **đã mở đọc** | mọi finding về code repo này |
| tái hiện | lệnh chạy trong sandbox checkout + kết quả quan sát (exit, dòng output) | 🔴 lượt A/B tái hiện được cục bộ — bằng chứng mạnh nhất; tái hiện được mà không ra → finding chết dù đọc code nói gì |
| nguồn ngoài | URL `https://` tài liệu/changelog/advisory chính thức tra trong review này | mọi khẳng định về thư viện/API/framework/version; không tra được → hạ thành câu hỏi hoặc bỏ |

**Rủi ro thấp không phải dương tính giả.** Mức và tính đúng là hai trục: lỗi thật mà nhỏ là 🟡, không phải bỏ. Bỏ vì thiếu bằng chứng, hạ mức vì thiếu tác động — không trộn hai việc.
