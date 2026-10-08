#!/usr/bin/env node
/*
 * ba-proto-html/check-proto.js — soát prototype MỘT-FILE (zero-dependency).
 *
 * Vì sao cần script riêng: `check-shell.js` soát khung dùng chung bằng cách so TỪNG FILE
 * `html-design.html` của từng màn với nhau. Prototype của luồng prototype-trước gộp mọi màn vào
 * MỘT file, nên script kia không soi được — tức là luật khung dùng chung sẽ mất hiệu lực đúng ở
 * artifact khách nhìn nhiều nhất. Script này soát trong-một-file: đủ màn, nút không dẫn vào hư
 * không, không cạnh chết, menu đồng nhất, và file có thật sự TỰ CHỨA không.
 *
 * Dùng:  node .claude/skills/ba-proto-html/scripts/check-proto.js [docsDir=docs] [--json]
 * Exit code = số lỗi (0 = sạch). Cảnh báo không tính vào exit.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { resolveDoc, readDoc } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));

const argv = process.argv.slice(2).filter(a => !a.startsWith('--'));
const JSON_MODE = process.argv.includes('--json');
const DOCS = path.resolve(argv[0] || 'docs');

let errors = 0, warns = 0;
const E = [], W = [];
const fail = (m) => { E.push(m); errors++; };
const warn = (m) => { W.push(m); warns++; };

const protoPath = resolveDoc(DOCS, 'prototype.html');
const flows = readDoc(DOCS, '00-flows.md');

if (!flows) { console.error('Không thấy 00-flows.md — chạy /ba-flow trước.'); process.exit(2); }
if (!protoPath || !fs.existsSync(protoPath)) { console.error('Không thấy prototype.html — chạy /ba-proto-html trước.'); process.exit(2); }
const html = fs.readFileSync(protoPath, 'utf8');

/* ---- 1. Màn khai trong 00-flows.md (bảng màn sơ bộ) ---- */
// Lấy mọi mã Sxx ở CỘT ĐẦU của một dòng bảng — cột đầu là "Mã tạm" theo template.
const declared = [...new Set(
  flows.split('\n')
    .filter(l => /^\|\s*S\d{2}\s*\|/.test(l))
    .map(l => l.split('|')[1].trim())
)];

/* ---- 2. Màn có thật trong prototype ---- */
const built = [...new Set([...html.matchAll(/data-screen="(S\d{2})"/g)].map(m => m[1]))];

for (const s of declared) if (!built.includes(s)) fail(`${s} khai trong 00-flows.md nhưng KHÔNG có section trong prototype`);
for (const s of built) if (!declared.includes(s)) warn(`${s} có trong prototype nhưng không có ở bảng màn sơ bộ — thừa hay quên khai?`);

