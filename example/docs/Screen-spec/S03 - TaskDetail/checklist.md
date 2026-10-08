# Checklist kiểm thử (high-level) — Chi tiết công việc (S03)

> Nguồn: `srs.md` · `usecase.md` · `userstory.md` · `design-spec.md` của màn.
> Bổ trợ `test.md` (ca chi tiết). Mỗi mục có mã `CL-S..`; `ba-test` bám các mã này để sinh `TC` (mỗi `CL` ≥1 `TC`).

| Tổng mục | Pass | Fail | N/A | Chưa kiểm | Ưu tiên Critical/High | Cập nhật cuối |
|---:|---:|---:|---:|---:|:--|:--|
| 67 | 0 | 0 | 0 | 67 | 5/17 | 2026-08-11 |

## G1. Chức năng chính (happy path)
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S03-01 | Mở `/tasks/:id` xem chi tiết | Hiển thị đủ 9 trường (tiêu đề, mô tả, trạng thái, ưu tiên, deadline, người giao, người thực hiện, tạo lúc, cập nhật lúc) đúng giá trị từ `GET /tasks/:id`; badge trạng thái + ưu tiên có chữ | High | R-S03-01, UC-S03-01, US-S03-01 | — |  |
| CL-S03-02 | Đánh dấu công việc quá hạn | deadline < hiện tại và trạng thái ∉ {Hoàn thành, Đã huỷ} → deadline tô đỏ + ⚠; việc Hoàn thành quá hạn **không** tô đỏ | Medium | R-S03-02, BRule-S03-06, US-S03-01 | — |  |
| CL-S03-03 | Dòng thời gian lịch sử | Sắp mới → cũ; mỗi dòng đủ 4 thành phần (người · trường · cũ → mới · thời điểm); dòng dưới cùng luôn là "Tạo công việc" | Medium | R-S03-03, US-S03-01 | — |  |
| CL-S03-04 | Danh sách bình luận | Sắp cũ → mới; số bình luận trong tiêu đề khu vực khớp thực tế | Medium | R-S03-04, US-S03-04 | — |  |
| CL-S03-05 | Bắt đầu làm (người thực hiện) | TODO → IN_PROGRESS; badge đổi "Đang làm"; sinh 1 dòng lịch sử; thanh hành động đổi sang "Gửi duyệt" | High | R-S03-08, UC-S03-02, US-S03-02 | — |  |
| CL-S03-06 | Gửi duyệt (người thực hiện) | IN_PROGRESS → IN_REVIEW; badge "Chờ duyệt"; thanh hành động chuyển thành chữ "Đang chờ duyệt", không còn nút | High | R-S03-09, UC-S03-02, US-S03-02 | — |  |
| CL-S03-07 | Duyệt hoàn thành (người duyệt) | IN_REVIEW → DONE; badge "Hoàn thành"; thanh hành động ẩn hẳn; sinh 1 dòng lịch sử | High | R-S03-10, UC-S03-03, US-S03-03 | — |  |
| CL-S03-08 | Từ chối kèm lý do (người duyệt) | IN_REVIEW → IN_PROGRESS; badge về "Đang làm"; **đồng thời** 1 dòng lịch sử mới và 1 bình luận mới chứa đúng lý do | High | R-S03-11, UC-S03-03, US-S03-03, BRule-S03-05 | — |  |
| CL-S03-09 | Huỷ công việc (người duyệt) | Hiện hộp xác nhận trước khi gọi API; đồng ý → badge "Đã huỷ" + banner "Công việc đã huỷ" | High | R-S03-12, UC-S03-06, US-S03-06 | — |  |
| CL-S03-10 | Sửa thông tin (người duyệt) | `PATCH /tasks/:id` lưu thành công → thông tin trên màn cập nhật ngay; **mỗi trường bị đổi sinh đúng 1 dòng lịch sử** | High | R-S03-14, UC-S03-05, US-S03-05, BRule-S03-08 | — |  |
| CL-S03-11 | Thêm bình luận | `POST /tasks/:id/comments` gọi đúng 1 lần; bình luận mới hiện ở **cuối** danh sách; ô nhập trống lại; bộ đếm +1 | Medium | R-S03-05, UC-S03-04, US-S03-04 | — |  |
| CL-S03-12 | Lịch sử cập nhật tức thì | Sau đổi trạng thái/thông tin thành công, dòng lịch sử mới hiện ở **đầu** timeline ≤ 500ms mà không tải lại trang | Medium | R-S03-15, US-S03-02 | — |  |
| CL-S03-13 | Sinh thông báo `STATUS_CHANGED` | Sau đổi trạng thái: người thực hiện và người giao mỗi người nhận đúng 1 thông báo trỏ tới việc này, **trừ** chính người vừa thao tác | Medium | R-S03-16, BRule-S03-09, UC-S03-07, US-S03-03 | — |  |
| CL-S03-14 | Bình luận bất biến | Không có nút sửa/xoá trong DOM ở bất kỳ bình luận nào, kể cả bình luận của chính người đang đăng nhập | Medium | R-S03-06, BRule-S03-07, US-S03-04 | — | inspection |

