#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
/*
 * ba-feasible/scan-feasible.js — soát TÍNH KHẢ THI của bộ tài liệu, TRƯỚC khi sinh plan.
 * Zero-dependency. Chỉ đọc. Không phán xét ngoại lệ — trả JSON để skill diễn giải.
 *
 * VÌ SAO TỒN TẠI: `ba-review` soát ĐỘ PHỦ (yêu cầu nào chưa có màn, màn nào chưa có test) và
 * `ba-consistency-reviewer` soát MÂU THUẪN giữa các tài liệu. Cả hai đều đọc tài liệu bằng con
 * mắt của người ĐỌC. Không cái nào hỏi câu của người SẮP CODE: "viết được cái này ra không?"
 *
 * Ba lỗ thật lọt qua cả hai, tìm thấy 31/08/2026 khi build màn S01 từ chính bộ tài liệu đó:
 *   - `BRule-S01-03` đếm "3 lần khoá tạm liên tiếp" mà `05-data-model` KHÔNG có trường nào giữ
 *     số chu kỳ khoá → luật đọc rất xuôi, viết ra thì không có chỗ lưu, và không kiểm chứng được.
 *   - `10-architecture` §10 vẽ cây backend, không một dòng nào về frontend, dù ADR chốt Next.js
 *     → mọi plan có phần giao diện đều phải tự bịa đường dẫn.
 *   - `design-spec` có microcopy "Phiên đăng nhập đã hết hạn" mà `srs` không mã lỗi nào đỡ.
 * Cả ba đều là tài liệu TỰ NHẤT QUÁN nhưng CHƯA ĐỦ ĐỂ HIỆN THỰC. Đó là khoảng trống này lấp.
 *
 * Dùng:  node .claude/skills/ba-feasible/scripts/scan-feasible.js [docsDir=docs] [<mã hoặc tên màn>] [--plain]
 *         Có lọc màn → CHỈ soát màn đó, và các check cấp dự án (endpoint, cây thư mục) bị bỏ
 *         qua vì chúng không thuộc scope nào — script NÓI RA điều đó, không bỏ im lặng.
 * Exit:  0 = không phát hiện gì (hoặc chỉ có gợi ý 🟢 "chưa quét yêu cầu ngầm") · 1 = có phát hiện
 *        · 2 = không đọc được tài liệu nguồn. JSON có `gioiHan` — điều script KHÔNG soát được.
 * Mã luật (chỉ luật 9 opt-in rule-cover.js): `--rules` in JSON [{mã, môTả}]; finding luật 9 có trường `luat` và --plain in
 * `… [F9a]`; có BA_RULE_LOG thì ghi mã đã bắn. Gợi ý 🟢 "chưa quét" không phải luật gác (không đổi exit) nên không có mã.
 */
const fs = require('fs');
const path = require('path');
const { readDoc, hasDoc } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));

require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'rule-cover.js')).inLuật(process.argv, [
  ['F9a', 'Quét yêu cầu ngầm thiếu chiều'], ['F9b', 'Quét yêu cầu ngầm ô rỗng / n/a không lý do / không trỏ mã'],
  ['F9c', 'Quét yêu cầu ngầm trỏ mã không được khai'], ['F9d', 'Quét yêu cầu ngầm mượn mã giữa các chiều không giải thích'],
]);
const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const PLAIN = process.argv.includes('--plain');
const DOCS = path.resolve(argv[0] || 'docs');
/** Lọc theo màn: nhận mã (`S01`) hoặc tên (`Login`), không phân biệt hoa thường. */
const LOC = (argv[1] || '').trim();
if (!fs.existsSync(DOCS)) { console.error(`Không thấy ${DOCS}`); process.exit(2); }

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const findings = [];
const add = (loai, muc, scope, moTa, suaBang, luat) =>
  findings.push(luat ? { loai, muc, scope, moTa, suaBang, luat } : { loai, muc, scope, moTa, suaBang });

/* ── Gom folder màn (Screen-spec/ tuỳ chọn — dự án cũ để màn thẳng dưới docs/) ───────────── */
const screens = [];
(function quétMàn(dir, group) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (!e.isDirectory()) continue;
    const m = /^(S\d+)\s+-\s+(.+)$/.exec(e.name);
    if (m) screens.push({ code: m[1], name: m[2], dir: path.join(dir, e.name), group });
    else if (e.name !== 'Ho-so' && !e.name.startsWith('.')) quétMàn(path.join(dir, e.name), e.name);
  }
})(DOCS, null);
screens.sort((a, b) => a.code.localeCompare(b.code));

