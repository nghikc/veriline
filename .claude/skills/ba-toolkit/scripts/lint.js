#!/usr/bin/env node
/*
 * ba-toolkit/lint.js — kiểm nhất quán bộ BA toolkit (zero-dependency).
 * Chạy từ repo gốc:  node .claude/skills/ba-toolkit/scripts/lint.js
 * Bắt drift khi toolkit lớn: skill mồ côi (chưa đăng ký), ref gãy, trùng số doc, lệch đếm.
 * Từ v2: đọc khối ```registry trong conventions.md (nguồn canon máy-đọc) rồi đối chiếu
 * NỘI DUNG toàn repo — tên doc chuẩn, phiên bản Mermaid, tiền tố ID.
 * Exit code = số lỗi (0 = sạch). WARNING không tính vào exit.
 * --strict: check bị bỏ qua · checker con exit≠0 không báo · check quét 0 đối tượng → LỖI (test.js/CI dùng).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SKILLS = path.join(ROOT, '.claude', 'skills');
const AGENTS = path.join(ROOT, '.claude', 'agents');
const EXPLAIN = path.join(ROOT, 'explain');
const INDEX = path.join(SKILLS, 'ba-toolkit', 'SKILL.md');
const CONV = path.join(SKILLS, 'ba-toolkit', 'references', 'conventions.md');
// Khối ```registry sống ở phụ lục riêng từ 17/08/2026 (không skill nào cần nạp 57 dòng canon
// máy-đọc). Vẫn đọc fallback từ conventions.md cho bản cài cũ chưa có file phụ lục.
const CONVREG = path.join(SKILLS, 'ba-toolkit', 'references', 'conv-registry.md');
// Repo công khai mang briefing ở `.claude/CLAUDE.md` (M5: CLAUDE.md ở gốc plugin làm `claude plugin validate --strict` cảnh báo).
const CLAUDEMD = [path.join(ROOT, 'CLAUDE.md'), path.join(ROOT, '.claude', 'CLAUDE.md')].find((f) => fs.existsSync(f)) || path.join(ROOT, 'CLAUDE.md');

let errors = 0, warns = 0;
// --strict (đợt 5 gói 3, 24/09/2026 — steal scan-skills.ts: lỗi HẠ TẦNG của scanner không được thành "sạch").
// Ba đường xanh giả mà chế độ thường để lọt, vì lint là thứ mọi gate khác tin:
//   1. check "bỏ qua" (thiếu khoá registry, thiếu câu neo) — xoá một khoá là tắt cả check mà vẫn exit 0;
//   2. subprocess (checker con) exit ≠ 0 mà không in dòng `❌` — crash/đổi định dạng bị đọc thành sạch;
//   3. check quét 0 đối tượng — `✓ 0 đường dẫn trong 0 file` là check không nhìn gì, không phải sạch.
// test.js và CI gọi --strict; chạy tay không cờ vẫn y như cũ (cảnh báo) để repo đang sửa dở còn đọc được.
const STRICT = process.argv.includes('--strict');
const fail = (m) => { console.log(`  ❌ ${m}`); errors++; };
const warn = (m) => {
  if (STRICT && /bỏ qua/.test(m)) return fail(`[strict] check bị bỏ qua — ${m}`);
  console.log(`  ⚠️  ${m}`); warns++;
};
const ok = (m) => {
  // Số ĐẦU câu ("0 agent khớp…") hoặc sau "trong"/"quét" ("… trong 0 file") = check chạy trên tập rỗng.
  // Không bắt số giữa câu: "3 luật (3 seed + 0 dự án)" là 0 hợp lệ của một thành phần phụ.
  if (STRICT && /(?:^|trong |quét )0 (?=\p{L})/u.test(m)) return fail(`[strict] check quét 0 đối tượng — "${m}"`);
  console.log(`  ✓ ${m}`);
};
// Checker con: exit ≠ 0 là lỗi dù output không có `❌` (ở chế độ thường giữ hành vi cũ).
const conHỏng = (tên, r, đãBáo) => {
  if (STRICT && r.status !== 0 && !đãBáo) fail(`[strict] ${tên} exit ${r.status === null ? 'null (' + (r.signal || r.error && r.error.code || '?') + ')' : r.status} mà không báo dòng lỗi nào: ${((r.stderr || r.stdout || '').trim().split('\n').pop() || '').slice(0, 160)}`);
};
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; } };
// Đếm SỐ MỤC lint in ra, đo lúc chạy chứ không đọc mã nguồn (steal B44): số mục ≠ mã số mục lớn
// nhất (mã có chữ 3b; 4/20/35/37/41/3c đã gộp đi 25/09/2026). Đếm
// bằng cách bọc console.log là ba dòng và không phải sửa 38 chỗ in tiêu đề.
let sốMục = 0;
{
  const log = console.log;
  console.log = (...a) => { if (/^\n?=== \d/.test(String(a[0] || ''))) sốMục++; return log(...a); };   // `=== KẾT QUẢ` không phải mục
}

// Registry đọc SỚM: từ 09/09/2026 check 4 (nay trong check-cites.js) cần `deprecated.skills` để không báo gãy tên skill đã
// gộp. Khối này vốn nằm cạnh check 7 (chỗ dùng đầu tiên trước đây) và để nguyên ở đó thì check 4
// đổ `Cannot access 'REG' before initialization` — một lỗi nạp module, không phải lỗi lint.
function parseRegistry(txt) {
  const m = txt.match(/```registry\n([\s\S]*?)```/);
  if (!m) return null;
  const reg = {};
  for (const line of m[1].split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    reg[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().split(/\s+/).filter(Boolean);
  }
  return reg;
}
const REG = parseRegistry(fs.existsSync(CONVREG) ? read(CONVREG) : read(CONV));
// GÓI PHÁT HÀNH (08/10/2026, docs/decisions/32): skill gói Pro (`skills.pro`) và giữ riêng (`skills.devonly`) KHÔNG có trong repo
// công khai. Check nào đọc danh sách skill/agent từ registry thì chỉ soát skill thuộc hai tập này KHI NÓ CÓ MẶT — vắng là hợp lệ,
// không phải registry trỏ hỏng. Skill NGOÀI hai tập vẫn phải tồn tại như cũ (xoá nhầm skill công khai vẫn đỏ).
const NGOÀI_GÓI = new Set([...((REG && REG['skills.pro']) || []), ...((REG && REG['skills.devonly']) || [])]);
const vắngHợpLệ = (s) => NGOÀI_GÓI.has(s) && !fs.existsSync(path.join(ROOT, '.claude', 'skills', s, 'SKILL.md'));

if (!fs.existsSync(SKILLS)) { console.error('Không thấy .claude/skills — chạy từ repo gốc toolkit.'); process.exit(2); }

const dirs = fs.readdirSync(SKILLS, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name);
const ba = dirs.filter(n => n.startsWith('ba-')).sort();
const dev = dirs.filter(n => n.startsWith('dev-')).sort();
// ac-* (agentcode, từ 15/09/2026): họ thứ ba — xây/quản đội agent viết code. Thuộc bộ dev theo tiền tố.
const ac = dirs.filter(n => n.startsWith('ac-')).sort();

console.log('\n=== 1. Đếm skill ===');
console.log(`  ba-*: ${ba.length} · dev-*: ${dev.length} · ac-*: ${ac.length} · tổng: ${ba.length + dev.length + ac.length}`);
const agents = fs.existsSync(AGENTS) ? fs.readdirSync(AGENTS).filter(f => f.endsWith('.md')) : [];
console.log(`  agents: ${agents.length} (${agents.join(', ') || 'none'})`);
// Con số CLAUDE.md tự khai: lint 40 soát (một nguồn cho mọi số tự khai — 25/09/2026).

console.log('\n=== 2. Mỗi ba-* có trong ba-toolkit index ===');
const idx = read(INDEX);
const missIdx = ba.filter(s => s !== 'ba-toolkit' && !idx.includes('`' + s + '`'));
missIdx.length ? missIdx.forEach(s => fail(`ba-toolkit index thiếu: ${s}`)) : ok('Mọi ba-* đều được đăng ký trong index');

console.log('\n=== 3. Mỗi ba-* có trong explain ===');
const explainTxt = fs.existsSync(EXPLAIN) ? fs.readdirSync(EXPLAIN).filter(f => f.endsWith('.md')).map(f => read(path.join(EXPLAIN, f))).join('\n') : '';
const missExp = ba.filter(s => !explainTxt.includes(s));
missExp.length ? missExp.forEach(s => warn(`explain chưa mô tả: ${s}`)) : ok('Mọi ba-* đều được explain mô tả');

// 3b (ERROR): completeness của mục lục README §2 "Mỗi skill làm gì — một dòng".
// Check 3 ở trên chỉ đòi skill xuất hiện Ở ĐÂU ĐÓ trong explain (dễ lọt: skill nhắc thoáng
// ở §3 tình huống nhưng thiếu dòng một-dòng). Đây đòi CÓ DÒNG trong §2 — bắt đúng loại gap
// "thêm skill mà quên bảng README" mà check 3 không thấy.
console.log('\n=== 3b. Mọi ba-* có dòng trong README §2 (mục lục một-dòng) ===');
const readmeMd = read(path.join(EXPLAIN, 'README.md'));
const i2 = readmeMd.indexOf('## 2.');
const i3 = readmeMd.indexOf('## 3.', i2 + 1);
if (i2 < 0) warn('README.md không thấy "## 2." — bỏ qua check completeness');
else {
  const sec2 = readmeMd.slice(i2, i3 > i2 ? i3 : undefined);
  const missReadme = ba.filter(s => !sec2.includes('`' + s + '`'));
  missReadme.length
    ? missReadme.forEach(s => fail(`README §2 thiếu dòng một-dòng cho: ${s}`))
    : ok('Mọi ba-* đều có dòng trong README §2');
}

console.log('\n=== 5. Trùng số doc 01–11 (mỗi số 1 deliverable) ===');
const tree = read(CONV);
const nums = {};
for (const m of tree.matchAll(/\b(0[1-9]|1[01])-([a-z][a-z0-9-]*)\.md/g)) {
  (nums[m[1]] = nums[m[1]] || new Set()).add(m[2]);
}
let clash = 0;
for (const [n, set] of Object.entries(nums)) if (set.size > 1) { fail(`Số ${n} dùng cho ${set.size} doc: ${[...set].join(', ')}`); clash++; }
if (!clash) ok('Không có số doc 01–11 nào bị trùng');

console.log('\n=== 6. Skill có template khi cần (sinh doc → nên có template) ===');
// heuristic nhẹ: skill nhắc "template" nhưng thư mục KHÔNG có file *template*.md nào.
// Bỏ qua khi template NẰM Ở CHỖ KHÁC (không cần file riêng trong folder này):
//   - của skill khác ("`ba-x` … template", hoặc "template của … skill")
//   - trong conventions.md (template trung tâm, vd sổ CR)
//   - trong một companion .md khác CÓ THẬT trong folder (vd recipes.md của ba-diagram)
// Companion phải TỒN TẠI mới bỏ qua → skill khai "sinh theo `template.md`" mà file thiếu vẫn bị bắt.
for (const s of ba) {
  const dir = path.join(SKILLS, s);
  const txt = read(path.join(dir, 'SKILL.md'));
  if (!/\btemplate\b/i.test(txt)) continue;
  // Từ 04/09/2026 file đồng hành nằm trong scripts/ · references/ · assets/, nên quét ĐỆ QUY.
  // Chỉ đọc thư mục gốc thì mọi skill đều bị báo "thiếu template" — 33 cảnh báo giả một lượt,
  // và cảnh báo giả hàng loạt là cách nhanh nhất để người ta ngừng đọc cảnh báo.
  const gom = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory()
    ? (e.name === 'node_modules' ? [] : gom(path.join(d, e.name)))
    : [e.name]));
  const folderFiles = gom(dir);
  if (folderFiles.some(f => /template.*\.md$/i.test(f))) continue; // có file *template*.md → ok
  const esc = (fn) => fn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const templateElsewhere =
    /`ba-[a-z0-9-]+`[^.\n]*template/i.test(txt)                                   // template của skill khác (tên skill trước)
    || /template[^.\n]*của[^.\n]*skill/i.test(txt)                                 // "template của … skill" (vd ba-reverse)
    || /(template[^.\n]*conventions|conventions[^.\n]*template)/i.test(txt)        // template trong conventions.md (vd ba-change-request)
    || [...txt.matchAll(/`([a-z0-9-]+\.md)`/gi)].map(m => m[1]).some(fn =>          // template trong companion .md CÓ THẬT (vd recipes.md)
         fn.toLowerCase() !== 'skill.md' && folderFiles.includes(fn)
         && new RegExp(`template[^.\\n]*\`${esc(fn)}\`|\`${esc(fn)}\`[^.\\n]*template`, 'i').test(txt));
  if (!templateElsewhere) warn(`${s}: SKILL nhắc "template" nhưng thư mục không có file *template*.md`);
}
ok('Đã soát template');

/* ---------- Kiểm drift NỘI DUNG theo registry (conventions.md là nguồn canon duy nhất) ---------- */

console.log('\n=== 7. Registry máy-đọc trong conventions.md ===');
const REG_KEYS = ['mermaid.versions', 'id.prefixes', 'doc.01', 'doc.00', 'screen.files'];
if (!REG) fail('conventions.md thiếu khối ```registry — các check drift nội dung bị bỏ qua');
else {
  const missKeys = REG_KEYS.filter(k => !REG[k]);
  missKeys.length ? missKeys.forEach(k => fail(`registry thiếu khóa: ${k}`)) : ok(`Registry hợp lệ (${Object.keys(REG).length} khóa)`);
}

// Bề mặt quét: mọi .md trong skills/agents/explain/example + CLAUDE.md + README.md
function mdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...mdFiles(p));
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}
const SCAN = REG ? [
  ...mdFiles(SKILLS), ...mdFiles(AGENTS), ...mdFiles(EXPLAIN),
  ...mdFiles(path.join(ROOT, 'example')),
  CLAUDEMD, path.join(ROOT, 'README.md'),
].filter(p => fs.existsSync(p)) : [];
const rel = (p) => path.relative(ROOT, p);

