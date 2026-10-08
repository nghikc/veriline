#!/usr/bin/env node
/*
 * ba-toolkit/real-run.js — CHẠY MỌI CHECKER TRÊN KHO HÌNH THẬT `fixtures/real/` và so BÁNH CÓC `expect.json` (W2). Zero-dep.
 *
 *   node .claude/skills/ba-toolkit/scripts/real-run.js [--only P3] [--checker <skill/script>] [--plain|--json]
 *   node .claude/skills/ba-toolkit/scripts/real-run.js --write-expect [--only P3] [--checker …]   # ghi lại bánh cóc (có chủ đích)
 *   node .claude/skills/ba-toolkit/scripts/real-run.js --cover        # mỗi checker chạy trên mấy P (luật ≥3, `minP` trong runs.json)
 *   (thử nghiệm: --kho <thư mục kho>)
 *
 * `fixtures/real/runs.json`: `{ ngay: "YYYY-MM-DD", runs: [{ checker, args: [...], need?: [...], each?, minP?, lyDo? }] }`.
 *   args giữ chỗ: {docs} {root} {diff} {item} — need: đường dẫn tương đối phải có · `re:<regex>` có file khớp ·
 *   `@code` có file ngoài docs/diff · `@diff` có diff/range.diff · `@git` dựng repo tạm 2 commit (cây trước = cây P
 *   `git apply -R diff`, cây sau = cây P), {root} trỏ vào repo đó. each: `screen` (mỗi folder màn) · `re:<regex>` (mỗi file).
 * Mỗi P chép sang thư mục tạm trước khi chạy (checker ghi file không làm bẩn kho; git không leo lên repo toolkit), Date
 * ghim về `ngay` bằng `node -r` (checker xét Mốc/hạn không trôi theo lịch).
 * Dấu vân tay mỗi lần chạy: `exit` · `err`/`warn` (JSON: đếm đối tượng có trường mức; chữ: dòng có ❌🔴✗ / ⚠️🟡🟠) ·
 * `codes` (đếm mã luật: trường rule|code|ma|mã|luat của JSON; chữ: mã đứng ngay sau ký hiệu mức). Exit = số lệch
 * so với expect.json (thiếu khoá cũng là lệch). JSON còn ghi `arr` = độ dài các mảng tầng 1–2.
 *
 * VÌ SAO CÓ (docs/decisions/25 W2, 29): mỗi oan/im của checker trên dự án thật trước đây chỉ lộ khi người dùng chạy tay
 * ở dự án đó, sửa xong không có gì giữ — oan cũ tái phát được. Bánh cóc cả hai chiều (thêm hay bớt mục đều đỏ) vì im
 * oan nguy hiểm ngang báo oan: checker tụt về luôn-im thì mọi cổng tin nó mù theo.
 *
 * gioiHan: dấu vân tay là ĐẾM, không phán đúng sai — expect ghi hành vi HÔM GHI, kể cả oan còn mở (ghi oan vào sổ
 * oan.js, không vào đây). Đổi câu chữ checker không đỏ; đổi số mục/mức/exit thì đỏ. Lệnh con của checker (git, npm)
 * không bị ghim ngày. Checker cần mạng/Chrome/test thật của app không nằm trong kho.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ (lint 43)
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const giáTrị = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
const SKILLS = path.resolve(__dirname, '..', '..');
const KHO = path.resolve(giáTrị('--kho') || path.join(SKILLS, '..', '..', 'fixtures', 'real'));
const JSON_OUT = argv.includes('--json');

const đọcJ = (f, mặc) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return mặc; } };
const cấuHình = đọcJ(path.join(KHO, 'runs.json'), null);
if (!cấuHình) { console.error(`Không đọc được ${path.join(KHO, 'runs.json')}`); process.exit(2); }
const fileExpect = path.join(KHO, 'expect.json');
const expect = đọcJ(fileExpect, {});

function tấtCả(dir, rel = '', ra = []) {
  for (const d of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = rel ? rel + '/' + d.name : d.name;
    if (d.isDirectory()) tấtCả(dir, r, ra); else ra.push(r);
  }
  return ra;
}

const TẠM = fs.mkdtempSync(path.join(os.tmpdir(), 'ba-real-'));
const GHIM = path.join(TẠM, 'ghim-ngay.js');
fs.writeFileSync(GHIM, `'use strict';const T=Date.parse(${JSON.stringify((cấuHình.ngay || '2026-10-07') + 'T09:00:00')});const D=Date;class G extends D{constructor(...a){super(...(a.length?a:[T]));}static now(){return T;}}global.Date=G;\n`);
process.on('exit', () => { try { fs.rmSync(TẠM, { recursive: true, force: true }); } catch { /* bỏ */ } });

