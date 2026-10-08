---
name: ba-onepager
description: Use when cần MỘT bài đọc liền mạch về cả dự án trong một HTML tự chứa gửi lãnh đạo/khách — gộp docs/ thành văn xuôi, mã ID dồn về phụ lục. Khác ba-portal (tra cứu nhiều trang).
---

# ba-onepager — Gộp cả hồ sơ thành một tài liệu liền mạch

## Mục tiêu
Một file gửi đi là đủ hiểu cả dự án: `docs/Ho-so/00-onepager.md` → `docs/Ho-so/00-onepager.html` (tự chứa, double-click mở).

## Ranh giới — bốn skill kề, không cái nào thay được

| Skill | Nó làm gì | Khác skill này ở đâu |
|---|---|---|
| `ba-portal` (kể cả `--client`) | render **cả bộ** `docs/` thành cổng nhiều trang + sidebar | portal **giữ ranh giới file**, đọc như **hồ sơ tra cứu**; onepager **xoá ranh giới file**, một mạch từ đầu đến cuối, đọc như **bản trình bày** |
| `00-introduction.md` (do `ba-portal --client` sinh) | LLM gộp 5 tài liệu discovery, de-dup | introduction là **một chương** của portal; onepager gộp **cả bộ** và **là toàn bộ tài liệu** |
| `ba-release` | gộp roadmap một phase + tiêu chí UAT rồi render | release: phạm vi **một phase**, nội dung **kế hoạch + nghiệm thu**; onepager: phạm vi **cả dự án**, nội dung **vì sao làm · làm gì · làm thế nào** |
| `ba-dashboard` | báo cáo điều hành một trang | dashboard nói **TÌNH TRẠNG** (tiến độ, CR/WI mở, gap, blocked) — ảnh chụp một thời điểm; onepager nói **NỘI DUNG**, không mang số tiến độ nào |

**Không phải bản thay thế `docs/`.** Đây là bản **sinh ra** — nguồn sự thật vẫn là các file trong `docs/`. Sửa nội dung thì sửa ở nguồn rồi chạy lại skill, **không sửa thẳng vào `00-onepager.md`** (sửa ở đó là tạo nguồn sự thật thứ hai, và bên thua luôn là bên git theo dõi).

## Cách gọi

| Lệnh | Làm gì |
|---|---|
| `ba-onepager` | cả dự án |
| `ba-onepager 1,3,5,12` | chỉ các mục đó (số theo khung dưới) |
| `ba-onepager --check` | chỉ soát bản đã có, không viết lại |

## Điều kiện
Cần tối thiểu `01-requirements.md` **hoặc** `00-vision.md`. Không có cả hai → **DỪNG**, route `ba-discover` / `ba-init`. Không có nguồn thì không có gì để gộp — và một onepager viết từ hư không đúng là thứ tài liệu nguy hiểm nhất, vì nó trông như đã được duyệt.

## Quy trình

### GĐ1 — Kiểm kê (cơ giới, 0 token phán đoán)

1. Đọc `conventions.md`.
2. Chạy:
   ```bash
   node .claude/skills/ba-onepager/scripts/scan-sources.js docs --plain
   ```
   Script trả: **mục lục đề xuất** (khung 15 mục, đã **bỏ** mục không có nguồn kèm lý do), **mục dự án có mà khung thiếu**, danh sách **sơ đồ mermaid dùng lại được**, và **kiểm kê mã ID theo từng nguồn** (nguyên liệu dựng Phụ lục B).
3. Đọc các nguồn script liệt kê. Dự án nhiều màn → đọc `srs.md` từng màn; **không** đọc `test.md`/`plan.md`/`html-design.html` (không thuộc tài liệu trình bày).

### GĐ2 — HARD STOP: duyệt mục lục *(đây chính là Cổng phương án của skill này)*

4. In **6 phần** của phương án (`conv-gates.md` → "Cổng phương án"): **Đã đọc** · **Hiểu** · **Sẽ làm** = chính bảng mục lục (`mục · nguồn · giữ/bỏ + lý do`) · **Giả định** · **Câu hỏi chặn** · **Ngoài phạm vi**.
5. **DỪNG chờ duyệt.** Lý do cổng nằm ở mục lục chứ không ở đâu khác: mục lục là chỗ **duy nhất** quyết định bài dài bao nhiêu và bỏ gì — duyệt sau khi đã viết 15.000 chữ thì không ai bảo bỏ mục nữa.
   - **Gọi từ orchestrator đã qua cổng** (`ba-accept`, `ba-release`): vẫn **giữ cổng riêng** — mục lục là thứ cổng cha **chưa từng nhìn thấy**, đúng ngoại lệ mà `conv-gates.md` → "Cổng cha bao phủ cổng con" cho phép. In mục lục rồi chờ, không tự chạy tiếp.

### GĐ3 — Viết

