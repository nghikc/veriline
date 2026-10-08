# Giới thiệu — TeamTasks

> **Bản tổng hợp discovery** dành cho người đọc/khách hàng: gộp và **khử trùng lặp** từ `00-vision`, `00-brainstorm`, `00-personas`, `00-process`, `00-urd`. Mỗi ý chỉ nêu một lần; cần chi tiết đầy đủ (số liệu, giả định, bảng hành trình, AS-IS/TO-BE) thì xem các tài liệu nguồn tương ứng. Tài liệu nguồn vẫn là bản gốc có thẩm quyền.

## 1. Sản phẩm là gì

**TeamTasks** là ứng dụng web quản lý công việc nhóm cho các tổ chức quy mô vừa (10–200 người) tại Việt Nam: thành viên đăng nhập, tạo và giao việc, theo dõi tiến độ trên dashboard, quản lý hồ sơ cá nhân và tổ chức — mọi công việc đều **có chủ, có deadline, theo dõi được theo thời gian thực** mà không cần họp cập nhật thủ công.

**Sứ mệnh:** loại bỏ tình trạng công việc bị bỏ sót và trách nhiệm mờ nhạt khi nhóm quản lý bằng chat/bảng tính, bằng một nền tảng web có phân quyền rõ ràng và cô lập dữ liệu theo tổ chức.

## 2. Vấn đề & cơ hội

Nhóm đã vượt ngưỡng 10 người; quản lý công việc bằng chat (Zalo/Messenger) hoặc bảng tính không còn khả thi — thông tin phân tán, không có nguồn sự thật duy nhất. Bốn nỗi đau chính:

- **Thiếu minh bạch trách nhiệm** — không truy vết được ai giao việc gì, cho ai, hạn khi nào, tình trạng ra sao.
- **Công việc bị bỏ sót** — không có danh sách tập trung, việc rơi qua khe hở giữa các kênh.
- **Deadline không được nhắc** — phụ thuộc trí nhớ, dẫn tới trễ hạn.
- **Không có phân quyền** — bảng tính ai cũng sửa, dữ liệu nội bộ nhạy cảm không được bảo vệ.

**Cơ hội:** chuẩn hoá quy trình giao–thực hiện–duyệt vào một hệ thống duy nhất → cắt giảm họp báo cáo, giảm trễ hạn, tạo dữ liệu tiến độ khách quan, đồng thời kiểm soát dữ liệu nội bộ trong biên giới pháp lý (VN/Singapore, tương thích PDPA). *(Chi tiết SWOT & so sánh phương án tự-xây vs SaaS: `00-vision` §1, §3.)*

## 3. Người dùng

Ba nhóm người dùng trực tiếp (mỗi nhóm một persona — chi tiết bối cảnh/hành trình/cảm xúc ở `00-personas`):

| Vai trò | Là ai | Cần gì nhất |
|---|---|---|
| **Thành viên (Member)** — *Anh Tuấn* | Nhân viên trong nhóm ~15 người | Danh sách việc của riêng mình theo hạn; cập nhật trạng thái 1–2 cú nhấp; được nhắc trước khi trễ |
| **Quản lý nhóm (Team Lead)** — *Chị Hằng* | Phụ trách 12–20 người, họp nhiều | Giao việc dưới 3 bước; dashboard tiến độ nhóm; thấy ngay việc quá hạn và việc chờ duyệt |
| **Admin tổ chức (Org Admin)** — *Anh Khoa* | Người mở tổ chức, mời người vào | Tự tạo tổ chức; thêm/vô hiệu hoá tài khoản; dữ liệu không lọt sang tổ chức khác |

Quy mô giai đoạn 1: **tối đa 5 tổ chức × 200 thành viên (~1 000 người dùng, cao điểm ~200 đồng thời)**. Người dùng phải đăng nhập trước khi dùng bất kỳ tính năng nào.

## 4. Quy trình nghiệp vụ cốt lõi (TO-BE)

Luồng chính giao → thực hiện → duyệt (chi tiết AS-IS/TO-BE & gap: `00-process`; luồng thao tác từng bước: `00-brainstorm` §3):

