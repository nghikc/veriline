---
name: ba-init
description: Use when khởi tạo dự án phần mềm mới từ ý tưởng thô và muốn chạy trọn pipeline BA bằng MỘT trigger (yêu cầu → plan) có kiểm soát, dừng ở các cổng và gate ba-review.
---

# ba-init — Orchestrator khởi tạo dự án

## Mục tiêu
Chạy trọn pipeline BA cho một App mới trong một lần trigger. Đây là skill điều phối: lần lượt invoke các skill con, dừng ở mỗi gate nếu có gap.

> **Nói trước cho đúng kỳ vọng — "một lệnh" KHÔNG có nghĩa là "không hỏi gì".** Dự án ~10 màn thường dừng khoảng **15–20 lần**: 2 cổng phương án (skill này + `ba-screens`, các skill con khác được miễn theo "Cổng cha bao phủ cổng con"), 1–2 vòng xác nhận giả định, 1 cổng chốt kiến trúc, và gate `ba-review` sau mỗi bước lớn + mỗi màn. Đó là **thiết kế**, không phải phiền nhiễu: mỗi lần dừng là một chỗ hiểu sai được bắt trước khi cả chuỗi `FR→F→S→TC` mọc lên trên nền sai. Muốn ít dừng hơn thì thu hẹp phạm vi (ít màn hơn mỗi lần chạy), **đừng** bấm "chạy thẳng" cho qua.


> ⚙️ **Hồ sơ `mini`** (`conv-gates.md` → "Hồ sơ dự án"): đọc dòng `> Hồ sơ dự án:` ở đầu `docs/00-tracking.md` **trước khi lập phương án**. Khai `mini` thì mỗi màn chỉ có **5 file** (`ascii-screen · srs · html-design · test · plan`) — `ba-screen-spec` sinh 2 file thay vì 6 (usecase/userstory/design-spec dồn vào `srs.md`), gate tính "hoàn thành" theo **5/5**, và phương án phải ghi đúng con số đó chứ không phải 9.
## Quy trình
Đọc `conventions.md` + `conv-gates.md` của `ba-toolkit`. Thực hiện tuần tự (không dừng giữa chừng trừ khi cần input người dùng hoặc gặp gap):

**Bước 0 — Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án"). Đây là orchestrator nặng nhất của toolkit (≈15 skill con, hàng trăm file) nên KHÔNG BAO GIỜ đủ điều kiện bỏ chờ.** Trước khi ghi bất cứ file nào: quét `docs/` xem đã có gì (tránh ghi đè công cũ) → trình phương án đủ 6 phần (Đã đọc · Hiểu · **Sẽ làm**: bảng `bước · skill con · file TẠO/SỬA · điều kiện dừng` · Giả định · Câu hỏi chặn · Ngoài phạm vi) → `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Chỉ **"Chạy"** mới được ghi file. Phần "Sẽ làm" phải nêu rõ: có chạy discovery không, ước lượng **bao nhiêu màn**, các bước tùy chọn nào bật (5b/5c/7b/8f), và **màn nào đã có tài liệu sẽ bị đụng**, cùng dòng **`Ước tính: …`** từ `cost.js estimate ba-init` (chưa có lịch sử thì script nói "không ước được" — ghi đúng thế; cộng thêm `cost.js estimate ba-batch --man <số màn>` cho phần đặc tả màn).

