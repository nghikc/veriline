# Brainstorm — Tổ chức

## Mục đích màn hình
Màn quản trị của tổ chức, gom **hai chức năng có mức quyền khác nhau**:
1. **F11 — Thông tin tổ chức:** xem và sửa tên, logo. Dành cho **Team Lead và Org Admin**.
2. **F13 — Quản trị thành viên:** xem danh sách, mời người mới, đổi vai trò, vô hiệu hoá. Dành cho **riêng Org Admin**.

Đây là màn duy nhất trong hệ thống tạo ra tài khoản người dùng ngoài luồng tự đăng ký (S06), và là màn duy nhất đổi được vai trò của người khác. Sai một luật ở đây là thủng `BR-03`.

## Điểm cần cẩn thận nhất: hai vai trò, hai phạm vi
`02-functions.md` §Ma trận phân quyền ghi rõ **F11 ≠ F13**:

| | Member | Team Lead | Org Admin |
|---|---|---|---|
| Vào được màn S05 | ⛔ | ✅ | ✅ |
| Sửa tên/logo tổ chức (F11) | ⛔ | ✅ | ✅ |
| Xem danh sách thành viên | ⛔ | ✅ *(chỉ đọc)* | ✅ |
| Mời / đổi vai trò / vô hiệu hoá (F13) | ⛔ | ⛔ | ✅ |

Nghĩa là Team Lead vào màn này thấy **cùng một danh sách** nhưng **không có nút thao tác nào** ở khu thành viên. Gộp hai chức năng vào một màn mà không tách quyền rõ là lỗi dễ mắc nhất.

## Thành phần & hành vi
- **Header** → giống toàn hệ thống; mục "Tổ chức" trong menu avatar chỉ hiện với Team Lead và Org Admin.
- **Khối "Thông tin tổ chức"** → logo, tên tổ chức (sửa được), slug (chỉ đọc), ngày tạo, tổng số thành viên. Nút "Lưu thay đổi" chỉ bật khi có sửa thật.
- **Khối "Thành viên"** → thanh công cụ (ô tìm theo tên/email, lọc vai trò, lọc trạng thái, nút "+ Mời thành viên") + bảng danh sách.
- **Bảng thành viên** → mỗi dòng: avatar + họ tên, email, badge vai trò, badge trạng thái, ngày tham gia, và cụm hành động ở cột cuối (đổi vai trò / vô hiệu hoá / kích hoạt lại) — **cụm hành động chỉ render với Org Admin**.
- **Modal "Mời thành viên"** → Email, Họ tên, Vai trò, Mật khẩu tạm. Sau khi tạo xong hiện màn xác nhận kèm mật khẩu tạm để Org Admin sao chép và chuyển cho người mới.
- **Hộp xác nhận vô hiệu hoá** → nêu rõ hệ quả: người đó bị đăng xuất khỏi mọi thiết bị, và **số công việc đang gán cho họ**.

## Luật sống còn: không được khoá chết tổ chức
Tổ chức **phải luôn còn ít nhất một Org Admin đang hoạt động**. Nếu không chặn, hai thao tác sau sẽ khoá chết tổ chức vĩnh viễn — không ai còn quyền mời người hay đổi vai trò nữa:
- Org Admin **duy nhất** tự hạ vai trò mình xuống Member/Team Lead.
- Org Admin **duy nhất** tự vô hiệu hoá tài khoản của mình.

Cả hai phải bị chặn ở **giao diện lẫn máy chủ**, kèm thông báo giải thích rõ vì sao. Đây là ca kiểm thử ưu tiên cao nhất của màn.

## Trạng thái & edge case
- **Loading:** skeleton cho khối thông tin và bảng thành viên (hai lời gọi riêng, hiện dần).
- **Rỗng:** danh sách thành viên **không bao giờ rỗng** — luôn có ít nhất người đang đăng nhập. Chỉ kết quả **lọc** mới rỗng → "Không tìm thấy thành viên phù hợp" + nút "Xoá bộ lọc".
- **Lỗi:** tải lỗi → khối lỗi + "Thử lại"; mời thất bại → **giữ nguyên dữ liệu trong modal**; email trùng → lỗi ngay tại trường Email (`409`).
- **Không có quyền:** Member mở thẳng `/organization` → chuyển về Dashboard hoặc trang "Không có quyền truy cập"; Team Lead thấy danh sách nhưng cụm hành động **không render**.
- **Vô hiệu hoá người có công việc đang làm:** hộp xác nhận nêu rõ số công việc; công việc **giữ nguyên người thực hiện** (không tự chuyển cho ai) — người quản lý tự quyết định giao lại qua S03.
- **Vô hiệu hoá chính mình (không phải Admin duy nhất):** cho phép, nhưng cảnh báo mạnh và sau khi xác nhận thì đăng xuất luôn người đó.
- **Kích hoạt lại người đã vô hiệu hoá:** trạng thái về ACTIVE; người đó đăng nhập lại bình thường bằng mật khẩu cũ.
- **Đổi vai trò người đang online:** quyền mới áp dụng ở lời gọi API kế tiếp; không cần họ đăng nhập lại.
- **Danh sách rất dài:** phân trang 20 dòng/lần, giống quy ước của S02.

## Giả định

