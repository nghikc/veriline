# Brainstorm — Hồ sơ cá nhân

## Mục đích màn hình
Người dùng vào đây từ menu avatar trên header để làm đúng ba việc:
1. **Xem** mình là ai trong hệ thống — email đăng nhập, vai trò, tổ chức đang thuộc về.
2. **Sửa** phần thông tin hiển thị của mình — họ tên và ảnh đại diện (thứ đồng nghiệp nhìn thấy trên mỗi công việc, bình luận).
3. **Đổi mật khẩu** — việc bảo mật thường xuyên nhất mà người dùng tự làm được.

Đây là màn **tự phục vụ**: người dùng chỉ thao tác trên hồ sơ **của chính mình** (`GET/PATCH /users/me`). Việc quản trị người khác (đổi vai trò, vô hiệu hoá) nằm ở S05 và chỉ Org Admin làm.

## Thành phần & hành vi
- **Header** → giống toàn hệ thống; mục "Hồ sơ cá nhân" trong menu avatar là điểm vào màn này.
- **Khối nhận diện** → ảnh đại diện (chưa có thì hiện chữ cái đầu của họ tên trên nền màu), họ tên, email, badge vai trò, tên tổ chức, ngày tham gia.
- **Form "Thông tin cá nhân"** → hai trường sửa được: **Họ tên** và **Ảnh đại diện**; email/vai trò/tổ chức hiển thị **chỉ đọc** kèm giải thích vì sao không sửa được. Nút "Lưu thay đổi" chỉ bật khi có thay đổi thật.
- **Form "Đổi mật khẩu"** → ba trường: Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu mới; có thanh đo độ mạnh và toggle hiện/ẩn giống S06 Đăng ký. Nút "Đổi mật khẩu" riêng, không dùng chung nút Lưu của form trên.
- **Cảnh báo phiên** → dưới form đổi mật khẩu, ghi rõ: *"Đổi mật khẩu sẽ đăng xuất bạn khỏi mọi thiết bị khác."*

## Vì sao tách hai form riêng
Hai nhóm dữ liệu có **mức rủi ro khác hẳn nhau**: sửa họ tên là thao tác nhẹ, đổi mật khẩu là thao tác bảo mật cần xác thực lại bằng mật khẩu hiện tại và có hệ quả thu hồi phiên. Gộp chung một nút "Lưu" sẽ buộc người chỉ muốn đổi tên phải nhập mật khẩu — vô lý. Hai form, hai nút, hai lời gọi API riêng (`PATCH /users/me` và `PATCH /users/me/password`) đúng như `06-api-spec.md` đã tách sẵn.

## Trạng thái & edge case
- **Loading:** skeleton cho khối nhận diện và hai form.
- **Rỗng:** không có trạng thái rỗng thật sự — hồ sơ luôn tồn tại; chỉ ảnh đại diện có thể trống → hiện chữ cái đầu họ tên.
- **Lỗi:** tải hồ sơ lỗi → khối lỗi + "Thử lại"; lưu thất bại → **giữ nguyên giá trị đã nhập**, báo lỗi trên form; sai mật khẩu hiện tại → lỗi ngay tại trường đó, **không** xoá trắng các trường khác.
- **Không có thay đổi:** nút "Lưu thay đổi" disable cho tới khi thực sự có trường nào khác giá trị gốc — tránh gọi API rỗng.
- **Đổi mật khẩu thành công:** mọi phiên khác bị thu hồi, **phiên hiện tại giữ nguyên** (không đá người dùng ra khỏi màn đang đứng) — theo chú thích ⁶ của `02-functions.md`.
- **Mật khẩu mới trùng mật khẩu cũ:** chặn, báo "Mật khẩu mới phải khác mật khẩu hiện tại".
- **Họ tên toàn khoảng trắng:** chặn như rỗng.
- **Họ tên rất dài (100 ký tự):** lưu đủ; nơi hiển thị hẹp (dòng công việc, bình luận) tự cắt kèm tooltip — không phải việc của màn này.
- **Đang gõ dở mà rời màn:** cảnh báo "Bạn có thay đổi chưa lưu" trước khi điều hướng đi.

## Giả định

