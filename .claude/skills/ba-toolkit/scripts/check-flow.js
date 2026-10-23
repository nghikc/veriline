#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
/*
 * ba-toolkit/scripts/check-flow.js — ĐẾM LỖI CẤU TRÚC của sơ đồ luồng Mermaid (`swimlane-beta` · `flowchart` · `graph`).
 * Zero-dependency, CommonJS. Chỉ đọc.
 *
 *   node .claude/skills/ba-toolkit/scripts/check-flow.js [docs | <file.md> …] [--plain|--json]
 *   node .claude/skills/ba-toolkit/scripts/check-flow.js --rules
 *
 * Luật (mỗi phát hiện một dòng `file:dòng · mã · node`):
 *   FL-QD1   điểm quyết định `{…}` có < 2 lối ra — quyết định một nhánh không phải quyết định
 *   FL-QDN   lối ra của điểm quyết định KHÔNG có nhãn — người đọc không biết nhánh nào là "Có", nhánh nào là "Không"
 *   FL-CUT   node không phải điểm kết mà không có lối ra (dead-end)
 *   FL-COI   node không phải điểm bắt đầu mà không có lối vào (mồ côi — không đường nào dẫn tới)
 *   FL-LAN   lane (`subgraph` của swimlane) rỗng
 * Exit = số phát hiện (0 sạch) · 2 không đọc được nguồn.
 *
 * Điểm đầu/kết = node hình sân vận động `([…])` hoặc tròn `((…))`, hoặc gắn lớp `startend`/`error`/`external` (hệ ngoài là biên) (`:::x` hay `class A x`).
 * Sơ đồ KHÔNG có node nào như vậy (use case, kiến trúc, ngữ cảnh) → không biết đâu là đầu/kết → BỎ QUA FL-CUT/FL-COI và
 * đếm vào "không xét đầu/kết", không nói sạch. Luật quyết định vẫn áp cho mọi sơ đồ luồng.
 *
 * VÌ SAO CÓ (docs/decisions/38): "Kiểm coverage sơ đồ" trong `conv-mermaid.md` đòi quyết định ≥2 nhánh có nhãn, không
 * dead-end — nhưng trước đây chỉ LLM/agent soát; máy chỉ kiểm cú pháp (`render-check.js`) và dấu. Ý tưởng máy cảnh báo
 * cấu trúc lấy từ bộ skill Reqwise Figma v2.0.2 (bảng "What the warnings mean"), viết lại, không chép.
 *
 * gioiHan — MÁY KHÔNG KIỂM: sơ đồ có đúng nghiệp vụ không (thiếu vai trò, nhánh bịa — việc của fact-list và
 * `ba-diagram-reviewer`) · nhãn bàn giao chéo lane có nói rõ "giao cái gì" không (phán đoán) · `stateDiagram-v2`,
 * `sequenceDiagram`, `erDiagram` · cú pháp (việc của `render-check.js`). Parser đọc dòng theo cú pháp chuẩn của toolkit
 * (`conv-mermaid.md`): id chữ-số/`_`, một câu lệnh một dòng; cạnh `~~~` (vô hình) không tính; `click`/`style`/`linkStyle`
 * bỏ qua. Nhiều câu lệnh nối `;` trên một dòng không tách.
 */
const fs = require('fs');
const path = require('path');
const RC = require(path.join(__dirname, 'rule-cover.js'));

const LUẬT = [
  ['FL-QD1', 'điểm quyết định có < 2 lối ra'],
  ['FL-QDN', 'lối ra của điểm quyết định không có nhãn'],
  ['FL-CUT', 'node không phải điểm kết mà không có lối ra (dead-end)'],
  ['FL-COI', 'node không phải điểm bắt đầu mà không có lối vào (mồ côi)'],
  ['FL-LAN', 'lane của swimlane rỗng'],
];
RC.inLuật(process.argv, LUẬT);

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const nguồn = args.filter((a) => !a.startsWith('--'));
if (!nguồn.length) nguồn.push('docs');

/* ── Gom file .md ─────────────────────────────────────────────────────────────────────── */
function gom(p, out) {
  let st; try { st = fs.statSync(p); } catch { return false; }
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const q = path.join(p, e.name);
      if (e.isDirectory()) gom(q, out); else if (e.name.endsWith('.md')) out.push(q);
    }
  } else out.push(p);
  return true;
}
const tệp = [];
for (const n of nguồn) if (!gom(path.resolve(n), tệp)) { console.error(`✖ Không đọc được: ${n}`); process.exit(2); }
const gốcIn = fs.statSync(path.resolve(nguồn[0])).isDirectory() ? path.resolve(nguồn[0]) : process.cwd();

