#!/usr/bin/env node
/*
 * ba-toolkit/state.js — TRẠNG THÁI ĐỘI ngoài hội thoại: `.claude/ac-state.json` ở gốc dự án. Zero-dependency.
 * (Dời từ ac-team/scripts/ 08/10/2026 — dev-run (lõi) và ac-verify cần sổ phái; ac-team (gói Pro) gọi sang đây.)
 *
 *   node .claude/skills/ba-toolkit/scripts/state.js init <Mã> --base <sha> --batches <json-từ-batch-plan> [--autonomy solo] [--mode team|single]
 *   node .claude/skills/ba-toolkit/scripts/state.js batch-done <n> --summary <file.json>     # worker trả tóm tắt
 *   node .claude/skills/ba-toolkit/scripts/state.js batch-fail <n> --reason "<vì sao>"
 *   node .claude/skills/ba-toolkit/scripts/state.js resume [--docs docs]                    # ĐỐI CHIẾU với git rồi in bước kế
 *   node .claude/skills/ba-toolkit/scripts/state.js spawn ac-judge <Mã> [--round N] [--reset]   # sổ phái verifier/judge: một màn một vòng một agent (exit 2 nếu trùng)
 *   node .claude/skills/ba-toolkit/scripts/state.js show
 *
 * Vì sao có (tlc-spec-driven memory.md): phiên dev dài hơn một cửa sổ ngữ cảnh. Không có trạng thái trên
 * đĩa thì mỗi lần mở lại là kể lại từ đầu — và kể lại là chỗ bịa vào. `resume` KHÔNG tin snapshot: nó
 * đối chiếu với `git` (nhánh hiện tại, HEAD, commit từ base, checkbox trong plan.md) và BẰNG CHỨNG THẮNG —
 * snapshot nói lô 2 xong mà git không có commit task nào của lô 2 thì lô 2 chưa xong.
 *
 * Tóm tắt lô (worker trả, orchestrator ghi) — 4 trường bắt buộc + `model` (tùy chọn, khuyến nghị), không log thô:
 *   { "model": "claude-opus-5", "tasks": [{ "n": 3, "commit": "abc1234" }], "tests": { "passed": 12, "failed": 0 }, "deviations": [], "blockers": [] }
 *   `model` là để ac-evaluator/ac-verifier biết "người viết là ai" và cắm cờ trùng người chấm (dogfood 15/09: thiếu → phải đoán).
 * `batch-done` ĐỐI CHIẾU lời khai với git trước khi ghi `xong`: mỗi `tasks[].commit` phải tồn tại (`git cat-file -e`), nằm trong
 *   `base..HEAD` (`merge-base --is-ancestor`, khác base), chạm ≥1 file ngoài `docs/`/`.claude/`, và message nhắc "Task N" (hoặc
 *   TC trace của task). Sai → lô `dở` + lý do từng task, exit 2 (sha bịa / commit nhánh khác / commit chỉ tick plan.md là pass giả).
 *
 * `--mode` (tlc-spec-lean 1.1 build.md): plan vượt ngân sách thì người dùng chọn MỘT trong hai lối ra, và lựa chọn
 * phải NẰM TRÊN ĐĨA chứ không chỉ trong hội thoại (compaction nuốt hội thoại trước):
 *   team   (mặc định — ac-team gọi) lô tuần tự, chỉ đi tiếp khi lô trước xanh; --batches bắt buộc.
 *   single (dev-run, người dùng chọn một agent) chấp nhận compaction; --batches tùy chọn (không có → chỉ ghi base + lựa chọn).
 * `resume`/`show` in chế độ; single thì in luôn bước phục hồi (đọc lại plan.md + git diff base..HEAD) và task chưa tick đầu tiên.
 * State cũ không có `mode` được đọc là team (trước 24/09/2026 chỉ ac-team ghi file này).
 *
 * gioiHan: batch-done không đọc NỘI DUNG commit (code đúng hay không là việc verifier/judge) — chỉ soát sha có thật, đúng khoảng,
 * có chạm code, đúng tên task. Đối chiếu commit bằng chuỗi "Task N"/"task N" hoặc mã TC trong message + checkbox plan.md — task commit
 * với message không nhắc gì thì resume báo "không có bằng chứng", không đoán. Không chạy test.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (k, d = null) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const ROOT = path.resolve(opt('--root', process.cwd()));
const FILE = path.join(ROOT, '.claude', 'ac-state.json');
const git = (...a) => { try { return execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };
const load = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return null; } };
const save = (s) => { fs.mkdirSync(path.dirname(FILE), { recursive: true }); s.updatedAt = new Date().toISOString(); fs.writeFileSync(FILE, JSON.stringify(s, null, 2) + '\n'); };
const die = (m) => { console.error(m); process.exit(2); };
const MODES = { team: 'đội (lô tuần tự, chỉ đi tiếp khi xanh)', single: 'một agent (chấp nhận compaction)' };

if (cmd === 'init') {
  const screen = argv[1]; if (!screen) die('init <Mã> --base <sha> --batches <json>');
  const mode = opt('--mode', 'team'); if (!MODES[mode]) die(`--mode ${mode} không hợp lệ — chỉ team | single`);
  const base = opt('--base') || git('rev-parse', 'HEAD'); if (!base) die('--base <sha> (hoặc đứng trong repo git)');
  let plan = { batches: [], tasks: [] };
  if (opt('--batches') || mode === 'team') { try { plan = JSON.parse(fs.readFileSync(opt('--batches'), 'utf8')); } catch { die('--batches <file json do batch-plan.js --json sinh>'); } }
  const s = {
    schema: 1, screen, mode, branch: git('branch', '--show-current'), base, autonomy: opt('--autonomy', 'solo'),
    budget: plan.budget, startedAt: new Date().toISOString(),
    batches: plan.batches.map((b) => ({ n: b.n, tasks: b.tasks, status: 'chờ', commits: [], summary: null })),
    tasks: Object.fromEntries(plan.tasks.map((t) => [t.n, { title: t.title, trace: t.trace, status: t.done ? 'xong' : 'chờ', commit: null }])),
    log: [],
  };
  save(s); console.log(`ac-state: khởi tạo ${screen} · chế độ ${MODES[mode]} · nhánh ${s.branch} · base ${base.slice(0, 7)} · ${s.batches.length} lô · tự chủ ${s.autonomy}`);
} else if (cmd === 'batch-done' || cmd === 'batch-fail') {
  const s = load() || die('chưa có .claude/ac-state.json — chạy init');
  const n = +argv[1]; const b = s.batches.find((x) => x.n === n) || die(`không có lô ${n}`);
  if (cmd === 'batch-fail') {
    b.status = 'hỏng'; b.reason = opt('--reason', '(không ghi lý do)'); s.log.push({ t: new Date().toISOString(), lô: n, sự_kiện: 'hỏng', lý_do: b.reason });
    save(s); console.log(`ac-state: lô ${n} HỎNG — ${b.reason}. Orchestrator quyết: sửa / hỏi người / dừng.`); process.exit(0);
  }
  let sum = null; try { sum = JSON.parse(fs.readFileSync(opt('--summary'), 'utf8')); } catch { die('--summary <file.json> (4 trường: tasks, tests, deviations, blockers)'); }
  for (const k of ['tasks', 'tests', 'deviations', 'blockers']) if (!(k in sum)) die(`tóm tắt thiếu trường "${k}"`);
  const thiếu = b.tasks.filter((t) => !sum.tasks.some((x) => +x.n === t));
  if (thiếu.length) { b.status = 'dở'; s.log.push({ t: new Date().toISOString(), lô: n, sự_kiện: 'dở', thiếu }); save(s); die(`lô ${n} báo xong nhưng thiếu task ${thiếu.join(', ')} — ghi 'dở', KHÔNG sang lô kế`); }
  if (sum.tests && sum.tests.failed) { b.status = 'hỏng'; b.reason = `${sum.tests.failed} test fail`; save(s); die(`lô ${n}: ${sum.tests.failed} test fail — ghi 'hỏng'`); }
  // Lời khai phải khớp git (đợt 5 — chống pass giả): mỗi sha khai (1) tồn tại, (2) nằm trong base..HEAD, (3) chạm ít nhất một
  // file ngoài docs/ và .claude/ (tick plan.md/sổ không phải code), (4) message nhắc "Task N" hoặc một TC trace của task.
  // Sai một điều → lô 'dở' kèm lý do, KHÔNG sang lô kế. Tóm tắt là lời worker nói; git là thứ đã xảy ra.
  {
    const lý = [];
    const head = git('rev-parse', 'HEAD');
    if (!head) lý.push('không đọc được git HEAD ở --root — không đối chiếu được sha khai');
    else for (const x of sum.tasks) {
      const sha = String(x.commit || '').trim(); const tn = `Task ${x.n}`;
      if (!/^[0-9a-f]{4,40}$/i.test(sha)) { lý.push(`${tn}: không khai commit (hoặc không phải sha): "${sha}"`); continue; }
      const full = git('rev-parse', '--verify', '--quiet', `${sha}^{commit}`);
      if (git('cat-file', '-e', `${sha}^{commit}`) === null || !full) { lý.push(`${tn}: commit ${sha} không tồn tại trong repo`); continue; }
      const trong = full !== git('rev-parse', `${s.base}^{commit}`) && git('merge-base', '--is-ancestor', s.base, full) !== null && git('merge-base', '--is-ancestor', full, 'HEAD') !== null;
      if (!trong) { lý.push(`${tn}: commit ${sha.slice(0, 7)} không thuộc ${String(s.base).slice(0, 7)}..HEAD`); continue; }
      const files = (git('diff-tree', '--no-commit-id', '-r', '--name-only', '--root', full) || '').split('\n').filter(Boolean);
      if (!files.some((f) => !/^(docs|\.claude)\//.test(f))) lý.push(`${tn}: commit ${sha.slice(0, 7)} chỉ chạm ${files.length ? 'docs/ hoặc .claude/' : 'không file nào'} — không có code`);
      const msg = git('log', '-1', '--format=%B', full) || '';
      const trace = ((s.tasks[x.n] || {}).trace || []);
      if (!new RegExp(`\\b[Tt]ask\\s*${x.n}\\b`).test(msg) && !trace.some((tc) => msg.includes(tc))) lý.push(`${tn}: message commit ${sha.slice(0, 7)} không nhắc "Task ${x.n}"${trace.length ? ' hay TC trace' : ''} — resume không đối chiếu được`);
    }
    if (lý.length) { b.status = 'dở'; b.reason = lý.join(' · '); s.log.push({ t: new Date().toISOString(), lô: n, sự_kiện: 'dở', lý_do: lý }); save(s); die(`lô ${n} báo xong nhưng lời khai không khớp git — ghi 'dở', KHÔNG sang lô kế:\n  - ${lý.join('\n  - ')}`); }
  }
  if (!sum.model) console.log(`ac-state: ⚠️ tóm tắt lô ${n} không ghi "model" — evaluator/verifier sẽ không cắm được cờ trùng người chấm`);
  b.status = 'xong'; b.summary = sum; b.model = sum.model || null; b.commits = sum.tasks.map((x) => x.commit).filter(Boolean);
  for (const x of sum.tasks) if (s.tasks[x.n]) { s.tasks[x.n].status = 'xong'; s.tasks[x.n].commit = x.commit || null; }
  s.log.push({ t: new Date().toISOString(), lô: n, sự_kiện: 'xong', tests: sum.tests, deviations: sum.deviations.length, blockers: sum.blockers.length });
  save(s);
  const kế = s.batches.find((x) => x.status === 'chờ');
  console.log(`ac-state: lô ${n} xong (${sum.tasks.length} task, test ${sum.tests.passed}/${sum.tests.passed + (sum.tests.failed || 0)})${sum.deviations.length ? ` · ${sum.deviations.length} lệch plan` : ''}${sum.blockers.length ? ` · ${sum.blockers.length} chặn` : ''}. ${kế ? `Kế: lô ${kế.n} (${kế.tasks.map((t) => 'Task ' + t).join(', ')})` : 'Hết lô → ac-verify ' + s.screen}`);
} else if (cmd === 'resume' || cmd === 'show') {
  const s = load(); if (!s) { console.log('ac-state: không có .claude/ac-state.json — chưa có phiên đội nào; bắt đầu bằng ac-team <màn>.'); process.exit(0); }
  const mode = MODES[s.mode] ? s.mode : 'team';
  const lines = [`ac-state ${s.screen}: chế độ ${MODES[mode]} · nhánh ${s.branch} · base ${s.base.slice(0, 7)} · tự chủ ${s.autonomy} · cập nhật ${s.updatedAt}`];
  for (const b of s.batches) lines.push(`  lô ${b.n} [${b.status}] ${b.tasks.map((t) => 'Task ' + t).join(', ')}${b.reason ? ' — ' + b.reason : ''}`);
  if (cmd === 'show') { console.log(lines.join('\n')); process.exit(0); }
  // ĐỐI CHIẾU với git — bằng chứng thắng snapshot
  const cảnh = [];
  const branch = git('branch', '--show-current');
  if (branch && s.branch && branch !== s.branch) cảnh.push(`đang ở nhánh ${branch}, snapshot ghi ${s.branch} — checkout đúng nhánh trước`);
  // Bỏ qua file của chính đội (`.claude/ac-*.json`, brief, summary): chúng luôn chưa commit — dogfood 15/09/2026
  // báo "5 file bẩn" toàn là chúng, che mất tín hiệu thật.
  const dirty = (git('status', '--porcelain', '--untracked-files=all') || '').split('\n').filter((l) => l && !/\.claude\/ac-/.test(l)).join('\n');
  if (dirty) cảnh.push(`working tree có ${dirty.split('\n').length} file chưa commit — lô trước có thể dở dang`);
  const logTxt = git('log', '--format=%h %s', `${s.base}..HEAD`) || '';
  const commits = logTxt ? logTxt.split('\n') : [];
  // plan.md checkbox
  const docs = path.resolve(ROOT, opt('--docs', 'docs')); let planTxt = '';
  (function walk(d) { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (!e.isDirectory() || /^(Ho-so|removed)$/.test(e.name)) continue; const p = path.join(d, e.name); if (new RegExp(`^${s.screen}\\b`).test(e.name) && fs.existsSync(path.join(p, 'plan.md'))) { planTxt = fs.readFileSync(path.join(p, 'plan.md'), 'utf8'); return; } walk(p); if (planTxt) return; } })(docs);
  const tickedAll = (n) => { const sec = (planTxt.split(/^(?=## Task \d+)/m).find((x) => x.startsWith(`## Task ${n}:`)) || ''); const all = (sec.match(/^- \[[ xX]\] /gm) || []).length; return all > 0 && (sec.match(/^- \[[xX]\] /gm) || []).length === all; };
  for (const b of s.batches) {
    for (const t of b.tasks) {
      const st = s.tasks[t];
      const inGit = commits.some((c) => new RegExp(`\\b[Tt]ask\\s*${t}\\b`).test(c) || (st.trace || []).some((tc) => c.includes(tc)));
      const ticked = tickedAll(t);
      if (st.status === 'xong' && !inGit && !ticked) { st.status = 'chờ'; cảnh.push(`Task ${t}: snapshot nói xong nhưng git (${s.base.slice(0, 7)}..HEAD) không có commit nhắc nó và plan.md chưa tick → coi là CHƯA xong`); }
      if (st.status !== 'xong' && (inGit || ticked)) cảnh.push(`Task ${t}: snapshot nói chờ nhưng ${inGit ? 'git có commit nhắc nó' : 'plan.md đã tick hết'} → kiểm lại bằng tay, không tự đánh xong`);
    }
    if (b.status === 'xong' && b.tasks.some((t) => s.tasks[t].status !== 'xong')) { b.status = 'dở'; cảnh.push(`lô ${b.n}: hạ từ xong → dở theo bằng chứng git`); }
  }
  save(s);
  const kế = s.batches.find((x) => x.status !== 'xong');
  lines.push(`  git: ${commits.length} commit từ base${dirty ? ' · working tree bẩn' : ''}`);
  for (const c of cảnh) lines.push(`  ⚠️  ${c}`);
  if (mode === 'single') {
    // Một agent: không có lô để chỉ; bước kế = phục hồi ngữ cảnh rồi task chưa tick đầu tiên theo plan.md (bằng chứng, không theo trí nhớ).
    const chưa = [...planTxt.matchAll(/^## Task (\d+):/gm)].map((m) => +m[1]).find((n) => !tickedAll(n));
    lines.push(`  👉 Phục hồi (một agent, đã chấp nhận compaction): đọc lại plan.md của ${s.screen} + \`git diff ${s.base.slice(0, 7)}..HEAD\` TRƯỚC khi sửa gì`);
    lines.push(planTxt ? (chưa ? `  👉 Bước kế: Task ${chưa} (task đầu tiên plan.md chưa tick hết)` : `  👉 plan.md đã tick hết → ac-verify ${s.screen}`) : `  ⚠️  không tìm thấy plan.md của ${s.screen} dưới ${path.relative(ROOT, docs) || '.'} — --docs <thư mục>`);
    console.log(lines.join('\n')); process.exit(0);
  }
  lines.push(kế ? `  👉 Bước kế: ${kế.status === 'hỏng' ? `lô ${kế.n} đang HỎNG (${kế.reason}) — quyết sửa/hỏi trước` : `chạy lô ${kế.n} (${kế.tasks.map((t) => 'Task ' + t).join(', ')})`}` : `  👉 Mọi lô xong → ac-verify ${s.screen}`);
  console.log(lines.join('\n'));
} else if (cmd === 'spawn') {
  // spawn <agent> <Mã> [--round N] [--reset]: ghi mỗi lần phái verifier/judge; TỪ CHỐI khi vòng này đã có (một màn một vòng một agent).
  // Đo 17/09/2026: hai phiên phái 16 judge cho một màn — luật chữ trong SKILL không đủ, phải là exit code. Vòng mới = --round N
  // (verifier/judge cùng số vòng); TRẢ → orchestrator tăng vòng. Sổ riêng .claude/ac-spawn.json (màn không qua ac-team vẫn dùng được).
  const agent = argv[1], screen = argv[2]; if (!agent || !screen) die('spawn <ac-verifier|ac-judge|ac-evaluator|ac-auditor> <Mã> [--round N]');
  const SP = path.join(ROOT, '.claude', 'ac-spawn.json');
  let sp = {}; try { sp = JSON.parse(fs.readFileSync(SP, 'utf8')); } catch { /* mới */ }
  const key = screen + '/' + agent; sp[key] = sp[key] || [];
  if (argv.includes('--reset')) { sp[key] = []; fs.mkdirSync(path.dirname(SP), { recursive: true }); fs.writeFileSync(SP, JSON.stringify(sp, null, 2)); console.log(`spawn: xoá sổ ${key}`); process.exit(0); }
  const round = +opt('--round', sp[key].length ? sp[key][sp[key].length - 1].round : 1);
  const đã = sp[key].filter((x) => x.round === round);
  if (đã.length) die(`spawn: ${agent} cho ${screen} vòng ${round} ĐÃ phái lúc ${đã[0].t} — một màn một vòng một agent; vòng mới → --round ${round + 1} (sau TRẢ), hoặc --reset nếu chắc chắn`);
  if (sp[key].length >= 4) die(`spawn: ${agent} cho ${screen} đã 4 vòng — po.ask "TRẢ quá 2 vòng" đáng lẽ đã dừng; hỏi người`);
  sp[key].push({ t: new Date().toISOString(), round });
  fs.mkdirSync(path.dirname(SP), { recursive: true }); fs.writeFileSync(SP, JSON.stringify(sp, null, 2));
  console.log(`spawn: ${agent} ${screen} vòng ${round} — được phái (lần ${sp[key].length} cho màn này)`); process.exit(0);
} else die('Lệnh: init | batch-done | batch-fail | resume | show | spawn');
