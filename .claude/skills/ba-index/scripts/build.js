#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
/*
 * ba-index/build.js — dựng CHỈ MỤC truy xuất từ `docs/`. Zero-dependency (`node:sqlite` có sẵn
 * từ Node 22). Chỉ đọc `docs/`, chỉ ghi ra file chỉ mục.
 *
 * VÌ SAO: đo trên dự án mẫu — 96 file, ~319k token; một màn ~46.5k token; nhưng để trả lời
 * "BRule-S05-07 nói gì" chỉ cần ~100 token. Agent đang đọc cả file để lấy một dòng.
 *
 * `.md` VẪN LÀ NGUỒN SỰ THẬT. Chỉ mục là thứ SINH RA, xoá lúc nào cũng được, dựng lại trong
 * vài giây. Đây là quyết định có chủ đích: đưa nguồn vào DB sẽ giết git-diff trên nội dung, và
 * kéo theo `semdiff.js`, hook change-watch, `ba-changelog`, phân tích ảnh hưởng của
 * `ba-change-request` — tất cả đều đứng trên việc `.md` nằm trong git.
 *
 * Dùng:  node .claude/skills/ba-index/scripts/build.js [docsDir=docs] [--out <file>] [--plain]
 * Exit:  0 xong · 2 không đọc được nguồn.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const { bócBảng } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'semdiff.js'));

const args = process.argv.slice(2);
const cờ = (t, m) => { const i = args.indexOf(t); return i >= 0 && args[i + 1] ? args[i + 1] : m; };
const PLAIN = args.includes('--plain');
const DOCS = path.resolve(args.find((a) => !a.startsWith('--') && a !== cờ('--out', null)) || 'docs');
// Chỉ mục KHÔNG nằm trong `docs/`. Cùng lý do đã đẩy `e2e.spec.ts` ra ngoài: `docs/` là cây
// TÀI LIỆU. Một file nhị phân ở đó còn tệ hơn một file `.ts` — portal phải né, git diff vô nghĩa,
// và người mở thư mục tài liệu thấy một thứ không đọc được.
const OUT = path.resolve(cờ('--out', path.join(DOCS, '..', '.claude', 'ba-index.db')));
if (!fs.existsSync(DOCS)) { console.error(`Không thấy ${DOCS}`); process.exit(2); }

const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 16);
const PREFIX_CỦA = (id) => (id.match(/^([A-Za-zĐ]+)/) || [, '?'])[1];

function gomMd(dir, gốc = dir) {
  const ra = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) ra.push(...gomMd(p, gốc));
    else if (e.name.endsWith('.md')) ra.push(path.relative(gốc, p).split(path.sep).join('/'));
  }
  return ra;
}

/** Màn của một đường dẫn, hoặc null. `Screen-spec/` là container trong suốt (conventions.md). */
function mànCủa(rel) {
  const m = /(?:^|\/)(S\d+) - ([^/]+)\//.exec(rel);
  return m ? { code: m[1], name: m[2] } : null;
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.rmSync(OUT, { force: true });
fs.rmSync(OUT + "-wal", { force: true });
fs.rmSync(OUT + "-shm", { force: true });
const db = new DatabaseSync(OUT);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE doc(path TEXT PRIMARY KEY, sha TEXT NOT NULL, bytes INT NOT NULL, man TEXT);
  CREATE TABLE ent(id TEXT NOT NULL, path TEXT NOT NULL, kind TEXT NOT NULL, man TEXT,
                   fields TEXT NOT NULL, PRIMARY KEY(id, path));
  CREATE INDEX ent_id ON ent(id);
  CREATE INDEX ent_kind ON ent(kind);
  CREATE INDEX ent_man ON ent(man);
  -- Cạnh truy vết: ID này NHẮC TỚI ID kia trong nội dung ô. Không suy ra quan hệ nhân quả —
  -- chỉ ghi "có nhắc", phần diễn giải là của skill.
  CREATE TABLE ref(src TEXT NOT NULL, dst TEXT NOT NULL, path TEXT NOT NULL);
  CREATE INDEX ref_src ON ref(src);
  CREATE INDEX ref_dst ON ref(dst);
  CREATE VIRTUAL TABLE ent_fts USING fts5(id UNINDEXED, path UNINDEXED, body);
  CREATE TABLE meta(k TEXT PRIMARY KEY, v TEXT);
`);

const insDoc = db.prepare('INSERT INTO doc(path,sha,bytes,man) VALUES (?,?,?,?)');
const insEnt = db.prepare('INSERT OR REPLACE INTO ent(id,path,kind,man,fields) VALUES (?,?,?,?,?)');
const insRef = db.prepare('INSERT INTO ref(src,dst,path) VALUES (?,?,?)');
const insFts = db.prepare('INSERT INTO ent_fts(id,path,body) VALUES (?,?,?)');

const RE_ID_TRONG_VĂN = /\b(BRule|NFR|StR|ACL|ATC|GWT|ADR|UAT|DEC|ACT|USC|BR|FR|TR|UC|US|TC|CL|CR|WI|PD|EXT|PS|UN|RB|BO|OQ|SH|GĐ|F|S|R|U|E|G)-?S?\d+(?:-\d+)?\b/g;

const files = gomMd(DOCS).sort();
let soEnt = 0; let soRef = 0;
db.exec('BEGIN');
for (const rel of files) {
  const nội = fs.readFileSync(path.join(DOCS, rel), 'utf8');
  const màn = mànCủa(rel);
  insDoc.run(rel, sha(nội), Buffer.byteLength(nội), màn ? màn.code : null);
  const bảng = bócBảng(nội, () => {});
  for (const [id, fields] of Object.entries(bảng)) {
    const body = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join(' \n');
    insEnt.run(id, rel, PREFIX_CỦA(id), màn ? màn.code : null, JSON.stringify(fields));
    insFts.run(id, rel, `${id} ${body}`);
    soEnt++;
    const đã = new Set();
    for (const m of body.matchAll(RE_ID_TRONG_VĂN)) {
      const dst = m[0];
      if (dst === id || đã.has(dst)) continue;
      đã.add(dst);
      insRef.run(id, dst, rel);
      soRef++;
    }
  }
}
const tổngByte = files.reduce((a, f) => a + fs.statSync(path.join(DOCS, f)).size, 0);
for (const [k, v] of Object.entries({
  docsDir: DOCS,
  builtAt: new Date().toISOString(),
  files: String(files.length),
  bytes: String(tổngByte),
  ents: String(soEnt),
  refs: String(soRef),
  schema: '1',
})) db.prepare('INSERT INTO meta(k,v) VALUES (?,?)').run(k, v);
db.exec('COMMIT');
db.close();

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
if (PLAIN || true) {
  console.log(`Chỉ mục: ${OUT}`);
  console.log(`  nguồn : ${files.length} file · ${kb(tổngByte)} (~${Math.round(tổngByte / 4).toLocaleString('vi')} token)`);
  console.log(`  mục    : ${soEnt} thực thể có ID · ${soRef} cạnh nhắc tới`);
  console.log(`  cỡ DB  : ${kb(fs.statSync(OUT).size)}`);
  console.log('  Nguồn sự thật vẫn là .md — chỉ mục sinh lại được, xoá lúc nào cũng được.');
}
