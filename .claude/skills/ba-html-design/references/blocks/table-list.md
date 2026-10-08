# Khối `table-list` — danh sách / bảng có lọc

## Dùng khi
Nhiều bản ghi cùng cấu trúc cần so, lọc, tìm, mở chi tiết: danh sách công việc, thành viên, đơn hàng. ≥3 thuộc tính mỗi dòng → bảng; 1–2 thuộc tính → vẫn khối này nhưng bỏ `thead`, dòng thành `list-row` đơn.

## Không dùng khi
- Một bản ghi → `detail.md`. Vài con số tổng → `kpi.md`.
- Bố cục theo cột trạng thái kéo-thả (kanban), lịch → khối đặc thù dự án (07 §7), chưa có thì mượn khuôn file này và ghi "chưa có mẫu".

## Markup canon
```html
<section class="card card--flush" aria-labelledby="listH">
  <div class="list__head">
    <h2 id="listH" class="card__title">Thành viên <span class="list__count">1.284</span></h2>
    <div class="list__tools" role="search">
      <label class="sr-only" for="q">Tìm theo tên hoặc email</label>
      <input class="field__input" id="q" type="search" placeholder="Tìm theo tên hoặc email">
      <label class="sr-only" for="fStatus">Trạng thái</label>
      <select class="field__input" id="fStatus"><option>Mọi trạng thái</option><option>Đang hoạt động</option><option>Đã khoá</option></select>
    </div>
  </div>

  <div class="state-block state-default">
    <table class="list">
      <thead><tr><th scope="col">Họ tên</th><th scope="col">Trạng thái</th><th scope="col" class="num">Việc đang làm</th><th scope="col"><span class="sr-only">Hành động</span></th></tr></thead>
      <tbody>
        <tr class="list-row">
          <td data-th="Họ tên"><a class="list__link" href="#">Tôn Nữ Hoàng Bảo Ngọc Phương Thảo — Trưởng nhóm Kiểm thử Tự động hoá Hệ thống Thanh toán Liên ngân hàng khu vực phía Nam, phụ trách đồng thời ba dự án chuyển đổi số và đào tạo nhân sự mới</a></td>
          <td data-th="Trạng thái"><span class="badge" data-status="active">Đang hoạt động</span></td>
          <td data-th="Việc đang làm" class="num">0</td>
          <td data-th=""><button class="btn btn--ghost btn--icon" aria-label="Thao tác với Tôn Nữ Hoàng Bảo Ngọc Phương Thảo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg></button></td>
        </tr>
        <tr class="list-row">
          <td data-th="Họ tên"><a class="list__link" href="#">Lê C</a></td>
          <td data-th="Trạng thái"><span class="badge" data-status="locked">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>Đã khoá</span></td>
          <td data-th="Việc đang làm" class="num">12</td>
          <td data-th=""></td>
        </tr>
      </tbody>
    </table>
    <div class="list__foot"><span class="list__count">Hiển thị 20 / 1.284</span><button class="btn btn--secondary" type="button">Tải thêm</button></div>
  </div>

  <!-- Rỗng do LỌC — khác rỗng do chưa có dữ liệu (states.md) -->
  <div class="state-block state-filtered">
    <div class="empty"><p class="empty__title">Không có thành viên khớp “nguyen thi z”</p>
      <button class="btn btn--secondary" type="button">Xoá bộ lọc</button></div>
  </div>
  <!-- state-loading / state-empty / state-error: lấy từ states.md, skeleton 4 cột như bảng -->
</section>
```
```css
body[data-state="filtered"] .state-filtered{display:block}
.card--flush{padding:0;overflow:hidden}
.list__head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:16px}
.list__tools{display:flex;flex-wrap:wrap;gap:8px;flex:1 1 320px;justify-content:flex-end}
.list__tools .field__input{flex:1 1 160px;width:auto}
.list__count{font-size:12px;font-weight:400;color:var(--text-secondary,#4b5563);font-variant-numeric:tabular-nums}
.list{width:100%;border-collapse:collapse;font-size:14px}
.list th{text-align:left;font-size:12px;font-weight:600;color:var(--text-secondary,#4b5563);
  padding:8px 16px;border-bottom:1px solid var(--border,#e5e7eb)}
.list td{padding:12px 16px;border-bottom:1px solid var(--border,#e5e7eb);vertical-align:middle}
.list .num{text-align:right;font-variant-numeric:tabular-nums}
.list-row:hover{background:var(--surface-hover,#f3f4f6)}
.list-row[aria-selected="true"]{background:var(--surface-hover,#f3f4f6);outline:2px solid var(--brand-primary,#4f46e5);outline-offset:-2px}
.list__link{color:var(--text-primary,#111827);font-weight:600;text-decoration:none;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.list__link:hover{color:var(--brand-primary,#4f46e5);text-decoration:underline}
.badge{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:999px;
  font-size:12px;font-weight:600;white-space:nowrap;border:1px solid currentColor}
.badge[data-status="active"]{color:var(--success,#16a34a)}   /* màu/icon theo 07 §6b, không tự chọn */
.badge[data-status="locked"]{color:var(--text-secondary,#4b5563)}
.btn--ghost{background:none;color:var(--text-secondary,#4b5563)}
.btn--icon{min-width:44px;padding:8px}
.list__foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px}
@media (max-width:767px){       /* MỘT bảng, xếp dọc — không render bản thẻ thứ hai */
  .list thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
  .list tr{display:block;padding:12px 16px;border-bottom:1px solid var(--border,#e5e7eb)}
  .list td{display:flex;justify-content:space-between;gap:12px;padding:4px 0;border:0}
  .list td::before{content:attr(data-th);font-size:12px;color:var(--text-secondary,#4b5563)}
  .list .num{text-align:left}
}
```

