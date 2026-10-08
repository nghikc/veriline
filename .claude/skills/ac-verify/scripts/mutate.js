#!/usr/bin/env node
/*
 * ac-verify/mutate.js — GIEO LỖI để chứng minh test BẮT ĐƯỢC hồi quy, không chỉ "chạy xanh". Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ac-verify/scripts/mutate.js <loi.json> [--root <repo>] [--timeout <giây>] [--no-link] [--json|--plain]
 *
 * <loi.json> = mảng ≤ 5 phần tử `{ "file": "src/a.ts", "tim": "x > 0", "thay": "x >= 0", "proof": "npx jest tests/a.test.ts",
 * "nham": "TC-S09-01" }` (`tìm`/`nhắm` có dấu cũng nhận; `nham` tuỳ chọn — assert mà lỗi này nhắm). Agent ac-verifier CHỌN chỗ
 * gieo (lật điều kiện · lệch biên 1 · đổi giá trị trả/mã trạng thái · bỏ side effect), script chỉ CHẠY và ĐẾM:
 *   1. baseline `git status --porcelain` của repo chính
 *   2. `git worktree add --detach <tạm> HEAD` — không bao giờ đột biến cây thật, không `git stash` (stash ghi trạng thái TRƯỚC
 *      đột biến nên pop không đảo được nó; cây sạch thì stash không tạo gì — tlc-spec-lean verify.md §4)
 *   3. `node_modules` (≤ 3 tầng, không bị git theo dõi) được symlink sang worktree — không có nó thì mọi proof đỏ vì thiếu deps
 *      và mọi lỗi thành "bắt" giả; `--no-link` tắt
 *   4. mỗi proof khác nhau chạy MỘT lần khi CHƯA gieo — đỏ sẵn → mọi lỗi dùng proof đó là `lỗi-chạy` (không phải `bắt`)
 *   5. mỗi lỗi riêng lẻ: thay lần xuất hiện ĐẦU của `tim` → chạy proof → `bắt` (exit ≠ 0) · `sống` (exit 0) · `lỗi-chạy`
 *      (không có file / không thấy chuỗi `tim` / timeout); khôi phục worktree (`git checkout -- .`) trước lỗi kế
 *   6. dọn worktree (cả khi hỏng, cả khi Ctrl-C) rồi so porcelain repo chính với baseline — khác = lần chạy VÔ HIỆU
 * In bảng markdown dán thẳng vào mục `## Lỗi gieo` của verification.md (validate-done.js đọc: PASS bị chặn khi còn `sống`).
 *
 * Exit: 0–5 = số lỗi SỐNG (0 = mọi lỗi áp được đều bị bắt; `lỗi-chạy` không tính — xem bảng) · 12 = sai tham số (chưa chạy gì,
 * kể cả > 5 lỗi) · 10 = hạ tầng hỏng (không phải repo git, worktree add/dọn thất bại) · 11 = repo chính ĐỔI sau khi chạy
 * (porcelain khác baseline — dừng, kiểm tay, coi kết quả vô hiệu).
 *
 * Vì sao có: dự án helpdesk S12 17/09 — verifier PASS ba vòng mà ac-eval thấy 40 case chỉ có bằng chứng tĩnh. Suite xanh chứng
 * minh test CHẠY; chỉ một lỗi bị bắt mới chứng minh test CÓ THỂ ĐỎ. Nguồn: agent-skills tlc-spec-lean `references/verify.md`
 * §4 "Inject faults" + `validate_verification.py` ("PASS but a mutant survived").
 *
 * gioiHan: không tự chọn chỗ gieo (việc của agent — máy không biết đâu là hành vi) · chỉ thay chuỗi, không hiểu AST (chuỗi `tim`
 * xuất hiện nhiều lần thì gieo chỗ đầu và cảnh báo) · worktree lấy HEAD — thay đổi chưa commit của cây chính KHÔNG có trong đó
 * (cảnh báo khi baseline bẩn) · chỉ symlink `node_modules`, dự án cần `.env`/venv/build artifact khác thì proof có thể đỏ sẵn
 * (→ `lỗi-chạy`, không phải bắt) · proof ghi ra ngoài worktree (DB thật, cache toàn cục, qua symlink node_modules) thì porcelain
 * không thấy · "hai lỗi cùng một bề mặt assert" chỉ đoán qua trùng file:line / trùng proof — là cảnh báo, không chặn.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const pos = argv.filter((a, i) => !a.startsWith('--') && !['--root', '--timeout'].includes(argv[i - 1]));
const JSON_MODE = argv.includes('--json');
const LINK = !argv.includes('--no-link');
const TIMEOUT = Math.max(1, +opt('--timeout', 180)) * 1000;
const MAX = 5;
const dùng = (m) => { console.error(`Dùng: mutate.js <loi.json> [--root <repo>] [--timeout <giây>] [--no-link] [--json]\n  ${m}`); process.exit(12); };

if (!pos[0]) dùng('thiếu file danh sách lỗi');
let ds;
try { ds = JSON.parse(fs.readFileSync(path.resolve(pos[0]), 'utf8')); } catch (e) { dùng(`không đọc được ${pos[0]}: ${e.message}`); }
if (!Array.isArray(ds) || !ds.length) dùng('danh sách lỗi phải là mảng JSON ≥ 1 phần tử');
if (ds.length > MAX) dùng(`${ds.length} lỗi > trần ${MAX} — một lỗi mỗi bề mặt assert, dừng khi mọi proof đã đỏ một lần (quota theo rủi ro tốn nhất đúng chỗ check dồn cục)`);
const lỗiGieo = ds.map((x, i) => ({
  id: `M${i + 1}`, file: x.file, tìm: x.tim != null ? x.tim : x['tìm'], thay: x.thay, proof: x.proof, nhắm: x.nham || x['nhắm'] || '',
}));
for (const l of lỗiGieo) {
  for (const k of ['file', 'tìm', 'thay', 'proof']) if (typeof l[k] !== 'string' || (k !== 'thay' && !l[k])) dùng(`${l.id}: thiếu "${k === 'tìm' ? 'tim' : k}" (chuỗi)`);
  if (l.tìm === l.thay) dùng(`${l.id}: tim = thay — không có đột biến`);
}

const git = (cwd, ...a) => spawnSync('git', ['-C', cwd, ...a], { encoding: 'utf8', maxBuffer: 1e8 });
const hạTầng = (m) => { console.error(`mutate.js: HẠ TẦNG — ${m}`); process.exit(10); };
const top = git(path.resolve(opt('--root', '.')), 'rev-parse', '--show-toplevel');
if (top.status !== 0) hạTầng(`không phải repo git: ${path.resolve(opt('--root', '.'))}`);
const GỐC = top.stdout.trim();
const head = git(GỐC, 'rev-parse', '--short', 'HEAD');
if (head.status !== 0) hạTầng('repo chưa có commit nào (HEAD không tồn tại)');
const porcelain = () => git(GỐC, 'status', '--porcelain').stdout;
const trước = porcelain();
const cảnhBáo = [];
if (trước.trim()) cảnhBáo.push(`cây chính có ${trước.trim().split('\n').length} thay đổi chưa commit — worktree lấy HEAD ${head.stdout.trim()}, không thấy chúng`);

// dòng + cảnh báo trùng — đọc từ HEAD (git show), không đọc cây thật
for (const l of lỗiGieo) {
  const s = git(GỐC, 'show', `HEAD:${l.file.replace(/^\.\//, '')}`);
  if (s.status !== 0) { l.gốcHỏng = `không có ${l.file} trong HEAD`; continue; }
  const i = s.stdout.indexOf(l.tìm);
  if (i < 0) { l.gốcHỏng = 'không thấy chuỗi tim'; continue; }
  l.dòng = s.stdout.slice(0, i).split('\n').length;
  const n = s.stdout.split(l.tìm).length - 1;
  if (n > 1) cảnhBáo.push(`${l.id}: chuỗi tim khớp ${n} chỗ trong ${l.file} — gieo chỗ đầu (dòng ${l.dòng}); muốn chỗ khác thì kéo dài tim`);
}
const theoChỗ = {};
for (const l of lỗiGieo) if (l.dòng) (theoChỗ[`${l.file}:${l.dòng}`] = theoChỗ[`${l.file}:${l.dòng}`] || []).push(l.id);
for (const [k, ids] of Object.entries(theoChỗ)) if (ids.length > 1) cảnhBáo.push(`${ids.join(' + ')} cùng ${k} — hai lỗi một chỗ thường là một thí nghiệm chạy hai lần; chọn bề mặt assert khác`);
const theoProof = {};
for (const l of lỗiGieo) (theoProof[l.proof] = theoProof[l.proof] || []).push(l.id);
for (const [p, ids] of Object.entries(theoProof)) if (ids.length > 1) cảnhBáo.push(`${ids.join(' + ')} cùng proof \`${p}\` — nếu cùng một assert bắt thì lỗi thứ hai không thêm thông tin`);

const TẠM = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ac-mutate-')));
const WT = path.join(TẠM, 'wt');
let đãDọn = false;
function dọn() {
  if (đãDọn) return; đãDọn = true;
  const r = git(GỐC, 'worktree', 'remove', '--force', WT);
  if (r.status !== 0) { try { fs.rmSync(WT, { recursive: true, force: true }); } catch { /* */ } git(GỐC, 'worktree', 'prune'); }
  try { fs.rmSync(TẠM, { recursive: true, force: true }); } catch { /* */ }
}
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { dọn(); process.exit(10); });

