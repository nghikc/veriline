# Design Spec — Hồ sơ cá nhân (Mã màn: S04)

## 1. Tổng quan UX

- **Mục tiêu UX:** *rõ ràng và không gây lo lắng.* Đây là màn người dùng đụng tới danh tính và mật khẩu của chính mình — mọi thứ không sửa được phải **nói rõ vì sao**, và mọi hệ quả (đăng xuất thiết bị khác) phải được báo **trước khi** bấm, không phải sau.
- **Nguyên tắc dẫn đường:** hai nhóm việc có mức rủi ro khác nhau thì **tách hẳn ra**. Sửa tên là việc nhẹ; đổi mật khẩu là việc bảo mật. Hai khối, hai nút, không dùng chung.
- **Thiết bị mục tiêu:** Web desktop là chính; mobile phải dùng được đầy đủ (người dùng hay đổi mật khẩu gấp khi đang ở ngoài).
- **User flow tóm tắt:** [S02 Dashboard → menu avatar] → **[S04 Hồ sơ cá nhân]** → quay lại [S02 Dashboard].

## 2. Cấu trúc layout (anatomy)

- **Header:** giống toàn hệ thống; bên dưới là thanh chứa liên kết "← Quay lại Dashboard".
- **Body — ba khối xếp dọc, cách nhau rõ ràng:**
  - **Khối nhận diện** (trên cùng, chỉ đọc): ảnh đại diện lớn bên trái, bên phải là họ tên cỡ lớn, email, badge vai trò, tên tổ chức, ngày tham gia. Không có nút nào ở đây — đây là nơi để **xác nhận**, không phải để thao tác.
  - **Khối "Thông tin cá nhân"** (form 1): hai trường sửa được ở trên, ba dòng chỉ đọc ở dưới, cặp nút Huỷ / Lưu thay đổi căn phải ở chân khối.
  - **Khối "Đổi mật khẩu"** (form 2): ba trường mật khẩu xếp dọc, thanh đo độ mạnh nằm ngay dưới trường Mật khẩu mới, dòng cảnh báo thu hồi phiên nằm **ngay trên** nút, nút "Đổi mật khẩu" căn phải.
- **Footer:** không có footer riêng.

## 3. Component & dữ liệu

| Component | Loại | Mô tả / Logic | Ràng buộc (validation) | Trace |
|-----------|------|---------------|------------------------|-------|
| Liên kết quay lại | Text link + icon | Về Dashboard; chặn lại nếu còn thay đổi chưa lưu | — | R-S04-09 |
| Ảnh đại diện (khối nhận diện) | Avatar | Hiện ảnh từ đường dẫn; rỗng hoặc tải lỗi → chữ cái đầu họ tên trên nền màu sinh từ tên | — | R-S04-02 |
| Badge vai trò | Badge | Thành viên · Quản lý nhóm · Quản trị viên | Luôn kèm chữ, không chỉ dựa vào màu | R-S04-01 |
| Ô "Họ tên" | Input + đếm ký tự | Bộ đếm `n/100`, chuyển đỏ khi vượt | 1–100 ký tự, không toàn khoảng trắng | R-S04-03 |
| Ô "Ảnh đại diện" | Input (URL) | Kèm dòng gợi ý: dán đường dẫn công khai, bỏ trống để dùng chữ cái đầu | bắt đầu `https://`, ≤ 2048 ký tự, cho phép rỗng | R-S04-04 |
| Dòng Email / Vai trò / Tổ chức | Read-only row | Giá trị + biểu tượng khoá + **một câu giải thích** vì sao không sửa được | không nằm trong ô nhập nào | R-S04-05 |
| Nút "Lưu thay đổi" | Primary CTA | Chỉ bật khi có trường khác giá trị gốc | disable khi không có thay đổi hoặc còn lỗi | R-S04-06, R-S04-07 |
| Nút "Huỷ" | Secondary CTA | Khôi phục mọi trường về giá trị gốc | disable khi không có thay đổi | R-S04-06 |
| Ô "Mật khẩu hiện tại" | Password input + toggle | Lỗi sai mật khẩu hiện **ngay dưới trường này** | 8–128 ký tự | R-S04-14 |
| Ô "Mật khẩu mới" | Password input + toggle | Kèm thanh đo độ mạnh và dòng nhắc luật | 8–128 ký tự, ≥1 chữ + ≥1 số, khác mật khẩu hiện tại | R-S04-11, R-S04-13 |
| Ô "Xác nhận mật khẩu mới" | Password input + toggle | Kiểm khớp khi rời khỏi ô | trùng khớp Mật khẩu mới | R-S04-12 |
| Thanh đo độ mạnh | Meter | 3 mức Yếu / Trung bình / Mạnh — **cùng quy tắc và cùng nhãn với S06** | — | R-S04-11 |
| Toggle 👁 | Icon button | Mỗi trường một toggle độc lập | — | R-S04-17 |
| Cảnh báo thu hồi phiên | Inline notice | "Đổi mật khẩu sẽ đăng xuất bạn khỏi mọi thiết bị khác." | đặt **trên** nút, không phải dưới | R-S04-15 |
| Nút "Đổi mật khẩu" | Primary CTA | Riêng biệt với nút Lưu của form trên | disable khi còn lỗi hoặc thiếu trường | R-S04-10 |
| Hộp "Thay đổi chưa lưu" | Dialog | Hai lựa chọn Ở lại / Rời đi | chỉ hiện khi form 1 có thay đổi | R-S04-09 |

