# Nguồn giao diện là design Figma của team design

> Đọc khi `SKILL.md` bước 0b xác định nguồn giao diện là **design Figma** (dự án có file Figma do designer vẽ, chưa có app chạy thật). Áp cho cả ba bậc: wireframe lo-fi (`lofi.md`), high-fi (`html-design.html`) và prototype (`scripts/prototype.js`). Vì sao có quy trình này và bẫy đã gặp: `docs/decisions/36-figma-nguon-giao-dien-va-prototype-hifi.md`.

**Vì sao:** chỉ rút màu và cỡ chữ từ Figma rồi tự vẽ lại ảnh (chai, banner, avatar…) bằng SVG minh hoạ và dùng phông tạm thì bản dựng **không giống mẫu** — người duyệt thấy ngay và phải làm lại. Ảnh, icon và phông là thứ designer đã chốt; bản dựng phải dùng **đúng tài sản đó**.

Thứ tự nguồn giao diện (bước 0b): **app thật > design Figma > `07-design-system.md` > khối gốc toolkit.** Màn chưa có trong Figma (design mới vẽ một phần) vẫn dựng theo **cùng ngôn ngữ thị giác** của các màn đã có trong Figma, dùng lại cùng ảnh/icon.

## 1. Xác định frame và rút token (đọc, không ghi)
Công cụ: một MCP Figma đọc được node và CSS (vd lệnh `figma_read` của bridge Figma).
1. `get_design_context` section/page chứa các màn (độ sâu 1) → danh sách frame màn; ghép mỗi frame với mã màn `S..` (theo tiêu đề cột/nhãn trên Figma), ghi vào báo cáo.
2. **Token**: `get_code_context <nodeId của một khối tiêu biểu>` trả CSS thật — `font-family`, cỡ chữ, line-height, `font-style`, màu chữ/nền, bo góc, padding, gap. `get_styles`/`figma_rules` của file thường lẫn style của dự án khác — **chỉ tin số đọc ra từ chính frame của dự án**. Lấy ít nhất: màu nhấn (nút chính, tab chọn) · màu header · nền màn · màu chữ chính/phụ · màu trạng thái (thành công/huỷ/giảm giá) · bo góc thẻ/nút/nhãn · cỡ chữ tiêu đề màn/khối/nội dung/nhãn/chú thích · **tên phông** từng loại chữ.
3. Màu chữ trên nền trắng không đạt WCAG AA 4.5:1 (thường là màu giảm giá đỏ/cam) → chỉnh tối nhẹ **và ghi vào "Mặc định đã chọn"** (giá trị Figma → giá trị dùng, lý do).

## 2. Xuất ảnh và icon → `docs/Ho-so/figma-assets/`
Cấu trúc: `img/` (PNG) · `icons/` (SVG, PNG khi không xuất được SVG) · `fonts/` · `manifest.json`. Thư mục nằm trong `Ho-so/` (không phải đặc tả, không vào portal); nên commit để lần sau dựng lại không phải xuất lại.
1. **Dò node ảnh** trong từng frame: RECTANGLE/ELLIPSE/FRAME **không có `fill` đặc** (fill là ảnh) — tên thường là "Image", "Product image", "Bottle", "Avatar", "Banner"…; `scan_nodes_by_types` + `get_code_context` (ảnh hiện thành khối không có `background`). **Không xuất** trang trí nền (ellipse ánh sáng, lớp phản chiếu), status bar, khung điện thoại — dựng lại bằng CSS.
2. **Ảnh**: `export_node` PNG `scale: 2` → công cụ trả đường dẫn tệp tạm → chép về `img/<tên-kebab-không-dấu>.png`. Gộp ảnh trùng nội dung (so sha1) — cùng một ảnh dùng nhiều chỗ chỉ giữ một tệp. Tệp > 400 KB → thu nhỏ còn 2× cạnh hiển thị (`sips -Z` trên macOS).
3. **Icon**: instance tên bộ icon (vd `vuesax/...`) → `export_node` SVG → `icons/<tên>.svg`; icon **đơn sắc** đổi màu cứng thành `currentColor` để ăn màu theo trạng thái; icon nhiều màu (QR, logo) giữ nguyên.
4. **Instance thuộc thư viện ngoài** (icon thanh tab, ảnh trong thẻ component) thường báo `NODE_NOT_FOUND` khi xuất lẻ → xuất **cả khối cha** PNG `scale: 3` rồi cắt từng phần theo toạ độ trong `get_design_context`; kiểm bằng mắt từng mảnh cắt. Icon có hai trạng thái (thường/đang chọn) → cắt cả hai.
5. Ảnh xuất ra còn dính chi tiết của khối (chấm chỉ báo carousel in sẵn trong banner…) → không sửa ảnh; khi dựng che bằng CSS (`object-fit`/`object-position`/`overflow`) và ghi vào báo cáo.
6. **`manifest.json`** — mảng, mỗi mục: `file` · `nodeId` · `figmaName` · `frame` · `w`/`h` (cỡ hiển thị trong design) · `dungO` (vd `["S04 #23", "S05 #8"]` — số `#` theo bảng phần tử srs) · `ghiChu`. Lập bảng này là để bước dựng biết ảnh nào cho phần tử nào, và để lần sau dựng lại tra ngược node Figma.
7. Kiểm: `node .claude/skills/ba-html-design/scripts/embed-assets.js list docs` — đếm ảnh/icon/phông, báo tệp không có trong manifest.

