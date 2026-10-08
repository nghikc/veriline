import { defineConfig, devices } from '@playwright/test';

/**
 * Cấu hình E2E của TeamTasks.
 *
 * Vì sao package RIÊNG mà CÙNG repo (`conventions.md` → "Script E2E để ở đâu"): Playwright không
 * được lọt vào bundle sản phẩm, nhưng đổi selector và sửa test vẫn phải nằm trong CÙNG một PR —
 * tách repo là mở đường cho drift giữa code và test.
 *
 * KHÔNG có giá trị mặc định cho tài khoản: dữ liệu trong `test.md` là **giá trị demo**, hardcode
 * chúng ở đây là biến ví dụ thành sự thật. Thiếu biến thì `global-setup.ts` dừng và nói thiếu cái gì.
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  // Trạng thái Phase 1: app chưa deploy, nhiều selector còn `TODO selector`. Chạy tuần tự cho dễ
  // đọc lỗi; bật song song khi selector đã đối chiếu với app thật.
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,
  forbidOnly: !!process.env.CI,
  // Retry CHỈ trên CI. Ở máy, một test chập chờn phải hiện ra là chập chờn, đừng để retry giấu đi.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Tiếng Việt: app hiển thị vi-VN, để mặc định en-US thì mọi assert định dạng ngày/số đều lệch.
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
