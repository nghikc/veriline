#!/usr/bin/env node
/*
 * ba-toolkit/hook-lint.js — PostToolUse hook (Edit|Write), zero-dependency.
 * Nhận JSON qua stdin (Claude Code hook), lấy tool_input.file_path rồi:
 *   0) Sửa tài liệu của màn ĐÃ CHỐT (✅ trong 00-tracking.md) → append 1 dòng vào hàng đợi
 *      `.claude/spec-changes.jsonl`. THUẦN CƠ GIỚI, không gọi LLM, không chặn gì.
 *      Phân tích nghiệp vụ để sau, theo lô, do skill `ba-changelog` chạy.
 *   1) Sửa docs/**''/*.md            → H1/H2/H3 (check-md.js, exit 2) + lint Mermaid nhanh
 *      (build.js --lint <file>) — Mermaid chỉ còn là GỢI Ý MỀM: exit 0 + `additionalContext`
 *      (agent vẫn đọc được, nhưng không bị coi là lỗi lượt). Vì sao hạ (25/09/2026): trên 3 dự án
 *      thật nó bắt 0, kêu oan 2 (dự án desktop: `;` trong `#quot;`, rồi `%%`), mỗi lần oan tốn một vòng gap;
 *      phép thật là CI render Chrome (lỗi cú pháp thì render đỏ). Giữ chứ không bỏ vì phần nó thấy
 *      mà render KHÔNG thấy — nhãn tiếng Việt mất dấu, swimlane LR quá rộng — là quy ước, không phải cú pháp.
 *   2) Sửa .claude/skills|agents/** hoặc CLAUDE.md TRONG REPO TOOLKIT → chạy lint.js
 *      tự kiểm; lỗi → stderr + exit 2. (Repo tiêu dùng không có example/ ở gốc
 *      → tự bỏ qua nhánh này, không báo sai.)
 * Mọi trường hợp khác: exit 0 im lặng. Cài qua .claude/settings.json (ba-export tự merge).
 *
 * Export `recordSpecChange(rel, fp, opts)` + `baselineFolders(nội)` + `mãMàn(folder)` cho `hook-gate.js`: Stop TỰ ĐỐI SOÁT
 * bằng git (sửa qua Bash/sed, commit lén) và ghi bản ghi qua ĐÚNG hàm này — hai đường ghi một định dạng.
 *
 * hook-review 07/10/2026 (gói G) — năm lỗ đã tái hiện trên bản sao example:
 *   · bản ghi chỉ có `screen` = ô "Màn hình" (tên, vd `TaskDetail`) trong khi S1 tra theo mã `S03` ⇒ S1 KHÔNG BAO GIỜ
 *     bắn với bản ghi thật (ca test viết JSONL tay `screen:'S01'` nên xanh). Nay ghi thêm `code` rút từ folder.
 *   · hồ sơ `lite` tắt changelog ⇒ hook không ghi gì ⇒ S2 mù. Nay vẫn ghi, kèm `changelog:false` (hàng đợi S2 tách khỏi
 *     công tắc changelog).
 *   · bản ghi thêm `sha` (nội dung file lúc ghi): Stop biết file nào ĐÃ có bản ghi khớp, không nhân đôi khi đối soát.
 *   · catch nuốt im ⇒ nay đánh `hong` vào bộ đếm. Mermaid lint có timeout 5 s (trước không có — treo là treo lượt).
 *   · H5 thêm mẫu STUB (`throw … not implemented`, `pass`, `return true|null|[]|{}` cạnh TODO); `Write` đè lên file code
 *     ĐÃ TRACK thì so với `git show HEAD:` (trước chỉ `Edit` mới có old_string ⇒ Write cả file thành TODO lọt).
 *
 * gioiHan: chỉ thấy Edit/Write/NotebookEdit qua tool — Bash `sed -i` không kích hook này (Stop đối soát bù, chỉ khi là
 * git repo). H5 là heuristic theo dòng, không hiểu ngữ nghĩa; Write chỉ so khi file đã track trong git.
 *
 * VÌ SAO nhánh 0 chỉ GHI NHẬN mà không phân tích: hook là lệnh shell, KHÔNG gọi được
 * subagent. Muốn phân tích ngay thì phải exit 2 nhờ agent chính spawn hộ — nghĩa là mỗi
 * lần Edit một lượt LLM. Một lần `ba-screen-spec` ghi 6 file, `ba-batch` ghi hàng chục file
 * song song ⇒ vừa đắt vừa vô nghĩa (diff lúc đó là trạng thái viết dở). Nên: hook ghi vết
 * rẻ tiền, `ba-changelog` gom thành thay đổi trọn vẹn rồi mới phân tích.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const QUEUE = path.join('.claude', 'spec-changes.jsonl');

// Bộ đếm theo luật (dùng chung `ghiThốngKê` của hook-gate.js — xem đầu file đó). Ghi ở 'exit' để mọi
// đường ra đều được tính; thiếu hook-gate.js (bản cài cũ) hay ghi hỏng → im.
const LẦN_NÀY = {};
let cóViệc = false;
const đánhDấu = (mã, loại) => { (LẦN_NÀY[mã] || (LẦN_NÀY[mã] = {}))[loại] = true; };
const TRACKING = path.join('docs', '00-tracking.md');
const sha = (s) => require('crypto').createHash('sha256').update(s).digest('hex').slice(0, 16);

/** Mã màn rút từ folder (`…/S03 - TaskDetail` → `S03`). Ô "Màn hình" của tracking là TÊN, không phải mã. */
function mãMàn(folder) {
  const đoạn = String(folder || '').split(/[\/\\]/).reverse();
  for (const x of đoạn) { const m = x.match(/^(S\d{2,3})\b/); if (m) return m[1]; }
  return (String(folder || '').match(/\bS\d{2,3}\b/) || [''])[0];
}

