#!/usr/bin/env node
/*
 * ba-toolkit/realrun.js — CỔNG MỚI PHẢI CHẠY THẬT TRƯỚC MAIN. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ba-toolkit/scripts/realrun.js [--plain|--json]           # liệt kê checker chưa có lần chạy thật
 *   node .claude/skills/ba-toolkit/scripts/realrun.js --strict                   # exit = số vi phạm bánh cóc (CI/test.js)
 *   node .claude/skills/ba-toolkit/scripts/realrun.js --write-baseline [--allow-grow]
 *   (thử nghiệm: --root <thư mục skills> · --data <realrun.json> · --baseline <file>)
 *   --oan <file>   sổ báo oan (mặc định `.claude/checker-oan.jsonl` ở cwd, có thì đọc) → đếm oan MỞ/ĐÓNG theo checker (W1)
 *
 * Vì sao có: bảng bằng chứng 25/09/2026 trên 3 dự án thật (helpdesk · desktop · e-learning). Checker nào lần đầu chạy trên
 * hình thật cũng hỏng theo cách example/ không lộ — dự án desktop: 4/5 script mới sai im lặng; dự án helpdesk 24/09: validate-done
 * 5 kiểu OAN, scan-bypasses exit 256→0, scan-wiring im vì tên nhắc trong .md. Nhóm ĐỐI KHÁNG của test.js chứng minh
 * checker không luôn-exit-0 trên fixture DO TA VIẾT; nó không chứng minh checker nhìn thấy gì trên dự án người khác
 * viết. "Chạy thật" là một bằng chứng riêng, và trước đây nó chỉ nằm trong trí nhớ.
 *
 * Nguồn: `ba-toolkit/references/realrun.json` — mỗi khoá (`<skill>/<script>` hoặc `<skill>/<script>#<mã luật hook>`) một
 * danh sách lần chạy `{duAn, ngay, ref, ketQua: bắt|im|oan, ghiChu?}`. Lần chạy ở `toolkit`/`example`/`dogfood` KHÔNG tính.
 *
 * Tập checker (không phán, chỉ theo quy ước tên + danh sách cố định):
 *   · mọi `.claude/skills/<skill>/scripts/{check,validate,scan,inspect}[-*].js`
 *   · CỔNG_KHÁC dưới đây (cổng không mang tên kiểu checker: accept, rules, mutate, hook…)
 *   · mỗi luật hook khai ở `hook-gate.js` → LUẬT_CỦA_HOOK (`ba-toolkit/hook-gate#S1`…) — luật hook cũng là cổng.
 * Một script có lần chạy thật khi chính khoá của nó hoặc một khoá `#luật` của nó có lần chạy thật.
 *
 * Bánh cóc: `ba-toolkit/references/realrun.baseline.json` = checker CHƯA chạy thật được chấp nhận hôm nay. `--strict`
 * đỏ (exit = số vi phạm) khi: checker chưa chạy thật MỚI (không có trong baseline) · baseline còn ghi checker nay ĐÃ
 * chạy thật hoặc không còn tồn tại (buộc thu hẹp — danh sách chỉ được giảm) · một lần chạy sai dạng (thiếu ngày/kết quả).
 * `--write-baseline` từ chối nới (thêm khoá) trừ khi `--allow-grow`.
 * Bản công khai (08/10/2026): realrun.json là dữ liệu dev giữ riêng (manifest devOnly) — vắng file (không --data) → in
 *   "không áp" exit 0 (vẫn đếm sổ báo oan; --write-baseline từ chối exit 2); khoá baseline của skill không có mặt (gói Pro/devOnly) không tính "baseline thừa".
 *
 * gioiHan: chỉ đếm — không biết lần chạy ghi trong realrun.json có thật không (ref là để người soát lần theo), không
 * biết "một lần chạy" có đủ đại diện. Không nhìn agent (ac-verifier, ac-judge…): chúng không phải script. Checker không
 * theo quy ước tên và không có trong CỔNG_KHÁC thì không thấy — thêm vào CỔNG_KHÁC khi viết nó.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const cờ = (k) => argv.includes(k);
const giáTrị = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };

const GỐC = path.resolve(giáTrị('--root') || path.join(__dirname, '..', '..'));
const DỮ_LIỆU = path.resolve(giáTrị('--data') || path.join(GỐC, 'ba-toolkit', 'references', 'realrun.json'));
const BASELINE = path.resolve(giáTrị('--baseline') || path.join(GỐC, 'ba-toolkit', 'references', 'realrun.baseline.json'));

const TÊN_CHECKER = /^(check|validate|scan|inspect)(-[a-z0-9-]+)?\.js$/;
const CỔNG_KHÁC = [
  'ba-portal/render-check',
  'ac-verify/accept', 'ac-po/pick', 'ac-judge/review-gate', 'ac-judge/rules', 'ac-verify/mutate', 'ac-verify/ve',
  'ba-auto/run-gates', 'ba-toolkit/devserver', 'ba-toolkit/lint', 'ba-figma-draw/figma-sync',
  'ba-toolkit/hook-gate', 'ba-toolkit/hook-lint', 'ba-toolkit/hook-guard', 'ba-toolkit/hook-session',
];
const NỘI_BỘ = /^(toolkit|ba-toolkit|example|dogfood)$/i;
const KẾT_QUẢ = new Set(['bắt', 'im', 'oan']);

function tậpChecker() {
  const ra = new Set();
  let skills = [];
  try { skills = fs.readdirSync(GỐC, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch { /* rỗng */ }
  for (const sk of skills) {
    let tệp = [];
    try { tệp = fs.readdirSync(path.join(GỐC, sk, 'scripts')); } catch { continue; }
    for (const f of tệp) if (TÊN_CHECKER.test(f)) ra.add(`${sk}/${f.replace(/\.js$/, '')}`);
  }
  for (const k of CỔNG_KHÁC) if (fs.existsSync(path.join(GỐC, ...k.split('/').slice(0, 1), 'scripts', k.split('/')[1] + '.js'))) ra.add(k);
  try {
    const { LUẬT_CỦA_HOOK } = require(path.join(GỐC, 'ba-toolkit', 'scripts', 'hook-gate.js'));
    for (const [hook, ds] of Object.entries(LUẬT_CỦA_HOOK || {})) for (const m of ds) ra.add(`ba-toolkit/${hook}#${m}`);
  } catch { /* bản cũ không khai luật hook → chỉ cấp script */ }
  return [...ra].sort();
}

