#!/usr/bin/env node
/**
 * ba-export/install.js
 * Zero-dependency installer: copy bộ BA toolkit (skills ba-* + dev-* + agent + file
 * hướng dẫn README/GUIDELINE + folder explain sang explain/)
 * từ repo này sang một dự án khác.
 *
 * Nguồn = repo chứa script này (tự định vị qua __dirname).
 *
 * Cách dùng (đứng trong dự án đích):
 *   node /abs/path/BA_toolkit_v3.0/.claude/skills/ba-export/scripts/install.js
 *
 * Tham số (tùy chọn):
 *   --to <đích>     thư mục dự án đích (mặc định = thư mục hiện tại)
 *   --from <nguồn>  repo BA toolkit nguồn (mặc định = repo chứa script này, hoặc nguồn đã
 *                   ghi trong .claude/ba-toolkit.json của đích khi chạy từ dự án tiêu dùng)
 *   --check         KHÔNG ghi gì — chỉ so đích với nguồn rồi báo có gì mới/đổi/sửa cục bộ, hook bị gỡ/lệnh cũ,
 *                   permissions.deny thiếu (→ exit 1), `disableAllHooks`, `ba-hooks.json` khác mặc định (chỉ báo ⛔).
 *                   Exit code 0 = đang mới nhất · 1 = có cập nhật.
 *   --dry           chỉ in danh sách sẽ copy, không ghi gì
 *   --force         ghi đè cả những file đã bị SỬA CỤC BỘ ở đích (mặc định: giữ bản cục bộ)
 *   --prune         xoá skill thừa ở đích (prefix ba- hoặc dev-) không còn ở nguồn
 *                   (skill ĐÃ GỘP trong canon `deprecated.skills` thì KHÔNG cần --prune: update tự gỡ
 *                   nếu đích không sửa cục bộ nó — có sửa thì GIỮ + cảnh báo; `--check` báo "cũ → mới")
 *   --allow-dirty   cho cài từ nguồn còn thay đổi CHƯA COMMIT trong phần sẽ copy (mặc định từ chối khi
 *                   đích là một git repo — dự án thật; manifest ghi lại nguồn dirty)
 *   --allow-unsafe  cài dù quét bảo mật NGUỒN (ba-toolkit/scripts/scan-skills.js) còn hit 🔴 chưa duyệt. Mặc định
 *                   DỪNG: skill + 3 hook cài sang chạy ở mọi Read/Edit/Stop của dự án đích — nguồn bị xâm
 *                   nhập là code lạ ở mọi đích. `--check`/`--dry` không ghi nên chỉ in, không chặn.
 *   --no-claude     bỏ qua bước ghi khối directive "luôn nạp" vào CLAUDE.md của đích
 *   --profile core|mini|full  BỘ SKILL (M6, docs/decisions/32). core (MẶC ĐỊNH lần cài đầu) = canon `profile.core.skills`
 *                   (lõi BA ~19 skill: ý tưởng → đặc tả → test → thiết kế → portal) · mini = `profile.mini.skills` (⊆ core)
 *                   · full = mọi skill ở nguồn (hành vi trước M6). GHI NHỚ trong manifest (`installProfile`): `update`
 *                   giữ nguyên; manifest cũ chưa có trường này = full (dự án đang dùng không mất skill nào).
 *                   Đích đã có skill ngoài hồ sơ → GIỮ + cập nhật; chỉ --prune mới gỡ.
 *   --mini          bí danh của `--profile mini`
 *   --dev           thêm BỘ DEV (canon `profile.dev.skills` + mọi `dev-*`): ba-build, dev-run, ac-verify… — dự án sẽ viết
 *                   code. Ghi nhớ (`dev: true`); `--no-dev` tắt. Hồ sơ full đã gồm bộ dev. Không đi cùng `--scope docs`.
 *   --scope docs|full   PHẠM VI: `docs` = dự án chỉ làm tài liệu BA → KHÔNG cài bộ skill dev
 *                   (canon `scope.dev.skills` + mọi `dev-*`), khối CLAUDE.md in vòng đời 3 GĐ.
 *                   Được GHI NHỚ trong manifest: `update` sau đó giữ nguyên phạm vi, đổi bằng
 *                   `--scope full`. Không khai lần đầu = full.
 *   --with-experimental cài cả skill THỬ NGHIỆM (canon `skills.experimental` — chưa từng chạy thật trên
 *                   dự án nào; mặc định KHÔNG cài). Đích đã có skill thử nghiệm thì luôn GIỮ + cập nhật,
 *                   không cần cờ; `--check` gắn nhãn "thử nghiệm". Agent riêng của skill thử nghiệm
 *                   (canon `agents.experimental`) đi theo skill. Khoá chưa có → cài như cũ.
 *
 * settings.json của đích (merge, không đè thứ người dùng có): 4 hook theo bảng HOOK_CHUẨN của ba-toolkit/scripts/integrity.js,
 * lệnh dạng `node "${CLAUDE_PROJECT_DIR:-.}/.claude/…"` (di trú lệnh tương đối cũ), matcher hook-guard có Edit|Write|NotebookEdit,
 * và `permissions.deny` chặn đọc bí mật (file env, khoá .pem, thư mục khoá SSH/credential AWS ở home — khoét bản mẫu env, cert.pem/public.pem) — hook-review 07/10/2026.
 *
 * Ngoài skills + file hướng dẫn, mặc định còn ghi 1 khối managed (idempotent) vào
 * CLAUDE.md của dự án đích — luật ưu tiên swimlane cho luồng đa vai trò (agent luôn đọc
 * CLAUDE.md nên áp cả khi không chạy skill BA). Chạy lại chỉ cập nhật khối, không nhân bản.
 *
 * ─── Dấu vết cài đặt: `<đích>/.claude/ba-toolkit.json` ───────────────────────────
 * Mỗi lần cài, script ghi manifest ở đích gồm: nguồn (đường dẫn + git remote/branch/commit),
 * ngày cài, số skill/agent, và **hash từng file đã copy**. Nhờ đó lần sau biết được:
 *   - file nào ĐỔI Ở NGUỒN (hash nguồn ≠ hash lúc cài)      → cần cập nhật
 *   - file nào SỬA CỤC BỘ ở đích (hash đích ≠ hash lúc cài) → GIỮ NGUYÊN, chỉ cảnh báo
 *   - file nào XUNG ĐỘT (cả hai cùng đổi)                    → giữ bản cục bộ + nhắc mỗi lần
 * Manifest cũng là thứ cho phép chạy `--check`/cập nhật **từ trong dự án tiêu dùng** mà
 * không cần nhớ đường dẫn repo nguồn.
 *
 * Ghi an toàn (đợt 5 gói 4, mượn agent-skills lockfile.service): settings.json, CLAUDE.md và manifest
 * ghi qua tệp tạm + rename (không bao giờ để lại file nửa chừng khi bị ngắt) và giữ bản trước ở `.bak`.
 * `--check` còn in `git log a..b` của nguồn (skills/agents/decisions) + tiêu đề decision mới/đổi.
 *
 * gioiHan: (1) "nguồn dirty" chỉ xét các đường dẫn sẽ copy (cả lệnh chặn lẫn dòng "Phiên bản" / manifest `git.dirty`
 *   — `workshop/` untracked không tính), và chỉ CHẶN khi đích có `.git` (dự án thật);
 *   đích không phải git repo (thư mục tạm, bản thử) thì chỉ cảnh báo + ghi manifest. (2) Gỡ skill đã gộp
 *   dựa trên hash trong manifest — skill cài từ trước khi có manifest không có hash → GIỮ + cảnh báo,
 *   không đoán. (3) `git log a..b` cần commit cũ còn trong lịch sử nguồn (rebase/force-push làm mất → báo).
 *   (4) `permissions.deny` chỉ chặn Read/Grep/Glob và lệnh file Bash Claude Code NHẬN RA (cat/head/tail/sed, redirect) —
 *   `grep -r` hay subprocess tự đọc thì không; phủ định `!` chỉ khoét luật CÙNG file settings đứng trước nó. `${VAR:-.}` cần
 *   shell POSIX (Claude Code chạy lệnh hook qua `sh -c`; Windows qua Git Bash). (5) disableAllHooks/ba-hooks.json chỉ báo.
 *   (6) Giấy phép: `LICENSE` + `THIRD_PARTY_NOTICES.md` của nguồn chép NGUYÊN VĂN vào `.claude/BA-TOOLKIT-LICENSE` và
 *   `.claude/BA-TOOLKIT-THIRD_PARTY_NOTICES.md` (cạnh `.claude/skills/` — mã chúng phủ), có trong manifest; nguồn thiếu → in "bỏ qua".
 *   Không kiểm nội dung giấy phép; dự án đích tự phân phối lại toolkit thì tự giữ hai file này. (7) Di trú file DỜI GIỮA SKILL
 *   (bảng DỜI_FILE): chỉ xoá bản cũ khi bản mới vừa cài/khớp VÀ bản cũ trùng hash manifest cũ — không có hash (cài trước khi có
 *   manifest) hay đã sửa cục bộ → GIỮ + cảnh báo.
 */

'use strict';

if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

// ─── Resolve nguồn / đích ─────────────────────────────────────────────────────
// Có >1 skill ba-* (ngoài chính ba-export) thì coi như repo BA toolkit thật —
// NHƯNG điều kiện đó ĐÚNG CẢ VỚI dự án tiêu dùng (nó cũng có đầy skill ba-* sau khi cài).
// Phân biệt bằng `example/docs/00-tracking.md` (canon `export.srcMarker`, lint 39): bộ fixture
// end-to-end này CHỈ có ở repo toolkit gốc — install.js không bao giờ copy `example/` sang đích.
// (Trước 20/09/2026 dấu hiệu là thư mục `explain-skills/`; sau khi nó đổi tên thành `explain/` —
// đúng tên mà đích cũng nhận — dấu hiệu đó nhận nhầm mọi dự án tiêu dùng là repo nguồn.)
// Thiếu dấu hiệu này mà vẫn nhận là nguồn → chạy `--check` trong dự án tiêu dùng sẽ
// tự trỏ vào chính nó và chết ở guard "đích trùng nguồn". (Cùng dấu hiệu mà hook-lint.js
// dùng để tự tắt nhánh lint-skill ở dự án tiêu dùng.)
const hasBaSkills = (root) => {
  const dir = path.join(root, '.claude', 'skills');
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name.startsWith('ba-') && e.name !== 'ba-export')
    .length > 0;
};
const looksLikeToolkit = (root) =>
  hasBaSkills(root) && fs.existsSync(path.join(root, 'example', 'docs', '00-tracking.md'));

// __dirname = <repo>/.claude/skills/ba-export/scripts  →  repo root = lùi 4 cấp.
// Khi ba-export nằm ở global (~/.claude/skills/ba-export) thì lùi 3 cấp ra HOME,
// không phải repo toolkit → fallback đọc 'ba-source.txt' (ghi lúc cài global).
const DIRNAME_SRC = path.resolve(__dirname, '..', '..', '..', '..');
const SOURCE_FILE = path.join(__dirname, 'ba-source.txt');
let recordedSrc = null;
if (fs.existsSync(SOURCE_FILE)) {
  recordedSrc = path.resolve(fs.readFileSync(SOURCE_FILE, 'utf8').trim());
}
// Ưu tiên: repo cạnh script (chạy trong repo) → đường dẫn đã ghi (chạy global).
const DEFAULT_SRC = looksLikeToolkit(DIRNAME_SRC)
  ? DIRNAME_SRC
  : (recordedSrc || DIRNAME_SRC);

