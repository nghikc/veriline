/**
 * E2E — S04 Hồ sơ cá nhân (TeamTasks)
 *
 * Nguồn (một chiều): `docs/Screen-spec/S04 - UserProfile/test.md`
 *   → sinh từ 40 TC: **32 Auto** (có test) / **8 Manual** (test.skip giữ dấu vết:
 *     TC-18, 28, 33, 36, 37, 38, 39, 40).
 * Truy vết: mã `TC-S04-..` trong tiêu đề test → `test.md` → `R-S04-..` / `UC-S04-..` / `BRule-S04-..`
 *           → `FR-11` (hồ sơ cá nhân) → `F10`.
 * Chức năng: F10 (Hồ sơ cá nhân) — hai form độc lập: Thông tin cá nhân · Đổi mật khẩu.
 *
 * CÁCH CHẠY
 *   npx playwright test e2e/tests/S04-UserProfile.spec.ts
 * Biến môi trường:
 *   E2E_BASE_URL                     vd https://staging.teamtasks.vn
 *   E2E_MEMBER / E2E_MEMBER_PASS     Lê Văn C (le.c@acme.vn) — tài khoản chính của màn
 *   E2E_LEAD                         email của lead1@acme.vn — chỉ dùng để lấy id cho TC-07
 *   E2E_ADMIN_TOKEN                  token gọi API test-only để reset hồ sơ/mật khẩu giữa các test
 *
 * ⚠️ **Test này ĐỔI MẬT KHẨU thật.** `resetAccount()` phải chạy ở `afterEach` để trả tài khoản
 *    về mật khẩu gốc, nếu không các test sau (và cả spec khác) sẽ đăng nhập hỏng.
 *    Chỉ chạy trên **staging**, tuyệt đối không chạy với tài khoản thật.
 * ⚠️ App CHƯA deploy → selector lấy từ `html-design.html` (mockup): `#fullName`, `#nameCounter`,
 *    `#nameError`, `#avatarUrl`, `#avatarError`, `#btnSave`, `#btnCancel`, `#bigAvatar`,
 *    `#hdrName`, `#pwCurrent`, `#pwNew`, `#pwConfirm`, `#pwCurrentError`, `#pwNewError`,
 *    `#pwConfirmError`, `#strengthWrap`, `#strengthText`, `#btnChangePw`, `#errBlock`, `#toast`.
 *    Mọi chỗ `TODO selector` phải đối chiếu lại với app thật.
 */
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const ME = { email: process.env.E2E_MEMBER ?? '', pass: process.env.E2E_MEMBER_PASS ?? '' };
const LEAD_EMAIL = process.env.E2E_LEAD ?? 'lead1@acme.vn';

const ORIGINAL_NAME = 'Lê Văn C';
const NEW_PASSWORD = 'Abcd1234!';

// ---------------------------------------------------------------------------
// Helper — TODO selector: đối chiếu lại khi app deploy
// ---------------------------------------------------------------------------
const fullName = (p: Page) => p.locator('#fullName');
const nameCounter = (p: Page) => p.locator('#nameCounter');
const avatarUrl = (p: Page) => p.locator('#avatarUrl');
const btnSave = (p: Page) => p.locator('#btnSave');
const btnCancel = (p: Page) => p.locator('#btnCancel');
const bigAvatar = (p: Page) => p.locator('#bigAvatar');
const hdrName = (p: Page) => p.locator('#hdrName');
const pwCurrent = (p: Page) => p.locator('#pwCurrent');
const pwNew = (p: Page) => p.locator('#pwNew');
const pwConfirm = (p: Page) => p.locator('#pwConfirm');
const strengthWrap = (p: Page) => p.locator('#strengthWrap');
const btnChangePw = (p: Page) => p.locator('#btnChangePw');
const toast = (p: Page) => p.locator('#toast');
const btn = (p: Page, name: string) => p.getByRole('button', { name });

async function login(page: Page, who: { email: string; pass: string }) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(who.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(who.pass);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function apiToken(request: APIRequestContext, who: { email: string; pass: string }) {
  const res = await request.post(`${BASE}/api/v1/auth/login`, { data: { email: who.email, mat_khau: who.pass } });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).access_token as string;
}

/**
 * Trả tài khoản test về nguyên trạng: họ tên gốc, ảnh rỗng, mật khẩu gốc, xoá bộ đếm khoá.
 *
 * ⚠️ CHƯA CHẠY ĐƯỢC: cần endpoint test-only (chỉ bật ở staging). Việc của `dev-run`/CI.
 */
