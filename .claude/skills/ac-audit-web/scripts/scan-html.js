#!/usr/bin/env node
/*
 * ac-audit-web/scan-html.js — quét TĨNH một file HTML (hoặc mọi *.html dưới một thư mục) theo WCAG 2.1 AA
 * và vài luật UX đếm được, KHÔNG cần trình duyệt. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ac-audit-web/scripts/scan-html.js <file.html | thư mục> [--include-shell] [--plain|--json]
 *
 * Mỗi phát hiện có `file:line` · mã luật · trục (WCAG/UX) · tiêu chí (vd 1.4.3) · mô tả · cách sửa. Hai mức:
 *   ❌ lỗi   — máy chắc (thiếu alt, input không nhãn, button rỗng, tabindex>0, thiếu lang, id trùng, tắt zoom,
 *              outline:none không có focus thay thế, tương phản tính được mà dưới ngưỡng)   → tính vào exit code
 *   ⚠️ cảnh — máy chỉ nghi (heading nhảy bậc, link "bấm vào đây", div/span có onclick, transition:all,
 *              có animation mà không có prefers-reduced-motion, img không kích thước)         → agent ac-auditor phán
 * Exit = số ❌. Script ĐẾM, không phán "đạt WCAG" — chỉ trình duyệt + người mới phán được thứ tự tab thật,
 * focus thật, nền thật sau cascade.
 *
 * KHUNG DÙNG CHUNG (shell) của toolkit — `<header class="app-header">`, `<nav class="app-nav">`,
 * `<div class="statebar">` (canon: ba-html-design/references/shell.md) — được BỎ QUA mặc định: khung đã có
 * `check-shell.js` soát và giống nhau ở mọi màn, báo lại ở từng màn là 6 lần cùng một dòng. `--include-shell`
 * để soát cả khung (khi sửa chính shell.md).
 *
 * Vì sao có: `ba-html-design` sinh HTML cho người xem tài liệu, còn `dev-run` copy bố cục ấy vào code thật —
 * lỗi alt/label/contrast ở html-design đi thẳng vào sản phẩm. Lighthouse cần Chrome + URL; file tĩnh mở bằng
 * file:// thì không có. Quét tĩnh bắt được ~60% lỗi a11y Lighthouse hay báo (axe: alt · label · button-name ·
 * heading-order · tabindex · html-lang · duplicate-id · meta-viewport · color-contrast) mà không cần gì cài.
 *
 * gioiHan:
 *   - Tương phản chỉ tính khi `color` và `background(-color)` nằm CÙNG một khối khai báo (cùng rule CSS hoặc cùng
 *     `style=""`), cả hai là hex/rgb/tên màu cơ bản, không alpha < 1, không `var()`/gradient. Nền thừa kế từ cha
 *     thì KHÔNG tính (không biết nền thật) → phần đó thuộc về ac-auditor mở file bằng mắt.
 *   - Cỡ chữ lấy từ chính rule (px/rem/em, base 16px); rule không khai cỡ → coi là chữ thường (ngưỡng 4.5:1).
 *   - Không chạy JS: phần tử do script sinh ra, trạng thái do `data-state` bật, thứ tự tab thật — không thấy.
 *   - Rule có `:disabled`/`[disabled]`/`.disabled`/`:placeholder` bỏ qua tương phản (WCAG miễn thành phần bất
 *     hoạt; placeholder do agent soát vì nền thật thường là input).
 *   - `<div onclick>` có class `backdrop`/`overlay`/`scrim` KHÔNG báo: bấm-ra-ngoài-để-đóng là đường phụ, hộp thoại đã có
 *     nút đóng riêng (6 màn mẫu đều dùng mẫu này — báo là kêu oan 8 lần).
 *   - Heading nhảy bậc chỉ là ⚠️: html-design có nhiều khối trạng thái ẩn, mỗi khối tự có heading riêng —
 *     nhảy bậc giữa các khối là bố cục, không hẳn là lỗi.
 *   - Parser HTML tự viết: chịu được HTML thiếu đóng thẻ thông thường (p/li/td/tr…) nhưng không phải trình duyệt.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const JSON_MODE = argv.includes('--json');
const INCLUDE_SHELL = argv.includes('--include-shell');
const target = argv.find((a) => !a.startsWith('--'));
if (!target || !fs.existsSync(target)) {
  console.error('Dùng: scan-html.js <file.html | thư mục> [--include-shell] [--plain|--json]');
  process.exit(2);
}

/* ─── Bảng luật ────────────────────────────────────────────────────────────────────────────── */
const RULES = {
  'IMG-ALT': { axis: 'WCAG', crit: '1.1.1', level: 'error', fix: 'thêm `alt="mô tả"`; ảnh trang trí → `alt=""`' },
  'FORM-LABEL': { axis: 'WCAG', crit: '3.3.2', level: 'error', fix: '`<label for="id">` hoặc bọc trong `<label>`, hoặc `aria-label`/`aria-labelledby`' },
  'BTN-NAME': { axis: 'WCAG', crit: '4.1.2', level: 'error', fix: 'thêm chữ trong nút, hoặc `aria-label="…"` cho nút chỉ có icon' },
  'LINK-NAME': { axis: 'WCAG', crit: '2.4.4', level: 'error', fix: 'link phải có chữ hoặc `aria-label`' },
  'LINK-TEXT': { axis: 'WCAG', crit: '2.4.4', level: 'warn', fix: 'chữ link nói đích đến ("Xem hướng dẫn cài đặt" thay vì "bấm vào đây") hoặc thêm `aria-label`' },
  'HEAD-ORDER': { axis: 'WCAG', crit: '1.3.1', level: 'warn', fix: 'không nhảy bậc (h1→h3): dùng đúng cấp hoặc chỉ đổi cỡ bằng CSS' },
  'TABINDEX': { axis: 'WCAG', crit: '2.4.3', level: 'error', fix: 'chỉ dùng `tabindex="0"`/`"-1"`; thứ tự tab đi theo thứ tự DOM' },
  'LANG': { axis: 'WCAG', crit: '3.1.1', level: 'error', fix: '`<html lang="vi">`' },
  'TITLE': { axis: 'WCAG', crit: '2.4.2', level: 'error', fix: '`<title>` mô tả trang' },
  'DIV-CLICK': { axis: 'WCAG', crit: '2.1.1', level: 'warn', fix: 'dùng `<button>`/`<a href>`; nếu buộc giữ thì `role` + `tabindex="0"` + xử lý phím Enter/Space' },
  'DUP-ID': { axis: 'WCAG', crit: '4.1.1', level: 'error', fix: '`id` phải duy nhất — `label for`/`aria-controls` trỏ nhầm khi trùng' },
  'ZOOM': { axis: 'WCAG', crit: '1.4.4', level: 'error', fix: 'bỏ `user-scalable=no`/`maximum-scale=1` khỏi meta viewport' },
  'CONTRAST': { axis: 'WCAG', crit: '1.4.3', level: 'error', fix: 'chữ thường ≥ 4.5:1, chữ lớn (≥24px hoặc ≥18.66px đậm) ≥ 3:1 — đổi màu chữ hoặc nền' },
  'FOCUS-OUTLINE': { axis: 'WCAG', crit: '2.4.7', level: 'error', fix: 'giữ `:focus-visible{outline:…}` hoặc thay bằng `box-shadow`/`border` thấy được' },
  'REDUCED-MOTION': { axis: 'UX', crit: 'Animation · prefers-reduced-motion', level: 'warn', fix: 'thêm `@media (prefers-reduced-motion: reduce){…transition:none}`' },
  'TRANSITION-ALL': { axis: 'UX', crit: 'Animation · transition liệt kê thuộc tính', level: 'warn', fix: 'liệt kê thuộc tính (`transition: transform .2s, opacity .2s`)' },
  'IMG-SIZE': { axis: 'UX', crit: 'Images · width/height chống CLS', level: 'warn', fix: 'thêm `width`/`height` hoặc `aspect-ratio` để giữ chỗ' },
};

