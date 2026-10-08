#!/usr/bin/env node
/*
 * ac-verify/ve.js — TÁCH "Kết quả mong đợi" của mỗi TC thành các VẾ, để verifier chấm từng vế thay vì "test có chạy".
 * Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ac-verify/scripts/ve.js <docs> --screen <Mã> [--tc TC-S12-46] [--min 2] [--plain|--json]
 *
 * Một vế = một điều phải có assert riêng. Tách theo: ` và `, ` ; `, `<br>`, dấu chấm giữa câu, và vế phủ định
 * `**không** …`/`không …` đứng sau dấu phẩy. Kết quả: TC → [vế…], số vế. `--min 2` (mặc định) chỉ in TC nhiều vế —
 * đó là chỗ verifier hay chấm hụt (S12 17/09: 40 case "đạt" theo verifier mà eval thấy chỉ có bằng chứng tĩnh;
 * TC-S12-16/34/35/55 mỗi cái 2–3 vế, test chỉ assert vế đầu).
 *
 * Đây là công cụ ĐẾM cho agent, không phải cổng: vế do máy tách có thể thừa/thiếu — verifier đối chiếu rồi ghi
 * "Vế thiếu" theo mẫu verification-template.md; validate-done.js soát mục đó, không soát output này.
 *
 * Nhãn vế (24/09, đợt 5 gói 1a — spec-driven-eval "mock-only exclusion"): `gọi-ngoài` khi vế chính là mệnh đề "gọi/gửi tới
 * API · endpoint · webhook · hệ ngoài · SMS/email/OTP" (kể cả phủ định "không gọi API") — spy/mock `toHaveBeenCalled*` là
 * bằng chứng ĐÚNG cho vế này; mọi vế khác `kết-quả` — assert chỉ trên mock (`expect(repo.save).toHaveBeenCalled()`) chứng
 * minh một lời gọi, không chứng minh trạng thái → verifier ghi `thiếu-test` (ac-verifier bước 3). --json thêm `loạiVế`
 * song song `vế`; bản thường đánh dấu `[gọi-ngoài]`.
 *
 * gioiHan: tách theo dấu câu/từ nối, không hiểu ngữ nghĩa; câu viết một hơi không dấu → 1 vế (chấm như cũ). Nhãn
 * gọi-ngoài là từ khoá, không hiểu ngữ nghĩa — "API trả 200" là kết-quả dù nhắc API; verifier là người phán cuối.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const pos = argv.filter((a, i) => !a.startsWith('--') && !(argv[i - 1] || '').startsWith('--'));
const opt = (k, d = null) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const DOCS = path.resolve(pos[0] || 'docs');
const SCREEN = opt('--screen'), TC = opt('--tc'), MIN = +opt('--min', 2), JSON_MODE = argv.includes('--json');
if (!SCREEN && !TC) { console.error('Dùng: ve.js <docs> --screen <Mã> [--tc TC-…] [--min 2]'); process.exit(2); }
const màn = SCREEN || (TC.match(/^TC-(S\d+)-/) || [])[1];

const gom = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/^(removed|node_modules)$/.test(e.name)) gom(p, out); } else if (e.name === 'test.md') out.push(p); } return out; };
const bỏMd = (s) => s.replace(/\*\*/g, '').replace(/`/g, '').trim();
// Tách vế: giữ nguyên thứ tự; bỏ vế rỗng/quá ngắn (< 4 ký tự)
const táchVế = (mong) => bỏMd(mong)
  .split(/\s*<br\s*\/?>\s*|\s*;\s*|\s+và\s+(?=\S)|(?<=[^\d])\.\s+(?=[A-ZĐ])|,\s*(?=không\s)/i)
  .map((v) => v.trim().replace(/^[-–•]\s*/, '').replace(/\.$/, ''))
  .filter((v) => v.length >= 4);

// vế mà mệnh đề CHÍNH LÀ lời gọi ra ngoài → mock/spy hợp lệ. Không dùng \b quanh chữ có dấu (JS \b chỉ hiểu ASCII).
const GỌI_NGOÀI = /(gọi|call(?:s|ed)?|invoke)[^;]{0,40}?(API|endpoint|webhook|dịch vụ ngoài|hệ (?:thống )?ngoài|đối tác)|(API|endpoint|webhook)[^;]{0,25}?(được gọi|nhận|called)|request[^;]{0,20}?gửi|gửi[^;]{0,25}?(SMS|email|OTP|webhook|request)/i;
const loạiVế = (v) => (GỌI_NGOÀI.test(v) ? 'gọi-ngoài' : 'kết-quả');
const kq = [];
for (const f of gom(DOCS)) {
  for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = /^\|\s*\**(TC-S\d+-\d+)\**\s*\|/.exec(l); if (!m) continue;
    if (!new RegExp(`^TC-${màn}-`).test(m[1])) continue;
    if (TC && m[1] !== TC) continue;
    const ô = l.replace(/\|\s*$/, '').split('|').map((x) => x.trim());
    const mong = ô[12] || ''; const vế = táchVế(mong);
    kq.push({ tc: m[1], sốVế: vế.length, vế, loạiVế: vế.map(loạiVế), mong: bỏMd(mong).slice(0, 160), file: path.relative(DOCS, f) });
  }
}
const ra = kq.filter((x) => TC || x.sốVế >= MIN);
if (JSON_MODE) { console.log(JSON.stringify({ màn, tổngTC: kq.length, nhiềuVế: kq.filter((x) => x.sốVế >= 2).length, tc: ra }, null, 2)); process.exit(0); }
console.log(`ve ${màn}: ${kq.length} TC · ${kq.filter((x) => x.sốVế >= 2).length} TC có ≥ 2 vế${TC ? '' : ` · in ${ra.length} TC có ≥ ${MIN} vế`}`);
for (const x of ra) { console.log(`  ${x.tc} — ${x.sốVế} vế`); x.vế.forEach((v, i) => console.log(`     ${i + 1}. ${v}${x.loạiVế[i] === 'gọi-ngoài' ? '  [gọi-ngoài — spy/mock được]' : ''}`)); }
process.exit(0);
