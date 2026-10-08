/**
 * E2E — S01 Đăng nhập / Đăng xuất (TeamTasks)
 *
 * Nguồn (một chiều): `docs/Screen-spec/Authentication/S01 - Login/test.md`
 *   → sinh từ 36 TC: **30 Auto** (có test) / **6 Manual** (test.skip giữ dấu vết: TC-18, 20, 21, 27, 28, 29).
 *   *(CR-02: thêm TC-33…36 — buộc đổi mật khẩu tạm ở lần đăng nhập đầu.)*
 * Truy vết: mã `TC-S01-..` trong tiêu đề test → `test.md` → `R-S01-..` / `UC-S01-..` / `GWT-..` → `FR-01`, `FR-06`.
 * Chức năng: F01 (Đăng nhập) · F02 (Đăng xuất).
 *
 * CÁCH CHẠY
 *   npx playwright test e2e/tests/S01-Login.spec.ts
 * Biến môi trường bắt buộc (KHÔNG hardcode tài khoản — xem test.md, dữ liệu là giá trị demo):
 *   E2E_BASE_URL     vd https://staging.teamtasks.vn
 *   E2E_USER         email tài khoản ACTIVE          (test.md dùng an.nguyen@cty.vn)
 *   E2E_PASS         mật khẩu đúng của E2E_USER      (test.md dùng Secure@2024)
 *   E2E_LOCKED_USER  email tài khoản PERM_LOCKED     (test.md dùng locked.user@cty.vn)
 *   E2E_ADMIN_TOKEN  token gọi API test-only để seed trạng thái tài khoản (fail_count, khoá)
 *
 * ⚠️ TRẠNG THÁI: app CHƯA deploy (Phase 1 đang dev) → selector lấy từ `html-design.html` (bản mockup).
 *    Mọi selector đánh `TODO selector` phải đối chiếu lại với app thật trước khi tin kết quả chạy.
 * ⚠️ `seedAccount()` cần một endpoint test-only chưa tồn tại — xem ghi chú ở helper.
 */
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const USER = process.env.E2E_USER ?? '';
const PASS = process.env.E2E_PASS ?? '';
const LOCKED_USER = process.env.E2E_LOCKED_USER ?? '';

/** Email dài đúng 254 ký tự (TC-S01-09) và 255 ký tự (TC-S01-10) — dựng theo đúng mô tả test.md. */
const EMAIL_254 = 'a'.repeat(48) + '@' + 'a'.repeat(201) + '.vn';
const EMAIL_255 = 'a' + EMAIL_254;
/** Mật khẩu biên theo test.md: 8 (min) · 7 (dưới min) · 128 (max) · 129 (vượt max). */
const PW_8 = 'Abc@1234';
const PW_7 = 'Abc@123';
const PW_128 = 'Abc@' + 'a'.repeat(124);
const PW_129 = 'Abc@' + 'a'.repeat(125);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Ô Email — TODO selector: mockup dùng `#email` + <label for="email">Email. */
const emailBox = (page: Page) => page.getByLabel('Email');
/** Ô Mật khẩu — TODO selector: mockup dùng `#password`. */
const passwordBox = (page: Page) => page.getByLabel('Mật khẩu', { exact: true });
/** Nút submit — TODO selector: mockup dùng `#submit-btn`. */
const submitBtn = (page: Page) => page.getByRole('button', { name: 'Đăng nhập' });

async function gotoLogin(page: Page) {
  await page.goto(`${BASE}/login`);
  await expect(emailBox(page)).toBeVisible();
}

async function login(page: Page, email = USER, password = PASS) {
  await emailBox(page).fill(email);
  await passwordBox(page).fill(password);
  await submitBtn(page).click();
}

