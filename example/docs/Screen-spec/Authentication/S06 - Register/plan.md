# Kế hoạch build — Đăng ký (Mã màn: S06)

**Goal:** Dựng màn hình Đăng ký hoàn chỉnh với form 4 trường, thanh đo độ mạnh mật khẩu, validate client-side, xử lý lỗi email trùng từ API, tạo tổ chức và auto-login sau khi đăng ký thành công.
**Tài liệu nguồn:** srs.md, usecase.md, test.md, html-design.html (cùng folder).

---

## Task 1: API route POST /auth/register (backend)
**Trace test:** TC-S06-01, TC-S06-07, TC-S06-09, TC-S06-13
**Proof:** `npx jest tests/modules/auth/dang-ky.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/auth/dang-ky.service.ts`
- Test: `tests/modules/auth/dang-ky.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S06-07 (email đã tồn tại → 409) và TC-S06-01 (đăng ký thành công → 201 + tạo org + trả token)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement endpoint — validate input (email, password ≥ 8 ký tự có chữ + số, ten_to_chuc bắt buộc), kiểm tra email unique, hash mật khẩu bcrypt cost=12, tạo bản ghi User + Organization, gán vai trò OrgAdmin, phát hành access_token + refresh_token
- [ ] Step 4: Viết thêm test TC-S06-13 (ten_to_chuc rỗng → 422), TC-S06-09 (mật khẩu yếu → 422)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(auth): implement register endpoint with org creation and bcrypt hashing`

**Definition of Done:** 4 TC trace ở trên pass · không lỗi lint · không lỗi typecheck.

## Task 2: Kiểm tra bcrypt cost ≥ 12 (bảo mật)
**Phụ thuộc:** Task 1
**Trace test:** TC-S06-01 *(kiểm gián tiếp: sau khi đăng ký thành công, đọc bản ghi người dùng và khẳng định `mat_khau_hash` bắt đầu bằng `$2b$12$` — không TC nào ở tầng giao diện thấy được cost, nhưng bỏ trắng dòng trace thì task này lọt khỏi mọi báo cáo độ phủ)*
**Proof:** `npx jest tests/modules/auth/dang-ky.test.ts` — exit 0 = đạt
**Files:**
- Test: `tests/modules/auth/dang-ky.test.ts` (bổ sung)

- [ ] Step 1: Viết test xác nhận mật khẩu được hash với cost factor đúng 12 (dùng bcrypt.getRounds() sau khi tạo user) — trace R-S06-N01
- [ ] Step 2: Chạy test, xác nhận PASS với implementation ở Task 1
- [ ] Step 3: Commit `test(auth): verify bcrypt cost factor 12 for register endpoint`

**Definition of Done:** 1 TC trace ở trên pass · không lỗi lint · không lỗi typecheck.

## Task 3: Route guard cho /register (frontend)
**Trace test:** TC-S06-17
**Proof:** `npx jest tests/shared/guard-dieu-huong.test.ts` — exit 0 = đạt
**Files:**
- Edit: `src/middleware/auth-guard.ts`
- Test: `tests/shared/guard-dieu-huong.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S06-17 (đã đăng nhập → /register redirect về /dashboard)
- [ ] Step 2: Mở rộng middleware hiện có — thêm rule: nếu có session hợp lệ và đang truy cập /register → redirect /dashboard
- [ ] Step 3: Chạy test, xác nhận PASS
- [ ] Step 4: Commit `feat(auth): redirect logged-in users away from register page`

**Definition of Done:** 1 TC trace ở trên pass · không lỗi lint · không lỗi typecheck.

## Task 4: Utility đo độ mạnh mật khẩu (frontend)
**Trace test:** TC-S06-09, TC-S06-10
**Proof:** `npx jest tests/domain/do-manh-mat-khau.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/domain/do-manh-mat-khau.ts`
- Test: `tests/domain/do-manh-mat-khau.test.ts`

- [ ] Step 1: Viết test cho TC-S06-09 (< 8 ký tự → "Yếu"), TC-S06-10 (chỉ chữ → "Yếu"), GWT-7 (`Abc12345` → "Trung bình"), GWT-9 (`Abc12345@xyz` → "Mạnh")
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement hàm `getPasswordStrength(password: string): "Yếu" | "Trung bình" | "Mạnh"` — logic: Yếu (< 8 ký tự hoặc thiếu chữ số/chữ cái), Trung bình (≥ 8 ký tự có chữ và số), Mạnh (Trung bình + có ký tự đặc biệt HOẶC ≥ 12 ký tự — theo R-S06-N02)
- [ ] Step 4: Chạy test, xác nhận PASS
- [ ] Step 5: Commit `feat(auth): password strength utility with three-tier classification`

**Definition of Done:** 2 TC trace ở trên pass · không lỗi lint · không lỗi typecheck.

## Task 5: Component RegisterForm (frontend)
**Phụ thuộc:** Task 4
**Trace test:** TC-S06-03, TC-S06-06, TC-S06-11, TC-S06-12, TC-S06-13, TC-S06-14, TC-S06-15, TC-S06-19, TC-S06-20
**Proof:** `npx jest tests/components/auth/register-form.test.tsx` — exit 0 = đạt
**Files:**
- Create: `src/components/auth/RegisterForm.tsx`
- Test: `tests/components/auth/register-form.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S06-06 (email sai định dạng → lỗi inline, không gọi API), TC-S06-14 (email rỗng), TC-S06-15 (mật khẩu rỗng), TC-S06-13 (tên tổ chức rỗng)
- [ ] Step 2: Implement component — 4 trường input, validate client-side khi blur, thông báo lỗi inline theo từng trường, nút "Tạo tài khoản" disable khi còn lỗi
- [ ] Step 3: Viết thêm test TC-S06-11 (mật khẩu xác nhận không khớp), TC-S06-12 (sửa để khớp → lỗi biến mất), TC-S06-19 (toggle hiện/ẩn độc lập mỗi trường), TC-S06-03 (trim email/tên tổ chức)
- [ ] Step 4: Chạy tất cả test, xác nhận PASS
- [ ] Step 5: Commit `feat(auth): RegisterForm component with per-field inline validation`

