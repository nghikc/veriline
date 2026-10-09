#!/usr/bin/env node
/*
 * ba-html-design/check-shell.js — soát KHUNG DÙNG CHUNG của mọi `html-design.html` (zero-dep).
 *
 *   node .claude/skills/ba-html-design/scripts/check-shell.js [docsDir=docs] [--json]
 *
 * VÌ SAO CẦN: `ba-html-design` dựng MỘT màn mỗi lần, mỗi lần một phiên độc lập — nên không
 * phiên nào thấy được thứ chỉ lộ ra khi đặt 6 màn cạnh nhau: màn có header màn không, cùng
 * một avatar ba tên class, không màn nào có menu, hàng nút trạng thái chỗ 4 chỗ 14 nút.
 * Đây đúng là loại lỗi phải soát bằng SCRIPT (đếm được, so được), không phải bằng mắt.
 *
 * Script chỉ ĐỌC và ĐẾM — không phán "đẹp/xấu". Canon: ba-html-design/shell.md.
 * Exit code = số lỗi (0 = sạch).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2).filter(a => !a.startsWith('--'));
const JSON_MODE = process.argv.includes('--json');
const DOCS = path.resolve(argv[0] || 'docs');

let errors = 0, warns = 0;
const out = [];
const fail = (m) => { out.push({ lv: '❌', m }); errors++; };
const warn = (m) => { out.push({ lv: '⚠️ ', m }); warns++; };
const ok = (m) => out.push({ lv: '✓', m });

/* ---- 1. Gom mọi html-design.html ---- */
function walk(dir, acc = []) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'removed') walk(p, acc); }   // màn đã cắt: không soát
    else if (e.name === 'html-design.html') acc.push(p);
  }
  return acc;
}
const files = walk(DOCS).sort();
if (!files.length) {
  console.log(`Không thấy html-design.html nào trong ${DOCS}.`);
  process.exit(0);
}

/* ---- 2. Bóc đặc điểm khung từng file ---- */
// Tên class ĐƯỢC PHÉP cho khung (shell.md §1.3). Class của nội dung màn không bị soát —
// script chỉ quản phần KHUNG, chỗ duy nhất bắt buộc giống nhau giữa các màn.
const ALLOWED = new Set(['app-header', 'brand', 'brand--stacked', 'brand-icon', 'brand-name',
  'app-nav', 'app-nav__link', 'app-nav__toggle', 'header-tools', 'icon-btn', 'badge-count',
  'avatar-btn', 'avatar', 'avatar--sm', 'avatar--md', 'avatar--lg', 'auth-shell']);
// Tên đã gây lệch thật trong example/ → bắt đích danh cho thông báo nói được cách sửa.
const BANNED = { 'av': 'avatar', 'avatar xs': 'avatar avatar--sm', 'avatar sm': 'avatar avatar--sm',
  'avatar lg': 'avatar avatar--lg', 'av xs': 'avatar avatar--sm', 'av sm': 'avatar avatar--sm' };
const UI_LABELS = ['Mặc định', 'Đang tải', 'Rỗng', 'Lỗi'];

const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
// Nhãn thường mở đầu bằng emoji chỉ dấu (🟢 Mặc định). Emoji là phần TRANG TRÍ, không phải
// tên trạng thái — so nhãn thì bỏ nó đi, nếu không mọi nhãn đều bị coi là ngoài canon.
const bare = (t) => t.replace(/^[^\p{L}\p{N}]+/u, '').trim();

const seen = files.map((f) => {
  const s = fs.readFileSync(f, 'utf8');
  const rel = path.relative(DOCS, f);
  const screen = path.basename(path.dirname(f));
  const header = (s.match(/<header[^>]*class="[^"]*app-header[^"]*"[\s\S]*?<\/header>/) || [])[0] || '';
  const navBlock = (s.match(/<nav[^>]*class="[^"]*app-nav[^"]*"[\s\S]*?<\/nav>/) || [])[0] || '';
  const navItems = [...navBlock.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].map((m) => strip(m[1]));
  const demo = (s.match(/<div[^>]*class="[^"]*statebar[^"]*"[\s\S]*?<!-- ▲ UI-STATE-BAR -->/) || [])[0]
    || (s.match(/class="demo-nav"[\s\S]{0,4000}?<\/div>/) || [])[0] || '';
  const groups = [...demo.matchAll(/data-group="([a-z]+)"/g)].map((m) => m[1]);
  const btns = [...demo.matchAll(/<button[^>]*class="[^"]*(?:statebar__btn|demo-btn)[^"]*"[^>]*>([\s\S]*?)<\/button>/g)]
    .map((m) => strip(m[1]));
  const traces = [...demo.matchAll(/data-trace="([^"]+)"/g)].map((m) => m[1]);
  return {
    file: rel, screen, s, header, navItems, demo, groups, btns, traces,
    hasAuthShell: /class="[^"]*auth-shell/.test(s),
    hasHeader: !!header,
    hasDemo: !!demo,
    canonDemo: /statebar__btn/.test(demo),
  };
});

