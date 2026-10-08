# Design Spec — Đăng nhập (Mã màn: S01)

> Mô tả layout bằng chữ (không vẽ ASCII), không quy định mã màu/font cụ thể.

## 1. Tổng quan UX

- **Mục tiêu UX:** Tạo cảm giác an toàn và tin tưởng; tốc độ hoàn thành form trong 30 giây cho người dùng lần đầu; không có yếu tố gây phân tâm — đây là cửa vào duy nhất.
- **Thiết bị mục tiêu:** Web desktop (ưu tiên), responsive mobile (1 cột).
- **User flow tóm tắt:** [URL bất kỳ / Redirect từ protected route] → [S01: Đăng nhập] → [S02: Dashboard]

## 2. Cấu trúc layout (anatomy)

- **Header:** Không có navigation header; chỉ hiển thị logo ứng dụng và tagline ngắn ở trên cùng, căn giữa — tạo nhận diện thương hiệu mà không làm phức tạp giao diện.
- **Body / nội dung chính:** Card form đơn giản căn giữa trang (cả ngang lẫn dọc), chiều rộng tối đa gợi ý 420px trên desktop. Bên trong card: tiêu đề "Đăng nhập vào tài khoản", trường Email, trường Mật khẩu (với icon toggle ẩn/hiện ở góc phải trường), thông báo lỗi inline (chỉ xuất hiện khi có lỗi), nút CTA Primary toàn chiều rộng card.
- **Footer:** Dòng thông tin phiên bản nhỏ ở đáy trang, căn giữa — không ảnh hưởng đến flow.

## 3. Component & dữ liệu

| Component | Loại | Mô tả / Logic | Ràng buộc (validation) | Trace |
|-----------|------|---------------|------------------------|-------|
| Trường Email | Input text | Nhận địa chỉ email của người dùng; label "Email *" nằm trên trường | Định dạng email hợp lệ; bắt buộc; trim tự động; validate khi blur | R-S01-01, R-S01-02 |
| Trường Mật khẩu | Input password | Nhận mật khẩu; ẩn ký tự mặc định | 8–128 ký tự; bắt buộc; xoá nội dung sau lỗi xác thực | R-S01-01, R-S01-05 |
| Icon toggle mật khẩu | Icon button | Chuyển type=password ↔ type=text; đặt trong trường mật khẩu ở góc phải | Không có ràng buộc nhập liệu | R-S01-10 |
| Thông báo lỗi inline | Alert/Banner | Hiển thị trong card, bên dưới trường Mật khẩu; ẩn ở trạng thái idle/success | Không chỉnh sửa được; chỉ hiển thị khi có lỗi | R-S01-05, R-S01-06, R-S01-07 |
| Đồng hồ đếm ngược | Countdown | Hiển thị "X phút Y giây" trong thông báo khoá tạm; cập nhật mỗi giây | Chỉ hiển thị khi TEMP_LOCKED; ẩn khi đã hết hạn | R-S01-06 |
| Nút Đăng nhập | Primary CTA | Toàn chiều rộng card; submit form; disable khi loading hoặc khoá | Disable khi TEMP_LOCKED / PERM_LOCKED / đang gọi API | R-S01-03 |

## 4. Trạng thái giao diện (UI States)

- **⚪ Empty (rỗng/idle):** Form trắng, tất cả trường trống, nút Đăng nhập active, không có thông báo lỗi. Đây là trạng thái mặc định khi lần đầu vào trang.
- **🔄 Loading:** Sau khi nhấn Submit — nút chuyển sang trạng thái loading (nội dung nút đổi thành spinner + văn bản "Đang đăng nhập..."); cả 2 trường input bị disabled để tránh chỉnh sửa; không có skeleton (form vẫn hiển thị).
- **🔴 Error — sai thông tin:** Card hiển thị thông báo lỗi inline màu cảnh báo, wording đầy đủ với số lần còn lại; trường Mật khẩu xoá nội dung; focus tự động về Mật khẩu.
- **🔴 Error — khoá tạm:** Card hiển thị thông báo khoá + đồng hồ đếm ngược; nút Đăng nhập disabled với màu trạng thái khác (không phải màu loading); đồng hồ tự kích hoạt khi hết thời gian khoá.
- **🔴 Error — khoá vĩnh viễn:** Card hiển thị thông báo khoá vĩnh viễn cố định; nút Đăng nhập disabled và không có đồng hồ; người dùng không thể tương tác với form.
- **🔴 Error — mạng:** Snackbar nổi (không trong card) "Lỗi kết nối. Vui lòng thử lại." xuất hiện ở đáy màn hình; form được enable lại để người dùng thử lại.
- **🟠 Buộc đổi mật khẩu *(CR-02)*:** API trả `phai_doi_mat_khau = true` → **KHÔNG vào Dashboard**. Chuyển thẳng sang màn đổi mật khẩu `S04`, kèm banner giải thích vì sao. Mọi lối điều hướng khác bị chặn cho tới khi đổi xong (`R-S01-11`, `E-S01-11`, `BRule-S01-07`).
- **🔴 Error — vượt hạn mức:** Request thứ 21 trong một phút từ cùng IP nhận `429` (`E-S01-09`). ⚠️ `srs` **chưa đặc tả** người dùng nhìn thấy gì — cần bổ sung `E-S01-09` trước khi thiết kế state này; đừng tự đặt wording/đồng hồ đếm ngược.
- **🟢 Success:** Không có toast/modal; chuyển hướng im lặng về Dashboard — **trừ khi** `phai_doi_mat_khau = true`, xem trạng thái 🟠 ở trên.

