#!/usr/bin/env node
/*
 * ba-api-test/check-http.js — soát file ca kiểm thử API (zero-dependency).
 *
 * Soi ba thứ script làm được, agent khỏi phải tự nhớ:
 *   1. Độ phủ: mọi ACL trong checklist có ≥1 ATC phủ (thiếu = hụt độ phủ, ĐO ĐƯỢC).
 *   2. Truy vết: mọi ATC dẫn về một ACL có thật; không trùng mã.
 *   3. Bí mật: file .http ĐƯỢC COMMIT, nên token/mật khẩu viết cứng ở đây là lộ vào lịch sử git.
 *
 * Dùng:  node .claude/skills/ba-api-test/scripts/check-http.js [docsDir=docs] [--json]
 * Exit code = số lỗi (0 = sạch).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { resolveDoc } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));

const argv = process.argv.slice(2).filter(a => !a.startsWith('--'));
const JSON_MODE = process.argv.includes('--json');
const DOCS = path.resolve(argv[0] || 'docs');

const dir = resolveDoc(DOCS, 'api-test');
const clPath = dir && path.join(dir, 'checklist.md');
const httpPath = dir && path.join(dir, 'api.http');
if (!clPath || !fs.existsSync(clPath)) { console.error('Không thấy api-test/checklist.md — chạy `/ba-api-test checklist` (GĐ1) trước.'); process.exit(2); }
if (!fs.existsSync(httpPath)) { console.error('Không thấy api-test/api.http — chạy /ba-api-test trước.'); process.exit(2); }

const cl = fs.readFileSync(clPath, 'utf8');
const http = fs.readFileSync(httpPath, 'utf8');
let errors = 0, warns = 0; const E = [], W = [];
const fail = m => { E.push(m); errors++; };
const warn = m => { W.push(m); warns++; };

// ACL khai trong checklist (cột đầu bảng) — bỏ dòng "—" (nhóm không áp dụng)
const acls = [...new Set([...cl.matchAll(/^\|\s*(ACL-\d+)\s*\|/gm)].map(m => m[1]))];
// ATC + ACL nó phủ, lấy từ tiêu đề khối `### ATC-.. · ... (ACL-..)`
const blocks = [...http.matchAll(/^###\s+(ATC-\d+)\s*(?:·|-|—)?\s*([^\n]*)$/gm)]
  .map(m => ({ atc: m[1], tiêuĐề: m[2].trim(), phủ: [...new Set((m[2].match(/ACL-\d+/g) || []))] }));

const seen = new Set();
for (const b of blocks) {
  if (seen.has(b.atc)) fail(`${b.atc} bị khai TRÙNG mã`); else seen.add(b.atc);
  if (!b.phủ.length) fail(`${b.atc} không ghi ACL nào trong tiêu đề — ca không có gốc`);
  for (const a of b.phủ) if (!acls.includes(a)) fail(`${b.atc} trace tới ${a} KHÔNG có trong checklist`);
}
const phủHết = new Set(blocks.flatMap(b => b.phủ));
const hụt = acls.filter(a => !phủHết.has(a));
for (const a of hụt) fail(`${a} trong checklist CHƯA có ca ATC nào phủ`);

// Bí mật viết cứng — file này được commit
const BÍ_MẬT = [
  [/Authorization:\s*Bearer\s+[A-Za-z0-9._-]{20,}/g, 'token Bearer viết cứng'],
  [/"password"\s*:\s*"(?!\{\{)[^"]{6,}"/g, 'mật khẩu viết cứng trong body'],
  [/\b(sk|pk|api[_-]?key)[_-][A-Za-z0-9]{16,}\b/gi, 'khoá API viết cứng'],
];
for (const [re, nhãn] of BÍ_MẬT) {
  for (const m of http.matchAll(re)) {
    const dòng = http.slice(0, m.index).split('\n').length;
    fail(`api.http:${dòng} — ${nhãn}. File này ĐƯỢC COMMIT: dùng biến {{...}} và điền lúc chạy`);
  }
}
// Host cứng
for (const m of http.matchAll(/^(?:GET|POST|PUT|PATCH|DELETE)\s+(https?:\/\/[^\s{]+)/gm)) {
  const dòng = http.slice(0, m.index).split('\n').length;
  warn(`api.http:${dòng} — URL cứng "${m[1]}", nên dùng {{baseUrl}} để đổi môi trường`);
}
if (!/^@baseUrl\s*=/m.test(http)) warn('thiếu biến @baseUrl ở đầu file');
const môPhỏng = blocks.filter(b => /MÔ PHỎNG/i.test(http.slice(http.indexOf(b.atc), http.indexOf(b.atc) + 400))).length;

const out = { checklist: path.relative(process.cwd(), clPath), http: path.relative(process.cwd(), httpPath),
  tổngACL: acls.length, tổngATC: blocks.length, ACLChưaPhủ: hụt, môPhỏng, lỗi: E, cảnhBáo: W };
if (JSON_MODE) { console.log(JSON.stringify(out, null, 2)); process.exit(errors); }
console.log(`\n=== Soát ca kiểm thử API ===`);
console.log(`   ${blocks.length} ca ATC phủ ${acls.length - hụt.length}/${acls.length} mục ACL${môPhỏng ? ` · ${môPhỏng} ca mô phỏng` : ''}`);
E.forEach(m => console.log(`  ❌ ${m}`));
W.forEach(m => console.log(`  ⚠️  ${m}`));
if (!errors && !warns) console.log('  ✓ Phủ đủ checklist, truy vết đúng, không lộ bí mật');
console.log(`\n=== ${errors} lỗi · ${warns} cảnh báo ===`);
process.exit(errors);
