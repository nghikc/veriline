# Quy ước — Sổ & đối chiếu (phụ lục của `conventions.md`)

> Tách khỏi `conventions.md` để giảm chi phí nạp: chỉ những skill **đụng tới sổ hoặc đối chiếu code** mới cần đọc file này (`ba-change-request`, `ba-task`, `ba-changelog`, `ba-conformance`, `ba-review` scope `all`, `ba-accept`, `ba-dashboard`, `ba-next`). Vẫn là **cùng một nguồn sự thật** với `conventions.md` — mọi tham chiếu dạng `conventions.md` → "Change Request (CR)" trỏ về đây.

Bốn thứ trong file này, đừng lẫn:

| | `00-cr.md` | `00-backlog.md` | `00-changelog.md` | `00-conformance.md` |
|---|---|---|---|---|
| Bản chất | **quy trình phê duyệt** | **quy trình giao việc** | **nhật ký quan sát** | **báo cáo đối chiếu** |
| Trục | tài liệu ↔ tài liệu | công việc | tài liệu ↔ chính nó theo thời gian | **tài liệu ↔ code** |
| Xoá dòng? | KHÔNG (là sổ) | KHÔNG (là sổ) | KHÔNG (là sổ) | **có — ghi đè mỗi lần chạy** |

---

## Change Request (CR) — sổ `docs/00-cr.md`
Do `ba-change-request` quản. Là **nguồn sự thật** về lịch sử thay đổi & quyết định của dự án — mọi thay đổi vào chức năng/màn đã có phải có một dòng ở đây.

**Mã:** toàn cục `CR-01`, `CR-02`… (xem "Mã định danh" ở `conventions.md`). Một dòng bảng tổng = một CR + một mục chi tiết `### CR-NN`. **Không xoá dòng** — CR Từ chối/Hoãn/Đóng đều giữ lại (sổ là lịch sử).

**Đọc sổ bằng script (tiết kiệm token — BẮT BUỘC khi sổ lớn):** không Read nguyên `00-cr.md` cho thao tác cơ giới. Dùng `ledger.js` (zero-dep): `node .claude/skills/ba-toolkit/scripts/ledger.js docs/00-cr.md <summary|next|get CR-NN|ids>` → trả JSON compact (đếm/đang mở · mã kế tiếp · 1 block chi tiết · cross-check marker). Chỉ Read/Edit trực tiếp khi thêm/sửa một mục. Áp cho cả `00-backlog.md`.

**Vòng đời (trạng thái):**
`Đề xuất → Đang phân tích → Đã duyệt → Đang triển khai → Đã triển khai → Đóng`, với hai nhánh rẽ ở cổng duyệt: **Từ chối** (không làm) và **Hoãn** (để sau, ghi điều kiện mở lại). Mỗi chuyển trạng thái ghi ngày + người quyết + lý do.

**Cột bảng tổng:** Mã CR | Ngày mở | Người YC | Tóm tắt | Ưu tiên (MoSCoW) | Ảnh hưởng (`S..`/`F..`) | Trạng thái | Cập nhật cuối. **Cột tuỳ chọn cuối bảng `Jira`** (khoá Jira dạng `<DỰ ÁN>-<số>`, có thể là link, `—` khi chưa có) — do `ba-atlassian apply` thêm lần đầu; khi cột đã tồn tại, mọi dòng mới phải đủ ô (hook H1 bắt lệch cột). Khoá Jira là mã ngoài, không thuộc chuỗi truy vết.

**Mục chi tiết mỗi CR** (bên dưới bảng): Mô tả & lý do · **Phân tích ảnh hưởng** theo chuỗi truy vết (liệt kê `BR/FR/F/S/R-S/UC/TC` bị chạm) · Ước lượng & rủi ro · Quyết định (người duyệt + ngày) · Phạm vi thực tế (docs + file code) · Commit/nhánh · Lịch sử trạng thái.