if (REG) {
  console.log(`\n=== 8. Tên doc NN-*.md khớp canon (quét ${SCAN.length} file) ===`);
  const doc00 = new Set(REG['doc.00'] || []);
  // Miễn trừ: file .md CÓ THẬT thuộc hệ đánh số khác (guide explain, docs nội bộ toolkit)
  const EXEMPT = new Set([...mdFiles(EXPLAIN), ...mdFiles(path.join(ROOT, 'docs'))].map(p => path.basename(p)));
  let docDrift = 0;
  for (const f of SCAN) {
    const lines = read(f).split('\n');
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/(?<!\d-)\b(\d{2})-([a-z][a-z0-9-]*)\.md/g)) { // \d{2}: bắt cả số MỚI chưa khai (12-*); lookbehind: bỏ qua tiền tố ngày 2026-06-10-*
        const [, num, name] = m;
        if (EXEMPT.has(`${num}-${name}.md`)) continue;
        // `research/NN-*.md` KHÔNG phải tài liệu dự án — đó là ghi chú nghiên cứu, đánh số
        // theo thứ tự đọc chứ không theo canon `doc.NN`. Không loại trừ thì mỗi bản nghiên
        // cứu mới lại thành một lỗi lint giả, và người ta sẽ học cách đổi tên file để lint im.
        if (/research\/$/.test(line.slice(Math.max(0, m.index - 12), m.index))) continue;
        // `docs/decisions/NN-*.md` = sổ quyết định của repo phát triển (devOnly, 08/10/2026) — hệ đánh số riêng; repo công khai
        // không có docs/ nên EXEMPT (dựng từ file có thật) không miễn được, mà trích vẫn là tên file nội bộ chứ không phải doc dự án.
        if (/decisions\/$/.test(line.slice(Math.max(0, m.index - 12), m.index))) continue;
        if (num === '00') {
          if (!doc00.has(name)) { fail(`${rel(f)}:${i + 1} — 00-${name}.md không có trong canon doc.00 (${[...doc00].join(', ')})`); docDrift++; }
        } else {
          const canon = (REG['doc.' + num] || [])[0];
          if (!canon) { fail(`${rel(f)}:${i + 1} — số doc ${num} chưa khai trong registry (${num}-${name}.md)`); docDrift++; }
          else if (name !== canon) { fail(`${rel(f)}:${i + 1} — ${num}-${name}.md lệch canon: phải là ${num}-${canon}.md`); docDrift++; }
        }
      }
    });
  }
  if (!docDrift) ok('Mọi tham chiếu NN-*.md đều khớp canon');

  console.log('\n=== 9. Phiên bản Mermaid thống nhất ===');
  const okVers = new Set(REG['mermaid.versions'] || []);
  let verDrift = 0;
  for (const f of SCAN) {
    const lines = read(f).split('\n');
    lines.forEach((line, i) => {
      if (!/mermaid/i.test(line)) return;
      // Con số kèm ĐƠN VỊ không phải phiên bản: "11.7 KB" trong một câu có chữ mermaid từng bị
      // chấm là "Mermaid 11.7 lệch canon". Dương tính giả kiểu này dạy người ta né chữ thay vì
      // sửa thật — và câu bị né lại đúng là câu đang giải thích vì sao bản biên dịch nhẹ hơn.
      for (const m of line.matchAll(/\b(1[01]\.\d+(?:\.\d+)?)\b(\s*(?:[KMG]?B|ms|s|%|×|lần)\b)?/g)) {
        if (m[2]) continue;
        if (!okVers.has(m[1])) { fail(`${rel(f)}:${i + 1} — phiên bản Mermaid "${m[1]}" lệch canon (${[...okVers].join(', ')})`); verDrift++; }
      }
    });
  }
  if (!verDrift) ok(`Mọi mention phiên bản Mermaid đều trong canon (${[...okVers].join(', ')})`);

  console.log('\n=== 10. Tiền tố ID trong canon (cảnh báo) ===');
  const prefixes = new Set(REG['id.prefixes'] || []);
  const ID_IGNORE = new Set(['SHA', 'RS', 'AES', 'UTF', 'ISO', 'RFC', 'CVE', 'P', 'T', 'V']);
  const seenBad = new Set();
  for (const f of SCAN) {
    const lines = read(f).split('\n');
    lines.forEach((line, i) => {
      // BRule dạng CŨ "BR-<Tên>-NN" (BR-Login-01, BR-Register-03) — canon là BRule-S<NN>-NN
      if (/\bBR-[A-Z][a-z]+-\d/.test(line)) {
        const key = `BR-legacy|${rel(f)}`;
        if (!seenBad.has(key)) { seenBad.add(key); warn(`${rel(f)}:${i + 1} — BRule dạng cũ "BR-<Tên>-NN" (canon: BRule-S<NN>-NN, xem conventions)`); }
      }
      for (const m of line.matchAll(/(?:^|[^\w-])([A-ZĐ][A-Za-zĐđ]{0,7})-\d{1,3}\b/g)) {
        const pre = m[1];
        if (prefixes.has(pre) || ID_IGNORE.has(pre)) continue;
        const key = `${pre}|${rel(f)}`;
        if (seenBad.has(key)) continue; // 1 cảnh báo / tiền tố / file
        seenBad.add(key);
        warn(`${rel(f)}:${i + 1} — tiền tố ID lạ "${pre}-" (không có trong registry id.prefixes)`);
      }
    });
  }
  if (!seenBad.size) ok('Không có tiền tố ID ngoài canon');

  // 11 — Cổng phương án: skill nằm trong registry `gate.plan.skills` PHẢI nhắc cổng trong SKILL.md.
  // Đây là cổng TIỀN kiểm (trình phương án → chờ duyệt → mới ghi file); rất dễ bị quên khi thêm
  // orchestrator mới, mà quên thì skill lặng lẽ ghi cả loạt file không ai duyệt.
  console.log('\n=== 11. Cổng phương án ở orchestrator/skill ghi nhiều file ===');
  const gateSkills = REG['gate.plan.skills'] || [];
  if (!gateSkills.length) warn('registry thiếu khóa gate.plan.skills — bỏ qua check cổng phương án');
  else {
    let gateMiss = 0;
    for (const s of gateSkills) {
      const f = path.join(SKILLS, s, 'SKILL.md');
      if (!fs.existsSync(f) && vắngHợpLệ(s)) continue;
      if (!fs.existsSync(f)) { fail(`gate.plan.skills trỏ tới skill không tồn tại: ${s}`); gateMiss++; continue; }
      if (!read(f).includes('Cổng phương án')) {
        fail(`${s}/SKILL.md thiếu "Cổng phương án" (bắt buộc theo conventions.md → mục cùng tên)`);
        gateMiss++;
      }
    }
    if (!gateMiss) ok(`${gateSkills.length} skill đều có cổng phương án`);
  }
  // 11b (cùng mục, không thêm số) — Báo giá: skill nặng trong `gate.cost.skills` PHẢI dạy chạy `cost.js estimate`
  // trước khi bắt tay. Vì sao: 05–06/10/2026 một màn html ~200k token/10 phút, Figma ~270k/16 phút — người dùng
  // không biết trước, bấm "Chạy" như ký séc khống. Câu chữ là thứ duy nhất khiến skill in báo giá, nên khoá câu chữ.
  const costSkills = REG['gate.cost.skills'] || [];
  if (!costSkills.length) warn('registry thiếu khóa gate.cost.skills — bỏ qua check báo giá');
  else {
    let costMiss = 0;
    for (const s of costSkills) {
      const f = path.join(SKILLS, s, 'SKILL.md');
      if (!fs.existsSync(f) && vắngHợpLệ(s)) continue;
      if (!fs.existsSync(f)) { fail(`gate.cost.skills trỏ tới skill không tồn tại: ${s}`); costMiss++; continue; }
      if (!read(f).includes('cost.js estimate')) { fail(`${s}/SKILL.md thiếu dòng báo giá \`cost.js estimate\` (canon gate.cost.skills — conv-gates.md → "Cổng phương án" → Báo giá)`); costMiss++; }
    }
    if (!costMiss) ok(`${costSkills.length} skill nặng đều in báo giá (cost.js estimate)`);
  }

  // 12 — Cây thư mục trong conventions.md khớp khóa `hoso.docs`.
  // Bắt đúng loại drift đã từng xảy ra: mục "docs/Ho-so/" nói file đã chuyển, nhưng CÂY ở đầu file
  // vẫn vẽ layout phẳng cũ. Cây đứng trước nên skill đọc nó trước → ghi vào chỗ cũ, và vì docpath
  // phân giải được cả hai chỗ nên sai này KHÔNG BAO GIỜ tự báo lỗi lúc chạy.
  console.log('\n=== 12. Cây thư mục conventions.md khớp hoso.docs ===');
  const hoso = REG['hoso.docs'] || [];
  const convTxt = read(CONV);
  const treeM = convTxt.match(/```\ndocs\/\n([\s\S]*?)```/);
  if (!hoso.length) warn('registry thiếu khóa hoso.docs — bỏ qua check cây thư mục');
  else if (!treeM) fail('conventions.md không thấy khối cây bắt đầu bằng "docs/" — check vị trí file bị bỏ qua');
  else {
    // Con trực tiếp của docs/ = dòng bắt đầu bằng ├── hoặc └── (không thụt vào)
    const rootKids = treeM[1].split('\n')
      .filter(l => /^[├└]── /.test(l))
      .map(l => l.replace(/^[├└]── /, '').split(/[\s#]/)[0].replace(/\/$/, ''));
    let treeDrift = 0;
    for (const d of hoso) {
      const base = d.replace(/\/$/, '');
      if (rootKids.includes(base)) {
        fail(`conventions.md: "${base}" vẽ ở GỐC docs/ nhưng registry hoso.docs xếp nó vào Ho-so/`);
        treeDrift++;
      }
    }
    // và chiều ngược: cây có Ho-so/ thì mọi mục con của nó nên nằm trong hoso.docs
    const hosoBlock = treeM[1].split('\n');
    const hosoStart = hosoBlock.findIndex(l => /^[├└]── Ho-so\//.test(l));
    if (hosoStart < 0) { fail('conventions.md: cây thư mục thiếu nhánh "Ho-so/"'); treeDrift++; }
    else {
      for (const l of hosoBlock.slice(hosoStart + 1)) {
        if (!/^ {4}[├└]── /.test(l)) continue;
        const name = l.replace(/^ {4}[├└]── /, '').split(/[\s#]/)[0].replace(/\/$/, '');
        if (!name || name.includes('<')) continue;               // mẫu kiểu meetings/<ngày>-… đã tính ở tên thư mục
        const base = name.split('/')[0];
        if (!hoso.some(d => d.replace(/\/$/, '') === base)) {
          fail(`conventions.md: cây vẽ "Ho-so/${base}" nhưng registry hoso.docs chưa khai`);
          treeDrift++;
        }
      }
    }
    if (!treeDrift) ok(`Cây thư mục khớp hoso.docs (${hoso.length} mục)`);
  }

  // 13 — Skill đã ngừng dùng không được là LỐI ĐI CỤT.
  // Ca thật: ba-figma-design bị khai tử, mặc định chuyển sang ba-figma-draw, nhưng 6 skill khác
  // vẫn route thẳng vào cái cũ. Check 4 không bắt vì tên skill cũ vẫn tồn tại (chưa xoá thư mục).
  console.log('\n=== 13. Skill ngừng dùng luôn kèm skill thay thế ===');
  const depPairs = (REG['deprecated.skills'] || []).map(p => p.split(':'));
  if (!depPairs.length) warn('registry thiếu khóa deprecated.skills — bỏ qua');
  else {
    let depDrift = 0;
    for (const [oldS, newS] of depPairs) {
      if (!newS) { fail(`deprecated.skills sai định dạng (cần "cũ:mới"): ${oldS}`); depDrift++; continue; }
      for (const s of ba.concat(dev, ac)) {
        if (s === oldS || s === newS) continue;                  // hai skill đó tự nói về nhau, bỏ qua
        const txt = read(path.join(SKILLS, s, 'SKILL.md'));
        // Vị trí TÊN skill trọn token, không phải chuỗi con: `ba-userguide` là tiền tố của skill SỐNG `ba-userguide-video`
        // (nhóm 6 M6 đợt 3) — đếm chuỗi con thì chính tên skill kia bị coi là "nhắc skill đã khai tử".
        const chỗ = (n) => { const m = new RegExp(`(^|[^\\w-])${n.replace(/[-]/g, '\\-')}(?![\\w-])`).exec(txt); return m ? m.index + m[1].length : -1; };
        const iCũ = chỗ(oldS), iMới = chỗ(newS);
        if (iCũ < 0) continue;
        if (iMới < 0) {
          fail(`${s}/SKILL.md chỉ nhắc "${oldS}" (đã ngừng dùng) mà không nhắc "${newS}" — người đọc đi vào lối cụt`);
          depDrift++;
        } else if (iMới > iCũ) {
          // Nêu đủ hai skill vẫn chưa đủ: skill đã khai tử mà đứng TRƯỚC thì nó là lựa chọn
          // mặc định trong mắt người đọc (và của agent đọc lướt). ba-init/ba-add-screen từng
          // liệt kê đúng kiểu đó sau khi ba-figma-design bị khai tử, mà check cũ vẫn cho qua.
          fail(`${s}/SKILL.md nhắc "${oldS}" (đã ngừng dùng) TRƯỚC "${newS}" — skill khai tử đang được trình bày như lựa chọn đầu`);
          depDrift++;
        }
      }
    }
    if (!depDrift) ok('Mọi tham chiếu tới skill ngừng dùng đều kèm skill thay thế');
  }

  // 14 — Skill CON của orchestrator phải nêu rõ lập trường về cổng lồng nhau.
  // Im lặng = mỗi lần chạy ba-init/ba-accept người dùng bị hỏi duyệt 2 lần cho cùng một việc,
  // và người bị hỏi nhiều lần sẽ bấm "Chạy" theo phản xạ → cổng mất tác dụng ở CẢ HAI tầng.
  // Chấp nhận cả hai lập trường, miễn là VIẾT RA (cụm "đã qua cổng"): miễn trừ, hoặc cố ý giữ cổng.
  console.log('\n=== 14. Skill con nêu rõ lập trường cổng lồng nhau ===');
  const subSkills = REG['gate.plan.subskills'] || [];
  if (!subSkills.length) warn('registry thiếu khóa gate.plan.subskills — bỏ qua');
  else {
    let subMiss = 0;
    for (const s of subSkills) {
      const f = path.join(SKILLS, s, 'SKILL.md');
      if (!fs.existsSync(f) && vắngHợpLệ(s)) continue;
      if (!fs.existsSync(f)) { fail(`gate.plan.subskills trỏ tới skill không tồn tại: ${s}`); subMiss++; continue; }
      if (!read(f).includes('đã qua cổng')) {
        fail(`${s}/SKILL.md không nói gì về việc được orchestrator "đã qua cổng" gọi xuống (miễn trừ hay cố ý giữ cổng — phải chọn một)`);
        subMiss++;
      }
    }
    if (!subMiss) ok(`${subSkills.length} skill con đều nêu rõ lập trường cổng lồng nhau`);
  }

  // 17 — Hồ sơ dự án: registry ↔ profile.js ↔ skill phải khớp.
  // Ba chỗ dễ lệch: khóa profile.lite.off (canon) · object off() của profile.js (script đọc) ·
  // các skill khai là profile-aware (người đọc). Lệch bất kỳ chỗ nào thì `lite` tắt nhầm thứ
  // hoặc tắt lặng lẽ thứ không ai biết — đúng loại lỗi hồ sơ dự án sinh ra để tránh.
  console.log('\n=== 17. Hồ sơ dự án (full/lite) nhất quán ===');
  const profOff = REG['profile.lite.off'] || [];
  const profAware = REG['profile.aware'] || [];
  const profFile = path.join(SKILLS, 'ba-toolkit', 'scripts', 'profile.js');
  if (!profOff.length) warn('registry thiếu khóa profile.lite.off — bỏ qua');
  else if (!fs.existsSync(profFile)) fail('registry khai profile.lite.off nhưng thiếu ba-toolkit/profile.js');
  else {
    let profDrift = 0;
    const offBody = (read(profFile).match(/function off\(docsDir\)[\s\S]*?\n}/) || [''])[0];
    for (const k of profOff) {
      if (!new RegExp(`\\b${k}\\s*:`).test(offBody)) { fail(`profile.js off() thiếu khóa "${k}" mà registry profile.lite.off có`); profDrift++; }
    }
    for (const m of offBody.matchAll(/^\s{4}([a-z]+):\s*lite,/gm)) {
      if (!profOff.includes(m[1])) { fail(`profile.js off() có khóa "${m[1]}" chưa khai trong registry profile.lite.off`); profDrift++; }
    }
    for (const sk of profAware) {
      const f = path.join(SKILLS, sk, 'SKILL.md');
      if (!fs.existsSync(f) && vắngHợpLệ(sk)) continue;
      if (!fs.existsSync(f)) { fail(`profile.aware trỏ tới skill không tồn tại: ${sk}`); profDrift++; continue; }
      if (!/[Hh]ồ sơ (dự án|`?lite`?|`?mini`?)/.test(read(f))) { fail(`${sk}/SKILL.md khai là profile-aware nhưng không nói gì về hồ sơ dự án`); profDrift++; }
    }
    // `mini` cắt BỘ ARTIFACT (5 file/màn) chứ không chỉ lớp quản trị, nên nó có hai canon nữa phải
    // khớp profile.js: danh sách cơ chế tắt (off() ... : mini) và BỘ FILE (FILES_MINI). Lệch bộ file
    // là kiểu lỗi tệ nhất của cơ chế này: refresh.js dựng thiếu/thừa cột, rồi mọi màn thành "Đang làm".
    const miniOff = REG['profile.mini.off'] || [], miniFiles = REG['profile.mini.files'] || [];
    if (!REG['profile.values'] || !REG['profile.values'].includes('mini')) {
      if (miniOff.length || miniFiles.length) { fail('registry khai profile.mini.* nhưng profile.values không có "mini"'); profDrift++; }
    } else if (!miniOff.length || !miniFiles.length) {
      fail('profile.values có "mini" nhưng thiếu khóa profile.mini.off / profile.mini.files'); profDrift++;
    } else {
      const body = read(profFile);
      const offBodyM = (body.match(/function off\(docsDir\)[\s\S]*?\n}/) || [''])[0];
      for (const k of miniOff)
        if (!new RegExp(`\\b${k}\\s*:\\s*mini\\b`).test(offBodyM)) { fail(`profile.js off() thiếu "${k}: mini" mà registry profile.mini.off có`); profDrift++; }
      for (const m of offBodyM.matchAll(/^\s{4}([a-z]+):\s*mini,/gm))
        if (!miniOff.includes(m[1])) { fail(`profile.js off() có "${m[1]}: mini" chưa khai trong registry profile.mini.off`); profDrift++; }
      const declared = (body.match(/const FILES_MINI = \[([^\]]*)\]/) || [, ''])[1].match(/'([^']+)'/g) || [];
      const got = declared.map(s => s.slice(1, -1));
      if (got.join(' ') !== miniFiles.join(' ')) {
        fail(`FILES_MINI của profile.js (${got.join(' ')}) lệch registry profile.mini.files (${miniFiles.join(' ')}) — refresh.js sẽ dựng sai cột tracking`);
        profDrift++;
      }
    }
    if (!profDrift) ok(`Hồ sơ dự án nhất quán (${profOff.length} cơ chế lite · ${miniOff.length} thêm ở mini · bộ mini ${miniFiles.length} file · ${profAware.length} skill)`);
  }

  // 16 — Mốc của gap 🟠 phải thật sự THU NỢ.
  // Mức 🟠 ("Nợ có hạn") cố ý KHÔNG chặn gate đang chạy — nó dời hạn tới một mốc sau. Nếu mốc đó
  // không có cổng thu nợ thì 🟠 chỉ là cách hợp thức hoá việc lờ gap đi. Check này giữ hai nửa
  // của thiết kế dính vào nhau.
  console.log('\n=== 16. Mốc của gap 🟠 có cổng thu nợ ===');
  const debtSkills = REG['gate.debt.skills'] || [];
  if (!debtSkills.length) warn('registry thiếu khóa gate.debt.skills — bỏ qua');
  else {
    let debtMiss = 0;
    for (const s of debtSkills) {
      const f = path.join(SKILLS, s, 'SKILL.md');
      if (!fs.existsSync(f) && vắngHợpLệ(s)) continue;
      if (!fs.existsSync(f)) { fail(`gate.debt.skills trỏ tới skill không tồn tại: ${s}`); debtMiss++; continue; }
      if (!read(f).includes('thu nợ 🟠')) {
        fail(`${s}/SKILL.md là mốc của gap 🟠 nhưng thiếu cổng "thu nợ 🟠" — nợ tới hạn sẽ không ai thu`);
        debtMiss++;
      }
    }
    if (!debtMiss) ok(`${debtSkills.length} mốc đều có cổng thu nợ 🟠`);
  }

  // 15 — Phụ lục tách khỏi conventions.md phải tồn tại và được conventions trỏ tới.
  console.log('\n=== 15. Phụ lục của conventions.md ===');
  const appendix = REG['conv.appendix'] || [];
  if (!appendix.length) warn('registry thiếu khóa conv.appendix — bỏ qua');
  else {
    let appMiss = 0;
    for (const a of appendix) {
      if (!fs.existsSync(path.join(SKILLS, 'ba-toolkit', 'references', a))) { fail(`conv.appendix khai "${a}" nhưng file không tồn tại`); appMiss++; }
      else if (!convTxt.includes(a)) { fail(`conventions.md không trỏ tới phụ lục "${a}" — người đọc không tìm ra`); appMiss++; }
    }
    if (!appMiss) ok(`${appendix.length} phụ lục đều tồn tại và được conventions.md trỏ tới`);
  }

  // 18 — Phân loại 🟠 phải giống nhau ở MỌI nơi; ba-review giữ canon, chỗ khác chỉ được nhắc lại.
  // Vì sao cần: 52/55 skill được bảo "đọc conventions.md", nên một dòng conventions chấm 🟡 cho
  // chủ đề mà ba-review chấm 🟠 sẽ làm gate DỪNG vì thứ đáng lẽ chỉ là nợ tới hạn — đúng cái bệnh
  // mức 🟠 sinh ra để chữa. Đó là chuyện thật: tới 17/08/2026 conventions.md vẫn chấm 🟡 cho ADR
  // Draft, giả định chưa xác nhận và thiếu Animation, ba-accept uat/ba-screen-spec template cũng vậy.
  // Không check nào cũ bắt được — 16 chỉ soát "mốc có cổng thu nợ", 8 soát TÊN doc; đây soát MỨC.
  // Hai nửa: (a) registry ↔ bảng canon của ba-review khớp hai chiều; (b) không nơi nào chấm ngược.
  console.log('\n=== 18. Phân loại 🟠 nhất quán (canon = ba-review) ===');
  const orangeReg = (REG['gap.orange'] || []).map(e => { const i = e.lastIndexOf(':'); return [e.slice(0, i), e.slice(i + 1)]; });
  if (!orangeReg.length) warn('registry thiếu khóa gap.orange — bỏ qua');
  else {
    // `_` trong token = "khoảng trắng HOẶC ký tự markdown xen giữa" (** ` /) — để một token bám
    // được cả "Animation chuyển cảnh" lẫn "**`e2e` lệch `test.md`**".
    const pat = tok => new RegExp(tok.split('_').map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s*`/]+'), 'i');
    let orangeDrift = 0;
    const revFile = path.join(SKILLS, 'ba-review', 'SKILL.md');
    const canonBlock = (read(revFile).match(/Phân loại 🟠 \(canon[\s\S]*?(?=\nMọi 🟡 khác)/) || [''])[0];
    if (!canonBlock) { fail('ba-review/SKILL.md mất bảng "Phân loại 🟠 (canon" — không còn canon để đối chiếu'); orangeDrift++; }
    else {
      const rows = canonBlock.split('\n').filter(l => l.startsWith('|') && !/^\|\s*-+/.test(l) && !/Mốc phải sạch/.test(l));
      const hit = new Set();
      for (const [tok, moc] of orangeReg) {
        const row = rows.find(l => pat(tok).test(l.split('|')[1] || ''));
        if (!row) { fail(`gap.orange khai "${tok.replace(/_/g, ' ')}" nhưng bảng canon 🟠 của ba-review không có dòng nào khớp`); orangeDrift++; continue; }
        hit.add(row);
        if (!(row.split('|')[2] || '').includes(moc)) { fail(`gap.orange khai "${tok.replace(/_/g, ' ')}" mốc ${moc}, bảng canon 🟠 của ba-review ghi mốc khác`); orangeDrift++; }
      }
      for (const r of rows) if (!hit.has(r)) { fail(`bảng canon 🟠 của ba-review có dòng chưa khai trong registry gap.orange: ${(r.split('|')[1] || '').trim().slice(0, 50)}…`); orangeDrift++; }
    }
    // (b) Quét BỀ MẶT LUẬT của toolkit (skill/agent/CLAUDE.md/README) — cố ý KHÔNG quét example/:
    // đó là output một dự án, gap report của nó ghi mức nào là việc của lần ba-review đó.
    const RULES = SCAN.filter(p => !rel(p).startsWith('example'));
    const W = 120; // bán kính "cùng một câu" — bảng ba-review có dòng dài hàng nghìn ký tự, so cả dòng thì dương tính giả
    for (const f of RULES) {
      const lines = read(f).split('\n');
      for (let i = 0; i < lines.length; i++) {
        for (const [tok, moc] of orangeReg) {
          const m = pat(tok).exec(lines[i]);
          if (!m) continue;
          const near = lines[i].slice(Math.max(0, m.index - W), m.index + m[0].length + W);
          if (near.includes('🟡') && !near.includes('🟠')) {
            fail(`${rel(f)}:${i + 1} chấm 🟡 cho chủ đề 🟠 "${tok.replace(/_/g, ' ')}" (mốc ${moc}) — canon ở ba-review → "Phân loại 🟠"`);
            orangeDrift++;
          }
        }
      }
    }
    if (!orangeDrift) ok(`Phân loại 🟠 nhất quán (${orangeReg.length} chủ đề · quét ${RULES.length} file luật)`);
  }

  // 19 — Skill profile-aware KHÔNG được liệt kê cứng artifact của bộ 9.
  // Vì sao cần: hồ sơ dự án là chiều cấu hình thứ hai, nhưng mỗi skill là một PROMPT RIÊNG —
  // thêm một chiều thì phải đi sửa từng nơi, và không check nào cũ khoá được CÂU CHỮ. Thực tế:
  // ba-build lọc màn đủ điều kiện bằng "srs/usecase/test/html = ✅" nên ở hồ sơ `mini` (không có
  // cột usecase) KHÔNG màn nào đủ điều kiện — dự án viết xong tài liệu rồi kẹt, không ra được code;
  // ba-review thì dòng scope <màn> vẫn đòi 3 file mà luật hồ sơ ngay dưới nói là không có.
  // Luật: skill nào khai profile-aware mà nhắc một artifact `mini` đã bỏ (hoặc chuỗi "9/9") thì
  // TRONG BÁN KÍNH vài dòng phải nói rõ nhánh hồ sơ — nếu không, đó là một đòi hỏi vô điều kiện.
  console.log('\n=== 19. Skill profile-aware không đòi cứng artifact bộ 9 ===');
  const awareSkills = REG['profile.aware'] || [];
  const droppedKeys = REG['profile.mini.off'] || [];
  if (!awareSkills.length || !droppedKeys.length) warn('registry thiếu profile.aware / profile.mini.off — bỏ qua');
  else {
    const fileOf = (k) => (k === 'designspec' ? 'design-spec' : k) + '.md';
    // Hai dạng bẫy, phải bắt CẢ HAI — bản đầu chỉ bắt tên file .md và đã trượt đúng con bug sinh
    // ra nó: chỗ chặn cứng ba-build là chuỗi `srs/usecase/test/html = ✅`, tức DANH SÁCH TÊN CỘT
    // tracking, không có ".md" nào. Dạng (b) bắt mọi liệt kê ≥3 cột có chứa cột `mini` đã bỏ.
    const COLS9 = ['ascii', 'brainstorm', 'srs', 'usecase', 'userstory', 'design-spec', 'html', 'test', 'plan'];
    const droppedCols = droppedKeys.map(k => (k === 'designspec' ? 'design-spec' : k));
    // Dấu ` quanh từng tên là chuyện thường trong SKILL.md (`srs`/`usecase`/…) — regex phải cho
    // phép, không thì check trượt đúng dòng nó cần bắt (đã trượt một lần vì lý do này).
    const N = `(?:${COLS9.join('|')})`;
    const listRe = new RegExp(`\`?\\b${N}\\b\`?(?:/\`?\\b${N}\\b\`?){2,}`, 'g');
    const needles = [...droppedKeys.map(fileOf), '9/9'];
    const W = 1;   // bán kính DÒNG: chỉ dòng LIỀN KỀ mới che được. Nới rộng hơn thì một ghi chú `mini`
                   // của luật KHÁC ở gần đó lại che cho một đòi hỏi vô điều kiện — đã dính đúng bẫy này.
    let hardCoded = 0;
    for (const sk of awareSkills) {
      const p = path.join(SKILLS, sk, 'SKILL.md');
      if (!fs.existsSync(p)) continue;  // check 17 đã bắt skill không tồn tại
      const lines = read(p).split('\n');
      for (let i = 0; i < lines.length; i++) {
        for (const n of needles) {
          const at = lines[i].indexOf(n);
          if (at < 0) continue;
          // `00-brainstorm.md` là file CẤP DỰ ÁN, `mini` không bỏ nó — chỉ `brainstorm.md` trong
          // folder màn mới bị bỏ. Không chặn tiền tố thì check bắt oan đúng mục "Xác nhận giả định".
          if (/[-\w]/.test(lines[i][at - 1] || '')) continue;
          const near = lines.slice(Math.max(0, i - W), i + W + 1).join('\n');
          if (/mini|[Hh]ồ sơ/.test(near)) continue;
          fail(`${sk}/SKILL.md:${i + 1} nhắc "${n}" mà không nêu nhánh hồ sơ — ở \`mini\` artifact đó không tồn tại, đòi vô điều kiện là chặn oan`);
          hardCoded++;
        }
        for (const m of lines[i].match(listRe) || []) {
          if (!droppedCols.some(c => m.replace(/`/g, '').split('/').includes(c))) continue;  // liệt kê toàn cột mini vẫn có → không sao
          // Dạng này soi CÙNG DÒNG, không dùng bán kính: một liệt kê cột là MỘT ĐIỀU KIỆN, phần
          // giới hạn phạm vi phải dính ngay vào nó. Nới ra vài dòng thì một ghi chú `mini` ở câu
          // bên cạnh sẽ che cho điều kiện — đúng cách con bug ba-build sống sót qua hai lần thử phá.
          if (/mini|[Hh]ồ sơ/.test(lines[i])) continue;
          fail(`${sk}/SKILL.md:${i + 1} liệt kê cứng cột "${m}" mà không nêu nhánh hồ sơ — ở \`mini\` cột đã bỏ không bao giờ ✅, điều kiện thành không bao giờ đúng`);
          hardCoded++;
        }
      }
    }
    if (!hardCoded) ok(`${awareSkills.length} skill profile-aware đều nêu nhánh hồ sơ khi nhắc artifact bộ 9`);
  }

  // 20 (review agent chỉ-đọc + khai model) gộp vào lint 30 / check-agents.js (25/09/2026): roster khai `review:ro`
  // cho mọi ba-* agent, check-agents đòi `tools` + `model` ∈ agents.models, cấm Write/Edit/NotebookEdit/Agent với ro và
  // Bash với review — chặt hơn bản cũ (bản cũ cho `inherit`), và agent ngoài roster đã đỏ ở đó.
}

// ── 21. Script E2E không được nằm trong docs/ ──────────────────────────────────────────────
// `e2e.spec.ts` là code chạy được: để trong cây tài liệu thì nó KHÔNG chạy được tại chỗ
// (docs/ không có package.json/tsconfig), portal phải né file .ts, và QA sửa selector phải
// commit vào docs/. Canon: conventions.md → "Script E2E để ở đâu"; khóa `e2e.dir` của registry.
// Chỉ soi repo NÀY (example/) — dự án tiêu thụ cài trước 31/08/2026 vẫn hợp lệ với bố cục cũ,
// đó là lý do e2epath.js tồn tại; luật này là để bản mẫu của toolkit không dạy sai.
{
  console.log('\n=== 21. Script E2E không nằm trong docs/ (canon e2e.dir) ===');
  const lạc = [];
  const quét = (d) => {
    let ents = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) quét(p);
      else if (/\.spec\.(ts|js)$/.test(e.name)) lạc.push(path.relative(ROOT, p));
    }
  };
  for (const docsDir of ['example/docs', 'docs']) {
    const abs = path.join(ROOT, docsDir);
    if (fs.existsSync(abs)) quét(abs);
  }
  if (lạc.length) {
    for (const f of lạc) fail(`${f} — script test nằm trong docs/; canon là \`e2e/tests/<Mã>-<Tên>.spec.ts\` ở gốc dự án (registry \`e2e.dir\`)`);
  } else ok('không có script test nào lạc vào docs/');

  // Skill không được dạy đường dẫn cũ như NƠI GHI (nhắc để nói tương thích ngược thì được).
  const dạySai = [];
  for (const s of [...ba, ...dev, ...ac]) {
    const f = path.join(SKILLS, s, 'SKILL.md');
    const t = read(f);
    if (/(sinh|ghi|tạo|→)\s*`?docs\/Screen-spec\/[^`\n]*e2e\.spec\.ts/.test(t)) dạySai.push(s + '/SKILL.md');
  }
  if (dạySai.length) for (const f of dạySai) fail(`${f} còn dạy ghi e2e.spec.ts vào docs/ — đổi sang \`e2e/tests/\``);
}

// 22 (example/e2e/.env.example khai đủ biến E2E_* của spec) RÚT 25/09/2026: example/e2e không có tests/ lẫn .env.example —
// mục chạy trên tập rỗng từ ngày viết, không bao giờ bắt được gì. Bản mẫu có lại spec E2E thì viết lại kèm ca đối kháng.

// ── 23. Cấu trúc skill chuẩn: gốc skill CHỈ chứa SKILL.md + scripts/ references/ assets/ ──────
// Từ 04/09/2026 toolkit theo bố cục Agent Skill chuẩn. Không có check này thì skill mới lại
// thả `build.js` cạnh `SKILL.md` như cũ, và bố cục trôi về hỗn hợp — nửa cũ nửa mới là trạng
// thái tệ nhất, vì không ai biết phải tìm file ở đâu.
{
  console.log('\n=== 23. Bố cục skill chuẩn (SKILL.md + scripts/ references/ assets/) ===');
  const CHO_PHEP = new Set(['scripts', 'references', 'assets']);
  const lạc = [];
  for (const s of [...ba, ...dev, ...ac]) {
    const d = path.join(SKILLS, s);
    let ents = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      if (e.name.startsWith('.')) continue;
      if (e.isDirectory() ? CHO_PHEP.has(e.name) : e.name === 'SKILL.md') continue;
      lạc.push(`${s}/${e.name}`);
    }
  }
  if (lạc.length) {
    for (const f of lạc.slice(0, 12)) {
      fail(`${f} nằm ở gốc skill — bố cục chuẩn chỉ cho SKILL.md + scripts/ + references/ + assets/`);
    }
    if (lạc.length > 12) fail(`… và ${lạc.length - 12} file/thư mục khác`);
  } else ok(`${ba.length + dev.length + ac.length} skill đều theo bố cục chuẩn (SKILL.md + scripts/references/assets)`);
}

