#!/usr/bin/env node
/*
 * ba-html-design/check-design.js — ĐẾM kỷ luật design của mọi `html-design.html` so với ngân sách §4b và bảng token
 * của `07-design-system.md`. Checker TĨNH, zero-dependency, CommonJS. Đếm, không phán đẹp/xấu.
 *
 *   node .claude/skills/ba-html-design/scripts/check-design.js <docsDir | file.html> [--include-shell] [--plain|--json] [--rules]
 *   node .claude/skills/ba-html-design/scripts/check-design.js <docsDir | file.html> --count [--json] [--include-shell]
 *
 * --count (W3 07/10/2026 — nguồn cho `ba-design-system --reverse-4b`): KHÔNG kiểm luật, chỉ ĐẾM giá trị thật đang dùng
 *   theo từng khoá ngân sách (radius · shadow · font-family · font-size · spacing): tập giá trị khác nhau, số lần dùng,
 *   file dùng nhiều nhất. Cùng chuẩn hoá và cùng phần bỏ qua như khi kiểm (khung shell/demo, `0`, vòng focus, inset…).
 *   JSON: { counts: { radius: { values: {"8px": 12, …}, files: <số file dùng khoá>, topFile: {file, uses}, maxPerFile }, … },
 *   files: [...] }. `maxPerFile` = số giá trị khác nhau nhiều nhất trong MỘT file — trần §4b áp theo từng file, nên đề xuất
 *   trần nhìn số này, không nhìn tổng toàn dự án. Giá trị so theo CHUỖI đã chuẩn hoá: `rgba(0,0,0,.08)` ≠ `rgba(0,0,0,0.08)`.
 *   Exit 0 (đếm, không phải cổng).
 *
 * Luật (mã cố định — rule-cover đo mỗi mã có fixture gãy bắn):
 *   ❌ DS-EMOJI            emoji trong chữ hiển thị — icon phải là inline SVG
 *   ❌ DS-BUDGET-radius · -shadow · -font-family · -font-size   số giá trị KHÁC NHAU trong MỘT file vượt trần §4b
 *   ❌ DS-HEX              hex trong CSS/style="" không có trong 07 (chỉ khi có 07)
 *   ⚠️ DS-SPACING          padding/margin/gap (px) ngoài thang spacing §4b
 *   ⚠️ DS-GRADIENT · DS-BLUR (backdrop-filter) · DS-TEXTCLIP (background-clip:text / text-fill-color transparent)
 *   ⚠️ DS-NEGMARGIN        margin âm mà cùng dòng không có `/* lý do *\/`
 * Đầu ra: danh sách P của `ba-toolkit/scripts/plist.js` (gộp trùng theo mã + mô tả đã bỏ số), dòng `Đã kiểm / Chưa
 * kiểm` LUÔN in. `--json` → {files, errors, warns, errorGroups, groups, unchecked:[{what, why}]} (unchecked = đúng dòng
 * `Chưa kiểm` của bản chữ). Exit = số NHÓM ❌ (mục P mức ❌, tối đa 255) —
 * cùng thước với dòng tiêu đề "❌ N" mà agent đọc; 30 hex lạ cùng gốc là MỘT việc phải đối chiếu, không phải 30.
 *
 * VÌ SAO CÓ (spec 2026-10-05 P1, học từ evondevKit `ui-ux`): bản dựng html-design trôi dần khỏi design system theo
 * cách không ai thấy khi soi từng màn — 7 bo góc khác nhau, 3 họ font, hex tự pha, emoji làm icon, gradient/blur
 * "trông như AI dựng". Mấy thứ này ĐẾM được, nên đếm bằng máy; ngân sách lấy từ chính 07 §4b của dự án.
 *
 * KHUNG DÙNG CHUNG (shell) — `app-header`/`app-nav`/`statebar` (phần tử) và rule CSS mà MỌI selector đều chạm class
 * khung (shell.md: app-header, app-nav, statebar, brand*, icon-btn, badge-count, avatar*, header-tools, auth-shell)
 * — được BỎ QUA mặc định như `scan-html.js`: khung có `check-shell.js` soát, báo lại ở từng màn là 6 lần một dòng.
 * `--include-shell` để đếm cả khung.
 *
 * gioiHan:
 *   - Chỉ đọc CSS TĨNH: `<style>` + `style=""`. Không chạy JS, không cascade, không biết rule nào thật sự áp — số giá
 *     trị là số giá trị VIẾT RA, không phải số giá trị NHÌN THẤY. Bố cục/thứ tự/tràn → `shot.js` (Chrome) đo.
 *   - `var(--x)` được thay bằng định nghĩa `--x:` trong cùng file (không có thì lấy fallback, vẫn không có thì bỏ qua
 *     token đó) để đếm ngân sách; bản thân dòng định nghĩa `--x:` không tính ngân sách (token khai mà không dùng thì
 *     không hiện ra). Riêng DS-HEX: hex nằm trong fallback `var(--x,#fff)` KHÔNG bị bắt — canon shell.md dùng đúng
 *     mẫu này; hex ở định nghĩa `--x: #…` thì CÓ bị so với 07.
 *   - DS-HEX: tập hex = MỌI `#rgb/#rrggbb/#rrggbbaa` xuất hiện ở bất kỳ đâu trong 07 (không chỉ bảng §2), so không
 *     phân biệt hoa thường, `#abc` nở thành `#aabbcc`; `#rrggbbaa` được nhận khi `#rrggbb` có trong 07 (token + độ
 *     trong). Hex trong thuộc tính SVG (`fill="#…"`) và rgb()/hsl()/tên màu không so.
 *   - DS-EMOJI: ký tự `\p{Extended_Pictographic}` CHỈ tính khi mặc định hiện dạng emoji (`\p{Emoji_Presentation}`,
 *     vd ✅ ❌ 🔔 ⭐), hoặc đứng trước U+FE0F (⚠️), hoặc nằm ngoài BMP (≥ U+1F000). Ký hiệu hiện dạng chữ — © ® ™,
 *     mũi tên ↔, ✔ ▶ ☀ ⚠ không kèm FE0F — KHÔNG tính (đúng là chữ, font vẽ). Chỉ soát nút chữ (text node); thuộc tính
 *     (`title`, `aria-label`), `<script>`, `<style>`, comment bỏ qua; nút demo `onclick="setState(…)"` (thanh trạng thái
 *     kiểu cũ không mang class `statebar`) tính là khung, bỏ qua; mọi thứ NẰM TRONG khung demo (class `statebar*`/`demo-*`,
 *     `data-demo`, `role="toolbar"` có aria-label chứa "demo") cũng bỏ qua — khung demo không mang dấu hiệu nào thì
 *     vẫn bị đếm; emoji viết bằng entity (`&#x1F514;`) không thấy.
 *   - Ngân sách đếm theo TỪNG FILE. radius: `999px`/`9999px`/`50%`/`100%` (≥ 999px) gộp một giá trị "pill", `0` không
 *     tính; shadow: bỏ `none`, lớp vòng focus thuần `0 0 0 Npx …` và mọi lớp `inset` (viền nhấn, không phải lớp nổi);
 *     font-size: rem/em → px theo gốc 16 (`inherit`, `100%`, `1em` không tính); font-family: tính họ ĐẦU của chuỗi
 *     (`font:… inherit` không tính), họ mono (`monospace`, *mono*,
 *     Menlo, Consolas, Courier) được thêm 1 ngoài trần như ghi chú §4b. `accent`, `nesting` không đếm (cần nhìn).
 *   - DS-SPACING: chỉ padding-*, margin-*, gap/row-gap/column-gap; px và rem (×16); `0`, `1px`, `2px` (viền) bỏ qua;
 *     margin âm so theo trị tuyệt đối; %, em, calc(), auto không so.
 *   - Không có §4b trong 07 → trần mặc định (accent 1 · font-family 1 · font-size 6 · radius 4 · shadow 2 · spacing
 *     4 8 12 16 20 24 32 40) và dòng Chưa kiểm nói vậy.
 *   - DS-HEX: hex "đã khai" = mọi hex trong 07 TRỪ mục có tiêu đề nợ/lệch/biến thể/đã gộp/chuẩn hoá (mục con thừa
 *     hưởng) — ghi màu lệch vào sổ nợ không hợp thức hoá nó. Hex nhắc trong văn xuôi ở mục khác vẫn tính là đã khai. Đích là thư mục màn hoặc một file → tìm 07 ở thư mục cha gần nhất (≤6 cấp).
 *   - Parser CSS tự viết: chịu @media lồng, không chịu `{`/`}` trong chuỗi CSS.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const plist = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'plist.js'));
const RC = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'rule-cover.js'));
const { resolveDoc } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));

const LUẬT = [
  ['DS-EMOJI', 'emoji trong chữ hiển thị (icon phải là inline SVG)'],
  ['DS-BUDGET-radius', 'số giá trị bo góc khác nhau trong một file vượt trần §4b'],
  ['DS-BUDGET-shadow', 'số giá trị đổ bóng khác nhau vượt trần §4b (bỏ none, vòng focus)'],
  ['DS-BUDGET-font-family', 'số họ font khác nhau vượt trần §4b (+1 mono)'],
  ['DS-BUDGET-font-size', 'số cỡ chữ khác nhau vượt trần §4b'],
  ['DS-HEX', 'hex trong CSS không có trong 07-design-system.md'],
  ['DS-SPACING', 'padding/margin/gap ngoài thang spacing §4b'],
  ['DS-GRADIENT', 'có gradient'],
  ['DS-BLUR', 'có backdrop-filter'],
  ['DS-TEXTCLIP', 'chữ trong suốt cắt nền (background-clip:text)'],
  ['DS-NEGMARGIN', 'margin âm không có comment lý do cùng dòng'],
];
const argv = process.argv.slice(2);
RC.inLuật(argv, LUẬT);
const JSON_MODE = argv.includes('--json');
const COUNT_MODE = argv.includes('--count');
const INCLUDE_SHELL = argv.includes('--include-shell');
const target = argv.find((a) => !a.startsWith('--'));
if (!target || !fs.existsSync(target)) {
  console.error('Dùng: check-design.js <docsDir | file.html> [--include-shell] [--plain|--json] [--rules]');
  process.exit(2);
}

/* ─── Ngân sách + tập hex từ 07 ───────────────────────────────────────────────────────────── */
const MẶC_ĐỊNH = { accent: 1, 'font-family': 1, 'font-size': 6, radius: 4, shadow: 2, spacing: [4, 8, 12, 16, 20, 24, 32, 40] };
const expandHex = (h) => {
  let x = h.toLowerCase().replace(/^#/, '');
  if (x.length === 3 || x.length === 4) x = x.split('').map((c) => c + c).join('');
  return '#' + x;
};
const HEX_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g;

// Hex "đã khai" = mọi hex trong 07 TRỪ mục nợ/lệch/biến thể đã gộp (mục con thừa hưởng): dự án TTS 05/10/2026 ghi
// màu teal lệch vào §13 "Còn lệch so với chuẩn" thì chính 195 chỗ lệch thành "đã khai" (agent phải bỏ dấu # để né).
// Không lọc theo kiểu "chỉ mục Màu": dự án desktop khai màu token ở `2.1 --accent-text` và ở §7 composite — đều hợp lệ.
const LOẠI_HD = /lệch|nợ|debt|chuẩn hoá|chuẩn hóa|biến thể|đã gộp|deprecated/i;
function hexKhai(md) {
  const out = []; const stack = []; let on = true;
  for (const l of md.split('\n')) {
    const h = /^(#{1,6})\s+(.*)$/.exec(l);
    if (h) {
      const lv = h[1].length; while (stack.length && stack[stack.length - 1].lv >= lv) stack.pop();
      const cha = stack.length ? stack[stack.length - 1].on : true;
      on = cha && !LOẠI_HD.test(h[2]);
      stack.push({ lv, on }); continue;
    }
    if (on) out.push(l);
  }
  return out.join('\n');
}
function đọc07(docs) {
  const f = docs ? resolveDoc(docs, '07-design-system.md') : null;
  if (!f) return { file: null, budget: { ...MẶC_ĐỊNH }, src: 'trần mặc định', has4b: false, hex: null };
  const md = fs.readFileSync(f, 'utf8');
  const hex = new Set((hexKhai(md).match(HEX_RE) || []).map(expandHex));
  const budget = { ...MẶC_ĐỊNH }; let has4b = false;
  const lines = md.split('\n'); const i0 = lines.findIndex((l) => /^#{2,4}\s*4b\b/i.test(l));
  if (i0 >= 0) {
    for (let i = i0 + 1; i < lines.length && !/^#{1,4}\s/.test(lines[i]); i++) {
      const m = /^\|\s*`([a-z-]+)`\s*\|\s*([^|]+)\|/.exec(lines[i]); if (!m) continue;
      const k = m[1], v = m[2].replace(/`/g, '').trim();
      if (k === 'spacing') { const ns = (v.match(/\d+/g) || []).map(Number); if (ns.length) { budget.spacing = ns; has4b = true; } }
      else if (/^\d+/.test(v)) { budget[k] = parseInt(v, 10); has4b = true; }
    }
  }
  return { file: f, budget, src: has4b ? '07 §4b' : 'trần mặc định', has4b, hex };
}

/* ─── Tìm file ─────────────────────────────────────────────────────────────────────────────── */
function walk(dir, acc = []) {
  let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!/^(removed|node_modules|\.git|vendor)$/.test(e.name)) walk(p, acc); }
    else if (e.name === 'html-design.html') acc.push(p);
  }
  return acc;
}
const T = path.resolve(target);
let docs = null, files = [];
const isDir = fs.statSync(T).isDirectory();
files = isDir ? walk(T).sort() : [T];
// Đích là thư mục màn hay một file → 07 nằm ở `docs/` phía trên: đi lên ≤6 cấp (SKILL gọi check-design "<folder màn>").
{ let d = isDir ? T : path.dirname(T);
  for (let k = 0; k < 7; k++) { if (resolveDoc(d, '07-design-system.md')) { docs = d; break; } const up = path.dirname(d); if (up === d) break; d = up; } }
if (!docs && isDir) docs = T;
const BASE = docs || path.dirname(T);
const DS = đọc07(docs);

/* ─── Chuẩn hoá giá trị ────────────────────────────────────────────────────────────────────── */
const SHELL_CLS = new Set(['app-header', 'app-nav', 'statebar', 'brand', 'brand-icon', 'brand-name', 'icon-btn', 'badge-count', 'avatar', 'avatar-btn', 'header-tools', 'auth-shell']);
const isShellSel = (sel) => sel.split(',').every((s) => (s.match(/\.([\w-]+)/g) || []).some((c) => SHELL_CLS.has(c.slice(1).split(/__|--/)[0])));
const isShellEl = (attrs) => /\bclass\s*=\s*["'][^"']*\b(app-header|app-nav|statebar)\b(?![\w-])/i.test(attrs);
// Nút demo trạng thái kiểu cũ (không class `statebar`, dự án desktop S29): `onclick="setState(…)"` là khung demo, không phải UI sản phẩm.
const isDemoBtn = (attrs) => /\bonclick\s*=\s*["'][^"']*\bsetState\s*\(/i.test(attrs);
// Khung demo (W2 OAN-1 07/10/2026, dự án desktop S29 `div.demo-bar`): MỌI nút nằm trong khung demo là chrome demo — kể cả nút
// `toast()`/`openModal()` không gọi setState. Nhận khung theo dấu hiệu tác giả tự ghi, cùng họ check-el (decision 23):
// class `statebar*`/`demo-*`, thuộc tính `data-demo`, hoặc `role="toolbar"` có aria-label nói "demo". Ngoài khung thì
// emoji vẫn bị đếm (cây file 📁📄 của chính màn).
const isDemoBox = (attrs) => /\bclass\s*=\s*["'][^"']*(?<![\w-])(statebar(?:__[\w-]+)?|demo-[\w-]+)(?![\w-])/i.test(attrs)
  || /\bdata-demo\b/i.test(attrs)
  || (/\brole\s*=\s*["']toolbar["']/i.test(attrs) && /\baria-label\s*=\s*(?:"[^"]*\bdemo\b[^"]*"|'[^']*\bdemo\b[^']*')/i.test(attrs));
const px = (tok) => {
  const m = /^(-?\d*\.?\d+)(px|rem|em)?$/.exec(tok); if (!m) return null;
  const n = parseFloat(m[1]) * (m[2] === 'rem' || m[2] === 'em' ? 16 : 1);
  return Math.round(n * 100) / 100;
};
const splitTop = (v, sep) => { const out = []; let d = 0, cur = ''; for (const c of v) { if (c === '(') d++; if (c === ')') d--; if (c === sep && d === 0) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out.map((s) => s.trim()).filter(Boolean); };
const tokens = (v) => splitTop(v.replace(/\s*\/\s*/g, ' '), ' ');

function resolveVars(v, vars, depth = 0) {
  if (depth > 5 || !/var\(/.test(v)) return v;
  return resolveVars(v.replace(/var\(\s*(--[\w-]+)\s*(?:,([^()]*(?:\([^()]*\)[^()]*)*))?\)/g, (m, name, fb) => (vars[name] != null ? vars[name] : fb != null ? fb.trim() : '')), vars, depth + 1);
}
const stripVar = (v) => { let x = v, prev; do { prev = x; x = x.replace(/var\([^()]*(?:\([^()]*\)[^()]*)*\)/g, ''); } while (x !== prev); return x; };

/* ─── Bóc CSS ──────────────────────────────────────────────────────────────────────────────── */
// Trả [{sel, decls:[{prop, val, off}]}]; off = vị trí tuyệt đối trong file (src đã giữ nguyên độ dài).
function parseCss(css, base) {
  const rules = []; const stack = []; let start = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') { if (stack.length) stack[stack.length - 1].child = true; stack.push({ pre: css.slice(start, i).trim(), body: i + 1, child: false }); start = i + 1; }
    else if (c === '}') {
      const top = stack.pop(); start = i + 1; if (!top || top.child) continue;
      if (/^@font-face/i.test(top.pre)) continue;
      rules.push({ sel: top.pre, decls: parseDecls(css.slice(top.body, i), base + top.body) });
    }
  }
  return rules;
}
function parseDecls(body, base) {
  const out = []; const re = /[^;]+/g; let m;
  while ((m = re.exec(body))) {
    const seg = m[0]; const k = seg.indexOf(':'); if (k < 0) continue;
    const prop = seg.slice(0, k).trim().toLowerCase(); if (!/^-{0,2}[a-z][\w-]*$/.test(prop)) continue;
    const lead = seg.length - seg.trimStart().length;
    out.push({ prop, val: seg.slice(k + 1).replace(/!important/i, '').trim(), off: base + m.index + lead });
  }
  return out;
}

/* ─── Quét một file ────────────────────────────────────────────────────────────────────────── */
const SPACING_PROP = /^(padding|margin)(-(top|right|bottom|left|inline|block)(-(start|end))?)?$|^(gap|row-gap|column-gap|grid-gap)$/;
const MONO = /mono|menlo|consolas|courier/i;
// --count: khoá → giá trị → file → số lần dùng (mỗi khai báo/token chạm giá trị tính một lần)
const ĐẾM = { radius: new Map(), shadow: new Map(), 'font-family': new Map(), 'font-size': new Map(), spacing: new Map() };
const tally = (k, v, file) => { const m = ĐẾM[k]; if (!m.has(v)) m.set(v, new Map()); const f = m.get(v); f.set(file, (f.get(file) || 0) + 1); };
function scanFile(file, items) {
  const raw = fs.readFileSync(file, 'utf8');
  const rel = path.relative(BASE, file) || path.basename(file);
  const rawLines = raw.split('\n');
  const lineStarts = [0]; for (let i = 0; i < raw.length; i++) if (raw[i] === '\n') lineStarts.push(i + 1);
  const lineOf = (idx) => { let lo = 0, hi = lineStarts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= idx) lo = mid; else hi = mid - 1; } return lo + 1; };
  const add = (rule, lv, off, msg, fix, where) => items.push({ rule, lv, file: rel, line: lineOf(off), where, msg, fix });

  const blank = (s) => s.replace(/[^\n]/g, ' ');
  let src = raw.replace(/<!--[\s\S]*?-->/g, blank);
  const cssRules = [];
  src = src.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, o, css, c, off) => {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, blank);
    for (const r of parseCss(clean, off + o.length)) cssRules.push({ ...r, shell: isShellSel(r.sel) });
    return o + blank(css) + c;
  });
  src = src.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, o, js, c) => o + blank(js) + c);

  // Duyệt thẻ: text node (emoji) + style="" (khai báo), bỏ phần trong khung shell.
  const stack = []; let shellSkipped = 0; let last = 0;
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g; let m;
  const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
  const inShell = () => !INCLUDE_SHELL && stack.some((e) => e.shell);
  const textNode = (a, b) => {
    if (inShell()) return;
    const t = src.slice(a, b);
    const em = /(?:\p{Extended_Pictographic}️|\p{Emoji_Presentation}|[\u{1F000}-\u{1FFFF}])/gu; let e;
    while ((e = em.exec(t))) { if (!/\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(e[0])) continue; add('DS-EMOJI', '❌', a + e.index, 'emoji trong chữ hiển thị', 'thay bằng inline SVG (`aria-hidden="true"`, `currentColor`) — icon không dùng emoji', e[0]); }
  };
  while ((m = re.exec(src))) {
    textNode(last, m.index); last = m.index + m[0].length;
    const [whole, close, tagRaw, attrStr] = m; const tag = tagRaw.toLowerCase();
    if (close) { let k = stack.length - 1; while (k >= 0 && stack[k].tag !== tag) k--; if (k >= 0) stack.length = k; continue; }
    const el = { tag, shell: isShellEl(attrStr) || isDemoBtn(attrStr) || isDemoBox(attrStr) };
    const skipped = inShell() || (el.shell && !INCLUDE_SHELL);
    if (skipped && el.shell) shellSkipped++;
    const st = /\bstyle\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrStr);
    if (st && !skipped) {
      const v = st[2] != null ? st[2] : st[3];
      const off = m.index + 1 + tagRaw.length + close.length + st.index + st[0].indexOf(st[1]) + 1;
      cssRules.push({ sel: '[style]', decls: parseDecls(v, off), shell: false });
    }
    if (!VOID.test(tag) && !/\/\s*$/.test(attrStr)) stack.push(el);
  }
  textNode(last, src.length);
  const shellRules = cssRules.filter((r) => r.shell).length;

  // Custom property (toàn file, kể cả khung) để giải var().
  const vars = {};
  for (const r of cssRules) for (const d of r.decls) if (d.prop.startsWith('--')) vars[d.prop] = d.val;

  const B = DS.budget; const scale = new Set(B.spacing);
  const seen = { radius: new Map(), shadow: new Map(), 'font-family': new Map(), 'font-size': new Map() };
  const note = (k, v, off) => { if (!seen[k].has(v)) seen[k].set(v, off); tally(k, v, rel); };
  const famOf = (v) => { const f = splitTop(v, ',')[0]; return f ? f.replace(/["']/g, '').trim().toLowerCase() : ''; };
  const sizeVal = (t) => { if (/^(inherit|initial|unset|revert|100%|1em)$/i.test(t)) return null; const n = px(t); return n != null ? `${n}px` : t.toLowerCase(); };

  for (const r of cssRules) {
    if (r.shell && !INCLUDE_SHELL) continue;
    for (const d of r.decls) {
      const { prop, off } = d; const rawVal = d.val; const val = resolveVars(rawVal, vars).trim();
      // DS-HEX — fallback trong var() được phép (canon shell.md)
      if (DS.hex) for (const h of stripVar(rawVal).match(HEX_RE) || []) {
        const x = expandHex(h);
        if (!DS.hex.has(x) && !(x.length === 9 && DS.hex.has(x.slice(0, 7)))) add('DS-HEX', '❌', off, 'màu hex không có trong 07-design-system.md', 'dùng token của 07 §2 (`var(--…)`); màu mới thật thì thêm vào 07 trước', h.toLowerCase());
      }
      if (prop.startsWith('--')) continue;
      if (/gradient\(/i.test(val)) add('DS-GRADIENT', '⚠️', off, 'có gradient', 'nền phẳng theo token; giữ thì ghi lý do lúc giao');
      if (/^(-webkit-)?backdrop-filter$/.test(prop) && !/^none$/i.test(val)) add('DS-BLUR', '⚠️', off, 'có backdrop-filter (kính mờ)', 'lớp nổi dùng nền đặc + shadow trong §4b');
      if ((/^(-webkit-)?background-clip$/.test(prop) && /\btext\b/i.test(val)) || (prop === '-webkit-text-fill-color' && /transparent/i.test(val))) add('DS-TEXTCLIP', '⚠️', off, 'chữ trong suốt cắt nền', 'chữ màu đặc theo token text/*');
      if (/^(border(-(top|bottom)-(left|right))?-radius)$/.test(prop)) {
        for (const t of tokens(val)) { const n = px(t); let k = null; if (/^(50|100)%$/.test(t) || (n != null && n >= 999)) k = 'pill'; else if (n != null) { if (n !== 0) k = `${n}px`; } else if (t) k = t.toLowerCase(); if (k) note('radius', k, off); }
      }
      if (prop === 'box-shadow') {
        const layers = splitTop(val, ',').filter((l) => !/^none$/i.test(l) && !/\binset\b/i.test(l) && !/^0(px)?\s+0(px)?\s+0(px)?\s+[\d.]+(px|rem)?\b/i.test(l)); // inset = viền nhấn, không phải lớp nổi (dự án desktop S34)
        if (layers.length) note('shadow', layers.join(', ').replace(/\s+/g, ' ').toLowerCase(), off);
      }
      if (prop === 'font-family' && !/^(inherit|initial|unset|revert)$/i.test(val)) note('font-family', famOf(val), off);
      if (prop === 'font-size') { const s = sizeVal(val); if (s) note('font-size', s, off); }
      if (prop === 'font' && !/^(inherit|initial|unset|revert)$/i.test(val)) {
        const fm = /(?:^|\s)(\d*\.?\d+(?:px|rem|em)|\d+%)(?:\s*\/\s*\S+)?\s+(.+)$/.exec(val);
        if (fm) { const s = sizeVal(fm[1]); if (s) note('font-size', s, off); if (!/^(inherit|initial|unset|revert)$/i.test(fm[2].trim())) note('font-family', famOf(fm[2]), off); } // `font:600 11px/1 inherit` (dự án desktop)
      }
      if (SPACING_PROP.test(prop)) {
        const bad = [];
        for (const t of tokens(val)) { if (!/^-?\d*\.?\d+(px|rem)?$/.test(t)) continue; const n = px(t); if (n == null) continue; const a = Math.abs(n); if (a <= 2) continue; tally('spacing', `${a}px`, rel); if (!scale.has(a)) bad.push(`${a}px`); }
        for (const b of bad) add('DS-SPACING', '⚠️', off, `padding/margin/gap ngoài thang spacing (${DS.src})`, `lấy từ thang ${B.spacing.join(' ')}`, b);
        if (/^margin/.test(prop) && tokens(val).some((t) => /^-\d*\.?\d+/.test(t) && px(t) !== 0) && !/\/\*/.test(rawLines[lineOf(off) - 1] || '')) add('DS-NEGMARGIN', '⚠️', off, 'margin âm không có comment lý do cùng dòng', 'bỏ margin âm, hoặc ghi `/* lý do */` cùng dòng');
      }
    }
  }

  // Ngân sách: mỗi giá trị vượt → một mục (cùng mô tả → gộp một P, `at` = dòng xuất hiện đầu của từng giá trị).
  const TÊN = { radius: 'bo góc', shadow: 'đổ bóng', 'font-family': 'họ font', 'font-size': 'cỡ chữ' };
  for (const k of Object.keys(seen)) {
    const vals = [...seen[k].entries()];
    let n = vals.length;
    if (k === 'font-family') { const mono = vals.filter(([v]) => MONO.test(v)).length; n = vals.length - mono + Math.max(0, mono - 1); }
    const cap = B[k];
    if (cap == null || n <= cap) continue;
    for (const [v, off] of vals) add(`DS-BUDGET-${k}`, '❌', off, `${TÊN[k]}: ${n} giá trị khác nhau, trần ${cap} (${DS.src})`, `gom về ≤ ${cap} giá trị theo ${DS.src}; vượt thật thì nêu lý do lúc giao`, v.length > 40 ? v.slice(0, 39) + '…' : v);
  }
  return { file: rel, shellSkipped: shellSkipped + shellRules };
}

/* ─── Chạy ─────────────────────────────────────────────────────────────────────────────────── */
const items = [];
const per = files.map((f) => scanFile(f, items));
const shellSkipped = per.reduce((s, r) => s + r.shellSkipped, 0);
if (COUNT_MODE) {
  const counts = {};
  for (const [k, m] of Object.entries(ĐẾM)) {
    const perFile = new Map(); const khácNhau = new Map(); const values = [];
    for (const [v, fs_] of m) { let n = 0; for (const [f, c] of fs_) { n += c; perFile.set(f, (perFile.get(f) || 0) + c); khácNhau.set(f, (khácNhau.get(f) || 0) + 1); } values.push([v, n]); }
    values.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const top = [...perFile].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    counts[k] = { values: Object.fromEntries(values), files: perFile.size, topFile: top ? { file: top[0], uses: top[1] } : null, maxPerFile: Math.max(0, ...khácNhau.values()) };
  }
  if (JSON_MODE) console.log(JSON.stringify({ target: T, docs, design07: DS.file, budgetSource: DS.src, budget: DS.budget, counts, files: per.map((r) => r.file) }, null, 2));
  else {
    console.log(`check-design --count ${path.relative(process.cwd(), T) || '.'}: ${files.length} file html-design · trần hiện tại theo ${DS.src}${DS.file ? '' : ' (không có 07)'}`);
    for (const [k, c] of Object.entries(counts)) {
      const vs = Object.entries(c.values);
      const cap = k === 'spacing' ? `thang ${DS.budget.spacing.join(' ')}` : `trần ${DS.budget[k]}`;
      console.log(`\n  ${k}: ${vs.length} giá trị khác nhau (${cap}) · tối đa ${c.maxPerFile}/file · ${c.files} file${c.topFile ? ` · dùng nhiều nhất: ${c.topFile.file} (${c.topFile.uses})` : ''}`);
      if (vs.length) console.log('    ' + vs.map(([v, n]) => `${v.length > 40 ? v.slice(0, 39) + '…' : v} ×${n}`).join(' · '));
    }
    if (!INCLUDE_SHELL && shellSkipped) console.log(`\n  (bỏ qua khung shell/demo: ${shellSkipped} phần tử/rule — --include-shell để đếm cả)`);
  }
  process.exit(0);
}
RC.ghi('check-design', items.map((i) => i.rule));
const groups = plist.group(items, { step: 0 });
const errorGroups = groups.filter((g) => g.lv === '❌').length;
const errors = items.filter((i) => i.lv === '❌').length, warns = items.length - errors;

const checked = [
  `${files.length} file html-design`,
  `emoji trong chữ hiển thị`,
  `ngân sách radius ${DS.budget.radius} · shadow ${DS.budget.shadow} · font-family ${DS.budget['font-family']} · font-size ${DS.budget['font-size']} theo ${DS.src}`,
  `spacing theo thang ${DS.budget.spacing.join(' ')}`,
  'gradient · backdrop-filter · chữ cắt nền · margin âm',
];
if (DS.hex) checked.push(`màu hex so ${DS.hex.size} hex khai trong 07`);
const unchecked = [['bố cục/thứ tự hiển thị', 'máy chỉ đếm CSS tĩnh — chạy shot.js để đo'], ['accent/nesting', 'cần nhìn bố cục, máy không đếm']];
if (!DS.file) unchecked.push(['màu ngoài token', 'không có 07-design-system.md']);
else if (!DS.has4b) unchecked.push(['trần của dự án', '07 không có §4b — dùng trần mặc định']);
if (!INCLUDE_SHELL && shellSkipped) unchecked.push([`khung shell (${shellSkipped} phần tử/rule)`, 'check-shell.js soát — --include-shell để đếm cả']);

if (JSON_MODE) {
  console.log(JSON.stringify({ target: T, docs, design07: DS.file, budgetSource: DS.src, budget: DS.budget, files: per.map((r) => r.file), errors, warns, errorGroups, groups, unchecked: unchecked.map(([what, why]) => ({ what, why })) }, null, 2));
} else {
  if (!files.length) console.log(`Không thấy html-design.html nào trong ${T}.`);
  else console.log(`check-design ${path.relative(process.cwd(), T) || '.'}: ${files.length} file · nguồn trần: ${DS.src}${DS.file ? '' : ' (không có 07)'}`);
  console.log(plist.render(items, { step: 0, checked, unchecked, oan: 'ba-html-design/check-design' }));
}
process.exit(Math.min(errorGroups, 255));