// Lọc màn TRƯỚC mọi check. Bản đầu nhận tham số này rồi lờ đi: chạy `ba-feasible S01` vẫn ra
// phát hiện của cả 6 màn — người dùng hoặc sửa nhầm màn, hoặc tưởng S01 bẩn trong khi nó sạch.
// Scope sai mà im lặng còn tệ hơn không có scope.
const tấtCảMàn = screens.slice();
if (LOC) {
  const khớp = screens.filter((s) => s.code.toLowerCase() === LOC.toLowerCase()
    || s.name.toLowerCase() === LOC.toLowerCase()
    || `${s.code} - ${s.name}`.toLowerCase() === LOC.toLowerCase());
  if (!khớp.length) {
    console.error(`Không thấy màn "${LOC}". Có: ${tấtCảMàn.map((s) => `${s.code} (${s.name})`).join(', ')}`);
    process.exit(2);
  }
  screens.length = 0;
  screens.push(...khớp);
}

const dataModel = readDoc(DOCS, '05-data-model.md');
const apiSpec = readDoc(DOCS, '06-api-spec.md');
const arch = readDoc(DOCS, '10-architecture.md');
const functions = readDoc(DOCS, '02-functions.md');

/* ── 1. BRule nhắc trường dữ liệu nào thì trường đó phải TỒN TẠI ─────────────────────────
 * Luật nghiệp vụ hay viện tới một mẩu trạng thái (`fail_count`, `lock_expires`, cờ…). Nếu mô
 * hình dữ liệu không có nó, luật KHÔNG hiện thực được và cũng KHÔNG kiểm chứng được — nhưng
 * đọc tài liệu vẫn thấy trơn tru. Chỉ soi token snake_case trong dấu backtick: đó là quy ước
 * đặt tên trường của bộ tài liệu, và nó đủ hẹp để không bắt nhầm tên hàm/endpoint.        */
if (dataModel) {
  const trườngCó = new Set();
  for (const m of dataModel.matchAll(/^\|\s*([a-z][a-z0-9_]{2,})\s*\|/gm)) trườngCó.add(m[1]);
  for (const m of dataModel.matchAll(/^\s+\w+\s+([a-z][a-z0-9_]{2,})\s*$/gm)) trườngCó.add(m[1]);

  for (const sc of screens) {
    const srs = read(path.join(sc.dir, 'srs.md'));
    if (!srs) continue;
    for (const dòng of srs.split('\n')) {
      const mã = /^\|\s*(BRule-S\d+-\d+)\s*\|/.exec(dòng);
      if (!mã) continue;
      const tokens = new Set([...dòng.matchAll(/`([a-z][a-z0-9_]*_[a-z0-9_]+)`/g)].map((x) => x[1]));
      const thiếu = [...tokens].filter((t) => !trườngCó.has(t));
      if (thiếu.length) {
        add('🔴', 'BRule thiếu chỗ lưu', sc.code,
          `${mã[1]} viện tới ${thiếu.map((t) => `\`${t}\``).join(', ')} — không trường nào trong \`05-data-model.md\` mang tên đó, nên luật này không hiện thực và không kiểm chứng được`,
          'ba-change-request (thêm trường vào 05-data-model) hoặc sửa BRule cho khớp tên trường có thật');
      }
    }
  }
} else add('🟡', 'Thiếu tài liệu nguồn', '—', 'Không có `05-data-model.md` — không kiểm được luật nghiệp vụ có chỗ lưu hay chưa', 'ba-data-model');

/* ── 2. Mỗi E-S.. phải có thông báo cho người dùng ──────────────────────────────────────
 * Một mã lỗi bỏ trống ô "người dùng thấy gì" nghĩa là câu chữ sẽ do lập trình viên tự đặt lúc
 * code, và BA chỉ phát hiện ở UAT — muộn nhất có thể.
 * CỐ Ý KHÔNG kiểm "E-S.. đã có TC chưa": đó là luật của `ba-review`, và lặp lại ở đây thì cùng
 * một vấn đề bị báo hai lần bởi hai skill — người dùng sẽ học cách bỏ qua cả hai.
 */
for (const sc of screens) {
  const srs = read(path.join(sc.dir, 'srs.md'));
  if (!srs) continue;
  for (const dòng of srs.split('\n')) {
    const m = /^\|\s*(E-S\d+-\d+)\s*\|/.exec(dòng);
    if (!m) continue;
    const ô = dòng.replace(/\|\s*$/, '').split('|').map((x) => x.trim());
    const trống = (x) => !x || x === '—' || /^(TBD|tbd|\?+)$/.test(x);
    // Bảng chuẩn 7 cột: Mã | Lỗi | Xảy ra khi | Mức | Trace | Người dùng thấy gì | Lối thoát
    if (ô.length >= 7 && trống(ô[6])) {
      add('🟡', 'Lỗi chưa có wording', sc.code,
        `${m[1]} không nói người dùng thấy gì — lúc code sẽ do lập trình viên tự đặt câu chữ, và BA chỉ phát hiện ở UAT`,
        `ba-screen-spec ${sc.name} (bổ sung cột "Người dùng thấy gì")`);
    }
  }
}

