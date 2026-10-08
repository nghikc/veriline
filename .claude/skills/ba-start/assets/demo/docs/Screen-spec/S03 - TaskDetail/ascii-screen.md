# Wireframe — Chi tiết công việc

## Bố cục chính (desktop ≥ 1024px)

```
+----------------------------------------------------------------------+
| [TeamTasks]                                      [🔔 3]  [Avatar ▾]  |
+----------------------------------------------------------------------+
| [← Quay lại Dashboard]                                               |
+----------------------------------------------------------------------+
|                                                                      |
|  Viết tài liệu API cho module thanh toán            [Sửa thông tin]  |
|  [ĐANG LÀM]  [Ưu tiên: Cao]                                          |
|                                                                      |
|  Người giao   : Nguyễn A (Team Lead)                                 |
|  Người làm    : Lê C                                                 |
|  Deadline     : 20/06/2026 17:00                                     |
|  Tạo lúc      : 12/06/2026 09:15                                     |
|  Cập nhật     : 14/06/2026 10:02                                     |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | Mô tả                                                          |  |
|  | Viết tài liệu mô tả toàn bộ endpoint của module thanh toán,    |  |
|  | kèm ví dụ request/response cho từng mã lỗi.                     |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +--- Thanh hành động (chỉ hiện nút HỢP LỆ) ----------------------+  |
|  |  [ Gửi duyệt ]                          [ Huỷ công việc ]      |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
+----------------------------------------------------------------------+
|  ┌── Lịch sử thay đổi ──────────┐  ┌── Bình luận (4) ─────────────┐  |
|  │ ● 14/06 10:02 · Lê C         │  │ Nguyễn A · 12/06 09:20       │  |
|  │   Trạng thái                 │  │ Ưu tiên làm trước phần lỗi.  │  |
|  │   Cần làm → Đang làm         │  │                              │  |
|  │                              │  │ Lê C · 13/06 14:30           │  |
|  │ ● 12/06 09:18 · Nguyễn A     │  │ Đã xong phần endpoint chính. │  |
|  │   Deadline                   │  │                              │  |
|  │   18/06 17:00 → 20/06 17:00  │  │ [ Xem bình luận cũ hơn ]     │  |
|  │                              │  ├──────────────────────────────┤  |
|  │ ● 12/06 09:15 · Nguyễn A     │  │ [ Viết bình luận...        ] │  |
|  │   Tạo công việc              │  │                    [ Gửi ]   │  |
|  └──────────────────────────────┘  └──────────────────────────────┘  |
+----------------------------------------------------------------------+
```

## Thanh hành động — biến thể theo trạng thái × vai trò

```
Trạng thái TODO      · người thực hiện   →  [ Bắt đầu làm ]           [ Huỷ công việc ]*
Trạng thái IN_PROGRESS · người thực hiện →  [ Gửi duyệt ]             [ Huỷ công việc ]*
Trạng thái IN_REVIEW · Team Lead/Admin   →  [ Duyệt hoàn thành ] [ Từ chối ]  [ Huỷ công việc ]
Trạng thái IN_REVIEW · người thực hiện   →  (không nút — chờ duyệt, hiện chữ "Đang chờ duyệt")
Trạng thái DONE                          →  (không nút — thanh hành động ẩn hẳn)
Trạng thái CANCELLED                     →  (không nút — banner "Công việc đã huỷ")
Người xem không liên quan (Member khác)  →  (không nút — chỉ đọc + bình luận được)

* [ Huỷ công việc ] chỉ hiện với Team Lead / Org Admin.
```

## Modal "Từ chối" (bắt buộc nhập lý do)

```
+---------------------------------------------+
|  Từ chối công việc                     [×]  |
+---------------------------------------------+
|  Công việc sẽ quay lại trạng thái Đang làm. |
|                                             |
|  Lý do từ chối *                            |
|  +---------------------------------------+  |
|  | Thiếu ví dụ cho mã lỗi 409.           |  |
|  +---------------------------------------+  |
|  0/1000 ký tự                               |
|                                             |
|          [ Huỷ bỏ ]   [ Xác nhận từ chối ]  |
+---------------------------------------------+
```

## Trạng thái không tìm thấy

```
+----------------------------------------------------------------------+
|                            (  ?  )                                   |
|                  Không tìm thấy công việc                            |
|      Công việc không tồn tại hoặc bạn không có quyền truy cập.       |
|                     [ Về Dashboard ]                                 |
+----------------------------------------------------------------------+
```

## Bố cục hẹp (mobile < 768px)

Hai cột dưới **xếp chồng** thành tab để không phải cuộn ngang:

```
+--------------------------------+
| [←] Chi tiết công việc   [🔔3] |
+--------------------------------+
| Viết tài liệu API cho module.. |
| [ĐANG LÀM] [Cao]               |
| Người làm: Lê C                |
| Deadline : 20/06 17:00         |
| ...                            |
+--------------------------------+
| [ Gửi duyệt ]                  |
+--------------------------------+
| ( Bình luận )  ( Lịch sử )     |  <- tab
+--------------------------------+
| Nguyễn A · 12/06 09:20         |
| Ưu tiên làm trước phần lỗi.    |
| ...                            |
| [ Viết bình luận...    ][Gửi]  |
+--------------------------------+
```

## Chú thích các thành phần

- **Nút quay lại**: về S02 Dashboard, giữ nguyên bộ lọc người dùng đang dùng trước đó.
- **Badge trạng thái**: 5 giá trị — Cần làm · Đang làm · Chờ duyệt · Hoàn thành · Đã huỷ; màu lấy từ token `07-design-system.md`, **không** chỉ dựa vào màu (kèm chữ) để đạt a11y.
- **Badge ưu tiên**: Thấp · Trung bình · Cao · Khẩn cấp.
- **Deadline**: tô đỏ + biểu tượng ⚠ khi quá hạn (deadline < hiện tại và trạng thái ∉ {Hoàn thành, Đã huỷ}).
- **Nút "Sửa thông tin"**: chỉ Team Lead / Org Admin; mở modal dùng lại bộ trường và validation của modal tạo việc ở S02.
- **Thanh hành động**: chỉ render nút **hợp lệ với trạng thái hiện tại VÀ vai trò người xem** — nút không hợp lệ không tồn tại trong DOM, không phải bị làm mờ.
- **Dòng thời gian lịch sử**: mới → cũ, mỗi mục là *ai · trường nào · giá trị cũ → giá trị mới · lúc nào*; dòng cuối cùng luôn là "Tạo công việc".
- **Khu bình luận**: cũ → mới (đọc như hội thoại), ô nhập ở dưới cùng; bình luận đã gửi **không có nút sửa/xoá** (bất biến, giai đoạn 1).
- **Bộ đếm ký tự** ở ô bình luận và ô lý do từ chối: hiện `n/1000`, chuyển đỏ khi vượt.
