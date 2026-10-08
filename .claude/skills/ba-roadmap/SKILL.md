---
name: ba-roadmap
description: Use when cần xếp ưu tiên chức năng và lập lộ trình phát hành Now/Next/Later — MoSCoW + RICE + Kano, sơ đồ phụ thuộc; chạy sau ba-functions, giúp PO chọn phạm vi increment.
---

# ba-roadmap — Ưu tiên & Lộ trình phát hành

## Mục tiêu
Sinh `docs/Ho-so/08-roadmap.md`: một **backlog ưu tiên + lộ trình phát hành** — xếp ưu tiên từng chức năng rồi chia thành các release/increment có phụ thuộc. Tài liệu cấp tổng, 1 file/dự án, hỗ trợ PO (Product Owner) và việc lập kế hoạch. Chạy sau `ba-functions` (cần danh sách `F..`) và/hoặc `ba-screens`.

## Quy trình
1. Đọc `conventions.md` của `ba-toolkit`; `docs/02-functions.md` (danh sách `F..` + ưu tiên MoSCoW đã có); `docs/01-requirements.md` (ưu tiên MoSCoW ở cấp yêu cầu); `docs/Ho-so/00-vision.md` nếu có (mục tiêu/scope); `docs/03-overview.md` nếu có (màn hình `S..` để tham chiếu). Nếu có `docs/07-design-system.md`, lấy token màu cho sơ đồ.
2. **Xếp ưu tiên** mỗi chức năng bằng ba kỹ thuật kết hợp:
   - **MoSCoW** — Must / Should / Could / Won't (giữ nhất quán với ưu tiên đã có ở `02-functions.md`; lệch thì ghi lý do).
   - **RICE** — cho điểm `Reach · Impact · Confidence · Effort` rồi tính `RICE = (Reach × Impact × Confidence) / Effort`. Ghi rõ thang đo dùng (vd Reach = số người dùng/kỳ; Impact 0.25/0.5/1/2/3; Confidence % ; Effort = person-month/-week).
   - **Kano** (tùy chọn) — phân loại must-be / performance / delighter để cân bằng "phải có" và "gây thích thú".
   - **Xen kẽ brainstorm:** `Reach`/`Impact` là ước lượng giá trị nghiệp vụ — nếu chưa có cơ sở → **invoke `ba-brainstorm` (focused vào giá trị/độ phủ mỗi chức năng: bao nhiêu người dùng, tác động gì, tần suất)** để elicit trước khi cho điểm, thay vì bịa số; ghi cơ sở ước lượng, giá trị chưa chắc đánh `⚠️ chưa xác nhận`.
3. **Chia release/increment** — gom các `F..` thành nhóm **Now / Next / Later** (hoặc theo quý). Mỗi release có **mục tiêu rõ** + danh sách `F..` + **tiêu chí ra mắt** (điều kiện phát hành). Xếp Must + RICE cao vào Now; tôn trọng phụ thuộc (không đưa `F` phụ thuộc lên trước `F` nền).
4. **Hai sơ đồ lộ trình** (bù nhau — vẽ cả hai):
   - **4a. Gantt lộ trình đa phase** (`gantt`) — **mỗi phase = 1 `section`**, mỗi chức năng `F..` = 1 task; **thể hiện SONG SONG**: chức năng KHÔNG phụ thuộc nhau trong cùng phase cho **cùng mốc `after <cái nền>`** (KHÔNG nối chuỗi giả) → các thanh chồng thời gian = chạy song song. Chốt mỗi phase bằng `:milestone`. Trục **tương đối** (tuần/sprint), title ghi "chờ PO chốt ngày" — roadmap dùng Now/Next/Later, không cam kết ngày lịch.
   - **4b. Dependency map** (`flowchart`) — phụ thuộc giữa chức năng/release, **tô màu phân vai theo release/độ ưu tiên**.
   Cả hai tuân "Bộ chọn sơ đồ Mermaid" + "an toàn cú pháp" + "Kiểm coverage sơ đồ" trong `conventions.md`. Sau khi vẽ, đối chiếu coverage; đủ ngưỡng phức tạp → `ba-review diagram docs/Ho-so/08-roadmap.md`. *(Gantt roadmap thể hiện song song **lý tưởng theo phụ thuộc** — không giới hạn năng lực. `ba-release` cắt lát Gantt này rồi **re-level theo nhân sự thật** của phase: section = track/người, số track = số người song song được.)*
