# Dashboard điều hành — <Tên dự án>

> **Ảnh chụp ngày `<YYYY-MM-DD>`** do `ba-dashboard` sinh. Ghi đè mỗi lần chạy — không phải sổ, đừng dùng làm lịch sử.
> Số liệu đếm bằng `collect.js`; phần **Nhận định** do người/LLM viết và đã trỏ về số cụ thể.
> **Ô ghi "chưa có dữ liệu" là có chủ đích** — nghĩa là nguồn chưa tồn tại, KHÔNG phải bằng 0.

## 1. Tổng quan

| Chỉ số | Số thực tế | Nguồn |
|---|---|---|
| Màn hình | — | `00-tracking.md` |
| Tài liệu hoàn thành | — / — | `00-tracking.md` |
| Màn lệch (⚠️) | — | `00-tracking.md` |
| Dev xong | — / — | `00-tracking.md` cột `dev` |
| CR đang mở | — | `00-cr.md` |
| WI đang mở (Blocked) | — (—) | `00-backlog.md` |
| Gap | 🔴 — · 🟡 — | `Ho-so/00-gaps.md` |
| UAT | — ca · Pass — · Fail — · chưa chạy — | `Ho-so/09-uat.md` |
| ACT còn mở | — | `Ho-so/meetings/` |

## 2. Tiến độ theo màn

| Mã | Màn | Tài liệu | Dev | Ghi chú |
|---|---|---|---|---|
| — | — | — | — | — |

## 3. Phạm vi & độ phủ

<Độ phủ truy vết nếu có `Ho-so/00-traceability.md`; không có → "chưa có dữ liệu — chạy `ba-trace`".>

## 4. Chất lượng

| Nguồn | Kết quả | Ghi chú |
|---|---|---|
| Gap (`ba-review`) | — | |
| UAT | — | |
| Đối chiếu code (`ba-conformance`) | — | *chưa chạy → ghi rõ, không suy đoán* |

## 5. Milestone / Release

| Phase | Phạm vi | Trạng thái | Nguồn |
|---|---|---|---|
| — | — | — | `Ho-so/08-roadmap.md` |

> **Không suy ngày ra mắt từ tên phase.** Roadmap không ghi ngày → để trống + nêu ở Câu hỏi mở.

## 6. Blocked · Overdue · Critical

| Hạng mục | Mã | Vì sao tắc | Cần ai gỡ |
|---|---|---|---|
| — | — | — | — |

## 7. Nhận định *(người viết — không phải số đếm)*

> Mỗi ý phải trỏ về một con số ở mục 1–6. Không có số đỡ lưng thì không viết.

- —

## 8. Việc cần PM/Stakeholder quyết

| Việc | Vì sao cần quyết | Hạn đề xuất | Skill xử lý |
|---|---|---|---|
| — | — | — | — |

## 9. Câu hỏi mở / Thiếu dữ liệu

| Thiếu gì | Ảnh hưởng mục nào | Cách bổ sung |
|---|---|---|
| — | — | chạy `<skill>` |

## Thuật ngữ
| Thuật ngữ | Giải thích |
|---|---|
| Ảnh chụp | Báo cáo phản ánh trạng thái đúng lúc chạy, không tự cập nhật |
| Số thực tế | Đếm được từ tài liệu — truy được về nguồn |
| Nhận định | Suy luận của người viết dựa trên số thực tế |
| Chưa có dữ liệu | Nguồn chưa tồn tại — **khác** giá trị 0 |

> Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`.
