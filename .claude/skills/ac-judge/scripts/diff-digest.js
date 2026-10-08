#!/usr/bin/env node
/*
 * ac-judge/diff-digest.js — TÓM TẮT MÁY của một khoảng diff để judge chọn file đọc kỹ thay vì mở cả 137 file. Zero-dependency.
 *
 *   node .claude/skills/ac-judge/scripts/diff-digest.js --range <base>..<head> [--root <repo>] [--budget 3000] [--paths <file>] [--plain|--json]
 *     --paths <file>: mỗi dòng một đường dẫn (pathspec) — chỉ digest các file đó. Dùng khi base..head gồm cả màn khác
 *     (dự án helpdesk S12: 2b9423f..HEAD = 739 file vì S13–S16 xen giữa; lọc theo file của commit `(S12)` còn 93).
 *
 * Mỗi file một dòng: tầng · +/− · hàm/route/bảng/export đổi · cờ NHẠY. Tầng suy từ đường dẫn (domain / service / controller /
 * infra / migration / ui / test / docs / config). Cờ nhạy = tên file hoặc dòng thêm chạm auth|guard|permission|password|
 * token|secret|session|migration|transaction|raw sql|crypto. Xếp hạng đọc: nhạy trước, rồi controller/service/domain theo
 * số dòng; đề xuất "đọc kỹ" tới khi hết `--budget` dòng lõi (mặc định 3 000), còn lại "đọc theo mẫu"/"lướt".
 *
 * Vì sao có: judge vòng 1 S15 (dự án helpdesk 16/09/2026) nhận diff 16 k dòng, 137 file → 397 k token, 6,3 k token/tool use, và vẫn
 * phải khai 22 component "chưa đọc". Máy đếm được dòng và tên hàm; judge chỉ nên tốn ngữ cảnh cho chỗ có rủi ro.
 *
 * gioiHan: tên hàm bắt bằng regex (JS/TS/Python/Go/Rust/Java cơ bản) — hàm ẩn danh/arrow gán biến chỉ thấy khi `const x = (`;
 * cờ nhạy là từ khoá, không phải phân tích luồng; không đọc nội dung file ngoài diff.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs');

const argv = process.argv.slice(2);
const opt = (k, d = null) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const RANGE = opt('--range'); const ROOT = path.resolve(opt('--root', process.cwd()));
const PATHS = opt('--paths') ? fs.readFileSync(opt('--paths'), 'utf8').split('\n').map((l) => l.trim()).filter(Boolean) : [];
const SPEC = PATHS.length ? ['--', ...PATHS] : [];
const BUDGET = +opt('--budget', 3000); const JSON_MODE = argv.includes('--json');
if (!RANGE) { console.error('Dùng: diff-digest.js --range <base>..<head> [--root <repo>] [--budget 3000]'); process.exit(2); }

const git = (args) => spawnSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 1e9 });
const ns = git(['diff', '--numstat', RANGE, ...SPEC]); if (ns.status !== 0) { console.error('git diff lỗi: ' + ns.stderr.trim()); process.exit(2); }
const diff = git(['diff', '-U0', RANGE, ...SPEC]).stdout || '';

const TẦNG = [
  ['migration', /migrations?\//], ['test', /(^|\/)(tests?|__tests__|e2e|spec)\/|\.(test|spec)\.[jt]sx?$|\.test\.m?ts$/],
  ['docs', /^docs\/|\.md$/], ['config', /(^|\/)(package(-lock)?\.json|tsconfig|vite\.config|vitest\.config|\.env|prisma\/schema\.prisma)/],
  ['ui', /\.(tsx|jsx|vue|svelte)$|\/(web|client|frontend|components|screens|pages)\//], ['controller', /controller|router|routes|handler|entrypoints/],
  ['infra', /infrastructure|infra|\/db\/|prisma|redis|queue|telegram|http\.ts$/], ['domain', /\/domain\//], ['service', /service|repository|\/modules\//],
];
const tầngCủa = (f) => (TẦNG.find(([, re]) => re.test(f)) || ['khác'])[0];
const NHẠY = /auth|guard|permission|quyen|password|mat.?khau|token|secret|session|phien|migration|transaction|giao.?dich|\$queryRaw|\$executeRaw|crypto|argon|bcrypt|jwt|cookie|csrf|cors/i;
const RE_HÀM = /^\+\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\(|[A-Za-z_$][\w$]*\s*=>)|class\s+([A-Za-z_$][\w$]*)|def\s+([A-Za-z_]\w*)|func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)|(?:pub\s+)?fn\s+([A-Za-z_]\w*)|(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\]]+\s+([A-Za-z_]\w*)\s*\([^)]*\)\s*\{)/;
const RE_ROUTE = /^\+.*\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/i;
const RE_BẢNG = /^\+\s*(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|UNIQUE INDEX)\s+(?:IF (?:NOT )?EXISTS\s+)?"?([\w.]+)"?|^\+\s*model\s+(\w+)\s*\{/i;

// gom theo file từ diff -U0
const files = {};
let cur = null;
for (const l of diff.split('\n')) {
  const m = l.match(/^\+\+\+ b\/(.+)$/); if (m) { cur = m[1]; files[cur] = files[cur] || { hàm: new Set(), route: new Set(), bảng: new Set(), nhạyDòng: 0 }; continue; }
  if (/^--- /.test(l) || !cur || !/^[+-]/.test(l) || /^\+\+\+|^---/.test(l)) continue;
  const f = files[cur];
  if (l[0] === '+') {
    const h = l.match(RE_HÀM); if (h) { const tên = h.slice(1).find(Boolean); if (tên && !/^(if|for|while|switch|return|catch)$/.test(tên)) f.hàm.add(tên); }
    const r = l.match(RE_ROUTE); if (r) f.route.add(`${r[1].toUpperCase()} ${r[2]}`);
    const b = l.match(RE_BẢNG); if (b) f.bảng.add(b[1] || b[2]);
    if (NHẠY.test(l)) f.nhạyDòng++;
  }
}
const rows = [];
for (const line of ns.stdout.split('\n')) {
  const [a, d, f] = line.split('\t'); if (!f) continue;
  const thêm = +a || 0, bớt = +d || 0; const x = files[f] || { hàm: new Set(), route: new Set(), bảng: new Set(), nhạyDòng: 0 };
  const tầng = tầngCủa(f);
  // nhạy = tên file chạm từ khoá HOẶC ≥ 5 dòng thêm chạm — màn phân quyền thì file nào cũng có chữ "quyen", một dòng không đủ; test/docs không bao giờ "nhạy"
  const nhạy = !/^(test|docs)$/.test(tầng) && (NHẠY.test(path.basename(f)) || x.nhạyDòng >= 5);
  rows.push({ file: f, tầng, thêm, bớt, hàm: [...x.hàm].slice(0, 12), route: [...x.route], bảng: [...x.bảng], nhạy, nhạyDòng: x.nhạyDòng });
}
// xếp hạng đọc
const ưuTiên = { migration: 0, controller: 1, service: 2, domain: 3, infra: 4, ui: 5, config: 6, test: 7, docs: 8, khác: 9 };
rows.sort((a, b) => (b.nhạy - a.nhạy) || (b.nhạyDòng - a.nhạyDòng) || (ưuTiên[a.tầng] - ưuTiên[b.tầng]) || (b.thêm + b.bớt) - (a.thêm + a.bớt));
let còn = BUDGET;
for (const r of rows) {
  const lõi = r.tầng === 'test' || r.tầng === 'docs' ? 0 : r.thêm + r.bớt;
  if (r.tầng === 'docs') r.đọc = 'lướt';
  else if (r.tầng === 'test') r.đọc = 'soi assert theo TC';
  else if (còn > 0) { r.đọc = r.nhạy ? 'ĐỌC KỸ (nhạy)' : 'đọc kỹ'; còn -= lõi; }
  else if (r.nhạy) r.đọc = 'nhạy — hết ngân sách, nêu "chưa đọc" hoặc tăng --budget';
  else r.đọc = r.tầng === 'ui' ? 'đọc theo mẫu' : 'lướt';
}
const tổng = rows.reduce((a, r) => ({ thêm: a.thêm + r.thêm, bớt: a.bớt + r.bớt }), { thêm: 0, bớt: 0 });
const theoTầng = {}; for (const r of rows) theoTầng[r.tầng] = (theoTầng[r.tầng] || 0) + 1;
const out = { range: RANGE, files: rows.length, ...tổng, theoTầng, budget: BUDGET, đọcKỹ: rows.filter((r) => /kỹ/i.test(r.đọc)).length, nhạy: rows.filter((r) => r.nhạy).length, rows,
  gioiHan: ['tên hàm bắt bằng regex, hàm ẩn danh không thấy', 'cờ nhạy là từ khoá trong tên file/dòng thêm, không phải phân tích luồng'] };
if (JSON_MODE) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log(`diff-digest ${RANGE}: ${rows.length} file · +${tổng.thêm}/−${tổng.bớt} · ${Object.entries(theoTầng).map(([k, v]) => `${k} ${v}`).join(' · ')} · nhạy ${out.nhạy} · đề xuất đọc kỹ ${out.đọcKỹ} file (ngân sách ${BUDGET} dòng lõi)`);
console.log('  | Đọc | Tầng | +/− | File | Hàm/route/bảng đổi |'); console.log('  |---|---|---|---|---|');
for (const r of rows) console.log(`  | ${r.đọc} | ${r.tầng} | +${r.thêm}/−${r.bớt}${r.nhạy ? ' ⚠' + r.nhạyDòng : ''} | ${r.file} | ${[...r.route, ...r.bảng, ...r.hàm].slice(0, 8).join(', ')}${r.hàm.length > 8 ? ', …' : ''} |`);
process.exit(0);
