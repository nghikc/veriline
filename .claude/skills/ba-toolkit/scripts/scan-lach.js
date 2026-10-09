#!/usr/bin/env node
/*
 * ba-toolkit/scan-lach.js — DÒ DẤU VẾT LÁCH CHECKER trong một diff git. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ba-toolkit/scripts/scan-lach.js [docs] [--plain|--json]                 # thay đổi chưa commit (git diff HEAD + file chưa track)
 *   node .claude/skills/ba-toolkit/scripts/scan-lach.js --range <base>..HEAD [docs] [--json]     # một khoảng commit
 *   node .claude/skills/ba-toolkit/scripts/scan-lach.js --diff <file.diff> [docs] [--json]       # diff unified có sẵn (fixture, PR)
 *   node .claude/skills/ba-toolkit/scripts/scan-lach.js --rules                                  # danh sách luật (rule-cover)
 * Chạy ở GỐC dự án. `docs` (mặc định `docs`) = thư mục tài liệu, tính tương đối gốc repo.
 *
 * Luật (chỉ xét dòng THÊM của diff):
 *   LACH-HEX      ❌ hex màu MẤT `#` trong tài liệu .md: giá trị 6 hex trần (có cả số lẫn chữ a–f, một kiểu hoa/thường)
 *                    ở `07-design-system*.md`, hoặc ở .md khác khi CÙNG hunk vừa bỏ `#<giá trị đó>`. Ở .md khác, dòng
 *                    nói màu/token (`màu`, `color`, `--x:`) mà không có cặp bỏ → ⚠️.
 *   LACH-ENTITY   ❌ entity HTML thay một ký tự in được (`&#8594;` cho →, `&#35;` cho #, `&rarr;`…) trong html tay viết
 *                    (`html-design.html`, `wireframe*.html`, `prototype*.html`) hoặc .md của docs. Miễn: `& < > " ' \``,
 *                    khoảng trắng/vô hình (nbsp, zero-width…), và trong .md: `| * _ [ ] \`` + entity nằm trong `code` (trích, không render).
 *   LACH-COPY     ❌ file MỚI (không có trong manifest toolkit; ở repo nguồn: ngoài `.claude/skills/`) là bản sao script toolkit:
 *                    dòng đầu chú thích (`<skill>/<script> —`) trùng, hoặc ≥60% dòng trùng (≥15 dòng), hoặc cùng tên + ≥30% dòng trùng.
 *   LACH-TOOLKIT  ❌ diff chạm `.claude/skills/**`, `.claude/settings*.json` mà file còn LỆCH NGUỒN theo `integrity.js` (sửa/thêm/xoá
 *                    skill, khối hook thiếu/disableAllHooks) · `ba-hooks.json` khác mặc định · `ba-toolkit-local.json` bị sửa (ngoại
 *                    lệ là việc của người duyệt). Repo nguồn → tắt. integrity không kiểm được → "Chưa kiểm", không đoán (hook-review 07/10/2026).
 *   LACH-SUPPRESS ⚠️ (a) một hunk docs có >5 dòng chỉ khác dòng bị bỏ ở chỗ THÊM `data-*` / chú thích (`/* … *\/`, `<!-- -->`);
 *                    (b) câu tự thú ngoài trích dẫn (`code`, "…"): "để checker không/khỏi/im …", "to silence/bypass the checker".
 * Đầu ra: danh sách P (`plist.js`), `Đã kiểm / Chưa kiểm` luôn in, dòng "Báo oan" khi có mục. Exit = số NHÓM ❌ (≤255) ·
 * 2 = không lấy được diff. Opt-in rule-cover (`--rules` + BA_RULE_LOG).
 *
 * VÌ SAO CÓ (docs/decisions/22 + 24, dự án TTS 05/10/2026, commit f3cdba9): checker oan lộ ra qua CÁCH AGENT LÁCH —
 * ghi hex không kèm `#` vào 07 §13 "để checker không coi là màu đã duyệt" (né DS-HEX), viết `bước 1&#8594;2` trong
 * wireframe (né cảnh báo emoji của check-wireframe), chép capture.mjs ra scratchpad để đổi networkidle. Lối đúng là
 * `oan.js add`; script này để lối sai để lại dấu, và đọc CÁCH agent làm thay vì chỉ tin kết quả xanh.
 *
 * gioiHan: HEURISTIC, đếm chứ không phán ý đồ. LACH-HEX không phân biệt hex màu với mã 6 ký tự hex tình cờ (mã băm
 * ngắn, mã đơn) — chỉ giảm nhiễu bằng điều kiện số+chữ, một kiểu hoa/thường, phạm vi 07/cặp bỏ. LACH-ENTITY bỏ qua html
 * do script sinh (portal, sitemap, releases, userguide — generator được phép escape). LACH-COPY chỉ thấy file MỚI
 * TRONG diff/cây git: bản sao ở scratchpad hay /tmp (ngoài repo) KHÔNG thấy — đó là kiểu lách thứ ba ở dự án TTS;
 * nó chỉ để dấu khi được commit hoặc nằm trong repo chưa track. Bản sao viết lại >40% dòng thì lọt. LACH-SUPPRESS (a)
 * so dòng trong cùng hunk (diff tách hunk khác thì lọt), (b) theo cụm từ cố định Việt/Anh — luôn ⚠️, không chặn.
 * Không đọc lịch sử trước khoảng `--range`; không biết lách đã được người duyệt (khi đó báo oan rồi `oan.js resolve`).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ (lint 43)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const plist = require(path.join(__dirname, 'plist.js'));
const RC = require(path.join(__dirname, 'rule-cover.js'));

const LUẬT = [
  ['LACH-HEX', 'hex màu mất `#` trong tài liệu (07, hoặc cùng hunk vừa bỏ `#<giá trị>`) — ⚠️ ở .md khác nói màu'],
  ['LACH-ENTITY', 'entity HTML thay một ký tự in được trong html tay viết / .md của docs'],
  ['LACH-COPY', 'file mới ngoài .claude/skills là bản sao script toolkit'],
  ['LACH-SUPPRESS', '⚠️ hunk docs thêm hàng loạt data-*/chú thích không đổi nội dung, hoặc câu tự thú "để checker không …"'],
  ['LACH-TOOLKIT', 'diff chạm .claude/skills/**, settings*.json, ba-hooks.json, ba-toolkit-local.json mà lệch nguồn (integrity.js)'],
];
const argv = process.argv.slice(2);
RC.inLuật(argv, LUẬT);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
const JSON_OUT = argv.includes('--json');
const RANGE = opt('--range');
const DIFF = opt('--diff');
const VỊ_TRÍ = argv.filter((a, i) => !a.startsWith('--') && !['--range', '--diff'].includes(argv[i - 1]));
const git = (args) => spawnSync('git', args, { encoding: 'utf8', maxBuffer: 1e9 });

