# Phụ lục — Cổng & quản trị chất lượng (BA Toolkit)

> Phụ lục của `conventions.md` (cùng thư mục). **Cùng một nguồn sự thật**, tách ra để skill KHÔNG có cổng khỏi phải nạp ~140 dòng luật cổng — 25/55 skill `ba-*` không dùng tới file này. **"Xác nhận giả định" ở lại `conventions.md`** (9 skill/chế độ sinh giả định không dùng cổng nào khác).
> Tên mục giữ **nguyên văn**, nên mọi tham chiếu dạng `conventions.md` → "Cổng phương án" / "Quy ước gate" / "Xác nhận giả định" / "Cổng chốt kiến trúc" / "Review agent độc lập" / "Ngưỡng màn phức tạp" / "Hồ sơ dự án" vẫn đúng địa chỉ.

**Bốn cổng, và chúng KHÔNG thay nhau:**

| Cổng | Chạy khi nào | Chặn cái gì |
|---|---|---|
| **Cổng phương án** | *tiền kiểm* — trước khi ghi file nào | hiểu sai phạm vi, ghi đè nhầm |
| **Xác nhận giả định** *(ở `conventions.md`)* | sau khi doc đã có giả định | build trên điều chưa ai chốt |
| **Quy ước gate** (`ba-review`) | sau khi doc xong | hổng độ phủ / trace gãy |
| **Cổng chốt kiến trúc** | sau khi doc kiến trúc xong | code bám ADR còn Draft |

## Cổng phương án (BẮT BUỘC — trình phương án TRƯỚC khi ghi)
Ba cổng còn lại của toolkit (`Quy ước gate`, `Cổng chốt kiến trúc`, `Xác nhận giả định`) đều là **hậu kiểm** — soát sau khi file đã ghi. Cổng này là **tiền kiểm**: skill phải **đọc xong nguồn, trình cách nó hiểu + việc nó định làm, và CHỜ DUYỆT** rồi mới được tạo/sửa file. Bắt hiểu-sai lộ ra **trước khi** tốn công, và cho người dùng thấy đúng phạm vi sắp bị ghi đè.

**Áp cho** (danh sách canon = khóa `gate.plan.skills` trong khối registry — `lint.js` soát): mọi **orchestrator** + các **skill nguyên tử ghi nhiều file một lần** (`ba-screen-spec`, `ba-requirements`, `ba-screens`, `ba-architecture`, chế độ `ba-accept userguide`).

**Bốn bước:**
1. **Đọc nguồn trước** — đọc hết tài liệu đầu vào skill cần (đúng danh sách trong mục "Điều kiện"/"Quy trình" của skill). Chưa đọc mà đã trình phương án là vi phạm.
2. **Trình phương án** ra chat, đủ **sáu** phần (thiếu phần nào là gate không hợp lệ):

   | Phần | Nội dung |
   |---|---|
   | **Đã đọc** | liệt kê file thật sự đã đọc (đường dẫn) — không có file nào thì ghi rõ "dự án trống" |
   | **Hiểu** | 3–6 gạch đầu dòng tóm tắt phạm vi/nghiệp vụ theo cách skill hiểu |
   | **Sẽ làm** | bảng `bước · skill con · file TẠO/SỬA · điều kiện dừng` — ghi rõ **TẠO** hay **SỬA/GHI ĐÈ** |
   | **Giả định** | `GĐ-01…` đang dùng để lập phương án (nối mục "Xác nhận giả định") |
   | **Câu hỏi chặn** | thiếu thông tin nào thì KHÔNG chạy được |
   | **Ngoài phạm vi** | thứ người dùng có thể tưởng là sẽ làm nhưng skill sẽ KHÔNG đụng |

   **Báo giá (skill nặng — canon `gate.cost.skills`):** phương án có thêm **một dòng** `Ước tính: ~X token (khoảng A–B) · ~Y phút` lấy từ `node .claude/skills/ba-toolkit/scripts/cost.js estimate <skill> [--man N|--trang N|--frame N]` — chép nguyên dòng kèm nguồn (lịch sử dự án ≥3 lần hay bảng mặc định `cost-defaults.json`, hay mượn skill gần nhất). Script nói "không ước được" thì ghi đúng thế — **không tự bịa số**. Skill nặng **không** có cổng sáu phần (`ba-html-design` — cả chế độ `lofi` với khoá giá riêng `ba-html-design-lofi` —, `ba-figma-draw`, `ba-design-system`) vẫn in dòng này trước khi bắt tay. Chạy xong, orchestrator/agent ghi số thật: `cost.js record <skill> --tokens N --minutes M [--units N]` (token/phút lấy từ thông báo hoàn thành của Agent — **chỉ số ĐO được**; không có số đo thì bỏ qua, không ước) — để báo giá lần sau là số của chính dự án. `lint.js` mục 11 soát mỗi skill trong `gate.cost.skills` có nhắc `cost.js estimate`.
3. **Chờ duyệt** — `AskUserQuestion`: **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. **Chỉ "Chạy" mới được ghi file.** "Sửa"/"Thu hẹp" → chỉnh rồi trình lại (tối đa 2 vòng, sau đó hỏi thẳng người dùng muốn gì).
4. **Chạy đúng phương án đã duyệt.** Giữa chừng phát hiện phải làm thứ **ngoài phương án** (thêm file, đụng màn khác, đổi thứ tự) → **dừng, xin duyệt phần chênh**, không tự mở rộng.

