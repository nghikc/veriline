'use strict';
/*
 * ba-toolkit/e2epath.js — phân giải đường dẫn script E2E của một màn. Module, KHÔNG phải CLI.
 *
 * VÌ SAO: `e2e.spec.ts` là **code chạy được**, không phải tài liệu. Trước 31/08/2026 nó nằm
 * trong chính folder màn (`docs/Screen-spec/<Màn>/e2e.spec.ts`) cho gần bảng TC. Truy vết thì
 * tốt, vận hành thì vướng ba chỗ có thật:
 *   1. `docs/` không có `package.json`/`tsconfig`, nên spec KHÔNG chạy được tại chỗ — Playwright
 *      phải trỏ ngược vào cây tài liệu, một cấu hình không ai quen và không ai nhớ.
 *   2. Cây tài liệu lẫn code: `ba-portal` phải né file `.ts`, người xem portal thấy `.ts` giữa `.md`.
 *   3. QA sửa selector phải commit vào `docs/` — trộn lịch sử tài liệu với lịch sử code.
 * Từ 31/08/2026 vị trí chuẩn là `e2e/tests/<Mã>-<Tên>.spec.ts` ở **gốc dự án** (ngang `docs/`),
 * tức "cùng repo, khác package" — giữ được thay đổi nguyên tử với code, mà build thì tách.
 *
 * TRUY VẾT KHÔNG MẤT GÌ: nó vốn dựa vào mã `TC-S..` trong tên test, không dựa vào vị trí file.
 *
 * TƯƠNG THÍCH NGƯỢC LÀ BẮT BUỘC: dự án cài trước mốc trên vẫn để spec trong folder màn, và
 * người dùng có quyền không di chuyển. Mọi script phải hỏi qua module này, không hardcode.
 * `writePathFor` cố ý ghi ĐÚNG CHỖ CŨ khi file đã tồn tại ở đó — nâng cấp toolkit không được
 * lặng lẽ dời file của ai (cùng luật với `docpath.writePathFor`).
 */
const fs = require('fs');
const path = require('path');

/** Thư mục e2e ở gốc dự án, theo thứ tự ưu tiên khi TÌM. Đổi ở đúng một chỗ này. */
const THU_MUC_E2E = [
  path.join('e2e', 'tests'),
  path.join('packages', 'e2e', 'tests'),
  path.join('tests', 'e2e'),
];

/** Tên file spec chuẩn của một màn: `S01-Login.spec.ts` (không khoảng trắng). */
function specFileName(code, name) {
  return `${code}-${String(name).replace(/\s+/g, '')}.spec.ts`;
}

/** Gốc dự án suy từ docsDir: `<gốc>/docs` → `<gốc>`. */
const rootOf = (docsDir) => path.resolve(docsDir, '..');

/**
 * Đường dẫn thật của spec E2E, hoặc null nếu chưa có ở bố cục nào.
 * @param {string} docsDir thư mục docs/
 * @param {string} screenAbsDir folder màn (tuyệt đối) — dùng cho bố cục cũ
 * @param {string} code mã màn, vd 'S01'
 * @param {string} name tên màn PascalCase không dấu, vd 'Login'
 */
function resolveE2e(docsDir, screenAbsDir, code, name) {
  const root = rootOf(docsDir);
  const file = specFileName(code, name);
  for (const d of THU_MUC_E2E) {
    const p = path.join(root, d, file);
    if (fs.existsSync(p)) return path.resolve(p);
  }
  // Bố cục cũ: ngay trong folder màn.
  const cũ = path.join(screenAbsDir, 'e2e.spec.ts');
  if (fs.existsSync(cũ)) return path.resolve(cũ);
  return null;
}

/** Có spec E2E cho màn này không (ở bất kỳ bố cục nào). */
const hasE2e = (...a) => resolveE2e(...a) !== null;

/**
 * Spec KHÔNG mang tên màn nhưng gắn mã TC của màn — vd `e2e/tests/chatQpin.spec.ts` chứa
 * `TC-S01-…`. VÌ SAO: một màn lớn bị chẻ thành nhiều spec theo TÍNH NĂNG, và cái tên
 * `S01-Terminal.spec.ts` chỉ ôm được một trong số đó; ép đặt tên theo màn là ép gộp
 * những spec vốn nên tách. Truy vết vẫn nguyên vẹn vì nó dựa vào mã `TC-S..` trong tên test
 * chứ không dựa vào tên file (xem đầu file) — nên mã mới là thứ đáng đi hỏi.
 * Trả mảng đường dẫn tuyệt đối (đã bỏ file chuẩn của chính màn), rỗng nếu không có.
 */
function taggedSpecs(docsDir, code, name) {
  const root = rootOf(docsDir);
  const chuẩn = name ? specFileName(code, name) : null;
  const mã = new RegExp(`TC-${String(code).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-`);
  const ra = [];
  for (const d of THU_MUC_E2E) {
    const thưMục = path.join(root, d);
    let tên;
    try { tên = fs.readdirSync(thưMục); } catch { continue; }
    for (const t of tên) {
      if (!t.endsWith('.spec.ts') || t === chuẩn) continue;
      const p = path.join(thưMục, t);
      try {
        if (!fs.statSync(p).isFile()) continue;
        if (mã.test(fs.readFileSync(p, 'utf8'))) ra.push(path.resolve(p));
      } catch { /* file lỗi/biến mất giữa chừng — bỏ qua, đừng làm hỏng cả lần quét */ }
    }
  }
  return ra;
}

/**
 * Nơi GHI spec. Đã có ở bố cục cũ → trả đúng chỗ đó (không tự dời). Chưa có → vị trí chuẩn mới.
 * Trả cả `legacy` để skill/script biết mà nói rõ với người dùng thay vì im lặng.
 */
function writePathFor(docsDir, screenAbsDir, code, name) {
  const đãCó = resolveE2e(docsDir, screenAbsDir, code, name);
  // So sánh sau khi resolve CẢ HAI phía: docsDir/screenAbsDir có thể là đường dẫn tương đối,
  // và khi đó `dirname` cho chuỗi tương đối còn `resolve` cho tuyệt đối — không bao giờ bằng nhau,
  // nên cờ `legacy` luôn false và người dùng không bao giờ được cảnh báo.
  if (đãCó) return { path: đãCó, legacy: path.dirname(đãCó) === path.resolve(screenAbsDir) };
  return {
    path: path.resolve(rootOf(docsDir), THU_MUC_E2E[0], specFileName(code, name)),
    legacy: false,
  };
}

module.exports = { resolveE2e, hasE2e, taggedSpecs, writePathFor, specFileName, THU_MUC_E2E };
