# Kế hoạch build — Tổ chức (Mã màn: S05)

**Goal:** Dựng màn quản trị tổ chức: sửa thông tin tổ chức (F11 — Team Lead + Org Admin) và quản trị thành viên (F13 — chỉ Org Admin: mời, đổi vai trò, vô hiệu hoá, kích hoạt lại), với luật **không được để tổ chức mất quản trị viên cuối cùng**.
**Tài liệu nguồn:** srs.md, usecase.md, test.md, html-design.html (cùng folder).
**Kiến trúc:** bám `docs/10-architecture.md` §5 (module `org` giữ F11/F13, module `auth` giữ phiên + hash mật khẩu) và §10. ADR-01…ADR-04 đã `Accepted`.

> ⚠️ **Ghi chú đường dẫn frontend.** `10-architecture.md` §10 mới định nghĩa cây thư mục **backend**. Đường dẫn `web/...` theo quy ước Next.js App Router — **cần bổ sung vào §10 rồi rà lại**.

**Thứ tự phụ thuộc:**
`Task 1` (luật admin cuối cùng) chặn `Task 4` và `Task 5` · `Task 2` → `Task 7` · `Task 3` → `Task 8` · `Task 6` → `Task 9` · `Task 10` cần Task 8–9 · `Task 11` chạy cuối.
Tái dùng: `password-policy.ts` + `PasswordStrengthMeter` từ plan S06, `Avatar` từ plan S04, guard RBAC từ plan S01.

---

## Task 1: Luật "quản trị viên cuối cùng" trong tầng domain (nền tảng)
**Phụ thuộc:** không — **chặn Task 4 và Task 5**, làm trước tất cả
**Trace test:** TC-S05-45, TC-S05-46, TC-S05-47, TC-S05-48, TC-S05-43
**Proof:** `npx jest tests/domain/org/admin-guard-rule.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/domain/org/admin-guard-rule.ts`
- Test: `tests/domain/org/admin-guard-rule.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S05-48 — tổ chức có **hai** Org Admin nhưng một người **INACTIVE** thì người còn lại **vẫn bị coi là admin cuối cùng** (đếm theo ACTIVE, không đếm theo tổng)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement `canDemoteOrDeactivate(target, activeAdmins)` thuần domain: chặn khi target là Org Admin ACTIVE **và** số Org Admin ACTIVE ≤ 1 (`BRule-S05-05`)
- [ ] Step 4: Viết thêm test TC-S05-45/46/47 (admin duy nhất: chặn cả hạ vai trò lẫn vô hiệu hoá), TC-S05-43 (còn admin khác ACTIVE → **cho phép** tự vô hiệu hoá mình — `BRule-S05-12`)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(org): luat khong duoc mat quan tri vien cuoi cung`

**Definition of Done:** 5 TC trace pass · hàm không đụng DB (đúng phân tầng §3) · phủ đủ 4 tổ hợp (admin cuối / còn admin khác) × (hạ vai trò / vô hiệu hoá) · không lỗi lint.

---

## Task 2: API `GET` + `PATCH /organizations/me` — thông tin tổ chức
**Phụ thuộc:** không (nền tảng)
**Trace test:** TC-S05-01, TC-S05-04, TC-S05-06, TC-S05-07, TC-S05-11, TC-S05-20
**Proof:** `npx jest tests/modules/org/organization.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/org/organization.controller.ts`, `src/modules/org/organization.service.ts`, `src/modules/org/organization.repository.ts`
- Test: `tests/modules/org/organization.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S05-11 — gửi kèm `slug` trong body thì slug **không đổi** (`BRule-S05-02`), không phải trả lỗi rồi vẫn ghi
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — danh sách trắng đúng 2 trường (`ten`, `logo_url`); tổ chức lấy **từ JWT**, không nhận id
- [ ] Step 4: Viết thêm test TC-S05-01 (Team Lead xem được), TC-S05-20 (**Member → 403**, không vào được màn), TC-S05-04 (đổi tên thành công), TC-S05-06 (101 ký tự → 422), TC-S05-07 (`http://` → từ chối — `BRule-S05-10`)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(org): endpoint thong tin to chuc`

