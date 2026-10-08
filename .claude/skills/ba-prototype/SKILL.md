---
name: ba-prototype
description: Use when các màn đã có html-design.html và cần prototype bấm được dạng project Vite + React — ghép mọi màn high-fi, nối theo sitemap-flows. Sau ba-html-design + ba-portal sitemap.
---

# ba-prototype — Scaffold prototype bấm-được (Vite + React) từ html-design + flow

## Mục tiêu
Một **prototype tương tác**: end user bấm nút trên màn để đi qua các màn theo đúng flow. Ghép **`html-design.html` mọi màn** (giữ nguyên high-fi bằng `<iframe>`) vào một project **Vite + React + React Router** ở `prototype/`, nối chức năng theo `docs/Ho-so/sitemap-flows.md`. Khác `ba-sitemap` (trang tài liệu đọc, tĩnh): đây là **app bấm-được, dùng lại được** — hạt giống cho frontend thật.

Nút bấm → điều hướng nhờ: iframe **same-origin** nên parent bắt được click trong màn, đối chiếu `src/wiring.json` (nút → màn đích) rồi `navigate`. `wiring.json` được rút tự động từ các cạnh Mermaid `Sxx -->|nhãn| Syy` trong `sitemap-flows.md`.

## Điều kiện trước khi chạy
- Mỗi màn đã có **`html-design.html`** (chạy `ba-html-design`/`ba-batch`). Màn thiếu → prototype hiện placeholder (báo chạy `ba-html-design`).
- Có **`docs/Ho-so/sitemap-flows.md`** với sơ đồ Mermaid hành trình (chạy `ba-portal sitemap`) → để rút wiring. Thiếu thì wiring rỗng, chỉ có thanh chọn màn (điền `wiring.json` tay sau).

## Quy trình
0. **Cổng phương án (BẮT BUỘC — `conventions.md` + `conv-gates.md` → "Cổng phương án").** Đọc `00-tracking.md` + `docs/Ho-so/sitemap-flows.md` (nếu có) TRƯỚC khi scaffold → trình phương án đủ 6 phần: **màn nào có `html-design.html`** để ghép (màn thiếu sẽ bị bỏ, nêu đích danh), bao nhiêu cạnh điều hướng suy ra được, thư mục `prototype/` sẽ TẠO MỚI hay **GHI ĐÈ** (`--force` xoá bản cũ — **luôn phải hỏi**), và **project sinh ra cần `npm install`** (ngoại lệ duy nhất của toolkit — người dùng phải biết trước) → `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**.
1. **Scaffold** (phần cơ giới — script):
   ```
   node .claude/skills/ba-prototype/scripts/scaffold.js [docsDir=docs] [outDir=prototype] [--force]
   ```
   Sinh project `prototype/`: copy `html-design.html` mỗi màn → `public/screens/<mã>.html`; `src/App.jsx` (thanh điều hướng **ẩn/hiện được** qua nút `‹`/`›` + iframe + bắt click same-origin → navigate); `src/wiring.json`; `package.json`/`vite.config.js`/`index.html`/`README.md`. **Không tự `npm install`.**
   - **Wiring chi tiết tự động:** script **đọc html-design** tìm nút/link thật, ghép với cạnh flow (`Sxx -->|nhãn| Syy`). Nút khớp mà **có `id`** → rule khớp id (chính xác). Nút khớp mà **chưa có id** → script **sinh id** (`proto-cta-<mã>-N`) và **chèn vào bản copy html** để rule cũng khớp id. Nút có `onclick` riêng (vd nút demo-state) bị bỏ qua — không hijack. Cạnh không tìm được nút → rule giữ nhãn (LLM sửa).
   - **Menu chính bấm được, DÙNG CHUNG mọi màn:** sau khi `ba-html-design` áp khung chung (`ba-html-design/shell.md`), mọi màn vùng đã đăng nhập mang cùng một menu — nhưng trong html tĩnh các link là `href="#"`, bấm không đi đâu. Script khớp nhãn link (`.app-nav__link`) với tên màn tiếng Việt ở `03-overview.md`, gắn id `proto-nav-<mã>` vào bản copy, và sinh **một** khoá `wiring._menu` áp cho **mọi** màn (không nhân bản vào từng màn — một nguồn duy nhất thì menu không thể lệch giữa các màn). Bấm mục của chính màn đang mở → đứng yên, không reload.
   - **Popup trạng thái:** bộ chuyển trạng thái của html-design — canon `.statebar` (nhóm có nhãn `ui`/`error`/`role`/`biz`) hoặc `.demo-nav` phẳng ở bản trước 16/08/2026 — được script gom thành **popup ở góc phải màn**, **giữ nguyên nhóm và nhãn nhóm** (đó là thứ làm một thanh 14 nút đọc được) — **kéo-thả được** (cầm thanh tiêu đề để di chuyển, clamp trong viewport) và **collapse/expand** (bấm thanh tiêu đề không kéo → thu gọn/mở). Chèn CSS+JS additive vào bản copy, giữ nguyên nút + `onclick=setState`. Màn không có nút demo → tự bỏ qua.
2. **Rà wiring** (phần phán đoán — LLM): mở `prototype/src/wiring.json` — mỗi rule `{ "id"?: "...", "text": "...", "to": "<mã màn>" }`. Đa số đã khớp `id` sẵn; chỉ cần rà các rule **chỉ có `text`** (script không tìm được nút): đọc `html-design.html` của màn đó, gán đúng nút (thêm `id` hoặc sửa `text`) và bổ sung nút còn thiếu. Chỉ dùng **mã màn có thật**; không bịa đích.
3. **Bàn giao:** báo người dùng chạy:
   ```
   cd prototype && npm install && npm run dev
   ```
   Mở URL Vite in ra; bấm nút trong màn để đi theo flow. Muốn chia sẻ: `npm run build` → `dist/` (host tĩnh bất kỳ).

## Format chuẩn output (mọi prototype phải theo — để các dự án gen giống nhau)
Khung project luôn có **3 phần UI cố định**; script sinh sẵn, đừng bỏ:

0. **Menu chính của SẢN PHẨM** (nằm trong từng iframe, do `ba-html-design` dựng theo `shell.md`; prototype chỉ nối cho nó bấm được qua `wiring._menu`). **Đừng lẫn với #1:** đây là menu người dùng cuối thấy — giống hệt ở mọi màn. #1 là công cụ cho người review nhảy tới bất kỳ màn nào, kể cả màn không nằm trong menu (Login, Chi tiết…).
1. **Thanh chọn màn để review** (`aside.proto-nav`, do `src/App.jsx` dựng từ `src/screens.js` — rút từ `03-overview.md`): nền tối cố định bên trái, tiêu đề "Prototype", liệt kê **mọi màn** dạng `<b>Sxx</b> Tên` (link điều hướng, tô sáng màn đang mở), 1 dòng gợi ý. **Ẩn/hiện được:** nút `‹`/`›` (`button.proto-nav-toggle`) ở giữa mép trái vùng nội dung — bấm để ẩn sidebar (thêm class `nav-collapsed`, màn tràn full), bấm lại để hiện.
2. **Popup trạng thái** (chèn vào từng `public/screens/<mã>.html`, id `#proto-state-panel`): gom bộ chuyển trạng thái demo của html-design (`.demo-label` + `.demo-nav` chứa các `.demo-btn` gọi `setState(...)` — mặc định là thanh trên đầu, đẩy màn thật xuống) thành **thẻ nổi góc phải trên**. Tiêu đề "◆ Trạng thái"; **kéo-thả được** (cầm thanh tiêu đề, clamp trong viewport) và **thu gọn/mở** (bấm thanh tiêu đề không kéo). Giữ nguyên nút + `onclick=setState`. Là CSS+JS additive: màn không có `.demo-btn` → tự bỏ qua (không tạo panel rỗng).
3. **Khung màn high-fi** (`iframe.screen-frame`): mỗi màn là bản copy `html-design.html` giữ nguyên trong iframe same-origin; parent bắt click → điều hướng theo `wiring.json`.

