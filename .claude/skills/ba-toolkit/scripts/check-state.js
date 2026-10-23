#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
/*
 * ba-toolkit/scripts/check-state.js — ĐỐI CHIẾU vòng đời trạng thái: sơ đồ `stateDiagram-v2` ↔ bảng chuyển trạng thái
 * ngay dưới nó ↔ cột enum ở `05-data-model.md`. Zero-dependency, CommonJS. Chỉ đọc.
 *
 *   node .claude/skills/ba-toolkit/scripts/check-state.js [docs | <file.md> …] [--plain|--json]
 *   node .claude/skills/ba-toolkit/scripts/check-state.js --rules
 *
 * Khuôn (mẫu `ba-screen-spec/assets/templates.md` → "Bảng chuyển trạng thái"), nằm sau khối sơ đồ, trước tiêu đề `#`–`###` kế:
 *   > Dữ liệu: `CongViec.trang_thai` (`05-data-model.md`)          ← tuỳ chọn; có thì so enum
 *   | Trạng thái | Tên | Mã dữ liệu | Loại |                         ← bảng trạng thái (Loại: đầu / giữa / cuối)
 *   | Từ | Sự kiện | Điều kiện | Sang | Ai thực hiện | Trace |      ← bảng chuyển, một dòng một mũi tên
 *
 * Luật (mỗi phát hiện một dòng `file:dòng · mã · đối tượng`):
 *   ST-THIEU  mũi tên trong sơ đồ không có dòng ở bảng chuyển
 *   ST-THUA   dòng bảng chuyển không có mũi tên trong sơ đồ (bảng và sơ đồ lệch nhau)
 *   ST-AI     dòng chuyển không ghi ai thực hiện (hoặc bảng không có cột đó)
 *   ST-NODE   trạng thái có ở sơ đồ mà vắng ở bảng trạng thái, hoặc ngược lại
 *   ST-LOAI   `[*] --> X` mà X không ghi "đầu", `X --> [*]` mà X không ghi "cuối"
 *   ST-REF    dòng "Dữ liệu:" trỏ tới thực thể/cột không có (hoặc cột không phải enum) trong `05-data-model.md`
 *   ST-ENUM   mã dữ liệu của một trạng thái không thuộc enum của cột
 *   ST-SOT    giá trị enum không trạng thái nào mang — dữ liệu có trạng thái mà vòng đời không vẽ (lifecycle drift)
 *   ST-TOI    trạng thái không đi tới được từ `[*]` theo mũi tên — chỉ cần sơ đồ, xét cả khi chưa có bảng; bỏ qua trạng thái lồng `state X { … }`
 * Exit = số phát hiện (0 sạch) · 2 không đọc được nguồn.
 *
 * Sơ đồ KHÔNG có bảng chuyển → "không xét" các luật cần bảng (tài liệu viết trước khi có khuôn), không báo, không nói sạch.
 *
 * VÌ SAO CÓ (docs/decisions/40): sơ đồ state chỉ có mũi tên + nhãn tự do — ai được chuyển, điều kiện chặn, mã lưu ở
 * CSDL không có chỗ ghi, và trạng thái vẽ có thể lệch enum ở `05-data-model.md` mà không ai thấy. Ý bảng chuyển 5 cột lấy
 * từ OpenBA-Kit `rules/12-state-transition-rules.md` (MIT); ý so vòng đời ↔ enum từ đánh giá Reqwise (lifecycle-drift).
 *
 * gioiHan — MÁY KHÔNG KIỂM: chuyển có đúng nghiệp vụ không, điều kiện (guard) có đủ không, vai trò có đúng quyền không
 * (việc của `ba-diagram-reviewer`/`ba-consistency-reviewer`) · trạng thái lồng `state X { … }` và nhánh song song `--`
 * (chỉ đọc mũi tên phẳng) · so mũi tên theo CẶP từ→sang: hai mũi tên cùng cặp khác sự kiện chỉ cần một dòng · enum đọc
 * từ bảng từ điển dữ liệu (`### Thực thể: Tên` + cột Kiểu chứa "enum"), không từ `erDiagram`.
 */
const fs = require('fs');
const path = require('path');
const RC = require(path.join(__dirname, 'rule-cover.js'));
const { resolveDoc } = require(path.join(__dirname, 'docpath.js'));

