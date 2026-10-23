#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
/*
 * ba-toolkit/scripts/roll-up.js — ĐẾM LẠI dòng roll-up của `test.md` TỪ CHÍNH BẢNG.
 * Zero-dependency, CommonJS. `--check` chỉ đọc; chỉ `--write` mới ghi.
 *
 * VÌ SAO TỒN TẠI — đo được, không phỏng đoán (WI-126, 20/09/2026):
 *   Dòng roll-up ở đầu mỗi `test.md` ("Tổng TC · Pass · Fail · Blocked · Skip · Chưa chạy ·
 *   % Pass · Lần chạy cuối") **gõ tay**, nên lệch dần theo mỗi CR thêm ca.
 *   Đo 6 màn: `S36` khai 48 trong khi bảng có 59 dòng · `S28` 55/59 · `S45` 33/36 ·
 *   `S35` 14/16 · `S14` 11/12 · chỉ `S11` khớp.
 *   Hệ quả không nằm ở con số: mọi câu "màn X có N ca, M ca Pass" trong tài liệu VÀ trong
 *   báo cáo `ac-verify` đều là **lời khai**, không phải phép đo. Cổng nào đọc roll-up thay
 *   vì đọc bảng là cổng xanh vì tin lời khai.
 *
 * Dùng:
 *   node roll-up.js <docsDir> [--screen S28] [--plain|--json]   # xem số thật từng màn
 *   node roll-up.js <docsDir> --check [--screen S28] [--plain]  # CHỈ ĐỌC, exit 1 nếu có màn khai lệch
 *   node roll-up.js <docsDir> --write [--screen S28]            # ghi lại roll-up cho đúng
 *
 * Exit: 0 sạch · 1 có màn khai lệch (chỉ `--check`) · 2 không đọc được nguồn.
 *
 * KHÔNG động vào ô "Lần chạy cuối" — đó là ghi chú của NGƯỜI (ngày chạy, lý do, mã CR),
 * không phải số máy đếm được. `--write` chỉ thay các ô SỐ và ô `% Pass`.
 */
const fs = require('fs');
const path = require('path');

/* ── Tham số ─────────────────────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const cờ = (t, m) => { const i = args.indexOf(t); return i >= 0 && args[i + 1] ? args[i + 1] : m; };
const CHECK = args.includes('--check');
const WRITE = args.includes('--write');
const JSON_OUT = args.includes('--json');
const PLAIN = args.includes('--plain') || (!JSON_OUT && CHECK) || (!JSON_OUT && WRITE);
const SCREEN = cờ('--screen', null);
const DOCS = path.resolve(args.find((a) => !a.startsWith('--') && a !== SCREEN) || 'docs');

if (CHECK && WRITE) { console.error('✖ `--check` và `--write` loại trừ nhau — chọn một.'); process.exit(2); }
if (!fs.existsSync(DOCS)) { console.error(`✖ Không thấy ${DOCS}`); process.exit(2); }

/* ── Bổ trợ markdown ─────────────────────────────────────────────────────────────────── */
/**
 * Cắt một dòng bảng markdown thành các ô.
 * Tôn trọng `\|` (pipe đã escape) và pipe nằm trong code span `` `a|b` `` — hai thứ này có
 * thật trong `test.md` của dự án (vd `` `trangThai=a|b` ``) và cắt ẩu là lệch hết cột.
 * Trả về mảng ô ĐÃ BỎ ô rỗng đầu/cuối do dấu `|` mép dòng sinh ra → index 0 = cột 1.
 */
function cắtÔ(dòng) {
  const ô = []; let cur = ''; let trongCode = false;
  for (let i = 0; i < dòng.length; i++) {
    const c = dòng[i];
    if (c === '\\' && dòng[i + 1] === '|') { cur += '|'; i++; continue; }
    if (c === '`') { trongCode = !trongCode; cur += c; continue; }
    if (c === '|' && !trongCode) { ô.push(cur); cur = ''; continue; }
    cur += c;
  }
  ô.push(cur);
  if (ô.length && ô[0].trim() === '') ô.shift();
  if (ô.length && ô[ô.length - 1].trim() === '') ô.pop();
  return ô.map((x) => x.trim());
}

