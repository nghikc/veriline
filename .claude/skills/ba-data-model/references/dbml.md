# `ba-data-model dbml` — Từ mô hình nghiệp vụ xuống schema vật lý

> Chi tiết của chế độ `dbml` (`SKILL.md` → "Chế độ `dbml`"). Trước là skill `ba-dbschema`.

## Mục tiêu
`ba-data-model` (không đối số) dừng ở tầng **nghiệp vụ**: thực thể, thuộc tính, kiểu mô tả bằng lời (*"chuỗi (UUID)"*, *"enum"*, *"tuỳ chọn"*). Dev cần tầng **vật lý**: `uuid` hay `varchar(36)`, `timestamptz` hay `datetime`, index ở cột nào, enum khai kiểu gì. Khoảng trống đó hiện đang được lấp bằng **mỗi dev đoán một kiểu**.

Chế độ này sinh `schema.dbml` — mở trên [dbdiagram.io](https://dbdiagram.io) ra sơ đồ, và là **bản để review trước khi ai đó gõ migration**.

Ranh giới:

| Skill | Tầng | Ra cái gì |
|---|---|---|
| `ba-data-model` | **nghiệp vụ** | thực thể · quan hệ · từ điển dữ liệu (`05-data-model.md`) |
| **`ba-data-model dbml`** | **vật lý** | kiểu DB thật · khoá · index · enum (`schema.dbml`) |
| `ba-build` / `dev-run` | **code** | migration, model, repository |

**Không phải nơi quyết định kiến trúc lưu trữ.** Chọn Postgres hay MySQL, một DB hay nhiều — đó là `ba-architecture` (ADR). Chế độ này **đọc quyết định đó** và sinh schema theo đúng nó.

## Điều kiện (CHẶN nếu thiếu)
`docs/05-data-model.md` phải có mục **"Từ điển dữ liệu"** với ít nhất một `### Thực thể:`. Thiếu → **DỪNG**, route `ba-data-model` (không đối số). Không suy schema từ mỗi ERD: ERD không có ràng buộc, độ dài, giá trị enum.

## Quy trình
1. Đọc `conventions.md`; `docs/10-architecture.md` nếu có — **lấy hệ quản trị CSDL đã chốt trong ADR**. Chưa chốt → hỏi, đừng mặc định Postgres.
2. **Chạy script (cơ giới, 0 token):**
   ```bash
   node .claude/skills/ba-data-model/scripts/scan-model.js docs --plain
   ```
   Trả về thực thể · thuộc tính · PK/FK/enum, kèm bốn cảnh báo phải xử **trước** khi sinh schema:
   - **thực thể không có PK** → không dựng bảng được, hỏi.
   - **FK trỏ tới thực thể lạ** → mô hình gãy, sửa `05-data-model.md` trước.
   - **enum không liệt kê giá trị** → không khai enum được; hỏi, **đừng tự nghĩ ra giá trị**.
   - **thuộc tính không rõ ràng buộc** → không biết nullable hay không; hỏi.
3. **Ánh xạ kiểu — ghi bảng ánh xạ vào đầu file schema**, để người review thấy quy tắc chứ không phải đoán ý:
   - `chuỗi (UUID)` → `uuid` · `chuỗi` có độ dài → `varchar(n)` · `chuỗi` không giới hạn → `text`
   - `datetime` → `timestamptz` *(nêu rõ múi giờ)* · `số nguyên` → `int`/`bigint` · `số thập phân (tiền)` → `numeric(p,s)`, **không dùng float cho tiền**
   - `enum` → kiểu enum của DB nếu hỗ trợ, không thì `varchar` + `CHECK`; ghi rõ đã chọn cách nào và vì sao.
4. **Quyết định index — mỗi index phải có LÝ DO viết cạnh nó.** Nguồn lý do: cột dùng trong bộ lọc/tìm kiếm ở `srs.md` các màn, cột `FK`, cột `duy nhất`. Index không nêu được truy vấn nào dùng nó → **đừng thêm**.
5. Sinh `docs/Ho-so/dbschema/schema.dbml`: mỗi thực thể một `Table`, ghi `Note` bằng mô tả nghiệp vụ, khai `Ref` cho mọi FK, khai `Enum` cho mọi enum.
6. Chạy `node .claude/skills/ba-data-model/scripts/check-dbml.js docs` → sửa hết lỗi rồi mới báo xong.
7. Báo cáo: số bảng/cột đã phủ · index kèm lý do · **danh sách chỗ đã phải quyết thay** (kiểu, độ dài, index) để người dùng rà.

## Điểm dừng (KHÔNG bịa)
- Không rõ độ dài chuỗi → **`text`** kèm ghi chú, đừng chế `varchar(255)` cho có.
- Không rõ giá trị enum → hỏi. Enum bịa sẽ chui thẳng vào migration rồi vào production.
- Mô hình nghiệp vụ thiếu bảng nối cho quan hệ nhiều-nhiều → **báo, đề xuất**, nhưng sửa ở `05-data-model.md` trước; đừng lặng lẽ thêm bảng chỉ có ở schema.

## Đầu ra
`docs/Ho-so/dbschema/schema.dbml`. Mở dbdiagram.io để xem sơ đồ; DDL SQL để dev chạy thì sinh từ đây, **không** viết tay song song hai bản.

## Lưu ý
- Tiếng Việt cho `Note`/chú thích; tên bảng/cột giữ nguyên như `05-data-model.md` (đừng tự dịch sang tiếng Anh — đứt truy vết).
- **Phạm vi `docs` → TỪ CHỐI** (đọc `ba-toolkit/profile.js` `readScope`) — xem `SKILL.md` → "Chế độ `dbml`".
- **Hồ sơ dự án**: chạy ở cả `full`/`lite`/`mini` — đây là bàn giao kỹ thuật, không phải lớp quản trị.
- Đổi mô hình sau khi schema đã chốt → qua `ba-change-request`, rồi chạy lại `ba-data-model dbml`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
