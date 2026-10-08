---
type: skill-explainer
group: orchestrator
updated: 2026-07-15
---

# Nhóm điều phối (orchestrator) — 11 skill chạy cả chuỗi trong một lệnh

> Skill nguyên tử (ở `01-pipeline-core.md`) làm **một việc**. Orchestrator **ghép nhiều việc** lại: gõ một lệnh, nó tự lần lượt gọi các skill nguyên tử theo đúng thứ tự, và chèn **"chốt chặn" (gate)** giữa các bước để dò lỗ hổng. Bạn đỡ phải nhớ gõ từng bước.

## "Gate" là gì? — điểm mấu chốt của cả nhóm

**Chốt đầu tiên nằm ở TRƯỚC bước 1: "Cổng phương án".** Mọi orchestrator phải đọc hết tài liệu nguồn, rồi **dừng lại trình cho bạn xem** — nó hiểu bài toán thế nào, định chạy những bước nào, **sẽ tạo file nào và ghi đè file nào**, đang giả định gì, còn thiếu thông tin gì — rồi **chờ bạn bấm duyệt** (Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy). Chưa duyệt thì **chưa ghi một file nào**.

Đây là chốt rẻ nhất: bắt AI hiểu sai lộ ra *trước khi* nó sinh cả trăm file, và cho bạn thấy trước đúng phạm vi sắp bị ghi đè. Việc nhỏ (≤1 skill con và ≤2 file) hoặc bạn nói sẵn "chạy thẳng" thì nó vẫn **in phương án ra** nhưng không bắt chờ.

Các chốt sau đó (`ba-review`) chạy **sau mỗi bước quan trọng** để dò gap và **phân mức**:

- Còn gap **🔴 (Chặn)** hoặc **🟡 (Quan trọng)** → **DỪNG**, báo bạn sửa rồi chạy lại chốt.
- Chỉ còn **🟢 (Nhỏ)** hoặc **sạch** → **ĐI TIẾP** (ghi nhận 🟢 để xử lý sau).

Nhờ gate, orchestrator không "cắm đầu chạy tới cuối" khi tài liệu đang thiếu — nó dừng đúng chỗ để bạn vá. Đây là khác biệt lớn so với việc tự gõ từng skill nguyên tử (không có ai chặn).

Một checkpoint nữa: khi skill phải **tự giả định** (do thiếu thông tin), orchestrator dừng lại cho bạn **xác nhận từng giả định** trước khi đi tiếp.

Tóm lại có **bốn** loại chốt, không thay nhau: **phương án** (trước khi ghi — duyệt cách hiểu & phạm vi) → **giả định** (sau khi doc có giả định) → **`ba-review`** (sau khi doc xong — dò gap/truy vết) → **chốt kiến trúc** (duyệt quyết định lớn trong doc đã xong).

---

## Orchestrator nào cho tình huống nào? — bảng chỉ đường

| Tình huống | Dùng | Điểm cốt lõi |
|---|---|---|
| Khởi động dự án đúng bài — **hiểu vấn đề & hiện trạng trước** | `ba-discover` | Giai đoạn discovery TRƯỚC `ba-init`: vision → bên liên quan → phỏng vấn → quy trình |
| Dự án **mới hoàn toàn**, chạy từ ý tưởng tới kế hoạch build | `ba-init` | Chạy TRỌN pipeline yêu cầu→build, gate ở mọi breakpoint |
| **Dev xong một phase**, cần nghiệm thu & phát hành | `ba-accept` | Giai đoạn 4 SAU `dev-run`: UAT → release → RTM → xuất bản → ký |
| Dự án đã có tài liệu, **thêm 1 màn hình** | `ba-add-screen` | Chỉ đụng phần liên quan màn mới |
| Còn **nhiều màn (≥3) chưa đặc tả**, muốn làm cùng lúc | `ba-batch` | Fan-out mỗi màn một subagent SONG SONG; main gom glossary/tracking/gate |
| Dự án đã có tài liệu, **thêm 1 chức năng** (có thể trải nhiều màn) | `ba-add-feature` | Cập nhật yêu cầu/chức năng rồi lan tới các màn liên quan |
| **Đổi** một chức năng/màn **đã có** | `ba-change-request` | Có sổ CR, phân tích ảnh hưởng, vòng đời duyệt |
| **Đã có code sẵn**, cần sinh tài liệu ngược | `ba-reverse` | Chiều ngược: từ code → tài liệu |

