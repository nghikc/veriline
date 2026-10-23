#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: không cụt khi process.exit qua pipe (lint 43)
/*
 * ba-change-request/impact.js — từ các ID mà một CR định đổi, lần XUÔI chuỗi truy vết
 * `BR → StR → FR/NFR → F → S → R-S/BRule/E → UC/US/CL → TC` và liệt kê MỌI tài liệu nhắc tới
 * ID bị chạm — bảng "Đổi X → N tài liệu" ở bước 1 của ba-change-request. Zero-dependency, chỉ đọc.
 *
 * Vì sao (docs/decisions/37): bước 1 từng chỉ dặn "liệt kê ID bị chạm ở từng cấp" — agent lần
 * bằng mắt, mỗi lần ra một kiểu, và người duyệt không thấy được DANH SÁCH FILE sẽ bị sửa. Ngày
 * 31/08/2026 một CR đã sửa 2 trong 5 tài liệu cùng nói về một vấn đề. Máy đếm để không sót file;
 * "sửa gì · độ lớn · rủi ro" là phán đoán — script để trống (`…`), skill điền.
 *
 * Cách lần (đếm, không phán):
 *   - Một ID "được định nghĩa" ở dòng bảng có ô đầu là ID đó, hoặc ở tiêu đề `## UC-S01-01: …`
 *     (thân mục tới tiêu đề kế là "dòng" của nó). Mọi ID khác trên dòng đó mà ĐỨNG TRÊN nó trong
 *     chuỗi là cha của nó. Bậc: BR 0 · StR 1 · FR/NFR 2 · F 3 · S 4 · R 5.0 · BRule 5.1 · E 5.2 ·
 *     UC/US/CL 6 · TC 7 — nhắc tới ID cùng bậc hoặc thấp hơn (anh em, "từ UC-S01-01") không thành cạnh.
 *   - Bị chạm = ID gốc + mọi ID có cha bị chạm (lặp tới khi đứng yên). Không lần ngược lên:
 *     cha của ID gốc chỉ được in ở mục "Cấp trên — đọc lại".
 *   - Tài liệu ứng viên = mọi tệp nhắc ≥1 ID bị chạm (đếm số lần nhắc; dải `BRule-S01-01..06`
 *     được bung ra). Màn có ID bị chạm mà tệp của màn không nhắc ID nào (ascii-screen,
 *     design-spec…) → mục "Soát bằng mắt".
 *   - `--term "<chữ>"` (lặp được): giá trị/cụm chữ CR định đổi ("5 lần", "15 phút"). Con số nghiệp vụ
 *     hay được chép lại bằng lời ở nơi KHÔNG nhắc mã (NFR gốc, màn khác "cùng ngưỡng", userguide,
 *     roadmap) — mọi tệp chứa nó thành dòng ứng viên, kể cả ngoài chuỗi. Khớp nguyên cụm, không
 *     phân biệt hoa thường: "5 lần" không khớp "15 lần" (truyền riêng nếu cũng đổi).
 *
 * Dùng:
 *   node .claude/skills/ba-change-request/scripts/impact.js [docsDir=docs] <ID…> [--term "<chữ>"…] [--base <rev>] [--json] [--plain]
 *   --base <rev>: thêm vào ID gốc mọi ID semdiff thấy đổi giữa <rev> và cây làm việc (CR đã sửa nháp).
 * Exit: 0 có kết quả · 1 ID gốc không có trong tài liệu nào · 2 tham số sai / không đọc được.
 *
 * gioiHan: chỉ thấy liên kết VIẾT RA bằng mã (dòng bảng, tiêu đề, văn xuôi có mã) — quan hệ chỉ
 * nói bằng lời ("màn đăng nhập") không thấy. Không đọc sổ (00-cr/00-backlog/00-changelog/
 * 00-decisions) và hồ sơ lịch sử (reviews, audit, meetings, releases…): đó là ghi chép đã xảy ra,
 * không phải tài liệu phải sửa. Không lần sang code ngoài e2e — code thuộc plan.md/dev-run.
 */
