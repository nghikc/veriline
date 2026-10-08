#!/usr/bin/env node
/*
 * ba-toolkit/collect-reports.js — nơi NHẬN của vòng phản hồi (zero-dependency).
 *
 * `ba-export/report.js` chạy ở dự án tiêu dùng và ghi `.claude/ba-toolkit-report.json` tại đó.
 * Không có nơi nhận thì mỗi báo cáo là một file lẻ ở một máy lạ — tức là vòng phản hồi vẫn
 * hở, chỉ là hở ở đầu kia. Script này kéo báo cáo về repo toolkit, gom vào MỘT file JSONL và
 * tổng hợp thứ toolkit cần biết nhất: file nào bị nhiều dự án cùng sửa tại đích.
 *
 * Ngay ngày đầu (11/09/2026), báo cáo từ dự án desktop chỉ ra 4 file bị vá tại đích — và hai
 * bản vá đó (status.js, refresh.js) lộ hai lỗi thật của toolkit trên dữ liệu không giống dự án
 * mẫu. Đó chính xác là thứ vòng này sinh ra để bắt, và nó bắt được ở lần chạy đầu tiên.
 *
 * Dùng:  node collect-reports.js add <đường-dẫn-report.json> [--label <tên>]
 *        node collect-reports.js summary [--plain]
 * Kho:   reports/ba-toolkit-reports.jsonl (một dòng = một báo cáo; commit được, ẩn danh sẵn).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const KHO = path.join(ROOT, 'reports', 'ba-toolkit-reports.jsonl');
const argv = process.argv.slice(2);
const lệnh = argv[0];
const PLAIN = argv.includes('--plain');
const iL = argv.indexOf('--label');
const LABEL = iL >= 0 ? argv[iL + 1] : null;

// JSONL đọc TỪNG DÒNG (steal B15): `map(JSON.parse)` ném ở dòng hỏng đầu tiên, `catch` ngoài nuốt
// cả kho — một dòng cụt (ghi bị ngắt giữa chừng, hai lần `add` chạy song song) làm mọi báo cáo đã
// gom biến mất mà `summary` vẫn in "0 báo cáo" như thể chưa ai gửi gì. Dòng hỏng thì BỎ và ĐẾM.
let dòngHỏng = 0;
function đọcKho() {
  let thô; try { thô = fs.readFileSync(KHO, 'utf8'); } catch { return []; }
  const ra = []; dòngHỏng = 0;
  for (const l of thô.split('\n')) {
    if (!l.trim()) continue;
    try { ra.push(JSON.parse(l)); } catch { dòngHỏng++; }
  }
  return ra;
}

if (lệnh === 'add') {
  const f = argv[1];
  if (!f) { console.error('Usage: collect-reports.js add <report.json> [--label <tên>]'); process.exit(1); }
  let r;
  try { r = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.error('✖ không đọc được', f, e.message); process.exit(1); }
  // Nhãn là do người gom đặt, KHÔNG lấy từ báo cáo (báo cáo ẩn danh — tên dự án chỉ có khi
  // người gửi cố ý thêm --with-name). Không nhãn → băm ngắn của đường dẫn nguồn để phân biệt.
  r.nhãn = LABEL || (r.dựÁn && r.dựÁn.tên) || require('crypto').createHash('sha1').update(f).digest('hex').slice(0, 8);
  r.gomLúc = new Date().toISOString();
  fs.mkdirSync(path.dirname(KHO), { recursive: true });
  fs.appendFileSync(KHO, JSON.stringify(r) + '\n', 'utf8');
  console.log(`✅ gom báo cáo "${r.nhãn}" (${r.ngày}) → ${path.relative(ROOT, KHO)} · tổng ${đọcKho().length} báo cáo`);
  process.exit(0);
}

if (lệnh === 'summary' || !lệnh) {
  const kho = đọcKho();
  if (dòngHỏng) console.error(`⚠️  ${dòngHỏng} dòng hỏng trong ${path.relative(ROOT, KHO)} — đã bỏ qua, phần còn lại vẫn tính. Sửa tay rồi chạy lại nếu cần con số đủ.`);
  if (!kho.length) { console.log(`(kho rỗng — chưa gom báo cáo nào${dòngHỏng ? `; ${dòngHỏng} dòng hỏng` : ''})`); process.exit(0); }
  // Tín hiệu #1: file toolkit bị sửa tại đích, đếm theo SỐ DỰ ÁN (không phải số lần).
  const sửa = {};
  for (const r of kho) for (const s of r.sửaTạiChỗ || []) (sửa[s.file] = sửa[s.file] || new Set()).add(r.nhãn);
  const bảng = Object.entries(sửa).map(([f, ds]) => ({ file: f, dựÁn: [...ds] })).sort((a, b) => b.dựÁn.length - a.dựÁn.length);
  const out = { sốBáoCáo: kho.length, dựÁn: [...new Set(kho.map((r) => r.nhãn))], sửaTạiChỗ: bảng,
    hồSơ: kho.reduce((a, r) => { a[r.hồSơ || '?'] = (a[r.hồSơ || '?'] || 0) + 1; return a; }, {}),
    gioiHan: ['đếm theo số DỰ ÁN sửa một file, không theo số lần — một dự án sửa 5 lần vẫn là một tiếng nói',
              'không biết bản vá tại đích ĐÚNG hay SAI; chỉ biết mặc định của toolkit không đủ dùng ở đó'] };
  if (!PLAIN) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
  console.log(`\n${kho.length} báo cáo từ ${out.dựÁn.length} dự án (${out.dựÁn.join(', ')}) · hồ sơ ${JSON.stringify(out.hồSơ)}\n`);
  console.log(bảng.length ? 'FILE TOOLKIT BỊ SỬA TẠI ĐÍCH (xếp theo số dự án):' : 'Không dự án nào phải sửa file toolkit.');
  for (const b of bảng) console.log(`  ${String(b.dựÁn.length).padStart(2)} dự án  ${b.file}`);
  console.log(`\nGiới hạn:\n${out.gioiHan.map((g) => '  · ' + g).join('\n')}`);
  process.exit(0);
}
console.error('Usage: collect-reports.js add <report.json> [--label x] | summary [--plain]');
process.exit(1);
