#!/usr/bin/env node
/*
 * ba-toolkit/real-cut.js — CẮT LÁT HÌNH THẬT từ một dự án đích vào kho `fixtures/real/<P>/`, có ẩn danh (W2). Zero-dependency.
 *
 *   node .claude/skills/ba-toolkit/scripts/real-cut.js --from <gốc dự án> --as P3 --screens S12,S14 \
 *        [--add <đường dẫn tương đối>]… [--code <file|thư mục tương đối>]… [--since <commit>] [--skip <01-requirements.md>]… [--trim <đường dẫn>=<số dòng>]… [--nodiff <đường dẫn>]… [--map <bản đồ.json>] [--dry]
 *   node .claude/skills/ba-toolkit/scripts/real-cut.js --check [--only P3] [--json]      # quét rò rỉ trên cả kho
 *   (thử nghiệm: --kho <thư mục kho> · --map-dir <thư mục bản đồ> cho --check)
 *
 * Cắt: `docs/` gồm 00-tracking, 07, các sổ (00-cr/backlog/changelog/decisions/gaps), tài liệu số 01–12 (gốc hoặc
 * `Ho-so/`, qua docpath.js) + folder các màn `--screens` (Screen-spec/[Nhóm/]<Mã> - <Tên>, hoặc kiểu phẳng cũ) +
 * `--add` (file/thư mục bất kỳ trong dự án) + `--code` (lát cắt code, giữ đường dẫn gốc). `--since <a>` → `diff/range.diff`
 * = `git diff <a>` (a → cây làm việc, đúng cây đã chép) CHỈ trên file đã cắt (để real-run dựng repo tạm cho checker đọc khoảng git). Chỉ chép file chữ;
 * ảnh/nhị phân bỏ (ghi số lượng vào SOURCE.md). Không bao giờ chép `.env*`, khoá, credential.
 *
 * Ẩn danh (luôn áp, cả nội dung lẫn đường dẫn): bản đồ riêng `~/.ba-toolkit/real-map/<P>.json` (mặc định; NGOÀI repo)
 * `{ "thay": {"Tên thật": "Tên giả", …} }` — thay cả biến thể thường/HOA; rồi mẫu chung: email → user@example.test ·
 * URL ngoài allowlist (localhost, cdn, w3, schema…) → https://example.test/x · số ĐT VN → 0900000000 · IPv4 (trừ
 * 127.0.0.1/0.0.0.0) → 10.0.0.1 · /Users/x/ /home/x/ (mọi tên) → ~/ · chuỗi giống khoá (sk-/ghp_/AKIA…, JWT, hex ≥32) → giữ độ
 * dài, thay ký tự. `--check` quét lại bằng cùng mẫu + mọi khoá `thay` của bản đồ (nếu máy có) → exit = số chỗ rò.
 *
 * VÌ SAO CÓ (docs/decisions/25 W2, 29): checker sinh từ example/ (hình chuẩn) rồi oan/im trên dự án thật — mỗi lần
 * phát hiện là một lần chạy tay trên máy người dùng, không thành ca hồi quy. Kho hình thật cho test.js chạy mọi checker
 * trên hình thật mỗi lần; công cụ cắt có sẵn để lát mới vào kho rẻ và ẩn danh có kỷ luật (một trong các kho là repo công ty).
 *
 * gioiHan: ẩn danh bằng MẪU — tên riêng không có trong bản đồ (tên người trong biên bản, tên khách) lọt được; `--check`
 * không chứng minh sạch, chỉ bắt dạng đã biết — người đọc lướt kho trước khi push. Thay chuỗi có thể đổi độ dài dòng
 * (checker đếm cột/byte có thể lệch nhẹ so với bản gốc). Diff chứa file ngoài lát cắt bị lọc; diff không áp ngược sạch
 * (vd file đã ẩn danh khác) → real-run báo, không đoán.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ (lint 43)
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { resolveDoc } = require('./docpath');

const argv = process.argv.slice(2);
const giáTrị = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
const nhiều = (k) => argv.flatMap((a, i) => (a === k && argv[i + 1] ? [argv[i + 1]] : []));
const KHO = path.resolve(giáTrị('--kho') || path.join(__dirname, '..', '..', '..', '..', 'fixtures', 'real'));
const BẢN_ĐỒ_MẶC_ĐỊNH = (p) => path.join(giáTrị('--map-dir') || path.join(os.homedir(), '.ba-toolkit', 'real-map'), `${p}.json`);

const ĐUÔI_CHỮ = new Set(['.md', '.html', '.htm', '.css', '.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.tsx', '.jsx', '.json', '.jsonl', '.py', '.sql', '.yml', '.yaml', '.txt', '.diff', '.dbml', '.vue', '.svelte', '.http', '.toml', '.sh', '.prisma', '.graphql', '.csv', '.svg']);
const CẤM = /(^|\/)(\.env[^/]*|.*\.(pem|key|p12|pfx)|id_rsa[^/]*|credentials?[^/]*|secrets?[^/]*|\.npmrc|node_modules|\.git)(\/|$)/i;
const SỔ_VÀ_SỐ = ['00-tracking.md', '00-cr.md', '00-backlog.md', '00-changelog.md', '00-decisions.md', '00-gaps.md', '00-figma-sync.md', '00-glossary.md',
  '01-requirements.md', '02-functions.md', '03-overview.md', '05-data-model.md', '06-api-spec.md', '07-design-system.md', '10-architecture.md', '11-integration.md', '12-api-integration.md'];
const URL_GIỮ = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|example\.(test|com|org)|[^/]*\.example\.test|www\.w3\.org|schema\.org|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com|fonts\.(googleapis|gstatic)\.com|mermaid\.js\.org|github\.com\/mermaid-js|developer\.mozilla\.org|tailwindcss\.com|cdn\.tailwindcss\.com|code\.jquery\.com|dbdiagram\.io|www\.figma\.com\/(file|design)\/x)([:/?#]|$)/i;

const MẪU = [
  ['email', /\b[A-Za-z0-9._%+-]+@(?!example\.(?:test|com|org)\b)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.(?!(?:md|mdx|ts|tsx|js|jsx|mjs|json|html|css|py|txt)\b)[A-Za-z]{2,}\b/g, () => 'user@example.test'], // R-S01-N03@test.md là mã + tên file, không phải email
  ['url', /https?:\/\/[^\s"'<>)`\]|\\]+/g, (m) => (URL_GIỮ.test(m) ? m : 'https://example.test/x')],
  ['dt', /(?<![\d.\w])(?:\+84|0)[ .]?(?:3|5|7|8|9)\d(?:[ .]?\d){7}(?![\d\w])/g, (m) => (/^0900000000$/.test(m) ? m : '0900000000')], // cả '0901 234 567', '+84 912345678'
  ['ip', /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g, (m) => (/^(127\.0\.0\.1|0\.0\.0\.0|10\.0\.0\.1)$/.test(m) ? m : '10.0.0.1')],
  ['home', /\/(?:Users|home)\/(?!x\/)[^/\s"'`]+\//g, () => '~/'],
  ['khoá', /\b(?:sk-(?:ant-)?|ghp_|gho_|github_pat_|xox[abp]-|AKIA|AIza)[A-Za-z0-9_-]{12,}/g, (m) => m.slice(0, 4) + 'x'.repeat(m.length - 4)],
  ['jwt', /\beyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}/g, (m) => 'eyJ' + 'x'.repeat(m.length - 3)],
  ['hex', /\b(?![0a]{32,}\b)[A-Fa-f0-9]{32,}\b/g, (m) => 'a'.repeat(m.length)],
];

function bảnĐồ(file) {
  if (!file || !fs.existsSync(file)) return { thay: [] };
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  const cặp = new Map();
  for (const [thật, giả] of Object.entries(j.thay || {})) {
    if (!thật || thật.length < 3) continue; // khoá quá ngắn thay bừa
    for (const [a, b] of [[thật, giả], [thật.toLowerCase(), giả.toLowerCase()], [thật.toUpperCase(), giả.toUpperCase()]]) if (!cặp.has(a)) cặp.set(a, b);
  }
  return { thay: [...cặp].sort((x, y) => y[0].length - x[0].length) };
}

const ngoặc = (a) => (/\s/.test(a) ? `"${a}"` : a);
const thoát = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function ẩnDanh(t, bđ) {
  for (const [a, b] of bđ.thay) t = t.split(a).join(b);
  for (const [, re, f] of MẪU) t = t.replace(re, f);
  return t;
}

function đi(gốc, rel, ra) {
  const abs = path.join(gốc, rel);
  if (CẤM.test(rel)) return;
  let st; try { st = fs.statSync(abs); } catch { return; }
  if (st.isDirectory()) { for (const c of fs.readdirSync(abs)) đi(gốc, path.join(rel, c), ra); return; }
  ra.add(rel.split(path.sep).join('/'));
}

function folderMàn(docs, mã) {
  const kq = [];
  const xét = (dir, sâu) => {
    let ds = []; try { ds = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const d of ds) {
      if (!d.isDirectory()) continue;
      if (new RegExp(`^${thoát(mã)}(?:\\s+-\\s|[-_ ])`).test(d.name)) kq.push(path.join(dir, d.name));
      else if (sâu < 1 && !/^(Ho-so|decisions|removed)$/.test(d.name)) xét(path.join(dir, d.name), sâu + 1);
    }
  };
  xét(path.join(docs, 'Screen-spec'), 0);
  if (!kq.length) xét(docs, 0); // kiểu phẳng trước 13/08/2026: docs/<Mã> - <Tên>
  return kq;
}

function cắt() {
  const từ = path.resolve(giáTrị('--from') || '');
  const P = giáTrị('--as');
  if (!giáTrị('--from') || !fs.existsSync(path.join(từ, 'docs'))) { console.error('Thiếu --from <gốc dự án có docs/>'); process.exit(2); }
  if (!/^P\d+$/.test(P || '')) { console.error('Thiếu --as P<n>'); process.exit(2); }
  const bđ = bảnĐồ(giáTrị('--map') || BẢN_ĐỒ_MẶC_ĐỊNH(P));
  const docs = path.join(từ, 'docs');
  const tập = new Set();
  const bỏQua = new Set(nhiều('--skip'));
  for (const f of SỔ_VÀ_SỐ.filter((x) => !bỏQua.has(x))) { const r = resolveDoc(docs, f); if (r) đi(từ, path.relative(từ, r), tập); }
  const mànThiếu = [];
  for (const mã of (giáTrị('--screens') || '').split(',').map((s) => s.trim()).filter(Boolean)) {
    const fs_ = folderMàn(docs, mã);
    if (!fs_.length) mànThiếu.push(mã);
    for (const d of fs_) đi(từ, path.relative(từ, d), tập);
  }
  for (const a of [...nhiều('--add'), ...nhiều('--code')]) đi(từ, a, tập);
  if (mànThiếu.length) { console.error(`Không thấy folder màn: ${mànThiếu.join(', ')}`); process.exit(2); }

  const đích = path.join(KHO, P);
  const chữ = [...tập].filter((r) => ĐUÔI_CHỮ.has(path.extname(r).toLowerCase())).sort();
  const bỏ = tập.size - chữ.length;
  let byte = 0;
  const ghi = [];
  const cắtNgắn = new Map(nhiều('--trim').map((x) => { const i = x.lastIndexOf('='); return [x.slice(0, i), +x.slice(i + 1)]; }));
  for (const r of chữ) {
    let thô = fs.readFileSync(path.join(từ, r), 'utf8');
    if (cắtNgắn.get(r) > 0) thô = thô.split('\n').slice(0, cắtNgắn.get(r)).join('\n') + '\n'; // sổ khổng lồ: giữ đầu (header + bảng), hình vẫn thật
    const nội = ẩnDanh(thô, bđ);
    ghi.push([ẩnDanh(r, bđ), nội]);
    byte += Buffer.byteLength(nội);
  }
  let diff = '';
  const range = giáTrị('--since');
  if (range) {
    try { diff = execFileSync('git', ['-C', từ, 'diff', '--no-color', '--no-ext-diff', range, '--', ...chữ.filter((r) => !(cắtNgắn.get(r) > 0) && !nhiều('--nodiff').includes(r))], { encoding: 'utf8', maxBuffer: 64 << 20 }); }
    catch (e) { console.error(`git diff ${range} (→ cây làm việc) hỏng: ${(e.stderr || e.message).toString().slice(0, 200)}`); process.exit(2); }
    diff = ẩnDanh(diff, bđ);
  }
  const sha = (() => { try { return execFileSync('git', ['-C', từ, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return '—'; } })();
  console.log(`${P}: ${ghi.length} file chữ (${(byte / 1024).toFixed(0)} KB) · bỏ ${bỏ} nhị phân · diff ${diff ? diff.split('\n').length + ' dòng' : '—'} · bản đồ ${bđ.thay.length} khoá`);
  if (byte > 1.5 * 1024 * 1024) console.error(`⚠️ ${P} > 1,5 MB — cân nhắc bớt màn/code`);
  if (argv.includes('--dry')) { ghi.forEach(([r]) => console.log('  ' + r)); return; }

  // Giữ SOURCE.md người viết (phần "Vì sao"), làm mới phần máy sinh
  const srcFile = path.join(đích, 'SOURCE.md');
  const cũ = fs.existsSync(srcFile) ? fs.readFileSync(srcFile, 'utf8') : '';
  const vìSao = (cũ.match(/## Vì sao[\s\S]*$/) || ['## Vì sao\n\n- (hình oan nào ở file nào — người cắt điền)\n'])[0];
  if (fs.existsSync(đích)) for (const c of fs.readdirSync(đích)) if (c !== 'SOURCE.md') fs.rmSync(path.join(đích, c), { recursive: true, force: true }); // cắt lại = thay trọn
  for (const [r, nội] of ghi) { const f = path.join(đích, r); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, nội); }
  if (diff) { fs.mkdirSync(path.join(đích, 'diff'), { recursive: true }); fs.writeFileSync(path.join(đích, 'diff', 'range.diff'), diff); }
  const ngày = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(srcFile, `# ${P}\n\n- Cắt: ${ngày} · commit nguồn \`${sha}\`${range ? ` · diff từ \`${range.replace(/[0-9a-f]{12,}/g, (h) => h.slice(0, 8))}\` tới cây đã chép` : ''}\n- Màn: ${giáTrị('--screens') || '—'} · ${ghi.length} file chữ · bỏ ${bỏ} nhị phân\n- Cắt lại: \`real-cut.js --from <dự án> --as ${P} --screens ${giáTrị('--screens') || ''}${nhiều('--add').map((a) => ' --add ' + ngoặc(ẩnDanh(a, bđ))).join('')}${nhiều('--code').map((a) => ' --code ' + ngoặc(ẩnDanh(a, bđ))).join('')}${nhiều('--skip').map((a) => ' --skip ' + a).join('')}${nhiều('--trim').map((a) => ' --trim ' + ngoặc(ẩnDanh(a, bđ))).join('')}${nhiều('--nodiff').map((a) => ' --nodiff ' + ngoặc(ẩnDanh(a, bđ))).join('')}${range ? ' --since <commit>' : ''}\`\n\n${vìSao}`);
}

function kiểm() {
  const only = giáTrị('--only');
  const rò = [];
  let Ps = []; try { Ps = fs.readdirSync(KHO).filter((d) => /^P\d+$/.test(d) && (!only || d === only)); } catch { /* kho chưa có */ }
  for (const P of Ps) {
    const bđ = bảnĐồ(BẢN_ĐỒ_MẶC_ĐỊNH(P));
    const tập = new Set(); đi(path.join(KHO, P), '.', tập);
    for (const r of tập) {
      if (CẤM.test(r)) { rò.push({ P, file: r, dòng: 0, loại: 'file-cấm', mẫu: path.basename(r) }); continue; }
      if (!ĐUÔI_CHỮ.has(path.extname(r).toLowerCase())) { rò.push({ P, file: r, dòng: 0, loại: 'nhị-phân', mẫu: path.extname(r) }); continue; }
      for (const [a] of bđ.thay) if (r.includes(a)) rò.push({ P, file: r, dòng: 0, loại: 'bản-đồ', mẫu: a });
      fs.readFileSync(path.join(KHO, P, r), 'utf8').split('\n').forEach((l, i) => {
        for (const [loại, re, f] of MẪU) for (const m of l.match(re) || []) if (f(m) !== m) rò.push({ P, file: r, dòng: i + 1, loại, mẫu: m.slice(0, 60) });
        for (const [a] of bđ.thay) if (l.includes(a)) rò.push({ P, file: r, dòng: i + 1, loại: 'bản-đồ', mẫu: a });
      });
    }
  }
  if (argv.includes('--json')) console.log(JSON.stringify({ kho: path.relative(process.cwd(), KHO), P: Ps, rò }, null, 1));
  else {
    console.log(`real-cut --check: ${Ps.length} P · ${rò.length} chỗ rò`);
    for (const x of rò.slice(0, 50)) console.log(`  ❌ ${x.P}/${x.file}:${x.dòng} [${x.loại}] ${x.mẫu}`);
    if (rò.length > 50) console.log(`  … +${rò.length - 50}`);
  }
  process.exit(Math.min(rò.length, 125));
}

if (argv.includes('--check')) kiểm(); else cắt();
