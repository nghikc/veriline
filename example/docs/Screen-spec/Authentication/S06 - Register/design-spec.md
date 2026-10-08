# Design Spec — Đăng ký (Mã màn: S06)

> Mô tả layout bằng chữ (không vẽ ASCII), không quy định mã màu/font cụ thể.

## Bản Figma (preview)
Dựng qua MCP `figma-mcp-go` trong file Figma đang mở (Page 1) — ngày 2026-06-11.

| State | Frame | Node |
|---|---|---|
| Default (rỗng) | `Đăng ký (Register) — Default` | `54:2` |
| Typing + thanh độ mạnh | `Đăng ký (Register) — Typing + Strength` | `55:31` |
| Error (email trùng + MK không khớp) | `Đăng ký (Register) — Error` | `55:64` |
| Loading (submit, form disabled) | `Đăng ký (Register) — Loading` | `55:95` |

- **Palette mặc định** (chưa có `07-design-system.md`): brand indigo `#4F46E5`, nền `#EEF2F7`, viền input `#D1D5DB`, lỗi `#DC2626`, độ mạnh "Trung bình" `#F59E0B`.
- Muốn URL share: copy link trong Figma (figma-mcp-go không trả file key).

## 1. Tổng quan UX

- **Mục tiêu UX:** Giúp người dùng mới hoàn thành đăng ký nhanh nhất có thể — dưới 2 phút — và cảm thấy tự tin về bảo mật mật khẩu nhờ phản hồi trực quan. Màn hình phải nhẹ nhàng, không gây choáng ngợp dù có nhiều trường hơn Login.
- **Thiết bị mục tiêu:** Web desktop (ưu tiên), responsive mobile (1 cột, cuộn dọc).
- **User flow tóm tắt:** [S01: Đăng nhập] ← link → [S06: Đăng ký] → (đăng ký thành công) → [Dashboard]

## 2. Cấu trúc layout (anatomy)

- **Header:** Không có navigation header. Chỉ hiển thị logo ứng dụng và tagline ngắn ở trên cùng, căn giữa — nhất quán với màn Đăng nhập để tạo sự liên tục về thương hiệu.
- **Body / nội dung chính:** Card form đơn giản căn giữa trang (cả ngang lẫn dọc), chiều rộng tối đa gợi ý 440px trên desktop (rộng hơn Login một chút để chứa thoải mái 4 trường). Bên trong card: tiêu đề "Tạo tài khoản mới", trường Email, trường Mật khẩu (với icon toggle và thanh đo độ mạnh bên dưới), trường Xác nhận mật khẩu (với icon toggle), trường Tên tổ chức, nút CTA Primary toàn chiều rộng card, link "Đã có tài khoản? Đăng nhập" căn giữa phía dưới nút.
- **Footer:** Dòng thông tin phiên bản nhỏ ở đáy trang, căn giữa — nhất quán với màn Đăng nhập.

## 3. Component & dữ liệu

| Component | Loại | Mô tả / Logic | Ràng buộc (validation) | Trace |
|-----------|------|---------------|------------------------|-------|
| Trường Email | Input text/email | Nhận địa chỉ email; label "Email *" nằm trên trường | Định dạng email hợp lệ; bắt buộc; trim tự động; validate khi blur | R-S06-01, R-S06-02 |
| Thông báo lỗi inline — Email | Inline error text | Hiển thị ngay dưới trường Email khi có lỗi định dạng hoặc email trùng | Chỉ hiển thị khi có lỗi; ẩn khi hợp lệ | R-S06-02, R-S06-07 |
| Trường Mật khẩu | Input password | Nhận mật khẩu; ẩn ký tự mặc định; icon mắt ở góc phải | 8–128 ký tự; phải có ≥1 chữ cái và ≥1 chữ số; bắt buộc | R-S06-01, R-S06-N02 |
| Thanh đo độ mạnh mật khẩu | Progress indicator | Nằm ngay dưới trường Mật khẩu; 3 mức: Yếu / Trung bình / Mạnh; màu sắc tương ứng; nhãn chữ bên phải thanh | Chỉ hiển thị khi trường Mật khẩu không rỗng; cập nhật theo thời gian thực | R-S06-03, R-S06-N02 |
| Thông báo lỗi inline — Mật khẩu | Inline error text | Hiển thị ngay dưới thanh độ mạnh khi mật khẩu không đạt yêu cầu tối thiểu | Chỉ hiển thị sau khi blur; ẩn khi hợp lệ | R-S06-N02 |
| Icon toggle mật khẩu | Icon button | Nằm trong trường Mật khẩu ở góc phải; chuyển type=password ↔ type=text | Không có ràng buộc nhập liệu | R-S06-10 |
| Trường Xác nhận mật khẩu | Input password | Nhập lại mật khẩu để xác nhận; ẩn ký tự mặc định; icon mắt riêng | Phải khớp với trường Mật khẩu; bắt buộc | R-S06-01, R-S06-04 |
| Icon toggle xác nhận mật khẩu | Icon button | Nằm trong trường Xác nhận mật khẩu ở góc phải; độc lập với toggle Mật khẩu | Không có ràng buộc nhập liệu | R-S06-10 |
| Thông báo lỗi inline — Xác nhận | Inline error text | Hiển thị ngay dưới trường Xác nhận mật khẩu khi không khớp | Chỉ hiển thị sau blur; ẩn khi 2 trường khớp | R-S06-04 |
| Trường Tên tổ chức | Input text | Nhận tên tổ chức mới; label "Tên tổ chức *"; helper text "Tên này hiển thị với tất cả thành viên" | Bắt buộc; 1–100 ký tự; trim tự động | R-S06-01, R-S06-05 |
| Thông báo lỗi inline — Tên tổ chức | Inline error text | Hiển thị ngay dưới trường khi để trống | Chỉ hiển thị sau blur/submit; ẩn khi hợp lệ | R-S06-05 |
| Nút Tạo tài khoản | Primary CTA | Toàn chiều rộng card; submit form | Disable khi còn lỗi validation hoặc đang gọi API | R-S06-06 |
| Link Đăng nhập | Text link | "Đã có tài khoản? Đăng nhập" — căn giữa dưới nút | Điều hướng về /login | R-S06-01 |