// Chạy từ bản GLOBAL (~/.claude) → tự đối chiếu với install.js trong repo nguồn:
// bản global là bản COPY, sửa ở repo không tự lan sang — lệch thì nhắc cập nhật ngay.
if (!looksLikeToolkit(DIRNAME_SRC) && recordedSrc) {
  const srcInstall = path.join(recordedSrc, '.claude', 'skills', 'ba-export', 'scripts', 'install.js');   // steal B18: thiếu 'scripts' từ di trú 04/09
  try {
    if (fs.existsSync(srcInstall) && fs.readFileSync(srcInstall, 'utf8') !== fs.readFileSync(__filename, 'utf8')) {
      console.warn(`⚠️  install.js bản GLOBAL đang chạy KHÁC bản trong repo nguồn (${recordedSrc}).`);
      console.warn(`   Cập nhật rồi chạy lại:  cp "${srcInstall}" "${__filename}"\n`);
    }
  } catch { /* không đọc được thì thôi — không chặn cài */ }
}

const argv = process.argv.slice(2);
const optVal = (name) => {
  const i = argv.indexOf(name);
  return i !== -1 ? argv[i + 1] : null;
};
const checkOnly = argv.includes('--check');
const dryRun = argv.includes('--dry') || checkOnly;  // --check không bao giờ ghi
const force = argv.includes('--force');
const prune = argv.includes('--prune');
const noClaude = argv.includes('--no-claude');   // bỏ qua bước ghi directive vào CLAUDE.md đích
const allowDirty = argv.includes('--allow-dirty');
const allowUnsafe = argv.includes('--allow-unsafe');
const destRoot = path.resolve(optVal('--to') || process.cwd());
const scopeArg = optVal('--scope');
if (scopeArg && !['docs', 'full'].includes(scopeArg)) {
  console.error(`Error: --scope ${scopeArg} — chỉ nhận docs | full.`);
  process.exit(2);
}

// ─── Manifest ở đích ──────────────────────────────────────────────────────────
// ─── Cổng an toàn cho mọi lệnh xoá (steal B17) ────────────────────────────────
// Script này xoá 4 chỗ: skill thừa (--prune), file tên cũ khi di trú, companion đã dời sang
// scripts|references|assets, và folder explain tên cũ. Ba trong bốn chỗ lấy đường dẫn TỪ MANIFEST
// hoặc từ tên thư mục ở đích — dữ liệu ngoài, không phải hằng trong code. Manifest sửa tay (hoặc
// hỏng) mà có khoá kiểu `../../thứ-gì-đó` là `rmSync` chạy NGOÀI thư mục đích. Chưa xảy ra; giá
// của việc chặn là ba dòng, giá của việc không chặn là xoá file của người ta.
const trongĐích = (p2) => {
  const abs = path.resolve(destRoot, p2);
  const rel = path.relative(destRoot, abs);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
};
const xoáAnToàn = (p2, opts) => {
  if (!trongĐích(p2)) { console.error(`  ⛔ BỎ QUA lệnh xoá ra ngoài thư mục đích: ${p2}`); return false; }
  fs.rmSync(path.resolve(destRoot, p2), Object.assign({ force: true }, opts));
  return true;
};

// ─── Ghi an toàn: tmp + rename, bản trước giữ ở `.bak` ────────────────────────
// settings.json, CLAUDE.md và manifest là ba file của NGƯỜI DÙNG mà script sửa tại chỗ. writeFileSync
// thẳng mà bị ngắt giữa chừng (Ctrl-C, hết đĩa, iCloud khoá file) là để lại file cụt: settings.json cụt
// thì Claude Code không nạp hook, CLAUDE.md cụt thì mất nội dung người ta tự viết. Rename trong cùng thư
// mục là nguyên tử trên cùng filesystem; `.bak` là đường lui khi nội dung MỚI sai (chứ không phải cụt).
const ghiAnToàn = (abs, content, bak = true) => {
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const tạm = `${abs}.tmp-${process.pid}`;
  try {
    if (bak && fs.existsSync(abs)) fs.copyFileSync(abs, abs + '.bak');
    fs.writeFileSync(tạm, content, 'utf8');
    fs.renameSync(tạm, abs);
  } catch (e) {
    try { fs.rmSync(tạm, { force: true }); } catch { /* dọn tạm hỏng thì thôi */ }
    throw e;
  }
};

const MANIFEST_REL = path.join('.claude', 'ba-toolkit.json');
const manifestPath = path.join(destRoot, MANIFEST_REL);
/** @type {{schema?:number, source?:{path?:string,git?:object}, files?:Record<string,string>}} */
let manifest = {};
if (fs.existsSync(manifestPath)) {
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
  catch { console.warn(`⚠️  ${MANIFEST_REL} hỏng JSON — bỏ qua, sẽ ghi lại bản mới.`); }
}
const prevFiles = (manifest && manifest.files) || {};
// Phạm vi: cờ → manifest (đã ghi nhớ từ lần cài trước) → full. Ghi nhớ là CỐ Ý: dự án chỉ-tài-liệu
// chạy `ba-export update` mà bị cài lại 20 skill dev là đúng thứ --scope docs sinh ra để tránh.
const scope = scopeArg || (manifest.scope === 'docs' ? 'docs' : 'full');
const docsOnly = scope === 'docs';
// Hồ sơ cài (M6): cờ → manifest → (đích đã có manifest mà chưa có trường = cài trước M6 = full) → core cho lần cài đầu.
const profileArg = optVal('--profile') || (argv.includes('--mini') ? 'mini' : null);
if (profileArg && !['core', 'mini', 'full'].includes(profileArg)) { console.error(`Error: --profile ${profileArg} — chỉ nhận core | mini | full.`); process.exit(2); }
const lầnĐầu = !fs.existsSync(manifestPath);
const installProfile = profileArg || manifest.installProfile || (lầnĐầu ? 'core' : 'full');
const devArg = argv.includes('--dev') ? true : argv.includes('--no-dev') ? false : null;
if (devArg && docsOnly) { console.error('Error: --dev cùng --scope docs — phạm vi docs là dự án KHÔNG viết code, bộ dev vô nghĩa. Bỏ một trong hai.'); process.exit(2); }
const withDev = installProfile === 'full' ? !docsOnly : devArg !== null ? devArg : !!manifest.dev;

// Nguồn: --from → manifest của đích (chạy từ dự án tiêu dùng) → repo cạnh script → ba-source.txt
const srcRoot = path.resolve(
  optVal('--from') ||
  (manifest.source && manifest.source.path && looksLikeToolkit(path.resolve(manifest.source.path))
    ? manifest.source.path
    : DEFAULT_SRC),
);

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
const shaFile = (p) => { try { return sha(fs.readFileSync(p)); } catch { return null; } };

/** Thông tin git của nguồn — để biết đích đang bám commit nào. Không phải git repo thì bỏ qua. */
function gitInfo(root) {
  const run = (args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try {
    return {
      remote: (() => { try { return run(['config', '--get', 'remote.origin.url']); } catch { return null; } })(),
      branch: run(['rev-parse', '--abbrev-ref', 'HEAD']),
      commit: run(['rev-parse', '--short', 'HEAD']),
      // dirty theo PHẦN_COPY như lệnh chặn — `workshop/` hay spec nháp untracked ngoài phần copy không làm bản cài sai,
      // nên không được in "(nguồn có thay đổi chưa commit)" (dự án helpdesk 24/09: báo oan khi chỉ có workshop/ untracked).
      dirty: (dirtyPaths(root) || []).length > 0,
    };
  } catch { return null; }
}

// Chỉ những đường dẫn install.js COPY mới quyết định "nguồn dirty" — một spec nháp chưa commit trong
// docs/superpowers/ không làm bản cài sai, còn một SKILL.md đang sửa dở thì có.
const PHẦN_COPY = ['.claude/skills', '.claude/agents', 'explain', 'README.md', 'site/huong-dan.md', 'example/GUIDELINE.md'];
function dirtyPaths(root) {
  try {
    const out = execFileSync('git', ['-C', root, 'status', '--porcelain', '--', ...PHẦN_COPY], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    // `R  cũ -> mới` (git mv chưa commit): cả hai đường dẫn đều dirty — đường cũ có ở commit mà vắng ở cây làm việc.
    return out.split('\n').filter(Boolean).flatMap((l) => l.slice(3).split(' -> '));
  } catch { return null; } // không phải git repo → không biết, không chặn
}
const gitOut = (root, args) => { try { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } };

// Gom kết quả xử lý từng file để tổng kết + ghi manifest
const nextFiles = {};                       // rel → hash nội dung ĐÍCH sau lần chạy này
const changed = [];                         // file mới hoặc đổi ở nguồn → sẽ ghi
const keptLocal = [];                       // file sửa cục bộ → GIỮ NGUYÊN (chính sách đã chốt)
const conflicts = [];                       // sửa cục bộ VÀ nguồn cũng đổi

/**
 * Ghi một file từ nguồn sang đích theo chính sách "giữ bản cục bộ, chỉ cảnh báo".
 * @param rel  đường dẫn tương đối tính từ gốc dự án đích (khoá trong manifest)
 * @param content nội dung sẽ ghi (đã kèm banner nếu là file hướng dẫn)
 */
function writeTracked(rel, content) {
  const absDest = path.join(destRoot, rel);
  const newHash = sha(content);
  const curHash = shaFile(absDest);
  const baseHash = prevFiles[rel] || null;

  const locallyEdited = curHash !== null && baseHash !== null && curHash !== baseHash;
  const srcChanged = baseHash === null ? curHash !== newHash : newHash !== baseHash;

  // Byte đích TRÙNG nguồn → không có gì để giữ, kể cả khi manifest lệch (cài bị ngắt giữa chừng, manifest chỉ
  // ghi ở cuối). Trước 15/09 (steal B1) nhánh `kept` chạy trước → `--check` in "✅ không có gì mới" + "‼️ xung đột"
  // cùng lúc và lặp mãi, vì mốc manifest được ghi hash nguồn nhưng chỉ khi update thật.
  if (curHash === newHash) { nextFiles[rel] = newHash; return 'same'; }

  if (locallyEdited && !force) {
    // Giữ nguyên bản cục bộ — NHƯNG mốc ghi vào manifest phải là hash BẢN NGUỒN (newHash),
    // không phải hash bản cục bộ. Ghi hash cục bộ = coi bản sửa là "sạch" ⇒ lần chạy sau
    // không còn nhận ra file đã bị sửa và cảnh báo im lặng biến mất — đúng thứ nguy hiểm
    // nhất của chính sách "giữ bản cục bộ". Ghi mốc nguồn thì cảnh báo lặp lại tới khi xử lý.
    nextFiles[rel] = newHash;
    (srcChanged ? conflicts : keptLocal).push(rel);
    return 'kept';
  }

  if (!dryRun) {
    fs.mkdirSync(path.dirname(absDest), { recursive: true });
    fs.writeFileSync(absDest, content);
  }
  nextFiles[rel] = newHash;
  changed.push({ rel, kind: curHash === null ? 'mới' : (locallyEdited ? 'ghi đè (--force)' : 'cập nhật') });
  return 'written';
}

/** Duyệt đệ quy mọi file trong một thư mục nguồn, trả về danh sách đường dẫn tương đối. */
function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue;   // engine Playwright cài tại chỗ ở đích
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, base, out);
    else out.push(path.relative(base, abs));
  }
  return out;
}

