---
name: ba-test-e2e
description: Use when một màn đã có test.md và cần SINH SCRIPT Playwright chạy được — mỗi TC một test giữ nguyên mã; sinh e2e/tests/[Mã]-[Tên].spec.ts ở gốc dự án, ngoài docs/.
---

# ba-test-e2e — Sinh script Playwright E2E từ test.md

## Mục tiêu
Biến các test case trong `test.md` của một màn thành **script E2E chạy được** `e2e/tests/<Mã>-<Tên>.spec.ts` ở **gốc dự án** (Playwright). Mỗi `TC-S..` thành một `test(...)` **giữ nguyên mã** trong tiêu đề để truy vết ngược về `test.md` → `R-S`/`UC`/`FR`. Đây là artifact **code**, không phải tài liệu BA: tracked trong `00-tracking.md` (cột `e2e`) như cột `dev`, nhưng KHÔNG tính vào "9/9 hoàn thành doc".

## Điều kiện
- **Cần:** `test.md` của màn (nguồn TC). **Nên có:** `10-architecture.md` (đọc **ngôn ngữ/khung test** dự án chọn — nếu là JS thì sinh `.spec.js`; mặc định **TypeScript** khi chưa chốt), `html-design.html` hoặc app deploy (để biết selector/nhãn thật).
- Chỉ các TC **`Cách chạy = Auto`** (hoặc phù hợp tự động) mới sinh test; TC `Manual` giữ trong `test.md`, ghi `test.skip` kèm lý do để không mất dấu.

## Quy trình
1. Đọc `conventions.md`; `test.md` của màn; `10-architecture.md` nếu có (ngôn ngữ/khung, baseURL, cách chạy). Có app deploy/`html-design.html` → lấy **selector/nhãn thật** thay vì đoán.
2. **Map TC → test:** mỗi `TC-S..` → một `test('TC-S0x-.. — <tên>', …)`. Gom theo chức năng bằng `test.describe('<F..> — <màn>')`. Giữ thứ tự Positive → Negative → Edge.
3. **Dịch từng TC sang bước Playwright** bám đúng cột của `test.md`:
   - *Tiền điều kiện* → `beforeEach`/`beforeAll` (đăng nhập, seed, điều hướng `page.goto`).
   - *Các bước* → `page.getByRole/getByLabel(...).click()/fill(...)` — **ưu tiên selector theo vai trò/nhãn** (a11y), tránh CSS/XPath giòn.
   - *Test Data cụ thể* → hằng số trong test (dùng đúng giá trị cụ thể ở `test.md`, vd `abc@` cho email sai).
   - *Kết quả mong đợi* → `expect(...)` (toast/URL/trạng thái/thông báo lỗi đúng nội dung).
4. **Ngoại lệ & biên:** TC Negative → khẳng định **thông báo lỗi đúng chữ** + không đổi trạng thái; TC Edge (BVA) → chạy đúng giá trị biên ở `test.md`.
5. **PII & bí mật:** tài khoản/mật khẩu test lấy từ **biến môi trường** (`process.env.E2E_USER`…), KHÔNG hardcode; dữ liệu nhạy cảm dùng giá trị giả.
6. **Selector chưa chắc → không bịa:** chỗ chưa biết selector thật (app chưa deploy) → dùng `getByRole`/`getByText` theo nhãn ở design + gắn `// TODO selector: xác nhận khi app chạy`; đánh dấu để rà.
7. **Header truy vết** đầu file: trỏ `test.md` nguồn + ghi "sinh từ N TC (M auto / K manual-skip)". Ghi rõ **CÁCH CHẠY** (lệnh + biến môi trường cần) trong comment.
8. **Cập nhật tracking:** đặt ô `e2e` của màn = ✅ trong `docs/00-tracking.md` (chạy `ba-track refresh` cũng tự nhận, nó hỏi `ba-toolkit/e2epath.js` nên thấy được cả bố cục cũ lẫn mới) + cột "Cập nhật cuối".
9. **Không tự chạy** (skill này chỉ SINH script — chạy thật cần app + `dev-run`/CI). Báo người dùng lệnh chạy và điều kiện (app đã deploy chưa).

