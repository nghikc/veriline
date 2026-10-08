#!/usr/bin/env node
/*
 * ba-toolkit/hook-gate.js — hook `Stop`: soát KỶ LUẬT ở cuối lượt, một lần cho cả lô.
 *
 * Khác `hook-lint.js` (chạy sau MỖI Edit, soát MỘT file): hook này chạy khi lượt kết thúc, nên
 * nhìn được thứ mà từng lần Edit không nhìn được — *cả lượt vừa rồi đã làm gì với baseline*.
 *
 * S2 — BASELINE ĐỔI MÀ SỔ CR KHÔNG ĐỘNG.
 *   Đây là kỷ luật số một của toolkit ("đổi thứ đã chốt → mở CR trước khi sửa", conventions.md)
 *   và tới nay nó HOÀN TOÀN TỰ NGUYỆN: không có gì kiểm, chỉ có một câu trong tài liệu mà người
 *   đọc là một model. Nguyên liệu thì đã nằm sẵn từ 03/09/2026 — `hook-lint.js` ghi
 *   `idsChanged: [{id, trangThai, truong}]` vào `.claude/spec-changes.jsonl` qua `semdiff.js`.
 *   S2 chỉ việc đọc hàng đợi đó rồi đối chiếu sổ. Gần như không có logic mới, mà lại là chốt
 *   quan trọng nhất — nên nó đi ở đợt 1 chứ không phải đợt 2.
 *
 * ─── Bốn chốt bắt buộc, thiếu cái nào cũng thành phiền nhiễu ────────────────────────────────
 *  1. `stop_hook_active` — Claude Code truyền cờ này CHÍNH VÌ hook Stop có thể làm agent chạy
 *     tiếp rồi lại kích Stop. Không đọc cờ là tự tạo vòng lặp.
 *  2. Cổng rẻ ở dòng đầu — lượt chỉ trò chuyện, không ghi file nào, phải `exit 0` trước khi đọc
 *     bất cứ thứ gì. Hook Stop nổ ở MỌI lượt, kể cả lượt không đụng `docs/`.
 *  3. Hồ sơ dự án — `lite`/`mini` tắt bớt cơ chế cho nhẹ; hook cưỡng chế mà không đọc hồ sơ thì
 *     người chọn `lite` cho nhẹ lại bị nặng hơn, và họ sẽ tắt cả hook. S2 chạy ở MỌI hồ sơ vì
 *     nó là truy vết, không phải lớp quản trị — nhưng chốt này phải có sẵn cho phép kiểm sau.
 *  4. Nhắc MỘT LẦN mỗi đợt, không nhắc mỗi lượt — mốc lưu ở `.claude/ba-hook-gate.json`. Một
 *     cảnh báo lặp lại ở mọi lượt là cách nhanh nhất để người ta học cách bỏ qua nó.
 *
 * `exit 2` = cảnh báo trả cho agent, KHÔNG chặn. Toolkit không chặn cứng bằng heuristic.
 *
 * BỘ ĐẾM THEO LUẬT (25/09/2026). Soát 3 dự án thật (helpdesk · desktop · e-learning): S1–S6 và H1–H5
 * KHÔNG để lại dấu vết nào — không phân biệt được "hook chạy mà không có việc" với "hook không chạy /
 * hàng đợi không bao giờ được đẩy". Không đo thì không cắt được, mà cũng không giữ được có lý do.
 * Nên mỗi lần hook chạy thật (stdin, không phải `--check`) ghi vào `.claude/ba-hook-stats.json`:
 * hook được gọi mấy lần / mấy lần có việc, và mỗi luật được GỌI · BẮN · HỎNG mấy lần, lần cuối khi nào.
 * `hook-lint.js` và `hook-guard.js` dùng chung `ghiThốngKê()` ở đây. Ghi MỘT lần lúc tiến trình
 * thoát, file tạm + rename (không bao giờ để lại JSON viết dở); hỏng ghi thì im — bộ đếm là phụ.
 *
 * S6 (TODO mới cuối lượt) ĐÃ BỎ 25/09/2026 — trùng `ac-judge/scan-bypasses` loại `todo-new`, vốn chạy
 * đúng chỗ (review diff) thay vì mỗi lượt. `{"S6": …}` cũ trong `.claude/ba-hooks.json` bị bỏ qua.
 *
 * GÓI G (hook-review 07/10/2026) — xem khối "ĐỐI SOÁT" trước hàm `chạy()`. Luật mới: SR (đối soát git, ghi bản ghi qua
 * recordSpecChange của hook-lint) · SQ (hàng đợi bị cắt/sửa) · SN (màn vừa chuyển dev ✅ thiếu dòng NHẬN trong ac-accept.jsonl)
 * · SI (integrity.js báo toolkit lệch nguồn; vắng script → im). S2 ghi nợ `.claude/ba-hook-debt.json`. S5 nhận exit 1 của
 * check-tc-layer là KẾT QUẢ và báo `chuaKiem`. S3 (khi bật) chạy theo code ngoài docs đổi, không cần hàng đợi.
 * Chi phí Stop đo trên bản sao example (median 25 lần, máy dev 07/10/2026): cũ ~90–100 ms · mới ~125–140 ms (thêm một
 * `git status`); lượt có thay đổi docs MỚI tốn thêm `git show` tracking + ledger.js như trước.
 *
 * Dùng (Claude Code tự gọi):  echo '<json>' | node hook-gate.js
 * Thủ công để soát:           node hook-gate.js --check
 * Đọc bộ đếm:                 node hook-gate.js --stats [<gốc dự án> …] [--json]
 *
 * gioiHan (bộ đếm): đọc-sửa-ghi không khoá — hai hook chạy ĐỒNG THỜI (tool song song → PreToolUse
 * song song) có thể mất một lần đếm của nhau; số là xấp xỉ dưới, đủ cho câu hỏi "có bao giờ bắn
 * không", không đủ để đếm chính xác. Chỉ ghi khi `.claude/` đã có ở thư mục chạy. `--check` không đếm.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const QUEUE = path.join('.claude', 'spec-changes.jsonl');
const MỐC = path.join('.claude', 'ba-hook-gate.json');
const THỐNG_KÊ = path.join('.claude', 'ba-hook-stats.json');

// Luật mỗi hook khai — để `--stats` in cả luật CHƯA GỌI LẦN NÀO (dòng 0 mới là dòng đáng đọc nhất).
// `MER` = lint Mermaid heuristic · `CW` = change-watch ghi hàng đợi · `LINT` = lint.js trong repo toolkit.
const LUẬT_CỦA_HOOK = {
  // SR đối soát git · SQ hàng đợi bị cắt/sửa · SN dev ✅ thiếu NHẬN · SI toolkit lệch nguồn (hook-review 07/10/2026)
  'hook-gate': ['S1', 'S2', 'S3', 'S4', 'S5', 'S8', 'SR', 'SQ', 'SN', 'SI'],
  'hook-lint': ['CW', 'H1', 'H2', 'H3', 'H5', 'MER', 'LINT'],
  'hook-guard': ['FG'],
  'hook-session': ['S9a', 'S9b'],   // W7 06/10/2026 — khoá mềm giữa các phiên (SessionStart + UserPromptSubmit)
};

/*
 * Ghi một lần chạy của hook vào bộ đếm. `luật` = { mã: { goi?, ban?, hong? } } (cờ boolean của LẦN NÀY).
 * Không bao giờ ném lỗi — hook chết vì bộ đếm là tệ hơn không có bộ đếm.
 */
