---
name: ba-html-design
description: Use when cần dựng bản thiết kế HTML trực quan cho một màn đã có ascii-screen, srs, design-spec; bước 5, sinh html-design.html; chế độ `lofi` — wireframe đen trắng chốt bố cục trước khi bàn màu (Ho-so/wireframe.html).
---

# ba-html-design — Dựng HTML cho 1 màn hình

## Chế độ
| Gọi | Làm gì |
|---|---|
| `/ba-html-design <màn>` | Mặc định — dựng `html-design.html` high-fi cho MỘT màn (quy trình dưới đây) |
| `/ba-html-design lofi [màn…]` | Wireframe lo-fi đen trắng gom mọi màn → `docs/Ho-so/wireframe.html`, khối đánh số `#` theo bảng phần tử srs, 2–3 phương án bố cục để người chọn — mục "Chế độ `lofi`" cuối file (trước là `ba-wireframe-lofi`) |

## Mục tiêu
Cho một màn hình, sinh `docs/Screen-spec/<Nhóm>/<Màn>/html-design.html` — bản dựng trực quan tĩnh. **Dựng một màn là RÁP** từ khung chung, nguyên tố và khối đã duyệt — không nặn lại từ đầu mỗi phiên.

## Quy trình

> 💰 **Báo giá trước khi chạy** (`conv-gates.md` → "Cổng phương án" → Báo giá): in dòng `Ước tính: …` từ `node .claude/skills/ba-toolkit/scripts/cost.js estimate ba-html-design --man N` trước khi bắt tay (gọi từ orchestrator → dòng đó nằm trong phương án của cha); chạy xong ghi số thật `cost.js record ba-html-design --tokens N --minutes M --units N` — **chỉ khi có số token ĐO được** (từ `cost.js` đọc transcript hay output harness); không có số đo thì bỏ qua, không ước, không bịa.

0. **Cổng thu nợ 🟠 của màn này (`conv-gates.md` → "Quy ước gate").** `design-spec.md` — hồ sơ `mini`: mục "Giao diện" của `srs.md` — thiếu mục **Animation chuyển cảnh** (gap 🟠 `Mốc = ba-html-design`) → **DỪNG**, route `ba-screen-spec <màn>` bổ sung trước. Dựng HTML rồi mới thêm animation nghĩa là phải sửa lại HTML — mốc đặt ở đây chính vì vậy.
1. **Đọc.** `conventions.md` + `conv-gates.md` của `ba-toolkit`; **`shell.md`** (cùng thư mục — khung dùng chung, bắt buộc); **`references/blocks/README.md`** rồi đúng file khối màn cần; `ascii-screen.md`, `srs.md`, `design-spec.md` của màn; **`docs/03-overview.md`** (menu chính lấy từ đó, không tự nghĩ). Có `docs/07-design-system.md` → bám token, **§4b ngân sách**, **§6a nguyên tố**, **§6b bảng `STATUS`**, **§7 khối đã duyệt của dự án** (ưu tiên hơn khối gốc toolkit). Có `docs/Ho-so/wireframe.html` mà màn có phương án `data-chosen` → dựng theo bố cục phương án đó.
> ⚙️ **Hồ sơ `mini`** (`conv-gates.md` → "Hồ sơ dự án"): màn chỉ có `ascii-screen`/`srs`/`html-design`/`test`/`plan`. UI state · CTA · microcopy · Animation đọc ở **mục "Giao diện" của `srs.md`** thay cho `design-spec.md` — cổng thu nợ 🟠 ở bước 0 cũng soi mục đó. Đừng báo "thiếu tài liệu" — 4 file kia không tồn tại **theo thiết kế**, và phải nói ra trong báo cáo (`⚙️ mini: …`).
1b. **Khung dùng chung (BẮT BUỘC — `shell.md`).** Skill này dựng **một màn mỗi lần**, nên không phiên nào tự thấy được thứ chỉ lộ ra khi đặt các màn cạnh nhau. Vì vậy hai khối sau **dán nguyên từ `shell.md`, không chế lại**: (a) **app shell** — header + **menu chính giống hệt nhau ở mọi màn** (thứ tự, nhãn; chỉ đổi chỗ đặt `aria-current`) + bộ tên class đóng; màn chưa đăng nhập dùng `auth-shell`. (b) **thanh trạng thái `statebar`** — chia nhóm có nhãn (`ui`/`error`/`role`/`biz`), nhóm `ui` đúng 4 nhãn `Mặc định · Đang tải · Rỗng · Lỗi`, ca lỗi mang `data-trace="E-S.."`, thu gọn được.
2. **Bảng trạng thái & dữ liệu — IN RA TRƯỚC KHI DỰNG** (không chờ duyệt). Dựng trước rồi mới nghĩ trạng thái là cách sinh ra màn chỉ đẹp ở ca mặc định.
   - Mỗi phần tử động → trạng thái nó có (mặc định · rê · focus · khoá · đang tải · rỗng · lỗi · xong) **kèm nguồn** (`R-S..` / `E-S..` / mục design-spec). Trạng thái không có nguồn → không dựng (đừng bịa ca cho đủ bộ).
   - **Dữ liệu mẫu có ca biên:** ít nhất một tên/tiêu đề ~200 ký tự, số `0`, số lớn `1.284.500`, danh sách rỗng, thiếu ảnh; có trạng thái tính theo thời gian (quá hạn, sắp hết hạn) thì ≥1 mục rơi vào đó. Các khối cùng nói về một bản ghi phải **khớp số với nhau** (tổng ở KPI = số dòng ở bảng). Chữ thật tiếng Việt, không `Lorem ipsum`.
   - Khung chờ (skeleton) **đúng hình** nội dung thật, không một thanh xám chung.
