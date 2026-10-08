# Tài liệu kiểm thử — Đăng ký (Mã màn: S06)

> Mỗi acceptance criterion (GWT) trong userstory, mỗi yêu cầu `R-S06..`, và mỗi luồng use case (kể cả ngoại lệ) → ≥1 test case.
> Phủ đủ 3 loại: Positive (hợp lệ) · Negative (lỗi) · Edge (biên).
**Trạng thái:** Chưa chạy / Đã chạy. **Kết quả:** Pass / Fail / Blocked / Skip (— khi chưa chạy). **Cách chạy:** Manual / Auto.

## Tổng hợp thực thi (roll-up)
> Cập nhật sau mỗi lần chạy test. Đếm Pass/Fail/Blocked/Skip theo cột **Kết quả**; `Chưa chạy` theo cột **Trạng thái**.

| Tổng TC | Pass | Fail | Blocked | Skip | Chưa chạy | % Pass | Lần chạy cuối |
|---------|------|------|---------|------|-----------|--------|---------------|
| 22 | 0 | 0 | 0 | 0 | 22 | 0% | — |

## Chức năng: Đăng ký tài khoản & tạo tổ chức (F12)

| Mã TC | Loại | Kỹ thuật | Nguồn | Risk | Priority | Chức năng | Nội dung chức năng | Tiền điều kiện | Các bước | Test Data | Kết quả mong đợi | Cách chạy | Trạng thái | Kết quả |
|-------|------|----------|-------|------|----------|-----------|--------------------|----------------|----------|-----------|------------------|-----------|------------|---------|
| TC-S06-01 | Positive | EP | R-S06-06, R-S06-08 / GWT-1 / UC-S06-01 / CL-S06-01, CL-S06-15, CL-S06-16, CL-S06-24, CL-S06-28, CL-S06-33, CL-S06-34 | Cao | Critical | F12 | Đăng ký tài khoản & tạo tổ chức | Email chưa tồn tại; người dùng chưa đăng nhập | 1. Mở /register. 2. Nhập email hợp lệ. 3. Nhập mật khẩu đủ mạnh. 4. Nhập xác nhận mật khẩu khớp. 5. Nhập tên tổ chức. 6. Nhấn "Tạo tài khoản". | email: `new.user@cty.vn`, password: `Abc12345`, confirm: `Abc12345`, org: `Công ty ABC` | Redirect về /dashboard trong ≤3 giây; người dùng có vai trò Org Admin; tổ chức "Công ty ABC" được tạo; session hợp lệ | Auto | Chưa chạy | — |
| TC-S06-02 | Positive | EP | R-S06-06, R-S06-08 / GWT-1 / CL-S06-01, CL-S06-15, CL-S06-16, CL-S06-24, CL-S06-28, CL-S06-33, CL-S06-34 | Cao | High | F12 | Đăng ký tài khoản & tạo tổ chức | Email chưa tồn tại | 1. Điền đầy đủ 4 trường hợp lệ. 2. Nhấn Enter khi focus ở trường Tên tổ chức. | Dữ liệu hợp lệ | Hành vi giống nhấn nút "Tạo tài khoản" — redirect Dashboard | Auto | Chưa chạy | — |
| TC-S06-03 | Positive | EP | R-S06-02 / GWT-1 / CL-S06-01, CL-S06-03, CL-S06-12, CL-S06-17 | Trung bình | Medium | F12 | Đăng ký tài khoản & tạo tổ chức | Email chưa tồn tại | 1. Nhập email có dấu cách trước/sau. 2. Điền đủ các trường khác. 3. Submit. | email: `  new.user@cty.vn  ` | Đăng ký thành công; API nhận email đã được trim `new.user@cty.vn` | Auto | Chưa chạy | — |
| TC-S06-04 | Positive | ST | R-S06-N06 / GWT-2 / CL-S06-30 | Thấp | Low | F12 | Đăng ký tài khoản & tạo tổ chức | Form đang hiển thị | 1. Click vào trường Email. 2. Nhấn Tab liên tiếp 4 lần. | — | Focus chuyển: Email → Mật khẩu → Xác nhận mật khẩu → Tên tổ chức → Nút Tạo tài khoản | Manual | Chưa chạy | — |
| TC-S06-05 | Positive | EP | R-S06-08 / GWT-3 / UC-S06-01 / CL-S06-01, CL-S06-16, CL-S06-33 | Trung bình | Medium | F12 | Đăng ký tài khoản & tạo tổ chức | Đăng ký thành công với org: `Team XYZ` | 1. Hoàn thành đăng ký. 2. Quan sát Dashboard. | org: `Team XYZ` | Header/sidebar hiển thị "Team XYZ"; vai trò hiển thị "Org Admin" | Manual | Chưa chạy | — |
| TC-S06-06 | Negative | EP | R-S06-02 / GWT-2 / UC-S06-01 [2a] / CL-S06-01, CL-S06-03, CL-S06-12, CL-S06-17, CL-S06-30 | Cao | High | F12 | Đăng ký tài khoản & tạo tổ chức | — | 1. Nhập email thiếu @. 2. Blur khỏi trường Email. | email: `khongdungdinh` | Lỗi inline "Vui lòng nhập địa chỉ email hợp lệ." xuất hiện; không có network request | Auto | Chưa chạy | — |
| TC-S06-07 | Negative | EP | R-S06-07 / GWT-4 / UC-S06-02 / CL-S06-19 | Cao | High | F12 | Đăng ký tài khoản & tạo tổ chức | Email `an.nguyen@cty.vn` đã được đăng ký | 1. Nhập email đã tồn tại. 2. Điền đủ các trường khác hợp lệ. 3. Submit. | email: `an.nguyen@cty.vn` | Lỗi inline "Email đã được sử dụng. Vui lòng dùng địa chỉ khác hoặc đăng nhập." xuất hiện dưới trường Email; focus về trường Email; không tạo tài khoản/tổ chức mới | Auto | Chưa chạy | — |
| TC-S06-08 | Negative | ST | R-S06-07 / GWT-5 / CL-S06-19 | Trung bình | Medium | F12 | Đăng ký tài khoản & tạo tổ chức | Lỗi email trùng đang hiển thị | 1. Thay email bằng địa chỉ mới chưa tồn tại. 2. Submit lại. | email mới: `brand.new@cty.vn` | Lỗi inline email biến mất; form xử lý bình thường | Auto | Chưa chạy | — |
| TC-S06-09 | Negative | BVA | R-S06-N02 / GWT-8 / UC-S06-03 / CL-S06-06, CL-S06-07, CL-S06-20 | Cao | High | F12 | Đăng ký tài khoản & tạo tổ chức | — | 1. Nhập mật khẩu 4 ký tự. 2. Blur khỏi trường Mật khẩu. | password: `Ab1x` | Thanh độ mạnh hiển thị "Yếu"; lỗi inline "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái và chữ số."; nút Tạo tài khoản disabled | Auto | Chưa chạy | — |
| TC-S06-10 | Negative | DT | R-S06-N02 / GWT-8 / UC-S06-03 / CL-S06-06, CL-S06-07, CL-S06-20 | Cao | High | F12 | Đăng ký tài khoản & tạo tổ chức | — | 1. Nhập mật khẩu chỉ có chữ cái. 2. Blur. | password: `abcdefgh` | Thanh độ mạnh "Yếu"; lỗi inline mật khẩu yếu; nút disabled | Auto | Chưa chạy | — |
| TC-S06-11 | Negative | EP | R-S06-04 / GWT-10 / UC-S06-04 / CL-S06-08, CL-S06-21 | Cao | High | F12 | Đăng ký tài khoản & tạo tổ chức | Trường Mật khẩu đã điền `Abc12345` | 1. Nhập xác nhận mật khẩu khác. 2. Blur khỏi trường Xác nhận. | confirm: `Abc12346` | Lỗi inline "Mật khẩu xác nhận không khớp." xuất hiện dưới trường Xác nhận; nút Tạo tài khoản disabled | Auto | Chưa chạy | — |
| TC-S06-12 | Negative | ST | R-S06-04 / GWT-11 / CL-S06-08, CL-S06-21 | Trung bình | Medium | F12 | Đăng ký tài khoản & tạo tổ chức | Lỗi không khớp đang hiển thị | 1. Sửa trường Xác nhận mật khẩu khớp với Mật khẩu gốc. 2. Blur. | confirm: `Abc12345` (khớp) | Lỗi inline biến mất; nút Tạo tài khoản được enable lại (nếu các trường khác hợp lệ) | Auto | Chưa chạy | — |
| TC-S06-13 | Negative | EP | R-S06-05 / GWT-12 / UC-S06-01 [5a] / CL-S06-01, CL-S06-09, CL-S06-12, CL-S06-22 | Cao | High | F12 | Đăng ký tài khoản & tạo tổ chức | — | 1. Điền email, password hợp lệ. 2. Để trống trường Tên tổ chức. 3. Nhấn Submit. | ten_to_chuc: rỗng | Lỗi inline "Tên tổ chức không được để trống." xuất hiện; không gọi API | Auto | Chưa chạy | — |
| TC-S06-14 | Negative | EP | R-S06-01 / GWT-2 / CL-S06-04, CL-S06-13, CL-S06-18, CL-S06-30, CL-S06-32 | Cao | High | F12 | Đăng ký tài khoản & tạo tổ chức | — | 1. Để trống Email. 2. Điền đủ các trường khác. 3. Submit. | email: rỗng | Lỗi validation email bắt buộc; không gọi API | Auto | Chưa chạy | — |
| TC-S06-15 | Negative | EP | R-S06-01 / CL-S06-04, CL-S06-13, CL-S06-18, CL-S06-32 | Cao | High | F12 | Đăng ký tài khoản & tạo tổ chức | — | 1. Nhập email hợp lệ. 2. Để trống Mật khẩu. 3. Submit. | password: rỗng | Lỗi validation mật khẩu bắt buộc; không gọi API | Auto | Chưa chạy | — |
| TC-S06-16 | Edge | ST | R-S06-03 / GWT-6, GWT-7 / CL-S06-05, CL-S06-06, CL-S06-14 | Trung bình | Medium | F12 | Đăng ký tài khoản & tạo tổ chức | — | 1. Gõ ký tự đầu tiên vào Mật khẩu. 2. Tiếp tục gõ đến 8 ký tự có chữ và số. 3. Gõ thêm ký tự đặc biệt đến ≥ 12 ký tự. | password dần: `A` → `Abc12345` → `Abc12345@xyz` | Bước 1: thanh xuất hiện hiển thị "Yếu". Bước 2: thanh chuyển "Trung bình". Bước 3: thanh chuyển "Mạnh". | Manual | Chưa chạy | — |
| TC-S06-17 | Edge | ST | R-S06-09 / GWT-1 / UC-S06-06 / CL-S06-01, CL-S06-02 | Cao | High | F12 | Đăng ký tài khoản & tạo tổ chức | Đã đăng nhập (session hợp lệ) | 1. Gõ /register trực tiếp vào URL. | — | Redirect ngay về /dashboard; form không render | Auto | Chưa chạy | — |
| TC-S06-18 | Edge | EP | R-S06-06 / UC-S06-05 / CL-S06-01, CL-S06-15, CL-S06-24, CL-S06-25, CL-S06-28, CL-S06-34 | Cao | High | F12 | Đăng ký tài khoản & tạo tổ chức | Mạng bị ngắt sau khi nhấn Submit | 1. Điền form hợp lệ. 2. Ngắt mạng. 3. Nhấn "Tạo tài khoản". | — | Snackbar "Lỗi kết nối. Vui lòng thử lại." xuất hiện ở đáy; dữ liệu form giữ nguyên; nút enabled lại sau 500ms | Manual | Chưa chạy | — |
| TC-S06-19 | Edge | ST | R-S06-10 / GWT-15, GWT-16 / CL-S06-11 | Thấp | Low | F12 | Đăng ký tài khoản & tạo tổ chức | — | 1. Nhập vào cả 2 trường. 2. Nhấn icon mắt trên trường Mật khẩu. 3. Nhấn icon mắt trên trường Xác nhận mật khẩu. | — | Bước 2: chỉ trường Mật khẩu hiển thị rõ; Xác nhận vẫn ẩn. Bước 3: Xác nhận hiển thị rõ độc lập. Mỗi nút toggle hoạt động riêng biệt. | Manual | Chưa chạy | — |
| TC-S06-20 | Edge | BVA | R-S06-05, BRule-S06-04 / CL-S06-09, CL-S06-10, CL-S06-12, CL-S06-22 | Trung bình | Medium | F12 | Đăng ký tài khoản & tạo tổ chức | — | 1. Nhập tên tổ chức chính xác 100 ký tự. 2. Submit với các trường khác hợp lệ. | ten_to_chuc: chuỗi 100 ký tự | Đăng ký thành công; không báo lỗi giới hạn ký tự | Auto | Chưa chạy | — |
| TC-S06-21 | Edge | ST | R-S06-03 / CL-S06-05, CL-S06-14 | Trung bình | Medium | F12 | Đăng ký tài khoản & tạo tổ chức | Đã nhập mật khẩu `Abc12345` (Trung bình) | 1. Xoá toàn bộ nội dung trường Mật khẩu. | — | Thanh đo độ mạnh ẩn đi; nút Tạo tài khoản disabled | Manual | Chưa chạy | — |
| TC-S06-22 | Edge | EP | R-S06-03 / CL-S06-05, CL-S06-14 | Thấp | Low | F12 | Đăng ký tài khoản & tạo tổ chức | — | 1. Copy chuỗi mật khẩu. 2. Paste vào trường Mật khẩu. | password paste: `P@ssword123!` | Thanh đo độ mạnh cập nhật ngay sau khi paste; hiển thị "Mạnh" | Manual | Chưa chạy | — |

## Thuật ngữ
| Thuật ngữ | Giải thích |
|---|---|
| TC (Test Case) | Ca kiểm thử — một tình huống kiểm tra cụ thể có kết quả mong đợi |
| Positive / Negative / Edge | Ca thuận (đúng luồng) · ca nghịch (sai/lỗi) · ca biên (giá trị ranh giới) |
| EP (Equivalence Partitioning) | Chia dữ liệu thành lớp tương đương, mỗi lớp chỉ cần kiểm một đại diện |
| BVA (Boundary Value Analysis) | Kiểm tại giá trị biên (min, min-1, max, max+1) — nơi lỗi hay nằm |
| DT (Decision Table) | Bảng quyết định — tổ hợp điều kiện × kết quả |
| ST (State Transition) | Kiểm chuyển trạng thái hợp lệ/không hợp lệ |
| R-S.. | Mã yêu cầu cấp màn trong `srs.md` mà ca kiểm thử này phủ |
| GWT (Given-When-Then) | Khuôn tiêu chí chấp nhận trong `userstory.md` |
| Cách chạy: Manual / Auto | Chạy tay hay chạy tự động (script E2E) |

> Từ điển đầy đủ toàn dự án: `docs/00-glossary.md`.