function ghiThốngKê(hook, cóViệc, luật, tệp) {
  const f = tệp || THỐNG_KÊ;
  let tạm = null;
  try {
    if (process.env.BA_HOOK_STATS === '0') return;
    if (!fs.existsSync(path.dirname(f))) return;              // không có `.claude/` → không phải chỗ của mình
    let s = {};
    try { s = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { s = {}; }
    if (!s || typeof s !== 'object' || Array.isArray(s)) s = {};
    const nay = new Date().toISOString();
    s._ = 'Bộ đếm hook ba-toolkit (runtime, không commit). Đọc: node .claude/skills/ba-toolkit/scripts/hook-gate.js --stats';
    if (!s.batDau) s.batDau = nay;
    if (!s.hook || typeof s.hook !== 'object') s.hook = {};
    if (!s.luat || typeof s.luat !== 'object') s.luat = {};
    const h = s.hook[hook] || (s.hook[hook] = { goi: 0, coViec: 0 });
    h.goi = (h.goi || 0) + 1; h.goiCuoi = nay;
    if (cóViệc) { h.coViec = (h.coViec || 0) + 1; h.coViecCuoi = nay; }
    for (const [mã, cờ] of Object.entries(luật || {})) {
      const x = s.luat[mã] || (s.luat[mã] = { hook, goi: 0, ban: 0 });
      for (const k of ['goi', 'ban', 'hong']) if (cờ && cờ[k]) { x[k] = (x[k] || 0) + 1; x[k + 'Cuoi'] = nay; }
    }
    tạm = `${f}.${process.pid}.tmp`;
    fs.writeFileSync(tạm, JSON.stringify(s, null, 1) + '\n', 'utf8');
    fs.renameSync(tạm, f);                                    // rename nguyên tử: người đọc không thấy JSON viết dở
    tạm = null;
  } catch { /* hỏng ghi → im; bộ đếm là phụ, luồng người dùng là chính */ }
  finally { if (tạm) { try { fs.rmSync(tạm, { force: true }); } catch { /* thôi */ } } }
}

// Cờ của lần chạy này (chế độ hook). `đánhDấu('S4', 'hong')`.
const LẦN_NÀY = {};
function đánhDấu(mã, loại) { (LẦN_NÀY[mã] || (LẦN_NÀY[mã] = {}))[loại] = true; }

// Trường mang tính SỔ SÁCH, đổi chúng không phải đổi baseline (CLAUDE.md: "a changed `Trace` is
// bookkeeping, a changed `Quy tắc` is a baseline change"). Mọi trường khác coi là baseline.
const SỔ_SÁCH = /^(trace|trạng thái|ghi chú|cập nhật|nguồn|mã|id)$/i;

// Trả cả DÒNG THÔ (đếm offset + sha mốc) lẫn bản ghi đã parse (null ở dòng hỏng — giữ chỉ số khớp offset).
function đọcHàngĐợi() {
  let raw = '';
  try { raw = fs.readFileSync(QUEUE, 'utf8'); } catch { return { dòng: [], recs: [] }; }
  const dòng = raw.split('\n').filter((l) => l.trim());
  const recs = dòng.map((l) => { try { return JSON.parse(l); } catch { return null; } });   // dòng hỏng: bỏ, không làm hỏng luồng
  return { dòng, recs };
}

function đọcMốc() {
  try { return JSON.parse(fs.readFileSync(MỐC, 'utf8')); } catch { return {}; }
}
function ghiMốc(m) {
  try { fs.mkdirSync(path.dirname(MỐC), { recursive: true }); fs.writeFileSync(MỐC, JSON.stringify(m, null, 2) + '\n', 'utf8'); }
  catch { /* ghi mốc hỏng thì lần sau nhắc lại — phiền, nhưng không được làm hỏng luồng */ }
}

/*
 * S1 — chạm tài liệu của một màn thì `00-tracking.md` phải đổi theo.
 *
 * Đo bằng CỘT "Cập nhật cuối" của chính màn đó, không bằng mtime file: mtime đổi cả khi sửa màn
 * khác, còn cột này nói đúng về MỘT màn. Luật nguồn: conventions.md → "Bổn phận khi động vào docs/".
 */
function S1(mới, mànChạm) {
  if (!mànChạm.length) return [];
  let tr = '';
  for (const p of [path.join('docs', '00-tracking.md'), path.join('docs', 'Ho-so', '00-tracking.md')]) {
    try { tr = fs.readFileSync(p, 'utf8'); break; } catch { /* thử chỗ kế */ }
  }
  if (!tr) return [];                                   // chưa có tracking → chưa tới lúc, im
  đánhDấu('S1', 'goi');
  const ngàyCủaMàn = {};
  for (const l of tr.split('\n')) {
    if (!/^\|/.test(l)) continue;
    const ô = l.replace(/\|\s*$/, '').split('|').map((x) => x.trim());
    const mã = (l.match(/\bS\d{2,3}\b/) || [])[0];
    if (!mã) continue;
    const d = (ô[ô.length - 1] || '').match(/\d{4}-\d{2}-\d{2}/);
    if (d) ngàyCủaMàn[mã] = d[0];
  }
  const trễ = [];
  for (const m of mànChạm) {
    // Khớp theo MÃ màn (hook-review 07/10/2026): bản ghi thật mang `screen` = TÊN ("TaskDetail"), so với mã thì không bao giờ trúng.
    const ngàySửa = (mới.filter((r) => r.loai !== 'ha-baseline' && mãCủa(r) === m).pop() || {}).ts || '';
    const ngàyTr = ngàyCủaMàn[m];
    if (!ngàyTr) continue;                              // màn chưa có dòng tracking → việc của ba-track
    if (ngàyTr < ngàySửa.slice(0, 10)) trễ.push(`${m} (tracking ghi ${ngàyTr}, tài liệu sửa ${ngàySửa.slice(0, 10)})`);
  }
  if (!trễ.length) return [];
  đánhDấu('S1', 'ban');
  return [`[ba-toolkit hook · S1] ${trễ.length} màn vừa sửa tài liệu mà "Cập nhật cuối" trong \`00-tracking.md\` chưa đổi:`,
    ...trễ.map((x) => '  · ' + x),
    '  Sửa tài liệu của một màn thì cập nhật ô tương ứng + "Cập nhật cuối" (conventions.md → "Bổn phận khi động vào docs/").',
    '  Cách nhanh: `node .claude/skills/ba-track/scripts/refresh.js docs`.'];
}

/*
 * Đợt 3 — GỌI checker đã có, không viết lại.
 *
 * Đây là luật chọn quan trọng nhất của cả đợt cưỡng chế: `ba-trace/scan.js` đã tính ref gãy và
 * `check-tc-layer.js` đã bắt "TC xanh giả" (đo lúc nó ra đời: 21/43 TC là xanh giả). Viết lại
 * chúng trong hook là nhân đôi nơi giữ luật — đúng thứ `lint.js` sinh ra để chống. Hook chỉ
 * chạy chúng SỚM HƠN và LỌC THEO MÀN vừa chạm, để cảnh báo dính vào việc đang làm.
 *
 * Cả hai đo dưới 0,2s trên dự án mẫu. Chỉ lấy phát hiện thuộc màn vừa chạm; nợ cũ ở màn khác
 * KHÔNG nhắc — hook chỉ nói về việc người dùng vừa làm, không điểm danh cả dự án (đó là ba-review).
 */
function gọiChecker(mànChạm) {
  if (!mànChạm.length) return [];
  // Checker CHẾT ≠ checker SẠCH (steal B12). Bản cũ bọc cả khối trong try/catch rồi trả `null`:
  // crash (exit≠0, stdout rỗng), timeout 15s, hay JSON vỡ đều ra cùng một thứ với "không phát hiện
  // gì" — cổng im lặng tưởng đã kiểm. Đó đúng là lớp lỗi mà `test.js` nhóm ĐỐI KHÁNG sinh ra để
  // chống, chỉ khác là ở đây nó xảy ra lúc chạy thật. Nay hỏng thì KÊU, và không nhận là đã kiểm.
  const hỏng = [];
  // hook-review 07/10/2026: (1) check-tc-layer exit 1 KHI CÓ xanh giả — bản cũ coi exit≠0 là hỏng ⇒ S5 không bao giờ bắn,
  // chỉ in "KHÔNG KIỂM ĐƯỢC". Nay mỗi checker khai TẬP EXIT HỢP LỆ; exit trong tập + JSON đủ trường = KẾT QUẢ.
  // (2) JSON thiếu trường bắt buộc = hỏng (trước: im như sạch). (3) Script vắng mà folder skill có mặt = hỏng (bản cài gãy).
  const chạyJSON = (skill, script, mã, hợpLệ, bắtBuộc) => {
    const dSkill = path.join('.claude', 'skills', skill);
    const f = path.join(dSkill, 'scripts', script);
    if (!fs.existsSync(f)) {
      if (fs.existsSync(dSkill)) { đánhDấu(mã, 'goi'); hỏng.push(`${skill}/${script} VẮNG trong khi skill ${skill} có mặt (bản cài gãy?)`); đánhDấu(mã, 'hong'); }
      return null;                         // chưa cài skill đó → im, không phải lỗi
    }
    đánhDấu(mã, 'goi');
    const r = spawnSync(process.execPath, [f, 'docs'], { encoding: 'utf8', maxBuffer: 1e8, timeout: 15000 });
    const vìSao = r.error && r.error.code === 'ETIMEDOUT' ? 'quá 15s (timeout)'
      : r.error ? `không chạy được: ${r.error.message}`
      : !hợpLệ.includes(r.status) ? `exit ${r.status}${(r.stderr || '').trim() ? ' — ' + (r.stderr || '').trim().split('\n')[0].slice(0, 120) : ''}`
      : null;
    if (vìSao) { hỏng.push(`${skill}/${script} ${vìSao}`); đánhDấu(mã, 'hong'); return null; }
    let j;
    try { j = JSON.parse(r.stdout); }
    catch { hỏng.push(`${skill}/${script} in ra thứ không phải JSON (${(r.stdout || '').trim().slice(0, 60) || 'rỗng'}…)`); đánhDấu(mã, 'hong'); return null; }
    const thiếu = bắtBuộc.filter((k) => !j || !Array.isArray(j[k]));
    if (thiếu.length) { hỏng.push(`${skill}/${script} JSON thiếu trường ${thiếu.join(', ')}`); đánhDấu(mã, 'hong'); return null; }
    return j;
  };
  const thuộcMàn = (s) => { const t = JSON.stringify(s); return mànChạm.some((m) => new RegExp(`\\b${m}\\b`).test(t)); };
  const ra = [];

  // S4 — ref gãy (mã trỏ tới thứ không tồn tại) ở màn vừa chạm.
  const tr = chạyJSON('ba-trace', 'scan.js', 'S4', [0, 1], ['brokenRefs']);
  if (tr && Array.isArray(tr.brokenRefs)) {
    const gãy = tr.brokenRefs.filter((b) => thuộcMàn(JSON.stringify(b)));
    if (gãy.length) đánhDấu('S4', 'ban');
    if (gãy.length) ra.push(`[ba-toolkit hook · S4] ${gãy.length} tham chiếu gãy ở màn vừa sửa (ba-trace): `
      + gãy.slice(0, 6).map((b) => `${b.id || b.từ || '?'} → ${b.ref || '?'}`).join(' · ')
      + (gãy.length > 6 ? ` … còn ${gãy.length - 6}` : ''));
  }

  // S5 — TC XANH GIẢ: TC khai đạt nhưng test nằm sai tầng so với điều TC mô tả.
  // CHỈ lấy `xanhGia`. Cố ý bỏ `chuaCoTest`: dự án chỉ có tài liệu (chưa code) thì mọi TC đều
  // "chưa có test" — nhắc chuyện đó ở mỗi lượt là nhiễu thuần tuý, và đó là việc của ba-conformance.
  const tc = chạyJSON('ba-conformance', 'check-tc-layer.js', 'S5', [0, 1], ['xanhGia']);   // exit 1 = CÓ xanh giả (kết quả)
  if (tc && Array.isArray(tc.xanhGia)) {
    const xg = tc.xanhGia.filter((x) => thuộcMàn(JSON.stringify(x)));
    if (xg.length) đánhDấu('S5', 'ban');
    if (xg.length) ra.push(`[ba-toolkit hook · S5] ${xg.length} TC XANH GIẢ ở màn vừa sửa — test mang mã đó không kiểm ở tầng TC mô tả: `
      + xg.slice(0, 6).map((x) => (typeof x === 'string' ? x : x.tc || x.id || JSON.stringify(x))).join(' · ')
      + (xg.length > 6 ? ` … còn ${xg.length - 6}` : ''));
    // "Chưa kiểm" là kết quả riêng (giao diện 5): bảng TC không có cột Cách chạy → cổng mù ở màn đó, phải nói ra.
    const ck = Array.isArray(tc.chuaKiem) ? tc.chuaKiem.filter((x) => thuộcMàn(x)) : [];
    if (ck.length) ra.push(`[ba-toolkit hook · S5] CHƯA KIỂM ở màn vừa sửa — bảng TC không có cột \`Cách chạy\`, cổng tầng TC mù: `
      + ck.map((x) => `${x.man || '?'} (${x.soTC ?? '?'}/${x.tongTC ?? '?'} TC)`).join(' · ') + ' · bổ sung: `ba-screen-spec <màn> --bo-sung cach-chay`');
  }
  // Checker hỏng: nói ra ở đúng lượt đó. Không nâng thành "có phát hiện" (chưa biết có gì hay không) —
  // nhưng im lặng thì người đọc kết luận sai rằng S4/S5 đã chạy sạch.
  if (hỏng.length) ra.push(`[ba-toolkit hook · S4/S5] KHÔNG KIỂM ĐƯỢC — ${hỏng.join(' · ')}. `
    + `Cổng này chưa nói gì về màn ${mànChạm.join(', ')}: chạy tay checker đó rồi xem lại.`);
  return ra;
}

// Cấu hình bật/tắt: `.claude/ba-hooks.json` của dự án, thiếu thì lấy mặc định đóng gói kèm.
function cấuHình() {
  for (const p of [path.join('.claude', 'ba-hooks.json'), path.join(__dirname, '..', 'assets', 'hooks.config.json')]) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { /* thử chỗ kế */ }
  }
  return {};
}

