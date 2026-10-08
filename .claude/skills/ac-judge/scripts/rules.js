#!/usr/bin/env node
/*
 * ac-judge/rules.js — LUẬT MÁY TỪ FINDING: một finding của judge/verifier/eval, khi deterministic, thành một dòng luật
 * (regex + glob) chạy trên MỌI màn — không chỉ màn vừa review. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ac-judge/scripts/rules.js check [--root <repo>] [--range a..b] [--all] [--plain|--json]
 *        # chạy luật confirmed (--all: cả candidate) trên file của khoảng diff (hoặc cả repo); exit = số hit
 *   node .claude/skills/ac-judge/scripts/rules.js add --tu "J-01 S12 2026-09-17" --loai co|thieu --mau "<regex>" --glob "<glob>"
 *        --ly-do "<vì sao>" [--khi "<regex>"] [--sua "<cách sửa>"] [--muc 🔴|🟠|🟡] [--confirmed] [--root <repo>]
 *   node .claude/skills/ac-judge/scripts/rules.js from-review <review.md> [--root <repo>]   # khối ```rules trong "## Chuyển thành luật lint" → candidate
 *   node .claude/skills/ac-judge/scripts/rules.js confirm|retire RL-nn [--root <repo>]     # người quyết (như LS candidate → confirmed)
 *   node .claude/skills/ac-judge/scripts/rules.js list [--all] [--glob-of <file>] [--plain]  # dòng để dán vào brief builder
 *   node .claude/skills/ac-judge/scripts/rules.js lint [--root <repo>]                       # mọi luật có nguồn finding, regex biên dịch được, glob, loại, mức
 *
 * Hai loại luật:
 *   co     — mẫu XUẤT HIỆN là sai (console.log(config), catch rỗng…): hit theo dòng, file:line.
 *   thieu  — file khớp glob (và khớp `khi`, nếu có) mà KHÔNG chứa mẫu là sai: hit theo file. `khi` là tiền đề để không
 *            đòi mọi file (vd chỉ api.ts nào xử lý E-S11-04 mới phải gọi baoHetPhien).
 * Nguồn luật = `assets/rules-seed.jsonl` (toolkit, chung mọi dự án) ∪ `.claude/ac-rules.jsonl` (dự án). Mỗi luật PHẢI có
 * `từ` trỏ finding gốc (J-nn/LS-nn/AU-nn/TC-…) — luật không có bằng chứng gốc là ý kiến, lint chặn.
 *
 * Vì sao có (15-lo-trinh-sau-dogfood.md, B): 17–18/09/2026 J-01 (S12 api.ts không gọi baoHetPhien) sửa ở S12, S16 y nguyên
 * — eval mới thấy; TC-46 kiểu S14 lặp ở S15. Mục "Chuyển thành luật lint" trong review có từ đầu nhưng không ai tiêu thụ.
 *
 * Mặc định bỏ file test và dòng chú thích (dự án helpdesk 19/09: test WI-03 tự chứa chuỗi console.log(config), app.js còn dòng //). Luật cần quét test → `kểCảTest: true`.
 * gioiHan: regex theo dòng/file, không hiểu cú pháp (luật cần AST thì ghi vào notes, không ép thành regex); `thieu` chỉ đúng
 * khi `khi` đủ hẹp — mẫu rộng → hit oan, PO retire. Không tự confirm — candidate chỉ chạy với --all.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const CMD = argv[0];
const opt = (k, d = null) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const ROOT = path.resolve(opt('--root', process.cwd()));
const FILE = path.join(ROOT, '.claude', 'ac-rules.jsonl');
const SEED = path.join(__dirname, '..', 'assets', 'rules-seed.jsonl');
const JSON_MODE = argv.includes('--json'), ALL = argv.includes('--all');
const LOẠI = ['co', 'thieu'], MỨC = ['🔴', '🟠', '🟡'];
const BỎ = /(^|\/)(node_modules|\.git|dist|build|coverage|\.next|vendor|docs|\.claude)(\/|$)/;

const đọc = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l, i) => { try { return Object.assign(JSON.parse(l), { _src: path.basename(f), _line: i + 1 }); } catch { return { _lỗi: `${path.basename(f)}:${i + 1} không phải JSON` }; } }) : []);
const tấtCả = () => [...đọc(SEED), ...đọc(FILE)];
// glob → regex theo token (thay chuỗi liên tiếp làm `(?:.*/)?` bị bước sau ăn mất `*`/`?`): ** · **/ · * · ? · {a,b}
const globRe = (g) => new RegExp('^' + g.replace(/\*\*\/|\*\*|\*|\?|\{[^}]*\}|[.+^$()|[\]\\]/g, (t) => t === '**/' ? '(?:.*/)?' : t === '**' ? '.*' : t === '*' ? '[^/]*' : t === '?' ? '[^/]' : t[0] === '{' ? '(?:' + t.slice(1, -1).split(',').map((x) => x.trim().replace(/[.+^$()|[\]\\]/g, '\\$&')).join('|') + ')' : '\\' + t) + '$');
const soát = (r) => {
  const lỗi = [];
  if (r._lỗi) return [r._lỗi];
  if (!/^RL-\d+$/.test(r.id || '')) lỗi.push('thiếu id RL-nn');
  if (!/\b(J|LS|AU|TC|G|D|WI|R|E|BRule)-[A-Z0-9-]*\d+\b/.test(r.từ || '')) lỗi.push(`${r.id}: "từ" phải trỏ finding/luật gốc (J-nn/LS-nn/AU-nn/TC-…/WI-nn/R-…), được "${r.từ || ''}"`);
  if (!LOẠI.includes(r.loại)) lỗi.push(`${r.id}: loại phải là co|thieu`);
  if (!r.glob) lỗi.push(`${r.id}: thiếu glob`);
  for (const k of ['mẫu', 'khi']) if (r[k]) { try { new RegExp(r[k]); } catch (e) { lỗi.push(`${r.id}: ${k} không biên dịch được — ${e.message}`); } }
  if (!r.mẫu) lỗi.push(`${r.id}: thiếu mẫu`);
  if (!MỨC.includes(r.mức)) lỗi.push(`${r.id}: mức phải là 🔴|🟠|🟡`);
  if (!r.lýDo) lỗi.push(`${r.id}: thiếu lýDo`);
  if (!['candidate', 'confirmed', 'retired'].includes(r.trạngThái)) lỗi.push(`${r.id}: trạngThái phải là candidate|confirmed|retired`);
  return lỗi;
};
const ghiDự = (rows) => { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, rows.map((r) => { const c = Object.assign({}, r); delete c._src; delete c._line; return JSON.stringify(c); }).join('\n') + (rows.length ? '\n' : '')); };
const idKế = () => { const n = tấtCả().map((r) => +((r.id || '').match(/\d+/) || [0])[0]).reduce((a, b) => Math.max(a, b), 0); return 'RL-' + String(n + 1).padStart(2, '0'); };
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); const rel = path.relative(ROOT, p); if (BỎ.test(rel)) continue; if (e.isDirectory()) walk(p, out); else if (/\.(m?[jt]sx?|py|go|rs|java|kt|rb|php|cs|vue|svelte)$/.test(e.name)) out.push(rel); } return out; };

if (CMD === 'list') {
  const xs = tấtCả().filter((r) => !r._lỗi && (ALL || r.trạngThái === 'confirmed'));
  const f = opt('--glob-of'); const ys = f ? xs.filter((r) => globRe(r.glob).test(f)) : xs;
  if (JSON_MODE) console.log(JSON.stringify(ys, null, 2));
  else for (const r of ys) console.log(`${r.id} ${r.mức} [${r.loại}] ${r.glob} · ${r.loại === 'co' ? 'KHÔNG được có' : 'PHẢI có'} /${r.mẫu}/${r.khi ? ` khi /${r.khi}/` : ''} — ${r.lýDo} (từ ${r.từ}${r.trạngThái !== 'confirmed' ? ', ' + r.trạngThái : ''})`);
  process.exit(0);
}
if (CMD === 'lint') {
  const lỗi = tấtCả().flatMap(soát);
  const ids = tấtCả().map((r) => r.id).filter(Boolean); const trùng = ids.filter((x, i) => ids.indexOf(x) !== i);
  for (const t of [...new Set(trùng)]) lỗi.push(`id ${t} trùng`);
  if (lỗi.length) { for (const l of lỗi) console.log('  ❌ ' + l); process.exit(1); }
  console.log(`  ✓ ${tấtCả().length} luật (${đọc(SEED).length} seed + ${đọc(FILE).length} dự án) đều có nguồn finding, regex, glob, mức`); process.exit(0);
}
if (CMD === 'add' || CMD === 'from-review') {
  const thêm = [];
  if (CMD === 'add') {
    const r = { id: idKế(), từ: opt('--tu'), loại: opt('--loai'), mẫu: opt('--mau'), khi: opt('--khi') || undefined, glob: opt('--glob'), mức: opt('--muc', '🟠'), lýDo: opt('--ly-do'), sửa: opt('--sua') || undefined, trạngThái: argv.includes('--confirmed') ? 'confirmed' : 'candidate', lúc: new Date().toISOString().slice(0, 10) };
    const l = soát(r); if (l.length) { for (const x of l) console.error('  ❌ ' + x); process.exit(2); }
    thêm.push(r);
  } else {
    const f = argv[1]; if (!f || !fs.existsSync(f)) { console.error('from-review <review.md>'); process.exit(2); }
    const txt = fs.readFileSync(f, 'utf8');
    const mục = (txt.match(/^## Chuyển thành luật lint[^\n]*\n([\s\S]*?)(?=^## |\*\*Verdict:\*\*)/m) || [])[1] || '';
    const khối = (mục.match(/```rules\n([\s\S]*?)```/) || [])[1] || '';
    let n = 0;
    for (const l of khối.split('\n').filter((x) => x.trim())) {
      let r; try { r = JSON.parse(l); } catch { console.error('  ❌ dòng không phải JSON: ' + l.slice(0, 80)); continue; }
      r = Object.assign({ id: 'RL-' + String((+idKế().slice(3)) + n).padStart(2, '0'), mức: '🟠', trạngThái: 'candidate', lúc: new Date().toISOString().slice(0, 10) }, r, { trạngThái: 'candidate' });
      if (!r.từ) r.từ = path.basename(f); const lỗi = soát(r); if (lỗi.length) { for (const x of lỗi) console.error('  ❌ ' + x); continue; }
      thêm.push(r); n++;
    }
    if (!thêm.length) { console.log(`from-review: không có luật hợp lệ trong khối \`\`\`rules của ${path.basename(f)}`); process.exit(0); }
  }
  ghiDự([...đọc(FILE), ...thêm]);
  for (const r of thêm) console.log(`rules: +${r.id} (${r.trạngThái}) ${r.loại} /${r.mẫu}/ ${r.glob} — từ ${r.từ}${r.trạngThái === 'candidate' ? ' → người: rules.js confirm ' + r.id : ''}`);
  process.exit(0);
}
if (CMD === 'confirm' || CMD === 'retire') {
  const id = argv[1]; const rows = đọc(FILE); const r = rows.find((x) => x.id === id);
  if (!r) { console.error(`${id} không có trong .claude/ac-rules.jsonl (luật seed của toolkit không confirm/retire ở đây)`); process.exit(2); }
  r.trạngThái = CMD === 'confirm' ? 'confirmed' : 'retired'; r.lúcQuyết = new Date().toISOString().slice(0, 10); ghiDự(rows);
  console.log(`rules: ${id} → ${r.trạngThái}`); process.exit(0);
}
if (CMD === 'check') {
  const luật = tấtCả().filter((r) => !r._lỗi && !soát(r).length && (r.trạngThái === 'confirmed' || (ALL && r.trạngThái === 'candidate')));
  let files;
  if (opt('--range')) { const g = spawnSync('git', ['-C', ROOT, 'diff', '--name-only', '--diff-filter=AM', opt('--range')], { encoding: 'utf8' }); if (g.status !== 0) { console.error('git diff lỗi: ' + g.stderr.trim()); process.exit(2); } files = g.stdout.split('\n').filter((f) => f && !BỎ.test(f) && fs.existsSync(path.join(ROOT, f))); }
  else files = walk(ROOT);
  const hit = [];
  for (const r of luật) {
    const re = new RegExp(r.mẫu), khi = r.khi ? new RegExp(r.khi) : null, gr = globRe(r.glob);
    for (const f of files) {
      if (!gr.test(f)) continue;
      let txt; try { txt = fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch { continue; }
      // bỏ file test (test khẳng định "không còn console.log(config)" tự chứa chuỗi đó) trừ khi luật khai kểCảTest; bỏ dòng chú thích
      if (!r.kểCảTest && /(^|\/)(tests?|__tests__|spec|e2e)\/|\.(test|spec)\.[cm]?[jt]sx?$/.test(f)) continue;
      if (r.loại === 'co') { txt.split('\n').forEach((l, i) => { if (/^\s*(\/\/|#|\*|\/\*)/.test(l)) return; if (re.test(l)) hit.push({ id: r.id, mức: r.mức, file: f, line: i + 1, lýDo: r.lýDo, sửa: r.sửa, từ: r.từ, dòng: l.trim().slice(0, 100) }); }); }
      else { if (khi && !khi.test(txt)) continue; if (!re.test(txt)) hit.push({ id: r.id, mức: r.mức, file: f, line: null, lýDo: r.lýDo, sửa: r.sửa, từ: r.từ, dòng: `thiếu /${r.mẫu}/${khi ? ' dù khớp /' + r.khi + '/' : ''}` }); }
    }
  }
  const out = { luật: luật.length, file: files.length, hit, gioiHan: ['regex theo dòng/file, không hiểu cú pháp', 'thieu chỉ đúng khi khi đủ hẹp — hit oan → rules.js retire'] };
  if (JSON_MODE) console.log(JSON.stringify(out, null, 2));
  else {
    console.log(`rules check: ${luật.length} luật · ${files.length} file${opt('--range') ? ' (' + opt('--range') + ')' : ''} · ${hit.length ? hit.length + ' hit' : 'không hit'}`);
    for (const h of hit) console.log(`  ${h.mức} ${h.id} ${h.file}${h.line ? ':' + h.line : ''} — ${h.lýDo} (từ ${h.từ})${h.sửa ? ' → ' + h.sửa : ''}\n      ${h.dòng}`);
  }
  process.exit(hit.length ? 1 : 0);
}
console.error('Dùng: rules.js check|add|from-review|confirm|retire|list|lint'); process.exit(2);
