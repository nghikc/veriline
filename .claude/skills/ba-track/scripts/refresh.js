#!/usr/bin/env node
/*
 * ba-track/refresh.js — cơ giới hóa chế độ Refresh của ba-track (zero-dependency).
 * Quét folder màn trong docs/ → dựng lại bảng 00-tracking.md đúng hiện trạng file:
 *   - Ô tài liệu: file thiếu = ⬜; file có = ✅ (nhưng GIỮ ⚠️ hiện có — chỉ người/LLM được hạ ⚠️→✅).
 *   - Cột e2e: map ra script E2E (`e2e/tests/<Mã>-<Tên>.spec.ts` ở gốc dự án, hoặc bố cục cũ trong
 *     folder màn — hỏi ba-toolkit/e2epath.js) nhưng KHÔNG tính vào 9/9 hoàn thành (artifact code
 *     như dev); giữ ⚠️.
 *   - Cột dev: KHÔNG map ra file — giữ nguyên giá trị (dev-run quản); dòng mới = ⬜.
 *   - Cột figma (TÙY CHỌN, canon `tracking.optional.cols`): chỉ có khi bảng cũ đã có (figma-sync.js thêm ở lần đẩy Figma
 *     đầu) — giữ nguyên giá trị như dev (chủ sở hữu: ba-figma-draw/scripts/figma-sync.js), đặt ngay sau `html`; dòng mới = ⬜;
 *     KHÔNG tính vào "Hoàn thành". Dự án không dùng Figma không bao giờ thấy cột này.
 *   - Giữ nguyên Mã CN / Chức năng / Nhóm / Màn hình của dòng cũ; folder mới → thêm dòng, Mã CN = "?".
 *   - "Cập nhật cuối" = mtime mới nhất của file trong folder màn (YYYY-MM-DD); không có file → giữ giá trị cũ.
 *   - Trạng thái: đủ bộ file của HỒ SƠ (`full`/`lite` 9 · `mini` 5) ✅ = "Hoàn thành" · có ⚠️ = "Cần cập nhật" · 0 file = "Chưa bắt đầu" · còn lại = "Đang làm".
 * Phần còn lại cho LLM/người: điền Mã CN dòng mới, hạ ⚠️, chế độ Sync-on-change.
 *
 * Dùng:  node .claude/skills/ba-track/scripts/refresh.js [docsDir=docs] [--dry] [--force]
 * Exit:  0 = OK (kể cả có thay đổi); 2 = lỗi vận hành / từ chối ghi vì sẽ mất dòng.
 *
 * KHÔNG ĐƯỢC LÀM MẤT CHỮ NGƯỜI VIẾT (25/09/2026 — chạy trên bản sao 3 dự án thật: dự án helpdesk 144 → 29 dòng,
 * dự án desktop 114 → 42, dự án e-learning 159 → 125, cả ba in "Không có thay đổi"). Bốn đường mất, nay đều giữ:
 *   1. mọi thứ SAU bảng (bot: 115 dòng "Tài liệu cấp hệ thống", ghi chú phạm vi) — chép nguyên;
 *   2. dòng bảng KHÔNG có mã màn (dự án desktop `docs/Sidebar/SideRail/`) — giữ nguyên văn cuối bảng;
 *   3. cột người tự thêm ngoài HEADER — giữ, đặt trước `Trạng thái`; cột `Chức năng` không tự thêm nếu bảng cũ không có;
 *   4. ô `Trạng thái` "Hoàn thành — 5/5 tài liệu áp dụng (4 cột N/A)" — chỉ thay NHÃN đầu ô, giữ ghi chú; không hạ
 *      `Hoàn thành` → `Đang làm` khi các ô ⬜ vẫn đúng là những ô ⬜ người đã chấp nhận lúc chấm hoàn thành.
 *   Tách ô theo code span (`a|b`) và `\|` — cùng luật `ba-toolkit/scripts/ledger.js` `cellsOf`.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2).filter(a => a !== '--dry' && a !== '--force');
const DRY = process.argv.includes('--dry');
const FORCE = process.argv.includes('--force');
const DOCS = path.resolve(argv[0] || 'docs');
const TRACKING = path.join(DOCS, '00-tracking.md');

if (!fs.existsSync(DOCS)) { console.error(`Không thấy ${DOCS}\nSửa: chạy từ gốc dự án (nơi có docs/), hoặc truyền đúng thư mục: node .claude/skills/ba-track/scripts/refresh.js docs`); process.exit(2); }

// Bộ file BA mỗi màn — thứ tự cột chuẩn. KHÔNG hardcode 9 file: hồ sơ `mini` chỉ có 5
// (conv-gates.md → "Hồ sơ dự án"), nên danh sách lấy từ profile.js. html map ra html-design.html.
// e2e/checklist KHÔNG nằm ở đây: artifact tùy chọn (như dev), tracked riêng, không tính "Hoàn thành".
const { screenFiles, readProfile, isDocsOnly } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'profile.js'));
const { resolveE2e, taggedSpecs } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'e2epath.js'));
const PROFILE = readProfile(DOCS);
// Phạm vi docs: screenFiles() đã bỏ `plan`; cột `dev` giữ để bảng không đổi hình nhưng ghi `—`
// (không phải ⬜ "chưa dev" — dự án này không ai dev). status.js đọc `—` là "không có dev".
const DOCS_ONLY = isDocsOnly(DOCS);
const COL_OF = { 'ascii-screen': 'ascii', 'design-spec': 'design-spec', 'html-design': 'html' };
const FILE_OF = { 'html-design': 'html-design.html' };
const COLS = screenFiles(DOCS).map(f => [COL_OF[f] || f, FILE_OF[f] || `${f}.md`]);
const DOC_COL_NAMES = new Set(['ascii', 'brainstorm', 'srs', 'usecase', 'userstory', 'design-spec', 'html', 'test', 'plan']);
let headsCũ = [];
const HEADER = ['Mã CN', 'Chức năng', 'Nhóm', 'Màn hình', 'Folder',
  ...COLS.map(c => c[0]), 'checklist', 'e2e', 'dev', 'Trạng thái', 'Cập nhật cuối'];

// Nhận CẢ HAI cách đặt tên folder màn — hợp nhất từ dự án desktop 11/09/2026 qua vòng phản hồi:
//   `S01 - Login`  (quy ước chuẩn, do ba-screens sinh)
//   `S01-Login`    (do ba-reverse sinh khi dựng tài liệu ngược từ code)
// Nguồn chỉ nhận dạng đầu. Đo trên dự án này: quét ra **0/32** folder màn ⇒ refresh.js coi như mọi
// màn đã biến mất và (nếu không có chốt chặn ở mục 3) sẽ xoá trắng 32 dòng viết tay.
const isScreenDir = (name) => /^S\d+\s*-\s*\S/.test(name);

/* ---- 1. Quét folder màn: docs/[Screen-spec/][<Nhóm>/]<SNN - Ten>/ ----
 * "Screen-spec/" là container TÙY CHỌN, TRONG SUỐT (gom folder màn cho gọn gốc docs/):
 * bỏ qua khi tính "Nhóm" nhưng giữ trong đường dẫn. Không có nó (dự án cũ) → chạy y hệt. */
