#!/usr/bin/env node
/*
 * ba-toolkit/check-md.js — ba phép kiểm CƠ GIỚI trên MỘT file markdown vừa sửa (H1, H2, H3).
 *
 * Vì sao tồn tại: luật của toolkit là chữ trong SKILL.md, và người đọc chữ đó là một model —
 * model bỏ sót được. Đo thật trong một phiên `ba-add-feature` → `dev-run` (dự án desktop,
 * 09-10/09/2026): bảy lỗi lọt qua mọi gate và chỉ bị agent đọc lại bắt sau 3-4 vòng vá, trong
 * khi cả bảy đều kiểm được bằng máy trong vài chục mili-giây. Hai lỗi rẻ nhất trong đó ở đây:
 *
 *   H1  Một DÒNG TRỐNG làm đứt bảng markdown -> 5 test case rơi ra ngoài bảng, mất hết cột,
 *       render thành chữ thô. Agent bắt được ở VÒNG 3.
 *   H2  Roll-up lệch bảng: khai "Auto 12 · Manual 8" trong khi bảng có 13/7. Agent, vòng 3.
 *
 * Là MODULE, không phải chỉ CLI: `hook-lint.js` gọi thẳng trong tiến trình (không spawn — phải
 * dưới 50ms cho mỗi lần Edit). Chạy CLI được để test và soát tay.
 *
 * ─── Luật ngầm quan trọng: KHÔNG PHÁN, chỉ báo thứ đếm được ────────────────────────────────
 * Cả hai đều là `exit 2` = cảnh báo trả lại cho agent, KHÔNG chặn. Lint là heuristic; chặn cứng
 * một heuristic là làm hỏng những lượt hợp lệ.
 *
 * ─── Đường miễn trừ ────────────────────────────────────────────────────────────────────────
 * `<!-- ba-hook: bỏ H1 · <lý do> -->` ở bất kỳ đâu trong file tắt đúng phép kiểm đó cho đúng
 * file đó. BẮT BUỘC có lý do sau dấu `·` — không có đường này thì một ca hợp lệ hiếm gặp sẽ
 * khiến người ta tắt cả hook, và mất hết.
 *
 * Dùng:  node .claude/skills/ba-toolkit/scripts/check-md.js <file.md> [--plain]
 * Exit = số phát hiện (0 = sạch).
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');

const RE_MIỄN = /<!--\s*ba-hook:\s*bỏ\s+(H\d)\s*·\s*(.+?)\s*-->/g;

function miễnTrừ(text) {
  const ra = {};
  let m;
  RE_MIỄN.lastIndex = 0;
  while ((m = RE_MIỄN.exec(text))) ra[m[1]] = m[2];
  return ra;
}

// Tách file thành các KHỐI liên tiếp gồm toàn dòng mở đầu bằng `|`.
//
// BA BẪY, cả ba đều đo được trên example/docs ở lần chạy đầu (7 file kêu oan, 0 lỗi thật):
//  1. KHỐI ``` — `ascii-screen.md` và `sitemap.md` đầy wireframe ASCII mở đầu bằng `|`. Không bỏ
//     qua fence thì mỗi wireframe thành một "bảng gãy". Đây là nguồn oan lớn nhất.
//  2. Dòng đầu chỉ 1 cột thì KHÔNG phải bảng — bảng markdown thật luôn có >=2 cột. Chốt này
//     dọn nốt phần ASCII art nằm ngoài fence.
//  3. `|` trong code inline: ô ghi "8 quan hệ đều ghi `||--o{`" bị đếm thành 2 vạch cột thừa.
//     Phải che `` `...` `` trước khi đếm — mermaid/ERD viết trong tài liệu BA đầy ký tự này.
function khốiBảng(dòng) {
  const khối = [];
  let cur = null;
  let trongFence = false;
  for (let i = 0; i < dòng.length; i++) {
    if (/^\s*(```|~~~)/.test(dòng[i])) { trongFence = !trongFence; if (cur) { khối.push(cur); cur = null; } continue; }
    if (!trongFence && /^\s*\|/.test(dòng[i])) {
      if (!cur) cur = { từ: i, dòng: [] };
      cur.dòng.push({ i, raw: dòng[i] });
    } else if (cur) { khối.push(cur); cur = null; }
  }
  if (cur) khối.push(cur);
  // Bảng thật có >=2 cột ở dòng đầu; dưới ngưỡng đó là ASCII art, không phải bảng.
  return khối.filter((k) => sốCột(k.dòng[0].raw) >= 2);
}

// Che nội dung code inline trước khi đếm cột — `||--o{`, `a|b` trong backtick không phải vạch cột.
// (từ dự án desktop 17/09) che thêm vạch THOÁT `\|` — srs ở đây viết miền giá trị kiểu
// "Thuộc `md` \| `html` \| `mp4`", đúng markdown nhưng bản gốc đếm thành cột thừa (G55).
// Cả hai phép che GIỮ NGUYÊN ĐỘ DÀI để cắt theo vị trí trên chuỗi gốc vẫn khớp.
const cheCode = (l) => l
  .replace(/\\\|/g, '\u0000\u0000')
  .replace(/`[^`]*`/g, (m) => '\u0000'.repeat(m.length));

// Cắt dòng bảng thành các ô theo vạch THẬT; nội dung ô trả về vẫn nguyên văn vì chỉ che bản sao.
function cắtÔ(l) {
  const s = l.trim();
  const che = cheCode(s);
  const ra = [];
  let đầu = 0;
  for (let i = 0; i < che.length; i++) if (che[i] === '|') { ra.push(s.slice(đầu, i)); đầu = i + 1; }
  ra.push(s.slice(đầu));
  if (ra.length && ra[0].trim() === '') ra.shift();
  if (ra.length && ra[ra.length - 1].trim() === '') ra.pop();
  return ra.map((x) => x.trim());
}
const sốCột = (l) => cắtÔ(l).length;
const làNgăn = (l) => /^\s*\|[\s:|-]*\|\s*$/.test(l) && /-/.test(l);

/*
 * H1 — bảng markdown toàn vẹn.
 *
 * Hai dấu hiệu, chọn có chủ đích để KHÔNG kêu oan:
 *  (a) Khối bảng không có dòng ngăn (`|---|---|`) mà lại rộng >=3 cột và >=2 dòng → đây là phần
 *      ĐUÔI của một bảng đã bị dòng trống cắt rời. Một dòng `|` lẻ trong văn xuôi không dính vì
 *      đòi >=2 dòng; một bảng 2 cột nhỏ không dính vì đòi >=3 cột.
 *  (b) Trong một khối CÓ dòng ngăn, dòng nào lệch số cột so với header → mất cột khi render.
 *      Bỏ qua dòng ngăn (dấu `:` căn lề làm số cột đếm khác).
 */
