# Design Spec — Dashboard (Mã màn: S02)

> Style bám `docs/07-design-system.md` (token màu/typography/spacing) — không tự quy định mã màu/font ở đây.

## 1. Tổng quan UX
- **Mục tiêu UX:** "nhìn 3 giây biết hôm nay phải làm gì" — thống kê đập vào mắt trước, danh sách hành động được ngay; tạo việc không rời ngữ cảnh (modal, ≤ 3 bước).
- **Thiết bị mục tiêu:** Web desktop-first (công cụ làm việc), responsive xuống tablet/mobile — mobile ưu tiên danh sách, thẻ thống kê cuộn ngang.
- **User flow tóm tắt:** [S01 Đăng nhập] → **[S02 Dashboard]** → [S03 Chi tiết công việc] / [S04 Hồ sơ] / [S05 Tổ chức].

## 2. Cấu trúc layout (anatomy)
- **Header (cố định):** logo bên trái (click = về Dashboard) · cụm phải gồm chuông thông báo + badge và avatar menu (Hồ sơ cá nhân / Tổ chức — chỉ Team Lead & Org Admin / Đăng xuất).
- **Vùng chào + CTA:** lời chào theo tên người dùng bên trái; nút "+ Tạo công việc" bên phải (chỉ Team Lead/Org Admin).
- **Dải thẻ thống kê:** 5 thẻ ngang (Tổng · Cần làm · Đang làm · Hoàn thành · Quá hạn); thẻ Quá hạn mang sắc thái cảnh báo; thẻ click được để lọc.
- **Thanh công cụ danh sách:** lọc Trạng thái, lọc Ưu tiên, ô tìm kiếm tiêu đề.
- **Bảng công việc:** cột Tiêu đề / Người thực hiện (avatar + tên) / Deadline / Ưu tiên / Trạng thái; dòng hover nổi nhẹ; cuối bảng nút "Tải thêm".
- **Lớp phủ:** modal Tạo công việc; panel thông báo dạng dropdown neo dưới chuông.

## 3. Component & dữ liệu

| Component | Loại | Mô tả / Logic | Ràng buộc (validation) | Trace |
|-----------|------|---------------|------------------------|-------|
| Thẻ thống kê ×5 | Stat card (clickable) | Số đếm theo phạm vi vai trò; click = lọc danh sách theo trạng thái thẻ, click lại = bỏ lọc | đồng bộ số với danh sách | R-S02-01, R-S02-04 |
| Bảng công việc | Data table | Sắp deadline tăng dần; quá hạn tô đỏ + ⚠; click dòng → S03 | phân trang 20 dòng/lần | R-S02-02, R-S02-05, R-S02-06 |
| Lọc trạng thái / ưu tiên | Select | Kết hợp được nhiều điều kiện cùng lúc | — | R-S02-03 |
| Ô tìm kiếm | Input | Lọc theo tiêu đề, debounce 300ms, không phân biệt hoa thường | ≤ 200 ký tự | R-S02-03 |
| Nút "+ Tạo công việc" | Primary CTA | Chỉ render với Team Lead/Org Admin; mở modal | ẩn hoàn toàn với Member | R-S02-07 |
| Modal Tạo công việc | Modal form | 5 trường; validate inline khi blur; nút Tạo disable khi còn lỗi; đóng hỏi xác nhận nếu đã nhập | theo bảng Validation trong srs (tiêu đề 1–200, deadline ≥ hiện tại, người nhận ACTIVE cùng tổ chức) | R-S02-08…11 |
| Chuông + badge | Icon button + badge | Badge = số chưa đọc; 0 → ẩn; >99 → "99+"; polling 60s | — | R-S02-12, R-S02-16 |
| Panel thông báo | Dropdown panel | Mới → cũ; chưa đọc nền nhấn + chấm đậm; click item = đọc + điều hướng; "Đọc tất cả" ở góc | — | R-S02-13…15 |
| Toast | Feedback | "Đã tạo công việc" sau 201; tự ẩn sau 4 giây | — | R-S02-10 |

## 4. Trạng thái giao diện (UI States)
- ⚪ **Empty:** chưa có công việc → minh hoạ nhẹ + "Chưa có công việc nào"; Team Lead/Admin kèm "Tạo công việc đầu tiên cho nhóm của bạn" + nút CTA. Panel thông báo rỗng → "Chưa có thông báo". Kết quả lọc rỗng → "Không tìm thấy công việc phù hợp" + nút "Xoá bộ lọc".
- 🔄 **Loading:** skeleton cho 5 thẻ + 5 dòng bảng; nút Tạo trong modal chuyển spinner + disable cả form khi đang gửi.
- 🔴 **Error:** tải trang lỗi → khối thông báo giữa vùng nội dung + nút "Thử lại"; tạo việc lỗi → thông báo trên modal, dữ liệu giữ nguyên; mất mạng → "Lỗi kết nối — thử lại".
- 🟢 **Success:** toast "Đã tạo công việc"; dòng mới xuất hiện đầu bảng với hiệu ứng nổi nhẹ; badge/thống kê cập nhật tức thì.

