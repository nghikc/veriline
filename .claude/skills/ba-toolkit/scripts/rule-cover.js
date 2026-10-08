#!/usr/bin/env node
/*
 * ba-toolkit/rule-cover.js — MỖI LUẬT của checker gác PASS phải có ít nhất một fixture gãy trong test.js bắn đúng luật đó.
 * Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ba-toolkit/scripts/rule-cover.js [--log <file>] [--plain|--json]
 *   node .claude/skills/ba-toolkit/scripts/rule-cover.js --write-baseline [--allow-grow]     # ghi lại baseline (bánh cóc)
 *
 * Cách đo (không sửa từng ca test): checker opt-in in `--rules` = JSON `[{mã, môTả}]`, và khi có biến môi trường
 * `BA_RULE_LOG=<file>` thì APPEND mỗi mã luật đã bắn (một dòng `<checker>\t<mã>`). test.js đặt biến đó cho cả bộ; chạy xong,
 * luật nào trong `--rules` mà log không có = chưa fixture gãy nào bắn nó. Không `--log` → script tự chạy test.js (~1 phút)
 * với log tạm.
 *
 * Bánh cóc: `ba-toolkit/references/rule-cover.baseline.json` = { "<checker>": ["<mã>", …] } — luật chưa phủ ĐƯỢC CHẤP NHẬN
 * hôm nay. Đỏ (exit = số vi phạm) khi: luật chưa phủ MỚI (không có trong baseline) · baseline còn ghi luật nay ĐÃ phủ hoặc
 * luật không còn tồn tại (buộc thu hẹp — số luật chưa phủ chỉ được giảm) · log có mã checker không khai trong `--rules`
 * (mã lạ = checker in luật mà danh sách quên). `--write-baseline` từ chối nới (thêm mã) trừ khi `--allow-grow`.
 *
 * Checker opt-in (thêm checker = thêm một dòng CHECKER + `--rules` + gọi `ghi()` ở checker đó):
 *   validate-done (V…) · check-eval (E…) · accept (A…) · scan-feasible luật 9 (F9…) · check-design (DS-…) · check-el (EL-…) · figma-sync (FS-…) ·
 *   check-video (VS-…/VB-…) · scan-lach (LACH-…)
 *
 * Vì sao có: tlc-spec-lean `selftest.py` — "mutate the artifact once per rule and require every mutant to be killed". Nhóm
 * đối kháng của test.js chứng minh checker KHÔNG luôn-exit-0, nhưng không nói luật nào chưa từng bị thử: một luật viết
 * sai regex (không bao giờ bắn) vẫn để CI xanh. Đếm theo mã luật biến "có ca đối kháng" thành "mỗi luật có ca đối kháng".
 *
 * Checker của skill vắng (gói Pro/devOnly ở repo công khai, 08/10/2026): `existsSync` sai → ghi "vắng — không áp", không đỏ,
 *   và mã của nó trong baseline không tính "baseline thừa".
 *
 * gioiHan: "đã phủ" = mã luật XUẤT HIỆN ít nhất một lần khi test.js chạy — không biết ca đó cố ý thử luật này hay bắn ké
 * (một fixture gãy nhiều chỗ phủ nhiều luật cùng lúc); không biết luật có im đúng lúc (đối chứng dương là việc của ca
 * test). Chỉ thấy checker đã opt-in; luật check trong lint.js không đo ở đây. Log là append — hai test.js chạy song song
 * cùng file log sẽ trộn nhau (test.js mặc định dùng log trong thư mục tạm riêng).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SK = path.resolve(__dirname, '..', '..');
const CHECKER = [
  ['validate-done', 'ac-verify/scripts/validate-done.js'],
  ['check-eval', 'ac-eval/scripts/check-eval.js'],                 // gói Pro — vắng (existsSync) → 'không áp'
  ['accept', 'ac-verify/scripts/accept.js'],
  ['scan-feasible', 'ba-feasible/scripts/scan-feasible.js'],
  ['check-design', 'ba-html-design/scripts/check-design.js'],
  ['check-el', 'ba-html-design/scripts/check-el.js'],
  ['figma-sync', 'ba-figma-draw/scripts/figma-sync.js'],            // devOnly — vắng (existsSync) → 'không áp'
  ['check-video', 'ba-userguide-video/scripts/check-video.js'],      // devOnly — vắng (existsSync) → 'không áp'
  ['scan-lach', 'ba-toolkit/scripts/scan-lach.js'],
];
const BASELINE = path.join(SK, 'ba-toolkit', 'references', 'rule-cover.baseline.json');

/** Checker gọi khi sắp thoát: ghi mã luật đã bắn vào $BA_RULE_LOG (không có biến → không làm gì; lỗi ghi → im). */
function ghi(checker, mãs) {
  const f = process.env.BA_RULE_LOG;
  if (!f || !mãs || !mãs.length) return;
  try { fs.appendFileSync(f, [...new Set(mãs)].map((m) => `${checker}\t${m}\n`).join('')); } catch { /* đo độ phủ không được làm gãy checker */ }
}
/** Checker gọi ĐẦU TIÊN (trước khi soát tham số): `--rules` → in danh sách luật rồi thoát 0. */
function inLuật(argv, luật) {
  if (!argv.includes('--rules')) return;
  console.log(JSON.stringify(luật.map(([mã, môTả]) => ({ mã, môTả })), null, 2));
  process.exit(0);
}
module.exports = { ghi, inLuật, CHECKER, BASELINE };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const opt = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
  const JSON_MODE = argv.includes('--json');
  let log = opt('--log');
  if (!log) {
    log = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rule-cover-')), 'rule.log');
    fs.writeFileSync(log, '');
    if (!JSON_MODE) console.log('rule-cover: không có --log → chạy test.js với BA_RULE_LOG tạm (~1 phút)…');
    spawnSync(process.execPath, [path.join(__dirname, 'test.js')], { cwd: path.resolve(SK, '..', '..'), env: { ...process.env, BA_RULE_LOG: log }, encoding: 'utf8', maxBuffer: 1e8 });
  }
  if (!fs.existsSync(log)) { console.error(`rule-cover: không thấy log ${log}`); process.exit(2); }
  const bắn = {};
  for (const l of fs.readFileSync(log, 'utf8').split('\n')) { const [c, m] = l.split('\t'); if (c && m) (bắn[c] = bắn[c] || new Set()).add(m.trim()); }
  let base = {};
  try { base = JSON.parse(fs.readFileSync(BASELINE, 'utf8')); } catch { /* chưa có baseline = rỗng */ }

  const kq = []; const viPhạm = [];
  for (const [tên, rel] of CHECKER) {
    if (!fs.existsSync(path.join(SK, rel))) { kq.push({ checker: tên, vắng: true, tổng: 0, đãPhủ: 0, chưaPhủ: [], mới: [], thừa: [], lạ: [] }); continue; }
    const r = spawnSync(process.execPath, [path.join(SK, rel), '--rules'], { encoding: 'utf8' });
    let luật = [];
    try { luật = JSON.parse(r.stdout); } catch { viPhạm.push(`${tên}: \`--rules\` không trả JSON (exit ${r.status}) — checker chưa opt-in hoặc hỏng`); }
    const mãs = luật.map((x) => x.mã); const đã = bắn[tên] || new Set();
    const chưa = mãs.filter((m) => !đã.has(m));
    const lạ = [...đã].filter((m) => !mãs.includes(m));
    const b = new Set(base[tên] || []);
    const mới = chưa.filter((m) => !b.has(m));
    const thừa = [...b].filter((m) => !chưa.includes(m));
    for (const m of mới) viPhạm.push(`${tên} ${m}: luật chưa phủ MỚI (không có trong baseline) — viết fixture gãy bắn nó trong test.js — ${(luật.find((x) => x.mã === m) || {}).môTả || ''}`);
    for (const m of thừa) viPhạm.push(`${tên} ${m}: baseline còn ghi nhưng luật ${mãs.includes(m) ? 'nay ĐÃ phủ' : 'không còn tồn tại'} — xoá khỏi ${path.relative(process.cwd(), BASELINE)} (bánh cóc chỉ thu hẹp)`);
    for (const m of lạ) viPhạm.push(`${tên} ${m}: checker bắn mã không khai trong \`--rules\``);
    kq.push({ checker: tên, tổng: mãs.length, đãPhủ: mãs.length - chưa.length, chưaPhủ: chưa.map((m) => ({ mã: m, môTả: (luật.find((x) => x.mã === m) || {}).môTả })), mới, thừa, lạ });
  }

  if (argv.includes('--write-baseline')) {
    const mớiBase = Object.fromEntries(kq.map((k) => [k.checker, k.vắng ? (base[k.checker] || []) : k.chưaPhủ.map((x) => x.mã)]));
    const nới = kq.flatMap((k) => k.mới.map((m) => `${k.checker} ${m}`));
    if (nới.length && !argv.includes('--allow-grow')) { console.error(`rule-cover: từ chối NỚI baseline (${nới.join(', ')}) — viết fixture, hoặc --allow-grow nếu người chốt`); process.exit(1); }
    fs.writeFileSync(BASELINE, JSON.stringify(mớiBase, null, 2) + '\n');
    console.log(`rule-cover: đã ghi ${path.relative(process.cwd(), BASELINE)}`); process.exit(0);
  }
  if (JSON_MODE) console.log(JSON.stringify({ log, checker: kq, viPhạm }, null, 2));
  else {
    const T = kq.reduce((a, k) => a + k.tổng, 0), P = kq.reduce((a, k) => a + k.đãPhủ, 0);
    console.log(`rule-cover: ${P}/${T} luật có fixture gãy bắn · ${viPhạm.length ? `${viPhạm.length} vi phạm bánh cóc` : 'bánh cóc giữ'}`);
    for (const k of kq) {
      if (k.vắng) { console.log(`  ${k.checker.padEnd(14)} vắng (skill gói Pro/devOnly không có ở bản này) — không áp`); continue; }
      console.log(`  ${k.checker.padEnd(14)} ${k.đãPhủ}/${k.tổng} phủ${k.chưaPhủ.length ? ` · chưa: ${k.chưaPhủ.map((x) => x.mã).join(' ')}` : ''}`);
      for (const x of k.chưaPhủ) console.log(`      ${x.mã.padEnd(6)} ${x.môTả}`);
    }
    for (const v of viPhạm) console.log(`  ❌ ${v}`);
  }
  process.exit(viPhạm.length);
}
