# Thang điểm cố định của `ac-eval` — và các mốc chuẩn để hai lần chấm cho cùng một số

> `ac-evaluator` đọc file này TRƯỚC khi chấm. Thang không đổi giữa các lần chạy/màn/nhánh — đổi thang là mất so sánh được, tức mất lý do tồn tại của skill. Cơ chế lấy từ spec-driven-eval (tech-leads-club, CC-BY-4.0): "bằng chứng hoặc 0", "tìm trước khi cho 0", "máy cộng, người không cộng".

## Đơn vị chấm = một case
Case do `scan-eval.js` đóng băng từ tài liệu, agent **không thêm bớt**:
- **TC** — mỗi `TC-S..` trong `test.md`. Điều phải chứng minh = cột **Kết quả mong đợi** (không phải tên test, không phải "test chạy xanh").
- **AC** — mỗi `GWT-n` trong `userstory.md` (hồ sơ `full`) hoặc mục "Tiêu chí chấp nhận" của `srs.md` (`mini`). Điều phải chứng minh = vế **Then**. AC có TC nối tới → điểm AC suy từ các TC đó (thấp nhất trong nhóm, không phải trung bình — một Then chưa đạt là AC chưa đạt). AC không TC nào nối tới → chấm bằng cách đọc code + chạy được gì thì chạy.

## Bốn mức, không có mức giữa
| Điểm | Nghĩa | Bằng chứng BẮT BUỘC (cột "Bằng chứng") |
|---|---|---|
| **2** | Đạt, có bằng chứng **chạy được** | `file:line` của assertion đúng điều Kết quả mong đợi/Then nói **và** lệnh đã chạy + `exit 0` (Proof của plan, hoặc lệnh test chứa mã TC). TC `Manual`: bằng chứng chạy = lệnh thao tác thật trong backtick, `exit 0` ngay sau nó (`npx playwright test -g TC-S09-03` exit 0 — không phải `a.spec.ts:131` · "P11 exit 0": `path:line` và tên Proof không phải lệnh) **hoặc** file evidence `docs/Ho-so/eval/evidence/<Mã>/<TC>.png` + `.json` (sha ≥ commit cuối chạm code màn — `capture.mjs --evidence`), kèm `file:line` của code đỡ hành vi. Lời kể "đã mở app, thấy…" **không** phải bằng chứng chạy (luật 4b của `check-eval.js`) |
| **1** | Đạt **một phần**, hoặc chỉ có bằng chứng **tĩnh** | `file:line` của code/test có liên quan + nói rõ **thiếu gì**: test có mà assert sai thứ (chỉ "không ném lỗi"), code có nhánh nhưng test chưa chạy/đỏ, Manual chưa thao tác nhưng đọc code thấy đủ, Then có 3 vế mà 2 vế đạt |
| **0** | Không đạt / không có bằng chứng | **Đã tìm ở đâu**: thư mục + từ khoá grep + file đã mở. 0 nghĩa là "tìm rồi, không có", không phải "chưa nhìn". Không ghi đã tìm ở đâu → `check-eval.js` từ chối |
| **—** | Không áp dụng | Lý do ở cột "Ghi chú": ngoài diff `<base>..HEAD` (hạ tầng chung, màn khác), TC bị `Skip` có ghi lý do trong `test.md`, AC/TC thuộc CR đã đóng phạm vi. **Không dùng `—` để tránh 0** — thiếu chức năng trong phạm vi là 0. TC `Manual` không thao tác được mà ghi `—` phải kèm **lần thử**: lệnh đã chạy trong backtick + trích lỗi (`devserver.js` → `không-thấy`, `ECONNREFUSED`…); "không có dev server" suông bị `check-eval.js` từ chối — mặc định vẫn là chấm theo code, tối đa 1 |

**Điểm cuối** = Σ điểm / (2 × số case áp dụng) → phần trăm, một chữ số lẻ. **Phân rã** theo Ưu tiên (Must/Should/Could — từ cột `Ưu tiên` của `srs.md` qua `R-S..` ở cột Nguồn của TC) · Cách chạy (Auto/Manual) · Loại (TC/AC). Không có trọng số: phân rã thay cho trọng số — người đọc tự thấy Must 60% nghĩa là gì; trọng số giấu con số đó đi.