// ── 24. Bảng phân loại cổng của `ba-auto` khớp giữa SKILL.md và run-gates.js ──────────────────
// `ba-auto` chạy KHÔNG CẦN TRÔNG, nên "cổng này máy chốt hay người chốt" quyết định chuỗi dừng
// ở đâu. Luật nằm ở bảng trong SKILL.md; `run-gates.js` chép lại nó ở cột `chotBoi`. Hai bản
// lệch nhau thì chuỗi dừng sai chỗ — hoặc hỏi người thứ nó tự tra được (người duyệt phản xạ),
// hoặc tự chốt thứ chỉ người mới quyết được (tệ hơn hẳn). Lệch kiểu này KHÔNG gây lỗi runtime,
// nên chỉ có lint bắt được.
{
  console.log('\n=== 24. Bảng máy/người của ba-auto khớp run-gates.js ===');
  const sk = path.join(SKILLS, 'ba-auto', 'SKILL.md');
  const rg = path.join(SKILLS, 'ba-auto', 'scripts', 'run-gates.js');
  if (fs.existsSync(sk) && fs.existsSync(rg)) {
    const bảng = fs.readFileSync(sk, 'utf8');
    const mã = fs.readFileSync(rg, 'utf8');
    // Mỗi cổng trong run-gates: tên script (khoá đối chiếu) + chotBoi khai ngay phía trên.
    const cổng = [];
    for (const m of mã.matchAll(/chốtBởi:\s*'(máy|người)'[\s\S]{0,400}?'([\w-]+\.js)'/g)) {
      cổng.push({ chốt: m[1], script: m[2] });
    }
    if (!cổng.length) fail('lint 24: không đọc được bảng cổng trong ba-auto/run-gates.js — đổi cấu trúc thì sửa cả check này');
    let lệch = 0;
    for (const c of cổng) {
      const dòng = bảng.split('\n').find((l) => l.startsWith('|') && l.includes(c.script));
      if (!dòng) { fail(`lint 24: cổng \`${c.script}\` có trong run-gates.js nhưng KHÔNG có dòng nào trong bảng phân loại của ba-auto/SKILL.md`); lệch++; continue; }
      const ô = dòng.replace(/\|\s*$/, '').split('|').map((x) => x.trim().replace(/\*/g, ''));
      const khai = ô[ô.length - 1] || '';
      if (!khai.startsWith(c.chốt)) {
        fail(`lint 24: \`${c.script}\` — run-gates.js xếp "${c.chốt}", bảng ba-auto/SKILL.md ghi "${khai}"`);
        lệch++;
      }
    }
    if (!lệch && cổng.length) ok(`ba-auto: ${cổng.length} cổng khớp phân loại máy/người giữa SKILL.md và run-gates.js`);
  } else if (vắngHợpLệ('ba-auto')) ok('ba-auto vắng (skills.pro) — không áp');
}

