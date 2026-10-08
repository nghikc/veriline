---
name: ba-api-test
description: Use when cần KIỂM THỬ API — outline ACL-.. theo endpoint (happy path, mã lỗi, phân quyền, biên), dừng chờ duyệt, rồi sinh api.http bắn được. Chỉ outline — `ba-api-test checklist`.
---

# ba-api-test — Kiểm thử API: outline duyệt → file bắn được

Toolkit đặc tả API rất kỹ (`ba-api-spec` cả chế độ `partner`, `ba-integration`) nhưng **không có gì kiểm chứng API chạy đúng** — `ba-test-e2e` chỉ bắn qua giao diện. Skill này mở tầng test API.

**Hai bước, một skill.** Trước 09/09/2026 đây là hai skill (`ba-api-checklist` → `ba-api-test`). Chúng luôn chạy nối đuôi, ghi vào **cùng một thư mục**, và mã `ATC-..` **chỉ có nghĩa khi trace về `ACL-..`** của bước trước — nên bước 2 không bao giờ chạy một mình được. Tách làm hai chỉ tạo ra một thứ tự mà không gì bắt buộc: người dùng gọi thẳng `ba-api-test` là bỏ qua vòng duyệt outline. Gộp lại thì **HARD STOP nằm ngay giữa skill**, không thể đi vòng.

| Cách gọi | Chạy tới đâu |
|---|---|
| `ba-api-test` *(mặc định)* | GĐ1 outline → **HARD STOP duyệt** → GĐ2 sinh `api.http` |
| `ba-api-test checklist` | **chỉ GĐ1** — dựng outline rồi dừng, để BA/QC duyệt trong một phiên riêng |

Đây là đối xứng của `ba-test-e2e`: `ba-test-e2e` → `e2e/tests/*.spec.ts` ở tầng **giao diện**; skill này → `api.http` ở tầng **API**.

Ranh giới:

| Skill | Soi cái gì |
|---|---|
| `ba-test checklist` | checklist kiểm thử **một MÀN HÌNH** (`CL-S..`) |
| **`ba-api-test`** | kiểm thử **API** (`ACL-..` → `ATC-..`) — không qua giao diện |
| `ba-test` / `ba-test-e2e` | ca chi tiết + script Playwright **qua giao diện** |

## Điều kiện (CHẶN nếu thiếu)
Có `docs/06-api-spec.md` **hoặc** `docs/12-api-integration.md`. Không có cả hai → **DỪNG**, route `ba-api-spec` / `ba-api-spec partner`. Không bịa endpoint.

## GĐ1 — Outline `ACL-..` (để duyệt)

Vì sao outline trước: viết thẳng ca chi tiết thì người review phải đọc 200 dòng request/response mới biết **thiếu ca nào**. Outline một trang thì thấy ngay lỗ hổng.

1. Đọc `conventions.md` của `ba-toolkit`.
2. **Chạy script (cơ giới, 0 token):**
   ```bash
   node .claude/skills/ba-api-test/scripts/scan-api.js docs --plain
   ```
   Script trả: danh sách endpoint · mã trạng thái mỗi cái khai · trace `F..`/`EXT-..` · và **ba cảnh báo** phải xử trước khi viết checklist:
   - **endpoint khai ở bảng tổng nhưng không có mục chi tiết** → không có request/response/mã lỗi để dựa vào. **Viết checklist cho nó là bịa.** Ghi vào mục "Chưa đủ đặc tả", đừng đoán.
   - **endpoint không khai mã lỗi nào** → không có gốc viết ca negative; hỏi hoặc ghi `⚠️`.
   - **endpoint không trace `F..`/`EXT-..`** → API mồ côi, hỏi lại.
3. Với **mỗi endpoint có đủ đặc tả**, sinh mục `ACL-..` gồm bốn nhóm — nhóm nào không áp dụng thì ghi "Không áp dụng" **kèm lý do**, đừng bỏ trống:
   - **Happy path** — gọi đúng, nhận đúng mã thành công và đúng hình dạng dữ liệu.
   - **Mã lỗi** — **một dòng cho MỖI mã ≥400 khai trong đặc tả**. Đây là chỗ script đã đếm sẵn; thiếu dòng nào là thiếu độ phủ đo được.
   - **Phân quyền** — endpoint cần auth: gọi không token · token hết hạn · token đúng nhưng sai vai trò.
   - **Biên dữ liệu** — trường bắt buộc thiếu, vượt độ dài, sai kiểu, giá trị ngoài enum (lấy từ ràng buộc trong đặc tả).
