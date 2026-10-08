#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ trước process.exit (lint 43)
/*
 * ba-start/scripts/ledger.js — sổ "vào cửa" của một dự án: `.claude/ba-start.json`. Zero-dependency.
 * Vừa là module (`require`) vừa là CLI.
 *
 *   node ledger.js get  [--root <dự án>=cwd]
 *   node ledger.js set  <khoá>=<giá trị> … [--root …]     # loại, hồSơ — ghi đè được
 *   node ledger.js mark <khoá> [--root …]                  # mốc thời gian *At — ghi MỘT lần, lần sau giữ nguyên
 *
 * Vì sao có sổ (M7, docs/decisions/32): tiêu chí "người lạ từ cài tới portal đầu tiên ≤ 15 phút" cần mốc đo được. Cài
 * (`installedAt`) đã có trong `.claude/ba-toolkit.json`; sổ này thêm `batĐầu` (lần đầu chạy ba-start), `demoPortalAt`
 * (portal demo dựng xong), `firstPortalAt` (portal của docs/ thật — ba-portal/build.js đóng) và lựa chọn `loại`/`hồSơ`
 * để ba-screens dùng làm mặc định. report.js đọc sổ để tính số phút.
 *
 * gioiHan: mốc là giờ máy người dùng (đổi giờ máy là đổi số); "portal đầu tiên" chỉ tính lần dựng bằng build.js của
 * toolkit — mở portal dựng sẵn không tính; sổ nằm trong .claude/ nên xoá đi là mất mốc (không phải cơ chế chống gian).
 */
const fs = require('fs');
const path = require('path');

const TÊN = path.join('.claude', 'ba-start.json');
const KHOÁ_GHI = ['loại', 'hồSơ'];
const MỐC = ['batĐầu', 'demoPortalAt', 'firstPortalAt'];

function fileSổ(root) { return path.join(path.resolve(root), TÊN); }
function đọc(root) {
  try { const j = JSON.parse(fs.readFileSync(fileSổ(root), 'utf8')); return j && typeof j === 'object' ? j : {}; } catch { return {}; }
}
function ghi(root, j) {
  const f = fileSổ(root);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify({ schema: 1, ...j }, null, 2) + '\n', 'utf8');
  return j;
}
/** Đóng mốc nếu chưa có. Trả { mới: bool, lúc }. */
function mark(root, khoá, lúc = new Date().toISOString()) {
  if (!MỐC.includes(khoá)) throw new Error(`mốc lạ: ${khoá} (có: ${MỐC.join(', ')})`);
  const j = đọc(root);
  if (j[khoá]) return { mới: false, lúc: j[khoá] };
  if (!j.batĐầu && khoá !== 'batĐầu') j.batĐầu = lúc;
  j[khoá] = lúc; ghi(root, j);
  return { mới: true, lúc };
}
function set(root, obj) {
  const j = đọc(root);
  for (const [k, v] of Object.entries(obj)) {
    if (!KHOÁ_GHI.includes(k)) throw new Error(`khoá lạ: ${k} (ghi được: ${KHOÁ_GHI.join(', ')}; mốc dùng mark)`);
    j[k] = v;
  }
  if (!j.batĐầu) j.batĐầu = new Date().toISOString();
  return ghi(root, j);
}
/** Có sổ hay không — build.js chỉ đóng firstPortalAt khi dự án đã đi qua ba-start (không đẻ sổ ở dự án cũ). */
function có(root) { return fs.existsSync(fileSổ(root)); }

module.exports = { đọc, mark, set, có, fileSổ, MỐC, KHOÁ_GHI };

if (require.main === module) {
  const a = process.argv.slice(2);
  const i = a.indexOf('--root'); const root = i >= 0 ? a[i + 1] : process.cwd();
  // Không có --root thì i = -1 → `k !== i + 1` lọc mất đối số đầu (chạy thử thật 08/10: `ledger.js set loại=…` exit 2)
  const rest = i < 0 ? a : a.filter((x, k) => k !== i && k !== i + 1);
  const [lệnh, ...đs] = rest;
  try {
    if (lệnh === 'get') console.log(JSON.stringify(đọc(root), null, 2));
    else if (lệnh === 'mark' && đs[0]) { const r = mark(root, đs[0]); console.log(r.mới ? `Đã ghi mốc ${đs[0]}: ${r.lúc}` : `Mốc ${đs[0]} đã có từ ${r.lúc} — giữ nguyên`); }
    else if (lệnh === 'set' && đs.length) { set(root, Object.fromEntries(đs.map((x) => { const e = x.indexOf('='); return [x.slice(0, e), x.slice(e + 1)]; }))); console.log('Đã ghi ' + đs.join(' · ')); }
    else { console.error(`Không hiểu lệnh "${a.join(' ')}". Cách gọi: ledger.js get · set loại=<…> hồSơ=<lite|mini|full> · mark <${MỐC.join('|')}> [--root <thư mục dự án>]`); process.exit(2); }
  } catch (e) { console.error('Lỗi: ' + e.message); process.exit(2); }
}