## 5. CTA & Copywriting (microcopy)

- **CTA Primary:** `Đăng nhập`
- **CTA trạng thái loading:** `Đang đăng nhập...` *(với spinner icon)*
- **Title card:** `Đăng nhập vào tài khoản`
- **Label Email:** `Email`
- **Label Mật khẩu:** `Mật khẩu`
- **Placeholder Email:** `ten@cty.vn`
- **Placeholder Mật khẩu:** *(trống — không dùng placeholder cho trường bảo mật)*
- **Aria-label icon toggle:** `Hiện mật khẩu` / `Ẩn mật khẩu` *(đổi theo trạng thái)*
- **Wording lỗi định dạng email:** `Vui lòng nhập địa chỉ email hợp lệ.`
- **Wording sai thông tin (còn X lần):** `Sai email hoặc mật khẩu. Còn [X] lần thử.`
- **Wording khoá tạm:** `Tài khoản đang bị khoá. Vui lòng thử lại sau [X] phút [Y] giây.`
- **Wording khoá vĩnh viễn:** `Tài khoản của bạn bị khoá vĩnh viễn. Liên hệ quản trị viên để được hỗ trợ.`
- **Wording lỗi mạng:** `Lỗi kết nối. Vui lòng thử lại.`
- **Wording session hết hạn:** `Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.` — nguồn: `E-S01-12` (`srs.md`) *(CR-04)*
- **Wording buộc đổi mật khẩu *(CR-02)*:** `Mật khẩu hiện tại do quản trị viên cấp. Vui lòng đổi mật khẩu trước khi tiếp tục.` — nguồn: `R-S01-11`
- **Wording vượt hạn mức *(429)*:** ⚠️ **chưa có** — `srs` `E-S01-09` mới chỉ quy định mã HTTP, chưa quy định câu chữ người dùng thấy. Cần bổ sung ở `srs` trước — nguồn: `E-S01-09`

## 6. Edge case (xử lý UX)

- **Mất mạng khi nhấn Đăng nhập** → Snackbar "Lỗi kết nối." xuất hiện ở đáy; form không reset; nút được enable lại sau 500ms.
- **Người dùng nhấn phím Enter trong trường Mật khẩu** → Submit form ngay (tương đương nhấn nút Đăng nhập); không cần tab sang nút.
- **Màn hình nhỏ (mobile < 375px)** → Card không có border-radius / shadow; chiếm toàn bộ viewport width với padding nhỏ; logo thu nhỏ.
- **Người dùng paste mật khẩu** → Cho phép paste vào trường mật khẩu (không chặn); nội dung ẩn theo type=password.
- **URL gốc trước redirect bị mất (session storage xoá)** → Fallback về /dashboard.
- **Email có khoảng trắng đầu/cuối** → Tự động trim trước khi gửi API; không báo lỗi.

## 7. Animation & chuyển cảnh (BẮT BUỘC)

> Duration/easing lấy từ Motion token `07-design-system.md`; enter = `ease-out`, exit = `ease-in`; tôn trọng `prefers-reduced-motion` (giảm còn fade hoặc tắt).

**Chuyển màn (page transition) — vào/ra khi điều hướng:**

| Hướng | Màn lân cận | Hiệu ứng | Thời lượng · easing |
|-------|-------------|----------|---------------------|
| Vào (enter) | ← [URL bất kỳ / redirect từ protected route] | Card fade-in + nhích lên 8px | 200ms · ease-out |
| Ra (exit) | → [S02: Dashboard] | Toàn trang fade-out (không giật) | 100ms · ease-in |

**Chuyển section nội màn (in/out) — alert/snackbar/loading:**

| Thành phần | Sự kiện | Hiệu ứng IN | Hiệu ứng OUT | Thời lượng · easing |
|-----------|---------|-------------|--------------|---------------------|
| Thông báo lỗi inline | hiện khi sai/validation | fade-in (không nảy, không slide) | fade-out | 150ms · ease-out/in |
| Banner khoá + đồng hồ | vào TEMP_LOCKED / hết khoá | fade-in | fade-out khi hết hạn | 150ms · ease-out/in |
| Snackbar lỗi mạng | mất mạng khi submit | slide-up + fade từ đáy | fade-out | 250ms · ease |
| Nút Đăng nhập (loading) | submit → phản hồi | crossfade nhãn ↔ spinner | crossfade ngược | 150ms · ease |
| Đồng hồ đếm ngược | mỗi giây | cập nhật mượt, không flicker | — | 1s · linear |

## 8. Ghi chú cho Designer

- **Accessibility:**
  - Tất cả trường có `<label>` liên kết bằng `for/id` — không chỉ placeholder.
  - Thông báo lỗi dùng `role="alert"` để screen reader đọc ngay khi xuất hiện.
  - Độ tương phản text/nền tối thiểu 4.5:1 (WCAG AA).
  - Kích cỡ target nút Đăng nhập ≥ 44×44px trên mobile.
  - Đường viền focus visible rõ ràng trên tất cả element tương tác.
- **Loading state:** Nút disabled không nên trông "mờ" như disabled thông thường — dùng trạng thái loading riêng để người dùng biết hệ thống đang xử lý, không phải lỗi.