## 4. Trạng thái giao diện (UI States)

- **⚪ Empty (rỗng/idle):** Tất cả trường trống, thanh đo độ mạnh ẩn, không có thông báo lỗi nào, nút "Tạo tài khoản" active. Đây là trạng thái mặc định khi lần đầu vào trang.
- **✏️ Nhập liệu (typing):** Thanh độ mạnh xuất hiện ngay khi gõ ký tự đầu tiên vào trường Mật khẩu và cập nhật theo thời gian thực. Lỗi inline chỉ xuất hiện sau khi blur khỏi trường (không cảnh báo sớm khi đang gõ).
- **🔄 Loading:** Sau khi nhấn Submit — nút chuyển sang trạng thái loading (spinner + "Đang tạo tài khoản..."); tất cả 4 trường input bị disabled để tránh chỉnh sửa giữa chừng.
- **🔴 Error — email trùng:** Lỗi inline xuất hiện ngay dưới trường Email; trường Email có viền đỏ; focus tự động về trường Email; các trường còn lại giữ nguyên và active.
- **🔴 Error — mật khẩu yếu:** Thanh độ mạnh hiển thị mức "Yếu" với màu cảnh báo; lỗi inline dưới trường Mật khẩu; nút Tạo tài khoản bị disable.
- **🔴 Error — mật khẩu không khớp:** Lỗi inline dưới trường Xác nhận mật khẩu; trường Xác nhận có viền đỏ; nút Tạo tài khoản bị disable.
- **🔴 Error — tên tổ chức trống:** Lỗi inline dưới trường Tên tổ chức; trường có viền đỏ.
- **🔴 Error — mạng:** Snackbar nổi ở đáy màn hình "Lỗi kết nối. Vui lòng thử lại."; form được enable lại; dữ liệu đã nhập giữ nguyên.
- **🟢 Success:** Không có toast/modal; chuyển hướng im lặng về Dashboard. Người dùng thấy Dashboard ngay với tên tổ chức và vai trò Org Admin.

## 5. CTA & Copywriting (microcopy)

- **CTA Primary:** `Tạo tài khoản`
- **CTA trạng thái loading:** `Đang tạo tài khoản...` *(với spinner icon)*
- **Title card:** `Tạo tài khoản mới`
- **Label Email:** `Email`
- **Label Mật khẩu:** `Mật khẩu`
- **Label Xác nhận mật khẩu:** `Xác nhận mật khẩu`
- **Label Tên tổ chức:** `Tên tổ chức`
- **Helper text Tên tổ chức:** `Tên này hiển thị với tất cả thành viên trong tổ chức của bạn`
- **Placeholder Email:** `ten@cty.vn`
- **Placeholder Tên tổ chức:** `Công ty TNHH ABC`
- **Aria-label icon toggle Mật khẩu:** `Hiện mật khẩu` / `Ẩn mật khẩu` *(đổi theo trạng thái)*
- **Aria-label icon toggle Xác nhận:** `Hiện xác nhận mật khẩu` / `Ẩn xác nhận mật khẩu`
- **Nhãn thanh độ mạnh — Yếu:** `Yếu`
- **Nhãn thanh độ mạnh — Trung bình:** `Trung bình`
- **Nhãn thanh độ mạnh — Mạnh:** `Mạnh`
- **Wording lỗi định dạng email:** `Vui lòng nhập địa chỉ email hợp lệ.`
- **Wording email đã tồn tại:** `Email đã được sử dụng. Vui lòng dùng địa chỉ khác hoặc đăng nhập.`
- **Wording mật khẩu yếu:** `Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái và chữ số.`
- **Wording mật khẩu không khớp:** `Mật khẩu xác nhận không khớp.`
- **Wording tên tổ chức trống:** `Tên tổ chức không được để trống.`
- **Wording tên tổ chức quá dài:** `Tên tổ chức không được vượt quá 100 ký tự.`
- **Wording lỗi mạng:** `Lỗi kết nối. Vui lòng thử lại.`
- **Link điều hướng:** `Đã có tài khoản? Đăng nhập`

