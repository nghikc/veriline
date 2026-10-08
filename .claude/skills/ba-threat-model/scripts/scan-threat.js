#!/usr/bin/env node
/*
 * ba-threat-model/scan-threat.js — GOM NGUYÊN LIỆU cho mô hình đe doạ từ tài liệu THẬT của dự án, trước khi
 * LLM viết `docs/Ho-so/00-threat-model.md`. Zero-dependency, CommonJS. Module + CLI.
 *
 *   node .claude/skills/ba-threat-model/scripts/scan-threat.js <docs> [--json|--plain]
 *
 * Sáu thứ được gom (đếm, KHÔNG phán):
 *   (a) Tài sản  — thực thể/trường trong `05-data-model.md` (ERD + từ điển dữ liệu) có dấu hiệu nhạy cảm theo danh
 *                  sách từ khoá Việt + Anh (mật khẩu, token, phiên, email, số điện thoại, CCCD, số thẻ, lương, sức khoẻ,
 *                  vai trò/quyền, nhật ký audit…). Mỗi trường trúng → nhóm + từ khoá trúng + dòng nguồn.
 *   (b) NFR      — dòng `NFR-..` trong `01-requirements.md` có từ khoá bảo mật/quyền riêng tư; thêm ràng buộc pháp lý ở §7.
 *   (c) BRule    — dòng `BRule-S..-..` trong mọi `srs.md` có từ khoá phân quyền/vai trò/phiên/cấm.
 *   (d) EXT      — hệ ngoài `EXT-..` trong `12-api-integration.md` / `11-integration.md`.
 *   (e) Ranh giới — mọi sơ đồ `flowchart` trong `10-architecture.md` (+ `11-integration.md`): vùng (`subgraph`) và
 *                  cạnh XUYÊN VÙNG (hai đầu khác subgraph, hoặc một đầu nằm ngoài mọi subgraph = actor/hệ ngoài).
 *                  Cạnh xuyên vùng là ứng viên ranh giới tin cậy; LLM quyết cái nào là ranh giới thật.
 *   (f) 00-threat-model.md đã có → số `TM` thiếu biện pháp, biện pháp trace tới mã KHÔNG tồn tại, trạng thái lạ.
 * Kèm: vai trò (StR "Nhóm liên quan" · `SH-..` · enum trường vai_tro/role) · ADR + trạng thái · stack §2 → nhóm
 * checklist ở `../ba-toolkit/references/security-checklist.md` · hồ sơ/phạm vi qua `ba-toolkit/profile.js`.
 *
 * Exit = số lỗi cấu trúc (docs không tồn tại; không có tài liệu nào trong 01/05/10 để mô hình hoá). Trường trúng
 * từ khoá, NFR không bảo mật, sơ đồ không có subgraph… KHÔNG phải lỗi. Chạy im trên `example/docs`.
 *
 * Vì sao có: security-threat-model (openai/skills, MIT) đặt luật "mọi khẳng định kiến trúc phải có neo bằng chứng
 * trong repo, không bịa component/flow/control". Ở BA kit, "repo" của GĐ2 là tài liệu: để LLM tự đọc 10 file rồi
 * liệt kê tài sản thì mỗi lần một danh sách khác và hay thêm đe doạ giáo khoa không có tài sản thật đứng sau.
 * Danh sách tài sản/ranh giới/NFR/BRule phải do máy đóng băng từ tài liệu; LLM chỉ ghép thành đường lạm dụng.
 *
 * gioiHan: nhận diện tài sản bằng TÊN TRƯỜNG (+ cột Mô tả cho 4 nhóm bí mật/PII/tài chính/sức khoẻ) — trường nhạy
 * cảm đặt tên lạ (`f1`, `data`) thì trượt; trường trúng từ khoá mà không nhạy cảm (vd `phai_doi_mat_khau` là cờ, không
 * phải mật khẩu) là việc LLM loại — script in ra để LLM thấy, không tự bỏ. Đọc `flowchart`/`graph` + `architecture-beta` (group/service/cạnh có cổng) + `C4*` (Boundary/Rel — sơ đồ C4Context không Boundary thì mọi nút "ngoài vùng", cạnh Person/System_Ext ↔ System vẫn là xuyên vùng khi có ≥1 Boundary); `swimlane-beta`,
 * `sequenceDiagram`, `C4Context` được đếm là "bỏ qua". Chuỗi `a -- text --> b` (nhãn dạng cũ) không tách được nhãn,
 * cạnh vẫn được ghi. "Mã định nghĩa" = mã đứng đầu dòng bảng/tiêu đề/mục list — mã chỉ được NHẮC không tính. Không đọc code.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const docpath = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));
const profile = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'profile.js'));

const đọc = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const ô = (l) => l.replace(/^\s*\||\|\s*$/g, '').split('|').map((c) => c.trim());
const làDòngBảng = (l) => l.trim().startsWith('|') && !/^\|\s*:?-+/.test(l.trim());

/* ─── Từ khoá tài sản (tên trường snake/camel + cột Mô tả). Nhóm → danh sách regex ───────────────── */
const NHÓM_TÀI_SẢN = {
  'Xác thực (bí mật)': /mat_khau|matkhau|password|passwd|pwd|hash|token|refresh|session|phien_?dang_?nhap|\botp\b|secret|api_?key|private_?key|\bjwt\b|cookie|bcrypt|argon|mã hoá|mã hóa|encrypt/i,
  'Định danh cá nhân (PII)': /\bemail\b|dien_?thoai|so_?dt\b|\bsdt\b|phone|mobile|dia_?chi|address|ngay_?sinh|birth|\bdob\b|ho_?ten|full_?name|\bcccd\b|\bcmnd\b|can_?cuoc|ho_?chieu|passport|national_?id|ma_?so_?thue|tax_?code|ip_?address|\bgeo|lat_?lng|latitude|vi_?tri|location/i,
  'Tài chính': /so_?the|card_?number|\bcard\b|\bcvv\b|\bpan\b|\biban\b|so_?tai_?khoan|bank|luong|salary|thu_?nhap|income|so_?du|balance|thanh_?toan|payment|hoa_?don|invoice|\bprice\b|amount/i,
  'Sức khoẻ': /suc_?khoe|health|benh|diagnos|chan_?doan|medical|\bbenh_?an|thuoc|prescri/i,
  'Phân quyền': /vai_?tro|\brole|quyen|permission|scope|is_?admin|\badmin\b|is_?super|privilege/i,
  'Nhật ký / audit': /lich_?su|history|audit|\blog\b|nhat_?ky|ip_?address|created_?by|nguoi_?thay_?doi/i,
};
const NHÓM_THỰC_THỂ = {
  'Xác thực (bí mật)': /session|phien|token|credential|apikey|api_?key|account|tai_?khoan/i,
  'Nhật ký / audit': /lich_?su|history|audit|log\b|nhat_?ky/i,
  'Tài chính': /payment|thanh_?toan|invoice|hoa_?don|order|don_?hang|transaction|giao_?dich|wallet/i,
  'Định danh cá nhân (PII)': /user|nguoi_?dung|customer|khach_?hang|patient|benh_?nhan|employee|nhan_?vien|member|thanh_?vien/i,
};
const RE_NFR_BẢO_MẬT = /bảo mật|an ninh|security|riêng tư|privacy|mã ho[áa]|encrypt|xác thực|authent|authoriz|phân quyền|rbac|https|\btls\b|kho[áa] tài khoản|lock(?:out)?|pdpa|gdpr|nghị định 13|audit|nhật ký|\blog\b|token|jwt|mật khẩu|password|tenant|cách ly|isolation|sao lưu|backup|rate.?limit|brute|csrf|xss|injection|otp|2fa|mfa|secret|bí mật/i;
// Hai bậc: MẠNH = chắc là luật bảo mật/phân quyền; YẾU = từ đa nghĩa ("phiên" terminal, "token" LLM, "khoá" = lock UI —
// dự án desktop: 261/734 BRule trúng khi gộp một bậc) → chỉ tính khi cùng dòng còn có dấu hiệu bảo mật phụ.
const RE_BRULE_MẠNH = /quyền|vai trò|\brole|permission|\badmin\b|cấm|không được (?:phép|sửa|xem|gọi|truy cập|đăng nhập|thực hiện|làm|dùng)|không tự|chính mình|của mình|thu hồi|đăng nhập|đăng xuất|mật khẩu|password|xác thực|authent|tenant|tổ chức khác|cùng tổ chức|duy nhất toàn hệ thống|vô hiệu ho[áa]|leo thang|escalat|bí mật|secret|keychain|mã ho[áa]|encrypt|csrf|xss|injection|brute|rate.?limit/i;
const RE_BRULE_YẾU = /chỉ [^|]{0,40}(?:được|mới)|phiên|session|token|kho[áa]|lock|https|\bdata:|\bip\b/i;
const RE_BRULE_PHỤ = /hết hạn|expire|từ chối|reject|401|403|429|thu hồi|revoke|xác minh|verify|ký|sign|hash|nguồn gốc|origin|cookie|header|bearer|api.?key|mã pin|\bpin\b|\botp\b|2fa|mfa|đối tác|bên ngoài|remote|từ xa|điện thoại|websocket|http/i;
const RE_BRULE_QUYỀN = { test: (t) => RE_BRULE_MẠNH.test(t) || (RE_BRULE_YẾU.test(t) && RE_BRULE_PHỤ.test(t)) };
const RE_PHÁP_LÝ = /pháp lý|pdpa|gdpr|nghị định|luật|tuân thủ|compliance|lưu tại|data residency|residency/i;

