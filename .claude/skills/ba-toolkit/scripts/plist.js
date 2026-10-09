/*
 * ba-toolkit/plist.js — đầu ra "danh sách P" cho checker mà AGENT đọc (module dùng chung, zero-dep, CommonJS).
 *
 *   const plist = require('<…>/ba-toolkit/scripts/plist.js');
 *   const groups = plist.group(items, { step: 20 });          // gộp trùng → mảng mục đã gộp (dùng cho --json)
 *   console.log(plist.render(items, { cap: 50, checked: ['…'], unchecked: [['…', 'vì …']], oan: 'ba-html-design/check-design' }));
 *
 * item = { rule, lv: '❌'|'⚠️', file, line?, where?, msg, fix? }
 *   where: chỗ đo phụ — bề rộng (`375px`), trạng thái statebar (`Lỗi`)… chuỗi hoặc MẢNG (`['375px','Lỗi']`).
 *   Bề rộng số liền nhau (cách ≤ step) gộp thành dải.
 *
 * VÌ SAO CÓ (học từ evondevKit probe.mjs): một gốc lỗi lặp ở 6 màn × 2 khổ × 4 trạng thái sinh 48 dòng giống nhau —
 * đẩy lỗi khác ra khỏi ngữ cảnh và bị NẠP LẠI ở mọi lượt sau (chi phí phiên = số lượt × ngữ cảnh). Gộp theo khoá
 * `mã luật + mô tả đã bỏ số` thì cùng gốc thành MỘT mục kèm danh sách chỗ. Trần 50 mục; phần dư chỉ ở `--json`.
 * Tiêu đề cố định buộc mỗi mục thành một dòng lúc giao (đã sửa / giữ vì …) — không mục nào biến mất im lặng.
 * Dòng `Đã kiểm / Chưa kiểm` LUÔN in, kể cả khi 0 mục: kết quả rỗng không có nghĩa là đạt.
 * Dòng cuối `Báo oan …` (opt `oan: '<skill>/<script>'`, tắt bằng `oanHint: false`) chỉ in khi CÓ mục: chỉ lối báo checker
 * sai qua `oan.js` thay vì lách (bỏ `#`, viết entity, chép script — docs/decisions/22, 24; W1).
 *
 * gioiHan: khoá gộp bỏ MỌI chữ số trong mô tả — hai lỗi khác nhau chỉ khác số (vd "7 giá trị bo góc" ở hai luật
 * cùng mã) sẽ thành một mục; checker muốn tách thì đặt chữ phân biệt vào mô tả. Thứ tự: ❌ trước ⚠️, rồi số chỗ giảm dần.
 */
'use strict';

const norm = (s) => String(s || '').replace(/\d+(?:[.,]\d+)*/g, '#').replace(/\s+/g, ' ').trim();

function ranges(vals, step) {
  const nums = [], other = [];
  for (const v of vals) { const m = /^(\d+)px$/.exec(v); if (m) nums.push(+m[1]); else other.push(v); }
  const out = [];
  [...new Set(nums)].sort((a, b) => a - b).forEach((n) => {
    const last = out[out.length - 1];
    if (last && n - last[1] <= step) last[1] = n; else out.push([n, n]);
  });
  return out.map(([a, b]) => (a === b ? `${a}px` : `${a}–${b}px`)).concat([...new Set(other)]);
}

function group(items, { step = 20 } = {}) {
  const m = new Map();
  for (const it of items) {
    const k = `${it.rule}\0${norm(it.msg)}`;
    if (!m.has(k)) m.set(k, { rule: it.rule, lv: it.lv, msg: it.msg, fix: it.fix || '', files: new Map(), where: [], n: 0 });
    const g = m.get(k);
    g.n++;
    if (it.lv === '❌') g.lv = '❌';
    if (it.file) { if (!g.files.has(it.file)) g.files.set(it.file, new Set()); if (it.line) g.files.get(it.file).add(it.line); }
    if (it.where) for (const w of [].concat(it.where)) if (w) g.where.push(String(w)); // mảng = nhiều chỗ đo (`375px` + trạng thái)
  }
  return [...m.values()]
    .map((g) => ({
      rule: g.rule, lv: g.lv, msg: g.msg, fix: g.fix, count: g.n,
      at: [...g.files].map(([f, ls]) => (ls.size ? `${f}:${[...ls].sort((a, b) => a - b).join(',')}` : f)),
      where: ranges(g.where, step),
    }))
    .sort((a, b) => (a.lv === b.lv ? b.count - a.count : a.lv === '❌' ? -1 : 1));
}

const OAN = 'node .claude/skills/ba-toolkit/scripts/oan.js';
const oanLine = (checker) => `Bộ kiểm báo sai? Ghi lại thay vì sửa tài liệu để qua mặt: ${OAN} add --checker ${checker || '<skill/script>'} --code <MÃ> --where <file:dòng> --reason "…"`;

function render(items, { cap = 50, step = 20, checked = [], unchecked = [], oan = '', oanHint = true } = {}) {
  const gs = group(items, { step });
  const nErr = gs.filter((g) => g.lv === '❌').length;
  const L = [`# Việc phải đối chiếu: ${gs.length} mục (❌ ${nErr} · ⚠️ ${gs.length - nErr}) — mỗi mục thành một dòng lúc giao: đã sửa / giữ vì …`];
  gs.slice(0, cap).forEach((g, i) => {
    const where = g.where.length ? ` · ${g.where.join(', ')}` : '';
    const more = g.count > 1 ? ` (${g.count} chỗ)` : '';
    L.push(`P${i + 1} ${g.lv} ${g.rule} · ${g.msg}${more} — ${g.at.join(' · ') || '—'}${where}${g.fix ? ` → ${g.fix}` : ''}`);
  });
  if (gs.length > cap) L.push(`(Còn ${gs.length - cap} mục — chạy lại với --json để xem đủ)`);
  L.push(`Đã kiểm: ${checked.length ? checked.join(' · ') : '—'}`);
  L.push(`Chưa kiểm: ${unchecked.length ? unchecked.map(([w, why]) => `${w} vì ${why}`).join(' · ') : '—'}`);
  if (oanHint && gs.length) L.push(oanLine(oan));
  return L.join('\n');
}

module.exports = { group, render, norm, oanLine };
