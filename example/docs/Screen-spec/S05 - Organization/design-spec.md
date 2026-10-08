# Design Spec — Tổ chức (Mã màn: S05)

## 1. Tổng quan UX

- **Mục tiêu UX:** *quyền lực phải đi kèm sự rõ ràng.* Đây là màn duy nhất tạo được tài khoản và đổi được vai trò người khác — mọi hành động phải nói rõ **hệ quả** trước khi thực hiện, và mọi thứ người dùng **không được phép** làm phải biến mất, không phải bày ra rồi chặn.
- **Nguyên tắc dẫn đường:** màn phục vụ **hai vai trò với hai phạm vi khác nhau** trên cùng một trang. Ranh giới không nằm ở việc ẩn cả khối, mà ở **cụm hành động**: Team Lead thấy đủ thông tin nhưng không thấy nút thao tác nào ở khu Thành viên.
- **Thiết bị mục tiêu:** Web desktop là chính — quản trị nhân sự là việc làm trên máy tính. Mobile vẫn phải dùng được đầy đủ, bảng chuyển thành danh sách thẻ.
- **User flow tóm tắt:** [S02 Dashboard → menu avatar] → **[S05 Tổ chức]** → quay lại [S02 Dashboard]. Nhánh phụ: mời thành viên → bàn giao mật khẩu ngoài hệ thống → người mới vào [S01 Đăng nhập].

## 2. Cấu trúc layout (anatomy)

- **Header:** giống toàn hệ thống; mục "Tổ chức" trong menu avatar **chỉ hiện** với Team Lead và Org Admin. Bên dưới là thanh "← Quay lại Dashboard".
- **Body — hai khối xếp dọc:**
  - **Khối "Thông tin tổ chức"** (trên): logo lớn bên trái, bên phải là ô Tên tổ chức và ô Logo; dưới cùng là ba dòng chỉ đọc (slug, ngày tạo, tổng thành viên) và cặp nút Huỷ / Lưu thay đổi căn phải.
  - **Khối "Thành viên (n)"** (dưới): thanh công cụ trên cùng (ô tìm bên trái, hai bộ lọc ở giữa, nút "+ Mời thành viên" căn phải), rồi bảng danh sách, rồi nút "Tải thêm" kèm chỉ báo "Hiển thị x / n".
- **Bảng thành viên:** 5 cột dữ liệu + 1 cột hành động `[⋮]` ở cuối. Cột hành động **không render** với Team Lead — bảng khi đó có đúng 5 cột, không để cột trống.
- **Footer:** không có footer riêng.

## 3. Component & dữ liệu

| Component | Loại | Mô tả / Logic | Ràng buộc (validation) | Trace |
|-----------|------|---------------|------------------------|-------|
| Liên kết quay lại | Text link + icon | Về Dashboard | — | R-S05-01 |
| Logo tổ chức | Image | Rỗng hoặc tải lỗi → chữ cái đầu tên tổ chức trên nền màu | — | R-S05-03 |
| Ô "Tên tổ chức" | Input + đếm ký tự | Bộ đếm `n/100`, chuyển đỏ khi vượt | 1–100 ký tự, không toàn khoảng trắng | R-S05-02 |
| Ô "Logo" | Input (URL) | Kèm gợi ý: dán đường dẫn công khai | bắt đầu `https://`, ≤ 2048 ký tự, cho phép rỗng | R-S05-03 |
| Dòng slug / ngày tạo / tổng thành viên | Read-only row | Slug có biểu tượng khoá + chú thích "không đổi được" | không nằm trong ô nhập nào | R-S05-04 |
| Nút "Lưu thay đổi" / "Huỷ" | Primary / Secondary CTA | Chỉ bật khi có trường khác giá trị gốc | disable khi không có thay đổi hoặc còn lỗi | R-S05-05 |
| Ô tìm thành viên | Search input | Debounce 300ms; tìm theo cả tên và email | ≤ 100 ký tự | R-S05-08 |
| Bộ lọc Vai trò / Trạng thái | Dropdown | Kết hợp được với nhau và với ô tìm (giao điều kiện) | — | R-S05-08 |
| Nút "+ Mời thành viên" | Primary CTA | **Chỉ render với Org Admin** | — | R-S05-11, R-S05-12 |
| Bảng thành viên | Table / Card list | 5 cột; mobile chuyển thành thẻ | — | R-S05-07 |
| Badge vai trò | Badge | Thành viên · Quản lý nhóm · Quản trị viên | Luôn kèm chữ, không chỉ màu | R-S05-07 |
| Badge trạng thái | Badge | Hoạt động · Vô hiệu · Khoá tạm · Khoá vĩnh viễn | Luôn kèm chữ, không chỉ màu | R-S05-07 |
| Menu hành động `[⋮]` | Icon menu | **Chỉ render với Org Admin**; nội dung đổi theo trạng thái dòng | dòng INACTIVE → chỉ có "Kích hoạt lại"; dòng **Khoá vĩnh viễn** (`PERM_LOCKED`) → chỉ có "Mở khoá" | R-S05-11, R-S05-18, R-S05-21 |
| Mục menu bị khoá | Disabled menu item | Khi vi phạm `BRule-S05-05`: làm mờ **kèm câu giải thích ngay trong menu** | — | R-S05-19 |
| Nút "Tải thêm" | Text button | Hiện khi còn thành viên chưa tải; kèm "Hiển thị x / n" | 20 dòng mỗi lần | R-S05-10 |
| Modal "Mời thành viên" | Modal form | 4 trường; nút `⟳` sinh mật khẩu mạnh ngẫu nhiên | theo bảng Validation | R-S05-12 |
| Hộp "Đã tạo tài khoản" | Modal | Hiện mật khẩu tạm **một lần** + nút "Sao chép" + cảnh báo | không đọc lại được sau khi đóng | R-S05-13 |
| Hộp xác nhận vô hiệu hoá | Dialog | Nêu **ba hệ quả** + **số công việc đang giao** | — | R-S05-16 |
| Trạng thái lọc rỗng | Empty state | "Không tìm thấy thành viên phù hợp" + nút "Xoá bộ lọc" | chỉ cho kết quả lọc, không cho danh sách gốc | R-S05-09 |

