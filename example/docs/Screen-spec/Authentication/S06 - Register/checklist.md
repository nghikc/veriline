# Checklist kiểm thử (high-level) — Đăng ký (S06)

> Nguồn: `srs.md` · `usecase.md` · `userstory.md` · `design-spec.md` của màn.
> Bổ trợ `test.md` (ca chi tiết). Mỗi mục có mã `CL-S..`; `ba-test` bám các mã này để sinh `TC` (mỗi `CL` ≥1 `TC`).

| Tổng mục | Pass | Fail | N/A | Chưa kiểm | Ưu tiên Critical/High | Cập nhật cuối |
|---:|---:|---:|---:|---:|:--|:--|
| 35 | 0 | 0 | 0 | 35 | 2/4 | 2026-08-11 |

## G1. Chức năng chính (happy path)
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S06-01 | Đăng ký + tạo tổ chức thành công | Tạo tài khoản và tổ chức, tự cấp session, redirect /dashboard với vai trò Org Admin trong ≤ 3 giây | High | UC-S06-01, R-S06-06, R-S06-08, BRule-S06-05, US-S06-01 (GWT-1) | — |  |
| CL-S06-02 | Đã có session hợp lệ mở /register | Redirect /dashboard trong ~100ms, form không render | Medium | UC-S06-06, R-S06-09 | — |  |

## G2. Nhập liệu & Validation
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S06-03 | Email đúng định dạng RFC 5321 | Rời trường email sai định dạng → lỗi inline, không gọi API; đúng → cho submit | Medium | R-S06-02 | — |  |
| CL-S06-04 | Email & Mật khẩu bắt buộc | Submit khi 1 trong 2 rỗng → chặn, lỗi inline; không gọi API | Medium | R-S06-01 | — |  |
| CL-S06-05 | Thanh đo độ mạnh mật khẩu realtime | Xuất hiện ngay ký tự đầu; cập nhật mỗi ký tự; phân 3 mức Yếu/Trung bình/Mạnh | Medium | R-S06-03, US-S06-03 (GWT-6) | — |  |
| CL-S06-06 | Mật khẩu đạt chính sách tối thiểu | ≥ 8 ký tự, có chữ và số → mức ≥ "Trung bình" và nút Tạo tài khoản enable | High | R-S06-N02, BRule-S06-03, US-S06-03 (GWT-7) | — |  |
| CL-S06-07 | Mật khẩu mức "Mạnh" | Thêm ký tự đặc biệt hoặc đạt ≥ 12 ký tự → thanh chuyển "Mạnh" | Low | R-S06-N02, US-S06-03 (GWT-9) | — |  |
| CL-S06-08 | Xác nhận mật khẩu khớp | Khác mật khẩu gốc (blur) → lỗi inline + nút disable; sửa khớp → hết lỗi, nút enable | Medium | R-S06-04, US-S06-04 (GWT-11) | — |  |
| CL-S06-09 | Tên tổ chức bắt buộc | Để trống và submit → lỗi inline, không gọi API | Medium | R-S06-05, BRule-S06-04 | — |  |
| CL-S06-10 | Tên tổ chức tối đa 100 ký tự | Vượt 100 ký tự → chặn hoặc báo "Tên tổ chức không được vượt quá 100 ký tự." | Low | BRule-S06-04 | — |  |
| CL-S06-11 | Toggle hiện/ẩn 2 trường mật khẩu | Mỗi icon mắt đổi type=password↔type=text độc lập từng trường; aria-label đổi theo | Low | R-S06-10, US-S06-07 (GWT-15, GWT-16) | — |  |
| CL-S06-12 | Trim email & tên tổ chức | Khoảng trắng đầu/cuối tự trim trước validate/gửi API; không báo lỗi | Low | R-S06-02, R-S06-05 | — |  |

## G3. Trạng thái giao diện
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S06-13 | State Empty/idle | 4 trường trống, thanh độ mạnh ẩn, không thông báo lỗi, nút "Tạo tài khoản" active | Low | design-spec §4, R-S06-01 | — |  |
| CL-S06-14 | State Typing | Thanh độ mạnh hiện khi gõ ký tự đầu; lỗi inline chỉ xuất hiện sau khi blur | Low | design-spec §4, R-S06-03 | — |  |
| CL-S06-15 | State Loading | Nút "Đang tạo tài khoản..." + spinner; cả 4 trường input bị disabled | Medium | design-spec §4, R-S06-06 | — |  |
| CL-S06-16 | State Success | Không toast/modal; chuyển im lặng về /dashboard | Medium | design-spec §4, R-S06-08 | — |  |