/**
 * Đưa tài khoản về trạng thái cần thiết (fail_count, TEMP_LOCKED, PERM_LOCKED).
 *
 * ⚠️ CHƯA CHẠY ĐƯỢC: `06-api-spec.md` hiện KHÔNG có endpoint test-only nào để seed trạng thái tài khoản.
 *    Không có nó thì TC-15..17, 19, 22 phải chạy tay (mỗi ca phải làm sai mật khẩu nhiều lần thật).
 *    → Cần quyết: bổ sung endpoint test-only (chỉ bật ở staging) hay seed thẳng CSDL trong CI.
 *    Đây là việc của `dev-run`/CI, KHÔNG phải của tài liệu BA — ghi lại để không rơi.
 */
async function seedAccount(
  request: APIRequestContext,
  email: string,
  state: { failCount?: number; status?: 'ACTIVE' | 'TEMP_LOCKED' | 'PERM_LOCKED'; lockExpiresInSec?: number; mustChangePassword?: boolean },
) {
  const res = await request.post(`${BASE}/test/seed-account`, {
    headers: { Authorization: `Bearer ${process.env.E2E_ADMIN_TOKEN ?? ''}` },
    data: { email, ...state },
  });
  expect(res.ok(), 'Cần endpoint test-only để seed trạng thái tài khoản — xem ghi chú helper').toBeTruthy();
}

// ---------------------------------------------------------------------------
// F01 — Đăng nhập
// ---------------------------------------------------------------------------

