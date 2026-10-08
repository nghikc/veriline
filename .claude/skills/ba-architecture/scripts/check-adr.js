#!/usr/bin/env node
/*
 * ba-architecture/check-adr.js — soát CƠ GIỚI từng ADR trong 10-architecture.md (và 11/12 nếu có).
 *
 * Vì sao tồn tại: ba-architecture có "Tiêu chí chất lượng" ở mức TÀI LIỆU (có sơ đồ, có stack, có
 * cấu trúc thư mục) nhưng không có gì kiểm TỪNG ADR. Đối chiếu với create-adr của tech-leads-club
 * (14/09/2026) lộ ra bốn thứ ADR của chính dự án mẫu đang thiếu, và cả bốn đều ĐẾM ĐƯỢC:
 *   · tên là cụm danh từ nêu điều đã chọn (không phải câu hỏi, không phải "Chọn X?")
 *   · ≥2 phương án được cân nhắc, mỗi phương án bị loại có một dòng "vì sao không"
 *   · hệ quả tách TỐT / XẤU và có ít nhất một hệ quả xấu — ADR không có mặt xấu là ADR không ai tin
 *   · trace về ≥1 NFR/ràng buộc, có ngày khi Accepted, Superseded phải trỏ tới ADR có thật
 *
 * Luật đo được thì đừng giao cho trí nhớ (đợt hook 10/09). Script này ĐẾM, không phán: nó không
 * biết quyết định đúng hay sai, chỉ biết ADR có đủ hình để người sau đọc hiểu hay không.
 *
 * Nhận cả KHUÔN CŨ (Context/Options/Decision/Consequences/Trace) lẫn khuôn mới (Bối cảnh/Driver/
 * Phương án/Quyết định/Hệ quả tốt·xấu/Liên kết) — dự án cài trước 14/09 không bị đỏ oan, nhưng
 * "khuôn cũ chưa tách hệ quả xấu" vẫn được nêu là cảnh báo, vì đó chính là lỗ hổng.
 *
 * Dùng:  node .claude/skills/ba-architecture/scripts/check-adr.js [docsDir=docs] [--plain]
 * Exit = số LỖI (cảnh báo không tính).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const PLAIN = argv.includes('--plain');
const DOCS = path.resolve(argv.find((a) => !a.startsWith('--')) || 'docs');

const FILES = ['10-architecture.md', '11-integration.md', '12-api-integration.md'];
const TRẠNG_THÁI = /\b(Draft|Accepted|Superseded|Deprecated)\b/;
const lỗi = [], cảnhBáo = [];
let tổngADR = 0;
const cóADR = new Set();

function tách(text) {
  // ### ADR-NN — Tiêu đề  … tới heading kế tiếp
  const ra = [];
  const re = /^###\s+(ADR-\d+)\s*[—–-]\s*(.+?)\s*$/gm;
  let m; const vị = [];
  while ((m = re.exec(text))) vị.push({ id: m[1], tiêuĐề: m[2], từ: m.index });
  for (let i = 0; i < vị.length; i++) {
    const đến = i + 1 < vị.length ? vị[i + 1].từ : text.length;
    const thân = text.slice(vị[i].từ, đến);
    const hếtMục = thân.search(/\n##\s/);           // đụng "## 12." thì dừng
    ra.push({ ...vị[i], thân: hếtMục > 0 ? thân.slice(0, hếtMục) : thân });
  }
  return ra;
}

const có = (thân, ...nhãn) => nhãn.some((n) => new RegExp(`\\*\\*${n}[^*]*\\*\\*`, 'i').test(thân));
const đoạn = (thân, ...nhãn) => {
  for (const n of nhãn) {
    const m = new RegExp(`\\*\\*${n}[^*]*\\*\\*\\s*:?\\s*([\\s\\S]*?)(?=\\n-\\s*\\*\\*|$)`, 'i').exec(thân);
    if (m) return m[1].trim();
  }
  return '';
};

for (const f of FILES) {
  const p = path.join(DOCS, f);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, 'utf8');
  const ds = tách(text);
  for (const a of ds) cóADR.add(a.id);
  for (const a of ds) {
    tổngADR++;
    const tag = `${f} ${a.id}`;
    // 1. Tiêu đề: cụm danh từ nêu điều đã chọn — không câu hỏi, không placeholder
    if (/\?\s*$/.test(a.tiêuĐề)) lỗi.push(`${tag}: tiêu đề là CÂU HỎI ("${a.tiêuĐề}") — ADR ghi điều ĐÃ CHỌN, không phải điều đang cân nhắc`);
    if (/^<.*>$/.test(a.tiêuĐề) || /^(Chọn|Nên|Có nên)\b/i.test(a.tiêuĐề)) cảnhBáo.push(`${tag}: tiêu đề "${a.tiêuĐề}" — nên là cụm danh từ nêu kết quả ("Stack Next.js + NestJS"), không phải hành động "Chọn …"`);
    // 2. Trạng thái + ngày
    const tt = (TRẠNG_THÁI.exec(a.thân) || [])[1];
    if (!tt) lỗi.push(`${tag}: không có Trạng thái (Draft/Accepted/Superseded/Deprecated)`);
    else if (tt === 'Accepted' && !/\d{4}-\d{2}-\d{2}/.test(a.thân)) lỗi.push(`${tag}: Accepted nhưng không có NGÀY — quyết định không ngày mất bối cảnh rất nhanh`);
    if (tt === 'Superseded') {
      const bởi = /Superseded\s*(?:bởi|by)\s*(ADR-\d+)/i.exec(a.thân);
      if (!bởi) lỗi.push(`${tag}: Superseded mà không ghi "bởi ADR-xx"`);
      else if (!cóADR.has(bởi[1]) && !ds.some((x) => x.id === bởi[1])) lỗi.push(`${tag}: Superseded bởi ${bởi[1]} — ADR đó không tồn tại`);
    }
    // 3. Bối cảnh / Quyết định
    if (!có(a.thân, 'Bối cảnh', 'Context')) lỗi.push(`${tag}: thiếu Bối cảnh`);
    if (!có(a.thân, 'Quyết định', 'Decision')) lỗi.push(`${tag}: thiếu Quyết định`);
    // 4. Phương án ≥2 + vì sao không
    const pa = đoạn(a.thân, 'Phương án', 'Options');
    const sốPA = (pa.match(/\(([A-Z])\)/g) || []).length;
    if (!pa) lỗi.push(`${tag}: thiếu Phương án — quyết định không có phương án thay thế là mô tả, không phải quyết định`);
    else if (sốPA < 2) cảnhBáo.push(`${tag}: chỉ thấy ${sốPA} phương án dạng (A)/(B) — cần ≥2 phương án thật sự đã cân nhắc`);
    if (sốPA >= 2 && !/vì sao không|why not/i.test(a.thân)) cảnhBáo.push(`${tag}: có ${sốPA} phương án nhưng không có dòng "Vì sao không …" cho phương án bị loại — người sau sẽ hỏi lại đúng câu đó`);
    // 5. Hệ quả: tách tốt/xấu, ≥1 xấu
    const xấu = đoạn(a.thân, 'Hệ quả xấu', 'Negative');
    if (có(a.thân, 'Hệ quả xấu', 'Negative')) {
      if (xấu.replace(/[<>—\-\s]/g, '').length < 8) lỗi.push(`${tag}: mục "Hệ quả xấu" trống — ADR không có mặt xấu là ADR không ai tin`);
    } else if (có(a.thân, 'Consequences', 'Hệ quả')) {
      cảnhBáo.push(`${tag}: khuôn cũ — hệ quả gộp một dòng, chưa tách "Hệ quả xấu / phải chấp nhận"`);
    } else lỗi.push(`${tag}: thiếu Hệ quả`);
    // 6. Trace / Driver
    if (!/\b(NFR-\d+|BR-\d+|StR-\d+|Ràng buộc|EXT-\d+)/.test(a.thân)) lỗi.push(`${tag}: không trace về NFR/ràng buộc nào — kiến trúc là hệ quả của yêu cầu chất lượng, không phải sở thích`);
    // 7. Độ dài
    const từ = a.thân.split(/\s+/).length;
    if (từ > 600) cảnhBáo.push(`${tag}: ~${từ} từ — ADR nên ≤ 500 từ; chi tiết dài chuyển sang mục kiến trúc tương ứng rồi trỏ`);
  }
}

const out = { docs: DOCS, tổngADR, lỗi, cảnhBáo,
  gioiHan: ['chỉ soát HÌNH của ADR (đủ mục, đủ phương án, có mặt xấu, có trace) — không biết quyết định đúng hay sai',
            'nhận cả khuôn cũ (Context/Options/…) lẫn khuôn mới; khuôn cũ chưa tách hệ quả xấu chỉ là cảnh báo',
            '"vì sao không" dò theo cụm chữ; viết bằng cách khác thì không thấy'] };
if (!PLAIN) { console.log(JSON.stringify(out, null, 2)); process.exit(lỗi.length); }
console.log(`\nSoát ${tổngADR} ADR — ${lỗi.length} lỗi · ${cảnhBáo.length} cảnh báo`);
for (const l of lỗi) console.log(`  ❌ ${l}`);
for (const c of cảnhBáo) console.log(`  ⚠️  ${c}`);
if (!lỗi.length && !cảnhBáo.length) console.log('  ✅ sạch');
console.log(`\nGiới hạn:\n${out.gioiHan.map((g) => '  · ' + g).join('\n')}`);
process.exit(lỗi.length);
