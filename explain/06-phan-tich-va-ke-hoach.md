---
type: skill-explainer
group: phan-tich-va-ke-hoach
updated: 2026-07-15
---

# Nhóm phân tích vấn đề & kế hoạch — 2 skill (vision, quy trình, persona, URD, roadmap nay là chế độ của `ba-discover` — `03-orchestrator.md`)

> Các skill này lo phần **hiểu vấn đề, phân tích hiện trạng, ưu tiên, nghiệm thu** — đúng phần "Analyst" mà nhóm mô hình hóa giải pháp (requirements/screens/data…) không phủ. Đều là tài liệu cấp tổng, tùy chọn, 1 file/dự án.
>
> **`ba-discover brainstorm` xen kẽ để làm rõ:** các skill này KHÔNG tự hỏi hời hợt. Khi đầu vào còn mơ hồ (vấn đề chưa rõ, quy trình hiện tại chưa nắm, số Reach/Impact chưa có cơ sở, tiêu chí nghiệm thu chưa chốt) → chúng **invoke `ba-discover brainstorm` (phỏng vấn sâu, focused)** để elicit trước. Nhờ continuation mode, mỗi lần focused nối thêm vào `00-brainstorm.md`. Orchestrator `ba-discover` xen kẽ brainstorm trước vision, trước process, và một lần đào sâu giải pháp cuối cùng.

## Chọn cái nào? — theo giai đoạn

| Giai đoạn | Câu hỏi | Skill | Đầu ra |
|---|---|---|---|
| Trước khi làm | *Vì sao làm dự án này? Đáng làm không?* | `ba-discover vision` | `docs/Ho-so/00-vision.md` |
| Hiểu hiện trạng | *Quy trình đang chạy thế nào? Số hóa thì đổi gì?* | `ba-discover process` | `docs/Ho-so/00-process.md` |
| Hiểu người dùng | *Người dùng là ai, đi qua những bước nào?* | `ba-discover persona` | `docs/Ho-so/00-personas.md` |
| Chốt nhu cầu | *Người dùng CẦN GÌ, đo thành công thế nào?* | `ba-discover urd` | `docs/Ho-so/00-urd.md` · `docs/urd/<feature>.md` |
| Lập kế hoạch | *Làm cái nào trước? Chia release ra sao?* | `ba-discover roadmap` | `docs/Ho-so/08-roadmap.md` |
| Nghiệm thu | *Khi nào coi là xong và ký được?* | `ba-accept uat` | `docs/Ho-so/09-uat.md` |
| Phát hành | *Gói một phase (kế hoạch + nghiệm thu) ra HTML/URL* | `ba-accept release` | `docs/Ho-so/releases/<phase>.md` + `.html` |
| Vận hành | *Người dùng/admin dùng phần mềm này THẾ NÀO?* | `ba-accept userguide` | `docs/Ho-so/userguide/*.html` (cẩm nang) |

---

## ba-userguide-video — Clip hướng dẫn có giọng đọc

**Làm gì.** Từ các trang hướng dẫn thao tác (how-to) **đã duyệt** của cẩm nang, dựng **clip hướng dẫn** khổ ngang: máy mở app thật, thao tác lần lượt từng bước (có con trỏ và khung khoanh chỗ cần bấm), một giọng đọc tiếng Việt đọc lời giải thích, phụ đề chạy khớp từng chữ, mỗi trang một chương. Giọng đọc lấy từ công cụ TTS riêng.

**Điểm hay.** Lời đọc bám đúng trang đã duyệt và ghi rõ trang đó đến từ use case/test case nào — clip không nói gì cẩm nang không nói. Máy đọc trước rồi mới quay, nên dù máy chạy nhanh hay chậm, tiếng vẫn khớp hình. Trang cẩm nang sửa sau khi đã dựng clip → máy báo "clip cũ", dựng lại thì chỉ đọc lại những câu đã đổi.

**Khi nào dùng.** Cẩm nang đã xong và duyệt, app đã chạy được, muốn có video cho người dùng mới/CSKH tự học.

**KHÔNG dùng khi.** Cẩm nang chưa duyệt (sửa nội dung ở `ba-accept userguide` trước); chưa có app chạy được; cần video dọc cho mạng xã hội (chưa hỗ trợ).

**Đầu ra.** Kịch bản từng clip trong `docs/Ho-so/userguide/<bundle>/video/` (để đối soát); file video `.mp4` + phụ đề ở thư mục `.ba-video/` của dự án (không đưa lên git).
## ba-feasible — Tài liệu này viết ra phần mềm được chưa?

**Làm gì.** Đọc lại toàn bộ tài liệu bằng con mắt của người sắp ngồi xuống code, rồi chỉ ra những chỗ **đọc thì xuôi mà làm thì không làm được**. Ba ví dụ có thật:

- Một quy tắc ghi *"sai quá ba lần khoá tạm liên tiếp thì khoá vĩnh viễn"* — nghe rất rõ ràng. Nhưng mô hình dữ liệu không có chỗ nào ghi *"đây là lần khoá thứ mấy"*. Quy tắc đó không lưu được, nên cũng không làm được, và cũng không ai kiểm được.
- Tài liệu kiến trúc có mục "cấu trúc thư mục chuẩn", nhưng chỉ vẽ phần máy chủ. Phần giao diện thì không nói gì, dù đã chốt dùng React. Mỗi người làm một màn sẽ tự đặt chỗ để file, và cuối cùng dự án có vài kiểu sắp xếp khác nhau.
- Bản thiết kế có câu thông báo *"Đổi mật khẩu sẽ đăng xuất bạn khỏi mọi thiết bị khác."* — nhưng không tài liệu nào nói hệ thống thật sự làm việc đó. Câu chữ đó không phải câu chữ: nó là một yêu cầu chưa ai viết ra.

**Khi nào dùng.** Ngay sau khi `ba-review` báo tài liệu đã đủ, và **trước** khi `ba-build` sinh kế hoạch triển khai. Đây là chỗ rẻ nhất để phát hiện: sửa một dòng trong tài liệu lúc này tốn vài phút, còn phát hiện lúc đang code thì phải dừng lại, mở yêu cầu thay đổi, và chờ.

**Khác skill gần kề.** `ba-review` hỏi *"có thiếu tài liệu nào không"*. `ba-conformance` hỏi *"code đã viết có đúng tài liệu không"* — nhưng phải có code rồi mới hỏi được. `ba-feasible` nằm giữa hai câu đó, và hỏi câu mà không ai hỏi: *"chưa có code, vậy tài liệu này đủ để viết ra code chưa?"*

## Xem thêm
- `01-pipeline-core.md` — các skill mô hình hóa giải pháp mà nhóm này bổ trợ đầu/cuối.
- `README.md` — index + bảng chọn theo tình huống.
