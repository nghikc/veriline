---
name: ba-api-spec
description: Use when cần đặc tả API của chính hệ thống — danh sách endpoint, request/response, mã trạng thái; tài liệu cấp tổng từ chức năng, màn hình, mô hình dữ liệu; sinh docs/06-api-spec.md.
---

# ba-api-spec — Đặc tả API hệ thống

## Mục tiêu
Sinh `docs/06-api-spec.md`: bảng tổng endpoint + chi tiết request/response từng endpoint.

## Quy trình
1. Đọc `conventions.md` của `ba-toolkit`, `docs/02-functions.md`, các `srs.md`, và `docs/05-data-model.md` nếu có.
2. **Suy ra endpoint có hệ thống** theo tài nguyên (REST: danh từ số nhiều + HTTP method, không động từ trong path; hành động ngoài CRUD như đăng nhập/duyệt đặt endpoint riêng theo use case) — không đặt endpoint tuỳ hứng.
3. Lập **Ma trận CRUD-to-Endpoint** (thực thể × thao tác) để soát độ phủ.
4. Mỗi endpoint ghi: method, path, mô tả, tham số/đường dẫn, request body, response, mã trạng thái, trace `F..`.
5. Định nghĩa **Error/Response envelope chuẩn** dùng chung cho mọi endpoint.
6. Viết `docs/06-api-spec.md` theo `template.md`.

## Tiêu chí chất lượng (BẮT BUỘC)
- **Trace đầy đủ:** mỗi endpoint trace về ≥1 chức năng `F..`; ngược lại mỗi thực thể CRUD trong data model phải có endpoint tương ứng (hoặc ghi rõ lý do không expose).
- **Path theo tài nguyên:** không động từ trong path; không trùng lặp ngữ nghĩa method (vd cấm `POST /tasks/delete`).
- **Nhất quán response/lỗi:** mọi endpoint dùng chung error envelope; mỗi endpoint liệt kê đủ mã trạng thái thành công + lỗi có thể xảy ra.
- Tên trường giữ tiếng Anh; mô tả tiếng Việt. Tài liệu cấp tổng, tùy chọn.

## Lưu ý
- **Văn phong & Thuật ngữ:** mở rộng từ viết tắt ở lần đầu dùng; thêm footer `## Thuật ngữ` cuối `06-api-spec.md` + bổ sung thuật ngữ mới vào `docs/Ho-so/00-glossary.md` — xem `conventions.md`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Ranh giới

- API của đối tác/hệ ngoài mà hệ thống tiêu thụ → `ba-api-integration`; kiểm thử API → `ba-api-test`.