## 3. Phông chữ
`get_code_context` trả `font-family` thật (vd tiêu đề khối dùng một phông display nghiêng, nội dung dùng một phông sans). Text style của Figma ("Body 1/Regular") không kèm tên họ → đọc một node chữ không gắn style cùng loại để thấy `font-family`.
- **Phông OFL/miễn phí** (có trên Fontsource/Google Fonts): `figma-fonts.js urls "<Tên>" --weights … --styles … --subsets latin,latin-ext,vietnamese` in danh sách tệp → tải bằng công cụ của máy (curl) vào `figma-assets/fonts/src/` → `figma-fonts.js embed fonts/src --family "<Tên>"` sinh `fonts/fonts-embed.css` (base64, có `unicode-range`). **Kiểm có subset `vietnamese`** — phông không có dấu tiếng Việt thì báo người dùng, không âm thầm để trình duyệt thay phông.
- **Phông thương mại** (không tải được hợp pháp): đặt **bí danh** `"<Dự án> Display"`, nhúng tạm phông OFL gần dáng nhất (cùng độ nén/độ đậm/nghiêng) bằng `embed … --alias "<Dự án> Display"`, ghi vào báo cáo "chờ tệp phông + giấy phép web từ team design". Khi có tệp: `figma-fonts.js local <tệp> --family "<Dự án> Display" --weight … --style …` thay đúng khối bí danh — không phải dựng lại màn.
- Phông chỉ có **một độ đậm** (vd 400) → `font-synthesis:none` trên body, nhấn bằng cỡ/màu thay vì `font-weight:700` (trình duyệt tô đậm giả làm chữ bè).
- Hai họ phông (display + nội dung) đúng design → `check-design.js` báo `DS-BUDGET-font-family`; **giữ**, ghi lý do ở mục P lúc giao.

