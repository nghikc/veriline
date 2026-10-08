---
name: ba-discover
description: Use when khởi động dự án mới ở giai đoạn DISCOVERY — chạy trọn chuỗi vision → stakeholder → phỏng vấn → quy trình AS-IS/TO-BE → URD trong một lệnh, có gate; bước ĐỨNG TRƯỚC ba-init.
---

# ba-discover — Orchestrator giai đoạn Discovery

## Mục tiêu
Chạy trọn **giai đoạn khám phá (discovery)** cho một dự án mới trong một lần trigger: *vì sao làm → ai liên quan → đào sâu nghiệp vụ → quy trình hiện tại→tương lai*. Đây là phần **"hiểu vấn đề"** đứng **trước** `ba-init` (vốn bắt đầu ở yêu cầu). Skill điều phối: lần lượt invoke skill con, dừng ở mỗi gate nếu có gap.

> Dùng khi khởi động dự án thực tế đúng cách BA làm: hiểu vấn đề & hiện trạng **trước**, không nhảy thẳng vào giải pháp. Ý tưởng đã rõ chiến lược/không cần discovery → chạy thẳng `ba-init`.

## Quy trình
Đọc `conventions.md` + `conv-gates.md` của `ba-toolkit`. Làm rõ với người dùng: đây là dự án **mới hoàn toàn** hay **số hóa một quy trình đang chạy** (quyết định có chạy `ba-process` không).

