#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
/*
 * ba-toolkit/semdiff.js — DIFF NGỮ NGHĨA của tài liệu BA giữa hai phiên bản git.
 * Zero-dependency, CommonJS. Chỉ đọc. Không phán xét — trả dữ liệu để skill diễn giải.
 *
 * VÌ SAO TỒN TẠI: bước 1 của `ba-change-request` bắt agent "lần theo chuỗi truy vết, liệt kê
 * mọi ID bị chạm ở từng cấp". Làm bằng tay thì trượt, và đã trượt thật trong repo này ngày
 * 31/08/2026: vấn đề "token cũ sau đăng xuất" nằm ở 5 tài liệu, agent sửa 2 — biến mâu thuẫn
 * hai chiều thành ba chiều, và còn sửa theo phe THIỂU SỐ. `git diff` không giúp được: nó nói
 * "dòng 62 đổi", không nói "`BRule-S01-06` đổi điều kiện kích hoạt".
 *
 * Ý tưởng lấy từ `archify compare` (xem research/04-archify.md): tách hash THÔ khỏi hash NGỮ
 * NGHĨA, rồi liệt kê thay đổi theo TRƯỜNG chứ không theo dòng. Ta không cần IR mới — bảng
 * markdown của toolkit đã có ID ổn định (`R-S..`, `BRule-S..`, `F..`) và tiêu đề cột chính là
 * tên trường.
 *
 * Dùng:
 *   node .claude/skills/ba-toolkit/scripts/semdiff.js [docsDir=docs] [--base <rev>] [--head <rev>] [--plain]
 *   base mặc định `HEAD`; head mặc định là **cây làm việc** (thay đổi chưa commit).
 * Exit: 0 = không đổi gì · 1 = có thay đổi ngữ nghĩa · 2 = không chạy được (không phải git repo…).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

/** Tiền tố ID canon — khớp `id.prefixes` của conv-registry.md. Dài trước ngắn để `BRule` không
 *  bị `BR` nuốt mất, và `NFR` không bị `FR` nuốt. */
const PREFIX = ['BRule', 'NFR', 'StR', 'ACL', 'ATC', 'GWT', 'ADR', 'UAT', 'DEC', 'ACT', 'USC',
  'BR', 'FR', 'TR', 'UC', 'US', 'TC', 'CL', 'CR', 'WI', 'GĐ', 'SH', 'BO', 'OQ', 'EXT', 'PS',
  'UN', 'RB', 'PD', 'F', 'S', 'R', 'U', 'E', 'G'];
const RE_ID = new RegExp(`^(${PREFIX.join('|')})(-?S?\\d+)(-\\d+)?$`);
const làID = (s) => RE_ID.test(String(s).replace(/[`*]/g, '').trim());

const chuẩnHoá = (s) => String(s).replace(/\s+/g, ' ').replace(/[`*]/g, '').trim();
const hash = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 16);

/** Nội dung một file ở một revision; null nếu revision đó không có file. */
function đọcTạiRev(rel, rev, DOCS) {
  if (rev === null) {
    try { return fs.readFileSync(path.join(DOCS, rel), 'utf8'); } catch { return null; }
  }
  try {
    // `git rev-parse --show-toplevel` trả đường dẫn ĐÃ GIẢI SYMLINK. Trên macOS `/tmp` và
    // `/var/folders/...` đều là symlink, nên ghép nó với một DOCS chưa giải sẽ cho `path.relative`
    // ra chuỗi `../../..` vô nghĩa, `git show` thất bại, và diff âm thầm coi như file không tồn
    // tại ở base — mọi ID hoá thành "thêm". Giải symlink CẢ HAI phía trước khi trừ.
    const gốcRepo = fs.realpathSync(
      execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: DOCS, encoding: 'utf8' }).trim(),
    );
    const relTừGốc = path.relative(gốcRepo, fs.realpathSync(path.join(DOCS, rel)));
    return execFileSync('git', ['show', `${rev}:${relTừGốc}`], { encoding: 'utf8', maxBuffer: 1e8 });
  } catch { return null; }
}

