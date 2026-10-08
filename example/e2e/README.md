# E2E — TeamTasks

Bộ kiểm thử đầu-cuối. **Package riêng, cùng repo** với code sản phẩm (`conventions.md` → "Script E2E để ở đâu").

## Chạy

```bash
cd e2e && npm install && npx playwright install chromium
cp .env.example .env      # rồi điền giá trị THẬT của môi trường test
npm test                  # toàn bộ
npm run test:smoke        # chỉ ca gắn @smoke
npx playwright test tests/S01-Login.spec.ts
```

## Nguồn của sự thật

`docs/Screen-spec/<Màn>/test.md` là **nguồn**; spec ở đây chỉ hiện thực phần `Cách chạy = Auto`.
Một chiều: đổi TC → sửa spec, không bao giờ ngược lại. Mỗi `test(...)` mang **nguyên mã `TC-S..`**,
và ghi **đủ từng mã, viết rời** (`TC-S01-09 · TC-S01-10`) — mọi thứ đo độ phủ đều khớp chuỗi, dạng
gộp `09/10` làm mã thứ hai vô hình.

Ca `Manual` trong `test.md` để `test.skip` giữ dấu vết (hiện 50 ca) — chúng vẫn phải chạy tay.

## Trạng thái hiện tại — đọc trước khi tin kết quả

- App **chưa deploy** (Phase 1 đang dev). Selector lấy từ `html-design.html` (bản mockup); mọi chỗ
  đánh `TODO selector` phải đối chiếu với app thật.
- `seedAccount()` cần một endpoint test-only **chưa tồn tại** — xem ghi chú trong spec.

Nghĩa là suite này **chưa xanh được**, và đó là đúng trạng thái dự án, không phải lỗi cấu hình.