## 4. Trạng thái giao diện (UI States)

- ⚪ **Empty:** khối Thành viên **không có trạng thái rỗng thật sự** — danh sách luôn chứa ít nhất người đang đăng nhập. Trạng thái rỗng duy nhất là **kết quả lọc không khớp** → thông điệp riêng + nút xoá bộ lọc. Logo rỗng → chữ cái đầu tên tổ chức.
- 🔄 **Loading:** hai khối tải từ hai lời gọi riêng nên **hiện dần** — khối Thông tin tổ chức xong trước thì hiện trước, bảng thành viên vẫn skeleton. Khi đang gửi thao tác: dòng đang xử lý hiện spinner ở cột hành động, các mục menu của **dòng đó** bị khoá; dòng khác vẫn thao tác được.
- 🔴 **Error:**
  - Tải thông tin tổ chức lỗi → khối lỗi + "Thử lại" trong phạm vi khối đó.
  - Tải danh sách thành viên lỗi → lỗi **cục bộ trong khối Thành viên**; khối Thông tin tổ chức vẫn sửa được.
  - Lưu thông tin lỗi → giữ nguyên giá trị đã nhập, báo lỗi trên form.
  - Email trùng khi mời (`409`) → lỗi **ngay dưới trường Email**, ba trường còn lại giữ nguyên, modal không đóng.
  - Vi phạm luật còn quản trị viên (`409`) → thông báo giải thích rõ vì sao, không phải mã lỗi trần trụi.
  - Không đủ quyền (`403`) → thông báo "Bạn không có quyền thực hiện thao tác này" + tự tải lại màn (quyền có thể vừa bị đổi).
- 🟢 **Success:** lưu thông tin → toast "Đã cập nhật thông tin tổ chức", logo/tên đổi kèm nhấn một lần. Mời thành công → hộp mật khẩu tạm, rồi dòng mới xuất hiện đầu danh sách với hiệu ứng nhấn một lần, tổng số +1. Đổi vai trò / vô hiệu hoá / kích hoạt lại → badge trên dòng đó đổi tại chỗ kèm nhấn một lần, không tải lại cả bảng.

## 5. CTA & Copywriting (microcopy)

