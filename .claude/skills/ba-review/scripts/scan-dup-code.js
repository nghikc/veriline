#!/usr/bin/env node
/*
 * ba-review/scan-dup-code.js — LOGIC NGHIỆP VỤ nào đang bị VIẾT LẶP giữa các module code?
 *
 *   node .claude/skills/ba-review/scripts/scan-dup-code.js --root <code> [--docs <docs>] [--json] [--strict]
 *        [--min-mang 3] [--min-khoa 3] [--tran-module 4] [--tach-phang 40]
 *
 * Vì sao tồn tại: `scan-dup-rules.js` bắt luật phát biểu lại ở nhiều màn TRONG TÀI LIỆU. Nửa kia của cùng
 * bệnh nằm trong CODE: một luật cài hai nơi thì sửa một nơi, nơi kia vẫn sai — và mọi ca kiểm của nơi được sửa
 * đều xanh. Ca thật dự án helpdesk: J-01 sửa hết phiên ở S12 mà S16 vẫn nguyên lỗi (WI-46); WI-44 hai đường tính giờ
 * làm việc, một đọc bảng `ngay_lam_viec`, một dùng hằng `LICH_CHUAN` — trùng khít chỉ vì seed trùng; WI-53 các màn
 * đọc `phan_quyen_ticket` làm phạm vi với điều kiện khác nhau. Không cổng nào đo TRÙNG LẶP giữa module.
 *
 * Vì sao là script MỚI chứ không thêm `--root` vào scan-dup-rules.js: đầu vào (cây code, module), hình output
 * (vị trí file:line theo module) và exit (`--strict`) đều khác; ca 3g ghim hình JSON của chế độ tài liệu. Nhồi hai
 * chế độ vào một file thì cả hai cứng lại. Phần "luật từ tài liệu" GỌI scan-dup-rules.js (checker có sẵn được gọi,
 * không cài lại).
 *
 * Bốn phép đếm (ĐẾM, không phán — mỗi nhóm là ỨNG VIÊN để ac-judge / ba-conformance / ba-migration đọc):
 *   (1) luat-nhieu-ban — (1a) BRule được ≥2 màn trích (scan-dup-rules.js trên --docs): định danh trong backtick của
 *       luật → module có ĐỊNH NGHĨA (function/const/class/method) trùng tên chuẩn hoá hoặc tên gần giống, hoặc có
 *       truy vấn bảng cùng tên; ≥2 module = một luật, nhiều bản cài. (1b) độc lập tài liệu: cùng tên định nghĩa
 *       chuẩn hoá (bỏ đuôi Sql/Db/Query/Impl/Async/V2…) ở ≥2 module, tên ≥2 từ và không toàn từ chung.
 *   (2) nguon-doi — literal nghiệp vụ lặp Y HỆT ở ≥2 module: mảng chuỗi (≥ --min-mang phần tử) / union kiểu chuỗi,
 *       regex, hằng số có tên chung một từ, map cấu hình literal (≥ --min-khoa khoá). Và `hinh-bang`: hằng object
 *       cấp đỉnh mà ≥ --min-khoa khoá trùng CỘT của một bảng DB đang được code đọc → dữ liệu có hai nguồn (WI-44).
 *   (3) loc-khac — cùng bảng/model bị ĐỌC ở ≥2 module, hai nơi cùng lọc theo ≥1 cột chung (≠ `id`) nhưng một nơi
 *       có thêm điều kiện nơi kia không có (tập cột lồng nhau, khác nhau) → cùng câu hỏi, hai câu trả lời (WI-53).
 *       Nhận: Prisma `x.model.findMany/findFirst/findUnique/count/aggregate/groupBy({ where })`, SQL trong chuỗi
 *       (`FROM t [alias] WHERE …`), knex `db('t').where(…)`, supabase `.from('t').eq(…)`.
 *
 * Module chia theo cách của ba-migration/scan-coupling.js (a): container `src/ lib/ app/ src-tauri/src` cấp 1 (cấp 1
 * chỉ chứa thư mục → cấp 2), `packages/ apps/ services/ modules/ internal/ pkg/ cmd/` mỗi con một module, file thẳng
 * ở gốc container → `<c>/(gốc)`, module phẳng ≥ --tach-phang file → tách theo tiền tố tên file. Chép lại ở đây vì
 * ba-migration là skill thử nghiệm (không cài mặc định) — không được phụ thuộc. File ngoài mọi container → module
 * = 4 cấp thư mục đầu (vd `web/src/screens/S12`).
 *
 * Bỏ: node_modules/dist/build/vendor/.git/_ref/.claude…, test (`*.test.*` `*.spec.*` `__tests__/ tests/ test/ e2e/`),
 * seed, migration, fixture, mock, generated, `*.d.ts`, stories. Literal chung (≤2 ký tự, `id` `name` `true`…) không tính.
 *
 * Exit 0 luôn (mồi, không phải cổng); `--strict` exit = số nhóm (trần 125); 2 khi --root không tồn tại.
 *
 * gioiHan:
 *  - TÊN TRÙNG MÀ NGHĨA KHÁC: hai hàm cùng tên chuẩn hoá có thể làm hai việc khác nhau; hai bảng đọc với điều kiện
 *    khác có thể là hai câu hỏi hợp lệ khác nhau (phạm vi XEM ≠ phạm vi PHỤ TRÁCH). Script không đọc nghĩa.
 *  - HẰNG KHAI LẠI TRONG TEST không tính (test bị bỏ) — nhưng vì thế một hằng chỉ lặp giữa code và test không lộ.
 *  - literal số chỉ tính khi là HẰNG CÓ TÊN cấp đỉnh; ngưỡng viết thẳng trong `if (x > 72)` không thấy.
 *  - regex/mảng/map so Y HỆT (mảng so theo tập giá trị) — chép rồi sửa một ký tự là không thấy.
 *  - truy vấn: chỉ Prisma/SQL-trong-chuỗi/knex/supabase; ORM khác (TypeORM, Sequelize, Drizzle, SQLAlchemy, Rust
 *    sqlx/rusqlite) không dựng điều kiện lọc. Điều kiện động (object `where` dựng từ biến) chỉ thấy phần literal.
 *  - định nghĩa: JS/TS/Python/Go/Rust theo regex dòng, không AST; method lớp chỉ khi thụt 2–4 dấu cách.
 *  - (1a) chỉ qua BRule mà scan-dup-rules.js thấy (≥2 màn, có backtick) — luật chỉ ở một màn không vào.
 *  - bảng cột (hinh-bang) lấy từ schema.prisma, `CREATE TABLE` trong .sql, knex `createTable` — schema khác không đọc.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) && argv[argv.indexOf(k) + 1] !== undefined ? argv[argv.indexOf(k) + 1] : d);
const JSON_MODE = argv.includes('--json');
const STRICT = argv.includes('--strict');
const MIN_MẢNG = +opt('--min-mang', 3);
const MIN_KHOÁ = +opt('--min-khoa', 3);
const TRẦN_MODULE = +opt('--tran-module', 4);
const NG_PHẲNG = +opt('--tach-phang', 40);
const ROOT_ARG = path.resolve(opt('--root', '.'));
if (!fs.existsSync(ROOT_ARG)) { console.error(`Không thấy --root ${ROOT_ARG}\nSửa: --root phải trỏ tới thư mục code có thật của dự án.`); process.exit(2); }
const ROOT = fs.realpathSync(ROOT_ARG);
const DOCS = (() => {
  if (argv.includes('--docs')) return path.resolve(opt('--docs', 'docs'));
  for (const d of [path.join(ROOT, 'docs'), path.join(ROOT, '..', 'docs')]) if (fs.existsSync(d)) return d;
  return null;
})();

const BỎ_DIR = /^(node_modules|dist|build|out|\.next|\.nuxt|coverage|vendor|\.git|__pycache__|target|\.venv|venv|\.idea|\.vscode|_ref|\.claude|\.turbo|\.cache|graphify-out|test-results|playwright-report)$/;
const TEST_DIR = /^(__tests__|tests?|e2e|spec|specs|fixtures?|__fixtures__|mocks?|__mocks__|seeds?|migrations?|generated|__generated__|stories|storybook)$/i;
const TEST_FILE = /(\.(test|spec|stories|e2e|fixture|fixtures|mock)\.[^.]+$)|(\.d\.ts$)|(\.gen\.[^.]+$)|(_test\.go$)|(^test_.*\.py$)|(_test\.py$)|(^seed[-_.]|[-_.]seed\.)/i;
const MÃ = /\.(js|mjs|cjs|jsx|ts|mts|cts|tsx|py|go|rs|vue|svelte)$/;
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

// ---------- đi cây: file mã (ngoài test) + file schema (kể cả migration) ----------
const files = []; const schemaFiles = []; let bỏTest = 0;
(function đi(d, sâu, trongTest) {
  if (sâu > 14) return;
  let ents = []; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!BỎ_DIR.test(e.name)) đi(p, sâu + 1, trongTest || TEST_DIR.test(e.name)); continue; }
    if (e.name === 'schema.prisma' || /\.sql$/i.test(e.name)) { schemaFiles.push(p); continue; }
    if (!MÃ.test(e.name)) continue;
    if (trongTest && /migrations?/i.test(p) && /\.(ts|js|mjs|cjs)$/.test(e.name)) schemaFiles.push(p); // knex createTable
    if (trongTest || TEST_FILE.test(e.name)) { bỏTest++; continue; }
    files.push(p);
  }
})(ROOT, 0, false);

// ---------- module (theo scan-coupling (a)) ----------
const lsCache = new Map();
const lsCode = (dir) => { if (!lsCache.has(dir)) { let n = []; try { n = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile() && MÃ.test(e.name)).map((e) => e.name); } catch { /* */ } lsCache.set(dir, n); } return lsCache.get(dir); };
const lsDirs = (dir) => { try { return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory() && !BỎ_DIR.test(e.name)).map((e) => e.name); } catch { return []; } };
const tiềnTốCủa = (name) => { const b = name.replace(/\.(test|spec|stories)\.[^.]+$/, '').replace(/\.[^.]+$/, ''); const m = b.match(/^([a-z0-9]+)(?=[A-Z_.-]|$)/) || b.match(/^([A-Z][a-z0-9]+)/); return m ? m[1].toLowerCase() : null; };
const tiềnTốĐủ = new Map(); // dir → Set tiền tố có ≥3 file (chỉ khi dir phẳng ≥ NG_PHẲNG)
function tách(dir, tên, file) {
  if (NG_PHẲNG <= 0 || path.dirname(file) !== dir) return tên;
  if (!tiềnTốĐủ.has(dir)) {
    const trựcTiếp = lsCode(dir); const nhóm = {};
    if (trựcTiếp.length >= NG_PHẲNG) for (const n of trựcTiếp) { const t = tiềnTốCủa(n); if (t) nhóm[t] = (nhóm[t] || 0) + 1; }
    const đủ = new Set(Object.keys(nhóm).filter((t) => nhóm[t] >= 3));
    tiềnTốĐủ.set(dir, đủ.size >= 2 ? đủ : new Set());
  }
  const t = tiềnTốCủa(path.basename(file)); const đủ = tiềnTốĐủ.get(dir);
  if (!đủ.size) return tên;
  return đủ.has(t) ? `${tên.replace(/\/\(gốc\)$/, '')}/${t}*` : `${tên}${/\(gốc\)$/.test(tên) ? '' : '/(còn lại)'}`;
}
function moduleCủa(abs) {
  const r = rel(abs); const parts = r.split('/'); const dirs = parts.slice(0, -1);
  for (const c of ['src-tauri/src', 'src', 'lib', 'app']) {
    const cp = c.split('/');
    if (dirs.slice(0, cp.length).join('/') !== c) continue;
    const rest = dirs.slice(cp.length); const cAbs = path.join(ROOT, c);
    if (!rest.length) return tách(cAbs, `${c}/(gốc)`, abs);
    const l1 = path.join(cAbs, rest[0]);
    if (!lsCode(l1).length && lsDirs(l1).length >= 2 && rest.length >= 2) return tách(path.join(l1, rest[1]), `${c}/${rest[0]}/${rest[1]}`, abs);
    return tách(l1, `${c}/${rest[0]}`, abs);
  }
  for (const c of ['packages', 'apps', 'services', 'modules', 'internal', 'pkg', 'cmd']) {
    if (dirs[0] === c && dirs.length >= 2) return `${c}/${dirs[1]}`;
  }
  return dirs.length ? dirs.slice(0, 4).join('/') : '(gốc)';
}

