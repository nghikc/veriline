/**
 * E2E — S05 Tổ chức (TeamTasks)
 *
 * Nguồn (một chiều): `docs/Screen-spec/S05 - Organization/test.md`
 *   → sinh từ 53 TC: **45 Auto** (có test) / **8 Manual** (test.skip giữ dấu vết:
 *     TC-09, 30, 37, 43, 49, 51, 52, 53).
 * Truy vết: mã `TC-S05-..` trong tiêu đề test → `test.md` → `R-S05-..` / `UC-S05-..` / `BRule-S05-..`
 *           → `FR-12` (thông tin tổ chức), `FR-02` (quản trị thành viên).
 * Chức năng: F11 (Thông tin tổ chức — Team Lead + Org Admin) · F13 (Quản trị thành viên — chỉ Org Admin).
 *
 * CÁCH CHẠY
 *   npx playwright test e2e/tests/S05-Organization.spec.ts
 * Biến môi trường:
 *   E2E_BASE_URL                       vd https://staging.teamtasks.vn
 *   E2E_ADMIN / E2E_ADMIN_PASS         Org Admin của Acme (admin@acme.vn)
 *   E2E_LEAD / E2E_LEAD_PASS           Team Lead (lead1@acme.vn)
 *   E2E_MEMBER / E2E_MEMBER_PASS       Member (le.c@acme.vn)
 *   E2E_MEMBER2 / E2E_MEMBER2_PASS     Member (member2@acme.vn — Trần B)
 *   E2E_BETA_ADMIN / E2E_BETA_PASS     Org Admin tổ chức Beta — dùng cho TC-21 (cách ly tenant)
 *   E2E_ADMIN_TOKEN                    token gọi API test-only để seed/dọn dữ liệu
 *
 * ⚠️ **Test này TẠO TÀI KHOẢN và ĐỔI VAI TRÒ/TRẠNG THÁI thật.** `resetOrg()` ở `afterEach` phải
 *    dọn sạch, nếu không tổ chức test sẽ phình tài khoản rác và các test đếm số (12/25 thành viên)
 *    sẽ sai từ lần chạy thứ hai. Chỉ chạy trên **staging**.
 * ⚠️ App CHƯA deploy → selector lấy từ `html-design.html` (mockup): `#orgName`, `#orgNameCounter`,
 *    `#orgLogoUrl`, `#orgSave`, `#orgCancel`, `#orgLogo`, `#memSearch`, `#fRole`, `#fStatus`,
 *    `#btnInvite`, `#memTbody`, `#memTotal`, `#filterEmpty`, `#btnMore`, `#showCount`,
 *    `#memError`, `#ivEmail`, `#ivName`, `#ivPw`, `#ivEmailError`, `#createdPw`, `#toast`.
 *    Mọi chỗ `TODO selector` phải đối chiếu lại với app thật.
 */
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const ADMIN = { email: process.env.E2E_ADMIN ?? '', pass: process.env.E2E_ADMIN_PASS ?? '' };
const LEAD = { email: process.env.E2E_LEAD ?? '', pass: process.env.E2E_LEAD_PASS ?? '' };
const MEMBER = { email: process.env.E2E_MEMBER ?? '', pass: process.env.E2E_MEMBER_PASS ?? '' };
const MEMBER2 = { email: process.env.E2E_MEMBER2 ?? '', pass: process.env.E2E_MEMBER2_PASS ?? '' };
const BETA_ADMIN = { email: process.env.E2E_BETA_ADMIN ?? '', pass: process.env.E2E_BETA_PASS ?? '' };

// ---------------------------------------------------------------------------
// Helper — TODO selector: đối chiếu lại khi app deploy
// ---------------------------------------------------------------------------
const orgName = (p: Page) => p.locator('#orgName');
const orgNameCounter = (p: Page) => p.locator('#orgNameCounter');
const orgLogoUrl = (p: Page) => p.locator('#orgLogoUrl');
const orgSave = (p: Page) => p.locator('#orgSave');
const orgCancel = (p: Page) => p.locator('#orgCancel');
const orgLogo = (p: Page) => p.locator('#orgLogo');
const memSearch = (p: Page) => p.locator('#memSearch');
const memRows = (p: Page) => p.locator('#memTbody tr');
const inviteBtn = (p: Page) => p.locator('#btnInvite');
const toast = (p: Page) => p.locator('#toast');
const btn = (p: Page, name: string) => p.getByRole('button', { name });
const rowOf = (p: Page, name: string) => memRows(p).filter({ hasText: name });
const menuOf = async (p: Page, name: string) => {
  await rowOf(p, name).getByRole('button', { name: new RegExp(`Hành động với ${name}`) }).click();
  return p.getByRole('menu');
};

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