> Chuẩn này nằm trong `scaffold.js` (hằng `STATE_PANEL_SNIPPET`, khoá `wiring._menu`, khối `src/App.jsx` + `src/proto.css`). Dự án đã cài bản cũ sẽ **không** có #1/#2 → phải `ba-export update` để lấy `scaffold.js` mới rồi `scaffold.js … --force` sinh lại.

## Khi nào dùng
- Đã có html-design các màn + sitemap-flows; cần **demo bấm-được** cho khách hàng, hoặc **seed frontend** để dev phát triển tiếp.

**KHÔNG dùng khi.** Chỉ cần trang tài liệu flow để đọc (dùng `ba-portal sitemap`). Chưa có html-design (chạy `ba-html-design` trước). Cần code sản phẩm thật đầy đủ (đó là `dev-run` theo `plan.md`).

## Đầu vào / Đầu ra
- **Vào:** `html-design.html` mỗi màn, `docs/Ho-so/sitemap-flows.md` (cạnh wiring), `03-overview.md` (tên màn).
- **Ra:** project `prototype/` (Vite + React + Router) — chạy `npm install && npm run dev`.
- **Nguồn thiết kế (system design):** prototype **không đọc trực tiếp** `07-design-system.md`/`10-architecture.md`. Độ trung thực UI đến từ **`html-design.html`** — file này do `ba-html-design` sinh **theo** `07-design-system.md` (token màu/spacing/typography, component). Nghĩa là prototype đồng bộ design system **qua html-design**, không lặp lại việc đọc file design. Muốn đổi giao diện chuẩn → sửa `07-design-system.md` rồi chạy lại `ba-html-design`, không sửa trong prototype.

## Lưu ý
- Scaffold script zero-dependency (chỉ Node); **project sinh ra thì cần npm** (Vite/React) — đây là ngoại lệ có chủ đích so với các artifact tự-chứa khác, vì mục tiêu là **dùng lại được**.
- **Phần dùng lại** = khung project (routing/nav/wiring pattern). **Phần prototype** = màn còn là HTML tĩnh (iframe html-design); dev thay dần bằng component React để thành app thật.
- `prototype/` nên nằm trong `.gitignore` nếu chỉ dùng để demo (là artifact sinh lại được); commit nó nếu bắt đầu phát triển thật từ đó.
- Nhận diện container `Screen-spec/` (tương thích layout cũ).
- Đã kiểm: project sinh ra `npm install && npm run build` chạy được (Vite build pass).
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Ranh giới

- Khác `ba-proto-first html` (một file HTML tự chứa, dựng TRƯỚC đặc tả để chốt nghiệp vụ); `ba-prototype` là project Vite + React ghép html-design, dựng SAU đặc tả.
