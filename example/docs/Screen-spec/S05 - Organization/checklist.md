# Checklist kiểm thử (high-level) — Tổ chức (S05)

> Nguồn: `srs.md` · `usecase.md` · `userstory.md` · `design-spec.md` của màn.
> Bổ trợ `test.md` (ca chi tiết). Mỗi mục có mã `CL-S..`; `ba-test` bám các mã này để sinh `TC` (mỗi `CL` ≥1 `TC`).

| Tổng mục | Pass | Fail | N/A | Chưa kiểm | Ưu tiên Critical/High | Cập nhật cuối |
|---:|---:|---:|---:|---:|:--|:--|
| 65 | 0 | 0 | 0 | 65 | 12/18 | 2026-08-11 |

## G1. Chức năng chính (happy path)
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S05-01 | Xem thông tin tổ chức | Khối "Thông tin tổ chức" hiện đủ 5 mục (logo, tên, slug, ngày tạo, tổng số thành viên) khớp `GET /organizations/me`; slug ở dạng chỉ đọc kèm biểu tượng khoá + chú thích "không đổi được" | High | R-S05-01, R-S05-04, UC-S05-01, US-S05-01 | — |  |
| CL-S05-02 | Sửa & lưu tên/logo tổ chức | Sửa tên/logo → nút Lưu bật; `PATCH /organizations/me` gọi 1 lần chỉ trường đã đổi; sau 200: logo/tên trên màn cập nhật + toast "Đã cập nhật thông tin tổ chức" | High | R-S05-02, R-S05-05, UC-S05-01, US-S05-01 | — |  |
| CL-S05-03 | Xem danh sách thành viên | Mỗi dòng đủ 5 cột (họ tên, email, vai trò, trạng thái, ngày tham gia); tổng số hiện ở tiêu đề khối "Thành viên (n)" | High | R-S05-07, UC-S05-02, US-S05-02 | — |  |
| CL-S05-04 | Tìm + lọc kết hợp | Gõ từ khoá (debounce 300ms, không phân biệt hoa thường) và chọn lọc vai trò/trạng thái → danh sách = giao các điều kiện, không reload | Medium | R-S05-08, UC-S05-02, US-S05-02 | — |  |
| CL-S05-05 | Phân trang "Tải thêm" | Tổ chức >20 người → hiện đúng 20 dòng + nút "Tải thêm"; nhấn → thêm 20 dòng kế | Low | R-S05-10, US-S05-02 | — |  |
| CL-S05-06 | Mời thành viên mới | Điền hợp lệ → `POST` trả `201`; người mới vào danh sách, tổng số +1; tài khoản tạo ra mang cờ `phai_doi_mat_khau = true` | High | R-S05-12, UC-S05-03, US-S05-04 | — | *(CR-02)* |
| CL-S05-07 | Bàn giao mật khẩu tạm | Sau `201`: hộp hiện mật khẩu tạm + nút "Sao chép" + cảnh báo sẽ không hiện lại | High | R-S05-13, UC-S05-04, US-S05-04 | — |  |
| CL-S05-08 | Đổi vai trò thành viên | Chọn vai trò mới → `PATCH` gọi 1 lần → badge đổi ngay; quyền mới có hiệu lực ở lời gọi API kế tiếp của người đó, không cần đăng nhập lại | High | R-S05-15, UC-S05-05, US-S05-05, BRule-S05-11 | — |  |
| CL-S05-09 | Vô hiệu hoá tài khoản | Hộp xác nhận nêu 3 hệ quả + số công việc đang giao; đồng ý → badge "Vô hiệu", dòng **vẫn còn** trong danh sách (không xoá vật lý) | High | R-S05-16, UC-S05-06, US-S05-05, BRule-S05-03 | — |  |
| CL-S05-10 | Thu hồi mọi phiên khi vô hiệu | Người bị vô hiệu nhận `401` ở lời gọi API kế tiếp và bị chuyển về `/login`; không đăng nhập lại được | Critical | R-S05-17, UC-S05-09, US-S05-05, BRule-S05-04 | — |  |
| CL-S05-11 | Kích hoạt lại tài khoản | Dòng INACTIVE → chọn "Kích hoạt lại" → badge "Hoạt động"; người đó đăng nhập lại được bằng mật khẩu cũ | Medium | R-S05-18, UC-S05-08, US-S05-05 | — |  |
| CL-S05-12 | Mở khoá tài khoản khoá vĩnh viễn | Dòng `PERM_LOCKED` → chọn "Mở khoá" → `ACTIVE`; người đó đăng nhập lại được; hệ thống ghi 1 dòng audit "Org Admin mở khoá tài khoản" | High | R-S05-21, UC-S05-10 | — |  |

