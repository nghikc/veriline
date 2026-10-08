---
name: ba-uat
description: Use when cần kế hoạch nghiệm thu UAT cấp dự án — kịch bản end-to-end từ acceptance criteria, ma trận yêu cầu→UAT, checklist ký; sinh Ho-so/09-uat.md. Khác ba-test (per màn).
---

# ba-uat — Kế hoạch nghiệm thu người dùng (UAT) cấp dự án

## Mục tiêu
Sinh `docs/Ho-so/09-uat.md` — **kế hoạch nghiệm thu người dùng (UAT — User Acceptance Testing)** cấp dự án: gom acceptance criteria xuyên các user story của mọi màn → **kịch bản UAT end-to-end** viết bằng **ngôn ngữ nghiệp vụ** (do người dùng/PO chạy) → **ma trận truy vết** yêu cầu (`FR`/`BR`) → use case → kịch bản UAT → **checklist ký nghiệm thu** (tiêu chí ra mắt + vai trò ký). Tài liệu cấp tổng, **một file cho cả dự án**.

**KHÁC `ba-test`:** `ba-test` sinh test case **kỹ thuật per màn** (`TC-S<NN>-..`, có Manual/Auto, kỹ thuật EP/BVA/DT/ST) để dev/QA kiểm từng màn. `ba-uat` là **nghiệm thu nghiệp vụ, xuyên nhiều màn, do người dùng/PO/khách hàng chạy** để xác nhận hệ thống đáp ứng nhu cầu kinh doanh trước khi ra mắt. Hai tài liệu **bổ trợ**, không thay thế: UAT trace tới `test.md` khi cần chi tiết, nhưng bản thân kịch bản UAT mô tả luồng nghiệp vụ đầu-cuối, không phải thao tác kỹ thuật lẻ.

## Quy trình
1. Đọc `conventions.md` của `ba-toolkit` (ID scheme, chuỗi truy vết, Văn phong & Thuật ngữ, Xác nhận giả định), rồi `docs/01-requirements.md` (lấy `FR`/`NFR`/`BR` + ưu tiên MoSCoW), `docs/03-overview.md` (danh sách màn + luồng điều hướng), và các `userstory.md` · `usecase.md` · `test.md` của từng màn.
> ⚙️ **Hồ sơ `mini`** (`conv-gates.md` → "Hồ sơ dự án"): màn chỉ có `ascii-screen`/`srs`/`html-design`/`test`/`plan`. GWT gom từ **mục "Tiêu chí chấp nhận" của `srs.md`** thay cho `userstory.md`. Đừng báo "thiếu tài liệu" — 4 file kia không tồn tại **theo thiết kế**, và phải nói ra trong báo cáo (`⚙️ mini: …`).
2. **Gom acceptance criteria (consolidation):** trích mọi tiêu chí chấp nhận dạng **Given-When-Then (GWT)** từ các `userstory.md`; gom theo **luồng nghiệp vụ** (vd "đăng ký → duyệt → dùng thử"), không theo từng màn. Ghép các GWT thuộc cùng một luồng lại để dựng kịch bản đầu-cuối. **Xen kẽ brainstorm:** khi tiêu chí chấp nhận của một luồng còn thiếu/mơ hồ (userstory chưa có GWT rõ, hoặc điều kiện "coi là đạt" chưa chốt với người dùng) → **invoke `ba-brainstorm` (focused vào điều kiện nghiệm thu: khi nào coi là xong, kết quả người dùng phải thấy, ngưỡng chấp nhận)** để elicit trước khi viết kịch bản, thay vì tự suy.
3. **Viết kịch bản UAT end-to-end** theo luồng nghiệp vụ (chạy **xuyên nhiều màn**, không per màn). Mỗi kịch bản `UAT-01`, `UAT-02`… ghi:
   - **Tiền điều kiện** (trạng thái hệ thống/dữ liệu/vai trò trước khi chạy);
   - **Các bước nghiệp vụ** — viết bằng ngôn ngữ người dùng ("Người quản lý tạo đơn và gửi duyệt"), đánh số, đi qua các màn liên quan;
   - **Kết quả mong đợi** — **đo được, quan sát được** (số/trạng thái/thông báo cụ thể), KHÔNG viết "chạy ổn"/"hoạt động tốt";
   - **Dữ liệu mẫu** — giá trị cụ thể để chạy (tài khoản, số tiền, ngày…), không placeholder chung;
   - **Trace** — các `FR`/`BR` và `UC-S<NN>-..` mà kịch bản này nghiệm thu;
   - **Trạng thái** — mặc định `Chưa chạy` (khi nghiệm thu điền `Đạt` / `Không đạt`).
