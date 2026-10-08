# Kế hoạch nghiệm thu người dùng (UAT) — TeamTasks

> Nghiệm thu **nghiệp vụ, xuyên màn, do người dùng/PO/khách hàng chạy** — bổ trợ (không thay) test kỹ thuật per màn ở các `test.md`.
> UAT = User Acceptance Testing (nghiệm thu người dùng). Mỗi kịch bản mô tả *người dùng làm gì để đạt mục tiêu kinh doanh*, không phải cách hệ thống xử lý kỹ thuật.

## 1. Phạm vi & mục tiêu nghiệm thu

- **Mục tiêu:** xác nhận TeamTasks đáp ứng nhu cầu nghiệp vụ cốt lõi — mọi công việc của nhóm được tạo, giao, theo dõi và duyệt minh bạch trong một hệ thống, dữ liệu mỗi tổ chức được cô lập — trước khi ra mắt.
- **Phạm vi nghiệm thu (theo phase phát hành):**
  - **Phase 1 (MVP — chức năng ưu tiên Must):** Đăng ký & tạo tổ chức, Đăng nhập & bảo vệ tài khoản, vòng đời công việc (giao → thực hiện → duyệt), Dashboard theo dõi tiến độ, thông báo in-app, quản trị thành viên & cô lập dữ liệu tổ chức → **UAT-01 … UAT-06**.
  - **Phase 2 (chức năng ưu tiên Should):** nhắc deadline qua email, bình luận công việc, hồ sơ cá nhân, thông tin tổ chức, **xuất báo cáo tiến độ** (`CR-01`) → **UAT-07 … UAT-11**.
- **Ngoài phạm vi đợt này:** OAuth/SSO; "Quên mật khẩu" tự phục vụ; import thành viên qua CSV (`TR-02`, kiểm ở giai đoạn chuyển đổi); app mobile.
- **Vai trò nghiệp vụ được nghiệm thu:** Thành viên (Member), Quản lý nhóm (Team Lead), Admin tổ chức (Org Admin) — trace `StR-01`, `StR-02`, `StR-03`.
- **Người tham gia:** PO · BA · đại diện người dùng/khách hàng · QA Lead.
- **Môi trường & dữ liệu:** môi trường UAT (staging) tách biệt production; bộ dữ liệu mẫu seed sẵn 2 tổ chức (`Cong ty ABC`, `Cong ty XYZ`) + tài khoản test 3 vai trò; hộp thư test cho email nhắc deadline (`GĐ-04`).
- **Điều kiện vào (Entry criteria):**
  - Mọi màn thuộc phase đang nghiệm thu đã có tài liệu BA + code triển khai.
  - Test kỹ thuật per màn (`test.md`) đạt mức tối thiểu: không còn lỗi Critical/High mở trên các luồng thuộc phase.
  - Dữ liệu mẫu đã nạp; tài khoản test đủ 3 vai trò; môi trường UAT truy cập được.
- **Điều kiện ra (Exit criteria):** xem mục 4.1 (Definition of Done / Release readiness).

---

## 2. Kịch bản UAT (end-to-end, theo luồng nghiệp vụ)

> Mỗi kịch bản chạy **xuyên nhiều màn**, do người dùng/PO chạy tay. Kết quả mong đợi ghi **số/trạng thái/thông báo cụ thể** để nghiệm thu khách quan.

## Phase 1 — MVP (chức năng ưu tiên Must)

### UAT-01 — Đăng ký tài khoản và khởi tạo tổ chức

| Mục | Nội dung |
|-----|----------|
| **Phase** | Phase 1 |
| **Tiền điều kiện** | Chưa có tài khoản; email `admin.abc@cty.vn` chưa tồn tại trong hệ thống; chưa đăng nhập |
| **Vai trò chạy** | Người dùng mới → Org Admin |
| **Chức năng (F)** | F12 |
| **Trace FR/BR** | FR-13, BR-01, BR-03 |
| **Trace UC** | UC-S06-01, UC-S06-02 |
| **Màn đi qua** | S06 (Đăng ký) → S02 (Dashboard) |
| **Dữ liệu mẫu** | email `admin.abc@cty.vn`, mật khẩu `Matkhau@2026`, xác nhận `Matkhau@2026`, tên tổ chức `Cong ty ABC` |
| **Trạng thái** | Chưa chạy |

