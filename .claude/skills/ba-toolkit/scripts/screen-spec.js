/*
 * ba-toolkit/screen-spec.js — gom nội dung "khung Spec" của MỘT màn theo truy vết (module dùng chung, zero-dep, CommonJS).
 *
 *   const SS = require('<…>/ba-toolkit/scripts/screen-spec.js');
 *   SS.forScreen(dir)  → null (folder không có srs.md) | {
 *       mucDich: { hanhVi: [..], userStory: [..], tieuChi: [..] },
 *       phanTu:  [{ n, ten, loai, trace: [R-S..], hanhVi: [..], quyTac: [..], tieuChi: [..] }],
 *       ma:      { 'E-S01-06': 'E-S01-06: Tài khoản bị khoá tạm — …', 'BRule-S01-01': … }  (mô tả theo mã, cho thẻ Trạng thái giao diện)
 *     }
 *
 * Người dùng: `ba-html-design/scripts/canvas.js` (khung Spec cạnh mỗi màn trên canvas). Máy LẤY, không viết lại:
 *   - Mục đích màn · HÀNH VI       = đoạn đầu mục "## Phạm vi màn" của srs.md (cắt gọn)
 *   - Mục đích màn · USER STORY    = tiêu đề `## US-Sxx-..: …` của userstory.md
 *   - Mục đích màn · TIÊU CHÍ      = dòng `GWT-n` của US đầu tiên (thiếu thì gom tiếp từ US sau), tối đa 5
 *   - Phần tử #n · HÀNH VI         = cột Mô tả của "Bảng mô tả chi tiết phần tử màn hình" + Bắt buộc + Data Type
 *   - Phần tử #n · QUY TẮC / LỖI   = dòng bảng "Quy tắc nghiệp vụ" và "Ma trận lỗi" có cột Trace nhắc ĐÚNG mã R-S của phần tử
 *   - Phần tử #n · TIÊU CHÍ        = TC trong test.md có cột Nguồn nhắc đúng mã R-S đó: "TC-.. → kết quả mong đợi"
 * Thiếu nguồn → một dòng nói rõ thiếu ở đâu ("chưa có trong srs", "chưa có TC nào trỏ R-S01-09"…), không bao giờ mảng rỗng.
 *
 * gioiHan: đọc bảng markdown theo TÊN cột (Trace/Nguồn/Kết quả mong đợi); ô có dấu `|` trong backtick sẽ lệch cột.
 * Khớp mã theo ranh giới (`R-S01-1` không khớp `R-S01-10`). Không hiểu dải mã viết gộp (`R-S01-01..03`). Không đọc
 * usecase.md/design-spec.md. Cắt chữ ở ~220 ký tự (thẻ, không phải tài liệu) — đọc đủ ở file nguồn.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const SE = require(path.join(__dirname, 'srs-elements.js'));

const CẮT = 220, TỐI_ĐA = 6;
const read = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };
const sạch = (s) => String(s || '').replace(/<br\s*\/?>/gi, ' ').replace(/\*\*|__|`/g, '').replace(/\*\(([^)]*)\)\*/g, '($1)')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();
const cắt = (s, n = CẮT) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);
const cells = (line) => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nhắc = (text, mã) => new RegExp(`(^|[^\\w-])${esc(mã)}(?![\\w-]*\\d)`).test(text);