// ── 25. Ngân sách MÔ TẢ skill ─────────────────────────────────────────────────────────────
// `description` của mọi skill được nạp vào context ở MỌI phiên, tại MỌI dự án đích — nó là chi
// phí cố định trả trước khi làm bất cứ việc gì. Không ai từng đo nó, nên nó chỉ có một chiều:
// mỗi skill mới cộng thêm, mỗi lần "nói rõ hơn một chút" cộng thêm. Trần này không phải cách
// tiết kiệm byte (cắt 21 mô tả dài nhất chỉ giảm ~11%); nó là cái RÁP-XÊ — thêm skill trở thành
// một đánh đổi nhìn thấy được thay vì một khoản nợ âm thầm. Canon: `desc.max`/`desc.total`.
// Phần "KHÁC skill X…" KHÔNG thuộc về mô tả: đó là thứ đọc SAU khi đã chọn skill → `## Ranh giới`.
{
  console.log(`\n=== 25. Ngân sách mô tả skill (trần ${(REG["desc.max"] || ["?"])[0]} ký tự/skill) ===`);
  const MAX = parseInt((REG["desc.max"] || [])[0], 10);
  const TOTAL = parseInt((REG["desc.total"] || [])[0], 10);
  if (!MAX || !TOTAL) warn("conv-registry.md thiếu desc.max/desc.total — bỏ qua check 25");
  else {
    let tổng = 0; const quá = []; const thiếu = [];
    for (const s of fs.readdirSync(SKILLS)) {
      const f = path.join(SKILLS, s, "SKILL.md");
      if (!fs.existsSync(f)) continue;
      const fm = (read(f).match(/^---\n([\s\S]*?)\n---/) || [, ""])[1];
      const d = ((fm.match(/^description:\s*([\s\S]*?)(?=\n[a-zA-Z-]+:|$)/m) || [, ""])[1]).trim();
      if (!d) { thiếu.push(s); continue; }
      tổng += d.length;
      if (d.length > MAX) quá.push(`${s} = ${d.length}`);
      // Mệnh đề mở đầu là thứ Claude Code khớp để auto-trigger. Cắt nó để lách trần = skill
      // không bao giờ được gọi — hỏng theo kiểu im lặng nhất có thể.
      if (!/^Use when /.test(d)) warn(`${s}: mô tả không mở đầu bằng "Use when " — đó là chuỗi auto-trigger`);
    }
    for (const s of thiếu) fail(`${s}/SKILL.md không có \`description\` — skill sẽ không bao giờ auto-trigger`);
    for (const q of quá) fail(`mô tả quá trần ${MAX}: ${q} — chuyển phần phân biệt skill xuống mục \`## Ranh giới\``);
    if (tổng > TOTAL) fail(`tổng mô tả ${tổng} > ngân sách ${TOTAL} — cắt bớt hoặc GỘP skill, đừng nới trần theo phản xạ`);
    if (!quá.length && !thiếu.length && tổng <= TOTAL) ok(`${tổng} ký tự / ${TOTAL} (còn ${TOTAL - tổng}) · mọi mô tả ≤ ${MAX}`);
  }
}

// ── 26. Mọi skill pipeline nối về `ba-next` ───────────────────────────────────────────────
// `ba-next` là "một cửa" của toolkit — và là skill được gọi nhiều nhất trong thực đo. Nhưng
// trước 09/09/2026 chỉ 11/77 SKILL.md nhắc tới nó: cửa có, lối dẫn tới cửa thì không. Hệ quả
// không phải lỗi mà là THÓI QUEN — xong một bước, agent tự đoán bước kế thay vì để `status.js`
// tính từ hiện trạng `docs/`, và đoán sai thì nhảy cóc qua cả một cổng. Canon: `next.exempt`.
{
  console.log("\n=== 26. Skill pipeline nối về ba-next ===");
  // parseRegistry trả MẢNG (đã tách theo khoảng trắng), không phải chuỗi.
  const MIỄN = new Set(REG["next.exempt"] || []);
  if (!MIỄN.size) warn("conv-registry.md thiếu next.exempt — bỏ qua check 26");
  else {
    const DẤU = "Xong bước này → chạy \`ba-next\`";
    const thiếu = [];
    let đủ = 0;
    for (const s of fs.readdirSync(SKILLS)) {
      if (!s.startsWith("ba-") || MIỄN.has(s)) continue;
      const f = path.join(SKILLS, s, "SKILL.md");
      if (!fs.existsSync(f)) continue;
      if (read(f).includes(DẤU)) đủ++; else thiếu.push(s);
    }
    for (const s of thiếu) fail(`${s}/SKILL.md không nối về \`ba-next\` ở cuối — thêm dòng "${DẤU}…" vào mục \`## Lưu ý\`, hoặc khai miễn trừ ở \`next.exempt\` nếu skill này không đẩy pipeline`);
    if (!thiếu.length) ok(`${đủ} skill pipeline đều nối về ba-next (${MIỄN.size} miễn trừ có khai)`);
  }
}

// ── 27. Phép kiểm do hook cưỡng chế: khai trong registry thì phải có hàm THẬT ─────────────
// Hook là nơi luật của toolkit chuyển từ CHỮ sang MÁY. Chuyển được thì tốt, nhưng nó tạo một
// dạng trôi mới: registry khai `H1` mà `check-md.js` không còn hàm `H1` thì không có lỗi runtime
// nào — hook vẫn chạy, chỉ là phép kiểm đó biến mất, và luật quay về trạng thái tự nguyện mà
// KHÔNG AI BIẾT. Đúng dạng hỏng im lặng mà bộ test này tồn tại để bắt.
{
  console.log('\n=== 27. Phép kiểm hook khai trong registry có hàm thật ===');
  const khai = REG['gate.hook.checks'] || [];
  const sựKiện = REG['gate.hook.events'] || [];
  if (!khai.length) warn('conv-registry.md thiếu gate.hook.checks — bỏ qua check 27');
  else {
    let drift = 0;
    for (const mục of khai) {
      const [mã, script] = mục.split(':');
      const f = path.join(SKILLS, 'ba-toolkit', 'scripts', script || '');
      if (!fs.existsSync(f)) { fail(`gate.hook.checks khai \`${mã}\` ở \`${script}\` — không có file đó`); drift++; continue; }
      const src = read(f);
      // Hàm tên đúng mã (H1/H2) hoặc chuỗi mã xuất hiện như nhãn phát hiện (S2 nằm trong thông báo). Từ M8 (08/10/2026) mã
      // đứng CUỐI câu thông báo trong ngoặc — `… (S2):\`` — thay cho thẻ đầu `[… · S2]`; bắt cả hai, và phải sát dấu đóng chuỗi
      // (ngoặc mã trong chú thích không tính).
      if (!new RegExp(`function ${mã}\\b|mã: '${mã}'|· ${mã}\\]|\\(${mã}\\)[.:]?(?:\\\\n)?['\`]`).test(src)) {
        fail(`gate.hook.checks khai \`${mã}\` nhưng \`${script}\` không có hàm/nhãn nào mang mã đó — luật đã lặng lẽ quay về tự nguyện`);
        drift++;
      }
    }
    for (const mục of sựKiện) {
      const [, script] = mục.split(':');
      if (!fs.existsSync(path.join(SKILLS, 'ba-toolkit', 'scripts', script || ''))) { fail(`gate.hook.events trỏ \`${script}\` — không có file đó`); drift++; }
    }
    if (!drift) ok(`${khai.length} phép kiểm hook + ${sựKiện.length} sự kiện đều có script thật`);
  }
}

// ── 28. CLAUDE.md có trần ────────────────────────────────────────────────────────────────
// Cùng bệnh với check 25, nhưng ở file lớn hơn 4 lần và không ai từng đo: 13 KB → 77 KB trong
// 5 tuần, ~19k token nạp MỌI phiên, MỌI máy. Nguyên nhân là cơ chế TỐT: mỗi convention mới kèm
// một đoạn "vì sao" — và không có chỗ nào khác để đặt đoạn đó. Nay có: docs/decisions/. Trần
// này không cấm viết dài; nó cấm viết dài Ở ĐÂY.
{
  console.log('\n=== 28. CLAUDE.md dưới trần (briefing, không phải nhật ký) ===');
  const MAX = parseInt((REG['claude.max'] || [])[0], 10);
  if (!MAX) warn('conv-registry.md thiếu claude.max — bỏ qua check 28');
  else if (!fs.existsSync(CLAUDEMD)) ok('CLAUDE.md vắng — repo công khai không mang briefing phát triển (devOnly), không áp');
  else {
    const n = Buffer.byteLength(read(CLAUDEMD), 'utf8');
    if (n > MAX) fail(`CLAUDE.md ${n} byte > trần ${MAX} — phần "vì sao" chuyển sang docs/decisions/, để lại một dòng trỏ`);
    else ok(`CLAUDE.md ${n} byte / ${MAX} (còn ${MAX - n})`);
    if (!fs.existsSync(path.join(ROOT, 'docs', 'decisions', 'README.md'))) fail('thiếu docs/decisions/README.md — nơi nhận phần "vì sao" tách khỏi CLAUDE.md');
  }
}

// ── 29. Phạm vi dự án (full/docs) nhất quán ─────────────────────────────────────────────
// Trục thứ hai bên cạnh hồ sơ: "có dev hay không". Ba chỗ phải khớp: khóa registry (canon) ·
// profile.js (script đọc) · bộ skill dev (install.js --scope docs cắt). Lệch thì hoặc dự án
// chỉ-tài-liệu bị cài ba-build/dev-run (agent chọn nhầm), hoặc `docs` khai mà không script nào
// nhận ra — đúng hai lỗi trục này sinh ra để chống.
{
  console.log('\n=== 29. Phạm vi dự án (full/docs) nhất quán ===');
  const scopes = REG['scope.values'] || [], scopeOff = REG['scope.off'] || [], devSkills = REG['scope.dev.skills'] || [];
  const profFile = path.join(SKILLS, 'ba-toolkit', 'scripts', 'profile.js');
  if (!scopes.length) warn('registry thiếu scope.values — bỏ qua check 29');
  else if (!scopes.includes('docs') || !scopes.includes('full')) fail(`scope.values phải có "full" và "docs" (có: ${scopes.join(' ')})`);
  else if (!fs.existsSync(profFile)) fail('registry khai scope.* nhưng thiếu ba-toolkit/profile.js');
  else {
    let drift = 0;
    const body = read(profFile);
    if (!/function readScope\(docsDir\)/.test(body)) { fail('profile.js thiếu readScope() — registry khai scope.values mà không script nào đọc được phạm vi'); drift++; }
    const declared = ((body.match(/const SCOPES = \[([^\]]*)\]/) || [, ''])[1].match(/'([^']+)'/g) || []).map(x => x.slice(1, -1));
    if (declared.join(' ') !== scopes.join(' ')) { fail(`SCOPES của profile.js (${declared.join(' ')}) lệch registry scope.values (${scopes.join(' ')})`); drift++; }
    const offBody = (body.match(/function off\(docsDir\)[\s\S]*?\n}/) || [''])[0];
    for (const k of scopeOff)
      if (!new RegExp(`\\b${k}\\s*:\\s*isDocsOnly\\(`).test(offBody)) { fail(`profile.js off() thiếu "${k}: isDocsOnly(...)" mà registry scope.off có`); drift++; }
    for (const m of offBody.matchAll(/^\s{4}([a-z]+):\s*isDocsOnly\(/gm))
      if (!scopeOff.includes(m[1])) { fail(`profile.js off() có "${m[1]}: isDocsOnly" chưa khai trong registry scope.off`); drift++; }
    // plan.md là file dev: screenFiles() phải bỏ nó ở docs, không thì màn không bao giờ "Hoàn thành".
    if (!/isDocsOnly\(docsDir\)\s*\?\s*files\.filter\(f => f !== 'plan'\)/.test(body)) { fail("profile.js screenFiles() không bỏ 'plan' khi phạm vi docs"); drift++; }
    if (!devSkills.length) { fail('registry thiếu scope.dev.skills — --scope docs không biết cắt gì'); drift++; }
    for (const sk of devSkills) {
      if (/^(dev|ac)-/.test(sk)) { fail(`scope.dev.skills liệt kê ${sk} — dev-*/ac-* đi theo tiền tố, không liệt kê`); drift++; }
      else if (!fs.existsSync(path.join(SKILLS, sk, 'SKILL.md')) && !vắngHợpLệ(sk)) { fail(`scope.dev.skills trỏ tới skill không tồn tại: ${sk}`); drift++; }
    }
    // install.js là nơi thực thi cắt: phải đọc đúng khóa, đúng file (đường dẫn references/ —
    // bug thật 04/09→15/09: đọc `ba-toolkit/conv-registry.md` không tồn tại nên --mini exit 2 vô điều kiện).
    const inst = read(path.join(SKILLS, 'ba-export', 'scripts', 'install.js'));
    if (!/scope\.dev\.skills/.test(inst)) { fail('ba-export/scripts/install.js không đọc scope.dev.skills — --scope docs không có tác dụng'); drift++; }
    if (/path\.join\(skillsSrc, 'ba-toolkit', 'conv-registry\.md'\)/.test(inst)) { fail("install.js đọc ba-toolkit/conv-registry.md — file thật ở ba-toolkit/references/"); drift++; }
    if (!drift) ok(`Phạm vi nhất quán (${scopes.join('/')} · ${scopeOff.length} cơ chế tắt ở docs · ${devSkills.length} skill ba-* thuộc dev + dev-* theo tiền tố)`);
  }
}

