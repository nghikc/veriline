#!/usr/bin/env node
/*
 * ba-migration/scan-coupling.js — ĐẾM ghép nối giữa các module của một codebase. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ba-migration/scripts/scan-coupling.js --root <code> [--docs docs] [--plain|--json]
 *                                                             [--nguong-canh 5] [--nguong-churn 5] [--ngay 90] [--tach-phang 40]
 *
 * Bốn việc, tất cả đều đếm được:
 *   (a) Liệt kê MODULE theo cấu trúc thư mục — không assume stack. Container nhận: `src/` `lib/` `app/`
 *       (module = thư mục cấp 1; cấp 1 chỉ chứa thư mục con thì xuống cấp 2), `packages/*` `apps/*`
 *       `services/*` `modules/*` `internal/` `pkg/` `cmd/` (mỗi con = một module), `src/main/java|kotlin`
 *       (gập chuỗi thư mục một-con `com/cty/app` rồi lấy con). File nằm thẳng ở gốc container → module `<container>/(gốc)`.
 *       Kích thước: số file mã + số dòng.
 *   (b) ĐỒ THỊ import: JS/TS `import … from` · `require()` · `export … from` · `import()`; Python `from x import` /
 *       `import x`; Go theo module path trong go.mod; Java/Kotlin theo package gốc. Chỉ tính đường dẫn NỘI BỘ
 *       (tương đối, alias `@/` `~/` `src/`, tên package workspace) — thư viện ngoài bị bỏ, không đếm.
 *   (c) CHURN 90 ngày mỗi module qua `git log --since` (số commit chạm module + số lần đổi file) và ĐỒNG-ĐỔI
 *       (hai module cùng nằm trong một commit) — ghép nối "ngầm" mà import không thấy. Commit "rộng" (chạm ≥3 module
 *       và quá nửa số module: init, format toàn repo) tính churn nhưng không tính đồng-đổi. Cặp KHÔNG có cạnh import chỉ
 *       xuất hiện trong bảng khi đồng-đổi ≥ 2. Không có git → `git: null`, cột trống, không phải lỗi.
 *   (d) Bảng CẶP module: cạnh mỗi chiều · chiều (→ ← ↔) · khoảng cách cấu trúc (cùng/khác container) · churn hai bên ·
 *       cờ `ghépNốiCao&hayĐổi` khi (tổng cạnh ≥ ngưỡng cạnh HOẶC hai chiều) VÀ (churn một bên ≥ ngưỡng churn).
 *       Ngưỡng in ra trong output; đổi bằng cờ. Đây là CỜ ĐẾM theo ngưỡng khai báo — LLM mới phán "nguy hiểm".
 *
 * Vì sao có: mô hình ba chiều mạnh · xa · hay đổi ("Balancing Coupling in Software Design") nói cặp đáng tách trước
 * là cặp ghép mạnh + xa + hay đổi. Chiều "mạnh" (intrusive/functional/model/contract) cần đọc code — việc của LLM;
 * nhưng SỐ CẠNH, CHIỀU, KHOẢNG CÁCH CẤU TRÚC và CHURN là số, và số thì máy đếm chính xác hơn người đọc 300 file.
 * Không có script này, "module A ghép chặt B" trong 00-migration.md là cảm giác; có nó, là 47 cạnh và 12 commit.
 *
 * Không có container nào → in "không thấy module code", exit 0 (repo không phải app là kết quả hợp lệ — chính repo
 * toolkit này là một). Exit 2 chỉ khi --root không tồn tại.
 *
 * gioiHan: (0) tách module phẳng theo tiền tố tên file là HEURISTIC (useX → "use*"), LLM ghép lại thành domain; (1) không đọc tsconfig `paths` — alias ngoài `@/` `~/` `src/` rơi vào `khôngPhânGiải` (có đếm); (2) không
 * phân biệt import type-only với import chạy; (3) Ruby/PHP/C#/Rust chỉ đếm kích thước, không dựng cạnh; (4) chỉ báo vòng
 * 2 module (A↔B), vòng dài hơn không tìm; (5) churn theo commit, không theo tác giả/đội — "khoảng cách xã hội" phải hỏi
 * người; (6) không đo độ MẠNH của ghép nối (đó là đọc code); (7) bỏ node_modules/dist/build/vendor/.git/… và `_ref/`.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const ROOT_ARG = path.resolve(opt('--root', '.'));
const DOCS = argv.includes('--docs') ? path.resolve(opt('--docs', 'docs')) : null;
const JSON_MODE = argv.includes('--json');
const NG_CẠNH = +opt('--nguong-canh', 5);
const NG_PHẲNG = +opt('--tach-phang', 40); // module PHẲNG ≥ N file mã trực tiếp → tách theo tiền tố tên file (0 = tắt)
const NG_CHURN = +opt('--nguong-churn', 5);
const NGÀY = +opt('--ngay', 90);
if (!fs.existsSync(ROOT_ARG)) { console.error(`Không thấy --root ${ROOT_ARG}`); process.exit(2); }
// realpath: `git rev-parse --show-toplevel` trả đường dẫn THẬT (macOS: /var → /private/var); không đồng bộ thì
// file trong git log không khớp prefix module nào → churn = 0 lặng lẽ. Bẫy đã dính ở chính ca test.
const ROOT = fs.realpathSync(ROOT_ARG);

const BỎ = /^(node_modules|dist|build|out|\.next|\.nuxt|coverage|vendor|\.git|__pycache__|target|\.venv|venv|\.idea|\.vscode|_ref|\.claude|\.turbo|\.cache)$/;
const MÃ = /\.(js|mjs|cjs|jsx|ts|mts|cts|tsx|py|go|java|kt|rb|php|cs|rs|vue|svelte)$/;
const CÓ_CẠNH = /\.(js|mjs|cjs|jsx|ts|tsx|vue|svelte|py|go|java|kt)$/;

const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const isFile = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };
const lsDirs = (p) => isDir(p) ? fs.readdirSync(p, { withFileTypes: true }).filter((e) => e.isDirectory() && !BỎ.test(e.name)).map((e) => e.name).sort() : [];
const lsCode = (p) => isDir(p) ? fs.readdirSync(p, { withFileTypes: true }).filter((e) => e.isFile() && MÃ.test(e.name)).map((e) => e.name) : [];
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

// ---------- (a) module ----------
const modules = []; // { tên, dir(abs), container, files, lines }
const ghiChú = [];
function thêmModule(dir, container) {
  if (modules.some((m) => m.dir === dir)) return;
  modules.push({ tên: rel(dir), dir, container, files: 0, lines: 0 });
}
function cóMãBênTrong(dir, sâu = 0) {
  if (sâu > 6) return false;
  if (lsCode(dir).length) return true;
  return lsDirs(dir).some((d) => cóMãBênTrong(path.join(dir, d), sâu + 1));
}
// gập chuỗi thư mục một-con (java: src/main/java/com/cty/app)
function gập(dir) {
  let d = dir; let n = 0;
  while (n < 8 && !lsCode(d).length && lsDirs(d).length === 1) { d = path.join(d, lsDirs(d)[0]); n++; }
  return d;
}
const CONTAINER_CẤP12 = ['src', 'lib', 'app', 'src-tauri/src'];
const CONTAINER_CON = ['packages', 'apps', 'services', 'modules', 'internal', 'pkg', 'cmd'];
const CONTAINER_JVM = ['src/main/java', 'src/main/kotlin'];
const gốcJVM = {};
for (const c of CONTAINER_JVM) {
  const d = path.join(ROOT, c);
  if (!isDir(d)) continue;
  const g = gập(d); gốcJVM[c] = g;
  for (const sub of lsDirs(g)) if (cóMãBênTrong(path.join(g, sub))) thêmModule(path.join(g, sub), c);
  if (lsCode(g).length) thêmModule(g, c);
}
for (const c of CONTAINER_CẤP12) {
  const d = path.join(ROOT, c);
  if (!isDir(d)) continue;
  const cóJVM = Object.keys(gốcJVM).some((k) => k.startsWith(c + '/'));
  const gốcCóFile = lsCode(d).length > 0;
  for (const sub of lsDirs(d)) {
    if (cóJVM && /^(main|test)$/.test(sub)) continue; // src/main|test đã đi qua nhánh JVM
    const p = path.join(d, sub);
    if (!cóMãBênTrong(p)) continue;
    // cấp 1 chỉ chứa thư mục con (không file mã trực tiếp) → xuống cấp 2
    if (!lsCode(p).length && lsDirs(p).length >= 2) {
      let n = 0;
      for (const s2 of lsDirs(p)) if (cóMãBênTrong(path.join(p, s2))) { thêmModule(path.join(p, s2), c); n++; }
      if (!n) thêmModule(p, c);
    } else thêmModule(p, c);
  }
  if (gốcCóFile) { const m = { tên: `${c}/(gốc)`, dir: d, container: c, files: 0, lines: 0, chỉGốc: true }; modules.push(m); }
}
for (const c of CONTAINER_CON) {
  const d = path.join(ROOT, c);
  if (!isDir(d)) continue;
  for (const sub of lsDirs(d)) if (cóMãBênTrong(path.join(d, sub))) thêmModule(path.join(d, sub), c);
}
if (!modules.length) {
  const kq = { root: ROOT, modules: [], cạnh: [], cặp: [], git: null, ghiChú: ['không thấy module code — không có container nào trong: src/ lib/ app/ packages/ apps/ services/ modules/ internal/ pkg/ cmd/ src/main/java|kotlin. Repo không phải app (hoặc code nằm chỗ khác → --root).'] };
  if (JSON_MODE) console.log(JSON.stringify(kq, null, 2)); else console.log(`scan-coupling: ${kq.ghiChú[0]}`);
  process.exit(0);
}

// Module PHẲNG (dự án desktop: src/lib 484 file một tầng, domain nằm ở TIỀN TỐ tên file — agent*, ai*, activity*…): thư mục không nói
// gì về domain thì tên file nói. Mỗi tiền tố ≥ 3 file thành một module ảo `<dir>/<tiền tố>*`; phần còn lại giữ tên module cũ.
// Tiền tố = từ đầu camelCase/snake_case của tên file (bỏ .test/.spec). Tắt bằng --tach-phang 0; ngưỡng mặc định 40 file.
const tiềnTốCủa = (name) => { const b = name.replace(/\.(test|spec|stories)\.[^.]+$/, '').replace(/\.[^.]+$/, ''); const m = b.match(/^([a-z0-9]+)(?=[A-Z_.-]|$)/) || b.match(/^([A-Z][a-z0-9]+)/); return m ? m[1].toLowerCase() : null; };
if (NG_PHẲNG > 0) {
  for (const m of [...modules]) {
    const trựcTiếp = lsCode(m.dir); if (trựcTiếp.length < NG_PHẲNG) continue;
    const nhóm = {}; for (const n of trựcTiếp) { const t = tiềnTốCủa(n); if (t) (nhóm[t] = nhóm[t] || []).push(n); }
    const đủ = Object.entries(nhóm).filter(([, v]) => v.length >= 3).sort((a, b) => b[1].length - a[1].length);
    if (đủ.length < 2) continue;
    for (const [t] of đủ) modules.push({ tên: `${m.tên.replace(/\/\(gốc\)$/, '')}/${t}*`, dir: m.dir, container: m.container, files: 0, lines: 0, chỉGốc: true, tiềnTố: t });
    if (!m.chỉGốc) { m.chỉGốc = true; m.tên = m.tên + '/(còn lại)'; }
    ghiChú.push(`${rel(m.dir)}: module phẳng ${trựcTiếp.length} file → tách ${đủ.length} module theo tiền tố tên file (${đủ.slice(0, 6).map(([t, v]) => t + '* ' + v.length).join(' · ')}${đủ.length > 6 ? ' · …' : ''}); --tach-phang 0 để tắt`);
  }
}
// gán file → module (prefix dài nhất thắng; module "(gốc)" chỉ nhận file nằm thẳng trong container; module tiền tố nhận
// file cùng thư mục có tiền tố khớp, ưu tiên trước "(gốc)"/"(còn lại)")
const modCủa = (abs) => {
  let best = null;
  const d = path.dirname(abs), tt = tiềnTốCủa(path.basename(abs));
  for (const m of modules) if (m.tiềnTố && m.dir === d && m.tiềnTố === tt) return m;
  for (const m of modules) {
    if (m.tiềnTố) continue;
    if (m.chỉGốc) { if (path.dirname(abs) === m.dir) return m; continue; }
    if (abs === m.dir || abs.startsWith(m.dir + path.sep)) if (!best || m.dir.length > best.dir.length) best = m;
  }
  return best;
};
const fileList = []; // { abs, mod }
function quét(dir, sâu = 0) {
  if (sâu > 12) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!BỎ.test(e.name)) quét(path.join(dir, e.name), sâu + 1); }
    else if (MÃ.test(e.name)) { const abs = path.join(dir, e.name); const m = modCủa(abs); if (m) fileList.push({ abs, mod: m }); }
  }
}
for (const m of modules) if (!m.chỉGốc) quét(m.dir); else for (const f of lsCode(m.dir)) { const abs = path.join(m.dir, f); const mm = modCủa(abs); if (mm === m) fileList.push({ abs, mod: m }); }
// module bị tách phẳng vẫn có thư mục con → quét đệ quy phần con, file trực tiếp đã gán ở trên
for (const m of modules) if (m.chỉGốc && !m.tiềnTố && !/\(gốc\)$/.test(m.tên)) for (const sub of lsDirs(m.dir)) quét(path.join(m.dir, sub));
const đãThấy = new Set(); const files = [];
for (const f of fileList) if (!đãThấy.has(f.abs)) { đãThấy.add(f.abs); files.push(f); }
for (const f of files) { f.mod.files++; try { f.mod.lines += fs.readFileSync(f.abs, 'utf8').split('\n').length; } catch { /* bỏ */ } }

