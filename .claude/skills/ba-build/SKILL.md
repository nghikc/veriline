---
name: ba-build
description: Use when tài liệu BA các màn đã đủ và cần lập KẾ HOẠCH triển khai code cho từng chức năng; bước 7, sinh plan.md trong mỗi folder màn rồi bàn giao dev.
---

# ba-build — Kế hoạch build theo từng chức năng

## Mục tiêu
Với mỗi folder màn hình đã có tài liệu, sinh `plan.md` (kế hoạch triển khai phạm vi 1 chức năng). Không tự chạy code.

## Quy trình
0. **Cổng thu nợ 🟠 (BẮT BUỘC — `conventions.md` + `conv-gates.md` → "Quy ước gate").** Đọc mục **"Nợ có hạn"** của `docs/Ho-so/00-gaps.md`: mọi gap 🟠 có `Mốc = ba-build` (hoặc `dev-run`) **phải sạch trước khi sinh plan** — chủ yếu là **giả định còn `⚠️ chưa xác nhận`** và **ADR/hợp đồng tích hợp còn `Draft`**. Còn nợ → **DỪNG**, liệt kê từng dòng kèm skill sửa, route về đó. *Đây là chỗ 🟠 được thu: mức 🟠 không chặn gate đặc tả chính vì nó có hạn chót ở đây — bỏ qua cổng này thì 🟠 thành gap bị lờ đi vĩnh viễn.* Không có `00-gaps.md`, hoặc file chưa có mục "Nợ có hạn" (bản trước 14/08/2026) → bỏ qua bước này, ghi rõ trong báo cáo là **chưa soát nợ**.
0b. **Soát khả thi (khuyến nghị mạnh).** Chạy `node .claude/skills/ba-feasible/scripts/scan-feasible.js docs --plain`. Còn **🔴** → **dừng**, route `ba-feasible` để diễn giải rồi sửa nguồn: 🔴 ở đây nghĩa là quy tắc nghiệp vụ không có chỗ lưu, hoặc kiến trúc thiếu cây thư mục cho một tầng đã chốt — sinh plan trên nền đó là sinh ra thứ **không code được**, và cái giá phải trả rơi vào lúc dev đang giữa chừng. Còn 🟡 thì ghi vào phương án chứ không chặn.

1. Đọc `conventions.md` của `ba-toolkit` và `docs/00-tracking.md` để biết màn hình nào đã đủ tài liệu. **Đầu `00-tracking.md` khai `Phạm vi: \`docs\`** (`conv-gates.md` → "Hồ sơ dự án" → "Phạm vi") → **dừng, không sinh plan**: dự án này không dev trong repo, `plan.md` không thuộc bộ file. Nói rõ và chỉ cách đổi (`Phạm vi: full` + `ba-export update --scope full`) nếu người dùng thật sự muốn dev (`srs`/`usecase`/`test`/`html` = ✅). **Hồ sơ `mini`** (`conv-gates.md` → "Hồ sơ dự án") **không có cột `usecase`** — điều kiện là `srs`/`test`/`html` = ✅; bám nguyên điều kiện 4 cột thì KHÔNG màn `mini` nào đủ điều kiện và `ba-build` đứng im vĩnh viễn. **Nếu có `docs/10-architecture.md` (ADR đã `Accepted`):** đọc §Cấu trúc thư mục chuẩn + §Phân tầng + stack → **file path trong plan phải bám cấu trúc đã chốt** (không tự bịa layout). ADR còn **Draft/chưa chốt** → **dừng**, route `ba-architecture` qua cổng chốt trước (xem "Cổng chốt kiến trúc" trong `conventions.md`).
2. Với mỗi màn đủ điều kiện: đọc `srs.md`, `usecase.md`, `test.md`, `html-design.html` — ở hồ sơ `mini` **không có `usecase.md`**, luồng chính/ngoại lệ đọc ở **mục "Luồng" của `srs.md`** — rồi viết `docs/Screen-spec/<Nhóm>/<Màn>/plan.md` theo `plan-template.md`. REQUIRED BACKGROUND: nội dung plan tuân theo dev-writing-plans (task bite-sized, TDD, có file path **khớp `10-architecture.md` nếu có**, commit).
3. Cập nhật ô `plan` của màn trong `docs/00-tracking.md` = ✅.
4. **Dừng tại đây.** Báo người dùng danh sách plan đã sinh; họ chủ động chạy khâu dev bằng `dev-run <màn>` (orchestrator dùng dev-executing-plans / dev-subagent-driven-development bên trong).

## Kỹ thuật áp dụng
- **Vertical Slice:** chia task theo *lát cắt dọc chạy được* (đi xuyên từ UI → logic → dữ liệu cho một mẩu chức năng nhỏ), không cắt theo tầng kỹ thuật (tránh "task làm hết UI", "task làm hết API"). Mỗi slice giao được giá trị quan sát được.
- **Test-Driven Development (TDD):** mỗi task viết test thất bại trước (lấy từ `TC-S0x-..` trong `test.md`) → code tối thiểu cho pass → commit.
- **Dependency-ordered Sequencing:** xếp task theo thứ tự phụ thuộc (nền tảng/dữ liệu trước, UI phụ thuộc sau); ghi rõ task nào chặn task nào.
- **Definition of Done (DoD):** mỗi task có tiêu chí hoàn thành đo được (test pass, trace về TC nguồn, không lỗi lint…).

## Cổng máy trước khi bàn giao
Mỗi task phải có `**Proof:**` — lệnh chạy test của task (exit 0 = đạt), vì `ac-verifier` sẽ chạy **y nguyên** lệnh đó, không tự nghĩ lệnh thay. Viết xong plan chạy:
```bash
node .claude/skills/ac-verify/scripts/check-plan.js docs --screen <Mã> --plain
```
Exit ≠ 0 (thiếu Proof/Trace test/DoD, phụ thuộc vòng) → sửa plan trước khi báo xong. Cảnh báo >12 task là mùi chia nhỏ — cân nhắc gộp theo slice quan sát được (granularity ≠ quality).

## Tiêu chí chất lượng (BẮT BUỘC)
- Mỗi task là **vertical slice test được độc lập**, có DoD rõ; cấm task mơ hồ không kiểm chứng được.
- Mỗi task **trace về ≥1 test case** trong `test.md`; mọi TC quan trọng đều có task phủ.
- Task xếp **đúng thứ tự phụ thuộc**; nêu rõ ràng buộc trước/sau.

## Lưu ý
- Mỗi plan độc lập, triển khai được riêng để quản lý theo từng chức năng.
- Test case trong `test.md` là nguồn cho bước test của plan (TDD).
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
