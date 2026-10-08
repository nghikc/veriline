# Kế hoạch build — Đăng nhập (Mã màn: S01)

**Goal:** Dựng màn Đăng nhập/Đăng xuất hoàn chỉnh: xác thực email/mật khẩu, đếm sai & khoá tạm/vĩnh viễn, tài khoản vô hiệu hoá, vòng đời phiên (idle 7 ngày · trần 30 ngày), buộc đổi mật khẩu tạm, và bảo vệ điều hướng.
**Tài liệu nguồn:** `srs.md`, `usecase.md`, `test.md`, `html-design.html` (cùng folder) · `10-architecture.md` §10 (cấu trúc thư mục) · `05-data-model.md`.

> **Cập nhật 2026-08-31** — viết lại sau `CR-04` (chính sách phiên), `CR-05` (luật ưu tiên) và soát gap lần 7. Bản trước có hai vấn đề: (1) chỉ nhắc 22/43 TC — 21 TC không task nào phủ; (2) đường dẫn file (`src/api/…`, `src/middleware/…`) **không khớp** §10 của `10-architecture.md` (canon: `src/modules/<module>/*.controller.ts|service.ts|repository.ts`). Bản này phủ **43/43 TC** và bám đúng §10.

> **Cấu trúc frontend:** theo §10 của `10-architecture.md` (cây Next.js App Router bổ sung 2026-08-31, đóng gap `G79`). Bản trước của plan này phải tự bịa đường dẫn FE vì §10 chỉ vẽ backend — cổng thu nợ 🟠 của `dev-run` bắt được trước khi có dòng code nào.

**Thứ tự phụ thuộc:**
`Task 1` (nền: domain + repo + endpoint login + form) chặn tất cả.
`Task 1 → Task 3 → Task 4 → Task 5` (chuỗi đếm sai → khoá tạm → khoá vĩnh viễn, phải đúng thứ tự vì cùng đụng `fail_count`/`so_lan_khoa_tam`).
`Task 1 → Task 2` · `Task 1 → Task 6` · `Task 1 → Task 7` · `Task 1 → Task 8` · `Task 1 → Task 13`.
`Task 1 → Task 10 → Task 11` (đăng xuất trước, rồi vòng đời phiên — cùng đụng bảng `PhienDangNhap`).
`Task 10 → Task 9` (guard cần biết thế nào là phiên hợp lệ).
`Task 9 → Task 12` (luật ưu tiên `CR-05` nằm trong guard; buộc đổi mật khẩu dựa lên đó).

---