4. **Ma trận truy vết (RTM — Requirements Traceability Matrix)** hai chiều: mỗi `FR`/`BR` → use case (`UC-S<NN>-..`) → kịch bản UAT (`UAT-..`) → trạng thái nghiệm thu (`Đạt` / `Không đạt` / `Chưa chạy`). Soát **cả hai chiều**: mỗi `FR` Must có ≥1 `UAT`; mỗi `UAT` trace ngược về ≥1 `FR`/`BR` (không có kịch bản "mồ côi").
5. **Checklist ký nghiệm thu (Definition of Done / Release readiness):** liệt kê **tiêu chí ra mắt đo được** — vd: mọi `FR` ưu tiên **Must** có UAT `Đạt`; không còn lỗi nghiêm trọng (Critical/High) đang mở; dữ liệu di trú đã kiểm & khớp; hiệu năng/`NFR` then chốt đạt ngưỡng; tài liệu hướng dẫn người dùng sẵn sàng. Kèm **bảng vai trò ký** (PO · BA · đại diện khách hàng/người dùng · QA lead) với ô Tên · Ngày · Kết luận (Chấp nhận / Chấp nhận có điều kiện / Từ chối).
6. **Xác nhận giả định (BẮT BUỘC):** khi phải tự giả định (thiếu tiêu chí ra mắt, thiếu vai trò ký, dữ liệu mẫu chưa rõ…) → gom & đánh số `GĐ-01`, `GĐ-02`…, rà từng cái bằng `AskUserQuestion`, trình bảng tổng hợp, qua cổng quyết định rồi mới chốt — theo mục "Xác nhận giả định" trong `conventions.md`. Chế độ batch không hỏi được → ghi giả định + đánh dấu `⚠️ chưa xác nhận` mỗi dòng.
7. Viết `docs/Ho-so/09-uat.md` theo `template.md`. Cập nhật `docs/Ho-so/00-glossary.md` (bổ sung thuật ngữ mới: UAT, GWT, RTM, DoD…, idempotent).

## Kỹ thuật áp dụng
- **User Acceptance Testing (business-facing):** nghiệm thu ở góc nhìn người dùng/nghiệp vụ, không ở góc kỹ thuật — kịch bản mô tả *người dùng làm gì để đạt mục tiêu kinh doanh*, không phải cách hệ thống xử lý.
- **Acceptance Criteria consolidation (Given-When-Then):** gom các tiêu chí chấp nhận rải rác trong user story các màn thành luồng đầu-cuối mạch lạc, khử trùng lặp.
- **Requirements Traceability Matrix (RTM):** ánh xạ hai chiều yêu cầu ↔ use case ↔ kịch bản UAT để chứng minh **độ phủ** — không yêu cầu Must nào bị bỏ nghiệm thu, không kịch bản nào thừa.
- **Definition of Done / Release readiness:** bộ tiêu chí đo được quyết định "được ra mắt hay chưa" + chữ ký các bên chịu trách nhiệm.

## Tiêu chí chất lượng (BẮT BUỘC)
- **Độ phủ Must:** mỗi `FR` ưu tiên **Must** có **≥1 kịch bản UAT**; thiếu → bổ sung hoặc ghi rõ lý do miễn.
- **Kết quả đo được:** mỗi kịch bản có **bước nghiệp vụ rõ** + **kết quả mong đợi đo được/quan sát được** (số, trạng thái, thông báo cụ thể) — cấm "chạy ổn", "hoạt động tốt".
- **Truy vết hai chiều đầy đủ:** RTM khớp `FR`↔`UAT` cả hai chiều; không kịch bản mồ côi, không yêu cầu Must thiếu UAT.
- **Checklist ký đo được:** mọi tiêu chí ra mắt phát biểu ở dạng kiểm được (có/không, đạt ngưỡng), không chung chung; có đủ vai trò ký.
- **Không bịa:** thiếu thông tin → hỏi (chế độ tương tác) hoặc ghi giả định `⚠️ chưa xác nhận` (chế độ batch); không tự chế dữ liệu/tiêu chí như thể đã chốt.

## Lưu ý
- Tiếng Việt. **Tài liệu cấp tổng, một file cho cả dự án** (`docs/Ho-so/09-uat.md`); chạy sau khi các màn đã có `userstory.md`/`usecase.md`/`test.md` (hồ sơ `mini`: chỉ cần `srs.md`/`test.md` — GWT nằm ở mục "Tiêu chí chấp nhận" của `srs.md`).
- **Phân biệt rõ với `ba-test`:** `ba-test` = TC kỹ thuật per màn, có Manual/Auto, kỹ thuật thiết kế test; `ba-uat` = nghiệm thu nghiệp vụ xuyên màn, do người chạy, ngôn ngữ nghiệp vụ. Đừng chép lại test case kỹ thuật vào UAT.
- **Văn phong & Thuật ngữ:** mở rộng từ viết tắt ở lần đầu dùng; thêm footer `## Thuật ngữ` cuối `09-uat.md` (giải nghĩa UAT, GWT, RTM, DoD, MoSCoW…) + bổ sung thuật ngữ mới vào `docs/Ho-so/00-glossary.md` — xem `conventions.md`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
