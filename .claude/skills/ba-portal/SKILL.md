---
name: ba-portal
description: Use when cần xuất cả docs/ thành cổng HTML nhiều trang có sidebar, mở offline — Ho-so/portal.html, cờ --client gọn gửi khách; chế độ `sitemap` trang luồng màn + wireframe cho người dùng cuối (Ho-so/sitemap.html).
---

# ba-portal — Cổng tài liệu HTML

## Chế độ
| Gọi | Làm gì |
|---|---|
| `ba-portal` | **Cổng tài liệu** (không đối số) — gom cả `docs/` thành `docs/Ho-so/portal.html` nhiều trang có sidebar; `--client` bản gọn gửi khách, `--single` một file `.md` → HTML. Chỉ dựng lại bản đọc, không cần duyệt |
| `ba-portal sitemap` | **Trang luồng màn cho người dùng cuối** — bản đồ điều hướng + hành trình từ usecase + wireframe ASCII mọi màn → `docs/Ho-so/sitemap.html` (trước là `ba-sitemap`). Orchestrator có gate + Cổng phương án |

Đối số đầu là `sitemap` → nhảy thẳng tới mục "Chế độ `sitemap`" ở cuối file, **không** dựng `portal.html`.

## Mục tiêu
Gom các `.md` **do BA toolkit sinh** trong `docs/` thành một file `docs/Ho-so/portal.html` **tự chứa** (offline, không phụ thuộc internet hay package): sidebar điều hướng theo cây docs + nội dung render + scrollspy. **Responsive:** trên màn hình nhỏ (≤768px) sidebar tự ẩn thành drawer, có nút hamburger ở header để mở/đóng menu.

> **Chỉ gom tài liệu của toolkit:** mặc định portal chỉ lấy các file `NN-*.md` ở cấp đầu `docs/` và các file chuẩn trong folder mỗi màn (`ascii-screen`, `brainstorm`, `srs`, `usecase`, `userstory`, `design-spec`, `checklist`, `html-design.html`, `test`, `plan`). Folder lạ do skill khác tạo (vd `docs/superpowers/`, `docs/session-notes/`) **bị bỏ qua** — báo số file đã bỏ qua khi chạy. Cần gom hết thì thêm cờ `--all`.

> **Thứ tự trình bày (không phải alphabet):** *Cấp dự án* — nhóm **Introduction** (`00-brainstorm` → `00-vision` → `00-personas` → `00-process` → `00-urd`, gom dưới một tiêu đề nav "Introduction") → `01-requirements` → `02-functions` → `07-design-system` → `10-architecture` → *(các doc dự án còn lại theo số)* → danh sách màn. *Mỗi màn* — `brainstorm` → `srs` → `ascii-screen` → `design-spec` → `usecase` → `userstory` → `checklist` → *(html-design/test/plan xếp sau)*. Đổi thứ tự = sửa `PROJECT_ORDER`/`SCREEN_ORDER` trong `build.js`. File không có trong danh sách thứ tự → giữ thứ tự số/alphabet cũ, xếp sau.

## Cách dùng
Chạy script Node (zero-dependency):
```
node .claude/skills/ba-portal/scripts/build.js docs docs/Ho-so/portal.html
```
- Tham số 1: thư mục docs (mặc định `docs`).
- Tham số 2: file output (mặc định `docs/Ho-so/portal.html`).
- Cờ `--all` (tùy chọn): tắt lọc, gom **mọi** `.md`/`.html` kể cả folder lạ.
- Cờ `--client` (tùy chọn): **portal GỌN cho khách đọc** — chỉ gồm **Introduction** (`00-introduction.md`, bản gộp) + `01-requirements` + `02-functions` + `07-design-system` + `10-architecture` + **danh sách màn** (mỗi màn chỉ 7 file: `brainstorm`, `srs`, `ascii-screen`, `design-spec`, `usecase`, `userstory`, `checklist`). **Ẩn** dashboard, tracking, glossary, registers (cr/backlog/gaps), overview, stakeholders, data-model, api-spec, roadmap, uat, integration, và các file dev/QA của màn (`html-design`/`test`/`plan`). Chế độ mặc định (không cờ) vẫn hiện đầy đủ cho nội bộ.

Mở `docs/Ho-so/portal.html` bằng trình duyệt để đọc.

### Portal gọn cho khách (`--client`) — cần dựng `00-introduction.md` trước
`--client` hiển thị **`docs/Ho-so/00-introduction.md`** thay cho 5 doc discovery. File này là bản **gộp + khử trùng lặp** của `00-brainstorm`/`00-vision`/`00-personas`/`00-process`/`00-urd` (các doc này lặp nhiều: đều có personas/phạm vi/giả định/thuật ngữ). Đây là việc **phán đoán, không phải script** — trước khi build `--client`, hãy tổng hợp `docs/Ho-so/00-introduction.md`:
- Đọc 5 doc discovery, gộp theo mạch đọc: *Sản phẩm là gì · Vấn đề & cơ hội · Người dùng (personas) · Quy trình cốt lõi (TO-BE) · Nhu cầu người dùng · Phạm vi & mục tiêu (BO) · Ràng buộc & giả định*.
- **Mỗi ý chỉ nêu một lần**; phần chi tiết (số liệu đầy đủ, bảng hành trình, AS-IS/TO-BE, danh mục giả định) thì trỏ về doc nguồn thay vì chép lại. H1 = `# Giới thiệu — <Tên dự án>`. Không bịa số liệu — giữ nguyên/trỏ nguồn.
- Trong chế độ mặc định (đầy đủ), `00-introduction.md` **bị ẩn** (đã có 5 doc nguồn) — nó chỉ dùng cho portal khách.

