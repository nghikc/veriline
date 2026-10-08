#!/usr/bin/env node
/*
 * ba-screen-spec/bo-sung.js — DỰNG NGƯỢC một mục còn thiếu của tài liệu màn CŨ thành NHÁP (zero-dep, CommonJS).
 *
 *   node .claude/skills/ba-screen-spec/scripts/bo-sung.js <folder màn> bang-phan-tu|ma-tran-loi|cach-chay [--root <code>] [--write] [--json]
 *
 *   bang-phan-tu  "Bảng mô tả chi tiết phần tử màn hình" cho srs.md — từ `data-el` trên html-design.html; không có thì
 *                 khối `data-el` của phương án chọn trong Ho-so/wireframe.html; không có nữa thì THẺ TƯƠNG TÁC của
 *                 html-design (button/input/select/textarea/a/table…, đánh số theo thứ tự gặp). Tên: aria-label → chữ
 *                 hiển thị → `data-el N`. Control type suy từ role/thẻ/class (danh sách đóng của templates.md).
 *   ma-tran-loi   "## Ma trận lỗi" (7 cột canon) cho srs.md — nút statebar nhóm lỗi (nhãn + `data-trace`, giữ nguyên mã
 *                 `E-S..` html đã gắn), dòng srs ở bảng có cột "Thông báo"/"Người dùng thấy", rồi (có `--root`) chuỗi
 *                 kiểu-lỗi của design-spec mà scan-microcopy thấy trong code (kèm `file:line`).
 *   cach-chay     cột `Cách chạy` cho mọi bảng TC của test.md thiếu cột — `testcode.gomTestCode(root)`: TC có test mang mã
 *                 → `Auto (\`file\`)`, còn lại `Manual`. Gốc code: `--root` › cha của thư mục docs.
 *
 * Mặc định IN nháp markdown ra stdout, không ghi gì. `--write` chèn vào srs.md/test.md CHỈ KHI mục đó chưa có.
 * MỌI dòng dựng ngược mang 🔶 — chờ người xác nhận (ba-screen-spec `--bo-sung`: soát, bổ sung, dừng chờ duyệt rồi mới --write).
 * Exit: 0 nháp/đã ghi · 1 không dựng được dòng nào (thiếu nguồn) · 2 tham số sai, thiếu file, hoặc `--write` mà mục ĐÃ CÓ.
 *
 * VÌ SAO CÓ (W3, docs/superpowers/specs/2026-10-07-w3-nang-tai-lieu-cu-design.md, mục C): tài liệu viết trước khi có bảng
 * phần tử / ma trận E / cột Cách chạy làm checker âm thầm tắt (check-el "Chưa kiểm", check-tc-layer coi mọi TC Manual →
 * accept cổng 4 xanh giả). `thieu.js` chỉ ra chỗ thiếu; script này dựng phần MÁY đọc được từ thứ đã có (html, test code)
 * để người chỉ phải soát 🔶 thay vì gõ lại từ đầu. Bảng sinh ra parse được bằng `srs-elements.forScreen` (cùng parser
 * check-el/check-wireframe) và đọc được bằng check-tc-layer (định vị cột theo tiêu đề).
 *
 * gioiHan: chỉ ĐỌC THỨ ĐÃ CÓ, không đoán nghiệp vụ — Mô tả/Trace của bảng phần tử, Mức/Lối thoát/Trace của ma trận lỗi
 * luôn là 🔶 trống. Parser HTML tự viết (bỏ comment/script/style, chịu thẻ đóng lệch bằng cách bỏ qua), không chạy JS:
 * `data-el` sinh lúc chạy không thấy. Khung demo (statebar/demo-bar/demo-nav/data-demo) không vào bảng phần tử. Lối thẻ
 * tương tác (không có data-el) đánh số theo thứ tự trong file, không biết khối nào là một phần tử nghiệp vụ — html vẫn
 * chưa có data-el nên check-el sẽ báo EL-NONE (đúng: có bảng rồi, việc kế là gắn số). scan-microcopy chỉ dò chuỗi ĐÃ có
 * trong tài liệu (srs/design-spec), không đào literal lạ trong code. cach-chay: `Auto` chỉ nghĩa là có test MANG MÃ, không
 * nghĩa là test đúng; mã gộp `09/10` không khớp (luật testcode.js). Chèn cột: trước cột `Trạng thái` nếu có, không thì
 * cuối bảng; dòng không phải TC trong bảng nhận ô rỗng.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ (lint 43)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const TK = path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts');
const SE = require(path.join(TK, 'srs-elements.js'));
const { resolveDoc } = require(path.join(TK, 'docpath.js'));
const { gomTestCode } = require(path.join(TK, 'testcode.js'));

const LOẠI = ['bang-phan-tu', 'ma-tran-loi', 'cach-chay'];
const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
const pos = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--root');
const WRITE = argv.includes('--write'); const JSON_MODE = argv.includes('--json');
const [DIR_ARG, KIND] = pos;
const dừng = (m) => { console.error(m); process.exit(2); };
if (!DIR_ARG || !LOẠI.includes(KIND)) dừng(`Dùng: bo-sung.js <folder màn> ${LOẠI.join('|')} [--root <code>] [--write] [--json]`);
const DIR = path.resolve(DIR_ARG);
if (!fs.existsSync(DIR) || !fs.statSync(DIR).isDirectory()) dừng(`Không thấy folder màn: ${DIR_ARG}`);
const MÃ = (path.basename(DIR).match(/^(S\d+)/) || [])[1] || null;
const SỐ = MÃ ? MÃ.slice(1) : 'xx';
const đọc = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };

/** Thư mục docs chứa màn: đi lên tới thư mục tên `docs` / có `00-tracking.md`; không thấy → cha (hoặc ông nếu cha là nhóm). */
function gốcDocs(d) {
  let p = d;
  for (let i = 0; i < 5; i++) {
    const cha = path.dirname(p); if (cha === p) break; p = cha;
    if (path.basename(p) === 'docs' || fs.existsSync(path.join(p, '00-tracking.md'))) return p;
  }
  const cha = path.dirname(d); return path.basename(cha) === 'Screen-spec' ? path.dirname(cha) : cha;
}
const DOCS = gốcDocs(DIR);