**Template khởi tạo `docs/00-cr.md`:**
```markdown
# Sổ Change Request

| Mã CR | Ngày mở | Người YC | Tóm tắt | Ưu tiên | Ảnh hưởng | Trạng thái | Cập nhật cuối |
|-------|---------|----------|---------|---------|-----------|-----------|---------------|
| CR-01 | 2026-07-12 | (tên) | (tóm tắt 1 dòng) | Should | S02, F05 | Đề xuất | 2026-07-12 |

---

### CR-01 — (tóm tắt)
- **Mô tả & lý do:** …
- **Phân tích ảnh hưởng (truy vết):** BR-.. → FR-.. → F.. → S.. → R-S..-.. → UC..-.. → TC..-..
- **Ước lượng & rủi ro:** … (docs cần sửa + độ lớn code + rủi ro)
- **Quyết định:** Đề xuất — chờ duyệt.
- **Phạm vi thực tế:** — (điền khi triển khai)
- **Commit/nhánh:** —
- **Lịch sử trạng thái:** 2026-07-12 Đề xuất.
```

**Soát chéo (ba-review, scope all):** marker `CR-NN` trong tài liệu phải có dòng trong sổ; CR trạng thái **Đóng/Đã triển khai** không còn tài liệu ⚠️ chưa đồng bộ → nếu vi phạm gắn gap **🟢 Nhỏ**.

## Work Item (WI) — sổ `docs/00-backlog.md`
Do `ba-task` quản. Là **nhật ký công việc phát triển KHÔNG phải Change Request** — tính năng mới trong phạm vi, task kỹ thuật (refactor/hạ tầng/CI/bảo mật nền), bug, spike. Bổ khuyết cột `dev` của `00-tracking.md` (cột đó chỉ roll-up trạng thái code **theo màn**, không ghi được việc phi-màn lẫn xuất xứ/vòng đời).

**Phân biệt với CR (quan trọng):** CR = **THAY ĐỔI cái đã chốt (baseline)** — sửa FR/F/S/rule đã có, cần phân tích ảnh hưởng + cổng duyệt. WI = **VIỆC MỚI trong phạm vi** hoặc **việc thuần kỹ thuật** — không đổi baseline mà *tạo* baseline mới. Nghi ngờ → nếu sửa một yêu cầu ĐÃ CHỐT thì là CR, còn thêm mới/kỹ thuật thì là WI.

**Mã:** toàn cục `WI-01`, `WI-02`… (xem "Mã định danh" ở `conventions.md`). Một dòng bảng tổng = một WI + một mục chi tiết `### WI-NN`. **Không xoá dòng** — WI Xong/Hủy đều giữ lại (sổ là lịch sử).

**Loại (`Loại`):** `Feature` (tính năng/màn mới trong phạm vi) · `Task` (việc triển khai thường) · `Bug` (cái đã build nhưng sai đặc tả) · `Tech` (nợ kỹ thuật/refactor/hạ tầng) · `Spike` (khảo sát có thời hạn). Bug **gộp chung sổ này** mặc định (không tách sổ defect riêng).

**Vòng đời (trạng thái):**
`Backlog → Sẵn sàng → Đang làm → Đang review → Xong`, với hai nhánh rẽ: **Blocked** (ghi chặn ở đâu + điều kiện gỡ) và **Hủy** (không làm, ghi lý do). Mỗi chuyển trạng thái ghi ngày + người + ghi chú.

**Cột bảng tổng:** Mã WI | Ngày mở | Loại | Phụ trách | Tóm tắt | Ưu tiên (MoSCoW) | Trace (`FR`/`F`/`S`) | Trạng thái | Cập nhật cuối. **Cột tuỳ chọn cuối bảng `Jira`** (khoá Jira dạng `<DỰ ÁN>-<số>`, có thể là link, `—` khi chưa có) — do `ba-atlassian apply` thêm lần đầu; khi cột đã tồn tại, mọi dòng mới phải đủ ô (hook H1 bắt lệch cột). Khoá Jira là mã ngoài, không thuộc chuỗi truy vết.

**Mục chi tiết mỗi WI:** Loại · Nguồn · Mô tả & mục tiêu · Trace (chuỗi truy vết ở mức phù hợp: Feature→`FR`/`F`/`S`; Bug→`R-S`/`TC`; Tech→`NFR`/ràng buộc) · Phạm vi dự kiến · Phụ trách + Ưu tiên · Phạm vi thực tế (docs + file code, điền khi Xong) · Commit/nhánh · Lịch sử trạng thái. Template khởi tạo ở `ba-task/template.md`.

