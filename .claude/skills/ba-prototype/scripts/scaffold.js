#!/usr/bin/env node
/**
 * ba-prototype/scaffold.js — dựng một project Vite + React + React Router làm PROTOTYPE
 * bấm-được: ghép html-design.html mọi màn (giữ nguyên high-fi qua <iframe>) + nối theo flow.
 *
 * Triết lý: cơ giới hóa phần XÁC ĐỊNH (dựng khung project, copy html-design, rút cạnh điều
 * hướng từ sitemap-flows.md, sinh wiring.json), để LLM (skill) chỉ lo phần PHÁN ĐOÁN (tinh
 * chỉnh wiring.json: nút nào trên màn → sang màn nào cho khớp flow). KHÔNG tự npm install.
 *
 * Cách dùng:
 *   node .claude/skills/ba-prototype/scripts/scaffold.js [docsDir=docs] [outDir=prototype] [--force]
 *
 * Đầu vào: mỗi màn `html-design.html` (nguồn cao cấp; quét cả Screen-spec/ lẫn layout cũ),
 *   `sitemap-flows.md` (rút cạnh Sxx -->|nhãn| Syy để wire CTA), `03-overview.md` (tên màn).
 * Đầu ra: project `prototype/` — public/screens/<mã>.html (bản copy html-design), src/App.jsx
 *   (thanh điều hướng + iframe + bắt click same-origin → navigate), src/wiring.json (LLM sửa),
 *   package.json/vite.config/index.html/README. Chạy: cd prototype && npm install && npm run dev.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const raw = process.argv.slice(2);
const FORCE = raw.includes('--force');
const pos = raw.filter(a => !a.startsWith('--'));
const DOCS = path.resolve(pos[0] || 'docs');
const OUT = path.resolve(pos[1] || 'prototype');
if (!fs.existsSync(DOCS)) { console.error(`Không thấy docsDir: ${DOCS}`); process.exit(2); }
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const W = (rel, content) => { const p = path.join(OUT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); };

// ─── 1. Quét màn (Screen-spec aware) + html-design ──────────────────────────────────
const isScreenDir = (n) => /^S\d+ - /.test(n);
const screens = [];
const walk = (dir, group, prefix) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (isScreenDir(e.name)) {
      const m = e.name.match(/^(S\d+) - (.+)$/);
      screens.push({ code: m[1], name: m[2], absDir: path.join(dir, e.name) });
    } else if (e.name === 'Screen-spec' && !group) walk(path.join(dir, e.name), '', prefix + e.name + '/');
    else if (!group) walk(path.join(dir, e.name), e.name, prefix + e.name + '/');
  }
};
walk(DOCS, '', '');
screens.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
if (!screens.length) { console.error('Không thấy folder màn (S.. - ..) trong ' + DOCS); process.exit(2); }
for (const s of screens) s.html = read(path.join(s.absDir, 'html-design.html'));
const missingHtml = screens.filter(s => !s.html).map(s => s.code);

// ─── 2. Đọc html-design tìm phần tử bấm-được (nút/link) thật + id ───────────────────
const stripTags = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const attr = (tag, name) => { const m2 = tag.match(new RegExp('\\b' + name + '=["\\\']([^"\\\']+)["\\\']', 'i')); return m2 ? m2[1] : null; };
function parseClickables(html) {
  const out = [];
  const push = (m2, text) => out.push({ tag: m2[1], text, gt: m2.index + m2[0].indexOf('>') }); // gt = offset của '>' đóng thẻ mở (để chèn id)
  for (const m2 of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) push(m2, stripTags(m2[2]));
  for (const m2 of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) push(m2, stripTags(m2[2]));
  for (const m2 of html.matchAll(/<input\b([^>]*\btype=["']?(?:submit|button)["']?[^>]*)>/gi)) push(m2, '');
  return out
    .filter(e => !/\bonclick=/i.test(e.tag)) // bỏ phần tử có handler riêng (vd nút demo-state của html-design) — không hijack
    .map(e => ({ id: attr(e.tag, 'id'), text: (e.text || attr(e.tag, 'value') || '').trim(), gt: e.gt }))
    .filter(e => e.id || e.text);
}
for (const s of screens) s.clickables = parseClickables(s.html || '');

// Tên hiển thị tiếng Việt của màn (03-overview.md) — nhãn menu trong html-design là tiếng Việt
// ("Tổ chức"), còn tên folder là PascalCase không dấu ("Organization"), khớp thẳng sẽ trượt.
const overview = read(path.join(DOCS, '03-overview.md'));
const vnName = {};
for (const m of overview.matchAll(/^\|\s*(S\d+)\s*\|\s*([^|]+?)\s*\|/gm)) vnName[m[1]] = m[2];

// Link menu chính trong app shell (canon: ba-html-design/shell.md §1.2).
function parseNavLinks(html) {
  const nav = (html.match(/<nav[^>]*class="[^"]*app-nav[^"]*"[\s\S]*?<\/nav>/) || [])[0];
  if (!nav) return [];
  const base = html.indexOf(nav);
  const out = [];
  for (const m of nav.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    out.push({ tag: m[1], text: stripTags(m[2]), id: attr(m[1], 'id'),
               gt: base + m.index + m[0].indexOf('>') });
  }
  return out;
}
for (const s of screens) s.navLinks = parseNavLinks(s.html || '');

// Khớp nhãn cạnh ↔ nút thật (token overlap). Trả nút điểm cao nhất nếu qua ngưỡng.
const norm = (s) => (s || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
function bestMatch(label, clickables) {
  const lt = norm(label); if (!lt.length) return null;
  let best = null, bestScore = 0;
  for (const c of clickables) {
    const ct = new Set(norm(c.text));
    const overlap = lt.filter(t => ct.has(t)).length / lt.length;
    if (overlap > bestScore) { bestScore = overlap; best = c; }
  }
  return bestScore >= 0.5 ? best : null; // ít nhất nửa số từ của nhãn xuất hiện trên nút
}

// ─── 3. Rút cạnh điều hướng từ sitemap-flows.md (Sxx -->|nhãn| Syy) → wiring chi tiết ─
const flows = require('../../ba-toolkit/scripts/docpath.js').readDoc(DOCS, 'sitemap-flows.md');
const codeSet = new Set(screens.map(s => s.code));
const byCode = Object.fromEntries(screens.map(s => [s.code, s]));
const wiring = { _help: 'Nút trong màn -> màn đích. Khớp theo "id" (chính xác) nếu có, không thì "text" (chứa). Sửa cho khớp nút thật; "to" phải là mã màn tồn tại.' };
screens.forEach(s => { wiring[s.code] = []; s.injections = []; s._ctaN = 0; });
const edgeRe = /(S\d+)[^\n>]*?-->\s*(?:\|([^|]+)\|)?\s*(S\d+)/g;
let m, edgeCount = 0, preciseCount = 0, genCount = 0;
while ((m = edgeRe.exec(flows))) {
  const [, from, label, to] = m;
  if (!codeSet.has(from) || !codeSet.has(to)) continue;
  const lbl = (label || '').trim();
  const s = byCode[from];
  const hit = bestMatch(lbl, s.clickables || []);
  const rule = { to };
  if (hit && hit.id) { rule.id = hit.id; rule.text = hit.text || lbl; preciseCount++; }
  else if (hit && hit.text) {
    // Nút CTA khớp nhưng CHƯA có id → sinh id + chèn vào bản copy html để khớp chính xác
    const genid = `proto-cta-${from.toLowerCase()}-${++s._ctaN}`;
    s.injections.push({ gt: hit.gt, id: genid });
    hit.id = genid; // cạnh khác trỏ cùng nút sẽ tái dùng id này (không sinh trùng)
    rule.id = genid; rule.text = hit.text; preciseCount++; genCount++;
  }
  else { rule.text = lbl; } // không tìm được nút khớp → giữ nhãn cạnh (LLM sửa)
  wiring[from].push(rule);
  edgeCount++;
}

// ─── 3. Dọn/ghi thư mục ─────────────────────────────────────────────────────────────
if (fs.existsSync(OUT) && fs.readdirSync(OUT).length && !FORCE) {
  console.error(`"${OUT}" đã có nội dung. Dùng --force để ghi đè (giữ node_modules).`);
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

// ─── 3c. Menu chính: nối link trong màn → điều hướng thật, DÙNG CHUNG cho mọi màn ───
// Sau khi `ba-html-design` áp khung chung (shell.md), mọi màn vùng đã đăng nhập mang cùng một
// menu — nhưng trong html tĩnh các link là `href="#"`, bấm không đi đâu. Ở prototype chúng PHẢI
// đi được, nếu không thì "menu đồng nhất" chỉ là trang trí.
// Rule để ở khoá `_menu` (không nhân bản vào từng màn): một nguồn duy nhất → menu không thể
// lệch giữa các màn, đúng tinh thần khung dùng chung.
const menuTargets = screens.map(s => ({ code: s.code, text: [vnName[s.code], s.name].filter(Boolean).join(' ') }));
const menuRules = new Map();          // code đích -> rule
let menuLinks = 0, menuUnmatched = [];
for (const s of screens) {
  for (const ln of s.navLinks) {
    const hit = bestMatch(ln.text, menuTargets.map(t => ({ id: t.code, text: t.text })));
    if (!hit) { menuUnmatched.push(`${s.code}:"${ln.text}"`); continue; }
    const to = hit.id;
    const id = 'proto-nav-' + to;
    menuLinks++;
    if (!menuRules.has(to)) menuRules.set(to, { id, to });
    // gắn id vào ĐÚNG link đó trong bản copy; bỏ qua nếu offset đã có injection khác
    if (!ln.id && !s.injections.some(i => i.gt === ln.gt)) s.injections.push({ gt: ln.gt, id });
    else if (ln.id) menuRules.set(to, { id: ln.id, to });
  }
}
if (menuRules.size) wiring._menu = [...menuRules.values()];

// Snippet gom bộ chuyển trạng thái demo (.demo-label + .demo-nav) của html-design thành
// popup collapse/expand cố định ở GÓC PHẢI (thay vì thanh trên đầu đẩy màn thật xuống).
// Additive, chỉ đọc DOM sẵn có; không tìm thấy nút demo thì tự no-op. Giữ nguyên onclick=setState.
const STATE_PANEL_SNIPPET = `
<!-- ba-prototype: gom demo-state -> popup collapse/expand goc phai man hinh -->
<style id="proto-state-panel-css">
  #proto-state-panel { position: fixed; top: 12px; right: 12px; z-index: 2147483000;
    font: 13px/1.4 system-ui, -apple-system, sans-serif; }
  #proto-state-panel .pstate-card { background: #fff; border: 1px solid #d1d5db;
    border-radius: 10px; box-shadow: 0 8px 28px rgba(17,24,39,.18); overflow: hidden;
    width: max-content; max-width: 260px; }
  #proto-state-panel .pstate-head { display: flex; align-items: center; gap: 8px;
    padding: 8px 10px; background: #f9fafb; cursor: move; user-select: none;
    touch-action: none; border-bottom: 1px solid #eef0f3; }
  #proto-state-panel.dragging { opacity: .92; }
  #proto-state-panel .pstate-title { font-weight: 600; color: #374151; flex: 1; white-space: nowrap; }
  #proto-state-panel .pstate-toggle { border: 0; background: transparent; cursor: pointer;
    font-size: 15px; line-height: 1; color: #6b7280; padding: 0 2px; }
  #proto-state-panel .pstate-body { padding: 8px 10px; }
  #proto-state-panel .pstate-body .demo-nav { padding: 0; margin: 0; justify-content: flex-start; }
  /* canon statebar: giữ NHÓM CÓ NHÃN khi đưa vào popup — đó là thứ làm thanh 14 nút đọc được */
  #proto-state-panel .pstate-body .statebar__body { display: flex; flex-direction: column;
    gap: 8px; padding: 0; }
  #proto-state-panel .pstate-body .statebar__group { display: flex; flex-wrap: wrap;
    align-items: center; gap: 4px; }
  #proto-state-panel .pstate-body .statebar__label { flex: 0 0 100%; font-size: 11px;
    color: #9ca3af; margin-bottom: 2px; }
  #proto-state-panel .pstate-card { max-width: 300px; }
  #proto-state-panel.collapsed .pstate-body { display: none; }
  #proto-state-panel.collapsed .pstate-head { border-bottom: 0; }
