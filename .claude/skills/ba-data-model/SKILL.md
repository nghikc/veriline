---
name: ba-data-model
description: Use when cần thiết kế MÔ HÌNH DỮ LIỆU nghiệp vụ cho hệ thống — ERD, từ điển dữ liệu, quan hệ; tài liệu cấp tổng từ chức năng và màn hình, sinh docs/05-data-model.md.
---

# ba-data-model — Mô hình dữ liệu hệ thống

## Mục tiêu
Sinh `docs/05-data-model.md`: danh sách thực thể, sơ đồ quan hệ (ERD), từ điển dữ liệu.

## Quy trình
1. Đọc `conventions.md` của `ba-toolkit`, `docs/02-functions.md`, và các `srs.md` (mục Yêu cầu dữ liệu) để rút thực thể + thuộc tính.
2. Xác định thực thể (danh từ nghiệp vụ), thuộc tính, khoá chính/ngoại, quan hệ với cardinality + optionality (1-1 / 1-n / n-n; bắt buộc/tuỳ chọn); n-n tách qua bảng trung gian.
3. **Chuẩn hoá tới 3NF**: tách bảng để loại dữ liệu lặp/phụ thuộc bắc cầu; phi chuẩn hoá có chủ đích phải ghi rõ lý do.
4. Vẽ ERD bằng Mermaid `erDiagram` — **không đặt ký tự đặc biệt trong tên thực thể/thuộc tính/nhãn quan hệ** (gây lỗi gen ảnh; xem "Sơ đồ Mermaid — an toàn cú pháp" trong `conventions.md`); viết từ điển dữ liệu (mỗi thực thể 1 bảng: thuộc tính, kiểu, ràng buộc, mô tả). Sau khi vẽ, **đối chiếu coverage** (mỗi thực thể có PK, mỗi quan hệ có cardinality, n-n đã tách bảng nối — xem "Kiểm coverage sơ đồ" trong `conventions.md`); ERD ≥ nhiều thực thể/quan hệ → `ba-review diagram docs/05-data-model.md`.
5. Lập **CRUD Matrix** (thực thể × chức năng) để soát thực thể mồ côi / chức năng không có nơi lưu.
6. Viết `docs/05-data-model.md` theo `template.md`.

## Từ SQL DDL → `erDiagram` (khi đã có schema)
Nếu dự án đã có schema (`CREATE TABLE`, migrations, hoặc `ba-reverse` rút được) thì **dựng ERD trực tiếp từ DDL** thay vì suy đoán — ánh xạ dứt khoát:

| Trong SQL DDL | → Mermaid `erDiagram` |
|---|---|
| `CREATE TABLE ten` | một thực thể `TEN { ... }` |
| Cột `col type` | dòng thuộc tính `type col` trong khối thực thể |
| `PRIMARY KEY` | đánh dấu `PK` sau thuộc tính |
| `FOREIGN KEY (a) REFERENCES B(id)` | quan hệ `B ||--o{ TEN : "..."` + đánh `FK` cho cột `a` |
| FK **NOT NULL** vs **NULL** | phía "một" là `||` (bắt buộc) vs `o|` (tuỳ chọn) |
| Bảng nối (chỉ gồm 2 FK) | **không** vẽ thành thực thể độc lập nếu thuần kỹ thuật → thể hiện quan hệ `n-n` giữa 2 bảng gốc |
| `UNIQUE(fk)` trên bảng nối | hạ quan hệ xuống `1-1` |

Cardinality mặc định của FK là **1-n** (`||--o{`); chỉ đổi khi có `UNIQUE`/ràng buộc khác. Tên bảng/cột giữ nguyên từ DDL (không bịa). Sau khi dựng, vẫn chạy CRUD Matrix + kiểm 3NF như thường.

## Tiêu chí chất lượng (BẮT BUỘC)
- **Đạt ≥ 3NF**, hoặc ghi rõ chỗ cố ý phi chuẩn hoá + lý do.
- **Không thực thể mồ côi:** mỗi thực thể trace về ≥1 `F..`; mỗi thực thể có PK; quan hệ ghi đủ cardinality; n-n đã tách bảng nối.
- **Khoá ngoại nhất quán:** mọi FK trỏ tới PK tồn tại; kiểu dữ liệu khớp.
- Mô hình ở mức khái niệm/logic (kiểu tổng quát), không ràng buộc DBMS cụ thể.

## Lưu ý
- Tiếng Việt. Tài liệu cấp tổng, tùy chọn.
- **Văn phong & Thuật ngữ:** mở rộng từ viết tắt ở lần đầu dùng; thêm footer `## Thuật ngữ` cuối `05-data-model.md` + bổ sung thuật ngữ mới vào `docs/Ho-so/00-glossary.md` — xem `conventions.md`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Ranh giới

- Schema vật lý (DBML, kiểu DB, index) → `ba-dbschema`; skill này chỉ mô hình nghiệp vụ.
