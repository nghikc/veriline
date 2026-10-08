# Kế hoạch build — <Tên màn hình> (Mã màn: S0x)

**Goal:** <một câu mô tả chức năng cần dựng.>
**Tài liệu nguồn:** srs.md, usecase.md, test.md, html-design.html (cùng folder).
**Thứ tự phụ thuộc:** <vd Task 1 → Task 2 → Task 3; ghi task nào chặn task nào.>

## Task 1: <Vertical slice đầu tiên — chạy được xuyên tầng>
**Phụ thuộc:** không (nền tảng)
**Trace test:** TC-S0x-01
**Proof:** `<lệnh chạy test của task, vd npx jest tests/…/x.test.ts>` — exit 0 = đạt (ac-verifier chạy y nguyên, không tự nghĩ lệnh)
**Files:**
- Create: `<đường dẫn code>`
- Test: `<đường dẫn test>`

- [ ] Step 1: Viết test thất bại (lấy từ TC-S0x-01 trong test.md)
- [ ] Step 2: Chạy test, xác nhận FAIL
- [ ] Step 3: Viết code tối thiểu cho pass
- [ ] Step 4: Chạy test, xác nhận PASS
- [ ] Step 5: Commit

**Definition of Done:** test pass · trace đúng TC-S0x-01 · không lỗi lint · <tiêu chí đo được khác>.

## Task 2: <Vertical slice tiếp theo>
**Phụ thuộc:** Task 1
<lặp cấu trúc trên, mỗi test case còn lại 1 task, mỗi task có Trace test + Proof + Definition of Done>
