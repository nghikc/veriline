# Kế hoạch build — Hồ sơ cá nhân (Mã màn: S04)

**Goal:** Dựng màn tự phục vụ hồ sơ (F10): xem hồ sơ của chính mình, sửa họ tên + ảnh đại diện, và đổi mật khẩu có thu hồi mọi phiên khác — hai form tách biệt, hai lời gọi API riêng.
**Tài liệu nguồn:** srs.md, usecase.md, test.md, html-design.html (cùng folder).
**Kiến trúc:** bám `docs/10-architecture.md` §5 (module `org` giữ F10, module `auth` giữ phiên/mật khẩu) và §10. ADR-01…ADR-04 đã `Accepted`.

> ⚠️ **Ghi chú đường dẫn frontend.** `10-architecture.md` §10 mới định nghĩa cây thư mục **backend**. Đường dẫn `web/...` dưới đây theo quy ước Next.js App Router — **cần bổ sung vào §10 rồi rà lại**.

**Thứ tự phụ thuộc:**
`Task 1` → `Task 5` · `Task 2` → `Task 6` · `Task 3` → `Task 4` → `Task 7` · `Task 8` cần Task 6 · `Task 9` chạy cuối (cần Task 5–8).
Tái dùng: thanh đo độ mạnh mật khẩu + luật mật khẩu **dùng chung component với S06 Đăng ký** (không viết bản thứ hai), guard `auth-guard` từ plan S01.

---

## Task 1: API `GET /users/me` — hồ sơ của chính người đăng nhập
**Phụ thuộc:** không (nền tảng)
**Trace test:** TC-S04-01, TC-S04-05, TC-S04-07
**Proof:** `npx jest tests/modules/org/get-profile.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/org/profile.controller.ts`, `src/modules/org/profile.service.ts`, `src/modules/org/user.repository.ts`
- Test: `tests/modules/org/get-profile.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S04-07 — **không tồn tại** đường nào đọc hồ sơ người khác từ endpoint này, kể cả khi biết id (`BRule-S04-01`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — id người dùng lấy **từ JWT**, endpoint **không nhận tham số id** dưới bất kỳ dạng nào; trả đủ 6 thông tin
- [ ] Step 4: Viết thêm test TC-S04-01 (đủ 6 thông tin khớp response), TC-S04-05 (chưa xác thực → 401/redirect `/login`, không kịp lộ dữ liệu)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(org): endpoint ho so ca nhan chi doc cua chinh minh`

**Definition of Done:** 3 TC trace pass · test khẳng định route **không có** biến path/query nào nhận id · không lỗi lint.

---

## Task 2: API `PATCH /users/me` — sửa họ tên + ảnh đại diện
**Phụ thuộc:** Task 1
**Trace test:** TC-S04-09, TC-S04-13, TC-S04-14, TC-S04-16, TC-S04-19
**Proof:** `npx jest tests/modules/org/update-profile.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/org/update-profile.service.ts`
- Modify: `src/modules/org/profile.controller.ts`
- Test: `tests/modules/org/update-profile.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S04-19 — gửi kèm `email` hoặc `vai_tro` trong body thì **hai trường đó bị bỏ qua hoàn toàn** (`BRule-S04-02`, `BRule-S04-03`), không phải trả lỗi rồi vẫn ghi
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — danh sách trắng đúng 2 trường (`ho_ten`, `anh_dai_dien_url`); validate 1–100 ký tự và tiền tố `https://` (`BRule-S04-08`)
- [ ] Step 4: Viết thêm test TC-S04-09 (lưu thành công), TC-S04-13 (101 ký tự → 422), TC-S04-14 (đúng 100 ký tự → 200), TC-S04-16 (`http://` và `data:` đều bị từ chối)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(org): cap nhat ho ten va anh dai dien`

**Definition of Done:** 5 TC trace pass · test khẳng định vai trò trong DB **không đổi** sau request cố tình nâng quyền · chỉ gửi trường đã đổi lên · không lỗi lint.

---

## Task 3: Luật mật khẩu dùng chung với S06 (nền tảng)
**Phụ thuộc:** không (nền tảng)
**Trace test:** TC-S04-29, TC-S04-30, TC-S04-31
**Proof:** `npx jest tests/domain/auth/password-policy.test.ts` — exit 0 = đạt
**Files:**
- Modify: `src/domain/auth/password-policy.ts` (đã tạo ở plan S06 — **tái dùng, không tạo bản mới**)
- Test: `tests/domain/auth/password-policy.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S04-31 — chuỗi đủ dài nhưng **thiếu chữ số** phải bị từ chối, cùng thông báo với S06
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Xác nhận `password-policy.ts` của S06 đã phủ đủ luật; nếu thiếu thì **bổ sung tại đó**, không viết luật riêng cho S04
- [ ] Step 4: Viết thêm test TC-S04-29 (7 ký tự → từ chối), TC-S04-30 (đúng 8 ký tự có chữ + số → chấp nhận)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `test(auth): phu them bien luat mat khau cho luong doi mat khau`

