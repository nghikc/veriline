#!/usr/bin/env node
/*
 * ba-html-design/check-el.js — ĐỐI CHIẾU số `data-el` trên mọi `html-design.html` với "Bảng mô tả chi tiết phần tử màn
 * hình" trong `srs.md` cùng folder màn. Checker TĨNH, zero-dependency, CommonJS. Đếm, không phán.
 *
 *   node .claude/skills/ba-html-design/scripts/check-el.js <docsDir | folder màn | file.html> [--plain|--json] [--rules]
 *
 * Luật (mã cố định — rule-cover đo mỗi mã có fixture gãy bắn):
 *   ❌ EL-MISS     dòng `#` trong bảng phần tử srs không có khối nào mang `data-el="<#>"`
 *   ❌ EL-UNKNOWN  `data-el` trên html không có dòng nào trong bảng — số này tra không ra gì
 *   ❌ EL-NONE     màn CÓ bảng mà html không có `data-el` nào — MỘT mục thay cho N mục EL-MISS (chưa gắn số, không phải
 *                  thiếu từng khối)
 * Đầu ra: danh sách P của `ba-toolkit/scripts/plist.js`, dòng `Đã kiểm / Chưa kiểm` LUÔN in. `--json` → {files, errors,
 * warns, errorGroups, groups, unchecked}. Exit = số NHÓM ❌ (tối đa 255).
 *
 * VÌ SAO CÓ (spec 2026-10-05 §1, nợ P2 đợt 8): wireframe lo-fi đã đánh số khối theo bảng phần tử (check-wireframe), nhưng
 * html-design thì không — người review cầm srs dòng #7 không biết khối nào trên bản high-fi là #7, và `ba-figma-draw` đẩy
 * layout lên Figma không có khoá để đối soát từng khối. Cùng một bộ số trên wireframe, html-design và Figma là thứ ĐẾM
 * được, nên đếm bằng máy. Parser bảng dùng chung `ba-toolkit/scripts/srs-elements.js` với check-wireframe.
 *
 * gioiHan:
 *   - `data-el` trong THANH TRẠNG THÁI demo (`statebar`/`statebar__btn`, nhóm demo kiểu cũ `demo-nav`/`demo-btn`/`data-demo`) BỎ QUA — nó không có
 *     trong sản phẩm. `app-header`/`app-nav` thì ĐƯỢC tính: srs hay liệt kê "Thanh điều hướng trên" như một phần tử của
 *     màn (example S02 #1) — luật cũ "khung không mang data-el" làm dòng đó không bao giờ phủ được. Nút có `onclick="setState(…)"`
 *     KHÔNG tự động là demo: "Thử lại" trong thẻ lỗi thật cũng gọi setState (dự án desktop S34 #63).
 *   - Cùng một số xuất hiện ở NHIỀU khối (mỗi trạng thái statebar một khối) là ĐÚNG — không cảnh báo trùng.
 *   - Khối lặp (bảng, danh sách) chỉ cần MỘT `data-el` bao ngoài; script không biết khối nào "đáng" có số riêng.
 *   - Màn không có srs.md / srs không có bảng phần tử → vào dòng `Chưa kiểm`, KHÔNG phải lỗi. Mã màn lấy từ tên folder
 *     `S.. - …`; html-design.html đứng ngoài folder màn vẫn so với srs.md đứng cạnh nó (nếu có).
 *   - Không chạy JS: `data-el` do script sinh lúc chạy không thấy. Không so vị trí/thứ tự khối, không so `loai`
 *     (Control type) với thẻ HTML. Parser thẻ tự viết: chịu comment/`<script>`/`<style>`, không chịu `>` trần trong thuộc
 *     tính không có ngoặc.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const plist = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'plist.js'));
const RC = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'rule-cover.js'));
const SE = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'srs-elements.js'));

const LUẬT = [
  ['EL-MISS', 'dòng trong bảng phần tử srs không có khối data-el trên html-design'],
  ['EL-UNKNOWN', 'data-el trên html-design không có dòng nào trong bảng phần tử srs'],
  ['EL-NONE', 'màn có bảng phần tử mà html-design không có data-el nào'],
];
const argv = process.argv.slice(2);
RC.inLuật(argv, LUẬT);
const JSON_MODE = argv.includes('--json');
const target = argv.find((a) => !a.startsWith('--'));
if (!target || !fs.existsSync(target)) {
  console.error('Dùng: check-el.js <docsDir | folder màn | file.html> [--plain|--json] [--rules]');
  process.exit(2);
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
const isDir = fs.statSync(T).isDirectory();
const files = isDir ? walk(T).sort() : [T];
const BASE = isDir ? T : path.dirname(T);

/* ─── data-el ngoài thanh trạng thái demo ────────────────────────────────────────────────────────────── */
// Chỉ thanh trạng thái demo (`statebar`, `statebar__btn`, hay nhóm nút demo kiểu cũ `data-demo`/`demo-*`). KHÔNG coi mọi
// `onclick="setState(…)"` là demo: nút "Thử lại" trong thẻ lỗi thật cũng gọi setState (dự án desktop S34 #63, 05/10/2026) — nó là
// phần tử của màn, phải gắn số được.
const isShellEl = (attrs) => /\bclass\s*=\s*["'][^"']*\b(statebar|statebar__btn|statebar__group|demo-nav|demo-btn)\b(?![\w-])/i.test(attrs)
  || /\bdata-demo\b/i.test(attrs);
const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
function dataEls(raw) {
  const blank = (s) => s.replace(/[^\n]/g, ' ');
  const src = raw.replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi, (m, o, t, body, c) => o + blank(body) + c);
  const out = []; let shell = 0;
  const stack = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g; let m;
  while ((m = re.exec(src))) {
    const [, close, tagRaw, attrs] = m; const tag = tagRaw.toLowerCase();
    if (close) { let k = stack.length - 1; while (k >= 0 && stack[k].tag !== tag) k--; if (k >= 0) stack.length = k; continue; }
    const el = { tag, shell: isShellEl(attrs) };
    const inShell = el.shell || stack.some((e) => e.shell);
    const d = /\bdata-el\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(attrs);
    if (d) {
      const v = (d[1] != null ? d[1] : d[2] != null ? d[2] : d[3]).trim();
      if (inShell) shell++; else out.push({ v, line: src.slice(0, m.index).split('\n').length });
    }
    if (!VOID.test(tag) && !/\/\s*$/.test(attrs)) stack.push(el);
  }
  return { els: out, shell };
}

