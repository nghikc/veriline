#!/usr/bin/env node
/*
 * ba-migration/check-migration.js — soát HÌNH của docs/Ho-so/00-migration.md (lộ trình tách/đổi codebase). Zero-dependency.
 *
 *   node .claude/skills/ba-migration/scripts/check-migration.js <docs> [--plain|--json]
 *
 * Đếm, không phán. Exit = số LỖI (cảnh báo không tính). Không có 00-migration.md → im, exit 0.
 * Mỗi bước `### MG-NN — Tiêu đề` phải có đủ:
 *   - `**Mục tiêu:**`                 một câu, không placeholder `<…>`
 *   - `**Slice quan sát được:**`      thứ người dùng/vận hành THẤY khi bước xong (một route, một job, một màn…)
 *   - `**Tiêu chí xong:**`            ĐO ĐƯỢC — có số (`0 lỗi`, `100% traffic`, `≤ 300 ms`) hoặc lệnh trong backtick
 *   - `**Rủi ro:**` + `**Quay lui:**` không placeholder — bước không quay lui được phải NÓI là không quay lui được
 *   - `**Trace:**`                    ≥1 mã `F..` / `NFR-..` / `ADR-..`
 *   - `**Phụ thuộc:**`                `không` hoặc `MG-..` tồn tại; đồ thị KHÔNG VÒNG
 * §"Cửa một chiều": mỗi dòng bảng phải có `ADR-NN`; nếu dự án có 10-architecture.md thì ADR đó phải tồn tại ở đấy
 * (`### ADR-NN`) — ADR ma là lỗi; chưa có 10-architecture.md → cảnh báo (route ba-architecture), không lỗi.
 * Mã MG trùng → lỗi.
 *
 * Vì sao có: lộ trình tách monolith hay chết ở hai chỗ đo được — "tiêu chí xong" là tính từ ("ổn định", "sạch") nên
 * không ai biết khi nào bước xong, và bước N chờ bước M chờ bước N. legacy-migration-planner (tech-leads-club) đòi
 * success criteria measurable + rollback cho TỪNG bước; check-plan.js đã đòi Proof cho task dev. Đây là bản cho bước
 * migration. Chạy im trên example/docs (chưa có file → im) là điều kiện tồn tại.
 *
 * gioiHan: không kiểm tiêu chí có ĐÚNG (chỉ có số/lệnh hay không); không kiểm slice có thật sự quan sát được (chữ);
 * không kiểm mã F../NFR-.. có trong 02/01 (ba-trace/scan.js làm); ADR chỉ đối chiếu với 10-architecture.md.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { resolveDoc } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));

const argv = process.argv.slice(2);
const JSON_MODE = argv.includes('--json');
const DOCS = path.resolve(argv.find((a) => !a.startsWith('--')) || 'docs');
if (!fs.existsSync(DOCS)) { console.error(`Không thấy ${DOCS}`); process.exit(2); }

const lỗi = [], cảnhBáo = [];
const file = resolveDoc(DOCS, '00-migration.md');
const xong = (tómTắt) => {
  const kq = { file: file ? path.relative(DOCS, file) : null, lỗi, cảnhBáo, ...tómTắt };
  if (JSON_MODE) console.log(JSON.stringify(kq, null, 2));
  else {
    console.log(`check-migration: ${file ? `${kq.file} · ${kq.bước ?? 0} bước · ${kq.cửa ?? 0} cửa một chiều · ` : 'chưa có 00-migration.md · '}${lỗi.length} lỗi · ${cảnhBáo.length} cảnh báo`);
    for (const l of lỗi) console.log(`  ❌ ${l}`);
    for (const w of cảnhBáo) console.log(`  ⚠️  ${w}`);
    if (file && !lỗi.length) console.log('  ✓ mọi bước có mục tiêu · slice · tiêu chí đo được · rủi ro · quay lui · trace; phụ thuộc không vòng; cửa một chiều có ADR');
  }
  process.exit(lỗi.length);
};
if (!file) xong({});

const txt = fs.readFileSync(file, 'utf8');
const PLACEHOLDER = /<[^>`]{1,80}>/;           // `<mô tả>` còn nguyên trong template
const CÓ_SỐ_HAY_LỆNH = /\d|`[^`]+`/;

// ----- bước MG -----
const vị = []; const re = /^###\s+(MG-\d+)\s*[—–-]\s*(.+?)\s*$/gm; let m;
while ((m = re.exec(txt))) vị.push({ id: m[1], tiêuĐề: m[2], từ: m.index });
const bước = vị.map((v, i) => {
  const đến = i + 1 < vị.length ? vị[i + 1].từ : txt.length;
  let thân = txt.slice(v.từ, đến);
  const hếtMục = thân.search(/\n##\s/); if (hếtMục > 0) thân = thân.slice(0, hếtMục);
  const field = (k) => (thân.match(new RegExp(`^\\s*[-*]?\\s*\\*\\*${k}:\\*\\*\\s*(.*)$`, 'm')) || [])[1];
  return { ...v, thân, field };
});
const ids = new Set();
for (const b of bước) {
  if (ids.has(b.id)) lỗi.push(`${b.id}: mã lặp`); ids.add(b.id);
}
const cạnh = {};
for (const b of bước) {
  const f = b.field;
  const cần = (k, thêm) => {
    const v = f(k);
    if (v === undefined || !v.trim()) { lỗi.push(`${b.id}: thiếu **${k}:**`); return null; }
    if (PLACEHOLDER.test(v)) { lỗi.push(`${b.id}: **${k}:** còn placeholder — ${v.trim().slice(0, 60)}`); return null; }
    if (thêm) thêm(v);
    return v;
  };
  cần('Mục tiêu');
  cần('Slice quan sát được');
  cần('Tiêu chí xong', (v) => { if (!CÓ_SỐ_HAY_LỆNH.test(v)) lỗi.push(`${b.id}: **Tiêu chí xong:** không đo được — không có số hay lệnh trong backtick: "${v.trim().slice(0, 70)}"`); });
  cần('Rủi ro');
  cần('Quay lui');
  cần('Trace', (v) => { if (!/\b(F\d+|NFR-\d+|ADR-\d+)\b/.test(v)) lỗi.push(`${b.id}: **Trace:** không có mã F../NFR-../ADR-..`); });
  const dep = f('Phụ thuộc');
  if (dep === undefined) { lỗi.push(`${b.id}: thiếu **Phụ thuộc:** (ghi \`không\` nếu là bước đầu)`); cạnh[b.id] = []; continue; }
  const đầu = dep.split(/\s+[—–]\s+|\(/)[0];
  cạnh[b.id] = /^\s*không/i.test(đầu) ? [] : (đầu.match(/MG-\d+/g) || []);
  if (!cạnh[b.id].length && !/^\s*không/i.test(đầu)) lỗi.push(`${b.id}: **Phụ thuộc:** phải là \`không\` hoặc mã MG-.. — "${dep.trim().slice(0, 50)}"`);
  for (const d of cạnh[b.id]) { if (!ids.has(d)) lỗi.push(`${b.id}: phụ thuộc ${d} không tồn tại`); if (d === b.id) lỗi.push(`${b.id}: tự phụ thuộc chính nó`); }
}
// vòng phụ thuộc — DFS ba màu
const màu = {}; const đãBáo = new Set();
const thăm = (u, stack) => {
  if (màu[u] === 1) { const v = [...stack, u]; const key = v.slice(v.indexOf(u)).join('>'); if (!đãBáo.has(key)) { đãBáo.add(key); lỗi.push(`vòng phụ thuộc: ${v.slice(v.indexOf(u)).join(' → ')}`); } return; }
  if (màu[u] === 2) return;
  màu[u] = 1; for (const v of (cạnh[u] || []).filter((d) => ids.has(d))) thăm(v, [...stack, u]); màu[u] = 2;
};
for (const b of bước) if (!màu[b.id]) thăm(b.id, []);
if (!bước.length) cảnhBáo.push('không có bước `### MG-NN — …` nào — lộ trình trống');

// ----- cửa một chiều ↔ ADR -----
const f10 = resolveDoc(DOCS, '10-architecture.md');
const adrCó = new Set();
if (f10) for (const a of fs.readFileSync(f10, 'utf8').matchAll(/^###\s+(ADR-\d+)\b/gm)) adrCó.add(a[1]);
const mụcCửa = txt.match(/^##\s+[^\n]*[Cc]ửa một chiều[^\n]*\n([\s\S]*?)(?=^##\s|\Z(?![\s\S]))/m);
let cửa = 0;
if (mụcCửa) {
  const tấtCả = mụcCửa[1].split('\n');
  const làSep = (l) => /^\|\s*:?-+/.test(l || '');
  const dòng = tấtCả.filter((l, i) => /^\|/.test(l) && !làSep(l) && !làSep(tấtCả[i + 1])); // bỏ separator + dòng header ngay trước nó
  for (const l of dòng) {
    const ô = l.split('|').slice(1, -1).map((x) => x.trim());
    if (!ô.length || ô.every((x) => !x || x === '—')) continue;
    cửa++;
    const adr = l.match(/ADR-\d+/g) || [];
    if (!adr.length) { lỗi.push(`cửa một chiều "${ô[0].slice(0, 40)}": chưa có ADR-.. — mở ADR (ba-architecture khuôn §11) trước khi bước tương ứng chạy`); continue; }
    for (const a of adr) if (f10 && !adrCó.has(a)) lỗi.push(`cửa một chiều "${ô[0].slice(0, 40)}": ${a} không có trong ${path.relative(DOCS, f10)} (ADR ma)`);
  }
  if (cửa && !f10) cảnhBáo.push(`chưa có 10-architecture.md — không đối chiếu được ${cửa} ADR của cửa một chiều; chạy ba-architecture để chốt`);
} else cảnhBáo.push('không có mục "## … Cửa một chiều" — nếu lộ trình không có quyết định không đảo được, ghi rõ "không có"');
// ADR nhắc trong Trace của bước cũng phải có thật
if (f10) for (const b of bước) for (const a of (b.field('Trace') || '').match(/ADR-\d+/g) || []) if (!adrCó.has(a)) lỗi.push(`${b.id}: Trace ${a} không có trong 10-architecture.md (ADR ma)`);

xong({ bước: bước.length, cửa, có10: !!f10 });