**Definition of Done:** 3 TC trace pass · **grep toàn repo chỉ ra đúng một** nơi định nghĩa luật mật khẩu · nhãn độ mạnh giống hệt S06 · không lỗi lint.

---

## Task 4: API `PATCH /users/me/password` — đổi mật khẩu + thu hồi phiên khác
**Phụ thuộc:** Task 3
**Trace test:** TC-S04-24, TC-S04-25, TC-S04-26, TC-S04-33, TC-S04-34, TC-S04-36, TC-S04-37, TC-S04-38, TC-S04-41
**Proof:** `npx jest tests/modules/auth/change-password.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/auth/change-password.service.ts`, `src/modules/auth/session.repository.ts`
- Test: `tests/modules/auth/change-password.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S04-33 — sau khi đổi thành công, **phiên hiện tại còn sống** nhưng phiên trên trình duyệt kia nhận `401` ở lời gọi kế tiếp (`BRule-S04-06`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — bắt buộc đúng mật khẩu hiện tại (`BRule-S04-04`), chặn mật khẩu mới trùng cũ (`BRule-S04-05`), hash bcrypt cost 12 (ADR-03), thu hồi mọi refresh token **trừ** token của phiên đang gọi
- [ ] Step 4: Viết test TC-S04-25 (sai mật khẩu hiện tại → 400/401, mật khẩu trong DB **không đổi**), TC-S04-26 (mới trùng cũ → từ chối), TC-S04-24 (đổi xong đăng nhập lại bằng mật khẩu mới được), TC-S04-34 (chỉ một thiết bị → không có gì để thu hồi, vẫn 200)
- [ ] Step 5: Viết test TC-S04-36 (5 lần sai trong 15 phút → khoá 15 phút, dùng chung bộ đếm Redis của `NFR-03`), TC-S04-37 (bản ghi DB là hash bcrypt cost ≥ 12, **không** plaintext), TC-S04-38 (bật log debug: mật khẩu **không** xuất hiện trong log/URL/query — `R-S04-N03`)
- [ ] Step 6: Chạy tất cả test, xác nhận PASS
- [ ] Step 7: Commit `feat(auth): doi mat khau kem thu hoi phien khac`

**Definition of Done:** 8 TC trace pass · người đổi mật khẩu **không bị đá khỏi phiên hiện tại** · không có chuỗi mật khẩu nào lọt vào log ở mức debug · không lỗi lint.

---

## Task 5: Khối nhận diện + ảnh đại diện dự phòng (frontend)
**Phụ thuộc:** Task 1
**Trace test:** TC-S04-01, TC-S04-02, TC-S04-03, TC-S04-04, TC-S04-06
**Proof:** `npx jest tests/web/identity-card.test.tsx` — exit 0 = đạt
**Files:**
- Create: `web/app/profile/page.tsx`, `web/components/profile/IdentityCard.tsx`, `web/components/common/Avatar.tsx`
- Test: `tests/web/identity-card.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S04-03 — ảnh trỏ tới URL chết → rơi về **chữ cái đầu**, **không** hiện biểu tượng ảnh vỡ và **không** báo lỗi
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement `Avatar` với `onError` → fallback im lặng; màu nền sinh **ổn định** từ họ tên (`BRule-S04-07`) — cùng tên cho cùng màu, kiểm bằng test hai lần render
- [ ] Step 4: Viết test TC-S04-02 (url rỗng → chữ cái đầu viết hoa), TC-S04-04 (email/vai trò/tổ chức hiển thị dạng **dòng văn bản có khoá + câu giải thích**, không nằm trong ô nhập nào), TC-S04-01 (đủ 6 thông tin), TC-S04-06 (500 → khối lỗi + "Thử lại", header vẫn còn)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(web): khoi nhan dien ho so va avatar du phong`

**Definition of Done:** 5 TC trace pass · test khẳng định ba trường khoá **không** phải `<input>` · màu avatar tái lập được (deterministic) · không lỗi lint.

---

## Task 6: Form "Thông tin cá nhân" (frontend)
**Phụ thuộc:** Task 2, Task 5
**Trace test:** TC-S04-08, TC-S04-09, TC-S04-10, TC-S04-11, TC-S04-12, TC-S04-15, TC-S04-17, TC-S04-18
**Proof:** `npx jest tests/web/profile-form.test.tsx` — exit 0 = đạt
**Files:**
- Create: `web/components/profile/ProfileForm.tsx`
- Test: `tests/web/profile-form.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S04-10 — sửa rồi **hoàn tác về giá trị cũ** thì nút "Lưu thay đổi" phải disable lại (`R-S04-06`), không chỉ dựa vào cờ "đã chạm vào form"
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — so sánh với **giá trị gốc** chứ không dùng cờ dirty; bộ đếm `n/100`; nút Huỷ khôi phục giá trị gốc
- [ ] Step 4: Viết test TC-S04-08 (mở màn → nút disable), TC-S04-11/12 (rỗng và toàn khoảng trắng → lỗi), TC-S04-15 (`http://` → lỗi tiền tố), TC-S04-17 (xoá trắng ô ảnh → quay về chữ cái đầu)
- [ ] Step 5: Viết test TC-S04-09 (lưu xong: tên đổi **đồng bộ ở cả khối nhận diện và header** trong cùng một lượt), TC-S04-18 (lưu lỗi → **giữ nguyên mọi giá trị đã nhập** + báo lỗi trên form)
- [ ] Step 6: Chạy tất cả test, xác nhận PASS
- [ ] Step 7: Commit `feat(web): form thong tin ca nhan voi so sanh gia tri goc`