- **CTA Primary:** `Lưu thay đổi` · `+ Mời thành viên` · `Tạo tài khoản`
- **CTA Secondary:** `Huỷ` · `Huỷ bỏ` · `Sao chép` · `Tải thêm` · `Xoá bộ lọc` · `Đã hiểu` · `Mở khoá`
- **CTA Destructive:** `Vô hiệu hoá`
- **Title khối:** `Thông tin tổ chức` · `Thành viên (12)`
- **Nhãn trường:** `Tên tổ chức *` · `Logo (đường dẫn ảnh)` · `Email *` · `Họ tên *` · `Vai trò *` · `Mật khẩu tạm *`
- **Giải thích trường khoá:** slug — `không đổi được`
- **Helper text (modal mời):** `Bạn cần tự chuyển mật khẩu này cho người mới. Hệ thống không gửi email.`
- **Hộp mật khẩu tạm:** cảnh báo `Mật khẩu này sẽ KHÔNG hiển thị lại sau khi bạn đóng hộp thoại. Hãy sao chép ngay.`
- **Hộp xác nhận vô hiệu hoá:** tiêu đề `Vô hiệu hoá tài khoản của {tên}?` · ba gạch đầu dòng hệ quả · dòng trấn an `Tài khoản không bị xoá, có thể kích hoạt lại.` · nút `Vô hiệu hoá` / `Huỷ bỏ`
- **Giải thích trong menu bị khoá:** `Đây là quản trị viên duy nhất đang hoạt động. Hãy chỉ định một quản trị viên khác trước.`
- **Wording lỗi:**
  - `Vui lòng nhập tên tổ chức` · `Tên tổ chức tối đa 100 ký tự`
  - `Đường dẫn logo phải bắt đầu bằng https://`
  - `Email không hợp lệ` · `Email này đã được sử dụng.`
  - `Mật khẩu tối thiểu 8 ký tự gồm chữ và số`
  - `Không thể hạ vai trò quản trị viên duy nhất của tổ chức.`
  - `Không thể vô hiệu hoá quản trị viên duy nhất của tổ chức.`
  - `Bạn không có quyền thực hiện thao tác này`
  - `Không tìm thấy thành viên phù hợp`
- **Wording thành công:** `Đã cập nhật thông tin tổ chức` · `Đã tạo tài khoản` · `Đã đổi vai trò` · `Đã vô hiệu hoá tài khoản` · `Đã kích hoạt lại tài khoản` · `Đã mở khoá tài khoản`

## 6. Edge case (xử lý UX)

- **Quản trị viên duy nhất:** đây là edge case **quan trọng nhất màn**. Không được để người dùng bấm rồi mới nhận lỗi — mục menu phải mờ sẵn **kèm lý do đọc được ngay trong menu**. Máy chủ vẫn kiểm lại lần nữa (`R-S05-19`).
- **Org Admin tự vô hiệu hoá mình (còn Admin khác):** cho phép, nhưng hộp xác nhận phải nói rõ *"Bạn sẽ bị đăng xuất ngay"*; sau khi xác nhận thì chuyển thẳng về `/login`, không để màn treo ở trạng thái không quyền.
- **Vô hiệu hoá người đang có công việc:** hộp xác nhận hiện **con số thật**, không nói chung chung. Con số 0 thì bỏ hẳn gạch đầu dòng đó thay vì ghi "0 công việc".
- **Đóng hộp mật khẩu tạm mà chưa sao chép:** mật khẩu mất vĩnh viễn. Cảnh báo phải đủ mạnh **trước** khi điều đó xảy ra; cân nhắc hỏi lại "Bạn đã sao chép chưa?" khi bấm đóng mà chưa từng bấm "Sao chép".
- **Team Lead nhìn bảng:** bảng có đúng 5 cột, **không** để cột hành động trống — cột trống trông như lỗi giao diện.
- **Quyền vừa bị đổi trong lúc đang mở màn:** gặp `403` bất ngờ → tự tải lại màn và vẽ lại theo quyền mới, kèm thông báo, thay vì để nút chết.
- **Đổi vai trò chính mình từ Org Admin xuống thấp hơn (còn Admin khác):** cho phép; sau khi thành công, khu Thành viên **mất cụm hành động ngay lập tức** vì người dùng không còn là Org Admin.
- **Danh sách dài (đến ~200 thành viên/tổ chức):** phân trang 20 dòng; bộ lọc chạy ở máy chủ, không lọc phía trình duyệt trên dữ liệu chưa tải hết.
- **Tên tổ chức rất dài (100 ký tự):** hiển thị đủ trong ô nhập; nơi hiển thị hẹp (header) tự cắt kèm tooltip.
- **Thao tác đồng thời hai Org Admin:** người thứ hai nhận `409` và màn tự nạp lại — không bao giờ để cả hai cùng thành công (`UC-S05-07` 4a).

## 7. Animation & chuyển cảnh (BẮT BUỘC)

> Mọi giá trị lấy từ **Motion token** của `07-design-system.md` §10.1 — không đặt số riêng. Tôn trọng `prefers-reduced-motion`.

**Chuyển màn (page transition) — vào/ra khi điều hướng:**

| Hướng | Màn lân cận | Hiệu ứng | Thời lượng · easing |
|-------|-------------|----------|---------------------|
| Vào (enter) | ← [S02 Dashboard] (qua menu avatar) | `motion.page-enter` — fade-in + dịch lên 8px | 200ms · ease-out |
| Vào (enter) | ← mở URL `/organization` trực tiếp hoặc nút Back | `motion.page-enter.quick` — fade-in, không dịch chuyển | 150ms · ease-out |
| Ra (exit) | → [S02 Dashboard] · → [S01 Đăng nhập] (khi tự vô hiệu hoá mình) | `motion.page-exit` — fade-out | 100ms · ease-in |

