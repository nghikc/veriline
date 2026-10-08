#!/usr/bin/env node
/*
 * ba-toolkit/thieu.js — TÍNH NĂNG ĐANG TẮT VÌ TÀI LIỆU CŨ THIẾU MỤC. Zero-dependency, CommonJS, CHỈ ĐỌC.
 *
 *   node .claude/skills/ba-toolkit/scripts/thieu.js [docs=docs] [--root <gốc code>] [--json|--plain]
 *   const { quét } = require('<…>/ba-toolkit/scripts/thieu.js');  quét(docsDir, { root }) → { mục, theoKhoá, bỏQua, … }
 *
 * Mỗi mục = `{ pham: 'màn'|'dự án', man?: 'S03', thieu: <khoá>, tat: [<skill/script>…], cach: '<lệnh bổ sung>' }`.
 * Khoá (spec 2026-10-07-w3 §A):
 *   bang-phan-tu     srs có mà không có "Bảng mô tả chi tiết phần tử màn hình" (srs-elements.forScreen === null)
 *   ma-tran-loi      srs có, 0 dòng `| E-S..-nn |` (đúng regex scan-feasible luật 2)
 *   cach-chay        test.md có bảng TC (header ngay trên `|---|`, có cột mã + bước/mong đợi, ≥1 dòng TC) KHÔNG có
 *                    cột `Cách chạy` (cùng mẫu check-tc-layer: `cách chạy` · `cách` · `auto?`) — xét TỪNG bảng: P1 S14
 *                    có 3/16 bảng mang cột, 13 bảng kia check-tc-layer vẫn coi là Manual. JSON: soTC (dòng thiếu) / tongTC
 *   4b / 07          dự án có html-design.html: có 07 mà thiếu mục `#{2,4} 4b` → `4b`; không có 07 → `07`
 *   data-chosen      Ho-so/wireframe.html: section `data-screen` có ≥2 `wf-variant` mà không cái nào `data-chosen`
 *   plan-trace       plan.md có task (khuôn tiêu đề của scan-code) mà task nào đó thiếu `**Trace test:**` hoặc `**Proof:**`
 *   verification-cu  verification.md thiếu `## Vế thiếu` hoặc `## Lỗi gieo`
 * Màn = folder có `srs.md` (mọi hình: `S03 - X`, `S03-X`, `Nhóm/S14-Y`, `Screen-spec/…`), KHÔNG dựa vào tracking;
 * bỏ qua `Ho-so/` ở gốc (màn đã cắt ở `Ho-so/removed/`). `--root`: khoá cach-chay kèm số TC đã có test mang mã.
 * Exit: 0 luôn (kể cả có mục thiếu — dự án cũ không bị chặn, người chốt 07/10) · 2 khi docs không tồn tại.
 *
 * VÌ SAO CÓ (docs/decisions/25 khuyết điểm #3, bản đồ W3 07/10/2026): 11 chỗ tính năng âm thầm giảm giá trị khi tài
 * liệu viết trước khi có quy ước mới — checker IM (không có bảng thì không có gì để đếm) hoặc LỆCH (test.md không có
 * cột Cách chạy → check-tc-layer coi mọi TC là Manual, exit 0 → accept.js cổng 4 và hook S5 xanh giả). Im lặng không
 * phân biệt được "sạch" với "không kiểm"; script này nói thẳng tính năng nào đang tắt, ở màn nào, bổ sung bằng lệnh gì.
 * `ba-next/status.js` require nó (khoá JSON `tínhNăngTắt`).
 *
 * gioiHan: ĐẾM hình, không đọc nghĩa — bảng phần tử có mà rỗng, ma trận lỗi có một dòng giả, cột Cách chạy có mà ô
 * trống đều coi là ĐỦ. Tôn trọng hồ sơ/phạm vi qua profile.js: phạm vi `docs` BỎ `plan-trace`, `verification-cu`,
 * `cach-chay` (mọi thứ chúng tắt đều là phía code: validate-done, check-tc-layer, accept, check-eval); hồ sơ
 * mini/lite không bỏ khoá nào (mini vẫn có srs · html-design · test · plan). `bang-phan-tu` chỉ báo khi màn có
 * html-design.html hoặc có section trong wireframe.html (mọi thứ nó tắt đều đọc từ hai file đó — màn dựng ngược
 * từ code không có html thì chưa mất gì); `4b`/`07` chỉ báo khi dự án có ≥1 html-design.html. `data-chosen` chỉ
 * nhận `<div class="… wf-variant …">` trong `<section data-screen="S..">` (khuôn check-wireframe/figma-sync).
 * plan-trace nhận tiêu đề task `## Task N:` / `### T1.` (khuôn scan-code) — plan không có tiêu đề nhận ra được thì
 * coi như không có task, không báo. Không đọc nội dung Trace/Proof (đúng hay sai là việc của validate-done).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ (lint 43)
const fs = require('fs');
const path = require('path');
const SE = require('./srs-elements.js');
const { resolveDoc, HOSO } = require('./docpath.js');
const { readProfile, readScope } = require('./profile.js');

/** Mỗi khoá: checker/tính năng nó tắt + lệnh bổ sung (`<màn>` thay bằng mã màn). Thứ tự = thứ tự in. */
const KHOÁ = {
  'bang-phan-tu': { tat: ['ba-html-design/check-el', 'ba-html-design/check-wireframe', 'ba-figma-draw/figma-sync', 'data-el của ba-html-design'], cach: 'ba-screen-spec <màn> --bo-sung bang-phan-tu' },
  'ma-tran-loi': { tat: ['ba-feasible/scan-feasible luật 2', 'ba-html-design/check-shell data-trace', 'scan-microcopy', 'ba-trace UE→E-S'], cach: 'ba-screen-spec <màn> --bo-sung ma-tran-loi' },
  'cach-chay': { tat: ['ba-conformance/check-tc-layer', 'ba-accept/accept cổng 4', 'hook S5', 'check-eval 4b'], cach: 'ba-screen-spec <màn> --bo-sung cach-chay' },
  '4b': { tat: ['ba-html-design/check-design (trần mặc định thay §4b)'], cach: 'ba-design-system --reverse-4b' },
  '07': { tat: ['ba-html-design/check-design DS-HEX', 'ba-html-design/check-design ngân sách §4b'], cach: 'ba-design-system' },
  'data-chosen': { tat: ['ba-figma-draw/figma-sync push-lofi', 'gợi ý của ba-next/status', 'nguồn dựng ba-html-design'], cach: 'ba-html-design lofi <màn> (chốt phương án)' },
  'plan-trace': { tat: ['ac-verify/validate-done V9c', 'ac-eval/scan-eval cột Task/Proof'], cach: 'ba-build <màn> (bổ sung Trace/Proof)' },
  'verification-cu': { tat: ['ac-verify/validate-done V7b/c', 'V8a/V9*/V11'], cach: 'ac-verify <màn>' },
};
const BỎ_THEO_DOCS = ['plan-trace', 'verification-cu', 'cach-chay'];

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const SEP_ROW = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const boDam = (x) => x.replace(/\*\*|__|`/g, '').trim();
const ô = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map(boDam);
const CỘT_MÃ = /^(mã( tc)?|id|tc)$/i;
const CỘT_TC = /bước|mong đợi|kỳ vọng|expected|steps/i;
const CỘT_CÁCH = /^cách chạy$|^cách$|^auto\??$/i;
const TIÊU_ĐỀ_TASK = /^#{2,3}\s+(?:[✅⬜🔨⚠️️]+\s*)?(?:Task\s+|T(?=\d))[A-Za-z]?\d+[a-z]?\s*[:.—–-]/imu;

/** Folder màn = folder có srs.md. Không đi vào folder màn con, bỏ `Ho-so/` ở gốc. */
function gomMàn(docs) {
  const ra = [];
  (function đi(d, gốc) {
    let es = []; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      if (!e.isDirectory() || e.name.startsWith('.') || e.name === 'node_modules') continue;
      if (gốc && e.name === HOSO) continue;
      const p = path.join(d, e.name);
      if (fs.existsSync(path.join(p, 'srs.md'))) { const m = e.name.match(/^(S\d+)/); ra.push({ man: m ? m[1] : e.name, dir: p }); }
      else đi(p, false);
    }
  })(docs, true);
  return ra.sort((a, b) => a.man.localeCompare(b.man, 'en', { numeric: true }));
}

/** test.md → { bảngTC, cóCách, sốTC, thiếuCách, mãThiếu[] }: bảng TC = header ngay trên `|---|` có cột mã + bước/mong
 *  đợi và ≥1 dòng TC; `thiếuCách`/`mãThiếu` = dòng TC nằm dưới bảng KHÔNG có cột Cách chạy (check-tc-layer coi là Manual). */
function đọcTest(txt) {
  const ls = txt.split('\n'); const kq = { bảngTC: 0, cóCách: 0, sốTC: 0, thiếuCách: 0, mãThiếu: [] };
  let iMã = -1, cách = false, đếm = 0;
  const đóng = () => { if (iMã >= 0 && đếm) { kq.bảngTC++; if (cách) kq.cóCách++; } };
  for (let k = 0; k < ls.length; k++) {
    const l = ls[k].trim();
    if (!l.startsWith('|')) { if (l) { đóng(); iMã = -1; đếm = 0; } continue; }
    if (SEP_ROW.test(l)) continue;
    const c = ô(l);
    if (ls[k + 1] && SEP_ROW.test(ls[k + 1].trim())) {
      đóng(); đếm = 0;
      const i = c.findIndex((x) => CỘT_MÃ.test(x));
      iMã = (i >= 0 && c.some((x) => CỘT_TC.test(x))) ? i : -1;
      cách = c.some((x) => CỘT_CÁCH.test(x));
      continue;
    }
    if (iMã < 0) continue;
    const m = /^(TC-[A-Za-z]*\d+-\d+)/.exec(c[iMã] || '');
    if (m) { đếm++; kq.sốTC++; if (!cách) { kq.thiếuCách++; kq.mãThiếu.push(m[1]); } }
  }
  đóng();
  return kq;
}

/** wireframe.html → { 'S03': { pa: số wf-variant, chốt: số data-chosen } } (khuôn figma-sync/check-wireframe). */
function đọcWireframe(html) {
  const attr = (tag, a) => { const m = tag.match(new RegExp(`\\s${a}(?:=("([^"]*)"|'([^']*)'))?(?=[\\s>/])`)); return m ? (m[2] ?? m[3] ?? '') : null; };
  const ra = {};
  for (const s of html.matchAll(/<section[^>]*data-screen="(S\d+)"[\s\S]*?<\/section>/g)) {
    const r = (ra[s[1]] = ra[s[1]] || { pa: 0, chốt: 0 });
    for (const t of s[0].matchAll(/<div\b(?:[^>"']|"[^"]*"|'[^']*')*>/g)) {
      if (!/\bwf-variant\b/.test(attr(t[0], 'class') || '')) continue;
      r.pa++; if (attr(t[0], 'data-chosen') !== null) r.chốt++;
    }
  }
  return ra;
}

function quét(docs, opts = {}) {
  const hồSơ = readProfile(docs), phạmVi = readScope(docs);
  const bỏ = new Set(phạmVi === 'docs' ? BỎ_THEO_DOCS : []);
  const mục = [];
  const thêm = (khoá, man, thêmTrường = {}) => {
    if (bỏ.has(khoá)) return;
    const k = KHOÁ[khoá];
    mục.push({ pham: man ? 'màn' : 'dự án', ...(man ? { man } : {}), thieu: khoá, tat: k.tat.slice(), cach: k.cach.replace('<màn>', man || '').replace(/\s+/g, ' ').trim(), ...thêmTrường });
  };
  const màn = gomMàn(docs);
  const wfFile = resolveDoc(docs, 'wireframe.html');
  const wf = wfFile ? đọcWireframe(read(wfFile)) : {};
  let testCode = null;
  if (opts.root) { try { testCode = require('./testcode.js').gomTestCode(path.resolve(opts.root)); } catch { testCode = null; } }

  for (const { man, dir } of màn) {
    const srs = read(path.join(dir, 'srs.md'));
    const cóHtml = fs.existsSync(path.join(dir, 'html-design.html'));
    if (SE.forScreen(dir) === null && (cóHtml || wf[man])) thêm('bang-phan-tu', man);
    if (!/^\|\s*E-S\d+-\d+\s*\|/m.test(srs)) thêm('ma-tran-loi', man);
    const tPath = path.join(dir, 'test.md');
    if (fs.existsSync(tPath)) {
      const t = đọcTest(read(tPath));
      if (t.thiếuCách) {
        const x = { soTC: t.thiếuCách, tongTC: t.sốTC };
        if (testCode) x.coTest = t.mãThiếu.filter((m) => testCode.has(m)).length;
        thêm('cach-chay', man, x);
      }
    }
    const plan = read(path.join(dir, 'plan.md'));
    if (plan) {
      const khối = plan.split(/^(?=#{2,3}\s)/m).filter((b) => TIÊU_ĐỀ_TASK.test(b.split('\n')[0]));
      const thiếu = khối.filter((b) => !/^\*\*Trace test:\*\*/m.test(b) || !/^\*\*Proof:\*\*/m.test(b)).length;
      if (thiếu) thêm('plan-trace', man, { task: khối.length, taskThieu: thiếu });
    }
    const ver = read(path.join(dir, 'verification.md'));
    if (ver) {
      const vắng = ['Vế thiếu', 'Lỗi gieo'].filter((h) => !new RegExp(`^## ${h}`, 'm').test(ver));
      if (vắng.length) thêm('verification-cu', man, { vang: vắng });
    }
  }
  for (const [man, r] of Object.entries(wf)) if (r.pa >= 2 && !r.chốt) thêm('data-chosen', man, { phuongAn: r.pa });

  if (màn.some((m) => fs.existsSync(path.join(m.dir, 'html-design.html')))) {
    const f07 = resolveDoc(docs, '07-design-system.md');
    if (!f07) thêm('07');
    else if (!/^#{2,4}\s*4b\b/im.test(read(f07))) thêm('4b');
  }

  const thứTự = Object.keys(KHOÁ);
  mục.sort((a, b) => thứTự.indexOf(a.thieu) - thứTự.indexOf(b.thieu) || String(a.man || '').localeCompare(String(b.man || ''), 'en', { numeric: true }));
  const theoKhoá = {};
  for (const m of mục) theoKhoá[m.thieu] = (theoKhoá[m.thieu] || 0) + 1;
  return { docs, hồSơ, phạmVi, sốMàn: màn.length, mục, theoKhoá, bỏQua: [...bỏ].map((k) => ({ khoá: k, lýDo: 'phạm vi docs — không có code/plan/verification' })) };
}

/** Gộp theo khoá cho bản chữ/status: [{ khoá, màn: [...], tat, cach }]. */
function gộp(kq) {
  const ra = [];
  for (const k of Object.keys(KHOÁ)) {
    const ms = kq.mục.filter((m) => m.thieu === k);
    if (ms.length) ra.push({ khoá: k, màn: ms.map((m) => m.man).filter(Boolean), tat: KHOÁ[k].tat, cach: KHOÁ[k].cach });
  }
  return ra;
}

module.exports = { quét, gộp, KHOÁ, đọcTest, đọcWireframe, gomMàn };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const iRoot = argv.indexOf('--root');
  const root = iRoot >= 0 ? argv[iRoot + 1] : null;
  if (iRoot >= 0 && (!root || root.startsWith('--'))) { console.error('thieu.js: --root cần đường dẫn'); process.exit(2); }
  const pos = argv.filter((a, i) => !a.startsWith('--') && (iRoot < 0 || i !== iRoot + 1));
  const DOCS = path.resolve(pos[0] || 'docs');
  if (!fs.existsSync(DOCS)) { console.error(`thieu.js: không thấy ${DOCS}`); process.exit(2); }
  const kq = quét(DOCS, { root });
  if (argv.includes('--json')) { console.log(JSON.stringify(kq, null, 2)); process.exit(0); }
  if (argv.includes('--plain')) {
    for (const m of kq.mục) console.log(`${m.thieu}\t${m.man || '(dự án)'}\t${m.cach}`);
    if (!kq.mục.length) console.log(`đủ\t${kq.sốMàn} màn`);
    process.exit(0);
  }
  console.log(`⚙️  Tính năng đang tắt vì thiếu — ${path.relative(process.cwd(), DOCS) || '.'} · ${kq.sốMàn} màn · hồ sơ ${kq.hồSơ} · phạm vi ${kq.phạmVi}`);
  for (const g of gộp(kq)) {
    console.log(`  ⚠️ ${g.khoá}: ${g.màn.length ? g.màn.join(', ') : '(dự án)'} (${g.tat.length} tính năng: ${g.tat.join(' · ')})`);
    console.log(`     → ${g.cach}`);
  }
  for (const m of kq.mục) if (m.thieu === 'cach-chay') console.log(`     ${m.man}: ${m.soTC}/${m.tongTC} TC ở bảng thiếu cột${m.coTest !== undefined ? ` · ${m.coTest} trong số đó đã có test mang mã dưới --root` : ''}`);
  if (!kq.mục.length) console.log('  ✓ không thiếu mục nào trong 8 khoá');
  for (const b of kq.bỏQua) console.log(`  · bỏ ${b.khoá}: ${b.lýDo}`);
  console.log('Chỉ đếm hình (có/không) — mục có mà rỗng vẫn coi là đủ. Exit 0: không chặn dự án cũ.');
  process.exit(0);
}