## G2. Nhập liệu & Validation
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S03-15 | Ô bình luận — bắt buộc & độ dài | Bắt buộc, không chỉ toàn khoảng trắng, 1–1000 ký tự; bộ đếm `n/1000` hiển thị; giữ nguyên xuống dòng | Medium | R-S03-05, US-S03-04 | — |  |
| CL-S03-16 | Bình luận chứa thẻ HTML | Nội dung có thẻ HTML hiển thị dạng văn bản thuần, không thực thi, không vỡ layout | High | R-S03-05, UC-S03-04 | — | chống XSS |
| CL-S03-17 | Modal Sửa — tiêu đề | Bắt buộc, không toàn khoảng trắng, 1–200 ký tự | Medium | R-S03-14, US-S03-05 | — |  |
| CL-S03-18 | Modal Sửa — mô tả | Không bắt buộc; tối đa 5000 ký tự | Low | R-S03-14 | — |  |
| CL-S03-19 | Modal Sửa — người thực hiện | Bắt buộc; danh sách chỉ gồm thành viên ACTIVE cùng tổ chức (INACTIVE không xuất hiện) | Medium | R-S03-14, US-S03-05 | — |  |
| CL-S03-20 | Modal Sửa — deadline | Bắt buộc; khi **sửa** cho phép đặt deadline quá khứ (cảnh báo, không chặn) — khác lúc tạo mới | Medium | R-S03-14, UC-S03-05 | — |  |
| CL-S03-21 | Modal Sửa — ưu tiên | Nhận đúng tập LOW/MEDIUM/HIGH/URGENT; không sửa thì giữ giá trị cũ | Low | R-S03-14 | — |  |
| CL-S03-22 | Modal Từ chối — lý do | Bắt buộc, không toàn khoảng trắng, 1–1000 ký tự; lý do lưu thành một bình luận của người từ chối | Medium | R-S03-11, BRule-S03-05 | — |  |

## G3. Trạng thái giao diện
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S03-23 | State Loading | Skeleton **theo từng khối, hiện dần** (info/lịch sử/bình luận tải riêng); khi gửi thao tác: nút vừa nhấn thành spinner + khoá, các nút còn lại disable | Medium | design-spec §4, R-S03-15 | — |  |
| CL-S03-24 | State Empty — chưa có bình luận | Hiện "Chưa có bình luận nào. Hãy là người đầu tiên trao đổi về công việc này." | Low | design-spec §4, UC-S03-01, US-S03-01 | — |  |
| CL-S03-25 | State Empty — mô tả rỗng | Hiện "Không có mô tả" bằng chữ mờ, không để khoảng trắng | Low | R-S03-01, design-spec §4 | — |  |
| CL-S03-26 | State Success — đổi trạng thái | Badge đổi nhãn tại chỗ + nhấn một lần; dòng lịch sử mới trượt vào đầu; toast xác nhận ngắn | Medium | design-spec §4 | — |  |
| CL-S03-27 | State Success — gửi bình luận | Bình luận mới hiện cuối danh sách; ô nhập trống lại và giữ focus | Low | design-spec §4, R-S03-05 | — |  |
| CL-S03-28 | Trạng thái Đã huỷ | Banner "Công việc đã huỷ" trên khối công việc; ô nhập bình luận vô hiệu hoá kèm "Công việc đã huỷ — không thể bình luận thêm."; lịch sử/bình luận vẫn đọc được | Medium | R-S03-12, design-spec §6 | — |  |
| CL-S03-29 | Trạng thái chờ duyệt (người thực hiện) | Thanh hành động thay bằng chữ "Đang chờ duyệt", không nút bấm | Medium | R-S03-09, design-spec §3, US-S03-02 | — |  |
| CL-S03-30 | Mô tả rất dài | Dài quá 6 dòng → thu gọn kèm "Xem thêm"; mở rộng không đẩy khu bình luận ra khỏi tầm nhìn đột ngột | Low | design-spec §3, design-spec §6 | — |  |