/* ---- 3. Phân vùng: app-shell hay auth-shell ---- */
// Suy từ chính file: có auth-shell → auth; có app-header → app. Không có gì → nghi vấn,
// KHÔNG tự đoán theo tên màn (tên màn là quy ước người đặt, không phải dữ liệu tin được).
for (const v of seen) v.zone = v.hasAuthShell ? 'auth' : v.hasHeader ? 'app' : '?';
const appScreens = seen.filter((v) => v.zone === 'app');
const unknown = seen.filter((v) => v.zone === '?');

out.push({ lv: '', m: `Quét ${files.length} màn — app-shell: ${appScreens.length} · auth-shell: ${seen.length - appScreens.length - unknown.length} · chưa rõ: ${unknown.length}` });

for (const v of unknown) {
  fail(`${v.screen}: không có \`app-header\` lẫn \`auth-shell\` — chưa chọn khung nào (shell.md §1.1)`);
}

/* ---- 4. Menu chính phải GIỐNG NHAU giữa các màn app ---- */
if (appScreens.length) {
  const noNav = appScreens.filter((v) => !v.navItems.length);
  for (const v of noNav) fail(`${v.screen}: có \`app-header\` nhưng KHÔNG có \`app-nav\` — người xem không đi đâu được (shell.md §1.2)`);

  const withNav = appScreens.filter((v) => v.navItems.length);
  if (withNav.length > 1) {
    const key = (v) => v.navItems.join(' | ');
    const groupsByNav = new Map();
    for (const v of withNav) {
      const k = key(v);
      if (!groupsByNav.has(k)) groupsByNav.set(k, []);
      groupsByNav.get(k).push(v.screen);
    }
    if (groupsByNav.size > 1) {
      fail(`Menu chính KHÁC NHAU giữa các màn (${groupsByNav.size} biến thể) — phải cùng danh sách, cùng thứ tự:`);
      for (const [k, scr] of groupsByNav) out.push({ lv: '   ', m: `[${k || '(rỗng)'}]  ← ${scr.join(', ')}` });
    } else ok(`Menu chính đồng nhất ở ${withNav.length} màn: ${[...groupsByNav.keys()][0]}`);
  }

  // aria-current: đúng 1 mục được đánh dấu trên mỗi màn
  for (const v of withNav) {
    const n = (v.header.match(/aria-current="page"/g) || []).length;
    if (n !== 1) warn(`${v.screen}: có ${n} mục \`aria-current="page"\` (phải đúng 1 — mục màn đang mở)`);
  }
}

/* ---- 5. Tên class khung ----
 * CHỈ soát ALIAS của các vai trò canon, KHÔNG đòi mọi class trong header phải nằm trong danh
 * sách đóng: panel thông báo, menu tài khoản… là NỘI DUNG hợp lệ của header và mỗi màn được
 * quyền khác nhau. Thứ không được khác là TÊN của cùng một vai trò — đó mới là lệch thật
 * (đã gặp: một avatar ba tên `avatar` / `avatar xs` / `av xs`).
 */
for (const v of seen) {
  const scope = v.header || (v.s.match(/<main[^>]*class="[^"]*auth-shell[\s\S]*?<\/main>/) || [''])[0];
  if (!scope) continue;
  const bad = new Set();
  for (const m of scope.matchAll(/class="([^"]+)"/g)) {
    const raw = m[1].trim();
    if (BANNED[raw]) { bad.add(`"${raw}" → "${BANNED[raw]}"`); continue; }
    for (const c of raw.split(/\s+/)) if (BANNED[c]) bad.add(`"${c}" → "${BANNED[c]}"`);
  }
  // Huy hiệu đếm trên icon phải là `badge-count`; `badge` dành cho chip trạng thái nghiệp vụ
  // trong nội dung. Dùng lẫn thì CSS của hai thứ đè nhau khi ghép màn vào cùng một prototype.
  for (const m of scope.matchAll(/<button[^>]*class="[^"]*icon-btn[^"]*"[\s\S]{0,300}?<\/button>/g)) {
    if (/class="badge"/.test(m[0])) bad.add('"badge" (huy hiệu đếm trên icon) → "badge-count"');
  }
  if (bad.size) fail(`${v.screen}: tên class khung lệch chuẩn (shell.md) — ${[...bad].join(' · ')}`);
}

/* ---- 5b. Emoji trong khung ----
 * Icon của khung (chuông, menu, dấu brand) là inline SVG `stroke="currentColor"` (shell.md §1.3):
 * emoji mỗi máy vẽ một kiểu, không ăn màu token, trình đọc màn hình đọc ra tên emoji. Vùng soát =
 * `app-header` + `app-nav` + phần tử brand (`brand`/`brand-icon`/`brand-name` — ở auth-shell brand
 * nằm ngoài header). Emoji trong NỘI DUNG màn là việc của check-design.js (DS-EMOJI) — cùng phép thử:
 * `\p{Extended_Pictographic}` chỉ tính khi mặc định hiện dạng emoji (có U+FE0F hoặc `Emoji_Presentation`),
 * nên ✓ ☰ ▾ (ký tự chữ) không bị bắt. Giới hạn: emoji viết bằng entity (`&#x1F514;`) không thấy.
 */
