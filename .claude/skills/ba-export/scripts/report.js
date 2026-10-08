#!/usr/bin/env node
/*
 * ba-export/report.js — số liệu MỘT dự án tiêu dùng trả ngược về toolkit (zero-dependency).
 *
 * Vì sao tồn tại: toolkit có đủ ba vai bên TRONG một dự án — `ba-*` viết đặc tả, `dev-run` thực
 * thi, `ba-review`/agent chấm. Nhưng không vai nào chấm CHÍNH TOOLKIT trên nhiều dự án. Thứ duy
 * nhất từng đo được là `usage.js`, mà nó chỉ đọc transcript của MỘT máy — nên mọi câu "skill X ít
 * dùng", "cổng Y hay đỏ", "nên gộp skill Z" đều là suy đoán từ đồ thị tham chiếu tĩnh giữa các
 * SKILL.md. Đồ thị đó đo THIẾT KẾ, không đo THỰC TẾ.
 *
 * Tín hiệu mạnh nhất ở đây không phải số lần gọi skill, mà là **file toolkit bị SỬA TẠI ĐÍCH**:
 * `install.js` đã lưu hash từng file lúc cài, nên chỗ nào lệch hash là chỗ người dùng phải tự tay
 * chữa mặc định của toolkit. Một file mà nhiều dự án cùng sửa = mặc định đó sai, không phải người
 * dùng lạc lối.
 *
 * ẨN DANH THEO THIẾT KẾ: chỉ SỐ ĐẾM, mã ID, tên skill và đường dẫn FILE CỦA TOOLKIT. Không tên
 * tài liệu nghiệp vụ, không nội dung, không tên dự án (trừ khi có --with-name). Báo cáo này để
 * gửi ngược về nơi giữ toolkit, nên mặc định phải an toàn khi gửi.
 *
 * Dùng:  node .claude/skills/ba-export/scripts/report.js [--project <dir>] [--docs <dir>]
 *                                                        [--plain] [--with-name] [--out <file>]
 * Mặc định ghi `.claude/ba-toolkit-report.json`. Exit 0 kể cả khi thiếu dữ liệu — đây là báo cáo,
 * KHÔNG phải cổng; để nó chặn được `ba-accept` là biến một phép đo thành một chướng ngại vật.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const PLAIN = argv.includes('--plain');
const WITH_NAME = argv.includes('--with-name');
const ROOT = path.resolve(flag('--project', process.cwd()));
const DOCS = path.resolve(flag('--docs', path.join(ROOT, 'docs')));
const OUT = path.resolve(flag('--out', path.join(ROOT, '.claude', 'ba-toolkit-report.json')));

const đọc = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };
const gioiHan = [];

// Module dùng chung: ưu tiên bản CÀI Ở ĐÍCH (đúng phiên bản dự án đang chạy), rồi mới tới bản
// cạnh script. Nạp hụt thì ghi vào `gioiHan` và chạy tiếp — báo cáo thiếu một mục vẫn hơn không có.
function nạp(tên) {
  for (const p of [path.join(ROOT, '.claude', 'skills', 'ba-toolkit', 'scripts', tên),
                   path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', tên)]) {
    try { return require(p); } catch { /* thử chỗ kế */ }
  }
  gioiHan.push(`không nạp được ${tên} — mục liên quan bị bỏ trống, không đoán thay`);
  return null;
}
const docpath = nạp('docpath.js');
const profile = nạp('profile.js');

const đọcDoc = (tên) => (docpath ? docpath.readDoc(DOCS, tên) : đọc(path.join(DOCS, tên)));

