#!/usr/bin/env node
/*
 * ba-onepager/scan-sources.js — phần ĐẾM ĐƯỢC của việc gộp docs/ thành một tài liệu liền mạch.
 *
 * Hai che do, hai cau hoi khac nhau:
 *   (mac dinh)      "du an nay co du nguon cho nhung muc nao?"  -> de xuat muc luc co gian
 *   --check <file>  "ban vua viet co phan boi nguon khong?"     -> soat lai bai da viet
 *
 * Vi sao can che do --check: nguoi dung chon AN MA ID khoi than bai (chi de o Phu luc B). Do dung
 * la thu LLM se vo tinh de lot — viet dang say thi mot `FR-01` roi vao cau van la chuyen thuong,
 * va nguoi doc luot KHONG bao gio thay. May thay duoc. Con lai (van co muot khong, gop co dung
 * y khong) la viec cua nguoi doc, script khong phan.
 *
 * Script nay KHONG viet gi, KHONG phan xet chat luong van. No chi tra ve su that dem duoc.
 *
 * Dung:  node .claude/skills/ba-onepager/scripts/scan-sources.js [docsDir=docs] [--plain]
 *        node .claude/skills/ba-onepager/scripts/scan-sources.js --check <onepager.md> [docsDir=docs] [--plain]
 * Exit: che do mac dinh luon 0 (kiem ke, khong phai cong). Che do --check = so LOI (0 = sach).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const PLAIN = argv.includes('--plain');
const iCheck = argv.indexOf('--check');
const CHECK = iCheck >= 0 ? path.resolve(argv[iCheck + 1] || '') : null;
const tựDo = argv.filter((a, i) => !a.startsWith('--') && !(iCheck >= 0 && i === iCheck + 1));
const DOCS = path.resolve(tựDo[CHECK ? 0 : 0] || 'docs');

// docpath: dự án cài trước 13/08/2026 để phẳng, sau đó có Ho-so/. Không hardcode một chỗ nào.
let docpath = null;
for (const p of [path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'),
                 path.join(__dirname, '..', '..', '..', 'skills', 'ba-toolkit', 'scripts', 'docpath.js')]) {
  try { docpath = require(p); break; } catch { /* thử chỗ kế */ }
}
const đọcDoc = (tên) => {
  if (docpath) return docpath.readDoc(DOCS, tên);
  for (const p of [path.join(DOCS, 'Ho-so', tên), path.join(DOCS, tên)]) {
    try { return fs.readFileSync(p, 'utf8'); } catch { /* thử chỗ kế */ }
  }
  return '';
};
const cóDoc = (tên) => !!đọcDoc(tên);

// Tiền tố ID: đọc từ canon (`id.prefixes` của conv-registry.md), có bản dự phòng cho bản cài lẻ.
const PREFIX_DỰ_PHÒNG = ['BR', 'StR', 'FR', 'NFR', 'BRule', 'TR', 'F', 'S', 'R', 'UC', 'US', 'TC',
  'CL', 'CR', 'WI', 'ADR', 'SH', 'BO', 'GWT', 'OQ', 'UAT', 'EXT', 'DEC', 'ACT', 'PS', 'U', 'UN',
  'USC', 'E', 'RB', 'PD', 'ACL', 'ATC'];
function tiềnTố() {
  for (const p of [path.join(__dirname, '..', '..', 'ba-toolkit', 'references', 'conv-registry.md'),
                   path.join(__dirname, '..', '..', 'ba-toolkit', 'references', 'conventions.md')]) {
    try {
      const m = fs.readFileSync(p, 'utf8').match(/^id\.prefixes\s*=\s*(.+)$/m);
      if (m) return m[1].trim().split(/\s+/).filter(Boolean);
    } catch { /* thử chỗ kế */ }
  }
  return PREFIX_DỰ_PHÒNG;
}
const PFX = tiềnTố().sort((a, b) => b.length - a.length);   // dài trước: `BRule` phải khớp trước `BR`
const RE_ID = new RegExp(`\\b(?:${PFX.join('|')})-[A-Za-z0-9-]*\\d\\b`, 'g');

