---
type: skill-explainer
group: orchestrator
updated: 2026-07-15
---

# Nhóm điều phối (orchestrator) — 10 skill chạy cả chuỗi trong một lệnh

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
| Dự án đã có tài liệu, **thêm 1 chức năng** (có thể trải nhiều màn) | `ba-add-screen feature` | Cập nhật yêu cầu/chức năng rồi lan tới các màn liên quan |
| **Đổi** một chức năng/màn **đã có** | `ba-change-request` | Có sổ CR, phân tích ảnh hưởng, vòng đời duyệt |
| **Đã có code sẵn**, cần sinh tài liệu ngược | `ba-reverse` | Chiều ngược: từ code → tài liệu |

Ranh giới hay nhầm nhất — **thêm vs đổi**, và **thêm màn vs thêm chức năng**:

- **Thêm mới** (`ba-add-screen`, kể cả chế độ `feature`) so với **đổi cái đã có** (`ba-change-request`): nếu thứ bạn động vào **đã tồn tại và đã có tài liệu/đã build**, dùng change-request (nó ghi sổ, phân tích ảnh hưởng theo truy vết). Nếu là **cái hoàn toàn mới**, dùng `ba-add-screen` (hoặc chế độ `feature`).
- **`ba-add-screen` mặc định vs chế độ `feature`**: thêm **một màn** (chức năng có thể đã có) → `ba-add-screen`. Thêm **một chức năng** kéo theo nhiều màn (hoặc gắn vào màn đã có) → `ba-add-screen feature`. Nói ngắn: mặc định bắt đầu từ "một màn mới"; `feature` bắt đầu từ "một chức năng mới".

---

## ba-discover — Giai đoạn Discovery (trước ba-init)

**Làm gì.** Trong một lệnh, chạy chuỗi **khám phá vấn đề**, **xen kẽ `ba-discover brainstorm` (phỏng vấn sâu)** để làm rõ trước mỗi bước phân tích: brainstorm-làm-rõ-vấn-đề → `ba-discover vision` → (gate) → `ba-discover stakeholder` → (gate) → *nếu số hóa* brainstorm-làm-rõ-quy-trình → `ba-discover process` (AS-IS→TO-BE→Gap) → brainstorm-đào-sâu-giải-pháp → (persona nếu nhiều loại người dùng) → `ba-discover urd` → (gate) → bàn giao. Nhờ continuation mode, các lần brainstorm nối chung vào `00-brainstorm.md`. Dừng ở tài liệu nền, để `ba-init` tiếp.

**Khi nào dùng.** Khởi động **dự án thực tế đúng cách BA làm** — hiểu vấn đề & hiện trạng **trước khi** viết yêu cầu. Đặc biệt hợp khi **số hóa quy trình đang chạy tay** (có `ba-discover process`).

**KHÔNG dùng khi.** Ý tưởng đã rõ chiến lược, không cần discovery → chạy thẳng `ba-init`. Hoặc chỉ thêm/đổi trên dự án đã có (dùng add-*/change-request).

**Đầu vào.** Ý tưởng/brief thô.
**Đầu ra.** `docs/Ho-so/00-vision.md` + `04-stakeholders.md` + `00-brainstorm.md` (+ `00-personas.md`, `00-urd.md`, `00-process.md` nếu số hóa) — đầu vào cho `ba-init`.
**Ví dụ.** `ba-discover "số hóa quy trình duyệt hoàn tiền đang làm qua email"` → vision → stakeholder → phỏng vấn → AS-IS/TO-BE swimlane → sẵn sàng `ba-init`.

**Chế độ.** Mỗi bước gọi lẻ được bằng `ba-discover <chế-độ>`: `vision` · `stakeholder` · `persona` · `process` · `urd` (thuộc chuỗi mặc định) và `brainstorm` (động cơ phỏng vấn, gọi lẻ bất kỳ lúc nào) · `meet` (biên bản họp, bất kỳ lúc nào) · `roadmap` (sau `ba-functions`) — ba chế độ sau **không** thuộc chuỗi mặc định.

### Chế độ `brainstorm` — Phỏng vấn sâu để làm rõ ý tưởng (trước là `ba-brainstorm`)

**Làm gì.** Đóng vai một IT-BA giàu kinh nghiệm, phỏng vấn bạn theo bảy phần (tổng quan, người dùng & quyền, luồng chính, đào sâu chỗ phức tạp, validation & câu chữ, ngữ cảnh hệ thống, edge case & rủi ro) — hỏi **từng câu một**, hỏi về **nghiệp vụ** chứ không hỏi về kỹ thuật. Khi gặp chỗ phức tạp (OAuth, thanh toán, xử lý bất đồng bộ, nhiều vai trò, nhiều trạng thái) nó tự bật chế độ đào sâu, ép bạn chốt giá trị chính xác (con số, câu chữ hiển thị).

