#!/usr/bin/env node
/*
 * ba-html-design/embed-assets.js — nhúng tài sản lấy từ Figma (ảnh, icon, phông) vào html-design.html để file
 * vẫn TỰ CHỨA, mở offline (docs/decisions/36). Vừa là module `require`, vừa là CLI.
 *
 * Tài sản nằm ở `docs/Ho-so/figma-assets/` (img/ · icons/ · fonts/fonts-embed.css · manifest.json) — references/figma-source.md.
 *
 * Module:  const A = require('<skill>/scripts/embed-assets.js');
 *          A.fontCss(dir) · A.img(dir, 'binh.png') → 'data:image/png;base64,…' · A.icon(dir, 'tick.svg') → '<svg aria-hidden="true" …>'
 * CLI:     node embed-assets.js font-css [docsDir=docs]
 *          node embed-assets.js img  <file> [docsDir=docs]      (in data URI)
 *          node embed-assets.js icon <file> [docsDir=docs]      (in SVG inline)
 *          node embed-assets.js list [docsDir=docs]             (đếm ảnh/icon/phông, đối chiếu manifest.json)
 * Exit: 0 xong · 2 không thấy thư mục tài sản / file.
 *
 * gioiHan: không nén ảnh (thu nhỏ trước khi đặt vào img/); icon PNG (icon thư viện ngoài cắt từ ảnh frame) trả thẻ <img>;
 * SVG nhiều màu giữ nguyên màu — chỉ SVG đơn sắc mới được đổi sang currentColor lúc xuất (việc của bước xuất, không phải script này).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: không cụt khi process.exit qua pipe (lint 43)
const fs = require('fs');
const path = require('path');
const docpath = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' };

function assetsDir(docsDir) {
  const p = docpath.resolveDoc(path.resolve(docsDir || 'docs'), 'figma-assets');
  return p && fs.existsSync(p) ? p : null;
}
function đọc(dir, sub, name) {
  const p = path.join(dir, sub, name);
  if (!fs.existsSync(p)) { const e = new Error(`không thấy ${path.join(sub, name)} trong ${dir}`); e.code = 'ENOENT'; throw e; }
  return p;
}
function fontCss(dir) { return fs.readFileSync(đọc(dir, 'fonts', 'fonts-embed.css'), 'utf8'); }
function img(dir, name) {
  const p = đọc(dir, 'img', name);
  return `data:${MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'};base64,${fs.readFileSync(p).toString('base64')}`;
}
function icon(dir, name) {
  const p = đọc(dir, 'icons', name);
  if (path.extname(p).toLowerCase() !== '.svg') {
    const uri = `data:${MIME[path.extname(p).toLowerCase()] || 'image/png'};base64,${fs.readFileSync(p).toString('base64')}`;
    return `<img src="${uri}" alt="" aria-hidden="true">`;
  }
  const s = fs.readFileSync(p, 'utf8').replace(/<\?xml[^>]*>\s*/, '');
  return /aria-hidden/.test(s.slice(0, 200)) ? s : s.replace(/<svg\b/, '<svg aria-hidden="true" focusable="false"');
}
function list(dir) {
  const đếm = (sub, re) => { try { return fs.readdirSync(path.join(dir, sub)).filter((f) => re.test(f)); } catch { return []; } };
  const imgs = đếm('img', /\.(png|jpe?g|webp|gif|svg)$/i), icons = đếm('icons', /\.(svg|png)$/i);
  let man = null; try { man = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')); } catch { man = null; }
  const ds = Array.isArray(man) ? man : man && Array.isArray(man.items) ? man.items : null;
  const trongMan = new Set((ds || []).map((x) => path.basename(x.file || '')));
  const lạc = [...imgs, ...icons].filter((f) => ds && !trongMan.has(f));
  return { imgs: imgs.length, icons: icons.length, font: fs.existsSync(path.join(dir, 'fonts', 'fonts-embed.css')), manifest: ds ? ds.length : null, lạc };
}
module.exports = { assetsDir, fontCss, img, icon, list };

if (require.main === module) {
  const [cmd, a1, a2] = process.argv.slice(2);
  const docs = cmd === 'font-css' || cmd === 'list' ? a1 : a2;
  const dir = assetsDir(docs);
  if (!['font-css', 'img', 'icon', 'list'].includes(cmd)) {
    console.error('Dùng: embed-assets.js font-css|list [docsDir] · img|icon <file> [docsDir]'); process.exit(2);
  }
  if (!dir) { console.error(`Không thấy figma-assets/ trong ${docs || 'docs'} (Ho-so/ hoặc gốc) — xuất tài sản từ Figma trước (references/figma-source.md).`); process.exit(2); }
  try {
    if (cmd === 'font-css') process.stdout.write(fontCss(dir));
    else if (cmd === 'img') process.stdout.write(img(dir, a1));
    else if (cmd === 'icon') process.stdout.write(icon(dir, a1));
    else {
      const r = list(dir);
      console.log(`figma-assets: ${r.imgs} ảnh · ${r.icons} icon · phông nhúng: ${r.font ? 'có' : 'chưa có'} · manifest.json: ${r.manifest === null ? 'chưa có' : r.manifest + ' mục'}`);
      if (r.lạc.length) console.log(`  ⚠️  ${r.lạc.length} file không có trong manifest.json: ${r.lạc.slice(0, 8).join(', ')}${r.lạc.length > 8 ? '…' : ''}`);
    }
  } catch (e) { console.error(e.message); process.exit(2); }
}