// ─── 1. Phiên bản + file toolkit bị sửa tại đích ───────────────────────────────────────────
// Chạy TRONG CHÍNH repo nguồn thì mọi con số "sửa tại đích" đều vô nghĩa: manifest ở đây là dấu
// vết của một lần tự-cài cũ, nên mỗi commit sau đó biến thành một "file bị người dùng sửa". Bẫy này
// sập ngay lần chạy thử đầu tiên — 66 file báo "sửa tại đích" mà thật ra là chính phiên đang sửa
// toolkit. Nhận diện bằng `example/docs/00-tracking.md` (canon `export.srcMarker`), đúng dấu hiệu install.js dùng.
const LÀ_NGUỒN = fs.existsSync(path.join(ROOT, 'example', 'docs', '00-tracking.md'));
const mf = LÀ_NGUỒN ? null : (() => { try { return JSON.parse(đọc(path.join(ROOT, '.claude', 'ba-toolkit.json'))); } catch { return null; } })();
const nguồn = { có: !!mf };
const sửaTạiChỗ = [];
if (LÀ_NGUỒN) {
  gioiHan.push('đây là REPO NGUỒN của toolkit (có example/), không phải dự án tiêu dùng — bỏ qua phần phiên bản/sửa-tại-chỗ; chạy script này từ dự án đích');
} else if (!mf) {
  gioiHan.push('không có .claude/ba-toolkit.json — dự án này chưa cài bằng install.js, phần phiên bản/sửa-tại-chỗ bỏ trống');
} else {
  nguồn.commit = (mf.source && mf.source.git && mf.source.git.commit) || null;
  nguồn.branch = (mf.source && mf.source.git && mf.source.git.branch) || null;
  nguồn.càiLúc = mf.installedAt || null;
  nguồn.soFile = Object.keys(mf.files || {}).length;
  // So với NGUỒN khi với tới (hook-review 07/10/2026): hash trong manifest là thứ agent sửa được — sửa file rồi ghi lại hash
  // là "sửa tại đích" biến mất khỏi báo cáo. integrity.js so cây git repo toolkit ở commit đã cài (không được thì manifest đã
  // commit) cho `.claude/skills/`; phần ngoài skills (agent, hướng dẫn, explain) vẫn so manifest như cũ.
  const integrity = nạp('integrity.js');
  let ig = null; try { ig = integrity ? integrity.kiểm(ROOT) : null; } catch { ig = null; }
  const dùngIG = ig && (ig.nguon === 'source' || ig.nguon === 'manifest-head');
  nguồn.soVới = dùngIG ? ig.nguon : 'manifest';
  if (dùngIG) {
    for (const x of ig.lech) {
      if (x.loai === 'sua') sửaTạiChỗ.push({ file: x.file, tình: 'sửa tại đích' });
      else if (x.loai === 'thieu') sửaTạiChỗ.push({ file: x.file, tình: 'đã xoá' });
    }
    // `them` = file dự án tự thêm vào thư mục skill — tên do dự án đặt, chỉ ĐẾM (ẩn danh). hook/settings = cấu hình máy, không gửi.
    nguồn.themTaiDich = ig.lech.filter((x) => x.loai === 'them').length;
    if (ig.duyet.length) nguồn.duocDuyet = ig.duyet.length;
  } else gioiHan.push('không với tới nguồn toolkit (và manifest chưa commit) — "sửa tại đích" so với hash manifest, thứ sửa được tại chỗ');
  for (const [rel, hash] of Object.entries(mf.files || {})) {
    if (dùngIG && rel.startsWith('.claude/skills/')) continue;
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) { sửaTạiChỗ.push({ file: rel, tình: 'đã xoá' }); continue; }
    const h = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16);
    if (h !== hash) sửaTạiChỗ.push({ file: rel, tình: 'sửa tại đích' });
  }
}

