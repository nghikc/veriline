# Checklist kiểm thử (high-level) — Hồ sơ cá nhân (S04)

> Nguồn: `srs.md` · `usecase.md` · `userstory.md` · `design-spec.md` của màn.
> Bổ trợ `test.md` (ca chi tiết). Mỗi mục có mã `CL-S..`; `ba-test` bám các mã này để sinh `TC` (mỗi `CL` ≥1 `TC`).

| Tổng mục | Pass | Fail | N/A | Chưa kiểm | Ưu tiên Critical/High | Cập nhật cuối |
|---:|---:|---:|---:|---:|:--|:--|
| 53 | 0 | 0 | 0 | 53 | 4/12 | 2026-08-11 |

## G1. Chức năng chính (happy path)
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S04-01 | Xem hồ sơ của chính mình | Khối nhận diện hiện đủ 6 thông tin (ảnh, họ tên, email, vai trò, tổ chức, ngày tham gia) đúng giá trị `GET /users/me` | High | UC-S04-01, US-S04-01, R-S04-01 | — |  |
| CL-S04-02 | Cập nhật họ tên/ảnh đại diện | `PATCH /users/me` gọi đúng 1 lần chỉ gửi trường đã đổi; khối nhận diện + tên trên header đổi theo; toast "Đã cập nhật hồ sơ" | High | UC-S04-02, US-S04-02, R-S04-07 | — |  |
| CL-S04-03 | Đổi mật khẩu thành công | Nhập đúng hiện tại + mới hợp lệ + khớp → API 200, toast "Đã đổi mật khẩu", xoá trắng 3 trường, người dùng vẫn ở lại màn | High | UC-S04-03, US-S04-03, R-S04-14 | — |  |
| CL-S04-04 | Thu hồi các phiên khác khi đổi mật khẩu | Sau đổi thành công: thiết bị khác nhận 401 ở lời gọi kế tiếp và về `/login`; phiên hiện tại KHÔNG bị thu hồi | High | UC-S04-04, US-S04-04, R-S04-15, BRule-S04-06 | — |  |
| CL-S04-05 | Cảnh báo khi rời màn còn thay đổi chưa lưu | Form 1 có thay đổi + nhấn điều hướng → hộp "Bạn có thay đổi chưa lưu" (Ở lại / Rời đi); chọn "Ở lại" giữ nguyên mọi giá trị | Medium | UC-S04-05, US-S04-05, R-S04-09 | — |  |
| CL-S04-06 | Hai form tách riêng | Sửa họ tên KHÔNG yêu cầu nhập mật khẩu; mỗi form một nút riêng, hai lời gọi API tách biệt | Medium | R-S04-10, US-S04-03 | — |  |

## G2. Nhập liệu & Validation
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S04-07 | Họ tên — bắt buộc, không toàn khoảng trắng | Rỗng/toàn khoảng trắng → chặn + báo lỗi; khi lưu cắt khoảng trắng thừa hai đầu | Medium | R-S04-03 | — |  |
| CL-S04-08 | Họ tên — 1–100 ký tự, đếm realtime | Bộ đếm `n/100` cập nhật theo từng ký tự, chuyển đỏ khi vượt 100 → chặn Lưu | Medium | R-S04-03 | — |  |
| CL-S04-09 | Ảnh đại diện — luật URL | Chỉ nhận chuỗi bắt đầu `https://`, là URL hợp lệ, ≤ 2048 ký tự; bỏ trống hợp lệ (quay về chữ cái đầu) | Medium | R-S04-04, BRule-S04-08 | — |  |
| CL-S04-10 | Nút Lưu chỉ bật khi có thay đổi thật | Mở màn → nút disable; sửa khác gốc → bật; hoàn tác về giá trị cũ → disable lại; không gọi API khi không đổi | Medium | R-S04-06 | — |  |
| CL-S04-11 | Mật khẩu hiện tại — bắt buộc, 8–128 | Bỏ trống → lỗi "Vui lòng nhập mật khẩu hiện tại"; ngoài khoảng 8–128 → chặn | High | R-S04-14 | — |  |
| CL-S04-12 | Mật khẩu mới — 8–128, ≥1 chữ + ≥1 số | Không đạt chính sách → lỗi inline, nút "Đổi mật khẩu" disable | High | R-S04-N02 | — |  |
| CL-S04-13 | Mật khẩu mới phải khác hiện tại | Nhập mới giống hiện tại → lỗi "Mật khẩu mới phải khác mật khẩu hiện tại"; không gọi API | High | R-S04-13, BRule-S04-05 | — |  |
| CL-S04-14 | Xác nhận khớp mật khẩu mới (khi rời trường) | Không khớp → lỗi "Mật khẩu xác nhận không khớp."; nút "Đổi mật khẩu" disable | Medium | R-S04-12 | — |  |
| CL-S04-15 | Thanh đo độ mạnh mật khẩu realtime | Hiện ngay ký tự đầu, cập nhật mỗi ký tự, phân mức Yếu / Trung bình / Mạnh (cùng quy tắc + nhãn với S06) | Low | R-S04-11 | — |  |
| CL-S04-16 | Toggle 👁 hiện/ẩn từng trường độc lập | Nhấn 👁 một trường chỉ đổi trường đó giữa `password`↔`text`; hai trường kia không đổi | Low | R-S04-17 | — |  |

