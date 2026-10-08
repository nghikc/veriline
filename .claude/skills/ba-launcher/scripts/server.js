#!/usr/bin/env node
/**
 * ba-launcher/server.js
 * Zero-dependency: mở một MÀN HÌNH (web local) để (1) duyệt nội dung từng skill của bộ
 * BA toolkit và (2) bấm một nút để CÀI cả bộ vào một dự án bất kỳ trên máy.
 *
 * Cách dùng:
 *   node .claude/skills/ba-launcher/scripts/server.js            # mở http://127.0.0.1:4321 + bật trình duyệt
 *   node .claude/skills/ba-launcher/scripts/server.js --port 5000 --no-open
 *
 * Vì sao phải là server chứ không phải một file .html tĩnh: trình duyệt không được phép
 * ghi cả một cây thư mục vào máy người dùng, và hộp thoại "chọn thư mục" của web chỉ
 * ĐỌC được. Nút "Cài đặt" ở đây gọi ngược về Node → `osascript choose folder` (hộp thoại
 * native của macOS) → spawn `ba-export/install.js`, stream log thẳng ra màn hình.
 *
 * Không tự viết lại bộ render markdown: mỗi trang nội dung là `ba-portal/build.js --single`
 * chạy ra HTML tự chứa rồi nhúng iframe (đúng một nguồn render duy nhất cho cả toolkit).
 *
 * An toàn: chỉ nghe trên 127.0.0.1; mọi POST (chọn thư mục / cài đặt) phải kèm token sinh
 * lúc khởi động và chỉ được nhúng vào trang do chính server phát ra — trang web khác trong
 * cùng trình duyệt không thể sai khiến installer.
 */

'use strict';

if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const crypto = require('crypto');
const { execFile, execFileSync, spawn } = require('child_process');

// ─── Định vị gốc ───────────────────────────────────────────────────────────────
const SKILLS_DIR = path.resolve(__dirname, '..', '..');      // .claude/skills (script nằm trong <skill>/scripts/)
const ROOT = path.resolve(SKILLS_DIR, '..', '..');           // gốc repo toolkit (hoặc dự án tiêu dùng)
const INSTALLER = path.join(SKILLS_DIR, 'ba-export', 'scripts', 'install.js');
const BUILDER = path.join(SKILLS_DIR, 'ba-portal', 'scripts', 'build.js');
// Repo gốc và dự án tiêu dùng đều dùng tên `explain/`; `BA-TOOLKIT-EXPLAIN/` là tên cũ
// (trước 20/09/2026) — giữ fallback cho dự án cài lâu rồi chưa cập nhật.
const EXPLAIN_DIR = [path.join(ROOT, 'explain'), path.join(ROOT, 'BA-TOOLKIT-EXPLAIN')]
  .find(d => fs.existsSync(d)) || null;

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ba-launcher-'));
const TOKEN = crypto.randomBytes(16).toString('hex');

// ─── CLI ───────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const optVal = (n, d) => { const i = argv.indexOf(n); return i !== -1 && argv[i + 1] ? argv[i + 1] : d; };
const basePort = parseInt(optVal('--port', '4321'), 10);
const noOpen = argv.includes('--no-open');

// ─── Đọc skill ─────────────────────────────────────────────────────────────────

/** Tách YAML frontmatter thô (chỉ cần name + description) khỏi phần thân markdown. */
function splitFrontmatter(txt) {
  const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: txt };
  const meta = {};
  let key = null;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (kv) { key = kv[1]; meta[key] = kv[2].trim(); }
    else if (key && line.trim()) meta[key] += ' ' + line.trim();   // giá trị xuống dòng
  }
  return { meta, body: txt.slice(m[0].length) };
}

const GROUP_OF_FILE = {
  '01-pipeline-core.md': { label: 'Luồng chính (pipeline)', order: 1 },
  '02-tai-lieu-he-thong.md': { label: 'Tài liệu cấp hệ thống', order: 2 },
  '06-phan-tich-va-ke-hoach.md': { label: 'Phân tích & kế hoạch', order: 3 },
  '03-orchestrator.md': { label: 'Lệnh điều phối (orchestrator)', order: 4 },
  '04-tien-ich.md': { label: 'Tiện ích', order: 5 },
  '05-dev.md': { label: 'Bộ dev (dev-*)', order: 6 },
};
const GROUP_OTHER = { label: 'Chưa phân nhóm', order: 9 };

