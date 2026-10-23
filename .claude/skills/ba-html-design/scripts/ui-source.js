#!/usr/bin/env node
/*
 * ba-html-design/ui-source.js — dò "NGUỒN GIAO DIỆN" của app đang chạy thật trước khi dựng wireframe/html-design (zero-dep).
 *
 *   node .claude/skills/ba-html-design/scripts/ui-source.js [docsDir=docs] [--root <gốc repo>] [--no-shot] [--json] [--chrome <path>]
 *   node .claude/skills/ba-html-design/scripts/ui-source.js login  [docsDir=docs] [--url <URL local>] [--chrome <path>]
 *   node .claude/skills/ba-html-design/scripts/ui-source.js logout [docsDir=docs]
 *
 * Thứ tự nguồn khi dựng: APP THẬT > docs/07-design-system.md > khối gốc toolkit. Script này chỉ ĐẾM và LIỆT KÊ để agent
 * biết app thật nằm ở đâu — không phán bản dựng có giống app hay không:
 *   1. URL dev ghi trong dev-notes.md (qua docpath: Ho-so/ hoặc gốc docs/) — localhost/127.0.0.1/*.local/*.test.
 *      Có mục `## Màn cần chụp` → chụp đúng danh sách đó (URL local hoặc đường dẫn `/tasks/1` ghép với URL dev đầu tiên),
 *      tối đa 12; không có mục → 3 URL đầu.
 *   2. Có URL, với tới được, có Chrome → chụp vào Ho-so/ui-source/app-<n>.png (1440×900) làm mẫu.
 *      Màn sau đăng nhập: chạy `login` MỘT lần — Chrome thật mở với hồ sơ riêng <gốc>/.claude/ui-source-profile/,
 *      người dùng tự đăng nhập rồi đóng cửa sổ; các lần chụp sau dùng lại cookie của hồ sơ đó. Không lưu mật khẩu.
 *      Ảnh chụp tay (dự phòng) bỏ vào Ho-so/ui-source/ với tên khác `app-<n>.png` — script liệt kê, không ghi đè.
 *   3. File shell/layout trong code (layout, shell, sidebar, navbar, header, topbar, menu, App.*) — tối đa 30.
 *   4. Token CSS thật: số khai báo `--tên: giá trị` theo file (css/scss/less/vue/svelte) + mẫu token của file nhiều nhất;
 *      có tailwind.config.* thì liệt kê.
 * Exit: 0 (kể cả không thấy gì — dòng "Chưa thấy" nói rõ) · 2 thiếu thư mục docs / login sai URL hoặc thiếu Chrome.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // JSON qua pipe không bị cắt (lint 43)
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const docpath = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));

const gioiHan = [
  'Chỉ liệt kê và đếm — không so bản dựng với app (chưa có máy đo "độ giống"; người duyệt nhìn ảnh mẫu cạnh bản dựng).',
  'URL dev chỉ lấy từ dev-notes.md, dạng localhost/127.0.0.1/0.0.0.0/*.local/*.test; URL staging/production không tự chụp, `login` cũng từ chối.',
  'Script không tự mở kết nối mạng: URL local được giao cho Chrome headless (dump-dom để biết dev server có chạy, rồi chụp).',
  'Đăng nhập = cookie trong hồ sơ Chrome riêng (.claude/ui-source-profile/, tự có .gitignore). Cookie hết hạn → chụp ra trang login: script thấy ô mật khẩu thì cảnh báo "có thể chưa đăng nhập", không phân biệt được với màn có ô mật khẩu thật (đổi mật khẩu).',
  'Cửa sổ Chrome của `login` còn mở thì hồ sơ bị khoá — đóng hẳn (Cmd+Q) trước khi chụp.',
  'File shell/layout nhận theo TÊN file; app đặt shell ở tên khác (vd `Frame.tsx`) không thấy. Bỏ node_modules, dist, build, output, backend, server, api, test, thư mục *mock*, file *.test/*.spec/*.stories, .git, docs, .claude — app đặt giao diện trong thư mục tên `server`/`api` sẽ bị sót.',
  'Token CSS chỉ đếm biến `--tên:`; token trong JS (theme object, styled-components) và class Tailwind không đếm.',
];
const DÙNG = 'Dùng: node ui-source.js [login|logout] [docsDir=docs] [--root <gốc repo>] [--url <URL local>] [--no-shot] [--json] [--chrome <path>]';

const argv = process.argv.slice(2);
if (argv.includes('-h') || argv.includes('--help')) {
  console.log(DÙNG);
  for (const g of gioiHan) console.log('  - ' + g);
  process.exit(0);
}
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
let pos = argv.filter((a, i) => !a.startsWith('--') && !['--root', '--chrome', '--url'].includes(argv[i - 1]));
const LỆNH = ['login', 'logout'].includes(pos[0]) ? pos.shift() : 'scan';
const DOCS = path.resolve(pos[0] || 'docs');
if (!fs.existsSync(DOCS)) { console.error(`Không thấy thư mục ${DOCS}. Sửa: truyền đúng thư mục docs của dự án.`); process.exit(2); }
const ROOT = path.resolve(opt('--root') || path.dirname(DOCS));
const JSON_OUT = argv.includes('--json');
const SHOT = !argv.includes('--no-shot');
const PROFILE = path.join(ROOT, '.claude', 'ui-source-profile');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/') || '.';

// ── 1. URL dev + danh sách màn cần chụp ──
const LOCAL = /^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|[\w-]+(?:\.[\w-]+)*\.(?:local|test))(?::\d+)?(?:[/?#]|$)/i;
const URL_RE = /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|[\w-]+(?:\.[\w-]+)*\.(?:local|test))(?::\d+)?(?:\/[^\s)\]>"'`|]*)?/gi;
const notes = docpath.readDoc(DOCS, 'dev-notes.md');
const sạch = (u) => u.replace(/[.,;:]+$/, '');
const urls = [...new Set((notes.match(URL_RE) || []).map(sạch))].slice(0, 5);
// Mục `## Màn cần chụp`: mỗi dòng danh sách một URL local hoặc một đường dẫn bắt đầu bằng `/` (ghép với URL dev đầu tiên).
const danhSách = (() => {
  const dòng = notes.split('\n'); const i = dòng.findIndex((l) => /^#{1,4}\s.*màn cần chụp/i.test(l));
  if (i < 0) return null;
  const out = []; let gốc = null;
  try { gốc = urls[0] ? new URL(urls[0]).origin : null; } catch { gốc = null; }
  for (const l of dòng.slice(i + 1)) {
    if (/^#{1,4}\s/.test(l)) break;
    if (!/^\s*[-*]\s/.test(l)) continue;
    const u = (l.match(URL_RE) || [])[0];
    const p = !u && (l.match(/(?:^|[\s`])(\/[^\s`)]*)/) || [])[1];
    if (u) out.push(sạch(u)); else if (p && gốc) out.push(gốc + sạch(p));
  }
  return [...new Set(out)].slice(0, 12);
})();
const chụp = danhSách && danhSách.length ? danhSách : urls.slice(0, 3);

function chrome() {
  const c = opt('--chrome');
  if (c !== null) return c && fs.existsSync(c) ? c : null;
  return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', 'google-chrome', 'chromium']
    .find((p) => { try { return p.startsWith('/') ? fs.existsSync(p) : spawnSync('which', [p]).status === 0; } catch { return false; } }) || null;
}
const cóHồSơ = () => fs.existsSync(PROFILE);
// SingletonLock = symlink "<máy>-<pid>"; tiến trình đã chết (Chrome bị giết) để lại khoá cũ → coi như không khoá.
const hồSơKhoá = () => {
  let đích; try { đích = fs.readlinkSync(path.join(PROFILE, 'SingletonLock')); } catch { return false; }
  const pid = Number((đích.match(/-(\d+)$/) || [])[1]);
  if (!pid) return true;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
};

// ── login / logout ──
if (LỆNH === 'logout') {
  if (!cóHồSơ()) { console.log(`Chưa có hồ sơ đăng nhập (${rel(PROFILE)}) — không có gì để xoá.`); process.exit(0); }
  fs.rmSync(PROFILE, { recursive: true, force: true });
  console.log(`Đã xoá hồ sơ đăng nhập ${rel(PROFILE)} (cookie của app). Lần chụp sau sẽ không đăng nhập.`);
  process.exit(0);
}
if (LỆNH === 'login') {
  const url = opt('--url') || chụp[0] || urls[0];
  if (!url) { console.error('Không có URL để mở. Sửa: ghi URL dev (http://localhost:…) vào dev-notes.md, hoặc truyền --url.'); process.exit(2); }
  if (!LOCAL.test(url)) { console.error(`Từ chối ${url}: chỉ đăng nhập app chạy trên máy (localhost/127.0.0.1/0.0.0.0/*.local/*.test).`); process.exit(2); }
  const ch = chrome();
  if (!ch) { console.error('Không có Chrome/Chromium. Sửa: cài Chrome hoặc truyền --chrome <đường dẫn>. Dự phòng: tự chụp màn app, bỏ ảnh vào docs/Ho-so/ui-source/.'); process.exit(2); }
  fs.mkdirSync(PROFILE, { recursive: true });
  fs.writeFileSync(path.join(PROFILE, '.gitignore'), '*\n'); // cookie đăng nhập — không bao giờ commit
  console.log(`Mở Chrome với hồ sơ riêng ${rel(PROFILE)} tại ${url}`);
  console.log('→ Đăng nhập app như bình thường, rồi ĐÓNG HẲN cửa sổ Chrome đó (Cmd+Q). Script chờ tới khi Chrome đóng.');
  spawnSync(ch, [`--user-data-dir=${PROFILE}`, '--no-first-run', '--no-default-browser-check', '--new-window', url], { stdio: 'ignore' });
  console.log(`Xong. Chạy lại: node .claude/skills/ba-html-design/scripts/ui-source.js ${path.relative(process.cwd(), DOCS) || '.'} — các màn sẽ được chụp với phiên đăng nhập này.`);
  console.log('Đăng xuất (xoá cookie): ui-source.js logout');
  process.exit(0);
}

// ── 3–4. code ──
// Thư mục không phải giao diện người dùng thấy: build/output, backend/server, test, bản mockup (dự án e-learning: `backend/src/app.ts`,
// `output/js/app.js`, `web-mockup/` từng lọt vào danh sách shell).
const BỎ = /^(node_modules|dist|build|out|output|coverage|vendor|target|\.git|\.next|\.nuxt|\.svelte-kit|\.turbo|\.cache|\.venv|venv|__pycache__|\.claude|backend|server|api|e2e|tests?|__tests__|__mocks__|[\w-]*mock(?:up)?s?[\w-]*)$/i;
const TEST = /\.(test|spec|stories|story|d)\.[cm]?[jt]sx?$/i;
// App.* chỉ nhận file component (tsx/jsx/vue/svelte) — `app.ts`/`app.js` thường là server Express/Koa; _app/_layout/+layout giữ cả js/ts.
const SHELL = /^(?:_?app|root|main)?[-_.]?(?:app-?)?(layout|shell|sidebar|side-?nav|nav-?bar|navigation|header|top-?bar|menu)(?:[-_.][\w-]*)?\.(tsx|jsx|vue|svelte|astro|html|ts|js)$|^App\.(tsx|jsx|vue|svelte)$|^(_app|_layout|\+layout)\.(tsx|jsx|vue|svelte|ts|js)$/i;
const CSS = /\.(css|scss|sass|less|vue|svelte)$/i;
const shell = [], tokFiles = [], tailwind = [];
let soFile = 0;
(function đi(d, sâu) {
  if (sâu > 9) return;
  let ents = []; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!BỎ.test(e.name) && path.resolve(p) !== DOCS) đi(p, sâu + 1); continue; }
    soFile++;
    if (SHELL.test(e.name) && !TEST.test(e.name) && shell.length < 30) shell.push(rel(p));
    if (/^tailwind\.config\.(js|cjs|mjs|ts)$/.test(e.name)) tailwind.push(rel(p));
    if (CSS.test(e.name)) {
      let t = ''; try { t = fs.statSync(p).size < 2e6 ? fs.readFileSync(p, 'utf8') : ''; } catch { t = ''; }
      const toks = [...t.matchAll(/(--[\w-]+)\s*:\s*([^;}{\n]+)/g)].map((m) => [m[1], m[2].trim()]);
      if (toks.length) tokFiles.push({ file: rel(p), n: toks.length, toks });
    }
  }
})(ROOT, 0);
tokFiles.sort((a, b) => b.n - a.n);
const mẫu = tokFiles[0] ? [...new Map(tokFiles[0].toks).entries()].slice(0, 24).map(([k, v]) => `${k}: ${v.slice(0, 60)}`) : [];

// ── 2. chụp ──
// Không mở kết nối mạng trong script: chỉ giao URL LOCAL cho Chrome (như shot.js mở file), rồi đọc DOM Chrome trả về —
// trang lỗi mạng của Chrome (neterror / ERR_…) = dev server chưa bật; còn ô mật khẩu = có thể chưa đăng nhập.
// Chrome headless với hồ sơ THẬT (user-data-dir) làm xong việc nhưng không tự thoát (đo: treo tới hết timeout) →
// chạy bất đồng bộ, thấy kết quả (DOM đủ </html> / file ảnh đã ghi) thì tự đóng.
const cờHồSơ = () => (cóHồSơ() ? [`--user-data-dir=${PROFILE}`, '--no-first-run', '--no-default-browser-check'] : []);
function chạyChrome(ch, args, xong, hạn) {
  return new Promise((res) => {
    const p = spawn(ch, args, { stdio: ['ignore', 'pipe', 'ignore'] }); let out = '', hếtHạn = false;
    const đóng = () => { clearInterval(t); clearTimeout(h); try { p.kill('SIGKILL'); } catch { /* đã thoát */ } };
    const t = setInterval(() => { if (xong(out)) setTimeout(đóng, 300); }, 200);
    const h = setTimeout(() => { hếtHạn = true; đóng(); }, hạn);
    p.stdout.on('data', (d) => { out += d; });
    p.on('close', () => { clearInterval(t); clearTimeout(h); res({ out, hếtHạn }); });
    p.on('error', () => { clearInterval(t); clearTimeout(h); res({ out, hếtHạn }); });
  });
}
async function dom(ch, url) {
  const r = await chạyChrome(ch, ['--headless=new', '--disable-gpu', ...cờHồSơ(), '--virtual-time-budget=3000', '--dump-dom', url], (o) => /<\/html>\s*$/i.test(o), 30000);
  return r.out;
}
const vớiTới = (d) => d.trim().length > 0 && !/neterror|ERR_CONNECTION|ERR_NAME_NOT_RESOLVED|ERR_ADDRESS_UNREACHABLE/i.test(d);
const cóÔMậtKhẩu = (d) => /<input\b[^>]*type\s*=\s*["']?password/i.test(d);

const thưMụcẢnh = docpath.writePathFor(DOCS, 'ui-source');
const ảnhTay = (() => { try { return fs.readdirSync(thưMụcẢnh).filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && !/^app-\d+\.png$/.test(f)).sort().map((f) => path.relative(process.cwd(), path.join(thưMụcẢnh, f))); } catch { return []; } })();