**Được PHÉP bỏ chờ (vẫn phải IN phương án rồi chạy tiếp, không im lặng):**
- **Cổng cha bao phủ cổng con (LUẬT CHUNG — áp cho mọi skill trong `gate.plan.subskills`).** Skill được **một orchestrator đã qua cổng** gọi xuống thì **KHÔNG hỏi duyệt lại**: in phương án rút gọn (chỉ phần "Sẽ làm" + "Câu hỏi chặn" nếu có) rồi chạy tiếp. Lý do: phương án của cha đã liệt kê chính những file này, hỏi lại là bắt người dùng duyệt hai lần cùng một việc — và người bị hỏi nhiều lần sẽ bấm "Chạy" theo phản xạ, tức là cổng mất tác dụng ở **cả hai** tầng. Ngoại lệ **không** áp dụng trong 3 trường hợp, và mỗi skill dính ngoại lệ phải **nói rõ trong SKILL.md của mình** (im lặng thì không phân biệt được "cố ý" với "quên"):
  - (a) skill con phát hiện phải đụng file **ngoài** phương án cha → dừng, xin duyệt phần chênh theo bước 4;
  - (b) skill con là **cửa vào thay đổi baseline** (`ba-change-request`, `ba-task`) → luôn giữ cổng riêng dù ai gọi;
  - (c) thứ cần duyệt là **cái cha chưa nhìn thấy** nên không duyệt thay được — `ba-screens` (bảng màn + mã `S..`: sai là mọi tài liệu sau bám theo) và `ba-accept userguide` (mục lục cẩm nang). Hai chỗ này vẫn hỏi, nhưng **gộp vào một lượt**, không hỏi rời rạc.
- **Ngưỡng nhỏ:** phương án gọi **≤1 skill con** VÀ tạo/sửa **≤2 file**. *(Ghi chú thẳng: mọi skill trong `gate.plan.skills` đều vượt ngưỡng này theo thiết kế — kể cả `ba-add-screen` một màn cũng 6+ file. Nhánh này tồn tại cho skill sẽ được thêm sau, đừng cố lách vào nó.)*
- **Người dùng nói trước** "chạy thẳng" / "không cần hỏi" / "cứ làm đi" trong chính lượt gọi đó. Lời này chỉ có giá trị cho **lần chạy đó**, không kéo sang lệnh sau.
- **Chế độ batch/không tương tác** (subagent, CI): in phương án + đánh dấu `⚠️ chưa duyệt phương án` trong báo cáo cuối để vòng tương tác sau rà.

**Không được bỏ chờ khi:** ghi đè file đã có nội dung, xóa/đổi tên folder màn, đụng tài liệu đã chốt (baseline → phải qua `ba-change-request`), hoặc phương án chạm ≥3 màn.

**Nối phiên:** phương án đã duyệt mà phiên đứt → phiên sau trình lại **bảng rút gọn** (chỉ phần còn lại) + hỏi "tiếp tục?"; **KHÔNG** hỏi lại phần đã chốt.

**Quan hệ với các cổng khác:** cổng phương án đứng **trước** mọi thứ (chưa ghi gì); `Xác nhận giả định` chạy **sau khi** doc có giả định; `Quy ước gate` soát độ phủ **sau khi** doc xong; `Cổng chốt kiến trúc` chốt **quyết định** trong doc đã xong. Bốn cổng không thay nhau.


## Quy ước gate (ba-review)
Gate trong các orchestrator dựa trên mức ưu tiên gap mà `ba-review` gán. **Bốn mức**, và mức quyết định *khi nào* phải sạch chứ không chỉ *nặng đến đâu*:

| Mức | Nghĩa | Gate xử lý thế nào |
|---|---|---|
| 🔴 **Chặn** | thiếu artifact bắt buộc / trace gãy → bước sau không chạy được | **DỪNG ngay**, ở mọi gate, kể cả gap thuộc scope khác |
| 🟡 **Quan trọng** | hổng độ phủ ngay trong phần vừa làm | **DỪNG** — nhưng chỉ khi gap **thuộc scope gate vừa chạy** (xem luật phạm vi dưới) |
| 🟠 **Nợ có hạn** | đúng là thiếu, nhưng phải sạch trước **một mốc sau**, không phải bây giờ | **ĐI TIẾP**, ghi vào mục "Nợ có hạn"; gate của **mốc đó** mới chặn |
| 🟢 **Nhỏ** | nội dung có, chưa đủ chuẩn kỹ thuật | ĐI TIẾP, liệt kê trong báo cáo cuối |

**Luật phạm vi (quan trọng — sửa lỗi gate kêu oan):** một gate chỉ dừng vì 🟡 **của chính scope nó vừa chạy**, hoặc của scope **thượng nguồn mà nó phụ thuộc** (vd gate `<màn>` phụ thuộc `functions`/`screens`). 🟡 của scope **không liên quan** (vd màn `S03` thiếu "Ma trận lỗi" trong `srs.md` khi đang gate `functions`) → **liệt kê, không chặn**. Trước đây mọi 🟡 đều chặn mọi gate, nên gate kêu vì lý do không liên quan tới việc đang làm — và gate kêu oan nhiều lần thì người dùng học cách bỏ qua gate.