// ─── Validate ─────────────────────────────────────────────────────────────────
const skillsSrc = path.join(srcRoot, '.claude', 'skills');
if (!fs.existsSync(skillsSrc) || !looksLikeToolkit(srcRoot)) {
  if (hasBaSkills(srcRoot)) {
    // Có đủ skill ba-* nhưng thiếu `example/` → đây là một dự án ĐANG DÙNG toolkit,
    // không phải repo nguồn. Xảy ra khi chạy từ dự án tiêu dùng mà chưa có manifest
    // (vd bản cài từ trước khi có tính năng manifest).
    console.error(`Error: "${srcRoot}" trông như một dự án ĐANG DÙNG toolkit, không phải repo nguồn.`);
    console.error(`Chưa có ${MANIFEST_REL} nên script không biết repo toolkit nằm ở đâu.`);
    console.error(`Chạy MỘT lần kèm --from để tạo dấu vết, từ lần sau không cần nữa:`);
    console.error(`  node "${__filename}" --from <đường-dẫn-repo-BA_toolkit>`);
  } else {
    console.error(`Error: nguồn không phải repo BA toolkit (thiếu skill ba-* hoặc example/docs/00-tracking.md): ${srcRoot}`);
    if (recordedSrc) console.error(`Đã thử 'ba-source.txt' = ${recordedSrc} nhưng không hợp lệ.`);
    console.error(`Dùng --from <đường-dẫn-repo-BA_toolkit> để chỉ định nguồn.`);
  }
  process.exit(1);
}
if (srcRoot === destRoot) {
  console.error(`Error: đích trùng nguồn (${destRoot}) — không tự cài đè chính mình.`);
  console.error(`Hãy chạy từ trong dự án đích, hoặc dùng --to <path khác>.`);
  process.exit(1);
}
// Nguồn DIRTY: bản cài sẽ mang skill đang sửa dở — thứ không commit nào ghi lại, manifest trỏ tới một
// commit KHÔNG chứa nó, và lần update sau không so được. Chặn khi đích là dự án thật (có .git).
const nguồnDirty = dirtyPaths(srcRoot) || [];
if (nguồnDirty.length && !dryRun && !allowDirty && fs.existsSync(path.join(destRoot, '.git'))) {
  console.error(`Error: nguồn còn ${nguồnDirty.length} thay đổi CHƯA COMMIT trong phần sẽ copy — từ chối cài vào dự án thật.`);
  for (const f of nguồnDirty.slice(0, 10)) console.error(`   ${f}`);
  if (nguồnDirty.length > 10) console.error(`   … và ${nguồnDirty.length - 10} file nữa`);
  console.error('Commit ở nguồn trước, hoặc chạy lại kèm --allow-dirty (manifest sẽ ghi lại nguồn dirty).');
  process.exit(1);
}
if (nguồnDirty.length) console.log(`⚠️  Nguồn còn ${nguồnDirty.length} thay đổi chưa commit trong phần sẽ copy${allowDirty ? ' (--allow-dirty)' : ''} — bản cài sẽ không khớp commit nào.\n`);

// ─── Quét bảo mật NGUỒN trước khi chép (đợt 7, 25/09/2026) ───────────────────────
// Thứ được chép không chỉ là tài liệu: 3 hook gắn vào settings.json đích chạy ở MỌI Read/Edit/Stop, và agent đích đọc
// mọi SKILL.md như chỉ thị. `dev-*` clone từ ngoài, `steal` kéo nội dung repo lạ; upstream-diff chỉ so hash. Nên quét
// nội dung nguồn (injection, bidi, tải-rồi-chạy, gọi mạng, đọc bí mật…) và DỪNG khi có 🔴 chưa duyệt — ngoại lệ hợp
// lệ nằm trong ba-toolkit/references/security-allowlist.json, có người duyệt và hạn. Scanner lấy của NGUỒN trước
// (hook-review 07/10/2026): `ba-export check/update` chạy install.js CÀI Ở ĐÍCH, và scan-skills.js cạnh nó nằm trong
// `.claude/skills/` của đích — agent ghi được, sửa cho luôn sạch là mọi lần cập nhật sau mù. Bản nguồn là bản kho git
// giữ. Nguồn đời cũ không có scanner → lấy bản cạnh install.js; không có cả hai → cảnh báo, không chặn.
const quétNguồn = (() => {
  const js = [path.join(skillsSrc, 'ba-toolkit', 'scripts', 'scan-skills.js'),
    path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'scan-skills.js')].find((p2) => fs.existsSync(p2));
  if (!js) return { thiếu: true };
  const r = spawnSync(process.execPath, [js, path.join(srcRoot, '.claude'), '--json'], { encoding: 'utf8', maxBuffer: 1e8 });
  try { return Object.assign({ status: r.status }, JSON.parse(r.stdout)); }
  catch { return { lỗi: ((r.stderr || r.stdout || '').trim().split('\n')[0] || `exit ${r.status}`) }; }
})();
const tómTắtQuét = quétNguồn.thiếu ? 'không có scan-skills.js (nguồn đời cũ) — CHƯA quét'
  : quétNguồn.lỗi ? `LỖI hạ tầng — ${quétNguồn.lỗi}`
  : `${quétNguồn.soFile} file · 🔴 ${quétNguồn.chuaDuyet.do} chưa duyệt · 🟡 ${quétNguồn.chuaDuyet.vang} · đã duyệt ${quétNguồn.daDuyet}${(quétNguồn.canhBao || []).length ? ` · ${quétNguồn.canhBao.length} cảnh báo allowlist` : ''}`;
const quétĐỏ = !quétNguồn.thiếu && (quétNguồn.lỗi || quétNguồn.chuaDuyet.do > 0);
if (quétĐỏ || quétNguồn.thiếu || (quétNguồn.canhBao || []).length) {
  const inRa = quétĐỏ && !dryRun && !allowUnsafe ? console.error : console.log;
  inRa(`${quétĐỏ ? '⛔' : '⚠️ '} Quét bảo mật nguồn: ${tómTắtQuét}`);
  for (const h of (quétNguồn.hits || []).filter((x) => x.muc === '🔴').slice(0, 15)) inRa(`   🔴 ${h.file}:${h.dong} · ${h.loai} · ${h.trich}`);
  for (const c of (quétNguồn.canhBao || []).slice(0, 10)) inRa(`   ⚠️  ${c}`);
  if (quétĐỏ && !dryRun && !allowUnsafe) {
    console.error('Từ chối cài: skill/hook từ nguồn này sẽ chạy trong dự án đích. Soi từng hit ở nguồn (node .claude/skills/ba-toolkit/scripts/scan-skills.js .claude);');
    console.error('hợp lệ → thêm mục có hạn vào ba-toolkit/references/security-allowlist.json; đã soi và chấp nhận rủi ro → chạy lại kèm --allow-unsafe.');
    process.exit(1);
  }
  if (quétĐỏ && allowUnsafe && !dryRun) console.log('   (--allow-unsafe — vẫn cài; manifest ghi lại kết quả quét)');
  console.log('');
}

// ─── Banner cho file hướng dẫn ────────────────────────────────────────────────
const IMPORT_BANNER =
  '> 📦 File này được import từ **BA Toolkit**. Thư mục `example/` KHÔNG được copy — ' +
  'các liên kết `example/docs/...` chỉ có ở repo BA_toolkit gốc.\n\n';

// ─── Copy ─────────────────────────────────────────────────────────────────────
const tag = dryRun ? '[dry] ' : '';
console.log(`${tag}Nguồn: ${srcRoot}`);
console.log(`${tag}Đích:  ${destRoot}\n`);

// 1) Skills ba-* + dev-* (framework dev clone từ superpowers, đi kèm toolkit)
// Hồ sơ cài (installProfile, tính ở đầu file): core/mini chỉ cài bộ canon trong conv-registry.md — mỗi mô tả skill nạp
// MỖI phiên là chi phí thật, và ít skill thì agent chọn đúng hơn. ba-toolkit LUÔN được cài (conventions/profile/lint).
// Registry máy-đọc nằm ở ba-toolkit/references/ (di trú 04/09/2026). Đọc sai chỗ thì hàm trả []
// và --mini/--scope chết ở guard dưới — đã xảy ra thật: --mini exit 2 vô điều kiện suốt 11 ngày.
// Đọc ĐÚNG cách lint.js đọc (parseRegistry): chỉ khối ```registry mới là canon máy-đọc — một dòng
// `khoá = …` nằm trong văn giải thích ngoài khối không được tính. Nguồn đời cũ chưa có khối → dò dòng.
const REG = (() => {
  let txt = '';
  try { txt = fs.readFileSync(path.join(skillsSrc, 'ba-toolkit', 'references', 'conv-registry.md'), 'utf8'); } catch { return {}; }
  const m = txt.match(/```registry\n([\s\S]*?)```/);
  const reg = {};
  for (const line of (m ? m[1] : txt).split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf(' = ');
    if (eq < 0 || !/^[a-z][\w.]*$/.test(t.slice(0, eq))) continue;
    reg[t.slice(0, eq).trim()] = t.slice(eq + 3).trim().split(/\s+/).filter(Boolean);
  }
  return reg;
})();
const regKey = (key) => REG[key] || [];
const miniCanon = regKey('profile.mini.skills');
const coreCanon = regKey('profile.core.skills');
const devPack = regKey('profile.dev.skills');
const devCanon = regKey('scope.dev.skills');
// Nguồn cũ chưa có khoá bộ cài: người dùng KHÔNG gõ hồ sơ → cài đủ như trước M6 (đừng chặn lệnh cài từ nguồn đời cũ);
// gõ rõ --profile core|mini mà khoá vắng → lỗi, không đoán bừa bộ skill.
let installProfileThật = installProfile;
if (installProfile !== 'full' && !(installProfile === 'mini' ? miniCanon : coreCanon).length) {
  if (profileArg) { console.error(`Error: --profile ${installProfile} nhưng conv-registry.md không có khóa profile.${installProfile}.skills — không đoán bừa bộ skill. Dùng --profile full.`); process.exit(2); }
  installProfileThật = 'full';
}
if (docsOnly && !devCanon.length) {
  console.error('Error: --scope docs nhưng conv-registry.md không có khóa scope.dev.skills — không đoán bừa bộ skill dev.');
  process.exit(2);
}
let skillNames = fs.readdirSync(skillsSrc, { withFileTypes: true })
  .filter(e => e.isDirectory() && /^(ba|dev|ac)-/.test(e.name))
  .map(e => e.name)
  .sort();