const CONTAINER = 'Screen-spec';
const screens = []; // {group, dirName, code, name, relFolder, absDir, prefix}
const collect = (dir, group, prefix) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (isScreenDir(e.name)) {
      screens.push({ group: group || '—', dirName: e.name, absDir: path.join(dir, e.name), prefix });
    } else if (e.name === CONTAINER && !group) {
      collect(path.join(dir, e.name), '', prefix + e.name + '/'); // container trong suốt
    } else if (!group) {
      collect(path.join(dir, e.name), e.name, prefix + e.name + '/'); // folder nhóm nghiệp vụ
    }
  }
};
collect(DOCS, '', '');
for (const sc of screens) {
  const m = sc.dirName.match(/^(S\d+)\s*-\s*(.+)$/);
  sc.code = m[1]; sc.name = m[2];
  sc.relFolder = 'docs/' + sc.prefix + sc.dirName + '/';
}
screens.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

/* ---- 2. Đọc bảng cũ (nếu có): giữ Mã CN/Chức năng/Nhóm/Màn hình/dev/⚠️/ngày ---- */
const old = {}; // key = SNN → {cells: {col: val}, raw}
let preamble = null; // phần trước bảng (tiêu đề + chú thích) — giữ nguyên
let postamble = ''; // phần SAU bảng — giữ nguyên (mục 1 ở đầu file)
const dòngKhôngMã = []; // dòng bảng không có mã màn trong Folder — giữ nguyên văn (mục 2)
let vănBảnCũ = '';
// Tách ô: `|` trong code span và `\|` không phải ranh giới (như ledger.js). Không ra đúng số cột thì thử tách GFM thuần.
function táchÔ(line, n) {
  const cóĐóng = (from, k) => { for (let j = from; j < line.length;) { if (line[j] !== '`') { j++; continue; } let m = 0; while (line[j + m] === '`') m++; if (m === k) return true; j += m; } return false; };
  const c = []; let cur = ''; let fence = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '`') { let k = 0; while (line[i + k] === '`') k++; if (fence === 0) { if (cóĐóng(i + k, k)) fence = k; } else if (fence === k) fence = 0; cur += line.slice(i, i + k); i += k - 1; continue; }
    if (ch === '|' && fence === 0 && !cur.endsWith('\\')) { c.push(cur); cur = ''; } else cur += ch;
  }
  c.push(cur);
  let ô = c.map(x => x.trim());
  if (n && ô.length !== n + 2) { const g = line.split(/(?<!\\)\|/).map(x => x.trim()); if (g.length === n + 2) ô = g; }
  ô.shift(); ô.pop(); return ô;
}
if (fs.existsSync(TRACKING)) {
  vănBảnCũ = fs.readFileSync(TRACKING, 'utf8');
  const lines = vănBảnCũ.split('\n');
  const headIdx = lines.findIndex(l => /^\|.*Mã CN/.test(l));
  if (headIdx >= 0) {
    preamble = lines.slice(0, headIdx).join('\n');
    const heads = táchÔ(lines[headIdx]).filter(Boolean);
    headsCũ = heads.slice();
    let i = headIdx + 2;
    for (; i < lines.length; i++) {
      if (!/^\|/.test(lines[i])) break;
      const cells = táchÔ(lines[i], heads.length);
      const row = {}; heads.forEach((h, j) => row[h] = cells[j] || '');
      const mCode = (row['Folder'] || '').match(/S\d+/);
      if (mCode) old[mCode[0]] = row; else if (lines[i].trim()) dòngKhôngMã.push(lines[i]);
    }
    postamble = lines.slice(i).join('\n');
  }
}
// Cột tùy chọn `figma` (figma-sync.js là chủ): chỉ giữ khi bảng cũ đã có; đặt ngay sau `html` (không có html → trước checklist).
const CÓ_FIGMA = headsCũ.includes('figma');
if (CÓ_FIGMA) HEADER.splice(HEADER.includes('html') ? HEADER.indexOf('html') + 1 : HEADER.indexOf('checklist'), 0, 'figma');
// Cột người tự thêm (không thuộc HEADER, không phải cột tài liệu của hồ sơ khác) — giữ, đặt trước `Trạng thái`.
const cộtThêm = headsCũ.filter(h => !HEADER.includes(h) && !DOC_COL_NAMES.has(h));
if (cộtThêm.length) HEADER.splice(HEADER.indexOf('Trạng thái'), 0, ...cộtThêm);
if (headsCũ.length && !headsCũ.includes('Chức năng')) HEADER.splice(HEADER.indexOf('Chức năng'), 1);
if (preamble === null) {
  preamble = ['# Ma trận truy vết tài liệu', '',
    'Trạng thái: ✅ xong · ⬜ chưa làm · ⚠️ cần cập nhật',
    'Cột `dev` = trạng thái code của màn (do `dev-run` quản); không map ra file tài liệu.',
    'Một dòng = một màn hình. Màn phục vụ nhiều chức năng → cột "Mã CN" liệt kê nhiều mã (`F04, F05`); nhóm 1 màn → cột "Nhóm" để `—`.', ''].join('\n');
}

