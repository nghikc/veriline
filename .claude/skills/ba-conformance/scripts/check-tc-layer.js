#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
/*
 * ba-conformance/scripts/check-tc-layer.js — TC phải được thoả ở ĐÚNG TẦNG nó mô tả.
 * Zero-dependency. Chỉ đọc. Không phán xét ngoại lệ — trả dữ liệu để skill diễn giải.
 *
 * VÌ SAO TỒN TẠI — một ca thật, đo được, trong repo này (04/09/2026):
 *   `TC-S01-15` viết: "Mở /login → nhập sai mật khẩu → **Thông báo inline: Sai email hoặc mật
 *   khẩu. Còn 4 lần thử**". Đó là hành vi GIAO DIỆN.
 *   Test mang mã đó nằm ở `tests/modules/auth/dem-sai.test.ts` — gọi thẳng `dv.dangNhap()` ở
 *   TẦNG SERVICE. Nó pass.
 *   Còn màn hình thì `if (r.ok) dieuHuong(...)` — KHÔNG có nhánh else. Đăng nhập sai thì người
 *   dùng không thấy gì cả.
 *   Kết quả: 43/43 TC "pass", `ba-trace` 0 ref gãy, `ba-feasible` sạch, lint + typecheck 0 —
 *   mà nhánh lỗi thường gặp nhất của cả màn thì chưa được viết.
 *
 * Không cổng nào khác bắt được lớp lỗi này: chúng đếm "TC có test nào mang mã không", chứ
 * không hỏi "test đó có kiểm ĐÚNG THỨ TC mô tả không".
 *
 * Dùng:  node .claude/skills/ba-conformance/scripts/check-tc-layer.js [docsDir=docs] [--root <gốc code>] [--screen S0x] [--plain]
 *        --screen: chỉ soát TC của một màn (ac-verify/accept.js nhận màn S15 không được vướng nợ tầng TC của S11 — dự án helpdesk 16/09/2026)
 * Exit:  0 sạch · 1 có TC xanh-giả · 2 không đọc được nguồn.
 *
 * CHƯA KIỂM (W3 07/10/2026): dòng TC nằm dưới bảng KHÔNG có cột `Cách chạy` → rơi vào nhánh Manual (không `Auto` thì
 *   không soát tầng) ⇒ cổng im mà không đọc được gì — xanh giả của chính cổng. Màn có TC như vậy vào
 *   `chuaKiem: [{man, lyDo, cach, soTC, tongTC, file}]` (JSON) / dòng `Chưa kiểm:` (chữ); các TC đó KHÔNG tính vào `thuCong`.
 *   Xét theo TỪNG DÒNG TC, không theo file: P1 `Dock/S14` có 7 bảng `| ID | … | Kỳ vọng | Trace |` (không cột) + 3 bảng có
 *   cột trong cùng một test.md — xét theo file thì cả màn "có cột" và phần lớn TC lọt. Exit KHÔNG đổi: người chốt 07/10 —
 *   báo, không chặn dự án cũ. Bổ sung cột: `ba-screen-spec <màn> --bo-sung cach-chay`.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const cờ = (t, m) => { const i = args.indexOf(t); return i >= 0 && args[i + 1] ? args[i + 1] : m; };
const PLAIN = args.includes('--plain');
const SCREEN = cờ('--screen', null);
const DOCS = path.resolve(args.find((a) => !a.startsWith('--') && a !== cờ('--root', null) && a !== SCREEN) || 'docs');
const ROOT = path.resolve(cờ('--root', path.join(DOCS, '..')));
if (!fs.existsSync(DOCS)) { console.error(`Không thấy ${DOCS}`); process.exit(2); }

/* ── Tầng mà một TC MÔ TẢ ──────────────────────────────────────────────────────────────────
 * `WI-125` — **đọc cột KHẲNG ĐỊNH, không đọc cột THAO TÁC; và có quyền phủ quyết.**
 *
 * Bản cũ gộp `Các bước` + `Kết quả mong đợi` rồi đếm từ. Hai sai lầm, đo được:
 *
 *  1. **Thao tác không phải tầng.** Gần như mọi TC đều mô tả bước bằng động từ người
 *     (`bấm`, `nhập`, `gõ`) kể cả khi thứ nó khẳng định nằm ở tầng dưới. `TC-S58-11`
 *     là ca phân quyền API — bước `1. B bấm Chỉnh` đủ làm nó thành "TC giao diện",
 *     rồi vì test nằm ở `*.api.test.ts` nên cổng kêu ❌. `TC-S51-04/06/25/45` (tra mã
 *     nhân viên, cô lập tổ chức) cũng vậy. **Tầng của một TC là tầng của thứ nó
 *     KHẲNG ĐỊNH, không phải tầng của cách người ta bấm tới đó** — nên chỉ đọc
 *     `Kết quả mong đợi`.
 *  2. **Không có quyền phủ quyết.** Một từ UI đơn lẻ thắng tuyệt đối. `TC-S58-28`
 *     khẳng định *"File có cột Nguồn quét với giá trị **Màn hình học viên**"* — chuỗi
 *     `màn hình` ở đây là **giá trị dữ liệu trong file Excel**. `TC-S58-44` khẳng định
 *     `boi = NULL` trong bảng `live_attendance_edits`. Nay: mong đợi nào mang **dấu
 *     hiệu tầng dưới** (mã HTTP, cột/bảng CSDL, tệp xuất, payload API) thì **không**
 *     được xếp `ui` nữa — cùng lắm là `hỗn hợp`, và `hỗn hợp` KHÔNG bị kêu.
 *
 * Đổi lại, cổng chỉ còn kêu khi **cả hai vế đều chắc**: mong đợi nói thứ người dùng
 * NHÌN THẤY, và không có gì trong đó nói tầng dưới. Chấp nhận bỏ sót TC "nửa UI nửa
 * DB" để đổi lấy việc mỗi tiếng kêu đều đáng dừng lại đọc.
 */
