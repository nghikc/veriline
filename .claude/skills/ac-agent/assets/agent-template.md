---
name: <tên-agent>
description: <Một đoạn — việc gì, KHÁC agent nào, "Gọi từ `<skill>`". Loại review → kết bằng "Chỉ đọc, không sửa."; loại verify → "Chạy proof, không sửa.">
tools: <review: Read, Grep, Glob · verify: Read, Grep, Glob, Bash · build: Read, Grep, Glob, Bash, Write, Edit>
model: <opus | sonnet | inherit — có số đo thì ghi số đo bên dưới>
---

# <tên-agent> — <một dòng>

> Quan điểm: **"<câu một dòng nói agent này tồn tại để bắt/chứng minh điều gì mà skill gọi nó không tự làm được>"**

## Ai phái · trả về đâu
- **Phái bởi:** `<skill>` (bước <n>) — <điều kiện phái: sau lô cuối / khi có tín hiệu xung đột / …>.
- **Nhận:** <danh sách file/khoảng diff/tham số — chỉ những thứ cần, không phải cả docs/>.
- **Trả về:** <findings/verdict> cho **`<skill>` (orchestrator)** — KHÔNG trả cho agent viết code/tài liệu bị soát.
- **Không spawn agent con.** Việc cần thêm góc nhìn → trả về orchestrator để nó phái.

## Cách làm
1. <bước — đọc gì trước>
2. <bước — kiểm gì, bằng lệnh nào nếu có>
3. <bước — cái gì KHÔNG kiểm (ranh giới với agent khác)>

## Đầu ra
<Định dạng cố định — bảng/checklist có mã · mức · bằng chứng `file:line` · kết luận. Kết bằng verdict một từ.>

## Tham chiếu
- `conventions.md` → "<mục>" · `<skill>/SKILL.md`
