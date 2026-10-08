#!/usr/bin/env node
/*
 * ba-new-skill/register.js — đăng ký một skill `ba-*` mới vào 4 chỗ CƠ GIỚI.
 * Zero-dependency, CommonJS. Chạy từ gốc repo toolkit.
 *
 *   node .claude/skills/ba-new-skill/scripts/register.js <ten-skill> --group <nhóm> [--dry]
 *   nhóm ∈ pipeline | he-thong | orchestrator | tien-ich | dev | phan-tich
 *
 * VÌ SAO CÓ SCRIPT NÀY: mỗi lần thêm skill, `lint.js` bắt đúng 3–6 lỗi đăng ký — và lần nào
 * cũng là **cùng bốn chỗ**. Việc thuần cơ giới, làm tay thì lần nào cũng sót một chỗ:
 *   1. index `ba-toolkit/SKILL.md`         (lint check 2)
 *   2. `explain/README.md` §2       (lint check 3b — ERROR)
 *   3. mục `## <skill>` trong file explain của nhóm + bump số ở header  (check 3 + 3c)
 *   4. số đếm skill trong `CLAUDE.md`      (lint check 1)
 *
 * KHÔNG làm (cần phán đoán, để người/LLM tự tay):
 *   - khai `doc.00`/`doc.NN` trong registry nếu skill sinh tài liệu cấp dự án
 *   - thêm vào `gate.plan.skills` nếu skill có Cổng phương án
 *   - viết nội dung nghiệp vụ cho mục explain (script chỉ chèn KHUNG có TODO)
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const name = args.find(a => !a.startsWith('--') && a !== args[args.indexOf('--group') + 1]);
const gi = args.indexOf('--group');
const group = gi !== -1 ? args[gi + 1] : null;

const GROUPS = {
  pipeline: { file: '01-pipeline-core.md', anchor: '## Thứ tự chạy (lõi Giai đoạn 2)' },
  'he-thong': { file: '02-tai-lieu-he-thong.md', anchor: '## Tài liệu cấp hệ thống (tùy chọn — chạy khi cần)' },
  orchestrator: { file: '03-orchestrator.md', anchor: '## Lệnh điều phối (orchestrator) — chạy cả chuỗi trong 1 trigger' },
  'tien-ich': { file: '04-tien-ich.md', anchor: '## Bảo trì toolkit (dành cho người sửa skill)' },
  dev: { file: '05-dev.md', anchor: '## Bộ skill `dev-*` (framework dev — clone từ superpowers, tự chứa)' },
  'phan-tich': { file: '06-phan-tich-va-ke-hoach.md', anchor: '## Phân tích vấn đề & hiện trạng (tùy chọn — chạy SỚM, trước/song song requirements)' },
};

if (!name || !group || !GROUPS[group]) {
  console.error('Dùng: node .claude/skills/ba-new-skill/scripts/register.js <ten-skill> --group <' + Object.keys(GROUPS).join('|') + '> [--dry]');
  process.exit(2);
}

const ROOT = process.cwd();
const SKILL_DIR = path.join(ROOT, '.claude', 'skills', name);
if (!fs.existsSync(path.join(SKILL_DIR, 'SKILL.md'))) {
  console.error(`Không thấy ${name}/SKILL.md — tạo skill trước rồi mới đăng ký.`);
  process.exit(2);
}

// Lấy description để sinh dòng một-dòng (cắt tới dấu — đầu tiên cho gọn).
const front = fs.readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf8');
const desc = (front.match(/^description:\s*(.+)$/m) || [, ''])[1];
const oneLine = desc.replace(/^Use when\s*/i, '').split('—')[0].trim().replace(/;$/, '');

const edits = [];
const patch = (rel, fn) => {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { edits.push({ rel, act: 'BỎ QUA (không thấy file)' }); return; }
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (after === null) { edits.push({ rel, act: 'đã có — không đổi' }); return; }
  if (!DRY) fs.writeFileSync(p, after, 'utf8');
  edits.push({ rel, act: 'đã ghi' });
};

// ── 1. index ba-toolkit/SKILL.md — chèn cuối khối của nhóm (trước heading kế tiếp)
patch('.claude/skills/ba-toolkit/SKILL.md', (t) => {
  if (t.includes('`' + name + '`')) return null;
  const a = t.indexOf(GROUPS[group].anchor);
  if (a === -1) throw new Error(`Không thấy mục "${GROUPS[group].anchor}" trong index`);
  const nextH = t.indexOf('\n## ', a + 1);
  const end = nextH === -1 ? t.length : nextH;
  const line = `- \`${name}\` — ${oneLine}. *(TODO: mô tả kỹ hơn)*\n`;
  return t.slice(0, end).replace(/\n+$/, '\n') + line + t.slice(end);
});