// ─── 2. Hồ sơ + tiến độ theo màn ───────────────────────────────────────────────────────────
const tracking = đọcDoc('00-tracking.md');
const hồSơ = profile ? profile.readProfile(DOCS) : null;
// DÒNG MÀN = dòng của BẢNG CHÍNH (từ header `| Mã CN` tới dòng không bắt đầu bằng `|`) có mã màn trong cột Folder.
// Bản cũ đòi `docs/…` trong backtick: dự án e-learning ghi Folder là `Authentication/S01 - Login` (không `docs/`) ⇒ đếm 2/57 màn.
// Chỉ đọc bảng chính nên bảng "Miễn trừ" của dự án desktop (cũng nhắc S02, S03…) vẫn không lọt (bài học 36 vs 32 màn).
const dòngTracking = tracking.split('\n');
const iHeader = dòngTracking.findIndex((l) => /^\|\s*Mã CN/.test(l));
const header = iHeader >= 0 ? dòngTracking[iHeader].split('|').map((x) => x.trim()) : [];
const cộtFolder = header.indexOf('Folder');
const dòngMàn = [];
for (let i = iHeader + 2; iHeader >= 0 && i < dòngTracking.length && /^\|/.test(dòngTracking[i]); i++) {
  const ô = dòngTracking[i].split('|');
  if (/\bS\d{2,3}\b/.test(cộtFolder > 0 ? ô[cộtFolder] || '' : dòngTracking[i])) dòngMàn.push(dòngTracking[i]);
}
// Cột `dev` dùng emoji, cột `Trạng thái` dùng CHỮ ("Hoàn thành"/"Đang làm"). Đếm theo GIÁ TRỊ Ô
// thay vì dò emoji: dò emoji trả 0 cho cả bảng chữ mà không báo lỗi gì — im lặng và sai.
// ẨN DANH — bài học từ lần chạy thật đầu tiên trên một dự án ngoài (dự án desktop, 11/09/2026): cột
// "Trạng thái" ở đó không phải nhãn ngắn mà là CẢ ĐOẠN VĂN (mã chức năng, tên màn, commit,
// ngày tháng). Đếm theo giá trị ô thì báo cáo "ẩn danh" in nguyên ~15 KB nội dung nghiệp vụ.
// Chỉ giữ giá trị trông như NHÃN (≤ 24 ký tự, không xuống dòng); còn lại gom vào "khác" và
// KHÔNG bao giờ chép nội dung ra. Một báo cáo để gửi đi phải an toàn ngay cả khi dữ liệu nguồn
// không giống dự án mẫu — và nó đã không giống.
// Lần chạy thứ hai vẫn lọt "Dev1 #100", "Reverse+Mở rộng" — ngắn nhưng vẫn là chữ của dự án.
// Nên chỉ DANH SÁCH TRẮNG các nhãn canon mới được rời khỏi dự án; mọi thứ khác là "khác".
// 25/09/2026: cả 3 dự án thật (16+34+57 màn) viết "Hoàn thành — <ghi chú>" ⇒ 100% ô rơi vào "khác", cột vô dụng.
// Nay nhận NHÃN CANON Ở ĐẦU ô (so khớp tiền tố với danh sách trắng) — phần đuôi vẫn không bao giờ rời dự án.
const NHÃN_CANON = ['Hoàn thành', 'Đang làm', 'Chưa bắt đầu', 'Chưa làm', 'Cần cập nhật', '✅', '⬜', '⚠️', '🔨', '—', '-'];
const nhãnCủa = (v) => (v === '' ? '—' : NHÃN_CANON.find((n) => v === n || (v.startsWith(n) && /^(\s|$|[—–:·(])/.test(v.slice(n.length)))));
const đếmÔ = (cột) => {
  const c = {};
  for (const l of dòngMàn) {
    const ô = l.split('|').map((x) => x.trim().replace(/\*/g, ''));
    const k = nhãnCủa((ô[cột] || '').trim()) || 'khác (không phải nhãn canon — không chép)';
    c[k] = (c[k] || 0) + 1;
  }
  return c;
};
const cộtDev = header.indexOf('dev');
const cộtTT = header.indexOf('Trạng thái');
const tiếnĐộ = {
  sốMàn: dòngMàn.length,
  tàiLiệu: cộtTT > 0 ? đếmÔ(cộtTT) : null,
  dev: cộtDev > 0 ? đếmÔ(cộtDev) : null,
};
if (!dòngMàn.length) gioiHan.push('00-tracking.md chưa có dòng màn nào — tiến độ bỏ trống');

// ─── 3. Cổng: gap theo mức ─────────────────────────────────────────────────────────────────
const gaps = đọcDoc('00-gaps.md');
const dòngGap = gaps.split('\n').filter((l) => /^\|\s*G\d+\s*\|/.test(l));
// Luật "đã đóng" phải GIỐNG HỆT status.js: xét Ô CUỐI và chỉ khi ô đó MỞ ĐẦU bằng dấu đóng.
// Dò cả dòng thì mô tả gap chứa chữ "đóng" ("không đóng được modal") bị tính nhầm là đã xử lý —
// và hai công cụ đọc cùng một file ra hai con số khác nhau là cách chắc nhất để không ai tin số nào.
const đãĐóngGap = (l) => {
  const ô = l.replace(/\|\s*$/, '').split('|');
  return /^(\*\*)?(✅|Đóng|Đã đóng|Đã xử lý|Hoàn thành)/i.test((ô[ô.length - 1] || '').trim());
};
const mứcGap = { '🔴': 0, '🟡': 0, '🟠': 0, '🟢': 0, đãĐóng: 0 };
for (const l of dòngGap) {
  if (đãĐóngGap(l)) { mứcGap.đãĐóng++; continue; }
  for (const m of ['🔴', '🟡', '🟠', '🟢']) if (l.includes(m)) { mứcGap[m]++; break; }
}
const cổng = {
  gap: mứcGap,
  // Scope là CHỮ CỦA DỰ ÁN (có thể là tên màn/nhóm) — chỉ giá trị canon của ba-review mới rời dự án.
  scope: ((v) => (v == null ? null : /^(all|project|requirements|functions|screens|build|discovery|diagram|S\d{2,3})$/i.test(v.trim()) ? v.trim() : 'khác'))(
    (gaps.match(/Scope lần chạy gần nhất:\s*`?([^`·\n]+)`?/) || [, null])[1]),
  toànCục: /Đã phủ:\s*`?all`?/i.test(gaps),
};
if (!gaps) gioiHan.push('chưa có 00-gaps.md — chưa chạy ba-review lần nào, phần cổng bỏ trống');

// ─── 4. Sổ CR / WI / PD ────────────────────────────────────────────────────────────────────
function sổ(tên) {
  const t = đọcDoc(tên);
  if (!t) return null;
  // Mã theo màn `CR-S14-59` (dự án desktop: 371/398 dòng) cũng là dòng sổ — trước đó chỉ 27 dòng được đếm và báo "27/27 mở".
  const rows = t.split('\n').filter((l) => /^\|\s*\*{0,2}(CR|WI)-(S\d+-)?\d+/.test(l));
  const theoTrạngThái = {};
  for (const l of rows) {
    const ô = l.split('|').map((x) => x.trim().replace(/\*/g, ''));
    // Khớp TIỀN TỐ: ô thật hay có phần ghi chú đuôi ("Đã triển khai (docs)"). Đòi khớp tuyệt đối
    // thì mọi dòng rơi vào '?' và sổ nào cũng báo "mở hết" — sai theo hướng dễ tin nhất.
    const TT = ['Đang phân tích', 'Đã triển khai', 'Đang triển khai', 'Đã nghiệm thu', 'Đã áp dụng', 'Đã duyệt', 'Đề xuất', 'Từ chối', 'Hoãn', 'Đóng',
                'Sẵn sàng', 'Đang review', 'Đang làm', 'Backlog', 'Blocked', 'Xong', 'Hủy', 'Huỷ', 'Bị thay'];
    const bắtĐầu = (x, k) => x.toLowerCase().startsWith(k.toLowerCase()); // `Bị THAY` (dự án desktop) = `Bị thay thế` (dự án e-learning)
    const ôTT = ô.find((x) => TT.some((k) => bắtĐầu(x, k)));
    const tt = ôTT ? TT.find((k) => bắtĐầu(ôTT, k)) : '?';
    theoTrạngThái[tt] = (theoTrạngThái[tt] || 0) + 1;
  }
  // "Đã triển khai" CHƯA phải đóng — vòng đời CR còn một bước `Đóng` sau đó (conv-ledgers.md).
  // `Đã nghiệm thu`/`Đã áp dụng` là trạng thái cuối dự án thật dùng thay `Đóng` (dự án desktop 395 dòng) — cùng luật với ba-next/status.js.
  const đóng = /00-cr/.test(tên) ? ['Đóng', 'Từ chối', 'Đã nghiệm thu', 'Đã áp dụng', 'Bị thay'] : ['Xong', 'Hủy', 'Huỷ'];
  return { tổng: rows.length, mở: rows.length - đóng.reduce((s, k) => s + (theoTrạngThái[k] || 0), 0), theoTrạngThái };
}
const pd = đọcDoc('00-decisions.md');
const sổSách = {
  cr: sổ('00-cr.md'),
  wi: sổ('00-backlog.md'),
  pdTreo: pd ? pd.split('\n').filter((l) => /^\|\s*\*{0,2}PD-\d+/.test(l) && /Treo/.test(l)).length : null,
};

// ─── 5. Baseline bị sửa (hàng đợi hook) ────────────────────────────────────────────────────
const jsonl = đọc(path.join(ROOT, '.claude', 'spec-changes.jsonl')).split('\n').filter(Boolean);
let idsChạm = 0;
for (const l of jsonl) { try { idsChạm += (JSON.parse(l).idsChanged || []).length; } catch { /* dòng hỏng: bỏ */ } }
const baseline = { lượtGhi: jsonl.length, idBịChạm: idsChạm };

// ─── 6. Skill thật sự được gọi (chỉ máy này — usage.js tự nói rõ giới hạn đó) ───────────────
let skill = null;
const SKILL_TOOLKIT = new Set(mf ? Object.keys(mf.files || {}).map((f) => (/^\.claude\/skills\/([^/]+)\//.exec(f) || [])[1]).filter(Boolean)
  : (() => { try { return fs.readdirSync(path.join(__dirname, '..', '..')); } catch { return []; } })());
const usagePath = [path.join(ROOT, '.claude', 'skills', 'ba-toolkit', 'scripts', 'usage.js'),
                   path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'usage.js')].find(fs.existsSync);
if (!usagePath) gioiHan.push('không thấy usage.js — phần tần suất skill bỏ trống');
else {
  const r = spawnSync(process.execPath, [usagePath, '--json', '--all'], { encoding: 'utf8', maxBuffer: 1e8, cwd: ROOT });
  // usage.js NÓI RÕ vì sao nó không đo được (không có thư mục transcript khớp tên dự án…). Nuốt lý
  // do đó rồi ghi "không đọc được JSON" là biến một câu trả lời rõ ràng thành một bí ẩn — người đọc
  // báo cáo sẽ đi tìm lỗi parser trong khi sự thật chỉ là máy này chưa từng chạy dự án đó.
  // stderr của usage.js/node có thể mang ĐƯỜNG DẪN máy (tên người dùng, tên dự án — stack trace). Chỉ chép câu đã biết.
  if (r.status !== 0) gioiHan.push(`usage.js không đo được: ${/Không tìm thấy thư mục transcript/.test(r.stderr || '') ? 'không thấy thư mục transcript của dự án trên máy này' : `lỗi (exit ${r.status}) — chạy usage.js tay để xem`}`);
  else try {
    const j = JSON.parse(r.stdout);
    // Khóa thật của usage.js: bảng / đãDùng / chưaDùng / phiên / tổngLượt (xem usage.js `out`).
    skill = { đãGọi: j.đãDùng, chưaGọi: j.chưaDùng, tổngSkill: j.tổngSkill, tổngLượt: j.tổngLượt, sốPhiên: j.phiên,
              // Skill RIÊNG của dự án mang tiền tố ba-/dev-/ac- (vd `ba-<tên-khách>`) cũng vào bảng của usage.js — tên nó
              // là chữ của dự án. Chỉ skill CỦA TOOLKIT (có trong manifest, hoặc cạnh script này khi không có manifest) được chép.
              top: (j.bảng || []).filter((x) => SKILL_TOOLKIT.has(x.skill)).slice(0, 15) };
  } catch { gioiHan.push('usage.js không trả JSON đọc được — phần tần suất skill bỏ trống'); }
}
gioiHan.push('tần suất skill chỉ là thói quen TRÊN MÁY NÀY; "chưa gọi" ≠ "vô dụng" — đừng xoá skill theo con số này');
gioiHan.push('báo cáo này ĐẾM, không phán: nó không biết tài liệu đúng hay sai, chỉ biết có hay không');

// Vào cửa (M7): số phút từ lúc cài tới portal demo / portal dự án thật — đo tiêu chí "người lạ ≤ 15 phút" (docs/decisions/32).
// Sổ do ba-start ghi (.claude/ba-start.json); không có sổ → null (dự án không đi qua ba-start, hoặc cài trước khi có nó).
const vàoCửa = (() => {
  let s = null; try { s = JSON.parse(đọc(path.join(ROOT, '.claude', 'ba-start.json'))); } catch { return null; }
  if (!s || typeof s !== 'object') return null;
  const mốc0 = (nguồn && nguồn.càiLúc) || s.batĐầu || null;
  const phút = (t) => (mốc0 && t ? Math.round((Date.parse(t) - Date.parse(mốc0)) / 60000) : null);
  return { tính: nguồn && nguồn.càiLúc ? 'từ lúc cài' : 'từ lần đầu chạy ba-start', phútTớiDemoPortal: phút(s.demoPortalAt), phútTớiPortalThật: phút(s.firstPortalAt), loại: s.loại || null, hồSơ: s.hồSơ || null };
})();

const out = {
  schema: 1,
  ngày: new Date().toISOString().slice(0, 10),
  dựÁn: WITH_NAME ? { tên: path.basename(ROOT) } : { tên: null },
  hồSơ,
  nguồn,
  sửaTạiChỗ,
  tiếnĐộ,
  cổng,
  sổ: sổSách,
  baseline,
  skill,
  vàoCửa,
  gioiHan,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8');

if (!PLAIN) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

console.log(`\n📊 Báo cáo dự án${WITH_NAME ? ` — ${out.dựÁn.tên}` : ' (ẩn danh)'} · ${out.ngày} · hồ sơ ${hồSơ || '?'}`);
if (nguồn.có) console.log(`Toolkit: ${nguồn.branch || '?'}@${(nguồn.commit || '?').slice(0, 7)} · cài ${(nguồn.càiLúc || '').slice(0, 10)} · ${nguồn.soFile} file`);
else console.log(LÀ_NGUỒN ? 'Toolkit: (đang chạy trong repo NGUỒN — không có gì để so)' : 'Toolkit: chưa có manifest (cài tay?)');
if (sửaTạiChỗ.length) {
  console.log(`\n⚠️  ${sửaTạiChỗ.length} file toolkit bị SỬA TẠI ĐÍCH — đây là tín hiệu mạnh nhất trong báo cáo:`);
  console.log('   một file mà nhiều dự án cùng phải sửa nghĩa là MẶC ĐỊNH CỦA TOOLKIT SAI, không phải người dùng lạc.');
  for (const s of sửaTạiChỗ.slice(0, 12)) console.log(`   · ${s.file} (${s.tình})`);
  if (sửaTạiChỗ.length > 12) console.log(`   · … còn ${sửaTạiChỗ.length - 12} file`);
}
const gọn = (o) => Object.entries(o || {}).map(([k, v]) => `${k} ${v}`).join(' · ') || '—';
console.log(`\nMàn: ${tiếnĐộ.sốMàn} · tài liệu [${gọn(tiếnĐộ.tàiLiệu)}] · dev [${gọn(tiếnĐộ.dev)}]`);
console.log(`Gap: 🔴${mứcGap['🔴']} 🟡${mứcGap['🟡']} 🟠${mứcGap['🟠']} 🟢${mứcGap['🟢']} · ${mứcGap.đãĐóng} đã đóng · scope ${cổng.scope || '(không khai)'}${cổng.toànCục ? '' : ' ⚠️ chưa phủ all'}`);
if (sổSách.cr) console.log(`CR: ${sổSách.cr.mở}/${sổSách.cr.tổng} mở`);
if (sổSách.wi) console.log(`WI: ${sổSách.wi.mở}/${sổSách.wi.tổng} mở`);
if (sổSách.pdTreo) console.log(`PD treo (chờ người quyết): ${sổSách.pdTreo}`);
console.log(`Baseline bị sửa: ${baseline.lượtGhi} lượt ghi · ${baseline.idBịChạm} mã ID bị chạm`);
if (vàoCửa) console.log(`Vào cửa (${vàoCửa.tính}): portal demo ${vàoCửa.phútTớiDemoPortal ?? '—'} phút · portal dự án ${vàoCửa.phútTớiPortalThật ?? '—'} phút · loại ${vàoCửa.loại || '?'} · hồ sơ ${vàoCửa.hồSơ || '?'}`);
if (skill) console.log(`Skill: ${skill.đãGọi}/${skill.tổngSkill} từng gọi · ${skill.tổngLượt} lượt · ${skill.chưaGọi} chưa gọi (${skill.sốPhiên} phiên)`);
console.log(`\nGiới hạn:\n${gioiHan.map((g) => '  · ' + g).join('\n')}`);
console.log(`\n→ ${path.relative(ROOT, OUT)}`);
