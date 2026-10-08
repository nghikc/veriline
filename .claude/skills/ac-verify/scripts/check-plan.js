#!/usr/bin/env node
/*
 * ac-verify/check-plan.js — soát HÌNH của plan.md trước khi build/verify. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ac-verify/scripts/check-plan.js <docs> [--screen <Mã>] [--plain|--json]
 *
 * Đếm, không phán. Exit = số plan có lỗi. Mỗi task phải có:
 *   - `**Trace test:**` với ≥1 mã `TC-S..`      (task không trace TC = không có gì để chứng minh)
 *   - `**Proof:**` là một lệnh trong backtick, không phải placeholder `<…>`   (exit code là bằng chứng)
 *   - `**Definition of Done:**`
 *   - `**Phụ thuộc:**` trỏ tới task tồn tại; đồ thị KHÔNG VÒNG. Không cấm "Task 2 phụ thuộc Task 3":
 *     thứ tự thực thi do plan quyết (S02 mẫu đã vậy), số task chỉ là nhãn.
 * Cảnh báo (không tính lỗi): > 12 task một màn — mùi chia nhỏ (spec-driven: granularity ≠ quality).
 *
 * Vì sao có: tlc-implement/spec-lean của tech-leads-club đặt "no proof, no check" làm luật số 1 và đưa
 * validator máy chạy TRƯỚC người duyệt. Plan không có Proof thì ac-verifier phải tự nghĩ lệnh — tức là
 * tự đặt đề rồi tự chấm. Chạy im trên example/docs (6 plan) là điều kiện tồn tại của checker.
 *
 * gioiHan: không kiểm lệnh Proof có chạy được (đó là việc của ac-verifier, trên repo code thật); không
 * kiểm mã TC có trong test.md (ba-trace/scan.js đã làm).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const DOCS = path.resolve(argv.find((a) => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--screen') || 'docs');
const SCREEN = argv.includes('--screen') ? argv[argv.indexOf('--screen') + 1] : null;
const JSON_MODE = argv.includes('--json');
if (!fs.existsSync(DOCS)) { console.error(`Không thấy ${DOCS}`); process.exit(2); }

const plans = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/^(Ho-so|removed|node_modules)$/.test(e.name)) walk(p); }
    else if (e.name === 'plan.md') plans.push(p);
  }
})(DOCS);

const kết = [];
for (const file of plans) {
  const rel = path.relative(DOCS, file);
  const mã = (rel.match(/\b(S\d+)\b/) || [])[1] || '?';
  if (SCREEN && mã !== SCREEN) continue;
  const txt = fs.readFileSync(file, 'utf8');
  const parts = txt.split(/^(?=## Task \d+)/m).filter((s) => /^## Task \d+/.test(s));
  const tasks = parts.map((s) => {
    const n = +s.match(/^## Task (\d+)/)[1];
    const field = (k) => (s.match(new RegExp(`^\\*\\*${k}:\\*\\*\\s*(.*)$`, 'm')) || [])[1];
    const trace = (field('Trace test') || '').match(/TC-S\d+-\d+/g) || [];
    const proof = field('Proof') || '';
    const proofCmd = (proof.match(/`([^`]+)`/) || [])[1] || '';
    // "Phụ thuộc: không — chặn Task 4 và Task 5" (S05 mẫu) nói chiều NGƯỢC; chỉ đọc phần trước dấu " — "/"(",
    // và "không" ở đầu = không phụ thuộc gì.
    const depTxt = (field('Phụ thuộc') || '').split(/\s+[—–]\s+|\(/)[0];
    const deps = /^\s*không/i.test(depTxt) ? [] : (depTxt.match(/Task\s+(\d+)/g) || []);
    return { n, trace, proof, proofCmd, deps: deps.map((d) => +d.match(/\d+/)[0]), dod: field('Definition of Done') };
  });
  const lỗi = [], cảnhBáo = [];
  if (!tasks.length) lỗi.push('không có `## Task N` nào');
  const ids = new Set(tasks.map((t) => t.n));
  for (const t of tasks) {
    if (!t.trace.length) lỗi.push(`Task ${t.n}: không có Trace test (mã TC-S..)`);
    if (!t.proofCmd) lỗi.push(`Task ${t.n}: không có Proof (lệnh trong backtick)`);
    else if (/<[^>]+>/.test(t.proofCmd)) lỗi.push(`Task ${t.n}: Proof còn placeholder — \`${t.proofCmd}\``);
    if (!t.dod) lỗi.push(`Task ${t.n}: không có Definition of Done`);
    for (const d of t.deps) if (!ids.has(d)) lỗi.push(`Task ${t.n}: phụ thuộc Task ${d} không tồn tại`);
    if (t.deps.includes(t.n)) lỗi.push(`Task ${t.n}: tự phụ thuộc chính nó`);
  }
  // vòng phụ thuộc — DFS ba màu
  const màu = {}; const cạnh = Object.fromEntries(tasks.map((t) => [t.n, t.deps.filter((d) => ids.has(d))]));
  const thăm = (u, stack) => {
    if (màu[u] === 1) { lỗi.push(`vòng phụ thuộc: ${[...stack, u].map((x) => 'Task ' + x).join(' → ')}`); return; }
    if (màu[u] === 2) return;
    màu[u] = 1; for (const v of cạnh[u]) thăm(v, [...stack, u]); màu[u] = 2;
  };
  for (const t of tasks) if (!màu[t.n]) thăm(t.n, []);
  if (tasks.length > 12) cảnhBáo.push(`${tasks.length} task một màn — mùi chia nhỏ; cân nhắc gộp theo slice quan sát được`);
  // LS-02 (dogfood 15/09/2026): plan S06 mẫu 8 task không khai phụ thuộc nào → batch-plan xếp cả màn vào một tầng,
  // không chia lô được. >4 task mà 0 dòng phụ thuộc gần như chắc là chưa khai, không phải thật sự độc lập.
  if (tasks.length > 4 && tasks.every((t) => !t.deps.length)) cảnhBáo.push(`${tasks.length} task mà không task nào khai Phụ thuộc — batch-plan sẽ coi cả màn là một tầng; khai \`**Phụ thuộc:** Task N\` cho task dùng kết quả task khác`);
  kết.push({ màn: mã, file: rel, tasks: tasks.length, lỗi, cảnhBáo });
}

const hỏng = kết.filter((k) => k.lỗi.length).length;
if (JSON_MODE) console.log(JSON.stringify({ plans: kết.length, hỏng, kết }, null, 2));
else {
  console.log(`check-plan: ${kết.length} plan${SCREEN ? ` (màn ${SCREEN})` : ''} · ${kết.reduce((n, k) => n + k.tasks, 0)} task · ${hỏng} plan có lỗi`);
  for (const k of kết) {
    if (!k.lỗi.length && !k.cảnhBáo.length) continue;
    console.log(`  ${k.màn} — ${k.file}`);
    for (const l of k.lỗi) console.log(`    ❌ ${l}`);
    for (const w of k.cảnhBáo) console.log(`    ⚠️  ${w}`);
  }
  if (!hỏng) console.log('  ✓ mọi task có Trace test + Proof + DoD, phụ thuộc không vòng');
}
process.exit(hỏng);
