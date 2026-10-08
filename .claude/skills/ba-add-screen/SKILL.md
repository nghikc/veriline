---
name: ba-add-screen
description: Use when cần thêm một màn hình MỚI vào hệ thống đã có tài liệu BA — cập nhật overview/tracking/folder rồi đặc tả, thiết kế, kiểm thử màn đó trong một lệnh, có gate dò gap.
---

# ba-add-screen — Orchestrator thêm 1 màn hình

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
4b. *(Tùy chọn — khuyến nghị)* invoke `ba-checklist <màn>` → `checklist.md` (checklist high-level, mã `CL-S..`); `ba-test` bám các `CL` này. Bỏ qua nếu dự án không dùng checklist.
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
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Ranh giới

- Đổi thứ đã chốt → `ba-change-request`; việc kỹ thuật/bug → `ba-task`.