// ── lấy diff ──────────────────────────────────────────────────────────────
let gốcRepo = process.cwd();
let văn = '';
let nguồn = '';
if (DIFF) {
  try { văn = fs.readFileSync(DIFF, 'utf8'); } catch { console.error(`scan-lach: không đọc được ${DIFF}\nSửa: kiểm lại đường dẫn file diff sau --diff.`); process.exit(2); }
  nguồn = `diff ${DIFF}`;
} else {
  const top = git(['rev-parse', '--show-toplevel']);
  if (top.status !== 0) { console.error('scan-lach: không phải repo git.\nSửa: chạy trong repo git, hoặc truyền sẵn bản diff: --diff <file>.'); process.exit(2); }
  gốcRepo = top.stdout.trim();
  const r = git(['diff', '--no-color', '--no-renames', '--no-ext-diff', '-U3', RANGE || 'HEAD']);
  if (r.status !== 0) { console.error(`scan-lach: git diff ${RANGE || 'HEAD'} lỗi: ${(r.stderr || '').trim().slice(0, 200)}`); process.exit(2); }
  văn = r.stdout;
  nguồn = RANGE ? `khoảng ${RANGE}` : 'thay đổi chưa commit (git diff HEAD)';
  if (!RANGE) {                                                       // file chưa track = file mới
    const u = git(['ls-files', '--others', '--exclude-standard', '-z']);
    for (const f of (u.stdout || '').split('\0').filter(Boolean)) {
      let t; try { t = fs.readFileSync(path.join(gốcRepo, f), 'utf8'); } catch { continue; }
      if (t.includes('\0') || t.length > 2e6) continue;               // nhị phân / quá lớn
      const ls = t.split('\n'); if (ls[ls.length - 1] === '') ls.pop();
      văn += `\ndiff --git a/${f} b/${f}\nnew file mode 100644\n--- /dev/null\n+++ b/${f}\n@@ -0,0 +1,${ls.length} @@\n` + ls.map((l) => '+' + l).join('\n') + '\n';
    }
  }
}
const DOCS = (() => {
  const d = VỊ_TRÍ[0] || 'docs';
  const rel = DIFF ? d : path.relative(gốcRepo, path.resolve(d));
  return rel.split(path.sep).join('/').replace(/\/+$/, '');
})();