**Khi nào dùng.** Ý tưởng hoặc một tính năng còn mơ hồ, nhiều chỗ chưa rõ, và bạn muốn làm rõ **trước khi** viết yêu cầu. Đặc biệt hợp với tính năng phức tạp.

**KHÔNG dùng khi.** Ý tưởng đã rõ ràng, đã có tài liệu đầu vào tốt — cứ đi thẳng `ba-requirements`. Đây là bước tùy chọn (dù được khuyến nghị).

**Đầu vào.** Ý tưởng/tính năng thô bạn mô tả bằng lời.

**Đầu ra.** `docs/Ho-so/00-brainstorm.md` — biên bản phỏng vấn có cấu trúc, kèm mục "Câu hỏi mở" và danh sách "Giả định" (`GĐ-01`, `GĐ-02`…) mà bạn phải rà xác nhận trước khi đi tiếp.

**Ví dụ.** "Tôi muốn làm app đặt lịch học tiếng Anh" → nó phỏng vấn 7 phần, đào sâu luồng đặt lịch và hủy lịch, rồi ghi `00-brainstorm.md`.

### Chế độ `vision` — Vision & Scope / Business Case (trước là `ba-vision`)

**Làm gì.** Làm rõ **chiến lược trước khi viết yêu cầu**: vấn đề/cơ hội, mục tiêu kinh doanh SMART (`BO-..`), các phương án + đề xuất (cost-benefit/ROI), phạm vi in/out (MoSCoW), chỉ số thành công (KPI gắn mục tiêu), ràng buộc & rủi ro.

**Khi nào dùng.** Ngay đầu dự án — trước `ba-requirements`. Trả lời "vì sao làm & đáng làm không". `ba-requirements` lấy Business Need từ đây.

**KHÔNG dùng khi.** Chỉ thêm một tính năng nhỏ vào sản phẩm đã rõ chiến lược (dùng thẳng `ba-add-screen feature`).

**Đầu vào.** Ý tưởng/brief; `00-brainstorm.md`/`04-stakeholders.md` nếu có.
**Đầu ra.** `docs/Ho-so/00-vision.md`.
**Ví dụ.** `ba-discover vision` cho ý tưởng "app quản lý công việc nhóm" → mục tiêu "giảm 50% họp cập nhật", 3 option, scope giai đoạn 1.

### Chế độ `stakeholder` — Phân tích các bên liên quan (trước là `ba-stakeholder`)

**Làm gì.** Lập bản phân tích các bên liên quan của dự án: **danh bạ stakeholder** (kể cả nhóm gián tiếp, dùng Onion Diagram), **ma trận Quyền lực × Quan tâm** (4 ô), đánh giá **mức tham gia hiện tại vs mong muốn** kèm hành động thu hẹp khoảng cách, và **bảng RACI** (ai Chịu trách nhiệm/Phê duyệt/Tư vấn/Được báo — đúng một người A cho mỗi quyết định).

**Khi nào dùng.** Khởi động dự án (kickoff) — muốn nắm ai là ai và lập kế hoạch giao tiếp **trước khi** đào sâu yêu cầu.

**KHÔNG dùng khi.** Bạn cần yêu cầu chức năng hay màn hình — đây là tài liệu quản trị/giao tiếp, không mô tả sản phẩm.

**Đầu vào.** `docs/01-requirements.md` (mục Stakeholder Requirements) và `docs/Ho-so/00-brainstorm.md` nếu có; chạy được cả khi chưa có (sẽ hỏi thêm).

**Đầu ra.** `docs/Ho-so/04-stakeholders.md`.

**Ví dụ.** Dự án nội bộ công ty → liệt kê Ban giám đốc, Trưởng phòng vận hành, Nhân viên nhập liệu, Bộ phận IT… + xếp Quyền lực/Quan tâm + RACI cho quyết định "chốt phạm vi".

### Chế độ `persona` — Chân dung người dùng & Hành trình (trước là `ba-persona`)

**Làm gì.** Trả lời "làm cho AI, họ đi qua những bước nào" trước khi viết yêu cầu. Dựng `docs/Ho-so/00-personas.md`: các **persona** (chân dung đại diện mỗi nhóm người dùng — mục tiêu, nỗi đau, độ rành công nghệ, bối cảnh dùng) + **bản đồ hành trình** (các bước + cảm xúc lên/xuống khi họ đạt mục tiêu). Mỗi nỗi đau/cơ hội được nối thành một **ứng viên `U-..`** cho `ba-discover urd`/`ba-requirements` — đó là giá trị chính: biến hiểu-biết-người-dùng thành nhu cầu rồi thành yêu cầu.