// ── 2. explain/README.md §2 (lint check 3b là ERROR — sót là gãy build)
patch('explain/README.md', (t) => {
  if (t.includes('`' + name + '`')) return null;
  const i2 = t.indexOf('## 2.');
  const i3 = t.indexOf('## 3.', i2 + 1);
  if (i2 === -1) throw new Error('README.md không thấy "## 2."');
  const end = i3 === -1 ? t.length : i3;
  const sec = t.slice(i2, end);
  const lastRow = sec.lastIndexOf('\n|');
  if (lastRow === -1) throw new Error('README §2 không thấy bảng');
  const eol = sec.indexOf('\n', lastRow + 1);
  const at = i2 + (eol === -1 ? sec.length : eol);
  return t.slice(0, at) + `\n| \`${name}\` | ${oneLine} |` + t.slice(at);
});

// ── 3. file explain của nhóm: chèn mục khung trước "## Xem thêm" + bump số ở header
patch(path.join('explain', GROUPS[group].file), (t) => {
  if (t.includes('## ' + name)) return null;
  const stub = [
    `## ${name} — TODO tiêu đề nghiệp vụ`,
    '',
    `**Làm gì.** TODO — mô tả bằng ngôn ngữ nghiệp vụ, không phải mô tả kỹ thuật.`,
    '',
    `**Khi nào dùng.** TODO.`,
    '',
    `**Khác skill gần kề.** TODO — câu ranh giới.`,
    '', '',
  ].join('\n');
  const xt = t.indexOf('## Xem thêm');
  let out = xt === -1 ? t.replace(/\s*$/, '\n\n') + stub : t.slice(0, xt) + stub + t.slice(xt);
  // bump "N skill" ở dòng H1 — trừ khi header tự khai có phần "(+ …)" (lint 3c bỏ qua ca đó)
  out = out.replace(/^#\s+.*$/m, (h1) => {
    if (h1.includes('+')) return h1;
    return h1.replace(/(\d+)(\s*skill)/i, (_, n, s) => (Number(n) + 1) + s);
  });
  return out;
});

// ── 4. số đếm trong CLAUDE.md (lint check 1)
patch('CLAUDE.md', (t) => {
  const re = /(\d+)\s+skills\s*\((\d+)\s*`?ba-\*`?\s*\+\s*(\d+)\s*`?dev-\*`?(?:\s*\+\s*(\d+)\s*`?ac-\*`?)?\)/i;
  const m = t.match(re);
  if (!m) throw new Error('CLAUDE.md không thấy dòng "N skills (M ba-* + K dev-* [+ J ac-*])"');
  const dirs = fs.readdirSync(path.join(ROOT, '.claude', 'skills'), { withFileTypes: true }).filter(e => e.isDirectory());
  const ba = dirs.filter(e => e.name.startsWith('ba-')).length;
  const dev = dirs.filter(e => e.name.startsWith('dev-')).length;
  const ac = dirs.filter(e => e.name.startsWith('ac-')).length;
  if (+m[2] === ba && +m[3] === dev && (m[4] === undefined ? 0 : +m[4]) === ac) return null;
  return t.replace(re, `${ba + dev + ac} skills (${ba} \`ba-*\` + ${dev} \`dev-*\`${ac ? ` + ${ac} \`ac-*\`` : ''})`);
});

console.log(`${DRY ? '[dry] ' : ''}Đăng ký \`${name}\` (nhóm ${group}):`);
for (const e of edits) console.log(`  ${e.act.padEnd(22)} ${e.rel}`);
console.log(`\nCÒN PHẢI TỰ TAY (script không phán đoán được):`);
console.log(`  - registry \`doc.00\`/\`doc.NN\` nếu skill sinh tài liệu cấp dự án`);
console.log(`  - registry \`gate.plan.skills\` nếu skill có Cổng phương án`);
console.log(`  - viết nội dung thật cho mục TODO trong explain/${GROUPS[group].file}`);
console.log(`\nRồi chạy: node .claude/skills/ba-toolkit/scripts/lint.js`);
