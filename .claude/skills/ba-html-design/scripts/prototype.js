#!/usr/bin/env node
/*
 * ba-html-design/prototype.js — gom mọi html-design.html của dự án thành MỘT prototype bấm được
 * (`docs/Ho-so/prototype-hifi.html`, tự chứa, mở thẳng bằng file://) để trình chiếu cho khách.
 *
 * Vì sao (docs/decisions/36): html-design dựng một màn một file, không bấm qua lại được; gallery canvas để DUYỆT,
 * không để TRÌNH CHIẾU. Khách cần đi một luồng thật (Trang chủ → Chi tiết → Giỏ → Đặt hàng) trên bản high-fi.
 * Lần đầu (dự án bán hàng thật, 13/10/2026) bảng điều hướng viết cứng trong một script Python riêng của dự án — nay
 * máy tự lập từ tài liệu đã có, người chỉ bổ sung chỗ srs không nói.
 *
 * Nguồn điều hướng (theo thứ tự, cái sau đè cái trước):
 *   1. Cột "Mô tả"/"Tên phần tử" của bảng phần tử srs: "mở S06", "(→ S08)", "sang S09", "bấm để tới S11", "quay về S04"
 *      → khối data-el đó dẫn sang màn đó ("tới"/"về"/"đến" chỉ tính khi có động từ thao tác đứng trước — "thông tin về
 *      S05", "gửi tới S03" là câu tả, không phải chuyển màn); tên mở đầu "quay lại"/"quay lui"/"trở về" → back.
 *   2. Thanh menu chính `.app-nav__link` (shell.md): nhãn → màn mà ở đó nhãn mang aria-current="page" và menu không ẩn
 *      (màn cấp 2 ẩn menu nhưng vẫn đánh dấu tab cha — không dùng để đoán).
 *   3. `Ho-so/prototype-nav.json` (tuỳ chọn) — {"S04": {"23": "S06", "5": "back", "7": "state:sheet", "9": null}};
 *      null = gỡ liên kết máy tự lập; khoá bắt đầu bằng "_": "_start": "S04", "_tabs": {"Nhãn": "S04"},
 *      "_mobile": ["S04", ...], "_desk": ["S26", ...].
 * Khung điện thoại 390 hay khung web 1280: theo `data-width` của section trong `Ho-so/wireframe.html`; không có
 * wireframe → theo "_mobile"/"_desk"; không có gì → web.
 *
 * Kiểm (đếm, không phán): mọi data-el trong bảng điều hướng phải có trong html màn đó; đích phải là mã màn, "back"
 * hoặc "state:<tên>". Sai → in từng chỗ, exit 1, KHÔNG ghi file. Đích là màn chưa có html-design → hợp lệ, khi bấm
 * hiện thông báo "chưa có trong bản demo" (đếm và in ra).
 *
 * Dùng:  node .claude/skills/ba-html-design/scripts/prototype.js [docsDir=docs] [--out <file>] [--start S04] [--check] [--plain]
 * Exit: 0 xong · 1 bảng điều hướng sai (không ghi) · 2 không có docs/html-design hoặc file cấu hình hỏng.
 *
 * gioiHan: đọc srs bằng regex (mã màn đầu tiên trong mô tả là đích — mô tả nhắc hai màn thì cần prototype-nav.json);
 * trạng thái trong màn ("state:") chỉ chạy khi html-design có hàm setState của statebar; không mô phỏng dữ liệu
 * (giỏ, đơn…) đi theo luồng — mỗi màn hiện dữ liệu mẫu của chính nó; nhãn menu trùng tên ở hai vùng chỉ nhận vùng đầu.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: không cụt khi process.exit qua pipe (lint 43)
const fs = require('fs');
const path = require('path');
const docpath = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));
const SE = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'srs-elements.js'));

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const flag = (k) => argv.includes(k);
const pos = argv.filter((a, i) => !a.startsWith('--') && !['--out', '--start'].includes(argv[i - 1]));
const DOCS = path.resolve(pos[0] || 'docs');
const rel = (p) => { const r = path.relative(process.cwd(), p); return !r || r.startsWith('..') ? p : r; };

if (!fs.existsSync(DOCS)) { console.error(`Không thấy thư mục ${rel(DOCS)}.`); process.exit(2); }

/* ───────── màn có html-design ───────── */
function walk(dir, acc = []) {
  let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!/^(removed|node_modules|\.git|vendor)$/.test(e.name) && !(dir === DOCS && e.name === docpath.HOSO)) walk(p, acc); }
    else if (e.name === 'html-design.html') acc.push(p);
  }
  return acc;
}
function tênViệt(dir) { // cùng cách lấy với canvas.js / figma-sync.js
  try {
    const h = (fs.readFileSync(path.join(dir, 'srs.md'), 'utf8').match(/^#\s+(.+)$/m) || [])[1] || '';
    const t = (h.split(/\s+[—–-]\s+/).slice(1).join(' — ') || '').replace(/\s*\(Mã màn:[^)]*\)\s*$/i, '').replace(/\s*\([A-Za-z][^)]*\)\s*$/, '').trim();
    return t || null;
  } catch { return null; }
}
const files = walk(DOCS);
if (!files.length) { console.error(`prototype: không thấy html-design.html nào trong ${rel(DOCS)} — dựng bằng /ba-html-design <màn> trước.`); process.exit(2); }
const SCR = {};
for (const f of files) {
  const dir = path.dirname(f), m = path.basename(dir).match(/^(S\d+)\s*-\s*(.+)$/);
  if (!m || SCR[m[1]]) continue;
  SCR[m[1]] = { code: m[1], dir, name: tênViệt(dir) || m[2].trim(), html: fs.readFileSync(f, 'utf8') };
}
const codes = Object.keys(SCR).sort((a, b) => +a.slice(1) - +b.slice(1));

