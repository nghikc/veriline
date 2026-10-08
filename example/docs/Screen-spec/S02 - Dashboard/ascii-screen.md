# Wireframe — Dashboard

## Màn chính (Default)

```
+----------------------------------------------------------------------------------+
| [TeamTasks]                                              [🔔 3]  [Avatar ▾]      |
+----------------------------------------------------------------------------------+
| Chào, Nguyễn Văn A!                                  [+ Tạo công việc]           |
|                                                      (chỉ Team Lead / Org Admin) |
| +----------+ +----------+ +----------+ +----------+ +----------+                 |
| | Tổng     | | Cần làm  | | Đang làm | | Hoàn thành| | Quá hạn |                 |
| |   24     | |    8     | |    6     | |    9      | |   1 ⚠   |                 |
| +----------+ +----------+ +----------+ +----------+ +----------+                 |
|                                                                                  |
| [Lọc trạng thái ▾] [Lọc ưu tiên ▾]              [🔍 Tìm theo tiêu đề.......]    |
|                                                                                  |
| +------------------------------------------------------------------------------+|
| | Tiêu đề                  | Người thực hiện | Deadline    | Ưu tiên | Trạng thái||
| |--------------------------|-----------------|-------------|---------|-----------||
| | Thiết kế trang chủ       | (av) Trần B     | 14/06 17:00 | Cao     | Đang làm  ||
| | Viết tài liệu API        | (av) Lê C       | 12/06 09:00 | Khẩn cấp| Cần làm ⚠ ||
| | Sửa lỗi đăng nhập        | (av) Ng. V. A   | 20/06 17:00 | Trung   | Đang duyệt||
| | ...                      |                 |             |         |           ||
| +------------------------------------------------------------------------------+|
|                                       [Tải thêm]                                 |
+----------------------------------------------------------------------------------+
```

## Modal "Tạo công việc" (mở từ nút [+ Tạo công việc])

```
+--------------------------------------------------+
|  Tạo công việc mới                          [×]  |
+--------------------------------------------------+
|  Tiêu đề *                                       |
|  [_____________________________________]         |
|  Mô tả                                           |
|  [_____________________________________]         |
|  [_____________________________________]         |
|  Người thực hiện *        Deadline *             |
|  [Chọn thành viên ▾]      [12/06/2026 17:00 📅]  |
|  Mức ưu tiên                                     |
|  ( ) Thấp  (•) Trung bình  ( ) Cao  ( ) Khẩn cấp |
|                                                  |
|              [Huỷ]        [Tạo công việc]        |
+--------------------------------------------------+
```

## Panel thông báo (mở từ chuông 🔔)

```
+--------------------------------------------+
| Thông báo                [Đọc tất cả]      |
+--------------------------------------------+
| ● Bạn được giao "Viết tài liệu API"        |
|   2 phút trước                             |
| ● Trần B chuyển "Thiết kế trang chủ"       |
|   sang Đang duyệt · 1 giờ trước            |
| ○ Lê C bình luận trong "Sửa lỗi..."        |
|   Hôm qua                                  |
+--------------------------------------------+
| ● = chưa đọc   ○ = đã đọc                  |
+--------------------------------------------+
```

Chú thích các thành phần:
- **Header:** logo (về Dashboard), chuông 🔔 + badge số thông báo chưa đọc (tối đa "99+"), avatar menu ▾ (Hồ sơ cá nhân / Tổ chức — chỉ Lead & Admin / Đăng xuất).
- **5 thẻ thống kê:** đếm theo phạm vi vai trò; click thẻ = lọc danh sách theo trạng thái tương ứng; thẻ Quá hạn nhấn cảnh báo.
- **Bộ lọc + tìm kiếm:** trạng thái, ưu tiên; tìm theo tiêu đề (debounce 300ms).
- **Bảng công việc:** click dòng → S03 Chi tiết công việc; deadline quá hạn tô đỏ kèm ⚠; phân trang "Tải thêm" 20 dòng/lần.
- **Nút [+ Tạo công việc]:** chỉ hiện với Team Lead / Org Admin; mở modal tạo việc (luồng ≤ 3 bước: mở modal → điền → Tạo).
- **Modal tạo việc:** trường * là bắt buộc; người thực hiện chỉ liệt kê thành viên ACTIVE cùng tổ chức; deadline không được ở quá khứ.
- **Panel thông báo:** dropdown dưới chuông; click 1 thông báo = đánh dấu đã đọc + điều hướng đến công việc liên quan.
