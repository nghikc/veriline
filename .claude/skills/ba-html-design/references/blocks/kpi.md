# Khối `kpi` — thẻ số liệu tổng quan

## Dùng khi
Đầu màn tổng quan (Dashboard) cần 2–5 con số trả lời "tình hình thế nào": tổng việc, quá hạn, doanh thu tháng. Thẻ bấm được để lọc danh sách bên dưới → vẫn là khối này, thêm `aria-pressed`.

## Không dùng khi
- Số đi kèm một bản ghi (chi phí của một đơn) → thuộc tính trong `detail.md`.
- Cần xu hướng theo thời gian, so nhiều chuỗi → biểu đồ (khối đặc thù, 07 §7); thẻ KPI chỉ mang một số + một dòng ngữ cảnh.
- Hơn 5 thẻ → gom lại; thẻ thứ 6 trở đi không ai đọc.

## Markup canon
```html
<section class="kpis" aria-label="Tổng quan công việc — bấm một thẻ để lọc danh sách">
  <button class="card kpi" type="button" aria-pressed="false">
    <span class="kpi__label">Tổng công việc</span>
    <span class="kpi__value">1.284</span>
    <span class="kpi__note">+12 so với tuần trước</span>
  </button>
  <button class="card kpi" type="button" aria-pressed="false">
    <span class="kpi__label">Đang làm</span>
    <span class="kpi__value">0</span>
    <span class="kpi__note">Không ai đang làm việc nào</span>
  </button>
  <!-- Tín hiệu mạnh DUY NHẤT của khối: việc cần xử lý ngay -->
  <button class="card kpi kpi--alert" type="button" aria-pressed="true">
    <span class="kpi__label">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Quá hạn</span>
    <span class="kpi__value">7</span>
    <span class="kpi__note">Cũ nhất: trễ 12 ngày</span>
  </button>
  <div class="card kpi">
    <span class="kpi__label">Chi phí tháng 10</span>
    <span class="kpi__value">1.284.500 <small>₫</small></span>
    <span class="kpi__note">Ngân sách còn 0 ₫</span>
  </div>
</section>
```
```css
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:16px 0}
.kpi{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:16px;text-align:left;
  font:inherit;color:var(--text-primary,#111827);min-width:0}
button.kpi{cursor:pointer}
button.kpi:hover{border-color:var(--text-placeholder,#9ca3af)}
button.kpi:focus-visible{outline:2px solid var(--brand-primary,#4f46e5);outline-offset:2px}
.kpi[aria-pressed="true"]{border-color:var(--brand-primary,#4f46e5)}
.kpi__label{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;
  color:var(--text-secondary,#4b5563)}
.kpi__value{font-size:24px;font-weight:700;line-height:1.2;font-variant-numeric:tabular-nums;
  overflow-wrap:anywhere}
.kpi__value small{font-size:14px;font-weight:600}
.kpi__note{font-size:12px;color:var(--text-secondary,#4b5563)}
.kpi--alert .kpi__label,.kpi--alert .kpi__value{color:var(--danger,#dc2626)}
@media (max-width:767px){.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
```
`.card` lấy từ `form.md` (viền 1px, radius 8px, **không shadow** — thẻ không nổi).

## Trạng thái bắt buộc
- Vùng theo `states.md`: `loading` = đúng số thẻ, mỗi thẻ một thanh nhãn ngắn + một khối số cao 24px (`.sk` cao 24px); `error` = một khối lỗi cho cả hàng (không lặp 4 lần "Lỗi"); `empty` = số `0` thật, **không** thay thẻ bằng hình minh hoạ.
- Thẻ bấm được: default · hover · focus · đang chọn (`aria-pressed="true"`); bấm lại bỏ chọn.
- Vai trò thấy phạm vi khác (Member: việc của tôi, Lead: cả nhóm) → nhóm `role`, nhãn đổi theo ("Việc của tôi" / "Việc của nhóm").

## Ca biên
- Số lớn `1.284.500`: không tràn thẻ ở 375px (2 cột) — đơn vị nhỏ hơn số, xuống dòng được.
- `0` là giá trị hợp lệ, hiện `0` kèm câu ngữ cảnh — không ẩn thẻ, không gạch ngang.
- Số trên thẻ **khớp** số đếm của danh sách cùng màn (thẻ "Quá hạn 7" ⇔ lọc ra đúng 7 dòng; tổng ⇔ "Hiển thị 20 / 1.284").
- Chỉ **một** thẻ được mang tín hiệu mạnh (`kpi--alert`) — thường là thứ cần hành động ngay; còn lại trung tính.
- Nhãn dài ("Công việc chờ khách hàng phản hồi quá 3 ngày") xuống dòng, không cắt.

## Lỗi đã gặp
- **S02:** thẻ thống kê dùng `border-radius:16px` + `box-shadow:var(--shadow-card)` cho khối tĩnh — shadow ngoài lớp nổi, radius ngoài thang; skeleton `.sk-stat` cũng bo `16px` riêng.
- **S02:** cảnh báo quá hạn chèn emoji bằng CSS `.stat.warn .lbl::after{content:" ⚠"}` — không thấy trong HTML, `check-design` phải soi cả `content:`.
- **S02:** 5 thẻ đều là `<button>` nhưng không có `aria-pressed` — người dùng bàn phím không biết thẻ nào đang lọc (chỉ `.selected` đổi viền).
- **S02:** dữ liệu mẫu toàn số 1–2 chữ số (`24`, `8`, `6`, `9`, `1`) — không thử số lớn, không thử `0`.

## Trace
- Mỗi thẻ là một chỉ số có định nghĩa ở `srs.md` → comment `<!-- R-S02-02: Quá hạn = deadline < now và chưa Hoàn thành -->` trên thẻ; định nghĩa nằm ở srs, không viết lại trong chữ người dùng thấy.
- Lỗi tải số liệu dùng chung mã với lỗi tải danh sách nếu srs gộp (vd `E-S02-01`), `data-trace` trên khối lỗi của hàng thẻ.