**Các bước nghiệp vụ:**
1. Người dùng mở màn Đăng ký (S06), nhập email, mật khẩu, xác nhận mật khẩu và tên tổ chức bằng dữ liệu mẫu.
2. Người dùng bấm "Tạo tài khoản".
3. (Nhánh email trùng) Người dùng lặp lại bước 1–2 với email `an.nguyen@cty.vn` (đã tồn tại) để kiểm phản hồi lỗi.

**Kết quả mong đợi (đo được):**
- Sau bước 2: hệ thống tạo 1 tài khoản mới + 1 tổ chức `Cong ty ABC`, tự đăng nhập và chuyển tới Dashboard (S02) **trong ≤ 3 giây**; Dashboard hiển thị tên tổ chức `Cong ty ABC` và vai trò người dùng là **Org Admin**.
- Sau bước 3 (email trùng): hệ thống hiển thị lỗi inline dưới trường Email "Email đã được sử dụng. Vui lòng dùng địa chỉ khác hoặc đăng nhập."; **không** tạo tài khoản/tổ chức mới; con trỏ focus về trường Email.

---

### UAT-02 — Đăng nhập, khoá tài khoản khi bị dò mật khẩu, và đăng xuất an toàn

| Mục | Nội dung |
|-----|----------|
| **Phase** | Phase 1 |
| **Tiền điều kiện** | Tài khoản `an.nguyen@cty.vn` trạng thái ACTIVE, `fail_count = 0` |
| **Vai trò chạy** | Mọi vai trò (Member / Team Lead / Org Admin) |
| **Chức năng (F)** | F01, F02 |
| **Trace FR/BR** | FR-01, BR-03, NFR-03 |
| **Trace UC** | UC-S01-01, UC-S01-02, UC-S01-03, UC-S01-06 |
| **Màn đi qua** | S01 (Đăng nhập) → S02 (Dashboard) → S01 |
| **Dữ liệu mẫu** | email `an.nguyen@cty.vn`; mật khẩu đúng `Secure@2024`; mật khẩu sai `SaiRoi000` |
| **Trạng thái** | Chưa chạy |

**Các bước nghiệp vụ:**
1. Người dùng mở màn Đăng nhập (S01), nhập email + mật khẩu đúng, bấm "Đăng nhập".
2. Đăng xuất, quay lại S01. Người dùng nhập email đúng + mật khẩu sai **5 lần liên tiếp**.
3. Sau khi bị khoá, người dùng thử đăng nhập lại bằng mật khẩu **đúng** ngay lập tức.
4. Người dùng đăng nhập thành công ở một phiên khác rồi bấm "Đăng xuất".

**Kết quả mong đợi (đo được):**
- Bước 1: đăng nhập thành công, chuyển tới Dashboard (S02) **trong ≤ 2 giây**, không có thông báo lỗi.
- Bước 2: từ lần sai thứ nhất tới thứ tư, hệ thống báo "Sai email hoặc mật khẩu. Còn N lần thử." (N giảm dần 4→1); ở **lần sai thứ 5**, tài khoản chuyển TEMP_LOCKED, hiển thị "Tài khoản đang bị khoá. Vui lòng thử lại sau 15 phút 00 giây." kèm đồng hồ đếm ngược, nút "Đăng nhập" bị disable.
- Bước 3: dù nhập đúng mật khẩu, hệ thống **vẫn từ chối** đăng nhập trong thời gian khoá (không chuyển Dashboard).
- Bước 4: đăng xuất chuyển về S01 **trong ≤ 500ms**; token cũ dùng lại bị hệ thống từ chối (không truy cập được dữ liệu).

---

### UAT-03 — Giao việc → thực hiện → gửi duyệt → duyệt/ trả lại (vòng đời công việc)

| Mục | Nội dung |
|-----|----------|
| **Phase** | Phase 1 |
| **Tiền điều kiện** | Tổ chức `Cong ty ABC` có Team Lead `lead.abc@cty.vn` và Member `member.abc@cty.vn` (ACTIVE); cả hai đăng nhập được |
| **Vai trò chạy** | Team Lead (giao & duyệt) · Member (thực hiện) · Hệ thống (thông báo) |
| **Chức năng (F)** | F04, F05, F06, F08 |
| **Trace FR/BR** | FR-04, FR-05, FR-06, FR-07, FR-09, BR-01, BR-02 |
| **Trace UC** | UC-S02-01, UC-S02-02, UC-S02-03 · UC-S03-01, UC-S03-02, UC-S03-03, UC-S03-07 |
| **Màn đi qua** | S02 (Dashboard, Team Lead) → S02/S03 (Member) → S03 (Team Lead duyệt) |
| **Dữ liệu mẫu** | công việc `Viết tài liệu API`, người thực hiện `member.abc@cty.vn`, deadline `20/06/2026 17:00`, ưu tiên `Cao` |
| **Trạng thái** | Chưa chạy |