/*
 * S3 — CHẠY GATE DEV THẬT.
 *
 * Đắt nhất trong bộ, MẶC ĐỊNH TẮT. Nó bắt lớp lỗi đắt nhất của bảng bằng chứng (#6): khai
 * "persist localStorage → đạt" trong khi hàm ghi không hề ghi — lộ ra sau SÁU commit.
 *
 * Khớp đẹp với thiết kế sẵn có: `dev-run` ĐÃ bắt ghi *lệnh test/lint/typecheck thực tế* của dự
 * án vào `docs/Ho-so/dev-notes.md` để lần sau khỏi hỏi lại. Hook chỉ đọc đúng file đó — không
 * đoán stack, không hardcode `npm test`.
 *
 * Giới hạn tự khai: nó chỉ chạy được lệnh mà `dev-notes.md` GHI RÕ trong dấu backtick. Dự án
 * viết lệnh bằng văn xuôi thì S3 im — và im là đúng, đoán lệnh để chạy là cách nhanh nhất phá
 * máy người dùng.
 */
/*
 * S8 — LƯỢT KHÔNG GỘP TOOL (thay S7 "phiên quá dài", 19/09/2026).
 *
 * S7 đo kích thước transcript, và nó đo SAI THỨ. Đo lại trên phiên 547bd253 (23,7 MB / 2.726 lượt):
 * TỔNG mọi kết quả tool của cả phiên chỉ 5,4 MB ~ 1,4 M token — trong khi phiên cùng dạng tốn 3,8 TỶ
 * token cache-read. Tỷ số ~1000x: chi phí không nằm ở CÁI TA ĐỌC mà ở SỐ LẦN ĐỌC LẠI cái đã đọc.
 * Thêm nữa 78% số byte ấy là ảnh base64 — thứ chỉ tốn ~2-3k token/ảnh sau khi API co về cạnh 1568 px.
 * Nên "24 MB" vừa không hành động được, vừa kêu vì một lý do gần như miễn phí.
 *
 * Thước mới: TOOL MỖI LƯỢT. Đo được 1,00 tool/lượt trên 1.493 lượt — 100% lượt gọi đúng MỘT tool, không
 * gộp lần nào. Ba lệnh độc lập chạy rời = ba lần nạp lại cả ngữ cảnh; gộp lại là một. Đây là đòn duy nhất
 * cắt được chi phí mà KHÔNG mất một byte ngữ cảnh nào — khác `/compact` và `/clear`, vốn cắt bằng cách bỏ.
 *
 * Đếm theo DÒNG, không parse JSON: mỗi lượt assistant là một dòng JSONL, nên số lần `"type":"tool_use"`
 * trong dòng đó chính là số tool của lượt. Rẻ, và không vỡ khi transcript có dòng 1 MB.
 *
 * Cảnh báo MỘT lần mỗi nấc 150 lượt (mốc `s8Nấc` trong .claude/ba-hook-gate.json). Tắt bằng
 * `{"S8": false}` trong .claude/ba-hooks.json (`{"S7": false}` cũ vẫn được tôn trọng).
 */
const S8_LƯỢT = 150, S8_TỶ_LỆ = 1.5, S8_BYTE_TỐI_THIỂU = 262144, S8_LƯỢT_PHIÊN = 300;
function S8(transcriptPath, mốc) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return { cảnhBáo: [], nấc: null };
  đánhDấu('S8', 'goi');
  let t = '';
  try {
    if (fs.statSync(transcriptPath).size < S8_BYTE_TỐI_THIỂU) return { cảnhBáo: [], nấc: null };
    t = fs.readFileSync(transcriptPath, 'latin1');
  } catch { return { cảnhBáo: [], nấc: null }; }

  // Mốc compact cuối: từ đó trở đi mới là ngữ cảnh đang thật sự bị nạp lại mỗi lượt.
  // Mốc compact thật = trường JSON của dòng hệ thống, KHÔNG phải chuỗi 'compact_boundary' xuất hiện trong nội dung tool
  // (19/09: phiên toolkit vừa sửa chính hook này → transcript chứa chữ đó trong input Bash → đếm "3 lượt kể từ compact").
  let mốcCompact = -1; for (const re of [/"subtype"\s*:\s*"compact_boundary"/g, /"isCompactSummary"\s*:\s*true/g]) { let m; while ((m = re.exec(t))) mốcCompact = Math.max(mốcCompact, m.index); }
  const làAssistant = /"type":\s*"assistant"/;
  const dùngTool = /"type":\s*"tool_use"/g;
  let lượtCóTool = 0, tổngTool = 0, lượtSauCompact = 0, vịTrí = 0;
  for (const dòng of t.split('\n')) {
    const đầu = vịTrí; vịTrí += dòng.length + 1;
    if (!làAssistant.test(dòng)) continue;
    if (đầu > mốcCompact) lượtSauCompact++;
    const n = (dòng.match(dùngTool) || []).length;
    if (n) { lượtCóTool++; tổngTool += n; }
  }
  // Hai tín hiệu độc lập, mỗi cái một nấc riêng (người dùng chốt 19/09: giữ vế SỐ LƯỢT của S7, chỉ bỏ vế MB):
  //   (a) tỷ lệ tool/lượt thấp → gộp lệnh (không mất ngữ cảnh);  (b) tổng lượt assistant > S8_LƯỢT_PHIÊN → mở phiên mới —
  //   phiên 2 000 lượt đã gộp 3 tool/lượt vẫn là 2 000 lần nạp ngữ cảnh (3,8 tỷ = 6 774 lượt × ngữ cảnh).
  const cảnhBáo = []; const nấc = { tỷLệ: null, lượt: null };
  const tỷLệ = lượtCóTool ? tổngTool / lượtCóTool : 0;
  if (lượtCóTool >= S8_LƯỢT && tỷLệ < S8_TỶ_LỆ) {
    nấc.tỷLệ = Math.floor(lượtCóTool / S8_LƯỢT);
    if (!(mốc && mốc.s8Nấc >= nấc.tỷLệ)) cảnhBáo.push(
      `[ba-toolkit hook · S8] ${tỷLệ.toFixed(2)} tool/lượt trên ${lượtCóTool} lượt gọi tool (${lượtSauCompact} lượt kể từ lần compact cuối) — tool độc lập đang chạy RỜI, mỗi lượt nạp lại cả ngữ cảnh.`,
    '  Gộp các lệnh không phụ thuộc nhau vào MỘT lượt; việc dò tìm (đọc nhiều file, đọc ảnh) phái subagent ngữ cảnh trắng. Đo 19/09/2026: nội dung cả phiên chỉ ~1,4 M token mà lặp lại thành 3,8 TỶ — xem `CLAUDE.md` → "Kỷ luật ngữ cảnh".');
  }
  if (lượtSauCompact >= S8_LƯỢT_PHIÊN) {
    nấc.lượt = Math.floor(lượtSauCompact / S8_LƯỢT_PHIÊN);
    if (!(mốc && mốc.s8LượtNấc >= nấc.lượt)) cảnhBáo.push(
      `[ba-toolkit hook · S8] phiên đã ~${lượtSauCompact} lượt kể từ lần compact cuối — mỗi lượt nạp lại cả ngữ cảnh (đo 17/09/2026: 6 774 lượt = 3,8 tỷ token cache-read).`,
      '  Trạng thái đã trên đĩa: mở phiên mới rồi `ba-next` (hoặc `ac-po resume` / `ac-po run.js` headless) — không mất gì.');
  }
  if (cảnhBáo.length) đánhDấu('S8', 'ban');
  return { nấc, cảnhBáo };
}