async function resetAccount(request: APIRequestContext) {
  const res = await request.post(`${BASE}/test/reset-user`, {
    headers: { Authorization: `Bearer ${process.env.E2E_ADMIN_TOKEN ?? ''}` },
    data: { email: ME.email, ho_ten: ORIGINAL_NAME, anh_dai_dien_url: '', mat_khau: ME.pass, clear_lockout: true },
  });
  expect(res.ok(), 'Cần endpoint test-only để trả tài khoản về nguyên trạng').toBeTruthy();
}

test.afterEach(async ({ request }) => {
  await resetAccount(request);
});

// ===========================================================================
// F10 — Xem hồ sơ
// ===========================================================================

test.describe('F10 — Xem hồ sơ cá nhân (S04)', () => {
  test('TC-S04-01 — Khối nhận diện hiển thị đủ 6 thông tin', async ({ page }) => {
    await login(page, ME);
    await page.goto(`${BASE}/profile`);
    await expect(bigAvatar(page)).toBeVisible();
    await expect(page.getByText(ORIGINAL_NAME).first()).toBeVisible();
    await expect(page.getByText(ME.email).first()).toBeVisible();
    await expect(page.getByText('Thành viên').first()).toBeVisible();
    await expect(page.getByText('Acme').first()).toBeVisible();
    await expect(page.getByText(/Tham gia:\s*02\/06\/2026/)).toBeVisible();
  });

  test('TC-S04-02 — Ảnh rỗng: chữ cái đầu "L", màu nền sinh ỔN ĐỊNH từ họ tên', async ({ page }) => {
    await login(page, ME);
    await page.goto(`${BASE}/profile`);
    await expect(bigAvatar(page)).toHaveText('L');
    const color1 = await bigAvatar(page).evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.reload();
    const color2 = await bigAvatar(page).evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(color2, 'cùng họ tên phải cho cùng màu (BRule-S04-07)').toBe(color1);
  });

  test('TC-S04-03 — Ảnh chết: rơi về chữ cái đầu, KHÔNG hiện icon vỡ, không báo lỗi', async ({ page, request }) => {
    const token = await apiToken(request, ME);
    await request.patch(`${BASE}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { anh_dai_dien_url: 'https://cdn.acme.vn/khong-ton-tai.png' },
    });
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    await login(page, ME);
    await page.goto(`${BASE}/profile`);
    await expect(bigAvatar(page)).toHaveText('L');
    await expect(bigAvatar(page).locator('img')).toHaveCount(0);      // không để lại thẻ ảnh vỡ
    await expect(page.getByRole('alert')).toHaveCount(0);             // không báo lỗi ầm ĩ
    expect(errors.filter((e) => /avatar|image/i.test(e))).toHaveLength(0);
  });

  test('TC-S04-04 — Email/Vai trò/Tổ chức: KHÔNG nằm trong input, có khoá + câu giải thích', async ({ page }) => {
    await login(page, ME);
    await page.goto(`${BASE}/profile`);
    const zone = page.locator('.locked-rows');                        // TODO selector
    await expect(zone.locator('input')).toHaveCount(0);
    await expect(zone).toContainText('không đổi được');
    await expect(zone).toContainText('do quản trị viên đặt');
    await expect(zone).toContainText('🔒');
  });

  test('TC-S04-05 — Chưa đăng nhập: chuyển /login, không lộ thông tin cá nhân', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${BASE}/profile`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(ME.email)).toHaveCount(0);
  });

  test('TC-S04-06 — Lỗi tải hồ sơ: khối lỗi + "Thử lại", header vẫn còn', async ({ page }) => {
    await login(page, ME);
    await page.route('**/api/v1/users/me', (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto(`${BASE}/profile`);
    await expect(page.locator('#errBlock')).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
    await page.unroute('**/api/v1/users/me');
    await btn(page, 'Thử lại').click();
    await expect(page.getByText(ORIGINAL_NAME).first()).toBeVisible();
  });

  test('TC-S04-07 — Không tồn tại đường đọc hồ sơ người khác (BRule-S04-01)', async ({ page, request }) => {
    const urls: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/users')) urls.push(r.url()); });
    await login(page, ME);
    await page.goto(`${BASE}/profile`);
    await expect(page.getByText(ORIGINAL_NAME).first()).toBeVisible();
    for (const u of urls) {
      expect(u, 'màn chỉ được gọi /users/me').toMatch(/\/users\/me/);
    }

    const token = await apiToken(request, ME);
    const other = await request.get(`${BASE}/api/v1/users/by-email/${LEAD_EMAIL}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([404, 405, 403], 'không có đường đọc hồ sơ người khác từ màn này').toContain(other.status());
  });
});

// ===========================================================================
// F10 — Form Thông tin cá nhân
// ===========================================================================

test.describe('F10 — Sửa thông tin cá nhân (S04)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ME);
    await page.goto(`${BASE}/profile`);
  });

  test('TC-S04-08 — Mở màn: nút Lưu và Huỷ đều disable', async ({ page }) => {
    await expect(btnSave(page)).toBeDisabled();
    await expect(btnCancel(page)).toBeDisabled();
  });

  test('TC-S04-09 — Lưu: 1 lời gọi, body CHỈ chứa trường đã đổi, tên đổi đồng bộ', async ({ page }) => {
    const bodies: string[] = [];
    page.on('request', (r) => {
      if (r.method() === 'PATCH' && /\/users\/me$/.test(r.url())) bodies.push(r.postData() ?? '');
    });

    await fullName(page).fill('Lê C');
    await btnSave(page).click();

    await expect(toast(page)).toContainText('Đã cập nhật hồ sơ');
    expect(bodies, 'API gọi đúng 1 lần').toHaveLength(1);
    const body = JSON.parse(bodies[0]);
    expect(Object.keys(body), 'chỉ gửi trường đã đổi').toEqual(['ho_ten']);
    // Đổi ĐỒNG BỘ ở cả hai nơi trong cùng một lượt
    await expect(page.locator('#idName')).toHaveText('Lê C');
    await expect(hdrName(page)).toHaveText('Lê C');
  });

  test('TC-S04-10 — Hoàn tác về giá trị gốc: nút Lưu disable trở lại, không gọi API', async ({ page }) => {
    let called = false;
    page.on('request', (r) => { if (r.method() === 'PATCH') called = true; });
    await fullName(page).fill('Lê C');
    await expect(btnSave(page)).toBeEnabled();
    await fullName(page).fill(ORIGINAL_NAME);
    await expect(btnSave(page), 'so với GIÁ TRỊ GỐC, không phải cờ đã-chạm-vào').toBeDisabled();
    expect(called).toBe(false);
  });

  test('TC-S04-11 — Họ tên rỗng: lỗi + nút Lưu disable', async ({ page }) => {
    await fullName(page).fill('');
    await fullName(page).blur();
    await expect(page.getByText('Vui lòng nhập họ tên')).toBeVisible();
    await expect(btnSave(page)).toBeDisabled();
  });

  test('TC-S04-12 — Họ tên toàn khoảng trắng: xử lý như rỗng', async ({ page }) => {
    await fullName(page).fill('    ');
    await fullName(page).blur();
    await expect(page.getByText('Vui lòng nhập họ tên')).toBeVisible();
    await expect(btnSave(page)).toBeDisabled();
  });

  test('TC-S04-13 — Họ tên 101 ký tự: lỗi + bộ đếm đỏ + disable (BVA)', async ({ page }) => {
    await fullName(page).fill('A'.repeat(101));
    await fullName(page).blur();
    await expect(page.getByText('Họ tên tối đa 100 ký tự')).toBeVisible();
    await expect(nameCounter(page)).toContainText('101/100');
    await expect(nameCounter(page)).toHaveClass(/over/);
    await expect(btnSave(page)).toBeDisabled();
  });

  test('TC-S04-14 — Họ tên đúng 100 ký tự: lưu được, không bị cắt (BVA)', async ({ page, request }) => {
    const name = 'A'.repeat(100);
    await fullName(page).fill(name);
    await btnSave(page).click();
    await expect(toast(page)).toContainText('Đã cập nhật hồ sơ');
    const token = await apiToken(request, ME);
    const me = await (await request.get(`${BASE}/api/v1/users/me`, { headers: { Authorization: `Bearer ${token}` } })).json();
    expect(me.ho_ten, 'lưu đủ 100 ký tự').toHaveLength(100);
  });

  test('TC-S04-15 — Ảnh `http://`: lỗi tiền tố, không gọi API (BRule-S04-08)', async ({ page }) => {
    let called = false;
    page.on('request', (r) => { if (r.method() === 'PATCH') called = true; });
    await avatarUrl(page).fill('http://cdn.acme.vn/a.png');
    await avatarUrl(page).blur();
    await expect(page.getByText('Đường dẫn ảnh phải bắt đầu bằng https://')).toBeVisible();
    await expect(btnSave(page)).toBeDisabled();
    expect(called).toBe(false);
  });

  test('TC-S04-16 — Ảnh `data:` URI: bị từ chối (BRule-S04-08)', async ({ page }) => {
    await avatarUrl(page).fill('data:image/png;base64,iVBORw0KGgo=');
    await avatarUrl(page).blur();
    await expect(page.locator('#avatarError')).toBeVisible();
    await expect(btnSave(page)).toBeDisabled();
  });

  test('TC-S04-17 — Xoá trắng ảnh: hợp lệ, quay về chữ cái đầu', async ({ page, request }) => {
    const token = await apiToken(request, ME);
    await request.patch(`${BASE}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { anh_dai_dien_url: 'https://cdn.acme.vn/le-c.png' },
    });
    await page.reload();
    await avatarUrl(page).fill('');
    await btnSave(page).click();
    await expect(toast(page)).toContainText('Đã cập nhật hồ sơ');
    await expect(bigAvatar(page)).toHaveText('L');
  });

  test.skip('TC-S04-18 — [Manual] Lưu lỗi mạng: giữ nguyên giá trị đã nhập', async () => {
    /* Manual theo `test.md`: cần bật/tắt mạng bằng DevTools.
       Playwright làm được bằng `context.setOffline(true)` — chuyển sang Auto nếu `test.md` đổi. */
  });

  test('TC-S04-19 — Máy chủ BỎ QUA email và vai_tro trong body (BRule-S04-02/03)', async ({ request }) => {
    const token = await apiToken(request, ME);
    await request.patch(`${BASE}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { ho_ten: 'Lê C', email: 'hacker@evil.vn', vai_tro: 'ORG_ADMIN' },
    });
    const me = await (await request.get(`${BASE}/api/v1/users/me`, { headers: { Authorization: `Bearer ${token}` } })).json();
    expect(me.ho_ten).toBe('Lê C');
    expect(me.email, 'email không đổi được').toBe(ME.email);
    expect(me.vai_tro, 'không tự nâng quyền được').toBe('MEMBER');
  });

  test('TC-S04-20 — Còn thay đổi + điều hướng: hộp cảnh báo, "Ở lại" giữ nguyên giá trị', async ({ page }) => {
    await fullName(page).fill('Lê C');
    await page.getByRole('link', { name: /Quay lại Dashboard/ }).click();
    await expect(page.getByText('Bạn có thay đổi chưa lưu')).toBeVisible();
    await expect(page).toHaveURL(/\/profile/);                        // điều hướng bị chặn
    await btn(page, 'Ở lại').click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(fullName(page)).toHaveValue('Lê C');
  });

  test('TC-S04-21 — Chưa sửa gì: điều hướng đi thẳng, không hỏi', async ({ page }) => {
    await page.getByRole('link', { name: /Quay lại Dashboard/ }).click();
    await expect(page.getByText('Bạn có thay đổi chưa lưu')).toHaveCount(0);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('TC-S04-22 — Mật khẩu gõ dở KHÔNG tính là thay đổi cần cứu', async ({ page }) => {
    await pwNew(page).fill('Abcd');
    await page.getByRole('link', { name: /Quay lại Dashboard/ }).click();
    await expect(page.getByText('Bạn có thay đổi chưa lưu')).toHaveCount(0);
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

// ===========================================================================
// F10 — Form Đổi mật khẩu
// ===========================================================================

test.describe('F10 — Đổi mật khẩu (S04)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ME);
    await page.goto(`${BASE}/profile`);
  });

  test('TC-S04-23 — Hai form độc lập: sửa họ tên không đòi mật khẩu', async ({ page }) => {
    await fullName(page).fill('Lê C');
    await btnSave(page).click();
    await expect(toast(page)).toContainText('Đã cập nhật hồ sơ');
    await expect(btnChangePw(page), 'nút của form kia vẫn disable riêng').toBeDisabled();
  });

  test('TC-S04-24 — Đổi mật khẩu thành công: 3 trường trắng, vẫn ở lại /profile', async ({ page }) => {
    await pwCurrent(page).fill(ME.pass);
    await pwNew(page).fill(NEW_PASSWORD);
    await pwConfirm(page).fill(NEW_PASSWORD);
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/users/me/password')),
      btnChangePw(page).click(),
    ]);
    expect(res.status()).toBe(200);
    await expect(toast(page)).toContainText('Đã đổi mật khẩu');
    await expect(pwCurrent(page)).toHaveValue('');
    await expect(pwNew(page)).toHaveValue('');
    await expect(pwConfirm(page)).toHaveValue('');
    await expect(strengthWrap(page)).not.toHaveClass(/visible/);
    await expect(btnChangePw(page)).toBeDisabled();
    await expect(page, 'người dùng KHÔNG bị đá về /login').toHaveURL(/\/profile/);
  });

  test('TC-S04-25 — Sai mật khẩu hiện tại: lỗi đúng chỗ, HAI trường kia giữ nguyên', async ({ page }) => {
    await pwCurrent(page).fill('SaiBetRet123');
    await pwNew(page).fill(NEW_PASSWORD);
    await pwConfirm(page).fill(NEW_PASSWORD);
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/users/me/password')),
      btnChangePw(page).click(),
    ]);
    expect([400, 401]).toContain(res.status());
    await expect(page.locator('#pwCurrentError')).toHaveText('Mật khẩu hiện tại không đúng.');
    // Đây là điểm quan trọng nhất của màn: KHÔNG xoá trắng công sức người dùng
    await expect(pwNew(page)).toHaveValue(NEW_PASSWORD);
    await expect(pwConfirm(page)).toHaveValue(NEW_PASSWORD);
  });

  test('TC-S04-26 — Mật khẩu mới trùng hiện tại: lỗi, không gọi API (BRule-S04-05)', async ({ page }) => {
    let called = false;
    page.on('request', (r) => { if (r.url().includes('/password')) called = true; });
    await pwCurrent(page).fill(ME.pass);
    await pwNew(page).fill(ME.pass);
    await pwNew(page).blur();
    await expect(page.getByText('Mật khẩu mới phải khác mật khẩu hiện tại')).toBeVisible();
    await expect(btnChangePw(page)).toBeDisabled();
    expect(called).toBe(false);
  });

  test('TC-S04-27 — Xác nhận không khớp: lỗi khi rời ô, nút disable', async ({ page }) => {
    await pwCurrent(page).fill(ME.pass);
    await pwNew(page).fill('Abcd1234!');
    await pwConfirm(page).fill('Abcd12345');
    await pwConfirm(page).blur();
    await expect(page.getByText('Mật khẩu xác nhận không khớp.')).toBeVisible();
    await expect(btnChangePw(page)).toBeDisabled();
  });

  test.skip('TC-S04-28 — [Manual] Thanh đo độ mạnh cập nhật theo từng ký tự', async () => {
    /* Manual theo `test.md`: quan sát liên tục khi gõ. Luật phân mức đã được phủ ở
       TC-29/30/31 (biên 7/8 ký tự và trường hợp thiếu chữ số). */
  });

  test('TC-S04-29 — Mật khẩu mới 7 ký tự: bị từ chối (BVA — R-S04-N02)', async ({ page }) => {
    await pwCurrent(page).fill(ME.pass);
    await pwNew(page).fill('Abcd123');
    await pwNew(page).blur();
    await expect(page.getByText('Mật khẩu tối thiểu 8 ký tự gồm chữ và số')).toBeVisible();
    await expect(btnChangePw(page)).toBeDisabled();
  });

  test('TC-S04-30 — Mật khẩu mới đúng 8 ký tự có chữ và số: hợp lệ (BVA)', async ({ page }) => {
    await pwCurrent(page).fill(ME.pass);
    await pwNew(page).fill('Abcd1234');
    await pwConfirm(page).fill('Abcd1234');
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/users/me/password')),
      btnChangePw(page).click(),
    ]);
    expect(res.status()).toBe(200);
  });

  test('TC-S04-31 — 10 ký tự toàn chữ cái: đủ dài nhưng KHÔNG đủ điều kiện', async ({ page }) => {
    await pwCurrent(page).fill(ME.pass);
    await pwNew(page).fill('Abcdefghij');
    await pwNew(page).blur();
    await expect(page.getByText('Mật khẩu tối thiểu 8 ký tự gồm chữ và số')).toBeVisible();
    await expect(btnChangePw(page)).toBeDisabled();
  });

  test('TC-S04-32 — Ba toggle 👁 độc lập nhau', async ({ page }) => {
    await pwCurrent(page).fill('abc');
    await pwNew(page).fill('def');
    await pwConfirm(page).fill('ghi');
    const firstToggle = page.getByRole('button', { name: 'Hiện mật khẩu' }).first();
    await firstToggle.click();
    await expect(pwCurrent(page)).toHaveAttribute('type', 'text');
    await expect(pwNew(page), 'hai trường kia vẫn che').toHaveAttribute('type', 'password');
    await expect(pwConfirm(page)).toHaveAttribute('type', 'password');
    await expect(page.getByRole('button', { name: 'Ẩn mật khẩu' })).toHaveCount(1);
  });

  test.skip('TC-S04-33 — [Manual] Thu hồi phiên khác, giữ phiên hiện tại', async () => {
    /* Manual theo `test.md`: cần hai trình duyệt. Playwright làm được bằng hai browser
       context — chuyển sang Auto nếu `test.md` đổi cột "Cách chạy". */
  });

  test('TC-S04-34 — Chỉ một thiết bị: đổi mật khẩu vẫn thành công', async ({ page }) => {
    await pwCurrent(page).fill(ME.pass);
    await pwNew(page).fill(NEW_PASSWORD);
    await pwConfirm(page).fill(NEW_PASSWORD);
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/users/me/password')),
      btnChangePw(page).click(),
    ]);
    expect(res.status(), 'không được lỗi vì "không có phiên nào để thu hồi"').toBe(200);
    await expect(toast(page)).toContainText('Đã đổi mật khẩu');
  });

  test('TC-S04-35 — Cảnh báo thu hồi phiên nằm NGAY TRÊN nút', async ({ page }) => {
    const note = page.getByText('Đổi mật khẩu sẽ đăng xuất bạn khỏi mọi thiết bị khác.');
    await expect(note).toBeVisible();
    const noteBox = await note.boundingBox();
    const btnBox = await btnChangePw(page).boundingBox();
    expect(noteBox && btnBox && noteBox.y + noteBox.height <= btnBox.y,
      'cảnh báo phải đọc được TRƯỚC khi bấm').toBeTruthy();
  });

  test.skip('TC-S04-36 — [Manual] 5 lần sai trong 15 phút → chặn, ghi rõ thời gian còn lại', async () => {
    /* Manual theo `test.md`: chạm vào bộ đếm khoá dùng chung với NFR-03; chạy tự động sẽ
       khoá tài khoản test và ảnh hưởng mọi spec khác chạy song song. */
  });

  test.skip('TC-S04-37 — [Manual] DB lưu hash bcrypt cost ≥ 12, không plaintext', async () => {
    /* Manual theo `test.md`: cần quyền đọc trực tiếp cơ sở dữ liệu, không qua giao diện. */
  });

  test.skip('TC-S04-38 — [Manual] Mật khẩu không lọt vào URL/query/log', async () => {
    /* Manual theo `test.md`: cần đọc log ứng dụng ở mức debug. */
  });

  test.skip('TC-S04-39 — [Manual] A11y: bàn phím, role=alert, autocomplete, tương phản', async () => {
    /* Manual theo `test.md`: cần trình đọc màn hình thật + axe DevTools.
       Tự động hoá được một phần bằng `@axe-core/playwright`. */
  });

  test.skip('TC-S04-40 — [Manual] Tải màn ≤ 2s', async () => {
    /* Manual theo `test.md`: đo hiệu năng cần môi trường mạng chuẩn hoá. */
  });
});

/* ---------------------------------------------------------------------------
 * GHI CHÚ CHO `dev-run` / CI
 * 1. Cần endpoint test-only `POST /test/reset-user` — nếu thiếu, `afterEach` fail và tài khoản
 *    test sẽ mắc kẹt ở mật khẩu mới sau lần chạy đầu tiên.
 * 2. TC-24/30/34 đều đổi mật khẩu thật ⇒ **không chạy song song** trên cùng tài khoản.
 *    Cấu hình `workers: 1` cho file này, hoặc cấp mỗi worker một tài khoản riêng.
 * 3. `GET /api/v1/users/by-email/...` ở TC-07 là endpoint **cố tình không tồn tại** — test
 *    khẳng định nó không mở ra. Nếu sau này thêm thật thì phải rà lại `BRule-S04-01`.
 * --------------------------------------------------------------------------- */