const fs = require('fs');
const path = require('path');
const docpath = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));
const e2epath = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'e2epath.js'));

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
const BASE = opt('--base'), JSONOUT = argv.includes('--json'), PLAIN = argv.includes('--plain');
const pos = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--base' && argv[i - 1] !== '--term');
const TERMS = argv.map((a, i) => (a === '--term' ? argv[i + 1] : null)).filter((x) => x && x.trim());
if (argv.includes('--term') && TERMS.length !== argv.filter((a) => a === '--term').length) { console.error('--term cần một cụm chữ, vd --term "5 lần"'); process.exit(2); }
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RE_TERM = TERMS.map((x) => new RegExp(`${/^[\p{L}\p{N}]/u.test(x) ? '(?<![\\p{L}\\p{N}])' : ''}${esc(x.trim()).replace(/\s+/g, '\\s+')}${/[\p{L}\p{N}]$/u.test(x) ? '(?![\\p{L}\\p{N}])' : ''}`, 'giu'));

/* ───────── mã trên chuỗi truy vết ───────── */
const ID_SRC = '(?:(?:BRule|R|E|UC|US|TC|CL)-S\\d+-[A-Z]?\\d+|(?:BR|StR|NFR|FR)-\\d+|F\\d{2,3}|S\\d{2,3})';
const RE_ID = new RegExp(`(?<![\\w-])${ID_SRC}(?![\\w-])`, 'g');
const RE_DẢI = new RegExp(`(?<![\\w-])((?:BRule|R|E|UC|US|TC|CL)-S\\d+-|(?:BR|StR|NFR|FR)-)([A-Z]?)(\\d+)\\s*(?:\\.\\.|…|–)\\s*\\2?(\\d+)(?![\\w-])`, 'g');
const làMã = (s) => new RegExp(`^${ID_SRC}$`).test(s);
function bậc(id) {
  const k = id.match(/^[A-Za-z]+/)[0];
  if (/^(BRule|R|E|UC|US|TC|CL)$/.test(k) && !/-S\d/.test(id)) return null;
  return { BR: 0, StR: 1, FR: 2, NFR: 2, F: 3, S: 4, R: 5, BRule: 5.1, E: 5.2, UC: 6, US: 6, CL: 6, TC: 7 }[k] ?? null;
}
/** mọi mã trong một đoạn chữ (bung dải `X-01..06`), có lặp — để đếm số lần nhắc */
function mãTrong(t) {
  const ra = t.match(RE_ID) || [];
  for (const m of t.matchAll(RE_DẢI)) {
    const [, tiền, chữ, a, b] = m, w = a.length;
    if (+b > +a && +b - +a <= 50) for (let n = +a + 1; n < +b; n++) ra.push(`${tiền}${chữ}${String(n).padStart(w, '0')}`);
  }
  return ra;
}

/* ───────── gom tệp ───────── */
if (!pos.filter((a) => làMã(a)).length && !BASE && !TERMS.length) { console.error('Dùng: impact.js [docsDir=docs] <ID…> [--term "<chữ>"…] [--base <rev>] [--json] [--plain]  (vd: impact.js docs BRule-S01-06 FR-03)'); process.exit(2); }
const DOCS = path.resolve(pos[0] && !làMã(pos[0]) ? pos[0] : 'docs');
if (!fs.existsSync(DOCS)) { console.error(`Không thấy thư mục ${DOCS} — chạy từ gốc dự án hoặc truyền đúng docsDir.`); process.exit(2); }
const seedArg = pos.filter((a) => làMã(a));
const lạ = pos.filter((a, i) => !(i === 0 && !làMã(a)) && !làMã(a));
if (lạ.length) { console.error(`Không phải mã trên chuỗi truy vết: ${lạ.join(', ')} (nhận BR/StR/FR/NFR/F/S/R-S/BRule-S/E-S/UC-S/US-S/CL-S/TC-S).`); process.exit(2); }

