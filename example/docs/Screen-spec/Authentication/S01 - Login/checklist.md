# Checklist kiểm thử (high-level) — Đăng nhập (S01)

> Nguồn: `srs.md` · `usecase.md` · `userstory.md` · `design-spec.md` của màn.
> Bổ trợ `test.md` (ca chi tiết). Mỗi mục có mã `CL-S..`; `ba-test` bám các mã này để sinh `TC` (mỗi `CL` ≥1 `TC`).

| Tổng mục | Pass | Fail | N/A | Chưa kiểm | Ưu tiên Critical/High | Cập nhật cuối |
|---:|---:|---:|---:|---:|:--|:--|
| 29 | 0 | 0 | 0 | 29 | 2/7 | 2026-08-11 |

## G1. Chức năng chính (happy path)
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S01-01 | Đăng nhập đúng email + mật khẩu | Nhận token, chuyển về Dashboard (hoặc URL gốc trước redirect) | High | UC-S01-01, R-S01-03, R-S01-04 | — |  |
| CL-S01-02 | Đã có session hợp lệ mở /login | Redirect thẳng Dashboard, không hiện lại form | Medium | R-S01-08 | — |  |
| CL-S01-03 | Đăng xuất từ màn bất kỳ | Revoke session và redirect về /login | Medium | R-S01-09 | — |  |

## G2. Nhập liệu & Validation
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S01-04 | Email đúng định dạng RFC 5321 | Rời trường email sai định dạng → lỗi inline; đúng → cho submit | Medium | R-S01-02 | — |  |
| CL-S01-05 | Email & Mật khẩu bắt buộc | Bấm Đăng nhập khi 1 trong 2 rỗng → chặn, báo lỗi inline | Medium | R-S01-01 | — |  |
| CL-S01-06 | Email ≤ 254 ký tự | Nhập vượt 254 ký tự → chặn hoặc báo lỗi độ dài | Low | R-S01-02 | — |  |
| CL-S01-07 | Mật khẩu trong khoảng 8–128 ký tự | Ngoài khoảng → chặn, báo lỗi độ dài | Medium | R-S01-01 | — |  |
| CL-S01-08 | Toggle hiện/ẩn mật khẩu | Bấm icon mắt đổi hiện↔ẩn nội dung; aria-label đổi theo | Low | R-S01-10 | — |  |

## G3. Trạng thái giao diện
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S01-09 | State Idle/Empty | Form trắng, nút Đăng nhập active, không thông báo lỗi | Low | design-spec §4 | — |  |
| CL-S01-10 | State Loading | Nút "Đang đăng nhập..." + spinner; 2 input disabled | Medium | design-spec §4, R-S01-03 | — |  |
| CL-S01-11 | State Success | Không toast/modal; chuyển im lặng về Dashboard | Medium | design-spec §4, R-S01-04 | — |  |
| CL-S01-12 | State Error — sai thông tin | Thông báo inline + xoá nội dung mật khẩu + focus về mật khẩu | High | design-spec §4, R-S01-05 | — |  |

