#!/usr/bin/env node
/*
 * ba-html-design/figma-fonts.js — phông lấy theo tên trong design Figma → CSS @font-face nhúng base64
 * (`docs/Ho-so/figma-assets/fonts/fonts-embed.css`) để html-design/prototype vẫn tự chứa (docs/decisions/36).
 *
 * Script KHÔNG tự mở kết nối mạng (scan-skills: script mở mạng là 🔴 chặn cài). Chia hai bước:
 *   1. `urls`  — in danh sách tệp cần tải từ Fontsource (jsDelivr) cho phông OFL: woff2 theo subset/weight/style
 *               + tệp CSS (lấy unicode-range) + LICENSE. Agent/người tải bằng công cụ của máy (curl…) vào <dir>.
 *   2. `embed` — đọc các tệp đã tải trong <dir>, sinh/cập nhật khối của phông đó trong fonts-embed.css.
 *      `--alias "<Tên> Display"`: đặt tên họ khác tên phông thật — dùng khi design dùng phông THƯƠNG MẠI chưa có file
 *      (vd tiêu đề Blacker Pro Display): nhúng phông OFL gần dáng dưới bí danh, khi có file thật chỉ thay khối bí danh.
 *   3. `local` — nhúng tệp phông người dùng gửi (.woff2/.woff/.otf/.ttf, kể cả phông thương mại có giấy phép web) dưới một tên họ.
 *
 * Dùng:  figma-fonts.js urls  <family> [--version 5.3.0] [--weights 400] [--styles normal] [--subsets latin,latin-ext,vietnamese]
 *        figma-fonts.js embed <dir> --family "<Tên>" [--alias "<Bí danh>"] [--out <fonts-embed.css>]
 *        figma-fonts.js local <file…> --family "<Tên>" [--weight 700] [--style italic] [--out <fonts-embed.css>]
 * Exit: 0 xong · 1 thiếu tệp đã liệt kê (không ghi nửa vời) · 2 tham số sai.
 *
 * gioiHan: chỉ biết cách đặt tên tệp của Fontsource (`<slug>-<subset>-<weight>-<style>.woff2`); phông Figma không có trên
 * Fontsource (phông thương mại, phông hệ thống Apple) thì `urls` vẫn in đường dẫn nhưng tải sẽ hỏng — đó là tín hiệu dùng
 * `--alias` + phông thay hoặc `local`. Không kiểm giấy phép thay người dùng: phông thương mại chỉ nhúng khi họ xác nhận có quyền dùng trên web.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: không cụt khi process.exit qua pipe (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d; };
const pos = argv.slice(1).filter((a, i, arr) => !a.startsWith('--') && !(arr[i - 1] || '').startsWith('--'));
const slug = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const list = (v) => String(v).split(',').map((x) => x.trim()).filter(Boolean);
const BASE = 'https://cdn.jsdelivr.net/npm/@fontsource';

function tệpCần(family, ver, weights, styles, subsets) {
  const s = slug(family), out = [];
  for (const w of weights) for (const st of styles) {
    for (const sub of subsets) out.push({ file: `${s}-${sub}-${w}-${st}.woff2`, url: `${BASE}/${s}@${ver}/files/${s}-${sub}-${w}-${st}.woff2` });
    const css = st === 'normal' ? `${w}.css` : `${w}-${st}.css`;
    out.push({ file: `${s}-${css}`, url: `${BASE}/${s}@${ver}/${css}` });
  }
  out.push({ file: `LICENSE-${s}.txt`, url: `${BASE}/${s}@${ver}/LICENSE` });
  return out;
}

function ghiKhối(outFile, key, css) {
  const đầu = `/* ba-figma-font:${key} */`, cuối = `/* end:${key} */`;
  let cũ = ''; try { cũ = fs.readFileSync(outFile, 'utf8'); } catch { cũ = ''; }
  const khối = `${đầu}\n${css}\n${cuối}`;
  const i = cũ.indexOf(đầu), j = cũ.indexOf(cuối);
  const mới = i >= 0 && j > i ? cũ.slice(0, i) + khối + cũ.slice(j + cuối.length) : (cũ.trim() ? cũ.replace(/\s*$/, '\n') : '') + khối + '\n';
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, mới);
}
const fmt = (f) => ({ '.woff2': 'woff2', '.woff': 'woff', '.otf': 'opentype', '.ttf': 'truetype' }[path.extname(f).toLowerCase()]);

if (cmd === 'urls') {
  const fam = pos[0];
  if (!fam) { console.error('Dùng: figma-fonts.js urls <family> [--version] [--weights] [--styles] [--subsets]'); process.exit(2); }
  const ds = tệpCần(fam, opt('--version', '5.3.0'), list(opt('--weights', '400')), list(opt('--styles', 'normal')), list(opt('--subsets', 'latin,latin-ext,vietnamese')));
  console.log(`# ${fam} — ${ds.length} tệp cần tải vào một thư mục (vd docs/Ho-so/figma-assets/fonts/src/):`);
  for (const d of ds) console.log(`${d.url}  ->  ${d.file}`);
  console.log('# Tải xong: figma-fonts.js embed <thư mục> --family "' + fam + '"  (phông thương mại không có ở đây → --alias + phông OFL thay, hoặc lệnh local)');
  process.exit(0);
}