const SỔ = /^00-(cr|backlog|changelog|decisions)\.md$/;
const SINH_LẠI = /^(verification(-[\w-]+)?\.md|00-tracking\.md|00-traceability\.md|00-gaps\.md|00-dashboard\.md|00-conformance\.md|00-onepager\.(md|html)|portal\.html|design-canvas\.html|prototype-hifi\.html|sitemap.*)$/;
const BỎ_THƯ_MỤC = /^(removed|reviews|eval|jury|audit|po|notes|meetings|releases|ui-source|figma-assets|node_modules|\.git)$/;
const BỎ_TỆP = /^(dev-notes\.md|00-lessons\.md|00-figma-sync\.md)$/;
const tệp = [];
(function đi(dir) {
  let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!BỎ_THƯ_MỤC.test(e.name)) đi(p); continue; }
    if (SỔ.test(e.name) || BỎ_TỆP.test(e.name)) continue;
    if (/\.md$/.test(e.name) || /\.html$/.test(e.name) || e.name === 'e2e.spec.ts') tệp.push(p);
  }
})(DOCS);
const gốc = e2epath.rootOf ? e2epath.rootOf(DOCS) : path.resolve(DOCS, '..');
for (const d of e2epath.THU_MUC_E2E) {
  let ds = []; try { ds = fs.readdirSync(path.join(gốc, d)); } catch { continue; }
  for (const t of ds) if (/\.spec\.[jt]s$/.test(t)) tệp.push(path.join(gốc, d, t));
}

/* ───────── đồ thị ───────── */
const cha = {}, nơiĐịnhNghĩa = {}, nhắc = {}, nhắcChữ = {}; // nhắc[file] = Map(id → số lần) · nhắcChữ[file] = Map(term → {n, dòng[]})
const thêmCạnh = (con, ds, file) => {
  const b = bậc(con); if (b === null) return;
  (nơiĐịnhNghĩa[con] = nơiĐịnhNghĩa[con] || new Set()).add(file);
  for (const p of ds) { const bp = bậc(p); if (bp !== null && bp < b && p !== con) (cha[con] = cha[con] || new Set()).add(p); }
};
const ôĐầu = (l) => (l.split('|')[1] || '').replace(/[`*~]/g, '').trim();
for (const f of tệp) {
  let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
  const m = new Map();
  for (const id of mãTrong(t)) if (bậc(id) !== null) m.set(id, (m.get(id) || 0) + 1);
  nhắc[f] = m;
  if (RE_TERM.length) {
    const mc = new Map();
    t.split('\n').forEach((l, i) => RE_TERM.forEach((re, k) => {
      const c = (l.match(re) || []).length;
      if (c) { const v = mc.get(TERMS[k]) || { n: 0, dòng: [] }; v.n += c; v.dòng.push(i + 1); mc.set(TERMS[k], v); }
    }));
    if (mc.size) nhắcChữ[f] = mc;
  }
  if (!/\.md$/.test(f) || SINH_LẠI.test(path.basename(f))) continue; // tệp sinh lại không tạo cạnh (nó chép lại cạnh của nguồn)
  const dòng = t.split('\n');
  for (let i = 0; i < dòng.length; i++) {
    const l = dòng[i];
    if (/^\s*\|/.test(l)) { const đầu = ôĐầu(l); if (làMã(đầu)) thêmCạnh(đầu, mãTrong(l), f); continue; }
    const h = l.match(/^(#{2,5})\s+\**`?([A-Za-z]+-S\d+-[A-Z]?\d+|(?:BR|StR|NFR|FR)-\d+|F\d{2,3})`?\**\s*[:—–\-.]/);
    if (h) { // thân mục tới tiêu đề cùng hoặc cao cấp hơn
      let j = i + 1; while (j < dòng.length && !(new RegExp(`^#{1,${h[1].length}}\\s`).test(dòng[j]))) j++;
      thêmCạnh(h[2], mãTrong(dòng.slice(i, j).join('\n')), f);
    }
  }
}