## G4. Lỗi & Ngoại lệ
| Mã | Hạng mục kiểm | Điều kiện đạt (thông báo/hành vi nguyên văn) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S01-13 | Email sai định dạng | Lỗi inline "Vui lòng nhập địa chỉ email hợp lệ." | Low | E-S01-01 | — |  |
| CL-S01-14 | Thiếu trường bắt buộc | Lỗi inline dưới trường bỏ trống | Low | E-S01-02 | — |  |
| CL-S01-15 | Email vượt độ dài | Chặn từ ký tự 255 hoặc báo "Email tối đa 254 ký tự" | Low | E-S01-03 | — |  |
| CL-S01-16 | Mật khẩu ngoài 8–128 | Chặn, báo "Mật khẩu tối thiểu 8 ký tự" (hoặc tối đa 128) | Low | E-S01-04 | — |  |
| CL-S01-17 | Sai email/mật khẩu (401, fail<5) | "Sai email hoặc mật khẩu. Còn [X] lần thử." | High | E-S01-05, R-S01-05 | — |  |
| CL-S01-18 | Khoá tạm | Thông báo khoá + đồng hồ đếm ngược; nút disabled. Đúng mật khẩu vẫn không vào được khi đang khoá | High | E-S01-06, R-S01-06, BRule-S01-04 | — |  |
| CL-S01-19 | Khoá vĩnh viễn | Thông báo khoá vĩnh viễn cố định; nút disabled, không đồng hồ | Critical | E-S01-07, R-S01-07, BRule-S01-03 | — | Lối thoát: Org Admin mở khoá ở S05 |
| CL-S01-20 | Mất kết nối khi đăng nhập | Snackbar "Lỗi kết nối. Vui lòng thử lại."; form enable lại | Medium | E-S01-08, R-S01-03 | — |  |
| CL-S01-21 | Vượt rate limit IP | Request > 20/phút/IP → HTTP 429 | High | E-S01-09, R-S01-N01 | — |  |
| CL-S01-22 | Mất kết nối khi đăng xuất | Vẫn xoá token phía client và redirect về /login | Medium | E-S01-10, R-S01-09 | — |  |
| CL-S01-23 | Buộc đổi mật khẩu | Cờ `phai_doi_mat_khau=true` → chặn mọi điều hướng, ép sang màn đổi MK | High | E-S01-11, R-S01-11, BRule-S01-07 | — | *(CR-02)* |

## G5. Phân quyền & Vai trò
- *Bỏ* — màn xác thực, một loại người dùng (khách chưa đăng nhập); gating theo session đã kiểm ở `CL-S01-02`. Chống dò tài khoản kiểm ở `CL-S01-25`.

## G6. Phi chức năng (bảo mật / hiệu năng / a11y)
| Mã | Hạng mục kiểm | Điều kiện đạt (ngưỡng/tiêu chí cụ thể) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S01-24 | Bảo mật — bảo vệ mật khẩu | Không log console, không trên URL; chỉ gửi HTTPS trong request body | Critical | R-S01-N02 | — |  |
| CL-S01-25 | Bảo mật — chống dò tài khoản | Thông báo luôn "Sai email hoặc mật khẩu" bất kể email tồn tại hay không | High | R-S01-05, BRule-S01-05 | — |  |
| CL-S01-26 | Hiệu năng | Nhấn Đăng nhập → redirect Dashboard ≤ 2 giây (mạng bình thường) | Medium | R-S01-N03 | — |  |
| CL-S01-27 | Khả năng sử dụng | Tab order Email→Mật khẩu→Nút; Enter trong mật khẩu = submit | Medium | R-S01-N04 | — |  |
| CL-S01-28 | Khả năng tiếp cận (a11y) | Input/thông báo có label/aria-label; tương phản nền/chữ ≥ 4.5:1 | Medium | R-S01-N05 | — |  |

## G7. Tương thích & Liên màn
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S01-29 | Điều hướng buộc đổi mật khẩu | Từ trạng thái buộc đổi MK đi đúng sang màn đổi mật khẩu S04 | Medium | R-S01-11, R-S04-14 | — | *(CR-02)* |

## Cần làm rõ
- Responsive/đa kích thước màn hình: `design-spec.md` chưa nêu ngưỡng breakpoint cụ thể → chưa đưa mục kiểm (không suy đoán). Bổ sung nếu dự án yêu cầu.

## Thuật ngữ
- **Checklist high-level:** danh mục điểm cần kiểm ở mức cao (một dòng/điểm), chưa phải test case chi tiết.
- **N/A:** hạng mục không áp dụng cho màn này.
- **TEMP_LOCKED / PERM_LOCKED:** trạng thái khoá tạm / khoá vĩnh viễn của tài khoản (xem `srs.md`).
