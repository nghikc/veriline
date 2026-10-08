# Brainstorm — TeamTasks: App quản lý công việc nhóm

> Đầu ra của phỏng vấn IT-BA. Là đầu vào cho `ba-requirements`.

## 1. Tổng quan
- **Làm gì:** Xây dựng ứng dụng web cho phép thành viên trong một tổ chức đăng nhập, tạo và giao công việc, theo dõi tiến độ trên dashboard trực quan, và quản lý hồ sơ cá nhân cùng thông tin tổ chức.
- **Giải quyết vấn đề gì:** Các nhóm làm việc hiện dùng chat (Zalo, Messenger) hoặc bảng tính để theo dõi công việc — thiếu phân quyền, không truy vết được ai giao việc gì cho ai và tình trạng ra sao. Công việc bị bỏ sót, deadline không được nhắc, trách nhiệm mờ nhạt.
- **Vì sao bây giờ:** Nhóm đã vượt ngưỡng 10 người; quản lý bằng bảng tính không còn khả thi. Deadline sản phẩm Q3 yêu cầu quy trình minh bạch hơn.

## 2. Người dùng & quyền truy cập
- **Vai trò sử dụng:**
  - **Thành viên (Member):** xem công việc được giao, cập nhật trạng thái, tạo công việc cho bản thân hoặc đồng nghiệp trong cùng tổ chức.
  - **Quản lý nhóm (Team Lead):** toàn bộ quyền Member + phân quyền, xem báo cáo nhóm, chỉnh sửa thông tin tổ chức.
  - **Admin tổ chức (Org Admin):** toàn bộ quyền Team Lead + quản lý thành viên, tạo/xoá tổ chức, cấu hình hệ thống.
- **Điều kiện gating / điểm vào:** Người dùng phải đăng nhập trước khi truy cập bất kỳ tính năng nào. Tài khoản được tạo bởi Org Admin; không có đăng ký tự do.
- **Quy mô dự kiến:** Giai đoạn 1 — tối đa 5 tổ chức, mỗi tổ chức 200 thành viên, tổng khoảng 1 000 người dùng, cao điểm ~200 đồng thời.

## 3. Luồng chính (happy path)

| Bước | Người dùng làm gì | Hệ thống làm gì | Người dùng thấy gì |
|------|-------------------|-----------------|--------------------|
| 1 | Mở trình duyệt, vào URL ứng dụng | Kiểm tra session — chưa đăng nhập, redirect đến trang Login | Trang đăng nhập với logo tổ chức |
| 2 | Nhập email và mật khẩu, nhấn "Đăng nhập" | Xác thực thông tin, tạo session JWT, ghi log đăng nhập | Chuyển ngay đến Dashboard |
| 3 | Xem tổng quan Dashboard | Truy vấn công việc của người dùng, thống kê trạng thái | Danh sách công việc + thống kê nhanh |
| 4 | Nhấn "Tạo công việc" | Mở form tạo công việc mới | Form với các trường: tiêu đề, mô tả, người thực hiện, deadline, ưu tiên |
| 5 | Điền form, chọn người nhận, nhấn "Lưu" | Lưu công việc vào DB, gửi thông báo in-app cho người nhận | Công việc xuất hiện trên Dashboard; badge thông báo cho người nhận |
| 6 | Nhấn vào công việc để xem chi tiết | Tải chi tiết công việc + lịch sử thay đổi | Trang TaskDetail với đầy đủ thông tin, comment, lịch sử |
| 7 | Thay đổi trạng thái công việc (vd: Đang làm → Hoàn thành) | Cập nhật trạng thái, ghi lịch sử, thông báo người giao | Trạng thái đổi ngay lập tức, dòng lịch sử thêm mới |

## 4. Deep-dive

### 4.1 Luồng đăng nhập với throttle & lockout (trigger: `has_throttle_rules`)

**Trigger bật:** Login có từ khoá "đăng nhập" + "khoá tài khoản" + "hạn mức" → bắt buộc ép số chính xác và bảng state transitions.

#### Số chính xác (P5 ép):
- Số lần nhập sai tối đa trước khi khoá: **5 lần** trong **15 phút**
- Thời gian khoá tài khoản tạm thời: **15 phút**
- Sau khoá tạm thời, nếu sai tiếp: khoá vĩnh viễn đến khi Admin mở khoá thủ công
- Thời gian JWT hết hạn: **8 giờ** (access token), **30 ngày** (refresh token)

#### Bảng state transitions — Trạng thái tài khoản trong luồng đăng nhập:

