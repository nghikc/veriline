---
name: ba-figure
description: Use when cần sơ đồ Mermaid thành HÌNH ĐEM ĐI DÙNG — file .svg tĩnh kèm trang HTML tự chứa tương tác (bấm node soi luồng, lọc, sáng/tối, tải SVG/PNG).
---

# ba-figure — Một sơ đồ Mermaid → SVG tĩnh + trang tương tác

## Mục tiêu
`ba-portal` dựng **cả bộ tài liệu** và nhúng `mermaid.min.js` để vẽ **lúc mở trang**. Khi bạn chỉ cần *một hình* để đưa vào slide hay gửi khách, đó là sai công cụ. Skill này biên dịch sẵn:

| | `ba-portal` | `ba-figure` |
|---|---|---|
| Phạm vi | cả `docs/` | **một** sơ đồ |
| Vẽ lúc nào | khi mở trang (runtime) | **lúc build** |
| Kích thước | 3,4 MB mermaid đi kèm | **~12–190 KB**, không runtime |
| Có file `.svg` | không | **có** |
| Sơ đồ hỏng thì biết khi nào | lúc người xem mở | **lúc build, ở đây** |

Ý tưởng lấy từ Archify — *"agents produce IR; Archify deterministically compiles it"* (xem `research/04-archify.md`). Ta **không** chép IR của họ: nguồn của toolkit vẫn là Mermaid trong `.md`, và đó là điều đúng — đổi nguồn sang IR sẽ kéo theo 40+ skill.

## Lệnh
```bash
node .claude/skills/ba-figure/scripts/build.js <file.md> [--index N] [--all] [--out <thư mục>] [--title "..."]
node .claude/skills/ba-figure/scripts/build.js <file.mmd> [--out <thư mục>]
```
- `--index N` — sơ đồ thứ N trong file (mặc định 1). `--all` — mọi sơ đồ, **một lần mở Chrome** cho cả lô.
- Tên file lấy từ **tiêu đề gần nhất phía trên** sơ đồ, nên đặt tiêu đề tử tế thì file có tên tử tế.
- Đầu ra: `<tên>.svg` (hình tĩnh) + `<tên>.html` (tự chứa, có nhúng lại nguồn Mermaid trong comment để sửa sau).

## Cần Chrome
Mermaid là thư viện trình duyệt; không có Chrome/Chromium thì **không biên dịch được SVG**. Skill báo lỗi rõ và dừng — cố ý không có bản dự phòng "nhúng runtime cho xong", vì như vậy là im lặng trả về đúng thứ mà `ba-portal` đã làm, dưới một cái tên khác.

## Tương tác chỉ có với họ flowchart
Bấm node → chỉ hiện node đó và những gì nối trực tiếp; ô lọc theo tên; đổi sáng/tối; tải SVG/PNG.

Chạy được với `flowchart`, `graph`, và **`swimlane-beta`** — những loại có `g.node` + id cạnh `L_<a>_<b>_<n>` trong SVG. **ERD, sequence, state** vẫn ra SVG đẹp nhưng **không bấm được**; skill nói thẳng điều đó ở dòng kết quả và ẩn luôn các nút tương tác trong trang, thay vì đưa người dùng một trang bấm không ăn.

## Giới hạn — biết trước thì đỡ mất công
- Id node có dấu `_` làm `L_a_b_n` mơ hồ. Skill chỉ nhận cạnh khi **cả hai** nửa đều là node có thật; cạnh không phân giải được thì **đếm và báo**, không đoán bừa.
- Nhãn cạnh không mang id trong SVG nên **không mờ theo** lúc chọn node — để nguyên còn hơn mờ sai.
- SVG mang theo style của mermaid; đổi sáng/tối chỉ đổi nền trang, không đổi màu trong hình.

## Nối luồng
- Sau `ba-architecture` / `ba-flow` / `ba-screens`: có sơ đồ ưng ý → xuất hình đem họp.
- Trước buổi trình bày với khách: `--all` trên `01-requirements.md` để có bộ hình rời.
- **Không thay** `ba-portal` (cổng đọc cả bộ) và **không thay** `ba-sitemap` (một trang gộp luồng màn).

## Ranh giới
- KHÁC `ba-portal`: portal dựng **cả bộ** tài liệu và nhúng 3,4 MB mermaid để vẽ lúc mở; đây là **một** hình, biên dịch sẵn, nhẹ hơn ~290 lần.
- Chưa có sơ đồ, cần vẽ từ mô tả → `ba-diagram` trước.

## Lưu ý
- Tiếng Việt. Chỉ đọc `.md` nguồn, ghi ra thư mục `--out`.
- Sơ đồ hỏng cú pháp → Chrome trả lỗi và skill **dừng với mã 1**, không ghi file nửa vời.