const git = (cwd, args) => spawnSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'real', GIT_AUTHOR_EMAIL: 'real@example.test', GIT_COMMITTER_NAME: 'real', GIT_COMMITTER_EMAIL: 'real@example.test', GIT_AUTHOR_DATE: '2026-01-01T00:00:00', GIT_COMMITTER_DATE: '2026-01-01T00:00:00' } });

function chuẩnBị(P) {
  const nguồn = path.join(KHO, P);
  const bảnSao = path.join(TẠM, P);
  fs.cpSync(nguồn, bảnSao, { recursive: true });
  const files = tấtCả(bảnSao);
  const ctx = { P, root: bảnSao, docs: path.join(bảnSao, 'docs'), files, diff: path.join(bảnSao, 'diff', 'range.diff'), gitRoot: null, gitLỗi: null };
  ctx.code = files.some((f) => !/^(docs\/|diff\/|SOURCE\.md$)/.test(f));
  return ctx;
}

function dựngGit(ctx) {
  if (ctx.gitRoot || ctx.gitLỗi) return;
  const g = path.join(TẠM, ctx.P + '-git');
  fs.cpSync(path.join(KHO, ctx.P), g, { recursive: true });
  fs.rmSync(path.join(g, 'diff'), { recursive: true, force: true });
  const lỗi = (r) => (r.status ? (r.stderr || r.stdout || '').trim().split('\n')[0] : null);
  let e = lỗi(git(g, ['init', '-q'])) || lỗi(git(g, ['apply', '-R', '--whitespace=nowarn', ctx.diff]));
  if (!e) e = lỗi(git(g, ['add', '-A'])) || lỗi(git(g, ['commit', '-qm', 'truoc', '--allow-empty', '--no-verify']));
  if (!e) e = lỗi(git(g, ['apply', '--whitespace=nowarn', ctx.diff])) || lỗi(git(g, ['add', '-A'])) || lỗi(git(g, ['commit', '-qm', 'sau', '--no-verify']));
  if (e) ctx.gitLỗi = e; else ctx.gitRoot = g;
}

function đủ(ctx, need = []) {
  return need.every((n) => {
    if (n === '@code') return ctx.code;
    if (n === '@diff' || n === '@git') return fs.existsSync(ctx.diff);
    if (n.startsWith('re:')) { const re = new RegExp(n.slice(3)); return ctx.files.some((f) => re.test(f)); }
    return fs.existsSync(path.join(ctx.root, n));
  });
}

function mục(ctx, each) {
  if (!each) return [null];
  if (each === 'screen') {
    const ds = new Set();
    for (const f of ctx.files) { const m = f.match(/(?:^|\/)(S\d+[a-z]?)(?:\s+-\s|[-_ ])[^/]*\/srs\.md$/); if (m) ds.add(m[1]); }
    return [...ds].sort();
  }
  if (each.startsWith('re:')) { const re = new RegExp(each.slice(3)); return ctx.files.filter((f) => re.test(f)).sort(); }
  return [null];
}

const MỨC_ERR = /^(❌|🔴|✗|err|error|fail|đỏ)/i;
const MỨC_WARN = /^(⚠️|⚠|🟡|🟠|warn|warning|vàng)/i;
const KHOÁ_MÃ = new Set(['rule', 'code', 'ma', 'mã', 'luat', 'luật']);
const KHOÁ_MỨC = new Set(['muc', 'mức', 'level', 'severity', 'sev', 'loai', 'loại', 'type']);
const DẠNG_MÃ = /^[\p{Lu}][\p{Lu}0-9]*(?:[-_][\p{Lu}0-9]+)+$/u; // bắt buộc có gạch: DS-HEX, EL-MISS — mã màn S01 là dữ liệu, không phải luật

function vânTay(r) {
  const out = (r.stdout || '') + '\n' + (r.stderr || '');
  const vt = { exit: r.status === null ? -1 : r.status, err: 0, warn: 0, codes: {} };
  let j = null; try { j = JSON.parse(r.stdout); } catch { /* chữ */ }
  if (j && typeof j === 'object') {
    const đi = (o) => {
      if (Array.isArray(o)) return o.forEach(đi);
      if (!o || typeof o !== 'object') return;
      for (const [k, v] of Object.entries(o)) {
        const kk = k.toLowerCase();
        // nhóm có số chỗ (check-design: {rule, count}) → cộng số chỗ, không +1: bớt vài chỗ oan trong một nhóm vẫn đỏ (OAN-1, 07/10/2026)
        const sốChỗ = ['count', 'n', 'soLuong', 'sốLượng', 'soCho', 'sốChỗ'].map((x) => o[x]).find((x) => Number.isInteger(x) && x >= 0);
        if (typeof v === 'string' && KHOÁ_MÃ.has(kk) && v.length <= 24 && DẠNG_MÃ.test(v)) vt.codes[v] = (vt.codes[v] || 0) + (sốChỗ === undefined ? 1 : sốChỗ);
        if (typeof v === 'string' && KHOÁ_MỨC.has(kk)) { if (MỨC_ERR.test(v)) vt.err++; else if (MỨC_WARN.test(v)) vt.warn++; }
        // map đếm theo loại (scan-bypasses: "theoLoai": {"protected-edit": 3}) — mã có thể viết thường
        if (/^(theo|by)/i.test(k) && v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every((x) => typeof x === 'number')) {
          for (const [c, n] of Object.entries(v)) vt.codes[c] = (vt.codes[c] || 0) + n;
          continue;
        }
        if (Array.isArray(v) && v.length && v.every((x) => typeof x === 'string')) {
          const nhóm = /^(lỗi|loi|errors?|err|fail)/i.test(k) ? 'err' : /^(cảnh|canh|warn)/i.test(k) ? 'warn' : null;
          for (const x of v) {
            const m = x.match(/^([\p{Lu}][\p{Lu}0-9]*(?:[-_][\p{Lu}0-9]+)+)\b/u);
            if (m && m[1].length <= 24) vt.codes[m[1]] = (vt.codes[m[1]] || 0) + 1;
            if (nhóm) vt[nhóm]++;
          }
        }
        if (v && typeof v === 'object') đi(v);
      }
    };
    đi(j);
    // Độ dài mảng ở tầng 1–2 (pick: hàng đợi, status: màn, scan-eval: TC…) — checker JSON không có trường mức/mã vẫn có
    // vân tay; thiếu cái này 9 checker ra 0/0/0 trên mọi P và bánh cóc mù với chúng (đo 07/10/2026).
    const arr = {};
    const đo = (o, tiền, sâu) => { if (!o || typeof o !== 'object' || Array.isArray(o)) return; for (const [k, v] of Object.entries(o)) { if (Array.isArray(v)) arr[tiền + k] = v.length; else if (sâu < 2) đo(v, tiền + k + '.', sâu + 1); } };
    đo(j, '', 1);
    if (Object.keys(arr).length) vt.arr = Object.fromEntries(Object.entries(arr).sort());
  } else {
    for (const l of out.split('\n')) {
      if (/❌|🔴|✗/.test(l)) vt.err++; else if (/⚠️|⚠|🟡|🟠/.test(l)) vt.warn++;
      const m = l.match(/(?:❌|🔴|✗|⚠️|⚠|🟡|🟠)\s*\[?([\p{Lu}][\p{Lu}0-9]*(?:[-_][\p{Lu}0-9]+)+)\]?/u);
      if (m && m[1].length <= 24) vt.codes[m[1]] = (vt.codes[m[1]] || 0) + 1;
    }
  }
  return vt;
}

const chỉP = giáTrị('--only');
const chỉC = giáTrị('--checker');
const Ps = fs.readdirSync(KHO).filter((d) => /^P\d+$/.test(d) && fs.statSync(path.join(KHO, d)).isDirectory() && (!chỉP || d === chỉP)).sort((a, b) => +a.slice(1) - +b.slice(1));
const kq = {};
const phủ = {};
const lỗiChạy = [];
for (const P of Ps) {
  const ctx = chuẩnBị(P);
  kq[P] = {};
  for (const run of cấuHình.runs) {
    if (chỉC && run.checker !== chỉC) continue;
    if (!đủ(ctx, run.need)) continue;
    if ((run.need || []).includes('@git')) { dựngGit(ctx); if (ctx.gitLỗi) { lỗiChạy.push(`${P} ${run.checker}: repo tạm hỏng — ${ctx.gitLỗi}`); continue; } }
    const script = path.join(SKILLS, run.checker.split('/')[0], 'scripts', run.checker.split('/')[1] + '.js');
    for (const item of mục(ctx, run.each)) {
      // cwd = gốc P (hoặc repo tạm), mọi đường dẫn TƯƠNG ĐỐI — như người dùng gõ ở gốc dự án. Truyền tuyệt đối làm checker so
      // tiền tố với đường dẫn tương đối trong diff trượt hết (scan-lach im sai trên mọi P — lộ khi cắt P2, 07/10/2026).
      const diffTương = (run.need || []).includes('@git') ? path.relative(ctx.gitRoot, ctx.diff) : 'diff/range.diff';
      const thay = (a) => a.replace('{docs}', 'docs').replace('{root}', '.').replace('{diff}', diffTương).replace('{item}', item || '');
      const cwd = (run.need || []).includes('@git') ? ctx.gitRoot : ctx.root;
      const r = spawnSync(process.execPath, ['-r', GHIM, script, ...run.args.map(thay)], { cwd, encoding: 'utf8', timeout: 60000, maxBuffer: 64 << 20, env: { ...process.env, GIT_CEILING_DIRECTORIES: TẠM, NO_COLOR: '1', FORCE_COLOR: '0' } });
      const khoá = run.checker + (run.tag ? '#' + run.tag : '') + (item ? ' ' + item : '');
      kq[P][khoá] = vânTay(r);
      if (r.error) lỗiChạy.push(`${P} ${khoá}: ${r.error.code || r.error.message}`);
      (phủ[run.checker] = phủ[run.checker] || new Set()).add(P);
    }
  }
}

