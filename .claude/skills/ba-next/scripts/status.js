#!/usr/bin/env node
/*
 * ba-next/status.js — "một cửa" của BA toolkit (zero-dependency).
 * Quét docs/ của dự án → tính vị trí pipeline (GĐ1 discover → GĐ2 init → GĐ3 dev → GĐ4 accept)
 * → in bảng trạng thái + ĐỀ XUẤT bước kế tiếp (skill nào, vì sao).
 * Script chỉ ĐỌC, không sửa gì. Skill ba-next diễn giải + hỏi người dùng rồi chạy bước đó.
 *
 * Dùng:  node .claude/skills/ba-next/scripts/status.js [docsDir=docs] [--json]
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2).filter(a => !a.startsWith('--'));
const JSON_MODE = process.argv.includes('--json');
const DOCS = path.resolve(argv[0] || 'docs');
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
// Tài liệu bổ trợ nằm ở `docs/Ho-so/` (bố cục từ 13/08/2026) HOẶC ở gốc `docs/` (dự án cài
// trước đó, hoặc người dùng chưa di chuyển). Tra phẳng bằng existsSync là báo "chưa có
// vision/roadmap/uat" cho cả loạt dự án đã có đủ — nên mọi lượt tra đi qua docpath.js.
const { hasDoc, readDoc, layout } = require('../../ba-toolkit/scripts/docpath.js');
// Hồ sơ dự án (conventions → "Hồ sơ dự án"): lite tắt sổ WI / changelog / đối chiếu code /
// review agent. Đề xuất phải im theo, không thì "một cửa" cứ nhắc thứ dự án đã chủ động bỏ.
const { readProfile, readScope, off, screenFiles } = require('../../ba-toolkit/scripts/profile.js');
const hồSơ = readProfile(DOCS);
const tắt = off(DOCS);
// Phạm vi `docs` (conv-gates.md → "Hồ sơ dự án" → "Phạm vi"): dự án CHỈ làm tài liệu. Không có
// GĐ3 dev / GĐ4 nghiệm thu — đề xuất ba-build/dev-run/ba-accept/ba-conformance ở dự án này là
// đẩy người dùng vào bước không ai làm. GĐ3 của họ là BÀN GIAO TÀI LIỆU.
const phạmVi = readScope(DOCS);
const chỉDocs = tắt.dev;
// Tên CỘT tracking của bộ file theo hồ sơ (`mini` 5 · còn lại 9). Ba cột có tên khác tên file.
const CỘT_DOC = screenFiles(DOCS).map(f => ({ 'ascii-screen': 'ascii', 'html-design': 'html' })[f] || f);
const has = (name) => hasDoc(DOCS, name);
// Skill THỬ NGHIỆM (canon `skills.experimental`, gói D 25/09/2026): `install.js` mặc định không cài. Gợi một
// skill không có ở `.claude/skills/` là lối đi cụt — nên chỉ gợi khi ĐÃ CÀI, và gắn nhãn "(thử nghiệm)".
// Đọc khối ```registry như install.js; không có registry/khoá → tập rỗng (không nhãn, hành vi cũ).
const SKILLS_DIR = path.join(__dirname, '..', '..');
const càiRồi = (n) => fs.existsSync(path.join(SKILLS_DIR, n, 'SKILL.md'));
const THỬ_NGHIỆM = new Set((() => {
  const m = read(path.join(SKILLS_DIR, 'ba-toolkit', 'references', 'conv-registry.md')).match(/```registry\n([\s\S]*?)```/);
  const l = m && m[1].split('\n').find((x) => /^skills\.experimental = /.test(x.trim()));
  return l ? l.trim().split(' = ')[1].split(/\s+/).filter(Boolean) : [];
})());
const nhãnThử = (n) => (THỬ_NGHIỆM.has(n) ? ' (thử nghiệm)' : '');
const readD = (name) => readDoc(DOCS, name);

if (!fs.existsSync(DOCS)) {
  const out = { giaiĐoạn: 'GĐ0', đềXuất: [
    { skill: 'ba-start', lýDo: 'Lần đầu dùng? Nhận diện dự án (ý tưởng / tài liệu rời / code), xem demo 10 phút rồi vào dự án thật' },
    { skill: 'ba-discover', lýDo: 'Chưa có docs/ — bắt đầu từ đầu: vision → stakeholder → persona → brainstorm → process' },
    { skill: 'ba-reverse-doc', lýDo: 'Nếu đã có tài liệu yêu cầu rời của khách (Word/PDF/ảnh/biên bản) — kiểm kê nguồn rồi seed 01-requirements' },
    { skill: 'ba-reverse', lýDo: 'Nếu đã có codebase — sinh tài liệu ngược từ code rồi dừng' },
    { skill: 'ba-auto', lýDo: 'Nếu đã có codebase VÀ muốn đi thẳng tới MVP — chạy cả chuỗi (reverse → đặc tả → build → dev), chỉ dừng hỏi 2 lần' },
  ] };
  console.log(JSON_MODE ? JSON.stringify(out) : `Chưa có ${DOCS} — dự án mới.\n👉 Lần đầu dùng: /ba-start (nhận diện dự án + demo 10 phút)\n👉 Hoặc chạy: /ba-discover (GĐ1, từ ý tưởng) · /ba-reverse-doc (đã có tài liệu rời) · /ba-reverse (đã có code, dừng ở tài liệu) · /ba-auto (đã có code, chạy thẳng tới MVP) · /ba-init nếu muốn vào thẳng yêu cầu.`);
  process.exit(0);
}

/* ---- 1. Hiện trạng tài liệu hệ thống ---- */
const SYS = [
  ['00-vision.md', 'ba-vision', 'tùy chọn'], ['00-process.md', 'ba-process', 'tùy chọn'],
  ['00-intake.md', 'ba-reverse-doc', 'tùy chọn'], ['00-personas.md', 'ba-persona', 'tùy chọn'],
  ['00-urd.md', 'ba-urd', 'tùy chọn'],
  ['00-brainstorm.md', 'ba-brainstorm', 'lõi'], ['01-requirements.md', 'ba-requirements', 'lõi'],
  ['02-functions.md', 'ba-functions', 'lõi'], ['03-overview.md', 'ba-screens', 'lõi'],
  ['04-stakeholders.md', 'ba-stakeholder', 'tùy chọn'], ['05-data-model.md', 'ba-data-model', 'tùy chọn'],
  ['06-api-spec.md', 'ba-api-spec', 'tùy chọn'], ['07-design-system.md', 'ba-design-system', 'tùy chọn'],
  ['08-roadmap.md', 'ba-roadmap', 'tùy chọn'], ['09-uat.md', 'ba-uat', 'GĐ4'],
  ['10-architecture.md', 'ba-architecture', 'trước build'], ['11-integration.md', 'ba-integration', 'khi nhiều hệ'],
  ['12-api-integration.md', 'ba-api-integration', 'khi dùng API đối tác'],
  ['00-threat-model.md', 'ba-threat-model', 'sau cổng chốt kiến trúc'], ['00-migration.md', 'ba-migration', 'khi tách/đổi hệ cũ'],
];
// Dòng của skill thử nghiệm chưa cài chỉ hiện khi tài liệu đã có (người làm tay / cài trước) — không đếm là "thiếu".
const sys = SYS.map(([f, skill, note]) => ({ file: f, skill, note, có: has(f) }))
  .filter((s) => !THỬ_NGHIỆM.has(s.skill) || s.có || càiRồi(s.skill));

