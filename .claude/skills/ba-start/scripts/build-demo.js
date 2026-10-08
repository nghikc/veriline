#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ trước process.exit (lint 43)
/*
 * ba-start/scripts/build-demo.js — CẮT bộ demo của ba-start từ fixture example/docs (TeamTasks). Zero-dependency.
 * Chỉ chạy được ở nơi có example/ (repo nguồn, repo công khai) — dự án đích không cần chạy nó.
 *
 *   node .claude/skills/ba-start/scripts/build-demo.js --write    # ghi lại assets/demo/ từ example/docs
 *   node .claude/skills/ba-start/scripts/build-demo.js --check    # so assets/demo/ với bản cắt mới (exit = số file lệch, trần 125)
 *
 * Bộ demo (hồ sơ `lite`, ~300 KB): 01/02/03 nguyên văn · 00-tracking.md dựng lại (6 màn: S03 đủ, S04 chỉ ascii-screen,
 * 4 màn còn lại chưa làm — mỗi folder giữ bằng .gitkeep) · S03 đủ 9 file (bỏ checklist) · S04 ascii-screen.
 * Ho-so/ không chép: portal sinh lại lúc chạy demo.
 *
 * Vì sao cắt bằng script mà không chép tay một lần: example/ được sửa thường xuyên (mỗi đợt quy ước mới); bản demo chép tay
 * sẽ lặng lẽ cũ đi — người mới xem demo theo quy ước tháng trước. `--check` nằm trong test.js nên lệch là đỏ.
 *
 * gioiHan: chỉ so NỘI DUNG file (không so quyền/ngày); bảng tracking demo do script dựng (không phải refresh.js) nên cột mới
 * thêm vào example cần sửa hàm dựngTracking ở đây; không kiểm demo có qua ba-review sạch (4 màn ⬜ là cố ý).
 */
const fs = require('fs');
const path = require('path');

const SKILL = path.join(__dirname, '..');
const OUT = path.join(SKILL, 'assets', 'demo', 'docs');
// Gốc repo chứa example/: đi lên từ .claude/skills/ba-start/scripts
const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const EX = path.join(ROOT, 'example', 'docs');
const MODE = process.argv.includes('--write') ? 'write' : process.argv.includes('--check') ? 'check' : null;
if (!MODE) { console.error('Dùng: build-demo.js --write | --check'); process.exit(2); }
if (!fs.existsSync(path.join(EX, '00-tracking.md'))) { console.log(`Không có ${path.relative(process.cwd(), EX) || EX} — bỏ qua (chỉ chạy ở repo có example/).`); process.exit(0); }

const NGÀY_CHỐT = '2026-10-08';
const MÀN_XONG = 'S03 - TaskDetail';
const MÀN_DEMO = 'S04 - UserProfile';
const BỎ_FILE = new Set(['checklist.md']);

/** Bảng tracking của demo: giữ phần đầu + header của example, dòng màn đổi ô theo vai của màn trong demo. */
function dựngTracking(src) {
  const dòng = src.split('\n');
  const iH = dòng.findIndex((l) => /^\|\s*Mã CN/.test(l));
  if (iH < 0) throw new Error('example 00-tracking.md không có header "| Mã CN"');
  const header = dòng[iH].split('|').slice(1, -1).map((x) => x.trim());
  const cột = (t) => header.indexOf(t);
  const ra = [];
  for (let i = 0; i < iH; i++) {
    ra.push(dòng[i]);
    if (i === 0) ra.push('', `> Hồ sơ dự án: \`lite\` · chốt ${NGÀY_CHỐT}`, '> Bộ DEMO của `ba-start` — cắt tự động từ `example/docs` bằng `ba-start/scripts/build-demo.js`. Sửa thoải mái; xoá cả thư mục `veriline-demo/` khi xem xong.');
  }
  ra.push(dòng[iH], dòng[iH + 1]);
  const ôTàiLiệu = header.filter((h) => ['ascii', 'brainstorm', 'srs', 'usecase', 'userstory', 'design-spec', 'html', 'test', 'plan', 'checklist', 'e2e', 'dev'].includes(h));
  for (let i = iH + 2; i < dòng.length && dòng[i].startsWith('|'); i++) {
    const ô = dòng[i].split('|').slice(1, -1).map((x) => x.trim());
    const folder = ô[cột('Folder')] || '';
    const vai = folder.includes(MÀN_XONG) ? 'xong' : folder.includes(MÀN_DEMO) ? 'demo' : 'chưa';
    for (const h of ôTàiLiệu) {
      const k = cột(h);
      ô[k] = vai === 'xong' ? (['checklist', 'e2e', 'dev'].includes(h) ? '⬜' : '✅') : vai === 'demo' && h === 'ascii' ? '✅' : '⬜';
    }
    ô[cột('Trạng thái')] = vai === 'xong' ? 'Hoàn thành' : vai === 'demo' ? 'Đang làm' : 'Chưa làm';
    ô[cột('Cập nhật cuối')] = NGÀY_CHỐT;
    ra.push('| ' + ô.join(' | ') + ' |');
  }
  return ra.join('\n').replace(/\n*$/, '\n');
}