/** Bỏ trang sức markdown để so khớp chữ: `**Pass**` → `Pass`. */
const trần = (s) => String(s).replace(/[*`_]/g, '').trim();

const làDòngNgăn = (l) => /^\s*\|?[\s:|-]*-{2,}[\s:|-]*\|?\s*$/.test(l) && l.includes('-');

/* ── Bẫy 2: định vị cột theo TIÊU ĐỀ, không dùng chỉ số cứng ───────────────────────────
 * Tiền lệ: `ba-conformance/scripts/check-tc-layer.js` hàm `đọcTiêuĐề` (vá ở WI-124) —
 * bảng TC của dự án này có 12 cột (S28…), 15 cột (S51/S52/S53), 7 cột (S50), 8 cột (S49).
 * Chỉ số cứng đọc trúng cột khác ⇒ cổng "xanh vì không đọc được dữ liệu".
 *
 * Ở đây còn thêm một biến thể mà check-tc-layer không gặp: cột trạng thái KHÔNG phải lúc
 * nào cũng mang Pass/Fail.
 *   · khuôn chuẩn      : … | Cách chạy | Trạng thái |            → "Pass" / "Chưa chạy"
 *   · S57–S60          : … | Cách chạy | Trạng thái · Kết quả |  → "Đã chạy · **Pass** *(…)*"
 *   · S49/S50/S51/S52/S53: … | Trạng thái | Kết quả |            → "Đã chạy" + "**Pass**"
 * Nên ta lấy MỌI cột có tên chạm "Trạng thái"/"Kết quả" (trừ "Kết quả mong đợi") rồi đọc
 * gộp — chứ không cãi nhau xem cột nào mới "đúng là" cột trạng thái.
 */
const LÀ_CỘT_TRẠNG_THÁI = (tên) => {
  const t = trần(tên).toLowerCase();
  if (/kết quả mong đợi|mong đợi/.test(t)) return false;
  return /trạng thái|kết quả/.test(t);
};
const LÀ_CỘT_MÃ = (tên) => /^mã( tc)?$/i.test(trần(tên));

/* ── Phân loại một ô trạng thái ────────────────────────────────────────────────────────
 * Thứ tự ưu tiên có chủ ý: Fail thắng Pass. Một ô viết "Fail → đã sửa, Pass lại" mà xếp
 * Pass là giấu mất cái Fail; xếp Fail thì cùng lắm là người phải sửa tay. Sai về phía ồn ào.
 */
const LUẬT = [
  ['Fail', /(^|[^\p{L}])fail([^\p{L}]|$)|không đạt|rớt/iu],
  ['Blocked', /(^|[^\p{L}])blocked?([^\p{L}]|$)|bị chặn|tắc/iu],
  ['Skip', /(^|[^\p{L}])skip(ped)?([^\p{L}]|$)|bỏ qua|không áp dụng/iu],
  ['Pass', /(^|[^\p{L}])pass(ed)?([^\p{L}]|$)|(^|[^\p{L}])đạt([^\p{L}]|$)|(^|[^\p{L}])xanh([^\p{L}]|$)/iu],
  ['Chưa chạy', /chưa chạy|chưa kiểm|pending|n\/a/iu],
];
const NHÓM = ['Pass', 'Fail', 'Blocked', 'Skip', 'Chưa chạy'];

function phânLoại(ôs) {
  const t = trần(ôs.filter(Boolean).join(' · '));
  for (const [nhãn, re] of LUẬT) if (re.test(t)) return nhãn;
  // Chỉ còn gạch ngang / rỗng ⇒ chưa có kết quả. Đây là quy ước có thật:
  // `| … | Chưa chạy | — |` và `| … | Đã chạy | — |` đều nghĩa là chưa có kết quả.
  if (!t || /^[—–\-\s·]*$/.test(t)) return 'Chưa chạy';
  return null; // không đọc được → báo, KHÔNG đoán (bẫy 3)
}

/* ── Duyệt cây docs ──────────────────────────────────────────────────────────────────── */
function gom(dir, lọc) {
  const ra = [];
  const đi = (d) => {
    let es = [];
    try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) đi(p); else if (lọc(e.name)) ra.push(p);
    }
  };
  đi(dir);
  return ra.sort();
}

/** Mã màn suy từ tên thư mục `S28 - CourseDetail`; không ra thì suy từ mã TC đọc được. */
function mãMàn(file, idMẫu) {
  const m = /(^|[/\\])(S\d+)\s*-\s/.exec(path.dirname(file) + path.sep);
  if (m) return m[2];
  const t = idMẫu && /^TC-(S\d+)-/.exec(idMẫu);
  return t ? t[1] : path.basename(path.dirname(file));
}

/* ── Đọc một test.md ─────────────────────────────────────────────────────────────────── */
/*
 * Bẫy 1 — mã TC có HẬU TỐ. Quy ước ghi nguồn CR của chính dự án sinh ra:
 *     `| TC-S58-24 *(CR-167)* |`  ·  `| **TC-S57-06b** |`
 * Regex đòi ô đầu CHỈ có mã bỏ qua hàng loạt dòng (đo trên S58: thấy 23/44).
 * Nên: ô đầu chỉ cần BẮT ĐẦU bằng mã (sau khi bỏ `**`), phần đuôi kệ nó.
 */
const MÃ_TC = /^\*{0,2}(TC-S\d+-\d+[a-z]?)\*{0,2}/i;

/** Tên cột roll-up → khoá nội bộ. Khuôn chuẩn 8 cột; S50 thiếu Blocked/Skip và gọi "Tổng". */
const CỘT_ROLLUP = {
  tổng: [/^tổng( tc| số tc| số)?$/i],
  Pass: [/^pass$/i, /^đạt$/i],
  Fail: [/^fail$/i, /^không đạt$/i],
  Blocked: [/^blocked?$/i, /^bị chặn$/i],
  Skip: [/^skip(ped)?$/i, /^bỏ qua$/i],
  'Chưa chạy': [/^chưa chạy$/i],
  phầnTrăm: [/^%\s*pass$/i, /^tỉ lệ pass$/i, /^tỷ lệ pass$/i],
  lầnChạy: [/^lần chạy cuối$/i, /^chạy lần cuối$/i],
};

function đọcFile(file) {
  const dòng = fs.readFileSync(file, 'utf8').split('\n');
  const kq = {
    file, màn: null, đếm: Object.fromEntries(NHÓM.map((n) => [n, 0])),
    sốDòng: 0, idTrùng: [], ôLạ: [], bỏQua: [], khai: null, rollUp: null, rollUpThừa: 0, ghiChú: [],
  };

  let cộtTT = null;       // chỉ số các cột trạng thái của BẢNG ĐANG QUÉT
  /*
   * Bẫy 3 (biến thể tốn nhất): một bảng TC bị CẮT bởi dòng trắng thành nhiều khúc, khúc sau
   * KHÔNG lặp lại hàng tiêu đề. Có thật, phổ biến: `S13` dòng 27, `S19` dòng 23/31/38/45/52/60/68.
   * Bỏ qua khúc không tiêu đề là mất hàng loạt TC — đo trước khi vá: S19 đọc 40/57, S13 13/18,
   * S27 14/19, S51 90/95. Nên: nhớ khuôn cột TC gần nhất, khúc sau trùng SỐ CỘT thì dùng lại.
   * Bảng KHÁC (từ điển thuật ngữ, ánh xạ TC→task) có tiêu đề riêng ⇒ xoá trí nhớ này.
   */
  let khuônTCCuối = null; // { vt, sốCột }
  let đãThấyTiêuĐềTC = false;
  const đãGặp = new Set();
  const mẫuMàn = SCREEN ? new RegExp(`^TC-${SCREEN}-`, 'i') : null;

  for (let i = 0; i < dòng.length; i++) {
    const l = dòng[i];
    if (!l.includes('|')) { if (!l.trim()) cộtTT = null; continue; }
    if (làDòngNgăn(l)) continue;

    const ô = cắtÔ(l);

    /* Hàng tiêu đề? (Bẫy 3: file có NHIỀU bảng — mỗi bảng tự khai cột của nó.) */
    if (ô.some(LÀ_CỘT_MÃ)) {
      const vt = [];
      ô.forEach((tên, idx) => { if (LÀ_CỘT_TRẠNG_THÁI(tên)) vt.push(idx); });
      cộtTT = vt.length ? vt : null;
      khuônTCCuối = vt.length ? { vt, sốCột: ô.length } : null;
      đãThấyTiêuĐềTC = true;
      if (!vt.length) kq.ghiChú.push(`bảng ở dòng ${i + 1} có cột "Mã" nhưng KHÔNG có cột Trạng thái/Kết quả — bỏ qua`);
      continue;
    }
    /* Tiêu đề của một bảng KHÁC (từ điển thuật ngữ, checklist test tay…) ⇒ đóng bảng đang quét.
     * Nhận ra bằng dấu hiệu chắc chắn: dòng KẾ là dòng ngăn `|---|`.
     * Nhưng KHÔNG xoá `khuônTCCuối`: có file (S19, S27) chèn hẳn bảng từ điển thuật ngữ vào
     * GIỮA, rồi CR sau lại nối thêm hàng TC bên dưới mà quên lặp tiêu đề. Khuôn giữ ở phạm vi
     * CẢ FILE, và điều kiện khớp SỐ CỘT đã đủ lọc: từ điển 2 cột ≠ bảng TC 12/15 cột. */
    if (!MÃ_TC.test(ô[0]) && làDòngNgăn(dòng[i + 1] || '')) { cộtTT = null; }

    /* Hàng roll-up? */
    const vtRoll = {};
    for (const [khoá, mẫu] of Object.entries(CỘT_ROLLUP)) {
      const idx = ô.findIndex((tên) => mẫu.some((r) => r.test(trần(tên))));
      if (idx >= 0) vtRoll[khoá] = idx;
    }
    if (vtRoll.tổng !== undefined && vtRoll.Pass !== undefined) {
      // dòng kế (bỏ qua dòng ngăn) là dữ liệu
      let j = i + 1;
      while (j < dòng.length && làDòngNgăn(dòng[j])) j++;
      const dữ = dòng[j] && dòng[j].includes('|') ? cắtÔ(dòng[j]) : null;
      if (!dữ) { kq.ghiChú.push(`roll-up ở dòng ${i + 1} không có hàng dữ liệu`); continue; }
      if (kq.rollUp) { kq.rollUpThừa++; continue; }   // bảng roll-up thứ 2 → báo, dùng bảng đầu
      const số = (k) => {
        if (vtRoll[k] === undefined) return null;
        const m = /-?\d+/.exec(trần(dữ[vtRoll[k]]) || '');
        return m ? Number(m[0]) : null;
      };
      kq.rollUp = { dòngTiêuĐề: i, dòngDữLiệu: j, cột: vtRoll, sốCột: ô.length };
      kq.khai = { tổng: số('tổng'), Pass: số('Pass'), Fail: số('Fail'), Blocked: số('Blocked'), Skip: số('Skip'), 'Chưa chạy': số('Chưa chạy') };
      continue;
    }

    /* Hàng TC? */
    const m = MÃ_TC.exec(ô[0] || '');
    if (!m) continue;
    if (!cộtTT) {
      // khúc nối tiếp không lặp tiêu đề — dùng lại khuôn TC gần nhất nếu KHỚP SỐ CỘT
      if (khuônTCCuối && ô.length === khuônTCCuối.sốCột) cộtTT = khuônTCCuối.vt;
      else { kq.bỏQua.push({ id: trần(ô[0]), dòng: i + 1, sốCột: ô.length }); continue; }
    }
    const id = m[1].toUpperCase();
    if (mẫuMàn && !mẫuMàn.test(id)) continue;
    if (!kq.màn) kq.màn = mãMàn(file, id);
    if (đãGặp.has(id)) { kq.idTrùng.push(id); continue; }  // cùng mã xuất hiện 2 lần (bảng "Còn nợ") → đếm 1
    đãGặp.add(id);
    const nhãn = phânLoại(cộtTT.map((c) => ô[c]));
    if (!nhãn) { kq.ôLạ.push({ id, ô: cộtTT.map((c) => ô[c]).join(' · ').slice(0, 60) }); continue; }
    kq.đếm[nhãn]++;
    kq.sốDòng++;
  }

  if (!kq.màn) kq.màn = mãMàn(file, null);
  if (!đãThấyTiêuĐềTC) kq.ghiChú.push('không thấy bảng TC nào có cột "Mã"');
  if (!kq.rollUp) kq.ghiChú.push('KHÔNG có dòng roll-up (bảng ngang "Tổng … Pass …")');
  if (kq.rollUpThừa) kq.ghiChú.push(`có thêm ${kq.rollUpThừa} bảng roll-up nữa — chỉ đọc/ghi bảng ĐẦU`);
  return kq;
}

/* ── Chạy ────────────────────────────────────────────────────────────────────────────── */
const files = gom(DOCS, (n) => n === 'test.md')
  .filter((f) => !SCREEN || new RegExp(`(^|[/\\\\])${SCREEN}\\s*-\\s`, 'i').test(path.dirname(f) + path.sep));
if (!files.length) { console.error(`✖ Không thấy test.md nào trong ${DOCS}${SCREEN ? ` cho màn ${SCREEN}` : ''}`); process.exit(2); }

const sốMàn = (m) => { const x = /^S(\d+)/.exec(m || ''); return x ? Number(x[1]) : 9999; };
const kết = files.map(đọcFile).sort((a, b) => sốMàn(a.màn) - sốMàn(b.màn) || a.file.localeCompare(b.file));
const lệch = [];
const khôngĐọcĐược = [];

for (const k of kết) {
  k.thật = { tổng: k.sốDòng, ...k.đếm };
  if (!k.rollUp || !k.sốDòng) {
    khôngĐọcĐược.push({ màn: k.màn, file: path.relative(DOCS, k.file), lýDo: k.ghiChú.join(' · ') || 'bảng TC rỗng', thật: k.thật });
    continue;
  }
  const sai = [];
  for (const khoá of ['tổng', ...NHÓM]) {
    const khai = k.khai[khoá];
    if (khai === null || khai === undefined) continue;   // cột không tồn tại trong khuôn file đó
    if (khai !== k.thật[khoá]) sai.push({ ô: khoá, khai, thật: k.thật[khoá] });
  }
  if (sai.length) lệch.push({ màn: k.màn, file: path.relative(DOCS, k.file), sai, khai: k.khai, thật: k.thật });
}

const phầnTrăm = (t) => (t.tổng ? `${Math.round((t.Pass / t.tổng) * 100)}%` : '0%');

/* ── --write ─────────────────────────────────────────────────────────────────────────── */
if (WRITE) {
  let sửa = 0;
  for (const k of kết) {
    if (!k.rollUp || !k.sốDòng) continue;
    const dòng = fs.readFileSync(k.file, 'utf8').split('\n');
    const ô = cắtÔ(dòng[k.rollUp.dòngDữLiệu]);
    const c = k.rollUp.cột;
    const đặt = (khoá, giáTrị) => { if (c[khoá] !== undefined && ô[c[khoá]] !== undefined) ô[c[khoá]] = String(giáTrị); };
    đặt('tổng', k.thật.tổng);
    for (const n of NHÓM) đặt(n, k.thật[n]);
    đặt('phầnTrăm', phầnTrăm(k.thật));
    // `Lần chạy cuối` KHÔNG đụng tới — ghi chú của người.
    const mới = `| ${ô.join(' | ')} |`;
    if (mới === dòng[k.rollUp.dòngDữLiệu]) continue;
    dòng[k.rollUp.dòngDữLiệu] = mới;
    fs.writeFileSync(k.file, dòng.join('\n'));
    sửa++;
    console.log(`  ✎ ${k.màn}  ${path.relative(DOCS, k.file)}`);
  }
  console.log(`\nĐã ghi lại roll-up cho ${sửa}/${kết.length} màn. Ô "Lần chạy cuối" giữ nguyên.`);
  if (khôngĐọcĐược.length) {
    console.log(`\n⚠️  ${khôngĐọcĐược.length} màn KHÔNG ghi được (không có dòng roll-up chuẩn) — phải sửa tay:`);
    for (const x of khôngĐọcĐược) console.log(`    · ${x.màn}: ${x.lýDo}`);
  }
  process.exit(0);
}

/* ── --json ──────────────────────────────────────────────────────────────────────────── */
if (JSON_OUT) {
  console.log(JSON.stringify({
    docsDir: DOCS, soMan: kết.length, soManLech: lệch.length,
    lech: lệch, khongDocDuoc: khôngĐọcĐược,
    man: kết.map((k) => ({ man: k.màn, file: path.relative(DOCS, k.file), khai: k.khai, that: k.thật, oLa: k.ôLạ, boQua: k.bỏQua, idTrung: k.idTrùng, ghiChu: k.ghiChú })),
  }, null, 2));
  process.exit(CHECK && lệch.length ? 1 : 0);
}

/* ── in cho người ────────────────────────────────────────────────────────────────────── */
const đọcĐược = kết.length - khôngĐọcĐược.length;
if (CHECK) {
  console.log(`Soát roll-up: ${kết.length} màn (đọc được ${đọcĐược}) · ${DOCS}\n`);
  if (lệch.length) {
    const w = Math.max(6, ...lệch.map((x) => x.màn.length));
    console.log(`  ${'Màn'.padEnd(w)} │ Ô          │  Khai │  Thật │ Lệch`);
    console.log(`  ${'─'.repeat(w)}─┼────────────┼───────┼───────┼──────`);
    for (const x of lệch) {
      x.sai.forEach((s, i) => {
        const lệchSố = s.thật - s.khai;
        console.log(`  ${(i ? '' : x.màn).padEnd(w)} │ ${s.ô.padEnd(10)} │ ${String(s.khai).padStart(5)} │ ${String(s.thật).padStart(5)} │ ${lệchSố > 0 ? '+' : ''}${lệchSố}`);
      });
    }
    console.log(`\n  ❌ ${lệch.length}/${đọcĐược} màn đọc được đang KHAI LỆCH. Chạy \`--write\` để đếm lại.`);
  } else console.log(`  ✓ ${đọcĐược} màn khớp bảng.`);
} else {
  console.log(`Roll-up đếm từ bảng: ${kết.length} màn · ${DOCS}\n`);
  const w = Math.max(6, ...kết.map((k) => k.màn.length));
  console.log(`  ${'Màn'.padEnd(w)} │ Tổng │ Pass │ Fail │ Block │ Skip │ Chưa │ %Pass`);
  console.log(`  ${'─'.repeat(w)}─┼──────┼──────┼──────┼───────┼──────┼──────┼──────`);
  for (const k of kết) {
    const t = k.thật;
    const cờLệch = lệch.find((x) => x.file === path.relative(DOCS, k.file)) ? ' ⚠' : '';
    console.log(`  ${k.màn.padEnd(w)} │ ${String(t.tổng).padStart(4)} │ ${String(t.Pass).padStart(4)} │ ${String(t.Fail).padStart(4)} │ ${String(t.Blocked).padStart(5)} │ ${String(t.Skip).padStart(4)} │ ${String(t['Chưa chạy']).padStart(4)} │ ${phầnTrăm(t).padStart(5)}${cờLệch}`);
  }
}

