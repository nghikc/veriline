#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
/*
 * ba-toolkit/scripts/gantt.js — ĐỌC một khối Mermaid `gantt` thành bảng (nhóm · việc · người làm · bắt đầu · số ngày) và VẼ
 * nó thành SVG tĩnh kiểu bảng-kế-hoạch: cột bên trái + thanh thời gian bên phải, thanh tổng cho mỗi nhóm, đường phụ thuộc,
 * mốc, ngày nghỉ/lễ tô nền. Zero-dependency, CommonJS. Dùng chung cho `ba-portal` (dựng sẵn lúc build) và
 * `ba-diagram export` (`figure.js` — không cần Chrome cho gantt).
 *
 *   node .claude/skills/ba-toolkit/scripts/gantt.js <file.md|file.mmd> [--index N] [--json] [--svg <ra.svg>]
 *   require('./gantt.js') → { đọcGantt(src), vẽGantt(model), làGantt(src) }
 * Exit: 0 đọc được · 1 khối không đọc được (in lý do — nơi gọi rơi về Mermaid vẽ như cũ) · 2 sai đầu vào.
 *
 * VÌ SAO CÓ (docs/decisions/39): Mermaid `gantt` chỉ có thanh — người xem phải dò trục để biết việc bắt đầu ngày nào,
 * dài mấy ngày, ai làm. Người dùng muốn hình tổng quan kiểu bảng kế hoạch (Task · Owner · Start · Days + thanh). Nguồn
 * vẫn là khối ```mermaid gantt``` trong `.md` (diff được, portal cũ vẫn vẽ được) — ở đây chỉ thêm một cách VẼ.
 *
 * Cú pháp đọc được (con của Mermaid gantt): `title` · `dateFormat YYYY-MM-DD` (chỉ định dạng này) · `excludes weekends,
 * <thứ>, YYYY-MM-DD…` · `section <nhóm>` · `<Tên> · <Người làm> :[done|active|crit|milestone,…] [id,] <bắt đầu>, <dài>`
 * với bắt đầu = ngày hoặc `after a [b…]`, dài = `Nd` · `Nw` · ngày kết thúc; chỉ một tham số = nối sau việc liền trước.
 * Người làm KHÔNG bắt buộc: phần sau ` · ` cuối cùng của tên. `axisFormat`/`tickInterval`/`todayMarker`/`%%` bỏ qua.
 *
 * Cách tính (theo Mermaid): `Nd` = N ngày LÀM (ngày trong `excludes` không tính, thanh kéo dài qua chúng); `Nw` = 7N ngày
 * làm. Số ngày của NHÓM = ngày làm từ việc sớm nhất tới việc muộn nhất của nhóm (mốc chiếm 1 ngày).
 *
 * gioiHan: không đọc `until`, giờ/phút (`h`, `m`), `dateFormat` khác, `includes`, `weekend friday`, `vert`, `click` có
 * tham số — gặp là trả { ok:false, lýDo } để nơi gọi dùng Mermaid. KHÁC Mermaid một chỗ có chủ đích: việc bắt đầu rơi vào
 * ngày nghỉ được dời tới ngày làm kế tiếp (Mermaid vẽ thanh từ ngày nghỉ) — số ngày không đổi. Không kiểm việc có đúng
 * kế hoạch nghiệp vụ không; chỉ tính ngày từ chính khối.
 */
const fs = require('fs');
const path = require('path');

const NGÀY = 86400000;
const THỨ = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const ddmm = (t) => { const d = new Date(t); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };
const ngàyTừ = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null; };

function làGantt(src) { return /^\s*gantt\b/.test(String(src).replace(/^\s*%%.*\n/gm, '')); }

