/*
 * ba-toolkit/evidence.js — soát CHUNG cho bản bằng chứng do agent viết (verification.md · eval · review) + BIÊN LAI Proof.
 * Zero-dependency, CommonJS. Module + CLI.
 *
 *   node .claude/skills/ba-toolkit/scripts/evidence.js run [--screen S03] -- <lệnh Proof…>
 *     vd: node .claude/skills/ba-toolkit/scripts/evidence.js run --screen S03 -- npx vitest run -t 'TC-S03-02'
 *         node .claude/skills/ba-toolkit/scripts/evidence.js run --screen S03 -- sh -c "cd app && npx jest tests/a.test.ts"   (Proof có &&/ống → tự gọi shell)
 *   Chạy lệnh, TRONG SUỐT: stdout/stderr của lệnh chảy thẳng ra như chạy trần, exit = exit của lệnh. Xong ghi biên lai
 *   `.claude/ac-runs/<head12>-<sha8 lệnh chuẩn hoá>.json` = { ts, head, cmd, exit, passed, failed, stdoutSha256, screen }
 *   ở gốc git (không git → thư mục hiện tại, head = null, tên file `nogit-…`). passed/failed đọc từ DÒNG TỔNG của
 *   vitest/jest/playwright/pytest/node:test/mocha (stdout + stderr — jest in tổng ra stderr); không đọc được → null.
 *   Biên lai không bao giờ làm đổi exit: ghi hỏng → một dòng `[evidence] …` ra stderr.
 *   "Lệnh chuẩn hoá" = tách token kiểu shell (bỏ nháy) rồi nối một dấu cách: `npx vitest run -t 'TC-S03-02'` trong plan
 *   và argv `npx vitest run -t TC-S03-02` (shell đã bỏ nháy) cho cùng một khoá — validate-done (V-RECEIPT) dùng chung hàm.
 *   Vỏ `sh|bash|zsh -c "<lệnh>"` / `cmd /c <lệnh>` bị bóc trước khi so: Proof `cd app && npx jest` khớp `-- sh -c "cd app && npx jest"`.
 *
 * Vì sao có (25/09/2026, dọn cổng): validate-done.js (V2a/V2b, V5), check-eval.js (E1a, E6b) và review-gate.js (luật 1, 7)
 * mỗi script tự viết lại cùng hai phép soát — header `model:`/`diff:` và placeholder `<…>`/TODO còn sót. Ba bản regex trôi
 * dần (check-eval nhận khoá sau `·`, review-gate cắt cả rào ``` và comment HTML). Gom về đây để đổi một chỗ; MÃ LUẬT và
 * THÔNG ĐIỆP vẫn ở script gọi (rule-cover.js, accept.js và test.js so theo chúng).
 *
 * gioiHan: chỉ đọc chuỗi; không biết khoá header nằm trong header hay thân bài (chế độ `sauChấm` nhận `… · model: x` ở
 * bất kỳ dòng nào). "Bằng chứng mới hơn code" KHÔNG gom ở đây: V10 so chuỗi sha, E4b6 dùng `merge-base --is-ancestor`,
 * A1b/A3d đếm `git log sha..HEAD` theo màn — bốn câu hỏi khác nhau, chung mỗi chữ `git`.
 *
 * Vì sao có `run` (hook-review 07/10/2026, gói A): validate-done tin số `N passed` verifier CHÉP vào verification.md — một bài
 * viết tay đủ hình (exit 0, file:line, số, bảng gieo) là PASS mà không lệnh nào từng chạy (ca test.js "xanh" chính là hình
 * viết tay). Cổng chỉ tin cái nó tự đo được: biên lai do chính wrapper này ghi lúc lệnh chạy, khoá theo HEAD + lệnh Proof
 * của plan, nên "đã chạy Proof ở commit này" là một file máy đối được (V-RECEIPT), không là một câu.
 * gioiHan (run): biên lai là file thường trong `.claude/` — agent vẫn tự viết tay được JSON; nó nâng giá của PASS giả từ
 * "viết một câu" lên "giả một file khớp sha lệnh + HEAD + số passed", không chứng minh tuyệt đối. stdoutSha256 để đối chiếu
 * khi có bản log, máy không tự soát. KHÔNG bật `shell` (scan-skills luật `shell` 🔴): argv chạy thẳng; Proof cần &&/ống thì
 * người gọi tự viết `-- sh -c "…"`. Windows: `npx`/`npm` là .cmd — gọi `-- cmd /c npx …`.
 */
'use strict';

