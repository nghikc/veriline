---
name: ba-design-system
description: Use when cần DESIGN SYSTEM cho dự án — token màu/chữ/spacing, component, layout, breakpoint, motion; sinh docs/07-design-system.md làm nguồn style cho ba-figma-draw và ba-html-design.
---

# ba-design-system — Thiết kế design system

## Mục tiêu
Sinh `docs/07-design-system.md` — nguồn **style chuẩn duy nhất** (single source of truth) cho dự án: token, component, layout pattern, responsive. Để skill Figma (`ba-figma-draw`) và `ba-html-design` bám theo, không mỗi màn tự chế màu/font.

> Tài liệu **cấp tổng**, tùy chọn. Không có dòng riêng trong ma trận tracking per-màn.

> 🩹 **Chế độ `--reverse-4b` (07 có sẵn mà thiếu §4b — `thieu.js` khoá `4b`).** Chỉ viết mục §4b, không đụng phần còn lại của 07:
> 1. `node .claude/skills/ba-html-design/scripts/check-design.js docs --count --json` → với mỗi `counts.<khoá>` (`radius`, `shadow`, `font-family`, `font-size`, `spacing`): `values` (giá trị → số lần dùng toàn dự án), `files`, `topFile {file, uses}`, `maxPerFile`.
> 2. Đề xuất **trần = `maxPerFile`** (trần áp **theo từng file** html-design — vd example: radius 5 giá trị toàn dự án nhưng tối đa 4/file → trần 4), KHÔNG lấy số giá trị toàn dự án. Trước khi chốt, **gộp tay**: máy so theo CHUỖI (`rgba(0,0,0,.08)` ≠ `rgba(0,0,0,0.08)`, `8px` ≠ `.5rem`) — cùng giá trị viết khác thì tính một; giá trị lẻ (dùng ≤1 lần) là lệch → gộp vào giá trị gần nhất, trừ khỏi trần. `spacing` ghi thành thang (các giá trị còn lại), không ghi số. `accent`/`nesting` máy không đếm → hỏi hoặc giữ mặc định template.
> 3. Ghi bảng §4b đúng khuôn `design-system-template.md` (cột Khoá giữ backtick); mỗi dòng ghi chú `🔶 đếm từ N file: <các giá trị>; gộp <giá trị lẻ> → <giá trị>`. **DỪNG chờ duyệt** — duyệt xong mới bỏ 🔶; trần nới vượt thang typography/spacing đã chốt thì ghi lý do ngay dòng đó.

## Quy trình (hybrid — tự chọn nguồn theo hiện trạng)

> 💰 **Báo giá trước khi chạy** (`conv-gates.md` → "Cổng phương án" → Báo giá): in dòng `Ước tính: …` từ `node .claude/skills/ba-toolkit/scripts/cost.js estimate ba-design-system` trước khi bắt tay (gọi từ orchestrator → dòng đó nằm trong phương án của cha); chạy xong ghi số thật `cost.js record ba-design-system --tokens N --minutes M` — **chỉ khi có số token ĐO được** (từ `cost.js` đọc transcript hay output harness); không có số đo thì bỏ qua, không ước, không bịa.

1. Đọc `conventions.md` của `ba-toolkit`. Xác định nguồn:
   - **Đã có màn** (`html-design.html` / `design-spec.md` ở vài folder) → **reverse**: quét chúng, gom màu/typography/spacing/component **lặp lại** thành token nhất quán; đánh dấu chỗ mâu thuẫn (vd 3 sắc xanh khác nhau) và **chuẩn hoá về 1**.
   - **Chưa có màn** → **brief**: hỏi người dùng 3–4 câu (màu thương hiệu/logo, tông cảm xúc, font ưu tiên, sáng/tối) rồi sinh token.
   - Có skill `frontend-design` thì dùng để token có thẩm mỹ; **không có thì không chặn** — tự tránh bảng màu/typography generic (một màu nhấn, một họ chữ, không gradient trang trí).