if (cmd === 'embed') {
  const dir = pos[0], fam = opt('--family');
  if (!dir || !fam) { console.error('Dùng: figma-fonts.js embed <dir> --family "<Tên>" [--alias "<Bí danh>"] [--out <css>]'); process.exit(2); }
  const s = slug(fam), name = opt('--alias', fam);
  let ents = []; try { ents = fs.readdirSync(dir); } catch { console.error(`Không thấy thư mục ${dir}.`); process.exit(1); }
  const woff = ents.filter((f) => f.startsWith(s + '-') && f.endsWith('.woff2')).sort();
  if (!woff.length) { console.error(`${dir}: không có tệp ${s}-*.woff2 — tải theo danh sách của "figma-fonts.js urls ${fam}" trước. Chưa ghi gì.`); process.exit(1); }
  const blocks = [];
  for (const f of woff) {
    const m = f.slice(s.length + 1, -6).match(/^(.+)-(\d{3})-(normal|italic)$/);
    if (!m) { console.error(`Tên tệp ${f} không theo mẫu <slug>-<subset>-<weight>-<style>.woff2.`); process.exit(1); }
    const [, sub, w, st] = m;
    const cssF = path.join(dir, `${s}-${st === 'normal' ? w : w + '-' + st}.css`);
    let ur = null;
    if (fs.existsSync(cssF)) {
      const css = fs.readFileSync(cssF, 'utf8');
      const blk = css.split('@font-face').find((b) => b.includes(`${s}-${sub}-${w}-${st}.woff2`));
      ur = blk && (blk.match(/unicode-range:\s*([^;]+);/) || [])[1];
    }
    blocks.push(`@font-face{font-family:'${name}';font-style:${st};font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}) format('woff2')${ur ? `;unicode-range:${ur.trim()}` : ''}}`);
    if (!ur) console.log(`  ⚠️  ${f}: không thấy unicode-range trong ${path.basename(cssF)} — nhúng không giới hạn dải ký tự`);
  }
  const out = opt('--out', path.join(path.resolve(dir, '..'), 'fonts-embed.css')); // fonts/src/ → fonts/fonts-embed.css
  const ghiChú = name !== fam ? `/* ${name} = TẠM ${fam} (OFL) — thay khối này khi có tệp phông thật của design */` : `/* ${fam} (OFL — LICENSE-${s}.txt) */`;
  ghiKhối(out, slug(name), `${ghiChú}\n${blocks.join('\n')}`);
  console.log(`${fam}${name !== fam ? ` (bí danh "${name}")` : ''}: ${blocks.length} @font-face → ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
  process.exit(0);
}

if (cmd === 'local') {
  const fam = opt('--family'), fs0 = pos.filter((f) => fmt(f));
  if (!fam || !fs0.length) { console.error('Dùng: figma-fonts.js local <tệp phông…> --family "<Tên>" [--weight 700] [--style italic] [--out <css>]'); process.exit(2); }
  const thiếu = fs0.filter((f) => !fs.existsSync(f));
  if (thiếu.length) { console.error(`Không thấy: ${thiếu.join(', ')} — chưa ghi gì.`); process.exit(1); }
  const w = opt('--weight', '400'), st = opt('--style', 'normal');
  const blocks = fs0.map((f) => `@font-face{font-family:'${fam}';font-style:${st};font-weight:${w};font-display:swap;src:url(data:font/${fmt(f) === 'opentype' ? 'otf' : fmt(f) === 'truetype' ? 'ttf' : fmt(f)};base64,${fs.readFileSync(f).toString('base64')}) format('${fmt(f)}')}`);
  const out = opt('--out', 'fonts-embed.css');
  ghiKhối(out, slug(fam), `/* ${fam} — tệp người dùng gửi (${fs0.map((f) => path.basename(f)).join(', ')}); giấy phép dùng trên web do người gửi xác nhận */\n${blocks.join('\n')}`);
  console.log(`${fam}: ${blocks.length} @font-face → ${out}`);
  process.exit(0);
}

console.error('Dùng: figma-fonts.js urls|embed|local … (xem đầu tệp)'); process.exit(2);