const ngoàiHồSơĐãCó = [];
if (installProfileThật !== 'full') {
  // Bộ dev đi NGUYÊN BỘ hay không đi: dev-run trỏ tới 8 skill dev-* khác — cài lẻ là lối đi cụt (lint 13).
  const keep = new Set([...(installProfile === 'mini' ? miniCanon : coreCanon), 'ba-toolkit',
    ...(withDev ? [...devPack, ...skillNames.filter((n) => n.startsWith('dev-'))] : [])]);
  const bỏ = [];
  skillNames = skillNames.filter((n) => {
    if (keep.has(n)) return true;
    // Đích đã có (cài full trước đây, hay người dùng tự cài thêm) → GIỮ + cập nhật; chỉ --prune mới gỡ
    if (!prune && fs.existsSync(path.join(destRoot, '.claude', 'skills', n, 'SKILL.md'))) { ngoàiHồSơĐãCó.push(n); return true; }
    bỏ.push(n); return false;
  });
  const thiếu = [...keep].filter(n => !fs.existsSync(path.join(skillsSrc, n)));
  if (thiếu.length) console.log(`${tag}⚠️  hồ sơ ${installProfile} khai skill không có ở nguồn: ${thiếu.join(', ')}`);
  // Nói ra cái không cài (conv-gates.md → "Hồ sơ dự án", luật 6): im lặng cắt thì người dùng tưởng bộ skill thiếu chức năng.
  console.log(`${tag}⚙️ bộ ${installProfile}${withDev ? ' + dev' : ''}: cài ${skillNames.length} skill, KHÔNG cài ${bỏ.length}${ngoàiHồSơĐãCó.length ? ` · giữ ${ngoàiHồSơĐãCó.length} skill ngoài bộ mà dự án đã có (${ngoàiHồSơĐãCó.join(', ')})` : ''}`);
  if (!withDev && !docsOnly) console.log(`${tag}   Dự án sẽ viết code (lập kế hoạch build, dev, kiểm chứng): chạy lại kèm --dev.`);
  console.log(`${tag}   Cần các skill mở rộng (khám phá, kiến trúc, API, prototype, nghiệm thu…): chạy lại kèm --profile full.\n`);
}
if (docsOnly) {
  // Phạm vi docs: dự án dừng ở tài liệu BA. Bộ dev (`scope.dev.skills` + mọi `dev-*`/`ac-*`) không cài —
  // 20 mô tả skill vô dụng nạp mỗi phiên làm agent chọn nhầm ba-build/dev-run cho một dự án không ai
  // viết code. Khác --mini, phạm vi được GHI NHỚ trong manifest (xem `scope` ở phần manifest).
  const devSet = new Set([...devCanon, ...skillNames.filter(n => /^(dev|ac)-/.test(n))]);
  const bỏ = skillNames.filter(n => devSet.has(n));
  skillNames = skillNames.filter(n => !devSet.has(n));
  const thiếu = devCanon.filter(n => !fs.existsSync(path.join(skillsSrc, n)));
  if (thiếu.length) console.log(`${tag}⚠️  scope.dev.skills khai skill không có ở nguồn: ${thiếu.join(', ')}`);
  console.log(`${tag}⚙️ scope docs: cài ${skillNames.length} skill, BỎ ${bỏ.length} skill dev — ${bỏ.join(', ')}`);
  console.log(`${tag}   Đổi ý (dự án sẽ dev): chạy lại kèm \`--scope full\`. Khai thêm \`Phạm vi: \`docs\`\` ở đầu docs/00-tracking.md để ba-next/ba-review/hook cùng nhận ra.\n`);
}
// Skill THỬ NGHIỆM (canon `skills.experimental`, gói D 25/09/2026): chưa từng chạy thật trên dự án nào
// (cả 3 dự án tiêu dùng không có dấu vết). Mặc định KHÔNG cài — mỗi mô tả skill nạp mỗi phiên là chi phí
// thật và là thêm một cửa để agent chọn nhầm. `--with-experimental` cài. Đích ĐÃ CÓ skill thử nghiệm (cài
// trước gói D, hoặc cài bằng cờ) → GIỮ và cập nhật như thường: người đã chọn dùng, update không tự gỡ.
// Khoá chưa có trong registry (nguồn cũ) → không lọc gì = hành vi cũ. Không ghi nhớ trong manifest như
// --scope: "đích đã có thì giữ" theo từng skill đã đủ; chỉ skill thử nghiệm MỚI thêm về sau cần cờ lại.
const withExp = argv.includes('--with-experimental');
const expCanon = regKey('skills.experimental');
const expSet = new Set(expCanon);
const expBỏ = [], expGiữ = [], expCài = [];
if (expCanon.length) {
  skillNames = skillNames.filter((n) => {
    if (!expSet.has(n)) return true;
    if (fs.existsSync(path.join(destRoot, '.claude', 'skills', n))) { expGiữ.push(n); return true; }
    if (withExp) { expCài.push(n); return true; }
    expBỏ.push(n); return false;
  });
  if (expBỏ.length) {
    console.log(`${tag}⚗️ thử nghiệm: KHÔNG cài ${expBỏ.length} skill chưa từng chạy thật — ${expBỏ.join(', ')}`);
    console.log(`${tag}   Muốn dùng: chạy lại kèm \`--with-experimental\`.\n`);
  }
  if (expCài.length) console.log(`${tag}⚗️ thử nghiệm: cài ${expCài.length} skill theo --with-experimental — ${expCài.join(', ')}\n`);
  if (expGiữ.length) console.log(`${tag}⚗️ thử nghiệm: đích đã có ${expGiữ.join(', ')} — GIỮ và cập nhật (không tự gỡ).\n`);
} else if (withExp) {
  console.log(`${tag}⚠️  --with-experimental nhưng conv-registry.md chưa có khoá skills.experimental — cài như cũ (mọi skill).\n`);
}
// Agent chỉ phục vụ một skill thử nghiệm (canon `agents.experimental`, dạng `agent:skill`) đi theo skill đó:
// skill không cài thì agent không cài — agent trỏ vào reference của skill vắng là lối đi cụt.
const expAgentOwner = Object.fromEntries(regKey('agents.experimental').map((p2) => p2.split(':')).filter(([a, s]) => a && s));
// M6: mọi agent có skill chủ (canon agents.owner, `a|b` = nhiều chủ) — không chủ nào được cài thì không cài agent. Khoá vắng (nguồn cũ) → như cũ.
const agentOwner = Object.fromEntries(regKey('agents.owner').map((p2) => p2.split(':')).filter(([a, s]) => a && s).map(([a, s]) => [a, s.split('|')]));
const skillSẽCài = new Set(skillNames);

const skillsDest = path.join(destRoot, '.claude', 'skills');
if (!dryRun) fs.mkdirSync(skillsDest, { recursive: true });

for (const name of skillNames) {
  const dirSrc = path.join(skillsSrc, name);
  let w = 0, k = 0, s = 0;
  for (const relInSkill of walk(dirSrc)) {
    const rel = path.join('.claude', 'skills', name, relInSkill);
    const r = writeTracked(rel, fs.readFileSync(path.join(dirSrc, relInSkill)));
    if (r === 'written') w++; else if (r === 'kept') k++; else s++;
  }
  const note = w || k
    ? ` (${[w && `${w} file cập nhật`, k && `${k} GIỮ bản cục bộ`].filter(Boolean).join(' · ')})`
    : ' (không đổi)';
  console.log(`  ${tag}skill  ${name}${note}`);
}

// 1a) Copy agent review ba-* (vd ba-diagram-reviewer). Chỉ file ba-*.md — KHÔNG đụng agent
//     riêng của dự án đích. Ghi đè bản ba-* cũ để cập nhật.
const agentsSrc = path.join(srcRoot, '.claude', 'agents');
let agentCount = 0;
if (fs.existsSync(agentsSrc)) {
  const agentFiles = fs.readdirSync(agentsSrc)
    // ba-* (reviewer tài liệu) + ac-* (đội code). Phạm vi docs không cài ac-* — dogfood 15/09/2026: verifier
    // chạy ở dự án đích không thấy file agent của mình vì filter cũ chỉ lấy ba-*.
    .filter(f => /^(ba|ac)-.*\.md$/.test(f) && !(docsOnly && f.startsWith('ac-')))
    .filter(f => { const chủ = expAgentOwner[f.replace(/\.md$/, '')]; return !chủ || skillSẽCài.has(chủ); })
    .filter(f => { const chủ = agentOwner[f.replace(/\.md$/, '')]; return !chủ || chủ.some((c) => skillSẽCài.has(c)); })
    .sort();
  if (agentFiles.length) {
    for (const f of agentFiles) {
      const r = writeTracked(path.join('.claude', 'agents', f), fs.readFileSync(path.join(agentsSrc, f)));
      console.log(`  ${tag}agent  ${f}${r === 'kept' ? ' (GIỮ bản cục bộ)' : r === 'same' ? ' (không đổi)' : ''}`);
      agentCount++;
    }
  }
}

// 1b) Dọn skill ba-*/dev-* thừa ở đích (đã đổi tên / gỡ khỏi nguồn)
const srcSet = new Set(skillNames);
// Skill ĐÃ GỘP (canon `deprecated.skills`, dạng `cũ:mới`): đích còn bản cũ thì agent thấy HAI mô tả gần
// giống nhau và chọn bừa — đúng lý do gộp. Không chờ --prune: update tự gỡ, NHƯNG chỉ khi mọi file của
// skill cũ còn đúng hash lúc cài (manifest). Có file sửa/thêm cục bộ → GIỮ + cảnh báo (--force mới gỡ).
const depPairs = regKey('deprecated.skills').map((p2) => p2.split(':')).filter(([o, n]) => o && n);
const depHere = [];
for (const [cũ, mới] of depPairs) {
  const d = path.join(skillsDest, cũ);
  if (srcSet.has(cũ) || !fs.existsSync(d) || !fs.statSync(d).isDirectory()) continue;
  const tệp = walk(d).map((r) => path.join('.claude', 'skills', cũ, r));
  const sửa = tệp.filter((rel) => !prevFiles[rel] || shaFile(path.join(destRoot, rel)) !== prevFiles[rel]);
  const gỡ = !sửa.length || force;
  depHere.push({ cũ, mới, sửa, gỡ });
}
const depNames = new Set(depHere.map((x) => x.cũ));
if (depHere.length) {
  console.log('');
  for (const x of depHere) {
    if (x.gỡ && !dryRun) {
      xoáAnToàn(path.join('.claude', 'skills', x.cũ), { recursive: true });
      console.log(`  gỡ     ${x.cũ} → ${x.mới} (đã gộp — gỡ bản cũ${x.sửa.length ? ', --force bỏ qua sửa cục bộ' : ''})`);
    } else if (x.gỡ) {
      console.log(`  ${tag}gộp    ${x.cũ} → ${x.mới} (sẽ gỡ bản cũ khi cập nhật)`);
    } else {
      console.log(`  ${tag}⚠️ gộp  ${x.cũ} → ${x.mới} — GIỮ bản cũ: ${x.sửa.length} file sửa/thêm cục bộ (${x.sửa.slice(0, 3).map((r) => path.basename(r)).join(', ')}${x.sửa.length > 3 ? '…' : ''}). Chuyển phần sửa sang ${x.mới} rồi chạy lại kèm --force.`);
    }
  }
}
let staleNames = [];
if (fs.existsSync(skillsDest)) {
  staleNames = fs.readdirSync(skillsDest, { withFileTypes: true })
    .filter(e => e.isDirectory() && /^(ba|dev|ac)-/.test(e.name))
    .map(e => e.name)
    .filter(name => !srcSet.has(name) && !depNames.has(name))
    .sort();
}
if (staleNames.length) {
  console.log('');
  for (const name of staleNames) {
    if (prune && !dryRun) {
      xoáAnToàn(path.join(skillsDest, name), { recursive: true });
      console.log(`  ${tag}prune  ${name} (đã xoá — không còn ở nguồn)`);
    } else {
      console.log(`  ${tag}thừa   ${name} (có ở đích, không còn ở nguồn)`);
    }
  }
  if (!prune) {
    console.log(`  → Thêm --prune để xoá ${staleNames.length} skill thừa ở trên.${docsOnly ? ' (Phạm vi docs: skill dev cài từ trước cũng tính là thừa.)' : ''}`);
  }
}

// 2) File hướng dẫn (prepend banner)
const guides = [
  { src: 'README.md', dest: 'BA-TOOLKIT-README.md' },
  { src: path.join('site', 'huong-dan.md'), dest: 'BA-TOOLKIT-HUONG-DAN.md' },   // hướng dẫn sử dụng 8 mục (15/09/2026), cùng nguồn với site/
  { src: path.join('example', 'GUIDELINE.md'), dest: 'BA-TOOLKIT-GUIDELINE.md' },
];
let guideCount = 0;
for (const g of guides) {
  const s = path.join(srcRoot, g.src);
  if (!fs.existsSync(s)) {
    console.log(`  ${tag}(bỏ qua ${g.src} — không thấy)`);
    continue;
  }
  const r = writeTracked(g.dest, Buffer.from(IMPORT_BANNER + fs.readFileSync(s, 'utf8'), 'utf8'));
  console.log(`  ${tag}guide  ${g.dest}${r === 'kept' ? ' (GIỮ bản cục bộ)' : r === 'same' ? ' (không đổi)' : ''}`);
  guideCount++;
}