const esc = (k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Giá trị khoá header `> k: v`. sauChấm = khoá được đứng sau `·` trên cùng dòng (`> ngày: … · model: x`) — kiểu check-eval. */
function giáTrịHeader(txt, k, { sauChấm = false } = {}) {
  const re = sauChấm
    ? new RegExp(`^>?\\s*(?:.*·\\s*)?${esc(k)}:\\s*\`?([^\`\\n·]+)`, 'mi')
    : new RegExp(`^>?\\s*${esc(k)}:\\s*(\\S+)`, 'mi');
  return (txt.match(re) || [])[1];
}

/** Các khoá header còn thiếu (theo thứ tự truyền vào). */
const thiếuHeader = (txt, keys, opts) => keys.filter((k) => !giáTrịHeader(txt, k, opts));

/** Bỏ code span `…` (không bỏ rào ```) — kiểu V5/E6b. */
const bỏCodeSpan = (s) => s.replace(/`[^`]*`/g, '');
/** Bỏ comment HTML, rào ``` và code span một dòng — kiểu review-gate (thân review còn soát từ mơ hồ, dấu !). */
const bỏCode = (s) => s.replace(/<!--[\s\S]*?-->/g, ' ').replace(/```[\s\S]*?```/g, ' ').replace(/`[^`\n]*`/g, ' ');

/** Còn placeholder `<…>` hay TODO ngoài code span? (V5 · E6b) */
const cònPlaceholder = (txt) => /<[^>]+>|\bTODO\b/.test(bỏCodeSpan(txt));

/** Chi tiết cho review-gate: danh sách `<…>` (≤60 ký tự, một dòng) + có TODO — trên văn bản ĐÃ bỏ code. */
const placeholderTrong = (plain) => ({ ph: [...new Set(plain.match(/<[^>\n]{1,60}>/g) || [])], todo: /\bTODO\b/.test(plain) });

/* ─── Biên lai Proof (giao diện 3 của spec hook-điểm-mù 07/10/2026) ───────────────────────────────────────────── */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

/** Tách token kiểu shell: nháy đơn/kép, `\` thoát ký tự. Không mở rộng biến/glob — chỉ để so khoá. */
function tách(s) {
  const out = []; let cur = null, q = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (ch === q) q = null; else if (ch === '\\' && q === '"' && i + 1 < s.length) cur += s[++i]; else cur += ch; continue; }
    if (ch === "'" || ch === '"') { q = ch; cur = cur || ''; continue; }
    if (ch === '\\' && i + 1 < s.length) { cur = (cur || '') + s[++i]; continue; }
    if (/\s/.test(ch)) { if (cur !== null) { out.push(cur); cur = null; } continue; }
    cur = (cur || '') + ch;
  }
  if (cur !== null) out.push(cur);
  return out;
}
/** Lệnh chuẩn hoá: chuỗi (dòng Proof của plan) hoặc mảng argv → token nối một dấu cách; bóc vỏ `sh -c "…"` / `cmd /c …`. */
function chuẩnHoáLệnh(x) {
  let t = Array.isArray(x) ? (x.length === 1 ? tách(x[0]) : x.slice()) : tách(String(x).trim().replace(/^`|`$/g, ''));
  for (let i = 0; i < 3; i++) {
    if (t.length === 3 && /^(?:\/\S*\/)?(?:ba|z)?sh$/.test(t[0]) && t[1] === '-c') t = tách(t[2]);
    else if (t.length >= 3 && /^cmd(?:\.exe)?$/i.test(t[0]) && /^\/c$/i.test(t[1])) t = t.length === 3 ? tách(t[2]) : t.slice(2);
    else break;
  }
  return t.join(' ').trim();
}
const sha8Lệnh = (x) => crypto.createHash('sha256').update(chuẩnHoáLệnh(x)).digest('hex').slice(0, 8);
const THƯ_MỤC_BIÊN_LAI = path.join('.claude', 'ac-runs');

/** Số passed/failed từ DÒNG TỔNG của runner (lấy lần xuất hiện cuối). Không nhận ra → { passed: null, failed: null }. */
function đọcTổng(text) {
  const t = String(text || '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
  const cuối = (re) => { let m = null; for (const x of t.matchAll(re)) m = x; return m; };
  const số = (s, k) => { const m = s.match(new RegExp(`(\\d+)\\s+${k}`)); return m ? +m[1] : 0; };
  let m;
  if ((m = cuối(/^\s*Tests:\s+(.+)$/gm))) return { passed: số(m[1], 'passed'), failed: số(m[1], 'failed'), runner: 'jest' };          // jest
  if ((m = cuối(/^\s*Tests\s{2,}(.+)$/gm))) return { passed: số(m[1], 'passed'), failed: số(m[1], 'failed'), runner: 'vitest' };      // vitest
  if ((m = cuối(/^=+\s*(.*\b(?:passed|failed|error|errors|no tests ran)\b.*?)\s+in\s+[\d.]+s\b.*=+\s*$/gm))) return { passed: số(m[1], 'passed'), failed: số(m[1], 'failed') + số(m[1], 'errors?'), runner: 'pytest' };
  const np = cuối(/^[#ℹ]\s*pass\s+(\d+)\s*$/gm), nf = cuối(/^[#ℹ]\s*fail\s+(\d+)\s*$/gm);                                           // node:test (tap/spec)
  if (np) return { passed: +np[1], failed: nf ? +nf[1] : 0, runner: 'node:test' };
  const pp = cuối(/^\s+(\d+) passed(?: \([^)]*\))?\s*$/gm), pf = cuối(/^\s+(\d+) failed\s*$/gm);                                     // playwright
  if (pp || pf) return { passed: pp ? +pp[1] : 0, failed: pf ? +pf[1] : 0, runner: 'playwright' };
  const mp = cuối(/^\s*(\d+) passing\b/gm), mf = cuối(/^\s*(\d+) failing\b/gm);                                                       // mocha
  if (mp || mf) return { passed: mp ? +mp[1] : 0, failed: mf ? +mf[1] : 0, runner: 'mocha' };
  return { passed: null, failed: null, runner: null };
}

/** Đọc mọi biên lai dưới các gốc cho trước (bỏ file hỏng). */
function đọcBiênLai(gốcs) {
  const out = [];
  for (const g of [...new Set(gốcs.filter(Boolean))]) {
    const d = path.join(g, THƯ_MỤC_BIÊN_LAI); let fs_ = [];
    try { fs_ = fs.readdirSync(d).filter((f) => f.endsWith('.json')); } catch { continue; }
    for (const f of fs_) { try { const j = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')); if (j && typeof j.cmd === 'string') out.push(Object.assign(j, { _file: path.join(d, f) })); } catch { /* biên lai hỏng = không có */ } }
  }
  return out;
}

module.exports = { giáTrịHeader, thiếuHeader, bỏCodeSpan, bỏCode, cònPlaceholder, placeholderTrong, tách, chuẩnHoáLệnh, sha8Lệnh, đọcTổng, đọcBiênLai, THƯ_MỤC_BIÊN_LAI };

/* ─── CLI: evidence.js run [--screen S03] -- <lệnh…> ─────────────────────────────────────────────────────────────── */
if (require.main === module) {
  if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: output lệnh con > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
  if (process.stderr._handle && process.stderr._handle.setBlocking) process.stderr._handle.setBlocking(true);
  const argv = process.argv.slice(2);
  const iSep = argv.indexOf('--');
  const trước = iSep >= 0 ? argv.slice(0, iSep) : argv, lệnh = iSep >= 0 ? argv.slice(iSep + 1) : [];
  if (trước[0] !== 'run' || !lệnh.length) {
    console.error('Dùng: evidence.js run [--screen <Mã>] -- <lệnh Proof…>   (vd: evidence.js run --screen S03 -- npx vitest run -t \'TC-S03-02\')');
    process.exit(2);
  }
  const screen = trước.includes('--screen') ? trước[trước.indexOf('--screen') + 1] || null : null;
  const git = (...a) => { const r = spawnSync('git', a, { encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; };
  const head = git('rev-parse', 'HEAD');
  const gốc = git('rev-parse', '--show-toplevel') || process.cwd();
  if (lệnh.length === 1 && /\s/.test(lệnh[0])) process.stderr.write(`[evidence] một tham số có dấu cách — chạy như TÊN chương trình; Proof cần shell thì gọi: -- sh -c "${lệnh[0]}"\n`);
  const child = spawn(lệnh[0], lệnh.slice(1), { stdio: ['inherit', 'pipe', 'pipe'] });
  const băm = crypto.createHash('sha256'); const giữ = []; let giữDài = 0;
  const đuôi = (b) => { giữ.push(b); giữDài += b.length; while (giữDài > 4e6 && giữ.length > 1) giữDài -= giữ.shift().length; };   // dòng tổng nằm cuối — giữ ≤ 4 MB đuôi
  child.stdout.on('data', (b) => { process.stdout.write(b); băm.update(b); đuôi(b); });
  child.stderr.on('data', (b) => { process.stderr.write(b); đuôi(b); });
  let xong = false;
  const kết = (exit) => {
    if (xong) return; xong = true;
    const { passed, failed } = đọcTổng(Buffer.concat(giữ).toString('utf8'));
    const biênLai = { ts: new Date().toISOString(), head, cmd: chuẩnHoáLệnh(lệnh), exit, passed, failed, stdoutSha256: băm.digest('hex'), screen };
    try {
      const d = path.join(gốc, THƯ_MỤC_BIÊN_LAI); fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(path.join(d, `${head ? head.slice(0, 12) : 'nogit'}-${sha8Lệnh(lệnh)}.json`), JSON.stringify(biênLai, null, 1) + '\n');
    } catch (e) { process.stderr.write(`[evidence] không ghi được biên lai: ${e.message}\n`); }
    process.exit(exit);
  };
  child.on('error', (e) => { process.stderr.write(`[evidence] không chạy được lệnh: ${e.message}\n`); kết(127); });
  child.on('close', (code, sig) => kết(code === null ? (sig ? 128 + (require('os').constants.signals[sig] || 1) : 1) : code));
}
