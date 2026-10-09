#!/usr/bin/env node
/*
 * ba-toolkit/oan.js — SỔ BÁO OAN CHECKER: checker sai thì BÁO, không LÁCH. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ba-toolkit/scripts/oan.js add --checker <skill/script> --code <MÃ> --where <file:dòng> --reason "…" [--shape "<hình thật ngắn>"]
 *   node .claude/skills/ba-toolkit/scripts/oan.js resolve --id OAN-3 --how sửa|bác|giữ --note "…"
 *   node .claude/skills/ba-toolkit/scripts/oan.js list [--checker <skill/script>] [--all] [--json]
 *
 * Sổ: `.claude/checker-oan.jsonl` ở GỐC DỰ ÁN (cwd) — APPEND-ONLY. Không sửa/xoá dòng: đóng một oan = thêm bản ghi
 * `{type:"resolved", id, how, note}`. Mỗi dòng `add` = `{type:"oan", id, ts, checker, code, where, reason, shape?}`.
 *   checker: `<skill>/<script không đuôi>` (vd `ba-html-design/check-design`) — cùng khoá với realrun.json, để
 *            `realrun.js` đếm oan theo checker.
 *   code   : mã luật checker in (DS-HEX, EL-SỐ, VB-CŨ…); where: `file:dòng` (dòng ≥1, được `12,40` hoặc `12-40`).
 *   reason : vì sao đây là báo SAI (≥10 ký tự) — không phải "checker phiền".
 *   shape  : hình thật ngắn gây oan (≤300 ký tự) — thành fixture hồi quy khi sửa checker (W2).
 * Exit: 0 ok · 2 tham số sai/thiếu (in lý do) · list: 0 kể cả khi có oan mở (sổ không phải cổng).
 *
 * VÌ SAO CÓ (docs/decisions/22 + 24, chạy thật dự án TTS 05/10/2026): ba lần checker oan đều lộ qua CÁCH AGENT LÁCH,
 * không qua lời báo — bỏ `#` khỏi hex ở 07 §13 để né DS-HEX, viết `&#8594;` để né cảnh báo emoji của check-wireframe,
 * chép capture.mjs ra scratchpad để đổi networkidle. Agent lách vì không có lối báo rẻ hơn lách. Sổ này là lối đó; mọi
 * checker in danh sách P (plist.js) kèm dòng cuối "Báo oan …" chỉ về đây; `scan-lach.js` bắt dấu vết khi vẫn lách.
 *
 * gioiHan: chỉ GHI và ĐẾM — không phán oan có thật không (người sửa checker phán, đóng bằng `resolve --how sửa|bác`).
 * Kiểm `where` theo dạng, không mở file xem dòng có tồn tại. Checker không bắt buộc có thật trong `.claude/skills` của
 * dự án (dự án cài thiếu skill vẫn báo được) — chỉ kiểm dạng `<skill>/<script>`. Hai phiên ghi cùng lúc có thể trùng id
 * (append không khoá); `list` vẫn đọc được, id trùng in ⚠️.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ (lint 43)
const fs = require('fs');
const path = require('path');

const SỔ_MẶC_ĐỊNH = () => path.join(process.cwd(), '.claude', 'checker-oan.jsonl');
const DẠNG_CHECKER = /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9._-]*$/;
const DẠNG_MÃ = /^[\p{Lu}0-9][\p{Lu}0-9_-]*$/u;
const DẠNG_CHỖ = /^[^\s:][^:]*:\d+(?:[,-]\d+)*$/;
const CÁCH_ĐÓNG = new Set(['sửa', 'bác', 'giữ']);

/** Đọc sổ → { oan: [...], resolved: Map id→rec, hỏng: số dòng không parse được }. Dùng chung cho realrun.js. */
function đọc(file = SỔ_MẶC_ĐỊNH()) {
  const kq = { oan: [], resolved: new Map(), hỏng: 0 };
  let t = '';
  try { t = fs.readFileSync(file, 'utf8'); } catch { return kq; }
  for (const l of t.split('\n')) {
    if (!l.trim()) continue;
    let r; try { r = JSON.parse(l); } catch { kq.hỏng++; continue; }
    if (r && r.type === 'oan') kq.oan.push(r);
    else if (r && r.type === 'resolved' && r.id) kq.resolved.set(r.id, r);
    else kq.hỏng++;
  }
  return kq;
}
/** Đếm theo checker: { '<skill/script>': { mở, đóng } }. */
function đếm(file) {
  const s = đọc(file); const ra = {};
  for (const o of s.oan) { const c = (ra[o.checker] = ra[o.checker] || { mở: 0, đóng: 0 }); if (s.resolved.has(o.id)) c.đóng++; else c.mở++; }
  return ra;
}
module.exports = { đọc, đếm, SỔ_MẶC_ĐỊNH };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const CMD = argv[0];
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
  const SỔ = path.resolve(opt('--file') || SỔ_MẶC_ĐỊNH());
  const thoát = (msg) => { console.error(`oan.js: ${msg}`); process.exit(2); };
  const ghiDòng = (rec) => { fs.mkdirSync(path.dirname(SỔ), { recursive: true }); fs.appendFileSync(SỔ, JSON.stringify(rec) + '\n'); };
  const rel = path.relative(process.cwd(), SỔ) || SỔ;

  if (CMD === 'add') {
    const r = { checker: opt('--checker'), code: opt('--code'), where: opt('--where'), reason: opt('--reason'), shape: opt('--shape') };
    const sai = [];
    if (!r.checker || !DẠNG_CHECKER.test(r.checker)) sai.push(`--checker phải dạng <skill>/<script> (vd ba-html-design/check-design), được "${r.checker || ''}"`);
    if (!r.code || !DẠNG_MÃ.test(r.code)) sai.push(`--code phải là mã luật checker in (vd DS-HEX), được "${r.code || ''}"`);
    if (!r.where || !DẠNG_CHỖ.test(r.where)) sai.push(`--where phải dạng file:dòng (vd docs/07-design-system.md:331), được "${r.where || ''}"`);
    if (!r.reason || r.reason.trim().length < 10) sai.push('--reason phải nói vì sao bộ kiểm SAI (≥10 ký tự)');
    if (r.shape && r.shape.length > 300) sai.push(`--shape tối đa 300 ký tự (được ${r.shape.length}) — dán hình ngắn nhất còn tái hiện lỗi báo sai`);
    if (sai.length) thoát('\n  ' + sai.join('\n  '));
    const s = đọc(SỔ);
    const id = `OAN-${s.oan.length + 1}`;
    const rec = { type: 'oan', id, ts: new Date().toISOString(), checker: r.checker, code: r.code, where: r.where, reason: r.reason.trim() };
    if (r.shape) rec.shape = r.shape;
    ghiDòng(rec);
    console.log(`${id} ghi vào ${rel} — ${r.checker} ${r.code} @ ${r.where}. Giữ nguyên tài liệu (đừng sửa để qua mặt bộ kiểm); nêu ${id} lúc giao.`);
    process.exit(0);
  }

  if (CMD === 'resolve') {
    const id = opt('--id'), how = opt('--how'), note = opt('--note');
    const s = đọc(SỔ);
    if (!id || !s.oan.some((o) => o.id === id)) thoát(`--id "${id || ''}" không có trong ${rel}`);
    if (s.resolved.has(id)) thoát(`${id} đã đóng (${s.resolved.get(id).how}) — sổ append-only, không đóng hai lần`);
    if (!how || !CÁCH_ĐÓNG.has(how)) thoát('--how phải là sửa (bộ kiểm đã sửa) | bác (bộ kiểm đúng) | giữ (biết báo sai, chưa sửa)');
    if (!note || note.trim().length < 5) thoát('--note phải nói đã làm gì (commit, lý do bác…)');
    ghiDòng({ type: 'resolved', id, ts: new Date().toISOString(), how, note: note.trim() });
    console.log(`${id} đóng (${how}).`);
    process.exit(0);
  }

  if (CMD === 'list') {
    const lọc = opt('--checker'); const ALL = argv.includes('--all');
    const s = đọc(SỔ);
    const ids = s.oan.map((o) => o.id); const trùng = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];
    const ds = s.oan.filter((o) => (!lọc || o.checker === lọc) && (ALL || !s.resolved.has(o.id)))
      .map((o) => (s.resolved.has(o.id) ? { ...o, resolved: s.resolved.get(o.id) } : o));
    const theoChecker = đếm(SỔ);
    if (argv.includes('--json')) {
      console.log(JSON.stringify({ file: rel, tong: s.oan.length, mo: s.oan.filter((o) => !s.resolved.has(o.id)).length, theoChecker, muc: ds, dongHong: s.hỏng, idTrung: trùng }, null, 2));
      process.exit(0);
    }
    console.log(`Sổ báo sai của bộ kiểm (oan.js): ${rel} · ${s.oan.length} báo · ${s.oan.filter((o) => !s.resolved.has(o.id)).length} mở${lọc ? ` · lọc ${lọc}` : ''}`);
    for (const [c, n] of Object.entries(theoChecker).sort()) if (!lọc || c === lọc) console.log(`  ${c}: ${n.mở} mở · ${n.đóng} đóng`);
    for (const o of ds) console.log(`${o.id} ${o.resolved ? `[${o.resolved.how}] ` : ''}${o.checker} ${o.code} @ ${o.where} — ${o.reason}${o.shape ? ` · hình: ${o.shape}` : ''}`);
    if (s.hỏng) console.log(`⚠️ ${s.hỏng} dòng không đọc được (sổ bị sửa tay?)`);
    if (trùng.length) console.log(`⚠️ id trùng: ${trùng.join(' ')} (hai phiên ghi cùng lúc)`);
    process.exit(0);
  }

  console.error('Dùng: oan.js add --checker <skill/script> --code <MÃ> --where <file:dòng> --reason "…" [--shape "…"] | resolve --id OAN-n --how sửa|bác|giữ --note "…" | list [--checker X] [--all] [--json]');
  process.exit(2);
}
