#!/usr/bin/env node
/*
 * ba-trace/scan.js — cơ giới hóa phần QUÉT của ba-trace (zero-dependency).
 * Thu ID từng tầng + cạnh trace (ID khác tầng đứng cùng DÒNG bảng với ID chủ) → in JSON.
 * Script CHỈ thu thập & đếm thô — KHÔNG phán xét gap: các ngoại lệ hợp lệ (màn ⬜ planned,
 * BRule làm neo, chức năng nền không màn, NFR phủ gián tiếp) do skill/LLM phân xử
 * theo SKILL.md mục "Neo trace hợp lệ ngoài chuỗi lõi".
 *
 * Dùng:  node .claude/skills/ba-trace/scripts/scan.js [docsDir=docs] [--pretty] [--full] [--for <ID>] [--plain]
 *           --full      xả thêm mảng `edges` (mọi cạnh) — mặc định ẩn vì nó lớn gấp ~10 lần phần còn lại
 *           --for <ID>  lát cắt quanh MỘT mã: tầng, cạnh chạm nó, thượng nguồn / hạ nguồn 1 bước
 *           --plain     bản tóm tắt chữ (độ phủ + ref gãy + URD) thay cho JSON — cho người/agent đọc lướt
 * Nhánh đầu nguồn URD (đợt 5 gói 4): `UN-..` (nhu cầu) và `UE-..` (ngoại lệ §6) đọc từ `00-urd.md` +
 * `urd/*.md` (qua docpath.js). Độ phủ `UE→(R-S|E-S|TC)` = màn TRÍCH NGƯỢC `UE-..` trên một dòng srs/test
 * có mã R-S/E-S/TC; `UN→FR/NFR/StR`. Mồ côi hợp lệ khi dòng URD của mã ghi `n/a — lý do` hoặc `OQ-..`.
 * URD kiểu cũ (§6 không có mã) hoặc chưa có srs nào → chỉ ghi chú 🟢, không vào độ phủ, không vào ref gãy.
 * Ra:    JSON { layers, edges, coverage, brokenRefs, screens } (stdout).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = (() => { const a = process.argv.slice(2); const i = a.indexOf('--for'); return a.filter((x, k) => !x.startsWith('--') && !(i >= 0 && k === i + 1)); })();
const PRETTY = process.argv.includes('--pretty');
const PLAIN = process.argv.includes('--plain');
// steal B20: `edges` được TÍNH nhưng chưa bao giờ được EMIT, trong khi ba-trace/SKILL.md bước 2
// ("dựng ma trận từ layers+edges") và ba-remove/SKILL.md bước 2 ("mã bị bỏ không còn ở edges")
// đều bảo agent đọc nó — agent hoặc quét tay cả docs/ hoặc bịa. Nay emit, nhưng có NGÂN SÁCH:
// mặc định chỉ đếm (1538 cạnh ở dự án mẫu ≈ 100 KB, gấp ~10 lần phần còn lại của JSON), `--full`
// xả hết, `--for <ID>` trả đúng lát cắt mà hai bước kia thật sự cần.
const FULL = process.argv.includes('--full');
const CHO_ID = (() => { const i = process.argv.indexOf('--for'); return i >= 0 ? process.argv[i + 1] : null; })();
const DOCS = path.resolve(argv[0] || 'docs');
// Hồ sơ dự án (conv-gates.md → "Hồ sơ dự án"): `mini` KHÔNG có usecase.md/userstory.md, nên
// chuỗi truy vết của nó là BR→StR→FR/NFR→F→S→R-S→TC — không có tầng UC/US. Không biết điều đó
// thì scanner báo "ref gãy" cho tầng vốn không tồn tại theo thiết kế, đúng kiểu gate kêu oan.
const { readProfile } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'profile.js'));
const HỒ_SƠ = readProfile(DOCS);
const MINI = HỒ_SƠ === 'mini';
if (!fs.existsSync(DOCS)) { console.error(`Không thấy ${DOCS}`); process.exit(2); }
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };

/* ---- Mẫu ID theo conventions.md (registry id.prefixes) ---- */
const PATTERNS = {
  PD: /\bPD-\d+\b/g, BR: /\bBR-\d+\b/g, StR: /\bStR-\d+\b/g, FR: /\bFR-\d+\b/g, NFR: /\bNFR-\d+\b/g,
  BRule: /\bBRule-[A-Za-z0-9-]+\b/g, F: /\bF\d{2,3}\b/g /* (upstream từ dự án desktop) F100..F287 */, S: /\bS\d{2}\b/g,
  // Hậu tố MỘT chữ thường (`R-S28-07b`, `TC-S55-35a`) = mã chèn giữa hai mã đã chốt (CR thêm dòng
  // mà không đánh số lại). Thiếu `[a-z]?` thì `\b` sau số không khớp ⇒ mã bị bỏ CẢ ở phía định nghĩa
  // lẫn tham chiếu ⇒ TC neo vào nó thành mồ côi (dự án e-learning 25/09/2026: 285 lượt R-S có hậu tố, G65 thổi phồng).
  ES: /\bE-S\d{2}-\d+[a-z]?\b/g, RS: /\bR-S\d{2}-N?\d+[a-z]?\b/g, UC: /\bUC-S\d{2}-\d+[a-z]?\b/g, US: /\bUS-S\d{2}-\d+[a-z]?\b/g, TC: /\bTC-S\d{2}-\d+[a-z]?\b/g,
  // Nhánh đầu nguồn URD: nhu cầu `UN-..` (§4) và ngoại lệ `UE-..` (§6). Tầng nhu cầu, đứng trước StR/FR.
  UN: /\bUN-\d+\b/g, UE: /\bUE-\d+\b/g,
};
const found = (txt, key) => [...new Set((txt.match(PATTERNS[key]) || []))];