function mục(md, tên) { // thân mục `## <tên…>` tới `## ` kế
  const m = md.match(new RegExp(`^##\\s+${esc(tên)}[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'm'));
  return m ? m[1] : null;
}
function bảng(text) { // mọi bảng markdown trong đoạn: [{ head: [..], rows: [[..]] }]
  const out = []; let cur = null;
  for (const l of String(text || '').split('\n')) {
    if (/^\s*\|/.test(l)) {
      if (/^\s*\|[\s:|-]+\|\s*$/.test(l)) continue;
      if (!cur) { cur = { head: cells(l).map((h) => h.toLowerCase()), rows: [] }; out.push(cur); } else cur.rows.push(cells(l));
    } else cur = null;
  }
  return out;
}
const cột = (head, re) => head.findIndex((h) => re.test(h));

function forScreen(dir) {
  const srs = read(path.join(dir, 'srs.md'));
  if (!srs) return null;
  const us = read(path.join(dir, 'userstory.md'));
  const test = read(path.join(dir, 'test.md'));

  // ── Mục đích màn ──
  const pv = mục(srs, 'Phạm vi màn');
  const đoạn = pv ? (pv.split(/\n\s*\n/).map((x) => x.trim()).find((x) => x && !/^\|/.test(x)) || '') : '';
  const hanhVi = đoạn ? [cắt(sạch(đoạn.replace(/^[-*]\s+/gm, '')), 320)] : ['chưa có mục "Phạm vi màn" trong srs'];
  const usTitles = [...us.matchAll(/^##\s+(US-S\d+-\d+)\s*[:—-]\s*(.+)$/gm)].map((m) => `${m[1]} — ${cắt(sạch(m[2]), 140)}`);
  const usBlocks = us.split(/^##\s+(?=US-S\d+-\d+)/m).slice(1);
  const gwt = [];
  for (const b of usBlocks) {
    for (const m of b.matchAll(/^\s*[-*]\s+\*{0,2}(GWT-\d+)\s*:?\*{0,2}\s*:?\s*(.+)$/gm)) if (gwt.length < 5) gwt.push(`${m[1]}: ${cắt(sạch(m[2]), 200)}`);
    if (gwt.length >= 2) break;
  }
  const mucDich = {
    hanhVi,
    userStory: usTitles.length ? usTitles.slice(0, TỐI_ĐA).concat(usTitles.length > TỐI_ĐA ? [`+${usTitles.length - TỐI_ĐA} user story nữa trong userstory.md`] : []) : [us ? 'chưa có US-S.. trong userstory.md' : 'chưa có userstory.md'],
    tieuChi: gwt.length ? gwt : [us ? 'chưa có dòng GWT trong userstory.md' : 'chưa có userstory.md'],
  };

  // ── Quy tắc + lỗi + TC, đánh chỉ mục một lần ──
  const luật = [];
  for (const [tên, kiểu] of [['Quy tắc nghiệp vụ', 'BRule'], ['Ma trận lỗi', 'E']]) {
    for (const t of bảng(mục(srs, tên))) {
      const iMã = cột(t.head, /^mã$/), iTr = cột(t.head, /trace|truy vết/);
      const iNd = kiểu === 'BRule' ? cột(t.head, /quy tắc/) : cột(t.head, /^lỗi$/);
      const iThấy = cột(t.head, /người dùng thấy/);
      if (iMã < 0) continue;
      for (const r of t.rows) {
        const mã = sạch(r[iMã]); if (!mã) continue;
        const nd = sạch(r[iNd] || ''), thấy = iThấy >= 0 ? sạch(r[iThấy] || '') : '';
        luật.push({ mã, trace: iTr >= 0 ? r[iTr] || '' : r.join(' | '), dòng: cắt(`${mã}: ${nd}${thấy ? ' — ' + thấy : ''}`, 200) });
      }
    }
  }
  const tcs = [];
  for (const t of bảng(test)) {
    const iMã = cột(t.head, /^mã tc$/), iNg = cột(t.head, /^nguồn$/), iKq = cột(t.head, /kết quả mong đợi/);
    if (iMã < 0 || iNg < 0) continue;
    for (const r of t.rows) { const mã = sạch(r[iMã]); if (/^TC-/.test(mã)) tcs.push({ nguồn: r[iNg] || '', dòng: cắt(`${mã} → ${sạch(r[iKq] || '') || 'chưa ghi kết quả mong đợi'}`, 200) }); }
  }

  // ── Phần tử ──
  const rows = SE.parseFull(srs);
  const phanTu = (rows || []).map((r) => {
    const hv = [sạch(r.moTa)].filter((x) => x && x !== '—');
    const thêm = [];
    if (/^(có|yes|x|bắt buộc)$/i.test(sạch(r.batBuoc))) thêm.push('Bắt buộc');
    const k = sạch(r.kieu); if (k && k !== '—' && !/^action$/i.test(k)) thêm.push(`Kiểu: ${k}`);
    const hanhVi = hv.length || thêm.length ? [hv.concat(thêm.length ? [thêm.join(' · ')] : []).join(' — ')] : ['chưa có mô tả trong srs'];
    let quyTac, tieuChi;
    if (!r.trace.length) {
      quyTac = ['chưa có mã Trace (R-S..) trong bảng phần tử của srs'];
      tieuChi = ['chưa có mã Trace (R-S..) để nối TC'];
    } else {
      const q = luật.filter((l) => r.trace.some((m) => nhắc(l.trace, m))).map((l) => l.dòng);
      const c = tcs.filter((x) => r.trace.some((m) => nhắc(x.nguồn, m))).map((x) => x.dòng);
      const ds = r.trace.join(', ');
      quyTac = q.length ? q.slice(0, TỐI_ĐA).concat(q.length > TỐI_ĐA ? [`+${q.length - TỐI_ĐA} dòng nữa trong srs`] : []) : [`chưa có quy tắc/lỗi nào trong srs trỏ ${ds}`];
      tieuChi = c.length ? c.slice(0, TỐI_ĐA).concat(c.length > TỐI_ĐA ? [`+${c.length - TỐI_ĐA} TC nữa trong test.md`] : []) : [test ? `chưa có TC nào trong test.md trỏ ${ds}` : 'chưa có test.md'];
    }
    return { n: r.n, ten: r.ten, loai: r.loai, trace: r.trace, hanhVi, quyTac, tieuChi };
  });
  const ma = {}; for (const l of luật) if (!ma[l.mã]) ma[l.mã] = l.dòng;
  return { mucDich, phanTu, coBang: !!rows, ma };
}

module.exports = { forScreen };
