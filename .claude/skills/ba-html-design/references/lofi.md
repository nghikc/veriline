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

> 💰 **Báo giá trước khi chạy** (`conv-gates.md` → "Cổng phương án" → Báo giá): in dòng `Ước tính: …` từ `node .claude/skills/ba-toolkit/scripts/cost.js estimate ba-html-design-lofi --man N` trước khi bắt tay (gọi từ orchestrator → dòng đó nằm trong phương án của cha); chạy xong ghi số thật `cost.js record ba-html-design-lofi --tokens N --minutes M --units N`.

1. Đọc `conventions.md`; với mỗi màn: `ascii-screen.md` + bảng phần tử trong `srs.md`.
2. Sinh `docs/Ho-so/wireframe.html` — **một file gom mọi màn**, tự chứa:
   - Mỗi màn một `<section class="wf-screen" data-screen="S01">`, có tiêu đề `<Mã> — <Tên màn>`.
   - **Mỗi phần tử một khối** `<div class="wf" data-el="4">`, góc trên trái in số `#` đúng như bảng.
   - **Một dòng bảng = MỘT khối.** Phần tử tập hợp (`Table`, `List`, `Card` lặp — vd dãy 5 thẻ chỉ số) vẫn là **một** khối `data-el` bao ngoài, bên trong vẽ các mục lặp. Đánh cùng số cho 5 khối rời thì người review tra `#4` ra năm chỗ, không biết chỗ nào.
   - **Bảng chú giải ngay dưới mỗi màn**: `#` · tên phần tử · control type — chép từ `srs.md`, để xem hình và tra nghĩa không phải mở file khác.
   - Bố cục phản ánh `ascii-screen.md`: cùng thứ tự trên→dưới, trái→phải, cùng tỉ lệ tương đối.
   - **Phương án bố cục.** Màn có ≥2 cách bố cục hợp lý → **2–3 phương án khác CHIẾN LƯỢC bố cục** (việc chính đặt đâu, một/hai cột, bảng hay thẻ…); chỉ khác bo góc/màu/khoảng cách = **một** phương án. Màn hiển nhiên (vd đăng nhập) → 1 phương án, ghi lý do một dòng dưới tiêu đề màn.
     - Markup: trong `<section class="wf-screen" data-screen="S02">` mỗi phương án là `<div class="wf-variant" data-variant="A" data-reason="việc chính ở đâu · khác phương án kia gì · đánh đổi" data-recommended>` — **đúng 1** phương án mang `data-recommended`.
     - `data-reason` **đủ 3 vế** ngăn bằng `·`, vế đầu phải gọi tên **việc chính** của màn. Cấm lời sáo *"gọn gàng"*, *"hiện đại"*, *"trực quan"*, *"đẹp"* — chúng không nói gì về bố cục.
     - **Cùng bộ số `data-el`** ở mọi phương án, và **mỗi phương án phủ đủ** bảng phần tử — khác nhau ở vị trí, không ở danh sách khối.
     - Chọn bằng URL `?S02=B` (giữ tham số của màn khác, mỗi màn chọn riêng); không có tham số → hiện phương án khuyên dùng. Một `<script>` inline nhỏ đọc `URLSearchParams` để ẩn/hiện, cạnh tiêu đề màn có dãy link chuyển phương án (`A · B · C`, link giữ các tham số khác).
3. **Luật vẽ lo-fi (giữ kỷ luật, đừng đẹp hoá):**
   - **Chỉ thang xám** — không màu thương hiệu, không gradient, không đổ bóng, không icon. Nhấn mạnh bằng **viền dày** hoặc **nền xám đậm hơn**, không bằng màu.
   - **Một phông chữ hệ thống**, hai cỡ (tiêu đề / nội dung).
   - **Chữ thật, không `Lorem ipsum`** — dữ liệu mẫu tiếng Việt như thật; chữ giả làm người xem không thấy được nội dung có vừa khung không.
   - Ảnh/biểu đồ → khung có gạch chéo + nhãn *"Ảnh"*/*"Biểu đồ"*, không nhúng ảnh thật.
4. Chạy `node .claude/skills/ba-html-design/scripts/check-wireframe.js docs` → sạch rồi mới báo xong.
5. Báo cáo: số màn dựng · số phần tử mỗi màn · phần tử nào trong bảng chưa có khối · **màn có phương án** (chữ + lý do, đánh dấu khuyên dùng). Cú pháp trả lời **đóng**: mỗi màn một dòng `S02: B`, hoặc `ok` = nhận mọi phương án khuyên dùng.
6. Nhận trả lời → đánh `data-chosen` lên phương án được chọn (**giữ** các phương án khác làm lịch sử, ≤1 `data-chosen` mỗi màn), chạy lại `check-wireframe.js`.

## Điểm dừng
- `ascii-screen.md` mô tả một khối mà bảng phần tử không có dòng nào → **báo lệch**, sửa `srs.md` trước; đừng tự thêm số `#` mới.
- Không rõ khối nào quan trọng hơn khối nào → hỏi; **đừng dùng màu để né câu hỏi** đó.

## Đầu ra
`docs/Ho-so/wireframe.html` (tự chứa, mở offline). **KHÔNG vào portal** — nó là bản nháp bố cục, cùng chính sách với `sitemap.html`/`prototype.html`.

## Ranh giới
- KHÁC chế độ mặc định của `ba-html-design` (high-fi, có màu, một file mỗi màn). Đánh số `#` khớp "Bảng mô tả chi tiết phần tử màn hình" nên soi ảnh ↔ bảng là khớp ngay.
- `ba-html-design` (không đối số) dựng theo phương án mang `data-chosen` nếu màn có (không có thì dựng như cũ theo `ascii-screen.md`).
- Dự án dùng Figma: chốt phương án xong → `ba-figma-draw push-lofi <màn>` đẩy phương án `data-chosen` lên page Wireframe (nấc 1), ghi sổ `Ho-so/00-figma-sync.md`.

## Lưu ý
- Tiếng Việt. **Hồ sơ dự án**: chạy ở cả `full`/`lite`/`mini` — bảng phần tử nằm trong `srs.md` nên tồn tại ở mọi hồ sơ.
- **Bản dùng một lần để chốt bố cục.** Chốt xong thì bản cho dev là `html-design.html`; đừng nuôi wireframe thành sản phẩm song song.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