3. **Thiếu thông tin để dựng** (microcopy, thứ tự ưu tiên, hành vi rỗng…) → gom **tối đa 5 câu, hỏi MỘT lần, mỗi câu kèm đáp án đoán sẵn** ("Nút chính: *Lưu thay đổi* — ok?"), người dùng trả `ok` là nhận cả. Chạy batch/tự động hoặc người dùng đã nói "làm luôn" → không hỏi, lấy đáp án đoán và ghi vào **Mặc định đã chọn** lúc giao.
4. **Dựng** một file HTML **độc lập, tự chứa** (CSS trong `<style>`, không build), theo **Luật dựng** và **Kỹ thuật** bên dưới. **Mỗi khối ứng với một dòng "Bảng mô tả chi tiết phần tử màn hình" của `srs.md` mang `data-el="<#>"`** (cùng số với wireframe; khối lặp — bảng, danh sách — một `data-el` bao ngoài; header/menu của shell mang số khi srs liệt kê chúng là phần tử; statebar không bao giờ mang). Số này là chỗ bám để soi srs ↔ bản dựng và để đối soát từng khối khi đẩy lên Figma. Có skill `frontend-design` thì được dùng để nâng thẩm mỹ, nhưng **không bắt buộc** và không được phá Luật dựng.
5. **Vòng soát — TỐI ĐA 3 VÒNG.** Mỗi vòng chạy cả bốn, sửa, chạy lại:
   ```bash
   node .claude/skills/ba-html-design/scripts/check-shell.js docs                 # khung — so MỌI màn với nhau
   node .claude/skills/ba-html-design/scripts/check-design.js "<folder màn>" --plain # ngân sách · token · emoji · dấu hiệu "AI dựng"
   node .claude/skills/ba-html-design/scripts/check-el.js "<folder màn>" --plain     # mỗi dòng bảng phần tử srs có khối data-el, không số lạ
   node .claude/skills/ba-toolkit/scripts/scan-html.js "<folder màn>" --plain    # WCAG/UX tĩnh
   node .claude/skills/ba-html-design/scripts/shot.js "<folder màn>" --out <tmp> --plain  # 375 & 1440 × mỗi trạng thái: cuộn ngang, chữ bị cắt, vùng bấm
   ```
   `check-shell.js` còn đỏ → **không báo xong**. Mục `P..` khác còn sau 3 vòng, hoặc cố ý giữ → **liệt kê từng mã kèm lý do lúc giao**; không mục nào được biến mất im lặng. Script in "không kiểm được" (vd máy không có Chrome) → ghi vào *Chưa kiểm*, không ghi "sạch".
