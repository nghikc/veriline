# Biên bản họp — Chốt phạm vi Phase 2 & hướng gửi email nhắc hạn

| | |
|---|---|
| **Ngày** | 2026-07-21 · 14:00–15:05 |
| **Hình thức** | Online (Google Meet) |
| **Chủ trì** | Org Admin đại diện (SH-01) |
| **Người ghi** | Nhóm BA/PM (SH-06) |
| **Tham dự** | SH-01 (Org Admin), SH-02 (Team Lead), SH-04 (IT/DevOps), SH-06 (BA/PM) |
| **Vắng** | SH-05 (Ban lãnh đạo) — báo trước, uỷ quyền BA tóm tắt lại |

> Tên người tham dự ghi theo **mã bên liên quan** trong `docs/04-stakeholders.md` (dự án mẫu không dùng tên thật).

## Chương trình nghị sự
1. Chốt phạm vi Phase 2 theo `08-roadmap.md`
2. Hướng triển khai email nhắc deadline (F09 · FR-10)
3. Ứng viên yêu cầu mới từ `00-personas.md`

## Việc tồn từ họp trước
*(Chưa có biên bản họp trước — đây là biên bản đầu tiên của dự án.)*

## Thảo luận (theo agenda)

**1. Phạm vi Phase 2.** BA trình 4 chức năng Phase 2 theo roadmap: **F07** (bình luận công việc), **F09** (email nhắc deadline), **F10** (hồ sơ cá nhân), **F11** (thông tin tổ chức). SH-02 hỏi có bổ sung được chức năng nào không; BA nêu ràng buộc Phase 2 chỉ kéo dài tháng 4–5 nên không nên mở rộng. Các bên thống nhất giữ nguyên 4 chức năng.

**2. Email nhắc deadline.** SH-04 nêu rủi ro khi **tự dựng SMTP**: phải tự lo IP reputation, cấu hình SPF/DKIM, xử lý bounce, và rủi ro email rơi vào hộp thư rác. SH-02 nhấn mạnh *"email nhắc phải tới, không tới thì tính năng vô nghĩa"*. SH-04 đề xuất **mua dịch vụ gửi email của bên thứ ba** — triển khai nhanh hơn, có sẵn báo cáo tỷ lệ gửi thành công (delivery report).
Hai phương án được nêu: **SendGrid** (đắt hơn, có trình soạn mẫu email — thuận cho BA/marketing về sau) và **Amazon SES** (rẻ hơn đáng kể, nhưng phải tự làm phần mẫu email và phải xin thoát chế độ sandbox). **Chưa chọn được nhà cung cấp cụ thể trong cuộc họp** — số liệu chi phí và điều kiện dùng chưa đủ.
SH-04 lưu ý: domain gửi mail phải cấu hình SPF/DKIM **trước** khi thử nghiệm được.
Ghi nhận hiện trạng tài liệu: `10-architecture.md` §7 mới ghi "hệ ngoài: email service" ở mức chung + `ADR-04` (cron 08:00 in-process) — chưa có tài liệu riêng cho phần **tiêu thụ API bên ngoài**.

**3. Ứng viên yêu cầu từ `00-personas.md`.** BA trình 10 ứng viên (U-01…U-10). Nổi bật **U-01 "xuất báo cáo tiến độ"**: kỳ vọng này đã có trong `04-stakeholders.md` (SH-05 — "dashboard có thể xuất báo cáo", gắn `BR-04`) nhưng **không `FR` nào phủ**. SH-02 xác nhận hiện vẫn phải sao chép thủ công sang slide hằng tháng. SH-01 nêu nguyên tắc: đây là **mở rộng phạm vi**, phải đi qua quy trình change request, không đưa lặng vào Phase 2.
**U-03 (nhắc trước hạn T-1):** SH-04 xác nhận làm chung cron với F09 thì gần như không phát sinh chi phí. Các bên xem đây là **làm rõ `FR-10`**, không phải chức năng mới.
Các ứng viên còn lại (U-02, U-04…U-10) chưa ai phản đối việc đưa vào backlog xét sau MVP.