/* tên mọi màn trong 03-overview (để báo "chưa có trong bản demo" kèm tên) */
const ALL = {};
const ov = docpath.readDoc(DOCS, '03-overview.md');
if (ov) for (const r of ov.matchAll(/^\|\s*(S\d+)\s*\|\s*([^|]+?)\s*\|/gm)) if (!ALL[r[1]]) ALL[r[1]] = r[2].trim();
for (const c of codes) ALL[c] = SCR[c].name;

/* ───────── cấu hình người bổ sung ───────── */
let CFG = {};
const navFile = docpath.resolveDoc(DOCS, 'prototype-nav.json');
if (navFile) {
  try { CFG = JSON.parse(fs.readFileSync(navFile, 'utf8')); }
  catch (e) { console.error(`prototype: ${rel(navFile)} không đọc được (${e.message}) — sửa JSON rồi chạy lại.`); process.exit(2); }
}

/* ───────── vùng: điện thoại hay web ───────── */
const zone = {};
const wf = docpath.resolveDoc(DOCS, 'wireframe.html');
if (wf) for (const s of fs.readFileSync(wf, 'utf8').matchAll(/<section\b[^>]*>/g)) {
  const c = (s[0].match(/data-screen="(S\d+)"/) || [])[1], w = (s[0].match(/data-width="(\d+)"/) || [])[1];
  if (c && w) zone[c] = +w <= 600 ? 'phone' : 'desk';
}
for (const c of CFG._mobile || []) zone[c] = 'phone';
for (const c of CFG._desk || []) zone[c] = 'desk';
for (const c of codes) if (!zone[c]) zone[c] = 'desk';

