---
name: ba-discover
description: Use when khởi động DISCOVERY trước ba-init — chuỗi brainstorm → vision → stakeholder → persona → AS-IS/TO-BE → URD có gate; `brainstorm` cũng chạy lẻ; chế độ lẻ `meet` biên bản họp, `roadmap` ưu tiên lộ trình.
---

# ba-discover — Orchestrator giai đoạn Discovery

## Chế độ
| Gọi | Làm gì |
|---|---|
| `ba-discover` | **Chuỗi discovery trọn** (không đối số chế độ) — Quy trình 0–10 bên dưới: brainstorm → vision → stakeholder → (persona) → (process) → urd, gate giữa các bước |
| `ba-discover vision` | Tầm nhìn & Phạm vi / Business Case → `docs/Ho-so/00-vision.md` (trước là `ba-vision`) |
| `ba-discover stakeholder` | Bên liên quan — Power/Interest, RACI, giao tiếp → `docs/Ho-so/04-stakeholders.md` (trước là `ba-stakeholder`) |
| `ba-discover persona` | Personas + user journey, ứng viên `U-..` → `docs/Ho-so/00-personas.md` (trước là `ba-persona`) |
| `ba-discover process` | Quy trình AS-IS → TO-BE → Gap (ESIA) → `docs/Ho-so/00-process.md` (trước là `ba-process`) |
| `ba-discover urd [<feature>]` | URD solution-free — `UN`/`UE`/`USC` → `docs/Ho-so/00-urd.md` hoặc `docs/urd/<feature>.md` (trước là `ba-urd`) |
| `ba-discover brainstorm` | Phỏng vấn sâu IT-BA (deep/nhanh, focused) → `docs/Ho-so/00-brainstorm.md` (trước là `ba-brainstorm`). **Không thuộc chuỗi như một bước riêng** — là động cơ phỏng vấn mọi bước gọi tới; dùng lẻ được bất kỳ lúc nào trước `ba-requirements` |
| `ba-discover meet` | Biên bản họp MoM — `DEC`/`ACT`, mở CR/WI → `docs/Ho-so/meetings/<ngày>-<chủ-đề>.md` (trước là `ba-meet`). **Không thuộc chuỗi** — chạy bất kỳ lúc nào có ghi chú họp |
| `ba-discover roadmap` | Ưu tiên MoSCoW + RICE + Kano, lộ trình Now/Next/Later → `docs/Ho-so/08-roadmap.md` (trước là `ba-roadmap`). **Không thuộc chuỗi** — chạy SAU `ba-functions` (cần `F..`) |

Đối số đầu là một chế độ → nhảy thẳng tới mục "Chế độ …" tương ứng ở cuối file và **đọc `references/<chế-độ>.md`** (quy trình đầy đủ), **không** chạy chuỗi trọn. Mẫu đầu ra ở `assets/<chế-độ>-template.md`.

## Mục tiêu
Chạy trọn **giai đoạn khám phá (discovery)** cho một dự án mới trong một lần trigger: *vì sao làm → ai liên quan → đào sâu nghiệp vụ → quy trình hiện tại→tương lai → người dùng cần gì*. Đây là phần **"hiểu vấn đề"** đứng **trước** `ba-init` (vốn bắt đầu ở yêu cầu). Chuỗi lần lượt chạy các chế độ, dừng ở mỗi gate nếu có gap.

> Dùng khi khởi động dự án thực tế đúng cách BA làm: hiểu vấn đề & hiện trạng **trước**, không nhảy thẳng vào giải pháp. Ý tưởng đã rõ chiến lược/không cần discovery → chạy thẳng `ba-init`.

## Quy trình
Đọc `conventions.md` + `conv-gates.md` của `ba-toolkit`. Làm rõ với người dùng: đây là dự án **mới hoàn toàn** hay **số hóa một quy trình đang chạy** (quyết định có chạy chế độ `process` không).