## 4. Trạng thái giao diện (UI States)

- ⚪ **Empty:** màn này **không có trạng thái rỗng thật sự** — hồ sơ luôn tồn tại. Chỗ duy nhất có thể trống là ảnh đại diện → thay bằng chữ cái đầu họ tên (một dạng "empty" có thẩm mỹ, không phải ô trống).
- 🔄 **Loading:** skeleton cho khối nhận diện và cả hai form khi tải lần đầu. Khi đang gửi: nút vừa nhấn chuyển spinner nội nút và bị khoá; các trường của **chính form đó** chuyển read-only, form còn lại vẫn dùng được bình thường.
- 🔴 **Error:**
  - Tải hồ sơ lỗi → khối lỗi giữa trang + nút "Thử lại"; header vẫn còn.
  - Lưu thông tin lỗi → thông báo trên form 1, **giữ nguyên mọi giá trị đã nhập**.
  - Sai mật khẩu hiện tại → lỗi **cục bộ ngay dưới trường đó**; hai trường mật khẩu mới **không bị xoá**.
  - Bị chặn do thử sai quá nhiều → thông báo rõ thời gian mở lại ("Thử lại sau {còn lại} phút."), nút disable trong thời gian đó.
  - Ảnh đại diện tải lỗi → rơi về chữ cái đầu, **không** hiện biểu tượng ảnh vỡ.
- 🟢 **Success:** lưu thông tin xong → toast "Đã cập nhật hồ sơ", khối nhận diện và tên trên header đổi theo với hiệu ứng nhấn một lần. Đổi mật khẩu xong → toast "Đã đổi mật khẩu", ba trường xoá trắng, thanh đo độ mạnh biến mất, nút trở lại disable.

## 5. CTA & Copywriting (microcopy)

- **CTA Primary:** `Lưu thay đổi` (form 1) · `Đổi mật khẩu` (form 2)
- **CTA Secondary:** `Huỷ`
- **Title khối:** `Thông tin cá nhân` · `Đổi mật khẩu`
- **Nhãn trường:** `Họ tên *` · `Ảnh đại diện (đường dẫn ảnh)` · `Mật khẩu hiện tại *` · `Mật khẩu mới *` · `Xác nhận mật khẩu mới *`
- **Helper text:**
  - Ảnh đại diện — `Dán đường dẫn ảnh công khai (https). Bỏ trống để dùng chữ cái đầu tên bạn.`
  - Mật khẩu mới — `Tối thiểu 8 ký tự, gồm ít nhất một chữ cái và một chữ số.`