**Definition of Done:** 9 TC trace ở trên pass · không lỗi lint · không lỗi typecheck.

## Task 6: Component PasswordStrengthMeter (frontend)
**Phụ thuộc:** Task 4
**Trace test:** TC-S06-16, TC-S06-21, TC-S06-22
**Proof:** `npx jest tests/components/auth/password-strength-meter.test.tsx` — exit 0 = đạt
**Files:**
- Create: `src/components/auth/PasswordStrengthMeter.tsx`
- Test: `tests/components/auth/password-strength-meter.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S06-16 (thanh xuất hiện khi gõ ký tự đầu, cập nhật theo thời gian thực, ẩn khi trống), TC-S06-21 (thanh ẩn khi xoá hết), TC-S06-22 (cập nhật sau paste)
- [ ] Step 2: Implement component — nhận prop `password: string`, render thanh tiến trình với màu và nhãn tương ứng; ẩn khi password rỗng; dùng utility từ Task 4
- [ ] Step 3: Thêm aria-label mô tả mức độ bằng chữ (trace R-S06-N07)
- [ ] Step 4: Chạy test, xác nhận PASS
- [ ] Step 5: Commit `feat(auth): PasswordStrengthMeter component with real-time feedback and a11y`

**Definition of Done:** 3 TC trace ở trên pass · không lỗi lint · không lỗi typecheck.

## Task 7: Xử lý submit, loading state và lỗi API (frontend)
**Phụ thuộc:** Task 5
**Trace test:** TC-S06-07, TC-S06-08, TC-S06-18
**Proof:** `npx jest tests/components/auth/register-form.test.tsx` — exit 0 = đạt
**Files:**
- Edit: `src/components/auth/RegisterForm.tsx`
- Test: `tests/components/auth/register-form.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S06-07 (API 409 → lỗi email trùng inline), TC-S06-18 (mạng lỗi → snackbar + giữ form), TC-S06-08 (sửa email sau lỗi trùng → form xử lý lại)
- [ ] Step 2: Implement — loading state (tất cả trường + nút disabled + spinner), xử lý 409 (hiển thị lỗi email inline), xử lý timeout/network error (snackbar), enable lại form sau lỗi
- [ ] Step 3: Chạy tất cả test, xác nhận PASS
- [ ] Step 4: Commit `feat(auth): register form submit, loading state, and API error handling`

**Definition of Done:** 3 TC trace ở trên pass · không lỗi lint · không lỗi typecheck.

## Task 8: Màn hình RegisterPage (frontend)
**Phụ thuộc:** Task 5, Task 6
**Trace test:** TC-S06-01, TC-S06-02, TC-S06-04 *(TC-S06-05 — phần hiển thị tên org/vai trò thuộc màn S02 Dashboard; S06 chỉ chứng minh session đã lưu đủ trường)*
**Proof:** `npx jest tests/components/auth/register-page.test.tsx` — exit 0 = đạt
**Files:**
- Create: `src/app/(auth)/register/page.tsx`
- Test: `tests/components/auth/register-page.test.tsx`

- [ ] Step 1: Viết test TC-S06-01 (end-to-end: đăng ký thành công → redirect Dashboard), TC-S06-02 (Enter key submit từ trường cuối), TC-S06-04 (thứ tự Tab đúng)
- [ ] Step 2: Compose RegisterPage từ RegisterForm + PasswordStrengthMeter + logo + layout; thêm link "Đã có tài khoản? Đăng nhập" điều hướng về /login; kết nối auth-guard (Task 3)
- [ ] Step 3: Test accessibility: aria-label, role="alert" cho lỗi, aria-live cho thanh độ mạnh, thứ tự Tab
- [ ] Step 4: Chạy test, xác nhận PASS
- [ ] Step 5: Commit `feat(auth): RegisterPage with full form, strength meter, and accessibility`

**Definition of Done:** 4 TC trace ở trên pass · không lỗi lint · không lỗi typecheck.