**Bước 0 — Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Quét `docs/` (đã có `00-vision`/`00-personas`/`00-process`/`00-urd` chưa — có thì DÙNG LẠI, không dựng lại) → trình phương án đủ 6 phần, phần "Sẽ làm" nêu rõ **chạy những bước discovery nào** (vision / stakeholder / brainstorm / process AS-IS→TO-BE / URD) và file nào sẽ TẠO vs SỬA → `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Chỉ "Chạy" mới được ghi file.

> **Nguyên tắc xen kẽ brainstorm:** chế độ `brainstorm` là **động cơ phỏng vấn sâu dùng chung**. Trước mỗi bước phân tích, nếu đầu vào còn mơ hồ thì **chạy `ba-discover brainstorm` (focused)** để elicit sâu trước — thay vì để bước phân tích tự hỏi hời hợt. Nhờ continuation mode, mỗi lần focused **nối thêm** vào cùng `docs/Ho-so/00-brainstorm.md`, không ghi đè.

Thực hiện tuần tự (mỗi bước = một chế độ, theo mục "Chế độ …" + `references/<chế-độ>.md`):

1. **Brainstorm — làm rõ VẤN ĐỀ (focused):** `brainstorm` scoped vào *pain thật · ai chịu · vì sao bây giờ · quy mô* → `docs/Ho-so/00-brainstorm.md`. Đây là nền để `vision` không suy đoán.
2. `vision` (đọc `00-brainstorm.md`) → `docs/Ho-so/00-vision.md` (vấn đề, mục tiêu SMART, options + ROI, phạm vi, KPI).
3. **Gate:** invoke `ba-review vision` (xem "Quy ước gate" trong conventions). Còn 🔴/🟡 → dừng để người dùng bổ sung; chỉ 🟢/sạch → tiếp.
3b. **Nhánh "không làm / chưa làm":** đề xuất ở §3 của vision là giữ nguyên, hoặc người dùng chốt chưa làm → **đó là một kết luận, không phải bước bị lỡ**. Ghi dòng `Trạng thái: Không làm|Chưa làm — xác nhận: <ai> · <ngày> · mở lại khi: <điều kiện>` đầu `00-vision.md` (mẫu dòng ở `assets/vision-template.md`) rồi **DỪNG discovery** — không chạy stakeholder/persona/URD cho việc đã từ chối, không gợi ý `ba-init`. Người xác nhận phải là người dùng, không phải agent tự suy.
4. `stakeholder` (đọc `00-vision.md` + brainstorm làm ngữ cảnh) → `docs/Ho-so/04-stakeholders.md` (Power/Interest + RACI).
5. **Gate:** invoke `ba-review stakeholder`. Còn 🔴/🟡 → dừng; chỉ 🟢/sạch → tiếp.
5b. **Người DÙNG app (nên chạy — bỏ qua nếu app chỉ có 1 loại người dùng hiển nhiên):** `persona` (đọc `00-vision.md` + `04-stakeholders.md` + brainstorm) → `docs/Ho-so/00-personas.md` (personas + user journey). Đầu ra quan trọng: danh sách **ứng viên `U-..`** rút từ nỗi đau/nhu cầu. *(`stakeholder` = ai có quyền lực/quyền lợi; `persona` = người dùng app trông thế nào — hai việc khác nhau, đừng gộp.)*
6. **(Nếu số hóa) Brainstorm — làm rõ QUY TRÌNH HIỆN TẠI (focused):** `brainstorm` scoped vào *các bước AS-IS · ai làm bước nào · điểm quyết định · nút thắt/pain · số liệu (thời gian, khối lượng)* → nối vào `00-brainstorm.md`. Nền để `process` vẽ AS-IS đúng.
7. **(Nếu số hóa)** `process` → `docs/Ho-so/00-process.md` (AS-IS→TO-BE→Gap→yêu cầu phát sinh). Dự án mới hoàn toàn → **bỏ qua bước 6–7**.
8. **Brainstorm — đào sâu GIẢI PHÁP (đầy đủ 7 phần):** `brainstorm` chạy trọn phỏng vấn sâu về giải pháp mong muốn (luồng chính, edge case, validation, wording…) → hoàn thiện `00-brainstorm.md`, làm đầu vào chi tiết cho `ba-requirements`.
8b. **Chốt NHU CẦU người dùng (nên chạy):** `urd` (đọc `00-brainstorm` + `00-personas` + `00-vision` + `00-process` nếu có) → `docs/Ho-so/00-urd.md`: nhu cầu `UN-..` có bằng chứng + ranh giới phạm vi + hành trình ưu tiên + ngoại lệ + tiêu chí thành công `USC-..`. Đây là **điểm gom** của cả giai đoạn discovery — mọi thứ vừa đào được quy về "người dùng cần gì", **solution-free**, làm đầu vào trực tiếp cho `ba-requirements`.
   - **Gate:** invoke `ba-review urd` — chú ý luật 🔴 *rò rỉ giải pháp*. Còn 🔴/🟡 → dừng, sửa.
9. **Gate:** invoke `ba-review process` (nếu có `00-process.md`) rồi `ba-review all`. Còn 🔴/🟡 → dừng; chỉ 🟢/sạch → tiếp.
10. **Bàn giao:** báo người dùng discovery xong; tài liệu nền (`00-vision`, `04-stakeholders`, `00-personas` nếu có, `00-urd` nếu có, `00-brainstorm`, và `00-process` nếu có) đã sẵn làm đầu vào cho **`ba-init`** (hoặc `ba-requirements` lẻ). Kèm theo danh sách `UN-..` theo mức quan trọng (mỗi `UN` sẽ thành ≥1 `StR`/`FR`/`NFR`) và ứng viên `U-..` từ personas. Gợi ý chạy `ba-init`.

## Lưu ý
- **Checkpoint giả định:** `vision`/`brainstorm`/`process`/`persona`/`urd` tự chạy vòng "Xác nhận giả định" (`conventions.md`) — chuỗi **không bỏ qua**; chỉ khi người dùng đồng ý "đi tiếp" mới sang bước kế.
- Điểm cần input người dùng: hỏi đáp ở `vision`/`brainstorm`/`process`, và mỗi gate còn gap 🔴/🟡.
- `process` **có điều kiện** — chỉ chạy khi có quy trình AS-IS thật; đừng ép dự án greenfield. `persona` **có điều kiện** — bỏ qua khi chỉ một loại người dùng hiển nhiên (vd tool nội bộ 1 vai).
- **Đã có tài liệu yêu cầu rời** (Word/PDF/ảnh/biên bản của khách) → chạy `ba-reverse-doc` **trước** (kiểm kê nguồn → `00-intake.md` → seed `01-requirements.md`), rồi mới dùng discovery để lấp chỗ trống; đừng phỏng vấn lại cái tài liệu đã trả lời.
- Không sinh yêu cầu/màn/plan — dừng ở tài liệu discovery, để `ba-init` tiếp.
- Discovery có họp với khách → ghi chú thô đưa qua `ba-discover meet` → MoM (`DEC` chốt phạm vi phải phản ánh lại vào `00-vision`/`01-requirements`).

## Ranh giới
- KHÁC `ba-init` (GĐ2 — từ yêu cầu xuống plan): discovery dừng ở "hiểu vấn đề", không cấp `FR`/`F`/`S`.
- KHÁC `ba-reverse-doc` (dựng lại yêu cầu từ tài liệu rời có sẵn).

## Chế độ `vision` — Tầm nhìn & Phạm vi / Business Case
**Đọc `references/vision.md` trước khi chạy.** Tóm tắt:
- Sinh `docs/Ho-so/00-vision.md` theo `assets/vision-template.md` — 1 file/dự án, chạy ĐẦU TIÊN, là nguồn "Business Need" của `ba-requirements`.
- Vấn đề/cơ hội (pain · ai chịu · giá của việc KHÔNG làm) → mơ hồ thì `brainstorm` focused trước. Mục tiêu SMART `BO-..`; **≥2 phương án** (kể cả không làm) + cost-benefit cùng đơn vị → đề xuất có lý do; In/Out-of-scope + MoSCoW; KPI gắn đúng 1 `BO` có ngưỡng số.
- Người dùng chốt không/chưa làm → dòng `Trạng thái:` đầu file (ai · ngày · điều kiện mở lại), dừng ở §3.
- **Xác nhận giả định (BẮT BUỘC)** `GĐ-..`; không bịa số — batch → `⚠️ chưa xác nhận`. Footer `## Thuật ngữ` tại chỗ (glossary thường chưa có).

