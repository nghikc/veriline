---
name: ba-add-feature
description: Use when cần thêm một chức năng MỚI (có thể trải nhiều màn) vào dự án đã có — cập nhật yêu cầu, chức năng, overview rồi đặc tả các màn liên quan trong một lệnh, có gate dò gap.
---

# ba-add-feature — Orchestrator thêm 1 chức năng

## Mục tiêu
Thêm một chức năng mới và lan toả tới các màn hình liên quan (mới hoặc đã có).

## Quy trình
Đọc `conventions.md` + `conv-gates.md`. Làm rõ với người dùng: chức năng làm gì, ảnh hưởng màn nào (mới/đã có).

0a. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Đọc `01-requirements.md` + `02-functions.md` + `03-overview.md` + `00-tracking.md` TRƯỚC → trình phương án đủ 6 phần; phần "Sẽ làm" phải liệt kê **từng màn** sẽ tạo mới vs **màn đã có sẽ bị sửa** (đây là chỗ dễ ghi đè nhất của skill này) + một dòng **Không đổi:** (màn/`F..`/`BRule` người đọc tưởng bị chạm mà không — kèm lý do ngắn), `FR`/`F` sẽ thêm, có chạy `ba-urd` không → `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Chức năng trải nhiều màn → **luôn trên ngưỡng, phải chờ duyệt**.
   - **Soát xung đột baseline (BẮT BUỘC, làm trong bước 0):** đối chiếu chức năng định thêm với bảng **"Map chức năng ↔ màn hình"** của `03-overview.md` và bảng `F..` của `02-functions.md`. Trùng/chồng lấn một `F..` **đã gán màn** → đây là **mở rộng hoặc tách một chức năng ĐÃ CHỐT**, không phải chức năng mới: nêu ở "Câu hỏi chặn" + đề xuất `ba-change-request` trước. Chỉ là chức năng thật sự mới, chưa `F..` nào phủ → mới đi tiếp bước 1.
0. *(Tùy chọn — chức năng lớn/nhiều nhu cầu chưa rõ)* invoke `ba-urd <tên-feature>` → `docs/urd/<feature>.md`: chốt **người dùng cần gì** (nhu cầu `UN-..` + ranh giới phạm vi + tiêu chí `USC-..`) trước khi viết `FR`. Rồi gate `ba-review urd`. Chức năng nhỏ/đã rõ → bỏ qua, vào thẳng bước 1.
1. Cập nhật `01-requirements.md` (nếu phạm vi mới; quy tắc nghiệp vụ mới → thêm vào catalog `BRule-..`; có URD ở bước 0 → mỗi `UN-..` sinh ≥1 `FR`/`NFR`, ghi `Nguồn: UN-..`) + thêm `F..` vào `02-functions.md` **và cập nhật ma trận CRUD** (thực thể × chức năng) trong đó.
2. **Gate:** invoke `ba-review functions` (xem "Quy ước gate" trong conventions). Còn 🔴/🟡 → dừng; chỉ 🟢/sạch → tiếp.
3. Cập nhật `03-overview.md`: thêm màn mới và/hoặc gắn `F..` mới vào màn đã có + **cập nhật ma trận CRUD-to-Screen và sơ đồ điều hướng** nếu thêm màn; tạo folder cho màn mới; cập nhật `00-tracking.md` (dòng mới ⬜; màn đã có → thêm mã `F` vào cột "Mã CN", đánh ⚠️ các tài liệu cần cập nhật).
4. **Gate:** invoke `ba-review screens`. Còn 🔴/🟡 → dừng; chỉ 🟢/sạch → tiếp.
5. Với mỗi màn **mới hoặc bị ảnh hưởng** (nhiều màn → REQUIRED SUB-SKILL: Use dev-dispatching-parallel-agents):
   a. Invoke `ba-screen-spec <màn>` (cập nhật srs/usecase/userstory cho chức năng mới).
   a2. *(Tùy chọn — khuyến nghị)* invoke `ba-checklist <màn>` → cập nhật `checklist.md` (mã `CL-S..`) cho chức năng mới; `ba-test` bám theo. Bỏ qua nếu dự án không dùng checklist.
   b. Invoke `ba-test <màn>`.
   c. **Gate:** invoke `ba-review <màn>`. Còn 🔴/🟡 → dừng ở màn đó; chỉ 🟢/sạch → tiếp.
   d. *(Tùy chọn — dự án dùng Figma qua MCP Figma riêng)* màn đã có phương án wireframe `data-chosen` → invoke **`ba-figma-draw push-lofi <màn>`** (nấc 1). Không MCP → bỏ bước này.
   e. Invoke `ba-html-design <màn>` nếu giao diện đổi. Màn **đã đẩy hi-fi lên Figma** (cột `figma` ✅) → Figma là chuẩn: sửa trên Figma rồi `ba-figma-draw pull <màn>`, hoặc dựng lại rồi `push` ngay.
   e2. *(Tùy chọn — dự án dùng Figma)* html-design được duyệt (`ok`) → invoke **`ba-figma-draw push <màn>`** (nấc 2; từ đây Figma là chuẩn giao diện màn, ghi sổ `Ho-so/00-figma-sync.md`).
   f. *(Tùy chọn)* màn **đã có** script E2E → invoke `ba-test-e2e <màn>` để đồng bộ script với `test.md` vừa đổi (bỏ qua thì cột `e2e` phải đánh ⚠️, không được để ✅ giả).
6. Invoke `ba-build` cho các màn đó.
7. Invoke `ba-track refresh`.
8. **Gate cuối:** invoke `ba-review all` → bắt gap truy vết xuyên suốt sau khi thêm chức năng.
9. *(Tùy chọn)* nếu dự án có `docs/Ho-so/portal.html`, invoke `ba-portal` để cổng đọc không bị cũ.
10. Báo tổng kết.

## Lưu ý
- Chức năng trải **≥ 2 màn** → đặc tả các màn qua `ba-batch` (fan-out), không làm tuần tự inline (`conv-gates.md` → "Đội agent" luật 5).
- Màn đã có bị ảnh hưởng: cập nhật, không tạo trùng.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Ranh giới

- Đổi thứ đã chốt → `ba-change-request`; việc kỹ thuật/bug → `ba-task`.
