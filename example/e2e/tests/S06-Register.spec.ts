/**
 * E2E — S06 Đăng ký tài khoản & tạo tổ chức (TeamTasks)
 *
 * Nguồn (một chiều): `docs/Screen-spec/Authentication/S06 - Register/test.md`
 *   → sinh từ 22 TC: **15 Auto** (có test) / **7 Manual** (test.skip giữ dấu vết: TC-04, 05, 16, 18, 19, 21, 22).
 * Truy vết: mã `TC-S06-..` trong tiêu đề test → `test.md` → `R-S06-..` / `UC-S06-..` / `GWT-..` → `FR-13`.
 * Chức năng: F12 (Đăng ký tài khoản & tạo tổ chức).
 *
 * CÁCH CHẠY
 *   npx playwright test e2e/tests/S06-Register.spec.ts
 * Biến môi trường bắt buộc:
 *   E2E_BASE_URL       vd https://staging.teamtasks.vn
 *   E2E_EXISTING_EMAIL email ĐÃ tồn tại, dùng cho TC-07 (test.md dùng an.nguyen@cty.vn)
 *   E2E_USER / E2E_PASS  tài khoản ACTIVE để tạo session cho TC-17
 *   E2E_ADMIN_TOKEN    token gọi API test-only để dọn tài khoản vừa đăng ký
 *
 * ⚠️ App CHƯA deploy → selector lấy từ `html-design.html` (mockup): `#email`, `#password`,
 *    `#confirm-password`, `#org-name`, `#toggle-pw`, `#toggle-confirm`, `#strength-text`.
 *    Mọi chỗ `TODO selector` phải đối chiếu lại với app thật.
 * ⚠️ `POST /auth/register` được `srs`/`usecase`/`test` của màn này dùng nhưng **CHƯA có trong
 *    `06-api-spec.md`** — xem ghi chú cuối file.
 */
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const EXISTING_EMAIL = process.env.E2E_EXISTING_EMAIL ?? '';
const USER = process.env.E2E_USER ?? '';
const PASS = process.env.E2E_PASS ?? '';

const VALID_PW = 'Abc12345';
const ORG = 'Công ty ABC';
/** Tên tổ chức đúng 100 ký tự — biên trên hợp lệ (TC-S06-20). */
const ORG_100 = 'A'.repeat(100);

/** Email mới mỗi lần chạy: email phải DUY NHẤT toàn hệ thống (`FR-13`) nên không hardcode được. */
const freshEmail = (tag: string) => `e2e.${tag}.${process.env.E2E_RUN_ID ?? 'local'}@cty.vn`;

// ---------------------------------------------------------------------------
// Helper — TODO selector: đối chiếu lại khi app deploy
// ---------------------------------------------------------------------------
const emailBox = (p: Page) => p.getByLabel('Email');
const pwBox = (p: Page) => p.getByLabel('Mật khẩu', { exact: true });
const confirmBox = (p: Page) => p.getByLabel('Xác nhận mật khẩu');
const orgBox = (p: Page) => p.getByLabel('Tên tổ chức');
const submitBtn = (p: Page) => p.getByRole('button', { name: 'Tạo tài khoản' });
const strengthText = (p: Page) => p.locator('#strength-text');

async function gotoRegister(page: Page) {
  await page.goto(`${BASE}/register`);
  await expect(emailBox(page)).toBeVisible();
}

async function fillForm(
  page: Page,
  o: { email?: string; password?: string; confirm?: string; org?: string } = {},
) {
  if (o.email !== undefined) await emailBox(page).fill(o.email);
  if (o.password !== undefined) await pwBox(page).fill(o.password);
  if (o.confirm !== undefined) await confirmBox(page).fill(o.confirm);
  if (o.org !== undefined) await orgBox(page).fill(o.org);
}

