#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
/**
 * render-check.js — kiểm cú pháp MỌI khối ```mermaid bằng PARSER THẬT của Mermaid (bản vendor
 * của toolkit), chạy cục bộ trong Chrome headless, trả `file:dòng`.
 *
 *   node .claude/skills/ba-portal/scripts/render-check.js <docs|file.md …> [--json] [--plain] [--chrome <path>]
 *
 * Vì sao có: lint Mermaid của hook (`build.js --lint`) là heuristic — đoán pattern hay vỡ, không
 * gọi parser; CI render bằng Chrome chỉ chạy trên example portal. Ở dự án đích lỗi cú pháp chỉ lộ
 * khi có người mở portal và thấy hộp đỏ. Script này gọi `mermaid.parse()` từng khối — cùng thư viện
 * portal nhúng, nên "parse được ở đây" = "portal vẽ được" (về cú pháp).
 *
 * Trạng thái / exit:
 *   sạch     exit 0 — mọi khối parse được, số kết quả = số khối.
 *   lỗi      exit 1 — có ≥1 khối lỗi cú pháp (liệt kê file:dòng).
 *   lỗi-đo   exit 2 — số kết quả ≠ số khối, Chrome không trả được kết quả, thiếu vendor.
 *                     KHÔNG BAO GIỜ coi là sạch (bất biến chống xanh giả, docs/decisions/17).
 *   bỏQua    exit 0 — không có Chrome: in "không kiểm được", KHÔNG in "sạch".
 *   (0 khối → sạch, exit 0, ghi rõ "0 khối" — không mở Chrome.)
 *
 * Gom mọi khối của mọi file vào MỘT lần mở Chrome (~1,5 s mỗi lần mở). Không tải mạng.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const gioiHan = [
  'Chỉ kiểm CÚ PHÁP (mermaid.parse) — không kiểm bố cục, chữ bị cắt, sơ đồ rối hay đúng nghiệp vụ (đó là ba-diagram-reviewer).',
  'Kết quả gắn với phiên bản Mermaid VENDOR của toolkit (ba-portal/assets/vendor) — trình xem khác (GitHub, VS Code) có thể dùng bản khác, nhận/khước khác.',
  'Dòng lỗi trong khối lấy từ parser (jison: loc.first_line; langium: message) — parser không trả dòng thì chỉ có dòng mở khối.',
  'Fence đọc theo CommonMark rút gọn (``` / ~~~, đóng bằng rào cùng ký tự dài ≥ mở) — khối ```mermaid trong fence khác KHÔNG tính; HTML/blockquote lồng (> ```mermaid) không bóc.',
  'Thư mục: bỏ Ho-so/removed/ (màn đã cắt, portal cũng bỏ), node_modules, .git. Không đọc .html.',
  'Cần Chrome/Chromium; không có → bỏQua exit 0, không kết luận.',
];

// ── tham số ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const JSON_OUT = argv.includes('--json');
const PLAIN = argv.includes('--plain');
let chromeArg = null;
const vào = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--chrome') { chromeArg = argv[++i] || ''; continue; }
  if (a === '--json' || a === '--plain') continue;
  if (a === '-h' || a === '--help') {
    console.log('Dùng: node render-check.js <docs|file.md …> [--json] [--plain] [--chrome <path>]');
    console.log('Exit: 0 sạch/bỏQua · 1 có khối lỗi cú pháp · 2 lỗi-đo (số kết quả ≠ số khối, Chrome/vendor hỏng)');
    process.exit(0);
  }
  vào.push(a);
}
if (!vào.length) vào.push('docs');

// ── Chrome: cùng cách tìm của ba-diagram/scripts/figure.js ─────────────────
function tìmChrome() {
  if (chromeArg !== null) return chromeArg && fs.existsSync(chromeArg) ? chromeArg : null;
  return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium', 'google-chrome', 'chromium']
    .find((p) => { try { return p.startsWith('/') ? fs.existsSync(p) : spawnSync('which', [p]).status === 0; } catch { return false; } }) || null;
}

// Vendor: đúng hai chỗ ba-portal/scripts/build.js tìm (assets/vendor, rồi scripts/vendor cho bản cài cũ).
const VENDOR = [path.join(__dirname, '..', 'assets', 'vendor', 'mermaid.min.js'),
  path.join(__dirname, 'vendor', 'mermaid.min.js')].find((p) => fs.existsSync(p)) || null;

// ── gom file ─────────────────────────────────────────────────────────────
const rel = (p) => {
  const r = path.relative(process.cwd().normalize('NFC'), path.resolve(p).normalize('NFC'));
  return !r ? p : r.startsWith('..') ? path.resolve(p).normalize('NFC') : r;
};
function walk(dir, gốc, ra) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      const r = path.relative(gốc, abs).split(path.sep);
      if (r[0] === 'Ho-so' && r[1] === 'removed') continue;
      if (r[0] === 'removed') continue;
      walk(abs, gốc, ra);
    } else if (/\.md$/i.test(e.name)) ra.push(abs);
  }
  return ra;
}
const files = [];
for (const v of vào) {
  if (!fs.existsSync(v)) { console.error(`Không thấy: ${v}`); process.exitCode = 2; continue; }
  if (fs.statSync(v).isDirectory()) files.push(...walk(v, v, []).sort());
  else files.push(v);
}

// ── trích khối ```mermaid (file + dòng mở fence) ─────────────────────────
function bócKhối(nội, file) {
  const dòng = nội.split(/\r?\n/);
  const ra = [];
  for (let i = 0; i < dòng.length; i++) {
    // Mọi fence (không riêng mermaid) đều phải đi qua trọn: khối ```mermaid nằm TRONG một fence
    // khác (````markdown ví dụ minh hoạ) là chữ, không phải sơ đồ — đo dự án desktop 25/09/2026: 1 hit oan.
    const m = /^(\s*)(`{3,}|~{3,})\s*([^\s`]*)/.exec(dòng[i]);
    if (!m) continue;
    const thụt = m[1].length, rào = m[2], mer = /^mermaid$/i.test(m[3]);
    const đóng = new RegExp('^\\s*' + (rào[0] === '`' ? '`' : '~') + '{' + rào.length + ',}\\s*$');
    const thân = [];
    let j = i + 1;
    for (; j < dòng.length && !đóng.test(dòng[j]); j++)
      thân.push(dòng[j].slice(0, thụt).trim() === '' ? dòng[j].slice(thụt) : dòng[j]); // bỏ thụt lề của fence (khối trong danh sách)
    if (mer) {
      const loại = (thân.find((l) => l.trim() && !/^\s*(%%|---|title:|config:)/.test(l)) || '').trim().split(/\s+/)[0] || '?';
      ra.push({ file: rel(file), dong: i + 1, loai: loại, nguon: thân.join('\n'), dongThan: i + 2 });
    }
    i = j;
  }
  return ra;
}
const khối = [];
for (const f of files) khối.push(...bócKhối(fs.readFileSync(f, 'utf8'), f));

// ── báo cáo ──────────────────────────────────────────────────────────────
function kết(trangThai, kq, extra = {}) {
  const lỗi = kq.filter((k) => !k.ok);
  const out = { trangThai, soFile: files.length, soKhoi: khối.length, soKetQua: kq.length, soLoi: lỗi.length,
    mermaid: extra.phienBan || null, loi: lỗi.map((k) => ({ file: k.file, dong: k.dongLoi || k.dong, dongKhoi: k.dong, loai: k.loai, thongBao: k.thongBao })),
    ghiChu: extra.ghiChu || null, gioiHan };
  if (JSON_OUT) process.stdout.write(JSON.stringify(out, null, 1) + '\n');
  else {
    const ic = PLAIN ? '' : { 'sạch': '✅ ', 'lỗi': '❌ ', 'lỗi-đo': '⚠️ ', 'bỏQua': '⏭️ ' }[trangThai];
    const pb = extra.phienBan ? ` · mermaid ${extra.phienBan}` : '';
    if (trangThai === 'bỏQua') console.log(`${ic}render-check: không kiểm được — ${extra.ghiChu} (${khối.length} khối trong ${files.length} file chưa kiểm)`);
    else if (trangThai === 'lỗi-đo') console.log(`${ic}render-check: lỗi-đo — ${extra.ghiChu} (${khối.length} khối, ${kq.length} kết quả) — KHÔNG phải sạch`);
    else console.log(`${ic}render-check: ${khối.length} khối / ${files.length} file · ${lỗi.length} lỗi cú pháp${pb}`);
    for (const k of lỗi) console.log(`  ${k.file}:${k.dongLoi || k.dong}  [${k.loai}] ${k.thongBao}`);
  }
  process.exitCode = { 'sạch': 0, 'bỏQua': 0, 'lỗi': 1, 'lỗi-đo': 2 }[trangThai];
}

if (process.exitCode === 2) { kết('lỗi-đo', [], { ghiChu: 'đường dẫn vào không tồn tại' }); return; }
if (!khối.length) { kết('sạch', [], { ghiChu: '0 khối mermaid' }); return; }
const CHROME = tìmChrome();
if (!CHROME) { kết('bỏQua', [], { ghiChu: chromeArg !== null ? `không có Chrome ở ${chromeArg}` : 'không tìm thấy Chrome/Chromium' }); return; }
if (!VENDOR) { kết('lỗi-đo', [], { ghiChu: 'thiếu ba-portal/assets/vendor/mermaid.min.js' }); return; }

// ── một trang, một lần Chrome ────────────────────────────────────────────
// Dữ liệu vào trang: JSON với `<` thoát thành < (khối có `</script>` không làm vỡ trang).
// Kết quả ra: base64(UTF-8 JSON) trong <title> — dump-dom không làm méo base64 (textContent thì
// bị thoát &lt; &amp; …). Có dấu KẾT THÚC `MERKQ:`; thiếu dấu → lỗi-đo, không phải sạch.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ba-render-check-'));
try {
  const nguồn = JSON.stringify(khối.map((k) => k.nguon)).replace(/</g, '\\u003c');
  // Móc thử cho ca đối kháng: bớt 1 kết quả để chứng minh bất biến số kết quả = số khối.
  const bớt = process.env.BA_RENDER_CHECK_TEST_DROP === '1' ? 1 : 0;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>CHUA</title></head><body>
<script>${fs.readFileSync(VENDOR, 'utf8')}</script>
<script>
(async function(){
  var SRC=${nguồn}, out=[], ver=null;
  try{ mermaid.initialize({startOnLoad:false,securityLevel:'strict'}); ver=mermaid.version||null; }catch(e){}
  for (var i=0;i<SRC.length;i++){
    try{ await mermaid.parse(SRC[i]); out.push({i:i,ok:true}); }
    catch(e){
      var h=(e&&e.hash)||{}, loc=h.loc||{}, msg=String((e&&e.message)||e);
      // "Parse error on line N" (jison, đếm từ 1 trong thân khối) đáng tin hơn loc.first_line —
      // loc trỏ token CUỐI parser đã nuốt, thường sớm hơn dòng hỏng (đo: báo 3 khi hỏng ở 5).
      var m=/on line (\\d+)/i.exec(msg)||/\\bline:? (\\d+)/i.exec(msg);
      var ln=m?+m[1]:(loc.first_line||null);
      out.push({i:i,ok:false,line:ln,msg:msg.slice(0,600)});
    }
  }
  if(${bớt}) out.pop();
  var s=JSON.stringify({ver:ver,kq:out});
  document.title='MERKQ:'+btoa(unescape(encodeURIComponent(s)));
})();
</script></body></html>`;
  const f = path.join(tmp, 'check.html');
  fs.writeFileSync(f, html);
  const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--virtual-time-budget=60000', '--dump-dom', `file://${f}`],
  { encoding: 'buffer', maxBuffer: 5e8, timeout: 180000 });
  const dom = (r.stdout || Buffer.from('')).toString('utf8');
  const tiêu = (/<title>([\s\S]*?)<\/title>/.exec(dom) || [, ''])[1].trim();
  if (!tiêu.startsWith('MERKQ:')) {
    kết('lỗi-đo', [], { ghiChu: `Chrome không trả kết quả (exit ${r.status}${r.error ? ', ' + r.error.code : ''}; title="${tiêu.slice(0, 40)}")` });
    return;
  }
  let data;
  try { data = JSON.parse(Buffer.from(tiêu.slice(6), 'base64').toString('utf8')); }
  catch (e) { kết('lỗi-đo', [], { ghiChu: 'kết quả trong trang hỏng: ' + e.message }); return; }
  const phienBan = data.ver || ((/version:"(\d+\.\d+\.\d+)"/.exec(fs.readFileSync(VENDOR, 'utf8')) || [])[1]) || null;
  const theoI = new Map((data.kq || []).map((x) => [x.i, x]));
  const kq = [];
  for (let i = 0; i < khối.length; i++) {
    const x = theoI.get(i);
    if (!x) continue;
    const k = khối[i];
    // dòng lỗi: parser đếm từ 1 trong THÂN khối → dòng file = dòng đầu thân + (line − 1)
    const dongLoi = !x.ok && x.line ? k.dongThan + x.line - 1 : null;
    kq.push({ ...k, ok: x.ok, dongLoi, thongBao: x.ok ? null : x.msg.replace(/\s+/g, ' ').trim() });
  }
  if (kq.length !== khối.length) {
    kết('lỗi-đo', kq, { phienBan, ghiChu: `số kết quả ${kq.length} ≠ số khối ${khối.length}` });
    return;
  }
  kết(kq.some((k) => !k.ok) ? 'lỗi' : 'sạch', kq, { phienBan });
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