test.describe('F01 — Đăng nhập (S01)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLogin(page);
  });

  test('TC-S01-01 — Đăng nhập thành công bằng nút Đăng nhập', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 2000 }); // ≤ 2 giây theo NFR-01
    await expect(page.getByRole('alert')).toHaveCount(0);
    // refresh_token phải là cookie HttpOnly
    const cookies = await page.context().cookies();
    const refresh = cookies.find((c) => c.name === 'refresh_token'); // TODO selector: xác nhận tên cookie thật
    expect(refresh?.httpOnly, 'refresh_token phải HttpOnly').toBe(true);
  });

  test('TC-S01-02 — Nhấn Enter ở ô Mật khẩu tương đương nhấn nút', async ({ page }) => {
    await emailBox(page).fill(USER);
    await passwordBox(page).fill(PASS);
    await passwordBox(page).press('Enter');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('TC-S01-03 — Email có khoảng trắng đầu/cuối vẫn đăng nhập được (trim)', async ({ page }) => {
    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/auth/login') && r.method() === 'POST'),
      login(page, `  ${USER}  `, PASS),
    ]);
    expect(JSON.parse(req.postData() ?? '{}').email, 'API phải nhận email đã trim').toBe(USER);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('TC-S01-04 — Sau đăng nhập quay lại URL gốc, không phải /dashboard', async ({ page }) => {
    await page.goto(`${BASE}/tasks/123`);
    await expect(page).toHaveURL(/\/login/);
    await login(page);
    await expect(page).toHaveURL(/\/tasks\/123$/);
  });

  test('TC-S01-05 — Email sai định dạng (abc@) báo lỗi inline, không gọi API', async ({ page }) => {
    let called = false;
    page.on('request', (r) => { if (r.url().includes('/auth/login')) called = true; });
    await emailBox(page).fill('abc@');
    await emailBox(page).press('Tab');
    await expect(page.getByText('Vui lòng nhập địa chỉ email hợp lệ.')).toBeVisible();
    expect(called, 'không được gọi API khi validation phía client trượt').toBe(false);
  });

  test('TC-S01-06 — Email không có @ báo lỗi inline, không gọi API', async ({ page }) => {
    let called = false;
    page.on('request', (r) => { if (r.url().includes('/auth/login')) called = true; });
    await emailBox(page).fill('khongcodau');
    await emailBox(page).press('Tab');
    await expect(page.getByText('Vui lòng nhập địa chỉ email hợp lệ.')).toBeVisible();
    expect(called).toBe(false);
  });

  test('TC-S01-07 — Email rỗng bị chặn', async ({ page }) => {
    let called = false;
    page.on('request', (r) => { if (r.url().includes('/auth/login')) called = true; });
    await passwordBox(page).fill(PASS);
    await submitBtn(page).click();
    await expect(
      page.getByText(/Vui lòng nhập địa chỉ email hợp lệ\.|Trường này là bắt buộc\./),
    ).toBeVisible();
    expect(called).toBe(false);
  });

  test('TC-S01-08 — Mật khẩu rỗng bị chặn', async ({ page }) => {
    let called = false;
    page.on('request', (r) => { if (r.url().includes('/auth/login')) called = true; });
    await emailBox(page).fill(USER);
    await submitBtn(page).click();
    await expect(page.getByText('Vui lòng nhập mật khẩu.')).toBeVisible();
    expect(called).toBe(false);
  });

  test('TC-S01-09 — Email dài đúng 254 ký tự được chấp nhận (biên trên hợp lệ)', async ({ page }) => {
    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/auth/login')),
      login(page, EMAIL_254, PASS),
    ]);
    expect(EMAIL_254.length).toBe(254);
    expect(req).toBeTruthy(); // form không chặn; kết quả xác thực là chuyện của server
  });

  test('TC-S01-10 — Email 255 ký tự bị chặn, không gọi API', async ({ page }) => {
    let called = false;
    page.on('request', (r) => { if (r.url().includes('/auth/login')) called = true; });
    await emailBox(page).fill(EMAIL_255);
    await passwordBox(page).fill(PASS);
    await submitBtn(page).click();
    // Chặn bằng maxlength HOẶC báo lỗi — chấp nhận cả hai cách hiện thực
    const value = await emailBox(page).inputValue();
    if (value.length === 255) {
      await expect(page.getByText('Email tối đa 254 ký tự')).toBeVisible();
    } else {
      expect(value.length, 'maxlength phải cắt ở 254').toBe(254);
    }
    expect(called).toBe(false);
  });

  test('TC-S01-11 — Mật khẩu đúng 8 ký tự được chấp nhận (biên dưới hợp lệ)', async ({ page }) => {
    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/auth/login')),
      login(page, USER, PW_8),
    ]);
    expect(req).toBeTruthy();
  });

  test('TC-S01-12 — Mật khẩu 7 ký tự bị chặn', async ({ page }) => {
    let called = false;
    page.on('request', (r) => { if (r.url().includes('/auth/login')) called = true; });
    await login(page, USER, PW_7);
    await expect(page.getByText('Mật khẩu tối thiểu 8 ký tự')).toBeVisible();
    expect(called).toBe(false);
  });

  test('TC-S01-13 — Mật khẩu đúng 128 ký tự được chấp nhận (biên trên hợp lệ)', async ({ page }) => {
    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/auth/login')),
      login(page, USER, PW_128),
    ]);
    expect(PW_128.length).toBe(128);
    expect(req).toBeTruthy();
  });

  test('TC-S01-14 — Mật khẩu 129 ký tự bị chặn', async ({ page }) => {
    let called = false;
    page.on('request', (r) => { if (r.url().includes('/auth/login')) called = true; });
    await emailBox(page).fill(USER);
    await passwordBox(page).fill(PW_129);
    await submitBtn(page).click();
    const value = await passwordBox(page).inputValue();
    if (value.length === 129) {
      await expect(page.getByText('Mật khẩu tối đa 128 ký tự')).toBeVisible();
    } else {
      expect(value.length).toBe(128);
    }
    expect(called).toBe(false);
  });

  test('TC-S01-15 — Sai mật khẩu lần 1: còn 4 lần thử, xoá ô mật khẩu, giữ email', async ({ page, request }) => {
    await seedAccount(request, USER, { failCount: 0, status: 'ACTIVE' });
    await gotoLogin(page);
    await login(page, USER, 'SaiRoi001');
    await expect(page.getByText('Sai email hoặc mật khẩu. Còn 4 lần thử.')).toBeVisible();
    await expect(passwordBox(page)).toHaveValue('');
    await expect(emailBox(page)).toHaveValue(USER);
    await expect(passwordBox(page)).toBeFocused();
  });

  test('TC-S01-16 — Sai mật khẩu lần 3: còn 2 lần thử', async ({ page, request }) => {
    await seedAccount(request, USER, { failCount: 2, status: 'ACTIVE' });
    await gotoLogin(page);
    await login(page, USER, 'SaiRoi003');
    await expect(page.getByText('Sai email hoặc mật khẩu. Còn 2 lần thử.')).toBeVisible();
    await expect(passwordBox(page)).toHaveValue('');
  });

  test('TC-S01-17 — Sai mật khẩu lần 4: còn 1 lần thử', async ({ page, request }) => {
    await seedAccount(request, USER, { failCount: 3, status: 'ACTIVE' });
    await gotoLogin(page);
    await login(page, USER, 'SaiRoi004');
    await expect(page.getByText('Sai email hoặc mật khẩu. Còn 1 lần thử.')).toBeVisible();
  });

  test.skip('TC-S01-18 — Sai lần 5 → khoá tạm 15 phút [Manual trong test.md]', async () => {
    // test.md đánh Manual: cần quan sát đồng hồ đếm ngược 15 phút chạy thật.
  });

  test('TC-S01-19 — Tài khoản TEMP_LOCKED: nút disabled và API trả 423', async ({ page, request }) => {
    await seedAccount(request, USER, { status: 'TEMP_LOCKED', lockExpiresInSec: 300 });
    await gotoLogin(page);
    await emailBox(page).fill(USER);
    await passwordBox(page).fill(PASS);
    await expect(submitBtn(page)).toBeDisabled();
    const res = await request.post(`${BASE}/auth/login`, { data: { email: USER, password: PASS } });
    expect(res.status(), 'server phải chặn kể cả khi bỏ qua UI').toBe(423);
  });

  test.skip('TC-S01-20 — Hết khoá tạm thì đăng nhập lại được [Manual trong test.md]', async () => {
    // test.md đánh Manual: phụ thuộc thời gian thực / mock đồng hồ.
  });

  test.skip('TC-S01-21 — Tài khoản PERM_LOCKED [Manual trong test.md]', async () => {
    // test.md đánh Manual. Tài khoản dùng: E2E_LOCKED_USER (locked.user@cty.vn).
    void LOCKED_USER;
  });

  test('TC-S01-22 — 3 lần khoá tạm liên tiếp → PERM_LOCKED (BRule-S01-03)', async ({ page, request }) => {
    // Seed thẳng tới trạng thái sau 2 lần khoá tạm + fail_count 4 rồi sai lần cuối,
    // thay vì thực hiện 15 lần sai thật (test.md mô tả luồng đầy đủ, ở đây rút gọn có chủ đích).
    await seedAccount(request, USER, { failCount: 4, status: 'ACTIVE' });
    await gotoLogin(page);
    await login(page, USER, 'SaiRoi015');
    await expect(page.getByText(/khoá vĩnh viễn/i)).toBeVisible();
    // test.md: "API trả 403 sau lần sai thứ 15" — kiểm cả phía server, không chỉ thông báo UI
    const res = await request.post(`${BASE}/auth/login`, { data: { email: USER, password: PASS } });
    expect(res.status(), 'tài khoản PERM_LOCKED thì API phải trả 403').toBe(403);
  });

  test('TC-S01-23 — Đã đăng nhập mà vào /login thì bị đẩy về /dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto(`${BASE}/login`);
    await expect(page).toHaveURL(/\/dashboard$/);
    // test.md: "form đăng nhập không được render"
    await expect(emailBox(page)).toHaveCount(0);
  });

  test('TC-S01-24 — Nhấn Back sau khi đăng nhập vẫn ở /dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('TC-S01-25 — Mất mạng: snackbar lỗi kết nối, form giữ nguyên nội dung', async ({ page, context }) => {
    await emailBox(page).fill(USER);
    await passwordBox(page).fill(PASS);
    await context.setOffline(true);
    await submitBtn(page).click();
    // test.md yêu cầu đúng câu này, không phải "lỗi mạng" chung chung
    await expect(page.getByText('Lỗi kết nối. Vui lòng thử lại.')).toBeVisible({ timeout: 10_000 });
    await expect(emailBox(page)).toHaveValue(USER); // form giữ nguyên nội dung đã nhập
    await expect(passwordBox(page)).toHaveValue(PASS);
    await expect(submitBtn(page)).toBeEnabled(); // nút được enable lại cho thử tiếp
    await context.setOffline(false);
  });

  test('TC-S01-26 — Quá 20 request/phút từ một IP bị chặn (R-S01-N01)', async ({ request }) => {
    const codes: number[] = [];
    for (let i = 0; i < 21; i++) {
      const res = await request.post(`${BASE}/auth/login`, {
        data: { email: USER, password: 'SaiRoiRateLimit' },
      });
      codes.push(res.status());
    }
    expect(codes.at(-1), 'request thứ 21 phải bị rate-limit').toBe(429);
  });

  test.skip('TC-S01-27 — Mật khẩu không lộ trong DevTools/Network [Manual trong test.md]', async () => {
    // test.md đánh Manual: cần quan sát tab Network bằng mắt.
  });

  test.skip('TC-S01-28 — Thứ tự Tab và kích hoạt bằng Space [Manual trong test.md]', async () => {
    // test.md đánh Manual (a11y, kiểm bằng bàn phím thật).
  });

  test.skip('TC-S01-29 — Nút con mắt hiện/ẩn mật khẩu [Manual trong test.md]', async () => {
    // test.md đánh Manual. Mockup có #toggle-pw-btn với aria-label "Hiện mật khẩu".
  });
});