// ---------- (b) đồ thị import ----------
// tên package workspace → module (packages/*/package.json "name")
const tênPkg = {};
for (const m of modules) {
  const pj = path.join(m.dir, 'package.json');
  if (isFile(pj)) { try { const n = JSON.parse(fs.readFileSync(pj, 'utf8')).name; if (n) tênPkg[n] = m; } catch { /* bỏ */ } }
}
let goModule = null;
if (isFile(path.join(ROOT, 'go.mod'))) { const m = fs.readFileSync(path.join(ROOT, 'go.mod'), 'utf8').match(/^module\s+(\S+)/m); if (m) goModule = m[1]; }
const gốcPkgJVM = Object.values(gốcJVM).map((g) => ({ abs: g, pkg: rel(g).replace(/^src\/main\/(java|kotlin)\/?/, '').split('/').filter(Boolean).join('.') }));
const tênPy = {}; for (const m of modules) tênPy[path.basename(m.dir)] = m;

const EXT_THỬ = ['', '.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte', '.py', '/index.ts', '/index.tsx', '/index.js', '/index.jsx', '/__init__.py'];
function phânGiảiĐường(p) {
  for (const e of EXT_THỬ) { const q = p + e; if (isFile(q)) return q; }
  if (isDir(p)) return p; // thư mục cũng đủ để tìm module
  return null;
}
function đíchJS(spec, từFile) {
  if (spec.startsWith('.')) return phânGiảiĐường(path.resolve(path.dirname(từFile), spec));
  if (/^(@\/|~\/)/.test(spec)) return phânGiảiĐường(path.join(ROOT, 'src', spec.slice(2)));
  if (spec.startsWith('src/')) return phânGiảiĐường(path.join(ROOT, spec));
  for (const n of Object.keys(tênPkg)) if (spec === n || spec.startsWith(n + '/')) return tênPkg[n].dir;
  return undefined; // ngoài (thư viện) — không đếm
}
function đíchPy(spec, từFile, cấpTương) {
  if (cấpTương > 0) { let d = path.dirname(từFile); for (let i = 1; i < cấpTương; i++) d = path.dirname(d); return phânGiảiĐường(path.join(d, ...spec.split('.').filter(Boolean))); }
  const đầu = spec.split('.')[0];
  if (CONTAINER_CẤP12.includes(đầu)) return phânGiảiĐường(path.join(ROOT, ...spec.split('.'))); // `from src.billing.x import`
  if (tênPy[đầu]) return phânGiảiĐường(path.join(path.dirname(tênPy[đầu].dir), ...spec.split('.')));
  // gói nằm thẳng trong container (src/pkg/…) — thử từng container
  for (const c of CONTAINER_CẤP12) { const q = phânGiảiĐường(path.join(ROOT, c, ...spec.split('.'))); if (q) return q; }
  return undefined;
}
function đíchGo(spec) {
  if (!goModule || !(spec === goModule || spec.startsWith(goModule + '/'))) return undefined;
  return phânGiảiĐường(path.join(ROOT, spec.slice(goModule.length).replace(/^\//, '')));
}
function đíchJVM(spec) {
  for (const g of gốcPkgJVM) if (!g.pkg || spec.startsWith(g.pkg + '.')) {
    const phần = (g.pkg ? spec.slice(g.pkg.length + 1) : spec).split('.');
    phần.pop(); // bỏ tên lớp
    const q = phânGiảiĐường(path.join(g.abs, ...phần)); if (q) return q;
  }
  return undefined;
}
const cạnhMap = new Map(); // "a|b" → { từ, đến, n, files:Set }
let khôngPhânGiải = 0, tổngImportNộiBộ = 0;
const ghi = (từ, đến, file) => {
  if (!đến || đến === từ) return;
  const k = từ.tên + '|' + đến.tên; const e = cạnhMap.get(k) || { từ: từ.tên, đến: đến.tên, n: 0, files: new Set() };
  e.n++; e.files.add(rel(file)); cạnhMap.set(k, e);
};
const RE_JS = /(?:^|[^\w$])(?:import\s+(?:[^'"`;]*?\s+from\s+)?|export\s+[^'"`;]*?\s+from\s+|require\s*\(\s*|import\s*\(\s*)['"]([^'"\n]+)['"]/g;
const RE_PY = /^\s*(?:from\s+(\.*)([\w.]*)\s+import\b|import\s+([\w.]+))/gm;
const RE_GO = /^\s*(?:import\s+(?:\w+\s+)?"([^"]+)"|\t(?:\w+\s+)?"([^"]+)")/gm;
const RE_JVM = /^\s*import\s+(?:static\s+)?([\w.]+)(?:\.\*)?\s*;?/gm;
for (const f of files) {
  if (!CÓ_CẠNH.test(f.abs)) continue;
  let src; try { src = fs.readFileSync(f.abs, 'utf8'); } catch { continue; }
  const ext = path.extname(f.abs);
  const xử = (đích) => { if (đích === undefined) return; tổngImportNộiBộ++; if (đích === null) { khôngPhânGiải++; return; } const m = modCủa(đích); if (m) ghi(f.mod, m, f.abs); };
  if (/\.(js|mjs|cjs|jsx|ts|tsx|vue|svelte)$/.test(ext)) { let m; while ((m = RE_JS.exec(src))) xử(đíchJS(m[1], f.abs)); }
  else if (ext === '.py') { let m; while ((m = RE_PY.exec(src))) { const spec = m[2] !== undefined ? m[2] : m[3]; xử(đíchPy(spec || '', f.abs, (m[1] || '').length)); } }
  else if (ext === '.go') { let m; while ((m = RE_GO.exec(src))) xử(đíchGo(m[1] || m[2])); }
  else if (/\.(java|kt)$/.test(ext)) { let m; while ((m = RE_JVM.exec(src))) xử(đíchJVM(m[1])); }
}
const cạnh = [...cạnhMap.values()].map((e) => ({ từ: e.từ, đến: e.đến, n: e.n, files: e.files.size })).sort((a, b) => b.n - a.n);

// ---------- (c) churn ----------
let git = null; const churn = {}; const đồngĐổi = new Map();
const g = spawnSync('git', ['-C', ROOT, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
if (g.status === 0) {
  const top = g.stdout.trim();
  const log = spawnSync('git', ['-C', ROOT, 'log', `--since=${NGÀY}.days`, '--format=%H', '--name-only', '--', '.'], { encoding: 'utf8', maxBuffer: 1e8 });
  if (log.status === 0) {
    git = { top: top, ngày: NGÀY, commits: 0, commitRộng: 0 };
    for (const m of modules) churn[m.tên] = { commits: 0, fileĐổi: 0 };
    const khối = log.stdout.split(/\n(?=[0-9a-f]{40}\n)/).filter((s) => /^[0-9a-f]{40}/.test(s));
    git.commits = khối.length;
    // commit "rộng" (chạm ≥3 module VÀ > nửa số module — init, format toàn repo, đổi tên hàng loạt) vẫn tính churn
    // nhưng KHÔNG tính đồng-đổi: một commit init làm mọi cặp "cùng đổi 1 lần" là nhiễu, không phải tín hiệu.
    const trầnRộng = Math.max(3, Math.ceil(modules.length / 2) + 1);
    for (const k of khối) {
      const dòng = k.split('\n').slice(1).filter(Boolean);
      const chạm = new Set();
      for (const p of dòng) {
        const abs = path.resolve(top, p); const m = modCủa(abs);
        if (m) { churn[m.tên].fileĐổi++; chạm.add(m.tên); }
      }
      for (const t of chạm) churn[t].commits++;
      if (chạm.size >= trầnRộng) { git.commitRộng++; continue; }
      const ds = [...chạm].sort();
      for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) { const key = ds[i] + '|' + ds[j]; đồngĐổi.set(key, (đồngĐổi.get(key) || 0) + 1); }
    }
  }
}
if (!git) ghiChú.push('không có git (hoặc git log lỗi) — cột churn/đồng-đổi để trống');

// ---------- (d) bảng cặp ----------
const cặpMap = new Map();
for (const e of cạnh) {
  const [a, b] = [e.từ, e.đến].sort(); const k = a + '|' + b;
  const c = cặpMap.get(k) || { a, b, aĐếnB: 0, bĐếnA: 0 };
  if (e.từ === a) c.aĐếnB += e.n; else c.bĐếnA += e.n;
  cặpMap.set(k, c);
}
for (const [k, n] of đồngĐổi) if (!cặpMap.has(k) && n >= 2) { const [a, b] = k.split('|'); cặpMap.set(k, { a, b, aĐếnB: 0, bĐếnA: 0, chỉĐồngĐổi: true, đồngĐổi: n }); }
const contCủa = Object.fromEntries(modules.map((m) => [m.tên, m.container]));
const cặp = [...cặpMap.values()].map((c) => {
  const tổng = c.aĐếnB + c.bĐếnA;
  const chiều = c.aĐếnB && c.bĐếnA ? '↔' : c.aĐếnB ? '→' : c.bĐếnA ? '←' : '—';
  const churnA = git ? churn[c.a].commits : null, churnB = git ? churn[c.b].commits : null;
  const ghépCao = tổng >= NG_CẠNH || chiều === '↔';
  const hayĐổi = git ? Math.max(churnA, churnB) >= NG_CHURN : null;
  return {
    a: c.a, b: c.b, aĐếnB: c.aĐếnB, bĐếnA: c.bĐếnA, tổngCạnh: tổng, chiều, vòng: chiều === '↔',
    khoảngCách: contCủa[c.a] === contCủa[c.b] ? 'cùng container' : `khác container (${contCủa[c.a]} ↔ ${contCủa[c.b]})`,
    churnA, churnB, đồngĐổi: đồngĐổi.get(c.a + '|' + c.b) || 0,
    ghépNốiCao: ghépCao, hayĐổi, cờ: ghépCao && hayĐổi === true,
  };
}).sort((x, y) => (y.cờ - x.cờ) || (y.tổngCạnh - x.tổngCạnh) || (y.đồngĐổi - x.đồngĐổi));

// ---------- docs (tuỳ chọn): danh sách F.. + có 10-architecture chưa ----------
let docs = null;
if (DOCS) {
  docs = { functions: [], có10: false, có02: false };
  const f02 = path.join(DOCS, '02-functions.md');
  if (isFile(f02)) {
    docs.có02 = true;
    for (const m of fs.readFileSync(f02, 'utf8').matchAll(/^\|\s*(F\d+)\s*\|\s*([^|]+?)\s*\|/gm)) docs.functions.push({ id: m[1], tên: m[2] });
  }
  docs.có10 = isFile(path.join(DOCS, '10-architecture.md'));
}

const kq = {
  root: ROOT, ngưỡng: { cạnh: NG_CẠNH, churn: NG_CHURN, ngày: NGÀY },
  modules: modules.map((m) => ({ tên: m.tên, container: m.container, files: m.files, lines: m.lines, churn: git ? churn[m.tên] : null })).sort((a, b) => b.lines - a.lines),
  tổng: { modules: modules.length, files: files.length, lines: modules.reduce((n, m) => n + m.lines, 0), cạnh: cạnh.length, importNộiBộ: tổngImportNộiBộ, khôngPhânGiải, vòng2: cặp.filter((c) => c.vòng).length, cờ: cặp.filter((c) => c.cờ).length },
  cạnh, cặp, git, docs, ghiChú,
};
if (JSON_MODE) { console.log(JSON.stringify(kq, null, 2)); process.exit(0); }

const t = kq.tổng;
console.log(`scan-coupling: ${kq.root} · ${t.modules} module · ${t.files} file · ${t.lines} dòng · ${t.cạnh} cạnh import (${t.importNộiBộ} import nội bộ, ${t.khôngPhânGiải} không phân giải) · ${t.vòng2} cặp hai chiều · ${t.cờ} cặp cờ ⚠️${git ? ` · git ${git.commits} commit/${NGÀY} ngày (${git.commitRộng} commit rộng không tính đồng-đổi)` : ' · không có git'}`);
console.log(`  ngưỡng cờ: tổng cạnh ≥ ${NG_CẠNH} hoặc hai chiều, VÀ churn ≥ ${NG_CHURN} commit/${NGÀY} ngày ở ít nhất một bên (--nguong-canh/--nguong-churn/--ngay)`);
console.log('\n  MODULE');
console.log('  | Module | Container | File | Dòng | Commit/' + NGÀY + 'ng | File đổi |');
for (const m of kq.modules) console.log(`  | ${m.tên} | ${m.container} | ${m.files} | ${m.lines} | ${m.churn ? m.churn.commits : '—'} | ${m.churn ? m.churn.fileĐổi : '—'} |`);
if (cặp.length) {
  console.log('\n  CẶP MODULE');
  console.log('  | A | B | A→B | B→A | Chiều | Khoảng cách | Churn A | Churn B | Đồng-đổi | Cờ |');
  for (const c of cặp) console.log(`  | ${c.a} | ${c.b} | ${c.aĐếnB} | ${c.bĐếnA} | ${c.chiều} | ${c.khoảngCách} | ${c.churnA ?? '—'} | ${c.churnB ?? '—'} | ${c.đồngĐổi} | ${c.cờ ? '⚠️ ghép nối cao & hay đổi' : c.vòng ? '↔ vòng' : ''} |`);
} else console.log('\n  không có cạnh import nội bộ nào giữa các module (hoặc ngôn ngữ chưa dựng được cạnh — xem gioiHan)');
if (docs) console.log(`\n  docs: 02-functions.md ${docs.có02 ? `có (${docs.functions.length} F..)` : 'không có'} · 10-architecture.md ${docs.có10 ? 'có' : 'không có'}`);
for (const n of ghiChú) console.log(`  ⚠️  ${n}`);
process.exit(0);
