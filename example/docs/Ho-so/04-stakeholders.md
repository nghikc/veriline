# Phân tích các bên liên quan — TeamTasks

## 1. Danh bạ stakeholder

| ID | Bên liên quan | Vai trò trong dự án | Kỳ vọng | Ảnh hưởng | Trace StR |
|----|---------------|---------------------|---------|-----------|-----------|
| SH-01 | Org Admin (Quản trị viên tổ chức) | Người dùng cuối cấp cao nhất; tài trợ nội bộ | Hệ thống kiểm soát truy cập chặt chẽ; có thể quản lý thành viên độc lập; không cần hỗ trợ kỹ thuật thường xuyên | Cao | StR-03, StR-05 |
| SH-02 | Team Lead (Quản lý nhóm) | Người dùng chính; người giao việc | Dashboard hiển thị tiến độ nhóm nhanh; tạo và giao việc không quá 3 bước; duyệt công việc khi cần | Cao | StR-02, StR-05 |
| SH-03 | Member (Thành viên) | Người dùng cuối phổ biến nhất | Dễ cập nhật trạng thái; thông báo kịp thời nhưng không làm phiền; giao diện đơn giản | Trung bình | StR-01, StR-04 |
| SH-04 | IT/DevOps | Triển khai và vận hành hệ thống | Tài liệu API đầy đủ; cấu hình qua biến môi trường; log lỗi rõ ràng | Trung bình | — |
| SH-05 | Ban lãnh đạo tổ chức | Nhà tài trợ, không dùng trực tiếp | Giảm thời gian họp báo cáo trạng thái; dashboard có thể xuất báo cáo | Cao | BR-04 |
| SH-06 | Nhóm BA/PM (nội bộ dự án) | Chủ sở hữu yêu cầu và tài liệu | Yêu cầu rõ ràng, truy vết được; quy trình phê duyệt minh bạch | Thấp | — |

## 2. Ma trận Quyền lực / Quan tâm

Điền ID stakeholder vào ô phù hợp.

| | Quan tâm THẤP | Quan tâm CAO |
|---|---|---|
| **Quyền lực CAO** | Giữ hài lòng: SH-05 (Ban lãnh đạo — ít dùng trực tiếp nhưng phê duyệt ngân sách) | Quản lý sát: SH-01 (Org Admin), SH-02 (Team Lead) |
| **Quyền lực THẤP** | Theo dõi: SH-06 (BA/PM nội bộ) | Thông tin đầy đủ: SH-03 (Member), SH-04 (IT/DevOps) |

## 3. Ma trận RACI

R = Thực hiện · A = Chịu trách nhiệm cuối · C = Tham vấn · I = Thông báo

| Hạng mục / Quyết định | SH-01 (Org Admin) | SH-02 (Team Lead) | SH-03 (Member) | SH-04 (IT) | SH-05 (Ban LD) | SH-06 (BA/PM) |
|-----------------------|-------------------|-------------------|----------------|------------|----------------|----------------|
| Phê duyệt phạm vi MVP | R | C | I | I | **A** | R |
| Thiết kế phân quyền (role/permission) | C | C | I | I | — | A/R |
| Quy trình khoá tài khoản (brute force) | C | I | — | C | — | A/R |
| Thiết kế luồng thông báo | I | C | C | I | — | A/R |
| Quản lý thành viên tổ chức | **R/A** | C | I | — | — | — |
| Deploy lên môi trường production | I | I | — | R/A | I | I |
| Kiểm thử UAT | C | R | R | C | — | A |
| Ra mắt chính thức | **A** | C | I | C | C | R |

> **Luật RACI (chốt 2026-07-21):** mỗi hàng có **đúng một chữ A**. Phân vai đã sửa: *Phê duyệt phạm vi MVP* → **A = SH-05 (Ban lãnh đạo)** vì đây là bên duyệt ngân sách và chịu trách nhiệm cuối về phạm vi; SH-01 chuyển thành `R` (đề xuất & thực thi). *Ra mắt chính thức* → **A = SH-01 (Org Admin)** — quyết định vận hành, SH-05 chỉ tham vấn. *Quản lý thành viên tổ chức* trước đây **không có A** → gán **R/A = SH-01**.
> **Hệ quả:** `OQ-02` của biên bản họp 2026-07-21 (*"ai duyệt `CR-01`?"*) **đã có lời giải — SH-05**, vì mở rộng phạm vi thuộc hàng "Phê duyệt phạm vi MVP".

## 4. Kế hoạch giao tiếp

| Bên liên quan | Nội dung trao đổi | Kênh | Tần suất |
|---------------|-------------------|------|----------|
| SH-01, SH-02 | Demo sprint, thu thập phản hồi, xác nhận yêu cầu | Họp trực tuyến (Google Meet) | Mỗi 2 tuần (cuối sprint) |
| SH-05 | Báo cáo tiến độ tổng thể, milestone, rủi ro | Email + slide tóm tắt | Hàng tháng |
| SH-03 | Hướng dẫn sử dụng, thông báo release mới | Email + in-app banner | Khi có release mới |
| SH-04 | Tài liệu API, hướng dẫn deploy, cấu hình môi trường | Confluence / tài liệu kỹ thuật | Khi có thay đổi hạ tầng |
| SH-06 | Review yêu cầu, phê duyệt tài liệu BA | Slack + Google Docs | Hàng tuần |

## Thuật ngữ
| Thuật ngữ | Giải thích |
|---|---|
| SH (Stakeholder) | Bên liên quan — cá nhân/nhóm chịu ảnh hưởng hoặc ảnh hưởng tới dự án |
| RACI | Bảng phân vai: R = Thực hiện · A = Chịu trách nhiệm cuối · C = Tham vấn · I = Thông báo |
| Ma trận Power/Interest | Xếp bên liên quan theo quyền lực × mức quan tâm để chọn cách giao tiếp |
| StR (Stakeholder Requirement) | Yêu cầu ở góc nhìn một bên liên quan |
| Mức tham gia | Mức độ bên liên quan tham gia dự án: hiện tại vs mong muốn |

> Từ điển đầy đủ toàn dự án: `docs/00-glossary.md`.
