#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // JSON > 64 KB qua pipe không bị cắt (lint 43)
/**
 * shot.js — mở MỌI html-design.html trong Chrome headless ở khổ 375 và 1440, bấm lần lượt từng nút
 * statebar (mọi nhóm `ui`/`error`/`role`/`biz`), ĐO hình học bố cục từng trạng thái; `--out` lưu ảnh PNG để soi bằng mắt.
 *
 *   node .claude/skills/ba-html-design/scripts/shot.js <docsDir|file.html> [--out <dir>] [--plain|--json]
 *        [--chrome <path>] [--widths 375,1440]
 *
 * | Mã             | Mức | Bắt |
 * | SHOT-HSCROLL   | ❌  | documentElement.scrollWidth > innerWidth+1 (trang cuộn ngang) |
 * | SHOT-OFFSCREEN | ⚠️  | phần tử nhìn thấy có mép phải vượt khung (≤5 selector ngoài cùng) |
 * | SHOT-CLIP      | ⚠️  | overflow hidden/clip + scrollWidth>clientWidth+1, không ellipsis, có chữ |
 * | SHOT-TAP       | ⚠️  | khổ <768: a/button/checkbox/radio/[role=button]/[onclick] nhìn thấy < 24×24 (WCAG 2.5.8) |
 *
 * Vì sao có: check-shell/check-design/scan-html chỉ đọc CSS/HTML TĨNH — không thấy bảng 600px tràn khổ
 * 375 hay trạng thái "Lỗi" bật ra một hộp rộng hơn màn. Phải mở trang thật, bấm trạng thái, rồi đo.
 *
 * Cách đo: chép từng file ra thư mục tạm (OS tmp) kèm <base> trỏ về folder gốc + CSS đóng băng chuyển
 * động + script đo; MỘT trang khung chứa mọi cặp (file × khổ) dưới dạng iframe rộng đúng W px — iframe
 * cho innerWidth = W chính xác (đo 05/10/2026: `--window-size=375,…` với --headless=new cho innerWidth
 * 500 — Chrome có bề rộng cửa sổ tối thiểu). Mỗi iframe postMessage kết quả; khung gom vào <title>
 * base64 rồi `--dump-dom`. MỘT lần mở Chrome cho cả bộ.
 *
 * Trạng thái / exit:
 *   có ❌     exit = số mục ❌ (sau gộp plist).
 *   lỗi-đo    exit 2 — thiếu kết quả của iframe nào, innerWidth ≠ khổ yêu cầu, Chrome không trả.
 *   bỏQua     exit 0 — không có Chrome: "không kiểm được", KHÔNG BAO GIỜ in "sạch".
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const plist = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'plist.js'));

const gioiHan = [
  'Chỉ đo HÌNH HỌC (tràn ngang, tràn mép, chữ bị cắt, vùng bấm) — không phán thẩm mỹ, thứ bậc thị giác, màu, tương phản (đó là ba-toolkit/scan-html, ac-audit-web và mắt người qua ảnh --out).',
  'Đo trong iframe rộng đúng W px (innerWidth kiểm lại, lệch → lỗi-đo) — không giả lập thiết bị cảm ứng, DPR, thanh địa chỉ di động; media query (pointer/hover) theo máy chạy.',
  'Bấm nút statebar của cả bốn nhóm data-group="ui"/"error"/"role"/"biz" (theo nhóm hoặc theo nút). Trước mỗi trạng thái bấm lại nút active ban đầu của TỪNG nhóm — trạng thái cộng dồn kiểu khác (modal mở bằng JS riêng không gắn nút mặc định) không gỡ được. Thanh trạng thái kiểu cũ không có data-group không bấm.',
  'Đo sau ~600 ms từ load và ~250 ms sau mỗi lần bấm (giờ ảo Chrome) — trạng thái do setTimeout dài hơn bật ra không thấy.',
  'Statebar (.statebar/#statebar) bị ẩn khi đo và khi chụp — nó là khung demo, không phải sản phẩm.',
  'SHOT-OFFSCREEN bỏ phần tử nằm TRỌN ngoài mép phải (left ≥ khung — ngăn kéo off-canvas) và phần tử có tổ tiên overflow≠visible nằm trong khung (bảng cuộn ngang có chủ đích). SHOT-CLIP bỏ phần tử rộng < 4px (sr-only). SHOT-TAP bỏ link trong <p>, checkbox/radio có <label> bao/for ≥ 24×24 hoặc opacity 0.',
  'Ảnh --out: chụp cửa sổ khung, iframe W×H ở góc trái trên; khổ < 500 có dải trống bên phải (Chrome không cho cửa sổ hẹp hơn ~500px). Chỉ trạng thái mặc định.',
  'KHÔNG opt-in rule-cover: CI chạy test.js có thể không có Chrome nên không bảo đảm luật nào cũng nổ được; ca test cần Chrome thì BỎ QUA có nói.',
  'Cần Chrome/Chromium; không có → bỏQua exit 0, không kết luận.',
];

// ── tham số ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const JSON_OUT = argv.includes('--json');
const PLAIN = argv.includes('--plain');
let chromeArg = null, outDir = null, widths = [375, 1440];
const vào = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--chrome') { chromeArg = argv[++i] || ''; continue; }
  if (a === '--out') { outDir = argv[++i] || ''; continue; }
  if (a === '--widths') { widths = String(argv[++i] || '').split(',').map((x) => parseInt(x, 10)).filter((x) => x > 0); continue; }
  if (a === '--json' || a === '--plain') continue;
  if (a === '-h' || a === '--help') {
    console.log('Dùng: node shot.js <docsDir|file.html> [--out <dir>] [--plain|--json] [--chrome <path>] [--widths 375,1440]');
    console.log('Exit: số mục ❌ · 0 khi không có Chrome (không kiểm được) · 2 lỗi-đo');
    process.exit(0);
  }
  vào.push(a);
}
if (!vào.length) vào.push('docs');
if (!widths.length) widths = [375, 1440];
const HEIGHT = (w) => (w < 768 ? 812 : 900);

// ── Chrome: cùng cách tìm của ba-portal/scripts/render-check.js ──────────
function tìmChrome() {
  if (chromeArg !== null) return chromeArg && fs.existsSync(chromeArg) ? chromeArg : null;
  return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium', 'google-chrome', 'chromium']
    .find((p) => { try { return p.startsWith('/') ? fs.existsSync(p) : spawnSync('which', [p]).status === 0; } catch { return false; } }) || null;
}

// ── gom file ─────────────────────────────────────────────────────────────
function walk(dir, gốc, ra) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      const r = path.relative(gốc, abs).split(path.sep);
      if ((r[0] === 'Ho-so' && r[1] === 'removed') || r[0] === 'removed') continue;
      walk(abs, gốc, ra);
    } else if (e.name === 'html-design.html') ra.push(abs);
  }
  return ra;
}
const files = []; // { abs, rel, code }
let đầuVàoHỏng = false;
for (const v of vào) {
  if (!fs.existsSync(v)) { console.error(`Không thấy: ${v}`); đầuVàoHỏng = true; continue; }
  if (fs.statSync(v).isDirectory()) for (const f of walk(v, v, []).sort()) files.push({ abs: path.resolve(f), rel: path.relative(v, f).split(path.sep).join('/') });
  else files.push({ abs: path.resolve(v), rel: path.basename(path.dirname(path.resolve(v))) + '/' + path.basename(v) });
}
for (const f of files) {
  const d = path.basename(path.dirname(f.abs));
  f.code = ((/^([A-Z]+\d+[A-Za-z]?)\b/.exec(d) || [])[1]) || d.replace(/[^\w-]+/g, '_');
}

// ── báo cáo ──────────────────────────────────────────────────────────────
const NHÃN = `${files.length} màn × khổ ${widths.join('/')}`;
function kết(trangThai, { items = [], checked = [], unchecked = [], ghiChu = null, anh = [] } = {}) {
  const uc = [['thẩm mỹ/thứ bậc', 'máy chỉ đo hình học — nhìn ảnh --out'], ...unchecked];
  const groups = plist.group(items);
  const nErr = groups.filter((g) => g.lv === '❌').length;
  if (JSON_OUT) {
    process.stdout.write(JSON.stringify({ trangThai, soFile: files.length, kho: widths, soLoi: nErr, muc: groups,
      daKiem: checked, chuaKiem: uc, anh, ghiChu, gioiHan }, null, 1) + '\n');
  } else if (trangThai === 'bỏQua') {
    console.log(`${PLAIN ? '' : '⏭️ '}shot: không kiểm được — ${ghiChu} (${NHÃN} chưa đo)`);
  } else if (trangThai === 'lỗi-đo') {
    console.log(`${PLAIN ? '' : '⚠️ '}shot: lỗi-đo — ${ghiChu} (${NHÃN}) — KHÔNG phải sạch`);
  } else {
    console.log(plist.render(items, { checked, unchecked: uc, oan: 'ba-html-design/shot' }));
    if (anh.length) { console.log('Ảnh (trạng thái mặc định):'); for (const a of anh) console.log('  ' + a); }
  }
  process.exitCode = trangThai === 'bỏQua' ? 0 : trangThai === 'lỗi-đo' ? 2 : nErr;
}

if (đầuVàoHỏng) { kết('lỗi-đo', { ghiChu: 'đường dẫn vào không tồn tại' }); return; }
if (!files.length) { kết('xong', { checked: ['0 html-design.html — không có gì để đo'] }); return; }
const CHROME = tìmChrome();
if (!CHROME) { kết('bỏQua', { ghiChu: chromeArg !== null ? `không có Chrome ở ${chromeArg}` : 'không tìm thấy Chrome/Chromium' }); return; }

// ── phần chèn vào từng trang ─────────────────────────────────────────────
const FREEZE = '<style data-shot>*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}</style>';
// Chạy TRONG trang (ES5, không phụ thuộc gì). Cấu hình qua location.hash: #id=3&mode=measure|shot
const MEASURE = `<script data-shot>(function(){
var H={};location.hash.slice(1).split('&').forEach(function(p){var kv=p.split('=');H[kv[0]]=decodeURIComponent(kv[1]||'')});
var SB='.statebar,#statebar';
function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
function sel(el){var s=el.tagName.toLowerCase();if(el.id)return s+'#'+el.id;var c=(typeof el.className==='string'?el.className:'').trim().split(/\\s+/).filter(Boolean).slice(0,2);if(c.length)s+='.'+c.join('.');var p=el.parentElement;if(!el.id&&!c.length&&p&&p!==document.body){var ps=p.id?'#'+p.id:((typeof p.className==='string'&&p.className.trim())?'.'+p.className.trim().split(/\\s+/)[0]:p.tagName.toLowerCase());s=ps+'>'+s}return s}
function hideSB(){var b=document.querySelectorAll(SB);for(var i=0;i<b.length;i++)b[i].style.setProperty('display','none','important')}
function label(b){return (b.textContent||'').replace(/\\s+/g,' ').trim().replace(/^[^0-9A-Za-z\\u00C0-\\u024F\\u1E00-\\u1EFF]+/,'').slice(0,40)||'(nút không chữ)'}
function measure(){
  var W=innerWidth,out={sw:document.documentElement.scrollWidth,iw:W,ih:innerHeight,off:[],offN:0,clip:[],clipN:0,tap:[],tapN:0};
  var csC=new Map();function cs(e){var v=csC.get(e);if(!v){v=getComputedStyle(e);csC.set(e,v)}return v}
  function clipped(el){for(var a=el.parentElement;a&&a!==document.body&&a!==document.documentElement;a=a.parentElement){var s=cs(a);if(s.overflowX!=='visible'&&a.getBoundingClientRect().right<=W+1)return true}return false}
  var all=document.body?document.body.querySelectorAll('*'):[],offSet=new Set();
  for(var i=0;i<all.length;i++){var el=all[i],tg=el.tagName;
    if(tg==='SCRIPT'||tg==='STYLE'||tg==='TEMPLATE'||tg==='NOSCRIPT')continue;
    if(el.closest(SB))continue;
    var r=el.getBoundingClientRect();if(r.width<=1||r.height<=1)continue;
    var s=cs(el);if(s.visibility==='hidden'||s.visibility==='collapse')continue;
    var right=r.right+scrollX,left=r.left+scrollX;
    if(right>W+1&&left<W&&!clipped(el))offSet.add(el);
    if((s.overflowX==='hidden'||s.overflowX==='clip')&&el.clientWidth>=4&&el.scrollWidth>el.clientWidth+1&&s.textOverflow!=='ellipsis'&&(el.textContent||'').trim()){out.clipN++;if(out.clip.length<5)out.clip.push(sel(el))}
    if(W<768){var t=(tg==='A'&&(el.hasAttribute('href')||el.hasAttribute('onclick')))||tg==='BUTTON'||(tg==='INPUT'&&/^(checkbox|radio)$/i.test(el.type))||el.getAttribute('role')==='button'||el.hasAttribute('onclick');
      if(t&&(r.width<24||r.height<24)){var skip=false;
        if(tg==='A'&&el.closest('p'))skip=true;
        if(tg==='INPUT'){if(s.opacity==='0')skip=true;var lb=el.closest('label')||(el.id&&document.querySelector('label[for="'+el.id+'"]'));if(lb){var lr=lb.getBoundingClientRect();if(lr.width>=24&&lr.height>=24)skip=true}}
        if(!skip){out.tapN++;if(out.tap.length<5)out.tap.push(sel(el)+' '+Math.round(r.width)+'×'+Math.round(r.height))}}}
  }
  offSet.forEach(function(el){if(el.parentElement&&offSet.has(el.parentElement))return;out.offN++;if(out.off.length<5)out.off.push(sel(el))});
  return out}
async function run(){
  var res={shotId:H.id,states:[],failed:[],err:null};
  try{
    await wait(600);hideSB();
    if(H.mode==='shot'){scrollTo(0,0);return}
    res.states.push({label:'Mặc định',m:measure()});
    // Mọi nhóm statebar (ui · error · role · biz — dự án TTS S05: 5 ảnh nhóm biz phải tự chụp tay vì máy không bấm).
    var GR=['ui','error','role','biz'],q=GR.map(function(g){return '[data-group="'+g+'"] .statebar__btn,.statebar__btn[data-group="'+g+'"]'}).join(',');
    var seen=new Set(),btns=[].slice.call(document.querySelectorAll(q)).filter(function(b){if(seen.has(b))return false;seen.add(b);return true});
    var grp=function(b){var g=b.closest('[data-group]');return (g&&g.getAttribute('data-group'))||b.getAttribute('data-group')||''};
    // nút mặc định = nút active ban đầu của TỪNG nhóm; trước mỗi trạng thái bấm lại hết để không cộng dồn (vai Member + ca lỗi…)
    var defs=btns.filter(function(b){return /(^|\\s)(active|is-active)(\\s|$)/.test(b.className)});
    for(var i=0;i<btns.length;i++){var b=btns[i];if(defs.indexOf(b)>=0)continue;var g=grp(b),lb=(g==='role'?'Vai ':'')+label(b),bad=null;
      var onErr=function(e){bad=String((e&&e.message)||'lỗi script')};addEventListener('error',onErr);
      try{for(var d=0;d<defs.length;d++)defs[d].click();await wait(50);b.click();await wait(250);hideSB();}catch(e){bad=String(e&&e.message||e)}
      removeEventListener('error',onErr);
      if(bad){res.failed.push({label:lb,why:bad.slice(0,120)});continue}
      res.states.push({label:lb,m:measure()})}
  }catch(e){res.err=String(e&&e.message||e)}
  parent.postMessage(res,'*')}
if(document.readyState==='complete')run();else addEventListener('load',run)})();</script>`;

function chèn(html, dirAbs) {
  const base = `<base href="${'file://' + encodeURI(dirAbs.split(path.sep).join('/') + '/')}">`;
  const thêm = base + FREEZE + MEASURE;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => m + thêm);
  return thêm + html;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ba-shot-'));
try {
  files.forEach((f, i) => fs.writeFileSync(path.join(tmp, `f${i}.html`), chèn(fs.readFileSync(f.abs, 'utf8'), path.dirname(f.abs))));
  // ── khung đo: mọi (file × khổ) chồng ở góc trái trên — đều "trong khung nhìn", không bị bóp nhịp ──
  const cặp = [];
  files.forEach((f, i) => widths.forEach((w) => cặp.push({ id: `${i}_${w}`, i, w })));
  const iframes = cặp.map((c) => `<iframe loading="eager" src="f${c.i}.html#id=${c.id}&mode=measure" style="position:absolute;top:0;left:0;width:${c.w}px;height:${HEIGHT(c.w)}px;border:0"></iframe>`).join('\n');
  const harness = `<!doctype html><html><head><meta charset="utf-8"><title>CHUA</title></head><body style="margin:0">
${iframes}
<script>var N=${cặp.length},R={},n=0;
function done(){document.title='SHOTKQ:'+btoa(unescape(encodeURIComponent(JSON.stringify(R))))}
addEventListener('message',function(e){var d=e.data;if(!d||!d.shotId||R[d.shotId])return;R[d.shotId]=d;n++;if(n===N)done()});
setTimeout(done,${Math.max(30000, cặp.length * 4000)});</script></body></html>`;
  const H = path.join(tmp, 'harness.html');
  fs.writeFileSync(H, harness);
  const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--hide-scrollbars',
    '--allow-file-access-from-files', '--window-size=1500,1000', `--virtual-time-budget=${Math.max(60000, cặp.length * 6000)}`,
    '--dump-dom', `file://${encodeURI(H)}`], { encoding: 'buffer', maxBuffer: 5e8, timeout: 300000 });
  const dom = (r.stdout || Buffer.from('')).toString('utf8');
  const tiêu = (/<title>([\s\S]*?)<\/title>/.exec(dom) || [, ''])[1].trim();
  if (!tiêu.startsWith('SHOTKQ:')) { kết('lỗi-đo', { ghiChu: `Chrome không trả kết quả (exit ${r.status}${r.error ? ', ' + r.error.code : ''}; title="${tiêu.slice(0, 40)}")` }); return; }
  let R;
  try { R = JSON.parse(Buffer.from(tiêu.slice(7), 'base64').toString('utf8')); } catch (e) { kết('lỗi-đo', { ghiChu: 'kết quả trong trang hỏng: ' + e.message }); return; }

  // ── bất biến: đủ kết quả, đúng bề rộng ──
  const thiếu = cặp.filter((c) => !R[c.id] || R[c.id].err || !(R[c.id].states || []).length);
  if (thiếu.length) {
    kết('lỗi-đo', { ghiChu: `thiếu kết quả ${thiếu.length}/${cặp.length}: ${thiếu.slice(0, 4).map((c) => `${files[c.i].rel} @${c.w}px${R[c.id] && R[c.id].err ? ' (' + R[c.id].err + ')' : ''}`).join('; ')}` });
    return;
  }
  const lệch = cặp.filter((c) => R[c.id].states[0].m.iw !== c.w);
  if (lệch.length) { kết('lỗi-đo', { ghiChu: `innerWidth ≠ khổ yêu cầu: ${lệch.slice(0, 4).map((c) => `${files[c.i].rel} ${c.w}→${R[c.id].states[0].m.iw}`).join('; ')}` }); return; }

  // ── phát hiện ──
  const items = [], unchecked = [];
  let soTT = 0;
  const đãBáoHỏng = new Set();
  for (const c of cặp) {
    const f = files[c.i], d = R[c.id];
    if (c.w === widths[0]) soTT += d.states.length;
    for (const x of d.failed || []) {
      const k = `${f.rel}\0${x.label}`;
      if (!đãBáoHỏng.has(k)) { đãBáoHỏng.add(k); unchecked.push([`trạng thái "${x.label}" (${f.code})`, `bấm lỗi: ${x.why}`]); }
    }
    for (const st of d.states) {
      const m = st.m, where = [`${c.w}px`, st.label];
      if (m.sw > m.iw + 1) items.push({ rule: 'SHOT-HSCROLL', lv: '❌', file: f.rel, where,
        msg: `trang cuộn ngang — nội dung rộng ${m.sw}px > khung ${m.iw}px`,
        fix: `thu phần tràn về ≤ khổ (max-width:100%, cuộn trong khối, xuống dòng)${m.off.length ? ': ' + m.off.join(', ') : ''}` });
      if (m.offN) items.push({ rule: 'SHOT-OFFSCREEN', lv: '⚠️', file: f.rel, where,
        msg: `${m.offN} phần tử tràn mép phải: ${m.off.join(', ')}`, fix: 'giới hạn bề rộng hoặc cho khối cha cuộn có chủ đích (overflow-x:auto)' });
      if (m.clipN) items.push({ rule: 'SHOT-CLIP', lv: '⚠️', file: f.rel, where,
        msg: `${m.clipN} chữ bị cắt (overflow ẩn, không ellipsis): ${m.clip.join(', ')}`, fix: 'cho xuống dòng, hoặc text-overflow:ellipsis kèm title đầy đủ' });
      if (m.tapN) items.push({ rule: 'SHOT-TAP', lv: '⚠️', file: f.rel, where,
        msg: `${m.tapN} vùng bấm < 24×24px: ${m.tap.map((t) => t.replace(/ \d+×\d+$/, '')).join(', ')}`, fix: 'min-width/min-height 24px (tốt nhất 44px) hoặc padding vùng bấm' });
    }
  }

  // ── ảnh --out (trạng thái mặc định, mỗi khổ một lần Chrome) ──
  const anh = [];
  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    files.forEach((f, i) => widths.forEach((w) => {
      const h = HEIGHT(w);
      const sh = path.join(tmp, `shot_${i}_${w}.html`);
      fs.writeFileSync(sh, `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#e5e7eb"><iframe src="f${i}.html#id=s&mode=shot" style="display:block;width:${w}px;height:${h}px;border:0;background:#fff"></iframe></body></html>`);
      const png = path.resolve(outDir, `${f.code}-${w}.png`);
      const rs = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--hide-scrollbars',
        '--allow-file-access-from-files', `--window-size=${Math.max(w, 500)},${h}`, '--virtual-time-budget=5000',
        `--screenshot=${png}`, `file://${encodeURI(sh)}`], { encoding: 'utf8', timeout: 120000 });
      if (fs.existsSync(png)) anh.push(png); else unchecked.push([`ảnh ${f.code}-${w}.png`, `Chrome không chụp được (exit ${rs.status})`]);
    }));
  }

  kết('xong', { items, anh, unchecked: [...unchecked, ['trạng thái ngoài statebar (bấm trong trang, modal mở bằng JS)', 'máy chỉ bấm nút statebar']],
    checked: [`${NHÃN} × ${soTT} trạng thái (cộng mọi màn)`, `cuộn ngang · tràn mép · chữ bị cắt · vùng bấm <24px (khổ <768)`] });
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