## Chế độ `stakeholder` — Phân tích các bên liên quan
**Đọc `references/stakeholder.md`.** Tóm tắt:
- Sinh `docs/Ho-so/04-stakeholders.md` theo `assets/stakeholder-template.md`: danh bạ (Onion Diagram đủ 4 lớp, kể cả nhóm gián tiếp) · ma trận Quyền lực × Quan tâm · mức tham gia hiện tại/mong muốn · RACI · kế hoạch giao tiếp.
- Mỗi stakeholder có ô Power/Interest + mức tham gia + trace `StR-..`; **RACI mỗi hàng đúng 1 A**, ≥1 R. Footer `## Thuật ngữ` + bổ sung `00-glossary.md`.

## Chế độ `persona` — Chân dung người dùng & Hành trình
**Đọc `references/persona.md`.** Tóm tắt:
- Sinh `docs/Ho-so/00-personas.md` theo `assets/persona-template.md`: 3–5 persona `PS-..` (chính/phụ) + journey (Mermaid `journey` + bảng nỗi đau/cơ hội) cho mỗi persona chính × kịch bản then chốt.
- Mỗi nỗi đau/cơ hội → **ứng viên `U-..`** (chưa phải `FR`), gom bảng tổng hợp cuối file. Dự án đã có `01-requirements` → `U-..` chưa phủ thì đề xuất CR, không sửa thẳng.
- Không có dữ liệu người dùng thật → persona là giả thuyết, `GĐ ⚠️ chưa xác nhận`. *Persona = người DÙNG trông thế nào; stakeholder = ai có quyền lợi/quyền lực.*