/* ─── Parser HTML tối giản: cây phần tử có vị trí ──────────────────────────────────────────────── */
const VOID = new Set(['input', 'br', 'img', 'hr', 'meta', 'link', 'source', 'area', 'col', 'embed', 'wbr', 'base', 'track', 'param']);
function cây(html) {
  // Xoá nội dung comment/script/style/head nhưng GIỮ độ dài để vị trí khớp file gốc.
  const trắng = (s) => s.replace(/[^\n]/g, ' ');
  const src = html.replace(/<!--[\s\S]*?-->/g, trắng)
    .replace(/(<(script|style|template)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi, (m, a, _t, b, c) => a + trắng(b) + c);
  const gốc = { tag: '#root', attrs: {}, kids: [], start: 0, end: src.length, parent: null };
  const stack = [gốc];
  const re = /<(\/?)([a-zA-Z][\w-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let m;
  while ((m = re.exec(src))) {
    const tag = m[2].toLowerCase();
    if (m[1]) {
      const k = stack.map((x) => x.tag).lastIndexOf(tag);
      if (k > 0) { while (stack.length > k) { const e = stack.pop(); e.end = m.index; } }
      continue;
    }
    const attrs = {};
    for (const a of m[3].matchAll(/([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? '';
    const e = { tag, attrs, kids: [], start: re.lastIndex, end: re.lastIndex, open: m.index, parent: stack[stack.length - 1] };
    e.parent.kids.push(e);
    if (!VOID.has(tag) && !/\/\s*$/.test(m[3])) stack.push(e);
  }
  return { gốc, src };
}
const lùa = (e, f) => { for (const k of e.kids) { if (f(k) === false) continue; lùa(k, f); } };
const conCháu = (e) => { const ra = []; lùa(e, (k) => { ra.push(k); }); return ra; };
const lớp = (e) => ` ${e.attrs.class || ''} `;
// Khung demo: statebar canon, demo-bar/demo-nav đời cũ (P1 S29), nhóm `.states` aria-label "Chọn UI state" (P1 S14).
const làDemo = (e) => /\s(statebar|demo-bar|demo-nav|demo-btn|states|state-bar|state-switch(er)?)[\s_-]/.test(lớp(e).replace(/__/g, '_'))
  || 'data-demo' in e.attrs || /\bUI state\b|trạng thái giao diện/i.test(e.attrs['aria-label'] || '');
const trongDemo = (e) => { for (let p = e; p; p = p.parent) if (p.attrs && làDemo(p)) return true; return false; };
const chữ = (src, e) => src.slice(e.start, e.end).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;|&#\d+;/g, '').replace(/\s+/g, ' ').trim();
const ngắn = (s, n = 40) => (s.length > n ? s.slice(0, n - 1).trim() + '…' : s).replace(/\|/g, '/');

const ĐIỀU_KHIỂN = new Set(['input', 'select', 'textarea']);
function loạiThẻ(e) {
  const t = e.tag; const ty = (e.attrs.type || '').toLowerCase(); const role = (e.attrs.role || '').toLowerCase();
  if (role === 'dialog' || t === 'dialog') return 'Modal';
  if (role === 'tab' || role === 'tablist') return 'Tab';
  if (t === 'button' || role === 'button') return 'Button';
  if (t === 'a') return 'Link';
  if (t === 'select') return 'multiple' in e.attrs ? 'Multi-select' : 'Select';
  if (t === 'textarea') return 'Textarea';
  if (t === 'input') return { checkbox: 'Checkbox', radio: 'Radio', date: 'Date', 'datetime-local': 'DateTime', file: 'Upload', submit: 'Button', button: 'Button', reset: 'Button' }[ty] || 'Input';
  if (t === 'table') return 'Table';
  if (t === 'ul' || t === 'ol' || t === 'nav' || role === 'list' || role === 'navigation') return 'List';
  const c = lớp(e);
  if (/modal|dialog/i.test(c)) return 'Modal';
  if (/toast|snackbar/i.test(c)) return 'Toast';
  if (/pagination|pager/i.test(c)) return 'Pagination';
  if (/\btabs?\b/i.test(c)) return 'Tab';
  if (/\bcard\b/i.test(c)) return 'Card';
  return null;
}
function loạiKhối(e) {
  const tự = loạiThẻ(e); if (tự) return tự;
  const cc = conCháu(e);
  const đk = cc.find((k) => ĐIỀU_KHIỂN.has(k.tag) && !['submit', 'button', 'hidden'].includes((k.attrs.type || '').toLowerCase()));
  if (đk) return loạiThẻ(đk);
  for (const k of cc) { const l = loạiThẻ(k); if (l && l !== 'Button' && l !== 'Link') return l; }
  const nút = cc.filter((k) => ['Button', 'Link'].includes(loạiThẻ(k)));
  if (nút.length === 1) return loạiThẻ(nút[0]);
  if (nút.length > 1) return 'Card';
  return 'Label';
}
const KIỂU = { Input: 'String', Textarea: 'String', Select: 'Enum', 'Multi-select': 'Array', Checkbox: 'Boolean', Radio: 'Enum', Date: 'Date', DateTime: 'DateTime', Upload: 'File', Button: 'Action', Link: 'Action', Table: 'List', List: 'List' };
function kiểuDữLiệu(loai, e) {
  if (loai === 'Input') { const i = e.tag === 'input' ? e : conCháu(e).find((k) => k.tag === 'input'); if (i && i.attrs.type === 'number') return 'Number'; }
  return KIỂU[loai] || 'None';
}
function bắtBuộc(loai, e) {
  if (!['Input', 'Textarea', 'Select', 'Multi-select', 'Checkbox', 'Radio', 'Date', 'DateTime', 'Upload'].includes(loai)) return '—';
  const có = [e, ...conCháu(e)].some((k) => 'required' in k.attrs || k.attrs['aria-required'] === 'true');
  return có ? 'Có' : 'Không 🔶';
}
let NHÃN_FOR = new Map(); // id → chữ của <label for="id">, dựng lại mỗi lần parse
function dựngNhãnFor(src, gốc) { NHÃN_FOR = new Map(); lùa(gốc, (k) => { if (k.tag === 'label' && k.attrs.for) NHÃN_FOR.set(k.attrs.for, chữ(src, k)); }); }
function tênKhối(src, e, n) {
  if (e.attrs['aria-label']) return { ten: ngắn(e.attrs['aria-label']), đoán: false };
  if (e.attrs.id && NHÃN_FOR.get(e.attrs.id)) return { ten: ngắn(NHÃN_FOR.get(e.attrs.id)), đoán: false };
  if (ĐIỀU_KHIỂN.has(e.tag)) {
    const bọc = e.parent && e.parent.tag === 'label' ? chữ(src, e.parent) : '';
    if (bọc) return { ten: ngắn(bọc), đoán: false };
    const g = e.attrs.placeholder || e.attrs.title || e.attrs.name; if (g) return { ten: ngắn(g), đoán: false };
  }
  const cc = conCháu(e);
  const nhãn = cc.find((k) => ['label', 'legend', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'th', 'caption'].includes(k.tag) && chữ(src, k));
  if (nhãn) return { ten: ngắn(chữ(src, nhãn)), đoán: false };
  const t = chữ(src, e); if (t) return { ten: ngắn(t), đoán: false };
  const al = cc.find((k) => k.attrs['aria-label'] || k.attrs.placeholder || k.attrs.title);
  if (al) return { ten: ngắn(al.attrs['aria-label'] || al.attrs.placeholder || al.attrs.title), đoán: false };
  return { ten: `data-el ${n}`, đoán: true };
}
function dòngTừKhối(src, e, n, nguồn) {
  const loai = loạiKhối(e); const { ten, đoán } = tênKhối(src, e, n);
  return { n, ten, loai, kieu: kiểuDữLiệu(loai, e), batBuoc: bắtBuộc(loai, e), nguon: nguồn, đoán };
}

/* ─── bang-phan-tu ─────────────────────────────────────────────────────────────────────────────── */
function bảngPhầnTử() {
  const nguồnRa = []; const ghiChú = [];
  const htmlF = path.join(DIR, 'html-design.html'); const html = đọc(htmlF);
  let dòng = [];
  const theoDataEl = (src, gốc, nhãn) => {
    const thấy = new Map();
    lùa(gốc, (k) => { if (k.attrs['data-el'] && /^\d+$/.test(k.attrs['data-el']) && !trongDemo(k) && !thấy.has(+k.attrs['data-el'])) thấy.set(+k.attrs['data-el'], k); });
    return [...thấy.entries()].sort((a, b) => a[0] - b[0]).map(([n, k]) => dòngTừKhối(src, k, n, nhãn));
  };
  if (html) { const { gốc, src } = cây(html); dựngNhãnFor(src, gốc); dòng = theoDataEl(src, gốc, 'html-design data-el'); if (dòng.length) nguồnRa.push('html-design.html (data-el)'); }
  if (!dòng.length && MÃ) {
    const wfF = resolveDoc(DOCS, 'wireframe.html'); const wf = wfF && đọc(wfF);
    if (wf) {
      const { gốc, src } = cây(wf); dựngNhãnFor(src, gốc);
      let sec = null; lùa(gốc, (k) => { if (!sec && k.tag === 'section' && k.attrs['data-screen'] === MÃ) { sec = k; return false; } });
      if (sec) {
        const pa = conCháu(sec).filter((k) => /\bwf-variant\b/.test(k.attrs.class || ''));
        let khung = sec;
        if (pa.length) {
          const chốt = pa.find((k) => 'data-chosen' in k.attrs);
          khung = chốt || pa[0];
          if (!chốt && pa.length > 1) ghiChú.push(`wireframe ${MÃ} có ${pa.length} phương án mà chưa cái nào data-chosen — lấy phương án đầu 🔶`);
        }
        dòng = theoDataEl(src, khung, 'wireframe data-el');
        if (dòng.length) nguồnRa.push(`${path.relative(DOCS, wfF)} (section ${MÃ}${pa.length ? ', phương án ' + (khung.attrs['data-variant'] || '?') : ''})`);
      }
    }
  }
  if (!dòng.length && html) {
    const { gốc, src } = cây(html); dựngNhãnFor(src, gốc); let n = 0;
    const đãLấy = new Set();
    lùa(gốc, (k) => {
      if (trongDemo(k) || ['head', 'script', 'style', 'template'].includes(k.tag)) return false;
      if (k.tag === 'input' && (k.attrs.type || '').toLowerCase() === 'hidden') return;
      const l = loạiThẻ(k);
      if (!l || ['Card'].includes(l)) return;
      for (let p = k.parent; p; p = p.parent) if (đãLấy.has(p)) return; // control trong bảng/modal đã lấy → không đếm lại
      đãLấy.add(k); dòng.push(dòngTừKhối(src, k, ++n, 'thẻ tương tác'));
      if (['Table', 'Modal', 'List'].includes(l)) return false;
    });
    if (dòng.length) { nguồnRa.push('html-design.html (thẻ tương tác — CHƯA có data-el)'); ghiChú.push('html-design chưa có data-el: số # ở đây đánh theo thứ tự thẻ trong file — gắn `data-el="N"` lên đúng khối khi sửa html-design (check-el sẽ báo EL-NONE tới lúc đó)'); }
  }
  const md = ['## Bảng mô tả chi tiết phần tử màn hình (BẮT BUỘC)',
    `> 🔶 Dựng ngược bởi \`bo-sung.js\` từ ${nguồnRa.join(' · ') || '(không có nguồn)'} — Tên/Control type do máy đoán; **Mô tả nghiệp vụ và Trace phải người điền**, rồi xoá 🔶.`,
    '', '| # | Tên phần tử | Control type | Data Type | Bắt buộc | Mô tả | Trace |', '|---|-------------|--------------|-----------|----------|-------|-------|',
    ...dòng.map((d) => `| ${d.n} | ${d.ten}${d.đoán ? ' 🔶' : ''} | ${d.loai} | ${d.kieu} | ${d.batBuoc} | 🔶 (${d.nguon}) | 🔶 |`)].join('\n');
  return { md, dòng, nguồn: nguồnRa, ghiChú };
}

/* ─── ma-tran-loi ──────────────────────────────────────────────────────────────────────────────── */
const KIỂU_LỖI = /lỗi|không (được|thể|hợp lệ|tìm thấy|đủ|có quyền)|thất bại|hết hạn|vượt|quá (dài|ngắn|lớn|nhiều)|sai|bị khoá|bị khóa|từ chối|mất kết nối|đã tồn tại|tối đa|tối thiểu|bắt buộc|error|fail|invalid|denied|expired/i;
const chuẩn = (s) => String(s).normalize('NFC').replace(/[“”"'`*]/g, '').replace(/\s+/g, ' ').replace(/[.!?…]+$/, '').trim().toLowerCase();
function bảngMd(txt) {
  const L = txt.split('\n'); const ra = [];
  for (let i = 1; i < L.length; i++) {
    if (!/^\|\s*:?-{2,}/.test(L[i]) || !L[i - 1].trim().startsWith('|')) continue;
    const hd = tách(L[i - 1]); const rows = [];
    for (let j = i + 1; j < L.length && L[j].trim().startsWith('|'); j++) rows.push({ ô: tách(L[j]), line: j + 1 });
    ra.push({ hd, rows, line: i });
  }
  return ra;
}
function maTrậnLỗi() {
  const dòng = []; const nguồnRa = []; const ghiChú = []; const đãCó = new Map();
  const thêm = (r) => { const k = r.msg ? chuẩn(r.msg) : null; if (k && đãCó.has(k)) { const o = đãCó.get(k); o.từ = [...new Set([...o.từ, ...r.từ])]; if (r.code && !o.code) o.code = r.code; return; } dòng.push(r); if (k) đãCó.set(k, r); };
  // 1. statebar nhóm lỗi
  const html = đọc(path.join(DIR, 'html-design.html'));
  if (html) {
    const { gốc, src } = cây(html); let n0 = dòng.length;
    lùa(gốc, (k) => {
      if (!(k.tag === 'button' || k.attrs.onclick) || !trongDemo(k)) return;
      const tr = (k.attrs['data-trace'] || '').match(/E-S\d+-\d+/) || chữ(src, k).match(/E-S\d+-\d+/);
      let nhómLỗi = false; for (let p = k.parent; p && p.attrs; p = p.parent) if (/err|lỗi|loi/i.test(p.attrs['data-group'] || '')) nhómLỗi = true;
      const st = ((k.attrs.onclick || '').match(/setState\(\s*['"]([^'"]+)/) || [])[1] || k.attrs['data-s'] || k.attrs['data-state'] || '';
      if (!tr && !nhómLỗi && !/^err/i.test(st)) return;
      thêm({ code: tr ? tr[0] : null, ten: ngắn(chữ(src, k)) || st, khi: st ? `trạng thái \`${st}\` trên html-design` : '', msg: '', từ: ['statebar'] });
    });
    if (dòng.length > n0) nguồnRa.push(`html-design statebar (${dòng.length - n0} nút lỗi)`);
  }
  // 2. dòng srs có cột thông báo
  const srs = đọc(path.join(DIR, 'srs.md'));
  if (srs) {
    let n0 = dòng.length;
    for (const b of bảngMd(srs)) {
      const iMsg = b.hd.findIndex((h) => /người dùng thấy|thông báo|message/i.test(h)); if (iMsg < 0) continue;
      if (b.rows.some((r) => /^E-S\d+-\d+$/.test(r.ô[0] || ''))) continue; // chính ma trận lỗi (đã có) — không dựng lại từ nó
      const iRB = b.hd.findIndex((h) => /ràng buộc|định dạng|điều kiện|xảy ra khi|khi/i.test(h));
      for (const r of b.rows) {
        const ô = r.ô[iMsg] || '';
        const qs = [...ô.matchAll(/"([^"]{2,})"|“([^”]{2,})”/g)].map((m) => m[1] || m[2]);
        // Không có ngoặc kép: lấy cả ô chỉ khi nó trông như câu lỗi và không mở bằng gạch (ô "— (không chặn…)").
        if (!qs.length && (!ô || /^[—–-]/.test(ô) || !KIỂU_LỖI.test(ô))) continue;
        for (const q of (qs.length ? qs : [ô])) thêm({ code: null, ten: ngắn(r.ô[0] || ''), khi: [r.ô[0], iRB >= 0 && iRB !== 0 ? r.ô[iRB] : ''].filter(Boolean).join(' — '), msg: q, từ: [`srs.md:${r.line}`] });
      }
    }
    if (dòng.length > n0) nguồnRa.push(`srs.md bảng có cột thông báo (${dòng.length - n0} dòng)`);
  }
  // 3. scan-microcopy (chỉ khi có --root)
  const ROOT = opt('--root');
  if (ROOT && MÃ) {
    const r = spawnSync(process.execPath, [path.join(__dirname, '..', '..', 'ba-conformance', 'scripts', 'scan-microcopy.js'), DOCS, '--root', path.resolve(ROOT), '--screen', MÃ, '--json'], { encoding: 'utf8', maxBuffer: 1e8 });
    let j = null; try { j = JSON.parse(r.stdout); } catch { /* */ }
    if (!j) ghiChú.push('scan-microcopy không chạy được — bỏ nguồn literal code');
    else {
      let n0 = dòng.length; let gắn = 0;
      for (const m of (j.man || []).flatMap((x) => x.chuoi || [])) {
        const chỗ = m.ketQua === 'khớp' ? m.viTri : (m.trongTest && m.trongTest.ketQua === 'khớp' ? m.trongTest.viTri + ' (test)' : null);
        const k = chuẩn(m.chuoi);
        if (đãCó.has(k)) { if (chỗ) { đãCó.get(k).từ.push(`code ${chỗ}`); gắn++; } continue; }
        if (!chỗ || !KIỂU_LỖI.test(m.chuoi)) continue;
        thêm({ code: null, ten: '', khi: '', msg: m.chuoi, từ: [...(m.nguon || []).slice(0, 1), `code ${chỗ}`] });
      }
      if (dòng.length > n0 || gắn) nguồnRa.push(`scan-microcopy --root (${dòng.length - n0} chuỗi mới · ${gắn} chỗ code gắn vào dòng có sẵn)`);
    }
  }
  // Đánh mã: giữ mã html đã gắn; còn lại nối tiếp sau số lớn nhất.
  let max = 0; for (const d of dòng) if (d.code) max = Math.max(max, +d.code.split('-').pop());
  for (const d of dòng) if (!d.code) d.code = `E-S${SỐ}-${String(++max).padStart(2, '0')}`;
  dòng.sort((a, b) => +a.code.split('-').pop() - +b.code.split('-').pop());
  const md = ['## Ma trận lỗi',
    `> 🔶 Dựng ngược bởi \`bo-sung.js\` từ ${nguồnRa.join(' · ') || '(không có nguồn)'} — **Mức, Trace, Lối thoát phải người điền**; mọi cách màn hỏng mà máy không thấy (hệ ngoài chết, hết quyền, xung đột…) phải người thêm. Xong thì xoá 🔶.`,
    '', '| Mã | Lỗi | Xảy ra khi | Mức | Trace | Người dùng thấy gì | Lối thoát |', '|----|-----|-----------|-----|-------|--------------------|-----------|',
    ...dòng.map((d) => `| ${d.code} | ${d.ten ? d.ten + ' 🔶' : '🔶'} | ${d.khi ? ngắn(d.khi, 90) + ' 🔶' : '🔶'} | 🔶 | 🔶 | ${d.msg ? `"${d.msg.replace(/\|/g, '/')}"` : '🔶 (xem trạng thái trên html-design)'} (${d.từ.join('; ')}) | 🔶 |`)].join('\n');
  return { md, dòng, nguồn: nguồnRa, ghiChú };
}

/* ─── cach-chay ────────────────────────────────────────────────────────────────────────────────── */
const CỘT_CÁCH = [/^cách chạy$/i, /^cách$/i, /^auto\??$/i];            // cùng mẫu check-tc-layer TÊN_CỘT.cách
const CỘT_MÃ = /^(mã( tc)?|id|tc)$/i;
const CỘT_BƯỚC_MONG = /^(các bước( rút gọn)?|bước|kết quả mong đợi|kết quả kỳ vọng|kỳ vọng|mong đợi)$/i;
const tách = (l) => l.replace(/^\s*\||\|\s*$/g, '').split(/(?<!\\)\|/).map((x) => x.trim());
/** Các bảng TC của test.md: [{ hdLine (0-based), sepLine, rows:[lineIdx], hd, cóCách, iChèn }]. */
function bảngTC(L) {
  const ra = [];
  for (let i = 1; i < L.length; i++) {
    if (!/^\|\s*:?-{2,}/.test(L[i]) || !L[i - 1].trim().startsWith('|')) continue;
    const hd = tách(L[i - 1]);
    if (!hd.some((h) => CỘT_MÃ.test(h)) || !hd.some((h) => CỘT_BƯỚC_MONG.test(h))) continue;
    const rows = []; for (let j = i + 1; j < L.length && L[j].trim().startsWith('|'); j++) rows.push(j);
    const iTT = hd.findIndex((h) => /^trạng thái/i.test(h));
    ra.push({ hdLine: i - 1, sepLine: i, rows, hd, cóCách: hd.some((h) => CỘT_CÁCH.some((r) => r.test(h))), iChèn: iTT >= 0 ? iTT : hd.length });
  }
  return ra;
}
const MÃ_TC = /^\|\s*\*{0,2}(TC-S\d+-\d+)\*{0,2}[^|]*\|/;
function cáchChạy() {
  const f = path.join(DIR, 'test.md'); const txt = đọc(f);
  if (txt == null) dừng(`Không có test.md trong ${DIR_ARG}`);
  const ROOT = path.resolve(opt('--root') || path.dirname(DOCS));
  const map = gomTestCode(ROOT);
  const L = txt.split('\n'); const bs = bảngTC(L); const thiếu = bs.filter((b) => !b.cóCách);
  const giáTrị = new Map(); const dòng = [];
  for (const b of thiếu) for (const j of b.rows) {
    const m = MÃ_TC.exec(L[j]); if (!m || giáTrị.has(m[1])) continue;
    const hits = map.get(m[1]) || [];
    const files = [...new Set(hits.map((h) => h.file))];
    const v = files.length ? `Auto (${files.slice(0, 2).map((x) => '`' + x + '`').join(', ')}${files.length > 2 ? ` +${files.length - 2}` : ''}) 🔶` : 'Manual 🔶';
    giáTrị.set(m[1], v); dòng.push({ tc: m[1], cach: v, line: j + 1 });
  }
  const auto = dòng.filter((d) => d.cach.startsWith('Auto')).length;
  const md = [`> 🔶 Cột \`Cách chạy\` dựng ngược bởi \`bo-sung.js\` — gốc code \`${path.relative(process.cwd(), ROOT) || '.'}\`, ${thiếu.length}/${bs.length} bảng TC thiếu cột · ${auto} Auto (có test mang mã) · ${dòng.length - auto} Manual. Auto chỉ nghĩa là có test MANG MÃ; Manual có thể là TC chưa viết test — soát rồi xoá 🔶.`,
    '', '| Mã TC | Cách chạy |', '|---|---|', ...dòng.map((d) => `| ${d.tc} | ${d.cach} |`)].join('\n');
  return { md, dòng, nguồn: [`gomTestCode(${ROOT})`], ghiChú: bs.length ? [] : ['test.md không có bảng TC nào nhận ra được (cần cột mã + cột bước/mong đợi)'], L, thiếu, giáTrị, file: f, bs };
}

/* ─── Chèn vào file ────────────────────────────────────────────────────────────────────────────── */
/** Chèn khối `md` vào srs trước tiêu đề `## ` đầu tiên khớp một trong `trước` (theo thứ tự ưu tiên); không có → trước `## Thuật ngữ` hoặc cuối file. */
function chènSrs(txt, md, trước) {
  const L = txt.split('\n');
  for (const r of [...trước, /^##\s+Thuật ngữ/i]) {
    const i = L.findIndex((l) => r.test(l));
    if (i >= 0) { L.splice(i, 0, md, ''); return L.join('\n'); }
  }
  return txt.replace(/\s*$/, '\n\n') + md + '\n';
}

const kq = KIND === 'bang-phan-tu' ? bảngPhầnTử() : KIND === 'ma-tran-loi' ? maTrậnLỗi() : cáchChạy();
const srsF = path.join(DIR, 'srs.md');
const srsTxt = KIND === 'cach-chay' ? null : đọc(srsF);
if (KIND !== 'cach-chay' && srsTxt == null) dừng(`Không có srs.md trong ${DIR_ARG}`);
const đãCó = KIND === 'bang-phan-tu' ? SE.parse(srsTxt) !== null
  : KIND === 'ma-tran-loi' ? /^\|\s*E-S\d+-\d+\s*\|/m.test(srsTxt)
  : kq.bs.length > 0 && kq.thiếu.length === 0;

let ghi = null;
if (WRITE) {
  if (đãCó) { console.error(`Đã có ${KIND} trong ${KIND === 'cach-chay' ? 'test.md' : 'srs.md'} — không ghi đè (sửa tay, hoặc mở CR nếu tài liệu đã chốt).`); process.exit(2); }
  if (!kq.dòng.length) { console.error(`Không dựng được dòng nào cho ${KIND} — ${kq.ghiChú.join('; ') || 'thiếu nguồn'}.`); process.exit(1); }
  if (KIND === 'bang-phan-tu') { fs.writeFileSync(srsF, chènSrs(srsTxt, kq.md, [/^##\s+Yêu cầu dữ liệu/i, /^##\s+Ma trận lỗi/i, /^##\s+Phụ thuộc ngoài/i, /^##\s+Giả định/i])); ghi = srsF; }
  else if (KIND === 'ma-tran-loi') {
    const L = srsTxt.split('\n'); const i = L.findIndex((l) => /^##\s+Ma trận lỗi/i.test(l));
    if (i >= 0) { // tiêu đề có mà 0 dòng E-S → chèn bảng ngay trước tiêu đề `## ` kế
      let j = L.findIndex((l, k) => k > i && /^##\s/.test(l)); if (j < 0) j = L.length;
      L.splice(j, 0, ...kq.md.split('\n').slice(1), ''); fs.writeFileSync(srsF, L.join('\n'));
    } else fs.writeFileSync(srsF, chènSrs(srsTxt, kq.md, [/^##\s+Phụ thuộc ngoài/i, /^##\s+Giả định/i, /^##\s+Quét yêu cầu ngầm/i]));
    ghi = srsF;
  } else {
    const L = kq.L;
    for (const b of kq.thiếu) {
      // Chèn ô THÔ (giữ nguyên khoảng trắng/độ rộng các ô cũ); `\|` trong ô không phải ranh giới.
      const chèn = (j, v) => {
        const p = L[j].split(/(?<!\\)\|/); const đuôi = /\|\s*$/.test(L[j]);
        const ô = p.slice(1, đuôi ? -1 : undefined); ô.splice(Math.min(b.iChèn, ô.length), 0, v === '---' ? '---' : ` ${v} `);
        L[j] = p[0] + '|' + ô.join('|') + '|' + (đuôi ? p[p.length - 1] : '');
      };
      chèn(b.hdLine, 'Cách chạy'); chèn(b.sepLine, '---');
      for (const j of b.rows) { const m = MÃ_TC.exec(L[j]); chèn(j, m ? kq.giáTrị.get(m[1]) : ''); }
    }
    fs.writeFileSync(kq.file, L.join('\n')); ghi = kq.file;
  }
}

if (JSON_MODE) {
  console.log(JSON.stringify({ man: MÃ, folder: DIR, loai: KIND, daCo: đãCó, soDong: kq.dòng.length, nguon: kq.nguồn, ghiChu: kq.ghiChú, ghi: ghi ? path.relative(process.cwd(), ghi) : null, md: kq.md }, null, 1));
} else {
  if (!ghi) {
    console.log(kq.md);
    console.log('');
  }
  for (const g of kq.ghiChú) console.log(`⚠️  ${g}`);
  if (đãCó) console.log(`ℹ️  ${KIND} ĐÃ CÓ trong tài liệu — nháp chỉ để đối chiếu, --write sẽ từ chối (exit 2).`);
  console.log(ghi ? `✍️  Đã chèn ${kq.dòng.length} dòng ${KIND} (🔶) vào ${path.relative(process.cwd(), ghi)} — soát 🔶, rồi cập nhật cột "Cập nhật cuối" của ${MÃ || 'màn'} trong 00-tracking.md.`
    : `${kq.dòng.length} dòng nháp (🔶) · nguồn: ${kq.nguồn.join(' · ') || '—'} · CHƯA ghi — duyệt xong chạy lại với --write.`);
}
process.exit(!WRITE && !đãCó && !kq.dòng.length ? 1 : 0);