## G2. Nhập liệu & Validation
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S05-13 | Tên tổ chức — bắt buộc, 1–100, không toàn khoảng trắng | Rỗng/toàn khoảng trắng hoặc >100 ký tự → chặn; bộ đếm `n/100` cập nhật realtime | Medium | R-S05-02 | — |  |
| CL-S05-14 | Logo — `https://`, ≤ 2048, rỗng hợp lệ | Chuỗi không bắt đầu `https://` hoặc > 2048 ký tự → chặn; bỏ trống hợp lệ | Low | R-S05-03, BRule-S05-10 | — |  |
| CL-S05-15 | Nút "Lưu thay đổi" chỉ bật khi có thay đổi | Mở màn hoặc hoàn tác về giá trị gốc → nút disable; có trường khác giá trị gốc → bật | Medium | R-S05-05, UC-S05-01 | — |  |
| CL-S05-16 | Email (modal mời) — bắt buộc, đúng định dạng, ≤ 254 | Sai định dạng / rỗng / > 254 ký tự → chặn, nút "Tạo tài khoản" disable | Medium | R-S05-12 | — |  |
| CL-S05-17 | Họ tên (modal mời) — bắt buộc, 1–100 | Rỗng / toàn khoảng trắng / > 100 ký tự → chặn | Low | R-S05-12 | — |  |
| CL-S05-18 | Vai trò (modal mời) — enum, mặc định "Thành viên" | Chỉ nhận MEMBER/TEAM_LEAD/ORG_ADMIN; mở modal mặc định "Thành viên" | Low | R-S05-12 | — |  |
| CL-S05-19 | Mật khẩu tạm — 8–64, ≥1 chữ + ≥1 số, có nút sinh ngẫu nhiên | Ngoài khoảng hoặc thiếu chữ/số → chặn; nút `⟳` sinh mật khẩu đạt chính sách | Medium | R-S05-12 | — |  |

## G3. Trạng thái giao diện
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S05-20 | State Loading — hai khối tải riêng | Khối xong trước hiện trước, khối kia còn skeleton; dòng đang xử lý hiện spinner ở cột hành động + khoá menu của dòng đó | Medium | design-spec §4 | — |  |
| CL-S05-21 | State Empty — chỉ khi lọc không khớp | Danh sách gốc không bao giờ rỗng; lọc không khớp ai → "Không tìm thấy thành viên phù hợp" + nút "Xoá bộ lọc" | Medium | R-S05-09, design-spec §4 | — |  |
| CL-S05-22 | State Error — cục bộ từng khối | Lỗi tải danh sách chỉ báo trong khối Thành viên, khối Thông tin tổ chức vẫn sửa được (và ngược lại) | Medium | design-spec §4, E-S05-02 | — |  |
| CL-S05-23 | State Success — cập nhật tại chỗ | Toast/hiệu ứng `highlight-once`; badge đổi tại chỗ bằng crossfade, không vẽ lại cả bảng | Low | design-spec §4 | — |  |
| CL-S05-24 | Logo rỗng/tải lỗi → chữ cái đầu | Không có logo hợp lệ → hiện chữ cái đầu tên tổ chức trên nền màu | Low | R-S05-03, design-spec §4 | — |  |
| CL-S05-25 | Menu hành động đổi theo trạng thái dòng | Dòng ACTIVE: có "Đổi vai trò"/"Vô hiệu hoá"; INACTIVE: **chỉ** "Kích hoạt lại"; `PERM_LOCKED`: **chỉ** "Mở khoá" | Medium | design-spec §3, R-S05-18, R-S05-21 | — |  |

