# Kế hoạch build — Dashboard (Mã màn: S02)

**Goal:** Dựng màn Dashboard hoàn chỉnh: thống kê + danh sách công việc theo vai trò (F03), tạo công việc từ modal (F04), thông báo in-app với badge/panel/polling (F08).
**Tài liệu nguồn:** srs.md, usecase.md, test.md, html-design.html (cùng folder).
**Thứ tự phụ thuộc:** Task 1 → Task 4 · Task 2 → Task 5 · Task 3 → {Task 2, Task 6} · Task 7 chạy cuối (cần Task 4–6).
Tái dùng từ màn Login: middleware `auth-guard` (Task 3 của plan S01) cho redirect chưa xác thực.

## Task 1: API GET /tasks — phạm vi vai trò + lọc + phân trang (backend)
**Phụ thuộc:** không (nền tảng; cần model CongViec từ 05-data-model)
**Trace test:** TC-S02-01, TC-S02-02, TC-S02-03, TC-S02-14, TC-S02-37, TC-S02-38
**Proof:** `npx jest tests/modules/task/danh-sach-cong-viec.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/task/task.controller.ts`, `src/modules/task/task.service.ts`
- Test: `tests/modules/task/danh-sach-cong-viec.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S02-01/02 (Member chỉ thấy việc liên quan; Lead thấy cả tổ chức) và TC-S02-03 (không lộ task tổ chức khác)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — query theo vai trò (BRule-S02-01), giới hạn to_chuc_id theo JWT (NFR-06), sắp deadline tăng dần, filter status/priority/q, phân trang 20 (limit/offset)
- [ ] Step 4: Viết thêm test TC-S02-37 (thứ tự sắp xếp), TC-S02-38 (lọc ưu tiên + kết hợp), TC-S02-14 (biên phân trang 21 → 20+1)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(tasks): list endpoint with role scope, filters, pagination`

**Definition of Done:** 6 TC trace ở trên pass · response không bao giờ chứa task khác tenant · không lỗi lint.

## Task 2: API POST /tasks — validate + phân quyền + sinh thông báo (backend)
**Phụ thuộc:** Task 3 (cần model ThongBao để sinh TASK_ASSIGNED)
**Trace test:** TC-S02-17, TC-S02-18, TC-S02-19, TC-S02-22, TC-S02-24, TC-S02-26, TC-S02-28
**Proof:** `npx jest tests/modules/task/tao-cong-viec.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/task/tao-cong-viec.service.ts`
- Test: `tests/modules/task/tao-cong-viec.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S02-17 (Member → 403) và TC-S02-22 server-side (deadline quá khứ → 422)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — kiểm vai trò (BRule-S02-03), validate server-side (tiêu đề 1–200, mô tả ≤5000, deadline ≥ now, assignee ACTIVE cùng tổ chức — BRule-S02-04/05), default uu_tien=MEDIUM, tạo task TODO
- [ ] Step 4: Viết test TC-S02-18 (tiêu đề đúng 200 ký tự → 201), TC-S02-24 server-side (assignee INACTIVE → 422), TC-S02-26 (default MEDIUM), TC-S02-28 (sinh thông báo cho người khác, KHÔNG sinh khi tự giao — BRule-S02-06)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(tasks): create endpoint with validation, authz, assignment notification`

**Definition of Done:** 7 TC trace pass · không tạo bản ghi khi request không hợp lệ · thông báo sinh đúng luật BRule-S02-06 · không lỗi lint.

## Task 3: API thông báo — GET /notifications + PATCH read / read-all (backend)
**Phụ thuộc:** không (nền tảng; cần model ThongBao)
**Trace test:** TC-S02-30 (dữ liệu badge), TC-S02-31, TC-S02-32 (phần server)
**Proof:** `npx jest tests/modules/notify/thong-bao.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/notify/notify.controller.ts`, `src/modules/notify/notify.service.ts`
- Test: `tests/modules/notify/thong-bao.test.ts`