/* ---- 3. Dựng dòng mới ---- */
const fmtDate = (ms) => new Date(ms).toISOString().slice(0, 10);
const rows = []; const changes = [];
// Đổi hồ sơ dự án làm ĐỔI TẬP CỘT, không phải đổi ô — vòng so sánh dưới chỉ nhìn ô nên sẽ báo
// "không có thay đổi" trong khi lần chạy thật dựng lại cả bảng. --dry mà nói sai thì nó vô dụng.
{
  const cộtCũ = headsCũ.filter(h => DOC_COL_NAMES.has(h));
  const cộtMới = COLS.map(c => c[0]);
  if (headsCũ.length && cộtCũ.join(',') !== cộtMới.join(',')) {
    const bỏ = cộtCũ.filter(c => !cộtMới.includes(c)), thêm = cộtMới.filter(c => !cộtCũ.includes(c));
    changes.push(`BẢNG: tập cột tài liệu đổi theo hồ sơ \`${PROFILE}\` — ${cộtCũ.length} → ${cộtMới.length} cột` +
      (bỏ.length ? ` · bỏ cột: ${bỏ.join(', ')} (file trên đĩa KHÔNG bị xoá)` : '') +
      (thêm.length ? ` · thêm cột: ${thêm.join(', ')}` : ''));
  }
}
for (const sc of screens) {
  const prev = old[sc.code] || {};
  const row = {
    'Mã CN': prev['Mã CN'] || '?',
    'Chức năng': prev['Chức năng'] || sc.name,
    'Nhóm': prev['Nhóm'] || sc.group,
    'Màn hình': prev['Màn hình'] || sc.name,
    'Folder': '`' + sc.relFolder + '`',
    'dev': DOCS_ONLY ? '—' : (prev['dev'] || '⬜'),
  };
  if (CÓ_FIGMA) row['figma'] = prev['figma'] || '⬜'; // giữ như dev — figma-sync.js ghi, không cộng vào done/warn
  let done = 0, warn = 0, have = 0, maxM = 0;
  for (const [col, file] of COLS) {
    const p = path.join(sc.absDir, file);
    if (fs.existsSync(p)) {
      have++;
      row[col] = (prev[col] === '⚠️') ? '⚠️' : '✅'; // giữ ⚠️ — chỉ người/LLM hạ cờ
      if (row[col] === '✅') done++; else warn++;
      const mt = fs.statSync(p).mtimeMs; if (mt > maxM) maxM = mt;
    } else row[col] = '⬜';
    if (prev[col] && prev[col] !== row[col]) changes.push(`${sc.code}.${col}: ${prev[col]} → ${row[col]}`);
    if (!prev[col] && row[col] !== '⬜') changes.push(`${sc.code}.${col}: (mới) → ${row[col]}`);
  }
  // script E2E — tracked như dev; KHÔNG cộng vào done/warn (giữ nguyên logic "Hoàn thành" = 9/9 file BA)
  // Vị trí spec E2E khác nhau giữa bố cục cũ (trong folder màn) và mới (`e2e/tests/` ở gốc dự
  // án) — hỏi resolver, đừng hardcode, nếu không cột `e2e` của một nửa số dự án về ⬜ sai.
  const e2ePath = resolveE2e(DOCS, sc.absDir, sc.code, sc.name);
  if (e2ePath) {
    row['e2e'] = (prev['e2e'] === '⚠️') ? '⚠️' : '✅';
    const mt = fs.statSync(e2ePath).mtimeMs; if (mt > maxM) maxM = mt;
  } else {
    // Không có file mang tên màn ≠ không có E2E: màn lớn thường được chẻ thành nhiều spec theo
    // tính năng (`chatQpin.spec.ts`…) gắn mã `TC-S..` của màn. Hỏi theo MÃ, nếu không mỗi lần
    // refresh lại hạ những màn ấy về ⬜ — xoá bằng chứng phủ E2E đang có thật.
    const tagged = taggedSpecs(DOCS, sc.code, sc.name);
    if (tagged.length) {
      // 🔨 = có E2E nhưng chưa phải spec trọn màn. Nhãn người/LLM đặt (✅ đã phủ đủ, ⚠️ lệch
      // test.md) mang nhiều thông tin hơn suy đoán của script nên giữ nguyên, không hạ.
      row['e2e'] = (prev['e2e'] === '⚠️' || prev['e2e'] === '✅') ? prev['e2e'] : '🔨';
      for (const p of tagged) { const mt = fs.statSync(p).mtimeMs; if (mt > maxM) maxM = mt; }
    } else row['e2e'] = '⬜';
  }
  if (prev['e2e'] && prev['e2e'] !== row['e2e']) changes.push(`${sc.code}.e2e: ${prev['e2e']} → ${row['e2e']}`);
  if (!prev['e2e'] && row['e2e'] !== '⬜') changes.push(`${sc.code}.e2e: (mới) → ${row['e2e']}`);
  // checklist.md — tracked như e2e; KHÔNG cộng vào done/warn (giữ nguyên logic "Hoàn thành" = 9/9 file BA)
  const clPath = path.join(sc.absDir, 'checklist.md');
  if (fs.existsSync(clPath)) {
    row['checklist'] = (prev['checklist'] === '⚠️') ? '⚠️' : '✅';
    const mt = fs.statSync(clPath).mtimeMs; if (mt > maxM) maxM = mt;
  } else row['checklist'] = '⬜';
  if (prev['checklist'] && prev['checklist'] !== row['checklist']) changes.push(`${sc.code}.checklist: ${prev['checklist']} → ${row['checklist']}`);
  if (!prev['checklist'] && row['checklist'] !== '⬜') changes.push(`${sc.code}.checklist: (mới) → ${row['checklist']}`);
  let nhãn = warn ? 'Cần cập nhật' : (done === COLS.length ? 'Hoàn thành' : (have === 0 ? 'Chưa bắt đầu' : 'Đang làm'));
  const ttCũ = prev['Trạng thái'] || '';
  const mNhãn = /^\**\s*(Hoàn thành|Đang làm|Cần cập nhật|Chưa bắt đầu)\s*\**/.exec(ttCũ);
  // Không hạ `Hoàn thành` khi mọi ô ⬜ hôm nay đều đã ⬜ lúc người chấm hoàn thành (cột N/A có chủ ý — dự án helpdesk S01–S10).
  if (mNhãn && mNhãn[1] === 'Hoàn thành' && nhãn === 'Đang làm' && COLS.every(([col]) => row[col] !== '⬜' || prev[col] === '⬜')) nhãn = 'Hoàn thành';
  // Chỉ thay NHÃN đầu ô; ghi chú phía sau là chữ người viết. Ô không mở bằng nhãn canon → thêm nhãn phía trước, giữ nguyên văn.
  row['Trạng thái'] = mNhãn ? ttCũ.replace(mNhãn[0], mNhãn[0].replace(mNhãn[1], nhãn)) : (ttCũ ? `${nhãn} — ${ttCũ}` : nhãn);
  if (old[sc.code] && ttCũ !== row['Trạng thái']) changes.push(`${sc.code}.Trạng thái: ${mNhãn ? mNhãn[1] : '(không nhãn)'} → ${nhãn}`);
  for (const h of cộtThêm) row[h] = prev[h] || '';
  row['Cập nhật cuối'] = maxM ? fmtDate(maxM) : (prev['Cập nhật cuối'] || '—');
  if (!old[sc.code]) changes.push(`${sc.code}: dòng MỚI (${sc.relFolder}) — điền "Mã CN" giúp (đang để ?)`);
  rows.push(row);
}
// Dòng cũ mà folder biến mất → cảnh báo, không lặng lẽ xoá
const mất = [];
for (const code of Object.keys(old)) {
  if (!screens.find(s => s.code === code)) {
    console.warn(`⚠️  ${code}: có trong tracking nhưng folder không còn — dòng bị BỎ khỏi bảng (kiểm tra lại nếu không chủ ý).`);
    changes.push(`${code}: folder biến mất → bỏ dòng`);
    mất.push(code);
  }
}
// ── Chốt chặn hợp nhất từ dự án desktop 11/09/2026 — nơi nó suýt xoá trắng 32 dòng ───────────────
// Bỏ một dòng tracking là mất dữ liệu VIẾT TAY không dựng lại được: Mã CN, ghi chú, ngày cập nhật.
// Nguyên nhân thường gặp KHÔNG phải người ta xoá màn thật, mà là script quét trượt (sai `docsDir`,
// folder màn đặt tên khác quy ước) — lần vấp thật: nó báo "folder không còn" cho cả 29 màn còn
// nguyên. Cảnh báo rồi vẫn ghi đè thì người dùng đọc cảnh báo SAU khi file đã mất. Nên mặc định
// TỪ CHỐI ghi, bắt xác nhận bằng `--force`.
if (mất.length && !DRY && !FORCE) {
  console.error(`\n✋ Từ chối ghi: ${mất.length}/${Object.keys(old).length} dòng sẽ bị bỏ (${mất.join(', ')}).`);
  console.error(`   Quét ra ${screens.length} folder màn trong ${DOCS}.`);
  console.error('   Sửa: kiểm thư mục tài liệu + quy ước tên folder màn (`<Mã> - <Tên>`) trước; nếu ĐÚNG là đã bỏ màn thì dùng `/ba-remove`, hoặc chạy lại với --force.');
  process.exit(2);
}

