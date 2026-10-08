/*
 * ba-toolkit/srs-elements.js — đọc "Bảng mô tả chi tiết phần tử màn hình" của srs.md (module dùng chung, zero-dep, CommonJS).
 *
 *   const SE = require('<…>/ba-toolkit/scripts/srs-elements.js');
 *   SE.parse(srsText)      → null (srs không có tiêu đề bảng) | [{ n, ten, loai }]
 *   SE.forScreen(dir)      → undefined (folder không có srs.md) | null | [{ n, ten, loai }]
 *   SE.scanDocs(docsDir)   → { 'S01': [...] | null, … } — mọi folder `S.. - Tên` (lồng nhóm bao nhiêu cũng được)
 *
 * Người dùng: `ba-wireframe-lofi/check-wireframe.js` (khối wireframe ↔ bảng) và `ba-html-design/check-el.js` (`data-el`
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

module.exports = { parse, forScreen, scanDocs, TIÊU_ĐỀ };
