# Template — User Requirements Document (`ba-discover urd`)

Ghi ra `docs/Ho-so/00-urd.md` (cấp dự án) hoặc `docs/urd/<feature>.md` (một feature). Tiêu đề đổi theo phạm vi.
Mọi nội dung **solution-free** — xem "Luật vàng" trong `SKILL.md`. `<…>` là chỗ điền, xoá phần chú thích nghiêng khi ghi thật.

---

# <Tên dự án / feature> — Tài liệu Yêu cầu Người dùng (URD)

> Nguồn: `<00-brainstorm.md mục N · 00-personas.md · biên bản họp <ngày> · phỏng vấn …>` · Phạm vi: `<cả dự án | feature X>` · Cập nhật: `<YYYY-MM-DD>`

## 1. Mục đích

<2–4 câu: người dùng nào, đang cố đạt điều gì, tài liệu này mô tả nhu cầu ở phạm vi nào. Không mô tả giải pháp.>

### Vấn đề & trải nghiệm hiện tại

| Người dùng | Tình huống hiện tại | Vấn đề | Hậu quả với họ | Bằng chứng |
|-----------|--------------------|--------|----------------|-----------|
| <Nhóm người dùng> | <Họ đang xoay xở thế nào khi chưa có hệ thống> | <Cái gì hỏng/khó> | <Họ mất gì: thời gian, tiền, động lực, bỏ cuộc> | Đã xác nhận: `<nguồn>` |
| <…> | <…> | <…> | <…> | Quan sát: `<nguồn>` |

## 2. Nhóm người dùng

| Mức | Nhóm người dùng | Bối cảnh sử dụng | Mục tiêu chính | Nỗi đau |
|-----|-----------------|------------------|----------------|---------|
| chính | <Tên nhóm> `<PS-01 nếu có>` | <thiết bị, môi trường, tần suất, khu vực> | <họ muốn đạt gì> | <cản trở hiện tại> |
| phụ | <…> | <…> | <…> | <…> |

> <Ghi chú phân nhóm: vì sao tách/gộp nhóm này. Cùng một người nhưng khác cách dùng thì nói rõ.>

## 3. Ranh giới phạm vi

### Trong phạm vi

- <Nhu cầu/nhóm nhu cầu được phục vụ ở đợt này — viết bằng ngôn ngữ người dùng.>

### Ngoài phạm vi

- <Cái không làm> — *<lý do: để bản sau / thuộc feature khác / không áp dụng>*

## 4. Nhu cầu người dùng

| Mã | Người dùng | Bối cảnh / Kích hoạt | Nhu cầu | Kết quả mong đợi | Mức quan trọng | Bằng chứng |
|----|-----------|----------------------|---------|------------------|----------------|-----------|
| UN-01 | <nhóm> | <khi nào nhu cầu này xuất hiện> | <họ cần gì — lời người dùng, không lời hệ thống> | <quan sát được là đã đạt> | Critical | Đã xác nhận: `<nguồn>` |
| UN-02 | <…> | <…> | <…> | <…> | High | Quan sát: `<nguồn>` |
| UN-03 | <…> | <…> | <…> | <…> | Medium | Giả định → `GĐ-01` |

*Mức quan trọng: **Critical** (không có thì người dùng không hoàn tất được việc chính) · **High** (rào cản lớn) · **Medium** (đáng kể) · **Low** (nice-to-have).*

## 5. Hành trình ưu tiên

### Hành trình 1: <Người dùng làm được việc gì>

- **Người dùng:** <nhóm>
- **Mức quan trọng:** <Critical/High/…>
- **Kích hoạt:** <điều gì khiến họ bắt đầu>
- **Kết quả mong đợi:** <trạng thái cuối có giá trị với họ>
- **Nhu cầu liên quan:** UN-01, UN-02

1. <Bước theo góc nhìn người dùng — họ làm gì, không phải hệ thống làm gì.>
2. <…>

**Kiểm chứng độc lập:** <Cách quan sát được rằng hành trình này đã đạt, không cần hành trình nào khác.>

### Hành trình 2: <…>

<lặp cấu trúc trên — tổng 3–6 hành trình then chốt>

## 6. Ngoại lệ & tình huống biên