## Đồng bộ với test.md (BẮT BUỘC)
- **Một chiều nguồn:** `test.md` là nguồn; file spec bám theo. TC đổi bước/data/kết quả mong đợi (qua CR/cập nhật yêu cầu) → **cập nhật lại test tương ứng** và đặt ô `e2e` = ⚠️ tới khi đồng bộ xong.
- Giữ **mã `TC-S..` trong tiêu đề test** — mất mã là mất truy vết; đừng đổi tên tùy hứng.
- TC bị bỏ khỏi `test.md` → xoá/`test.skip` test tương ứng, không để test mồ côi.


## Đặt ở đâu, đặt tên thế nào

**Vị trí:** `e2e/tests/<Mã>-<Tên>.spec.ts` ở **gốc dự án** — vd `e2e/tests/S01-Login.spec.ts`. KHÔNG đặt trong `docs/`: spec là code chạy được, mà `docs/` không có `package.json`/`tsconfig` nên nó không chạy được tại chỗ. Canon: `conventions.md` → "Script E2E để ở đâu".

**Trước khi ghi, hỏi đường dẫn** — đừng tự ghép:
```bash
node -e "console.log(require('./.claude/skills/ba-toolkit/scripts/e2epath.js').writePathFor('docs', 'docs/Screen-spec/Authentication/S01 - Login', 'S01', 'Login').path)"
```
Trả về `legacy: true` nghĩa là dự án này còn để spec trong folder màn → **ghi đúng chỗ cũ và nói với người dùng**, đừng tự dời file của họ. Muốn dời thì đó là quyết định của họ, không phải tác dụng phụ của việc sinh test.

**Tên test phải ghi ĐỦ từng mã TC, viết rời:** `test('TC-S01-09 · TC-S01-10: …')`, **không** gộp `TC-S01-09/10`. Mọi thứ đo độ phủ (`ba-trace`, `scan-code.js`, báo cáo của `ba-accept`) đều tìm mã bằng khớp chuỗi, nên dạng gộp làm mã thứ hai trở đi **vô hình** — đo ra "chưa chạy" trong khi test có kiểm thật. Đây là dương tính giả im lặng: không báo lỗi, chỉ báo thiếu.

**Hạ tầng đi kèm** (sinh một lần cho cả dự án, không phải mỗi màn) — **mẫu tham chiếu đầy đủ ở `example/e2e/`**:
- `e2e/package.json` — dependency RIÊNG; Playwright không được lọt vào bundle sản phẩm.
- `e2e/playwright.config.ts` — `baseURL` từ `E2E_BASE_URL`; đặt `locale`/`timezoneId` theo ngôn ngữ app (bỏ qua thì mọi assert định dạng ngày/số đều lệch); **retry CHỈ trên CI** — ở máy, test chập chờn phải hiện ra là chập chờn.
- `e2e/global-setup.ts` — **chặn sớm khi thiếu biến môi trường**, in ra thiếu cái gì. Không có bước này thì cả suite đỏ hàng loạt vì một biến rỗng, và một suite đỏ hàng loạt là suite không ai đọc nữa.
- `e2e/.env.example` — khai **mọi** biến spec dùng, mỗi biến một dòng `TÊN=`. Thêm biến trong spec mà quên khai ở đây là hỏng IM LẶNG: người chạy chỉ thấy test đỏ với giá trị rỗng. `lint.js` check 22 soát đúng điều này trên `example/`.
- `e2e/.gitignore` — `node_modules/`, `playwright-report/`, `test-results/`, `.env`.

**KHÔNG hardcode tài khoản vào spec hay config.** Dữ liệu trong `test.md` là **giá trị demo**; đặt thẳng vào code là biến ví dụ thành sự thật.

## Lưu ý
- **Không thay `test.md`:** `test.md` vẫn là bảng theo dõi kết quả (Manual + Auto); file spec chỉ hiện thực phần Auto.
- Mặc định **Playwright + TypeScript**; dự án chốt khác trong `10-architecture.md` thì theo (vd `.spec.js`, hoặc Cypress → báo người dùng skill này tối ưu cho Playwright).
- Là **code** → nằm trong folder màn nhưng KHÔNG vào portal, KHÔNG tính "9/9"; `dev-run` có thể tiếp quản để đưa vào bộ test dự án khi build.
- Tiếng Việt cho mô tả/tiêu đề test; tên biến/API giữ tiếng Anh.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Ranh giới

- Chạy sau `ba-test`, là cầu nối BA sang QA automation.