// ---------------------------------------------------------------------------
// F02 — Đăng xuất
// ---------------------------------------------------------------------------

test.describe('F02 — Đăng xuất (S01)', () => {
  test('TC-S01-30 — Đăng xuất: gọi POST /auth/logout, về /login, xoá refresh_token', async ({ page }) => {
    await gotoLogin(page);
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/);
    const [logoutReq] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/auth/logout') && r.method() === 'POST'),
      page.getByRole('button', { name: 'Đăng xuất' }).click(), // TODO selector: xác nhận nút thật trong header
    ]);
    expect(logoutReq, 'test.md yêu cầu POST /auth/logout phải được gọi').toBeTruthy();
    await expect(page).toHaveURL(/\/login$/, { timeout: 500 }); // ≤ 500ms theo test.md
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'refresh_token')).toBeUndefined();
  });

  test('TC-S01-31 — access_token cũ sau đăng xuất bị từ chối (401)', async ({ page, request }) => {
    await gotoLogin(page);
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/login') && r.request().method() === 'POST'),
      login(page),
    ]);
    const oldToken = (await res.json())?.access_token; // TODO: xác nhận tên trường theo 06-api-spec.md
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    const after = await request.get(`${BASE}/tasks`, {
      headers: { Authorization: `Bearer ${oldToken}` },
    });
    expect(after.status(), 'token cũ phải bị revoke').toBe(401);
  });

  test('TC-S01-32 — Mất mạng khi đăng xuất: client vẫn xoá phiên và về /login', async ({ page, context }) => {
    await gotoLogin(page);
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/);
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 });
    // logout "best-effort": dù API thất bại, phiên phía client vẫn phải bị xoá
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'refresh_token')).toBeUndefined();
    await context.setOffline(false);
  });
});

