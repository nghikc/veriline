#!/usr/bin/env node
/*
 * ba-toolkit/check-cites.js — mọi đường dẫn `.claude/skills/<skill>/<file>` được TRÍCH trong SKILL.md, file agent,
 * script của skill và CLAUDE.md phải TỒN TẠI; tên skill/agent trích trong SKILL.md phải có thật. Zero-dependency. lint.js check 31 gọi.
 *
 *   node .claude/skills/ba-toolkit/scripts/check-cites.js [--root <repo>] [--plain|--json]
 *
 * Vì sao có (steal B18, 15/09/2026): di trú `scripts/` ngày 04/09 để lại 4 đường dẫn chết trong CODE
 * (`install.js`, `server.js` ×2, `global-bootstrap.js`) suốt 11 ngày — `ba-launcher` không thấy installer,
 * `--mini` chết — vì không check nào đọc đường dẫn nằm trong chuỗi. Track A của harness-eval cũng bỏ lọt
 * (không kiểm prefix `.claude/`). Chỉ kiểm chuỗi có đủ prefix `.claude/skills/`; `path.join(..., 'x', 'y.js')`
 * dạng mảnh KHÔNG bắt được — luật viết code: ghép đường dẫn skill bằng chuỗi đầy đủ hoặc qua biến SKILLS_DIR
 * + `'scripts'` rõ ràng.
 *
 * Tên skill/agent (gộp từ lint 4, 25/09/2026 — cùng câu hỏi "thứ được trích có thật không"): mỗi `ba-x`/`dev-x`/`ac-x`
 * trong backtick ở SKILL.md phải là skill hoặc agent có thật. Miễn: tên trong `deprecated.skills` (ghi chú di trú phải nhắc
 * được tên cũ — ràng buộc "kèm skill thay thế" do lint 13 giữ) và vài token ba-/dev- không phải skill (IGNORE).
 *
 * gioiHan: bỏ qua test.js (fixture cố ý có đường dẫn cũ), bỏ placeholder `<…>`/`x/`; không kiểm đường dẫn docs/.
 * Tên skill/agent chỉ soát trong SKILL.md (agent/script/CLAUDE.md nhắc tên thì không).
 * Gói phát hành (08/10/2026): skill trong `skills.pro`/`skills.devonly` và agent trong `agents.pro` VẮNG ở repo công khai là hợp
 * lệ — tên và đường dẫn trích tới chúng không tính "không tồn tại" khi thư mục skill vắng (in số `vắngHợpLệ`). Có mặt thì soát như cũ.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const argv = process.argv.slice(2);
const ROOT = path.resolve(argv.includes('--root') ? argv[argv.indexOf('--root') + 1] : process.cwd());
const JSON_MODE = argv.includes('--json');
const SK = path.join(ROOT, '.claude', 'skills');
const RE = /\.claude\/skills\/([a-z0-9-]+)\/([A-Za-z0-9_./-]+\.(?:js|md|json|html|dbml|http))/g;
const files = [];
if (fs.existsSync(SK)) for (const d of fs.readdirSync(SK)) {
  const dir = path.join(SK, d); if (!fs.statSync(dir).isDirectory()) continue;
  if (fs.existsSync(path.join(dir, 'SKILL.md'))) files.push(path.join(dir, 'SKILL.md'));
  const sc = path.join(dir, 'scripts');
  if (fs.existsSync(sc)) for (const f of fs.readdirSync(sc)) if (f.endsWith('.js') && f !== 'test.js') files.push(path.join(sc, f));
}
const AG = path.join(ROOT, '.claude', 'agents');
if (fs.existsSync(AG)) for (const f of fs.readdirSync(AG)) if (f.endsWith('.md')) files.push(path.join(AG, f));
if (fs.existsSync(path.join(ROOT, 'CLAUDE.md'))) files.push(path.join(ROOT, 'CLAUDE.md'));
const regTxt = (() => { try { return fs.readFileSync(path.join(SK, 'ba-toolkit', 'references', 'conv-registry.md'), 'utf8'); } catch { return ''; } })();
const regKey = (k) => ((regTxt.match(new RegExp(`^${k.replace(/\./g, '\\.')}\\s*=\\s*(.+)$`, 'm')) || [])[1] || '').trim().split(/\s+/).filter(Boolean);
const NGOÀI_GÓI = new Set([...regKey('skills.pro'), ...regKey('skills.devonly')]);
const AGENT_PRO = Object.fromEntries(regKey('agents.pro').map((x) => x.split(':')));
const vắng = (s) => (NGOÀI_GÓI.has(s) && !fs.existsSync(path.join(SK, s))) || (AGENT_PRO[s] && !fs.existsSync(path.join(SK, AGENT_PRO[s])));
let n = 0, vắngHợpLệ = 0; const lỗi = [];
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(RE)) {
    if (/[<>]/.test(m[0]) || m[1] === 'x') continue;
    n++;
    if (!fs.existsSync(path.join(SK, m[1], m[2])) && vắng(m[1])) { vắngHợpLệ++; continue; }
    if (!fs.existsSync(path.join(SK, m[1], m[2]))) lỗi.push(`${path.relative(ROOT, f)}: trích \`${m[0]}\` không tồn tại`);
  }
}
// Tên skill/agent trong backtick của SKILL.md (ex-lint 4)
const skills = fs.existsSync(SK) ? fs.readdirSync(SK).filter((d) => /^(ba|dev|ac)-/.test(d) && fs.existsSync(path.join(SK, d, 'SKILL.md'))) : [];
const known = new Set([...skills, ...(fs.existsSync(AG) ? fs.readdirSync(AG).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')) : [])]);
const IGNORE = new Set(['ba-docs', 'ba-source', 'ba-site', 'ba-manifest', 'ba-toolkit-readme', 'ba-toolkit-guideline']);
for (const p of ((regTxt.match(/^deprecated\.skills\s*=\s*(.+)$/m) || [])[1] || '').trim().split(/\s+/).filter(Boolean)) IGNORE.add(p.split(':')[0]);
let nTên = 0;
for (const s of skills) {
  const refs = new Set((fs.readFileSync(path.join(SK, s, 'SKILL.md'), 'utf8').match(/`(ba|dev|ac)-[a-z0-9-]+`/g) || []).map((x) => x.replace(/`/g, '')));
  for (const r of refs) { nTên++; if (!known.has(r) && !IGNORE.has(r) && vắng(r)) { vắngHợpLệ++; continue; } if (!known.has(r) && !IGNORE.has(r)) lỗi.push(`${s} tham chiếu skill/agent không tồn tại: ${r}`); }
}
if (JSON_MODE) console.log(JSON.stringify({ files: files.length, cites: n, tên: nTên, vắngHợpLệ, lỗi }, null, 2));
else { console.log(`check-cites: ${files.length} file · ${n} đường dẫn trích · ${nTên} tên skill/agent${vắngHợpLệ ? ` · ${vắngHợpLệ} trỏ skill/agent gói Pro/devonly vắng (hợp lệ)` : ''}`); for (const l of lỗi) console.log(`  ❌ ${l}`); if (!lỗi.length) console.log('  ✓ mọi đường dẫn trích và tên skill/agent đều tồn tại'); }
process.exit(lỗi.length);