| Trạng thái hiện tại | Sự kiện | Điều kiện | Trạng thái kế | Phản hồi người dùng |
|---------------------|---------|-----------|---------------|---------------------|
| `ACTIVE` (chưa đăng nhập) | Nhập đúng email + mật khẩu | — | `LOGGED_IN` | Chuyển Dashboard |
| `ACTIVE` (chưa đăng nhập) | Nhập sai mật khẩu (lần 1–4) | fail_count < 5 | `ACTIVE` (fail_count +1) | "Sai email hoặc mật khẩu. Còn X lần thử." |
| `ACTIVE` (chưa đăng nhập) | Nhập sai mật khẩu (lần 5) | fail_count = 5 | `TEMP_LOCKED` | "Tài khoản bị khoá tạm 15 phút do đăng nhập sai quá nhiều lần." |
| `TEMP_LOCKED` | Hết 15 phút | lock_expires <= now | `ACTIVE` (fail_count reset về 0) | Có thể thử lại |
| `TEMP_LOCKED` | Nhập sai lại | — | `TEMP_LOCKED` | "Tài khoản đang bị khoá. Thử lại sau X phút." |
| `TEMP_LOCKED` | Nhập đúng mật khẩu | — | `TEMP_LOCKED` | "Tài khoản đang bị khoá. Thử lại sau X phút." (không cho qua dù đúng) |
| `PERM_LOCKED` | Bất kỳ tương tác đăng nhập | — | `PERM_LOCKED` | "Tài khoản bị khoá vĩnh viễn. Liên hệ quản trị viên." |
| `LOGGED_IN` | Session hết hạn (8h) | — | `ACTIVE` (chưa đăng nhập) | Redirect Login + "Phiên đăng nhập đã hết hạn." |

#### ASCII flow — Luồng đăng nhập đầy đủ (bao gồm throttle/lockout):

```
Người dùng mở /login
        |
        v
+-------------------+
| Nhập email + mật  |
| khẩu, nhấn Submit |
+-------------------+
        |
        v
[Kiểm tra tài khoản tồn tại?]
        |            \
      Không           Có
        |              \
        v               v
  "Sai email hoặc   [Tài khoản bị khoá vĩnh viễn?]
   mật khẩu"              |              \
                         Có              Không
                          |               \
                          v                v
               "Tài khoản bị khoá.   [Tài khoản đang khoá tạm?]
                Liên hệ admin."            |              \
                                          Có              Không
                                           |               \
                                           v                v
                               "Khoá tạm, thử lại    [Mật khẩu đúng?]
                                sau X phút."              |        \
                                                         Có         Không
                                                          |          \
                                                          v           v
                                                   Reset fail_count  fail_count += 1
                                                   Tạo JWT session   [fail_count = 5?]
                                                   Ghi log đăng nhập       |       \
                                                   Redirect Dashboard      Có      Không
                                                                            |         \
                                                                            v          v
                                                                      Khoá tạm 15'  "Sai MK,
                                                                      Ghi timestamp  còn X lần"
                                                                      "Khoá tạm 15'"
```

### 4.2 State machine công việc (trigger: `has_state_machine`)

**Trigger bật:** "Đang làm → Hoàn thành" + nhiều trạng thái → bắt buộc bảng state transitions công việc.

| Trạng thái hiện tại | Sự kiện | Điều kiện | Trạng thái kế |
|---------------------|---------|-----------|---------------|
| `TODO` (Cần làm) | Nhận người thực hiện bắt đầu | Người thực hiện xác nhận | `IN_PROGRESS` (Đang làm) |
| `TODO` | Người giao huỷ | — | `CANCELLED` (Đã huỷ) |
| `IN_PROGRESS` | Người thực hiện đánh dấu xong | — | `IN_REVIEW` (Chờ duyệt) |
| `IN_PROGRESS` | Người giao huỷ | — | `CANCELLED` |
| `IN_REVIEW` | Team Lead/người giao duyệt | — | `DONE` (Hoàn thành) |
| `IN_REVIEW` | Team Lead/người giao từ chối | Có ghi chú lý do | `IN_PROGRESS` |
| `DONE` | Mở lại (reopen) — *hoãn khỏi GĐ1* | Chỉ Team Lead trở lên | `IN_PROGRESS` |
| `CANCELLED` | Mở lại | Chỉ Team Lead trở lên | `TODO` |

## 5. Validation & wording

- **Trường bắt buộc:** Email (login), Mật khẩu (login), Tiêu đề công việc, Người thực hiện, Deadline
- **Giới hạn/định mức (số chính xác):**
  - Email: định dạng RFC 5321, tối đa 254 ký tự
  - Mật khẩu: 8–128 ký tự, ít nhất 1 chữ hoa, 1 số
  - Tiêu đề công việc: 1–200 ký tự
  - Mô tả công việc: tối đa 5 000 ký tự
  - Comment: tối đa 1 000 ký tự
  - File đính kèm: tối đa 10 file/công việc, mỗi file ≤ 25 MB
  - Đăng nhập sai: khoá sau **5 lần** trong **15 phút**