function H1(text) {
  const dòng = text.split('\n');
  const ra = [];
  for (const k of khốiBảng(dòng)) {
    const cóNgăn = k.dòng.some((d) => làNgăn(d.raw));
    if (!cóNgăn) {
      if (k.dòng.length >= 2 && sốCột(k.dòng[0].raw) >= 3) {
        ra.push({ mã: 'H1', dòng: k.dòng[0].i + 1,
          thông: `bảng ${k.dòng.length} dòng × ${sốCột(k.dòng[0].raw)} cột KHÔNG có dòng ngăn \`|---|\` — nhiều khả năng một dòng trống đã cắt rời nó khỏi header phía trên; markdown sẽ render thành chữ thô, mất hết cột` });
      }
      continue;
    }
    const header = k.dòng.find((d) => !làNgăn(d.raw));
    if (!header) continue;
    const n = sốCột(header.raw);
    for (const d of k.dòng) {
      if (làNgăn(d.raw)) continue;
      const c = sốCột(d.raw);
      if (c !== n) ra.push({ mã: 'H1', dòng: d.i + 1, thông: `dòng có ${c} cột, header có ${n} — lệch cột thì ô cuối bị nuốt hoặc dồn sang ô khác` });
    }
  }
  return ra;
}

/*
 * H2 — roll-up của `test.md` phải khớp bảng TC đếm được.
 *
 * Nguồn luật: `ba-test/assets/template.md` §"Tổng hợp thực thi (roll-up)" — chính nó ghi rõ
 * "Đếm Pass/Fail/Blocked/Skip theo cột **Kết quả**; `Chưa chạy` theo cột **Trạng thái**".
 * Chỉ chạy khi file CÓ mục roll-up; file khác im lặng bỏ qua.
 */