**🟠 bắt buộc ghi MỐC.** Cột `Mốc` của dòng gap phải nêu rõ *phải sạch trước cái gì* — `ba-build` · `dev-run` · `ba-html-design` · `ba-accept`. Không ghi được mốc thì **không phải 🟠**, chấm 🟡 như cũ. Mốc là thứ làm 🟠 khác "gap bị lờ đi": nó có hạn chót, và gate của mốc đó **chặn cứng** như 🔴.

**Sang giai đoạn sau mà 🟠 chưa sạch = đã quá hạn** → `ba-next`/`ba-dashboard` nâng thành việc **gấp**, `ba-build`/`dev-run`/`ba-accept` chặn theo mốc ghi trên dòng.

### Ghi `00-gaps.md` — GỘP theo scope, KHÔNG ghi đè cả file
`ba-review` gần như luôn chạy **theo scope hẹp** (một màn, một tài liệu) bên trong vòng lặp của orchestrator. Nếu mỗi lần chạy ghi đè cả file thì lần chạy `ba-review <màn cuối>` **xoá sạch** phát hiện của mọi scope trước — và `ba-next`/`status.js` sau đó đọc `00-gaps.md` sẽ báo một bức tranh sai (thường là "sạch") cho cả dự án. Luật:

1. **Header bắt buộc** ở đầu `00-gaps.md`, để người và script biết file này nói về cái gì và cũ hay mới:
   ```
   > Scope lần chạy gần nhất: `<scope>` · Ngày: `YYYY-MM-DD` · Đã phủ: `<scope-1>, <scope-2>, …`
   ```
   Dòng `Đã phủ` liệt kê **mọi scope còn có gap trong bảng**, cộng dồn qua các lần chạy.
2. **Scope hẹp → GỘP:** xoá các dòng gap **thuộc đúng scope vừa chạy** rồi chèn kết quả mới; **giữ nguyên** dòng của scope khác. ID `G01, G02…` đánh **liên tục toàn file** và **giữ nguyên cho dòng không bị đụng** — đó là điều làm ID ổn định để tham chiếu giữa các lần chạy.
3. **Chỉ `ba-review all` được ghi đè cả file** (nó phủ mọi scope nên không mất gì); khi đó `Đã phủ` = `all`.
4. **Orchestrator phải kết thúc bằng `ba-review all`** — mọi orchestrator đã làm vậy; `ba-batch` cũng bắt buộc, không được dừng ở vòng per-màn.
5. File cũ **không có header** → coi như scope `all` của lần trước, gộp bình thường và bổ sung header.
6. **Cột bảng:** `| ID | Mức | Scope | Mô tả | Vị trí | Mốc | Sửa bằng |` — cột `Mốc` **chỉ điền cho 🟠** (mức khác để `—`). Bảng cũ 6 cột (không có `Mốc`) vẫn đọc được: script bắt mức bằng emoji, không bằng vị trí cột; lần chạy sau bổ sung cột.
7. **Đánh dấu ĐÓNG ở Ô CUỐI của dòng, không xoá dòng.** Gap đã xử lý vẫn nằm lại (báo cáo là lịch sử soát), nên ô cuối phải **mở đầu** bằng một trong: `✅` · `**Đóng**` · `Đã đóng` · `Đã xử lý` · `Hoàn thành`, rồi tới cách sửa. `status.js` đếm gap theo luật này — dòng không đánh dấu = **còn mở**. Mặc định an toàn (không đánh dấu thì bị đếm), nhưng nếu quên đánh thì dự án đã sạch vẫn bị `ba-next` báo "🔴 CHẶN" mãi. Yêu cầu "mở đầu" là cố ý: mô tả gap có thể chứa chữ "đóng" (*"không đóng được modal"*) mà không phải trạng thái.
8. Cuối file, ngoài mục "Cần xác nhận" và "Rủi ro đã chấp nhận", thêm mục **"Nợ có hạn"** gom mọi 🟠 kèm mốc — để không ai phải đọc cả bảng mới biết còn nợ gì trước khi build.


## Review agent độc lập (khi nào tách khỏi gate inline)
Gate `ba-review` phần lớn chạy **inline** (kiểm tồn tại/trace — cơ học, không thiên vị). Chỉ tách ra **subagent read-only** khi việc soát là **phán đoán trên nội dung phức tạp do chính agent vừa sinh** (người tạo tự chấm thì thiên vị) và **trên ngưỡng** (dưới ngưỡng tự soát cho rẻ). Sáu agent (`.claude/agents/ba-*.md`, đều `tools: Read, Grep, Glob` — **không có Bash, không ghi file**, chỉ trả findings; skill nguồn mới là bên sửa/ghi):

| Agent | Soi cái gì | Ai spawn |
|---|---|---|
| `ba-diagram-reviewer` | độ phủ nghiệp vụ **một sơ đồ** | `ba-review diagram` khi sơ đồ phức tạp (≥3 vai trò / ≥5 quyết định / lồng ≥2 tầng / có loop) |
| `ba-inference-reviewer` | **suy luận reverse vs code thật** | `ba-reverse` sau khi sinh doc 🔶 |
| `ba-consistency-reviewer` | **mâu thuẫn giữa doc** (project: requirements↔functions↔roadmap · screen: 5 doc một màn ✅) | `ba-review functions\|all\|<màn>` |
| `ba-srs-quality-reviewer` | **chất lượng từng yêu cầu** trong một `srs.md` theo ISO/IEC/IEEE 29148 | `ba-review <màn>` khi màn phức tạp |
| `ba-manual-reviewer` | **cấu trúc mục lục cẩm nang** theo Diátaxis | `ba-accept userguide` GĐ1, trước HARD STOP |
| `ba-change-observer` | **ý nghĩa nghiệp vụ của MỘT LÔ thay đổi** vừa xảy ra trên tài liệu đã chốt | `ba-changelog` sau khi gom hàng đợi |

