# `ba-html-design lofi` — Wireframe HTML đen trắng để chốt bố cục (trước là `ba-wireframe-lofi`)

> Bản đầy đủ của chế độ `lofi`; tóm tắt + lệnh nằm ở mục "Chế độ `lofi`" trong `../SKILL.md`.

## Mục tiêu
Toolkit đang **nhảy cóc**: từ `ascii-screen.md` (khung ký tự) sang thẳng `html-design.html` (high-fi, có màu, có thương hiệu). Hệ quả quen thuộc: đưa bản high-fi ra, người xem bàn **màu nút và font** trong khi thứ cần chốt là **bố cục và thứ tự thông tin**.

Bậc lo-fi tồn tại để **ép cuộc trò chuyện đúng chỗ**: đen trắng, khối xám, chữ thật nhưng không trang trí. Không có gì để khen đẹp, nên người xem buộc nhìn *"thiếu gì, thứ tự có đúng việc không"*.

**Điểm khác biệt của bản này:** mỗi khối mang **đúng số `#`** của mục *"Bảng mô tả chi tiết phần tử màn hình"* trong `srs.md`. Người review nhìn khối số 4 trên hình rồi tra thẳng dòng 4 của bảng — không phải đoán "cái nút đó là phần tử nào".

Ranh giới:

| Artifact | Tầng | Bàn cái gì | Ai xem |
|---|---|---|---|
| `ascii-screen.md` | phác | có những khối gì | BA tự dựng |
| **`Ho-so/wireframe.html`** | **lo-fi** | **bố cục · thứ tự · độ ưu tiên thông tin** | BA ↔ khách/PO |
| `html-design.html` | high-fi | màu · font · trạng thái · microcopy | designer, dev |
| `Ho-so/prototype.html` | bấm được | luồng đi giữa các màn | khách, để chốt nghiệp vụ |

## Điều kiện (CHẶN nếu thiếu)
Mỗi màn định dựng phải có **`ascii-screen.md`** và **`srs.md` có mục "Bảng mô tả chi tiết phần tử màn hình"**. Thiếu bảng → **DỪNG**, route `ba-screen-spec`: không có bảng thì không có số `#` để đánh, và wireframe mất đúng thứ làm nó đáng giá.

## Quy trình

> 💰 **Báo giá trước khi chạy** (`conv-gates.md` → "Cổng phương án" → Báo giá): in dòng `Ước tính: …` từ `node .claude/skills/ba-toolkit/scripts/cost.js estimate ba-html-design-lofi --man N` trước khi bắt tay (gọi từ orchestrator → dòng đó nằm trong phương án của cha); chạy xong ghi số thật `cost.js record ba-html-design-lofi --tokens N --minutes M --units N` — **chỉ khi có số token ĐO được** (từ `cost.js` đọc transcript hay output harness); không có số đo thì bỏ qua, không ước, không bịa.