2. Viết `docs/07-design-system.md` theo `design-system-template.md` (cùng thư mục) — điền **mọi** mục, token đặt tên **ngữ nghĩa** (`primary`/`surface`/`danger`…), kèm hex/giá trị cụ thể.
   - **§4b Ngân sách đếm được** — điền trần thật của dự án (máy đọc: `check-design.js`). Reverse từ màn có sẵn mà số thật vượt trần → **chuẩn hoá màn về trần**, đừng nới trần cho vừa màn; nới thì ghi lý do ngay dòng đó.
   - **§6a Hợp đồng nguyên tố** (7 nguyên tố) và **§6b bảng `STATUS`** — chốt **trước màn đầu tiên**: `ba-html-design` dựng một màn mỗi phiên, không có hợp đồng thì mỗi màn tự nặn nút/chip của riêng nó.
   - **§7** là sổ khối đặc thù đã duyệt — `ba-html-design` ghi ngược vào đây, đừng xoá dòng khi sửa file.
3. **Phát khối màu sơ đồ Mermaid** — thêm mục "Mermaid theme" vào `07-design-system.md`, gồm **2 khối** ánh xạ token semantic → sơ đồ; đây là bản **đè bộ mặc định** của toolkit (khi có design system, dùng khối này thay "Bộ mặc định" trong `conventions.md`):
   - **`%%{init}%%` themeVariables** (màu toàn cục, cho sequence/ERD/node chưa gắn):
     ```
     %%{init: {'theme':'base','themeVariables':{
       'primaryColor':'<surface>','primaryBorderColor':'<primary>','primaryTextColor':'<text-primary>',
       'lineColor':'<border>','fontFamily':'<font-body>'}}}%%
     ```
   - **`classDef` phân vai node** (task/decision/startend/external/error) lấy hex từ token — cùng bộ role như "Bảng màu phân vai node" trong `conventions.md`, chỉ thay giá trị bằng token dự án. Author paste khối này vào cuối sơ đồ node.
   Kèm **biến thể colorblind-safe** (Okabe-Ito): xanh `#0072B2` · cam `#E69F00` · lục `#009E73` · đỏ-tím `#CC79A7` · vàng `#F0E442`. **Chưa có design system → sơ đồ dùng bộ mặc định trong `conventions.md`; skill này chạy xong thì mọi sơ đồ mới bám bộ token này.**
4. *(Tùy chọn)* đẩy token sang **Figma** — cách làm tùy MCP đang cài: MCP Figma riêng → dùng `figma_write` theo hướng dẫn trong `figma_docs` của chính MCP (mặc định, xem `ba-figma-draw`); `figma-mcp-go` → `create_variable_collection` + `create_variable` (màu/spacing), `create_paint_style`, `create_text_style`. Ghi tên collection/style vào mục "Figma mapping" của file → skill Figma dùng style thật thay vì hardcode hex.
5. Báo người dùng: từ nay `ba-figma-draw` và `ba-html-design` bám `07-design-system.md`; nếu sửa token thì sửa ở đây rồi chạy lại các skill đó.

## Tiêu chí chất lượng (BẮT BUỘC)
- **Token ngữ nghĩa trước, hex sau:** đặt vai trò rồi gán giá trị; cấm component hardcode hex/px thô.
- **Tương phản ≥ WCAG AA:** ghi rõ tỉ lệ contrast cho cặp màu chính (primary trên nền, text trên surface); cặp không đạt phải chỉnh.
- **Spacing theo thang 8pt:** mọi padding/margin/gap là bội số 4/8; ngoại lệ phải ghi lý do.
- **§4b · §6a · §6b đủ dòng thật** (không để placeholder `[ ]`); icon là inline SVG, không emoji.
- **Reverse nhất quán:** nếu các màn lệch nhau, **chọn 1 chuẩn** và ghi "đã chuẩn hoá từ X biến thể".
- Bám file mẫu đủ mục: token (primitive + semantic), component theo cấp Atomic, icon, layout pattern, **responsive/breakpoint + mobile rules**, motion (**gồm token chuyển màn & section in/out — bắt buộc**), a11y.

## Lưu ý
- Tiếng Việt. Doc cấp tổng — cập nhật khi token đổi, không gắn vào tracking per-màn.
- **Văn phong & Thuật ngữ:** mở rộng từ viết tắt ở lần đầu dùng; thêm footer `## Thuật ngữ` cuối `07-design-system.md` + bổ sung thuật ngữ mới (token, breakpoint, elevation…) vào `docs/Ho-so/00-glossary.md` — xem `conventions.md`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