## G3. Trạng thái giao diện
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S04-17 | State Loading (tải lần đầu) | Skeleton cho khối nhận diện và cả hai form khi mở màn | Low | design-spec §4, R-S04-01 | — |  |
| CL-S04-18 | State Loading (đang gửi) | Nút vừa nhấn hiện spinner nội nút + khoá; các trường của chính form đó read-only; form còn lại vẫn dùng được | Medium | design-spec §4 | — |  |
| CL-S04-19 | State Success — cập nhật hồ sơ | Toast "Đã cập nhật hồ sơ"; khối nhận diện + tên trên header + avatar đổi đồng bộ trong cùng một lượt (highlight một lần) | Medium | design-spec §4, R-S04-07 | — |  |
| CL-S04-20 | State Success — đổi mật khẩu | Toast "Đã đổi mật khẩu"; ba trường trắng; thanh đo độ mạnh biến mất; nút trở lại disable | Medium | design-spec §4, R-S04-16 | — |  |
| CL-S04-21 | State Empty — chưa có ảnh đại diện | Ô ảnh hiện chữ cái đầu họ tên viết hoa trên nền màu; màu ổn định (cùng tên → cùng màu qua các lần tải) | Low | design-spec §4, R-S04-02, BRule-S04-07 | — |  |
| CL-S04-22 | Trường khoá Email/Vai trò/Tổ chức | Ba giá trị không nằm trong ô nhập nào; mỗi giá trị có biểu tượng khoá + câu giải thích; không trông giống ô nhập disable | High | R-S04-05, BRule-S04-02, BRule-S04-03, design-spec §3 | — |  |