## Chế độ `process` — AS-IS/TO-BE + Gap analysis
**Đọc `references/process.md`.** Tóm tắt:
- Sinh `docs/Ho-so/00-process.md` theo `assets/process-template.md`: AS-IS và TO-BE đều **`swimlane-beta`** (mỗi vai trò 1 lane, `:::role` + `classDef`) → bảng Gap từng bước có loại **ESIA** + nguyên nhân → yêu cầu phát sinh trace `FR`/`BR`/`TR`.
- AS-IS chưa rõ → `brainstorm` focused trước. Sơ đồ phức tạp → `ba-review diagram docs/Ho-so/00-process.md`. Không bịa hiện trạng — hỏi, batch → `⚠️ chưa xác nhận`.

## Chế độ `urd` — User Requirements Document (solution-free)
**Đọc `references/urd.md` trước khi chạy** — 12 bước, luật vàng, đối chiếu bốn nơi. Tóm tắt:
- `ba-discover urd` → `docs/Ho-so/00-urd.md`; `ba-discover urd <feature>` → `docs/urd/<feature>.md` (kebab-case). File có rồi → cập nhật, mã `UN`/`USC`/`UE` không đánh lại số. Mẫu `assets/urd-template.md` (10 mục).
- **LUẬT VÀNG solution-free:** đổi cách hiện thực mà câu vẫn đúng mới là nhu cầu — không tên màn/nút/API/bảng/công nghệ. Không có nguồn nào → `brainstorm` focused trước, **không** viết URD từ suy đoán.
- `UN-..` nguyên tử có bằng chứng · 3–6 hành trình có câu "kiểm chứng độc lập" · `UE-..` ngoại lệ (cột "Chưa màn nào xử lý") · `USC-..` đo kết quả người dùng · `OQ-..`. Ngoài phạm vi không rỗng.
- Dự án đã có `01-requirements` → đối chiếu từng `UN` theo bốn nơi (requirements → roadmap → `00-cr`/`00-backlog` → ngoài phạm vi có chủ đích) rồi mới gọi là hở → đề xuất CR/WI, **không** sửa thẳng. Gate: `ba-review urd`.

