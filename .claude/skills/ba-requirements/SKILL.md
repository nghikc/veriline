---
name: ba-requirements
description: Use when có ý tưởng phần mềm thô và cần bản yêu cầu có cấu trúc (BR, StR, FR, NFR) cho App; bước đầu GĐ2, sinh docs/01-requirements.md.
---

# ba-requirements — Ý tưởng thô → Bản yêu cầu

## Mục tiêu
Biến mô tả ý tưởng thô thành `docs/01-requirements.md` có cấu trúc.

## Quy trình
1. Đọc `conventions.md` + `conv-gates.md` của skill `ba-toolkit`.
2. Đọc `docs/Ho-so/00-brainstorm.md` nếu có (đầu ra của `ba-discover brainstorm`) làm input chính; nếu chưa có, đọc ý tưởng người dùng cung cấp.
2b. **Có `docs/Ho-so/00-urd.md` (hoặc `docs/urd/*.md`) → đó là đầu vào ƯU TIÊN:** mỗi nhu cầu `UN-..` phải sinh **≥1** `StR`/`FR`/`NFR`; `UN` mức **Critical** phải thành yêu cầu **Must**, không thì ghi rõ lý do loại. Ghi mã nguồn vào cột Nguồn/Truy vết của yêu cầu (vd `Nguồn: UN-03`) để chuỗi `UN → FR` không đứt. Ranh giới **Ngoài phạm vi** của URD chuyển thành phạm vi loại trừ; `USC-..` là đầu vào cho mục tiêu chí thành công. Có `00-personas.md` thì ứng viên `U-..` chưa được URD gom cũng rà nốt.
2c. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Đọc xong đầu vào (brainstorm/URD/personas/intake), **trước khi viết `01-requirements.md`**: trình phương án đủ 6 phần — **"Hiểu"** là phần quan trọng nhất ở đây (tóm tắt bài toán nghiệp vụ + ai dùng + phạm vi định bao/không bao, để người dùng bắt hiểu sai NGAY, trước khi cả chuỗi `FR→F→S→TC` mọc lên trên nền sai) + số lượng `BR/StR/FR/NFR` ước chừng + `01-requirements.md` TẠO hay **GHI ĐÈ bản đã có**. `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Gọi từ `ba-init`/`ba-discover` (đã qua cổng) → không hỏi lại. Ghi đè bản `01-requirements.md` **đã chốt** → không phải việc của skill này, chuyển `ba-change-request`.
3. Hỏi đáp **từng câu một** để làm rõ chỗ thiếu: đối tượng người dùng, phạm vi, ràng buộc, tiêu chí thành công. Nếu chưa brainstorm và cần đào sâu, khuyến nghị chạy `ba-discover brainstorm` trước.
4. Khi đủ thông tin, viết `docs/01-requirements.md` đúng các mục trong `template.md` (cùng thư mục). **Bao gồm mục "Luồng nghiệp vụ chính & Vai trò (swimlane)":** chọn 2–4 nghiệp vụ cốt lõi, mỗi nghiệp vụ một sơ đồ **swimlane-beta** + bảng vai trò/trách nhiệm trace về StR. **Các luồng này BẮT BUỘC dùng `swimlane-beta` (đa vai trò), KHÔNG dùng `flowchart`** — xem "Luật ưu tiên vai trò" trong "Bộ chọn sơ đồ Mermaid" của `conventions.md`.
5. **Tạo từ điển trung tâm `docs/Ho-so/00-glossary.md`** từ `glossary-seed.md` (cùng thư mục): copy nguyên seed, điền `<Tên App>`, bổ sung thuật ngữ nghiệp vụ đặc thù dự án vào mục 2. Đây là nguồn chuẩn để các skill sau bổ sung thêm.
6. Thêm footer `## Thuật ngữ` vào cuối `01-requirements.md` (xem format trong `conventions.md`).
7. **Xác nhận giả định (BẮT BUỘC):** nếu có giả định ở mục 7 (đánh số `GĐ-..`), chạy vòng xác nhận theo "Xác nhận giả định" trong `conventions.md` — rà **từng giả định một** bằng `AskUserQuestion` → bảng summary → người dùng đồng ý "đi tiếp" mới chốt; cập nhật trạng thái + giá trị chốt vào tài liệu.
8. Trình bày tóm tắt và xác nhận với người dùng trước khi chốt.