// ─── Hai TẦNG mã, và vì sao phải tách ───────────────────────────────────────────────────────
// Bản đầu đòi Phụ lục B phủ >=60% MỌI mã của nguồn. Đo trên dự án mẫu: 456 mã, trong đó **322 là
// tầng thực thi** — 135 yêu cầu màn `R-S..`, 79 mã lỗi `E-S..`, 57 `BRule`, 22 ca kiểm thử `TC`.
// Một tài liệu TRÌNH BÀY không được liệt kê mã lỗi và ca kiểm thử: đó đúng là thứ nó sinh ra để
// bỏ bớt. Ngưỡng cũ ép bài phải làm ngược lại chính mục đích của nó, và một phụ lục 274 dòng dài
// hơn cả bài là kiểu báo cáo người ta học cách bấm qua (bài học 86 dòng của ba-feasible).
// Nên ngưỡng chỉ áp cho tầng NGƯỜI QUYẾT đọc; tầng thực thi đếm để tham khảo, không chặn.
const TẦNG_TRÌNH_BÀY = new Set(['BR', 'BO', 'StR', 'FR', 'NFR', 'TR', 'F', 'S', 'ADR', 'CR', 'WI',
  'OQ', 'DEC', 'GĐ', 'SH', 'PS', 'U', 'UN', 'USC', 'EXT', 'PD']);
// Tầng KHÔNG chỉ nằm ở tiền tố. `GĐ-04` là giả định cấp dự án, `GĐ-S03-02` là giả định của MỘT
// MÀN — cùng tiền tố, khác hẳn tầng. Mã mang mã màn (`-S\d\d-`) luôn là tầng thực thi, dù tiền
// tố nào. Bỏ luật này thì 25 giả định cấp màn của dự án mẫu bị tính vào mẫu số và ép bài trình
// bày phải liệt kê giả định của từng màn.
const tầngCủa = (id) => (/-S\d{2}-/.test(id) ? 'thực thi'
  : TẦNG_TRÌNH_BÀY.has((id.match(/^([A-Za-zĐ]+)-/) || [, ''])[1]) ? 'trình bày' : 'thực thi');

// ─── Khung 15 mục ─────────────────────────────────────────────────────────────────────────
// Đây là HÌNH DẠNG của một tài liệu trình bày cấp dự án, không phải tên mục của một dự án cụ
// thể. Mục nào không có nguồn thì BỎ (và nói ra) — viết chay cho đủ 15 mục là đúng thứ rule
// ưu tiên của skill xếp cuối cùng.
const KHUNG = [
  { số: 1, tên: 'Tóm tắt điều hành', nguồn: ['00-vision.md'] },
  { số: 2, tên: 'Bối cảnh và hiện trạng', nguồn: ['00-process.md', '00-vision.md'] },
  { số: 3, tên: 'Mục tiêu và phạm vi', nguồn: ['00-vision.md', '00-urd.md'] },
  { số: 4, tên: 'Người dùng và nhu cầu', nguồn: ['00-personas.md', '00-urd.md'] },
  { số: 5, tên: 'Kiến trúc tổng thể', nguồn: ['10-architecture.md'] },
  { số: 6, tên: 'Mô hình dữ liệu', nguồn: ['05-data-model.md'] },
  { số: 7, tên: 'Danh mục chức năng', nguồn: ['02-functions.md'] },
  { số: 8, tên: 'Đặc tả chức năng theo màn', nguồn: ['03-overview.md'] , màn: true },
  { số: 9, tên: 'Giao diện và hệ thống thiết kế', nguồn: ['07-design-system.md'] },
  { số: 10, tên: 'Tích hợp và API', nguồn: ['06-api-spec.md', '11-integration.md', '12-api-integration.md'] },
  { số: 11, tên: 'Yêu cầu phi chức năng và tuân thủ', nguồn: ['01-requirements.md'], cần: /NFR-/ },
  { số: 12, tên: 'Lộ trình triển khai', nguồn: ['08-roadmap.md'] },
  { số: 13, tên: 'Chỉ số đo lường', nguồn: ['00-vision.md'], cần: /KPI|Chỉ số/i },
  { số: 14, tên: 'Rủi ro chính', nguồn: ['00-vision.md', '08-roadmap.md'], cần: /[Rr]ủi ro/ },
  { số: 15, tên: 'Quyết định cần chốt', nguồn: ['00-decisions.md', '00-gaps.md'] },
];