**Khi nào dùng.** Giai đoạn discovery, chạy sớm (trước/song song requirements), nhất là khi cần thiết kế xoay quanh trải nghiệm người dùng. Khác `ba-discover stakeholder` (ai *có quyền lợi/quyền lực* với dự án) — đây là *người thật sự DÙNG app*. Khác `ba-discover urd` (*họ cần gì*) — đây là *họ là ai*.

### Chế độ `process` — AS-IS / TO-BE + Gap analysis (trước là `ba-process`)

**Làm gì.** Mô hình hóa **quy trình hiện tại (AS-IS)** → **quy trình tương lai có hệ thống (TO-BE)** bằng swimlane, rồi **Gap analysis** (khác biệt từng bước, loại thay đổi bỏ/gộp/tự động hóa/thêm — ESIA) → rút **yêu cầu phát sinh** trace ra `FR`/`BR`/`TR`.

**Khi nào dùng.** **Rất khuyến nghị khi số hóa quy trình đang chạy tay** (hoặc thay hệ thống cũ). Chạy sớm, sau stakeholder/brainstorm, trước/song song `ba-requirements`.

**KHÔNG dùng khi.** Sản phẩm hoàn toàn mới không có quy trình AS-IS (bỏ AS-IS, chỉ cần TO-BE trong requirements là đủ).

**Đầu vào.** `00-brainstorm.md`/`04-stakeholders.md`; mô tả quy trình hiện tại.
**Đầu ra.** `docs/Ho-so/00-process.md` (2 swimlane có màu + bảng gap + yêu cầu phát sinh).
**Ví dụ.** Duyệt hoàn tiền đang làm qua email/Excel → AS-IS swimlane, TO-BE swimlane có hệ thống → gap "tự động hóa bước tính toán" → FR mới.

### Chế độ `urd` — Tài liệu Yêu cầu Người dùng (URD) (trước là `ba-urd`)

**Làm gì.** Chốt **người dùng CẦN GÌ** trước khi ai đó quyết định hệ thống làm thế nào. Dựng `docs/Ho-so/00-urd.md` (cả dự án) hoặc `docs/urd/<feature>.md` (một mảng) gồm 10 mục: mục đích + vấn đề hiện tại · nhóm người dùng · **ranh giới phạm vi (trong/ngoài)** · **nhu cầu `UN-..`** (ai · bối cảnh · cần gì · kết quả mong đợi · mức quan trọng · **bằng chứng lấy từ đâu**) · hành trình ưu tiên (mỗi hành trình kèm câu *kiểm chứng độc lập*) · ngoại lệ & tình huống biên · ràng buộc phía người dùng · giả định + cách kiểm chứng · **tiêu chí thành công `USC-..`** (đo kết quả người dùng đạt được, không đo "đã build xong") · câu hỏi mở.

**Luật vàng.** Tài liệu **solution-free** — không tên màn, không nút, không API, không bảng dữ liệu. Cách tự soi: *đổi hoàn toàn cách hiện thực thì câu này còn đúng không?* Còn đúng là nhu cầu, sai là giải pháp (đã lạc sang `ba-requirements`). `ba-review urd` bắt lỗi này ở mức 🔴.

**Khi nào dùng.** Cuối giai đoạn discovery, ngay trước `ba-requirements` — nơi gom mọi thứ vừa đào được (brainstorm, personas, vision, quy trình) thành một danh sách nhu cầu có bằng chứng. Dự án đã chạy mà thêm mảng mới → `/ba-discover urd <tên-feature>`; nhu cầu chưa được `FR` hiện có phủ sẽ thành đề xuất mở `CR`/`WI`, không sửa thẳng yêu cầu.

**Đầu vào.** `00-brainstorm.md` (nguồn bằng chứng chính) + `00-personas.md` + `00-vision.md` + `00-process.md` (cái nào có). Không có nguồn nào → phỏng vấn (`ba-discover brainstorm`) trước, đừng viết URD từ suy đoán. **Đầu ra.** `docs/Ho-so/00-urd.md` / `docs/urd/<feature>.md` → `ba-requirements` biến mỗi `UN` thành ≥1 `FR`/`StR`/`NFR`.

### Chế độ `meet` — Biên bản họp (Minutes of Meeting) (trước là `ba-meet`)

