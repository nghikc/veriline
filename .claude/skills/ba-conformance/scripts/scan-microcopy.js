#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
/*
 * ba-conformance/scan-microcopy.js — so CHUỖI NGƯỜI DÙNG THẤY giữa tài liệu màn và code thật.
 * Zero-dependency, CommonJS. Chỉ đọc. Đếm, không phán: mồi cho ac-verifier / ac-judge / ba-conformance, KHÔNG phải cổng.
 *
 *   node .claude/skills/ba-conformance/scripts/scan-microcopy.js [docsDir=docs] [--root <thư-mục-code>] [--screen Sxx]
 *        [--json] [--plain] [--strict]
 *
 * VÌ SAO CÓ: microcopy lệch là lỗi THẬT, và là loại mắt người đọc diff hay trượt nhất — dự án helpdesk S15 `E-S15-15` phải khớp
 * srs "từng ký tự"; dự án desktop CR-S01-206/207 mở chỉ để sửa câu chữ. `ba-feasible/scan-feasible.js` luật 8 soát design-spec ↔ srs
 * (tài liệu ↔ tài liệu); verifier đợt 5 nhận `design-spec.md`/`html-design.html` làm nguồn binding nhưng không có máy đo
 * chiều tài liệu ↔ CODE. Script này là máy đo đó.
 *
 * Nguồn chuỗi (mỗi màn `S..`):
 *   - srs.md: bảng có cột tiêu đề "Người dùng thấy" / "Thông báo" / "Message" (ma trận lỗi E-S.., bảng validation) — lấy
 *     chuỗi trong ngoặc kép "…"/“…”; cột ghi "(nguyên văn)" mà ô không có ngoặc thì lấy cả ô.
 *   - design-spec.md: mục có tiêu đề microcopy / copywriting / copy / wording / câu chữ / nội dung chữ — mọi `…` và "…";
 *     cột đầu bảng Component/Thành phần — nhãn trong ngoặc kép (Nút "Lưu"). Không có mục như thế → rơi về lọc của luật 8
 *     scan-feasible (câu trong `…` 15–120 ký tự kết bằng . ! ?). Parser luật 8 KHÔNG tách ra hàm dùng chung: nó là một vòng
 *     lặp nội tuyến 10 dòng, tách thì đổi scan-feasible mà không lợi gì; ở đây là parser riêng, rộng hơn (nhận cả nhãn nút).
 * Nơi tìm: gốc code = `--root` › header `gốc code:` trong verification.md › thư mục chứa nhiều đường dẫn `plan.md` nhất ›
 *   cha của docs. Quét literal chuỗi '…' "…" `…` (bỏ comment), chữ JSX/HTML giữa thẻ, JSON/YAML locale.
 * Chuẩn hoá hai phía: NFC; bỏ ngoặc bao, ** *; gộp khoảng trắng; bỏ dấu câu cuối; biến `${x}` `{n}` `{{x}}` `%s` `<tên>` →
 *   ký tự đại diện khớp đoạn bất kỳ. KHÔNG bỏ dấu tiếng Việt khi so — lệch dấu là lỗi thật (bản bỏ dấu chỉ dùng để GỌI TÊN
 *   loại lệch).
 * Kết quả mỗi chuỗi: `khớp` (file:line) · `gần` (khác ≤ vài ký tự, hoặc chỉ khác dấu, hoặc thiếu câu — kèm diff ngắn) ·
 *   `không thấy`. Chuỗi chỉ thấy trong file test → vẫn là kết quả của code chạy thật, kèm `trongTest`.
 * Exit: 0 (mồi, 🟡) · `--strict` → exit = số `gần` (trần 125) · 2 = không đọc được docs / --root.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
const VAL = new Set(['--root', '--screen']);
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && VAL.has(args[i - 1])));
const DOCS = path.resolve(positional[0] || 'docs');
const PLAIN = flag('--plain');
const STRICT = flag('--strict');
const SCREEN = (opt('--screen') || '').toUpperCase();
if (!fs.existsSync(DOCS)) { console.error(`Không thấy thư mục tài liệu: ${DOCS}`); process.exit(2); }
const PROJ = path.dirname(DOCS);

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };

const gioiHan = [
  'Chỉ so CHUỖI, không biết chuỗi hiện ra KHI NÀO: `khớp` = câu có trong code, không có nghĩa nó hiện đúng điều kiện E-S.. (việc của verifier/test).',
  'Chuỗi ghép: nối `+` giữa literal và biến đơn giản được ghép lại; ghép qua hàm, mảng .join(), điều kiện ?: giữa hai nửa câu → hai mảnh rời. Câu nhiều câu con thì thử tách theo câu — thấy đủ mảnh ở bất kỳ đâu → `khớp`, thiếu mảnh → `gần` (thiếu câu) — có thể OAN nếu mảnh kia ghép động.',
  'JSX/HTML: chữ giữa hai thẻ được gộp khoảng trắng như JSX (tách dòng không làm lệch); thẻ nội tuyến b/strong/em/i/u/span/small/mark/code/br bị xoá trước khi gộp; {"…"} lấy chữ, {biểu thức} = biến. Thẻ khác (Link, Button) chen giữa câu → hai mảnh.',
  'Mã lỗi map sang thông điệp ở chỗ KHÁC gốc code (backend repo khác, CMS, bảng DB, file dịch tải lúc chạy) → `không thấy` OAN; đưa `--root` bao cả nơi đó.',
  'Ví dụ cụ thể trong tài liệu (số, tên người, "IT Hỗ trợ") chỉ khớp khi code đặt BIẾN đúng chỗ đó; code viết cứng chữ khác → `gần`/`không thấy`.',
  'Tokenizer nhẹ, không AST: dấu nháy đơn trong chữ JSX (Don\'t) hay regex literal có dấu nháy có thể nuốt một đoạn tới hết dòng; `//` trong URL giữa chữ JSX bị coi là comment.',
  'CSS text-transform (uppercase), i18n pluralization, chuỗi ghép từ enum → code đúng mà chữ khác → `gần` oan; soi diff trước khi mở việc.',
  'Nhãn một từ (Huỷ, Lưu) chỉ `khớp` khi CẢ literal bằng nó; nhãn nhiều từ khớp khi nằm trọn trong một literal (ranh giới từ) — không biết literal đó có đúng là cái nút.',
  'Bỏ qua node_modules dist build .next coverage vendor prototype .claude .git test-results, file > 1,5 MB, *.min.js, lockfile; docs/ đang soát không tính là code.',
];

/* ── Chuẩn hoá ─────────────────────────────────────────────────────────────────────────── */
const W = '§'; // § — đại diện một biến / đoạn bất kỳ
const ENT = { '&nbsp;': ' ', '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&apos;': "'", '&#39;': "'" };
function chuẩn(s, phía) {
  let t = String(s).normalize('NFC');
  t = t.replace(/&(nbsp|quot|amp|lt|gt|apos|#39);/g, (m) => ENT[m] || m);
  if (phía === 'doc') {
    t = t.replace(/\*\*|__/g, '').replace(/(^|\s)\*(\S)/g, '$1$2').replace(/(\S)\*(\s|$)/g, '$1$2');
    t = t.replace(/<[^<>\n]{1,40}>/g, W);                 // <tên người> <N>
  }
  t = t.replace(/\$\{[^{}]*\}/g, W).replace(/\{\{[^{}]*\}\}/g, W).replace(/\{[\p{L}\p{N}_.$\s-]{1,40}\}/gu, W)
    .replace(/%\(\w+\)[sd]|%[sdif]/g, W);
  t = t.replace(/`/g, '').replace(/^[\p{So}\p{Sm}•·]+\s*/u, '').replace(/\s*[\p{So}\p{Sm}•·]+$/u, '');
  t = t.replace(/[“”‘’']/g, '"').replace(/\.\.\./g, '…');
  t = t.replace(/\s+/g, ' ').trim();
  for (let i = 0; i < 3; i++) {
    t = t.replace(/^["`«»…]+|["`«»]+$/g, '').trim();
    t = t.replace(/[.!?…:;,]+$/u, '').trim();
  }
  t = t.replace(new RegExp(`${W}(\\s*${W})+`, 'g'), W);
  return t;
}
const bỏDấu = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').normalize('NFC');
const từ = (s) => bỏDấu(s).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 2 && !/^\d+$/.test(w));
const chữCái = (s) => (s.match(/\p{L}/gu) || []).length;
const chữThật = (s) => s.replace(new RegExp(W, 'g'), '').replace(/\s/g, '').length;

/* ── 1. Chuỗi từ tài liệu ─────────────────────────────────────────────────────────────── */
function hàngBảng(line) {
  const t = line.trim(); if (!t.startsWith('|')) return null;
  const cells = []; let cur = ''; let tick = false;
  for (let i = 1; i < t.length; i++) {
    const c = t[i];
    if (c === '\\' && t[i + 1] === '|') { cur += '|'; i++; continue; }
    if (c === '`') tick = !tick;
    if (c === '|' && !tick) { cells.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) cells.push(cur.trim());
  return cells;
}
/** Ngoặc kép trong ô. `**"…"**` lấy trọn tới `"**` trước (thông điệp có ngoặc lồng: **""Chi nhánh Q1" đã có luồng…"**). */
function trongNgoặc(s0) {
  const out = [];
  // `…` NẰM TRONG ngoặc kép ("Không tìm thấy `tailscale`. Cài…") giữ chữ; dấu " bên trong `…` không được tính là ngoặc.
  const s = s0.replace(/`([^`\n]*)`/g, (_, t) => t.replace(/"/g, '\u0003'));
  const rest = s.replace(/\*\*["“](.{2,400}?)["”]\*\*/g, (_, t) => { out.push(t); return ' '; });
  for (const m of rest.matchAll(/"([^"\n]{2,400})"|“([^”\n]{2,400})”/g)) out.push(m[1] || m[2]);
  return out.map((t) => t.replace(/\u0003/g, '"'));
}
const trongTick = (s) => [...s.matchAll(/`([^`\n]{1,400})`/g)].map((m) => m[1]);
function làChữNgườiĐọc(t) {
  const s = t.trim();
  if (s.length < 2 || !/\p{L}/u.test(s)) return false;
  if (/^(E|R|BRule|TC|US|UC|F|FR|NFR|StR|BR|S|CR|WI|PD|GĐ|AU|TM|MG|CL|ACL)-[\w.-]*\d/.test(s)) return false;
  if (/[\/\\_=;]|=>|::|\(\)|^\.|\.(js|ts|tsx|md|json)$/.test(s) && !/\s\S+\s/.test(s)) return false;
  if (/^[\x20-\x7e]+$/.test(s) && !/\s/.test(s)) return false;        // định danh ASCII một khối: camelCase, CONST, url
  return true;
}

function chuỗiTừSrs(txt) {
  const out = []; const L = txt.split('\n');
  for (let i = 0; i + 1 < L.length; i++) {
    const head = hàngBảng(L[i]);
    if (!head || !/^\s*\|?\s*:?-{2,}/.test(L[i + 1])) continue;
    const cột = head.map((h, k) => (/người dùng thấy|thông báo|message|hiển thị cho người dùng|nội dung hiển thị/i.test(h) ? k : -1)).filter((k) => k >= 0);
    if (!cột.length) continue;
    for (let j = i + 2; j < L.length; j++) {
      const r = hàngBảng(L[j]); if (!r) break;
      for (const k of cột) {
        const ô = r[k] || ''; const nguyênVăn = /nguyên văn/i.test(head[k]);
        let cs = trongNgoặc(ô);
        if (!cs.length && nguyênVăn) cs = trongTick(ô);                 // `Câu nguyên văn.` *(ghi chú)*
        if (!cs.length && nguyênVăn && !/^\*?\(/.test(ô.trim()) && !/^[-—–]$|^n\/a$/i.test(ô.trim()))
          cs = ô.replace(/\*\([^)]*\)\*/g, '').split(/\s+\/\s+/);
        for (const c of cs) if (làChữNgườiĐọc(c)) out.push({ text: c, line: j + 1, id: (r[0] || '').replace(/[*`]/g, '').slice(0, 20) });
      }
    }
  }
  return out;
}

function chuỗiTừDesign(txt) {
  const out = []; const L = txt.split('\n'); let cấp = 0; let trongMục = false;
  for (let i = 0; i < L.length; i++) {
    const h = /^(#{2,4})\s+(.*)$/.exec(L[i]);
    if (h) {
      const c = h[1].length;
      if (/microcopy|copywriting|\bcopy\b|wording|câu chữ|nội dung chữ|thông điệp/i.test(h[2])) { trongMục = true; cấp = c; continue; }
      if (trongMục && c <= cấp) trongMục = false;
      continue;
    }
    if (trongMục) {
      // "Không dùng `định tuyến`, `bản ghi`" — danh sách chữ CẤM, không phải microcopy: cắt từ chỗ đó.
      const dòngLấy = L[i].split(/\b(?:không|đừng|tránh|cấm)\s+(?:dùng|viết|ghi)\b/i)[0];
      for (const c of [...trongTick(dòngLấy), ...trongNgoặc(dòngLấy)]) if (làChữNgườiĐọc(c)) out.push({ text: c, line: i + 1, id: 'microcopy' });
    }
  }
  // Cột đầu bảng Component/Thành phần: Nút "Lưu thay đổi"
  for (let i = 0; i + 1 < L.length; i++) {
    const head = hàngBảng(L[i]);
    if (!head || !/component|thành phần|phần tử/i.test(head[0] || '') || !/^\s*\|?\s*:?-{2,}/.test(L[i + 1])) continue;
    for (let j = i + 2; j < L.length; j++) {
      const r = hàngBảng(L[j]); if (!r) break;
      for (const m of (r[0] || '').matchAll(/(?:Nút|Liên kết|Link|Button|Tab|Tiêu đề|Nhãn|Menu|Mục|Ô)\s*(?:"([^"\n]{2,120})"|“([^”\n]{2,120})”)/g)) {
        const c = m[1] || m[2]; if (làChữNgườiĐọc(c)) out.push({ text: c, line: j + 1, id: 'nhãn' });
      }
    }
  }
  if (!out.some((o) => o.id === 'microcopy')) {             // không có mục microcopy → lọc của luật 8 scan-feasible
    for (let i = 0; i < L.length; i++) for (const m of L[i].matchAll(/`([^`\n]{15,120}?[.!?])`/g)) {
      const t = m[1].trim(); if (/[\/_{}<>]/.test(t) || !/\s/.test(t)) continue;
      out.push({ text: t, line: i + 1, id: 'luật8' });
    }
  }
  return out;
}

const screens = [];
(function quét(dir) {
  let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (!e.isDirectory() || e.name.startsWith('.') || e.name === 'Ho-so' || e.name === 'removed') continue;
    const p = path.join(dir, e.name); const m = /^(S\d+)\b/i.exec(e.name);
    if (m && (fs.existsSync(path.join(p, 'srs.md')) || fs.existsSync(path.join(p, 'design-spec.md')))) screens.push({ code: m[1].toUpperCase(), dir: p });
    else quét(p);
  }
})(DOCS);
screens.sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));
const chọn = SCREEN ? screens.filter((s) => s.code === SCREEN) : screens;
if (SCREEN && !chọn.length) { console.error(`Không thấy màn ${SCREEN} trong ${DOCS}`); process.exit(2); }

/* ── 2. Gốc code ──────────────────────────────────────────────────────────────────────── */
const SKIP = new Set(['node_modules', 'dist', 'build', '.next', '.nuxt', 'coverage', 'vendor', 'prototype', '.claude', '.git',
  'test-results', 'playwright-report', 'output', '.turbo', '.cache', 'target', 'graphify-out', 'uploads', '.svelte-kit', '.output']);
function gốcCode() {
  const r = opt('--root');
  if (r) { const p = path.resolve(r); if (!fs.existsSync(p)) { console.error(`Không thấy --root ${p}`); process.exit(2); } return { roots: [p], nguon: '--root' }; }
  const đếm = new Map();
  for (const s of chọn) {
    const v = read(path.join(s.dir, 'verification.md'));
    for (const m of v.matchAll(/gốc code:\s*`([^`]+)`/g)) {
      const p = path.isAbsolute(m[1]) ? m[1] : path.resolve(PROJ, m[1]);
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) đếm.set(p, (đếm.get(p) || 0) + 1);
    }
  }
  if (đếm.size) return { roots: [[...đếm].sort((a, b) => b[1] - a[1])[0][0]], nguon: 'verification.md (gốc code:)' };
  const đường = [];
  for (const s of chọn) for (const m of read(path.join(s.dir, 'plan.md')).matchAll(/`([\w@.-]+\/[\w@./<>-]+\.\w+)`/g)) đường.push(m[1]);
  if (đường.length) {
    let ứng = [PROJ]; try { ứng = ứng.concat(fs.readdirSync(PROJ, { withFileTypes: true }).filter((e) => e.isDirectory() && !SKIP.has(e.name) && e.name !== path.basename(DOCS)).map((e) => path.join(PROJ, e.name))); } catch { /* chỉ PROJ */ }
    const điểm = ứng.map((c) => [c, đường.filter((d) => fs.existsSync(path.join(c, d))).length]).sort((a, b) => b[1] - a[1]);
    if (điểm[0][1] > 0) return { roots: [điểm[0][0]], nguon: `plan.md (${điểm[0][1]}/${đường.length} đường dẫn có thật)` };
  }
  return { roots: [PROJ], nguon: 'cha của docs' };
}
const GỐC = gốcCode();

/* ── 3. Literal trong code ────────────────────────────────────────────────────────────── */
const EXT_JS = /\.(m?[jt]sx?|cjs|vue|svelte)$/; const EXT_HASH = /\.(py|rb|ya?ml|sh|toml)$/;
const EXT = /\.(m?[jt]sx?|cjs|vue|svelte|html?|json|py|rb|ya?ml|go|java|kt|rs|php|cs|dart|swift|properties|po|arb)$/;
const làTest = (rel) => /(^|\/)(__tests__|__mocks__|tests?|e2e|spec|fixtures?|stories)\//.test(rel) || /\.(test|spec|e2e|stories)\.\w+$/.test(rel);
const files = [];
(function đi(dir) {
  let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name) && path.resolve(p) !== DOCS) đi(p); continue; }
    if (!EXT.test(e.name) || /\.min\.js$|package-lock\.json$|\.lock$|\.map$/.test(e.name)) continue;
    try { if (fs.statSync(p).size > 1.5e6) continue; } catch { continue; }
    files.push(p);
  }
})(GỐC.roots[0]);

function dòngCủa(src) { const nl = [0]; for (let i = 0; i < src.length; i++) if (src[i] === '\n') nl.push(i + 1); return (idx) => { let lo = 0, hi = nl.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (nl[mid] <= idx) lo = mid; else hi = mid - 1; } return lo + 1; }; }
function unescape(s) { return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\n|\\t|\\r/g, ' ').replace(/\\(["'`\\])/g, '$1'); }

/** Trả { lits:[{start,end,text}], masked } — masked = nguồn với comment thay bằng khoảng trắng (giữ vị trí). */
function tách(src, file) {
  const js = EXT_JS.test(file); const hash = EXT_HASH.test(file); const html = /\.(html?|vue|svelte)$/.test(file);
  const lits = []; const m = src.split('');
  const trắng = (a, b) => { for (let k = a; k < b; k++) if (m[k] !== '\n') m[k] = ' '; };
  let i = 0; const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (html && src.startsWith('<!--', i)) { const e = src.indexOf('-->', i + 4); const end = e < 0 ? n : e + 3; trắng(i, end); i = end; continue; }
    if (!hash && c === '/' && d === '/' && src[i - 1] !== ':' && src[i - 1] !== '\\') { const e = src.indexOf('\n', i); const end = e < 0 ? n : e; trắng(i, end); i = end; continue; }
    if (!hash && c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); const end = e < 0 ? n : e + 2; trắng(i, end); i = end; continue; }
    if (hash && c === '#') { const e = src.indexOf('\n', i); const end = e < 0 ? n : e; trắng(i, end); i = end; continue; }
    if (hash && (src.startsWith('"""', i) || src.startsWith("'''", i))) { const q = src.slice(i, i + 3); const e = src.indexOf(q, i + 3); const end = e < 0 ? n : e + 3; lits.push({ start: i, end, text: src.slice(i + 3, e < 0 ? n : e) }); i = end; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1; let ok = false;
      while (j < n) { if (src[j] === '\\') { j += 2; continue; } if (src[j] === c) { ok = true; break; } if (src[j] === '\n') break; j++; }
      if (ok) { lits.push({ start: i, end: j + 1, text: unescape(src.slice(i + 1, j)) }); i = j + 1; continue; }
      i++; continue;
    }
    if (c === '`' && (js || /\.go$/.test(file))) {
      let j = i + 1; let buf = ''; let ok = false;
      while (j < n) {
        if (src[j] === '\\') { buf += src.slice(j, j + 2); j += 2; continue; }
        if (src[j] === '`') { ok = true; break; }
        if (js && src[j] === '$' && src[j + 1] === '{') { let dep = 1; j += 2; while (j < n && dep) { if (src[j] === '{') dep++; else if (src[j] === '}') dep--; j++; } buf += W; continue; }
        buf += src[j]; j++;
      }
      if (ok) { lits.push({ start: i, end: j + 1, text: unescape(buf) }); i = j + 1; continue; }
      i++; continue;
    }
    i++;
  }
  return { lits, masked: m.join('') };
}

function chữGiữaThẻ(masked) {
  const out = [];
  // Hai lượt: nguyên thẻ (mỗi <span> một mảnh) và bỏ thẻ nội tuyến (câu bị <b> chẻ đôi thành một mảnh).
  const bỏThẻ = masked.replace(/<\/?(?:b|strong|em|i|u|span|mark|small|code|br)\b[^<>]*\/?>/g, (t) => t.replace(/[^\n]/g, ' '));
  // Mảnh dừng ở < HOẶC > — `{n > 0 ? (` giữa chữ JSX không được nuốt mất cả mảnh đứng trước nó.
  for (const mm of [...masked.matchAll(/>([^<>]+)(?=[<>])/g), ...bỏThẻ.matchAll(/>([^<>]+)(?=[<>])/g)]) {
    const raw = mm[1]; if (!/\p{L}/u.test(raw) || /[;]|=>|&&|\|\||\breturn\b|\bconst\b/.test(raw.replace(/\{[^{}]*\}/g, ''))) continue;
    let t = raw.replace(/\{\s*(['"`])((?:(?!\1).)*)\1\s*\}/g, '$2').replace(/\{[^{}]*\}/g, W).replace(/\{[^{}]*$/, W).replace(/^[^{}]*\}/, W);
    const off = raw.search(/\S/); out.push({ start: mm.index + 1 + (off < 0 ? 0 : off), text: t });
  }
  return out;
}

function nạpCode() {
  const hồ = { chạy: [], test: [] };
  for (const f of files) {
    const src = read(f); if (!src || !/[^\x00-\x7f]|[a-z]\s[a-z]/i.test(src)) continue;
    const rel = path.relative(PROJ, f).split(path.sep).join('/');
    const line = dòngCủa(src); const { lits, masked } = tách(src, f);
    const pool = làTest(rel) ? hồ.test : hồ.chạy;
    // Định danh ASCII một khối (test_connection, route, khoá i18n) không phải chữ người đọc — bỏ, kẻo thành `gần` oan.
    const thêm = (text, start) => { const t = chuẩn(text, 'code'); if (t && /\p{L}/u.test(t) && t.length <= 2000 && !/^[\x21-\x7e]+$/.test(t)) pool.push({ t, loc: `${rel}:${line(start)}` }); };
    for (const l of lits) thêm(l.text, l.start);
    // Ghép literal nối bằng `+` (kể cả qua một biến đơn giản) — chuỗi dài bị xuống dòng.
    for (let k = 0; k < lits.length; k++) {
      let text = lits[k].text; let j = k; let ghép = false;
      const trước = src.slice(Math.max(0, lits[k].start - 60), lits[k].start);
      if (/[\w$)\]]\s*\+\s*$/.test(trước)) { text = W + text; ghép = true; }
      while (j + 1 < lits.length) {
        const gap = src.slice(lits[j].end, lits[j + 1].start);
        if (/^\s*\+\s*$/.test(gap)) text += lits[j + 1].text;
        else if (/^\s*\+\s*[\w$.()[\]?!]{1,60}\s*\+\s*$/.test(gap)) text += W + lits[j + 1].text;
        else break;
        j++; ghép = true;
      }
      if (/^\s*\+\s*[\w$(]/.test(src.slice(lits[j].end, lits[j].end + 60))) { text += W; ghép = true; }
      if (ghép) thêm(text, lits[k].start);
    }
    if (/\.(jsx|tsx|vue|svelte|html?)$/.test(f)) for (const x of chữGiữaThẻ(masked)) thêm(x.text, x.start);
  }
  for (const k of ['chạy', 'test']) {
    const P = hồ[k]; const exact = new Map(); const fold = new Map(); const idx = new Map();
    P.forEach((e, id) => {
      e.f = bỏDấu(e.t); e.w = new Set(từ(e.t));
      if (exact.has(e.t)) return;                       // cùng chữ ở nhiều file: giữ nơi đầu, không chiếm chỗ ứng viên
      exact.set(e.t, id);
      if (!fold.has(e.f)) fold.set(e.f, id);
      for (const w of e.w) { let a = idx.get(w); if (!a) idx.set(w, a = []); a.push(id); }
    });
    hồ[k] = { P, exact, fold, idx };
  }
  return hồ;
}

/* ── 4. So khớp ───────────────────────────────────────────────────────────────────────── */
const NOTAL = /[^\p{L}\p{N}]/u;
/** Khoảng cách sửa bán-toàn-cục: `pat` (tài liệu) phải khớp trọn, `txt` (code) được thừa đầu/cuối. § hai phía = đoạn bất kỳ.
 *  ¦ ở hai đầu pat = ranh giới từ (khớp ký tự không phải chữ/số của txt, txt được đệm \u0002 hai đầu). */
function khoảng(pat, txt, hoaĐầu = true) {
  const p = '¦' + pat + '¦'; const t = '\u0002' + txt + '\u0002';
  const m = p.length, n = t.length;
  let prev = new Float64Array(m + 1), cur = new Float64Array(m + 1);
  let ps = new Int32Array(m + 1), cs = new Int32Array(m + 1);
  // pk/ck: số CHỮ CÁI của tài liệu khớp đúng chữ cái của code trên đường đi — để biết câu có thật trong code hay chỉ
  // được các biến (§ hai phía) nuốt hộ.
  let pk = new Int32Array(m + 1), ck = new Int32Array(m + 1);
  const LET = /\p{L}/u;
  const khởi = (row, st, i) => { row[0] = 0; st[0] = i; for (let j = 1; j <= m; j++) { row[j] = row[j - 1] + (p[j - 1] === W ? 0 : 1); st[j] = i; } };
  khởi(prev, ps, 0);
  let best = prev[m], bestEnd = 0, bestStart = 0, bestK = 0;
  for (let i = 1; i <= n; i++) {
    const tc = t[i - 1]; cur[0] = 0; cs[0] = i; ck[0] = 0;
    for (let j = 1; j <= m; j++) {
      const pc = p[j - 1];
      // Chữ ĐẦU của tài liệu không phân hoa/thường: "Có ít nhất một chữ số" nằm trong "Mật khẩu phải có ít nhất một chữ số".
      const eq = pc === tc || tc === W || (pc === '¦' && NOTAL.test(tc)) || (hoaĐầu && j === 2 && pc.toLowerCase() === tc.toLowerCase());
      let v = prev[j - 1] + (eq ? 0 : 1), s = ps[j - 1], k = pk[j - 1] + (eq && tc !== W && LET.test(pc) ? 1 : 0);
      const del = prev[j] + ((tc === W || pc === W) ? 0 : 1); if (del < v || (del === v && (pk[j] > k || (pk[j] === k && ps[j] < s)))) { v = del; s = ps[j]; k = pk[j]; }
      const ins = cur[j - 1] + ((pc === W || tc === W) ? 0 : 1); if (ins < v || (ins === v && (ck[j - 1] > k || (ck[j - 1] === k && cs[j - 1] < s)))) { v = ins; s = cs[j - 1]; k = ck[j - 1]; }
      cur[j] = v; cs[j] = s; ck[j] = k;
    }
    // Hoà điểm → lấy đoạn code dài hơn: "Hơn §" + đuôi thừa miễn phí cũng 0 điểm như "Hơn § ticket khớp điều kiện".
    if (cur[m] < best || (cur[m] === best && (ck[m] > bestK || (ck[m] === bestK && i - cs[m] > bestEnd - bestStart)))) { best = cur[m]; bestEnd = i; bestStart = cs[m]; bestK = ck[m]; }
    [prev, cur] = [cur, prev]; [ps, cs] = [cs, ps]; [pk, ck] = [ck, pk];
  }
  const sub = t.slice(bestStart, bestEnd).replace(/\u0002/g, '');
  return { d: best, k: bestK, sub: sub.replace(/^[^\p{L}\p{N}§]+|[^\p{L}\p{N}§.!?…]+$/gu, '') };
}
function diffNgắn(a, b) {
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  let j = 0; while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
  const cắt = (s) => (s.length > 40 ? s.slice(0, 18) + '…' + s.slice(-18) : s);
  return `${i > 12 ? '…' : ''}${a.slice(Math.max(0, i - 12), i)}[${cắt(a.slice(i, a.length - j))} → ${cắt(b.slice(i, b.length - j))}]${b.slice(b.length - j, b.length - j + 12)}${j > 12 ? '…' : ''}`;
}
/** "Hủy"/"Huỷ" cùng bộ dấu, khác chỗ đặt → 'vị trí dấu' (kiểu cũ/mới); còn lại 'dấu' (thiếu/sai dấu — "Mat khau"). */
function loạiDấu(a, b) {
  const dấu = (x) => [...x.normalize('NFD')].filter((c) => /[\u0300-\u036f]/.test(c)).sort().join('');
  return a.length === b.length && dấu(a) === dấu(b) ? 'vị trí dấu' : 'dấu';
}
const ngưỡng = (s) => Math.max(1, Math.min(4, Math.floor(chữThật(s) / 12)));

function so(s, H) {
  const { P, exact, fold, idx } = H;
  if (exact.has(s)) return { kq: 'khớp', loc: P[exact.get(s)].loc };
  // Chỉ khác hoa/thường ở CHỮ ĐẦU: tài liệu hay nhắc nhãn giữa câu bằng chữ thường (`nhóm gửi`) — không tính là lệch.
  const hoaĐầu = s.charAt(0).toLocaleUpperCase('vi') + s.slice(1);
  if (hoaĐầu !== s && exact.has(hoaĐầu)) return { kq: 'khớp', loc: P[exact.get(hoaĐầu)].loc, hoaDau: true };
  const sf = bỏDấu(s);
  const mộtTừ = !/\s/.test(s.replace(new RegExp(W, 'g'), '').trim());

  if (fold.has(sf)) {
    const e = P[fold.get(sf)]; const loai = loạiDấu(s, e.t);
    // Một từ: "Đang"/"Dạng"/"Đăng" cùng gốc chữ mà là từ khác — chỉ tính khi code KHÔNG dấu ("Huy") hoặc chỉ lệch chỗ đặt dấu.
    if (!mộtTừ || loai === 'vị trí dấu' || e.t === bỏDấu(e.t)) return { kq: 'gần', loc: e.loc, loai, diff: diffNgắn(s, e.t), code: e.t };
  }
  if (mộtTừ || (chữThật(s) < 4 && !/\d/.test(s))) return { kq: 'không thấy' };
  const ws = [...new Set(từ(s))]; if (!ws.length) return { kq: 'không thấy' };
  const điểm = new Map();
  for (const w of ws) { const a = idx.get(w); if (!a || a.length > 5000) continue; for (const id of a) điểm.set(id, (điểm.get(id) || 0) + 1); }
  const cần = Math.max(1, Math.ceil(ws.length * 0.6)); const chữS = chữThật(s);
  const ứng = [...điểm].filter(([id, c]) => c >= cần && chữThật(P[id].t) >= Math.min(chữS * 0.6, 6)).sort((a, b) => b[1] - a[1] || P[a[0]].t.length - P[b[0]].t.length).slice(0, 12);
  let tốt = null;
  for (const [id] of ứng) {
    const e = P[id]; if (e.t.length > 1500) continue;
    const r = khoảng(s, e.t);
    // Biến (§) nuốt bao nhiêu chữ cũng 0 điểm — "§ − § ticket huỷ" sẽ "khớp" mọi câu có "ticket huỷ". Chặn: ≥60% chữ cái
    // của tài liệu phải khớp đúng chữ cái của code (số, dấu câu không tính — "TB 01:35:00" ↔ "TB §" vẫn khớp).
    if (r.k < chữCái(s) * 0.6) continue;
    if (!tốt || r.d < tốt.d) tốt = { ...r, e };
    if (r.d === 0) return { kq: 'khớp', loc: e.loc };
  }
  if (!tốt) return { kq: 'không thấy' };
  const rf = khoảng(sf, bỏDấu(tốt.e.t), false);            // lệch dấu: chữ đầu phải cùng hoa/thường ("Đội" ≠ "dõi")
  if (rf.d === 0) return { kq: 'gần', loc: tốt.e.loc, loai: loạiDấu(s, tốt.sub), diff: diffNgắn(s, tốt.sub), code: tốt.sub };
  if (tốt.d <= ngưỡng(s)) return { kq: 'gần', loc: tốt.e.loc, loai: s.toLowerCase() === tốt.sub.toLowerCase() ? 'hoa/thường' : 'ký tự', d: tốt.d, diff: diffNgắn(s, tốt.sub), code: tốt.sub };
  return { kq: 'không thấy' };
}
function soCả(s, H) {
  const r = so(s, H); if (r.kq !== 'không thấy') return r;
  // Tách theo câu; "Nhãn: câu" chỉ tách khi vế sau ≥5 từ (vế sau ngắn thường là DỮ LIỆU ví dụ: "Phạm vi: IT Hỗ trợ").
  let câu = s.split(/(?<=[.!?])\s+/);
  const hai = /^([^:]{2,30}):\s+(.+)$/.exec(câu[0] || '');
  if (hai && (hai[2].match(/\p{L}+/gu) || []).length >= 5) câu = [hai[1], hai[2], ...câu.slice(1)];
  câu = câu.map((x) => chuẩn(x, 'code')).filter((x) => /\s/.test(x));
  if (câu.length < 2) return r;
  const phần = câu.map((c) => ({ c, r: so(c, H) }));
  const thấy = phần.filter((p) => p.r.kq !== 'không thấy');
  // Chỉ thấy mỗi cái nhãn ngắn ("Phạm vi") thì chưa phải bằng chứng câu có trong code → giữ `không thấy`.
  if (!thấy.length || thấy.reduce((a, p) => a + chữThật(p.c), 0) < chữThật(s) * 0.4) return r;
  const locs = thấy.map((p) => p.r.loc);
  if (thấy.length === phần.length && phần.every((p) => p.r.kq === 'khớp')) return { kq: 'khớp', loc: locs.join(' + '), ghep: phần.length };
  const thiếu = phần.filter((p) => p.r.kq === 'không thấy').map((p) => p.c);
  const gần = phần.find((p) => p.r.kq === 'gần');
  return { kq: 'gần', loc: locs.join(' + '), loai: thiếu.length ? 'thiếu câu' : gần.r.loai, diff: thiếu.length ? `thiếu: “${thiếu.join('” “')}”` : gần.r.diff };
}

/* ── 5. Chạy ──────────────────────────────────────────────────────────────────────────── */
const H = nạpCode();
const kếtQuả = [];
for (const sc of chọn) {
  const nguồn = [];
  for (const x of chuỗiTừSrs(read(path.join(sc.dir, 'srs.md')))) nguồn.push({ ...x, file: 'srs.md' });
  for (const x of chuỗiTừDesign(read(path.join(sc.dir, 'design-spec.md')))) nguồn.push({ ...x, file: 'design-spec.md' });
  const gộp = new Map();
  for (const x of nguồn) {
    const t = chuẩn(x.text, 'doc'); if (!t || chữThật(t) < 2) continue;
    const ref = `${x.file}:${x.line}${x.id && !/^(microcopy|nhãn|luật8)$/.test(x.id) ? ' ' + x.id : ''}`;
    if (gộp.has(t)) gộp.get(t).nguon.push(ref); else gộp.set(t, { chuoi: x.text.trim(), chuan: t, nguon: [ref] });
  }
  const dòng = [];
  for (const g of gộp.values()) {
    const r = soCả(g.chuan, H.chạy);
    const o = { chuoi: g.chuoi, nguon: g.nguon, ketQua: r.kq };
    if (r.loc) o.viTri = r.loc; if (r.loai) o.loai = r.loai; if (r.diff) o.diff = r.diff; if (r.ghep) o.ghep = r.ghep;
    if (r.kq !== 'khớp' && H.test.P.length) { const t = soCả(g.chuan, H.test); if (t.kq !== 'không thấy') o.trongTest = { ketQua: t.kq, viTri: t.loc }; }
    dòng.push(o);
  }
  const đếm = { khop: 0, gan: 0, khongThay: 0 };
  for (const d of dòng) d.ketQua === 'khớp' ? đếm.khop++ : d.ketQua === 'gần' ? đếm.gan++ : đếm.khongThay++;
  kếtQuả.push({ man: sc.code, thuMuc: path.relative(PROJ, sc.dir).split(path.sep).join('/'), soChuoi: dòng.length, ...đếm, chuoi: dòng });
}
const tổng = kếtQuả.reduce((a, s) => ({ chuoi: a.chuoi + s.soChuoi, khop: a.khop + s.khop, gan: a.gan + s.gan, khongThay: a.khongThay + s.khongThay }), { chuoi: 0, khop: 0, gan: 0, khongThay: 0 });
const ra = {
  docsDir: DOCS, goc: GỐC.roots[0], nguonGoc: GỐC.nguon, soFileCode: files.length, soLiteral: H.chạy.P.length, soLiteralTest: H.test.P.length,
  khongCoCode: H.chạy.P.length === 0, tong: tổng, man: kếtQuả, gioiHan,
};

if (PLAIN) {
  const L = [];
  L.push(`scan-microcopy — ${path.relative(process.cwd(), DOCS) || DOCS} · gốc code: ${path.relative(process.cwd(), GỐC.roots[0]) || '.'} (${GỐC.nguon}) · ${files.length} file, ${H.chạy.P.length} literal (+${H.test.P.length} trong test)`);
  if (ra.khongCoCode) L.push(`  (không có literal code nào — chưa dev, hoặc sai --root; ${tổng.chuoi} chuỗi tài liệu chưa so được)`);
  for (const s of ra.khongCoCode ? [] : kếtQuả) {
    if (!s.soChuoi) continue;
    L.push(`\n${s.man} — ${s.soChuoi} chuỗi: ${s.khop} khớp · ${s.gan} gần · ${s.khongThay} không thấy`);
    for (const d of s.chuoi.filter((x) => x.ketQua === 'gần')) L.push(`  ≈ gần [${d.loai}] “${d.chuoi}” (${d.nguon[0]}) ↔ ${d.viTri}\n      ${d.diff}`);
    if (!ra.khongCoCode) for (const d of s.chuoi.filter((x) => x.ketQua === 'không thấy')) L.push(`  ∅ không thấy “${d.chuoi}” (${d.nguon[0]})${d.trongTest ? ` — chỉ trong test (${d.trongTest.ketQua}): ${d.trongTest.viTri}` : ''}`);
  }
  if (!ra.khongCoCode) L.push(`\nTổng: ${tổng.chuoi} chuỗi · ${tổng.khop} khớp · ${tổng.gan} gần · ${tổng.khongThay} không thấy. 🟡 mồi cho verifier/judge — soi diff trước khi mở việc.`);
  L.push('Giới hạn:'); for (const g of gioiHan) L.push(`  · ${g}`);
  process.stdout.write(L.join('\n') + '\n');
} else {
  process.stdout.write(JSON.stringify(ra, null, 1) + '\n');
}
process.exitCode = STRICT ? Math.min(125, tổng.gan) : 0;