function S3() {
  let nội = '';
  for (const p of [path.join('docs', 'Ho-so', 'dev-notes.md'), path.join('docs', 'dev-notes.md')]) {
    try { nội = fs.readFileSync(p, 'utf8'); break; } catch { /* thử chỗ kế */ }
  }
  if (!nội) return [];
  const lệnh = [];
  for (const l of nội.split('\n')) {
    if (!/(test|lint|typecheck|type-check|tsc)/i.test(l)) continue;
    const m = /`([^`]{3,120})`/.exec(l);
    if (!m) continue;
    const c = m[1].trim();
    if (!/^(npm|pnpm|yarn|bun|npx|node|deno|make|cargo|go|python|pytest|vitest|jest)\b/.test(c)) continue;
    if (!lệnh.includes(c)) lệnh.push(c);
  }
  if (!lệnh.length) return [];
  đánhDấu('S3', 'goi');
  const đỏ = [];
  for (const c of lệnh.slice(0, 3)) {              // tối đa 3 lệnh, tránh treo cuối lượt
    try {
      const r = spawnSync(c, { shell: true, encoding: 'utf8', maxBuffer: 1e8, timeout: 180000 });
      if (r.status !== 0) đỏ.push(`\`${c}\` → exit ${r.status === null ? 'timeout' : r.status}`);
    } catch { /* không chạy được → không kết luận */ }
  }
  if (!đỏ.length) return [];
  đánhDấu('S3', 'ban');
  return [`[ba-toolkit hook · S3] gate dev ĐỎ (lệnh lấy từ \`dev-notes.md\`):`,
    ...đỏ.map((x) => '  · ' + x),
    '  Đừng đánh dấu hoàn thành khi gate còn đỏ — bằng chứng là output lệnh thật, không phải lời khai.'];
}

/*
 * ─── ĐỐI SOÁT (hook-review 07/10/2026, gói G) ─────────────────────────────────────────────────
 * Trước 07/10 Stop CHỈ tin hàng đợi `.claude/spec-changes.jsonl` — thứ do chính agent ghi được và chỉ được đẩy khi sửa
 * qua tool Edit/Write. Tái hiện trên bản sao example: `sed -i` đổi BRule của màn ✅ → im; sửa rồi `git commit` → im; hạ màn
 * khỏi "Hoàn thành" rồi sửa → im; mốc `lastTs: 2099` → im vĩnh viễn; thêm một dòng CR cụt không nhắc màn nào → im.
 * Nguyên tắc vá: cổng chỉ tin cái nó TỰ ĐO được — ở đây là git.
 *   · `git status` (MỘT spawn, porcelain v2 kèm HEAD) → file docs đổi so HEAD + file chưa track; HEAD dời so mốc thì thêm
 *     `git diff mốcHead..HEAD`. File thuộc folder baseline (hợp tracking HEAD + tracking hiện tại — hạ trạng thái không
 *     thoát được) mà chưa có bản ghi KHỚP SHA → ghi qua `recordSpecChange` của hook-lint (một định dạng, không nhân đôi:
 *     sửa qua Edit đã có bản ghi cùng sha thì bỏ qua).
 *   · `00-tracking.md`: màn rời "Hoàn thành", hồ sơ/phạm vi đổi → sự kiện `ha-baseline`, S2 xét như đổi baseline.
 *   · Mốc lưu offset (số dòng) + sha phần đã đọc của hàng đợi; hàng đợi ngắn đi / phần cũ bị sửa → SQ. `lastTs` ở tương lai
 *     (> giờ hiện tại + 5 phút) bị bỏ qua.
 *   · S2 chỉ coi là "đã mở CR" khi CR MỚI có dòng bảng đủ cột VÀ nhắc mã màn hoặc một ID vừa đổi. Chưa giải → nợ
 *     `.claude/ba-hook-debt.json` (status.js hiện như 🟠); nợ chỉ đóng khi có CR khớp hoặc file trở về bằng HEAD lúc mở nợ.
 *   · Không phải git → hành vi cũ (chỉ hàng đợi) + một dòng "không đối soát được".
 * gioiHan: đối soát chỉ thấy cái git thấy — `docs/` bị .gitignore, hay mốcHead đã mất sau rebase/gc (diff mốcHead..HEAD
 * hỏng → chỉ còn so HEAD), thì lọt. Agent ghi được cả mốc lẫn sổ nợ (xoá là xoá) — mốc hỏng/mất thì lượt sau đối soát lại
 * từ HEAD (an toàn về phía kêu), sổ nợ mất thì status.js không thấy nợ: lớp chặn thật là accept.js/integrity của gói A/I.
 */
const NỢ = path.join('.claude', 'ba-hook-debt.json');
const SỔ_NHẬN = path.join('.claude', 'ac-accept.jsonl');
const shaS = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const NĂM_PHÚT = 5 * 60 * 1000;
const MỐC_MIỄN_NHẬN = '2026-09-24';            // verification trước mốc này = trước khi có accept.js → miễn SN
// File runtime trong .claude/ do chính hook/agent ghi mỗi lượt — không tính là "đổi toolkit" hay "đổi code".
const RUNTIME = /^\.claude\/(spec-changes\.jsonl|ba-hook-[\w-]+\.json|ac-accept\.jsonl|ac-runs\/|ac-mission\.json|[^/]*\.tmp$)/;
const đọc = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nhắcTới = (text, x) => new RegExp(`(^|[^\\w-])${esc(x)}([^\\w-]|$)`).test(text);

/** `git status` một spawn: { head, files[] } (posix, gồm chưa track). null = không phải git repo / chưa có commit. */
function gitTrạngThái() {
  // Không có `.git` ở thư mục nào phía trên → khỏi spawn (git hỏng mất ~20 ms mỗi Stop ở dự án không git).
  let d = process.cwd(), cóGit = false;
  for (let i = 0; i < 64; i++) { if (fs.existsSync(path.join(d, '.git'))) { cóGit = true; break; } const p = path.dirname(d); if (p === d) break; d = p; }
  if (!cóGit) return null;
  const r = spawnSync('git', ['status', '--porcelain=v2', '-z', '--branch', '--untracked-files=all'], { encoding: 'utf8', maxBuffer: 1e8, timeout: 10000 });
  if (r.status !== 0 || r.error) return null;
  const f = r.stdout.split('\0'); let head = null; const files = [];
  for (let i = 0; i < f.length; i++) {
    const x = f[i]; if (!x) continue;
    if (x.startsWith('# branch.oid ')) { head = x.slice(13).trim(); continue; }
    if (x[0] === '#') continue;
    if (x[0] === '1') files.push(x.split(' ').slice(8).join(' '));
    else if (x[0] === '2') { files.push(x.split(' ').slice(9).join(' ')); i++; }   // rename: trường kế là tên cũ
    else if (x[0] === 'u') files.push(x.split(' ').slice(10).join(' '));
    else if (x[0] === '?') files.push(x.slice(2));
  }
  if (!head || head === '(initial)') return null;
  return { head, files };
}
const gitShow = (rev, rel) => { const r = spawnSync('git', ['show', `${rev}:./${rel}`], { encoding: 'utf8', maxBuffer: 1e8 }); return r.status === 0 ? r.stdout : null; };