## G4. Lỗi & Ngoại lệ
| Mã | Hạng mục kiểm | Điều kiện đạt (thông báo/hành vi nguyên văn) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S03-31 | Công việc không tồn tại | Trang "Không tìm thấy công việc" + "Công việc không tồn tại hoặc bạn không có quyền truy cập." + nút "Về Dashboard"; HTTP `404` | High | E-S03-01, R-S03-17, UC-S03-01 | — |  |
| CL-S03-32 | Công việc thuộc tổ chức khác | Giao diện **giống hệt** E-S03-01 (không phân biệt); API trả `404` chứ không `403` | Critical | E-S03-02, R-S03-N02, BRule-S03-11, US-S03-01 | — | bảo mật có chủ đích |
| CL-S03-33 | Phiên hết hạn khi đang xem | Chuyển `/login` trong ≤ 100ms; tiêu đề công việc không kịp render | High | E-S03-03, R-S03-N03, UC-S03-01 | — |  |
| CL-S03-34 | Không tải được chi tiết | Khối lỗi giữa trang + nút "Thử lại"; header vẫn còn, layout không vỡ | High | E-S03-04, UC-S03-01 | — |  |
| CL-S03-35 | Không tải được khu bình luận | Khối thông tin + lịch sử hiện bình thường; **chỉ** khu bình luận hiện lỗi cục bộ + "Thử lại" | Medium | E-S03-05, UC-S03-01 | — |  |
| CL-S03-36 | Từ chối chưa nhập lý do | Nút "Xác nhận từ chối" vẫn disable; **không có lời gọi API nào** | Medium | E-S03-06, BRule-S03-05, US-S03-03 | — |  |
| CL-S03-37 | Lý do từ chối vượt 1000 ký tự | Lỗi inline "Lý do tối đa 1000 ký tự"; bộ đếm `1001/1000` chuyển đỏ; nút disable | Low | E-S03-07, R-S03-11 | — |  |
| CL-S03-38 | Chuyển trạng thái không hợp lệ | Gọi thẳng API chuyển ngoài 7 chuyển được phép (vd TODO → DONE) trả `400`; trạng thái trong dữ liệu không đổi; không sinh lịch sử | High | E-S03-08, R-S03-13, BRule-S03-01, US-S03-02 | — |  |
| CL-S03-39 | Thao tác trên trạng thái cuối | Gửi chuyển trạng thái khi việc đang DONE/CANCELLED trả `400`; trạng thái giữ nguyên | High | E-S03-09, R-S03-13, BRule-S03-02, US-S03-06 | — |  |
| CL-S03-40 | Không đủ quyền thao tác | Nút **không tồn tại trong DOM**; gọi thẳng API sai vai trò trả `403`, trạng thái không đổi | Critical | E-S03-10, R-S03-N04, BRule-S03-03, BRule-S03-04, US-S03-02 | — |  |
| CL-S03-41 | Xung đột do người khác vừa đổi | Thao tác bị từ chối; màn tự nạp lại trạng thái mới + "Công việc vừa được cập nhật bởi người khác" | High | E-S03-11, BRule-S03-12, UC-S03-02 | — |  |
| CL-S03-42 | Mất kết nối khi đổi trạng thái | Badge **bật lại** trạng thái cũ; toast "Lỗi kết nối — thử lại"; không sinh lịch sử | Medium | E-S03-12, R-S03-07 | — |  |
| CL-S03-43 | Mất kết nối khi gửi bình luận | Nội dung **còn nguyên** trong ô nhập; lỗi hiện dưới ô + nút "Thử lại"; không thêm bình luận rỗng | Medium | E-S03-13, R-S03-05, US-S03-04 | — |  |
| CL-S03-44 | Bình luận rỗng hoặc vượt 1000 ký tự | Nút "Gửi" disable; nếu vượt độ dài → "Bình luận tối đa 1000 ký tự" + bộ đếm đỏ | Low | E-S03-14, R-S03-05, US-S03-04 | — |  |
| CL-S03-45 | Sửa công việc thiếu tiêu đề | Lỗi inline "Vui lòng nhập tiêu đề"; nút "Lưu" disable; không gọi API | Medium | E-S03-15, R-S03-14, US-S03-05 | — |  |
| CL-S03-46 | Đóng modal Từ chối giữa chừng | Không thay đổi gì; trạng thái vẫn IN_REVIEW (Chờ duyệt) | Low | UC-S03-03 | — |  |
| CL-S03-47 | Từ chối nửa chừng | Bình luận lý do đã tạo nhưng đổi trạng thái lỗi → báo lỗi và nạp lại; thao tác lại **không** bắt nhập lý do lần hai | Medium | UC-S03-03, design-spec §6 | — |  |
| CL-S03-48 | Bình luận khi việc vừa bị xoá | `POST` trả `404` → màn chuyển sang trang "Không tìm thấy công việc" | Medium | UC-S03-04 | — |  |
| CL-S03-49 | Sửa nhưng không đổi trường nào | Nhấn "Lưu" khi không sửa gì → không gọi API, đóng modal, không sinh dòng lịch sử | Low | UC-S03-05, US-S03-05 | — |  |
| CL-S03-50 | Đổi người thực hiện | Người mới nhận `TASK_ASSIGNED`, người cũ nhận `STATUS_CHANGED`, sinh 1 dòng lịch sử | Medium | R-S03-14, BRule-S03-13, UC-S03-05, US-S03-05 | — |  |
| CL-S03-51 | Huỷ — chọn "Không" | Đóng hộp xác nhận; không gọi API; trạng thái giữ nguyên | Low | UC-S03-06, US-S03-06 | — |  |
| CL-S03-52 | Sinh thông báo lỗi / trùng người | Tạo thông báo thất bại → **không** cuộn ngược thay đổi nghiệp vụ (lịch sử vẫn ghi); người thao tác đồng thời là người thực hiện và người giao → không sinh thông báo nào | Medium | UC-S03-07, BRule-S03-09 | — |  |

