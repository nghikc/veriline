#!/usr/bin/env node
/*
 * ac-verify/accept.js — PO NHẬN hay TRẢ một màn, CHỈ bằng bằng chứng máy đã có. Zero-dependency.
 * (Dời từ ac-po/scripts/ 08/10/2026 — cổng NHẬN là lõi công khai; ac-po (gói Pro) gọi sang đây.)
 *
 *   node .claude/skills/ac-verify/scripts/accept.js docs <Mã màn> [--root <code>] [--eval-min 80] [--plain|--json]
 *
 * Cổng 0 (hook-review 07/10/2026): integrity — ba-toolkit/integrity.js --json ĐẦU TIÊN: toolkit ở đích lệch nguồn (checker bị
 *   vá, hook bị gỡ) mà không có mục duyệt trong .claude/ba-toolkit-local.json → ✗ [A0], trảLoại 'code' (mọi cổng dưới chạy
 *   bằng chính các checker đó — kết quả của checker đã vá không đáng tin). integrity vắng → in "integrity chưa cài", không TRẢ;
 *   exit 2 (không kiểm được) → chỉ in lý do.
 * Bốn cổng, mỗi cổng gọi checker CÓ SẴN (không viết lại luật):
 *   1. verify  — ac-verify/validate-done.js exit 0  (verification.md tồn tại, verdict PASS, có file:line) VÀ verification
 *               MỚI HƠN code: cùng luật với review — commit scope `(<Mã>)` chạm file ngoài docs/.claude sau `b` của
 *               `> diff: a..b` trong verification.md → ✗ "chạy ac-verify vòng kế" (verifier chưa thấy commit đó; trảLoại 'code')
 *   2. review  — docs/Ho-so/reviews/<Mã>-*.md MỚI NHẤT: verdict ≠ REQUEST_CHANGES (qua ac-judge/review-gate.js) VÀ mới hơn code:
 *               không có commit scope `(<Mã>)` chạm file ngoài docs/.claude sau `b` của `> diff: a..b` (sha ghi thêm trên dòng = đã đọc)
 *   3. eval    — TUỲ CHỌN: skill ac-eval (gói Pro) vắng → cổng "không áp", không đỏ, không đọc bản chấm.
 *               docs/Ho-so/eval/<Mã>-*.md MỚI NHẤT (nếu có): Điểm cuối ≥ --eval-min; không có bản chấm → "chưa chấm", không phạt.
 *               Bản chấm phải còn đại diện cho test.md + code HIỆN TẠI (24/09, dự án helpdesk S15 ✓ 94,8% trong khi eval thiếu
 *               TC-S15-81/82 do `6c2938d` thêm sau): ac-eval/check-eval.js (subprocess) báo case chưa chấm/trùng/lạ (E2e/E2f/E2g)
 *               hay Điểm cuối lệch bảng (E5b) → ✗ [A3c]; lỗi hình khác của bản chấm → chỉ cảnh báo (eval là cổng tuỳ chọn, hình
 *               là việc của ac-eval). Commit scope `(<Mã>)` chạm code sau `b` của `> diff:` bản chấm, HOẶC test.md của màn đổi
 *               sau commit ghi bản chấm → ✗ [A3d] "chạy ac-eval lại".
 *   4. tc-layer— ba-conformance/check-tc-layer.js --screen <Mã> exit 0 (test xanh ở đúng tầng) VÀ JSON không có `chuaKiem`
 *               cho màn: TC nằm ở bảng không cột Cách chạy thì cổng KHÔNG đọc được gì — "chưa kiểm" là kết quả riêng, không phải
 *               sạch (hook-review 07/10/2026) → ✗ [A4c], trảLoại 'tài-liệu' (bổ sung cột: ba-screen-spec <Mã> --bo-sung cach-chay).
 * MỚI HƠN CODE (cổng 1/2/3) xét HỢP của hai tập commit sau `b`: (a) scope `(<Mã>)` chạm file ngoài docs/.claude (luật cũ);
 *   (b) commit BẤT KỲ chạm file plan.md của màn khai (`- Create:`/`- Modify:`/`- Test:`) — đổi scope (`fix:` trần, `feat(S04)`)
 *   không còn là lối né (hook-review 07/10/2026). Plan không khai file → chỉ (a).
 * SỔ NHẬN: mỗi lần chạy append `{ ts, man, head, ketQua: 'NHẬN'|'TRẢ', traLoai }` vào `.claude/ac-accept.jsonl` ở gốc dự án
 *   (thư mục cha của docs/) — hook-gate đối `dev ✅` với dòng NHẬN ở đây. Chỉ ghi khi ở đó có `.claude/` (example/docs của
 *   repo nguồn không ghi).
 * Verdict: NHẬN khi 1, 2, 4 đạt và 3 không dưới ngưỡng; còn lại TRẢ kèm cổng nào hỏng và `trảLoại`: 'code' (phái builder) hay
 * 'tài-liệu' (validate-done `chỉCònTcSai` — mọi chỗ đỏ là TC sai tiền đề có trích srs → PO sửa test.md, không phái builder;
 * eval dưới ngưỡng mà bỏ các TC đó thì đạt cũng tính là tài liệu) hay 'go-live' (verify FAIL mà MỌI dòng FAIL chỉ nhắc TC
 * trong Trace của PD `[go-live]` Treo trỏ màn — hoặc nhắc thẳng mã PD đó — và không `lỗi-code` nào ngoài tập đó: code xong,
 * thiếu credential/tài khoản/hạ tầng người cấp → không phái builder, không tính vòng TRẢ; quy ước ở conv-ledgers "Loại chặn
 * go-live"). Lẫn TC sai tiền đề với go-live → 'tài-liệu' trước (sửa test.md xong, lượt sau ra go-live). Thiếu verification = TRẢ
 * (không có bằng chứng ≠ không có lỗi). Exit 0 = NHẬN · 1 = TRẢ · 2 = không chạy được (không thấy màn/docs).
 *
 * Vì sao có: PO nhận màn là quyết định có hậu quả (dev = ✅, sang việc kế). Nếu PO "đọc rồi thấy ổn" thì cả kỷ luật
 * tác-giả-≠-người-chấm đổ ở bước cuối. Script này bắt PO chỉ được nhận khi máy đã nói PASS/APPROVE — PO thêm được
 * lý do TRẢ (nghiệp vụ), không thêm được lý do NHẬN.
 *
 * Mã luật (rule-cover.js): mỗi lý do TRẢ một mã — `--rules` in JSON [{mã, môTả}]; --plain in `✗ cổng … [A1a]`; --json thêm
 * `luật` ở từng cổng và cấp trên; có BA_RULE_LOG thì ghi mã đã bắn. trảLoại (tài-liệu/go-live) là cách ROUTE, không phải luật.
 *
 * gioiHan: không đọc nội dung finding — 🟠 trong review vẫn NHẬN (verdict COMMENT), PO phải tự mở WI cho 🟠;
 * review/eval "mới nhất" theo tên file (ngày trong tên), không theo mtime; không chạy test — tin verification.md
 * (do ac-verifier fresh viết) và check-tc-layer.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const RC = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'rule-cover.js'));
RC.inLuật(argv, [
  ['A1a', 'verify: validate-done exit ≠ 0'], ['A1b', 'verify: verification cũ hơn commit scope (<Mã>) chạm code'],
  ['A2a', 'review: không có docs/Ho-so/reviews/<Mã>-*.md'], ['A2b', 'review: verdict REQUEST_CHANGES/không đọc được'],
  ['A2c', 'review: review-gate exit ≠ 0'], ['A2d', 'review: cũ hơn commit scope (<Mã>) chạm code'],
  ['A3a', 'eval: Điểm cuối dưới ngưỡng'], ['A3b', 'eval: không đọc được Điểm cuối'],
  ['A3c', 'eval: check-eval báo case chưa chấm/trùng/lạ hay Điểm cuối lệch — không phủ test.md hiện tại'], ['A3d', 'eval: cũ hơn commit scope (<Mã>) chạm code hoặc test.md đổi sau bản chấm'],
  ['A4', 'tc-layer: check-tc-layer exit ≠ 0'], ['A4c', 'tc-layer: chuaKiem — TC ở bảng không cột Cách chạy, cổng không đọc được'],
  ['A0', 'integrity: toolkit lệch nguồn không duyệt (integrity.js exit 1)'],
].filter(([m]) => !/^A3/.test(m) || fs.existsSync(path.join(__dirname, '..', '..', 'ac-eval', 'SKILL.md'))));   // ac-eval (gói Pro) vắng → luật A3 không áp, không khai
const opt = (k, d = null) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const pos = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && /^--(root|eval-min)$/.test(argv[i - 1])));
const DOCS = path.resolve(pos[0] || 'docs'); const SCREEN = pos[1];
const ROOT = path.resolve(opt('--root', path.dirname(DOCS)));
const EVAL_MIN = +opt('--eval-min', 80);
const JSON_MODE = argv.includes('--json');
const SK = path.resolve(__dirname, '..', '..');
const { HOSO, readDoc } = require(path.join(SK, 'ba-toolkit', 'scripts', 'docpath.js'));
if (!SCREEN || !fs.existsSync(DOCS)) { console.error('Dùng: accept.js <docs> <Mã màn> [--root <code>]'); process.exit(2); }

// Bằng chứng phải MỚI HƠN code (18/09 WI-46 cho review; đợt 5 áp cho verification): đầu `> diff: a..b` — commit sau `b`
// có SCOPE là màn (`fix(S16):`) chạm file ngoài docs/.claude mà sha không ghi thêm trên dòng diff = code đổi mà người chấm chưa thấy.
// Commit chỉ nhắc màn trong thân message không tính (thà sót còn hơn đòi chấm lại vì commit màn khác); `b` = HEAD/không phải sha → bỏ qua.
const GIT_TOP = (() => { const r = spawnSync('git', ['-C', ROOT, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; })();   // --root có thể là app/ trong repo
function commitSauBằngChứng(txt) {
  const đầuDiff = (txt.match(/^>?\s*diff:\s*[`]?(\S+?)\.\.([0-9a-f]{7,40}|HEAD)\b/mi) || []);
  if (!đầuDiff[2] || đầuDiff[2] === 'HEAD' || !GIT_TOP) return null;
  // chỉ commit chạm file NGOÀI docs/ (sổ PO/tracking nhắc màn không phải code đổi)
  const gl = spawnSync('git', ['-C', GIT_TOP, 'log', '--oneline', `${đầuDiff[2]}..HEAD`, '--grep', SCREEN, '--', '.', ':(exclude)docs', ':(exclude).claude'], { encoding: 'utf8' });
  const đãGhi = (txt.match(/^>?\s*diff:[^\n]*/mi) || [''])[0].match(/[0-9a-f]{7,40}/g) || [];   // sha ghi thêm trên dòng diff ("+ `0e3ce84`") = đã đọc
  const chưaĐọc = (l) => !đãGhi.some((h) => l.startsWith(h.slice(0, 7)));
  const n = (gl.stdout || '').trim().split('\n').filter((l) => new RegExp(`^[0-9a-f]+ [a-z]+\\(${SCREEN}\\)`).test(l) && chưaĐọc(l));
  // (b) commit bất kỳ chạm file plan khai — scope message không còn quyết định (hook-review 07/10/2026)
  let theoFile = [];
  if (filePlan.length) {
    const gf = spawnSync('git', ['-C', ROOT, 'log', '--oneline', `${đầuDiff[2]}..HEAD`, '--', ...filePlan], { encoding: 'utf8', maxBuffer: 1e8 });
    if (gf.status === 0) theoFile = (gf.stdout || '').trim().split('\n').filter(Boolean).filter(chưaĐọc);
  }
  const hợp = [...new Set([...(gl.status === 0 ? n : []), ...theoFile])];
  return hợp.length ? { n: hợp.length, b: đầuDiff[2].slice(0, 7), đầu: hợp[0].slice(0, 60), theoFile: theoFile.length } : null;
}

