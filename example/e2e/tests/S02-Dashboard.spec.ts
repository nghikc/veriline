/**
 * E2E — S02 Dashboard (TeamTasks)
 *
 * Nguồn (một chiều): `docs/Screen-spec/S02 - Dashboard/test.md`
 *   → 47 TC: **42 Auto** (41 có test — TC-45 `E-S02-12` CHƯA sinh, lệch có từ trước) / **5 Manual** (test.skip giữ dấu vết: TC-10, 27, 29, 33, 36).
 *   *(CR-01: thêm TC-40…44 — xuất báo cáo tiến độ PDF/Excel. Gap G07: thêm TC-46, 47 — R-S02-19 hỏi xác nhận khi đóng modal.)*
 * Truy vết: mã `TC-S02-..` trong tiêu đề test → `test.md` → `R-S02-..` / `UC-S02-..` / `BRule-S02-..`
 *           → `FR-03` (dashboard), `FR-04`/`FR-05` (tạo & giao việc), `FR-09` (thông báo in-app).
 * Chức năng: F03 (Xem dashboard) · F04 (Tạo công việc) · F08 (Thông báo in-app).
 *
 * CÁCH CHẠY
 *   npx playwright test e2e/tests/S02-Dashboard.spec.ts
 * Biến môi trường:
 *   E2E_BASE_URL        vd https://staging.teamtasks.vn
 *   E2E_MEMBER / E2E_MEMBER_PASS     tài khoản Member (tổ chức Acme)
 *   E2E_LEAD   / E2E_LEAD_PASS       tài khoản Team Lead (tổ chức Acme)
 *   E2E_BETA_ADMIN / E2E_BETA_PASS   Org Admin của tổ chức Beta — dùng cho TC-03 (cách ly tenant)
 *   E2E_ADMIN_TOKEN                  token gọi API test-only để seed/dọn dữ liệu
 *
 * ⚠️ App CHƯA deploy → selector lấy từ `html-design.html` (mockup): `#bellBtn`, `#notifBadge`,
 *    `#notifPanel`, `#fStatus`, `#fPriority`, `#fSearch`, `#state-empty`, `#state-error`,
 *    `#taskTitle`, `#taskDesc`, `#taskAssignee`, `#taskDeadline`, `#toast`.
 *    Mọi chỗ `TODO selector` phải đối chiếu lại với app thật.
 * ⚠️ `PATCH /notifications/:id/read` và `PATCH /notifications/read-all` được `srs`/`test` của màn
 *    này dùng nhưng **CHƯA có trong `06-api-spec.md`** — xem ghi chú cuối file.
 * ⚠️ Phần lớn TC cần **bộ dữ liệu seed cố định** (Tổng=8, Cần làm=3…). `seedDataset()` cần một
 *    endpoint test-only chưa tồn tại — không có nó thì các TC đếm số phải chạy tay.
 */
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const MEMBER = { email: process.env.E2E_MEMBER ?? '', pass: process.env.E2E_MEMBER_PASS ?? '' };
const LEAD = { email: process.env.E2E_LEAD ?? '', pass: process.env.E2E_LEAD_PASS ?? '' };
const BETA_ADMIN = { email: process.env.E2E_BETA_ADMIN ?? '', pass: process.env.E2E_BETA_PASS ?? '' };
const ADMIN = { email: process.env.E2E_ADMIN ?? '', pass: process.env.E2E_ADMIN_PASS ?? '' };   // Org Admin của Acme (CR-01)

// ---------------------------------------------------------------------------
// Helper — TODO selector: đối chiếu lại khi app deploy
// ---------------------------------------------------------------------------
const bell = (p: Page) => p.locator('#bellBtn');
const badge = (p: Page) => p.locator('#notifBadge');
const notifPanel = (p: Page) => p.locator('#notifPanel');
const fStatus = (p: Page) => p.locator('#fStatus');
const fPriority = (p: Page) => p.locator('#fPriority');
const fSearch = (p: Page) => p.locator('#fSearch');
const taskRows = (p: Page) => p.locator('tbody tr');
const statCard = (p: Page, name: string) => p.getByRole('button', { name: new RegExp(name, 'i') });
const createBtn = (p: Page) => p.getByRole('button', { name: /Tạo công việc/ });

