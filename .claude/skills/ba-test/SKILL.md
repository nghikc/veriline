---
name: ba-test
description: Use when cần test case chi tiết cho MỘT màn theo từng chức năng, dựa trên srs và usecase; bước 6, sinh test.md. `checklist` sinh checklist high-level CL-S.. trước TC. Script chạy được là ba-test-e2e.
---

# ba-test — Tài liệu kiểm thử 1 màn hình

## Chế độ
| Gọi | Làm gì |
|---|---|
| `/ba-test <màn>` (mặc định) | test case chi tiết `TC-S..` → `test.md` — quy trình bên dưới |
| `/ba-test checklist <màn>` | checklist kiểm thử **high-level** `CL-S..` → `checklist.md`, khung cho TC — mục **"Chế độ `checklist`"** cuối file (trước 08/10/2026 là skill `ba-checklist`) |

## Mục tiêu
Cho một màn hình, sinh `docs/Screen-spec/<Nhóm>/<Màn>/test.md` — bộ test case theo từng chức năng, **thiết kế có hệ thống** (kỹ thuật chuẩn) và **phân theo rủi ro**.

## Quy trình
1. Đọc `conventions.md` của `ba-toolkit`, cùng `srs.md` và `usecase.md` của màn hình. **Nếu màn có `checklist.md`** (do `ba-test checklist` sinh): đọc trước, dùng làm **khung high-level** — mỗi mục `CL-S..` **nên** có ≥1 `TC` bám theo, ghi mã `CL-S..` vào cột Nguồn/truy vết của TC (bên cạnh `R-S`/`UC`) để liên kết chéo. Đây là **khuyến nghị**, không bắt buộc: độ phủ kiểm thử vẫn do các luật `ba-test` bên dưới (phủ `R-S`/GWT/`E-S`) bảo đảm. **Chú ý mục "Ma trận lỗi" (`E-S..`) của `srs.md`** — mỗi dòng `E-S..` phải sinh **≥1 `TC` Negative**, và assertion dùng **nguyên văn** cột "Người dùng thấy gì" (không diễn đạt lại); ghi mã `E-S..` vào cột truy vết của TC. Ma trận lỗi rỗng ở màn có hệ thống ngoài hoặc có luồng ngoại lệ → báo lại `ba-screen-spec`, đừng tự bịa thông báo.
> ⚙️ **Hồ sơ `mini`** (`conv-gates.md` → "Hồ sơ dự án"): màn chỉ có `ascii-screen`/`srs`/`html-design`/`test`/`plan`. Luồng chính/ngoại lệ và tiêu chí Given-When-Then đọc ở **mục "Luồng" và "Tiêu chí chấp nhận" của `srs.md`** thay cho `usecase.md`/`userstory.md`. Đừng báo "thiếu tài liệu" — 4 file kia không tồn tại **theo thiết kế**, và phải nói ra trong báo cáo (`⚙️ mini: …`).
2. **Đánh giá Risk Level** từng yêu cầu/chức năng: **Cao** (liên quan tiền/bảo mật/phân quyền/mất dữ liệu) → test sâu, nhiều ca biên & ngoại lệ; **Trung bình** → vừa phải; **Thấp** (hiển thị thuần) → ca cơ bản.
3. **Áp dụng kỹ thuật thiết kế test case** để suy ca có hệ thống (không tuỳ hứng), chọn kỹ thuật theo bản chất input/luật:
   - **Equivalence Partitioning (EP):** chia input thành nhóm tương đương, test 1 đại diện mỗi nhóm.
   - **Boundary Value Analysis (BVA):** test biên — min, min+1, max-1, max (vd max 255 → nhập 255 và 256 ký tự).
   - **Decision Table (DT):** logic nhiều điều kiện → liệt kê tổ hợp điều kiện → kết quả.
   - **State Transition (ST):** workflow/trạng thái → test chuyển hợp lệ + không hợp lệ.
4. Với **mỗi acceptance criterion (GWT), mỗi `R-S..`, mỗi luồng use case** (gồm ngoại lệ) → ≥1 test case theo `template.md`. Mỗi TC ghi: mã `TC-S0x-..`, **Loại** (Positive/Negative/Edge), **Kỹ thuật** (EP/BVA/DT/ST), **Nguồn** (R-S/GWT/UC), **Risk**, **Priority** (Critical/High/Medium/Low), **Chức năng** (mã `F..` mà TC kiểm — trace về `02-functions.md`) + **Nội dung chức năng** (mô tả ngắn của `F..` đó), **Test Data cụ thể**, kết quả mong đợi, **Cách chạy** (Manual/Auto), **Trạng thái** (đã thực thi chưa: `Chưa chạy`/`Đã chạy`, mặc định `Chưa chạy`), **Kết quả** (cột CUỐI: `Pass`/`Fail`/`Blocked`/`Skip`, `—` khi chưa chạy). Thứ tự cột: `… | Priority | Chức năng | Nội dung chức năng | Tiền điều kiện | Các bước | Test Data | Kết quả mong đợi | Cách chạy | Trạng thái | Kết quả`.
   - **Đọc cột `Kiểm chứng` của mỗi `R-S..` trong srs:** yêu cầu `Kiểm chứng = test` → **bắt buộc** ≥1 `TC` và là **ứng viên Cách chạy = Auto**; `demonstration` → `TC` Manual thao tác thấy kết quả; `inspection`/`analysis` → có thể KHÔNG cần `TC` chạy được (ghi 1 dòng "kiểm bằng soi/suy luận" trong test.md, không ép ca chạy). Ghi phương pháp vào cột Nguồn/ghi chú của TC để truy ngược.
