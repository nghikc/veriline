#!/usr/bin/env node
/*
 * ba-toolkit/usage.js — skill nào THẬT SỰ được dùng (zero-dependency).
 *
 * Vì sao cần: toolkit có 62 skill `ba-*`, và cho tới 01/09/2026 KHÔNG có cách nào biết cái nào
 * được gọi thật. Mọi câu "skill này ít dùng" trước đó đều là suy đoán từ đồ thị tham chiếu TĨNH
 * giữa các file SKILL.md (ai nhắc tên ai) — thứ đó đo *thiết kế*, không đo *thói quen dùng*.
 * Script này đọc transcript phiên Claude Code trên máy và ĐẾM.
 *
 * RIÊNG TƯ: chỉ trích tên skill + số lượt. Không đọc, không in, không lưu nội dung hội thoại.
 *
 * Dùng:  node .claude/skills/ba-toolkit/scripts/usage.js [--dir <thư mục transcript>] [--json] [--all]
 *        --all  : liệt kê cả skill 0 lượt (mặc định chỉ tóm tắt số lượng)
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const os = require('os');

const argv = process.argv.slice(2);
const JSON_MODE = argv.includes('--json');
const SHOW_ALL = argv.includes('--all');
const dirArg = (() => { const i = argv.indexOf('--dir'); return i >= 0 ? argv[i + 1] : null; })();

/* Thư mục transcript: Claude Code đặt theo đường dẫn project đã "slug hoá".
 * Không đoán một chỗ duy nhất — quét vài gốc đã biết rồi chọn thư mục khớp tên repo. */
function tìmThưMục() {
  if (dirArg) return dirArg;
  // Slug thư mục do Claude Code sinh có lược dấu tiếng Việt và ký tự lạ theo cách riêng
  // (`Lưu trữ` -> `L-u-tr-`), nên ĐỪNG cố tái tạo nó. So bằng cách bỏ hết ký tự không phải
  // chữ/số ở cả hai vế rồi kiểm chứa — bền với mọi kiểu lược.
  const chuẩn = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
  const tênRepo = chuẩn(path.basename(process.cwd()));
  const gốc = [
    path.join(os.homedir(), '.claude', 'projects'),
    // Trình bọc Claude Code nhiều tài khoản đặt transcript ở ~/.<app>/accounts/claude/<id>/projects — dò mọi thư mục ẩn
    // ở home thay vì gắn cứng tên một app.
    ...(() => { const ra = []; let ds = []; try { ds = fs.readdirSync(os.homedir()).filter((n) => n.startsWith('.')); } catch { return ra; }
      for (const n of ds) { const a = path.join(os.homedir(), n, 'accounts', 'claude'); let ids = []; try { ids = fs.readdirSync(a); } catch { continue; } for (const id of ids) ra.push(path.join(a, id, 'projects')); }
      return ra; })(),
  ].filter(d => fs.existsSync(d));
  const khớp = [];
  for (const g of gốc) for (const d of fs.readdirSync(g)) {
    const p = path.join(g, d);
    if (fs.statSync(p).isDirectory() && chuẩn(d).includes(tênRepo)) khớp.push(p);
  }
  if (!khớp.length) return null;
  // Nhiều thư mục cùng khớp (nhiều tài khoản trên cùng máy). Chọn cái CÓ NHIỀU TRANSCRIPT NHẤT
  // thay vì cái đầu danh sách — "cái đầu" phụ thuộc thứ tự đọc thư mục, tức là ngẫu nhiên.
  const đếmFile = (d) => fs.readdirSync(d).filter(f => f.endsWith('.jsonl')).length;
  // Trước khi so số phiên: thư mục khớp ĐÚNG đường dẫn cwd thắng tuyệt đối. Đo trên dự án desktop
  // (11/09/2026): "nhiều phiên nhất" chọn nhầm một sandbox tạm (25 phiên, 337 dòng) thay vì
  // `-Users-x-dev-<dự-án>`, và báo cáo phản hồi ghi "0/76 skill từng gọi" cho một dự án
  // đã chạy ba-add-screen feature/dev-run hàng chục lần. Tên thư mục transcript = đường dẫn cwd với
  // mọi ký tự không phải chữ/số thành `-`, nên so được chính xác.
  const tênCwd = process.cwd().replace(/[^A-Za-z0-9]/g, '-');
  const đúngCwd = khớp.filter((d) => path.basename(d) === tênCwd);
  if (đúngCwd.length) return đúngCwd[0];
  khớp.sort((x, y) => đếmFile(y) - đếmFile(x));
  if (khớp.length > 1) console.error(`ℹ️  ${khớp.length} thư mục transcript cùng khớp tên repo; lấy cái nhiều phiên nhất (${đếmFile(khớp[0])} phiên). Chỉ định --dir nếu sai.`);
  return khớp[0];
}