**Các bước nghiệp vụ:**
1. Team Lead vào Dashboard (S02), bấm "+ Tạo công việc", điền tiêu đề, chọn người thực hiện, deadline và ưu tiên mẫu, bấm "Tạo công việc".
2. Member đăng nhập, mở thông báo in-app, vào công việc được giao (S03), chuyển trạng thái TODO → IN_PROGRESS, rồi IN_PROGRESS → IN_REVIEW (gửi duyệt).
3. Team Lead nhận thông báo, mở công việc (S03), **trả lại** (IN_REVIEW → IN_PROGRESS) kèm lý do.
4. Member chỉnh sửa và gửi duyệt lại (IN_PROGRESS → IN_REVIEW); Team Lead **duyệt đạt** (IN_REVIEW → DONE).

**Kết quả mong đợi (đo được):**
- Bước 1: công việc `Viết tài liệu API` tạo với trạng thái **TODO**, có đúng người thực hiện + deadline, hiện đầu danh sách; thẻ "Tổng"/"Cần làm" tăng +1; Member nhận **1 thông báo in-app** "Bạn được giao Viết tài liệu API".
- Bước 2: mỗi lần chuyển trạng thái được lưu vào **lịch sử thay đổi** của công việc (mốc thời gian + người thao tác); công việc hiển thị đúng trạng thái mới ở cả S03 và Dashboard.
- Bước 3: công việc quay về **IN_PROGRESS**; Member nhận thông báo trạng thái thay đổi kèm lý do.
- Bước 4: sau khi duyệt đạt, công việc chuyển **DONE**, đếm vào thẻ "Hoàn thành"; Member nhận thông báo kết quả "đã được duyệt". Không tồn tại "công việc mồ côi" — mọi công việc luôn có người thực hiện + deadline (BR-02).

---

### UAT-04 — Theo dõi tiến độ nhóm trên Dashboard (không cần họp thủ công)

| Mục | Nội dung |
|-----|----------|
| **Phase** | Phase 1 |
| **Tiền điều kiện** | Tổ chức `Cong ty ABC` có ≥ 20 công việc ở nhiều trạng thái, trong đó ≥ 1 việc quá hạn |
| **Vai trò chạy** | Team Lead |
| **Chức năng (F)** | F03 |
| **Trace FR/BR** | FR-03, BR-01, BR-04 |
| **Trace UC** | UC-S02-01 |
| **Màn đi qua** | S02 (Dashboard) |
| **Dữ liệu mẫu** | bộ 24 công việc mẫu; lọc "Đang làm"; tìm từ khoá `API` |
| **Trạng thái** | Chưa chạy |

**Các bước nghiệp vụ:**
1. Team Lead vào Dashboard, quan sát 5 thẻ thống kê nhanh (Tổng, Cần làm, Đang làm, Hoàn thành, Quá hạn).
2. Team Lead lọc danh sách theo trạng thái "Đang làm", rồi tìm theo tiêu đề chứa `API`.
3. Team Lead bấm thẻ "Quá hạn" để lọc nhanh các việc trễ deadline.

**Kết quả mong đợi (đo được):**
- Bước 1: 5 thẻ hiển thị đúng số đếm theo dữ liệu mẫu; Team Lead thấy công việc của **toàn tổ chức** (không chỉ của mình).
- Bước 2: danh sách chỉ còn việc IN_PROGRESS (không reload trang); tìm `API` chỉ còn việc có tiêu đề chứa "API" (không phân biệt hoa thường).
- Bước 3: các việc quá deadline được tô đỏ kèm cảnh báo ⚠ và khớp đúng số ở thẻ "Quá hạn"; toàn bộ tổng quan có được **không cần tổ chức họp cập nhật thủ công** (BR-04).

---

### UAT-05 — Nhận và đọc thông báo in-app (không bỏ lỡ công việc)

| Mục | Nội dung |
|-----|----------|
| **Phase** | Phase 1 |
| **Tiền điều kiện** | Member `member.abc@cty.vn` đăng nhập, có ≥ 3 thông báo chưa đọc |
| **Vai trò chạy** | Member |
| **Chức năng (F)** | F08 |
| **Trace FR/BR** | FR-09, BR-05 |
| **Trace UC** | UC-S02-03 |
| **Màn đi qua** | S02 (Dashboard) → S03 (Chi tiết công việc) |
| **Dữ liệu mẫu** | 3 thông báo chưa đọc; thông báo "Bạn được giao Viết tài liệu API" |
| **Trạng thái** | Chưa chạy |