/* ───────── ID gốc ───────── */
const gốcID = new Set(seedArg);
if (BASE) {
  const sd = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'semdiff.js'));
  let n = 0;
  const cwd0 = process.cwd(); process.chdir(DOCS); // semdiff gọi `git show` theo cwd — chạy từ thư mục khác repo thì mọi tệp thành "không có ở base", mọi ID thành "thêm"
  for (const f of tệp.filter((x) => /\.md$/.test(x) && x.startsWith(DOCS))) {
    const rel = path.relative(DOCS, f);
    const r = sd.soSanhMotFile(sd.đọcTạiRev(rel, BASE, DOCS), sd.đọcTạiRev(rel, null, DOCS));
    for (const x of r.ids) if (bậc(x.id) !== null) { gốcID.add(x.id); n++; }
  }
  process.chdir(cwd0);
  if (!n && !seedArg.length && !TERMS.length) { console.error(`semdiff không thấy ID nào đổi so với ${BASE} — truyền ID gốc trực tiếp.`); process.exit(1); }
}
const tổngNhắc = (id) => Object.values(nhắc).reduce((s, m) => s + (m.get(id) || 0), 0);
const khôngThấy = [...gốcID].filter((id) => !tổngNhắc(id) && !nơiĐịnhNghĩa[id]);
const chữKhôngThấy = TERMS.filter((x) => !Object.values(nhắcChữ).some((m) => m.has(x)));

/* ───────── lan xuôi ───────── */
const chạm = new Map([...gốcID].map((id) => [id, { sâu: 0, qua: null }]));
for (let đổi = true; đổi;) {
  đổi = false;
  for (const [con, ps] of Object.entries(cha)) {
    if (chạm.has(con)) continue;
    const p = [...ps].filter((x) => chạm.has(x)).sort((a, b) => chạm.get(a).sâu - chạm.get(b).sâu)[0];
    if (p) { chạm.set(con, { sâu: chạm.get(p).sâu + 1, qua: p }); đổi = true; }
  }
}
const trên = new Set();
(function lên(ids) { for (const id of ids) for (const p of cha[id] || []) if (!chạm.has(p) && !trên.has(p)) { trên.add(p); lên([p]); } })([...gốcID]);