// 2b) Folder explain/ (hướng dẫn nghiệp vụ từng skill) → explain/.
//     Copy phẳng các .md, prepend banner như file hướng dẫn. Ghi đè để cập nhật.
const explainSrc = path.join(srcRoot, 'explain');
let explainCount = 0;
if (fs.existsSync(explainSrc)) {
  const explainFiles = fs.readdirSync(explainSrc).filter(f => f.endsWith('.md')).sort();
  if (explainFiles.length) {
    let ew = 0, ek = 0;
    for (const f of explainFiles) {
      const r = writeTracked(
        path.join('explain', f),
        Buffer.from(IMPORT_BANNER + fs.readFileSync(path.join(explainSrc, f), 'utf8'), 'utf8'),
      );
      if (r === 'written') ew++; else if (r === 'kept') ek++;
      explainCount++;
    }
    const en = ew || ek ? ` — ${[ew && `${ew} cập nhật`, ek && `${ek} GIỮ bản cục bộ`].filter(Boolean).join(' · ')}` : ' — không đổi';
    console.log(`  ${tag}explain  explain/ (${explainFiles.length} file)${en}`);
  }
} else {
  console.log(`  ${tag}(bỏ qua explain — không thấy)`);
}
// 2c) Di trú tên cũ: trước 20/09/2026 folder này được export thành `BA-TOOLKIT-EXPLAIN/`. Không xoá thì
//     dự án đích giữ hai bản, bản cũ đứng im và người đọc không biết bản nào là thật (đúng thứ vừa xảy ra
//     ở chính repo nguồn: một bản 04/09 nằm cạnh bản thật suốt 15 ngày). Chỉ xoá file DO TOOLKIT GHI
//     (có trong manifest cũ) — file lạ người ta tự thêm vào đó thì giữ lại cùng thư mục.
const explainCũ = path.join(destRoot, 'BA-TOOLKIT-EXPLAIN');
if (fs.existsSync(explainCũ)) {
  const củaToolkit = Object.keys(prevFiles).filter((r) => r.startsWith('BA-TOOLKIT-EXPLAIN/'));
  const lạ = fs.readdirSync(explainCũ).filter((f) => !củaToolkit.includes('BA-TOOLKIT-EXPLAIN/' + f));
  if (!dryRun) {
    for (const rel of củaToolkit) xoáAnToàn(rel);
    if (!lạ.length) xoáAnToàn(explainCũ, { recursive: true });
  }
  console.log(`  ${tag}di trú  BA-TOOLKIT-EXPLAIN/ → explain/ (xoá ${củaToolkit.length} file tên cũ${lạ.length ? `; GIỮ ${lạ.length} file lạ không do toolkit ghi` : ''})`);
}

// 2d) Giấy phép đi kèm mã (08/10/2026 — docs/decisions/32 M1/M2): MIT đòi giữ thông báo bản quyền trong MỌI bản sao; bản sao ở
//     đích là `.claude/skills/` (gồm superpowers clone, Mermaid vendor, icon Lucide). Chép NGUYÊN VĂN (không banner — văn bản giấy
//     phép không được sửa) vào `.claude/`, tiền tố BA-TOOLKIT- để không lẫn với giấy phép của chính dự án đích.
const GIẤY_PHÉP = [['LICENSE', path.join('.claude', 'BA-TOOLKIT-LICENSE')], ['THIRD_PARTY_NOTICES.md', path.join('.claude', 'BA-TOOLKIT-THIRD_PARTY_NOTICES.md')]];
for (const [src, dest] of GIẤY_PHÉP) {
  const s = path.join(srcRoot, src);
  if (!fs.existsSync(s)) { console.log(`  ${tag}(bỏ qua ${src} — nguồn không có)`); continue; }
  const r = writeTracked(dest, fs.readFileSync(s));
  console.log(`  ${tag}license  ${dest}${r === 'kept' ? ' (GIỮ bản cục bộ)' : r === 'same' ? ' (không đổi)' : ''}`);
}

// 3) Briefing "luôn nạp" vào CLAUDE.md của dự án đích (khối managed, idempotent).
//
//    VÌ SAO CẦN: ở dự án đích, agent chỉ tự động nạp (a) dòng `description` của từng skill
//    và (b) CLAUDE.md. `conventions.md` — nguồn sự thật cho MỌI luật xuyên skill (layout
//    folder, chuỗi ID, bổn phận cập nhật tracking, sổ CR/WI) — chỉ được đọc khi một skill
//    bảo nó đọc. Nghĩa là mọi lần agent sửa tài liệu mà KHÔNG chạy skill nào (rất phổ
//    biến: "thêm ràng buộc X vào srs màn Login") thì nó không biết luật nào cả: không cập
//    nhật 00-tracking.md, không mở CR khi đổi baseline, đặt tên folder/mã sai.
//    Khối này là bản tóm tắt tối thiểu để lấp đúng khoảng đó — KHÔNG chép cả conventions,
//    chỉ nêu luật hay bị vi phạm nhất + trỏ tới nguồn sự thật. Bỏ qua bằng --no-claude.
const CLAUDE_START = '<!-- BA-TOOLKIT:briefing (managed by ba-export — dung sua ben trong) -->';
const CLAUDE_END = '<!-- BA-TOOLKIT:briefing end -->';
// Marker đời trước (chỉ có luật sơ đồ). Bản cài cũ mang khối này; phải GỠ nó đi trước khi
// ghi khối mới, không thì dự án đích ôm cả hai (khối cũ thành mồ côi, không ai cập nhật).
const LEGACY_START = '<!-- BA-TOOLKIT:diagram-rule (managed by ba-export — dung sua ben trong) -->';
const LEGACY_END = '<!-- BA-TOOLKIT:diagram-rule end -->';

const CLAUDE_BLOCK = [
  CLAUDE_START,
  '## BA Toolkit — luật luôn áp (khối do `ba-export` quản lý)',
  '',
  docsOnly
    ? 'Dự án này có bộ **BA Toolkit** trong `.claude/skills/`: skill `ba-*` (phân tích nghiệp vụ). **Phạm vi `docs`** — dự án CHỈ làm tài liệu BA, không dev trong repo này: không có `plan.md`, không `ba-build`/`dev-run`/`ba-accept`. Tài liệu BA viết **tiếng Việt**, nằm trong `docs/`.'
    : 'Dự án này có bộ **BA Toolkit** trong `.claude/skills/`: skill `ba-*` (phân tích nghiệp vụ) + `dev-*` (kỷ luật code/QA). Tài liệu BA viết **tiếng Việt**, nằm trong `docs/`.',
  '',
  '**Nguồn sự thật cho mọi quy ước:** `.claude/skills/ba-toolkit/references/conventions.md` — ĐỌC file này trước khi tạo/sửa bất kỳ tài liệu nào trong `docs/`. Index pipeline: `.claude/skills/ba-toolkit/SKILL.md`.',
  '',
  ...(docsOnly ? [
    '### Vòng đời 3 giai đoạn (phạm vi `docs`)',
    '',
    '| GĐ | Việc | Orchestrator |',
    '|----|------|--------------|',
    '| 1 | Discovery — hiểu vấn đề, hiện trạng, người dùng | `ba-discover` |',
    '| 2 | Yêu cầu & giải pháp → đặc tả từng màn | `ba-init` |',
    '| 3 | Bàn giao tài liệu — gate tổng, RTM, (UAT), portal | `ba-review all` → `ba-trace` → `ba-portal` |',
    '',
    'Lõi GĐ2 chạy theo thứ tự: `ba-requirements` → `ba-functions` → `ba-screens` (sinh khung folder + `docs/00-tracking.md`) → mỗi màn `ba-screen-spec` → `ba-test` → `ba-html-design`. Gate `ba-review` ở mỗi breakpoint. **Không có bước `ba-build`** — màn "Hoàn thành" khi đủ bộ file tài liệu, cột `plan`/`dev` không tính.',
  ] : [
    '### Vòng đời 4 giai đoạn',
    '',
    '| GĐ | Việc | Orchestrator |',
    '|----|------|--------------|',
    '| 1 | Discovery — hiểu vấn đề, hiện trạng, người dùng | `ba-discover` |',
    '| 2 | Yêu cầu & giải pháp → kế hoạch build | `ba-init` |',
    '| 3 | Dev — code thật từ plan | `dev-run` |',
    '| 4 | Nghiệm thu & phát hành | `ba-accept` |',
    '',
    'Lõi GĐ2 chạy theo thứ tự: `ba-requirements` → `ba-functions` → `ba-screens` (sinh khung folder + `docs/00-tracking.md`) → mỗi màn `ba-screen-spec` → `ba-test` → `ba-html-design` → `ba-build` (plan.md). Gate `ba-review` ở mỗi breakpoint.',
  ]),
  '',
  '**Không chắc dự án đang ở bước nào → chạy `ba-next`** (nó quét `docs/` rồi đề xuất bước kế). Đừng đoán, đừng nhảy cóc.',
  '',
  '### Bổn phận khi động vào `docs/` — ÁP CẢ KHI KHÔNG CHẠY SKILL NÀO',
  '',
  '- Sửa/thêm tài liệu của một màn → **cập nhật ô tương ứng + cột "Cập nhật cuối" trong `docs/00-tracking.md`** (1 dòng = 1 màn hình).',
  '- Đổi thứ **đã chốt** (FR/F/S, business rule trong tài liệu đã duyệt) → **mở Change Request** bằng `ba-change-request` (sổ `docs/00-cr.md`) rồi mới sửa — không sửa lén baseline.',
  '- Việc dev mới / kỹ thuật / bug / spike (không đổi baseline) → `ba-task` (sổ `docs/00-backlog.md`).',
  '- Không tự chế số tài liệu mới ở cấp đầu `docs/` — bảng số là cố định, xem `conventions.md`.',
  '',
  '### Cổng phương án — TRÌNH PHƯƠNG ÁN TRƯỚC KHI GHI',
  '',
  'Sắp tạo/sửa **nhiều hơn 2 file** trong `docs/` (chạy orchestrator, đặc tả một màn, hay tự tay sửa loạt tài liệu): **đọc hết nguồn trước, rồi DỪNG trình phương án và chờ duyệt** — đừng vừa hiểu vừa ghi. Phương án gồm 6 phần: **Đã đọc** (file nào) · **Hiểu** (3–6 gạch đầu dòng) · **Sẽ làm** (bảng `bước · file TẠO/SỬA · điều kiện dừng`) · **Giả định** · **Câu hỏi chặn** · **Ngoài phạm vi**. Chỉ khi người dùng duyệt mới ghi file. Việc nhỏ (≤2 file) hoặc người dùng đã nói "chạy thẳng" → vẫn IN phương án rồi làm, không cần chờ. Chi tiết: `conventions.md` → "Cổng phương án".',
  '',
  '### Cấu trúc & mã',
  '',
  '- **`docs/Ho-so/`**: tài liệu KHÔNG thuộc đặc tả chính nằm ở đây (vision, personas, process, urd, brainstorm, glossary, stakeholders, roadmap, uat, traceability, gaps, portal.html, sitemap*, userguide/, releases/, meetings/, dev-notes). Gốc `docs/` chỉ giữ đặc tả (`01`,`02`,`03`,`05`,`06`,`07`,`10`,`11`,`12`, `Screen-spec/`) + `00-tracking.md` + ba sổ `00-cr`/`00-backlog`/`00-changelog`. **Tìm không thấy ở `Ho-so/` thì tìm ở gốc `docs/`** (dự án cài trước 13/08/2026 để phẳng) — đừng vội báo "chưa có tài liệu".',
  '- Folder màn: `docs/<Mã> - <Tên>` (vd `docs/S01 - Login`). Nhóm nhiều màn thì lồng `docs/<Nhóm>/<Mã> - <Tên>`; nhóm chỉ 1 màn thì để phẳng (không tạo `docs/Dashboard/Dashboard/`). Tên folder PascalCase không dấu — tên tiếng Việt để trong nội dung file.',
  '- Chuỗi truy vết: `BR → StR → FR/NFR → F → S → R-S → UC/US → TC`. Mã sinh ra phải bám đúng chuỗi này.',
  '',
  '### Kỷ luật ngữ cảnh — áp cho MỌI phiên và MỌI agent',
  '',
  'Chi phí phiên ≈ **số lượt × ngữ cảnh mỗi lượt** (đo 19/09/2026: nội dung tool cả phiên ~1,4 M token, lặp lại thành 3,8 TỶ cache-read — tiền ở **số lần nạp lại**, không ở MB). **(1)** Gộp tool độc lập vào **MỘT lượt** (hook `S8`). **(2)** Dò tìm/đọc ảnh → subagent ngữ cảnh trắng, trả về **chữ**. **(3)** Tài liệu lớn đọc bằng **lát** (`ledger.js get`, `ba-index/query.js get`, `sed -n`, `grep -n`), không Read trọn. **(4)** `--plain`, `--reporter=dot`, `| tail`. Đầy đủ: `conv-gates.md` → "Đội agent" luật 5.',
  '',
  '### Sơ đồ luồng',
  '',
  'Luồng có **≥2 vai trò/tác nhân** với bàn giao — nhất là luồng nghiệp vụ ở `docs/01-requirements.md` — **dùng Mermaid `swimlane-beta` (mỗi vai trò 1 lane), KHÔNG dùng `flowchart`** (flowchart giấu mất vai trò). `flowchart` chỉ cho luồng đúng 1 tác nhân. Cần Mermaid ≥ 11.16. Chi tiết: `conventions.md` → "Bộ chọn sơ đồ Mermaid".',
  '',
  '**Tiếng Việt trong sơ đồ PHẢI CÓ DẤU.** Mọi text người đọc thấy (nhãn node/cạnh, tên lane, tiêu đề, message) viết có dấu đầy đủ: `Đăng nhập`, KHÔNG `Dang nhap`. Chỉ **ID node** để ASCII — `S01[Đăng nhập]` ✅, `S01[Dang nhap]` ❌. Diacritics không bao giờ làm vỡ Mermaid (vỡ là do ký tự đặc biệt như `( ) " [ ]`); bỏ dấu "cho an toàn" là chữa sai bệnh và tạo ra sơ đồ stakeholder đọc không nổi.',
  CLAUDE_END,
].join('\n');