// ---------- đọc + bỏ chú thích (giữ xuống dòng để số dòng đúng) ----------
function bỏChúThích(src, lang) {
  let out = ''; let i = 0; const n = src.length; let st = null; let prev = '';
  const cmt = lang === 'py' ? null : true;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (st) {
      if (st.length === 3) { if (src.startsWith(st, i)) { out += st; i += 3; st = null; continue; } out += c; i++; continue; }
      out += c;
      if (c === '\\') { if (d !== undefined) out += d; i += 2; continue; }
      if (c === st || (c === '\n' && st !== '`')) st = null;
      i++; continue;
    }
    if (lang === 'py' && c === '#') { while (i < n && src[i] !== '\n') { out += ' '; i++; } continue; }
    if (cmt && c === '/' && d === '/') { while (i < n && src[i] !== '\n') { out += ' '; i++; } continue; }
    if (cmt && c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); const end = e < 0 ? n : e + 2; out += src.slice(i, end).replace(/[^\n]/g, ' '); i = end; continue; }
    if (lang === 'js' && c === '/' && (prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || /\b(return|typeof|case)\s*$/.test(out.slice(-12)))) {
      let j = i + 1; let cls = false;
      while (j < n && src[j] !== '\n') { if (src[j] === '\\') { j += 2; continue; } if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; else if (src[j] === '/' && !cls) break; j++; }
      if (j < n && src[j] === '/') { j++; while (/[a-z]/.test(src[j] || '')) j++; out += src.slice(i, j); i = j; prev = '/'; continue; }
    }
    if (lang === 'py' && (src.startsWith('"""', i) || src.startsWith("'''", i))) { st = src.slice(i, i + 3); out += st; i += 3; continue; }
    if (c === '"' || c === '`' || (c === "'" && lang !== 'rs')) { st = c; out += c; i++; prev = c; continue; }
    out += c; if (!/\s/.test(c)) prev = c; i++;
  }
  return out;
}
const langOf = (f) => (/\.py$/.test(f) ? 'py' : /\.rs$/.test(f) ? 'rs' : /\.go$/.test(f) ? 'go' : 'js');
const dòngTại = (starts, idx) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (starts[m] <= idx) lo = m; else hi = m - 1; } return lo + 1; };
function khớpNgoặc(s, i, mở = '{', đóng = '}') { let d = 0; let q = null; for (let j = i; j < s.length && j < i + 20000; j++) { const c = s[j]; if (q) { if (c === '\\') { j++; continue; } if (c === q) q = null; continue; } if (c === '"' || c === "'" || c === '`') { q = c; continue; } if (c === mở) d++; else if (c === đóng) { d--; if (!d) return j; } } return -1; }

