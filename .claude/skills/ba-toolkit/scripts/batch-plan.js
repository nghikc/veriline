#!/usr/bin/env node
/*
 * ba-toolkit/batch-plan.js — CHIA LÔ task của một plan.md cho worker. Zero-dependency, CommonJS.
 * (Dời từ ac-team/scripts/ 08/10/2026 — dev-run (lõi) chia lô trước khi chọn một agent hay đội.)
 *
 *   node .claude/skills/ba-toolkit/scripts/batch-plan.js <docs> <Mã màn> [--budget 5] [--plain|--json]
 *
 * plan.md của toolkit không có "phase" — chỉ có `**Phụ thuộc:** Task N`. Script suy TẦNG từ đồ thị
 * phụ thuộc (tầng 0 = không phụ thuộc; tầng k = mọi phụ thuộc ở tầng < k) rồi gói tầng vào lô theo
 * thuật toán của tlc-spec-driven (sub-agents.md), đổi "phase" thành "tầng":
 *   1. Tổng task T ≤ 8 → MỘT lô (chạy inline, không cần worker) — ngưỡng cố định, không theo budget.
 *   2. Đi qua các tầng theo thứ tự, gom NGUYÊN TẦNG vào lô hiện tại; đủ ~budget task và còn tầng → đóng lô.
 *   3. Không bao giờ cắt một tầng làm đôi (task cùng tầng chia sẻ ngữ cảnh + thứ tự phụ thuộc còn đúng).
 *   4. Lô cuối lẻ (≤ 2 task) → gộp vào lô trước.
 * Kết quả ≈ ceil(T / budget) worker. Tầng > 1,5 × budget là mùi: task quá vụn hoặc phụ thuộc chưa khai.
 *
 * Vì sao có: một worker mỗi task thì vỡ ngữ cảnh chung và tốn lượt; một worker cả plan 13 task thì
 * quá tải cửa sổ. ~7 task/worker là điểm tlc đo được; script chỉ đếm — ai chạy lô nào là việc của
 * ac-team, và người dùng duyệt bảng lô trước khi spawn.
 *
 * gioiHan: chỉ đọc `Phụ thuộc`; không ước lượng token (đo theo số task). Vòng phụ thuộc → thoát 2
 * (check-plan.js bắt trước). Task đã tick hết `- [x]` được đánh dấu `xong` và không tính vào lô.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const pos = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--budget');
const DOCS = path.resolve(pos[0] || 'docs');
const SCREEN = pos[1];
// Mặc định 7 → 5 (16/09/2026): lô 8–11 task chạy 40–96 phút, hai worker treo/máy ngủ mất ~500 k token không có gì để resume;
// lô 5 ngắn hơn, mất ít hơn khi đứt, ngữ cảnh worker nhẹ hơn. Cần lô to thì truyền --budget.
const BUDGET = Number(argv[argv.indexOf('--budget') + 1]) || 5;
const INLINE_MAX = 8; // ≤ 8 task → một lô inline (luật ac-team/dev-run "plan > 8 task mới cần đội"), độc lập với ngân sách lô
const JSON_MODE = argv.includes('--json');
if (!SCREEN) { console.error('Dùng: batch-plan.js <docs> <Mã màn> [--budget 5]'); process.exit(2); }

let planFile = null;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (!e.isDirectory() || /^(Ho-so|removed)$/.test(e.name)) continue;
    const p = path.join(d, e.name);
    if (new RegExp(`^${SCREEN}\\b`).test(e.name) && fs.existsSync(path.join(p, 'plan.md'))) { planFile = path.join(p, 'plan.md'); return; }
    walk(p); if (planFile) return;
  }
})(DOCS);
if (!planFile) { console.error(`Không thấy plan.md của màn ${SCREEN} dưới ${DOCS}`); process.exit(2); }

const txt = fs.readFileSync(planFile, 'utf8');
const parts = txt.split(/^(?=## Task \d+)/m).filter((s) => /^## Task \d+/.test(s));
const tasks = parts.map((s) => {
  const n = +s.match(/^## Task (\d+)/)[1];
  const title = (s.match(/^## Task \d+:\s*(.+)$/m) || [, ''])[1].trim();
  const field = (k) => (s.match(new RegExp(`^\\*\\*${k}:\\*\\*\\s*(.*)$`, 'm')) || [])[1];
  const depTxt = (field('Phụ thuộc') || '').split(/\s+[—–]\s+|\(/)[0];
  const deps = /^\s*không/i.test(depTxt) ? [] : (depTxt.match(/Task\s+(\d+)/g) || []).map((d) => +d.match(/\d+/)[0]);
  const steps = (s.match(/^- \[[ xX]\] /gm) || []).length;
  const done = steps > 0 && (s.match(/^- \[[xX]\] /gm) || []).length === steps;
  const trace = (field('Trace test') || '').match(/TC-S\d+-\d+/g) || [];
  return { n, title, deps, done, trace, proof: ((field('Proof') || '').match(/`([^`]+)`/) || [])[1] || '' };
});
const ids = new Set(tasks.map((t) => t.n));

// tầng — Kahn; vòng → exit 2
const level = {}; let remaining = tasks.filter((t) => !t.done); let k = 0;
while (remaining.length) {
  const ready = remaining.filter((t) => t.deps.every((d) => !ids.has(d) || level[d] !== undefined || tasks.find((x) => x.n === d).done));
  if (!ready.length) { console.error(`Vòng phụ thuộc giữa: ${remaining.map((t) => 'Task ' + t.n).join(', ')} — chạy check-plan.js`); process.exit(2); }
  for (const t of ready) level[t.n] = k;
  remaining = remaining.filter((t) => level[t.n] === undefined); k++;
}
const tầng = []; for (const t of tasks) if (!t.done) (tầng[level[t.n]] = tầng[level[t.n]] || []).push(t.n);

// gói tầng vào lô
const T = tầng.reduce((n, l) => n + l.length, 0);
const batches = [];
if (T === 0) { /* mọi task đã xong */ }
else if (T <= INLINE_MAX) batches.push({ tasks: tầng.flat(), tầng: tầng.map((_, i) => i) });
else {
  let cur = { tasks: [], tầng: [] };
  tầng.forEach((l, i) => {
    cur.tasks.push(...l); cur.tầng.push(i);
    if (cur.tasks.length >= BUDGET && i < tầng.length - 1) { batches.push(cur); cur = { tasks: [], tầng: [] }; }
  });
  if (cur.tasks.length) batches.push(cur);
  if (batches.length > 1 && batches[batches.length - 1].tasks.length <= 2) {
    const tail = batches.pop(); batches[batches.length - 1].tasks.push(...tail.tasks); batches[batches.length - 1].tầng.push(...tail.tầng);
  }
}
const cảnhBáo = [];
tầng.forEach((l, i) => { if (l.length > 1.5 * BUDGET) cảnhBáo.push(`tầng ${i} có ${l.length} task (> 1,5 × ${BUDGET}) — task quá vụn hoặc phụ thuộc chưa khai`); });

