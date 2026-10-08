# Dashboard điều hành — TeamTasks

> **Ảnh chụp ngày 2026-08-13** do `ba-dashboard` sinh. Ghi đè mỗi lần chạy — không phải sổ, đừng dùng làm lịch sử.
> Số liệu đếm bằng `collect.js`; phần **Nhận định** viết tay và đã trỏ về số cụ thể.
> **Ô ghi "chưa có dữ liệu" là có chủ đích** — nguồn chưa tồn tại, KHÔNG phải bằng 0.

## 1. Tổng quan

| Chỉ số | Số thực tế | Nguồn |
|---|---|---|
| Màn hình | 6 | `00-tracking.md` |
| Tài liệu hoàn thành | 6 / 6 | `00-tracking.md` |
| Màn lệch (⚠️) | 0 | `00-tracking.md` |
| Dev xong | **0 / 6** | `00-tracking.md` cột `dev` |
| CR đang mở | 3 | `00-cr.md` |
| WI đang mở (Blocked) | 5 (**1**) | `00-backlog.md` |
| Gap | 🔴 2 · 🟡 6 | `Ho-so/00-gaps.md` |
| UAT | 11 ca · Pass 0 · Fail 0 · **chưa chạy 11** | `Ho-so/09-uat.md` |
| ACT còn mở | 2 | `Ho-so/meetings/` |

## 2. Tiến độ theo màn

| Mã | Màn | Tài liệu | Dev | Ghi chú |
|---|---|---|---|---|
| S01 | Login | ✅ | ⬜ | |
| S02 | Dashboard | ✅ | ⬜ | |
| S03 | TaskDetail | ✅ | ⬜ | |
| S04 | UserProfile | ✅ | ⬜ | |
| S05 | Organization | ✅ | ⬜ | |
| S06 | Register | ✅ | ⬜ | |

Tài liệu **9/9 ở cả 6 màn**; chưa màn nào bắt đầu code.

## 3. Phạm vi & độ phủ

`Ho-so/00-traceability.md` có tồn tại nhưng **`collect.js` chưa bóc % độ phủ** → xem mục 9. Không suy số từ file mà chưa parse.

## 4. Chất lượng

| Nguồn | Kết quả | Ghi chú |
|---|---|---|
| Gap (`ba-review`) | 🔴 2 · 🟡 6 | chi tiết ở `Ho-so/00-gaps.md` |
| UAT | 11 ca, **chưa chạy ca nào** | kịch bản đã soạn, chưa nghiệm thu |
| Đối chiếu code (`ba-conformance`) | **chưa chạy** | không có `00-conformance.md` → dashboard **không kết luận gì** về code |

## 5. Milestone / Release

| Phase | Phạm vi | Trạng thái | Nguồn |
|---|---|---|---|
| phase-1 | *(xem roadmap)* | chưa dev | `Ho-so/08-roadmap.md` |
| phase-2 | *(xem roadmap)* | chưa bắt đầu | `Ho-so/08-roadmap.md` |
| phase-3 | *(xem roadmap)* | chưa bắt đầu | `Ho-so/08-roadmap.md` |

> Roadmap **không ghi ngày lịch** → cột ngày để trống có chủ đích, không suy từ tên phase.

## 6. Blocked · Overdue · Critical

| Hạng mục | Mã | Vì sao tắc | Cần ai gỡ |
|---|---|---|---|
| Work Item | **WI-03** (Blocked) | chờ điều kiện từ `ACT-06` | IT/DevOps |
| Action item | **ACT-06** | quá hạn 2026-08-04, chưa xong | IT/DevOps |
| Gap | 2 gap 🔴 | chặn gate `ba-review` | BA |

## 7. Nhận định

- **Tài liệu đã sẵn sàng, dev chưa khởi động** — 6/6 màn đủ 9/9 tài liệu nhưng `dev = 0/6` (mục 1, 2). Nút thắt hiện nằm ở khâu bắt đầu code, không phải khâu đặc tả.
- **Một chuỗi phụ thuộc đang tắc**: `ACT-06` quá hạn → `WI-03` `Blocked` (mục 6). Đây là việc hạ tầng, gỡ được thì thông cả hai.
- **11 kịch bản UAT soạn xong nhưng chưa chạy ca nào** (mục 4) — hợp lý vì chưa có code, nhưng nghĩa là **chưa có bằng chứng chất lượng nào** ngoài tài liệu.
- **2 gap 🔴 đang chặn** (mục 4) — cần xử lý trước khi mở khâu dev, không thì lệch sẽ nhân lên qua từng màn.
- **Không có nhận định nào về chất lượng code** vì `ba-conformance` chưa chạy — đây là khoảng trắng có ý thức, không phải "code ổn".

## 8. Việc cần PM/Stakeholder quyết

| Việc | Vì sao cần quyết | Hạn đề xuất | Skill xử lý |
|---|---|---|---|
| Gỡ `ACT-06` (hạ tầng) | đang chặn `WI-03` | — | `ba-task status WI-03` |
| Xử lý 2 gap 🔴 | chặn gate trước khi dev | — | `ba-review` |
| Chốt thời điểm khởi động dev | 6 màn có plan mà chưa ai bắt đầu | — | `dev-run` |
| 3 CR đang mở | chưa Đóng, còn treo phạm vi | — | `ba-change-request list` |

## 9. Câu hỏi mở / Thiếu dữ liệu

| Thiếu gì | Ảnh hưởng mục nào | Cách bổ sung |
|---|---|---|
| % độ phủ truy vết | mục 3 để trống | `collect.js` chưa bóc `00-traceability.md` — **hạn chế đã biết của bản này** |
| Đối chiếu code | mục 4 | chạy `ba-conformance` |
| Ngày lịch của phase | mục 5 | roadmap chưa chốt ngày — cần PO |
| Phạm vi từng phase | mục 5 | `collect.js` mới lấy tên phase, chưa lấy danh sách `F..` |

## Thuật ngữ
| Thuật ngữ | Giải thích |
|---|---|
| Ảnh chụp | Báo cáo phản ánh trạng thái đúng lúc chạy, không tự cập nhật |
| Số thực tế | Đếm được từ tài liệu — truy được về nguồn |
| Nhận định | Suy luận của người viết dựa trên số thực tế |
| Chưa có dữ liệu | Nguồn chưa tồn tại — **khác** giá trị 0 |

> Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`.
