#!/usr/bin/env node
/*
 * ac-judge/review-gate.js — CỔNG MÁY cho một bản review code trước khi nộp. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ac-judge/scripts/review-gate.js <review.md> [--root <repo>] [--prev <review-vòng-trước.md>] [--plain|--json]
 *
 * Đọc `docs/Ho-so/reviews/<Mã>-<ngày>.md` (do agent ac-judge ghi, theo assets/review-template.md) và đếm:
 *   1. header có `model:` + `diff:` + `vòng:`                 (ai review, review khoảng nào, vòng mấy — không có = không tái lập)
 *   2. có `## TL;DR` và TL;DR chứa đúng verdict token         (người đọc 3 dòng đầu phải biết kết luận)
 *   3. bảng Findings: mỗi dòng có mã `J-NN` duy nhất · mức ∈ 🔴🟠🟡 · ô `file:line` đúng dạng · 🔴/🟠 có ô Bằng chứng
 *      không rỗng · 🟣 KHÔNG được nằm trong bảng (pre-existing chỉ ở tóm tắt)
 *   4. ngân sách nhiễu: ≤ 5 dòng 🟡 trong bảng
 *   5. verdict khớp bảng mức: có 🔴 (mới hoặc còn mở) → REQUEST_CHANGES · không 🔴 mà có 🟠 → COMMENT · còn lại APPROVE
 *   6. vòng ≥ 2: phải có `## Giải quyết` (mỗi mã vòng trước một dòng, trạng thái hợp lệ); finding MỚI chỉ được 🔴;
 *      có `--prev` thì mọi `J-..` của vòng trước phải xuất hiện trong bảng Giải quyết
 *   7. không placeholder `<…>`/TODO ngoài code span; không từ mơ hồ (`có vẻ`, `nên chăng`, `hình như`, `có lẽ`,
 *      `chắc là`, `dường như`, `seems`, `perhaps`, `maybe`, `obviously`, `simply`); không dấu `!` ngoài code span
 *   8. `--root`: file trong `file:line` phải tồn tại và dòng ≤ số dòng file (bằng chứng phải mở ra được)
 *
 * Exit = số lỗi. ≠ 0 = KHÔNG được nộp (không đăng gh pr review, không đưa cho dev-run). Cổng là regex; cãi với
 * nó là cãi với regex — sửa review cho tới khi exit 0.
 *
 * Vì sao có: the-judge/review_gate.py — "every comment passes the gate; no manual overrides". Gốc kiểm JSON
 * findings + ban-list tiếng Anh/Bồ; bản này kiểm thẳng file .md (toolkit không đẻ JSON trung gian) và ban-list
 * là từ mơ hồ tiếng Việt: một finding "có vẻ sai" là finding chưa mở file — đúng thứ luật "bằng chứng hay im" cấm.
 *
 * gioiHan: không đánh giá finding đúng hay sai, không biết lint/typecheck đã bắt gì (đó là việc của agent khi
 * đọc output bậc thang). Không kiểm URL nguồn ngoài có thật (không mạng) — chỉ đòi dạng `https://`.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const EV = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'evidence.js'));   // header + placeholder chung với validate-done/check-eval

const argv = process.argv.slice(2);
const JSON_MODE = argv.includes('--json');
const opt = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
const ROOT = opt('--root') ? path.resolve(opt('--root')) : null;
const PREV = opt('--prev') ? path.resolve(opt('--prev')) : null;
const pos = argv.filter((a, i) => !a.startsWith('--') && !['--root', '--prev'].includes(argv[i - 1]));
const FILE = pos[0];
if (!FILE) { console.error('Dùng: review-gate.js <review.md> [--root <repo>] [--prev <review.md>]'); process.exit(2); }
if (!fs.existsSync(FILE)) { console.error(`không thấy ${FILE}`); process.exit(2); }

const MỨC = { '🔴': 'blocker', '🟠': 'should-fix', '🟡': 'nit', '🟣': 'pre-existing' };
const VERDICTS = ['APPROVE', 'COMMENT', 'REQUEST_CHANGES'];
const MAX_NIT = 5;
const MƠ_HỒ = ['có vẻ', 'nên chăng', 'hình như', 'có lẽ', 'chắc là', 'dường như', 'đại khái', 'hơi bị', 'seems', 'perhaps', 'maybe', 'obviously', 'simply', 'might want to', 'i think'];
const FILE_LINE = /([\w@./\\-]+\.[\w]+):(\d+)/;
const TRẠNG_THÁI = /^(đã sửa|còn mở|từ chối)/i;

const lỗi = [];
const txt = fs.readFileSync(FILE, 'utf8');
const section = (title) => {
  const re = new RegExp(`^##\\s+${title}[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|\\n\\*\\*Verdict:\\*\\*|(?![\\s\\S]))`, 'mi');
  const m = txt.match(re); return m ? m[1] : null;
};
const tableRows = (body) => (body || '').split('\n').filter((l) => /^\|/.test(l) && !/^\|\s*-{2,}/.test(l) && !/^\|\s*Mã\s*\|/i.test(l))
  .map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));

// 1. header
const thiếuH = EV.thiếuHeader(txt, ['model', 'diff']);
if (thiếuH.includes('model')) lỗi.push('header thiếu `model:` — không biết ai review');
if (thiếuH.includes('diff')) lỗi.push('header thiếu `diff:` — không biết review khoảng nào');
const vòng = +((txt.match(/^>?.*\bvòng:\s*(\d+)/mi) || [])[1] || 0);
if (!vòng) lỗi.push('header thiếu `vòng: N` — không biết đây là review đầu hay vòng kiểm giải quyết');

// 2. TL;DR + verdict
const verdict = (txt.match(/^\*\*Verdict:\*\*\s*(\S+)/m) || [])[1];
if (!verdict) lỗi.push('không có dòng `**Verdict:** APPROVE|COMMENT|REQUEST_CHANGES`');
else if (!VERDICTS.includes(verdict)) lỗi.push(`verdict "${verdict}" không thuộc ${VERDICTS.join('|')}`);
const tldr = section('TL;DR');
if (tldr === null) lỗi.push('thiếu mục `## TL;DR`');
else if (verdict && VERDICTS.includes(verdict) && !tldr.includes(verdict)) lỗi.push(`TL;DR không chứa verdict token "${verdict}" nguyên văn`);

// 3. bảng Findings
const fBody = section('Findings');
if (fBody === null) lỗi.push('thiếu mục `## Findings` (không có finding thì vẫn giữ bảng rỗng)');
const rows = tableRows(fBody);
const seen = new Set(); const count = { blocker: 0, 'should-fix': 0, nit: 0 };
for (const c of rows) {
  const [mã, mức, loc, vấnĐề, bằngChứng] = c;
  const tag = `${mã || '?'}`;
  if (!/^J-\d{2,}$/.test(mã || '')) { lỗi.push(`dòng "${tag}": mã phải dạng J-01, J-02…`); }
  else if (seen.has(mã)) lỗi.push(`${tag}: mã trùng`); else seen.add(mã);
  const sev = MỨC[(mức || '').trim().slice(0, 2)];
  if (!sev) { lỗi.push(`${tag}: mức "${mức}" không hợp lệ (🔴 🟠 🟡)`); continue; }
  if (sev === 'pre-existing') { lỗi.push(`${tag}: 🟣 pre-existing không được nằm trong bảng Findings — chuyển xuống mục tóm tắt`); continue; }
  count[sev]++;
  const fl = FILE_LINE.exec(loc || '');
  if (!fl) lỗi.push(`${tag}: ô file:line "${loc || ''}" không đúng dạng \`đường/dẫn.ext:số\``);
  else if (ROOT) {
    const p = path.join(ROOT, fl[1]);
    if (!fs.existsSync(p)) lỗi.push(`${tag}: ${fl[1]} không tồn tại dưới --root — bằng chứng chưa mở ra được`);
    else { const n = fs.readFileSync(p, 'utf8').split('\n').length; if (+fl[2] > n) lỗi.push(`${tag}: ${fl[1]}:${fl[2]} vượt số dòng file (${n})`); }
  }
  if (!(vấnĐề || '').trim()) lỗi.push(`${tag}: ô Vấn đề rỗng`);
  if ((sev === 'blocker' || sev === 'should-fix') && !(bằngChứng || '').replace(/[—–-]/g, '').trim()) lỗi.push(`${tag}: ${mức} phải có ô Bằng chứng (file:line đã đọc · lệnh tái hiện · URL https:// nguồn chính thức)`);
  if (/https?:\/\//.test(bằngChứng || '') && !/https:\/\//.test(bằngChứng || '')) lỗi.push(`${tag}: URL nguồn ngoài phải là https://`);
  if (c.length < 6) lỗi.push(`${tag}: thiếu cột — bảng phải đủ Mã · Mức · file:line · Vấn đề · Bằng chứng · Cách sửa`);
}
// 4. ngân sách nhiễu
if (count.nit > MAX_NIT) lỗi.push(`${count.nit} nit 🟡 trong bảng — trần ${MAX_NIT}, phần dư đếm ở mục "Nit vượt ngân sách"`);

// 6. vòng ≥ 2
let carry = { blocker: 0, 'should-fix': 0 };
if (vòng >= 2) {
  const gBody = section('Giải quyết');
  if (gBody === null) lỗi.push('vòng ≥ 2 phải có mục `## Giải quyết` (mỗi mã vòng trước một dòng)');
  else {
    const gRows = tableRows(gBody); const gSeen = new Set();
    for (const c of gRows) {
      const [mã, mức, trạngThái] = c;
      if (!/^J-\d{2,}$/.test(mã || '')) { lỗi.push(`Giải quyết "${mã || '?'}": mã phải dạng J-NN`); continue; }
      gSeen.add(mã);
      const sev = MỨC[(mức || '').trim().slice(0, 2)];
      if (!sev) lỗi.push(`Giải quyết ${mã}: thiếu mức`);
      if (!TRẠNG_THÁI.test(trạngThái || '')) lỗi.push(`Giải quyết ${mã}: trạng thái "${trạngThái || ''}" — chỉ "đã sửa <commit>" · "còn mở" · "từ chối — chấp nhận"`);
      else if (/^đã sửa/i.test(trạngThái) && !/\b[0-9a-f]{7,40}\b/.test(trạngThái)) lỗi.push(`Giải quyết ${mã}: "đã sửa" phải kèm commit sha`);
      else if (/^còn mở/i.test(trạngThái) && (sev === 'blocker' || sev === 'should-fix')) carry[sev]++;
    }
    if (PREV) {
      if (!fs.existsSync(PREV)) lỗi.push(`--prev ${PREV} không tồn tại`);
      else {
        const pTxt = fs.readFileSync(PREV, 'utf8');
        const pFind = (pTxt.match(/^##\s+Findings[^\n]*\n([\s\S]*?)(?=^##\s|\n\*\*Verdict)/mi) || [])[1] || '';
        const pOpen = (pTxt.match(/^##\s+Giải quyết[^\n]*\n([\s\S]*?)(?=^##\s|\n\*\*Verdict)/mi) || [])[1] || '';
        // mã cần theo dõi = mọi mã trong bảng Findings vòng trước + mã "còn mở" trong Giải quyết vòng trước
        const cần = new Set([...tableRows(pFind).map((c) => c[0]), ...tableRows(pOpen).filter((c) => /^còn mở/i.test(c[2] || '')).map((c) => c[0])].filter((m) => /^J-\d{2,}$/.test(m || '')));
        for (const m of cần) if (!gSeen.has(m)) lỗi.push(`Giải quyết thiếu ${m} của vòng trước — mọi mã phải có trạng thái`);
      }
    }
    for (const c of rows) { const sev = MỨC[(c[1] || '').trim().slice(0, 2)]; if (sev && sev !== 'blocker') lỗi.push(`${c[0]}: vòng ${vòng} chỉ được nêu 🔴 MỚI — ${c[1]} thuộc bảng Giải quyết hoặc không nêu (Convergence)`); }
  }
}

// 5. verdict khớp mức
if (verdict && VERDICTS.includes(verdict)) {
  const expected = count.blocker + carry.blocker > 0 ? 'REQUEST_CHANGES' : count['should-fix'] + carry['should-fix'] > 0 ? 'COMMENT' : 'APPROVE';
  if (verdict !== expected) lỗi.push(`verdict ${verdict} lệch bảng mức: 🔴=${count.blocker + carry.blocker} 🟠=${count['should-fix'] + carry['should-fix']} → phải là ${expected}`);
}

// 7. placeholder · từ mơ hồ · dấu !
const plain = EV.bỏCode(txt);
const { ph, todo } = EV.placeholderTrong(plain);
if (ph.length) lỗi.push(`còn placeholder: ${ph.slice(0, 3).join(' ')}`);
if (todo) lỗi.push('còn TODO trong review');
const lower = plain.toLowerCase();
for (const w of MƠ_HỒ) if (new RegExp(`(^|[^\\p{L}])${w.replace(/ /g, '\\s+')}(?=[^\\p{L}]|$)`, 'u').test(lower)) lỗi.push(`từ mơ hồ "${w}" — finding chưa chắc thì mở file đọc thêm hoặc hạ thành câu hỏi có bằng chứng, không đoán`);
if (/!/.test(plain)) lỗi.push('có dấu `!` ngoài code span — finding nói bằng bằng chứng, không bằng cảm thán');

const out = { file: path.basename(FILE), vòng, verdict, findings: rows.length, mức: count, cònMở: carry, lỗi };
if (JSON_MODE) console.log(JSON.stringify(out, null, 2));
else {
  console.log(`review-gate ${path.basename(FILE)}: ${lỗi.length ? `KHÔNG ĐƯỢC NỘP — ${lỗi.length} lỗi` : `PASS — ${rows.length} finding (🔴${count.blocker} 🟠${count['should-fix']} 🟡${count.nit}), verdict ${verdict}, vòng ${vòng}`}`);
  for (const l of lỗi) console.log(`  ❌ ${l}`);
}
process.exit(lỗi.length);
