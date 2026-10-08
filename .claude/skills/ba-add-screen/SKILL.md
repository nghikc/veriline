---
name: ba-add-screen
description: Use when cần thêm cái MỚI vào dự án đã có tài liệu BA — một màn (overview/tracking/folder rồi đặc tả, thiết kế, test màn đó) hoặc `feature` — một chức năng trải nhiều màn từ yêu cầu xuống. Có gate dò gap.
---

# ba-add-screen — Orchestrator thêm 1 màn hình / 1 chức năng

## Chế độ
| Gọi | Làm gì |
|---|---|
| `/ba-add-screen <màn>` (mặc định) | thêm **một màn** mới (chức năng có thể đã có) — quy trình bên dưới |
| `/ba-add-screen feature <chức năng>` | thêm **một chức năng** mới, có thể trải nhiều màn (mới hoặc đã có) — cập nhật yêu cầu/chức năng/overview rồi đặc tả các màn liên quan — mục **"Chế độ `feature`"** cuối file (trước 08/10/2026 là skill `ba-add-feature`) |

## Mục tiêu
Thêm một màn hình mới vào dự án đang có, chạy đủ chuỗi cho riêng màn đó (không dựng lại toàn bộ).


> ⚙️ **Hồ sơ `mini`** (`conv-gates.md` → "Hồ sơ dự án"): đọc dòng `> Hồ sơ dự án:` ở đầu `docs/00-tracking.md` **trước khi lập phương án**. Khai `mini` thì mỗi màn chỉ có **5 file** (`ascii-screen · srs · html-design · test · plan`) — `ba-screen-spec` sinh 2 file thay vì 6 (usecase/userstory/design-spec dồn vào `srs.md`), gate tính "hoàn thành" theo **5/5**, và phương án phải ghi đúng con số đó chứ không phải 9.
## Quy trình
Đọc `conventions.md` + `conv-gates.md`. Cần biết: tên màn + nhóm + (các) chức năng `F..` liên quan (hỏi người dùng nếu chưa rõ).

0. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Đọc `02-functions.md` + `03-overview.md` + `00-tracking.md` TRƯỚC → trình phương án đủ 6 phần; phần "Sẽ làm" nêu rõ: **mã `S..` sẽ cấp**, đường dẫn folder sẽ tạo, `F..` nào thêm mới, **`03-overview.md`/`00-tracking.md`/`01-requirements.md` sẽ bị SỬA** (đây là file dùng chung — người dùng cần biết trước), các bước tùy chọn (checklist/figma/e2e) bật hay tắt → `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Một màn = 6+ file → **trên ngưỡng, luôn phải chờ duyệt** (trừ khi người dùng nói "chạy thẳng" ngay trong lượt gọi).
   - **Soát xung đột baseline (BẮT BUỘC, làm trong bước 0):** đối chiếu (các) `F..` liên quan với bảng **"Map chức năng ↔ màn hình"** của `03-overview.md`. **`F..` đã gán cho màn khác → đây là ĐỔI BASELINE, không phải thêm màn** (màn kia đã có srs/test/html/plan sẽ phải sửa theo). Nêu ở phần "Câu hỏi chặn" của phương án + đề xuất `ba-change-request` chạy TRƯỚC; **không tự tách chức năng khỏi màn cũ**. `ba-review screens` ở bước 3 KHÔNG bắt được lỗi này (nó soát độ phủ/truy vết, không soát baseline) — bỏ qua ở đây là đụng `02-functions.md`/`03-overview.md`/`00-tracking.md` trước khi ai kịp nhận ra cần CR.
1. Nếu màn sinh chức năng mới chưa có trong `02-functions.md` → thêm `F..` (cập nhật cả `01-requirements.md` nếu là phạm vi mới).
2. Cập nhật `03-overview.md`: thêm dòng màn (mã `S..`) + map `F..`↔màn + **cập nhật ma trận CRUD-to-Screen và sơ đồ điều hướng** (màn mới phải có ≥1 đường vào, không để mồ côi); tạo folder theo conventions, tên folder màn = `<Mã> - <Tên>` vd `S07 - Settings` (nhóm 1 màn → `docs/Screen-spec/<Mã> - <Tên>/`, nhóm nhiều màn → `docs/Screen-spec/<Nhóm>/<Mã> - <Tên>/`); thêm 1 dòng vào `00-tracking.md` (mọi ô ⬜).
3. **Gate:** invoke `ba-review screens` (xem "Quy ước gate" trong conventions). Còn 🔴/🟡 → dừng; chỉ 🟢/sạch → tiếp.
4. Invoke `ba-screen-spec <màn>`.
4b. *(Tùy chọn — khuyến nghị)* invoke `ba-test checklist <màn>` → `checklist.md` (checklist high-level, mã `CL-S..`); `ba-test` bám các `CL` này. Bỏ qua nếu dự án không dùng checklist.
5. Invoke `ba-test <màn>`.
6. **Gate:** invoke `ba-review <màn>`. Còn 🔴/🟡 → dừng; chỉ 🟢/sạch → tiếp.
7. *(Tùy chọn — dự án dùng Figma qua MCP Figma riêng)* màn đã có phương án wireframe `data-chosen` → invoke **`ba-figma-draw push-lofi <màn>`** (nấc 1). Không MCP → bỏ bước này.
8. Invoke `ba-html-design <màn>`.
8a. *(Tùy chọn — dự án dùng Figma)* html-design được duyệt (`ok`) → invoke **`ba-figma-draw push <màn>`** (nấc 2; từ đây Figma là chuẩn giao diện màn, ghi sổ `Ho-so/00-figma-sync.md`).
8b. *(Tùy chọn — hỏi người dùng)* invoke `ba-test-e2e <màn>` → `e2e/tests/<Mã>-<Tên>.spec.ts` (mỗi `TC` → 1 test Playwright). Nếu dự án **đã có** script E2E ở các màn khác thì nên làm cho đồng bộ độ phủ. Artifact **code** → cột `e2e`, không tính vào 9/9.
9. Invoke `ba-build` (chỉ sinh `plan.md` cho màn chưa có plan).
10. Invoke `ba-track refresh`.
11. **Gate cuối:** invoke `ba-review all` → bắt gap truy vết xuyên suốt sau khi thêm màn.
12. *(Tùy chọn)* nếu dự án có `docs/Ho-so/portal.html`, invoke `ba-portal` để cổng đọc không bị cũ.
13. Báo người dùng: màn đã thêm xong + plan để build.

## Lưu ý
- Chỉ đụng tài liệu liên quan màn mới.
- Chức năng mới kéo theo nhiều màn (hoặc gắn vào màn đã có) → chế độ `feature` (dưới).
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Ranh giới

- Đổi thứ đã chốt → `ba-change-request`; việc kỹ thuật/bug → `ba-task`.

## Chế độ `feature` — thêm 1 chức năng (có thể trải nhiều màn)
Thêm một chức năng mới và lan toả tới các màn liên quan (mới hoặc đã có). Đọc `conventions.md` + `conv-gates.md`; làm rõ với người dùng: chức năng làm gì, ảnh hưởng màn nào (mới/đã có). Hồ sơ `mini` áp như chế độ mặc định (ghi chú ⚙️ đầu file).

0a. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Đọc `01-requirements.md` + `02-functions.md` + `03-overview.md` + `00-tracking.md` TRƯỚC → trình phương án đủ 6 phần; "Sẽ làm" liệt kê **từng màn** sẽ tạo mới vs **màn đã có sẽ bị sửa** (chỗ dễ ghi đè nhất) + một dòng **Không đổi:** (màn/`F..`/`BRule` người đọc tưởng bị chạm mà không — kèm lý do ngắn), `FR`/`F` sẽ thêm, có chạy `ba-discover urd` không → `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Chức năng trải nhiều màn → **luôn trên ngưỡng, phải chờ duyệt**.
   - **Soát xung đột baseline (BẮT BUỘC, trong bước 0):** đối chiếu chức năng định thêm với bảng **"Map chức năng ↔ màn hình"** của `03-overview.md` và bảng `F..` của `02-functions.md`. Trùng/chồng lấn một `F..` **đã gán màn** → đây là **mở rộng/tách một chức năng ĐÃ CHỐT**, không phải chức năng mới: nêu ở "Câu hỏi chặn" + đề xuất `ba-change-request` trước. Chỉ khi chưa `F..` nào phủ → đi tiếp bước 1.