- [ ] Step 1: Viết test thất bại — GET trả danh sách mới→cũ kèm tổng chưa đọc; PATCH :id/read đổi da_doc; PATCH read-all đổi tất cả
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement 3 endpoint, giới hạn theo nguoi_dung_id của JWT
- [ ] Step 4: Chạy test, xác nhận PASS
- [ ] Step 5: Commit `feat(notifications): list + mark-read endpoints`

**Definition of Done:** 3 TC trace (phần server) pass · không đọc/sửa được thông báo của người khác · không lỗi lint.

## Task 4: Trang Dashboard — thống kê + danh sách + lọc (frontend)
**Phụ thuộc:** Task 1
**Trace test:** TC-S02-01, TC-S02-04…09, TC-S02-10, TC-S02-11, TC-S02-12, TC-S02-13, TC-S02-37, TC-S02-38
**Proof:** `npx jest tests/components/dashboard/dashboard-page.test.tsx` — exit 0 = đạt
**Files:**
- Create: `src/app/(app)/dashboard/page.tsx`, `src/components/dashboard/StatCards.tsx`, `src/components/dashboard/TaskTable.tsx`
- Test: `tests/components/dashboard/dashboard-page.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S02-04/05 (quá hạn tô đỏ + ⚠ đúng luật DT), TC-S02-12 (chưa xác thực → redirect, tái dùng auth-guard)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — 5 StatCards (click lọc — TC-S02-08), TaskTable (sort hiển thị theo API, click dòng → /tasks/:id — TC-S02-09), bộ lọc + tìm debounce 300ms (TC-S02-06/07/38), nút Tải thêm (TC-S02-14 UI)
- [ ] Step 4: Implement 3 UI state phụ — skeleton loading, empty (gợi ý tạo việc cho Lead — TC-S02-10), error + Thử lại (TC-S02-11); đối chiếu html-design.html
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(dashboard): stats, task list, filters with full UI states`

**Definition of Done:** các TC trace pass · đủ 4 UI state khớp design-spec · bám token design system · không lỗi lint.

## Task 5: Modal Tạo công việc (frontend)
**Phụ thuộc:** Task 2, Task 4
**Trace test:** TC-S02-15, TC-S02-16, TC-S02-19…23, TC-S02-25, TC-S02-27, TC-S02-29
**Proof:** `npx jest tests/components/dashboard/create-task-modal.test.tsx` — exit 0 = đạt
**Files:**
- Create: `src/components/dashboard/CreateTaskModal.tsx`
- Test: `tests/components/dashboard/create-task-modal.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S02-16 (Member: nút không render trong DOM) và TC-S02-20 (tiêu đề toàn khoảng trắng → lỗi inline + nút disable)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — modal 5 trường, validate inline khi blur (đúng wording bảng Validation trong srs), dropdown assignee chỉ ACTIVE + tìm theo tên, nút Tạo disable khi lỗi
- [ ] Step 4: Viết test TC-S02-19/21/22 (biên 201/5001 ký tự, deadline quá khứ), TC-S02-25 (thiếu assignee), TC-S02-15 (happy 3 bước → toast + đầu danh sách + thống kê +1), TC-S02-27 (mất mạng giữ dữ liệu), TC-S02-29 (đóng modal hỏi xác nhận)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(dashboard): create-task modal with field-level validation`

**Definition of Done:** các TC trace pass · luồng tạo đúng ≤ 3 bước (R-S02-N02) · lỗi giữ nguyên dữ liệu nhập · không lỗi lint.

## Task 6: Chuông thông báo — badge + panel + polling (frontend)
**Phụ thuộc:** Task 3, Task 4
**Trace test:** TC-S02-30…35, TC-S02-39
**Proof:** `npx jest tests/components/layout/notification-bell.test.tsx` — exit 0 = đạt
**Files:**
- Create: `src/components/layout/NotificationBell.tsx`
- Test: `tests/components/layout/notification-bell.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S02-30 (badge 0→ẩn / 99 / 100→"99+") và TC-S02-39 (panel rỗng → "Chưa có thông báo")
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — badge + panel (mới→cũ, chưa đọc nền nhấn), click item → mark read + điều hướng (TC-S02-31), Đọc tất cả (TC-S02-32), polling 60s (TC-S02-33)
- [ ] Step 4: Viết test edge TC-S02-34 (task đã xoá → thông báo, ở lại Dashboard), TC-S02-35 (API read lỗi → vẫn điều hướng)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(notifications): bell badge, panel, mark-read, 60s polling`