## G4. Lỗi & Ngoại lệ
| Mã | Hạng mục kiểm | Điều kiện đạt (thông báo/hành vi nguyên văn) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S05-26 | Member cố mở màn Tổ chức | Bị chặn ngay (về Dashboard hoặc trang "Không có quyền truy cập"); danh sách thành viên không kịp render | Critical | E-S05-01, R-S05-N05 | — |  |
| CL-S05-27 | Không tải được thông tin tổ chức | Khối lỗi + nút "Thử lại" | Medium | E-S05-02, R-S05-01 | — |  |
| CL-S05-28 | Tên tổ chức rỗng | Lỗi "Vui lòng nhập tên tổ chức"; nút Lưu disable | Low | E-S05-03, R-S05-02 | — |  |
| CL-S05-29 | Tên tổ chức vượt 100 ký tự | Lỗi "Tên tổ chức tối đa 100 ký tự"; bộ đếm `101/100` đỏ; nút Lưu disable | Low | E-S05-04, R-S05-02 | — |  |
| CL-S05-30 | Đường dẫn logo không phải `https://` | Lỗi "Đường dẫn logo phải bắt đầu bằng https://"; nút Lưu disable | Low | E-S05-05, BRule-S05-10 | — |  |
| CL-S05-31 | Mất kết nối khi lưu thông tin tổ chức | Giá trị đã nhập **còn nguyên**; thông báo lỗi kết nối; form không reset về tên cũ | Medium | E-S05-06, R-S05-06 | — |  |
| CL-S05-32 | Cố sửa slug qua API | Máy chủ bỏ qua trường không cho sửa; chỉ `ten` được áp dụng | Low | E-S05-07, BRule-S05-02 | — |  |
| CL-S05-33 | Email mời đã tồn tại (`409`) | Lỗi "Email này đã được sử dụng." hiện **dưới trường Email**; ba trường còn lại giữ nguyên; modal không đóng | High | E-S05-08, R-S05-14, BRule-S05-06 | — |  |
| CL-S05-34 | Email mời sai định dạng | Lỗi "Email không hợp lệ"; nút "Tạo tài khoản" disable; không gọi API | Low | E-S05-09, R-S05-12 | — |  |
| CL-S05-35 | Mật khẩu tạm không đạt chính sách | Lỗi "Mật khẩu tối thiểu 8 ký tự gồm chữ và số"; nút disable | Low | E-S05-10, R-S05-12 | — |  |
| CL-S05-36 | Không xem lại được mật khẩu tạm | Đóng hộp rồi thì **không đường nào** trong giao diện xem lại; response API không chứa mật khẩu lẫn hash | Critical | E-S05-11, R-S05-N04 | — |  |
| CL-S05-37 | Team Lead cố thao tác thành viên | Nút "+ Mời thành viên" và cột `[⋮]` **không tồn tại trong DOM**; gọi thẳng API thì `403`, dữ liệu không đổi | High | E-S05-12, R-S05-N02, BRule-S05-01 | — |  |
| CL-S05-38 | Thao tác lên người của tổ chức khác | HTTP `404` (**không phải `403`**) — không lộ sự tồn tại; dữ liệu không đổi | High | E-S05-13, R-S05-N01 | — |  |
| CL-S05-39 | Hạ vai trò Org Admin cuối cùng | Thao tác **bị khoá (mờ)** kèm giải thích; gọi thẳng API thì `409` "Không thể hạ vai trò quản trị viên duy nhất của tổ chức."; vai trò không đổi | Critical | E-S05-14, R-S05-19, BRule-S05-05 | — |  |
| CL-S05-40 | Vô hiệu hoá Org Admin cuối cùng | Thao tác bị khoá (mờ) kèm giải thích; API `409` "Không thể vô hiệu hoá quản trị viên duy nhất của tổ chức."; trạng thái không đổi | Critical | E-S05-15, R-S05-19, BRule-S05-05 | — |  |
| CL-S05-41 | Mất kết nối khi mời thành viên | Giữ nguyên mọi giá trị trong modal Mời; hiện "Lỗi kết nối — thử lại"; không gọi máy chủ | Medium | E-S05-16, R-S05-12, UC-S05-03 | — |  |
| CL-S05-42 | Chưa đăng nhập mở màn Tổ chức | Chuyển hướng về `/login` | Medium | UC-S05-01 | — |  |
| CL-S05-43 | Org Admin tự vô hiệu hoá mình (còn Admin khác) | Cho phép; sau khi xác nhận bị đăng xuất ngay và chuyển về `/login` | High | BRule-S05-12, UC-S05-06, US-S05-06 | — |  |
| CL-S05-44 | Vô hiệu hoá không tự chuyển công việc | Công việc đang giao **giữ nguyên người thực hiện**; hộp xác nhận chỉ cảnh báo số lượng | Medium | BRule-S05-08, UC-S05-06, US-S05-05 | — |  |
| CL-S05-45 | Org Admin khác đang INACTIVE không được tính | Thử hạ/vô hiệu Org Admin còn lại khi người kia đang INACTIVE → vẫn bị chặn | High | BRule-S05-05, UC-S05-07, US-S05-06 | — |  |
| CL-S05-46 | Hai Org Admin tự hạ vai trò đồng thời | Đúng **một** người thành công, người kia nhận `409`; không bao giờ cả hai cùng thành công | Critical | R-S05-19, UC-S05-07, US-S05-06 | — |  |

