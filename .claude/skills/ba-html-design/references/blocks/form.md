# Khối `form` — nhập / sửa dữ liệu

## Dùng khi
Màn hoặc card có ô nhập cần lưu: tạo mới, sửa hồ sơ, cài đặt, đăng nhập/đăng ký. Form nằm **trong modal** → khung modal lấy ở `overlay.md`, ruột (các `field`) vẫn theo file này.

## Không dùng khi
- Chỉ hiển thị thuộc tính, sửa nằm ở màn/modal khác → `detail.md`.
- Ô tìm kiếm + bộ lọc trên danh sách → thanh lọc của `table-list.md` (không có nút Lưu, không lỗi từng ô).

## Markup canon
```html
<form class="card form" novalidate aria-labelledby="orgH">
  <h2 id="orgH" class="card__title">Thông tin tổ chức</h2>

  <!-- Lỗi cấp form (lưu thất bại) — đặt ĐẦU form để trình đọc màn hình gặp trước -->
  <div class="state-block state-e-s05-06" data-trace="E-S05-06">
    <p class="notice notice--danger" role="alert">Không lưu được — mất kết nối. Dữ liệu bạn nhập vẫn còn, bấm Lưu để thử lại.</p>
  </div>

  <div class="field" id="f-name">
    <label class="field__label" for="orgName">Tên tổ chức <span class="field__req" aria-hidden="true">*</span></label>
    <input class="field__input" id="orgName" required maxlength="100" aria-describedby="orgNameCount orgNameErr"
           value="Công ty TNHH Thương mại và Dịch vụ Kỹ thuật Hoàng Gia Phát Triển Bền Vững Đồng bằng Sông Cửu Long">
    <p class="field__count" id="orgNameCount">97/100</p>
    <p class="field__error state-block state-e-s05-03" id="orgNameErr" data-trace="E-S05-03">Vui lòng nhập tên tổ chức.</p>
  </div>

  <div class="field">
    <label class="field__label" for="plan">Gói dịch vụ</label>
    <select class="field__input" id="plan"><option>Cơ bản — 0 ₫/tháng</option><option selected>Doanh nghiệp — 1.284.500 ₫/tháng</option></select>
  </div>

  <!-- Trường khoá: hiện giá trị + LÝ DO không sửa được, không phải ô disabled câm -->
  <div class="field field--locked">
    <span class="field__label">Đường dẫn</span>
    <p class="field__value">acme.teamtasks.vn</p>
    <p class="field__hint">Đặt lúc tạo tổ chức, không đổi được.</p>
  </div>

  <div class="form__foot">
    <button class="btn btn--secondary" type="button">Bỏ thay đổi</button>
    <button class="btn btn--primary" type="submit">Lưu thay đổi</button>
  </div>
</form>
```
```css
body[data-state="e-s05-03"] .state-e-s05-03,
body[data-state="e-s05-06"] .state-e-s05-06{display:block}
body[data-state="e-s05-03"] #f-name .field__input{border-color:var(--danger,#dc2626)}

.card{background:var(--surface-card,#fff);border:1px solid var(--border,#e5e7eb);border-radius:8px;padding:24px}
.card__title{font-size:16px;font-weight:600;margin:0 0 16px}
.form{display:flex;flex-direction:column;gap:16px;max-width:640px}
.field{display:flex;flex-direction:column;gap:4px;min-width:0}
.field__label{font-size:14px;font-weight:600;color:var(--text-primary,#111827)}
.field__req{color:var(--danger,#dc2626)}
.field__input{font:inherit;font-size:16px;min-height:44px;padding:8px 12px;width:100%;
  border:1px solid var(--border,#d1d5db);border-radius:8px;background:var(--surface-card,#fff);
  color:var(--text-primary,#111827)}
.field__input:focus-visible{outline:none;border-color:var(--brand-primary,#4f46e5);
  box-shadow:0 0 0 3px rgba(79,70,229,.25)}          /* focus ring — không tính vào ngân sách shadow */
.field__input:disabled{background:var(--surface-hover,#f3f4f6);color:var(--text-secondary,#4b5563)}
.field__count{font-size:12px;color:var(--text-secondary,#4b5563);text-align:right;font-variant-numeric:tabular-nums}
.field__hint{font-size:12px;color:var(--text-secondary,#4b5563)}
.field__error{font-size:12px;color:var(--danger,#dc2626)}
.field__value{font-weight:600;overflow-wrap:anywhere}
.form__foot{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;padding-top:8px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;
  padding:8px 16px;border-radius:8px;border:1px solid transparent;font:inherit;font-size:14px;
  font-weight:600;cursor:pointer}
.btn--primary{background:var(--brand-primary,#4f46e5);color:#fff}
.btn--secondary{background:var(--surface-card,#fff);border-color:var(--border,#d1d5db);color:var(--text-primary,#111827)}
.btn:disabled,.btn[aria-busy="true"]{opacity:.6;cursor:not-allowed}
@media (max-width:767px){.form__foot .btn{flex:1 1 auto}}
```
Nút đang gửi: `<button class="btn btn--primary" aria-busy="true" disabled>` + SVG vòng quay `aria-hidden` + chữ "Đang lưu…" — giữ nguyên bề rộng nút.

