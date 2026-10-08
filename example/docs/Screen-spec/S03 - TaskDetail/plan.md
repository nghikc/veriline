# Kế hoạch build — Chi tiết công việc (Mã màn: S03)

**Goal:** Dựng màn chi tiết công việc hoàn chỉnh: xem đầy đủ thông tin + lịch sử + bình luận (F05, F07), chuyển trạng thái theo máy trạng thái có phân quyền (F06), và sinh thông báo `STATUS_CHANGED` (F08 — nguồn phát, đã đặc tả hiển thị ở S02).
**Tài liệu nguồn:** srs.md, usecase.md, test.md, html-design.html (cùng folder).
**Kiến trúc:** bám `docs/10-architecture.md` §5 (module `task`, `notify`) và §10 (cấu trúc thư mục chuẩn). ADR-01…ADR-04 đã `Accepted`.

> ⚠️ **Ghi chú đường dẫn frontend.** `10-architecture.md` §10 mới định nghĩa cây thư mục **backend** (NestJS). Phần Next.js chưa có trong §10 nên plan này dùng quy ước App Router (`web/app/...`, `web/components/...`) — **cần bổ sung vào §10 rồi rà lại**, đừng coi đây là chuẩn đã chốt.

**Thứ tự phụ thuộc:**
`Task 1` → `Task 2` → `Task 6` · `Task 3` → `Task 4` → {`Task 7`, `Task 8`} · `Task 5` → `Task 11` · `Task 9` cần `Task 3` · `Task 10` cần `Task 4` · `Task 12` chạy cuối (cần Task 6–11).
Tái dùng từ các màn trước: guard `auth-guard` + `tenant-guard` (plan S01/S02), model `CongViec`/`ThongBao` (`05-data-model.md`).

---

## Task 1: Máy trạng thái công việc trong tầng domain (nền tảng)
**Phụ thuộc:** không (nền tảng — mọi task chuyển trạng thái đều dựa vào đây)
**Trace test:** TC-S03-23, TC-S03-24, TC-S03-25
**Proof:** `npx jest tests/domain/task/task-status.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/domain/task/task-status.ts`
- Test: `tests/domain/task/task-status.test.ts`

