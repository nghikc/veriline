#!/usr/bin/env node
/*
 * ba-dbschema/scan-model.js — kiểm kê CƠ GIỚI mô hình dữ liệu nghiệp vụ (zero-dependency).
 *
 * Đọc `docs/05-data-model.md` (mục "Từ điển dữ liệu": `### Thực thể: X (Y)` + bảng
 * Thuộc tính|Kiểu|Ràng buộc|Mô tả) rồi bóc ra thực thể · thuộc tính · khoá · FK · enum.
 * Script KHÔNG chọn kiểu DB vật lý, KHÔNG chọn index — đó là phán đoán, việc của skill.
 *
 * Dùng:  node .claude/skills/ba-dbschema/scripts/scan-model.js [docsDir=docs] [--plain]
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { readDoc } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));

const argv = process.argv.slice(2).filter(a => !a.startsWith('--'));
const PLAIN = process.argv.includes('--plain');
const DOCS = path.resolve(argv[0] || 'docs');

const txt = readDoc(DOCS, '05-data-model.md');
if (!txt) { console.error('Không thấy 05-data-model.md — chạy /ba-data-model trước.'); process.exit(2); }

const lines = txt.split('\n');
const heads = [];
lines.forEach((l, i) => {
  const m = l.match(/^###\s+Thực thể:\s*(\S+)\s*(?:\(([^)]+)\))?/);
  if (m) heads.push({ i, tên: m[1], tênEN: (m[2] || '').trim() });
});

const ents = heads.map((h, k) => {
  // Thân thực thể dừng ở HEADING KẾ TIẾP bất kỳ (## hoặc ###), không phải ở `### Thực thể` kế.
  // Không chặn thì thực thể CUỐI nuốt trọn phần còn lại của file — đo thật trên dự án mẫu:
  // PhienDangNhap ăn luôn bảng "## Thuật ngữ", thành 31 thuộc tính thay vì 9.
  let hết = k + 1 < heads.length ? heads[k + 1].i : lines.length;
  for (let j = h.i + 1; j < hết; j++) if (/^#{2,3}\s/.test(lines[j])) { hết = j; break; }
  const body = lines.slice(h.i + 1, hết);
  const rows = body.filter(l => /^\|/.test(l) && !/^\|\s*-+/.test(l) && !/Thuộc tính/.test(l));
  const attrs = rows.map(l => {
    const c = l.split('|').map(s => s.trim()); c.shift();
    const [tên, kiểu, ràngBuộc = '', mô = ''] = c;
    const fk = (ràngBuộc.match(/FK\s*(?:→|->)\s*(\w+)/) || [])[1];
    const enumVals = /enum/i.test(kiểu)
      ? (ràngBuộc.match(/([A-Z_]{2,}(?:\s*,\s*[A-Z_]{2,})+)/) || [])[1]
      : undefined;
    return {
      tên, kiểu, ràngBuộc, môTả: mô,
      pk: /\bPK\b/i.test(ràngBuộc), fk,
      duyNhất: /duy nhất|unique/i.test(ràngBuộc),
      bắtBuộc: /bắt buộc|not null/i.test(ràngBuộc),
      enum: enumVals ? enumVals.split(/\s*,\s*/) : undefined,
    };
  }).filter(a => a.tên && a.kiểu);
  return { tên: h.tên, tênEN: h.tênEN, thuộcTính: attrs };
});

const tênThựcThể = new Set(ents.map(e => e.tên));
const c = {
  khôngCóPK: ents.filter(e => !e.thuộcTính.some(a => a.pk)).map(e => e.tên),
  fkTrỏTớiThựcThểLạ: ents.flatMap(e => e.thuộcTính.filter(a => a.fk && !tênThựcThể.has(a.fk)).map(a => `${e.tên}.${a.tên} → ${a.fk}`)),
  enumKhôngLiệtKêGiáTrị: ents.flatMap(e => e.thuộcTính.filter(a => /enum/i.test(a.kiểu) && !a.enum).map(a => `${e.tên}.${a.tên}`)),
  thuộcTínhKhôngRõRàngBuộc: ents.flatMap(e => e.thuộcTính.filter(a => !a.ràngBuộc).map(a => `${e.tên}.${a.tên}`)),
};

const out = { docs: path.relative(process.cwd(), DOCS), tổngThựcThể: ents.length,
  tổngThuộcTính: ents.reduce((s, e) => s + e.thuộcTính.length, 0), cảnhBáo: c, thựcThể: ents };

if (!PLAIN) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log(`\n=== Kiểm kê mô hình dữ liệu (${out.docs}) ===`);
console.log(`   ${ents.length} thực thể · ${out.tổngThuộcTính} thuộc tính`);
for (const e of ents) {
  const pk = e.thuộcTính.filter(a => a.pk).map(a => a.tên).join(',') || '—';
  const fk = e.thuộcTính.filter(a => a.fk).length;
  const en = e.thuộcTính.filter(a => a.enum).length;
  console.log(`   ${e.tên.padEnd(18)} ${String(e.thuộcTính.length).padStart(2)} thuộc tính · PK ${pk.padEnd(4)} · ${fk} FK · ${en} enum`);
}
for (const [k, v] of Object.entries(c)) if (v.length) console.log(`\n  ⚠️  ${k}: ${v.length}\n     ${v.join('\n     ')}`);
