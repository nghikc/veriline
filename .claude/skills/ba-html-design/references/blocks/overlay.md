# Khối `overlay` — modal form · xác nhận phá huỷ · toast

## Dùng khi
- **Modal form**: nhập ngắn (≤6 trường) không đáng một màn riêng — tạo nhanh, từ chối kèm lý do.
- **Xác nhận**: thao tác **không hoàn tác được** hoặc ảnh hưởng người khác (huỷ việc, vô hiệu hoá tài khoản).
- **Toast**: báo kết quả thao tác vừa làm, tự tắt; không chứa quyết định.

## Không dùng khi
- Form dài, nhiều bước, cần dán/tra cứu → màn riêng với `form.md`.
- Thao tác hoàn tác được (lưu trữ, ẩn) → làm luôn + toast có nút "Hoàn tác", không hỏi xác nhận.
- Lỗi cần người dùng đọc và sửa → `field__error`/`notice` tại chỗ (`form.md`, `states.md`), không toast.

## Markup canon
```html
<!-- Mở bằng setState('confirm-cancel') của shell — nút statebar nhóm biz, hoặc nút trên trang -->
<div class="modal__backdrop state-block state-confirm-cancel">
  <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="cfH" aria-describedby="cfD">
    <div class="modal__head">
      <h2 id="cfH" class="modal__title">Huỷ công việc “Chuẩn hoá tài liệu đặc tả API cổng thanh toán nội địa và quốc tế…”?</h2>
      <button class="btn btn--ghost btn--icon" type="button" aria-label="Đóng" onclick="setState('default')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
    </div>
    <div id="cfD">
      <p>Sau khi huỷ:</p>
      <ul class="modal__list"><li>Lê C nhận thông báo, không cập nhật tiến độ được nữa.</li>
        <li>0 bình luận và 12 lượt lịch sử vẫn xem được.</li></ul>
      <p class="modal__muted">Không hoàn tác được.</p>
    </div>
    <div class="modal__foot">
      <button class="btn btn--secondary" type="button" autofocus onclick="setState('default')">Giữ lại</button>
      <button class="btn btn--danger-solid" type="button">Huỷ công việc</button>
    </div>
  </div>
</div>

<!-- Modal form: ruột theo form.md; foot giống trên, nút chính btn--primary -->
<div class="modal__backdrop state-block state-reject">
  <form class="modal" role="dialog" aria-modal="true" aria-labelledby="rjH">
    <div class="modal__head"><h2 id="rjH" class="modal__title">Từ chối kết quả</h2></div>
    <div class="field">…<!-- form.md: label · textarea · field__count 0/1000 · field__error --></div>
    <div class="modal__foot"><button class="btn btn--secondary" type="button">Đóng</button>
      <button class="btn btn--primary" type="submit">Gửi lý do</button></div>
  </form>
</div>

<!-- Toast: thành công = status, thất bại = alert -->
<div class="toast state-block state-saved" role="status">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
  Đã lưu thay đổi cho “Công ty TNHH Thương mại và Dịch vụ Kỹ thuật Hoàng Gia…”
</div>
```
```css
body[data-state="confirm-cancel"] .state-confirm-cancel,
body[data-state="reject"] .state-reject,
body[data-state="saved"] .state-saved{display:block}

.modal__backdrop{position:fixed;inset:0;z-index:100;overflow-y:auto;padding:40px 16px;
  background:rgba(17,24,39,.5)}                      /* nền tối phẳng, không làm mờ */
.modal{max-width:480px;margin:0 auto;padding:24px;background:var(--surface-card,#fff);
  border-radius:8px;box-shadow:var(--shadow-overlay,0 12px 32px rgba(0,0,0,.18));
  display:flex;flex-direction:column;gap:16px;animation:modal-in .2s ease-out}
@keyframes modal-in{from{opacity:0;transform:scale(.98)}}
.modal__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.modal__title{font-size:20px;font-weight:700;line-height:1.3;overflow-wrap:anywhere}
.modal__list{margin:8px 0 0;padding-left:20px;display:grid;gap:4px}
.modal__muted{font-size:14px;color:var(--text-secondary,#4b5563)}
.modal__foot{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}
.btn--danger-solid{background:var(--danger,#dc2626);color:#fff}
.toast{position:fixed;z-index:110;right:24px;bottom:24px;max-width:400px;padding:12px 16px;
  border-radius:8px;background:var(--text-primary,#111827);color:#fff;font-size:14px;
  box-shadow:var(--shadow-overlay,0 12px 32px rgba(0,0,0,.18));overflow-wrap:anywhere}
.toast svg{vertical-align:-3px;margin-right:8px}
.toast--error{background:var(--danger,#dc2626)}
@media (max-width:767px){
  .modal__backdrop{padding:16px}
  .modal__foot .btn{flex:1 1 auto}
  .toast{left:16px;right:16px;max-width:none}
}
@media (prefers-reduced-motion:reduce){.modal{animation:none}}
```
`.modal__backdrop` và `.toast` chạy được với `display:block` của `.state-block` — modal căn giữa bằng `margin:0 auto`, không cần flex.

