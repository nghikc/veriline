#!/usr/bin/env node
/*
 * ba-conformance/scan-code.js — đối chiếu CƠ GIỚI giữa tài liệu BA và code thật.
 * Zero-dependency, CommonJS. In JSON ra stdout (thêm --plain để đọc bằng mắt).
 *
 *   node .claude/skills/ba-conformance/scripts/scan-code.js [docsDir=docs] [--root <thư-mục-code>] [--plain]
 *
 * VÌ SAO CÓ SCRIPT NÀY: trong ba hướng lệch mà `ba-conformance` phải trả lời, hướng
 * "CHƯA LÀM" là **đếm được**, không cần phán đoán — `plan.md` đã khai sẵn file nào phải
 * tạo, TC nào phải pass, bước nào đã tick. Để LLM tự đọc từng plan rồi đếm là vừa đắt
 * vừa sót. Script lo phần đếm; LLM chỉ đọc code cho hướng "LỆCH" và "CÓ CODE KHÔNG CÓ
 * TÀI LIỆU" — đúng cách `scan.js`/`refresh.js`/`status.js` đang chia việc.
 *
 * KHÔNG phán xét gì. Không biết "lệch" là gì. Chỉ trả sự thật đếm được:
 *   - plan.md khai file nào → file đó có trên đĩa không
 *   - plan.md có bao nhiêu bước, đã tick bao nhiêu
 *   - test.md có bao nhiêu TC, trạng thái ra sao
 *   - TC nào trong test.md KHÔNG được plan nào trace tới (dev không biết phải làm)
 *   - file code nào KHÔNG plan nào khai (ứng viên "code không có tài liệu")
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i !== -1 && args[i + 1] ? args[i + 1] : d; };
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--root'));

const DOCS = path.resolve(positional[0] || 'docs');
const ROOT = path.resolve(opt('--root', '.'));
const PLAIN = flag('--plain');

if (!fs.existsSync(DOCS)) { console.error(`Không thấy thư mục tài liệu: ${DOCS}`); process.exit(2); }

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
// Đường dẫn tương đối so với GỐC DỰ ÁN TÀI LIỆU (cha của docsDir) — khác `rel()` vốn tính theo
// --root (gốc CODE). Hai gốc này có thể khác nhau (code ở repo khác); cột `dev` trong
// 00-tracking.md ghi kiểu `docs/Screen-spec/...` nên phải tra bằng khoá này, không thì
// mọi màn đều trả `dev: null` khi chạy với --root trỏ nơi khác.
const DOCS_PARENT = path.dirname(DOCS);
const relDocs = (p) => path.relative(DOCS_PARENT, p).split(path.sep).join('/');

/* ─── 1. Tìm mọi folder màn có plan.md ────────────────────────────────────────
 * Không giả định `Screen-spec/` tồn tại: dự án cài trước khi có container đó để
 * folder màn thẳng dưới docs/ (xem CLAUDE.md → Doc layout). Cứ đi tìm plan.md. */
function findPlans(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['userguide', 'releases', 'meetings', 'node_modules'].includes(e.name)) continue;
      findPlans(p, out);
    } else if (e.name === 'plan.md') out.push(p);
  }
  return out;
}

/* ─── 2. Parse plan.md ────────────────────────────────────────────────────────
 * Format do `ba-build` sinh (xem ba-build/SKILL.md + example):
 *   ## Task N: <tiêu đề>
 *   **Trace test:** TC-S02-01, TC-S02-02
 *   **Files:**
 *   - Create: `src/api/tasks/list.ts`
 *   - Modify: `src/app.ts`
 *   - Test:   `src/api/tasks/__tests__/list.test.ts`
 *   - [ ] Step 1: …            ← chưa làm · - [x] = đã làm
 * Nhãn Create/Modify/Test giữ nguyên vì nó cho biết KỲ VỌNG khác nhau:
 * Create thiếu = chưa làm; Modify thiếu = file gốc biến mất (nặng hơn). */