/** Dọn tài khoản e2e vừa tạo — cần endpoint test-only (chưa tồn tại, xem ghi chú cuối file). */
async function cleanupAccount(request: APIRequestContext, email: string) {
  await request.delete(`${BASE}/test/account`, {
    headers: { Authorization: `Bearer ${process.env.E2E_ADMIN_TOKEN ?? ''}` },
    data: { email },
  });
}

/** Theo dõi xem form có gọi API đăng ký không (dùng cho các ca "không gọi API"). */
function watchRegisterCall(page: Page) {
  const state = { called: false };
  page.on('request', (r) => {
    if (r.url().includes('/auth/register')) state.called = true;
  });
  return state;
}

// ---------------------------------------------------------------------------
// F12 — Đăng ký tài khoản & tạo tổ chức
// ---------------------------------------------------------------------------

test.describe('F12 — Đăng ký tài khoản & tạo tổ chức (S06)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoRegister(page);
  });

  test('TC-S06-01 — Đăng ký thành công: về /dashboard, vai trò Org Admin, tổ chức được tạo', async ({ page, request }) => {
    const email = freshEmail('tc01');
    await fillForm(page, { email, password: VALID_PW, confirm: VALID_PW, org: ORG });
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/register') && r.request().method() === 'POST'),
      submitBtn(page).click(),
    ]);
    expect(res.status()).toBe(201);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 3000 }); // ≤3 giây theo test.md
    const body = await res.json();
    expect(body?.user?.vai_tro, 'người đăng ký phải là Org Admin').toBe('ORG_ADMIN'); // TODO: xác nhận tên trường theo 06-api-spec
    expect(body?.to_chuc?.ten ?? body?.organization?.name).toBe(ORG);
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'refresh_token'), 'phải có session hợp lệ').toBeTruthy();
    await cleanupAccount(request, email);
  });

  test('TC-S06-02 — Enter ở trường Tên tổ chức tương đương nhấn nút', async ({ page, request }) => {
    const email = freshEmail('tc02');
    await fillForm(page, { email, password: VALID_PW, confirm: VALID_PW, org: ORG });
    await orgBox(page).press('Enter');
    await expect(page).toHaveURL(/\/dashboard$/);
    await cleanupAccount(request, email);
  });

  test('TC-S06-03 — Email có khoảng trắng đầu/cuối được trim trước khi gửi API', async ({ page, request }) => {
    const email = freshEmail('tc03');
    await fillForm(page, { email: `  ${email}  `, password: VALID_PW, confirm: VALID_PW, org: ORG });
    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/auth/register')),
      submitBtn(page).click(),
    ]);
    expect(JSON.parse(req.postData() ?? '{}').email, 'API phải nhận email đã trim').toBe(email);
    await expect(page).toHaveURL(/\/dashboard$/);
    await cleanupAccount(request, email);
  });

  test.skip('TC-S06-04 — Thứ tự Tab qua 4 trường tới nút [Manual trong test.md]', async () => {
    // test.md đánh Manual: kiểm bằng bàn phím thật.
  });

  test.skip('TC-S06-05 — Dashboard hiện tên tổ chức và vai trò Org Admin [Manual trong test.md]', async () => {
    // test.md đánh Manual: quan sát header/sidebar sau đăng ký.
  });

  test('TC-S06-06 — Email sai định dạng báo lỗi inline, không gọi API', async ({ page }) => {
    const w = watchRegisterCall(page);
    await emailBox(page).fill('khongdungdinh');
    await emailBox(page).press('Tab');
    await expect(page.getByText('Vui lòng nhập địa chỉ email hợp lệ.')).toBeVisible();
    expect(w.called).toBe(false);
  });

  test('TC-S06-07 — Email đã tồn tại: lỗi inline đúng chữ, focus về Email, không tạo mới', async ({ page }) => {
    await fillForm(page, { email: EXISTING_EMAIL, password: VALID_PW, confirm: VALID_PW, org: ORG });
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/register')),
      submitBtn(page).click(),
    ]);
    expect(res.status(), 'email trùng phải bị server từ chối').toBe(409);
    await expect(
      page.getByText('Email đã được sử dụng. Vui lòng dùng địa chỉ khác hoặc đăng nhập.'),
    ).toBeVisible();
    await expect(emailBox(page)).toBeFocused();
    await expect(page).toHaveURL(/\/register$/); // không tạo tài khoản → không điều hướng
  });

  test('TC-S06-08 — Đổi sang email chưa tồn tại thì lỗi biến mất, form xử lý bình thường', async ({ page, request }) => {
    // Dựng lại trạng thái lỗi của TC-07 trước
    await fillForm(page, { email: EXISTING_EMAIL, password: VALID_PW, confirm: VALID_PW, org: ORG });
    await submitBtn(page).click();
    await expect(page.getByText('Email đã được sử dụng. Vui lòng dùng địa chỉ khác hoặc đăng nhập.')).toBeVisible();

    const email = freshEmail('tc08');
    await emailBox(page).fill(email);
    await expect(
      page.getByText('Email đã được sử dụng. Vui lòng dùng địa chỉ khác hoặc đăng nhập.'),
    ).toBeHidden();
    await submitBtn(page).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await cleanupAccount(request, email);
  });

  test('TC-S06-09 — Mật khẩu 4 ký tự: độ mạnh "Yếu", lỗi inline, nút disabled', async ({ page }) => {
    await fillForm(page, { email: freshEmail('tc09'), password: 'Ab1x' });
    await pwBox(page).press('Tab');
    await expect(strengthText(page)).toHaveText('Yếu');
    await expect(
      page.getByText('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái và chữ số.'),
    ).toBeVisible();
    await expect(submitBtn(page)).toBeDisabled();
  });

  test('TC-S06-10 — Mật khẩu chỉ có chữ cái: độ mạnh "Yếu", nút disabled', async ({ page }) => {
    await fillForm(page, { email: freshEmail('tc10'), password: 'abcdefgh' });
    await pwBox(page).press('Tab');
    await expect(strengthText(page)).toHaveText('Yếu');
    await expect(
      page.getByText('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái và chữ số.'),
    ).toBeVisible();
    await expect(submitBtn(page)).toBeDisabled();
  });

  test('TC-S06-11 — Xác nhận mật khẩu không khớp: lỗi inline, nút disabled', async ({ page }) => {
    await fillForm(page, { email: freshEmail('tc11'), password: VALID_PW, confirm: 'Abc12346' });
    await confirmBox(page).press('Tab');
    await expect(page.getByText('Mật khẩu xác nhận không khớp.')).toBeVisible();
    await expect(submitBtn(page)).toBeDisabled();
  });

  test('TC-S06-12 — Sửa xác nhận cho khớp: lỗi biến mất, nút enable lại', async ({ page }) => {
    await fillForm(page, {
      email: freshEmail('tc12'), password: VALID_PW, confirm: 'Abc12346', org: ORG,
    });
    await confirmBox(page).press('Tab');
    await expect(page.getByText('Mật khẩu xác nhận không khớp.')).toBeVisible();

    await confirmBox(page).fill(VALID_PW);
    await confirmBox(page).press('Tab');
    await expect(page.getByText('Mật khẩu xác nhận không khớp.')).toBeHidden();
    await expect(submitBtn(page)).toBeEnabled(); // các trường khác đã hợp lệ
  });

  test('TC-S06-13 — Tên tổ chức rỗng bị chặn, không gọi API', async ({ page }) => {
    const w = watchRegisterCall(page);
    await fillForm(page, {
      email: freshEmail('tc13'), password: VALID_PW, confirm: VALID_PW, org: '',
    });
    await submitBtn(page).click();
    await expect(page.getByText('Tên tổ chức không được để trống.')).toBeVisible();
    expect(w.called).toBe(false);
  });

  test('TC-S06-14 — Email rỗng bị chặn, không gọi API', async ({ page }) => {
    const w = watchRegisterCall(page);
    await fillForm(page, { password: VALID_PW, confirm: VALID_PW, org: ORG });
    await submitBtn(page).click();
    await expect(
      page.getByText(/Vui lòng nhập địa chỉ email hợp lệ\.|Trường này là bắt buộc\./),
    ).toBeVisible();
    expect(w.called).toBe(false);
  });

  test('TC-S06-15 — Mật khẩu rỗng bị chặn, không gọi API', async ({ page }) => {
    const w = watchRegisterCall(page);
    await fillForm(page, { email: freshEmail('tc15'), org: ORG });
    await submitBtn(page).click();
    await expect(
      page.getByText(/Vui lòng nhập mật khẩu\.|Mật khẩu phải có ít nhất 8 ký tự/),
    ).toBeVisible();
    expect(w.called).toBe(false);
  });

  test.skip('TC-S06-16 — Thanh độ mạnh đổi Yếu → Trung bình → Mạnh khi gõ [Manual trong test.md]', async () => {
    // test.md đánh Manual: quan sát thanh đổi màu/độ dài theo từng ký tự.
  });

  test.skip('TC-S06-18 — Mất mạng khi submit [Manual trong test.md]', async () => {
    // test.md đánh Manual. Kỳ vọng: snackbar "Lỗi kết nối. Vui lòng thử lại.", form giữ dữ liệu,
    // nút enable lại sau 500ms.
  });

  test.skip('TC-S06-19 — Hai nút con mắt hoạt động độc lập [Manual trong test.md]', async () => {
    // test.md đánh Manual. Mockup: #toggle-pw và #toggle-confirm.
  });

  test.skip('TC-S06-21 — Xoá sạch mật khẩu thì thanh độ mạnh ẩn [Manual trong test.md]', async () => {
    // test.md đánh Manual.
  });

  test.skip('TC-S06-22 — Paste mật khẩu thì thanh độ mạnh cập nhật ngay [Manual trong test.md]', async () => {
    // test.md đánh Manual.
  });

  test('TC-S06-17 — Đã có session mà vào /register thì bị đẩy về /dashboard, form không render', async ({ page }) => {
    // Tạo session trước bằng màn Đăng nhập
    await page.goto(`${BASE}/login`);
    await page.getByLabel('Email').fill(USER);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(PASS);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto(`${BASE}/register`);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(emailBox(page)).toHaveCount(0); // "form không render"
  });

  test('TC-S06-20 — Tên tổ chức đúng 100 ký tự được chấp nhận (biên trên hợp lệ)', async ({ page, request }) => {
    const email = freshEmail('tc20');
    await fillForm(page, { email, password: VALID_PW, confirm: VALID_PW, org: ORG_100 });
    expect(ORG_100.length).toBe(100);
    await submitBtn(page).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(/tối đa 100 ký tự/)).toHaveCount(0); // không báo lỗi giới hạn
    await cleanupAccount(request, email);
  });
});

/**
 * GHI CHÚ ĐỂ LẠI CHO `dev-run` / QA (không phải việc của tài liệu BA):
 *
 * 1. `POST /auth/register` được `srs.md`, `usecase.md`, `test.md` của màn này dùng (5 chỗ) nhưng
 *    **KHÔNG có trong `06-api-spec.md`**. Mã trạng thái dùng ở đây (201 tạo mới, 409 email trùng)
 *    là **suy luận từ test.md**, chưa được đặc tả chốt → cần bổ sung endpoint vào `06-api-spec.md`.
 * 2. Tên trường trong phản hồi (`user.vai_tro`, `to_chuc.ten`) cũng là suy luận từ `05-data-model.md`.
 * 3. `cleanupAccount()` cần endpoint test-only để xoá tài khoản e2e vừa tạo — chưa tồn tại.
 *    Không có nó thì mỗi lần chạy sẽ để lại rác (email phải duy nhất nên không tái sử dụng được).
 */