/* ───────── bảng điều hướng ───────── */
// Dạng câu dẫn màn trong cột Mô tả (dự án bán hàng thật 13/10/2026): "mở S15" · "chuyển tab Sản phẩm (S05)" · "chạm → tab Thành viên S13" ·
// "\u203a" (→ S05)". Mũi tên trần KHÔNG tính: "trống → S21 ẩn dòng giờ" là hệ quả, không phải chuyển màn.
// "tới/về/đến" trần hay đứng trong câu tả ("thông tin về S05", "gửi tới S03") → chỉ nhận khi có động từ thao tác trước nó.
const LINK = new RegExp([
  '(?<![\\p{L}])(?:mở|sang|chuyển|điều hướng)\\s+[^.;|()]{0,30}?\\(?\\s*(S\\d{2,3})\\b',   // động từ … (Sxx)
  '(?<![\\p{L}])(?:bấm|chạm|nhấn|chọn|click|đi|quay|trở|dẫn)(?![\\p{L}])[^.;|]{0,16}?(?<![\\p{L}])(?:tới|về|đến)\\s+[^.;|()]{0,30}?\\(?\\s*(S\\d{2,3})\\b', // thao tác … tới/về Sxx
  '(?:chạm|bấm|nhấn|chọn|click)[^.;|]{0,24}?→\\s*[^.;|()]{0,24}?(S\\d{2,3})\\b',      // thao tác → … Sxx
  '\\(\\s*→\\s*(S\\d{2,3})\\s*\\)',                                               // (→ Sxx)
].join('|'), 'iu');
const BACK = /^(?:nút\s*)?(?:quay\s*l(?:ại|ui)|lui|trở\s*về)(?![\p{L}\p{N}])/iu; // tên phần tử MỞ ĐẦU bằng quay lại/lui/trở về — KHÔNG dùng \b: \b của JS chỉ hiểu ASCII, "về" tận cùng "ề" nên \b không bao giờ khớp
const BACK_MÔ_TẢ = /(?:quay|trở)\s*về\s*màn\s*trước/i;                         // nút đóng màn: "quay về màn trước"
const TRONG_HỘP = /hộp|ngăn kéo|dialog|modal|bảng trượt|sheet/i;                  // quay lại TRONG hộp = đóng hộp, không phải về màn trước
const NAV = {}, nguồn = {};
for (const c of codes) {
  NAV[c] = {}; nguồn[c] = {};
  let rows = null; try { rows = SE.parseFull(fs.readFileSync(path.join(SCR[c].dir, 'srs.md'), 'utf8')); } catch { rows = null; }
  const có = new Set([...SCR[c].html.matchAll(/data-el="(\d+)"/g)].map((m) => m[1]));
  for (const r of rows || []) {
    const n = String(r.n); if (!có.has(n) || /đã bỏ/i.test(r.ten + ' ' + (r.moTa || ''))) continue;
    const text = `${r.ten} ${r.moTa || ''}`;
    const m = text.match(LINK), đích = m && m.slice(1).find(Boolean);
    if ((BACK.test(r.ten) || BACK_MÔ_TẢ.test(r.moTa || '')) && !TRONG_HỘP.test(text)) { NAV[c][n] = 'back'; nguồn[c][n] = 'srs'; }
    else if (đích && đích !== c) { NAV[c][n] = đích; nguồn[c][n] = 'srs'; }
  }
}
const lỗi = [];
for (const [c, m] of Object.entries(CFG)) {
  if (c.startsWith('_')) continue;
  if (!SCR[c]) { lỗi.push(`prototype-nav.json: màn ${c} không có html-design.html`); continue; }
  for (const [n, t] of Object.entries(m || {})) {
    if (t === null) { delete NAV[c][n]; delete nguồn[c][n]; continue; }
    NAV[c][n] = t; nguồn[c][n] = 'json';
  }
}
for (const c of codes) {
  const có = new Set([...SCR[c].html.matchAll(/data-el="(\d+)"/g)].map((m) => m[1]));
  for (const [n, t] of Object.entries(NAV[c])) {
    if (!có.has(n)) lỗi.push(`${c} #${n} (${nguồn[c][n] === 'json' ? 'prototype-nav.json' : 'srs'}): html-design.html không có khối data-el="${n}"`);
    if (!(t === 'back' || /^state:[\w-]+$/.test(t) || /^S\d{2,3}$/.test(t))) lỗi.push(`${c} #${n}: đích "${t}" không hợp lệ (mã màn S.., "back" hoặc "state:<tên>")`);
  }
}