**Definition of Done:** 6 TC trace pass · slug trong DB không đổi sau request cố tình sửa · không lỗi lint.

---

## Task 3: API `GET /organizations/me/members` — danh sách + lọc + phân trang
**Phụ thuộc:** Task 2 (dùng chung guard)
**Trace test:** TC-S05-13, TC-S05-17, TC-S05-21, TC-S05-31, TC-S05-51
**Proof:** `npx jest tests/modules/org/member-list.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/org/member-list.service.ts`, `src/modules/org/member.repository.ts`
- Test: `tests/modules/org/member-list.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S05-21 — danh sách của Acme **không bao giờ** chứa thành viên của Beta, kể cả khi tham số lọc cố tình mở rộng (NFR-06)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — lọc theo vai trò/trạng thái/từ khoá **ở máy chủ** (không lọc phía trình duyệt), phân trang 20 dòng; tìm theo cả tên và email
- [ ] Step 4: Viết thêm test TC-S05-13 (12 thành viên), TC-S05-17 (25 thành viên → trang đầu 20, còn 5 lấy được), TC-S05-31 (Team Lead **đọc được** danh sách — quyền đọc khác quyền thao tác), TC-S05-51 (25 thành viên, cache trống → dưới ngưỡng `R-S05-N06`)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(org): danh sach thanh vien kem loc va phan trang`

**Definition of Done:** 5 TC trace pass · bộ lọc chạy trong câu truy vấn, không lọc sau khi đã lấy hết · không rò rỉ thành viên khác tổ chức · không lỗi lint.

---