async function idOf(request: APIRequestContext, token: string, email: string) {
  const res = await request.get(`${BASE}/api/v1/organizations/me/members?q=${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const found = ((await res.json())?.data ?? []).find((m: { email: string }) => m.email === email);
  expect(found, `không tìm thấy thành viên ${email}`).toBeTruthy();
  return found.id as string;
}

/**
 * Dựng lại tổ chức test về nguyên trạng: 12 thành viên chuẩn, vai trò/trạng thái gốc,
 * xoá mọi tài khoản do test tạo ra.
 *
 * ⚠️ CHƯA CHẠY ĐƯỢC: cần endpoint test-only (chỉ bật ở staging). Việc của `dev-run`/CI.
 */
async function resetOrg(request: APIRequestContext, dataset = 's05-baseline') {
  const res = await request.post(`${BASE}/test/reset-org`, {
    headers: { Authorization: `Bearer ${process.env.E2E_ADMIN_TOKEN ?? ''}` },
    data: { dataset },
  });
  expect(res.ok(), `Cần endpoint test-only để dựng lại tổ chức "${dataset}"`).toBeTruthy();
}

test.beforeEach(async ({ request }) => {
  await resetOrg(request);
});
test.afterEach(async ({ request }) => {
  await resetOrg(request);
});

// ===========================================================================
// F11 — Thông tin tổ chức
// ===========================================================================

test.describe('F11 — Thông tin tổ chức (S05)', () => {
  test('TC-S05-01 — Hiển thị đủ 5 mục thông tin tổ chức', async ({ page }) => {
    await login(page, LEAD);
    await page.goto(`${BASE}/organization`);
    await expect(orgLogo(page)).toBeVisible();
    await expect(orgName(page)).toHaveValue('Acme');
    await expect(page.getByText('acme', { exact: true })).toBeVisible();
    await expect(page.getByText('02/06/2026')).toBeVisible();
    await expect(page.locator('#orgTotal')).toHaveText('12');
  });

  test('TC-S05-02 — Mở màn: nút Lưu và Huỷ đều disable', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    await expect(orgSave(page)).toBeDisabled();
    await expect(orgCancel(page)).toBeDisabled();
  });

  test('TC-S05-03 — Slug KHÔNG nằm trong input, có khoá + chú thích', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    const row = page.locator('.locked-row').filter({ hasText: 'Định danh' });   // TODO selector
    await expect(row.locator('input')).toHaveCount(0);
    await expect(row).toContainText('🔒');
    await expect(row).toContainText('không đổi được');
  });

  test('TC-S05-04 — Lưu tên: 1 lời gọi, body CHỈ chứa `ten`', async ({ page }) => {
    const bodies: string[] = [];
    page.on('request', (r) => {
      if (r.method() === 'PATCH' && /\/organizations\/me$/.test(r.url())) bodies.push(r.postData() ?? '');
    });
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    await orgName(page).fill('Acme Việt Nam');
    await orgSave(page).click();
    await expect(toast(page)).toContainText('Đã cập nhật thông tin tổ chức');
    expect(bodies).toHaveLength(1);
    expect(Object.keys(JSON.parse(bodies[0]))).toEqual(['ten']);
  });

  test('TC-S05-05 — Tên tổ chức rỗng: lỗi + nút Lưu disable', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    await orgName(page).fill('');
    await orgName(page).blur();
    await expect(page.getByText('Vui lòng nhập tên tổ chức')).toBeVisible();
    await expect(orgSave(page)).toBeDisabled();
  });

  test('TC-S05-06 — Tên 101 ký tự: lỗi + bộ đếm đỏ + disable (BVA)', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    await orgName(page).fill('A'.repeat(101));
    await orgName(page).blur();
    await expect(page.getByText('Tên tổ chức tối đa 100 ký tự')).toBeVisible();
    await expect(orgNameCounter(page)).toContainText('101/100');
    await expect(orgNameCounter(page)).toHaveClass(/over/);
    await expect(orgSave(page)).toBeDisabled();
  });

  test('TC-S05-07 — Logo `http://`: lỗi tiền tố (BRule-S05-10)', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    await orgLogoUrl(page).fill('http://cdn.acme.vn/logo.png');
    await orgLogoUrl(page).blur();
    await expect(page.getByText('Đường dẫn logo phải bắt đầu bằng https://')).toBeVisible();
    await expect(orgSave(page)).toBeDisabled();
  });

  test('TC-S05-08 — Xoá trắng logo: hợp lệ, quay về chữ cái đầu "A"', async ({ page, request }) => {
    const token = await apiToken(request, ADMIN);
    await request.patch(`${BASE}/api/v1/organizations/me`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { logo_url: 'https://cdn.acme.vn/logo.png' },
    });
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    await orgLogoUrl(page).fill('');
    await orgSave(page).click();
    await expect(toast(page)).toContainText('Đã cập nhật thông tin tổ chức');
    await expect(orgLogo(page)).toHaveText('A');
  });

  test.skip('TC-S05-09 — [Manual] Lưu lỗi mạng: giữ nguyên giá trị đã nhập', async () => {
    /* Manual theo `test.md`: cần bật/tắt mạng bằng DevTools.
       Playwright làm được bằng `context.setOffline(true)` — chuyển sang Auto nếu `test.md` đổi. */
  });

  test('TC-S05-10 — Hoàn tác về giá trị gốc: nút Lưu disable trở lại', async ({ page }) => {
    let called = false;
    page.on('request', (r) => { if (r.method() === 'PATCH') called = true; });
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    await orgName(page).fill('Acme X');
    await expect(orgSave(page)).toBeEnabled();
    await orgName(page).fill('Acme');
    await expect(orgSave(page)).toBeDisabled();
    expect(called).toBe(false);
  });

  test('TC-S05-11 — Máy chủ BỎ QUA `slug` trong body (BRule-S05-02)', async ({ request }) => {
    const token = await apiToken(request, ADMIN);
    await request.patch(`${BASE}/api/v1/organizations/me`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { ten: 'Acme Mới', slug: 'hacked' },
    });
    const org = await (await request.get(`${BASE}/api/v1/organizations/me`, { headers: { Authorization: `Bearer ${token}` } })).json();
    expect(org.ten).toBe('Acme Mới');
    expect(org.slug, 'slug không đổi được').toBe('acme');
  });

  test('TC-S05-12 — Lỗi tải thông tin tổ chức: khối lỗi + "Thử lại"', async ({ page }) => {
    await login(page, ADMIN);
    await page.route('**/api/v1/organizations/me', (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto(`${BASE}/organization`);
    await expect(page.locator('#orgError, #errBlock').first()).toBeVisible();   // TODO selector
    await page.unroute('**/api/v1/organizations/me');
    await btn(page, 'Thử lại').first().click();
    await expect(orgName(page)).toHaveValue('Acme');
  });

  test('TC-S05-19 — Team Lead CÓ quyền sửa thông tin tổ chức (F11 tách khỏi F13)', async ({ page }) => {
    await login(page, LEAD);
    await page.goto(`${BASE}/organization`);
    await orgName(page).fill('Acme by Lead');
    await orgSave(page).click();
    await expect(toast(page)).toContainText('Đã cập nhật thông tin tổ chức');
  });

  test('TC-S05-20 — Member: bị chặn, danh sách KHÔNG kịp render dù một khung hình', async ({ page }) => {
    await login(page, MEMBER);
    await page.goto(`${BASE}/organization`);
    await expect(page.locator('#memTbody tr')).toHaveCount(0);
    await expect(page).not.toHaveURL(/\/organization$/);
  });
});