/* ─── Tiện ích ─────────────────────────────────────────────────────────────────────────────── */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
// Thẻ trình duyệt tự đóng khi gặp thẻ mở "anh em" — để parser không bị lệch stack với HTML viết tay.
const AUTO_CLOSE = { p: ['p'], li: ['li'], dt: ['dt', 'dd'], dd: ['dt', 'dd'], tr: ['tr'], td: ['td', 'th'], th: ['td', 'th'], option: ['option'] };
const NAMED = { white: '#ffffff', black: '#000000', red: '#ff0000', green: '#008000', blue: '#0000ff', gray: '#808080', grey: '#808080', silver: '#c0c0c0', yellow: '#ffff00', orange: '#ffa500', navy: '#000080', teal: '#008080', purple: '#800080', maroon: '#800000', olive: '#808000', lime: '#00ff00', aqua: '#00ffff', cyan: '#00ffff', fuchsia: '#ff00ff', magenta: '#ff00ff', whitesmoke: '#f5f5f5', lightgray: '#d3d3d3', lightgrey: '#d3d3d3', darkgray: '#a9a9a9', darkgrey: '#a9a9a9', dimgray: '#696969', dimgrey: '#696969' };
const GENERIC_LINK = new Set(['click here', 'here', 'this', 'more', 'learn more', 'read more', 'link', 'go', 'bấm vào đây', 'nhấn vào đây', 'nhấp vào đây', 'tại đây', 'đây', 'xem thêm', 'tìm hiểu thêm', 'chi tiết tại đây']);