## G5. Phân quyền & Vai trò
> Màn có 3 vai trò (Org Admin / Team Lead / Member) với phân quyền hai tầng (`BRule-S05-01`) — mỗi ô ma trận vai trò × hành vi là một điểm kiểm.

| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S05-47 | Team Lead × sửa thông tin tổ chức (F11) | **Được phép** sửa tên/logo và lưu bình thường | High | BRule-S05-01, R-S05-02, US-S05-03 | — |  |
| CL-S05-48 | Team Lead × xem danh sách thành viên | **Được phép** xem đầy đủ danh sách (chỉ đọc); bảng có đúng 5 cột, không có nút/cột thao tác | High | BRule-S05-01, R-S05-07, US-S05-03 | — |  |
| CL-S05-49 | Team Lead × thao tác thành viên (mời/đổi vai/vô hiệu) | **Bị chặn**: nút và cột hành động không render; gọi thẳng API → `403`, dữ liệu không đổi | Critical | R-S05-11, R-S05-N02, E-S05-12 | — |  |
| CL-S05-50 | Member × truy cập màn Tổ chức | **Bị chặn** ngay ở tầng điều hướng; không render danh sách thành viên dù chỉ trong khoảnh khắc | Critical | R-S05-N05, E-S05-01 | — |  |
| CL-S05-51 | Team Lead/Member × gọi thẳng API thao tác | Mọi ràng buộc phân quyền kiểm lại ở máy chủ → `403` dù giao diện không hiện nút | Critical | R-S05-N02, BRule-S05-01 | — |  |
| CL-S05-52 | Org Admin × toàn quyền thao tác thành viên | Nút "+ Mời thành viên" và cụm hành động mỗi dòng hiện đủ | High | R-S05-11, BRule-S05-01 | — |  |
| CL-S05-53 | Mở khoá `PERM_LOCKED` — chỉ Org Admin | Team Lead/Member **không thấy** nút "Mở khoá"; gọi thẳng API → `403` | High | BRule-S05-13, R-S05-21 | — |  |

