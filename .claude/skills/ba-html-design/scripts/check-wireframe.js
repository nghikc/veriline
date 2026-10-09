#!/usr/bin/env node
/*
 * ba-html-design/check-wireframe.js — soát wireframe lo-fi (chế độ `lofi`) (zero-dependency).
 *
 * Giá trị của bản lo-fi này nằm ở chỗ mỗi khối mang ĐÚNG số `#` của "Bảng mô tả chi tiết phần
 * tử màn hình" trong srs.md. Nếu số lệch thì người review tra nhầm dòng — tệ hơn là không đánh
 * số, vì nó tạo cảm giác đối chiếu được trong khi không. Script giữ đúng ba thứ ĐẾM ĐƯỢC:
 *   1. mọi phần tử trong bảng có khối trên hình (và ngược lại, không có khối lạ);
 *   2. số `#` không trùng, không nhảy cóc;
 *   3. đúng LO-FI thật: không màu thương hiệu, không ảnh nhúng, không Lorem ipsum;
 *   4. màn có ≥2 phương án (`wf-variant`): đúng 1 khuyên dùng, lý do 3 vế không lời sáo, mỗi phương
 *      án phủ đủ bảng với cùng bộ số #, ≤1 data-chosen, chữ phương án không trùng (WF-VAR-*).
 *
 * Dùng:  node .claude/skills/ba-html-design/scripts/check-wireframe.js [docsDir=docs] [--json]
 * Exit code = số lỗi (0 = sạch).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { resolveDoc } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));

const argv = process.argv.slice(2).filter(a => !a.startsWith('--'));
const JSON_MODE = process.argv.includes('--json');
const DOCS = path.resolve(argv[0] || 'docs');

const wfPath = resolveDoc(DOCS, 'wireframe.html');
if (!wfPath || !fs.existsSync(wfPath)) { console.error('Không thấy Ho-so/wireframe.html — chạy /ba-html-design lofi trước.'); process.exit(2); }
const html = fs.readFileSync(wfPath, 'utf8');

let errors = 0, warns = 0; const E = [], W = [];
const fail = m => { E.push(m); errors++; };
const warn = m => { W.push(m); warns++; };

/* ---- Bảng phần tử của từng màn, lấy từ srs.md trong folder màn (parser chung ba-toolkit/srs-elements.js) ---- */
const SE = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'srs-elements.js'));
const mànDoc = {};
for (const [mã, bảng] of Object.entries(SE.scanDocs(DOCS))) mànDoc[mã] = bảng && bảng.map(r => ({ số: r.n, tên: r.ten }));

/* ---- Màn + khối trên wireframe ---- */
const sections = [...html.matchAll(/<section[^>]*data-screen="(S\d+)"[\s\S]*?<\/section>/g)];
const wf = {};
for (const s of sections) wf[s[1]] = [...new Set([...s[0].matchAll(/data-el="(\d+)"/g)].map(m => +m[1]))].sort((a, b) => a - b);

if (!sections.length) fail('wireframe.html không có section nào mang `data-screen` — không đối chiếu được với bảng phần tử');

/* ---- Phương án bố cục (wf-variant) ----
 * Màn có ≥2 cách bố cục hợp lý thì dựng 2–3 phương án trong cùng section. Chỉ soát khi có ≥2
 * phương án — màn một phương án/không phương án giữ y như cũ. Mã luật WF-VAR-* để ca đối kháng
 * bắt đúng từng luật. Phương án = từ thẻ mở `wf-variant` tới thẻ mở kế (hoặc hết section): không
 * cần khớp thẻ đóng lồng nhau, chỉ cần biết data-el nào thuộc phương án nào. */
