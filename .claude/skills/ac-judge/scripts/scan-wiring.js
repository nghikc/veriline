#!/usr/bin/env node
/*
 * ac-judge/scan-wiring.js — FILE/EXPORT MỚI MÀ KHÔNG AI NỐI VÀO. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ac-judge/scripts/scan-wiring.js <base>..<head> [--root <repo>] [--plain|--json]
 *   node .claude/skills/ac-judge/scripts/scan-wiring.js <base>             # = <base>..HEAD
 *
 * Với mỗi file nguồn MỚI trong diff (A, không tính rename) — .ts .tsx .js .jsx .mjs .cjs .py — không phải test:
 *   nối            có file non-test KHÁC import nó (import/export…from/require/import() — đường tương đối, `@/`/`~/`
 *                  → src/, `paths` của tsconfig/jsconfig, thư mục → index.*; py: `from a.b import` / `import a.b` /
 *                  `from .x import`)
 *   nối-đường-dẫn  tên file kèm đuôi (vd `TrangChan.tsx`, `worker.js`) xuất hiện trong file MÃ hoặc CẤU HÌNH THẬT
 *                  khác — package.json scripts/bin, tsconfig/jsconfig, `*.config.*`, HTML `<script src>`, Dockerfile,
 *                  Makefile/Procfile, yml/toml CI, route manifest (`*route*.json`, vercel/netlify/nest-cli/angular…json).
 *                  KHÔNG tính: `.md`/`.txt`, `*.jsonl`, `.json` khác, mọi thứ trong `docs/` và `.claude/` (dự án helpdesk
 *                  24/09/2026: TrangChan.tsx "nối" nhờ chính ac-judge/SKILL.md + test.js của toolkit nhắc làm ví dụ;
 *                  telegram-button.handler.ts "nối" nhờ 00-backlog.md, bản chấm eval và `.claude/ac-summary-fix2.json` —
 *                  không file mã nào import). Vùng: file trong `.claude/` chỉ được nối bởi `.claude/skills|agents|hooks|
 *                  commands/**` (SKILL.md gọi script là nối thật của skill), `.claude/settings*.json`, CLAUDE.md gốc hoặc
 *                  mã/cấu hình dự án; file trong `docs/` chỉ bởi mã/cấu hình trong `docs/`; mã dự án KHÔNG được nối bởi
 *                  `docs/**` hay `.claude/**` (kể cả import/nhắc tên — toolkit không phải người gọi của dự án).
 *   quy-ước        file entry tự đăng ký theo convention (danh sách dưới) — liệt kê, không báo
 *   chỉ-nhắc-tên   không import, không nhắc đường dẫn, nhưng tên gốc (không đuôi) có mặt như một từ ở file code khác
 *                  (comment, chuỗi, tên trùng) — BÁO, vì nhắc tên không phải nối
 *   mồ-côi         không ai nhắc tới — BÁO
 * Với mỗi EXPORT mới (dòng `+export function|const|let|var|class|enum X`, `+export { a, b }`, py `+def x`/`+class X`
 * ở cột 0) trong file đã nối hoặc file sửa: tên X phải xuất hiện như một từ ở file non-test khác, hoặc ở chính file
 * đó ngoài dòng khai báo → không thì: có file TEST nhắc tới → `chỉ-test-dùng` (🟢 in ra, KHÔNG tính exit — setter
 * `dat*` làm đường nối cho test là hợp lệ; handler chỉ test gọi thì agent phán), không ai cả → BÁO `export-mồ-côi`.
 *
 * Exit = số file `mồ-côi` + `chỉ-nhắc-tên` + số `export-mồ-côi` (ứng viên cho pass của ac-judge, mồi cho verifier —
 * đếm, không phán: một handler đăng ký bằng glob/DI/reflection sẽ bị báo oan, agent đọc rồi bỏ). 2 = sai cách gọi.
 *
 * Vì sao có: đợt 5 (chống PASS giả). `TrangChan.tsx` (S12, dự án helpdesk) — trang chặn toàn màn — qua verifier PASS + judge
 * APPROVE mà không route nào render nó: test gọi thẳng component nên xanh, verifier chạy Proof nên PASS, judge đọc
 * diff nên thấy code đẹp. spec-driven-eval gọi đây là "wiring I-check": handler test kỹ nằm sau endpoint chết vẫn
 * trượt. Câu hỏi "ai gọi file này?" là câu grep trả lời được — không tốn token của agent.
 *
 * gioiHan:
 *  - Quy ước entry (bỏ qua): `main|index|app|server|cli.*` ở gốc repo hoặc gốc `src/`; `*.config.*`, `.eslintrc.*`,
 *    `setupTests.*`, `(vitest|jest).workspace.*`, `*.d.ts`, `*.stories.*`, `middleware.*`/`instrumentation.*` (Next); Next `app/**\/(page|layout|
 *    route|loading|error|not-found|template|default|head|opengraph-image|icon|sitemap|robots).*` và `pages/**` (chỉ khi
 *    package.json gần nhất có `next`); Remix `app/routes/**`, SvelteKit `src/routes/**`, Nuxt `server/**`; Python
 *    `__init__.py`, `__main__.py`, `manage.py`, `wsgi.py`, `asgi.py`, `conftest.py`, `migrations/**`, `alembic/**`.
 *    `src/pages/**` của Vite/CRA KHÔNG là quy ước — phải có router import (đúng ca TrangChan).
 *  - Đọc CÂY LÀM VIỆC hiện tại (git ls-files -co), không đọc cây ở `<head>` — gọi với head ≠ HEAD thì kết quả theo
 *    working tree. Bỏ node_modules/dist/build/vendor/_ref/.next/coverage, file > 1 MB.
 *  - Resolver không hiểu alias ngoài `@/`, `~/`, tsconfig `paths` (dạng `x/*`); không hiểu webpack/vite alias khác,
 *    Python namespace package, import động dựng chuỗi, đăng ký bằng glob (`import.meta.glob`), DI container.
 *  - Export: chỉ tên giá trị (không `type`/`interface`), không `export default` (không có tên để tìm); tìm theo TỪ
 *    nên tên chung (`get`, `data`) dễ "có người dùng" giả — báo thiếu hơn báo thừa.
 *  - Test = `*.test.*` `*.spec.*` `__tests__/` `test/` `tests/` `e2e/` `test_*.py` `*_test.py` — tham chiếu từ test
 *    KHÔNG tính là nối (test gọi thẳng component là đúng cách TrangChan lọt).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const GIOI_HAN = [
  'entry theo quy ước bị bỏ qua (main/index/app/server/cli ở gốc hoặc src/, *.config.*, Next app/** + pages/** khi có next, Remix app/routes, SvelteKit src/routes, py __init__/__main__/manage/wsgi/asgi/migrations) — src/pages của Vite/CRA KHÔNG miễn',
  'đọc working tree (git ls-files -co), không đọc cây ở <head>',
  'alias chỉ `@/` `~/` và tsconfig paths; import.meta.glob/DI/chuỗi động → báo oan',
  'export chỉ tên giá trị, không default/type; tìm theo từ — tên chung dễ lọt',
  'tham chiếu từ file test KHÔNG tính là nối',
  'nối-đường-dẫn chỉ tính file mã + cấu hình thật (package.json, tsconfig, *.config.*, html, yml/toml, Dockerfile, route manifest) — .md/.jsonl/.json khác, docs/**, .claude/** KHÔNG nối mã dự án',
];
const NGUỒN = /\.(tsx?|jsx?|mjs|cjs|py)$/;
const BỎ_THƯ_MỤC = /(^|\/)(node_modules|dist|build|out|vendor|_ref|\.next|\.nuxt|coverage|\.git|\.venv|venv|__pycache__)(\/|$)/;
const LÀ_TEST = (f) => /(^|\/)(__tests__|tests?|e2e|__mocks__|fixtures?)\//.test(f) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(f) || /(^|\/)(test_[^/]+|[^/]+_test)\.py$/.test(f) || /(^|\/)conftest\.py$/.test(f);
// Nguồn tham chiếu hợp lệ cho `nối-đường-dẫn` ngoài file mã: cấu hình THẬT (không văn xuôi, không log, không json tuỳ ý)
const CẤU_HÌNH = /(^|\/)(package\.json|[tj]sconfig[^/]*\.json|(vercel|netlify|nest-cli|angular|project|nx|turbo|deno|app|manifest|firebase|lerna|now)\.json|[^/]*routes?[^/]*\.json|Dockerfile[^/]*|Containerfile|Makefile|Procfile|Justfile|\.babelrc|\.swcrc)$|\.(html?|ya?ml|toml|ini|cfg|conf|sh|bash|ps1|vue|svelte|astro)$/i;
const KHÔNG_BAO_GIỜ = /(^|\/)\.env(\.|$)|\.(md|mdx|txt|jsonl|log|csv)$/i;
const vùng = (f) => (/^\.claude\//.test(f) ? 'claude' : /^docs\//.test(f) ? 'docs' : 'dự-án');
/** `src` có được tính là người nối `đích` không (theo vùng + loại file). */
function nguồnHợpLệ(src, đích) {
  if (KHÔNG_BAO_GIỜ.test(src) && !(vùng(đích) === 'claude' && /^(\.claude\/(skills|agents|hooks|commands)\/.+\.md|CLAUDE\.md)$/.test(src))) return false;
  const vs = vùng(src), vđ = vùng(đích);
  const mãHoặcCấuHình = NGUỒN.test(src) || CẤU_HÌNH.test(src);
  if (vs === 'dự-án') return mãHoặcCấuHình || (vđ === 'claude' && src === 'CLAUDE.md');
  if (vs !== vđ) return false;
  if (vs === 'docs') return mãHoặcCấuHình;
  return /^\.claude\/(skills|agents|hooks|commands)\//.test(src) || /^\.claude\/settings[^/]*\.json$/.test(src);
}
const git = (root, args) => spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 1e8 });
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function làQuyƯớc(f, cóNext) {
  const b = path.basename(f); const d = path.dirname(f);
  if (/\.d\.ts$/.test(f) || /\.stories\.[cm]?[jt]sx?$/.test(f) || /\.config\.[cm]?[jt]s$/.test(b) || /^\.?eslintrc/.test(b) || /^setupTests\./.test(b) || /^(vitest|jest)\.workspace\.[cm]?[jt]s$/.test(b)) return 'config/khai báo';
  if (/^(main|index|app|server|cli)\.[cm]?[jt]sx?$/i.test(b) && (d === '.' || d === 'src')) return 'entry gốc';
  if (/^(middleware|instrumentation)\.[jt]s$/.test(b) && (d === '.' || d === 'src')) return 'Next middleware';
  if (/(^|\/)app\/(.*\/)?(page|layout|route|loading|error|not-found|template|default|head|opengraph-image|icon|sitemap|robots)\.[cm]?[jt]sx?$/.test(f)) return 'Next app router';
  if (cóNext && /(^|\/)pages\//.test(f)) return 'Next pages router';
  if (/(^|\/)app\/routes\//.test(f)) return 'Remix routes';
  if (/(^|\/)src\/routes\//.test(f) && /\+(page|layout|server)/.test(b)) return 'SvelteKit routes';
  if (/(^|\/)server\/(api|routes|middleware)\//.test(f)) return 'Nuxt server';
  if (/^(__init__|__main__|manage|wsgi|asgi|conftest)\.py$/.test(b) || /(^|\/)(migrations|alembic)\//.test(f)) return 'Python quy ước';
  return null;
}

/** package.json gần nhất có `next`? (cache theo thư mục) */
function cóNextGầnNhất(root, f, cache) {
  let d = path.dirname(f);
  for (;;) {
    if (cache.has(d)) return cache.get(d);
    const p = path.join(root, d, 'package.json');
    if (fs.existsSync(p)) { let v = false; try { const j = JSON.parse(fs.readFileSync(p, 'utf8')); v = !!({ ...j.dependencies, ...j.devDependencies }).next; } catch { /* */ } cache.set(d, v); return v; }
    if (d === '.' || d === '') { cache.set(d, false); return false; }
    d = path.dirname(d);
  }
}

function tsPaths(root) {
  const out = [];
  for (const n of ['tsconfig.json', 'jsconfig.json', 'tsconfig.app.json']) {
    let t; try { t = fs.readFileSync(path.join(root, n), 'utf8'); } catch { continue; }
    t = t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"])\/\/.*$/gm, '$1').replace(/,(\s*[}\]])/g, '$1');
    let j; try { j = JSON.parse(t); } catch { continue; }
    const co = j.compilerOptions || {}; const base = co.baseUrl || '.';
    for (const [k, vs] of Object.entries(co.paths || {})) for (const v of [].concat(vs)) {
      if (k.endsWith('/*') && v.endsWith('/*')) out.push([k.slice(0, -1), path.posix.join(base, v.slice(0, -1))]);
      else out.push([k, path.posix.join(base, v)]);
    }
  }
  return out;
}

const ĐUÔI = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
function giải(spec, từFile, tậpFile, paths) {
  const gốcTìm = [];
  if (spec.startsWith('.')) gốcTìm.push(path.posix.normalize(path.posix.join(path.posix.dirname(từFile), spec)));
  else {
    for (const [k, v] of paths) if (k.endsWith('/') ? spec.startsWith(k) : spec === k) gốcTìm.push(path.posix.normalize(k.endsWith('/') ? v + spec.slice(k.length) : v));
    if (/^[@~]\//.test(spec)) gốcTìm.push('src/' + spec.slice(2), spec.slice(2));
    if (spec.startsWith('/')) gốcTìm.push(spec.slice(1));
    if (/^src\//.test(spec)) gốcTìm.push(spec);
  }
  const ra = [];
  for (const g of gốcTìm) {
    const g2 = g.replace(/^\.\//, '');
    for (const e of ĐUÔI) if (tậpFile.has(g2 + e)) { ra.push(g2 + e); break; }
    // import './x.js' trỏ x.ts (TS ESM)
    const bỏĐuôi = g2.replace(/\.[cm]?jsx?$/, '');
    if (bỏĐuôi !== g2) for (const e of ['.ts', '.tsx']) if (tậpFile.has(bỏĐuôi + e)) ra.push(bỏĐuôi + e);
  }
  return ra;
}
function giảiPy(spec, từFile, tậpFile) {
  const ra = [];
  const thử = (mod) => { for (const e of ['.py', '/__init__.py']) for (const pre of ['', 'src/']) if (tậpFile.has(pre + mod + e)) ra.push(pre + mod + e); };
  if (spec.startsWith('.')) {
    const chấm = spec.match(/^\.+/)[0].length; let d = path.posix.dirname(từFile);
    for (let i = 1; i < chấm; i++) d = path.posix.dirname(d);
    const rest = spec.slice(chấm).replace(/\./g, '/');
    thử(path.posix.normalize(path.posix.join(d, rest || '.')).replace(/^\.\//, ''));
  } else {
    const parts = spec.split('.');
    for (let i = parts.length; i >= 1; i--) thử(parts.slice(0, i).join('/'));
  }
  return ra;
}

function quét(root, range) {
  if (!/\.\./.test(range)) range = `${range}..HEAD`;
  const ns = git(root, ['diff', '--name-status', '-M', range]);
  if (ns.status !== 0) return { lỗiGọi: `git diff ${range} hỏng: ${(ns.stderr || '').trim().split('\n')[0]}` };
  const mới = [], sửa = [];
  for (const l of ns.stdout.split('\n').filter(Boolean)) {
    const [st, ...ps] = l.split('\t'); const f = ps[ps.length - 1];
    if (!NGUỒN.test(f) || BỎ_THƯ_MỤC.test(f) || LÀ_TEST(f)) continue;
    if (st === 'A') mới.push(f); else if (/^[MR]/.test(st)) sửa.push(f);
  }
  const ls = git(root, ['ls-files', '-co', '--exclude-standard']);
  const tất = ls.stdout.split('\n').filter((f) => f && !BỎ_THƯ_MỤC.test(f));
  const tậpFile = new Set(tất);
  const nộiDung = new Map();
  const đọc = (f) => { if (nộiDung.has(f)) return nộiDung.get(f); let t = ''; try { const p = path.join(root, f); if (fs.statSync(p).size <= 1e6) t = fs.readFileSync(p, 'utf8'); } catch { /* */ } nộiDung.set(f, t); return t; };
  const nonTest = tất.filter((f) => !LÀ_TEST(f) && !/\.(png|jpe?g|gif|webp|ico|svg|woff2?|ttf|otf|pdf|zip|gz|lock|map|mp4|webm|db|sqlite)$/i.test(f) && !/(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(f));
  const nonTestCode = nonTest.filter((f) => NGUỒN.test(f));
  const paths = tsPaths(root);

  // Đồ thị import: file đích → [file nguồn]
  const bịImport = new Map();
  const RE_JS = /(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  const RE_PY = /^\s*(?:from\s+([.\w]+)\s+import\s+([\w, ()*]+)|import\s+([\w.]+(?:\s*,\s*[\w.]+)*))/gm;
  for (const f of nonTestCode) {
    const t = đọc(f); if (!t) continue;
    const đích = [];
    if (/\.py$/.test(f)) {
      for (const m of t.matchAll(RE_PY)) {
        if (m[1]) { đích.push(...giảiPy(m[1], f, tậpFile)); for (const n of m[2].replace(/[()]/g, '').split(',').map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean)) đích.push(...giảiPy(`${m[1]}${m[1].endsWith('.') ? '' : '.'}${n}`, f, tậpFile)); }
        if (m[3]) for (const n of m[3].split(',')) đích.push(...giảiPy(n.trim().split(/\s+as\s+/)[0], f, tậpFile));
      }
    } else for (const m of t.matchAll(RE_JS)) đích.push(...giải(m[1] || m[2] || m[3], f, tậpFile, paths));
    for (const d of new Set(đích)) if (d !== f && nguồnHợpLệ(f, d)) bịImport.set(d, (bịImport.get(d) || []).concat([f]));
  }

  const nextCache = new Map();
  const tìmChữ = (re, trừ, tập) => tập.filter((g) => g !== trừ && nguồnHợpLệ(g, trừ) && re.test(đọc(g)));
  const testCode = tất.filter((f) => LÀ_TEST(f) && NGUỒN.test(f));
  const files = [];
  for (const f of mới) {
    const qư = làQuyƯớc(f, cóNextGầnNhất(root, f, nextCache));
    if (qư) { files.push({ file: f, nhãn: 'quy-ước', lýDo: qư }); continue; }
    const imp = bịImport.get(f) || [];
    if (imp.length) { files.push({ file: f, nhãn: 'nối', bởi: imp.slice(0, 3) }); continue; }
    const b = path.basename(f);
    const đd = tìmChữ(new RegExp(`(^|[^\\w.-])${escRe(b)}(?![\\w-])`), f, nonTest);
    if (đd.length) { files.push({ file: f, nhãn: 'nối-đường-dẫn', bởi: đd.slice(0, 3) }); continue; }
    const stem = b.replace(/\.[^.]+$/, '');
    const tên = stem.length >= 4 && !/^(index|main|utils?|types?|helpers?|constants?)$/i.test(stem) ? tìmChữ(new RegExp(`\\b${escRe(stem)}\\b`), f, nonTestCode) : [];
    files.push(tên.length ? { file: f, nhãn: 'chỉ-nhắc-tên', bởi: tên.slice(0, 3) } : { file: f, nhãn: 'mồ-côi' });
  }

  // Export mới
  const diff = git(root, ['diff', '-U0', range, '--', ...[...mới, ...sửa]]);
  const exports = [], chỉTest = [];
  const bịBáo = new Set(files.filter((x) => /mồ-côi|chỉ-nhắc-tên/.test(x.nhãn)).map((x) => x.file));
  let cur = null;
  for (const l of (diff.stdout || '').split('\n')) {
    const h = l.match(/^\+\+\+ b\/(.+)$/); if (h) { cur = h[1]; continue; }
    if (!cur || !l.startsWith('+') || l.startsWith('+++') || bịBáo.has(cur)) continue;
    const s = l.slice(1); const tên = [];
    if (/\.py$/.test(cur)) { const m = s.match(/^(?:async\s+)?(?:def|class)\s+([A-Za-z]\w*)/); if (m) tên.push(m[1]); }
    else {
      const m = s.match(/^\s*export\s+(?:declare\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|enum|abstract\s+class)\s+([A-Za-z_$][\w$]*)/); if (m) tên.push(m[1]);
      const m2 = s.match(/^\s*export\s*\{([^}]*)\}\s*;?\s*$/); if (m2) for (const x of m2[1].split(',')) { const n = x.trim().split(/\s+as\s+/).pop(); if (n && !/^type\s/.test(x.trim()) && n !== 'default') tên.push(n); }
    }
    for (const n of tên) {
      if (n.startsWith('_')) continue;
      const re = new RegExp(`(^|[^\\w$])${escRe(n)}(?![\\w$])`);
      const khác = tìmChữ(re, cur, nonTestCode);
      if (khác.length) continue;
      const trong = đọc(cur).split('\n').filter((x) => re.test(x)).length;
      if (trong > 1) continue;
      const test = tìmChữ(re, cur, testCode);
      if (test.length) { chỉTest.push({ file: cur, tên: n, nhãn: 'chỉ-test-dùng', bởi: test.slice(0, 3) }); continue; }
      exports.push({ file: cur, tên: n, nhãn: 'export-mồ-côi' });
    }
  }
  const báo = files.filter((x) => /mồ-côi|chỉ-nhắc-tên/.test(x.nhãn)).length + exports.length;
  return { range, root, fileMới: mới.length, fileSửa: sửa.length, files, exports, chỉTest, báo, gioiHan: GIOI_HAN };
}

module.exports = { quét, làQuyƯớc, LÀ_TEST };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const opt = (n) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
  const range = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--root');
  if (!range) { console.error('Dùng: scan-wiring.js <base>..<head> [--root <repo>] [--plain|--json]'); process.exit(2); }
  const root = path.resolve(opt('--root') || process.cwd());
  const top = git(root, ['rev-parse', '--show-toplevel']);
  if (top.status !== 0) { console.error(`scan-wiring: ${root} không phải repo git`); process.exit(2); }
  const kq = quét(top.stdout.trim(), range);
  if (kq.lỗiGọi) { console.error(`scan-wiring: ${kq.lỗiGọi}`); process.exit(2); }
  // exitCode thay process.exit: JSON > 64 KB qua pipe bị cắt nếu thoát ngay sau console.log
  process.exitCode = Math.min(kq.báo, 125);
  if (argv.includes('--json')) { console.log(JSON.stringify(kq, null, 2)); return; }
  const đếm = (n) => kq.files.filter((x) => x.nhãn === n).length;
  console.log(`scan-wiring ${kq.range}: ${kq.fileMới} file nguồn mới · ${kq.fileSửa} file sửa → ${kq.báo} ứng viên chưa nối (mồ-côi ${đếm('mồ-côi')} · chỉ-nhắc-tên ${đếm('chỉ-nhắc-tên')} · export-mồ-côi ${kq.exports.length}) · chỉ-test-dùng ${kq.chỉTest.length} · nối ${đếm('nối')} · nối-đường-dẫn ${đếm('nối-đường-dẫn')} · quy-ước ${đếm('quy-ước')}`);
  for (const x of kq.files.filter((y) => /mồ-côi|chỉ-nhắc-tên/.test(y.nhãn))) console.log(`  ⚠️ ${x.nhãn} ${x.file}${x.bởi ? ` — tên có trong ${x.bởi.join(', ')} nhưng không ai import` : ' — không file non-test nào import/nhắc tới'}`);
  for (const x of kq.exports) console.log(`  ⚠️ export-mồ-côi ${x.file} → ${x.tên}`);
  for (const x of kq.chỉTest) console.log(`  🟢 chỉ-test-dùng ${x.file} → ${x.tên} (chỉ ${x.bởi.join(', ')} — đường nối cho test thì hợp lệ, handler chưa nối thì không)`);
  if (!argv.includes('--plain')) {
    for (const x of kq.files.filter((y) => y.nhãn === 'quy-ước')) console.log(`  · quy-ước ${x.file} (${x.lýDo})`);
    console.log(`  gioiHan: ${GIOI_HAN.join(' · ')}`);
  }
}