function parsePlan(txt) {
  const tasks = [];
  let cur = null;
  for (const line of txt.split('\n')) {
    // Nhận cả hình plan viết tay của dự án thật (e-learning 11 plan: `### ✅ T1. Tiêu đề` + `**Trace:** TC-…` giữa dòng DoD) —
    // bản cũ chỉ nhận `## Task N:` ⇒ 0 task, 254 TC "không task trace" giả (25/09/2026).
    const h = line.match(/^#{2,3}\s+(?:[✅⬜🔨⚠️\uFE0F]+\s*)?(Task\s+|T(?=\d))([A-Za-z]?\d+[a-z]?)\s*[:.—–-]\s*(.*)$/iu);
    // Mã TC ghi ngay trên tiêu đề (dự án desktop `### T1 — Panel (trace …, TC-S09-34..38)`) cũng là trace.
    // `T1` giữ nguyên tên (không đổi thành `Task 1`): plan dự án e-learning có cả `### T1` (vòng CR) lẫn `## Task 1:` — trùng id là trộn trace.
    if (h) { cur = { id: /^task/i.test(h[1]) ? `Task ${h[2]}` : `T${h[2]}`, title: h[3].trim(), files: [], moTaKhongPhaiDuongDan: [], tests: h[3].match(/\bTC-[A-Za-z0-9]+-[A-Z]?\d+\b/g) || [], steps: { total: 0, done: 0 } }; tasks.push(cur); continue; }
    if (!cur) continue;
    const tr = line.match(/\*\*Trace(?: test)?:\*\*\s*(.+)$/i);
    if (tr) { cur.tests.push(...(tr[1].match(/\b[A-Z]{2,4}-[A-Za-z0-9]+-[A-Z]?\d+\b/g) || [])); continue; } // `TC-S28-C1` (mã TC theo vòng CR)
    const f = line.match(/^-\s*(Create|Modify|Test|Update|Delete)\s*:\s*(.+?)\s*$/i);
    if (f) {
      const kind = f[1].toLowerCase();
      const val = f[2].trim();
      // Không có `/` thì đuôi phải là đuôi file thật: `os.environ.get` là định danh, không phải file (W2 07/10/2026).
      const laDuongDan = (v) => !/\s/.test(v) && (v.includes('/') || (/\.([A-Za-z0-9]{1,5})$/.test(v) && DUOI_FILE.has(v.split('.').pop().toLowerCase())));
      // Một dòng có thể khai NHIỀU file: "- Create: `a.tsx`, `b.tsx`". Lấy mọi token trong
      // backtick trước; hết backtick mới xét cả dòng như một đường dẫn trần.
      // Token trong ngoặc tròn là CHÚ THÍCH của file đứng trước (`a.css` (chỉ token `theme.css`)):
      // tên trần trong ngoặc không phải file khai (W2 07/10/2026).
      const quoted = [];
      { let sau = 0, trong = false, buf = '';
        for (const ch of val) {
          if (ch === '`') { if (trong && buf.trim()) quoted.push({ t: buf.trim(), ngoac: sau > 0 }); trong = !trong; buf = ''; continue; }
          if (trong) { buf += ch; continue; }
          if (ch === '(') sau++; else if (ch === ')' && sau > 0) sau--;
        } }
      const cands = quoted.length ? quoted : [{ t: val, ngoac: false }];
      const coDuongDan = cands.some(x => laDuongDan(x.t));
      const duoi = (v) => (v.match(/\.([A-Za-z0-9]{1,5})$/) || [])[1];
      const thuMuc = [];                                        // thư mục của các FILE tương đối đã khai trên dòng, mới nhất trước
      for (const { t: c, ngoac } of cands) {
        // Ô "Files" đôi khi bị viết thành VĂN XUÔI ("các component ở Task 5–8"). Nuốt nó
        // thành path sẽ đẻ ra "gốc code" rác + một file-thiếu giả. Tách riêng để LLM đọc —
        // đây là lỗi chất lượng của chính plan.md, đáng báo chứ không đáng giấu.
        // Nhưng dòng ĐÃ khai được ≥1 đường dẫn thì token còn lại là chú thích định danh
        // (`src/x.py` (`_resolve`)) — không báo văn xuôi (W2 07/10/2026).
        if (laDuongDan(c) && !(ngoac && !c.includes('/'))) {
          let p = c;
          if (c.includes('/')) { if (!/^[\/~]/.test(c) && duoi(c)) thuMuc.unshift({ dir: path.posix.dirname(c), duoi: duoi(c) }); }
          else {
            // Tên trần sau một đường dẫn cùng dòng = cùng thư mục: "`src/b/a.py`, `b.py`" (W2 07/10/2026).
            // Chỉ đường dẫn trước là FILE tương đối cùng đuôi (không URL `/api/x`, không `~/…`); có nhiều
            // thư mục ứng viên thì lấy cái có file trên đĩa, không có thì thư mục gần nhất.
            const ung = thuMuc.filter(d => d.duoi === duoi(c)).map(d => `${d.dir}/${c}`);
            if (ung.length) p = ung.find(u => fs.existsSync(path.resolve(ROOT, u))) || ung[0];
          }
          cur.files.push({ kind, path: p });
        } else if (!coDuongDan) cur.moTaKhongPhaiDuongDan.push({ kind, text: c });
      }
      continue;
    }
    // `- [x] **Step 1: …**` (in đậm) cũng là bước — bản cũ ra 'bước 0/0' dù 74 bước đã tick (W2 OAN-8 07/10/2026).
    const s = line.match(/^-\s*\[( |x|X)\]\s*(?:\*\*|__)?Step\b/);
    if (s) { cur.steps.total++; if (s[1].toLowerCase() === 'x') cur.steps.done++; }
  }
  return tasks;
}

/* ─── 3. Parse test.md: đếm TC theo cột "Trạng thái" ────────────────────────── */
// Chỉ đếm dòng thuộc BẢNG TC: header có cột mã + cột bước/mong đợi/trạng thái/kết quả. Mỗi header bảng mới (dòng
// ngay trên `|---|`) đặt lại phạm vi — bản cũ giữ iId của bảng TC trước nên bảng "Đối chiếu độ
// phủ" (`GWT-01…20`, `CL-S08-01…78`) bị đếm như TC (W2 OAN-7), và bảng phụ "Mã | Priority |
// Mệnh đề còn hụt" đứng trước bảng TC chính bị đếm thành '(không có cột)=7' (W2 OAN-6 07/10/2026).
const SEP_ROW = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const COT_TC = /bước|mong đợi|kỳ vọng|expected|steps|^trạng thái|^kết quả$/i;
const boDam = (x) => x.replace(/\*\*|__|`/g, '').trim();
function parseTests(txt) {
  const out = { total: 0, byStatus: {}, ids: [] };
  const lines = txt.split('\n').filter(l => l.trim().startsWith('|'));
  let iStatus = -1, iId = -1;
  for (let k = 0; k < lines.length; k++) {
    const l = lines[k];
    if (SEP_ROW.test(l.trim())) continue;
    const c = l.split('|').slice(1, -1).map(x => boDam(x));
    // (từ dự án desktop 17/09) test.md thật dùng header `Mã` (một số bảng `Mã TC`/`ID`); trạng thái ở
    // cột `Trạng thái`, không có thì lấy `Kết quả` — cùng lối vá của scan-eval.js.
    if (lines[k + 1] && SEP_ROW.test(lines[k + 1].trim())) {             // header của một bảng mới
      const id = c.findIndex(x => /^(Mã TC|Mã|ID)$/i.test(x));
      iId = (id >= 0 && c.some(x => COT_TC.test(x))) ? id : -1;
      iStatus = c.findIndex(x => /^Trạng thái$/i.test(x));
      if (iStatus < 0) iStatus = c.findIndex(x => /^Kết quả$/i.test(x));
      continue;
    }
    if (iId < 0 || !/^[A-Z]{2,3}-/.test(c[iId] || '')) continue;
    // Ô mã có thể kèm chú thích (`TC-S58-24 *(CR-167)*`) — lấy đúng mã, không thì trace với plan lệch giả (W2 07/10/2026).
    const ma = (c[iId].match(/^[A-Z]{2,4}-[A-Za-z0-9]+-[A-Z]?\d+[a-z]?/) || [c[iId]])[0];
    out.total++; out.ids.push(ma);
    const st = (iStatus >= 0 && c[iStatus]) ? c[iStatus] : '(không có cột)';
    out.byStatus[st] = (out.byStatus[st] || 0) + 1;
  }
  return out;
}

/* ─── 4. Cột `dev` trong 00-tracking.md (dev-run sở hữu) ────────────────────── */
function devColumns() {
  const txt = read(path.join(DOCS, '00-tracking.md'));
  const map = {};
  const lines = txt.split('\n').filter(l => l.trim().startsWith('|'));
  if (!lines.length) return map;
  const cells = (l) => l.split('|').slice(1, -1).map(c => c.trim());
  const head = cells(lines[0]);
  const iDev = head.findIndex(h => /^dev$/i.test(h));
  const iFolder = head.findIndex(h => /^folder$/i.test(h));
  if (iDev < 0 || iFolder < 0) return map;
  for (const l of lines.slice(2)) {
    const c = cells(l);
    if (c.length <= Math.max(iDev, iFolder)) continue;
    const folder = (c[iFolder] || '').replace(/`/g, '').replace(/\/+$/, '');
    if (folder) map[folder] = c[iDev];
  }
  return map;
}

