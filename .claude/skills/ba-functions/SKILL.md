---
name: ba-functions
description: Use when đã có docs/01-requirements.md và cần liệt kê các chức năng chính của App theo module; bước 2, sinh docs/02-functions.md.
---

# ba-functions — Yêu cầu → Danh sách chức năng

## Mục tiêu
Từ `docs/01-requirements.md`, liệt kê các chức năng chính nhóm theo module → `docs/02-functions.md`.

## Quy trình
1. Đọc `conventions.md` của `ba-toolkit` và `docs/01-requirements.md`.
2. **Phân rã chức năng có hệ thống** bằng các kỹ thuật bên dưới (không bóc tách tuỳ hứng).
3. Gán mã `F01`, `F02`... theo `conventions.md`, gom theo module.
4. Viết `docs/02-functions.md` đúng `template.md`. Mỗi chức năng có: mã, tên, mô tả, **Kỹ thuật phân rã**, **trace FR/BR**, **ưu tiên MoSCoW** (Must/Should/Could/Won't), nguồn, trạng thái.
5. Lập **Ma trận CRUD** (thực thể × chức năng) để soát lỗ hổng độ phủ.
5b. **Ma trận phân quyền** (vai trò × chức năng, khi hệ có ≥2 vai trò): mỗi ô ✅/⛔ theo đúng nguồn (FR/BRule/cột Nguồn); **chưa có nguồn → ❓ "chưa chốt", KHÔNG đoán** — skill đặc tả màn sau này chốt rồi quay lại điền. Đây là bảng dev cài guard + stakeholder duyệt phân quyền.
6. Xác nhận với người dùng.

## Kỹ thuật áp dụng
Chọn kỹ thuật theo bản chất yêu cầu nguồn:
- **Functional Decomposition (FD):** vẽ cây top-down — yêu cầu lớn (BR) → nhóm chức năng → chức năng lá `F..`. Dừng phân rã khi một lá đã đủ nhỏ để test/giao việc độc lập. Dùng khi yêu cầu mô tả mục tiêu/quy trình lớn.
- **CRUD Analysis:** với mỗi thực thể nghiệp vụ chính, kiểm chức năng có bao đủ Create / Read / Update / Delete (và List/Search). Dùng để phát hiện chức năng bị bỏ sót (vd có "Thêm sản phẩm" mà quên "Sửa/Xoá").
- **MoSCoW:** xếp ưu tiên mỗi chức năng Must / Should / Could / Won't dựa giá trị nghiệp vụ + ràng buộc, không phải Cao/TB/Thấp.

## Tiêu chí chất lượng (BẮT BUỘC)
- **Truy vết hai chiều:** mỗi `F..` trace về ≥1 `FR`/`BR`; ngược lại mọi `FR` chức năng phải xuất hiện ở ≥1 `F..` (không yêu cầu nào mất tích).
- **CRUD đủ phủ:** ma trận CRUD không để ô trống vô lý — thiếu C/R/U/D ở thực thể nào phải ghi rõ lý do (vd "Đơn hàng không cho Xoá vì luật nghiệp vụ").
- **Chức năng nguyên tử:** mỗi `F..` là một hành động rời, kiểm thử được; cấm gộp nhiều hành động vào một mã (vd "Quản lý người dùng" phải tách Thêm/Sửa/Xoá/Xem).
- Ưu tiên dùng MoSCoW, không dùng Cao/TB/Thấp.

## Lưu ý
- Tiếng Việt. Là đầu vào cho `ba-screens`.
- **Văn phong & Thuật ngữ:** mở rộng từ viết tắt ở lần đầu dùng; thêm footer `## Thuật ngữ` cuối `02-functions.md` và bổ sung thuật ngữ mới (vd thuật ngữ nghiệp vụ/module) vào `docs/Ho-so/00-glossary.md` — xem `conventions.md`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