- [ ] Step 1: Viết test thất bại — bảng 7 chuyển hợp lệ của `BRule-S03-01`; mọi cặp ngoài bảng phải bị từ chối
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement `canTransition(from, to)` thuần domain (không đụng DB): 7 cạnh hợp lệ, `DONE`/`CANCELLED` là trạng thái cuối (`BRule-S03-02`)
- [ ] Step 4: Viết thêm test TC-S03-23 (TODO → DONE bị chặn), TC-S03-24 (ra khỏi DONE bị chặn), TC-S03-25 (ra khỏi CANCELLED bị chặn)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(task): state machine cho vong doi cong viec`

**Definition of Done:** 3 TC trace pass · hàm không phụ thuộc infrastructure (đúng quy tắc phân tầng §3) · phủ đủ 25 cặp trạng thái (5×5) trong test · không lỗi lint.

---

## Task 2: API `GET /tasks/:id` — chi tiết + cách ly tổ chức
**Phụ thuộc:** Task 1 (dùng enum trạng thái chung)
**Trace test:** TC-S03-01, TC-S03-02, TC-S03-08, TC-S03-09, TC-S03-10, TC-S03-15
**Proof:** `npx jest tests/modules/task/get-detail.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/task/task.controller.ts`, `src/modules/task/task.service.ts`, `src/modules/task/task.repository.ts`
- Test: `tests/modules/task/get-detail.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S03-01 (trả đủ 9 trường) và TC-S03-09 (task tổ chức khác → **404, không phải 403** — `BRule-S03-11`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — repository lọc `org_id` từ JWT (NFR-06), service trả đủ 9 trường, controller map lỗi về envelope `{code,message}` (§8)
- [ ] Step 4: Viết thêm test TC-S03-08 (id không tồn tại → 404 **cùng payload** với TC-S03-09), TC-S03-10 (chưa xác thực → 401 trước khi chạm DB), TC-S03-02 (`mo_ta` rỗng vẫn trả 200), TC-S03-15 (tiêu đề đúng 200 ký tự)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(task): endpoint chi tiet cong viec kem cach ly tenant`

**Definition of Done:** 6 TC trace pass · phản hồi 404 của "không tồn tại" và "khác tổ chức" **giống hệt nhau từng byte** (`R-S03-N02`) · không có đường nào đọc được task ngoài `org_id` của JWT · không lỗi lint.

---

## Task 3: API `GET /tasks/:id/history` + `GET /tasks/:id/comments`
**Phụ thuộc:** Task 2 (dùng chung guard + repository)
**Trace test:** TC-S03-05, TC-S03-06, TC-S03-13
**Proof:** `npx jest tests/modules/task/get-history-comments.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/task/history.repository.ts`, `src/modules/task/comment.repository.ts`
- Modify: `src/modules/task/task.controller.ts`
- Test: `tests/modules/task/get-history-comments.test.ts`

- [ ] Step 1: Viết test thất bại — lịch sử sắp **giảm dần** `tao_luc` với bản ghi tạo việc ở cuối; bình luận sắp **tăng dần**
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement hai endpoint, cùng guard tenant với Task 2; bình luận phân trang **50 mới nhất** + con trỏ tải cũ hơn (`R-S03-N06`)
- [ ] Step 4: Viết thêm test TC-S03-05 (3 lần thay đổi ra đúng 4 dòng gồm dòng tạo), TC-S03-06 (4 bình luận đúng thứ tự), TC-S03-13 (60 bình luận → trả 50, còn 10 lấy được qua trang sau)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(task): endpoint lich su va binh luan`

**Definition of Done:** 3 TC trace pass · hai chiều sắp xếp **ngược nhau** đúng đặc tả (lịch sử mới→cũ, bình luận cũ→mới) · không lỗi lint.

---

## Task 4: API `PATCH /tasks/:id/status` — phân quyền + ghi lịch sử + thông báo
**Phụ thuộc:** Task 1, Task 3 (ghi `LichSuCongViec`)
**Trace test:** TC-S03-16, TC-S03-17, TC-S03-18, TC-S03-23, TC-S03-26, TC-S03-27, TC-S03-33, TC-S03-34, TC-S03-54
**Proof:** `npx jest tests/modules/task/change-status.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/task/change-status.service.ts`
- Modify: `src/modules/task/task.controller.ts`, `src/modules/notify/notify.service.ts`
- Test: `tests/modules/task/change-status.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S03-26 (người **không phải** người thực hiện gọi "Bắt đầu làm" → 403 — `BRule-S03-03`) và TC-S03-27 (Member gọi "Duyệt hoàn thành" → 403 — `BRule-S03-04`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — kiểm `canTransition` (Task 1) trước, rồi kiểm vai trò, rồi ghi **1 bản ghi lịch sử** (`BRule-S03-08`) trong **cùng một giao dịch** với việc đổi trạng thái
- [ ] Step 4: Viết test TC-S03-16/17/18 (3 chuyển hợp lệ → 200 + 1 dòng lịch sử), TC-S03-23 (chuyển không hợp lệ → 400, **trạng thái trong DB không đổi**), TC-S03-33 (sinh `STATUS_CHANGED` cho người thực hiện và người giao), TC-S03-54 (người tự giao việc cho mình thao tác → **không** ai nhận thông báo — `BRule-S03-09`)
- [ ] Step 5: Viết test TC-S03-34 (đua thao tác: hai phiên cùng đổi, phiên sau nhận lỗi và **không** tạo bản ghi thứ hai — `BRule-S03-12`); dùng khoá lạc quan theo `cap_nhat_luc`
- [ ] Step 6: Chạy tất cả test, xác nhận PASS
- [ ] Step 7: Commit `feat(task): chuyen trang thai kem phan quyen, lich su va thong bao`

**Definition of Done:** 9 TC trace pass · chuyển sai luật **không để lại dấu vết nào** trong DB (không lịch sử, không thông báo) · thông báo đúng luật trừ-người-thao-tác · không lỗi lint.

---

## Task 5: API `PATCH /tasks/:id` — sửa thông tin công việc
**Phụ thuộc:** Task 2
**Trace test:** TC-S03-38, TC-S03-40, TC-S03-41, TC-S03-42, TC-S03-43
**Proof:** `npx jest tests/modules/task/update-task.test.ts` — exit 0 = đạt
**Files:**
- Create: `src/modules/task/update-task.service.ts`
- Modify: `src/modules/task/task.controller.ts`
- Test: `tests/modules/task/update-task.test.ts`

- [ ] Step 1: Viết test thất bại cho TC-S03-38 — sửa 2 trường sinh **đúng 2** dòng lịch sử (`BRule-S03-08`), không phải 1
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — chỉ người duyệt (`BRule-S03-04`), tái dùng **nguyên bộ** validator của `POST /tasks` ở S02 (`R-S02-08`), chỉ ghi trường thực sự đổi
- [ ] Step 4: Viết test TC-S03-40 (Member gọi → 403), TC-S03-41 (assignee ngoài tổ chức → 422), TC-S03-42 (đổi người thực hiện → thông báo cho người mới), TC-S03-43 (**deadline quá khứ khi SỬA vẫn hợp lệ** — khác lúc tạo)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(task): sua thong tin cong viec kem lich su tung truong`

**Definition of Done:** 5 TC trace pass · sửa n trường ⇒ đúng n dòng lịch sử · validator dùng chung với S02 (không copy luật) · không lỗi lint.

---

## Task 6: Trang chi tiết — khối công việc, lịch sử, trạng thái tải/lỗi (frontend)
**Phụ thuộc:** Task 2, Task 3
**Trace test:** TC-S03-01, TC-S03-02, TC-S03-03, TC-S03-04, TC-S03-08, TC-S03-11, TC-S03-12, TC-S03-14, TC-S03-15
**Proof:** `npx jest tests/web/task-detail-page.test.tsx` — exit 0 = đạt
**Files:**
- Create: `web/app/tasks/[id]/page.tsx`, `web/components/task/TaskHeader.tsx`, `web/components/task/HistoryTimeline.tsx`
- Test: `tests/web/task-detail-page.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S03-03 (quá hạn → đỏ + ⚠) và TC-S03-04 (việc **DONE** quá hạn → **không** tô đỏ — `BRule-S03-06`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement theo `html-design.html`: 3 lời gọi **độc lập**, khối nào xong hiện khối đó (skeleton riêng từng khối)
- [ ] Step 4: Viết test TC-S03-11 (chi tiết 500 → khối lỗi + "Thử lại", header còn), TC-S03-12 (**chỉ** bình luận lỗi → lỗi cục bộ, phần còn lại vẫn dùng được), TC-S03-08 (404 → trang "Không tìm thấy công việc")
- [ ] Step 5: Viết test TC-S03-01/02/15 (render đủ trường, mô tả rỗng → "Không có mô tả", tiêu đề 200 ký tự xuống dòng không cắt), TC-S03-14 (quay lại giữ bộ lọc Dashboard)
- [ ] Step 6: Chạy tất cả test, xác nhận PASS
- [ ] Step 7: Commit `feat(web): trang chi tiet cong viec voi tai theo tung khoi`

**Definition of Done:** 9 TC trace pass · lỗi một khối **không** làm chết khối khác · không lỗi lint.

---

## Task 7: Thanh hành động theo trạng thái × vai trò (frontend)
**Phụ thuộc:** Task 4, Task 6
**Trace test:** TC-S03-28, TC-S03-26, TC-S03-29, TC-S03-30, TC-S03-31, TC-S03-35, TC-S03-36
**Proof:** `npx jest tests/web/action-bar.test.tsx` — exit 0 = đạt
**Files:**
- Create: `web/components/task/ActionBar.tsx`, `web/components/task/CancelConfirmDialog.tsx`
- Test: `tests/web/action-bar.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S03-28 — duyệt **đủ 6 biến thể** ở bảng "Thanh hành động" của `ascii-screen.md`; nút không hợp lệ phải **vắng mặt trong DOM**, không phải bị disable (`R-S03-07`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — bảng tra `(trạng thái, vai trò) → danh sách nút`; DONE/CANCELLED và người xem không liên quan ⇒ không render thanh
- [ ] Step 4: Viết test TC-S03-29 (huỷ có hộp xác nhận), TC-S03-30 (nhấn "Không" → **không** gọi API), TC-S03-31 (việc DONE **không có** nút huỷ)
- [ ] Step 5: Viết test TC-S03-35 (nhấn kép → chỉ **1** lời gọi, 1 dòng lịch sử), TC-S03-36 (mất mạng → badge **bật lại giá trị cũ** + toast lỗi)
- [ ] Step 6: Chạy tất cả test, xác nhận PASS
- [ ] Step 7: Commit `feat(web): thanh hanh dong theo trang thai va vai tro`

**Definition of Done:** 7 TC trace pass · test khẳng định **không tồn tại** nút (query trả null), không phải kiểm thuộc tính disabled · giao diện không bao giờ hiển thị trạng thái mà server chưa xác nhận · không lỗi lint.

---

## Task 8: Modal "Từ chối" kèm lý do bắt buộc (frontend)
**Phụ thuộc:** Task 4, Task 7
**Trace test:** TC-S03-19, TC-S03-20, TC-S03-21, TC-S03-22, TC-S03-37
**Proof:** `npx jest tests/web/reject-dialog.test.tsx` — exit 0 = đạt
**Files:**
- Create: `web/components/task/RejectDialog.tsx`
- Test: `tests/web/reject-dialog.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S03-19 — xác nhận từ chối tạo **đồng thời** 1 dòng lịch sử **và** 1 bình luận chứa đúng lý do (`BRule-S03-05`)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — gọi `POST /comments` trước rồi `PATCH /status`, theo đúng sơ đồ sequence §6 của srs
- [ ] Step 4: Viết test TC-S03-20 (lý do rỗng → nút xác nhận disable, không gọi API), TC-S03-21 (1001 ký tự → chặn), TC-S03-22 (đúng 1000 ký tự → hợp lệ)
- [ ] Step 5: Viết test TC-S03-37 (từ chối nửa chừng: bình luận đã tạo nhưng đổi trạng thái lỗi → thao tác lại **không bắt nhập lý do lần hai**)
- [ ] Step 6: Chạy tất cả test, xác nhận PASS
- [ ] Step 7: Commit `feat(web): modal tu choi kem ly do bat buoc`

**Definition of Done:** 5 TC trace pass · không bao giờ đổi được trạng thái mà thiếu bình luận lý do · không lỗi lint.

---

## Task 9: Khu bình luận + ô nhập (frontend)
**Phụ thuộc:** Task 3, Task 6
**Trace test:** TC-S03-07, TC-S03-44, TC-S03-45, TC-S03-46, TC-S03-47, TC-S03-48, TC-S03-49, TC-S03-50, TC-S03-51, TC-S03-55
**Proof:** `npx jest tests/web/comments.test.tsx` — exit 0 = đạt
**Files:**
- Create: `web/components/task/CommentList.tsx`, `web/components/task/CommentComposer.tsx`
- Test: `tests/web/comments.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S03-50 — bình luận chứa thẻ HTML hiển thị **nguyên văn**, không thực thi, không vỡ layout
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — render bằng text node (không `dangerouslySetInnerHTML`), bộ đếm `n/1000`, gửi xong xoá ô nhập và **giữ focus**
- [ ] Step 4: Viết test TC-S03-44 (gửi thành công, đếm +1), TC-S03-45 (rỗng → chặn), TC-S03-46 (1001 → chặn), TC-S03-47 (đúng 1000 → gửi được), TC-S03-07 (chưa có bình luận → trạng thái rỗng có thông điệp)
- [ ] Step 5: Viết test TC-S03-48 (lỗi gửi → **giữ nguyên nội dung đã gõ** + "Thử lại"), TC-S03-49 (**không có** nút sửa/xoá ở bất kỳ bình luận nào kể cả của chính mình — `BRule-S03-07`), TC-S03-51 (việc đã huỷ → ô nhập vô hiệu hoá kèm chú thích), TC-S03-55 (Member không liên quan vẫn bình luận được — `BRule-S03-10`)
- [ ] Step 6: Chạy tất cả test, xác nhận PASS
- [ ] Step 7: Commit `feat(web): khu binh luan bat bien kem o nhap`

**Definition of Done:** 10 TC trace pass · test khẳng định **không tồn tại** nút sửa/xoá trong DOM · nội dung đã gõ không bao giờ mất khi lỗi · không lỗi lint.

---

## Task 10: Cập nhật tại chỗ sau khi đổi trạng thái (frontend)
**Phụ thuộc:** Task 4, Task 7
**Trace test:** TC-S03-32, TC-S03-16
**Proof:** `npx jest tests/web/optimistic-history.test.tsx` — exit 0 = đạt
**Files:**
- Modify: `web/components/task/HistoryTimeline.tsx`, `web/app/tasks/[id]/page.tsx`
- Test: `tests/web/optimistic-history.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S03-32 — sau 200, dòng lịch sử mới xuất hiện ở **đầu** timeline mà **không tải lại trang**
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement — chèn dòng mới từ payload phản hồi, công bố thay đổi qua vùng `aria-live` (`R-S03-N05`)
- [ ] Step 4: Chạy test, xác nhận PASS
- [ ] Step 5: Commit `feat(web): cap nhat lich su tai cho sau khi doi trang thai`

**Definition of Done:** 2 TC trace pass · không có lời gọi `GET /history` thừa sau mỗi lần đổi trạng thái · thay đổi được đọc lên bởi trình đọc màn hình · không lỗi lint.

---

## Task 11: Modal "Sửa thông tin" (frontend)
**Phụ thuộc:** Task 5
**Trace test:** TC-S03-38, TC-S03-39, TC-S03-43
**Proof:** `npx jest tests/web/edit-task-dialog.test.tsx` — exit 0 = đạt
**Files:**
- Create: `web/components/task/EditTaskDialog.tsx`
- Test: `tests/web/edit-task-dialog.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S03-39 — bộ trường và thông báo lỗi **giống hệt** modal tạo việc ở S02
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Implement bằng cách **dùng lại component form của S02**, chỉ khác giá trị điền sẵn và luật deadline quá khứ
- [ ] Step 4: Viết test TC-S03-38 (lưu xong màn cập nhật ngay), TC-S03-43 (deadline quá khứ chỉ **cảnh báo**, không chặn)
- [ ] Step 5: Chạy test, xác nhận PASS
- [ ] Step 6: Commit `feat(web): modal sua thong tin cong viec dung lai form S02`

**Definition of Done:** 3 TC trace pass · **không** có bản sao thứ hai của bộ validate (dùng chung với S02) · không lỗi lint.

---

## Task 12: Khả năng tiếp cận & hiệu năng (chạy cuối)
**Phụ thuộc:** Task 6–11
**Trace test:** TC-S03-52, TC-S03-53
**Proof:** `npx jest tests/web/a11y-perf.test.tsx` — exit 0 = đạt
**Files:**
- Modify: các component ở Task 6–11
- Test: `tests/web/a11y-perf.test.tsx`

- [ ] Step 1: Viết test thất bại cho TC-S03-52 — thao tác đủ bằng bàn phím theo đúng thứ tự Tab của design-spec §8; badge phân biệt được **không chỉ bằng màu**
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Bổ sung nhãn truy cập, bẫy focus trong modal, Esc đóng, trả focus về nút đã mở; kiểm tương phản ≥ 4.5:1
- [ ] Step 4: Viết test TC-S03-53 — tải màn với 60 bình luận + 20 dòng lịch sử hoàn tất ≤ 2s ở p95 (`R-S03-N01`)
- [ ] Step 5: Chạy tất cả test, xác nhận PASS
- [ ] Step 6: Commit `feat(web): hoan thien a11y va nguong hieu nang man chi tiet`

**Definition of Done:** 2 TC trace pass · không còn nút biểu tượng thiếu nhãn · ngưỡng p95 đo được bằng số, không phải cảm tính · không lỗi lint.

---

## Đối chiếu độ phủ test

| Nhóm TC | Số TC | Task phủ |
|---|---|---|
| Xem chi tiết (F05) | 15 | Task 2, 6, 12 |
| Chuyển trạng thái (F06) | 28 | Task 1, 4, 5, 7, 8, 10, 11 |
| Bình luận (F07) | 12 | Task 3, 9 |
| **Tổng** | **55** | mọi TC-S03-01…55 đều có ít nhất 1 task |