**Làm gì.** Ghi chú họp thô / transcript → một biên bản chỉn chu `docs/Ho-so/meetings/<ngày>-<chủ-đề>.md`: ai họp, bàn gì, tách rõ **QUYẾT ĐỊNH** (`DEC`) khỏi **VIỆC CẦN LÀM** (`ACT` — mỗi việc một người phụ trách + một hạn), câu hỏi còn mở. Việc/quyết định nào là **thay đổi** tài liệu/chức năng đã chốt → skill mở luôn một **CR** trong sổ `00-cr.md`, nối cuộc họp vào pipeline thay vì để trôi.

**Khi nào dùng.** Sau mỗi cuộc họp có quyết định/giao việc. Mang các `ACT` còn mở từ biên bản trước sang để theo dõi liên tục.

### Chế độ `roadmap` — Ưu tiên & Lộ trình phát hành (trước là `ba-roadmap`)

**Làm gì.** Xếp **ưu tiên** các chức năng (**MoSCoW + RICE + Kano**) rồi chia thành **release Now/Next/Later** kèm **sơ đồ phụ thuộc**. Cho PO/PM quyết làm cái nào trước.

**Khi nào dùng.** Sau `ba-functions` (cần danh sách `F..`), khi có nhiều chức năng/feature và cần lập kế hoạch phát hành theo giai đoạn.

**KHÔNG dùng khi.** Dự án nhỏ làm một lần, không chia release.

**Đầu vào.** `02-functions.md` (các `F..`), `01-requirements.md` (MoSCoW), `00-vision.md` nếu có.
**Đầu ra.** `docs/Ho-so/08-roadmap.md` (bảng ưu tiên RICE + lộ trình + sơ đồ phụ thuộc). Tài liệu **sống** — cập nhật khi ưu tiên đổi.
**Ví dụ.** 13 chức năng → RICE xếp hạng → Now: đăng nhập + dashboard; Next: giao việc + thông báo; Later: báo cáo.

---

## ba-init — Khởi tạo dự án mới, chạy trọn pipeline

**Làm gì.** Trong một lệnh, chạy toàn bộ dây chuyền: `ba-discover brainstorm → ba-requirements →` (gate) `→ ba-functions →` (gate) `→ ba-screens →` (gate) `→` với mỗi màn `ba-screen-spec → ba-test →` (gate màn) `→` (tùy chọn Figma: đẩy phương án wireframe đã chọn) `→ ba-html-design →` (tùy chọn Figma: đẩy bản html đã duyệt) `→ ba-build →` (gate cuối + `ba-review all`). Dừng ở kế hoạch build, không tự viết code.

**Khi nào dùng.** Bắt đầu một dự án/App **mới hoàn toàn** từ ý tưởng thô và muốn đi hết quy trình mà không phải gõ từng bước.

**KHÔNG dùng khi.** Dự án đã có tài liệu (dùng `ba-add-screen` [`feature`]/`ba-change-request`), hoặc bạn muốn kiểm soát chặt từng bước (gõ skill nguyên tử lẻ).

**Đầu vào.** Ý tưởng thô. Bạn tham gia ở khâu hỏi đáp `ba-requirements` và ở mỗi gate còn gap.

**Đầu ra.** Toàn bộ: `00-brainstorm.md`, `01-requirements.md`, `02-functions.md`, `03-overview.md` + folder màn + `00-tracking.md`; mỗi màn có 6 file spec + test + html; `plan.md` mỗi folder.

**Ví dụ.** `ba-init "app đặt lịch học tiếng Anh"` → chạy hết, dừng lại mỗi khi gate phát hiện thiếu, cuối cùng có đủ tài liệu + plan. **Bước kế:** `dev-run` (code) → `ba-accept` (nghiệm thu).

---

## ba-accept — Nghiệm thu & phát hành (Giai đoạn 4, sau dev-run)

**Làm gì.** Trong một lệnh, chạy khâu **đóng vòng đời** cho một phase đã dev xong: chế độ `uat` (soạn kịch bản nghiệm thu) → **chạy UAT** ghi Pass/Fail → (gate nghiệm thu: mọi `FR` Must phải Pass) → chế độ `release <phase>` (đóng gói roadmap+UAT → HTML) → `ba-trace` (ma trận truy vết RTM) → `ba-track refresh` → (gate `ba-review all`) → `ba-portal`/tùy chọn `ba-doc-public` (xuất bản) → **bảng ký nghiệm thu**.

**Khi nào dùng.** `dev-run` đã dev xong các màn của một phase (`dev = ✅`) và cần nghiệm thu người dùng + phát hành chính thức. Đây là mắt cuối khép vòng đời: discover → init → dev → **accept**.