/** Trạng thái từng màn trong một bản tracking: { S03: {trangThai, folder} } + hồ sơ/phạm vi. */
function đọcTracking(nội) {
  const ra = { màn: {}, hồSơ: null, phạmVi: null, iDev: -1, rows: [] };
  if (!nội) return ra;
  ra.hồSơ = (nội.match(/Hồ sơ dự án:\s*`?([a-z]+)`?/i) || [])[1] || null;
  ra.phạmVi = (nội.match(/Phạm vi:\s*`?([a-z]+)`?/i) || [])[1] || null;
  const L = nội.split('\n').filter((l) => l.trim().startsWith('|'));
  if (L.length < 2) return ra;
  const ô = (l) => l.split('|').slice(1, -1).map((c) => c.trim());
  const head = ô(L[0]);
  const iF = head.findIndex((h) => /^folder$/i.test(h)), iS = head.findIndex((h) => /^trạng thái$/i.test(h));
  ra.iDev = head.findIndex((h) => /^dev$/i.test(h));
  if (iF < 0) return ra;
  const HL = require('./hook-lint.js');
  for (const l of L.slice(2)) {
    const c = ô(l); const folder = (c[iF] || '').replace(/`/g, '').replace(/\/+$/, '').trim();
    const code = HL.mãMàn(folder); if (!code) continue;
    ra.màn[code] = { trangThai: iS >= 0 ? (c[iS] || '') : '', folder, dev: ra.iDev >= 0 ? (c[ra.iDev] || '') : '' };
  }
  return ra;
}

/** Mã màn của một bản ghi: `code` (hook-lint mới) → folder → `screen` nếu là mã (bản ghi tay/cũ) → đường dẫn file. */
function mãCủa(r) {
  const HL = require('./hook-lint.js');
  return r.code || HL.mãMàn(r.folder || '') || (/^S\d{2,3}$/.test(r.screen || '') ? r.screen : '') || HL.mãMàn(r.file || '');
}

function đốiSoát(mốc, g, recs, ghi) {
  const ra = { mới: [], daSoat: {}, haDaBao: Object.assign({}, mốc.haDaBao || {}) };
  const md = (f) => /^docs\/.*\.md$/.test(f);
  let docsĐổi = g.files.filter(md);
  let base = null;
  if (mốc.headSha && mốc.headSha !== g.head) {
    const d = spawnSync('git', ['diff', '--name-only', '-z', mốc.headSha, g.head, '--', 'docs'], { encoding: 'utf8', maxBuffer: 1e8 });
    if (d.status === 0) { base = mốc.headSha; for (const f of d.stdout.split('\0').filter(md)) if (!docsĐổi.includes(f)) docsĐổi.push(f); }
  }
  ra.base = base;
  if (!docsĐổi.length) return ra;
  // Lọc RẺ trước (đọc file + sha, không spawn): file đã soát đúng nội dung này, hoặc đã có bản ghi Edit cùng sha → bỏ.
  // Chỉ khi còn ứng viên mới tốn `git show` tracking HEAD — Stop nổ mọi lượt, lượt "ổn định" phải gần như miễn phí.
  const cuốiCủa = {}; for (const r of recs) if (r && r.file && r.loai !== 'ha-baseline') cuốiCủa[r.file] = r;
  const ứngViên = [];
  for (const f of docsĐổi) {
    if (path.basename(f).startsWith('00-')) continue;
    const nội = đọc(f); const s = nội === null ? 'xoa' : shaS(nội);
    ra.daSoat[f] = s;
    if ((mốc.daSoat || {})[f] === s) continue;                 // đã soát đúng nội dung này ở lượt trước
    if (cuốiCủa[f] && cuốiCủa[f].sha === s) continue;           // sửa qua Edit: hook-lint đã ghi bản ghi khớp — không nhân đôi
    ứngViên.push(f);
  }
  const trNay = đọc(path.join('docs', '00-tracking.md')) || '';
  const TR = 'docs/00-tracking.md';
  const soátTr = docsĐổi.includes(TR) && (mốc.daSoat || {})[TR] !== shaS(trNay);
  if (docsĐổi.includes(TR)) ra.daSoat[TR] = shaS(trNay);
  if (!ứngViên.length && !soátTr) return ra;
  đánhDấu('SR', 'goi');
  const HL = require('./hook-lint.js');
  const trHead = gitShow('HEAD', TR);
  const trBase = base ? gitShow(base, TR) : null;
  const folders = [];
  for (const t of [trNay, trHead, trBase]) if (t) for (const b of HL.baselineFolders(t)) if (!folders.some((x) => x.folder === b.folder)) folders.push(b);
  for (const f of ứngViên) {
    let rec = null;
    try { rec = HL.recordSpecChange(f, path.resolve(f), { folders, base: base || undefined, nguon: 'doi-soat', ghi }); } catch { đánhDấu('SR', 'hong'); }
    if (rec) { ra.mới.push(rec); đánhDấu('SR', 'ban'); }
  }
  // Tracking: màn rời "Hoàn thành" · hồ sơ/phạm vi đổi → sự kiện ha-baseline (so với bản tracking ở mốc HEAD cũ nếu đã dời).
  if (soátTr) {
    const cũ = đọcTracking(trBase || trHead), nay = đọcTracking(trNay); const gốc = base || g.head;
    const sk = [];
    for (const [code, x] of Object.entries(cũ.màn)) {
      if (!/hoàn thành/i.test(x.trangThai)) continue;
      const y = nay.màn[code];
      if (y && /hoàn thành/i.test(y.trangThai)) continue;
      sk.push({ code, chiTiet: `${code} rời "Hoàn thành" (→ ${y ? y.trangThai || 'trống' : 'mất dòng'})` });
    }
    if (cũ.hồSơ !== nay.hồSơ) sk.push({ code: '', chiTiet: `hồ sơ dự án ${cũ.hồSơ || 'full'} → ${nay.hồSơ || 'full'}` });
    if (cũ.phạmVi !== nay.phạmVi) sk.push({ code: '', chiTiet: `phạm vi ${cũ.phạmVi || 'full'} → ${nay.phạmVi || 'full'}` });
    for (const e of sk) {
      const k = e.code + '|' + e.chiTiet;
      if (ra.haDaBao[k] === gốc) continue;
      ra.haDaBao[k] = gốc;
      if (recs.some((r) => r && r.loai === 'ha-baseline' && r.chiTiet === e.chiTiet && r.sha === shaS(trNay))) continue;   // đã có trong hàng đợi
      const rec = { ts: new Date().toISOString(), file: 'docs/00-tracking.md', loai: 'ha-baseline', code: e.code, screen: '', chiTiet: e.chiTiet, sha: shaS(trNay), nguon: 'doi-soat' };
      if (ghi) { try { fs.mkdirSync(path.dirname(QUEUE), { recursive: true }); fs.appendFileSync(QUEUE, JSON.stringify(rec) + '\n'); } catch { đánhDấu('SR', 'hong'); } }
      ra.mới.push(rec); đánhDấu('SR', 'ban');
    }
  }
  return ra;
}

/** Sổ CR: ids (qua ledger.js như trước — null = không đọc nổi) + nội dung để soát dòng mới. */
function đọcCR() {
  let file = null;
  for (const p of [path.join('docs', '00-cr.md'), path.join('docs', 'Ho-so', '00-cr.md')]) if (fs.existsSync(p)) { file = p; break; }
  if (!file) return null;
  const nội = đọc(file) || '';
  let ids = null;
  try {
    const r = spawnSync(process.execPath, [path.join(__dirname, 'ledger.js'), file, 'ids'], { encoding: 'utf8' });
    if (r.status !== 0) return null;
    const ds = JSON.parse(r.stdout);
    ids = ds.map((x) => x.id);
    var đangLàm = ds.filter((x) => /^(Đã duyệt|Đang triển khai)/i.test(String(x.status || '').trim())).map((x) => x.id);
  } catch { return null; }
  if (ids.length === 0 && /\bCR-\d/.test(nội)) return null;   // sổ CÓ mã CR mà ledger đọc ra 0 → không parse được (xem đếmCR cũ)
  // CR "mới" còn tính cả so với bản sổ ở HEAD: mở CR ở lượt trước rồi mới sửa (đúng luật) thì mốc đã nuốt CR đó — không được kêu oan.
  const ởHead = gitShow('HEAD', file.split(path.sep).join('/'));
  const idsHead = ởHead === null ? null : [...ởHead.matchAll(/^\|\s*\**(CR-[\w-]+?)\**\s*\|/gm)].map((m) => m[1]);
  return { file, nội, ids, đangLàm, idsHead, sha: shaS(nội) };
}

/** CR có đủ để coi là "đã mở CR cho thay đổi này": dòng bảng đủ cột + (dòng hoặc mục chi tiết) nhắc mã màn/ID. */
function crKhớp(id, nội, cầnNhắc) {
  const L = nội.split('\n');
  const i = L.findIndex((l) => new RegExp(`^\\|\\s*\\**${esc(id)}\\**\\s*\\|`).test(l));
  if (i < 0) return { ok: false, vìSao: 'không có dòng bảng' };
  let j = i; while (j > 0 && !/^\|\s*:?-{3,}/.test(L[j])) j--;
  const ô = (l) => l.replace(/\|\s*$/, '').split('|').slice(1).map((c) => c.trim());
  const cHead = j > 0 ? ô(L[j - 1]) : [], cRow = ô(L[i]);
  const đầy = cRow.filter(Boolean).length;
  if (cHead.length && (cRow.length < cHead.length || đầy < Math.min(cHead.length, 4))) return { ok: false, vìSao: `thiếu cột (${đầy}/${cHead.length} ô có chữ)` };
  let mục = '';
  const h = L.findIndex((l) => new RegExp(`^#{2,4}\\s+.*${esc(id)}\\b`).test(l));
  if (h >= 0) { const cấp = (L[h].match(/^#+/) || ['##'])[0].length; let k = h + 1; while (k < L.length && !(new RegExp(`^#{1,${cấp}}\\s`).test(L[k]))) k++; mục = L.slice(h, k).join('\n'); }
  const text = L[i] + '\n' + mục;
  if (!cầnNhắc.some((x) => nhắcTới(text, x))) return { ok: false, vìSao: `không nhắc ${cầnNhắc.slice(0, 3).join('/')}${cầnNhắc.length > 3 ? '…' : ''}` };
  return { ok: true };
}

function đọcNợ() {
  let j = {}; try { j = JSON.parse(fs.readFileSync(NỢ, 'utf8')); } catch { j = {}; }
  if (!j || typeof j !== 'object' || Array.isArray(j)) j = {};
  if (!Array.isArray(j.mo)) j.mo = []; if (!Array.isArray(j.dong)) j.dong = [];
  return j;
}
function ghiNợ(j) {
  const tạm = `${NỢ}.${process.pid}.tmp`;
  try { fs.mkdirSync(path.dirname(NỢ), { recursive: true }); fs.writeFileSync(tạm, JSON.stringify(j, null, 1) + '\n'); fs.renameSync(tạm, NỢ); }
  catch { try { fs.rmSync(tạm, { force: true }); } catch { /* thôi */ } }
}

/** Đóng nợ khi điều kiện hết: CR mới (sau lúc mở nợ) khớp, hoặc mọi file của nợ trở về bằng HEAD lúc mở nợ. */
function đóngNợ(nợ, cr, g) {
  const đóng = [];
  nợ.mo = nợ.mo.filter((d) => {
    let cách = null;
    if (cr) for (const id of cr.ids) { if ((d.crBiet || []).includes(id) && !cr.đangLàm.includes(id)) continue; if (crKhớp(id, cr.nội, [d.man, ...(d.ids || [])].filter(Boolean)).ok) { cách = id; break; } }
    if (!cách && g && d.head && (d.files || []).length) {
      const r = spawnSync('git', ['diff', '--quiet', d.head, '--', ...d.files], { encoding: 'utf8' });
      const chưaTrack = g.files.some((f) => d.files.includes(f) && !gitShow(d.head, f));
      if (r.status === 0 && !chưaTrack) cách = 'về-HEAD';
    }
    if (cách) { đóng.push({ id: d.id, ts: new Date().toISOString(), cach: cách }); return false; }
    return true;
  });
  nợ.dong.push(...đóng);
  return đóng;
}

/* SI — toolkit lệch nguồn (giao diện 1: integrity.js của gói I). Vắng script / exit 2 (không kiểm được) → IM. Mỗi file nhắc
 * một lần; chạy lại khi chữ ký .claude/ (git status + mtime settings) đổi hoặc mỗi 10 phút — hash cả bộ skill mỗi lượt là đắt. */
function SI(mốc, g, mốcMới) {
  const f = path.join(__dirname, 'integrity.js');
  if (!fs.existsSync(f)) return [];
  const mt = (p) => { try { return fs.statSync(p).mtimeMs; } catch { return 0; } };
  const sig = shaS(JSON.stringify([g ? g.head : null, g ? g.files.filter((x) => x.startsWith('.claude/') && !RUNTIME.test(x)) : null,
    ['settings.json', 'settings.local.json', 'ba-toolkit.json', 'ba-toolkit-local.json', 'ba-hooks.json'].map((x) => mt(path.join('.claude', x)))]));
  mốcMới.siSig = mốc.siSig; mốcMới.siTs = mốc.siTs; mốcMới.siDaNhac = mốc.siDaNhac || {};
  if (sig === mốc.siSig && Date.now() - (mốc.siTs || 0) < 10 * 60 * 1000) return [];   // không git: chỉ còn mtime + nhịp 10 phút
  đánhDấu('SI', 'goi');
  const r = spawnSync(process.execPath, [f, '--json'], { encoding: 'utf8', maxBuffer: 1e8, timeout: 15000 });
  mốcMới.siSig = sig; mốcMới.siTs = Date.now();
  if (r.error || r.status === 2 || r.status === null) return [];
  let j = null; try { j = JSON.parse(r.stdout); } catch { đánhDấu('SI', 'hong'); return []; }
  if (r.status === 0 || !Array.isArray(j.lech)) { mốcMới.siDaNhac = {}; return []; }
  const đã = mốc.siDaNhac || {}; const nay = {}; const mới = [];
  for (const x of j.lech) { const k = `${x.file}|${x.loai}`; nay[k] = 1; if (!đã[k]) mới.push(x); }
  mốcMới.siDaNhac = nay;
  if (!mới.length) return [];
  đánhDấu('SI', 'ban');
  return [`[ba-toolkit hook · SI] toolkit lệch nguồn (${j.nguon || '?'}) — ${mới.length} file mới lệch:`,
    ...mới.slice(0, 10).map((x) => `  · ${x.file} (${x.loai})`), mới.length > 10 ? `  · … còn ${mới.length - 10}` : '',
    '  Cổng accept/validate-done sẽ TRẢ A0. Trả về bản nguồn (`ba-export update`) hoặc, nếu cố ý, ghi duyệt có hạn vào `.claude/ba-toolkit-local.json`.'].filter(Boolean);
}

/* SN — màn VỪA chuyển sang `dev ✅` mà sổ nhận `.claude/ac-accept.jsonl` (giao diện 2) không có dòng NHẬN cho màn. Miễn màn
 * có verification.md ghi ngày trước 2026-09-24 (trước khi có accept.js). ⚠ chứ không phải lỗi: hook không phán NHẬN/TRẢ.
 * Chỉ xét CHUYỂN TRẠNG THÁI (✅ bây giờ, chưa ✅ ở bản tham chiếu: tracking HEAD — hay mốc HEAD cũ nếu HEAD đã dời; không git
 * thì ảnh chụp ở mốc) — kho hình thật 07/10/2026: P1–P4 có 9–51 màn ✅ đời trước accept.js, điểm danh trạng thái tĩnh là kêu oan
 * hàng loạt, và hook chỉ nói về việc vừa làm (luật của gọiChecker). Mỗi màn nhắc một lần. */
function SN(trNội, mốc, mốcMới, g, base) {
  const tr = đọcTracking(trNội);
  if (tr.iDev < 0) { mốcMới.snDaNhac = {}; return []; }
  const xongNay = Object.entries(tr.màn).filter(([, x]) => /✅/.test(x.dev)).map(([c]) => c);
  let thamChiếu;
  if (g) {
    const TR = 'docs/00-tracking.md';
    if (!base && !g.files.includes(TR)) { mốcMới.snDaNhac = mốc.snDaNhac || {}; return []; }   // tracking y HEAD, HEAD không dời → không có chuyển trạng thái
    const cũ = đọcTracking(gitShow(base || 'HEAD', TR));
    thamChiếu = Object.entries(cũ.màn).filter(([, x]) => /✅/.test(x.dev)).map(([c]) => c);
  } else {
    mốcMới.devXong = xongNay;
    if (!Array.isArray(mốc.devXong)) { mốcMới.snDaNhac = {}; return []; }    // lần đầu: chỉ chụp ảnh, không phán
    thamChiếu = mốc.devXong;
  }
  const vừaXong = xongNay.filter((c) => !thamChiếu.includes(c));
  mốcMới.snDaNhac = {};
  if (!vừaXong.length) return [];
  đánhDấu('SN', 'goi');
  const nhận = new Set();
  for (const l of (đọc(SỔ_NHẬN) || '').split('\n')) { try { const r = JSON.parse(l); if (r && r.ketQua === 'NHẬN') for (const m of String(r.man || '').match(/\bS\d{2,3}\b/g) || []) nhận.add(m); } catch { /* dòng hỏng */ } }
  const miễn = (folder) => { const v = đọc(path.join(folder, 'verification.md')); const d = v && (v.match(/ngày[^:\n]{0,20}:\s*\**`?(\d{4}-\d{2}-\d{2})/i) || [])[1]; return !!d && d < MỐC_MIỄN_NHẬN; };
  const thiếu = vừaXong.filter((c) => !nhận.has(c) && !miễn(tr.màn[c].folder));
  for (const c of thiếu) mốcMới.snDaNhac[c] = 1;
  const mới = thiếu.filter((c) => !(mốc.snDaNhac || {})[c]);
  if (!mới.length) return [];
  đánhDấu('SN', 'ban');
  return [`[ba-toolkit hook · SN] ⚠ ${mới.length} màn vừa chuyển \`dev ✅\` mà \`.claude/ac-accept.jsonl\` không có dòng NHẬN: ${mới.join(', ')}.`,
    '  `dev ✅` chỉ đặt sau khi `ac-verify/scripts/accept.js` cho màn đó ra NHẬN (verifier mới chạy Proof) — lời khai trong tracking không phải bằng chứng.'];
}

function chạy(opts = {}) {
  const ghi = opts.ghi !== false;
  const mốc = đọcMốc();
  const cảnhBáoĐầu = [];
  if (mốc.lastTs && Date.parse(mốc.lastTs) > Date.now() + NĂM_PHÚT) delete mốc.lastTs;   // mốc ở tương lai = vô hiệu, không tin
  const g = gitTrạngThái();
  const q0 = đọcHàngĐợi();
  const ds = g ? đốiSoát(mốc, g, q0.recs, ghi) : null;
  const q = ghi && ds && ds.mới.length ? đọcHàngĐợi() : { dòng: q0.dòng.concat(ds ? ds.mới.map((r) => JSON.stringify(r)) : []), recs: q0.recs.concat(ds ? ds.mới : []) };

  let mới;
  if (typeof mốc.offset === 'number') {
    if (q.dòng.length < mốc.offset) { cảnhBáoĐầu.push(`[ba-toolkit hook · SQ] hàng đợi bị cắt: mốc đã đọc ${mốc.offset} dòng, nay còn ${q.dòng.length} — \`.claude/spec-changes.jsonl\` không được xoá/rút tay (ba-changelog đánh dấu, không cắt). Soát lại cả hàng đợi.`); mới = q.recs; đánhDấu('SQ', 'ban'); }
    else if (mốc.queueSha && shaS(q.dòng.slice(0, mốc.offset).join('\n')) !== mốc.queueSha) { cảnhBáoĐầu.push('[ba-toolkit hook · SQ] hàng đợi bị sửa ở phần đã đọc (sha lệch mốc) — soát lại cả hàng đợi.'); mới = q.recs; đánhDấu('SQ', 'ban'); }
    else mới = q.recs.slice(mốc.offset);
  } else mới = mốc.lastTs ? q.recs.filter((r) => r && r.ts > mốc.lastTs) : q.recs;
  mới = mới.filter(Boolean);

  const mốcMới = { offset: q.dòng.length, queueSha: shaS(q.dòng.join('\n')) };
  if (g) { mốcMới.headSha = g.head; mốcMới.daSoat = ds.daSoat; mốcMới.haDaBao = ds.haDaBao; }
  if (mới.length) mốcMới.lastTs = mới[mới.length - 1].ts;

  let hồSơ = 'full', chỉDocs = false;
  try {
    const pf = require('./profile.js');
    hồSơ = pf.readProfile('docs') || 'full';
    chỉDocs = typeof pf.isDocsOnly === 'function' && pf.isDocsOnly('docs');
  } catch { /* bản cũ → full */ }
  mốcMới.hồSơ = hồSơ;
  const cfg = cấuHình();
  const trNội = đọc(path.join('docs', '00-tracking.md')) || đọc(path.join('docs', 'Ho-so', '00-tracking.md')) || '';

  // Phép kiểm KHÔNG phụ thuộc hàng đợi: S3 (git: có file ngoài docs đổi) · SN · SI. Chạy mỗi Stop nhưng mỗi thứ nhắc một lần.
  const độcLập = [];
  if (g && cfg.S3 === true && hồSơ === 'full' && !chỉDocs) {
    const ngoài = g.files.filter((f) => !f.startsWith('docs/') && !f.startsWith('.claude/'));
    const mt = (p) => { try { return fs.statSync(p).mtimeMs; } catch { return 0; } };
    const sig = ngoài.length ? shaS(g.head + ngoài.map((f) => f + ':' + mt(f)).join('|')) : null;
    mốcMới.s3Sig = sig || mốc.s3Sig;
    if (sig && (sig !== mốc.s3Sig || !ghi)) độcLập.push(...S3());
  }
  try { độcLập.push(...SN(trNội, mốc, mốcMới, g, ds && ds.base)); } catch { đánhDấu('SN', 'hong'); }
  try { độcLập.push(...SI(mốc, g, mốcMới)); } catch { đánhDấu('SI', 'hong'); }

  // Nợ S2 cũ: đóng khi điều kiện hết (đọc sổ CR chỉ khi có nợ mở).
  const nợ = đọcNợ(); let nợĐổi = false; let cr;
  const lấyCR = () => (cr === undefined ? (cr = đọcCR()) : cr);
  // Soát đóng nợ tốn ledger + git (~100 ms) → chỉ khi đầu vào đổi: sổ CR, HEAD, tập file docs đang lệch (sha), danh sách nợ.
  if (nợ.mo.length) {
    const sigNợ = shaS(JSON.stringify([đọc(path.join('docs', '00-cr.md')) || đọc(path.join('docs', 'Ho-so', '00-cr.md')), g && g.head, ds && ds.daSoat, nợ.mo.map((d) => d.id)]));
    if (sigNợ !== mốc.nợSig || !ghi) { const đ = đóngNợ(nợ, lấyCR(), g); if (đ.length) nợĐổi = true; }
    mốcMới.nợSig = sigNợ;
  }

  if (!mới.length) {
    if (nợĐổi && ghi) ghiNợ(nợ);
    return { cảnhBáo: cảnhBáoĐầu.concat(độcLập), mốcMới };
  }
  LẦN_NÀY._cóViệc = true;
  const ghiChúGit = [];
  if (!g) {
    if (cảnhBáoĐầu.length || độcLập.length || !mốc.khongGitDaBao) ghiChúGit.push('[ba-toolkit hook · SR] không đối soát được, không phải git — chỉ thấy sửa qua Edit/Write; sửa bằng Bash/sed hay commit lén sẽ lọt.');
    mốcMới.khongGitDaBao = true;
  }

  // ── S2 ──
  const chạm = [];
  for (const r of mới) {
    if (r.loai === 'ha-baseline') { chạm.push({ id: r.code || 'hồ-sơ', trangThai: 'hạ', truong: ['Trạng thái màn'], file: r.file, code: r.code || '', chiTiet: r.chiTiet }); continue; }
    for (const x of r.idsChanged || []) {
      const trường = Array.isArray(x.truong) ? x.truong : [x.truong];
      const đángKể = x.trangThai === 'xoá' || trường.some((f) => f && !SỔ_SÁCH.test(String(f).trim()));
      if (đángKể) chạm.push({ id: x.id, trangThai: x.trangThai, truong: trường, file: r.file, code: mãCủa(r) });
    }
  }
  const mànChạm = [...new Set(mới.filter((r) => r.loai !== 'ha-baseline').map(mãCủa).filter(Boolean))];
  const phụ = [].concat(
    S1(mới, mànChạm),
    gọiChecker(mànChạm),
    !g && cfg.S3 === true && hồSơ === 'full' && !chỉDocs ? S3() : [],   // không git: S3 giữ hành vi cũ (theo hàng đợi)
  );
  const kèm = (ds2) => [].concat(cảnhBáoĐầu, ds2, phụ.length && ds2.length ? [''] : [], phụ, độcLập, ghiChúGit);
  const xong = () => { if (nợĐổi && ghi) ghiNợ(nợ); };
  if (!chạm.length) { xong(); return { cảnhBáo: kèm([]), mốcMới }; }
  đánhDấu('S2', 'goi');
  const c = lấyCR();
  if (c === null) { đánhDấu('S2', 'hong'); xong(); return { cảnhBáo: kèm([]), mốcMới }; }   // không đọc được sổ → im, đừng đoán
  mốcMới.crIds = c.ids; mốcMới.crCount = c.ids.length;
  const trước = Array.isArray(mốc.crIds) ? mốc.crIds : typeof mốc.crCount === 'number' ? c.ids.slice(0, mốc.crCount) : null;
  // Ứng viên: CR MỚI (so mốc, hoặc so sổ ở HEAD) + CR đang triển khai (Đã duyệt/Đang triển khai) — triển khai một CR đã duyệt
  // là đúng luật, không được thành nợ vĩnh viễn. Ứng viên nào cũng phải đủ cột và nhắc mã màn/ID vừa đổi (crKhớp).
  const crMới = [...new Set([
    ...(trước ? c.ids.filter((id) => !trước.includes(id)) : []),
    ...(c.idsHead ? c.ids.filter((id) => !c.idsHead.includes(id)) : []),
    ...c.đangLàm,
  ])];
  const nhóm = new Map();
  for (const x of chạm) { const k = x.code || '?'; const n = nhóm.get(k) || { code: x.code, ids: new Set(), files: new Set(), dòng: [] }; if (x.trangThai !== 'hạ') n.ids.add(x.id); n.files.add(x.file); n.dòng.push(x); nhóm.set(k, n); }
  const bịLoại = new Map(); const chưaGiải = [];
  for (const n of nhóm.values()) {
    const cần = [n.code, ...n.ids].filter(Boolean);
    let ok = false;
    for (const id of crMới) { const k = crKhớp(id, c.nội, cần); if (k.ok) { ok = true; break; } if (!c.đangLàm.includes(id)) bịLoại.set(id, k.vìSao); }
    if (!ok) chưaGiải.push(n);
  }
  if (!chưaGiải.length) { xong(); return { cảnhBáo: kèm([]), mốcMới }; }

  đánhDấu('S2', 'ban');
  const ds2 = chưaGiải.flatMap((n) => n.dòng);
  const gọn = ds2.slice(0, 8).map((x) => x.chiTiet ? x.chiTiet : `${x.id} (${x.trangThai}: ${x.truong.join(', ')})`);
  if (ghi) {
    let số = Math.max(0, ...nợ.mo.concat(nợ.dong).map((d) => +(String(d.id).match(/\d+$/) || [0])[0]));
    for (const n of chưaGiải) {
      const cũ = nợ.mo.find((d) => d.luat === 'S2' && d.man === (n.code || '?'));
      if (cũ) { cũ.ids = [...new Set([...(cũ.ids || []), ...n.ids])]; cũ.files = [...new Set([...(cũ.files || []), ...n.files])]; continue; }
      nợ.mo.push({ id: `NH-${String(++số).padStart(2, '0')}`, luat: 'S2', man: n.code || '?', ids: [...n.ids], ts: new Date().toISOString(), chiTiet: n.dòng.slice(0, 4).map((x) => x.chiTiet || `${x.id} ${x.trangThai}`).join(' · '), files: [...n.files].filter((f) => f !== 'docs/00-tracking.md'), head: g ? (ds.base || g.head) : null, crBiet: c.ids });   // head = bản THAM CHIẾU trước thay đổi (mốc HEAD cũ nếu đã commit lén)
    }
    nợĐổi = true;
  }
  xong();
  return {
    mốcMới,
    cảnhBáo: kèm([
      `[ba-toolkit hook · S2] ${ds2.length} thay đổi ở tài liệu ĐÃ CHỐT (màn ${chưaGiải.map((n) => n.code || '?').join(', ')}) mà sổ \`00-cr.md\` không có CR mới khớp:`,
      ...gọn.map((x) => '  · ' + x),
      ds2.length > 8 ? `  · … còn ${ds2.length - 8}` : '',
      ...[...bịLoại].map(([id, v]) => `  · ${id} mới mở nhưng không tính: ${v}`),
      '  Đổi thứ đã chốt thì mở Change Request TRƯỚC khi sửa (conventions.md → "Change Request") — dòng CR phải đủ cột và nhắc mã màn hoặc mã vừa đổi.',
      `  Ghi nợ vào \`.claude/ba-hook-debt.json\` (status.js hiện 🟠); nợ tự đóng khi có CR khớp hoặc file trở về bằng HEAD. Nhắc MỘT LẦN cho đợt này.`,
    ].filter(Boolean)),
  };
}

/*
 * `--stats` — đọc bộ đếm, in bảng theo luật để quyết GIỮ/CẮT (gói E, 25/09/2026: đo 2 tuần rồi mới cắt).
 * Nhận nhiều gốc dự án một lượt (`--stats ~/dev/a ~/dev/b`) và CỘNG lại — câu hỏi "luật này có bao giờ bắn
 * không" cần cả mấy dự án, không phải một. Không đếm, không phán: dòng `gọi 0` chỉ nói hook chưa từng xét luật
 * đó ở đây; cắt hay giữ là người quyết.
 */
function inThốngKê(argv) {
  const i = argv.indexOf('--stats');
  const gốc = argv.slice(i + 1).filter((a) => !a.startsWith('--'));
  if (!gốc.length) gốc.push('.');
  const tổng = { hook: {}, luat: {}, nguồn: [] };
  const muộnHơn = (a, b) => (!a ? b : !b ? a : (a > b ? a : b));
  for (const g of gốc) {
    const f = path.join(g, THỐNG_KÊ);
    let s = null;
    try { s = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { tổng.nguồn.push({ gốc: g, có: false }); continue; }
    tổng.nguồn.push({ gốc: g, có: true, batDau: s.batDau || null });
    for (const [h, x] of Object.entries(s.hook || {})) {
      const t = tổng.hook[h] || (tổng.hook[h] = { goi: 0, coViec: 0, goiCuoi: null });
      t.goi += x.goi || 0; t.coViec += x.coViec || 0; t.goiCuoi = muộnHơn(t.goiCuoi, x.goiCuoi);
    }
    for (const [m, x] of Object.entries(s.luat || {})) {
      const t = tổng.luat[m] || (tổng.luat[m] = { hook: x.hook, goi: 0, ban: 0, hong: 0, goiCuoi: null, banCuoi: null });
      for (const k of ['goi', 'ban', 'hong']) t[k] += x[k] || 0;
      t.goiCuoi = muộnHơn(t.goiCuoi, x.goiCuoi); t.banCuoi = muộnHơn(t.banCuoi, x.banCuoi);
    }
  }
  // Khoá `.claude/ba-hooks.json` đang GHI ĐÈ mặc định (hook-review 07/10/2026): tắt S8 hay bật khoá lạ là đổi cổng — phải
  // hiện ở chỗ người ta đọc để quyết giữ/cắt, không nằm im trong một file cấu hình.
  let mặcĐịnh = {}; try { mặcĐịnh = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'hooks.config.json'), 'utf8')); } catch { /* thiếu → so với rỗng */ }
  const ghiĐè = [];
  for (const g of gốc) {
    let c = null; try { c = JSON.parse(fs.readFileSync(path.join(g, '.claude', 'ba-hooks.json'), 'utf8')); } catch { continue; }
    if (!c || typeof c !== 'object') continue;
    for (const [k, v] of Object.entries(c)) {
      if (k.startsWith('_')) continue;
      if (!(k in mặcĐịnh)) ghiĐè.push({ gốc: g, khoá: k, giáTrị: v, mặcĐịnh: null, ghiChú: 'khoá không có trong mặc định (luật đã bỏ / gõ sai?)' });
      else if (JSON.stringify(v) !== JSON.stringify(mặcĐịnh[k])) ghiĐè.push({ gốc: g, khoá: k, giáTrị: v, mặcĐịnh: mặcĐịnh[k] });
    }
  }
  const dòng = [];
  for (const [h, ds] of Object.entries(LUẬT_CỦA_HOOK)) for (const m of ds) {
    const x = tổng.luat[m] || { goi: 0, ban: 0, hong: 0, goiCuoi: null, banCuoi: null };
    dòng.push({ luật: m, hook: h, gọi: x.goi, bắn: x.ban, hỏng: x.hong, gọiCuối: x.goiCuoi, bắnCuối: x.banCuoi });
  }
  for (const [m, x] of Object.entries(tổng.luat)) if (!dòng.some((d) => d.luật === m)) {
    dòng.push({ luật: m, hook: x.hook || '?', gọi: x.goi, bắn: x.ban, hỏng: x.hong, gọiCuối: x.goiCuoi, bắnCuối: x.banCuoi, ghiChú: 'mã không còn khai (luật đã bỏ?)' });
  }
  if (argv.includes('--json')) { console.log(JSON.stringify({ nguồn: tổng.nguồn, hook: tổng.hook, luật: dòng, ghiĐè }, null, 2)); return 0; }
  const ngày = (x) => (x ? x.slice(0, 10) : '—');
  console.log(`Bộ đếm hook — ${tổng.nguồn.map((n) => `${n.gốc}${n.có ? ` (từ ${ngày(n.batDau)})` : ' (CHƯA CÓ file đếm)'}`).join(' · ')}`);
  console.log('\n| Hook | gọi | có việc | gọi cuối |\n|---|---|---|---|');
  for (const h of Object.keys(LUẬT_CỦA_HOOK)) { const x = tổng.hook[h] || { goi: 0, coViec: 0 }; console.log(`| ${h} | ${x.goi} | ${x.coViec} | ${ngày(x.goiCuoi)} |`); }
  console.log('\n| Luật | Hook | gọi | bắn | hỏng | gọi cuối | bắn cuối |\n|---|---|---|---|---|---|---|');
  for (const d of dòng) console.log(`| ${d.luật} | ${d.hook} | ${d.gọi} | ${d.bắn} | ${d.hỏng} | ${ngày(d.gọiCuối)} | ${ngày(d.bắnCuối)} |${d.ghiChú ? ' ' + d.ghiChú : ''}`);
  if (ghiĐè.length) {
    console.log('\nGhi đè mặc định (`.claude/ba-hooks.json`):');
    for (const x of ghiĐè) console.log(`  · ${x.gốc}: ${x.khoá} = ${JSON.stringify(x.giáTrị)}${x.mặcĐịnh === null ? '' : ` (mặc định ${JSON.stringify(x.mặcĐịnh)})`}${x.ghiChú ? ' — ' + x.ghiChú : ''}`);
  }
  console.log('\nĐọc: hook `gọi 0` = hook không chạy ở đây (chưa cài / settings.json thiếu) · luật `gọi 0` mà hook có việc = điều kiện của luật chưa từng xảy ra'
    + ' · `bắn 0` sau nhiều lần gọi = ứng viên cắt (hoặc nó đang im oan — soi một ca thật trước khi cắt) · `hỏng` > 0 = checker chết, sửa trước khi đánh giá.');
  return 0;
}

if (require.main === module && process.argv.includes('--stats')) process.exit(inThốngKê(process.argv));

if (require.main === module && process.argv.includes('--check')) {
  const { cảnhBáo } = chạy({ ghi: false });   // soát tay: không ghi hàng đợi/mốc/sổ nợ
  console.log(cảnhBáo.length ? cảnhBáo.join('\n') : '✅ không có kỷ luật nào bị bỏ');
  process.exit(0);
}

module.exports = { ghiThốngKê, THỐNG_KÊ, LUẬT_CỦA_HOOK, NỢ };

if (require.main === module) {
  // Bộ đếm ghi ở 'exit' — MỌI đường ra (stop_hook_active, chạy() ném, exit 0/2) đều được tính một lần gọi.
  process.on('exit', () => { const { _cóViệc, ...luật } = LẦN_NÀY; ghiThốngKê('hook-gate', !!_cóViệc, luật); });
  let raw = '';
  process.stdin.on('data', (c) => { raw += c; });
  process.stdin.on('end', () => {
    // (1) Chốt chống vòng lặp — PHẢI là việc đầu tiên.
    let vào = {}; try { vào = JSON.parse(raw); if (vào.stop_hook_active) process.exit(0); } catch { /* stdin không phải JSON → chạy tiếp */ }
    let kq;
    try { kq = chạy(); } catch { process.exit(0); }   // hook hỏng KHÔNG được làm hỏng luồng người dùng
    // S8 chạy độc lập với hàng đợi (lượt không gộp tool thì chẳng cần chạm docs) — mốc nấc ghi cùng file mốc
    let mốcS8 = null; try { const cfg = cấuHình(); const m0 = đọcMốc(); const tắt = cfg.S8 === false || cfg.S7 === false; const s8 = tắt ? { cảnhBáo: [] } : S8(vào.transcript_path, m0); if (s8.cảnhBáo.length) { kq.cảnhBáo = kq.cảnhBáo.concat(kq.cảnhBáo.length ? [''] : [], s8.cảnhBáo); mốcS8 = s8.nấc; } } catch { /* bỏ */ }
    if (kq.mốcMới || mốcS8 !== null) {
      const m0 = đọcMốc(); const trước = JSON.stringify(m0);
      if (kq.mốcMới) delete m0.lastTs;                       // lastTs cũ (có thể ở tương lai) không được sống sót qua Object.assign
      const m = Object.assign(m0, kq.mốcMới || {});
      if (mốcS8 !== null) { if (mốcS8.tỷLệ !== null) m.s8Nấc = mốcS8.tỷLệ; if (mốcS8.lượt !== null) m.s8LượtNấc = mốcS8.lượt; }
      if (JSON.stringify(m) !== trước) ghiMốc(m);            // Stop nổ MỌI lượt: không đổi thì không ghi
    }
    if (!kq.cảnhBáo.length) process.exit(0);
    process.stderr.write(kq.cảnhBáo.join('\n') + '\n');
    process.exit(2);
  });
}