> **Đã rà với người dùng ngày 2026-07-22** — 6/7 giả định giữ nguyên; **`GĐ-03` bị sửa** (buộc đổi mật khẩu tạm lần đầu) và được triển khai qua **`CR-02`** trong `docs/00-cr.md`.

| Mã | Nội dung giả định | Vì sao cần (chỗ thiếu) | Ảnh hưởng nếu sai | Trạng thái |
|---|---|---|---|---|
| GĐ-01 | **Slug tổ chức không sửa được** ở giai đoạn 1 — hiển thị chỉ đọc | `05-data-model.md` định nghĩa `slug` là **duy nhất** và URL-friendly, nhưng `F11` chỉ nói sửa "tên, logo"; `06-api-spec.md` không mô tả luồng đổi slug | Sai → đổi slug làm hỏng mọi đường dẫn đã chia sẻ, phải thêm luật chuyển hướng từ slug cũ | **Đã xác nhận** (2026-07-22) |
| GĐ-02 | **Mật khẩu tạm do Org Admin đặt và tự chuyển cho người mới** bằng kênh ngoài hệ thống (nhắn tin, gặp trực tiếp) — hệ thống **không gửi email mời** | `06-api-spec.md` yêu cầu trường `mat_khau_tam` trong body mời, nghĩa là Admin đặt chứ không phải hệ thống sinh; hạ tầng email còn đang chờ chốt (`12-api-integration.md`, ADR còn Draft) | Sai → cần luồng gửi email mời + token kích hoạt + hạn dùng, phụ thuộc hạ tầng email chưa sẵn sàng | **Đã xác nhận** (2026-07-22) |
| GĐ-03 | **Không buộc đổi mật khẩu tạm ở lần đăng nhập đầu** trong giai đoạn 1 | Không `FR` nào nhắc tới; `S01` hiện không có luồng "bắt buộc đổi mật khẩu" | Sai → mật khẩu do Admin biết tồn tại vô thời hạn; là **rủi ro bảo mật thực tế** | **ĐÃ SỬA** (2026-07-22) — chốt là **CÓ buộc đổi** ở lần đăng nhập đầu; triển khai qua **`CR-02`** |
| GĐ-04 | Vô hiệu hoá một người **không tự chuyển** công việc đang gán cho họ — công việc giữ nguyên người thực hiện, chỉ cảnh báo số lượng | Không tài liệu nào quy định; chú thích ³ của `02-functions.md` chỉ nói giữ lịch sử công việc đã giao | Sai → hoặc công việc mồ côi không ai làm (chọi `BR-02`), hoặc hệ thống tự gán bừa cho người khác | **Đã xác nhận** (2026-07-22) |
| GĐ-05 | Người đã vô hiệu hoá **kích hoạt lại được** (INACTIVE → ACTIVE) bằng mật khẩu cũ | `05-data-model.md` cho `trang_thai` nhận INACTIVE nhưng không nói chiều ngược; chú thích ³ nhấn mạnh "không xoá vật lý" → hàm ý phục hồi được | Sai → nhân viên nghỉ rồi quay lại phải tạo tài khoản mới, mất toàn bộ lịch sử công việc gắn với tài khoản cũ | **Đã xác nhận** (2026-07-22) |
| GĐ-06 | **Team Lead xem được** danh sách thành viên nhưng **không thao tác** được | Ma trận phân quyền cho Team Lead ✅ ở F11 và ⛔ ở F13, nhưng không nói rõ Team Lead có *thấy* danh sách không | Sai (nếu phải ẩn hẳn) → phải tách màn hoặc ẩn cả khối Thành viên với Team Lead | **Đã xác nhận** (2026-07-22) |
| GĐ-07 | **Không giới hạn số thành viên** trong một tổ chức ở giai đoạn 1 | Không `FR`/`NFR` nào nêu hạn mức; `00-vision.md` ước quy mô ~1 000 người dùng nhưng đó là toàn hệ thống | Sai → cần luật hạn mức theo gói dịch vụ và thông báo khi chạm trần | **Đã xác nhận** (2026-07-22) |

## Câu hỏi mở
- **Ai được đổi vai trò của một Org Admin khác?** Hiện giả định mọi Org Admin ngang quyền nhau nên A hạ được B. Có nên có khái niệm "chủ sở hữu tổ chức" (người tạo, không ai hạ được) không? Ảnh hưởng tới `S06` (người đăng ký thành Org Admin đầu tiên).
- **Vô hiệu hoá có nên chặn khi người đó còn công việc chưa xong không?** `GĐ-04` chọn "cảnh báo nhưng cho phép". Nếu nghiệp vụ yêu cầu bàn giao trước khi khoá thì phải chặn cứng — cần ý kiến `SH-03`.
- **Có cần nhật ký thao tác quản trị (audit log) không?** Đổi vai trò và vô hiệu hoá là hành động nhạy cảm nhưng `05-data-model.md` chỉ có `LichSuCongViec` cho công việc, **không có** thực thể ghi nhật ký cho hành động quản trị. Đề xuất ghi nhận là `U-..` cho phase sau.
- Logo tổ chức nhập bằng URL — cùng vấn đề với ảnh đại diện ở `S04` (`GĐ-01` của S04). Nếu dự án chốt cho tải tệp lên thì **cả hai màn cùng đổi**, nên quyết một lượt.