1. Người dùng đăng nhập → vào **Dashboard** (danh sách việc + thống kê nhanh theo vai trò).
2. Tạo công việc (tiêu đề, người thực hiện, deadline, ưu tiên) → hệ thống lưu + **thông báo in-app** cho người nhận.
3. Người thực hiện đưa việc qua **TODO → IN_PROGRESS → IN_REVIEW** (kèm CANCELLED); bước cuối sang **DONE** do người duyệt chốt ở mục 4.
4. Team Lead/người giao **duyệt** hoặc **từ chối** (kèm lý do); mọi thay đổi ghi vào lịch sử.
5. Cron 08:00 hàng ngày **nhắc deadline** qua email cho việc đến hạn/quá hạn.

## 5. Nhu cầu người dùng cốt lõi

Nhu cầu người dùng (solution-free) làm nền cho yêu cầu hệ thống — danh sách `UN-..` đầy đủ kèm hành trình ưu tiên, ngoại lệ và tiêu chí thành công `USC-..` ở `00-urd`:

- Biết ngay hôm nay phải làm việc gì, việc nào gấp trước.
- Giao việc rõ chủ – rõ hạn, và biết nhóm đang tắc ở đâu mà không phải họp hỏi.
- Được nhắc trước khi trễ hạn.
- Yên tâm dữ liệu tổ chức mình không lẫn/không lọt sang tổ chức khác; người nghỉ việc mất quyền ngay.

## 6. Phạm vi & mục tiêu

**Trong phạm vi giai đoạn 1 (Must):** xác thực & phân quyền 3 vai trò · đăng ký + tạo tổ chức · quản lý công việc (vòng đời trạng thái) · dashboard · cô lập dữ liệu theo tổ chức · thông báo in-app · quản trị thành viên. **Should:** bình luận công việc · nhắc deadline qua email · hồ sơ cá nhân/tổ chức. **Could:** import thành viên qua CSV.

**Ngoài phạm vi (Won't lần này):** OAuth/SSO · app mobile native · "Quên mật khẩu" tự phục vụ (Admin reset thủ công) · real-time WebSocket (chấp nhận polling ~60s) · nhiều người thực hiện/việc · on-premise. *(Danh mục đầy đủ + MoSCoW: `00-vision` §4.)*

**Mục tiêu kinh doanh (đo được — chi tiết `00-vision` §2, §5):**

| Mã | Mục tiêu | Ngưỡng |
|---|---|---|
| BO-01 | Tập trung công việc vào một hệ thống | ≥ 80% công việc quản lý qua TeamTasks (T0+1 tháng) |
| BO-02 | Xoá "công việc mồ côi" | 100% công việc có assignee + deadline |
| BO-03 | Bảo vệ dữ liệu theo tổ chức | 0 sự cố truy cập chéo (6 tháng đầu) |
| BO-04 | Giảm họp cập nhật trạng thái | ≥ 50% (T0+2 tháng) |
| BO-05 | Giảm công việc trễ deadline | ≥ 30% (T0+2 tháng) |
| BO-06 | Ra mắt MVP đúng hạn | ≤ 3 tháng kể từ khởi động (Q4/2026) |

## 7. Ràng buộc & giả định chính

- **Công nghệ:** web app; đăng nhập email/mật khẩu nội bộ (không OAuth giai đoạn 1); bcrypt (cost ≥ 12), JWT RS256, HTTPS bắt buộc; hỗ trợ trình duyệt hiện đại.
- **Bảo mật/pháp lý:** dữ liệu lưu tại **VN hoặc Singapore** (PDPA); cô lập dữ liệu theo tổ chức; khoá tài khoản khi đăng nhập sai 5 lần/15 phút.
- **Thời hạn:** MVP trong **3 tháng**.
- **Giả định cần lưu ý:** một số baseline định lượng (số họp, tỷ lệ trễ hạn) và con số ngân sách **chưa đo được** trên dự án mẫu → đánh dấu chấp nhận rủi ro, khảo sát khi áp dụng cho khách thật *(chi tiết `00-vision` §7, `00-urd` §8)*.

---

> **Đọc tiếp:** yêu cầu hệ thống → `01-requirements` · chức năng → `02-functions` · giao diện chuẩn → `07-design-system` · kiến trúc → `10-architecture` · từng màn hình → danh sách màn.
