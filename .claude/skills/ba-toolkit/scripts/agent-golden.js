#!/usr/bin/env node
/*
 * ba-toolkit/agent-golden.js — golden file cho review agent: kiểm được "ĐỔI", dù không kiểm được "ĐÚNG".
 *
 * Sáu review agent là bề mặt ĐẮT NHẤT (ba-review all fan-out 8 lượt model) và MÙ NHẤT của toolkit:
 * lint check 20 chỉ kiểm chúng read-only, không gì kiểm chúng phát hiện đúng. Không có golden thì
 * một lần sửa prompt làm agent im đi một nửa phát hiện — và không ai biết, vì đầu ra vốn đã dài
 * và mỗi lần một khác.
 *
 * ─── Vì sao KHÔNG so byte-for-byte ────────────────────────────────────────────────────────
 * Đầu ra LLM không tất định: cùng prompt, cùng file, hai lần chạy khác câu chữ. So byte thì lần
 * nào cũng "trôi", tức không so gì cả. Nên chuẩn hoá về thứ ỔN ĐỊNH hơn câu chữ: TẬP MÃ ID bị
 * chấm + tập CHỦ ĐỀ + phân bố mức. Rồi đo Jaccard: trùng ≥ 0,6 là "cùng một agent", dưới đó là
 * trôi — cần người xem. Ngưỡng 0,6 là ước lượng ban đầu, chưa đo trên nhiều lần chạy; chỉnh khi
 * có số (xem gioiHan).
 *
 * Quy ước: mỗi agent khi chạy để ghi/kiểm golden phải KẾT THÚC bằng một khối ```json có
 * `findings:[{ids:[...], muc:"🔴|🟡|🟢", chu_de:"..."}]`. Script này KHÔNG chạy agent — nó không
 * có model. Người/skill chạy agent, dán đầu ra vào, script chuẩn hoá và so.
 *
 * ─── Mặt còn lại: BẪY CÀI SẴN (plant) ────────────────────────────────────────────────────
 * Golden trả lời "agent có ĐỔI không". Nó không trả lời "agent có CÒN TÌM RA không" — một prompt
 * sửa hỏng có thể vừa ổn định vừa mù. `plant` dựng bản sao tài liệu mẫu có lỗi CÓ ĐÁP ÁN gieo sẵn,
 * `score` đếm agent tìm lại được mấy cái. Đáp án nằm ở `<agent>.trap.json` — agent KHÔNG đọc file
 * đó (prompt chỉ trỏ vào thư mục fixture). Trượt > 1 bẫy ⇒ lượt review đó không đáng merge.
 *
 * ─── Bẫy cho agent chấm CODE (`kiểu: "repo"`, đợt 5 gói 3 — ac-verifier, ac-judge) ─────────
 * Nguồn là repo mini SẠCH (`fixtures/*.json`: path → dòng). `plant` gieo bẫy tìm/thay rồi dựng git tạm
 * hai commit (nền docs+runner · commit 2 = diff agent chấm). Dấu hiệu là CẤU TRÚC, không phải từ khoá:
 * `{vịTrí:[{file, neo}], loại, mã}` — finding phải trỏ đúng `file:dòng` gieo (±2, dòng tính lại từ cây
 * đã gieo) VÀ nói đúng loại lỗi VÀ (nếu khai) đúng mã TC; một finding chỉ ăn một bẫy. Bài học B22 (P3):
 * dấu hiệu lỏng làm `score` tự cho điểm. Harness-eval (agent-skills) dùng cùng cổng: miss ≤ ngưỡng.
 *
 * Dùng:  node agent-golden.js record <agent> <file-đầu-ra.md|json>   # ghi/ghi đè golden
 *        node agent-golden.js check  <agent> <file-đầu-ra.md|json>   # so với golden; exit 1 nếu trôi
 *        node agent-golden.js plant  <agent> [--out <thư mục>]       # dựng fixture có bẫy, in brief cho agent
 *        node agent-golden.js score  <agent> <file-đầu-ra.md|json>   # đếm bẫy tìm được; exit 1 nếu trượt > 1
 *        node agent-golden.js list
 * Kho:   ba-toolkit/references/agent-golden/<agent>.json · <agent>.trap.json
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const KHO = path.join(__dirname, '..', 'references', 'agent-golden');
const NGƯỠNG = 0.6;
// Bỏ cờ khi tách vị trí: `plant <agent> --out <dir>` từng làm `file` = "--out".
const vịTrí = process.argv.slice(2).filter((a, i, xs) => !a.startsWith('--') && !(i > 0 && xs[i - 1] === '--out'));
const [lệnh, agent, file] = vịTrí;

// Lấy khối JSON cuối cùng trong đầu ra (agent có thể in nhiều thứ trước đó).
function tríchJSON(text) {
  const t = text.trim();
  if (t.startsWith('{')) return JSON.parse(t);
  const khối = [...t.matchAll(/```json\s*([\s\S]*?)```/g)];
  if (!khối.length) throw new Error('không thấy khối ```json nào trong đầu ra');
  return JSON.parse(khối[khối.length - 1][1]);
}

// ─── Phép đo đầu tiên (14/09/2026) đã đổi cách chuẩn hoá ─────────────────────────────────
// Chạy lại ba-diagram-reviewer trên CÙNG file, CÙNG prompt, 3 ngày sau: agent tìm ra đúng 4 vấn đề
// thực chất y hệt golden — nhưng điểm 0,38, "TRÔI". Vì sao: `ids` của sơ đồ là NHÃN NODE tự do
// (`HT`, `TL` lần trước; `lane-TL`, `C`, `K`, `I` lần này) và `chu_de` là câu chữ tự do (cùng ý,
// khác từ). So chuỗi nguyên văn ở hai chỗ đó là so thứ vốn không ổn định. Nên:
//   · ids   → CHỈ giữ mã canon (FR-/StR-/BRule-/TC-…); nhãn node, tên sơ đồ, chữ cái đơn bỏ.
//   · chủ đề → so theo TOKEN (Jaccard trên tập từ), không so nguyên chuỗi.
// Sau khi đổi: cùng hai bản đó cho điểm mã 1,0. Ngưỡng 0,6 giữ; giờ nó đo thứ đáng đo.
const RE_CANON = /^(?:BR|StR|FR|NFR|BRule|TR|F|S|R|UC|US|TC|CL|CR|WI|ADR|SH|BO|GWT|OQ|UAT|EXT|DEC|ACT|PS|U|UN|USC|E|RB|PD|ACL|ATC|GĐ)-?[A-Za-z0-9-]*\d$/;
const tokenHoá = (s) => String(s).toLowerCase().split(/[^a-z0-9đ]+/).filter((w) => w.length > 2);
function chuẩnHoá(j) {
  const f = Array.isArray(j.findings) ? j.findings : [];
  const ids = new Set(); const chủĐề = []; const mức = { '🔴': 0, '🟡': 0, '🟢': 0 };
  for (const x of f) {
    for (const id of x.ids || []) { const s = String(id).trim(); if (RE_CANON.test(s)) ids.add(s); }
    if (x.chu_de) chủĐề.push(tokenHoá(x.chu_de));
    if (mức[x.muc] !== undefined) mức[x.muc]++;
  }
  // `findingsThô` chỉ để `score` dò dấu hiệu bẫy; KHÔNG ghi vào golden (record xoá trước khi ghi).
  return { agent: j.agent || agent, mode: j.mode || null, sốFinding: f.length,
           ids: [...ids].sort(), chủĐề, mức, findingsThô: f };
}

// Chủ đề: mỗi chủ đề của golden tìm chủ đề GẦN NHẤT ở lần chạy này (Jaccard token); trung bình.
function khớpChủĐề(gold, nay) {
  if (!gold.length && !nay.length) return 1;
  if (!gold.length || !nay.length) return 0;
  let tổng = 0;
  for (const g of gold) tổng += Math.max(...nay.map((n) => jaccard(g, n)));
  return tổng / gold.length;
}

const jaccard = (a, b) => {
  const A = new Set(a), B = new Set(b);
  if (!A.size && !B.size) return 1;
  let giao = 0; for (const x of A) if (B.has(x)) giao++;
  return giao / (A.size + B.size - giao);
};

function soSánh(gold, nay) {
  const jIds = jaccard(gold.ids, nay.ids);
  const jChủĐề = khớpChủĐề(gold.chủĐề, nay.chủĐề);
  // Điểm = CHỈ mã canon. Điểm dữ liệu thứ hai (srs-quality, cùng file cùng prompt): mã 0,82 nhưng
  // chủ đề 0,17 — agent gọi tên cùng một vấn đề bằng từ vựng khác hẳn giữa hai lần. Chủ đề tự do
  // không đủ ổn định để CHẤM; nó chỉ đủ để ĐỌC. Vẫn in ra, không tính vào điểm.
  const điểm = jIds;
  const mấtĐỏ = gold.mức['🔴'] > 0 && nay.mức['🔴'] === 0;   // mất hết 🔴 là dấu hiệu nguy hiểm nhất
  return { điểm: +điểm.toFixed(2), jIds: +jIds.toFixed(2), jChủĐề: +jChủĐề.toFixed(2), mấtĐỏ,
    trôi: điểm < NGƯỠNG || mấtĐỏ,
    thiếuIds: gold.ids.filter((x) => !nay.ids.includes(x)),
    thêmIds: nay.ids.filter((x) => !gold.ids.includes(x)),
    mứcGold: gold.mức, mứcNay: nay.mức };
}

if (lệnh === 'list') {
  fs.mkdirSync(KHO, { recursive: true });
  // `.trap.json` là hồ sơ BẪY, không phải golden — hình khác hẳn (không có mức/sốFinding).
  for (const f of fs.readdirSync(KHO).filter((x) => x.endsWith('.json') && !x.endsWith('.trap.json'))) {
    const g = JSON.parse(fs.readFileSync(path.join(KHO, f), 'utf8'));
    const cóBẫy = fs.existsSync(path.join(KHO, f.replace(/\.json$/, '.trap.json'))) ? ' · có hồ sơ bẫy' : '';
    console.log(`  ${g.agent.padEnd(28)} ${String(g.sốFinding).padStart(3)} finding · 🔴${g.mức['🔴']} 🟡${g.mức['🟡']} 🟢${g.mức['🟢']} · ${g.ids.length} mã · ghi ${g.ghiLúc}${cóBẫy}`);
  }
  process.exit(0);
}
// `plant` chỉ cần tên agent (nó DỰNG fixture, chưa có đầu ra để đọc); các lệnh còn lại cần file.
if (!lệnh || !agent || (!file && lệnh !== 'plant')) { console.error('Usage: agent-golden.js record|check|score <agent> <file> | plant <agent> [--out <dir>] | list'); process.exit(2); }

let j = { findings: [] };
if (file) { try { j = tríchJSON(fs.readFileSync(file, 'utf8')); } catch (e) { console.error('✖', e.message); process.exit(2); } }
const nay = chuẩnHoá(j);
const đích = path.join(KHO, agent + '.json');

if (lệnh === 'record') {
  fs.mkdirSync(KHO, { recursive: true });
  delete nay.findingsThô;   // golden là bản rút gọn: tập mã + chủ đề + phân bố mức
  nay.ghiLúc = new Date().toISOString().slice(0, 10);
  nay.gioiHan = ['golden = TẬP mã + chủ đề + phân bố mức của MỘT lần chạy; không phải "đáp án đúng", chỉ là "lần trước agent thấy gì"',
                 'ngưỡng 0,6 chấm trên MÃ CANON. Đo 14/09/2026 (3 agent, cùng file cùng prompt, 3 ngày sau golden): diagram mã 1,0 · srs 0,82 · chủ đề chỉ 0,17–0,68 dù tập vấn đề trùng → chủ đề không được tính điểm, chỉ in để đọc',
                 'golden đo TẬP vấn đề và SỐ theo mức; KHÔNG đo cái nào bị chấm nặng nhất — mức 🔴 đổi chỗ giữa hai lần chạy ở cả 2/3 agent, đó là dao động thật của agent'];
  fs.writeFileSync(đích, JSON.stringify(nay, null, 2) + '\n', 'utf8');
  console.log(`✅ golden ${agent}: ${nay.sốFinding} finding · ${nay.ids.length} mã · 🔴${nay.mức['🔴']} 🟡${nay.mức['🟡']} 🟢${nay.mức['🟢']} → ${path.relative(process.cwd(), đích)}`);
  process.exit(0);
}
if (lệnh === 'check') {
  if (!fs.existsSync(đích)) { console.error(`✖ chưa có golden cho ${agent} — chạy record trước`); process.exit(2); }
  const gold = JSON.parse(fs.readFileSync(đích, 'utf8'));
  if (gold.chủĐề.length && typeof gold.chủĐề[0] === 'string') gold.chủĐề = gold.chủĐề.map(tokenHoá);   // golden ghi trước 14/09
  gold.ids = gold.ids.filter((s) => RE_CANON.test(s));
  const kq = soSánh(gold, nay);
  console.log(`${kq.trôi ? '❌ TRÔI' : '✅ ổn định'} ${agent}: điểm ${kq.điểm} (mã ${kq.jIds} · chủ đề ${kq.jChủĐề}) · golden 🔴${kq.mứcGold['🔴']} 🟡${kq.mứcGold['🟡']} 🟢${kq.mứcGold['🟢']} → nay 🔴${kq.mứcNay['🔴']} 🟡${kq.mứcNay['🟡']} 🟢${kq.mứcNay['🟢']}`);
  if (kq.mấtĐỏ) console.log('   ⚠️  golden có 🔴 mà lần này KHÔNG có — agent im đi ở đúng chỗ đắt nhất');
  if (kq.thiếuIds.length) console.log(`   thiếu so với golden: ${kq.thiếuIds.slice(0, 10).join(', ')}${kq.thiếuIds.length > 10 ? '…' : ''}`);
  if (kq.thêmIds.length) console.log(`   mới so với golden:   ${kq.thêmIds.slice(0, 10).join(', ')}${kq.thêmIds.length > 10 ? '…' : ''}`);
  process.exit(kq.trôi ? 1 : 0);
}
const đườngBẫy = path.join(KHO, `${agent || ''}.trap.json`);
const đọcBẫy = () => {
  if (!fs.existsSync(đườngBẫy)) { console.error(`✖ chưa có hồ sơ bẫy cho ${agent} — soạn ${path.relative(process.cwd(), đườngBẫy)} trước`); process.exit(2); }
  return JSON.parse(fs.readFileSync(đườngBẫy, 'utf8'));
};
const GỐC_REPO = path.resolve(__dirname, '..', '..', '..', '..');

// ─── kiểu repo: dựng cây đã gieo TRONG BỘ NHỚ (plant ghi ra đĩa, score dùng để tính dòng) ─────────
const DUNG_SAI = 2;
const dsSửa = (m) => (m.sửa ? (Array.isArray(m.sửa) ? m.sửa : [m.sửa]) : []);
function dựngCây(bẫy) {
  const nguồn = path.resolve(GỐC_REPO, bẫy.nguồn);
  let fx; try { fx = JSON.parse(fs.readFileSync(nguồn, 'utf8')); } catch (e) { console.error(`✖ không đọc được fixture ${nguồn}: ${e.message}`); process.exit(2); }
  const cây = {};
  for (const [f, dòng] of Object.entries(fx.tệp || {})) cây[f] = (Array.isArray(dòng) ? dòng.join('\n') : String(dòng)) + '\n';
  const gieo = [];
  for (const mục of [...(bẫy.bẫy || []), ...(bẫy.mồi || [])]) {
    for (const sửa of dsSửa(mục)) {
      if (cây[sửa.file] === undefined) { console.error(`✖ ${mục.mã}: fixture không có file ${sửa.file}`); process.exit(2); }
      if (!cây[sửa.file].includes(sửa.tìm)) { console.error(`✖ ${mục.mã}: không thấy nguyên văn cần sửa trong ${sửa.file} — fixture đã đổi, cập nhật hồ sơ bẫy trước khi chấm`); process.exit(2); }
      cây[sửa.file] = cây[sửa.file].replace(sửa.tìm, sửa.thay);
    }
    if (dsSửa(mục).length) gieo.push(mục.mã);
  }
  // Neo phải tồn tại ĐÚNG MỘT lần trong cây đã gieo — neo mơ hồ là dòng đáp án mơ hồ.
  for (const mục of [...(bẫy.bẫy || []), ...(bẫy.mồi || [])]) {
    for (const v of ((mục.dấuHiệu || {}).vịTrí || [])) {
      if (cây[v.file] === undefined) { console.error(`✖ ${mục.mã}: vịTrí trỏ file không có trong fixture: ${v.file}`); process.exit(2); }
      if (!v.neo) continue;
      const i = cây[v.file].split('\n').findIndex((l) => l.includes(v.neo));
      const lần = cây[v.file].split('\n').filter((l) => l.includes(v.neo)).length;
      if (lần !== 1) { console.error(`✖ ${mục.mã}: neo "${v.neo}" xuất hiện ${lần} lần trong ${v.file} (cần đúng 1)`); process.exit(2); }
      v.dòng = i + 1;
    }
  }
  return { cây, gieo, commit1: fx.commit1 || [] };
}

if (lệnh === 'plant' && đọcBẫy().kiểu === 'repo') {
  const bẫy = đọcBẫy();
  const i = process.argv.indexOf('--out');
  const ra = path.resolve(i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : path.join(require('os').tmpdir(), `ba-plant-${agent}-${Date.now()}`));
  const { cây, gieo, commit1 } = dựngCây(bẫy);
  fs.rmSync(ra, { recursive: true, force: true });
  for (const [f, txt] of Object.entries(cây)) { const p = path.join(ra, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, txt, 'utf8'); }
  const { spawnSync } = require('child_process');
  const git = (...a) => spawnSync('git', ['-C', ra, ...a], { encoding: 'utf8' });
  const bước = [['init', '-q'], ['config', 'user.email', 'plant@ba-toolkit'], ['config', 'user.name', 'plant'], ['config', 'commit.gpgsign', 'false'],
    ['add', '--', ...commit1], ['commit', '-qm', 'chore: nen (docs S01 + runner)'], ['add', '-A'], ['commit', '-qm', `feat(${bẫy.màn || 'S01'}): dat hang`]];
  for (const b of bước) { const r = git(...b); if (r.status !== 0) { console.error(`✖ git ${b[0]} hỏng: ${(r.stderr || '').trim().slice(0, 160)}`); process.exit(2); } }
  console.log(`✅ repo có bẫy: ${ra}`);
  console.log(`   đã gieo ${gieo.length} mũi (${gieo.join(', ')}) — ĐÁP ÁN ở ${path.relative(process.cwd(), đườngBẫy)}, KHÔNG đưa cho agent.`);
  console.log(`   Brief cho agent: chạy \`${agent}\` cho màn ${bẫy.màn || 'S01'} (docs: ${ra}/docs, diff HEAD~1..HEAD, gốc code ${ra}); làm như thường lệ rồi KẾT THÚC bằng khối \`\`\`json`);
  console.log('   {"findings":[{"ids":["TC-…"],"muc":"🔴|🟠|🟡","chu_de":"…","vi_tri":["<file>:<dòng>"]}]} — mỗi vấn đề một finding, vi_tri bắt buộc.');
  console.log(`   Chấm: node ${path.relative(process.cwd(), __filename)} score ${agent} <đầu-ra.md>`);
  process.exit(0);
}

if (lệnh === 'score' && đọcBẫy().kiểu === 'repo') {
  const bẫy = đọcBẫy();
  dựngCây(bẫy);   // chỉ để kiểm bẫy còn gieo được + gắn `dòng` đáp án vào vịTrí; không ghi gì
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const vănBản = (f) => [...(f.ids || []), f.chu_de || '', f.chủĐề || '', ...[].concat(f.vi_tri || f.vịTrí || [])].join(' \n ');
  // Trỏ đúng vị trí: `<đường dẫn hoặc basename>:<dòng>` trong ±DUNG_SAI; neo cấp file thì chỉ cần tên file.
  const trỏĐúng = (txt, v) => {
    const tên = path.basename(v.file);
    const re = new RegExp(`(?:^|[\\s\`'"(/\\[])${esc(tên)}${v.dòng ? ':(\\d+)' : '(?![\\w.-])'}`, 'g');
    for (const m of txt.matchAll(re)) { if (!v.dòng || Math.abs(+m[1] - v.dòng) <= DUNG_SAI) return true; }
    return false;
  };
  const khớp = (f, mục) => {
    const d = mục.dấuHiệu || {}; const txt = vănBản(f);
    if (d.vịTrí && d.vịTrí.length && !d.vịTrí.some((v) => trỏĐúng(txt, v))) return false;
    if (d.loại && !new RegExp(d.loại, 'iu').test([...(f.ids || []), f.chu_de || '', f.chủĐề || ''].join(' '))) return false;
    if (d.mã && !txt.includes(d.mã)) return false;
    return !!(d.vịTrí || d.loại || d.mã);
  };
  const fs_ = nay.findingsThô || []; const đãDùng = new Set();
  const tìmThấy = [], trượt = [];
  for (const m of bẫy.bẫy || []) {
    const k = fs_.findIndex((f, i) => !đãDùng.has(i) && khớp(f, m));
    if (k >= 0) { đãDùng.add(k); tìmThấy.push(m); } else trượt.push(m);
  }
  const mồiBịFlag = (bẫy.mồi || []).filter((m) => fs_.some((f) => khớp(f, m)));
  const ngưỡng = Number.isInteger(bẫy.ngưỡngTrượt) ? bẫy.ngưỡngTrượt : 1;
  const hỏng = trượt.length > ngưỡng;
  const dòngĐáp = (m) => ((m.dấuHiệu || {}).vịTrí || []).map((v) => v.dòng ? `${v.file}:${v.dòng}` : v.file).join(' | ');
  console.log(`${hỏng ? '❌ BẪY TRƯỢT' : '✅ đạt'} ${agent}: tìm ${tìmThấy.length}/${(bẫy.bẫy || []).length} bẫy trên ${fs_.length} finding (ngưỡng trượt ${ngưỡng})`);
  for (const m of tìmThấy) console.log(`   ✓ ${m.mã} — ${m.môTả}`);
  for (const m of trượt) console.log(`   ✗ ${m.mã} — ${m.môTả} [đáp: ${dòngĐáp(m) || '—'}]`);
  for (const m of mồiBịFlag) console.log(`   ⚠️  mồi ${m.mã} bị chấm là vấn đề — ${m.môTả} (cảnh báo, không tính trượt)`);
  if (hỏng) console.log(`   → Lượt ${agent} này KHÔNG dùng được làm bằng chứng: bỏ sót ${trượt.length} lỗi có đáp án, nên verdict "sạch/PASS/APPROVE" của nó không đọc được.`);
  process.exit(hỏng ? 1 : 0);
}

if (lệnh === 'plant') {
  const bẫy = đọcBẫy();
  const i = process.argv.indexOf('--out');
  const ra = path.resolve(i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : path.join(require('os').tmpdir(), `ba-plant-${agent}-${Date.now()}`));
  const nguồn = path.resolve(GỐC_REPO, bẫy.nguồn || 'example/docs');
  if (!fs.existsSync(nguồn)) { console.error(`✖ không thấy nguồn ${nguồn}`); process.exit(2); }
  fs.rmSync(ra, { recursive: true, force: true });
  fs.cpSync(nguồn, ra, { recursive: true });
  // Gieo từng mũi: PHẢI khớp nguyên văn. Không khớp = tài liệu mẫu đã đổi ⇒ DỪNG, vì một bẫy
  // không gieo được mà vẫn chấm thì agent "trượt" một lỗi chưa bao giờ tồn tại.
  const gieo = [];
  for (const mục of [...(bẫy.bẫy || []), ...(bẫy.mồi || [])]) {
    const f = path.join(ra, mục.sửa.file);
    let txt = '';
    try { txt = fs.readFileSync(f, 'utf8'); } catch { console.error(`✖ ${mục.mã}: không đọc được ${mục.sửa.file}`); process.exit(2); }
    if (!txt.includes(mục.sửa.tìm)) { console.error(`✖ ${mục.mã}: không thấy nguyên văn cần sửa trong ${mục.sửa.file} — tài liệu mẫu đã đổi, cập nhật hồ sơ bẫy trước khi chấm`); process.exit(2); }
    fs.writeFileSync(f, txt.replace(mục.sửa.tìm, mục.sửa.thay), 'utf8');
    gieo.push(mục.mã);
  }
  console.log(`✅ fixture có bẫy: ${ra}`);
  console.log(`   đã gieo ${gieo.length} mũi (${gieo.join(', ')}) — ĐÁP ÁN ở ${path.relative(process.cwd(), đườngBẫy)}, KHÔNG đưa cho agent.`);
  console.log(`   Brief cho agent: chạy \`${agent}\` chế độ \`${bẫy.mode || 'project'}\` trên thư mục trên, kết thúc bằng khối \`\`\`json findings như thường lệ.`);
  console.log(`   Chấm: node ${path.relative(process.cwd(), __filename)} score ${agent} <đầu-ra.md>`);
  process.exit(0);
}

if (lệnh === 'score') {
  const bẫy = đọcBẫy();
  // Chuỗi để dò: mọi mã + chủ đề của mọi finding. Cố ý KHÔNG dò trên văn xuôi ngoài khối json —
  // agent nào cũng nhắc "NFR-01" đâu đó trong phần dẫn nhập; tính thế là tự cho điểm.
  const kho = (nay.findingsThô || []).map((f) => [...(f.ids || []), f.chu_de || '', f.chủĐề || ''].join(' ')).join('\n');
  const khớp = (mục) => new RegExp(mục.dấuHiệu, 'i').test(kho);
  const tìmThấy = (bẫy.bẫy || []).filter(khớp);
  const trượt = (bẫy.bẫy || []).filter((m) => !khớp(m));
  const mồiBịFlag = (bẫy.mồi || []).filter(khớp);
  console.log(`${trượt.length > 1 ? '❌ BẪY TRƯỢT' : '✅ đạt'} ${agent}: tìm ${tìmThấy.length}/${(bẫy.bẫy || []).length} bẫy trên ${(nay.findingsThô || []).length} finding`);
  for (const m of tìmThấy) console.log(`   ✓ ${m.mã} — ${m.môTả}`);
  for (const m of trượt) console.log(`   ✗ ${m.mã} — ${m.môTả}`);
  for (const m of mồiBịFlag) console.log(`   ⚠️  mồi ${m.mã} bị chấm là vấn đề — ${m.môTả} (cảnh báo, không tính trượt)`);
  if (trượt.length > 1) console.log(`   → Lượt review này KHÔNG merge vào 00-gaps.md: agent bỏ sót ${trượt.length} lỗi có đáp án, nên "không thấy gì" không đọc được thành "tài liệu sạch".`);
  process.exit(trượt.length > 1 ? 1 : 0);
}

console.error('lệnh không biết:', lệnh); process.exit(2);
