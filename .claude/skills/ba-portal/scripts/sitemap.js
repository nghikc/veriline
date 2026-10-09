#!/usr/bin/env node
/**
 * ba-portal/sitemap.js (chế độ `ba-portal sitemap`) — gom wireframe ASCII mọi màn + sơ đồ điều hướng + hành trình người
 * dùng thành MỘT trang HTML tự chứa cho end user hiểu flow màn hình chức năng.
 *
 * Triết lý: cơ giới hóa phần XÁC ĐỊNH (gom ascii-screen, trích sơ đồ điều hướng, xếp thứ
 * tự màn, DÒ GAP readiness), để LLM chỉ lo phần PHÁN ĐOÁN (viết `docs/sitemap-flows.md`).
 * KHÔNG tự render HTML: assemble một markdown rồi gọi `ba-portal/build.js --single`.
 *
 * Cách dùng:
 *   node .claude/skills/ba-portal/scripts/sitemap.js [docsDir=docs] [out=docs/sitemap.html]
 *   node .claude/skills/ba-portal/scripts/sitemap.js --check [docsDir=docs]   # CỔNG: chỉ dò gap, KHÔNG build
 *
 * `--check` = cổng của orchestrator: exit code = số gap CHẶN (sơ đồ điều hướng thiếu, hoặc
 * hành trình nhắc mã màn không tồn tại). Màn thiếu ascii là gap MỀM (báo, không chặn — sitemap
 * vẫn dựng được với ô trống, người dùng quyết chạy ba-screen-spec hay không).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const raw = process.argv.slice(2);
const CHECK = raw.includes('--check');
const pos = raw.filter(a => !a.startsWith('--'));
const DOCS = path.resolve(pos[0] || 'docs');
// `sitemap.html`/`sitemap-flows.md` thuộc nhóm phái sinh → nằm ở `docs/Ho-so/` (bố cục từ
// 13/08/2026), nhưng dự án cũ vẫn để ở gốc `docs/`. writePathFor giữ nguyên chỗ file đã có,
// chỉ file mới mới vào Ho-so/ — không tự di chuyển tài liệu của người ta.
const docpath = require('../../ba-toolkit/scripts/docpath.js');
const OUT = path.resolve(pos[1] || docpath.writePathFor(DOCS, 'sitemap.html'));
const MD = OUT.replace(/\.html?$/i, '.md');
if (!fs.existsSync(DOCS)) { console.error(`Không thấy thư mục tài liệu: ${DOCS}\nSửa: chạy từ gốc dự án (nơi có docs/), hoặc truyền đúng thư mục làm tham số đầu.`); process.exit(2); }
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };

// ─── 1. Quét màn (nhận diện container Screen-spec/ trong suốt, tương thích layout cũ) ──
const CONTAINER = 'Screen-spec';
const isScreenDir = (n) => /^S\d+ - /.test(n);
const screens = []; // {code, name, dirName, absDir, prefix, ascii}
const walk = (dir, group, prefix) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (isScreenDir(e.name)) {
      const m = e.name.match(/^(S\d+) - (.+)$/);
      screens.push({ code: m[1], name: m[2], dirName: e.name, absDir: path.join(dir, e.name), prefix });
    } else if (e.name === CONTAINER && !group) {
      walk(path.join(dir, e.name), '', prefix + e.name + '/');
    } else if (!group) {
      walk(path.join(dir, e.name), e.name, prefix + e.name + '/');
    }
  }
};
walk(DOCS, '', '');
screens.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
if (!screens.length) { console.error('Không tìm thấy folder màn nào (S.. - ..) trong ' + DOCS + '\nSửa: chạy `/ba-screens` để sinh khung folder màn trước.'); process.exit(2); }

// Wireframe ASCII (nội dung trong khối ``` của ascii-screen.md) — cache 1 lần
function asciiOf(absDir) {
  const r = read(path.join(absDir, 'ascii-screen.md'));
  const m = r.match(/```[a-z]*\n([\s\S]*?)```/);
  return m ? m[1].replace(/\s+$/, '') : null;
}
for (const s of screens) s.ascii = asciiOf(s.absDir);
const missingAscii = screens.filter(s => !s.ascii).map(s => s.code);

// ─── 2. Sơ đồ điều hướng từ 03-overview.md (mục "## Sơ đồ điều hướng" tới ## kế) ─────
function navSection() {
  const ov = read(path.join(DOCS, '03-overview.md'));
  if (!ov) return null;
  const i = ov.search(/^##\s+Sơ đồ điều hướng/m);
  if (i < 0) return null;
  const rest = ov.slice(i + ov.slice(i).indexOf('\n') + 1);
  const j = rest.search(/^##\s/m);
  return (j < 0 ? rest : rest.slice(0, j)).trim();
}
const nav = navSection();

// ─── 3. Hành trình (LLM viết) + dò mã màn lạ ────────────────────────────────────────
const flowsRaw = docpath.readDoc(DOCS, 'sitemap-flows.md');
const flows = flowsRaw.trim();
const screenCodes = new Set(screens.map(s => s.code));
const orphanCodes = [...new Set(flowsRaw.match(/\bS\d+\b/g) || [])].filter(c => !screenCodes.has(c));

// ─── CỔNG (--check): dò gap, exit = số gap CHẶN, KHÔNG build ─────────────────────────
if (CHECK) {
  const blocking = (nav ? 0 : 1) + orphanCodes.length;
  console.log('CỔNG ba-portal sitemap — đủ điều kiện dựng chưa:');
  console.log(`  Sơ đồ điều hướng (03-overview): ${nav ? 'CÓ' : 'THIẾU ← CHẶN (chạy ba-screens)'}`);
  console.log(`  Màn: ${screens.length} · thiếu ascii-screen.md: ${missingAscii.length ? missingAscii.join(', ') + ' ← mềm (chạy ba-screen-spec hoặc build với ô trống)' : 'không'}`);
  console.log(`  Hành trình (sitemap-flows.md): ${flows ? 'CÓ' : 'CHƯA (viết bằng ba-portal sitemap)'}`);
  console.log(`  Mã màn lạ trong hành trình: ${orphanCodes.length ? orphanCodes.join(', ') + ' ← CHẶN (mã không tồn tại, sửa sitemap-flows.md)' : 'không'}`);
  console.log(`  => ${blocking ? 'CHẶN: ' + blocking + ' gap' : 'PASS'}`);
  process.exit(blocking);
}

// ─── 4. Blurb chức năng mỗi màn từ 00-tracking.md ──────────────────────────────────
const fnByCode = {};
for (const line of read(path.join(DOCS, '00-tracking.md')).split('\n')) {
  if (!line.startsWith('|')) continue;
  const c = line.split('|').map(s => s.trim());
  const mCode = (c.find(x => /S\d+ - /.test(x)) || '').match(/S\d+/);
  if (mCode) fnByCode[mCode[0]] = { ma: c[1] || '', chucNang: c[2] || '' };
}

// ─── 5. Assemble markdown ───────────────────────────────────────────────────────────
const out = [];
out.push('# Sơ đồ luồng màn hình — cho người dùng cuối', '');
out.push('> Một vòng đi qua các màn của hệ thống: bản đồ điều hướng, các hành trình chính, và khung giao diện (wireframe) từng màn. Đọc từ trên xuống để hiểu "làm việc gì thì đi qua những màn nào".', '');
out.push('## Bản đồ điều hướng', '');
out.push(nav || '*(Chưa có mục "Sơ đồ điều hướng" trong `03-overview.md` — chạy `ba-screens`.)*', '');
out.push('## Hành trình người dùng chính', '');
out.push(flows || '*(Chưa có `docs/sitemap-flows.md`. Chạy `ba-portal sitemap` để viết các hành trình.)*', '');
out.push('## Wireframe từng màn', '');
for (const s of screens) {
  const fn = fnByCode[s.code];
  out.push(`### ${s.code} — ${s.name}${fn ? ` — *${fn.chucNang}* (${fn.ma})` : ''}`, '');
  if (s.ascii) out.push('```', s.ascii, '```', '');
  else out.push('*(Chưa có `ascii-screen.md` — chạy `ba-screen-spec` cho màn này.)*', '');
}
fs.writeFileSync(MD, out.join('\n'));

// ─── 6. Render HTML qua ba-portal/build.js --single (tái dùng engine) ────────────────
const portal = path.join(__dirname, 'build.js');
try {
  execFileSync(process.execPath, [portal, '--single', MD, OUT], { stdio: ['ignore', 'ignore', 'pipe'] });
} catch (e) {
  console.error('Lỗi render qua ba-portal:', String(e.stderr || e.message).slice(0, 500));
  console.error('Sửa: chạy `node .claude/skills/ba-portal/scripts/build.js --lint <file.md>` để thấy sơ đồ hỏng, sửa rồi chạy lại.');
  process.exit(1);
}
const rel = (p) => path.relative(process.cwd(), p);
console.log(`🗺️  Sitemap: ${screens.length} màn → ${rel(OUT)}`);
console.log(`   Nguồn: ${rel(MD)} · Sơ đồ điều hướng: ${nav ? 'có' : 'THIẾU'} · Hành trình: ${flows ? 'có' : 'THIẾU'}`);
if (missingAscii.length) console.log(`   ⚠️  ${missingAscii.length} màn thiếu ascii-screen.md: ${missingAscii.join(', ')}`);