// ── 30. Đội agent khớp roster ──────────────────────────────────────────────────────────
// Agent là file có hợp đồng (ai phái · nhận gì · trả về đâu · quyền). Canon: agents.roster. Checker
// có sẵn thì GỌI, không viết lại: ba-toolkit/scripts/check-agents.js (dời từ ac-agent ở đợt 2 M6 — lint lõi không được phụ thuộc skill giữ riêng). Ở đây chỉ chuyển exit code thành lỗi lint.
{
  console.log('\n=== 30. Đội agent khớp roster (agents.roster) ===');
  const ck = path.join(SKILLS, 'ba-toolkit', 'scripts', 'check-agents.js');
  if (!REG['agents.roster']) warn('registry thiếu agents.roster — bỏ qua check 30');
  else if (!fs.existsSync(ck)) fail('registry khai agents.roster nhưng thiếu ba-toolkit/scripts/check-agents.js');
  else {
    const r = require('child_process').spawnSync(process.execPath, [ck, '--root', ROOT, '--json'], { encoding: 'utf8' });
    let j = null; try { j = JSON.parse(r.stdout); } catch { /* rơi xuống dưới */ }
    if (!j) fail(`check-agents.js không trả JSON (exit ${r.status}): ${(r.stderr || r.stdout || '').trim().slice(0, 200)}`);
    else { for (const l of j.lỗi) fail(l); conHỏng('check-agents.js', r, j.lỗi.length > 0); if (!j.lỗi.length) ok(`${j.agents} agent khớp ${j.roster} mục roster, quyền khớp loại, hợp đồng đủ`); }
  }
}

// ── 31. Trích dẫn phải tồn tại (check-cites.js) ─────────────────────────────────────────
// Steal B18: di trú scripts/ để lại 4 đường dẫn chết trong CODE 11 ngày. Checker có sẵn thì gọi.
// Từ 25/09/2026 check-cites soát luôn tên skill/agent trong backtick của SKILL.md (ex-lint 4, miễn deprecated.skills).
{
  console.log('\n=== 31. Trích dẫn tồn tại: đường dẫn `.claude/skills/…` + tên skill/agent `ba-*`/`dev-*`/`ac-*` ===');
  const ck = path.join(SKILLS, 'ba-toolkit', 'scripts', 'check-cites.js');
  const r = require('child_process').spawnSync(process.execPath, [ck, '--root', ROOT, '--json'], { encoding: 'utf8' });
  let j = null; try { j = JSON.parse(r.stdout); } catch { fail(`check-cites.js không trả JSON: ${(r.stderr || '').slice(0, 160)}`); }
  if (j) { for (const l of j.lỗi) fail(l); conHỏng('check-cites.js', r, j.lỗi.length > 0); if (!j.lỗi.length) ok(`${j.cites} đường dẫn trích trong ${j.files} file đều tồn tại${j.tên === undefined ? '' : ` · ${j.tên} tên skill/agent đều có thật`}`); }
}

