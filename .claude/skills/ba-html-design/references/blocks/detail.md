# Khối `detail` — chi tiết một bản ghi

## Dùng khi
Màn cấp 2 mở từ danh sách: xem một công việc, một thành viên, một đơn hàng — tiêu đề + trạng thái + bảng thuộc tính + mô tả + hành động theo trạng thái/vai trò. Lịch sử/bình luận bên dưới là danh sách → ráp thêm `table-list.md` (bỏ `thead`).

## Không dùng khi
- Đang sửa → `form.md` (trang hoặc modal). Chi tiết chỉ "có nút Sửa", không có ô nhập.
- Hồ sơ của chính người dùng có nhiều trường sửa trực tiếp → `form.md` với trường khoá (`field--locked`).

## Markup canon
```html
<nav class="crumbs" aria-label="Vị trí"><a href="#">Bảng công việc</a><span aria-hidden="true">/</span><span aria-current="page">Chi tiết</span></nav>

<article class="card detail" aria-labelledby="dTitle">
  <div class="state-block state-cancelled"><!-- trạng thái nghiệp vụ, nhóm biz -->
    <p class="notice notice--neutral">Công việc đã huỷ — vẫn xem được lịch sử, không thao tác thêm.</p>
  </div>

  <header class="detail__head">
    <h1 id="dTitle" class="detail__title">Chuẩn hoá tài liệu đặc tả API cổng thanh toán nội địa và quốc tế cho đợt kiểm toán bảo mật quý IV, bao gồm toàn bộ mã lỗi 4xx/5xx, giới hạn tần suất, ví dụ phản hồi đã che dữ liệu và kịch bản đua giao dịch hoàn tiền</h1>
    <div class="detail__badges">
      <span class="badge" data-status="doing">Đang làm</span>
      <span class="badge" data-status="overdue">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Quá hạn 2 ngày</span>
    </div>
  </header>

  <dl class="detail__attrs">
    <div><dt>Người thực hiện</dt><dd><span class="avatar avatar--sm" aria-hidden="true">LC</span>Lê C</dd></div>
    <div><dt>Hạn chót</dt><dd>03/10/2026 17:00</dd></div>
    <div><dt>Ước tính</dt><dd>0 giờ <span class="detail__muted">(chưa ước tính)</span></dd></div>
    <div><dt>Chi phí dự kiến</dt><dd class="num">1.284.500 ₫</dd></div>
  </dl>

  <section class="detail__desc" aria-labelledby="descH">
    <h2 id="descH" class="card__title">Mô tả</h2>
    <p class="detail__body is-clamped" id="descBody">Phạm vi gồm khởi tạo giao dịch, truy vấn trạng thái, hoàn tiền một phần và toàn phần…</p>
    <button class="btn btn--ghost" type="button" aria-expanded="false" aria-controls="descBody">Xem thêm</button>
  </section>

  <!-- Chỉ render hành động HỢP LỆ với trạng thái + vai trò; MỘT nút chính -->
  <div class="detail__actions">
    <button class="btn btn--primary" type="button">Gửi duyệt</button>
    <button class="btn btn--secondary" type="button">Sửa thông tin</button>
    <button class="btn btn--ghost btn--danger" type="button">Huỷ công việc</button>
  </div>
</article>

<!-- Không tìm thấy / không có quyền: CÙNG một giao diện (không lộ bản ghi tồn tại) -->
<div class="state-block state-e-s03-01" data-trace="E-S03-01">
  <div class="card empty"><p class="empty__title">Không tìm thấy công việc</p>
    <p class="empty__text">Công việc không tồn tại hoặc bạn không có quyền xem.</p>
    <a class="btn btn--secondary" href="#">Về Bảng công việc</a></div>
</div>
```
```css
body[data-state="cancelled"] .state-cancelled,
body[data-state="e-s03-01"] .state-e-s03-01{display:block}
body[data-state="e-s03-01"] .detail,
body[data-state="cancelled"] .detail__actions{display:none}

.crumbs{display:flex;gap:8px;font-size:14px;color:var(--text-secondary,#4b5563);margin:16px 0 8px}
.crumbs a{color:var(--brand-primary,#4f46e5)}
.detail{display:flex;flex-direction:column;gap:20px}
.detail__head{display:flex;flex-direction:column;gap:8px;min-width:0}
.detail__title{font-size:20px;font-weight:700;line-height:1.3;overflow-wrap:anywhere}
.detail__badges{display:flex;flex-wrap:wrap;gap:8px}
.badge[data-status="doing"]{color:var(--brand-primary,#4f46e5)}
.badge[data-status="overdue"]{color:var(--danger,#dc2626)}
.detail__attrs{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px 24px;margin:0}
.detail__attrs div{display:flex;flex-direction:column;gap:4px;min-width:0}
.detail__attrs dt{font-size:12px;color:var(--text-secondary,#4b5563)}
.detail__attrs dd{margin:0;display:flex;align-items:center;gap:8px;font-weight:600;overflow-wrap:anywhere}
.detail__muted{font-weight:400;color:var(--text-secondary,#4b5563)}
.detail__body{white-space:pre-line;overflow-wrap:anywhere}
.detail__body.is-clamped{display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden}
.detail__actions{display:flex;flex-wrap:wrap;gap:8px;padding-top:16px;border-top:1px solid var(--border,#e5e7eb)}
.btn--danger{color:var(--danger,#dc2626)}
.notice--neutral{color:var(--text-secondary,#4b5563)}
@media (max-width:767px){.detail__actions .btn--primary{flex:1 1 100%}}
```

