'use strict';
// Comment bản quyền chèn NGAY TRƯỚC mã Mermaid nhúng nguyên văn vào HTML sinh ra (MIT yêu cầu giữ thông báo).
// Phiên bản + dòng Copyright đọc động từ assets/vendor/LICENSE; hỏng thì rơi về hằng số bên dưới.
const fs = require('fs'), path = require('path');
const FALLBACK = '<!-- Mermaid 11.16.0 — MIT License — Copyright (c) 2014 - 2022 Knut Sveidqvist (xem THIRD_PARTY_NOTICES.md của bộ công cụ) -->';
function mermaidNotice() {
  try {
    const t = fs.readFileSync(path.join(__dirname, '..', 'assets', 'vendor', 'LICENSE'), 'utf8');
    const v = (t.match(/Mermaid\s+(\d+\.\d+\.\d+)/) || [])[1];
    const c = (t.match(/^Copyright \(c\)[^\r\n]*/m) || [])[0];
    if (v && c) return `<!-- Mermaid ${v} — MIT License — ${c} (xem THIRD_PARTY_NOTICES.md của bộ công cụ) -->`;
  } catch (e) { /* dùng hằng số */ }
  return FALLBACK;
}
module.exports = { mermaidNotice };