/** Bản cắt dự kiến: Map<đường dẫn tương đối, Buffer>. */
function cắt() {
  const m = new Map();
  for (const f of ['01-requirements.md', '02-functions.md', '03-overview.md']) m.set(f, fs.readFileSync(path.join(EX, f)));
  m.set('00-tracking.md', Buffer.from(dựngTracking(fs.readFileSync(path.join(EX, '00-tracking.md'), 'utf8')), 'utf8'));
  const SS = path.join(EX, 'Screen-spec');
  const folders = [];
  (function dò(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) if (e.isDirectory()) { if (/^S\d+ - /.test(e.name)) folders.push(path.join(d, e.name)); else dò(path.join(d, e.name)); } })(SS);
  for (const fd of folders.sort()) {
    const rel = path.relative(EX, fd).split(path.sep).join('/');
    const tên = path.basename(fd);
    const chọn = tên === MÀN_XONG ? fs.readdirSync(fd).filter((f) => !BỎ_FILE.has(f) && !f.startsWith('.')) : tên === MÀN_DEMO ? ['ascii-screen.md'] : [];
    if (!chọn.length) m.set(rel + '/.gitkeep', Buffer.from(''));
    for (const f of chọn.sort()) m.set(rel + '/' + f, fs.readFileSync(path.join(fd, f)));
  }
  return m;
}

function hiệnCó() {
  const m = new Map();
  if (!fs.existsSync(OUT)) return m;
  (function dò(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) dò(p); else if (e.name !== '.DS_Store') m.set(path.relative(OUT, p).split(path.sep).join('/'), fs.readFileSync(p)); } })(OUT);
  return m;
}

const mới = cắt();
if (MODE === 'write') {
  fs.rmSync(OUT, { recursive: true, force: true });
  let byte = 0;
  for (const [rel, b] of mới) { const p = path.join(OUT, ...rel.split('/')); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, b); byte += b.length; }
  console.log(`Đã ghi bộ demo: ${mới.size} file · ${(byte / 1024).toFixed(0)} KB → ${path.relative(process.cwd(), OUT)}`);
  process.exit(0);
}
const cũ = hiệnCó(); const lệch = [];
for (const [rel, b] of mới) { if (!cũ.has(rel)) lệch.push(`thiếu  ${rel}`); else if (!cũ.get(rel).equals(b)) lệch.push(`khác   ${rel}`); }
for (const rel of cũ.keys()) if (!mới.has(rel)) lệch.push(`thừa   ${rel}`);
if (!lệch.length) { console.log(`Bộ demo khớp example/docs (${mới.size} file).`); process.exit(0); }
console.log(`Bộ demo LỆCH example/docs — ${lệch.length} file:`);
for (const l of lệch.slice(0, 30)) console.log('  ' + l);
console.log('Sửa: node .claude/skills/ba-start/scripts/build-demo.js --write (rồi commit assets/demo/)');
process.exit(Math.min(lệch.length, 125));