**Definition of Done:** các TC trace pass · badge luôn khớp số chưa đọc sau mỗi thao tác · không lỗi lint.

## Task 7: Accessibility + responsive pass (frontend)
**Phụ thuộc:** Task 4, Task 5, Task 6
**Trace test:** TC-S02-36
**Proof:** `npx jest tests/components/dashboard/dashboard-a11y.test.tsx` — exit 0 = đạt
**Files:**
- Edit: `src/app/(app)/dashboard/page.tsx`, `src/components/dashboard/*.tsx`, `src/components/layout/NotificationBell.tsx`
- Test: `tests/components/dashboard/dashboard-a11y.test.tsx`

- [ ] Step 1: Viết test thất bại — axe không lỗi contrast; badge có aria-label "X thông báo chưa đọc"; thứ tự Tab: chuông → avatar → CTA → bộ lọc → bảng
- [ ] Step 2: Sửa các vi phạm — aria-label/role, focus-visible, quá hạn kèm icon ⚠ (không chỉ màu), bảng → thẻ dọc trên mobile (<768px) như html-design
- [ ] Step 3: Chạy test + kiểm tay TC-S02-36 (Manual), xác nhận PASS
- [ ] Step 4: Commit `feat(dashboard): a11y and responsive refinements`

**Definition of Done:** TC-S02-36 pass (axe sạch, tab order đúng) · breakpoint <768px chuyển layout không vỡ · không lỗi lint.

---

## Task 8: *(CR-01)* Xuất báo cáo tiến độ (backend + frontend)
**Phụ thuộc:** Task 1 (GET /tasks — dùng lại logic phạm vi vai trò + bộ lọc)
**Trace test:** TC-S02-40, TC-S02-41, TC-S02-42, TC-S02-43, TC-S02-44, TC-S02-45
**Proof:** `npx jest tests/modules/task/report-export.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/task/report-export.service.ts`, `src/modules/task/report.controller.ts`
- Create: `src/components/dashboard/ExportReportButton.tsx`, `src/components/dashboard/ExportFormatDialog.tsx`
- Test: `tests/modules/task/report-export.test.ts`, `tests/components/dashboard/export-report.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S02-43 — `POST /reports/export` bằng token **Member** trả 403, không trả tệp (`R-S02-N07`, `BRule-S02-08`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement service — **dùng lại truy vấn của Task 1** (cùng phạm vi vai trò `BRule-S02-01` + bộ lọc), render PDF và XLSX; kiểm quyền Team Lead/Org Admin ở controller
- [ ] Step 4: Viết test TC-S02-40 (Team Lead xuất Excel theo lọc IN_PROGRESS → tệp đúng nội dung), TC-S02-41 (Org Admin xuất PDF toàn tổ chức), TC-S02-44 (0 kết quả → tệp ghi "Không có công việc", không rỗng)
- [ ] Step 5: Viết test TC-S02-42 (Member → nút "Xuất báo cáo" **không** render trong DOM), gắn nút + dialog chọn định dạng vào dashboard, truyền **đúng bộ lọc đang xem**
- [ ] Step 6: Chạy tất cả test, xác nhận PASS
- [ ] Step 7: Commit `feat(dashboard): xuat bao cao tien do PDF/Excel (CR-01)`

**Definition of Done:** 5 TC trace pass · báo cáo **không bao giờ** chứa việc ngoài phạm vi vai trò (dùng chung truy vấn Task 1, không có đường query riêng) · nút vắng mặt trong DOM với Member · không lỗi lint.

---
> **Phủ TC:** 44/44 TC trong test.md được trace bởi ≥1 task (Task 1: 6 · Task 2: 7 · Task 3: 3 · Task 4: 13 · Task 5: 10 · Task 6: 7 · Task 7: 1 · **Task 8: 5**; một số TC xuất hiện ở cả tầng API và UI).
> Test hiệu năng R-S02-N01/N06 (load test k6) chạy ở staging — ngoài phạm vi plan này (xem ghi chú test.md).