/**
 * Màn nào đang ✅ Hoàn thành → folder của nó là "vùng baseline" cần ghi vết.
 * Đọc 00-tracking.md, tìm cột "Folder" + "Trạng thái" theo HEADER (không hardcode chỉ số cột —
 * ma trận từng có thêm cột `checklist`/`e2e`/`dev`, hardcode là gãy sau mỗi lần thêm cột).
 * @returns {Array<{folder:string, screen:string}>}
 */
function baselineFolders(nội) {
  if (typeof nội !== 'string') { if (!fs.existsSync(TRACKING)) return []; nội = fs.readFileSync(TRACKING, 'utf8'); }
  const lines = nội.split('\n').filter(l => l.trim().startsWith('|'));
  if (lines.length < 2) return [];
  const cells = (l) => l.split('|').slice(1, -1).map(c => c.trim());
  const head = cells(lines[0]);
  const iFolder = head.findIndex(h => /^folder$/i.test(h));
  const iStatus = head.findIndex(h => /^trạng thái$/i.test(h));
  const iScreen = head.findIndex(h => /^màn hình$/i.test(h));
  if (iFolder < 0 || iStatus < 0) return [];
  const out = [];
  for (const l of lines.slice(2)) {           // bỏ header + dòng phân cách
    const c = cells(l);
    if (c.length <= Math.max(iFolder, iStatus)) continue;
    if (!/hoàn thành/i.test(c[iStatus])) continue;
    const folder = c[iFolder].replace(/`/g, '').replace(/\/+$/, '').trim();
    if (folder) out.push({ folder, screen: iScreen >= 0 ? c[iScreen] : '', code: mãMàn(folder) });
  }
  return out;
}

/**
 * Độ lớn thay đổi từ git (chỉ để ước lượng — KHÔNG chép nội dung diff vào hàng đợi).
 * Trả `{added, removed, note}`; `note` phân biệt ba ca mà numstat rỗng gộp chung làm một:
 * chưa vào git · file mới (untracked) · không khác HEAD. Gộp chung thì `ba-changelog`
 * không biết nên gọi observer hay bỏ qua.
 */
function gitDelta(fp, base) {
  const d = spawnSync('git', ['diff', '--numstat', ...(base ? [base] : []), '--', fp], { encoding: 'utf8' });
  if (d.status !== 0) return { added: null, removed: null, note: 'khong-phai-git-repo' };
  const line = d.stdout.trim().split('\n')[0];
  if (line) {
    const [added, removed] = line.split('\t');
    return { added: Number(added) || 0, removed: Number(removed) || 0, note: null };
  }
  // numstat rỗng → hoặc file mới chưa track, hoặc nội dung y hệt HEAD. Chỉ tốn thêm 1 lần
  // spawn ở nhánh hiếm này, ca thường (file vừa sửa) vẫn đúng 1 lần spawn.
  const s = spawnSync('git', ['status', '--porcelain', '--untracked-files=all', '--', fp], { encoding: 'utf8' });
  const st = (s.stdout || '').trim();
  if (st.startsWith('??')) {
    let lines = 0;
    try { lines = fs.readFileSync(fp, 'utf8').split('\n').length; } catch { /* ignore */ }
    return { added: lines, removed: 0, note: 'file-moi-chua-track' };
  }
  return { added: 0, removed: 0, note: 'khong-khac-HEAD' };
}

/**
 * Append 1 dòng JSONL cho mỗi lần ghi file thuộc màn đã chốt.
 * Ghi FACT thô thôi (file · màn · độ lớn) — mọi phán xét nghiệp vụ (tác động, có cần CR
 * không, mâu thuẫn với doc nào) là việc của `ba-changelog` + agent `ba-change-observer`.
 */
function recordSpecChange(rel, fp, opts = {}) {
  if (!/^docs[\/\\].*\.md$/.test(rel)) return null;
  if (path.basename(rel).startsWith('00-')) return null;    // sổ/ma trận cấp dự án — không tự soi chính mình
  // Hồ sơ `lite` tắt nhật ký thay đổi (conventions → "Hồ sơ dự án"). TRƯỚC 07/10 hàm return luôn ở đây ⇒ S2 (cổng CR,
  // chạy ở MỌI hồ sơ) mù theo — hook-review 07/10/2026. Nay vẫn ghi, gắn `changelog:false` để ba-changelog bỏ qua.
  let changelogTắt = false;
  try { changelogTắt = !!require('./profile.js').off('docs').changelog; } catch { /* chưa có profile.js → full */ }
  const relPosix = rel.split(path.sep).join('/');
  const ds = opts.folders || baselineFolders();
  const hit = ds.find(b => relPosix.startsWith(b.folder.split(path.sep).join('/') + '/'));
  if (!hit) return null;                                     // màn chưa chốt → chưa phải baseline, bỏ qua
  đánhDấu('CW', 'goi');
  const cóFile = fs.existsSync(fp);
  const base = opts.base || null;                            // null = HEAD (đường Edit); Stop truyền mốc HEAD cũ khi HEAD đã dời
  const d = cóFile ? gitDelta(fp, base) : { added: 0, removed: null, note: 'file-bi-xoa' };
  if (d.note === 'khong-khac-HEAD') return null;             // ghi đè bằng nội dung y hệt → không phải thay đổi
  // ±dòng là tín hiệu SAI HẠNG: đo trên 14 commit của repo mẫu, commit 27 file/+240 dòng chạm
  // 0 ID nào, còn commit 3 file/+6 dòng lại đổi baseline. Nên hàng đợi ghi thêm ID nào bị chạm
  // và ở TRƯỜNG nào — `ba-changelog` lọc theo đó thay vì theo độ lớn diff.
  // Bọc try + chỉ so ĐÚNG file vừa ghi: hook chạy sau mỗi Edit/Write, quét cả docs/ là không thể.
  let sem = null, nộiHead = '';
  try { nộiHead = cóFile ? fs.readFileSync(fp, 'utf8') : ''; } catch { /* đọc hỏng → coi rỗng */ }
  try {
    const sd = require('./semdiff.js');
    // `git show <rev>:./<rel>` theo cwd — chạy được cả khi file đã bị XOÁ (semdiff.đọcTạiRev cần realpath file hiện có).
    const r = spawnSync('git', ['show', `${base || 'HEAD'}:./${relPosix}`], { encoding: 'utf8', maxBuffer: 1e8 });
    const nộiBase = r.status === 0 ? r.stdout : null;
    if (nộiBase !== null) {
      const so = sd.soSanhMotFile(nộiBase, nộiHead);
      sem = { ids: so.ids.map((x) => ({ id: x.id, trangThai: x.trangThai, truong: x.truong })), banGoNoiLai: so.banGoNoiLai };
    }
  } catch { đánhDấu('CW', 'hong'); /* thiếu semdiff.js (bản cài cũ) → giữ hành vi cũ, nhưng KHÔNG im: bộ đếm ghi hỏng */ }

  const rec = { ts: new Date().toISOString(), file: relPosix, screen: hit.screen, code: hit.code || mãMàn(hit.folder), folder: hit.folder, added: d.added, removed: d.removed, note: d.note, sha: cóFile ? sha(nộiHead) : 'xoa' };
  if (opts.nguon) rec.nguon = opts.nguon;
  if (changelogTắt) rec.changelog = false;
  if (sem) {
    rec.idsChanged = sem.ids;
    rec.soIdChanged = sem.ids.length;
    if (sem.banGoNoiLai) rec.banGoNoiLai = true;
  }
  if (opts.ghi === false) return rec;                        // `hook-gate --check`: chỉ xem, không ghi
  fs.mkdirSync(path.dirname(QUEUE), { recursive: true });
  fs.appendFileSync(QUEUE, JSON.stringify(rec) + '\n', 'utf8');
  đánhDấu('CW', 'ban');                                      // "bắn" của CW = đã đẩy một bản ghi vào hàng đợi
  return rec;
}

/*
 * H5 — THAY CODE BẰNG BÌNH LUẬN.
 *
 * Kiểu gian lận mà test xanh không thấy: xoá phần hiện thực rồi để lại `// TODO: implement`.
 * Bài này lấy từ claudekit, và nó hợp với toolkit vì đúng lớp lỗi #6 của bảng bằng chứng —
 * khai "đạt" cho thứ chưa hề chạy. Chỉ `Edit` mới có đủ dữ liệu (cả old_string lẫn new_string).
 *
 * Ngưỡng CỐ Ý CHẶT để khỏi kêu oan: cũ phải có >=3 dòng KHÔNG phải bình luận, mới phải còn <=2
 * dòng và TOÀN LÀ bình luận. Xoá code để dọn (không để lại gì) không dính; rút gọn code cũng
 * không dính. Chỉ đúng ca "code biến thành lời hứa".
 */
// Mẫu STUB (hook-review 07/10/2026): bản cũ chỉ bắt "code → toàn bình luận"; `throw new Error('not implemented')`,
// `pass`, `return null` kèm `// TODO` là cùng lời hứa suông nhưng KHÔNG phải bình luận ⇒ lọt.
const STUB_CHẮC = /\b(throw\s+new\s+\w*Error\s*\(\s*['"`][^'"`]*not\s+implemented|throw\s+new\s+NotImplemented\w*|raise\s+NotImplementedError|unimplemented!|todo!\s*\()|^\s*pass\s*$/im;
const STUB_TRẢ_RỖNG = /^\s*return(\s+(true|false|null|undefined|None|\[\s*\]|\{\s*\}|""|''|0))?\s*;?\s*$/im;
const CÓ_TODO = /\b(TODO|FIXME|XXX)\b/;
function H5(oldStr, newStr) {
  if (!oldStr || typeof newStr !== 'string') return null;
  const LÀ_BÌNH_LUẬN = /^\s*(\/\/|#|\/\*|\*|--|<!--)/;
  const dòngThật = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean);
  const cũ = dòngThật(oldStr);
  const mới = dòngThật(newStr);
  const cũCode = cũ.filter((l) => !LÀ_BÌNH_LUẬN.test(l));
  if (cũCode.length < 3) return null;
  if (!mới.length) return null;
  if (mới.length <= 2 && mới.every((l) => LÀ_BÌNH_LUẬN.test(l))) {
    return `${cũCode.length} dòng code vừa bị thay bằng ${mới.length} dòng bình luận: "${mới[0].slice(0, 70)}"`;
  }
  // Stub: phần mới NGẮN (≤4 dòng code) mà thân là throw-not-implemented/pass, hoặc return rỗng ĐI KÈM TODO.
  const mớiCode = mới.filter((l) => !LÀ_BÌNH_LUẬN.test(l));
  if (mớiCode.length > 4 || mớiCode.length >= cũCode.length) return null;
  const thân = mới.join('\n');
  if (STUB_CHẮC.test(thân) || (CÓ_TODO.test(thân) && STUB_TRẢ_RỖNG.test(thân))) {
    const dòng = mới.find((l) => STUB_CHẮC.test(l) || STUB_TRẢ_RỖNG.test(l)) || mới[0];
    return `${cũCode.length} dòng code vừa bị thay bằng STUB ${mớiCode.length} dòng: "${dòng.slice(0, 70)}"`;
  }
  return null;
}

module.exports = { recordSpecChange, baselineFolders, mãMàn, H5, QUEUE };

if (require.main === module) {
process.on('exit', () => { try { require('./hook-gate.js').ghiThốngKê('hook-lint', cóViệc, LẦN_NÀY); } catch { /* bộ đếm là phụ */ } });
let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let fp = '';
  let ti = {};
  try { const j = JSON.parse(raw); ti = j.tool_input || {}; fp = ti.file_path || ti.notebook_path || ''; } catch { /* stdin không phải JSON → bỏ qua */ }

  // H5 chạy cho MỌI file (code lẫn tài liệu), trước các nhánh phân loại theo đường dẫn.
  // `Write` không có old_string: file code ĐÃ TRACK thì lấy bản HEAD làm "cũ" (hook-review 07/10/2026 — trước đó Write cả
  // file thành `// TODO` lọt hoàn toàn). Chỉ file ngoài docs/.claude, chỉ khi git show được: một spawn, chỉ ở nhánh Write.
  let cũ = ti.old_string, mới = ti.new_string;
  if (!cũ && typeof ti.content === 'string' && fp) {
    const r0 = path.relative(process.cwd().normalize('NFC'), fp.normalize('NFC')).split(path.sep).join('/');
    if (r0 && !r0.startsWith('..') && !/^(docs|\.claude)\//.test(r0) && !/\.md$/i.test(r0)) {
      try {
        const g = spawnSync('git', ['show', `HEAD:./${r0}`], { encoding: 'utf8', maxBuffer: 1e7, timeout: 3000 });
        if (g.status === 0) { cũ = g.stdout; mới = ti.content; }
      } catch { đánhDấu('H5', 'hong'); }
    }
  }
  if (cũ) { cóViệc = true; đánhDấu('H5', 'goi'); }
  const h5 = H5(cũ, mới);
  if (h5) {
    đánhDấu('H5', 'ban');
    process.stderr.write('[Veriline · code bị thay bằng chú thích] ' + h5 + ' (H5)\n'
      + '  Nếu đây là bỏ tính năng thì xoá hẳn; nếu là việc chưa làm xong thì ĐỪNG báo hoàn thành\n'
      + '  và mở một Work Item (`ba-task`) cho phần còn thiếu.\n');
    process.exit(2);
  }
  if (!fp) process.exit(0);
  // macOS: đường dẫn có dấu tiếng Việt về 2 dạng unicode (NFC/NFD) tùy nguồn → normalize trước khi so
  const rel = path.relative(process.cwd().normalize('NFC'), fp.normalize('NFC'));
  if (rel.startsWith('..')) process.exit(0); // ngoài project
  const SK = path.join('.claude', 'skills');

  // 0) Ghi vết thay đổi tài liệu ĐÃ CHỐT vào hàng đợi (không chặn, lỗi thì im lặng bỏ qua —
  //    hàng đợi hỏng KHÔNG được phép làm hỏng luồng làm việc của người dùng).
  try { recordSpecChange(rel, fp); } catch { đánhDấu('CW', 'hong'); /* không chặn luồng, nhưng bộ đếm phải thấy */ }

  // 1) Doc BA vừa sửa → H1/H2 (cơ giới, trong tiến trình) + lint Mermaid (~30ms).
  //    GOM cảnh báo rồi báo MỘT LẦN: tách hai lần exit 2 thì lượt này chỉ thấy một nửa vấn đề,
  //    nửa còn lại phải chờ tới lần Edit sau mới lộ.
  if (/^docs[\/\\].*\.md$/.test(rel) && fs.existsSync(fp)) {
    cóViệc = true;
    const msg = [];

    // H1 bảng gãy · H2 roll-up lệch — xem `check-md.js` để biết vì sao chỉ có hai phép kiểm này.
    // require() thay vì spawn: phải dưới 50ms cho MỖI lần Edit.
    try {
      const { kiểm } = require('./check-md.js');
      const ra = kiểm(fp);
      for (const m of ['H1', 'H2', 'H3']) đánhDấu(m, 'goi');
      for (const x of ra) if (x && x.mã) đánhDấu(String(x.mã), 'ban');
      if (ra.length) {
        msg.push('[Veriline · bảng/sơ đồ markdown hỏng] ' + ra.length + ' chỗ máy phát hiện trong ' + rel + ' (mã đầu mỗi dòng):');
        for (const x of ra) msg.push(`  ${x.mã} · dòng ${x.dòng}: ${x.thông}`);
        msg.push('  Sửa: chữa đúng dòng được nêu; cố ý thì miễn trừ tại chỗ: <!-- ba-hook: bỏ H1 · lý do --> — bắt buộc ghi lý do.');
      }
    } catch { đánhDấu('H1', 'hong'); /* thiếu/hỏng check-md.js → không làm hỏng luồng, nhưng bộ đếm ghi HỎNG (hook-review 07/10/2026) */ }

    // Mermaid: GỢI Ý MỀM (xem đầu file). Không tự nó gây exit 2; nếu lượt này đã exit 2 vì H1–H3 thì
    // đi kèm cùng thông điệp, còn không thì trả qua `additionalContext` với exit 0.
    let mềm = '';
    if (/```mermaid/.test(fs.readFileSync(fp, 'utf8')) && fs.existsSync(path.join(SK, 'ba-portal', 'scripts', 'build.js'))) {
      đánhDấu('MER', 'goi');
      // timeout 5 s (hook-review 07/10/2026): treo ở đây là treo cả lượt của người dùng.
      const r = spawnSync(process.execPath, [path.join(SK, 'ba-portal', 'scripts', 'build.js'), '--lint', fp], { encoding: 'utf8', timeout: 5000 });
      if (r.error || r.status === null) đánhDấu('MER', 'hong');
      else if (r.status) {
        đánhDấu('MER', 'ban');
        mềm = '[Veriline · gợi ý sơ đồ Mermaid] chỉ là gợi ý, KHÔNG phải lỗi — vẽ thật mới là chuẩn; sai thì bỏ qua (MER):\n' + (r.stderr || r.stdout || '').trim();
      }
    }

    if (msg.length) { process.stderr.write(msg.concat(mềm ? [mềm] : []).join('\n') + '\n'); process.exit(2); }
    if (mềm) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: mềm } }) + '\n');
    process.exit(0);
  }

  // 2) Sửa skill/agent/CLAUDE.md trong REPO TOOLKIT → tự kiểm lint.js
  if ((/^\.claude[\/\\](skills|agents)[\/\\]/.test(rel) || /^(\.claude[\/\\])?CLAUDE\.md$/.test(rel)) && fs.existsSync(path.join('example', 'docs', '00-tracking.md')) && fs.existsSync(path.join(SK, 'ba-toolkit', 'scripts', 'lint.js'))) {
    cóViệc = true; đánhDấu('LINT', 'goi');
    const r = spawnSync(process.execPath, [path.join(SK, 'ba-toolkit', 'scripts', 'lint.js')], { encoding: 'utf8' });
    if (r.status) {
      đánhDấu('LINT', 'ban');
      const out = (r.stdout || '').split('\n').filter(l => l.includes('❌') || l.includes('KẾT QUẢ')).join('\n');
      process.stderr.write('[Veriline · toolkit lệch quy ước] lint.js báo lỗi sau khi sửa ' + rel + ' — sửa: chạy lại `node .claude/skills/ba-toolkit/scripts/lint.js` tới khi 0 lỗi (LINT):\n' + out + '\n');
      process.exit(2);
    }
  }
  process.exit(0);
});
}