**Các bước nghiệp vụ:**
1. Member mở Dashboard, quan sát badge số chưa đọc trên chuông 🔔.
2. Member mở panel thông báo, bấm vào thông báo "Bạn được giao Viết tài liệu API".
3. Member bấm "Đọc tất cả".
4. (Không reload) một công việc mới được giao cho Member ở phiên khác; Member chờ tối đa 60 giây.

**Kết quả mong đợi (đo được):**
- Bước 1: chuông hiển thị badge "3" (với > 99 thông báo thì hiển thị "99+").
- Bước 2: thông báo chuyển **đã đọc**, badge **giảm 1**, hệ thống điều hướng tới đúng công việc (S03).
- Bước 3: badge **ẩn** và mọi dòng trong panel chuyển trạng thái đã đọc.
- Bước 4: badge **tự tăng** trong vòng ≤ 60 giây mà Member không cần reload trang.

---

### UAT-06 — Quản trị thành viên tổ chức và cô lập dữ liệu giữa các tổ chức

| Mục | Nội dung |
|-----|----------|
| **Phase** | Phase 1 |
| **Tiền điều kiện** | Org Admin `admin.abc@cty.vn` của `Cong ty ABC`; tồn tại tổ chức thứ hai `Cong ty XYZ` với dữ liệu công việc riêng |
| **Vai trò chạy** | Org Admin |
| **Chức năng (F)** | F13 |
| **Trace FR/BR** | FR-02, BR-03, NFR-06 |
| **Trace UC** | UC-S05-02, UC-S05-03, UC-S05-04, UC-S05-05, UC-S05-06, UC-S05-09 |
| **Màn đi qua** | S05 (Tổ chức) → S02 (Dashboard) |
| **Dữ liệu mẫu** | thành viên mời `newbie.abc@cty.vn`; thành viên vô hiệu hoá `member.abc@cty.vn` |
| **Trạng thái** | Chưa chạy |

**Các bước nghiệp vụ:**
1. Org Admin vào màn Tổ chức (S05), mời thành viên mới bằng email mẫu.
2. Org Admin vô hiệu hoá một thành viên đang ACTIVE.
3. Thành viên vừa bị vô hiệu hoá thử đăng nhập.
4. Org Admin của `Cong ty ABC` thử truy cập/tìm công việc thuộc `Cong ty XYZ` (qua UI và thử gọi API trực tiếp).

**Kết quả mong đợi (đo được):**
- Bước 1: thành viên mới xuất hiện trong danh sách tổ chức ở trạng thái phù hợp (chờ kích hoạt/đang hoạt động theo quy tắc mời).
- Bước 2: thành viên bị vô hiệu hoá chuyển trạng thái không hoạt động; không còn được giao việc mới.
- Bước 3: thành viên bị vô hiệu hoá **không đăng nhập được** vào hệ thống.
- Bước 4: Org Admin `Cong ty ABC` **không** nhìn thấy bất kỳ công việc/dữ liệu nào của `Cong ty XYZ`; gọi API trực tiếp tới dữ liệu tổ chức khác bị từ chối (không có data bleed giữa các tenant — NFR-06, BR-03).

---

## Phase 2 — Mở rộng (chức năng ưu tiên Should)

### UAT-07 — Nhắc deadline qua email

| Mục | Nội dung |
|-----|----------|
| **Phase** | Phase 2 |
| **Tiền điều kiện** | Có công việc đến hạn **trong ngày** và công việc **đã quá hạn chưa hoàn thành**, gán cho `member.abc@cty.vn`; hộp thư test cấu hình sẵn |
| **Vai trò chạy** | Hệ thống (cron 08:00) → Member / Team Lead |
| **Chức năng (F)** | F09 |
| **Trace FR/BR** | FR-10, BR-05 |
| **Trace UC** | *(chạy nền — không có màn riêng; kết quả quan sát qua email)* |
| **Màn đi qua** | *(không có màn — email)* |
| **Dữ liệu mẫu** | công việc `Nộp báo cáo tuần` deadline hôm nay 17:00; công việc `Sửa lỗi đăng nhập` quá hạn 1 ngày |
| **Trạng thái** | Chưa chạy |