**KHÔNG dùng khi.** Chưa dev xong (còn `dev = ⬜/⚠️` — trừ khi cố ý nghiệm thu phần đã xong), hoặc chưa có `08-roadmap.md` chia phase (chạy `ba-discover roadmap` trước).

**Đầu vào.** Code + `test.md` đã cập nhật (từ `dev-run`); `08-roadmap.md` (chia phase); `09-uat.md` nếu đã có.

**Đầu ra.** `09-uat.md` (kết quả UAT) · `docs/Ho-so/releases/<phase>.md`+`.html` · `00-traceability.md` (RTM) · portal cập nhật · bảng ký nghiệm thu.

**Ví dụ.** `ba-accept phase-1` → soạn/chạy UAT-01..06 → mọi FR Must Pass → đóng gói `releases/phase-1.html` → RTM → xuất bản → bảng ký PO/BA/khách/QA.

**Phạm vi `docs`.** Dự án chỉ làm tài liệu (không dev) → chuỗi trọn **tự từ chối** (không có code để nghiệm thu); ba chế độ dưới vẫn chạy lẻ được — chúng là phần bàn giao tài liệu.

### Chế độ `uat` — Kế hoạch nghiệm thu (UAT) cấp dự án (trước là `ba-uat`)

**Làm gì.** Gom acceptance criteria xuyên các user story thành **kịch bản UAT end-to-end** (theo luồng nghiệp vụ, người dùng chạy) + **ma trận truy vết** requirement→UAT + **checklist ký nghiệm thu** (tiêu chí ra mắt + vai trò ký).

**Khi nào dùng.** Trước nghiệm thu/ra mắt, khi cần bằng chứng "đủ điều kiện ký". **Khác `ba-test`** (ca test kỹ thuật per màn) — đây là nghiệm thu **nghiệp vụ, xuyên màn, do người dùng/PO**. Thường không gọi lẻ: chuỗi nghiệm thu trọn **`ba-accept`** (Giai đoạn 4, sau `dev-run`) tự chạy chế độ `uat` → chạy UAT → chế độ `release` → `ba-trace` → xuất bản → ký. Phạm vi `docs` (không dev) gọi lẻ `ba-accept uat` làm tài liệu bàn giao.

**KHÔNG dùng khi.** Chỉ cần test kỹ thuật một màn (dùng `ba-test`).

**Đầu vào.** `01-requirements.md` (FR/BR), `userstory.md`/`usecase.md`/`test.md` các màn.
**Đầu ra.** `docs/Ho-so/09-uat.md` (kịch bản UAT + RTM + checklist ký).
**Ví dụ.** Kịch bản "Team Lead giao việc → Member nhận thông báo → cập nhật xong → Team Lead duyệt" xuyên 3 màn, trace về FR-04/05/06/09.

### Chế độ `release <phase>` — Gói phát hành theo phase, roadmap + nghiệm thu → HTML (trước là `ba-release`)

**Làm gì.** Ghép **kế hoạch của một phase** (từ `ba-discover roadmap`: mục tiêu, chức năng, Gantt, phụ thuộc, rủi ro) + **tiêu chí nghiệm thu của phase đó** (từ chế độ `uat`: kịch bản UAT + checklist ký) thành **một tài liệu gói phát hành**, rồi render ra **HTML tự chứa** (qua `ba-portal --single`) và tùy chọn đẩy online (qua `ba-doc-public`).

**Khi nào dùng.** Cần một trang/URL gọn cho **một phase** để stakeholder duyệt: *phase này làm gì, khi nào, điều kiện coi là xong & ký*. Hỗ trợ `ba-accept release phase-1` (một phase), `full` (mọi phase một file), `--all` (mỗi phase một file/URL).

**KHÔNG dùng khi.** Chưa có `08-roadmap.md` (chạy `ba-discover roadmap` trước). Đây là chế độ **ghép**, không sinh ưu tiên/nghiệm thu mới.

**Đầu vào.** `08-roadmap.md` (bắt buộc) + `09-uat.md` (nên có).
**Đầu ra.** `docs/Ho-so/releases/<phase>.md` + `.html` (render lẻ, không vào portal). Tùy chọn URL qua `ba-doc-public` (vd `.../roadmap-phase-1`).
**Ví dụ.** `ba-accept release phase-1` → gói Phase 1 (chức năng Must + Gantt + UAT của Phase 1) → `phase-1.html` → `ba-doc-public --slug roadmap-phase-1`.

### Chế độ `userguide` — Cẩm nang sử dụng / vận hành (trước là `ba-userguide`)