/* ---- 2. Màn hình từ 00-tracking.md ---- */
// Đọc cột theo TÊN header (không index cứng) → khỏi vỡ khi ma trận thêm cột (vd `e2e`) hay còn định dạng 9 cột cũ.
const trkLines = read(path.join(DOCS, '00-tracking.md')).split('\n');
const screens = [];
const headIdx = trkLines.findIndex(l => /^\|.*Mã CN/.test(l));
if (headIdx >= 0) {
  const heads = trkLines[headIdx].split('|').map(s => s.trim()).filter(Boolean);
  const col = (name) => heads.indexOf(name);
  for (let i = headIdx + 2; i < trkLines.length && /^\|/.test(trkLines[i]); i++) {
    const line = trkLines[i];
    if (!/S\d{2}/.test(line)) continue;
    // `\|` = gạch literal trong ô (ghi chú có chứa `\|`), không phải ranh giới cột.
    const c = line.split(/(?<!\\)\|/).map(s => s.trim()); c.shift(); c.pop();
    const code = (line.match(/S\d{2}/) || [])[0];
    const ô = (name) => (col(name) >= 0 ? c[col(name)] : '') || '';
    // ── Trạng thái suy từ CÁC CỘT TÀI LIỆU, không từ chữ trong cột "Trạng thái" ────────────────
    // Hợp nhất từ dự án desktop ngày 11/09/2026 — bản vá viết tại đích trên dữ liệu thật, kéo về gốc qua vòng phản hồi `ba-export report`. Nguồn khớp chữ "Hoàn thành" trên cả
    // dòng; nhiều dự án (kể cả dự án này) dùng cột "Trạng thái" làm SỔ GHI CHÚ — lịch sử CR, lý
    // do, ngày — nên chữ đó không có ở đâu. Đo được: **32/32 màn thành ⬜** dù tài liệu đã đủ, và
    // giai đoạn bị tụt từ GĐ3 về GĐ2 ⇒ mọi đề xuất sau đó sai theo.
    // Dùng `CỘT_DOC` (đã theo hồ sơ dự án) chứ không hardcode danh sách cột.
    // Và chỉ tính CỘT LÕI, không tính đủ 9 cột: `brainstorm`/`design-spec`/`html`/`plan` vắng mặt
    // là chuyện bình thường ở dự án dựng tài liệu ngược từ code (miễn trừ G03/G04 trong
    // `00-gaps.md`) — đòi đủ 9 thì màn nào cũng 🔨 và "đã đặc tả xong" không bao giờ đúng.
    const CỘT_LÕI = ['ascii', 'srs', 'usecase', 'userstory', 'test'].filter(n => CỘT_DOC.includes(n));
    const lõi = CỘT_LÕI.map(ô).filter(v => v !== '');
    const đủDoc = lõi.length > 0 && lõi.every(v => v === '✅');
    const cờLệch = CỘT_LÕI.map(ô).some(v => v === '⚠️');
    const cóGì = lõi.some(v => v === '✅' || v === '⚠️');
    screens.push({
      code, tên: ô('Màn hình') || code,
      trạngThái: cờLệch ? '⚠️' : đủDoc ? '✅' : cóGì ? '🔨' : '⬜',
      dev: ô('dev') || '⬜', e2e: ô('e2e') || '⬜', figma: ô('figma') || '⬜',
      // e2e sinh TỪ test.md → màn chưa có test.md thì chưa nói chuyện e2e được
      cóTest: ô('test') === '✅', đủTàiLiệu: đủDoc && !cờLệch,
      // Đủ mọi doc TRỪ `plan` ⬜ → thiếu ba-build, KHÔNG phải "đang dở cần đồng bộ" (xem GĐ2 bên dưới).
      // Danh sách cột lấy theo HỒ SƠ, không hardcode 8: `mini` không có brainstorm/usecase/
      // userstory/design-spec, hardcode thì điều kiện không bao giờ đúng và ba-build không được gợi ý.
      // Phạm vi docs: `plan` không thuộc bộ file (screenFiles đã bỏ) → điều kiện này luôn false, ba-build im.
      cóĐủTrừPlan: !chỉDocs && CỘT_DOC.filter(n => n !== 'plan')
        .every(n => col(n) >= 0 && c[col(n)] === '✅') && (col('plan') >= 0 && c[col('plan')] !== '✅'),
    });
  }
}

