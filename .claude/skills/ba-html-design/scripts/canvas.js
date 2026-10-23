#!/usr/bin/env node
/*
 * ba-html-design/canvas.js — trang CANVAS để xem và CHỐT thiết kế (zero-dependency, CommonJS).
 *
 *   node .claude/skills/ba-html-design/scripts/canvas.js wireframe [docsDir=docs]
 *        chèn/làm mới khối canvas vào Ho-so/wireframe.html, giữa hai mốc `<!-- ba-canvas:start -->` … `<!-- ba-canvas:end -->`
 *        (trước </body>). Chạy lại ra đúng cùng byte. Không sửa section nào.
 *   node .claude/skills/ba-html-design/scripts/canvas.js gallery [docsDir=docs]
 *        sinh Ho-so/design-canvas.html gom MỌI html-design.html: mỗi màn một khung iframe srcdoc (có <base> trỏ folder màn),
 *        hàng = nhóm màn (Screen-spec/<Nhóm>/), màn không nhóm vào hàng "Màn hình"; nút Duyệt / Cần sửa + ghi chú.
 *   node .claude/skills/ba-html-design/scripts/canvas.js apply [docsDir=docs] "S01: B · S02: A"
 *        (hoặc nhiều dòng, hoặc `ok` = chốt mọi phương án khuyên dùng) — đánh `data-chosen` lên đúng phương án, gỡ khỏi
 *        phương án khác CÙNG màn, giữ các phương án khác làm lịch sử. Màn/chữ không có → báo, exit 1, KHÔNG ghi gì.
 *
 * Runtime trên trang (CSS + JS ở ../assets/canvas/, chép inline vào file đích — trang không tham chiếu file ngoài):
 * mặc định mở chế độ Canvas (kéo nền để trượt, lăn để trượt, Ctrl/⌘ + lăn hoặc chụm hai ngón để thu phóng quanh con trỏ,
 * thanh công cụ −/%/+/Vừa khung/100%), nút "Danh sách" trả lại trang gốc nguyên vẹn, in ấn = danh sách. Lựa chọn nhớ
 * trong localStorage của trình duyệt; thanh dưới in kết quả cú pháp đóng và nút "Chép" để dán lại cho Claude.
 *
 * Exit: 0 xong · 1 câu trả lời của `apply` có màn/chữ không tồn tại (không ghi) · 2 thiếu file/đối số.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: không cụt khi process.exit qua pipe (lint 43)
const fs = require('fs');
const path = require('path');
const docpath = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));
const SS = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'screen-spec.js'));

const gioiHan = [
  'Đọc wireframe bằng regex như check-wireframe: section `data-screen` lồng section khác, hay thẻ `wf-variant` sinh bằng JS lúc chạy, không thấy.',
  '`apply` chỉ đổi thuộc tính `data-chosen` trên thẻ mở `wf-variant` — không kiểm luật phương án (đó là check-wireframe), không chạm nội dung.',
  'Khung canvas là iframe srcdoc: media query trong khung theo bề rộng khung (1280, hoặc `data-width` của section); chiều cao đo sau khi tải — trang dựng nội dung bằng setTimeout dài sẽ bị cắt ở số đo đầu.',
  'Gallery nhúng NGUYÊN VĂN html-design: nếu bản dựng tự trỏ tài nguyên mạng (font, ảnh http) thì khung vẫn tải từ mạng; tài nguyên tương đối chạy nhờ <base> trỏ folder màn.',
  'Lựa chọn trên trình duyệt chỉ nằm trong localStorage của máy đó (chế độ riêng tư/bị chặn → vẫn chạy, không nhớ) — nguồn sự thật vẫn là `data-chosen` do `apply` ghi.',
  'Tên tiếng Việt của màn lấy từ tiêu đề srs.md ("# Đặc tả yêu cầu — <Tên> (Mã màn: S..)"); không đọc được thì dùng tên folder.',
  'Khung Spec do máy LẤY theo truy vết lúc chạy lệnh (ba-toolkit/screen-spec.js: Phạm vi màn, US/GWT, bảng phần tử, BRule/Ma trận lỗi theo cột Trace, TC theo cột Nguồn) — sửa tài liệu thì chạy lại lệnh; trong wireframe bỏ ký tự emoji của nguồn cho đúng luật lo-fi.',
  'Chú thích (viền + chấm số) đo vị trí `data-el` ĐANG HIỆN trong khung; phần tử ẩn theo trạng thái thì chỉ có thẻ spec, không có chấm.',
];

const ASSETS = path.join(__dirname, '..', 'assets', 'canvas');
const START = '<!-- ba-canvas:start -->';
const END = '<!-- ba-canvas:end -->';
const BLOCK_RE = /<!-- ba-canvas:start -->[\s\S]*?<!-- ba-canvas:end -->\n?/;

function usage(code) {
  const msg = [
    'Dùng:',
    '  node .claude/skills/ba-html-design/scripts/canvas.js wireframe [docsDir=docs]',
    '  node .claude/skills/ba-html-design/scripts/canvas.js gallery [docsDir=docs]',
    '  node .claude/skills/ba-html-design/scripts/canvas.js apply [docsDir=docs] "S01: B · S02: A"   (hoặc "ok")',
    'Giới hạn:', ...gioiHan.map((g) => '  - ' + g),
  ].join('\n');
  (code ? console.error : console.log)(msg);
  process.exit(code);
}

const argv = process.argv.slice(2);
if (!argv.length || argv.includes('-h') || argv.includes('--help')) usage(argv.length ? 0 : 2);
const CMD = argv[0];
const pos = argv.slice(1).filter((a) => !a.startsWith('--'));
const rel = (p) => { const r = path.relative(process.cwd(), p); return !r ? p : r.startsWith('..') ? p : r; };

// JSON nhúng trong <script type="application/json">: thoát `<` (không đóng thẻ sớm), `#` (chữ nguồn kiểu "#abc" không bị
// check-wireframe đọc thành màu), U+2028/2029. lofi=true: bỏ ký tự emoji/dingbat của tài liệu nguồn (luật lo-fi không icon).
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;
function jsonNhúng(obj, lofi) {
  const t = JSON.stringify(obj, (k, v) => (lofi && typeof v === 'string' ? v.replace(EMOJI, '').replace(/\s{2,}/g, ' ').trim() : v));
  return t.replace(/</g, '\\u003c').replace(/#/g, '\\u0023').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
// Mọi folder màn `S.. - Tên` (lồng nhóm bao nhiêu cũng được; bỏ Ho-so/ ở gốc = màn đã cắt) → { mã: { dir, name } }
function màn(DOCS) {
  const out = {};
  (function quét(d, top) {
    let ents = []; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (!e.isDirectory() || /^(removed|node_modules|\.git|vendor)$/.test(e.name)) continue;
      if (top && e.name === docpath.HOSO) continue;
      const m = e.name.match(/^(S\d+)\s*-\s*(.+)$/), p = path.join(d, e.name);
      if (m) { if (!out[m[1]]) out[m[1]] = { dir: p, name: tênViệt(p) || m[2].trim() }; continue; }
      quét(p, false);
    }
  })(DOCS, true);
  return out;
}
function runtimeBlock(specs) {
  const css = fs.readFileSync(path.join(ASSETS, 'canvas.css'), 'utf8').replace(/\s+$/, '');
  const js = fs.readFileSync(path.join(ASSETS, 'canvas.js'), 'utf8').replace(/\s+$/, '');
  return `${START}\n<!-- Khối do ba-html-design/scripts/canvas.js chèn — chạy lại lệnh đó để làm mới, đừng sửa tay. -->\n<style id="cv-style">\n${css}\n</style>\n<script type="application/json" id="cv-spec">${jsonNhúng(specs || {}, true)}</script>\n<script id="cv-script">\n${js}\n</script>\n${END}\n`;
}

/* ───────── wireframe ───────── */
function sections(html) { return [...html.matchAll(/<section[^>]*data-screen="(S\d+)"[\s\S]*?<\/section>/g)]; }
const VTAG_RE = /<div\b(?:[^>"']|"[^"]*"|'[^']*')*>/g;
const attr = (tag, a) => { const m = tag.match(new RegExp(`\\s${a}(?:=("([^"]*)"|'([^']*)'))?(?=[\\s>/])`)); return m ? (m[2] ?? m[3] ?? '') : null; };
function variantTags(sec) { return [...sec.matchAll(VTAG_RE)].filter((t) => /\bwf-variant\b/.test(attr(t[0], 'class') || '')); }

function wfPath(DOCS) {
  const p = docpath.resolveDoc(DOCS, 'wireframe.html');
  if (!p) { console.error(`Không thấy wireframe.html trong ${rel(DOCS)} (Ho-so/ hoặc gốc) — dựng bằng /ba-html-design lofi trước.`); process.exit(2); }
  return p;
}

function cmdWireframe() {
  const DOCS = path.resolve(pos[0] || 'docs');
  const f = wfPath(DOCS);
  const html = fs.readFileSync(f, 'utf8');
  const M = màn(DOCS), specs = {};
  for (const s of sections(html.replace(BLOCK_RE, ''))) if (!specs[s[1]] && M[s[1]]) { const sp = SS.forScreen(M[s[1]].dir); if (sp) { delete sp.ma; specs[s[1]] = sp; } }
  const block = runtimeBlock(specs);
  let out;
  if (BLOCK_RE.test(html)) out = html.replace(BLOCK_RE, () => block);
  else {
    const i = html.toLowerCase().lastIndexOf('</body>');
    out = i >= 0 ? html.slice(0, i) + block + html.slice(i) : html + (html.endsWith('\n') ? '' : '\n') + block;
  }
  const secs = sections(out);
  const cóPA = secs.filter((s) => variantTags(s[0]).length >= 2).length;
  if (out === html) console.log(`canvas wireframe: ${rel(f)} đã có khối canvas mới nhất — không đổi (${secs.length} màn, ${cóPA} màn có phương án).`);
  else { fs.writeFileSync(f, out); console.log(`canvas wireframe: đã ${BLOCK_RE.test(html) ? 'làm mới' : 'chèn'} khối canvas vào ${rel(f)} (${secs.length} màn, ${cóPA} màn có phương án).`); }
  console.log('  Mở file trong trình duyệt: hàng "Bản chốt" ở trên, mỗi hàng dưới là một chữ phương án; bấm "Chọn phương án này" rồi "Chép" để dán lại.');
  console.log('  Soát lại: node .claude/skills/ba-html-design/scripts/check-wireframe.js ' + rel(DOCS));
}

/* ───────── apply ───────── */
function parseAnswer(text) {
  const items = [], bad = [];
  let ok = false;
  for (const raw of String(text).split(/[\n·;,]+/)) {
    const t = raw.trim().replace(/^[-*]\s+/, '');
    if (!t) continue;
    if (/^ok$/i.test(t)) { ok = true; continue; }
    const m = t.match(/^(S\d+)\s*[:=]?\s*([A-Za-z])$/i);
    if (m) items.push({ code: m[1].toUpperCase(), letter: m[2].toUpperCase() });
    else bad.push(t);
  }
  return { ok, items, bad };
}

function cmdApply() {
  let docsArg = 'docs', text = null;
  if (pos.length >= 2) { docsArg = pos[0]; text = pos.slice(1).join('\n'); }
  else if (pos.length === 1) { if (fs.existsSync(pos[0]) && fs.statSync(pos[0]).isDirectory()) docsArg = pos[0]; else text = pos[0]; }
  if (text === null && !process.stdin.isTTY) { try { text = fs.readFileSync(0, 'utf8'); } catch { text = null; } }
  if (!text || !text.trim()) { console.error('canvas apply: thiếu câu trả lời — vd "S01: B · S02: A" (mỗi màn một dòng) hoặc "ok".'); process.exit(2); }
  const DOCS = path.resolve(docsArg);
  const f = wfPath(DOCS);
  const html = fs.readFileSync(f, 'utf8');
  const { ok, items, bad } = parseAnswer(text);
  const lỗi = bad.map((b) => `không hiểu "${b}" — viết mỗi màn một dòng dạng "S02: B", hoặc "ok"`);

  const secs = sections(html);
  const byCode = {};
  for (const s of secs) {
    const tags = variantTags(s[0]).map((t) => ({ tag: t[0], at: s.index + t.index, chữ: (attr(t[0], 'data-variant') || '').trim().toUpperCase(),
      khuyên: attr(t[0], 'data-recommended') !== null, chốt: attr(t[0], 'data-chosen') !== null }));
    if (!byCode[s[1]]) byCode[s[1]] = tags;
  }
  const want = {}, explicit = {};
  if (ok) for (const [code, tags] of Object.entries(byCode)) {
    if (tags.length < 2) continue;
    const r = tags.find((t) => t.khuyên);
    if (r) want[code] = r.chữ; else lỗi.push(`${code}: "ok" mà màn không có phương án nào mang data-recommended — trả lời "${code}: <chữ>"`);
  }
  for (const it of items) {
    const tags = byCode[it.code];
    if (!tags) { lỗi.push(`${it.code}: không có màn này trong ${rel(f)} (có: ${Object.keys(byCode).join(', ') || 'không màn nào'})`); continue; }
    if (!tags.length) { lỗi.push(`${it.code}: màn không có phương án (wf-variant) nào để chọn`); continue; }
    if (!tags.some((t) => t.chữ === it.letter)) { lỗi.push(`${it.code}: không có phương án ${it.letter} (có: ${tags.map((t) => t.chữ || '?').join(', ')})`); continue; }
    if (explicit[it.code] && explicit[it.code] !== it.letter) { lỗi.push(`${it.code}: trả lời hai lần, khác nhau (${explicit[it.code]} và ${it.letter})`); continue; }
    want[it.code] = explicit[it.code] = it.letter;
  }
  if (!ok && !items.length && !bad.length) lỗi.push('câu trả lời rỗng');
  if (lỗi.length) {
    console.log(`canvas apply: KHÔNG ghi gì vào ${rel(f)} — ${lỗi.length} chỗ cần sửa trong câu trả lời:`);
    for (const l of lỗi) console.log('  ❌ ' + l);
    process.exit(1);
  }

  const edits = []; const tómTắt = [];
  for (const [code, letter] of Object.entries(want)) {
    const tags = byCode[code];
    const trước = tags.filter((t) => t.chốt).map((t) => t.chữ);
    for (const t of tags) {
      const nên = t.chữ === letter;
      if (nên === t.chốt) continue;
      let nt = t.tag.replace(/\s+data-chosen(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?(?=[\s>/])/g, '');
      if (nên) nt = nt.replace(/\s*(\/?)>$/, (m, sl) => ` data-chosen${sl ? ' /' : ''}>`);
      if (nt !== t.tag) edits.push({ at: t.at, len: t.tag.length, nt });
    }
    tómTắt.push(trước.length === 1 && trước[0] === letter ? `${code}: ${letter} (giữ nguyên)` : `${code}: ${letter}${trước.length ? ` (trước: ${trước.join(', ')})` : ' (mới chốt)'}`);
  }
  let out = html;
  for (const e of edits.sort((a, b) => b.at - a.at)) out = out.slice(0, e.at) + e.nt + out.slice(e.at + e.len);
  if (out !== html) fs.writeFileSync(f, out);
  console.log(`canvas apply: ${out === html ? 'không đổi gì' : 'đã ghi data-chosen'} trong ${rel(f)} — ${Object.keys(want).length} màn:`);
  for (const t of tómTắt) console.log('  · ' + t);
  console.log('  Các phương án khác giữ nguyên làm lịch sử. Chạy lại: node .claude/skills/ba-html-design/scripts/check-wireframe.js ' + rel(DOCS));
}

/* ───────── gallery ───────── */
function walk(dir, acc = []) {
  let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!/^(removed|node_modules|\.git|vendor)$/.test(e.name)) walk(p, acc); }
    else if (e.name === 'html-design.html') acc.push(p);
  }
  return acc;
}
function tênViệt(dir) { // cùng cách lấy với ba-figma-draw/figma-sync.js
  try {
    const h = (fs.readFileSync(path.join(dir, 'srs.md'), 'utf8').match(/^#\s+(.+)$/m) || [])[1] || '';
    const t = (h.split(/\s+[—–-]\s+/).slice(1).join(' — ') || '').replace(/\s*\(Mã màn:[^)]*\)\s*$/i, '').replace(/\s*\([A-Za-z][^)]*\)\s*$/, '').trim();
    return t || null;
  } catch { return null; }
}
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function withBase(html, href) {
  if (/<base\b/i.test(html)) return html;
  const tag = `<base href="${escHtml(href)}">`;
  const m = html.match(/<head\b[^>]*>/i);
  if (m) return html.slice(0, m.index + m[0].length) + tag + html.slice(m.index + m[0].length);
  const h = html.match(/<html\b[^>]*>/i);
  if (h) return html.slice(0, h.index + h[0].length) + '<head>' + tag + '</head>' + html.slice(h.index + h[0].length);
  return tag + html;
}