**Nối luồng:** `dev-run` cập nhật WI khi build (song song cột `dev`); `ba-discover meet` mở WI cho `ACT` là việc-mới/kỹ-thuật (mở CR nếu là thay đổi); `ba-next` liệt kê WI đang mở (Backlog/Đang làm/**Blocked** = gấp).

**Đọc sổ bằng script (tiết kiệm token):** như CR — `node .claude/skills/ba-toolkit/scripts/ledger.js docs/00-backlog.md <summary|next|get WI-NN|ids>`; đừng Read nguyên sổ cho thao tác cơ giới.

**Soát chéo (ba-review, scope all):** marker `WI-NN` trong tài liệu phải có dòng trong sổ; WI **Xong** không còn tài liệu/màn ⚠️ chưa đồng bộ → vi phạm gắn gap **🟢 Nhỏ**.

## Nhật ký thay đổi (`docs/00-changelog.md`) — sổ của `ba-changelog`
Ghi lại **tài liệu ĐÃ CHỐT vừa bị sửa**: sửa gì, tác động nghiệp vụ ra sao, chạm ID nào. Nguồn dữ liệu là hàng đợi `.claude/spec-changes.jsonl` do hook ghi tự động mỗi lần có file trong màn **✅ Hoàn thành** bị Edit/Write.

**Ranh giới với sổ CR/WI — đọc kỹ, đây là chỗ dễ biến thành nguồn sự thật thứ tư:**

| | `00-cr.md` | `00-backlog.md` | `00-changelog.md` |
|---|---|---|---|
| Bản chất | **quy trình phê duyệt** | **quy trình giao việc** | **nhật ký quan sát** |
| Thời điểm | **TRƯỚC** khi sửa (xin duyệt) | trước/trong khi làm | **SAU** khi đã sửa |
| Trả lời | *được phép đổi không?* | *ai làm, đến đâu rồi?* | *thực tế đã đổi gì?* |
| Quyền phán xét | có (Duyệt/Từ chối/Hoãn) | có (vòng đời) | **không** — chỉ ghi nhận + trỏ |

Changelog **không thay CR và không được dùng để né CR**. Ngược lại: một dòng changelog chạm tài liệu baseline mà **không có `CR` nào đang mở** chính là **cờ đỏ** — dòng đó phải gắn `⚠️ chưa có CR` và `ba-changelog` gợi ý mở CR. Sửa đã đi qua CR rồi → dòng changelog ghi `CR-NN` vào cột Truy vết và **không** cảnh báo (đó là đường đi đúng).

**Ba rule bắt buộc cho mỗi dòng nhật ký:**
1. **Tiếng Việt, viết theo TÁC ĐỘNG NGHIỆP VỤ** — *"siết quy tắc khoá tài khoản từ 5 lần còn 3 lần, người dùng dễ bị khoá hơn"*, KHÔNG phải *"sửa dòng 42 srs.md"*.
2. **Không chép diff** — không liệt kê dòng thêm/bớt, không dán code. Số dòng `+/-` chỉ để ước lượng độ lớn, để ở cột riêng.
3. **Bắt buộc gán ID truy vết** — mỗi dòng phải trỏ ít nhất một mã trong chuỗi `BR → StR → FR/NFR → F → S → R-S → UC/US → TC` (thường là `S..` + mã cụ thể bị chạm). Không suy được ID nào → ghi `⚠️ chưa map` và nêu ở báo cáo, KHÔNG bịa mã.

**Không xoá dòng** (như sổ CR) — nhật ký là lịch sử. Dòng ghi sai thì thêm dòng đính chính, không sửa lịch sử.

## Đối chiếu code ↔ tài liệu (`docs/Ho-so/00-conformance.md`) — báo cáo của `ba-conformance`
Mọi cơ chế soát khác của toolkit đều chạy **trong trục tài liệu** (`ba-review` thiếu artifact · `ba-trace` RTM · `ba-consistency-reviewer` mâu thuẫn · `ba-changelog` vừa đổi gì). Cột `dev` của `00-tracking.md` chỉ là **roll-up do `dev-run` tự khai** — nó nói "đã code", không nói "code đúng đặc tả". `ba-conformance` là bên duy nhất đi qua ranh giới sang code.

**Ba hướng lệch, đừng trộn lẫn:**

| Hướng | Nghĩa | Ai phát hiện |
|---|---|---|
| **Chưa làm** | đặc tả có, code không có | `scan-code.js` (cơ giới) + agent (file có mà nội dung rỗng/TODO) |
| **Lệch** | cả hai có, hành vi khác nhau | agent `ba-inference-reviewer` chế độ **`conformance`** |
| **Không có tài liệu** | code có **hành vi nghiệp vụ** mà đặc tả không mô tả | script (file lạc) + agent (quy tắc/nhánh giấu trong code) |

**Cầu nối doc↔code là `plan.md`** (do `ba-build` sinh): nó khai `Files:`, `Trace test:`, checkbox từng bước — đủ để đối chiếu cơ giới mà không cần chế thêm map.

**Plan không đủ dữ liệu ≠ code sai — KHÔNG được chặn gate vì lý do này.** Plan viết thiếu (task không khai `Trace test`, ô `Files:` viết văn xuôi), hoặc dự án dev không theo plan, thì `scan-code.js` mất cầu nối và mọi phát hiện của nó **mất căn cứ**. Khi đó: báo ở mục riêng **"Không đủ căn cứ đối chiếu"**, chấm **🟡** (sửa bằng cách chạy lại `ba-build`), **KHÔNG** chấm 🔴 và **KHÔNG** dừng `ba-accept` — dừng nghiệm thu vì plan viết sơ sài là dừng sai lý do. Chỉ chấm 🔴 khi có **bằng chứng code cụ thể** cho một lệch thật.

**Luật khi có lệch:**
- **Không tự phán "code sai hay tài liệu lỗi thời".** Code mới hơn tài liệu **không** có nghĩa code đúng. Nêu cả hai khả năng kèm bằng chứng; BA/PO chốt.
- Tài liệu đúng → sửa code (`ba-task` kiểu Bug / `dev-run`). Code đúng, tài liệu lỗi thời → **`ba-change-request`**; **cấm sửa lén tài liệu cho khớp code** — đó là hợp thức hoá thay đổi không ai duyệt.
- Mọi phát hiện phải **neo bằng chứng code cụ thể** (file + hàm). Không neo được → mục "Không đủ căn cứ", không đoán.
- **File code lạc ≠ dev lậu**: hạ tầng/helper/config/migration thường không nằm trong plan nào. Phải ghi mức chắc chắn.

**`00-conformance.md` là BÁO CÁO, không phải sổ** — ghi đè mỗi lần chạy (khác `00-cr.md`/`00-backlog.md`/`00-changelog.md` không xoá dòng). Chỉ **cột "Xử lý"** được giữ lại giữa các lần chạy, như cách `ba-track refresh` giữ cột `dev`.

## Sổ quyết định sản phẩm (PD) — `docs/00-decisions.md`
Sổ thứ tư. **Hai nguồn ghi vào nó**, cùng một bản chất: một quyết định nghiệp vụ mà **không artifact nào trả lời được** — phải có người chọn.

1. **`ba-proto-first` bước 5** — khách chốt khi bấm thử prototype, trước khi có đặc tả.
2. **`ba-reverse`** — câu hỏi mà **code không trả lời được**. Reverse rút được *hệ thống đang làm gì*, nhưng không bao giờ rút được *vì sao chọn thế* hay *có nên thế không*. Ghi `Treo` kèm câu hỏi và **ai nên quyết**.

**Vì sao `ba-reverse` phải ghi vào đây chứ không để trong mục "Open Questions" của từng tài liệu:** đo thật 04/09/2026 — một lượt reverse trên 846 dòng code sinh **15 câu hỏi nghiệp vụ** (vì sao 5 lần chứ không phải số khác · ai mở khoá tài khoản bị khoá vĩnh viễn · đổi mật khẩu có thu hồi phiên khác không…). Rải vào Open Questions của 6 tài liệu thì không ai gom lại được, và bước viết đặc tả tiếp theo cứ thế chạy qua. Gom vào một sổ thì chúng thành **một lần hỏi người, một danh sách** — và luật "mỗi `FR` phải trace ≥1 `PD`" biến chúng thành ràng buộc thật. Ghi những gì **khách đã chốt khi bấm thử prototype**, trước khi có bất kỳ `FR` nào.

**Vì sao cần một sổ riêng chứ không nhét vào biên bản họp:** `PD` là **đầu vào cưỡng bức** của bước viết đặc tả — mỗi `FR` phải trace ≥1 `PD`, `FR` không có `PD` nào đỡ là thứ chưa ai chốt. Nằm lẫn trong `meetings/` thì nó chỉ là ghi chép, không chặn được gì. Đây cũng đúng chỗ luồng gốc (BA-Kit Luồng C) bỏ trống: prototype không có cổng chốt thì spec vẫn viết bằng suy đoán.

- **Mã toàn cục** `PD-01` (không đếm theo màn — một quyết định có thể chạm nhiều màn).
- **Chủ sở hữu:** `ba-proto-first` và `ba-reverse` (cố ý **không** đẻ skill riêng như CR/WI — xem "Ba trục soát", ngân sách phức tạp đã căng; tách khi nào thật sự cần tra/sửa quyết định rời).
- **Không xoá dòng** — sổ là lịch sử vì sao sản phẩm ra hình dạng này.
- Vòng đời: `Chốt` · `Treo` (chưa quyết được, kèm câu hỏi mở) · `Đổi` (bị `PD` sau thay — ghi mã thay thế, **không sửa dòng cũ**).

**Cột bảng:**

`| ID | Quyết định | Màn/Luồng | Ai chốt | Ngày | Trạng thái | Trace |`

- **Quyết định**: viết bằng lời khách nói, không dịch sang ngôn ngữ yêu cầu (dịch là việc của `ba-requirements`).
- **Trace**: để trống lúc chốt; `ba-requirements` điền `FR..`/`BR..` sinh ra từ nó → đó là chỗ khoá "spec có gốc".
- Mọi màn trong bảng màn sơ bộ phải có **≥1 `PD` trạng thái `Chốt`** trước khi được viết đặc tả.

**Quan hệ với ba sổ kia:** `PD` = chốt **trước khi có baseline** · `CR` = đổi cái **đã** baseline · `WI` = việc mới/kỹ thuật · `changelog` = ghi nhận **sau khi** đã sửa. Sau khi `01-requirements.md` chốt, mọi thay đổi đi qua `CR`, **không** thêm `PD` mới — **trừ loại chặn go-live** dưới đây (nó không đổi baseline, nó là thứ baseline cần mà chỉ người cấp được).

**Loại chặn go-live — `[go-live]`.** Câu hỏi mở kiểu thứ ba: code **đã xong**, mọi Proof chạy được đều xanh, nhưng tính năng không bật được cho người dùng thật vì thiếu thứ **chỉ người cấp** — credential/API key production, tài khoản (merchant, SMS brandname, store), hạ tầng (domain, bucket, DB production), hay duyệt pháp lý/nội dung. Nó không chặn đặc tả, không chặn dev — nên trốn tới tận ngày go-live. Ghi vào sổ PD **không đổi hình sổ** (cùng 7 cột):
- **Trạng thái** `Treo` (nguyên chữ — `status.js`/`check-pd.js` vẫn đếm là việc chờ người); cấp xong → `Chốt` như mọi PD.
- Ô **Quyết định** mở đầu bằng nhãn **`[go-live]`**, rồi *thiếu gì · để làm gì* (vd `[go-live] API key VNPay production + merchant ID — thanh toán thật`).
- **Màn/Luồng**: mã màn bị chặn (`S07`); **Ai chốt**: người/vai **cấp** được (không để trống — `check-pd.js`); **Trace**: các `TC-..` không thể đạt khi chưa có thứ đó (thường TC tích hợp/E2E thật).

Máy đọc nhãn này ở hai chỗ: `ac-po/pick.js` **không** chặn dev màn vì PD `[go-live]` (vẫn liệt kê ở mục "phải hỏi"); `ac-verify/accept.js` — verify FAIL mà **mọi** dòng FAIL chỉ nhắc TC trong Trace của PD `[go-live]` Treo trỏ màn (hoặc nhắc thẳng mã PD đó), không còn `lỗi-code` nào ngoài tập đó → `trảLoại: go-live`: không phái builder, không tính vòng TRẢ (`mission.js done --loai go-live`), việc chuyển "chờ go-live" cho tới khi người cấp. Chỉ khai `[go-live]` khi đúng là thiếu thứ người cấp — gắn nhãn cho lỗi code là giấu lỗi khỏi builder.
