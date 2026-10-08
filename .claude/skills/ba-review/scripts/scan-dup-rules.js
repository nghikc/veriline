#!/usr/bin/env node
/*
 * ba-review/scan-dup-rules.js — luật nghiệp vụ nào đang bị PHÁT BIỂU LẠI ở nhiều màn?
 *
 * Vì sao tồn tại: `BRule-S..` là luật CỦA MỘT MÀN. Nhưng một số luật thật ra là luật của cả dự án
 * — "email là định danh, không sửa được", "access token 8 giờ", "chỉ Org Admin đổi vai trò" — và
 * chúng bị chép lại vào từng màn cần tới. Chép lại thì mỗi bản là một chỗ có thể trôi: sửa TTL
 * token ở `S01` mà quên `S06` thì hai tài liệu cùng đúng cú pháp, cùng qua `ba-review`, cùng qua
 * `ba-trace`, và mâu thuẫn nhau. Không cổng nào hiện có bắt được — chúng đo ĐỘ PHỦ (có/không),
 * không đo TRÙNG LẶP.
 *
 * ─── Cách so, và vì sao KHÔNG so bằng ngôn ngữ ─────────────────────────────────────────────
 * Bản đầu gom theo TỪ trong thân luật. Đo trên dự án mẫu: 51/51 chủ đề đều "nằm ở >=3 màn" —
 * tức tín hiệu bằng 0. Nguyên nhân: tiếng Việt đa âm tiết, tách theo khoảng trắng thì "công",
 * "thành", "định" thành "từ khoá", và mọi luật đều dính mọi luật. Chuyển sang cụm 2 âm tiết vẫn
 * còn 105 chủ đề rác ("hiện tại", "duy nhất", "tài khoản").
 *
 * Cái chạy được là thứ GIỐNG HỆT NHAU Ở CẢ HAI BÊN, không cần dịch: mã yêu cầu được TRÍCH DẪN
 * trong thân luật (FR-13, CR-04, F13) và định danh/hằng trong backtick (PERM_LOCKED,
 * phai_doi_mat_khau). Cùng bài học `ba-reverse/scan-decisions.js` đã trả giá để rút ra, theo
 * chiều ngược lại: ở đó khớp theo TÊN ĐỊNH DANH là sai vì tài liệu viết bằng ngôn ngữ nghiệp vụ;
 * ở đây khớp theo NGÔN NGỮ là sai vì cả hai bên đều là văn xuôi. Chọn mặt phẳng chung, không đoán.
 *
 * Script này ĐẾM, không phán: nó không biết hai luật cùng trích `FR-13` là MÂU THUẪN hay chỉ là
 * nhắc lại hợp lệ. Đó là việc của `ba-review` (và `ba-consistency-reviewer` khi cần).
 *
 * Dùng:  node .claude/skills/ba-review/scripts/scan-dup-rules.js [docsDir=docs] [--plain] [--min 2]
 * Exit 0 luôn — đây là phép đo cho gate đọc, không phải gate.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const PLAIN = argv.includes('--plain');
const iMin = argv.indexOf('--min');
const MIN = iMin >= 0 && argv[iMin + 1] ? parseInt(argv[iMin + 1], 10) : 2;
const DOCS = path.resolve(argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--min')[0] || 'docs');

const luật = [];
(function đi(d) {
  let ents = [];
  try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'removed') đi(p); continue; }
    if (e.name !== 'srs.md') continue;
    const màn = (p.match(/\bS\d{2}\b/) || ['?'])[0];
    for (const l of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = l.match(/^\|\s*\*{0,2}(BRule-S\d+-\d+)\*{0,2}\s*\|([^|]*)\|/);
      if (m) luật.push({ id: m[1], màn, text: m[2].replace(/\*/g, '').trim() });
    }
  }
})(DOCS);

const mãTrích = (t) => t.match(/\b(?:BR|StR|FR|NFR|CR|WI|F)-?\d{1,3}\b/g) || [];
// Đường dẫn tài liệu không phải luật: `02-functions.md` chỉ là chỗ trích nguồn — hai luật cùng
// trích một file không có nghĩa chúng nói cùng một điều.
const địnhDanh = (t) => (t.match(/`[^`\n]+`/g) || []).map((s) => s.replace(/`/g, '').trim())
  .filter((s) => s.length > 3 && !/\.(md|html|ts|js)$/i.test(s) && !/^\d+$/.test(s));

const cụm = new Map();
for (const r of luật) {
  for (const k of new Set([...mãTrích(r.text), ...địnhDanh(r.text)])) {
    if (!cụm.has(k)) cụm.set(k, []);
    cụm.get(k).push(r);
  }
}

// Gộp trùng: cùng MỘT tập luật thì là MỘT phát hiện. `https://` / `http://` / `data:` cùng nằm
// trong đúng một cặp luật → ba dòng cho một sự việc. Không gộp thì báo cáo phồng lên và người đọc
// học cách bấm qua nó (bài học báo cáo 86 dòng của ba-feasible).
const theoTập = new Map();
for (const [k, rs] of cụm) {
  const ids = [...new Set(rs.map((r) => r.id))].sort();
  const màns = [...new Set(rs.map((r) => r.màn))].sort();
  if (màns.length < MIN) continue;
  const khoá = ids.join('|');
  if (!theoTập.has(khoá)) theoTập.set(khoá, { ids, màn: màns, mốc: [], mẫu: rs[0].text });
  theoTập.get(khoá).mốc.push(k);
}
const phátHiện = [...theoTập.values()].sort((a, b) => b.màn.length - a.màn.length || b.ids.length - a.ids.length);

const gioiHan = [
  'chỉ khớp theo mã yêu cầu được TRÍCH DẪN và định danh trong backtick — luật phát biểu lại bằng lời thuần (không trích mã, không định danh) thì script này KHÔNG thấy',
  'không phán MÂU THUẪN: hai luật cùng trích một mã có thể chỉ là nhắc lại hợp lệ. Đọc nghĩa là việc của ba-review / ba-consistency-reviewer',
  'chỉ đọc srs.md của các màn; luật nằm trong 01-requirements.md hay tài liệu cấp tổng không tính',
];

const out = { docs: DOCS, sốLuật: luật.length, sốMàn: new Set(luật.map((r) => r.màn)).size, min: MIN, phátHiện, gioiHan };
// Không `process.exit` ngay sau console.log: stdout là pipe thì Node ghi bất đồng bộ, JSON > 64 KB bị cắt (dự án desktop
// 1125 BRule → scan-dup-code.js nhận JSON cụt, im lặng coi như "không đọc được"). Exit 0 tự nhiên.
if (!PLAIN) process.stdout.write(JSON.stringify(out, null, 2) + '\n');
else inBảng();
function inBảng() {
console.log(`\n${luật.length} BRule / ${out.sốMàn} màn · ${phátHiện.length} luật được phát biểu lại ở >=${MIN} màn\n`);
if (!phátHiện.length) console.log('  (không thấy — hoặc dự án không lặp luật, hoặc luật lặp không trích mã nào)');
for (const p of phátHiện) {
  console.log(`  ${p.màn.length} màn (${p.màn.join(', ')}) · mốc chung: ${p.mốc.map((m) => '`' + m + '`').join(' ')}`);
  console.log(`      ${p.ids.join(' · ')}`);
  console.log(`      ${p.mẫu.slice(0, 120)}${p.mẫu.length > 120 ? '…' : ''}\n`);
}
console.log(`Giới hạn:\n${gioiHan.map((g) => '  · ' + g).join('\n')}`);
}