> Mỗi ngoại lệ một mã `UE-..` (không đánh lại số). URD **không** trỏ xuống màn — màn xử lý sẽ **trích ngược** `UE-..` (cột Trace của `E-S..`, Nguồn của `R-S..`). Cột cuối chỉ điền khi chưa màn nào xử lý: `n/a — lý do` hoặc `OQ-..` (Mục 10). Để `—` khi đã/ sẽ có màn xử lý.

| Mã | Tình huống | Ảnh hưởng tới người dùng | Kết quả người dùng cần thấy | Mức | Hành trình / Nhu cầu | Chưa màn nào xử lý (lý do / OQ) |
|----|-----------|--------------------------|-----------------------------|-----|----------------------|--------------------------------|
| UE-01 | <cái gì đi sai: nhập sai, hết hạn, mất mạng, trùng dữ liệu, quá số lần…> | <họ bị kẹt ở đâu> | <họ được biết gì và làm gì tiếp — không mô tả cách hiện thực> | <Critical/High/Medium/Low> | Hành trình 1 / UN-02 | — |
| UE-02 | <…> | <…> | <…> | <…> | <…> | n/a — <vì sao không màn nào xử lý> *hoặc* `OQ-..` |

## 7. Ràng buộc phía người dùng

- **Ngôn ngữ & cách diễn đạt:** <…>
- **Thiết bị & kênh chính:** <…>
- **Năng lực số / bối cảnh sử dụng:** <…>
- **Pháp lý & quyền riêng tư ảnh hưởng tới trải nghiệm:** <…>
- <ràng buộc khác do người dùng/bối cảnh áp đặt>

## 8. Giả định & cách kiểm chứng

| Mã | Giả định | Ảnh hưởng nếu sai | Trạng thái | Việc kế tiếp |
|----|----------|-------------------|-----------|--------------|
| GĐ-01 | <điều đang giả định> | <hỏng ở đâu nếu sai> | Đề xuất / Đã xác nhận / Đã sửa / Đã bỏ / ⚠️ chưa xác nhận | <ai xác nhận, ở bước nào> |

## 9. Tiêu chí thành công của người dùng

| Mã | Kết quả người dùng | Hiện trạng (baseline) | Mục tiêu | Cách đo | Kỳ rà soát |
|----|--------------------|----------------------|----------|---------|-----------|
| USC-01 | <người dùng đạt được gì — không phải "đã build xong X"> | <số nền, hoặc "Chưa có — xác lập trong N tuần sau ra mắt"> | <ngưỡng cụ thể> | <đo bằng gì> | <hàng tháng/quý> |

## 10. Câu hỏi mở

| Mã | Câu hỏi | Cần ai trả lời | Chặn bước nào |
|----|---------|----------------|---------------|
| OQ-01 | <chưa quyết được điều gì> | <vai trò/người> | <bước bị chặn nếu không có trả lời> |

*<Hết câu hỏi mở thì ghi rõ: "Không còn câu hỏi mở — các điểm chưa chắc còn lại nằm ở Mục 8 dưới dạng giả định." Không để mục trống.>*

## Truy vết xuống bước sau

| Mã nhu cầu | Đã phủ bởi | Xử lý |
|-----------|-----------|-------|
| UN-01 | `<FR-03>` *(hoặc "— chưa")* | <Đưa vào `ba-requirements` / Mở `CR-..` / Mở `WI-..` / Ghi lý do loại> |

## Lịch sử cập nhật

| Ngày | Thay đổi | Nguồn |
|------|----------|-------|
| <YYYY-MM-DD> | <tạo mới / thêm UN-.. / đổi phạm vi> | <họp, phỏng vấn, CR-..> |

## Thuật ngữ

| Thuật ngữ | Giải thích |
|-----------|-----------|
| URD (User Requirements Document) | Tài liệu yêu cầu người dùng — mô tả người dùng cần gì, chưa nói hệ thống làm thế nào |
| UN (User Need) | Nhu cầu người dùng — một nhu cầu nguyên tử có bối cảnh và kết quả mong đợi |
| USC (User Success Criteria) | Tiêu chí thành công đo bằng kết quả người dùng đạt được |
| Baseline | Số nền hiện tại, làm mốc so sánh cho mục tiêu |

> Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`.
