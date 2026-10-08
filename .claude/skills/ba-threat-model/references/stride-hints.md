# STRIDE bám tài liệu — cách ghép ranh giới × tài sản × kẻ tấn công thành đe doạ

Skill đọc file này ở bước 4 (sau khi `scan-threat.js` đã gom), trước khi viết bảng §4. Cơ chế lấy từ security-threat-model (openai/skills, MIT): *mô hình theo luồng dữ liệu và ranh giới tin cậy · đe doạ là đường lạm dụng nhiều bước, không phải tên lỗ hổng · mức = khả năng × tác động, đã trừ kiểm soát đang có · ghi rõ kẻ tấn công KHÔNG làm được gì để không thổi mức*. Viết lại cho GĐ2 của BA kit: "bằng chứng" là tài liệu đã chốt, không phải code.

## Luật một câu
**Không có tài sản + ranh giới + kẻ tấn công với tới được thì không phải đe doạ — là lý thuyết.** Mỗi dòng `TM` phải trả lời được: *ai* (vai ở §3), đi qua *ranh giới nào* (B..), lấy/sửa/chặn *tài sản nào* (A..), *qua những bước nào*, *hậu quả* gì, và *tài liệu nào* đã chặn hay chưa.

## Sáu chữ — câu hỏi đặt cho TỪNG ranh giới, chỉ ghi khi có câu trả lời cụ thể

| Chữ | Hỏi trên ranh giới B.. | Thường ra đe doạ thật khi | Thường là lý thuyết khi |
|---|---|---|---|
| **S** giả mạo | Bên gửi qua B.. được xác thực bằng gì? Cái đó trộm/đoán/dò được không? | có mật khẩu/token/khoá API (A.. nhóm "Xác thực"), có endpoint đăng nhập, có webhook không ký | ranh giới nội bộ giữa hai module cùng tiến trình |
| **T** sửa trái phép | Dữ liệu đi qua B.. có bị đổi giữa đường hay đổi trường không được phép? | request có trường quyền/giá/trạng thái (mass assignment), `BRule` nói "chỉ X được sửa Y" | dữ liệu chỉ đọc, hoặc đã có `BRule` khoá trường + test |
| **R** chối bỏ | Hành động qua B.. có ai ghi lại không? Người làm có thể nói "không phải tôi"? | thao tác tiền/quyền/xoá mà `05-data-model` không có nhật ký (không thực thể `LichSu…`/audit) | đã có audit trail có `nguoi_thay_doi_id` + thời điểm |
| **I** lộ thông tin | Tài sản nhóm PII/bí mật/tài chính đi qua B.. có lộ cho người không được xem? | đa tenant (`NFR` cách ly), thông báo lỗi phân biệt tồn tại/không, log/email chứa PII, hệ ngoài nhận dữ liệu | dữ liệu công khai theo nghiệp vụ |
| **D** từ chối dịch vụ | Kẻ tấn công có thể làm B.. quá tải hay làm thành phần sau B.. ngừng? | endpoint không xác thực + không rate-limit, job nền chạy lâu chiếm tiến trình (ADR nói "in-process"), hệ ngoài là điểm hỏng đơn | **`ac-judge` không báo DoS** — ở đây chỉ ghi khi `NFR` sẵn sàng có con số và ranh giới có kẻ lạ đi qua |
| **E** leo thang | Vai thấp qua B.. có làm được việc của vai cao không? | `BRule` phân quyền hai tầng, trường `vai_tro` sửa được qua API, guard chỉ ở giao diện | một vai duy nhất trong hệ |

Điền **6 chữ cho mỗi ranh giới** là sai cách dùng khung: một ranh giới thường sinh 1–3 đe doạ thật. Bảng §4 tốt của dự án 6 màn nằm khoảng **6–12 dòng**; hơn 20 là đang liệt kê giáo khoa.

## Kẻ tấn công theo vai — lấy từ tài liệu, không từ trí tưởng tượng
Vai = `StR` "Nhóm liên quan" + `SH-..` + enum trường vai trò (`scan-threat.js` in sẵn). Luôn thêm ba vai tài liệu hay quên:
- **Kẻ lạ chưa đăng nhập** — chỉ với tới endpoint công khai (đăng nhập, đăng ký, quên mật khẩu, webhook). Không có token.
- **Người vận hành** (`SH` IT/DevOps) — đọc được DB, biến môi trường, log. Đe doạ ở đây là **nội gián/nhầm lẫn**, biện pháp là nhật ký + bí mật ngoài repo.
- **Hệ ngoài `EXT-..` bị chiếm hoặc chết** — trả dữ liệu sai/chậm; có gọi ngược vào hệ mình không (webhook)?

