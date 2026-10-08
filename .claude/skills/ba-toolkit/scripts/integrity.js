#!/usr/bin/env node
/*
 * ba-toolkit/integrity.js — TOOLKIT Ở ĐÍCH CÒN KHỚP NGUỒN KHÔNG (hook-review 07/10/2026). Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ba-toolkit/scripts/integrity.js [--root .] [--json] [--no-cache]
 *   require('./integrity.js').kiểm(root, { cache: true })  → cùng đối tượng JSON
 *
 * Exit: 0 khớp (kể cả repo nguồn) · 1 lệch (chưa được duyệt) · 2 không kiểm được (`chuaKiem` nói vì sao).
 * JSON: { ok, nguon: 'source'|'manifest-head'|'none'|'source-repo', lech: [{file, loai, chiTiet?}], duyet: [file],
 *         duyetHong?: [{file, lyDo}], cu?: [file], chuaKiem?, soFile, commit? }   loai: sua · thieu · them · hook · settings
 *   `cu` = file thừa trong thư mục skill mà blob TỪNG có trong kho nguồn (bản cũ update không dọn) — chỉ báo, không lệch.
 *
 * Phạm vi:
 *   (1) mọi file trong các thư mục skill toolkit ở `.claude/skills/` — so với cây git của NGUỒN ở commit đã cài
 *       (`manifest.source.path` @ `source.git.commit`, một lệnh `git ls-tree`, so blob sha1). Không với tới nguồn (máy
 *       khác, commit mất) → so với manifest ở `git show HEAD:.claude/ba-toolkit.json` của đích (bản ĐÃ COMMIT — agent
 *       sửa manifest trong cây làm việc cho "khớp" không qua được). Không có cả hai → `none`, exit 2.
 *   (2) khối hooks: đủ 4 hook (`hook-guard` PreToolUse matcher có Read|Grep|Glob|Bash|Edit|Write|NotebookEdit · `hook-lint`
 *       PostToolUse Edit|Write · `hook-gate` Stop · `hook-session` SessionStart + UserPromptSubmit) trong
 *       `.claude/settings.json`/`settings.local.json`, lệnh trỏ đúng script và script có mặt (loai `hook`);
 *       `disableAllHooks: true` ở `.claude/settings*.json` (loai `settings`).
 *   Duyệt cục bộ: `.claude/ba-toolkit-local.json` = { duyet: [{ file, sha256, lyDo, nguoiDuyet, hetHan }] } — mục chỉ tính
 *   khi còn hạn (hetHan ≥ hôm nay), đủ lyDo + nguoiDuyet, và sha256 TRÙNG file hiện tại (file vắng: sha256 "thieu").
 *   Repo nguồn (`example/docs/00-tracking.md`, canon export.srcMarker) → exit 0, nguon 'source-repo': sửa toolkit là việc ở đây.
 *
 * Nhanh (gọi ở SessionStart/Stop): mỗi file hash một lần rồi nhớ trong `.claude/ba-integrity-cache.json` theo
 * mtime+ctime+size+inode; một trong bốn đổi là hash lại — cache chỉ để nhanh, không bao giờ là bằng chứng "khớp".
 * Cây nguồn ở một commit là bất biến nên cũng nhớ theo (đường dẫn nguồn, commit).
 *
 * VÌ SAO CÓ (spec docs/superpowers/specs/2026-10-07-hook-diem-mu-design.md, P3): mọi cổng (accept, validate-done, hook)
 * là script nằm trong `.claude/skills/` — agent ghi được. Review đối kháng 07/10 tái hiện: sửa `check-tc-layer.js` cho
 * luôn im + chạm manifest → scan-bypasses miễn, accept NHẬN. Cổng chỉ tin cái nó tự đo được; nên trước khi tin checker,
 * đối soát chính checker với nguồn độc lập (git của repo toolkit, hoặc manifest đã commit).
 *
 * gioiHan: (1) Chỉ phát hiện, không chặn — chặn là việc của accept (A0) và hook-guard. (2) `source.path`/`commit` đọc từ
 * manifest trong cây làm việc (update chưa commit vẫn đúng); agent trỏ manifest sang một repo giả có cây khớp bản vá thì
 * lọt — cần cố ý dựng repo, ghi ở đây cho rõ. Manifest đã commit cũng do agent commit được: `manifest-head` yếu hơn `source`.
 * (3) Cache ghi được: agent CỐ Ý ghi tay một mục cache khớp ctime/inode mới là lọt — gọi `--no-cache` ở cổng cần chắc.
 * (4) So blob git = so byte; nguồn bật autocrlf/filter thì lệch oan (báo bằng oan.js). (5) Agent `.claude/agents/` và
 * skill không có ở nguồn (skill riêng của dự án) không thuộc phạm vi. (6) Không đọc settings cấp người dùng (thư mục home) hay tổ chức (managed) —
 * `disableAllHooks` đặt ở đó không thấy; Claude Code cho `false` ở settings dự án thắng `true` cấp người dùng.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ (lint 43)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const SRC_MARKER = path.join('example', 'docs', '00-tracking.md');   // canon export.srcMarker
const MANIFEST = '.claude/ba-toolkit.json';
const CACHE = path.join('.claude', 'ba-integrity-cache.json');
const LOCAL = path.join('.claude', 'ba-toolkit-local.json');
// File sinh tại chỗ trong thư mục skill, không phải bản chép từ nguồn (engine Playwright, rác hệ điều hành, ghi của global-bootstrap).
const BỎ_TÊN = new Set(['node_modules', '.DS_Store', 'Thumbs.db', '__pycache__', 'ba-source.txt']);

// Hook chuẩn — install.js dùng CÙNG bảng này để ghi settings.json (một nguồn, hai bên không lệch nhau).
const HOOK_CHUẨN = [
  { ev: 'PreToolUse', file: 'hook-guard.js', matcher: ['Read', 'Grep', 'Glob', 'Bash', 'Edit', 'Write', 'NotebookEdit'] },
  { ev: 'PostToolUse', file: 'hook-lint.js', matcher: ['Edit', 'Write'] },
  { ev: 'Stop', file: 'hook-gate.js' },
  { ev: 'SessionStart', file: 'hook-session.js' },
  { ev: 'UserPromptSubmit', file: 'hook-session.js' },
];
// `$CLAUDE_PROJECT_DIR` (hook-review 07/10/2026): lệnh tương đối `node .claude/…` chết lặng khi phiên đã `cd` vào thư mục con —
// hook chạy theo cwd của phiên. Fallback `:-.` cho shell không có biến (chạy tay, bản Claude Code cũ).
const lệnhHook = (f) => `node "\${CLAUDE_PROJECT_DIR:-.}/.claude/skills/ba-toolkit/scripts/${f}"`;

const đọcJ = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const git = (cwd, args) => spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8', maxBuffer: 1e8, stdio: ['ignore', 'pipe', 'ignore'] });
const hômNay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function hashBuf(buf) {
  return {
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    blob: crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex'),
  };
}

function đi(dir, base, out) {
  let es = []; try { es = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of es) {
    if (BỎ_TÊN.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) đi(p, base, out);
    else if (e.isFile()) out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out;
}

/** Kiểm một thư mục dự án. opts.cache (mặc định true) — false = hash lại mọi file, không đọc/ghi cache. */
function kiểm(rootIn, opts = {}) {
  const root = path.resolve(rootIn || '.');
  const dùngCache = opts.cache !== false;
  if (fs.existsSync(path.join(root, SRC_MARKER))) return { ok: true, nguon: 'source-repo', lech: [], duyet: [], soFile: 0 };

  // ── cache ──
  const cachePath = path.join(root, CACHE);
  let cache = dùngCache ? (đọcJ(cachePath) || {}) : {};
  if (cache.v !== 1 || typeof cache.files !== 'object' || !cache.files) cache = { v: 1, files: {}, tree: null };
  const cacheMới = { v: 1, files: {}, tree: cache.tree || null };
  let cacheBẩn = false;
  const hashFile = (rel) => {
    const abs = path.join(root, rel);
    let st; try { st = fs.statSync(abs); } catch { return null; }
    const k = `${st.size}:${st.mtimeMs}:${st.ctimeMs}:${st.ino}`;
    const c = cache.files[rel];
    if (c && c.k === k && c.sha256 && c.blob) { cacheMới.files[rel] = c; return c; }
    let buf; try { buf = fs.readFileSync(abs); } catch { return null; }
    const h = Object.assign({ k }, hashBuf(buf));
    cacheMới.files[rel] = h; cacheBẩn = true;
    return h;
  };

  // ── nguồn tham chiếu ──
  const mfLàm = đọcJ(path.join(root, MANIFEST));
  // `HEAD:./…` = tính từ root (không phải gốc repo) — root là thư mục con của một repo khác thì không vớ manifest của repo cha.
  const rHead = fs.existsSync(path.join(root, '.claude')) ? git(root, ['show', `HEAD:./${MANIFEST}`]) : { status: 1 };
  let mfHead = null; if (rHead.status === 0) { try { mfHead = JSON.parse(rHead.stdout); } catch { mfHead = null; } }
  const mf = mfLàm || mfHead;
  const lech = [];
  let nguon = 'none'; let chuaKiem = null; let commit = null; let soFile = 0;

  const srcPath = mf && mf.source && mf.source.path;
  commit = mf && mf.source && mf.source.git && mf.source.git.commit;
  let cây = null;                                          // Map rel(.claude/skills/…) → blob sha1 ở nguồn
  if (srcPath && commit && fs.existsSync(path.join(srcPath, '.git'))) {
    const khoá = `${path.resolve(srcPath)}@${commit}`;
    if (cache.tree && cache.tree.khoá === khoá && cache.tree.map) cây = new Map(Object.entries(cache.tree.map));
    else {
      const r = git(srcPath, ['ls-tree', '-r', '-z', '--full-tree', commit, '--', '.claude/skills']);
      if (r.status === 0 && r.stdout) {
        cây = new Map();
        for (const dòng of r.stdout.split('\0')) {
          const m = /^(\d+) blob ([0-9a-f]{40})\t(.+)$/.exec(dòng);
          if (m && m[1] !== '120000') cây.set(m[3], m[2]);
        }
        cacheMới.tree = { khoá, map: Object.fromEntries(cây) }; cacheBẩn = true;
      }
    }
  }

  const skillsDir = path.join(root, '.claude', 'skills');
  const thêm = []; const cũ = [];
  if (cây && cây.size) {
    nguon = 'source';
    // Thư mục skill thuộc phạm vi = có ở NGUỒN và có ở ĐÍCH (mini/scope docs/thử nghiệm không cài thì không xét).
    const dirNguồn = new Set([...cây.keys()].map((k) => k.split('/')[2]));
    let dirĐích = []; try { dirĐích = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name); } catch { /* không có */ }
    const mfDirty = (mfHead || mfLàm || {}).source || {};
    const dirtyFiles = new Set(mfDirty.dirtyFiles || []);
    const mfFiles = (mfHead || mfLàm || {}).files || {};
    for (const d of dirĐích.filter((x) => dirNguồn.has(x)).sort()) {
      const tiền = `.claude/skills/${d}/`;
      const đích = new Set(đi(path.join(skillsDir, d), root, []));
      for (const [rel, blob] of cây) {
        if (!rel.startsWith(tiền)) continue;
        soFile++;
        if (!đích.has(rel) && dirtyFiles.has(rel)) continue;   // nguồn dirty đã xoá/dời file này (git mv chưa commit) — vắng ở đích là khớp
        if (!đích.has(rel)) { lech.push({ file: rel, loai: 'thieu' }); continue; }
        đích.delete(rel);
        const h = hashFile(rel);
        if (!h) { lech.push({ file: rel, loai: 'thieu' }); continue; }
        if (h.blob === blob) continue;
        // Cài từ nguồn dirty (--allow-dirty): bản cài không khớp commit nào — chấp nhận khi trùng hash manifest cho đúng file dirty đó.
        if (dirtyFiles.has(rel) && mfFiles[rel] && h.sha256.slice(0, 16) === mfFiles[rel]) continue;
        lech.push({ file: rel, loai: 'sua' });
      }
      for (const rel of đích) {
        const h = dirtyFiles.has(rel) && mfFiles[rel] ? hashFile(rel) : null;   // file mới chưa commit ở nguồn dirty
        if (!(h && h.sha256.slice(0, 16) === mfFiles[rel])) thêm.push(rel);
      }
    }
    // File THỪA mà blob từng có trong kho nguồn = bản toolkit cũ update không dọn (install.js chỉ ghi, không xoá file đã
    // dời — đo 07/10 trên 3 dự án thật: `ba-threat-model/references/security-checklist.md` dời sang ba-toolkit/ từ 829f037).
    // Đó là rác cũ, không phải bản vá: ghi `cu`, không tính lệch. Blob lạ với nguồn → `them`. Một lệnh `cat-file --batch-check`.
    if (thêm.length) {
      const hs = thêm.map((rel) => hashFile(rel));
      const r = spawnSync('git', ['-C', srcPath, 'cat-file', '--batch-check'], { input: hs.map((h) => (h ? h.blob : '0'.repeat(40))).join('\n') + '\n', encoding: 'utf8', maxBuffer: 1e8 });
      const dòng = r.status === 0 ? r.stdout.split('\n') : [];
      thêm.forEach((rel, i) => { if (/ blob \d+$/.test(dòng[i] || '')) cũ.push(rel); else lech.push({ file: rel, loai: 'them' }); });
    }
  } else if (mfHead && mfHead.files) {
    nguon = 'manifest-head';
    const keys = Object.keys(mfHead.files).filter((k) => k.startsWith('.claude/skills/'));
    const dirs = new Set(keys.map((k) => k.split('/')[2]));
    for (const rel of keys) {
      soFile++;
      const h = hashFile(rel);
      if (!h) { lech.push({ file: rel, loai: 'thieu' }); continue; }
      if (h.sha256.slice(0, 16) !== mfHead.files[rel]) lech.push({ file: rel, loai: 'sua' });
    }
    const đã = new Set(keys);
    for (const d of [...dirs].sort()) for (const rel of đi(path.join(skillsDir, d), root, [])) if (!đã.has(rel)) lech.push({ file: rel, loai: 'them' });
  } else {
    chuaKiem = !mf ? 'không có .claude/ba-toolkit.json (chưa cài bằng install.js?)'
      : 'không với tới nguồn (source.path/commit) và manifest chưa commit (git show HEAD:.claude/ba-toolkit.json)';
  }

  // ── hooks + settings ──
  const settingsFiles = [path.join('.claude', 'settings.json'), path.join('.claude', 'settings.local.json')];
  const settings = settingsFiles.map((f) => ({ f: f.split(path.sep).join('/'), j: đọcJ(path.join(root, f)) }));
  for (const { f, j } of settings) {
    if (j && j.disableAllHooks === true) lech.push({ file: f, loai: 'settings', chiTiet: 'disableAllHooks: true — mọi hook (cả hook-guard) tắt' });
  }
  if (nguon !== 'none' || fs.existsSync(skillsDir)) {
    for (const hc of HOOK_CHUẨN) {
      const mục = settings.flatMap(({ j }) => ((j && j.hooks && j.hooks[hc.ev]) || []));
      const cóLệnh = mục.filter((e) => (e.hooks || []).some((h) => typeof h.command === 'string'
        && h.command.replace(/["']/g, '').includes(`.claude/skills/ba-toolkit/scripts/${hc.file}`)));
      const scriptCó = fs.existsSync(path.join(skillsDir, 'ba-toolkit', 'scripts', hc.file));
      if (!cóLệnh.length) { lech.push({ file: '.claude/settings.json', loai: 'hook', chiTiet: `thiếu ${hc.ev} → ${hc.file}` }); continue; }
      if (!scriptCó) { lech.push({ file: `.claude/skills/ba-toolkit/scripts/${hc.file}`, loai: 'hook', chiTiet: `${hc.ev} trỏ ${hc.file} nhưng script vắng` }); continue; }
      if (hc.matcher) {
        const đủ = cóLệnh.some((e) => {
          const m = typeof e.matcher === 'string' ? e.matcher.trim() : '';
          if (m === '' || m === '*' || m === '.*') return true;
          const tok = new Set(m.split('|').map((x) => x.trim()));
          return hc.matcher.every((t) => tok.has(t));
        });
        if (!đủ) lech.push({ file: '.claude/settings.json', loai: 'hook', chiTiet: `${hc.ev} → ${hc.file}: matcher thiếu ${hc.matcher.join('|')}` });
      }
    }
  }

  // ── duyệt cục bộ ──
  const local = đọcJ(path.join(root, LOCAL));
  const mụcDuyệt = (local && Array.isArray(local.duyet)) ? local.duyet : [];
  const nay = hômNay();
  const duyet = []; const duyetHong = [];
  const sha256Của = (rel) => { const h = hashFile(rel); return h ? h.sha256 : 'thieu'; };
  const cònLệch = lech.filter((x) => {
    const ms = mụcDuyệt.filter((d) => d && d.file === x.file);
    if (!ms.length) return true;
    const sha = sha256Của(x.file);
    for (const d of ms) {
      const lý = !d.lyDo || !String(d.lyDo).trim() ? 'thiếu lyDo'
        : !d.nguoiDuyet || !String(d.nguoiDuyet).trim() ? 'thiếu nguoiDuyet'
        : !/^\d{4}-\d{2}-\d{2}$/.test(String(d.hetHan || '')) ? 'hetHan không dạng YYYY-MM-DD'
        : d.hetHan < nay ? `quá hạn ${d.hetHan}`
        : String(d.sha256 || '').toLowerCase() !== sha ? 'sha256 lệch file hiện tại (file đổi sau khi duyệt)'
        : null;
      if (!lý) { if (!duyet.includes(x.file)) duyet.push(x.file); return false; }
      duyetHong.push({ file: x.file, lyDo: lý });
    }
    return true;
  });

  if (dùngCache && cacheBẩn && fs.existsSync(path.join(root, '.claude'))) {
    try { const tạm = `${cachePath}.${process.pid}.tmp`; fs.writeFileSync(tạm, JSON.stringify(cacheMới)); fs.renameSync(tạm, cachePath); } catch { /* cache hỏng → lần sau hash lại */ }
  }

  const out = { ok: nguon !== 'none' && cònLệch.length === 0, nguon, lech: cònLệch, duyet, soFile };
  if (duyetHong.length) out.duyetHong = duyetHong;
  if (cũ.length) out.cu = cũ;
  if (commit) out.commit = commit;
  if (nguon === 'none') { out.ok = false; out.chuaKiem = chuaKiem; }
  return out;
}

const mãThoát = (r) => (r.nguon === 'none' ? 2 : r.ok ? 0 : 1);

module.exports = { kiểm, mãThoát, HOOK_CHUẨN, lệnhHook };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--root');
  const root = i >= 0 && argv[i + 1] ? argv[i + 1] : process.cwd();
  let r;
  try { r = kiểm(root, { cache: !argv.includes('--no-cache') }); }
  catch (e) { r = { ok: false, nguon: 'none', lech: [], duyet: [], chuaKiem: `lỗi: ${e.message}` }; }
  if (argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else {
    if (r.nguon === 'source-repo') console.log('integrity: repo NGUỒN của toolkit — không có gì để so (sửa toolkit là việc ở đây).');
    else if (r.nguon === 'none') console.log(`integrity: CHƯA KIỂM — ${r.chuaKiem}`);
    else console.log(`integrity: so với ${r.nguon === 'source' ? `nguồn @${r.commit}` : 'manifest đã commit (HEAD)'} · ${r.soFile} file · ${r.lech.length} lệch · ${r.duyet.length} được duyệt`);
    for (const x of r.lech.slice(0, 40)) console.log(`  ✗ ${x.loai.padEnd(8)} ${x.file}${x.chiTiet ? ` — ${x.chiTiet}` : ''}`);
    if (r.lech.length > 40) console.log(`  … và ${r.lech.length - 40} mục nữa (--json để xem hết)`);
    if ((r.cu || []).length) console.log(`  · ${r.cu.length} file toolkit cũ update chưa dọn (blob có trong kho nguồn — không tính lệch): ${r.cu.slice(0, 3).join(', ')}${r.cu.length > 3 ? '…' : ''}`);
    for (const d of r.duyetHong || []) console.log(`  ⚠️ mục duyệt không tính: ${d.file} — ${d.lyDo}`);
    if (r.lech.length) {
      console.log('Toolkit bị sửa tại đích: sửa ở NGUỒN rồi `ba-export update`; checker oan → `oan.js add`. Bản vá có chủ đích → người duyệt ghi');
      console.log('  .claude/ba-toolkit-local.json { "duyet": [{ "file", "sha256", "lyDo", "nguoiDuyet", "hetHan": "YYYY-MM-DD" }] }.');
    }
  }
  process.exit(mãThoát(r));
}