- **Giải thích trường khoá:** Email — `không đổi được` · Vai trò — `do quản trị viên đặt` · Tổ chức — `không đổi được`
- **Cảnh báo thu hồi phiên:** `Đổi mật khẩu sẽ đăng xuất bạn khỏi mọi thiết bị khác.`
- **Wording lỗi:**
  - `Vui lòng nhập họ tên` · `Họ tên tối đa 100 ký tự`
  - `Đường dẫn ảnh phải bắt đầu bằng https://` · `Đường dẫn ảnh không hợp lệ`
  - `Vui lòng nhập mật khẩu hiện tại` · `Mật khẩu hiện tại không đúng.`
  - `Mật khẩu tối thiểu 8 ký tự gồm chữ và số` · `Mật khẩu mới phải khác mật khẩu hiện tại`
  - `Mật khẩu xác nhận không khớp.`
  - `Bạn đã thử sai quá nhiều lần. Thử lại sau {còn lại} phút.`
  - `Lỗi kết nối — thử lại`
- **Wording thành công:** `Đã cập nhật hồ sơ` · `Đã đổi mật khẩu`
- **Hộp thay đổi chưa lưu:** tiêu đề `Bạn có thay đổi chưa lưu` · nội dung `Rời khỏi trang này sẽ mất các thay đổi chưa được lưu.` · nút `Ở lại` / `Rời đi`

## 6. Edge case (xử lý UX)

- **Sai mật khẩu hiện tại:** đây là lỗi hay gặp nhất của màn — **tuyệt đối không** xoá trắng cả form. Chỉ báo lỗi tại đúng trường sai, giữ nguyên mật khẩu mới người dùng đã nghĩ ra và gõ.
- **Đổi tên xong nhưng header chưa đổi:** tên hiển thị phải cập nhật **đồng bộ ở mọi nơi** trong cùng một lượt (khối nhận diện, header, avatar) — không để hai chỗ hiển thị hai tên khác nhau.
- **Ảnh đại diện trỏ tới ảnh chết:** rơi về chữ cái đầu, im lặng, không báo lỗi ầm ĩ — người dùng có thể không biết ảnh đã chết và cũng không làm gì được.
- **Ảnh đại diện rất lớn hoặc tỉ lệ lạ:** cắt theo hình tròn từ tâm, không bóp méo.
- **Họ tên 100 ký tự:** lưu đủ; nơi hiển thị hẹp tự cắt kèm tooltip — không phải việc của màn này.
- **Nhấn kép nút Lưu:** khoá nút ngay sau lần nhấn đầu, tránh gọi API hai lần.
- **Đổi mật khẩu ở tab này trong khi tab khác cùng tài khoản đang mở:** tab kia sẽ nhận `401` ở lời gọi kế tiếp và tự chuyển về đăng nhập — chấp nhận được, đúng thiết kế (`BRule-S04-06`).
- **Bị chặn do thử sai 5 lần:** hiện rõ **thời gian còn lại**, không chỉ nói "thử lại sau" — người dùng cần biết chờ bao lâu.
- **Gõ dở mật khẩu rồi rời trang:** **không** cảnh báo (khác form thông tin) — mật khẩu gõ dở không đáng để giữ và cũng không nên giữ.
- **Trình duyệt tự điền mật khẩu:** phải hoạt động với trình quản lý mật khẩu (thuộc tính `autocomplete` đúng loại: `current-password` và `new-password`).

## 7. Animation & chuyển cảnh (BẮT BUỘC)

> Mọi giá trị lấy từ **Motion token** của `07-design-system.md` §10.1 — không đặt số riêng. Tôn trọng `prefers-reduced-motion`.

**Chuyển màn (page transition) — vào/ra khi điều hướng:**

| Hướng | Màn lân cận | Hiệu ứng | Thời lượng · easing |
|-------|-------------|----------|---------------------|
| Vào (enter) | ← [S02 Dashboard] (qua menu avatar) | `motion.page-enter` — fade-in + dịch lên 8px | 200ms · ease-out |
| Vào (enter) | ← mở URL `/profile` trực tiếp hoặc nút Back | `motion.page-enter.quick` — fade-in, không dịch chuyển | 150ms · ease-out |
| Ra (exit) | → [S02 Dashboard] | `motion.page-exit` — fade-out | 100ms · ease-in |

**Chuyển section nội màn (in/out):**

