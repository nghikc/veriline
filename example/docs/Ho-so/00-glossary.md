# Từ điển thuật ngữ — TeamTasks

> Nguồn chuẩn giải nghĩa thuật ngữ toàn dự án. Mỗi tài liệu còn có footer "## Thuật ngữ" liệt kê riêng các từ dùng trong nó. Khi gặp thuật ngữ mới, thêm vào đây (một dòng = một thuật ngữ).

## 1. Thuật ngữ phương pháp & mã định danh

| Thuật ngữ | Giải thích |
|-----------|-----------|
| BR (Business Requirement) | Yêu cầu nghiệp vụ — mục tiêu/kết quả ở cấp tổ chức |
| StR (Stakeholder Requirement) | Yêu cầu của một nhóm liên quan, truy vết về BR |
| FR (Functional Requirement) | Yêu cầu chức năng — hệ thống phải làm gì |
| NFR (Non-functional Requirement) | Yêu cầu phi chức năng — ràng buộc chất lượng (hiệu năng, bảo mật…), luôn kèm số đo |
| BRule (Business Rule) | Quy tắc nghiệp vụ, tách riêng khỏi FR vì thay đổi độc lập |
| TR (Transition Requirement) | Yêu cầu chuyển đổi tạm thời (di trú dữ liệu, đào tạo, chạy song song) |
| F (Function) | Mã chức năng (F01…), truy vết về FR/BR |
| S (Screen) | Mã màn hình (S01…) |
| R-S | Yêu cầu cấp màn hình (R-S01-01…), truy vết F/FR |
| UC (Use Case) | Ca sử dụng (UC-S01-01…) |
| US (User Story) | Câu chuyện người dùng (US-S01-01…) |
| TC (Test Case) | Ca kiểm thử (TC-S01-01…) |
| MoSCoW | Cách xếp ưu tiên: Must / Should / Could / Won't |
| SMART | Tiêu chí yêu cầu tốt: cụ thể, đo được, khả thi, liên quan, có mốc thời gian |
| BABOK | Khung kiến thức phân tích nghiệp vụ (Business Analysis Body of Knowledge) |
| IEEE 830 | Chuẩn đặc tả yêu cầu phần mềm |
| CRUD | Bốn thao tác dữ liệu: Create / Read / Update / Delete |
| ERD (Entity-Relationship Diagram) | Sơ đồ thực thể — quan hệ |
| PK / FK | Khoá chính (Primary Key) / Khoá ngoại (Foreign Key) |
| 3NF | Dạng chuẩn thứ ba — loại dữ liệu lặp và phụ thuộc bắc cầu |
| REST | Kiểu thiết kế API theo tài nguyên qua phương thức HTTP |
| API (Application Programming Interface) | Giao diện lập trình ứng dụng |
| Endpoint | Một đường dẫn API (phương thức + path) |
| GWT (Given-When-Then) | Cú pháp viết tiêu chí chấp nhận: Bối cảnh — Hành động — Kết quả |
| INVEST | Tiêu chí user story tốt: Independent, Negotiable, Valuable, Estimable, Small, Testable |
| EP / BVA / DT / ST | Kỹ thuật thiết kế test: Equivalence Partitioning / Boundary Value Analysis / Decision Table / State Transition |
| RACI | Ma trận trách nhiệm: Responsible / Accountable / Consulted / Informed |
| Onion Diagram | Sơ đồ phân lớp các bên liên quan theo độ gần giải pháp |
| WCAG AA | Mức tuân thủ tiêu chuẩn tiếp cận web (tương phản text thường ≥ 4.5:1) |
| Design token | Biến thiết kế (màu, cỡ chữ, spacing…) đặt tên theo vai trò |
| Breakpoint | Ngưỡng độ rộng màn hình để đổi bố cục responsive |

## 2. Thuật ngữ nghiệp vụ (đặc thù dự án)

> Các từ nghiệp vụ riêng của TeamTasks.

| Thuật ngữ | Giải thích |
|-----------|-----------|
| Tổ chức (Organization) | Đơn vị làm việc chứa các thành viên và công việc; ranh giới phân quyền dữ liệu |
| Thành viên (Member) | Người dùng thuộc một tổ chức, có vai trò Quản trị viên hoặc Thành viên thường |
| Công việc (Task) | Đầu việc cần thực hiện, có người giao/người nhận, trạng thái và hạn hoàn thành |
| Quản trị viên (Admin) | Vai trò có quyền quản lý thành viên và cấu hình tổ chức |
| Phiên đăng nhập (Session) | Phiên do server cấp sau khi xác thực; revoke khi đăng xuất |
| fail_count | Bộ đếm số lần nhập sai mật khẩu liên tiếp của một tài khoản |
| TEMP_LOCKED / PERM_LOCKED | Trạng thái khoá tạm thời (sau 5 lần sai) / khoá vĩnh viễn của tài khoản |
| Brute force | Tấn công dò mật khẩu bằng cách thử nhiều lần liên tiếp |
| Persona (chân dung người dùng) | Chân dung đại diện cho một nhóm người dùng thật, dùng để thiết kế xoay quanh (`00-personas.md`) |
| User journey (bản đồ hành trình) | Bản đồ các bước + cảm xúc người dùng khi đạt một mục tiêu |
| Pain point (điểm đau) | Điểm khó chịu/cản trở trong trải nghiệm hiện tại của người dùng |
| URD (User Requirements Document) | Tài liệu yêu cầu ở góc nhìn người dùng — personas + journey |
| Tenant | Một tổ chức trong hệ thống nhiều tổ chức; dữ liệu các tenant cách ly nhau (`BR-03`, `NFR-06`) |
| Motion token | Token quy định thời lượng + easing cho một loại chuyển cảnh (`07-design-system.md` §10.1) |
| Denormalization (phi chuẩn hoá) | Cố ý lặp dữ liệu để đổi lấy hiệu năng hoặc an toàn truy vấn |
| Người thực hiện (assignee) | Người được giao làm một công việc — trường `nguoi_nhan_id` của `CongViec` |
| Người giao (creator) | Người tạo và giao công việc — trường `nguoi_giao_id` của `CongViec` |
| Người duyệt | Vai trò Team Lead hoặc Org Admin — người có quyền duyệt, từ chối, huỷ và sửa công việc (`BRule-S03-04`) |
| Trạng thái cuối (terminal state) | Trạng thái không còn chuyển tiếp nào đi ra — ở TeamTasks là Hoàn thành (DONE) và Đã huỷ (CANCELLED) |
| Bất biến (immutable) | Bản ghi đã tạo thì không sửa, không xoá — áp cho bình luận ở giai đoạn 1 (`BRule-S03-07`) |
| Audit trail (dòng thời gian lịch sử) | Chuỗi bản ghi *ai đổi gì lúc nào*, dùng để truy vết trách nhiệm (`LichSuCongViec`) |
| Đua thao tác (race condition) | Hai người cùng thao tác trên một bản ghi; người sau ghi đè hoặc bị hệ thống từ chối |
| Throttle (mạng) | Làm chậm mạng có chủ đích khi kiểm thử, để lộ lỗi nhấn kép hoặc thiếu trạng thái chờ |