## Task 1: Đăng nhập thành công — lát cắt dọc đầu tiên
**Phụ thuộc:** không (nền tảng)
**Trace test:** TC-S01-01, TC-S01-02, TC-S01-03, TC-S01-04, TC-S01-27, TC-S01-42
**Proof:** `npx jest tests/modules/auth/dang-nhap.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/domain/nguoi-dung.entity.ts`, `src/domain/phien-dang-nhap.entity.ts`
- Create: `src/domain/auth.rules.ts` (hằng số nghiệp vụ: 5 lần/15 phút · 3 chu kỳ · 8 giờ · 7 ngày · 30 ngày)
- Create: `src/infrastructure/dong-ho.ts` (cổng thời gian — luật phiên đo bằng ngày nên test **không được** `sleep`)
- Create: `src/modules/auth/auth.controller.ts`, `src/modules/auth/auth.service.ts`, `src/modules/auth/auth.repository.ts`
- Create: `src/infrastructure/db/nguoi-dung.repository.ts`, `src/shared/error-envelope.ts`
- Create: `src/app/(auth)/login/page.tsx`, `src/components/auth/LoginForm.tsx`, `src/shared/http/auth-client.ts`
- Test: `tests/modules/auth/dang-nhap.test.ts`, `tests/components/auth/login-form.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S01-01 (200 + access token + redirect `/dashboard`) và TC-S01-03 (email được **trim** trước khi gửi API)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement `POST /auth/login` — validate, tìm theo email đã trim, so bcrypt (cost 12 theo `ADR-03`), phát access token RS256 8 giờ + set `refresh_token` HttpOnly cookie
- [ ] Step 4: Implement `LoginForm` + submit + redirect; TC-S01-02 (Enter trong ô Mật khẩu = submit), TC-S01-04 (có `?redirect=` thì về đúng đó, không về `/dashboard`)
- [ ] Step 5: Viết test TC-S01-42 — API được gọi **đúng 1 lần** dù bấm 4 lần; nút loading + disable; disable cả 2 trường trong lúc chờ
- [ ] Step 6: Viết test TC-S01-27 — request qua HTTPS, password **không** xuất hiện trong URL và **không** vào log
- [ ] Step 7: Chạy tất cả test, xác nhận PASS
- [ ] Step 8: Commit `feat(auth): dang nhap thanh cong + phat token`

**Definition of Done:** 6 TC pass thật (có output) · không log mật khẩu ở bất kỳ tầng nào · lint + typecheck sạch.

## Task 2: Validation phía client (không gọi API khi sai)
**Phụ thuộc:** Task 1
**Trace test:** TC-S01-05, TC-S01-06, TC-S01-07, TC-S01-08, TC-S01-09, TC-S01-10, TC-S01-11, TC-S01-12, TC-S01-13, TC-S01-14
**Proof:** `npx jest tests/components/auth/validate-dang-nhap.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/components/auth/validate-dang-nhap.ts`
- Test: `tests/components/auth/validate-dang-nhap.test.ts`

- [ ] Step 1: Viết test thất bại cho biên email — TC-S01-09 (254 ký tự: **chấp nhận**), TC-S01-10 (255: chặn), TC-S01-05/06 (sai định dạng → lỗi inline, **không gọi API**), TC-S01-07/08 (bỏ trống → "Trường này là bắt buộc.")
- [ ] Step 2: Viết test thất bại cho biên mật khẩu — TC-S01-11 (8: chấp nhận), TC-S01-12 (7: chặn), TC-S01-13 (128: chấp nhận), TC-S01-14 (129: chặn)
- [ ] Step 3: Chạy test, xác nhận FAIL
- [ ] Step 4: Implement validator; trim email **trước** khi kiểm định dạng (`E-S01-01`)
- [ ] Step 5: Chạy test, xác nhận PASS — assert **số lần gọi API = 0** ở mọi ca sai
- [ ] Step 6: Commit `feat(auth): validation client cho form dang nhap`

**Definition of Done:** 10 TC pass · mọi ca sai đều assert không có network call · biên 254/255 và 8/128/129 kiểm đúng hai phía.

## Task 3: Sai mật khẩu — đếm `fail_count` và thông báo còn mấy lần
**Phụ thuộc:** Task 1
**Trace test:** TC-S01-15, TC-S01-16, TC-S01-17
**Proof:** `npx jest tests/modules/auth/dem-sai.test.ts` — exit 0 = đạt
**Files:**
- Modify: `src/modules/auth/auth.service.ts`
- Create: `src/infrastructure/redis/dem-dang-nhap-sai.ts`
- Test: `tests/modules/auth/dem-sai.test.ts`

- [ ] Step 1: Viết test thất bại TC-S01-15 (sai lần 1 → "Còn 4 lần thử.", `fail_count = 1`), TC-S01-16 (lần 3 → "Còn 2 lần"), TC-S01-17 (lần 4 → "Còn 1 lần", `fail_count = 4`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement bộ đếm ở Redis (`ADR-03`), cửa sổ 15 phút; response 401 kèm số lần còn lại
- [ ] Step 4: FE xoá trường Mật khẩu sau mỗi lần sai, giữ nguyên Email
- [ ] Step 5: Chạy test, xác nhận PASS
- [ ] Step 6: Commit `feat(auth): dem dang nhap sai va thong bao so lan con lai`

**Definition of Done:** 3 TC pass · thông báo **không** tiết lộ email có tồn tại hay không (`BRule-S01-05`) · bộ đếm hết hạn đúng 15 phút.

## Task 4: Khoá tạm 15 phút + đồng hồ đếm ngược
**Phụ thuộc:** Task 3
**Trace test:** TC-S01-18, TC-S01-19, TC-S01-20
**Proof:** `npx jest tests/modules/auth/khoa-tam.test.ts` — exit 0 = đạt
**Files:**
- Modify: `src/modules/auth/auth.service.ts`
- Create: `src/components/auth/DongHoKhoa.tsx`
- Test: `tests/modules/auth/khoa-tam.test.ts`, `tests/components/auth/dong-ho-khoa.test.tsx`

- [ ] Step 1: Viết test thất bại TC-S01-18 (sai lần 5 → `423` + `lock_expires`), TC-S01-19 (đang khoá mà gửi request → **vẫn** `423`, kể cả mật khẩu đúng — `BRule-S01-04`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement chuyển `ACTIVE → TEMP_LOCKED`, tăng `so_lan_khoa_tam` **+1** mỗi lần vào khoá tạm (`BRule-S01-03`)
- [ ] Step 4: Implement đồng hồ đếm ngược thời gian thực + disable nút
- [ ] Step 5: Viết test TC-S01-20 — hết 15 phút: thông báo biến mất, form reset, nút enable, `fail_count = 0` nhưng **`so_lan_khoa_tam` giữ nguyên** (`BRule-S01-02`)
- [ ] Step 6: Chạy test, xác nhận PASS
- [ ] Step 7: Commit `feat(auth): khoa tam 15 phut + dong ho dem nguoc`

**Definition of Done:** 3 TC pass · test khẳng định rõ `so_lan_khoa_tam` **không** reset cùng `fail_count` — reset nhầm thì Task 5 vĩnh viễn không đạt tới.

## Task 5: Khoá vĩnh viễn sau 3 chu kỳ khoá tạm
**Phụ thuộc:** Task 4
**Trace test:** TC-S01-21, TC-S01-22
**Proof:** `npx jest tests/modules/auth/khoa-vinh-vien.test.ts` — exit 0 = đạt
**Files:**
- Modify: `src/modules/auth/auth.service.ts`, `src/domain/nguoi-dung.entity.ts`
- Test: `tests/modules/auth/khoa-vinh-vien.test.ts`

- [ ] Step 1: Viết test thất bại TC-S01-22 — mốc là **lần sai thứ 16**: 15 lần sai gây 3 khoá tạm, lần **tiếp theo** mới `403` (lần 15 vẫn là khoá tạm lần 3)
- [ ] Step 2: Viết test TC-S01-21 — tài khoản `PERM_LOCKED` đăng nhập → `403` + thông báo liên hệ quản trị viên, nút disable vĩnh viễn
- [ ] Step 3: Chạy test, xác nhận FAIL
- [ ] Step 4: Implement dựa trên `so_lan_khoa_tam >= 3`; reset về 0 khi đăng nhập thành công hoặc Admin mở khoá
- [ ] Step 5: Chạy test, xác nhận PASS
- [ ] Step 6: Commit `feat(auth): khoa vinh vien sau 3 chu ky khoa tam`

**Definition of Done:** 2 TC pass · có test riêng cho ranh giới 15 vs 16 (đây là chỗ đã từng ghi sai trong tài liệu).

## Task 6: Tài khoản bị vô hiệu hoá (`INACTIVE`)
**Phụ thuộc:** Task 1
**Trace test:** TC-S01-43
**Proof:** `npx jest tests/modules/auth/tai-khoan-inactive.test.ts` — exit 0 = đạt
**Files:**
- Modify: `src/modules/auth/auth.service.ts`
- Test: `tests/modules/auth/tai-khoan-inactive.test.ts`

- [ ] Step 1: Viết test thất bại TC-S01-43 — tài khoản `INACTIVE`, mật khẩu **đúng** → `403` với mã **phân biệt được** với `PERM_LOCKED`
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement `BRule-S01-08`; FE hiển thị `E-S01-13` ("đã bị vô hiệu hoá"), **không** dùng wording của `E-S01-07`
- [ ] Step 4: Chạy test, xác nhận PASS
- [ ] Step 5: Commit `feat(auth): chan dang nhap tai khoan INACTIVE`

**Definition of Done:** TC pass · test assert **hai mã lỗi khác nhau** cho `INACTIVE` và `PERM_LOCKED` — gộp một mã là làm lại đúng gap `G70`.

## Task 7: Giới hạn tần suất (429)
**Phụ thuộc:** Task 1
**Trace test:** TC-S01-26
**Proof:** `npx jest tests/shared/rate-limit.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/shared/guard/rate-limit.guard.ts`
- Test: `tests/shared/rate-limit.test.ts`

- [ ] Step 1: Viết test thất bại TC-S01-26 — request thứ 21 trở đi nhận `429`
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement rate limit theo IP ở Redis
- [ ] Step 4: Chạy test, xác nhận PASS
- [ ] Step 5: Commit `feat(auth): rate limit 20 request cho endpoint dang nhap`

**Definition of Done:** TC pass. ⚠️ `E-S01-09` (429) **chưa đặc tả người dùng thấy gì** — đã ghi nhận ở `00-gaps.md`; task này chỉ làm phía server, phần UI chờ chốt wording, **không tự bịa**.

## Task 8: Mất kết nối khi đăng nhập
**Phụ thuộc:** Task 1
**Trace test:** TC-S01-25
**Proof:** `npx jest tests/components/auth/mat-ket-noi.test.tsx` — exit 0 = đạt
**Files:**
- Modify: `src/components/auth/LoginForm.tsx`, `src/shared/http/auth-client.ts`
- Test: `tests/components/auth/mat-ket-noi.test.tsx`

- [ ] Step 1: Viết test thất bại TC-S01-25 — mock offline: snackbar "Lỗi kết nối. Vui lòng thử lại.", form **giữ nguyên nội dung đã nhập**
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement xử lý lỗi mạng tách khỏi lỗi nghiệp vụ (401/423/403 không dùng snackbar này)
- [ ] Step 4: Chạy test, xác nhận PASS
- [ ] Step 5: Commit `feat(auth): xu ly loi ket noi khi dang nhap`

**Definition of Done:** TC pass · test assert email đã gõ **không bị xoá** sau lỗi mạng.

## Task 9: Guard điều hướng + luật ưu tiên *(CR-05)*
**Phụ thuộc:** Task 10
**Trace test:** TC-S01-23, TC-S01-24, TC-S01-38
**Proof:** `npx jest tests/shared/guard-dieu-huong.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/middleware.ts`, `src/shared/guard/phien-hop-le.ts`
- Test: `tests/shared/guard-dieu-huong.test.ts`

- [ ] Step 1: Viết test thất bại TC-S01-23 (có phiên hợp lệ mở `/login` → redirect `/dashboard` ≤ 100ms, form **không render**) và TC-S01-24 (nhấn Back sau khi đăng nhập)
- [ ] Step 2: Viết test TC-S01-38 — có phiên hợp lệ **và** cờ `phai_doi_mat_khau = true` → về **màn đổi mật khẩu**, KHÔNG về `/dashboard`
- [ ] Step 3: Chạy test, xác nhận FAIL
- [ ] Step 4: Implement `phienHopLe()` đúng định nghĩa `R-S01-08`: access token còn hạn **hoặc** refresh cookie còn hạn và chưa quá 7 ngày không hoạt động — chỉ xét access token là sai vì tab mới luôn có bộ nhớ trống
- [ ] Step 5: Implement thứ tự ưu tiên: kiểm cờ `phai_doi_mat_khau` **TRƯỚC** khi redirect Dashboard (`BRule-S01-07` > `R-S01-08`)
- [ ] Step 6: Chạy test, xác nhận PASS
- [ ] Step 7: Commit `feat(auth): guard dieu huong + uu tien buoc doi mat khau`

**Definition of Done:** 3 TC pass · có test khẳng định thứ tự ưu tiên (đảo thứ tự hai nhánh `if` phải làm TC-S01-38 đỏ).

## Task 10: Đăng xuất — thu hồi refresh token + danh sách chặn `jti`
**Phụ thuộc:** Task 1
**Trace test:** TC-S01-30, TC-S01-31, TC-S01-32
**Proof:** `npx jest tests/modules/auth/dang-xuat.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/auth/dang-xuat.service.ts`, `src/infrastructure/redis/danh-sach-chan-jti.ts`
- Modify: `src/modules/auth/auth.controller.ts`
- Test: `tests/modules/auth/dang-xuat.test.ts`

- [ ] Step 1: Viết test thất bại TC-S01-30 (gọi `POST /auth/logout`, xoá cookie, redirect `/login` ≤ 500ms)
- [ ] Step 2: Viết test TC-S01-31 — access token **cũ** dùng lại nhận `401` vì `jti` đã vào danh sách chặn (chỉ thu hồi refresh token là **không đủ**: access token còn sống tới 8 giờ)
- [ ] Step 3: Chạy test, xác nhận FAIL
- [ ] Step 4: Implement thu hồi refresh + đẩy `jti` vào Redis với TTL = phần đời còn lại của access token
- [ ] Step 5: Viết test TC-S01-32 — mạng ngắt: vẫn xoá token phía client và redirect (logout "best-effort")
- [ ] Step 6: Chạy test, xác nhận PASS
- [ ] Step 7: Commit `feat(auth): dang xuat thu hoi refresh token va chan jti`

**Definition of Done:** 3 TC pass · TC-S01-31 phải **thật sự** gọi lại API bằng token cũ, không chỉ kiểm cookie đã xoá.

## Task 11: Vòng đời phiên — idle 7 ngày, trần 30 ngày *(CR-04)*
**Phụ thuộc:** Task 10
**Trace test:** TC-S01-39, TC-S01-40, TC-S01-41
**Proof:** `npx jest tests/modules/auth/lam-moi-phien.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/auth/lam-moi-phien.service.ts`
- Modify: `src/domain/phien-dang-nhap.entity.ts`, `src/infrastructure/db/phien.repository.ts`
- Test: `tests/modules/auth/lam-moi-phien.test.ts`

- [ ] Step 1: Thêm cột `lan_dung_cuoi` (`05-data-model.md`) + migration
- [ ] Step 2: Viết test thất bại cho **cả hai phía biên** — TC-S01-40 (`lan_dung_cuoi` cách 6 ngày 23 giờ → `200` + token mới + cập nhật `lan_dung_cuoi`) và TC-S01-39 (cách 7 ngày 1 phút → `401` + thu hồi)
- [ ] Step 3: Viết test TC-S01-41 — dùng đều mỗi ngày nhưng quá **30 ngày** kể từ đăng nhập → vẫn `401` (trần tuyệt đối, không gia hạn theo hoạt động)
- [ ] Step 4: Chạy test, xác nhận FAIL
- [ ] Step 5: Implement `POST /auth/refresh` — cấp token mới **chỉ khi cả hai** điều kiện còn thoả; FE hiển thị `E-S01-12` rồi về `/login`
- [ ] Step 6: Chạy test, xác nhận PASS
- [ ] Step 7: Commit `feat(auth): vong doi phien idle 7 ngay va tran 30 ngay`

**Definition of Done:** 3 TC pass · kiểm **hai** mốc độc lập (idle và trần) — bỏ một mốc thì `G66` quay lại · dùng đồng hồ giả (fake timer), không `sleep`.

## Task 12: Buộc đổi mật khẩu tạm ở lần đăng nhập đầu *(CR-02)*
**Phụ thuộc:** Task 9
**Trace test:** TC-S01-33, TC-S01-34, TC-S01-35, TC-S01-36, TC-S01-37
**Proof:** `npx jest tests/modules/auth/buoc-doi-mat-khau.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/components/auth/DoiMatKhauBatBuoc.tsx`
- Modify: `src/middleware.ts`, `src/modules/auth/auth.service.ts`
- Test: `tests/modules/auth/buoc-doi-mat-khau.test.ts`

- [ ] Step 1: Viết test thất bại TC-S01-33 (login trả `phai_doi_mat_khau = true` → **không** vào `/dashboard`, chuyển form đổi mật khẩu)
- [ ] Step 2: Viết test TC-S01-34 — gõ thẳng `/dashboard` và `/tasks/t-100` đều bị đưa lại; **không màn nào render dù một khung hình** (chặn ở tầng điều hướng, không phải ở màn)
- [ ] Step 3: Chạy test, xác nhận FAIL
- [ ] Step 4: Implement chặn ở `middleware.ts`; đường gỡ cờ **duy nhất** là `PATCH /users/me/password`
- [ ] Step 5: Viết test TC-S01-35 (đổi thành công → xoá cờ → vào Dashboard), TC-S01-36 (đăng xuất giữa chừng rồi đăng nhập lại → **vẫn** bị chặn), TC-S01-37 (mật khẩu mới trùng mật khẩu tạm → lỗi, cờ giữ nguyên)
- [ ] Step 6: Chạy test, xác nhận PASS
- [ ] Step 7: Commit `feat(auth): buoc doi mat khau tam o lan dang nhap dau`

**Definition of Done:** 5 TC pass · TC-S01-34 assert ở tầng điều hướng (không chỉ kiểm URL cuối cùng).

## Task 13: Truy cập bàn phím — tab order và toggle mật khẩu
**Phụ thuộc:** Task 1
**Trace test:** TC-S01-28, TC-S01-29
**Proof:** `npx jest tests/components/auth/ban-phim.test.tsx` — exit 0 = đạt
**Files:**
- Modify: `src/components/auth/LoginForm.tsx`
- Test: `tests/components/auth/ban-phim.test.tsx`

- [ ] Step 1: Viết test thất bại TC-S01-29 — icon mắt: lần 1 `type="text"` + hiện rõ mật khẩu, lần 2 về `type="password"`
- [ ] Step 2: Viết test TC-S01-28 — thứ tự focus **Email → Mật khẩu → icon mắt → Nút Đăng nhập** (`R-S01-N04`, đã sửa theo `G72`)
- [ ] Step 3: Chạy test, xác nhận FAIL
- [ ] Step 4: Implement; icon mắt phải nằm trong tab order và có focus visible (`design-spec` §8)
- [ ] Step 5: Chạy test, xác nhận PASS
- [ ] Step 6: Commit `feat(auth): tab order va toggle hien mat khau`

**Definition of Done:** 2 TC pass · test đi qua **đủ 4 điểm dừng** của tab order — bỏ icon mắt là quay lại `G72`.

---

## Ghi chú từ bản chạy thử (2026-08-31)

Task 1, 3, 4, 5, 6, 11 đã chạy thật ở một pilot ngoài repo (TypeScript + vitest, adapter in-memory) — 15 TC pass, lint + typecheck sạch. Hai điều rút ra, đã sửa vào plan này:

1. **Hai file dùng chung bị thiếu khai** — `src/domain/auth.rules.ts` và `src/infrastructure/dong-ho.ts`. `ba-conformance/scan-code.js` bắt được ("file code không plan nào khai"). Cổng thời gian là bắt buộc chứ không tuỳ chọn: `TC-S01-41` phải tua 30 ngày, không thể `sleep`.
2. **Đã kiểm chứng hai mốc phiên của `CR-04` là độc lập** — bỏ nhánh idle thì `TC-S01-39` đỏ, bỏ nhánh trần thì `TC-S01-41` đỏ. Ai gộp hai điều kiện làm một sẽ làm `G66` quay lại mà test vẫn xanh.

## Phủ test

| | |
|---|---|
| TC trong `test.md` | **43** |
| TC có task phủ | **43** (100%) |
| TC không task nào phủ | **0** |

Đối chiếu nhanh: T1 `01,02,03,04,27,42` · T2 `05–14` · T3 `15,16,17` · T4 `18,19,20` · T5 `21,22` · T6 `43` · T7 `26` · T8 `25` · T9 `23,24,38` · T10 `30,31,32` · T11 `39,40,41` · T12 `33–37` · T13 `28,29`.
