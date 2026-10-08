#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ trước process.exit (lint 43)
/*
 * ba-start/scripts/demo.js — dựng DỰ ÁN DEMO cho người mới: chép bộ demo (TeamTasks thu gọn) vào `<dự án>/veriline-demo/`,
 * dựng portal tài liệu, ghi mốc demoPortalAt. Zero-dependency.
 *
 *   node .claude/skills/ba-start/scripts/demo.js [--root <dự án>=cwd] [--reset] [--json]
 *
 * Đã có veriline-demo/ → KHÔNG chép đè (bạn có thể đang sửa thử trong đó), chỉ dựng lại portal. `--reset` xoá rồi chép lại.
 * Dự án là git repo → thêm một dòng `veriline-demo/` vào .gitignore (in ra; có rồi thì thôi) để demo không lọt vào commit.
 * Exit: 0 xong · 1 dựng portal lỗi · 2 sai cách gọi / thiếu bộ demo.
 *
 * gioiHan: portal dựng bằng ba-portal/scripts/build.js (có sẵn trong gói lõi); thiếu skill đó thì chỉ chép demo, báo
 * "không dựng được portal"; không mở trình duyệt (in đường dẫn để bạn mở); không kiểm demo đọc đúng nghiệp vụ.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ledger = require('./ledger.js');

const a = process.argv.slice(2);
const giá = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
const ROOT = path.resolve(giá('--root') || process.cwd());
const RESET = a.includes('--reset'), JSON_MODE = a.includes('--json');
const NGUỒN = path.join(__dirname, '..', 'assets', 'demo');
const ĐÍCH = path.join(ROOT, 'veriline-demo');
const DOCS = path.join(ĐÍCH, 'docs');
const PORTAL = path.join(DOCS, 'Ho-so', 'portal.html');
const BUILD = path.join(__dirname, '..', '..', 'ba-portal', 'scripts', 'build.js');

if (!fs.existsSync(path.join(NGUỒN, 'docs', '00-tracking.md'))) { console.error(`Thiếu bộ demo ở ${NGUỒN} — cài lại bộ skill (ba-export update).`); process.exit(2); }

const kq = { đích: ĐÍCH, chép: false, giữNguyên: false, gitignore: null, portal: null, mốc: null };
function chép(tu, toi) {
  for (const e of fs.readdirSync(tu, { withFileTypes: true })) {
    const p = path.join(tu, e.name), q = path.join(toi, e.name);
    if (e.isDirectory()) { fs.mkdirSync(q, { recursive: true }); chép(p, q); }
    else if (e.name !== '.DS_Store') fs.copyFileSync(p, q);
  }
}
if (RESET) fs.rmSync(ĐÍCH, { recursive: true, force: true });
if (fs.existsSync(path.join(DOCS, '00-tracking.md'))) kq.giữNguyên = true;
else { fs.mkdirSync(ĐÍCH, { recursive: true }); chép(NGUỒN, ĐÍCH); kq.chép = true; }

if (fs.existsSync(path.join(ROOT, '.git'))) {
  const gi = path.join(ROOT, '.gitignore');
  const cũ = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8') : '';
  if (cũ.split('\n').some((l) => /^\/?veriline-demo\/?\s*$/.test(l.trim()))) kq.gitignore = 'đã có';
  else { fs.writeFileSync(gi, cũ + (cũ && !cũ.endsWith('\n') ? '\n' : '') + '# demo của ba-start — xoá thư mục khi xem xong\nveriline-demo/\n'); kq.gitignore = 'đã thêm'; }
}

if (fs.existsSync(BUILD)) {
  const r = spawnSync(process.execPath, [BUILD, DOCS, PORTAL], { encoding: 'utf8', maxBuffer: 1e8 });
  kq.portal = r.status === 0 && fs.existsSync(PORTAL) ? PORTAL : null;
  if (!kq.portal) kq.lỗiPortal = ((r.stderr || r.stdout || '').trim().split('\n').slice(-3).join(' ')).slice(0, 300);
} else kq.lỗiPortal = 'không có ba-portal trong bộ skill đã cài';
if (kq.portal) kq.mốc = ledger.mark(ROOT, 'demoPortalAt');

if (JSON_MODE) { process.stdout.write(JSON.stringify(kq) + '\n'); process.exit(kq.portal ? 0 : 1); }
const rel = (p) => path.relative(process.cwd(), p) || '.';
console.log(kq.chép ? `Đã tạo dự án demo: ${rel(ĐÍCH)}/  (TeamTasks — app quản lý công việc nhóm, 6 màn)` : `Đã dựng lại cổng tài liệu từ bản demo hiện có ở ${rel(ĐÍCH)}/ — mọi thay đổi trong đó được giữ nguyên.`);
if (kq.gitignore === 'đã thêm') console.log('Đã thêm dòng "veriline-demo/" vào .gitignore để demo không lọt vào commit của bạn.');
if (kq.portal) {
  console.log(`\nCổng tài liệu — một trang web gom mọi tài liệu, mở bằng trình duyệt, chạy cả khi không có mạng (~${Math.round(fs.statSync(PORTAL).size / 1048576)} MB vì nhúng sẵn thư viện vẽ sơ đồ): ${rel(PORTAL)}`);
  console.log(`  macOS: open "${rel(PORTAL)}"   ·   Linux: xdg-open "${rel(PORTAL)}"`);
  if (!kq.chép) { console.log('Lưu ý: chạy lại với --reset sẽ XOÁ bản demo hiện có (kể cả màn bạn vừa cho AI đặc tả) rồi chép bản gốc.'); }
  else {
  console.log('\nTrong demo có:');
  console.log('  · Yêu cầu, chức năng, danh sách màn hình của cả app');
  console.log('  · Màn "Chi tiết công việc" (S03) đã đặc tả đủ: mô tả nghiệp vụ, ca sử dụng, test case, bản thiết kế HTML, kế hoạch code');
  console.log('  · Màn "Hồ sơ cá nhân" (S04) mới có phác thảo — bước kế tiếp của demo là để AI đặc tả màn này');
  console.log('Các mã như R-S03-01, TC-S03-05 dùng để nối mỗi yêu cầu tới ca kiểm thử của nó — không cần nhớ.');
  }
} else {
  console.log(`\nKhông dựng được portal: ${kq.lỗiPortal}`);
  console.log(`Tài liệu demo vẫn đọc được trực tiếp trong ${rel(DOCS)}/`);
}
process.exit(kq.portal ? 0 : 1);
