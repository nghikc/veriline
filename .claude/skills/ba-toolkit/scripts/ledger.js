#!/usr/bin/env node
/**
 * ledger.js — đọc sổ CR (`00-cr.md`) / WI (`00-backlog.md`) trả về LÁT compact,
 * để agent KHÔNG phải Read cả file (tiết kiệm token). Zero-dependency.
 *
 * Sổ có 2 tầng: BẢNG TỔNG (1 dòng/mục) + các block CHI TIẾT `### <ID> — …`.
 * Script này parse cả hai, generic theo tiền tố ID tự nhận (CR/WI/…).
 *
 * Dùng:
 *   node ledger.js <file.md> summary          # {file,prefix,total,openCount,byStatus,open:[…]}
 *   node ledger.js <file.md> open             # chỉ mảng mục đang mở (compact)
 *   node ledger.js <file.md> next             # {prefix,next,nextId} — mã kế tiếp (max toàn cục +1)
 *   node ledger.js <file.md> get <ID>         # block chi tiết "### <ID>" (text); tìm cả trong archive
 *   node ledger.js <file.md> ids              # [{id,status,open}] mọi dòng bảng — cho cross-check
 *
 * Tuỳ chọn:
 *   --archive <dir>   thư mục chứa chi tiết đã rotate (mặc định: đoán từ tên file,
 *                     vd 00-cr.md -> cr-archive/, 00-backlog.md -> backlog-archive/)
 *   --plain           in dạng người-đọc thay vì JSON (mặc định JSON compact)
 *   --closed "<re>"   regex trạng thái ĐÓNG (mặc định phủ cả CR lẫn WI)
 *
 * "Mở" = trạng thái KHÔNG khớp regex đóng. Mặc định đóng =
 *   Đóng · Từ chối · Đã áp dụng · Xong · Hủy/Huỷ   (Hoãn/Blocked vẫn coi là MỞ — còn theo dõi).
 */
'use strict';

if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

// ---------- args ----------
const RAW = process.argv.slice(2);
const pos = [];
const opt = {};
for (let i = 0; i < RAW.length; i++) {
  const a = RAW[i];
  if (a === '--plain') opt.plain = true;
  else if (a === '--archive') opt.archive = RAW[++i];
  else if (a === '--closed') opt.closed = RAW[++i];
  else pos.push(a);
}
const FILE = pos[0];
const CMD = pos[1];
const ARG = pos[2];

function die(msg) { console.error('✖ ' + msg); process.exit(1); }
function out(obj) {
  if (opt.plain) return; // các lệnh có nhánh --plain riêng ở dưới
  process.stdout.write(JSON.stringify(obj));
}
if (!FILE || !CMD) die('Dùng: node ledger.js <file.md> <summary|open|next|get <ID>|ids> [--archive dir] [--plain]');

// `Đã nghiệm thu` = trạng thái cuối dự án thật dùng thay `Đóng` (dự án desktop 395 dòng) — cùng luật với ba-next/status.js, report.js.
// 25/09/2026 — hai IM trên sổ thật: (1) `Bị THAY` phân biệt hoa thường ⇒ dự án e-learning `CR-70 | Bị thay thế (bởi CR-158)` báo MỞ;
// (2) khớp BẤT KỲ ĐÂU trong ô ⇒ `Đang triển khai — tách từ CR-12 đã Đóng` báo ĐÓNG. Nay: không phân biệt hoa thường và chỉ xét
// CỤM ĐẦU ô (sau `**`/emoji) — ô Trạng thái của dự án thật là "nhãn — ghi chú", ghi chú hay nhắc trạng thái của mục KHÁC.
const CLOSED = new RegExp(opt.closed || 'Đóng|Từ chối|Đã áp dụng|Đã nghiệm thu|Bị thay|Xong|Hủy|Huỷ', 'i');
const CLOSED_ĐẦU = opt.closed ? CLOSED : new RegExp('^(' + CLOSED.source + ')', 'i');
// Cụm nhãn đầu ô: bỏ `*`, emoji/dấu đầu dòng; cắt ở ` — `, `(`, `:`, `;`, `·`.
const nhãnĐầu = (s) => String(s || '').replace(/\*/g, '').replace(/^[^\p{L}]+/u, '').split(/\s+[—–-]\s+|\s*[(:;·]/)[0].trim();
// Từ vựng trạng thái (conv-ledgers + dạng dự án thật dùng) — để tìm ô Trạng thái trên dòng LỆCH CỘT.
const TỪ_TT = /^(Đề xuất|Đang phân tích|Đã duyệt|Đang triển khai|Đã triển khai|Đã nghiệm thu|Đã áp dụng|Đóng|Từ chối|Hoãn|Bị thay|Backlog|Sẵn sàng|Đang làm|Đang review|Blocked|Xong|Hủy|Huỷ)/i;

function read(f) { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } }

const txt = read(FILE);
if (!txt) die(`Không đọc được / rỗng: ${FILE}\nSửa: kiểm đường dẫn sổ (vd docs/00-cr.md); chưa có sổ thì tạo bằng skill chủ của nó (\`/ba-change-request\`, \`/ba-task\`).`);
const lines = txt.split('\n');

// ---------- parse bảng tổng ----------
// Tìm dòng header (có "Mã" và "Trạng thái"); lấy chỉ số cột theo TÊN, không index cứng.
const headIdx = lines.findIndex(l => /^\|/.test(l) && /Mã/.test(l) && /Trạng thái/.test(l));
let colId = 0, colStatus = -1, colSummary = -1, colLoai = -1;
let HCOLS = -1;
if (headIdx >= 0) {
  const cols = cellsOf(lines[headIdx]);
  HCOLS = cols.length;
  // cols[0] thường rỗng (do dấu | đầu dòng) -> ánh xạ theo tên
  const find = re => cols.findIndex(c => re.test(c));
  colStatus = find(/Trạng thái/);
  colSummary = find(/Tóm tắt/);
  colLoai = find(/Loại/);
  colId = find(/Mã/);
}

function cellsOf(line) {
  // "| a | b | c |" -> ['','a','b','c',''] ; giữ index khớp header (cùng cách split)
  // `|` trong code span (`a|b`) không phải ranh giới cột (dự án desktop có 3 dòng như vậy)
  //
  // Backtick đếm theo CỤM, không theo từng ký tự (luật CommonMark): code span mở bằng
  // cụm n backtick chỉ đóng bằng cụm ĐÚNG n backtick. Đếm từng ký tự làm dòng có
  // ```` ```x ```` (4+3+4 = 11 backtick, LẺ) kẹt vĩnh viễn trong "code" ⇒ mọi `|`
  // còn lại của dòng bị nuốt ⇒ dòng đủ cột vẫn ra thiếu cột (CR-163 của dự án e-learning).
  // Cụm mở mà KHÔNG có cụm đóng cùng độ dài phía sau là chữ thường, không mở code span (CommonMark).
  // dự án desktop `CR-29`: ``Thuộc `md` \| `html` \| `mp4``` — cụm 2 mở, cuối dòng là cụm 3 ⇒ bản cũ kẹt trong code,
  // đọc 3/7 cột, Trạng thái rỗng ⇒ CR đã Đóng báo MỞ.
  const cóCụmĐóng = (from, n) => { for (let j = from; j < line.length;) { if (line[j] !== '`') { j++; continue; } let k = 0; while (line[j + k] === '`') k++; if (k === n) return true; j += k; } return false; };
  const c = []; let cur = ''; let fence = 0; // 0 = ngoài code span, n = đang trong cụm n backtick
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '`') {
      let n = 0; while (line[i + n] === '`') n++;
      if (fence === 0) { if (cóCụmĐóng(i + n, n)) fence = n; } // mở — chỉ khi có cụm đóng
      else if (fence === n) fence = 0;       // đóng (đúng độ dài mới đóng)
      cur += line.slice(i, i + n); i += n - 1;
      continue;
    }
    if (ch === '|' && fence === 0 && !cur.endsWith('\\')) { c.push(cur); cur = ''; }
    else cur += ch;
  }
  c.push(cur); return c.map(s => s.trim());
}
function clean(id) { return (id || '').replace(/\*/g, '').trim(); }