**Gói ngữ cảnh (BẮT BUỘC với mọi skill spawn agent).** Subagent **không thấy gì** từ phiên gọi nó — không lịch sử hội thoại, không file vừa đọc, không kết quả kiểm cơ học vừa chạy. Nên prompt spawn phải tự đóng gói: **scope** · **đường dẫn thật phải đọc** (không mô tả chung "các tài liệu liên quan") · **mã ID liên quan** · **phần đã kiểm cơ học rồi** (để agent không báo lại) · **khuôn findings phải trả về**. Thiếu khuôn thì mỗi agent trả một kiểu, skill gọi phải diễn giải lại, và **findings hai lần chạy không so sánh được** — hỏng đúng thứ `00-gaps.md` cần: mã `G..` ổn định. Mẫu đầy đủ: `ba-review` → "Gói ngữ cảnh gửi agent"; `ba-batch` → "context pack".

**Agent CHỈ ĐỌC — khoá bằng cấu hình, không bằng câu văn.** Mọi `.claude/agents/ba-*.md` phải khai `tools` và **không được** liệt `Write`/`Edit`/`Bash`/`Agent`. Không khai `tools` = mặc định được dùng mọi tool, kể cả ghi đè tài liệu giữa lúc fan-out 8 agent song song. `lint.js` check 30 chặn (gọi `ba-toolkit/scripts/check-agents.js`: roster khai `review:ro`, bắt thiếu `tools`/`model`).

**Không cái nào chồng cái nào** — đó là điều kiện để tách agent. Dễ nhầm nhất là cặp cuối: `ba-consistency-reviewer` quét **trạng thái tĩnh** (hiện giờ các doc có chọi nhau không), `ba-change-observer` diễn giải **sự kiện** (vừa đổi gì, tác động ra sao, có cần CR không) — quét toàn cục vs quan sát một lô. `ba-review` cơ học vẫn lo *thiếu artifact/trace gãy*. **Đừng tăng số agent nếu việc soát chỉ là kiểm cơ học** — cơ học thì viết script (`scan.js`/`refresh.js`/`ledger.js`), rẻ hơn và không thiên vị.


## Cổng chốt kiến trúc (BẮT BUỘC khi có 10-architecture / 11-integration)
Kiến trúc kỹ thuật (`ba-architecture` → `10-architecture.md`) và kiến trúc tích hợp (`ba-integration` → `11-integration.md`) là **bước có gate** trong pipeline, KHÔNG phải adjunct rời:
1. **Chạy** skill sinh doc.
2. **Gate độ phủ:** `ba-review architecture` (+ `integration`) — còn 🔴/🟡 → dừng, sửa.
3. **Cổng CHỐT (quyết định):** trình người dùng bảng **quyết định lớn + ADR** (stack/kiểu KT/lưu trữ/auth/tích hợp/MDM) → hỏi **Chốt / Sửa / Hoãn** (AskUserQuestion). **Chỉ khi Chốt** → ADR/hợp đồng trạng thái **Accepted** + ngày; đây là mốc `ba-build`/`dev-run` được phép bám.
4. **Trạng thái ADR:** `Draft` (đang soạn) → `Accepted` (đã chốt, **có ngày**) → `Superseded bởi ADR-..` (bị ADR mới thay, khi đổi qua CR) · `Deprecated` (không còn khuyến nghị, chưa có gì thay). **ADR bất biến** — không sửa ADR cũ. Hình của từng ADR soát bằng `ba-architecture/scripts/check-adr.js` (skill đó chưa cài — bộ cài lõi — thì `ba-review` ghi 🟢 "chưa soát" thay vì chạy). **`ba-build`/`dev-run` CHỈ dùng bản Accepted**; ADR còn `Draft`/`⚠️ chưa chốt` → `ba-review` gắn **🟠 Nợ có hạn** (`Mốc = ba-build`): không chặn gate đặc tả đang chạy, nhưng chặn cứng ở `ba-build`. Phân loại canon: `ba-review` → "Phân loại 🟠".
5. Chế độ batch không hỏi được → giữ `Draft` + `⚠️ chưa chốt` (fallback), vòng sau chốt.

Đổi kiến trúc sau khi đã Accepted → qua `ba-change-request` (thêm ADR mới "supersedes" ADR cũ, không sửa lịch sử).


## Ngưỡng "màn phức tạp" (canon — dùng chung cho mọi agent gate cấp màn)
Một màn là **phức tạp** khi thỏa **≥1**: **≥3 vai trò/tác nhân** (bảng "Tác nhân & hệ thống ngoài" của `srs.md`) · **≥5 điểm quyết định hoặc luồng** (đếm ở `usecase.md`/"Sơ đồ luồng") · **có state machine** (màn có vòng đời trạng thái) · **có hệ thống ngoài** (dòng "hệ thống ngoài" ở bảng Tác nhân).
Ngưỡng này gate **cả hai**: spawn `ba-diagram-reviewer` (độ phủ sơ đồ) **và** spawn `ba-srs-quality-reviewer` (chất lượng yêu cầu). Dưới ngưỡng → skill tự soát, không spawn agent.


