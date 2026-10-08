# Rule: IT-BA framing

**Nguyên tắc cốt lõi:** Brainstorm ở tầng **nghiệp vụ**, không quyết định kỹ thuật. Việc kỹ thuật để bước build (superpowers) lo.

## CẤM hỏi / quyết định ở đây
- Tên cột, tên bảng, schema cơ sở dữ liệu.
- Tên hàm, tên service, tên class.
- API endpoint, phương thức HTTP, định dạng request/response.
- JWT vs session, cookie vs token.
- Chọn thư viện / SDK / framework / hạ tầng cụ thể.

## THAY VÀO ĐÓ hỏi nghiệp vụ
| Thay vì hỏi (kỹ thuật) | Hãy hỏi (nghiệp vụ) |
|---|---|
| "Lưu cột nào, kiểu gì?" | "Cần lưu **loại thông tin** nào?" (email, trạng thái, ngày tạo) |
| "Gọi API nào, tích hợp ra sao?" | "Cần **gọi dịch vụ** nào?" (Google, Stripe — chỉ tên + mục đích) |
| "Dùng JWT hay session?" | "Người dùng cần **đăng nhập lại** khi nào?" |
| "Hàm xử lý thế nào?" | "Hệ thống **làm gì** ở bước này?" (validate, gửi email, tính phí) |

## Quy ước
- Chủ thể mặc định khi chưa rõ: `current_user` (người dùng hiện tại).
- Khi tóm tắt/trình bày: dùng từ nghiệp vụ (luồng, bảng, hình minh họa, số liệu cụ thể, wording mẫu). Tránh thuật ngữ dev (flag, endpoint, schema).
