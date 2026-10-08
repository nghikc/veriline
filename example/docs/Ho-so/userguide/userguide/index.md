---
type: userguide-index
scope: product
audience: end-user (Member / Team Lead)
lang: vi
status: done
updated: 2026-07-20
links:
  - docs/00-vision.md
  - docs/01-requirements.md
  - docs/03-overview.md
  - docs/00-glossary.md
---

# Cẩm nang sử dụng TeamTasks — index

> Master metadata của cẩm nang. Giọng "bạn" thân thiện · độ chi tiết Vừa đủ. Mục lục đã qua `ba-manual-reviewer` (revise → đã chỉnh, 0 blocking) + người dùng duyệt 2026-07-20.

## Sections

| # | Trang (slug) | Nhóm | Loại (nội bộ) | Nguồn | Status |
|---|--------------|------|---------------|-------|--------|
| 1 | tong-quan | Tổng quan | explanation | 00-vision, 01-requirements, 03-overview, 00-glossary mục 2 | written |
| 2 | bat-dau-nhanh | Bắt đầu | tutorial | UC-S06-01 → UC-S02-02 (dành cho người lập tổ chức mới) | written |
| 3 | dang-ky-tai-khoan | Hướng dẫn | how-to | UC-S06-01, ngoại lệ S06 | written |
| 4 | dang-nhap-dang-xuat | Hướng dẫn | how-to | UC-S01-01/05/06 | written |
| 5 | theo-doi-cong-viec | Hướng dẫn | how-to | UC-S02-01, BRule-S02-01/02 | written |
| 6 | tao-cong-viec | Hướng dẫn | how-to | UC-S02-02, BRule-S02-03/04/05/06 (điều kiện vai trò đầu trang) | written |
| 7 | xem-thong-bao | Hướng dẫn | how-to | UC-S02-03 | written |
| 8 | tra-cuu-quy-tac | Tra cứu | reference | BRule S01/S02 lọc end-user (diễn đạt trải nghiệm, không JWT) | written |
| 9 | su-co-dang-nhap | Xử lý sự cố | troubleshooting | UC-S01-02/03/04 + 01-requirements Mục 7 (quên mật khẩu) | written |
| 10 | su-co-dang-ky | Xử lý sự cố | troubleshooting | UC-S06-02/03/04/05 | written |
| 11 | su-co-cong-viec-thong-bao | Xử lý sự cố | troubleshooting | UC-S02-01/02/03 ngoại lệ | written |
| 12 | faq | FAQ | faq | 4 câu có nguồn: 01-req §7 · BRule-S02-03 · BRule-S02-01 · BRule-S01-01/03 | written |
| 13 | thuat-ngu | Phụ lục | glossary | 00-glossary mục 2 (dịch đời thường, bỏ fail_count) | written |

## Phạm vi màn
- Viết cho: S01 Login ✅ · S02 Dashboard ⚠️ · S06 Register ⚠️.
- Chưa viết (đúng kế hoạch — bổ sung khi màn hoàn tất): S03 TaskDetail, S04 UserProfile, S05 Organization (gồm luồng mời thành viên).

## Ảnh mockup cần thay (app chưa deploy — chụp lại từ app thật khi phát hành)
| Ảnh | Nguồn mockup | Dùng ở trang |
|-----|--------------|--------------|
| images/dang-nhap.png | Authentication/S01 - Login/html-design.html | dang-nhap-dang-xuat, bat-dau-nhanh |
| images/dang-ky.png | Authentication/S06 - Register/html-design.html | dang-ky-tai-khoan |
| images/dashboard.png | S02 - Dashboard/html-design.html | theo-doi-cong-viec, tao-cong-viec |

## Open Questions
*(cập nhật ở bước gom OQ)*