**Làm gì.** Đọc ngược tài liệu BA đã có (requirements, srs/usecase/test từng màn, glossary) rồi viết **cẩm nang dạy CÁCH DÙNG phần mềm** cho admin/CSKH/người dùng cuối — tổ chức theo 6 trụ (Tổng quan · Bắt đầu nhanh · Hướng dẫn theo tác vụ · Tra cứu · Xử lý sự cố · FAQ/Thuật ngữ). Chạy 2 giai đoạn: dựng **mục lục** (có agent `ba-manual-reviewer` soát cấu trúc) → **DỪNG chờ bạn duyệt** → mới viết từng trang + **ảnh chụp từ APP THẬT** có đánh số callout (engine tự đăng nhập, chụp, che thông tin nhạy cảm — bạn cấp URL/tài khoản; không muốn cấp quyền thì tự chụp theo brief có sẵn). App chưa deploy → tạm dùng ảnh mockup nhưng luôn ghi chú "(mockup)" và có danh sách thay sau. Ra **1 file HTML double-click là mở**.

**Khi nào dùng.** Sau khi build/nghiệm thu xong (GĐ4 — chuỗi `ba-accept` sẽ hỏi), hoặc bất cứ lúc nào cần tài liệu bàn giao cho người vận hành. Tài liệu nguồn đổi → gọi lại, nó tự vào chế độ cập nhật.

**KHÔNG dùng khi.** Cần trang đọc *tài liệu BA* cho team (đó là `ba-portal`); cần gói *kế hoạch + nghiệm thu* cho stakeholder (đó là `ba-accept release`). Cẩm nang là cho người DÙNG phần mềm, không phải người làm dự án.

**Đầu vào.** `02-functions.md` + `00-tracking.md` + các màn đã ✅ (srs/usecase/test/html-design) + `00-glossary.md`. **Đầu ra.** `docs/Ho-so/userguide/<tên>.html` + bundle (pages/ảnh/index) — không vào portal, chia sẻ online bằng `ba-doc-public`.

**Ví dụ.** `/ba-accept userguide` → mục lục 12 trang (2 tổng quan, 1 bắt đầu nhanh, 6 how-to theo UC, 1 tra cứu, 1 xử lý sự cố từ TC Negative, 1 FAQ+thuật ngữ) → duyệt → 12 trang + 8 ảnh callout → `docs/Ho-so/userguide/userguide.html`.

---

## ba-add-screen — Thêm một màn hình (hoặc, chế độ `feature`, một chức năng) vào dự án đã có

**Làm gì.** Chỉ đụng phần liên quan màn mới: (nếu màn sinh chức năng mới thì thêm `F..`) → cập nhật `03-overview.md` (thêm mã `S..`, map chức năng, cập nhật điều hướng, tạo folder, thêm dòng tracking) → gate → `ba-screen-spec → ba-test →` gate màn → (tùy chọn Figma: đẩy phương án wireframe đã chọn) `→ ba-html-design →` (tùy chọn Figma: đẩy bản html đã duyệt) `→ ba-build` (chỉ sinh plan cho màn chưa có) → `ba-track refresh` → gate cuối → (tùy chọn) cập nhật portal.

**Khi nào dùng.** Đang phát triển, cần **thêm một màn hình mới** vào hệ thống đã có tài liệu BA.

**KHÔNG dùng khi.** Dự án mới tinh (dùng `ba-init`), hay bạn thêm cả một chức năng trải nhiều màn (dùng chế độ `feature` bên dưới), hay đổi màn đã có (dùng `ba-change-request`).

**Đầu vào.** Dự án đã có tài liệu; cần biết tên màn + nhóm + các chức năng `F..` liên quan.

**Đầu ra.** `03-overview.md` + `00-tracking.md` cập nhật; folder màn mới + đủ tài liệu của riêng màn đó (spec, test, html, plan). Không dựng lại toàn bộ.

**Ví dụ.** `ba-add-screen "Cài đặt tài khoản"` → tạo `S07 - Settings`, đặc tả/test/html/plan cho riêng nó.

### Chế độ `feature` — Thêm một chức năng (có thể trải nhiều màn) (trước là `ba-add-feature`)

**Làm gì.** Cập nhật `01-requirements.md` (nếu phạm vi mới) + thêm `F..` vào `02-functions.md` + ma trận CRUD → gate → cập nhật `03-overview.md` (thêm màn mới và/hoặc gắn chức năng mới vào màn đã có) → gate → với **mỗi màn mới hoặc bị ảnh hưởng** (≥2 màn thì đặc tả qua `ba-batch`) chạy `ba-screen-spec → ba-test →` gate → (tùy chọn Figma: đẩy phương án wireframe đã chọn) `→ ba-html-design →` (tùy chọn Figma: đẩy bản html đã duyệt) `→ ba-build → ba-track refresh` → gate cuối.