## Kỹ thuật áp dụng
- **Requirements Classification (BABOK):** phân tầng Business → Stakeholder → Solution (Functional/Non-functional) → Transition; mỗi yêu cầu có ID/Nguồn/Ưu tiên (MoSCoW)/Trạng thái/Truy vết.
- **SMART / đặc tính yêu cầu tốt (IEEE 830):** mỗi yêu cầu phải *atomic* (1 ý), *unambiguous* (không đa nghĩa), *testable/measurable* (kiểm chứng được), *feasible* (khả thi), *traceable* (trace được). NFR luôn kèm con số đo được (vd "< 2s", "99.9% uptime").
- **Business Rules tách riêng:** quy tắc/ràng buộc nghiệp vụ (vd "đơn > 10 triệu cần duyệt") ghi vào *catalog Business Rules* riêng, không trộn vào FR — vì rule thay đổi độc lập với chức năng.
- **MoSCoW:** ưu tiên Must/Should/Could/Won't.
- **Swimlane luồng nghiệp vụ (ưu tiên hàng đầu ở requirements):** luồng nghiệp vụ ở cấp requirements gần như **luôn có nhiều vai trò** → **mặc định `swimlane-beta`, KHÔNG `flowchart`**. Cách nghĩ: đếm vai trò trong luồng — ≥2 vai trò có bàn giao thì bắt buộc swimlane (flowchart làm mất thông tin "ai làm"). Dùng kiểu Mermaid gốc **`swimlane-beta LR`** với **mỗi vai trò là một `subgraph`** (một lane); node của bước đặt trong lane người thực hiện, mũi tên chéo lane = bàn giao, nhãn cạnh dùng `-->|nhãn|`. Cần Mermaid **≥ 11.16** (bản vendored `ba-portal` đã đủ). **Tô màu theo vai node** (`:::task`/`:::decision`/`:::startend` + khối `classDef` — xem "Bảng màu phân vai node" trong `conventions.md`) để đọc trực quan. Kèm bảng vai trò/trách nhiệm trace về StR (mỗi lane ≥1 StR).

## Tiêu chí chất lượng (BẮT BUỘC)
- Mỗi yêu cầu đạt **checklist SMART**: cấm câu mơ hồ kiểu "hệ thống phải nhanh/thân thiện/dễ dùng" — phải định lượng hoặc mô tả kiểm chứng được.
- **NFR có số đo:** mọi yêu cầu phi chức năng kèm ngưỡng cụ thể.
- **Truy vết hai chiều:** FR→StR→BR liền mạch; business rule nằm ở catalog riêng, có ID `BRule-..` và trace về BR/FR liên quan.
- **Luồng nghiệp vụ swimlane:** có ≥1 nghiệp vụ chính vẽ swimlane end-to-end (mỗi vai trò một lane) + bảng vai trò/trách nhiệm trace StR; sơ đồ đúng cú pháp Mermaid (render được — xem "Sơ đồ Mermaid — an toàn cú pháp" trong `conventions.md`).
- **Đối chiếu coverage sơ đồ (BẮT BUỘC):** sau khi vẽ, đối chiếu với fact-list — đủ vai trò↔lane, mỗi điểm quyết định có **≥2 nhánh có nhãn**, **không dead-end**, không orphan branch (xem "Kiểm coverage sơ đồ" trong `conventions.md`). Sơ đồ **phức tạp** (≥3 vai trò / ≥5 quyết định / có loop) → chạy `ba-review diagram docs/01-requirements.md` (agent `ba-diagram-reviewer`) trước khi chốt.
- Không bịa chức năng — thiếu thì hỏi. Batch/không tương tác: tự giả định hợp lý và **ghi rõ giả định** trong tài liệu, đánh dấu **`⚠️ chưa xác nhận`** (xem "Xác nhận giả định" trong `conventions.md`).
- **Văn phong chuyên nghiệp + Thuật ngữ:** mở rộng từ viết tắt ở lần đầu dùng; tạo `docs/Ho-so/00-glossary.md` + footer `## Thuật ngữ` (xem "Văn phong tài liệu" & "Thuật ngữ" trong `conventions.md`).

## Lưu ý
- Tài liệu bằng tiếng Việt. Là tài liệu cấp tổng đầu tiên, đầu vào cho `ba-functions`.
- `ba-requirements` là skill **khởi tạo** từ điển `docs/Ho-so/00-glossary.md`; các skill sau chỉ bổ sung thuật ngữ mới, không tạo lại.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