// Thanh trạng thái demo (canon `shell.md` §2; cùng dấu nhận với check-el/check-shell: class `statebar__group` có
// `data-group`, nhãn `statebar__label`, nút `statebar__btn`, ca lỗi mang `data-trace`). Thứ tự nút = thứ tự trong file —
// runtime bấm hộ nút thứ i của `.statebar__btn` trong iframe. Thanh kiểu cũ không có `statebar__btn` → không có thẻ.
function statebar(html) {
  const src = html.replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length)).replace(/(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi, (m, o, t, b, c) => o + ' '.repeat(b.length) + c);
  const nhóm = []; let cur = null, i = 0;
  const re = /<(div|span|button)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g; let m;
  const lớp = (a) => (a.match(/\bclass\s*=\s*["']([^"']*)["']/) || [])[1] || '';
  const thuộc = (a, k) => (a.match(new RegExp(`\\b${k}\\s*=\\s*["']([^"']*)["']`)) || [])[1] || '';
  const chữ = (s) => s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const thân = (from, tag) => { const e = src.indexOf(`</${tag}>`, from); return chữ(src.slice(from, e < 0 ? from : e)); };
  while ((m = re.exec(src))) {
    const cls = lớp(m[2]).split(/\s+/), sau = m.index + m[0].length;
    if (m[1] === 'div' && cls.includes('statebar__group')) { cur = { nhom: thuộc(m[2], 'data-group'), ten: '', nut: [] }; nhóm.push(cur); }
    else if (m[1] === 'span' && cls.includes('statebar__label') && cur) cur.ten = thân(sau, 'span');
    else if (m[1] === 'button' && cls.includes('statebar__btn')) {
      if (!cur) { cur = { nhom: '', ten: '', nut: [] }; nhóm.push(cur); }
      cur.nut.push({ i: i++, ten: thân(sau, 'button'), trace: thuộc(m[2], 'data-trace'), active: cls.includes('is-active') || cls.includes('active') });
    }
  }
  const TÊN = { ui: 'Trạng thái UI', error: 'Ca lỗi', role: 'Vai trò', biz: 'Trạng thái nghiệp vụ' };
  return nhóm.filter((g) => g.nut.length).map((g) => ({ ten: g.ten || TÊN[g.nhom] || 'Trạng thái', nut: g.nut }));
}