// ---------------------------------------------------------------------------
// F01 — Buộc đổi mật khẩu tạm ở lần đăng nhập đầu (CR-02)
// ---------------------------------------------------------------------------

test.describe('F01 — Buộc đổi mật khẩu tạm (S01 · CR-02)', () => {
  // Tài khoản mời-mới: mật khẩu tạm, cờ phai_doi_mat_khau = true
  const TEMP = { email: process.env.E2E_TEMP_USER ?? 'moi.nguoi@acme.vn', pass: process.env.E2E_TEMP_PASS ?? 'ChangeMe@123' };

  test('TC-S01-33 — Đăng nhập bằng mật khẩu tạm: vào thẳng form đổi mật khẩu, KHÔNG vào dashboard', async ({ page, request }) => {
    await seedAccount(request, TEMP.email, { status: 'ACTIVE', mustChangePassword: true });
    await gotoLogin(page);
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/login')),
      login(page, TEMP.email, TEMP.pass),
    ]);
    expect((await res.json()).phai_doi_mat_khau, 'API báo buộc đổi mật khẩu').toBe(true);
    await expect(page).not.toHaveURL(/\/dashboard/);
    // TODO selector: route form đổi mật khẩu bắt buộc — xác nhận khi app deploy
    await expect(page).toHaveURL(/doi-mat-khau|change-password|force/);
    await expect(page.getByLabel(/Mật khẩu mới/i)).toBeVisible();
  });

  test('TC-S01-34 — Cờ true: gõ thẳng URL màn khác đều bị đưa lại form (BRule-S01-07)', async ({ page, request }) => {
    await seedAccount(request, TEMP.email, { status: 'ACTIVE', mustChangePassword: true });
    await gotoLogin(page);
    await login(page, TEMP.email, TEMP.pass);
    await expect(page.getByLabel(/Mật khẩu mới/i)).toBeVisible();

    for (const path of ['/dashboard', '/tasks/t-100', '/profile']) {
      await page.goto(`${BASE}${path}`);
      await expect(page, `gõ thẳng ${path} vẫn phải bị chặn`).toHaveURL(/doi-mat-khau|change-password|force/);
      await expect(page.getByRole('heading', { name: /Dashboard/ })).toHaveCount(0);
    }
  });

  test('TC-S01-35 — Đổi mật khẩu xong: xoá cờ, mở khoá điều hướng, lần sau không bị buộc', async ({ page, request }) => {
    await seedAccount(request, TEMP.email, { status: 'ACTIVE', mustChangePassword: true });
    await gotoLogin(page);
    await login(page, TEMP.email, TEMP.pass);

    const NEW = 'MoiToanha@2026';
    await page.getByLabel(/Mật khẩu mới/i).first().fill(NEW);       // TODO selector: dùng lại form S04
    await page.getByLabel(/Xác nhận/i).fill(NEW);
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/users/me/password')),
      page.getByRole('button', { name: /Đổi mật khẩu/ }).click(),
    ]);
    expect(res.status()).toBe(200);
    await expect(page).toHaveURL(/\/dashboard/);

    // Đăng nhập lại bằng mật khẩu MỚI → không còn bị buộc đổi
    await page.goto(`${BASE}/login`);
    await login(page, TEMP.email, NEW);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('TC-S01-36 — Đăng xuất giữa chừng: lần đăng nhập sau vẫn bị buộc đổi (không đường vòng)', async ({ page, request }) => {
    await seedAccount(request, TEMP.email, { status: 'ACTIVE', mustChangePassword: true });
    await gotoLogin(page);
    await login(page, TEMP.email, TEMP.pass);
    await expect(page.getByLabel(/Mật khẩu mới/i)).toBeVisible();

    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(/\/login/);

    await login(page, TEMP.email, TEMP.pass);                       // vẫn mật khẩu tạm
    await expect(page, 'cờ chưa gỡ nên lại rơi vào buộc đổi').toHaveURL(/doi-mat-khau|change-password|force/);
  });
});