## 6. Edge case (xử lý UX)

- **Mất mạng khi nhấn "Tạo tài khoản"** → Snackbar "Lỗi kết nối." xuất hiện ở đáy; form không reset; nút được enable lại sau 500ms.
- **Email có khoảng trắng đầu/cuối** → Tự động trim trước khi validate và gửi API; không báo lỗi.
- **Tên tổ chức có khoảng trắng đầu/cuối** → Tự động trim trước khi gửi API.
- **Người dùng paste mật khẩu** → Cho phép paste vào cả 2 trường mật khẩu; thanh độ mạnh cập nhật ngay sau khi paste; không chặn paste.
- **Người dùng truy cập /register khi đã đăng nhập** → Redirect ngay về /dashboard; form không render.
- **Người dùng nhấn Enter trong trường Tên tổ chức** → Submit form ngay (tương đương nhấn nút Tạo tài khoản); không cần tab sang nút.
- **Màn hình nhỏ (mobile < 375px)** → Card không có border-radius/shadow; chiếm toàn bộ viewport width với padding nhỏ; cuộn dọc tự nhiên; logo thu nhỏ.
- **Tên tổ chức nhập 100 ký tự** → Không block; hiển thị bộ đếm ký tự còn lại `0/100` khi đạt giới hạn (tuỳ chọn).
- **Mật khẩu đạt mức "Trung bình" rồi bị xoá về trống** → Thanh độ mạnh ẩn đi; nút Tạo tài khoản disable lại.

## 7. Animation & chuyển cảnh (BẮT BUỘC)

> Duration/easing lấy từ Motion token `07-design-system.md`; enter = `ease-out`, exit = `ease-in`; tôn trọng `prefers-reduced-motion` (giảm còn fade hoặc tắt).

**Chuyển màn (page transition) — vào/ra khi điều hướng:**

| Hướng | Màn lân cận | Hiệu ứng | Thời lượng · easing |
|-------|-------------|----------|---------------------|
| Vào (enter) | ← [S01: Login] qua link "Đăng ký" | Card fade-in + nhích lên 8px | 200ms · ease-out |
| Vào (enter) | ← [URL trực tiếp `/register`] | Card fade-in (không dịch chuyển) | 150ms · ease-out |
| Ra (exit) | → [S02: Dashboard] sau khi tạo tài khoản thành công | Toàn trang fade-out nhanh — **không giật** | 100ms · ease-in |
| Ra (exit) | → [S01: Login] qua link "Đã có tài khoản" | Card fade-out (giữ nền) | 100ms · ease-in |

**Chuyển section nội màn (in/out) — lỗi/thanh độ mạnh/loading:**

| Thành phần | Sự kiện | Hiệu ứng IN | Hiệu ứng OUT | Thời lượng · easing |
|-----------|---------|-------------|--------------|---------------------|
| Thông báo lỗi inline | validation trượt / email đã tồn tại | fade-in nhẹ — **không nảy, không slide** | fade-out | 150ms · ease-out/in |
| Thanh đo độ mạnh mật khẩu | gõ từng ký tự | đổi màu + độ dài mượt, **không nhảy đột ngột** | — | 200ms · ease |
| Nhãn mức độ mạnh (Yếu/Trung bình/Mạnh) | đổi mức | crossfade chữ | crossfade ngược | 150ms · ease |
| Nút "Tạo tài khoản" (loading) | submit → phản hồi | crossfade nhãn ↔ spinner | crossfade ngược | 150ms · ease |
| Snackbar lỗi mạng | mất mạng khi submit | slide-up + fade từ đáy | fade-out | 250ms · ease |

## 8. Ghi chú cho Designer

- **Accessibility:**
  - Tất cả trường có `<label>` liên kết bằng `for/id` — không chỉ placeholder.
  - Thông báo lỗi inline dùng `role="alert"` hoặc `aria-live="polite"` để screen reader đọc khi xuất hiện.
  - Thanh đo độ mạnh cần có `aria-label` mô tả mức độ bằng chữ (ví dụ "Độ mạnh mật khẩu: Trung bình") — không chỉ dựa vào màu sắc.
  - Độ tương phản text/nền tối thiểu 4.5:1 (WCAG AA).
  - Kích cỡ target nút "Tạo tài khoản" ≥ 44×44px trên mobile.
  - Đường viền focus visible rõ ràng trên tất cả element tương tác.
  - Thứ tự focus Tab phải đúng: Email → Mật khẩu → Xác nhận → Tên tổ chức → Nút CTA → Link Đăng nhập.
- **Visual hierarchy:** Thanh độ mạnh không nên cạnh tranh về độ nổi bật với label và trường input — cỡ nhỏ hơn, đặt sát dưới trường Mật khẩu, tách biệt với thông báo lỗi.
- **Màu thanh độ mạnh:** Dùng hệ màu ngữ nghĩa — tông đỏ/cam cho "Yếu", vàng/xanh nhạt cho "Trung bình", xanh lá cho "Mạnh" — không hardcode hex cụ thể.
