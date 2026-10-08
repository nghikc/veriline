#!/usr/bin/env node
/*
 * ba-toolkit/cost.js — SỔ CHI PHÍ AGENT dùng chung cho mọi orchestrator (ba-batch, ba-review, ac-team, ac-po…). Zero-dependency.
 *
 *   node .claude/skills/ba-toolkit/scripts/cost.js add --agent <tên> --role "<việc>" --tokens <n> [--tools n] [--ms n] [--model opus] [--viec S01] [--skill ba-batch]
 *   node .claude/skills/ba-toolkit/scripts/cost.js report [--since YYYY-MM-DD] [--json]      # gộp theo agent · skill · việc
 *   node .claude/skills/ba-toolkit/scripts/cost.js check [--max-per-viec 3000000]              # cảnh báo việc vượt trần, agent trùng vai/màn quá số lần
 *   node .claude/skills/ba-toolkit/scripts/cost.js estimate <skill> [--man N|--trang N|--frame N] [--json]   # BÁO GIÁ trước khi chạy (Cổng phương án)
 *   node .claude/skills/ba-toolkit/scripts/cost.js record <skill> --tokens N --minutes M [--units N] [--note "…"]   # ghi số THẬT sau khi chạy → .claude/ba-cost.jsonl
 *
 * estimate: ≥3 lần đo của skill trong lịch sử (ba-cost.jsonl + dòng ac-cost.jsonl có --skill) → trung vị/đơn vị × N, khoảng p20–p80;
 * ít hơn → bảng mặc định `references/cost-defaults.json` (đo thật 05–06/10/2026); không có → mượn skill gần nhất (`ganNhat`,
 * nói rõ là mượn) hoặc "không ước được". Luôn in nguồn + số mẫu — không bao giờ bịa số im lặng. record: orchestrator/agent gọi
 * ngay sau một skill nặng, số token lấy từ thông báo hoàn thành của Agent (`subagent_tokens`, `duration_ms`) — không ghi thì
 * báo giá mãi mãi là số mặc định của dự án khác.
 *
 * Sổ: `.claude/ac-cost.jsonl` ở gốc dự án (một dòng một agent; commit được). Số lấy từ thông báo hoàn thành subagent
 * (`subagent_tokens`, `tool_uses`, `duration_ms`) — orchestrator ghi ngay khi agent về; không ghi = không đo = không tiết kiệm được.
 *
 * Vì sao có: 16–17/09/2026 đo trên máy người dùng — cùng một màn, có phiên phái 16 judge (luật: 1 judge/màn/vòng), phiên
 * "một agent làm hết" 6 774 lượt tốn 3,8 tỷ token cache-read; không ai thấy vì không có sổ. `ac-po/mission.js cost` là bản
 * đầu (chỉ ac-*); tách ra đây để `ba-batch`/`ba-review` ghi cùng một sổ và `check` bắt phái thừa cho cả hai họ.
 *
 * gioiHan: chỉ đếm token của SUBAGENT; token phiên chính (cache read mỗi lượt) không có trong thông báo — dùng hook S8 đo gián tiếp
 * qua số lượt và tỷ lệ tool/lượt của transcript (MB không phải thước — 78 % byte là ảnh base64, đo 19/09/2026). `check` chỉ đếm theo (agent, việc) — không biết vòng thứ mấy; ngưỡng là con số khai báo, không phải luật.
 * `estimate` coi mỗi dòng ac-cost.jsonl có `skill` là MỘT mẫu một đơn vị (ba-batch ghi một dòng một màn — khớp; skill ghi nhiều agent
 * cho một lần chạy thì mẫu bị chẻ nhỏ → dùng `record` cho số cả lần). Không biết độ phức tạp của màn/trang — chỉ nhân theo số đơn vị.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const opt = (k, d = null) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const CMD = argv.find((a) => !a.startsWith('--') && (argv[argv.indexOf(a) - 1] || '').startsWith('--') === false && ['add', 'report', 'check', 'estimate', 'record'].includes(a));
const ROOT = path.resolve(opt('--root', process.cwd()));
const FILE = path.join(ROOT, '.claude', 'ac-cost.jsonl');
const JSON_MODE = argv.includes('--json');
const đọc = () => (fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);
const k = (n) => `${(n / 1000).toFixed(0)} k`, M = (n) => `${(n / 1e6).toFixed(2)} M`;

// ── estimate / record (W4 — báo giá trước khi chạy, 06/10/2026) ──
const BA_FILE = path.join(ROOT, '.claude', 'ba-cost.jsonl');
const đọcFile = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);
const skillArg = () => { const i = argv.indexOf(CMD); const s = argv[i + 1]; return s && !s.startsWith('--') ? s : null; };
const tk = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1000)}k`);
const phút = (m) => (m < 1 ? '<1' : String(Math.round(m)));
const pct = (xs, p) => { const a = [...xs].sort((x, y) => x - y); const i = (a.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); };
const ĐƠN_VỊ = { man: 'màn', frame: 'frame', trang: 'trang', lan: 'lần chạy' };
function mẫuLịchSử(skill) {
  const ba = đọcFile(BA_FILE).filter((r) => r.skill === skill && r.tokens > 0).map((r) => ({ tokens: r.tokens, phút: r.phút ?? null, units: r.units || 1 }));
  const ac = đọcFile(FILE).filter((r) => r.skill === skill && r.tokens > 0).map((r) => ({ tokens: r.tokens, phút: r.ms ? r.ms / 60000 : null, units: 1 }));
  return ba.concat(ac);
}
function báoGiá(skill, n, bảng) {
  const mẫu = mẫuLịchSử(skill);
  if (mẫu.length >= 3) {
    const tok = mẫu.map((m) => m.tokens / m.units), ph = mẫu.filter((m) => m.phút != null).map((m) => m.phút / m.units);
    return { skill, nguồn: 'lịch sử', mẫu: mẫu.length, n, đơnVị: (bảng.skills[skill] || {}).donVi, tokens: pct(tok, 0.5) * n, thấp: pct(tok, 0.2) * n, cao: pct(tok, 0.8) * n, phút: ph.length ? pct(ph, 0.5) * n : null };
  }
  const d = bảng.skills[skill];
  if (!d) return { skill, nguồn: null, mẫu: mẫu.length };
  const [a, b = a] = d.tokens, [pa, pb = pa] = d.phut, đơn = d.donVi === 'lan' ? 1 : n, một = d.tokens.length === 1;
  return { skill, nguồn: 'mặc định', mẫu: mẫu.length, n: đơn, đơnVị: d.donVi, đo: d.do, mộtLầnĐo: một,
    tokens: ((a + b) / 2) * đơn, thấp: (một ? a * 0.7 : a) * đơn, cao: (một ? a * 1.3 : b) * đơn, phút: ((pa + pb) / 2) * đơn };
}
// Tên skill CŨ (đã gộp — chạy thử thật 08/10/2026: `estimate ba-wireframe-lofi` ra "không ước được"). Chế độ có KHOÁ GIÁ RIÊNG
// trong cost-defaults.json đi bảng nhỏ này trước (lofi rẻ hơn high-fi nhiều — quy về `ba-html-design` là báo giá sai);
// còn lại tra canon `deprecated.skills` (`cũ:mới`) trong conv-registry.md.
const CHẾ_ĐỘ_GIÁ_RIÊNG = { 'ba-wireframe-lofi': 'ba-html-design-lofi' };
function tênMới(skill) {
  if (CHẾ_ĐỘ_GIÁ_RIÊNG[skill]) return CHẾ_ĐỘ_GIÁ_RIÊNG[skill];
  let reg = ''; try { reg = fs.readFileSync(path.join(__dirname, '..', 'references', 'conv-registry.md'), 'utf8'); } catch { return null; }
  const dòng = (reg.match(/^deprecated\.skills\s*=\s*(.+)$/m) || [])[1] || '';
  const cặp = dòng.trim().split(/\s+/).map((x) => x.split(':')).find(([cũ, mới]) => cũ === skill && mới);
  return cặp ? cặp[1] : null;
}
if (CMD === 'estimate') {
  let skill = skillArg();
  if (!skill) { console.error('cost estimate cần <skill> — vd: cost.js estimate ba-html-design --man 3'); process.exit(2); }
  const cũ = tênMới(skill) ? skill : null;
  if (cũ) { skill = tênMới(cũ); if (!JSON_MODE) console.log(`${cũ} là tên cũ → dùng ${skill}`); }
  const n = +(opt('--man') || opt('--trang') || opt('--frame') || opt('--units') || 1) || 1;
  const BẢNG = path.join(__dirname, '..', 'references', 'cost-defaults.json');
  let bảng = { skills: {}, ganNhat: {} }; try { bảng = JSON.parse(fs.readFileSync(BẢNG, 'utf8')); } catch { /* thiếu bảng → chỉ còn lịch sử */ }
  let r = báoGiá(skill, n, bảng), mượn = null;
  if (!r.nguồn && (bảng.ganNhat || {})[skill]) { mượn = bảng.ganNhat[skill]; r = { ...báoGiá(mượn, n, bảng), mẫu: r.mẫu }; }
  const lịchSử = `${path.relative(ROOT, BA_FILE)} + ${path.relative(ROOT, FILE)}`;
  if (!r.nguồn) {
    if (JSON_MODE) { console.log(JSON.stringify({ skill, ...(cũ ? { tênCũ: cũ } : {}), ướcĐược: false, mẫu: r.mẫu })); process.exit(0); }
    console.log(`Ước tính: không ước được — ${skill} chưa có số (lịch sử ${r.mẫu} lần, cần ≥3; không có trong bảng mặc định, không có skill gần nhất). Chạy xong thì \`cost.js record ${skill} --tokens N --minutes M\` để lần sau có số.`);
    process.exit(0);
  }
  const nguồnTxt = r.nguồn === 'lịch sử'
    ? `nguồn: lịch sử ${r.mẫu} lần (${lịchSử}), trung vị · khoảng p20–p80`
    : `nguồn: bảng mặc định (cost-defaults.json — ${r.đo})${r.mộtLầnĐo ? ', một lần đo nên khoảng ±30 %' : ''}${r.mẫu ? ` · lịch sử mới ${r.mẫu} lần (<3)` : ''}`;
  const đơn = `${r.n} ${ĐƠN_VỊ[r.đơnVị] || 'đơn vị'}`;
  const ph = r.phút == null ? '? phút (lịch sử không có thời gian)' : `${phút(r.phút)} phút`;
  if (JSON_MODE) { console.log(JSON.stringify({ skill, ...(cũ ? { tênCũ: cũ } : {}), ướcĐược: true, mượn, ...r })); process.exit(0); }
  console.log(`Ước tính: ~${tk(r.tokens)} token (khoảng ${tk(r.thấp)}–${tk(r.cao)}) · ~${ph} — ${skill} × ${đơn}`);
  console.log(`  ${mượn ? `chưa có số — ước theo skill gần nhất ${mượn} · ` : ''}${nguồnTxt}`);
  process.exit(0);
}
if (CMD === 'record') {
  const skill = skillArg(), tokens = +opt('--tokens', 0), minutes = opt('--minutes') == null ? null : +opt('--minutes');
  if (!skill || !(tokens > 0) || minutes == null || Number.isNaN(minutes)) { console.error('cost record cần <skill> --tokens N --minutes M [--units N] [--note "…"]'); process.exit(2); }
  const row = { lúc: new Date().toISOString(), skill, tokens, phút: minutes, units: +opt('--units', 1) || 1, note: opt('--note', null) };
  fs.mkdirSync(path.dirname(BA_FILE), { recursive: true }); fs.appendFileSync(BA_FILE, JSON.stringify(row) + '\n');
  const nLần = đọcFile(BA_FILE).filter((r) => r.skill === skill).length;
  console.log(`cost record: +${tk(tokens)} ${skill} × ${row.units} · ${minutes} phút → ${nLần} lần của ${skill} trong ${path.relative(ROOT, BA_FILE)}${nLần >= 3 ? ' (estimate dùng lịch sử)' : ` (cần ≥3 để estimate dùng lịch sử)`}`);
  process.exit(0);
}