/* ---- 4. Ghi ---- */
const table = [
  '| ' + HEADER.join(' | ') + ' |',
  '|' + HEADER.map(() => '-------').join('|') + '|',
  ...rows.map(r => '| ' + HEADER.map(h => r[h] || (cộtThêm.includes(h) ? '' : '⬜')).join(' | ') + ' |'),
  ...dòngKhôngMã,
].join('\n');
const out = preamble.replace(/\n*$/, '\n\n') + table + '\n' + (postamble.trim() ? postamble.replace(/^\n*/, '\n') : '');
if (dòngKhôngMã.length) changes.push(`giữ nguyên ${dòngKhôngMã.length} dòng bảng không có mã màn (cuối bảng): ${dòngKhôngMã.map(l => táchÔ(l)[HEADER.indexOf('Folder')] || '?').join(', ')}`);
// Chốt cuối: dòng chữ NGOÀI bảng không được ít đi. Có ít đi là script này đang xoá chữ người viết — từ chối như mục 3.
const ngoàiBảng = (t) => t.split('\n').filter(l => l.trim() && !/^\|/.test(l)).length;
if (vănBảnCũ && ngoàiBảng(out) < ngoàiBảng(vănBảnCũ) && !FORCE) {
  console.error(`\n✋ Từ chối ghi: bản mới mất ${ngoàiBảng(vănBảnCũ) - ngoàiBảng(out)} dòng chữ ngoài bảng so với ${path.basename(TRACKING)} hiện tại.\n   Sửa: chép đoạn chữ ngoài bảng ra chỗ khác trước, hoặc chạy lại với --force nếu chủ ý bỏ.`);
  process.exit(2);
}

