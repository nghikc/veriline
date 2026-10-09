#!/usr/bin/env node
/**
 * ba-portal/build.js
 * Zero-dependency Node.js script to build a self-contained HTML documentation portal
 * from a folder of markdown files.
 *
 * Usage: node build.js <docsDir=docs> <outFile=docs/portal.html>
 */

'use strict';

if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

// ─── CLI ────────────────────────────────────────────────────────────────────
// Portal mode:  node build.js [docsDir=docs] [out=docs/portal.html]
// Single mode:  node build.js --single <file.md> [out=<file>.html] [--no-toc]
//
// Mặc định portal CHỈ gom tài liệu do BA toolkit sinh (00..08-*.md ở cấp đầu + 9 file
// chuẩn trong folder mỗi màn). Folder lạ do skill khác tạo (vd docs/superpowers/,
// docs/session-notes/) bị bỏ qua. Thêm cờ --all để gom MỌI .md/.html.

const rawArgv = process.argv.slice(2);
const includeAll = rawArgv.includes('--all');   // tắt lọc, gom mọi file (thoát hiểm)
const noToc = rawArgv.includes('--no-toc');      // --single: bỏ dựng mục lục (TOC) theo heading
const clientMode = rawArgv.includes('--client'); // portal GỌN cho khách: chỉ Introduction + yêu cầu + chức năng + design-system + kiến trúc + màn; ẩn tracking/registers/overview + dashboard
const argv = rawArgv.filter(a => a !== '--all' && a !== '--no-toc' && a !== '--client');
const singleMode = argv[0] === '--single';

const SWIM_LR_MAX_NODE = 8, SWIM_LR_MAX_LANE = 3; // swimlane LR quá ngưỡng → gợi TD (cùng bẫy TDZ với mermaidWarnings)
const mermaidWarnings = []; // khai báo TRƯỚC --lint mode (lintMermaid hoisted nhưng const thì không — TDZ)
// Cùng bẫy TDZ: `--lint` gọi lintMermaid ngay bên dưới, nên hằng nó dùng phải nằm TRÊN đây.
const DIACRITIC = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
// Âm tiết Việt hay gặp trong nhãn sơ đồ nghiệp vụ, viết KHÔNG DẤU. Dùng để phân biệt
// "tiếng Việt bị bỏ dấu" với "thuật ngữ tiếng Anh" — thứ hoàn toàn hợp lệ trong sơ đồ kiến trúc.
const VI_SYLLABLE = new RegExp('\\b(nguoi|viec|cong|cua|cho|khi|duoc|khong|thong|tin|danh|sach|quan|ly|dang|nhap|xuat|tao|sua|xoa|xem|gui|nhan|trang|thai|chi|tiet|bao|cao|mat|khau|tai|khoan|kiem|tra|xac|phe|duyet|huy|luu|tim|hoac|va|them|bot|chon|mo|dong|ket|thuc|bat|dau|hoan|thanh|loi|canh|gio|ngay|thang|nam|don|hang|khach|nhom|vai|tro|he|thong)\\b', 'i');

// Lint-only mode: node build.js --lint <file.md> [...] — chỉ lint khối mermaid, KHÔNG build.
// Dùng cho hook PostToolUse (sửa doc → cảnh báo ngay) và CI. Exit = số cảnh báo.
if (argv[0] === '--lint') {
  const files = argv.slice(1).filter(f => /\.md$/i.test(f) && fs.existsSync(f));
  if (!files.length) { console.error('Usage: node build.js --lint <file.md> [...]'); process.exit(0); }
  for (const f of files) lintMermaid(fs.readFileSync(f, 'utf8'), path.relative(process.cwd().normalize('NFC'), path.resolve(f).normalize('NFC')));
  reportMermaidWarnings();
  process.exit(Math.min(mermaidWarnings.length, 99));
}

let docsDir, outFile, singleInput;

if (singleMode) {
  if (!argv[1]) {
    console.error('Usage: node build.js --single <file.md> [out.html] [--no-toc]');
    process.exit(1);
  }
  singleInput = path.resolve(argv[1]);
  if (!fs.existsSync(singleInput)) {
    console.error(`Lỗi: không thấy file ${singleInput}\nSửa: kiểm lại đường dẫn file .md muốn dựng (vd docs/01-requirements.md).`);
    process.exit(1);
  }
  outFile = path.resolve(argv[2] || singleInput.replace(/\.md$/i, '.html'));
} else {
  docsDir = path.resolve(argv[0] || 'docs');
  // `portal.html` là artifact phái sinh → thuộc `docs/Ho-so/` (bố cục từ 13/08/2026).
  // writePathFor giữ nguyên chỗ file đã có: dự án cũ có `docs/portal.html` thì vẫn ghi đè
  // tại đó, không tự dời output của người ta sang chỗ mới sau một lần nâng cấp toolkit.
  outFile = path.resolve(argv[1] || require('../../ba-toolkit/scripts/docpath.js').writePathFor(docsDir, 'portal.html'));
  if (!fs.existsSync(docsDir)) {
    console.error(`Lỗi: không thấy thư mục tài liệu ${docsDir}\nSửa: chạy từ gốc dự án (nơi có docs/) hoặc truyền đúng thư mục: node .claude/skills/ba-portal/scripts/build.js docs`);
    process.exit(1);
  }
}

// ─── FILE DISCOVERY ─────────────────────────────────────────────────────────

// Bộ nhận diện tài liệu DO BA TOOLKIT sinh — để bỏ qua file/folder lạ (vd
// docs/superpowers/, docs/session-notes/ do skill khác tạo). Tắt bằng cờ --all.
const TOPLEVEL_DOC_RE = /^\d{2}-[\w-]+\.md$/i;        // 00-brainstorm.md … 09-uat.md (dev-notes.md khong so → khong gom)
const SCREEN_FILES = new Set([                         // file chuẩn trong folder mỗi màn
  'ascii-screen.md', 'brainstorm.md', 'srs.md', 'usecase.md', 'userstory.md',
  'design-spec.md', 'checklist.md', 'html-design.html', 'test.md', 'plan.md',
]);

// ─── Thứ tự trình bày trong portal (không phải alphabet) ────────────────────────────
// Cấp dự án: nhóm "Introduction" (discovery) trước → yêu cầu → chức năng → design system
// → kiến trúc → (doc còn lại theo số). File màn: brainstorm→srs→ascii→design-spec→usecase
// →userstory→checklist → (html/test/plan còn lại). Tên KHÔNG có trong danh sách xếp sau,
// giữ thứ tự alphabet/số cũ.
const PROJECT_ORDER = [
  '00-introduction.md',                                                              // bản gộp discovery (client)
  '00-brainstorm.md', '00-vision.md', '00-personas.md', '00-process.md', '00-urd.md', // nhóm Introduction (nguồn)
  '00-decisions.md',   // luồng prototype-trước: sổ quyết định là NGUỒN của yêu cầu → đọc trước 01.
                        // (`00-flows.md` nằm trong Ho-so/ nên xếp theo NHÓM, không qua bảng này — đừng thêm vào đây, sẽ là luật chết.)
  '01-requirements.md', '02-functions.md', '07-design-system.md', '10-architecture.md',
];
const SCREEN_ORDER = [
  'brainstorm.md', 'srs.md', 'ascii-screen.md', 'design-spec.md',
  'usecase.md', 'userstory.md', 'checklist.md',
];
// Nhóm "Introduction" trong nav = 5 doc discovery NGUỒN (không gồm 00-introduction.md gộp).
const INTRO_RAW = new Set(['00-brainstorm.md', '00-vision.md', '00-personas.md', '00-process.md', '00-urd.md']);
// Portal GỌN (--client): chỉ các doc cấp dự án này (+ mọi file màn). 00-introduction.md thay 5 doc nguồn.
const CLIENT_WHITELIST = new Set(['00-introduction.md', '01-requirements.md', '02-functions.md', '07-design-system.md', '10-architecture.md']);
const rankBy = (order, rel) => {
  const i = order.indexOf(path.basename(rel).toLowerCase());
  return i === -1 ? order.length : i;
};
const cmpByOrder = (order) => (a, b) => {
  const ra = rankBy(order, a.rel), rb = rankBy(order, b.rel);
  return ra !== rb ? ra - rb : a.rel.localeCompare(b.rel);
};
const CLIENT_SCREEN = new Set(SCREEN_ORDER); // portal gọn: mỗi màn chỉ 7 file này (bỏ html-design/test/plan)
// `docs/Ho-so/` là CONTAINER TRONG SUỐT (như `Screen-spec/`): tài liệu bổ trợ chuyển vào đó
// từ 13/08/2026 vẫn là doc CẤP DỰ ÁN, không phải file màn. Không bóc lớp này ra thì
// `Ho-so/00-vision.md` bị coi là file trong folder màn → trượt SCREEN_FILES → portal âm thầm
// nuốt mất cả nhóm (đo thật: bỏ qua 33 file thay vì 22). Chỉ bóc ĐÚNG MỘT cấp: `Ho-so/releases/…`
// vẫn nằm sâu → vẫn bị loại như trước (releases/userguide cố ý không vào portal).
const HOSO_DIR = require('../../ba-toolkit/scripts/docpath.js').HOSO;
const stripHoSo = (rel) => {
  const parts = rel.split(path.sep);
  return parts[0] === HOSO_DIR ? parts.slice(1).join(path.sep) : rel;
};
function isToolkitDoc(relRaw, name) {
  const rel = stripHoSo(relRaw);
  // `Ho-so/removed/…` = màn ĐÃ BỊ CẮT khỏi phạm vi (do `ba-remove` chuyển vào, kèm CR).
  // Sau khi bóc lớp `Ho-so/`, folder màn ở đó trông y hệt folder màn thật (`srs.md`,
  // `usecase.md`…) nên sẽ trượt SCREEN_FILES và LỌT LẠI VÀO PORTAL — đúng thứ vừa bị bỏ.
  // Loại ở đây, không phải ở walk(): giữ nguyên bộ đếm "file ngoài bộ toolkit" cho các folder lạ.
  if (rel.split(path.sep)[0] === 'removed') return false;
  const topLevel = !rel.includes(path.sep);
  const low = name.toLowerCase();
  if (!topLevel) return clientMode ? CLIENT_SCREEN.has(low) : SCREEN_FILES.has(low); // file màn: gọn = 7 file; đầy đủ = như cũ
  if (clientMode) return CLIENT_WHITELIST.has(low);     // portal gọn: chỉ doc trong whitelist
  if (low === '00-introduction.md') return false;       // full: ẩn bản gộp (đã có 5 doc nguồn)
  return TOPLEVEL_DOC_RE.test(name);
}