const ID_RE = /^\|\s*\*{0,2}[A-Za-zĐ]+-[A-Za-z0-9-]+\*{0,2}\s*\|/;
const rows = [];
const lech = [];   // dòng lệch cột — KHÔNG crash, nhưng phải kêu to (xem cảnh báo cuối khối)
for (let i = (headIdx >= 0 ? headIdx + 1 : 0); i < lines.length; i++) {
  const l = lines[i];
  if (/^###\s/.test(l)) break;           // tới vùng chi tiết thì dừng
  if (!ID_RE.test(l)) continue;
  if (/^\|\s*-+\s*\|/.test(l)) continue;  // dòng separator
  let c = cellsOf(l);
  // Lệch cột theo luật code span → thử luật GFM thuần (chỉ `\|` là thoát; GitHub tách bảng TRƯỚC khi đọc code span).
  // Luật nào ra đúng số cột header thì tin luật đó: dự án desktop `CR-29` có cụm backtick lồng (``…`mp4```) mà cụm đóng
  // nằm xa hàng trăm ký tự ⇒ luật code span nuốt 3 ô; tách GFM ra đủ 7.
  if (HCOLS > 0 && c.length !== HCOLS) { const g = l.split(/(?<!\\)\|/).map((x) => x.trim()); if (g.length === HCOLS) c = g; }
  const id = clean(colId >= 0 ? c[colId] : c[1]);
  if (!id) continue;
  // Dòng thiếu/thừa cột: c[colStatus] có thể là undefined (crash) HOẶC là ô BÊN CẠNH
  // (im lặng sai — nguy hơn crash: "Cập nhật cuối" bị đọc làm "Trạng thái" ⇒ mọi CR đó
  // báo là đang MỞ). Đọc best-effort + đánh dấu `lệch` + kêu to ở stderr.
  const cell = j => (j >= 0 && c[j] != null ? String(c[j]) : '').trim();
  const isLech = HCOLS > 0 && c.length !== HCOLS;
  if (isLech) lech.push({ dòng: i + 1, id, cột: Math.max(0, c.length - 2), cầnCột: Math.max(0, HCOLS - 2) });
  let status = cell(colStatus);
  // Dòng lệch cột: ô ở vị trí Trạng thái thường là ô BÊN CẠNH (ngày, tóm tắt). Nếu nó không mang nhãn trạng thái
  // mà một ô khác của dòng mang, lấy ô đó (từ phải sang — Trạng thái nằm cuối bảng) — vẫn giữ cờ `lệch`.
  if (isLech && !TỪ_TT.test(nhãnĐầu(status))) {
    const j = [...c.keys()].reverse().find((k) => k !== colId && TỪ_TT.test(nhãnĐầu(c[k])));
    if (j != null) status = String(c[j]).trim();
  }
  const tomtat = cell(colSummary);
  const loai = colLoai >= 0 ? cell(colLoai) : undefined;
  const isOpen = status ? !CLOSED_ĐẦU.test(nhãnĐầu(status)) : true;
  const row = { id, status, tomtat, open: isOpen };
  if (loai !== undefined) row.loai = loai;
  if (isLech) row.lệch = true;   // mọi giá trị của dòng này KHÔNG đáng tin
  rows.push(row);
}

if (lech.length) {
  const ds = lech.map(x => `dòng ${x.dòng} (${x.id}: ${x.cột}/${x.cầnCột} cột)`).join(', ');
  console.error(`⚠ ${path.basename(FILE)}: ${lech.length} dòng LỆCH CỘT so với header (${Math.max(0, HCOLS - 2)} cột) — ${ds}`);
  console.error('  ⇒ cột "Trạng thái" của các dòng này bị đọc LỆCH MỘT Ô: mọi câu trả lời về chúng (list/summary/open) đều KHÔNG đáng tin. Sửa dòng trong file .md cho đủ cột.');
}

// Tiền tố ID (CR/WI…): chữ cái đầu của ID phổ biến nhất
function prefixOf(id) { const m = /^([A-Za-zĐ]+)-/.exec(id); return m ? m[1] : ''; }
const prefixCount = {};
for (const r of rows) { const p = prefixOf(r.id); if (p) prefixCount[p] = (prefixCount[p] || 0) + 1; }
const PREFIX = Object.keys(prefixCount).sort((a, b) => prefixCount[b] - prefixCount[a])[0] || '';

// ---------- lệnh ----------
if (CMD === 'summary' || CMD === 'ids' || CMD === 'open') {
  const openRows = rows.filter(r => r.open);
  const byStatus = {};
  // Khoá = CỤM NHÃN ĐẦU ô, không phải cả ô: dự án e-learning viết "**Xong** — <cả đoạn đo đạc>" ⇒ bản cũ ra 100+ khoá một-lần.
  for (const r of rows) { const k = nhãnĐầu(r.status).slice(0, 40) || '(trống)'; byStatus[k] = (byStatus[k] || 0) + 1; }
  if (CMD === 'ids') {
    if (opt.plain) { rows.forEach(r => console.log(`${r.id}\t${r.open ? 'mở' : 'đóng'}\t${r.status}`)); process.exit(0); }
    return out(rows.map(r => ({ id: r.id, status: r.status, open: r.open, loai: r.loai, tomtat: r.tomtat })));   // ac-po/pick.js đọc tomtat để in hàng đợi
  }
  if (CMD === 'open') {
    if (opt.plain) { openRows.forEach(r => console.log(`${r.id} · ${r.loai ? r.loai + ' · ' : ''}${r.status} · ${r.tomtat}`)); process.exit(0); }
    return out(openRows);
  }
  // summary
  if (opt.plain) {
    console.log(`${path.basename(FILE)} — tổng ${rows.length} · mở ${openRows.length}`);
    Object.keys(byStatus).forEach(s => console.log(`  ${s}: ${byStatus[s]}`));
    console.log('Đang mở:');
    openRows.forEach(r => console.log(`  ${r.id}${r.lệch ? ' ⚠lệch-cột' : ''} · ${r.loai ? r.loai + ' · ' : ''}${r.status} · ${r.tomtat}`));
    process.exit(0);
  }
  const res = { file: path.basename(FILE), prefix: PREFIX, total: rows.length, openCount: openRows.length, byStatus, open: openRows };
  if (lech.length) res.lệch = lech;   // dòng lệch cột: số liệu trên KHÔNG đáng tin cho các dòng này
  return out(res);
}

if (CMD === 'next') {
  // Chỉ tính ID dạng TOÀN CỤC "<PREFIX>-<số>" (bỏ dạng theo màn như CR-S01-14)
  let max = 0;
  const re = new RegExp('^' + PREFIX + '-(\\d+)$');
  for (const r of rows) { const m = re.exec(r.id); if (m) max = Math.max(max, +m[1]); }
  const next = max + 1;
  const width = String(max).length >= 2 ? String(max).length : 2; // giữ zero-pad tối thiểu 2 (CR-01)
  const nextId = PREFIX + '-' + String(next).padStart(width, '0');
  if (opt.plain) { console.log(nextId); process.exit(0); }
  return out({ prefix: PREFIX, next, nextId });
}

if (CMD === 'get') {
  if (!ARG) die('get cần <ID>. Vd: node ledger.js 00-cr.md get CR-07');
  const target = clean(ARG);
  const blockFrom = (content) => {
    const ls = content.split('\n');
    const start = ls.findIndex(l => new RegExp('^###\\s+\\*{0,2}' + target.replace(/[-]/g, '\\-') + '\\b').test(l));
    if (start < 0) return null;
    let end = ls.length;
    for (let i = start + 1; i < ls.length; i++) { if (/^###\s/.test(ls[i])) { end = i; break; } }
    // bỏ dấu --- phân cách dính ở cuối block
    return ls.slice(start, end).join('\n').replace(/\n*-{3,}\s*$/, '').trim();
  };
  // 1) file chính
  let block = blockFrom(txt);
  let source = FILE;
  // 2) archive (nếu chưa thấy)
  if (!block) {
    const archDir = opt.archive || path.join(path.dirname(FILE),
      /backlog/i.test(FILE) ? 'backlog-archive' : /cr/i.test(FILE) ? 'cr-archive' : 'archive');
    if (fs.existsSync(archDir)) {
      for (const f of fs.readdirSync(archDir).filter(n => n.endsWith('.md'))) {
        const b = blockFrom(read(path.join(archDir, f)));
        if (b) { block = b; source = path.join(archDir, f); break; }
      }
    }
  }
  if (!block) die(`Không tìm thấy chi tiết ${target} trong ${path.basename(FILE)} lẫn archive.`);
  if (opt.plain) { console.log(block); process.exit(0); }
  return out({ id: target, source: path.relative(process.cwd(), source), block });
}

die(`Lệnh không rõ: ${CMD}\nSửa: dùng summary | ids | open | next | get <ID>.`);