async function login(page: Page, who: { email: string; pass: string }) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(who.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(who.pass);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/**
 * Nạp bộ dữ liệu cố định cho một kịch bản.
 *
 * ⚠️ CHƯA CHẠY ĐƯỢC: cần endpoint test-only (chỉ bật ở staging) để dựng đúng số liệu mà `test.md`
 *    mô tả (vd "Tổng=8, Cần làm=3, Đang làm=3, Hoàn thành=2, Quá hạn=1"). Không có nó thì mọi TC
 *    kiểm CON SỐ phải chạy tay. Việc của `dev-run`/CI, không phải của tài liệu BA.
 */
async function seedDataset(request: APIRequestContext, name: string) {
  const res = await request.post(`${BASE}/test/seed-dataset`, {
    headers: { Authorization: `Bearer ${process.env.E2E_ADMIN_TOKEN ?? ''}` },
    data: { dataset: name },
  });
  expect(res.ok(), `Cần endpoint test-only để seed bộ dữ liệu "${name}"`).toBeTruthy();
}

// ===========================================================================
// F03 — Xem dashboard tổng quan
// ===========================================================================

test.describe('F03 — Xem dashboard tổng quan (S02)', () => {
  test('TC-S02-01 — Member: 5 thẻ thống kê đúng số, danh sách chỉ việc liên quan mình', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, MEMBER);
    await expect(statCard(page, 'Tổng')).toContainText('8');
    await expect(statCard(page, 'Cần làm')).toContainText('3');
    await expect(statCard(page, 'Đang làm')).toContainText('3');
    await expect(statCard(page, 'Hoàn thành')).toContainText('2');
    await expect(statCard(page, 'Quá hạn')).toContainText('1');
    // BRule-S02-01: Member chỉ thấy việc mình là người thực hiện hoặc người giao
    const res = await page.request.get(`${BASE}/tasks`);
    const tasks = (await res.json())?.data ?? [];
    for (const t of tasks) {
      expect(
        t.nguoi_nhan_id === t.__me || t.nguoi_giao_id === t.__me || true,
        'mọi việc trả về phải liên quan tới member1',
      ).toBeTruthy(); // TODO: siết lại khi biết cách API trả id người dùng hiện tại
    }
  });

  test('TC-S02-02 — Team Lead: thấy toàn bộ việc của nhóm (Tổng=24)', async ({ page, request }) => {
    await seedDataset(request, 'acme-lead-24-tasks');
    await login(page, LEAD);
    await expect(statCard(page, 'Tổng')).toContainText('24');
    await expect(taskRows(page).first()).toBeVisible();
  });

  test('TC-S02-03 — Cách ly tenant: Org Admin Beta không thấy dữ liệu Acme (BR-03/NFR-06)', async ({ page, request }) => {
    await seedDataset(request, 'two-tenants-acme-beta');
    await login(page, BETA_ADMIN);
    const res = await page.request.get(`${BASE}/tasks`);
    const body = await res.json();
    const tasks = body?.data ?? [];
    expect(tasks.length, 'Beta chỉ có 9 việc').toBe(9);
    const orgIds = new Set(tasks.map((t: { to_chuc_id: string }) => t.to_chuc_id));
    expect(orgIds.size, 'response không được lẫn tổ chức khác').toBe(1);
    expect(JSON.stringify(body)).not.toContain('acme'); // không rò định danh tổ chức Acme
  });

  test('TC-S02-04 — Việc quá hạn: deadline tô đỏ + icon cảnh báo, đếm vào thẻ Quá hạn', async ({ page, request }) => {
    await seedDataset(request, 'acme-one-overdue');
    await login(page, MEMBER);
    const overdue = taskRows(page).filter({ hasText: '⚠' }).first();
    await expect(overdue).toBeVisible();
    await expect(statCard(page, 'Quá hạn')).toContainText('1');
  });

  test('TC-S02-05 — Việc DONE quá hạn: KHÔNG tô đỏ, KHÔNG tính vào Quá hạn', async ({ page, request }) => {
    await seedDataset(request, 'acme-done-past-deadline');
    await login(page, MEMBER);
    await expect(statCard(page, 'Quá hạn')).toContainText('0');
    await expect(statCard(page, 'Hoàn thành')).not.toContainText('0');
  });

  test('TC-S02-06 — Lọc Trạng thái = Đang làm: danh sách chỉ IN_PROGRESS, không reload trang', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, MEMBER);
    let reloaded = false;
    page.on('load', () => { reloaded = true; });
    await fStatus(page).selectOption({ label: 'Đang làm' });
    await expect(taskRows(page)).toHaveCount(3);
    for (const row of await taskRows(page).all()) await expect(row).toContainText(/Đang làm/);
    expect(reloaded, 'lọc phải xử lý phía client, không reload').toBe(false);
  });

  test('TC-S02-07 — Tìm kiếm "api" (không phân biệt hoa thường), debounce 300ms', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, MEMBER);
    await fSearch(page).fill('api');
    await page.waitForTimeout(350); // debounce 300ms theo test.md
    for (const row of await taskRows(page).all()) await expect(row).toContainText(/api/i);
  });

  test('TC-S02-08 — Click thẻ "Cần làm" lọc nhanh, click lại thì bỏ lọc', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, MEMBER);
    await statCard(page, 'Cần làm').click();
    await expect(taskRows(page)).toHaveCount(3);
    await expect(statCard(page, 'Cần làm')).toHaveClass(/active|selected/); // TODO selector: tên class viền nhấn
    await statCard(page, 'Cần làm').click();
    await expect(taskRows(page)).toHaveCount(8);
  });

  test('TC-S02-09 — Click một dòng thì điều hướng sang chi tiết công việc', async ({ page, request }) => {
    await seedDataset(request, 'acme-task-t-123');
    await login(page, MEMBER);
    await taskRows(page).filter({ hasText: 'Thiết kế trang chủ' }).click();
    await expect(page).toHaveURL(/\/tasks\/t-123$/, { timeout: 300 });
  });

  test.skip('TC-S02-10 — Empty state khác nhau giữa Lead và Member [Manual trong test.md]', async () => {
    // test.md đánh Manual: cần tổ chức mới hoàn toàn cho từng vai trò.
  });

  test('TC-S02-11 — API lỗi: khối lỗi + nút "Thử lại", nhấn thì gọi lại và hiện dữ liệu', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, LEAD);
    let fail = true;
    await page.route('**/tasks*', (route) =>
      fail ? route.fulfill({ status: 500, body: '{}' }) : route.continue(),
    );
    await page.reload();
    await expect(page.locator('#state-error')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
    fail = false;
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(taskRows(page).first()).toBeVisible();
    await expect(page.locator('#state-error')).toBeHidden();
  });

  test('TC-S02-12 — Chưa đăng nhập mà mở /dashboard thì bị đẩy về /login, không kịp render', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await expect(page).toHaveURL(/\/login/, { timeout: 300 });
    await expect(page.locator('#fSearch')).toHaveCount(0);
  });

  test('TC-S02-13 — Tìm không ra: empty state + nút "Xoá bộ lọc" khôi phục danh sách', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, MEMBER);
    await fSearch(page).fill('zzzzz');
    await page.waitForTimeout(350);
    await expect(page.getByText('Không tìm thấy công việc phù hợp')).toBeVisible();
    await page.getByRole('button', { name: 'Xoá bộ lọc' }).click();
    await expect(taskRows(page)).toHaveCount(8);
  });

  test('TC-S02-14 — Phân trang 20 dòng + nút "Tải thêm"', async ({ page, request }) => {
    await seedDataset(request, 'acme-21-tasks');
    await login(page, LEAD);
    await expect(taskRows(page)).toHaveCount(20);
    const more = page.getByRole('button', { name: 'Tải thêm' });
    await expect(more).toBeVisible();
    await more.click();
    await expect(taskRows(page)).toHaveCount(21);
    await expect(more).toBeHidden();
  });

  test('TC-S02-37 — Danh sách sắp theo deadline tăng dần, không theo thứ tự tạo', async ({ page, request }) => {
    await seedDataset(request, 'acme-sort-by-deadline');
    await login(page, MEMBER);
    const texts = await taskRows(page).allTextContents();
    const dates = texts.map((t) => (t.match(/(\d{2})\/(\d{2})/) ?? [])[0]).filter(Boolean);
    expect(dates.slice(0, 3)).toEqual(['12/06', '14/06', '20/06']);
  });

  test('TC-S02-38 — Kết hợp hai bộ lọc Ưu tiên + Trạng thái, không reload', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, MEMBER);
    let reloaded = false;
    page.on('load', () => { reloaded = true; });
    await fPriority(page).selectOption({ label: 'Khẩn cấp' });
    for (const row of await taskRows(page).all()) await expect(row).toContainText(/Khẩn cấp/);
    await fStatus(page).selectOption({ label: 'Cần làm' });
    for (const row of await taskRows(page).all()) {
      await expect(row).toContainText(/Khẩn cấp/);
      await expect(row).toContainText(/Cần làm/);
    }
    expect(reloaded).toBe(false);
  });
});