### Đổi 1 file `.md` → 1 HTML sạch (không khung portal)
```
node .claude/skills/ba-portal/scripts/build.js --single <file.md> [out.html] [--no-toc]
```
- `--single <file.md>`: render đúng 1 file thành trang HTML độc lập.
- Tham số output (tùy chọn): mặc định cùng tên đổi đuôi `.html` (vd `srs.md` → `srs.html`).
- Vẫn render đầy đủ: bảng, code/ASCII, list, ảnh nhúng base64, Mermaid offline (vendored).
- **Mục lục (TOC) theo heading — UI kiểu portal:** khi có **≥ 2 heading** (`#`/`##`/`###`), trang dùng bố cục giống portal cho dễ nhìn: **header tối** (hiện tên tài liệu = heading cấp 1 đầu tiên, hoặc tên file), **sidebar TOC nền tối cố định** bên trái (thụt lề theo cấp, mục đang đọc tô sáng viền xanh), và **vùng nội dung cuộn riêng**. Có **scrollspy** + click cuộn mượt tới heading; anchor id khử trùng lặp khi heading trùng tên. Trên mobile (≤768px) sidebar thành **drawer** trượt từ trái, có nút hamburger ở header, chạm nền tối hoặc `Esc` để đóng, chọn mục thì tự đóng. Ít hơn 2 heading → giữ article căn giữa trơn như cũ.
- `--no-toc`: tắt mục lục, render article căn giữa trơn (không header/sidebar).

### Kiểm cú pháp Mermaid bằng parser thật (`render-check.js`)
```
node .claude/skills/ba-portal/scripts/render-check.js docs [--json] [--plain] [--chrome <path>]
node .claude/skills/ba-portal/scripts/render-check.js docs/01-requirements.md "docs/S01 - Login/srs.md"
```
- Gọi `mermaid.parse()` (bản **vendor** mà portal nhúng, không tải mạng) cho **mọi** khối ```mermaid trong Chrome headless — một lần mở Chrome cho cả thư mục (~1–2 s). Lỗi in `file:dòng` (dòng hỏng trong khối nếu parser trả, không thì dòng mở khối). Bỏ `Ho-so/removed/`; khối ```mermaid nằm trong fence khác (ví dụ minh hoạ ````markdown) không tính.
- Trạng thái/exit: `sạch` 0 · `lỗi` 1 (có khối lỗi cú pháp) · `lỗi-đo` 2 (số kết quả ≠ số khối, Chrome/vendor hỏng — **không bao giờ coi là sạch**) · `bỏQua` 0 khi không có Chrome (in "không kiểm được", không kết luận).
- Khác `build.js --lint`: lint đoán pattern hay vỡ (`;`, `"` lẻ…) và soát quy ước (dấu tiếng Việt, hướng swimlane) — nhanh, chạy trong hook, nhưng báo oan và bỏ sót. `render-check` là phán quyết cú pháp của chính parser portal dùng; không soát quy ước.
- **Khi nào chạy:** trước khi gửi portal cho stakeholder, trong `ba-review diagram`, và ở `ba-accept` (gói phát hành). Không cắm vào hook (mở Chrome mỗi lượt sửa quá đắt).

## Khi nào chạy
- Sau khi sinh/cập nhật tài liệu (cuối `ba-init`, hoặc khi cần bản đọc để chia sẻ).
- Chạy lại bất cứ lúc nào để làm mới (ghi đè `portal.html`).
- Trước khi gửi portal: `render-check.js docs` — sơ đồ lỗi cú pháp sẽ thành hộp đỏ trong portal.