Ranh giới hay nhầm nhất — **thêm vs đổi**, và **thêm màn vs thêm chức năng**:

- **Thêm mới** (`ba-add-screen`, `ba-add-feature`) so với **đổi cái đã có** (`ba-change-request`): nếu thứ bạn động vào **đã tồn tại và đã có tài liệu/đã build**, dùng change-request (nó ghi sổ, phân tích ảnh hưởng theo truy vết). Nếu là **cái hoàn toàn mới**, dùng add-screen/add-feature.
- **`ba-add-screen` vs `ba-add-feature`**: thêm **một màn** (chức năng có thể đã có) → add-screen. Thêm **một chức năng** kéo theo nhiều màn (hoặc gắn vào màn đã có) → add-feature. Nói ngắn: add-screen bắt đầu từ "một màn mới"; add-feature bắt đầu từ "một chức năng mới".

---

## ba-discover — Giai đoạn Discovery (trước ba-init)

**Làm gì.** Trong một lệnh, chạy chuỗi **khám phá vấn đề**, **xen kẽ `ba-brainstorm` (phỏng vấn sâu)** để làm rõ trước mỗi bước phân tích: brainstorm-làm-rõ-vấn-đề → `ba-vision` → (gate) → `ba-stakeholder` → (gate) → *nếu số hóa* brainstorm-làm-rõ-quy-trình → `ba-process` (AS-IS→TO-BE→Gap) → brainstorm-đào-sâu-giải-pháp → (gate) → bàn giao. Nhờ continuation mode, các lần brainstorm nối chung vào `00-brainstorm.md`. Dừng ở tài liệu nền, để `ba-init` tiếp.

**Khi nào dùng.** Khởi động **dự án thực tế đúng cách BA làm** — hiểu vấn đề & hiện trạng **trước khi** viết yêu cầu. Đặc biệt hợp khi **số hóa quy trình đang chạy tay** (có `ba-process`).

**KHÔNG dùng khi.** Ý tưởng đã rõ chiến lược, không cần discovery → chạy thẳng `ba-init`. Hoặc chỉ thêm/đổi trên dự án đã có (dùng add-*/change-request).

**Đầu vào.** Ý tưởng/brief thô.
**Đầu ra.** `docs/Ho-so/00-vision.md` + `04-stakeholders.md` + `00-brainstorm.md` (+ `00-process.md` nếu số hóa) — đầu vào cho `ba-init`.
**Ví dụ.** `ba-discover "số hóa quy trình duyệt hoàn tiền đang làm qua email"` → vision → stakeholder → phỏng vấn → AS-IS/TO-BE swimlane → sẵn sàng `ba-init`.

---

## ba-init — Khởi tạo dự án mới, chạy trọn pipeline

**Làm gì.** Trong một lệnh, chạy toàn bộ dây chuyền: `ba-brainstorm → ba-requirements →` (gate) `→ ba-functions →` (gate) `→ ba-screens →` (gate) `→` với mỗi màn `ba-screen-spec → ba-test →` (gate màn) `→` (tùy chọn Figma: đẩy phương án wireframe đã chọn) `→ ba-html-design →` (tùy chọn Figma: đẩy bản html đã duyệt) `→ ba-build →` (gate cuối + `ba-review all`). Dừng ở kế hoạch build, không tự viết code.

**Khi nào dùng.** Bắt đầu một dự án/App **mới hoàn toàn** từ ý tưởng thô và muốn đi hết quy trình mà không phải gõ từng bước.

**KHÔNG dùng khi.** Dự án đã có tài liệu (dùng add-screen/add-feature/change-request), hoặc bạn muốn kiểm soát chặt từng bước (gõ skill nguyên tử lẻ).

**Đầu vào.** Ý tưởng thô. Bạn tham gia ở khâu hỏi đáp `ba-requirements` và ở mỗi gate còn gap.

**Đầu ra.** Toàn bộ: `00-brainstorm.md`, `01-requirements.md`, `02-functions.md`, `03-overview.md` + folder màn + `00-tracking.md`; mỗi màn có 6 file spec + test + html; `plan.md` mỗi folder.

