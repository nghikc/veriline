---
name: ba-proto-first
description: Use when nghiệp vụ còn mơ hồ và muốn CHỐT BẰNG PROTOTYPE BẤM ĐƯỢC trước rồi mới đặc tả — cả chuỗi thay ba-init; `flow` luồng + màn sơ bộ → Ho-so/00-flows.md; `html` prototype một file → Ho-so/prototype.html.
---

# ba-proto-first — Luồng "dựng thấy được trước, đặc tả sau"

## Chế độ
| Gọi | Làm gì |
|---|---|
| `/ba-proto-first` (mặc định) | cả chuỗi prototype-trước — luồng màn → prototype → demo chốt `PD` → đặc tả (quy trình bên dưới) |
| `/ba-proto-first flow` | chỉ bước 2 — luồng nghiệp vụ + bảng màn sơ bộ (mã `S..` tạm) → `docs/Ho-so/00-flows.md` — mục **"Chế độ `flow`"** cuối file (trước 08/10/2026 là skill `ba-flow`) |
| `/ba-proto-first html` | chỉ bước 4 — prototype bấm được MỘT file tự chứa → `docs/Ho-so/prototype.html` + `check-proto.js` — mục **"Chế độ `html`"** cuối file (trước 08/10/2026 là skill `ba-proto-html`) |

## Mục tiêu
`ba-init` đi xuôi: yêu cầu → chức năng → màn → đặc tả → HTML. Luồng này **đảo lại**: dựng thứ **nhìn thấy và bấm được** trước, đem chốt với khách, rồi mới viết đặc tả **từ những gì đã chốt**.

Dùng khi: nghiệp vụ còn mơ hồ · khách **không đọc nổi** bảng `FR` nhưng nhìn màn hình là có ý kiến ngay · cần chốt phạm vi trước khi báo giá.

**Vì sao đáng đổi thứ tự:** chỗ mơ hồ tự lộ ra bằng hình ảnh thay vì bằng suy đoán. Khách nhìn nút "Duyệt" mới nhớ ra có hai cấp duyệt — điều họ không nghĩ ra khi đọc một bảng yêu cầu.

**Cái giá phải trả, nói thẳng:** prototype dựng khi chưa có yêu cầu thì **mọi thứ trên đó đều là giả định**. Luồng này chỉ an toàn nhờ **bước 5 — cổng chốt có ghi sổ**. Bỏ bước 5 thì nó thành "AI vẽ đại rồi tự tin viết spec theo hình mình vẽ", tệ hơn `ba-init`.

## Điều kiện
Một ý tưởng thô là đủ. Đã có `01-requirements.md` **đã chốt** → **không dùng luồng này** (nghiệp vụ chốt rồi, prototype giờ là việc của `ba-html-design`/`ba-prototype`); đổi baseline thì đi `ba-change-request`.

## Quy trình