let skippedForeign = 0;

function walk(dir, base) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const rel = path.relative(base, abs);
    // Skip the output file and any existing portal.html
    if (abs === outFile) continue;
    if (e.name === 'portal.html') continue;
    if (e.isDirectory()) {
      results.push(...walk(abs, base));
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (ext !== '.md' && ext !== '.html') continue;
      // Lọc: chỉ giữ tài liệu của BA toolkit (trừ khi --all)
      if (!includeAll && !isToolkitDoc(rel, e.name)) { skippedForeign++; continue; }
      results.push({ abs, rel, ext });
    }
  }
  return results;
}

let orderedFiles = [];
if (!singleMode) {
  const allFiles = walk(docsDir, docsDir);

  // Separate top-level from nested, sort each group
  const topLevel = allFiles
    .filter(f => !f.rel.includes(path.sep))
    .sort(cmpByOrder(PROJECT_ORDER));   // Introduction → requirement → function → design system → architecture → (còn lại)

  const nested = allFiles.filter(f => f.rel.includes(path.sep));

  // Group nested by their first-level folder
  const groups = {};
  for (const f of nested) {
    const parts = f.rel.split(path.sep);
    const group = parts.slice(0, -1).join('/').replace(/^Screen-spec\//, ''); // container trong suốt — không hiện trong nhãn nav
    if (!groups[group]) groups[group] = [];
    groups[group].push(f);
  }
  // Sort within each group theo thứ tự file màn (brainstorm→srs→ascii→design-spec→usecase→userstory→checklist→…)
  for (const g of Object.keys(groups)) {
    groups[g].sort(cmpByOrder(SCREEN_ORDER));
  }
  const sortedGroups = Object.keys(groups).sort();

  // Final ordered list
  orderedFiles = [
    ...topLevel,
    ...sortedGroups.flatMap(g => groups[g]),
  ];
}

// ─── IMAGE EMBED & OFFLINE CHART ─────────────────────────────────────────────

// Nhúng ảnh local thành data URI base64 → HTML TỰ CHỨA (gửi lẻ 1 file vẫn thấy ảnh).
// Bỏ qua http(s)/data; ảnh không tìm thấy thì giữ nguyên src. baseDir = thư mục file .md nguồn.
function embedImages(html, baseDir) {
  return html.replace(/(\bsrc=")([^"]+)(")/g, (m, a, url, c) => {
    if (/^(https?:|data:)/i.test(url)) return m;
    const p = path.isAbsolute(url) ? url : path.resolve(baseDir, url);
    if (!fs.existsSync(p)) return m;
    const ext = path.extname(p).slice(1).toLowerCase();
    const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : 'image/' + (ext || 'png');
    return a + 'data:' + mime + ';base64,' + fs.readFileSync(p).toString('base64') + c;
  });
}

// Chart/sơ đồ offline: inline thư viện Mermaid vendored — CHỈ khi HTML thực sự có sơ đồ
// (tránh phình file). Thiếu vendor → fallback CDN (cần internet).
//
// House theme: palette trung tính, dễ đọc, tương phản đủ (không dùng theme mặc định thô).
// Sơ đồ tự mang `%%{init}%%` riêng vẫn override được block này (mermaid ưu tiên init nội tuyến).
const MMD_INIT = `mermaid.initialize({startOnLoad:false,securityLevel:'loose',theme:'base',themeVariables:{primaryColor:'#eaf1fb',primaryBorderColor:'#3b6ea5',primaryTextColor:'#132523',lineColor:'#5a6b7b',secondaryColor:'#f3ede1',tertiaryColor:'#eef2f5',fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif'}});`;
// Render TỪNG sơ đồ trong try/catch: 1 sơ đồ vỡ KHÔNG làm chết các sơ đồ khác, và lỗi
// hiện HỘP ĐỎ tại chỗ (kèm nguồn + console.error) thay vì biến mất im lặng.
const MMD_RUN = `(async function(){var ns=document.querySelectorAll('pre.mermaid'),ok=0,er=0;var esc=function(s){return String(s).replace(/[<&]/g,function(c){return c==='<'?'&lt;':'&amp;';});};for(var i=0;i<ns.length;i++){var el=ns[i],src=el.textContent;try{var r=await mermaid.render('mmd'+i,src);el.innerHTML=r.svg;if(r.bindFunctions)r.bindFunctions(el);ok++;}catch(e){er++;el.classList.add('mermaid-error');el.innerHTML='<div style="color:#b1223a;border:1px solid #e6b3c1;background:#fff5f7;padding:10px 12px;border-radius:6px;text-align:left;font-family:system-ui,-apple-system,sans-serif"><b>⚠ Sơ đồ Mermaid lỗi cú pháp — không render được.</b><br><small>'+esc(e&&e.message||e)+'</small><details style="margin-top:6px"><summary style="cursor:pointer">Nguồn sơ đồ</summary><pre style="white-space:pre-wrap;font-size:12px">'+esc(src)+'</pre></details></div>';console.error('[mermaid] sơ đồ #'+i+' lỗi:',e);}}if(er)console.warn('[mermaid] '+er+'/'+(ok+er)+' sơ đồ lỗi render.');})();`;

let _mermaidJs;
function mermaidInline(html) {
  if (!/class="mermaid"/.test(html)) return '';
  if (_mermaidJs === undefined) {
    // Bố cục chuẩn 04/09/2026 chuyển `vendor/` sang `assets/`, nhưng dòng này vẫn đọc
    // `__dirname/vendor/` (= `scripts/vendor/`) — thư mục không còn tồn tại. Hệ quả IM LẶNG và
    // đắt: try/catch nuốt lỗi, `_mermaidJs` thành rỗng, và MỌI portal dựng từ sau mốc đó rơi về
    // CDN — mất đúng tính năng đầu bảng của portal là "mở được offline". Không có gì đỏ, không
    // có gì cảnh báo; chỉ người mở file khi không có mạng mới biết. Thử `assets/` trước, giữ
    // `scripts/vendor/` làm bản dự phòng cho dự án cài trước mốc di trú.
    for (const p of [path.join(__dirname, '..', 'assets', 'vendor', 'mermaid.min.js'),
                     path.join(__dirname, 'vendor', 'mermaid.min.js')]) {
      try { _mermaidJs = fs.readFileSync(p, 'utf8'); break; } catch (e) { _mermaidJs = ''; }
    }
  }
  if (!_mermaidJs) {
    return `<script type="module">try{const m=await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');window.mermaid=m.default;${MMD_INIT}${MMD_RUN}}catch(e){console.error('mermaid',e);}</script>`;
  }
  return `${require('./mermaid-notice').mermaidNotice()}\n<script>${_mermaidJs}</script>\n` +
    `<script>try{${MMD_INIT}${MMD_RUN}}catch(e){console.error('mermaid',e);}</script>`;
}

// Lightbox: click ảnh (hoặc sơ đồ Mermaid) → phóng to overlay; click nền / nút × / Esc → đóng.
// Thuần vanilla, tự chứa, không phụ thuộc ngoài (giữ zero-dep + CSP-safe của portal).
const LIGHTBOX_CSS = `
#content img,.doc-section img,article img,.markdown-body img,pre.mermaid{cursor:zoom-in}
#lightbox{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background:rgba(15,20,25,.9);cursor:zoom-out;padding:24px;box-sizing:border-box}
#lightbox.open{display:flex}
#lightbox .lb-stage{width:92vw;height:86vh;display:flex;align-items:center;justify-content:center}
#lightbox .lb-stage img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;background:#fff;border-radius:6px;box-shadow:0 10px 50px rgba(0,0,0,.55)}
#lightbox .lb-stage svg{width:100%;height:100%;background:#fff;border-radius:6px;box-shadow:0 10px 50px rgba(0,0,0,.55);padding:14px;box-sizing:border-box}
#lightbox .lb-close{position:fixed;top:10px;right:18px;width:44px;height:44px;font-size:30px;line-height:1;color:#fff;background:rgba(0,0,0,.35);border:none;border-radius:50%;cursor:pointer;z-index:1}
#lightbox .lb-close:hover{background:rgba(0,0,0,.6)}
`;
const LIGHTBOX_JS = `(function(){var lb=document.createElement('div');lb.id='lightbox';lb.innerHTML='<button class="lb-close" aria-label="Dong (Esc)">\\u00d7</button><div class="lb-stage"></div>';document.body.appendChild(lb);var stage=lb.querySelector('.lb-stage');function open(node){stage.innerHTML='';stage.appendChild(node);lb.classList.add('open');document.documentElement.style.overflow='hidden';}function close(){lb.classList.remove('open');stage.innerHTML='';document.documentElement.style.overflow='';}document.addEventListener('click',function(e){var t=e.target;if(!t||!t.closest)return;var img=t.closest('img');if(img&&!img.closest('#sidebar,nav,header,#lightbox')){var c=img.cloneNode(true);c.removeAttribute('loading');c.removeAttribute('width');c.removeAttribute('height');open(c);return;}var mm=t.closest('pre.mermaid');if(mm){var svg=mm.querySelector('svg');if(svg){var cs=svg.cloneNode(true);cs.removeAttribute('width');cs.removeAttribute('height');cs.style.maxWidth='none';open(cs);}}});lb.addEventListener('click',function(e){if(e.target===lb||e.target.classList.contains('lb-close'))close();});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&lb.classList.contains('open'))close();});})();`;