const TỪ_UI = ['thông báo', 'hiển thị', 'hiện ', 'inline', 'snackbar', 'toast', 'tooltip',
  'nút ', 'vô hiệu', 'disable', 'redirect', 'điều hướng', 'render', 'màn hình', 'giao diện',
  'placeholder', 'nhãn ', 'về trang', 'hộp thoại', 'modal', 'trình duyệt', 'form', 'tab', 'ô '];
/* Dấu hiệu thứ được khẳng định KHÔNG nằm ở giao diện. Mỗi mẫu rút từ một ca thật trong kho. */
const DẤU_KHÔNG_UI = [
  /(^|[^\d.,])(200|201|202|204|301|302|304|400|401|403|404|405|409|410|422|429|500|502|503)([^\d%’′]|$)/, // mã HTTP — TC-S58-11, TC-S49-29
  /`[^`]{0,60}=[^`]{0,60}`/,                       // gán trường trong backtick — TC-S58-44 `boi = NULL`
  /`[a-z][a-z0-9_]*`\s*(=|về|→|chứa|bằng)/,        // `logo_url` về `null` — TC-S50-13
  /\bbản ghi\b|\bcsdl\b|\bdb\b|bảng `|cột `|\bschema\b|\bmigration\b/, // TC-S48-09/22/25
  /\bfile\b|\bexcel\b|\bcsv\b|\.xlsx|\btệp xuất\b/, // tệp xuất ra — TC-S58-28
  // Chữ `api` TRẦN cố ý không nằm đây: `TC-S49-13` khẳng định *"Hiện … ; **không** gọi API"* —
  // vế API là một PHỦ ĐỊNH, thứ nó khẳng định vẫn là câu báo trên màn. Phủ quyết bằng chữ `api`
  // sẽ nuốt mất cả nhóm TC "chặn ở client, không chạm mạng". Ca "gọi thẳng API" đã bị luật
  // `bỏ qua giao diện|gọi thẳng` ở trên bắt từ cột `Các bước` rồi.
  /\bendpoint\b|\bpayload\b|\bresponse\b|\bheader\b|\bhttp\b|\bjson\b|\bwebhook\b|api trả/,
];
const TỪ_API = ['gọi post', 'gọi get', 'gọi patch', 'gọi api', 'endpoint', 'http ', 'request',
  'response', 'header', 'body', 'trả 4', 'trả 2', 'trả 5', 'api trả'];