## G5. Phân quyền & Vai trò
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S03-53 | Thanh hành động theo trạng thái × vai trò | Chỉ render nút **hợp lệ**; đối chiếu đủ 7 biến thể bảng "Thanh hành động" của `ascii-screen.md`; nút không hợp lệ **không tồn tại trong DOM** (không làm mờ) | High | R-S03-07, US-S03-02, US-S03-06 | — |  |
| CL-S03-54 | Chỉ người thực hiện được Bắt đầu làm / Gửi duyệt | Người không phải người thực hiện không thấy hai nút này; người giao không làm thay | High | BRule-S03-03, R-S03-08, R-S03-09, US-S03-02 | — |  |
| CL-S03-55 | Chỉ Team Lead / Org Admin được Duyệt/Từ chối/Huỷ/Sửa | Member không thấy các nút này; các nút chỉ hiện với vai trò duyệt | Critical | BRule-S03-04, US-S03-03 | — |  |
| CL-S03-56 | Org Admin có quyền duyệt như Team Lead | Org Admin thấy và dùng được nút Duyệt/Từ chối như Team Lead | Medium | GĐ-S03-01, BRule-S03-04 | — |  |
| CL-S03-57 | Thành viên khác cùng tổ chức | Xem chi tiết và bình luận được; thanh hành động **ẩn hẳn** (không hiện nút xám) | Medium | BRule-S03-10, design-spec §6 | — |  |