// ---------- tên: tách từ, chuẩn hoá ----------
const tách_từ = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const ĐUÔI = new Set(['sql', 'db', 'query', 'impl', 'fn', 'func', 'helper', 'helpers', 'util', 'utils', 'v2', 'v1', 'async', 'sync', 'internal', 'raw', 'core', 'base']);
const CHUNG = new Set(('get set create update delete remove list find handle handler render format parse to from map build make init load save fetch use is has validate check on default export props state type types config options opts data item items row rows value values result response request req res error err id ids name router route routes schema service controller module app main index test mock new of by with for and or all one page component view style styles theme context provider store hook api client key keys the a an in out do run start stop open close show hide toggle add input output args param params info meta dto model entity repo repository payload body query text label title url path file files dir child children node wrapper container layout content event events cb callback fn func val handle submit change click form field fields ref refs'
  // tiếng Việt không dấu (dự án thật đặt tên Việt): động từ CRUD, đồ nghề định dạng ngày/chuỗi, UI chung
  + ' danh sach doc ghi lay tao sua xoa tim chuoi khi phim hien hanh nguoi thuc viet ngay gio hom nay rong loi thong bao nhan xu kiem tra').split(' '));
// chỉ bỏ ĐUÔI ở CUỐI tên (`phutLamViecSql` → phutlamviec); giữa tên thì là nghĩa (`MAX_SYNC_ROUNDS` ≠ `MAX_ROUNDS`, dự án desktop)
const bỏĐuôi = (ts) => { const r = [...ts]; while (r.length > 1 && ĐUÔI.has(r[r.length - 1])) r.pop(); return r; };
const chuẩn = (name) => bỏĐuôi(tách_từ(name)).join('');
const từNghĩa = (name) => bỏĐuôi(tách_từ(name)).filter((t) => !CHUNG.has(t) && t.length >= 3);
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const LITERAL_CHUNG = new Set(['', 'id', 'name', 'true', 'false', 'null', 'undefined', 'asc', 'desc', 'get', 'post', 'put', 'patch', 'delete', 'utf8', 'utf-8', 'string', 'number', 'boolean', 'object', 'function', 'default', 'div', 'span', 'button', 'input', 'sm', 'md', 'lg', 'xl']);

// ---------- quét từng file ----------
const nộiDung = new Map(); // file → mã đã bỏ chú thích (soát uỷ quyền)
const định = [];   // { tên, khoá, file, line, mod, loại }
const mảng = [];   // { khoá, mẫu, file, line, mod }
const regexes = []; const sốs = []; const maps = []; const objs = []; // objs: hằng object cấp đỉnh { tên, khoá[], file, line, mod, literal }
const truyVấn = []; // { bảng(norm), tênBảng, cột[], cơSở[], file, line, mod, kiểu }
const KW = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'constructor', 'function', 'super', 'else', 'do', 'try', 'new', 'typeof', 'await', 'import', 'export']);
const OP_PRISMA = new Set(['in', 'notIn', 'not', 'gte', 'gt', 'lte', 'lt', 'equals', 'contains', 'startsWith', 'endsWith', 'mode', 'some', 'every', 'none', 'is', 'isNot', 'has', 'hasSome', 'hasEvery', 'search', 'select', 'include', 'take', 'skip', 'orderBy']);

function keysPrisma(obj, ngữCảnh = '', out = []) {
  // duyệt object literal where: ghi `cột` (+ `?` trong OR, `!` trong NOT); đi sâu vào OR/AND/NOT và quan hệ lồng
  let i = 0; const s = obj; let d = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '{' || c === '[') { d++; i++; continue; }
    if (c === '}' || c === ']') { d--; i++; continue; }
    if (d === 1) {
      const m = s.slice(i).match(/^([A-Za-z_$][\w$]*)\s*:/);
      if (m && /[{,\s]/.test(s[i - 1] || '{')) {
        const k = m[1]; const sau = i + m[0].length; const vt = s.slice(sau).match(/^\s*([{[])/);
        if (/^(OR|AND|NOT)$/.test(k) && vt) {
          const st = sau + s.slice(sau).indexOf(vt[1]); const en = khớpNgoặc(s, st, vt[1], vt[1] === '{' ? '}' : ']');
          const body = s.slice(st, en + 1);
          const mark = k === 'OR' ? '?' : k === 'NOT' ? '!' : ngữCảnh;
          if (vt[1] === '[') { let j = 0; while (j < body.length) { const o = body.indexOf('{', j); if (o < 0) break; const e = khớpNgoặc(body, o); keysPrisma(body.slice(o, e + 1), mark, out); j = e + 1; } }
          else keysPrisma(body, mark, out);
          i = en + 1; continue;
        }
        if (!OP_PRISMA.has(k)) out.push(k + ngữCảnh);
        i = sau; continue;
      }
    }
    i++;
  }
  return out;
}
function cộtSql(where, alias) {
  const out = [];
  const w = where.replace(/\$\{[^}]*\}/g, ' ? ').replace(/'[^']*'/g, ' ? ');
  const NOT = /\bNOT\s+EXISTS\b/i;
  const phần = w.split(NOT)[0];
  for (const m of phần.matchAll(/\b(?:([A-Za-z_]\w*)\.)?([A-Za-z_]\w*)\s*(?:=|<>|!=|>=|<=|<|>|\bIN\b|\bIS\b|\bLIKE\b|\bILIKE\b|\bBETWEEN\b)/gi)) {
    if (m[1] && alias && m[1] !== alias) continue;
    if (/^(and|or|not|null|true|false|select|case|when|then|else|end)$/i.test(m[2])) continue;
    out.push(m[2]);
  }
  if (alias) for (const m of phần.matchAll(new RegExp(`\\b${alias}\\.([A-Za-z_]\\w*)\\b(?!\\s*(?:=|<>|!=|>=|<=|<|>|\\bIN\\b|\\bIS\\b|\\bLIKE\\b))`, 'gi'))) out.push(m[1]);
  return [...new Set(out)];
}