**Ví dụ.** `ba-init "app đặt lịch học tiếng Anh"` → chạy hết, dừng lại mỗi khi gate phát hiện thiếu, cuối cùng có đủ tài liệu + plan. **Bước kế:** `dev-run` (code) → `ba-accept` (nghiệm thu).

---

## ba-accept — Nghiệm thu & phát hành (Giai đoạn 4, sau dev-run)

**Làm gì.** Trong một lệnh, chạy khâu **đóng vòng đời** cho một phase đã dev xong: `ba-uat` (soạn kịch bản nghiệm thu) → **chạy UAT** ghi Pass/Fail → (gate nghiệm thu: mọi `FR` Must phải Pass) → `ba-release <phase>` (đóng gói roadmap+UAT → HTML) → `ba-trace` (ma trận truy vết RTM) → `ba-track refresh` → (gate `ba-review all`) → `ba-portal`/tùy chọn `ba-doc-public` (xuất bản) → **bảng ký nghiệm thu**.

**Khi nào dùng.** `dev-run` đã dev xong các màn của một phase (`dev = ✅`) và cần nghiệm thu người dùng + phát hành chính thức. Đây là mắt cuối khép vòng đời: discover → init → dev → **accept**.

**KHÔNG dùng khi.** Chưa dev xong (còn `dev = ⬜/⚠️` — trừ khi cố ý nghiệm thu phần đã xong), hoặc chưa có `08-roadmap.md` chia phase (chạy `ba-roadmap` trước).

**Đầu vào.** Code + `test.md` đã cập nhật (từ `dev-run`); `08-roadmap.md` (chia phase); `09-uat.md` nếu đã có.

**Đầu ra.** `09-uat.md` (kết quả UAT) · `docs/Ho-so/releases/<phase>.md`+`.html` · `00-traceability.md` (RTM) · portal cập nhật · bảng ký nghiệm thu.

**Ví dụ.** `ba-accept phase-1` → soạn/chạy UAT-01..06 → mọi FR Must Pass → đóng gói `releases/phase-1.html` → RTM → xuất bản → bảng ký PO/BA/khách/QA.

---

## ba-add-screen — Thêm một màn hình vào dự án đã có

**Làm gì.** Chỉ đụng phần liên quan màn mới: (nếu màn sinh chức năng mới thì thêm `F..`) → cập nhật `03-overview.md` (thêm mã `S..`, map chức năng, cập nhật điều hướng, tạo folder, thêm dòng tracking) → gate → `ba-screen-spec → ba-test →` gate màn → (tùy chọn Figma: đẩy phương án wireframe đã chọn) `→ ba-html-design →` (tùy chọn Figma: đẩy bản html đã duyệt) `→ ba-build` (chỉ sinh plan cho màn chưa có) → `ba-track refresh` → gate cuối → (tùy chọn) cập nhật portal.

**Khi nào dùng.** Đang phát triển, cần **thêm một màn hình mới** vào hệ thống đã có tài liệu BA.

**KHÔNG dùng khi.** Dự án mới tinh (dùng `ba-init`), hay bạn thêm cả một chức năng trải nhiều màn (dùng `ba-add-feature`), hay đổi màn đã có (dùng `ba-change-request`).

**Đầu vào.** Dự án đã có tài liệu; cần biết tên màn + nhóm + các chức năng `F..` liên quan.

**Đầu ra.** `03-overview.md` + `00-tracking.md` cập nhật; folder màn mới + đủ tài liệu của riêng màn đó (spec, test, html, plan). Không dựng lại toàn bộ.

**Ví dụ.** `ba-add-screen "Cài đặt tài khoản"` → tạo `S07 - Settings`, đặc tả/test/html/plan cho riêng nó.

---

## ba-batch — Đặc tả nhiều màn song song

**Làm gì.** Chọn lô màn ⬜ (≥3) → **mỗi màn một subagent chạy song song** làm trọn chuỗi per-màn (screen-spec → test → html-design), mỗi agent chỉ được ghi trong folder màn của mình. Main agent lo phần dùng chung: đóng gói ngữ cảnh một lần cho mọi agent, gom thuật ngữ mới vào glossary, gom giả định để bạn xác nhận MỘT lượt, refresh tracking bằng script, và gate `ba-review` một lần cuối.

**Khi nào dùng.** Sau `ba-screens`, dự án còn nhiều màn chưa đặc tả và các màn **độc lập nhau**. 5 màn song song ≈ thời gian 1 màn.