## Luật khi chấm
1. **Bằng chứng hoặc 0.** Không có `file:line` = không có bằng chứng. Tên hàm trùng với tên yêu cầu không phải bằng chứng — mở hàm ra, đọc tới chỗ nó tạo ra thứ test.md nói.
2. **Tìm trước khi cho 0.** Bắt đầu từ diff surface (`git diff <base>..HEAD --name-only`), rồi thư mục test, rồi grep mã TC/từ khoá nghiệp vụ. Ghi lại đường tìm.
3. **Test "đi qua" ≠ test "khẳng định".** Test render form rồi bấm nút mà không `expect` đúng điều Then nói → nhiều nhất là 1.
4. **Nhiều vế thì đếm từng vế.** "redirect về /dashboard **và** không có toast lỗi **và** cookie HttpOnly được set" là 3 vế; 2/3 vế có assert → 1, không phải 2.
5. **Nhiều test/nhiều code không nâng điểm.** Chỉ điều Then/Kết quả mong đợi nói mới được tính. Test thừa ghi ở Ghi chú, không cộng.
6. **Người chấm ≠ người viết.** Model chấm khác model viết code thì tốt; trùng thì ghi cờ ở header và **case biên chấm xuống** (1 thay vì 2). Model người viết đọc ở `.claude/ac-state.json` (`batches[].model`, do tóm tắt lô của `ac-builder` ghi) hoặc `verification.md`; không có → ghi "không rõ" và coi như trùng.
7. **Không sửa gì.** Test đỏ, lint đỏ, lệnh Proof sai đường dẫn → ghi 0/1 và đưa vào "Sửa để lên 100%". Sửa rồi chấm là chấm bài mình vừa chữa.
8. **Mock-only không chứng minh kết quả.** Vế kết quả của Then/Kết quả mong đợi (trạng thái được lưu, thứ người dùng thấy, điều hướng, dữ liệu trả về) mà test chỉ assert `toHaveBeenCalled*`/`calledWith` trên **mock** → tối đa **1**: nó chứng minh *có gọi*, không chứng minh *kết quả*. Ngoại lệ: vế đúng là "gọi API/hệ ngoài" (vd "gửi email qua SMTP", "gọi cổng thanh toán") — khi đó spy/mock **là** bằng chứng. (spec-driven-eval "mock-only exclusion", dogfood 04/09: vế "thành công" chỉ assert `onSubmit` mock.)
9. **"Thao tác được" = `devserver.js` nói `của-dự-án`.** Trước khi chấm TC `Manual` bằng thao tác, chạy `node .claude/skills/ba-toolkit/scripts/devserver.js --plain`: `của-dự-án` (exit 0) → thao tác/chụp trên URL nó in; `lạ` (exit 3) → cổng đang là app KHÁC, **không** thao tác (chụp nhầm app là PASS giả trông thật nhất); `không-thấy` (exit 1) → không tự khởi động, chấm theo code tối đa 1 hoặc ghi lệnh gợi ý nó in vào "Sửa để lên 100%".
10. **Không cộng tay.** Ghi bảng xong chạy `check-eval.js`; dòng "Tính lại" của nó là số ghi vào **Điểm cuối** và Phân rã.

## Mốc chuẩn (đọc để biết ranh giới nằm ở đâu)
| Mốc | Case | Điểm | Vì sao |
|---|---|---|---|
| Rõ ràng 2 | TC "Redirect về `/dashboard` sau 200" | **2** | `tests/modules/auth/dang-nhap.test.ts:18` `expect(router.path).toBe('/dashboard')` sau khi mock 200; Proof `npx jest tests/modules/auth/dang-nhap.test.ts` exit 0 |
| Rõ ràng 0 | TC "API trả 423; thông báo khoá + đồng hồ đếm ngược; nút disable" | **0** | Đã tìm `src/modules/auth/**`, grep `423`, `TEMP_LOCKED`, `khoá`: không có nhánh nào xử lý 423; test `khoa-tam.test.ts` không tồn tại. Tìm rồi, không có |
| Biên → 1 (đi qua, không khẳng định) | TC "Lỗi inline 'Vui lòng nhập địa chỉ email hợp lệ.'; không gọi API" | **1** | `tests/components/auth/validate-dang-nhap.test.ts:30` nhập `abc@` rồi blur, chỉ `expect(() => …).not.toThrow()`; không assert câu chữ, không assert fetch không được gọi. Code `src/components/auth/LoginForm.tsx:44` có nhánh lỗi — bằng chứng tĩnh |
| Biên → 1 (đúng tầng service, TC tả UI) | TC "Thông báo inline 'Sai email hoặc mật khẩu. Còn 4 lần thử.'" | **1** | `tests/modules/auth/dem-sai.test.ts:12` gọi `dangNhap()` và assert `conLai === 4` — đúng logic, nhưng TC nói về thứ **người dùng thấy**; không test UI/e2e nào assert câu chữ inline (`check-tc-layer.js` cũng cờ). Ca thật 04/09/2026 |
| Biên → 2 (Manual đã thao tác) | TC Manual "Đồng hồ về 0 → form reset, nút enable" | **2** | `devserver.js` → `của-dự-án`; mock thời gian bằng fixture ghi trong `dev-notes.md`, chụp `docs/Ho-so/eval/evidence/S01/TC-S01-12.png` + `.json` (sha = HEAD) bằng `capture.mjs --evidence`; code `src/components/auth/DongHoKhoa.tsx:27-35` đặt lại state khi `conLai === 0`. Evidence có thật + `file:line` = 2 |
| Biên → 1 (Manual bằng lời) | cùng TC, bằng chứng "đã mở app, thấy form reset" + `DongHoKhoa.tsx:27` | **1** | Không lệnh + exit 0, không file evidence — lời kể không tái lập được; `check-eval.js` luật 4b từ chối điểm 2 |
| Biên → 1 (mock-only) | TC "Lưu thành công → hiện toast và về danh sách" | **1** | `tests/Form.test.tsx:40` chỉ `expect(onSubmit).toHaveBeenCalled()` trên mock — chứng minh có gọi, không chứng minh toast hay điều hướng (luật 8). Ca thật dogfood 04/09/2026 |
| Biên → — (đúng) | TC "Giới hạn tần suất 429" khi chấm diff của màn S01 | **—** | Rate-limit là middleware chung (`src/shared/rate-limit.ts`) không nằm trong diff `<base>..HEAD` của màn; ghi lý do. Chấm ở lần `all` |
| Biên → 0 (dùng `—` sai) | AC "Buộc đổi mật khẩu tạm" chưa code | **0**, không phải — | Thuộc phạm vi màn (CR-02 đã duyệt vào baseline). Thiếu là thiếu; `—` chỉ cho ngoài phạm vi |
| AC gộp từ TC | GWT-1 nối TC-01 (2), TC-02 (2), TC-03 (1), TC-04 (2) | **1** | Điểm AC = thấp nhất trong nhóm TC nối tới: một Then chưa đạt trọn thì AC chưa đạt trọn |