1. Đọc `conventions.md`; với mỗi màn: `ascii-screen.md` + bảng phần tử trong `srs.md`.
2. Sinh `docs/Ho-so/wireframe.html` — **một file gom mọi màn**, tự chứa:
   - Mỗi màn một `<section class="wf-screen" data-screen="S01">`, có tiêu đề `<Mã> — <Tên màn>`. Màn mobile thêm **`data-width="390"`** (bề rộng khung trên canvas, px; không khai = 1280).
   - **Mỗi phần tử một khối** `<div class="wf" data-el="4">`, góc trên trái in số `#` đúng như bảng.
   - **Một dòng bảng = MỘT khối.** Phần tử tập hợp (`Table`, `List`, `Card` lặp — vd dãy 5 thẻ chỉ số) vẫn là **một** khối `data-el` bao ngoài, bên trong vẽ các mục lặp. Đánh cùng số cho 5 khối rời thì người review tra `#4` ra năm chỗ, không biết chỗ nào.
   - **Bảng chú giải ngay dưới mỗi màn**: `#` · tên phần tử · control type — chép từ `srs.md`, để xem hình và tra nghĩa không phải mở file khác.
   - Bố cục phản ánh `ascii-screen.md`: cùng thứ tự trên→dưới, trái→phải, cùng tỉ lệ tương đối.
   - **Có design Figma** (`figma-source.md`): màn có frame Figma → phương án A (`data-recommended`) **theo bố cục Figma**; khối đặc tả có mà Figma chưa vẽ → thêm class **`wf-gap`** (viền nét đứt đậm + chữ "Design cần bổ sung" bằng CSS `::after`) để người duyệt thấy đúng chỗ designer phải vẽ thêm. Ghi nguồn bố cục một dòng dưới tiêu đề màn (`Nguồn bố cục: Figma <nodeId>` / `ascii-screen.md — chưa có design`).
   - **Dòng "Đã bỏ"** trong bảng phần tử vẫn phải có khối (check-wireframe đòi đủ số): gom vào một dải nhỏ `wf-removed` cuối mỗi phương án, khối ghi `#N <tên> — Đã bỏ <phiên bản>`.
   - Dựng nhiều màn song song → soạn **một khuôn chung** (tên class, khung điện thoại/web, cách vẽ hộp thoại/sheet thành khung phụ dưới khung chính) rồi giao cho mọi lần dựng, ghép thành một tệp sau — không thì mỗi màn một kiểu.
   - **Phương án bố cục.** Màn có ≥2 cách bố cục hợp lý → **2–3 phương án khác CHIẾN LƯỢC bố cục** (việc chính đặt đâu, một/hai cột, bảng hay thẻ…); chỉ khác bo góc/màu/khoảng cách = **một** phương án. Màn hiển nhiên (vd đăng nhập) → 1 phương án, ghi lý do một dòng dưới tiêu đề màn.
     - Markup: trong `<section class="wf-screen" data-screen="S02">` mỗi phương án là `<div class="wf-variant" data-variant="A" data-reason="việc chính ở đâu · khác phương án kia gì · đánh đổi" data-recommended>` — **đúng 1** phương án mang `data-recommended`.
     - `data-reason` **đủ 3 vế** ngăn bằng `·`, vế đầu phải gọi tên **việc chính** của màn. Cấm lời sáo *"gọn gàng"*, *"hiện đại"*, *"trực quan"*, *"đẹp"* — chúng không nói gì về bố cục.
     - **Cùng bộ số `data-el`** ở mọi phương án, và **mỗi phương án phủ đủ** bảng phần tử — khác nhau ở vị trí, không ở danh sách khối.
     - Chọn bằng URL `?S02=B` (giữ tham số của màn khác, mỗi màn chọn riêng); không có tham số → hiện phương án khuyên dùng. Một `<script>` inline nhỏ đọc `URLSearchParams` để ẩn/hiện, cạnh tiêu đề màn có dãy link chuyển phương án (`A · B · C`, link giữ các tham số khác).