**KHÔNG dùng khi.** Chỉ 1–2 màn (dùng `ba-add-screen`); màn phụ thuộc chéo (spec màn A cần màn B — tách chạy tuần tự); cần đẩy lên Figma (`ba-figma-draw` cần MCP và tương tác — chạy riêng từng màn sau khi lô xong).

**Đầu vào.** `02-functions.md` + `03-overview.md` + hàng tracking các màn. **Đầu ra.** Mỗi màn đủ bộ file phân tích + tracking/glossary cập nhật + báo cáo gap.

**Ví dụ.** 3 màn ⬜ (S03, S04, S05) → `ba-batch` fan-out 3 subagent → 30 phút sau: 3×8 file, 12 giả định chờ xác nhận một lượt, gate còn 2 gap 🟡 ở S05.

## ba-add-feature — Thêm một chức năng (có thể trải nhiều màn)

**Làm gì.** Cập nhật `01-requirements.md` (nếu phạm vi mới) + thêm `F..` vào `02-functions.md` + ma trận CRUD → gate → cập nhật `03-overview.md` (thêm màn mới và/hoặc gắn chức năng mới vào màn đã có) → gate → với **mỗi màn mới hoặc bị ảnh hưởng** chạy `ba-screen-spec → ba-test →` gate → (tùy chọn Figma: đẩy phương án wireframe đã chọn) `→ ba-html-design →` (tùy chọn Figma: đẩy bản html đã duyệt) `→ ba-build → ba-track refresh` → gate cuối.

**Khi nào dùng.** Cần thêm **một chức năng mới** mà nó kéo theo nhiều màn (hoặc phải gắn vào màn đã có).

**KHÔNG dùng khi.** Chỉ thêm đúng một màn (dùng `ba-add-screen`), hay đổi chức năng đã có (dùng `ba-change-request`).

**Đầu vào.** Dự án đã có; làm rõ chức năng làm gì, ảnh hưởng màn nào (mới/đã có).

**Đầu ra.** `01-requirements.md`/`02-functions.md` (+ CRUD) cập nhật; `03-overview.md` + `00-tracking.md` cập nhật; mỗi màn ảnh hưởng được cập nhật (màn đã có được sửa, không tạo trùng) + plan.

**Ví dụ.** Thêm chức năng "đánh giá giáo viên sau buổi học" → chạm màn BuoiHoc (đã có) + tạo màn Review mới.

---

## ba-change-request — Quản trị trọn vòng đời một thay đổi

**Làm gì.** Quản lý một **yêu cầu thay đổi (CR)** vào chức năng/màn **đã có**: cấp mã toàn cục `CR-NN` vào **sổ trung tâm `docs/00-cr.md`** → **phân tích ảnh hưởng** theo chuỗi truy vết `BR → StR → FR/NFR → F → S → R-S → UC/US → TC` → **cổng duyệt** (Duyệt / Từ chối / Hoãn) → nếu duyệt thì đồng bộ mọi tài liệu lệch (`ba-track sync` đánh ⚠️ → cập nhật srs/test/html/plan, có gate) → build lại phần đổi → `ba-track refresh` → **đóng CR** với trace commit. Sổ CR là **nguồn sự thật** về lịch sử thay đổi (không xóa dòng, kể cả CR bị từ chối/hoãn).

**Khi nào dùng.** Có yêu cầu **sửa đổi** một thứ đã tồn tại và đã có tài liệu — cần lần ra mọi chỗ bị ảnh hưởng và giữ vết quyết định. Cũng dùng `ba-change-request list` (xem CR theo trạng thái) và `status <mã>` (duyệt/từ chối/hoãn kèm lý do).

**KHÔNG dùng khi.** Thêm cái mới hoàn toàn (dùng add-screen/add-feature) — CR dành cho **đổi cái đã có**.

**Đầu vào.** Chức năng/màn đã có tài liệu; chốt rõ đổi cái gì, ở đâu, trước khi cấp mã.

**Đầu ra.** `docs/00-cr.md` (dòng bảng tổng + mục chi tiết `### CR-NN`, marker `*(CR-NN)*` trong tài liệu); các tài liệu liên quan được đồng bộ (srs↔usecase↔test↔html↔plan); code phần đổi + trace commit; CR chuyển sang trạng thái Đóng.