Cột **KHÔNG có năng lực** là bắt buộc: "Member không có quyền Org Admin theo `BRule-S05-01`" là lý do TM về leo thang được xếp Vừa thay vì Cao. Không ghi cột này thì mọi đe doạ đều Cao và bảng vô dụng.

## Mức — Cao / Vừa / Thấp
Khả năng (kẻ tấn công có với tới + có động cơ + bước cần ít điều kiện) × Tác động (tài sản mục tiêu C/I/A, số người bị ảnh hưởng, có pháp lý `NFR`/PDPA không), **đã trừ kiểm soát ĐANG CÓ trong tài liệu chốt** (NFR/BRule/ADR Accepted). Kiểm soát "sẽ làm" (WI mở) **không** được trừ.

| Mức | Dấu hiệu cho THIS dự án (viết lại theo tài sản thật, không chép) |
|---|---|
| **Cao** | vượt xác thực · đọc/sửa dữ liệu tổ chức khác · lấy được bí mật nhóm "Xác thực" (mật khẩu hash, refresh token, khoá ký) · leo lên vai quản trị · vi phạm ràng buộc pháp lý §7 |
| **Vừa** | lộ một phần PII của một người · chối bỏ hành động có hậu quả nghiệp vụ · làm chậm/ngưng một chức năng Must có `NFR` sẵn sàng · vượt rate-limit có tác động đo được |
| **Thấp** | lộ thông tin không nhạy cảm (tên tổ chức, số lượng) · cần điều kiện khó (đã có tài khoản quản trị + truy cập mạng nội bộ) · DoS ồn ào có kiểm soát sẵn |

Ghi ở "Tóm tắt" **giả định nào đổi mức nhiều nhất** (vd "API sau reverse proxy TLS" — sai thì mọi TM trên B1 lên Cao).

## Biện pháp — trace hay im
- **Có kiểm soát đã chốt** → trích mã: `NFR-..` (yêu cầu), `BRule-S..-..` (luật ở màn), `ADR-..` (quyết định kiến trúc). Trạng thái `Giảm nhẹ`. Nói **ở đâu** kiểm soát chạy (tầng repository, middleware, cổng API) — `ac-judge`/`ac-verify` sẽ tìm nó trong code.
- **Chưa có** → `Mở` + mở sổ: `ba-task` (WI — việc kỹ thuật cần làm), `OQ-..` (câu hỏi cần trả lời trước khi quyết), hoặc `PD-..` vào `00-decisions.md` (quyết định chỉ người mới trả lời được). **Không** tự viết biện pháp mới vào `srs.md`/`01-requirements.md` — đó là đổi baseline, phải qua `ba-change-request`.
- **Chấp nhận** → ghi ai (`SH-..` hay tên) + ngày + lý do ở §5. Chấp nhận không tên là lờ đi.
- Câu biện pháp có dạng vị trí + hành động: "Guard `org_id` ở tầng repository cho mọi truy vấn `CongViec`" — không phải "validate input".

## Ranh giới mà sơ đồ thường không vẽ (kiểm thêm)
cron/job nền ↔ DB (chạy với quyền gì?) · migration/seed ↔ DB · CI/CD ↔ môi trường production (`10-architecture` §9) · backup ↔ nơi lưu (mã hoá? ai đọc được?) · log/monitoring ↔ PII · admin tool/console nội bộ · reverse proxy ↔ API (`X-Forwarded-*` có tin không?).

## Bốn kiểm tra trước khi nộp
1. Mỗi `B..` ở §1 xuất hiện ở ≥1 `TM` (check-threat.js chặn).
2. Mỗi `TM` Cao có biện pháp trỏ **vị trí** cụ thể, không chỉ mã.
3. Tài sản bị loại khỏi danh sách quét có ghi lý do (cuối §2).
4. Không `TM` nào mô tả lỗ hổng mà kẻ tấn công ở §3 **không với tới được** — nếu có, xoá hoặc thêm vai.