## Task 4: API `PATCH /organizations/me/members/:id/role` — đổi vai trò
**Phụ thuộc:** Task 1, Task 3
**Trace test:** TC-S05-32, TC-S05-33, TC-S05-34, TC-S05-45, TC-S05-49, TC-S05-53
**Proof:** `npx jest tests/modules/org/change-role.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/org/change-role.service.ts`
- Modify: `src/modules/org/organization.controller.ts`
- Test: `tests/modules/org/change-role.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S05-49 — **hai Org Admin cùng lúc** tự hạ vai trò mình: người thứ hai nhận `409`, tổ chức **luôn còn ít nhất một** Org Admin ACTIVE
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — kiểm `admin-guard-rule` (Task 1) **bên trong giao dịch** có khoá hàng trên bảng người dùng, không kiểm trước rồi ghi sau
- [ ] Step 4: Viết test TC-S05-32 (đổi vai trò thành công + ghi nhận), TC-S05-33 (Member gọi → 403), TC-S05-34 (đổi vai trò người của tổ chức khác → 404, không phải 403), TC-S05-45 (hạ admin cuối cùng → 409 kèm thông điệp giải thích, không phải mã trần trụi)
- [ ] Step 5: Viết test TC-S05-53 (quyền vừa bị đổi trong lúc màn đang mở → thao tác kế tiếp nhận 403 sạch sẽ)
- [ ] Step 6: Chạy tất cả test, xác nhận PASS
- [ ] Step 7: Commit `feat(org): doi vai tro thanh vien kem khoa giao dich`

**Definition of Done:** 6 TC trace pass · test đua thao tác chạy thật (hai giao dịch song song), không giả lập bằng gọi tuần tự · **không tồn tại** đường nào làm tổ chức còn 0 admin ACTIVE · không lỗi lint.

---

## Task 5: API vô hiệu hoá / kích hoạt lại thành viên
**Phụ thuộc:** Task 1, Task 3
**Trace test:** TC-S05-35, TC-S05-37, TC-S05-38, TC-S05-40, TC-S05-42, TC-S05-43, TC-S05-44, TC-S05-46, TC-S05-55, TC-S05-56
**Proof:** `npx jest tests/modules/org/member-status.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/org/member-status.service.ts`
- Modify: `src/modules/auth/session.repository.ts` (thu hồi phiên — đã tạo ở plan S04)
- Test: `tests/modules/org/member-status.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S05-38 — vô hiệu hoá người đang có **4 công việc**: cả 4 việc **giữ nguyên người thực hiện**, không tự động gỡ giao (`BRule-S05-08`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — đổi trạng thái + thu hồi **mọi** phiên của người bị vô hiệu hoá (`BRule-S05-04`, dùng lại `session.repository` của S04); kiểm luật admin cuối cùng trước khi ghi
- [ ] Step 4: Viết test TC-S05-35 (vô hiệu hoá thành công), TC-S05-37 (người bị vô hiệu hoá bị đăng xuất ở lời gọi kế tiếp), TC-S05-44 (người chưa từng đăng nhập → không có phiên nào, vẫn 200), TC-S05-46 (admin cuối cùng → 409)
- [ ] Step 5: Viết test TC-S05-40 (kích hoạt lại INACTIVE → ACTIVE, đăng nhập lại được), TC-S05-42 (Team Lead gọi → 403), TC-S05-43 (tự vô hiệu hoá mình khi còn admin khác → cho phép + phiên của chính mình cũng bị thu hồi)
- [ ] Step 6: Chạy tất cả test, xác nhận PASS
- [ ] Step 7: Commit `feat(org): vo hieu hoa va kich hoat lai thanh vien`

**Definition of Done:** 8 TC trace pass · số công việc được giao **không đổi** trước/sau khi vô hiệu hoá · không sót phiên nào chưa thu hồi · không lỗi lint.

---

## Task 6: API `POST /organizations/me/members` — mời (tạo tài khoản)
**Phụ thuộc:** Task 3, và `password-policy.ts` của plan S06
**Trace test:** TC-S05-22, TC-S05-26, TC-S05-27, TC-S05-29, TC-S05-30, TC-S05-54
**Proof:** `npx jest tests/modules/org/invite-member.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/org/invite-member.service.ts`
- Test: `tests/modules/org/invite-member.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S05-27 — email **đã tồn tại ở tổ chức khác** vẫn bị từ chối (email là định danh **toàn hệ thống**, không phải theo tổ chức — `BRule-S05-06`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — kiểm trùng email toàn cục, hash mật khẩu tạm bằng bcrypt cost 12 (ADR-03), tạo người dùng ACTIVE trong tổ chức của JWT
- [ ] Step 4: Viết thêm test TC-S05-22 (tạo thành công, tổng thành viên +1), TC-S05-26 (email trùng trong cùng tổ chức → 409), TC-S05-29 (mật khẩu tạm yếu → 422, dùng chung luật với S06), TC-S05-30 (DB lưu **hash**, không plaintext — `R-S05-N03`)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(org): moi thanh vien bang tao tai khoan truc tiep`

**Definition of Done:** 5 TC trace pass · không có bản ghi nào được tạo khi request lỗi · mật khẩu tạm không xuất hiện ở dạng thô trong DB hay log · không lỗi lint.

---

## Task 7: Khối "Thông tin tổ chức" (frontend)
**Phụ thuộc:** Task 2
**Trace test:** TC-S05-02, TC-S05-03, TC-S05-05, TC-S05-08, TC-S05-09, TC-S05-10, TC-S05-12
**Proof:** `npx jest tests/web/org-info-form.test.tsx` — exit 0 = đạt
**Files:**
- Create: `web/app/organization/page.tsx`, `web/components/org/OrgInfoForm.tsx`
- Test: `tests/web/org-info-form.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S05-03 — slug hiển thị dạng **dòng văn bản có khoá + câu giải thích**, **không** phải `<input disabled>`
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement theo `html-design.html`; ô Logo **dùng lại đúng component ô Ảnh đại diện của S04** (cùng gợi ý, cùng luật `https://`, cùng cách rơi về chữ cái đầu)
- [ ] Step 4: Viết test TC-S05-02 (mở màn → nút Lưu disable), TC-S05-09 (hoàn tác về giá trị cũ → disable lại), TC-S05-05 (tên rỗng → lỗi), TC-S05-10 (bộ đếm `n/100` đổi đỏ khi vượt)
- [ ] Step 5: Viết test TC-S05-08 (logo chết → chữ cái đầu, im lặng), TC-S05-12 (500 → **lỗi trong phạm vi khối đó**, khối Thành viên vẫn dùng được)
- [ ] Step 6: Chạy tất cả test, xác nhận PASS
- [ ] Step 7: Commit `feat(web): khoi thong tin to chuc`

**Definition of Done:** 7 TC trace pass · ô Logo import từ component S04, **không** có bản sao luật URL · lỗi khối này không làm chết khối kia · không lỗi lint.

---

## Task 8: Bảng thành viên + lọc + phân trang, phân biệt theo vai trò người xem (frontend)
**Phụ thuộc:** Task 3, Task 7
**Trace test:** TC-S05-14, TC-S05-15, TC-S05-16, TC-S05-17, TC-S05-18, TC-S05-19, TC-S05-50, TC-S05-53
**Proof:** `npx jest tests/web/member-table.test.tsx` — exit 0 = đạt
**Files:**
- Create: `web/components/org/MemberTable.tsx`, `web/components/org/MemberFilters.tsx`
- Test: `tests/web/member-table.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S05-18 và TC-S05-19 — với Team Lead, bảng có **đúng 5 cột**, **không tồn tại** nút "+ Mời thành viên" và cột `[⋮]` trong DOM (không phải bị làm mờ — `R-S05-11`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — dựng cột theo vai trò người xem; bảng dùng thẻ bảng thật có tiêu đề cột liên kết; mobile chuyển sang danh sách thẻ
- [ ] Step 4: Viết test TC-S05-14 (tìm theo tên và email, debounce 300ms), TC-S05-15 (hai bộ lọc kết hợp = giao điều kiện), TC-S05-16 (lọc không khớp → "Không tìm thấy thành viên phù hợp" + nút Xoá bộ lọc), TC-S05-17 ("Tải thêm" + chỉ báo "Hiển thị x / n")
- [ ] Step 5: Viết test TC-S05-50 (**chỉ** danh sách lỗi → lỗi cục bộ trong khối Thành viên), TC-S05-53 (quyền bị hạ khi đang mở màn → **mất cụm hành động ngay**, không để nút chết)
- [ ] Step 6: Chạy tất cả test, xác nhận PASS
- [ ] Step 7: Commit `feat(web): bang thanh vien kem loc va phan quyen hien thi`

**Definition of Done:** 8 TC trace pass · test dùng truy vấn "không tìm thấy phần tử" cho Team Lead, không kiểm thuộc tính disabled · không có cột trống · không lỗi lint.

---

## Task 9: Modal "Mời thành viên" + hộp mật khẩu tạm (frontend)
**Phụ thuộc:** Task 6, Task 8
**Trace test:** TC-S05-22, TC-S05-23, TC-S05-24, TC-S05-25, TC-S05-26, TC-S05-28, TC-S05-29
**Proof:** `npx jest tests/web/invite-member.test.tsx` — exit 0 = đạt
**Files:**
- Create: `web/components/org/InviteMemberDialog.tsx`, `web/components/org/TempPasswordDialog.tsx`
- Test: `tests/web/invite-member.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S05-25 — sau khi đóng hộp mật khẩu tạm, **không có đường nào** xem lại mật khẩu (không trong DOM, không trong state, không gọi lại API được — `R-S05-N04`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — mật khẩu chỉ tồn tại trong phản hồi tạo tài khoản, xoá khỏi bộ nhớ khi đóng hộp; nút `⟳` sinh mật khẩu mạnh; nút "Sao chép"
- [ ] Step 4: Viết test TC-S05-22/23 (tạo thành công → hộp mật khẩu tạm rồi dòng mới ở đầu danh sách, tổng +1), TC-S05-24 (nội dung hộp: tên, email, mật khẩu, cảnh báo không hiện lại)
- [ ] Step 5: Viết test TC-S05-26 (email trùng → lỗi **ngay dưới trường Email**, ba trường còn lại giữ nguyên, **modal không đóng**), TC-S05-28 (email sai định dạng → lỗi tại chỗ), TC-S05-29 (mật khẩu yếu → nút tạo disable, dùng chung thanh độ mạnh với S06)
- [ ] Step 6: Chạy tất cả test, xác nhận PASS
- [ ] Step 7: Commit `feat(web): modal moi thanh vien va hop mat khau tam mot lan`

**Definition of Done:** 7 TC trace pass · test khẳng định mật khẩu **biến mất khỏi DOM và state** sau khi đóng · modal giữ nguyên dữ liệu khi lỗi 409 · không lỗi lint.

---

## Task 10: Menu hành động `[⋮]` + hộp xác nhận vô hiệu hoá (frontend)
**Phụ thuộc:** Task 4, Task 5, Task 8
**Trace test:** TC-S05-32, TC-S05-35, TC-S05-36, TC-S05-39, TC-S05-40, TC-S05-41, TC-S05-45, TC-S05-47, TC-S05-43
**Proof:** `npx jest tests/web/member-actions.test.tsx` — exit 0 = đạt
**Files:**
- Create: `web/components/org/MemberActionMenu.tsx`, `web/components/org/DeactivateDialog.tsx`
- Test: `tests/web/member-actions.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S05-47 — với admin cuối cùng, hai mục menu **mờ sẵn kèm lý do đọc được ngay trong menu**; lời giải thích **phải đọc được bằng trình đọc màn hình** (không `display:none`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — đây là **ngoại lệ duy nhất** của luật "ẩn hẳn": người dùng *có* quyền, chỉ là nghiệp vụ không cho phép lúc này (design-spec §8)
- [ ] Step 4: Viết test TC-S05-36 (hộp xác nhận nêu **đúng 3 hệ quả** kèm **số công việc thật** = 4), TC-S05-35 (0 công việc → **bỏ hẳn** gạch đầu dòng đó, không ghi "0 công việc"), TC-S05-43 (tự vô hiệu hoá mình → hộp nói rõ "Bạn sẽ bị đăng xuất ngay", xác nhận xong chuyển `/login`)
- [ ] Step 5: Viết test TC-S05-32 + TC-S05-39/40/41 (badge đổi **tại chỗ** bằng crossfade, **không** vẽ lại cả bảng; dòng INACTIVE chỉ còn mục "Kích hoạt lại")
- [ ] Step 6: Viết test TC-S05-45 (bấm vào mục bị khoá → **không** gọi API)
- [ ] Step 7: Chạy tất cả test, xác nhận PASS
- [ ] Step 8: Commit `feat(web): menu hanh dong thanh vien va hop xac nhan co he qua`

**Definition of Done:** 9 TC trace pass · lý do khoá nằm trong cây trợ năng (kiểm bằng truy vấn theo vai trò/nội dung, không phải theo class) · chỉ dòng bị đổi được vẽ lại · không lỗi lint.

---

## Task 11: Khả năng tiếp cận & hiệu năng (chạy cuối)
**Phụ thuộc:** Task 7–10
**Trace test:** TC-S05-52, TC-S05-51
**Proof:** `npx jest tests/web/org-a11y-perf.test.tsx` — exit 0 = đạt
**Files:**
- Modify: các component ở Task 7–10
- Test: `tests/web/org-a11y-perf.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S05-52 — menu `[⋮]` mở được bằng bàn phím, điều hướng bằng mũi tên, Esc đóng, **trả focus về nút đã mở**; badge phân biệt không chỉ bằng màu
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Bổ sung vai trò/nhãn truy cập cho menu và modal, bẫy focus, tiêu đề cột liên kết đúng ô dữ liệu; kiểm tương phản ≥ 4.5:1
- [ ] Step 4: Viết test TC-S05-51 — tải màn với 25 thành viên, cache trống, đạt ngưỡng `R-S05-N06`
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(web): hoan thien a11y va nguong hieu nang man to chuc`

**Definition of Done:** 2 TC trace pass · trình đọc màn hình đọc được "Vai trò: Quản lý nhóm" thay vì đọc trôi · thao tác phá huỷ có nhãn chữ rõ ràng · không lỗi lint.

---

## Đối chiếu độ phủ test

| Nhóm TC | Số TC | Task phủ |
|---|---|---|
| Thông tin tổ chức (F11) | 12 | Task 2, 7 |
| Danh sách & phân quyền hiển thị | 10 | Task 3, 8 |
| Mời thành viên (F13) | 8 | Task 6, 9 |
| Đổi vai trò / vô hiệu hoá / kích hoạt lại (F13) | 16 | Task 1, 4, 5, 10 |
| Luật admin cuối cùng | 5 | Task 1, 4, 5, 10 |
| A11y & hiệu năng | 2 | Task 11 |
| **Tổng** | **53** | mọi TC-S05-01…53 đều có ít nhất 1 task |