const out = {
  màn: SCREEN, plan: path.relative(DOCS, planFile), budget: BUDGET,
  tasks: tasks.map((t) => ({ n: t.n, title: t.title, deps: t.deps, done: t.done, tầng: level[t.n] ?? null, trace: t.trace, proof: t.proof })),
  tầng, batches: batches.map((b, i) => ({ n: i + 1, tasks: b.tasks, tầng: b.tầng })),
  // inline = đủ nhỏ để chạy trong phiên chính; một lô duy nhất do gộp đuôi vẫn là MỘT worker nếu vượt ngân sách.
  inline: T <= INLINE_MAX, cảnhBáo,
};
if (JSON_MODE) console.log(JSON.stringify(out, null, 2));
else {
  console.log(`batch-plan ${SCREEN}: ${tasks.length} task (${tasks.filter((t) => t.done).length} đã xong) · ${tầng.length} tầng · ${batches.length} lô (ngân sách ~${BUDGET}/lô)${out.inline ? ' → chạy INLINE, không cần worker' : ''}`);
  out.batches.forEach((b) => console.log(`  Lô ${b.n} (${b.tasks.length} task, tầng ${b.tầng.join('+')}): ${b.tasks.map((n) => 'Task ' + n).join(', ')}`));
  for (const w of cảnhBáo) console.log(`  ⚠️  ${w}`);
}