const DIR = tìmThưMục();
if (!DIR || !fs.existsSync(DIR)) {
  console.error('Không tìm thấy thư mục transcript. Chỉ định thẳng: --dir <đường dẫn>');
  process.exit(2);
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.jsonl'));
const đếm = {};
let dòng = 0;
for (const f of files) {
  let txt = '';
  try { txt = fs.readFileSync(path.join(DIR, f), 'utf8'); } catch { continue; }
  for (const l of txt.split('\n')) {
    if (!l) continue; dòng++;
    // (a) gọi qua công cụ Skill   (b) gõ thẳng /ten-skill
    for (const m of l.matchAll(/"name"\s*:\s*"Skill"[\s\S]{0,200}?"skill"\s*:\s*"([a-z0-9-]+)"/g)) đếm[m[1]] = (đếm[m[1]] || 0) + 1;
    for (const m of l.matchAll(/<command-name>\/?([a-z0-9-]+)<\/command-name>/g)) đếm[m[1]] = (đếm[m[1]] || 0) + 1;
  }
}

const SKILLS = path.join(process.cwd(), '.claude', 'skills');
const cóThật = fs.existsSync(SKILLS)
  ? fs.readdirSync(SKILLS, { withFileTypes: true }).filter(e => e.isDirectory() && /^(ba|dev|ac)-/.test(e.name)).map(e => e.name).sort()
  : [];
const dùng = cóThật.map(s => ({ skill: s, lượt: đếm[s] || 0 })).sort((a, b) => b.lượt - a.lượt || a.skill.localeCompare(b.skill));
const cóDùng = dùng.filter(d => d.lượt > 0);
const chưaDùng = dùng.filter(d => d.lượt === 0);
// skill được gọi nhưng KHÔNG có trong repo (gõ nhầm tên, hoặc skill đã xoá)
const lạ = Object.keys(đếm).filter(k => /^(ba|dev|ac)-/.test(k) && !cóThật.includes(k)).sort();

const out = { thưMục: DIR, phiên: files.length, dòng, tổngSkill: cóThật.length,
  đãDùng: cóDùng.length, chưaDùng: chưaDùng.length, tổngLượt: cóDùng.reduce((s, d) => s + d.lượt, 0),
  bảng: dùng, gọiTênLạ: lạ };

if (JSON_MODE) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log(`\n=== Tần suất dùng skill (${files.length} phiên · ${dòng} dòng transcript) ===`);
console.log(`   ${out.đãDùng}/${out.tổngSkill} skill từng được gọi · ${out.tổngLượt} lượt · ${out.chưaDùng} skill CHƯA BAO GIỜ gọi\n`);
for (const d of cóDùng) console.log(`   ${String(d.lượt).padStart(3)}×  ${d.skill}`);
if (lạ.length) console.log(`\n  ⚠️  gọi tên không có trong repo (gõ nhầm hoặc skill đã xoá): ${lạ.join(', ')}`);
if (SHOW_ALL && chưaDùng.length) console.log(`\n  Chưa bao giờ gọi (${chưaDùng.length}):\n     ${chưaDùng.map(d => d.skill).join(' · ')}`);
else if (chưaDùng.length) console.log(`\n  (${chưaDùng.length} skill chưa bao giờ gọi — thêm --all để xem tên)`);
console.log(`
  ⚠️  ĐỌC SỐ CHO ĐÚNG: đây là thói quen dùng TRÊN MÁY NÀY, phần lớn có thể là phiên
      phát triển chính toolkit chứ không phải dự án BA thật. "Chưa bao giờ gọi" nghĩa là
      CHƯA AI GỌI Ở ĐÂY — không phải "vô dụng". Đừng xoá skill dựa trên con số này.`);