## G6. Phi chức năng (bảo mật / hiệu năng / a11y)
| Mã | Hạng mục kiểm | Điều kiện đạt (ngưỡng/tiêu chí cụ thể) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S05-54 | Bảo mật — cách ly dữ liệu tổ chức | Danh sách thành viên **chỉ** chứa người cùng tổ chức; không đường nào đọc được thành viên tổ chức khác | Critical | R-S05-N01, US-S05-02 | — |  |
| CL-S05-55 | Bảo mật — băm mật khẩu tạm | Mật khẩu tạm hash bằng bcrypt cost ≥ 12; không lưu và không log dạng plaintext | Critical | R-S05-N03 | — |  |
| CL-S05-56 | Bảo mật — mật khẩu tạm chỉ xuất hiện một lần | Chỉ trong phản hồi tạo tài khoản; không endpoint nào đọc lại được sau đó | Critical | R-S05-N04, E-S05-11 | — |  |
| CL-S05-57 | Hiệu năng — tải màn | Thông tin tổ chức + trang đầu 20 thành viên tải xong ≤ 2 giây ở p95 với 200 người dùng đồng thời | Medium | R-S05-N06 | — |  |
| CL-S05-58 | Khả năng tiếp cận (a11y) | Badge vai trò/trạng thái phân biệt được không chỉ bằng màu; bảng có tiêu đề cột liên kết đúng; thao tác đủ bằng bàn phím; tương phản ≥ 4.5:1 | Medium | R-S05-N07 | — |  |

## G7. Tương thích & Liên màn
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S05-59 | Điều hướng "← Quay lại Dashboard" | Nhấn liên kết quay lại → đi đúng về S02 Dashboard | Low | UC-S05-01, design-spec §2 | — |  |
| CL-S05-60 | Menu avatar "Tổ chức" theo vai trò | Mục "Tổ chức" **chỉ hiện** với Team Lead và Org Admin | Medium | design-spec §2, R-S05-N05 | — |  |
| CL-S05-61 | INACTIVE biến khỏi dropdown "Người thực hiện" (S02/S03) | Vô hiệu hoá một người → dropdown "Người thực hiện" ở S02 và S03 không còn người đó (nhất quán `BRule-S02-05`) | High | R-S05-20, BRule-S05-09, US-S05-05 | — |  |
| CL-S05-62 | Bàn giao mật khẩu tạm → đăng nhập S01 | Người mới đăng nhập lần đầu ở S01 bằng email + mật khẩu tạm (kênh ngoài, hệ thống không gửi email) | Medium | UC-S05-04, BRule-S05-07 | — |  |
| CL-S05-63 | Mở khoá khép phụ thuộc S01 (`E-S01-07`) | Tài khoản `PERM_LOCKED` do S01 đặt → sau "Mở khoá" đăng nhập lại được ở S01 | Medium | R-S05-21, UC-S05-10 | — |  |
| CL-S05-64 | Buộc đổi mật khẩu lần đầu ở S01 (`CR-02`) | Cờ `phai_doi_mat_khau=true` → người mới bị ép đổi mật khẩu ở lần đăng nhập đầu (thực thi ở S01, `R-S01-11`) | Medium | R-S05-12, BRule-S05-07 | — | *(CR-02)* |
| CL-S05-65 | Responsive — bảng → thẻ trên mobile | Màn hình < 768px: bảng thành viên chuyển thành danh sách thẻ, dùng đầy đủ chức năng | Low | design-spec §2, design-spec §7 | — |  |

## Cần làm rõ
- *(không có)* — mọi luồng chính, ngoại lệ, ma trận lỗi và ma trận phân quyền đều truy được về mã tồn tại trong `srs.md`/`usecase.md`/`userstory.md`/`design-spec.md`; không mục nào phải suy đoán.

## Thuật ngữ
- **Checklist high-level:** danh mục điểm cần kiểm ở mức cao (một dòng/điểm), chưa phải test case chi tiết.
- **N/A:** hạng mục không áp dụng cho màn này.
- **Phân quyền hai tầng:** sửa thông tin tổ chức (F11) = Team Lead + Org Admin; thao tác thành viên (F13) = chỉ Org Admin (`BRule-S05-01`).
- **INACTIVE / PERM_LOCKED:** trạng thái tài khoản bị vô hiệu hoá / khoá vĩnh viễn (xem `srs.md`).
- **Khoá chết tổ chức (admin lockout):** tổ chức không còn Org Admin đang hoạt động — không ai mời người/đổi vai trò được nữa (`BRule-S05-05`).
- **Mật khẩu tạm:** mật khẩu do Org Admin đặt khi tạo tài khoản, chuyển cho người mới qua kênh ngoài hệ thống (`BRule-S05-07`).