**Các bước nghiệp vụ:**
1. Kích hoạt cron nhắc deadline (hoặc chờ mốc 08:00 / dùng fixture mock thời gian).
2. Member mở hộp thư test kiểm email nhận được.

**Kết quả mong đợi (đo được):**
- Sau bước 1: hệ thống gửi đúng **1 email** cho `member.abc@cty.vn`, liệt kê công việc đến hạn trong ngày và công việc đã quá hạn chưa hoàn thành; không gửi cho công việc đã DONE.
- Email chứa tiêu đề công việc, deadline và liên kết mở công việc; không phát sinh email trùng cho cùng công việc trong cùng ngày.

---

### UAT-08 — Trao đổi qua bình luận trên công việc

| Mục | Nội dung |
|-----|----------|
| **Phase** | Phase 2 |
| **Tiền điều kiện** | Công việc `Viết tài liệu API` tồn tại trong `Cong ty ABC`; Member và Team Lead cùng tổ chức |
| **Vai trò chạy** | Member · Team Lead |
| **Chức năng (F)** | F07 |
| **Trace FR/BR** | FR-08, BR-01 |
| **Trace UC** | UC-S03-04, UC-S03-07 |
| **Màn đi qua** | S03 (Chi tiết công việc) |
| **Dữ liệu mẫu** | bình luận `Đã xong phần mở đầu, nhờ anh review giúp` |
| **Trạng thái** | Chưa chạy |

**Các bước nghiệp vụ:**
1. Member mở công việc (S03), thêm một bình luận bằng nội dung mẫu.
2. Team Lead mở cùng công việc và đọc bình luận, thêm bình luận trả lời.

**Kết quả mong đợi (đo được):**
- Bước 1: bình luận xuất hiện trong dòng thời gian công việc kèm tên người viết + mốc thời gian; mọi thành viên trong tổ chức đọc được.
- Bước 2: bình luận của Team Lead hiển thị đúng thứ tự thời gian; nội dung không rò rỉ sang tổ chức khác.

---

### UAT-09 — Cập nhật hồ sơ cá nhân và đổi mật khẩu

| Mục | Nội dung |
|-----|----------|
| **Phase** | Phase 2 |
| **Tiền điều kiện** | Người dùng `member.abc@cty.vn` đã đăng nhập |
| **Vai trò chạy** | Mọi vai trò |
| **Chức năng (F)** | F10 |
| **Trace FR/BR** | FR-11, BR-03 |
| **Trace UC** | UC-S04-01, UC-S04-02, UC-S04-03, UC-S04-04 |
| **Màn đi qua** | S04 (Hồ sơ cá nhân) → S01 (Đăng nhập lại) |
| **Dữ liệu mẫu** | họ tên mới `Nguyen Van An`; mật khẩu mới `MoiMatKhau@2026` |
| **Trạng thái** | Chưa chạy |

**Các bước nghiệp vụ:**
1. Người dùng mở Hồ sơ cá nhân (S04), đổi họ tên hiển thị và cập nhật ảnh đại diện, lưu lại.
2. Người dùng đổi mật khẩu sang mật khẩu mới hợp lệ, lưu lại.
3. Người dùng đăng xuất và đăng nhập lại bằng mật khẩu mới.

**Kết quả mong đợi (đo được):**
- Bước 1: họ tên và ảnh đại diện mới hiển thị đúng trên header/menu và Dashboard.
- Bước 2: hệ thống báo đổi mật khẩu thành công.
- Bước 3: đăng nhập bằng **mật khẩu mới** thành công; mật khẩu cũ **không** còn dùng được.

---

### UAT-10 — Cập nhật thông tin tổ chức (tên, logo)

| Mục | Nội dung |
|-----|----------|
| **Phase** | Phase 2 |
| **Tiền điều kiện** | Org Admin `admin.abc@cty.vn` đã đăng nhập vào `Cong ty ABC` |
| **Vai trò chạy** | Team Lead / Org Admin |
| **Chức năng (F)** | F11 |
| **Trace FR/BR** | FR-12, BR-03 |
| **Trace UC** | UC-S05-01 |
| **Màn đi qua** | S05 (Tổ chức) → S02 (Dashboard) |
| **Dữ liệu mẫu** | tên tổ chức mới `Cong ty ABC Corp`; logo file `logo-abc.png` |
| **Trạng thái** | Chưa chạy |

**Các bước nghiệp vụ:**
1. Org Admin mở màn Tổ chức (S05), đổi tên tổ chức và tải lên logo mới, lưu lại.
2. Org Admin quay về Dashboard kiểm tra hiển thị.