## Quyết định (DEC)

| Mã | Quyết định | Người quyết | Lý do | Ảnh hưởng |
|---|---|---|---|---|
| DEC-01 | Phạm vi Phase 2 **giữ nguyên 4 chức năng** F07 (bình luận), F09 (email nhắc deadline), F10 (hồ sơ cá nhân), F11 (thông tin tổ chức) — không bổ sung | SH-01 | Phase 2 chỉ 2 tháng, tránh phình phạm vi | `08-roadmap.md` §3 Next — không đổi |
| DEC-02 | **Không tự dựng SMTP**; dùng **dịch vụ gửi email của bên thứ ba**. Nhà cung cấp cụ thể **chưa chốt** — BA lập đánh giá build-vs-buy rồi trình lại | SH-01, SH-04 | Rủi ro deliverability và chi phí vận hành khi tự dựng | → `docs/12-api-integration.md` (`EXT-01`, `ADR-01`) · liên quan `ADR-04` ở `10-architecture.md` |
| DEC-03 | **U-01 "xuất báo cáo tiến độ"** được công nhận là **hở phạm vi** so với kỳ vọng SH-05 → **mở CR**, để SH-05 quyết làm hay không và làm ở phase nào | SH-01 | Mở rộng phạm vi phải qua quy trình change request | → **CR-01** trong `docs/00-cr.md` |
| DEC-04 | **U-03 nhắc trước hạn (T-1)** gộp vào F09 khi triển khai Phase 2 — coi là **làm rõ `FR-10`**, không cấp `FR` mới | SH-01, SH-02 | Dùng chung cron 08:00, chi phí thêm không đáng kể | `FR-10` sẽ được làm rõ khi đặc tả màn của F09 (Phase 2) |
| DEC-05 | U-02, U-04…U-10 đưa vào **backlog Later**, xét lại sau MVP | SH-01 | Không nằm trong ràng buộc Phase 2 | `08-roadmap.md` §3 Later |

## Action item (ACT)

| Mã | Việc | Người | Hạn | Trạng thái | Liên quan |
|---|---|---|---|---|---|
| ACT-01 | Lập `docs/12-api-integration.md`: đánh giá build-vs-buy SendGrid vs Amazon SES + mapping field + checklist readiness | BA | 2026-07-28 | ✅ Xong (2026-07-27) | DEC-02 · `ba-api-integration` · `ADR-01`/`ADR-02` đã **Accepted** |
| ACT-02 | Mở **CR-01** cho "xuất báo cáo tiến độ" vào `docs/00-cr.md` (trạng thái Đề xuất, chờ SH-05 duyệt) | BA | 2026-07-23 | ✅ Xong | DEC-03 → **CR-01** |
| ACT-03 | Cấu hình SPF/DKIM cho domain gửi mail trên môi trường staging | SH-04 (IT/DevOps) | ~~2026-07-30~~ → **2026-08-07** | ⚠️ Quá hạn → chuyển **`WI-05`** | DEC-02 · điều kiện để thử nghiệm F09 · theo dõi tiếp ở `00-backlog.md` |
| ACT-04 | Ghi U-02, U-04…U-10 vào mục Later của `08-roadmap.md` | SH-06 (BA) | 2026-08-04 | ✅ Xong | DEC-05 · `00-personas.md` §6 |
| ACT-05 | Tóm tắt kết quả họp gửi SH-05 (vắng mặt) kèm CR-01 để xin quyết định | SH-06 (BA) | 2026-07-23 | ✅ Xong (2026-07-27) | DEC-03 · OQ-02 → SH-05 **đã duyệt CR-01** |
| ACT-06 | Nộp đơn xin **thoát sandbox Amazon SES** ngay (có thời gian chờ duyệt — tránh thành đường găng Phase 2) | SH-04 (IT/DevOps) | 2026-08-04 | Mở | Hệ quả cổng chốt `ADR-02` (2026-07-27) · `12-api-integration.md` §7 |