/**
 * Bóc mọi bảng markdown thành `{ "<ID>": { "<tên cột>": "<giá trị>" } }`.
 * Chỉ nhận dòng có ô ĐẦU TIÊN là một ID canon — đó là quy ước bảng của toolkit, và nó đủ hẹp
 * để không nuốt bảng thuật ngữ hay bảng cấu hình.
 */
function bócBảng(nội, cảnhBáo) {
  const kq = {};
  if (!nội) return kq;
  const dòng = nội.split('\n');
  let cột = null;
  for (let i = 0; i < dòng.length; i++) {
    const l = dòng[i];
    if (!l.trim().startsWith('|')) { cột = null; continue; }
    const ô = l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((x) => x.trim());
    // Dòng ngăn cách `|---|---|` ⇒ dòng ngay TRƯỚC nó là tiêu đề.
    if (ô.every((c) => /^:?-{2,}:?$/.test(c))) {
      const trên = dòng[i - 1];
      if (trên && trên.trim().startsWith('|')) {
        cột = trên.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((x) => chuẩnHoá(x));
      }
      continue;
    }
    const id = chuẩnHoá(ô[0]);
    if (!cột) {
      // Dòng có ID nhưng KHÔNG tiêu đề nào ở trên: bảng bị cắt đôi (thường do một `---` hoặc
      // dòng trống chen vào giữa). Bỏ im lặng thì diff báo những dòng đó là "xoá" trong khi
      // chúng vẫn nằm nguyên trong file — đúng lỗi đã gặp: 11 dòng TC của S01 bị chấm là xoá.
      if (làID(id) && cảnhBáo) cảnhBáo(id);
      continue;
    }
    if (!làID(id)) continue;
    const bảnGhi = {};
    for (let c = 1; c < ô.length; c++) {
      const tên = cột[c] || `cột${c}`;
      bảnGhi[tên] = chuẩnHoá(ô[c]);
    }
    // Cùng một ID xuất hiện hai lần trong một file (vd bảng tổng + bảng chi tiết): giữ bản
    // ĐẦY ĐỦ hơn thay vì ghi đè, nếu không một bảng tóm tắt sẽ xoá mất bản chi tiết.
    if (!kq[id] || Object.keys(bảnGhi).length > Object.keys(kq[id]).length) kq[id] = bảnGhi;
  }
  return kq;
}

/** Mọi .md dưới docsDir, đường dẫn tương đối. */
function gomMd(dir, gốc = dir) {
  const ra = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) ra.push(...gomMd(p, gốc));
    else if (e.name.endsWith('.md')) ra.push(path.relative(gốc, p));
  }
  return ra;
}

/**
 * So sánh MỘT file: trả các ID bị chạm + cờ bảng cắt đôi. Tách riêng để `hook-lint.js` gọi được
 * cho đúng file vừa ghi — hook chạy sau MỖI lần Edit/Write nên không thể quét cả `docs/`.
 */
function soSanhMotFile(nộiBase, nộiHead) {
  const mcB = []; const mcH = [];
  const b = bócBảng(nộiBase, (id) => mcB.push(id));
  const h = bócBảng(nộiHead, (id) => mcH.push(id));
  const ra = [];
  for (const id of [...new Set([...Object.keys(b), ...Object.keys(h)])].sort()) {
    if (!b[id]) { ra.push({ id, trangThai: 'thêm', truong: Object.keys(h[id]) }); continue; }
    if (!h[id]) { ra.push({ id, trangThai: 'xoá', truong: Object.keys(b[id]) }); continue; }
    const đổi = [];
    for (const k of new Set([...Object.keys(b[id]), ...Object.keys(h[id])])) {
      if (b[id][k] !== h[id][k]) đổi.push(k);
    }
    if (đổi.length) ra.push({ id, trangThai: 'sửa', truong: đổi.sort() });
  }
  return { ids: ra, moCoiBase: mcB.length, moCoiHead: mcH.length, banGoNoiLai: mcB.length > mcH.length };
}

