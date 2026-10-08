#!/usr/bin/env node
/*
 * ba-dbschema/check-dbml.js — soát schema vật lý so với mô hình nghiệp vụ (zero-dependency).
 *
 * Câu hỏi script trả lời: schema có PHỦ ĐỦ mô hình không, và có bịa thêm gì không.
 * Thiếu bảng/cột thì dev dựng ra một CSDL không đỡ nổi đặc tả; thừa bảng/cột thì có thứ chạy
 * trong DB mà không tài liệu nào mô tả — cả hai đều là drift, và đều ĐẾM ĐƯỢC.
 *
 * Dùng:  node .claude/skills/ba-dbschema/scripts/check-dbml.js [docsDir=docs] [--json]
 * Exit code = số lỗi (0 = sạch).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { resolveDoc } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));
const { execFileSync } = require('child_process');

const argv = process.argv.slice(2).filter(a => !a.startsWith('--'));
const JSON_MODE = process.argv.includes('--json');
const DOCS = path.resolve(argv[0] || 'docs');

const dir = resolveDoc(DOCS, 'dbschema');
const dbml = dir && path.join(dir, 'schema.dbml');
if (!dbml || !fs.existsSync(dbml)) { console.error('Không thấy dbschema/schema.dbml — chạy /ba-dbschema trước.'); process.exit(2); }

let model;
try {
  model = JSON.parse(execFileSync('node', [path.join(__dirname, 'scan-model.js'), DOCS], { encoding: 'utf8', maxBuffer: 1e8 }));
} catch { console.error('Không đọc được 05-data-model.md — chạy /ba-data-model trước.'); process.exit(2); }

const txt = fs.readFileSync(dbml, 'utf8');
let errors = 0, warns = 0; const E = [], W = [];
const fail = m => { E.push(m); errors++; };
const warn = m => { W.push(m); warns++; };

/* Bảng + cột khai trong DBML */
const tables = {};
// Dấu đóng phải ở CỘT 0: `^\s*\}` sẽ khớp nhầm dấu đóng của khối `indexes` lồng bên trong,
// làm thân bảng bị cắt cụt ngay tại đó (đo thật: mọi cột sau `indexes` biến mất khỏi bộ đếm).
for (const m of txt.matchAll(/^[ \t]*Table\s+"?([A-Za-z_][\w]*)"?\s*(?:as\s+\w+\s*)?\{([\s\S]*?)^\}/gm)) {
  // Bỏ khối `indexes { … }` và dòng `Note:` TRƯỚC khi bóc cột — không bỏ thì `indexes` bị đếm
  // thành một cột, và cột trong khối đó bị đếm thành cột của bảng (đo thật: 61/55 cột).
  const thân = m[2].replace(/^\s*indexes\s*\{[\s\S]*?^\s*\}/gm, '').replace(/^\s*Note:.*$/gm, '');
  const cols = [...thân.matchAll(/^\s{2,}"?([A-Za-z_][\w]*)"?\s+[^\s\[/]+/gm)].map(c => c[1]);
  tables[m[1]] = cols;
}
const refs = [...txt.matchAll(/^\s*Ref[^:]*:\s*"?(\w+)"?\.\s*"?(\w+)"?\s*[<>-]+\s*"?(\w+)"?\./gm)]
  .map(m => ({ từ: m[1], cột: m[2], tới: m[3] }));
const enums = [...txt.matchAll(/^\s*Enum\s+"?([\w]+)"?\s*\{/gm)].map(m => m[1]);

/* 1. Phủ đủ mô hình */
for (const e of model.thựcThể) {
  if (!tables[e.tên]) { fail(`thực thể "${e.tên}" trong 05-data-model.md KHÔNG có Table trong schema`); continue; }
  const thiếu = e.thuộcTính.map(a => a.tên).filter(a => !tables[e.tên].includes(a));
  if (thiếu.length) fail(`Table ${e.tên} thiếu cột: ${thiếu.join(', ')}`);
}
/* 2. Không bịa thêm */
const tênMôHình = new Set(model.thựcThể.map(e => e.tên));
for (const t of Object.keys(tables)) if (!tênMôHình.has(t)) warn(`Table "${t}" KHÔNG có trong 05-data-model.md — bảng nối hợp lệ thì ghi rõ, còn không thì mô hình phải bổ sung trước`);
for (const e of model.thựcThể) {
  if (!tables[e.tên]) continue;
  const dư = tables[e.tên].filter(c => !e.thuộcTính.some(a => a.tên === c));
  if (dư.length) warn(`Table ${e.tên} có cột không có trong mô hình: ${dư.join(', ')}`);
}
/* 3. FK và enum */
for (const e of model.thựcThể) for (const a of e.thuộcTính.filter(x => x.fk)) {
  if (!refs.some(r => (r.từ === e.tên && r.cột === a.tên) || (r.tới === e.tên)))
    fail(`FK ${e.tên}.${a.tên} → ${a.fk} chưa khai Ref trong schema`);
}
for (const r of refs) {
  if (!tables[r.từ]) fail(`Ref trỏ từ bảng không tồn tại: ${r.từ}`);
  if (!tables[r.tới]) fail(`Ref trỏ tới bảng không tồn tại: ${r.tới}`);
}
const enumCầnCó = model.thựcThể.flatMap(e => e.thuộcTính.filter(a => a.enum).map(a => `${e.tên}.${a.tên}`));
if (enumCầnCó.length && !enums.length) warn(`mô hình có ${enumCầnCó.length} thuộc tính enum nhưng schema không khai Enum nào (dùng varchar + CHECK thì ghi rõ trong Note)`);
/* 4. Bẫy kiểu dữ liệu — sai ở đây thì phát hiện lúc đã có dữ liệu thật là quá muộn */
for (const m of txt.matchAll(/^\s{2,}"?(\w*(?:tien|gia|amount|price|money|so_tien)\w*)"?\s+(float|double|real)\b/gim))
  fail(`cột tiền "${m[1]}" khai kiểu ${m[2]} — dùng numeric/decimal, float làm tròn sai tiền`);
if (!/timestamptz|timestamp with time zone|datetime/i.test(txt) && model.thựcThể.some(e => e.thuộcTính.some(a => /datetime|thời điểm/i.test(a.kiểu))))
  warn('mô hình có thuộc tính thời gian nhưng schema không thấy kiểu timestamp — kiểm lại múi giờ');

const out = { schema: path.relative(process.cwd(), dbml), bảng: Object.keys(tables).length, thựcThể: model.tổngThựcThể,
  cột: Object.values(tables).reduce((s, c) => s + c.length, 0), thuộcTính: model.tổngThuộcTính,
  ref: refs.length, enum: enums.length, lỗi: E, cảnhBáo: W };
if (JSON_MODE) { console.log(JSON.stringify(out, null, 2)); process.exit(errors); }
console.log(`\n=== Soát schema vật lý ↔ mô hình nghiệp vụ ===`);
console.log(`   ${out.bảng}/${out.thựcThể} bảng · ${out.cột}/${out.thuộcTính} cột · ${refs.length} Ref · ${enums.length} Enum`);
E.forEach(m => console.log(`  ❌ ${m}`));
W.forEach(m => console.log(`  ⚠️  ${m}`));
if (!errors && !warns) console.log('  ✓ Schema phủ đủ mô hình, FK khai đúng, không có cột bịa');
console.log(`\n=== ${errors} lỗi · ${warns} cảnh báo ===`);
process.exit(errors);