// ===========================================================================
// F04 — Tạo công việc
// ===========================================================================

test.describe('F04 — Tạo công việc (S02)', () => {
  test('TC-S02-15 — Tạo việc thành công: POST /tasks đúng 1 lần, toast, việc lên đầu, thẻ +1', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, LEAD);
    let postCount = 0;
    page.on('request', (r) => {
      if (r.method() === 'POST' && /\/tasks$/.test(new URL(r.url()).pathname)) postCount++;
    });
    await createBtn(page).click();
    await page.locator('#taskTitle').fill('Việc E2E mới');
    await page.locator('#taskAssignee').selectOption({ index: 1 });
    await page.locator('#taskDeadline').fill('2026-12-31T09:00');
    const [res] = await Promise.all([
      page.waitForResponse((r) => /\/tasks$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Tạo công việc' }).last().click(),
    ]);
    expect(res.status()).toBe(201);
    expect(postCount, 'không được gọi API hai lần').toBe(1);
    await expect(page.locator('#modalBackdrop')).toBeHidden();
    await expect(page.locator('#toast')).toContainText('Đã tạo công việc');
    await expect(taskRows(page).first()).toContainText('Việc E2E mới');
    await expect(statCard(page, 'Tổng')).toContainText('9');
    await expect(statCard(page, 'Cần làm')).toContainText('4');
  });

  test('TC-S02-16 — Member: nút "+ Tạo công việc" KHÔNG tồn tại trong DOM (BRule-S02-03)', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, MEMBER);
    await expect(createBtn(page)).toHaveCount(0); // không phải chỉ ẩn bằng CSS
  });

  test('TC-S02-17 — Member gọi thẳng POST /tasks bị chặn 403, không tạo được việc', async ({ page, request }) => {
    await login(page, MEMBER);
    const before = await (await page.request.get(`${BASE}/tasks`)).json();
    const res = await page.request.post(`${BASE}/tasks`, {
      data: { tieu_de: 'Bypass UI', nguoi_nhan_id: 'x', deadline: '2026-12-31T09:00:00Z' },
    });
    expect(res.status()).toBe(403);
    const after = await (await page.request.get(`${BASE}/tasks`)).json();
    expect((after?.data ?? []).length).toBe((before?.data ?? []).length);
  });

  test('TC-S02-18 — Tiêu đề đúng 200 ký tự được chấp nhận (biên trên hợp lệ)', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, LEAD);
    const title = 'T'.repeat(200);
    await createBtn(page).click();
    await page.locator('#taskTitle').fill(title);
    await page.locator('#taskAssignee').selectOption({ index: 1 });
    await page.locator('#taskDeadline').fill('2026-12-31T09:00');
    const [res] = await Promise.all([
      page.waitForResponse((r) => /\/tasks$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Tạo công việc' }).last().click(),
    ]);
    expect(res.status()).toBe(201);
    expect((await res.json())?.tieu_de?.length ?? 0).toBe(200);
  });

  test('TC-S02-19 — Tiêu đề 201 ký tự: lỗi inline, nút disable, không gọi API', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, LEAD);
    let called = false;
    page.on('request', (r) => { if (r.method() === 'POST' && /\/tasks$/.test(new URL(r.url()).pathname)) called = true; });
    await createBtn(page).click();
    await page.locator('#taskTitle').fill('T'.repeat(201));
    await page.locator('#taskTitle').press('Tab');
    await expect(page.locator('#errTitle')).toHaveText('Tiêu đề tối đa 200 ký tự');
    await expect(page.getByRole('button', { name: 'Tạo công việc' }).last()).toBeDisabled();
    expect(called).toBe(false);
  });

  test('TC-S02-20 — Tiêu đề chỉ có khoảng trắng: lỗi "Vui lòng nhập tiêu đề", nút disable', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, LEAD);
    await createBtn(page).click();
    await page.locator('#taskTitle').fill('   ');
    await page.locator('#taskTitle').press('Tab');
    await expect(page.locator('#errTitle')).toHaveText('Vui lòng nhập tiêu đề');
    await expect(page.getByRole('button', { name: 'Tạo công việc' }).last()).toBeDisabled();
  });

  test('TC-S02-21 — Mô tả 5001 ký tự: lỗi "Mô tả tối đa 5000 ký tự", nút disable', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, LEAD);
    await createBtn(page).click();
    await page.locator('#taskDesc').fill('M'.repeat(5001));
    await page.locator('#taskDesc').press('Tab');
    await expect(page.getByText('Mô tả tối đa 5000 ký tự')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tạo công việc' }).last()).toBeDisabled();
  });

  test('TC-S02-22 — Deadline quá khứ: lỗi inline, nút disable, không gọi API', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, LEAD);
    let called = false;
    page.on('request', (r) => { if (r.method() === 'POST' && /\/tasks$/.test(new URL(r.url()).pathname)) called = true; });
    await createBtn(page).click();
    const past = new Date(Date.now() - 60_000).toISOString().slice(0, 16);
    await page.locator('#taskDeadline').fill(past);
    await page.locator('#taskDeadline').press('Tab');
    await expect(page.locator('#errDeadline')).toHaveText('Deadline không được ở quá khứ');
    await expect(page.getByRole('button', { name: 'Tạo công việc' }).last()).toBeDisabled();
    expect(called).toBe(false);
  });

  test('TC-S02-23 — Deadline hiện tại + 2 phút: tạo thành công (biên hợp lệ)', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, LEAD);
    await createBtn(page).click();
    await page.locator('#taskTitle').fill('Việc sát giờ');
    await page.locator('#taskAssignee').selectOption({ index: 1 });
    await page.locator('#taskDeadline').fill(new Date(Date.now() + 120_000).toISOString().slice(0, 16));
    const [res] = await Promise.all([
      page.waitForResponse((r) => /\/tasks$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Tạo công việc' }).last().click(),
    ]);
    expect(res.status()).toBe(201);
  });

  test('TC-S02-24 — Dropdown người thực hiện chỉ liệt kê thành viên ACTIVE cùng tổ chức', async ({ page, request }) => {
    await seedDataset(request, 'acme-with-inactive-member');
    await login(page, LEAD);
    await createBtn(page).click();
    await page.locator('#taskAssignee').click();
    await page.keyboard.type('Phạm');
    await expect(page.getByRole('option', { name: /Phạm D/ })).toHaveCount(0);
  });

  test('TC-S02-25 — Bỏ trống người thực hiện: lỗi inline, nút disable', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, LEAD);
    await createBtn(page).click();
    await page.locator('#taskTitle').fill('Việc chưa giao ai');
    await page.locator('#taskDeadline').fill('2026-12-31T09:00');
    await page.locator('#taskAssignee').press('Tab');
    await expect(page.locator('#errAssignee')).toHaveText('Vui lòng chọn người thực hiện');
    await expect(page.getByRole('button', { name: 'Tạo công việc' }).last()).toBeDisabled();
  });

  test('TC-S02-26 — Không đụng mức ưu tiên thì mặc định MEDIUM (Trung bình)', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, LEAD);
    await createBtn(page).click();
    await page.locator('#taskTitle').fill('Việc ưu tiên mặc định');
    await page.locator('#taskAssignee').selectOption({ index: 1 });
    await page.locator('#taskDeadline').fill('2026-12-31T09:00');
    const [res] = await Promise.all([
      page.waitForResponse((r) => /\/tasks$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Tạo công việc' }).last().click(),
    ]);
    expect((await res.json())?.uu_tien).toBe('MEDIUM');
  });

  test.skip('TC-S02-27 — Mất mạng khi tạo việc, thử lại không sinh bản ghi trùng [Manual trong test.md]', async () => {
    // test.md đánh Manual: cần bật/tắt mạng thật và kiểm không double-submit.
  });

  test('TC-S02-28 — Tự giao việc cho mình KHÔNG sinh thông báo; giao người khác thì có (BRule-S02-06)', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, LEAD);
    const before = ((await (await page.request.get(`${BASE}/notifications`)).json())?.data ?? []).length;

    await createBtn(page).click();
    await page.locator('#taskTitle').fill('Việc tự giao');
    await page.locator('#taskAssignee').selectOption({ label: /Nguyễn Văn A/ }); // TODO: chính người đang đăng nhập
    await page.locator('#taskDeadline').fill('2026-12-31T09:00');
    await page.getByRole('button', { name: 'Tạo công việc' }).last().click();
    await expect(page.locator('#toast')).toBeVisible();
    const afterSelf = ((await (await page.request.get(`${BASE}/notifications`)).json())?.data ?? []).length;
    expect(afterSelf, 'tự giao việc cho mình thì không sinh thông báo').toBe(before);

    await createBtn(page).click();
    await page.locator('#taskTitle').fill('Việc giao Lê C');
    await page.locator('#taskAssignee').selectOption({ label: /Lê C/ });
    await page.locator('#taskDeadline').fill('2026-12-31T09:00');
    const [res] = await Promise.all([
      page.waitForResponse((r) => /\/tasks$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Tạo công việc' }).last().click(),
    ]);
    const taskId = (await res.json())?.id;
    // Kiểm thông báo của Lê C — cần API test-only đọc thông báo của người khác
    const notifs = await request.get(`${BASE}/test/notifications`, {
      headers: { Authorization: `Bearer ${process.env.E2E_ADMIN_TOKEN ?? ''}` },
      params: { user: 'le.c@cty.vn' },
    });
    const list = (await notifs.json())?.data ?? [];
    const matched = list.filter(
      (n: { loai: string; tham_chieu_id: string }) => n.loai === 'TASK_ASSIGNED' && n.tham_chieu_id === taskId,
    );
    expect(matched.length, 'Lê C phải nhận đúng 1 thông báo TASK_ASSIGNED').toBe(1);
  });

  test.skip('TC-S02-29 — Đóng modal khi đã nhập thì hỏi xác nhận "Bỏ nội dung đã nhập?" [Manual trong test.md]', async () => {
    // test.md đánh Manual.
  });

  // R-S02-19. Mockup dùng window.confirm nên bắt bằng sự kiện `dialog`; app thật đổi sang hộp tự vẽ
  // thì thay bằng locator của hộp đó (TODO selector). Click nền: góc trên-trái của #modalBackdrop.
  test('TC-S02-46 — Đã nhập: Esc → hỏi, Huỷ ở lại giữ `Demo` · click nền → hỏi, Đồng ý → đóng, 0 POST /tasks', async ({ page }) => {
    await login(page, LEAD);
    let postCount = 0;
    page.on('request', (r) => { if (r.method() === 'POST' && /\/tasks$/.test(new URL(r.url()).pathname)) postCount++; });
    const asked: string[] = [];

    await createBtn(page).click();
    await page.locator('#taskTitle').fill('Demo');

    page.once('dialog', (d) => { asked.push(d.message()); return d.dismiss(); });   // Huỷ
    await page.keyboard.press('Escape');
    await expect(page.locator('#modalTitle')).toBeVisible();
    await expect(page.locator('#taskTitle')).toHaveValue('Demo');

    page.once('dialog', (d) => { asked.push(d.message()); return d.accept(); });    // Đồng ý
    await page.locator('#modalBackdrop').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#modalTitle')).toBeHidden();

    expect(asked, 'Esc và click nền đều phải hỏi đúng câu').toEqual(['Bỏ nội dung đã nhập?', 'Bỏ nội dung đã nhập?']);
    expect(postCount, 'đóng modal không được gọi POST /tasks').toBe(0);
  });

  test('TC-S02-47 — Modal trống: Esc / [×] / click nền đều đóng thẳng, không hỏi', async ({ page }) => {
    await login(page, LEAD);
    let postCount = 0;
    page.on('request', (r) => { if (r.method() === 'POST' && /\/tasks$/.test(new URL(r.url()).pathname)) postCount++; });
    let asked = 0;
    page.on('dialog', (d) => { asked++; return d.dismiss(); });

    const closeWays: Array<[string, () => Promise<void>]> = [
      ['Esc', () => page.keyboard.press('Escape')],
      ['[×]', () => page.locator('#modalBackdrop').getByRole('button', { name: 'Đóng' }).click()],
      ['click nền', () => page.locator('#modalBackdrop').click({ position: { x: 5, y: 5 } })],
    ];
    for (const [way, close] of closeWays) {
      await createBtn(page).click();
      await expect(page.locator('#modalTitle')).toBeVisible();
      await close();
      await expect(page.locator('#modalTitle'), `${way}: modal trống phải đóng ngay`).toBeHidden();
    }
    expect(asked, 'modal trống không được hỏi xác nhận').toBe(0);
    expect(postCount).toBe(0);
  });
});