## Trạng thái bắt buộc
- Mỗi `field`: default · focus · error · disabled (07 §6a). Lỗi của ô = một ca `E-S` → nút nhóm `error` của statebar, `field__error` mang `state-block state-e-s..`.
- Cấp form: lỗi lưu (`notice--danger`, `role="alert"`) · đang lưu (nút `aria-busy`) · lưu xong → toast (`overlay.md`).
- Trường khoá theo vai trò → biến thể nhóm `role`, không phải ô `disabled` không lời giải thích.

## Ca biên
- Tên ~200 ký tự (hoặc sát `maxlength`): ô không tràn, bộ đếm `97/100` hiện đúng, giá trị ở chế độ chỉ đọc xuống dòng (`overflow-wrap:anywhere`).
- Ô số: `0` hợp lệ khác ô rỗng; số tiền viết `1.284.500 ₫` (dấu chấm hàng nghìn), `inputmode="numeric"`.
- Một ô có **≥2 lỗi khác nhau** (rỗng / quá dài) → mỗi ca một `state-e-s..`, cùng vị trí `field__error`.
- Ở 375px: hai cột gộp về một, nút chân form giãn đều; `font-size:16px` cho ô (tránh iOS tự phóng to).
- Nhãn "Huỷ" bên cạnh nút phá huỷ → đổi thành "Bỏ thay đổi"/"Đóng" (xem `overlay.md`).

## Lỗi đã gặp
- **4 tên cho cùng một dòng lỗi ô:** `field-error` (S01, S06) · `inline-error` (S02–S05); bật bằng `.visible` (S01, S06) hay `.show` (S02–S05). Lỗi cấp form thì `alert` (S01) · `form-error` (S04, S05). Canon: `field__error` + `notice--danger`, bật bằng `body[data-state]`.
- **3 hợp đồng nút:** `btn-primary`/`btn-ghost` không có lớp gốc (S02) · `btn btn-primary` (S03–S05) · `btn-submit` (S01, S06). Canon §6a: `btn btn--primary`.
- **S06:** `.helper-text{font-size:11.5px;color:#6b7280;margin-top:-2px}` — cỡ chữ ngoài thang, hex cứng thay token, margin âm không lý do (`DS-HEX`, `DS-NEGMARGIN`).
- **S02, S05:** dữ liệu mẫu toàn tên 2–3 chữ ("Lê C", "Nguyễn A", "Acme") — không ca nào thử tên dài nên không biết ô/nhãn có tràn.

## Trace
- `data-trace="E-S..-.."` trên `field__error` và khối `notice--danger` của ca đó, trùng mã với nút statebar.
- Ràng buộc (`required`, `maxlength="100"`) lấy đúng từ `R-S..` của srs — ghi `<!-- R-S05-04 -->` cạnh ô khi con số đến từ rule.
