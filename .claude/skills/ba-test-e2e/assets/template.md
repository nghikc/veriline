# Template — `e2e/tests/<Mã>-<Tên>.spec.ts`

Khung Playwright + TypeScript. Mỗi `TC-S..` một `test`, giữ mã trong tiêu đề để truy vết về `test.md`.

```typescript
/**
 * E2E — S01 Login  (sinh từ docs/Screen-spec/Authentication/S01 - Login/test.md)
 * Nguồn: 8 TC (6 auto / 2 manual-skip).
 * Chạy:  npx playwright test e2e/tests/S01-Login.spec.ts
 * Cần:   E2E_BASE_URL, E2E_USER, E2E_PASS  (đặt qua biến môi trường, KHÔNG hardcode).
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

test.describe('F01 — Đăng nhập', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);            // Tiền điều kiện: ở màn đăng nhập
  });

  test('TC-S01-01 — Đăng nhập hợp lệ (Positive)', async ({ page }) => {
    await page.getByLabel('Email').fill(process.env.E2E_USER ?? 'user@demo.vn');
    await page.getByLabel('Mật khẩu').fill(process.env.E2E_PASS ?? '');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL(/\/dashboard/);   // Kết quả mong đợi: vào Dashboard
  });

  test('TC-S01-03 — Sai mật khẩu báo lỗi đúng chữ (Negative)', async ({ page }) => {
    await page.getByLabel('Email').fill('user@demo.vn');
    await page.getByLabel('Mật khẩu').fill('saibet');       // Test Data cụ thể
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByText('Email hoặc mật khẩu không đúng')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);       // không đổi trạng thái
  });

  test('TC-S01-05 — Email sai định dạng (Edge/BVA)', async ({ page }) => {
    await page.getByLabel('Email').fill('abc@');   // thiếu domain — đúng data ở test.md
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByText('Email không hợp lệ')).toBeVisible();
  });

  // TC-S01-07 — CAPTCHA sau 5 lần sai: cần quan sát mắt → giữ Manual ở test.md
  test.skip('TC-S01-07 — Hiện CAPTCHA sau 5 lần sai (Manual)', async () => {
    // TODO selector: xác nhận khi app chạy thật
  });
});
```

## Ghi chú khi điền
- **Ưu tiên `getByRole`/`getByLabel`/`getByText`** (theo a11y/nhãn) — bền hơn CSS/XPath.
- Selector chưa chắc (app chưa deploy) → theo nhãn ở `design-spec`/`html-design` + `// TODO selector`.
- Bí mật/tài khoản qua `process.env.*`; số liệu nhạy cảm dùng giá trị giả.
- TC `Manual` → `test.skip(...)` kèm lý do, không xoá (giữ dấu vết đủ TC).
