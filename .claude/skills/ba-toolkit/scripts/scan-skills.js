#!/usr/bin/env node
/*
 * ba-toolkit/scan-skills.js — QUÉT BẢO MẬT SKILL TRƯỚC KHI CÀI. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ba-toolkit/scripts/scan-skills.js [<gốc .claude>] [--json|--plain]
 *   (thử nghiệm: --allowlist <file.json>|none · --today YYYY-MM-DD)
 *
 * Vì sao có: `ba-export/install.js` chép skill sang dự án đích VÀ gắn 3 hook (hook-guard · hook-lint · hook-gate) vào
 * settings.json đích — chúng chạy ở mỗi Read/Edit/Stop. Nguồn bị xâm nhập = code lạ chạy ở MỌI dự án đích, không ai
 * gõ lệnh. `dev-*` (clone superpowers) và `steal` nhận nội dung từ ngoài; `upstream-diff.js` chỉ so hash, không đọc
 * nội dung. Ý tưởng từ agent-skills (`scan-skills.ts` + `security-scan-allowlist.yaml`): quét trước khi phát hành,
 * ngoại lệ phải có người duyệt; ta thêm HẠN — ngoại lệ không hạn là cửa mở vĩnh viễn.
 *
 * Quét: `<gốc>/skills/**` (bỏ node_modules) · `<gốc>/agents/*.md` · khối do ba-export quản lý trong `<gốc>/../CLAUDE.md`.
 * Mỗi hit: file:dòng · loại · mức 🔴/🟡 · trích ≤100 ký tự. Loại:
 *   injection 🔴 / injection-nhe 🟡  câu kiểu prompt injection (mọi file chữ)
 *   vo-hinh 🔴     ký tự vô hình/bidi (zero-width, điều hướng bidi, BOM giữa file); ZWJ giữa hai emoji không tính
 *   tai-chay 🔴    tải từ mạng rồi nối ống vào shell/trình thông dịch, PowerShell tải-rồi-chạy, eval cạnh lệnh mạng
 *   mang 🔴        gọi/mở mạng trong script (http/https/net/tls/dgram, fetch, WebSocket; .sh: curl/wget)
 *   shell 🔴       child_process với tuỳ chọn shell bật · shell-ghep 🔴 exec/execSync với lệnh không phải chuỗi hằng
 *   eval 🟡        eval / new Function / vm.run* trong script
 *   bi-mat 🔴      đường dẫn khoá SSH riêng / credential AWS·npm·netrc, biến env kiểu TOKEN/SECRET, chuỗi
 *                  kết thúc .env trong script, dump cả process.env
 *   ghi-ngoai 🔴   script vừa lấy thư mục home vừa có lệnh ghi file · persist 🔴 ghi rc shell / crontab / LaunchAgents
 *   base64 🟡      chuỗi base64 ≥200 ký tự trong .md
 * Allowlist có hạn `ba-toolkit/references/security-allowlist.json`: `[{file, loai, ly_do, nguoi_duyet, het_han}]`
 * (file tương đối từ gốc .claude, vd `skills/ba-launcher/scripts/server.js`; CLAUDE.md ghi `../CLAUDE.md`). Hit khớp
 * mục CÒN HẠN (het_han ≥ hôm nay) → "đã duyệt", không đổi exit. Mục hết hạn / không còn khớp hit nào (mồ côi) /
 * sai dạng → cảnh báo (hit của mục hết hạn trở lại chưa duyệt).
 *
 * Exit: 0 sạch (🟡 không đổi exit) · 1 có 🔴 chưa duyệt · 2 lỗi hạ tầng (không thấy gốc, allowlist hỏng JSON).
 *
 * gioiHan: regex theo dòng — ĐẾM, không phán ý đồ. Không thấy mã được làm rối (tên hàm ghép chuỗi, require động,
 * base64 trong .js, Unicode đồng hình), không thấy lệnh mạng do script gọi sang chương trình khác (git, npx, chrome),
 * không đọc file nhị phân. Allowlist tính theo file+loại: một mục duyệt MỌI hit cùng loại trong file đó, kể cả hit
 * thêm về sau — hạn ngắn là cách bù. Allowlist đi cùng nguồn: nguồn bị xâm nhập sửa được cả allowlist → hạn + người
 * duyệt + diff allowlist trong review là tuyến phòng thủ, không phải script này.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const cờ = (k) => argv.includes(k);
const giáTrị = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
const vịTrí = argv.filter((a, i) => !a.startsWith('--') && !['--allowlist', '--today'].includes(argv[i - 1]));
const JSON_OUT = cờ('--json');
const PLAIN = cờ('--plain');

const GIOI_HAN = 'regex theo dòng, đếm không phán; không thấy mã làm rối, lệnh mạng qua chương trình khác, file nhị phân; allowlist theo file+loại';

const gốc = path.resolve(vịTrí[0] || '.claude');
if (!fs.existsSync(path.join(gốc, 'skills'))) {
  console.error(`scan-skills: không thấy ${path.join(gốc, 'skills')} — truyền gốc .claude (vd \`.claude\`).`);
  process.exit(2);
}
const hômNay = giáTrị('--today') || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(hômNay)) { console.error(`scan-skills: --today ${hômNay} không phải YYYY-MM-DD`); process.exit(2); }

// ─── Luật ────────────────────────────────────────────────────────────────────
// Viết regex sao cho CHÍNH file này không khớp (mọi mẫu có \s, nhóm hay lớp ký tự giữa các chữ) — đừng thêm ví dụ
// nguyên văn vào chú thích: scanner quét cả chính nó, và tự miễn cho mình là lỗ hổng.
const SCRIPT_EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.sh', '.py', '.html']);
const CODE_EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.html']);

const LUẬT_CHỮ = [ // mọi file chữ
  ['injection', '🔴', /\b(?:ignore|disregard|forget)\s+(?:all\s+|any\s+|the\s+|your\s+)?(?:previous|prior|above|earlier|preceding)\s+(?:instructions?|prompts?|rules|directions|context)\b/i],
  ['injection', '🔴', /\bignore\s+(?:all|any)\s+(?:instructions?|rules|guidelines)\b/i],
  ['injection', '🔴', /\bbỏ\s+qua\s+(?:mọi|tất\s+cả|toàn\s+bộ)\s+(?:các\s+)?(?:hướng\s+dẫn|chỉ\s+dẫn|chỉ\s+thị|quy\s+tắc)\b/i],
  ['injection', '🔴', /\bbỏ\s+qua\s+(?:các\s+)?(?:hướng\s+dẫn|chỉ\s+dẫn|chỉ\s+thị)\s+(?:trước|ở\s+trên|phía\s+trên)/i],
  ['injection', '🔴', /\bquên\s+(?:mọi|tất\s+cả|hết)\s+(?:các\s+)?(?:hướng\s+dẫn|chỉ\s+dẫn|chỉ\s+thị)/i],
  ['injection', '🔴', /\byou\s+are\s+now\s+(?:a|an|the|in|no\s+longer|DAN)\b/i],
  ['injection', '🔴', /\b(?:new|override|updated|real)\s+system\s+prompt\b/i],
  ['injection', '🔴', /\b(?:do\s+not|don't|never)\s+(?:tell|inform|notify)\s+the\s+user\b/i],
  ['injection', '🔴', /\b(?:đừng|không\s+được)\s+(?:nói|báo)\s+(?:cho\s+)?người\s+dùng\s+(?:biết\s+)?(?:rằng|là|về)/i],
  ['injection', '🔴', /<\|?\s*(?:im_start|system)\s*\|?>/i],
  ['injection-nhe', '🟡', /\bsystem\s+prompt\b/i],
  ['tai-chay', '🔴', /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sudo\s+)?(?:ba|z|da|k)?sh\b/],
  ['tai-chay', '🔴', /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sudo\s+)?(?:node|python3?|perl|ruby)\b/],
  ['tai-chay', '🔴', /\b(?:ba|z)?sh\s+<\(\s*(?:curl|wget)\b/],
  ['tai-chay', '🔴', /\b(?:ie[x]|Invoke-E[x]pression)\b[^\n]*\b(?:ir[m]|iw[r]|Invoke-WebReques[t]|Invoke-RestMetho[d]|DownloadStrin[g])\b/i],
  ['persist', '🔴', />>?\s*["']?~?\/?[^\s"']*\.(?:bashrc|zshrc|bash_profile|zprofile|profile)\b/],
  ['persist', '🔴', /\bcrontab\s+-\s*(?:l|e)?\b|\bLaunchAgents\/[^\s]*\.plist\b/],
];
const LUẬT_BÍ_MẬT = [ // mọi file chữ (md chỉ dẫn đọc khoá cũng tính)
  ['bi-mat', '🔴', /~\/\.(?:ssh|aws|gnupg|kube|docker)\b|["'`/]\.(?:ssh|aws|gnupg)\/|["'`]\.(?:ssh|aws|gnupg)["'`]/],
  ['bi-mat', '🔴', /\bid_(?:rsa|dsa|ecdsa|ed25519)\b/],
  ['bi-mat', '🔴', /["'`/~]\.(?:npmrc|netrc|pypirc)\b|\.docker\/config\.json|\baws\/credentials\b/],
];
const LUẬT_SCRIPT = [ // chỉ file script
  ['mang', '🔴', /\brequire\(\s*["'](?:node:)?(?:https?|net|tls|dgram|http2)["']\s*\)|\bfrom\s+["'](?:node:)?(?:https?|net|tls|dgram|http2)["']/],
  ['mang', '🔴', /\bhttps?2?\.(?:request|get|connect)\s*\(/],
  ['mang', '🔴', /(?<![.\w$])fetch\s*\(/],
  ['mang', '🔴', /\b(?:net|tls)\.(?:connect|createConnection)\s*\(|\bdgram\.createSocket\s*\(/],
  ['mang', '🔴', /\bnew\s+WebSocket\s*\(|\bXMLHttpRequest\b|\bnavigator\.sendBeacon\s*\(/],
  ['shell', '🔴', /\bshell\s*:\s*(?:true|["'`]\/?(?:bin\/)?(?:ba|z)?sh["'`])/],
  ['shell-ghep', '🔴', /\bexecSync\s*\(\s*(?!["'][^"'`$]*["']\s*[,)])[^)\s]/],
  ['eval', '🟡', /(?<![.\w$-])eval\s*\(|\bnew\s+Function\s*\(|\bvm\.run(?:InNewContext|InThisContext|InContext)\s*\(/],
  ['bi-mat', '🔴', /(?:process\.env\.|process\.env\[\s*["']|\$\{?|os\.environ\[?\s*["']?|getenv\(\s*["'])[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|APIKEY|PRIVATE_KEY|ACCESS_KEY)\b/],
  ['bi-mat', '🔴', /\b(?:JSON\.stringify|Object\.(?:entries|keys|values))\(\s*process\.env\s*\)/],
  ['bi-mat', '🔴', /["'`][^"'`\n]*(?:^|[/\\])\.env(?:\.[\w-]+)?["'`]|["'`]\.env(?:\.[\w-]+)?["'`]/],
];
const LUẬT_SH = [['mang', '🔴', /(?:^|[\s;|&(])(?:curl|wget|nc|ncat|scp|rsync)\s/]];
const LUẬT_MD = [['base64', '🟡', /[A-Za-z0-9+/]{200,}={0,2}/]];
// Cần ngữ cảnh cả file: exec( không có dấu chấm trước chỉ là child_process khi file có nạp child_process (tránh RegExp.exec).
const EXEC_TRẦN = /(?<![.\w$])exec\s*\(\s*(?!["'][^"'`$]*["']\s*[,)])[^)\s]|\b(?:cp|child_process|childProcess)\.exec\s*\(\s*(?!["'][^"'`$]*["']\s*[,)])[^)\s]/;
const CÓ_CP = /\brequire\(\s*["'](?:node:)?child_process["']\s*\)|\bfrom\s+["'](?:node:)?child_process["']/;
const HOME = /\bos\.homedir\s*\(|\bprocess\.env\.(?:HOME|USERPROFILE)\b|\bhomedir\s*\(\s*\)/;
const GHI = /\b(?:writeFileSync|appendFileSync|createWriteStream|writeFile|appendFile|copyFileSync|renameSync|mkdirSync|rmSync|unlinkSync|cpSync)\s*\(/;

// Ký tự vô hình / bidi. U+200D (ZWJ) giữa hai ký tự ngoài ASCII (chuỗi emoji ghép) là hợp lệ.
const VÔ_HÌNH = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u2060-\u2064\u00AD]/g;
const BIDI = /[\u202A-\u202E\u2066-\u2069\u200E\u200F]/;

const trích = (dòng, i) => {
  const s = Math.max(0, i - 30);
  let t = dòng.slice(s, s + 100).replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u2060-\u2064\u00AD]/g, (c) => `<U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}>`);
  return t.replace(/\s+/g, ' ').trim().slice(0, 100);
};

// ─── Thu tệp ─────────────────────────────────────────────────────────────────
function walk(dir, out = []) {
  let es = [];
  try { es = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of es) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out); else if (e.isFile()) out.push(abs);
  }
  return out;
}
const tệp = walk(path.join(gốc, 'skills'));
const agentsDir = path.join(gốc, 'agents');
if (fs.existsSync(agentsDir)) for (const f of fs.readdirSync(agentsDir)) if (f.endsWith('.md')) tệp.push(path.join(agentsDir, f));

const hits = [];
let soFile = 0;
function quét(rel, text, ext, dòngĐầu = 1) {
  soFile++;
  const lines = text.split('\n');
  const làScript = SCRIPT_EXT.has(ext);
  const cóCP = làScript && CÓ_CP.test(text);
  const ghiNgoài = CODE_EXT.has(ext) && HOME.test(text) && GHI.test(text);
  const luậtChung = [...LUẬT_CHỮ, ...LUẬT_BÍ_MẬT, ...(ext === '.md' ? LUẬT_MD : [])];
  const luậtMã = [...(làScript ? LUẬT_SCRIPT : []), ...(ext === '.sh' ? LUẬT_SH : [])];
  lines.forEach((dòng, idx) => {
    const số = idx + dòngĐầu;
    const đãCó = new Set();
    const thêm = (loai, muc, i) => { if (đãCó.has(loai)) return; đãCó.add(loai); hits.push({ file: rel, dong: số, loai, muc, trich: trích(dòng, i) }); };
    // Dòng chú thích của script không CHẠY → luật mã bỏ qua; luật chữ (injection, bí mật, tải-chạy) vẫn áp vì agent ĐỌC chú thích.
    const chúThích = làScript && /^\s*(?:\/\/|\/?\*|#(?!!)|<!--)/.test(dòng);
    for (const [loai, muc, re] of [...luậtChung, ...(chúThích ? [] : luậtMã)]) {
      if (loai === 'injection-nhe' && đãCó.has('injection')) continue;
      const m = re.exec(dòng);
      if (m) thêm(loai, muc, m.index);
    }
    if (cóCP && !chúThích) { const m = EXEC_TRẦN.exec(dòng); if (m) thêm('shell-ghep', '🔴', m.index); }
    if (ghiNgoài && !chúThích) { const m = HOME.exec(dòng); if (m) thêm('ghi-ngoai', '🔴', m.index); }
    if (làScript && /\beval\b|\bFunction\b/.test(dòng) && /(?<![.\w$])fetch\s*\(|\bhttps?\.get\s*\(|require\(\s*["']https?["']/.test(dòng)) {
      const m = /(?<![.\w$-])eval\s*\(|\bnew\s+Function\s*\(/.exec(dòng); if (m) thêm('tai-chay', '🔴', m.index);
    }
    VÔ_HÌNH.lastIndex = 0;
    let v;
    while ((v = VÔ_HÌNH.exec(dòng))) {
      const c = v[0], i = v.index;
      if (c === '\uFEFF' && idx === 0 && i === 0 && dòngĐầu === 1) continue;             // BOM đầu file
      if (c === '\u200D' && i > 0 && dòng.charCodeAt(i - 1) > 0x2000 && dòng.charCodeAt(i + 1) > 0x2000) continue; // ZWJ trong emoji ghép
      if (c === '\u00AD') continue;                                                     // gạch mềm: vô hình nhưng không đổi nghĩa — không tính
      thêm('vo-hinh', '🔴', i);
      break;
    }
  });
}
for (const abs of tệp) {
  let buf;
  try { buf = fs.readFileSync(abs); } catch { continue; }
  if (buf.subarray(0, 8192).includes(0)) continue;   // nhị phân (db, ảnh)
  quét(path.relative(gốc, abs).split(path.sep).join('/'), buf.toString('utf8'), path.extname(abs).toLowerCase());
}
// Khối CLAUDE.md do ba-export quản lý (đích) — trong repo nguồn khối nằm cuối CLAUDE.md, đầu khối là tiêu đề.
const claudeMd = [path.join(gốc, '..', 'CLAUDE.md'), path.join(gốc, 'CLAUDE.md')].find((f) => fs.existsSync(f)) || path.join(gốc, '..', 'CLAUDE.md');   // gốc = .claude; bản công khai để briefing trong .claude/ (M5)
if (fs.existsSync(claudeMd)) {
  const t = fs.readFileSync(claudeMd, 'utf8');
  const lines = t.split('\n');
  for (const [đầu, cuối] of [['<!-- BA-TOOLKIT:briefing', '<!-- BA-TOOLKIT:briefing end'], ['<!-- BA-TOOLKIT:diagram-rule', '<!-- BA-TOOLKIT:diagram-rule end']]) {
    const e = lines.findIndex((l) => l.startsWith(cuối));
    if (e < 0) continue;
    let s = lines.findIndex((l, i) => i < e && l.startsWith(đầu) && !l.startsWith(cuối));
    if (s < 0) s = lines.findIndex((l, i) => i < e && /khối do `ba-export` quản lý/.test(l));
    if (s < 0) continue;
    quét('../CLAUDE.md', lines.slice(s, e + 1).join('\n'), '.md', s + 1);
  }
}

// ─── Allowlist ───────────────────────────────────────────────────────────────
const alArg = giáTrị('--allowlist');
const alPath = alArg === 'none' ? null : path.resolve(alArg || path.join(gốc, 'skills', 'ba-toolkit', 'references', 'security-allowlist.json'));
let allowlist = [];
const cảnhBáo = [];
if (alPath && fs.existsSync(alPath)) {
  try {
    const j = JSON.parse(fs.readFileSync(alPath, 'utf8'));
    allowlist = Array.isArray(j) ? j : (j.entries || j.muc || []);
    if (!Array.isArray(allowlist)) throw new Error('không phải mảng');
  } catch (e) {
    console.error(`scan-skills: allowlist hỏng (${alPath}): ${e.message}`);
    process.exit(2);
  }
} else if (alArg && alArg !== 'none') {
  console.error(`scan-skills: không thấy allowlist ${alPath}`); process.exit(2);
}
const mụcHợpLệ = [];
allowlist.forEach((m, i) => {
  const thiếu = ['file', 'loai', 'ly_do', 'nguoi_duyet', 'het_han'].filter((k) => !m || typeof m[k] !== 'string' || !m[k].trim());
  if (thiếu.length) { cảnhBáo.push(`allowlist[${i}] sai dạng — thiếu ${thiếu.join(', ')}`); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.het_han)) { cảnhBáo.push(`allowlist[${i}] ${m.file} · ${m.loai}: het_han "${m.het_han}" không phải YYYY-MM-DD`); return; }
  if (m.het_han < hômNay) { cảnhBáo.push(`allowlist HẾT HẠN ${m.het_han}: ${m.file} · ${m.loai} — hit của mục này tính lại là chưa duyệt`); return; }
  mụcHợpLệ.push(Object.assign({ dùng: 0 }, m));
});
for (const h of hits) {
  const m = mụcHợpLệ.find((x) => x.file === h.file && x.loai === h.loai);
  if (m) { h.duyet = true; m.dùng++; }
}
// Gói phát hành (08/10/2026): mục trỏ file của skill gói Pro/devonly (registry skills.pro/skills.devonly) VẮNG ở bản này (repo công khai)
// không phải mồ côi — allowlist đi cùng nguồn chung, file chỉ vắng ở bản xuất. Skill có mặt mà file mất thì vẫn mồ côi.
const regNgoài = (() => { try { const t = fs.readFileSync(path.join(gốc, 'skills', 'ba-toolkit', 'references', 'conv-registry.md'), 'utf8'); return ['skills.pro', 'skills.devonly'].flatMap((k) => ((t.match(new RegExp(`^${k.replace('.', '\\.')}\\s*=\\s*(.+)$`, 'm')) || [])[1] || '').trim().split(/\s+/).filter(Boolean)); } catch { return []; } })();
const vắngGói = (f) => { const sk = (String(f).match(/^skills\/([^/]+)\//) || [])[1]; return sk && regNgoài.includes(sk) && !fs.existsSync(path.join(gốc, 'skills', sk)); };
for (const m of mụcHợpLệ) if (!m.dùng && !vắngGói(m.file)) cảnhBáo.push(`allowlist MỒ CÔI: ${m.file} · ${m.loai} — không còn hit nào khớp (gỡ mục)`);

const chưaDuyệt = hits.filter((h) => !h.duyet);
const đỏ = chưaDuyệt.filter((h) => h.muc === '🔴').length;
const vàng = chưaDuyệt.filter((h) => h.muc === '🟡').length;
const đãDuyệt = hits.length - chưaDuyệt.length;
const exitCode = đỏ ? 1 : 0;

if (JSON_OUT) {
  process.stdout.write(JSON.stringify({
    goc: gốc, homNay: hômNay, soFile, tongHit: hits.length, chuaDuyet: { do: đỏ, vang: vàng }, daDuyet: đãDuyệt,
    hits: chưaDuyệt, canhBao: cảnhBáo, allowlist: alPath, gioiHan: GIOI_HAN,
  }, null, 1) + '\n');
} else {
  const nhãn = (m) => (PLAIN ? (m === '🔴' ? '[DO]' : '[VANG]') : m);
  const out = [`scan-skills: ${soFile} file · ${nhãn('🔴')} ${đỏ} chưa duyệt · ${nhãn('🟡')} ${vàng} · đã duyệt ${đãDuyệt}${cảnhBáo.length ? ` · ${cảnhBáo.length} cảnh báo allowlist` : ''}`];
  const xếp = [...chưaDuyệt].sort((a, b) => (a.muc === b.muc ? 0 : a.muc === '🔴' ? -1 : 1));
  const trần = PLAIN ? 60 : 200;
  for (const h of xếp.slice(0, trần)) out.push(`${nhãn(h.muc)} ${h.file}:${h.dong} · ${h.loai} · ${h.trich}`);
  if (xếp.length > trần) out.push(`… và ${xếp.length - trần} hit nữa (--json để xem hết)`);
  for (const c of cảnhBáo) out.push(`${PLAIN ? '[CANH BAO]' : '⚠️ '} ${c}`);
  if (đỏ) out.push(`→ ${đỏ} hit 🔴 chưa duyệt: soi từng dòng; hợp lệ thì thêm mục có hạn vào ${alPath ? path.relative(process.cwd(), alPath) : 'security-allowlist.json'} (file · loai · ly_do · nguoi_duyet · het_han).`);
  if (!PLAIN) out.push(`gioiHan: ${GIOI_HAN}`);
  process.stdout.write(out.join('\n') + '\n');
}
process.exitCode = exitCode;