## Trạng thái bắt buộc
- Vùng: `default` · `loading` (skeleton đúng hình: một thanh tiêu đề, hai pill, lưới 4 thuộc tính) · `error` (lỗi tải) · **không tìm thấy** (`E-S..`, nhóm `error`).
- Trạng thái nghiệp vụ của bản ghi (đã huỷ, chờ duyệt, đã khoá) → nhóm `biz` của statebar; mỗi trạng thái đổi **bộ nút hành động**, không chỉ đổi màu badge.
- Vai trò khác thấy hành động khác → nhóm `role`.

## Ca biên
- Tiêu đề ~200 ký tự: xuống dòng (`overflow-wrap:anywhere`), không cắt — đây là thứ người dùng đến để đọc.
- Mô tả dài: kẹp 6 dòng + "Xem thêm" (`aria-expanded`); mô tả rỗng → câu "Chưa có mô tả", không để khoảng trắng.
- Giá trị `0` và "chưa có" là hai thứ khác nhau: `0 giờ` ≠ `—`. Tiền `1.284.500 ₫` canh số `tabular-nums`.
- Quá hạn: badge icon + chữ có số ngày, không chỉ tô đỏ ngày.
- Thuộc tính trùng với dòng danh sách đã mở (tên, hạn, trạng thái) phải **khớp số** với `table-list` của màn trước.

## Lỗi đã gặp
- **S03:** badge mang ký tự trang trí trong chữ — `● Đang làm`, `▲ Ưu tiên: Cao`, `⚠ Quá hạn` — trình đọc màn hình đọc cả ký hiệu; icon đi bằng SVG `aria-hidden`.
- **S03:** avatar trong bảng thuộc tính dùng `avatar sm` (lớp cấm ở `shell.md` §1.3, đúng là `avatar--sm`); brand-icon còn là ký tự `✓`.
- **S03:** khối "không tìm thấy" dùng glyph `?`, khối lỗi dùng emoji `⚠️`, banner đã huỷ dùng `🚫` — ba kiểu icon trên một màn.
- **S04, S05:** lý do trường khoá đi kèm emoji `🔒` (`lk-why`) — dùng SVG ổ khoá.
- **Làm đúng, giữ lại (S03):** chỉ render nút hợp lệ với trạng thái (R-S03-07), không để nút `disabled` câm; 404 và "khác tổ chức" dùng chung một giao diện (R-S03-17).

## Trace
- Mỗi nút hành động có điều kiện → comment `<!-- R-S03-07: chỉ người thực hiện, trạng thái Đang làm -->` ngay trên nút.
- Không tìm thấy / không quyền: `data-trace="E-S..-.."` trên khối `state-e-s..` và trên nút statebar.
- Thuộc tính lấy từ bảng phần tử của `srs.md` — giữ đúng nhãn srs, không đặt tên mới.