**Khi nào dùng.** Cần thêm **một chức năng mới** mà nó kéo theo nhiều màn (hoặc phải gắn vào màn đã có).

**KHÔNG dùng khi.** Chỉ thêm đúng một màn (dùng `ba-add-screen` mặc định), hay đổi chức năng đã có (dùng `ba-change-request`).

**Đầu vào.** Dự án đã có; làm rõ chức năng làm gì, ảnh hưởng màn nào (mới/đã có).

**Đầu ra.** `01-requirements.md`/`02-functions.md` (+ CRUD) cập nhật; `03-overview.md` + `00-tracking.md` cập nhật; mỗi màn ảnh hưởng được cập nhật (màn đã có được sửa, không tạo trùng) + plan.

**Ví dụ.** Thêm chức năng "đánh giá giáo viên sau buổi học" → chạm màn BuoiHoc (đã có) + tạo màn Review mới.

**Ví dụ gọi.** `ba-add-screen feature "Đánh giá giáo viên"`.

---

## ba-batch — Đặc tả nhiều màn song song

**Làm gì.** Chọn lô màn ⬜ (≥3) → **mỗi màn một subagent chạy song song** làm trọn chuỗi per-màn (screen-spec → test → html-design), mỗi agent chỉ được ghi trong folder màn của mình. Main agent lo phần dùng chung: đóng gói ngữ cảnh một lần cho mọi agent, gom thuật ngữ mới vào glossary, gom giả định để bạn xác nhận MỘT lượt, refresh tracking bằng script, và gate `ba-review` một lần cuối.

**Khi nào dùng.** Sau `ba-screens`, dự án còn nhiều màn chưa đặc tả và các màn **độc lập nhau**. 5 màn song song ≈ thời gian 1 màn.

**KHÔNG dùng khi.** Chỉ 1–2 màn (dùng `ba-add-screen`); màn phụ thuộc chéo (spec màn A cần màn B — tách chạy tuần tự); cần đẩy lên Figma (`ba-figma-draw` cần MCP và tương tác — chạy riêng từng màn sau khi lô xong).

**Đầu vào.** `02-functions.md` + `03-overview.md` + hàng tracking các màn. **Đầu ra.** Mỗi màn đủ bộ file phân tích + tracking/glossary cập nhật + báo cáo gap.

**Ví dụ.** 3 màn ⬜ (S03, S04, S05) → `ba-batch` fan-out 3 subagent → 30 phút sau: 3×8 file, 12 giả định chờ xác nhận một lượt, gate còn 2 gap 🟡 ở S05.

---

## ba-change-request — Quản trị trọn vòng đời một thay đổi

**Làm gì.** Quản lý một **yêu cầu thay đổi (CR)** vào chức năng/màn **đã có**: cấp mã toàn cục `CR-NN` vào **sổ trung tâm `docs/00-cr.md`** → **phân tích ảnh hưởng** theo chuỗi truy vết `BR → StR → FR/NFR → F → S → R-S → UC/US → TC` → **cổng duyệt** (Duyệt / Từ chối / Hoãn) → nếu duyệt thì đồng bộ mọi tài liệu lệch (`ba-track sync` đánh ⚠️ → cập nhật srs/test/html/plan, có gate) → build lại phần đổi → `ba-track refresh` → **đóng CR** với trace commit. Sổ CR là **nguồn sự thật** về lịch sử thay đổi (không xóa dòng, kể cả CR bị từ chối/hoãn).

**Khi nào dùng.** Có yêu cầu **sửa đổi** một thứ đã tồn tại và đã có tài liệu — cần lần ra mọi chỗ bị ảnh hưởng và giữ vết quyết định. Cũng dùng `ba-change-request list` (xem CR theo trạng thái) và `status <mã>` (duyệt/từ chối/hoãn kèm lý do).

**KHÔNG dùng khi.** Thêm cái mới hoàn toàn (dùng `ba-add-screen` [`feature`]) — CR dành cho **đổi cái đã có**.

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

### Chế độ `flow` — Người dùng đi qua những màn nào để xong việc (trước là `ba-flow`)

**Làm gì.** Từ một ý tưởng thô, rút ra **các luồng làm việc** (ai, làm gì, qua những màn nào) và một **danh sách màn sơ bộ** kèm sơ đồ điều hướng — trước khi có bất kỳ tài liệu yêu cầu nào.