## G4. Lỗi & Ngoại lệ
| Mã | Hạng mục kiểm | Điều kiện đạt (thông báo/hành vi nguyên văn) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S04-23 | Phiên hết hạn khi mở hồ sơ | Chuyển `/login`; **không thông tin cá nhân nào kịp render** | High | E-S04-01, R-S04-N05 | — |  |
| CL-S04-24 | Không tải được hồ sơ | Khối lỗi + nút "Thử lại"; header vẫn còn; nhấn "Thử lại" gọi lại API | Medium | E-S04-02, R-S04-01 | — |  |
| CL-S04-25 | Cố xem/sửa hồ sơ người khác | Trả `404`/`405` — màn **chỉ** gọi `/users/me`, không endpoint nào nhận id người khác | Critical | E-S04-03, BRule-S04-01, R-S04-N05 | — | Hành vi bảo mật có chủ đích |
| CL-S04-26 | Họ tên rỗng hoặc toàn khoảng trắng | Lỗi "Vui lòng nhập họ tên"; nút "Lưu thay đổi" disable | Low | E-S04-04, R-S04-03 | — |  |
| CL-S04-27 | Họ tên vượt 100 ký tự | Lỗi "Họ tên tối đa 100 ký tự"; bộ đếm `101/100` đỏ; nút Lưu disable | Low | E-S04-05, R-S04-03 | — |  |
| CL-S04-28 | Đường dẫn ảnh không phải `https://` | Lỗi "Đường dẫn ảnh phải bắt đầu bằng https://"; nút Lưu disable; không gọi API | Low | E-S04-06, BRule-S04-08 | — |  |
| CL-S04-29 | Mất kết nối khi lưu hồ sơ | Giá trị vừa nhập **còn nguyên** trong ô; thông báo lỗi kết nối trên form; **form không reset về giá trị cũ** | Medium | E-S04-07, R-S04-08 | — |  |
| CL-S04-30 | Cố sửa trường không cho phép | Máy chủ **bỏ qua** `email`/`vai_tro`; chỉ `ho_ten` được áp dụng | High | E-S04-08, BRule-S04-02, BRule-S04-03 | — |  |
| CL-S04-31 | Mật khẩu hiện tại không đúng | API `400`/`401`; lỗi "Mật khẩu hiện tại không đúng." hiện **ngay dưới trường Mật khẩu hiện tại**; hai trường còn lại giữ nguyên | High | E-S04-09, R-S04-14, BRule-S04-04 | — |  |
| CL-S04-32 | Mật khẩu mới trùng mật khẩu cũ | Lỗi "Mật khẩu mới phải khác mật khẩu hiện tại"; nút disable; **không** gọi API | Medium | E-S04-10, BRule-S04-05 | — |  |
| CL-S04-33 | Xác nhận mật khẩu không khớp | Lỗi "Mật khẩu xác nhận không khớp."; nút "Đổi mật khẩu" disable | Low | E-S04-11, R-S04-12 | — |  |
| CL-S04-34 | Mật khẩu mới không đạt chính sách | Lỗi "Mật khẩu tối thiểu 8 ký tự gồm chữ và số"; nút disable | Medium | E-S04-12, R-S04-N02 | — |  |
| CL-S04-35 | Bị chặn đổi mật khẩu do thử sai nhiều lần | Thao tác đổi mật khẩu bị chặn 15 phút; thông báo ghi rõ **thời gian còn lại**; lần thứ 6 dù đúng cũng bị chặn | High | E-S04-13, R-S04-N04 | — |  |
| CL-S04-36 | Mất kết nối khi đổi mật khẩu | Giữ nguyên 3 trường mật khẩu; hiện "Lỗi kết nối — thử lại"; không gọi máy chủ | Medium | E-S04-14, R-S04-N04, UC-S04-03 | — |  |
| CL-S04-37 | Ảnh đại diện tải thất bại (ảnh chết) | **Rơi về** chữ cái đầu họ tên; không hiện ô ảnh vỡ, không báo lỗi ầm ĩ | Low | UC-S04-01, R-S04-02 | — |  |
| CL-S04-38 | Đổi mật khẩu khi chỉ có một phiên | Không có phiên nào để thu hồi → luồng vẫn thành công, không lỗi | Medium | UC-S04-04 | — |  |
| CL-S04-39 | Thu hồi phiên thất bại một phần | Ghi log; **không** cuộn ngược việc đổi mật khẩu (mật khẩu mới vẫn có hiệu lực) | Medium | UC-S04-04 | — |  |
| CL-S04-40 | Rời màn khi không có thay đổi | Điều hướng đi thẳng, **không** hiện hộp cảnh báo | Low | UC-S04-05, US-S04-05, R-S04-09 | — |  |
| CL-S04-41 | Rời màn khi chỉ gõ dở form Đổi mật khẩu | **Không** cảnh báo — mật khẩu gõ dở không phải dữ liệu cần cứu | Low | UC-S04-05, US-S04-05 | — |  |
| CL-S04-42 | Chọn "Rời đi" ở hộp cảnh báo | Điều hướng tiếp, thay đổi form 1 bị bỏ | Medium | UC-S04-05, US-S04-05, R-S04-09 | — |  |

## G5. Phân quyền & Vai trò
- *Bỏ* — màn **tự phục vụ, một tác nhân người** (mọi thao tác qua `/users/me` trên hồ sơ của chính người đăng nhập); không có ma trận vai trò × hành vi. Ràng buộc "chỉ chạm hồ sơ của mình" đã kiểm ở `CL-S04-25` (chặn hồ sơ người khác), `CL-S04-30` (bỏ qua trường không cho sửa) và `CL-S04-46` (không đường nào tới hồ sơ người khác).