/** Mermaid gantt → { ok, lýDo?, tiêuĐề, nghỉ: {cuốiTuần, thứ:Set, ngày:Set}, nhóm:[{tên, việc:[…]}], việc:[…] } */
function đọcGantt(src) {
  const hỏng = (lýDo, dòng) => ({ ok: false, lýDo: dòng ? `dòng ${dòng}: ${lýDo}` : lýDo });
  const dòng = String(src).split('\n');
  let tiêuĐề = null, địnhDạng = null, đãThấy = false, tươngĐối = false;
  const nghỉ = { thứ: new Set(), ngày: new Set() };
  const nhóm = []; const việc = []; const theoId = new Map();
  let nhómHiện = null;
  for (let i = 0; i < dòng.length; i++) {
    const l = dòng[i].replace(/%%.*$/, '').trim();
    if (!l) continue;
    if (!đãThấy) { if (!/^gantt\b/.test(l)) return hỏng('không phải gantt'); đãThấy = true; continue; }
    let m;
    if ((m = /^title\s+(.+)$/.exec(l))) { tiêuĐề = m[1].trim(); continue; }
    if ((m = /^dateFormat\s+(\S+)/.exec(l))) { địnhDạng = m[1]; if (địnhDạng !== 'YYYY-MM-DD') return hỏng(`dateFormat ${địnhDạng} — chỉ đọc YYYY-MM-DD`, i + 1); continue; }
    if ((m = /^excludes\s+(.+)$/.exec(l))) {
      for (const x of m[1].split(/[,\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)) {
        if (x === 'weekends') { nghỉ.thứ.add(0); nghỉ.thứ.add(6); } else if (x in THỨ) nghỉ.thứ.add(THỨ[x]);
        else if (ngàyTừ(x) !== null) nghỉ.ngày.add(ngàyTừ(x)); else return hỏng(`excludes "${x}" không đọc được`, i + 1);
      }
      continue;
    }
    if (/^(includes|weekend|until)\b/.test(l)) return hỏng(`"${l.split(/\s/)[0]}" chưa hỗ trợ`, i + 1);
    if ((m = /^axisFormat\s+(.+)$/.exec(l))) { tươngĐối = /%[WU]/.test(m[1]) && !/%[dejbBm]/.test(m[1]); continue; }
    if (/^(axisFormat|tickInterval|todayMarker|accTitle|accDescr|displayMode|inclusiveEndDates|topAxis)\b/.test(l)) continue;
    if (/^click\b/.test(l)) continue;
    if ((m = /^section\s+(.+)$/.exec(l))) { nhómHiện = { tên: m[1].trim(), việc: [] }; nhóm.push(nhómHiện); continue; }
    const hai = l.indexOf(':');
    if (hai < 0) return hỏng(`không hiểu "${l}"`, i + 1);
    let tên = l.slice(0, hai).trim(); let ngườiLàm = null;
    const cắt = tên.lastIndexOf(' · ');
    if (cắt > 0) { ngườiLàm = tên.slice(cắt + 3).trim() || null; tên = tên.slice(0, cắt).trim(); }
    const thamSố = l.slice(hai + 1).split(',').map((s) => s.trim()).filter((s) => s !== '');
    const nhãn = new Set();
    while (thamSố.length && /^(done|active|crit|milestone)$/.test(thamSố[0])) nhãn.add(thamSố.shift());
    if (thamSố.length && /^vert$/.test(thamSố[0])) return hỏng('"vert" chưa hỗ trợ', i + 1);
    let id = null, bắtĐầuS = null, dàiS = null;
    if (thamSố.length === 1) [dàiS] = thamSố;
    else if (thamSố.length === 2) [bắtĐầuS, dàiS] = thamSố;
    else if (thamSố.length === 3) [id, bắtĐầuS, dàiS] = thamSố;
    else return hỏng(`việc "${tên}" có ${thamSố.length} tham số`, i + 1);
    const v = { tên, ngườiLàm, id: id || `_v${việc.length + 1}`, nhãn: [...nhãn], sau: [], dòng: i + 1, nhóm: nhómHiện ? nhómHiện.tên : null };
    // bắt đầu
    if (!bắtĐầuS) {
      const trước = việc[việc.length - 1];
      if (!trước) return hỏng(`việc đầu "${tên}" thiếu ngày bắt đầu`, i + 1);
      v.bắtĐầu = trước.kết; v.sau = [trước.id];
    } else if ((m = /^after\s+(.+)$/.exec(bắtĐầuS))) {
      const ids = m[1].split(/\s+/).filter(Boolean);
      for (const x of ids) if (!theoId.has(x)) return hỏng(`"after ${x}" — chưa có việc id ${x} phía trên`, i + 1);
      v.bắtĐầu = Math.max(...ids.map((x) => theoId.get(x).kết)); v.sau = ids;
    } else if (ngàyTừ(bắtĐầuS) !== null) v.bắtĐầu = ngàyTừ(bắtĐầuS);
    else return hỏng(`ngày bắt đầu "${bắtĐầuS}" không đọc được`, i + 1);
    v.bắtĐầu = ngàyLàm(v.bắtĐầu, nghỉ);
    // độ dài
    if ((m = /^(\d+)([dw])$/.exec(dàiS))) {
      const n = +m[1] * (m[2] === 'w' ? 7 : 1);
      v.ngàyLàm = n;
      let d = v.bắtĐầu, đếm = 0;
      while (đếm < n) { if (!làNghỉ(d, nghỉ)) đếm++; d += NGÀY; }
      v.kết = d;
    } else if (ngàyTừ(dàiS) !== null) {
      v.kết = ngàyTừ(dàiS);
      if (v.kết < v.bắtĐầu) return hỏng(`việc "${tên}" kết thúc trước khi bắt đầu`, i + 1);
      v.ngàyLàm = đếmLàm(v.bắtĐầu, v.kết, nghỉ);
    } else return hỏng(`độ dài "${dàiS}" chưa hỗ trợ (chỉ Nd, Nw hoặc ngày kết thúc)`, i + 1);
    if (nhãn.has('milestone')) { v.mốc = v.bắtĐầu + Math.floor((v.kết - v.bắtĐầu) / NGÀY / 2) * NGÀY; v.ngàyLàm = 0; }
    việc.push(v); theoId.set(v.id, v);
    if (nhómHiện) nhómHiện.việc.push(v);
  }
  if (!đãThấy) return hỏng('khối rỗng');
  if (!việc.length) return hỏng('không có việc nào');
  for (const g of nhóm) {
    if (!g.việc.length) continue;
    g.bắtĐầu = Math.min(...g.việc.map((v) => (v.mốc !== undefined ? v.mốc : v.bắtĐầu)));
    g.kết = Math.max(...g.việc.map((v) => (v.mốc !== undefined ? v.mốc + NGÀY : v.kết)));
    g.ngàyLàm = đếmLàm(g.bắtĐầu, g.kết, nghỉ);
  }
  return { ok: true, tiêuĐề, nghỉ, nhóm, việc, tươngĐối };
}
function làNghỉ(t, nghỉ) { return nghỉ.thứ.has(new Date(t).getUTCDay()) || nghỉ.ngày.has(t); }
function ngàyLàm(t, nghỉ) { let d = t, n = 0; while (làNghỉ(d, nghỉ) && n++ < 366) d += NGÀY; return d; }
function đếmLàm(a, b, nghỉ) { let n = 0; for (let d = a; d < b; d += NGÀY) if (!làNghỉ(d, nghỉ)) n++; return n; }

/* ── Vẽ ──────────────────────────────────────────────────────────────────────────────── */
const MÀU = { kếHoạch: '#4f6ef7', đangLàm: '#1a9e86', xong: '#a7adb7', găng: '#e0384b', mốc: '#1f2430', tổng: '#1f2430',
  nghỉ: '#eef0f3', lễ: '#fde8e8', lưới: '#e7e9ee', chữ: '#1f2430', mờ: '#6b7280', nềnNhóm: '#f6f7f9', nối: '#9aa1ab' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const màuViệc = (v) => (v.nhãn.includes('done') ? MÀU.xong : v.nhãn.includes('crit') ? MÀU.găng : v.nhãn.includes('active') ? MÀU.đangLàm : MÀU.kếHoạch);

function vẽGantt(g, opt = {}) {
  const cóNgười = g.việc.some((v) => v.ngườiLàm);
  // Trục tương đối (`axisFormat Tuan %W` — lộ trình chưa chốt ngày): in "Tuần N" tính từ việc sớm nhất, KHÔNG in ngày
  // cụ thể — in ngày là khẳng định một cam kết mà nguồn nói rõ là chưa có.
  const gốcTuần = Math.min(...g.việc.map((v) => (v.mốc !== undefined ? v.mốc : v.bắtĐầu)));
  const nhãnNgày = (t) => (g.tươngĐối ? `Tuần ${Math.floor((t - gốcTuần) / NGÀY / 7) + 1}` : ddmm(t));
  const dàiNhất = Math.max(...g.việc.map((v) => v.tên.length + (v.nhóm ? 2 : 0)), ...g.nhóm.map((n) => n.tên.length));
  const hàng = [];
  const lẻ = g.việc.filter((v) => !v.nhóm);
  for (const v of lẻ) hàng.push({ loại: 'việc', v });
  for (const n of g.nhóm) { if (!n.việc.length) continue; hàng.push({ loại: 'nhóm', n }); for (const v of n.việc) hàng.push({ loại: 'việc', v }); }
  const đầu = Math.min(...g.việc.map((v) => (v.mốc !== undefined ? v.mốc : v.bắtĐầu)));
  const cuối = Math.max(...g.việc.map((v) => (v.mốc !== undefined ? v.mốc + 2 * NGÀY : v.kết))) + NGÀY;
  const sốNgày = Math.round((cuối - đầu) / NGÀY);
  const px = sốNgày <= 45 ? 25 : sốNgày <= 120 ? 10 : 4;
  const cột = [['Công việc', Math.round(Math.max(150, Math.min(300, dàiNhất * 6.8 + 30))), 'start'], ...(cóNgười ? [['Người làm', 78, 'start']] : []), ['Bắt đầu', g.tươngĐối ? 70 : 62, 'end'], ['Số ngày', 56, 'end']];
  const rộngBảng = cột.reduce((s, c) => s + c[1], 0);
  const TIÊU = g.tiêuĐề ? 34 : 6, ĐẦU = 44, H = 26, CHÚ = 34;
  // lề phải đủ cho nhãn mốc cuối trục ("Tuần 11", "03/11") — tính theo px/ngày thì trục tuần (10px) cắt mất nhãn
  const lềPhải = g.việc.some((v) => v.mốc !== undefined) ? 64 : 8;
  const rộng = rộngBảng + sốNgày * px + lềPhải, cao = TIÊU + ĐẦU + hàng.length * H + CHÚ;
  const x0 = rộngBảng, y0 = TIÊU + ĐẦU;
  const xNgày = (t) => x0 + ((t - đầu) / NGÀY) * px;
  const o = [];
  o.push(`<svg xmlns="http://www.w3.org/2000/svg" class="ba-gantt" width="${rộng}" height="${cao}" viewBox="0 0 ${rộng} ${cao}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="12" role="img" aria-label="${esc(g.tiêuĐề || 'Kế hoạch')}">`);
  o.push(`<rect width="${rộng}" height="${cao}" fill="#fff"/>`);
  if (g.tiêuĐề) o.push(`<text x="4" y="22" font-size="16" font-weight="700" fill="${MÀU.chữ}">${esc(g.tiêuĐề)}</text>`);
  // nền hàng nhóm
  hàng.forEach((h, i) => { if (h.loại === 'nhóm') o.push(`<rect x="0" y="${y0 + i * H}" width="${rộng}" height="${H}" fill="${MÀU.nềnNhóm}"/>`); });
  // ngày nghỉ / lễ
  const lễ = [...g.nghỉ.ngày].filter((t) => t >= đầu && t < cuối).sort();
  if (px >= 4) for (let t = đầu; t < cuối; t += NGÀY) {
    const làLễ = g.nghỉ.ngày.has(t), làCT = g.nghỉ.thứ.has(new Date(t).getUTCDay());
    if (làLễ || làCT) o.push(`<rect x="${xNgày(t)}" y="${TIÊU + 22}" width="${px}" height="${ĐẦU - 22 + hàng.length * H}" fill="${làLễ ? MÀU.lễ : MÀU.nghỉ}"/>`);
  }
  // đầu trục: tháng + ngày
  o.push(`<rect x="0" y="${TIÊU}" width="${rộng}" height="${ĐẦU}" fill="${MÀU.nềnNhóm}" fill-opacity=".6"/>`);
  let thángTrước = -1;
  for (let t = đầu; t < cuối; t += NGÀY) {
    const d = new Date(t), x = xNgày(t);
    if (g.tươngĐối) {
      const k = Math.round((t - gốcTuần) / NGÀY);
      if (k % 7 === 0) {
        o.push(`<line x1="${x}" y1="${TIÊU}" x2="${x}" y2="${y0 + hàng.length * H}" stroke="${MÀU.lưới}" stroke-width=".6"/>`);
        if (7 * px >= 34) o.push(`<text x="${x + 4}" y="${TIÊU + 37}" font-size="10" fill="${MÀU.mờ}">Tuần ${k / 7 + 1}</text>`);
        else if (k % 28 === 0) o.push(`<text x="${x + 2}" y="${TIÊU + 37}" font-size="10" fill="${MÀU.mờ}">T${k / 7 + 1}</text>`);
      }
      continue;
    }
    if (d.getUTCMonth() !== thángTrước) {
      thángTrước = d.getUTCMonth();
      if (t !== đầu) o.push(`<line x1="${x}" y1="${TIÊU}" x2="${x}" y2="${y0 + hàng.length * H}" stroke="${MÀU.lưới}"/>`);
      o.push(`<text x="${x + 4}" y="${TIÊU + 15}" font-weight="600" fill="${MÀU.chữ}">Th${d.getUTCMonth() + 1}${d.getUTCMonth() === 0 || t === đầu ? ' ' + d.getUTCFullYear() : ''}</text>`);
    }
    if (px >= 16) {
      o.push(`<line x1="${x}" y1="${TIÊU + 22}" x2="${x}" y2="${y0 + hàng.length * H}" stroke="${MÀU.lưới}" stroke-width=".6"/>`);
      o.push(`<text x="${x + px / 2}" y="${TIÊU + 37}" text-anchor="middle" font-size="11" fill="${MÀU.mờ}">${d.getUTCDate()}</text>`);
    } else if (d.getUTCDay() === 1) {
      o.push(`<line x1="${x}" y1="${TIÊU + 22}" x2="${x}" y2="${y0 + hàng.length * H}" stroke="${MÀU.lưới}" stroke-width=".6"/>`);
      if (px >= 6) o.push(`<text x="${x + 2}" y="${TIÊU + 37}" font-size="10" fill="${MÀU.mờ}">${d.getUTCDate()}</text>`);
    }
  }
  // tiêu đề cột bảng
  let cx = 0;
  for (const [t, w, a] of cột) { o.push(`<text x="${a === 'end' ? cx + w - 8 : cx + 8}" y="${TIÊU + 37}" text-anchor="${a}" font-size="11" font-weight="600" fill="${MÀU.chữ}">${t}</text>`); cx += w; }
  // lưới bảng
  o.push(`<line x1="0" y1="${y0}" x2="${rộng}" y2="${y0}" stroke="${MÀU.lưới}"/>`);
  hàng.forEach((_, i) => o.push(`<line x1="0" y1="${y0 + (i + 1) * H}" x2="${rộng}" y2="${y0 + (i + 1) * H}" stroke="${MÀU.lưới}" stroke-width=".6"/>`));
  cx = 0; for (const [, w] of cột) { cx += w; o.push(`<line x1="${cx}" y1="${TIÊU}" x2="${cx}" y2="${y0 + hàng.length * H}" stroke="${MÀU.lưới}"/>`); }
  // ô bảng + thanh
  const yHàng = new Map();
  const khối = [];                              // mọi thanh/mốc đã vẽ {hàng, a, b} — để đường nối né
  const cắtChữ = (s, w) => { const max = Math.floor((w - 14) / 6.6); return s.length > max ? s.slice(0, max - 1) + '…' : s; };
  hàng.forEach((h, i) => {
    const y = y0 + i * H, yc = y + H / 2 + 4;
    const ôs = h.loại === 'nhóm'
      ? [h.n.tên, ...(cóNgười ? [''] : []), nhãnNgày(h.n.bắtĐầu), String(h.n.ngàyLàm)]
      : [h.v.tên, ...(cóNgười ? [h.v.ngườiLàm || ''] : []), nhãnNgày(h.v.mốc !== undefined ? h.v.mốc : h.v.bắtĐầu), String(h.v.ngàyLàm)];
    let x = 0;
    ôs.forEach((s, k) => {
      const [, w, a] = cột[k];
      const lùi = h.loại === 'việc' && k === 0 && h.v.nhóm ? 14 : 0;
      const đậm = h.loại === 'nhóm' ? ' font-weight="700"' : (k === 0 ? '' : '');
      const màu = h.loại === 'việc' && (k === 1 && cóNgười) ? MÀU.mờ : MÀU.chữ;
      o.push(`<text x="${a === 'end' ? x + w - 8 : x + 8 + lùi}" y="${yc}" text-anchor="${a}"${đậm} fill="${màu}">${esc(cắtChữ(s, w - lùi))}</text>`);
      x += w;
    });
    if (h.loại === 'nhóm') {
      const a = xNgày(h.n.bắtĐầu), b = xNgày(h.n.kết), yb = y + H / 2 - 3;
      khối.push({ hàng: i, a, b });
      o.push(`<path d="M${a} ${yb + 8}V${yb}H${b}V${yb + 8}" fill="none" stroke="${MÀU.tổng}" stroke-width="2"/><rect x="${a}" y="${yb}" width="${b - a}" height="5" fill="${MÀU.tổng}"/>`);
    } else {
      const v = h.v;
      if (v.mốc !== undefined) {
        const mx = xNgày(v.mốc) + px / 2, my = y + H / 2;
        yHàng.set(v.id, { y: my, a: mx - 7, b: mx + 7, hàng: i, mốc: mx, đáy: my + 7 });
        khối.push({ hàng: i, a: mx - 7, b: mx + 7 });
        o.push(`<path d="M${mx} ${my - 7}L${mx + 7} ${my}L${mx} ${my + 7}L${mx - 7} ${my}Z" fill="${MÀU.mốc}"/><text x="${mx + 11}" y="${my + 4}" font-weight="700" font-size="11" fill="${MÀU.chữ}">${nhãnNgày(v.mốc)}</text>`);
      } else {
        const a = xNgày(v.bắtĐầu), b = Math.max(xNgày(v.kết), a + 3), yb = y + 7;
        yHàng.set(v.id, { y: y + H / 2, a, b, hàng: i, đáy: yb + H - 14 });
        khối.push({ hàng: i, a, b });
        o.push(`<rect x="${a + 1}" y="${yb}" width="${b - a - 2}" height="${H - 14}" rx="4" fill="${màuViệc(v)}"><title>${esc(v.tên)} · ${nhãnNgày(v.bắtĐầu)} → ${nhãnNgày(v.kết - NGÀY)} · ${v.ngàyLàm} ngày làm</title></rect>`);
      }
    }
  });
  // đường phụ thuộc (after) — đoạn dọc đặt ở chỗ đè ÍT thanh nhất của các hàng nằm giữa. Ứng viên: sát trái điểm bắt
  // đầu của việc sau (x = xs-5; thanh tổng nhóm và việc song song đều bắt đầu ở xs nên đường đi gọn bên trái chúng) hoặc
  // sau điểm kết của việc trước (x = xe+5, rồi đi ngang dọc mép hàng — mép hàng không có thanh — về xs-5). Bản cũ luôn đi
  // xe+4 rồi ngang giữa hai hàng: việc nối sát (xs = xe) vẽ ngược qua thanh khác và thanh tổng của nhóm.
  const đè = (x, h1, h2) => khối.filter((k) => k.hàng > Math.min(h1, h2) && k.hàng < Math.max(h1, h2) && x >= k.a - 1 && x <= k.b + 1).length;
  for (const v of g.việc) for (const p of v.sau) {
    const A = yHàng.get(p), B = yHàng.get(v.id);
    if (!A || !B || A.hàng === B.hàng) continue;
    const xe = A.b, xs = B.a, xuống = B.hàng > A.hàng;
    const mépB = xuống ? B.y - H / 2 : B.y + H / 2;
    const cáchĐi = [];
    const t1 = xs - 5;
    // điểm ra: đi ngang từ đầu kết nếu t1 nằm sau nó; mốc mà t1 nằm trước tâm thì ra từ đỉnh trái; thanh mà t1 nằm trong
    // thân thì ra từ đáy (đường "rơi" khỏi thanh ngay trước điểm kết)
    let ra = null;
    if (t1 >= xe) ra = `M${xe} ${A.y}H${t1}`;
    else if (A.mốc !== undefined && t1 <= A.a) ra = `M${A.a} ${A.y}H${t1}`;
    else if (A.mốc === undefined && t1 >= A.a + 2) ra = `M${t1} ${xuống ? A.đáy : A.y - H / 2 + 7}`;
    if (ra) cáchĐi.push({ d: `${ra}V${B.y}H${xs}`, đè: đè(t1, A.hàng, B.hàng), ưu: 0 });
    const t2 = Math.max(xe + 5, t1);
    cáchĐi.push({ d: t2 <= t1 ? `M${xe} ${A.y}H${t1}V${B.y}H${xs}` : `M${xe} ${A.y}H${t2}V${mépB}H${t1}V${B.y}H${xs}`, đè: đè(t2, A.hàng, B.hàng), ưu: 1 });
    cáchĐi.sort((a, b) => a.đè - b.đè || a.ưu - b.ưu);
    o.push(`<path d="${cáchĐi[0].d}" fill="none" stroke="${MÀU.nối}" stroke-width="1"/>`);
  }
  // chú giải
  const yl = y0 + hàng.length * H + 22; let lx = 4;
  const mục = [];
  const cóNhãn = (n) => g.việc.some((v) => v.nhãn.includes(n) && !v.nhãn.includes('milestone'));
  if (g.việc.some((v) => v.mốc === undefined && !v.nhãn.some((n) => n !== 'milestone'))) mục.push(['ô', MÀU.kếHoạch, 'Kế hoạch']);
  if (cóNhãn('active')) mục.push(['ô', MÀU.đangLàm, 'Đang làm']);
  if (cóNhãn('done')) mục.push(['ô', MÀU.xong, 'Xong']);
  if (cóNhãn('crit')) mục.push(['ô', MÀU.găng, 'Găng']);
  if (g.việc.some((v) => v.mốc !== undefined)) mục.push(['mốc', MÀU.mốc, 'Mốc']);
  if (g.nghỉ.thứ.size) mục.push(['ô', MÀU.nghỉ, 'Ngày nghỉ']);
  if (lễ.length) mục.push(['ô', MÀU.lễ, `Lễ: ${lễ.map(ddmm).join(', ')}`]);
  for (const [k, c, t] of mục) {
    o.push(k === 'mốc' ? `<path d="M${lx + 6} ${yl - 10}L${lx + 12} ${yl - 4}L${lx + 6} ${yl + 2}L${lx} ${yl - 4}Z" fill="${c}"/>` : `<rect x="${lx}" y="${yl - 9}" width="16" height="10" rx="3" fill="${c}"/>`);
    o.push(`<text x="${lx + 22}" y="${yl}" font-size="11" fill="${MÀU.chữ}">${esc(t)}</text>`);
    lx += 22 + t.length * 6.4 + 18;
  }
  o.push('</svg>');
  return o.join('');
}

module.exports = { đọcGantt, vẽGantt, làGantt };

/* ── CLI ─────────────────────────────────────────────────────────────────────────────── */
if (require.main === module) {
  const args = process.argv.slice(2);
  const cờ = (t) => { const i = args.indexOf(t); return i >= 0 ? args[i + 1] : null; };
  const nguồn = args.find((a, i) => !a.startsWith('--') && !['--index', '--svg'].includes(args[i - 1]));
  if (!nguồn || !fs.existsSync(nguồn)) { console.error('Dùng: node .claude/skills/ba-toolkit/scripts/gantt.js <file.md|file.mmd> [--index N] [--json] [--svg <ra.svg>]'); process.exit(2); }
  const nội = fs.readFileSync(nguồn, 'utf8');
  const khối = nguồn.endsWith('.mmd') ? [nội] : [...nội.matchAll(/^```mermaid\s*\n([\s\S]*?)^```\s*$/gm)].map((m) => m[1]).filter(làGantt);
  const n = Number(cờ('--index') || 1);
  if (!khối[n - 1]) { console.error(`Không thấy khối gantt thứ ${n} trong ${nguồn} (có ${khối.length})`); process.exit(2); }
  const g = đọcGantt(khối[n - 1]);
  const gốc = g.ok ? Math.min(...g.việc.map((v) => (v.mốc !== undefined ? v.mốc : v.bắtĐầu))) : 0;
  const ddmmIn = (t) => (g.tươngĐối ? `Tuần ${Math.floor((t - gốc) / NGÀY / 7) + 1}` : ddmm(t));
  if (!g.ok) { console.log(`✗ Không đọc được gantt — ${g.lýDo}. Nơi gọi sẽ để Mermaid vẽ như cũ.`); process.exit(1); }
  if (cờ('--svg')) fs.writeFileSync(cờ('--svg'), vẽGantt(g), 'utf8');
  if (args.includes('--json')) {
    const v = (x) => ({ tên: x.tên, ngườiLàm: x.ngườiLàm, id: x.id, nhóm: x.nhóm, nhãn: x.nhãn, bắtĐầu: iso(x.mốc !== undefined ? x.mốc : x.bắtĐầu), kết: iso(x.mốc !== undefined ? x.mốc : x.kết - NGÀY), ngàyLàm: x.ngàyLàm, sau: x.sau });
    console.log(JSON.stringify({ tiêuĐề: g.tiêuĐề, nhóm: g.nhóm.filter((x) => x.việc.length).map((x) => ({ tên: x.tên, bắtĐầu: iso(x.bắtĐầu), kết: iso(x.kết - NGÀY), ngàyLàm: x.ngàyLàm })), việc: g.việc.map(v) }, null, 2));
  } else {
    const dòngIn = [];
    for (const x of g.việc.filter((v) => !v.nhóm)) dòngIn.push([x.tên, x.ngườiLàm || '', ddmmIn(x.bắtĐầu), x.ngàyLàm]);
    for (const nh of g.nhóm) { if (!nh.việc.length) continue; dòngIn.push([nh.tên.toUpperCase(), '', ddmmIn(nh.bắtĐầu), nh.ngàyLàm]); for (const x of nh.việc) dòngIn.push(['  ' + x.tên, x.ngườiLàm || '', ddmmIn(x.mốc !== undefined ? x.mốc : x.bắtĐầu), x.ngàyLàm]); }
    const w = [0, 1, 2, 3].map((k) => Math.max(...dòngIn.map((r) => String(r[k]).length), ['Công việc', 'Người làm', 'Bắt đầu', 'Số ngày'][k].length));
    const fmt = (r) => r.map((c, k) => (k >= 2 ? String(c).padStart(w[k]) : String(c).padEnd(w[k]))).join('  ');
    console.log(fmt(['Công việc', 'Người làm', 'Bắt đầu', 'Số ngày']));
    for (const r of dòngIn) console.log(fmt(r));
    if (cờ('--svg')) console.log(`\n→ ${cờ('--svg')}`);
  }
}