function cmdGallery() {
  const DOCS = path.resolve(pos[0] || 'docs');
  if (!fs.existsSync(DOCS)) { console.error(`Không thấy thư mục ${rel(DOCS)}.`); process.exit(2); }
  const files = walk(DOCS).filter((f) => !path.relative(DOCS, f).split(path.sep).includes(docpath.HOSO));
  if (!files.length) { console.error(`canvas gallery: không thấy html-design.html nào trong ${rel(DOCS)} — dựng bằng /ba-html-design <màn> trước.`); process.exit(2); }
  const out = docpath.writePathFor(DOCS, 'design-canvas.html');
  const outDir = path.dirname(out);
  const screens = files.map((f) => {
    const dir = path.dirname(f), folder = path.basename(dir);
    const m = folder.match(/^(S\d+)\s*-\s*(.+)$/);
    const parent = path.dirname(dir), pb = path.basename(parent);
    const nhóm = (parent === DOCS || pb === 'Screen-spec' || /^S\d+\s*-/.test(pb)) ? null : pb;
    const relDir = path.relative(outDir, dir).split(path.sep).map(encodeURIComponent).join('/') + '/';
    return { code: m ? m[1] : folder, name: tênViệt(dir) || (m ? m[2].trim() : folder), nhóm, n: m ? +m[1].slice(1) : 1e9,
      path: path.relative(DOCS, dir).split(path.sep).join('/'), href: relDir + 'html-design.html', html: withBase(fs.readFileSync(f, 'utf8'), relDir),
      spec: (() => {
        const sp = SS.forScreen(dir), tt = statebar(fs.readFileSync(f, 'utf8'));
        if (!sp && !tt.length) return null;
        const o = sp || { mucDich: null, phanTu: [], ma: {} };
        // mô tả mỗi trạng thái theo truy vết: data-trace (E-S../BRule-S..) → dòng Ma trận lỗi / Quy tắc; không có → chỉ tên
        o.trangThai = tt.map((g) => ({ ten: g.ten, nut: g.nut.map((b) => ({ i: b.i, ten: b.ten, active: b.active,
          moTa: b.trace ? (b.trace.split(/[\s,/]+/).map((c) => (o.ma || {})[c]).find(Boolean) || null) : null })) }));
        delete o.ma;
        return o;
      })() };
  }).sort((a, b) => a.n - b.n || a.code.localeCompare(b.code));
  const rowsMap = new Map();
  for (const s of screens) { const t = s.nhóm || 'Màn hình'; if (!rowsMap.has(t)) rowsMap.set(t, []); rowsMap.get(t).push(s); }
  const rows = [...rowsMap].map(([title, ss]) => ({ title, screens: ss.map((s) => ({ code: s.code, name: s.name, width: 1280, path: s.path, html: s.html, spec: s.spec })) }));
  const projectTitle = 'Duyệt thiết kế — ' + path.basename(path.dirname(DOCS));
  const data = jsonNhúng({ title: projectTitle, rows }, false);
  const css = fs.readFileSync(path.join(ASSETS, 'canvas.css'), 'utf8').replace(/\s+$/, '');
  const js = fs.readFileSync(path.join(ASSETS, 'canvas.js'), 'utf8').replace(/\s+$/, '');
  const list = rows.map((r) => `<h2>${escHtml(r.title)}</h2>\n<ul>\n${screens.filter((s) => (s.nhóm || 'Màn hình') === r.title).map((s) => `  <li><a href="${escHtml(s.href)}">${escHtml(s.code)} — ${escHtml(s.name)}</a> <small>${escHtml(s.path)}</small></li>`).join('\n')}\n</ul>`).join('\n');
  const page = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="ba-html-design/scripts/canvas.js gallery">
<title>${escHtml(projectTitle)}</title>
<style>
:root { --cv-accent: #6d28d9; } /* màu nhấn của chú thích + thẻ spec (chỉ gallery high-fi; wireframe giữ đen) */
body { margin: 0; background: #fff; color: #111; font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.cv-list { max-width: 880px; margin: 0 auto; padding: 32px 16px 64px; }
.cv-list h1 { font-size: 24px; margin: 0 0 4px; }
.cv-list p { color: #444; margin: 0 0 16px; }
.cv-list h2 { font-size: 18px; margin: 24px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
.cv-list li { margin: 4px 0; }
.cv-list small { color: #555; margin-left: 6px; }
.cv-list a { color: #111; }
</style>
<style id="cv-style">
${css}
</style>
</head>
<body>
<main class="cv-list">
<h1>${escHtml(projectTitle)}</h1>
<p>${screens.length} màn có html-design · sinh bởi <code>canvas.js gallery</code> — chạy lại lệnh đó sau khi sửa màn. Mở trang này trong trình duyệt để xem dạng canvas; bản in là danh sách này.</p>
${list}
</main>
<script type="application/json" id="cv-data">${data}</script>
<script id="cv-script">
${js}
</script>
</body>
</html>
`;
  fs.mkdirSync(outDir, { recursive: true });
  const cũ = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
  if (cũ !== page) fs.writeFileSync(out, page);
  console.log(`canvas gallery: ${cũ === page ? 'không đổi' : 'đã dựng'} ${rel(out)} — ${screens.length} khung, ${rows.length} hàng (${rows.map((r) => `${r.title}: ${r.screens.length}`).join(' · ')}).`);
  console.log('  Mở file trong trình duyệt, bấm "Duyệt" hoặc "Cần sửa" (kèm ghi chú) từng màn, rồi "Chép" và dán kết quả lại cho Claude.');
  console.log('  Trang tự chứa, mở offline; không đưa vào portal.');
}

if (CMD === 'wireframe') cmdWireframe();
else if (CMD === 'gallery') cmdGallery();
else if (CMD === 'apply') cmdApply();
else { console.error(`Không có lệnh "${CMD}".`); usage(2); }
