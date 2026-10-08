#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ trước process.exit (lint 43)
/*
 * ba-start/scripts/detect.js — nhận diện dự án đang mở thuộc loại nào để chọn cửa vào. Zero-dependency, chỉ đọc.
 *
 *   node .claude/skills/ba-start/scripts/detect.js [gốc dự án=cwd] [--json]
 *
 * Loại (đúng một):
 *   có-docs           đã có tài liệu của bộ skill (docs/00-tracking.md, 01-requirements, brainstorm/vision/intake) → ba-next
 *   code-và-tài-liệu  có cả code lẫn tài liệu rời → hỏi người dùng nguồn chính
 *   có-code           có code (file khai gói ở gốc/≤2 cấp, hoặc src/ app/ lib/ server/ packages/)
 *   tài-liệu-rời      có Word/PDF/Excel/PowerPoint/ảnh (≤3 cấp) — tài liệu khách gửi, biên bản, ảnh chụp màn hình
 *   ý-tưởng           không có gì ở trên — bắt đầu từ ý tưởng
 * Cờ riêng `nguồnToolkit`: thư mục là repo nguồn của chính bộ skill (có example/docs/00-tracking.md — canon export.srcMarker).
 *
 * Vì sao có (M7, docs/decisions/32): ba-next khi chưa có docs/ chỉ in danh sách cửa vào, không nhìn dự án — người mới
 * phải tự biết "dự án của mình là loại nào". Script này nhìn hộ, người vẫn chốt.
 *
 * gioiHan: đếm theo đuôi file và tên thư mục, không mở nội dung — một PDF hướng dẫn thư viện hay ảnh logo cũng tính là
 * "tài liệu rời"; code chỉ nhận theo file khai gói/thư mục quen (dự án C/C++ không Makefile ở gốc có thể lọt); dừng đếm ở
 * 500 file tài liệu; bỏ qua node_modules .git dist build .claude veriline-demo và thư mục ẩn.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');
const ROOT = path.resolve(args.find((a) => !a.startsWith('--')) || process.cwd());

const BỎ = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', 'target', 'vendor', '.venv', 'venv', '__pycache__', '.claude', 'veriline-demo', 'coverage']);
const KHAI_GÓI = ['package.json', 'pyproject.toml', 'requirements.txt', 'setup.py', 'go.mod', 'pom.xml', 'build.gradle', 'build.gradle.kts', 'Cargo.toml', 'Gemfile', 'composer.json', 'Makefile', 'pubspec.yaml'];
const ĐUÔI_KHAI = /\.(csproj|sln|xcodeproj)$/i;
const THƯ_MỤC_CODE = ['src', 'app', 'lib', 'server', 'packages', 'backend', 'frontend'];
const ĐUÔI_TÀI_LIỆU = /\.(docx?|pdf|xlsx?|pptx?|odt|ods|png|jpe?g)$/i;
const TRẦN_TÀI_LIỆU = 500;
// Dấu hiệu "đã dùng bộ skill": file các skill cửa vào sinh ra (Ho-so/ hoặc gốc docs/ — dự án cài trước 13/08/2026 để phẳng)
const DẤU_DOCS = ['00-tracking.md', '01-requirements.md', 'Ho-so/00-brainstorm.md', '00-brainstorm.md', 'Ho-so/00-vision.md', '00-vision.md', 'Ho-so/00-intake.md', '00-intake.md'];

const có = (...p) => fs.existsSync(path.join(ROOT, ...p));
const docsDấu = DẤU_DOCS.filter((f) => có('docs', ...f.split('/')));

// Code: file khai gói ở gốc và ≤2 cấp (monorepo: apps/web/package.json), thư mục code quen ở gốc
const codeDấu = [];
(function dò(dir, sâu) {
  let ds = []; try { ds = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ds) {
    const rel = path.relative(ROOT, path.join(dir, e.name));
    if (e.isFile() && (KHAI_GÓI.includes(e.name) || ĐUÔI_KHAI.test(e.name))) codeDấu.push(rel);
    else if (e.isDirectory() && ĐUÔI_KHAI.test(e.name)) codeDấu.push(rel);
    else if (e.isDirectory() && sâu < 2 && !BỎ.has(e.name) && !e.name.startsWith('.') && e.name !== 'docs') dò(path.join(dir, e.name), sâu + 1);
  }
})(ROOT, 0);
for (const d of THƯ_MỤC_CODE) if (có(d) && fs.statSync(path.join(ROOT, d)).isDirectory()) codeDấu.push(d + '/');

// Tài liệu rời: ≤3 cấp, ngoài docs/ của bộ skill (html/ảnh do skill sinh không phải tài liệu khách)
const tàiLiệu = []; let tràn = false;
(function dò(dir, sâu) {
  if (tràn) return;
  let ds = []; try { ds = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ds) {
    if (tàiLiệu.length >= TRẦN_TÀI_LIỆU) { tràn = true; return; }
    const p = path.join(dir, e.name);
    if (e.isFile() && ĐUÔI_TÀI_LIỆU.test(e.name)) tàiLiệu.push(path.relative(ROOT, p));
    else if (e.isDirectory() && sâu < 3 && !BỎ.has(e.name) && !e.name.startsWith('.') && !(sâu === 0 && e.name === 'docs' && docsDấu.length)) dò(p, sâu + 1);
  }
})(ROOT, 0);
// Ảnh nằm TRONG thư mục code (asset giao diện) không phải tài liệu khách
const gốcCode = THƯ_MỤC_CODE.filter((d) => codeDấu.includes(d + '/'));
const tàiLiệuThật = tàiLiệu.filter((f) => !(/\.(png|jpe?g)$/i.test(f) && gốcCode.some((d) => f.startsWith(d + path.sep))) && !f.startsWith('public' + path.sep) && !f.startsWith('assets' + path.sep));

const nguồnToolkit = có('example', 'docs', '00-tracking.md');
const coCode = codeDấu.length > 0, coTàiLiệu = tàiLiệuThật.length > 0;
const loại = docsDấu.length ? 'có-docs' : coCode && coTàiLiệu ? 'code-và-tài-liệu' : coCode ? 'có-code' : coTàiLiệu ? 'tài-liệu-rời' : 'ý-tưởng';

// Skill sinh tài liệu ngược từ code thuộc gói Pro — có cài thì đề xuất, không thì ba-init (không phụ thuộc cứng, lint 44)
const SKILLS = path.join(__dirname, '..', '..');
const cóSkill = (s) => fs.existsSync(path.join(SKILLS, s, 'SKILL.md'));
const cóReverse = cóSkill('ba-reverse');
const nhánhCode = cóReverse
  ? { skill: 'ba-reverse', lýDo: 'đọc code có sẵn rồi viết ngược ra tài liệu (phần suy đoán được đánh dấu để bạn xác nhận)' }
  : { skill: 'ba-init', lýDo: 'bắt đầu từ ý tưởng, Claude đọc code có sẵn làm tham khảo · gói Pro có thêm skill viết tài liệu ngược thẳng từ code' };
const ĐỀ_XUẤT = {
  'có-docs': [{ skill: 'ba-next', lýDo: 'dự án đã có tài liệu — xem đang ở bước nào và làm gì tiếp' }],
  'code-và-tài-liệu': [{ skill: 'ba-reverse-doc', lýDo: 'tài liệu khách gửi là nguồn chính — dựng lại yêu cầu có trích nguồn' }, nhánhCode],
  'có-code': [nhánhCode],
  'tài-liệu-rời': [{ skill: 'ba-reverse-doc', lýDo: 'dựng lại yêu cầu từ tài liệu rời, mỗi ý ghi rõ lấy từ file nào' }],
  'ý-tưởng': [{ skill: 'ba-init', lýDo: 'từ một ý tưởng tới yêu cầu, chức năng, màn hình, đặc tả và kế hoạch build — dừng hỏi bạn ở mỗi chặng' }],
};

const kq = {
  gốc: ROOT, loại, nguồnToolkit,
  docs: docsDấu.map((f) => 'docs/' + f),
  code: { có: coCode, dấu: codeDấu.slice(0, 10) },
  tàiLiệu: { n: tàiLiệuThật.length, tràn, mẫu: tàiLiệuThật.slice(0, 10) },
  cóReverse,
  đềXuất: ĐỀ_XUẤT[loại],
  gioiHan: ['đếm theo đuôi file và tên thư mục, không mở nội dung — PDF hướng dẫn hay ảnh logo cũng tính là tài liệu rời; bạn chốt loại dự án, script chỉ gợi ý',
    `dừng đếm tài liệu ở ${TRẦN_TÀI_LIỆU} file; bỏ qua node_modules, .git, dist, build, thư mục ẩn`],
};

if (JSON_MODE) { process.stdout.write(JSON.stringify(kq) + '\n'); process.exit(0); }
const TÊN = { 'có-docs': 'đã có tài liệu', 'code-và-tài-liệu': 'có code và có tài liệu rời', 'có-code': 'đã có code', 'tài-liệu-rời': 'có tài liệu rời (Word/PDF/Excel/ảnh)', 'ý-tưởng': 'chưa có gì — bắt đầu từ ý tưởng' };
console.log(`Dự án: ${ROOT}`);
console.log(`Nhận diện: ${TÊN[loại]}${nguồnToolkit ? ' · (đây là repo nguồn của bộ skill)' : ''}`);
if (docsDấu.length) console.log(`  tài liệu: ${kq.docs.join(', ')}`);
if (coCode) console.log(`  code: ${codeDấu.slice(0, 5).join(', ')}${codeDấu.length > 5 ? ` … (+${codeDấu.length - 5})` : ''}`);
if (coTàiLiệu) console.log(`  tài liệu rời: ${tàiLiệuThật.length}${tràn ? '+' : ''} file — ${tàiLiệuThật.slice(0, 5).join(', ')}${tàiLiệuThật.length > 5 ? ' …' : ''}`);
console.log('Gợi ý:');
for (const d of kq.đềXuất) console.log(`  /${d.skill} — ${d.lýDo}`);