6. **Tự soi 5 câu** trên ảnh `shot.js --out` — **đọc ảnh bằng subagent ngữ cảnh trắng, nhận lại chữ** (ảnh nạp vào phiên chính bị nạp lại ở mọi lượt sau). Trả lời cả 5, ghi ra lúc giao — **không ghi là chưa soi**:
   1. Card/khối cùng hàng có cao lệch nhau không?
   2. Có link/nút nào trông như chữ thường không?
   3. Có khung lồng quá 2 tầng không?
   4. Ở 1440 có mảng trống vô nghĩa không? Ở 375 thứ tự trên→dưới còn đúng việc chính không?
   5. Thứ **nặng nhất** màn (to/đậm/màu nhất) có phải **việc chính** của màn không?
7. **Giao** — đúng thứ tự (mẫu ở mục "Báo cáo lúc giao").
8. Cập nhật ô `html` của màn hình trong `docs/00-tracking.md` = ✅ và cột "Cập nhật cuối".
9. **Ghi ngược khối:** màn được duyệt mà có khối **đặc thù dự án** chưa có mẫu → thêm một dòng vào `07-design-system.md` §7 (tên · dùng khi · `Mẫu: <Mã màn> html-design.html` · class). Màn sau ráp lại, không dựng lại.

## Luật dựng
- **Ráp, không nặn.** Khối lấy từ 07 §7 → `references/blocks/` → mới đến tự dựng. Chưa có mẫu → mượn **khuôn** của khối gần nhất đã duyệt (không mượn nội dung) và ghi lúc giao "X chưa có mẫu, mượn khuôn Y". Nguyên tố theo 07 §6a — cần biến thể ngoài bảng thì nói ra, đừng tự thêm.
- **Một tín hiệu mạnh mỗi màn.** Nền nhấn, chữ to đậm, màu đỏ — dành cho **việc chính** (CTA/số liệu quyết định). Mọi thứ khác nhường. Đếm số chỗ tô đặc: mỗi chỗ phải nói được một điều mới.
- **Câu lặp ở mọi ô thì kéo ra ghi một lần** (đơn vị, nhãn cột, chú thích chung).
- **Trạng thái nghiệp vụ theo bảng `STATUS` (07 §6b)** — cùng nhãn, cùng màu, cùng icon ở mọi màn; là giá trị ô thì dùng pill, là tiêu đề nhóm thì icon + tên + số.
- **Icon là inline SVG** (`stroke="currentColor"`, `aria-hidden="true"`, nhãn ở `aria-label` của nút). **Không emoji làm icon.**
- **Trong ngân sách 07 §4b** (mặc định: 1 màu nhấn · 1 họ chữ · 6 cỡ chữ · 4 bo góc · 2 shadow chỉ cho lớp nổi · lồng ≤2 tầng · spacing `4 8 12 16 20 24 32 40`). Vượt → nêu lý do lúc giao.
- **Không trang điểm:** không gradient trang trí, không `backdrop-filter`, không chữ trong suốt cắt nền, không hero chiếm cả màn đầu, không margin âm thiếu chú thích lý do.

## Kỹ thuật áp dụng
- **Mobile-first Responsive Grid:** viết style cho mobile trước, mở rộng lên bằng `@media (min-width)`; dùng đúng breakpoint của `07-design-system.md` (hoặc mặc định desktop ≥1200 / tablet ≥768 / mobile <768). Bố cục co giãn (flex/grid), không cố định px cho khung chính.
- **UI-State Completeness:** dựng đủ các trạng thái đã liệt kê ở bước 2 — *Empty*, *Loading*, *Error*, *Success/Default* — mỗi trạng thái một khối `state-*` bật bằng `body[data-state]` (`shell.md` §2.3).
- **WCAG AA:** tương phản text/nền ≥ 4.5:1; input có `<label>`; nút/icon có nhãn truy cập; focus thấy được; vùng bấm ≥ 24×24 ở mobile.
- **Design Token adherence:** màu/typography/spacing từ `07-design-system.md`; không tự chế hex/cỡ chữ ngoài hệ token.
- **Animation chuyển cảnh (BẮT BUỘC):** hiện thực mục Animation của design-spec — chuyển section/panel/modal/tab/toast **vào-ra** mượt bằng `transform`/`opacity` (tránh layout-thrash), enter `ease-out` / exit `ease-in`, duration theo Motion token `07-design-system.md` (nếu có). Mô phỏng chuyển màn bằng transition trên container chính. Bọc khối `@media (prefers-reduced-motion: reduce)` để giảm/tắt.