// Hồ sơ rút gọn phải NÓI RA (conv-gates.md → "Hồ sơ dự án", luật 6). Quan trọng nhất là báo
// "hoàn thành" giờ đo bằng mấy file, kẻo người đọc tưởng màn 5/5 ✅ là đã đủ 9 file.
if (PROFILE === 'mini') {
  console.log(`⚙️ mini: ${COLS.length} file/màn (${COLS.map(c => c[0]).join(' · ')}) — "Hoàn thành" = ${COLS.length}/${COLS.length}, không phải 9/9.`);
if (DOCS_ONLY)
  console.log(`⚙️ phạm vi docs: không có cột plan (${COLS.length} file/màn), cột dev = — . "Hoàn thành" = đủ tài liệu, không cần plan.md.`);
  console.log('   Bỏ brainstorm/usecase/userstory/design-spec — nội dung dồn vào srs.md. File cũ (nếu có) KHÔNG bị xoá, chỉ thôi lên cột.');
}

if (DRY) {
  console.log(changes.length ? `Thay đổi (${changes.length}):\n  - ` + changes.join('\n  - ') : 'Không có thay đổi.');
  console.log('\n--dry: chưa ghi file.');
} else {
  fs.writeFileSync(TRACKING, out);
  console.log(`Đã ghi ${path.relative(process.cwd(), TRACKING)} — ${rows.length} màn.` +
    (changes.length ? ` Thay đổi (${changes.length}):\n  - ` + changes.join('\n  - ') : ' Không có thay đổi.'));
  const unknown = rows.filter(r => r['Mã CN'] === '?').map(r => r['Màn hình']);
  if (unknown.length) console.log(`👉 Điền "Mã CN" cho màn mới: ${unknown.join(', ')} (script không đoán — tra 02-functions.md).`);
}