## Câu hỏi mở (OQ)
- **OQ-01** — Ngân sách gửi email hằng tháng chưa có; chờ bộ phận tài chính. Ảnh hưởng trực tiếp việc chọn SendGrid hay Amazon SES ở ACT-01.
- ~~**OQ-02** — Ai là người duyệt CR-01: SH-05 hay SH-01?~~ → **ĐÃ GIẢI (2026-07-21):** nguyên nhân là RACI hàng "Phê duyệt phạm vi MVP" có **hai chữ A**. Đã sửa `04-stakeholders.md` §3: `A = SH-05` (Ban lãnh đạo) cho phê duyệt phạm vi → **SH-05 duyệt `CR-01`**; SH-01 giữ `A` cho hàng "Ra mắt chính thức".

## Cập nhật sau họp (2026-07-27)
> Ghi lại các diễn biến giữa hai kỳ họp (không sửa nội dung đã chốt ngày 21/07):
- **Cổng chốt `12-api-integration.md` lần 2 — CHỐT sớm hơn lịch:** `ADR-01` (mua dịch vụ) và `ADR-02` (**Amazon SES**) chuyển `Accepted`. Quyết định không chờ báo giá vì tiêu chí là **lưu trú dữ liệu PDPA**, không phải giá (chi tiết ở `12-api-integration.md` §7). → **ACT-01 Xong**; mở **ACT-06** (nộp đơn thoát sandbox SES).
- **SH-05 duyệt `CR-01`** (xuất báo cáo tiến độ) → CR-01 chuyển **Đã duyệt → Đã triển khai (docs)**; cấp `FR-14`/`F14`, đồng bộ S02. → **ACT-05 Xong**.
- **`CR-02`** (buộc đổi mật khẩu tạm) triển khai đồng bộ docs (`05-data-model`, `06-api-spec`, S01, S05) → **Đã triển khai (docs)**.
- Cả `CR-01` và `CR-02` **chưa Đóng** — chờ code (`dev-run`) + nghiệm thu.

## Cập nhật sau họp (2026-08-04)
> Rà `ACT` theo gate `ba-review all` ngày 2026-08-04 (gap `G35`):
- **`ACT-03` quá hạn** (hạn 2026-07-30, vẫn `Mở` sau 5 ngày). Nguyên nhân: việc hạ tầng nằm trong biên bản họp thì không có ai "sở hữu vòng đời" — không xuất hiện ở bảng công việc nào. **Xử lý:** chuyển thành **`WI-05`** trong `docs/00-backlog.md` (Tech, Must, SH-04), giao lại hạn **2026-08-07**. Từ đây theo dõi ở sổ Work Item, biên bản chỉ giữ dấu vết nguồn.
- **`ACT-06` đến hạn hôm nay** (2026-08-04), vẫn `Mở` — chưa quá hạn nên không xử lý, nhưng đây là điều kiện gỡ của **`WI-03`** (đang `Blocked`). Không xong trong hôm nay thì kỳ rà sau phải chuyển WI như `ACT-03`.
- Bài học ghi nhận: `ACT` là **việc kỹ thuật/việc mới** thì nên mở `WI` **ngay tại buổi họp** (đúng luật nối luồng của `ba-meet`), đừng để hạn trôi rồi mới chuyển.

## Họp kế tiếp
**2026-07-28** — Review đánh giá nhà cung cấp email (ADR đã Accepted — chuyển sang chốt lịch nộp đơn thoát sandbox `ACT-06`) + tiến độ dev Phase 1 + xác nhận ngân sách SES (`OQ-01`).

---
> Quyết định DEC-03 là mở rộng phạm vi → đã mở **CR-01** trong `docs/00-cr.md` (nguồn: *họp 2026-07-21 · DEC-03*).
> DEC-02 là quyết định tiêu thụ API bên ngoài → tài liệu `docs/12-api-integration.md` (`ADR-01`), không sửa `10-architecture.md` §7 cho tới khi chốt nhà cung cấp.