module.exports = { bócBảng, soSanhMotFile, đọcTạiRev, làID, hash };

// CLI chỉ chạy khi gọi TRỰC TIẾP. `require()` từ hook không được phép đọc argv hay process.exit —
// một hook mà thoát tiến trình là một hook làm hỏng luồng làm việc của người dùng.
if (require.main === module) {
  const args = process.argv.slice(2);
  const cờ = (tên, mặcĐịnh) => {
    const i = args.indexOf(tên);
    return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : mặcĐịnh;
  };
  const PLAIN = args.includes('--plain');
  const BASE = cờ('--base', 'HEAD');
  const HEAD = cờ('--head', null); // null = cây làm việc
  const DOCS = path.resolve(args.find((a) => !a.startsWith('--') && a !== BASE && a !== HEAD) || 'docs');

  if (!fs.existsSync(DOCS)) { console.error(`Không thấy ${DOCS}`); process.exit(2); }
  /* ── So sánh ─────────────────────────────────────────────────────────────────────────────── */
  let files;
  try { files = gomMd(DOCS).sort(); } catch (e) { console.error(e.message); process.exit(2); }

  const thayĐổi = [];
  const cảnhBáoBảng = [];
  let soFileĐổiThô = 0;

  for (const rel of files) {
    const nộiBase = đọcTạiRev(rel, BASE, DOCS);
    const nộiHead = đọcTạiRev(rel, HEAD, DOCS);
    if (nộiBase === null && nộiHead === null) continue;

    // Hash THÔ vs hash NGỮ NGHĨA — tách ra để phân biệt "sửa định dạng" với "đổi nội dung có ID".
    // Đây là điều `git diff` không nói được: nó báo dòng đổi, không báo NGHĨA có đổi không.
    const thôBase = nộiBase === null ? null : hash(nộiBase);
    const thôHead = nộiHead === null ? null : hash(nộiHead);
    if (thôBase !== thôHead) soFileĐổiThô++;

    const mồCôiBase = [];
    const mồCôiHead = [];
    const b = bócBảng(nộiBase, (id) => mồCôiBase.push(id));
    const h = bócBảng(nộiHead, (id) => mồCôiHead.push(id));
    if (mồCôiBase.length || mồCôiHead.length) {
      cảnhBáoBảng.push({
        file: rel,
        base: mồCôiBase.length,
        head: mồCôiHead.length,
        // base nhiều mồ côi hơn head ⇒ bảng vừa được NỐI LẠI. Mọi ID "thêm" ở file này rất có
        // thể chỉ là dòng cũ vừa nhìn thấy được, không phải phạm vi mới. Không nói ra thì người
        // đọc kết luận ngược hẳn: "commit này thêm 11 test case".
        banGoNoiLai: mồCôiBase.length > mồCôiHead.length,
        viDu: [...new Set([...mồCôiBase, ...mồCôiHead])].slice(0, 5),
      });
    }
    const ngữBase = hash(JSON.stringify(b));
    const ngữHead = hash(JSON.stringify(h));
    if (ngữBase === ngữHead) continue;

    const ids = new Set([...Object.keys(b), ...Object.keys(h)]);
    for (const id of [...ids].sort()) {
      if (!b[id]) { thayĐổi.push({ file: rel, id, trangThai: 'thêm', truong: Object.keys(h[id]) }); continue; }
      if (!h[id]) { thayĐổi.push({ file: rel, id, trangThai: 'xoá', truong: Object.keys(b[id]) }); continue; }
      const đổi = [];
      for (const k of new Set([...Object.keys(b[id]), ...Object.keys(h[id])])) {
        if (b[id][k] !== h[id][k]) đổi.push(k);
      }
      if (đổi.length) thayĐổi.push({ file: rel, id, trangThai: 'sửa', truong: đổi.sort() });
    }
  }

  /* ── Xuất ────────────────────────────────────────────────────────────────────────────────── */
  const đếm = { thêm: 0, sửa: 0, xoá: 0 };
  for (const t of thayĐổi) đếm[t.trangThai]++;

  // Tự khai GIỚI HẠN (ý tưởng từ archify `limitations`): một báo cáo không nói nó KHÔNG thấy được
  // gì sẽ bị đọc rộng hơn cái nó đo — đúng lỗi đã mắc hai lần trong repo này.
  const gioiHan = [
    'Chỉ thấy thay đổi trong BẢNG markdown có ô đầu là ID canon. Sửa ở văn xuôi, sơ đồ Mermaid, hay danh sách gạch đầu dòng KHÔNG được tính.',
    'Không suy ra tác động: hai ID cùng đổi không có nghĩa chúng liên quan nhau. Chuỗi truy vết vẫn phải do người/agent đọc.',
    'Không biết thay đổi nào cần CR. Đổi baseline hay không là phán đoán nghiệp vụ.',
    'File đổi thô mà không đổi ngữ nghĩa (định dạng, chính tả ngoài bảng) bị bỏ qua có chủ đích — xem `soFileDoiTho` để biết chênh lệch.',
    'Sửa một bảng bị cắt đôi làm những dòng cũ hiện ra và bị đếm là "thêm". Có cờ `banGoNoiLai` thì đừng đọc con số "thêm" là phạm vi mới.',
  ];

  const ra = {
    docsDir: DOCS,
    base: BASE,
    head: HEAD === null ? '(cây làm việc)' : HEAD,
    soFileDoiTho: soFileĐổiThô,
    soFileDoiNguNghia: new Set(thayĐổi.map((t) => t.file)).size,
    dem: đếm,
    thayDoi: thayĐổi,
    canhBaoBang: cảnhBáoBảng,
    gioiHan,
  };

  if (PLAIN) {
    console.log(`Diff ngữ nghĩa: ${BASE} → ${ra.head}  ·  ${DOCS}`);
    if (!thayĐổi.length) {
      console.log(`  ✓ không ID nào đổi (${soFileĐổiThô} file đổi ở mức thô — định dạng/văn xuôi)`);
    } else {
      let fileHiệnTại = null;
      for (const t of thayĐổi) {
        if (t.file !== fileHiệnTại) { fileHiệnTại = t.file; console.log(`\n  ${t.file}`); }
        const dấu = { 'thêm': '+', 'sửa': '~', 'xoá': '-' }[t.trangThai];
        console.log(`    ${dấu} ${t.id}  [${t.truong.join(', ')}]`);
      }
      console.log(`\n  + ${đếm.thêm} thêm · ~ ${đếm.sửa} sửa · - ${đếm.xoá} xoá`
        + `  ·  ${ra.soFileDoiNguNghia}/${soFileĐổiThô} file đổi ngữ nghĩa/thô`);
    }
    if (cảnhBáoBảng.length) {
      console.log('\n  ⚠️  BẢNG BỊ CẮT ĐÔI — dòng có ID nhưng không tiêu đề nào ở trên, nên KHÔNG được so:');
      for (const c of cảnhBáoBảng) {
        console.log(`    · ${c.file} — base ${c.base} dòng, head ${c.head} dòng (${c.viDu.join(', ')}…)`);
        if (c.banGoNoiLai) {
          console.log('      ⚑ Bảng vừa được NỐI LẠI ở head. Các ID "thêm" trong file này rất có thể là');
          console.log('        dòng cũ vừa nhìn thấy được, KHÔNG phải phạm vi mới — đối chiếu trước khi kết luận.');
        }
      }
      console.log('      Thường do một `---` hoặc dòng trống chen giữa bảng. Sửa file rồi chạy lại,');
      console.log('      nếu không diff sẽ báo những dòng đó là "xoá" trong khi chúng vẫn nằm nguyên.');
    }
    console.log('\n  Không thấy được:');
    for (const g of gioiHan) console.log(`    · ${g}`);
  } else {
    console.log(JSON.stringify(ra, null, 2));
  }
  process.exit(thayĐổi.length ? 1 : 0);

}