/* ── Tách khối ```mermaid (bỏ khối nằm trong fence 4 dấu — đó là ví dụ, không phải sơ đồ) ─── */
function khối(text) {
  const dòng = text.split('\n'), ra = [];
  let ngoài = null, cur = null;
  dòng.forEach((l, i) => {
    const m = l.match(/^\s*(`{3,}|~{3,})\s*(\S*)/);
    if (cur) { if (m && m[1][0] === '`' && m[1].length === 3 && !m[2]) { ra.push(cur); cur = null; } else cur.dòng.push([i + 1, l]); return; }
    if (ngoài) { if (m && m[1] === ngoài && !m[2]) ngoài = null; return; }
    if (!m) return;
    if (m[1] === '```' && m[2] === 'mermaid') cur = { bắtĐầu: i + 1, dòng: [] };
    else ngoài = m[1];                          // fence khác (kể cả 4 dấu bọc ví dụ) — bỏ qua tới khi đóng
  });
  return ra;
}

/* ── Parser một sơ đồ luồng ──────────────────────────────────────────────────────────── */
const ĐÓNG = { '([': '])', '((': '))', '[(': ')]', '[[': ']]', '{{': '}}', '[/': '/]', '[\\': '\\]', '[': ']', '(': ')', '{': '}', '>': ']' };
function đọcHình(s, i) {                       // s[i] là ký tự mở → [loại, vị trí sau hình] | null
  const hai = s.slice(i, i + 2);
  const mở = ĐÓNG[hai] ? hai : (ĐÓNG[s[i]] ? s[i] : null);
  if (!mở) return null;
  const đóng = ĐÓNG[mở];
  let j = i + mở.length, nháy = false;
  for (; j < s.length; j++) {
    if (s[j] === '"') nháy = !nháy;
    else if (!nháy && s.startsWith(đóng, j)) {
      // `[/…/]` cũng có thể đóng bằng `\]` (hình thang) — chấp nhận cả hai
      return [mở, j + đóng.length];
    } else if (!nháy && (mở === '[/' || mở === '[\\') && (s.startsWith('/]', j) || s.startsWith('\\]', j))) return [mở, j + 2];
  }
  return null;
}
const RE_CẠNH = /^\s*(<?)(?:(-{2,}>|-{3,}|={2,}>|={3,}|-\.+->|-\.+-|-{2,}[xo]|={2,}[xo]|-\.+-[xo]|~{3,})(?:\s*\|([^|]*)\|)?|(--|==|-\.)\s*(.+?)\s*(-{2,}>|-{3,}|={2,}>|={3,}|\.+->|\.+-|-{2,}[xo]))/;

function phânTích(dòngKhối) {
  const node = new Map();                       // id → { quyếtĐịnh, đầuKết, dòng, lane }
  const cạnh = [];                              // { từ, tới, nhãn, dòng }
  const lane = [];                              // { id, dòng, số }
  const ngăn = [];                              // ngăn xếp subgraph đang mở
  let loại = null;
  const gặp = (id, dòng, hình, lớp) => {
    let n = node.get(id);
    if (!n) { n = { id, dòng, quyếtĐịnh: false, đầuKết: false, lane: ngăn.length ? ngăn[ngăn.length - 1] : null }; node.set(id, n); if (n.lane) n.lane.số++; }
    if (hình === '{') n.quyếtĐịnh = true;
    if (hình === '([' || hình === '((') n.đầuKết = true;
    if (lớp && /^(startend|error|external)$/.test(lớp)) n.đầuKết = true;
  };
  for (const [số, thô] of dòngKhối) {
    const l = thô.replace(/%%.*$/, '').trim();
    if (!l) continue;
    if (!loại) { const m = l.match(/^(swimlane-beta|flowchart|graph)\b/); loại = m ? m[1] : 'khác'; if (!m) break; continue; }
    let m;
    if ((m = l.match(/^subgraph\s+([A-Za-z0-9_]+)/))) { const g = { id: m[1], dòng: số, số: 0 }; lane.push(g); ngăn.push(g); continue; }
    if (/^subgraph\b/.test(l)) { const g = { id: l, dòng: số, số: 0 }; lane.push(g); ngăn.push(g); continue; }
    if (l === 'end') { ngăn.pop(); continue; }
    if ((m = l.match(/^class\s+([A-Za-z0-9_,\s]+?)\s+([A-Za-z0-9_]+)\s*$/))) {
      for (const id of m[1].split(',').map((x) => x.trim()).filter(Boolean)) if (/^(startend|error|external)$/.test(m[2])) { gặp(id, số, null, m[2]); }
      continue;
    }
    if (/^(classDef|style|linkStyle|click|direction|accTitle|accDescr|title)\b/.test(l)) continue;
    // Câu lệnh: nhóm (id hình? :::lớp? (& …)*) (cạnh nhóm)*
    let i = 0, trước = null, cạnhChờ = null;
    const đọcNhóm = () => {
      const ids = [];
      for (;;) {
        const r = l.slice(i).match(/^\s*([A-Za-z0-9_]+)/);
        if (!r) break;
        i += r[0].length;
        const id = r[1];
        let hình = null;
        const h = đọcHình(l, i);
        if (h) { hình = h[0]; i = h[1]; }
        let lớp = null;
        const c = l.slice(i).match(/^:::([A-Za-z0-9_-]+)/);
        if (c) { lớp = c[1]; i += c[0].length; }
        gặp(id, số, hình, lớp);
        ids.push(id);
        const a = l.slice(i).match(/^\s*&/);
        if (!a) break;
        i += a[0].length;
      }
      return ids;
    };
    for (;;) {
      const nhóm = đọcNhóm();
      if (!nhóm.length) break;
      if (trước && cạnhChờ && !cạnhChờ.vôHình) for (const a of trước) for (const b of nhóm) cạnh.push({ từ: a, tới: b, nhãn: cạnhChờ.nhãn, dòng: số });
      const e = l.slice(i).match(RE_CẠNH);
      if (!e) break;
      i += e[0].length;
      const toán = e[2] || e[6] || '';
      cạnhChờ = { nhãn: ((e[3] !== undefined ? e[3] : e[5]) || '').replace(/^"|"$/g, '').trim(), vôHình: /^~/.test(toán) };
      trước = nhóm;
    }
  }
  return { loại, node, cạnh, lane };
}

/* ── Soát ────────────────────────────────────────────────────────────────────────────── */
const phátHiện = [];
let sốSơĐồ = 0;
const khôngXét = [];
for (const f of tệp) {
  let text; try { text = fs.readFileSync(f, 'utf8'); } catch { console.error(`✖ Không đọc được: ${f}`); process.exit(2); }
  const rel = path.relative(gốcIn, f) || path.basename(f);
  for (const k of khối(text)) {
    const g = phânTích(k.dòng);
    if (!g.loại || g.loại === 'khác') continue;
    sốSơĐồ++;
    const ra = new Map(), vào = new Map();
    for (const c of g.cạnh) { (ra.get(c.từ) || ra.set(c.từ, []).get(c.từ)).push(c); (vào.get(c.tới) || vào.set(c.tới, []).get(c.tới)).push(c); }
    const báo = (mã, n, câu) => phátHiện.push({ tệp: rel, dòng: n.dòng, mã, node: n.id, câu });
    for (const n of g.node.values()) {
      if (!n.quyếtĐịnh) continue;
      const lối = ra.get(n.id) || [];
      if (lối.length < 2) báo('FL-QD1', n, `quyết định có ${lối.length} lối ra`);
      const vôNhãn = lối.filter((c) => !c.nhãn);
      if (lối.length >= 2 && vôNhãn.length) báo('FL-QDN', n, `${vôNhãn.length}/${lối.length} lối ra không nhãn (tới ${vôNhãn.map((c) => c.tới).join(', ')})`);
    }
    // Cụt/mồ côi chỉ có nghĩa với sơ đồ QUY TRÌNH (swimlane, hoặc có điểm quyết định) có node đầu/kết. Sơ đồ kiến trúc,
    // ngữ cảnh, use case cũng là `flowchart` nhưng node nguồn/đích là bình thường — xét chúng là báo oan.
    const quyTrình = g.loại === 'swimlane-beta' || [...g.node.values()].some((n) => n.quyếtĐịnh);
    const cóĐầuKết = [...g.node.values()].some((n) => n.đầuKết);
    if (quyTrình && !cóĐầuKết) khôngXét.push(`${rel}:${k.bắtĐầu}`);
    if (!quyTrình || !cóĐầuKết) { /* không xét cụt/mồ côi */ }
    else for (const n of g.node.values()) {
      if (n.đầuKết) continue;
      if (!(ra.get(n.id) || []).length) báo('FL-CUT', n, 'không có lối ra, không phải điểm kết');
      if (!(vào.get(n.id) || []).length) báo('FL-COI', n, 'không có lối vào, không phải điểm bắt đầu');
    }
    if (g.loại === 'swimlane-beta') for (const ln of g.lane) if (!ln.số) phátHiện.push({ tệp: rel, dòng: ln.dòng, mã: 'FL-LAN', node: ln.id, câu: 'lane không có node nào' });
  }
}

RC.ghi('check-flow', phátHiện.map((x) => x.mã));
if (JSON_OUT) {
  console.log(JSON.stringify({ sốTệp: tệp.length, sốSơĐồ, khôngXétĐầuKết: khôngXét, phátHiện: phátHiện.map((x) => ({ ...x, mức: 'warn' })) }, null, 2));
} else {
  for (const x of phátHiện) console.log(`⚠️ ${x.mã} ${x.tệp}:${x.dòng} · ${x.node} — ${x.câu}`);
  const đuôi = `${sốSơĐồ} sơ đồ luồng trong ${tệp.length} tệp · ${phátHiện.length} phát hiện` + (khôngXét.length ? ` · ${khôngXét.length} sơ đồ không có node đầu/kết → không xét cụt/mồ côi` : '');
  console.log(phátHiện.length ? `\n${đuôi}` : `✓ ${đuôi}`);
  console.log('Máy KHÔNG kiểm: đúng nghiệp vụ, đủ vai trò, nhãn bàn giao có nói rõ giao gì, sơ đồ state/sequence/ER — việc của fact-list và ba-diagram-reviewer.');
}
process.exit(Math.min(phátHiện.length, 125));