/* thanh menu chính: nhãn → màn */
const TAB = {};
for (const c of codes) {
  const nav = (SCR[c].html.match(/<nav\b[^>]*class="[^"]*\bapp-nav\b[^"]*"[^>]*>[\s\S]*?<\/nav>/) || [])[0];
  if (!nav || /^<nav\b[^>]*\shidden\b/.test(nav)) continue;
  for (const a of nav.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    if (!/aria-current="page"/.test(a[1])) continue;
    const lb = a[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (lb && !TAB[lb]) TAB[lb] = c;
  }
}
// nhãn chưa gán mà trùng đúng tên một màn → màn đó (màn cấp 1 chưa dựng thì nhãn đó báo "chưa có")
for (const c of codes) {
  const nav = (SCR[c].html.match(/<nav\b[^>]*class="[^"]*\bapp-nav\b[^"]*"[^>]*>[\s\S]*?<\/nav>/) || [])[0] || '';
  for (const a of nav.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)) {
    const lb = a[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hit = lb && !TAB[lb] && codes.find((x) => SCR[x].name.toLowerCase() === lb.toLowerCase());
    if (hit) TAB[lb] = hit;
  }
}
Object.assign(TAB, CFG._tabs || {});
for (const [lb, c] of Object.entries(CFG._tabs || {})) if (!SCR[c]) lỗi.push(`prototype-nav.json _tabs "${lb}": màn ${c} không có html-design.html`);

const START = argv.includes('--start') ? opt('--start') : CFG._start || Object.values(TAB)[0] || codes[0];
if (!SCR[START]) lỗi.push(`màn bắt đầu ${START} không có html-design.html`);

/* ───────── báo cáo ───────── */
const PLAIN = flag('--plain');
const chưaCó = new Set();
for (const c of codes) for (const t of Object.values(NAV[c])) if (/^S\d/.test(t) && !SCR[t]) chưaCó.add(t);
console.log(`\n=== Prototype high-fi (${rel(DOCS)}) ===`);
console.log(`   ${codes.length} màn · bắt đầu ${START} · khung: ${codes.filter((c) => zone[c] === 'phone').length} điện thoại, ${codes.filter((c) => zone[c] === 'desk').length} web`);
for (const c of codes) {
  const v = Object.values(nguồn[c]);
  console.log(`   ${c} ${PLAIN ? '' : '· ' + SCR[c].name + ' '}— ${v.length} liên kết (${v.filter((x) => x === 'srs').length} từ srs, ${v.filter((x) => x === 'json').length} từ prototype-nav.json)`);
}
console.log(`   Menu chính: ${Object.keys(TAB).length ? Object.entries(TAB).map(([l, c]) => `${l} → ${c}`).join(' · ') : 'không thấy (.app-nav__link có aria-current)'}`);
if (chưaCó.size) console.log(`   Đích chưa có html-design (bấm sẽ báo "chưa có trong bản demo"): ${[...chưaCó].sort().join(', ')}`);
if (lỗi.length) {
  for (const l of lỗi) console.log(`  ❌ ${l}`);
  console.log(`\n=== ${lỗi.length} lỗi — chưa ghi file. Sửa: thêm/xoá dòng trong ${navFile ? rel(navFile) : 'Ho-so/prototype-nav.json'} hoặc bảng phần tử srs ===`);
  process.exit(1);
}
if (flag('--check')) { console.log('\n=== 0 lỗi (chỉ kiểm, không ghi) ==='); process.exit(0); }

/* ───────── dựng ───────── */
const INJECT = `<style id="proto-inject">
.statebar,#statebar,.demo-nav,[data-demo]{display:none!important}
[data-proto-nav]{cursor:pointer}
html.proto-hint [data-proto-nav]{outline:2px solid var(--proto-accent,#4f46e5)!important;outline-offset:2px;animation:protoBlink 1.1s ease-in-out infinite}
@keyframes protoBlink{0%,100%{outline-color:var(--proto-accent,#4f46e5)}50%{outline-color:transparent}}
@media (prefers-reduced-motion:reduce){html.proto-hint [data-proto-nav]{animation:none}}
</style>`;
const accent = (codes.map((c) => (SCR[c].html.match(/--brand-primary\s*:\s*(#[0-9a-fA-F]{3,8})/) || [])[1]).find(Boolean)) || '#4f46e5';
const OUT = flag('--out') ? path.resolve(opt('--out')) : docpath.writePathFor(DOCS, 'prototype-hifi.html');
const SRC = {};
for (const c of codes) {
  const h = SCR[c].html.replace(/<\/head>/i, `${INJECT.split('var(--proto-accent,#4f46e5)').join(accent)}</head>`);
  // tài nguyên tương đối của màn vẫn chạy trong srcdoc: <base> trỏ folder màn (cùng cách canvas.js gallery)
  const href = path.relative(path.dirname(OUT), SCR[c].dir).split(path.sep).map(encodeURIComponent).join('/') + '/';
  SRC[c] = /<base\b/i.test(h) ? h : h.replace(/<head([^>]*)>/i, `<head$1><base href="${href}">`);
}
let fontCss = '';
const fa = docpath.resolveDoc(DOCS, 'figma-assets');
if (fa && fs.existsSync(path.join(fa, 'fonts', 'fonts-embed.css'))) fontCss = fs.readFileSync(path.join(fa, 'fonts', 'fonts-embed.css'), 'utf8');
const bodyFont = (fontCss.match(/font-family:'([^']+)'/) || [])[1];
let dựÁn = '';
const req = docpath.readDoc(DOCS, '01-requirements.md');
if (req) dựÁn = ((req.match(/^#\s+(.+)$/m) || [])[1] || '').split(/\s+[—–-]\s+/).slice(1).join(' — ').trim();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nhúng = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const META = { start: START, screens: Object.fromEntries(codes.map((c) => [c, [SCR[c].name, zone[c]]])), all: ALL, nav: NAV, tab: TAB };
const nút = (z) => codes.filter((c) => zone[c] === z).map((c) => `<button type="button" data-go="${c}">${c} · ${esc(SCR[c].name)}</button>`).join('');
const html = fs.readFileSync(path.join(__dirname, '..', 'assets', 'hifi-proto', 'prototype-shell.html'), 'utf8')
  .replace('/*FONT*/', fontCss.replace(/\s+$/, ''))
  .replace('/*BODYFONT*/', bodyFont ? `"${bodyFont}",` : '')
  .replace(/\/\*ACCENT\*\//g, accent)
  .replace('<!--TITLE-->', esc(dựÁn ? `Prototype — ${dựÁn}` : 'Prototype'))
  .replace('<!--PHONE-->', codes.some((c) => zone[c] === 'phone') ? `<div class="pmenu__group">Điện thoại</div>${nút('phone')}` : '')
  .replace('<!--DESK-->', codes.some((c) => zone[c] === 'desk') ? `<div class="pmenu__group">Web</div>${nút('desk')}` : '')
  .replace('/*META*/', () => nhúng(META))
  .replace('/*SRC*/', () => nhúng(SRC));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`\n   → ${rel(OUT)} (${(fs.statSync(OUT).size / 1048576).toFixed(2)} MB) · ${Object.values(NAV).reduce((s, m) => s + Object.keys(m).length, 0)} liên kết + menu chính`);
console.log(`   Mở thẳng một màn: ${path.basename(OUT)}#${START}`);
console.log('=== 0 lỗi ===');