// `--check` phải coi CLAUDE.md là một hạng mục cập nhật NGANG với file skill: khối briefing
// không nằm trong `changed` (nó không phải file được copy), nên nếu chỉ đếm `changed` thì một
// đích đã đủ file nhưng còn ôm khối marker đời cũ vẫn báo "✅ không có gì mới" + exit 0 —
// đúng cái làm người dùng bỏ sót lần cài 12/08/2026.
let claudePending = false;
if (!noClaude) {
  const claudePath = path.join(destRoot, 'CLAUDE.md');
  let action;
  if (fs.existsSync(claudePath)) {
    const original = fs.readFileSync(claudePath, 'utf8');
    let cur = original;
    // Gỡ khối marker đời trước (nếu có) — trước khi định vị khối mới.
    const la = cur.indexOf(LEGACY_START);
    const lb = cur.indexOf(LEGACY_END);
    const migrated = la !== -1 && lb > la;
    if (migrated) {
      cur = (cur.slice(0, la) + cur.slice(lb + LEGACY_END.length)).replace(/\n{3,}/g, '\n\n');
    }
    const a = cur.indexOf(CLAUDE_START);
    const b = cur.indexOf(CLAUDE_END);
    const updated = a !== -1 && b > a
      ? cur.slice(0, a) + CLAUDE_BLOCK + cur.slice(b + CLAUDE_END.length)
      : cur.replace(/\s*$/, '') + '\n\n' + CLAUDE_BLOCK + '\n';
    // So với NỘI DUNG GỐC, không so với `cur` đã gỡ legacy — nếu chỉ so với `cur` thì
    // trường hợp "đã có khối mới + còn sót khối cũ" sẽ bị coi là không đổi và lần gỡ
    // legacy không bao giờ được ghi xuống.
    if (!dryRun && updated !== original) ghiAnToàn(claudePath, updated);
    action = updated === original
      ? 'da co (khong doi)'
      : (migrated ? 'thay khoi cu -> briefing day du' : (a !== -1 ? 'cap nhat khoi' : 'them khoi'));
  } else {
    if (!dryRun) ghiAnToàn(claudePath, '# CLAUDE.md\n\n' + CLAUDE_BLOCK + '\n', false);
    action = 'tao moi';
  }
  claudePending = action !== 'da co (khong doi)';
  console.log(`  ${tag}CLAUDE.md — ${action} (dung --no-claude de bo qua)`);
}

// 4) Hook + quyền vào .claude/settings.json của đích (idempotent — nhận diện hook theo TÊN FILE script, cùng luật gỡ trùng).
//    Bảng hook chuẩn lấy từ ba-toolkit/scripts/integrity.js (HOOK_CHUẨN) — integrity soát đúng bảng install ghi, hai bên không lệch.
//    Nguồn đời cũ chưa có integrity.js → bảng dự phòng y hệt bên dưới.
const HOOK_BẢNG = (() => {
  for (const p2 of [path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'integrity.js'), path.join(skillsSrc, 'ba-toolkit', 'scripts', 'integrity.js')]) {
    try { const m = require(p2); if (Array.isArray(m.HOOK_CHUẨN) && typeof m.lệnhHook === 'function') return m; } catch { /* thử chỗ kế */ }
  }
  return {
    HOOK_CHUẨN: [
      { ev: 'PreToolUse', file: 'hook-guard.js', matcher: ['Read', 'Grep', 'Glob', 'Bash', 'Edit', 'Write', 'NotebookEdit'] },
      { ev: 'PostToolUse', file: 'hook-lint.js', matcher: ['Edit', 'Write'] },
      { ev: 'Stop', file: 'hook-gate.js' },
      { ev: 'SessionStart', file: 'hook-session.js' },
      { ev: 'UserPromptSubmit', file: 'hook-session.js' },
    ],
    lệnhHook: (f) => `node "\${CLAUDE_PROJECT_DIR:-.}/.claude/skills/ba-toolkit/scripts/${f}"`,
  };
})();
// permissions.deny (hook-review 07/10/2026): hook-guard là heuristic — không chứng minh được một lệnh Bash không đọc bí mật;
// lớp chặn của chính Claude Code là `permissions.deny` (áp cho Read/Grep/Glob và lệnh file Bash nó nhận ra: cat/head/tail/sed,
// redirect). Deny thắng mọi allow; ngoại lệ chỉ bằng phủ định gitignore `!` ĐỨNG SAU luật nó khoét, cùng một file settings
// (docs permissions: "A deny or ask pattern that starts with `!` … carves the paths it matches out of the rules listed before it").
// Nên `.env.example`/`.env.sample` (mẫu, hay được `cp .env.example .env`) và chứng chỉ công khai `cert.pem`/`public.pem` đọc được.
const DENY_CHUẨN = ['Read(**/.env)', 'Read(**/.env.*)', 'Read(!.env.example)', 'Read(!.env.sample)', 'Read(**/*.pem)', 'Read(!cert.pem)', 'Read(!public.pem)', 'Read(~/.ssh/**)', 'Read(~/.aws/**)'];
const settingsChờ = [];                      // --check: những gì update SẼ sửa trong settings.json (hook thiếu/cũ, deny thiếu)
const settingsCảnh = [];                     // --check: thứ update KHÔNG tự sửa (disableAllHooks, ba-hooks.json ghi đè mặc định)
{
  const settingsPath = path.join(destRoot, '.claude', 'settings.json');
  let settings = {};
  let ok = true;
  if (fs.existsSync(settingsPath)) {
    try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); }
    catch { ok = false; console.log(`  ${tag}.claude/settings.json — KHONG parse duoc JSON, bo qua hook (them tay theo ba-toolkit/scripts/integrity.js HOOK_CHUẨN)`); }
  }
  if (ok) {
    const trước = JSON.stringify(settings);
    settings.hooks = settings.hooks || {};
    const báo = [];
    // GỠ TRÙNG: cùng một lệnh đăng ký nhiều lần thì hook chạy nhiều lượt mỗi lần ghi file. Không phải giả thuyết — chính
    // repo nguồn từng có `hook-lint.js` đăng ký HAI lần, sót lại từ đợt di trú bố cục, nổ hai lượt mỗi lần Edit mà không
    // ai thấy (hook im khi sạch, nên trùng lặp không để lại dấu vết nào ngoài thời gian chạy).
    const gỡTrùng = (danh, tênFile) => {
      const thấy = new Set();
      const giữ = [];
      let bỏ = 0;
      for (const e of danh) {
        const cmds = (e.hooks || []).map((h) => h.command || '').filter((c) => c.includes(tênFile));
        if (!cmds.length) { giữ.push(e); continue; }
        if (cmds.some((c) => thấy.has(c))) { bỏ++; continue; }
        cmds.forEach((c) => thấy.add(c));
        giữ.push(e);
      }
      return { giữ, bỏ };
    };
    // (a) DI TRÚ lệnh cũ. `ba-toolkit/hook-lint.js` (trước 04/09, file đã bị dọn ở bước 4b) và `node .claude/…` tương đối
    //     (trước 07/10: hook chạy theo cwd của phiên — phiên đã `cd` vào thư mục con là mọi hook chết lặng, kể cả hook-guard)
    //     → `node "${CLAUDE_PROJECT_DIR:-.}/.claude/skills/ba-toolkit/scripts/<file>"`. Chỉ đổi lệnh ĐÚNG dạng mặc định cũ —
    //     lệnh người dùng tự thêm cờ/bọc thì giữ nguyên.
    const CŨ = /^node\s+(?:\.\/)?\.claude\/skills\/ba-toolkit\/(?:scripts\/)?(hook-(?:lint|guard|gate|session)\.js)\s*$/;
    let nDiTrú = 0;
    for (const ev of Object.keys(settings.hooks)) {
      for (const e of (Array.isArray(settings.hooks[ev]) ? settings.hooks[ev] : [])) {
        for (const h of (e.hooks || [])) {
          const m = typeof h.command === 'string' && CŨ.exec(h.command.trim());
          if (m) { h.command = HOOK_BẢNG.lệnhHook(m[1]); nDiTrú++; }
        }
      }
    }
    if (nDiTrú) báo.push(`di trú ${nDiTrú} lệnh hook sang "\${CLAUDE_PROJECT_DIR:-.}/.claude/skills/ba-toolkit/scripts/…"`);
    // (b) đủ hook chuẩn, không trùng; matcher hook-guard phủ cả Edit|Write|NotebookEdit (hook-guard chặn sửa hook/settings).
    for (const hc of HOOK_BẢNG.HOOK_CHUẨN) {
      settings.hooks[hc.ev] = Array.isArray(settings.hooks[hc.ev]) ? settings.hooks[hc.ev] : [];
      const gt = gỡTrùng(settings.hooks[hc.ev], hc.file);
      if (gt.bỏ) { settings.hooks[hc.ev] = gt.giữ; báo.push(`gỡ ${gt.bỏ} hook ${hc.file} trùng (${hc.ev} — đang chạy ${gt.bỏ + 1} lượt)`); }
      const của = settings.hooks[hc.ev].filter((e) => (e.hooks || []).some((h) => (h.command || '').includes(hc.file)));
      if (!của.length) {
        const mục = { hooks: [{ type: 'command', command: HOOK_BẢNG.lệnhHook(hc.file) }] };
        settings.hooks[hc.ev].push(hc.matcher ? Object.assign({ matcher: hc.matcher.join('|') }, mục) : mục);
        báo.push(`thêm hook ${hc.file} (${hc.ev})`);
        continue;
      }
      if (!hc.matcher) continue;
      for (const e of của) {
        const m = typeof e.matcher === 'string' ? e.matcher.trim() : '';
        if (m === '' || m === '*') continue;
        if (!/^[\w\s|-]+$/.test(m)) { settingsCảnh.push(`matcher của ${hc.file} là regex "${m}" — không tự sửa; phải phủ ${hc.matcher.join('|')}`); continue; }
        const tok = m.split('|').map((x) => x.trim()).filter(Boolean);
        const thiếu = hc.matcher.filter((t) => !tok.includes(t));
        if (thiếu.length) { e.matcher = [...tok, ...thiếu].join('|'); báo.push(`matcher ${hc.file} thêm ${thiếu.join('|')}`); }
      }
    }
    // (c) permissions.deny — MERGE: giữ mọi luật người dùng, luật chuẩn xếp cuối theo đúng thứ tự (phủ định `!` sau luật nó khoét).
    settings.permissions = settings.permissions && typeof settings.permissions === 'object' ? settings.permissions : {};
    const denyCũ = Array.isArray(settings.permissions.deny) ? settings.permissions.deny : [];
    const denyMới = [...denyCũ.filter((r) => !DENY_CHUẨN.includes(r)), ...DENY_CHUẨN];
    if (JSON.stringify(denyMới) !== JSON.stringify(denyCũ)) {
      const thêm = DENY_CHUẨN.filter((r) => !denyCũ.includes(r));
      settings.permissions.deny = denyMới;
      báo.push(thêm.length ? `permissions.deny thêm ${thêm.length} luật (${thêm.join(' ')})` : 'permissions.deny xếp lại thứ tự luật chuẩn (phủ định `!` phải đứng sau)');
    }
    if (JSON.stringify(settings) !== trước) {
      if (!dryRun) ghiAnToàn(settingsPath, JSON.stringify(settings, null, 2) + '\n');
      for (const b of báo) console.log(`  ${tag}.claude/settings.json — ${b}`);
      settingsChờ.push(...báo);
    } else console.log(`  ${tag}.claude/settings.json — hook + permissions.deny đã đủ (không đổi)`);
  }
  // disableAllHooks + ba-hooks.json ghi đè mặc định: thứ người dùng CHỌN — update không đè, nhưng --check phải nói ra (một
  // dòng `disableAllHooks: true` tắt mọi hook kể cả hook-guard; agent ghi được file đó — hook-review 07/10/2026).
  for (const f of ['settings.json', 'settings.local.json']) {
    try { if (JSON.parse(fs.readFileSync(path.join(destRoot, '.claude', f), 'utf8')).disableAllHooks === true) settingsCảnh.push(`.claude/${f}: disableAllHooks: true — MỌI hook (cả hook-guard chặn đọc bí mật) đang tắt`); } catch { /* không có / hỏng */ }
  }
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(destRoot, '.claude', 'ba-hooks.json'), 'utf8'));
    let mặc = {}; try { mặc = JSON.parse(fs.readFileSync(path.join(skillsSrc, 'ba-toolkit', 'assets', 'hooks.config.json'), 'utf8')); } catch { /* nguồn cũ */ }
    const khác = Object.keys(cfg).filter((k) => !k.startsWith('_') && JSON.stringify(cfg[k]) !== JSON.stringify(k in mặc ? mặc[k] : true));
    if (khác.length) settingsCảnh.push(`.claude/ba-hooks.json ghi đè mặc định: ${khác.map((k) => `${k}=${JSON.stringify(cfg[k])}`).join(', ')}`);
  } catch { /* không có ba-hooks.json = mặc định */ }
}

