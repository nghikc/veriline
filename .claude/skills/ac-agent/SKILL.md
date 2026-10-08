---
name: ac-agent
description: Use when cần TẠO hoặc SỬA một agent (subagent) trong .claude/agents/, theo hợp đồng chuẩn, đăng ký roster; quyết skill hay agent trước khi viết.
---

# ac-agent — Xưởng agent cho đội agentcode

## Mục tiêu
Một agent mới trong toolkit phải là **file có hợp đồng**, không phải prompt viết vội: ai phái nó, nó nhận gì, trả verdict về **ai** (không bao giờ về tay bên bị soát), được đụng gì. Canon là `agents.roster` trong `conv-registry.md` (`<tên>:<loại>:<quyền>`); `scripts/check-agents.js` soát hai chiều và `lint.js` check 30 gọi nó. Luật đầy đủ: `conv-gates.md` → "Đội agent".

## Skill hay agent? — quyết trước khi viết
Agent chỉ đáng đẻ khi việc cần **cô lập ngữ cảnh**: người soát không được mang theo giả định của người viết (author ≠ verifier), hoặc việc chạy dài/song song cần cửa sổ riêng. Còn lại là **skill** (kiến thức + quy trình, chạy trong ngữ cảnh hiện tại) hoặc **script** (đếm được). Ba câu:
- Nếu bỏ cô lập ngữ cảnh, kết quả có tệ đi không? Không → skill.
- Phần việc có đếm/so/liệt kê được không? Có → script, kể cả khi vẫn cần agent cho phần phán đoán.
- Đã có agent nào trong roster làm cùng trục chưa? Có → mở rộng nó (`## Ranh giới` phải phát biểu được một câu "X soi A, agent mới soi B").

## Quy trình

### GĐ 1 — Phỏng vấn (KHÔNG ghi file)
Hỏi bằng `AskUserQuestion`, từng nhóm:
1. **Mục đích** — bắt/chứng minh điều gì mà skill gọi nó không tự làm được.
2. **Vì sao cần cô lập ngữ cảnh** — trả lời không được → dừng, đề xuất skill/script.
3. **Loại** theo `agents.kinds`: `review` (soát tài liệu, chỉ đọc) · `verify` (chứng minh code: chạy proof, không sửa) · `build` (viết code — orchestrator chia lô của GĐ2 agentcode, chưa có).
4. **Ai phái · khi nào · trả về đâu** — luật cứng: verdict về **orchestrator**, không về builder/author; agent **không spawn agent con**.
5. **Nhận gì** — liệt kê đích danh file/khoảng diff, không phải "cả docs/".
6. **Đầu ra** — định dạng cố định, có mã + mức + bằng chứng `file:line` + verdict một từ.
7. **Quyền** — `ro` (không Write/Edit/NotebookEdit/Agent; review còn không Bash) hay `rw`. `verify` **bắt buộc** có Bash.
8. **Model** — `opus` mặc định cho review/verify (có số đo ở `ba-consistency-reviewer`); muốn khác thì ghi số đo.

### GĐ 2 — Cổng phương án (HARD STOP)
Trình: **Đã đọc** (`conv-gates.md` "Đội agent", roster hiện có, skill sẽ phái) · **Hiểu** (8 câu, mỗi câu một dòng) · **Sẽ làm** (bảng: `.claude/agents/<tên>.md` TẠO · dòng roster SỬA · skill phái SỬA bước nào) · **Giả định** · **Câu hỏi chặn** · **Ngoài phạm vi**. Chờ duyệt. *(Gọi từ orchestrator đã qua cổng → in rút gọn, không hỏi lại — luật "Cổng cha bao phủ cổng con".)*

### GĐ 3 — Ghi + đăng ký + soát
1. Ghi `.claude/agents/<tên>.md` theo `assets/agent-template.md` — giữ đủ mục **"Ai phái · trả về đâu"** (check-agents đòi), câu "không spawn agent con", và với `verify` câu "không sửa".
2. Thêm `<tên>:<loại>:<quyền>` vào `agents.roster` (`conv-registry.md`).
3. Sửa skill phái nó: bước nào phái, truyền gì, nhận verdict rồi làm gì.
4. Chạy:
   ```bash
   node .claude/skills/ac-agent/scripts/check-agents.js --plain
   node .claude/skills/ba-toolkit/scripts/lint.js
   ```
   Exit ≠ 0 → sửa trước khi báo xong. Agent có mặt trong `ba-review`/`ba-batch` fan-out thì nhớ trần 8 agent (`conv-gates.md` → "Review agent độc lập").

## Rule cứng
- Không bịa số đo model: không có đối chứng thì ghi `model: opus` và nói là mặc định. **Model chỉ được `opus` hoặc `sonnet`** (`agents.models`, check-agents soát): `opus` cho mọi agent phán/viết (builder, verifier, judge, juror, evaluator, auditor, reviewer); `sonnet` chỉ cho việc cơ giới — canon `agents.sonnet.roles`: vá-Proof · roll-up-test.md · dựng-brief · verifier-vòng≥2 (chạy lại Proof hỏng + full suite, đối chiếu không đổi) · eval-chấm-lại (cùng case, cùng thang, sau lô sửa) — mỗi lượt ghi `--model sonnet` vào `cost.js` để `report` so được với opus cùng vai; **không `inherit`** (đổi theo model phiên mà không ai thấy); model khác (`fable`…) **phải hỏi người trước khi chạy** — người dùng chốt 17/09/2026.
- Không sinh agent `build` ở GĐ1 agentcode — luật lô/tóm tắt/không lồng của builder chưa có (orchestrator chia lô ở GĐ2); đẻ builder trước là để nó tự chấm bài.
- Agent `review`/`verify` không bao giờ được sửa file — kể cả "sửa nhỏ cho tiện".

## Ranh giới
- **`ba-new-skill`** sinh *skill* `ba-*`; skill này sinh *agent*. Cùng cây quyết định "skill hay agent" ở trên.
- **`ac-verify`** *dùng* agent `ac-verifier`; skill này *tạo/sửa* agent.
- Agent review cho tài liệu BA vẫn tuân `conv-gates.md` → "Review agent độc lập" (chỉ trả findings, skill nguồn mới sửa).

## Lưu ý
- Tiếng Việt có dấu trong mọi text agent đọc/viết; tên agent kebab-case, tiền tố `ba-` (soát tài liệu) hoặc `ac-` (đội code).
- Skill này không đẩy pipeline dự án — không nối `ba-next`.
