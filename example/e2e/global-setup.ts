/**
 * Chặn sớm: thiếu biến môi trường thì DỪNG ngay với danh sách thiếu, thay vì để 262 test cùng
 * đỏ vì `E2E_USER` rỗng. Một suite đỏ hàng loạt vì cấu hình là suite không ai đọc nữa.
 *
 * Danh sách rút TỪ chính các spec (`grep process.env.E2E_`), không phải bịa — thêm biến mới trong
 * spec thì thêm vào đây, nếu không nó sẽ hỏng lúc chạy chứ không phải lúc khởi động.
 */
const BAT_BUOC = ['E2E_BASE_URL', 'E2E_USER', 'E2E_PASS'];

const TUY_MAN: Record<string, string[]> = {
  'S01 Login': ['E2E_LOCKED_USER', 'E2E_ADMIN_TOKEN'],
  'S02 Dashboard': ['E2E_LEAD', 'E2E_LEAD_PASS', 'E2E_ADMIN', 'E2E_ADMIN_PASS'],
  'S03 TaskDetail': ['E2E_MEMBER', 'E2E_MEMBER_PASS'],
  'S05 Organization': ['E2E_TEMP_USER', 'E2E_TEMP_PASS', 'E2E_BETA_ADMIN', 'E2E_BETA_PASS'],
  'S06 Register': ['E2E_EXISTING_EMAIL', 'E2E_RUN_ID'],
};

export default function globalSetup(): void {
  const thiếu = BAT_BUOC.filter((k) => !process.env[k]);
  if (thiếu.length) {
    throw new Error(
      `Thiếu biến môi trường bắt buộc: ${thiếu.join(', ')}.\n`
      + 'Xem e2e/README.md. KHÔNG hardcode tài khoản vào spec — dữ liệu trong test.md là giá trị demo.',
    );
  }

  // Thiếu biến của một màn thì chỉ CẢNH BÁO: chạy được màn nào hay màn đó còn hơn chặn cả suite.
  for (const [màn, keys] of Object.entries(TUY_MAN)) {
    const t = keys.filter((k) => !process.env[k]);
    if (t.length) console.warn(`⚠️  ${màn}: thiếu ${t.join(', ')} — các test của màn này sẽ đỏ hoặc bị bỏ.`);
  }
}
