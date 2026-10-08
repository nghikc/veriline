# Khung `SKILL.md` sinh ra — `ba-new-skill` dùng làm mẫu

> Chép khung dưới, thay `<…>`, **xoá mọi mục không dùng**. Skill dài không bằng skill rõ.
> Mỗi mục kèm ghi chú *(vì sao có)* — xoá ghi chú khi sinh file thật.

---

```markdown
---
name: <ten-skill>
description: Use when <tình huống cụ thể người dùng đang gặp> — <làm gì, ra cái gì>; <khi nào KHÔNG dùng / khác skill nào>.
---

# <ten-skill> — <một dòng tiếng Việt>

## Mục tiêu
<2–4 câu: giải quyết vấn đề gì, cho ai. Nêu thẳng thứ mà chưa skill nào làm được.>

> **Khác các skill gần kề:** `<skill-A>` <việc A>; `<skill-B>` <việc B>; **skill này** <việc mình>.
> *(Câu ranh giới của GĐ1 bước 3. Không viết được câu này = chưa đủ rõ để làm skill.)*

## Điều kiện
- **Cần:** <file/trạng thái bắt buộc>. Thiếu → dừng, route sang `<skill>` trước.
- **Nên có:** <file tùy chọn> — thiếu vẫn chạy được nhưng <hệ quả>.
- <Tài liệu bổ trợ đọc ở `docs/Ho-so/<tên>`; **không thấy thì tìm ở gốc `docs/`** (dự án cài trước 13/08/2026).>

## Quy trình

<!-- Ghi >2 file hoặc gọi ≥2 skill con → BẮT BUỘC có bước 0 này, không thì lint check 11 báo lỗi -->
0. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Đọc <nguồn> TRƯỚC → trình phương án đủ 6 phần (Đã đọc · Hiểu · Sẽ làm `bước · file TẠO/SỬA · điều kiện dừng` · Giả định · Câu hỏi chặn · Ngoài phạm vi) → `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. <Nêu vì sao skill này luôn/không luôn trên ngưỡng.>

1. <Bước — động từ đứng đầu, nói rõ đọc gì trước khi ghi gì.>
2. <Phần CƠ GIỚI thì gọi script, đừng để LLM đếm:>
   ```bash
   node .claude/skills/<ten-skill>/<script>.js [tham số]
   ```
   Đọc JSON trả về, **đừng tự đi đếm lại**.
3. **Gate:** <invoke `ba-review <scope>` — còn 🔴/🟡 → dừng.>
4. **Ghi `<đường/dẫn/file>`** theo `template.md` (cùng thư mục).
5. **Định tuyến (nêu, KHÔNG tự làm):** <đổi baseline → `ba-change-request`; việc dev mới → `ba-task`; …>
6. **Báo cáo:** <đã tạo gì · còn treo gì · bước kế>.

## Nối luồng
- **`<skill trước>`** — <chạy trước vì sao>.
- **`<skill sau>`** — <chạy sau vì sao>.
- **`ba-track`** — <nếu chạm màn: nhắc cập nhật `00-tracking.md` + cột "Cập nhật cuối">.

## Rule cứng — TUYỆT ĐỐI không bịa *(câu 9)*
Không tự suy đoán: <liệt kê ĐÍCH DANH — vd: trạng thái · hạn · người phụ trách · số liệu · công thức tính · wording thông báo lỗi>. Thiếu hoặc mâu thuẫn → đưa vào **Câu hỏi mở** và **dừng**, không điền tạm cho đủ.

## Thứ tự ưu tiên khi rule xung đột *(câu 10)*
`<vd: Chính xác > Toàn vẹn dữ liệu > Đầy đủ > Trình bày>` — <một câu nói rõ hệ quả: "thà thiếu mục còn hơn điền số không có nguồn">.

## Tiêu chí chất lượng (BẮT BUỘC)
- <Tiêu chí ĐO ĐƯỢC, không phải tính từ. Vd: "mỗi dòng phải trỏ ít nhất một mã trong chuỗi truy vết">
- <Điều kiện coi là hỏng — nói thẳng: "tự chế wording lỗi = lỗi nặng">

## Lưu ý
- **Không <việc skill này KHÔNG được làm>** — đó là việc của `<skill khác>`.
- <Bẫy đã biết, kèm lý do đừng gỡ đi.>
- Tiếng Việt; <quy ước đặt tên/ngày tháng nếu có>.
```

---

## Checklist trước khi coi là xong

**Nội dung**
- [ ] `description` bắt đầu `Use when …`, đọc xong biết **khi nào gọi** và **khi nào không**
- [ ] Có **câu ranh giới** với skill gần kề
- [ ] Output khoá bằng **template/tên file cụ thể**, không bằng "đầy đủ/chi tiết"
- [ ] **Điểm dừng có thật** — thiếu thông tin thì hỏi, không tự đoán
- [ ] Ghi >2 file → có **Cổng phương án**
- [ ] Phần đếm-được đã tách sang **script**, không để LLM làm

**Đăng ký** *(chạy `register.js` lo 4 chỗ đầu)*
- [ ] index `ba-toolkit/SKILL.md` · [ ] `explain/README.md` §2 · [ ] mục trong file explain nhóm + header count · [ ] số đếm `CLAUDE.md`
- [ ] *(tay)* `doc.00`/`doc.NN` nếu sinh tài liệu cấp dự án
- [ ] *(tay)* `gate.plan.skills` nếu có Cổng phương án

**Kiểm**
- [ ] `node .claude/skills/ba-toolkit/scripts/lint.js` → **0 lỗi**
- [ ] **Ca 1** đủ thông tin → output đúng template
- [ ] **Ca 2** thiếu thông tin → **skill DỪNG LẠI HỎI** (tự bịa = hỏng, quay lại sửa "Điểm dừng")
- [ ] Sửa lỗi xong chạy lại bằng **ca khác**, không phải ca cũ