**Khi nào dùng.** Khi cần dựng bản bấm thử để chốt nghiệp vụ: muốn vẽ giao diện thì phải biết có màn gì và bấm đi đâu, mà cách làm xuôi lại bắt viết yêu cầu xong mới suy ra được màn. Đây là mảnh gỡ nút thắt đó.

**Lưu ý.** Mã màn ở đây là **tạm**. Mã chính thức do `ba-screens` cấp sau khi nghiệp vụ đã chốt — đừng dẫn chiếu tài liệu vào mã tạm.

**Khác skill gần kề.** `ba-discover process` mô tả quy trình của **tổ chức** (ai làm gì, thủ công hay máy); `ba-discover persona` đi theo **cảm xúc** của một chân dung người dùng; `ba-proto-first flow` đi theo **màn hình**; `ba-screens` mới là bản chính thức.

### Chế độ `html` — Bản bấm thử gói trong một tệp, gửi cho khách là xem được (trước là `ba-proto-html`)

**Làm gì.** Gộp tất cả màn hình và đường đi giữa chúng vào **một tệp HTML duy nhất**. Khách nhận qua email hay Zalo, mở lên là bấm thử được ngay — không cài đặt, không cần người kỹ thuật hỗ trợ. Đó là điều kiện để buổi chốt nghiệp vụ diễn ra được.

**Khi nào dùng.** Bước dựng bản bấm thử trong chuỗi mặc định (bước 4), sau khi đã có luồng màn và bản phác thảo dạng khung.

**Nó tự chặn khi nào.** Thiếu bản phác thảo của màn nào thì **dừng**, không dựng bừa. Giao diện bịa ra mà khách lại gật đầu vào đó là sai lầm đắt nhất của cả quy trình.

**Khác skill gần kề.** `ba-html-design` dựng **từng màn** thật đẹp cho dev và designer, chạy sau khi đã có đặc tả; `ba-prototype` dựng project React để **dev dùng lại**; `ba-portal sitemap` là trang **để đọc**, không bấm được. Bản của `ba-proto-first html` là bản **dùng một lần để chốt**, chốt xong thì thôi.

## ba-auto — Từ phần mềm đang chạy ra bộ tài liệu và bản dựng lại, hỏi người đúng hai lần

**Làm gì.** Nhận một phần mềm đã có sẵn code, đọc ngược ra bộ tài liệu nghiệp vụ, rồi đi tiếp cả chặng đường xuôi — đặc tả từng màn, kế hoạch làm, viết code, tới lúc sẵn sàng nghiệm thu. Điểm khác biệt nằm ở chỗ **nó hỏi bạn khi nào**: mọi câu mà máy tự tra được (tài liệu đủ chưa, ca kiểm thử phủ hết chưa, test có kiểm đúng chỗ nó nói không) thì nó tự chốt và chạy tiếp; nó chỉ dừng lại hai lần — một lần xin duyệt phạm vi trước khi động vào file nào, một lần đưa bạn **một danh sách gộp** những câu mà code không bao giờ trả lời được: *vì sao ngưỡng là 5 lần chứ không phải 3*, *ai được mở khoá một tài khoản bị khoá vĩnh viễn*, *đổi mật khẩu thì các thiết bị khác có bị đăng xuất không*.

**Khi nào dùng.** Bạn tiếp quản một hệ thống không có tài liệu, hoặc muốn dựng lại một sản phẩm cũ cho tử tế và cần bộ hồ sơ đi kèm. Cũng dùng để kiểm tra một điều đáng giá: bộ tài liệu rút ra từ code có **quay ngược về code chạy được** hay không — chỗ nào không quay về được là chỗ tài liệu còn thiếu thật.

**Khác skill gần kề.** `ba-init` bắt đầu từ **ý tưởng** và chỉ lo giai đoạn viết yêu cầu; `ba-auto` bắt đầu từ **code** và đi hết vòng đời. `ba-reverse` chỉ làm khúc đọc ngược rồi dừng. `ba-proto-first` cũng chốt nghiệp vụ trước khi đặc tả, nhưng chốt bằng bản demo bấm được, còn ở đây chốt bằng danh sách câu hỏi rút thẳng từ code đang chạy.

## Xem thêm

- `01-pipeline-core.md` — các skill nguyên tử mà orchestrator gọi bên trong.
- `04-tien-ich.md` — `ba-review` (chạy ở các gate), `ba-track`, `ba-portal` (bước tùy chọn cuối các orchestrator).
- `README.md` — index + bảng chọn theo tình huống.
