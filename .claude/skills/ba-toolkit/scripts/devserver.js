#!/usr/bin/env node
/*
 * ba-toolkit/devserver.js — DÒ DEV SERVER của dự án và SOÁT DANH TÍNH của nó. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ba-toolkit/scripts/devserver.js [--root <dự-án>] [--docs <docs>] [--mark "<chữ>"]… [--json|--plain]
 *
 * Nguồn URL, theo thứ tự (dò hết, lấy ứng viên đầu tiên là CỦA DỰ ÁN):
 *   1. biến môi trường `E2E_BASE_URL`
 *   2. `e2e/playwright.config.*` rồi `playwright.config.*` ở gốc — chuỗi literal của `baseURL:` và `webServer.url:`
 *   3. dòng `URL dev: <url>` trong dev-notes.md (qua docpath.js — `docs/Ho-so/` hoặc gốc `docs/`)
 *   4. `--port <n>` / `-p <n>` / `PORT=<n>` trong `scripts` của package.json → http://localhost:<n>, và `server.port` của
 *      vite config (`vite.config.*` cạnh package.json, hoặc file mà script trỏ bằng `--config <file>`). Package.json đọc ở
 *      gốc VÀ thư mục con ≤2 tầng (monorepo: dự án helpdesk có `app/package.json` + `app/web/vite.config.ts`)
 *   5. CHỈ KHI 1–4 không cho ứng viên nào: cổng mặc định theo dependency (vite 5173 · next/nuxt/react-scripts 3000 ·
 *      astro 4321 · angular 4200 · sveltekit 5173), không có dependency nào quen → 3000 · 5173 · 8080
 * KHÔNG đọc `.env*` — hook-guard chặn, và một secret đã vào ngữ cảnh thì không rút lại được. Cổng nằm trong `.env`
 * thì ghi `URL dev:` vào dev-notes hoặc đặt `E2E_BASE_URL`.
 *
 * Mỗi ứng viên: GET `/` timeout 500 ms (status < 500 = có trả lời), rồi SOÁT DANH TÍNH — HTML trả về phải chứa ít
 * nhất một dấu vân tay của dự án: `<title>` của index.html (gốc · public/ · src/ · client/ của mọi package, và `root:`
 * của vite config — `root: __dirname` → thư mục chứa config) hoặc `title:` trong
 * app/layout.* (Next) · `name`/`productName`/`displayName` của package.json · chữ truyền bằng `--mark` (microcopy)
 * · dòng `Dấu vân tay: <chữ>` trong dev-notes. So không phân biệt hoa thường, không dấu, `-`/`_` = khoảng trắng.
 *   của-dự-án  exit 0 — có server trả lời và HTML chứa dấu vân tay
 *   lạ         exit 3 — có server trả lời nhưng HTML không chứa dấu vân tay nào (server của dự án KHÁC chiếm cổng,
 *                        hoặc dự án không có dấu vân tay để đối chiếu — thêm `--mark`)
 *   không-thấy exit 1 — không ứng viên nào trả lời
 *   exit 2 — sai cách gọi
 * Không tự khởi động server: `không-thấy`/`lạ` in LỆNH GỢI Ý để người/agent tự chạy — script gọi vite/next/… trước,
 * rồi `dev` · `start` · `serve` · `dev:*`; package con thì `cd <thư mục> && npm run <script>`.
 *
 * Vì sao có: dogfood ac-eval (12-agentcode-kit) — 7 TC Manual "không thao tác được vì không có dev server", và
 * playwright-skill (agent-skills) dò cổng quen bằng HEAD 500 ms nhưng coi MỌI server trả lời là của mình. Một
 * evaluator chụp bằng chứng từ app của dự án khác đang chiếm cổng 3000 là PASS giả trông rất thật — nên "thao tác
 * được" chỉ tính khi máy này nói `của-dự-án`.
 *
 * gioiHan: đọc config bằng regex (literal chuỗi) — `baseURL` ghép từ biến/hàm không đọc được, khi đó dùng
 * E2E_BASE_URL. Chỉ soát trang `/` (app chuyển hướng `/` sang trang đăng nhập bằng JS thì HTML ban đầu vẫn là shell
 * có `<title>`); SPA mà `<title>` do JS đặt và shell rỗng → `lạ` trừ khi có `--mark` khớp shell. Title mặc định của
 * template (Vite App, React App, Create Next App…) là dấu vân tay YẾU — vẫn `của-dự-án` nhưng kèm cảnh báo, vì hai dự
 * án cùng template sẽ trùng. Không dò cổng ngoài danh sách; không theo redirect; không đọc HTTPS tự ký (lỗi TLS =
 * không trả lời). Đếm, không phán: không biết màn nào chạy được — chỉ nói server có phải của dự án không.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const docpath = require(path.join(__dirname, 'docpath.js'));

const GIOI_HAN = [
  'config đọc bằng regex literal — baseURL ghép từ biến/hàm không đọc được (dùng E2E_BASE_URL)',
  'KHÔNG đọc .env* (hook-guard chặn) — cổng nằm trong .env thì ghi `URL dev:` vào dev-notes',
  'chỉ soát HTML của `/`, không theo redirect, không chạy JS — SPA shell rỗng cần --mark',
  'title mặc định của template và package name ngắn/chung là dấu vân tay yếu (cảnh báo, vẫn của-dự-án)',
  'cổng mặc định chỉ dò khi 4 nguồn trên không cho ứng viên nào',
  'package.json chỉ dò gốc + thư mục con ≤2 tầng (bỏ node_modules, thư mục chấm, docs, dist/build); vite config chỉ đọc literal root/server.port',
  'không tự khởi động server — chỉ in lệnh gợi ý',
];
const TITLE_MẶC_ĐỊNH = /^(vite app|vite \+ .*|react app|create next app|next\.js|my app|document|home|index|untitled|app)$/i;
const CỔNG_THEO_DEP = [['vite', 5173], ['next', 3000], ['nuxt', 3000], ['react-scripts', 3000], ['astro', 4321], ['@angular/core', 4200], ['@sveltejs/kit', 5173]];

const chuẩn = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
const đọc = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const giảiHtml = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const BỎ_DIR = /^(node_modules|docs|dist|build|out|coverage|vendor|tmp|logs|e2e)$/;
const docJson = (f) => { try { return JSON.parse(đọc(f) || '{}'); } catch { return {}; } };
/** Mọi package.json ở gốc + thư mục con ≤2 tầng → [{dir, rel, pkg}] (gốc trước, nông trước sâu). */
function góiCon(root) {
  const ds = [{ dir: root, rel: '.', pkg: docJson(path.join(root, 'package.json')) }];
  const đi = (d, tầng) => {
    if (tầng > 2) return;
    let tên = []; try { tên = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of tên) {
      if (!e.isDirectory() || e.name.startsWith('.') || BỎ_DIR.test(e.name)) continue;
      const con = path.join(d, e.name);
      if (fs.existsSync(path.join(con, 'package.json'))) ds.push({ dir: con, rel: path.relative(root, con), pkg: docJson(path.join(con, 'package.json')) });
      đi(con, tầng + 1);
    }
  };
  đi(root, 1);
  return ds;
}
/** vite config của mỗi package: file cạnh package.json + file script trỏ bằng `--config` → [{file, rootDir, port}] */
function viteConfigs(gói) {
  const ds = [];
  for (const g of gói) {
    const tệp = ['ts', 'js', 'mjs', 'cjs', 'mts'].map((x) => path.join(g.dir, `vite.config.${x}`));
    for (const v of Object.values(g.pkg.scripts || {})) for (const m of String(v).matchAll(/\bvite\b[^&|;]*?(?:--config|-c)[= ]+['"]?([^\s'"]+)/g)) tệp.push(path.resolve(g.dir, m[1]));
    for (const f of tệp) {
      if (ds.some((d) => d.file === f)) continue;
      const t = đọc(f); if (!t) continue;
      const dirF = path.dirname(f);
      let rootDir = g.dir;                                             // vite: root mặc định = cwd (thư mục của script)
      const r = t.match(/\broot\s*:\s*([^,\n}]+)/);
      if (r) {
        const v = r[1].trim(); const lit = v.match(/^['"`]([^'"`]+)['"`]$/); const res = v.match(/resolve\(\s*__dirname\s*,\s*['"`]([^'"`]+)['"`]\s*\)/);
        if (/^__dirname$|fileURLToPath\(new URL\(\s*['"`]\.\/?['"`]/.test(v)) rootDir = dirF;
        else if (res) rootDir = path.resolve(dirF, res[1]);
        else if (lit) rootDir = path.resolve(g.dir, lit[1]);
      }
      const port = (t.match(/\bserver\s*:\s*\{[\s\S]*?\bport\s*:\s*(\d{2,5})/) || [])[1];
      ds.push({ file: f, rootDir, port: port ? +port : null });
    }
  }
  return ds;
}

/** Ứng viên URL theo thứ tự nguồn. */
function ứngViên(root, docs) {
  const ds = []; const thêm = (url, nguồn) => { if (url && /^https?:\/\//i.test(url) && !ds.some((d) => d.url === url.replace(/\/+$/, ''))) ds.push({ url: url.replace(/\/+$/, ''), nguồn }); };
  if (process.env.E2E_BASE_URL) thêm(process.env.E2E_BASE_URL.trim(), 'E2E_BASE_URL');
  for (const dir of ['e2e', '.']) for (const ext of ['ts', 'js', 'mjs', 'cjs', 'mts']) {
    const f = path.join(root, dir, `playwright.config.${ext}`); const t = đọc(f); if (!t) continue;
    const rel = path.relative(root, f);
    for (const m of t.matchAll(/baseURL\s*:\s*(?:[^'"`\n,]*\|\|\s*)?['"`]([^'"`]+)['"`]/g)) thêm(m[1], `${rel} baseURL`);
    const ws = t.match(/webServer\s*:\s*[{[][\s\S]*?\burl\s*:\s*(?:[^'"`\n,]*\|\|\s*)?['"`]([^'"`]+)['"`]/);
    if (ws) thêm(ws[1], `${rel} webServer.url`);
  }
  const dn = docs ? docpath.readDoc(docs, 'dev-notes.md') : '';
  for (const m of dn.matchAll(/URL dev\s*:\s*`?(https?:\/\/[^\s`|]+)/gi)) thêm(m[1], 'dev-notes `URL dev:`');
  const gói = góiCon(root); const pkg = gói[0].pkg; const vite = viteConfigs(gói);
  const tênPkg = (g) => (g.rel === '.' ? 'package.json' : `${g.rel}/package.json`);
  for (const g of gói) for (const [k, v] of Object.entries(g.pkg.scripts || {})) {
    const m = String(v).match(/(?:--port[= ]|\s-p\s+|\bPORT=)(\d{2,5})/);
    if (m) thêm(`http://localhost:${m[1]}`, `${tênPkg(g)} scripts.${k}`);
  }
  for (const v of vite) if (v.port) thêm(`http://localhost:${v.port}`, `${path.relative(root, v.file)} server.port`);
  if (!ds.length) {
    const deps = Object.assign({}, ...gói.map((g) => ({ ...(g.pkg.dependencies || {}), ...(g.pkg.devDependencies || {}) })));
    const theoDep = CỔNG_THEO_DEP.filter(([d]) => deps[d]);
    const cổng = theoDep.length ? theoDep.map(([d, p]) => [p, `mặc định ${d}`]) : [[3000, 'mặc định'], [5173, 'mặc định'], [8080, 'mặc định']];
    for (const [p, n] of cổng) thêm(`http://localhost:${p}`, n);
  }
  return { ds, pkg, gói, vite };
}

/** Dấu vân tay: [{chữ, nguồn, yếu}] */
function dấuVânTay(root, docs, pkg, marks, gói = [{ dir: root, rel: '.', pkg }], vite = []) {
  const ds = []; const thêm = (chữ, nguồn, yếu) => { const c = String(chữ || '').trim(); if (c.length >= 3 && !ds.some((d) => chuẩn(d.chữ) === chuẩn(c))) ds.push({ chữ: c, nguồn, yếu: !!yếu }); };
  for (const m of marks) thêm(m, '--mark');
  const dn = docs ? docpath.readDoc(docs, 'dev-notes.md') : '';
  for (const m of dn.matchAll(/Dấu vân tay\s*:\s*`?([^`\n|]+)/gi)) thêm(m[1], 'dev-notes `Dấu vân tay:`');
  const gốcHtml = [...new Set([root, ...gói.map((g) => g.dir), ...vite.map((v) => v.rootDir)])];
  for (const d of gốcHtml) for (const f of ['index.html', 'public/index.html', 'src/index.html', 'client/index.html']) {
    const abs = path.join(d, f); const m = đọc(abs).match(/<title[^>]*>([^<]+)<\/title>/i);
    if (m) thêm(giảiHtml(m[1]), `${path.relative(root, abs)} <title>`, TITLE_MẶC_ĐỊNH.test(m[1].trim()));
  }
  for (const f of ['app/layout.tsx', 'app/layout.jsx', 'app/layout.js', 'src/app/layout.tsx', 'src/app/layout.jsx', 'src/app/layout.js']) {
    const m = đọc(path.join(root, f)).match(/\btitle\s*:\s*(?:\{[^}]*?default\s*:\s*)?['"`]([^'"`]+)['"`]/);
    if (m) thêm(m[1], `${f} title`, TITLE_MẶC_ĐỊNH.test(m[1].trim()));
  }
  // name ngắn/chung (app, web, client…) trùng chữ thường trong HTML bất kỳ → yếu
  for (const g of gói) for (const k of ['productName', 'displayName', 'name']) if (g.pkg[k]) { const n = String(g.pkg[k]).replace(/^@[^/]+\//, ''); thêm(n, `${g.rel === '.' ? '' : g.rel + '/'}package.json ${k}`, n.length < 5 || /^(app|web|client|frontend|ui|site|admin|dashboard|my[-_ ]?app)$/i.test(n)); }
  return ds;
}

/** GET url, timeout ms mỗi nhịp socket; trả {status, body} hoặc {lỗi}. Đồng bộ hoá bằng Promise. */
function dò(url, timeout) {
  return new Promise((resolve) => {
    let u; try { u = new URL(url.endsWith('/') ? url : url + '/'); } catch { resolve({ lỗi: 'URL hỏng' }); return; }
    const mod = u.protocol === 'https:' ? https : http;
    const host = u.hostname === 'localhost' ? '127.0.0.1' : u.hostname;
    const tổngHạn = setTimeout(() => { try { req.destroy(); } catch { /* */ } resolve({ lỗi: `quá ${timeout * 4} ms` }); }, timeout * 4);
    const req = mod.request({ hostname: host, port: u.port || (u.protocol === 'https:' ? 443 : 80), path: u.pathname + u.search, method: 'GET', timeout, headers: { Accept: 'text/html', Host: u.host } }, (res) => {
      let body = ''; res.setEncoding('utf8');
      res.on('data', (c) => { if (body.length < 512 * 1024) body += c; });
      res.on('end', () => { clearTimeout(tổngHạn); resolve({ status: res.statusCode, body }); });
      res.on('error', () => { clearTimeout(tổngHạn); resolve({ status: res.statusCode, body }); });
    });
    req.on('timeout', () => { req.destroy(); clearTimeout(tổngHạn); resolve({ lỗi: `quá ${timeout} ms` }); });
    req.on('error', (e) => { clearTimeout(tổngHạn); resolve({ lỗi: e.code || e.message }); });
    req.end();
  });
}

const CÔNG_CỤ_UI = /\b(vite|next\s+dev|nuxt|astro|ng\s+serve|react-scripts\s+start|webpack\s+serve|parcel)\b/;
/** Script chạy dev tốt nhất qua mọi package: gọi công cụ UI (vite/next/…) > dev > start > serve > dev:* ; nông trước sâu. */
function lệnhGợiÝ(root, gói) {
  let tốt = null;
  gói.forEach((g, i) => {
    for (const [k, v] of Object.entries(g.pkg.scripts || {})) {
      if (/^(build|test|lint|typecheck|preview)/.test(k)) continue;
      const hạng = CÔNG_CỤ_UI.test(String(v)) && /^(dev|start|serve)(:|$)/.test(k) ? 0 : k === 'dev' ? 1 : k === 'start' ? 2 : k === 'serve' ? 3 : /^dev:/.test(k) ? 4 : null;
      if (hạng === null) continue;
      if (!tốt || hạng < tốt.hạng || (hạng === tốt.hạng && i < tốt.i)) tốt = { hạng, i, g, k };
    }
  });
  if (!tốt) return null;
  const có = (f) => fs.existsSync(path.join(tốt.g.dir, f)) || fs.existsSync(path.join(root, f));
  const pm = có('pnpm-lock.yaml') ? 'pnpm' : có('yarn.lock') ? 'yarn' : 'npm';
  return `${tốt.g.rel === '.' ? '' : `cd ${tốt.g.rel} && `}${pm} run ${tốt.k}`;
}

async function soát({ root, docs, marks = [], timeout = 500 }) {
  const { ds, pkg, gói, vite } = ứngViên(root, docs);
  const dấu = dấuVânTay(root, docs, pkg, marks, gói, vite);
  const kq = [];
  for (const c of ds) {
    const r = await dò(c.url, timeout);
    if (r.lỗi || !(r.status < 500)) { kq.push({ ...c, kếtQuả: 'không-trả-lời', lýDo: r.lỗi || `HTTP ${r.status}` }); continue; }
    const html = chuẩn(giảiHtml(r.body || ''));
    const khớp = dấu.filter((d) => html.includes(chuẩn(d.chữ)));
    const title = ((r.body || '').match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1];
    kq.push({ ...c, kếtQuả: khớp.length ? 'của-dự-án' : 'lạ', status: r.status, title: title ? giảiHtml(title).trim() : null, khớp: khớp.map((d) => d.chữ), chỉYếu: khớp.length > 0 && khớp.every((d) => d.yếu) });
  }
  const của = kq.find((x) => x.kếtQuả === 'của-dự-án');
  const lạ = kq.find((x) => x.kếtQuả === 'lạ');
  const trạngThái = của ? 'của-dự-án' : lạ ? 'lạ' : 'không-thấy';
  const chọn = của || lạ || null;
  const cảnhBáo = [];
  if (!dấu.length) cảnhBáo.push('dự án không có dấu vân tay nào (index.html <title> · package.json name · --mark) — mọi server sẽ là `lạ`');
  if (của && của.chỉYếu) cảnhBáo.push(`chỉ khớp dấu vân tay yếu — title mặc định của template/name chung (${của.khớp.join(', ')}) — dự án khác cùng template cũng khớp; thêm --mark "<microcopy riêng>"`);
  return { trạngThái, url: chọn ? chọn.url : null, nguồn: chọn ? chọn.nguồn : null, ứngViên: kq, dấuVânTay: dấu, lệnhGợiÝ: trạngThái === 'của-dự-án' ? null : lệnhGợiÝ(root, gói), cảnhBáo, gioiHan: GIOI_HAN };
}

module.exports = { soát, ứngViên, dấuVânTay, chuẩn, góiCon, viteConfigs, lệnhGợiÝ };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const opt = (n) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
  if (argv.includes('-h') || argv.includes('--help')) { console.log('Dùng: devserver.js [--root <dự-án>] [--docs <docs>] [--mark "<chữ>"]… [--timeout 500] [--json|--plain]'); process.exit(0); }
  const root = path.resolve(opt('--root') || process.cwd());
  if (!fs.existsSync(root)) { console.error(`devserver: không có thư mục ${root}`); process.exit(2); }
  const docs = opt('--docs') ? path.resolve(opt('--docs')) : (fs.existsSync(path.join(root, 'docs')) ? path.join(root, 'docs') : null);
  const marks = argv.flatMap((a, i) => (a === '--mark' && argv[i + 1] ? [argv[i + 1]] : []));
  const timeout = +(opt('--timeout') || 500) || 500;
  soát({ root, docs, marks, timeout }).then((kq) => {
    const exit = kq.trạngThái === 'của-dự-án' ? 0 : kq.trạngThái === 'lạ' ? 3 : 1;
    if (argv.includes('--json')) { console.log(JSON.stringify(kq, null, 2)); process.exit(exit); }
    const đầu = kq.trạngThái === 'của-dự-án' ? `của-dự-án — ${kq.url} (nguồn: ${kq.nguồn})`
      : kq.trạngThái === 'lạ' ? `lạ — ${kq.url} trả lời nhưng HTML không chứa dấu vân tay nào của dự án (title: ${JSON.stringify((kq.ứngViên.find((x) => x.url === kq.url) || {}).title || null)})`
        : `không-thấy — ${kq.ứngViên.length} ứng viên, không cái nào trả lời`;
    console.log(`devserver: ${đầu}`);
    for (const c of kq.ứngViên) console.log(`  ${c.kếtQuả === 'của-dự-án' ? '✅' : c.kếtQuả === 'lạ' ? '⚠️' : '·'} ${c.url} [${c.nguồn}] → ${c.kếtQuả}${c.khớp && c.khớp.length ? ` (khớp: ${c.khớp.join(', ')})` : ''}${c.lýDo ? ` (${c.lýDo})` : ''}`);
    console.log(`  Dấu vân tay: ${kq.dấuVânTay.length ? kq.dấuVânTay.map((d) => `"${d.chữ}" [${d.nguồn}${d.yếu ? ', yếu' : ''}]`).join(' · ') : '(không có)'}`);
    for (const c of kq.cảnhBáo) console.log(`  ⚠️ ${c}`);
    if (kq.lệnhGợiÝ) console.log(`  Gợi ý (không tự chạy): ${kq.lệnhGợiÝ}  — rồi chạy lại devserver.js`);
    else if (kq.trạngThái !== 'của-dự-án') console.log('  Gợi ý: không thấy script chạy dev (dev · start · serve · dev:* · script gọi vite/next…) ở package.json nào (gốc + con ≤2 tầng) — đặt E2E_BASE_URL hoặc dòng `URL dev:` trong dev-notes');
    if (!argv.includes('--plain')) console.log(`  gioiHan: ${GIOI_HAN.join(' · ')}`);
    process.exit(exit);
  });
}