## Báo cáo lúc giao
Đúng thứ tự này — người dùng đọc dòng đầu là biết máy đã quyết thay họ những gì:
1. **Mặc định đã chọn** — mỗi dòng một quyết định máy tự lấy (đáp án đoán ở bước 3, cách hiểu một từ mơ hồ, phương án wireframe), kèm "*muốn khác thì nói*".
2. **Số liệu giả** — số/tên nào là mẫu, ca biên nào đã cài.
3. **Đã kiểm / Chưa kiểm vì …** — chép dòng cuối của từng script; script "không kiểm được" ghi ở đây.
4. **Mục P còn lại** — mã · lý do giữ (hoặc "không còn").
5. **Tự soi 5 câu** — mỗi câu một dòng trả lời.
6. **Ngoài ngân sách / mượn khuôn** — nếu có.
7. **Còn thấy** — tối đa 5 dòng đánh số: thứ bản dựng **không tự quyết được** (thứ tự ưu tiên hai khối, microcopy chưa chốt…). Kết bằng: *Trả lời `ok`, hoặc `sửa 1, 3` kèm ý.*

## Tiêu chí chất lượng (BẮT BUỘC)
- **`check-shell.js` sạch** — khung, menu và thanh trạng thái khớp `shell.md`. Đây là tiêu chí *xuyên màn* duy nhất; các tiêu chí còn lại chỉ soát trong phạm vi một màn.
- **`check-el.js` sạch** — đủ khối `data-el` theo bảng phần tử srs.
- **`check-design.js` không còn ❌** chưa giải thích; **`shot.js` không còn `SHOT-HSCROLL`** ở 375.
- **Menu chính giống hệt ở mọi màn cùng vùng** — cùng mục, cùng thứ tự, cùng nhãn. Màn cấp 2 (chi tiết/sửa) **không** thêm mục menu, chỉ thêm breadcrumb/back-link.
- **Đủ UI state** đã liệt kê ở bước 2, dữ liệu mẫu có ca biên.
- **Responsive thực sự:** có ≥1 breakpoint chuyển layout; 375 không cuộn ngang.
- **Tương phản ≥ WCAG AA** và mọi input có label.
- **Có animation in/out** cho các section động + overlay (modal/dropdown/toast) mà design-spec nêu, dùng `transform`/`opacity`; **có khối `prefers-reduced-motion`** giảm/tắt chuyển động.
- **Báo cáo lúc giao đủ 7 mục**, có 5 câu tự soi.

## Lưu ý
- File mở được trực tiếp trên trình duyệt, không phụ thuộc package.
- **Tự chứa (offline):** mọi ảnh nhúng dạng `data:<mime>;base64,...` hoặc inline SVG — không trỏ URL ngoài. Biểu đồ/chart vẽ bằng **inline SVG** (hoặc khối ```mermaid``` nếu xuất qua `ba-portal`, render offline bằng mermaid vendored) — không nhúng thư viện chart qua CDN.
- Nhãn/nội dung tiếng Việt, khớp ascii-screen.
- Một màn hình mỗi lần — **nhưng khung thì thuộc về cả hệ thống**: sửa `shell.md` là sửa cho mọi màn, và phải chạy lại `check-shell.js` trên toàn bộ `docs/` chứ không riêng màn vừa dựng.
- Dựng lại một màn cũ (đổi giao diện, CR) → **đồng thời nâng khung và icon của nó lên canon**, đừng để nửa hệ thống một kiểu.
- **Màn đã đẩy hi-fi lên Figma** (cột `figma` ✅/✋, sổ `Ho-so/00-figma-sync.md`) → **Figma là chuẩn** của giao diện màn: đổi giao diện thì sửa trên Figma rồi `ba-figma-draw pull`, hoặc dựng lại ở đây rồi `ba-figma-draw push` ngay — sửa html rồi để đó là lệch (`⚠️`).
- **Duyệt xong** (người trả `ok`) → nếu dự án dùng Figma: `ba-figma-draw push <màn>`.
- Muốn bản audit đủ ba trục có agent (WCAG · UX · Core Web Vitals) → `ac-audit-web <Mã>` (`docs/Ho-so/audit/`).
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Chế độ `lofi` — Wireframe đen trắng để chốt bố cục
Bậc giữa `ascii-screen.md` (phác) và `html-design.html` (high-fi): đen trắng, khối xám, chữ thật — người xem buộc bàn **bố cục · thứ tự · độ ưu tiên thông tin**, không bàn màu. Mỗi khối mang **đúng số `#`** của "Bảng mô tả chi tiết phần tử màn hình" trong `srs.md`. Bản đầy đủ (luật markup phương án, luật vẽ, bảng ranh giới): **`references/lofi.md`** — đọc trước khi dựng.