/* ─── Chạy ─────────────────────────────────────────────────────────────────────────────────── */
const items = []; const unchecked = []; let soMàn = 0, soDong = 0, soShell = 0;
const rel = (f) => path.relative(BASE, f) || path.basename(f);
for (const f of files) {
  const dir = path.dirname(f);
  const mã = (path.basename(dir).match(/^(S\d+) - /) || [])[1] || rel(f);
  const bảng = SE.forScreen(dir);
  if (bảng === undefined) { unchecked.push([mã, 'không có srs.md cạnh html-design']); continue; }
  if (!bảng || !bảng.length) { unchecked.push([mã, 'srs không có bảng phần tử']); continue; }
  soMàn++; soDong += bảng.length;
  const { els, shell } = dataEls(fs.readFileSync(f, 'utf8'));
  soShell += shell;
  const R = rel(f);
  if (!els.length) {
    items.push({ rule: 'EL-NONE', lv: '❌', file: R, where: `${mã} (${bảng.length} dòng)`, msg: 'màn có bảng phần tử mà html-design không có data-el nào',
      fix: 'gắn `data-el="<#>"` lên khối ứng với từng dòng bảng phần tử srs (khối lặp = một data-el bao ngoài)' });
    continue;
  }
  const có = new Set(els.map((e) => e.v));
  const sốBảng = new Set(bảng.map((r) => String(r.n)));
  for (const r of bảng) if (!có.has(String(r.n)))
    items.push({ rule: 'EL-MISS', lv: '❌', file: R, where: `${mã} #${r.n} ${r.ten}`, msg: 'dòng trong bảng phần tử srs không có khối data-el trên html-design',
      fix: 'gắn data-el đúng số lên khối đó; phần tử đã bỏ thì sửa bảng srs (CR nếu đã chốt)' });
  for (const e of els) if (!sốBảng.has(e.v))
    items.push({ rule: 'EL-UNKNOWN', lv: '❌', file: R, line: e.line, where: `${mã} data-el="${e.v}"`, msg: 'data-el không có dòng nào trong bảng phần tử srs',
      fix: 'sửa về số # đúng của bảng; khối mới thật thì thêm dòng vào bảng srs trước' });
}
RC.ghi('check-el', items.map((i) => i.rule));
const groups = plist.group(items, { step: 0 });
const errorGroups = groups.filter((g) => g.lv === '❌').length;
const errors = items.filter((i) => i.lv === '❌').length, warns = items.length - errors;

const checked = [`${files.length} file html-design`, `${soMàn} màn có bảng phần tử (${soDong} dòng) so data-el`];
const unchk = unchecked.length ? [[unchecked.map(([m]) => m).join(', '), [...new Set(unchecked.map(([, w]) => w))].join(' / ')]] : [];
if (soShell) unchk.push([`${soShell} data-el trong thanh trạng thái demo`, 'statebar không có trong sản phẩm']);
unchk.push(['vị trí/thứ tự khối, Control type ↔ thẻ HTML', 'máy chỉ so bộ số']);

if (JSON_MODE) {
  console.log(JSON.stringify({ target: T, files: files.map(rel), errors, warns, errorGroups, groups, unchecked: unchecked.map(([m, why]) => ({ màn: m, vì: why })) }, null, 2));
} else {
  if (!files.length) console.log(`Không thấy html-design.html nào trong ${T}.`);
  else console.log(`check-el ${path.relative(process.cwd(), T) || '.'}: ${files.length} file · ${soMàn} màn có bảng phần tử`);
  console.log(plist.render(items, { step: 0, checked, unchecked: unchk, oan: 'ba-html-design/check-el' }));
}
process.exit(Math.min(errorGroups, 255));
