---
name: ba-index
description: Use when cần TRA CỨU tài liệu BA mà không đọc cả file — chỉ mục SQLite từ docs/ trả lát cắt — một ID nói gì, ai nhắc tới nó, màn có mã nào, tìm toàn văn.
---

# ba-index — Chỉ mục truy xuất cho tài liệu BA

## Mục tiêu
Trả lời câu hỏi hẹp bằng **lát cắt hẹp**. Đo thật trên `example/docs` (96 file, ~319k token):

| Cách lấy | Token |
|---|---|
| Đọc cả màn `S05` | ~46.500 |
| Đọc riêng `srs.md` của màn đó | ~10.900 |
| `query get BRule-S05-07` | **~115** |
| `query refs BRule-S05-07` | ~53 |
| `query man S05` (kiểm kê) | ~30 |

## Nguyên tắc không được phá: `.md` LÀ NGUỒN
Chỉ mục **sinh ra từ** `docs/`, xoá lúc nào cũng được, dựng lại trong ~0,15 giây. Nó **không bao giờ** là nơi sửa nội dung.

Đây là quyết định có chủ đích, không phải tạm bợ. Đưa nguồn vào DB sẽ giết:
- `git diff`/`git blame`/PR review trên nội dung nghiệp vụ;
- `ba-toolkit/semdiff.js` (diff ngữ nghĩa theo revision);
- nhánh change-watch của `hook-lint.js` và cả `ba-changelog`;
- phân tích ảnh hưởng của `ba-change-request`;
- và khả năng sửa tài liệu bằng một lần Edit, không cần app nào chạy.

Đổi lại chỉ được tốc độ tra cứu — thứ mà chỉ mục dẫn xuất đã cho, không cần trả giá đó.

## Lệnh
```bash
node .claude/skills/ba-index/scripts/build.js [docsDir=docs]        # dựng/dựng lại (~0,15s cho 96 file)
node .claude/skills/ba-index/scripts/query.js get  <ID>             # một ID nói gì
node .claude/skills/ba-index/scripts/query.js refs <ID>             # nhắc tới ai / ai nhắc tới
node .claude/skills/ba-index/scripts/query.js find "<chuỗi>" [--kind BRule] [--man S01] [--limit 10]
node .claude/skills/ba-index/scripts/query.js man  <S01>            # kiểm kê một màn theo loại ID
node .claude/skills/ba-index/scripts/query.js stats
```
**`ba-export` dựng sẵn chỉ mục khi cài** vào một dự án đã có `docs/`, nên không phải nhớ chạy lần đầu. Đích chưa có `docs/`, hoặc Node cũ hơn 22 → installer báo lý do rồi đi tiếp; chỉ mục là thứ sinh ra, không được phép chặn lần cài.

Thêm `--json` cho đầu ra máy đọc. Chỉ mục mặc định ở `.claude/ba-index.db` — **ngoài `docs/`**, cùng lý do đã đẩy `e2e.spec.ts` ra ngoài: `docs/` là cây tài liệu, không phải nơi chứa file nhị phân. Nhớ gitignore.

## Giao diện web (xem/sửa)

```bash
node .claude/skills/ba-index/scripts/server.js [docsDir=docs] [--port 4322] [--no-open]
```
Duyệt theo **màn** hoặc **tài liệu dự án**, lọc theo loại ID (`BRule`, `R`, `TC`, `E`…), tìm toàn văn, và **sửa tại chỗ**. Link sâu: `#man=S01`, `#path=01-requirements.md`.

**Sửa ở giao diện ghi THẲNG ra `.md`, rồi dựng lại chỉ mục — không bao giờ ghi vào DB.** Hai nguồn sự thật là cách chắc chắn nhất để chúng lệch nhau, và bên thua luôn là bên mà git đang theo dõi.

Đường ghi đi qua `write-back.js`, và nó **từ chối thay vì đoán** ở mọi ca mơ hồ:
- giá trị chứa `|` (cắt ô bảng làm đôi) hoặc xuống dòng → chặn, **không tự escape**: im lặng đổi ký tự của người dùng là một kiểu nói dối;
- file đã đổi kể từ lúc mở (so `sha`) → chặn, không hoà giải — ghi đè là xoá mất thay đổi của người khác;
- ID không có, cột không có, hoặc **ID xuất hiện ở hai bảng trong cùng file** → chặn;
- đường dẫn thoát khỏi `docs/` → chặn (dữ liệu từ trình duyệt, không được tin).

Mọi byte ngoài đúng một ô phải nguyên vẹn — `test.js` kiểm cả điều này lẫn từng chốt chặn trên.

**An toàn:** chỉ nghe `127.0.0.1`, kiểm `Host`, và mọi `POST` phải kèm token sinh ngẫu nhiên mỗi lần chạy.

## Chỉ mục cũ nguy hiểm hơn không có chỉ mục
Nó trả lời trôi chảy bằng dữ liệu của hôm qua, và **không báo lỗi**. Nên mọi lệnh `query` đều băm lại từng file nguồn trước khi trả kết quả và in cảnh báo khi lệch — bắt cả ba kiểu: file đổi, file mất, **file mới chưa vào chỉ mục** (kiểu dễ sót nhất, vì mọi file cũ vẫn khớp).

Thấy cảnh báo `CHỈ MỤC CŨ` → chạy `build.js` rồi hỏi lại. Đừng đọc kết quả đó.

## Dùng ở đâu trong pipeline
- **Trước khi Read cả file**: cần một quy tắc, một yêu cầu, một TC → `get`. Cần biết ai phụ thuộc → `refs`.
- `ba-review`, `ba-feasible`, `ba-change-request`, `ba-conformance` — mọi chỗ đang Read cả `srs.md` chỉ để lấy vài dòng.
- **Không thay** `ba-trace`: `scan.js` dựng đồ thị truy vết ĐẦY ĐỦ và tính độ phủ; `ba-index` trả lát cắt cho một câu hỏi. Khác mục đích.

## Giới hạn — đọc trước khi kết luận
- Chỉ thấy **bảng markdown có ô đầu là ID canon**. Văn xuôi, sơ đồ Mermaid, danh sách gạch đầu dòng **không vào chỉ mục** — muốn nội dung đó thì vẫn phải Read file.
- `refs` chỉ là **"có nhắc tới"**, không phải quan hệ nhân quả. Diễn giải là việc của skill.
- Không phân biệt được ID trong một câu phủ định ("KHÔNG áp dụng `BRule-S01-03`") với một tham chiếu thật.

## Lưu ý
- Zero-dependency: dùng `node:sqlite` có sẵn từ Node 22 (kèm FTS5). Node cũ hơn → `build.js` báo lỗi rõ, không có bản dự phòng.
- Dựng lại sau mỗi lô sửa tài liệu; rẻ tới mức cứ chạy, đừng tối ưu.
- Tiếng Việt.