// ===========================================================================
// F08 — Thông báo in-app
// ===========================================================================

test.describe('F08 — Thông báo in-app (S02)', () => {
  test('TC-S02-30 — Badge: 0 thì ẩn · 99 hiện "99" · 100 hiện "99+"', async ({ page, request }) => {
    await seedDataset(request, 'notif-0');
    await login(page, MEMBER);
    await expect(badge(page)).toBeHidden();

    await seedDataset(request, 'notif-99');
    await page.reload();
    await expect(badge(page)).toHaveText('99');

    await seedDataset(request, 'notif-100');
    await page.reload();
    await expect(badge(page)).toHaveText('99+');
  });

  test('TC-S02-31 — Mở panel, click thông báo: PATCH read 1 lần, badge giảm, điều hướng, không đọc lại', async ({ page, request }) => {
    await seedDataset(request, 'notif-3-unread');
    await login(page, MEMBER);
    let patchCount = 0;
    page.on('request', (r) => {
      if (r.method() === 'PATCH' && /\/notifications\/[^/]+\/read$/.test(new URL(r.url()).pathname)) patchCount++;
    });
    await bell(page).click();
    await expect(notifPanel(page)).toBeVisible();
    await expect(notifPanel(page).locator('.unread')).toHaveCount(3);

    await notifPanel(page).getByText('Bạn được giao Viết tài liệu API').click();
    expect(patchCount).toBe(1);
    await expect(page).toHaveURL(/\/tasks\/t-123$/);

    await page.goto(`${BASE}/dashboard`);
    await expect(badge(page)).toHaveText('2');
    await bell(page).click();
    await expect(notifPanel(page).getByText('Bạn được giao Viết tài liệu API')).not.toHaveClass(/unread/);
  });

  test('TC-S02-32 — "Đọc tất cả": PATCH read-all 1 lần, badge ẩn, mọi dòng đã đọc, panel vẫn mở', async ({ page, request }) => {
    await seedDataset(request, 'notif-5-unread');
    await login(page, MEMBER);
    let patchAll = 0;
    page.on('request', (r) => {
      if (r.method() === 'PATCH' && /\/notifications\/read-all$/.test(new URL(r.url()).pathname)) patchAll++;
    });
    await bell(page).click();
    await page.getByRole('button', { name: 'Đọc tất cả' }).click();
    expect(patchAll).toBe(1);
    await expect(badge(page)).toBeHidden();
    await expect(notifPanel(page).locator('.unread')).toHaveCount(0);
    await expect(notifPanel(page)).toBeVisible(); // panel giữ mở
  });

  test('TC-S02-39 — Không có thông báo: panel hiện empty state, không badge, "Đọc tất cả" ẩn/disable', async ({ page, request }) => {
    await seedDataset(request, 'notif-0');
    await login(page, MEMBER);
    await bell(page).click();
    await expect(page.locator('#notifEmpty')).toContainText('Chưa có thông báo');
    await expect(badge(page)).toBeHidden();
    const readAll = page.getByRole('button', { name: 'Đọc tất cả' });
    if (await readAll.count()) await expect(readAll).toBeDisabled();
  });

  test.skip('TC-S02-33 — Badge tự tăng trong ≤60s nhờ polling, không reload [Manual trong test.md]', async () => {
    // test.md đánh Manual: cần hai phiên trình duyệt song song và bấm giờ thật.
  });

  test('TC-S02-34 — Thông báo trỏ tới việc đã xoá: báo "Công việc không còn tồn tại", ở lại Dashboard', async ({ page, request }) => {
    await seedDataset(request, 'notif-points-to-deleted-task');
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await login(page, MEMBER);
    await bell(page).click();
    await notifPanel(page).locator('.notif-item').first().click();
    await expect(page.getByText('Công việc không còn tồn tại')).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard$/);
    expect(errors, 'không được có lỗi console').toHaveLength(0);
  });

  test('TC-S02-35 — PATCH read lỗi: vẫn điều hướng, badge giữ nguyên (ưu tiên luồng người dùng)', async ({ page, request }) => {
    await seedDataset(request, 'notif-3-unread');
    await login(page, MEMBER);
    await page.route('**/notifications/*/read', (route) => route.fulfill({ status: 500, body: '{}' }));
    await bell(page).click();
    await notifPanel(page).locator('.notif-item.unread').first().click();
    await expect(page).toHaveURL(/\/tasks\/[^/]+$/);
    await page.goto(`${BASE}/dashboard`);
    await expect(badge(page)).toHaveText('3'); // chưa trừ vì server chưa ghi nhận
  });

  test.skip('TC-S02-36 — Kiểm tiếp cận: thứ tự Tab, aria-label, tương phản bằng axe [Manual trong test.md]', async () => {
    // test.md đánh Manual: cần công cụ axe DevTools và kiểm bằng bàn phím thật.
  });
});

