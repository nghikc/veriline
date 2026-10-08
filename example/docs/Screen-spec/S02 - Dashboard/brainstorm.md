# Brainstorm — Dashboard

## Mục đích màn hình
Người dùng (Member / Team Lead / Org Admin) vào đây ngay sau đăng nhập để:
1. Nắm nhanh tình hình công việc qua thẻ thống kê (tổng, cần làm, đang làm, hoàn thành, quá hạn).
2. Xem danh sách công việc theo trạng thái và mở chi tiết từng việc.
3. Tạo công việc mới (Team Lead / Org Admin) ngay từ đây — luồng "tạo và giao việc" phải ≤ 3 bước (NFR-05).
4. Nhận biết và đọc thông báo in-app qua badge chuông trên header.

## Thành phần & hành vi
- **Header** → logo (click = về Dashboard), chuông thông báo + badge số chưa đọc, avatar menu (Hồ sơ cá nhân / Tổ chức (chỉ Team Lead & Org Admin) / Đăng xuất).
- **Thẻ thống kê (5 thẻ)** → Tổng · Cần làm (TODO) · Đang làm (IN_PROGRESS) · Hoàn thành (DONE) · Quá hạn; click 1 thẻ = lọc danh sách bên dưới theo trạng thái đó.
- **Bộ lọc + tìm kiếm** → lọc theo trạng thái, ưu tiên; ô tìm theo tiêu đề.
- **Danh sách công việc** → mỗi dòng: tiêu đề, người thực hiện (avatar + tên), deadline (đỏ nếu quá hạn), badge trạng thái, badge ưu tiên; click dòng → mở S03 Chi tiết công việc.
- **Nút "+ Tạo công việc"** (chỉ Team Lead / Org Admin) → mở modal: Tiêu đề, Mô tả, Người thực hiện (chọn thành viên ACTIVE cùng tổ chức), Deadline, Ưu tiên (mặc định Trung bình) → Lưu → toast thành công + công việc xuất hiện đầu danh sách + thông báo cho người được giao.
- **Panel thông báo** → click chuông mở panel dropdown: danh sách thông báo mới → cũ, dòng chưa đọc nền nhấn; click 1 thông báo = đánh dấu đã đọc + điều hướng tới công việc liên quan; nút "Đánh dấu tất cả đã đọc".

## Phạm vi dữ liệu theo vai trò
- **Member:** thấy công việc mình là người thực hiện hoặc người giao.
- **Team Lead / Org Admin:** thấy toàn bộ công việc của tổ chức.
- Mọi truy vấn giới hạn trong tổ chức của người dùng (multi-tenant, NFR-06).

## Trạng thái & edge case
- **Loading:** skeleton cho thẻ thống kê + danh sách.
- **Rỗng:** chưa có công việc nào → empty state + (Team Lead/Admin) gợi ý nút tạo việc đầu tiên.
- **Lỗi:** API lỗi → thông báo + nút "Thử lại"; tạo việc thất bại → giữ nguyên dữ liệu đã nhập trong modal.
- **Không có quyền:** Member không thấy nút "+ Tạo công việc"; mục "Tổ chức" ẩn trong menu.
- **Quá hạn:** deadline < hiện tại và trạng thái ∉ {DONE, CANCELLED} → đếm vào thẻ Quá hạn, deadline tô đỏ.
- **Badge > 99:** hiển thị "99+".
- **Mất mạng khi tạo việc:** modal giữ dữ liệu, hiện "Lỗi kết nối — thử lại".

## Câu hỏi mở
- Thông báo cập nhật theo **polling 60 giây** (giả định cho giai đoạn 1, không real-time WebSocket) — cần xác nhận.
- Danh sách công việc phân trang 20 dòng/lần (giả định) — cần xác nhận.
- Thẻ thống kê tính theo phạm vi vai trò (Member = việc của mình; Lead/Admin = cả tổ chức) — đã giả định như trên, cần xác nhận với stakeholder.