**Kết quả mong đợi (đo được):**
- Bước 1: hệ thống lưu tên và logo mới, báo cập nhật thành công.
- Bước 2: Dashboard và header hiển thị đúng tên `Cong ty ABC Corp` và logo mới; Member vai trò thường **không** thấy tùy chọn sửa thông tin tổ chức.

---

### UAT-11 — Xuất báo cáo tiến độ từ Dashboard *(CR-01)*

| Mục | Nội dung |
|-----|----------|
| **Phase** | Phase 2 |
| **Tiền điều kiện** | Team Lead `lead.abc@cty.vn` đã đăng nhập vào `Cong ty ABC`; tổ chức có ≥ 10 công việc trải đủ 4 trạng thái, trong đó ≥ 2 việc quá hạn |
| **Vai trò chạy** | Team Lead / Org Admin |
| **Chức năng (F)** | F14 |
| **Trace FR/BR** | FR-14, BR-04 |
| **Trace UC** | UC-S02-04 |
| **Màn đi qua** | S02 (Dashboard) |
| **Dữ liệu mẫu** | bộ lọc "Quá hạn" + khoảng thời gian tuần hiện tại; xuất lần lượt PDF và Excel |
| **Trạng thái** | Chưa chạy |

**Các bước nghiệp vụ:**
1. Team Lead mở Dashboard, đặt bộ lọc "Quá hạn" cho tuần hiện tại.
2. Chọn xuất báo cáo dạng PDF.
3. Lặp lại bước 2 với dạng Excel.
4. Đăng nhập bằng tài khoản Member `member1@acme.vn` và kiểm tra quyền.

**Kết quả mong đợi (đo được):**
- Bước 1: danh sách và thẻ thống kê chỉ còn công việc quá hạn của tuần hiện tại.
- Bước 2: tệp PDF tải về mở được, **nội dung khớp đúng bộ lọc đang xem** — cùng số việc, cùng thống kê; có tên tổ chức, người xuất và thời điểm xuất.
- Bước 3: tệp Excel mở được, mỗi công việc một dòng, đủ cột tiêu đề/người thực hiện/trạng thái/deadline; số dòng bằng số việc ở bước 1.
- Bước 4: Member **không** thấy tuỳ chọn xuất báo cáo (`BRule-S02-08`).

---

## 3. Ma trận truy vết yêu cầu → UAT (RTM)

> Soát hai chiều: mỗi `FR` **Must** có ≥ 1 UAT; mỗi UAT trace ngược về ≥ 1 `FR`/`BR` (không kịch bản mồ côi). RTM = Requirements Traceability Matrix.

| Yêu cầu (FR/BR) | Ưu tiên (MoSCoW) | Chức năng (F) | Use case (UC) | Kịch bản UAT | Phase | Trạng thái |
|-----------------|------------------|---------------|---------------|--------------|-------|------------|
| FR-13 | Must | F12 | UC-S06-01, UC-S06-02 | UAT-01 | Phase 1 | Chưa chạy |
| FR-01 | Must | F01, F02 | UC-S01-01, UC-S01-02, UC-S01-03, UC-S01-06 | UAT-02 | Phase 1 | Chưa chạy |
| FR-04 | Must | F04 | UC-S02-02 | UAT-03 | Phase 1 | Chưa chạy |
| FR-05 | Must | F04 | UC-S02-02 | UAT-03 | Phase 1 | Chưa chạy |
| FR-06 | Must | F06 | UC-S03-02, UC-S03-03 | UAT-03 | Phase 1 | Chưa chạy |
| FR-07 | Must | F05 | UC-S03-01 | UAT-03 | Phase 1 | Chưa chạy |
| FR-09 | Must | F08 | UC-S02-03 | UAT-03, UAT-05 | Phase 1 | Chưa chạy |
| FR-03 | Must | F03 | UC-S02-01 | UAT-04 | Phase 1 | Chưa chạy |
| FR-02 | Must | F13 | UC-S05-03, UC-S05-05, UC-S05-06, UC-S05-08 | UAT-06 | Phase 1 | Chưa chạy |
| FR-10 | Should | F09 | *(chạy nền)* | UAT-07 | Phase 2 | Chưa chạy |
| FR-08 | Should | F07 | UC-S03-04 | UAT-08 | Phase 2 | Chưa chạy |
| FR-11 | Should | F10 | UC-S04-02, UC-S04-03 | UAT-09 | Phase 2 | Chưa chạy |
| FR-12 | Should | F11 | UC-S05-01 | UAT-10 | Phase 2 | Chưa chạy |
| FR-14 *(CR-01)* | Should | F14 | UC-S02-04 | UAT-11 | Phase 2 | Chưa chạy |
| BR-01 | Must | F03, F04, F05, F07, F12 | — | UAT-01, UAT-03, UAT-04, UAT-08 | Phase 1 | Chưa chạy |
| BR-02 | Must | F04, F06 | UC-S02-02 | UAT-03 | Phase 1 | Chưa chạy |
| BR-03 | Must | F01, F02, F10, F11, F12, F13 | — | UAT-01, UAT-02, UAT-06, UAT-09, UAT-10 | Phase 1 | Chưa chạy |
| BR-04 | Should | F03 | UC-S02-01 | UAT-04 | Phase 1 | Chưa chạy |
| BR-05 | Should | F08, F09 | UC-S02-03 | UAT-05, UAT-07 | Phase 1–2 | Chưa chạy |