const LUẬT = [
  ['ST-THIEU', 'mũi tên trong sơ đồ không có dòng ở bảng chuyển'],
  ['ST-THUA', 'dòng bảng chuyển không có mũi tên trong sơ đồ'],
  ['ST-AI', 'dòng chuyển không ghi ai thực hiện'],
  ['ST-NODE', 'trạng thái lệch giữa sơ đồ và bảng trạng thái'],
  ['ST-LOAI', 'trạng thái đầu/cuối trong sơ đồ không ghi đúng Loại'],
  ['ST-REF', 'dòng "Dữ liệu:" trỏ tới cột enum không có'],
  ['ST-ENUM', 'mã dữ liệu không thuộc enum'],
  ['ST-SOT', 'giá trị enum không trạng thái nào mang'],
  ['ST-TOI', 'trạng thái không đi tới được từ [*]'],
];
RC.inLuật(process.argv, LUẬT);

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const nguồn = args.filter((a) => !a.startsWith('--'));
if (!nguồn.length) nguồn.push('docs');

function gom(p, out) {
  let st; try { st = fs.statSync(p); } catch { return false; }
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const q = path.join(p, e.name);
      if (e.isDirectory()) gom(q, out); else if (e.name.endsWith('.md')) out.push(q);
    }
  } else out.push(p);
  return true;
}
const tệp = [];
for (const n of nguồn) if (!gom(path.resolve(n), tệp)) { console.error(`✖ Không đọc được: ${n}`); process.exit(2); }
const gốcIn = fs.statSync(path.resolve(nguồn[0])).isDirectory() ? path.resolve(nguồn[0]) : process.cwd();