// ===========================================================================
// F13 — Danh sách & phân quyền hiển thị
// ===========================================================================

test.describe('F13 — Danh sách thành viên (S05)', () => {
  test('TC-S05-13 — Tiêu đề "Thành viên (12)", mỗi dòng đủ 5 cột', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    await expect(page.getByRole('heading', { name: /Thành viên \(12\)/ })).toBeVisible();
    const first = memRows(page).first();
    await expect(first).toContainText('@acme.vn');
    await expect(first.locator('.badge')).toHaveCount(2);              // vai trò + trạng thái
    await expect(first).toContainText(/\d{2}\/\d{2}\/\d{4}/);
  });

  test('TC-S05-14 — Tìm theo tên/email, không phân biệt hoa thường, debounce 300ms', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    await memSearch(page).fill('trần');
    await expect(memRows(page)).toHaveCount(1);
    await expect(memRows(page).first()).toContainText('Trần B');
  });

  test('TC-S05-15 — Hai bộ lọc kết hợp = GIAO điều kiện', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    await page.locator('#fRole').selectOption('MEMBER');
    const onlyMembers = await memRows(page).count();
    expect(onlyMembers).toBeGreaterThan(1);
    await page.locator('#fStatus').selectOption('INACTIVE');
    await expect(memRows(page)).toHaveCount(1);
    await expect(memRows(page).first()).toContainText('Phạm D');
  });

  test('TC-S05-16 — Lọc rỗng: thông điệp riêng + "Xoá bộ lọc" khôi phục', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    await memSearch(page).fill('zzzzz');
    await expect(page.getByText('Không tìm thấy thành viên phù hợp')).toBeVisible();
    await btn(page, 'Xoá bộ lọc').click();
    await expect(memRows(page)).toHaveCount(12);
  });

  test('TC-S05-17 — 25 thành viên: trang đầu 20 + "Hiển thị 20 / 25", tải thêm ra đủ 25', async ({ page, request }) => {
    await resetOrg(request, 's05-25-members');
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    await expect(memRows(page)).toHaveCount(20);
    await expect(page.locator('#showCount')).toHaveText('Hiển thị 20 / 25');
    await btn(page, 'Tải thêm').click();
    await expect(memRows(page)).toHaveCount(25);
    await expect(page.locator('#btnMore')).toBeHidden();
  });

  test('TC-S05-18 — Team Lead: KHÔNG có nút Mời và cột [⋮], bảng đúng 5 cột', async ({ page }) => {
    await login(page, LEAD);
    await page.goto(`${BASE}/organization`);
    // Khẳng định VẮNG MẶT, không phải kiểm disabled (R-S05-11)
    await expect(inviteBtn(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Hành động với/ })).toHaveCount(0);
    await expect(page.locator('#memTbody tr').first().locator('td')).toHaveCount(5);
    await expect(page.locator('thead th')).toHaveCount(5);
  });

  test('TC-S05-21 — Cách ly tenant: Beta chỉ thấy 3 người của Beta', async ({ page, request }) => {
    await login(page, BETA_ADMIN);
    await page.goto(`${BASE}/organization`);
    await expect(memRows(page)).toHaveCount(3);

    const token = await apiToken(request, BETA_ADMIN);
    const res = await request.get(`${BASE}/api/v1/organizations/me/members`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.text();
    expect(body).not.toContain('acme.vn');
  });

  test('TC-S05-50 — Chỉ danh sách lỗi: khối Thông tin tổ chức vẫn sửa được', async ({ page }) => {
    await login(page, ADMIN);
    await page.route('**/api/v1/organizations/me/members*', (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto(`${BASE}/organization`);
    await expect(page.locator('#memError')).toBeVisible();
    await orgName(page).fill('Acme vẫn sửa được');
    await expect(orgSave(page)).toBeEnabled();
  });
});

// ===========================================================================
// F13 — Mời thành viên
// ===========================================================================

test.describe('F13 — Mời thành viên (S05)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
  });

  test('TC-S05-22 — Tạo tài khoản thành công: 201, danh sách +1', async ({ page }) => {
    await inviteBtn(page).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Thành viên' })).toBeChecked();   // mặc định

    await page.locator('#ivEmail').fill('moi.nguoi@acme.vn');
    await page.locator('#ivName').fill('Người Mới');
    await page.locator('#ivPw').fill('ChangeMe@123');
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/members') && r.request().method() === 'POST'),
      btn(page, 'Tạo tài khoản').click(),
    ]);
    expect(res.status()).toBe(201);
    await btn(page, 'Đã hiểu').click();
    await expect(page.getByRole('heading', { name: /Thành viên \(13\)/ })).toBeVisible();
    await expect(rowOf(page, 'Người Mới')).toHaveCount(1);
  });

  test('TC-S05-23 — Nút ⟳ sinh mật khẩu đạt mức "Mạnh"', async ({ page }) => {
    await inviteBtn(page).click();
    await page.getByRole('button', { name: /Sinh mật khẩu mạnh/ }).click();
    const pw = await page.locator('#ivPw').inputValue();
    expect(pw.length).toBeGreaterThanOrEqual(12);
    expect(/[a-zA-Z]/.test(pw) && /\d/.test(pw), 'phải có cả chữ và số').toBe(true);
    await expect(page.locator('#ivStrengthText')).toHaveText('Mạnh');
  });

  test('TC-S05-24 — Hộp mật khẩu tạm: có Sao chép + cảnh báo, KHÔNG nhắc gửi email', async ({ page }) => {
    await inviteBtn(page).click();
    await page.locator('#ivEmail').fill('moi.nguoi@acme.vn');
    await page.locator('#ivName').fill('Người Mới');
    await page.locator('#ivPw').fill('ChangeMe@123');
    await btn(page, 'Tạo tài khoản').click();

    const dlg = page.getByRole('dialog').filter({ hasText: 'Đã tạo tài khoản' });
    await expect(dlg.locator('#createdPw')).toHaveText('ChangeMe@123');
    await expect(dlg.getByRole('button', { name: 'Sao chép' })).toBeVisible();
    await expect(dlg).toContainText('KHÔNG hiển thị lại');
    await expect(dlg, 'hệ thống không gửi email — không được ám chỉ ngược lại')
      .not.toContainText(/đã gửi (email|thư)/i);
  });

  test('TC-S05-25 — Đóng hộp: không đường nào xem lại mật khẩu (R-S05-N04)', async ({ page, request }) => {
    await inviteBtn(page).click();
    await page.locator('#ivEmail').fill('moi.nguoi@acme.vn');
    await page.locator('#ivName').fill('Người Mới');
    await page.locator('#ivPw').fill('ChangeMe@123');
    await btn(page, 'Tạo tài khoản').click();
    await btn(page, 'Sao chép').click();
    await btn(page, 'Đã hiểu').click();

    expect(await page.content(), 'mật khẩu phải biến mất khỏi DOM').not.toContain('ChangeMe@123');
    const token = await apiToken(request, ADMIN);
    const body = await (await request.get(`${BASE}/api/v1/organizations/me/members`, {
      headers: { Authorization: `Bearer ${token}` },
    })).text();
    expect(body).not.toContain('ChangeMe@123');
    expect(body, 'response không được chứa cả hash').not.toMatch(/\$2[aby]\$/);
  });

  test('TC-S05-26 — Email trùng: 409, lỗi dưới trường Email, modal KHÔNG đóng', async ({ page }) => {
    await inviteBtn(page).click();
    await page.locator('#ivEmail').fill(MEMBER.email);
    await page.locator('#ivName').fill('Trùng Email');
    await page.locator('#ivPw').fill('ChangeMe@123');
    await btn(page, 'Tạo tài khoản').click();

    await expect(page.locator('#ivEmailError')).toHaveText('Email này đã được sử dụng.');
    await expect(page.getByRole('dialog')).toBeVisible();               // modal không đóng
    await expect(page.locator('#ivName')).toHaveValue('Trùng Email');   // ba trường kia giữ nguyên
    await expect(page.locator('#ivPw')).toHaveValue('ChangeMe@123');
    await expect(page.getByRole('radio', { name: 'Thành viên' })).toBeChecked();
  });

  test('TC-S05-27 — Email trùng ở TỔ CHỨC KHÁC vẫn 409 (BRule-S05-06)', async ({ page }) => {
    await inviteBtn(page).click();
    await page.locator('#ivEmail').fill(BETA_ADMIN.email);
    await page.locator('#ivName').fill('Người Beta');
    await page.locator('#ivPw').fill('ChangeMe@123');
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/members') && r.request().method() === 'POST'),
      btn(page, 'Tạo tài khoản').click(),
    ]);
    expect(res.status(), 'email duy nhất TOÀN HỆ THỐNG').toBe(409);
  });

  test('TC-S05-28 — Email sai định dạng: lỗi tại chỗ, không gọi API', async ({ page }) => {
    let called = false;
    page.on('request', (r) => { if (r.method() === 'POST' && r.url().includes('/members')) called = true; });
    await inviteBtn(page).click();
    await page.locator('#ivEmail').fill('abc@');
    await page.locator('#ivEmail').blur();
    await expect(page.getByText('Email không hợp lệ')).toBeVisible();
    await expect(page.locator('#ivSubmit')).toBeDisabled();
    expect(called).toBe(false);
  });

  test('TC-S05-29 — Mật khẩu tạm 7 ký tự: lỗi + nút disable (BVA)', async ({ page }) => {
    await inviteBtn(page).click();
    await page.locator('#ivEmail').fill('moi.nguoi@acme.vn');
    await page.locator('#ivName').fill('Người Mới');
    await page.locator('#ivPw').fill('Abcd123');
    await page.locator('#ivPw').blur();
    await expect(page.locator('#ivSubmit')).toBeDisabled();
  });

  test.skip('TC-S05-30 — [Manual] DB lưu hash bcrypt cost ≥ 12, không plaintext', async () => {
    /* Manual theo `test.md`: cần quyền đọc trực tiếp cơ sở dữ liệu, không qua giao diện.
       Phần "API không trả mật khẩu/hash" đã được phủ ở TC-25. */
  });

  test('TC-S05-31 — Team Lead gọi thẳng API mời: 403, không tạo tài khoản nào', async ({ request }) => {
    const leadToken = await apiToken(request, LEAD);
    const res = await request.post(`${BASE}/api/v1/organizations/me/members`, {
      headers: { Authorization: `Bearer ${leadToken}` },
      data: { email: 'lelut@acme.vn', ho_ten: 'Lén Lút', vai_tro: 'MEMBER', mat_khau: 'ChangeMe@123' },
    });
    expect(res.status()).toBe(403);

    const adminToken = await apiToken(request, ADMIN);
    const list = await (await request.get(`${BASE}/api/v1/organizations/me/members`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })).json();
    expect((list.data ?? []).some((m: { email: string }) => m.email === 'lelut@acme.vn')).toBe(false);
  });
});