## G6. Phi chức năng (hiệu năng / bảo mật / a11y)
| Mã | Hạng mục kiểm | Điều kiện đạt (ngưỡng/tiêu chí cụ thể) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S03-58 | Hiệu năng — tải màn | Tải chi tiết (info + 50 bình luận + 20 dòng lịch sử) ≤ 2 giây ở p95 với 200 người dùng đồng thời | Medium | R-S03-N01 | — |  |
| CL-S03-59 | Bảo mật — cách ly tổ chức | Việc thuộc tổ chức khác không truy cập được bằng **bất kỳ đường nào**, kể cả gọi thẳng `GET /tasks/:id`; phản hồi `404` không phải `403` | Critical | R-S03-N02, BRule-S03-11 | — |  |
| CL-S03-60 | Bảo mật — chưa xác thực | Truy cập `/tasks/:id` khi chưa xác thực → chuyển `/login` ≤ 100ms, không kịp render nội dung công việc | High | R-S03-N03 | — |  |
| CL-S03-61 | Bảo mật — kiểm quyền phía máy chủ | Mọi ràng buộc phân quyền chuyển trạng thái kiểm lại ở máy chủ: gọi thẳng API sai vai trò trả `403` dù giao diện không hiện nút | Critical | R-S03-N04 | — |  |
| CL-S03-62 | Khả năng tiếp cận (a11y) | Badge/cảnh báo quá hạn phân biệt **không chỉ bằng màu** (kèm chữ/biểu tượng); tương phản ≥ 4.5:1; thao tác đủ bằng bàn phím; đổi trạng thái công bố qua `aria-live` | Medium | R-S03-N05 | — |  |
| CL-S03-63 | Hiệu năng — tải bình luận | Tải 50 bình luận mới nhất; "Xem bình luận cũ hơn" phản hồi ≤ 1 giây ở mạng bình thường | Medium | R-S03-N06, US-S03-04 | — |  |

## G7. Tương thích & Liên màn
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S03-64 | Quay lại Dashboard giữ bộ lọc | Nhấn "← Quay lại Dashboard" → về `/dashboard` với đúng bộ lọc trạng thái/ưu tiên/từ khoá trước đó | Medium | R-S03-18, design-spec §3 | — | → S02 |
| CL-S03-65 | Điều hướng vào màn | Vào được từ nhấn một dòng ở Dashboard (S02), nhấn thông báo in-app, hoặc mở trực tiếp URL `/tasks/:id` | Medium | UC-S03-01 | — | ← S02 |
| CL-S03-66 | Responsive | Desktop ≥ 1024px hai cột (Lịch sử / Bình luận); mobile < 768px xếp chồng thành tab "Bình luận / Lịch sử", Bình luận là tab mặc định | Medium | design-spec §2 | — |  |
| CL-S03-67 | Modal Sửa giống modal tạo việc S02 | Modal đủ 5 trường với bộ ràng buộc **y hệt** modal tạo việc ở S02 (`R-S02-08`) | Medium | R-S03-14, R-S02-08, design-spec §8 | — | ← S02 |

## Cần làm rõ
- **Vai trò "Sửa thông tin":** `brainstorm.md` §Thành phần có ghi cụm "người giao / Team Lead / Org Admin" cho nút Sửa, nhưng `GĐ-S03-04` (Đã xác nhận 2026-07-22) và `BRule-S03-04` chốt **chỉ Team Lead / Org Admin** (người giao không tự sửa nếu không phải vai trò duyệt). Checklist bám theo srs/BRule (đã ghi ở `CL-S03-55`). Nếu muốn cho người giao sửa → cập nhật `srs.md` rồi bổ sung mục kiểm; không suy đoán ở đây.

## Thuật ngữ
- **Checklist high-level:** danh mục điểm cần kiểm ở mức cao (một dòng/điểm), chưa phải test case chi tiết.
- **N/A:** hạng mục không áp dụng cho màn này.
- **Người thực hiện (assignee):** người được giao làm công việc — trường `nguoi_nhan_id`.
- **Người duyệt:** vai trò Team Lead hoặc Org Admin — có quyền duyệt, từ chối, huỷ, sửa.
- **Trạng thái cuối (terminal state):** trạng thái không còn chuyển tiếp đi ra — Hoàn thành (DONE) và Đã huỷ (CANCELLED).
- **STATUS_CHANGED / TASK_ASSIGNED:** loại thông báo sinh khi trạng thái đổi / khi đổi người thực hiện (xem `srs.md`, `05-data-model.md`).
- *(bổ sung thuật ngữ nghiệp vụ vào `docs/00-glossary.md` khi phát sinh)*