/* ── 3. Trạng thái trong sơ đồ phải có lối hiện ra giao diện ─────────────────────────────
 * Một state vẽ trong stateDiagram mà không chỗ nào ngoài sơ đồ nhắc tới nghĩa là: hệ thống vào
 * được trạng thái đó, còn người dùng thì không biết mình đang ở đó.
 * Bóc khối ``` bằng regex chứ không split('```'): file có khối lồng hoặc số fence lẻ thì
 * split cho ra các mẩu lệch pha, và mọi state đều bị chấm là "không ai nhắc" — dương tính giả
 * hàng loạt, đúng cái đã xảy ra ở bản đầu của check này.
 */
for (const sc of screens) {
  const srs = read(path.join(sc.dir, 'srs.md'));
  if (!/stateDiagram/.test(srs)) continue;
  const states = new Set();
  for (const m of srs.matchAll(/^\s*(?:\[\*\]|[A-Z][A-Z_]{2,})\s*-->\s*([A-Z][A-Z_]{2,})/gm)) states.add(m[1]);
  const bỏKhốiCode = (t) => t.replace(/```[\s\S]*?```/g, ' ');
  const nơiKhác = [
    bỏKhốiCode(srs),
    read(path.join(sc.dir, 'test.md')),
    read(path.join(sc.dir, 'usecase.md')),
    read(path.join(sc.dir, 'design-spec.md')),
  ].join('\n');
  // Gộp thành MỘT phát hiện cho cả màn: 7 trạng thái mồ côi là một vấn đề, không phải bảy.
  // Báo bảy dòng cho một nguyên nhân là đúng kiểu làm người ta học cách bỏ qua báo cáo.
  const mồCôi = [...states].filter((st) => !nơiKhác.includes(st));
  if (mồCôi.length) {
    add('🟡', 'Trạng thái không lối ra giao diện', sc.code,
      `${mồCôi.length} trạng thái chỉ tồn tại trong sơ đồ, ngoài sơ đồ không tài liệu nào của màn nhắc tới: ${mồCôi.map((x) => `\`${x}\``).join(', ')} — hệ thống vào được, người dùng không biết mình đang ở đó và không TC nào kiểm`,
      `ba-screen-spec ${sc.name} (đưa vào mục UI state + ma trận lỗi) rồi ba-test`);
  }
}

/* ── 4. Mỗi chức năng phải có endpoint, hoặc nói rõ vì sao không cần ─────────────────────── */
if (functions && apiSpec && !LOC) {
  const fs_ = [...functions.matchAll(/^\|\s*(F\d+)\s*\|/gm)].map((m) => m[1]);
  const cóTrongApi = new Set([...apiSpec.matchAll(/\b(F\d+)\b/g)].map((m) => m[1]));
  for (const f of [...new Set(fs_)]) {
    if (cóTrongApi.has(f)) continue;
    const dòng = functions.split('\n').find((l) => l.startsWith(`| ${f} |`)) || '';
    // Cron/batch/job không cần endpoint — nhưng phải NÓI ra, không để người đọc tự đoán.
    const làNền = /cron|batch|job|nền|scheduler|hàng đợi/i.test(dòng);
    add(làNền ? '🟢' : '🟡', 'Chức năng chưa có endpoint', f,
      làNền
        ? `${f} là việc chạy nền nên không cần endpoint — xác nhận lại là có chủ đích, và ghi ai/plan nào build nó (không màn nào chứa nó)`
        : `${f} không được \`06-api-spec.md\` nhắc tới — dev sẽ không biết gọi gì`,
      làNền ? 'ba-build (giao cho một plan cụ thể)' : 'ba-api-spec / ba-change-request');
  }
}