/* ---- 3. Nút điều hướng không được dẫn vào hư không ---- */
const gotos = [...new Set([...html.matchAll(/data-goto="([^"]+)"/g)].map(m => m[1]))];
for (const g of gotos) if (!built.includes(g)) fail(`nút data-goto="${g}" trỏ tới màn KHÔNG tồn tại trong file`);

/* ---- 4. Cạnh điều hướng trong 00-flows.md phải có nút tương ứng ---- */
// Sxx -->|nhãn| Syy  (nhãn là chữ người dùng bấm)
// Node Mermaid thường MANG NHÃN: `S01[Lịch phòng] -->|…| S02[Đặt phòng]`. Bản đầu đòi mũi tên
// dính ngay sau mã nên bỏ SỐT đúng dạng phổ biến nhất — và bỏ im lặng, tức là cạnh đó không
// được soát mà báo cáo vẫn ghi "sạch". Cho phép nhãn [..] (..) {..} ở cả hai đầu.
const NODE = String.raw`(S\d{2})(?:\[[^\]]*\]|\([^)]*\)|\{[^}]*\})?`;
const edges = [...flows.matchAll(new RegExp(NODE + String.raw`\s*--?>\|([^|]*)\|\s*` + NODE, "g"))].map(m => ({ from: m[1], to: m[3], label: m[2].trim() }));
for (const e of edges) {
  if (!gotos.includes(e.to)) fail(`cạnh ${e.from} →|${e.label}| ${e.to} không có nút nào trong prototype — cạnh chết`);
  else if (e.label && !html.includes(e.label)) warn(`nhãn cạnh "${e.label}" (${e.from}→${e.to}) không thấy nguyên văn trong prototype — nút đặt tên khác luồng`);
}
if (!edges.length) warn('00-flows.md không có cạnh `Sxx -->|nhãn| Syy` — không kiểm được điều hướng');

/* ---- 5. Tự chứa: gửi qua email vẫn phải chạy ---- */
if (/<iframe/i.test(html)) fail('có <iframe> — prototype phải TỰ CHỨA (một file, mở là chạy)');
for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) fail(`<script src="${m[1]}"> — tài nguyên ngoài, mở offline sẽ hỏng`);
for (const m of html.matchAll(/<link[^>]+href=["'](https?:|\/\/)[^"']*["']/gi)) fail(`<link href> ra ngoài (${m[1]}…) — tài nguyên ngoài`);
if (/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(html)) warn('có gọi mạng (fetch/XHR/WebSocket) — prototype nên chạy hoàn toàn offline');
if (/100vw/.test(html)) warn('dùng `100vw` — sinh thanh cuộn ngang khi có scrollbar dọc (shell.md)');

/* ---- 6. Khung dùng chung: menu phải giống nhau ở mọi màn app-shell ---- */
// Luật XUYÊN MÀN — chỉ lộ khi đặt các màn cạnh nhau, đúng loại lỗi mắt thường bỏ qua.
const sections = [...html.matchAll(/<section[^>]*data-screen="(S\d{2})"[\s\S]*?<\/section>/g)];
const menus = {};
for (const sec of sections) {
  const [body, code] = [sec[0], sec[1]];
  if (!/app-shell|app-header/.test(body)) continue;         // màn auth không cần menu
  const items = [...body.matchAll(/<a[^>]*class="[^"]*nav-item[^"]*"[^>]*>([^<]*)</g)].map(m => m[1].trim());
  menus[code] = items.join(' | ');
}
const distinct = [...new Set(Object.values(menus))];
if (distinct.length > 1) {
  fail(`menu chính KHÔNG đồng nhất giữa các màn (${distinct.length} biến thể): ` +
    Object.entries(menus).map(([k, v]) => `${k}="${v || '(rỗng)'}"`).join(' · '));
} else if (distinct.length === 1 && Object.keys(menus).length) {
  // ok
} else if (Object.keys(menus).length === 0 && built.length > 1) {
  warn('không màn nào có `app-shell`/`app-header` — kiểm lại khung dùng chung (shell.md §1.1)');
}

/* ---- 7. Bảng điều khiển demo: người demo phải nhảy màn được ---- */
if (!/data-goto/.test(html)) fail('không có nút điều hướng nào (`data-goto`) — prototype không bấm được');

/* ---- Báo cáo ---- */
if (JSON_MODE) {
  console.log(JSON.stringify({ prototype: path.relative(process.cwd(), protoPath), mànKhai: declared, mànDựng: built, cạnh: edges.length, lỗi: E, cảnhBáo: W }, null, 2));
} else {
  console.log(`\n=== Soát prototype một-file (canon: ba-proto-html/SKILL.md) ===`);
  console.log(`   ${built.length} màn dựng / ${declared.length} màn khai · ${edges.length} cạnh điều hướng · ${gotos.length} đích nút`);
  E.forEach(m => console.log(`  ❌ ${m}`));
  W.forEach(m => console.log(`  ⚠️  ${m}`));
  if (!errors && !warns) console.log('  ✓ Prototype sạch: đủ màn, nút nối đúng, tự chứa, khung đồng nhất');
  console.log(`\n=== ${errors} lỗi · ${warns} cảnh báo ===`);
}
process.exit(errors);
