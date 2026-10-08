#!/usr/bin/env node
/*
 * ba-toolkit/check-agents.js (dời từ ac-agent — M6 đợt 2) — soát ĐỘI AGENT: `.claude/agents/*.md` ↔ canon `agents.roster` trong
 * ba-toolkit/references/conv-registry.md. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ba-toolkit/scripts/check-agents.js [--root <repo>] [--plain|--json]
 *
 * Đếm, không phán. Exit = số lỗi. lint.js check 30 gọi script này (luật: checker có sẵn thì GỌI, không viết lại).
 *
 * Vì sao có: 6 agent reviewer từng được viết tay, mỗi cái một kiểu — không canon nào nói agent nào tồn tại,
 * ai được phái nó, nó được sửa gì. Đội agent viết code (họ `ac-*`) làm bài toán thành thật: một agent
 * `verify` mà có Write là "người chấm tự sửa bài"; một agent không nói rõ "trả về đâu" thì verdict rơi
 * vào tay builder — đúng thứ tách author/verifier sinh ra để chống.
 *
 * gioiHan: chỉ đọc frontmatter + heading; không đánh giá prompt có hay không. Quyền suy từ `tools:` —
 * agent không khai `tools:` thì được coi là "mọi tool" và bị bắt nếu roster khai ro.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const ROOT = path.resolve(argv[argv.indexOf('--root') + 1] && argv.includes('--root') ? argv[argv.indexOf('--root') + 1] : process.cwd());
const JSON_MODE = argv.includes('--json');
const AGENTS = path.join(ROOT, '.claude', 'agents');
const REG = path.join(ROOT, '.claude', 'skills', 'ba-toolkit', 'references', 'conv-registry.md');

const lỗi = [], cảnhBáo = [];
const regTxt = fs.existsSync(REG) ? fs.readFileSync(REG, 'utf8') : '';
const reg = (k) => { const m = regTxt.match(new RegExp(`^${k.replace(/\./g, '\\.')} = (.+)$`, 'm')); return m ? m[1].trim().split(/\s+/) : []; };
const KINDS = new Set(reg('agents.kinds'));
const roster = {};
for (const e of reg('agents.roster')) {
  const [name, kind, perm] = e.split(':');
  if (!name || !kind || !perm) { lỗi.push(`agents.roster: mục "${e}" không đúng dạng <tên>:<loại>:<quyền>`); continue; }
  if (!KINDS.has(kind)) lỗi.push(`agents.roster: ${name} loại "${kind}" không có trong agents.kinds (${[...KINDS].join(' ')})`);
  if (!['ro', 'rw'].includes(perm)) lỗi.push(`agents.roster: ${name} quyền "${perm}" — chỉ ro | rw`);
  roster[name] = { kind, perm };
}
if (!Object.keys(roster).length) lỗi.push('registry thiếu agents.roster — đội agent không có canon');

const files = fs.existsSync(AGENTS) ? fs.readdirSync(AGENTS).filter((f) => f.endsWith('.md')) : [];
const CẤM_RO = ['Write', 'Edit', 'NotebookEdit', 'Agent'];
for (const f of files) {
  const name = f.replace(/\.md$/, '');
  const txt = fs.readFileSync(path.join(AGENTS, f), 'utf8');
  const fm = (txt.match(/^---\n([\s\S]*?)\n---/) || [, ''])[1];
  const field = (k) => (fm.match(new RegExp(`^${k}:\\s*(.+)$`, 'm')) || [])[1];
  if (!roster[name]) { lỗi.push(`${f}: có file nhưng KHÔNG có trong agents.roster — thêm dòng roster hoặc xoá agent`); continue; }
  for (const k of ['name', 'description', 'tools', 'model']) if (!field(k)) lỗi.push(`${f}: frontmatter thiếu "${k}"`);
  // model phải nằm trong agents.models (opus/sonnet); `inherit`/`fable`/khác → lỗi — người dùng 17/09/2026: mặc định opus, model ngoài danh sách phải hỏi trước
  const MODELS = reg('agents.models'); const mdl = field('model');
  if (MODELS.length && mdl && !MODELS.includes(mdl)) lỗi.push(`${f}: model "${mdl}" không thuộc agents.models (${MODELS.join('/')}) — inherit = đổi theo phiên mà không ai thấy; model khác phải hỏi người`);
  if (field('name') && field('name').trim() !== name) lỗi.push(`${f}: name "${field('name')}" ≠ tên file "${name}"`);
  const tools = (field('tools') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const { kind, perm } = roster[name];
  if (perm === 'ro') {
    if (!tools.length) lỗi.push(`${f}: roster khai ro nhưng không khai tools (= mọi tool)`);
    for (const t of tools) if (CẤM_RO.includes(t)) lỗi.push(`${f}: roster khai ro mà tools có ${t}`);
  }
  if (kind === 'review' && tools.includes('Bash')) lỗi.push(`${f}: agent review không được có Bash (chỉ đọc tài liệu)`);
  if (kind === 'verify' && !tools.includes('Bash')) lỗi.push(`${f}: agent verify phải có Bash — không chạy được proof thì chỉ là đọc code rồi đoán`);
  if (kind === 'build' && (!tools.length || tools.includes('Agent'))) lỗi.push(`${f}: agent build không được có Agent (worker không lồng agent) và phải khai tools`);
  // Hợp đồng: ai phái · trả về đâu · không lồng agent — thiếu thì verdict không biết về tay ai.
  if (!/^##+ .*(Ai phái|ai phái)/mi.test(txt)) lỗi.push(`${f}: thiếu mục "## Ai phái · trả về đâu"`);
  if (!/không\s+(được\s+)?(spawn|phái|gọi)\s+(thêm\s+)?agent/i.test(txt)) lỗi.push(`${f}: thiếu câu "không spawn agent con" (worker/verifier không được lồng)`);
  if (kind === 'verify' && !/không sửa/i.test(txt)) lỗi.push(`${f}: agent verify phải nói rõ "không sửa" gì`);
}
// agents.experimental (dạng <agent>:<skill>) miễn lỗi "thiếu file" khi skill chủ chưa cài ở đích
// (--with-experimental không bật) — agent đó chỉ vắng vì skill của nó vắng, không phải roster sai.
// Khoá chưa có trong registry → reg() trả [] → hành vi cũ (mọi agent thiếu file đều bị bắt).
const expAgents = {};
for (const e of [...reg('agents.experimental'), ...reg('agents.pro')]) {   // agents.pro (08/10/2026): agent của skill gói Pro vắng ở bản công khai
  const [name, skill] = e.split(':');
  if (name && skill) expAgents[name] = skill;
}
for (const name of Object.keys(roster)) {
  if (files.includes(name + '.md')) continue;
  const skillMẹ = expAgents[name];
  if (skillMẹ && !fs.existsSync(path.join(ROOT, '.claude', 'skills', skillMẹ))) continue;
  lỗi.push(`agents.roster khai ${name} nhưng không có .claude/agents/${name}.md`);
}

const out = { agents: files.length, roster: Object.keys(roster).length, lỗi, cảnhBáo };
if (JSON_MODE) console.log(JSON.stringify(out, null, 2));
else {
  console.log(`check-agents: ${files.length} file · ${Object.keys(roster).length} trong roster`);
  for (const l of lỗi) console.log(`  ❌ ${l}`);
  for (const w of cảnhBáo) console.log(`  ⚠️  ${w}`);
  if (!lỗi.length) console.log('  ✓ đội agent khớp roster, quyền khớp loại, hợp đồng đủ');
}
process.exit(lỗi.length);