/* ─── 5. Quét file code thật (để tìm cái không plan nào khai) ────────────────
 * Gốc quét SUY RA TỪ CHÍNH PLAN (thư mục cấp 1 của các file được khai, vd `src`),
 * không hardcode: mỗi dự án một cấu trúc. Không plan nào khai file → bỏ qua bước
 * này thay vì đoán bừa cả repo. */
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte', '.py', '.go', '.java', '.rb', '.php', '.cs', '.kt', '.swift', '.rs']);
// Đuôi file nhận khi token KHÔNG có `/` (tên trần) — ngoài nó là định danh mã (`os.environ.get`).
const DUOI_FILE = new Set([...[...CODE_EXT].map(e => e.slice(1)), "md", "json", "html", "htm", "css", "scss", "sass", "less", "yml", "yaml", "toml", "txt", "sql", "sh", "env", "lock", "cfg", "ini", "xml", "svg", "png", "jpg", "dbml", "http", "csv", "prisma", "graphql", "gql", "conf", "spec", "test"]);
const SKIP_DIR = new Set(['node_modules', 'dist', 'build', 'out', '.next', '.git', 'coverage', 'vendor', '.venv', '__pycache__', 'prototype', '.claude']);
function walkCode(dir, out = []) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (SKIP_DIR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkCode(p, out);
    else if (CODE_EXT.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

/* ─── Chạy ─────────────────────────────────────────────────────────────────── */
const devMap = devColumns();
const screens = [];
const claimed = new Set();
const roots = new Set();

for (const planPath of findPlans(DOCS)) {
  const folder = path.dirname(planPath);
  const folderRel = relDocs(folder);
  const base = path.basename(folder);
  const m = base.match(/^([A-Za-z]+\d+)\s*-\s*(.+)$/);
  const tasks = parsePlan(read(planPath));
  const tests = parseTests(read(path.join(folder, 'test.md')));

  const expected = [], missing = [], present = [];
  for (const t of tasks) for (const f of t.files) {
    expected.push(f);
    const abs = path.resolve(ROOT, f.path);
    claimed.add(path.normalize(abs));
    const top = f.path.split('/')[0];
    if (top && !top.includes('.')) roots.add(top);
    (fs.existsSync(abs) ? present : missing).push(f);
  }

  const tcInPlan = new Set(tasks.flatMap(t => t.tests));
  const taskThieuTrace = tasks.filter(t => !t.tests.length).map(t => t.id);
  const moTaKhongPhaiDuongDan = tasks.flatMap(t => t.moTaKhongPhaiDuongDan.map(x => ({ task: t.id, ...x })));
  screens.push({
    code: m ? m[1] : null,
    name: m ? m[2] : base,
    folder: folderRel,
    dev: devMap[folderRel] !== undefined ? devMap[folderRel] : null,
    plan: {
      tasks: tasks.length,
      steps: tasks.reduce((a, t) => ({ total: a.total + t.steps.total, done: a.done + t.steps.done }), { total: 0, done: 0 }),
    },
    files: {
      expected: expected.length,
      present: present.map(f => f.path),
      missing: missing.map(f => ({ path: f.path, kind: f.kind })),
    },
    tests: { total: tests.total, byStatus: tests.byStatus },
    // TC có trong test.md nhưng KHÔNG task nào trace tới → dev không có đường biết phải làm
    tcKhongCoTrongPlan: tests.ids.filter(id => !tcInPlan.has(id)),
    // TC plan trace tới nhưng test.md không có → plan trỏ vào TC ma
    tcPlanTroSai: [...tcInPlan].filter(id => !tests.ids.includes(id)),
    // Task không khai Trace test → dev không biết task này phục vụ TC nào (lỗi của plan.md)
    taskThieuTrace,
    moTaKhongPhaiDuongDan,
  });
}

let orphan = [];
if (roots.size) {
  for (const r of roots) {
    for (const f of walkCode(path.resolve(ROOT, r))) {
      if (!claimed.has(path.normalize(f))) orphan.push(rel(f));
    }
  }
  orphan.sort();
}

const result = {
  docsDir: rel(DOCS), root: ROOT,
  codeRootsSuyRa: [...roots],
  screens,
  // ứng viên "đã dev nhưng không mô tả trong tài liệu" — MỚI LÀ ỨNG VIÊN, không phải kết luận:
  // file hạ tầng/tiện ích thường không nằm trong plan nào mà vẫn hợp lệ. LLM lọc tiếp.
  codeKhongCoTrongPlan: orphan,
  summary: {
    soMan: screens.length,
    fileKhai: screens.reduce((a, s) => a + s.files.expected, 0),
    fileThieu: screens.reduce((a, s) => a + s.files.missing.length, 0),
    buoc: screens.reduce((a, s) => ({ total: a.total + s.plan.steps.total, done: a.done + s.plan.steps.done }), { total: 0, done: 0 }),
    tc: screens.reduce((a, s) => a + s.tests.total, 0),
    codeKhongCoTrongPlan: orphan.length,
  },
};

if (!PLAIN) { console.log(JSON.stringify(result, null, 2)); process.exit(0); }

console.log(`Tài liệu: ${result.docsDir}  ·  Gốc code: ${result.root}`);
console.log(`Gốc code suy ra từ plan: ${result.codeRootsSuyRa.join(', ') || '(không plan nào khai file)'}\n`);
for (const s of screens) {
  console.log(`${s.code || '?'} ${s.name}  [dev: ${s.dev || '—'}]`);
  console.log(`   plan: ${s.plan.tasks} task · bước ${s.plan.steps.done}/${s.plan.steps.total} · file khai ${s.files.expected}, THIẾU ${s.files.missing.length}`);
  for (const f of s.files.missing) console.log(`      ✗ ${f.kind}: ${f.path}`);
  const st = Object.entries(s.tests.byStatus).map(([k, v]) => `${k}=${v}`).join(' · ');
  console.log(`   test: ${s.tests.total} TC  ${st ? '(' + st + ')' : ''}`);
  if (s.taskThieuTrace.length) console.log(`   ⚠️  ${s.taskThieuTrace.length}/${s.plan.tasks} task KHÔNG khai "Trace test": ${s.taskThieuTrace.join(', ')}`);
  if (s.tcKhongCoTrongPlan.length) console.log(`   ⚠️  ${s.tcKhongCoTrongPlan.length} TC không task nào trace tới: ${s.tcKhongCoTrongPlan.slice(0, 8).join(', ')}${s.tcKhongCoTrongPlan.length > 8 ? '…' : ''}`);
  if (s.tcPlanTroSai.length) console.log(`   ⚠️  plan trace tới TC không có trong test.md: ${s.tcPlanTroSai.join(', ')}`);
  for (const x of s.moTaKhongPhaiDuongDan) console.log(`   ⚠️  ${x.task} khai "${x.kind}" bằng văn xuôi, không phải đường dẫn: "${x.text}"`);
}
console.log(`\nFile code không plan nào khai: ${orphan.length}`);
for (const f of orphan.slice(0, 30)) console.log(`   ? ${f}`);
if (orphan.length > 30) console.log(`   … và ${orphan.length - 30} file nữa`);
console.log(`\nTổng: ${result.summary.soMan} màn · ${result.summary.fileThieu}/${result.summary.fileKhai} file khai bị thiếu · bước ${result.summary.buoc.done}/${result.summary.buoc.total} · ${result.summary.tc} TC`);