0b. **Kiểm tra Giai đoạn Discovery (tránh lặp):** nếu đã có `docs/Ho-so/00-vision.md` / `00-brainstorm.md` / `00-personas.md` / `00-process.md` / `00-intake.md` (do `ba-discover`/`ba-discover persona`/`ba-reverse-doc` chạy trước) → **dùng lại làm ngữ cảnh, KHÔNG chạy lại**. Chưa có và dự án cần hiểu vấn đề/hiện trạng (nhất là **số hóa quy trình tay**) → gợi ý chạy `ba-discover` trước; **đã có sẵn tài liệu yêu cầu rời của khách** (Word/PDF/ảnh/biên bản) → gợi ý `ba-reverse-doc` trước (kiểm kê nguồn → seed `01-requirements.md` 🔶). Người dùng bỏ qua thì tiếp bước 1.
1. **(Bỏ qua nếu `00-brainstorm.md` đã có)** Invoke `ba-discover brainstorm` → `docs/Ho-so/00-brainstorm.md` (phỏng vấn sâu IT-BA).
2. Invoke `ba-requirements` (đọc `00-vision.md` nếu có + `00-brainstorm.md` làm input; `00-vision` cung cấp Business Need/scope; **`00-personas.md` nếu có → nhặt các `FR` ứng viên rút từ nỗi đau/nhu cầu**; `00-intake.md` nếu có → giữ trích dẫn nguồn cho yêu cầu 🔶) → `docs/01-requirements.md`.
3. **Gate:** invoke `ba-review requirements` (xem "Quy ước gate" trong conventions). Còn 🔴/🟡 → báo và dừng để người dùng bổ sung; chỉ 🟢/sạch → tiếp.
4. Invoke `ba-functions` → `docs/02-functions.md`.
5. **Gate:** invoke `ba-review functions`. Còn 🔴/🟡 → dừng; chỉ 🟢/sạch → tiếp.
5b. **(Tùy chọn — chạy khi cần, không chặn luồng):** sau khi có danh sách `F..` có thể invoke `ba-discover roadmap` (ưu tiên MoSCoW+RICE+Kano + lộ trình phase — cần cho GĐ4 `ba-accept` và chế độ `ba-accept release`), `ba-data-model` (→ `05-data-model.md`), `ba-api-spec` (→ `06-api-spec.md`).
5c. **Kiến trúc kỹ thuật — BƯỚC CÓ GATE + CHỐT (nên chạy cho mọi PM không tầm thường):**
   i. invoke `ba-architecture` → `docs/10-architecture.md` (stack + phân tầng + sơ đồ ngữ cảnh/khối triển khai + cross-cutting + ADR, trace NFR). **PM tích hợp nhiều hệ thống** → thêm `ba-integration` → `docs/11-integration.md`. **PM tiêu thụ API của đối tác/hệ ngoài** (thanh toán, SSO, hóa đơn điện tử, vận chuyển, CRM, bản đồ…) → thêm `ba-api-spec partner` → `docs/12-api-integration.md` (build-vs-buy + digest doc đối tác + mapping field 3 tầng + readiness gate). *(Ba cái khác nhau: `10` = kiến trúc nội tại · `11` = kiến trúc cả cụm nhiều hệ · `12` = tiêu thụ một API đối tác cụ thể. Không có hệ ngoài nào → bỏ cả `11` và `12`.)*
   ii. **Gate:** invoke `ba-review architecture` (+ `ba-review integration` / `ba-review api-integration` nếu có). Còn 🔴/🟡 → dừng, sửa rồi chạy lại gate.
   iii. **Cổng CHỐT (BẮT BUỘC):** trình người dùng bảng quyết định lớn + ADR → hỏi **Chốt / Sửa / Hoãn**; **chỉ khi Chốt** (ADR = Accepted) mới đi tiếp. Đây là mốc `ba-build`/`dev-run` được bám — build/dev **không dùng** bản còn Draft.
   *(PM cực nhỏ / 1 màn rõ stack → có thể bỏ bước này; khi đó `dev-run` sẽ hỏi stack lúc dev.)*