5. **Xác nhận giả định (BẮT BUỘC)** — Reach/Impact/Confidence/Effort thường phải giả định; gom & đánh số `GĐ-01`… rồi rà từng cái theo "Xác nhận giả định" trong `conventions.md`. Không có thông tin thì hỏi; chế độ batch thì đánh dấu `⚠️ chưa xác nhận`.
6. **Viết `docs/Ho-so/08-roadmap.md`** theo `template.md`. **Bàn giao:** roadmap dùng để chọn phạm vi cho `ba-add-feature` / `ba-init` theo từng increment.

## Sơ đồ
**Gantt lộ trình đa phase** (`gantt`) — bức tranh thời gian:
- **Mỗi phase = 1 `section`**; mỗi chức năng `F..` = 1 task (`Ten :id, after <dep>, <dur>`). Đặt `id` = mã F để dễ trace.
- **Song song (quan trọng):** chức năng độc lập trong cùng phase → cho **cùng mốc bắt đầu** (`after <cái nền chung>`), KHÔNG nối chuỗi A→B→C khi thực tế B,C không phụ thuộc A xong. Thanh chồng thời gian = chạy song song. Chỉ dùng `after` cho phụ thuộc THẬT (lấy từ dependency map).
- **Trục tương đối:** `dateFormat YYYY-MM-DD` + `axisFormat Tuan %W` (nhãn theo tuần, giảm cảm giác ngày cứng); một task đầu đặt mốc neo, phần còn lại `after`. Title ghi rõ "trục tương đối — chờ PO chốt ngày".
- Chốt phase bằng `:milestone`. Đánh dấu `:crit` cho chức năng đường-găng/Must, `:active`/`:done` nếu đang/đã làm.
- **`gantt` KHÔNG nhận `classDef`** → chỉ dựa house theme + tag `:crit/:active/:done`; đừng paste `classDef` vào gantt (gây vỡ). Nhãn task có ký tự đặc biệt (`:` `,` `()`) → viết gọn lại, tránh dấu `:` trong tên (Mermaid cắt tại `:`).

**Dependency map** (`flowchart`) — topo phụ thuộc:
- Mỗi node = 1 `F..` (hoặc release); cạnh = "phụ thuộc vào". Tô màu **phân vai theo release/độ ưu tiên** (Now/Next/Later hoặc Must/Should/Could). Nguồn màu: có `docs/07-design-system.md` → khối `classDef` theo token; chưa có → **bộ mặc định** trong `conventions.md`. Gắn `:::role` sau node + paste `classDef` cuối sơ đồ.

Cả hai: tuân "Sơ đồ Mermaid — an toàn cú pháp"; **đối chiếu coverage** (mọi `F..` trong bảng ưu tiên xuất hiện ở **cả** Gantt và flowchart; không node/task treo; không phụ thuộc vòng lặp; thứ tự phase trên Gantt tôn trọng phụ thuộc trên flowchart).

## Tiêu chí chất lượng (BẮT BUỘC)
- **Mỗi chức năng** có đủ điểm **RICE** + xếp **MoSCoW** (và Kano nếu dùng); thang đo Reach/Impact/Confidence/Effort ghi rõ, nhất quán giữa các dòng.
- **Mỗi release** có **mục tiêu rõ** + danh sách `F..` **trace về `02-functions.md`** + tiêu chí ra mắt; mọi `F..` trong bảng ưu tiên đều được xếp vào đúng một release (không `F` bị bỏ quên).
- **Có đủ 2 sơ đồ:** Gantt đa phase (mỗi phase 1 section, chức năng song song thể hiện đúng bằng cùng mốc `after` — không nối chuỗi giả) + dependency flowchart. Mọi `F..` xuất hiện ở cả hai.
- **Dependency không vòng lặp mâu thuẫn** (không A phụ thuộc B mà B lại phụ thuộc A); thứ tự phase/release trên Gantt tôn trọng phụ thuộc.
- **Không bịa số:** thiếu dữ liệu Reach/Impact/Confidence/Effort thì hỏi người dùng hoặc ghi giả định `⚠️ chưa xác nhận`, không tự chế con số như thật.

## Lưu ý
- Tiếng Việt. Tài liệu cấp tổng, **1 file/dự án**. Roadmap là **tài liệu sống** — cập nhật lại khi ưu tiên đổi (thị trường, phản hồi, CR).
- **Văn phong & Thuật ngữ:** mở rộng từ viết tắt ở lần đầu dùng; thêm footer `## Thuật ngữ` cuối `08-roadmap.md` + bổ sung thuật ngữ mới (RICE, Kano, Now/Next/Later, PO…) vào `docs/Ho-so/00-glossary.md` — xem `conventions.md`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