const EMOJI_RE = /(?:\p{Extended_Pictographic}️|\p{Emoji_Presentation}|[\u{1F000}-\u{1FFFF}])/gu;
const isEmoji = (e) => /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(e);
for (const v of seen) {
  const navBlock = (v.s.match(/<nav[^>]*class="[^"]*app-nav[^"]*"[\s\S]*?<\/nav>/) || [''])[0];
  const brands = [...v.s.matchAll(/<(\w+)[^>]*class="[^"]*(?<![\w-])brand(?:-icon|-name)?(?![\w-])[^"]*"[^>]*>[\s\S]*?<\/\1>/g)].map((m) => m[0]);
  const text = [v.header, navBlock, ...brands].join('\n').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
  const found = [...new Set((text.match(EMOJI_RE) || []).filter(isEmoji))];
  if (found.length) fail(`${v.screen}: emoji trong khung (app-header/app-nav/brand) — ${found.join(' ')} → icon trong khung là inline SVG \`stroke="currentColor"\` + \`aria-hidden="true"\`, nhãn ở \`aria-label\` của nút (shell.md §1.3)`);
}

/* ---- 6. Thanh trạng thái demo ---- */
for (const v of seen) {
  if (!v.hasDemo) { warn(`${v.screen}: không có thanh trạng thái demo (\`statebar\`) — người đọc không xem được UI state`); continue; }
  if (!v.canonDemo) { fail(`${v.screen}: thanh trạng thái còn dùng \`demo-nav/demo-btn\` cũ — chuyển sang \`statebar\` (shell.md §2.2)`); continue; }
  if (!v.groups.includes('ui')) fail(`${v.screen}: thanh trạng thái thiếu nhóm \`data-group="ui"\``);
  else {
    const uiBlock = (v.demo.match(/data-group="ui"[\s\S]*?<\/div>/) || [''])[0];
    const uiBtns = [...uiBlock.matchAll(/<button[\s\S]*?>([\s\S]*?)<\/button>/g)].map((m) => strip(m[1]));
    // Không đòi đủ 4 nhãn: màn không có dữ liệu động thì KHÔNG có trạng thái "Rỗng", ép cho đủ
    // là bịa một trạng thái không tồn tại. Chỉ đòi (a) luôn có "Mặc định", (b) mọi nhãn trong
    // nhóm ui phải thuộc tập canon — đó mới là chỗ đã trôi (Idle/Default/Empty/Lọc rỗng).
    if (!uiBtns.map(bare).includes('Mặc định')) fail(`${v.screen}: nhóm \`ui\` thiếu nút "Mặc định" (đang có: ${uiBtns.join(', ') || 'trống'})`);
    const strange = uiBtns.filter((l) => !UI_LABELS.includes(bare(l)));
    if (strange.length) fail(`${v.screen}: nhóm \`ui\` có nhãn ngoài tập chuẩn — ${strange.map((x) => `"${x}"`).join(', ')} (chỉ được dùng: ${UI_LABELS.join(' · ')}; ca cụ thể để ở nhóm error/biz)`);
  }
  // MỌI nút ca lỗi phải nối được về một dòng `E-S..` của ma trận lỗi. Một nút không có mã nghĩa là
  // hoặc ca đó chưa được đặc tả (thiếu dòng trong srs), hoặc nút bịa ra khi dựng HTML — cả hai đều
  // phải lộ ra. Ca không nằm trong ma trận lỗi (vd trạng thái rỗng) thì thuộc nhóm khác, không phải `error`.
  if (v.groups.includes('error')) {
    const errBlock = (v.demo.match(/data-group="error"[\s\S]*?\n\s*<\/div>/) || [''])[0];
    const errBtns = [...errBlock.matchAll(/<button[\s\S]*?<\/button>/g)].map((m) => m[0]);
    const noTrace = errBtns.filter((b) => !/data-trace="E-S/.test(b)).map((b) => strip(b));
    if (noTrace.length) fail(`${v.screen}: nút ca lỗi thiếu \`data-trace="E-S.."\` — ${noTrace.map((x) => `"${x}"`).join(', ')}`);
  }
  const n = v.btns.length;
  if (n > 12) warn(`${v.screen}: ${n} nút trạng thái — cân nhắc bớt hoặc tách nhóm, thanh dài che mất nội dung thật`);
}

/* ---- 7. In ---- */
if (JSON_MODE) {
  console.log(JSON.stringify({
    docs: DOCS, files: files.length, errors, warns,
    screens: seen.map((v) => ({ screen: v.screen, zone: v.zone, nav: v.navItems, groups: v.groups, buttons: v.btns.length, traces: v.traces })),
    findings: out.filter((o) => o.lv === '❌' || o.lv === '⚠️ ').map((o) => o.lv.trim() + ' ' + o.m),
  }, null, 2));
} else {
  console.log('\n=== Soát khung html-design (chuẩn: ba-html-design/shell.md) ===');
  for (const o of out) console.log(`  ${o.lv} ${o.m}`);
  console.log(`\n=== ${errors} lỗi · ${warns} cảnh báo ===`);
}
process.exit(errors);
