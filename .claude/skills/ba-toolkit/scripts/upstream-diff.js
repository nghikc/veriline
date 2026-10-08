#!/usr/bin/env node
/*
 * ba-toolkit/upstream-diff.js — 10 skill `dev-*` là CLONE của plugin superpowers. Script này đo: bản upstream
 * đang cache trên máy có ĐỔI so với bản mình đã clone không, và mình đã SỬA clone bao nhiêu. Zero-dependency.
 *
 *   node .claude/skills/ba-toolkit/scripts/upstream-diff.js [--upstream <dir skills của plugin>] [--plain|--json]
 *
 * Mỗi SKILL.md của `dev-*` khai trong frontmatter:
 *   upstream: superpowers@5.1.0/<tên-skill-gốc>
 *   upstream_sha256: <16 hex đầu của sha256 SKILL.md gốc lúc clone>
 * Script tìm bản gốc ở --upstream, hoặc ~/.claude/plugins/cache/claude-plugins-official/superpowers/<mọi phiên bản>/skills.
 * Kết luận mỗi skill: `khớp` (upstream không đổi) · `upstream đổi` (hash gốc ≠ hash đã ghi — có bản mới để xem) ·
 * `không thấy upstream` (cache không có, không đoán). Kèm số dòng clone lệch gốc (mình đã cắt/đổi gì).
 * Exit = số skill `upstream đổi` (để CI/lint nhắc), 0 khi không thấy cache (không phạt máy không cài plugin).
 *
 * Vì sao có (steal B36, 15/09/2026): clone superpowers v5.1.0 không có đường cập nhật — upstream đổi thì toolkit
 * không biết; hôm 15/09 còn cắt 5 file clone theo harness-eval nên càng phải ghi nguồn + phiên bản. Script này không
 * merge gì (merge là việc người quyết), chỉ nói "có bản mới" và "mình đã sửa N dòng".
 *
 * gioiHan: chỉ so SKILL.md (không so file phụ); diff đếm dòng bằng LCS thô, không hiển thị nội dung.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const argv = process.argv.slice(2);
const JSON_MODE = argv.includes('--json');
const ROOT = path.resolve(argv.includes('--root') ? argv[argv.indexOf('--root') + 1] : process.cwd());
const SK = path.join(ROOT, '.claude', 'skills');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);

// nơi tìm upstream: --upstream, rồi mọi phiên bản trong cache plugin
const candidates = [];
if (argv.includes('--upstream')) candidates.push(path.resolve(argv[argv.indexOf('--upstream') + 1]));
const cache = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'claude-plugins-official', 'superpowers');
if (fs.existsSync(cache)) for (const v of fs.readdirSync(cache).filter((v) => /^\d+\.\d+/.test(v)).sort().reverse()) candidates.push(path.join(cache, v, 'skills'));

// LCS theo dòng — đếm dòng khác nhau (thêm + bớt)
function diffLines(a, b) {
  const A = a.split('\n'), B = b.split('\n');
  const n = A.length, m = B.length;
  if (n * m > 4e6) return { thêm: null, bớt: null };
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const lcs = dp[0][0];
  return { thêm: n - lcs, bớt: m - lcs };   // thêm = dòng chỉ có ở clone; bớt = dòng gốc không còn trong clone
}

const rows = [];
for (const d of fs.readdirSync(SK).filter((n) => n.startsWith('dev-')).sort()) {
  const f = path.join(SK, d, 'SKILL.md');
  const txt = fs.readFileSync(f, 'utf8');
  const fm = (txt.match(/^---\n([\s\S]*?)\n---/) || [, ''])[1];
  const up = (fm.match(/^upstream:\s*(.+)$/m) || [])[1];
  const h0 = (fm.match(/^upstream_sha256:\s*([0-9a-f]+)$/m) || [])[1];
  if (!up) { rows.push({ skill: d, kết: 'không phải clone', ghi: 'không có upstream:' }); continue; }
  const m = up.match(/^([a-z-]+)@([\d.]+)\/([a-z0-9-]+)$/);
  if (!m || !h0) { rows.push({ skill: d, kết: 'khai sai', ghi: 'upstream/upstream_sha256 không đúng dạng' }); continue; }
  let found = null, ver = null;
  for (const c of candidates) { const p = path.join(c, m[3], 'SKILL.md'); if (fs.existsSync(p)) { found = p; ver = (c.match(/superpowers\/([\d.]+)\//) || [, '?'])[1]; break; } }
  if (!found) { rows.push({ skill: d, upstream: up, kết: 'không thấy upstream', ghi: 'cache plugin không có — truyền --upstream' }); continue; }
  const upTxt = fs.readFileSync(found, 'utf8');
  const h1 = sha(upTxt);
  const body = txt.replace(/^---[\s\S]*?---\n/, '').replace(/^> Nguồn: clone.*\n\n?/m, '');
  const upBody = upTxt.replace(/^---[\s\S]*?---\n/, '');
  const dl = diffLines(body, upBody);
  rows.push({ skill: d, upstream: up, cacheVer: ver, kết: h1 === h0 ? 'khớp' : 'upstream đổi', hashGhi: h0, hashCache: h1, cloneLệch: dl });
}
const đổi = rows.filter((r) => r.kết === 'upstream đổi').length;
if (JSON_MODE) console.log(JSON.stringify({ candidates, rows, đổi }, null, 2));
else {
  console.log(`upstream-diff: ${rows.length} dev-* · nguồn tìm ở: ${candidates.length ? candidates.map((c) => c.replace(os.homedir(), '~')).join(' · ') : '(không có)'}`);
  for (const r of rows) {
    const lệch = r.cloneLệch ? ` · clone lệch gốc +${r.cloneLệch.thêm}/−${r.cloneLệch.bớt} dòng` : '';
    console.log(`  ${r.kết === 'khớp' ? '✓' : r.kết === 'upstream đổi' ? '↑' : '·'} ${r.skill} — ${r.kết}${r.upstream ? ` (${r.upstream}${r.cacheVer ? `, cache ${r.cacheVer}` : ''})` : ''}${lệch}${r.ghi ? ' — ' + r.ghi : ''}`);
  }
  if (đổi) console.log(`  → ${đổi} skill có bản upstream mới: đọc diff bằng tay rồi quyết merge; sau khi merge cập nhật upstream_sha256.`);
}
process.exit(đổi);
