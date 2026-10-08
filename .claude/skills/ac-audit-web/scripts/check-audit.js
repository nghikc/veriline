#!/usr/bin/env node
/*
 * ac-audit-web/check-audit.js — CỔNG MÁY cho một bản audit giao diện. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ac-audit-web/scripts/check-audit.js <docs/Ho-so/audit/<Mã|app>-<YYYY-MM-DD>.md> [--plain|--json]
 *
 * Bản audit (do agent ac-auditor ghi theo assets/audit-template.md) hợp lệ khi:
 *   1. header có `model:` · `ngày:` · `màn:` · `tầng:` · `đầu vào:`     (ai soát, soát cái gì, ở tầng nào — không có = không tái lập)
 *   2. bảng "Phát hiện" (cột đầu `Mã`) có đủ cột Trục · Mức · Vị trí · Tiêu chí · Vấn đề · Cách sửa · Trace; mỗi dòng:
 *        Mã `AU-nn` duy nhất · Trục ∈ {WCAG, UX, CWV} · Mức ∈ {🔴, 🟠, 🟡}
 *        Vị trí có `file:line` HOẶC URL http(s) + selector/chữ (URL trần không đủ — "ở trang login" không mở được)
 *        Tiêu chí: WCAG → `x.y.z` (vd 1.4.3) · CWV → LCP/INP/CLS/TBT/FCP · UX → tên guideline, không rỗng
 *        Vấn đề, Cách sửa không rỗng; Trace có gì đó (mã `R-S..`/`NFR-..`/`TC-S..`/`design-spec` hoặc `—` — cột phải CÓ)
 *   3. mục "Core Web Vitals" có bảng với đủ 3 dòng LCP · INP · CLS; mỗi dòng: Giá trị là SỐ + Nguồn có "Lighthouse"
 *      + ngày/run id, HOẶC ghi "không đo được" (kèm lý do). Số mà không nguồn = số bịa.
 *      Có phát hiện Trục CWV mà không có số đo nào → lỗi (phán CWV khi chưa đo).
 *   4. dòng `**Verdict:** ĐẠT|CHƯA ĐẠT` khớp mức: có 🔴 → CHƯA ĐẠT; không 🔴 → ĐẠT. Số 🔴/🟠/🟡 ghi cạnh verdict
 *      (nếu có) phải bằng số đếm từ bảng.
 *   5. không còn placeholder `<…>`/TODO ngoài backtick.
 * Exit = số lỗi; ≠ 0 = bản audit không hợp lệ, không được dùng làm bằng chứng cho NFR/TC.
 *
 * Vì sao có: một bản audit a11y không có tiêu chí WCAG thì không tranh luận được ("xấu" không phải lỗi); không có
 * `file:line` thì không sửa được; verdict ĐẠT khi còn 🔴 là cách nhanh nhất để "đạt WCAG" thành câu nói suông.
 * Cùng hình với review-gate.js (ac-judge) và check-eval.js (ac-eval): máy soát HÌNH, agent chịu NỘI DUNG.
 *
 * gioiHan: không mở lại HTML/URL để xác nhận phát hiện có thật; không tính lại tương phản; không biết tiêu chí
 * `1.4.3` có đúng với vấn đề mô tả không — ac-auditor chịu, scan-html.js/Lighthouse soát chéo phần cơ giới.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const ô = (l) => l.replace(/^\s*\||\|\s*$/g, '').split('|').map((c) => c.trim());
const bỏBacktick = (s) => s.replace(/`[^`]*`/g, '');
const rỗng = (s) => !(s || '').replace(/[—\-\s]/g, '');
const cóFileLine = (s) => /[\w./ \-()]+\.\w+:\d+(\s*[-–,]\s*\d+)?/.test(s);
const cóUrlSelector = (s) => /https?:\/\/\S+/.test(s) && (s.replace(/https?:\/\/\S+/, '').replace(/[`\s·]/g, '').length > 0);
const TRỤC = new Set(['WCAG', 'UX', 'CWV']); const MỨC = new Set(['🔴', '🟠', '🟡']);

/** Bảng markdown đầu tiên có header khớp `cột` → { header, rows }. */
function bảng(txt, cột) {
  let header = null; const rows = [];
  for (const l of txt.split('\n')) {
    if (!l.trim().startsWith('|')) { if (header && rows.length) break; if (header) break; continue; }
    const c = ô(l);
    if (!header) { if (c.findIndex((x) => cột.test(x)) === 0) header = c; continue; }
    if (/^:?-+:?$/.test(c[0])) continue;
    rows.push(c);
  }
  return header ? { header, rows } : null;
}
const mục = (txt, tên) => (txt.split(/^## /m).find((s) => tên.test(s)) || '');

function kiểm(file) {
  const lỗi = []; const txt = fs.readFileSync(file, 'utf8');
  const header = (k) => new RegExp(`^>?\\s*(?:.*·\\s*)?${k}:\\s*\\S`, 'mi').test(txt);
  for (const k of ['model', 'ngày', 'màn', 'tầng', 'đầu vào']) if (!header(k)) lỗi.push(`header thiếu \`${k}:\``);

  // 2. Bảng phát hiện
  const b = bảng(mục(txt, /^Phát hiện/i) || txt, /^Mã$/i);
  let đếm = { '🔴': 0, '🟠': 0, '🟡': 0 }; let cóCWV = false;
  if (!b) lỗi.push('không có bảng "Phát hiện" (cột đầu `Mã`)');
  else {
    const col = (re) => b.header.findIndex((x) => re.test(x));
    const I = { trục: col(/^Trục$/i), mức: col(/^Mức$/i), vị: col(/^Vị trí$/i), tc: col(/^Tiêu chí$/i), vđ: col(/^Vấn đề$/i), sửa: col(/^Cách sửa$/i), trace: col(/^Trace$/i) };
    for (const [k, v] of Object.entries(I)) if (v < 0) lỗi.push(`bảng "Phát hiện" thiếu cột \`${{ trục: 'Trục', mức: 'Mức', vị: 'Vị trí', tc: 'Tiêu chí', vđ: 'Vấn đề', sửa: 'Cách sửa', trace: 'Trace' }[k]}\``);
    if (!lỗi.some((l) => l.startsWith('bảng "Phát hiện" thiếu cột'))) {
      const thấy = new Set();
      for (const r of b.rows) {
        const mã = (r[0] || '').replace(/`/g, '').trim();
        if (!/^AU-\d{2,}$/.test(mã)) { lỗi.push(`"${mã}": mã phải dạng AU-nn`); continue; }
        if (thấy.has(mã)) lỗi.push(`${mã}: mã lặp`); thấy.add(mã);
        const trục = r[I.trục], mức = r[I.mức], vị = r[I.vị] || '', tc = r[I.tc] || '', vđ = r[I.vđ], sửa = r[I.sửa], trace = r[I.trace];
        if (!TRỤC.has(trục)) lỗi.push(`${mã}: trục "${trục}" không thuộc {WCAG, UX, CWV}`);
        if (!MỨC.has(mức)) lỗi.push(`${mã}: mức "${mức}" không thuộc {🔴, 🟠, 🟡}`); else đếm[mức]++;
        if (!(cóFileLine(vị) || cóUrlSelector(vị))) lỗi.push(`${mã}: vị trí "${vị.slice(0, 40)}" không có \`file:line\` hay URL + selector`);
        if (trục === 'WCAG' && !/^\d\.\d+\.\d+\b/.test(tc)) lỗi.push(`${mã}: trục WCAG mà tiêu chí "${tc.slice(0, 30)}" không phải dạng x.y.z (vd 1.4.3)`);
        if (trục === 'CWV') { cóCWV = true; if (!/\b(LCP|INP|CLS|TBT|FCP)\b/.test(tc)) lỗi.push(`${mã}: trục CWV mà tiêu chí "${tc.slice(0, 30)}" không phải LCP/INP/CLS/TBT/FCP`); }
        if (trục === 'UX' && rỗng(tc)) lỗi.push(`${mã}: trục UX mà không ghi guideline nào`);
        if (rỗng(vđ)) lỗi.push(`${mã}: cột Vấn đề rỗng`);
        if (rỗng(sửa)) lỗi.push(`${mã}: cột Cách sửa rỗng — phát hiện không có cách sửa là ý kiến`);
        if ((trace || '').trim() === '') lỗi.push(`${mã}: cột Trace trống — ghi mã R-S../NFR-../TC-S../design-spec hoặc \`—\``);
      }
    }
  }

  // 3. CWV
  const mCWV = mục(txt, /^Core Web Vitals/i);
  const bc = mCWV ? bảng(mCWV, /^Chỉ số$/i) : null;
  let cóSốĐo = false;
  if (!bc) lỗi.push('không có mục "## Core Web Vitals" với bảng cột đầu `Chỉ số`');
  else {
    const iGT = bc.header.findIndex((x) => /^Giá trị$/i.test(x)), iNg = bc.header.findIndex((x) => /^Nguồn$/i.test(x));
    if (iGT < 0 || iNg < 0) lỗi.push('bảng CWV thiếu cột `Giá trị`/`Nguồn`');
    else for (const k of ['LCP', 'INP', 'CLS']) {
      const r = bc.rows.find((x) => new RegExp(`^${k}\\b`, 'i').test((x[0] || '').replace(/`/g, '')));
      if (!r) { lỗi.push(`bảng CWV thiếu dòng ${k}`); continue; }
      const gt = r[iGT] || '', ng = r[iNg] || ''; const khôngĐo = /không đo được/i.test(gt + ' ' + ng);
      if (khôngĐo) { if (!/không đo được\s*[:(—-]?\s*\S/i.test(gt + ' ' + ng) && !/\S/.test(ng.replace(/—/g, ''))) lỗi.push(`${k}: "không đo được" mà không ghi vì sao`); continue; }
      if (!/\d/.test(gt)) { lỗi.push(`${k}: giá trị "${gt}" không phải số cũng không phải "không đo được"`); continue; }
      if (!/Lighthouse/i.test(ng) || !/\d{4}-\d{2}-\d{2}|\d+\.\d+/.test(ng)) lỗi.push(`${k}: có số (${gt}) mà nguồn "${ng.slice(0, 40)}" không ghi Lighthouse + ngày/run id — số không nguồn là số bịa`);
      else cóSốĐo = true;
    }
  }
  if (cóCWV && !cóSốĐo) lỗi.push('có phát hiện trục CWV mà bảng Core Web Vitals không có số đo nào có nguồn — không đo thì không phán CWV');

  // 4. Verdict
  const v = txt.match(/\*\*Verdict:\*\*\s*(ĐẠT|CHƯA ĐẠT)\b([^\n]*)/);
  if (!v) lỗi.push('không có dòng `**Verdict:** ĐẠT` hoặc `CHƯA ĐẠT`');
  else {
    const mong = đếm['🔴'] > 0 ? 'CHƯA ĐẠT' : 'ĐẠT';
    if (v[1] !== mong) lỗi.push(`Verdict ghi ${v[1]} nhưng bảng có ${đếm['🔴']} 🔴 → phải là ${mong}`);
    for (const m of ['🔴', '🟠', '🟡']) { const n = (v[2].match(new RegExp(`(\\d+)\\s*${m}`)) || [])[1]; if (n !== undefined && +n !== đếm[m]) lỗi.push(`Verdict ghi ${n} ${m} nhưng bảng đếm được ${đếm[m]}`); }
  }
  // 5. placeholder
  if (/<[^>\n]+>|\bTODO\b/.test(bỏBacktick(txt))) lỗi.push('còn placeholder `<…>`/TODO ngoài backtick');
  return { lỗi, đếm, soPhátHiện: b ? b.rows.length : 0, verdict: v ? v[1] : null };
}

module.exports = { kiểm };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith('--'));
  if (!file || !fs.existsSync(file)) { console.error('Dùng: check-audit.js <docs/Ho-so/audit/<Mã|app>-<ngày>.md> [--plain|--json]'); process.exit(2); }
  const kq = kiểm(file);
  if (argv.includes('--json')) { console.log(JSON.stringify({ file, ...kq }, null, 2)); process.exit(kq.lỗi.length); }
  console.log(`check-audit ${path.basename(file)}: ${kq.lỗi.length ? `KHÔNG HỢP LỆ — ${kq.lỗi.length} lỗi` : 'hợp lệ'} · ${kq.soPhátHiện} phát hiện (${kq.đếm['🔴']} 🔴 · ${kq.đếm['🟠']} 🟠 · ${kq.đếm['🟡']} 🟡) · verdict ${kq.verdict || '?'}`);
  for (const l of kq.lỗi) console.log(`  ❌ ${l}`);
  process.exit(kq.lỗi.length);
}
