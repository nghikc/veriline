# Khối `states` — rỗng · đang tải · lỗi · thành công

## Dùng khi
Mọi vùng dữ liệu tải từ server (danh sách, chi tiết, thẻ số) — **luôn mở**. Mỗi vùng có đủ 4 lớp: `state-default` · `state-loading` · `state-empty` · `state-error`, cộng mỗi ca `E-S..` có giao diện riêng một lớp `state-e-s..-..`.

## Không dùng khi
- Lỗi **của một ô nhập** → `field__error` trong `form.md` (vẫn bật bằng `body[data-state]`, nhưng không phải khối lớn giữa trang).
- Thông báo sau thao tác (lưu xong, xoá xong) → toast trong `overlay.md`; khối ở đây chỉ cho thành công **cần ở lại trên trang** (vd "Đã gửi lời mời — kiểm tra hộp thư").

## Markup canon
```html
<body data-state="default">  <!-- BẮT BUỘC có giá trị đầu: thiếu thì mọi .state-block hiện cùng lúc -->
<section class="card" aria-labelledby="tasksH">
  <h2 id="tasksH">Công việc của nhóm</h2>

  <div class="state-block state-default">…bảng thật (table-list.md)…</div>

  <!-- Đang tải: skeleton ĐÚNG HÌNH nội dung — cùng số cột, cùng nhịp dòng -->
  <div class="state-block state-loading" role="status" aria-busy="true">
    <span class="sr-only">Đang tải danh sách công việc…</span>
    <div class="sk-row" aria-hidden="true"><i class="sk" style="width:46%"></i><i class="sk sk--pill"></i><i class="sk" style="width:12%"></i></div>
    <div class="sk-row" aria-hidden="true"><i class="sk" style="width:62%"></i><i class="sk sk--pill"></i><i class="sk" style="width:12%"></i></div>
    <div class="sk-row" aria-hidden="true"><i class="sk" style="width:38%"></i><i class="sk sk--pill"></i><i class="sk" style="width:12%"></i></div>
  </div>

  <!-- Rỗng: biến thể "chưa có dữ liệu" — luôn kèm hành động kế -->
  <div class="state-block state-empty">
    <div class="empty">
      <svg class="empty__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/></svg>
      <p class="empty__title">Chưa có công việc nào</p>
      <p class="empty__text">Tạo công việc đầu tiên và giao cho thành viên trong nhóm.</p>
      <button class="btn btn--primary" type="button">Tạo công việc</button>
    </div>
  </div>

  <!-- Lỗi tải: mỗi ca E-S có lớp riêng + data-trace -->
  <div class="state-block state-error state-e-s02-01" data-trace="E-S02-01" role="alert">
    <div class="empty empty--error">
      <svg class="empty__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
      <p class="empty__title">Không tải được danh sách công việc</p>
      <p class="empty__text">Kiểm tra kết nối rồi thử lại. Dữ liệu đã nhập không bị mất.</p>
      <button class="btn btn--secondary" type="button">Thử lại</button>
    </div>
  </div>
</section>

<!-- Thành công cần ở lại trên trang — nút statebar nhóm `biz` "Đã mời" -->
<div class="state-block state-invited"><!-- bọc ngoài: .notice cần flex -->
  <p class="notice notice--success" role="status">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
    Đã gửi lời mời tới le.c@acme.vn — lời mời hết hạn sau 7 ngày.
  </p>
</div>
```
```css
/* shell.md đã có: [data-state] .state-block{display:none} + 4 dòng default/loading/empty/error.
   Mỗi ca E-S thêm ĐÚNG MỘT dòng — đừng viết JS ẩn/hiện riêng: */
body[data-state="e-s02-01"] .state-e-s02-01,
body[data-state="invited"] .state-invited{display:block}

.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.sk-row{display:flex;align-items:center;gap:16px;height:48px;padding:0 16px;
  border-bottom:1px solid var(--border,#e5e7eb)}
.sk{display:block;height:12px;border-radius:8px;background:var(--surface-hover,#f3f4f6);
  animation:sk-pulse 1.2s ease-in-out infinite}
.sk--pill{width:72px;height:20px;border-radius:999px}
@keyframes sk-pulse{50%{opacity:.5}}             /* nhấp nháy đơn sắc, không dải chuyển màu */
@media (prefers-reduced-motion:reduce){.sk{animation:none}}

.empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:40px 16px;
  text-align:center;color:var(--text-secondary,#4b5563)}
.empty__icon{color:var(--text-placeholder,#9ca3af)}
.empty--error .empty__icon{color:var(--danger,#dc2626)}
.empty__title{font-size:16px;font-weight:600;color:var(--text-primary,#111827)}
.empty__text{font-size:14px;max-width:40ch}
.notice{display:flex;gap:8px;align-items:flex-start;padding:12px 16px;border-radius:8px;
  font-size:14px;border:1px solid currentColor}
.notice--success{color:var(--success,#16a34a)}
.notice--danger{color:var(--danger,#dc2626)}
```

