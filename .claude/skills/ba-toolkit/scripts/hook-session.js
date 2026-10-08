#!/usr/bin/env node
/*
 * ba-toolkit/hook-session.js — hook `SessionStart` + `UserPromptSubmit`: KHOÁ MỀM GIỮA CÁC PHIÊN (W7, 06/10/2026).
 *
 * Ca thật (một dự án desktop, 06/10/2026): phiên A tạo nhánh `try/figma-s34`, để dở thay đổi chưa commit; phiên B (cửa
 * sổ Claude khác, CÙNG thư mục) chuyển `try/figma-s34` → `docs/ds-4b` → `main`. Thay đổi chưa commit của A lặng lẽ
 * đi theo sang `main`; agent của A dựng màn mới trên `main` mà tưởng đang ở nhánh thử; về sau html S34 chứa sửa của
 * CẢ HAI phiên, không tách commit được nữa. Git không sai — thư mục làm việc là MỘT, nhánh là của thư mục chứ không
 * của phiên. Không có gì báo cho A biết đất dưới chân vừa dời.
 *
 * Sổ phiên `.claude/ba-session.json` (runtime, gitignore — `ba-export` thêm dòng):
 *   { sessions: { <session_id>: { branch, startedAt, lastSeenAt, cwd, daCanhBao: { <id khác>: iso } } } }
 * Mỗi worktree có `.claude/` riêng → sổ riêng: hai phiên ở hai worktree không thấy nhau — đúng ý (đã cách ly).
 *
 * S9a — NHÁNH ĐỔI DƯỚI CHÂN PHIÊN. Nhánh sổ ghi cho phiên này ≠ nhánh hiện tại, và transcript của chính phiên KHÔNG
 *   có `git checkout|switch … <nhánh mới>` kể từ lần thấy cuối (best-effort) → nhắc MỘT lần rồi ghi nhánh mới vào sổ
 *   (đổi lần nữa mới nhắc lần nữa).
 * S9b — PHIÊN KHÁC CÒN SỐNG CÙNG REPO. Mục khác id, `lastSeenAt` trong 30 phút → nhắc MỘT lần cho mỗi phiên kia
 *   (một "đợt" = một lần phiên kia có mặt), kèm nhánh của nó + gợi ý `git worktree add`.
 * Mục cũ hơn 2 giờ bị xoá khỏi sổ (phiên đã đóng mà không báo — Claude Code không có hook "đóng phiên" chắc chắn).
 *
 * Vì sao hai sự kiện này (không Stop, không PreToolUse):
 *   · `SessionStart` — đăng ký phiên, và bắt cả ca `--resume`/compact sau khi nhánh đã dời trong lúc phiên ngủ.
 *   · `UserPromptSubmit` — chạy TRƯỚC mỗi lượt người dùng; nhánh bị phiên khác đổi thường xảy ra GIỮA các lượt (lúc
 *     người dùng đang ở cửa sổ kia). stdout `exit 0` của hai sự kiện này được Claude Code đưa vào ngữ cảnh → agent
 *     đọc cảnh báo TRƯỚC khi đụng file. Không bao giờ chặn lời nhắn của người dùng.
 *   · `Stop` là sau khi đã làm hỏng, và `exit 2` ở Stop ép agent chạy tiếp; `PreToolUse` nổ ở MỌI tool (song song,
 *     tranh ghi sổ) — đắt hơn nhiều cho cùng một tín hiệu.
 *
 * SI — TOOLKIT LỆCH NGUỒN (SessionStart, hook-review 07/10/2026): gọi `integrity.js` (so `.claude/skills/` + khối hook với
 *   nguồn/manifest đã commit), lệch chưa duyệt → in danh sách vào ngữ cảnh. Không kiểm được / repo nguồn → im.
 *
 * Rẻ: không spawn `git` cho S9 — đọc thẳng `.git/HEAD` (cả worktree: `.git` là file `gitdir: …`). Chỉ đọc 256 KB đuôi
 * transcript khi nhánh đã đổi. Mọi lỗi → im, exit 0. Tắt từng luật: `{"S9a": false}` / `{"S9b": false}` / `{"SI": false}` trong
 * `.claude/ba-hooks.json`.
 *
 * gioiHan: "phiên tự checkout" là đoán theo transcript — lệnh đổi nhánh qua script/alias/`git -C` sẽ bị coi là phiên
 * khác đổi (nhắc thừa một lần). Phiên đóng không báo thì còn "sống" tới 30 phút sau lượt cuối. Đọc-sửa-ghi sổ không
 * khoá: hai phiên ghi cùng lúc có thể mất một lần cập nhật `lastSeenAt` (lượt sau tự sửa). Không đọc `git status` —
 * chỉ báo đất dời, không biết có thay đổi dở thật hay không. Chỉ ghi khi `<gốc repo>/.claude/` đã có.
 *
 * Dùng (Claude Code tự gọi): echo '{"session_id":"…","cwd":"…","hook_event_name":"UserPromptSubmit"}' | node hook-session.js
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ trước process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const SỐNG_MS = 30 * 60 * 1000;     // phiên khác còn "sống" nếu thấy trong 30 phút
const HẾT_MS = 2 * 60 * 60 * 1000;  // mục cũ hơn 2 giờ → xoá
const ĐUÔI_TRANSCRIPT = 262144;

// Gốc repo + nhánh hiện tại, không spawn git. null = không phải repo git → im.
function đọcGit(cwd) {
  let d = path.resolve(cwd);
  for (;;) {
    const g = path.join(d, '.git');
    let st = null; try { st = fs.statSync(g); } catch { /* đi lên */ }
    if (st) {
      let gitDir = g;
      if (st.isFile()) {
        const m = fs.readFileSync(g, 'utf8').match(/^gitdir:\s*(.+)\s*$/m);
        if (!m) return null;
        gitDir = path.resolve(d, m[1].trim());
      }
      const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
      const r = head.match(/^ref:\s*refs\/heads\/(.+)$/);
      return { gốc: d, nhánh: r ? r[1] : `(detached ${head.slice(0, 7)})` };
    }
    const lên = path.dirname(d);
    if (lên === d) return null;
    d = lên;
  }
}