- **Wording lỗi/thành công (chính xác):**
  - Đăng nhập thành công: *(redirect ngầm, không toast)*
  - Sai email/mật khẩu (lần 1–4): `"Sai email hoặc mật khẩu. Còn [X] lần thử."`
  - Sai lần 5: `"Tài khoản bị khoá tạm 15 phút do đăng nhập sai quá nhiều lần."`
  - Tài khoản khoá tạm: `"Tài khoản đang bị khoá. Vui lòng thử lại sau [X] phút."`
  - Tài khoản khoá vĩnh viễn: `"Tài khoản của bạn bị khoá vĩnh viễn. Liên hệ quản trị viên để được hỗ trợ."`
  - Session hết hạn: `"Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."`
  - Tạo công việc thành công: `"Công việc đã được tạo và giao thành công."`
  - Thiếu trường bắt buộc: `"Vui lòng điền [tên trường] để tiếp tục."`

## 6. Ngữ cảnh hệ thống

- **Loại thông tin cần lưu:** Thông tin tài khoản (email, mật khẩu hash, role, trạng thái khoá, fail_count, lock_expires); Thông tin công việc (tiêu đề, mô tả, trạng thái, người giao, người nhận, deadline, ưu tiên); Lịch sử thay đổi công việc; Comment; Thông tin tổ chức; Phiên đăng nhập (refresh token).
- **Dịch vụ ngoài:** Không có trong giai đoạn 1 — đăng nhập bằng email/mật khẩu nội bộ (không OAuth). Giai đoạn 2 có thể thêm SSO/Google.
- **Kênh thông báo:** In-app notification (badge + danh sách thông báo); Email notification cho sự kiện quan trọng (được giao việc mới, deadline hôm nay).
- **Xử lý nền:** Gửi email thông báo (async queue); Nhắc nhở deadline (cron job chạy hàng ngày 8:00 SA).
- **Real-time:** Không bắt buộc trong giai đoạn 1; cập nhật trạng thái có thể polling 30 giây. Giai đoạn 2 có thể WebSocket.

## 7. Edge case & rủi ro

- **Mất mạng giữa chừng khi submit form:** Form giữ nguyên dữ liệu đã nhập; hiển thị snackbar "Lỗi kết nối. Vui lòng thử lại."; không reset form.
- **Đóng tab/trình duyệt giữa khi tạo công việc:** Dữ liệu chưa lưu bị mất — không có auto-draft trong giai đoạn 1 (chấp nhận được với bản mô tả ngắn).
- **Nhiều người cùng sửa 1 công việc:** Giai đoạn 1 chấp nhận last-write-wins; hiển thị "Cập nhật bởi [tên] lúc [giờ]" trên trang chi tiết để người dùng tự nhận biết xung đột.
- **Admin xoá tổ chức có công việc đang mở:** Yêu cầu Admin xác nhận; công việc được đánh dấu `ARCHIVED` thay vì xoá vĩnh viễn.
- **Rủi ro nghiệp vụ:** Người dùng lãng quên deadline nếu không có email nhắc → giải quyết bằng cron job thông báo 08:00 hàng ngày.

## Open Questions
- [ ] OQ-01: Có cần tích hợp SSO (Google/Microsoft) ngay từ giai đoạn 1 không, hay để giai đoạn 2?
- [ ] OQ-02: Cơ chế "Quên mật khẩu" có cần trong giai đoạn 1 không? Admin có thể reset thủ công không?
- [ ] OQ-03: Khi email thông báo bị bounce (địa chỉ không tồn tại), hệ thống có cần cảnh báo Admin không?
- [ ] OQ-04: Công việc có thể giao cho nhiều người thực hiện cùng lúc không, hay chỉ 1 người?

## Giả định
- Xác thực bằng email/mật khẩu nội bộ; không có OAuth/SSO trong giai đoạn 1 (OQ-01 chưa chốt → giả định không có).
- Mỗi công việc có đúng 1 người thực hiện chính (OQ-04 chưa chốt → giả định 1 người).
- Org Admin tạo tài khoản cho thành viên; không có đăng ký tự do.
- Không có tính năng "Quên mật khẩu" tự phục vụ — Admin reset thủ công (OQ-02 chưa chốt → giả định Admin reset).
- Hệ thống web, không có app mobile giai đoạn 1.