### 0. Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án")
Đọc xong đầu vào, **trước khi ghi file nào**: trình phương án đủ 6 phần — trong "Sẽ làm" nêu rõ **số màn dự kiến** và **dừng ở bước 5 để demo**. `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**.

### 1–4. Dựng thứ thấy được
1. `ba-discover brainstorm` — phỏng vấn ý tưởng *(bỏ qua nếu đã có `Ho-so/00-brainstorm.md`)*.
2. **Chế độ `flow`** → `Ho-so/00-flows.md`: luồng theo vai trò + **bảng màn sơ bộ** (mã `S..` **tạm**) + sơ đồ điều hướng có nhãn cạnh.
3. **`ba-screen-spec --ascii <màn>`** cho từng màn → chỉ `ascii-screen.md`. **Không** sinh srs/usecase/userstory/design-spec ở đây (hồ sơ `mini`: không sinh `srs`) — chưa chốt nghiệp vụ thì đặc tả viết ra là bịa.
4. **Chế độ `html`** → `Ho-so/prototype.html` + `check-proto.js` phải sạch.

### 5. ★ CỔNG CHỐT NGHIỆP VỤ (HARD STOP — lý do luồng này tồn tại)
**Không được tự vượt qua bước này.** Đưa `prototype.html` cho người dùng/khách, rồi:

1. **Dẫn demo theo luồng**, không theo màn: mỗi luồng `L..` trong `00-flows.md` là một kịch bản bấm từ đầu đến hết.
2. **Hỏi có mục tiêu** ở mỗi màn — bốn câu, hỏi thiếu thì buổi demo thành buổi khen giao diện:
   - Thiếu gì để **xong việc** trên màn này?
   - Nút nào **không nên có** (ngoài phạm vi)?
   - Ai được thấy/được bấm cái gì (**quyền**)?
   - Sai thì hệ thống phải làm gì (**ngoại lệ**)?
3. **Ghi mọi điểm chốt vào `docs/00-decisions.md`** — mã `PD-01…` toàn cục, theo mẫu ở `conv-ledgers.md` → "Sổ quyết định sản phẩm (PD)". Mỗi dòng: nội dung chốt · ai chốt · ngày · màn/luồng liên quan · trạng thái.
4. **Không chốt được thì ghi `PD` trạng thái `Treo`** kèm câu hỏi còn mở — **không** tự quyết thay khách.
5. `AskUserQuestion`: **Đã chốt, viết đặc tả / Sửa prototype rồi demo lại / Dừng ở đây**.

> **Điều kiện đi tiếp:** mọi màn trong bảng màn sơ bộ có **≥1 `PD`** ở trạng thái `Chốt`. Còn màn chưa ai có ý kiến → **quay lại bước 5 cho riêng màn đó**, đừng viết đặc tả cho phần chưa ai xác nhận.

### 6–9. Viết đặc tả TỪ bản đã chốt
6. `ba-requirements` → `ba-functions` → `ba-screens`. **Mỗi `FR` phải trace ≥1 `PD`**; `FR` không có `PD` nào đỡ = thứ chưa ai chốt → hỏi lại, đừng viết vào. `ba-screens` cấp mã `S..` **baseline** (mã ở `00-flows.md` chỉ là tạm) và tạo `00-tracking.md` + **chốt hồ sơ dự án** `full`/`lite`/`mini`.
7. `ba-screen-spec` đầy đủ cho từng màn *(≥3 màn → `ba-batch`)*. `ascii-screen.md` đã có từ bước 3 — **dùng lại, không vẽ lại**.
8. `ba-test checklist` → `ba-test`.
9. `ba-review all` → gate. Còn 🔴 → dừng, sửa.

## Cổng lồng nhau
Chế độ `flow`/`html` và skill con được gọi từ đây (`ba-screen-spec`, `ba-requirements`, `ba-screens`) **không hỏi duyệt lại** — cổng ở bước 0 đã bao phủ (`conv-gates.md` → "Cổng cha bao phủ cổng con"). Ba ngoại lệ vẫn giữ nguyên: việc ngoài phương án · `ba-change-request`/`ba-task` · bảng màn của `ba-screens`.

## Điểm dừng
- Không suy ra được luồng nào → dừng ở bước 2, hỏi việc chính của hệ thống.
- Prototype còn lỗi `check-proto.js` → **không** đem demo (nút dẫn vào hư không trước mặt khách là mất uy tín).
- Bước 5 chưa xong → **không** chạy bước 6 dù người dùng giục; giục thì hỏi thẳng: *"chốt miệng cũng được, nhưng tôi vẫn ghi `PD` để spec có gốc — đồng ý không?"*.

## Đầu ra
`Ho-so/00-flows.md` · `ascii-screen.md` mỗi màn · `Ho-so/prototype.html` · **`00-decisions.md`** · rồi bộ tài liệu chuẩn như `ba-init` (`01`/`02`/`03`, folder màn, `00-tracking.md`).

## Lưu ý
- Tiếng Việt. **Hồ sơ dự án** (`conv-gates.md` → "Hồ sơ dự án"): bước 6 chốt `full`/`lite`/`mini`; bước 7 sinh 5 hay 6 file mỗi màn là theo hồ sơ đó.
- **Đứt phiên → `ba-next`**, đừng gọi lại `ba-proto-first`: nó là chuỗi tuyến tính không giữ trạng thái, gọi lại là về bước 0.
- **Không chạy song song `ba-init`** trên cùng dự án — hai orchestrator cùng ghi `01`/`02`/`03` sẽ giẫm nhau.
- Chốt xong và đã có `html-design.html` từng màn thì seed frontend là `ba-prototype`; `prototype.html` là bản **dùng một lần để chốt**, đừng nuôi thành sản phẩm.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Ranh giới
- `flow` đi theo **màn hình** (mã `S..` **tạm**); `ba-discover process` = quy trình **tổ chức** AS-IS/TO-BE; `ba-discover persona` = hành trình theo **cảm xúc**; `ba-screens` = `03-overview.md` **chính thức** (mã baseline, sau `02-functions.md`); `ba-portal sitemap` = trang người dùng cuối **đọc**.
- `html` = **1 file** bấm được mọi màn, cho **khách** chốt nghiệp vụ **trước** đặc tả. KHÁC `ba-html-design` (1 file **mỗi màn**, high-fi, sau đặc tả) và `ba-prototype` (project **Vite+React**, seed frontend, **sau** khi đã có `html-design`).

## Chế độ `flow` — luồng nghiệp vụ + màn sơ bộ (trước khi có yêu cầu)
Trả lời **"người dùng đi qua những màn nào để xong việc"** khi **chưa có** `01-requirements.md`/`02-functions.md` — mảnh khoá của luồng prototype-trước. **Mã `S..` ở đây là TẠM**: baseline do `ba-screens` cấp ở bước 6; ghi rõ trong file, không ai được trace vào mã tạm.

**Điều kiện.** Ý tưởng thô, hoặc `Ho-so/00-brainstorm.md`/`00-intake.md`/`00-vision.md` nếu đã chạy. **Không** đòi `01`/`02`/`03`.

**Quy trình.**
1. Đọc `conventions.md` của `ba-toolkit`; `Ho-so/00-brainstorm.md`, `00-intake.md`, `00-vision.md`, `00-personas.md` — cái nào có.
2. Rút **vai trò** và **việc cần xong** (job) của mỗi vai trò. Không có dữ liệu thì **hỏi**, đừng bịa vai trò.
3. Mỗi việc → **một luồng** = chuỗi bước, mỗi bước gắn một màn. Luồng ≥2 vai trò có bàn giao → **`swimlane-beta`** (`conv-mermaid.md` → "Luật ưu tiên vai trò"), 1 vai trò → `flowchart`.
4. Gom mọi màn → **bảng màn sơ bộ**: `mã S tạm · tên · vai trò dùng · việc nó phục vụ · ghi chú`.
5. **Sơ đồ điều hướng** giữa các màn, mỗi cạnh có **nhãn hành động** (`S01 -->|Đăng nhập thành công| S02`) — chế độ `html` đọc đúng nhãn này để nối nút bấm.
6. Ghi `docs/Ho-so/00-flows.md` theo `assets/flow-template.md`.
7. **Vòng "Xác nhận giả định"** (`conventions.md`) cho mọi chỗ phải đoán.

**Điểm dừng (KHÔNG bịa).** Không suy ra được **≥1 luồng có kết thúc rõ** → dừng, hỏi việc chính của hệ thống. Vai trò/quyền không rõ → `GĐ-..` `⚠️ chưa xác nhận`, **không** tự đặt vai trò mới. Màn không nối vào luồng nào → giữ, đánh dấu **màn mồ côi** ở cuối file để người dùng quyết.

**Đầu ra.** `docs/Ho-so/00-flows.md`. **Không** tạo folder màn, **không** đụng `00-tracking.md` (việc của `ba-screens` sau khi chốt). Sơ đồ theo `conv-mermaid.md`. **Hồ sơ dự án**: không đổi theo hồ sơ — đúng 1 file ở mọi mức `full`/`lite`/`mini`. **Xong → chạy `ba-next`.**

## Chế độ `html` — prototype một-file để chốt nghiệp vụ
Một file **`docs/Ho-so/prototype.html`** tự chứa: mọi màn trong cùng file, bấm nút là chuyển màn theo đúng `00-flows.md`. Khách **double-click là xem**, không cài gì, không server — gửi qua email/Zalo.

**Điều kiện (CHẶN nếu thiếu).** (1) `docs/Ho-so/00-flows.md` — danh sách màn + **sơ đồ điều hướng có nhãn cạnh**; (2) **mọi màn trong bảng màn sơ bộ có `ascii-screen.md`**. Thiếu → **DỪNG, KHÔNG dựng file rỗng**; báo đúng cái thiếu: thiếu `00-flows.md` → `/ba-proto-first flow`; thiếu wireframe → `ba-screen-spec --ascii <màn>`. Prototype dựng từ wireframe trống là bịa giao diện — mà đây là artifact khách gật đầu, bịa ở đây đắt nhất pipeline.

**Quy trình.**
1. Đọc `conventions.md` + `conv-gates.md` của `ba-toolkit`, `ba-html-design/shell.md` (**khung dùng chung — bắt buộc**), `docs/Ho-so/00-flows.md`, mọi `ascii-screen.md`, `docs/07-design-system.md` nếu có.
2. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Ghi **một file khách sẽ nhìn** → luôn trên ngưỡng. Trình 6 phần, "Sẽ làm" nêu **danh sách màn sẽ dựng + số cạnh điều hướng sẽ nối**. Chạy trong chuỗi mặc định (đã qua cổng bước 0) → **không hỏi lại**, in phương án rút gọn rồi chạy.
3. Dựng `docs/Ho-so/prototype.html`:
   - Mỗi màn = `<section class="screen" id="S01" data-screen="S01">`, **chỉ một section hiện tại một thời điểm**.
   - **Khung theo `shell.md`**: `app-shell` cho màn đã đăng nhập, `auth-shell` cho màn ngoài; **menu chính giống hệt ở mọi màn**, chỉ `aria-current` đổi.
   - Nút điều hướng: `data-goto="S02"` + nhãn **đúng nguyên văn nhãn cạnh** trong `00-flows.md`.
   - **Bảng điều khiển demo** cố định: danh sách màn để nhảy thẳng + nút "Bắt đầu lại".
   - **Dữ liệu mẫu như thật** (tên người Việt, số tiền có đơn vị) — không `Lorem ipsum`.
4. Chạy `node .claude/skills/ba-proto-first/scripts/check-proto.js docs` → sửa hết lỗi rồi mới báo xong.
5. Ghi vào `00-flows.md` mục "Prototype": đường dẫn + ngày + số màn/số cạnh đã dựng.

**Luật cứng của file (`check-proto.js` soát).** **Tự chứa** — không `<script src>`/`<link href>` ra ngoài, **không `<iframe>`**, không gọi mạng · **đủ màn** — mỗi màn sơ bộ đúng một `section.screen` · mọi `data-goto` trỏ `id` có thật · **không cạnh chết** — mọi cạnh sơ đồ có ≥1 nút · mọi màn `app-shell` cùng tập mục menu · không `100vw`, không emoji thay icon nghiệp vụ.

**Điểm dừng.** Màn có wireframe mà **không cạnh nào dẫn tới** → vẫn dựng, báo rõ: *"S05 không bấm tới được — kiểm lại `00-flows.md`"*. Nhãn cạnh mơ hồ (`-->|tiếp|`) → hỏi lại, đừng tự đặt tên nút.

**Đầu ra.** `docs/Ho-so/prototype.html` + báo cáo: số màn · số cạnh nối · màn không tới được · kết quả `check-proto.js`. **Hồ sơ dự án**: không đổi theo hồ sơ — luôn 1 file ở cả `full`/`lite`/`mini`. **Bản DÙNG MỘT LẦN để chốt** — chốt xong, high-fi cho dev là `ba-html-design`, seed frontend là `ba-prototype`. **Xong → chạy `ba-next`.**
