# Checklist kiểm thử (high-level) — Dashboard (S02)

> Nguồn: `srs.md` · `usecase.md` · `userstory.md` · `design-spec.md` của màn.
> Bổ trợ `test.md` (ca chi tiết). Mỗi mục có mã `CL-S..`; `ba-test` bám các mã này để sinh `TC` (mỗi `CL` ≥1 `TC`).

| Tổng mục | Pass | Fail | N/A | Chưa kiểm | Ưu tiên Critical/High | Cập nhật cuối |
|---:|---:|---:|---:|---:|:--|:--|
| 56 | 0 | 0 | 0 | 56 | 3/11 | 2026-08-11 |

## G1. Chức năng chính (happy path)
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S02-01 | Tải Dashboard — 5 thẻ thống kê + danh sách theo phạm vi vai trò | 5 thẻ (Tổng/Cần làm/Đang làm/Hoàn thành/Quá hạn) hiện số đúng; Member đếm việc mình liên quan, Lead/Admin đếm cả tổ chức; danh sách khớp phạm vi | High | UC-S02-01, R-S02-01, R-S02-02, US-S02-01 | — |  |
| CL-S02-02 | Danh sách — sắp xếp & đủ cột | Mặc định sắp deadline tăng dần; mỗi dòng đủ Tiêu đề/Người thực hiện/Deadline/Ưu tiên/Trạng thái | Medium | R-S02-02 | — |  |
| CL-S02-03 | Lọc trạng thái/ưu tiên + tìm theo tiêu đề | Chọn lọc hoặc gõ từ khoá (debounce 300ms) → danh sách cập nhật không reload trang; kết hợp được nhiều điều kiện | Medium | R-S02-03, US-S02-02 | — |  |
| CL-S02-04 | Click thẻ thống kê để lọc nhanh | Click thẻ → danh sách chỉ còn trạng thái tương ứng, thẻ có viền nhấn; click lại = bỏ lọc | Medium | R-S02-04, US-S02-02 | — |  |
| CL-S02-05 | Đánh dấu công việc quá hạn | Dòng deadline < hiện tại & trạng thái ∉ {DONE, CANCELLED}: deadline tô đỏ + icon ⚠; số thẻ Quá hạn khớp số dòng quá hạn | Medium | R-S02-05, BRule-S02-02, US-S02-01 | — |  |
| CL-S02-06 | Click dòng công việc → Chi tiết (S03) | Click dòng bất kỳ → URL /tasks/:id của đúng việc | Medium | R-S02-06, UC-S02-01 | — |  |
| CL-S02-07 | Tạo & giao công việc trong 3 bước (Lead/Admin) | Nhấn CTA → điền form → "Tạo công việc": modal đóng, toast "Đã tạo công việc", việc mới đầu danh sách, thẻ Tổng/Cần làm +1 | High | UC-S02-02, R-S02-07, R-S02-08, R-S02-10, US-S02-03 | — |  |
| CL-S02-08 | Dropdown "Người thực hiện" | Chỉ liệt kê thành viên ACTIVE cùng tổ chức; gõ tên lọc realtime; chọn đúng 1 người | High | R-S02-09, BRule-S02-05, BRule-S02-07 | — |  |
| CL-S02-09 | Sinh thông báo TASK_ASSIGNED khi tạo việc | Giao cho người khác thành công → người nhận có thông báo; tự giao cho mình → không sinh thông báo | Medium | R-S02-10, BRule-S02-06 | — |  |
| CL-S02-10 | Xem & đọc thông báo trong panel | Click chuông → panel mới→cũ, chưa đọc nền nhấn; click item → PATCH read, badge −1, điều hướng /tasks/:id đúng việc | Medium | UC-S02-03, R-S02-13, R-S02-14, US-S02-04 | — |  |
| CL-S02-11 | Badge số thông báo chưa đọc | Badge = số item da_doc=false; 0 → ẩn badge; >99 → "99+" | Medium | R-S02-12, US-S02-04 | — |  |
| CL-S02-12 | "Đọc tất cả" | Gọi PATCH /notifications/read-all 1 lần; badge về 0/ẩn; mọi item chuyển đã đọc, không còn item nền nhấn | Medium | R-S02-15, US-S02-04 | — |  |
| CL-S02-13 | Tự làm mới badge theo polling 60s | Có thông báo mới ở server → badge cập nhật trong ≤ 60 giây khi tab mở, không cần reload | Low | R-S02-16, US-S02-04, GĐ-S02-01 | — | Phụ thuộc giả định polling (xem Cần làm rõ) |
| CL-S02-14 | Xuất báo cáo theo bộ lọc đang xem (Lead/Admin) | Chọn PDF/Excel → tải tệp phản ánh đúng bộ lọc trạng thái/ưu tiên/từ khoá hiện tại và đúng phạm vi dữ liệu theo vai trò; nội dung khớp bảng đang hiển thị | High | UC-S02-04, R-S02-17, R-S02-18, BRule-S02-08, CR-01 | — | *(CR-01)* |

