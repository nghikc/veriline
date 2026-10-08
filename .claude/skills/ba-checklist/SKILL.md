---
name: ba-checklist
description: Use when cần CHECKLIST kiểm thử high-level (danh mục điểm cần kiểm, chưa phải test case) cho MỘT màn — sinh checklist.md mã CL-S.. trace R-S/UC/US. Sau ba-screen-spec, trước ba-test.
---

# ba-checklist — Checklist kiểm thử high-level cho 1 màn hình

## Mục tiêu
Cho một màn hình, sinh `docs/Screen-spec/<Nhóm>/<Màn>/checklist.md` — **danh mục điểm cần kiểm ở mức cao** (không phải test case chi tiết). Mỗi mục có mã `CL-S<NN>-..`, một dòng nêu **điều kiện đạt quan sát được**, và **truy vết** về `R-S/UC/US/E-S`. Dùng cho **BA/QC** rà nhanh độ phủ; là **khung high-level** để `ba-test` sinh test case chi tiết bám theo.

> **Khác `ba-test`** (sinh `test.md` — `TC-S..` có bước/test data/kỹ thuật EP-BVA-DT-ST). `ba-checklist` **đứng trước**, high-level: một dòng một điểm kiểm, không bước, không test data. Quan hệ: checklist → ba-test (mỗi `CL-S..` **nên** có ≥1 `TC` bám theo — liên kết chéo khuyến nghị, không bắt buộc; `test.md` vẫn tự phủ `R-S`/`UC` độc lập).

## Vị trí trong pipeline
`ba-screen-spec` (srs/usecase/userstory/design-spec — hồ sơ `mini` chỉ có `srs.md`, ba phần kia là mục bên trong nó) → **`ba-checklist`** → `ba-test`. Là file per-màn **chuẩn** (có mã, có cột `checklist` trong `00-tracking.md`, **`ba-review checklist`** soi độ phủ được) nhưng **KHÔNG tính vào cổng 9/9** hoàn thành doc — như `e2e` (để dự án cũ không gãy gate). *(Lưu ý: `ba-trace` RTM hiện CHƯA gồm tầng `CL` — độ phủ checklist soi qua `ba-review`, không qua RTM.)*

## Đầu vào / Đầu ra
- **Vào (đọc trong folder màn):** `srs.md` (R-S, field rules, Ma trận lỗi E-S), `usecase.md` (luồng chính + ngoại lệ), `userstory.md` (AC Given-When-Then), `design-spec.md` (UI states, CTA, a11y), `ascii-screen.md`/`brainstorm.md` (bối cảnh). Thiếu `srs.md`/`usecase.md` → **dừng, báo chạy `ba-screen-spec`** trước.
> ⚙️ **Hồ sơ `mini`** (`conv-gates.md` → "Hồ sơ dự án"): màn chỉ có `ascii-screen`/`srs`/`html-design`/`test`/`plan`. Luồng · AC · UI state đều nằm trong `srs.md`. Đừng báo "thiếu tài liệu" — 4 file kia không tồn tại **theo thiết kế**, và phải nói ra trong báo cáo (`⚙️ mini: …`).
- **Ra:** `docs/Screen-spec/<Nhóm>/<Màn>/checklist.md` theo `templates.md`.

## Quy trình
1. Đọc `conventions.md` của `ba-toolkit` (chuỗi ID, chuẩn màn), rồi đọc các nguồn ở trên **của đúng màn được yêu cầu**. Một màn mỗi lần.
2. **KHÔNG suy đoán khi thiếu/mâu thuẫn:** nguồn thiếu mục cần (vd usecase có luồng ngoại lệ nhưng srs không có `E-S..` tương ứng; design-spec nêu state mà srs không mô tả; AC mâu thuẫn field rule) → **hỏi lại người dùng từng phần** cho tới khi đủ rõ; hoặc ghi vào mục **"Cần làm rõ"** cuối file (không bịa điều kiện đạt).
3. **Rút điểm kiểm theo 7 nhóm** (bỏ nhóm không áp dụng, ghi lý do — vd màn hiển thị thuần bỏ G2):
   - **G1. Chức năng chính (happy path)** — mỗi luồng chính `UC`/`US` → 1 mục.
   - **G2. Nhập liệu & Validation** — mỗi field bắt buộc/định dạng/min-max trong `srs` → 1 mục (điều kiện đạt = luật đó được thực thi; **không** ghi test data cụ thể — đó là việc `ba-test`).
   - **G3. Trạng thái giao diện** — mỗi UI state ở `design-spec` (default/loading/empty/error/success/disabled…) → 1 mục.
   - **G4. Lỗi & Ngoại lệ** — mỗi `E-S..` của `srs` + mỗi luồng ngoại lệ `usecase` → 1 mục (điều kiện đạt = thông báo/hành vi **nguyên văn** cột "Người dùng thấy gì").
   - **G5. Phân quyền & Vai trò** — chỉ khi màn có ≥2 vai trò (bảng Tác nhân / ma trận phân quyền) → mỗi vai trò × hành vi bị chặn/cho phép.
   - **G6. Phi chức năng** — `R-S..-N..`/`NFR` gắn màn (hiệu năng/bảo mật/a11y) → mỗi cái 1 mục (điều kiện đạt = ngưỡng số / tiêu chí a11y cụ thể).
   - **G7. Tương thích & Liên màn** — điều hướng CTA sang màn khác (khớp `03-overview`/sitemap), responsive/tương thích nếu design-spec nêu.