**Bước 0 — Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Quét `docs/` (đã có `00-vision`/`00-personas`/`00-process`/`00-urd` chưa — có thì DÙNG LẠI, không dựng lại) → trình phương án đủ 6 phần, phần "Sẽ làm" nêu rõ **chạy những bước discovery nào** (vision / stakeholder / brainstorm / process AS-IS→TO-BE / URD) và file nào sẽ TẠO vs SỬA → `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Chỉ "Chạy" mới được ghi file.

> **Nguyên tắc xen kẽ brainstorm:** `ba-brainstorm` là **động cơ phỏng vấn sâu dùng chung**. Trước mỗi bước phân tích, nếu đầu vào còn mơ hồ thì **invoke `ba-brainstorm` (focused)** để elicit sâu trước — thay vì để skill phân tích tự hỏi hời hợt. Nhờ continuation mode, mỗi lần focused **nối thêm** vào cùng `docs/Ho-so/00-brainstorm.md`, không ghi đè.

Thực hiện tuần tự:

1. **Brainstorm — làm rõ VẤN ĐỀ (focused):** invoke `ba-brainstorm` scoped vào *pain thật · ai chịu · vì sao bây giờ · quy mô* → `docs/Ho-so/00-brainstorm.md`. Đây là nền để `ba-vision` không suy đoán.
2. Invoke `ba-vision` (đọc `00-brainstorm.md`) → `docs/Ho-so/00-vision.md` (vấn đề, mục tiêu SMART, options + ROI, phạm vi, KPI).
3. **Gate:** invoke `ba-review vision` (xem "Quy ước gate" trong conventions). Còn 🔴/🟡 → dừng để người dùng bổ sung; chỉ 🟢/sạch → tiếp.
3b. **Nhánh "không làm / chưa làm":** đề xuất ở §3 của vision là giữ nguyên, hoặc người dùng chốt chưa làm → **đó là một kết luận, không phải bước bị lỡ**. Ghi dòng `Trạng thái: Không làm|Chưa làm — xác nhận: <ai> · <ngày> · mở lại khi: <điều kiện>` đầu `00-vision.md` (mẫu dòng ở `ba-vision/assets`) rồi **DỪNG discovery** — không chạy stakeholder/persona/URD cho việc đã từ chối, không gợi ý `ba-init`. Người xác nhận phải là người dùng, không phải agent tự suy.
4. Invoke `ba-stakeholder` (đọc `00-vision.md` + brainstorm làm ngữ cảnh) → `docs/Ho-so/04-stakeholders.md` (Power/Interest + RACI).
5. **Gate:** invoke `ba-review stakeholder`. Còn 🔴/🟡 → dừng; chỉ 🟢/sạch → tiếp.
5b. **Người DÙNG app (nên chạy — bỏ qua nếu app chỉ có 1 loại người dùng hiển nhiên):** invoke `ba-persona` (đọc `00-vision.md` + `04-stakeholders.md` + brainstorm) → `docs/Ho-so/00-personas.md` (personas + user journey). Đầu ra quan trọng: danh sách **ứng viên `U-..`** rút từ nỗi đau/nhu cầu. *(`ba-stakeholder` = ai có quyền lực/quyền lợi; `ba-persona` = người dùng app trông thế nào — hai việc khác nhau, đừng gộp.)*
6. **(Nếu số hóa) Brainstorm — làm rõ QUY TRÌNH HIỆN TẠI (focused):** invoke `ba-brainstorm` scoped vào *các bước AS-IS · ai làm bước nào · điểm quyết định · nút thắt/pain · số liệu (thời gian, khối lượng)* → nối vào `00-brainstorm.md`. Nền để `ba-process` vẽ AS-IS đúng.
7. **(Nếu số hóa)** invoke `ba-process` → `docs/Ho-so/00-process.md` (AS-IS→TO-BE→Gap→yêu cầu phát sinh). Dự án mới hoàn toàn → **bỏ qua bước 6–7**.
8. **Brainstorm — đào sâu GIẢI PHÁP (đầy đủ 7 phần):** invoke `ba-brainstorm` chạy trọn phỏng vấn sâu về giải pháp mong muốn (luồng chính, edge case, validation, wording…) → hoàn thiện `00-brainstorm.md`, làm đầu vào chi tiết cho `ba-requirements`.
8b. **Chốt NHU CẦU người dùng (nên chạy):** invoke `ba-urd` (đọc `00-brainstorm` + `00-personas` + `00-vision` + `00-process` nếu có) → `docs/Ho-so/00-urd.md`: nhu cầu `UN-..` có bằng chứng + ranh giới phạm vi + hành trình ưu tiên + ngoại lệ + tiêu chí thành công `USC-..`. Đây là **điểm gom** của cả giai đoạn discovery — mọi thứ vừa đào được quy về "người dùng cần gì", **solution-free**, làm đầu vào trực tiếp cho `ba-requirements`.
   - **Gate:** invoke `ba-review urd` — chú ý luật 🔴 *rò rỉ giải pháp*. Còn 🔴/🟡 → dừng, sửa.
9. **Gate:** invoke `ba-review process` (nếu có `00-process.md`) rồi `ba-review all`. Còn 🔴/🟡 → dừng; chỉ 🟢/sạch → tiếp.
10. **Bàn giao:** báo người dùng discovery xong; tài liệu nền (`00-vision`, `04-stakeholders`, `00-personas` nếu có, `00-urd` nếu có, `00-brainstorm`, và `00-process` nếu có) đã sẵn làm đầu vào cho **`ba-init`** (hoặc `ba-requirements` lẻ). Kèm theo danh sách `UN-..` theo mức quan trọng (mỗi `UN` sẽ thành ≥1 `StR`/`FR`/`NFR`) và ứng viên `U-..` từ personas. Gợi ý chạy `ba-init`.

## Lưu ý
- **Checkpoint giả định:** `ba-vision`/`ba-brainstorm`/`ba-process` tự chạy vòng "Xác nhận giả định" (`conventions.md`) — orchestrator **không bỏ qua**; chỉ khi người dùng đồng ý "đi tiếp" mới sang bước kế.
- Điểm cần input người dùng: hỏi đáp ở `ba-vision`/`ba-brainstorm`/`ba-process`, và mỗi gate còn gap 🔴/🟡.
- `ba-process` **có điều kiện** — chỉ chạy khi có quy trình AS-IS thật; đừng ép dự án greenfield. `ba-persona` **có điều kiện** — bỏ qua khi chỉ một loại người dùng hiển nhiên (vd tool nội bộ 1 vai).
- **Đã có tài liệu yêu cầu rời** (Word/PDF/ảnh/biên bản của khách) → chạy `ba-reverse-doc` **trước** (kiểm kê nguồn → `00-intake.md` → seed `01-requirements.md`), rồi mới dùng discovery để lấp chỗ trống; đừng phỏng vấn lại cái tài liệu đã trả lời.
- Không sinh yêu cầu/màn/plan — dừng ở tài liệu discovery, để `ba-init` tiếp.
- Skill nguyên tử (`ba-vision`/`ba-stakeholder`/`ba-persona`/`ba-brainstorm`/`ba-process`) vẫn dùng lẻ được; orchestrator này chỉ gói trình tự.
- Discovery có họp với khách → ghi chú thô đưa qua `ba-meet` → MoM `docs/Ho-so/meetings/<ngày>-<chủ-đề>.md` (quyết định `DEC` + action `ACT`); `DEC` chốt phạm vi phải phản ánh lại vào `00-vision`/`01-requirements`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