## Chế độ `brainstorm` — Phỏng vấn sâu IT-BA
**Đọc `references/brainstorm.md` + 3 rule `references/rules/` (`it-ba-framing.md` · `complexity-triggers.md` · `interview-discipline.md`) trước khi hỏi.** Tóm tắt:
- Ghi `docs/Ho-so/00-brainstorm.md` theo `assets/brainstorm-template.md`. Nguồn: text / `@file` / ảnh. File đã có → **continuation**: đọc hết, chỉ hỏi phần thiếu, no-re-ask.
- **Deep** (mặc định): 7 phần P1–P7 + P8 nhẹ, **từng câu một**, chỉ hỏi nghiệp vụ; P4 artifact chỉ khi có complexity trigger. **Nhanh/shallow** chỉ khi người dùng nói. **Focused** khi chuỗi hay chế độ khác gọi tới (scoped một chủ đề, nối thêm).
- Cổng chất lượng trước khi ghi (luồng `3.x` riêng, số chính xác, wording 3 nhóm, `OQ-..`/`GĐ-..`); **Xác nhận giả định (BẮT BUỘC)** rồi mới bàn giao cho `ba-requirements`.

## Chế độ `meet` — Biên bản họp (MoM)
**Đọc `references/meet.md`.** Tóm tắt:
- Ghi chú/transcript thật → `docs/Ho-so/meetings/<YYYY-MM-DD>-<chủ-đề-không-dấu>.md` theo `assets/meet-template.md`; mang `ACT` còn mở của họp trước sang. Không có ghi chú thật → không bịa.
- **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án")** sau khi đọc ghi chú, trước khi ghi: `DEC`/`ACT` định tách, file MoM, **action nào đẻ `CR`/`WI`** → `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Chỉ ghi MoM thuần, không mở CR/WI → IN phương án rồi chạy thẳng.
- `DEC-..` (điều đã CHỐT, người quyết, ảnh hưởng `FR/S/ADR/CR`) · `ACT-..` (**1 người + hạn cụ thể**, thiếu → hỏi). Thay đổi màn/chức năng đã có → `ba-change-request`; việc mới → `ba-task`. Không xoá biên bản cũ; `meetings/` không vào portal.

## Chế độ `roadmap` — Ưu tiên & Lộ trình phát hành
**Đọc `references/roadmap.md`.** Tóm tắt:
- Cần `docs/02-functions.md` (chạy **sau `ba-functions`**). Sinh `docs/Ho-so/08-roadmap.md` theo `assets/roadmap-template.md` — tài liệu sống, 1 file/dự án.
- Mỗi `F..`: MoSCoW + RICE (thang đo ghi rõ) + Kano tùy chọn; Reach/Impact chưa có cơ sở → `brainstorm` focused, không bịa số. Chia Now/Next/Later, mỗi release có mục tiêu + tiêu chí ra mắt, tôn trọng phụ thuộc.
- Hai sơ đồ: **Gantt** đa phase (section = phase, song song bằng cùng mốc `after`, trục tương đối, không `classDef`) + **dependency `flowchart`**; mọi `F..` có ở cả hai, không vòng lặp. `ba-accept release` cắt lát roadmap này.

## Kết thúc
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
