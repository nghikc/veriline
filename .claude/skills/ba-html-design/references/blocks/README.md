# Thư viện khối — `ba-html-design`

> Màn hình được **ráp từ khối đã duyệt**, không nặn từ đầu. Mỗi file là một bộ khung (markup + CSS tối thiểu + trạng thái + ca biên + lỗi đã gặp) — chép khung, thay nội dung bằng dữ liệu của màn. Mở **đúng file của khối đang dựng**, đừng nạp cả thư mục.

## Luôn mở (mọi màn)

| File | Lấy gì |
|---|---|
| `../shell.md` | khung `app-shell`/`auth-shell`, `statebar`, cơ chế `body[data-state]` + `.state-block` |
| `docs/07-design-system.md` §4b | ngân sách đếm được (radius · shadow · font-size · spacing…) — `check-design.js` đọc |
| `docs/07-design-system.md` §6a | class canon 7 nguyên tố: `btn` · `badge` · `field` · `card` · `list-row` · `modal` · `empty` |
| `docs/07-design-system.md` §6b | bảng `STATUS` — nhãn, token màu, icon của mọi trạng thái nghiệp vụ |
| `states.md` | rỗng · đang tải (skeleton) · lỗi · thành công — màn nào cũng có |

## Mở khi dựng khối đó

| Khối trên màn | File |
|---|---|
| Form nhập / sửa (trang hoặc trong card) | `form.md` |
| Danh sách, bảng, lọc/tìm, tải thêm | `table-list.md` |
| Trang chi tiết một bản ghi (thuộc tính, mô tả, hành động) | `detail.md` |
| Thẻ số liệu / chỉ số tổng quan | `kpi.md` |
| Modal form · hộp xác nhận thao tác phá huỷ · toast | `overlay.md` |
| Khối đặc thù dự án (thẻ hội thoại, lịch, kanban…) | `docs/07-design-system.md` §7 → mở đúng màn mẫu được ghi ở cột **Mẫu** |

**Thứ tự ưu tiên:** khối ở **07 §7 của dự án thắng** khối gốc ở thư mục này (dự án đã duyệt nó trên màn thật). Khối gốc chỉ dùng khi 07 §7 không có khối cùng loại.

**Ngân sách mặc định của khối gốc** (dự án có §4b thì theo §4b): radius chỉ `8px` (khung/nút/ô/card) · `999px` (badge) · `50%` (avatar) — còn chừa 1 cho dự án; shadow duy nhất `--shadow-overlay` cho modal/toast; spacing `4 8 12 16 20 24 32 40`; một màu nhấn; **một tín hiệu mạnh mỗi màn** (nền nhấn đặc / đỏ đặc / số to) dành cho việc chính; không gradient, không `backdrop-filter`, không emoji — icon là inline SVG `stroke="currentColor"` `aria-hidden="true"`.

**CSS nguyên tố dùng chung** chỉ khai một lần mỗi màn: `.card` `.btn*` `.field*` ở `form.md` · `.badge` `.btn--ghost` `.btn--icon` ở `table-list.md` · `.empty` `.notice` `.sk` `.sr-only` ở `states.md`. Khối khác dùng lại, không định nghĩa lại.

## Chưa có mẫu

Khối cần dựng không có trong bảng trên, cũng không có ở 07 §7:
1. **Mượn khuôn khối gần nhất** — chỉ từ khối **đã duyệt** (thư mục này hoặc 07 §7 của dự án). Không mượn từ màn chưa duyệt, không mượn từ trí nhớ.
2. **Mượn khuôn, không mượn nội dung** — lấy bộ xương (vùng, thứ tự, class nguyên tố, trạng thái bắt buộc), thay toàn bộ nhãn/dữ liệu/luật bằng của màn này.
3. **Dựng ca biên ngay trong trang** — tên ~200 ký tự, `0`, `1.284.500`, danh sách rỗng, thiếu ảnh — như mọi khối khác; khối mới không được miễn.
4. **Lúc giao ghi một dòng:** `<X> chưa có mẫu, mượn khuôn <Y>` (vd *"Lịch trực tuần chưa có mẫu, mượn khuôn table-list.md"*).

## Ghi ngược

Màn được duyệt mà có khối **đặc thù dự án mới** (lần đầu xuất hiện, sẽ lặp ở màn khác) → thêm **một dòng** vào bảng `docs/07-design-system.md` §7:

| Khối | Dùng khi | Mẫu |
|---|---|---|
| `<tên>` | `<một câu: dữ liệu/việc nào thì dùng>` | `Mẫu: <Mã màn> html-design.html` · `.<class gốc>` |

- Không tạo thư mục khối mới trong `docs/` — 07 §7 là sổ duy nhất, màn mẫu là bản canon.
- Khối gốc toolkit chỉ được dùng nguyên khuôn → **không** ghi ngược. Chỉ ghi khi có khuôn mới thật.
- Sửa khối đã ghi (đổi class, đổi trạng thái) → sửa màn mẫu trước, rồi cập nhật dòng §7.