6. Invoke `ba-screens` → `03-overview.md` + folder + `00-tracking.md`.
7. **Gate:** invoke `ba-review screens`. Còn 🔴/🟡 → dừng; chỉ 🟢/sạch → tiếp.
7b. **(Tùy chọn — nên chạy nếu muốn UI nhất quán):** invoke `ba-design-system` **một lần** cho cả dự án → `docs/07-design-system.md` (token màu/typography/spacing + motion). Chạy trước vòng màn để mọi `ba-html-design` (và tô màu sơ đồ) bám token.
8. Với **mỗi màn hình ⬜/⚠️** trong overview — **BỎ QUA màn đã ✅ Hoàn thành trong `00-tracking.md`** (chạy lại `ba-init` trên dự án dở dang là chuyện thường: gate dừng giữa chừng, phiên đứt, người dùng gọi lại; không lọc thì màn đã chốt bị đặc tả đè lên). Màn ⚠️ (lệch) → `ba-track` đồng bộ, đừng sinh lại từ đầu. — **≥3 màn độc lập nhau → invoke `ba-batch`** (fan-out mỗi màn một subagent song song, main gom glossary/giả định/tracking + gate MỘT lần cuối) thay cho vòng tuần tự dưới; 1–2 màn hoặc màn phụ thuộc chéo → tuần tự (nhiều màn → REQUIRED SUB-SKILL: Use dev-dispatching-parallel-agents):
   a. Invoke `ba-screen-spec <màn>`.
   a2. *(Tùy chọn — khuyến nghị)* invoke `ba-test checklist <màn>` → `checklist.md` (checklist high-level, mã `CL-S..`), khung cho `ba-test`. Bỏ qua nếu dự án không dùng checklist.
   b. Invoke `ba-test <màn>`.
   c. **Gate:** invoke `ba-review <màn>`. Còn 🔴/🟡 → dừng ở màn đó; chỉ 🟢/sạch → tiếp.
   d. *(Tùy chọn — dự án dùng Figma qua MCP Figma riêng)* màn đã có phương án wireframe `data-chosen` → invoke **`ba-figma-draw push-lofi <màn>`** (nấc 1). Không MCP → bỏ bước này.
   e. Invoke `ba-html-design <màn>`.
   e2. *(Tùy chọn — dự án dùng Figma)* html-design được duyệt (`ok`) → invoke **`ba-figma-draw push <màn>`** (nấc 2; từ đây Figma là chuẩn giao diện màn, ghi sổ `Ho-so/00-figma-sync.md`).
   f. *(Tùy chọn — hỏi người dùng MỘT lần cho cả lô, không hỏi lại từng màn)* invoke `ba-test-e2e <màn>` → `e2e/tests/<Mã>-<Tên>.spec.ts` (mỗi `TC` → 1 test Playwright, giữ mã truy vết). Sinh sớm để QA có script sẵn; **chưa chạy được** cho tới khi app deploy — `ba-accept` (GĐ4) sẽ chạy và đối chiếu lại. Là artifact **code**: vào cột `e2e` của tracking, **không** tính vào 9/9 hoàn thành doc.
9. Invoke `ba-build` → `plan.md` mỗi folder.
10. **Gate cuối:** invoke `ba-review build` rồi `ba-review all`. Báo tổng kết gap (nếu còn).
11. **Bàn giao:** báo pipeline GĐ2 xong + danh sách `plan.md` đã sinh. **Bước kế — Giai đoạn 3:** invoke **`dev-run <màn>`** (hoặc `dev-run all`) để code từ plan. *(Muốn ma trận truy vết đầy đủ ngay: `ba-trace` → `00-traceability.md`. Sau khi dev xong → Giai đoạn 4 `ba-accept <phase>` để nghiệm thu & phát hành.)*

## Lưu ý
- **≥ 2 màn cần đặc tả → gọi `ba-batch`** (fan-out subagent ngữ cảnh trống), không đặc tả tuần tự inline trong phiên chính — đo 17/09/2026: phiên "một agent làm hết" 6 774 lượt tốn 3,8 tỷ token cache-read (`conv-gates.md` → "Đội agent" luật 5).
- **Đứt phiên / gate dừng giữa chừng → gọi `ba-next`, ĐỪNG gọi lại `ba-init`.** Orchestrator này là chuỗi tuyến tính không giữ trạng thái; gọi lại là quay về bước 0 và trình lại phương án cho cả pipeline. `ba-next` đọc `00-tracking.md` + `00-gaps.md` để biết đang dở ở đâu và chạy đúng bước còn thiếu. Vẫn muốn dùng `ba-init` để chạy nốt → bộ lọc ⬜/⚠️ ở bước 8 giữ cho màn đã ✅ không bị ghi đè, nhưng các bước 1–7 vẫn chạy lại từ đầu.
- Không tự chạy code (`ba-build` chỉ sinh plan).
- Điểm cần input người dùng: hỏi đáp ở `ba-requirements`, và mỗi gate còn gap 🔴/🟡.
- **Checkpoint giả định:** `ba-discover brainstorm`/`ba-requirements` tự chạy vòng "Xác nhận giả định" (`conventions.md`) — orchestrator **không bỏ qua**; chỉ khi người dùng đồng ý "đi tiếp" mới sang bước kế.
- Skill nguyên tử vẫn dùng được lẻ; orchestrator này chỉ gói trình tự.
- **Bước tùy chọn** đã đưa vào luồng: `ba-discover roadmap`/`ba-data-model`/`ba-api-spec` (bước 5b, sau functions), `ba-integration`/`ba-api-spec partner` (bước 5c.i, khi có hệ ngoài), `ba-design-system` (bước 7b, trước html), `ba-test-e2e` (bước 8f, sau test). `ba-accept uat` **không** thuộc GĐ2 — nó là việc **Giai đoạn 4**, do `ba-accept` gọi khi nghiệm thu. Xem "Vòng đời BA — 4 giai đoạn" trong `ba-toolkit`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