## 4. Bộ khung chung (soạn MỘT lần cho cả bộ màn, trước khi dựng)
Dựng nhiều màn song song (`ba-batch` hoặc nhiều agent) thì soạn một tệp khung chung **trước** rồi giao cho mọi lần dựng — không có nó mỗi màn tự chọn token/khung và các màn lệch nhau. Mẫu cần điền:
```css
:root{
  --brand-primary:<màu nhấn Figma>;  --brand-header:<màu header>;  --surface-app:<nền màn>;  --surface-card:#fff;
  --text-primary:<màu chữ chính Figma>;  --text-secondary:<chữ phụ>;  --text-placeholder:<chú thích>;
  --sale:<màu giảm giá đã chỉnh AA>;  --ok-bg/--ok-fg · --danger-bg/--danger-fg · --info-bg/--info-fg (nhãn trạng thái)
  --r-card:<bo thẻ>; --r-chip:<bo nhãn>; --r-pill:999px;
  --font-body:"<phông nội dung>",-apple-system,…;  --font-display:"<Dự án> Display","<phông thay>",sans-serif;
  --fs-screen · --fs-section · --fs-body · --fs-label · --fs-caption · --fs-price   /* ≤6 cỡ — 07 §4b */
}
```
- **Ngôn ngữ thị giác**: mô tả 5–8 dòng những gì thấy trên Figma (header cong, nền có quầng sáng, thẻ trắng bo 16, nút viên thuốc, segment…) để màn chưa có design dựng cùng kiểu.
- **Khung mobile** (app điện thoại): `app-header` trên + **`app-nav` là thanh tab dưới cố định**, đúng mục/thứ tự/nhãn của `03-overview` ở mọi màn; mục đang mở `aria-current="page"`. Hiện nhãn ở mọi tab dù design chỉ hiện nhãn tab đang chọn (tab chỉ có icon khó hiểu) — ghi vào "Mặc định đã chọn".
- **Màn cấp 2** (chi tiết, giỏ, thanh toán… — srs ghi ẩn thanh tab): giữ markup `<nav class="app-nav" … hidden>` kèm chú thích `<!-- Màn cấp 2: ẩn thanh tab theo srs; giữ markup để menu đồng nhất -->`, `aria-current` đặt vào tab cha. Ẩn đúng design mà `check-shell` vẫn thấy cùng một menu.
- **Vùng khác** (CMS web bên cạnh app khách): menu riêng (menu trái), cùng token màu. `check-shell` sẽ báo "Menu chính KHÁC NHAU (2 biến thể)" — **đúng dự kiến**, ghi vào báo cáo kèm lý do; mỗi vùng phải đồng nhất trong nội bộ.
- **Phần tử đặc tả có mà Figma chưa vẽ** (vd nút "Đặt ngay", điểm sắp hết hạn, Xoá tài khoản): dựng thật theo cùng ngôn ngữ thị giác, gắn `data-design-gap="true"` (không viền đứt ở high-fi) và liệt kê ở "Còn thấy" để designer bổ sung. **Không bỏ phần tử Must chỉ vì design chưa có.**
- **Dòng "Đã bỏ"** trong bảng phần tử srs: giữ số bằng `<template data-el="N" data-removed>` kèm chú thích lý do để `check-el` không báo thiếu.

## 5. Nhúng tài sản khi dựng
`scripts/embed-assets.js` (module + CLI): `fontCss(dir)` đầu `<style>` · `img(dir, file)` → data URI cho `<img src>` (có `alt` mô tả thật, ảnh trang trí `alt=""`, khai `width`/`height`) · `icon(dir, file)` → SVG inline `aria-hidden`. Ảnh dùng nhiều lần trong một màn → khai **một lần** thành class/biến CSS `background-image` rồi dùng lại (giữ dung lượng; một màn nên < 3 MB). **Cấm** SVG minh hoạ tự vẽ thay ảnh có trong Figma; icon không có trong bộ xuất mới được vẽ tay, cùng nét với bộ icon (độ dày nét, bo đầu), và ghi vào báo cáo.

## 6. Wireframe lo-fi khi có Figma
Màn có frame Figma: **phương án A (khuyên dùng) = bố cục Figma** (thứ tự khối, vị trí) — chỉ thêm phương án B khi có chiến lược bố cục khác thật đáng cân (vd đưa khối Must design bỏ sót lên vị trí nổi hơn). Khối đặc tả có mà Figma chưa vẽ → class `wf-gap` (viền nét đứt đậm + chữ "Design cần bổ sung") để người duyệt thấy đúng chỗ designer phải vẽ thêm. Màn chưa có design: dựng theo `ascii-screen.md` nhưng giữ ngôn ngữ khung của các màn đã có Figma. Chi tiết luật vẽ: `lofi.md`.

## 7. So với mẫu (bắt buộc trước khi giao)
Chụp mỗi màn có Figma ở 375 (`shot.js --out`) và `figma_read screenshot` frame tương ứng; một subagent ngữ cảnh trắng so hai ảnh, trả về **chữ**: chỗ khớp, chỗ lệch (cỡ chữ, thứ tự, ảnh sai/thiếu, icon vẽ tay). Lệch còn lại ghi vào "Còn thấy" — không ghi "giống mẫu" khi chưa so.

## 8. Prototype bấm được (sau khi đã có html-design)
`/ba-html-design prototype` — `scripts/prototype.js` gom mọi `html-design.html` thành `docs/Ho-so/prototype-hifi.html` (một tệp, tự chứa, gửi khách được), xem mục "Chế độ `prototype`" trong `SKILL.md`. Điều hướng máy tự lập từ cột Mô tả của bảng phần tử srs — viết Mô tả có dạng "mở S06", "chuyển tab Sản phẩm (S05)", "chạm → S13", "(→ S19)" thì prototype tự có liên kết; chỗ srs không nói đích (vd nút "Đặt lại" đưa về giỏ) bổ sung ở `Ho-so/prototype-nav.json`.
