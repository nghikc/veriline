---
name: ba-batch
description: Use when cần đặc tả NHIỀU màn (≥3 màn ⬜) cùng lúc — mỗi màn một subagent song song (screen-spec → test → html-design), refresh tracking, gate ba-review một lần.
---

# ba-batch — Đặc tả nhiều màn SONG SONG (fan-out subagent)

## Mục tiêu
`ba-add-screen`/`ba-init` đặc tả **tuần tự** từng màn — 5 màn là 5 lượt chờ. `ba-batch` fan-out: **mỗi màn một subagent** chạy song song (mỗi màn một folder riêng → không giẫm chân nhau), main agent chỉ lo phần **dùng chung** (glossary, tracking, giả định, gate). 5 màn ≈ thời gian 1 màn.


> ⚙️ **Hồ sơ `mini`** (`conv-gates.md` → "Hồ sơ dự án"): đọc dòng `> Hồ sơ dự án:` ở đầu `docs/00-tracking.md` **trước khi lập phương án**. Khai `mini` thì mỗi màn chỉ có **5 file** (`ascii-screen · srs · html-design · test · plan`) — `ba-screen-spec` sinh 2 file thay vì 6 (usecase/userstory/design-spec dồn vào `srs.md`), gate tính "hoàn thành" theo **5/5**, và phương án phải ghi đúng con số đó chứ không phải 9.
## Điều kiện
- Đã có `02-functions.md` + `03-overview.md` (+ hàng tracking cho các màn). Chưa có → chạy `ba-screens` trước.
- **≥3 màn ⬜** mới đáng fan-out; 1–2 màn → `ba-add-screen` tuần tự đủ.
- Các màn trong lô **độc lập nhau** (spec màn A không cần kết quả màn B). Phụ thuộc chéo → tách màn đó chạy tuần tự sau.

## Quy trình

### 1. Chọn lô — **Cổng phương án** (BẮT BUỘC — `conv-gates.md` → "Cổng phương án")
Đọc `docs/00-tracking.md` → danh sách màn ⬜ (hoặc theo màn người dùng chỉ định). Fan-out ≥3 màn = hàng chục file ghi song song → **luôn trên ngưỡng, phải chờ duyệt**.

Trình phương án đủ 6 phần trước khi spawn subagent nào; phần "Sẽ làm" là **bảng lô**: `màn · mã S · file sẽ TẠO · màn đã có tài liệu sẽ bị đụng`, kèm dòng **`Ước tính: …`** từ `cost.js estimate ba-batch --man <số màn>` (báo giá — `conv-gates.md` → "Cổng phương án"). Rồi `AskUserQuestion` gộp luôn các lựa chọn của lô: **Chạy / Sửa phương án / Thu hẹp lô / Hủy** + có kèm `html-design` không (mặc định có) + **có kèm `e2e.spec.ts` không (mặc định KHÔNG — chỉ bật khi dự án đã theo E2E)**. Hỏi **một lần cho cả lô**, không hỏi lại từng màn. Chỉ "Chạy" mới được spawn subagent.

> Subagent con **không** chạy lại cổng này (chúng ở chế độ không tương tác) — cổng của cả lô đã do main chốt ở đây. Vì vậy cổng ở bước này là **điểm kiểm soát duy nhất** của `ba-batch`, không được lược.

### 2. Đóng gói ngữ cảnh chung (MỘT lần, main làm)
Đọc `conventions.md` + `conv-gates.md`, `01-requirements.md` (FR/NFR/BRule liên quan lô), `02-functions.md`, `03-overview.md` (điều hướng + mã màn), `07-design-system.md` nếu có → soạn **context pack** ngắn (đường dẫn file + mã màn + chức năng + FR liên quan + **lát quy ước** `conventions.js slice ba-screen-spec --out <scratch>/lat-quy-uoc.md` ≈ 47 KB thay 116 KB — subagent đọc lát, không đọc `conventions.md`) dùng chung cho mọi subagent — mỗi agent KHÔNG phải tự dò lại từ đầu.

