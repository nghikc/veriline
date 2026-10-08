# Review — Đăng nhập (Mã màn: S01)

> model: claude-opus-5
> diff: 3f9c1a2..b7e3fa9  ·  vòng: 1
> ngày: 2026-09-15 · gốc code: . · hồ sơ: full

## TL;DR
Diff thêm endpoint `POST /auth/login`, khoá tài khoản sau 5 lần sai (BRule-S01-02) và form đăng nhập. Một blocker: bộ đếm sai được reset ngay cả khi mật khẩu sai, nên rule khoá không bao giờ kích hoạt. Verdict REQUEST_CHANGES.

## Findings
| Mã | Mức | file:line | Vấn đề | Bằng chứng | Cách sửa |
|---|---|---|---|---|---|
| J-01 | 🔴 | `src/auth/login.service.ts:57` | `failedAttempts` được đặt về 0 ở đầu hàm, trước khi so mật khẩu, nên TC-S01-07 (khoá sau 5 lần) không bao giờ đạt dù test xanh | `src/auth/login.service.ts:57` reset · `tests/auth/login.test.ts:81` chỉ assert `not.toThrow` thay vì assert `locked === true` · chạy `npx jest -t "TC-S01-07"` với assert đúng → exit 1 | chuyển dòng reset xuống nhánh mật khẩu đúng (sau `:63`), sửa assert ở `tests/auth/login.test.ts:81` thành `expect(user.locked).toBe(true)` |
| J-02 | 🟠 | `src/auth/login.controller.ts:31` | Thông báo lỗi trả về phân biệt "sai email" và "sai mật khẩu", srs mục 5 (`Error-S01-01`) yêu cầu một thông báo chung | `src/auth/login.controller.ts:31` và `:38` hai chuỗi khác nhau · `docs/Screen-spec/S01 - Login/srs.md:142` | dùng một hằng `MSG_LOGIN_FAILED` cho cả hai nhánh |
| J-03 | 🟡 | `src/auth/login.service.ts:12` | Bình luận `// tăng bộ đếm` lặp lại đúng dòng code bên dưới | — | xoá bình luận |
| J-04 | 🟡 | `src/ui/LoginForm.tsx:44` | `console.log(payload)` còn lại trong handler submit (lượt D đọc diff) | — | xoá |

## Nit vượt ngân sách · pre-existing
- 0 nit khác.
- 🟣 `src/auth/session.ts:120` — hàm `refresh()` nuốt lỗi mạng bằng `catch {}` từ trước diff này; ghi nhận, không tính vào verdict.

## Bậc thang cơ giới (chạy trước khi đọc diff — thứ lint/typecheck đã bắt KHÔNG thành finding)
- lint: `npm run lint` → exit 0 · typecheck: `npx tsc --noEmit` → exit 0 · test: `npx jest` → 18 passed, 0 failed, 0 skipped
- `scan-bypasses.js`: 1 phát hiện (assert-loose 1) · 212 dòng lõi — assert-loose thành J-01 (nó che blocker)

## Nguồn ngoài đã tra
- không đụng thư viện/API ngoài (chỉ dùng API nội bộ đã có)

## Chuyển thành luật lint
- `no-console` của eslint bật cho `src/**` — J-04 sẽ do lint bắt ở vòng sau

## File cơ giới bỏ qua
- `package-lock.json`

**Verdict:** REQUEST_CHANGES