> **Đã rà với người dùng ngày 2026-07-22 — cả 5 giả định được giữ nguyên (Đồng ý).** Trạng thái: `Đề xuất ⚠️ chưa xác nhận` → `Đã xác nhận` / `Đã sửa` / `Đã bỏ`.

| Mã | Nội dung giả định | Vì sao cần (chỗ thiếu) | Ảnh hưởng nếu sai | Trạng thái |
|---|---|---|---|---|
| GĐ-01 | **Ảnh đại diện nhập bằng URL, không tải tệp lên.** Giai đoạn 1 người dùng dán một đường dẫn ảnh công khai | `05-data-model.md` định nghĩa `anh_dai_dien_url` là **URL**, và `06-api-spec.md` **không có endpoint tải tệp lên** nào. Muốn upload thật thì phải thêm hạ tầng lưu trữ tệp | Sai → phải bổ sung endpoint upload + nơi lưu trữ + luật dung lượng/định dạng/quét mã độc → chạm `06-api-spec.md` và `10-architecture.md`, khối việc đáng kể | **Đã xác nhận** (2026-07-22) |
| GĐ-02 | **Email không đổi được** ở giai đoạn 1 — hiển thị chỉ đọc | Email là định danh đăng nhập và **duy nhất toàn hệ thống** (`FR-13`); `06-api-spec.md` không mô tả luồng đổi email (vốn cần xác minh email mới) | Sai → phải thêm luồng xác minh email mới, xử lý trạng thái chờ xác minh, và tình huống email mới đã tồn tại | **Đã xác nhận** (2026-07-22) |
| GĐ-03 | Người dùng **không tự xoá được tài khoản** của mình | Không `FR` nào nhắc tới; chú thích ³ của `02-functions.md` chỉ nói Admin "vô hiệu hoá" người khác | Sai → cần luật xử lý công việc đang gán cho người rời đi, và ai kế thừa dữ liệu của họ | **Đã xác nhận** (2026-07-22) |
| GĐ-04 | **Không gửi email thông báo** khi mật khẩu vừa bị đổi | `F09` (email) trong phạm vi giai đoạn 1 chỉ có nhắc deadline; hạ tầng gửi mail còn đang chờ chốt (`12-api-integration.md`, ADR còn Draft) | Sai → người dùng không được cảnh báo khi tài khoản bị chiếm và đổi mật khẩu; là lỗ hổng bảo mật thực tế, nên mở `CR` khi hạ tầng email sẵn sàng | **Đã xác nhận** (2026-07-22) |
| GĐ-05 | Vai trò và tổ chức hiển thị **chỉ đọc**; người dùng không tự đổi vai trò của mình | `F13` giao quyền đổi vai trò cho Org Admin (tại S05); nếu người dùng tự đổi được thì mọi Member đều tự nâng mình thành Org Admin | Sai (nếu thực ra cho phép) → thủng toàn bộ mô hình phân quyền `BR-03` | **Đã xác nhận** (2026-07-22) |

## Câu hỏi mở
- **Ảnh đại diện dán URL bên ngoài có rủi ro gì?** Ảnh trỏ tới máy chủ lạ = rò địa chỉ IP người xem và có thể bị đổi nội dung sau khi duyệt. Nếu chốt `GĐ-01`, nên giới hạn `https://` và cân nhắc proxy ảnh — cần ý kiến của đội kỹ thuật.
- ~~**Có nên buộc đổi mật khẩu tạm ở lần đăng nhập đầu không?**~~ **ĐÃ ĐÓNG (2026-07-22) — chốt là CÓ**, triển khai qua **`CR-02`** *(CR-02)*. `06-api-spec.md` cho Org Admin đặt `mat_khau_tam` khi mời thành viên (S05); không buộc đổi thì mật khẩu do Admin biết tồn tại vô thời hạn. Đây là luật liên màn (S05 tạo ra, S01 thực thi) nên được chốt ở mức dự án. **Form đổi mật khẩu của màn S04 này được tái dùng** cho luồng bắt buộc đổi — không phải dựng màn mới.
- Có giới hạn số lần đổi mật khẩu trong một khoảng thời gian không (chống dò mật khẩu hiện tại)? Đề xuất: có, cùng cơ chế với `NFR-03`.