## G6. Phi chức năng (bảo mật / hiệu năng / a11y)
| Mã | Hạng mục kiểm | Điều kiện đạt (ngưỡng/tiêu chí cụ thể) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S04-43 | Bảo mật — băm mật khẩu mới | Mật khẩu mới hash bằng bcrypt cost ≥ 12 trước khi lưu; không bao giờ lưu/log dạng plaintext | Critical | R-S04-N01 | — |  |
| CL-S04-44 | Bảo mật — không rò mật khẩu | Mật khẩu hiện tại/mới không xuất hiện trong URL, query string, log ứng dụng hay báo cáo lỗi | Critical | R-S04-N03 | — |  |
| CL-S04-45 | Bảo mật — giới hạn thử đổi mật khẩu | 5 lần sai trong 15 phút → chặn thao tác đổi mật khẩu 15 phút; **chỉ** chặn đổi mật khẩu, không khoá đăng nhập | High | R-S04-N04 | — |  |
| CL-S04-46 | Bảo mật/dữ liệu — chỉ hồ sơ của mình | Màn chỉ đọc/ghi hồ sơ của chính người đăng nhập; không tồn tại đường nào đọc hồ sơ người khác từ màn | Critical | R-S04-N05, BRule-S04-01 | — |  |
| CL-S04-47 | Khả năng tiếp cận (a11y) | Mọi ô nhập có nhãn liên kết; lỗi công bố qua `role="alert"`; trường bắt buộc có `aria-required`; thao tác đủ bằng bàn phím; tương phản ≥ 4.5:1 | Medium | R-S04-N06 | — |  |
| CL-S04-48 | Hiệu năng | Tải màn hồ sơ hoàn tất ≤ 2 giây ở p95 với 200 người dùng đồng thời | Medium | R-S04-N07 | — |  |

## G7. Tương thích & Liên màn
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S04-49 | Điều hướng "← Quay lại Dashboard" | Đi đúng sang [S02 Dashboard] theo user flow; chặn lại nếu form 1 còn thay đổi chưa lưu | Medium | R-S04-09, design-spec §1, §2 | — |  |
| CL-S04-50 | Cảnh báo thu hồi phiên đặt trước nút | Dòng "Đổi mật khẩu sẽ đăng xuất bạn khỏi mọi thiết bị khác." hiển thị **ngay trên** nút Đổi mật khẩu, trước khi thao tác | Medium | R-S04-15, US-S04-04, design-spec §3 | — |  |
| CL-S04-51 | Nhất quán với S06 | Thanh đo độ mạnh và luật mật khẩu (nhãn Yếu/Trung bình/Mạnh, ngưỡng ≥8 + chữ + số) **giống hệt** màn S06 Đăng ký | Low | R-S04-11, R-S04-N02, design-spec §8 | — |  |
| CL-S04-52 | Trình quản lý mật khẩu | `autocomplete` đúng loại: `current-password` cho trường hiện tại, `new-password` cho hai trường còn lại — trình quản lý mật khẩu hoạt động đúng | Low | design-spec §6, §8 | — |  |
| CL-S04-53 | Mobile dùng được đầy đủ | Ba khối/hai form không tràn ngang, mọi trường và nút thao tác được trên viewport hẹp | Low | design-spec §1 | — | Breakpoint cụ thể chưa nêu — xem "Cần làm rõ" |

## Cần làm rõ
- **Ngưỡng responsive/breakpoint:** `design-spec.md` §1 yêu cầu "mobile phải dùng được đầy đủ" nhưng chưa nêu breakpoint số cụ thể → `CL-S04-53` giữ ở mức quan sát chung (không tràn, thao tác được), chưa đặt ngưỡng. Bổ sung nếu dự án chốt breakpoint.
- **Proxy ảnh đại diện:** Câu hỏi mở trong `brainstorm.md` (rủi ro dán URL ảnh ngoài — rò IP, đổi nội dung sau duyệt) chưa chốt có dùng proxy ảnh hay không → chưa đưa mục kiểm bảo mật ảnh ngoài (không suy đoán). Bổ sung khi đội kỹ thuật chốt.

## Thuật ngữ
- **Checklist high-level:** danh mục điểm cần kiểm ở mức cao (một dòng/điểm), chưa phải test case chi tiết.
- **N/A:** hạng mục không áp dụng cho màn này.
- **Tự phục vụ (self-service):** người dùng chỉ thao tác trên hồ sơ của chính mình qua `/users/me`, không cần quản trị viên.
- **Thu hồi phiên (session revocation):** vô hiệu hoá phiên đăng nhập đang mở, buộc thiết bị đó đăng nhập lại (xem `srs.md`).
- **bcrypt:** thuật toán băm mật khẩu có chi phí tính toán điều chỉnh được (cost factor).
- **Nội dung hỗn hợp (mixed content):** trang `https` nhúng tài nguyên `http` — trình duyệt chặn hoặc cảnh báo (lý do chỉ nhận ảnh `https://`).