// ===========================================================================
// F13 — Đổi vai trò · vô hiệu hoá · kích hoạt lại
// ===========================================================================

test.describe('F13 — Quản trị thành viên (S05)', () => {
  test('TC-S05-32 — Đổi vai trò: badge đổi ngay, quyền có hiệu lực không cần đăng nhập lại', async ({ page, request }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    const menu = await menuOf(page, 'Trần B');
    await menu.getByRole('menuitem', { name: /Đổi vai trò/ }).click();
    await menu.getByRole('menuitem', { name: /Quản lý nhóm/ }).click();
    await expect(rowOf(page, 'Trần B').locator('.badge').first()).toHaveText('Quản lý nhóm');
    await expect(toast(page)).toContainText('Đã đổi vai trò');

    const token = await apiToken(request, MEMBER2);      // token cũ, chưa đăng nhập lại
    const res = await request.get(`${BASE}/api/v1/tasks?scope=team`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status(), 'quyền mới có hiệu lực ngay').toBe(200);
  });

  test('TC-S05-33 — Member gọi thẳng API đổi vai trò: 403', async ({ request }) => {
    const adminToken = await apiToken(request, ADMIN);
    const targetId = await idOf(request, adminToken, MEMBER2.email);
    const memberToken = await apiToken(request, MEMBER);
    const res = await request.patch(`${BASE}/api/v1/organizations/me/members/${targetId}`, {
      headers: { Authorization: `Bearer ${memberToken}` },
      data: { vai_tro: 'ORG_ADMIN' },
    });
    expect(res.status()).toBe(403);
    const after = await (await request.get(`${BASE}/api/v1/organizations/me/members?q=${MEMBER2.email}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })).json();
    expect(after.data[0].vai_tro).toBe('MEMBER');
  });

  test('TC-S05-34 — Đổi vai trò người của tổ chức khác: 404 (không phải 403)', async ({ request }) => {
    const betaToken = await apiToken(request, BETA_ADMIN);
    const betaMemberId = await idOf(request, betaToken, BETA_ADMIN.email);
    const acmeToken = await apiToken(request, ADMIN);
    const res = await request.patch(`${BASE}/api/v1/organizations/me/members/${betaMemberId}`, {
      headers: { Authorization: `Bearer ${acmeToken}` },
      data: { vai_tro: 'MEMBER' },
    });
    expect(res.status(), 'không lộ sự tồn tại của người thuộc tổ chức khác').toBe(404);
  });

  test('TC-S05-35 — Hộp xác nhận nêu 3 hệ quả + đúng số công việc thật (4)', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    const menu = await menuOf(page, 'Lê C');
    await menu.getByRole('menuitem', { name: /Vô hiệu hoá/ }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.locator('li')).toHaveCount(3);
    await expect(dlg).toContainText('4 công việc');
    await expect(dlg).toContainText('Tài khoản không bị xoá, có thể kích hoạt lại.');
  });

  test('TC-S05-36 — Vô hiệu hoá: badge đổi, dòng VẪN CÒN, tổng không giảm', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    const menu = await menuOf(page, 'Lê C');
    await menu.getByRole('menuitem', { name: /Vô hiệu hoá/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Vô hiệu hoá' }).click();

    await expect(rowOf(page, 'Lê C').locator('.badge').nth(1)).toContainText('Vô hiệu');
    await expect(rowOf(page, 'Lê C'), 'không xoá vật lý').toHaveCount(1);
    await expect(page.getByRole('heading', { name: /Thành viên \(12\)/ })).toBeVisible();
  });

  test.skip('TC-S05-37 — [Manual] Người bị vô hiệu hoá bị đăng xuất và không đăng nhập lại được', async () => {
    /* Manual theo `test.md`: cần hai trình duyệt song song. Playwright làm được bằng hai
       browser context — chuyển sang Auto nếu `test.md` đổi cột "Cách chạy". */
  });

  test('TC-S05-38 — 4 công việc GIỮ NGUYÊN người thực hiện (BRule-S05-08)', async ({ page, request }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    const menu = await menuOf(page, 'Lê C');
    await menu.getByRole('menuitem', { name: /Vô hiệu hoá/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Vô hiệu hoá' }).click();
    await expect(rowOf(page, 'Lê C').locator('.badge').nth(1)).toContainText('Vô hiệu');

    const adminToken = await apiToken(request, ADMIN);
    const leCId = await idOf(request, adminToken, MEMBER.email);
    const tasks = await (await request.get(`${BASE}/api/v1/tasks?assignee=${leCId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })).json();
    expect((tasks.data ?? []).length, 'hệ thống không tự gỡ giao').toBe(4);
    for (const t of tasks.data) expect(t.nguoi_nhan_id).toBe(leCId);
  });

  test('TC-S05-39 — Người bị vô hiệu hoá biến mất khỏi dropdown chọn người thực hiện', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    const menu = await menuOf(page, 'Lê C');
    await menu.getByRole('menuitem', { name: /Vô hiệu hoá/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Vô hiệu hoá' }).click();
    await expect(rowOf(page, 'Lê C').locator('.badge').nth(1)).toContainText('Vô hiệu');

    await page.goto(`${BASE}/dashboard`);
    await btn(page, /Tạo công việc/).click();
    const options = await page.locator('#taskAssignee option').allInnerTexts();   // TODO selector
    expect(options.join('|'), 'nhất quán với BRule-S02-05').not.toContain('Lê C');
  });

  test('TC-S05-40 — Dòng INACTIVE: menu CHỈ có "Kích hoạt lại"; kích hoạt xong đăng nhập được', async ({ page, request }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    const menu = await menuOf(page, 'Phạm D');
    await expect(menu.getByRole('menuitem')).toHaveCount(1);
    await expect(menu.getByRole('menuitem', { name: /Kích hoạt lại/ })).toBeVisible();
    await menu.getByRole('menuitem', { name: /Kích hoạt lại/ }).click();
    await expect(rowOf(page, 'Phạm D').locator('.badge').nth(1)).toContainText('Hoạt động');
    await expect(toast(page)).toContainText('Đã kích hoạt lại tài khoản');

    const res = await request.post(`${BASE}/api/v1/auth/login`, {
      data: { email: 'member3@acme.vn', mat_khau: process.env.E2E_MEMBER_PASS ?? '' },
    });
    expect(res.ok(), 'đăng nhập lại được bằng mật khẩu cũ').toBeTruthy();
  });

  test('TC-S05-41 — Người vừa kích hoạt lại xuất hiện lại trong dropdown', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    const menu = await menuOf(page, 'Phạm D');
    await menu.getByRole('menuitem', { name: /Kích hoạt lại/ }).click();
    await expect(rowOf(page, 'Phạm D').locator('.badge').nth(1)).toContainText('Hoạt động');

    await page.goto(`${BASE}/dashboard`);
    await btn(page, /Tạo công việc/).click();
    const options = await page.locator('#taskAssignee option').allInnerTexts();
    expect(options.join('|')).toContain('Phạm D');
  });

  test('TC-S05-42 — Team Lead gọi thẳng API kích hoạt lại: 403', async ({ request }) => {
    const adminToken = await apiToken(request, ADMIN);
    const phamDId = await idOf(request, adminToken, 'member3@acme.vn');
    const leadToken = await apiToken(request, LEAD);
    const res = await request.patch(`${BASE}/api/v1/organizations/me/members/${phamDId}`, {
      headers: { Authorization: `Bearer ${leadToken}` },
      data: { trang_thai: 'ACTIVE' },
    });
    expect(res.status()).toBe(403);
    const after = await (await request.get(`${BASE}/api/v1/organizations/me/members?q=member3@acme.vn`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })).json();
    expect(after.data[0].trang_thai).toBe('INACTIVE');
  });

  test.skip('TC-S05-43 — [Manual] Tự vô hiệu hoá mình khi còn admin khác → về /login', async () => {
    /* Manual theo `test.md`: làm hỏng phiên đang chạy giữa chừng nên khó dọn ở CI chung.
       Cần bộ dữ liệu `s05-two-admins` và một worker riêng nếu muốn chuyển sang Auto. */
  });

  test('TC-S05-44 — Vô hiệu hoá người chưa từng đăng nhập: vẫn thành công', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    const menu = await menuOf(page, 'Trần B');
    await menu.getByRole('menuitem', { name: /Vô hiệu hoá/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Vô hiệu hoá' }).click();
    await expect(toast(page)).toContainText('Đã vô hiệu hoá tài khoản');
    await expect(rowOf(page, 'Trần B').locator('.badge').nth(1)).toContainText('Vô hiệu');
  });
});