5. Thêm **bảng roll-up** ở đầu file: tổng số TC, đếm Pass/Fail/Blocked/Skip **theo cột Kết quả** + `Chưa chạy` **theo cột Trạng thái**, % Pass, lần chạy cuối.
6. Cập nhật ô `test` của màn trong `docs/00-tracking.md` = ✅ và cột "Cập nhật cuối".

## Theo dõi thực thi (manual & automation)
- Hai cột theo dõi tách vai: **Trạng thái** = `Chưa chạy` / `Đã chạy` (đã thực thi chưa); **Kết quả** = `Pass` / `Fail` / `Blocked` / `Skip` (kết luận, `—` khi chưa chạy). Soạn tài liệu để mặc định Trạng thái = `Chưa chạy`, Kết quả = `—`.
- **Cách chạy**: `Manual` hay `Auto` (gợi ý: ca lặp/ổn định → Auto; ca cần quan sát mắt/khó tự động → Manual).
- Khi **chạy test** (thủ công hoặc automation): đặt Trạng thái = `Đã chạy` và điền **Kết quả** (`Pass`/`Fail`/`Blocked`/`Skip`) từng TC, rồi cập nhật roll-up — `test.md` đóng vai trò luôn là bảng theo dõi kết quả.
- **Reset khi thay đổi (BẮT BUỘC):** TC bị sửa nội dung (bước/test data/kết quả mong đợi) do change request hoặc cập nhật yêu cầu → đặt lại **Trạng thái = `Chưa chạy`, Kết quả = `—`** (kết quả Pass cũ không còn giá trị); cập nhật lại roll-up.

## Quy tắc Test Data (BẮT BUỘC)
Cấm placeholder chung chung — phải ghi **giá trị cụ thể**:
- ❌ "nhập email sai" → ✅ "nhập `abc@`" (thiếu domain)
- ❌ "vượt giới hạn" → ✅ "nhập 256 ký tự vào Tên (max 255)"
- ❌ "mật khẩu yếu" → ✅ "nhập `12345`"

## Lưu ý
- Phủ đủ Positive · Negative · Edge; **độ sâu theo Risk Level** (rủi ro cao → nhiều ca hơn).
- Mỗi TC truy được về acceptance criterion / yêu cầu nguồn.
- Các bước test ghi rõ thao tác (nhập gì, ở đâu) — không mơ hồ.
- Tiếng Việt. Một màn hình mỗi lần.
- **Văn phong & Thuật ngữ:** thêm footer `## Thuật ngữ` cuối `test.md` (giải nghĩa EP/BVA/DT/ST, Risk, Priority…) + bổ sung thuật ngữ mới vào `docs/Ho-so/00-glossary.md` — xem `conventions.md`.
- Checklist sơ bộ trước khi viết TC → chế độ `checklist` (dưới). Script Playwright chạy được → `ba-test-e2e`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Chế độ `checklist` — checklist kiểm thử high-level cho 1 màn
Sinh `docs/Screen-spec/<Nhóm>/<Màn>/checklist.md` theo `assets/checklist-template.md` — **danh mục điểm cần kiểm mức cao**, chưa phải test case. Mỗi mục: mã `CL-S<NN>-..`, một dòng **điều kiện đạt quan sát được**, cột **Truy vết** về `R-S/UC/US/E-S`. Cho BA/QC rà nhanh độ phủ; là khung để chế độ mặc định sinh `TC` bám theo (mỗi `CL` **nên** có ≥1 `TC` — khuyến nghị, `test.md` vẫn tự phủ `R-S`/`UC` độc lập).

**Vị trí:** `ba-screen-spec` → **`ba-test checklist`** → `ba-test`. File per-màn chuẩn (có mã, cột `checklist` trong `00-tracking.md`, **`ba-review checklist`** soi độ phủ) nhưng **KHÔNG tính vào cổng hoàn thành doc** (9/9 ở hồ sơ `full`, mọi hồ sơ đều không tính) — như `e2e`. *(`ba-trace` RTM CHƯA gồm tầng `CL` — độ phủ checklist soi qua `ba-review`.)*