## Trạng thái bắt buộc
- Vùng: `default` · `loading` · `empty` · `error` (từ `states.md`) + **`filtered`** (lọc không ra — nút nhóm `ui` nhãn "Lọc rỗng") → khác nhau ở hành động: rỗng → "Tạo …", lọc rỗng → "Xoá bộ lọc".
- Dòng (`list-row`, 07 §6a): default · hover · chọn (`aria-selected`). Dòng bấm được → cả tên là link, không chỉ màu.
- Badge theo bảng `STATUS` 07 §6b — mã trạng thái viết vào `data-status`, nhãn/màu/icon lấy nguyên bảng.

## Ca biên
- Tên ~200 ký tự: cắt 2 dòng (`line-clamp`), tên đầy đủ còn trong `aria-label` của nút thao tác; ở 375px không đẩy cột khác ra ngoài.
- Số `0` hiện là `0`, không để trống; số lớn `1.284` canh phải, `tabular-nums`.
- Có trạng thái theo thời gian → ≥1 dòng **quá hạn** trong dữ liệu mẫu, báo bằng badge có icon + chữ, không chỉ tô đỏ.
- Tổng ở tiêu đề (`1.284`) = tổng ở chân ("Hiển thị 20 / 1.284") = số ở thẻ KPI cùng màn (nếu có).
- Từ khoá lọc dài / có dấu nhắc lại trong câu lọc rỗng, không vỡ dòng.

## Lỗi đã gặp
- **S02 vs S05 — hai cách xử lý màn hẹp:** S02 xếp dọc chính bảng bằng `data-th`; S05 render **hai bản** (bảng `table-wrap` + `card-list` `.mcard`) từ JS, ẩn/hiện theo breakpoint — hai chỗ phải sửa mỗi khi đổi cột. Breakpoint cũng lệch: `767px` (S02) vs `767.98px` (S05).
- **Cùng một trạng thái, hai hệ class:** S02 `pill todo`/`pill inprogress`; S03, S05 `badge st-todo`/`badge st-doing` — không có bảng STATUS chung nên nhãn và màu trôi theo màn.
- **S02:** quá hạn = chữ đỏ + emoji `12/06 09:00 ⚠`; thẻ thống kê còn chèn `⚠` bằng `.lbl::after{content:" ⚠"}` — emoji trong CSS `content` không nằm ở chữ HTML.
- **S03:** màu badge viết hex cứng (`#F3F4F6`, `#EEF0FF`) thay token.
- **S05:** ô tên trong bảng dùng `av sm` — đúng lớp mà `shell.md` §1.3 cấm (`avatar avatar--sm`).
- **S02:** bảng tĩnh bọc trong `.task-card` có `border-radius:16px` + `box-shadow` — shadow cho khung không nổi, radius ngoài thang.

## Trace
- Cột/bộ lọc/sắp xếp đến từ `R-S..` → comment `<!-- R-S02-05 sắp theo deadline -->` trên `thead` hoặc ô lọc.
- Lỗi tải danh sách: `data-trace="E-S..-.."` trên khối `state-e-s..` (xem `states.md`); thao tác bị cấm theo vai trò (vd Team Lead sửa thành viên) → biến thể nhóm `role`, comment mã `E-S..`.