**Definition of Done:** 8 TC trace pass · không tồn tại trạng thái "hai nơi hiển thị hai tên khác nhau" · form không reset khi lỗi · không lỗi lint.

---

## Task 7: Form "Đổi mật khẩu" (frontend)
**Phụ thuộc:** Task 4, Task 3
**Trace test:** TC-S04-23, TC-S04-24, TC-S04-25, TC-S04-27, TC-S04-28, TC-S04-31, TC-S04-32, TC-S04-35
**Proof:** `npx jest tests/web/change-password-form.test.tsx` — exit 0 = đạt
**Files:**
- Create: `web/components/profile/ChangePasswordForm.tsx`
- Modify: `web/components/common/PasswordStrengthMeter.tsx` (đã tạo ở plan S06 — **tái dùng**)
- Test: `tests/web/change-password-form.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S04-25 — sai mật khẩu hiện tại: lỗi hiện **ngay dưới trường đó** và **hai trường mật khẩu mới giữ nguyên giá trị đã gõ** (đây là lỗi hay gặp nhất của màn)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement ba trường với `autocomplete` đúng loại (`current-password` / `new-password` ×2) để trình quản lý mật khẩu hoạt động
- [ ] Step 4: Viết test TC-S04-23 (form tách riêng — sửa họ tên **không** đòi mật khẩu), TC-S04-27 (xác nhận không khớp → lỗi khi rời ô + nút disable), TC-S04-28/31 (thanh độ mạnh hiện từ ký tự đầu, đúng 3 mức, dùng **chung component với S06**), TC-S04-32 (ba toggle 👁 độc lập nhau)
- [ ] Step 5: Viết test TC-S04-24 + TC-S04-35 (đổi xong: ba trường trắng, thanh độ mạnh biến mất, nút về disable, **người dùng vẫn ở lại màn** không bị đá về `/login`)
- [ ] Step 6: Chạy tất cả test, xác nhận PASS
- [ ] Step 7: Commit `feat(web): form doi mat khau tach biet kem thanh do manh dung chung`

**Definition of Done:** 8 TC trace pass · test khẳng định giá trị hai ô mật khẩu mới **không đổi** sau lỗi 401 · thanh độ mạnh import từ component S06, không có bản sao · không lỗi lint.

---

## Task 8: Cảnh báo rời màn khi chưa lưu (frontend)
**Phụ thuộc:** Task 6
**Trace test:** TC-S04-20, TC-S04-21, TC-S04-22
**Proof:** `npx jest tests/web/unsaved-changes.test.tsx` — exit 0 = đạt
**Files:**
- Create: `web/components/profile/UnsavedChangesDialog.tsx`
- Test: `tests/web/unsaved-changes.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S04-22 — **gõ dở mật khẩu KHÔNG tính là thay đổi chưa lưu**, rời màn không hỏi gì (khác hẳn form thông tin)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — điều kiện cảnh báo chỉ đọc trạng thái của **form 1**, không đọc form mật khẩu
- [ ] Step 4: Viết test TC-S04-20 (có thay đổi + điều hướng → hộp hai lựa chọn; "Ở lại" giữ nguyên, "Rời đi" bỏ thay đổi), TC-S04-21 (chưa sửa gì → rời thẳng, không hỏi)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(web): canh bao roi man khi form thong tin con thay doi`

**Definition of Done:** 3 TC trace pass · Esc tương đương "Ở lại" · không lỗi lint.

---

## Task 9: Khả năng tiếp cận & hiệu năng (chạy cuối)
**Phụ thuộc:** Task 5–8
**Trace test:** TC-S04-39, TC-S04-40
**Proof:** `npx jest tests/web/profile-a11y-perf.test.tsx` — exit 0 = đạt
**Files:**
- Modify: các component ở Task 5–8
- Test: `tests/web/profile-a11y-perf.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S04-39 — mọi ô nhập có `<label for/id>` thật; thứ tự Tab đúng design-spec §8; lỗi công bố qua `role="alert"`
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Bổ sung nhãn, `aria-required`, nhãn thay thế đổi theo trạng thái cho toggle 👁; kiểm tương phản ≥ 4.5:1
- [ ] Step 4: Viết test TC-S04-40 — tải màn hồ sơ ≤ 2s ở p95 với 200 người dùng đồng thời (`R-S04-N07`)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(web): hoan thien a11y va nguong hieu nang man ho so`

**Definition of Done:** 2 TC trace pass · không ô nhập nào chỉ có placeholder làm nhãn · ngưỡng p95 đo bằng số · không lỗi lint.

---

## Đối chiếu độ phủ test

| Nhóm TC | Số TC | Task phủ |
|---|---|---|
| Xem hồ sơ | 7 | Task 1, 5 |
| Sửa thông tin cá nhân | 12 | Task 2, 6, 8 |
| Đổi mật khẩu | 17 | Task 3, 4, 7 |
| A11y & hiệu năng | 4 | Task 4, 9 |
| **Tổng** | **40** | mọi TC-S04-01…40 đều có ít nhất 1 task |