// ===========================================================================
// F13 — Luật "quản trị viên cuối cùng" (BRule-S05-05)
// ===========================================================================

test.describe('F13 — Không được mất quản trị viên cuối cùng (S05)', () => {
  test('TC-S05-45 — Menu của admin duy nhất: hai mục KHOÁ kèm lý do NGAY TRONG MENU', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`${BASE}/organization`);
    const menu = await menuOf(page, 'Quản Trị');
    await expect(menu.getByRole('menuitem', { name: /Đổi vai trò/ })).toHaveAttribute('aria-disabled', 'true');
    await expect(menu.getByRole('menuitem', { name: /Vô hiệu hoá/ })).toHaveAttribute('aria-disabled', 'true');
    // Lý do phải đọc được — nằm trong cây trợ năng, không bị display:none
    await expect(menu).toContainText('Đây là quản trị viên duy nhất đang hoạt động. Hãy chỉ định một quản trị viên khác trước.');

    let called = false;
    page.on('request', (r) => { if (r.method() === 'PATCH') called = true; });
    await menu.getByRole('menuitem', { name: /Vô hiệu hoá/ }).click({ force: true });
    expect(called, 'bấm vào mục bị khoá không được gọi API').toBe(false);
  });

  test('TC-S05-46 — Hạ vai trò admin duy nhất qua API: 409 kèm thông báo giải thích', async ({ request }) => {
    const token = await apiToken(request, ADMIN);
    const meId = await idOf(request, token, ADMIN.email);
    const res = await request.patch(`${BASE}/api/v1/organizations/me/members/${meId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { vai_tro: 'MEMBER' },
    });
    expect(res.status()).toBe(409);
    expect((await res.json()).message).toContain('Không thể hạ vai trò quản trị viên duy nhất của tổ chức.');
    const after = await (await request.get(`${BASE}/api/v1/organizations/me/members?q=${ADMIN.email}`, {
      headers: { Authorization: `Bearer ${token}` },
    })).json();
    expect(after.data[0].vai_tro).toBe('ORG_ADMIN');
  });

  test('TC-S05-47 — Vô hiệu hoá admin duy nhất qua API: 409, trạng thái không đổi', async ({ request }) => {
    const token = await apiToken(request, ADMIN);
    const meId = await idOf(request, token, ADMIN.email);
    const res = await request.patch(`${BASE}/api/v1/organizations/me/members/${meId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { trang_thai: 'INACTIVE' },
    });
    expect(res.status()).toBe(409);
    expect((await res.json()).message).toContain('Không thể vô hiệu hoá quản trị viên duy nhất của tổ chức.');
    const after = await (await request.get(`${BASE}/api/v1/organizations/me/members?q=${ADMIN.email}`, {
      headers: { Authorization: `Bearer ${token}` },
    })).json();
    expect(after.data[0].trang_thai).toBe('ACTIVE');
  });

  test('TC-S05-48 — Admin thứ hai đang INACTIVE KHÔNG được tính là đang hoạt động', async ({ request }) => {
    await resetOrg(request, 's05-second-admin-inactive');
    const token = await apiToken(request, ADMIN);
    const meId = await idOf(request, token, ADMIN.email);
    const res = await request.patch(`${BASE}/api/v1/organizations/me/members/${meId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { vai_tro: 'MEMBER' },
    });
    expect(res.status(), 'admin INACTIVE không đăng nhập được nên không cứu được tổ chức').toBe(409);
  });

  test.skip('TC-S05-49 — [Manual] Hai admin cùng tự hạ vai trò: đúng một người thành công', async () => {
    /* Manual theo `test.md`: cần hai request gần như đồng thời trên bộ dữ liệu `s05-two-admins`.
       Playwright làm được bằng `Promise.all` hai `request.patch` — nhưng để chứng minh khoá
       giao dịch thật thì cần chạy lặp nhiều vòng, không hợp với CI chung.
       ⚠️ Đây là TC bảo vệ bất biến quan trọng nhất của màn — **phải chạy tay trước mỗi lần phát hành**. */
  });

  test.skip('TC-S05-51 — [Manual] Tải màn ≤ 2s, hai khối hiện dần', async () => {
    /* Manual theo `test.md`: đo hiệu năng cần môi trường mạng chuẩn hoá. */
  });

  test.skip('TC-S05-52 — [Manual] A11y: bàn phím, menu bị khoá đọc được, tương phản', async () => {
    /* Manual theo `test.md`: cần trình đọc màn hình thật + axe DevTools.
       Phần "lý do khoá nằm trong DOM đọc được" đã được phủ ở TC-45. */
  });

  test.skip('TC-S05-53 — [Manual] Quyền bị hạ khi đang mở màn: tự tải lại theo quyền mới', async () => {
    /* Manual theo `test.md`: cần hai phiên song song (admin A và admin B). */
  });
});

/* ---------------------------------------------------------------------------
 * GHI CHÚ CHO `dev-run` / CI
 * 1. Cần endpoint test-only `POST /test/reset-org` với các bộ: `s05-baseline` (12 thành viên),
 *    `s05-25-members`, `s05-second-admin-inactive`, `s05-two-admins` (cho TC-43/49 khi bật).
 * 2. File này **không chạy song song được** trên cùng tổ chức test (đổi vai trò/trạng thái dùng
 *    chung dữ liệu). Cấu hình `workers: 1`, hoặc cấp mỗi worker một tổ chức riêng.
 * 3. TC-S05-49 là bất biến quan trọng nhất của màn nhưng đang Manual — nếu chuyển sang Auto,
 *    phải chạy lặp ≥ 20 vòng mới đủ tin cậy phát hiện lỗi khoá giao dịch.
 * 4. TC-39/41 đụng sang màn S02 (dropdown chọn người thực hiện) — khi selector `#taskAssignee`
 *    đổi ở S02 thì phải sửa cả đây.
 * --------------------------------------------------------------------------- */
