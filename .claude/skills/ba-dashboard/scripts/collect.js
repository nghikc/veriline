#!/usr/bin/env node
/*
 * ba-dashboard/collect.js — gom MỌI SỐ ĐẾM ĐƯỢC cho dashboard điều hành. Zero-dep, CommonJS.
 *
 *   node .claude/skills/ba-dashboard/scripts/collect.js [docsDir=docs] [--plain]
 *
 * VÌ SAO CÓ SCRIPT NÀY (câu 8 của ba-new-skill): toàn bộ phần "bao nhiêu màn xong · bao nhiêu
 * CR mở · phase nào tới lượt · UAT pass mấy ca" là ĐẾM, không phải phán đoán. Để LLM đọc 6 file
 * rồi tự cộng thì vừa chậm, vừa tốn token, vừa sai số. Script trả JSON; LLM chỉ viết phần
 * NHẬN ĐỊNH (rủi ro, việc cần PM xử lý) — thứ script không làm được.
 *
 * KHÔNG phán xét gì. Không tô màu RAG, không tính "health score" — mọi ngưỡng đều là quy ước
 * nghiệp vụ chưa ai chốt; bịa ra ở đây là vi phạm rule cứng của skill.
 * Thiếu nguồn → trả `null` + ghi vào `thieuNguon`, KHÔNG trả 0 (0 và "không biết" khác nhau).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const dp = require('../../ba-toolkit/scripts/docpath.js');
const { readProfile } = require('../../ba-toolkit/scripts/profile.js');

const args = process.argv.slice(2);
const PLAIN = args.includes('--plain');
const DOCS = path.resolve(args.find(a => !a.startsWith('--')) || 'docs');
if (!fs.existsSync(DOCS)) { console.error(`Không thấy docsDir: ${DOCS}`); process.exit(2); }

const read = (n) => dp.readDoc(DOCS, n);
const rows = (txt, re) => txt.split('\n').filter(l => re.test(l));
const thieuNguon = [];
const need = (n) => { const t = read(n); if (!t) thieuNguon.push(n); return t; };

/* ── 1. Màn hình + trạng thái dev (00-tracking.md) ───────────────────────── */
const trk = need('00-tracking.md');
let manHinh = null;
if (trk) {
  const lines = trk.split('\n').filter(l => l.trim().startsWith('|'));
  const head = (lines[0] || '').split('|').slice(1, -1).map(s => s.trim());
  const iDev = head.findIndex(h => /^dev$/i.test(h));
  const iName = head.findIndex(h => /^màn hình$/i.test(h));
  const ds = [];
  for (const l of lines.slice(2)) {
    if (!/S\d{2}/.test(l)) continue;
    const c = l.split('|').slice(1, -1).map(s => s.trim());
    ds.push({
      ma: (l.match(/S\d{2}/) || [])[0],
      ten: iName >= 0 ? c[iName] : '',
      taiLieu: /Hoàn thành/.test(l) ? '✅' : /Cần cập nhật/.test(l) ? '⚠️' : '⬜',
      dev: iDev >= 0 ? (c[iDev] || '⬜') : null,
    });
  }
  manHinh = {
    tong: ds.length,
    taiLieuXong: ds.filter(s => s.taiLieu === '✅').length,
    taiLieuLech: ds.filter(s => s.taiLieu === '⚠️').length,
    devXong: ds.filter(s => s.dev === '✅').length,
    devChua: ds.filter(s => s.dev === '⬜').length,
    danhSach: ds,
  };
}

/* ── 2. Sổ CR / WI ───────────────────────────────────────────────────────── */
const cr = need('00-cr.md');
const crMo = cr ? rows(cr, /^\|\s*CR-\d+/).filter(l => !/Đóng|Từ chối/.test(l)) : null;
const backlog = need('00-backlog.md');
const wiRows = backlog ? rows(backlog, /^\|\s*WI-\d+/).filter(l => !/Xong|Hủy/.test(l)) : null;

/* ── 3. Milestone / phase (08-roadmap.md) ────────────────────────────────── */
const roadmap = need('08-roadmap.md');
const phases = roadmap
  ? [...new Set((roadmap.match(/\b[Pp]hase[- ]?\d+\b/g) || []).map(s => s.toLowerCase().replace(/\s/g, '-')))]
  : null;