4. **API đối tác (`12-api-integration.md`) tách nhóm riêng** và đổi trọng tâm: không test hành vi của họ (mình không sở hữu), mà test **hợp đồng** — đúng field mình cần, đúng mã lỗi mình phải xử, và **retry/idempotency/timeout** phía mình. Ghi rõ ca nào **không bắn thật được** (đối tác không có sandbox) → đánh dấu `Mô phỏng`.
5. Ghi `docs/Ho-so/api-test/checklist.md` theo `assets/template.md` (cùng skill này).
6. Báo cáo: số endpoint đã phủ / tổng · số `ACL` mỗi nhóm · danh sách endpoint **chưa đủ đặc tả** để người dùng quyết.

> **HARD STOP.** Trình outline rồi **chờ duyệt** trước khi sang GĐ2. Gọi `ba-api-test checklist` thì dừng hẳn ở đây. Đây là điểm dừng mà việc tách hai skill trước kia **không** ép được.

### Điểm dừng GĐ1 (KHÔNG bịa)
- Endpoint chỉ có tên ở bảng tổng → **không** viết ca cho nó.
- Đặc tả không nói mã lỗi → **không** tự nghĩ ra `404`/`409`; hỏi.
- Không rõ vai trò nào được gọi → ghi `⚠️ chưa xác nhận`, chạy vòng "Xác nhận giả định".

## GĐ2 — Sinh `api.http` bắn được

Biến `checklist.md` (mã `ACL-..`) thành **file bắn được thật**: `docs/Ho-so/api-test/api.http`. Định dạng REST Client — **một file văn bản thuần**, không cài app, diff git đọc được, chạy bằng VS Code/JetBrains hoặc `curl`.

1. Đọc `conventions.md`, `docs/Ho-so/api-test/checklist.md`, `docs/06-api-spec.md` (+ `12-api-integration.md` nếu có).
2. Sinh `docs/Ho-so/api-test/api.http`:
   - **Khối biến ở đầu file** — `@baseUrl`, `@email`, `@matKhau`, `@token`. **Không hardcode** tài khoản/khoá thật vào file; giá trị nhạy cảm để trống kèm chú thích *"điền khi chạy, KHÔNG commit"*.
   - **Mỗi ca một khối `###`**, tiêu đề mang **nguyên mã** `ATC-..` + mã `ACL-..` nó phủ:
     ```
     ### ATC-03 · Sai mật khẩu → 401 (ACL-03)
     POST {{baseUrl}}/auth/login
     Content-Type: application/json

     { "email": "{{email}}", "password": "sai-mat-khau" }
     ```
   - **Ca cần đăng nhập trước** → đặt sau ca lấy token và dùng `{{token}}`; ghi rõ thứ tự phụ thuộc trong chú thích.
   - **Ca `Mô phỏng`** (đối tác không có sandbox) → vẫn viết khối, nhưng đánh dấu `# MÔ PHỎNG — không bắn thật` và ghi cách kiểm thay thế.
3. Chạy `node .claude/skills/ba-api-test/scripts/check-http.js docs` → sửa hết lỗi rồi mới báo xong.
4. Cập nhật `checklist.md`: cột trạng thái mỗi `ACL` ghi mã `ATC` đã phủ.

## Luật cứng của file (script soát)
- **Mọi `ACL` trong checklist có ≥1 `ATC` phủ** — thiếu là độ phủ hụt, đo được.
- **Mọi `ATC` trace ngược về một `ACL` có thật** — ca không có gốc = ca tự nghĩ ra.
- **Mã `ATC` không trùng**.
- **Không có bí mật trong file**: không token/mật khẩu thật, không `Authorization: Bearer ey...` viết cứng. File này **được commit**, nên lộ khoá ở đây là lộ vào lịch sử git.
- Mỗi khối có **method + URL dùng `{{baseUrl}}`**, không host cứng.

## Điểm dừng GĐ2
- `ACL` mô tả mơ hồ ("kiểm tra hoạt động đúng") → hỏi lại, đừng tự đoán mã trạng thái kỳ vọng.
- Endpoint nằm trong mục "Chưa đủ đặc tả" của checklist → **bỏ qua**, không sinh ca.

## Đầu ra
`docs/Ho-so/api-test/api.http` + báo cáo: số `ATC` · độ phủ `ACL` · ca `Mô phỏng` · kết quả `check-http.js`.

## Lưu ý
- Tiếng Việt. **Hồ sơ dự án** (`conv-gates.md` → "Hồ sơ dự án"): chạy ở cả `full`/`lite`/`mini` — kiểm thử là chất lượng, không phải lớp quản trị.
- File `.http` là **đặc tả ca test**, không phải báo cáo kết quả. Chạy thật và ghi kết quả là việc của QA/CI.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