const ô = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => s.trim());
const sạch = (s) => s.replace(/[`*]/g, '').trim();
const trống = (s) => !s || /^[-—–]+$/.test(s);

/* ── Enum của 05-data-model: tìm thư mục docs đi ngược từ tệp ─────────────────────────── */
const enumCache = new Map();
function enumCủa(tệpMd) {
  let d = path.dirname(tệpMd);
  for (let i = 0; i < 8; i++) {
    const p = resolveDoc(d, '05-data-model.md');
    if (p) return đọcEnum(p);
    const lên = path.dirname(d); if (lên === d) break; d = lên;
  }
  return null;
}
function đọcEnum(p) {
  if (enumCache.has(p)) return enumCache.get(p);
  const m = new Map();                          // 'thựcthể.cột' (chữ thường) → [giá trị]
  let thựcThể = [], kiểu = -1, ràngBuộc = -1;
  for (const l of fs.readFileSync(p, 'utf8').split('\n')) {
    const h = /^#{2,4}\s+(?:Thực thể|Entity)\s*:\s*([A-Za-z0-9_]+)(?:\s*\(([A-Za-z0-9_]+)\))?/.exec(l);
    if (h) { thựcThể = [h[1], h[2]].filter(Boolean).map((x) => x.toLowerCase()); kiểu = -1; continue; }
    if (/^#/.test(l)) { thựcThể = []; continue; }
    if (!thựcThể.length || !l.startsWith('|')) continue;
    const c = ô(l);
    if (kiểu < 0) { kiểu = c.findIndex((x) => /^Kiểu|^Type/i.test(x)); ràngBuộc = c.findIndex((x) => /^Ràng buộc|^Giá trị|^Constraint/i.test(x)); continue; }
    if (kiểu < 0 || !/enum/i.test(c[kiểu] || '')) continue;
    const vùng = ràngBuộc >= 0 ? c[ràngBuộc] : c[kiểu];
    const giá = sạch(vùng).split(/[,/]/).map((x) => x.trim().split(/\s+/)[0]).filter((x) => /^[A-Za-z][A-Za-z0-9_]*$/.test(x));
    for (const t of thựcThể) m.set(`${t}.${sạch(c[0]).toLowerCase()}`, giá);
  }
  enumCache.set(p, m);
  return m;
}

/* ── Tách khối + vùng bảng ngay sau mỗi khối stateDiagram ──────────────────────────────── */
const phátHiện = [];
let sốSơĐồ = 0;
const khôngXét = [];
for (const f of tệp) {
  let text; try { text = fs.readFileSync(f, 'utf8'); } catch { console.error(`✖ Không đọc được: ${f}`); process.exit(2); }
  const rel = path.relative(gốcIn, f) || path.basename(f);
  const dòng = text.split('\n');
  const báo = (mã, số, đt, câu) => phátHiện.push({ tệp: rel, dòng: số, mã, đốiTượng: đt, câu });
  let ngoài = null;
  for (let i = 0; i < dòng.length; i++) {
    const m = dòng[i].match(/^\s*(`{3,}|~{3,})\s*(\S*)/);
    if (ngoài) { if (m && m[1] === ngoài && !m[2]) ngoài = null; continue; }
    if (!m) continue;
    if (!(m[1] === '```' && m[2] === 'mermaid')) { ngoài = m[1]; continue; }
    // khối mermaid: gom tới ``` đóng
    let j = i + 1; const thân = [];
    for (; j < dòng.length && !/^\s*```\s*$/.test(dòng[j]); j++) thân.push([j + 1, dòng[j]]);
    const đầu = thân.find(([, l]) => l.trim() && !/^\s*%%/.test(l));
    const bắtĐầu = i + 1;
    i = j;
    if (!đầu || !/^\s*stateDiagram(-v2)?\b/.test(đầu[1])) continue;
    sốSơĐồ++;

    // Sơ đồ: mũi tên phẳng `A --> B[: nhãn]`
    const mũi = [], nút = new Map();             // nút: id → dòng đầu tiên gặp
    const đầuSet = new Set(), cuốiSet = new Set(), lồng = new Set();
    let sâu = 0;                                  // trong `state X { … }`: trạng thái con không xét ST-TOI
    for (const [số, thô] of thân) {
      const l = thô.replace(/%%.*$/, '').trim();
      let r;
      if (/\{\s*$/.test(l)) sâu++;              // `state X {` — vẫn đọc tiếp (có thể là `state "x" as X {`)
      if (/^\}/.test(l)) { sâu = Math.max(0, sâu - 1); continue; }
      if ((r = /^state\s+"[^"]*"\s+as\s+([A-Za-z0-9_]+)/.exec(l))) { if (!nút.has(r[1])) nút.set(r[1], số); continue; }
      if ((r = /^(\[\*\]|[A-Za-z0-9_]+)\s*-->\s*(\[\*\]|[A-Za-z0-9_]+)/.exec(l))) {
        const [, a, b] = r;
        if (a !== '[*]' && !nút.has(a)) nút.set(a, số);
        if (b !== '[*]' && !nút.has(b)) nút.set(b, số);
        if (sâu) { if (a !== '[*]') lồng.add(a); if (b !== '[*]') lồng.add(b); }
        if (a === '[*]') đầuSet.add(b); else if (b === '[*]') cuốiSet.add(a); else mũi.push({ a, b, số });
      }
    }

    // Tới được từ [*]: chỉ cần sơ đồ, không cần bảng
    if (đầuSet.size) {
      const kề = new Map();
      for (const x of mũi) { if (!kề.has(x.a)) kề.set(x.a, []); kề.get(x.a).push(x.b); }
      const thấy = new Set(đầuSet), hàng = [...đầuSet];
      while (hàng.length) for (const y of kề.get(hàng.shift()) || []) if (!thấy.has(y)) { thấy.add(y); hàng.push(y); }
      for (const [id, số] of nút) if (!thấy.has(id) && !lồng.has(id)) báo('ST-TOI', số, id, 'không đi tới được từ [*] theo mũi tên nào');
    }

    // Vùng bảng: tới tiêu đề #–### kế tiếp hoặc khối mermaid kế tiếp
    let bảngChuyển = null, bảngTT = null, refDữLiệu = null;
    for (let k = j + 1; k < dòng.length; k++) {
      const l = dòng[k];
      if (/^#{1,3}\s/.test(l) || /^\s*```mermaid/.test(l)) break;
      const rf = /Dữ liệu\s*:\s*`([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)`/.exec(l);
      if (rf && !refDữLiệu) refDữLiệu = { thựcThể: rf[1], cột: rf[2], số: k + 1 };
      if (!l.startsWith('|')) continue;
      const c = ô(l);
      const iTừ = c.findIndex((x) => /^Từ(\s|$)/.test(sạch(x))), iSang = c.findIndex((x) => /^Sang\b/.test(sạch(x)));
      if (iTừ >= 0 && iSang >= 0 && !bảngChuyển) {
        bảngChuyển = { số: k + 1, iTừ, iSang, iAi: c.findIndex((x) => /^(Ai|Vai trò|Người)/i.test(sạch(x))), dòng: [] };
        let q = k + 2;
        for (; q < dòng.length && dòng[q].startsWith('|'); q++) bảngChuyển.dòng.push([q + 1, ô(dòng[q])]);
        k = q - 1; continue;
      }
      const iTT = c.findIndex((x) => /^Trạng thái\b/.test(sạch(x))), iMã = c.findIndex((x) => /^Mã/.test(sạch(x))), iLoại = c.findIndex((x) => /^Loại\b/.test(sạch(x)));
      if (iTT >= 0 && (iMã >= 0 || iLoại >= 0) && !bảngTT) {
        bảngTT = { số: k + 1, iTT, iMã, iLoại, dòng: [] };
        let q = k + 2;
        for (; q < dòng.length && dòng[q].startsWith('|'); q++) bảngTT.dòng.push([q + 1, ô(dòng[q])]);
        k = q - 1;
      }
    }
    if (!bảngChuyển) { khôngXét.push(`${rel}:${bắtĐầu}`); continue; }

    // Bảng chuyển ↔ mũi tên
    const cặpSơĐồ = new Set(mũi.map((x) => `${x.a}>${x.b}`));
    const cặpBảng = new Set();
    if (bảngChuyển.iAi < 0) báo('ST-AI', bảngChuyển.số, 'bảng chuyển', 'không có cột "Ai thực hiện"');
    for (const [số, c] of bảngChuyển.dòng) {
      const a = sạch(c[bảngChuyển.iTừ] || ''), b = sạch(c[bảngChuyển.iSang] || '');
      if (!a || !b || a === '[*]' || b === '[*]') continue;
      cặpBảng.add(`${a}>${b}`);
      if (!cặpSơĐồ.has(`${a}>${b}`)) báo('ST-THUA', số, `${a} → ${b}`, 'có ở bảng, không có trong sơ đồ');
      if (bảngChuyển.iAi >= 0 && trống(sạch(c[bảngChuyển.iAi] || ''))) báo('ST-AI', số, `${a} → ${b}`, 'không ghi ai thực hiện');
    }
    const đãBáo = new Set();
    for (const x of mũi) {
      const k = `${x.a}>${x.b}`;
      if (!cặpBảng.has(k) && !đãBáo.has(k)) { đãBáo.add(k); báo('ST-THIEU', x.số, `${x.a} → ${x.b}`, 'mũi tên chưa có dòng ở bảng chuyển'); }
    }

    // Bảng trạng thái ↔ nút sơ đồ ↔ enum
    if (!bảngTT) continue;
    const tt = new Map();                          // id → { mã, loại, số }
    for (const [số, c] of bảngTT.dòng) {
      const id = sạch(c[bảngTT.iTT] || '');
      if (!id || id === '[*]') continue;
      tt.set(id, { mã: bảngTT.iMã >= 0 ? sạch(c[bảngTT.iMã] || '') : '', loại: bảngTT.iLoại >= 0 ? sạch(c[bảngTT.iLoại] || '').toLowerCase() : '', số });
    }
    for (const [id, số] of nút) if (!tt.has(id)) báo('ST-NODE', số, id, 'có trong sơ đồ, vắng ở bảng trạng thái');
    for (const [id, v] of tt) if (!nút.has(id)) báo('ST-NODE', v.số, id, 'có ở bảng trạng thái, không có trong sơ đồ');
    if (bảngTT.iLoại >= 0) {
      for (const id of đầuSet) if (tt.has(id) && !/đầu/.test(tt.get(id).loại)) báo('ST-LOAI', tt.get(id).số, id, 'sơ đồ vào từ [*] mà Loại không ghi "đầu"');
      for (const id of cuốiSet) if (tt.has(id) && !/cuối/.test(tt.get(id).loại)) báo('ST-LOAI', tt.get(id).số, id, 'sơ đồ ra [*] mà Loại không ghi "cuối"');
    }
    if (!refDữLiệu || bảngTT.iMã < 0) continue;
    const em = enumCủa(f);
    const khoá = `${refDữLiệu.thựcThể}.${refDữLiệu.cột}`.toLowerCase();
    const giá = em && em.get(khoá);
    if (!giá) { báo('ST-REF', refDữLiệu.số, `${refDữLiệu.thựcThể}.${refDữLiệu.cột}`, em ? 'không thấy cột enum này trong 05-data-model.md' : 'không thấy 05-data-model.md'); continue; }
    const mãDùng = new Set();
    for (const [id, v] of tt) {
      if (trống(v.mã)) continue;
      mãDùng.add(v.mã);
      if (!giá.includes(v.mã)) báo('ST-ENUM', v.số, `${id} = ${v.mã}`, `không thuộc enum ${refDữLiệu.thựcThể}.${refDữLiệu.cột} (${giá.join(', ')})`);
    }
    for (const g of giá) if (!mãDùng.has(g)) báo('ST-SOT', refDữLiệu.số, g, `giá trị enum ${refDữLiệu.thựcThể}.${refDữLiệu.cột} không trạng thái nào mang`);
  }
}

RC.ghi('check-state', phátHiện.map((x) => x.mã));
if (JSON_OUT) {
  console.log(JSON.stringify({ sốTệp: tệp.length, sốSơĐồ, khôngXét, phátHiện: phátHiện.map((x) => ({ ...x, mức: 'warn' })) }, null, 2));
} else {
  for (const x of phátHiện) console.log(`⚠️ ${x.mã} ${x.tệp}:${x.dòng} · ${x.đốiTượng} — ${x.câu}`);
  const đuôi = `${sốSơĐồ} sơ đồ trạng thái trong ${tệp.length} tệp · ${phátHiện.length} phát hiện` + (khôngXét.length ? ` · ${khôngXét.length} sơ đồ chưa có bảng chuyển → không xét` : '');
  console.log(phátHiện.length ? `\n${đuôi}` : `✓ ${đuôi}`);
  console.log('Máy KHÔNG kiểm: chuyển có đúng nghiệp vụ, điều kiện có đủ, vai trò có đúng quyền — việc của ba-diagram-reviewer.');
}
process.exit(Math.min(phátHiện.length, 125));