## G2. Nhập liệu & Validation
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S02-15 | Tiêu đề — bắt buộc, ≤ 200, không toàn khoảng trắng | Rỗng/toàn khoảng trắng → chặn; > 200 ký tự → chặn; báo lỗi inline khi blur | Medium | R-S02-08 | — |  |
| CL-S02-16 | Mô tả — tuỳ chọn, ≤ 5000 ký tự | > 5000 ký tự → báo lỗi inline, nút Tạo disable | Low | R-S02-08 | — |  |
| CL-S02-17 | Người thực hiện — bắt buộc, chọn 1 | Chưa chọn → lỗi "Vui lòng chọn người thực hiện", nút Tạo disable | Medium | R-S02-08, BRule-S02-07 | — |  |
| CL-S02-18 | Deadline — bắt buộc, ≥ thời điểm hiện tại | Rỗng → "Vui lòng chọn deadline"; quá khứ → "Deadline không được ở quá khứ"; nút Tạo disable | Medium | R-S02-08, BRule-S02-04 | — |  |
| CL-S02-19 | Ưu tiên — enum, mặc định MEDIUM | Mặc định "Trung bình"; chỉ nhận LOW/MEDIUM/HIGH/URGENT | Low | R-S02-08 | — |  |
| CL-S02-20 | Nút "Tạo công việc" enable/disable theo tính hợp lệ | Còn field lỗi hoặc thiếu bắt buộc → nút disable; đủ hợp lệ → enable | Medium | R-S02-08, UC-S02-02 | — |  |
| CL-S02-21 | Ô tìm kiếm tiêu đề — ràng buộc nhập | ≤ 200 ký tự (quá thì cắt); debounce 300ms; không phân biệt hoa thường | Low | R-S02-03 | — |  |

## G3. Trạng thái giao diện
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S02-22 | State Empty — chưa có công việc | "Chưa có công việc nào"; Lead/Admin kèm "Tạo công việc đầu tiên cho nhóm của bạn" + nút CTA | Low | design-spec §4, UC-S02-01 | — |  |
| CL-S02-23 | State Empty — panel thông báo rỗng | Panel hiện "Chưa có thông báo" | Low | design-spec §4, UC-S02-03 | — |  |
| CL-S02-24 | State Empty — kết quả lọc rỗng | "Không tìm thấy công việc phù hợp" + nút "Xoá bộ lọc" | Low | design-spec §4, UC-S02-01 | — |  |
| CL-S02-25 | State Loading | Skeleton cho 5 thẻ + 5 dòng bảng; khi gửi modal → nút spinner + disable cả form | Low | design-spec §4, R-S02-01 | — |  |
| CL-S02-26 | State Error — tải trang lỗi | Khối lỗi giữa vùng nội dung + nút "Thử lại"; không vỡ layout | Medium | design-spec §4, E-S02-01 | — |  |
| CL-S02-27 | State Success — tạo việc | Toast "Đã tạo công việc"; dòng mới đầu bảng highlight nổi nhẹ (chạy một lần); badge/thống kê cập nhật tức thì | Medium | design-spec §4, R-S02-10 | — |  |