/* ── 4. UAT (09-uat.md) ──────────────────────────────────────────────────── */
const uat = need('09-uat.md');
let uatKq = null;
if (uat) {
  // `09-uat.md` KHÔNG dùng bảng một-dòng-một-ca như test.md: mỗi kịch bản là một heading
  // `### UAT-NN`, trạng thái nằm ở dòng `| **Trạng thái** | … |` bên trong khối đó.
  // Đếm bằng regex dòng-bảng cho ra 0 — mà 0 ở đây bị đọc nhầm thành "không có ca UAT nào".
  const blocks = uat.split(/^### (?=UAT-\d+)/m).slice(1);
  const st = (b) => {
    const m = b.match(/\|\s*\*{0,2}Trạng thái\*{0,2}\s*\|\s*([^|]+)\|/i);
    return m ? m[1].trim() : '(không ghi)';
  };
  const all = blocks.map(st);
  uatKq = {
    tong: blocks.length,
    pass: all.filter(s => /^Pass/i.test(s)).length,
    fail: all.filter(s => /^Fail/i.test(s)).length,
    blocked: all.filter(s => /^Blocked/i.test(s)).length,
    chuaChay: all.filter(s => /Chưa chạy/i.test(s)).length,
  };
}

/* ── 5. Gap (00-gaps.md) ─────────────────────────────────────────────────── */
const gaps = read('00-gaps.md');
const gapRows = gaps ? rows(gaps, /^\|\s*G\d+\s*\|/) : null;
const gapCount = gapRows ? { do: gapRows.filter(l => l.includes('🔴')).length, vang: gapRows.filter(l => l.includes('🟡')).length, no: gapRows.filter(l => l.includes('🟠')).length } : null;

/* ── 6. Đối chiếu code (00-conformance.md — có thì lấy, không thì thôi) ──── */
const conf = read('00-conformance.md');
const doiChieuCode = conf
  ? { coBaoCao: true, dongLech: rows(conf, /^\|.*🔴|^\|.*🟡/).length }
  : { coBaoCao: false, ghiChu: 'chưa chạy ba-conformance — dashboard KHÔNG kết luận gì về code' };

/* ── 7. Việc quá hạn từ biên bản họp (ACT chưa xong) ─────────────────────── */
const meetDir = dp.resolveDoc(DOCS, 'meetings');
let actMo = null;
if (meetDir) {
  actMo = 0;
  for (const f of fs.readdirSync(meetDir).filter(n => n.endsWith('.md'))) {
    actMo += rows(fs.readFileSync(path.join(meetDir, f), 'utf8'), /^\|\s*ACT-\d+/)
      .filter(l => !/Xong|Hủy|Đóng/.test(l)).length;
  }
}

const out = {
  docsDir: DOCS, boCuc: dp.layout(DOCS).moTa,
  manHinh,
  cr: crMo ? { mo: crMo.length } : null,
  wi: wiRows ? { mo: wiRows.length, blocked: wiRows.filter(l => /Blocked/.test(l)).length } : null,
  phases, uat: uatKq, gap: gapCount, doiChieuCode, actMo,
  // Nguồn thiếu KHÔNG được coi là 0 — LLM phải ghi "chưa có dữ liệu", không vẽ mục rỗng thành đẹp
  thieuNguon,
};

if (!PLAIN) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
const s = (v) => (v === null || v === undefined ? '— (chưa có nguồn)' : v);
console.log(`Dashboard nguồn: ${out.docsDir}  ·  ${out.boCuc}`);
console.log(`  Màn hình     : ${manHinh ? `${manHinh.tong} · tài liệu xong ${manHinh.taiLieuXong}, lệch ${manHinh.taiLieuLech} · dev xong ${manHinh.devXong}, chưa ${manHinh.devChua}` : s(null)}`);
console.log(`  CR mở        : ${s(out.cr && out.cr.mo)}`);
console.log(`  WI mở        : ${out.wi ? `${out.wi.mo} (Blocked ${out.wi.blocked})` : s(null)}`);
console.log(`  Phase        : ${phases ? phases.join(', ') : s(null)}`);
console.log(`  UAT          : ${uatKq ? `${uatKq.tong} ca · Pass ${uatKq.pass} · Fail ${uatKq.fail} · Blocked ${uatKq.blocked} · chưa chạy ${uatKq.chuaChay}` : s(null)}`);
console.log(`  Gap          : ${gapCount ? `🔴 ${gapCount.do} · 🟡 ${gapCount.vang} · 🟠 ${gapCount.no} nợ` : s(null)}`);
// Hồ sơ lite tắt sổ WI/changelog/đối chiếu code → ô trống là CHỦ ĐÍCH, không phải dự án bê trễ.
// Không in dòng này thì PM đọc báo cáo sẽ tưởng thiếu sót.
if (readProfile(DOCS) === 'lite') console.log('  Hồ sơ        : ⚙️ lite — tắt sổ WI · changelog · đối chiếu code · review agent');
console.log(`  Đối chiếu code: ${doiChieuCode.coBaoCao ? `${doiChieuCode.dongLech} dòng lệch` : doiChieuCode.ghiChu}`);
console.log(`  ACT còn mở   : ${s(actMo)}`);
if (thieuNguon.length) console.log(`\n⚠️  Thiếu nguồn (KHÔNG được coi là 0): ${thieuNguon.join(', ')}`);