### 3. Fan-out (một message, nhiều Agent tool call song song)
**Sau khi mỗi subagent về** (thông báo hoàn thành có `subagent_tokens`/`tool_uses`/`duration_ms`) → ghi sổ chi phí `node .claude/skills/ba-toolkit/scripts/cost.js add --agent <tên> --role "<việc>" --tokens <n> --tools <n> --ms <n> --model <m> --viec <Mã> --skill <skill này>` — cùng sổ với `ac-*` (`.claude/ac-cost.jsonl`), `cost.js report` so được giữa lô/dự án. Đo 16/09/2026: 317 k token/màn (spec + test + html), 26 phút/màn. Mỗi subagent nhận **lát quy ước** (`conventions.js slice ba-screen-spec`) trong context pack, không đọc trọn `conventions.md` 114 KB.
Mỗi màn một subagent `general-purpose`, prompt gồm context pack + luật:
- Làm đúng chuỗi skill cho màn của mình: đọc `.claude/skills/ba-screen-spec/SKILL.md` (+ `templates.md`) → 6 file phân tích; *(tùy chọn — nếu lô có chọn checklist)* `.claude/skills/ba-test/SKILL.md` mục "Chế độ `checklist`" → `checklist.md` (sinh **sau** screen-spec, **trước** test); `.claude/skills/ba-test/SKILL.md` → `test.md`; `.claude/skills/ba-html-design/SKILL.md` → `html-design.html` (nếu lô có chọn); `.claude/skills/ba-test-e2e/SKILL.md` → `e2e.spec.ts` (chỉ khi lô có chọn E2E — sinh **sau** `test.md`, mỗi `TC` một test).
- **CHỈ ghi trong folder màn của mình** (`docs/Screen-spec/<Nhóm>/<Mã> - <Tên>/`). **CẤM sửa file dùng chung**: `00-tracking.md`, `00-glossary.md`, `03-overview.md`, tài liệu màn khác.
- ⚠️ **Chỉ thị này ĐÈ LÊN bước cập nhật file dùng chung của các skill con** — phải nói thẳng trong prompt subagent, không để nó tự xử: `ba-screen-spec` bước 3 bảo *"cập nhật `00-tracking.md` + bổ sung thuật ngữ vào `00-glossary.md`"`, `ba-test`/`ba-html-design` cũng có bước tương tự. Trong chế độ batch, **BỎ QUA các bước đó** — thay vào đó **trả thuật ngữ mới và ô tracking cần đánh về cho main** trong báo cáo (mục dưới). Không phải "quên cập nhật": main làm bằng `refresh.js` + merge glossary ở bước 4, một lượt, không tranh ghi. Đây là **ngoại lệ duy nhất** với luật "mỗi skill phải tự cập nhật tracking" của `conventions.md`, và nó chỉ có hiệu lực bên trong `ba-batch`.
- Subagent **không hỏi được người dùng** → giả định tự sinh ghi vào bảng Giả định của `brainstorm.md` màn đó, trạng thái `Đề xuất ⚠️ chưa xác nhận` — KHÔNG tự coi là chốt.
- **Trả về (báo cáo, không phải file):** tóm tắt màn + danh sách thuật ngữ mới cần vào glossary + danh sách giả định `GĐ-..` + điều bất thường gặp phải.

### 4. Gom (main làm, sau khi mọi agent xong)
1. `node .claude/skills/ba-track/scripts/refresh.js` — tracking cập nhật bằng script, điền "Mã CN" nếu script báo `?`.
2. Merge **thuật ngữ mới** các agent trả về vào `00-glossary.md` (idempotent — bỏ dòng đã có).
3. **Gom giả định** mọi màn → rà xác nhận với người dùng MỘT lượt (AskUserQuestion theo từng màn hoặc batch bảng) → cập nhật trạng thái trong từng `brainstorm.md`.

### 5. Gate MỘT lần cuối — phải kết thúc bằng `ba-review all`
Chạy `ba-review <màn>` cho từng màn trong lô để có chẩn đoán chi tiết, **rồi BẮT BUỘC chạy `ba-review all` sau cùng**. Không được dừng ở vòng per-màn: `00-gaps.md` gộp theo scope, nên chỉ có `all` mới cập nhật đúng dòng `Đã phủ` và bảo đảm `ba-next` đọc được bức tranh toàn dự án (xem `conv-gates.md` → "Ghi `00-gaps.md`"). Còn 🔴/🟡 → DỪNG, liệt kê, sửa xong mới báo hoàn tất (chính sách gate `conventions.md`). Agent `ba-consistency-reviewer` bật theo luật của `ba-review`.

### 6. Tổng kết
Bảng: màn · file sinh · giả định chờ xác nhận · gap còn lại. Nhắc bước kế: `ba-build` (plan cho lô) hoặc `ba-next`.

## Lưu ý
- **Vì sao an toàn:** mỗi màn một folder riêng — xung đột chỉ xảy ra ở file dùng chung, nên file dùng chung do MAIN giữ độc quyền (luật cấm ở bước 3).
- Lô quá lớn (>6 màn) → chia 2 đợt, tránh loãng chất lượng review.
- Một agent thất bại/kết quả kém → chạy lại riêng màn đó (tuần tự, như `ba-add-screen`), không cần chạy lại cả lô.
- `ba-figma-draw` **KHÔNG đưa vào lô** — cần MCP và tương tác; chạy riêng từng màn sau nếu cần.
- Tiếng Việt; tuân toàn bộ quy ước `conventions.md` (ID, folder `<Mã> - <Tên>`, animation, footer Thuật ngữ).
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