if (khôngĐọcĐược.length) {
  console.log(`\n  ⚠️  ${khôngĐọcĐược.length} màn KHÔNG đọc được roll-up (không đoán — báo để người xử lý):`);
  for (const x of khôngĐọcĐược) console.log(`    · ${x.màn} — ${x.lýDo}  (bảng đếm được: ${x.thật.tổng} TC)`);
}
const ôLạ = kết.filter((k) => k.ôLạ.length);
if (ôLạ.length) {
  console.log(`\n  ⚠️  ô Trạng thái không phân loại được (KHÔNG tính vào tổng):`);
  for (const k of ôLạ) console.log(`    · ${k.màn}: ${k.ôLạ.slice(0, 4).map((x) => `${x.id}="${x.ô}"`).join(' · ')}${k.ôLạ.length > 4 ? ` …+${k.ôLạ.length - 4}` : ''}`);
}
const bỏQua = kết.filter((k) => k.bỏQua.length);
if (bỏQua.length) {
  console.log(`\n  ⚠️  hàng có mã TC nhưng KHÔNG gắn được vào bảng nào (không đoán — báo):`);
  for (const k of bỏQua) console.log(`    · ${k.màn}: ${k.bỏQua.slice(0, 5).map((x) => `${x.id}@dòng ${x.dòng} (${x.sốCột} cột)`).join(' · ')}${k.bỏQua.length > 5 ? ` …+${k.bỏQua.length - 5}` : ''}`);
}
const trùng = kết.filter((k) => k.idTrùng.length);
if (trùng.length) {
  console.log(`\n  ℹ️  mã TC xuất hiện >1 lần (đếm 1 — thường do bảng "Còn nợ"/tổng hợp cuối file):`);
  for (const k of trùng) console.log(`    · ${k.màn}: ${[...new Set(k.idTrùng)].slice(0, 6).join(', ')}${k.idTrùng.length > 6 ? '…' : ''}`);
}

console.log('\n  Không thấy được:');
for (const g of [
  'Chỉ đếm chữ trong ô Trạng thái/Kết quả. Ô ghi "Pass" mà test thật đang đỏ → vẫn đếm Pass. Đối chiếu với code là việc của `ac-verify` / `check-tc-layer.js`.',
  'Ô "Lần chạy cuối" không được kiểm và không bị `--write` đụng vào — ngày ở đó có thể cũ hơn thực tế.',
  'Mã TC trùng chỉ đếm một lần; nếu hai dòng cùng mã có trạng thái khác nhau, lần XUẤT HIỆN ĐẦU thắng.',
]) console.log(`    · ${g}`);

process.exit(CHECK && lệch.length ? 1 : 0);
