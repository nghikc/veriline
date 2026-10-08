---
name: ba-test
description: Use when cần test case chi tiết cho MỘT màn theo từng chức năng, dựa trên srs và usecase; bước 6, sinh test.md. Checklist sơ bộ là ba-checklist, script chạy được là ba-test-e2e.
---

# ba-test — Tài liệu kiểm thử 1 màn hình

## Mục tiêu
Cho một màn hình, sinh `docs/Screen-spec/<Nhóm>/<Màn>/test.md` — bộ test case theo từng chức năng, **thiết kế có hệ thống** (kỹ thuật chuẩn) và **phân theo rủi ro**.

## Quy trình
1. Đọc `conventions.md` của `ba-toolkit`, cùng `srs.md` và `usecase.md` của màn hình. **Nếu màn có `checklist.md`** (do `ba-checklist` sinh): đọc trước, dùng làm **khung high-level** — mỗi mục `CL-S..` **nên** có ≥1 `TC` bám theo, ghi mã `CL-S..` vào cột Nguồn/truy vết của TC (bên cạnh `R-S`/`UC`) để liên kết chéo. Đây là **khuyến nghị**, không bắt buộc: độ phủ kiểm thử vẫn do các luật `ba-test` bên dưới (phủ `R-S`/GWT/`E-S`) bảo đảm. **Chú ý mục "Ma trận lỗi" (`E-S..`) của `srs.md`** — mỗi dòng `E-S..` phải sinh **≥1 `TC` Negative**, và assertion dùng **nguyên văn** cột "Người dùng thấy gì" (không diễn đạt lại); ghi mã `E-S..` vào cột truy vết của TC. Ma trận lỗi rỗng ở màn có hệ thống ngoài hoặc có luồng ngoại lệ → báo lại `ba-screen-spec`, đừng tự bịa thông báo.
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
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