/**
 * Quét explain/: mỗi mục `## <ten-skill> — …` là phần mô tả NGHIỆP VỤ của một skill.
 * Trả về { <ten-skill>: { group, section } }. Skill chỉ được nhắc thoáng qua (vd 10 skill
 * dev-* gộp trong một mục) thì vẫn nhận group, nhưng không có section riêng.
 */
function scanExplain() {
  const out = {};
  if (!EXPLAIN_DIR) return out;
  for (const file of fs.readdirSync(EXPLAIN_DIR).filter(f => /^\d\d-.*\.md$/.test(f)).sort()) {
    const group = GROUP_OF_FILE[file] || GROUP_OTHER;
    const txt = fs.readFileSync(path.join(EXPLAIN_DIR, file), 'utf8');
    const parts = txt.split(/^## /m).slice(1);
    for (const part of parts) {
      const head = part.split('\n', 1)[0];
      const m = head.match(/^`?((?:ba|dev)-[a-z0-9-]+)`?\s*(?:—|-|:)/);
      if (!m) continue;
      out[m[1]] = { group, section: '## ' + part.replace(/\n+$/, '') };
    }
    // group cho skill được nhắc trong file nhưng không có mục riêng
    for (const m of txt.matchAll(/`((?:ba|dev)-[a-z0-9-]+)`/g)) {
      if (!out[m[1]]) out[m[1]] = { group, section: null };
    }
  }
  return out;
}

/** Danh sách file đồng hành đáng xem của một skill (bỏ SKILL.md, ảnh, vendor nặng). */
function companions(dir) {
  const out = [];
  const walk = (d, rel) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.name === 'node_modules' || e.name === 'vendor' || e.name.startsWith('.')) continue;
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) { walk(path.join(d, e.name), r); continue; }
      if (r === 'SKILL.md') continue;
      if (!/\.(md|js|json|ts|css|html)$/i.test(e.name)) continue;
      const size = fs.statSync(path.join(d, e.name)).size;
      if (size > 400 * 1024) continue;                       // file khổng lồ (mermaid vendor…)
      out.push({ rel: r, size });
    }
  };
  walk(dir, '');
  return out;
}

// Skill THỬ NGHIỆM (canon `skills.experimental`, 25/09/2026): install.js mặc định không cài — màn hình phải nói
// ra, không thì người chọn skill ở đây rồi bấm "Cài" sẽ không thấy nó ở đích. Không có khoá → tập rỗng.
function experimentalSet() {
  let txt = '';
  try { txt = fs.readFileSync(path.join(SKILLS_DIR, 'ba-toolkit', 'references', 'conv-registry.md'), 'utf8'); } catch { return new Set(); }
  const m = txt.match(/```registry\n([\s\S]*?)```/);
  const l = m && m[1].split('\n').find((x) => /^skills\.experimental = /.test(x.trim()));
  return new Set(l ? l.trim().split(' = ')[1].split(/\s+/).filter(Boolean) : []);
}

function listSkills() {
  const explain = scanExplain();
  const exp = experimentalSet();
  const names = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && /^(ba|dev|ac)-/.test(e.name))
    .map(e => e.name).sort();
  return names.map(name => {
    const dir = path.join(SKILLS_DIR, name);
    const skillMd = path.join(dir, 'SKILL.md');
    const { meta } = fs.existsSync(skillMd)
      ? splitFrontmatter(fs.readFileSync(skillMd, 'utf8')) : { meta: {} };
    const ex = explain[name] || (/^(dev|ac)-/.test(name) ? { group: GROUP_OF_FILE['05-dev.md'], section: null } : null);
    const desc = (meta.description || '').replace(/^Use when\s*/i, '');
    return {
      name,
      family: name.startsWith('ba-') ? 'ba' : 'dev',
      group: (ex && ex.group ? ex.group.label : GROUP_OTHER.label),
      order: (ex && ex.group ? ex.group.order : GROUP_OTHER.order),
      description: exp.has(name) ? '(thử nghiệm — cài kèm --with-experimental) ' + desc : desc,
      experimental: exp.has(name),
      hasSkillMd: fs.existsSync(skillMd),
      hasExplain: !!(ex && ex.section),
      files: companions(dir),
    };
  });
}

// ─── Render markdown (mượn nguyên ba-portal/build.js --single) ─────────────────
const renderCache = new Map();