if (argv.includes('--cover')) {
  const thiếu = [];
  for (const run of cấuHình.runs) {
    const n = (phủ[run.checker] || new Set()).size;
    const min = run.minP === undefined ? 3 : run.minP;
    if (n < min && !thiếu.some((x) => x.checker === run.checker)) thiếu.push({ checker: run.checker, n, min });
  }
  if (JSON_OUT) console.log(JSON.stringify({ phủ: Object.fromEntries(Object.entries(phủ).map(([k, v]) => [k, [...v]])), thiếu }, null, 1));
  else { for (const [k, v] of Object.entries(phủ)) console.log(`${(phủ[k].size >= 3 ? '✓' : '·')} ${k}: ${[...v].join(' ')}`); thiếu.forEach((x) => console.log(`  ❌ ${x.checker} chạy trên ${x.n} P < ${x.min}`)); }
  process.exit(thiếu.length);
}

if (argv.includes('--write-expect')) {
  const mới = { ...expect };
  for (const P of Ps) { mới[P] = chỉC ? { ...(mới[P] || {}), ...kq[P] } : kq[P]; }
  fs.writeFileSync(fileExpect, JSON.stringify(Object.fromEntries(Object.keys(mới).sort().map((P) => [P, Object.fromEntries(Object.keys(mới[P]).sort().map((k) => [k, mới[P][k]]))])), null, 1) + '\n');
  console.log(`Đã ghi ${path.relative(process.cwd(), fileExpect)}: ${Ps.map((P) => `${P} ${Object.keys(kq[P]).length}`).join(' · ')}`);
  lỗiChạy.forEach((l) => console.log('  ⚠️ ' + l));
  process.exit(0);
}

const lệch = [];
const bằng = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const gọn = (v) => v ? `exit ${v.exit} · ${v.err}❌ ${v.warn}⚠️${Object.keys(v.codes).length ? ' · ' + Object.entries(v.codes).sort().map(([c, n]) => `${c}×${n}`).join(' ') : ''}` : '(không có)';
for (const P of Ps) {
  const e = expect[P] || {};
  const khoá = new Set([...Object.keys(kq[P]), ...(chỉC ? Object.keys(e).filter((k) => k.split(/[# ]/)[0] === chỉC) : Object.keys(e))]);
  for (const k of [...khoá].sort()) {
    const a = kq[P][k]; const b = e[k];
    if (!bằng(a && { ...a, codes: Object.fromEntries(Object.entries(a.codes).sort()) }, b && { ...b, codes: Object.fromEntries(Object.entries(b.codes).sort()) })) lệch.push({ P, khoá: k, giờ: a || null, kỳVọng: b || null });
  }
}
if (JSON_OUT) console.log(JSON.stringify({ P: Ps, chạy: Ps.reduce((n, P) => n + Object.keys(kq[P]).length, 0), lệch, lỗiChạy }, null, 1));
else {
  console.log(`real-run: ${Ps.length} P · ${Ps.reduce((n, P) => n + Object.keys(kq[P]).length, 0)} lần chạy · ${lệch.length} lệch bánh cóc`);
  for (const x of lệch) console.log(`  ❌ ${x.P} ${x.khoá}\n      giờ    : ${gọn(x.giờ)}\n      kỳ vọng: ${gọn(x.kỳVọng)}`);
  lỗiChạy.forEach((l) => console.log('  ⚠️ ' + l));
  if (lệch.length) console.log(`  → soát lại; cố ý thì: real-run.js --write-expect${chỉP ? ' --only ' + chỉP : ''} (ghi lý do vào commit). Checker oan → oan.js add, đừng ghi expect cho xanh.`);
}
process.exit(Math.min(lệch.length, 125));