0. *(Tùy chọn — chức năng lớn/nhu cầu chưa rõ)* invoke `ba-discover urd <tên-feature>` → `docs/urd/<feature>.md` (nhu cầu `UN-..` + ranh giới phạm vi + tiêu chí `USC-..`) trước khi viết `FR`, rồi gate `ba-review urd`. Nhỏ/đã rõ → bỏ qua.
1. Cập nhật `01-requirements.md` (nếu phạm vi mới; quy tắc nghiệp vụ mới → catalog `BRule-..`; có URD → mỗi `UN-..` sinh ≥1 `FR`/`NFR`, ghi `Nguồn: UN-..`) + thêm `F..` vào `02-functions.md` **và cập nhật ma trận CRUD** (thực thể × chức năng).
2. **Gate:** invoke `ba-review functions`. Còn 🔴/🟡 → dừng; chỉ 🟢/sạch → tiếp.
3. Cập nhật `03-overview.md`: thêm màn mới và/hoặc gắn `F..` mới vào màn đã có + **cập nhật ma trận CRUD-to-Screen và sơ đồ điều hướng** nếu thêm màn; tạo folder màn mới; cập nhật `00-tracking.md` (dòng mới ⬜; màn đã có → thêm mã `F` vào cột "Mã CN", đánh ⚠️ các tài liệu cần cập nhật).
4. **Gate:** invoke `ba-review screens`. Còn 🔴/🟡 → dừng; chỉ 🟢/sạch → tiếp.
5. Với mỗi màn **mới hoặc bị ảnh hưởng** — **≥ 2 màn → đặc tả qua `ba-batch` (fan-out), không làm tuần tự inline** (`conv-gates.md` → "Đội agent" luật 5); màn đã có thì cập nhật, không tạo trùng:
   a. `ba-screen-spec <màn>` (cập nhật srs/usecase/userstory cho chức năng mới).
   a2. *(Tùy chọn — khuyến nghị)* `ba-test checklist <màn>` → cập nhật `checklist.md` (`CL-S..`).
   b. `ba-test <màn>`.
   c. **Gate:** `ba-review <màn>`. Còn 🔴/🟡 → dừng ở màn đó.
   d. *(Tùy chọn — Figma qua MCP)* màn có wireframe `data-chosen` → `ba-figma-draw push-lofi <màn>` (nấc 1).
   e. `ba-html-design <màn>` nếu giao diện đổi. Màn **đã đẩy hi-fi lên Figma** (cột `figma` ✅) → Figma là chuẩn: sửa trên Figma rồi `ba-figma-draw pull <màn>`, hoặc dựng lại rồi `push` ngay.
   e2. *(Tùy chọn — Figma)* html-design duyệt (`ok`) → `ba-figma-draw push <màn>` (nấc 2, ghi sổ `Ho-so/00-figma-sync.md`).
   f. *(Tùy chọn)* màn **đã có** script E2E → `ba-test-e2e <màn>` đồng bộ với `test.md` vừa đổi (bỏ qua thì cột `e2e` phải ⚠️, không để ✅ giả).
6. `ba-build` cho các màn đó.
7. `ba-track refresh`.
8. **Gate cuối:** `ba-review all`.
9. *(Tùy chọn)* có `docs/Ho-so/portal.html` → `ba-portal`.
10. Báo tổng kết. **Xong → chạy `ba-next`.**