## Trạng thái bắt buộc
- Mỗi modal/toast một lớp `state-<tên>` → nút nhóm `biz` của statebar (người duyệt mở được mà không cần bấm theo luồng).
- Modal form: mở · lỗi ô (`state-e-s..`, theo `form.md`) · đang gửi (nút `aria-busy`) · thất bại giữ nguyên dữ liệu (`notice--danger` trong modal).
- Toast: thành công (`role="status"`) · thất bại (`toast--error`, `role="alert"`, kèm việc làm tiếp: "Thử lại").

## Ca biên
- Tên đối tượng ~200 ký tự trong tiêu đề xác nhận → cắt bằng `…` trong chữ, tên đủ vẫn ở màn chính; toast cũng thế (`overflow-wrap`, `max-width`).
- Ở 375px: modal cao hơn màn → backdrop cuộn, nút chân không bị đẩy khỏi màn; toast giãn `left/right:16px`, không cuộn ngang.
- Hệ quả có số `0` ("0 bình luận") vẫn liệt kê — người dùng cần biết là không mất gì.
- Nút an toàn nhận focus đầu (`autofocus`), Esc = đóng. Nút phá huỷ **nêu đúng hành động** ("Huỷ công việc", "Vô hiệu hoá"), không "OK"/"Đồng ý".

## Lỗi đã gặp
- **Hai tên cho cùng nền modal:** `modal-backdrop` (S02) · `backdrop` (S03, S05), cả hai bật bằng `.open` riêng. Canon §6a: `modal__backdrop`, bật bằng `body[data-state]`.
- **"Huỷ" hai nghĩa:** S03 modal Từ chối có nút đóng "Huỷ bỏ" trên màn mà hành động phá huỷ chính là "Huỷ công việc"; S05 hộp "Vô hiệu hoá" đặt "Huỷ bỏ" cạnh nút phá huỷ. Nút đóng ghi "Giữ lại"/"Đóng".
- **S03:** hộp xác nhận "Huỷ công việc" không có nút × trong khi hai modal khác cùng màn có.
- **S02:** modal xuất báo cáo cho hai lựa chọn ngang hàng (PDF / Excel) hai cấp nút khác nhau (`btn-ghost` / `btn-primary`), icon emoji `📄 📊`, bố cục bằng `style="…"` inline.
- **Nút đóng là ký tự chữ:** `✕` (S02) · `×` (S03, S05) — dùng SVG `aria-hidden` + `aria-label="Đóng"`.
- **S02:** toast `left:50%;transform:translate(-50%,…)` không `max-width` — câu dài ở 375px tràn ngang. Tên lệch: `toast` (S02–S05) · `snackbar` (S01, S06).
- **S03:** toast lỗi tô `#7F1D1D` hex cứng thay token `danger`.

## Trace
- Hộp xác nhận tồn tại vì một rule → comment `<!-- R-S03-12 -->` ngay trên `modal__backdrop`; danh sách hệ quả lấy từ srs, không tự nghĩ thêm.
- Lỗi trong modal (`E-S..` mất kết nối khi gửi, ô sai) → `data-trace` trên `notice`/`field__error` bên trong modal + nút statebar nhóm `error`.
- Toast thất bại có mã E-S riêng → `data-trace` trên `.toast--error`.