function đọcJSON(f, mặcĐịnh) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return mặcĐịnh; } }

function soát() {
  const dữ = đọcJSON(DỮ_LIỆU, null);
  const lỗiDữLiệu = [];
  if (!dữ || typeof dữ.cong !== 'object') lỗiDữLiệu.push(`không đọc được ${path.relative(process.cwd(), DỮ_LIỆU)} (thiếu khối "cong")`);
  const cổng = (dữ && dữ.cong) || {};
  const thật = {};                                            // khoá → số lần chạy thật hợp lệ
  for (const [k, ds] of Object.entries(cổng)) {
    thật[k] = 0;
    if (!Array.isArray(ds)) { lỗiDữLiệu.push(`${k}: phải là mảng lần chạy`); continue; }
    ds.forEach((x, i) => {
      const sai = [];
      if (!x || !x.duAn) sai.push('duAn');
      if (!x || !/^\d{4}-\d{2}-\d{2}$/.test(String(x.ngay || ''))) sai.push('ngay');
      if (!x || !x.ref) sai.push('ref');
      if (!x || !KẾT_QUẢ.has(x.ketQua)) sai.push('ketQua');
      if (sai.length) { lỗiDữLiệu.push(`${k}[${i}]: thiếu/sai ${sai.join(', ')}`); return; }
      if (!NỘI_BỘ.test(String(x.duAn).trim())) thật[k]++;
    });
  }
  const tập = tậpChecker();
  const cóThật = (k) => (thật[k] || 0) > 0 || (!k.includes('#') && Object.keys(thật).some((x) => x.startsWith(k + '#') && thật[x] > 0));
  const chưa = tập.filter((k) => !cóThật(k));
  const có = tập.filter((k) => cóThật(k));
  const bl = đọcJSON(BASELINE, null);
  const dsBl = bl && Array.isArray(bl.chuaChayThat) ? bl.chuaChayThat : null;
  const viPhạm = [...lỗiDữLiệu.map((l) => 'dữ liệu: ' + l)];
  const cảnhBáo = [];
  if (!dsBl) viPhạm.push(`thiếu baseline ${path.basename(BASELINE)} — chạy --write-baseline --allow-grow một lần`);
  else {
    for (const k of chưa) if (!dsBl.includes(k)) viPhạm.push(`${k}: checker MỚI chưa có lần chạy thật — chạy trên một dự án thật rồi ghi realrun.json`);
    for (const k of dsBl) {
      if (!tập.includes(k) && !fs.existsSync(path.join(GỐC, k.split('/')[0]))) continue;   // skill gói Pro/devOnly vắng ở bản này
      if (!tập.includes(k)) viPhạm.push(`${k}: baseline thừa — checker không còn tồn tại (xoá khỏi baseline)`);
      else if (cóThật(k)) viPhạm.push(`${k}: baseline thừa — đã có lần chạy thật (xoá khỏi baseline, bánh cóc chỉ thu hẹp)`);
    }
  }
  for (const k of Object.keys(cổng)) {
    const [sk, rest] = k.split('/');
    const tên = (rest || '').split('#')[0];
    if (!tên || !fs.existsSync(path.join(GỐC, sk, 'scripts', tên + '.js'))) cảnhBáo.push(`${k}: khoá trỏ script không có`);
  }
  return { tổng: tập.length, có, chưa, baseline: dsBl, viPhạm, cảnhBáo };
}