function H2(text) {
  const dòng = text.split('\n');
  const iRoll = dòng.findIndex((l) => /^##+\s.*roll-?up/i.test(l));
  if (iRoll < 0) return [];
  // Bảng roll-up = khối bảng đầu tiên sau tiêu đề đó
  const khối = khốiBảng(dòng).filter((k) => k.từ > iRoll);
  if (!khối.length) return [];
  const rollHeader = khối[0].dòng.find((d) => !làNgăn(d.raw));
  const rollSố = khối[0].dòng.filter((d) => !làNgăn(d.raw) && d !== rollHeader)[0];
  if (!rollHeader || !rollSố) return [];
  const ô = (l) => cắtÔ(l).map((x) => x.replace(/\*/g, ''));
  const cột = ô(rollHeader.raw).map((x) => x.toLowerCase());
  const giá = ô(rollSố.raw);
  const khai = {};
  for (let i = 0; i < cột.length; i++) {
    const c = cột[i];
    const v = parseInt((giá[i] || '').replace(/[^\d]/g, ''), 10);
    if (Number.isNaN(v)) continue;
    if (/tổng/.test(c)) khai['Tổng TC'] = v;
    else if (/^pass$/.test(c)) khai.Pass = v;
    else if (/^fail$/.test(c)) khai.Fail = v;
    else if (/blocked/.test(c)) khai.Blocked = v;
    else if (/^skip$/.test(c)) khai.Skip = v;
    else if (/chưa chạy/.test(c)) khai['Chưa chạy'] = v;
  }
  if (!Object.keys(khai).length) return [];

  // Đếm thật từ các bảng TC: dòng mở đầu bằng | TC-...
  const thật = { 'Tổng TC': 0, Pass: 0, Fail: 0, Blocked: 0, Skip: 0, 'Chưa chạy': 0 };
  for (const k of khốiBảng(dòng)) {
    const header = k.dòng.find((d) => !làNgăn(d.raw) && /\bMã TC\b/i.test(d.raw));
    if (!header) continue;
    const h = ô(header.raw).map((x) => x.toLowerCase());
    const iTT = h.findIndex((x) => /^trạng thái$/.test(x));
    const iKQ = h.findIndex((x) => /^kết quả$/.test(x));
    for (const d of k.dòng) {
      if (làNgăn(d.raw) || d === header) continue;
      const c = ô(d.raw);
      if (!/^\*{0,2}TC-/.test(c[0] || '')) continue;
      thật['Tổng TC']++;
      // vá cục bộ dự án desktop: nhiều test.md ở đây gộp kết quả vào cột `Trạng thái` và KHÔNG có cột
      // `Kết quả` (S30). Không lùi về `Trạng thái` thì đếm ra 0 Pass và kêu oan roll-up.
      const iPass = iKQ >= 0 ? iKQ : iTT;
      const kq = iPass >= 0 ? (c[iPass] || '') : '';
      const tt = iTT >= 0 ? (c[iTT] || '') : '';
      // vá cục bộ dự án desktop: ô kết quả ở đây hay có huy hiệu dẫn trước (`✅ Pass`). Neo cứng `^Pass`
      // thì đếm hụt và roll-up ĐÚNG lại bị kêu sai — bỏ qua phần không phải chữ ở đầu ô.
      const kqSạch = kq.replace(/^[^\p{L}]+/u, '');
      if (/^Pass/i.test(kqSạch)) thật.Pass++;
      else if (/^Fail/i.test(kqSạch)) thật.Fail++;
      else if (/^Blocked/i.test(kqSạch)) thật.Blocked++;
      else if (/^Skip/i.test(kqSạch)) thật.Skip++;
      if (/Chưa chạy/i.test(tt)) thật['Chưa chạy']++;
    }
  }
  if (!thật['Tổng TC']) return [];   // không đếm được dòng TC nào → im, đừng đoán

  const ra = [];
  for (const k of Object.keys(khai)) {
    if (khai[k] !== thật[k]) ra.push({ mã: 'H2', dòng: rollSố.i + 1, thông: `roll-up khai ${k} = ${khai[k]} nhưng đếm được ${thật[k]} trong bảng TC` });
  }
  return ra;
}

/*
 * H3 — SƠ ĐỒ và BẢNG trong CÙNG một mục `##` phải nói cùng một tập mã (steal B23).
 *
 * Vì sao: sơ đồ được vẽ một lần rồi hiếm khi ai sửa lại khi bảng thêm dòng. Đo trên chính dự án
 * mẫu 20/09/2026: `08-roadmap.md` có `F14` (thêm qua CR-01) trong bảng, nhưng CẢ HAI sơ đồ đều
 * thiếu — mà prose ngay trên sơ đồ còn khẳng định "Đã kiểm: đủ 13 F..". `ba-review` từng bắt
 * được nó bằng LLM (gap G06) sau nhiều vòng; máy so hai tập mã thì rẻ và không quên.
 *
 * Chống ồn — so theo MỤC và theo HỌ MÃ, chỉ khi cả hai bên đều có họ đó:
 *   · so cả file thì một sơ đồ tổng quan luôn "thiếu" mọi mã của các bảng khác (đo: 14 báo oan);
 *   · bảng liệt kê `S..` cạnh sơ đồ vẽ `F..` là chuyện thường, không phải lệch.
 * Vì vậy phép kiểm chỉ nói khi CÙNG mục, CÙNG họ, mà tập mã hai bên khác nhau.
 */
const HỌ = (id) => id.replace(/\d+/g, '#');
const RE_ID = /\b([A-Z][A-Za-z]{0,4}-?(?:S\d{1,3}-)?\d{1,3})\b/g;

const NGƯỠNG_LIỆT_KÊ = 3;     // sơ đồ phải nêu ≥3 mã cùng họ mới coi là "liệt kê" họ đó
const NGƯỠNG_PHỦ = 0.6;       // …và phủ ≥60% số mã của họ ấy trong bảng

function H3(text) {
  const dòng = text.split('\n');
  const bảng = new Map();      // họ → Set mã (toàn file, lấy từ Ô ĐẦU mỗi dòng bảng = mã của chính dòng)
  const khối = [];             // mỗi khối mermaid: { dòng, mã: Map họ→Set }
  const thêm = (kho, id) => { const h = HỌ(id); if (!kho.has(h)) kho.set(h, new Set()); kho.get(h).add(id); };
  let trongMermaid = false, trongCode = false, hiệnTại = null;
  for (let i = 0; i < dòng.length; i++) {
    const l = dòng[i];
    if (/^```/.test(l.trim())) {
      const mở = /^```\s*mermaid/i.test(l.trim());
      if (!trongCode && !trongMermaid) {
        trongCode = !mở; trongMermaid = mở;
        if (mở) { hiệnTại = { dòng: i + 1, mã: new Map() }; khối.push(hiệnTại); }
      } else { trongCode = false; trongMermaid = false; hiệnTại = null; }
      continue;
    }
    if (trongMermaid) {
      // Bỏ dòng khai màu/kiểu: `classDef now fill:#EEF0FF` chứa chuỗi trông như mã.
      if (/^\s*(classDef|style|linkStyle|click|%%)/.test(l)) continue;
      for (const m of l.replace(/#[0-9A-Fa-f]{3,8}\b/g, '').matchAll(RE_ID)) thêm(hiệnTại.mã, m[1]);
      continue;
    }
    if (trongCode) continue;
    if (/^\s*\|/.test(l) && !làNgăn(l)) {
      const ô = (cắtÔ(l)[0] || '').replace(/\*\*/g, '').trim();
      const m = new RegExp('^' + RE_ID.source + '$').exec(ô);
      if (m) thêm(bảng, m[1]);
    }
  }

  const ra = [];
  for (const k of khối) {
    for (const [họ, trongSơĐồ] of k.mã) {
      const trongBảng = bảng.get(họ);
      if (!trongBảng || !trongBảng.size) continue;          // họ này không có bảng nào liệt kê → không so
      const chung = [...trongSơĐồ].filter((x) => trongBảng.has(x));
      // Sơ đồ chỉ NHẮC vài mã (luồng, ví dụ) thì không phải bản liệt kê — im. Chỉ sơ đồ nào đã
      // vẽ gần đủ họ mới bị đòi vẽ đủ; đây là chỗ phân biệt "thiếu sót" với "không định vẽ".
      if (chung.length < NGƯỠNG_LIỆT_KÊ || chung.length / trongBảng.size < NGƯỠNG_PHỦ) continue;
      const thiếu = [...trongBảng].filter((x) => !trongSơĐồ.has(x)).sort();
      const thừa = [...trongSơĐồ].filter((x) => !trongBảng.has(x)).sort();
      if (thiếu.length) ra.push({ mã: 'H3', dòng: k.dòng, thông: `sơ đồ liệt kê ${chung.length}/${trongBảng.size} mã họ ${họ} nhưng THIẾU ${thiếu.join(', ')} (bảng trong file có) — sơ đồ vẽ một lần rồi bảng thêm dòng, không ai vẽ lại` });
      if (thừa.length) ra.push({ mã: 'H3', dòng: k.dòng, thông: `sơ đồ có ${thừa.join(', ')} mà không bảng nào trong file liệt kê — mã đã đổi/bỏ nhưng sơ đồ giữ bản cũ` });
    }
  }
  return ra;
}

function kiểm(file) {
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch { return []; }
  const miễn = miễnTrừ(text);
  let ra = [];
  if (!miễn.H1) ra = ra.concat(H1(text));
  if (!miễn.H2) ra = ra.concat(H2(text));
  if (!miễn.H3) ra = ra.concat(H3(text));
  return ra.map((r) => ({ ...r, file }));
}

module.exports = { kiểm, H1, H2, H3, miễnTrừ };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith('--'));
  if (!file) { console.error('Usage: check-md.js <file.md> [--plain]'); process.exit(1); }
  const ra = kiểm(file);
  if (argv.includes('--plain')) {
    if (!ra.length) console.log('✅ sạch');
    for (const r of ra) console.log(`  ⚠️  ${r.mã} · dòng ${r.dòng}: ${r.thông}`);
  } else console.log(JSON.stringify({ file, phátHiện: ra }, null, 2));
  process.exit(ra.length);
}