## G4. Lỗi & Ngoại lệ
| Mã | Hạng mục kiểm | Điều kiện đạt (thông báo/hành vi nguyên văn) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S06-17 | Email sai định dạng | Lỗi inline "Vui lòng nhập địa chỉ email hợp lệ."; không có network request | Low | E-S06-01, R-S06-02 | — |  |
| CL-S06-18 | Thiếu trường bắt buộc | Lỗi validation trường bắt buộc; không gọi API | Low | E-S06-02, R-S06-01 | — |  |
| CL-S06-19 | Email đã được sử dụng (409) | Lỗi inline dưới Email "Email đã được sử dụng. Vui lòng dùng địa chỉ khác hoặc đăng nhập."; các trường khác giữ nguyên; focus về ô Email | High | E-S06-03, R-S06-07, BRule-S06-01, UC-S06-02, US-S06-02 (GWT-4, GWT-5) | — |  |
| CL-S06-20 | Mật khẩu không đạt chính sách | Thanh "Yếu" + lỗi inline "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái và chữ số."; nút disable | Medium | E-S06-04, R-S06-N02, BRule-S06-03, UC-S06-03, US-S06-03 (GWT-8) | — |  |
| CL-S06-21 | Xác nhận mật khẩu không khớp | Lỗi inline "Mật khẩu xác nhận không khớp." dưới trường Xác nhận; nút "Tạo tài khoản" disable | Medium | E-S06-05, R-S06-04, UC-S06-04, US-S06-04 (GWT-10) | — |  |
| CL-S06-22 | Thiếu tên tổ chức | Lỗi inline "Tên tổ chức không được để trống."; không gọi API | Low | E-S06-06, R-S06-05, BRule-S06-04, US-S06-05 (GWT-12) | — |  |
| CL-S06-23 | Vượt hạn mức đăng ký từ một IP | Cùng IP gửi > 10 request/phút tới /auth/register → HTTP 429 Too Many Requests | High | E-S06-07, R-S06-N03 | — |  |
| CL-S06-24 | Mất kết nối khi đang tạo tài khoản | Snackbar "Lỗi kết nối. Vui lòng thử lại."; form giữ nguyên dữ liệu đã nhập; nút enable lại | Medium | E-S06-08, R-S06-06, UC-S06-05 | — |  |
| CL-S06-25 | Tài khoản đã tạo trước timeout, thử lại | Thử lại nhận 409 → hiện lỗi email đã sử dụng; không tạo tài khoản trùng | Medium | UC-S06-05 [3a], E-S06-03, E-S06-08 | — |  |

## G5. Phân quyền & Vai trò
- *Bỏ* — màn tự đăng ký, một loại tác nhân chính là người dùng chưa có tài khoản (chưa xác thực). Trường hợp người đã đăng nhập mở /register được xử lý bằng redirect, đã kiểm ở `CL-S06-02`.

## G6. Phi chức năng (bảo mật / hiệu năng / a11y)
| Mã | Hạng mục kiểm | Điều kiện đạt (ngưỡng/tiêu chí cụ thể) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S06-26 | Bảo mật — hash mật khẩu | Mật khẩu hash bằng bcrypt cost factor ≥ 12 trước khi lưu; không bao giờ lưu plaintext | Critical | R-S06-N01 | — |  |
| CL-S06-27 | Bảo mật — bảo vệ mật khẩu | Không log console, không trên URL; chỉ gửi HTTPS trong request body | Critical | R-S06-N04 | — |  |
| CL-S06-28 | Bảo mật — thời hạn token | Access token 8 giờ, refresh token 30 ngày; phiên hết khi quá **7 ngày không hoạt động** hoặc chạm **trần 30 ngày** *(CR-04)* | Medium | BRule-S06-06, R-S06-06 | — |  |
| CL-S06-29 | Hiệu năng | Nhấn "Tạo tài khoản" → redirect Dashboard ≤ 3 giây (mạng bình thường, gồm tạo org + auto-login) | Medium | R-S06-N05 | — |  |
| CL-S06-30 | Khả năng sử dụng — thứ tự focus | Tab: Email → Mật khẩu → Xác nhận mật khẩu → Tên tổ chức → Nút Tạo tài khoản | Medium | R-S06-N06, US-S06-01 (GWT-2) | — |  |
| CL-S06-31 | Khả năng tiếp cận (a11y) | Input/thông báo lỗi có label/aria-label + role="alert"; thanh độ mạnh có aria-label bằng chữ; tương phản nền/chữ ≥ 4.5:1 | Medium | R-S06-N07 | — |  |

## G7. Tương thích & Liên màn
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S06-32 | Điều hướng link Đăng nhập | Nhấn "Đã có tài khoản? Đăng nhập" → chuyển đúng về /login (S01) | Medium | R-S06-01, US-S06-06 (GWT-14) | — |  |
| CL-S06-33 | Dashboard sau đăng ký | Sau đăng ký thành công, Dashboard (S02) hiển thị đúng tên tổ chức vừa tạo và vai trò Org Admin | Medium | R-S06-08, BRule-S06-02, US-S06-01 (GWT-3), US-S06-05 (GWT-13) | — |  |
| CL-S06-34 | Enter trong trường Tên tổ chức | Nhấn Enter trong trường Tên tổ chức = submit form (tương đương nút Tạo tài khoản) | Low | design-spec §6, R-S06-06 | — |  |
| CL-S06-35 | Responsive mobile < 375px | Card chiếm toàn viewport, 1 cột cuộn dọc, không border-radius/shadow, logo thu nhỏ | Low | design-spec §6, design-spec §1 | — |  |

## Cần làm rõ
- **Tính duy nhất của Tên tổ chức:** `GĐ-S06-01` (srs) giả định tên tổ chức *không cần* duy nhất toàn hệ thống — nhưng đang ⚠️ chưa xác nhận (câu hỏi mở trong `brainstorm.md`). Chưa thêm mục kiểm "chặn trùng tên tổ chức" (không suy đoán). Nếu chốt là cần duy nhất → bổ sung luật + thông báo lỗi ở `srs.md`, rồi thêm mục checklist tương ứng.

## Thuật ngữ
- **Checklist high-level:** danh mục điểm cần kiểm ở mức cao (một dòng/điểm), chưa phải test case chi tiết.
- **N/A:** hạng mục không áp dụng cho màn này.
- **Org Admin:** vai trò quản trị tổ chức, được gán tự động cho người tự đăng ký tạo tổ chức mới (xem `srs.md` BRule-S06-02).
- **Thanh đo độ mạnh mật khẩu:** chỉ báo trực quan phân mức Yếu / Trung bình / Mạnh, cập nhật theo thời gian thực khi gõ.
- **bcrypt:** thuật toán băm mật khẩu một chiều có cost factor; dùng để lưu mật khẩu an toàn (xem `srs.md` R-S06-N01).
