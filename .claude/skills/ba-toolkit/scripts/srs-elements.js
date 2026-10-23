/*
 * ba-toolkit/srs-elements.js — đọc "Bảng mô tả chi tiết phần tử màn hình" của srs.md (module dùng chung, zero-dep, CommonJS).
 *
 *   const SE = require('<…>/ba-toolkit/scripts/srs-elements.js');
 *   SE.parse(srsText)      → null (srs không có tiêu đề bảng) | [{ n, ten, loai }]
 *   SE.forScreen(dir)      → undefined (folder không có srs.md) | null | [{ n, ten, loai }]
 *   SE.scanDocs(docsDir)   → { 'S01': [...] | null, … } — mọi folder `S.. - Tên` (lồng nhóm bao nhiêu cũng được)
 *   SE.parseFull(srsText)  → null | [{ n, ten, loai, kieu, batBuoc, moTa, trace: ['R-S01-02', …] }] — cùng các dòng như
 *                            parse(), thêm cột theo TÊN tiêu đề (Data Type · Bắt buộc · Mô tả · Trace); thiếu cột → ''/[].
 *                            Dùng cho khung Spec của canvas (`screen-spec.js`). parse() giữ nguyên hành vi cũ.
 *
 * Người dùng: `ba-html-design/check-wireframe.js` (khối wireframe ↔ bảng) và `ba-html-design/check-el.js` (`data-el`
 * trên html-design ↔ bảng). Tách ra (spec 2026-10-05 §1) để HAI checker đọc cùng một bảng theo cùng một cách — số `#` trên
 * wireframe và trên html-design phải là một bộ.
 *
 * Hình bảng: hồ sơ `full` để bảng ở mục `## Bảng mô tả…`; hồ sơ `mini` có thể lồng `### Bảng mô tả…` trong mục "Giao
 * diện" — cả hai cùng đọc: lấy đoạn từ tiêu đề tới `\n## ` kế tiếp, mỗi dòng bảng bắt đầu `| <số> | <tên> |` là một phần
 * tử; `loai` = ô thứ ba (Control type), rỗng nếu bảng không có cột đó.
 *
 * gioiHan: chỉ nhận cột `#` là SỐ nguyên (`3a`, `3.1` không nhận); một bảng khác có cột đầu là số nằm sau bảng phần tử
 * mà TRƯỚC `## ` kế (vd `### Luồng` dạng bảng đánh số trong hồ sơ mini) sẽ bị đọc lẫn — hình đó chưa gặp, giữ y hành vi
 * cũ của check-wireframe. Folder màn nhận theo tên `S<số> - …`; folder không khớp thì đi sâu tiếp, không đi vào folder
 * màn con.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const TIÊU_ĐỀ = 'Bảng mô tả chi tiết phần tử màn hình';

function parse(txt) {
  if (!String(txt).includes(TIÊU_ĐỀ)) return null;
  const blk = txt.split(TIÊU_ĐỀ)[1].split('\n## ')[0];
  return [...blk.matchAll(/^\|\s*(\d+)\s*\|\s*([^|]+)\|([^|\n]*)/gm)].map((r) => ({ n: +r[1], ten: r[2].trim(), loai: (r[3] || '').trim() }));
}

const cells = (line) => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
function parseFull(txt) {
  const rows = parse(txt);
  if (!rows) return null;
  const blk = txt.split(TIÊU_ĐỀ)[1].split('\n## ')[0];
  const head = (blk.split('\n').find((l) => /^\s*\|\s*#\s*\|/.test(l)) || '');
  const h = cells(head).map((x) => x.toLowerCase());
  const col = (re) => h.findIndex((x) => re.test(x));
  const iKieu = col(/data\s*type|kiểu dữ liệu/), iBB = col(/bắt buộc/), iMoTa = col(/mô tả/), iTrace = col(/trace|truy vết/);
  const byN = {};
  for (const l of blk.split('\n')) { const m = l.match(/^\|\s*(\d+)\s*\|/); if (m && !byN[m[1]]) byN[m[1]] = cells(l); }
  return rows.map((r) => {
    const c = byN[r.n] || [];
    const get = (i) => (i >= 0 && c[i] !== undefined ? c[i] : '');
    return Object.assign({}, r, { kieu: get(iKieu), batBuoc: get(iBB), moTa: get(iMoTa), trace: [...new Set(get(iTrace).match(/R-S\d+-[A-Z]*\d+/g) || [])] });
  });
}

function forScreen(dir) {
  const srs = path.join(dir, 'srs.md');
  if (!fs.existsSync(srs)) return undefined;
  return parse(fs.readFileSync(srs, 'utf8'));
}

function scanDocs(docs, out = {}) {
  if (!fs.existsSync(docs)) return out;
  for (const e of fs.readdirSync(docs, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = path.join(docs, e.name);
    const m = e.name.match(/^(S\d+) - /);
    if (m) { const t = forScreen(p); if (t !== undefined) out[m[1]] = t; }
    else scanDocs(p, out);
  }
  return out;
}

module.exports = { parse, parseFull, forScreen, scanDocs, TIÊU_ĐỀ };