/* ── 5. Kiến trúc chốt tầng nào thì §10 phải có cây thư mục cho tầng đó ─────────────────── */
if (arch && !LOC) {
  const mucCay = /##\s*\d+\.\s*Cấu trúc thư mục/.test(arch);
  if (!mucCay) {
    add('🔴', 'Kiến trúc thiếu cây thư mục', '10-architecture',
      'Không có mục "Cấu trúc thư mục chuẩn" — `ba-build` buộc file path bám cấu trúc đã chốt, không có thì mọi plan phải tự bịa',
      'ba-architecture');
  } else {
    const khối = arch.slice(arch.search(/##\s*\d+\.\s*Cấu trúc thư mục/));
    const cây = khối.slice(0, khối.indexOf('## 1') > 0 ? khối.indexOf('## 1') : 4000);
    const FE = /next\.?js|react|vue|angular|svelte|nuxt|remix/i;
    const cóFEtrongADR = FE.test(arch);
    // Tầng giao diện không nhất thiết theo khuôn Next/React: HTML tĩnh do backend phục vụ hay đặt
    // ở `webui/`, `web/`, `ui/`, `frontend/`, `client/`, `static/` — và lồng dưới gói (`src/<gói>/webui/`).
    // Chỉ nhận khuôn cũ thì một cây CÓ nhánh giao diện vẫn bị 🔴 "thiếu frontend", nhất là khi
    // chữ "React" chỉ nằm trong phương án BỊ LOẠI của ADR (W2 OAN-4 07/10/2026, P5 ADR-04).
    const cóFEtrongCây = /\bapp\/|components\/|pages\/|src\/app|\.tsx/i.test(cây) ||
      /(?:^|[\s│├└─/])(?:webui|web|ui|frontend|client|static)\//im.test(cây);
    if (cóFEtrongADR && !cóFEtrongCây) {
      add('🔴', 'Cây thư mục thiếu tầng frontend', '10-architecture',
        'ADR chốt một framework frontend nhưng mục "Cấu trúc thư mục chuẩn" không có nhánh nào cho nó — mọi plan có phần giao diện sẽ tự bịa đường dẫn, và mỗi màn bịa một kiểu',
        'ba-architecture (bổ sung cây frontend vào §10)');
    }
  }
}

/* ── 6. Mỗi TC phải có task trong plan phủ ───────────────────────────────────────────────
 * Đây là chỗ mà "tài liệu đủ" và "build được" khác nhau rõ nhất: TC mô tả phải kiểm gì, plan
 * mới là thứ dev chạy. TC không task nào phủ = không ai code phần đó.                       */
for (const sc of screens) {
  const test = read(path.join(sc.dir, 'test.md'));
  const plan = read(path.join(sc.dir, 'plan.md'));
  if (!test || !plan) continue;
  const tcTest = [...new Set([...test.matchAll(/^\|\s*(TC-S\d+-\d+)\s*\|/gm)].map((m) => m[1]))];
  // Plan hay viết khoảng: `TC-S02-04…09`, `TC-S02-30…35`, `TC-S02-19...23`. Khớp chuỗi thuần
  // sẽ chỉ thấy đầu khoảng và báo phần giữa là "chưa ai phủ" — dương tính giả, và trớ trêu là
  // ĐÚNG loại lỗi mà chính skill này cảnh báo về tên test gộp mã. Nở khoảng ra trước khi so.
  const tcPlan = new Set([...plan.matchAll(/TC-S(\d+)-(\d+)/g)].map((m) => m[0]));
  for (const m of plan.matchAll(/TC-S(\d+)-(\d+)\s*(?:…|\.\.\.|\.\.)\s*(\d+)/g)) {
    const [, màn, từ, đến] = m;
    for (let i = Number(từ); i <= Number(đến); i++) {
      tcPlan.add(`TC-S${màn}-${String(i).padStart(từ.length, '0')}`);
    }
  }
  const thiếu = tcTest.filter((t) => !tcPlan.has(t));
  if (thiếu.length) {
    add(thiếu.length > tcTest.length / 4 ? '🔴' : '🟡', 'TC không task nào phủ', sc.code,
      `${thiếu.length}/${tcTest.length} TC không task nào trong \`plan.md\` nhắc tới (${thiếu.slice(0, 6).join(', ')}${thiếu.length > 6 ? '…' : ''}) — phần đó sẽ không ai code`,
      `ba-build ${sc.name}`);
  }
}

/* ── 7. Đường dẫn trong plan phải bám cây thư mục đã chốt ────────────────────────────────── */
if (arch && /##\s*\d+\.\s*Cấu trúc thư mục/.test(arch)) {
  const khối = arch.slice(arch.search(/##\s*\d+\.\s*Cấu trúc thư mục/), arch.search(/##\s*\d+\.\s*Cấu trúc thư mục/) + 3000);
  const thưMụcChốt = new Set([...khối.matchAll(/^\s*[│├└─\s]*([a-z][a-z0-9_-]*)\//gm)].map((m) => m[1])); // `_`: gói Python
  // Bố cục Python/gói: cây khai `src/<gói>/` trên một dòng → `<gói>` là TIỀN TỐ GÓI, không phải
  // thư mục lạ; khi đó soi thư mục kế sau gói (nếu có) thay vì dừng ở cấp 1 (W2 OAN-5 07/10/2026, P5).
  const gói = new Set([...khối.matchAll(/^\s*[│├└─\s]*src\/([a-z][a-z0-9_-]*)\//gm)].map((m) => m[1]));
  for (const sc of screens) {
    const plan = read(path.join(sc.dir, 'plan.md'));
    if (!plan) continue;
    const lạ = new Set();
    // CHỈ soi dòng khai file (`- Create:` / `- Modify:` / `- Test:`). Soi cả file thì một dòng
    // ghi chú lịch sử kiểu "bản trước dùng `src/api/…`" cũng bị chấm là lệch — đúng dương tính
    // giả đã gặp ở S01, và nó tệ vì nó phạt chính việc ghi lại lý do thay đổi.
    for (const dòng of plan.split('\n')) {
      if (!/^\s*-\s*(Create|Modify|Test|Tạo|Sửa)\s*:/i.test(dòng)) continue;
      for (const m of dòng.matchAll(/`(src\/([a-z][a-z0-9_-]*)\/[^`]+)`/g)) {
        if (!thưMụcChốt.size || thưMụcChốt.has(m[2])) continue; // như cũ: cấp 1 có trong cây là đủ
        if (gói.has(m[2])) { // chỉ nới cho tiền tố gói — không bao giờ báo NHIỀU hơn luật cũ
          const con = /^src\/[^/]+\/([a-z][a-z0-9_-]*)\/./.exec(m[1]); // còn cấp thư mục sau gói?
          if (con && !thưMụcChốt.has(con[1])) lạ.add(`${m[2]}/${con[1]}`);
        } else lạ.add(m[2]);
      }
    }
    if (lạ.size) {
      add('🟡', 'Plan lệch cây thư mục', sc.code,
        `\`plan.md\` dùng \`src/${[...lạ].join('/`, `src/')}/\` — không thư mục nào trong §10 của \`10-architecture.md\` mang tên đó; dev theo plan này sẽ đẻ ra cây thứ hai song song`,
        `ba-build ${sc.name}`);
    }
  }
}

/* ── 8. Microcopy trong design-spec phải có nguồn trong srs ──────────────────────────────
 * Câu chữ hiện ra cho người dùng là một khẳng định nghiệp vụ. Nằm một mình trong `design-spec`
 * mà `srs` không mã lỗi/yêu cầu nào đỡ thì không ai biết nó xuất hiện KHI NÀO — và lúc code,
 * lập trình viên hoặc bỏ qua nó, hoặc tự nghĩ ra điều kiện hiển thị.
 */
for (const sc of screens) {
  const ds = read(path.join(sc.dir, 'design-spec.md'));
  const srs = read(path.join(sc.dir, 'srs.md'));
  if (!ds || !srs) continue;
  const câu = new Set();
  for (const m of ds.matchAll(/`([^`\n]{15,120}?[.!?])`/g)) {
    const t = m[1].trim();
    // Chỉ lấy câu tiếng Việt hướng người dùng: có khoảng trắng, không phải đường dẫn/mã.
    if (/[\/_{}<>]/.test(t) || !/\s/.test(t)) continue;
    câu.add(t);
  }
  const khôngNguồn = [...câu].filter((t) => !srs.includes(t));
  if (khôngNguồn.length) {
    add('🟡', 'Microcopy không nguồn', sc.code,
      `${khôngNguồn.length} câu chữ chỉ có trong \`design-spec.md\`, \`srs.md\` không mã lỗi/yêu cầu nào mang: ${khôngNguồn.map((t) => `“${t}”`).join(' · ')} — không ai biết chúng hiện ra KHI NÀO, và câu nào hàm ý một luật nghiệp vụ thì luật đó đang không tồn tại ở đâu cả`,
      `ba-screen-spec ${sc.name} (mỗi câu: thêm E-S.. hoặc acceptance mang đúng nguyên văn)`);
  }
}

/* ── 9. Quét yêu cầu ngầm: 9 chiều, mỗi chiều phải RƠI vào đâu đó ─────────────────────────
 * Nguồn (tlc-plan "Sweep", đợt 4 gói C): tài liệu phủ điều người viết NGHĨ tới; 9 chiều dưới
 * đây là điều không ai viết ra — kiểm dữ liệu vào · kiểu hỏng · gửi lặp/thử lại · phân quyền ·
 * đồng thời/thứ tự · vòng đời dữ liệu · hệ ngoài chết · chuyển trạng thái · quan sát/log. Ghi
 * lại chỗ rơi là toàn bộ cơ chế: quét trong đầu thì không ai soát được, và ngày bận sẽ bỏ.
 * Script chỉ ĐẾM hình: đủ 9 chiều · ô không rỗng · `n/a` có lý do · mã trỏ tới có khai ở
 * srs (ngoài chính bảng quét) hoặc tài liệu khác của màn · một mã không phủ hai chiều mà không
 * ghi "dùng chung — <vì sao>". Mã có khớp ĐÚNG chiều không là việc của người/agent đọc.
 * srs KHÔNG có mục → 🟢 gợi ý MỘT dòng, không tính vào exit: dự án viết trước quy ước này
 * không được đỏ loạt chỉ vì toolkit vừa thêm mục mới.                                        */
const bỏDấu = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const CHIỀU = [
  ['kiểm dữ liệu vào', /du lieu vao|dau vao|validat|kiem tra du lieu/],
  ['kiểu hỏng', /kieu hong|failure|che do hong/],
  ['gửi lặp/thử lại', /gui lap|thu lai|idempot|retry/],
  ['phân quyền', /phan quyen|authori|quyen truy cap/],
  ['đồng thời/thứ tự', /dong thoi|thu tu|concurren|ordering/],
  ['vòng đời dữ liệu', /vong doi|lifecycle/],
  ['hệ ngoài chết', /he ngoai|he thong ngoai|external|ben ngoai/],
  ['chuyển trạng thái', /chuyen trang thai|state transition|trang thai/],
  ['quan sát/log', /quan sat|\blog\b|observab|nhat ky|giam sat/],
];
const MÃ_RƠI = /(?:R-S\d+-N?\d+|BRule-S\d+-\d+|E-S\d+-\d+|GĐ-S\d+-\d+|RB-S\d+-\d+|OQ-S\d+-\d+|OQ-\d+)(?![\w-])/g;
const ôCủa = (dòng) => dòng.trim().replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((x) => x.trim());
const làPhânCách = (dòng) => /^\|[\s:|-]+\|?\s*$/.test(dòng.trim());
/** Mã được KHAI ở đâu: ô đầu của dòng bảng · đầu gạch đầu dòng · tiêu đề. Nhắc trong văn xuôi không tính. */
function mãKhai(văn) {
  const có = new Set();
  for (const dòng of văn.split('\n')) {
    let chỗ = '';
    if (/^\s*\|/.test(dòng)) chỗ = ôCủa(dòng)[0] || '';
    else if (/^\s*([-*]|\d+\.)\s+/.test(dòng)) chỗ = dòng.replace(/^\s*([-*]|\d+\.)\s+/, '').slice(0, 40);
    else if (/^#{1,6}\s/.test(dòng)) chỗ = dòng;
    for (const m of chỗ.matchAll(MÃ_RƠI)) có.add(m[0]);
  }
  return có;
}
const chưaQuét = [];
for (const sc of screens) {
  const srs = read(path.join(sc.dir, 'srs.md'));
  if (!srs) continue;
  const dòng = srs.split('\n');
  const đầu = dòng.findIndex((l) => /^#{2,3}\s/.test(l) && /quet yeu cau ngam/.test(bỏDấu(l)));
  if (đầu < 0) { chưaQuét.push(sc.code); continue; }
  const cấp = /^#+/.exec(dòng[đầu])[0].length;
  let cuối = dòng.length;
  for (let i = đầu + 1; i < dòng.length; i++) {
    const h = /^(#+)\s/.exec(dòng[i]);
    if (h && h[1].length <= cấp) { cuối = i; break; }
  }
  // Bảng quét = bảng ĐẦU TIÊN trong mục. Phần còn lại của mục (vd bảng câu hỏi mở `OQ-S..`) được
  // tính là nơi khai mã — chính bảng quét thì không: trỏ mã chỉ có trong bảng quét là trỏ vào hư không.
  let bĐầu = -1, bCuối = -1;
  for (let i = đầu + 1; i < cuối; i++) {
    if (/^\s*\|/.test(dòng[i])) { if (bĐầu < 0) bĐầu = i; bCuối = i; } else if (bĐầu >= 0) break;
  }
  const hàng = bĐầu < 0 ? [] : dòng.slice(bĐầu, bCuối + 1);
  let cộtChiều = 0, cộtRơi = 1, dữLiệu = hàng;
  if (hàng.length >= 2 && làPhânCách(hàng[1])) {
    const tiêuĐề = ôCủa(hàng[0]).map(bỏDấu);
    const c = tiêuĐề.findIndex((x) => /chieu|dimension/.test(x));
    if (c >= 0) cộtChiều = c;
    const r = tiêuĐề.findIndex((x) => /roi vao|landing|noi roi/.test(x));
    cộtRơi = r >= 0 ? r : cộtChiều + 1;
    dữLiệu = hàng.slice(2);
  }
  const ngoàiBảng = dòng.filter((_, i) => i < bĐầu || i > bCuối).join('\n');
  const khác = (() => { try { return fs.readdirSync(sc.dir).filter((f) => f.endsWith('.md') && f !== 'srs.md').map((f) => read(path.join(sc.dir, f))).join('\n'); } catch { return ''; } })();
  const đãKhai = mãKhai(ngoàiBảng + '\n' + khác);

  const gặp = new Set(), lạDòng = [], rỗng = [], naTrơn = [], ma = new Set(), mãTheoChiều = new Map(), cóGiảiThích = new Set();
  for (const d of dữLiệu) {
    if (làPhânCách(d)) continue;
    const ô = ôCủa(d);
    const tênThô = ô[cộtChiều] || '';
    const chiều = CHIỀU.find(([, re]) => re.test(bỏDấu(tênThô)));
    if (!chiều) { if (tênThô) lạDòng.push(tênThô.slice(0, 40)); continue; }
    gặp.add(chiều[0]);
    const rơi = (ô[cộtRơi] || '').trim();
    const rơiN = bỏDấu(rơi).replace(/`/g, '');
    if (!rơi || /^(—|-|–|tbd|\?+|\.\.\.|…)$/.test(rơiN)) { rỗng.push(chiều[0]); continue; }
    const na = /^(n\/?a|khong ap dung)(?![a-z])/.exec(rơiN);
    if (na) {
      const lýDo = rơiN.slice(na[0].length).replace(/^[\s—–\-:;,.()]+/, '').trim();
      if (lýDo.length < 8 || /^<?ly do>?$/.test(lýDo)) naTrơn.push(chiều[0]);
      continue;
    }
    const mã = [...new Set([...rơi.matchAll(MÃ_RƠI)].map((m) => m[0]))];
    if (!mã.length) { rỗng.push(`${chiều[0]} (không trỏ mã nào, cũng không n/a)`); continue; }
    for (const x of mã) {
      if (!đãKhai.has(x)) ma.add(x);
      if (!mãTheoChiều.has(x)) mãTheoChiều.set(x, new Set());
      mãTheoChiều.get(x).add(chiều[0]);
      if (/dung chung|chung voi/.test(rơiN)) cóGiảiThích.add(x);
    }
  }
  const thiếu = CHIỀU.map(([t]) => t).filter((t) => !gặp.has(t));
  if (thiếu.length) {
    add('🟡', 'Quét yêu cầu ngầm thiếu chiều', sc.code,
      `mục "Quét yêu cầu ngầm" của \`srs.md\` thiếu ${thiếu.length}/9 chiều: ${thiếu.join(' · ')}${lạDòng.length ? ` — ${lạDòng.length} dòng không nhận ra là chiều nào: ${lạDòng.map((x) => `“${x}”`).join(', ')}` : ''}. Chiều bỏ trống trông y như chiều không có gì để trả lời`,
      `ba-screen-spec ${sc.name} (mỗi chiều một dòng: mã đã viết · n/a — lý do · OQ-..)`, 'F9a');
  }
  const hở = [...rỗng.map((x) => `${x}: ô rỗng`), ...naTrơn.map((x) => `${x}: n/a không lý do`)];
  if (hở.length) {
    add('🟡', 'Quét yêu cầu ngầm ô không trả lời', sc.code,
      `${hở.length} chiều chưa rơi vào đâu — ${hở.join(' · ')}. \`n/a\` phải kèm lý do cụ thể, không thì không ai phân biệt được "không áp" với "chưa nghĩ tới"`,
      `ba-screen-spec ${sc.name}`, 'F9b');
  }
  if (ma.size) {
    add('🟡', 'Quét yêu cầu ngầm trỏ mã không tồn tại', sc.code,
      `bảng quét trỏ tới ${[...ma].map((x) => `\`${x}\``).join(', ')} — không mã nào như vậy được khai trong \`srs.md\` (ngoài chính bảng quét) hay tài liệu khác của màn. Chiều đó thực chất chưa được phủ`,
      `ba-screen-spec ${sc.name} (viết yêu cầu/quy tắc thật, hoặc đổi thành OQ-.. khai ở dưới bảng)`, 'F9c');
  }
  const mượn = [...mãTheoChiều].filter(([x, s]) => s.size > 1 && !cóGiảiThích.has(x));
  if (mượn.length) {
    add('🟡', 'Quét yêu cầu ngầm mượn mã', sc.code,
      `${mượn.map(([x, s]) => `\`${x}\` phủ ${[...s].join(' + ')}`).join(' · ')} mà không ghi "dùng chung — <vì sao>". Mượn một mã đã dùng ở dòng khác là dấu hiệu chiều đó chưa được phủ (chặn trùng bản ghi không nói gì về hai yêu cầu tới cùng lúc)`,
      `ba-screen-spec ${sc.name} (ghi lý do dùng chung, hoặc n/a — lý do, hoặc OQ-..)`, 'F9d');
  }
}
if (chưaQuét.length) {
  add('🟢', 'Chưa quét yêu cầu ngầm', chưaQuét.length === 1 ? chưaQuét[0] : `${chưaQuét.length} màn`,
    `${chưaQuét.length} srs chưa có mục "Quét yêu cầu ngầm" (${chưaQuét.join(', ')}) — gợi ý, không chặn: bổ sung khi đặc tả lại màn`,
    'ba-screen-spec <màn> (mục Quét yêu cầu ngầm trong template srs)');
  findings[findings.length - 1].khongTinhExit = true;
}

const gioiHan = [
  'Chỉ soi token snake_case trong backtick ở dòng BRule (luật 1) — trường nhắc bằng văn xuôi không bị bắt.',
  'Luật 9 đếm HÌNH của bảng quét (đủ 9 chiều · ô không rỗng · n/a có lý do · mã có khai · không mượn mã) — không phán mã được trỏ có thật sự quan sát ĐÚNG chiều đó.',
  'Luật 9 nhận chiều theo từ khoá (bỏ dấu, không phân biệt hoa thường) ở cột có tiêu đề chứa "chiều", ô trả lời ở cột "Rơi vào đâu" (không có thì cột kế bên); đặt tên chiều quá khác thì dòng bị báo "không nhận ra".',
  'Luật 9 chỉ nhận mã cấp màn (R-S · BRule-S · E-S · GĐ-S · RB-S · OQ-S · OQ-nn) và chỉ tìm nơi khai trong folder màn — trỏ FR/NFR cấp dự án bị coi là "không trỏ mã".',
  'srs chưa có mục Quét yêu cầu ngầm → một dòng 🟢 gộp, KHÔNG tính vào exit (dự án viết trước quy ước này).',
  'Luật 5 đọc tên framework frontend ở BẤT KỲ đâu trong 10-architecture (kể cả phương án bị loại) — chỉ im nhờ cây có nhánh giao diện (app/ · components/ · pages/ · .tsx · webui/ · web/ · ui/ · frontend/ · client/ · static/); không phán nhánh đó có đúng framework.',
  'Luật 7 so tên thư mục cấp 1 dưới src/, hoặc cấp kế sau tiền tố gói khi cây khai `src/<gói>/`; tên thư mục khai ở bất kỳ cấp nào trong cây đều được coi là "đã chốt" (không so đường dẫn đầy đủ).',
];

/* ── Xuất ────────────────────────────────────────────────────────────────────────────────── */
const đếm = { '🔴': 0, '🟡': 0, '🟢': 0 };
for (const f of findings) đếm[f.loai]++;

if (PLAIN) {
  console.log(`Soát khả thi: ${DOCS}  ·  scope: ${LOC || 'all'}  ·  ${screens.length}/${tấtCảMàn.length} màn`);
  if (LOC) console.log('  ⚙️  scope một màn: BỎ QUA check cấp dự án (chức năng ↔ endpoint, cây thư mục kiến trúc) — chạy không tham số để soát chúng');
  if (!findings.length) console.log('  ✓ không phát hiện gì — tài liệu đủ để sinh plan');
  for (const f of findings) {
    console.log(`  ${f.loai} [${f.muc}] ${f.scope}: ${f.moTa}${f.luat ? ` [${f.luat}]` : ''}`);
    console.log(`      → ${f.suaBang}`);
  }
  console.log(`\n🔴 ${đếm['🔴']} · 🟡 ${đếm['🟡']} · 🟢 ${đếm['🟢']}`);
  console.log(`Giới hạn: ${gioiHan.join(' · ')}`);
} else {
  console.log(JSON.stringify({
    docsDir: DOCS,
    scope: LOC || 'all',
    soMan: screens.length,
    tongSoMan: tấtCảMàn.length,
    boQuaCheckCapDuAn: Boolean(LOC),
    dem: đếm,
    findings,
    gioiHan,
  }, null, 2));
}
require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'rule-cover.js')).ghi('scan-feasible', findings.filter((f) => f.luat).map((f) => f.luat));
// Gợi ý 🟢 "chưa quét yêu cầu ngầm" không làm đổi exit — xem luật 9.
process.exit(findings.some((f) => !f.khongTinhExit) ? 1 : 0);