**Ví dụ.** `ba-change-request "S02 Dashboard — thêm bộ lọc theo tuần"` → CR-05, phân tích chạm F05 + màn S02, duyệt, cập nhật srs/test/html, build lại, đóng.

---

## ba-reverse — Sinh tài liệu BA từ code có sẵn

**Làm gì.** Chiều **ngược** của pipeline: từ một codebase, dựng bộ tài liệu trong `docs/`. Recon stack/framework → **quét song song** (nhiều subagent, mỗi cái một khía cạnh: màn hình, mô hình dữ liệu, API, chức năng) → tổng hợp thành tài liệu → `ba-review all` + `ba-track refresh`. Phần **rút trực tiếp từ code** = tin cậy cao; phần **ý định nghiệp vụ** (requirements, srs/usecase suy luận) mang banner **🔶 cần người xác nhận**.

**Khi nào dùng.** Đã có sản phẩm/code chạy được nhưng **thiếu tài liệu BA**, cần dựng ngược để bảo trì/bàn giao.

**KHÔNG dùng khi.** Dự án chưa có code (dùng `ba-init` chiều xuôi). Lưu ý các tài liệu 🔶 là **suy luận, phải rà lại**, không phải sự thật đã chốt.

**Đầu vào.** Codebase (cấu trúc thư mục + config); vòng "Xác nhận giả định" cho các map không chắc.

**Đầu ra.**
- Tin cậy cao (không banner): `05-data-model.md`, `06-api-spec.md`, `03-overview.md` + folder màn + `00-tracking.md`.
- Suy luận (banner 🔶): `02-functions.md`, `01-requirements.md`, và per màn `srs/usecase/userstory/test/ascii-screen`.
- Bỏ qua (ô ⬜): `html-design`, `brainstorm`, `design-spec`, `plan`.

**Ví dụ.** Trỏ vào một repo Next.js → sinh ERD + API spec (tin cậy cao) + requirements suy luận 🔶 để BA rà.

---

## ba-remove
**Cắt bớt phạm vi đã có** — bỏ một màn, gộp hai màn làm một, hoặc loại một chức năng khỏi dự án.

**Vì sao cần:** mọi skill khác của toolkit đi *xuôi* — thêm yêu cầu, thêm chức năng, thêm màn. Nhưng cắt phạm vi là việc BA làm thường xuyên: khách bỏ tính năng, hai màn hoá ra là một, một chức năng dời sang phase sau. Làm tay thì để lại đúng loại rác mà toolkit sinh ra để chống — sơ đồ điều hướng còn trỏ màn đã xoá, ma trận còn dòng ma, test case mồ côi, và không ai giải thích được vì sao thứ đó biến mất.

**Nó làm gì:**
1. **Soi ngược** — khác mọi skill khác, nó đi *ngược* chuỗi truy vết: *ai đang phụ thuộc vào thứ sắp bỏ?* Chức năng mồ côi, yêu cầu mồ côi, đường điều hướng trỏ vào hư không, màn khác nhắc tên màn này, kịch bản UAT, CR đang mở, và **code đã build**.
2. **Mở CR** — cắt phạm vi luôn là thay đổi baseline, nên luôn qua `ba-change-request`, không có "xoá nhanh".
3. **Dọn theo thứ tự** — sửa chỗ *trỏ tới* trước, bỏ thứ *được trỏ tới* sau. Mã `FR`/`F` không xoá hẳn mà đánh `Won't (CR-NN)`, vì mã đã bị trích dẫn ở nơi khác.
4. **Không `rm` folder** — chuyển sang `docs/Ho-so/removed/` kèm dòng ghi CR và ngày. Khách đổi ý là chuyện rất hay xảy ra.
5. **Chứng minh đã sạch** — chạy lại `ba-trace/scan.js` và so với lần quét đầu: mã bị bỏ phải biến mất khỏi đồ thị và **không phát sinh ref gãy mới**.

**Không làm:** không đụng code (gỡ code là `ba-task` kiểu `Tech` + `dev-run`), không xoá dòng trong ba sổ CR/WI/changelog.

**Gộp khác bỏ:** gộp phải *chuyển* yêu cầu/test sang màn đích và giữ bảng ánh xạ `mã cũ → mã mới` trong CR; bỏ thì mới được để chúng biến mất.