**Vào:** `srs.md` (R-S, field rules, Ma trận lỗi E-S), `usecase.md` (luồng chính + ngoại lệ), `userstory.md` (AC GWT), `design-spec.md` (UI states, CTA, a11y), `ascii-screen.md`/`brainstorm.md` (bối cảnh). Thiếu `srs.md`/`usecase.md` → **dừng, báo chạy `ba-screen-spec`** trước. ⚙️ Hồ sơ `mini`: luồng · AC · UI state đều nằm trong `srs.md` — 4 file kia vắng **theo thiết kế**, nói ra trong báo cáo (`⚙️ mini: …`).

**Quy trình**
1. Đọc `conventions.md` rồi các nguồn trên **của đúng màn được yêu cầu**. Một màn mỗi lần.
2. **Không suy đoán** khi thiếu/mâu thuẫn (usecase có ngoại lệ mà srs không có `E-S..`; design-spec nêu state srs không mô tả; AC chọi field rule) → hỏi lại từng phần, hoặc ghi mục **"Cần làm rõ"** cuối file — không bịa điều kiện đạt.
3. **Rút điểm kiểm theo 7 nhóm** (bỏ nhóm không áp dụng, ghi lý do):
   - **G1 Chức năng chính** — mỗi luồng chính `UC`/`US` → 1 mục.
   - **G2 Nhập liệu & Validation** — mỗi field bắt buộc/định dạng/min-max trong srs → 1 mục (không ghi test data cụ thể).
   - **G3 Trạng thái giao diện** — mỗi UI state ở design-spec (default/loading/empty/error/success/disabled…) → 1 mục.
   - **G4 Lỗi & Ngoại lệ** — mỗi `E-S..` + mỗi luồng ngoại lệ usecase → 1 mục (điều kiện đạt = **nguyên văn** cột "Người dùng thấy gì").
   - **G5 Phân quyền & Vai trò** — chỉ khi màn có ≥2 vai trò → mỗi vai trò × hành vi bị chặn/cho phép.
   - **G6 Phi chức năng** — `R-S..-N..`/`NFR` gắn màn → mỗi cái 1 mục (ngưỡng số / tiêu chí a11y cụ thể).
   - **G7 Tương thích & Liên màn** — điều hướng CTA sang màn khác (khớp `03-overview`/sitemap), responsive nếu design-spec nêu.
4. **Mã + truy vết:** `CL-S<NN>-01..` **tuần tự toàn màn** (không theo nhóm); Truy vết trỏ mã **tồn tại** (không thì là ref gãy — báo lại, không tự vá nguồn). Mỗi mục một **Ưu tiên** Critical/High/Medium/Low theo rủi ro (tiền/bảo mật/phân quyền/mất dữ liệu = cao).
5. **Cổng độ phủ (tự soát trước khi ghi):** mọi `R-S..` chức năng · mọi luồng `UC` (kể cả ngoại lệ) · mọi `E-S..` · mọi AC GWT → ≥1 `CL-S..`. Thiếu → thêm mục hoặc ghi "Cần làm rõ", không bỏ lặng.
6. **Bảng roll-up** đầu file (tổng mục, đếm theo nhóm, Pass/Fail/N-A/Chưa kiểm, lần cập nhật).
7. Ghi `checklist.md`; cập nhật ô `checklist` của màn trong `docs/00-tracking.md` = ✅ + cột "Cập nhật cuối".
8. Bàn giao: bước tiếp `ba-test` (mặc định) bám các `CL-S..`. `test.md` có TRƯỚC checklist → bổ sung tham chiếu `CL` là tùy chọn, không phải hở kiểm thử.

**Mức high-level (BẮT BUỘC — đừng lấn sân TC):** mỗi mục **một dòng** = điểm cần kiểm + điều kiện đạt quan sát được. **KHÔNG** bước thao tác, test data, kỹ thuật thiết kế test, tiền điều kiện dài.
- ✅ "Đăng nhập sai mật khẩu 5 lần → tài khoản bị khoá tạm, hiện đúng thông báo khoá" (trace `E-S01-03`).
- ❌ "Nhập email `a@b.com`, mật khẩu `123456` sai 5 lần, bấm Đăng nhập, kỳ vọng HTTP 423…" (đây là `TC`).

**Kết quả:** cột Kết quả mỗi mục `Pass`/`Fail`/`N-A`/`—` (mặc định `—`). Đổi nội dung mục (CR/đổi yêu cầu) → reset `—` + cập nhật roll-up. Kết quả chi tiết vẫn ở `test.md`.

**Lưu ý:** tiếng Việt, một màn mỗi lần; footer `## Thuật ngữ` cuối `checklist.md` + bổ sung `docs/Ho-so/00-glossary.md`. Xong → chạy `ba-next`.