</style>
<script>
(function () {
  function build() {
    if (document.getElementById('proto-state-panel')) return;
    // Canon mới (ba-html-design/shell.md §2): .statebar > .statebar__body chứa các NHÓM có nhãn.
    // Bản cũ: .demo-nav phẳng. Đỡ cả hai — dự án cài trước 16/08/2026 không phải dựng lại html.
    var nav = null, bar = document.querySelector('.statebar');
    if (bar) {
      nav = bar.querySelector('.statebar__body');
      var tg = bar.querySelector('.statebar__toggle');
      if (tg) tg.style.display = 'none';           // panel đã có thanh tiêu đề riêng
    } else {
      var firstBtn = document.querySelector('.demo-btn');
      nav = document.querySelector('.demo-nav') || (firstBtn && firstBtn.parentElement);
      var label = document.querySelector('.demo-label');
      if (label) label.style.display = 'none';
    }
    if (!nav) return;
    var panel = document.createElement('div');
    panel.id = 'proto-state-panel';
    panel.innerHTML =
      '<div class="pstate-card">' +
        '<div class="pstate-head">' +
          '<span class="pstate-title">◆ Trạng thái</span>' +
          '<button class="pstate-toggle" type="button" aria-label="Thu gọn/mở">–</button>' +
        '</div>' +
        '<div class="pstate-body"></div>' +
      '</div>';
    document.body.appendChild(panel);
    panel.querySelector('.pstate-body').appendChild(nav); // giu nguyen cac nut + onclick=setState
    var toggle = panel.querySelector('.pstate-toggle');
    function setCollapsed(v) { panel.classList.toggle('collapsed', v); toggle.textContent = v ? '+' : '–'; }
    // Keo-tha: cam thanh tieu de de di chuyen; bam khong di chuyen -> thu gon/mo.
    var head = panel.querySelector('.pstate-head'), drag = null;
    head.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      var r = panel.getBoundingClientRect();
      drag = { x: e.clientX, y: e.clientY, left: r.left, top: r.top, moved: false };
      panel.style.left = r.left + 'px'; panel.style.top = r.top + 'px'; panel.style.right = 'auto';
      try { head.setPointerCapture(e.pointerId); } catch (_) {}
    });
    head.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      if (!drag.moved) { drag.moved = true; panel.classList.add('dragging'); }
      var w = panel.offsetWidth, h = panel.offsetHeight;
      panel.style.left = Math.max(0, Math.min(window.innerWidth - w, drag.left + dx)) + 'px';
      panel.style.top = Math.max(0, Math.min(window.innerHeight - h, drag.top + dy)) + 'px';
    });
    head.addEventListener('pointerup', function (e) {
      if (!drag) return;
      var moved = drag.moved; drag = null;
      panel.classList.remove('dragging');
      try { head.releasePointerCapture(e.pointerId); } catch (_) {}
      if (!moved) setCollapsed(!panel.classList.contains('collapsed')); // bam thuong -> toggle
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
</script>`;

// 3a. html-design → public/screens/<mã>.html (copy + chèn id sinh cho nút CTA chưa có id
//     + gom demo-state thành popup góc phải)
for (const s of screens) {
  let html = s.html;
  if (html && s.injections.length) {
    for (const inj of s.injections.sort((a, b) => b.gt - a.gt)) { // cuối → đầu: offset trước không lệch
      html = html.slice(0, inj.gt) + ` id="${inj.id}"` + html.slice(inj.gt);
    }
  }
  if (html && /demo-btn|statebar__btn/.test(html)) { // chỉ chèn khi màn có bộ chuyển trạng thái
    html = html.includes('</body>')
      ? html.replace('</body>', STATE_PANEL_SNIPPET + '\n</body>')
      : html + STATE_PANEL_SNIPPET;
  }
  W(path.join('public', 'screens', s.code + '.html'),
    html || `<!doctype html><meta charset="utf-8"><body style="font:14px sans-serif;padding:24px;color:#667">Màn ${s.code} — chưa có html-design.html (chạy ba-html-design).</body>`);
}

// 3b. Các file project (nội dung tĩnh — escape \` và \${ trong template literal của scaffold)
W('package.json', JSON.stringify({
  name: 'prototype', private: true, type: 'module',
  scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
  dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1', 'react-router-dom': '^6.26.2' },
  devDependencies: { '@vitejs/plugin-react': '^4.3.1', vite: '^5.4.8' },
}, null, 2) + '\n');

W('vite.config.js', "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });\n");

W('.gitignore', 'node_modules/\ndist/\n');

W('index.html', [
  '<!doctype html>', '<html lang="vi">', '<head>', '  <meta charset="utf-8" />',
  '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
  '  <title>Prototype</title>', '</head>', '<body>', '  <div id="root"></div>',
  '  <script type="module" src="/src/main.jsx"></script>', '</body>', '</html>', '',
].join('\n'));

W('src/main.jsx', [
  "import React from 'react';",
  "import { createRoot } from 'react-dom/client';",
  "import { BrowserRouter } from 'react-router-dom';",
  "import App from './App.jsx';",
  "import './proto.css';",
  "createRoot(document.getElementById('root')).render(",
  '  <BrowserRouter><App /></BrowserRouter>',
  ');', '',
].join('\n'));

W('src/screens.js',
  'export const SCREENS = ' + JSON.stringify(screens.map(s => ({ code: s.code, name: s.name })), null, 2) + ';\n');

W('src/wiring.json', JSON.stringify(wiring, null, 2) + '\n');

// App.jsx — thanh điều hướng + iframe + bắt click SAME-ORIGIN trong iframe → navigate theo wiring.
W('src/App.jsx', [
  "import { useEffect, useRef, useState } from 'react';",
  "import { Routes, Route, Navigate, NavLink, useParams, useNavigate } from 'react-router-dom';",
  "import { SCREENS } from './screens.js';",
  "import wiring from './wiring.json';",
  '',
  'function Screen() {',
  '  const { code } = useParams();',
  '  const navigate = useNavigate();',
  '  const ref = useRef(null);',
  '  useEffect(() => {',
  '    const f = ref.current;',
  '    if (!f) return;',
  '    const onLoad = () => {',
  '      const doc = f.contentDocument;',
  '      if (!doc) return; // same-origin: đọc được contentDocument để bắt click',
  '      doc.addEventListener(',
  '        "click",',
  '        (e) => {',
  '          const el = e.target.closest("a,button,[role=\\"button\\"],input[type=\\"submit\\"]");',
  '          if (!el) return;',
  '          const text = (el.textContent || el.value || "").trim();',
  '          // Rule riêng của màn trước; rồi tới _menu — menu chính DÙNG CHUNG cho mọi màn,',
  '          // để một nguồn duy nhất, không thể lệch giữa các màn (ba-html-design/shell.md §1).',
  '          const rules = [...(wiring[code] || []), ...(wiring._menu || [])];',
  '          const hit = rules.find((r) => {',
  '            if (r.id && (el.id === r.id || (el.closest && el.closest("#" + r.id)))) return true; // khớp id: chính xác nhất',
  '            return r.text && text && (text === r.text || text.includes(r.text) || r.text.includes(text));',
  '          });',
  '          if (hit && hit.to === code) { e.preventDefault(); return; } // mục menu của chính màn này',
  '          if (hit) { e.preventDefault(); navigate("/" + hit.to); }',
  '        },',
  '        true',
  '      );',
  '    };',
  '    f.addEventListener("load", onLoad);',
  '    return () => f.removeEventListener("load", onLoad);',
  '  }, [code, navigate]);',
  '  return <iframe ref={ref} title={code} src={"/screens/" + code + ".html"} className="screen-frame" />;',
  '}',
  '',
  'export default function App() {',
  '  const [navOpen, setNavOpen] = useState(true);',
  '  return (',
  '    <div className={"proto" + (navOpen ? "" : " nav-collapsed")}>',
  '      <aside className="proto-nav">',
  '        <div className="proto-title">Prototype</div>',
  '        {SCREENS.map((s) => (',
  '          <NavLink key={s.code} to={"/" + s.code} className="proto-link">',
  '            <b>{s.code}</b> {s.name}',
  '          </NavLink>',
  '        ))}',
  '        <div className="proto-hint">Bấm nút trong màn để đi theo flow (wiring.json).</div>',
  '      </aside>',
  '      <main className="proto-main">',
  '        <button',
  '          className="proto-nav-toggle"',
  '          type="button"',
  '          onClick={() => setNavOpen((v) => !v)}',
  '          title={navOpen ? "Ẩn menu" : "Hiện menu"}',
  '          aria-label={navOpen ? "Ẩn menu prototype" : "Hiện menu prototype"}',
  '        >',
  '          {navOpen ? "‹" : "›"}',
  '        </button>',
  '        <Routes>',
  '          <Route path="/" element={<Navigate to={"/" + SCREENS[0].code} replace />} />',
  '          <Route path="/:code" element={<Screen />} />',
  '        </Routes>',
  '      </main>',
  '    </div>',
  '  );',
  '}', '',
].join('\n'));

W('src/proto.css', [
  '* { box-sizing: border-box; }',
  'body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
  '.proto { display: flex; height: 100vh; }',
  '.proto-nav { width: 240px; flex-shrink: 0; background: #16213e; color: #cdd; overflow-y: auto; padding: 12px 0; }',
  '.proto-title { font-weight: 700; color: #a8d8f0; padding: 8px 16px 12px; font-size: 1.05rem; }',
  '.proto-link { display: block; padding: 8px 16px; color: #b0c4d8; text-decoration: none; font-size: .85rem; border-left: 3px solid transparent; }',
  '.proto-link:hover { background: #1e3050; }',
  '.proto-link.active { background: #1e3a5f; color: #a8d8f0; border-left-color: #4a90d9; }',
  '.proto-hint { color: #7a90b8; font-size: .72rem; padding: 12px 16px; line-height: 1.5; }',
  '.proto-main { flex: 1; min-width: 0; position: relative; }',
  '.proto.nav-collapsed .proto-nav { display: none; }',
  '.proto-nav-toggle { position: absolute; top: 50%; left: 0; transform: translateY(-50%);',
  '  z-index: 20; width: 20px; height: 46px; padding: 0; border: 0; cursor: pointer;',
  '  background: #16213e; color: #a8d8f0; border-radius: 0 6px 6px 0; font-size: 15px;',
  '  line-height: 46px; box-shadow: 1px 0 5px rgba(0,0,0,.2); }',
  '.proto-nav-toggle:hover { background: #1e3a5f; }',
  '.screen-frame { width: 100%; height: 100%; border: 0; }', '',
].join('\n'));

W('README.md', [
  '# Prototype — bấm-được, ghép từ html-design theo flow',
  '',
  'Sinh bởi skill `ba-prototype` từ tài liệu BA. Mỗi màn là bản `html-design.html` (giữ nguyên) hiển thị trong `<iframe>`; bấm nút/link trong màn sẽ điều hướng theo `src/wiring.json` (rút từ `docs/sitemap-flows.md`).',
  '',
  '## Chạy',
  '```bash',
  'npm install',
  'npm run dev',
  '```',
  '',
  '## Cấu trúc',
  '- `public/screens/<mã>.html` — bản copy html-design mỗi màn (thay dần bằng component React khi dựng app thật).',
  '- `src/wiring.json` — nút → màn đích (`{ "S01": [{ "text": "Đăng nhập", "to": "S02" }] }`). Sửa `text` cho khớp chữ trên nút thật.',
  '- `src/App.jsx` — thanh điều hướng + iframe + bắt click trong iframe (same-origin) → `navigate`.',
  '',
  '**Phần dùng lại:** khung project (routing/nav/wiring). **Phần prototype:** màn còn là HTML tĩnh — thay dần bằng component React để thành app thật.', '',
].join('\n'));

// ─── 4. Báo cáo ─────────────────────────────────────────────────────────────────────
const rel = (p) => path.relative(process.cwd(), p);
console.log(`🧩 Prototype (Vite + React + Router) → ${rel(OUT)}/`);
console.log(`   Màn: ${screens.length} (copy html-design) · Cạnh wiring: ${edgeCount} · khớp id: ${preciseCount} (${genCount} id sinh thêm cho nút CTA chưa có) · còn lại khớp text`);
if (missingHtml.length) console.log(`   ⚠️  ${missingHtml.length} màn thiếu html-design.html: ${missingHtml.join(', ')} (chạy ba-html-design)`);
if (!edgeCount) console.log('   ⚠️  Chưa rút được cạnh nào — wiring.json rỗng. Viết sitemap-flows.md (ba-portal sitemap) hoặc điền wiring.json tay.');
console.log(`   Tiếp: cd ${rel(OUT)} && npm install && npm run dev · rồi tinh chỉnh src/wiring.json cho khớp nút thật.`);