/* Stack §2 → nhóm checklist (../ba-toolkit/references/security-checklist.md). Thứ tự = thứ tự in. */
const NHÓM_STACK = [
  ['nextjs', /next\.?js|\bnext\b/i],
  ['react-frontend', /react|vue|angular|svelte|jquery|frontend|spa\b|web app/i],
  ['node-backend', /nestjs|\bnest\b|express|fastify|koa|hapi|node\.?js|\bnode\b/i],
  ['python', /django|flask|fastapi|python/i],
  ['go', /\bgolang\b|\bgo\b(?!ogle)|\bgin\b|\bfiber\b/i],
  ['data', /postgres|mysql|maria|mongo|redis|sqlite|dynamo|oracle|sql server|elastic/i],
];

/* ─── Tiện ích chung ─────────────────────────────────────────────────────────────────────────── */
function duyệtMd(docs, opts = {}) {
  const ra = []; const bỏ = /^(removed|node_modules|userguide|releases|meetings|api-test|dbschema|notes|reviews|eval|jury)$/;
  (function walk(d) {
    let es = []; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!bỏ.test(e.name)) walk(p); continue; }
      if (e.name.endsWith('.md') && (!opts.tên || opts.tên === e.name)) ra.push(p);
    }
  })(docs);
  return ra;
}
const rel = (docs, p) => path.relative(docs, p).split(path.sep).join('/');

/* Mã ĐÃ ĐỊNH NGHĨA trong docs (đầu dòng bảng · tiêu đề · đầu mục list) — để soát trace. Bỏ chính 00-threat-model.md
 * (một TM không được tự chứng cho biện pháp của nó) và các bản sinh ra (portal/onepager là html). */
function gomMã(docs) {
  const mã = new Set();
  for (const f of duyệtMd(docs)) {
    if (/00-threat-model\.md$/.test(f)) continue;
    for (const l of đọc(f).split('\n')) {
      let m = null;
      if ((m = l.match(/^\s*\|\s*\**`?((?:NFR|FR|BRule|ADR|WI|OQ|PD|SH|EXT|GĐ|CR)-(?:S\d+-)?\d+)`?\**\s*\|/))) mã.add(m[1]);
      else if ((m = l.match(/^#{2,5}\s+\**`?((?:NFR|FR|BRule|ADR|WI|OQ|PD|SH|EXT|GĐ|CR)-(?:S\d+-)?\d+)/))) mã.add(m[1]);
      else if ((m = l.match(/^\s*[-*]\s+\**`?((?:NFR|FR|BRule|ADR|WI|OQ|PD|SH|EXT|GĐ|CR)-(?:S\d+-)?\d+)`?\**\s*[:—–-]/))) mã.add(m[1]);
    }
  }
  return mã;
}

/* ─── (a) Tài sản từ 05-data-model.md ────────────────────────────────────────────────────────── */
function gomTàiSản(txt) {
  const thựcThể = {}; // tên → { trường: {tên: {kiểu, môTả, dòng, nguồn}} }
  const lines = txt.split('\n');
  // ERD: `Name {` … `}` với dòng `type field PK/FK`
  let trongERD = false, tt = null;
  lines.forEach((l, i) => {
    if (/^\s*```mermaid/.test(l)) { trongERD = true; return; }
    if (trongERD && /^\s*```/.test(l)) { trongERD = false; tt = null; return; }
    if (!trongERD) return;
    const mở = l.match(/^\s*([A-Za-z_][\w-]*)\s*\{\s*$/); if (mở) { tt = mở[1]; thựcThể[tt] = thựcThể[tt] || { trường: {} }; return; }
    if (/^\s*\}/.test(l)) { tt = null; return; }
    const f = tt && l.match(/^\s*([\w()]+)\s+([\w]+)(?:\s+(PK|FK|UK))?/);
    if (f) thựcThể[tt].trường[f[2]] = thựcThể[tt].trường[f[2]] || { kiểu: f[1], môTả: '', dòng: i + 1, nguồn: 'erd' };
  });
  // Từ điển: `### Thực thể: Name (Alias)` + bảng | Thuộc tính | Kiểu | Ràng buộc | Mô tả |
  tt = null;
  lines.forEach((l, i) => {
    const h = l.match(/^#{2,4}\s+(?:Thực thể|Value object)[^:`A-Za-z]*:?\s*`?([A-Za-z_][\w-]*)/i); // `Name` có backtick (dự án desktop) hay trần (example) đều nhận
    if (h) { tt = h[1]; thựcThể[tt] = thựcThể[tt] || { trường: {} }; return; }
    if (/^#{1,4}\s/.test(l)) { tt = null; return; }
    if (!tt || !làDòngBảng(l)) return;
    const c = ô(l); if (!c[0] || /^(Thuộc tính|Trường|Tên)$/i.test(c[0])) return;
    const tên = c[0].replace(/[`*]/g, ''); if (!/^[\w]+$/.test(tên)) return;
    const cũ = thựcThể[tt].trường[tên] || {};
    thựcThể[tt].trường[tên] = { kiểu: c[1] || cũ.kiểu || '', môTả: `${c[2] || ''} ${c[3] || ''}`.trim(), dòng: cũ.dòng || i + 1, nguồn: cũ.nguồn ? 'erd+từ điển' : 'từ điển' };
  });
  const tàiSản = [];
  for (const [tên, e] of Object.entries(thựcThể)) {
    const nhómTT = Object.entries(NHÓM_THỰC_THỂ).filter(([, re]) => re.test(tên)).map(([n]) => n);
    for (const [trường, t] of Object.entries(e.trường)) {
      const trúng = [];
      for (const [nhóm, re] of Object.entries(NHÓM_TÀI_SẢN)) {
        const m1 = trường.match(re); const m2 = /Phân quyền|Nhật ký/.test(nhóm) ? null : (t.môTả || '').match(re); // vai trò/audit: chỉ theo tên trường
        if (m1 || m2) trúng.push({ nhóm, dấuHiệu: (m1 || m2)[0], ở: m1 ? 'tên trường' : 'mô tả' });
      }
      if (trúng.length) tàiSản.push({ thựcThể: tên, trường, kiểu: t.kiểu, nhóm: [...new Set(trúng.map((x) => x.nhóm))], dấuHiệu: [...new Set(trúng.map((x) => `${x.dấuHiệu} (${x.ở})`))].join(', '), dòng: t.dòng, nguồn: t.nguồn });
    }
    if (nhómTT.length) tàiSản.push({ thựcThể: tên, trường: '(cả thực thể)', kiểu: '', nhóm: nhómTT, dấuHiệu: `tên thực thể "${tên}"`, dòng: null, nguồn: 'tên' });
  }
  // enum vai trò: trường vai_tro/role có "enum" + giá trị
  const vaiTròEnum = [];
  for (const e of Object.values(thựcThể)) for (const [trường, t] of Object.entries(e.trường)) {
    if (/vai_?tro|\brole\b/i.test(trường) && /enum/i.test(t.kiểu || '')) { const m = (t.môTả || '').match(/[A-Z_]{3,}(?:\s*,\s*[A-Z_]{3,})+/); if (m) vaiTròEnum.push(...m[0].split(/\s*,\s*/)); }
  }
  return { thựcThể: Object.keys(thựcThể), tàiSản, vaiTròEnum: [...new Set(vaiTròEnum)] };
}

/* ─── (b) NFR + pháp lý từ 01-requirements.md ────────────────────────────────────────────────── */
function gomNFR(txt) {
  const nfr = []; const phápLý = []; const vaiTròStR = new Set();
  txt.split('\n').forEach((l, i) => {
    if (!làDòngBảng(l)) { if (RE_PHÁP_LÝ.test(l) && /^\s*[-*]/.test(l)) phápLý.push({ dòng: i + 1, text: l.replace(/^\s*[-*]\s*/, '').slice(0, 160) }); return; }
    const c = ô(l);
    if (/^NFR-\d+$/.test(c[0])) nfr.push({ id: c[0], loại: c[1] || '', yêuCầu: (c[2] || '').slice(0, 200), trace: c[3] || '', bảoMật: RE_NFR_BẢO_MẬT.test(`${c[1]} ${c[2]}`), dòng: i + 1 });
    if (/^StR-\d+$/.test(c[0]) && c[1]) vaiTròStR.add(c[1].replace(/\s*\(.*\)\s*/, ' ').trim());
  });
  return { nfr, phápLý, vaiTròStR: [...vaiTròStR] };
}

/* ─── (c) BRule từ mọi srs.md ────────────────────────────────────────────────────────────────── */
function gomBRule(docs) {
  const ra = [];
  for (const f of duyệtMd(docs, { tên: 'srs.md' })) {
    đọc(f).split('\n').forEach((l, i) => {
      if (!làDòngBảng(l)) return; const c = ô(l);
      const m = (c[0] || '').match(/^(BRule-(S\d+)-\d+)$/); if (!m) return;
      ra.push({ id: m[1], màn: m[2], quyTắc: (c[1] || '').slice(0, 220), kíchHoạt: (c[2] || '').slice(0, 120), trace: c[3] || '', phânQuyền: RE_BRULE_QUYỀN.test(c[1] || ''), file: rel(docs, f), dòng: i + 1 });
    });
  }
  return ra;
}

/* ─── (d) EXT ─────────────────────────────────────────────────────────────────────────────────── */
function gomEXT(txt, file) {
  const ra = [];
  txt.split('\n').forEach((l, i) => {
    if (!làDòngBảng(l)) return; const c = ô(l);
    if (/^EXT-\d+$/.test(c[0])) ra.push({ id: c[0], tên: (c[1] || '').slice(0, 120), dùngCho: (c[2] || '').slice(0, 120), file, dòng: i + 1 });
  });
  return ra;
}

/* ─── (e) Ranh giới từ sơ đồ flowchart ───────────────────────────────────────────────────────── */
const RE_MŨI_TÊN = /(\s*(?:<?-->|---|-\.->|==>|-\.-|--o|--x)\s*(?:\|[^|]*\|)?\s*)/;
function nhãnNút(phần) {
  const q = phần.match(/"([^"]*)"/); if (q) return q[1];
  return phần.replace(/^[\[\(\{\/\\]+|[\]\)\}\/\\]+$/g, '').replace(/:::\w+$/, '').trim();
}
function phânTíchFlowchart(body) {
  const vùng = []; const stack = []; const nút = {}; const cạnh = [];
  const ghiNút = (id, phần) => {
    if (!nút[id]) nút[id] = { id, nhãn: id, vùng: stack.length ? stack[stack.length - 1].nhãn : null };
    if (phần && /^[\[\(\{]/.test(phần)) nút[id].nhãn = nhãnNút(phần.replace(/:::\w+\s*$/, ''));
  };
  for (const raw of body) {
    const l = raw.replace(/%%.*$/, '').trim(); if (!l) continue;
    if (/^(flowchart|graph)\b/.test(l)) continue;
    const sg = l.match(/^subgraph\s+([\w-]+)?\s*(?:\[\s*"?([^\]"]*)"?\s*\])?\s*(.*)$/);
    if (sg) { const nhãn = sg[2] || sg[3] || sg[1] || `vùng${vùng.length + 1}`; const v = { id: sg[1] || nhãn, nhãn: nhãn.trim(), nút: [] }; vùng.push(v); stack.push(v); continue; }
    if (/^end\b/.test(l)) { stack.pop(); continue; }
    if (/^(classDef|class|style|linkStyle|direction|click)\b/.test(l)) continue;
    if (RE_MŨI_TÊN.test(l)) {
      const mảnh = l.split(RE_MŨI_TÊN); // [nút, mũi tên, nút, mũi tên, nút…]
      const ids = [];
      for (let k = 0; k < mảnh.length; k += 2) {
        const m = mảnh[k].match(/^\s*([A-Za-z0-9_.-]+)\s*(.*)$/); if (!m) { ids.push(null); continue; }
        ghiNút(m[1], m[2]); ids.push(m[1]);
        if (stack.length) stack[stack.length - 1].nút.push(m[1]);
      }
      for (let k = 1; k < mảnh.length; k += 2) {
        const từ = ids[(k - 1) / 2], đến = ids[(k + 1) / 2]; if (!từ || !đến) continue;
        const nhãn = (mảnh[k].match(/\|([^|]*)\|/) || [, ''])[1].replace(/"/g, '').trim();
        cạnh.push({ từ, đến, nhãn });
      }
      continue;
    }
    const nd = l.match(/^([A-Za-z0-9_.-]+)\s*([\[\(\{].*)?$/);
    if (nd) { ghiNút(nd[1], nd[2] || ''); if (stack.length) stack[stack.length - 1].nút.push(nd[1]); }
  }
  const vùngCủa = (id) => (nút[id] && nút[id].vùng) || null;
  const xuyên = cạnh.filter((c) => vùngCủa(c.từ) !== vùngCủa(c.đến)).map((c) => ({
    từ: c.từ, từNhãn: nút[c.từ].nhãn, từVùng: vùngCủa(c.từ) || '(ngoài mọi vùng)',
    đến: c.đến, đếnNhãn: nút[c.đến].nhãn, đếnVùng: vùngCủa(c.đến) || '(ngoài mọi vùng)', nhãn: c.nhãn,
  }));
  const cặp = {};
  for (const x of xuyên) { const k = `${x.từVùng} → ${x.đếnVùng}`; (cặp[k] = cặp[k] || []).push(x); }
  return { vùng: vùng.map((v) => ({ nhãn: v.nhãn, nút: [...new Set(v.nút)] })), sốNút: Object.keys(nút).length, sốCạnh: cạnh.length,
    ranhGiới: Object.entries(cặp).map(([cặp, cạnh]) => ({ cặp, cạnh })) };
}
// architecture-beta: `group id(icon)[label] [in parent]` · `service id(icon)[label] [in group]` · `a:R --> L:b` (cạnh có cổng)
function phânTíchArchBeta(body) {
  const vùng = {}; const nút = {}; const cạnh = [];
  for (const raw of body) {
    const l = raw.replace(/%%.*$/, '').trim(); if (!l || /^architecture-beta\b/.test(l)) continue;
    let m = l.match(/^group\s+([\w-]+)(?:\([^)]*\))?\s*\[([^\]]*)\]/);
    if (m) { vùng[m[1]] = { nhãn: m[2].trim(), nút: [] }; continue; }
    m = l.match(/^(service|junction)\s+([\w-]+)(?:\([^)]*\))?\s*(?:\[([^\]]*)\])?\s*(?:in\s+([\w-]+))?/);
    if (m) { const v = m[4] && vùng[m[4]] ? vùng[m[4]].nhãn : null; nút[m[2]] = { id: m[2], nhãn: (m[3] || m[2]).trim(), vùng: v }; if (m[4] && vùng[m[4]]) vùng[m[4]].nút.push(m[2]); continue; }
    m = l.match(/^([\w-]+)(?:\{group\})?(?::[TBLR])?\s*(<?--?>?)\s*(?:[TBLR]:)?([\w-]+)(?:\{group\})?/);
    if (m) { for (const id of [m[1], m[3]]) if (!nút[id]) nút[id] = { id, nhãn: vùng[id] ? vùng[id].nhãn : id, vùng: vùng[id] ? vùng[id].nhãn : null }; cạnh.push({ từ: m[1], đến: m[3], nhãn: '' }); if (m[2].startsWith('<')) cạnh.push({ từ: m[3], đến: m[1], nhãn: '' }); }
  }
  return kếtXuyên(Object.values(vùng), nút, cạnh);
}
// C4Context/C4Container: `Person|System|Container…(id, "label", …)` · `X_Boundary(id, "label") { … }` lồng bằng ngoặc · `Rel|BiRel|Rel_X(from, to, "label")`
function phânTíchC4(body) {
  const vùng = []; const stack = []; const nút = {}; const cạnh = [];
  for (const raw of body) {
    const l = raw.replace(/%%.*$/, '').trim(); if (!l || /^C4\w*\b/.test(l)) continue;
    let m = l.match(/^\w*Boundary\s*\(\s*([\w-]+)\s*,\s*"([^"]*)"/);
    if (m) { const v = { id: m[1], nhãn: m[2].trim(), nút: [] }; vùng.push(v); stack.push(v); continue; }
    if (/^\}/.test(l)) { stack.pop(); continue; }
    m = l.match(/^(Bi)?Rel\w*\s*\(\s*([\w-]+)\s*,\s*([\w-]+)\s*(?:,\s*"([^"]*)")?/);
    if (m) { cạnh.push({ từ: m[2], đến: m[3], nhãn: (m[4] || '').trim() }); if (m[1]) cạnh.push({ từ: m[3], đến: m[2], nhãn: (m[4] || '').trim() }); continue; }
    m = l.match(/^((?:Person|System|Container|Component|Node|Deployment_Node)\w*)\s*\(\s*([\w-]+)\s*,\s*"([^"]*)"/);
    if (m) { const v = stack.length ? stack[stack.length - 1] : null; nút[m[2]] = { id: m[2], nhãn: m[3].trim(), vùng: v ? v.nhãn : null, loại: m[1].replace(/_?Boundary$/, "") }; if (v) v.nút.push(m[2]); }
  }
  for (const c of cạnh) for (const id of [c.từ, c.đến]) if (!nút[id]) nút[id] = { id, nhãn: id, vùng: null };
  // Không có Boundary nào (C4Context thường vậy) → ranh giới tin cậy suy từ LOẠI phần tử: Person/*_Ext = bên ngoài, còn lại = hệ thống.
  if (!vùng.length) { const ngoài = { nhãn: "(bên ngoài — Person/System_Ext)", nút: [] }, trong = { nhãn: "(hệ thống)", nút: [] }; for (const n of Object.values(nút)) { const v = n.loại && /^(Person|\w+_Ext)$/.test(n.loại) ? ngoài : trong; n.vùng = v.nhãn; v.nút.push(n.id); } vùng.push(ngoài, trong); }
  return kếtXuyên(vùng, nút, cạnh);
}
function kếtXuyên(vùng, nút, cạnh) {
  const vùngCủa = (id) => (nút[id] && nút[id].vùng) || null;
  const xuyên = cạnh.filter((c) => vùngCủa(c.từ) !== vùngCủa(c.đến)).map((c) => ({
    từ: c.từ, từNhãn: nút[c.từ].nhãn, từVùng: vùngCủa(c.từ) || '(ngoài mọi vùng)',
    đến: c.đến, đếnNhãn: nút[c.đến].nhãn, đếnVùng: vùngCủa(c.đến) || '(ngoài mọi vùng)', nhãn: c.nhãn,
  }));
  const cặp = {};
  for (const x of xuyên) { const k = `${x.từVùng} → ${x.đếnVùng}`; (cặp[k] = cặp[k] || []).push(x); }
  return { vùng: vùng.map((v) => ({ nhãn: v.nhãn, nút: [...new Set(v.nút)] })), sốNút: Object.keys(nút).length, sốCạnh: cạnh.length,
    ranhGiới: Object.entries(cặp).map(([cặp, cạnh]) => ({ cặp, cạnh })) };
}
function gomSơĐồ(txt, file) {
  const lines = txt.split('\n'); const sơĐồ = []; let bỏQua = 0; let mục = '';
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^#{2,4}\s+(.+)$/); if (h) mục = h[1].trim();
    if (!/^\s*```mermaid/.test(lines[i])) continue;
    let j = i + 1; const body = [];
    while (j < lines.length && !/^\s*```/.test(lines[j])) body.push(lines[j++]);
    const đầu = (body.find((x) => x.trim()) || '').trim();
    if (/^(flowchart|graph)\b/.test(đầu)) sơĐồ.push({ file, mục, dòng: i + 1, loại: đầu.split(/\s+/)[0], ...phânTíchFlowchart(body) });
    else if (/^architecture-beta\b/.test(đầu)) sơĐồ.push({ file, mục, dòng: i + 1, loại: 'architecture-beta', ...phânTíchArchBeta(body) });
    else if (/^C4(Context|Container|Component|Deployment)\b/.test(đầu)) sơĐồ.push({ file, mục, dòng: i + 1, loại: đầu.split(/\s+/)[0], ...phânTíchC4(body) });
    else { bỏQua++; sơĐồ.push({ file, mục, dòng: i + 1, loại: đầu.split(/\s+/)[0] || '?', bỏQua: true }); }
    i = j;
  }
  return { sơĐồ, bỏQua };
}

/* ─── ADR + stack từ 10-architecture.md ───────────────────────────────────────────────────────── */
function gomADR(txt, file) {
  const ra = []; const lines = txt.split('\n');
  lines.forEach((l, i) => {
    const h = l.match(/^#{2,4}\s+(ADR-\d+)\s*[—–-]\s*(.+)$/); if (!h) return;
    let tt = (h[2].match(/\((Accepted|Draft|Superseded|Proposed|Rejected)\)/i) || [])[1] || null;
    for (let k = i + 1; k < lines.length && !/^#{2,4}\s+ADR-\d+/.test(lines[k]); k++) { const m = lines[k].match(/\*\*Trạng thái:\*\*\s*\**\s*([A-Za-z]+)/); if (m) { tt = m[1]; break; } }
    tt = tt || 'Draft';
    ra.push({ id: h[1], tiêuĐề: h[2].trim().slice(0, 120), trạngThái: tt, file, dòng: i + 1 });
  });
  return ra;
}
function gomStack(txt) {
  const côngNghệ = []; let trongBảngStack = false;
  for (const l of txt.split('\n')) {
    if (/^#{2,3}\s/.test(l)) trongBảngStack = /stack|công nghệ|technology/i.test(l);
    if (!trongBảngStack || !làDòngBảng(l)) continue;
    const c = ô(l); if (!c[1] || /^(Công nghệ|Technology)$/i.test(c[1])) continue;
    côngNghệ.push(`${c[0]}: ${c[1]}`);
  }
  const chuỗi = côngNghệ.join(' · ');
  const nhóm = ['chung', ...NHÓM_STACK.filter(([, re]) => re.test(chuỗi)).map(([n]) => n)];
  return { côngNghệ, nhóm };
}

/* ─── (f) 00-threat-model.md đã có ───────────────────────────────────────────────────────────── */
const RE_TRACE = /\b((?:NFR|BRule|ADR|WI|OQ|PD|CR)-(?:S\d+-)?\d+)\b/g;
function đọcTM(txt) {
  const ra = []; let idx = null;
  for (const l of txt.split('\n')) {
    if (!l.trim().startsWith('|')) { if (idx && ra.length) break; continue; }
    const c = ô(l);
    if (!idx) {
      const iId = c.findIndex((x) => /^Mã$/i.test(x)); const iS = c.findIndex((x) => /STRIDE/i.test(x));
      if (iId >= 0 && iS >= 0) {
        const f = (re) => c.findIndex((x) => re.test(x));
        idx = { id: iId, ranhGiới: f(/^Ranh giới/i), tàiSản: f(/^Tài sản/i), stride: iS, đường: f(/lạm dụng|Đe do[ạa]/i), mức: f(/^Mức/i), biệnPháp: f(/^Biện pháp/i), trạngThái: f(/^Trạng thái/i) };
      }
      continue;
    }
    if (/^:?-+:?$/.test(c[0])) continue;
    const id = (c[idx.id] || '').replace(/[`*]/g, '');
    if (!/^TM-\d+$/.test(id)) continue;
    const g = (k) => (idx[k] >= 0 ? c[idx[k]] || '' : '');
    ra.push({ id, ranhGiới: g('ranhGiới'), tàiSản: g('tàiSản'), stride: g('stride'), đường: g('đường'), mức: g('mức'), biệnPháp: g('biệnPháp'), trạngThái: g('trạngThái'), trace: [...new Set((g('biệnPháp').match(RE_TRACE) || []))] });
  }
  return ra;
}
function soátTMCũ(txt, mãCó) {
  const tm = đọcTM(txt);
  const thiếuBiệnPháp = tm.filter((t) => !t.biệnPháp.replace(/[—\-\s]/g, '')).map((t) => t.id);
  const traceMa = []; for (const t of tm) for (const id of t.trace) if (!mãCó.has(id)) traceMa.push(`${t.id} → ${id}`);
  const trạngTháiLạ = tm.filter((t) => !/^(Mở|Giảm nhẹ|Chấp nhận)/.test(t.trạngThái)).map((t) => `${t.id}: "${t.trạngThái}"`);
  const theoTrạngThái = tm.reduce((a, t) => { const k = (t.trạngThái.match(/^(Mở|Giảm nhẹ|Chấp nhận)/) || [, 'lạ'])[1]; a[k] = (a[k] || 0) + 1; return a; }, {});
  return { sốTM: tm.length, tm, thiếuBiệnPháp, traceMa, trạngTháiLạ, theoTrạngThái };
}

/* ─── Vai trò từ 04-stakeholders.md ──────────────────────────────────────────────────────────── */
function gomSH(txt) {
  const ra = [];
  const đã = new Set(); // bảng "Kế hoạch giao tiếp" cũng mở đầu bằng SH-.. — chỉ lấy lần định nghĩa đầu (Danh bạ)
  txt.split('\n').forEach((l, i) => { if (!làDòngBảng(l)) return; const c = ô(l); if (/^SH-\d+$/.test(c[0]) && !đã.has(c[0])) { đã.add(c[0]); ra.push({ id: c[0], tên: (c[1] || '').slice(0, 80), dòng: i + 1 }); } });
  return ra;
}

/* ─── Toàn bộ ─────────────────────────────────────────────────────────────────────────────────── */
function quét(docs) {
  const lỗi = [];
  if (!fs.existsSync(docs)) return { lỗi: [`không thấy ${docs}`] };
  const có = (n) => docpath.hasDoc(docs, n);
  const tàiLiệu = {};
  for (const n of ['01-requirements.md', '05-data-model.md', '10-architecture.md', '11-integration.md', '12-api-integration.md', '04-stakeholders.md', '00-backlog.md', '00-decisions.md', '00-threat-model.md']) tàiLiệu[n] = có(n);
  if (!tàiLiệu['01-requirements.md'] && !tàiLiệu['05-data-model.md'] && !tàiLiệu['10-architecture.md']) lỗi.push('không có 01-requirements.md / 05-data-model.md / 10-architecture.md — không có gì để mô hình hoá; chạy ba-requirements/ba-data-model/ba-architecture trước');

  const a = gomTàiSản(docpath.readDoc(docs, '05-data-model.md'));
  const b = gomNFR(docpath.readDoc(docs, '01-requirements.md'));
  const c = gomBRule(docs);
  const d = [...gomEXT(docpath.readDoc(docs, '12-api-integration.md'), '12-api-integration.md'), ...gomEXT(docpath.readDoc(docs, '11-integration.md'), '11-integration.md')];
  const kt = docpath.readDoc(docs, '10-architecture.md'); const th = docpath.readDoc(docs, '11-integration.md');
  const e1 = gomSơĐồ(kt, '10-architecture.md'); const e2 = gomSơĐồ(th, '11-integration.md');
  const adr = [...gomADR(kt, '10-architecture.md'), ...gomADR(th, '11-integration.md'), ...gomADR(docpath.readDoc(docs, '12-api-integration.md'), '12-api-integration.md')];
  const stack = gomStack(kt); if (d.length && !stack.nhóm.includes('external')) stack.nhóm.push('external');
  const sh = gomSH(docpath.readDoc(docs, '04-stakeholders.md'));
  const mãCó = gomMã(docs);
  const cũ = tàiLiệu['00-threat-model.md'] ? soátTMCũ(docpath.readDoc(docs, '00-threat-model.md'), mãCó) : null;
  const sơĐồ = [...e1.sơĐồ, ...e2.sơĐồ];
  return {
    docs, hồSơ: profile.readProfile(docs), phạmVi: profile.readScope(docs), bốCục: docpath.layout(docs).moTa, tàiLiệu, lỗi,
    tắt: profile.off(docs), // .backlog = true (lite/mini) → nợ Mở ghi PD vào 00-decisions.md, không mở WI; .dev = true (docs) → §6 không có ac-judge đọc
    tàiSản: a.tàiSản, thựcThể: a.thựcThể, vaiTròEnum: a.vaiTròEnum,
    nfr: b.nfr, phápLý: b.phápLý, brule: c, ext: d,
    sơĐồ, sơĐồBỏQua: e1.bỏQua + e2.bỏQua, adr, stack, vaiTrò: { str: b.vaiTròStR, sh, enum: a.vaiTròEnum },
    threatModelCũ: cũ, mãCó: [...mãCó].length,
    tómTắt: {
      tàiSản: a.tàiSản.length, thựcThểNhạyCảm: new Set(a.tàiSản.map((x) => x.thựcThể)).size,
      nfrBảoMật: b.nfr.filter((x) => x.bảoMật).length, nfr: b.nfr.length,
      bruleQuyền: c.filter((x) => x.phânQuyền).length, brule: c.length, ext: d.length,
      sơĐồ: sơĐồ.filter((s) => !s.bỏQua).length, cạnhXuyênVùng: sơĐồ.reduce((n, s) => n + (s.ranhGiới || []).reduce((m, r) => m + r.cạnh.length, 0), 0),
      adr: adr.length, adrAccepted: adr.filter((x) => x.trạngThái === 'Accepted').length,
    },
  };
}

module.exports = { quét, gomMã, gomTàiSản, gomNFR, gomBRule, gomEXT, gomSơĐồ, gomADR, gomStack, gomSH, đọcTM, soátTMCũ, phânTíchFlowchart, phânTíchArchBeta, phânTíchC4, duyệtMd, NHÓM_TÀI_SẢN, RE_TRACE, RE_BRULE_QUYỀN };

/* ─── CLI ──────────────────────────────────────────────────────────────────────────────────────── */
if (require.main === module) {
  const argv = process.argv.slice(2);
  const DOCS = path.resolve(argv.find((a) => !a.startsWith('--')) || 'docs');
  const kq = quét(DOCS);
  if (argv.includes('--json')) { console.log(JSON.stringify(kq, null, 2)); process.exit((kq.lỗi || []).length ? 1 : 0); }
  if (!kq.tàiLiệu) { for (const l of kq.lỗi) console.log(`❌ ${l}`); process.exit(kq.lỗi.length); }
  const t = kq.tómTắt; const có = (n, thêm = '') => (kq.tàiLiệu[n] ? `✓${thêm}` : '✗');
  console.log(`scan-threat: ${DOCS} · hồ sơ ${kq.hồSơ} · phạm vi ${kq.phạmVi} · ${kq.bốCục}`);
  if (kq.tắt.backlog) console.log(`⚙️  hồ sơ ${kq.hồSơ}: sổ WI tắt — nợ Mở ghi PD vào 00-decisions.md (hoặc CR), không mở WI`);
  if (kq.tắt.dev) console.log('⚙️  phạm vi docs: không có dev-run/ac-judge — §6 checklist là phần bàn giao cho đội build, không phải cổng review');
  console.log(`Tài liệu: 10-architecture ${có('10-architecture.md', ` (${t.adr} ADR, ${t.adrAccepted} Accepted)`)} · 05-data-model ${có('05-data-model.md', ` (${kq.thựcThể.length} thực thể)`)} · 01-requirements ${có('01-requirements.md', ` (${t.nfr} NFR)`)} · 12-api-integration ${có('12-api-integration.md')} · 11-integration ${có('11-integration.md')} · 04-stakeholders ${có('04-stakeholders.md')} · 00-threat-model ${có('00-threat-model.md')}`);

  console.log(`\n(a) Tài sản nhạy cảm — ${t.tàiSản} dòng / ${t.thựcThểNhạyCảm} thực thể (từ khoá tên trường + mô tả; LLM loại cái không nhạy cảm)`);
  if (kq.tàiSản.length) { console.log('   | Thực thể | Trường | Nhóm | Dấu hiệu | Nguồn |'); console.log('   |---|---|---|---|---|'); }
  for (const x of kq.tàiSản) console.log(`   | ${x.thựcThể} | ${x.trường} | ${x.nhóm.join(', ')} | ${x.dấuHiệu} | 05-data-model${x.dòng ? `:${x.dòng}` : ''} |`);

  console.log(`\n(b) NFR bảo mật / quyền riêng tư — ${t.nfrBảoMật}/${t.nfr}${kq.phápLý.length ? ` · ràng buộc pháp lý: ${kq.phápLý.length}` : ''}`);
  for (const x of kq.nfr.filter((n) => n.bảoMật)) console.log(`   ${x.id} (${x.loại}): ${x.yêuCầu}  ← ${x.trace}`);
  for (const x of kq.phápLý) console.log(`   §7 :${x.dòng} ${x.text}`);

  const theoMàn = kq.brule.filter((x) => x.phânQuyền).reduce((a, x) => ((a[x.màn] = (a[x.màn] || 0) + 1), a), {});
  console.log(`\n(c) BRule phân quyền / phiên / cấm — ${t.bruleQuyền}/${t.brule}${Object.keys(theoMàn).length ? ` (${Object.entries(theoMàn).map(([m, n]) => `${m} ${n}`).join(' · ')})` : ''}`);
  for (const x of kq.brule.filter((n) => n.phânQuyền)) console.log(`   ${x.id}: ${x.quyTắc.slice(0, 140)}${x.quyTắc.length > 140 ? '…' : ''}`);

  console.log(`\n(d) Hệ ngoài EXT — ${t.ext}`);
  for (const x of kq.ext) console.log(`   ${x.id}: ${x.tên} — ${x.dùngCho} (${x.file}:${x.dòng})`);

  console.log(`\n(e) Ranh giới từ sơ đồ — ${t.sơĐồ} sơ đồ flowchart/architecture-beta/C4 (${kq.sơĐồBỏQua} sơ đồ loại khác bỏ qua) · ${t.cạnhXuyênVùng} cạnh xuyên vùng`);
  for (const s of kq.sơĐồ) {
    if (s.bỏQua) { console.log(`   ${s.file}:${s.dòng} "${s.mục}" — ${s.loại}: bỏ qua`); continue; }
    console.log(`   ${s.file}:${s.dòng} "${s.mục}" — ${s.vùng.length} vùng [${s.vùng.map((v) => v.nhãn).join(' · ')}] · ${s.sốNút} nút · ${s.sốCạnh} cạnh`);
    for (const r of s.ranhGiới) console.log(`      ${r.cặp}: ${r.cạnh.map((c) => `${c.từNhãn} → ${c.đếnNhãn}${c.nhãn ? ` (${c.nhãn})` : ''}`).join(' · ')}`);
  }
  console.log(`   ADR: ${kq.adr.map((a) => `${a.id} ${a.trạngThái}`).join(' · ') || 'không có'}`);
  console.log(`   Stack §2: ${kq.stack.côngNghệ.join(' · ') || 'không có bảng stack'} → nhóm checklist: ${kq.stack.nhóm.join(', ')}`);

  console.log(`\nVai trò: StR [${kq.vaiTrò.str.join(', ') || '—'}] · SH [${kq.vaiTrò.sh.map((s) => `${s.id} ${s.tên}`).join(', ') || '—'}] · enum [${kq.vaiTrò.enum.join(', ') || '—'}]`);

  const cũ = kq.threatModelCũ;
  if (!cũ) console.log(`\n(f) 00-threat-model.md — chưa có → skill sẽ TẠO mới ở docs/Ho-so/`);
  else {
    console.log(`\n(f) 00-threat-model.md — ${cũ.sốTM} TM (${Object.entries(cũ.theoTrạngThái).map(([k, v]) => `${k} ${v}`).join(' · ') || '—'}) · thiếu biện pháp ${cũ.thiếuBiệnPháp.length} · trace tới mã không tồn tại ${cũ.traceMa.length} · trạng thái lạ ${cũ.trạngTháiLạ.length}`);
    for (const x of cũ.thiếuBiệnPháp) console.log(`   ⚠️  ${x}: không có biện pháp`);
    for (const x of cũ.traceMa) console.log(`   ⚠️  ${x}: mã không định nghĩa ở đâu trong docs`);
    for (const x of cũ.trạngTháiLạ) console.log(`   ⚠️  ${x}: trạng thái ngoài {Mở, Giảm nhẹ, Chấp nhận}`);
    console.log('   → cổng hình: node .claude/skills/ba-threat-model/scripts/check-threat.js <docs> --plain');
  }
  for (const l of kq.lỗi) console.log(`\n❌ ${l}`);
  console.log(`\nTổng: ${t.tàiSản} tài sản · ${t.nfrBảoMật} NFR bảo mật · ${t.bruleQuyền} BRule phân quyền · ${t.ext} EXT · ${t.cạnhXuyênVùng} cạnh xuyên vùng · ${kq.mãCó} mã định nghĩa (để soát trace) · ${kq.lỗi.length} lỗi`);
  process.exit(kq.lỗi.length);
}