/* ---- 1. Tập ID định nghĩa tại file "nhà" của tầng ---- */
const req = read(path.join(DOCS, '01-requirements.md'));
const flowsTxt = (() => { const p = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js')).resolveDoc(DOCS, '00-flows.md'); try { return p ? fs.readFileSync(p, 'utf8') : ''; } catch { return ''; } })();
const fns = read(path.join(DOCS, '02-functions.md'));
const ovr = read(path.join(DOCS, '03-overview.md'));
const layers = {
  BR: found(req, 'BR'), StR: found(req, 'StR'), FR: found(req, 'FR'), NFR: found(req, 'NFR'),
  BRule: [...new Set([...found(req, 'BRule'), ...found(fns, 'BRule')])],
  PD: [], F: found(fns, 'F'), S: found(ovr, 'S'), RS: [], ES: [], UC: [], US: [], TC: [], UN: [], UE: [],
};
// URD: `Ho-so/00-urd.md` (cấp dự án) + `urd/*.md` (theo feature) — qua docpath.js, không hardcode bố cục.
const DP = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));
const urdFiles = (() => {
  const out = [];
  const p0 = DP.resolveDoc(DOCS, '00-urd.md'); if (p0) out.push(p0);
  const d = DP.resolveDoc(DOCS, 'urd');
  try { if (d && fs.statSync(d).isDirectory()) for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.md')).sort()) out.push(path.join(d, f)); } catch { /* không có */ }
  return out.map((p) => ({ rel: path.relative(DOCS, p).split(path.sep).join('/'), txt: read(p) }));
})();
// Mã URD chỉ tính là ĐỊNH NGHĨA khi đứng ở ô ĐẦU của một dòng bảng (`| UN-01 |`, `| UE-03 |`) —
// nhắc trong văn (`xem UN-17`) không phải định nghĩa. Dòng định nghĩa giữ lại để phán mức + n/a/OQ.
const urdRow = {}; // mã → {tệp, dòng, text}
for (const u of urdFiles) u.txt.split('\n').forEach((l, i) => {
  const m = l.match(/^\|\s*`?(U[NE]-\d+)`?\s*\|/); if (!m) return;
  const k = m[1].startsWith('UN') ? 'UN' : 'UE';
  layers[k].push(m[1]);
  if (!urdRow[m[1]] || /n\/a\s*[—–-]|\bOQ-\d/.test(l)) urdRow[m[1]] = { tệp: u.rel, dòng: i + 1, text: l };
});

/* ---- 2. Màn hình: folder + trạng thái build từ 00-tracking ---- */
const screens = {}; // SNN → {folder, status, files:{srs:bool,...}}
// (upstream từ dự án desktop, vòng phản hồi 16/09/2026) folder màn `S01-Terminal` không có ' - '.
const isScreenDir = (n) => /^S\d+( - |-)/.test(n);
// Container "Screen-spec/" (tùy chọn): gom mọi folder màn cho gọn gốc docs/. TRONG SUỐT —
// bỏ qua khi tính "nhóm" nhưng giữ trong đường dẫn. Không có nó (dự án cũ) thì chạy y hệt.
const CONTAINER = 'Screen-spec';
const walkScreens = (dir, group, prefix) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (isScreenDir(e.name)) {
      const code = e.name.match(/^(S\d+)/)[1];
      const abs = path.join(dir, e.name);
      screens[code] = {
        folder: prefix + e.name, status: '⬜',
        files: Object.fromEntries(['srs.md', 'usecase.md', 'userstory.md', 'test.md'].map(f => [f, fs.existsSync(path.join(abs, f))])),
        _abs: abs,
      };
    } else if (e.name === CONTAINER && !group) {
      walkScreens(path.join(dir, e.name), '', prefix + e.name + '/'); // container trong suốt
    } else if (!group) {
      walkScreens(path.join(dir, e.name), e.name, prefix + e.name + '/'); // folder nhóm nghiệp vụ
    }
  }
};
walkScreens(DOCS, '', '');
const trk = read(path.join(DOCS, '00-tracking.md'));
for (const line of trk.split('\n')) {
  // (upstream từ dự án desktop 16/09) chỉ nhận DÒNG MÀN (có `docs/` trong backtick) — bảng §Miễn trừ cũng bắt đầu
  // bằng `|` và nhắc tên màn, không lọc là nó ghi đè trạng thái/F của màn đó.
  if (!/`docs\//.test(line)) continue;
  const mS = line.match(/S\d{2}/); if (!mS || !screens[mS[0]] || !/^\|/.test(line)) continue;
  // (upstream từ dự án desktop 16/09) dự án desktop không ghi chữ "Hoàn thành" — trạng thái suy từ ô lõi srs/usecase/userstory/test (cột 8/9/10/13).
  const ô = line.split('|'); const lõi = [8, 9, 10, 13].map(i => (ô[i] || '').trim());
  screens[mS[0]].status = /Hoàn thành/.test(line) || lõi.every(x => x.includes('✅')) ? '✅'
    : (/Cần cập nhật/.test(line) || lõi.some(x => x.includes('⚠️')) ? '⚠️' : (/Đang làm/.test(line) ? '🔨' : '⬜'));
  screens[mS[0]].functions = found(line, 'F'); // cột "Mã CN" → map F↔S
}

/* ---- 3. Cạnh trace: quét theo DÒNG — ID chủ của tầng + ID tầng khác cùng dòng ---- */
const edges = []; // {from, to, file, line}
const tríchUE = []; // {ue, neo:[R-S/E-S/TC cùng dòng], tại}
let cóSrs = false;
const addRowEdges = (line, ownKey, file, ln) => {
  const own = found(line, ownKey); if (!own.length) return;
  for (const key of Object.keys(PATTERNS)) {
    if (key === ownKey) continue;
    for (const id of found(line, key)) {
      // R-S chứa "S02" và UC/US/TC chứa "S02": bỏ cạnh S giả từ chính token con
      if (key === 'S' && new RegExp(`(R-|UC-|US-|TC-)${id}`).test(line) && !new RegExp(`(^|[^-\\w])${id}\\b(?![-\\d])`).test(line.replace(new RegExp(`(R-|UC-|US-|TC-)${id}`, 'g'), ''))) continue;
      edges.push({ from: own[0], to: id, file, line: ln });
    }
  }
};
// 01-requirements: mỗi dòng yêu cầu + mã nó dẫn về (vd cột "Nguồn (PD)" của luồng prototype-trước).
// Trước 21/08/2026 file này KHÔNG được quét cạnh, nên quan hệ khai ngay trên dòng yêu cầu là vô hình
// với RTM — lộ ra khi đo FR/BR→PD: dòng BR ghi rõ nguồn PD-02 vẫn bị chấm mồ côi.
for (const k of ["BR", "StR", "FR", "NFR"]) req.split("\n").forEach((l, i) => addRowEdges(l, k, "01-requirements.md", i + 1));
// URD: dòng UN/UE + mã nó dẫn tới (UN→FR ở bảng "Truy vết xuống bước sau", UE→UN ở §6).
for (const u of urdFiles) u.txt.split('\n').forEach((l, i) => { addRowEdges(l, 'UE', u.rel, i + 1); addRowEdges(l, 'UN', u.rel, i + 1); });
// 02-functions: mỗi dòng F.. + FR/BR
fns.split('\n').forEach((l, i) => addRowEdges(l, 'F', '02-functions.md', i + 1));
// tracking: F↔S đã thu ở screens[].functions → cạnh F→S
for (const [s, sc] of Object.entries(screens)) for (const f of sc.functions || []) edges.push({ from: f, to: s, file: '00-tracking.md', line: 0 });
// Per-screen: srs (R-S chủ), usecase (UC chủ), userstory (US chủ), test (TC chủ)
for (const [s, sc] of Object.entries(screens)) {
  const per = [['srs.md', 'RS'], ['usecase.md', 'UC'], ['userstory.md', 'US'], ['test.md', 'TC']];
  for (const [file, key] of per) {
    const txt = read(path.join(sc._abs, file)); if (!txt) continue;
    layers[key].push(...found(txt, key));
    if (file === 'srs.md') { layers.BRule.push(...found(txt, 'BRule')); layers.ES.push(...found(txt, 'ES')); } // BRule cấp màn định nghĩa tại srs.md
    const rel = sc.folder + '/' + file;
    txt.split('\n').forEach((l, i) => {
      addRowEdges(l, key, rel, i + 1);
      // Màn TRÍCH NGƯỢC `UE-..` (cột Trace của E-S, Nguồn của R-S/TC Negative, bảng quét yêu cầu ngầm):
      // ghi mã màn cùng dòng — đó là "nơi xử lý" của ngoại lệ phía người dùng.
      for (const ue of found(l, 'UE')) {
        const neo = [...found(l, 'RS'), ...found(l, 'ES'), ...found(l, 'TC')];
        tríchUE.push({ ue, neo, tại: `${rel}:${i + 1}` });
        if (!neo.length) continue;
        if (!found(l, key).length) edges.push({ from: neo[0], to: ue, file: rel, line: i + 1 }); // dòng không có mã chủ tầng (vd E-S chỉ neo UE)
      }
    });
    if (file === 'srs.md') cóSrs = true;
  }
  delete sc._abs;
}
// Sổ quyết định sản phẩm (luồng prototype-trước): PD là tầng ĐẦU NGUỒN, đứng TRƯỚC cả BR —
// nó là điều khách chốt khi bấm prototype, trước khi có bất kỳ yêu cầu nào.
{
  const dec = (() => { try { return fs.readFileSync(path.join(DOCS, '00-decisions.md'), 'utf8'); } catch { return ''; } })();
  if (dec) {
    layers.PD.push(...found(dec, 'PD'));
    dec.split('\n').forEach((l, i) => addRowEdges(l, 'PD', '00-decisions.md', i + 1));
  }
}
for (const k of ['RS', 'ES', 'UC', 'US', 'TC', 'BRule', 'PD', 'UN', 'UE']) layers[k] = [...new Set(layers[k])];

/* ---- 4. Ref gãy: cạnh trỏ tới ID không tồn tại ở tầng của nó ---- */
const layerOf = (id) => /^UN-/.test(id) ? 'UN' : /^UE-/.test(id) ? 'UE' : /^PD/.test(id) ? 'PD' : /^BRule/.test(id) ? 'BRule' : /^BR/.test(id) ? 'BR' : /^StR/.test(id) ? 'StR' : /^FR/.test(id) ? 'FR' : /^NFR/.test(id) ? 'NFR' : /^E-S/.test(id) ? 'ES' : /^R-S/.test(id) ? 'RS' : /^UC/.test(id) ? 'UC' : /^US/.test(id) ? 'US' : /^TC/.test(id) ? 'TC' : /^F\d/.test(id) ? 'F' : 'S';
const all = new Set(Object.values(layers).flat());
// Mã màn TẠM của luồng prototype-trước: ở bước 5 (cổng chốt) sổ 00-decisions.md trỏ tới mã `S..`
// khai trong 00-flows.md, mà baseline 03-overview.md thì CHƯA tồn tại. Chấm "trace gãy" cho mã tạm là
// kêu oan — nó chưa gãy, nó chưa tới lượt. Khi 03-overview.md ra đời thì mã vào layers.S và tự hết.
const mãTạm = new Set(flowsTxt.split('\n').filter(l => /^\|\s*S\d{2}\s*\|/.test(l)).map(l => l.split('|')[1].trim()));
// Mã có hậu tố mà gốc tồn tại (`E-S13-04b` khi srs chỉ có `E-S13-04` với các nhánh (a)(b)(c)) = trỏ vào
// NHÁNH CON của mã gốc, không phải ref gãy (dự án desktop S13 test.md:67).
const cóGốc = (id) => /^(E-S|R-S|UC-S|US-S|TC-S)\d{2}-N?\d+[a-z]$/.test(id) && all.has(id.slice(0, -1));
const refsGãy = edges.filter(e => !all.has(e.to) && !cóGốc(e.to)).map(e => ({ ref: e.to, tầng: layerOf(e.to), tại: `${e.file}:${e.line}`, từ: e.from }));
// Ở `mini`, ref tới UC/US KHÔNG phải lỗi truy vết — tầng đó không tồn tại ở hồ sơ này. Vẫn TRẢ RA
// (trường riêng) chứ không nuốt: mã UC- còn sót trong srs/test là dấu vết dự án mới chuyển từ full
// sang mini, đáng dọn — nhưng nó là việc dọn dẹp, không phải chuỗi gãy chặn gate.
const bỏTheoHồSơ = MINI ? refsGãy.filter(r => r.tầng === 'UC' || r.tầng === 'US') : [];
const mãSơBộ = refsGãy.filter(r => mãTạm.has(r.ref) && !bỏTheoHồSơ.includes(r));
// URD vắng hoặc kiểu cũ (tầng rỗng): ref tới UN/UE không kiểm được — tách riêng, KHÔNG đỏ (dự án cũ không
// đỏ loạt chỉ vì chưa cấp mã). URD có mã mà màn trích mã không tồn tại → "UE ma" → vào brokenRefs thật.
const urdKhôngKiểm = refsGãy.filter(r => (r.tầng === 'UN' || r.tầng === 'UE') && !layers[r.tầng].length);
const brokenRefs = (MINI ? refsGãy.filter(r => r.tầng !== 'UC' && r.tầng !== 'US') : refsGãy).filter(r => !mãTạm.has(r.ref) && !urdKhôngKiểm.includes(r));

/* ---- 5. Độ phủ thô (mẫu số ĐỦ — skill sẽ trừ ngoại lệ hợp lệ khi phán xét) ---- */
const hasEdge = (a, b) => edges.some(e => (e.from === a && e.to === b) || (e.from === b && e.to === a));
const downstream = (id) => edges.filter(e => e.from === id || e.to === id).map(e => e.from === id ? e.to : e.from);
const cov = (fromIds, toLayer) => {
  const orphans = fromIds.filter(id => !downstream(id).some(d => layerOf(d) === toLayer));
  return { đạt: fromIds.length - orphans.length, tổng: fromIds.length, mồCôi: orphans };
};
const builtScreens = Object.entries(screens).filter(([, s]) => s.status !== '⬜').map(([c]) => c);
const coverage = {
  'FR→F': cov(layers.FR, 'F'),
  'F→S': cov(layers.F, 'S'),
  'S(✅)→R-S': { đạt: builtScreens.filter(s => layers.RS.some(r => r.includes(s))).length, tổng: builtScreens.length, mồCôi: builtScreens.filter(s => !layers.RS.some(r => r.includes(s))) },
  'R-S(CN,màn ✅)→TC': (() => {
    const rsCN = layers.RS.filter(r => !/-N\d+[a-z]?$/.test(r) && builtScreens.some(s => r.includes(s)));
    const miss = rsCN.filter(r => !downstream(r).some(d => layerOf(d) === 'TC') && !edges.some(e => layerOf(e.from) === 'TC' && downstream(e.from).includes(r)));
    return { đạt: rsCN.length - miss.length, tổng: rsCN.length, mồCôi: miss };
  })(),
  'NFR→nơi hiện thực': cov(layers.NFR, 'RS'),
  // `E-S..` (ma trận lỗi trong srs.md) LÀ neo hợp lệ: ba-review bắt buộc mỗi E-S có ≥1 TC Negative,
  // nên TC Negative thường chỉ neo vào E-S. Thiếu 'ES' ở đây thì chính cái ba-review đòi lại bị
  // ba-trace báo mồ côi — và ở hồ sơ `mini` gần như chắc chắn lộ, vì không còn tầng UC để TC bám kèm.
  // Chỉ tính khi dự án CÓ sổ PD (luồng prototype-trước). Dự án chạy chuỗi xuôi không có PD —
  // đo tầng không tồn tại rồi báo 0% là gate kêu oan.
  ...(layers.PD.length ? { 'FR/BR neo về PD (luồng prototype-trước)': (() => {
    const gốc = [...layers.FR, ...layers.BR];
    const mồCôi = gốc.filter(x => !downstream(x).some(d => layerOf(d) === 'PD'));
    return { đạt: gốc.length - mồCôi.length, tổng: gốc.length, mồCôi };
  })() } : {}),
  'TC neo ngược (R-S/UC/E-S/BRule)': (() => {
    const loose = layers.TC.filter(t => !downstream(t).some(d => ['RS', 'UC', 'ES', 'BRule'].includes(layerOf(d))));
    return { đạt: layers.TC.length - loose.length, tổng: layers.TC.length, mồCôi: loose };
  })(),
};

/* ---- 5b. URD: UE→(R-S|E-S|TC) và UN→FR ---- */
const hợpLệ = (id) => { const r = urdRow[id]; if (!r) return null; const m = r.text.match(/n\/a\s*[—–-]\s*[^|]+|\bOQ-[A-Z0-9-]*\d+/); return m ? m[0].trim() : null; };
const mức = (id) => { const r = urdRow[id]; const m = r && r.text.match(/\b(Critical|High|Medium|Low)\b/); return m ? m[1] : null; };
const urd = { tệp: urdFiles.map((u) => u.rel) };
if (!urdFiles.length) urd.trạngThái = '🟢 chưa có URD — bỏ qua nhánh UN/UE';
else {
  if (!layers.UE.length) urd.trạngThái = '🟢 URD kiểu cũ — §6 chưa có cột mã `UE-..`, bỏ qua độ phủ UE (không đỏ)';
  else if (!cóSrs) urd.trạngThái = '🟢 chưa có srs nào — độ phủ UE chưa tới lượt';
  if (layers.UE.length && cóSrs) {
    const nơi = (id) => [...new Set(tríchUE.filter((t) => t.ue === id && t.neo.length).map((t) => t.tại))];
    const mồCôiThô = layers.UE.filter((id) => !nơi(id).length);
    const mồCôi = mồCôiThô.filter((id) => !hợpLệ(id));
    coverage['UE→(R-S|E-S|TC)'] = { đạt: layers.UE.length - mồCôiThô.length, tổng: layers.UE.length, mồCôi,
      hợpLệ: mồCôiThô.filter(hợpLệ).map((id) => ({ id, lýDo: hợpLệ(id) })),
      mức: Object.fromEntries(mồCôi.map((id) => [id, mức(id) || '?'])) };
    urd.mồCôiNặng = mồCôi.filter((id) => /Critical|High/.test(mức(id) || '')); // ba-review luật urd → 🟡
    urd.nơiXửLý = Object.fromEntries(layers.UE.map((id) => [id, nơi(id)]));
  }
  if (layers.UN.length && layers.FR.length) {
    // conventions: `ba-requirements` chuyển mỗi UN thành ≥1 StR/FR/NFR — nên đích là cả ba, không riêng FR.
    const c = (() => { const mc = layers.UN.filter((id) => !downstream(id).some((x) => ['FR', 'NFR', 'StR'].includes(layerOf(x)))); return { đạt: layers.UN.length - mc.length, tổng: layers.UN.length, mồCôi: mc }; })();
    const thật = c.mồCôi.filter((id) => !hợpLệ(id));
    coverage['UN→FR/NFR/StR'] = { đạt: c.đạt, tổng: c.tổng, mồCôi: thật, hợpLệ: c.mồCôi.filter(hợpLệ).map((id) => ({ id, lýDo: hợpLệ(id) })) };
  }
}
if (urdKhôngKiểm.length) urd.refKhôngKiểm = urdKhôngKiểm;

const out = { quétLúc: null, docs: path.relative(process.cwd(), DOCS),
  hồSơ: HỒ_SƠ,
  chuỗi: MINI ? 'BR→StR→FR/NFR→F→S→R-S→TC (hồ sơ mini: không có tầng UC/US)'
              : 'BR→StR→FR/NFR→F→S→R-S→UC/US→TC',
  bỏTheoHồSơ,
  mãSơBộ,   // ref tới mã S.. TẠM của 00-flows.md — chưa gãy, chỉ chưa tới lượt ba-screens cấp baseline
  layers: Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, v.sort()])), tổngCạnh: edges.length, coverage, brokenRefs, urd, screens };

if (FULL) out.edges = edges;
else out.ghiChú = `ẩn ${edges.length} cạnh cho gọn — \`--full\` xả hết, \`--for <ID>\` lấy lát cắt quanh một mã`;
if (CHO_ID) {
  const chạm = edges.filter((e) => e.from === CHO_ID || e.to === CHO_ID);
  const có = all.has(CHO_ID);
  out.lát = {
    id: CHO_ID, tầng: layerOf(CHO_ID), cóTrongTàiLiệu: có,
    // `from → to` là "khai trace tới": dòng mang mã `from` trỏ tới `to`. Nên hạ nguồn của một mã
    // là những mã KHAI nó (TC khai R-S), còn thượng nguồn là những mã nó khai.
    thượngNguồn: [...new Set(chạm.filter((e) => e.from === CHO_ID).map((e) => e.to))].sort(),
    hạNguồn: [...new Set(chạm.filter((e) => e.to === CHO_ID).map((e) => e.from))].sort(),
    cạnh: chạm,
  };
  if (!có) out.lát.cảnhBáo = 'mã này không có trong tài liệu — kiểm lại chính tả trước khi kết luận "đã bỏ sạch"';
}
if (PLAIN) {
  const d = [`ba-trace scan — ${out.docs} (hồ sơ ${HỒ_SƠ}) · ${edges.length} cạnh`];
  for (const [k, v] of Object.entries(coverage)) d.push(`  ${k}: ${v.đạt}/${v.tổng}${v.mồCôi.length ? ` · mồ côi ${v.mồCôi.slice(0, 8).join(', ')}${v.mồCôi.length > 8 ? '…' : ''}` : ''}${v.hợpLệ && v.hợpLệ.length ? ` · hợp lệ ${v.hợpLệ.length} (n/a/OQ)` : ''}`);
  d.push(`  ref gãy: ${brokenRefs.length}${brokenRefs.length ? ' — ' + brokenRefs.slice(0, 6).map((r) => `${r.ref}@${r.tại}`).join(', ') : ''}`);
  d.push(`  URD: ${urd.trạngThái || `${layers.UN.length} UN · ${layers.UE.length} UE`}${urd.mồCôiNặng && urd.mồCôiNặng.length ? ` · 🟡 UE Critical/High mồ côi: ${urd.mồCôiNặng.join(', ')}` : ''}`);
  if (out.lát) d.push(`  --for ${out.lát.id}: thượng ${out.lát.thượngNguồn.join(', ') || '—'} · hạ ${out.lát.hạNguồn.join(', ') || '—'}${out.lát.cảnhBáo ? ' · ⚠️ ' + out.lát.cảnhBáo : ''}`);
  console.log(d.join('\n'));
} else console.log(JSON.stringify(out, null, PRETTY ? 2 : 0));
