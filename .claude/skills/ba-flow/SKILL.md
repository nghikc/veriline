---
name: ba-flow
description: Use when cần LUỒNG NGHIỆP VỤ + DANH SÁCH MÀN SƠ BỘ từ ý tưởng thô, TRƯỚC khi có 01-requirements — đầu vào dựng prototype; sinh docs/Ho-so/00-flows.md. Bước 2 của ba-proto-first.
---

# ba-flow — Luồng nghiệp vụ + màn sơ bộ (trước khi có yêu cầu)

## Mục tiêu
Trả lời **"người dùng đi qua những màn nào để xong việc"** khi dự án **chưa có** `01-requirements.md`/`02-functions.md`. Đây là mảnh khoá của luồng **prototype-trước**: muốn vẽ prototype thì phải biết có màn gì và bấm đi đâu, mà chuỗi xuôi lại bắt viết yêu cầu xong mới suy ra màn.

Ranh giới với skill gần — **không cái nào thay được cái nào**:

| Skill | Trả lời | Khi nào |
|---|---|---|
| `ba-process` | quy trình **tổ chức** AS-IS/TO-BE (ai làm gì, thủ công hay máy) | số hoá quy trình đang chạy tay |
| `ba-persona` | hành trình theo **cảm xúc** của một chân dung | hiểu người dùng |
| **`ba-flow`** | **luồng qua MÀN HÌNH** + danh sách `S..` **tạm** | trước khi dựng prototype |
| `ba-screens` | `03-overview.md` **chính thức** (mã `S..` baseline) | sau khi đã có `02-functions.md` |
| `ba-sitemap` | trang cho người dùng cuối đọc | sau khi màn đã có wireframe |

**Mã `S..` ở đây là TẠM.** Baseline vẫn do `ba-screens` cấp ở bước 6 của `ba-proto-first`. Ghi rõ điều đó trong file, không ai được trace vào mã tạm.

## Điều kiện
Có ý tưởng thô, hoặc `Ho-so/00-brainstorm.md`/`00-intake.md`/`00-vision.md` nếu đã chạy. **Không** đòi `01`/`02`/`03` — đó là lý do skill này tồn tại.

## Quy trình
1. Đọc `conventions.md` của `ba-toolkit`; `Ho-so/00-brainstorm.md`, `00-intake.md`, `00-vision.md`, `00-personas.md` — cái nào có.
2. Rút **vai trò** (ai dùng) và **việc cần xong** (job) của mỗi vai trò. Không có dữ liệu thì **hỏi**, đừng bịa vai trò.
3. Với mỗi việc: dựng **một luồng** = chuỗi bước, mỗi bước gắn một màn. Luồng ≥2 vai trò có bàn giao → vẽ **`swimlane-beta`** (`conv-mermaid.md` → "Luật ưu tiên vai trò"), 1 vai trò → `flowchart`.
4. Gom mọi màn xuất hiện → **bảng màn sơ bộ**: `mã S tạm · tên · vai trò dùng · việc nó phục vụ · ghi chú`.
5. Vẽ **sơ đồ điều hướng** giữa các màn, mỗi cạnh có **nhãn hành động** (`S01 -->|Đăng nhập thành công| S02`) — `ba-proto-html` đọc đúng nhãn này để nối nút bấm.
6. Ghi `docs/Ho-so/00-flows.md` theo `template.md` (cùng thư mục).
7. **Vòng "Xác nhận giả định"** (`conventions.md`) cho mọi chỗ phải đoán.

## Điểm dừng (KHÔNG bịa)
- Không suy ra được **≥1 luồng có kết thúc rõ** → dừng, hỏi người dùng việc chính của hệ thống là gì.
- Vai trò/quyền không rõ → ghi `GĐ-..` `⚠️ chưa xác nhận`, **không** tự đặt ra vai trò mới.
- Màn không nối vào luồng nào → giữ lại nhưng đánh dấu **màn mồ côi**, nêu ở cuối file để người dùng quyết bỏ hay bổ sung luồng.

## Đầu ra
`docs/Ho-so/00-flows.md`. **Không** tạo folder màn, **không** đụng `00-tracking.md` — hai thứ đó là việc của `ba-screens` sau khi nghiệp vụ đã chốt.

## Lưu ý
- Tiếng Việt. Sơ đồ Mermaid theo `conv-mermaid.md`.
- **Hồ sơ dự án** (`conv-gates.md` → "Hồ sơ dự án"): skill này **không đổi theo hồ sơ** — nó sinh đúng 1 file ở mọi mức `full`/`lite`/`mini`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