| Thành phần | Sự kiện | Hiệu ứng IN | Hiệu ứng OUT | Thời lượng · easing |
|-----------|---------|-------------|--------------|---------------------|
| Hộp "Thay đổi chưa lưu" | mở / đóng | `motion.modal-in` — fade + scale 0.98 → 1 | fade + scale xuống | 200ms · ease-out / ease-in |
| Skeleton → nội dung | tải xong | `motion.section-in` — fade-in | `motion.section-out` | 150ms · ease-out / ease-in |
| Lỗi inline dưới trường | xuất hiện / biến mất | `motion.section-in` | `motion.section-out` | 150ms · ease-out / ease-in |
| Thanh đo độ mạnh mật khẩu | hiện khi gõ ký tự đầu / biến mất khi xoá trắng | `motion.section-in` + chiều dài thanh chuyển mượt theo mức | `motion.section-out` | 150ms · ease-out / ease-in |
| Nút Lưu bật ↔ tắt | có / hết thay đổi | `motion.crossfade` đổi trạng thái tại chỗ, **không** dịch chuyển | `motion.crossfade` | 150ms · ease |
| Nhãn nút ↔ spinner | đang gửi | `motion.crossfade` | `motion.crossfade` | 150ms · ease |
| Toast xác nhận / lỗi | hiện / tắt | `motion.overlay-in` — trượt lên + fade từ đáy | fade-out | 250ms · ease |
| Ảnh đại diện đổi | lưu thành công | `motion.crossfade` giữa ảnh cũ và mới + `motion.highlight-once` | — | 150ms · ease, nhấn ~2s |
| Tên trên header đổi | lưu thành công | `motion.crossfade` | — | 150ms · ease |

**Luật riêng của màn:**
- Thanh đo độ mạnh đổi mức phải **chuyển mượt chiều dài và màu**, không nhảy giật từng nấc — người dùng đang gõ và nhìn nó liên tục.
- **Không** animation nào trên các trường mật khẩu khi báo lỗi ngoài fade — rung lắc ô nhập gây cảm giác hoảng, không giúp gì.
- `prefers-reduced-motion: reduce` → mọi dịch chuyển và scale rút về fade thuần; `motion.highlight-once` tắt hẳn.

## 8. Ghi chú cho Designer

- **Accessibility:**
  - Mọi ô nhập có `<label for/id>` liên kết thật, không chỉ placeholder.
  - Trường bắt buộc gắn `aria-required`; lỗi công bố qua `role="alert"` để trình đọc màn hình đọc ngay.
  - Thứ tự Tab: quay lại → Họ tên → Ảnh đại diện → Huỷ → Lưu thay đổi → Mật khẩu hiện tại → Mật khẩu mới → Xác nhận → Đổi mật khẩu.
  - Nút toggle 👁 phải có nhãn thay thế đổi theo trạng thái ("Hiện mật khẩu" / "Ẩn mật khẩu").
  - Thanh đo độ mạnh không được chỉ dùng màu — luôn kèm **nhãn chữ** (Yếu / Trung bình / Mạnh).
  - Hộp thoại: bẫy focus bên trong, Esc = "Ở lại", trả focus về phần tử đã mở nó.
  - Thuộc tính `autocomplete`: `current-password` cho trường hiện tại, `new-password` cho hai trường còn lại — để trình quản lý mật khẩu hoạt động đúng.
- **Ưu tiên thị giác:** khối nhận diện > form Thông tin cá nhân > form Đổi mật khẩu. Người vào màn này phần lớn chỉ để xem hoặc sửa tên; đổi mật khẩu là việc ít gặp hơn nên đặt dưới.
- **Đừng** gộp hai form vào một nút "Lưu" duy nhất — sẽ buộc người chỉ đổi tên phải nhập mật khẩu.
- **Đừng** để trường khoá 🔒 trông giống ô nhập bị disable — dùng kiểu hiển thị dòng văn bản, để không ai mất công click vào thử.
- Thanh đo độ mạnh và luật mật khẩu phải **giống hệt** màn S06 Đăng ký (cùng nhãn, cùng ngưỡng) — người dùng đã học một lần thì không phải học lại.