## Hồ sơ dự án (`full` / `lite` / `mini`) — khai một lần, cả toolkit nhẹ theo
Toolkit có **4 cổng · 6 review agent · 3 sổ · 3 trục soát · 9 file mỗi màn**. Một dự án 8 màn hai người **không cần** ngần ấy, và ép dùng hết thì người ta bỏ qua cả những thứ đáng giữ. Vì vậy dự án khai **một dòng** mức đầu tư mình muốn, ngay dưới tiêu đề `docs/00-tracking.md`:

```
> Hồ sơ dự án: `mini` · chốt 2026-08-17
```

Ba mức là **bậc thang lồng nhau** — `mini` tắt mọi thứ `lite` tắt, cộng thêm bộ artifact:

| | `full` (mặc định) | `lite` | `mini` |
|---|---|---|---|
| Chuỗi ID + truy vết `BR→…→TC` | ✅ | ✅ | ✅ **giữ** — đây mới là lõi thật |
| `00-tracking.md` · sổ **CR** `00-cr.md` | ✅ | ✅ | ✅ **giữ** — đổi baseline vẫn phải qua CR |
| 4 cổng (phương án · gate · giả định · chốt kiến trúc) | ✅ | ✅ | ✅ **giữ** — cổng là thứ rẻ nhất và đáng nhất |
| **Bộ file mỗi màn** | 9 | 9 | **5** — `ascii-screen · srs · html-design · test · plan` |
| Sổ **Work Item** `00-backlog.md` | ✅ | ❌ tắt — việc dev bám cột `dev` + sổ CR | ❌ |
| **Nhật ký thay đổi** `00-changelog.md` + nhánh change-watch của hook | ✅ | ❌ tắt | ❌ |
| **Đối chiếu code** `ba-conformance` (bắt buộc trước `ba-accept`) | ✅ | ❌ tắt — vẫn chạy tay được | ❌ |
| **Review agent** (consistency/srs-quality/diagram) | ✅ | ❌ tắt — gate chỉ kiểm **cơ giới** | ❌ |

**`mini` bỏ 4 file — và nội dung của chúng đi đâu (KHÔNG mất, chỉ dồn chỗ):**

| File bỏ | Nội dung chuyển vào |
|---|---|
| `usecase.md` | luồng chính + **luồng ngoại lệ** mô tả ngay trong `srs.md` (mục "Luồng"); `E-S..` vẫn bắt buộc |
| `userstory.md` | tiêu chí chấp nhận **Given-When-Then** thành một mục của `srs.md` — `ba-test`/`ba-accept uat` đọc ở đó |
| `design-spec.md` | UI state · CTA · microcopy · **Animation chuyển cảnh** thành mục của `srs.md`; `ba-html-design` đọc `srs` + `ascii-screen` |
| `brainstorm.md` | bỏ hẳn — artifact *quá trình*, không skill nào tiêu thụ bắt buộc |