for (const f of files) {
  let src = ''; try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
  if (src.length > 600000) continue;
  const lang = langOf(f); let s = bỏChúThích(src, lang); const mod = moduleCủa(f); const file = rel(f);
  // Rust để test NGAY TRONG file (`#[cfg(test)] mod tests`) — phần đó là test, bỏ như file test (giữ số dòng)
  if (lang === 'rs') { const t = s.search(/#\[cfg\(test\)\]/); if (t >= 0) s = s.slice(0, t) + s.slice(t).replace(/[^\n]/g, ' '); }
  const starts = [0]; for (let i = 0; i < s.length; i++) if (s[i] === '\n') starts.push(i + 1);
  const L = (idx) => dòngTại(starts, idx);
  nộiDung.set(file, s);
  const lines = s.split('\n');
  // định nghĩa
  lines.forEach((ln, k) => {
    let m; let loại = null;
    if (lang === 'js') {
      if ((m = ln.match(/^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\*?\s+([A-Za-z_$][\w$]*)/))) loại = 'function'; // cấp đỉnh: hàm lồng là handler cục bộ
      else if ((m = ln.match(/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=/))) loại = 'const';
      else if ((m = ln.match(/^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/))) loại = 'class';
      else if ((m = ln.match(/^ {2,4}(?:(?:public|private|protected|static|async|readonly|override)\s+)*([a-zA-Z_$][\w$]*)\s*(?:<[^>]*>)?\s*\([^)]*\)?\s*(?::\s*[^{=;]+)?\{\s*$/)) && !KW.has(m[1])) loại = 'method';
    } else if (lang === 'py') {
      if ((m = ln.match(/^(?: {4})?(?:async\s+)?def\s+(\w+)/))) loại = 'function';
      else if ((m = ln.match(/^class\s+(\w+)/))) loại = 'class';
      else if ((m = ln.match(/^([A-Z][A-Z0-9_]+)\s*(?::[^=]+)?=/))) loại = 'const';
    } else if (lang === 'go') {
      if ((m = ln.match(/^func\s+(?:\([^)]*\)\s*)?(\w+)/))) loại = 'function';
      else if ((m = ln.match(/^(?:const|var|type)\s+(\w+)/))) loại = 'const';
    } else if (lang === 'rs') {
      if ((m = ln.match(/^\s{0,4}(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?(?:unsafe\s+)?fn\s+(\w+)/))) loại = 'function';
      else if ((m = ln.match(/^\s{0,4}(?:pub(?:\([^)]*\))?\s+)?(?:const|static)\s+(\w+)/))) loại = 'const';
      else if ((m = ln.match(/^(?:pub(?:\([^)]*\))?\s+)?(?:struct|enum|trait)\s+(\w+)/))) loại = 'class';
    }
    // component UI (PascalCase trong .tsx/.jsx/.vue/.svelte) là giao diện, không phải luật: `TrangThaiRong` S12 ≠ S13
    if (loại && /\.(tsx|jsx|vue|svelte)$/.test(f) && /^[A-Z][a-z]/.test(m[1]) && loại !== 'class') loại = null;
    if (loại) định.push({ tên: m[1], khoá: chuẩn(m[1]), lang, file, line: k + 1, mod, loại });
    // hằng cấp đỉnh: số / object
    let h;
    if (lang === 'js') h = ln.match(/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(.*)$/);
    else if (lang === 'py') h = ln.match(/^([A-Z][A-Z0-9_]+)\s*(?::[^=]+)?=\s*(.*)$/);
    else if (lang === 'rs') h = ln.match(/^\s{0,4}(?:pub(?:\([^)]*\))?\s+)?(?:const|static)\s+(\w+)\s*:[^=]+=\s*(.*)$/);
    else if (lang === 'go') h = ln.match(/^(?:const|var)\s+(\w+)\s*(?:\w+\s*)?=\s*(.*)$/);
    if (h) {
      const v = h[2].trim();
      const sm = v.match(/^(-?\d[\d_]*(?:\.\d+)?)\s*(?:as\s+const)?\s*[;,]?\s*$/);
      if (sm) { const val = sm[1].replace(/_/g, ''); if (!['0', '1', '-1'].includes(val)) sốs.push({ tên: h[1], val, file, line: k + 1, mod }); }
      else if (v.startsWith('{') && lang !== 'rs') {
        const st = starts[k] + ln.indexOf(v); const en = khớpNgoặc(s, st);
        if (en > 0) {
          const body = s.slice(st + 1, en); const entries = []; let d = 0; let cur = '';
          for (const c of body) { if ('{[('.includes(c)) d++; else if ('}])'.includes(c)) d--; if (c === ',' && !d) { entries.push(cur); cur = ''; } else cur += c; }
          if (cur.trim()) entries.push(cur);
          const kv = entries.map((e) => e.trim()).filter(Boolean).map((e) => { const mm = e.match(/^['"]?([A-Za-z_$][\w$-]*)['"]?\s*:\s*([\s\S]+)$/); return mm ? [mm[1], mm[2].trim()] : null; });
          if (kv.length && kv.every(Boolean)) {
            const LIT = /^(?:-?[\d_.]+(?:\s*[*+\-/]\s*[\d_.]+)*|'[^'\n]*'|"[^"\n]*"|true|false|null|\[(?:\s*(?:-?[\d_.]+|'[^'\n]*'|"[^"\n]*")\s*,?)*\s*\])$/;
            const literal = kv.every(([, val]) => LIT.test(val));
            const giáTrị = (val) => (/^[-\d_.\s*+/]+$/.test(val) ? String(Function(`return (${val.replace(/_/g, '')})`)()) : val.replace(/\s+/g, '').replace(/"/g, "'"));
            // giá trị "có nghĩa": không rỗng/cờ/chuỗi — `select` mask `{id: true}`, trạng thái lọc trống `{x: ''}`, bảng nhãn cột
            // `{ticket_done_date: 'Ngày hoàn tất'}` mang tên cột nhưng không phải DỮ LIỆU của bảng
            // Chỉ giá trị SỐ/MẢNG mới là dữ liệu cấu hình; map cột → chuỗi (`{can_view: 'read'}` dự án e-learning, `{x: 'Ngày tạo'}`) là ánh xạ/nhãn.
            const cóNghĩa = kv.filter(([, val]) => !/^(?:true|false|null|0|''|""|\[\s*\])$/.test(val) && !/^['"]/.test(val)).map(([key]) => key);
            objs.push({ tên: h[1], khoá: kv.map(([key]) => key), cóNghĩa, file, line: k + 1, mod, literal });
            if (literal && kv.length >= MIN_KHOÁ) maps.push({ tên: h[1], khoá: JSON.stringify(kv.map(([key, val]) => [key, giáTrị(val)]).sort()), file, line: k + 1, mod });
          }
        }
      }
    }
  });
  // mảng chuỗi
  for (const m of s.matchAll(/\[\s*((?:(?:'[^'\n]*'|"[^"\n]*")\s*,\s*)+(?:'[^'\n]*'|"[^"\n]*")\s*,?\s*)\]/g)) {
    const vals = [...m[1].matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)].map((x) => x[1] ?? x[2]);
    if (vals.length < MIN_MẢNG) continue;
    const trước = s.slice(Math.max(0, m.index - 30), m.index);
    if (/\b(select|pick|omit|returning|columns|attributes|include|exclude|deps|dependencies|keys)\s*[(:=]\s*$/i.test(trước)) continue;
    if (vals.every((v) => v.length <= 2 || LITERAL_CHUNG.has(v.toLowerCase()))) continue;
    mảng.push({ khoá: JSON.stringify([...new Set(vals)].sort()), mẫu: vals.slice(0, 6).join(', '), file, line: L(m.index), mod });
  }
  if (lang === 'js') for (const m of s.matchAll(/\btype\s+\w+\s*=\s*((?:\s*\|?\s*(?:'[^'\n]*'|"[^"\n]*"))+)/g)) {
    const vals = [...m[1].matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)].map((x) => x[1] ?? x[2]);
    if (vals.length < MIN_MẢNG || vals.every((v) => v.length <= 2 || LITERAL_CHUNG.has(v.toLowerCase()))) continue;
    mảng.push({ khoá: JSON.stringify([...new Set(vals)].sort()), mẫu: vals.slice(0, 6).join(' | '), file, line: L(m.index), mod });
  }
  // regex
  const thêmRe = (pat, flags, idx) => { if (pat.length >= 8 && /[\\[\]()+*?{}|^$]/.test(pat)) regexes.push({ khoá: `/${pat}/${flags}`, file, line: L(idx), mod }); };
  if (lang === 'js') {
    for (const m of s.matchAll(/(^|[(,=:[!&|?{};]|\breturn)\s*\/((?:[^/\\\n[]|\\.|\[(?:[^\]\\\n]|\\.)*\])+)\/([a-z]*)/gm)) thêmRe(m[2], m[3].split('').sort().join(''), m.index);
    for (const m of s.matchAll(/new\s+RegExp\(\s*(['"`])((?:[^\\\n]|\\.)*?)\1\s*(?:,\s*['"]([a-z]*)['"])?/g)) thêmRe(m[2].replace(/\\\\/g, '\\'), (m[3] || '').split('').sort().join(''), m.index);
  } else if (lang === 'py') for (const m of s.matchAll(/re\.(?:compile|match|search|fullmatch|sub|findall)\(\s*r?(['"])((?:[^\\\n]|\\.)*?)\1/g)) thêmRe(m[2], '', m.index);
  else if (lang === 'rs') for (const m of s.matchAll(/Regex::new\(\s*r#?"((?:[^"\\]|\\.)*)"/g)) thêmRe(m[1], '', m.index);
  // truy vấn — Prisma
  for (const m of s.matchAll(/\b([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\.(findMany|findFirst|findFirstOrThrow|findUnique|findUniqueOrThrow|count|aggregate|groupBy)\s*\(\s*\{/g)) {
    const st = m.index + m[0].length - 1; const en = khớpNgoặc(s, st); if (en < 0) continue;
    const arg = s.slice(st, en + 1); const wm = arg.match(/\bwhere\s*:\s*\{/); if (!wm) continue;
    const ws = wm.index + wm[0].length - 1; const we = khớpNgoặc(arg, ws);
    const cột = keysPrisma(arg.slice(ws, we + 1)); if (!cột.length) continue;
    truyVấn.push({ bảng: norm(m[2]), tênBảng: m[2], cột, file, line: L(m.index), mod, kiểu: 'prisma' });
  }
  // SQL trong chuỗi
  for (const m of s.matchAll(/\bFROM\s+"?([A-Za-z_]\w*)"?(?:\s+(?:AS\s+)?(?!WHERE\b|JOIN\b|LEFT\b|INNER\b|ORDER\b|GROUP\b|LIMIT\b)([A-Za-z_]\w*))?\s+WHERE\s+([\s\S]{0,600}?)(?=\bGROUP\s+BY\b|\bORDER\s+BY\b|\bLIMIT\b|\bHAVING\b|\bRETURNING\b|`|\)\s*[`;]|$)/g)) {
    // câu lệnh gần nhất trước FROM phải là SELECT — `DELETE FROM t WHERE …` là ghi (dự án e-learning: removeEmployee bị tính là đọc)
    const lệnh = [...s.slice(Math.max(0, m.index - 1500), m.index).matchAll(/\b(SELECT|DELETE|UPDATE|INSERT)\b/gi)].pop();
    if (!lệnh || !/^select$/i.test(lệnh[1])) continue;
    const cột = cộtSql(m[3], m[2]); if (!cột.length) continue;
    truyVấn.push({ bảng: norm(m[1]), tênBảng: m[1], cột, file, line: L(m.index), mod, kiểu: 'sql' });
  }
  // knex / supabase
  for (const m of s.matchAll(/(?:\b(?:db|knex|trx|tx|k|conn)\s*\(\s*|\.from\(\s*)['"`]([A-Za-z_]\w*)(?:\s+as\s+(\w+))?['"`]\s*\)/g)) {
    const tail = s.slice(m.index, m.index + 900); const end = tail.search(/;|\n\s*\n/); const chain = end > 0 ? tail.slice(0, end) : tail;
    if (/\.(insert|update|del|delete|upsert|increment|decrement|truncate)\s*\(/.test(chain)) continue;
    const cột = [];
    for (const w of chain.matchAll(/\.(?:and|or)?[wW]here(?:Not)?\s*\(\s*\{([^}]*)\}/g)) for (const k of w[1].matchAll(/['"]?([\w.]+)['"]?\s*:/g)) cột.push(k[1].split('.').pop());
    for (const w of chain.matchAll(/\.(and|or)?[wW]here(Not|In|NotIn|Null|NotNull|Between|ILike|Like|Raw)?\s*\(\s*['"]([\w.]+)['"]/g)) cột.push(w[3].split('.').pop() + (w[1] === 'or' ? '?' : /^Not/.test(w[2] || '') ? '!' : ''));
    for (const w of chain.matchAll(/\.(eq|neq|in|is|gt|gte|lt|lte|like|ilike|contains|match)\(\s*['"](\w+)['"]/g)) cột.push(w[2] + (w[1] === 'neq' ? '!' : ''));
    if (!cột.length) continue;
    truyVấn.push({ bảng: norm(m[1]), tênBảng: m[1], cột: [...new Set(cột)], file, line: L(m.index), mod, kiểu: 'knex' });
  }
}

// ---------- schema: bảng → cột ----------
const bảngCột = new Map(); // norm(bảng) → { tên, cột:Set(norm), file, line }
const thêmBảng = (tên, cột, file, line, alias = []) => { for (const k of [tên, ...alias]) { const n = norm(k); if (!bảngCột.has(n)) bảngCột.set(n, { tên, cột: new Set(), file, line }); for (const c of cột) bảngCột.get(n).cột.add(norm(c)); } };
for (const f of schemaFiles) {
  let src = ''; try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
  const starts = [0]; for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  if (/\.prisma$/.test(f)) {
    for (const m of src.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
      const cột = []; for (const l of m[2].split('\n')) { const c = l.match(/^\s+(\w+)\s+\w/); if (c && !l.trim().startsWith('@@')) { cột.push(c[1]); const mp = l.match(/@map\("(\w+)"\)/); if (mp) cột.push(mp[1]); } }
      const map = (m[2].match(/@@map\("(\w+)"\)/) || [])[1];
      thêmBảng(map || m[1], cột, rel(f), dòngTại(starts, m.index), [m[1]]);
    }
  } else if (/\.sql$/i.test(f)) {
    for (const m of src.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"?\w+"?\.)?"?(\w+)"?\s*\(/gi)) {
      const st = m.index + m[0].length - 1; const en = khớpNgoặc(src, st, '(', ')'); if (en < 0) continue;
      const cột = src.slice(st + 1, en).split('\n').map((l) => (l.match(/^\s*"?(\w+)"?\s+\w/) || [])[1]).filter((c) => c && !/^(CONSTRAINT|PRIMARY|UNIQUE|FOREIGN|CHECK|KEY|INDEX)$/i.test(c));
      thêmBảng(m[1], cột, rel(f), dòngTại(starts, m.index));
    }
  } else {
    for (const m of src.matchAll(/createTable\(\s*['"](\w+)['"]/g)) {
      const đoạn = src.slice(m.index, m.index + 6000).split(/createTable\(/)[1] || '';
      const cột = [...đoạn.matchAll(/\.\w+\(\s*['"](\w+)['"]/g)].map((x) => x[1]);
      thêmBảng(m[1], cột, rel(f), dòngTại(starts, m.index));
    }
  }
}

// ---------- gom nhóm ----------
const nhóm = [];
const vt = (x, chiTiết) => ({ file: x.file, line: x.line, module: x.mod, chiTiết });
const theoKhoá = (arr, khoáFn) => { const g = new Map(); for (const x of arr) { const k = khoáFn(x); if (!k) continue; if (!g.has(k)) g.set(k, []); g.get(k).push(x); } return g; };
const cácModule = (xs) => [...new Set(xs.map((x) => x.mod))].sort();
let bỏPhổBiến = 0;

// Định nghĩa UỶ QUYỀN: file gọi `.<tên>(` của chính tên đó — controller → service → model cùng tên là một lối đi qua ba
// tầng, không phải ba bản cài (dự án e-learning: approveEnrollment/bangDiemDanh/vaoPhong…). Bỏ khỏi (1a)/(1b).
const uỷQuyền = (d) => new RegExp(`\\.${d.tên.replace(/\$/g, '\\$')}\\s*\\(`).test(nộiDung.get(d.file) || '');
for (let i = định.length - 1; i >= 0; i--) if (uỷQuyền(định[i])) định.splice(i, 1);
// (1a) luật từ tài liệu — gọi scan-dup-rules.js
let tàiLiệu = null;
if (DOCS && fs.existsSync(DOCS)) {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'scan-dup-rules.js'), DOCS], { encoding: 'utf8', maxBuffer: 1e8 });
  try { tàiLiệu = JSON.parse(r.stdout); } catch { tàiLiệu = null; }
}
const đãBáoĐịnhDanh = new Set(); const đãXétId = new Set();
if (tàiLiệu) {
  for (const p of tàiLiệu.phátHiện || []) {
    const ids = new Set([...(p.mốc || []), ...((p.mẫu || '').match(/`[^`\n]+`/g) || []).map((x) => x.replace(/`/g, ''))]);
    for (const id of ids) {
      if (/^(?:BR|StR|FR|NFR|CR|WI|F)-?\d/.test(id) || !/^[A-Za-z_][\w.]*$/.test(id) || đãXétId.has(id)) continue;
      đãXétId.add(id);
      // `bảng.cột` → truy vấn bảng đó có lọc cột đó; phần cuối là tên định nghĩa khi đủ nghĩa. Tên một từ chung
      // (`status`, `settings`, `service.create`) khớp nửa codebase — dự án e-learning: `create` ra 9 module — nên bỏ.
      const [đầu, ...còn] = id.split('.'); const cuối = còn.length ? còn[còn.length - 1] : đầu;
      const k = chuẩn(cuối);
      const đủNghĩa = từNghĩa(cuối).length >= 1 && bỏĐuôi(tách_từ(cuối)).length >= 2 && k.length >= 8;
      // Khớp TÊN CHUẨN HOÁ BẰNG NHAU (đã bỏ đuôi Sql/Impl…), không khớp chuỗi con: `github_add_account` chứa `add_account`
      // nhưng là việc khác (dự án desktop). Đếm module THEO HỌ NGÔN NGỮ: `addAccount` (TS) gọi `add_account` (Rust) qua IPC là một
      // lệnh hai đầu, không phải hai bản cài.
      const defsAll = !đủNghĩa ? [] : định.filter((d) => d.khoá === k);
      const qs = truyVấn.filter((q) => q.bảng === norm(đầu) && (!còn.length || q.cột.some((c) => norm(c.replace(/[?!]$/, '')) === norm(cuối))));
      const theoHọ = theoKhoá([...defsAll, ...qs.map((q) => ({ ...q, lang: 'q' }))], (x) => x.lang);
      const họ = [...theoHọ.values()].filter((xs) => cácModule(xs).length >= 2).sort((a, b) => cácModule(b).length - cácModule(a).length)[0];
      if (!họ) continue;
      const defs = họ.filter((x) => x.lang !== 'q'); const mods = cácModule(họ);
      if (mods.length > TRẦN_MODULE * 2) continue;
      đãBáoĐịnhDanh.add(k);
      nhóm.push({ loại: 'luat-nhieu-ban', con: 'tai-lieu', khoá: id, module: mods,
        vịTrí: [...defs.map((d) => vt(d, `${d.loại} ${d.tên}`)), ...họ.filter((x) => x.lang === 'q').map((q) => vt(q, `đọc ${q.tênBảng} lọc {${q.cột.join(', ')}}`))],
        vìSao: `${p.ids.join(' · ')} (${p.màn.join(', ')}) nhắc \`${id}\` — code có ${mods.length} module mang định nghĩa/truy vấn khớp tên: một luật, ${mods.length} bản cài` });
    }
  }
}
// (1b) cùng tên chuẩn hoá ở ≥2 module
// Khoá theo HỌ NGÔN NGỮ: `addProject` (TS) ~ `add_project` (Rust) là hai đầu một lệnh IPC Tauri, không phải hai bản cài
// (dự án desktop: 452 nhóm, gần hết là cặp này).
for (const [lk, ds] of theoKhoá(định.filter((d) => từNghĩa(d.tên).length >= 1 && bỏĐuôi(tách_từ(d.tên)).length >= 2 && d.khoá.length >= 8), (d) => d.lang + ':' + d.khoá)) {
  const k = lk.slice(lk.indexOf(':') + 1);
  const mods = cácModule(ds); if (mods.length < 2 || đãBáoĐịnhDanh.has(k)) continue;
  if (mods.length > TRẦN_MODULE) { bỏPhổBiến++; continue; }
  const tên = [...new Set(ds.map((d) => d.tên))];
  nhóm.push({ loại: 'luat-nhieu-ban', con: tên.length > 1 ? 'ten-gan-giong' : 'ten-trung', khoá: tên.join(' ~ '), module: mods,
    vịTrí: ds.map((d) => vt(d, `${d.loại} ${d.tên}`)),
    vìSao: `định nghĩa ${tên.map((t) => '`' + t + '`').join(' / ')} ở ${mods.length} module — cùng tên chuẩn hoá \`${k}\`; nếu cùng nghĩa thì sửa một bản, bản kia vẫn sai` });
}
// (2) nguồn đôi
const nhómLiteral = (arr, con, mô) => { for (const [k, xs] of theoKhoá(arr, (x) => x.khoá)) { const mods = cácModule(xs); if (mods.length < 2) continue; if (mods.length > TRẦN_MODULE + 2) { bỏPhổBiến++; continue; } nhóm.push({ loại: 'nguon-doi', con, khoá: k.length > 160 ? k.slice(0, 157) + '…' : k, module: mods, vịTrí: xs.map((x) => vt(x, x.tên || x.mẫu || '')), vìSao: `${mô} y hệt ở ${mods.length} module — hai nguồn sự thật, đổi một nơi thì nơi kia lệch` }); } };
nhómLiteral(mảng, 'mang', 'tập giá trị chuỗi');
nhómLiteral(regexes, 'regex', 'regex');
nhómLiteral(maps, 'map', 'map cấu hình literal');
// từ chỉ ĐƠN VỊ/CỠ không nói nghĩa: MAX_X và MAX_Y cùng 500 không phải một luật (tối đa, tối thiểu, mặc định, ngưỡng, hạn chờ…)
const TỪ_SỐ_CHUNG = new Set(['max', 'min', 'default', 'limit', 'count', 'num', 'size', 'value', 'len', 'length', 'total', 'toi', 'thieu', 'mac', 'dinh', 'nguong', 'han', 'cho', 'dai', 'giay', 'mili', 'phut', 'timeout', 'delay', 'retry', 'retries', 'width', 'height']);
for (const [val, xs] of theoKhoá(sốs, (x) => x.val)) {
  if (cácModule(xs).length < 2) continue;
  const cha = xs.map((_, i) => i); const tìm = (i) => (cha[i] === i ? i : (cha[i] = tìm(cha[i])));
    const từ = xs.map((x) => new Set(từNghĩa(x.tên).filter((t) => !TỪ_SỐ_CHUNG.has(t))));
  for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) if (xs[i].mod !== xs[j].mod && (xs[i].tên === xs[j].tên || [...từ[i]].some((t) => từ[j].has(t)))) cha[tìm(i)] = tìm(j);
  for (const [, idx] of theoKhoá(xs.map((x, i) => ({ i })), (o) => String(tìm(o.i)))) {
    const g = idx.map((o) => xs[o.i]); const mods = cácModule(g); if (mods.length < 2) continue;
    nhóm.push({ loại: 'nguon-doi', con: 'so', khoá: `${val} (${[...new Set(g.map((x) => x.tên))].join(' / ')})`, module: mods, vịTrí: g.map((x) => vt(x, `${x.tên} = ${val}`)), vìSao: `hằng số ${val} có tên chung một từ nghĩa, khai ở ${mods.length} module — ngưỡng nghiệp vụ hai nơi` });
  }
}
// (2) hình bảng: hằng object cấp đỉnh mang ≥ MIN_KHOÁ khoá trùng cột của bảng đang được code đọc
const bảngĐọc = theoKhoá(truyVấn, (q) => q.bảng);
for (const o of objs) {
  if (!o.literal) continue;
  let tốt = null;
  for (const [b, info] of bảngCột) {
    if (b !== norm(info.tên)) continue; // mỗi bảng một lần (bỏ alias model)
    const trùng = o.cóNghĩa.filter((k) => info.cột.has(norm(k)));
    if (trùng.length < MIN_KHOÁ || trùng.length * 2 < o.khoá.length) continue;
    const qs = [...(bảngĐọc.get(b) || []), ...[...bảngĐọc.entries()].filter(([k]) => k !== b && bảngCột.get(k) === info).flatMap(([, v]) => v)];
    if (!qs.length || cácModule([o, ...qs]).length < 2) continue;
    if (!tốt || trùng.length > tốt.trùng.length) tốt = { info, trùng, qs };
  }
  if (tốt) {
    const { info, trùng, qs } = tốt;
    nhóm.push({ loại: 'nguon-doi', con: 'hinh-bang', khoá: `${o.tên} ~ bảng ${info.tên}`, module: cácModule([o, ...qs]),
      vịTrí: [vt(o, `hằng ${o.tên} {${o.khoá.join(', ')}}`), ...qs.map((q) => vt(q, `đọc ${q.tênBảng} (${q.kiểu})`)), { file: info.file, line: info.line, module: '(schema)', chiTiết: `bảng ${info.tên}` }],
      vìSao: `hằng cứng \`${o.tên}\` có ${trùng.length}/${o.khoá.length} khoá trùng cột bảng \`${info.tên}\` (${trùng.join(', ')}) mà code cũng đọc bảng đó — dữ liệu có hai nguồn, trùng nhau chỉ khi dữ liệu bảng khớp hằng` });
  }
}
// (3) cùng bảng, lọc khác
const gốcCột = (c) => c.replace(/[?!]$/, '');
// cột PHẠM VI THUÊ BAO / xoá mềm có mặt ở gần mọi truy vấn: giữ chúng thì `{tenant_id}` ⊂ `{tenant_id, status}` ở mọi bảng
// (dự án e-learning: 19 nhóm). Bỏ trước khi so — lọc khác vì phạm vi thuê bao là việc của ac-judge soát bảo mật, không phải luật lặp.
const CỘT_PHẠM_VI = /^(tenant_?id|org_?id|organization_?id|workspace_?id|company_?id|deleted_?at|is_?deleted|xoa_?luc|da_?xoa)$/i;
const CỜ_HIỆU_LỰC = /^(is|has|can|cho|da|la|co)_|^(is|has|can)[A-Z]|status|state|trang_?thai|tinh_?trang|active|enabled|disabled|deleted|approved|published|verified|locked|khoa|passed|completed|expired|revoked|ket_?qua|hieu_?luc/i;
for (const [b, qsGốc] of bảngĐọc) {
  const qs = qsGốc.map((q) => ({ ...q, cột: q.cột.filter((c) => !CỘT_PHẠM_VI.test(gốcCột(c))) }));
  const cặp = new Set();
  for (let i = 0; i < qs.length; i++) for (let j = i + 1; j < qs.length; j++) {
    const a = qs[i], c = qs[j]; if (a.mod === c.mod) continue;
    const A = new Set(a.cột.map(gốcCột)), C = new Set(c.cột.map(gốcCột));
    // cột chung phải là điều kiện THẲNG ở cả hai (không nằm trong OR/NOT): `code?`(tìm kiếm) với `code`(tra cứu) là hai việc
    const chung = [...A].filter((x) => x !== 'id' && a.cột.includes(x) && c.cột.includes(x));
    if (!chung.length) continue;
    const sa = [...a.cột].sort().join(','), sc = [...c.cột].sort().join(',');
    if (sa === sc) continue;
    const AcC = [...A].every((x) => C.has(x)), CcA = [...C].every((x) => A.has(x));
    if (!(AcC || CcA)) continue;
    // Phần CHÊNH phải là điều kiện HIỆU LỰC (cờ/trạng thái, hoặc nằm trong OR/NOT): `{user_id}` vs `{user_id, is_active}` là
    // cùng câu hỏi "ai thuộc X" với hai câu trả lời (WI-53: có dòng vs có ≥1 cờ bật). Chênh một khoá ngoại khác
    // (`{course_id}` vs `{course_id, user_id}`) là hai câu hỏi khác nhau — dự án e-learning: 14 nhóm, gần hết loại này.
    const chênh = [...A].filter((x) => !C.has(x)).concat([...C].filter((x) => !A.has(x)));
    const laCờ = (x) => CỜ_HIỆU_LỰC.test(x) || [...a.cột, ...c.cột].some((y) => y !== x && gốcCột(y) === x);
    if (!chênh.every(laCờ)) continue;
    cặp.add(i); cặp.add(j);
  }
  if (!cặp.size) continue;
  const g = [...cặp].map((i) => qs[i]);
  nhóm.push({ loại: 'loc-khac', con: 'loc-khac', khoá: g[0].tênBảng, module: cácModule(g),
    vịTrí: g.map((q) => vt(q, `lọc {${q.cột.join(', ')}}`)),
    vìSao: `bảng \`${g[0].tênBảng}\` được đọc ở ${cácModule(g).length} module cùng cột lọc nhưng điều kiện khác nhau (?=trong OR, !=trong NOT) — cùng câu hỏi hay hai câu hỏi? nếu cùng thì có hai câu trả lời` });
}

// Một sự việc một nhóm: hằng cùng tên (1b) mà mọi vị trí đã nằm trong một nhóm literal (2) → giữ nhóm literal (bằng
// chứng mạnh hơn: cùng TÊN và cùng GIÁ TRỊ), bỏ nhóm tên. Không gộp thì báo cáo phồng và người đọc học cách bỏ qua.
{
  const đãCó = new Set(nhóm.filter((n) => n.loại === 'nguon-doi').flatMap((n) => n.vịTrí.map((v) => v.file + ':' + v.line)));
  for (let i = nhóm.length - 1; i >= 0; i--) { const n = nhóm[i]; if (n.loại === 'luat-nhieu-ban' && n.con !== 'tai-lieu' && n.vịTrí.every((v) => đãCó.has(v.file + ':' + v.line))) nhóm.splice(i, 1); }
}
const THỨ = { 'luat-nhieu-ban': 0, 'loc-khac': 1, 'nguon-doi': 2 };
nhóm.sort((a, b) => THỨ[a.loại] - THỨ[b.loại] || (a.con === 'hinh-bang' ? -1 : 0) - (b.con === 'hinh-bang' ? -1 : 0) || b.module.length - a.module.length || a.khoá.localeCompare(b.khoá));
nhóm.forEach((n, i) => { n.nhóm = 'D' + (i + 1); });

const gioiHan = [
  'tên trùng mà nghĩa khác: hai định nghĩa cùng tên chuẩn hoá / hai truy vấn lọc khác có thể là hai việc hợp lệ khác nhau — script không đọc nghĩa',
  'hằng khai lại trong test không tính (test/seed/migration/fixture/generated bị bỏ) — hằng chỉ lặp giữa code và test không lộ',
  'số chỉ tính khi là hằng CÓ TÊN cấp đỉnh; ngưỡng viết thẳng trong biểu thức không thấy; regex/mảng/map so y hệt',
  'truy vấn: Prisma / SQL trong chuỗi / knex / supabase — ORM khác không dựng điều kiện; where dựng động chỉ thấy phần literal',
  'định nghĩa theo regex dòng (JS/TS/Python/Go/Rust), không AST; module theo cách scan-coupling (không đọc tsconfig paths)',
  '(1a) chỉ BRule mà scan-dup-rules.js thấy ở ≥2 màn có backtick',
];
const đếm = (l) => nhóm.filter((n) => n.loại === l).length;
const out = { root: ROOT, docs: DOCS, sốModule: new Set(files.map(moduleCủa)).size, sốFile: files.length, bỏTest, sốĐịnhNghĩa: định.length, sốTruyVấn: truyVấn.length, sốBảngSchema: new Set([...bảngCột.values()]).size,
  tàiLiệu: tàiLiệu ? { sốLuật: tàiLiệu.sốLuật, phátHiện: (tàiLiệu.phátHiện || []).length } : null,
  ngưỡng: { minMảng: MIN_MẢNG, minKhoá: MIN_KHOÁ, trầnModule: TRẦN_MODULE, táchPhẳng: NG_PHẲNG }, bỏVìPhổBiến: bỏPhổBiến,
  tổng: { nhóm: nhóm.length, luậtNhiềuBản: đếm('luat-nhieu-ban'), nguồnĐôi: đếm('nguon-doi'), lọcKhác: đếm('loc-khac') }, nhóm, gioiHan };
if (STRICT) process.exitCode = Math.min(nhóm.length, 125);
if (JSON_MODE) { process.stdout.write(JSON.stringify(out, null, 2) + '\n'); }
else {
  const t = out.tổng;
  console.log(`scan-dup-code: ${ROOT} · ${out.sốModule} module · ${out.sốFile} file mã (bỏ ${bỏTest} test/seed/migration/generated) · ${out.sốĐịnhNghĩa} định nghĩa · ${out.sốTruyVấn} truy vấn · ${out.sốBảngSchema} bảng schema`);
  console.log(`  docs: ${DOCS ? `${DOCS}${tàiLiệu ? ` (${tàiLiệu.sốLuật} BRule, ${(tàiLiệu.phátHiện || []).length} luật lặp ≥2 màn)` : ' (không đọc được)'}` : 'không có — bỏ (1a)'}`);
  console.log(`  ${t.nhóm} nhóm ứng viên: ${t.luậtNhiềuBản} luật-nhiều-bản · ${t.lọcKhác} lọc-khác · ${t.nguồnĐôi} nguồn-đôi${bỏPhổBiến ? ` · ${bỏPhổBiến} bỏ vì ở >${TRẦN_MODULE} module (quy ước, không phải luật)` : ''}\n`);
  if (!nhóm.length) console.log('  (không thấy ứng viên nào)');
  for (const n of nhóm) {
    console.log(`  ${n.nhóm} [${n.loại}/${n.con}] ${n.khoá} — ${n.module.length} module`);
    for (const v of n.vịTrí.slice(0, 8)) console.log(`      · ${v.file}:${v.line} (${v.module}) ${v.chiTiết}`);
    if (n.vịTrí.length > 8) console.log(`      · … +${n.vịTrí.length - 8}`);
    console.log(`      vì sao nghi: ${n.vìSao}\n`);
  }
  console.log(`Đếm, không phán — mỗi nhóm là ứng viên cho ac-judge / ba-conformance / ba-migration đọc nghĩa.\nGiới hạn:\n${gioiHan.map((g) => '  · ' + g).join('\n')}`);
}
