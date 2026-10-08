---
name: ba-persona
description: Use when cần làm rõ NGƯỜI DÙNG LÀ AI — personas + user journey theo cảm xúc, rút nỗi đau thành ứng viên U-.. cho ba-urd; sinh Ho-so/00-personas.md. Discovery, chạy sớm.
---

# ba-persona — Chân dung người dùng & Hành trình

## Mục tiêu
Trả lời **"làm cho AI, họ đi qua những bước nào, cảm xúc ra sao"** trước khi chốt yêu cầu. Sinh `docs/Ho-so/00-personas.md` — bộ **personas** (chân dung người dùng đại diện) + **user journey** (bản đồ hành trình theo cảm xúc/nỗi đau): mỗi nỗi đau/nhu cầu là ứng viên `U-..` cho bước sau. Tài liệu discovery, chạy sớm (trước/song song `ba-requirements`).

> **Phân vai với `ba-urd`:** `ba-persona` = **người dùng LÀ AI** (chân dung, hành vi, cảm xúc theo hành trình). `ba-urd` (`00-urd.md`) = **họ CẦN GÌ** (nhu cầu `UN-..` có bằng chứng + tiêu chí thành công `USC-..`, solution-free). Ứng viên `U-..` ở đây là **đầu vào** của `ba-urd`; dự án có chạy `ba-urd` thì URD là nơi hợp nhất nhu cầu, `00-personas.md` không cần gánh vai đó.

> **Phân vai với `ba-stakeholder`:** `ba-stakeholder` (04) = **ai có quyền lợi/quyền lực** với dự án (RACI, quản lý kỳ vọng — gồm cả người không dùng app). `ba-persona` (00) = **người DÙNG app trông thế nào** (mục tiêu, hành vi, nỗi đau — để thiết kế). Một CEO là stakeholder nhưng thường không phải persona người dùng; một nhân viên nhập liệu là persona chính nhưng quyền lực thấp.

## Điều kiện
- **Nên có:** `00-vision.md` (đối tượng mục tiêu), `00-brainstorm.md`, `04-stakeholders.md` (nhóm người dùng). Thiếu hết → phỏng vấn nhanh hoặc suy từ mô tả ý tưởng, đánh dấu giả định.
- Không có dữ liệu người dùng thật (phỏng vấn/khảo sát) → personas là **giả thuyết** → gắn `GĐ ⚠️ chưa xác nhận`, đừng trình bày như sự thật đã kiểm chứng.

## Quy trình
1. Đọc `conventions.md`; `00-vision`/`00-brainstorm`/`04-stakeholders` nếu có.
2. **Xác định nhóm người dùng** từ vai trò/phân quyền (admin, CSKH, người dùng cuối, khách vãng lai…). Mỗi nhóm chính → **một persona `PS-01`** (đừng lạm phát: 3–5 personas cho phần lớn dự án).
3. **Dựng mỗi persona** theo `template.md`: tên/archetype + ảnh đại diện mô tả · bối cảnh (tuổi/nghề/môi trường dùng: điện thoại ngoài hiện trường? máy bàn văn phòng?) · **mục tiêu** (họ muốn đạt gì) · **nỗi đau/cản trở** hiện tại · **nhu cầu** với hệ thống · **độ rành công nghệ** · **tần suất & thiết bị** · một **câu nói đặc trưng** (quote). Phân biệt **persona chính** (thiết kế xoay quanh) vs **phụ**.
4. **Bản đồ hành trình (user journey)** cho **mỗi persona chính × kịch bản then chốt** (vd "đặt đơn lần đầu"): các **giai đoạn** → hành động · suy nghĩ · **cảm xúc** (😍→😣) · điểm chạm · **nỗi đau** · **cơ hội cải thiện**.
   - Vẽ **Mermaid `journey`** (cảm xúc theo bước) + kèm **bảng chi tiết** (journey thuần không chứa hết cột nỗi đau/cơ hội). Đối chiếu coverage: đủ giai đoạn từ *nhận biết → hoàn tất → sau đó*.
5. **Rút yêu cầu ứng viên:** mỗi **nỗi đau/nhu cầu/cơ hội** → một **ứng viên `U-01`** ("→ ứng viên: …") để `ba-urd` (nếu có chạy) hoặc `ba-requirements` nhặt. Đây là giá trị chính: nối người dùng → nhu cầu → yêu cầu.
   - `U-..` **chưa phải yêu cầu đã chốt** — đừng cấp mã `FR` ở đây. Dự án mới → `ba-requirements` chuyển thành `FR`/`StR`. **Dự án đã có `01-requirements`** (chạy bổ sung ngược) → mỗi `U-..` là *hở phạm vi tiềm năng*: đối chiếu `FR` hiện có trước, cái nào thật sự chưa được phủ thì đề xuất **mở CR** (`ba-change-request`), không sửa thẳng yêu cầu.
   - Gom các `U-..` thành **một bảng tổng hợp cuối tài liệu** (ứng viên · từ persona nào · bằng chứng nguồn · đề xuất xử lý) — để bước sau nhặt trọn, không phải lục từng journey.
6. **Xác nhận giả định (BẮT BUỘC):** personas/journey suy từ giả định (chưa có phỏng vấn thật) → `GĐ-..` + vòng "Xác nhận giả định" (`conventions.md`); batch → `⚠️ chưa xác nhận`.
7. Viết `docs/Ho-so/00-personas.md` theo `template.md`. Báo người dùng: personas nào chắc (có dữ liệu), nào là giả thuyết; danh sách `FR` ứng viên để đưa vào `ba-requirements`.

## Tiêu chí chất lượng
- Persona **cụ thể, hành động được** — mục tiêu/nỗi đau riêng biệt, không chung chung "muốn app dễ dùng". Tránh personas na ná nhau (dấu hiệu chia nhóm sai).
- Mỗi persona chính có **≥1 journey** với **điểm cảm xúc thấp** được chỉ ra (chỗ đó là cơ hội thiết kế).
- Mọi **cơ hội/nỗi đau** nối tới **≥1 `FR` ứng viên** — không để insight rơi rụng.
- Không bịa số liệu nhân khẩu/hành vi → `GĐ ⚠️ chưa xác nhận`.

## Lưu ý
- Tài liệu sống: hiểu thêm về người dùng (sau phỏng vấn/analytics) → cập nhật; đổi lớn qua `ba-change-request` nếu đã kéo theo yêu cầu.
- Sơ đồ `journey` theo Bộ chọn sơ đồ Mermaid của `conventions.md`; cần rẽ nhánh/quyết định thì đó là luồng nghiệp vụ → dùng swimlane/flowchart, không nhồi vào journey.
- **Văn phong & Thuật ngữ:** footer `## Thuật ngữ` + bổ sung `00-glossary.md` (persona, journey map, pain point, StR…).
- Tiếng Việt.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