## G4. Lỗi & Ngoại lệ
| Mã | Hạng mục kiểm | Điều kiện đạt (thông báo/hành vi nguyên văn) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S02-28 | Không tải được dữ liệu Dashboard | Khối lỗi giữa vùng nội dung + nút "Thử lại"; không vỡ layout, header vẫn còn; bấm "Thử lại" gọi lại API | High | E-S02-01, UC-S02-01 [2b] | — |  |
| CL-S02-29 | Phiên hết hạn khi đang xem | Redirect /login trong ≤ 100ms; nội dung Dashboard không kịp render | High | E-S02-02, R-S02-N04, UC-S02-01 [2a] | — |  |
| CL-S02-30 | Thiếu tiêu đề công việc | Lỗi inline "Vui lòng nhập tiêu đề"; nút Tạo disable | Low | E-S02-03 | — |  |
| CL-S02-31 | Tiêu đề vượt 200 ký tự | Lỗi inline "Tiêu đề tối đa 200 ký tự"; nút Tạo disable; không gọi API | Low | E-S02-04 | — |  |
| CL-S02-32 | Mô tả vượt 5000 ký tự | Lỗi inline "Mô tả tối đa 5000 ký tự"; nút Tạo disable | Low | E-S02-05 | — |  |
| CL-S02-33 | Thiếu người thực hiện | Lỗi "Vui lòng chọn người thực hiện"; nút Tạo disable | Low | E-S02-06, BRule-S02-07 | — |  |
| CL-S02-34 | Deadline ở quá khứ | Lỗi inline "Deadline không được ở quá khứ"; nút Tạo disable; không gọi API | Low | E-S02-07, BRule-S02-04 | — |  |
| CL-S02-35 | Member cố tạo công việc (bypass UI) | HTTP 403; không có công việc mới trong dữ liệu | High | E-S02-08, BRule-S02-03, R-S02-N04, UC-S02-02 [4b] | — | Bảo mật phân quyền |
| CL-S02-36 | Mất kết nối khi đang tạo công việc | Modal không đóng, mọi giá trị còn nguyên, hiện "Lỗi kết nối — thử lại"; tạo lại khi có mạng không sinh công việc trùng | Medium | E-S02-09, R-S02-11, UC-S02-02 [4a], US-S02-03 | — |  |
| CL-S02-37 | Không tải được danh sách thông báo | Vẫn điều hướng được tới công việc; badge giữ nguyên; tự đồng bộ lại ở lần poll sau (60 giây) | Low | E-S02-10, R-S02-12 | — |  |
| CL-S02-38 | Member cố xuất báo cáo (bypass UI) | HTTP 403; không trả tệp; không rò công việc ngoài phạm vi | High | E-S02-11, R-S02-N07, BRule-S02-08, UC-S02-04 [2a] | — | *(CR-01)* Bảo mật phân quyền |
| CL-S02-39 | Lỗi máy chủ khi dựng báo cáo (5xx) | Toast "Không xuất được báo cáo — thử lại"; không tải tệp hỏng | Medium | E-S02-12, R-S02-18, UC-S02-04 [6a] | — | *(CR-01)* |
| CL-S02-40 | Đóng/Huỷ modal khi đã nhập dữ liệu | Nhấn [×]/Huỷ khi đã nhập → hỏi "Bỏ nội dung đã nhập?"; xác nhận → đóng, không lưu gì | Low | UC-S02-02 [1a], design-spec §5 | — |  |
| CL-S02-41 | Đánh dấu đọc lỗi khi click thông báo | Vẫn điều hướng đến công việc (ưu tiên luồng người dùng); thử đánh dấu lại ở lần poll sau | Low | UC-S02-03 [3a] | — |  |
| CL-S02-42 | Thông báo trỏ tới công việc đã xoá | "Công việc không còn tồn tại"; ở lại Dashboard | Low | UC-S02-03 [4a], design-spec §6 | — |  |
| CL-S02-43 | Xuất báo cáo khi không có việc khớp bộ lọc | Vẫn xuất được; báo cáo ghi rõ "Không có công việc" thay vì tệp rỗng gây hiểu nhầm | Low | UC-S02-04 [5a] | — | *(CR-01)* |

## G5. Phân quyền & Vai trò
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S02-44 | Phạm vi dữ liệu theo vai trò | Member chỉ thấy việc mình thực hiện HOẶC mình giao; Team Lead/Org Admin thấy toàn bộ công việc tổ chức (thẻ thống kê + danh sách) | Critical | BRule-S02-01, R-S02-01, R-S02-02, US-S02-01 | — |  |
| CL-S02-45 | Nút "+ Tạo công việc" theo vai trò | Member: nút không render trong DOM; Team Lead/Org Admin: nút hiện, click mở modal | High | R-S02-07, BRule-S02-03, US-S02-03 | — |  |
| CL-S02-46 | Nút "Xuất báo cáo" theo vai trò | Member: nút không tồn tại trong DOM (không làm mờ); Team Lead/Org Admin: nút hiện | High | R-S02-17, BRule-S02-08, CR-01 | — | *(CR-01)* |