(async () => {
  const ảnh = []; let lýDoKhôngChụp = null;
  if (!urls.length && !chụp.length) lýDoKhôngChụp = 'dev-notes.md không ghi URL dev (localhost/…)';
  else if (!chụp.length) lýDoKhôngChụp = 'mục "Màn cần chụp" không có dòng nào dùng được (đường dẫn `/…` cần một URL dev trong dev-notes.md để ghép)';
  else if (!SHOT) lýDoKhôngChụp = 'chạy với --no-shot';
  else {
    const ch = chrome();
    if (!ch) lýDoKhôngChụp = 'không có Chrome/Chromium';
    else if (cóHồSơ() && hồSơKhoá()) lýDoKhôngChụp = 'cửa sổ Chrome của `login` còn mở (hồ sơ bị khoá) — đóng hẳn (Cmd+Q) rồi chạy lại';
    else if (!vớiTới(await dom(ch, chụp[0]))) lýDoKhôngChụp = `không với tới ${chụp[0]} — bật dev server rồi chạy lại`;
    else {
      fs.mkdirSync(thưMụcẢnh, { recursive: true });
      for (const f of fs.readdirSync(thưMụcẢnh)) if (/^app-\d+\.png$/.test(f)) fs.unlinkSync(path.join(thưMụcẢnh, f)); // bộ cũ của chính script, không đụng ảnh tay
      for (const [i, u] of chụp.entries()) {
        const f = path.join(thưMụcẢnh, `app-${i + 1}.png`);
        const d = await dom(ch, u);
        await chạyChrome(ch, ['--headless=new', '--disable-gpu', ...cờHồSơ(), '--hide-scrollbars', '--window-size=1440,900', '--virtual-time-budget=4000', `--screenshot=${f}`, u], () => { try { return fs.statSync(f).size > 0; } catch { return false; } }, 60000);
        if (fs.existsSync(f)) ảnh.push({ url: u, file: path.relative(process.cwd(), f) || f, oMatKhau: cóÔMậtKhẩu(d) });
      }
    }
  }
  const kq = { root: ROOT, urls, chup: chụp, dsMan: danhSách !== null, profile: cóHồSơ() ? rel(PROFILE) : null, anh: ảnh, anhTay: ảnhTay, khongChup: lýDoKhôngChụp, shell, tokenFiles: tokFiles.slice(0, 10).map((x) => ({ file: x.file, n: x.n })), tokenMau: mẫu, tailwind, soFile };
  if (JSON_OUT) { console.log(JSON.stringify(kq, null, 2)); return; }
  const mk = ảnh.filter((a) => a.oMatKhau);
  console.log(`ui-source: nguồn giao diện của app thật — gốc ${ROOT} (${soFile} file đã quét)`);
  console.log(`\n1. URL dev (dev-notes.md): ${urls.length ? urls.join(' · ') : 'chưa thấy'}`);
  console.log(`   Màn cần chụp: ${danhSách !== null ? `${chụp.length} (mục "Màn cần chụp")` : `${chụp.length} URL đầu — muốn chụp đúng màn nào thì thêm mục "## Màn cần chụp" vào dev-notes.md`}`);
  console.log(`   Đăng nhập: ${cóHồSơ() ? `có hồ sơ ${rel(PROFILE)} (chụp với cookie đã lưu)` : 'không — màn sau đăng nhập sẽ ra trang login; chạy `ui-source.js login` một lần'}`);
  console.log(`2. Ảnh mẫu của app: ${ảnh.length ? '' : 'không chụp — ' + lýDoKhôngChụp}`);
  for (const a of ảnh) console.log(`   - ${a.file} ← ${a.url}${a.oMatKhau ? '  ⚠️ có ô mật khẩu — có thể chưa đăng nhập' : ''}`);
  if (mk.length) console.log(`   ⚠️ ${mk.length}/${ảnh.length} ảnh có ô mật khẩu: ${cóHồSơ() ? 'cookie có thể đã hết hạn — chạy lại `ui-source.js login`' : 'chạy `ui-source.js login` rồi chụp lại'}; màn thật sự có ô mật khẩu (đăng nhập, đổi mật khẩu) thì bỏ qua cảnh báo.`);
  console.log(`   Ảnh chụp tay (Ho-so/ui-source/, dự phòng): ${ảnhTay.length ? ảnhTay.join(' · ') : 'không có'}`);
  console.log(`3. File shell/layout trong code (${shell.length}${shell.length >= 30 ? '+' : ''}): ${shell.length ? '' : 'chưa thấy'}`);
  for (const s of shell) console.log('   - ' + s);
  console.log(`4. Token CSS (--tên:): ${tokFiles.length ? tokFiles.slice(0, 10).map((x) => `${x.file} (${x.n})`).join(' · ') : 'chưa thấy'}${tailwind.length ? ` · Tailwind: ${tailwind.join(', ')}` : ''}`);
  if (mẫu.length) { console.log(`   mẫu từ ${tokFiles[0].file}:`); for (const m of mẫu) console.log('   ' + m); }
  const cóApp = urls.length || shell.length || tokFiles.length || ảnhTay.length;
  console.log(`\nĐã kiểm: dev-notes.md, ${soFile} file code (tên shell/layout, biến CSS), thư mục ảnh ui-source/`);
  console.log('Chưa kiểm: độ giống giữa bản dựng và app (không có máy đo — người duyệt so ảnh mẫu với bản dựng)');
  console.log(cóApp
    ? 'Nguồn giao diện: APP THẬT — dựng theo shell/menu/font/màu/component ở trên (07-design-system.md và khối gốc toolkit chỉ lấp chỗ app chưa có).'
    : 'Nguồn giao diện: không thấy app — dùng docs/07-design-system.md, không có thì khối gốc toolkit.');
})();
