#!/usr/bin/env node
/*
 * ba-toolkit/trigger-eval.js — ĐO SKILL CÓ KÍCH HOẠT ĐÚNG KHÔNG (trigger golden). Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ba-toolkit/scripts/trigger-eval.js [--runs 3] [--model <m>] [--claude-bin <path>]
 *        [--only <cụm>[,<cụm>]] [--save <file>] [--json|--plain]
 *   node .claude/skills/ba-toolkit/scripts/trigger-eval.js --from references/trigger-golden.baseline.json   # đọc kết quả đã lưu, không gọi mạng
 *   (thử nghiệm: --root <thư mục skills> · --golden <file .jsonl>)
 *
 * Vì sao có: đợt 6 (docs/decisions/18) rút 78 description xuống ≤200 ký tự để harness khỏi bỏ mô tả, và tự ghi hệ quả
 * xấu "cặp gần nghĩa dễ nhầm hơn — chưa có trigger golden để đo". Script này là phép đo đó (ý từ skill-architect
 * §1.4/§4.2 "should trigger / should NOT trigger").
 *
 * Cách đo: đọc frontmatter THẬT của mọi `<skills>/<x>/SKILL.md`, lọc như harness (không description → bỏ, kể cả
 * description rỗng; `disable-model-invocation: true` → bỏ), dựng MỘT prompt gồm `name: description` + các câu golden đánh
 * số, yêu cầu trả JSON `[{i, skill}]` (đúng một skill hoặc `none`). Gọi `claude -p --output-format json` không tool, không
 * skill, cwd tạm (khỏi nạp CLAUDE.md của repo). `--runs N` gọi N lần, mỗi câu lấy phiếu đa số (hoà → lượt sớm nhất).
 * `--save` ghi tổng kết + câu trả lời thô (khoá theo CHỮ câu, không theo số thứ tự) để `--from` chấm lại không gọi mạng.
 *
 * Golden: `ba-toolkit/references/trigger-golden.jsonl`, mỗi dòng `{"cum","cau","dung","khong":[…]}`. `dung` = skill
 * phải chọn (hoặc `none`). Câu có `dung` không còn là skill → tính SAI (lý do "skill không còn"); `dung` bị lọc vì mô tả
 * rỗng → router không thấy → SAI tự nhiên (lý do "mô tả rỗng").
 *
 * Output: độ chính xác tổng + theo cụm + ma trận nhầm (dung → chọn) + câu sai + câu phiếu không nhất trí.
 * Exit = số câu sai (trần 125, qua process.exitCode) · 2 = lỗi hạ tầng (claude hỏng/không trả JSON, --from hỏng,
 * golden hỏng/rỗng).
 *
 * gioiHan: router MÔ PHỎNG ≠ auto-trigger thật — harness thật còn thấy hội thoại, CLAUDE.md, skill/plugin khác của người
 * dùng (ở đây chỉ skill trong --root), và quyết định từng lượt chứ không chấm cả lô câu một lúc. Không tất định: cùng
 * prompt hai lần có thể khác — dùng --runs ≥3 và đọc cột phiếu. Chỉ đếm khớp tên skill; không phán câu golden viết
 * có đúng không (câu mơ hồ thì "sai" là lỗi của câu, người soát đọc danh sách câu sai).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const cờ = (k) => argv.includes(k);
const giáTrị = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const TRẦN = 125;
const REPO = process.cwd();
const GỐC = path.resolve(giáTrị('--root', path.join(REPO, '.claude', 'skills')));
const GOLDEN = path.resolve(giáTrị('--golden', path.join(__dirname, '..', 'references', 'trigger-golden.jsonl')));
const RUNS = Math.max(1, parseInt(giáTrị('--runs', '1'), 10) || 1);
const MODEL = giáTrị('--model', null);
const BIN = giáTrị('--claude-bin', 'claude');
const FROM = giáTrị('--from', null);
const SAVE = giáTrị('--save', null);
const ONLY = (giáTrị('--only', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const JSON_MODE = cờ('--json');

function hạTầng(msg) { process.stderr.write('trigger-eval: LỖI HẠ TẦNG — ' + msg + '\n'); process.exitCode = 2; }

// ── 1. Skill thật, lọc như harness ──────────────────────────────────────────────────────────────
function đọcFrontmatter(txt) {
  const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/); if (!m) return null;
  const fm = {}; let khoá = null;
  for (const dòng of m[1].split(/\r?\n/)) {
    const kv = dòng.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) { khoá = kv[1]; let v = kv[2].trim(); if (/^[|>][-+]?$/.test(v)) v = ''; fm[khoá] = v.replace(/^(['"])(.*)\1$/, '$2'); }
    else if (khoá && /^\s+\S/.test(dòng)) fm[khoá] = (fm[khoá] ? fm[khoá] + ' ' : '') + dòng.trim();
  }
  return fm;
}
function đọcSkills(gốc) {
  const có = [], lọc = [];
  if (!fs.existsSync(gốc)) return null;
  for (const d of fs.readdirSync(gốc).sort()) {
    const f = path.join(gốc, d, 'SKILL.md'); if (!fs.existsSync(f)) continue;
    const fm = đọcFrontmatter(fs.readFileSync(f, 'utf8')) || {};
    const name = (fm.name || d).trim(), desc = (fm.description || '').trim();
    if (!desc) { lọc.push({ name, vìSao: 'không có description' }); continue; }
    if (/^true$/i.test(fm['disable-model-invocation'] || '')) { lọc.push({ name, vìSao: 'disable-model-invocation' }); continue; }
    có.push({ name, desc });
  }
  return { có, lọc };
}

// ── 2. Golden ───────────────────────────────────────────────────────────────────────────────────
function đọcGolden(f) {
  if (!fs.existsSync(f)) return { lỗi: 'không thấy golden ' + f };
  const câu = [], hỏng = [];
  fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((l, i) => {
    if (!l.trim()) return;
    try { const o = JSON.parse(l); if (!o.cau || !o.dung) throw new Error('thiếu cau/dung'); câu.push({ cum: o.cum || '?', cau: o.cau, dung: o.dung, khong: o.khong || [] }); }
    catch (e) { hỏng.push(`dòng ${i + 1}: ${e.message}`); }
  });
  if (hỏng.length) return { lỗi: 'golden hỏng — ' + hỏng.join('; ') };
  if (!câu.length) return { lỗi: 'golden rỗng' };
  return { câu };
}

// ── 3. Gọi claude ───────────────────────────────────────────────────────────────────────────────
function dựngPrompt(skills, câu) {
  return [
    'Bạn là bộ định tuyến skill của Claude Code. Với MỖI câu người dùng dưới đây, chọn ĐÚNG MỘT skill trong danh sách mà Claude Code nên tự kích hoạt, chỉ dựa vào `name: description`. Không skill nào hợp thì chọn "none".',
    '',
    '## Danh sách skill',
    ...skills.map((s) => `- ${s.name}: ${s.desc}`),
    '',
    '## Câu người dùng',
    ...câu.map((c, i) => `${i + 1}. ${c.cau}`),
    '',
    'Chỉ trả về MỘT mảng JSON, không giải thích, không markdown: [{"i": <số câu>, "skill": "<name hoặc none>"}, …] — đủ mọi câu.',
  ].join('\n');
}
function tríchMảng(text) {
  const s = String(text || '');
  const khối = s.match(/```(?:json)?\s*([\s\S]*?)```/); const nguồn = khối ? khối[1] : s;
  const a = nguồn.indexOf('['), b = nguồn.lastIndexOf(']'); if (a < 0 || b <= a) return null;
  try { const v = JSON.parse(nguồn.slice(a, b + 1)); return Array.isArray(v) ? v : null; } catch { return null; }
}
const chuẩnTên = (x) => String(x == null ? 'none' : x).trim().replace(/^\//, '').toLowerCase() || 'none';
function gọiClaude(prompt, câu) {
  const args = ['-p', prompt, '--output-format', 'json', '--tools', '', '--disable-slash-commands', '--no-session-persistence'];
  if (MODEL) args.push('--model', MODEL);
  const r = spawnSync(BIN, args, { cwd: os.tmpdir(), encoding: 'utf8', maxBuffer: 1e8 });
  if (r.error) return { lỗi: `không chạy được ${BIN}: ${r.error.message}` };
  let out; try { out = JSON.parse((r.stdout || '').trim().split('\n').filter(Boolean).pop() || ''); } catch { return { lỗi: `claude không trả JSON (exit ${r.status}): ${(r.stdout || r.stderr || '').slice(0, 300)}` }; }
  if (out.is_error || r.status !== 0) return { lỗi: `claude báo lỗi (exit ${r.status}): ${String(out.result || r.stderr || '').slice(0, 300)}` };
  const mảng = tríchMảng(out.result); if (!mảng) return { lỗi: 'kết quả không có mảng JSON: ' + String(out.result || '').slice(0, 300) };
  const trả = {};
  for (const x of mảng) { const i = +x.i; if (i >= 1 && i <= câu.length) trả[câu[i - 1].cau] = chuẩnTên(x.skill); }
  return { trả, model: Object.keys(out.modelUsage || {})[0] || MODEL || '(mặc định CLI)', usd: +out.total_cost_usd || 0 };
}

// ── 4. Chấm ─────────────────────────────────────────────────────────────────────────────────────
function chấm(câu, lượt, skills, lọc) {
  const tên = new Set(skills.map((s) => s.name)), tênLọc = new Set(lọc.map((s) => s.name));
  const theoCum = {}, maTran = {}, cauSai = [], batOn = [], chuaDo = [];
  let đúng = 0;
  for (const c of câu) {
    const phiếu = lượt.map((l) => l[c.cau]).filter((x) => x !== undefined);
    const cụm = (theoCum[c.cum] = theoCum[c.cum] || { dung: 0, tong: 0 }); cụm.tong++;
    const dungTên = chuẩnTên(c.dung);
    if (dungTên !== 'none' && !tên.has(dungTên)) {
      cauSai.push({ cum: c.cum, cau: c.cau, dung: dungTên, chon: phiếu[0] || '—', phieu: '—', lyDo: tênLọc.has(dungTên) ? 'mô tả rỗng — harness lọc, router không thấy' : 'skill không còn tồn tại' });
      continue;
    }
    if (!phiếu.length) { chuaDo.push(c.cau); cauSai.push({ cum: c.cum, cau: c.cau, dung: dungTên, chon: '—', phieu: `0/${lượt.length}`, lyDo: 'chưa có câu trả lời (golden mới hơn kết quả?)' }); continue; }
    const đếm = {}; phiếu.forEach((p) => { đếm[p] = (đếm[p] || 0) + 1; });
    let chọn = phiếu[0]; for (const p of phiếu) if (đếm[p] > đếm[chọn]) chọn = p;
    const phieuStr = `${đếm[chọn]}/${phiếu.length}`;
    if (đếm[chọn] < phiếu.length) batOn.push({ cau: c.cau, dung: dungTên, phieu: đếm });
    if (chọn === dungTên) { đúng++; cụm.dung++; continue; }
    const k = `${dungTên} → ${chọn}`; maTran[k] = (maTran[k] || 0) + 1;
    cauSai.push({ cum: c.cum, cau: c.cau, dung: dungTên, chon: chọn, phieu: phieuStr, lyDo: (c.khong || []).map(chuẩnTên).includes(chọn) ? 'nhầm với skill dễ nhầm đã khai' : 'nhầm ngoài danh sách khong' });
  }
  for (const v of Object.values(theoCum)) v.tyLe = +(100 * v.dung / v.tong).toFixed(1);
  return { tong: { dung: đúng, tong: câu.length, tyLe: +(100 * đúng / câu.length).toFixed(1) }, theoCum, maTran, cauSai, batOn, chuaDo };
}

function commit() { const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO, encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; }

// ── main ────────────────────────────────────────────────────────────────────────────────────────
(function main() {
  const sk = đọcSkills(GỐC); if (!sk) return hạTầng('không thấy thư mục skills ' + GỐC);
  const g = đọcGolden(GOLDEN); if (g.lỗi) return hạTầng(g.lỗi);
  let câu = g.câu;
  if (ONLY.length) { câu = câu.filter((c) => ONLY.includes(c.cum)); if (!câu.length) return hạTầng(`--only ${ONLY.join(',')}: không cụm nào khớp (có: ${[...new Set(g.câu.map((c) => c.cum))].join(', ')})`); }
  const khôngTồnTại = [...new Set(g.câu.flatMap((c) => c.khong || []).map(chuẩnTên))].filter((n) => !sk.có.some((s) => s.name === n) && !sk.lọc.some((s) => s.name === n));

  let lượt = [], model = MODEL || '(mặc định CLI)', usd = 0, nguồn;
  if (FROM) {
    let d; try { d = JSON.parse(fs.readFileSync(FROM, 'utf8')); } catch (e) { return hạTầng(`--from ${FROM}: ${e.message}`); }
    lượt = Array.isArray(d) ? d : d && d.traLoi;
    if (!Array.isArray(lượt) || !lượt.length || lượt.some((l) => !l || typeof l !== 'object' || Array.isArray(l))) return hạTầng(`--from ${FROM}: thiếu "traLoi" dạng [{"<câu>": "<skill>"}, …]`);
    lượt = lượt.map((l) => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, chuẩnTên(v)])));
    model = (d && d.model) || '?'; nguồn = 'từ file ' + FROM;
  } else {
    const prompt = dựngPrompt(sk.có, câu);
    for (let r = 0; r < RUNS; r++) {
      const k = gọiClaude(prompt, câu); if (k.lỗi) return hạTầng(`lượt ${r + 1}/${RUNS}: ${k.lỗi}`);
      lượt.push(k.trả); model = k.model; usd += k.usd;
    }
    nguồn = `claude -p × ${RUNS}`;
  }

  const kq = chấm(câu, lượt, sk.có, sk.lọc);
  const tổng = {
    ngay: new Date().toISOString().slice(0, 10), model, commit: commit(), runs: lượt.length, nguon: nguồn, usd: +usd.toFixed(4),
    skillThay: sk.có.length, skillLoc: sk.lọc, khongKhongTonTai: khôngTồnTại, only: ONLY.length ? ONLY : undefined,
    ...kq,
  };
  if (SAVE) {
    const lưu = Object.assign({ _: 'Kết quả trigger-eval.js (router mô phỏng, xem gioiHan trong script). Chấm lại không gọi mạng: trigger-eval.js --from <file này>. traLoi = câu trả lời thô từng lượt, khoá theo chữ câu golden.' }, tổng, { traLoi: lượt });
    fs.writeFileSync(SAVE, JSON.stringify(lưu, null, 1) + '\n');
  }
  if (JSON_MODE) process.stdout.write(JSON.stringify(tổng, null, 2) + '\n');
  else {
    const L = [];
    L.push(`trigger-eval: ${kq.tong.dung}/${kq.tong.tong} đúng (${kq.tong.tyLe} %) · ${sk.có.length} skill thấy, ${sk.lọc.length} bị lọc · ${nguồn} · model ${model}${usd ? ` · ${usd.toFixed(2)} USD` : ''}`);
    for (const s of sk.lọc) L.push(`   lọc như harness: ${s.name} (${s.vìSao})`);
    L.push('Theo cụm:');
    for (const [c, v] of Object.entries(kq.theoCum)) L.push(`   ${c.padEnd(10)} ${v.dung}/${v.tong} (${v.tyLe} %)`);
    if (Object.keys(kq.maTran).length) { L.push('Ma trận nhầm (dung → chọn):'); for (const [k, n] of Object.entries(kq.maTran).sort((a, b) => b[1] - a[1])) L.push(`   ${n}× ${k}`); }
    if (kq.cauSai.length) { L.push('Câu sai:'); for (const s of kq.cauSai) L.push(`   [${s.cum}] "${s.cau}" — cần ${s.dung}, chọn ${s.chon} (${s.phieu}) · ${s.lyDo}`); }
    if (kq.batOn.length) L.push(`Phiếu không nhất trí: ${kq.batOn.length} câu (xem --json batOn)`);
    if (khôngTồnTại.length) L.push(`Cảnh báo: "khong" nhắc skill không còn: ${khôngTồnTại.join(', ')}`);
    process.stdout.write(L.join('\n') + '\n');
  }
  process.exitCode = Math.min(kq.cauSai.length, TRẦN);
})();