// ─── 4c) Bỏ qua git cho trạng thái runtime của hook ───────────────────────────
// `hook-gate.js` ghi mốc "đã nhắc tới đâu" vào `.claude/ba-hook-gate.json`. Đó là trạng thái của
// MỘT máy, không phải của dự án — commit nó thì hai người sẽ ghi đè mốc của nhau và cảnh báo
// nhảy loạn. Chỉ THÊM DÒNG khi dự án đã có `.gitignore`; không tự tạo file mới ở repo người khác.
{
  const giPath = path.join(destRoot, '.gitignore');
  // `.bak` do ghiAnToàn để lại là đường lui CỦA MÁY này, không phải thứ để commit.
  const DÒNG = ['.claude/spec-changes.jsonl', '.claude/ba-hook-gate.json', '.claude/ba-hook-stats.json', '.claude/ba-session.json', '.claude/ba-integrity-cache.json', '.claude/*.bak', 'CLAUDE.md.bak', '.ba-video/'];  // .ba-video/: media của ba-userguide-video (mp4/mp3/webm — lớn, sinh lại được)
  if (fs.existsSync(giPath)) {
    let gi = fs.readFileSync(giPath, 'utf8');
    const thiếu = DÒNG.filter((d) => !gi.split('\n').some((l) => l.trim() === d));
    if (thiếu.length) {
      gi = gi.replace(/\s*$/, '\n') + '\n# Trạng thái runtime của hook BA toolkit (của máy, không của dự án)\n' + thiếu.join('\n') + '\n';
      if (!dryRun) fs.writeFileSync(giPath, gi, 'utf8');
      console.log(`  ${tag}.gitignore — them ${thiếu.length} dong bo qua trang thai runtime cua hook`);
    }
  }
}

// ─── 4b) Chốt CommonJS cho thư mục skill ──────────────────────────────────────
// Mọi script của toolkit (build.js, lint.js, status.js, refresh.js, scan.js, hook-lint.js,
// deploy.js, chính install.js) viết theo CommonJS (`require`). Dự án đích khai
// `"type": "module"` trong package.json gốc (rất phổ biến: Vite/Next/Tauri/React) → Node coi
// MỌI file .js là ES module ⇒ **toàn bộ script chết** với "require is not defined".
// Node lấy `type` từ package.json GẦN NHẤT đi ngược lên, nên chỉ cần đặt một package.json
// tối giản ngay tại .claude/skills/ là mọi script bên dưới quay về CommonJS — không đụng
// gì tới package.json của dự án. (Bắt được ở dự án desktop — Tauri + Vite, type: module.)
{
  const pkgPath = path.join(destRoot, '.claude', 'skills', 'package.json');
  let pkg = {};
  let readable = true;
  if (fs.existsSync(pkgPath)) {
    try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); }
    catch { readable = false; console.log(`  ${tag}.claude/skills/package.json — hỏng JSON, bỏ qua (sửa tay: {"type":"commonjs"})`); }
  }
  if (readable) {
    if (pkg.type === 'commonjs') {
      console.log(`  ${tag}.claude/skills/package.json — đã chốt CommonJS (không đổi)`);
    } else {
      pkg.type = 'commonjs';
      if (!pkg.name) pkg.name = 'ba-toolkit-skills';
      if (!pkg.private) pkg.private = true;
      if (!dryRun) {
        fs.mkdirSync(path.dirname(pkgPath), { recursive: true });
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
      }
      console.log(`  ${tag}.claude/skills/package.json — chốt "type": "commonjs" (để script chạy được ở dự án ESM)`);
    }
  }
}