if (CMD === 'add') {
  const agent = opt('--agent'), role = opt('--role'), tokens = +opt('--tokens', 0);
  if (!agent || !role || !tokens) { console.error('cost add cần --agent --role --tokens'); process.exit(2); }
  const row = { lúc: new Date().toISOString(), agent, role, tokens, tools: +opt('--tools', 0) || null, ms: +opt('--ms', 0) || null, model: opt('--model', null), việc: opt('--viec', null), skill: opt('--skill', null) };
  fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.appendFileSync(FILE, JSON.stringify(row) + '\n');
  const all = đọc(); const tổng = all.reduce((a, r) => a + r.tokens, 0);
  console.log(`cost: +${k(tokens)} ${agent} (${role}${row.việc ? ' · ' + row.việc : ''}) → tổng ${M(tổng)} / ${all.length} agent`);
  process.exit(0);
}
const rows = đọc().filter((r) => !opt('--since') || r.lúc >= opt('--since'));
const gộp = (key) => { const o = {}; for (const r of rows) { const kk = r[key] || '—'; o[kk] = o[kk] || { n: 0, tokens: 0 }; o[kk].n++; o[kk].tokens += r.tokens; } return Object.entries(o).sort((a, b) => b[1].tokens - a[1].tokens); };
if (CMD === 'report') {
  const tổng = rows.reduce((a, r) => a + r.tokens, 0);
  const out = { file: path.relative(ROOT, FILE), agents: rows.length, tokens: tổng, theoAgent: gộp('agent'), theoSkill: gộp('skill'), theoViệc: gộp('việc'), theoModel: gộp('model') };
  if (JSON_MODE) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
  console.log(`cost report: ${M(tổng)} token · ${rows.length} agent${opt('--since') ? ' · từ ' + opt('--since') : ''}`);
  for (const [tên, g] of [['Agent', out.theoAgent], ['Skill', out.theoSkill], ['Việc', out.theoViệc], ['Model', out.theoModel]]) {
    if (g.length === 1 && g[0][0] === '—') continue;
    console.log(`  | ${tên} | Lượt | Token | TB |`); console.log('  |---|---|---|---|');
    for (const [kk, v] of g) console.log(`  | ${kk} | ${v.n} | ${k(v.tokens)} | ${k(v.tokens / v.n)} |`);
  }
  process.exit(0);
}
if (CMD === 'check') {
  const trầnViệc = +opt('--max-per-viec', 3e6), trầnLượt = +opt('--max-spawn', 3);
  const cảnh = [];
  for (const [v, g] of gộp('việc')) if (v !== '—' && g.tokens > trầnViệc) cảnh.push(`việc ${v}: ${M(g.tokens)} > trần ${M(trầnViệc)} — xem lại lô/vòng`);
  const cặp = {}; for (const r of rows) { const kk = `${r.agent}@${r.việc || '—'}`; cặp[kk] = (cặp[kk] || 0) + 1; }
  for (const [kk, n] of Object.entries(cặp)) if (n > trầnLượt && !/general-purpose|ac-builder/.test(kk)) cảnh.push(`${kk}: phái ${n} lần — luật một verifier/judge mỗi màn mỗi vòng (đo 17/09: 16 judge/màn)`);
  if (!cảnh.length) console.log(`cost check: ${rows.length} agent, không vượt trần`);
  else { for (const c of cảnh) console.log('  ⚠️  ' + c); }
  process.exit(cảnh.length ? 1 : 0);
}
console.error('Dùng: cost.js add|report|check|estimate|record'); process.exit(2);