// Gốc dự án = cha của docs/ khi ở đó có .claude/ — sổ nhận + integrity đọc/ghi ở đây. KHÔNG leo lên gốc git: chạy trên
// example/docs của repo nguồn sẽ ghi sổ vào .claude/ của chính toolkit (hook-review 07/10/2026, tự gặp khi chạy thử).
const GỐC_DA = fs.existsSync(path.join(path.dirname(DOCS), '.claude')) ? path.dirname(DOCS) : null;

// File plan.md của màn khai (`- Create:`/`- Modify:`/`- Test:` trong `**Files:**`) — độ mới bằng chứng tính theo file, không
// chỉ theo scope message (hook-review 07/10/2026: `fix: …` trần sửa code màn sau verify vẫn NHẬN). Đường dẫn tương đối ROOT.
const filePlan = (() => {
  let dir = null;
  (function walk(d) { let es = []; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) { if (!e.isDirectory() || /^(Ho-so|removed)$/.test(e.name)) continue; const p = path.join(d, e.name);
      if (new RegExp(`^${SCREEN}\\b`).test(e.name)) { dir = p; return; } walk(p); if (dir) return; } })(DOCS);
  const pf = dir && path.join(dir, 'plan.md'); if (!pf || !fs.existsSync(pf)) return [];
  const out = new Set();
  for (const m of fs.readFileSync(pf, 'utf8').matchAll(/^\s*-\s*(?:Create|Modify|Test)\s*:\s*(.*)$/gmi))
    for (const x of m[1].matchAll(/`([^`]+)`/g)) { const f = x[1].trim().replace(/:\d+(?:[-–]\d+)?$/, ''); if (f && !/[*?\s]/.test(f) && !/^\.\.?\//.test(f) && !path.isAbsolute(f)) out.add(f); }
  return [...out];
})();

// Commit TẠO/SỬA một file cuối cùng (sha đầy đủ) — null khi không git / file chưa commit
const commitCuối = (f) => { if (!GIT_TOP) return null; const r = spawnSync('git', ['-C', GIT_TOP, 'log', '-1', '--format=%H', '--', f], { encoding: 'utf8' }); return r.status === 0 && r.stdout.trim() ? r.stdout.trim() : null; };
const logSau = (sha, files) => { const r = spawnSync('git', ['-C', GIT_TOP, 'log', '--format=%h %s', `${sha}..HEAD`, '--', ...files], { encoding: 'utf8', maxBuffer: 1e8 }); return r.status === 0 ? r.stdout.trim().split('\n').filter(Boolean) : []; };
const cảnhBáo = [];
const run = (script, args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', maxBuffer: 1e8 });
const cổng = [];
const đẩy = (tên, đạt, bằngChứng, ghi, luật = []) => cổng.push({ cổng: tên, đạt, bằngChứng, ghi: ghi || '', luật: đạt ? [] : luật });

// 0. integrity (hook-review 07/10/2026) — checker bị vá thì mọi cổng dưới vô nghĩa
const integrity = (() => {
  const IS = path.join(SK, 'ba-toolkit', 'scripts', 'integrity.js');
  if (!fs.existsSync(IS)) return { trạngThái: 'chưa cài', ghi: 'integrity chưa cài — không đối được toolkit với nguồn' };
  const r = run(IS, ['--root', GỐC_DA || path.dirname(DOCS), '--json', '--no-cache']);
  let j = null; try { j = JSON.parse(r.stdout); } catch { /* không JSON */ }
  if (r.status === 0) return { trạngThái: 'khớp', nguồn: j && j.nguon };
  if (r.status === 1 && j && Array.isArray(j.lech)) {
    const duyệt = new Set(j.duyet || []); const lệch = j.lech.filter((x) => !duyệt.has(x.file));
    if (lệch.length) return { trạngThái: 'lệch', lệch, nguồn: j.nguon };
    return { trạngThái: 'khớp', nguồn: j.nguon };
  }
  return { trạngThái: 'chưa kiểm', ghi: (j && j.chuaKiem) || (r.stderr || '').trim().split('\n')[0] || `exit ${r.status}` };
})();
if (integrity.trạngThái === 'lệch') đẩy('integrity', false, `integrity.js exit 1 (${integrity.nguồn || '?'})`, `toolkit lệch nguồn không duyệt: ${integrity.lệch.slice(0, 3).map((x) => `${x.file} (${x.loai})`).join(', ')}${integrity.lệch.length > 3 ? ` (+${integrity.lệch.length - 3})` : ''} — trả về nguồn (ba-export update) hoặc ghi mục duyệt .claude/ba-toolkit-local.json`, ['A0']);

// 1. verify
let phânLoại = null, chỉCònTcSai = false, vd = {};
{
  const r = run(path.join(SK, 'ac-verify', 'scripts', 'validate-done.js'), [DOCS, SCREEN, '--json']);
  let j = {}; try { j = JSON.parse(r.stdout || '{}'); } catch { /* không phải JSON → coi như lỗi */ }
  phânLoại = j.phânLoại || null; chỉCònTcSai = !!j.chỉCònTcSai; vd = j;
  const đầu = j.lỗi ? (j.lỗi.length ? `CHƯA XONG — ${j.lỗi.length} lý do: ${j.lỗi[0]}` : 'PASS') : (r.stderr || '').trim().split('\n')[0];
  đẩy('verify', r.status === 0, `validate-done.js exit ${r.status}`, (đầu || '').slice(0, 160), ['A1a']);
  const vf = j.folder ? path.join(DOCS, j.folder, 'verification.md') : null;
  const sau = vf && fs.existsSync(vf) ? commitSauBằngChứng(fs.readFileSync(vf, 'utf8')) : null;
  // 1c. CẢNH BÁO (không chặn): commit scope KHÁC (WI/màn khác) đổi file mà verification trích `file:line` sau `b` — bằng chứng
  // có thể đã trôi (dự án helpdesk S12 trích `scope.guard.ts:36`, file đổi bởi WI-53 `feat(S15)`). Không chặn: thà sót còn hơn đòi
  // verify lại mỗi khi màn khác chạm file chung; commit scope màn này đã là A1b.
  if (vf && fs.existsSync(vf) && GIT_TOP && !sau) {
    const vt = fs.readFileSync(vf, 'utf8');
    const b = (vt.match(/^>?\s*diff:\s*[`]?\S+?\.\.([0-9a-f]{7,40})\b/mi) || [])[1];
    const đãGhi = (vt.match(/^>?\s*diff:[^\n]*/mi) || [''])[0].match(/[0-9a-f]{7,40}/g) || [];
    const gốc = (vt.match(/gốc code:\s*`?([^`·\s(*]+)/i) || [])[1];
    const tệp = [...new Set([...vt.matchAll(/([\w.-]+(?:\/[\w.-]+)+\.(?:[cm]?[jt]sx?|py|go|rs|java|kt|sql|prisma|vue|svelte)):\d+/g)].map((m) => m[1]))]
      .map((x) => [x, gốc ? path.join(gốc, x) : null].find((q) => q && fs.existsSync(path.join(GIT_TOP, q)))).filter(Boolean).filter((x) => !/(^|\/)(tests?|__tests__|e2e)\//.test(x) && !/\.(spec|test)\./.test(x)).slice(0, 80);
    if (b && tệp.length) {
      const lạ = logSau(b, tệp).filter((l) => !new RegExp(`^[0-9a-f]+ [a-z]+\\(${SCREEN}\\)`).test(l) && !đãGhi.some((h) => l.startsWith(h.slice(0, 7))));
      if (lạ.length) cảnhBáo.push(`verification trích file:line ở ${lạ.length} commit scope khác đổi sau ${b.slice(0, 7)} (${lạ[0].slice(0, 70)}) — cần verify lại (ac-verify vòng kế), không chặn nhận`);
    }
  }
  if (sau) Object.assign(cổng[cổng.length - 1], { đạt: false, vìCũ: true, luật: [...(r.status === 0 ? [] : ['A1a']), 'A1b'], ghi: `verification cũ hơn ${sau.n} commit chạm ${SCREEN} sau ${sau.b} (${sau.đầu}…) — chạy ac-verify vòng kế` + (r.status === 0 ? '' : ` · ${(đầu || '').slice(0, 100)}`) });
}
// 1b. PD chặn go-live — conv-ledgers "Loại chặn go-live": `| PD-nn | [go-live] … | S07 | <ai cấp> | … | Treo | TC-S07-.. |`.
// Không đọc lại luật verification (validate-done đã soát hình); chỉ đọc mục `## FAIL` để biết MỌI chỗ đỏ có phải chỉ vì thiếu thứ người cấp.
const goLive = { pd: [], tc: [], chỉCònGoLive: false, lẫnTcSai: false };
{
  const RE_TC = /\bTC-[A-Z0-9-]*\d\b/g;
  for (const l of (readDoc(DOCS, '00-decisions.md') || '').split('\n')) {
    const m = l.match(/^\|\s*\**(PD-\d+)\**\s*\|/);
    if (!m || !/\[go-live\]/i.test(l) || !/\|\s*Treo\s*\|/.test(l) || !new RegExp(`\\b${SCREEN}\\b`).test(l)) continue;
    goLive.pd.push(m[1]); for (const t of l.match(RE_TC) || []) if (!goLive.tc.includes(t)) goLive.tc.push(t);
  }
  // So theo MÃ luật, không theo câu chữ: validate-done khi verdict ≠ PASS chỉ để V1b trong `luật` (luật hình khác vào cảnhBáo) —
  // bản cũ so chuỗi `lỗi` nên một luật hình mới bắn trên bài FAIL tắt nhánh go-live im lặng (dự án helpdesk S14 24/09: V4a×4).
  const chỉVerdict = Array.isArray(vd.luật) ? (vd.luật.length === 1 && vd.luật[0] === 'V1b' && (vd.verdict === undefined || vd.verdict === 'FAIL'))
    : (Array.isArray(vd.lỗi) && vd.lỗi.length === 1 && /^verdict = FAIL$/.test(vd.lỗi[0]));   // validate-done cũ không có `luật`
  if (goLive.pd.length && chỉVerdict && vd.folder) {
    const vf = path.join(DOCS, vd.folder, 'verification.md');
    const v = fs.existsSync(vf) ? fs.readFileSync(vf, 'utf8') : '';
    const dòng = ((v.match(/^## FAIL[^\n]*\n([\s\S]*?)(?=^## |\*\*Verdict:\*\*)/m) || [])[1] || '').split('\n').filter((l) => /^-\s*\S/.test(l));
    const gl = new Set(goLive.tc), sai = new Set(((phânLoại || {}).tcSaiTiềnĐề || []).map((x) => x.tc));
    const nhắcPD = (l) => goLive.pd.some((p) => new RegExp(`\\b${p}\\b`).test(l));
    let cóGoLive = false, cóSai = false, hết = dòng.length > 0;
    for (const l of dòng) {
      const ids = l.match(/TC-[A-Z0-9-]+/g) || [];
      if (nhắcPD(l) || (ids.length && ids.some((i) => gl.has(i)))) cóGoLive = true;
      if (ids.some((i) => sai.has(i) && !gl.has(i))) cóSai = true;
      if (!(nhắcPD(l) && ids.every((i) => gl.has(i) || sai.has(i))) && !(ids.length && ids.every((i) => gl.has(i) || sai.has(i)))) hết = false;
    }
    const lỗiCodeNgoài = ((phânLoại || {}).lỗiCode || []).some((x) => !gl.has(x.tc));
    goLive.chỉCònGoLive = hết && cóGoLive && !lỗiCodeNgoài; goLive.lẫnTcSai = goLive.chỉCònGoLive && cóSai;
  }
}
// 2. review mới nhất
const hoso = fs.existsSync(path.join(DOCS, HOSO)) ? path.join(DOCS, HOSO) : DOCS;
// "Mới nhất" = ngày lớn nhất rồi vòng lớn nhất (`S15-2026-09-16-r2.md` > `S15-2026-09-16.md`) — sort theo tên thì `-r2.md` đứng TRƯỚC `.md`
// (dấu `-` < `.`), accept đọc nhầm bản vòng 1 REQUEST_CHANGES trong khi vòng 2 đã APPROVE (dự án helpdesk S15, 16/09/2026).
const mớiNhất = (dir, prefix) => {
  if (!fs.existsSync(dir)) return null;
  const xs = fs.readdirSync(dir).filter((f) => f.startsWith(prefix + '-') && f.endsWith('.md')).map((f) => { const m = f.match(/-(\d{4}-\d{2}-\d{2})(?:-r(\d+))?\.md$/); return { f, ngày: m ? m[1] : '', vòng: m && m[2] ? +m[2] : 1 }; }).sort((a, b) => a.ngày.localeCompare(b.ngày) || a.vòng - b.vòng);
  if (!xs.length) return null;
  const cuối = xs[xs.length - 1]; const trước = xs.length > 1 ? xs[xs.length - 2] : null;
  return Object.assign(path.join(dir, cuối.f), { vòng: cuối.vòng, prev: cuối.vòng > 1 && trước ? path.join(dir, trước.f) : null });
};
{
  const f = mớiNhất(path.join(hoso, 'reviews'), SCREEN);
  if (!f) đẩy('review', false, 'không có docs/Ho-so/reviews/' + SCREEN + '-*.md', 'chưa review — chạy ac-judge', ['A2a']);
  else {
    const txt = fs.readFileSync(String(f), 'utf8'); const v = (txt.match(/^\*\*Verdict:\*\*\s*(\S+)/m) || [])[1] || '?';
    // vòng ≥ 2 phải qua gate với --prev (bản trước) — review-gate đòi sổ giải quyết J-.. của vòng trước
    const g = run(path.join(SK, 'ac-judge', 'scripts', 'review-gate.js'), [String(f), '--root', ROOT, ...(f.prev ? ['--prev', f.prev] : [])]);
    // Review phải MỚI HƠN code: đầu `> diff: a..b` của review — commit sau `b` mà message nhắc màn (`(S16)`, `S16`) hoặc WI trace
    // tới màn = code đổi mà chưa ai review (dự án helpdesk 18/09: WI-46 sửa S16 api.ts, accept NHẬN bằng review r2 hôm trước).
    const sau = commitSauBằngChứng(txt);
    const cũ = sau ? `review cũ hơn ${sau.n} commit chạm ${SCREEN} sau ${sau.b} (${sau.đầu}…) — chạy ac-judge vòng kế` : '';
    đẩy('review', v !== 'REQUEST_CHANGES' && v !== '?' && g.status === 0 && !cũ, `${path.relative(DOCS, String(f))}: verdict ${v}${f.vòng > 1 ? ' (vòng ' + f.vòng + ')' : ''} · review-gate exit ${g.status}`, cũ || (v === 'COMMENT' ? 'có 🟠 — PO mở WI cho từng 🟠 trước khi sang việc kế' : ''),
      [...(v === 'REQUEST_CHANGES' || v === '?' ? ['A2b'] : []), ...(g.status !== 0 ? ['A2c'] : []), ...(cũ ? ['A2d'] : [])]);
  }
}
// 3. eval mới nhất (tùy chọn)
{
  const f = fs.existsSync(path.join(SK, 'ac-eval', 'SKILL.md')) ? mớiNhất(path.join(hoso, 'eval'), SCREEN) : 'vắng';
  if (f === 'vắng') đẩy('eval', true, 'không áp — ac-eval không có trong bản cài này (gói Pro)', '');
  else if (!f) đẩy('eval', true, 'chưa có bản chấm ac-eval — không phạt', 'muốn số so sánh được → ac-eval ' + SCREEN);
  else {
    const txt = fs.readFileSync(String(f), 'utf8'); const m = txt.match(/\*\*Điểm cuối:\*\*\s*\d+\/\d+\s*=\s*([\d.,]+)\s*%/);
    const p = m ? parseFloat(m[1].replace(',', '.')) : null;
    đẩy('eval', p !== null && p >= EVAL_MIN, `${path.relative(DOCS, String(f))}: ${p === null ? 'không đọc được Điểm cuối' : p + '% (ngưỡng ' + EVAL_MIN + '%)'}`, '', [p === null ? 'A3b' : 'A3a']);
    const cEval = cổng[cổng.length - 1];
    // 3b. bản chấm còn đại diện test.md + code hiện tại? — check-eval (subprocess, không viết lại luật) + mới-hơn-code/test.md
    const hỏngThêm = (mã, câu) => { cEval.đạt = false; cEval.luật = [...new Set([...(cEval.luật.length ? cEval.luật : p !== null && p < EVAL_MIN ? ['A3a'] : []), mã])]; cEval.ghi = (cEval.ghi ? cEval.ghi + ' · ' : '') + câu; cEval.vìCũ = true; };
    const CE = path.join(SK, 'ac-eval', 'scripts', 'check-eval.js');
    if (fs.existsSync(CE)) {
      const r = run(CE, [String(f), '--docs', DOCS, '--json']); let j = null; try { j = JSON.parse(r.stdout); } catch { /* check-eval không in JSON → không kết luận */ }
      const mã = j && Array.isArray(j.luật) ? j.luật : [];
      const phủ = mã.map((m, i) => [m, (j.lỗi || [])[i] || m]).filter(([m]) => /^(E2e|E2f|E2g|E5b)$/.test(m));
      if (phủ.length) hỏngThêm('A3c', `check-eval: ${phủ.length} lỗi phủ/cộng (${[...new Set(phủ.map((x) => x[0]))].join(' ')}: ${phủ[0][1].slice(0, 70)}) — điểm không còn đại diện test.md hiện tại, chạy ac-eval ${SCREEN}`);
      else if (j && r.status !== 0) cảnhBáo.push(`eval ${path.basename(String(f))}: check-eval exit ${r.status} (${[...new Set(mã)].join(' ')}) — hình bản chấm, không chặn nhận`);
    }
    const sauE = commitSauBằngChứng(txt);
    if (sauE) hỏngThêm('A3d', `eval cũ hơn ${sauE.n} commit chạm ${SCREEN} sau ${sauE.b} (${sauE.đầu}…) — chạy ac-eval ${SCREEN}`);
    const tm = vd.folder ? path.join(DOCS, vd.folder, 'test.md') : null, ce = commitCuối(String(f));
    if (!sauE && tm && fs.existsSync(tm) && ce) {
      // commit chỉ cập nhật Trạng thái/Kết quả (2 ô cuối bảng TC ≥ 8 cột — roll-up sau khi chạy/nhận) không đổi điều TC đòi → bỏ
      const chỉRollUp = (sha) => { const r = spawnSync('git', ['-C', GIT_TOP, 'show', '--format=', '-U0', sha, '--', tm], { encoding: 'utf8', maxBuffer: 1e8 });
        const chuẩn = (l) => { const c = l.slice(1).replace(/^\s*\||\|\s*$/g, '').split('|').map((x) => x.trim()); return (c.length >= 8 ? c.slice(0, -2) : c).join('|'); };
        const bớt = [], thêm = []; for (const l of (r.stdout || '').split('\n')) { if (/^-[^-]/.test(l)) bớt.push(chuẩn(l)); else if (/^\+[^+]/.test(l)) thêm.push(chuẩn(l)); }
        return bớt.sort().join('\n') === thêm.sort().join('\n'); };
      const đổi = logSau(ce, [tm]).filter((l) => !chỉRollUp(l.split(' ')[0]));
      if (đổi.length) hỏngThêm('A3d', `test.md đổi ${đổi.length} lần sau bản chấm (${đổi[0].slice(0, 60)}…) — case mới chưa chấm, chạy ac-eval ${SCREEN}`);
    }
    // Evaluator chấm 0/1 đúng những TC verifier đã gắn `tc-sai-tiền-đề` (code theo srs, test.md đòi khác) → eval dưới ngưỡng
    // kéo trảLoại về 'code' và PO phái builder sửa code ĐÚNG. Chấm lại bảng "Từng case" bỏ các TC đó: đạt ngưỡng → cổng
    // eval hỏng vì tài liệu (dự án helpdesk 18/09: TC-S15-64, TC-S14-54/39, TC-S16-28 — lệch tài liệu nằm trong điểm eval).
    const tcSai = new Set(((phânLoại || {}).tcSaiTiềnĐề || []).map((x) => x.tc));
    const tcGoLive = new Set(goLive.chỉCònGoLive ? goLive.tc : []);   // TC chặn go-live: evaluator chấm 0 vì không chạy được, không vì code
    if (!cEval.vìCũ && p !== null && p < EVAL_MIN && (tcSai.size || tcGoLive.size)) {
      let tổng = 0, mẫu = 0, bỏ = 0, bỏSai = 0, bỏGL = 0;
      for (const l of txt.split('\n')) {
        const c = l.split('|').map((x) => x.trim()); if (c.length < 7 || !/^(TC|GWT|AC)-/.test(c[1])) continue;
        const đ = c.find((x, i) => i >= 2 && /^[012]$/.test(x)); if (đ === undefined) continue;   // `—` = không áp dụng
        if (tcSai.has(c[1]) || tcGoLive.has(c[1])) { bỏ++; if (tcGoLive.has(c[1])) bỏGL++; else bỏSai++; continue; }
        tổng += +đ; mẫu += 2;
      }
      const q = mẫu ? Math.round((tổng / mẫu) * 1000) / 10 : null;
      if (bỏ && q !== null && q >= EVAL_MIN) Object.assign(cổng[cổng.length - 1], bỏSai ? { vìTcSai: true } : {}, bỏGL ? { vìGoLive: true } : {}, { ghi: `bỏ ${bỏSai ? bỏSai + ' TC sai tiền đề' : ''}${bỏSai && bỏGL ? ' + ' : ''}${bỏGL ? bỏGL + ' TC chặn go-live' : ''} → ${q}% ≥ ${EVAL_MIN}% — thiếu điểm ${bỏSai ? 'do test.md' : 'do thiếu thứ người cấp'}, không do code` });
    }
  }
}
// 4. tầng TC
{
  // JSON (không --plain): cần `chuaKiem` — "chưa kiểm" là kết quả riêng, exit của check-tc-layer không đổi vì nó (W3 07/10)
  const r = run(path.join(SK, 'ba-conformance', 'scripts', 'check-tc-layer.js'), [DOCS, '--root', ROOT, '--screen', SCREEN]);
  let j = null; try { j = JSON.parse(r.stdout); } catch { /* không JSON */ }
  const ck = j && Array.isArray(j.chuaKiem) ? j.chuaKiem.filter((c) => !c.man || c.man === SCREEN) : [];
  const xg = j && Array.isArray(j.xanhGia) ? j.xanhGia : [];
  const ghiA4 = r.status ? (xg.length ? `❌ ${xg.length} TC xanh-giả: ${xg[0].id} (TC mô tả tầng ${xg[0].tcMôTả}, ${xg[0].vìSao})` : ((r.stderr || r.stdout || '').trim().split('\n')[0] || '')).slice(0, 160) : '';
  const ghiCk = ck.length ? `chưa kiểm: ${ck.map((c) => `${c.man} ${c.soTC}/${c.tongTC} TC`).join(', ')} ở bảng không cột Cách chạy — cổng không đọc được tầng; ${ck[0].cach || 'bổ sung cột Cách chạy'}` : '';
  const jHỏng = r.status !== 2 && !j;   // không đọc được JSON = cổng vỡ, không phải sạch
  đẩy('tc-layer', r.status === 0 && !ck.length && !jHỏng, `check-tc-layer.js exit ${r.status}${ck.length ? ' · chuaKiem' : ''}`, [ghiA4, ghiCk, jHỏng ? 'check-tc-layer không in JSON — không đọc được kết quả' : ''].filter(Boolean).join(' · '),
    [...(r.status !== 0 || jHỏng ? ['A4'] : []), ...(ck.length ? ['A4c'] : [])]);
  if (ck.length && r.status === 0 && !jHỏng) cổng[cổng.length - 1].vìChưaKiểm = true;
}
const hỏng = cổng.filter((c) => !c.đạt);
const verdict = hỏng.length ? 'TRẢ' : 'NHẬN';
// Loại TRẢ: 'code' (trả builder) · 'tài-liệu' (mọi cổng hỏng — verify và/hoặc eval — CHỈ vì TC sai tiền đề có trích srs → sửa test.md, không phái builder)
// · 'go-live' (mọi cổng hỏng chỉ vì TC chặn bởi PD [go-live] Treo — không phái builder, không tính vòng; lẫn TC sai tiền đề → 'tài-liệu' trước)
// verification cũ hơn code (vìCũ) không bao giờ là tài-liệu/go-live: verifier chưa thấy code mới → 'code' (dev-run chạy lại verify)
const hỏngGoLive = hỏng.every((c) => (c.cổng === 'verify' && !c.vìCũ && (chỉCònTcSai || goLive.chỉCònGoLive)) || c.vìTcSai || c.vìGoLive || c.vìChưaKiểm);
// A4c (tc-layer chỉ vì chuaKiem) là việc tài liệu: thêm cột Cách chạy vào test.md, không phái builder
const trảLoại = verdict === 'TRẢ' ? (hỏng.every((c) => (c.cổng === 'verify' && !c.vìCũ && chỉCònTcSai) || c.vìTcSai || c.vìChưaKiểm) ? 'tài-liệu'
  : hỏngGoLive && goLive.chỉCònGoLive ? (goLive.lẫnTcSai || hỏng.some((c) => c.vìTcSai || c.vìChưaKiểm) ? 'tài-liệu' : 'go-live') : 'code') : null;
const luật = hỏng.flatMap((c) => c.luật);
RC.ghi('accept', luật);
// Sổ nhận (giao diện 2): hook-gate đối `dev ✅` với dòng NHẬN — ghi MỌI lần chạy, kể cả TRẢ. Hỏng ghi không đổi verdict.
let sổNhận = null;
if (GỐC_DA) {
  const head = GIT_TOP ? ((spawnSync('git', ['-C', GIT_TOP, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout || '').trim() || null) : null;
  const f = path.join(GỐC_DA, '.claude', 'ac-accept.jsonl');
  try { fs.appendFileSync(f, JSON.stringify({ ts: new Date().toISOString(), man: SCREEN, head, ketQua: verdict, traLoai: trảLoại }) + '\n'); sổNhận = f; }
  catch (e) { cảnhBáo.push(`không ghi được sổ nhận ${f}: ${e.message}`); }
}
const out = { screen: SCREEN, verdict, trảLoại, luật, phânLoại, cổng, evalMin: EVAL_MIN, goLive, cảnhBáo, integrity, sổNhận, gioiHan: ['file:line trôi do commit scope khác chỉ cảnh báo (không chặn); chỉ xét file code (bỏ file test), không xét dòng đổi có trùng dòng trích', '🟠 trong review vẫn NHẬN — PO mở WI', 'không chạy test, tin verification.md + check-tc-layer', 'go-live chỉ gỡ cổng verify/eval — tc-layer/review hỏng vẫn là code; tin nhãn [go-live] người ghi trong 00-decisions', 'mới-hơn-code xét commit scope (<Mã>) chạm code HOẶC commit bất kỳ chạm file plan khai, sau sha `b` của dòng diff; b = HEAD hay không phải sha → không xét; plan không khai Files → chỉ theo scope · sổ nhận chỉ ghi khi gốc dự án có .claude/ · integrity vắng/không kiểm được → không TRẢ A0 (in lý do)'] };
if (JSON_MODE) console.log(JSON.stringify(out, null, 2));
else {
  console.log(`accept ${SCREEN}: ${verdict === 'NHẬN' ? '✅ NHẬN' : '↩️  TRẢ'} — ${cổng.length - hỏng.length}/${cổng.length} cổng đạt`);
  for (const c of cổng) console.log(`  ${c.đạt ? '✓' : '✗'} ${c.cổng.padEnd(8)} ${c.bằngChứng}${c.ghi ? ' — ' + c.ghi : ''}${c.luật.length ? ` [${c.luật.join(' ')}]` : ''}`);
  for (const w of cảnhBáo) console.log(`  ⚠ ${w}`);
  if (integrity.trạngThái === 'chưa cài' || integrity.trạngThái === 'chưa kiểm') console.log(`  ⚠ ${integrity.trạngThái === 'chưa cài' ? integrity.ghi : `integrity chưa kiểm được: ${integrity.ghi}`}`);
  if (phânLoại && phânLoại.tcSaiTiềnĐề.length) console.log(`  ↳ TC sai tiền đề (verifier trích srs): ${phânLoại.tcSaiTiềnĐề.map((x) => x.tc).join(', ')} — sửa test.md theo srs (ba-test), không phải code`);
  if (trảLoại === 'go-live') console.log(`  → CHẶN GO-LIVE: chỗ đỏ chỉ là TC ${goLive.tc.join(', ')} chờ người cấp (${goLive.pd.join(', ')} Treo [go-live]) — KHÔNG phái builder, không tính vòng TRẢ: \`mission.js done ${SCREEN} --verdict TRẢ --loai go-live\`. Người cấp xong → PD sang Chốt, ac-verify chạy lại các TC đó.`);
  else if (trảLoại === 'tài-liệu') { const ck = hỏng.some((c) => c.vìChưaKiểm), sai = hỏng.some((c) => !c.vìChưaKiểm);
    console.log(`  → TRẢ TÀI LIỆU: mọi chỗ đỏ là ${ck ? `test.md thiếu cột Cách chạy (A4c — \`ba-screen-spec ${SCREEN} --bo-sung cach-chay\`)` : ''}${ck && sai ? ' và ' : ''}${sai ? 'TC sai tiền đề' : ''} — PO sửa test.md (po.may)${sai ? ' rồi verifier vòng kế chỉ chạy lại các TC đó' : ' rồi chạy accept lại'}; KHÔNG phái builder.`); }
  else if (hỏng.length) console.log(`  → trả lại dev-run với: ${hỏng.map((c) => c.cổng).join(', ')}${phânLoại && phânLoại.lỗiCode.length ? ` (lỗi code: ${phânLoại.lỗiCode.map((x) => x.tc + ' @ ' + x.chỗ).join(' · ')})` : ''}. PO chỉ nhận khi máy nói PASS/APPROVE; muốn nhận sớm hơn là đổi luật, không phải đổi quyết định.`);
}
process.exit(verdict === 'NHẬN' ? 0 : 1);
