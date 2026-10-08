# Brief cho ac-builder — lô <n>/<tổng> · màn <Mã> — <Tên>

Bạn là `ac-builder` (đọc `.claude/agents/ac-builder.md` trước). Làm **đúng lô này**, tuần tự, dừng ở task đầu tiên hỏng. Không spawn agent, không push, không tự chấm xong.

## Bối cảnh
- Gốc code: `<--root>` · nhánh: `<feat/…>` · base: `<sha>` · mức tự chủ: `<paired|solo|heads-down>`
- Tài liệu màn: `<docs/Screen-spec/…/srs.md>` · `<…/test.md>` · plan: `<…/plan.md>`
- Cấu trúc thư mục + stack đã chốt: `<docs/10-architecture.md>` §<mục> — file path trong task phải bám đúng, không tự bịa layout.
- Quy ước commit: `<theo plan / conventional-commit, message nhắc "Task N">`
- Lệnh chạy test/lint/typecheck của repo: `<…>` (đọc từ `dev-notes.md`/`package.json`; không có thì nói "không có lệnh")
- **Đọc theo ID:** `node .claude/skills/ba-index/scripts/query.js get <TC-…|R-S…|E-S…>` thay vì Read trọn srs/test.md (chỉ Read trọn khi file < 20 KB). **Test gọn:** Proof của task với `<reporter gọn của repo, vd --reporter=dot>`; full suite một lần cuối lô, `| tail -20`.
- Luật viết code của worker: `.claude/skills/dev-run/references/coding-guidelines.md` — đọc TRƯỚC khi mở file đầu tiên; lệch ADR/API/schema là `blockers`, lệch plan/srs/stack là `deviations`.

## Trí nhớ đội (ac-memory)
- **Đọc trước** (Briefing): `docs/Ho-so/notes/INDEX.md` nếu có — mở ghi chú nào neo vào file bạn sắp sửa.
- **Bài học đã xác nhận** (chỉ `confirmed`, từ `lessons.js list --status confirmed --plain`):
<dán output, hoặc "chưa có">
- Sau lô: KHÔNG tự sửa INDEX/sổ bài học — ghi bẫy đáng nhớ vào `deviations`/`blockers`, orchestrator Debrief.

## Luật brief (LS-03, dogfood 15/09/2026)
Brief KHÔNG chép lại câu chữ thông báo/lỗi/nhãn — chỉ trỏ `srs.md`/`test.md` (E-S.., cột Kết quả mong đợi). Orchestrator từng chép sai một câu và worker phải sửa theo srs; nếu có mâu thuẫn brief ↔ srs, srs/test.md thắng, ghi vào `deviations`.

## Task của lô (nguyên văn từ plan.md)
<dán nguyên các khối `## Task N` của lô, không cắt Trace test / Proof / Files / Steps / DoD>

## Trả về
Ghi **đúng** JSON 4 trường vào `<đường dẫn file tóm tắt orchestrator chỉ định>` rồi dừng:
```json
{ "model": "<model id của bạn>", "tasks": [{ "n": <N>, "commit": "<sha ngắn>" }], "tests": { "passed": 0, "failed": 0 }, "deviations": [], "blockers": [] }
```
Không dán log test, không kể lại quá trình. Task hỏng → `blockers` ghi task · vì sao · chỗ (`file:line`).