// Bản công khai: realrun.json vắng → không soát bánh cóc (không có dữ liệu để soát — không phải "mọi checker chưa chạy thật"),
// vẫn đếm sổ báo oan bên dưới.
const VẮNG = !giáTrị('--data') && !fs.existsSync(DỮ_LIỆU);
const kq = VẮNG ? { tổng: 0, có: [], chưa: [], baseline: null, viPhạm: [], cảnhBáo: [], khôngÁp: `${path.relative(process.cwd(), DỮ_LIỆU)} vắng (dữ liệu chạy thật giữ ở repo phát triển, không xuất công khai)` } : soát();
// Sổ báo oan (oan.js): đếm theo khoá checker — cùng khoá với realrun.json. Chỉ in, không vào --strict (oan là tín hiệu
// cho người sửa checker, không phải vi phạm bánh cóc).
const SỔ_OAN = path.resolve(giáTrị('--oan') || path.join(process.cwd(), '.claude', 'checker-oan.jsonl'));
let oanTheo = {};
try { if (fs.existsSync(SỔ_OAN)) oanTheo = require(path.join(GỐC, 'ba-toolkit', 'scripts', 'oan.js')).đếm(SỔ_OAN); } catch { /* bản cũ không có oan.js */ }

if (cờ('--write-baseline') && VẮNG) { console.error(`realrun: không ghi baseline — ${kq.khôngÁp}`); process.exit(2); }
if (cờ('--write-baseline')) {
  const cũ = kq.baseline || [];
  const nới = kq.chưa.filter((k) => !cũ.includes(k));
  if (nới.length && !cờ('--allow-grow')) {
    console.error(`Từ chối nới baseline (+${nới.length}): ${nới.join(', ')}\n  Checker mới phải chạy thật trước — hoặc --allow-grow nếu người dùng đã chốt nhận nợ.`);
    process.exit(1);
  }
  fs.writeFileSync(BASELINE, JSON.stringify({
    _: 'Bánh cóc realrun.js: checker CHƯA có lần chạy thật trên dự án thật, được chấp nhận tới hôm nay. Chỉ được THU HẸP — chạy thật rồi ghi realrun.json, rồi xoá khoá ở đây. Nới cần --allow-grow.',
    chuaChayThat: kq.chưa,
  }, null, 1) + '\n', 'utf8');
  console.log(`Đã ghi ${path.basename(BASELINE)}: ${kq.chưa.length} checker chưa chạy thật.`);
  process.exit(0);
}

if (cờ('--json')) {
  console.log(JSON.stringify({ tong: kq.tổng, coChayThat: kq.có, chuaChayThat: kq.chưa, viPham: kq.viPhạm, canhBao: kq.cảnhBáo, oanTheoChecker: oanTheo, ...(VẮNG ? { khongAp: kq.khôngÁp } : {}) }, null, 2));
} else if (VẮNG) {
  console.log(`realrun: không áp — ${kq.khôngÁp}`);
  if (Object.keys(oanTheo).length) console.log(`Báo oan (${path.relative(process.cwd(), SỔ_OAN)}):\n` + Object.entries(oanTheo).sort().map(([k, n]) => `  · ${k}: ${n.mở} mở · ${n.đóng} đóng`).join('\n'));
} else {
  console.log(`realrun: ${kq.tổng} checker/cổng · ${kq.có.length} có lần chạy thật · ${kq.chưa.length} CHƯA (baseline ${kq.baseline ? kq.baseline.length : '—'})`);
  if (kq.chưa.length) console.log('Chưa chạy thật:\n' + kq.chưa.map((k) => '  · ' + k).join('\n'));
  if (Object.keys(oanTheo).length) console.log(`Báo oan (${path.relative(process.cwd(), SỔ_OAN)}):\n` + Object.entries(oanTheo).sort().map(([k, n]) => `  · ${k}: ${n.mở} mở · ${n.đóng} đóng`).join('\n'));
  if (kq.cảnhBáo.length) console.log('⚠️ ' + kq.cảnhBáo.join('\n⚠️ '));
  if (kq.viPhạm.length) console.log('❌ ' + kq.viPhạm.join('\n❌ '));
}
process.exit(cờ('--strict') ? kq.viPhạm.length : 0);