> 💰 **Báo giá trước khi chạy** (`conv-gates.md` → "Cổng phương án" → Báo giá): in dòng `Ước tính: …` từ `node .claude/skills/ba-toolkit/scripts/cost.js estimate ba-html-design-lofi --man N` trước khi bắt tay (khoá riêng của chế độ trong `cost-defaults.json` — số lo-fi nhỏ hơn high-fi nhiều, chung khoá thì báo giá cả hai sai); chạy xong ghi số thật `cost.js record ba-html-design-lofi --tokens N --minutes M --units N` — **chỉ khi có số token ĐO được** (từ `cost.js` đọc transcript hay output harness); không có số đo thì bỏ qua, không ước, không bịa.

1. **Điều kiện (CHẶN nếu thiếu):** mỗi màn định dựng có `ascii-screen.md` và `srs.md` có mục "Bảng mô tả chi tiết phần tử màn hình". Thiếu bảng → **DỪNG**, route `ba-screen-spec` (không có số `#` để đánh). Chạy ở cả `full`/`lite`/`mini` — bảng nằm trong `srs.md`.
2. **Sinh `docs/Ho-so/wireframe.html`** — một file gom mọi màn, tự chứa: mỗi màn `<section class="wf-screen" data-screen="S01">`; **một dòng bảng = MỘT khối** `<div class="wf" data-el="4">` (phần tử lặp vẫn một khối bao ngoài); bảng chú giải `#` · tên · control type dưới mỗi màn; bố cục theo `ascii-screen.md`.
3. **Phương án:** màn có ≥2 cách bố cục hợp lý → 2–3 `wf-variant` khác **chiến lược** bố cục, đúng 1 `data-recommended`, `data-reason` đủ 3 vế (`việc chính · khác gì · đánh đổi`, cấm "gọn gàng/hiện đại/trực quan/đẹp"), cùng bộ `data-el` và phủ đủ bảng; chọn bằng `?S02=B`. Màn hiển nhiên → 1 phương án + lý do một dòng.
4. **Luật lo-fi:** chỉ thang xám (không màu thương hiệu, gradient, bóng, icon, emoji), một phông hai cỡ, chữ thật tiếng Việt không `Lorem ipsum`, ảnh/biểu đồ = khung gạch chéo có nhãn.
5. Chạy `node .claude/skills/ba-html-design/scripts/check-wireframe.js docs` → sạch rồi mới báo xong.
6. **Báo cáo:** số màn · số phần tử mỗi màn · phần tử chưa có khối · màn có phương án (chữ + lý do, khuyên dùng). Trả lời **đóng**: mỗi màn `S02: B`, hoặc `ok` = nhận mọi khuyên dùng.
7. Nhận trả lời → đánh `data-chosen` (≤1 mỗi màn, giữ phương án khác làm lịch sử), chạy lại `check-wireframe.js`. Chế độ mặc định dựng theo phương án `data-chosen`; dự án dùng Figma → `ba-figma-draw push-lofi <màn>`.

**Điểm dừng:** `ascii-screen.md` có khối mà bảng phần tử không có dòng → báo lệch, sửa `srs.md` trước, không tự thêm số `#`; không rõ khối nào quan trọng hơn → hỏi, đừng dùng màu để né. **Đầu ra** `docs/Ho-so/wireframe.html` — **không vào portal**, bản dùng một lần để chốt bố cục, đừng nuôi song song với html-design. **Xong chế độ này → chạy `ba-next`.**