**Luật:**
1. **Không khai = `full`.** Mặc định này cố ý: mọi dự án cài trước 16/08/2026 giữ nguyên hành vi, nâng cấp toolkit **không được lặng lẽ tắt bớt cơ chế — hay artifact — của ai**.
2. **Script đọc qua `ba-toolkit/profile.js`** (`readProfile`/`isLite`/`isMini`/`off`/**`screenFiles`**) — không script nào tự parse, không skill nào tự nhớ danh sách 9 file.
3. **`lite`/`mini` không cho phép làm ẩu.** Chúng cắt *lớp quản trị* rồi *tầng diễn giải*, không cắt *chất lượng*: chuỗi truy vết, ma trận lỗi `E-S..`, `TC` phủ mọi `R-S`, gate cơ giới và sổ CR vẫn nguyên ở cả ba mức. Muốn bỏ những thứ đó thì không phải chọn hồ sơ, mà là không dùng toolkit.
4. **Hoàn thành = đủ bộ file CỦA HỒ SƠ ĐÓ**, không phải luôn 9/9: `mini` là **5/5**. `refresh.js`/`status.js`/`ba-review` lấy bộ file qua `screenFiles()`, đừng hardcode.
5. **Đổi hồ sơ giữa chừng được**, sửa dòng đó là xong. Lên mức đầy hơn (`mini → lite → full`): file/sổ còn thiếu sẽ do skill tương ứng tạo khi chạy lần đầu — `ba-track refresh` đánh `⬜` cho cột mới hiện ra, **không** coi màn đang ✅ thành hỏng. Xuống mức gọn hơn: **không xoá** file đã có (chúng là lịch sử) — chỉ ngừng đòi và ngừng tính vào "hoàn thành".
6. Skill/script tôn trọng hồ sơ phải **nói ra khi bỏ qua** (`⚙️ mini: bỏ usecase/userstory/design-spec — nội dung dồn vào srs`), không im lặng — người đọc báo cáo cần biết cái gì đã không chạy.

### Phạm vi (`full` / `docs`) — trục thứ hai: có dev hay không

Hồ sơ trả lời *"đầu tư bao nhiêu vào tài liệu"*; nó **không** trả lời *"repo này có viết code không"*. Có dự án đi hết chuỗi tới `dev-run`/`ba-accept`, có dự án **dừng ở tài liệu BA** để đội khác build (hoặc để khách duyệt). Hai trục **độc lập**: `mini` vẫn có thể dev, `full` vẫn có thể chỉ tài liệu. Khai cùng dòng với hồ sơ (hoặc dòng riêng, vẫn trong 12 dòng đầu `00-tracking.md`):

```
> Hồ sơ dự án: `lite` · Phạm vi: `docs` · chốt 2026-09-15
```

| | `full` (mặc định) | `docs` |
|---|---|---|
| Bộ skill cài (`ba-export --scope`, `--profile full`) | 67 | **40** — bỏ canon `scope.dev.skills` (`ba-build` `ba-feasible` `ba-api-test` `ba-test-e2e` `ba-prototype` `ba-conformance` `ba-auto`) + toàn bộ `dev-*`/`ac-*`. Phạm vi được **ghi nhớ trong manifest**, `update` giữ nguyên |
| `plan.md` trong bộ file màn | ✅ | ❌ **không tồn tại theo thiết kế** — `screenFiles()` bỏ; "Hoàn thành" = đủ tài liệu |
| Cột `dev` trong tracking | `⬜/🔨/✅` do `dev-run` quản | `—` |
| Vòng đời | GĐ1 → GĐ2 → **GĐ3 dev** → **GĐ4 nghiệm thu** | GĐ1 → GĐ2 → **GĐ3 bàn giao tài liệu**: `ba-review all` → `ba-trace` → (`ba-accept uat`) → `ba-portal`/`ba-onepager` |
| `ba-next` | gợi `ba-build`/`dev-run`/`ba-accept`/`ba-conformance` | **không bao giờ** gợi chúng (chỉ gợi chế độ bàn giao `ba-accept uat`); in `⚙️ phạm vi docs` |
| Nợ 🟠 mốc `ba-build`/`dev-run`/`ba-accept` | thu ở mốc đó | thu ở **`ba-review all` trước bàn giao** (mốc gần nhất còn tồn tại) |
| Hook `S3` (gate dev thật) | theo `.claude/ba-hooks.json` | luôn tắt |

Giữ ở BA dù nghe "kỹ thuật": `ba-reverse` (tiếp quản codebase để viết tài liệu vẫn là việc BA), `ba-architecture`/`ba-api-spec`/`ba-data-model` (tài liệu kỹ thuật là **sản phẩm bàn giao**), `ba-accept` (chế độ `uat`/`release`/`userguide` là bàn giao tài liệu; chế độ nghiệm thu trọn đọc `readScope` và **từ chối** ở `docs`), `ba-proto-first html` (prototype một file để chốt nghiệp vụ, không phải code dự án). Luật 1–6 ở trên áp nguyên cho phạm vi: không khai = `full`; đọc qua `profile.js` (`readScope`/`isDocsOnly`/`off().dev`); đổi giữa chừng được (`docs → full`: chạy `ba-export update --scope full`, `refresh.js` hiện lại cột `plan` ⬜); script phải nói ra (`⚙️ phạm vi docs: …`).


## Đội agent (họ `ac-*` — agentcode, từ 15/09/2026)

`dev-*` là kỷ luật của **một** agent; đội agent là cách **nhiều** agent chia vai mà không ai tự chấm bài của mình. Bốn luật, và mọi luật đều có máy soát (`ba-toolkit/scripts/check-agents.js`, lint check 30; `ac-verify/scripts/check-plan.js` + `validate-done.js`):

1. **Agent là file có hợp đồng, có trong sổ đội.** `.claude/agents/<tên>.md` phải có frontmatter `name/description/tools/model`, mục **"Ai phái · trả về đâu"**, câu **"không spawn agent con"**, và một dòng `<tên>:<loại>:<quyền>` trong `agents.roster` (`conv-registry.md`). Không có trong sổ = không được phái. Loại (`agents.kinds`): `review` (soát tài liệu — chỉ đọc, **không Bash**) · `verify` (chứng minh code — chạy proof, **bắt buộc Bash**, không sửa) · `build` (viết code, GĐ2). Quyền `ro` = không `Write/Edit/NotebookEdit/Agent`.
2. **Tác giả không phải người chấm.** "Xong" của một màn là verdict của agent `verify` **mới** (ngữ cảnh trống), do **orchestrator** phái **sau lô cuối** — không bao giờ do builder/subagent viết code phái, vì kẻ vừa đóng lô cuối viết brief thì verifier thừa hưởng *phạm vi* của nó. Verdict trả về orchestrator, không về builder. Tự kiểm (`dev-verification-before-completion`) vẫn làm — nó là kỷ luật trước khi đưa ra chấm, không phải bằng chứng.
3. **Không proof, không check.** Mỗi task trong `plan.md` có `**Proof:**` — lệnh mà exit code quyết định — và verifier chạy **y nguyên**, không tự nghĩ lệnh. `check-plan.js` chặn plan thiếu Proof/Trace test/DoD hoặc phụ thuộc vòng **trước** khi tốn agent; `validate-done.js` đòi `verification.md` có `model:`/`diff:`, một dòng mỗi task, exit code, `file:line`, `Verdict: PASS`. Một chỗ đỏ = FAIL; không có "PASS có điều kiện".
4. **Blast radius.** Plan đã duyệt cho phép **sửa file + commit cục bộ** trên nhánh feature. `git push`, force-push, deploy, dữ liệu production, xoá nhánh người khác → hỏi người dùng **từng lần**, kể cả plan có ghi; agent con càng không được.
5. **Phiên ngắn, trạng thái trên đĩa; việc nặng vào agent ngữ cảnh trống.** Mỗi lượt Claude Code nạp lại toàn bộ ngữ cảnh — đo 17/09/2026: một phiên 6 774 lượt "một agent làm hết" tốn 3,8 tỷ token cache-read, gấp 25 lần phiên có fan-out. Vì thế: orchestrator giữ ngữ cảnh mỏng (brief tối giản, đọc theo ID qua `ba-index`), việc viết/chấm/review giao cho subagent ngữ cảnh trống rồi để nó biến mất; ≥ 2 màn thì fan-out (`ba-batch`), không đặc tả tuần tự inline; mọi trạng thái cần cho phiên sau nằm trên đĩa (`00-tracking`, `ac-state.json`, `ac-mission.json`, sổ PO) để mở phiên mới không mất gì. Hook `S8` nhắc khi **tỷ lệ tool/lượt < 1,5** sau 150 lượt gọi tool — thước MB cũ đo sai thứ: đo 19/09/2026, tổng MỌI nội dung tool của một phiên 23,7 MB chỉ ~1,4 M token (78% số byte là ảnh base64, vốn chỉ ~2-3k token/ảnh), nên tiền nằm ở SỐ LẦN lặp lại chứ không ở kích thước. Chi phí mỗi agent ghi vào sổ `cost.js` (`.claude/ac-cost.jsonl`) — không đo thì không tiết kiệm được. Model: `opus` mặc định, `sonnet` cho việc cơ giới, model khác hỏi người (`agents.models`).
   **Kỷ luật ngữ cảnh (đo 19/09/2026, nguyên văn từ dự án e-learning `1eb6cf0` — khối rút gọn nằm trong CLAUDE.md managed của `ba-export`):** chi phí một phiên ≈ **số lượt × ngữ cảnh mỗi lượt**. Phiên `547bd253` (23,7 MB / 2.726 lượt): **tổng mọi** kết quả tool của cả phiên chỉ **5,4 MB ≈ 1,4 M token**, trong khi một phiên cùng dạng tốn **3,8 TỶ** token cache-read — tỷ số ~1000×: tiền không nằm ở *cái ta đọc*, nằm ở **số lần đọc lại cái đã đọc**.
   1. **Gộp tool độc lập vào MỘT lượt.** Phiên đo được **1,00 tool/lượt trên 1.493 lượt — không gộp lần nào.** Ba lệnh không phụ thuộc nhau chạy rời = ba lần nạp lại cả ngữ cảnh; gộp lại là một. Đây là đòn duy nhất cắt chi phí mà **không mất một byte ngữ cảnh nào** (khác `/compact`, khác `/clear`). Hook `S8` canh tỷ lệ này.
   2. **Việc dò tìm → subagent ngữ cảnh trắng, không làm inline.** Đối chứng cùng phiên: subagent 4 tool call tốn 41,7k token và trả về 80 chữ; 4 call inline tốn 4 lần nạp cả ngữ cảnh tích luỹ.
   3. **Ảnh → phái subagent đọc rồi trả về CHỮ.** Ảnh bị co về cạnh dài 1568 px trước khi tính token nên chỉ ~2–3k token/ảnh (tiền lẻ), nhưng base64 của nó phồng transcript và làm lệch mọi thước đo theo MB. Đây là **luật, không phải cổng**: hook `PreToolUse` áp **cả lên subagent**, nên chặn ảnh ở hook là chặn luôn chính người được phái đi đọc ảnh.
   4. **Tài liệu lớn đọc bằng lát, không Read trọn.** `ledger.js docs/00-cr.md get CR-174` · `ba-index/query.js get TC-S57-30` · `sed -n '120,180p'` · `grep -n`. Đọc trọn `docs/00-cr.md` ≈ **258k token**.
   5. **Chạy gọn:** `--plain` cho script toolkit, `--reporter=dot` cho vitest, `| tail -20` cho log dài.
   Vế **số lượt** giữ lại từ S7 (người dùng chốt 19/09): > 300 lượt kể từ compact cuối → nhắc mở phiên mới — phiên 2 000 lượt đã gộp tốt vẫn là 2 000 lần nạp ngữ cảnh; chỉ vế MB bị bỏ.
6. **Checker báo oan → báo bằng `oan.js`, KHÔNG lách.** Thấy checker bắt sai: `node .claude/skills/ba-toolkit/scripts/oan.js add --checker <skill/script> --code <MÃ> --where <file:dòng> --reason "…"` (sổ append-only `.claude/checker-oan.jsonl`; mọi danh sách P in sẵn dòng này), giữ nguyên tài liệu và nêu mã `OAN-n` lúc giao. **Lách** — bỏ ký tự (hex mất `#`), đổi sang entity (`&#8594;`), chép script toolkit ra chỗ khác để sửa, thêm chú thích/`data-*` cho checker im — **là vi phạm như sửa test cho xanh**: `ba-toolkit/scripts/scan-lach.js` dò dấu vết trong diff (LACH-HEX/ENTITY/COPY/SUPPRESS). Brief subagent phải chép luật này. Vì sao: dự án TTS 05/10/2026 — ba lần checker oan đều chỉ lộ qua cách agent lách, không qua lời báo (`docs/decisions/22`, `24`).

**Mức tự chủ** (`agents.autonomy`, mặc định `solo`): `paired` (check-in trước mỗi bước lớn) · `solo` (tự làm; chỉ dừng khi hành động phá huỷ/không đảo được, ngõ cụt thật, hoặc quyết định nghiệp vụ `PD`) · `heads-down` (chỉ dừng khi phá huỷ/ngõ cụt). Luật kiểm chứng **không nới theo mức** — mức chỉ đổi độ nói nhiều. GĐ1 mới khai canon; orchestrator chia lô của GĐ2 là nơi đọc.

**Các vai trong sổ đội (15/09/2026):** `ac-verifier` (verify — chứng minh đúng đặc tả theo Proof, PASS/FAIL) · `ac-judge` (verify — chất lượng/rủi ro của diff, verdict APPROVE/COMMENT/REQUEST_CHANGES, `review-gate.js`) · `ac-evaluator` (verify — chấm từng TC/AC 2/1/0/—, điểm % so sánh được, `check-eval.js`) · `ac-builder` (build — một lô, tóm tắt 4 trường) · `ac-juror` (review — một phiếu mù trong hội đồng `ac-jury`, `tally.js`) · 6 reviewer `ba-*` (review tài liệu). Trí nhớ đội (`ac-memory`): `docs/Ho-so/notes/` đọc trước mission, `00-lessons.md` chỉ `confirmed` vào brief.

Ranh giới với mục "Review agent độc lập" ở trên: mục đó nói *khi nào* tách một reviewer khỏi gate inline và trần 8 agent; mục này nói *hợp đồng* của mọi agent trong sổ và luật tác giả ≠ người chấm cho khâu dev. Lộ trình đầy đủ: `docs/superpowers/specs/2026-09-15-agentcode-kit.md`.

## Nhiều phiên trên một repo (W7, 06/10/2026)

Nhánh là của **thư mục làm việc**, không của phiên: hai cửa sổ Claude chung một thư mục thì phiên này `git switch` là thay đổi chưa commit của phiên kia đi theo (ca thật dự án desktop 06/10/2026 — sửa dở của phiên A trôi sang `main`, html S34 lẫn sửa của hai phiên, không tách commit được).

1. **Commit chỉ file của mình:** `git add <đường dẫn>` từng file mình đã sửa — **không** `git add -A` / `git add .` / `git commit -a` ở repo mà phiên khác có thể đang chạm.
2. **Làm song song thì tách worktree:** `git worktree add ../<repo>-<việc> -b <nhánh>` rồi mở phiên kia ở đó — mỗi worktree một thư mục, một nhánh, một sổ phiên riêng.
3. **Không đổi nhánh dưới chân phiên khác:** thấy phiên khác đang mở cùng thư mục thì không `switch`/`checkout`/`stash`/`reset` ở đó.

Máy nhắc (không chặn): hook `hook-session.js` (`SessionStart` + `UserPromptSubmit`, sổ `.claude/ba-session.json`) — `S9a` nhánh đổi dưới chân phiên, `S9b` phiên khác còn sống trong 30 phút cùng thư mục; mỗi việc nhắc một lần. Vì sao: `docs/decisions/w7-khoa-giua-cac-phien.md`.

## Cổng mới phải chạy thật trước main (25/09/2026)

**Checker/cổng mới chưa chạy trên một dự án thật thì chưa được coi là cổng.** Nhóm đối kháng của `test.js` chứng minh checker không luôn-exit-0 trên fixture *ta viết*; nó không chứng minh checker nhìn thấy gì trên dự án *người khác viết*. Bằng chứng: lần đầu chạy trên hình thật, dự án desktop 4/5 script mới sai im lặng; dự án helpdesk 24/09 validate-done 5 kiểu oan, scan-bypasses exit 256→0, scan-wiring im vì tên nhắc trong `.md`.

- **Sổ:** `ba-toolkit/references/realrun.json` — khoá `<skill>/<script>` (hoặc `…#<mã luật hook>`) → các lần chạy `{duAn, ngay, ref, ketQua: bắt|im|oan, ghiChu?}`. Lần chạy ở `toolkit`/`example`/`dogfood` không tính. `im` gồm cả "chạy đúng, không có gì để bắt" — ghi rõ trong `ghiChu`.
- **Máy soát:** `ba-toolkit/scripts/realrun.js` liệt kê checker (tên `check-*`/`validate-*`/`scan-*`/`inspect-*`, danh sách `CỔNG_KHÁC`, mọi luật hook trong `hook-gate.js` → `LUẬT_CỦA_HOOK`) chưa có lần chạy thật. `--strict` (CI) đỏ khi có checker chưa chạy thật **mới** hoặc baseline **thừa** — `realrun.baseline.json` là bánh cóc, chỉ được thu hẹp; nới cần `--write-baseline --allow-grow` và **người dùng chốt**.
- **Ai ghi:** người viết checker (`ba-new-skill` bước 18), hoặc bất kỳ phiên nào chạy checker trên dự án thật và thấy nó bắt/im/oan — thêm một dòng, kèm `ref` lần theo được.
