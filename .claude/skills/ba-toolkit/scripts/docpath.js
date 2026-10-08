'use strict';
/*
 * ba-toolkit/docpath.js — phân giải đường dẫn tài liệu cấp dự án, dùng chung cho mọi script.
 * Zero-dependency, CommonJS. KHÔNG phải script chạy được — là module `require` từ script khác.
 *
 * VÌ SAO: từ 13/08/2026, các tài liệu KHÔNG thuộc đặc tả chính chuyển vào `docs/Ho-so/`
 * (vision, personas, process, urd, brainstorm, intake, glossary, stakeholders, roadmap, uat,
 * traceability, gaps, introduction, sitemap*, portal.html, userguide/, releases/, meetings/,
 * dev-notes, conformance). Nhưng **dự án cài toolkit trước mốc đó vẫn để chúng ở gốc `docs/`**,
 * và người dùng có quyền không di chuyển. Script hardcode một trong hai chỗ là hỏng một nửa
 * số dự án — nên mọi script phải hỏi qua module này.
 *
 * Cùng triết lý với container `Screen-spec/`: bố cục mới là MẶC ĐỊNH, bố cục cũ vẫn chạy.
 * Thứ tự tìm: `docs/Ho-so/<tên>` → `docs/<tên>`. Tìm thấy ở đâu dùng ở đó.
 */
const fs = require('fs');
const path = require('path');

/** Tên thư mục chứa tài liệu bổ trợ. Đổi ở ĐÚNG MỘT chỗ này. */
const HOSO = 'Ho-so';

/**
 * Trả đường dẫn thật của một tài liệu cấp dự án, hoặc null nếu không có ở cả hai chỗ.
 * @param {string} docsDir thư mục docs/ (tuyệt đối hoặc tương đối)
 * @param {string} name tên file, vd '08-roadmap.md' hoặc thư mục 'releases'
 */
function resolveDoc(docsDir, name) {
  const inHoSo = path.join(docsDir, HOSO, name);
  if (fs.existsSync(inHoSo)) return inHoSo;
  const atRoot = path.join(docsDir, name);
  if (fs.existsSync(atRoot)) return atRoot;
  return null;
}

/** Có tài liệu này không (ở bất kỳ bố cục nào). */
const hasDoc = (docsDir, name) => resolveDoc(docsDir, name) !== null;

/** Đọc nội dung, không có thì trả chuỗi rỗng (mọi script đang dùng quy ước này). */
function readDoc(docsDir, name) {
  const p = resolveDoc(docsDir, name);
  if (!p) return '';
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

/**
 * Nơi NÊN ghi một tài liệu bổ trợ mới: `docs/Ho-so/<tên>`.
 * Nhưng nếu file đã tồn tại ở gốc (bố cục cũ) thì GHI ĐÈ TẠI CHỖ — không tự di chuyển tài
 * liệu của người ta khi họ chỉ định cập nhật nội dung. Di chuyển là quyết định của người dùng.
 */
function writePathFor(docsDir, name) {
  const existing = resolveDoc(docsDir, name);
  if (existing) return existing;
  return path.join(docsDir, HOSO, name);
}

/** Bố cục hiện tại của dự án — để script báo cho người dùng biết nó đang nhìn thấy gì. */
function layout(docsDir) {
  const hoso = fs.existsSync(path.join(docsDir, HOSO));
  return { hoso, moTa: hoso ? `có ${HOSO}/` : 'bố cục phẳng (trước 13/08/2026)' };
}

module.exports = { HOSO, resolveDoc, hasDoc, readDoc, writePathFor, layout };