// ─── Kiểm kê nguồn ────────────────────────────────────────────────────────────────────────
function quétMàn() {
  const ra = [];
  (function đi(d) {
    let ents = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'removed') đi(p); continue; }
      if (e.name === 'srs.md') ra.push({ màn: (p.match(/\bS\d{2}\b/) || ['?'])[0], file: path.relative(DOCS, p) });
    }
  })(DOCS);
  return ra.sort((a, b) => a.màn.localeCompare(b.màn));
}

// Điều kiện vào: phải có ít nhất `01-requirements.md` HOẶC `00-vision.md`. Chặn ở SCRIPT chứ
// không chỉ viết trong SKILL.md — một điểm dừng nằm trong câu văn thì không tự chặn được, và
// thứ nguy hiểm nhất skill này có thể sinh ra là một onepager viết từ hư không: nó trông y hệt
// một tài liệu đã được duyệt.
if (!CHECK && !cóDoc('01-requirements.md') && !cóDoc('00-vision.md')) {
  console.error(`✖ ${DOCS}: không có 01-requirements.md lẫn 00-vision.md — chưa có gì để gộp.`);
  console.error('  Chạy ba-discover (GĐ1) hoặc ba-init (GĐ2) trước. KHÔNG viết onepager từ hư không.');
  process.exit(2);
}

const màn = quétMàn();
const idTheoNguồn = {};
const sơĐồ = [];
const đãĐọc = new Set();

function nạp(tên) {
  if (đãĐọc.has(tên)) return;
  đãĐọc.add(tên);
  const t = đọcDoc(tên);
  if (!t) return;
  idTheoNguồn[tên] = [...new Set(t.match(RE_ID) || [])].sort();
  for (const m of t.match(/```mermaid[\s\S]*?```/g) || []) {
    sơĐồ.push({ nguồn: tên, loại: (m.match(/```mermaid\s*\n\s*(\w[\w-]*)/) || [, '?'])[1] });
  }
}
for (const m of KHUNG) for (const n of m.nguồn) nạp(n);
for (const s of màn) {
  const t = fs.readFileSync(path.join(DOCS, s.file), 'utf8');
  idTheoNguồn[s.file] = [...new Set(t.match(RE_ID) || [])].sort();
  for (const b of t.match(/```mermaid[\s\S]*?```/g) || []) {
    sơĐồ.push({ nguồn: s.file, loại: (b.match(/```mermaid\s*\n\s*(\w[\w-]*)/) || [, '?'])[1] });
  }
}

// Mục lục co giãn: bỏ mục không nguồn, giữ mục có nguồn (và có nội dung nếu mục đó khai `cần`).
const mụcLục = [];
for (const m of KHUNG) {
  const có = m.nguồn.filter((n) => cóDoc(n));
  if (m.màn && màn.length) có.push(`${màn.length} màn (srs.md)`);
  let lýDoBỏ = null;
  if (!có.length) lýDoBỏ = `không có nguồn nào trong ${m.nguồn.join(', ')}`;
  else if (m.cần && !m.nguồn.some((n) => m.cần.test(đọcDoc(n)))) lýDoBỏ = `nguồn có nhưng không thấy nội dung khớp /${m.cần.source}/`;
  mụcLục.push({ số: m.số, tên: m.tên, nguồn: có, giữ: !lýDoBỏ, lýDoBỏ });
}

// Mục dự án CÓ mà khung THIẾU: file NN-*.md cấp đầu không thuộc nguồn nào của khung.
const đãDùng = new Set(KHUNG.flatMap((m) => m.nguồn));
const thêm = [];
for (const nơi of [DOCS, path.join(DOCS, 'Ho-so')]) {
  let ents = [];
  try { ents = fs.readdirSync(nơi); } catch { continue; }
  for (const f of ents) {
    if (!/^\d\d-.*\.md$/.test(f) || đãDùng.has(f)) continue;
    if (/^00-(tracking|cr|backlog|changelog|traceability|conformance|dashboard|gaps|glossary|intake|introduction|brainstorm|flows)\.md$/.test(f)) continue;
    if (!thêm.some((x) => x.file === f)) thêm.push({ file: f, gợiÝ: `Thêm một mục cho \`${f}\` — dự án có, khung 15 mục không phủ` });
  }
}

