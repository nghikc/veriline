#!/usr/bin/env node
/*
 * ba-toolkit/conventions.js — LÁT QUY ƯỚC theo skill: in đúng những mục của conventions.md (+ phụ lục conv-*.md) mà một
 * subagent cần, thay vì nạp cả 114 KB (≈ 30 k token) cho mỗi agent. Zero-dependency.
 *
 *   node .claude/skills/ba-toolkit/scripts/conventions.js slice <skill> [--out <file>] [--plain]   # in lát (markdown)
 *   node .claude/skills/ba-toolkit/scripts/conventions.js list                                     # bảng skill → mục
 *   node .claude/skills/ba-toolkit/scripts/conventions.js check                                    # mọi mục khai ở đây có thật (lint gọi)
 *
 * Bản đồ LÁT khai ở dưới: skill → [file#heading, …] (heading khớp đầu dòng `## `, so sánh không phân biệt hoa/thường,
 * chỉ cần bắt đầu bằng chuỗi khai). Skill không có trong bản đồ → lát mặc định (bố cục + mã + tracking + gate).
 * Không thay conventions.md — nó vẫn là nguồn sự thật; lát chỉ là cách ĐỌC tiết kiệm cho agent ngữ cảnh trống.
 *
 * Vì sao có: 16/09/2026 ba-batch phái 29 subagent × 317 k token cho một dự án video bài giảng; mỗi subagent đọc trọn conventions +
 * 4 phụ lục (114 KB) dù screen-spec chỉ cần ~5 mục. Cùng luật "đọc theo ID" của ac-builder (ba-index) áp cho quy ước.
 *
 * gioiHan: cắt theo heading cấp 2 — mục quá dài vẫn nguyên; không tóm tắt (tóm tắt là chỗ mất luật); mục nào skill
 * cần mà bản đồ thiếu thì agent thiếu luật — bản đồ là canon, lint check soát heading tồn tại, không soát đủ/thiếu.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'references');
const argv = process.argv.slice(2);
const CMD = argv[0];
const opt = (k, d = null) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);

const LÁT = {
  _mặcĐịnh: ['conventions#Cấu trúc thư mục', 'conventions#Đặt tên & cấu trúc nhóm', 'conventions#Ngôn ngữ', 'conventions#Văn phong', 'conventions#Mã định danh', 'conventions#Quy tắc cập nhật tracking', 'conv-gates#Cổng phương án'],
  'ba-screen-spec': ['conventions#Cấu trúc thư mục', 'conventions#Đặt tên & cấu trúc nhóm', 'conventions#Ngôn ngữ', 'conventions#Văn phong', 'conventions#Thuật ngữ (glossary)', 'conventions#Mã định danh', 'conventions#Thuộc tính yêu cầu', 'conventions#Quy tắc cập nhật tracking', 'conventions#Xác nhận giả định', 'conv-mermaid#Bộ chọn sơ đồ', 'conv-mermaid#Sơ đồ Mermaid — an toàn cú pháp', 'conv-gates#Cổng phương án', 'conv-gates#Ngưỡng "màn phức tạp"', 'conv-gates#Hồ sơ dự án'],
  'ba-test': ['conventions#Cấu trúc thư mục', 'conventions#Ngôn ngữ', 'conventions#Văn phong', 'conventions#Mã định danh', 'conventions#Quy tắc cập nhật tracking', 'conventions#Cưỡng chế bằng hook', 'conv-gates#Hồ sơ dự án'],
  'ba-html-design': ['conventions#Cấu trúc thư mục', 'conventions#Ngôn ngữ', 'conventions#Animation chuyển cảnh', 'conventions#Quy tắc cập nhật tracking', 'conv-gates#Hồ sơ dự án'],
  'ba-batch': ['conventions#Cấu trúc thư mục', 'conventions#Ma trận tracking', 'conventions#Quy tắc cập nhật tracking', 'conventions#Thuật ngữ (glossary)', 'conventions#Xác nhận giả định', 'conv-gates#Cổng phương án', 'conv-gates#Hồ sơ dự án', 'conv-gates#Đội agent'],
  'ba-requirements': ['conventions#Cấu trúc thư mục', 'conventions#Ngôn ngữ', 'conventions#Văn phong', 'conventions#Thuật ngữ (glossary)', 'conventions#Mã định danh', 'conventions#Thuộc tính yêu cầu', 'conventions#Xác nhận giả định', 'conv-mermaid#Bộ chọn sơ đồ', 'conv-mermaid#Sơ đồ Mermaid — an toàn cú pháp', 'conv-gates#Cổng phương án'],
  'ba-review': ['conventions#Mã định danh', 'conventions#Ma trận tracking', 'conv-gates#Quy ước gate', 'conv-gates#Review agent độc lập', 'conv-gates#Ngưỡng "màn phức tạp"', 'conv-gates#Hồ sơ dự án', 'conv-mermaid#Kiểm coverage sơ đồ'],
  'ba-change-request': ['conventions#Mã định danh', 'conventions#Change Request (CR)', 'conv-ledgers#Change Request (CR)', 'conv-ledgers#Nhật ký thay đổi', 'conv-gates#Cổng phương án'],
  'ba-task': ['conventions#Change Request (CR)', 'conv-ledgers#Work Item (WI)', 'conv-gates#Hồ sơ dự án'],
  'ba-reverse': ['conventions#Cấu trúc thư mục', 'conventions#Mã định danh', 'conventions#Tài liệu suy luận', 'conventions#Xác nhận giả định', 'conv-ledgers#Sổ quyết định sản phẩm (PD)', 'conv-gates#Cổng phương án'],
  'ac-builder': ['conventions#Cấu trúc thư mục', 'conventions#Mã định danh', 'conv-gates#Đội agent'],
  'ac-verifier': ['conventions#Mã định danh', 'conventions#Cưỡng chế bằng hook', 'conv-gates#Đội agent'],
  'ac-judge': ['conv-gates#Đội agent', 'conv-gates#Quy ước gate'],
};

const đọcMục = (file) => {
  const p = path.join(DIR, file + '.md'); if (!fs.existsSync(p)) return null;
  const lines = fs.readFileSync(p, 'utf8').split('\n'); const mục = []; let cur = null;
  for (const l of lines) { const h = l.match(/^## (.+)$/); if (h) { cur = { tên: h[1].trim(), dòng: [l] }; mục.push(cur); } else if (cur) cur.dòng.push(l); }
  return mục;
};
const tìm = (ref) => { const [file, head] = ref.split('#'); const mục = đọcMục(file); if (!mục) return { ref, lỗi: `không có ${file}.md` }; const m = mục.find((x) => x.tên.toLowerCase().startsWith(head.toLowerCase())); return m ? { ref, file, tên: m.tên, text: m.dòng.join('\n') } : { ref, lỗi: `không thấy mục "## ${head}" trong ${file}.md` }; };

if (CMD === 'list') { for (const [k, v] of Object.entries(LÁT)) console.log(`${k.padEnd(18)} ${v.length} mục · ${v.join(' · ')}`); process.exit(0); }
if (CMD === 'check') {
  const lỗi = []; const tổngKB = (Object.values(LÁT).flat().filter((v, i, a) => a.indexOf(v) === i)).map(tìm);
  for (const t of tổngKB) if (t.lỗi) lỗi.push(t.lỗi);
  if (lỗi.length) { for (const l of lỗi) console.log('  ❌ ' + l); process.exit(1); }
  console.log(`  ✓ ${Object.keys(LÁT).length - 1} lát quy ước, mọi mục khai đều có trong references/`); process.exit(0);
}
const CẢ_BỘ = ['conventions', 'conv-mermaid', 'conv-ledgers', 'conv-gates', 'conv-registry'];   // tên file (không phải chữ in ra)
if (CMD === 'slice') {
  const skill = argv[1]; if (!skill) { console.error('Thiếu tên skill.\nSửa: conventions.js slice <skill> (vd conventions.js slice ba-review).'); process.exit(2); }
  const refs = LÁT[skill] || LÁT._mặcĐịnh; const phần = refs.map(tìm); const thiếu = phần.filter((p) => p.lỗi);
  if (thiếu.length) { for (const t of thiếu) console.error('❌ ' + t.lỗi); process.exit(1); }
  const md = `# Lát quy ước cho \`${skill}\` — ${phần.length} mục từ conventions.md/phụ lục (nguồn sự thật vẫn là file gốc)\n\n> Sinh bởi \`conventions.js slice ${skill}\`. Cần mục khác → \`node .claude/skills/ba-toolkit/scripts/conventions.js list\`.\n\n` + phần.map((p) => p.text.trim()).join('\n\n---\n\n') + '\n';
  const out = opt('--out'); if (out) { fs.writeFileSync(out, md); console.log(`→ ${out} (${(Buffer.byteLength(md) / 1024).toFixed(0)} KB, ${phần.length} mục; cả bộ ${(CẢ_BỘ.reduce((a, f) => a + fs.statSync(path.join(DIR, f + '.md')).size, 0) / 1024).toFixed(0)} KB)`); }
  else process.stdout.write(md);
  process.exit(0);
}
console.error('Dùng: conventions.js slice <skill> [--out f] | list | check'); process.exit(2);