## G6. Phi chức năng (hiệu năng/bảo mật/a11y)
| Mã | Hạng mục kiểm | Điều kiện đạt (ngưỡng/tiêu chí cụ thể) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S02-47 | Hiệu năng — tải Dashboard | Thống kê + trang đầu danh sách hoàn tất ≤ 2 giây ở p95 với 200 người dùng đồng thời | Medium | R-S02-N01 | — |  |
| CL-S02-48 | Khả năng sử dụng — tạo việc ≤ 3 bước | Luồng tạo & giao việc hoàn tất trong ≤ 3 bước: nhấn CTA → điền form → nhấn "Tạo công việc" | Medium | R-S02-N02 | — |  |
| CL-S02-49 | Bảo mật — cô lập dữ liệu đa tổ chức | Mọi dữ liệu (công việc/thành viên/thông báo) chỉ thuộc tổ chức người đang đăng nhập; không truy cập được dữ liệu tổ chức khác | Critical | R-S02-N03, BRule-S02-01 | — |  |
| CL-S02-50 | Bảo mật — gating xác thực + kiểm quyền server | Truy cập /dashboard chưa xác thực → redirect /login ≤ 100ms; POST /tasks bằng token Member → 403 | High | R-S02-N04, BRule-S02-03 | — |  |
| CL-S02-51 | Khả năng tiếp cận (a11y) | Badge/thẻ thống kê/dòng công việc có aria-label; tương phản chữ/nền ≥ 4.5:1; thao tác được hoàn toàn bằng bàn phím (Tab/Enter); quá hạn không chỉ dựa vào màu (kèm ⚠) | Medium | R-S02-N05 | — |  |
| CL-S02-52 | Hiệu năng — phân trang danh sách | Phân trang 20 dòng/lần; "Tải thêm" phản hồi ≤ 1 giây ở mạng bình thường | Medium | R-S02-N06, GĐ-S02-02 | — | Phụ thuộc giả định cỡ trang (xem Cần làm rõ) |
| CL-S02-53 | Bảo mật — xuất báo cáo kiểm quyền server | POST /reports/export bằng token Member → 403 dù UI không hiện nút; báo cáo không bao giờ chứa công việc ngoài phạm vi vai trò/tổ chức của người gọi | Critical | R-S02-N07, BRule-S02-08 | — | *(CR-01)* |

## G7. Tương thích & Liên màn
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S02-54 | Điều hướng CTA sang màn khác | Click dòng/thông báo → S03 Chi tiết công việc (/tasks/:id); logo → Dashboard; avatar menu → Hồ sơ (S04)/Tổ chức (S05, chỉ Lead/Admin)/Đăng xuất (S01) — khớp 03-overview | Medium | R-S02-06, R-S02-14 | — |  |
| CL-S02-55 | Responsive — màn hẹp (mobile) | Bảng công việc chuyển thẻ dọc (mỗi việc 1 card); 5 thẻ thống kê cuộn ngang giữ nguyên thứ tự | Low | design-spec §2, design-spec §6 | — |  |
| CL-S02-56 | Đồng bộ 2 tab cùng mở | Tạo việc ở tab A → tab B thấy badge thông báo mới chậm nhất sau 60s; số liệu công việc/thẻ thống kê chỉ cập nhật khi reload/thao tác | Low | design-spec §6, R-S02-16 | — |  |

## Cần làm rõ
- Ba giả định của màn còn **⚠️ chưa xác nhận** (`srs.md` → Giả định & Ràng buộc): `GĐ-S02-01` polling 60 giây (nền của `CL-S02-13`), `GĐ-S02-02` phân trang 20 dòng/lần (nền của `CL-S02-52`), `GĐ-S02-03` phạm vi dữ liệu theo vai trò (nền của `CL-S02-44`/`CL-S02-49`). Các mục kiểm trên chỉ có ý nghĩa sau khi stakeholder chốt các giả định này; nếu giả định đổi thì reset các mục liên quan về `—` và cập nhật roll-up. Không suy đoán thêm.

## Thuật ngữ
- **Checklist high-level:** danh mục điểm cần kiểm ở mức cao (một dòng/điểm), chưa phải test case chi tiết.
- **N/A:** hạng mục không áp dụng cho màn này.
- **Phạm vi vai trò (data scope):** ranh giới dữ liệu mỗi vai trò nhìn thấy — Member = việc mình thực hiện/giao; Team Lead & Org Admin = toàn tổ chức (xem `BRule-S02-01`).
- **Multi-tenant (đa tổ chức):** mọi dữ liệu bị cô lập trong tổ chức của người đăng nhập, không rò sang tổ chức khác (xem `R-S02-N03`).
- **Polling:** cơ chế tự gọi lại API theo chu kỳ (60 giây) để cập nhật badge thông báo khi chưa dùng WebSocket.
