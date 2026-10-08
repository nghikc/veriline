#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
/*
 * ba-diagram/figure.js (chế độ `export`, trước 08/10/2026 là skill ba-figure) — một sơ đồ Mermaid → SVG tĩnh + trang HTML tương tác, tự chứa.
 *
 * VÌ SAO KHÔNG DÙNG `ba-portal`: portal dựng CẢ BỘ tài liệu và nhúng `mermaid.min.js` (3,4 MB)
 * để vẽ lúc mở trang. Cho một hình đem đi trình bày thì đó là sai công cụ:
 *   - đo thật: SVG biên dịch sẵn **11,7 KB** so với **3,4 MB** runtime — nhỏ hơn ~290 lần;
 *   - không có runtime nghĩa là không có "vẽ hỏng lúc mở" — hỏng thì hỏng lúc build, ở đây;
 *   - và có file `.svg` THẬT để thả vào slide, README, Confluence.
 * Ý tưởng lấy từ Archify ("agents produce IR; Archify deterministically compiles it") — xem
 * `research/04-archify.md`. Ta không chép IR của họ: nguồn của ta vẫn là Mermaid trong `.md`.
 *
 * Dùng:
 *   node .claude/skills/ba-diagram/scripts/figure.js <file.md|file.mmd> [--index N] [--out <thư mục>]
 *                                          [--title "..."] [--all]
 * Exit: 0 xong · 1 render hỏng · 2 sai đầu vào.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const cờ = (t, m) => { const i = args.indexOf(t); return i >= 0 && args[i + 1] ? args[i + 1] : m; };
const NGUỒN = args.find((a) => !a.startsWith('--') && a !== cờ('--index', null)
  && a !== cờ('--out', null) && a !== cờ('--title', null));
const OUT = path.resolve(cờ('--out', '.'));
const TẤT_CẢ = args.includes('--all');
const CHỈ_SỐ = Number(cờ('--index', '1'));
const TIÊU_ĐỀ = cờ('--title', null);

if (!NGUỒN || !fs.existsSync(NGUỒN)) {
  console.error('Dùng: node .claude/skills/ba-diagram/scripts/figure.js <file.md|file.mmd> [--index N] [--all] [--out dir]');
  process.exit(2);
}

const CHROME = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium', 'google-chrome', 'chromium']
  .find((p) => { try { return p.startsWith('/') ? fs.existsSync(p) : spawnSync('which', [p]).status === 0; } catch { return false; } });

const VENDOR = path.join(__dirname, '..', '..', 'ba-portal', 'assets', 'vendor', 'mermaid.min.js');

/** Bóc mọi khối ```mermaid, kèm tiêu đề gần nhất phía trên để đặt tên file cho có nghĩa. */
function bócSơĐồ(nội) {
  const ra = [];
  const dòng = nội.split('\n');
  let tiêuĐề = null;
  for (let i = 0; i < dòng.length; i++) {
    const h = /^#{1,6}\s+(.+)$/.exec(dòng[i]);
    if (h) { tiêuĐề = h[1].replace(/[`*]/g, '').trim(); continue; }
    if (!/^```mermaid\s*$/.test(dòng[i].trim())) continue;
    const bắt = i + 1;
    let j = bắt;
    while (j < dòng.length && !/^```\s*$/.test(dòng[j].trim())) j++;
    ra.push({ mã: dòng.slice(bắt, j).join('\n'), tiêuĐề, dòng: bắt + 1 });
    i = j;
  }
  return ra;
}

const slug = (s, i) => (s ? s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
  .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 48) : `figure-${i}`) || `figure-${i}`;

/** Render một mảng sơ đồ trong MỘT lần mở Chrome. Mở Chrome mỗi hình là ~1,5s/hình lãng phí. */
function renderNhiều(danhSách) {
  if (!CHROME) return null;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ba-figure-'));
  const js = fs.readFileSync(VENDOR, 'utf8');
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
${danhSách.map((_, i) => `<div id="o${i}"></div>`).join('\n')}
<script>${js}</script>
<script>
mermaid.initialize({startOnLoad:false,securityLevel:'loose',theme:'base',
  themeVariables:{fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif'}});
var src = ${JSON.stringify(danhSách.map((d) => d.mã))};
var lỗi = [];
Promise.all(src.map(function(m,i){
  return mermaid.render('g'+i, m).then(function(r){ document.getElementById('o'+i).innerHTML = r.svg; })
    .catch(function(e){ lỗi.push(i+': '+e.message); });
})).then(function(){ document.title = lỗi.length ? 'ERR '+lỗi.join(' | ') : 'DONE'; });
</script></body></html>`;
  const f = path.join(tmp, 'h.html');
  fs.writeFileSync(f, html);
  const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=20000', '--dump-dom', `file://${f}`], { encoding: 'buffer', maxBuffer: 5e8 });
  const dom = (r.stdout || Buffer.from('')).toString('utf8');
  fs.rmSync(tmp, { recursive: true, force: true });
  const tiêu = (/<title>([\s\S]*?)<\/title>/.exec(dom) || [, ''])[1];
  if (tiêu.startsWith('ERR')) return { lỗi: tiêu.slice(4) };
  // Rút ĐÚNG svg trong từng hộp chứa. Bắt từ `<svg` đầu tới `</svg>` cuối là sai: mermaid còn
  // tạo một svg đo đạc ngoài màn hình, và ta sẽ gộp nhầm hai thứ (đã dính bẫy này lúc dựng).
  return {
    svgs: danhSách.map((_, i) => {
      const m = new RegExp(`<div id="o${i}">\\s*(<svg[\\s\\S]*?<\\/svg>)\\s*<\\/div>`).exec(dom);
      return m ? m[1] : null;
    }),
  };
}

/** Đồ thị kề, rút từ chính SVG. `L_<src>_<dst>_<n>` mơ hồ khi id node có `_`, nên tách bằng
 *  cách thử mọi điểm cắt và chỉ nhận khi CẢ HAI nửa đều là node có thật. */
function đồThị(svg) {
  const nodes = [...svg.matchAll(/<g class="node[^"]*" id="[^"]*?flowchart-(.+?)-\d+"/g)].map((m) => m[1]);
  const tập = new Set(nodes);
  // Mermaid phát MỖI cạnh HAI lần (đường vẽ + vùng bắt chuột), nên phải khử trùng — nếu không
  // báo cáo nói "5 node · 8 cạnh" cho một sơ đồ chỉ có 4 cạnh, và con số sai thì thà đừng in.
  const cạnh = []; const đãCó = new Set(); let mơHồ = 0;
  for (const m of svg.matchAll(/id="L_(.+?)_(\d+)"/g)) {
    if (đãCó.has(`L_${m[1]}_${m[2]}`)) continue;
    đãCó.add(`L_${m[1]}_${m[2]}`);
    const thân = m[1];
    const ứngViên = [];
    for (let i = 1; i < thân.length; i++) {
      const a = thân.slice(0, i); const b = thân.slice(i + 1);
      if (thân[i] === '_' && tập.has(a) && tập.has(b)) ứngViên.push([a, b]);
    }
    if (ứngViên.length === 1) cạnh.push({ id: `L_${thân}_${m[2]}`, a: ứngViên[0][0], b: ứngViên[0][1] });
    else mơHồ++;
  }
  return { nodes, cạnh, mơHồ };
}

const nội = fs.readFileSync(NGUỒN, 'utf8');
const sơĐồ = NGUỒN.endsWith('.mmd')
  ? [{ mã: nội, tiêuĐề: path.basename(NGUỒN, '.mmd'), dòng: 1 }]
  : bócSơĐồ(nội);

if (!sơĐồ.length) { console.error(`Không thấy khối \`\`\`mermaid nào trong ${NGUỒN}`); process.exit(2); }
const chọn = TẤT_CẢ ? sơĐồ : [sơĐồ[CHỈ_SỐ - 1]].filter(Boolean);
if (!chọn.length) { console.error(`--index ${CHỈ_SỐ} vượt quá ${sơĐồ.length} sơ đồ có trong file`); process.exit(2); }

fs.mkdirSync(OUT, { recursive: true });
const kq = renderNhiều(chọn);

if (!CHROME) {
  console.error('Không tìm thấy Chrome/Chromium — không biên dịch được SVG.');
  console.error('  Cần Chrome để render Mermaid thành SVG tĩnh. Không có thì dùng `ba-portal` (vẽ lúc mở trang, nặng 3,4 MB).');
  process.exit(1);
}
if (kq && kq.lỗi) { console.error(`Mermaid render hỏng: ${kq.lỗi}`); process.exit(1); }

let xong = 0;
chọn.forEach((d, i) => {
  const svg = kq.svgs[i];
  const tên = slug(TIÊU_ĐỀ || d.tiêuĐề, i + 1);
  if (!svg) { console.error(`  ✗ ${tên} — không rút được SVG`); return; }
  const g = đồThị(svg);
  fs.writeFileSync(path.join(OUT, `${tên}.svg`), svg, 'utf8');
  fs.writeFileSync(path.join(OUT, `${tên}.html`), TRANG(svg, g, TIÊU_ĐỀ || d.tiêuĐề || tên, d.mã), 'utf8');
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  // Chỉ họ flowchart (kể cả swimlane) mới có `g.node` + `L_a_b_n` để bám. ERD/sequence/state
  // vẫn ra SVG đẹp nhưng KHÔNG bấm được — nói thẳng, đừng đưa người dùng một trang bấm không ăn.
  const tương = g.nodes.length > 0;
  console.log(`  ✓ ${tên}.svg (${kb(svg.length)}) + ${tên}.html (${kb(fs.statSync(path.join(OUT, `${tên}.html`)).size)})`
    + (tương
      ? `  ·  ${g.nodes.length} node · ${g.cạnh.length} cạnh${g.mơHồ ? ` · ${g.mơHồ} cạnh không phân giải được id` : ''}`
      : '  ·  SVG tĩnh (loại sơ đồ này không có node bấm được — ERD/sequence/state)'));
  xong++;
});
console.log(`\n${xong}/${chọn.length} hình → ${OUT}`);
console.log('  SVG là hình tĩnh (thả vào slide/README). HTML là bản tương tác: bấm node để soi luồng liên quan.');

function TRANG(svg, g, tiêu, mã) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(tiêu)}</title>
<style>
:root{--bg:#fff;--pn:#f6f7f9;--bd:#e2e5ea;--tx:#1a1d23;--mu:#667;--ac:#3b5bdb}
html[data-t=dark]{--bg:#0f1115;--pn:#171a21;--bd:#2a2f3a;--tx:#e6e8ee;--mu:#9aa3b2;--ac:#7c9cff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);
  font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
header{display:flex;gap:10px;align-items:center;padding:10px 14px;border-bottom:1px solid var(--bd);flex-wrap:wrap}
header h1{font-size:15px;margin:0;flex:1;min-width:200px}
button,input{font:inherit;padding:6px 10px;border:1px solid var(--bd);border-radius:7px;background:var(--pn);color:var(--tx);cursor:pointer}
input{cursor:text;min-width:170px}
#wrap{padding:16px;overflow:auto}
svg{max-width:100%;height:auto}
.dim{opacity:.12;transition:opacity .15s}
.hi rect,.hi circle,.hi polygon,.hi path{stroke-width:2.5px!important}
#hint{color:var(--mu);font-size:12px;padding:0 14px 12px}
</style></head><body>
<header>
  <h1>${esc(tiêu)}</h1>
  ${g.nodes.length ? '<input id="q" type="search" placeholder="Lọc node…"><button id="reset">Bỏ chọn</button>' : ''}
  <button id="theme">Sáng/Tối</button>
  <button id="dlsvg">Tải SVG</button>
  <button id="dlpng">Tải PNG</button>
</header>
<div id="hint">${g.nodes.length
    ? 'Bấm một node để chỉ hiện node đó cùng thứ nối trực tiếp với nó. Không có thư viện nào chạy nền — hình đã được biên dịch sẵn.'
    : 'Sơ đồ loại này không có node bấm được (ERD/sequence/state) — trang chỉ để xem và tải về. Không có thư viện nào chạy nền.'}</div>
<div id="wrap">${svg}</div>
<script>
var G=${JSON.stringify(g)};
var svg=document.querySelector('#wrap svg');
function tất(){return svg.querySelectorAll('.node, .edgePath, .edgePaths > g, path.flowchart-link, .edgeLabel')}
function bỏChọn(){tất().forEach(function(e){e.classList.remove('dim','hi')})}
function idCủa(el){var m=/flowchart-(.+?)-\\d+$/.exec(el.id||'');return m?m[1]:null}
function chọn(id){
  var kề={};kề[id]=1;
  G["cạnh"].forEach(function(c){if(c.a===id)kề[c.b]=1;if(c.b===id)kề[c.a]=1});
  svg.querySelectorAll('.node').forEach(function(n){
    var x=idCủa(n);if(!x)return;
    n.classList.toggle('dim',!kề[x]);n.classList.toggle('hi',x===id)});
  var giữ={};
  G["cạnh"].forEach(function(c){if(c.a===id||c.b===id)giữ[c.id]=1});
  svg.querySelectorAll('[id^="L_"]').forEach(function(p){
    var base=(p.id||'').replace(/^.*?(L_)/,'L_');
    p.classList.toggle('dim',!giữ[base])});
  // Nhãn cạnh không mang id — mờ hết rồi bật lại theo vị trí là không đáng tin, nên để nguyên.
}
svg.querySelectorAll('.node').forEach(function(n){
  n.style.cursor='pointer';
  n.addEventListener('click',function(e){e.stopPropagation();var id=idCủa(n);if(id)chọn(id)})});
var _r=document.getElementById('reset');if(_r)_r.onclick=bỏChọn;
document.getElementById('wrap').onclick=function(e){if(e.target.closest('.node'))return;bỏChọn()};
var _q=document.getElementById('q');if(_q)_q.oninput=function(e){
  var q=e.target.value.trim().toLowerCase();
  if(!q){bỏChọn();return}
  svg.querySelectorAll('.node').forEach(function(n){
    n.classList.toggle('dim',(n.textContent||'').toLowerCase().indexOf(q)<0)})};
document.getElementById('theme').onclick=function(){
  var h=document.documentElement;h.dataset.t=h.dataset.t==='dark'?'light':'dark'};
function tải(tên,blob){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=tên;a.click()}
document.getElementById('dlsvg').onclick=function(){
  tải(${JSON.stringify(slug(tiêu, 1))}+'.svg',new Blob([svg.outerHTML],{type:'image/svg+xml'}))};
document.getElementById('dlpng').onclick=function(){
  var s=new XMLSerializer().serializeToString(svg);
  var img=new Image();var b=svg.getBoundingClientRect();
  img.onload=function(){var c=document.createElement('canvas');
    c.width=b.width*2;c.height=b.height*2;var x=c.getContext('2d');
    x.fillStyle=getComputedStyle(document.body).backgroundColor;x.fillRect(0,0,c.width,c.height);
    x.drawImage(img,0,0,c.width,c.height);
    c.toBlob(function(bl){tải(${JSON.stringify(slug(tiêu, 1))}+'.png',bl)})};
  img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(s)))};
</script>
<!-- Nguồn Mermaid, giữ lại để sửa được về sau:
${esc(mã)}
--></body></html>`;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
