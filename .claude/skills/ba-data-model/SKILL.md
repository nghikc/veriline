---
name: ba-data-model
description: Use when cần thiết kế MÔ HÌNH DỮ LIỆU nghiệp vụ — ERD, từ điển dữ liệu, quan hệ → docs/05-data-model.md; chế độ `dbml` chuyển mô hình thành SCHEMA VẬT LÝ cho dev (schema.dbml — kiểu DB, khoá, enum, index).
---

# ba-data-model — Mô hình dữ liệu hệ thống

## Chế độ
| Gọi | Làm gì |
|---|---|
| `ba-data-model` | **Mô hình dữ liệu nghiệp vụ** (không đối số) — thực thể, ERD, từ điển dữ liệu → `docs/05-data-model.md`. Chạy ở mọi phạm vi |
| `ba-data-model dbml` | **Schema vật lý cho dev** — kiểu DB thật, khoá, enum, index → `docs/Ho-so/dbschema/schema.dbml` (trước là `ba-dbschema`). Cần dev: phạm vi `docs` → từ chối |

Đối số đầu là `dbml` → nhảy thẳng tới mục "Chế độ `dbml`" ở cuối file, **không** chạy Quy trình mô hình nghiệp vụ.

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

- Không đối số chỉ mô hình **nghiệp vụ** (kiểu tổng quát); schema vật lý (DBML, kiểu DB, index) là chế độ `dbml` bên dưới.
- Chọn hệ quản trị CSDL, một DB hay nhiều → `ba-architecture` (ADR); chế độ `dbml` chỉ đọc quyết định đó.
- Migration, model, repository (code) → `ba-build` / `dev-run`.

## Chế độ `dbml` — Schema vật lý từ mô hình nghiệp vụ
**Đọc `references/dbml.md` trước khi chạy** — đủ quy trình 7 bước, bảng ánh xạ kiểu, điểm dừng. Tóm tắt:
- **Phạm vi dự án** (đọc bằng `node .claude/skills/ba-toolkit/scripts/profile.js docs`, `conv-gates.md` → "Hồ sơ dự án" → "Phạm vi"): **`Phạm vi: docs` → TỪ CHỐI chế độ dbml** — schema vật lý là bàn giao cho dev trong repo này, dự án chỉ tài liệu không có migration để nó đỡ. Báo và dừng, gợi `ba-data-model` (mô hình nghiệp vụ — đội build tự dựng schema từ đó) · `ba-architecture` (chốt hệ CSDL cho đội build).
- **Điều kiện (CHẶN):** `docs/05-data-model.md` phải có mục "Từ điển dữ liệu" với ≥1 `### Thực thể:`. Thiếu → DỪNG, chạy `ba-data-model` (không đối số) trước. Không suy schema từ mỗi ERD.
- Hệ quản trị CSDL lấy từ ADR trong `docs/10-architecture.md`; chưa chốt → hỏi, đừng mặc định Postgres.
- Kiểm kê cơ giới (0 token): `node .claude/skills/ba-data-model/scripts/scan-model.js docs --plain` — xử hết 4 cảnh báo (thiếu PK · FK trỏ thực thể lạ · enum không liệt kê giá trị · thuộc tính không rõ ràng buộc) **trước** khi sinh; enum/độ dài không rõ → hỏi, không bịa (`text` + ghi chú thay vì `varchar(255)`).
- Ghi **bảng ánh xạ kiểu** ở đầu file schema (tiền → `numeric(p,s)`, không float); **mỗi index có lý do** (bộ lọc ở `srs.md`, FK, cột duy nhất) — không nêu được truy vấn nào dùng → đừng thêm.
- Sinh `docs/Ho-so/dbschema/schema.dbml` (mỗi thực thể một `Table` + `Note` nghiệp vụ, `Ref` cho mọi FK, `Enum` cho mọi enum); tên bảng/cột giữ nguyên như `05-data-model.md`. Thiếu bảng nối n-n → sửa `05-data-model.md` trước, đừng thêm lặng lẽ ở schema.
- Chạy `node .claude/skills/ba-data-model/scripts/check-dbml.js docs` → sửa hết lỗi rồi mới báo xong (`ba-review` cũng gọi checker này khi có `schema.dbml`). Báo cáo: số bảng/cột · index kèm lý do · danh sách chỗ đã phải quyết thay.
- Đổi mô hình sau khi schema đã chốt → `ba-change-request`, rồi chạy lại `ba-data-model dbml`. Chạy ở cả hồ sơ `full`/`lite`/`mini`.
- **Xong → chạy `ba-next`.**
