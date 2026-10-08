#!/usr/bin/env node
/**
 * ba-export — BOOTSTRAP TOÀN CỤC (~/.claude/skills/ba-export/scripts/install.js)
 *
 * File này KHÔNG chứa logic cài đặt. Nó chỉ:
 *   1. đọc đường dẫn repo BA toolkit nguồn (từ --from, hoặc `ba-source.txt` cạnh file này),
 *   2. gọi thẳng `<nguồn>/.claude/skills/ba-export/scripts/install.js` với NGUYÊN vẹn tham số,
 *      giữ nguyên thư mục hiện tại (nên `--to` mặc định vẫn là dự án bạn đang đứng).
 *
 * VÌ SAO: trước đây bản global là một BẢN COPY chép tay của install.js thật. Sửa logic ở
 * repo không lan sang đây, nên bản global lặng lẽ cũ dần — đã gây sự cố thật: dự án cài
 * ngày 12/08/2026 nhận khối `BA-TOOLKIT:diagram-rule` đời cũ thay vì khối briefing đầy đủ
 * trong CLAUDE.md, khiến agent ở dự án đích không biết vòng đời/pipeline và "không chạy
 * full skill". Bootstrap mỏng thì không có gì để cũ: logic luôn lấy trực tiếp từ repo.
 *
 * Đổi/di chuyển repo nguồn → chỉ cần sửa `ba-source.txt` cạnh file này.
 * Mọi tham số (--to/--from/--check/--dry/--force/--prune/--no-claude) xem SKILL.md.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SOURCE_FILE = path.join(__dirname, 'ba-source.txt');
const argv = process.argv.slice(2);
const optVal = (name) => {
  const i = argv.indexOf(name);
  return i !== -1 ? argv[i + 1] : null;
};

// Nguồn: --from (ưu tiên, và vẫn truyền tiếp xuống) → ba-source.txt.
const fromArg = optVal('--from');
let recorded = null;
if (fs.existsSync(SOURCE_FILE)) {
  const raw = fs.readFileSync(SOURCE_FILE, 'utf8').trim();
  if (raw) recorded = path.resolve(raw);
}
const srcRoot = path.resolve(fromArg || recorded || '');

const fail = (msg, hint) => {
  console.error(`Error: ${msg}`);
  if (hint) console.error(hint);
  process.exit(2);
};

if (!fromArg && !recorded) {
  fail(
    `không biết repo BA toolkit nguồn ở đâu (thiếu ${SOURCE_FILE}).`,
    `Ghi đường dẫn repo vào file đó, hoặc chạy kèm:  --from "<đường-dẫn>/BA_toolkit_v3.0"`,
  );
}

const realInstall = path.join(srcRoot, '.claude', 'skills', 'ba-export', 'scripts', 'install.js');
// `example/docs/00-tracking.md` chỉ có ở repo toolkit gốc (canon `export.srcMarker`, lint 39) —
// `explain/` KHÔNG dùng được: từ 20/09/2026 dự án tiêu dùng cũng nhận folder đúng tên đó.
if (!fs.existsSync(realInstall) || !fs.existsSync(path.join(srcRoot, 'example', 'docs', '00-tracking.md'))) {
  fail(
    `không thấy repo BA toolkit ở: ${srcRoot}`,
    fromArg
      ? `Kiểm tra lại đường dẫn sau --from.`
      : `Repo có thể đã di chuyển/đổi tên. Sửa lại đường dẫn trong: ${SOURCE_FILE}`,
  );
}

// Giữ nguyên cwd → install.js thật vẫn lấy dự án hiện tại làm đích khi không có --to.
const r = spawnSync(process.execPath, [realInstall, ...argv], {
  stdio: 'inherit',
  cwd: process.cwd(),
});
if (r.error) fail(`không chạy được install.js của repo nguồn: ${r.error.message}`);
process.exit(r.status === null ? 1 : r.status);