function renderMarkdown(cacheKey, md, stamp) {
  const key = cacheKey + '|' + stamp;
  if (renderCache.has(key)) return renderCache.get(key);
  const base = crypto.createHash('sha1').update(key).digest('hex').slice(0, 12);
  const src = path.join(TMP, base + '.md');
  const out = path.join(TMP, base + '.html');
  fs.writeFileSync(src, md);
  // Tài liệu ngắn: bỏ mục lục của build.js (khung header+sidebar của nó chỉ lặp lại
  // tên skill mà màn hình này đã hiện sẵn ở crumb). Tài liệu dài giữ mục lục để còn nhảy.
  const headings = (md.match(/^#{1,3} /gm) || []).length;
  const flags = headings <= 3 ? ['--no-toc'] : [];
  try {
    execFileSync(process.execPath, [BUILDER, '--single', src, out, ...flags], { stdio: ['ignore', 'ignore', 'pipe'] });
    const html = fs.readFileSync(out, 'utf8');
    renderCache.set(key, html);
    return html;
  } catch (e) {
    return '<!doctype html><meta charset="utf-8"><body style="font:14px -apple-system;padding:24px;color:#b00">'
      + 'Không render được nội dung này.<pre>' + esc(String((e.stderr || e.message || '')).slice(0, 2000)) + '</pre>';
  } finally {
    for (const f of [src, out]) { try { fs.unlinkSync(f); } catch { /* kệ */ } }
  }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function stampOf(p) { try { const st = fs.statSync(p); return st.mtimeMs + ':' + st.size; } catch { return '0'; } }

/** Nội dung một tab → markdown thô (kèm khoá cache). */
function tabMarkdown(skill, tab, file) {
  const dir = path.join(SKILLS_DIR, skill);
  if (tab === 'explain') {
    const ex = scanExplain()[skill];
    if (!ex || !ex.section) return null;
    const stamp = EXPLAIN_DIR ? fs.readdirSync(EXPLAIN_DIR).map(f => stampOf(path.join(EXPLAIN_DIR, f))).join(',') : '0';
    return { md: '# ' + skill + ' — mô tả nghiệp vụ\n\n' + ex.section.replace(/^## /, '### '), stamp };
  }
  if (tab === 'skill') {
    const p = path.join(dir, 'SKILL.md');
    if (!fs.existsSync(p)) return null;
    const { meta, body } = splitFrontmatter(fs.readFileSync(p, 'utf8'));
    const head = '# ' + skill + '\n\n> ' + (meta.description || '').replace(/\n/g, ' ') + '\n\n---\n\n';
    return { md: head + body, stamp: stampOf(p) };
  }
  if (tab === 'file' && file) {
    // chặn đường dẫn thoát khỏi thư mục skill
    const abs = path.resolve(dir, file);
    if (!abs.startsWith(dir + path.sep) || !fs.existsSync(abs)) return null;
    const txt = fs.readFileSync(abs, 'utf8');
    if (/\.md$/i.test(abs)) return { md: '# ' + skill + '/' + file + '\n\n' + splitFrontmatter(txt).body, stamp: stampOf(abs) };
    const lang = path.extname(abs).slice(1).toLowerCase();
    return { md: '# ' + skill + '/' + file + '\n\n```' + lang + '\n' + txt + '\n```\n', stamp: stampOf(abs) };
  }
  return null;
}

// ─── Thông tin bộ toolkit (hiện ở header) ──────────────────────────────────────
function toolkitInfo() {
  let git = null;
  try {
    const run = (a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    git = { branch: run(['rev-parse', '--abbrev-ref', 'HEAD']), commit: run(['rev-parse', '--short', 'HEAD']) };
  } catch { /* không phải git repo — bỏ qua */ }
  return { root: ROOT, git, isSource: !!EXPLAIN_DIR, hasInstaller: fs.existsSync(INSTALLER) };
}

// ─── Hộp thoại chọn thư mục (native) ───────────────────────────────────────────
function pickFolder(cb) {
  if (process.platform !== 'darwin') return cb({ unsupported: true });
  const script = 'set f to choose folder with prompt "Chon thu muc du an dich de cai BA Toolkit"\nPOSIX path of f';
  execFile('osascript', ['-e', script], { timeout: 5 * 60 * 1000 }, (err, stdout, stderr) => {
    if (err) {
      if (/User canceled|-128/.test(String(stderr) + String(err.message))) return cb({ cancelled: true });
      return cb({ error: String(stderr || err.message).trim() });
    }
    cb({ path: stdout.trim().replace(/\/$/, '') });
  });
}

// ─── HTTP ──────────────────────────────────────────────────────────────────────
function sendJson(res, obj, code = 200) {
  const b = Buffer.from(JSON.stringify(obj));
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'content-length': b.length });
  res.end(b);
}
function sendHtml(res, html, code = 200) {
  const b = Buffer.from(html);
  res.writeHead(code, { 'content-type': 'text/html; charset=utf-8', 'content-length': b.length });
  res.end(b);
}
function readBody(req, cb) {
  let data = '';
  req.on('data', c => { data += c; if (data.length > 1e6) req.destroy(); });
  req.on('end', () => { try { cb(JSON.parse(data || '{}')); } catch { cb(null); } });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const p = url.pathname;

  // Chống DNS-rebinding: chỉ chấp nhận Host loopback.
  const host = (req.headers.host || '').split(':')[0];
  if (host && !['127.0.0.1', 'localhost', '[::1]', '::1'].includes(host)) {
    res.writeHead(403); return res.end('forbidden host');
  }

  if (p === '/' || p === '/index.html') return sendHtml(res, shellPage());

  if (p === '/api/skills') return sendJson(res, { skills: listSkills(), info: toolkitInfo() });

  if (p.startsWith('/view/')) {
    const [, , tab, skill] = p.split('/');
    const file = url.searchParams.get('f');
    if (!/^(ba|dev|ac)-[a-z0-9-]+$/.test(skill || '')) { res.writeHead(400); return res.end('bad skill'); }
    const got = tabMarkdown(skill, tab, file);
    if (!got) { return sendHtml(res, '<!doctype html><meta charset="utf-8"><body style="font:14px -apple-system;padding:24px;color:#667">Không có nội dung cho mục này.</body>', 404); }
    return sendHtml(res, renderMarkdown(tab + ':' + skill + ':' + (file || ''), got.md, got.stamp));
  }

  // ── Từ đây là hành động có ghi/chạy tiến trình: bắt buộc token ──
  if (req.method !== 'POST' || req.headers['x-ba-token'] !== TOKEN) {
    res.writeHead(404); return res.end('not found');
  }

  if (p === '/api/pick') return pickFolder(r => sendJson(res, r));

  if (p === '/api/run') {
    return readBody(req, (body) => {
      if (!body || !body.dest) return sendJson(res, { error: 'thiếu thư mục đích' }, 400);
      const dest = path.resolve(body.dest);
      if (!fs.existsSync(dest) || !fs.statSync(dest).isDirectory()) return sendJson(res, { error: 'không phải thư mục: ' + dest }, 400);
      if (!fs.existsSync(INSTALLER)) return sendJson(res, { error: 'không thấy install.js của ba-export' }, 500);

      const flags = [];
      if (body.mode === 'check') flags.push('--check');
      else if (body.mode === 'dry') flags.push('--dry');
      if (body.force) flags.push('--force');
      if (body.prune) flags.push('--prune');
      if (body.experimental) flags.push('--with-experimental');

      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' });
      res.write('$ node install.js --to "' + dest + '" ' + flags.join(' ') + '\n\n');
      const child = spawn(process.execPath, [INSTALLER, '--to', dest, ...flags], { cwd: dest });
      child.stdout.on('data', d => res.write(d));
      child.stderr.on('data', d => res.write(d));
      child.on('error', e => { res.write('\nLỗi chạy installer: ' + e.message + '\n'); res.end('[[EXIT:1]]'); });
      child.on('close', code => res.end('\n[[EXIT:' + code + ']]'));
    });
  }

  res.writeHead(404); res.end('not found');
});

// ─── Trang giao diện ───────────────────────────────────────────────────────────
function shellPage() {
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BA Toolkit — Bộ skill & cài đặt</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  height:100vh;display:flex;flex-direction:column;overflow:hidden;background:#f8f9fa;color:#1a1a2e}
header{background:#16213e;color:#e0e0e0;padding:10px 18px;display:flex;align-items:center;gap:14px;flex-shrink:0;
  box-shadow:0 2px 8px rgba(0,0,0,.3);z-index:20}
header h1{font-size:1rem;font-weight:600;color:#a8d8f0;white-space:nowrap}
header .meta{font-size:.72rem;color:#8fa3c0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
header .spacer{flex:1}
button{font:inherit;cursor:pointer;border-radius:6px;border:1px solid transparent}
.btn-primary{background:#4a90d9;color:#fff;padding:7px 16px;font-size:.85rem;font-weight:600}
.btn-primary:hover{background:#3a7dc0}
.btn-ghost{background:transparent;color:#a8d8f0;border-color:#2f4a72;padding:6px 12px;font-size:.8rem}
.btn-ghost:hover{background:#1e3050}
.btn-sm{background:#e8edf5;color:#16213e;border-color:#c8d4e6;padding:5px 12px;font-size:.8rem}
.btn-sm:hover{background:#d8e2f0}
button:disabled{opacity:.45;cursor:not-allowed}
#layout{flex:1;display:flex;min-height:0}
#sidebar{width:278px;flex-shrink:0;background:#1a1a2e;color:#cdd;display:flex;flex-direction:column;border-right:1px solid #2a2a4e}
#search{margin:10px;padding:7px 10px;border-radius:6px;border:1px solid #34345e;background:#12122a;color:#dbe6f5;font-size:.83rem}
#search::placeholder{color:#6b7a9c}
#list{overflow-y:auto;flex:1;padding-bottom:16px}
#list::-webkit-scrollbar{width:6px}#list::-webkit-scrollbar-thumb{background:#3a3a6e;border-radius:3px}
.grp{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#7a90b8;
  padding:12px 14px 5px;border-top:1px solid #2a2a4e;margin-top:4px}
.item{padding:6px 14px 6px 16px;border-left:3px solid transparent;cursor:pointer}
.item:hover{background:#252550}
.item.active{background:#1e3a5f;border-left-color:#4a90d9}
.item .n{font-size:.82rem;color:#cfe2f5;font-weight:600}
.item.active .n{color:#a8d8f0}
.item .d{font-size:.7rem;color:#8496b4;line-height:1.35;margin-top:2px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#main{flex:1;display:flex;flex-direction:column;min-width:0;background:#fff}
#crumb{padding:12px 22px 10px;border-bottom:1px solid #e4e9f2;background:#fbfcfe}
#crumb h2{font-size:1.15rem;color:#16213e}
#crumb p{font-size:.82rem;color:#5a6a85;margin-top:4px;line-height:1.5}
#tabs{display:flex;gap:6px;padding:8px 18px 0;background:#fbfcfe;border-bottom:1px solid #e4e9f2;flex-wrap:wrap}
.tab{padding:6px 13px;font-size:.8rem;border:1px solid transparent;border-bottom:none;border-radius:6px 6px 0 0;
  background:transparent;color:#4a5a75;cursor:pointer;position:relative;top:1px}
.tab:hover{background:#eef2f8}
.tab.active{background:#fff;border-color:#e4e9f2;color:#16213e;font-weight:600}
.tab.file{color:#7a6a45}
#frame{flex:1;border:0;width:100%;background:#fff}
#empty{flex:1;display:flex;align-items:center;justify-content:center;color:#8494ad;font-size:.9rem;padding:40px}
#empty div{max-width:460px;text-align:center;line-height:1.9}
/* modal cài đặt */
#ov{position:fixed;inset:0;background:rgba(10,15,30,.55);display:none;align-items:center;justify-content:center;z-index:50}
#ov.open{display:flex}
#modal{background:#fff;width:min(760px,94vw);max-height:92vh;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;
  box-shadow:0 18px 60px rgba(0,0,0,.4)}
#modal h3{background:#16213e;color:#a8d8f0;padding:12px 18px;font-size:.95rem;display:flex;align-items:center}
#modal h3 .x{margin-left:auto;background:none;border:none;color:#8fa3c0;font-size:1.3rem;cursor:pointer;line-height:1}
.mbody{padding:16px 18px;overflow-y:auto}
.row{display:flex;gap:8px;align-items:center;margin-bottom:10px}
#dest{flex:1;padding:8px 10px;border:1px solid #c8d4e6;border-radius:6px;font-size:.82rem;font-family:ui-monospace,Menlo,monospace}
.hint{font-size:.76rem;color:#6a7b95;line-height:1.5;margin-bottom:12px}
.opts{display:flex;gap:18px;font-size:.78rem;color:#4a5a75;margin:6px 0 12px;flex-wrap:wrap}
.opts label{display:flex;gap:6px;align-items:center;cursor:pointer}
#log{background:#1e2030;color:#cdd6f4;border-radius:6px;padding:12px 14px;font-family:ui-monospace,Menlo,monospace;
  font-size:.76rem;line-height:1.5;white-space:pre-wrap;word-break:break-word;max-height:38vh;overflow-y:auto;display:none}
#log.show{display:block}
#status{font-size:.82rem;padding:8px 12px;border-radius:6px;margin-bottom:10px;display:none}
#status.show{display:block}
.st-ok{background:#e6f6ec;color:#1c6b3a;border:1px solid #b8e2c8}
.st-warn{background:#fff6e0;color:#8a5b00;border:1px solid #f0d9a0}
.st-err{background:#fdeaea;color:#a02020;border:1px solid #f0bcbc}
.st-run{background:#eaf1fb;color:#22508f;border:1px solid #bcd3f0}
@media(max-width:820px){#sidebar{width:210px}}
</style></head><body>
<header>
  <h1>BA Toolkit</h1>
  <span class="meta" id="hmeta">đang tải…</span>
  <span class="spacer"></span>
  <button class="btn-ghost" id="btn-readme">Pipeline</button>
  <button class="btn-primary" id="btn-install">Cài vào dự án…</button>
</header>
<div id="layout">
  <aside id="sidebar">
    <input id="search" placeholder="Tìm skill (tên hoặc mô tả)…" autocomplete="off">
    <div id="list"></div>
  </aside>
  <section id="main">
    <div id="crumb" style="display:none"><h2 id="c-name"></h2><p id="c-desc"></p></div>
    <div id="tabs" style="display:none"></div>
    <div id="empty"><div>Chọn một skill ở cột trái để xem nội dung.<br>Nút <b>Cài vào dự án…</b> ở góc phải để cài cả bộ vào một dự án khác.</div></div>
    <iframe id="frame" style="display:none" title="Nội dung skill"></iframe>
  </section>
</div>
<div id="ov"><div id="modal">
  <h3>Cài BA Toolkit vào một dự án<button class="x" id="m-close">&times;</button></h3>
  <div class="mbody">
    <div class="row">
      <input id="dest" placeholder="/duong/dan/toi/du-an" spellcheck="false">
      <button class="btn-sm" id="m-pick">Chọn thư mục…</button>
    </div>
    <div class="hint">Chọn thư mục <b>gốc</b> của dự án đích. Toolkit sẽ được copy vào <code>&lt;dự án&gt;/.claude/skills/</code>
      kèm agent review, file hướng dẫn và một khối directive trong <code>CLAUDE.md</code> — sau đó Claude Code mở trong dự án đó sẽ có toàn bộ kiến thức BA.</div>
    <div class="opts">
      <label><input type="checkbox" id="o-force"> Ghi đè cả file đã sửa cục bộ (<code>--force</code>)</label>
      <label><input type="checkbox" id="o-prune"> Xóa skill thừa ở đích (<code>--prune</code>)</label>
      <label><input type="checkbox" id="o-exp"> Cài cả skill thử nghiệm — chưa từng chạy thật (<code>--with-experimental</code>)</label>
    </div>
    <div class="row">
      <button class="btn-sm" id="m-check">Kiểm tra</button>
      <button class="btn-sm" id="m-dry">Thử khô</button>
      <button class="btn-primary" id="m-install" disabled>Cài đặt</button>
    </div>
    <div id="status"></div>
    <pre id="log"></pre>
  </div>
</div></div>
<script>
var TOKEN=${JSON.stringify(TOKEN)};
var SKILLS=[],INFO={},cur=null,curTab=null;
var $=function(id){return document.getElementById(id)};

function esc(s){var d=document.createElement('div');d.textContent=s==null?'':s;return d.innerHTML}

// Gập dấu (đ → d) rồi mới so: gõ "kiem thu" phải ra ba-test/ba-checklist (steal A1, 15/09/2026 — trước đó 0 kết quả).
// Mọi token phải khớp (AND) ở name/description/title đã gập.
function fold(s){return String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d')}
function render(filter){
  var toks=fold(filter).split(/\s+/).filter(Boolean);
  var rows=SKILLS.filter(function(s){
    if(!toks.length)return true;
    var hay=fold(s.name)+' '+fold(s.description)+' '+fold(s.title||'');
    return toks.every(function(t){return hay.indexOf(t)>=0});
  });
  var groups={},order={};
  rows.forEach(function(s){(groups[s.group]=groups[s.group]||[]).push(s);order[s.group]=s.order});
  var keys=Object.keys(groups).sort(function(a,b){return order[a]-order[b]||a.localeCompare(b)});
  var h='';
  keys.forEach(function(g){
    h+='<div class="grp">'+esc(g)+' · '+groups[g].length+'</div>';
    groups[g].forEach(function(s){
      h+='<div class="item'+(cur&&cur.name===s.name?' active':'')+'" data-n="'+s.name+'">'+
         '<div class="n">'+esc(s.name)+'</div><div class="d">'+esc(s.description)+'</div></div>';
    });
  });
  $('list').innerHTML=h||'<div class="grp">không có skill nào khớp</div>';
  Array.prototype.forEach.call($('list').querySelectorAll('.item'),function(el){
    el.onclick=function(){select(el.getAttribute('data-n'))};
  });
}

function select(name,keepHash){
  cur=SKILLS.filter(function(s){return s.name===name})[0];
  if(!cur)return;
  if(!keepHash&&location.hash.slice(1)!==name)history.replaceState(null,'','#'+name);
  $('empty').style.display='none';
  $('crumb').style.display='';$('tabs').style.display='';$('frame').style.display='';
  $('c-name').textContent=cur.name;
  $('c-desc').textContent=cur.description;
  var tabs=[];
  if(cur.hasExplain)tabs.push({k:'explain',t:'Nghiệp vụ'});
  if(cur.hasSkillMd)tabs.push({k:'skill',t:'Chi tiết (SKILL.md)'});
  cur.files.forEach(function(f){tabs.push({k:'file',t:f.rel,f:f.rel})});
  var h='';
  tabs.forEach(function(t,i){
    h+='<button class="tab'+(t.k==='file'?' file':'')+'" data-k="'+t.k+'" data-f="'+esc(t.f||'')+'">'+esc(t.t)+'</button>';
  });
  $('tabs').innerHTML=h;
  Array.prototype.forEach.call($('tabs').querySelectorAll('.tab'),function(el){
    el.onclick=function(){show(el.getAttribute('data-k'),el.getAttribute('data-f'),el)};
  });
  render($('search').value);
  var first=$('tabs').querySelector('.tab');
  if(first)first.click();
}

function show(kind,file,el){
  Array.prototype.forEach.call($('tabs').querySelectorAll('.tab'),function(t){t.classList.remove('active')});
  if(el)el.classList.add('active');
  var u='/view/'+kind+'/'+cur.name+(file?'?f='+encodeURIComponent(file):'');
  $('frame').src=u;
}

// ── modal cài đặt ──
function setStatus(cls,msg){var s=$('status');s.className='show '+cls;s.textContent=msg}
function openModal(){$('ov').classList.add('open');$('dest').focus()}
function closeModal(){$('ov').classList.remove('open');
  if(location.hash==='#install')history.replaceState(null,'',cur?'#'+cur.name:' ')}

$('btn-install').onclick=openModal;
$('m-close').onclick=closeModal;
$('ov').onclick=function(e){if(e.target===$('ov'))closeModal()};
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal()});

$('m-pick').onclick=function(){
  setStatus('st-run','Đang mở hộp thoại chọn thư mục… (nếu không thấy, kiểm tra Dock/màn hình khác)');
  fetch('/api/pick',{method:'POST',headers:{'x-ba-token':TOKEN}}).then(function(r){return r.json()}).then(function(d){
    if(d.path){$('dest').value=d.path;setStatus('st-run','Đã chọn: '+d.path+' — đang kiểm tra…');run('check')}
    else if(d.cancelled)setStatus('st-warn','Bạn đã hủy chọn thư mục.');
    else if(d.unsupported)setStatus('st-warn','Hộp thoại native chỉ có trên macOS — hãy dán đường dẫn vào ô bên trái.');
    else setStatus('st-err','Lỗi chọn thư mục: '+(d.error||'không rõ'));
  });
};

$('m-check').onclick=function(){run('check')};
$('m-dry').onclick=function(){run('dry')};
$('m-install').onclick=function(){
  if(!confirm('Cài BA Toolkit vào:\\n'+$('dest').value+'\\n\\nTiếp tục?'))return;
  run('install');
};
$('dest').oninput=function(){$('m-install').disabled=!$('dest').value.trim()};

function run(mode){
  var dest=$('dest').value.trim();
  if(!dest){setStatus('st-err','Chưa chọn thư mục dự án đích.');return}
  var btns=['m-check','m-dry','m-install','m-pick'];
  btns.forEach(function(b){$(b).disabled=true});
  var label={check:'Đang kiểm tra…',dry:'Đang chạy thử (không ghi gì)…',install:'Đang cài…'}[mode];
  setStatus('st-run',label);
  $('log').className='show';$('log').textContent='';
  fetch('/api/run',{method:'POST',headers:{'content-type':'application/json','x-ba-token':TOKEN},
    body:JSON.stringify({dest:dest,mode:mode,force:$('o-force').checked,prune:$('o-prune').checked,experimental:$('o-exp').checked})})
  .then(function(r){
    if(!r.ok)return r.json().then(function(d){throw new Error(d.error||('HTTP '+r.status))});
    var rd=r.body.getReader(),dec=new TextDecoder(),buf='';
    return (function pump(){return rd.read().then(function(x){
      if(x.done)return buf;
      buf+=dec.decode(x.value,{stream:true});
      $('log').textContent=buf.replace(/\\[\\[EXIT:-?\\d+\\]\\]/,'');
      $('log').scrollTop=$('log').scrollHeight;
      return pump();
    })})();
  })
  .then(function(out){
    var m=/\\[\\[EXIT:(-?\\d+)\\]\\]/.exec(out||'');
    var code=m?parseInt(m[1],10):0;
    finish(mode,code,out||'');
  })
  .catch(function(e){setStatus('st-err','Lỗi: '+e.message)})
  .then(function(){btns.forEach(function(b){$(b).disabled=false});$('m-install').disabled=!$('dest').value.trim()});
}

function finish(mode,code,out){
  var local=/ĐÃ SỬA CỤC BỘ|đã sửa cục bộ/.test(out);
  var conflict=/xung đột/.test(out);
  if(mode==='check'){
    if(code===1)setStatus(conflict?'st-warn':'st-ok','Dự án này CÓ cập nhật mới từ toolkit. Bấm “Cài đặt” để áp.'+(local?' (Các file bạn đã sửa cục bộ sẽ được giữ nguyên.)':''));
    else if(code===0)setStatus('st-ok','Dự án đích đang khớp bản toolkit hiện tại — vẫn cài lại được nếu muốn.');
    else setStatus('st-err','Kiểm tra thất bại (mã '+code+') — xem log bên dưới.');
    $('m-install').disabled=false;
  }else if(mode==='dry'){
    setStatus(code===0?'st-ok':'st-err',code===0?'Chạy thử xong — chưa ghi gì. Xem danh sách file bên dưới rồi bấm “Cài đặt”.':'Chạy thử lỗi (mã '+code+').');
    $('m-install').disabled=false;
  }else{
    if(code===0)setStatus(conflict?'st-warn':'st-ok','Cài xong. Hãy KHỞI ĐỘNG LẠI Claude Code trong dự án đích để nạp skill.'+(conflict?' Có file xung đột — xem log.':''));
    else setStatus('st-err','Cài thất bại (mã '+code+') — xem log bên dưới.');
  }
}

$('search').oninput=function(){render(this.value)};
$('btn-readme').onclick=function(){select('ba-toolkit')};

// Deep link: #<ten-skill> mở thẳng skill đó, #install mở thẳng hộp thoại cài đặt.
function applyHash(){
  var h=decodeURIComponent(location.hash.slice(1));
  if(h==='install'){openModal();return}
  if(h)select(h,true);
}
window.addEventListener('hashchange',applyHash);

fetch('/api/skills').then(function(r){return r.json()}).then(function(d){
  SKILLS=d.skills;INFO=d.info;
  var n=SKILLS.filter(function(s){return s.family==='ba'}).length;
  var g=INFO.git?(' · '+INFO.git.branch+'@'+INFO.git.commit):'';
  $('hmeta').textContent=SKILLS.length+' skill ('+n+' ba-* + '+(SKILLS.length-n)+' dev-*) · '+INFO.root+g;
  render('');
  if(!INFO.hasInstaller){$('btn-install').disabled=true;$('btn-install').title='Không thấy ba-export/install.js'}
  applyHash();
});
</script></body></html>`;
}

// ─── Khởi động (tự nhảy cổng khi bận) ──────────────────────────────────────────
function listen(port, tries) {
  server.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && tries > 0) return listen(port + 1, tries - 1);
    console.error('Không mở được server:', e.message);
    process.exit(1);
  });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
    const skills = fs.readdirSync(SKILLS_DIR).filter(n => /^(ba|dev|ac)-/.test(n));
    console.log(`\n🖥️  BA Toolkit launcher — ${skills.length} skill · nguồn: ${ROOT}`);
    console.log(`   ${url}   (Ctrl+C để dừng)`);
    if (!EXPLAIN_DIR) console.log('   ⚠️  Không thấy explain/ — chỉ hiện tab SKILL.md.');
    if (!noOpen && process.platform === 'darwin') execFile('open', [url], () => { });
  });
}
listen(basePort, 20);

process.on('SIGINT', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { } process.exit(0); });
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { } });
