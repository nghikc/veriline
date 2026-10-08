#!/usr/bin/env node
/*
 * ac-audit-web/lighthouse.js — bọc Lighthouse CLI để lấy Core Web Vitals + điểm 3 hạng mục cho MỘT URL, hoặc
 * đọc lại một report JSON đã có. Zero-dependency, CommonJS — KHÔNG cài gì, chỉ gọi thứ máy đã có.
 *
 *   node .claude/skills/ac-audit-web/scripts/lighthouse.js <url> [--out <report.json>] [--desktop] [--plain|--json]
 *   node .claude/skills/ac-audit-web/scripts/lighthouse.js --from <report.json> [--plain|--json]     # chỉ đọc
 *   node .claude/skills/ac-audit-web/scripts/lighthouse.js --check                                     # có đo được không
 *
 * Chạy: `lighthouse <url> --output=json --only-categories=performance,accessibility,best-practices
 *        --chrome-flags="--headless=new --no-sandbox" --quiet` (CLI toàn cục, hoặc `npx --no-install lighthouse`).
 * Trả: điểm 3 hạng mục (0–100) · LCP (ms) · CLS · INP (nếu Lighthouse có audit `interaction-to-next-paint`, thường
 * KHÔNG có trong lab — khi đó in TBT làm proxy và ghi rõ "INP: không đo được trong lab") · danh sách audit
 * accessibility/best-practices KHÔNG đạt (id + tiêu đề + số phần tử) làm ứng viên `AU-nn` cho ac-auditor ·
 * `run id` = fetchTime + lighthouseVersion để bản audit trích nguồn.
 *
 * KHÔNG ĐO ĐƯỢC (không có Chrome, không có lighthouse, URL không phải http(s), Lighthouse chết) → in
 * "không đo được: <vì sao>" và EXIT 0 — đây không phải lỗi của trang, là thiếu công cụ; bản audit ghi đúng câu
 * đó vào mục CWV, KHÔNG được điền số ước lượng. `--json` khi đó trả `{ measured: false, reason }`.
 *
 * Vì sao có: perf-lighthouse (tech-leads-club) chỉ cách chạy CLI và đọc JSON; ở toolkit cần một lệnh cho
 * orchestrator gọi mà không cần biết flag, và cần một chỗ duy nhất quyết "có số thật hay không" — con số CWV
 * bịa trong bản audit nguy hiểm hơn không có số, vì nó thành bằng chứng cho NFR hiệu năng.
 *
 * gioiHan: một lượt chạy, một URL (Lighthouse dao động ±10% giữa các lượt — muốn số ổn định thì chạy 3 lần lấy
 * giữa, script không tự làm); mobile emulation mặc định (`--desktop` để tắt); không đăng nhập (URL sau auth
 * cần cookie/header → người dùng tự chạy lighthouse với --extra-headers rồi đưa `--from`); không đo file://
 * (Lighthouse không hỗ trợ) — html-design.html tĩnh KHÔNG có CWV, đó là điều đúng.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const JSON_MODE = argv.includes('--json');
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
const url = argv.find((a, i) => !a.startsWith('--') && !['--out', '--from'].includes(argv[i - 1]));
const FROM = opt('--from'); const OUT = opt('--out');

const NGƯỠNG = { lcp: [2500, 4000], cls: [0.1, 0.25], inp: [200, 500], tbt: [200, 600] };
const xếp = (k, v) => v == null ? '—' : v <= NGƯỠNG[k][0] ? 'tốt' : v <= NGƯỠNG[k][1] ? 'cần cải thiện' : 'kém';

/* ─── Công cụ có không ─────────────────────────────────────────────────────────────────────── */
function tìmChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const ứngViên = process.platform === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary']
    : process.platform === 'win32'
      ? ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe']
      : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'];
  return ứngViên.find((p) => fs.existsSync(p)) || null;
}
function tìmLighthouse() {
  const thử = (cmd, args) => { const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 20000, shell: process.platform === 'win32' }); return r.status === 0 && /\d+\.\d+/.test(r.stdout || '') ? { cmd, args, version: (r.stdout || '').trim().split('\n')[0] } : null; };
  return thử('lighthouse', ['--version']) || thử('npx', ['--no-install', 'lighthouse', '--version']);
}
function kiểm() {
  const chrome = tìmChrome(); const lh = tìmLighthouse();
  const reason = !chrome ? 'không tìm thấy Chrome/Chromium (đặt CHROME_PATH nếu cài chỗ khác)' : !lh ? 'không có `lighthouse` (npm i -g lighthouse — script không tự cài)' : null;
  return { chrome, lighthouse: lh, reason };
}

/* ─── Đọc report ───────────────────────────────────────────────────────────────────────────── */
function đọc(report) {
  const a = report.audits || {}; const c = report.categories || {};
  const num = (id) => (a[id] && typeof a[id].numericValue === 'number') ? a[id].numericValue : null;
  const điểm = (id) => (c[id] && typeof c[id].score === 'number') ? Math.round(c[id].score * 100) : null;
  const inp = num('interaction-to-next-paint');
  const thấtBại = Object.values(a)
    .filter((x) => x && typeof x.score === 'number' && x.score < 1 && /^(binary|numeric)$/.test(x.scoreDisplayMode || '') && ['accessibility', 'best-practices'].some((cat) => (c[cat] && c[cat].auditRefs || []).some((r) => r.id === x.id)))
    .map((x) => ({ id: x.id, title: x.title, score: x.score, items: (x.details && Array.isArray(x.details.items)) ? x.details.items.length : null, category: ['accessibility', 'best-practices'].find((cat) => (c[cat].auditRefs || []).some((r) => r.id === x.id)) }));
  return {
    measured: true,
    url: report.finalDisplayedUrl || report.finalUrl || report.requestedUrl || null,
    runId: `Lighthouse ${report.lighthouseVersion || '?'} · ${report.fetchTime || '?'}`,
    formFactor: (report.configSettings || {}).formFactor || null,
    scores: { performance: điểm('performance'), accessibility: điểm('accessibility'), 'best-practices': điểm('best-practices') },
    cwv: {
      lcp: { value: num('largest-contentful-paint'), unit: 'ms', rating: xếp('lcp', num('largest-contentful-paint')) },
      cls: { value: num('cumulative-layout-shift'), unit: '', rating: xếp('cls', num('cumulative-layout-shift')) },
      inp: inp != null ? { value: inp, unit: 'ms', rating: xếp('inp', inp) } : { value: null, unit: 'ms', rating: '—', note: 'không đo được trong lab — Lighthouse không có audit INP; xem TBT làm proxy' },
      tbt: { value: num('total-blocking-time'), unit: 'ms', rating: xếp('tbt', num('total-blocking-time')) },
      fcp: { value: num('first-contentful-paint'), unit: 'ms' },
    },
    failedAudits: thấtBại,
  };
}

/* ─── Chạy ─────────────────────────────────────────────────────────────────────────────────── */
function chạy(u) {
  if (!/^https?:\/\//i.test(u)) return { measured: false, reason: `URL phải là http(s):// — nhận "${u}" (file:// không đo được; html-design.html tĩnh không có CWV)` };
  const k = kiểm();
  if (k.reason) return { measured: false, reason: k.reason };
  const out = OUT ? path.resolve(OUT) : path.join(os.tmpdir(), `lh-${Date.now()}.json`);
  const args = [...k.lighthouse.args.slice(0, -1), u, '--output=json', `--output-path=${out}`, '--only-categories=performance,accessibility,best-practices', '--chrome-flags=--headless=new --no-sandbox', '--quiet', ...(argv.includes('--desktop') ? ['--preset=desktop'] : [])];
  const r = spawnSync(k.lighthouse.cmd, args, { encoding: 'utf8', timeout: 240000, env: { ...process.env, CHROME_PATH: k.chrome }, shell: process.platform === 'win32' });
  if (r.status !== 0 || !fs.existsSync(out)) return { measured: false, reason: `lighthouse thoát ${r.status}: ${((r.stderr || r.stdout || '').trim().split('\n').slice(-2).join(' ')).slice(0, 200)}` };
  const kq = đọc(JSON.parse(fs.readFileSync(out, 'utf8'))); kq.reportFile = out; kq.command = `${k.lighthouse.cmd} ${args.join(' ')}`;
  return kq;
}

module.exports = { đọc, kiểm, NGƯỠNG };

if (require.main === module) {
  let kq;
  if (argv.includes('--check')) { const k = kiểm(); kq = k.reason ? { measured: false, reason: k.reason } : { measured: null, chrome: k.chrome, lighthouse: k.lighthouse.version }; }
  else if (FROM) { if (!fs.existsSync(FROM)) { console.error(`Không thấy ${FROM}`); process.exit(2); } kq = đọc(JSON.parse(fs.readFileSync(FROM, 'utf8'))); kq.reportFile = path.resolve(FROM); }
  else if (url) kq = chạy(url);
  else { console.error('Dùng: lighthouse.js <url> [--out <report.json>] [--desktop] | --from <report.json> | --check'); process.exit(2); }

  if (JSON_MODE) { console.log(JSON.stringify(kq, null, 2)); process.exit(0); }
  if (kq.measured === false) { console.log(`lighthouse: không đo được: ${kq.reason}`); process.exit(0); }
  if (kq.measured === null) { console.log(`lighthouse: đo được — Chrome ${kq.chrome} · ${kq.lighthouse}`); process.exit(0); }
  const f = (m, s) => m.value == null ? (m.note ? `không đo được (${m.note})` : '—') : `${m.unit === 'ms' ? (s ? (m.value / 1000).toFixed(2).replace('.', ',') + ' s' : Math.round(m.value) + ' ms') : m.value.toFixed(3).replace('.', ',')}${m.rating ? ` · ${m.rating}` : ''}`;
  console.log(`lighthouse ${kq.url || ''} · ${kq.runId} · ${kq.formFactor || ''}`);
  console.log(`  Điểm: performance ${kq.scores.performance ?? '—'} · accessibility ${kq.scores.accessibility ?? '—'} · best-practices ${kq.scores['best-practices'] ?? '—'}`);
  console.log(`  LCP ${f(kq.cwv.lcp, true)} (tốt ≤ 2,5 s) · CLS ${f(kq.cwv.cls)} (tốt ≤ 0,1) · INP ${f(kq.cwv.inp)} (tốt ≤ 200 ms) · TBT ${f(kq.cwv.tbt)} (proxy INP, tốt ≤ 200 ms)`);
  if (kq.failedAudits.length) { console.log(`  Audit không đạt (${kq.failedAudits.length}) — ứng viên AU-nn, ac-auditor mở trang xác nhận:`); for (const x of kq.failedAudits) console.log(`    • ${x.category} · ${x.id} · ${x.title}${x.items != null ? ` · ${x.items} phần tử` : ''}`); }
  else console.log('  Audit accessibility/best-practices: không có audit nào dưới 100%');
  if (kq.reportFile) console.log(`  Report: ${kq.reportFile}`);
  process.exit(0);
}
