#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
/*
 * ba-index/query.js — truy xuất LÁT CẮT từ chỉ mục thay vì đọc cả file. Zero-dependency.
 *
 * Bài toán đo được trên dự án mẫu: một màn ~46.500 token, nhưng câu hỏi "BRule-S05-07 nói gì"
 * chỉ cần ~100 token. Đây là công cụ lấy đúng 100 token đó.
 *
 * CHỈ MỤC CŨ LÀ NGUY HIỂM HƠN KHÔNG CÓ CHỈ MỤC: nó trả lời trôi chảy bằng dữ liệu sai. Nên mọi
 * lệnh đều kiểm tươi/cũ trước (băm lại từng file nguồn, ~0,05s cho 96 file) và nói thẳng khi lệch.
 *
 * Dùng:
 *   node .claude/skills/ba-index/scripts/query.js get <ID> [--db f] [--json]
 *   node .claude/skills/ba-index/scripts/query.js find "<chuỗi>" [--kind BRule] [--man S01] [--limit 10]
 *   node .claude/skills/ba-index/scripts/query.js refs <ID>          # nhắc tới ai / ai nhắc tới
 *   node .claude/skills/ba-index/scripts/query.js man <S01>          # kiểm kê một màn theo loại ID
 *   node .claude/skills/ba-index/scripts/query.js stats
 * Exit: 0 có kết quả · 1 không tìm thấy · 2 lỗi/chỉ mục cũ nghiêm trọng.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const args = process.argv.slice(2);
const cờ = (t, m) => { const i = args.indexOf(t); return i >= 0 && args[i + 1] ? args[i + 1] : m; };
const JSONOUT = args.includes('--json');
const lệnh = args.find((a) => !a.startsWith('--')) || 'stats';
const thamSố = args.filter((a) => !a.startsWith('--') && a !== lệnh
  && a !== cờ('--db', null) && a !== cờ('--kind', null) && a !== cờ('--man', null) && a !== cờ('--limit', null));

const DB = path.resolve(cờ('--db', '.claude/ba-index.db'));
if (!fs.existsSync(DB)) {
  console.error(`Không thấy chỉ mục ${DB}. Dựng: node .claude/skills/ba-index/scripts/build.js docs`);
  process.exit(2);
}
const db = new DatabaseSync(DB, { readOnly: true });
const meta = Object.fromEntries(db.prepare('SELECT k,v FROM meta').all().map((r) => [r.k, r.v]));

/* ── Tươi hay cũ ───────────────────────────────────────────────────────────────────────────
 * Băm lại từng file nguồn và so với lúc dựng. Không làm bước này thì công cụ sẽ trả lời rất
 * tự tin bằng dữ liệu của hôm qua — kiểu hỏng tệ nhất, vì nó không báo lỗi.                */
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 16);
function kiểmTươi() {
  const docsDir = meta.docsDir;
  const rows = db.prepare('SELECT path, sha FROM doc').all();
  const đổi = []; const mất = [];
  for (const r of rows) {
    const p = path.join(docsDir, r.path);
    if (!fs.existsSync(p)) { mất.push(r.path); continue; }
    if (sha(fs.readFileSync(p, 'utf8')) !== r.sha) đổi.push(r.path);
  }
  // File MỚI chưa vào chỉ mục cũng là lệch — và là kiểu dễ bỏ sót nhất, vì mọi file cũ vẫn khớp.
  const mới = [];
  const quét = (d, gốc) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) quét(p, gốc);
      else if (e.name.endsWith('.md')) {
        const rel = path.relative(gốc, p).split(path.sep).join('/');
        if (!rows.some((r) => r.path === rel)) mới.push(rel);
      }
    }
  };
  try { quét(docsDir, docsDir); } catch { /* nguồn không còn */ }
  return { đổi, mất, mới, cũ: đổi.length + mất.length + mới.length > 0 };
}
const tươi = kiểmTươi();

const ra = (o) => {
  if (JSONOUT) { console.log(JSON.stringify({ ...o, chiMuc: { ...tươi, dungLuc: meta.builtAt } }, null, 2)); return; }
  if (tươi.cũ) {
    console.log('⚠️  CHỈ MỤC CŨ — dựng lại trước khi tin kết quả:'
      + `${tươi.đổi.length ? ` ${tươi.đổi.length} file đổi` : ''}`
      + `${tươi.mới.length ? ` · ${tươi.mới.length} file mới` : ''}`
      + `${tươi.mất.length ? ` · ${tươi.mất.length} file mất` : ''}`);
    console.log('    node .claude/skills/ba-index/scripts/build.js docs\n');
  }
};

const gọn = (s, n = 150) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));