3. **Luật vẽ lo-fi = UI THẬT nhưng THANG XÁM (giữ kỷ luật, đừng đẹp hoá):**
   - **Nguồn giao diện trước** (`SKILL.md` bước 0b): `node .claude/skills/ba-html-design/scripts/ui-source.js docs` → dự án đã có app thì wireframe giữ **đúng shell, menu, component thật** của app (input có viền và nhãn, bảng có hàng/cột, nút đúng hình dạng, cùng bố cục với high-fi) — màn mới phải trông như đã nằm sẵn trong app, chỉ khác là **không màu**. Thứ tự nguồn: app thật > `07-design-system.md` > khối gốc toolkit. Chưa có máy đo "độ giống" — ghi nguồn đã dùng trong báo cáo.
   - **Chỉ thang xám** — không màu thương hiệu, không gradient, không đổ bóng, không emoji; icon của app vẽ lại thành SVG đơn sắc xám. Nhấn mạnh bằng **viền dày** hoặc **nền xám đậm hơn**, không bằng màu. Luật `check-wireframe` giữ nguyên.
   - **Phông của app** (không có app → một phông hệ thống), tối đa hai cỡ chữ ngoài shell.
   - **Chữ thật, không `Lorem ipsum`** — dữ liệu mẫu tiếng Việt như thật; chữ giả làm người xem không thấy được nội dung có vừa khung không.
   - Ảnh/biểu đồ → khung có gạch chéo + nhãn *"Ảnh"*/*"Biểu đồ"*, không nhúng ảnh thật.
4. **Chèn canvas duyệt:** `node .claude/skills/ba-html-design/scripts/canvas.js wireframe docs` — chèn khối runtime giữa hai mốc `<!-- ba-canvas:start -->`…`<!-- ba-canvas:end -->` trước `</body>` (chạy lại cùng byte, không sửa section). Mở file là thấy **canvas**: hàng trên cùng "Bản chốt" (mỗi màn: `data-chosen` → lựa chọn đang chọn trên trình duyệt → khuyên dùng), rồi một hàng mỗi chữ phương án, mỗi cột một màn; kéo/zoom như Design canvas, nhấp đúp khung để xem tập trung (tự co vừa bề ngang, nút "Cỡ thật 100%") kèm **khung Spec**; hàng Bản chốt có **khung Spec** đứng cạnh mỗi màn — máy lấy theo truy vết, không AI viết: thẻ "Mục đích màn" (HÀNH VI = Phạm vi màn · USER STORY = tiêu đề US · TIÊU CHÍ NGHIỆM THU = GWT) và mỗi phần tử `#n` (Mô tả + Bắt buộc/Data type · BRule/Ma trận lỗi có Trace đúng mã R-S · TC có Nguồn trỏ mã đó; thiếu nguồn ghi "chưa có …"); mỗi `data-el` trên màn có viền nét đứt + chấm số đen, bấm chấm → tới thẻ, nút **Chú thích** bật/tắt; nút **"Chọn phương án này"** và thanh dưới in sẵn câu trả lời `S02: B` + nút **Chép**. Nút "Danh sách" trả lại trang gốc; in ấn = danh sách.
5. Chạy `node .claude/skills/ba-html-design/scripts/check-wireframe.js docs` → sạch rồi mới báo xong (khối canvas chỉ thang xám, không làm bẩn bản lo-fi).
6. Báo cáo: số màn dựng · số phần tử mỗi màn · phần tử nào trong bảng chưa có khối · **màn có phương án** (chữ + lý do, đánh dấu khuyên dùng). Cú pháp trả lời **đóng**: mỗi màn một dòng `S02: B`, hoặc `ok` = nhận mọi phương án khuyên dùng — người dùng chọn trên canvas rồi bấm **Chép** là ra đúng cú pháp này.
7. Nhận trả lời → **`node .claude/skills/ba-html-design/scripts/canvas.js apply docs "<câu trả lời>"`** — đánh `data-chosen` lên phương án được chọn, gỡ khỏi phương án khác cùng màn, **giữ** các phương án khác làm lịch sử (≤1 `data-chosen` mỗi màn); màn/chữ không tồn tại → script báo, exit ≠ 0, **không ghi gì** — hỏi lại người dùng, đừng sửa tay. Rồi chạy lại `check-wireframe.js`.

## Điểm dừng
- `ascii-screen.md` mô tả một khối mà bảng phần tử không có dòng nào → **báo lệch**, sửa `srs.md` trước; đừng tự thêm số `#` mới.
- Không rõ khối nào quan trọng hơn khối nào → hỏi; **đừng dùng màu để né câu hỏi** đó.

## Đầu ra
`docs/Ho-so/wireframe.html` (tự chứa, mở offline, mở ra là canvas duyệt). **KHÔNG vào portal** — nó là bản nháp bố cục, cùng chính sách với `sitemap.html`/`prototype.html`.

## Ranh giới
- KHÁC chế độ mặc định của `ba-html-design` (high-fi, có màu, một file mỗi màn). Đánh số `#` khớp "Bảng mô tả chi tiết phần tử màn hình" nên soi ảnh ↔ bảng là khớp ngay.
- `ba-html-design` (không đối số) dựng theo phương án mang `data-chosen` nếu màn có (không có thì dựng như cũ theo `ascii-screen.md`).
- Dự án dùng Figma: chốt phương án xong → `ba-figma-draw push-lofi <màn>` đẩy phương án `data-chosen` lên page Wireframe (nấc 1), ghi sổ `Ho-so/00-figma-sync.md`.

## Lưu ý
- Tiếng Việt. **Hồ sơ dự án**: chạy ở cả `full`/`lite`/`mini` — bảng phần tử nằm trong `srs.md` nên tồn tại ở mọi hồ sơ.
- **Bản dùng một lần để chốt bố cục.** Chốt xong thì bản cho dev là `html-design.html`; đừng nuôi wireframe thành sản phẩm song song.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
