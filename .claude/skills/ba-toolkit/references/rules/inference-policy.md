# Rule: Chính sách suy luận & độ tin cậy

## Phân loại độ tin cậy
| Tài liệu | Nguồn từ code | Độ tin cậy |
|----------|---------------|-----------|
| `05-data-model.md` | models / schema / migrations | **CAO** — rút trực tiếp |
| `06-api-spec.md` | route handlers | **CAO** |
| `03-overview.md` + folder màn | router / pages | **CAO** (cấu trúc) |
| `02-functions.md` | module / feature | **TRUNG BÌNH** — suy từ tổ chức code |
| `01-requirements.md` (BR/StR/FR/NFR) | suy từ chức năng | **THẤP** — code không chứa ý định nghiệp vụ |
| `srs`/`usecase`/`userstory` per màn | hành vi component | **THẤP–TB** |
| `test.md` | hành vi suy luận | **THẤP** |

## Banner bắt buộc cho tài liệu THẤP / TRUNG BÌNH
Chèn ở **đầu file**:

> 🔶 **Suy luận từ code — cần người xác nhận.** Nội dung dưới đây được suy ra từ mã nguồn, không phải từ yêu cầu nghiệp vụ gốc. Hãy rà soát và chỉnh trước khi dùng.

## Nguyên tắc
- Không bịa business need / giá trị nếu code không gợi ý → để `<cần xác nhận>` và đưa vào Open Questions.
- Tài liệu độ tin cậy CAO **không** cần banner.
- Ghi rõ giả định đã dùng khi map không chắc chắn.
- Giữ truy vết: cố gắng gắn endpoint/màn/thực thể về chức năng `F..` như pipeline xuôi.
