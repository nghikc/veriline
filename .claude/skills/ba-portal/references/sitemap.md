# `ba-portal sitemap` — Orchestrator trang luồng màn hình cho người dùng cuối (trước là `ba-sitemap`)

> Chi tiết đầy đủ của chế độ `sitemap`. Tóm tắt + cổng nằm ở mục "Chế độ `sitemap`" trong `../SKILL.md`.

## Mục tiêu
Một artifact **hướng người dùng cuối**: **bản đồ điều hướng** + **hành trình người dùng chính** + **wireframe ASCII từng màn** gom về `docs/Ho-so/sitemap.html` tự chứa, để người xem hiểu *"làm việc gì thì đi qua những màn nào"*.

Đây là **orchestrator có gate**: không chỉ build, mà **dò điều kiện đầu vào trước** (chặn nếu thiếu thứ cốt lõi), điều phối lấp gap, rồi mới dựng. Phần cơ giới (quét màn, gom ascii, trích sơ đồ, dò gap) do script `sitemap.js` lo; phần phán đoán (viết hành trình) do skill viết `docs/Ho-so/sitemap-flows.md`.

Khác skill gần: `ba-portal` (không đối số) gom **toàn bộ tài liệu** cho stakeholder; `03-overview.md` có sơ đồ điều hướng nhưng **không kèm wireframe + hành trình**; `ba-accept userguide` là **cẩm nang thao tác** chi tiết. `ba-portal sitemap` là **bản đồ trực quan một trang** để nắm nhanh flow.

## Quy trình (orchestrator — chạy tuần tự, dừng ở gate khi chặn)

**Bước 0 — Đọc bối cảnh.** Đọc `conventions.md` + `conv-gates.md` của `ba-toolkit`.

**Bước 0b — Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án"):** chạy `sitemap.js --check` ở bước 1 xong (biết màn nào đủ wireframe, thiếu gì) → trình phương án đủ 6 phần: gom bao nhiêu màn, viết bao nhiêu hành trình, `docs/Ho-so/sitemap-flows.md` + `docs/Ho-so/sitemap.html` sẽ TẠO hay **GHI ĐÈ bản cũ**, màn thiếu ascii sẽ bị bỏ qua (nêu đích danh) → `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Đã có `sitemap.html` từ trước → luôn phải chờ duyệt (ghi đè).

**Bước 1 — GATE readiness (dò điều kiện đầu vào):**
```
node .claude/skills/ba-portal/scripts/sitemap.js --check [docsDir=docs]
```
Cổng chỉ dò, KHÔNG build. Exit code = số gap **CHẶN**. Xử theo kết quả:
- **Sơ đồ điều hướng THIẾU** (`03-overview.md` không có mục "Sơ đồ điều hướng") → **CHẶN**. Dừng, báo người dùng chạy `ba-screens` trước (đó là skill sở hữu overview). KHÔNG tự dựng sitemap không có bản đồ.
- **Màn thiếu `ascii-screen.md`** (gap **mềm**) → hỏi người dùng: (a) **REQUIRED SUB-SKILL: `ba-screen-spec`** cho từng màn thiếu để có wireframe, rồi build lại; hay (b) build luôn — sitemap ghi "chưa có wireframe" ở màn đó. KHÔNG tự bịa wireframe.
- PASS (exit 0, không gap chặn) → sang bước 2.

**Bước 2 — Viết hành trình người dùng** (phần phán đoán): đọc `03-overview.md` (sơ đồ điều hướng + ghi chú luồng) và `usecase.md` các màn → viết `docs/Ho-so/sitemap-flows.md` theo `assets/sitemap-template.md`: **2–4 hành trình chính**, mỗi hành trình là các **bước đánh số đi qua màn** — mỗi bước neo **mã màn `S..` CÓ THẬT**, người dùng làm gì → thấy gì → sang màn nào. Văn phong cho người dùng cuối (không thuật ngữ dev); bám đúng luồng trong `usecase.md` — **không bịa bước không có trong tài liệu**.
   - **Có thể vẽ hành trình bằng Mermaid** (ba-portal render được) thay cho / bổ sung các bước text — mỗi màn một node, cạnh là hành động chuyển màn. Chọn loại theo `conventions.md`: một vai → `flowchart`, đa vai có bàn giao → `swimlane-beta`. Giữ mã `S..` trong nhãn node (để gate `--check` kiểm + khớp Wireframe); bọc nhãn trong `"…"` cho an toàn cú pháp. Xem "Biến thể Mermaid" trong `assets/sitemap-template.md`.

**Bước 3 — GATE tham chiếu (dò lại sau khi viết hành trình):**
```
node .claude/skills/ba-portal/scripts/sitemap.js --check [docsDir=docs]
```
Phải **PASS** (exit 0). Nếu báo **"Mã màn lạ trong hành trình"** (`S..` nhắc trong `sitemap-flows.md` nhưng không tồn tại) → **CHẶN**: sửa `sitemap-flows.md` cho đúng mã, dò lại tới khi PASS. Đây là gate bắt hành trình không trỏ vào màn ma.

**Bước 4 — Build:**
```
node .claude/skills/ba-portal/scripts/sitemap.js [docsDir=docs] [out=docs/Ho-so/sitemap.html]
```
Script assemble `docs/Ho-so/sitemap.md` (sơ đồ điều hướng + hành trình + wireframe ASCII mọi màn) rồi render qua `build.js --single` của chính `ba-portal` (tái dùng engine + Mermaid offline + lightbox).

**Bước 5 — Bàn giao.** Báo người dùng mở `docs/Ho-so/sitemap.html`. Nếu còn màn thiếu ascii (đã chọn build với ô trống) → nhắc chạy `ba-screen-spec` khi cần bản đầy đủ. Muốn chia sẻ online → `ba-doc-public`.

## Khi nào dùng
- Các màn đã có `ascii-screen.md` (sau `ba-screen-spec`/`ba-batch`) và `03-overview.md` có sơ đồ điều hướng.
- Cần đưa cho **người dùng cuối / khách hàng** xem nhanh toàn cảnh flow trước build hoặc khi nghiệm thu.

**KHÔNG dùng khi.** Cần cẩm nang thao tác chi tiết → `ba-accept userguide`. Cần cổng đọc mọi tài liệu → `ba-portal` không đối số.

## Đầu vào / Đầu ra
- **Vào:** `03-overview.md` (sơ đồ điều hướng), `ascii-screen.md` mỗi màn, `usecase.md` (rút hành trình), `00-tracking.md` (chức năng mỗi màn).
- **Ra:** `docs/Ho-so/sitemap-flows.md` (nguồn hành trình, LLM viết) · `docs/Ho-so/sitemap.md` (nguồn assemble) · `docs/Ho-so/sitemap.html` (bản end user).

## Lưu ý
- Zero-dependency, chỉ cần Node; không sửa tài liệu nguồn — chỉ đọc + ghi `sitemap*`.
- `--check` là **cổng cơ giới** (giống `ba-review` dò gap): exit>0 = có gap chặn. Dùng cả trong CI/script.
- Chạy lại bất cứ lúc nào để làm mới. Sửa hành trình = sửa `sitemap-flows.md` → dò `--check` → build.
- `sitemap.html` **KHÔNG vào `portal.html`** (đối tượng đọc riêng — người dùng cuối).
- Nhận diện container `Screen-spec/` (tương thích cả layout cũ màn ở thẳng `docs/`).
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Ranh giới

- Tĩnh, để đọc; muốn bấm qua các màn thì dùng `ba-prototype`.