## Lưu ý
- Script render đúng: heading, bảng GFM, code/ASCII (giữ nguyên trong `<pre>`), danh sách & checkbox, link, **ảnh** `![alt](src)`, blockquote.
- **Ảnh nhúng base64:** ảnh local (`<img src>` / `![]()` trỏ file tương đối hoặc tuyệt đối) được đọc và nhúng thành `data:<mime>;base64,...` ngay trong HTML → file **tự chứa**, gửi lẻ vẫn thấy ảnh. Ảnh `http(s)`/`data:` giữ nguyên; ảnh không tìm thấy giữ nguyên `src`.
- **Phóng to ảnh/sơ đồ (lightbox):** click một **ảnh** (hoặc một **sơ đồ Mermaid**) trong nội dung → bung to giữa overlay tối để xem rõ; click nền / nút **×** / phím **Esc** để đóng. Con trỏ đổi `zoom-in` khi rê lên. Thuần vanilla, tự chứa (không thư viện ngoài), áp cho **cả** `portal.html` và trang `--single`.
- **Sơ đồ/chart Mermaid OFFLINE:** khối ```mermaid``` render thành hình bằng thư viện **vendored** `vendor/mermaid.min.js` (v11.16, inline thẳng vào HTML, **không cần internet**). Chỉ inline khi HTML thực sự có sơ đồ (tránh phình file ~3.6MB). Thiếu file vendor → fallback CDN (cần internet).
- **House theme + kiểm sơ đồ:** build áp một **house theme** Mermaid trung tính (sơ đồ tự mang `%%{init}%%` vẫn override được). Lúc build, script **lint** các khối `mermaid` và in cảnh báo `file:dòng` cho pattern hay vỡ (`;`, `"` lẻ, `()` chưa bọc, `-.x/-.o`) — **không chặn build**. Lúc mở trang, mỗi sơ đồ render trong try/catch riêng: sơ đồ lỗi hiện **hộp đỏ tại chỗ** (kèm nguồn + `console.error`), không làm chết các sơ đồ khác và không biến mất im lặng.
- Chỉ cần Node, không cần `npm install`.
- Tự bỏ qua `portal.html` khi quét (không nhúng chính nó).
- Mặc định **chỉ gom tài liệu BA toolkit**, bỏ qua folder lạ (vd `superpowers/`, `session-notes/`); dùng `--all` để gom hết. Báo số file bỏ qua trên console.
- **Mobile:** ≤768px sidebar ẩn thành drawer trượt từ trái; nút hamburger (☰) ở header mở/đóng, chạm nền tối hoặc phím `Esc` để đóng; chọn một mục thì menu tự đóng.

## Ranh giới

- Khác `ba-onepager` (một bài đọc liền mạch, ID dồn về phụ lục). Chế độ `sitemap` là trang luồng màn cho **người dùng cuối**, tách khỏi `portal.html` (đối tượng đọc khác).
- `sitemap` tĩnh, để đọc; muốn bấm qua các màn thì dùng `ba-prototype`. Cẩm nang thao tác chi tiết → `ba-accept userguide`.

## Chế độ `sitemap` — Trang luồng màn hình cho người dùng cuối
**Đọc `references/sitemap.md` trước khi chạy** — đủ quy trình 6 bước, biến thể Mermaid, đầu vào/ra. Tóm tắt:
- **Bước 0 — Đọc bối cảnh:** `conventions.md` + `conv-gates.md` của `ba-toolkit`.
- **Bước 0b — Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án"):** chạy `--check` ở bước 1 xong → trình phương án đủ 6 phần: gom bao nhiêu màn, viết bao nhiêu hành trình, `docs/Ho-so/sitemap-flows.md` + `docs/Ho-so/sitemap.html` sẽ TẠO hay **GHI ĐÈ bản cũ**, màn thiếu ascii bị bỏ qua (nêu đích danh) → `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Đã có `sitemap.html` → luôn chờ duyệt (ghi đè).
- **Bước 1 — GATE readiness:** `node .claude/skills/ba-portal/scripts/sitemap.js --check [docsDir=docs]` (chỉ dò, exit = số gap **CHẶN**). Thiếu "Sơ đồ điều hướng" trong `03-overview.md` → **CHẶN**, chạy `ba-screens` trước. Màn thiếu `ascii-screen.md` (gap **mềm**) → hỏi: REQUIRED SUB-SKILL `ba-screen-spec` cho màn thiếu, hay build với ô "chưa có wireframe". KHÔNG bịa wireframe.
- **Bước 2 — Viết hành trình** (phán đoán): từ `03-overview.md` + `usecase.md` các màn → `docs/Ho-so/sitemap-flows.md` theo `assets/sitemap-template.md`: 2–4 hành trình, mỗi bước neo mã `S..` **có thật**, văn người dùng cuối, không bịa bước. Mermaid được (một vai `flowchart`, đa vai `swimlane-beta`), giữ mã `S..` trong nhãn.
- **Bước 3 — GATE tham chiếu:** chạy lại `sitemap.js --check` → phải PASS; "Mã màn lạ trong hành trình" → **CHẶN**, sửa `sitemap-flows.md` tới khi PASS.
- **Bước 4 — Build:** `node .claude/skills/ba-portal/scripts/sitemap.js [docsDir=docs] [out=docs/Ho-so/sitemap.html]` — assemble `docs/Ho-so/sitemap.md` rồi render qua `build.js --single`.
- **Bước 5 — Bàn giao:** mở `docs/Ho-so/sitemap.html`; còn màn ô trống → nhắc `ba-screen-spec`; chia sẻ online → `ba-doc-public`. Chỉ ghi `sitemap*`, không sửa tài liệu nguồn; `sitemap.html` **không** vào `portal.html`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