**Kiểm độ phủ:**
- **FR Must chưa có UAT:** *không* — cả 9 FR Must (FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-09, FR-13) đều có ≥ 1 kịch bản UAT.
- **UAT chưa trace ngược yêu cầu:** *không* — cả **11** kịch bản (UAT-01 … UAT-11) đều trace về ≥ 1 FR/BR.
- **BR chưa nghiệm thu:** *không* — BR-01 … BR-05 đều có kịch bản.
- **Ghi chú:** ~~UC per màn của S03/S04/S05 chưa có~~ → **đã bổ sung 2026-08-04**: cả ba màn đã đặc tả đủ 9/9, mọi dòng trong ma trận trên nay trace tới mã `UC` thật (`GĐ-01` đóng). `NFR` then chốt (NFR-01/02/03/06) nghiệm thu qua mục 4.1 và lồng trong UAT-02 (NFR-03) và UAT-06 (NFR-06).

---

## 4. Checklist ký nghiệm thu

### 4.1. Tiêu chí ra mắt (Definition of Done / Release readiness — đo được)

| # | Tiêu chí | Cách kiểm | Đạt? |
|---|----------|-----------|------|
| 1 | Mọi FR ưu tiên **Must** của phase có ≥ 1 UAT trạng thái `Đạt` (FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-09, FR-13) | Đối chiếu mục 3 | ☐ |
| 2 | Không còn lỗi nghiêm trọng (Critical/High) đang mở trên các luồng thuộc phase | Sổ lỗi / bug tracker | ☐ |
| 3 | Cô lập dữ liệu tổ chức: UAT-06 `Đạt` — không có data bleed giữa tenant (NFR-06, BR-03) | Kết quả UAT-06 | ☐ |
| 4 | Bảo mật đăng nhập: khoá tài khoản sau 5 lần sai/15 phút hoạt động đúng (NFR-03); mật khẩu lưu bcrypt cost ≥ 12, JWT RS256, HTTPS bắt buộc (NFR-02) | Kết quả UAT-02 + rà cấu hình bảo mật | ☐ |
| 5 | Hiệu năng: thời gian phản hồi API ≤ 2 giây ở p95 với 200 người dùng đồng thời (NFR-01) | Kết quả đo hiệu năng/tải | ☐ |
| 6 | Tính khả dụng luồng chính: tạo & giao việc hoàn tất trong ≤ 3 bước từ Dashboard (NFR-05) | Kết quả UAT-03 | ☐ |
| 7 | Không còn "công việc mồ côi" — 100% công việc có người thực hiện + deadline (BR-02) | Rà dữ liệu + kết quả UAT-03 | ☐ |
| 8 | Tài liệu hướng dẫn người dùng (video + tài liệu) sẵn sàng trước ra mắt (TR-01) | Kiểm tài liệu bàn giao | ☐ |
| 9 | Tương thích trình duyệt: chạy đúng trên Chrome ≥ 110, Firefox ≥ 110, Safari ≥ 16, Edge ≥ 110 (NFR-07) | Kiểm chéo trình duyệt | ☐ |

### 4.2. Vai trò ký nghiệm thu

| Vai trò | Họ tên | Ngày | Kết luận (Chấp nhận / Chấp nhận có điều kiện / Từ chối) | Ghi chú/điều kiện |
|---------|--------|------|--------------------------------------------------------|-------------------|
| Product Owner (PO) | | | | |
| Business Analyst (BA) | | | | |
| Đại diện khách hàng/người dùng | | | | |
| QA Lead | | | | |

