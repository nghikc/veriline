#!/usr/bin/env node
/*
 * ba-threat-model/check-threat.js — CỔNG HÌNH cho `docs/Ho-so/00-threat-model.md`. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ba-threat-model/scripts/check-threat.js <docs> [--plain|--json]
 *   node .claude/skills/ba-threat-model/scripts/check-threat.js <đường/dẫn/00-threat-model.md> --docs <docs>
 *
 * Mô hình đe doạ hợp lệ khi (theo assets/template.md):
 *   1. header có `Ngày:`; không còn placeholder `<…>`/TODO ngoài backtick
 *   2. §1 Ranh giới: bảng có ≥1 dòng `B<n>` + một sơ đồ Mermaid `flowchart` có ≥1 `subgraph` (mỗi vùng tin cậy một subgraph)
 *   3. §2 Tài sản: bảng có ≥1 dòng `A<n>`      ·   §3 Kẻ tấn công: bảng có ≥1 vai
 *   4. §4 mỗi `TM-..` (không trùng mã): Ranh giới trỏ `B<n>` CÓ trong §1 · Tài sản trỏ `A<n>` CÓ trong §2 · STRIDE ∈ {S,T,R,I,D,E}
 *      (một hoặc nhiều chữ) · Đường lạm dụng có `→` (ai → làm gì → hậu quả, không phải một danh từ) · Mức ∈ {Cao, Vừa, Thấp}
 *      · Biện pháp không rỗng và mọi mã `NFR/BRule/ADR/WI/OQ/PD/CR` trong đó ĐỊNH NGHĨA THẬT trong docs (scan-threat.gomMã)
 *      · Trạng thái: `Giảm nhẹ` → biện pháp trace ≥1 `NFR`/`BRule`/`ADR` (kiểm soát ĐÃ CHỐT, không phải việc sẽ làm)
 *                   `Mở`       → biện pháp trace ≥1 `WI`/`OQ`/`PD`/`CR` (nợ có sổ, không phải nợ mồm) VÀ mã đó có mặt ở §5
 *                   `Chấp nhận` → có Ai (chữ ngoài ngày) + ngày `YYYY-MM-DD`
 *   5. mọi `B<n>` ở §1 được ≥1 TM nhắc tới (ranh giới không đe doạ nào = hoặc thừa ranh giới, hoặc sót đe doạ — người quyết)
 *   6. §6 checklist có ≥1 dòng (bảng hoặc `- [ ]`)
 * Cảnh báo (không tính lỗi): tài sản `A<n>` không TM nào nhắc.
 * Exit = số lỗi. Chạy im với bản viết đúng template; không có file → exit 2 (chưa chạy skill, không phải mô hình hỏng).
 *
 * Vì sao có: security-threat-model (openai/skills) kết thúc bằng "quality check": mọi ranh giới có mặt trong đe doạ,
 * giả định rõ, mitigation gắn vị trí cụ thể. Ở BA kit mọi cổng đều là script + ca đối kháng; một mô hình đe doạ mà
 * "biện pháp" trỏ `NFR-99` không tồn tại hay `Chấp nhận` không ai ký là thứ gate nhìn qua tưởng đã xong.
 *
 * gioiHan: soát HÌNH và TRACE, không phán đe doạ có thật hay mức có đúng — đó là việc người đọc/`ba-review`. Không
 * biết `B1` có đúng là ranh giới thật hay không, chỉ biết §4 có trỏ tới nó. Sơ đồ chỉ kiểm có `flowchart` + `subgraph`,
 * không render (CI render portal mới bắt lỗi cú pháp Mermaid).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const docpath = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));
const scan = require(path.join(__dirname, 'scan-threat.js'));

const ô = (l) => l.replace(/^\s*\||\|\s*$/g, '').split('|').map((c) => c.trim());
const bỏBacktick = (s) => s.replace(/`[^`]*`/g, '');
const rỗng = (s) => !(s || '').replace(/[—\-\s*]/g, '');
const MỨC = new Set(['Cao', 'Vừa', 'Thấp']);
const STRIDE_TÊN = { spoofing: 'S', tampering: 'T', repudiation: 'R', 'information disclosure': 'I', 'denial of service': 'D', 'elevation of privilege': 'E' };

/** Cắt file theo `## ` — trả [{tiêuĐề, thân}] */
function mục(txt) {
  const ra = []; let hiện = { tiêuĐề: '(đầu file)', thân: [] };
  for (const l of txt.split('\n')) {
    const h = l.match(/^##\s+(.+)$/);
    if (h) { ra.push(hiện); hiện = { tiêuĐề: h[1].trim(), thân: [] }; continue; }
    hiện.thân.push(l);
  }
  ra.push(hiện);
  return ra.map((m) => ({ ...m, thân: m.thân.join('\n') }));
}
const tìmMục = (ms, re) => ms.find((m) => re.test(m.tiêuĐề));

/** Bảng đầu tiên trong đoạn có header khớp `cột` → { header, rows } */
function bảng(txt, cột) {
  let header = null; const rows = [];
  for (const l of txt.split('\n')) {
    if (!l.trim().startsWith('|')) { if (header && rows.length) break; continue; }
    const c = ô(l);
    if (!header) { if (c.findIndex((x) => cột.test(x)) >= 0) header = c; continue; }
    if (/^:?-+:?$/.test(c[0])) continue;
    rows.push(c);
  }
  return header ? { header, rows } : null;
}
const kýHiệu = (rows, re) => new Set(rows.map((r) => (r[0] || '').replace(/[`*]/g, '')).filter((x) => re.test(x)));

function kiểm(file, docs) {
  const lỗi = []; const cảnhBáo = [];
  const txt = fs.readFileSync(file, 'utf8');
  if (!/^>?\s*(?:.*·\s*)?Ngày:\s*`?\d{4}-\d{2}-\d{2}/m.test(txt)) lỗi.push('header thiếu `Ngày: YYYY-MM-DD`');
  if (/<[^>\n]+>|\bTODO\b/.test(bỏBacktick(txt))) lỗi.push('còn placeholder `<…>`/TODO ngoài backtick');

  const ms = mục(txt);
  // §1
  const m1 = tìmMục(ms, /ranh giới/i); const B = new Set();
  if (!m1) lỗi.push('thiếu mục "Ranh giới tin cậy" (§1)');
  else {
    const b = bảng(m1.thân, /^Ký hiệu$/i);
    if (!b) lỗi.push('§1 không có bảng ranh giới (cột đầu `Ký hiệu`)');
    else { for (const k of kýHiệu(b.rows, /^B\d+$/)) B.add(k); if (!B.size) lỗi.push('§1 bảng ranh giới không có dòng `B<n>` nào'); }
    const mer = (m1.thân.match(/```mermaid\n([\s\S]*?)```/) || [])[1];
    if (!mer) lỗi.push('§1 thiếu sơ đồ Mermaid (flowchart, mỗi vùng tin cậy một subgraph)');
    else if (!/^\s*(flowchart|graph)\b/m.test(mer)) lỗi.push('§1 sơ đồ không phải `flowchart` — ranh giới tin cậy vẽ bằng flowchart + subgraph');
    else if (!/^\s*subgraph\b/m.test(mer)) lỗi.push('§1 sơ đồ flowchart không có `subgraph` nào — mỗi vùng tin cậy phải là một subgraph');
  }
  // §2
  const m2 = tìmMục(ms, /tài sản/i); const A = new Set();
  if (!m2) lỗi.push('thiếu mục "Tài sản" (§2)');
  else {
    const b = bảng(m2.thân, /^Ký hiệu$/i);
    if (!b) lỗi.push('§2 không có bảng tài sản (cột đầu `Ký hiệu`)');
    else { for (const k of kýHiệu(b.rows, /^A\d+$/)) A.add(k); if (!A.size) lỗi.push('§2 bảng tài sản không có dòng `A<n>` nào'); }
  }
  // §3
  const m3 = tìmMục(ms, /kẻ tấn công|tác nhân đe do/i);
  if (!m3) lỗi.push('thiếu mục "Kẻ tấn công theo vai" (§3)');
  else { const b = bảng(m3.thân, /^Vai$/i); if (!b || !b.rows.filter((r) => !rỗng(r[0])).length) lỗi.push('§3 không có bảng kẻ tấn công (cột đầu `Vai`) hoặc bảng rỗng'); }
  // §4
  const m4 = tìmMục(ms, /đe do[ạa]/i);
  const tm = m4 ? scan.đọcTM(m4.thân) : [];
  if (!m4) lỗi.push('thiếu mục "Bảng đe doạ" (§4)');
  else if (!tm.length) lỗi.push('§4 không có dòng `TM-..` nào (bảng cần cột `Mã` và `STRIDE`)');
  const mãCó = scan.gomMã(docs);
  const đãThấy = new Set(); const bDùng = new Set(); const aDùng = new Set(); const mởCầnSổ = [];
  const m5 = tìmMục(ms, /biện pháp|nợ/i);
  const theoTT = { 'Mở': 0, 'Giảm nhẹ': 0, 'Chấp nhận': 0 };
  for (const t of tm) {
    if (đãThấy.has(t.id)) lỗi.push(`${t.id}: mã trùng`); đãThấy.add(t.id);
    const bs = t.ranhGiới.match(/\bB\d+\b/g) || []; const as = t.tàiSản.match(/\bA\d+\b/g) || [];
    if (!bs.length) lỗi.push(`${t.id}: cột Ranh giới không trỏ \`B<n>\` nào của §1`);
    for (const b of bs) { if (!B.has(b)) lỗi.push(`${t.id}: ranh giới ${b} không có trong §1`); bDùng.add(b); }
    if (!as.length) lỗi.push(`${t.id}: cột Tài sản không trỏ \`A<n>\` nào của §2`);
    for (const a of as) { if (!A.has(a)) lỗi.push(`${t.id}: tài sản ${a} không có trong §2`); aDùng.add(a); }
    let s = t.stride.replace(/[`*]/g, '').trim().toLowerCase();
    for (const [tên, c] of Object.entries(STRIDE_TÊN)) s = s.split(tên).join(c); // chấp nhận tên đầy đủ tiếng Anh
    const chữ = s.split(/[\s,/+·]+/).filter(Boolean).map((x) => x.toUpperCase());
    if (!chữ.length || chữ.some((x) => !/^[STRIDE]$/.test(x))) lỗi.push(`${t.id}: STRIDE "${t.stride}" không thuộc {S, T, R, I, D, E}`);
    if (rỗng(t.đường)) lỗi.push(`${t.id}: cột Đường lạm dụng rỗng`);
    else if (!/→|->/.test(t.đường)) lỗi.push(`${t.id}: Đường lạm dụng không có \`→\` — viết dạng "ai → làm gì → hậu quả", không phải tên loại lỗ hổng`);
    const mức = t.mức.replace(/[`*]/g, '').trim();
    if (!MỨC.has(mức)) lỗi.push(`${t.id}: Mức "${t.mức}" không thuộc {Cao, Vừa, Thấp}`);
    if (rỗng(t.biệnPháp)) lỗi.push(`${t.id}: không có biện pháp — ít nhất phải mở WI/OQ/PD/CR và ghi Mở`);
    for (const id of t.trace) if (!mãCó.has(id)) lỗi.push(`${t.id}: biện pháp trace tới \`${id}\` không định nghĩa ở đâu trong docs`);
    const tt = (t.trạngThái.match(/^(Mở|Giảm nhẹ|Chấp nhận)/) || [])[1];
    if (!tt) { lỗi.push(`${t.id}: Trạng thái "${t.trạngThái}" không thuộc {Mở, Giảm nhẹ, Chấp nhận — <Ai> · <ngày>}`); continue; }
    theoTT[tt]++;
    const cóChốt = t.trace.some((id) => /^(NFR|BRule|ADR)-/.test(id)); const cóSổ = t.trace.some((id) => /^(WI|OQ|PD|CR)-/.test(id));
    if (tt === 'Giảm nhẹ' && !cóChốt) lỗi.push(`${t.id}: Giảm nhẹ mà biện pháp không trace NFR/BRule/ADR nào — kiểm soát chưa chốt thì là Mở`);
    if (tt === 'Mở') { if (!cóSổ) lỗi.push(`${t.id}: Mở mà chưa mở WI/OQ/PD/CR — nợ phải có sổ (hồ sơ lite/mini không có WI → PD trong 00-decisions.md)`); else mởCầnSổ.push(t.id); }
    if (tt === 'Chấp nhận') {
      const phần = t.trạngThái.replace(/^Chấp nhận/, '');
      const ngày = /\d{4}-\d{2}-\d{2}/.test(phần); const ai = /[A-Za-zÀ-ỹ]{2,}/.test(phần.replace(/\d{4}-\d{2}-\d{2}/, ''));
      if (!ngày || !ai) lỗi.push(`${t.id}: Chấp nhận phải ghi Ai + ngày (\`Chấp nhận — SH-04 · 2026-09-15\`) — thiếu ${!ai ? 'Ai' : ''}${!ai && !ngày ? ' và ' : ''}${!ngày ? 'ngày' : ''}`);
    }
  }
  for (const b of B) if (!bDùng.has(b)) lỗi.push(`${b}: ranh giới ở §1 không có đe doạ nào ở §4 — bỏ ranh giới hoặc ghi TM (kể cả Thấp/Chấp nhận)`);
  for (const a of A) if (!aDùng.has(a)) cảnhBáo.push(`${a}: tài sản ở §2 không TM nào nhắc tới`);
  // §5
  if (!m5) lỗi.push('thiếu mục "Biện pháp & nợ" (§5)');
  else for (const id of mởCầnSổ) if (!m5.thân.includes(id)) lỗi.push(`${id}: trạng thái Mở nhưng không có trong §5 "Còn nợ"`);
  // §6
  const m6 = tìmMục(ms, /checklist/i);
  if (!m6) lỗi.push('thiếu mục "Checklist bảo mật cho review code" (§6)');
  else { const b = bảng(m6.thân, /^Mục$/i); const tick = (m6.thân.match(/^\s*-\s*\[[ x]\]/gm) || []).length; if (!(b && b.rows.length) && !tick) lỗi.push('§6 checklist rỗng — cần ≥1 dòng (bảng cột `Mục` hoặc `- [ ]`)'); }

  return { file, lỗi, cảnhBáo, sốTM: tm.length, sốB: B.size, sốA: A.size, theoTrạngThái: theoTT, mãCó: mãCó.size };
}

function tìmDocs(file, override) {
  if (override) return path.resolve(override);
  let d = path.dirname(path.resolve(file));
  for (let i = 0; i < 3; i++) { if (fs.existsSync(path.join(d, '00-tracking.md')) || fs.existsSync(path.join(d, '01-requirements.md'))) return d; d = path.dirname(d); }
  return path.resolve(path.dirname(file), '..');
}

module.exports = { kiểm, tìmDocs, mục, bảng };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const opt = (n) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
  const arg = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--docs') || 'docs';
  let file, docs;
  if (fs.existsSync(arg) && fs.statSync(arg).isDirectory()) { docs = path.resolve(arg); file = docpath.resolveDoc(docs, '00-threat-model.md'); }
  else { file = fs.existsSync(arg) ? path.resolve(arg) : null; docs = tìmDocs(arg, opt('--docs')); }
  if (!file) { console.log(`check-threat: chưa có 00-threat-model.md dưới ${docs} (Ho-so/ hoặc gốc) — chạy ba-threat-model trước`); process.exit(2); }
  const kq = kiểm(file, docs);
  if (argv.includes('--json')) { console.log(JSON.stringify({ docs, ...kq }, null, 2)); process.exit(kq.lỗi.length); }
  const tt = kq.theoTrạngThái;
  console.log(`check-threat ${path.relative(docs, file)}: ${kq.sốTM} TM · ${kq.sốB} ranh giới · ${kq.sốA} tài sản · Mở ${tt['Mở']} / Giảm nhẹ ${tt['Giảm nhẹ']} / Chấp nhận ${tt['Chấp nhận']} · soát trace với ${kq.mãCó} mã định nghĩa · ${kq.lỗi.length ? `KHÔNG HỢP LỆ — ${kq.lỗi.length} lỗi` : 'hợp lệ'}`);
  for (const l of kq.lỗi) console.log(`  ❌ ${l}`);
  for (const l of kq.cảnhBáo) console.log(`  ⚠️  ${l}`);
  process.exit(kq.lỗi.length);
}