## Trạng thái bắt buộc
| Lớp | Nút statebar | Nhóm |
|---|---|---|
| `state-default` · `state-loading` · `state-empty` · `state-error` | Mặc định · Đang tải · Rỗng · Lỗi | `ui` |
| `state-e-s..-..` (mỗi ca có giao diện riêng) | nhãn mô tả ca, `data-trace="E-S..-.."` | `error` |
| Rỗng do **lọc** (`empty` biến thể "lọc không ra") | thuộc `table-list.md` | `ui` |

Một vùng có ca lỗi cụ thể → nút **Lỗi** chung của nhóm `ui` vẫn trỏ về khối lỗi tải chung (`state-error`), ca riêng đi nhóm `error`.

## Ca biên
- `body` không có `data-state` ban đầu → mọi khối hiện chồng nhau. Luôn mở trang bằng `data-state="default"`.
- `.state-block` ép `display:block` → đừng gắn lên phần tử cần `flex`/`grid`; bọc một `div` ngoài.
- Skeleton phải cùng số dòng/cột với dữ liệu mặc định và **cùng chiều cao dòng** (48px = dòng bảng) — đổi trạng thái không được nhảy bố cục.
- Khối rỗng có hành động theo vai trò (Member không tạo được việc) → vẽ hai biến thể theo nhóm `role` của statebar, đừng chú thích "(chỉ hiện với Team Lead)" vào chữ người dùng thấy.
- Câu lỗi nói **việc người dùng làm tiếp** ("Thử lại", "Về Dashboard"), không chỉ "Đã có lỗi".

## Lỗi đã gặp
- **Cả 6 màn example** ẩn/hiện bằng `id="state-…" hidden` / `.show` / `.visible` riêng từng khối, **không màn nào** dùng `body[data-state]` của shell — ba cơ chế trộn nhau, statebar không điều khiển được khối mới thêm.
- **S02–S05:** skeleton dùng `linear-gradient` shimmer (`.skeleton`, `.sk`) — gradient bị `DS-GRADIENT` bắt; dùng nhấp nháy đơn sắc.
- **S02, S03, S05:** icon trạng thái rỗng/lỗi là emoji (`🗂️`, `⚠️`, `💬`, `🔍`) cỡ 28–40px — mỗi máy vẽ một kiểu, không ăn màu token.
- **S02:** khối rỗng chèn chú thích cho người duyệt "(gợi ý chỉ hiện với Team Lead / Org Admin)" bằng `style="font-size:11px"` vào chữ hiển thị — dùng nhóm `role` thay vì chú thích.
- **S02:** srs có `E-S02-01…10` nhưng statebar **không nút nào** mang `data-trace` — lỗi tải chỉ có một nút "Lỗi" chung.
- **S03, S05:** ca lỗi (`E-S03-05`, `E-S03-01`, `E-S05-02`, `E-S05-06`) nằm ở nhóm `data-group="ui"` thay vì `error`.
- **S05:** nút "Lỗi tải danh sách" gắn `data-trace="E-S05-02"`, mà srs ghi `E-S05-02` là "Không tải được thông tin **tổ chức**" — trace trỏ sai ca. Đối chiếu nhãn với cột mô tả của ma trận lỗi trước khi gắn.

## Trace
- `data-trace="E-S..-.."` đặt trên **khối hiển thị ca lỗi** và trên **nút statebar** của ca đó — hai chỗ cùng mã; nhãn nút khớp cột mô tả trong ma trận lỗi `srs.md`.
- Khối rỗng/đang tải không có E-S → ghi nguồn bằng comment `<!-- R-S02-03 -->` cạnh khối nếu srs có rule về nó (vd "rỗng thì hiện CTA tạo mới").
