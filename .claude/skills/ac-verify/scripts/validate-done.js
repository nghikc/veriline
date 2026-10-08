#!/usr/bin/env node
/*
 * ac-verify/validate-done.js — CỔNG MÁY cho chữ "xong" của một màn. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ac-verify/scripts/validate-done.js <docs> <Mã màn> [--plain|--json]
 *
 * Đọc `docs/Screen-spec/<màn>/verification.md` (do agent ac-verifier ghi) và đối chiếu với `plan.md` cùng
 * folder. Exit 0 = được phép đánh `dev = ✅`. Exit ≠ 0 = chưa xong, in lý do. Kiểm:
 *   1. verification.md tồn tại và có `**Verdict:** PASS`  (FAIL, thiếu, hay "PASS có điều kiện" đều đỏ)
 *   2. header có `model:` và `diff:`                          (ai chấm, chấm khoảng nào — không có = không tái lập)
 *   3. mọi `## Task N` trong plan.md có đúng một dòng bảng   (task không có dòng = không ai chấm)
 *   4. mỗi dòng có exit code là số và có bằng chứng `đường/dẫn:số`  (exit 0 mà không chỉ được vào đâu = lời nói)
 *   5. không còn placeholder `<…>` / `TODO`
 *   7. mục `## Vế thiếu` (19/09): dòng `TC · vế thiếu "…" · LOẠI: thiếu-test | ngoài-tầng · <file:line|lý do>`; `thiếu-test` mà verdict PASS
 *      → đỏ (S12 17/09: PASS ba vòng, eval thấy 40 case chỉ bằng chứng tĩnh); `ngoài-tầng` không có lý do → đỏ; --json trả `vếThiếu`.
 *   6. mục `## TC ngoài code màn / sai tiền đề` (tuỳ chọn): mỗi dòng `TC-… · LOẠI: <nhãn> · file:line`; nhãn thuộc canon
 *      `verify.tc.labels` (lỗi-code · tc-sai-tiền-đề · đúng-srs); `tc-sai-tiền-đề` PHẢI trích srs/design-spec/E-/R-/BRule.
 *      --json trả `phânLoại` + `chỉCònTcSai` (mọi dòng FAIL chỉ nhắc TC sai tiền đề) để accept.js route "sửa test.md"
 *      thay vì "trả builder" — dự án helpdesk S14 16/09 người phải ký nợ tay, S12 17/09 PO sửa test.md ngoài luồng.
 *   8. mục `## Lỗi gieo` (24/09, đợt 4 gói B — tlc-spec-lean verify.md §4): verdict PASS thì BẮT BUỘC có mục này, gồm HOẶC dòng
 *      `n/a — <lý do>` (màn không có code logic để gieo) HOẶC bảng `| M1 | file:line | đột biến | proof | kết quả |` do mutate.js
 *      in, kết quả ∈ bắt · sống · lỗi-chạy. Đỏ khi: thiếu mục · bảng rỗng · còn dòng `sống` · không dòng nào `bắt` (toàn lỗi-chạy
 *      = không chứng minh gì) · kết quả lạ · dòng bắt/sống thiếu file:line. Dòng bảng trong mục này KHÔNG tính là dòng Task.
 *      Verdict FAIL không bị soát mục này (gieo lỗi chạy SAU khi Proof xanh). --json trả `lỗiGieo`.
 *   9. (24/09, đợt 5 gói 1a — tlc-spec-lean verify.md §2 "confirm each named test exists and ran") mỗi dòng Task ghi số
 *      `N passed / M skipped` lấy từ output Proof (nhận cả hình thật: jest `Tests: 3 passed, 1 skipped`, vitest `✓ 5 tests` /
 *      `(5 tests)`, pytest `5 passed in 0.3s`, mocha `5 passing`, node:test `# pass 5`). Chỉ soát khi verdict PASS:
 *      N = 0 hoặc `no tests ran`/`No tests found` → đỏ (filter không trúng test nào vẫn exit 0 — passWithNoTests); mã TC của
 *      `Trace test` (plan, khai triển `…`/`..`) không có trong dòng → đỏ; `--root <gốc code>` → grep file `- Test:` của task,
 *      TC không có trong file nào → đỏ. Bảng KHÔNG dòng nào có số = kiểu cũ → chỉ `cảnhBáo`; đã có số ở một dòng thì dòng
 *      thiếu số → đỏ (không cho né bằng cách bỏ số ở dòng khó). --json trả `đãChạy` {task: {passed, skipped, tc}} + `kiểuCũ`.
 *  10. `phủ bởi full suite <sha>` (vòng ≥ 2): sha phải trùng đầu `diff:` (HEAD lúc verify) — xanh ở commit khác không nói gì
 *      về commit này (verify.md §7). Đầu diff không phải sha (HEAD, tên nhánh) → cảnh báo, không đỏ.
 *  11. `ngoài-tầng` khi PASS: dòng phải có `đã thử: <lệnh> → <trích lỗi>` (spec-driven-eval "probe-before-not-run": lý do
 *      không có lần thử là bằng chứng bịa). Bảng kiểu mới → đỏ; kiểu cũ → cảnh báo.
 *  12. Khối ``` / ~~~ bị bỏ trước khi đọc (validate_verification.py `strip_fences`): mẫu dán nguyên hay output dán trong rào
 *      không được tính là dữ liệu — số passed phải nằm trên dòng Task.
 *      Luật 9–11 KHÔNG thêm lỗi khi verdict FAIL (tổng quát hoá ở luật 13: accept.js so `luật` = ['V1b'], ca 3be · 3bm).
 *  13. (24/09, hình thật helpdesk) verdict ≠ PASS → mọi luật hình khác (2–5, 7–12) chỉ vào `cảnhBáo` kèm mã; TRỪ luật 6
 *      (nhãn TC — chính nó route bài FAIL, nhãn hỏng = route không tin được). Bài FAIL nhãn đúng: `lỗi` = đúng
 *      ['verdict = FAIL'], `luật` = đúng ['V1b'] — accept.js route go-live/tài-liệu theo MÃ, một luật hình mới bắn trên bài FAIL
 *      không được lặng lẽ tắt nhánh đó (S14 16/09: V4a×4 trên bài FAIL → go-live tắt). Nhãn `tc-sai-tiền-đề` thiếu file:line
 *      hoặc thiếu trích srs KHÔNG vào `phânLoại` (không được route "sửa test.md" bằng nhãn không dẫn chứng).
 *  14. MỐC đợt 4–5: verification có `ngày:` TRƯỚC 2026-09-24 → luật đòi HÌNH MỚI (V8a thiếu `## Lỗi gieo`, V9a thiếu số,
 *      V9c TC vắng trên dòng, V9d TC vắng trong file test, V11 ngoài-tầng thiếu đã thử) chỉ cảnh báo — decision 16 "màn đã ✅
 *      không bị soát lại". Luật bắt MÂU THUẪN trong chính bài (V9b 0 passed, V10 sha lệch, V8b–h bảng gieo sai) vẫn đỏ: bằng
 *      chứng tự mâu thuẫn không có "hình cũ". Không có `ngày:` → không miễn (xoá ngày không được là lối thoát).
 *  4'. exit code: ô cột `exit` (theo header bảng) BẮT ĐẦU bằng số — `0 · phủ bởi full suite cab23b5`, `**0** *(chạy lại)*` là
 *      hình thật (dự án helpdesk S12/S14/S16); không có header thì ô nào bắt đầu bằng số theo sau là hết/`·`/`(`/`*`.
 *  9d'. `--root` vắng → suy từ header `gốc code: app/` (tương đối cha của docs/); `--root` là gốc dự án mà plan ghi đường
 *      tương đối `app/` → thử cả `<root>/<gốc code>`. File plan ghi `.ts` mà thật `.tsx` (vitest lọc chuỗi con) → nhận.
 *      TC vắng trong file của task nhưng CÓ trong file test khác (của plan hoặc dưới gốc code) → cảnh báo "Proof task không
 *      phủ Trace", không phải "test không tồn tại"; vắng khắp nơi → V9d.
 *  15. V-RECEIPT (hook-review 07/10/2026, gói A — giao diện 3): mỗi Task của plan có `**Proof:**` phải có BIÊN LAI do
 *      `ba-toolkit/scripts/evidence.js run -- <lệnh>` ghi ở `.claude/ac-runs/` (gốc dự án / --root / gốc git): cmd chuẩn hoá
 *      = lệnh Proof của PLAN (không phải ô Proof trong verification — ô đó agent viết), exit = 0, head thuộc khoảng `diff: a..b`
 *      (a là tổ tiên của head, head là tổ tiên của b; b không phải sha → HEAD; head sau b mà b..head chỉ chạm docs/.claude
 *      cũng nhận — cùng code), và `passed` của biên lai = số ghi trên dòng
 *      (dòng có số). Dòng "phủ bởi full suite <sha>" → cần một biên lai exit 0 có head = sha đó (lệnh nào cũng được).
 *      Vì sao: bài viết tay đủ hình là PASS mà không lệnh nào từng chạy — cổng chỉ tin cái nó tự đo được. Chỉ khi PASS.
 *      Verification có `ngày:` TRƯỚC 2026-10-07 → chỉ ⚠ (mục `biênLai.cảnhBáo`, không vào `cảnhBáo` — bản cũ không bị soát
 *      lại, decision 16); không `ngày:` → không miễn. Không git → không đối được khoảng (⚠ trong biênLai), vẫn đòi biên lai.
 *  16. V9f (cùng đợt): `--root`/`gốc code:` có mà file `- Test:` của task KHÔNG có trên đĩa → ĐỎ (trước chỉ ⚠ — test không
 *      tồn tại thì Proof xanh không chứng minh gì). Cùng mốc ngày như 15.
 *  17. V0d: gọi `ba-toolkit/scripts/integrity.js --json` ĐẦU TIÊN — toolkit (chính checker này) lệch nguồn mà không có mục
 *      duyệt → đỏ (validate-done bị vá thành exit 0 thì mọi luật dưới đây vô nghĩa). integrity vắng → in "integrity chưa
 *      cài" (field `integrity`), không đỏ; integrity exit 2 (không kiểm được) → chỉ ghi vào `integrity`.
 *  9e. (24/09, đợt 6 — nợ đợt 5) bảng kiểu cũ mà header `> ngày:` ≥ 2026-09-24 (mốc CỐ ĐỊNH, cùng cách check-eval luật 4b)
 *      → ĐỎ: verifier bỏ số ở MỌI dòng để thành "kiểu cũ" là cách né luật 9. Không có dòng ngày hay ngày trước mốc → vẫn
 *      cảnh báo (bản cũ). Bảng kiểu cũ sau mốc cũng áp luật 11 như kiểu mới. Chỉ khi verdict PASS.
 *
 * Mã luật: `--rules` in JSON [{mã, môTả}]; --plain in `❌ … [V9a]`; --json thêm `luật` (song song với `lỗi` — chuỗi `lỗi` giữ
 * nguyên để accept.js so đúng ['verdict = FAIL']); có BA_RULE_LOG thì ghi mã đã bắn (ba-toolkit/rule-cover.js đo độ phủ).
 *
 * Vì sao có: spec-driven `validate_state.py` — "completion gate: Verifier report exists, verdict PASS, cites
 * file:line". Không có cổng này thì bước 7b của dev-run là lời dặn; có nó thì "xong" là exit code.
 *
 * gioiHan: không chạy lại proof (ac-verifier đã chạy; chạy lại ở đây là nhân đôi) — số passed là lời verifier chép từ
 * output, máy chỉ soát nó có mặt, khác 0 và đi cùng mã TC; không đọc assert (mock-only là luật của agent, bước 3). Không
 * kiểm verification.md mới hơn commit cuối — dùng `diff:` trong header để người đọc tự đối chiếu. Grep TC chỉ khi có
 * `--root` và chỉ trong file `- Test:` của plan; test không khai ở plan thì không thấy. Nhận dạng số theo mẫu runner phổ
 * biến (jest/vitest/pytest/mocha/node:test/playwright); go test `ok pkg` không có số → dòng đó thiếu số.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const RC = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'rule-cover.js'));
const EV = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'evidence.js'));   // header + placeholder chung với check-eval/review-gate; biên lai Proof
const { spawnSync } = require('child_process');
const LUẬT = [
  ['V0a', 'không thấy folder màn'], ['V0b', 'thiếu plan.md'], ['V0c', 'thiếu verification.md'],
  ['V1a', 'không có dòng **Verdict:**'], ['V1b', 'verdict ≠ PASS'],
  ['V2a', 'header thiếu model:'], ['V2b', 'header thiếu diff:'],
  ['V3a', 'Task của plan không có dòng bảng'], ['V3b', 'Task có >1 dòng'], ['V3c', 'bảng có Task plan không có'],
  ['V4a', 'dòng Task không có exit code số'], ['V4b', 'dòng Task không có file:line / full suite sha'],
  ['V5', 'còn placeholder <…>/TODO'],
  ['V6a', 'nhãn TC sai dạng'], ['V6b', 'nhãn TC ngoài verify.tc.labels'], ['V6c', 'nhãn TC thiếu file:line'], ['V6d', 'tc-sai-tiền-đề không trích srs/E-/R-/BRule'],
  ['V7a', 'Vế thiếu sai dạng'], ['V7b', 'vế thiếu-test mà PASS'], ['V7c', 'ngoài-tầng không lý do'],
  ['V8a', 'PASS thiếu mục Lỗi gieo'], ['V8b', 'Lỗi gieo n/a không lý do'], ['V8c', 'Lỗi gieo vừa n/a vừa bảng'], ['V8d', 'mục Lỗi gieo rỗng'],
  ['V8e', 'lỗi gieo sống'], ['V8f', 'lỗi gieo toàn lỗi-chạy'], ['V8g', 'kết quả gieo lạ'], ['V8h', 'dòng gieo thiếu file:line'],
  ['V9a', 'kiểu mới: dòng Task thiếu số passed'], ['V9b', 'Proof chạy 0 test'], ['V9c', 'TC của Trace test vắng trên dòng'], ['V9d', '--root: TC không có trong file test'],
  ['V9e', 'bảng kiểu cũ mà ngày ≥ mốc 2026-09-24'],
  ['V10', 'full suite sha ≠ đầu diff'], ['V11', 'ngoài-tầng thiếu đã thử'],
  ['V0d', 'toolkit lệch nguồn không duyệt (integrity.js exit 1)'],
  ['V-RECEIPT', 'Task có Proof thiếu biên lai evidence.js khớp lệnh plan/exit 0/head trong diff/passed'],
  ['V9f', '--root: file `- Test:` của task không có trên đĩa'],
];
RC.inLuật(argv, LUẬT);
const NGÀY_LUẬT_9E = '2026-09-24';
const NGÀY_BIÊN_LAI = '2026-10-07';   // V-RECEIPT/V9f: verification ghi trước mốc chỉ ⚠ (hook-review 07/10/2026)   // mốc cố định (không "trước hôm nay" — mốc trôi biến mọi bản hôm qua thành miễn luật)
const pos = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--root');
const DOCS = path.resolve(pos[0] || 'docs');
const SCREEN = pos[1];
const JSON_MODE = argv.includes('--json');
const ROOT = argv.includes('--root') ? path.resolve(argv[argv.indexOf('--root') + 1] || '.') : null;
if (!SCREEN) { console.error('Dùng: validate-done.js <docs> <Mã màn> [--root <gốc code>] [--plain|--json]'); process.exit(2); }

// 12. bỏ khối rào — mẫu/output dán trong ``` không phải dữ liệu
const bỏRào = (s) => { let trong = false; return s.split('\n').filter((l) => { if (/^\s*(```|~~~)/.test(l)) { trong = !trong; return false; } return !trong; }).join('\n'); };
// 9. số test đã chạy trên một dòng — hình output thật của runner phổ biến. Số đứng sau mã (TC-S09-02 passed) hay sau "exit" không tính.
const SỐ = String.raw`(?<![\w.:/-])(?<!exit\s{0,3})(?<!exit code\s{0,3})(\d+)`;
const RE_PASS = [new RegExp(`${SỐ}\\s+(?:tests?\\s+)?(?:passed|passing|pass)\\b`, 'gi'), /✓\s*(\d+)\s+tests?\b/gi, /\((\d+)\s+tests?\b/gi, /#\s*pass\s+(\d+)/gi];
const RE_SKIP = [new RegExp(`${SỐ}\\s+(?:tests?\\s+)?(?:skipped|pending|todo)\\b`, 'gi'), /#\s*skip(?:ped)?\s+(\d+)/gi];
const RE_KHÔNG_TEST = /\bno tests (?:ran|found)\b|\bpassWithNoTests\b/i;
const đếmChạy = (s) => {
  const t = s.replace(/`/g, ' '); const passed = [], skipped = [];
  for (const re of RE_PASS) for (const m of t.matchAll(re)) passed.push(+m[1]);
  for (const re of RE_SKIP) for (const m of t.matchAll(re)) skipped.push(+m[1]);
  if (RE_KHÔNG_TEST.test(t)) passed.push(0);
  return passed.length ? { passed, skipped } : null;
};
// mã TC trong một đoạn, khai triển `TC-S02-04…09` / `..` / `–`
const mãTC = (s) => {
  const out = new Set();
  for (const m of s.matchAll(/TC-(S\d+)-(\d+)(?:\s*(?:…|\.\.\.?|–)\s*(?:TC-S\d+-)?(\d+))?/g)) {
    const [, sc, a, b] = m; const w = a.length;
    if (!b) { out.add(`TC-${sc}-${a}`); continue; }
    for (let i = +a; i <= +b && i - +a < 200; i++) out.add(`TC-${sc}-${String(i).padStart(w, '0')}`);
  }
  return out;
};

let dir = null;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (!e.isDirectory() || /^(Ho-so|removed)$/.test(e.name)) continue;
    const p = path.join(d, e.name);
    if (new RegExp(`^${SCREEN}\\b`).test(e.name)) { dir = p; return; }
    walk(p); if (dir) return;
  }
})(DOCS);

const NHÃN = ['lỗi-code', 'tc-sai-tiền-đề', 'đúng-srs'];   // = canon verify.tc.labels (lint soát khớp)
const phânLoại = { lỗiCode: [], tcSaiTiềnĐề: [], đúngSrs: [] };
const vếThiếu = { thiếuTest: [], ngoàiTầng: [] };
const lỗiGieo = { na: null, dòng: [], bắt: 0, sống: [], lỗiChạy: 0 };
const đãChạy = {};   // 9. task → { passed, skipped, tc } (additive trong --json)
let chỉCònTcSai = false, kiểuCũ = null;
const lỗi = [], cảnhBáo = [], mãLỗi = [], mãCảnhBáo = [];
// 13. verdict ≠ PASS: chỉ V1b (và V6 — nhãn phân loại TC chính là thứ route bài FAIL, nhãn hỏng thì route không được tin) là
// lỗi; luật hình khác vào cảnhBáo kèm mã (accept.js so `luật` = ['V1b'] để route go-live/tài-liệu)
let khiFail = false, miễnMới = false;
const đỏ = (mã, s) => {
  if (khiFail && mã !== 'V1b' && !/^V6/.test(mã)) { cảnhBáo.push(`[${mã}] ${s} — verdict không PASS: chỉ cảnh báo`); mãCảnhBáo.push(mã); return; }
  lỗi.push(s); mãLỗi.push(mã);
};
// 14. luật đòi hình đợt 4–5 trên verification ghi trước mốc → cảnh báo (decision 16: màn đã ✅ không bị soát lại)
const LUẬT_MỚI = new Set(['V8a', 'V9a', 'V9c', 'V9d', 'V11']);
// 15/16. luật biên lai trên verification ghi trước mốc 2026-10-07 → ⚠ riêng (biênLai.cảnhBáo), không đổi `cảnhBáo` của bản cũ
const đỏBL = (mã, s) => {
  if (biênLai.miễn) { biênLai.cảnhBáo.push(`[${mã}] ${s} — verification ngày ${ngàyV} trước mốc ${NGÀY_BIÊN_LAI}: chỉ cảnh báo`); return; }
  đỏ(mã, s);
};
const đỏMới = (mã, s) => {
  if (miễnMới && LUẬT_MỚI.has(mã)) { cảnhBáo.push(`[${mã}] ${s} — verification ngày ${ngàyV} trước mốc ${NGÀY_LUẬT_9E}: luật đợt 4–5 chỉ cảnh báo`); mãCảnhBáo.push(mã); return; }
  đỏ(mã, s);
};
let ngàyV = '', verdictV = null, gốcCode = null;
// 17. integrity trước mọi luật (hook-review 07/10/2026): checker bị vá tại chỗ thì kết quả của chính nó không đáng tin.
const integrity = (() => {
  const IS = path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'integrity.js');
  if (!fs.existsSync(IS)) return { trạngThái: 'chưa cài', ghi: 'integrity chưa cài — không đối được toolkit với nguồn' };
  const gốc = [ROOT, path.dirname(DOCS)].filter(Boolean).find((g) => fs.existsSync(path.join(g, '.claude'))) || (() => { const r = spawnSync('git', ['-C', path.dirname(DOCS), 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : path.dirname(DOCS); })();
  const r = spawnSync(process.execPath, [IS, '--root', gốc, '--json', '--no-cache'], { encoding: 'utf8', maxBuffer: 1e8 });
  let j = null; try { j = JSON.parse(r.stdout); } catch { /* không JSON */ }
  if (r.status === 0) return { trạngThái: 'khớp', nguồn: j && j.nguon };
  if (r.status === 1 && j && Array.isArray(j.lech)) {
    const duyệt = new Set(j.duyet || []); const lệch = j.lech.filter((x) => !duyệt.has(x.file));
    return lệch.length ? { trạngThái: 'lệch', lệch } : { trạngThái: 'khớp', nguồn: j.nguon };
  }
  return { trạngThái: 'chưa kiểm', ghi: (j && j.chuaKiem) || (r.stderr || '').trim().split('\n')[0] || `exit ${r.status}` };
})();
if (integrity.trạngThái === 'lệch') đỏ('V0d', `toolkit lệch nguồn mà không có mục duyệt (integrity.js): ${integrity.lệch.slice(0, 3).map((x) => `${x.file} (${x.loai})`).join(', ')}${integrity.lệch.length > 3 ? ` (+${integrity.lệch.length - 3})` : ''} — kết quả checker không đáng tin; trả toolkit về nguồn hoặc ghi .claude/ba-toolkit-local.json`);
const biênLai = { cảnhBáo: [], khớp: {}, miễn: false };
if (!dir) { đỏ('V0a', `không thấy folder màn ${SCREEN} dưới ${DOCS}`); }
else {
  const vf = path.join(dir, 'verification.md'), pf = path.join(dir, 'plan.md');
  if (!fs.existsSync(pf)) đỏ('V0b', 'không có plan.md — không có gì để đối chiếu');
  if (!fs.existsSync(vf)) đỏ('V0c', 'không có verification.md — chưa ai chứng minh (ac-verify chưa chạy)');
  if (!lỗi.length) {
    const v = bỏRào(fs.readFileSync(vf, 'utf8')), p = fs.readFileSync(pf, 'utf8');
    const verdict = (v.match(/^\*\*Verdict:\*\*\s*(\S+)/m) || [])[1];
    verdictV = verdict || null;
    if (!verdict) đỏ('V1a', 'không có dòng `**Verdict:** PASS|FAIL`');
    else if (verdict !== 'PASS') { đỏ('V1b', `verdict = ${verdict}`); khiFail = true; }
    ngàyV = ((v.match(/^>?\s*(?:.*·\s*)?ngày:\s*`?(\d{4}-\d{2}-\d{2})/mi) || [])[1]) || '';
    miễnMới = !!ngàyV && ngàyV < NGÀY_LUẬT_9E;
    biênLai.miễn = !!ngàyV && ngàyV < NGÀY_BIÊN_LAI;
    gốcCode = ((v.match(/^>?[^\n]*?gốc code:\s*`?([^`·\s(*]+)/mi) || [])[1] || '').replace(/\/+$/, '') || null;
    const thiếuH = EV.thiếuHeader(v, ['model', 'diff']);
    if (thiếuH.includes('model')) đỏ('V2a', 'header thiếu `model:` — không biết ai chấm');
    if (thiếuH.includes('diff')) đỏ('V2b', 'header thiếu `diff:` — không biết chấm khoảng nào');
    if (EV.cònPlaceholder(v)) đỏ('V5', 'còn placeholder `<…>`/TODO');
    const taskIds = [...p.matchAll(/^## Task (\d+)/gm)].map((m) => +m[1]);
    // plan theo task: TC của `Trace test` + file `- Test:`
    const planTask = {};
    for (const khối of p.split(/^(?=## Task \d+)/m)) {
      const mt = khối.match(/^## Task (\d+)/); if (!mt) continue;
      const trace = (khối.match(/^\*\*Trace test:\*\*(.*)$/m) || [])[1] || '';
      const tệp = [...khối.matchAll(/^\s*-\s*Test:\s*(.*)$/gm)].flatMap((m) => [...m[1].matchAll(/`([^`]+)`/g)].map((x) => x[1].trim()));
      const proof = (((khối.match(/^\*\*Proof:\*\*(.*)$/m) || [])[1] || '').match(/`([^`]+)`/) || [])[1] || '';
      planTask[+mt[1]] = { tc: [...mãTC(trace)], tệp, proof };
    }
    const diffHeadGốc = (((v.match(/^>?\s*diff:\s*(\S+)/mi) || [])[1] || '').replace(/`/g, '').split(/\.{2,3}/).pop() || '');
    const diffHead = diffHeadGốc.toLowerCase(), headLàSha = /^[0-9a-f]{4,40}$/.test(diffHead);
    const mGieo = v.match(/^## Lỗi gieo[^\n]*\n([\s\S]*?)(?=^## |^\*\*Verdict:\*\*|(?![\s\S]))/m);
    const rows = (mGieo ? v.replace(mGieo[0], '') : v).split('\n').filter((l) => /^\|\s*(Task\s*)?\d+\s*\|/.test(l));
    const rowOf = {};
    // 4'. cột exit theo header bảng Task (`| Task | Proof | exit | …`); không có header → mọi ô trừ ô số Task
    const header = (mGieo ? v.replace(mGieo[0], '') : v).split('\n').find((l) => /^\|\s*Task\s*\|/i.test(l) && /\|\s*exit\b/i.test(l));
    const cộtExit = header ? header.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()).findIndex((c) => /^exit\b/i.test(c)) : -1;
    const RE_EXIT = /^\**\s*-?\d+\s*\**\s*(?:$|[·(*—–;,]|phủ\b)/;
    for (const r of rows) { const n = +r.match(/^\|\s*(?:Task\s*)?(\d+)/)[1]; rowOf[n] = (rowOf[n] || []).concat(r); }
    for (const n of taskIds) {
      const rs = rowOf[n] || [];
      if (!rs.length) { đỏ('V3a', `Task ${n}: không có dòng trong bảng verification`); continue; }
      if (rs.length > 1) đỏ('V3b', `Task ${n}: ${rs.length} dòng — mỗi task đúng một dòng`);
      const cells = rs[0].replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      // ô 0 là số Task — bản cũ đếm cả nó nên V4a KHÔNG BAO GIỜ bắn với dòng `| 1 | … |` (rule-cover.js tìm ra 24/09)
      if (!(cộtExit > 0 ? RE_EXIT.test(cells[cộtExit] || '') : cells.slice(1).some((c) => RE_EXIT.test(c)))) đỏ('V4a', `Task ${n}: không có exit code (số) trong dòng`);
      // Vòng ≥ 2 (ac-verify mục 7): task không bị lô sửa chạm được phủ bằng một lượt full suite — bằng chứng là sha của lượt đó
      // file:line liền (`a.ts:12`) hoặc tách (`a.ts` … `:97-134`, kiểu verifier S12 vòng 2 viết khi một file nhiều dòng)
      const cóFileLine = /[\w./-]+\.\w+:\d+/.test(rs[0]) || (/[\w./-]+\.(?:[cm]?[jt]sx?|py|go|rs|java|kt|sql|md)\b/.test(rs[0]) && /`:\d+(?:[-–]\d+)?`/.test(rs[0]));
      if (!cóFileLine && !/phủ bởi full suite\s+`?[0-9a-f]{7,}/i.test(rs[0])) đỏ('V4b', `Task ${n}: không có bằng chứng dạng file:line (hoặc "phủ bởi full suite <sha>" ở vòng ≥ 2)`);
      // 10. sha full suite = đầu diff
      const shaFs = (rs[0].match(/phủ bởi full suite\s+`?([0-9a-f]{7,40})/i) || [])[1];
      if (shaFs && verdict === 'PASS') {
        if (!headLàSha) cảnhBáo.push(`Task ${n}: đầu \`diff:\` "${diffHeadGốc || '—'}" không phải sha — không đối chiếu được "phủ bởi full suite ${shaFs}"`);
        else if (!shaFs.toLowerCase().startsWith(diffHead) && !diffHead.startsWith(shaFs.toLowerCase())) đỏ('V10', `Task ${n}: "phủ bởi full suite ${shaFs}" khác đầu diff ${diffHead} — xanh ở commit khác không chứng minh HEAD; chạy lại full suite ở HEAD`);
      }
      // 9. số đã chạy + mã TC
      const đếm = đếmChạy(rs[0]);
      đãChạy[n] = { passed: đếm ? đếm.passed.reduce((a, b) => a + b, 0) : null, skipped: đếm ? đếm.skipped.reduce((a, b) => a + b, 0) : null, tc: (planTask[n] || {}).tc || [] };
      if (đếm) đãChạy[n].khôngTest = đếm.passed.some((x) => x === 0);
    }
    // 9. kiểu cũ (không dòng Task nào có số) → cảnh báo; kiểu mới → soát từng dòng. Chỉ khi PASS (luật go-live đọc lỗi của FAIL).
    const cóSố = Object.values(đãChạy).filter((x) => x.passed !== null);
    kiểuCũ = Object.keys(đãChạy).length ? !cóSố.length : null;
    // 9e. kiểu cũ sau mốc ngày → đỏ (bỏ số mọi dòng không còn là lối thoát); không có ngày / trước mốc → cảnh báo
    const kiểuCũSauMốc = !!kiểuCũ && !!ngàyV && ngàyV >= NGÀY_LUẬT_9E;
    const câuCũ = 'bảng kiểu cũ: không dòng Task nào có "N passed / M skipped" — chưa chứng minh test tồn tại và đã chạy (verification-template.md, luật 9)';
    if (verdict === 'PASS' && kiểuCũSauMốc) đỏ('V9e', `${câuCũ} — verification ngày ${ngàyV} ≥ ${NGÀY_LUẬT_9E}: bản mới phải chép số từ output Proof`);
    else if (verdict === 'PASS' && kiểuCũ) cảnhBáo.push(câuCũ);
    if (verdict === 'PASS' && kiểuCũ === false) {
      for (const n of taskIds) {
        const d = đãChạy[n]; if (!d) continue;
        if (d.passed === null) { đỏMới('V9a', `Task ${n}: thiếu số "N passed / M skipped" — các dòng khác có số, dòng này không chứng minh test đã chạy`); continue; }
        if (d.khôngTest) đỏ('V9b', `Task ${n}: Proof chạy 0 test ("0 passed"/"no tests ran") — filter không trúng test nào vẫn exit 0, đó là xanh giả`);
        const tcDòng = mãTC((rowOf[n] || [''])[0]);
        const thiếu = d.tc.filter((t) => !tcDòng.has(t));
        if (thiếu.length) đỏMới('V9c', `Task ${n}: ${thiếu.slice(0, 5).join(', ')}${thiếu.length > 5 ? ` (+${thiếu.length - 5})` : ''} của Trace test không có trên dòng — tên test mang mã TC phải hiện trong output/grep`);
      }
    }
    // 9. --root (hoặc suy từ `gốc code:`): TC phải có trong file `- Test:` của task
    const gốcs = [...new Set((ROOT ? [ROOT, ...(gốcCode ? [path.resolve(ROOT, gốcCode)] : [])] : gốcCode ? [path.resolve(path.dirname(DOCS), gốcCode), path.dirname(DOCS)] : []))].filter((g) => fs.existsSync(g));
    const gốcTin = !!ROOT || (!!gốcCode && fs.existsSync(path.resolve(path.dirname(DOCS), gốcCode)));   // V9f: gốc không phải suy về cha docs/
    if (gốcs.length && verdict === 'PASS') {
      // plan ghi `.ts` mà file thật `.tsx` (vitest lọc chuỗi con — dự án helpdesk S16 s16-edit.spec.ts/tsx) → thử cả hai đuôi
      const tìmTệp = (f) => { for (const g of gốcs) for (const c of [f, f.replace(/\.([cm]?[jt]s)$/, '.$1x'), f.replace(/\.([cm]?[jt]s)x$/, '.$1')]) { const q = path.resolve(g, c); if (fs.existsSync(q) && fs.statSync(q).isFile()) return q; } return null; };
      const đọc = new Map(); const nộiDung = (f) => { if (!đọc.has(f)) đọc.set(f, fs.readFileSync(f, 'utf8')); return đọc.get(f); };
      const tệpPlan = [...new Set(Object.values(planTask).flatMap((t) => t.tệp).map(tìmTệp).filter(Boolean))];
      let tệpGốc = null;   // mọi file *.spec|test.* dưới gốc code — chỉ quét khi cần (TC vắng ở cả file plan)
      const quétGốc = () => { if (tệpGốc) return tệpGốc; tệpGốc = []; const gốc = gốcs[gốcs.length > 1 && gốcCode && !ROOT ? 0 : gốcs.length - 1];
        (function w(d) { if (tệpGốc.length > 5000) return; let es = []; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
          for (const e of es) { if (/^(node_modules|\.git|dist|build|coverage|\.next|docs)$/.test(e.name)) continue; const q = path.join(d, e.name);
            if (e.isDirectory()) w(q); else if (/\.(spec|test)\.[cm]?[jt]sx?$|(^|_)test_.*\.py$|_test\.(py|go)$/.test(e.name)) tệpGốc.push(q); } })(gốc);
        return tệpGốc; };
      for (const n of taskIds) {
        const pt = planTask[n]; if (!pt || !pt.tc.length || !pt.tệp.length) continue;
        const tệp = pt.tệp.map(tìmTệp).filter(Boolean);
        if (!tệp.length) {
          const câu = `Task ${n}: không thấy file test nào của plan (${pt.tệp.join(', ')}) dưới ${gốcs.join(' | ')}`;
          // V9f chỉ khi gốc ĐÁNG TIN (--root, hoặc `gốc code:` có thật trên đĩa) — gốc suy về cha docs/ vì `gốc code:` trỏ chỗ
          // không có ở máy này (worktree `~/dev/…` máy khác) thì vắng file là vắng ĐƯỜNG, không phải vắng test → ⚠ như cũ
          if (gốcTin) đỏBL('V9f', `${câu} — test không tồn tại thì Proof xanh không chứng minh gì`); else cảnhBáo.push(câu);
          continue;
        }
        const vắng = pt.tc.filter((t) => !tệp.some((f) => nộiDung(f).includes(t)));
        if (!vắng.length) continue;
        const chỗKhác = {};
        for (const t of vắng) { const f = tệpPlan.find((x) => !tệp.includes(x) && nộiDung(x).includes(t)) || quétGốc().find((x) => !tệp.includes(x) && nộiDung(x).includes(t)); if (f) chỗKhác[t] = path.relative(path.dirname(DOCS), f); }
        const khác = vắng.filter((t) => chỗKhác[t]), mất = vắng.filter((t) => !chỗKhác[t]);
        if (khác.length) cảnhBáo.push(`Task ${n}: Proof task không phủ Trace — ${khác.slice(0, 5).map((t) => `${t} @ ${chỗKhác[t]}`).join(', ')}${khác.length > 5 ? ` (+${khác.length - 5})` : ''} nằm ở file test khác, không trong \`- Test:\` của task (test có, Proof task không chạy nó)`);
        if (mất.length) đỏMới('V9d', `Task ${n}: ${mất.slice(0, 5).join(', ')}${mất.length > 5 ? ` (+${mất.length - 5})` : ''} không có trong file test nào của task (${pt.tệp.join(', ')}) — test không tồn tại thì Proof xanh không phủ TC`);
      }
    }
    // 15. V-RECEIPT — biên lai evidence.js cho mỗi Task có Proof (chỉ khi PASS)
    if (verdict === 'PASS') {
      const gốcDA = path.dirname(DOCS);
      const gitTop = (() => { const r = spawnSync('git', ['-C', ROOT || gốcDA, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; })();
      const tấtCả = EV.đọcBiênLai([ROOT, ROOT && gốcCode ? path.resolve(ROOT, gốcCode) : null, gốcDA, gốcCode ? path.resolve(gốcDA, gốcCode) : null, gitTop]);
      const g = (...a) => { const r = spawnSync('git', ['-C', gitTop, ...a], { encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; };
      const diffĐầu = (((v.match(/^>?\s*diff:\s*(\S+)/mi) || [])[1] || '').replace(/`/g, '').split(/\.{2,3}/));
      const shaA = gitTop && diffĐầu.length > 1 && /^[0-9a-f]{4,40}$/i.test(diffĐầu[0]) && !/^0+$/.test(diffĐầu[0]) ? g('rev-parse', '--verify', '-q', diffĐầu[0] + '^{commit}') : null;
      const shaB = gitTop ? (headLàSha ? g('rev-parse', '--verify', '-q', diffHead + '^{commit}') : g('rev-parse', 'HEAD')) : null;
      const tổTiên = (x, y) => spawnSync('git', ['-C', gitTop, 'merge-base', '--is-ancestor', x, y]).status === 0;
      let khôngGitĐãBáo = false;
      const trongKhoảng = (bl) => {
        if (!gitTop) { if (!khôngGitĐãBáo) { biênLai.cảnhBáo.push('không có git — không đối được head biên lai với khoảng diff'); khôngGitĐãBáo = true; } return true; }
        if (!bl.head || !shaB) return false;
        const h = g('rev-parse', '--verify', '-q', bl.head + '^{commit}'); if (!h) return false;
        if (tổTiên(h, shaB)) return !shaA || tổTiên(shaA, h);
        // head SAU b mà b..head chỉ chạm docs/.claude (verifier commit verification/sổ rồi mới chạy lại) = cùng code với b
        if (!tổTiên(shaB, h)) return false;
        const lệch = g('diff', '--name-only', shaB, h, '--', '.', `:(exclude)${path.relative(fs.realpathSync(gitTop), fs.realpathSync(DOCS)) || 'docs'}`, ':(exclude).claude');
        return lệch === '';
      };
      for (const n of taskIds) {
        const pt = planTask[n] || {}; const r0 = (rowOf[n] || [])[0]; if (!r0) continue;
        const shaFs = (r0.match(/phủ bởi full suite\s+`?([0-9a-f]{7,40})/i) || [])[1];
        if (shaFs) {
          const bl = tấtCả.find((b) => b.exit === 0 && b.head && b.head.toLowerCase().startsWith(shaFs.toLowerCase()));
          if (!bl) đỏBL('V-RECEIPT', `Task ${n}: "phủ bởi full suite ${shaFs}" không có biên lai exit 0 ở head ${shaFs} — chạy full suite qua \`evidence.js run -- <lệnh>\``);
          else biênLai.khớp[n] = path.basename(bl._file);
          continue;
        }
        if (!pt.proof) continue;
        const khoá = EV.chuẩnHoáLệnh(pt.proof);
        const cùngLệnh = tấtCả.filter((b) => EV.chuẩnHoáLệnh(b.cmd) === khoá).sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
        const lệnhChạy = `\`node .claude/skills/ba-toolkit/scripts/evidence.js run --screen ${SCREEN} -- ${pt.proof}\``;
        if (!cùngLệnh.length) { đỏBL('V-RECEIPT', `Task ${n}: không có biên lai cho Proof \`${pt.proof}\` — số trên dòng là lời chép, không phải lần chạy máy đối được; chạy ${lệnhChạy}`); continue; }
        const trong = cùngLệnh.filter(trongKhoảng);
        if (!trong.length) { đỏBL('V-RECEIPT', `Task ${n}: biên lai Proof có nhưng head ${String(cùngLệnh[0].head || 'null').slice(0, 7)} ngoài khoảng diff ${diffĐầu.join('..')} — chạy lại Proof ở HEAD`); continue; }
        const bl = trong[0];
        if (bl.exit !== 0) { đỏBL('V-RECEIPT', `Task ${n}: biên lai mới nhất trong khoảng có exit ${bl.exit} — Proof không xanh`); continue; }
        const số = (đãChạy[n] || {}).passed;
        if (số !== null && số !== undefined && bl.passed !== null && bl.passed !== undefined && bl.passed !== số) { đỏBL('V-RECEIPT', `Task ${n}: dòng ghi ${số} passed, biên lai ghi ${bl.passed} — số chép không khớp lần chạy`); continue; }
        if (số !== null && số !== undefined && (bl.passed === null || bl.passed === undefined)) biênLai.cảnhBáo.push(`Task ${n}: biên lai không đọc được dòng tổng runner — không đối được số passed`);
        biênLai.khớp[n] = path.basename(bl._file);
      }
    }
    for (const n of Object.keys(rowOf)) if (!taskIds.includes(+n)) đỏ('V3c', `bảng có Task ${n} nhưng plan.md không có`);
    // 6. nhãn TC ngoài code màn
    const mụcNhãn = (v.match(/^## TC ngoài code màn[^\n]*\n([\s\S]*?)(?=^## |\*\*Verdict:\*\*)/m) || [])[1] || '';
    for (const l of mụcNhãn.split('\n')) {
      const m = l.match(/^-\s*`?(TC-[A-Z0-9-]+)\s*·\s*LOẠI:\s*([^·`]+?)\s*·\s*([^`—]+?)`?\s*(?:—|$)/);
      if (!m) { if (/^-\s*\S/.test(l)) đỏ('V6a', `nhãn TC không đúng dạng \`TC-… · LOẠI: <nhãn> · file:line\`: ${l.slice(0, 80)}`); continue; }
      const [, tc, nhãn, chỗ] = m;
      if (!NHÃN.includes(nhãn)) { đỏ('V6b', `${tc}: nhãn "${nhãn}" không thuộc verify.tc.labels (${NHÃN.join(' · ')})`); continue; }
      const khôngChỗ = !/[\w./-]+\.\w+:\d+/.test(chỗ);
      if (khôngChỗ) đỏ('V6c', `${tc}: nhãn ${nhãn} không có file:line`);
      if (nhãn === 'tc-sai-tiền-đề' && !/(srs|design-spec)\.md:\d+|\b(E|R|BRule)-S?\d*[A-Z0-9-]*\d\b/.test(l)) { đỏ('V6d', `${tc}: tc-sai-tiền-đề mà không trích srs.md:/design-spec.md:/E-/R-/BRule — máy không tin "test sai" không dẫn chứng`); continue; }
      if (nhãn === 'tc-sai-tiền-đề' && khôngChỗ) continue;   // 13. nhãn không dẫn chứng không được route "sửa test.md" (FAIL chỉ cảnh báo)
      (nhãn === 'lỗi-code' ? phânLoại.lỗiCode : nhãn === 'tc-sai-tiền-đề' ? phânLoại.tcSaiTiềnĐề : phânLoại.đúngSrs).push({ tc, chỗ: chỗ.trim() });
    }
    // 7. vế thiếu
    const mụcVế = (v.match(/^## Vế thiếu[^\n]*\n([\s\S]*?)(?=^## |\*\*Verdict:\*\*)/m) || [])[1] || '';
    for (const l of mụcVế.split('\n')) {
      if (!/^-\s*\S/.test(l) || /^-\s*không có/i.test(l)) continue;
      const m = l.match(/^-\s*`?(TC-[A-Z0-9-]+)\s*·\s*vế thiếu\s*"([^"]+)"\s*·\s*LOẠI:\s*(thiếu-test|ngoài-tầng)\s*·\s*([^`]*?)`?\s*(?:—|$)/);
      if (!m) { đỏ('V7a', `Vế thiếu: dòng không đúng dạng \`TC · vế thiếu "…" · LOẠI: thiếu-test|ngoài-tầng · file:line|lý do\`: ${l.slice(0, 80)}`); continue; }
      const [, tc, vế, loại, chỗ] = m;
      if (loại === 'thiếu-test') { vếThiếu.thiếuTest.push({ tc, vế, chỗ: chỗ.trim() }); if (verdict === 'PASS') đỏ('V7b', `${tc}: vế "${vế.slice(0, 40)}" thiếu test mà verdict PASS — viết test hoặc ghi FAIL`); }
      else {
        if (chỗ.trim().length < 8) đỏ('V7c', `${tc}: ngoài-tầng phải nêu tầng + lý do`);
        // 11. lần thử thật: `đã thử: <lệnh> → <trích lỗi>` (có thể nằm sau dấu — ngoài backtick)
        const thử = l.match(/đã thử\s*:?\s*`?([^`→]{3,}?)`?\s*(?:→|->|=>)\s*(\S.{5,})$/i);
        const đãThử = thử ? { lệnh: thử[1].trim(), lỗi: thử[2].replace(/`/g, '').trim().slice(0, 160) } : null;
        if (!đãThử && verdict === 'PASS') {
          const câu = `${tc}: ngoài-tầng "${vế.slice(0, 30)}" không có \`đã thử: <lệnh> → <trích lỗi>\` — lý do không kèm lần thử là lời khai`;
          if (kiểuCũ === false || kiểuCũSauMốc) đỏMới('V11', câu); else cảnhBáo.push(câu);
        }
        vếThiếu.ngoàiTầng.push({ tc, vế, lýDo: chỗ.trim(), đãThử });
      }
    }
    // 8. lỗi gieo — chỉ soát khi PASS (gieo chạy sau Proof xanh; FAIL đã đỏ vì lý do khác)
    if (mGieo) {
      const thân = mGieo[1].replace(/<!--[\s\S]*?-->/g, '');
      const na = thân.match(/^\s*(?:-\s*)?`?n\/a`?\s*[—–-]+\s*(.+)$/mi);
      const dòngs = thân.split('\n').filter((l) => /^\|/.test(l) && !/^\|[\s:|-]+\|?\s*$/.test(l)).map((l) => l.replace(/^\||\|\s*$/g, '').split(/(?<!\\)\|/).map((c) => c.trim()))
        .filter((c) => /^M?\d+$/i.test(c[0]));
      if (na) lỗiGieo.na = na[1].trim();
      for (const c of dòngs) {
        const kq = (c[c.length - 1] || '').replace(/[*_`]/g, '').trim();
        const loại = (kq.match(/^(bắt|sống|lỗi-chạy)/) || [])[1];
        const chỗ = c[1] || '';
        const d = { id: c[0], chỗ: chỗ.replace(/`/g, ''), kếtQuả: loại || kq };
        lỗiGieo.dòng.push(d);
        if (!loại) { if (verdict === 'PASS') đỏ('V8g', `Lỗi gieo ${c[0]}: kết quả "${kq.slice(0, 30)}" không thuộc bắt · sống · lỗi-chạy`); continue; }
        if (loại === 'bắt') lỗiGieo.bắt++; else if (loại === 'sống') lỗiGieo.sống.push(d); else lỗiGieo.lỗiChạy++;
        if (loại !== 'lỗi-chạy' && !/[\w./-]+\.\w+:\d+/.test(chỗ) && verdict === 'PASS') đỏ('V8h', `Lỗi gieo ${c[0]}: thiếu file:line của chỗ gieo`);
      }
    }
    if (verdict === 'PASS') {
      if (!mGieo) đỏMới('V8a', 'thiếu mục `## Lỗi gieo` — PASS phải có bảng mutate.js (hoặc `n/a — <lý do>` khi màn không có code logic): suite xanh chỉ chứng minh test CHẠY');
      else if (lỗiGieo.na !== null) { if (lỗiGieo.na.replace(/[<>…]/g, '').trim().length < 8) đỏ('V8b', 'Lỗi gieo `n/a` phải nêu lý do (≥ 8 ký tự)'); if (lỗiGieo.dòng.length) đỏ('V8c', 'Lỗi gieo vừa `n/a` vừa có bảng — chọn một'); }
      else if (!lỗiGieo.dòng.length) đỏ('V8d', 'mục `## Lỗi gieo` rỗng — dán bảng mutate.js hoặc ghi `n/a — <lý do>`');
      else {
        for (const d of lỗiGieo.sống) đỏ('V8e', `Lỗi gieo ${d.id} SỐNG @ ${d.chỗ} — test không phân biệt bản đúng với bản sai; siết assert rồi gieo lại, hoặc ghi FAIL`);
        if (!lỗiGieo.bắt && !lỗiGieo.sống.length) đỏ('V8f', 'Lỗi gieo: không dòng nào `bắt` (toàn lỗi-chạy) — bảng không chứng minh test đỏ được; sửa chuỗi tim/proof rồi chạy lại');
      }
    }
    const mụcFail = (v.match(/^## FAIL[^\n]*\n([\s\S]*?)(?=^## |\*\*Verdict:\*\*)/m) || [])[1] || '';
    const dòngFail = mụcFail.split('\n').filter((l) => /^-\s*\S/.test(l));
    const tcSai = new Set(phânLoại.tcSaiTiềnĐề.map((x) => x.tc));
    chỉCònTcSai = verdict === 'FAIL' && dòngFail.length > 0 && tcSai.size > 0
      && dòngFail.every((l) => { const ids = l.match(/TC-[A-Z0-9-]+/g) || []; return ids.length && ids.every((id) => tcSai.has(id)); });
  }
}

if (JSON_MODE) console.log(JSON.stringify({ màn: SCREEN, folder: dir && path.relative(DOCS, dir), lỗi, phânLoại, chỉCònTcSai, vếThiếu, lỗiGieo, cảnhBáo, đãChạy, kiểuCũ, ngày: ngàyV || null, verdict: verdictV, miễnLuậtMới: miễnMới, gốcCode, luật: mãLỗi, luậtCảnhBáo: mãCảnhBáo, biênLai, integrity }, null, 2));
else {
  console.log(`validate-done ${SCREEN}: ${lỗi.length ? `CHƯA XONG — ${lỗi.length} lý do` : 'PASS — được đánh dev = ✅'}`);
  lỗi.forEach((l, i) => console.log(`  ❌ ${l} [${mãLỗi[i]}]`));
  for (const l of cảnhBáo) console.log(`  ⚠ ${l}`);
  for (const l of biênLai.cảnhBáo) console.log(`  ⚠ ${l}`);
  if (integrity.trạngThái === 'chưa cài' || integrity.trạngThái === 'chưa kiểm') console.log(`  ⚠ ${integrity.trạngThái === 'chưa cài' ? integrity.ghi : `integrity chưa kiểm được: ${integrity.ghi}`}`);
  if (phânLoại.tcSaiTiềnĐề.length) console.log(`  ↳ TC sai tiền đề (sửa test.md theo srs, không phải code): ${phânLoại.tcSaiTiềnĐề.map((x) => x.tc).join(', ')}${chỉCònTcSai ? ' — CHỈ CÒN loại này: route ba-test, không trả builder' : ''}`);
  if (vếThiếu.ngoàiTầng.length) console.log(`  ↳ vế ngoài tầng test (TC vẫn phủ, kiểm ở UAT/tay): ${vếThiếu.ngoàiTầng.map((x) => x.tc).join(', ')}`);
  if (lỗiGieo.dòng.length) console.log(`  ↳ lỗi gieo: bắt ${lỗiGieo.bắt} · sống ${lỗiGieo.sống.length} · lỗi-chạy ${lỗiGieo.lỗiChạy}`);
  else if (lỗiGieo.na !== null) console.log(`  ↳ lỗi gieo: n/a — ${lỗiGieo.na}`);
  if (phânLoại.lỗiCode.length) console.log(`  ↳ lỗi code: ${phânLoại.lỗiCode.map((x) => x.tc + ' @ ' + x.chỗ).join(' · ')}`);
}
RC.ghi('validate-done', mãLỗi);
process.exit(lỗi.length ? 1 : 0);