const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x?[0-9a-f]+;/gi, 'x');
const textOf = (html) => decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
function parseAttrs(s) {
  const a = {};
  for (const m of s.matchAll(/([^\s=\/"'<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) a[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return a;
}
const classes = (attrs) => (attrs.class || '').split(/\s+/).filter(Boolean);

/** Màu → [r,g,b] hoặc null (không tính được). */
function parseColor(v) {
  if (!v) return null;
  v = v.trim().toLowerCase();
  if (NAMED[v]) v = NAMED[v];
  let m;
  if ((m = v.match(/^#([0-9a-f]{3,4})$/))) { const h = m[1]; if (h.length === 4 && parseInt(h[3], 16) < 15) return null; return [0, 1, 2].map((i) => parseInt(h[i] + h[i], 16)); }
  if ((m = v.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/))) { if (m[2] && parseInt(m[2], 16) < 255) return null; return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)); }
  if ((m = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,\/]+([\d.]+%?))?\s*\)$/))) { if (m[4] && parseFloat(m[4]) < (m[4].endsWith('%') ? 100 : 1)) return null; return [+m[1], +m[2], +m[3]]; }
  return null;
}
function luminance([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) { const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); }
/** Bóc `background`/`background-color` ra màu phẳng; gradient/url/var → null. */
function bgColor(decls) {
  const v = decls['background-color'] || decls.background;
  if (!v || /gradient|url\(|var\(|transparent|inherit|currentcolor/i.test(v)) return null;
  const tok = v.trim().split(/\s+/).find((t) => parseColor(t));
  return tok ? parseColor(tok) : null;
}
function parseDecls(s) {
  const d = {};
  for (const part of s.split(';')) { const i = part.indexOf(':'); if (i < 0) continue; d[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).replace(/!important/i, '').trim(); }
  return d;
}
function fontPx(decls) {
  const v = decls['font-size']; if (!v) return null;
  const m = v.match(/^([\d.]+)(px|rem|em|pt)$/); if (!m) return null;
  const n = parseFloat(m[1]); return m[2] === 'px' ? n : m[2] === 'pt' ? n * 4 / 3 : n * 16;
}
function isLarge(decls) {
  const px = fontPx(decls); if (px === null) return false;
  const w = decls['font-weight'] || ''; const bold = /bold|[7-9]00/.test(w);
  return px >= 24 || (bold && px >= 18.66);
}
/** Kiểm một khối khai báo (rule CSS hay style inline) → {ratio, need} nếu tính được và dưới ngưỡng. */
function checkContrast(decls) {
  const fg = parseColor(decls.color); const bg = bgColor(decls);
  if (!fg || !bg) return null;
  const ratio = Math.round(contrast(fg, bg) * 100) / 100; const need = isLarge(decls) ? 3 : 4.5;
  return ratio < need ? { ratio, need, fg: decls.color, bg: decls['background-color'] || decls.background } : null;
}

/* ─── Quét một file ────────────────────────────────────────────────────────────────────────── */
function scanFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const lineStarts = [0]; for (let i = 0; i < raw.length; i++) if (raw[i] === '\n') lineStarts.push(i + 1);
  const lineOf = (idx) => { let lo = 0, hi = lineStarts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= idx) lo = mid; else hi = mid - 1; } return lo + 1; };
  const findings = []; let shellSkipped = 0;
  const add = (rule, idx, msg, extra) => findings.push({ line: lineOf(idx), rule, axis: RULES[rule].axis, criterion: RULES[rule].crit, level: RULES[rule].level, msg, fix: RULES[rule].fix, ...extra });

  // Bỏ comment và nội dung <script> (giữ nguyên số ký tự để dòng không lệch); CSS gom riêng.
  const blank = (s) => s.replace(/[^\n]/g, ' ');
  let src = raw.replace(/<!--[\s\S]*?-->/g, blank);
  const cssBlocks = [];
  src = src.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, o, css, c, off) => { cssBlocks.push({ css, off: off + o.length }); return o + blank(css) + c; });
  src = src.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, o, js, c) => o + blank(js) + c);

  // Lượt 1: gom label[for] và id
  const labelFor = new Set(); const ids = {};
  for (const m of src.matchAll(/<label\b([^>]*)>/gi)) { const a = parseAttrs(m[1]); if (a.for) labelFor.add(a.for); }
  // Lượt 2: duyệt thẻ với stack
  const stack = []; let lastH = 0; let hasTitle = false, htmlSeen = false;
  const inShell = () => !INCLUDE_SHELL && stack.some((e) => e.shell);
  const isShellEl = (tag, attrs) => { const c = classes(attrs); return c.includes('app-header') || c.includes('app-nav') || c.includes('statebar'); };
  let vừaĐóngLabel = null; // vị trí kết thúc của <label> vừa đóng gần nhất — để chỉ đúng bệnh "label kề cạnh mà không nối"
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g; let m;
  while ((m = re.exec(src))) {
    const [whole, close, tagRaw, attrStr] = m; const tag = tagRaw.toLowerCase(); const idx = m.index;
    if (close) {
      // đóng: pop tới thẻ khớp gần nhất (bỏ qua thẻ chưa đóng ở giữa)
      let k = stack.length - 1; while (k >= 0 && stack[k].tag !== tag) k--;
      if (k < 0) continue;
      const el = stack[k]; stack.length = k;
      el.inner = src.slice(el.end, idx); el.closeAt = idx + whole.length;
      onClose(el);
      continue;
    }
    const attrs = parseAttrs(attrStr); const selfClosed = /\/\s*$/.test(attrStr) || VOID.has(tag);
    if (AUTO_CLOSE[tag]) { const top = stack[stack.length - 1]; if (top && AUTO_CLOSE[tag].includes(top.tag)) { top.inner = src.slice(top.end, idx); stack.pop(); onClose(top); } }
    const el = { tag, attrs, idx, end: idx + whole.length, shell: isShellEl(tag, attrs) };
    el.skipped = inShell() || (el.shell && !INCLUDE_SHELL);
    if (el.skipped) shellSkipped++;
    onOpen(el, el.skipped);
    if (!selfClosed) stack.push(el);
  }
  while (stack.length) { const el = stack.pop(); el.inner = src.slice(el.end); onClose(el); }

  function onOpen(el, skip) {
    const { tag, attrs, idx } = el;
    if (tag === 'html') { htmlSeen = true; if (!attrs.lang) add('LANG', idx, '`<html>` thiếu `lang`'); }
    if (tag === 'meta' && (attrs.name || '').toLowerCase() === 'viewport' && /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0+)?(\s|,|$)/i.test(attrs.content || '')) add('ZOOM', idx, 'meta viewport tắt zoom');
    if (attrs.id !== undefined && attrs.id !== '') { (ids[attrs.id] = ids[attrs.id] || []).push(idx); }
    if (skip) return;
    if (attrs.tabindex !== undefined && parseInt(attrs.tabindex, 10) > 0) add('TABINDEX', idx, `\`tabindex="${attrs.tabindex}"\` > 0 phá thứ tự tab tự nhiên`);
    if (tag === 'img') {
      const decorative = attrs.role === 'presentation' || attrs.role === 'none' || attrs['aria-hidden'] === 'true';
      if (attrs.alt === undefined && !decorative) add('IMG-ALT', idx, `\`<img src="${(attrs.src || '').slice(0, 40)}">\` thiếu \`alt\``);
      if (!attrs.width && !attrs.height && !/aspect-ratio|height/.test(attrs.style || '')) add('IMG-SIZE', idx, '`<img>` không khai width/height');
    }
    if (tag === 'input' && (attrs.type || 'text').toLowerCase() === 'image' && attrs.alt === undefined) add('IMG-ALT', idx, '`<input type="image">` thiếu `alt`');
    if ((tag === 'input' && !/^(hidden|submit|button|reset|image)$/i.test(attrs.type || 'text')) || tag === 'select' || tag === 'textarea') {
      const inLabel = stack.some((e) => e.tag === 'label');
      const named = attrs['aria-label'] || attrs['aria-labelledby'] || attrs.title || (attrs.id && labelFor.has(attrs.id)) || inLabel;
      const kề = vừaĐóngLabel !== null && /^\s*$/.test(src.slice(vừaĐóngLabel, idx));
      if (!named) add('FORM-LABEL', idx, `\`<${tag}${attrs.type ? ` type="${attrs.type}"` : ''}${attrs.name ? ` name="${attrs.name}"` : ''}>\` ${kề ? 'có <label> KỀ CẠNH nhưng không nối (thiếu for=/id hoặc không bọc) — trình đọc màn hình không biết nhãn thuộc ô nào' : 'không có nhãn (label/aria-label)'}`);
      vừaĐóngLabel = null;
    }
    if (/^h[1-6]$/.test(tag)) { const lv = +tag[1]; if (lastH && lv > lastH + 1) add('HEAD-ORDER', idx, `\`<${tag}>\` sau \`<h${lastH}>\` — nhảy bậc`); lastH = lv; }
    if (attrs.onclick !== undefined && /^(div|span|li|td|tr|p|section|article|img|svg|i)$/.test(tag) && !(attrs.role && attrs.tabindex !== undefined) && !/backdrop|overlay|scrim/i.test(attrs.class || '')) add('DIV-CLICK', idx, `\`<${tag} onclick>\` không có ${attrs.role ? '`tabindex`' : '`role`'} — bàn phím không tới được`);
    if (attrs.style) { const c = checkContrast(parseDecls(attrs.style)); if (c) add('CONTRAST', idx, `inline \`${c.fg}\` trên \`${c.bg}\` = ${c.ratio}:1 < ${c.need}:1`, { ratio: c.ratio }); }
  }
  function onClose(el) {
    if (el.tag === "label" && !el.attrs.for && el.closeAt) vừaĐóngLabel = el.closeAt;
    const { tag, attrs, idx, inner } = el;
    if (tag === 'title') { hasTitle = textOf(inner).length > 0; return; }
    if (el.skipped) return;
    const name = () => attrs['aria-label'] || attrs['aria-labelledby'] || attrs.title || textOf(inner) || (inner.match(/<img\b[^>]*\balt\s*=\s*["']([^"']+)/i) || [])[1] || (inner.match(/<svg[\s\S]*?<title>([^<]+)/i) || [])[1] || (inner.match(/aria-label\s*=\s*["']([^"']+)/i) || [])[1] || '';
    if (tag === 'button' && !name()) add('BTN-NAME', idx, '`<button>` không có tên (rỗng/chỉ icon)');
    if (tag === 'a') {
      const n = name();
      if (attrs.href !== undefined && !n) add('LINK-NAME', idx, '`<a href>` không có chữ/aria-label');
      else if (!attrs['aria-label'] && !attrs.title && GENERIC_LINK.has(n.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').trim())) add('LINK-TEXT', idx, `link "${n}" không nói đích đến`);
    }
  }

  // Sau lượt: id trùng, title
  for (const [id, at] of Object.entries(ids)) if (at.length > 1) add('DUP-ID', at[1], `\`id="${id}"\` xuất hiện ${at.length} lần (lần đầu dòng ${lineOf(at[0])})`);
  if (htmlSeen && !hasTitle) add('TITLE', 0, 'không có `<title>`');

  // CSS: tương phản theo rule · outline:none · reduced-motion · transition:all
  const allCss = cssBlocks.map((b) => b.css).join('\n');
  const hasReduced = /prefers-reduced-motion/i.test(allCss);
  const hasFocusVisible = /:focus-visible\s*[^{]*\{[^}]*(outline|box-shadow|border)/i.test(allCss);
  for (const b of cssBlocks) {
    const css = b.css.replace(/\/\*[\s\S]*?\*\//g, blank);
    const rr = /([^{}]+)\{([^{}]*)\}/g; let r;
    while ((r = rr.exec(css))) {
      const sel = r[1].trim(); const at = b.off + r.index + (r[1].length - r[1].trimStart().length); const decls = parseDecls(r[2]);
      if (/^@/.test(sel)) continue;
      if (!/disabled|placeholder/i.test(sel)) { const c = checkContrast(decls); if (c) add('CONTRAST', at, `\`${sel.slice(0, 50)}\` chữ \`${c.fg}\` trên nền \`${c.bg}\` = ${c.ratio}:1 < ${c.need}:1`, { ratio: c.ratio }); }
      if (/outline/.test(r[2]) && /^\s*(none|0)(px)?\s*$/i.test(decls.outline || '') && /:focus(?!-visible)|^\*|^\s*(a|button|input|select|textarea)\s*(,|$)/i.test(sel) && !hasFocusVisible && !decls['box-shadow'] && !decls['border-color'] && !decls.border) add('FOCUS-OUTLINE', at, `\`${sel.slice(0, 50)}\` tắt outline mà file không có \`:focus-visible\` thay thế`);
      if (/^all\b/i.test(decls.transition || '')) add('TRANSITION-ALL', at, `\`${sel.slice(0, 50)}\` dùng \`transition: all\``);
    }
  }
  if (!hasReduced && /\b(animation|transition)\s*:/i.test(allCss)) add('REDUCED-MOTION', cssBlocks[0].off, 'có animation/transition nhưng không có `@media (prefers-reduced-motion: reduce)`');

  findings.sort((a, b) => a.line - b.line);
  return { file, findings, shellSkipped, errors: findings.filter((f) => f.level === 'error').length, warnings: findings.filter((f) => f.level === 'warn').length };
}

/* ─── Gom file ─────────────────────────────────────────────────────────────────────────────── */
function listHtml(p, acc = []) {
  const st = fs.statSync(p);
  if (st.isFile()) { if (/\.html?$/i.test(p)) acc.push(p); return acc; }
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!/^(removed|node_modules|\.git|vendor)$/.test(e.name)) listHtml(path.join(p, e.name), acc); }
    else if (/\.html?$/i.test(e.name) && !/^(portal|sitemap|00-onepager)\.html$/.test(e.name)) acc.push(path.join(p, e.name));
  }
  return acc;
}

module.exports = { scanFile, listHtml, RULES, contrast, parseColor };

if (require.main === module) {
  const files = listHtml(path.resolve(target)).sort();
  const results = files.map(scanFile);
  const rel = (f) => { const r = path.relative(process.cwd(), f); return !r || r.startsWith('..') ? f : r; };
  const errors = results.reduce((s, r) => s + r.errors, 0), warnings = results.reduce((s, r) => s + r.warnings, 0), shell = results.reduce((s, r) => s + r.shellSkipped, 0);
  if (JSON_MODE) {
    console.log(JSON.stringify({ target, files: results.map((r) => ({ ...r, file: rel(r.file) })), errors, warnings, shellSkipped: shell }, null, 2));
  } else {
    console.log(`scan-html ${rel(path.resolve(target))}: ${files.length} file · ${errors} lỗi · ${warnings} cảnh báo${shell ? ` · bỏ qua ${shell} phần tử khung (shell)` : ''}`);
    for (const r of results) {
      if (!r.findings.length) { console.log(`  ✓ ${rel(r.file)}`); continue; }
      for (const f of r.findings) console.log(`  ${f.level === 'error' ? '❌' : '⚠️'} ${rel(r.file)}:${f.line} · ${f.rule} · ${f.axis} ${f.criterion} · ${f.msg} → ${f.fix}`);
    }
  }
  process.exit(errors);
}