const tổngID = [...new Set(Object.values(idTheoNguồn).flat())].sort();

// ─── Chế độ --check ───────────────────────────────────────────────────────────────────────
function soát() {
  let bài = '';
  try { bài = fs.readFileSync(CHECK, 'utf8'); } catch {
    return { lỗi: [`không đọc được ${CHECK}`], cảnhBáo: [], phụLục: 0 };
  }
  const lỗi = [], cảnhBáo = [];
  // Tách Phụ lục ánh xạ khỏi thân bài. Mã ID SỐNG Ở PHỤ LỤC, không sống trong câu văn.
  const iPL = bài.search(/^##+\s*Phụ lục B/mi);
  const thân = iPL >= 0 ? bài.slice(0, iPL) : bài;
  const phụLục = iPL >= 0 ? bài.slice(iPL) : '';
  if (iPL < 0) lỗi.push('không thấy mục `## Phụ lục B · Ánh xạ truy vết` — bài mất hẳn đường quay về docs/');

  // 1. Thân bài lộ mã ID. Đây là luật RIÊNG của skill này: người dùng chọn văn liền mạch.
  const lộ = [...new Set(thân.match(RE_ID) || [])];
  if (lộ.length) lỗi.push(`thân bài còn lộ ${lộ.length} mã ID (${lộ.slice(0, 8).join(', ')}${lộ.length > 8 ? '…' : ''}) — mã chỉ sống ở Phụ lục B`);

  // 2. Mục rỗng: có tiêu đề mà dưới nó gần như không có chữ → viết cho đủ khung.
  const dòng = thân.split('\n');
  const mụcRỗng = [];
  for (let i = 0; i < dòng.length; i++) {
    if (!/^##\s+\S/.test(dòng[i])) continue;
    let chữ = 0;
    for (let j = i + 1; j < dòng.length && !/^##\s+\S/.test(dòng[j]); j++) chữ += dòng[j].trim().split(/\s+/).filter(Boolean).length;
    if (chữ < 25) mụcRỗng.push(dòng[i].replace(/^##\s+/, '').trim());
  }
  if (mụcRỗng.length) lỗi.push(`${mụcRỗng.length} mục gần như rỗng (${mụcRỗng.join(' · ')}) — thiếu nguồn thì BỎ MỤC, đừng để tiêu đề trống`);

  // 3. Phụ lục có phủ được các mã của nguồn không? (cảnh báo: gộp có quyền bỏ bớt phạm vi)
  const trongPL = new Set(phụLục.match(RE_ID) || []);
  const cao = tổngID.filter((id) => tầngCủa(id) === 'trình bày');
  const caoThiếu = cao.filter((id) => !trongPL.has(id));
  const tỉLệ = cao.length ? Math.round((1 - caoThiếu.length / cao.length) * 100) : 100;
  const tỉLệTấtCả = tổngID.length ? Math.round(([...trongPL].filter((id) => tổngID.includes(id)).length / tổngID.length) * 100) : 100;
  if (cao.length && tỉLệ < 50) lỗi.push(`Phụ lục B chỉ phủ ${tỉLệ}% mã tầng trình bày (${cao.length - caoThiếu.length}/${cao.length}) — quá thấp để gọi là ánh xạ truy vết`);
  else if (caoThiếu.length) cảnhBáo.push(`Phụ lục B phủ ${tỉLệ}% mã tầng trình bày; còn thiếu ${caoThiếu.slice(0, 10).join(', ')}${caoThiếu.length > 10 ? `… (${caoThiếu.length})` : ''}`);

  // 4. Sơ đồ bị bỏ (cảnh báo — người viết có quyền chọn)
  // Sơ đồ: chỉ đếm sơ đồ CẤP DỰ ÁN làm mốc. Nguồn có 49 sơ đồ vì mỗi màn mang vài cái — đòi bài
  // dùng hết là lại ép nó thành bản in hồ sơ. Chỉ thành lỗi khi bài KHÔNG mang sơ đồ nào.
  const sốSơĐồBài = (bài.match(/```mermaid/g) || []).length;
  const sơĐồDựÁn = sơĐồ.filter((s) => !/srs\.md$/.test(s.nguồn)).length;
  if (sơĐồ.length && !sốSơĐồBài) lỗi.push(`nguồn có ${sơĐồ.length} sơ đồ mermaid mà bài không mang sơ đồ nào`);

  return { lỗi, cảnhBáo, phủTầngTrìnhBày: tỉLệ, phủTấtCả: tỉLệTấtCả, thiếuTầngTrìnhBày: caoThiếu,
           sơĐồDùng: sốSơĐồBài, sơĐồCấpDựÁn: sơĐồDựÁn, sơĐồNguồn: sơĐồ.length, mụcRỗng };
}

const kq = CHECK ? soát() : null;
const out = CHECK
  ? { chếĐộ: 'check', file: CHECK, docs: DOCS, ...kq,
      gioiHan: ['chỉ soát thứ ĐẾM ĐƯỢC: mã lọt, mục rỗng, độ phủ phụ lục, sơ đồ. Văn có liền mạch, gộp có đúng ý hay không là việc người đọc',
                'ngưỡng độ phủ CHỈ áp cho mã tầng trình bày (BR/BO/FR/NFR/F/S/ADR/CR/OQ/DEC/GĐ/SH/PS/U/EXT). Mã tầng thực thi (R-S, E-S, BRule, TC, UC) đếm để tham khảo — tài liệu trình bày cố ý không liệt kê chúng',
                'không kiểm nội dung câu có phản bội nguồn không — đó là việc của ba-review / ba-consistency-reviewer'] }
  : { chếĐộ: 'kiểm kê', docs: DOCS, sốMàn: màn.length, mụcLục, thêm, sơĐồ,
      sốID: tổngID.length, idTheoNguồn,
      gioiHan: ['chỉ nói nguồn CÓ hay KHÔNG, không nói nguồn đủ hay thiếu nội dung',
                'khung 15 mục là HÌNH DẠNG mặc định, không phải bắt buộc — người duyệt mục lục mới là bên quyết'] };

if (!PLAIN) { console.log(JSON.stringify(out, null, 2)); process.exit(CHECK ? kq.lỗi.length : 0); }

if (CHECK) {
  console.log(`\nSoát ${path.relative(process.cwd(), CHECK)} — ${kq.lỗi.length} lỗi · ${kq.cảnhBáo.length} cảnh báo`);
  console.log(`Phụ lục B phủ ${kq.phủTầngTrìnhBày}% mã tầng trình bày (${kq.phủTấtCả}% nếu tính cả mã tầng thực thi — mã lỗi, ca kiểm thử, yêu cầu màn; tài liệu trình bày cố ý không liệt kê chúng)`);
  console.log(`Sơ đồ: bài dùng ${kq.sơĐồDùng} · nguồn cấp dự án có ${kq.sơĐồCấpDựÁn} · toàn bộ nguồn ${kq.sơĐồNguồn}\n`);
  for (const l of kq.lỗi) console.log(`  ❌ ${l}`);
  for (const c of kq.cảnhBáo) console.log(`  ⚠️  ${c}`);
  if (!kq.lỗi.length && !kq.cảnhBáo.length) console.log('  ✅ sạch');
} else {
  console.log(`\nKiểm kê nguồn tại ${DOCS} — ${màn.length} màn · ${tổngID.length} mã ID\n`);
  console.log('MỤC LỤC ĐỀ XUẤT (co giãn theo nguồn có thật):');
  for (const m of mụcLục) {
    if (m.giữ) console.log(`  ${String(m.số).padStart(2)}. ${m.tên}\n        ← ${m.nguồn.join(' · ')}`);
    else console.log(`  ${String(m.số).padStart(2)}. ${m.tên}   ⛔ BỎ — ${m.lýDoBỏ}`);
  }
  if (thêm.length) { console.log('\nKHUNG THIẾU, DỰ ÁN CÓ:'); for (const t of thêm) console.log(`  +  ${t.gợiÝ}`); }
  console.log(`\nSơ đồ dùng lại được: ${sơĐồ.length}${sơĐồ.length ? ' (' + [...new Set(sơĐồ.map((s) => s.loại))].join(', ') + ')' : ''}`);
}
console.log(`\nGiới hạn:\n${out.gioiHan.map((g) => '  · ' + g).join('\n')}`);