let hỏngHạTầng = null;
const chạy = (cmd) => {
  const t0 = Date.now();
  const r = spawnSync(cmd, { cwd: WT, shell: true, encoding: 'utf8', timeout: TIMEOUT, maxBuffer: 1e8, env: { ...process.env, CI: '1' } });
  const hếtGiờ = !!(r.error && r.error.code === 'ETIMEDOUT') || (r.signal && r.status === null);
  const đuôi = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').slice(-2).join(' ⏎ ').slice(0, 160);
  return { exit: r.status, hếtGiờ, ms: Date.now() - t0, đuôi, lỗiSpawn: r.error && !hếtGiờ ? r.error.message : null };
};
try {
  const add = git(GỐC, 'worktree', 'add', '--detach', WT, 'HEAD');
  if (add.status !== 0) { hỏngHạTầng = `git worktree add thất bại: ${(add.stderr || '').trim().slice(0, 200)}`; throw new Error(hỏngHạTầng); }
  if (LINK) {
    (function tìmNm(d, sâu, rel) {
      if (sâu > 3) return;
      let es = []; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
      for (const e of es) {
        if (!e.isDirectory() || e.name === '.git') continue;
        const r = path.join(rel, e.name);
        if (e.name === 'node_modules') {
          const đích = path.join(WT, r);
          if (fs.existsSync(path.dirname(đích)) && !fs.existsSync(đích)) { try { fs.symlinkSync(path.join(d, e.name), đích, 'dir'); } catch { /* */ } }
          continue;
        }
        if (/^\./.test(e.name)) continue;
        tìmNm(path.join(d, e.name), sâu + 1, r);
      }
    })(GỐC, 0, '');
  }
  // 4. proof khi chưa gieo
  const gốcProof = {};
  for (const p of Object.keys(theoProof)) gốcProof[p] = chạy(p);
  // 5. từng lỗi
  for (const l of lỗiGieo) {
    const g = gốcProof[l.proof];
    if (l.gốcHỏng) { l.kếtQuả = 'lỗi-chạy'; l.ghiChú = l.gốcHỏng; continue; }
    if (g.hếtGiờ || g.lỗiSpawn || g.exit !== 0) { l.kếtQuả = 'lỗi-chạy'; l.ghiChú = g.hếtGiờ ? `proof quá ${TIMEOUT / 1000}s khi CHƯA gieo` : `proof đỏ khi CHƯA gieo (exit ${g.exit}) — không đo được${g.đuôi ? ': ' + g.đuôi : ''}`; continue; }
    const f = path.join(WT, l.file);
    const nd = fs.readFileSync(f, 'utf8');
    const i = nd.indexOf(l.tìm);
    fs.writeFileSync(f, nd.slice(0, i) + l.thay + nd.slice(i + l.tìm.length));
    const r = chạy(l.proof);
    l.exit = r.exit; l.ms = r.ms;
    if (r.hếtGiờ) { l.kếtQuả = 'lỗi-chạy'; l.ghiChú = `timeout ${TIMEOUT / 1000}s`; }
    else if (r.lỗiSpawn) { l.kếtQuả = 'lỗi-chạy'; l.ghiChú = r.lỗiSpawn; }
    else if (r.exit !== 0) { l.kếtQuả = 'bắt'; l.ghiChú = r.đuôi; }
    else { l.kếtQuả = 'sống'; l.ghiChú = 'proof vẫn exit 0 khi code sai — assert không phân biệt được bản đúng với bản sai'; }
    const rs = git(WT, 'checkout', '--', '.');
    if (rs.status !== 0 || fs.readFileSync(f, 'utf8') !== nd) { hỏngHạTầng = `không khôi phục được worktree sau ${l.id}`; throw new Error(hỏngHạTầng); }
  }
} catch (e) {
  if (!hỏngHạTầng) hỏngHạTầng = e.message;
} finally {
  dọn();
}
const sau = porcelain();
const sạch = sau === trước;
const cònWt = fs.existsSync(WT) || git(GỐC, 'worktree', 'list', '--porcelain').stdout.includes(WT);

const mã = (s) => { const t = String(s).replace(/\n/g, '⏎').replace(/\|/g, '\\|'); const c = t.length > 60 ? t.slice(0, 57) + '…' : t; return c.includes('`') ? '`` ' + c + ' ``' : '`' + c + '`'; };
const đếm = (k) => lỗiGieo.filter((l) => l.kếtQuả === k).length;
const sống = đếm('sống');
const bảng = ['| # | file:line | đột biến | proof | kết quả |', '|---|---|---|---|---|']
  .concat(lỗiGieo.map((l) => `| ${l.id} | \`${l.dòng ? l.file + ':' + l.dòng : l.file}\` | ${mã(l.tìm)} → ${mã(l.thay)}${l.nhắm ? ` — nhắm ${l.nhắm}` : ''} | ${mã(l.proof)}${l.exit != null ? ` (exit ${l.exit})` : ''} | ${l.kếtQuả || 'lỗi-chạy'}${l.kếtQuả === 'lỗi-chạy' ? ` (${String(l.ghiChú || '').replace(/\|/g, '/').replace(/[<>]/g, '').slice(0, 80)})` : ''} |`))
  .join('\n');
const kq = {
  gốc: GỐC, head: head.stdout.trim(), lỗi: lỗiGieo.map(({ gốcHỏng, ...x }) => x), cảnhBáo,
  bắt: đếm('bắt'), sống, lỗiChạy: đếm('lỗi-chạy'), repoChínhSạch: sạch, worktreeĐãDọn: !cònWt, hạTầng: hỏngHạTầng, bảng,
};
if (JSON_MODE) console.log(JSON.stringify(kq, null, 2));
else {
  console.log(`mutate: ${lỗiGieo.length} lỗi gieo @ ${kq.head} — bắt ${kq.bắt} · sống ${sống} · lỗi-chạy ${kq.lỗiChạy}${sạch ? '' : ' · ⛔ REPO CHÍNH ĐỔI'}${hỏngHạTầng ? ' · ⛔ hạ tầng' : ''}\n`);
  console.log('## Lỗi gieo\n');
  console.log(bảng);
  for (const c of cảnhBáo) console.log(`\n⚠️  ${c}`);
  for (const l of lỗiGieo.filter((x) => x.kếtQuả === 'sống')) console.log(`\n❌ ${l.id} SỐNG — finding: ${l.file}:${l.dòng} — test không bắt được "${l.thay}"; thêm/siết assert${l.nhắm ? ` cho ${l.nhắm}` : ''}`);
  if (kq.lỗiChạy && !kq.bắt) console.log('\n⚠️  không lỗi nào áp dụng được — bảng này không chứng minh gì (validate-done sẽ chặn PASS)');
}
if (!sạch) { console.error(`mutate.js: REPO CHÍNH ĐỔI — porcelain trước/sau khác nhau. DỪNG, khôi phục tay, coi lần chạy vô hiệu.\n--- trước\n${trước}--- sau\n${sau}`); process.exit(11); }
if (hỏngHạTầng || cònWt) { console.error(`mutate.js: HẠ TẦNG — ${hỏngHạTầng || 'worktree tạm còn sót: ' + WT}`); process.exit(10); }
process.exit(sống);