// Lint tĩnh lúc build: quét khối ```mermaid trong NGUỒN .md, cảnh báo các pattern hay vỡ
// (theo "Sơ đồ Mermaid — an toàn cú pháp" trong conventions). KHÔNG chặn build — chỉ nhắc.
function lintMermaid(md, label) {
  const lines = md.split('\n');
  let inMmd = false, mmdType = null;
  // Tài liệu tiếng Anh thì sơ đồ tiếng Anh là đúng — chỉ soát diacritics khi file là tiếng Việt.
  const fileIsVi = DIACRITIC.test(md);
  let blockBuf = [], blockStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trimStart();
    if (!inMmd) { if (/^```mermaid\b/i.test(t)) { inMmd = true; mmdType = null; blockBuf = []; blockStart = i + 1; } continue; }
    if (/^```/.test(t)) {
      inMmd = false;
      if (fileIsVi && blockBuf.length) lintMermaidDiacritics(blockBuf.join('\n'), label, blockStart);
      if (mmdType && /^swimlane-beta\s+LR\b/i.test(mmdType)) lintSwimlaneHướng(blockBuf, label, blockStart);
      continue;
    }
    blockBuf.push(lines[i]);
    const ln = lines[i], no = i + 1;
    if (mmdType === null && t) mmdType = t.toLowerCase();   // dòng đầu = loại sơ đồ
    // architecture-beta: nhãn [Ten] chỉ chữ/số/khoảng trắng — +.-/(): làm vỡ parser (không bọc ngoặc kép cứu được)
    if (mmdType && mmdType.startsWith('architecture')) {
      const lbl = ln.match(/\[([^\]]*)\]/);
      if (lbl && /[+.\-/():]/.test(lbl[1]))
        mermaidWarnings.push({ label, line: no, msg: `architecture-beta: nhãn "[${lbl[1]}]" có ký tự +.-/(): sẽ vỡ — chỉ chữ/số/khoảng trắng` });
      continue; // các luật flowchart dưới không áp cho architecture-beta
    }
    if (ln.includes(';'))
      mermaidWarnings.push({ label, line: no, msg: 'dấu ";" — Mermaid coi là hết câu, sẽ vỡ' });
    if ((ln.match(/"/g) || []).length % 2 === 1)
      mermaidWarnings.push({ label, line: no, msg: 'dấu " lẻ — nhãn chưa bọc trọn ["..."]' });
    if (/-\.[xo](?!-)/.test(ln))
      mermaidWarnings.push({ label, line: no, msg: 'cạnh dotted+cross/circle sai (-.x / -.o → dùng -.-x / -.-o)' });
    // nhãn node có ( ) chưa bọc — BỎ QUA shape hợp lệ (trụ [(...)], khe [/.../] hoặc [\...\]) và nhãn đã bọc "..."
    const stripped = ln
      .replace(/\[\(.*?\)\]/g, '')     // trụ/database [(...)]
      .replace(/\[\/.*?\/\]/g, '')     // bình hành [/.../]
      .replace(/\[\\.*?\\\]/g, '')     // bình hành [\...\]
      .replace(/"[^"]*"/g, '');        // nhãn đã bọc ngoặc kép
    if (/\[[^\]"]*[()][^\]]*\]/.test(stripped))
      mermaidWarnings.push({ label, line: no, msg: 'nhãn node có ( ) chưa bọc ngoặc kép — dùng ["..."]' });
  }
}
// swimlane-beta LR quá nhiều node → sơ đồ trải ngang, chữ bị bóp, portal cuộn ngang (conv-mermaid: > 8 node hoặc
// ≥ 4 lane → TD). Đo 16/09/2026: dự án helpdesk 10 sơ đồ LR 9–25 node, dự án desktop 10–11 node. Đếm node = id có shape mở
// ngay sau (`A[`, `B(`, `C{`, `D([`) ngoài dòng subgraph/classDef; lane = số dòng subgraph. Chỉ cảnh báo, không sửa.
function lintSwimlaneHướng(block, label, startLine) {
  const ids = new Set(); let lanes = 0;
  for (const l of block) {
    if (/^\s*subgraph\b/.test(l)) { lanes++; continue; }
    if (/^\s*(end|classDef|class |style|linkStyle|swimlane)/.test(l)) continue;
    for (const m of l.matchAll(/(?:^|[\s>|])([A-Za-z][A-Za-z0-9_]*)\s*(?:\[|\(\[|\(\(|\{|\()/g)) ids.add(m[1]);
  }
  if (ids.size > SWIM_LR_MAX_NODE || lanes > SWIM_LR_MAX_LANE)
    mermaidWarnings.push({ label, line: startLine, msg: `swimlane-beta LR có ${ids.size} node · ${lanes} lane — quá ${SWIM_LR_MAX_NODE} node hoặc ${SWIM_LR_MAX_LANE} lane thì dùng \`swimlane-beta TD\` (LR trải ngang, chữ bị bóp)` });
}
// Tiếng Việt trong sơ đồ PHẢI CÓ DẤU (conventions → "Sơ đồ Mermaid" quy tắc 8). Diacritics
// KHÔNG bao giờ làm vỡ Mermaid — bỏ dấu là chữa sai bệnh, và sinh ra sơ đồ stakeholder đọc
// không nổi. Heuristic phải chặt để khỏi báo oan hai ca hợp lệ:
//   - ERD/architecture dùng ĐỊNH DANH ASCII (`NGUOI_DUNG`, `authGuard`) — đó là ID, đúng chuẩn.
//   - sơ đồ thuần thuật ngữ tiếng Anh (`extend`, `include`, `Redis`).
// Nên chỉ cảnh báo khi: file rõ ràng là tiếng Việt · CẢ khối không có một dấu nào ·
// mà lại có ≥2 nhãn NHIỀU TỪ (prose, không phải định danh). Định danh luôn là một token.
function lintMermaidDiacritics(block, label, startLine) {
  const labels = [];
  for (const m of block.matchAll(/\[([^\][]{2,60})\]|\|([^|]{2,60})\||-\.([^.>|]{3,60})\.->/g)) {
    const txt = (m[1] || m[2] || m[3] || '').replace(/^"|"$/g, '').trim();
    if (txt) labels.push(txt);
  }
  // `gantt` không dùng ngoặc: nhãn nằm TRƯỚC dấu `:` của mỗi dòng task, cộng `title`/`section`.
  // Bỏ qua chúng là cả một loại sơ đồ chưa bao giờ được kiểm dấu (example 08-roadmap 20/09/2026).
  if (/^\s*gantt\b/m.test(block)) {
    for (const l of block.split('\n')) {
      const t = l.trim();
      if (/^(gantt|dateFormat|axisFormat|excludes|todayMarker|tickInterval)\b/.test(t) || !t) continue;
      const m2 = /^(?:title|section)\s+(.{2,60})$/.exec(t) || /^(.{2,60}?)\s*:(?!:)/.exec(t);
      if (m2 && m2[1].trim()) labels.push(m2[1].trim());
    }
  }
  // "Chuỗi ASCII nhiều từ" là dấu hiệu QUÁ LỎNG: sơ đồ kiến trúc/triển khai dùng thuật ngữ
// tiếng Anh hoàn toàn hợp lệ ("UI Controller", "Org Admin", "TeamTasks SG region") — đo thật
  // trên example thì 3/4 cảnh báo là báo oan. Siết bằng TỪ ĐIỂN ÂM TIẾT VIỆT: tiếng Việt bỏ dấu
  // gần như luôn chứa ít nhất một trong các âm tiết dưới đây, còn thuật ngữ tiếng Anh thì không.
  // Nhãn thường mở đầu bằng CHÍNH MÃ node (`F01 Dang nhap`, `S02 Bang dieu khien`). Chữ số trong
  // mã làm regex "chỉ chữ cái" trượt, nên cả nhóm nhãn ấy chưa bao giờ được kiểm — đo trên
  // example 20/09/2026: `08-roadmap.md` có 13 nhãn không dấu kiểu đó, lint im suốt (steal B23).
  // Bóc tiền tố mã rồi mới xét phần chữ.
  const thân = (t) => t.replace(/^[A-Za-z][A-Za-z0-9_-]*\s+/, '');
  const prose = labels.filter(t => /^[A-Za-z][A-Za-z\s]*$/.test(thân(t)) && VI_SYLLABLE.test(thân(t)));
  if (prose.length >= 1 && !DIACRITIC.test(block)) {
    mermaidWarnings.push({
      label, line: startLine,
      msg: `sơ đồ có vẻ viết tiếng Việt KHÔNG DẤU (vd "${prose[0]}") — nhãn hiển thị phải có dấu; chỉ ID node mới để ASCII (conventions quy tắc 8)`,
    });
  }
}
function reportMermaidWarnings() {
  if (!mermaidWarnings.length) return;
  console.warn(`\n⚠ Mermaid lint: ${mermaidWarnings.length} cảnh báo (không chặn build) —`);
  for (const w of mermaidWarnings.slice(0, 40))
    console.warn(`  ${w.label}:${w.line}  ${w.msg}`);
  if (mermaidWarnings.length > 40) console.warn(`  … và ${mermaidWarnings.length - 40} cảnh báo nữa.`);
}

// ─── MARKDOWN RENDERER ──────────────────────────────────────────────────────

/**
 * Escape HTML special characters (for use in text nodes and attribute values).
 * Preserves existing &amp; entities to avoid double-escaping in normal text,
 * but in code blocks we do a full raw escape.
 */
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escHtmlCode(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate an id-safe slug from a heading string.
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')       // strip any inline HTML
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-');
}

/**
 * Process inline markdown: bold, italic, inline code, links.
 */
function inlineToHtml(text) {
  // inline code first (prevent other rules from touching content inside)
  // LƯU Ý: mọi call site đều truyền text ĐÃ escHtml() rồi (`inlineToHtml(escHtml(x))`),
  // nên ở đây KHÔNG escape lại & < > — escape lần hai biến `dev-run <màn>` thành
  // "dev-run &lt;màn&gt;" hiện nguyên entity trên trang. Chỉ cần chặn dấu " cho an toàn.
  text = text.replace(/`([^`]+)`/g, (_, c) => `<code>${c.replace(/"/g, '&quot;')}</code>`);
  // bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
  // italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/_(.+?)_/g, '<em>$1</em>');
  // images (đặt TRƯỚC links để rule link không nuốt cú pháp ảnh ![]())
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  // links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return text;
}

/**
 * Convert a GFM pipe table (array of raw lines) to HTML.
 */
function tableToHtml(lines) {
  if (lines.length < 2) return lines.map(l => escHtml(l)).join('\n');

  const parseRow = (line) => {
    // strip leading/trailing pipes and whitespace
    let s = line.trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|')) s = s.slice(0, -1);
    return s.split('|').map(c => c.trim());
  };

  // Row 0 = header, Row 1 = separator, Rows 2+ = body
  const headerCells = parseRow(lines[0]);
  // lines[1] is separator — skip
  const bodyRows = lines.slice(2);

  let html = '<table>\n<thead>\n<tr>';
  for (const cell of headerCells) {
    html += `<th>${inlineToHtml(escHtml(cell))}</th>`;
  }
  html += '</tr>\n</thead>\n';

  if (bodyRows.length > 0) {
    html += '<tbody>\n';
    for (const row of bodyRows) {
      if (!row.trim()) continue;
      const cells = parseRow(row);
      html += '<tr>';
      for (const cell of cells) {
        html += `<td>${inlineToHtml(escHtml(cell))}</td>`;
      }
      html += '</tr>\n';
    }
    html += '</tbody>\n';
  }
  html += '</table>';
  return html;
}

/**
 * Convert a list block (array of raw lines from the markdown) to HTML.
 * Supports ordered/unordered + checkboxes + 1 level of nesting.
 */
function listToHtml(lines) {
  const UL_RE = /^(\s*)([-*+])\s+(.*)/;
  const OL_RE = /^(\s*)(\d+)\.\s+(.*)/;
  const CB_RE = /^\[([ xX])\]\s*(.*)/;

  // Determine list type from first item
  const firstMatch = UL_RE.exec(lines[0]) || OL_RE.exec(lines[0]);
  if (!firstMatch) return lines.map(l => escHtml(l)).join('\n');

  const isOrdered = /^\s*\d+\./.test(lines[0]);

  // Build a simple tree: items at indent 0 are top-level, >0 are nested
  const items = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const ulm = UL_RE.exec(line);
    const olm = OL_RE.exec(line);
    const m = ulm || olm;
    if (!m) continue;
    const indent = m[1].length;
    const text = m[3];
    // Check for checkbox
    const cbm = CB_RE.exec(text);
    let content, checked = null;
    if (cbm) {
      checked = cbm[1].toLowerCase() === 'x';
      content = cbm[2];
    } else {
      content = text;
    }
    items.push({ indent, content, checked, ordered: /^\s*\d+\./.test(line) });
  }

  const renderItem = (item) => {
    let text = inlineToHtml(escHtml(item.content));
    if (item.checked !== null) {
      const icon = item.checked ? '&#9745;' : '&#9744;';
      text = `<span class="checkbox">${icon}</span> ${text}`;
    }
    return text;
  };

  // Two-pass: group into top-level + sub-lists
  const tag = isOrdered ? 'ol' : 'ul';
  let html = `<${tag}>\n`;
  let i = 0;
  while (i < items.length) {
    const item = items[i];
    if (item.indent > 0) {
      // Orphan nested item — attach to last top-level
      i++;
      continue;
    }
    html += `<li>${renderItem(item)}`;
    // Collect children
    const children = [];
    let j = i + 1;
    while (j < items.length && items[j].indent > 0) {
      children.push(items[j]);
      j++;
    }
    if (children.length > 0) {
      const childTag = children[0].ordered ? 'ol' : 'ul';
      html += `\n<${childTag}>\n`;
      for (const child of children) {
        html += `<li>${renderItem(child)}</li>\n`;
      }
      html += `</${childTag}>\n`;
    }
    html += '</li>\n';
    i = j;
  }
  html += `</${tag}>`;
  return html;
}

/**
 * Main markdown-to-HTML converter.
 * Uses a line-by-line state machine.
 *
 * opts (tùy chọn):
 *   - headings:   mảng để thu thập heading (level ≤ 3) làm mục lục → { level, text, id }
 *   - slugCounts: object đếm slug để khử trùng lặp id giữa các heading trùng tên
 */
function markdownToHtml(md, opts = {}) {
  const lines = md.split('\n');
  const output = [];

  // State
  let inCodeFence = false;
  let codeLang = '';
  let codeLines = [];

  let inTable = false;
  let tableLines = [];

  let inList = false;
  let listLines = [];

  let inBlockquote = false;
  let bqLines = [];

  let inParagraph = false;
  let paraLines = [];

  const flushParagraph = () => {
    if (!inParagraph) return;
    inParagraph = false;
    if (paraLines.length) {
      output.push(`<p>${inlineToHtml(escHtml(paraLines.join(' ')))}</p>`);
    }
    paraLines = [];
  };

  const flushList = () => {
    if (!inList) return;
    inList = false;
    output.push(listToHtml(listLines));
    listLines = [];
  };

  const flushTable = () => {
    if (!inTable) return;
    inTable = false;
    output.push(tableToHtml(tableLines));
    tableLines = [];
  };

  const flushBlockquote = () => {
    if (!inBlockquote) return;
    inBlockquote = false;
    // Bóc `>` phải cho phép KHOẢNG TRẮNG ĐẦU DÒNG: blockquote nằm trong list item được viết
    // thụt lề (`  > ...`). Nhận diện ở dưới test trên `trimmed` nhưng đẩy `line` gốc vào bqLines —
    // nếu ở đây chỉ bóc /^>/ thì dòng thụt lề không đổi → markdownToHtml gọi lại chính nó vô hạn
    // → RangeError, chết cả bản build. (Bug thật, bắt được khi build example 21/07/2026.)
    const inner = bqLines.map(l => l.replace(/^\s*>\s?/, '')).join('\n');
    // Chốt an toàn: nếu vì lý do nào đó nội dung KHÔNG ngắn đi thì không đệ quy nữa —
    // thà render thô còn hơn làm hỏng toàn bộ portal.
    const raw = bqLines.join('\n');
    output.push(`<blockquote>${inner === raw ? escHtml(inner) : markdownToHtml(inner)}</blockquote>`);
    bqLines = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushTable();
    flushBlockquote();
  };

  const isTableSeparator = (line) => /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(line.trim());
  const isTableRow = (line) => /^\|/.test(line.trim()) || (line.includes('|') && line.trim().length > 0);
  const isListItem = (line) => /^(\s{0,3})([-*+]|\d+\.)\s/.test(line);

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx];
    const line = raw; // keep original for code fence content

    // ── Code fence ────────────────────────────────────────────────────────
    if (!inCodeFence && /^```/.test(line.trimStart())) {
      flushAll();
      inCodeFence = true;
      codeLang = line.trimStart().replace(/^```/, '').trim();
      codeLines = [];
      continue;
    }
    if (inCodeFence) {
      if (/^```/.test(line.trimStart())) {
        // Close fence
        inCodeFence = false;
        const content = codeLines.join('\n');
        if (codeLang.toLowerCase() === 'mermaid') {
          // Mermaid renders client-side; keep raw source as fallback if CDN unavailable.
          output.push(`<pre class="mermaid">${escHtmlCode(content)}</pre>`);
        } else {
          const langAttr = codeLang ? ` class="language-${escHtmlCode(codeLang)}"` : '';
          output.push(`<pre><code${langAttr}>${escHtmlCode(content)}</code></pre>`);
        }
        codeLines = [];
        codeLang = '';
      } else {
        codeLines.push(raw);
      }
      continue;
    }

    const trimmed = line.trim();

    // ── Blank line ─────────────────────────────────────────────────────────
    if (trimmed === '') {
      flushAll();
      continue;
    }

    // ── Headings ──────────────────────────────────────────────────────────
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushAll();
      const level = headingMatch[1].length;
      // Cú pháp `## Tiêu đề {#id-tuy-chon}` — id do người viết đặt, dùng cho link trong trang.
      // Không hỗ trợ thì chuỗi `{#sec1}` HIỆN NGUYÊN VĂN trên tiêu đề VÀ trong mục lục sidebar,
      // trông y như lỗi render. Đã xảy ra thật ở bản onepager đầu tiên.
      const idTay = /\s*\{#([A-Za-z][\w-]*)\}\s*$/.exec(headingMatch[2]);
      const text = idTay ? headingMatch[2].slice(0, idTay.index).trim() : headingMatch[2];
      let idAttr = '';
      if (level <= 3) {
        let anchor = idTay ? idTay[1] : slugify(text);
        // Khử trùng lặp id khi có heading trùng tên → anchor & link TOC không đụng nhau
        if (opts.slugCounts) {
          const n = opts.slugCounts[anchor] || 0;
          opts.slugCounts[anchor] = n + 1;
          if (n > 0) anchor = `${anchor}-${n}`;
        }
        idAttr = ` id="${anchor}"`;
        // Thu thập heading để dựng mục lục (TOC) — chỉ khi có collector
        if (opts.headings) {
          const plain = inlineToHtml(escHtml(text)).replace(/<[^>]+>/g, '');
          opts.headings.push({ level, text: plain, id: anchor });
        }
      }
      output.push(`<h${level}${idAttr}>${inlineToHtml(escHtml(text))}</h${level}>`);
      continue;
    }

    // ── Mục lục trong trang ───────────────────────────────────────────────
    // Một đoạn toàn link ngăn bằng "·" xuống dòng thành một khối chữ xanh dày đặc — đúng thứ
    // người đọc thấy là "chưa có layout". Nhận diện đoạn mở đầu bằng "Mục lục:"/"Contents:" rồi
    // bọc thành <nav class="toc-inline"> để CSS xếp thành lưới chip.
    if (/^\s*(?:\*\*)?(?:Mục lục|MỤC LỤC|Contents)\s*[:：](?:\*\*)?/.test(trimmed) && trimmed.includes('](#')) {
      flushAll();
      const thân = trimmed.replace(/^\s*(?:\*\*)?(?:Mục lục|MỤC LỤC|Contents)\s*[:：](?:\*\*)?\s*/, '');
      const mục = thân.split(/\s*·\s*|\s+\|\s+/).map((s) => s.trim()).filter(Boolean);
      output.push(`<nav class="toc-inline" aria-label="Mục lục trang"><span class="toc-inline-label">Mục lục</span><ul>` +
        mục.map((m) => `<li>${inlineToHtml(escHtml(m))}</li>`).join('') + `</ul></nav>`);
      continue;
    }

    // ── Horizontal rule ───────────────────────────────────────────────────
    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed) || /^___+$/.test(trimmed)) {
      // But only if not a table separator line (table sep has pipes)
      if (!trimmed.includes('|')) {
        flushAll();
        output.push('<hr>');
        continue;
      }
    }

    // ── Table ─────────────────────────────────────────────────────────────
    // A table is detected when we see a row line followed by a separator line,
    // or when we're already accumulating table lines.
    if (!inTable && isTableRow(trimmed) && !isListItem(line)) {
      // Peek ahead for separator
      const nextLine = lines[idx + 1] ? lines[idx + 1].trim() : '';
      if (isTableSeparator(nextLine)) {
        flushAll();
        inTable = true;
        tableLines = [line];
        continue;
      }
    }
    if (inTable) {
      if (isTableRow(trimmed) || isTableSeparator(trimmed)) {
        tableLines.push(line);
        continue;
      } else {
        flushTable();
        // Fall through to process current line
      }
    }

    // ── Blockquote ────────────────────────────────────────────────────────
    if (/^>\s?/.test(trimmed)) {
      flushList();
      flushParagraph();
      inBlockquote = true;
      bqLines.push(line);
      continue;
    }
    if (inBlockquote) {
      flushBlockquote();
    }

    // ── List ──────────────────────────────────────────────────────────────
    if (isListItem(line) || (inList && /^\s{2,}/.test(line) && !trimmed.startsWith('#'))) {
      flushParagraph();
      flushTable();
      inList = true;
      listLines.push(line);
      continue;
    }
    if (inList && trimmed) {
      // Continuation line for last list item (non-indented text that follows a list item
      // but isn't a new list item — treat as paragraph continuation, flush list first)
      flushList();
    }

    // ── Paragraph ────────────────────────────────────────────────────────
    inParagraph = true;
    paraLines.push(trimmed);
  }

  // Flush anything remaining
  if (inCodeFence) {
    // Unclosed fence — output as pre anyway
    output.push(`<pre><code>${escHtmlCode(codeLines.join('\n'))}</code></pre>`);
  }
  flushAll();

  return output.join('\n');
}

// ─── FILE PROCESSING ────────────────────────────────────────────────────────

const docs = [];
for (const f of orderedFiles) {
  // Neo + nhãn bỏ tiền tố `Ho-so/`: container này TRONG SUỐT (conventions.md), người đọc portal
  // không cần biết file nằm thư mục nào. Giữ tiền tố còn làm gãy mọi link cũ dạng
  // `portal.html#doc-08-roadmap-md` khi dự án di chuyển tài liệu.
  f.rel = stripHoSo(f.rel);
  const id = 'doc-' + f.rel.replace(/[^a-zA-Z0-9]/g, '-');
  if (f.ext === '.md') {
    const raw = fs.readFileSync(f.abs, 'utf8');
    lintMermaid(raw, f.rel);
    const html = embedImages(markdownToHtml(raw), path.dirname(f.abs));
    docs.push({ ...f, id, html, type: 'md' });
  } else {
    // .html file — just link it separately (not inlined)
    docs.push({ ...f, id, html: null, type: 'html' });
  }
}

// Trang Tổng quan (dashboard) đứng đầu portal — chỉ khi có 00-tracking.md, và KHÔNG ở chế độ --client
// (dashboard tính từ tracking/gaps/cr — thông tin nội bộ, ẩn khỏi portal khách).
// `--single` cũng bỏ qua: chế độ đó render ĐÚNG MỘT file, `docsDir` không được gán (xem nhánh
// singleMode ở đầu file) nên gọi vào docpath sẽ ném ERR_INVALID_ARG_TYPE và giết cả lần build.
const dashHtml = (clientMode || singleMode) ? null : buildDashboard(docsDir);
if (dashHtml) docs.unshift({ rel: '📊 Tổng quan', id: 'doc-dashboard', html: dashHtml, type: 'md' });

// ─── DASHBOARD (Tổng quan) ──────────────────────────────────────────────────
// Trang đầu portal, tự tính từ 00-tracking / 00-gaps / 00-cr / 00-traceability / 10-architecture.
// Không có 00-tracking.md → bỏ qua (portal như cũ).

function buildDashboard(docsDir) {
  // Phải đi qua docpath: `00-gaps.md`/`00-traceability.md` đã chuyển vào `docs/Ho-so/`, còn
  // `00-tracking.md`/`00-cr.md` ở lại gốc. Đọc phẳng thì dashboard vẫn render nhưng MẤT IM LẶNG
  // panel gap + độ phủ truy vết — đúng loại lỗi không ai thấy cho tới lúc cần số.
  const readIf = (n) => require('../../ba-toolkit/scripts/docpath.js').readDoc(docsDir, n);
  const trk = readIf('00-tracking.md');
  if (!trk) return null;

  // 1. Tracking: mỗi dòng màn → đếm ✅/⚠️/⬜ của 9 ô tài liệu + cột dev
  const DOC_COLS = ['ascii', 'brainstorm', 'srs', 'usecase', 'userstory', 'design-spec', 'html', 'test', 'plan'];
  const lines = trk.split('\n');
  const headIdx = lines.findIndex(l => /^\|.*Mã CN/.test(l));
  const screens = [];
  if (headIdx >= 0) {
    const heads = lines[headIdx].split('|').map(s => s.trim()).filter(Boolean);
    const col = (name) => heads.indexOf(name);
    for (let i = headIdx + 2; i < lines.length && /^\|/.test(lines[i]); i++) {
      const c = lines[i].split('|').map(s => s.trim()); c.shift(); c.pop();
      const cells = DOC_COLS.map(n => c[col(n)] || '⬜');
      screens.push({
        ma: c[col('Mã CN')] || '', ten: c[col('Màn hình')] || '', dev: c[col('dev')] || '⬜',
        done: cells.filter(x => x === '✅').length, warn: cells.filter(x => x === '⚠️').length,
        capNhat: c[col('Cập nhật cuối')] || '—',
      });
    }
  }
  if (!screens.length) return null;
  const cellTotal = screens.length * DOC_COLS.length;
  const cellDone = screens.reduce((a, s) => a + s.done, 0);
  const pct = Math.round(100 * cellDone / cellTotal);
  const devDone = screens.filter(s => s.dev === '✅').length;

  // 2. Gaps (chỉ dòng bảng | Gxx |), CR mở, coverage RTM, ADR
  const gapRows = readIf('00-gaps.md').split('\n').filter(l => /^\|\s*G\d+\s*\|/.test(l));
  const gRed = gapRows.filter(l => l.includes('🔴')).length, gYel = gapRows.filter(l => l.includes('🟡')).length;
  // 🟠 = nợ có hạn: đếm riêng, KHÔNG cộng vào "Gap mở" — nó không chặn bước hiện tại (conventions → Quy ước gate)
  const gOrg = gapRows.filter(l => l.includes('🟠')).length;
  const crRows = readIf('00-cr.md').split('\n').filter(l => /^\|\s*CR-\d+/.test(l));
  const crOpen = crRows.filter(l => !/Đóng|Từ chối/.test(l)).length;
  const rtm = readIf('00-traceability.md');
  const covs = [...rtm.matchAll(/\*\*([^*]+?):\*\*\s*(\d+)\/(\d+)\s*\((\d+)%\)/g)].map(m => ({ tên: m[1], pct: +m[4] }));
  const arch = readIf('10-architecture.md');
  const adrAll = new Set((arch.match(/ADR-\d+/g) || [])).size;
  const adrOk = (arch.match(/Trạng thái:\*{0,2}\s*Accepted/gi) || []).length;

  const card = (label, value, sub, href) => `<a class="dash-card" href="${href || '#'}"><div class="dash-num">${value}</div><div class="dash-label">${escHtml(label)}</div>${sub ? `<div class="dash-sub">${escHtml(sub)}</div>` : ''}</a>`;
  const link = (n) => '#doc-' + (n + '.md').replace(/[^a-zA-Z0-9]/g, '-');
  let cards = card('Tiến độ tài liệu', pct + '%', `${cellDone}/${cellTotal} ô ✅`, link('00-tracking'));
  cards += card('Màn hình', screens.length, `${screens.filter(s => s.done === DOC_COLS.length && !s.warn).length} đủ 9/9 · ${screens.filter(s => s.warn).length} ⚠️`, link('00-tracking'));
  cards += card('Dev', `${devDone}/${screens.length}`, 'màn đã có code ✅', link('00-tracking'));
  if (gapRows.length || readIf('00-gaps.md')) cards += card('Gap mở', `${gRed + gYel}`, `🔴 ${gRed} · 🟡 ${gYel}${gOrg ? ` · 🟠 ${gOrg} nợ` : ''}`, link('00-gaps'));
  if (crRows.length) cards += card('CR đang mở', crOpen, `tổng ${crRows.length} CR`, link('00-cr'));
  if (covs.length) cards += card('Truy vết (RTM)', Math.min(...covs.map(c => c.pct)) + '%', 'cạnh thấp nhất', link('00-traceability'));
  if (adrAll) cards += card('ADR kiến trúc', `${adrOk}/${adrAll}`, adrOk === adrAll ? 'đã chốt (Accepted)' : '⚠️ còn Draft', link('10-architecture'));

  const rows = screens.map(s => {
    const p = Math.round(100 * s.done / DOC_COLS.length);
    return `<tr><td>${escHtml(s.ma)}</td><td>${escHtml(s.ten)}</td><td><div class="dash-bar"><div class="dash-bar-fill${s.warn ? ' warn' : ''}" style="width:${p}%"></div></div></td><td>${s.done}/${DOC_COLS.length}${s.warn ? ' · ⚠️' + s.warn : ''}</td><td>${s.dev}</td><td>${escHtml(s.capNhat)}</td></tr>`;
  }).join('\n');

  return `<div class="dash-cards">${cards}</div>
<div class="dash-progress"><div class="dash-bar big"><div class="dash-bar-fill" style="width:${pct}%"></div></div><span>${pct}% tài liệu hoàn tất</span></div>
<h2>Trạng thái từng màn</h2>
<table><thead><tr><th>Mã CN</th><th>Màn hình</th><th>Tiến độ</th><th>Tài liệu</th><th>dev</th><th>Cập nhật cuối</th></tr></thead><tbody>
${rows}
</tbody></table>
<p class="dash-note">Số liệu tự tính từ <code>00-tracking.md</code> · <code>00-gaps.md</code> · <code>00-cr.md</code> · <code>00-traceability.md</code> · <code>10-architecture.md</code> lúc build portal.</p>`;
}

const DASH_CSS = `
.dash-cards { display: flex; flex-wrap: wrap; gap: 12px; margin: 16px 0 20px; }
.dash-card { flex: 1 1 140px; min-width: 140px; max-width: 220px; padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 10px; text-decoration: none; color: inherit; background: #fff; transition: box-shadow .15s, transform .15s; }
.dash-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,.08); transform: translateY(-1px); }
.dash-num { font-size: 1.7rem; font-weight: 700; color: #2563eb; line-height: 1.2; }
.dash-label { font-weight: 600; margin-top: 2px; }
.dash-sub { font-size: .8rem; color: #64748b; margin-top: 2px; }
.dash-progress { display: flex; align-items: center; gap: 12px; margin: 0 0 8px; }
.dash-progress span { font-size: .85rem; color: #475569; white-space: nowrap; }
.dash-bar { width: 120px; height: 8px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
.dash-bar.big { flex: 1; height: 12px; }
.dash-bar-fill { height: 100%; background: #16a34a; border-radius: 99px; }
.dash-bar-fill.warn { background: #ca8a04; }
.dash-note { font-size: .8rem; color: #94a3b8; margin-top: 10px; }
`;

// ─── SIDEBAR NAV BUILDER ────────────────────────────────────────────────────

function buildNav(docs) {
  // Top-level items
  const topItems = docs.filter(f => !f.rel.includes(path.sep));
  // Grouped items
  const groupMap = {};
  for (const f of docs.filter(f => f.rel.includes(path.sep))) {
    const parts = f.rel.split(path.sep);
    const group = parts.slice(0, -1).join('/').replace(/^Screen-spec\//, ''); // container trong suốt — không hiện trong nhãn nav
    if (!groupMap[group]) groupMap[group] = [];
    groupMap[group].push(f);
  }

  const topLabel = (f) => path.basename(f.rel).toLowerCase() === '00-introduction.md'
    ? 'Giới thiệu (Introduction)' : f.rel.replace(/\.md$/i, '');
  const topLi = (f) => f.type === 'html'
    ? `<li class="nav-item nav-html"><a href="${f.rel}" target="_blank">${escHtml(f.rel)}</a></li>\n`
    : `<li class="nav-item" data-target="${f.id}"><a href="#${f.id}">${escHtml(topLabel(f))}</a></li>\n`;

  // Nhóm "Introduction" (5 doc discovery nguồn) hiển thị thành 1 nhóm nav ở đầu (chỉ full mode có 5 doc này).
  const isIntro = (f) => INTRO_RAW.has(path.basename(f.rel).toLowerCase());
  const introItems = topItems.filter(isIntro);
  const restItems = topItems.filter(f => !isIntro(f));

  let nav = '';
  if (introItems.length) {
    nav += '<div class="nav-group">\n<div class="nav-group-title">Introduction</div>\n<ul>\n';
    for (const f of introItems) nav += topLi(f);
    nav += '</ul>\n</div>\n';
  }
  nav += '<ul class="nav-top">\n';
  for (const f of restItems) nav += topLi(f);
  nav += '</ul>\n';

  for (const group of Object.keys(groupMap).sort()) {
    nav += `<div class="nav-group">\n<div class="nav-group-title">${escHtml(group)}</div>\n<ul>\n`;
    for (const f of groupMap[group]) {
      if (f.type === 'html') {
        nav += `<li class="nav-item nav-html"><a href="${f.rel}" target="_blank">${escHtml(path.basename(f.rel))}</a></li>\n`;
      } else {
        const name = path.basename(f.rel).replace(/\.md$/i, '');
        nav += `<li class="nav-item" data-target="${f.id}"><a href="#${f.id}">${escHtml(name)}</a></li>\n`;
      }
    }
    nav += '</ul>\n</div>\n';
  }

  return nav;
}

// ─── INLINE CSS ─────────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; height: 100%; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.65;
  color: #1a1a2e;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
/* ── Header ── */
#site-header {
  background: #16213e;
  color: #e0e0e0;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
#site-header h1 { font-size: 1.1rem; font-weight: 600; color: #a8d8f0; }
#site-header .timestamp { font-size: 0.75rem; color: #888; }

/* ── Hamburger toggle (ẩn trên desktop, chỉ hiện trên mobile) ── */
#nav-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  width: 38px;
  height: 38px;
  padding: 8px;
  margin-right: 4px;
  background: transparent;
  border: 1px solid #2a3a5e;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
}
#nav-toggle span {
  display: block;
  height: 2px;
  width: 100%;
  background: #a8d8f0;
  border-radius: 2px;
  transition: transform 0.2s, opacity 0.2s;
}
body.nav-open #nav-toggle span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
body.nav-open #nav-toggle span:nth-child(2) { opacity: 0; }
body.nav-open #nav-toggle span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

/* ── Lớp phủ nền khi mở menu trên mobile ── */
#sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 90;
}

/* ── Layout ── */
#layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* ── Sidebar ── */
/* Nền SÁNG (đổi 10/09/2026, đồng bộ với chế độ --single). Bản cũ #1a1a2e gần đen: một dải tối
   cao bằng màn hình nằm sát vùng nội dung trắng gây tương phản chói ở rìa mắt khi đọc lâu. */
#sidebar {
  width: 260px;
  min-width: 220px;
  background: #f4f6fa;
  color: #33415c;
  overflow-y: auto;
  flex-shrink: 0;
  min-height: 0;
  padding: 12px 0;
  border-right: 1px solid #dde3ec;
}
#sidebar::-webkit-scrollbar { width: 5px; }
#sidebar::-webkit-scrollbar-track { background: #f4f6fa; }
#sidebar::-webkit-scrollbar-thumb { background: #c3ccdb; border-radius: 3px; }

.nav-top { list-style: none; padding: 0 0 8px; }
.nav-group { border-top: 1px solid #e4e9f2; padding: 8px 0 4px; }
.nav-group-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7c8aa5;
  padding: 6px 16px 4px;
}
.nav-group ul { list-style: none; }
.nav-item a {
  display: block;
  padding: 5px 16px 5px 20px;
  color: #44546f;
  text-decoration: none;
  font-size: 0.82rem;
  border-left: 3px solid transparent;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nav-item a:hover { background: #e6ecf6; color: #16213e; }
.nav-item.active a {
  background: #e2ecfb;
  color: #14539a;
  border-left-color: #4a90d9;
  font-weight: 600;
}

/* Mục lục ĐẦU TRANG (khối <nav class="toc-inline"> do markdownToHtml sinh ra) */
.toc-inline { margin: 1.4em 0 1.8em; padding: 14px 18px 16px; background: #f7f9fc; border: 1px solid #e2e8f2; border-radius: 8px; }
.toc-inline-label { display: block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: #7c8aa5; margin-bottom: 10px; }
.toc-inline ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 4px 14px; }
.toc-inline li { margin: 0; }
.toc-inline a { display: block; padding: 4px 8px; border-radius: 5px; color: #2c3a52; text-decoration: none; font-size: 0.87rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.toc-inline a:hover { background: #e6ecf6; color: #14539a; text-decoration: none; }
@media (max-width: 600px) { .toc-inline ul { grid-template-columns: 1fr 1fr; } }
.nav-html a { color: #88aacc; font-style: italic; }

/* ── Main content ── */
#content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0;
  background: #f8f9fa;
}
#content::-webkit-scrollbar { width: 8px; }
#content::-webkit-scrollbar-track { background: #f0f0f0; }
#content::-webkit-scrollbar-thumb { background: #c0c0c0; border-radius: 4px; }

.doc-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 48px 60px;
  border-bottom: 2px solid #e0e0e0;
}
.doc-section:last-child { border-bottom: none; }
.doc-section-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #999;
  margin-bottom: 20px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e8e8e8;
}

/* ── Typography ── */
h1,h2,h3,h4,h5,h6 { line-height: 1.3; margin-top: 1.6em; margin-bottom: 0.5em; color: #16213e; }
h1 { font-size: 1.9rem; border-bottom: 2px solid #d0d8e8; padding-bottom: 0.3em; }
h2 { font-size: 1.45rem; border-bottom: 1px solid #e8edf5; padding-bottom: 0.25em; }
h3 { font-size: 1.15rem; }
h4 { font-size: 1rem; }
h5, h6 { font-size: 0.9rem; }
.doc-section > *:first-child { margin-top: 0; }
p { margin: 0.75em 0; }
a { color: #2a6496; }
a:hover { text-decoration: underline; }
strong { font-weight: 700; }
em { font-style: italic; }
hr { border: none; border-top: 1px solid #dde3ec; margin: 1.5em 0; }
blockquote {
  border-left: 4px solid #4a90d9;
  background: #f0f6ff;
  margin: 1em 0;
  padding: 10px 16px;
  color: #445;
  border-radius: 0 4px 4px 0;
}

/* ── Code ── */
code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.85em;
  background: #eef1f6;
  padding: 2px 5px;
  border-radius: 3px;
  color: #c7254e;
}
pre {
  background: #1e2030;
  color: #cdd6f4;
  border-radius: 6px;
  padding: 16px 20px;
  overflow-x: auto;
  margin: 1em 0;
  line-height: 1.5;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.83rem;
  white-space: pre;
  tab-size: 2;
}
pre code {
  background: none;
  padding: 0;
  color: inherit;
  font-size: inherit;
  border-radius: 0;
}
/* ── Mermaid diagrams (render client-side; fallback = source) ── */
pre.mermaid {
  background: #ffffff;
  color: #334;
  border: 1px solid #e4e4ec;
  text-align: center;
  padding: 14px;
}
pre.mermaid svg { max-width: 100%; height: auto; }

/* ── Tables ── */
table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: 0.9rem;
}
th, td {
  border: 1px solid #d0d8e4;
  padding: 8px 14px;
  text-align: left;
  vertical-align: top;
}
th {
  background: #e8edf5;
  font-weight: 700;
  color: #16213e;
}
tr:nth-child(even) td { background: #f5f7fa; }

/* ── Lists ── */
ul, ol { padding-left: 1.6em; margin: 0.6em 0; }
li { margin: 0.25em 0; }
li > ul, li > ol { margin: 0.2em 0; }
.checkbox { font-size: 1.1em; }

/* ── Responsive ── */
@media (max-width: 768px) {
  #nav-toggle { display: flex; }
  #site-header h1 { font-size: 0.95rem; }
  #site-header .timestamp { display: none; }

  /* Sidebar thành drawer trượt từ trái, mặc định ẩn ngoài màn hình */
  #sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 78%;
    max-width: 300px;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: 2px 0 12px rgba(0,0,0,0.4);
    padding-top: 16px;
  }
  body.nav-open #sidebar { transform: translateX(0); }
  body.nav-open #sidebar-overlay { display: block; }

  .doc-section { padding: 24px 20px 40px; }
}
`;

// ─── INLINE JS ──────────────────────────────────────────────────────────────

const JS = `
(function() {
  var content = document.getElementById('content');
  var navItems = document.querySelectorAll('.nav-item[data-target]');
  var sections = document.querySelectorAll('.doc-section[id]');

  // ── Toggle menu trên mobile ──
  var toggle = document.getElementById('nav-toggle');
  var overlay = document.getElementById('sidebar-overlay');
  function openNav() {
    document.body.classList.add('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    if (overlay) overlay.hidden = false;
  }
  function closeNav() {
    document.body.classList.remove('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (overlay) overlay.hidden = true;
  }
  if (toggle) {
    toggle.addEventListener('click', function() {
      if (document.body.classList.contains('nav-open')) closeNav();
      else openNav();
    });
  }
  if (overlay) overlay.addEventListener('click', closeNav);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeNav();
  });

  // Click: scroll to section
  navItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
      var target = document.getElementById(item.dataset.target);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActive(item.dataset.target);
        closeNav(); // đóng drawer sau khi chọn mục (mobile)
      }
    });
  });
  // Đóng menu khi mở một file .html (link target=_blank) trên mobile
  document.querySelectorAll('.nav-html a').forEach(function(a) {
    a.addEventListener('click', closeNav);
  });

  // Scrollspy
  function setActive(id) {
    navItems.forEach(function(n) {
      n.classList.toggle('active', n.dataset.target === id);
    });
  }

  var scrollTimer = null;
  content.addEventListener('scroll', function() {
    if (scrollTimer) return;
    scrollTimer = setTimeout(function() {
      scrollTimer = null;
      var scrollTop = content.scrollTop;
      var best = null;
      sections.forEach(function(sec) {
        if (sec.offsetTop - 60 <= scrollTop) {
          best = sec.id;
        }
      });
      if (best) setActive(best);
    }, 50);
  });

  // Activate first item on load
  if (navItems.length) {
    setActive(navItems[0].dataset.target);
  }
})();
`;

// ─── SINGLE-FILE MODE ────────────────────────────────────────────────────────
// Render ONE markdown file to a clean standalone HTML (no portal sidebar/chrome).

if (singleMode) {
  // Style nội dung (typography, code, bảng, list…) dùng chung cho cả 2 bố cục.
  const DOC_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; }
h1,h2,h3,h4,h5,h6 { line-height: 1.3; margin-top: 1.6em; margin-bottom: 0.5em; color: #16213e; }
h1 { font-size: 1.9rem; border-bottom: 2px solid #d0d8e8; padding-bottom: 0.3em; }
h2 { font-size: 1.45rem; border-bottom: 1px solid #e8edf5; padding-bottom: 0.25em; }
h3 { font-size: 1.15rem; } h4 { font-size: 1rem; } h5, h6 { font-size: 0.9rem; }
.article > *:first-child { margin-top: 0; }
p { margin: 0.75em 0; } a { color: #2a6496; } a:hover { text-decoration: underline; }
strong { font-weight: 700; } em { font-style: italic; }
hr { border: none; border-top: 1px solid #dde3ec; margin: 1.5em 0; }
blockquote { border-left: 4px solid #4a90d9; background: #f0f6ff; margin: 1em 0; padding: 10px 16px; color: #445; border-radius: 0 4px 4px 0; }
code { font-family: "SFMono-Regular", Consolas, Menlo, monospace; font-size: 0.85em; background: #eef1f6; padding: 2px 5px; border-radius: 3px; color: #c7254e; }
pre { background: #1e2030; color: #cdd6f4; border-radius: 6px; padding: 16px 20px; overflow-x: auto; margin: 1em 0; line-height: 1.5; font-family: "SFMono-Regular", Consolas, Menlo, monospace; font-size: 0.83rem; white-space: pre; tab-size: 2; }
pre code { background: none; padding: 0; color: inherit; font-size: inherit; border-radius: 0; }
pre.mermaid { background: #fff; color: #334; border: 1px solid #e4e4ec; text-align: center; padding: 14px; }
pre.mermaid svg { max-width: 100%; height: auto; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.9rem; }
th, td { border: 1px solid #d0d8e4; padding: 8px 14px; text-align: left; vertical-align: top; }
th { background: #e8edf5; font-weight: 700; color: #16213e; }
tr:nth-child(even) td { background: #f5f7fa; }
ul, ol { padding-left: 1.6em; margin: 0.6em 0; } li { margin: 0.25em 0; }
.checkbox { font-size: 1.1em; }
`;

  // Bố cục ĐƠN GIẢN — dùng khi không có TOC (article căn giữa như bản gốc).
  const SIMPLE_LAYOUT_CSS = `
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.65; color: #1a1a2e; background: #f8f9fa; padding: 40px 16px; }
.article { max-width: 860px; margin: 0 auto; background: #fff; border: 1px solid #e4e8ef; border-radius: 8px; padding: 40px 48px 56px; box-shadow: 0 2px 16px rgba(0,0,0,0.05); }
@media (max-width: 700px) { .article { padding: 24px 18px 36px; } }
`;

  // Bố cục kiểu PORTAL — header tối + sidebar TOC tối cố định + vùng nội dung cuộn riêng.
  const PORTAL_LAYOUT_CSS = `
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.65; color: #1a1a2e; background: #f8f9fa; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
#site-header { background: #16213e; color: #e0e0e0; padding: 12px 24px; display: flex; align-items: center; gap: 12px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
#site-header h1 { font-size: 1.1rem; font-weight: 600; color: #a8d8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#nav-toggle { display: none; flex-direction: column; justify-content: center; gap: 4px; width: 38px; height: 38px; padding: 8px; background: transparent; border: 1px solid #2a3a5e; border-radius: 6px; cursor: pointer; flex-shrink: 0; }
#nav-toggle span { display: block; height: 2px; width: 100%; background: #a8d8f0; border-radius: 2px; transition: transform .2s, opacity .2s; }
body.nav-open #nav-toggle span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
body.nav-open #nav-toggle span:nth-child(2) { opacity: 0; }
body.nav-open #nav-toggle span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
#sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 90; }
#layout { display: flex; flex: 1; overflow: hidden; min-height: 0; }
/* Sidebar nền SÁNG (đổi 10/09/2026). Bản cũ nền #1a1a2e gần đen: với một tài liệu đọc liên
   tục hàng chục phút, một dải tối cao bằng màn hình nằm cạnh vùng nội dung trắng tạo tương phản
   chói ở rìa mắt. Nền sáng cùng tông với vùng đọc, phân tách bằng đường viền + chữ đậm nhạt. */
#sidebar { width: 280px; min-width: 240px; background: #f4f6fa; color: #33415c; overflow-y: auto; flex-shrink: 0; min-height: 0; padding: 12px 0; border-right: 1px solid #dde3ec; }
#sidebar::-webkit-scrollbar { width: 5px; }
#sidebar::-webkit-scrollbar-track { background: #f4f6fa; }
#sidebar::-webkit-scrollbar-thumb { background: #c3ccdb; border-radius: 3px; }
.toc-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #7c8aa5; padding: 6px 16px 8px; }
.toc-nav { list-style: none; margin: 0; padding: 0; }
.toc-nav li { margin: 0; }
.toc-nav a { display: block; padding: 5px 16px 5px 20px; color: #44546f; text-decoration: none; font-size: 0.82rem; border-left: 3px solid transparent; transition: background .15s, color .15s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.toc-nav a:hover { background: #e6ecf6; color: #16213e; text-decoration: none; }
.toc-nav a.active { background: #e2ecfb; color: #14539a; border-left-color: #4a90d9; font-weight: 600; }
.toc-l0 a { padding-left: 20px; font-weight: 600; color: #2c3a52; }
.toc-l1 a { padding-left: 34px; font-size: 0.8rem; }
.toc-l2 a { padding-left: 48px; font-size: 0.78rem; color: #6b7a94; }

/* Mục lục ĐẦU TRANG — lưới chip, không phải một khối link xuống dòng loạn xạ. */
.toc-inline { margin: 1.4em 0 1.8em; padding: 14px 18px 16px; background: #f7f9fc; border: 1px solid #e2e8f2; border-radius: 8px; }
.toc-inline-label { display: block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: #7c8aa5; margin-bottom: 10px; }
.toc-inline ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 4px 14px; }
.toc-inline li { margin: 0; }
.toc-inline a { display: block; padding: 4px 8px; border-radius: 5px; color: #2c3a52; text-decoration: none; font-size: 0.87rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.toc-inline a:hover { background: #e6ecf6; color: #14539a; text-decoration: none; }
@media (max-width: 600px) { .toc-inline ul { grid-template-columns: 1fr 1fr; } }
#content { flex: 1; overflow-y: auto; min-height: 0; background: #f8f9fa; padding: 40px 16px; }
#content::-webkit-scrollbar { width: 8px; }
#content::-webkit-scrollbar-track { background: #f0f0f0; }
#content::-webkit-scrollbar-thumb { background: #c0c0c0; border-radius: 4px; }
.article { max-width: 860px; margin: 0 auto; background: #fff; border: 1px solid #e4e8ef; border-radius: 8px; padding: 40px 48px 56px; box-shadow: 0 2px 16px rgba(0,0,0,0.05); }
@media (max-width: 768px) {
  #nav-toggle { display: flex; }
  #site-header h1 { font-size: 0.95rem; }
  #sidebar { position: fixed; top: 0; left: 0; height: 100%; width: 78%; max-width: 300px; z-index: 100; transform: translateX(-100%); transition: transform 0.25s ease; box-shadow: 2px 0 12px rgba(0,0,0,0.4); padding-top: 16px; }
  body.nav-open #sidebar { transform: translateX(0); }
  body.nav-open #sidebar-overlay { display: block; }
  #content { padding: 20px 12px 36px; }
  .article { padding: 24px 18px 36px; }
}
`;

  const raw = fs.readFileSync(singleInput, 'utf8');
  lintMermaid(raw, path.basename(singleInput));
  const headings = [];
  const bodyHtml = embedImages(
    markdownToHtml(raw, { headings, slugCounts: {} }),
    path.dirname(singleInput)
  );
  const title = path.basename(singleInput).replace(/\.md$/i, '');
  const MERMAID_SCRIPT = mermaidInline(bodyHtml);

  // ── Mục lục (TOC) theo heading ──
  // Dựng khi có ≥ 2 heading (level ≤ 3) và không tắt bằng --no-toc. Khi có TOC → bố cục
  // kiểu portal (header + sidebar tối cố định + nội dung cuộn riêng) cho dễ nhìn; kèm
  // scrollspy, smooth-scroll và drawer mobile. Không có TOC → article căn giữa như cũ.
  const tocHeadings = headings.filter(h => h.level <= 3);
  const showToc = !noToc && tocHeadings.length >= 2;

  const articleBlock = `<article class="article">
${bodyHtml}
</article>`;

  let bodyInner, LAYOUT_CSS, TOC_JS = '';
  if (showToc) {
    LAYOUT_CSS = PORTAL_LAYOUT_CSS;
    const minLevel = Math.min(...tocHeadings.map(h => h.level));
    const tocItems = tocHeadings.map(h =>
      `<li class="toc-l${h.level - minLevel}"><a href="#${h.id}" data-target="${h.id}">${h.text}</a></li>`
    ).join('\n');
    // Tên hiển thị trên header: heading cấp 1 đầu tiên nếu có, không thì tên file.
    const firstH1 = headings.find(h => h.level === 1);
    const headerTitle = firstH1 ? firstH1.text : escHtml(title);

    bodyInner = `<header id="site-header">
  <button id="nav-toggle" aria-label="Hiện/ẩn mục lục" aria-expanded="false" aria-controls="sidebar">
    <span></span><span></span><span></span>
  </button>
  <h1>${headerTitle}</h1>
</header>
<div id="layout">
  <div id="sidebar-overlay" hidden></div>
  <nav id="sidebar">
    <div class="toc-title">Mục lục</div>
    <ul class="toc-nav">
${tocItems}
    </ul>
  </nav>
  <main id="content">
${articleBlock}
  </main>
</div>`;

    TOC_JS = `<script>
(function(){
  var content = document.getElementById('content');
  var links = [].slice.call(document.querySelectorAll('.toc-nav a[data-target]'));
  var toggle = document.getElementById('nav-toggle');
  var overlay = document.getElementById('sidebar-overlay');
  function openNav(){ document.body.classList.add('nav-open'); if(toggle) toggle.setAttribute('aria-expanded','true'); if(overlay) overlay.hidden=false; }
  function closeNav(){ document.body.classList.remove('nav-open'); if(toggle) toggle.setAttribute('aria-expanded','false'); if(overlay) overlay.hidden=true; }
  if(toggle) toggle.addEventListener('click', function(){ document.body.classList.contains('nav-open') ? closeNav() : openNav(); });
  if(overlay) overlay.addEventListener('click', closeNav);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeNav(); });
  function setActive(id){ links.forEach(function(a){ a.classList.toggle('active', a.getAttribute('data-target')===id); }); }
  links.forEach(function(a){
    a.addEventListener('click', function(e){
      var t = document.getElementById(a.getAttribute('data-target'));
      if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth', block:'start'}); history.replaceState(null,'','#'+a.getAttribute('data-target')); setActive(a.getAttribute('data-target')); closeNav(); }
    });
  });
  var ticking=false;
  function onScroll(){
    if(ticking) return; ticking=true;
    requestAnimationFrame(function(){
      ticking=false;
      var base = content.getBoundingClientRect().top;
      var best=null, bestTop=-Infinity;
      links.forEach(function(a){
        var t = document.getElementById(a.getAttribute('data-target'));
        if(!t) return;
        var rel = t.getBoundingClientRect().top - base - 12;
        if(rel<=0 && rel>bestTop){ bestTop=rel; best=a.getAttribute('data-target'); }
      });
      if(best) setActive(best);
    });
  }
  content.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
  if(links.length) setActive(links[0].getAttribute('data-target'));
})();
</script>
`;
  } else {
    LAYOUT_CSS = SIMPLE_LAYOUT_CSS;
    bodyInner = articleBlock;
  }

  const single = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)}</title>
<style>
${DOC_CSS}${LAYOUT_CSS}${LIGHTBOX_CSS}
</style>
</head>
<body>
${bodyInner}
${MERMAID_SCRIPT}
${TOC_JS}
<script>${LIGHTBOX_JS}</script>
</body>
</html>
`;

  const outDir = path.dirname(outFile);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, single, 'utf8');
  console.log(`Single page written to: ${outFile}`);
  console.log(`  Source: ${singleInput}`);
  console.log(`  TOC: ${showToc ? tocHeadings.length + ' heading' : (noToc ? 'tat (--no-toc)' : 'khong (it hon 2 heading)')}`);
  console.log(`  Output size: ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB`);
  reportMermaidWarnings();
  process.exit(0);
}

// ─── HTML ASSEMBLY ───────────────────────────────────────────────────────────

const timestamp = new Date().toISOString();
const projectTitle = path.basename(docsDir);

const navHtml = buildNav(docs);

let sectionsHtml = '';
for (const doc of docs) {
  if (doc.type === 'html') continue; // skip .html from inline content
  sectionsHtml += `<section class="doc-section" id="${doc.id}">\n`;
  sectionsHtml += `<div class="doc-section-title">${escHtml(doc.rel)}</div>\n`;
  sectionsHtml += doc.html + '\n';
  sectionsHtml += `</section>\n`;
}

const portal = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(projectTitle)} — Documentation Portal</title>
<style>
${CSS}${DASH_CSS}${LIGHTBOX_CSS}
</style>
</head>
<body>
<header id="site-header">
  <button id="nav-toggle" aria-label="Hiện/ẩn menu" aria-expanded="false" aria-controls="sidebar">
    <span></span><span></span><span></span>
  </button>
  <h1>${escHtml(projectTitle)} — Documentation Portal</h1>
  <span class="timestamp">Generated: ${timestamp}</span>
</header>
<div id="layout">
  <div id="sidebar-overlay" hidden></div>
  <nav id="sidebar">
${navHtml}
  </nav>
  <main id="content">
${sectionsHtml}
  </main>
</div>
<script>
${JS}
</script>
${mermaidInline(sectionsHtml)}
<script>${LIGHTBOX_JS}</script>
</body>
</html>
`;

// ─── WRITE OUTPUT ────────────────────────────────────────────────────────────

const outDir = path.dirname(outFile);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outFile, portal, 'utf8');
console.log(`Portal written to: ${outFile}`);
console.log(`  Files included: ${docs.filter(d => d.type === 'md').length} markdown, ${docs.filter(d => d.type === 'html').length} html links`);
if (skippedForeign > 0) {
  console.log(`  Bo qua ${skippedForeign} file ngoai bo BA toolkit (folder la nhu superpowers/, session-notes/). Dung --all de gom het.`);
}
console.log(`  Output size: ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB`);

// Mốc "portal đầu tiên của dự án thật" (M7, ba-start/scripts/ledger.js): dự án đã đi qua ba-start (có .claude/ba-start.json ở
// thư mục cha của docs/) và đây không phải bộ demo → đóng firstPortalAt một lần. Thiếu ba-start hay lỗi sổ → im (không chặn portal).
try {
  const gốcDựÁn = path.dirname(path.resolve(docsDir));
  const sổ = path.join(__dirname, '..', '..', 'ba-start', 'scripts', 'ledger.js');
  if (path.basename(gốcDựÁn) !== 'veriline-demo' && fs.existsSync(sổ)) {
    const ledger = require(sổ);
    if (ledger.có(gốcDựÁn)) { const r = ledger.mark(gốcDựÁn, 'firstPortalAt'); if (r.mới) console.log('  Mốc: portal đầu tiên của dự án — đã ghi vào .claude/ba-start.json'); }
  }
} catch { /* sổ vào cửa là phụ — không bao giờ làm hỏng lệnh dựng portal */ }
if (clientMode && !fs.existsSync(path.join(docsDir, '00-introduction.md'))) {
  console.warn('  ⚠️  --client nhưng thiếu docs/00-introduction.md → portal khách KHÔNG có phần Giới thiệu. Hãy tổng hợp 00-introduction.md (gộp brainstorm/vision/personas/process/urd) trước — xem ba-portal/SKILL.md.');
}
reportMermaidWarnings();