switch (lệnh) {
  case 'get': {
    const id = thamSố[0];
    if (!id) { console.error('Thiếu <ID>'); process.exit(2); }
    const rows = db.prepare('SELECT id,path,kind,man,fields FROM ent WHERE id = ?').all(id);
    if (!rows.length) { ra({ id, found: false }); if (!JSONOUT) console.log(`Không có \`${id}\` trong chỉ mục.`); process.exit(1); }
    ra({ id, found: true, entries: rows.map((r) => ({ path: r.path, man: r.man, fields: JSON.parse(r.fields) })) });
    if (!JSONOUT) {
      for (const r of rows) {
        console.log(`${r.id}   ${r.path}${r.man ? `   [${r.man}]` : ''}`);
        for (const [k, v] of Object.entries(JSON.parse(r.fields))) console.log(`  ${k}: ${gọn(v, 400)}`);
      }
    }
    break;
  }
  case 'find': {
    const q = thamSố[0];
    if (!q) { console.error('Thiếu chuỗi tìm'); process.exit(2); }
    const kind = cờ('--kind', null); const man = cờ('--man', null);
    const limit = Number(cờ('--limit', '10'));
    let sql = `SELECT f.id AS id, f.path AS path, e.kind AS kind, e.man AS man,
                      snippet(ent_fts, 2, '«', '»', '…', 12) AS snip
               FROM ent_fts f JOIN ent e ON e.id = f.id AND e.path = f.path
               WHERE ent_fts MATCH ?`;
    // Chuỗi tìm là CHỮ, không phải cú pháp FTS5: `TC-S16-01:` bị FTS5 hiểu là `TC` NOT `S16` + cột `01` → "no such column" (dự án helpdesk 17/09/2026).
    // Bọc từng từ thành phrase để dấu - : * " mất nghĩa toán tử.
    const qFts = q.split(/\s+/).filter(Boolean).map((t) => '"' + t.replace(/"/g, '""') + '"').join(' ');
    const p = [qFts];
    if (kind) { sql += ' AND e.kind = ?'; p.push(kind); }
    if (man) { sql += ' AND e.man = ?'; p.push(man); }
    sql += ' ORDER BY rank LIMIT ?'; p.push(limit);
    const rows = db.prepare(sql).all(...p);
    ra({ query: q, kind, man, count: rows.length, hits: rows });
    if (!JSONOUT) {
      if (!rows.length) console.log('Không khớp.');
      for (const r of rows) console.log(`${r.id.padEnd(14)} ${r.path}\n   ${gọn(r.snip, 180)}`);
    }
    if (!rows.length) process.exit(1);
    break;
  }
  case 'refs': {
    const id = thamSố[0];
    if (!id) { console.error('Thiếu <ID>'); process.exit(2); }
    const ra_ = db.prepare('SELECT DISTINCT dst, path FROM ref WHERE src = ? ORDER BY dst').all(id);
    const vào = db.prepare('SELECT DISTINCT src, path FROM ref WHERE dst = ? ORDER BY src').all(id);
    ra({ id, nhacToi: ra_, aiNhacToi: vào });
    if (!JSONOUT) {
      console.log(`${id} nhắc tới (${ra_.length}): ${ra_.map((r) => r.dst).join(', ') || '—'}`);
      console.log(`ai nhắc tới ${id} (${vào.length}): ${vào.map((r) => r.src).join(', ') || '—'}`);
      console.log('\n(Chỉ là "có nhắc tới", KHÔNG phải quan hệ nhân quả — diễn giải là việc của skill.)');
    }
    break;
  }
  case 'man': {
    const code = thamSố[0];
    if (!code) { console.error('Thiếu mã màn, vd S01'); process.exit(2); }
    const rows = db.prepare('SELECT kind, COUNT(*) n FROM ent WHERE man = ? GROUP BY kind ORDER BY n DESC').all(code);
    const files = db.prepare('SELECT path, bytes FROM doc WHERE man = ? ORDER BY path').all(code);
    const byte = files.reduce((a, f) => a + f.bytes, 0);
    ra({ man: code, theoLoai: rows, files, bytes: byte });
    if (!JSONOUT) {
      console.log(`Màn ${code}: ${files.length} file · ${(byte / 1024).toFixed(0)} KB (~${Math.round(byte / 4).toLocaleString('vi')} token nếu đọc hết)`);
      for (const r of rows) console.log(`  ${String(r.n).padStart(4)}  ${r.kind}`);
    }
    break;
  }
  default: {
    const kinds = db.prepare('SELECT kind, COUNT(*) n FROM ent GROUP BY kind ORDER BY n DESC LIMIT 12').all();
    ra({ meta, theoLoai: kinds });
    if (!JSONOUT) {
      console.log(`Chỉ mục dựng ${meta.builtAt} · ${meta.files} file · ${meta.ents} thực thể · ${meta.refs} cạnh`);
      for (const k of kinds) console.log(`  ${String(k.n).padStart(4)}  ${k.kind}`);
    }
  }
}
db.close();