## ba-proto-first — Chốt nghiệp vụ bằng bản bấm thử, rồi mới viết tài liệu

**Làm gì.** Đảo ngược thứ tự quen thuộc. Thay vì viết yêu cầu → chức năng → màn hình → rồi mới dựng giao diện, skill này **dựng trước một bản giao diện bấm được**, đem cho khách click thử, **chốt từng điểm nghiệp vụ ngay tại chỗ** rồi mới viết tài liệu theo những gì đã chốt.

Lý do rất đời: khách hàng thường **không đọc nổi một bảng yêu cầu**, nhưng nhìn màn hình là có ý kiến ngay. Bấm vào nút "Duyệt" họ mới sực nhớ "à ở chỗ tôi phải hai cấp duyệt" — điều sẽ không bao giờ lộ ra khi đọc tài liệu.

**Khi nào dùng.** Nghiệp vụ còn mơ hồ · khách khó làm việc qua tài liệu · cần chốt phạm vi trước khi báo giá. Nghiệp vụ đã rõ và đã chốt rồi thì dùng `ba-init` (đi xuôi) cho nhanh.

**Điểm quan trọng nhất — đừng bỏ.** Bước 5 là **buổi demo có ghi sổ**: mọi điều khách chốt được ghi thành dòng có mã trong `docs/00-decisions.md`, và tài liệu viết sau đó **bắt buộc phải dẫn về** những dòng ấy. Bỏ bước này thì luồng biến thành "AI vẽ đại một giao diện rồi tự tin viết tài liệu theo hình mình vẽ" — tệ hơn cách làm xuôi.

**Khác skill gần kề.** `ba-init` đi xuôi từ yêu cầu; `ba-discover` tìm hiểu vấn đề bằng phỏng vấn chứ không dựng gì bấm được; `ba-prototype` dựng bản React cho **dev** dùng lại, chạy **sau** khi đã chốt.


## ba-auto — Từ phần mềm đang chạy ra bộ tài liệu và bản dựng lại, hỏi người đúng hai lần

**Làm gì.** Nhận một phần mềm đã có sẵn code, đọc ngược ra bộ tài liệu nghiệp vụ, rồi đi tiếp cả chặng đường xuôi — đặc tả từng màn, kế hoạch làm, viết code, tới lúc sẵn sàng nghiệm thu. Điểm khác biệt nằm ở chỗ **nó hỏi bạn khi nào**: mọi câu mà máy tự tra được (tài liệu đủ chưa, ca kiểm thử phủ hết chưa, test có kiểm đúng chỗ nó nói không) thì nó tự chốt và chạy tiếp; nó chỉ dừng lại hai lần — một lần xin duyệt phạm vi trước khi động vào file nào, một lần đưa bạn **một danh sách gộp** những câu mà code không bao giờ trả lời được: *vì sao ngưỡng là 5 lần chứ không phải 3*, *ai được mở khoá một tài khoản bị khoá vĩnh viễn*, *đổi mật khẩu thì các thiết bị khác có bị đăng xuất không*.

**Khi nào dùng.** Bạn tiếp quản một hệ thống không có tài liệu, hoặc muốn dựng lại một sản phẩm cũ cho tử tế và cần bộ hồ sơ đi kèm. Cũng dùng để kiểm tra một điều đáng giá: bộ tài liệu rút ra từ code có **quay ngược về code chạy được** hay không — chỗ nào không quay về được là chỗ tài liệu còn thiếu thật.

**Khác skill gần kề.** `ba-init` bắt đầu từ **ý tưởng** và chỉ lo giai đoạn viết yêu cầu; `ba-auto` bắt đầu từ **code** và đi hết vòng đời. `ba-reverse` chỉ làm khúc đọc ngược rồi dừng. `ba-proto-first` cũng chốt nghiệp vụ trước khi đặc tả, nhưng chốt bằng bản demo bấm được, còn ở đây chốt bằng danh sách câu hỏi rút thẳng từ code đang chạy.

## Xem thêm

- `01-pipeline-core.md` — các skill nguyên tử mà orchestrator gọi bên trong.
- `04-tien-ich.md` — `ba-review` (chạy ở các gate), `ba-track`, `ba-portal` (bước tùy chọn cuối các orchestrator).
- `README.md` — index + bảng chọn theo tình huống.