/* ───────── xếp tệp ───────── */
const relOf = (f) => (f.startsWith(DOCS + path.sep) ? path.relative(DOCS, f) : path.relative(gốc, f)).split(path.sep).join('/');
const mànCủa = (f) => { const m = relOf(f).match(/(?:^|\/)(S\d+)\s*-\s*[^/]+\//) || path.basename(f).match(/^(S\d+)-/); return m ? m[1] : null; };
const THỨ_TỰ_MÀN = ['srs.md', 'usecase.md', 'userstory.md', 'design-spec.md', 'ascii-screen.md', 'brainstorm.md', 'checklist.md', 'test.md', 'html-design.html', 'plan.md'];
function cấp(f) {
  const b = path.basename(f), r = relOf(f);
  if (!f.startsWith(DOCS + path.sep) || b === 'e2e.spec.ts') return { nhóm: 'E2E', khoá: 8 };
  if (SINH_LẠI.test(b)) return { nhóm: 'Sinh lại', khoá: 9 };
  if (mànCủa(f)) return { nhóm: `Màn ${mànCủa(f)}`, khoá: 4 + +mànCủa(f).slice(1) / 1000 };
  if (/^01-/.test(r)) return { nhóm: 'Yêu cầu', khoá: 1 };
  if (/^02-/.test(r)) return { nhóm: 'Chức năng', khoá: 2 };
  if (/^03-/.test(r)) return { nhóm: 'Danh sách màn', khoá: 3 };
  if (/^(05|06|07|10|11|12)-/.test(r) || /dbschema\//.test(r)) return { nhóm: 'Dữ liệu · API · Kiến trúc', khoá: 3.5 };
  return { nhóm: 'Hồ sơ', khoá: 7 };
}
const xếpID = (a, b) => bậc(a) - bậc(b) || a.localeCompare(b, 'en', { numeric: true });
const ds = [];
for (const [f, m] of Object.entries(nhắc)) {
  const ids = [...m.keys()].filter((id) => chạm.has(id)).sort(xếpID);
  const mc = nhắcChữ[f];
  if (!ids.length && !mc) continue;
  const c = cấp(f);
  const chữ = mc ? [...mc].map(([k, v]) => ({ chữ: k, n: v.n, dòng: v.dòng })) : [];
  ds.push({ tệp: relOf(f), nhóm: c.nhóm, khoá: c.khoá, màn: mànCủa(f), ids, chữ, chỉChữ: !ids.length,
    nhắc: ids.reduce((s, id) => s + m.get(id), 0) + chữ.reduce((s, x) => s + x.n, 0),
    địnhNghĩa: ids.filter((id) => nơiĐịnhNghĩa[id] && nơiĐịnhNghĩa[id].has(f)) });
}
const thứTựTệp = (x) => { const i = THỨ_TỰ_MÀN.indexOf(path.basename(x.tệp)); return i < 0 ? 99 : i; };
ds.sort((a, b) => a.khoá - b.khoá || thứTựTệp(a) - thứTựTệp(b) || a.tệp.localeCompare(b.tệp));
const phảiSửa = ds.filter((x) => x.nhóm !== 'Sinh lại'), sinhLại = ds.filter((x) => x.nhóm === 'Sinh lại');

// màn có ID bị chạm: tệp của màn không nhắc ID nào → soát bằng mắt; ID của màn ngoài chuỗi → gợi ý dòng "Không đổi"
const mànChạm = new Set([...chạm.keys()].map((id) => (id.match(/^S\d+$/) || id.match(/-(S\d+)-/) || [])[1] || (/^S\d+$/.test(id) ? id : null)).filter(Boolean));
for (const id of chạm.keys()) if (/^S\d+$/.test(id)) mànChạm.add(id);
const soát = tệp.filter((f) => mànCủa(f) && mànChạm.has(mànCủa(f)) && !ds.some((x) => x.tệp === relOf(f)) && /\.(md|html)$/.test(f)).map(relOf).sort();
const sốChỉChữ = phảiSửa.filter((x) => x.chỉChữ).length;
const ngoàiChuỗi = {};
for (const id of Object.keys(nơiĐịnhNghĩa)) {
  const s = (id.match(/-(S\d+)-/) || [])[1];
  if (s && mànChạm.has(s) && !chạm.has(id) && !trên.has(id)) (ngoàiChuỗi[s] = ngoàiChuỗi[s] || []).push(id);
}

/* ───────── xuất ───────── */
const KQ = {
  docs: DOCS, gốc: [...gốcID], khôngThấy, chữ: TERMS, chữKhôngThấy,
  chạm: [...chạm].map(([id, v]) => ({ id, sâu: v.sâu, qua: v.qua })).sort((a, b) => a.sâu - b.sâu || xếpID(a.id, b.id)),
  phảiSửa: phảiSửa.map(({ khoá, ...x }) => x), sinhLại: sinhLại.map((x) => x.tệp), soátBằngMắt: soát,
  cấpTrên: [...trên].sort(xếpID), ngoàiChuỗi: Object.fromEntries(Object.entries(ngoàiChuỗi).map(([s, a]) => [s, a.sort(xếpID)])),
};
const rỗng = khôngThấy.length === gốcID.size && chữKhôngThấy.length === TERMS.length;
if (JSONOUT) { console.log(JSON.stringify(KQ, null, 2)); process.exit(rỗng ? 1 : 0); }

const rút = (a, n = 6) => (a.length > n ? `${a.slice(0, n).join(', ')} +${a.length - n}` : a.join(', '));
const tên = (x) => (x.màn && x.nhóm.startsWith('Màn') ? path.basename(x.tệp) : x.tệp);
console.log(`\n=== Ảnh hưởng — ${relOf(DOCS) || DOCS} ===`);
if (khôngThấy.length) console.log(`  ❌ Không thấy trong tài liệu nào: ${khôngThấy.join(', ')} — gõ sai mã, hoặc ID mới CR sắp thêm (khi đó lần từ ID cha của nó).`);
if (chữKhôngThấy.length) console.log(`  ❌ Không tệp nào chứa: ${chữKhôngThấy.map((x) => `"${x}"`).join(', ')} — thử cách viết khác ("lần thứ 5", "5 lần sai").`);
if (rỗng) { console.log('\n=== Không có ID gốc hay cụm chữ nào để lần — dừng ==='); process.exit(1); }
const sốMàn = new Set(phảiSửa.filter((x) => x.màn).map((x) => x.màn)).size;
const nhãnGốc = [...[...gốcID].filter((id) => !khôngThấy.includes(id)), ...TERMS.map((x) => `"${x}"`)];
console.log(`\nĐổi ${rút(nhãnGốc, 4)} → ${phảiSửa.length} tài liệu nhắc ID bị chạm${TERMS.length ? ' hoặc cụm chữ' : ''}${sốMàn ? ` (${sốMàn} màn)` : ''} · ${chạm.size} ID bị chạm (gốc ${gốcID.size - khôngThấy.length} · lan ${Math.max(0, chạm.size - gốcID.size)})${sốChỉChữ ? ` · ${sốChỉChữ} tệp chỉ thấy qua cụm chữ, không qua mã` : ''}`);
console.log('(ứng viên phải sửa — skill điền 3 cột cuối, bỏ dòng nào thì ghi lý do ở "Không đổi")\n');
console.log('| Cấp | Tài liệu | ID bị chạm | Nhắc | Sửa gì | Độ lớn | Rủi ro |');
console.log('|---|---|---|---|---|---|---|');
const ôID = (x) => [x.ids.length ? rút(x.ids) : '', ...x.chữ.map((c) => `"${c.chữ}" dòng ${rút(c.dòng.map(String), 4)}`)].filter(Boolean).join(' · ');
for (const x of phảiSửa) console.log(`| ${x.nhóm} | ${tên(x)} | ${ôID(x)} | ${x.nhắc} | … | … | … |`);
if (soát.length) {
  const theoMàn = {};
  for (const p of soát) { const m = p.match(/(?:^|\/)(S\d+)\s*-[^/]*\/(.+)$/); (theoMàn[m[1]] = theoMàn[m[1]] || []).push(m[2]); }
  console.log(`\nSoát bằng mắt (tệp của màn bị chạm, không nhắc mã nào — bố cục/giao diện/kế hoạch có thể vẫn phải đổi): ${Object.entries(theoMàn).map(([m, a]) => `${m}: ${a.join(', ')}`).join(' · ')}`);
}
if (sinhLại.length) console.log(`Sinh lại bằng lệnh, không sửa tay: ${sinhLại.map((x) => x.tệp).join(' · ')}`);
if (trên.size) console.log(`Cấp trên — script không lần ngược, PHẢI đọc (giá trị đổi mà cha nêu cùng giá trị thì cha đổi theo): ${rút([...trên].sort(xếpID), 10)}`);
for (const [s, a] of Object.entries(KQ.ngoàiChuỗi)) console.log(`Cùng màn ${s}, ngoài chuỗi (${a.length}) — nguồn cho dòng "Không đổi": ${rút(a, 8)}`);
if (!PLAIN) {
  console.log('\nĐường lan (ID ← cha đã kéo nó vào):');
  const theoSâu = {};
  for (const c of KQ.chạm) (theoSâu[c.sâu] = theoSâu[c.sâu] || []).push(c.qua ? `${c.id}←${c.qua}` : c.id);
  for (const [s, a] of Object.entries(theoSâu)) console.log(`   bậc ${s}: ${rút(a, 12)}`);
}
console.log(`\nĐã kiểm: liên kết viết bằng mã trong dòng bảng/tiêu đề/văn xuôi của docs + e2e${TERMS.length ? ` · cụm chữ ${TERMS.map((x) => `"${x}"`).join(', ')} (nguyên cụm, mọi tệp)` : ''}`);
console.log(`Chưa kiểm: quan hệ chỉ nói bằng lời${TERMS.length ? ' ngoài các cụm đã truyền (cách viết khác của cùng giá trị không thấy)' : ' — con số/cụm chữ bị đổi thì truyền thêm --term "<chữ>"'}, code ngoài e2e, sổ CR/WI/changelog/decisions và hồ sơ lịch sử`);
console.log(`\n=== ${phảiSửa.length} tài liệu · ${soát.length} soát bằng mắt · ${sinhLại.length} sinh lại ===`);