function tầngMôTả(bước, mongĐợi, tiềnĐiềuKiện = '') {
  // TC "rà": mọi bước bắt đầu bằng Rà/Quét/Đối chiếu/Đọc/Kiểm mã → soát tài liệu/mã, không phải giao diện dù mong đợi nói "hiển thị"
  // (dự án helpdesk TC-S16-39: rà chữ hiển thị trên màn = quét chuỗi). TC nói rõ "bỏ qua giao diện"/"gửi trực tiếp" → api.
  const cácBước = String(bước).split(/<br\s*\/?>|\n/).map((b) => b.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean);
  if (cácBước.length && cácBước.every((b) => /^(rà|quét|đối chiếu|đọc|kiểm mã|grep|soát)/i.test(b))) return { tầng: 'rà', ui: 0, api: 0 };
  if (/bỏ qua (giao diện|ui)|không qua giao diện|gửi (dữ liệu|yêu cầu)[^.]{0,30}trực tiếp|gọi (thẳng|trực tiếp)/i.test(`${tiềnĐiềuKiện} ${bước}`)) return { tầng: 'api', ui: 0, api: 1 };

  // CHỈ đọc cột khẳng định. `Các bước` đã dùng xong ở hai luật trên và không tham gia đếm từ.
  const t = String(mongĐợi).toLowerCase();
  // Từ ngắn (`ô `, `nút `, `tab`, `form`, `hiện `) chỉ tính khi đứng đầu từ — `mô hình`, `tôi`, `database` chứa `ô `/`tab` mà không phải
  // giao diện (dự án helpdesk TC-S15-79 "Rà MÔ hình dữ liệu" bị xếp UI, 16/09/2026). `\b` không hiểu chữ có dấu nên dùng lớp ký tự.
  const đầuTừ = (k) => new RegExp(`(^|[^\\p{L}\\p{N}])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u');
  const ui = TỪ_UI.filter((k) => (k.length <= 5 ? đầuTừ(k).test(t) : t.includes(k))).length;
  const api = TỪ_API.filter((k) => t.includes(k)).length;
  const dướiUI = DẤU_KHÔNG_UI.filter((r) => r.test(t)).length;

  if (ui === 0 && api === 0 && dướiUI === 0) return { tầng: 'không rõ', ui, api };
  if (ui === 0) return { tầng: 'api', ui, api };          // chỉ nói tầng dưới → không bao giờ bị kêu
  if (dướiUI > 0 || api > ui) return { tầng: 'hỗn hợp', ui, api, dướiUI }; // hai vế cùng có → im, xem gioiHan
  return { tầng: 'ui', ui, api };
}

/* ── Tầng mà một FILE TEST kiểm ─────────────────────────────────────────────────────────────
 * Đường dẫn là tín hiệu CHÍNH (`e2e/` → e2e, `.tsx`/`components/` → ui). Đường dẫn im thì mới đọc NỘI DUNG:
 *
 *  (1) W2 OAN-2 07/10/2026 — P6 để spec Playwright ở `tests/playwright/<màn>/` (ngoài `e2e/`): `s22-full.spec.ts:55`
 *      `test('TC-S22-002 …', async ({ page }) => …)` bị xếp service ⇒ 27 ❌ oan. File LÁI TRÌNH DUYỆT (`page.goto(`,
 *      fixture `({ page })`, `cy.visit(`) ⇒ e2e. Cố ý KHÔNG lấy dấu `@playwright/test` trần: spec API của Playwright
 *      (`async ({ request })`) không đi qua giao diện, vẫn là service.
 *  (2) W2 OAN-3 07/10/2026 — dự án không có runner trình duyệt (P5: HTML/JS tĩnh, test pytest chạy chính file .js của
 *      trang trong DOM giả bằng `vm`) TỰ KHAI qua `docs/Ho-so/tc-layer.json` (resolveDoc: Ho-so → gốc docs):
 *        { "uiSourceDir": "src/<gói>/webui", "uiEvidence": ["run_in_fake_dom", "vm.runInNewContext"] }
 *      Một file test là `ui` khi CẢ HAI: nội dung nhắc TÊN một file .html/.js/.css có thật ngay trong `uiSourceDir`
 *      (gốc = --root; không đệ quy; so tên chứ không so đường dẫn — test hay ghép `Path(..) / "webui"`), VÀ chứa ít nhất
 *      một chuỗi `uiEvidence` (nó THỰC THI hiện vật đó). Thiếu một vế → service như cũ; không có file → như trước.
 *      Kéo từ bản vá cục bộ của dự án đích (ADR-17 của họ).
 */
const { resolveDoc } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));
const LÁI_TRÌNH_DUYỆT = /\bpage\.goto\(|\(\s*\{[^}]*\bpage\b[^}]*\}\s*\)\s*=>|\bcy\.visit\(/;
const CẤU_HÌNH = (() => {
  const f = resolveDoc(DOCS, 'tc-layer.json'); if (!f) return null;
  try {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    let tên = [];
    try { tên = fs.readdirSync(path.join(ROOT, String(j.uiSourceDir || '')), { withFileTypes: true }).filter((e) => e.isFile() && /\.(html|js|css)$/i.test(e.name)).map((e) => e.name); } catch { /* thư mục không có → 0 hiện vật */ }
    const dấu = Array.isArray(j.uiEvidence) ? j.uiEvidence.filter((x) => typeof x === 'string' && x.trim().length >= 4) : [];
    return { file: path.relative(ROOT, f).split(path.sep).join('/'), uiSourceDir: j.uiSourceDir, tên: j.uiSourceDir ? tên : [], dấu };
  } catch (e) { return { file: path.relative(ROOT, f), lỗi: e.message, tên: [], dấu: [] }; }
})();
const _đọc = new Map();
const nộiDung = (rel) => { if (!_đọc.has(rel)) { let t = ''; try { t = fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch { /* rỗng */ } _đọc.set(rel, t); } return _đọc.get(rel); };
function tầngFile(rel) {
  const p = rel.split(path.sep).join('/').toLowerCase();
  if (/(^|\/)e2e\//.test(p)) return 'e2e';
  if (/\.tsx$|\/components?\//.test(p)) return 'ui';
  const src = nộiDung(rel);
  if (LÁI_TRÌNH_DUYỆT.test(src)) return 'e2e';
  if (CẤU_HÌNH && CẤU_HÌNH.tên.length && CẤU_HÌNH.dấu.length
    && CẤU_HÌNH.tên.some((t) => src.includes(t)) && CẤU_HÌNH.dấu.some((d) => src.includes(d))) return 'ui';
  return 'service';
}
/** e2e đi qua giao diện thật nên thoả được TC giao diện. Chỉ `ui` mới kén tầng. */
const thoảĐược = (tầngTest, tầngTC) => (tầngTC === 'ui' ? ['ui', 'e2e'].includes(tầngTest) : true);

function gom(dir, lọc) {
  const ra = [];
  const đi = (d) => {
    let es = [];
    try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) đi(p); else if (lọc(e.name)) ra.push(p);
    }
  };
  đi(dir);
  return ra;
}

/* ── Gom TC từ tài liệu ─────────────────────────────────────────────────────────────────── */
/*
 * `WI-124` — **định vị cột theo TIÊU ĐỀ, và chịu được hậu tố sau mã TC.**
 *
 * Hai lỗi cũ làm cổng này "xanh vì không đọc được dữ liệu" — tệ hơn không có
 * cổng, vì nó phát ra sự yên tâm mà không kèm bằng chứng:
 *
 *  1. Regex cũ `/^\|\s*(TC-S\d+-\d+)\s*\|/` đòi ô đầu **chỉ** có mã. Mọi dòng
 *     viết `| TC-S58-24 *(CR-167)* |` — quy ước ghi nguồn CR của chính dự án —
 *     đều bị bỏ qua. Đo trên `S58`: cổng thấy **23/44** mã.
 *  2. Chỉ số cột đóng cứng theo bảng 15 cột. Bảng `S58` có **12 cột**, nên
 *     `ô[13]` là `undefined` ⇒ `cách` rỗng ⇒ nhánh "TC Auto chưa có test mang
 *     mã" **không bao giờ chạy** cho file đó, và mọi TC bị xếp "không rõ tầng"
 *     chỉ vì đọc nhầm cột.
 *
 * Nay: đọc **hàng tiêu đề** của bảng đang quét rồi ánh xạ tên cột → chỉ số.
 * Bảng không có tiêu đề nhận ra được thì mới lùi về chỉ số cũ.
 */
const TÊN_CỘT = {
  bước: [/^các bước( rút gọn)?$/i, /^bước$/i],
  // Thứ tự = ưu tiên (xét theo MẪU trước, ô sau): `Kết quả` trần chỉ là phương án cuối — ở bảng 15 cột
  // nó là cột Pass/Fail đứng SAU `Kết quả mong đợi`. dự án desktop viết `Kỳ vọng`/`Kết quả kỳ vọng` (148 bảng).
  mong: [/^kết quả mong đợi\b/i, /^kết quả kỳ vọng$/i, /^kỳ vọng$/i, /^mong đợi$/i, /^kết quả$/i],
  cách: [/^cách chạy$/i, /^cách$/i, /^auto\??$/i],
  tđk: [/^tiền điều kiện$/i, /^tiền đề$/i],
};

function đọcTiêuĐề(dòng) {
  const ô = dòng.replace(/^\||\|\s*$/g, '').split('|').map((x) => x.trim());
  // `WI-125`: **55/60** file `test.md` của kho này mở bảng bằng `| Mã TC |`, không phải `| Mã |`.
  // Mẫu cũ `/^mã$/` trượt hết, nên chúng rơi về `VỊ_TRÍ_CŨ` (bảng 15 cột) trong khi bảng thật có
  // 12 cột ⇒ `mong` đọc trúng cột *Trạng thái*, `cách` là `undefined`. Hệ quả đo được: phần lớn
  // "TC không đoán được tầng" và "TC Auto chưa có test" không phải nhận định về dự án — là tiếng
  // vọng của một mẫu regex hụt một chữ. Đây là phần WI-124 vá chưa tới.
  // 25/09/2026 — cùng lỗi, hình thứ ba: dự án desktop mở 879/4123 dòng TC bằng `| ID |` (và `| TC |`) → bảng
  // không được nhận, dòng TC đọc bằng chỉ số của bảng TRƯỚC trong cùng file hoặc `VỊ_TRÍ_CŨ` 15 cột.
  if (!ô.some((x) => /^(mã( tc)?|id|tc)$/i.test(x))) return null;
  const vịTrí = {};
  for (const [khoá, mẫu] of Object.entries(TÊN_CỘT)) {
    for (const r of mẫu) { const i = ô.findIndex((tên) => r.test(tên)); if (i >= 0) { vịTrí[khoá] = i + 1; break; } } // +1: ô rỗng đầu dòng
  }
  // Nhận ra bảng TC mà không có cột nào quen → trả vị trí RỖNG (không lùi về bảng cũ/15 cột): đọc sai cột còn tệ hơn không đọc.
  return vịTrí;
}

/** Vị trí mặc định — bảng 15 cột đời đầu, giữ để file chưa có tiêu đề vẫn chạy. */
const VỊ_TRÍ_CŨ = { bước: 10, mong: 12, cách: 13, tđk: 9 };

const tcs = new Map();
for (const f of gom(DOCS, (n) => n === 'test.md')) {
  let vịTrí = VỊ_TRÍ_CŨ;
  const rel = path.relative(DOCS, f);
  for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
    const tiêuĐề = l.includes('|') ? đọcTiêuĐề(l) : null;
    // Tiêu đề nhận ra được thì CHỈ dùng cột nó khai — trộn `VỊ_TRÍ_CŨ` vào là bảng 6 cột thiếu `Cách chạy` đọc `cách` ở ô[13].
    if (tiêuĐề) { vịTrí = tiêuĐề; continue; }
    // Chịu được `**TC-…**`, `TC-… *(CR-99)*`, `TC-…` — mọi thứ sau mã tới dấu `|`.
    const m = /^\|\s*\*{0,2}(TC-S\d+-\d+)\*{0,2}[^|]*\|/.exec(l);
    if (!m) continue;
    const ô = l.replace(/\|\s*$/, '').split('|').map((x) => x.trim());
    const bước = ô[vịTrí.bước] || ''; const mong = ô[vịTrí.mong] || '';
    const cách = ô[vịTrí.cách] || ''; const tđk = ô[vịTrí.tđk] || '';
    // Có cột = tiêu đề khai cột Cách chạy (hoặc bảng 15 cột đời đầu thật sự đủ ô 13). Ô rỗng trong cột có thật vẫn là "có cột".
    // Mã TC lặp lại ở bảng tóm tắt kết quả không cột (`| TC | Test | Kết quả |` — P1 S19) không xoá "có cột" của dòng chính.
    const cóCột = (vịTrí.cách != null && ô[vịTrí.cách] !== undefined) || Boolean(tcs.get(m[1]) && tcs.get(m[1]).cóCột);
    tcs.set(m[1], { id: m[1], file: rel, cách, cóCột, ...tầngMôTả(bước, mong, tđk), mong: mong.slice(0, 110) });
  }
}

/* ── Gom mã TC trong test code ─────────────────────────────────────────────────────────────── */
// Luật "test nào mang mã TC nào" giữ ở ba-toolkit/testcode.js (dùng chung với ac-eval/scan-eval.js).
const { gomTestCode } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'testcode.js'));
const nơiThoả = new Map();
for (const [tc, hits] of gomTestCode(ROOT)) if (/^TC-S\d+-\d+$/.test(tc)) nơiThoả.set(tc, new Set(hits.map((h) => h.file)));

/* ── Đối chiếu ────────────────────────────────────────────────────────────────────────────── */
/*
 * `WI-125` — hai nguồn bằng chứng, xếp trước lời văn:
 *
 *  (a) **Cột `Cách chạy`.** `Manual` nghĩa là màu xanh của TC này do **người chạy tay** cấp,
 *      không do file test cấp. Một test service tình cờ mang mã đó là phần THÊM, không phải
 *      lời nói dối — kêu nó lên chỉ dạy người ta bỏ qua cổng. Chỉ `Auto` mới đang khẳng định
 *      "đã có máy kiểm", nên chỉ `Auto` bị soát tầng.
 *  (b) **Tên file ghi ngay trong `Cách chạy`** — quy ước của kho này: `Auto (\`X.test.tsx\`)`,
 *      `Auto (e2e)`. Đó là tài liệu **tự khai tầng**, không phải ta đoán. Khai `.tsx`/e2e mà
 *      thực tế chỉ có test service thoả ⇒ mâu thuẫn khai-vs-đo, kêu **bất kể** lời văn.
 */
const KHAI_UI = /`[^`]*\.tsx`|\be2e\b|\bplaywright\b|\bcypress\b/i;

const xanhGiả = []; const chưaCó = []; const khôngRõ = []; const hỗnHợp = []; const thủCông = [];
// Màn CHƯA KIỂM: mã màn lấy từ mã TC (`TC-S14-…` → S14) — đúng cả folder kiểu `S14-X`, `Nhóm/S14 - Y`, phẳng.
const chưaKiểm = new Map(); const tổngMàn = new Map();
for (const tc of tcs.values()) {
  const man = /^TC-(S\d+)-/.exec(tc.id)[1];
  if (SCREEN && man !== SCREEN) continue;
  tổngMàn.set(man, (tổngMàn.get(man) || 0) + 1);
  if (tc.cóCột) continue;
  if (!chưaKiểm.has(man)) chưaKiểm.set(man, { man, lyDo: '', cach: `ba-screen-spec ${man} --bo-sung cach-chay`, file: tc.file, soTC: 0, tongTC: 0 });
  chưaKiểm.get(man).soTC++;
}
for (const c of chưaKiểm.values()) {
  c.tongTC = tổngMàn.get(c.man);
  c.lyDo = c.soTC === c.tongTC ? 'test.md không có cột Cách chạy — mọi TC bị coi Manual'
    : `${c.soTC}/${c.tongTC} TC nằm ở bảng không có cột Cách chạy — bị coi Manual`;
}
for (const tc of tcs.values()) {
  if (SCREEN && !new RegExp(`^TC-${SCREEN}-`).test(tc.id)) continue;
  if (!tc.cóCột) continue; // không cột Cách chạy → không thể `Auto` → không gì để soát; đã vào chuaKiem
  const tựĐộng = /auto/i.test(tc.cách);
  const nơi = [...(nơiThoả.get(tc.id) || [])];
  if (!nơi.length) { if (tựĐộng) chưaCó.push(tc.id); continue; }
  const tầngs = nơi.map((r) => ({ file: r, tầng: tầngFile(r) }));
  const kêu = (vìSao, tầngCần) => xanhGiả.push({ id: tc.id, tcMôTả: tầngCần, vìSao, thoảBởi: tầngs, mong: tc.mong, doc: tc.file });

  // (b) chạy trước: tài liệu tự khai tầng thì không cần đọc lời văn nữa.
  if (KHAI_UI.test(tc.cách) && !tầngs.some((x) => ['ui', 'e2e'].includes(x.tầng))) {
    kêu(`bảng khai \`${tc.cách}\``, 'ui'); continue;
  }
  if (!tựĐộng) { thủCông.push(tc.id); continue; }
  if (tc.tầng === 'không rõ') { khôngRõ.push(tc.id); continue; }
  if (tc.tầng === 'hỗn hợp') { hỗnHợp.push(tc.id); continue; }
  if (!tầngs.some((x) => thoảĐược(x.tầng, tc.tầng))) kêu('kết quả mong đợi chỉ nói thứ người dùng nhìn thấy', tc.tầng);
}

const gioiHan = [
  'Phân loại tầng đọc TỪ NGỮ trong "Kết quả mong đợi" (cột KHẲNG ĐỊNH) — không hiểu ngữ nghĩa. TC viết mơ hồ vào nhóm "không rõ" và KHÔNG được kiểm.',
  'TC khẳng định CẢ giao diện LẪN tầng dưới ("Hiện cây 3 khoá; kiểm DB: 0 bản ghi") vào nhóm "hỗn hợp" và KHÔNG bị kêu — một test service thoả được nửa dưới là đủ để cổng im, dù nửa trên chưa ai kiểm. Đây là giá của việc cắt dương tính giả.',
  'TC `Manual` KHÔNG bị soát tầng: màu xanh của nó do người chạy tay cấp, không do file test. Test service mang mã đó không bị coi là xanh-giả.',
  'Chỉ thấy mã TC xuất hiện trong file test. Test kiểm đúng hành vi nhưng không ghi mã → bị coi là chưa có; ghi mã mà kiểm sai thứ khác → vẫn coi là có.',
  'Tầng file test: đường dẫn trước (e2e/ · .tsx/components/), đường dẫn im mới đọc nội dung — chỉ nhận dấu LÁI TRÌNH DUYỆT (`page.goto(`, `({ page })`, `cy.visit(`) là e2e, và (nếu có `tc-layer.json`) nhắc tên hiện vật trong `uiSourceDir` + chứa một `uiEvidence` là ui. Driver khác (Selenium, Appium, WebdriverIO…) chưa nhận → service.',
  '`tc-layer.json` do dự án tự khai: `uiEvidence` là chuỗi con tuỳ dự án — khai chuỗi quá chung là tự nới cổng; cổng chỉ chứng được "test chạy chính hiện vật giao diện", KHÔNG chứng được layout/màu/phông (DOM giả không có layout).',
  'Không hiểu ngữ nghĩa test. "Đúng tầng" không có nghĩa là "kiểm đúng điều TC mô tả" — phần đó là việc của agent ba-inference-reviewer chế độ conformance.',
  'e2e được coi là thoả được TC giao diện, kể cả khi test e2e đó đang `skip`.',
  '"Chưa kiểm" = dòng TC nằm dưới bảng (tiêu đề nhận ra được) không có cột `Cách chạy`, hoặc bảng không tiêu đề mà dòng ngắn hơn 14 ô (bảng 15 cột đời đầu). Cột có mà ô rỗng → coi là Manual, không phải Chưa kiểm. Chưa kiểm KHÔNG làm exit ≠ 0.',
];

const ra = { docsDir: DOCS, root: ROOT, cauHinhTang: CẤU_HÌNH && { file: CẤU_HÌNH.file, uiSourceDir: CẤU_HÌNH.uiSourceDir, hienVat: CẤU_HÌNH.tên.length, uiEvidence: CẤU_HÌNH.dấu, loi: CẤU_HÌNH.lỗi }, soTC: tcs.size, xanhGia: xanhGiả, chuaKiem: [...chưaKiểm.values()], chuaCoTest: chưaCó, khongRoTang: khôngRõ, honHop: hỗnHợp, thuCong: thủCông, gioiHan };

if (PLAIN) {
  console.log(`Soát tầng TC: ${tcs.size} TC · gốc code ${ROOT}`);
  if (CẤU_HÌNH) console.log(CẤU_HÌNH.lỗi ? `  ⚠️  ${CẤU_HÌNH.file} không đọc được (${CẤU_HÌNH.lỗi}) — bỏ qua` : `  cấu hình tầng ui: ${CẤU_HÌNH.file} · ${CẤU_HÌNH.tên.length} hiện vật trong "${CẤU_HÌNH.uiSourceDir}" · dấu chạy thật: ${CẤU_HÌNH.dấu.join(', ') || '(không có)'}`);
  if (!xanhGiả.length) console.log('  ✓ không TC nào bị thoả sai tầng');
  for (const x of xanhGiả) {
    console.log(`\n  ❌ ${x.id} — TC tầng ${x.tcMôTả.toUpperCase()} nhưng chỉ có test tầng ${[...new Set(x.thoảBởi.map((t) => t.tầng))].join('/')}  (${x.vìSao})`);
    console.log(`     mong đợi: ${x.mong}`);
    for (const t of x.thoảBởi) console.log(`     thoả bởi: ${t.file}  [${t.tầng}]`);
  }
  if (chưaCó.length) console.log(`\n  ⚠️  ${chưaCó.length} TC \`Auto\` chưa test nào mang mã: ${chưaCó.slice(0, 8).join(', ')}${chưaCó.length > 8 ? '…' : ''}`);
  if (khôngRõ.length) console.log(`  ⚠️  ${khôngRõ.length} TC không đoán được tầng (viết mơ hồ) — KHÔNG được kiểm: ${khôngRõ.slice(0, 6).join(', ')}${khôngRõ.length > 6 ? '…' : ''}`);
  if (hỗnHợp.length) console.log(`  ⚠️  ${hỗnHợp.length} TC khẳng định cả giao diện lẫn tầng dưới — cố ý KHÔNG kêu: ${hỗnHợp.slice(0, 6).join(', ')}${hỗnHợp.length > 6 ? '…' : ''}`);
  if (thủCông.length) console.log(`  ·   ${thủCông.length} TC \`Manual\` có test mang mã — không soát tầng (xanh do người chạy tay cấp)`);
  // Không gắn ⚠️: đây là chỗ CỔNG mù, không phải phát hiện về dự án (cùng họ dòng `Chưa kiểm:` của plist.js).
  if (chưaKiểm.size) console.log(`\n  Chưa kiểm: ${[...chưaKiểm.values()].map((c) => `${c.man} (${c.soTC === c.tongTC ? 'cả ' : c.soTC + '/'}${c.tongTC} TC)`).join(', ')} — TC ở bảng không có cột Cách chạy bị coi Manual, cổng không soát được · bổ sung: ba-screen-spec <màn> --bo-sung cach-chay`);
  console.log('\n  Không thấy được:');
  for (const g of gioiHan) console.log(`    · ${g}`);
} else console.log(JSON.stringify(ra, null, 2));

process.exit(xanhGiả.length ? 1 : 0);