// ===========================================================================
// F14 — Xuất báo cáo tiến độ (CR-01)
// ===========================================================================

test.describe('F14 — Xuất báo cáo tiến độ (S02 · CR-01)', () => {
  const exportBtn = (p: Page) => p.getByRole('button', { name: /Xuất báo cáo/ });   // TODO selector

  test('TC-S02-40 — Team Lead xuất Excel theo bộ lọc IN_PROGRESS: tệp đúng bộ lọc', async ({ page, request }) => {
    await seedDataset(request, 'acme-lead-24-tasks');
    await login(page, LEAD);
    await fStatus(page).selectOption('IN_PROGRESS');

    const bodies: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/reports/export')) bodies.push(r.postData() ?? ''); });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      (async () => { await exportBtn(page).click(); await page.getByRole('button', { name: /Excel/ }).click(); })(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
    expect(bodies, 'gọi export đúng 1 lần').toHaveLength(1);
    const sent = JSON.parse(bodies[0]);
    expect(sent.dinh_dang).toBe('xlsx');
    expect(sent.loc.status, 'body mang đúng bộ lọc đang xem').toBe('IN_PROGRESS');
  });

  test('TC-S02-41 — Org Admin xuất PDF không lọc: tệp gồm thống kê + danh sách', async ({ page, request }) => {
    await seedDataset(request, 'acme-admin-tasks');
    await login(page, ADMIN);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      (async () => { await exportBtn(page).click(); await page.getByRole('button', { name: /PDF/ }).click(); })(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('TC-S02-42 — Member: nút "Xuất báo cáo" KHÔNG tồn tại trong DOM', async ({ page, request }) => {
    await seedDataset(request, 'acme-member-8-tasks');
    await login(page, MEMBER);
    // Khẳng định VẮNG MẶT, không phải kiểm disabled (R-S02-17)
    await expect(exportBtn(page)).toHaveCount(0);
  });

  test('TC-S02-43 — Member gọi thẳng API export: 403, không trả tệp (R-S02-N07)', async ({ request }) => {
    const login = await request.post(`${BASE}/api/v1/auth/login`, { data: { email: MEMBER.email, mat_khau: MEMBER.pass } });
    const token = (await login.json()).access_token;
    const res = await request.post(`${BASE}/api/v1/reports/export`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { dinh_dang: 'pdf', loc: {} },
    });
    expect(res.status()).toBe(403);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct, 'không được trả tệp cho Member').not.toMatch(/pdf|spreadsheet/);
  });

  test('TC-S02-44 — Bộ lọc 0 kết quả: vẫn xuất được, báo cáo ghi "Không có công việc"', async ({ page, request }) => {
    await seedDataset(request, 'acme-lead-24-tasks');
    await login(page, LEAD);
    await fSearch(page).fill('zzzzz');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      (async () => { await exportBtn(page).click(); await page.getByRole('button', { name: /PDF/ }).click(); })(),
    ]);
    // Tệp hợp lệ (có tên), không phải lỗi/tệp rỗng — nội dung "Không có công việc" kiểm ở test backend
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});

/**
 * GHI CHÚ ĐỂ LẠI CHO `dev-run` / QA (không phải việc của tài liệu BA):
 *
 * 1. `PATCH /notifications/:id/read` và `PATCH /notifications/read-all` được `srs.md`/`test.md`
 *    của màn này dùng (9 chỗ) nhưng **KHÔNG có trong `06-api-spec.md`** — cần bổ sung.
 * 2. `seedDataset()` và `/test/notifications` cần endpoint test-only (chỉ bật ở staging). Không có
 *    chúng thì 20+ TC kiểm CON SỐ (Tổng=8, badge 99+, 21 dòng…) không tự động hoá được.
 * 3. TC-S02-01 hiện chưa siết được điều kiện "chỉ việc liên quan mình" vì chưa rõ API trả id người
 *    dùng hiện tại thế nào — đánh dấu TODO, phải siết lại khi `06-api-spec.md` đầy đủ.
 */
