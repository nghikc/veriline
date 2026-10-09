---
name: ba-next
description: Use when không biết dự án BA đang ở bước nào hay chạy skill gì tiếp — quét docs/, in trạng thái GĐ1–4 rồi đề xuất và chạy bước kế. Một cửa khi phân vân giữa các skill.
---

# ba-next — Một cửa: đang ở đâu, chạy gì tiếp?

## Mục tiêu
Người dùng KHÔNG cần thuộc cả pipeline. `ba-next` = một lệnh duy nhất: quét `docs/` → in **bảng trạng thái** (giai đoạn, tài liệu có/thiếu, trạng thái từng màn kèm `dev`/`e2e`, gap, ADR, CR mở, WI mở, ACT họp còn treo) → **đề xuất bước kế tiếp** → hỏi rồi **chạy luôn** bước đó.

## Quy trình
1. Chạy script (zero-dep, chỉ đọc):
   ```bash
   node .claude/skills/ba-next/scripts/status.js [docsDir=docs]
   ```
   Script tự tính: giai đoạn (GĐ1→GĐ4), tài liệu hệ thống `00-*` + `01`–`12` có/thiếu, trạng thái màn (kèm cột `dev` và `e2e`) từ `00-tracking.md`, gap 🔴/🟡 từ `00-gaps.md` (chỉ đếm dòng bảng), ADR Draft từ `10-architecture.md`, CR mở từ `00-cr.md`, **Work Item mở từ `00-backlog.md`** (Blocked = gấp), action item `ACT` chưa Xong trong `docs/Ho-so/meetings/` — kèm danh sách đề xuất (❗ = gấp); khối **⚙️ Tính năng đang tắt vì thiếu** (từ `ba-toolkit/scripts/thieu.js`: tài liệu cũ thiếu bảng phần tử / ma trận E / cột Cách chạy / §4b / data-chosen / Trace-Proof / verification mới → checker im) kèm một đề xuất không gấp `--bo-sung`.
2. **Diễn giải** cho người dùng: in nguyên bảng của script + bổ sung ngữ cảnh nếu biết thêm (vd cuộc trò chuyện đang dở việc gì). Lời diễn giải dùng chữ người dùng hiểu — "cổng", "bản đã chốt", "nợ có hạn chót", "bộ kiểm tra" (không "gate/baseline/checker"); mã như `S2`, `GĐ-03` để cuối câu trong ngoặc (`explain/README.md` → "Thuật ngữ bạn sẽ gặp").
3. **Đối chiếu nhanh** (script không thấy được): tracking có lệch hiện trạng file không → nghi ngờ thì chạy `node .claude/skills/ba-track/scripts/refresh.js --dry` trước.
4. **AskUserQuestion** với các đề xuất của script làm option (tối đa 4, ❗ lên đầu, option đầu ghi "(Khuyến nghị)") + để người dùng chọn.
5. Người dùng chọn → **invoke skill đó luôn** (qua Skill tool). Không chọn → dừng, chỉ để lại bảng trạng thái.

## Logic giai đoạn (script đã cài — để hiểu, không cần làm tay)
- **GĐ0/GĐ1:** chưa có `01-requirements.md` → chọn **cửa vào theo NGUỒN**: ý tưởng thô → `ba-discover` · tài liệu rời của khách (Word/PDF/ảnh/biên bản) → `ba-reverse-doc` · code có sẵn → `ba-reverse` · đã có brainstorm rồi → `ba-init`. Chưa có `00-personas.md` → nhắc `ba-discover persona` (rút `FR` ứng viên trước khi viết yêu cầu).
- **GĐ2:** thiếu `02-functions`/`03-overview` → skill tương ứng; còn màn ⬜/⚠️ → `ba-add-screen` (1–2 màn), **`ba-batch`** (≥3 màn — song song), `ba-track` (màn ⚠️ lệch). Màn **đủ 8/9 chỉ thiếu `plan.md`** → **`ba-feasible`** trước (soát tài liệu có code ra được không — rẻ hơn nhiều so với phát hiện lúc đang dev), rồi **`ba-build`**, KHÔNG phải `ba-track` (thiếu plan là thiếu artifact, không phải lệch cần đồng bộ).
- **GĐ3:** tài liệu đủ → kiểm `10-architecture.md`: thiếu/Draft → `ba-architecture` (gấp); chốt rồi → `dev-run`.
- **GĐ4:** dev ✅ hết → `ba-accept`.
- **Phạm vi `docs`** (`conv-gates.md` → "Hồ sơ dự án" → "Phạm vi"): dự án chỉ làm tài liệu → không có GĐ3 dev/GĐ4. Tài liệu đủ → **`GĐ3 — Bàn giao tài liệu`**: `ba-review all` (gấp nếu chưa có `00-gaps.md`) → `ba-trace` → `ba-accept uat` (tùy chọn) → `ba-portal`. Script **không bao giờ** gợi `ba-build`/`dev-run`/`ba-accept`/`ba-conformance`/`ba-test-e2e` ở phạm vi này và in `⚙️ phạm vi docs` cạnh giai đoạn. Người dùng hỏi "sao không thấy bước dev" → chỉ vào dòng `Phạm vi:` trong `00-tracking.md`, đổi sang `full` + `ba-export update --scope full` nếu họ muốn dev.
- **Chen ngang mọi giai đoạn:** gap 🔴 → `ba-review` (gấp); `e2e` ⚠️ lệch `test.md` → `ba-test-e2e` (gấp), dự án đang theo E2E mà màn mới ⬜ → nhắc bổ sung; kiến trúc nhắc hệ ngoài/đối tác mà thiếu `12-api-integration.md` → `ba-api-spec partner`; CR mở → `ba-change-request list`; **WI mở → `ba-task list`** (Blocked = gấp); `ACT` họp chưa Xong → `ba-discover meet` (việc nào là thay đổi thì mở CR, việc mới/kỹ thuật thì mở WI).

## Lưu ý
- **Tôn trọng hồ sơ dự án** (`conv-gates.md` → "Hồ sơ dự án"). Dự án khai `> Hồ sơ dự án: \`lite\`` ở đầu `00-tracking.md` → script **không đề xuất** `ba-task`/`ba-changelog`/`ba-conformance` nữa (dự án đã chủ động tắt), và in `⚙️ hồ sơ lite` cạnh giai đoạn. Đừng diễn giải các ô trống đó thành "dự án bỏ sót" — hỏi người dùng có muốn chuyển sang `full` thì mới bật lại.
- **Con số gap chỉ đúng trong phạm vi đã phủ.** `00-gaps.md` gộp theo scope (`conv-gates.md` → "Ghi `00-gaps.md`"), nên script đọc header `Scope · Ngày · Đã phủ` và cảnh báo khi báo cáo mới phủ một phần (hoặc là file cũ chưa có header). Thấy cảnh báo đó thì **đừng kết luận dự án sạch** — chạy `ba-review all` lấy số thật trước.
- Script **chỉ đọc**; mọi hành động sửa đổi đều qua skill được chọn (skill đó tự lo gate/cổng chốt của nó).
- Yêu cầu đổi **nội dung** ("thêm màn X", "đổi rule Y", **"bỏ màn Z"/"gộp hai màn"**) → không phải việc của ba-next; route thẳng `ba-add-screen` / `ba-change-request` / **`ba-remove`** (cắt phạm vi).
- Tiếng Việt.

## Ranh giới

- `ba-toolkit` là bản đồ pipeline; `ba-next` quét dự án thật rồi chạy bước kế.