4. **Gán mã + truy vết:** đánh số `CL-S<NN>-01..` **tuần tự toàn màn** (không theo nhóm). Mỗi mục ghi cột **Truy vết** = `R-S..`/`UC-S..`/`US-S..`/`E-S..` mà nó phủ (mã phải **tồn tại** trong tài liệu nguồn — không thì là ref gãy, báo lại). Mỗi mục 1 **Ưu tiên** (Critical/High/Medium/Low) theo rủi ro (tiền/bảo mật/phân quyền/mất dữ liệu = cao).
5. **Cổng độ phủ (tự soát trước khi ghi):** mọi `R-S..` chức năng · mọi luồng `UC` (kể cả ngoại lệ) · mọi `E-S..` · mọi AC (GWT) của `userstory` → có **≥1** `CL-S..` phủ. Thiếu → thêm mục hoặc ghi vào "Cần làm rõ", không bỏ lặng.
6. Thêm **bảng roll-up** đầu file (tổng mục, đếm theo nhóm, Pass/Fail/N-A/Chưa kiểm theo cột Kết quả, lần cập nhật).
7. Ghi `checklist.md` theo `templates.md`. Cập nhật ô `checklist` của màn trong `docs/00-tracking.md` = ✅ + cột "Cập nhật cuối".
8. **Bàn giao:** báo người dùng checklist xong; bước tiếp `ba-test` nên bám các `CL-S..` này khi sinh `TC` chi tiết (liên kết chéo khuyến nghị). Nếu `test.md` đã có TRƯỚC checklist (thứ tự đảo), việc bổ sung tham chiếu `CL` là tùy chọn — không phải hở kiểm thử.

## Mức "high-level" (BẮT BUỘC — đừng lấn sân ba-test)
- Mỗi mục là **một dòng**: *điểm cần kiểm* + *điều kiện đạt quan sát được*. **KHÔNG** có: các bước thao tác, test data cụ thể, kỹ thuật thiết kế test, tiền điều kiện dài. Những thứ đó là của `test.md`.
- ✅ "Đăng nhập sai mật khẩu 5 lần → tài khoản bị khoá tạm, hiện đúng thông báo khoá" (trace `E-S01-03`).
- ❌ "Nhập email `a@b.com`, mật khẩu `123456` sai 5 lần, bấm Đăng nhập, kỳ vọng HTTP 423…" (đây là `TC`, thuộc `ba-test`).

## Theo dõi kết quả
Cột **Kết quả** mỗi mục: `Pass` / `Fail` / `N-A` / `—` (mặc định `—` chưa kiểm). BA/QC tick khi rà; đổi nội dung mục (do CR/đổi yêu cầu) → reset về `—` và cập nhật roll-up. Checklist là bản rà nhanh — kết quả chi tiết vẫn ở `test.md`.

## Ranh giới
- Cho BA/QC rà nhanh độ phủ trước khi viết ca chi tiết; `ba-test` dùng chính checklist này làm khung sinh TC. Đọc thêm usecase/userstory/design-spec/brainstorm nếu hồ sơ dự án có.

## Lưu ý
- Tiếng Việt. Một màn mỗi lần. Không suy đoán — thiếu thì hỏi/ghi "Cần làm rõ".
- **Văn phong & Thuật ngữ:** thêm footer `## Thuật ngữ` cuối `checklist.md` + bổ sung thuật ngữ mới vào `docs/Ho-so/00-glossary.md` — xem `conventions.md`.
- Mã `CL-S..` phải trace được về mắt xích tồn tại; ref gãy → báo `ba-screen-spec`/`ba-test`, không tự vá nguồn.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