// ─── 5) Manifest dấu vết cài đặt ──────────────────────────────────────────────
const srcGit = gitInfo(srcRoot);
// M4 (docs/decisions/32): phiên bản phát hành — một nguồn là file VERSION ở gốc nguồn; nguồn đời cũ chưa có → null (chỉ còn commit)
const srcVersion = (() => { try { return fs.readFileSync(path.join(srcRoot, 'VERSION'), 'utf8').trim() || null; } catch { return null; } })();
if (!dryRun) {
  const out = {
    schema: 1,
    installedAt: new Date().toISOString(),
    source: { path: srcRoot, version: srcVersion, git: srcGit, ...(nguồnDirty.length ? { dirtyFiles: nguồnDirty.slice(0, 200), dirtyCount: nguồnDirty.length, allowDirty } : {}) },
    scope,
    installProfile: installProfileThật,
    dev: installProfileThật === 'full' ? !docsOnly : withDev,
    security: quétNguồn.thiếu || quétNguồn.lỗi ? { quet: tómTắtQuét } : { do: quétNguồn.chuaDuyet.do, vang: quétNguồn.chuaDuyet.vang, daDuyet: quétNguồn.daDuyet, ...(quétĐỏ ? { allowUnsafe: true } : {}) },
    ...(expCanon.length ? { experimental: [...expGiữ, ...expCài].sort() } : {}),
    counts: { skills: skillNames.length, agents: agentCount, guides: guideCount, explain: explainCount },
    files: nextFiles,
  };
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  ghiAnToàn(manifestPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`  ${MANIFEST_REL} — ghi dấu vết (${Object.keys(nextFiles).length} file, commit ${srcGit ? srcGit.commit : 'n/a'})`);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
const pruneNote = staleNames.length
  ? (prune ? ` · ${staleNames.length} thừa đã xoá` : ` · ${staleNames.length} thừa (dùng --prune)`)
  : '';
const agentNote = agentCount ? ` + ${agentCount} agent` : '';
const explainNote = explainCount ? ` + explain (${explainCount} file)` : '';

// Đối chiếu phiên bản nguồn ↔ bản đã cài
const prevCommit = manifest.source && manifest.source.git && manifest.source.git.commit;
const prevVer = (manifest.source && manifest.source.version) || null;
const vTag = (v, c) => (v ? `${v} (${c})` : c);
if (prevCommit && srcGit && srcGit.commit) {
  if (prevCommit === srcGit.commit) console.log(`\nPhiên bản: đích đang bám ${vTag(prevVer, prevCommit)} — TRÙNG nguồn.`);
  else console.log(`\nPhiên bản: đích đang ở ${vTag(prevVer, prevCommit)} → nguồn ${vTag(srcVersion, srcGit.commit)}${srcGit.dirty ? ' (nguồn có thay đổi chưa commit)' : ''}.`);
} else if (srcGit) {
  console.log(`\nPhiên bản nguồn: ${srcVersion ? srcVersion + ' · ' : ''}${srcGit.branch}@${srcGit.commit}${srcGit.dirty ? ' (chưa commit hết)' : ''}${manifest.installedAt ? '' : ' — lần cài đầu tiên'}`);
}

if (checkOnly) {
  console.log(`\n🔒 Quét bảo mật nguồn: ${tómTắtQuét}${quétĐỏ ? ' — cập nhật sẽ DỪNG trừ khi --allow-unsafe' : ''}`);
  console.log('');
  if (changed.length) {
    console.log(`📥 ${changed.length} file có bản mới ở nguồn:`);
    for (const c of changed.slice(0, 20)) console.log(`   ${c.kind === 'mới' ? '+' : '~'} ${c.rel}`);
    if (changed.length > 20) console.log(`   … và ${changed.length - 20} file nữa`);
  } else if (!claudePending) {
    console.log('✅ Không có gì mới — đích đang khớp nguồn.');
  }
  if (claudePending) {
    console.log(`📥 CLAUDE.md — khối briefing \`BA-TOOLKIT:briefing\` chưa khớp bản nguồn (sẽ được ghi khi cập nhật).`);
    console.log(`   Đây là thứ agent ở dự án đích LUÔN nạp — thiếu/cũ thì nó không biết pipeline, gate, bổn phận cập nhật docs/.`);
  }
  if (keptLocal.length || conflicts.length) {
    console.log(`\n⚠️  ${keptLocal.length + conflicts.length} file ĐÃ SỬA CỤC BỘ ở đích (sẽ được GIỮ NGUYÊN khi cập nhật):`);
    for (const r of [...conflicts, ...keptLocal].slice(0, 20)) {
      console.log(`   ${conflicts.includes(r) ? '‼️ ' : '•  '}${r}${conflicts.includes(r) ? '  ← nguồn CŨNG đổi (xung đột)' : ''}`);
    }
    if (conflicts.length) console.log(`   → ${conflicts.length} file xung đột: bản cục bộ đang che mất cập nhật từ nguồn. Xử lý bằng --force (ghi đè) sau khi tự merge.`);
  }
  if (expGiữ.length || expBỏ.length) {
    console.log(`\n⚗️ Skill thử nghiệm (canon skills.experimental — chưa từng chạy thật trên dự án nào):`);
    for (const n of expGiữ) console.log(`   ${n}  (đã cài — thử nghiệm, giữ và cập nhật)`);
    for (const n of expBỏ) console.log(`   ${n}  (thử nghiệm — chưa cài; muốn dùng thì thêm --with-experimental)`);
  }
  if (settingsChờ.length || settingsCảnh.length) {
    console.log(`\n🪝 Hook / quyền của dự án (.claude/settings*.json, ba-hooks.json):`);
    for (const x of settingsChờ) console.log(`   ~ ${x}  (cập nhật sẽ sửa)`);
    for (const x of settingsCảnh) console.log(`   ⛔ ${x}  (cập nhật KHÔNG tự sửa — người dùng quyết)`);
  }
  const depChờ = depHere.filter((x) => x.gỡ);
  if (depHere.length) {
    console.log(`\n🔀 ${depHere.length} skill ĐÃ GỘP còn ở đích (canon deprecated.skills):`);
    for (const x of depHere) console.log(`   ${x.cũ} → ${x.mới}${x.gỡ ? '  (cập nhật sẽ gỡ bản cũ)' : `  (GIỮ — ${x.sửa.length} file sửa cục bộ)`}`);
  }
  // Có gì đổi ở NGUỒN kể từ commit đích đang bám — đọc được trước khi quyết cập nhật.
  if (prevCommit && srcGit && srcGit.commit && prevCommit !== srcGit.commit) {
    const log = gitOut(srcRoot, ['log', '--oneline', `${prevCommit}..HEAD`, '--', '.claude/skills', '.claude/agents', 'docs/decisions']);
    if (log === null) console.log(`\n(git log ${prevCommit}..${srcGit.commit}: commit cũ không còn trong lịch sử nguồn — rebase/force-push?)`);
    else {
      const dòng = log.split('\n').filter(Boolean);
      console.log(`\n📜 git log ${prevCommit}..${srcGit.commit} (skills · agents · decisions): ${dòng.length} commit`);
      for (const l of dòng.slice(0, 30)) console.log(`   ${l}`);
      if (dòng.length > 30) console.log(`   … và ${dòng.length - 30} commit nữa`);
      const dec = (gitOut(srcRoot, ['diff', '--name-status', `${prevCommit}..HEAD`, '--', 'docs/decisions']) || '').split('\n').filter((l) => /^[AM]\s+.*\.md$/.test(l));
      if (dec.length) {
        console.log(`   Decision mới/đổi (đọc cái "vì sao" trước khi cập nhật):`);
        for (const l of dec) {
          const [st, f] = l.split(/\s+/);
          const h = ((() => { try { return fs.readFileSync(path.join(srcRoot, f), 'utf8'); } catch { return ''; } })().match(/^#\s+(.+)$/m) || [])[1] || path.basename(f);
          console.log(`   ${st === 'A' ? '+' : '~'} ${path.basename(f)} — ${h.trim()}`);
        }
      }
    }
  }
  console.log(`\nChạy cập nhật:  node "${__filename}" --to "${destRoot}"`);
  process.exit(changed.length || claudePending || depChờ.length || settingsChờ.length ? 1 : 0);
}

// 4b) DI TRÚ bố cục cũ → chuẩn (04/09/2026). Dự án cài trước mốc đó có `ba-portal/build.js`
// nằm ngay gốc skill. Cập nhật xong sẽ có THÊM `ba-portal/scripts/build.js`, còn bản cũ vẫn ở
// đó — chạy được nhưng ĐÔNG CỨNG ở phiên bản cũ, và không ai biết mình đang chạy bản nào.
// Chỉ xoá khi bản đã dời VỪA ĐƯỢC CÀI: không đoán, không xoá thứ mình không thay thế.
if (!dryRun) {
  let dọn = 0;
  const skillsDir = path.join(destRoot, '.claude', 'skills');
  for (const s of fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir) : []) {
    const d = path.join(skillsDir, s);
    if (!fs.statSync(d).isDirectory()) continue;
    for (const sub of ['scripts', 'references', 'assets']) {
      const p2 = path.join(d, sub);
      if (!fs.existsSync(p2)) continue;
      for (const f of fs.readdirSync(p2)) {
        const cũ = path.join(d, f);
        if (f === 'SKILL.md' || !fs.existsSync(cũ)) continue;
        const làThưMục = fs.statSync(cũ).isDirectory();
        // Thư mục cũng phải dọn, không chỉ file: `rules/`, `engine/`, và nhất là
        // `ba-portal/vendor/` (3,4 MB mermaid). Bỏ sót thì đích mang HAI bản mermaid và
        // 3,5 MB trùng lặp — đã đo đúng con số đó trên dự án pilot lúc thử di trú.
        if (!xoáAnToàn(cũ, { recursive: làThưMục })) continue;
        dọn++;
        console.log(`  ${tag}di trú: xoá bản cũ ${s}/${f}${làThưMục ? '/' : ''} (đã có ${s}/${sub}/${f})`);
      }
    }
  }
  if (dọn) console.log(`  ${tag}di trú bố cục: dọn ${dọn} file ở gốc skill`);
}

// 4d) DI TRÚ file DỜI GIỮA SKILL (08/10/2026 — tách gói công khai/Pro, docs/decisions/32). Update chép bản mới ở chỗ mới
//     nhưng không tự xoá chỗ cũ → đích giữ HAI bản và bản cũ ĐÔNG CỨNG (vd `ac-po/scripts/accept.js` vẫn chạy được, thiếu mọi
//     sửa sau ngày dời — đúng lỗi 4b chống). Xoá bản cũ khi và chỉ khi: (a) bản mới có trong lần cài này (nextFiles) và có ở
//     đích; (b) bản cũ TRÙNG hash manifest cũ (toolkit ghi, không ai sửa). Không có hash / đã sửa cục bộ → GIỮ + cảnh báo.
//     Thêm một dòng ở đây mỗi khi `git mv` một file từ skill này sang skill khác.
const DỜI_FILE = [   // đường dẫn CŨ ở đích — chỉ đọc/xoá khi existsSync, không require (lint 44 ranh giới gói)
  ['ac-agent/scripts/check-agents.js', 'ba-toolkit/scripts/check-agents.js'], // M6 đợt 2: ac-agent thành skill giữ riêng, lint 30 vẫn cần nó
  ['ac-audit-web/scripts/scan-html.js', 'ba-toolkit/scripts/scan-html.js'], // M6: ba-html-design (lõi) luôn chạy nó — không kéo ac-audit-web vào gói lõi
  ['ac-po/scripts/accept.js', 'ac-verify/scripts/accept.js'],
  ['ac-team/scripts/state.js', 'ba-toolkit/scripts/state.js'],
  ['ac-team/scripts/batch-plan.js', 'ba-toolkit/scripts/batch-plan.js'],
  ['ac-team/assets/builder-brief.md', 'dev-run/assets/builder-brief.md'],
  ['ac-team/references/coding-guidelines.md', 'dev-run/references/coding-guidelines.md'],
  ['ac-eval/references/thang-diem.md', 'ac-verify/references/thang-diem.md'],
  ['ba-reverse/references/rules/inference-policy.md', 'ba-toolkit/references/rules/inference-policy.md'], // ba-toolkit luôn được cài (kể cả --scope docs) — ba-reverse và agent ba-inference-reviewer đều đọc
].map(([a, b]) => [path.join('.claude', 'skills', ...a.split('/')), path.join('.claude', 'skills', ...b.split('/'))]);
{
  let dọn = 0; const giữ = [];
  for (const [cũ, mới] of DỜI_FILE) {
    if (!fs.existsSync(path.join(destRoot, cũ)) || !nextFiles[mới] || !fs.existsSync(path.join(destRoot, mới))) continue;
    const h = shaFile(path.join(destRoot, cũ));
    if (!prevFiles[cũ] || h !== prevFiles[cũ]) { giữ.push(`${cũ} (${prevFiles[cũ] ? 'đã sửa cục bộ' : 'không có hash trong manifest cũ'})`); continue; }
    if (dryRun) { console.log(`  ${tag}di trú: sẽ xoá ${cũ} (đã dời → ${mới})`); continue; }
    if (!xoáAnToàn(cũ)) continue;
    dọn++; console.log(`  ${tag}di trú: xoá ${cũ} (đã dời → ${mới})`);
  }
  if (dọn) console.log(`  ${tag}di trú file dời giữa skill: dọn ${dọn} bản cũ`);
  if (giữ.length) console.log(`  ⚠️  GIỮ ${giữ.length} bản cũ của file đã dời — so với bản mới rồi xoá tay: ${giữ.join(' · ')}`);
}

// 5) Dựng chỉ mục truy xuất cho đích, nếu nó đã có `docs/`.
// Vì sao dựng luôn: không có chỉ mục thì `ba-index` chỉ là một skill nằm đó, và lần đầu ai đó
// cần tra cứu sẽ nhận thông báo "chưa có chỉ mục" — đúng lúc họ đang bận việc khác. Rẻ tới mức
// không đáng để người dùng phải nhớ (0,15s cho 96 file).
// KHÔNG được để bước này làm hỏng lần cài: chỉ mục là thứ SINH RA, thiếu nó thì mọi thứ khác
// vẫn chạy. Node < 22 không có `node:sqlite` → báo rõ rồi đi tiếp, không ném lỗi.
if (!dryRun) {
  const docsĐích = path.join(destRoot, 'docs');
  const buildJs = path.join(destRoot, '.claude', 'skills', 'ba-index', 'scripts', 'build.js');
  if (!fs.existsSync(docsĐích)) {
    console.log(`  ${tag}chỉ mục — bỏ qua: đích chưa có docs/ (dựng sau bằng: node .claude/skills/ba-index/scripts/build.js docs)`);
  } else if (!fs.existsSync(buildJs)) {
    console.log(`  ${tag}chỉ mục — bỏ qua: không thấy ba-index/build.js`);
  } else {
    const r = spawnSync(process.execPath, [buildJs, docsĐích], { cwd: destRoot, encoding: 'utf8' });
    if (r.status === 0) {
      // Bắt DÒNG ĐẾM, không phải dòng tiêu đề: `.includes('mục')` khớp luôn "Chỉ mục: <path>"
      // và in ra một đường dẫn thay vì con số — vô dụng đúng chỗ người ta cần biết kết quả.
      const dòng = (r.stdout || '').split('\n').find((l) => /^\s*mục\s/.test(l)) || '';
      const số = dòng.replace(/^\s*mục\s*:\s*/, '').trim();
      console.log(`  .claude/ba-index.db — đã dựng chỉ mục${số ? ` (${số})` : ''}`);
    } else {
      const lý = /node:sqlite/.test((r.stderr || '') + (r.stdout || ''))
        ? `Node ${process.version} không có node:sqlite (cần ≥ 22)`
        : (r.stderr || '').split('\n')[0] || 'lỗi không rõ';
      console.log(`  chỉ mục — KHÔNG dựng được: ${lý}. Mọi thứ khác vẫn cài xong; dựng lại sau bằng ba-index/build.js.`);
    }
  }
}

console.log(`\n${tag}Xong: ${skillNames.length} skill${agentNote} + ${guideCount} file hướng dẫn${explainNote}${pruneNote} → ${destRoot}`);
if (changed.length) console.log(`  ${changed.length} file được ghi (mới/cập nhật).`);
if (keptLocal.length || conflicts.length) {
  console.log(`\n⚠️  GIỮ NGUYÊN ${keptLocal.length + conflicts.length} file đã sửa cục bộ ở đích — KHÔNG ghi đè:`);
  for (const r of [...conflicts, ...keptLocal].slice(0, 15)) {
    console.log(`   ${conflicts.includes(r) ? '‼️ ' : '•  '}${r}${conflicts.includes(r) ? '  ← nguồn cũng đổi, bản cục bộ đang che cập nhật' : ''}`);
  }
  if (conflicts.length) console.log(`   → Muốn lấy bản nguồn cho ${conflicts.length} file xung đột: chạy lại kèm --force.`);
  console.log('   (Cảnh báo này lặp lại ở mọi lần chạy cho tới khi bạn xử lý.)');
}
if (dryRun) console.log('(dry-run — chưa ghi gì. Bỏ --dry để chạy thật.)');
else console.log('Khởi động lại Claude Code trong dự án đích để nạp skill mới.');