// Phiên có tự đổi sang `nhánh` kể từ `từ` không — dò đuôi transcript. Không đọc được → coi như KHÔNG (nhắc).
function phiênTựĐổi(transcript, nhánh, từ) {
  if (!transcript) return false;
  let fd = null;
  try {
    fd = fs.openSync(transcript, 'r');
    const size = fs.fstatSync(fd).size;
    const n = Math.min(size, ĐUÔI_TRANSCRIPT);
    const buf = Buffer.alloc(n);
    fs.readSync(fd, buf, 0, n, size - n);
    const esc = nhánh.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lệnh = new RegExp(`git\\s+(?:checkout|switch)\\s+(?:-[bBcC]\\s+)?${esc}(?=["'\\s;&|)]|\\\\n|$)|git\\s+worktree\\s+add\\b[^"\\n]*-b\\s+${esc}\\b`);
    for (const l of buf.toString('utf8').split('\n')) {
      if (!l.includes('git') || !lệnh.test(l)) continue;
      const ts = (l.match(/"timestamp"\s*:\s*"([^"]+)"/) || [])[1];
      if (!ts || !từ || ts >= từ) return true;
    }
  } catch { return false; }
  finally { if (fd !== null) { try { fs.closeSync(fd); } catch { /* thôi */ } } }
  return false;
}

function cấuHình(gốc) {
  try { return JSON.parse(fs.readFileSync(path.join(gốc, '.claude', 'ba-hooks.json'), 'utf8')) || {}; } catch { return {}; }
}

function giờ(iso) { const d = new Date(iso); return isNaN(d) ? iso : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }

// Lõi — trả { cảnhBáo: [], luật: {S9a?, S9b?} }. Ghi sổ ở đây (best-effort).
function chạy(vào, nay = Date.now()) {
  const luật = {};
  const id = vào && typeof vào.session_id === 'string' && vào.session_id;
  if (!id) return { cảnhBáo: [], luật };
  const git = đọcGit(typeof vào.cwd === 'string' && vào.cwd ? vào.cwd : process.cwd());
  if (!git) return { cảnhBáo: [], luật };
  const thưMục = path.join(git.gốc, '.claude');
  if (!fs.existsSync(thưMục)) return { cảnhBáo: [], luật, gốc: git.gốc };
  const SỔ = path.join(thưMục, 'ba-session.json');
  let sổ = {};
  try { sổ = JSON.parse(fs.readFileSync(SỔ, 'utf8')); } catch { sổ = {}; }
  if (!sổ || typeof sổ !== 'object' || Array.isArray(sổ)) sổ = {};
  if (!sổ.sessions || typeof sổ.sessions !== 'object' || Array.isArray(sổ.sessions)) sổ.sessions = {};
  const ps = sổ.sessions;
  const tuổi = (e) => nay - Date.parse((e && e.lastSeenAt) || 0);
  for (const [k, e] of Object.entries(ps)) if (!(tuổi(e) <= HẾT_MS)) delete ps[k];   // NaN/cũ → xoá

  const isoNay = new Date(nay).toISOString();
  const cfg = cấuHình(git.gốc);
  const cảnhBáo = [];
  const tôi = ps[id] || { branch: git.nhánh, startedAt: isoNay, lastSeenAt: isoNay };

  // S9a — nhánh đổi dưới chân
  if (cfg.S9a !== false && ps[id] && tôi.branch && tôi.branch !== git.nhánh) {
    luật.S9a = { goi: true };
    if (!phiênTựĐổi(vào.transcript_path, git.nhánh, tôi.lastSeenAt)) {
      luật.S9a.ban = true;
      cảnhBáo.push(`[ba-toolkit hook · S9a] nhánh đổi từ \`${tôi.branch}\` sang \`${git.nhánh}\` dưới chân phiên — thay đổi chưa commit của bạn đang nằm trên \`${git.nhánh}\`; kiểm \`git status\` trước khi làm tiếp.`,
        `  Phiên này không tự đổi nhánh (transcript không có \`git checkout/switch ${git.nhánh}\` từ ${giờ(tôi.lastSeenAt)}) — nhiều khả năng một cửa sổ Claude khác cùng thư mục đã đổi.`,
        '  Muốn quay lại: commit/tách đúng file của mình trước (`git add <đường dẫn>`, không `git add -A`), rồi mới `git switch`.');
    }
  }
  tôi.branch = git.nhánh;

  // S9b — phiên khác còn sống cùng repo
  const đãNhắc = (tôi.daCanhBao && typeof tôi.daCanhBao === 'object') ? tôi.daCanhBao : {};
  for (const k of Object.keys(đãNhắc)) if (!ps[k] || k === id) delete đãNhắc[k];
  if (cfg.S9b !== false) {
    const khác = Object.entries(ps).filter(([k, e]) => k !== id && tuổi(e) <= SỐNG_MS);
    if (khác.length) luật.S9b = { goi: true };
    const mới = khác.filter(([k]) => !đãNhắc[k]);
    if (mới.length) {
      luật.S9b.ban = true;
      const repo = path.basename(git.gốc);
      if (cảnhBáo.length) cảnhBáo.push('');
      cảnhBáo.push(`[ba-toolkit hook · S9b] ${mới.length} phiên Claude khác đang mở trên CÙNG thư mục repo này:`,
        ...mới.map(([k, e]) => `  · phiên ${k.slice(0, 8)} — nhánh \`${e.branch || '?'}\`, thấy lần cuối ${giờ(e.lastSeenAt)}`),
        '  Hai phiên chung một thư mục làm việc: phiên kia đổi nhánh là thay đổi chưa commit của bạn đi theo, và file hai bên cùng sửa không tách commit được nữa.',
        `  Tách ra: \`git worktree add ../${repo}-<việc> -b <nhánh>\` rồi mở phiên kia ở đó. Commit chỉ file của mình (\`git add <đường dẫn>\`), không \`git add -A\`.`);
      for (const [k] of mới) đãNhắc[k] = isoNay;
    }
  }
  tôi.daCanhBao = đãNhắc;

  // SI — TOOLKIT LỆCH NGUỒN, chỉ ở SessionStart (hook-review 07/10/2026). Mọi cổng là script trong `.claude/skills/` — agent
  // ghi được; phiên trước vá checker cho im thì phiên này phải biết NGAY khi mở, trước khi tin một cổng xanh nào. integrity.js
  // so với nguồn/manifest đã commit (cache mtime → ~70 ms). Không kiểm được (chưa cài, nguồn xa) → im; repo nguồn → im.
  if (vào.hook_event_name === 'SessionStart' && cfg.SI !== false) {
    let r = null;
    try { r = require(path.join(__dirname, 'integrity.js')).kiểm(git.gốc); } catch { r = null; }
    if (r && r.nguon !== 'none' && r.nguon !== 'source-repo') {
      luật.SI = { goi: true };
      if (r.lech.length) {
        luật.SI.ban = true;
        if (cảnhBáo.length) cảnhBáo.push('');
        cảnhBáo.push(`[ba-toolkit hook · SI] toolkit ở dự án này LỆCH ${r.nguon === 'source' ? `nguồn @${r.commit}` : 'manifest đã commit'}: ${r.lech.length} mục chưa được duyệt — cổng (accept/validate-done) sẽ TRẢ A0 tới khi xử lý.`,
          ...r.lech.slice(0, 8).map((x) => `  · ${x.loai} ${x.file}${x.chiTiet ? ` — ${x.chiTiet}` : ''}`),
          ...(r.lech.length > 8 ? [`  · … và ${r.lech.length - 8} mục nữa (node .claude/skills/ba-toolkit/scripts/integrity.js)`] : []),
          '  Đừng vá checker tại chỗ: checker oan → `oan.js add`; sửa ở NGUỒN rồi `ba-export update`; bản vá có chủ đích → NGƯỜI duyệt ghi `.claude/ba-toolkit-local.json`.');
      }
    }
  }
  tôi.lastSeenAt = isoNay;
  if (typeof vào.cwd === 'string') tôi.cwd = vào.cwd;
  ps[id] = tôi;

  sổ._ = 'Sổ phiên của hook-session.js (runtime, không commit) — phiên nào đang mở trên nhánh nào.';
  let tạm = null;
  try {
    tạm = `${SỔ}.${process.pid}.tmp`;
    fs.writeFileSync(tạm, JSON.stringify(sổ, null, 1) + '\n', 'utf8');
    fs.renameSync(tạm, SỔ);
    tạm = null;
  } catch { /* ghi hỏng → lượt sau thử lại */ }
  finally { if (tạm) { try { fs.rmSync(tạm, { force: true }); } catch { /* thôi */ } } }
  return { cảnhBáo, luật, gốc: git.gốc };
}

module.exports = { chạy, đọcGit, phiênTựĐổi };

if (require.main === module) {
  let raw = '';
  process.stdin.on('data', (c) => { raw += c; });
  process.stdin.on('end', () => {
    let kq = { cảnhBáo: [], luật: {} };
    try { kq = chạy(JSON.parse(raw)); } catch { process.exit(0); }   // stdin hỏng / lỗi bất kỳ → im
    if (kq.gốc) { try { require('./hook-gate.js').ghiThốngKê('hook-session', kq.cảnhBáo.length > 0, kq.luật, path.join(kq.gốc, '.claude', 'ba-hook-stats.json')); } catch { /* phụ */ } }
    if (kq.cảnhBáo.length) process.stdout.write(kq.cảnhBáo.join('\n') + '\n');  // SessionStart/UserPromptSubmit: stdout exit 0 → vào ngữ cảnh
    process.exit(0);
  });
}