// ── 32. description là YAML plain scalar hợp lệ ─────────────────────────────────────────
// Steal B7: 9 file từng có `: ` trong description không ngoặc → parser YAML nghiêm ném
// "Nested mappings are not allowed". Claude Code hiện khoan dung, nhưng consumer khác thì không.
// Không sửa bằng ngoặc kép: check 25 test /^Use when / trên giá trị thô, register.js/launcher hiện thô.
{
  console.log('\n=== 32. description là plain scalar YAML hợp lệ (không `: `, không ` #`, không kết thúc `:`; SKILL không `<`/`>`) ===');
  let yamlDrift = 0;
  const files = [...ba, ...dev, ...ac].map(s => path.join(SKILLS, s, 'SKILL.md')).concat(agents.map(a => path.join(AGENTS, a)));
  for (const f of files) {
    const fm = (read(f).match(/^---\n([\s\S]*?)\n---/) || [, ''])[1];
    const d = (fm.match(/^description:\s*(.*)$/m) || [])[1];
    if (d === undefined) continue;
    if (/^["']/.test(d)) { warn(`${rel(f)}: description bọc ngoặc — check 25/register.js/launcher đọc giá trị thô, bỏ ngoặc và thay \`: \` bằng \` — \``); continue; }
    const why = [];
    if (/: /.test(d)) why.push('có `: ` (YAML hiểu là mapping lồng)');
    if (/ #/.test(d)) why.push('có ` #` (YAML cắt thành comment)');
    if (/:\s*$/.test(d)) why.push('kết thúc bằng `:`');
    if (/^[-?,\[\]{}#&*!|>%@`]/.test(d)) why.push(`mở đầu bằng \`${d[0]}\``);
    // Đợt 6 (24/09/2026): upstream skill-creator `description_no_xml` — `<`/`>` trong description SKILL bị coi là thẻ XML
    // (đợt 5 đã gỡ tay 8 chỗ `<base>`, `<màn>` → `[base]`). Chỉ SKILL.md: agent (`.claude/agents/`) không qua luật đó.
    if (/\/SKILL\.md$/.test(f) && /[<>]/.test(d)) why.push('có `<`/`>` (upstream description_no_xml — dùng `[x]`)');
    if (why.length) { fail(`${rel(f)}: description không phải plain scalar hợp lệ — ${why.join(' · ')}`); yamlDrift++; }
  }
  if (!yamlDrift) ok(`${files.length} description đều là plain scalar hợp lệ`);
}

// 33. Quyền PO: mỗi mục po.ask/po.may phải có NGUYÊN VĂN trong bảng "Quyền của PO" của ac-po/SKILL.md, và các mục máy
// cưỡng chế được phải có mặt trong mission.js/pick.js. Nới quyền PO bằng cách sửa SKILL mà quên registry (hoặc ngược
// lại) là để PO tự quyết thứ người chưa cho — lỗi im lặng đúng kiểu nguy hiểm nhất.
{
  console.log('\n=== 33. Quyền PO (po.ask/po.may) khớp ac-po/SKILL.md và script ===');
  const ask = REG['po.ask'] || [], may = REG['po.may'] || [];
  const sk = path.join(SKILLS, 'ac-po', 'SKILL.md');
  if (!ask.length || !may.length) warn('registry thiếu po.ask/po.may — bỏ qua');
  else if (!fs.existsSync(sk) && vắngHợpLệ('ac-po')) ok('ac-po vắng (skills.pro) — không áp');
  else if (!fs.existsSync(sk)) fail('registry có po.ask nhưng không có skill ac-po');
  else {
    const txt = read(sk); let poDrift = 0;
    const bảng = (txt.match(/## Quyền của PO[\s\S]*?\n\n(?=[^|\n])/) || [txt])[0];
    for (const tok of [...ask, ...may]) { const t = tok.replace(/_/g, ' '); if (!bảng.includes(t)) { fail(`ac-po/SKILL.md: bảng "Quyền của PO" thiếu nguyên văn "${t}" (po.${ask.includes(tok) ? 'ask' : 'may'})`); poDrift++; } }
    const mj = read(path.join(SKILLS, 'ac-po', 'scripts', 'mission.js')) + read(path.join(SKILLS, 'ac-po', 'scripts', 'pick.js'));
    for (const [tok, re] of [['TRẢ_quá_2_vòng_cùng_một_việc', /MAX_TRẢ\s*=\s*2/], ['phase_suy_từ_tracking', /phase suy từ 00-tracking/], ['câu_hỏi_thuộc_sổ_PD', /PD Treo/], ['đổi_baseline_(mở_CR)', /CR còn/]]) {
      if (ask.includes(tok) && !re.test(mj)) { fail(`po.ask "${tok.replace(/_/g, ' ')}" không được mission.js/pick.js cưỡng chế`); poDrift++; }
    }
    if (!poDrift) ok(`${ask.length} mục phải hỏi + ${may.length} mục được quyết đều có trong SKILL.md; 4 mục máy cưỡng chế`);
  }
}

// 38. Vai được sonnet (agents.sonnet.roles, E 19/09/2026): mỗi token phải xuất hiện nguyên văn ở ac-agent/SKILL.md (nơi giữ
// luật model) và run-step.md của ac-po (nơi PO headless quyết model) — thêm vai ở registry mà quên SKILL là PO không biết.
{
  console.log('\n=== 38. agents.sonnet.roles khớp ac-agent/SKILL.md + ac-po run-step.md ===');
  const roles = REG['agents.sonnet.roles'] || [];
  if (!roles.length) warn('registry thiếu agents.sonnet.roles — bỏ qua');
  else {
    const a = read(path.join(SKILLS, 'ac-agent', 'SKILL.md')), b = read(path.join(SKILLS, 'ac-po', 'assets', 'run-step.md')); let drift = 0;
    for (const r of roles) { if (!vắngHợpLệ('ac-agent') && !a.includes(r)) { fail(`ac-agent/SKILL.md thiếu vai sonnet "${r}"`); drift++; } if (!vắngHợpLệ('ac-po') && !b.includes(r)) { fail(`ac-po/assets/run-step.md thiếu vai sonnet "${r}"`); drift++; } }
    if (!drift) ok(`${roles.length} vai sonnet có mặt ở ${vắngHợpLệ('ac-po') ? 'ac-agent/SKILL.md (ac-po vắng — skills.pro)' : 'cả hai nơi'}`);
  }
}

// 36. Luật máy từ finding (ac-judge/rules.js): seed của toolkit phải qua `rules.js lint` (mỗi luật có finding gốc, regex, glob,
// mức), mẫu review có khối ```rules để `from-review` đọc, agent judge/builder nhắc `rules.js` — thiếu một mắt là luật sinh ra
// mà không ai chạy (chính là tình trạng mục "Chuyển thành luật lint" suốt tháng 9).
{
  console.log('\n=== 36. Luật máy từ finding: seed qua rules.js lint · template có khối rules · judge/builder gọi ===');
  const r = require('child_process').spawnSync(process.execPath, [path.join(SKILLS, 'ac-judge', 'scripts', 'rules.js'), 'lint', '--root', path.join(ROOT, 'example')], { encoding: 'utf8' });
  let drift = 0;
  if (r.status !== 0) { fail('rules.js lint (seed) đỏ: ' + (r.stdout || r.stderr || '').trim().split('\n')[0]); drift++; }
  if (!/```rules\n/.test(read(path.join(SKILLS, 'ac-judge', 'assets', 'review-template.md')))) { fail('review-template.md thiếu khối ```rules trong "Chuyển thành luật lint"'); drift++; }
  for (const [f, tên] of [[path.join(ROOT, '.claude', 'agents', 'ac-judge.md'), 'agents/ac-judge.md'], [path.join(ROOT, '.claude', 'agents', 'ac-builder.md'), 'agents/ac-builder.md'], [path.join(SKILLS, 'ac-judge', 'SKILL.md'), 'ac-judge/SKILL.md']]) if (!/rules\.js/.test(read(f))) { fail(`${tên} không gọi rules.js`); drift++; }
  if (!drift) ok((r.stdout || '').trim().replace(/^\s*✓\s*/, ''));
}

// 34. Lát quy ước (conventions.js): mọi mục khai trong bản đồ LÁT phải tồn tại trong references/ — đổi tên heading của
// conventions.md mà quên bản đồ là subagent nhận lát thiếu luật, im lặng.
{
  console.log('\n=== 34. Lát quy ước conventions.js: mọi mục khai có thật ===');
  const r = require('child_process').spawnSync(process.execPath, [path.join(SKILLS, 'ba-toolkit', 'scripts', 'conventions.js'), 'check'], { encoding: 'utf8' });
  if (r.status !== 0) { const dòng = (r.stdout + r.stderr).split('\n').filter((l) => /❌/.test(l)); for (const l of dòng) fail(l.replace(/^\s*❌\s*/, 'conventions.js: ')); conHỏng('conventions.js check', r, dòng.length > 0); }
  else ok((r.stdout || '').trim().replace(/^\s*✓\s*/, ''));
}

// 39. Dấu hiệu repo nguồn (export.srcMarker): 4 script phân biệt "repo toolkit gốc" với "dự án đang dùng toolkit".
// Mỗi script tự viết điều kiện → đổi một chỗ quên ba chỗ kia là install tự trỏ vào chính nó, hoặc hook-lint chạy
// lint-skill ở dự án tiêu dùng. Bắt cả tên thư mục CŨ còn sót: `explain-skills`/`explain` dùng làm dấu hiệu lại là
// đúng lỗi ngày 20/09/2026 (đích cũng có `explain/`).
{
  console.log('\n=== 39. Dấu hiệu repo nguồn (export.srcMarker) giống nhau ở 4 script ===');
  const marker = (REG['export.srcMarker'] || []).join('/') || 'example/docs/00-tracking.md';
  const [thưMục, ...phần] = marker.split('/');
  let drift = 0;
  for (const rel of ['ba-export/scripts/install.js', 'ba-export/scripts/global-bootstrap.js', 'ba-export/scripts/report.js', 'ba-toolkit/scripts/hook-lint.js']) {
    const txt = read(path.join(SKILLS, rel));
    const có = new RegExp(`['"\`]${thưMục}['"\`]`).test(txt) && phần.every((x) => txt.includes(x));
    if (!có) { fail(`${rel} không dùng dấu hiệu canon ${marker} để nhận repo nguồn`); drift++; }
    if (/existsSync\(path\.join\((root|srcRoot|ROOT), 'explain'\)\)|existsSync\('explain'\)/.test(txt)) { fail(`${rel} lấy \`explain/\` làm dấu hiệu repo nguồn — dự án đích cũng có folder này`); drift++; }
  }
  if (!drift) ok(`4 script cùng nhận repo nguồn bằng ${marker}`);
}

// 42. Canon ↔ code (đợt 6, 24/09/2026; từ 25/09 gộp luôn lint 35 nhãn TC verifier, 37 vế, 41 ô e2e — cùng một kiểu soát): giá trị đợt 4–5 từng viết cứng ở ≥2 nơi — script đọc/ghi nó và SKILL/agent/template
// dạy agent dùng nó. Đổi ở script mà quên chỗ dạy là agent ghi nhãn máy không nhận (hoặc máy ghi nhãn agent không biết) —
// không lỗi runtime nào, chỉ một nhánh lặng lẽ không bao giờ chạy. Mỗi khoá: canon trong registry, đối chiếu từng file dùng.
// gioiHan: đọc CHUỖI (literal, regex, tiêu đề bảng) chứ không chạy script; một giá trị ghép động sẽ không thấy.
{
  console.log('\n=== 42. Canon ↔ code: trả-loại, nhãn go-live, lỗi gieo, 9 chiều, loại lách, devserver, nối dây, nhãn TC verifier, vế, ô e2e, cột tùy chọn tracking, ô figma ===');
  const S = (r) => read(path.join(SKILLS, r)), A = (r) => read(path.join(AGENTS, r));
  const bỏDấu = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  const cùngBộ = (a, b) => [...new Set(a)].sort().join(' ') === [...new Set(b)].sort().join(' ');
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const SOÁT = {
    'po.tra.loai': (v) => {
      const e = [], acc = S('ac-verify/scripts/accept.js'), mj = S('ac-po/scripts/mission.js'), sk = S('ac-po/SKILL.md');
      const biểu = (acc.match(/const trảLoại =([\s\S]*?);\n/) || [, ''])[1];
      const trongMã = [...biểu.matchAll(/[?:]\s*'([^']+)'/g)].map((m) => m[1]);
      if (!cùngBộ(trongMã, v)) e.push(`ac-verify/scripts/accept.js trảLoại = {${[...new Set(trongMã)].join(' ')}} ≠ canon {${v.join(' ')}}`);
      if (vắngHợpLệ('ac-po')) return e;   // phần mission.js/SKILL.md chỉ soát khi ac-po (skills.pro) có mặt
      const mđ = (mj.match(/opt\('--loai',\s*'([^']+)'\)/) || [])[1];
      if (mđ !== v[0]) e.push(`ac-po/scripts/mission.js --loai mặc định "${mđ}" ≠ canon đầu "${v[0]}"`);
      const reMj = [...mj.matchAll(/\/\^([^/\n]+)\$\/(i?)/g)].map((m) => { try { return new RegExp(`^${m[1]}$`, m[2]); } catch { return null; } }).filter(Boolean);
      for (const x of v.slice(1)) if (!reMj.some((r) => r.test(x) && r.test(bỏDấu(x)))) e.push(`ac-po/scripts/mission.js không nhận \`--loai ${x}\` (cả bản bỏ dấu)`);
      for (const x of v) if (!sk.includes(`trảLoại: ${x}`)) e.push(`ac-po/SKILL.md không dạy nhánh \`trảLoại: ${x}\``);
      return e;
    },
    'pd.label.golive': (v) => {
      const e = [], nhãn = v.join(' '), re = esc(nhãn);
      if (!S('ba-toolkit/references/conv-ledgers.md').includes('`' + nhãn + '`')) e.push(`conv-ledgers.md không định nghĩa nhãn \`${nhãn}\``);
      for (const f of ['ac-po/scripts/pick.js', 'ac-verify/scripts/accept.js']) if (!(f.startsWith('ac-po/') && vắngHợpLệ('ac-po')) && !S(f).includes(re.replace(/\\-/g, '-'))) e.push(`${f} không đọc nhãn ${nhãn} (regex \`${re}\`)`);
      if (!vắngHợpLệ('ac-po') && !S('ac-po/SKILL.md').includes(nhãn)) e.push(`ac-po/SKILL.md không nhắc nhãn ${nhãn}`);
      return e;
    },
    'verify.mutate.results': (v) => {
      const e = [], mu = S('ac-verify/scripts/mutate.js'), vd = S('ac-verify/scripts/validate-done.js'), tp = S('ac-verify/assets/verification-template.md');
      const ghi = [...mu.matchAll(/kếtQuả = '([^']+)'/g)].map((m) => m[1]);
      if (!cùngBộ(ghi, v)) e.push(`ac-verify/scripts/mutate.js ghi kếtQuả {${[...new Set(ghi)].join(' ')}} ≠ canon {${v.join(' ')}}`);
      const đọc = (vd.match(/kq\.match\(\/\^\(([^)]+)\)/) || [, ''])[1].split('|').filter(Boolean);
      if (!cùngBộ(đọc, v)) e.push(`ac-verify/scripts/validate-done.js đọc kết quả {${đọc.join(' ')}} ≠ canon {${v.join(' ')}}`);
      for (const x of v) if (!tp.includes(x)) e.push(`verification-template.md không nhắc kết quả "${x}"`);
      return e;
    },
    'srs.sweep.dimensions': (v) => {
      const e = [], chuẩn = (s) => s.replace(/_/g, ' ').replace(/\s*\/\s*/g, '/').trim().toLowerCase(), canon = v.map(chuẩn);
      const sf = S('ba-feasible/scripts/scan-feasible.js');
      const mã = [...((sf.match(/const CHIỀU = \[([\s\S]*?)\n\];/) || [, ''])[1]).matchAll(/^\s*\['([^']+)'/gm)].map((m) => chuẩn(m[1]));
      if (mã.join(' | ') !== canon.join(' | ')) e.push(`ba-feasible/scripts/scan-feasible.js CHIỀU [${mã.join(' · ')}] ≠ canon [${canon.join(' · ')}] (cùng thứ tự)`);
      const tp = S('ba-screen-spec/assets/templates.md');
      const mục = (tp.match(/## Quét yêu cầu ngầm\n([\s\S]*?)\n\n\*\*/) || [, ''])[1];
      const dòng = mục.split('\n').filter((l) => /^\|/.test(l) && !/^\|[\s:|-]+\|?\s*$/.test(l)).map((l) => chuẩn(l.split('|')[1])).filter((x) => x !== 'chiều');
      if (dòng.join(' | ') !== canon.join(' | ')) e.push(`ba-screen-spec/assets/templates.md bảng "Quét yêu cầu ngầm" [${dòng.join(' · ')}] ≠ canon (cùng thứ tự)`);
      for (const f of ['ba-feasible/scripts/scan-feasible.js', 'ba-feasible/SKILL.md', 'ba-screen-spec/SKILL.md', 'ba-screen-spec/assets/templates.md'])
        for (const m of S(f).matchAll(/(?<![\d.])(\d+) chiều\b/g)) if (+m[1] !== v.length) { e.push(`${f}: "${m[0]}" ≠ ${v.length} chiều canon`); break; }
      return e;
    },
    'bypass.cats': (v) => {
      const e = [], sb = S('ac-judge/scripts/scan-bypasses.js');
      const đầu = (sb.match(/\/\*[\s\S]*?\*\//) || [''])[0];
      // header: loại có gạch nối ở đầu dòng mô tả là khai (bắt loại thừa); loại một từ (suppression) chỉ soát có mặt — `node …` cũng một từ
      const khai = [...đầu.matchAll(/^ \*   ([a-z]+(?:-[a-z]+)+)\s/gm)].map((m) => m[1]).concat(v.filter((x) => new RegExp(`^ \\*   ${esc(x)}\\s`, 'm').test(đầu)));
      const phát = [...sb.matchAll(/^\s*\['([a-z]+(?:-[a-z]+)*)',\s*\//gm), ...sb.matchAll(/\bcat: '([a-z-]+)'/g)].map((m) => m[1]);
      if (!cùngBộ(khai, v)) e.push(`scan-bypasses.js header khai {${[...new Set(khai)].join(' ')}} ≠ canon — lệch: ${[...v.filter((x) => !khai.includes(x)), ...khai.filter((x) => !v.includes(x))].join(' ')}`);
      if (!cùngBộ(phát, v)) e.push(`scan-bypasses.js phát loại {${[...new Set(phát)].join(' ')}} ≠ canon — lệch: ${[...new Set([...v.filter((x) => !phát.includes(x)), ...phát.filter((x) => !v.includes(x))])].join(' ')}`);
      return e;
    },
    'bypass.cats.judged': (v) => {
      const e = [], tất = REG['bypass.cats'] || [];
      for (const x of v) {
        if (!tất.includes(x)) e.push(`bypass.cats.judged "${x}" không thuộc bypass.cats`);
        for (const [f, t] of [['agents/ac-judge.md', A('ac-judge.md')], ['ac-judge/SKILL.md', S('ac-judge/SKILL.md')]]) if (!t.includes(x)) e.push(`${f} không dạy phán loại \`${x}\``);
      }
      return e;
    },
    'devserver.states': (v) => {
      const e = [], ds = S('ba-toolkit/scripts/devserver.js'), ev = S('ac-eval/SKILL.md');
      const đầu = (ds.match(/\/\*[\s\S]*?\*\//) || [''])[0];
      const khaiHết = [...đầu.matchAll(/^ \*\s+([^\s*]+)\s+exit (\d+) —/gm)].map((m) => m[1]);
      for (const tok of v) {
        const [st, ex] = tok.split(':');
        const h = đầu.match(new RegExp(`^ \\*\\s+${esc(st)}\\s+exit (\\d+)`, 'm'));
        if (!h || h[1] !== ex) e.push(`ba-toolkit/scripts/devserver.js header: "${st}" ${h ? 'exit ' + h[1] : 'không khai'} ≠ canon exit ${ex}`);
        if (!ds.includes(`'${st}'`)) e.push(`ba-toolkit/scripts/devserver.js không bao giờ trả trạng thái '${st}'`);
        const c = ds.match(new RegExp(`=== '${esc(st)}' \\? (\\d+)`));   // trạng thái cuối là nhánh mặc định — không có dạng này
        if (c && c[1] !== ex) e.push(`ba-toolkit/scripts/devserver.js: '${st}' → exit ${c[1]} trong mã ≠ canon exit ${ex}`);
        const k = ev.match(new RegExp(`(\\d+) \`${esc(st)}\``));
        if (!vắngHợpLệ('ac-eval') && (!k || k[1] !== ex)) e.push(`ac-eval/SKILL.md: \`${st}\` ${k ? 'exit ' + k[1] : 'không nhắc kèm exit'} ≠ canon exit ${ex}`);
      }
      const canonSt = v.map((t) => t.split(':')[0]);
      for (const st of khaiHết) if (!canonSt.includes(st)) e.push(`ba-toolkit/scripts/devserver.js header khai trạng thái "${st}" ngoài canon`);
      return e;
    },
    // (ex-lint 35) nhãn TC verifier: validate-done.js khai đúng bộ, template + agent nhắc đủ — accept.js coi mọi đỏ như nhau
    'verify.tc.labels': (v) => {
      const e = [], vd = S('ac-verify/scripts/validate-done.js'), tpl = S('ac-verify/assets/verification-template.md'), ag = A('ac-verifier.md');
      const m = vd.match(/const NHÃN = \[([^\]]+)\]/); const trongMã = m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [];
      if (trongMã.join(' ') !== v.join(' ')) e.push(`validate-done.js NHÃN = [${trongMã.join(' ')}] ≠ canon [${v.join(' ')}]`);
      for (const l of v) { if (!tpl.includes(l)) e.push(`verification-template.md không nhắc nhãn "${l}"`); if (!ag.includes(l)) e.push(`agents/ac-verifier.md không nhắc nhãn "${l}"`); }
      if (!/## TC ngoài code màn/.test(tpl)) e.push('verification-template.md thiếu mục "## TC ngoài code màn / sai tiền đề"');
      return e;
    },
    // (ex-lint 37) verifier chấm từng vế: template có mục, agent gọi ve.js, validate-done soát mục — thiếu một mắt là PASS "test có chạy"
    'verify.ve.section': (v) => {
      const e = [], tên = v.join(' ').replace(/_/g, ' ');
      if (!new RegExp(`^## ${esc(tên)}`, 'm').test(S('ac-verify/assets/verification-template.md'))) e.push(`verification-template.md thiếu mục "## ${tên}"`);
      if (!/ve\.js/.test(A('ac-verifier.md'))) e.push('agents/ac-verifier.md không gọi ve.js');
      if (!S('ac-verify/scripts/validate-done.js').includes(tên)) e.push(`validate-done.js không soát mục "${tên}"`);
      return e;
    },
    // (ex-lint 41) ô e2e: mỗi ký hiệu có định nghĩa ở conventions.md (dòng "Cột `e2e`") và refresh.js — nơi duy nhất ghi ô — biết ghi
    'e2e.states': (v) => {
      const e = [], dòngE2e = S('ba-toolkit/references/conventions.md').split('\n').find((l) => /^Cột `e2e`/.test(l)) || '', rf = S('ba-track/scripts/refresh.js');
      for (const st of v) {
        if (!dòngE2e.includes(st)) e.push(`conventions.md (dòng "Cột \`e2e\`") không định nghĩa ký hiệu ${st}`);
        if (!rf.includes(st)) e.push(`refresh.js không bao giờ ghi ký hiệu ${st} — nấc khai mà máy không dùng`);
      }
      return e;
    },
    // cột tùy chọn của tracking (05/10/2026): mỗi cột có dòng "Cột `x`" ở conventions.md và refresh.js biết tên nó — refresh
    // không biết thì coi là cột người tự thêm, dời ra trước `Trạng thái` (cột `figma` của figma-sync.js trôi chỗ mỗi lần refresh)
    'tracking.optional.cols': (v) => {
      const e = [], cv = S('ba-toolkit/references/conventions.md'), rf = S('ba-track/scripts/refresh.js');
      for (const c of v) {
        if (!new RegExp(`^Cột \`${esc(c)}\``, 'm').test(cv)) e.push(`conventions.md không có dòng định nghĩa "Cột \`${c}\`"`);
        if (!rf.includes(`'${c}'`)) e.push(`refresh.js không biết cột tùy chọn '${c}' — sẽ coi là cột người tự thêm`);
      }
      return e;
    },
    // ô figma: figma-sync.js là nơi duy nhất ghi ô, conventions.md (dòng "Cột `figma`") định nghĩa ký hiệu
    'figma.states': (v) => {
      const e = [], dòng = S('ba-toolkit/references/conventions.md').split('\n').find((l) => /^Cột `figma`/.test(l)) || '', fs_ = S('ba-figma-draw/scripts/figma-sync.js');
      for (const st of v) {
        if (!dòng.includes(st)) e.push(`conventions.md (dòng "Cột \`figma\`") không định nghĩa ký hiệu ${st}`);
        if (!vắngHợpLệ('ba-figma-draw') && !fs_.includes(`'${st}'`)) e.push(`figma-sync.js không bao giờ ghi ký hiệu ${st} — nấc khai mà máy không dùng`);
      }
      return e;
    },
    'judge.wiring.labels': (v) => {
      const e = [], sw = S('ac-judge/scripts/scan-wiring.js'), sk = S('ac-judge/SKILL.md');
      for (const x of v) {
        if (!sw.includes(`nhãn: '${x}'`)) e.push(`ac-judge/scripts/scan-wiring.js không bao giờ gắn nhãn '${x}'`);
        if (!sk.includes('`' + x + '`')) e.push(`ac-judge/SKILL.md không dạy nhãn \`${x}\``);
      }
      return e;
    },
  };
  let drift = 0, soátĐược = 0;
  for (const [k, fn] of Object.entries(SOÁT)) {
    const v = REG[k];
    if (!v || !v.length) { warn(`registry thiếu ${k} — bỏ qua`); continue; }
    soátĐược++;
    for (const m of fn(v)) { fail(`${m} (canon \`${k}\`)`); drift++; }
  }
  if (!drift && soátĐược) ok(`${soátĐược} khoá canon khớp mọi file dùng (script · SKILL · agent · template)`);
}

// 43. process.exit sau khi ghi stdout: trên macOS stdout qua pipe là bất đồng bộ — `console.log(JSON)` > 64 KB rồi
// `process.exit` cắt JSON, người gọi nhận JSON cụt mà vẫn exit 0 (gặp 3 lần: scan-bypasses 111 hit, ledger-sync
// 724 KB, scan-dup-rules 213 KB trên dự án desktop — docs/decisions/19, 20, 21). Script vừa ghi stdout vừa process.exit phải
// bật stdout đồng bộ (`_handle.setBlocking(true)`) — hoặc dùng `process.exitCode` và thoát tự nhiên.
{
  console.log('\n=== 43. Script ghi stdout + process.exit phải bật stdout đồng bộ (JSON qua pipe không bị cắt) ===');
  let soát = 0; const thiếu = [];
  const đi = (p) => { for (const f of fs.readdirSync(p)) { const q = path.join(p, f); if (fs.statSync(q).isDirectory()) { if (!/node_modules|vendor/.test(f)) đi(q); continue; }
    if (!/\.(js|mjs|cjs)$/.test(f) || f === 'test.js') continue; const t = read(q);
    if (!/process\.exit\(/.test(t) || !/(console\.log|process\.stdout\.write)\(/.test(t)) continue;
    soát++; if (!/setBlocking\(true\)/.test(t)) thiếu.push(path.relative(ROOT, q)); } };
  if (fs.existsSync(SKILLS)) for (const sk of fs.readdirSync(SKILLS)) { const d = path.join(SKILLS, sk, 'scripts'); if (fs.existsSync(d)) đi(d); }
  for (const f of thiếu) fail(`${f}: ghi stdout rồi process.exit mà không bật stdout đồng bộ — thêm dòng setBlocking(true) đầu file hoặc dùng process.exitCode`);
  if (!thiếu.length) ok(`${soát} script ghi stdout + process.exit đều bật stdout đồng bộ`);
}

// 44. Pháp lý phát hành (M1, 07/10/2026 — docs/decisions/32): lõi MIT, bên thứ ba giữ giấy phép gốc. Mã chép vào repo
// (vendor/, clone `upstream:`) mà không kèm notice là vi phạm điều kiện duy nhất của MIT/ISC/BSD/Apache — "giữ nguyên
// thông báo bản quyền" — và không lỗi runtime nào lộ ra. Canon `release.notices` = các file phải có ở gốc repo nguồn.
// gioiHan: chỉ thấy mã bên thứ ba ở dạng có dấu hiệu (thư mục vendor/, *.min.js, frontmatter upstream:); đoạn chép tay
// lẻ (vd path icon SVG) không tự phát hiện — phải ghi tay vào notices. Không đọc nội dung giấy phép, chỉ đếm có/nêu tên.
{
  console.log('\n=== 44. Pháp lý phát hành: LICENSE + THIRD_PARTY_NOTICES · vendor/ có LICENSE · clone upstream: có license ===');
  const cần = REG['release.notices'] || [];
  const marker = (REG['export.srcMarker'] || ['example/docs/00-tracking.md']).join('/');
  if (!cần.length) warn('registry thiếu release.notices — bỏ qua');
  else if (!fs.existsSync(path.join(ROOT, marker))) console.log(`  ✓ không phải repo nguồn (thiếu ${marker}) — notices thuộc repo phát hành`);
  else {
    let drift = 0, nVendor = 0, nClone = 0;
    for (const f of cần) if (!fs.existsSync(path.join(ROOT, f))) { fail(`thiếu ${f} ở gốc repo (release.notices)`); drift++; }
    const notices = read(path.join(ROOT, cần.find((f) => /NOTICE/i.test(f)) || 'THIRD_PARTY_NOTICES.md'));
    const đi = (p) => { for (const e of fs.readdirSync(p, { withFileTypes: true })) { const q = path.join(p, e.name), r = path.relative(ROOT, q);
      if (e.isDirectory() || (e.isSymbolicLink() && fs.statSync(q).isDirectory())) {
        if (e.name === 'node_modules') continue;
        if (e.name === 'vendor') {
          nVendor++; const files = fs.readdirSync(q).filter((x) => !x.startsWith('.'));
          if (!files.some((x) => /^LICEN[CS]E/i.test(x))) { fail(`${r}/: thư mục vendor không có file LICENSE cạnh file vendor`); drift++; }
          for (const x of files.filter((x) => !/^(LICEN[CS]E|NOTICE)/i.test(x))) if (!notices.includes(x)) { fail(`${r}/${x}: file vendor không được nêu tên trong THIRD_PARTY_NOTICES.md`); drift++; }
          continue;
        }
        đi(q); continue;
      }
      if (/\.min\.(js|css|mjs)$/.test(e.name) && !/(^|\/)vendor\//.test(r)) { fail(`${r}: file minified ngoài vendor/ — chuyển vào vendor/ kèm LICENSE + mục notices`); drift++; }
      if (e.name === 'SKILL.md') {
        const fm = (read(q).match(/^---\n([\s\S]*?)\n---/) || [, ''])[1];
        const up = fm.match(/^upstream:\s*([^@\s]+)@([^/\s]+)/m) || [];
        if (!up[1]) continue;
        nClone++; const sk = path.basename(p);
        if (!/^license:.*THIRD_PARTY_NOTICES/m.test(fm)) { fail(`${r}: clone upstream ${up[1]}@${up[2]} thiếu frontmatter "license: … THIRD_PARTY_NOTICES.md"`); drift++; }
        if (!notices.includes(sk) || !notices.includes(up[1]) || !notices.includes(up[2])) { fail(`${r}: THIRD_PARTY_NOTICES.md chưa có mục cho ${sk} (${up[1]}@${up[2]})`); drift++; }
      } } };
    if (fs.existsSync(SKILLS)) đi(SKILLS);
    if (!drift) ok(`${nVendor + nClone} chỗ chép bên thứ ba có notice (${nVendor} thư mục vendor · ${nClone} skill clone) · ${cần.join(' + ')} có ở gốc`);
  }
}
// 44 (tiếp) — RANH GIỚI GÓI (08/10/2026, docs/decisions/32): file của skill công khai (không thuộc `skills.pro`/`skills.devonly`),
// agent công khai (không thuộc `agents.pro`) và `.claude/settings.json` KHÔNG được phụ thuộc CỨNG skill Pro/devonly — repo
// công khai không có chúng, một require/spawn tới đó là crash ở máy người dùng. "Cứng" = trong .js: chuỗi `'<skill>', 'scripts|
// references|assets'` hay `<skill>/scripts|references|assets/` (require/path.join/spawn); trong .md/settings: lệnh
// `node .claude/skills/<skill>/` hay đường dẫn `.claude/skills/<skill>/…`. Ngoại lệ: có `existsSync`/`vắngHợpLệ`/`càiRồi` trong
// ±8 dòng (điều kiện rõ ràng; dòng khai danh sách thì ghi chú `existsSync` ngay dòng đó). Kèm: registry khớp release/manifest.json
// (nhóm pro/devOnly) khi file đó có.
// gioiHan: đọc MẪU, không chạy code — đường dẫn ghép từ biến không thấy; cửa sổ ±8 dòng chỉ chứng minh CÓ điều kiện gần đó,
// không chứng minh điều kiện đúng. test.js miễn (dùng cần() — ca bỏ qua có danh sách mong đợi ở --public). Nhắc tên skill
// trong văn xuôi (`ac-team` làm X) không tính — đó là ranh giới mềm, check 31 lo tên có thật khi skill có mặt.
{
  const pro = REG['skills.pro'] || [], dvo = REG['skills.devonly'] || [];
  if (!pro.length && !dvo.length) warn('registry thiếu skills.pro/skills.devonly — bỏ qua ranh giới gói');
  else {
    const ngoài = [...pro, ...dvo], alt = ngoài.map((x) => x.replace(/-/g, '\\-')).join('|');
    const reJs = new RegExp(`(['"\`])(${alt})\\1\\s*,\\s*['"\`](?:scripts|references|assets)\\b|['"\`/](${alt})/(?:scripts|references|assets)/`);
    const reMd = new RegExp(`\\.claude/skills/(${alt})/`);
    const agentPro = new Set((REG['agents.pro'] || []).map((x) => x.split(':')[0]));
    const gác = /existsSync|vắngHợpLệ|càiRồi/;
    let drift = 0, nFile = 0;
    const soát = (f) => {
      const js = /\.(m?js|cjs)$/.test(f); if (!js && !/\.(md|json)$/.test(f)) return;
      nFile++; const L = read(f).split('\n');
      L.forEach((l, i) => {
        if (js && /^\s*(\/\/|\*|\/\*)/.test(l)) return;
        const m = js ? l.match(reJs) : l.match(reMd); if (!m) return;
        if (gác.test(L.slice(Math.max(0, i - 8), i + 9).join('\n'))) return;
        fail(`${path.relative(ROOT, f)}:${i + 1}: phụ thuộc CỨNG skill ngoài gói công khai \`${m[2] || m[3] || m[1]}\` (skills.pro/devonly) — thêm điều kiện existsSync (vắng → "không áp") hoặc dời file sang skill công khai`); drift++;
      });
    };
    const đi = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const q = path.join(d, e.name); if (e.isDirectory()) { if (!/^(vendor|node_modules)$/.test(e.name)) đi(q); } else if (!(e.name === 'test.js' && /ba-toolkit\/scripts$/.test(d.split(path.sep).join('/')))) soát(q); } };
    for (const sk of fs.readdirSync(SKILLS, { withFileTypes: true }).filter((e) => e.isDirectory() && !ngoài.includes(e.name))) đi(path.join(SKILLS, sk.name));
    for (const a of agents) if (!agentPro.has(a.replace(/\.md$/, ''))) soát(path.join(AGENTS, a));
    if (fs.existsSync(path.join(ROOT, '.claude', 'settings.json'))) soát(path.join(ROOT, '.claude', 'settings.json'));
    const mf = path.join(ROOT, 'release', 'manifest.json');
    if (fs.existsSync(mf)) {
      let M = null; try { M = JSON.parse(read(mf)); } catch { fail('release/manifest.json không phải JSON'); drift++; }
      const nhóm = (k) => (((M || {}).skills || {})[k] || {}).list || [];
      for (const [k, v] of [['pro', pro], ['devOnly', dvo]]) if (M && [...nhóm(k)].sort().join(' ') !== [...v].sort().join(' ')) { fail(`release/manifest.json skills.${k}.list ≠ registry skills.${k.toLowerCase()} (${nhóm(k).join(' ')} ↔ ${v.join(' ')})`); drift++; }
    }
    if (!drift) ok(`ranh giới gói: ${nFile} file công khai không phụ thuộc cứng ${pro.length} skill Pro + ${dvo.length} devonly${fs.existsSync(mf) ? ' · registry khớp release/manifest.json' : ''}`);
  }
}

// 44 (tiếp) — BỘ CÀI (M6, 08/10/2026 — docs/decisions/32): install.js chọn skill theo `profile.core.skills` (mặc định), `profile.dev.skills`
// (+ mọi dev-*, cờ --dev), `profile.mini.skills`; agent đi theo `agents.owner`. Bộ cài lệch là người mới nhận bộ skill gãy (skill lõi gọi
// skill không được cài) hay phình lại (mỗi mô tả nạp mọi phiên). Soát: mini ⊆ core · core ∩ dev = ∅ · không Pro/devonly trong core/dev ·
// mô tả core ≤ 8000 ký tự · mọi agent của roster có chủ · (repo phát triển) core = manifest core.list − bộ dev − dev-*, dev ⊆ công khai.
{
  const core = REG['profile.core.skills'] || [], dev = REG['profile.dev.skills'] || [], mini = REG['profile.mini.skills'] || [];
  if (!core.length) warn('registry thiếu profile.core.skills — install.js không có bộ cài mặc định (bỏ qua soát bộ cài)');
  else {
    let lệch = 0; const lỗi = (m) => { fail('bộ cài: ' + m); lệch++; };
    const sCore = new Set(core), sDev = new Set(dev);
    const ngoàiCore = mini.filter((x) => x !== 'ba-toolkit' && !sCore.has(x)); if (ngoàiCore.length) lỗi(`profile.mini.skills có skill ngoài profile.core.skills: ${ngoàiCore.join(', ')} (mini phải ⊆ core)`);
    const chung = core.filter((x) => sDev.has(x) || x.startsWith('dev-')); if (chung.length) lỗi(`skill vừa ở core vừa thuộc bộ dev: ${chung.join(', ')}`);
    const góiKín = new Set([...(REG['skills.pro'] || []), ...(REG['skills.devonly'] || [])]);
    const kín = [...core, ...dev].filter((x) => góiKín.has(x)); if (kín.length) lỗi(`bộ cài core/dev chứa skill Pro/devonly: ${kín.join(', ')}`);
    const vắng = [...core, ...dev].filter((x) => !fs.existsSync(path.join(SKILLS, x, 'SKILL.md'))); if (vắng.length) lỗi(`bộ cài trỏ tới skill không tồn tại: ${vắng.join(', ')}`);
    const mô = core.reduce((n, x) => { const t = fs.existsSync(path.join(SKILLS, x, 'SKILL.md')) ? read(path.join(SKILLS, x, 'SKILL.md')) : ''; return n + ((t.match(/^description:\s*(.*)$/m) || [, ''])[1].trim().length); }, 0);
    if (mô > 8000) lỗi(`mô tả bộ core ${mô} ký tự > 8000 (M6: cài mặc định phải gọn)`);
    const chủ = new Set((REG['agents.owner'] || []).map((p2) => p2.split(':')[0]));
    const vôChủ = (REG['agents.roster'] || []).map((p2) => p2.split(':')[0]).filter((a) => !chủ.has(a)); if (vôChủ.length) lỗi(`agent trong agents.roster chưa có dòng agents.owner: ${vôChủ.join(', ')}`);
    const mf2 = path.join(ROOT, 'release', 'manifest.json');
    if (fs.existsSync(mf2)) {
      let M2 = null; try { M2 = JSON.parse(read(mf2)); } catch { lỗi('release/manifest.json hỏng JSON'); }
      if (M2) {
        const kỳVọng = new Set(M2.skills.core.list.filter((x) => !sDev.has(x) && !x.startsWith('dev-')));
        const thiếu = [...kỳVọng].filter((x) => !sCore.has(x)), thừa = core.filter((x) => !kỳVọng.has(x));
        if (thiếu.length || thừa.length) lỗi(`profile.core.skills ≠ manifest core.list − bộ dev (thiếu: ${thiếu.join(', ') || '—'} · thừa: ${thừa.join(', ') || '—'})`);
        const công = new Set([...M2.skills.core.list, ...M2.skills.community.list]);
        const devKín = dev.filter((x) => !công.has(x)); if (devKín.length) lỗi(`profile.dev.skills có skill không công khai: ${devKín.join(', ')}`);
      }
    }
    if (!lệch) ok(`bộ cài: core ${core.length} skill (mô tả ${mô} ký tự ≤ 8000) · dev ${dev.length} + dev-* · mini ⊆ core · agent có chủ${fs.existsSync(mf2) ? ' · khớp release/manifest.json' : ''}`);
  }
}

// 45. Ngôn ngữ người dùng (M8, 08/10/2026 — docs/decisions/34): chuỗi IN RA của script LÕI (skill thuộc `profile.core.skills`, cộng
// ba-toolkit — nơi có hook) không được mang từ nội bộ của người bảo trì (`lang.internal.terms`: "oan", "lách", "canon", "gate"…).
// Người mới đọc "checker oan" không hiểu mình phải làm gì; từ lóng chỉ cần một lần lọt là quay lại khắp nơi vì chép từ chỗ cũ.
// Soát: đối số chuỗi của console.log/error/warn + process.stdout/stderr.write · giá trị `systemMessage`/`reason`/`stopReason`
// (hook) · mảng/lời gọi chứa thẻ thông báo hook `[Veriline ·`. `${…}` trong template: chuỗi bên trong cũng tính (nhánh in ra).
// Từ có chữ HOA so khớp phân biệt hoa/thường ("TRẢ" ≠ "trả"); `_` trong registry = khoảng trắng; từ dạng tên file (có `-`/`.`)
// khớp cả khi có đuôi (`conv-registry.md`), từ thường thì `oan.js`/`OAN-3`/`hook-gate.js` là TÊN, không tính.
// gioiHan: không thấy chuỗi dựng ở biến rồi mới in (`const m = 'oan'; console.log(m)`), không đọc SKILL.md; script bảo trì
// (`lang.internal.skip`) bỏ qua. Ngoại lệ `lang.internal.allow` dạng `<skill>/<script>:<từ>` — mục không còn bắn là thừa (lỗi).
{
  console.log('\n=== 45. Ngôn ngữ người dùng: chuỗi in ra của script lõi không mang từ nội bộ ===');
  const từ = (REG['lang.internal.terms'] || []).map((t) => t.replace(/_/g, ' '));
  const core = REG['profile.core.skills'] || [];
  if (!từ.length || !core.length) warn('registry thiếu lang.internal.terms / profile.core.skills — bỏ qua soát ngôn ngữ người dùng');
  else {
    const bỏ = new Set(REG['lang.internal.skip'] || []);
    const miễn = new Map((REG['lang.internal.allow'] || []).map((a) => [a.replace(/_/g, ' '), 0]));
    const thoát = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reTừ = từ.map((t) => [t, new RegExp(`(?<![\\p{L}\\p{N}_.-])${thoát(t)}(?![\\p{L}\\p{N}_${/[-.]/.test(t) ? '' : '-'}]${/[-.]/.test(t) ? '' : '|\\.\\p{L}'})`, /\p{Lu}/u.test(t) ? 'u' : 'iu')]);
    // Quét từ vị trí i tới hết lời gọi/mảng (stopAtComma: tới dấu phẩy/chấm phẩy/xuống dòng ở độ sâu 0) — gom literal chuỗi.
    const gom = (src, i, dừngPhẩy) => {
      const ra = []; let sâu = 0;
      const đọcChuỗi = (q, j) => { let s = ''; while (j < src.length && src[j] !== q) { if (src[j] === '\\') { s += src[j] + (src[j + 1] || ''); j += 2; continue; } if (q !== '`' && src[j] === '\n') break; if (q === '`' && src[j] === '$' && src[j + 1] === '{') { let d = 1; j += 2; s += ' '; while (j < src.length && d) { const c = src[j]; if (c === '{') d++; else if (c === '}') d--; else if (c === "'" || c === '"') { const k = src.indexOf(c, j + 1); s += src.slice(j + 1, k < 0 ? j + 1 : k) + ' '; j = k < 0 ? j : k; } j++; } continue; } s += src[j++]; } return [s, j]; };
      for (; i < src.length; i++) {
        const c = src[i];
        if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; if (dừngPhẩy && sâu === 0) return ra; continue; }
        if (c === '/' && src[i + 1] === '*') { const k = src.indexOf('*/', i + 2); i = k < 0 ? src.length : k + 1; continue; }
        if (c === "'" || c === '"' || c === '`') { const [s, j] = đọcChuỗi(c, i + 1); ra.push({ s, at: i }); i = j; continue; }
        if (c === '/' && /[=(,:!&|?{};]\s*$/.test(src.slice(Math.max(0, i - 20), i))) { let j = i + 1, lớp = false; while (j < src.length && src[j] !== '\n') { if (src[j] === '\\') { j += 2; continue; } if (src[j] === '[') lớp = true; else if (src[j] === ']') lớp = false; else if (src[j] === '/' && !lớp) break; j++; } i = j; continue; }   // regex literal: bỏ
        if ('([{'.includes(c)) sâu++;
        else if (')]}'.includes(c)) { sâu--; if (sâu < 0) return ra; }
        else if (dừngPhẩy && sâu === 0 && (c === ',' || c === ';' || c === '\n')) return ra;
      }
      return ra;
    };
    // Xoá chú thích (giữ nguyên vị trí/xuống dòng) để `// console.log('…')` không bị tính; tôn trọng chuỗi để `'http://'` không mất.
    const bỏChúThích = (src) => {
      let ra = '', q = null;
      for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (q) { ra += c; if (c === '\\') { ra += src[i + 1] || ''; i++; } else if (c === q || (c === '\n' && q !== '`')) q = null; continue; }
        if (c === "'" || c === '"' || c === '`') { q = c; ra += c; continue; }
        if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') { ra += ' '; i++; } ra += src[i] || ''; continue; }
        if (c === '/' && src[i + 1] === '*') { const k = src.indexOf('*/', i + 2); const đ = k < 0 ? src.length : k + 2; ra += src.slice(i, đ).replace(/[^\n]/g, ' '); i = đ - 1; continue; }
        ra += c;
      }
      return ra;
    };
    const trích = (src0) => {
      const src = bỏChúThích(src0);
      const ra = []; let m;
      const re = /(?:console\.(?:log|error|warn)|process\.(?:stdout|stderr)\.write)\s*\(|\b(?:systemMessage|reason|stopReason)\s*:/g;
      while ((m = re.exec(src))) ra.push(...gom(src, m.index + m[0].length, !m[0].endsWith('(')));
      // thẻ hook `[Veriline ·`: lùi về dấu mở gần nhất ([ hoặc () rồi gom cả mảng/lời gọi chứa nó
      const reThẻ = /['"`]\[Veriline ·/g;
      while ((m = reThẻ.exec(src))) { let j = m.index - 1; while (j > 0 && /\s/.test(src[j])) j--; if ('[('.includes(src[j])) ra.push(...gom(src, j + 1, false)); }
      return ra;
    };
    const dòng = (src, at) => src.slice(0, at).split('\n').length;
    let soát = 0, nHit = 0;
    const đi = (d, sk) => { for (const f of fs.readdirSync(d)) { const q = path.join(d, f); if (fs.statSync(q).isDirectory()) { if (!/node_modules|vendor|fixtures/.test(f)) đi(q, sk); continue; }
      if (!/\.(js|mjs|cjs)$/.test(f) || bỏ.has(f)) continue;
      const src = read(q); soát++; const đã = new Set();
      for (const { s, at } of trích(src)) for (const [t, r] of reTừ) {
        if (!r.test(s)) continue;
        const khoá = `${sk}/${path.relative(path.join(SKILLS, sk, 'scripts'), q)}:${t}`.replace(/\.(js|mjs|cjs):/, ':');
        if (miễn.has(khoá)) { miễn.set(khoá, miễn.get(khoá) + 1); continue; }
        const k2 = `${khoá}@${at}`; if (đã.has(k2)) continue; đã.add(k2);
        nHit++; fail(`${path.relative(ROOT, q)}:${dòng(src, at)} — chuỗi in ra có từ nội bộ "${t}": «${s.trim().slice(0, 90)}» — viết lại bằng chữ người dùng (bảng thay: docs/decisions/34) hoặc thêm lang.internal.allow ${khoá}`);
      } } };
    for (const sk of [...new Set([...core, 'ba-toolkit'])]) { const d = path.join(SKILLS, sk, 'scripts'); if (fs.existsSync(d)) đi(d, sk); }
    for (const [k, n] of miễn) if (!n) fail(`lang.internal.allow ${k} không còn bắn — ngoại lệ thừa, xoá khỏi registry`);
    if (!nHit && [...miễn.values()].every(Boolean)) ok(`${soát} script lõi: chuỗi in ra không mang ${từ.length} từ nội bộ${miễn.size ? ` (${miễn.size} ngoại lệ có khai)` : ''}`);
  }
}

// 40 (chạy CUỐI — đếm số mục nên phải để mọi mục khác in xong). MỘT NGUỒN cho mọi con số tự khai (25/09/2026: gộp lint 1
// phần CLAUDE.md và lint 3c header explain vào đây; số ca test.js vẫn ở ca 3ax vì chỉ test.js biết tổng của nó lúc chạy).
// Con số CLAUDE.md tự khai (steal B44): briefing nói "89 skills (68 ba-* + 11 dev-* + 10 ac-*)",
// "N checks", "~80 scripts". Không ai soát thì chúng trôi trong im lặng — thứ agent nạp MỌI phiên
// lại là thứ sai. Số ca của test.js do chính test.js soát (nó mới biết tổng của mình).
{
  console.log('\n=== 40. Con số tự khai (CLAUDE.md · README · header explain · VERSION) khớp thực tế ===');
  const md = read(CLAUDEMD);
  const skillDirs = fs.existsSync(SKILLS) ? fs.readdirSync(SKILLS, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : [];
  const đếm = (pre) => skillDirs.filter((n) => n.startsWith(pre)).length;
  let drift = 0;
  const mSkill = md.match(/(\d+)\s+skills?\s*\((\d+)\s*`ba-\*`\s*\+\s*(\d+)\s*`dev-\*`\s*\+\s*(\d+)\s*`ac-\*`\)/);
  if (!fs.existsSync(CLAUDEMD)) { /* repo công khai: CLAUDE.md là briefing phát triển (devOnly) — không có số tự khai để soát */ }
  else if (!mSkill) { warn('CLAUDE.md không còn câu "N skills (x ba-* + y dev-* + z ac-*)" — bỏ qua phép đếm skill'); }
  else {
    const thật = [skillDirs.length, đếm('ba-'), đếm('dev-'), đếm('ac-')];
    const khai = mSkill.slice(1, 5).map(Number);
    for (const [i, tên] of [[0, 'tổng skill'], [1, 'ba-*'], [2, 'dev-*'], [3, 'ac-*']]) {
      if (khai[i] !== thật[i]) { fail(`CLAUDE.md khai ${khai[i]} ${tên}, thật ${thật[i]}`); drift++; }
    }
    if (khai[1] + khai[2] + khai[3] !== khai[0]) { fail(`CLAUDE.md: ${khai[1]}+${khai[2]}+${khai[3]} ≠ ${khai[0]} skill`); drift++; }
  }
  const mLint = md.match(/lint\.js[^\n]*?#\s*(\d+)\s+structural/);
  // sốMục đã tính cả tiêu đề của chính mục này (in trước khi chạy thân) — không cộng thêm
  if (mLint && Number(mLint[1]) !== sốMục) { fail(`CLAUDE.md khai ${mLint[1]} check của lint.js, thật ${sốMục} mục`); drift++; }
  const mScript = md.match(/~(\d+)\s+zero-dependency Node scripts/);
  if (mScript) {
    let n = 0;
    for (const sk of skillDirs) { const d = path.join(SKILLS, sk, 'scripts'); if (fs.existsSync(d)) n += fs.readdirSync(d).filter((f) => f.endsWith('.js')).length; }
    // "~" = con số tròn, cho lệch 10%; lệch hơn thế là briefing nói sai quy mô
    if (Math.abs(n - Number(mScript[1])) > Math.max(5, n * 0.1)) { fail(`CLAUDE.md khai ~${mScript[1]} script, thật ${n}`); drift++; }
  }
  // (ex-lint 3c, cảnh báo) header "N skill" của mỗi explain/NN-*.md khớp số mục `## ba|dev|ac-…`; header có "+" (mục tuỳ chọn) bỏ qua
  let nExplain = 0;
  for (const f of (fs.existsSync(EXPLAIN) ? fs.readdirSync(EXPLAIN) : []).filter((n) => /^\d\d-.*\.md$/.test(n))) {
    const txt = read(path.join(EXPLAIN, f)), h1 = (txt.match(/^#\s+.*$/m) || [''])[0], num = h1.match(/(\d+)\s*skill/i);
    if (!num) continue;
    nExplain++;
    const sections = (txt.match(/^## (ba|dev|ac)-[a-z0-9-]+/gm) || []).length;
    if (+num[1] !== sections && !h1.includes('+')) { warn(`explain/${f}: header ghi "${num[1]} skill" nhưng có ${sections} mục ## — cập nhật số hoặc thêm ghi chú "(+ …)"`); drift++; }
  }
  // (M4, 08/10/2026 — docs/decisions/32) README viết tay: số skill CHỈ được nằm trong câu chuẩn "N skill (x `ba-*` + y `dev-*` + z `ac-*`)"
  // (soát như CLAUDE.md); mọi "N skill" khác ngoài mục lịch sử `## Đổi gì trong …` là số chép tay sẽ trôi (README từng ghi 76 khi đã 90,
  // "28 skill thay vì 76", "56 skill" — mỗi con số là đầu ra của install.js, không phải của README). File có dấu `<!-- so-sinh: … -->`
  // (README công khai do export-public.js điền chỗ giữ) bỏ qua — số của nó do máy điền.
  const SKILL_CÂU = /(\d+)\s+skills?\s*\((\d+)\s*`ba-\*`\s*\+\s*(\d+)\s*`dev-\*`\s*\+\s*(\d+)\s*`ac-\*`\)/g;
  let nReadme = 0;
  for (const rel of ['README.md', 'BA-TOOLKIT-README.md']) {
    const f = path.join(ROOT, rel);
    if (!fs.existsSync(f)) continue;
    const txt = read(f);
    if (/<!--\s*so-sinh:/.test(txt)) continue;
    nReadme++;
    const thật = [skillDirs.length, đếm('ba-'), đếm('dev-'), đếm('ac-')];
    let lịchSử = false;
    txt.split('\n').forEach((dòng, i) => {
      if (/^## /.test(dòng)) lịchSử = /^## Đổi gì trong/.test(dòng);
      if (lịchSử) return;
      for (const m of dòng.matchAll(SKILL_CÂU)) {
        const khai = m.slice(1, 5).map(Number);
        if (khai.some((v, k) => v !== thật[k])) { fail(`${rel}:${i + 1} khai ${khai[0]} skill (${khai[1]}+${khai[2]}+${khai[3]}), thật ${thật[0]} (${thật[1]}+${thật[2]}+${thật[3]})`); drift++; }
      }
      for (const m of dòng.replace(SKILL_CÂU, '').matchAll(/\b(\d+)\s+skills?\b/g)) {
        fail(`${rel}:${i + 1} số skill viết tay "${m[0]}" ngoài câu chuẩn — bỏ số (install.js tự in) hoặc dùng câu "N skill (x \`ba-*\` + y \`dev-*\` + z \`ac-*\`)"`); drift++;
      }
    });
  }
  // Phiên bản (M4): một nguồn là file VERSION ở gốc — semver, và CHANGELOG.md phải có mục `## [<phiên bản>]`. Repo không có
  // VERSION lẫn release/manifest.json (repo giả của test.js, dự án đích) → không có gì để soát.
  let verNote = '';
  const fVer = path.join(ROOT, 'VERSION');
  if (fs.existsSync(fVer) || fs.existsSync(path.join(ROOT, 'release', 'manifest.json'))) {
    const ver = fs.existsSync(fVer) ? read(fVer).trim() : '';
    if (!ver) { fail('thiếu file VERSION (một nguồn phiên bản, M4)'); drift++; }
    else if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(ver)) { fail(`VERSION "${ver}" không phải semver`); drift++; }
    else {
      const cl = fs.existsSync(path.join(ROOT, 'CHANGELOG.md')) ? read(path.join(ROOT, 'CHANGELOG.md')) : '';
      const esc = ver.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`^## \\[${esc}\\]`, 'm').test(cl)) { fail(`CHANGELOG.md thiếu mục "## [${ver}]" cho phiên bản trong VERSION`); drift++; }
      else verNote = ` · phiên bản ${ver} có CHANGELOG`;
    }
    // Plugin cửa cài (M5): .claude-plugin/plugin.json mang `version` = VERSION (một nguồn — không đặt cả ở mục marketplace),
    // marketplace.json đủ trường bắt buộc (name · owner.name · plugins[] có name + source). Không có thư mục → không áp.
    const PL = path.join(ROOT, '.claude-plugin');
    if (fs.existsSync(PL)) {
      const j = (f) => { try { return JSON.parse(read(path.join(PL, f))); } catch (e) { fail(`.claude-plugin/${f} không đọc được JSON: ${String(e.message).slice(0, 80)}`); drift++; return null; } };
      const pj = j('plugin.json'), mj = j('marketplace.json');
      if (pj) {
        if (!pj.name) { fail('.claude-plugin/plugin.json thiếu `name`'); drift++; }
        if (ver && pj.version !== ver) { fail(`.claude-plugin/plugin.json version "${pj.version}" ≠ VERSION "${ver}" — sửa plugin.json khi nâng bản`); drift++; }
      }
      if (mj) {
        if (!mj.name || !(mj.owner && mj.owner.name) || !Array.isArray(mj.plugins) || !mj.plugins.length) { fail('.claude-plugin/marketplace.json thiếu name / owner.name / plugins[]'); drift++; }
        for (const p of mj.plugins || []) {
          if (!p.name || !p.source) { fail(`marketplace.json: mục plugin thiếu name/source (${JSON.stringify(p).slice(0, 60)})`); drift++; }
          if (p.version) { fail(`marketplace.json: mục "${p.name}" đặt version — phiên bản chỉ ở plugin.json (một nguồn)`); drift++; }
        }
      }
      if (pj && mj && !drift) verNote += ` · plugin ${pj.name}@${mj.name} ${pj.version}`;
    }
  }
  if (!drift) ok(`Số tự khai khớp: ${skillDirs.length} skill (${đếm('ba-')}+${đếm('dev-')}+${đếm('ac-')}) · ${sốMục} check lint · header ${nExplain} file explain · ${nReadme} README${verNote}`);
}

console.log(`\n=== KẾT QUẢ: ${errors} lỗi · ${warns} cảnh báo ===`);
process.exit(errors);