// ── phân tích diff unified ────────────────────────────────────────────────
function phânTích(t) {
  const files = []; let f = null; let h = null; let ln = 0;
  for (const l of t.split('\n')) {
    if (l.startsWith('diff --git ')) { f = { path: '', mới: false, hunks: [] }; files.push(f); h = null; continue; }
    if (!f) continue;
    if (l.startsWith('new file mode')) { f.mới = true; continue; }
    if (l.startsWith('--- ')) { if (l === '--- /dev/null') f.mới = true; else f.cũ = l.slice(4).replace(/^a\//, '').replace(/^"|"$/g, ''); continue; }
    if (l.startsWith('+++ ')) { f.path = l === '+++ /dev/null' ? '' : l.slice(4).replace(/^b\//, '').replace(/^"|"$/g, ''); continue; }
    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(l);
    if (m) { h = { start: +m[1], add: [], del: [] }; f.hunks.push(h); ln = +m[1]; continue; }
    if (!h) continue;
    if (l.startsWith('+')) { h.add.push({ s: l.slice(1), ln }); ln++; }
    else if (l.startsWith('-')) h.del.push(l.slice(1));
    else if (l.startsWith(' ')) ln++;
  }
  return files;
}
const tấtCả = phânTích(văn);
const files = tấtCả.filter((x) => x.path);
const đườngChạm = [...new Set(tấtCả.map((x) => x.path || x.cũ).filter(Boolean))];   // cả file bị XOÁ (LACH-TOOLKIT)
const items = [];
const đẩy = (rule, lv, file, line, msg, fix, where) => items.push({ rule, lv, file, line, msg, fix, where });
const trongDocs = (p) => DOCS === '' || DOCS === '.' || p === DOCS || p.startsWith(DOCS + '/');

// ── LACH-HEX ──────────────────────────────────────────────────────────────
const HEX_TRẦN = /(^|[^#&\w])([0-9a-fA-F]{6})(?![\w])/g;
const làHexMàu = (v) => /\d/.test(v) && /[a-f]/i.test(v) && (v === v.toLowerCase() || v === v.toUpperCase());
// ── LACH-ENTITY ───────────────────────────────────────────────────────────
const TÊN_ENTITY = { rarr: 0x2192, larr: 0x2190, uarr: 0x2191, darr: 0x2193, harr: 0x2194, rArr: 0x21d2, lArr: 0x21d0, hellip: 0x2026,
  mdash: 0x2014, ndash: 0x2013, times: 0xd7, middot: 0xb7, bull: 0x2022, ge: 0x2265, le: 0x2264, ne: 0x2260, check: 0x2713,
  cross: 0x2717, laquo: 0xab, raquo: 0xbb, copy: 0xa9, deg: 0xb0, rsquo: 0x2019, lsquo: 0x2018, ldquo: 0x201c, rdquo: 0x201d, num: 0x23 };
const MIỄN = new Set([0x22, 0x26, 0x27, 0x3c, 0x3e, 0x60, 0xa0, 0xad, 0x2028, 0x2029, 0x202f, 0x2060, 0xfeff]);
const MIỄN_MD = new Set([0x7c, 0x2a, 0x5f, 0x5b, 0x5d, 0x5c]);
const HTML_TAY = /(^|\/)(html-design|wireframe[\w-]*|prototype[\w-]*)\.html$/;
const ENTITY = /&#(\d+);|&#x([0-9a-fA-F]+);|&([a-zA-Z]+);/g;
// ── LACH-SUPPRESS ─────────────────────────────────────────────────────────
const TỰ_THÚ = /(để|cho)\s+(checker|lint|check-[\w-]+|scan-[\w-]+)\s+(không|khỏi|im|bỏ qua)|(so as to|to)\s+(silence|bypass|dodge|fool)\s+(the\s+)?(checker|linter|lint)/i;
const bỏTrích = (s) => s.replace(/(`+)[^`]*?\1/g, '').replace(/"[^"]*"|“[^”]*”/g, '');   // câu TRÍCH (tài liệu nói về lách) không phải tự thú
const bỏChúThích = (s) => s.replace(/\sdata-[\w-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/g, '').replace(/\/\*.*?\*\//g, '').replace(/<!--.*?-->/g, '').replace(/\s+/g, ' ').trim();
const chuẩn = (s) => s.replace(/\s+/g, ' ').trim();

let soDocs = 0;
for (const f of files) {
  if (!trongDocs(f.path)) continue;
  const md = /\.md$/i.test(f.path); const html = HTML_TAY.test(f.path);
  if (!md && !/\.html?$/i.test(f.path)) continue;
  soDocs++;
  const là07 = /(^|\/)07-design-system[^/]*\.md$/i.test(f.path);
  for (const h of f.hunks) {
    const bỏHex = new Set(); for (const d of h.del) for (const m of d.matchAll(/#([0-9a-fA-F]{6})\b/g)) bỏHex.add(m[1].toLowerCase());
    const bỏChữ = h.del.join('\n');
    let nThêmChúThích = 0; const delChuẩn = new Set(h.del.map(chuẩn));
    for (const a of h.add) {
      if (md) for (const m of a.s.matchAll(HEX_TRẦN)) {
        const v = m[2]; if (!làHexMàu(v)) continue;
        if (bỏHex.has(v.toLowerCase())) đẩy('LACH-HEX', '❌', f.path, a.ln, 'hex mất `#` (cùng hunk vừa bỏ `#<giá trị>`)', 'giữ `#`; bộ kiểm báo sai thì oan.js add', v);
        else if (là07) đẩy('LACH-HEX', '❌', f.path, a.ln, 'hex trần trong 07 — màu ghi không `#` để né DS-HEX?', 'ghi `#` + đặt trong mục nợ/lệch; bộ kiểm báo sai thì oan.js add', v);
        else if (/màu|colou?r|--[a-z][\w-]*\s*[:=]/i.test(a.s)) đẩy('LACH-HEX', '⚠️', f.path, a.ln, 'hex trần trên dòng nói màu', 'giữ `#` nếu là màu', v);
      }
      const nguyênVăn = md ? a.s.replace(/(`+)[^`]*?\1/g, '') : a.s;   // .md: entity trong `code` là chữ trích, không render
      if (md || html) for (const m of nguyênVăn.matchAll(ENTITY)) {
        const cp = m[1] ? +m[1] : m[2] ? parseInt(m[2], 16) : TÊN_ENTITY[m[3]];
        if (cp === undefined || cp < 0x20 || (cp >= 0x7f && cp < 0xa0) || MIỄN.has(cp) || (cp >= 0x2000 && cp <= 0x200f) || (md && MIỄN_MD.has(cp))) continue;
        let ch = ''; try { ch = String.fromCodePoint(cp); } catch { continue; }
        const cặp = bỏChữ.includes(ch) ? ' (cùng hunk bỏ ký tự thật)' : '';
        đẩy('LACH-ENTITY', '❌', f.path, a.ln, `entity thay ký tự in được${cặp}`, 'viết thẳng ký tự (UTF-8); bộ kiểm báo sai thì oan.js add', `${m[0]}=${ch}`);
      }
      const bỏ = bỏChúThích(a.s);
      if (bỏ !== chuẩn(a.s) && delChuẩn.has(bỏ)) nThêmChúThích++;
      if (TỰ_THÚ.test(bỏTrích(a.s))) đẩy('LACH-SUPPRESS', '⚠️', f.path, a.ln, 'câu tự thú né bộ kiểm ("để checker không …")', 'bộ kiểm báo sai thì ghi bằng oan.js thay vì viết vòng');
    }
    if (nThêmChúThích > 5) đẩy('LACH-SUPPRESS', '⚠️', f.path, h.start, `${nThêmChúThích} dòng chỉ thêm data-*/chú thích trong một hunk`, 'chú thích cho bộ kiểm im? bộ kiểm báo sai thì ghi bằng oan.js');
  }
}

// ── LACH-COPY ─────────────────────────────────────────────────────────────
const dòngSet = (t) => new Set(t.split('\n').map((l) => l.trim()).filter((l) => l.length >= 4 && !/^[{}()[\];,]+$/.test(l)));
const đầu = (t) => {                                              // dòng chú thích đầu có " — " (vd ` * ba-toolkit/oan.js — …`, `// capture.mjs — …`)
  for (const l of t.split('\n').slice(0, 6)) { const m = /^\s*(?:\*|\/\/)\s*(\S.*\s—\s.*)$/.exec(l); if (m && m[1].length >= 20) return m[1].replace(/\s+/g, ' ').trim(); }
  return null;
};
function chỉMụcToolkit() {
  const gốc = [...new Set([path.resolve(__dirname, '..', '..'), path.join(gốcRepo, '.claude', 'skills')])];
  const ra = []; const đã = new Set();
  const đi = (dir, sâu) => {
    let es = []; try { es = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (sâu < 3 && e.name !== 'node_modules' && e.name !== 'vendor') đi(p, sâu + 1); continue; }
      if (!/\.(m?js|cjs)$/.test(e.name) || !/[\\/]scripts[\\/]/.test(p)) continue;
      let t; try { t = fs.readFileSync(p, 'utf8'); } catch { continue; }
      const k = e.name + ':' + t.length; if (đã.has(k)) continue; đã.add(k);
      if (MANIFEST_FILES && !MANIFEST_FILES.has(path.relative(gốcRepo, p).split(path.sep).join('/')) && p.startsWith(path.join(gốcRepo, '.claude', 'skills') + path.sep)) continue;   // file lạ trong skills của đích không phải "bản gốc toolkit"
      ra.push({ abs: p, tên: e.name, rel: path.relative(path.resolve(__dirname, '..', '..'), p).split(path.sep).join('/'), đầu: đầu(t), dòng: dòngSet(t) });
    }
  };
  for (const g of gốc) đi(g, 0);
  return ra;
}
// Repo nguồn (canon export.srcMarker): thêm script vào .claude/skills là việc thường ngày — miễn cả thư mục như cũ.
const SRC_REPO = fs.existsSync(path.join(gốcRepo, 'example', 'docs', '00-tracking.md'));
// Dự án đích (hook-review 07/10/2026): trước đây `.claude/skills/` được miễn trọn → chép capture.mjs vào
// `.claude/skills/x/scripts/` là lọt. Nay chỉ miễn file CÓ trong manifest (ưu tiên bản đã commit — agent sửa manifest
// trong cây làm việc cho "có tên" không qua được); file mới không phải của toolkit thì soát bản sao như mọi nơi khác.
const MANIFEST_FILES = (() => {
  if (SRC_REPO) return null;
  const head = git(['-C', gốcRepo, 'show', 'HEAD:./.claude/ba-toolkit.json']);
  for (const t of [head && head.status === 0 ? head.stdout : null, (() => { try { return fs.readFileSync(path.join(gốcRepo, '.claude', 'ba-toolkit.json'), 'utf8'); } catch { return null; } })()]) {
    if (!t) continue;
    try { return new Set(Object.keys(JSON.parse(t).files || {})); } catch { /* thử bản kế */ }
  }
  return new Set();
})();
const miễnCopy = (p) => /(^|\/)\.claude\/skills\//.test(p) && (SRC_REPO || MANIFEST_FILES.has(p.replace(/^.*?(\.claude\/skills\/)/, '$1')));
const mớiJs = files.filter((f) => f.mới && /\.(m?js|cjs)$/.test(f.path) && !miễnCopy(f.path));
let soCopy = 0;
if (mớiJs.length) {
  const tk = chỉMụcToolkit();
  for (const f of mớiJs) {
    soCopy++;
    const t = f.hunks.flatMap((h) => h.add.map((a) => a.s)).join('\n');
    const ds = dòngSet(t); const hd = đầu(t); const tên = path.basename(f.path);
    let tốt = null;
    const absF = path.resolve(gốcRepo, f.path);
    for (const s of tk) {
      if (s.abs === absF) continue;                    // không so file với chính nó (file mới nằm trong .claude/skills của đích)
      let chung = 0; for (const l of ds) if (s.dòng.has(l)) chung++;
      const j = chung / Math.max(1, Math.min(ds.size, s.dòng.size));
      const lý = hd && s.đầu && hd === s.đầu ? `dòng đầu trùng "${hd.slice(0, 60)}"` : (ds.size >= 15 && j >= 0.6) ? `${Math.round(j * 100)}% dòng trùng` : (tên === s.tên && j >= 0.3) ? `cùng tên, ${Math.round(j * 100)}% dòng trùng` : null;
      if (lý && (!tốt || j > tốt.j)) tốt = { s, j, lý };
    }
    if (tốt) đẩy('LACH-COPY', '❌', f.path, 1, `bản sao script toolkit \`${tốt.s.rel}\` (${tốt.lý})`, 'xoá bản sao; script toolkit sai thì oan.js add + sửa ở nguồn');
  }
}

// ── LACH-TOOLKIT ──────────────────────────────────────────────────────────
// hook-review 07/10/2026: cổng là script trong `.claude/skills/`, hook nằm trong settings.json, công tắc trong ba-hooks.json,
// ngoại lệ trong ba-toolkit-local.json — cả bốn agent ghi được. Diff chạm chúng thì đối soát với NGUỒN bằng integrity.js
// (cây git của repo toolkit hoặc manifest đã commit): chạm mà file vẫn khớp nguồn (vd `ba-export update`) là hợp lệ.
// Repo nguồn: sửa toolkit là việc ở đây → im.
const LÀ_TOOLKIT = /^\.claude\/(skills\/|settings(\.local)?\.json$|ba-hooks\.json$|ba-toolkit-local\.json$)/;
const chạmTK = SRC_REPO ? [] : đườngChạm.filter((p) => LÀ_TOOLKIT.test(p));
let soToolkit = 0; let tkChưaKiểm = null;
if (chạmTK.length) {
  let ig = null;
  try { ig = require(path.join(__dirname, 'integrity.js')).kiểm(gốcRepo); } catch (e) { tkChưaKiểm = `integrity.js lỗi: ${e.message}`; }
  if (ig && ig.nguon === 'none') { tkChưaKiểm = ig.chuaKiem; ig = null; }
  const lệchFile = new Map((ig ? ig.lech : []).map((x) => [x.file, x]));
  const lệchHook = ig ? ig.lech.filter((x) => x.loai === 'hook' || x.loai === 'settings') : [];
  for (const p of chạmTK) {
    soToolkit++;
    if (/ba-toolkit-local\.json$/.test(p)) {           // không có "nguồn" để so: thêm ngoại lệ là việc của NGƯỜI duyệt
      đẩy('LACH-TOOLKIT', '❌', p, 1, 'sửa sổ ngoại lệ toolkit (.claude/ba-toolkit-local.json) — mục duyệt phải do người duyệt ghi', 'người duyệt xác nhận rồi oan.js resolve; agent không tự duyệt bản vá của mình');
      continue;
    }
    if (/ba-hooks\.json$/.test(p)) {
      let cfg = null; try { cfg = JSON.parse(fs.readFileSync(path.join(gốcRepo, p), 'utf8')); } catch { /* không có trên đĩa */ }
      if (!cfg) { const f = files.find((x) => x.path === p && x.mới); try { cfg = f ? JSON.parse(f.hunks.flatMap((h) => h.add.map((a) => a.s)).join('\n')) : null; } catch { cfg = null; } }   // --diff: file mới đọc từ chính diff
      let mặc = {}; try { mặc = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'hooks.config.json'), 'utf8')); } catch { /* thiếu */ }
      const khác = cfg ? Object.keys(cfg).filter((k) => !k.startsWith('_') && JSON.stringify(cfg[k]) !== JSON.stringify(k in mặc ? mặc[k] : true)) : [];
      if (khác.length) đẩy('LACH-TOOLKIT', '❌', p, 1, `ba-hooks.json tắt/đổi luật hook so với mặc định: ${khác.map((k) => `${k}=${JSON.stringify(cfg[k])}`).join(', ')}`, 'bật lại; luật báo sai → oan.js add, không tắt hook', khác.join(','));
      continue;
    }
    if (!ig) continue;                                 // không kiểm được nguồn → ghi ở "Chưa kiểm", không đoán
    if (/settings(\.local)?\.json$/.test(p)) {
      if (lệchHook.length) đẩy('LACH-TOOLKIT', '❌', p, 1, `settings lệch khối hook chuẩn: ${lệchHook.map((x) => x.chiTiet || x.loai).join(' · ')}`, 'chạy lại ba-export update (install.js ghi lại hook); không gỡ/tắt hook');
      continue;
    }
    const x = lệchFile.get(p);
    if (x) đẩy('LACH-TOOLKIT', '❌', p, 1, `file toolkit ${x.loai === 'sua' ? 'bị sửa' : x.loai === 'them' ? 'thêm mới' : 'bị xoá'} lệch nguồn (${ig.nguon === 'source' ? `@${ig.commit}` : 'manifest đã commit'})`, 'bộ kiểm sai → oan.js add + sửa ở NGUỒN rồi ba-export update; vá có chủ đích → người duyệt ghi ba-toolkit-local.json');
  }
}

// ── in ────────────────────────────────────────────────────────────────────
RC.ghi('scan-lach', items.map((i) => i.rule));
const groups = plist.group(items, { step: 0 });
const nErr = groups.filter((g) => g.lv === '❌').length;
const checked = [`${nguồn}: ${files.length} file · ${soDocs} tài liệu trong \`${DOCS || '.'}\` (LACH-HEX/ENTITY/SUPPRESS) · ${soCopy} script mới không thuộc manifest toolkit (LACH-COPY) · ${soToolkit} file toolkit/hook chạm${SRC_REPO ? ' (repo nguồn — LACH-TOOLKIT tắt)' : ''} (LACH-TOOLKIT)`];
const unchecked = [...(tkChưaKiểm ? [['LACH-TOOLKIT: file toolkit/settings chạm', tkChưaKiểm]] : []), ['bản sao script ngoài repo (scratchpad, /tmp)', 'diff không thấy'], ['html do script sinh (portal, sitemap, releases, userguide)', 'generator được escape'], ['ý đồ', 'heuristic chỉ thấy dấu vết — người đọc lại diff']];
if (JSON_OUT) console.log(JSON.stringify({ nguon: nguồn, docs: DOCS, soFile: files.length, errors: items.filter((i) => i.lv === '❌').length, errorGroups: nErr, items, groups, unchecked: unchecked.map(([w, v]) => ({ mục: w, vì: v })) }, null, 2));
else {
  console.log(`scan-lach ${nguồn}: ${files.length} file`);
  console.log(plist.render(items, { step: 0, checked, unchecked, oan: 'ba-toolkit/scan-lach' }));
}
process.exit(Math.min(nErr, 255));