const SÁO = ['gọn gàng', 'hiện đại', 'trực quan', 'đẹp'];
const attr = (tag, a) => { const m = tag.match(new RegExp(`\\s${a}(?:=("([^"]*)"|'([^']*)'))?(?=[\\s>/])`)); return m ? (m[2] ?? m[3] ?? '') : null; };
function phươngÁn(sec) {
  const tags = [...sec.matchAll(/<div\b(?:[^>"']|"[^"]*"|'[^']*')*>/g)].filter(t => /\bwf-variant\b/.test(attr(t[0], 'class') || ''));
  return tags.map((t, i) => {
    const thân = sec.slice(t.index + t[0].length, i + 1 < tags.length ? tags[i + 1].index : sec.length);
    const sốs = [...thân.matchAll(/data-el="(\d+)"/g)].map(m => +m[1]);
    return { chữ: attr(t[0], 'data-variant'), lýDo: attr(t[0], 'data-reason'), khuyên: attr(t[0], 'data-recommended') !== null,
      chốt: attr(t[0], 'data-chosen') !== null, sốs, els: [...new Set(sốs)].sort((a, b) => a - b) };
  });
}
const PA = {};
for (const s of sections) { const v = phươngÁn(s[0]); if (v.length >= 2) PA[s[1]] = v; }
for (const [mã, vs] of Object.entries(PA)) {
  const tên = v => `phương án ${v.chữ || '?'}`;
  const chữ = vs.map(v => v.chữ);
  if (chữ.some(c => !c)) fail(`WF-VAR-LETTER ${mã}: có wf-variant thiếu \`data-variant\` — người dùng không trả lời được "${mã}: B"`);
  const chữTrùng = chữ.filter((c, i) => c && chữ.indexOf(c) !== i);
  if (chữTrùng.length) fail(`WF-VAR-LETTER ${mã}: chữ phương án ${[...new Set(chữTrùng)].join(', ')} trùng — "?${mã}=${chữTrùng[0]}" chọn không ra một phương án`);
  const khuyên = vs.filter(v => v.khuyên).length;
  if (khuyên !== 1) fail(`WF-VAR-REC ${mã}: ${vs.length} phương án mà có ${khuyên} \`data-recommended\` — phải đúng 1 (mặc định hiện cái nào, "ok" chốt cái nào)`);
  const chốt = vs.filter(v => v.chốt).length;
  if (chốt > 1) fail(`WF-VAR-CHOSEN ${mã}: ${chốt} phương án cùng \`data-chosen\` — ba-html-design không biết bám bản nào`);
  for (const v of vs) {
    const lý = (v.lýDo || '').normalize('NFC');
    const vế = lý.split('·').map(x => x.trim());
    if (vế.length !== 3 || vế.some(x => !x)) fail(`WF-VAR-REASON ${mã} ${tên(v)}: \`data-reason\` phải đủ 3 ý "việc chính ở đâu · khác phương án kia gì · đánh đổi" (đang có ${lý ? vế.filter(Boolean).length : 0} ý)`);
    const sáo = SÁO.filter(c => new RegExp(`(^|[^\\p{L}])${c}(?=[^\\p{L}]|$)`, 'iu').test(lý));
    if (sáo.length) fail(`WF-VAR-CLICHE ${mã} ${tên(v)}: lý do dùng lời sáo "${sáo.join('", "')}" — phải gọi tên việc chính của màn, không khen hình`);
    const dup = v.sốs.filter((n, i) => v.sốs.indexOf(n) !== i);
    if (dup.length) warn(`${mã} ${tên(v)}: số #${[...new Set(dup)].join(', #')} xuất hiện nhiều lần — người review không biết tra khối nào`);
  }
  const gốc = vs[0].els.join(',');
  for (const v of vs.slice(1)) if (v.els.join(',') !== gốc)
    fail(`WF-VAR-ELSET ${mã}: ${tên(v)} đánh số {#${v.els.join(', #')}} khác ${tên(vs[0])} {#${vs[0].els.join(', #')}} — số # phải giữ nguyên giữa các phương án`);
}

for (const [mã, els] of Object.entries(wf)) {
  const bảng = mànDoc[mã];
  if (bảng === undefined) { warn(`${mã} có trên wireframe nhưng không tìm thấy folder màn tương ứng`); continue; }
  if (bảng === null) { fail(`${mã}: srs.md CHƯA có "Bảng mô tả chi tiết phần tử màn hình" — không có số # để đối chiếu`); continue; }
  const sốBảng = bảng.map(b => b.số);
  // Có phương án → soát độ phủ TỪNG phương án (mỗi phương án phải tự đứng được); không thì cả section như cũ.
  for (const [nhãn, ds] of PA[mã] ? PA[mã].map(v => [`${mã} phương án ${v.chữ || '?'}`, v.els]) : [[mã, els]]) {
    const thiếu = bảng.filter(b => !ds.includes(b.số));
    const lạ = ds.filter(n => !sốBảng.includes(n));
    if (thiếu.length) fail(`${PA[mã] ? 'WF-VAR-COVER ' : ''}${nhãn}: phần tử ${thiếu.map(t => `#${t.số} ${t.tên}`).join(', ')} có trong bảng nhưng KHÔNG có khối trên hình`);
    if (lạ.length) fail(`${nhãn}: khối #${lạ.join(', #')} trên hình KHÔNG có dòng nào trong bảng — số này tra không ra gì`);
  }
  if (PA[mã]) continue; // trùng số giữa các phương án là ĐÚNG luật — trùng trong một phương án đã soát ở trên
  const trùng = [...(sections.find(s => s[1] === mã)[0].matchAll(/data-el="(\d+)"/g))].map(m => m[1]);
  const dup = trùng.filter((v, i) => trùng.indexOf(v) !== i);
  if (dup.length) warn(`${mã}: số #${[...new Set(dup)].join(', #')} xuất hiện nhiều lần — người review không biết tra khối nào`);
}
for (const mã of Object.keys(mànDoc)) if (mànDoc[mã] && !wf[mã]) warn(`${mã} có bảng phần tử nhưng chưa được dựng trên wireframe`);

/* ---- Đúng LO-FI thật ---- */
// Màu: cho phép thang xám (#000..#fff cùng 3 kênh) + vài từ khoá trung tính.
for (const m of html.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
  const h = m[1].length === 3 ? m[1].split('').map(c => c + c).join('') : m[1];
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  if (!(r === g && g === b)) { fail(`màu "#${m[1]}" không phải thang xám — bản lo-fi cố ý bỏ màu để người xem bàn BỐ CỤC, không bàn màu`); break; }
}
if (/<img\s/i.test(html)) fail('có <img> — wireframe lo-fi dùng khung gạch chéo có nhãn "Ảnh", không nhúng ảnh thật');
if (/lorem\s+ipsum/i.test(html)) fail('có "Lorem ipsum" — dùng dữ liệu mẫu tiếng Việt như thật, chữ giả che mất việc nội dung có vừa khung không');
// `repeating-linear-gradient` là cách SKILL QUY ĐỊNH để vẽ khung gạch chéo thay ảnh — chê nó là
// chê đúng thứ mình bắt dùng. Chỉ cảnh báo gradient TRANG TRÍ và đổ bóng.
{
  const trangTrí = html.replace(/repeating-linear-gradient\([^)]*\)/gi, '');
  if (/box-shadow|(?<!repeating-)linear-gradient/i.test(trangTrí)) warn('có box-shadow/gradient trang trí — không thuộc bậc lo-fi (khung gạch chéo `repeating-linear-gradient` thì được)');
}
if (/<script[^>]+src=|<link[^>]+href=["']https?:/i.test(html)) fail('có tài nguyên ngoài — file phải tự chứa, mở offline được');
// Skill nói "không icon" — emoji là icon trá hình. Cảnh báo chứ không chặn: đôi khi emoji nằm
// trong DỮ LIỆU MẪU hợp lệ (tên file, nội dung tin nhắn người dùng gõ).
// Mũi tên (U+2190–21FF) KHÔNG tính: bảng chú giải chép nguyên srs ("Bước 1 → Bước 2") — dự án TTS 05/10/2026 agent
// phải viết `&#8594;` để né một cảnh báo oan.
{
  const emoji = [...new Set((html.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []))];
  if (emoji.length) warn(`có emoji ${emoji.join(' ')} — bậc lo-fi cố ý bỏ icon; dùng chữ ("TB", "Ảnh") để người xem không bàn hình dáng`);
}

const out = { wireframe: path.relative(process.cwd(), wfPath), mànDựng: Object.keys(wf).length,
  mànCóBảng: Object.values(mànDoc).filter(Boolean).length,
  khối: Object.values(wf).reduce((s, a) => s + a.length, 0), lỗi: E, cảnhBáo: W };
if (JSON_MODE) { console.log(JSON.stringify(out, null, 2)); process.exit(errors); }
console.log(`\n=== Soát wireframe lo-fi ===`);
console.log(`   ${out.mànDựng} màn dựng / ${out.mànCóBảng} màn có bảng phần tử · ${out.khối} khối đánh số`);
E.forEach(m => console.log(`  ❌ ${m}`));
W.forEach(m => console.log(`  ⚠️  ${m}`));
if (!errors && !warns) console.log('  ✓ Khối khớp bảng phần tử, đánh số đúng, giữ đúng bậc lo-fi');
console.log(`\n=== ${errors} lỗi · ${warns} cảnh báo ===`);
process.exit(errors);