**Chuyển section nội màn (in/out):**

| Thành phần | Sự kiện | Hiệu ứng IN | Hiệu ứng OUT | Thời lượng · easing |
|-----------|---------|-------------|--------------|---------------------|
| Modal "Mời thành viên" | mở / đóng | `motion.modal-in` — fade + scale 0.98 → 1 | fade + scale xuống | 200ms · ease-out / ease-in |
| Hộp "Đã tạo tài khoản" | mở / đóng | `motion.modal-in` | fade + scale xuống | 200ms · ease-out / ease-in |
| Hộp xác nhận vô hiệu hoá | mở / đóng | `motion.modal-in` | fade + scale xuống | 200ms · ease-out / ease-in |
| Menu hành động `[⋮]` | mở / đóng | fade + scale 0.96 → 1 từ góc nút | fade nhanh | 150ms · ease-out / ease-in |
| Dòng thành viên mới | mời thành công | fade + trượt xuống từ trên, kèm `motion.highlight-once` | — | 150ms · ease-out |
| Badge vai trò / trạng thái | đổi thành công | `motion.crossfade` đổi nhãn tại chỗ + `motion.highlight-once` cho cả dòng | — | 150ms · ease, nhấn ~2s |
| Bảng khi đổi bộ lọc | lọc lại | `motion.crossfade` toàn bảng — **không** stagger từng dòng | `motion.crossfade` | 150ms · ease |
| Dòng "Tải thêm" | thêm 20 dòng | fade-in khối dòng mới (một lần, không stagger) | — | 150ms · ease-out |
| Skeleton → nội dung | từng khối tải xong | `motion.section-in` | `motion.section-out` | 150ms · ease-out / ease-in |
| Lỗi inline (form, modal) | xuất hiện / biến mất | `motion.section-in` | `motion.section-out` | 150ms · ease-out / ease-in |
| Trạng thái lọc rỗng | thay chỗ bảng | `motion.crossfade` | `motion.crossfade` | 150ms · ease |
| Toast xác nhận / lỗi | hiện / tắt | `motion.overlay-in` — trượt lên + fade từ đáy | fade-out | 250ms · ease |

**Luật riêng của màn:**
- **Không stagger** khi đổi bộ lọc hay tải thêm — danh sách 20 dòng nhấp nháy dây chuyền gây phân tán (`07-design-system.md` §10.1).
- Badge đổi **tại chỗ** bằng crossfade; **không** vẽ lại cả bảng khi chỉ một dòng thay đổi — người dùng đang nhìn dòng đó.
- `motion.highlight-once` chỉ cho **dòng vừa thêm hoặc vừa đổi**, chạy đúng một lần.
- `prefers-reduced-motion: reduce` → mọi dịch chuyển và scale rút về fade thuần; `motion.highlight-once` tắt hẳn.

## 8. Ghi chú cho Designer

- **Accessibility:**
  - Bảng dùng thẻ bảng thật với tiêu đề cột liên kết đúng, để trình đọc màn hình đọc được "Vai trò: Quản lý nhóm" thay vì đọc trôi.
  - Badge vai trò và trạng thái **không được chỉ phân biệt bằng màu** — luôn kèm chữ.
  - Menu `[⋮]`: mở được bằng bàn phím, điều hướng bằng mũi tên, Esc để đóng, trả focus về nút đã mở.
  - **Mục menu bị khoá phải đọc được bằng trình đọc màn hình** cùng với lý do — không dùng `display:none` cho lời giải thích.
  - Modal: bẫy focus bên trong, Esc để đóng, trả focus về nút đã mở nó.
  - Thứ tự Tab: quay lại → Tên tổ chức → Logo → Huỷ → Lưu → ô tìm → bộ lọc → Mời thành viên → từng dòng bảng.
  - Thao tác phá huỷ ("Vô hiệu hoá") phải có nhãn rõ ràng, không chỉ biểu tượng.
- **Ưu tiên thị giác:** khối Thành viên > khối Thông tin tổ chức. Người vào màn này phần lớn để quản lý người, không phải để đổi logo — cân nhắc để khối Thành viên chiếm phần lớn chiều cao màn hình.
- **Đừng** làm mờ nút cho người không có quyền — quy tắc của màn này là **ẩn hẳn** (`R-S05-11`), giống S03. Ngoại lệ **duy nhất** là mục menu bị khoá do luật quản trị viên cuối cùng: cái đó **phải** hiện ở dạng mờ **kèm lý do**, vì người dùng *có* quyền, chỉ là nghiệp vụ không cho phép lúc này.
- Ô Logo và ô Ảnh đại diện ở S04 phải trông và hành xử **giống hệt nhau** (cùng gợi ý, cùng luật `https://`, cùng cách rơi về chữ cái đầu).
