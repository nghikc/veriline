---
name: ba-dashboard
description: Use when PM/Project Lead cần BÁO CÁO ĐIỀU HÀNH một trang — tiến độ tài liệu & dev theo màn, CR/WI mở, milestone, UAT, gap, Blocked/Overdue; sinh docs/Ho-so/00-dashboard.md.
---

# ba-dashboard — Báo cáo điều hành cho PM

## Mục tiêu
Một trang trả lời được câu PM hỏi mỗi tuần: **dự án đang ở đâu, cái gì đang tắc, ai cần quyết gì.** Gom số từ mọi sổ/ma trận sẵn có thay vì bắt PM mở 6 file.

> **Khác các skill gần kề:** `ba-portal` render dashboard ở **trang đầu cổng TÀI LIỆU** — đo *độ phủ doc*, đọc phải mở `portal.html`. `ba-next` trả lời *"chạy skill gì tiếp"*. **`ba-dashboard` là báo cáo ĐIỀU HÀNH** — thêm milestone, UAT, WI Blocked, ACT quá hạn, code lệch đặc tả; **một file `.md` riêng**, gửi đi được. Không chồng nhau.

## Điều kiện
- **Cần:** `docs/00-tracking.md` (không có → dừng, route `ba-track`).
- **Nên có:** `00-cr.md` · `00-backlog.md` · `Ho-so/08-roadmap.md` · `Ho-so/09-uat.md` · `Ho-so/00-gaps.md` · `Ho-so/00-conformance.md` · `Ho-so/meetings/`. Thiếu cái nào thì **mục đó ghi "chưa có dữ liệu"**, KHÔNG suy ra 0.
- Tài liệu bổ trợ tìm ở `docs/Ho-so/`; **không thấy thì tìm ở gốc `docs/`** (dự án cài trước 13/08/2026). Script đã lo qua `docpath.js`.

## Quy trình

1. **Chạy script (cơ giới, 0 token):**
   ```bash
   node .claude/skills/ba-dashboard/scripts/collect.js [docsDir=docs] [--plain]
   ```
   Trả JSON: `manHinh` (tổng/tài liệu xong/lệch/dev xong/chưa) · `cr.mo` · `wi.mo`+`blocked` · `phases` · `uat` (tổng/pass/fail/blocked/chưa chạy) · `gap` · `doiChieuCode` · `actMo` · **`thieuNguon`**.
   **Đọc JSON, KHÔNG tự đi đếm lại.** Script không phán xét gì — không tô RAG, không tính health score (mọi ngưỡng đó là quy ước chưa ai chốt).

2. **Đối chiếu `thieuNguon` trước khi viết.** Nguồn nào thiếu → mục tương ứng ghi **"chưa có dữ liệu — chạy `<skill>`"**, tuyệt đối không điền 0 hay ước lượng.

3. **Viết phần NHẬN ĐỊNH** (đây là phần script không làm được):
   - **Điểm tắc**: WI `Blocked`, UAT `Fail`, gap 🔴, ACT quá hạn, màn ⚠️ lệch tài liệu.
   - **Việc cần PM/stakeholder quyết**: CR đang chờ duyệt, ADR còn `Draft` chặn dev, câu hỏi mở treo lâu.
   - Mỗi nhận định phải **trỏ được về số cụ thể** trong JSON. Không có số đỡ lưng → không viết.

4. **Ghi `docs/Ho-so/00-dashboard.md`** theo `template.md` (cùng thư mục). Ghi đè bản cũ — đây là **ảnh chụp**, không phải sổ.

5. **Định tuyến (nêu, KHÔNG tự làm):** gap 🔴 → `ba-review` · màn ⚠️ → `ba-track` · chưa có `00-conformance.md` → `ba-conformance` · UAT chưa chạy → `ba-accept` · WI Blocked → `ba-task status`.

6. **Báo cáo:** đường dẫn file · 3 con số nổi bật · danh sách nguồn thiếu · việc đề xuất.

## Rule cứng — TUYỆT ĐỐI không bịa
Không tự suy đoán: **trạng thái · tiến độ (%) · deadline · người phụ trách · số liệu · công thức tính · mức rủi ro**. Thiếu hoặc mâu thuẫn → ghi vào mục **Câu hỏi mở** và **dừng**, không điền tạm cho đủ mục.

Cụ thể, **cấm** các hành vi sau:
- Suy % tiến độ khi `00-tracking.md` không có cột tương ứng.
- Gán màu RAG / "health score" — **chưa quy ước nào định nghĩa ngưỡng**, tự đặt là bịa.
- Coi nguồn thiếu là 0 (vd không có `09-uat.md` → viết "UAT: 0 ca" ❌ → phải là "chưa có kế hoạch UAT").
- Suy ngày ra mắt từ tên phase.

## Thứ tự ưu tiên khi rule xung đột
`Chính xác > Toàn vẹn dữ liệu > Đầy đủ > Trình bày` — **thà thiếu một mục còn hơn điền số không có nguồn.** Dashboard trông đẹp mà sai số thì tệ hơn dashboard có ô ghi "chưa có dữ liệu".

## Tiêu chí chất lượng (BẮT BUỘC)
- **Mỗi con số trỏ được về nguồn** (`Metric → Nguồn → Cách tính → Kết quả`); không truy được nguồn = không đưa lên dashboard.
- **Mục thiếu nguồn phải hiện diện** với ghi chú "chưa có dữ liệu" — ẩn đi là làm PM tưởng đã soát.
- Phân biệt rõ **Số thực tế** (đếm được) và **Nhận định** (suy luận của người viết) — không trộn hai loại trong một dòng.
- Có ngày chụp; đọc lại sau 1 tuần phải biết số đã cũ.

## Nối luồng
- **`ba-conformance`** — chạy trước thì dashboard có thêm phần code lệch đặc tả; không có thì mục đó ghi rõ "chưa chạy".
- **`ba-accept`** — GĐ4 nên chạy `ba-dashboard` để có ảnh chụp trước nghiệm thu.
- **`ba-next`** — trả lời "chạy gì tiếp"; `ba-dashboard` trả lời "đang thế nào". Hai câu khác nhau.

## Ranh giới
- KHÁC dashboard của `ba-portal` (trang đầu cổng tài liệu, chỉ đo độ phủ doc).

## Lưu ý
- **Không sửa gì cả** — không đụng `00-tracking.md`, không mở CR/WI, không sửa tài liệu nguồn. Chỉ đọc + ghi đúng một file.
- **Là ảnh chụp, không phải sổ** — ghi đè mỗi lần chạy (khác `00-cr.md`/`00-backlog.md`/`00-changelog.md` không xoá dòng).
- Tiếng Việt; ngày `YYYY-MM-DD`; sơ đồ (nếu có) theo luật Mermaid — **tiếng Việt có dấu**.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