6. Viết `docs/Ho-so/00-onepager.md` theo `assets/template.md`. Bốn luật cứng nằm ngay trong template — đọc trước khi điền.
7. Sơ đồ: **dán nguyên khối ```mermaid từ nguồn**, không vẽ lại. Sơ đồ nguồn sai cú pháp thì sửa **ở nguồn** rồi chép sang.

   > **Đánh đổi kích thước — nói trước để khỏi bất ngờ lúc gửi mail.** `ba-portal` nhúng thẳng mermaid v11.16 (3,4 MB) để file mở được **offline**, nên một onepager có sơ đồ nặng ~3,5 MB dù nội dung chỉ vài chục KB. Đó là cái giá của "tự chứa thật": không nhúng thì sơ đồ phải tải từ CDN và file chết khi không có mạng — đúng lúc người ta mở nó trên máy bay hoặc trong phòng họp không wifi.
   >
   > Cần bản nhẹ: **giữ tối đa 2–3 sơ đồ thật sự cần** (một ngữ cảnh, một luồng chính), hoặc biên dịch trước từng sơ đồ ra SVG tĩnh bằng `ba-figure` rồi nhúng — nhẹ hơn khoảng 290 lần, đổi lại cần Chrome lúc build. **Không** chọn đường "bỏ nhúng cho nhẹ": file 45 KB mà sơ đồ trắng khi offline là tệ nhất trong ba lựa chọn.
8. Dựng **Phụ lục B · Ánh xạ truy vết** từ kiểm kê ID ở bước 2: mỗi mục/tiểu mục ↔ các mã nó gộp từ.

### GĐ4 — Render + soát

9. ```bash
   node .claude/skills/ba-portal/scripts/build.js --single docs/Ho-so/00-onepager.md docs/Ho-so/00-onepager.html
   node .claude/skills/ba-onepager/scripts/scan-sources.js --check docs/Ho-so/00-onepager.md docs --plain
   ```
10. Sửa hết lỗi `--check` rồi mới báo xong. Báo cáo: số mục giữ/bỏ · số chữ · số sơ đồ · độ phủ Phụ lục B · đường dẫn hai file.

## Rule cứng — cấm bịa

| Thứ | Nguồn bắt buộc | Không có thì |
|---|---|---|
| Số liệu, KPI, ngưỡng | `00-vision.md` | ghi *"chưa đặt ngưỡng"* |
| Quyết định kiến trúc | ADR trong `10-architecture.md` | ghi *"chưa chốt"*, đưa xuống mục 15 |
| Ngày tháng lộ trình | `08-roadmap.md` | ghi giai đoạn, **không** ghi ngày |
| Quy tắc nghiệp vụ | `BRule-*` trong `srs.md` | không viết quy tắc đó |
| Ai quyết một việc treo | sổ `PD` (`00-decisions.md`) | ghi *"chưa có người phụ trách"* — **không** đoán tên |

**Thứ tự ưu tiên khi hai rule đánh nhau: Đúng nguồn > Truy vết đủ > Mạch văn > Đủ 15 mục.** Mục cuối xếp bét là cố ý: đây là tài liệu trình bày, nên cám dỗ lớn nhất là viết cho đủ khung. Một bài 9 mục có thật hơn hẳn một bài 15 mục có 6 mục rỗng.

## Tiêu chí chất lượng (BẮT BUỘC)
- `scan-sources.js --check` **0 lỗi**.
- **Không mã ID nào trong thân bài** — mã sống ở Phụ lục B.
- **Không mục rỗng** — thiếu nguồn thì bỏ mục và nói ra ở báo cáo.
- Mọi sơ đồ **chép từ nguồn**, không vẽ mới.
- Mục 15 (Quyết định cần chốt) **có nội dung thật** nếu dự án còn `PD` treo hoặc gap 🔴/🟡 — đây là mục người ký đọc kỹ nhất.

## Lưu ý
- Tiếng Việt. Sơ đồ **có dấu đầy đủ** ở mọi nhãn người đọc thấy (chỉ ID node để ASCII) — xem `conv-mermaid.md`.
- **Không** cập nhật `00-tracking.md`: onepager là bản sinh ra, không phải đặc tả của màn nào.
- Muốn đưa online → `ba-doc-public` (một slug cố định cho `00-onepager.html`).
- Nguồn đổi thì **chạy lại skill**, đừng vá tay vào bản đã sinh.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Tham chiếu
- `conventions.md` — bố cục `docs/`, chuỗi truy vết, `docs/Ho-so/`.
- `conv-gates.md` → "Cổng phương án", "Cổng cha bao phủ cổng con".
- `conv-mermaid.md` — bộ chọn sơ đồ, an toàn cú pháp, luật dấu tiếng Việt.
- `ba-portal/scripts/build.js` — chế độ `--single` (một markdown → một HTML tự chứa).