## 5. CTA & Copywriting (microcopy)
- CTA Primary: `+ Tạo công việc` · CTA trong modal: `Tạo công việc` / `Huỷ`
- Lời chào: `Chào, [Họ tên]!` · Tiêu đề modal: `Tạo công việc mới`
- Nhãn thẻ: `Tổng` · `Cần làm` · `Đang làm` · `Hoàn thành` · `Quá hạn`
- Lỗi form: `Vui lòng nhập tiêu đề` · `Tiêu đề tối đa 200 ký tự` · `Vui lòng chọn người thực hiện` · `Deadline không được ở quá khứ`
- Thành công: `Đã tạo công việc` · Thông báo panel: `Đọc tất cả` · Xác nhận đóng modal: `Bỏ nội dung đã nhập?`

## 6. Edge case (xử lý UX)
- Mất mạng khi nhấn Tạo → giữ toàn bộ dữ liệu trong modal, snackbar "Lỗi kết nối — thử lại".
- Tiêu đề công việc quá dài trong bảng → cắt "…" + tooltip hiển thị đầy đủ khi hover.
- Tổ chức chỉ có 1 thành viên (chính Lead) → dropdown người thực hiện vẫn hiện chính mình; tạo việc tự giao không sinh thông báo (BRule-S02-06).
- Thông báo trỏ tới công việc đã xoá → "Công việc không còn tồn tại", ở lại Dashboard.
- 2 tab cùng mở: tạo việc ở tab A → tab B thấy **badge thông báo** mới chậm nhất sau chu kỳ polling 60s; **số liệu công việc/thẻ thống kê chỉ cập nhật khi reload/thao tác**.
- Màn hẹp (mobile): bảng chuyển thành thẻ dọc (mỗi việc 1 card), 5 thẻ thống kê cuộn ngang giữ thứ tự.

## 7. Animation & chuyển cảnh (BẮT BUỘC)

> Duration/easing lấy từ Motion token `07-design-system.md`; enter = `ease-out`, exit = `ease-in`; tôn trọng `prefers-reduced-motion` (giảm còn fade hoặc tắt). Nguyên tắc riêng của màn này: **tránh animation lặp gây phân tán** khi người dùng nhìn bảng lâu (StR-04).

**Chuyển màn (page transition) — vào/ra khi điều hướng:**

| Hướng | Màn lân cận | Hiệu ứng | Thời lượng · easing |
|-------|-------------|----------|---------------------|
| Vào (enter) | ← [S01: Login] sau đăng nhập · ← [S06: Register] sau đăng ký | Vùng nội dung fade-in + nhích lên 8px; header/sidebar đứng yên | 200ms · ease-out |
| Vào (enter) | ← [S03: TaskDetail] khi quay lại | Fade-in nhanh, **giữ nguyên vị trí cuộn** của bảng | 150ms · ease-out |
| Ra (exit) | → [S03: TaskDetail] khi mở một công việc | Fade-out vùng nội dung (header/sidebar giữ nguyên) | 100ms · ease-in |
| Ra (exit) | → [S01: Login] khi đăng xuất | Toàn trang fade-out | 100ms · ease-in |

**Chuyển section nội màn (in/out) — modal/toast/bảng/thống kê:**

| Thành phần | Sự kiện | Hiệu ứng IN | Hiệu ứng OUT | Thời lượng · easing |
|-----------|---------|-------------|--------------|---------------------|
| Modal "Tạo công việc" | mở từ CTA | fade + scale 0.98 → 1 (backdrop fade riêng) | fade + scale ngược | 200ms · ease-out/in |
| Toast/snackbar | tạo việc thành công · lỗi kết nối | slide-up + fade từ đáy | fade-out | 250ms · ease |
| Dòng mới trong bảng | công việc vừa tạo | highlight nền nhạt rồi tắt dần | — | ~2s · ease-out (chạy **một lần**) |
| Bảng công việc | đổi bộ lọc / tab trạng thái | crossfade nội dung bảng, giữ chiều cao để không giật layout | crossfade ngược | 150ms · ease |
| Thẻ thống kê (5 thẻ) | tải xong dữ liệu | fade-in đồng thời (**không** stagger — tránh nhấp nháy dây chuyền) | — | 150ms · ease-out |
| Badge thông báo | có thông báo mới sau polling | đổi số + pulse **một nhịp** | — | 300ms · ease-out |
| Skeleton loading | đang tải danh sách | fade-in | crossfade sang nội dung thật | 150ms · ease |

## 8. Ghi chú cho Designer
- **Accessibility:** badge có aria-label "X thông báo chưa đọc"; thẻ thống kê là nút thực sự (focus được); thứ tự Tab: chuông → avatar → CTA tạo việc → bộ lọc → bảng; tương phản chữ/nền ≥ 4.5:1; trạng thái quá hạn không chỉ dựa vào màu (kèm icon ⚠).

## Bản Figma (preview)
*(chưa dựng — chạy `ba-figma-draw Dashboard` khi cần preview)*