---

## Giả định

| Mã | Nội dung giả định | Vì sao cần (chỗ thiếu) | Ảnh hưởng nếu sai | Trạng thái |
|----|-------------------|------------------------|-------------------|------------|
| GĐ-01 | ~~Các màn S03/S04/S05 chưa có tài liệu UC/US per màn; kịch bản UAT chạm các màn này trace tạm tới FR/BR~~ → **ĐÃ GIẢI (2026-08-04):** cả ba màn đã đặc tả đủ 9/9; ma trận §3 và các ô **Trace UC** đã nối tới mã `UC` thật | — | — | ✅ Đã giải |
| GĐ-02 | Ngưỡng nghiệm thu hiệu năng dùng NFR-01 (≤ 2s ở p95 với 200 người đồng thời) làm điều kiện ra mắt | Chưa có bài đo/ngưỡng UAT hiệu năng chốt riêng | Sai ngưỡng nghiệm thu hiệu năng | 🔓 Chấp nhận rủi ro |
| GĐ-03 | Vai trò ký gồm PO, BA, đại diện khách hàng/người dùng, QA Lead; tên người cụ thể điền khi chạy UAT | Chưa có danh sách người ký thực tế | Thiếu chữ ký hợp lệ khi nghiệm thu | 🔓 Chấp nhận rủi ro |
| GĐ-04 | Môi trường UAT là staging riêng, seed sẵn 2 tổ chức (`Cong ty ABC`, `Cong ty XYZ`) + tài khoản 3 vai trò; email nhắc deadline dùng hộp thư test | Chưa có mô tả môi trường/dữ liệu UAT chính thức | Kịch bản không chạy được nếu dữ liệu/môi trường khác | 🔓 Chấp nhận rủi ro |
| GĐ-05 | FR-02 (quản trị thành viên) xếp Phase 1 (**Must**): đã **tách chức năng F13 Quản trị thành viên** (Must, Phase 1, trace FR-02) khỏi F11 Quản lý thông tin tổ chức (Should, Phase 2, trace FR-12) — **hết mâu thuẫn ưu tiên** | (đã giải quyết bằng tách F13) | — | ✅ Đã sửa |

> **🔓 Quyết định chấp nhận rủi ro — 2026-08-04, SH-06 (BA/PM) — chủ sở hữu dự án mẫu.**
> *Vì sao chưa xác nhận được:* Ngưỡng nghiệm thu, danh sách người ký và môi trường UAT chỉ chốt được khi có khách hàng thật và lịch nghiệm thu thật.
> *Điều kiện rà lại:* lên lịch buổi UAT đầu tiên — lúc đó phải chốt người ký (`GĐ-03`) và môi trường/dữ liệu (`GĐ-04`) trước khi chạy kịch bản nào — khi điều đó xảy ra, các dòng dưới quay lại `⚠️ chưa xác nhận` và phải rà theo vòng "Xác nhận giả định" (`conventions.md`).


---

## Thuật ngữ

| Thuật ngữ | Giải thích |
|-----------|-----------|
| UAT (User Acceptance Testing) | Nghiệm thu người dùng — người dùng/PO xác nhận hệ thống đáp ứng nghiệp vụ trước khi ra mắt |
| GWT (Given-When-Then) | Cấu trúc mô tả tiêu chí chấp nhận: bối cảnh — hành động — kết quả mong đợi |
| RTM (Requirements Traceability Matrix) | Ma trận truy vết yêu cầu ↔ use case ↔ UAT, chứng minh độ phủ hai chiều |
| DoD (Definition of Done) | Bộ tiêu chí đo được xác định "được coi là hoàn thành / được ra mắt" |
| MoSCoW | Cách xếp ưu tiên: Must / Should / Could / Won't |
| FR / BR / StR | Yêu cầu chức năng / Yêu cầu nghiệp vụ / Yêu cầu bên liên quan |
| NFR (Non-functional Requirement) | Yêu cầu phi chức năng — hiệu năng, bảo mật, khả dụng… |
| Tenant | Một tổ chức (không gian dữ liệu riêng); "data bleed" = rò rỉ dữ liệu giữa các tổ chức |
| Phase | Đợt phát hành (Phase 1 = MVP Must, Phase 2 = Should) — ghép với `08-roadmap.md` qua `ba-accept release` |

> Từ điển đầy đủ toàn dự án: `docs/00-glossary.md`.