/* ---- 3. Tín hiệu chất lượng ---- */
const gaps = readD('00-gaps.md');
// Chỉ đếm dòng BẢNG gap (| Gxx | 🔴 |…) — emoji trong văn xuôi/chú giải không phải gap.
// Mức đọc ở ĐÚNG Ô cột Mức (định vị theo header của chính bảng đó), không phải "dòng chứa 🔴":
// dự án e-learning 25/09/2026 — `G21` mức 🟢 mà mô tả kể lại lịch sử "hạ từ 🔴" / "🔴 Chỗ tôi sai" ⇒ bị báo gap
// CHẶN. Bảng không có cột tên Mức/Mức độ/Severity → ô thứ 2 (khuôn `| ID | Mức | …` của ba-review) nếu nó mở đầu bằng emoji mức.
const gapRowsAll = []; // {l, mức}
{
  let cộtMức = -1, trongBảng = false, dòngTrước = '';
  const ôCủa = (l) => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((x) => x.trim());
  for (const l of gaps.split('\n')) {
    if (!/^\s*\|/.test(l)) { trongBảng = false; dòngTrước = l; continue; }
    if (/^\s*\|[\s:|-]+\|?\s*$/.test(l) && /-/.test(l)) { // dòng kẻ `|---|` → dòng trước là header
      if (!trongBảng) { trongBảng = true; const h = ôCủa(dòngTrước).map((x) => x.replace(/[*_`]/g, '').trim());
        cộtMức = h.findIndex((x) => /^(Mức( độ)?( nghiêm trọng)?|Severity|Sev|Nghiêm trọng)$/i.test(x)); }
      dòngTrước = l; continue;
    }
    dòngTrước = l;
    if (!/^\|\s*G\d+\s*\|/.test(l)) continue;
    const ô = ôCủa(l);
    // Không có cột Mức (vd bảng "Nợ có hạn" `| ID | Mô tả | Mốc |` chép lại G06/G07): ô 2 chỉ là mức khi nó
    // MỞ ĐẦU bằng emoji mức — mô tả có chữ "🔴 chặn" ở giữa không được đếm, cũng không đếm trùng bảng nợ.
    const ô2 = (ô[1] || '').replace(/^[*_\s]+/, '');
    gapRowsAll.push({ l, mức: cộtMức >= 0 ? (ô[cộtMức] || '') : /^(🔴|🟡|🟠|🟢)/.test(ô2) ? ô2 : '' });
  }
}
// …và chỉ đếm gap CÒN MỞ. Dòng gap không bị xoá khi xử lý xong (báo cáo là lịch sử soát), nên
// đếm cả bảng làm dự án đã sạch vẫn bị báo "🔴 CHẶN" mãi mãi — ba-next khi đó khuyên chạy lại
// ba-review vô hạn. Nhận diện dòng đã đóng ở Ô CUỐI (cột trạng thái / "Sửa bằng"), và chỉ khi ô
// đó MỞ ĐẦU bằng dấu đóng — mô tả gap có thể chứa chữ "đóng" ("không đóng được modal") mà không
// phải là trạng thái.
const đãĐóng = (l) => {
  const ô = l.replace(/\|\s*$/, '').split('|');
  const cuối = (ô[ô.length - 1] || '').trim();
  return /^(\*\*)?(✅|Đóng|Đã đóng|Đã xử lý|Hoàn thành)/i.test(cuối);
};
const gapRows = gapRowsAll.filter((g) => !đãĐóng(g.l));
const gapĐãĐóng = gapRowsAll.length - gapRows.length;
const gapCount = { '🔴': gapRows.filter(g => g.mức.includes('🔴')).length, '🟡': gapRows.filter(g => g.mức.includes('🟡')).length,
  // 🟠 = nợ CÓ HẠN (conventions → "Quy ước gate"): không chặn gate hiện tại, nhưng chặn ở mốc ghi
  // trên chính dòng gap (ba-build / dev-run / ba-accept). Đếm riêng để không lẫn với 🟡 đang chặn.
  '🟠': gapRows.filter(g => g.mức.includes('🟠')).length };
// Header scope/ngày (ba-review ghi từ 14/08/2026). Con số gap CHỈ nói về những scope đã phủ —
// đọc "0 gap" của một lần chạy scope hẹp như thể cả dự án sạch là kết luận sai.
// File cũ không có header → không biết phủ tới đâu, phải nói rõ thay vì im lặng cho qua.
const gapScope = (gaps.match(/Scope lần chạy gần nhất:\s*`?([^`·\n]+)`?/) || [, ''])[1].trim();
const gapNgày = (gaps.match(/Ngày:\s*`?(\d{4}-\d{2}-\d{2})`?/) || [, ''])[1];
const gapĐãPhủ = (gaps.match(/Đã phủ:\s*`?([^`\n]+)`?/) || [, ''])[1].trim();
const gapToànCục = /^all$/i.test(gapĐãPhủ) || /^all$/i.test(gapScope);
const gapCảnhBáo = !gaps ? '' :
  !gapScope ? '00-gaps.md không có header scope (bản trước 14/08/2026) — không rõ đã phủ tới đâu'
  : !gapToànCục ? `00-gaps.md mới phủ: ${gapĐãPhủ || gapScope} — chưa phải bức tranh toàn dự án`
  : '';
const arch = readD('10-architecture.md');
const integ = readD('11-integration.md');
const apiInteg = readD('12-api-integration.md');
// ADR chưa qua cổng chốt — soát CẢ BA tài liệu có cổng chốt (10 kiến trúc · 11 tích hợp · 12 API đối tác),
// không chỉ 10: `dev-run` cũng không được code phần tích hợp khi ADR của 11/12 còn Draft.
const cònDraft = (t) => !!t && (/Trạng thái:\*{0,2}\s*\**Draft/i.test(t) || /⚠️ chưa chốt/.test(t) || /CHƯA CHỐT/.test(t));
const adrDraft = cònDraft(arch);
const adrDraftKhác = [['11-integration.md', integ], ['12-api-integration.md', apiInteg]]
  .filter(([, t]) => cònDraft(t)).map(([f]) => f);
const cr = readD('00-cr.md');
// ── Đếm CR: hợp nhất từ dự án desktop 11/09/2026 qua vòng phản hồi `ba-export report` ──────────
//
// Hai thứ bản nguồn chưa có, và cả hai đều đo được trên sổ thật của dự án này (382 dòng CR):
//
// ① **Mã CR có hai dạng.** `CR-01` (đếm chung) và `CR-S01-14` (đếm riêng theo màn). Regex
//    `/^\|\s*CR-\d+/` chỉ bắt dạng đầu — đo trên sổ của dự án desktop: **366 dòng dạng `CR-S##-##`** so với
//    16 dòng dạng `CR-##`, tức bỏ sót 96%. Dự án nào dùng mã theo màn thì con số luôn gần 0.
//
// ② **BA rổ, không phải hai.** Gộp "Đã triển khai" vào "đang mở" đúng về nghĩa (TC tay còn chờ
//    kiểm) nhưng vô dụng về tín hiệu: sổ chạy lâu thì gần như MỌI dòng đứng ở đó, nên "đang mở"
//    không bao giờ đổi và đề xuất `ba-change-request list` kêu ở mọi lần chạy. Tách ba rổ thì cả
//    hai nghĩa còn nguyên: việc đang làm dở hiện rõ, việc chờ kiểm tay vẫn được đếm chứ không bị
//    coi như xong.
//
// Và phải đọc ĐÚNG cột "Trạng thái": cột "Phạm vi"/"Commit" thường kể lại lịch sử ("…→ Đóng
// 2026-07-18"), khớp chữ trên cả dòng là đếm nhầm CR đang mở thành đã đóng.
const crLines = cr.split('\n');
// `\|` = gạch literal trong ô, không phải ranh giới cột; `|` NẰM TRONG code span (`a|b`) cũng không —
// upstream từ vá cục bộ dự án desktop 15/09/2026 (vòng phản hồi): sổ có 3 dòng như vậy, tách thô là lệch cột và CR đã đóng bị đếm "đang làm".
const ôCủa = (line) => {
  const c = []; let cur = ''; let inCode = false;
  for (const ch of line) {
    if (ch === '`') inCode = !inCode;
    if (ch === '|' && !inCode && !cur.endsWith('\\')) { c.push(cur.trim()); cur = ''; } else cur += ch;
  }
  c.push(cur.trim()); c.shift(); c.pop(); return c;
};
// `Đã nghiệm thu` = trạng thái cuối mà dự án thật dùng thay `Đóng` (dự án desktop: 392 dòng) — thiếu nó thì mọi CR bị đếm "đang làm".
const CR_ĐÓNG = /Đã nghiệm thu|Đã áp dụng|Đóng|Hu[ỷỳ]|H[uủ]y|Từ chối|Moved|Bị THAY/;
// dự án desktop 18/09/2026, đưa về nguồn 19/09: sổ ở đây KHÔNG viết "Đã triển khai" mà viết
// "Đã áp dụng (main, chờ test tay …)". Mà "Đã áp dụng" lại nằm trong CR_ĐÓNG, nên 12 CR đang chờ
// người dùng kiểm tay bị đếm hết vào "đã nghiệm thu" và cột chờ-kiểm luôn hiện 0 — đúng lúc nó là
// việc DUY NHẤT đang chặn (ba ô `dev ⚠️` của S01/S02 cũng chờ chính mấy ca đó).
// Phải xét TRƯỚC CR_ĐÓNG, xem thứ tự ở chỗ lọc bên dưới.
const CR_CHỜ_KIỂM = /Đã triển khai|ch[ờo]\s+(test|ki[ểe]m)\s+tay/i;
// KHÔNG dùng \b quanh chữ có dấu: `\bMã\b` không bao giờ khớp vì `ã` không phải ký tự \w trong
// regex JS, nên header không tìm thấy → rơi về so cả dòng → đếm nhầm.
const crHead = crLines.findIndex(l => /^\|/.test(l) && /Mã/.test(l) && /Trạng thái/.test(l));
const crStatusIdx = crHead >= 0 ? ôCủa(crLines[crHead]).indexOf('Trạng thái') : -1;
let crChờKiểm = 0, crĐãĐóng = 0;
const crOpen = crLines.filter(l => {
  if (!/^\|\s*\*{0,2}CR-[A-Za-z0-9-]+\*{0,2}\s*\|/.test(l)) return false;
  const tt = crStatusIdx >= 0 ? (ôCủa(l)[crStatusIdx] || '') : l;
  // CHỜ_KIỂM xét TRƯỚC: trạng thái thật là "Đã áp dụng (…chờ test tay…)" nên khớp cả hai rổ;
  // xét ĐÓNG trước là nuốt mất rổ chờ-kiểm (dự án desktop 18/09/2026, đưa về nguồn 19/09).
  if (CR_CHỜ_KIỂM.test(tt)) { crChờKiểm++; return false; }
  if (CR_ĐÓNG.test(tt)) { crĐãĐóng++; return false; }
  return true;
}).length;
// Work Item (ba-task): việc phát triển đang mở (chưa Xong/Hủy); Blocked = gấp
const backlog = readD('00-backlog.md');
const wiRows = backlog.split('\n').filter(l => /^\|\s*\*{0,2}WI-[A-Za-z0-9-]+\*{0,2}\s*\|/.test(l) && !/Xong|Hu[ỷỳ]|H[uủ]y/.test(l));
const wiOpen = wiRows.length;
const wiBlocked = wiRows.filter(l => /Blocked/.test(l)).length;
// Biên bản họp (ba-meet): đếm MoM + action item CHƯA xong → việc đã chốt trong họp mà chưa ai làm
const meetDir = require('../../ba-toolkit/scripts/docpath.js').resolveDoc(DOCS, 'meetings');
let momCount = 0, actOpen = 0;
if (meetDir) {
  for (const f of fs.readdirSync(meetDir).filter(n => n.endsWith('.md'))) {
    momCount++;
    actOpen += read(path.join(meetDir, f)).split('\n')
      .filter(l => /^\|\s*ACT-\d+/.test(l) && !/Xong|Hủy|Đóng/.test(l)).length;
  }
}
// Heuristic hệ ngoài: kiến trúc/tích hợp nhắc API bên thứ ba mà chưa có 12-api-integration.md.
// Quét theo DÒNG và bỏ dòng phủ định ("không OAuth", "tránh SSO", "chưa tích hợp") — nếu không sẽ báo nhầm
// đúng những dự án đã chủ động loại hệ ngoài. Chỉ dùng từ khóa MẠNH (SSO/OAuth/CRM đứng một mình quá yếu).
const NGOÀI = /(đối tác|bên thứ ba|third[- ]?party|cổng thanh toán|payment gateway|VNPAY|MoMo|Stripe|hóa đơn điện tử|e-?invoice|webhook)/i;
const PHỦ_ĐỊNH = /(không|tránh|chưa|loại bỏ|ngoài phạm vi|out of scope|\bno\b)/i;
const dùngHệNgoài = [arch, integ].join('\n').split('\n')
  .some(l => NGOÀI.test(l) && !PHỦ_ĐỊNH.test(l));

/* ---- 4. Suy vị trí pipeline + đề xuất ---- */
const đềXuất = [];
const suggest = (skill, lýDo, gấp) => đềXuất.push({ skill, lýDo, gấp: !!gấp });

const côLõi = (f) => sys.find(s => s.file === f).có;
const allDocsDone = screens.length > 0 && screens.every(s => s.đủTàiLiệu);
// Phạm vi docs: cột dev = `—` (refresh.js ghi) — không phải "đã bắt đầu dev".
const devDone = !chỉDocs && screens.length > 0 && screens.every(s => s.dev === '✅');
const devStarted = !chỉDocs && screens.some(s => s.dev !== '⬜' && s.dev !== '—');

/* ---- Luồng prototype-trước (ba-proto-first) ----
 * Dự án chạy luồng này có 00-flows.md TRƯỚC khi có 01-requirements.md. Không nhận ra thì "một cửa"
 * thấy thiếu requirements và bảo đi /ba-discover làm lại từ đầu — đúng lúc dự án đã có prototype và
 * đã chốt với khách. Đó là misroute đắt nhất status.js có thể phạm. */
const flows = readD('00-flows.md');
const protoFirst = !!flows;
// Màn khai ở "Bảng màn sơ bộ": cột đầu của dòng bảng là mã S.. TẠM (baseline do ba-screens cấp sau)
const mànFlow = [...new Set(flows.split('\n').filter(l => /^\|\s*S\d{2}\s*\|/.test(l)).map(l => l.split('|')[1].trim()))];
const protoPath = require('../../ba-toolkit/scripts/docpath.js').resolveDoc(DOCS, 'prototype.html');
const cóProto = !!protoPath && fs.existsSync(protoPath);
const quyếtĐịnh = read(path.join(DOCS, '00-decisions.md'));
const pdChốt = quyếtĐịnh.split('\n').filter(l => /^\|\s*PD-\d+/.test(l) && /\|\s*Chốt\s*\|/.test(l));
// `Treo` = câu hỏi nghiệp vụ chưa ai quyết. Đây là DANH SÁCH CHỜ NGƯỜI của cả dự án — thứ duy
// nhất trong toolkit mà máy không thay được. Không nêu ra thì nó nằm im trong sổ và bước viết
// đặc tả cứ chạy qua, đúng cái đã xảy ra với 15 câu hỏi của một lượt reverse.
const pdTreo = quyếtĐịnh.split('\n').filter(l => /^\|\s*PD-\d+/.test(l) && /\|\s*Treo\s*\|/.test(l));
const mànChưaChốt = mànFlow.filter(m => !pdChốt.some(l => l.includes(m)));
// Wireframe: mỗi màn ở bảng sơ bộ phải có ascii-screen.md trong folder màn nào đó
const mọiFolderMàn = [];
(function quét(d) { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  if (!e.isDirectory()) continue; const p = path.join(d, e.name);
  if (/^S\d+ - /.test(e.name)) mọiFolderMàn.push(p); else quét(p); } })(DOCS);
const mànThiếuAscii = mànFlow.filter(m => !mọiFolderMàn.some(p => path.basename(p).startsWith(m + ' ') && fs.existsSync(path.join(p, 'ascii-screen.md'))));
// FR không có PD nào đỡ = thứ chưa ai chốt mà đã viết vào đặc tả
// Sổ PD có HAI nguồn (conv-ledgers): `ba-proto-first` và `ba-reverse`. Khoá check này sau
// `protoFirst` nghĩa là dự án đi đường reverse có sổ PD mà luật "mỗi FR phải trace ≥1 PD"
// không bao giờ chạy — sổ thành danh sách trang trí. Điều kiện đúng là: CÓ SỔ thì có luật.
const cóSổPD = /\|\s*PD-\d+/.test(quyếtĐịnh);
const frMồCôiPD = !cóSổPD ? [] : (readD('01-requirements.md').split('\n')
  .filter(l => /^\|\s*(FR|BR)-\d+\s*\|/.test(l) && !/PD-\d+/.test(l))
  .map(l => l.split('|')[1].trim()));

let giaiĐoạn;
if (!côLõi('01-requirements.md') && protoFirst) {
  // Đang trong luồng prototype-trước: định tuyến THEO LUỒNG ĐÓ, đừng lôi về chuỗi xuôi.
  giaiĐoạn = 'GĐ1-P — Chốt nghiệp vụ bằng prototype';
  if (mànThiếuAscii.length)
    suggest('ba-screen-spec', `Màn ${mànThiếuAscii.join(', ')} chưa có ascii-screen.md — chạy \`ba-screen-spec --ascii <màn>\` (bước 3)`, true);
  else if (!cóProto)
    suggest('ba-proto-html', `${mànFlow.length} màn đã có wireframe — dựng prototype một-file để demo (bước 4)`, true);
  else if (!quyếtĐịnh)
    suggest('ba-proto-first', '★ Prototype xong nhưng CHƯA có 00-decisions.md — chạy CỔNG CHỐT NGHIỆP VỤ (bước 5). Viết đặc tả khi chưa chốt là viết bằng suy đoán', true);
  else if (mànChưaChốt.length)
    suggest('ba-proto-first', `Màn ${mànChưaChốt.join(', ')} chưa có PD nào ở trạng thái Chốt — demo lại riêng màn đó (bước 5)`, true);
  else
    suggest('ba-requirements', `${pdChốt.length} quyết định đã chốt — viết yêu cầu TỪ sổ PD (bước 6); mỗi FR trace ≥1 PD`, true);
  if (!cóProto && !mànThiếuAscii.length && !mànFlow.length)
    suggest('ba-flow', 'Bảng màn sơ bộ trong 00-flows.md đang rỗng — bổ sung màn trước khi dựng prototype', true);
} else if (!côLõi('01-requirements.md')) {
  giaiĐoạn = 'GĐ1 — Khám phá';
  if (côLõi('00-intake.md')) suggest('ba-reverse-doc', 'Đã kiểm kê nguồn (00-intake.md) nhưng chưa có 01-requirements — trích tiếp yêu cầu 🔶 từ nguồn', true);
  else if (!côLõi('00-brainstorm.md')) suggest('ba-discover', 'Chưa có brainstorm lẫn requirements — chạy trọn GĐ1 (vision/stakeholder/persona/brainstorm/process). Đã có sẵn tài liệu rời của khách → /ba-reverse-doc trước');
  else suggest('ba-init', 'Đã có 00-brainstorm — vào GĐ2: requirements → functions → screens → per-màn');
  if (!has('00-personas.md')) suggest('ba-persona', 'Chưa có 00-personas.md — dựng chân dung người dùng + hành trình để rút ứng viên U-.. trước khi viết yêu cầu', false);
  if (!has('00-urd.md')) suggest('ba-urd', 'Chưa có 00-urd.md — chốt NHU CẦU người dùng (UN-..) + tiêu chí thành công (USC-..) trước khi viết yêu cầu hệ thống', false);
} else if (!côLõi('02-functions.md')) {
  giaiĐoạn = 'GĐ2 — Đặc tả'; suggest('ba-functions', 'Có requirements nhưng chưa có 02-functions.md');
} else if (!côLõi('03-overview.md')) {
  giaiĐoạn = 'GĐ2 — Đặc tả'; suggest('ba-screens', 'Có functions nhưng chưa có 03-overview.md (danh sách màn + điều hướng)');
} else if (!allDocsDone) {
  giaiĐoạn = 'GĐ2 — Đặc tả per-màn';
  const chưa = screens.filter(s => s.trạngThái === '⬜');
  const dởDang = screens.filter(s => s.trạngThái === '🔨' || s.trạngThái === '⚠️');
  // Màn chỉ thiếu MỖI plan.md là việc của ba-build, không phải việc đồng bộ của ba-track.
  // Gộp chung vào "đang dở → ba-track" là đặt sai tên vấn đề: ba-track rà nhất quán, nó không sinh plan.
  const thiếuPlan = screens.filter(s => s.trạngThái === '🔨' && s.cóĐủTrừPlan);
  const dởThật = dởDang.filter(s => !thiếuPlan.includes(s));
  if (thiếuPlan.length) suggest('ba-build', `Màn ${thiếuPlan.map(s => s.code).join(', ')} đủ tài liệu, chỉ thiếu plan.md — sinh kế hoạch dev`, false);
  if (dởThật.length) suggest('ba-track ' + dởThật[0].tên, `Màn ${dởThật.map(s => s.code).join(', ')} đang dở/lệch (⚠️) — đồng bộ trước khi mở màn mới`, dởThật.some(s => s.trạngThái === '⚠️'));
  if (chưa.length >= 3) suggest('ba-batch', `${chưa.length} màn chưa bắt đầu (${chưa.map(s => s.code).join(', ')}) — đặc tả SONG SONG bằng subagent nhanh hơn tuần tự`);
  else if (chưa.length) suggest('ba-add-screen ' + chưa[0].tên, `Màn ${chưa.map(s => s.code).join(', ')} chưa bắt đầu`);
  if (!arch) suggest('ba-architecture', chỉDocs ? 'Chưa chốt kiến trúc (10-architecture.md) — tài liệu kỹ thuật bàn giao cho đội build, tùy chọn ở phạm vi docs' : 'Chưa chốt kiến trúc (10-architecture.md) — cần trước ba-build/dev-run', false);
} else if (chỉDocs) {
  // Phạm vi docs: tài liệu đủ = xong việc của repo này. Bàn giao = gate tổng sạch → RTM → (UAT) → portal.
  giaiĐoạn = 'GĐ3 — Bàn giao tài liệu';
  const gapsCũ = !has('00-gaps.md');
  if (gapsCũ) suggest('ba-review all', 'Tài liệu đủ nhưng chưa có gate tổng (00-gaps.md) — chạy scope all trước khi bàn giao', true);
  if (!has('00-traceability.md')) suggest('ba-trace', 'Xuất ma trận truy vết BR→…→TC (00-traceability.md) — bằng chứng độ phủ khi bàn giao', !gapsCũ);
  if (!has('09-uat.md')) suggest('ba-uat', 'Kế hoạch nghiệm thu người dùng (09-uat.md) — tiêu chí để đội build/khách ký, tùy chọn', false);
  if (!arch) suggest('ba-architecture', 'Chưa có 10-architecture.md — nếu bàn giao cho đội build thì chốt kiến trúc là tài liệu họ cần đầu tiên, tùy chọn', false);
  if (!has('portal.html')) suggest('ba-portal', 'Xuất cổng đọc offline (Ho-so/portal.html) để gửi stakeholder', false);
} else if (!devDone) {
  giaiĐoạn = devStarted ? 'GĐ3 — Đang dev' : 'GĐ3 — Sẵn sàng dev';
  if (!arch) suggest('ba-architecture', 'Tài liệu đủ nhưng CHƯA chốt kiến trúc — dev-run sẽ phải hỏi stack ad-hoc', true);
  else if (adrDraft) suggest('ba-architecture', 'ADR còn Draft/⚠️ chưa chốt — qua cổng chốt trước rồi mới dev', true);
  // Kiến trúc đã chốt mà chưa có mô hình đe doạ → gợi (tùy chọn, không chặn dev): ac-judge lượt B đọc §6 của nó.
  else if (!has('00-threat-model.md') && !devStarted && càiRồi('ba-threat-model')) suggest('ba-threat-model', `Kiến trúc đã chốt nhưng chưa có mô hình đe doạ (00-threat-model.md) — TM bám ADR/NFR + checklist bảo mật cho ac-judge, tùy chọn trước khi dev${nhãnThử('ba-threat-model')}`, false);
  // dự án desktop 18/09/2026, đưa về nguồn 19/09: TÁCH ⚠️ khỏi ⬜. Bản gốc gộp cả hai vào "chưa dev xong" rồi gợi
  // ac-po/dev-run — nhắm sai đích khi ô ⚠️ nghĩa là ĐÃ CÓ CODE mà còn vướng thứ khác. Đo trên dự án
  // này 18/09: ba ô ⚠️ (S01, S02, S14) đều không thiếu code — S01 ghi thẳng "code đã phát hành ở
  // 1.0.12/1.0.13, 8 TC manual chờ kiểm tay", S02 chờ hand-test TC-74..79. Phái đội dev vào đó là
  // bảo họ viết lại thứ đã chạy. ⬜ mới là việc của dev-run; ⚠️ là việc của người (kiểm tay) hoặc
  // của ba-track (ô lệch hiện trạng).
  const devChưa = screens.filter(s => s.dev === '⬜');
  const devVướng = screens.filter(s => s.dev === '⚠️');
  if (arch && !adrDraft && devChưa.length >= 2) suggest('ac-po plan', `${devChưa.length} màn CHƯA dev (${devChưa.map(s => s.code).join(', ')}) — để PO xếp việc và đội tự chạy theo phase (dừng ở chỗ thuộc quyền người)`, false);
  if (devVướng.length) suggest('ba-track', `${devVướng.length} màn có ô dev ⚠️ (${devVướng.map(s => s.code).join(', ')}) — ĐÃ CÓ CODE nhưng còn vướng (TC tay chờ kiểm, hoặc ô lệch hiện trạng). Đọc ô Trạng thái của từng màn trước khi phái dev`, false);
  if (arch && !adrDraft && devChưa.length) suggest('dev-run', devStarted ? `Tiếp tục dev (${screens.filter(s => s.dev === '✅').length}/${screens.length} màn xong, ${devChưa.length} màn chưa bắt đầu)` : 'Tài liệu đủ + kiến trúc đã chốt — bắt đầu viết code theo plan.md');
  // Đã có màn code xong → đối chiếu code với đặc tả ngay, đừng đợi tới lúc nghiệm thu mới biết lệch
  if (devStarted && !has('00-conformance.md') && !tắt.conformance) suggest('ba-conformance', `Đã có ${screens.filter(s => s.dev === '✅').length} màn dev xong nhưng chưa đối chiếu code với tài liệu — dò chỗ lệch/chưa làm/dev không có đặc tả`, true);
} else {
  giaiĐoạn = 'GĐ4 — Nghiệm thu';
  // ba-conformance TRƯỚC ba-accept: nghiệm thu một bản code lệch đặc tả là nghiệm thu nhầm
  if (!has('00-conformance.md')) suggest('ba-conformance', 'Dev xong nhưng CHƯA đối chiếu code với đặc tả — nghiệm thu bản code lệch là nghiệm thu nhầm', true);
  suggest('ba-accept', 'Dev xong toàn bộ — chạy chuỗi nghiệm thu: UAT → release → RTM → publish → ký');
  if (!hasDoc(DOCS, 'userguide')) suggest('ba-userguide', 'Viết cẩm nang vận hành cho người dùng (bước tùy chọn GĐ4, sau UAT)', false);
}
/* Chen ngang mọi giai đoạn */
// Dự án chạy luồng prototype-trước: FR không dẫn về PD nào = thứ CHƯA AI CHỐT mà đã viết vào đặc
// tả. Đây đúng thứ luồng đó sinh ra để chặn, nên phải kêu ở mọi giai đoạn chứ không chỉ lúc viết.
if (protoFirst && frMồCôiPD.length)
  suggest("ba-proto-first", `${frMồCôiPD.join(", ")} trong 01-requirements.md không trace về PD nào — chưa ai chốt mà đã đặc tả; quay lại cổng chốt hoặc bỏ khỏi phạm vi`, true);
// E2E: chỉ nhắc khi dự án ĐÃ theo E2E (có ít nhất 1 màn ✅) hoặc đã dev xong — không ép dự án chưa dùng
const e2eThiếu = screens.filter(s => s.e2e === '⬜' && s.cóTest), e2eLệch = screens.filter(s => s.e2e === '⚠️');
const đãTheoE2E = screens.some(s => s.e2e === '✅');
if (chỉDocs) { /* ba-test-e2e là skill dev — không cài ở phạm vi docs */ }
else if (e2eLệch.length) suggest('ba-test-e2e ' + e2eLệch[0].tên, `Màn ${e2eLệch.map(s => s.code).join(', ')} có script E2E LỆCH test.md (⚠️) — sinh lại cho khớp`, true);
else if (đãTheoE2E && e2eThiếu.length) suggest('ba-test-e2e ' + e2eThiếu[0].tên, `Dự án đang theo E2E nhưng màn ${e2eThiếu.map(s => s.code).join(', ')} chưa có e2e.spec.ts`, false);
else if (!đãTheoE2E && devDone && screens.length) suggest('ba-test-e2e', 'Đã dev xong mà chưa có script E2E nào — sinh e2e/tests/*.spec.ts từ test.md để chạy hồi quy trên app thật (tùy chọn)', false);
// Figma (05/10/2026, figma-push) — OPT-IN: chỉ nói khi dự án ĐÃ dùng đối soát Figma (có sổ `00-figma-sync.md` hoặc
// tracking có cột `figma`). Dự án không dùng Figma không bị nhắc — wireframe chốt hay html ✅ không có nghĩa là phải lên
// Figma. Trạng thái từng màn hỏi `figma-sync.js plan --json` (không tự tính lại sha/sổ ở đây); ô ✋/⚠️ của tracking cộng vào.
const dùngFigma = càiRồi('ba-figma-draw') && (has('00-figma-sync.md') || (headIdx >= 0 && /\|\s*figma\s*\|/.test(trkLines[headIdx])));
if (dùngFigma) {
  let fp = null;
  try { fp = JSON.parse(require('child_process').spawnSync(process.execPath, [path.join(SKILLS_DIR, 'ba-figma-draw', 'scripts', 'figma-sync.js'), 'plan', DOCS, '--json'], { encoding: 'utf8', maxBuffer: 1e8 }).stdout); } catch { /* sổ hỏng → chỉ dựa ô tracking */ }
  const fs_ = (fp && fp.screens) || [];
  const mã = (pred) => [...new Set([...fs_.filter(pred).map((s) => s.code)])];
  const kéo = [...new Set([...mã((s) => s.hifi === 'figma-sửa' || s.lofi === 'figma-sửa'), ...screens.filter((s) => s.figma === '✋').map((s) => s.code)])];
  const mới = [...new Set([...mã((s) => s.hifi === 'html-mới' || s.lofi === 'html-mới'), ...screens.filter((s) => s.figma === '⚠️').map((s) => s.code)])].filter((c) => !kéo.includes(c));
  const chưaLofi = mã((s) => s.lofi === 'chưa-đẩy-lofi'), chưaHifi = mã((s) => s.hifi === 'chưa-đẩy');
  if (kéo.length) suggest('ba-figma-draw pull ' + kéo[0], `Màn ${kéo.join(', ')} có khối sửa tay trên Figma (✋) chưa kéo về — sau khi đẩy hi-fi Figma là CHUẨN; kéo về trước khi sửa html-design`, true);
  if (mới.length) suggest('ba-figma-draw push ' + mới[0], `Màn ${mới.join(', ')}: html-design sửa SAU khi đẩy mà không qua pull (⚠️) — push lại nếu cố ý đổi, không thì hoàn tác`, true);
  if (chưaHifi.length) suggest('ba-figma-draw push ' + chưaHifi[0], `Màn ${chưaHifi.join(', ')} html ✅ nhưng chưa đẩy hi-fi lên Figma`, false);
  if (chưaLofi.length) suggest('ba-figma-draw push-lofi ' + chưaLofi[0], `Màn ${chưaLofi.join(', ')} đã chốt phương án wireframe (data-chosen) nhưng chưa đẩy lo-fi lên Figma`, false);
  if (fp === null) suggest('ba-figma-draw', 'figma-sync.js plan không chạy được — sổ Ho-so/00-figma-sync.md hỏng? chạy tay để xem lỗi', true);
}
// W3 (07/10/2026, thieu.js): tài liệu viết trước quy ước mới (bảng phần tử, ma trận E, cột Cách chạy, 07 §4b,
// data-chosen, Trace/Proof, verification mới) làm checker IM hoặc LỆCH mà không ai thấy. thieu.js đếm (đã tôn trọng
// hồ sơ/phạm vi); ở đây chỉ gộp theo khoá + MỘT đề xuất không gấp cho khoá nhiều màn nhất — không chặn dự án cũ.
let tínhNăngTắt = [];
try { const TH = require('../../ba-toolkit/scripts/thieu.js'); tínhNăngTắt = TH.gộp(TH.quét(DOCS)); } catch { /* thieu.js chưa cài (bản cũ) → im */ }
if (tínhNăngTắt.length) {
  const đầu = [...tínhNăngTắt].sort((a, b) => b.màn.length - a.màn.length)[0];
  const chú = (đầu.cach.match(/\(([^)]*)\)\s*$/) || [])[1];
  suggest(đầu.cach.replace(/\s*\([^)]*\)\s*$/, '').replace('<màn>', đầu.màn[0] || '').replace(/\s+/g, ' ').trim(),
    `${đầu.màn.length ? `${đầu.màn.length} màn (${đầu.màn.join(', ')})` : 'Dự án'} thiếu \`${đầu.khoá}\`${chú ? ` — ${chú}` : ''} — đang tắt ${đầu.tat.length} tính năng (${đầu.tat.slice(0, 2).join(', ')}${đầu.tat.length > 2 ? '…' : ''}); xem khối "Tính năng đang tắt"`, false);
}
if (dùngHệNgoài && !has('12-api-integration.md')) suggest('ba-api-integration', 'Kiến trúc/tích hợp có nhắc hệ ngoài/đối tác nhưng chưa có 12-api-integration.md (build-vs-buy + mapping field + readiness)', false);
for (const f of adrDraftKhác) suggest(f === '11-integration.md' ? 'ba-integration' : 'ba-api-integration', `${f} còn ADR Draft/⚠️ chưa chốt — qua cổng CHỐT trước khi dev phần tích hợp`, devStarted);
if (pdTreo.length) {
  // KHÔNG route sang một skill: `PD` treo không phải việc skill nào làm được. Không có skill
  // riêng cho sổ PD (canon cố ý không đẻ thêm), và gán bừa `ba-change-request` là chỉ sai
  // đường — CR đổi thứ ĐÃ CHỐT, còn đây là thứ CHƯA AI CHỐT. Nêu thẳng việc phải làm.
  suggest('(người quyết)', `${pdTreo.length} quyết định nghiệp vụ đang TREO trong docs/00-decisions.md — chốt với người có thẩm quyền (cột "Ai chốt") rồi đổi trạng thái sang \`Chốt\`. Máy không quyết thay được, và viết đặc tả trên nền chưa chốt là bịa`, true);
}
if (gapCount['🔴']) suggest('ba-review', `00-gaps.md còn ${gapCount['🔴']} gap 🔴 CHẶN — xử trước mọi bước khác`, true);
// Nợ 🟠 có hạn chót là ba-build/dev-run/ba-accept → sang GĐ3 mà chưa sạch là ĐÃ QUÁ HẠN, không còn là nợ
// Phạm vi docs không có ba-build/dev-run/ba-accept → mốc thu nợ là `ba-review all` cuối GĐ2 (bàn giao).
if (gapCount['🟠'] && /GĐ[34]/.test(giaiĐoạn)) suggest('ba-review all', `${gapCount['🟠']} nợ 🟠 quá hạn — mốc phải sạch (${chỉDocs ? 'bàn giao tài liệu = ba-review all' : 'ba-build/dev-run/ba-accept'}) đã tới`, true);
else if (gapCount['🟠']) suggest('ba-review all', `${gapCount['🟠']} nợ 🟠 chưa tới hạn — xem mục "Nợ có hạn" của 00-gaps.md trước khi ${chỉDocs ? 'bàn giao' : 'chạy ba-build'}`, false);
// Báo cáo gap chỉ phủ một phần → đừng để người dùng tưởng dự án sạch vì con số nhỏ
else if (gapCảnhBáo) suggest('ba-review all', `${gapCảnhBáo} — chạy scope all để có số thật`, false);
// Hàng đợi thay đổi tài liệu ĐÃ CHỐT do hook ghi — tồn đọng nghĩa là có người sửa baseline mà chưa ai rà
let changeQueue = 0;
try { changeQueue = fs.readFileSync(path.join(path.dirname(DOCS), '.claude', 'spec-changes.jsonl'), 'utf8').split('\n').filter(Boolean).length; } catch { /* chưa có hàng đợi */ }
// Nợ hook (giao diện 4 — hook-review 07/10/2026): S2 chưa giải = baseline đổi mà chưa có CR khớp. Hiện như 🟠 (không chặn bước
// đang làm, quá GĐ2 thì gấp). hook-gate tự đóng nợ khi có CR khớp hoặc file trở về HEAD — status.js chỉ ĐỌC, không đóng hộ.
let nợHook = [];
try {
  const j = JSON.parse(fs.readFileSync(path.join(path.dirname(DOCS), '.claude', 'ba-hook-debt.json'), 'utf8'));
  nợHook = (Array.isArray(j && j.mo) ? j.mo : []).map((d) => ({ id: d.id, luat: d.luat, man: d.man, ids: d.ids || [], ts: d.ts, chiTiet: d.chiTiet || '' }));
} catch { /* chưa có sổ nợ / hỏng → không nợ (hook ghi lại ở lượt sau) */ }
if (nợHook.length) suggest('ba-change-request', `🟠 ${nợHook.length} nợ hook — tài liệu đã chốt bị đổi mà chưa có CR khớp (${nợHook.slice(0, 4).map((d) => `${d.id} ${d.man}`).join(', ')}${nợHook.length > 4 ? '…' : ''}): mở CR nhắc mã màn/ID vừa đổi, hoặc trả file về HEAD`, /GĐ[34]/.test(giaiĐoạn));
if (changeQueue && !tắt.changelog) suggest('ba-changelog', `${changeQueue} thay đổi trên tài liệu ĐÃ CHỐT chưa vào sổ — có thể có người đổi baseline mà chưa mở CR`, changeQueue >= 5);
// Dashboard: chỉ gợi khi dự án đã đủ lớn để có gì mà báo cáo (đã sang GĐ3+)
if (devStarted && !has('00-dashboard.md')) suggest('ba-dashboard', 'Chưa có báo cáo điều hành — gom tiến độ/CR/WI/UAT/gap thành một trang cho PM', false);
// Chỉ CR ĐANG LÀM DỞ mới là bước tiếp theo. CR chờ kiểm tay là việc kiểm thử tay, không phải
// việc của pipeline — đếm ra nhưng không đề xuất.
if (crOpen) suggest('ba-change-request list', `${crOpen} CR đang làm dở trong 00-cr.md`, false);
if (wiOpen && !tắt.backlog) suggest('ba-task list', `${wiOpen} Work Item đang mở trong 00-backlog.md${wiBlocked ? ` (${wiBlocked} Blocked)` : ''}`, wiBlocked > 0);
if (actOpen) suggest('ba-meet', `${actOpen} action item (ACT) trong docs/meetings/ chưa Xong — rà lại, việc nào là thay đổi thì mở CR`, false);

/* ---- 5. In ---- */
const out = { giaiĐoạn, hồSơ, phạmVi, tàiLiệuHệThống: sys.filter(s => s.có).map(s => s.file), thiếu: sys.filter(s => !s.có && s.note === 'lõi').map(s => s.file), mànHình: screens, gaps: gapCount, gapsScope: { scope: gapScope || null, ngày: gapNgày || null, đãPhủ: gapĐãPhủ || null, toànCục: gapToànCục }, adrDraft, crĐangMở: crOpen, crChờKiểm, crĐãĐóng, wiĐangMở: wiOpen, wiBlocked, biênBảnHọp: momCount, actChưaXong: actOpen, tínhNăngTắt, ...(nợHook.length ? { nợHook } : {}), đềXuất };   // nợHook chỉ có khi có nợ: giữ hình JSON cũ cho bánh cóc real-run
if (JSON_MODE) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

console.log(`\n📍 ${giaiĐoạn}${hồSơ === 'lite' ? '  ·  ⚙️ hồ sơ lite (tắt: sổ WI · changelog · đối chiếu code · review agent)' : ''}${chỉDocs ? '  ·  ⚙️ phạm vi docs (không plan/dev — bàn giao tài liệu)' : ''}`);
console.log(`\nTài liệu hệ thống: ${sys.filter(s => s.có).length}/${sys.length} — ${sys.filter(s => s.có).map(s => s.file.replace('.md', '')).join(' · ') || '(chưa có)'}`);
if (screens.length) {
  console.log(`Màn hình (${screens.length}):`);
  for (const s of screens) console.log(`  ${s.trạngThái} ${s.code} ${s.tên}${s.dev !== '⬜' ? ` · dev ${s.dev}` : ''}${s.e2e !== '⬜' ? ` · e2e ${s.e2e}` : ''}${s.figma !== '⬜' ? ` · figma ${s.figma}` : ''}`);
} else console.log('Màn hình: chưa có tracking (chạy ba-screens hoặc refresh.js của ba-track).');
if (pdTreo.length) console.log(`Quyết định nghiệp vụ TREO: ${pdTreo.length} (00-decisions.md) — chờ người, máy không thay được`);
if (gapCount['🔴'] + gapCount['🟡'] + gapCount['🟠']) console.log(`Gaps: 🔴 ${gapCount['🔴']} · 🟡 ${gapCount['🟡']} · 🟠 ${gapCount['🟠']} nợ (00-gaps.md${gapNgày ? ` · ${gapNgày}` : ''}${gapToànCục ? '' : gapĐãPhủ ? ` · mới phủ ${gapĐãPhủ}` : ''}${gapĐãĐóng ? ` · ${gapĐãĐóng} dòng đã đóng, không tính` : ''})`);
else if (gapĐãĐóng) console.log(`Gaps: sạch — ${gapĐãĐóng} dòng trong 00-gaps.md đều đã đóng`);
if (gapCảnhBáo) console.log(`⚠️  ${gapCảnhBáo}`);
if (nợHook.length) console.log(`🟠 Nợ hook: ${nợHook.length} (.claude/ba-hook-debt.json) — ${nợHook.slice(0, 4).map((d) => `${d.id} ${d.luat} ${d.man}${d.ids.length ? ' [' + d.ids.slice(0, 3).join(', ') + (d.ids.length > 3 ? '…' : '') + ']' : ''}`).join(' · ')}`);
if (adrDraft) console.log('Kiến trúc: ⚠️ ADR còn Draft — chưa qua cổng chốt.');
if (crOpen + crChờKiểm + crĐãĐóng) {
  console.log(`CR: ${crOpen} đang làm · ${crChờKiểm} đã triển khai (chờ kiểm tay) · ${crĐãĐóng} đã nghiệm thu`);
}
if (wiOpen) console.log(`Work Item đang mở: ${wiOpen}${wiBlocked ? ` · Blocked: ${wiBlocked}` : ''}`);
if (momCount) console.log(`Biên bản họp: ${momCount}${actOpen ? ` · ACT chưa xong: ${actOpen}` : ''}`);
if (tínhNăngTắt.length) {
  console.log('\n⚙️ Tính năng đang tắt vì thiếu (thieu.js — bổ sung thì checker mới đếm được):');
  for (const g of tínhNăngTắt) console.log(`  ${g.khoá}: ${g.màn.length ? g.màn.join(', ') : '(dự án)'} (${g.tat.length} checker)`);
}
console.log('\n👉 Đề xuất tiếp theo:');
for (const d of đềXuất.sort((a, b) => (b.gấp ? 1 : 0) - (a.gấp ? 1 : 0))) console.log(`  ${d.gấp ? '❗' : '·'} ${d.skill.startsWith('(') ? d.skill : '/' + d.skill} — ${d.lýDo}`);
console.log('');
