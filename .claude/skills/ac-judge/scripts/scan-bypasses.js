#!/usr/bin/env node
/*
 * ac-judge/scan-bypasses.js — QUÉT DIFF tìm mẫu LÁCH deterministically. Zero-dependency, CommonJS.
 *
 *   node .claude/skills/ac-judge/scripts/scan-bypasses.js <diff-file>            # file diff unified
 *   node .claude/skills/ac-judge/scripts/scan-bypasses.js --range <a>..<b>       # tự chạy `git diff a..b`
 *   node .claude/skills/ac-judge/scripts/scan-bypasses.js --range <a>..<b> --per-commit   # + theo dõi từng commit
 *   git diff main..HEAD | node .claude/skills/ac-judge/scripts/scan-bypasses.js - # đọc stdin
 *   … [--root <repo>] [--plain|--json]
 *
 * Mỗi dòng `+` của diff (file lõi, không phải file cơ giới) được so với bảng mẫu:
 *   suppression   eslint-disable · @ts-ignore/@ts-expect-error/@ts-nocheck · # noqa · # type: ignore ·
 *                 pylint: disable · @SuppressWarnings · nolint · biome-ignore
 *   test-dodge    it.skip / test.skip / describe.skip / .only( / xit( / xdescribe( / xtest( · @pytest.mark.skip · t.Skip(
 *   test-removed  dòng `-` chứa it(/test(/describe( mà KHÔNG xuất hiện lại y nguyên ở dòng `+` cùng file (di chuyển thì bỏ qua),
 *                 không có test cùng tên được thêm ở file khác (dời file), và KHÔNG ghép được cặp đổi tên với một test thêm
 *                 cùng file (xem "Ghép đổi tên" dưới — cùng luật với --per-commit)
 *   assert-loose  cùng hunk: dòng `-` có assert giá trị (toBe/toEqual/toStrictEqual/assertEqual/assert.equal)
 *                 và dòng `+` có assert lỏng (toBeTruthy/toBeDefined/toBeFalsy/not.toThrow/assertTrue) → báo dòng `+`
 *   todo-new      // TODO · # TODO · FIXME · XXX mới thêm
 *   secret-like   AKIA… · sk-… · ghp_… · BEGIN PRIVATE KEY · password/secret/api_key/token = "literal"
 *   type-bypass   as any · as unknown as X · non-null `!` sau `)` (chỉ .ts/.tsx)
 *   tls-bypass    rejectUnauthorized: false · verify=False · InsecureSkipVerify · NODE_TLS_REJECT_UNAUTHORIZED
 *   error-swallow catch {} · catch (e) {} · except: pass
 *   hook-bypass   --no-verify
 *   config-loosen passWithNoTests · (file cấu hình test/lint/tsconfig) exclude/testPathIgnorePatterns/testIgnore/--ignore ·
 *                 `"strict": false`/noImplicitAny/strictNullChecks false · eslint rule "off" · ngưỡng coverage HẠ
 *                 (cùng hunk: `-` key N, `+` key M < N) · package.json script `"test"` đổi lệnh (cùng hunk)
 *   env-dodge     process.env.CI · NODE_ENV === 'test' · JEST_WORKER_ID/VITEST · import.meta.env.MODE === 'test' ·
 *                 os.environ CI/PYTEST_CURRENT_TEST · dòng ĐỌC `NODE_ENV`/`CI`/`MODE` mà ±3 dòng có literal `'test'`
 *                 (`['development','test'].includes(process.env.NODE_ENV)`, `switch (…NODE_ENV) { case 'test':`) —
 *                 CHỈ trong file code non-test, non-config (playwright.config
 *                 `retries: process.env.CI ? 2 : 0` là hợp lệ) — code rẽ nhánh theo "đang bị test" là pass giả
 *   protected-edit sửa thứ builder KHÔNG được sửa (not-your-babysitter "the spec, the tests, the sensitive config"):
 *                 plan.md dòng `**Proof:**`/`**Trace test:**`/`Definition of Done` (checkbox `- [x]` KHÔNG tính) ·
 *                 test.md (một hit mỗi file) · `.claude/settings*.json`, `.claude/hooks/`, `.claude/ac-rules.jsonl`,
 *                 `.claude/ba-hook-gate.json` · `.claude/skills|agents/` (trừ khi diff chạm `.claude/ba-toolkit.json` VÀ mọi file
 *                 `.claude/skills/` đổi còn trùng nguồn theo `ba-toolkit/scripts/integrity.js` = đồng bộ install.js thật; hoặc
 *                 đang ở repo toolkit gốc — `example/docs/00-tracking.md`, canon export.srcMarker).
 *                 File plan.md/test.md MỚI tạo không tính (tạo ≠ sửa đề).
 *
 * `--per-commit` (cần --range): ngoài diff gộp như trên, đi `git rev-list --reverse --no-merges a..b` từng commit,
 * đọc ảnh chụp mỗi file test bị chạm (`git show <sha>:<file>`) và theo dõi TỪNG TEST (file + tên it/test/def test_/func Test):
 *   assert-loose  test có N assert giá trị ở commit trước → ít hơn N và nhiều assert lỏng hơn ở commit sau
 *                 (gộp diff không thấy khi test được VIẾT CHẶT rồi NỚI trong cùng khoảng — nó chỉ thấy bản lỏng mới thêm)
 *   test-removed  test THÊM trong khoảng rồi XOÁ trong khoảng (gộp diff không thấy gì cả); cùng tên còn ở file khác = di chuyển, bỏ
 * Hit qua-commit mang `commit`; trùng hit gộp (cùng file, dòng hit gộp nằm trong thân test đó) thì bỏ.
 *
 * Ghép đổi tên (cả diff gộp lẫn --per-commit; dự án helpdesk 24/09/2026: 3/3 test-removed là đổi tên — `c8b4a9d` nối đuôi,
 * `e1058a3` viết lại vế sau, `c3a4100` "ba loại" → "bốn loại"): test mất ↔ test mới cùng file, theo thứ tự ưu tiên
 * trùng mã TC → tên này chứa tên kia → chung ≥20 ký tự ĐẦU hoặc CUỐI → độ giống từ (Dice) ≥ 0,6 → CÙNG CHỖ (gộp: cùng
 * khối `-`/`+` liền nhau; per-commit: cùng test láng giềng đứng trước hoặc sau) → per-commit còn lại bằng số thì theo thứ tự.
 *
 * Loại MẪU MÃ (suppression · test-dodge · type-bypass · error-swallow) chỉ áp
 * cho file có đuôi mã (CODE_EXT + html) và so trên dòng đã XOÁ NỘI DUNG chuỗi literal: văn xuôi trong docs/**.md, bản
 * review/eval trích mẫu, `ac-mission*.json` không phải mã (dự án helpdesk: ~30 báo oan); `/eslint-disable/.test(x)` hay
 * `it('0 dòng eslint-disable')` trong test KIỂM luật (chuỗi và regex literal đều bị xoá nội dung) không phải directive. Các loại còn lại (secret-like, todo-new,
 * tls-bypass, hook-bypass, config-loosen, protected-edit, test-removed, assert-loose) giữ mọi đuôi.
 *
 * Đếm, không phán: một phát hiện là ỨNG VIÊN (MỒI) cho lượt F của agent ac-judge, không phải finding — suppression có
 * lý do + link issue kế bên là hợp lệ, suppression trần thì không; protected-edit do CR/ba-test mở là hợp lệ;
 * agent quyết. Exit 0 = quét chạy được (dù bao nhiêu phát hiện — số nằm ở dòng tổng `N phát hiện` / `phatHien` của --json),
 * 2 = lỗi hạ tầng (thiếu file diff, git diff/rev-list hỏng, --per-commit thiếu --range).
 * Vì sao hết exit = số phát hiện (25/09/2026): trên dự án thật 2 BẮT · ~7 lượt OAN · ~170 phát hiện bị judge bác
 * (dự án helpdesk, dự án desktop) — một bộ đếm mà 9/10 hit là nhiễu không được làm đỏ cổng; nó làm mồi cho agent, agent phán.
 * Cùng ngày rút console-left / sync-hack / unsafe-html: 0 lần bắt thật, console-left + unsafe-html chỉ báo oan
 * (output CLI trong .claude/, *.test.mts, innerHTML đã escape). tls-bypass / secret-like giữ dù chưa bắt lần nào — bảo mật.
 * In thêm số dòng lõi (+/−) để orchestrator biết diff có vượt ~400 dòng lõi (cần chia theo file) hay không.
 *
 * Vì sao có: the-judge/scan_bypasses.py — "zero LLM tokens are spent detecting what a regex detects". Bản
 * này thêm ba mẫu regex Python gốc không có mà brief BA kit đòi: test bị XOÁ, assertion bị NỚI, secret-like —
 * vì ba thứ đó là cách một lô TDD "xanh" mà không làm gì. Đợt 5 (chống pass giả) thêm protected-edit/config-loosen/
 * env-dodge + --per-commit: tlc-spec-lean build.md "Fixed: the checks, the Test policy rows, and the proofs… Lowering
 * either is renegotiation with the user, visible in the diff" — ta làm nó hiện ra. Gốc luôn exit 0; bản này exit =
 * số phát hiện để gọi từ CI — bỏ 25/09/2026, xem trên.
 *
 * gioiHan: chỉ đọc diff unified (`--- a/` `+++ b/` `@@`); không mở file gốc để biết ngữ cảnh — vì thế
 * suppression-có-lý-do vẫn được báo (agent đọc rồi bỏ). Xoá literal theo từng dòng: template literal nhiều dòng
 * không xoá được (dòng giữa không có dấu mở) — mẫu trong đó vẫn bị báo. Không quét dòng ngữ cảnh (không có `+`). File cơ
 * giới (lockfile, *.snap, *.min.js, dist/, build/, vendor/, *.map, *.generated.*) bỏ qua và liệt kê riêng.
 * --per-commit: tên test theo regex dòng (không AST); đổi tên ghép cặp trong cùng commit (trùng mã TC · tên chứa tên · chung ≥20 ký tự
 * đầu · số bằng nhau thì theo thứ tự) — xoá một test và thêm một test khác cùng commit cùng file bị coi là đổi tên (thà sót); bỏ commit merge; thân test = từ dòng
 * định nghĩa tới định nghĩa kế (describe lồng không tách). Ngưỡng coverage/script test chỉ so trong CÙNG hunk.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const JSON_MODE = argv.includes('--json');
const PER_COMMIT = argv.includes('--per-commit');
const opt = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
const ROOT = path.resolve(opt('--root') || process.cwd());
const RANGE = opt('--range');
const pos = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--range' && argv[i - 1] !== '--root');
const git = (...a) => spawnSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1e8 });

if (PER_COMMIT && !RANGE) { console.error('--per-commit cần --range <a>..<b> (phải đi lịch sử git, không đọc được từ file diff)'); process.exit(2); }
let diff = '';
if (RANGE) {
  const r = git('diff', '--no-color', RANGE);
  if (r.status !== 0) { console.error(`git diff ${RANGE} thất bại: ${(r.stderr || '').trim()}`); process.exit(2); }
  diff = r.stdout;
} else if (pos[0] === '-' || (!pos[0] && !process.stdin.isTTY)) {
  diff = fs.readFileSync(0, 'utf8');
} else if (pos[0]) {
  if (!fs.existsSync(pos[0])) { console.error(`không thấy file diff: ${pos[0]}`); process.exit(2); }
  diff = fs.readFileSync(pos[0], 'utf8');
} else {
  console.error('Dùng: scan-bypasses.js <diff-file> | --range a..b [--per-commit] | - (stdin)  [--root <repo>] [--plain|--json]');
  process.exit(2);
}

// `.claude/` = toolkit do install.js quản (dự án helpdesk 16/09/2026: 5 console-left là output CLI của diff-digest.js/mission.js vừa đồng bộ, không phải code dự án)
const MECHANICAL = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|Cargo\.lock|poetry\.lock|Gemfile\.lock|composer\.lock|go\.sum)$|\.(snap|map|min\.js|min\.css|lock)$|(^|\/)(dist|build|vendor|node_modules|__snapshots__|coverage|\.claude)\/|\.generated\.|(^|\/)generated\//;
const IS_TEST = /(\.|_|\/)(test|spec)s?\.[jt]sx?$|(^|\/)(tests?|__tests__|spec)\//;
// file cấu hình test/lint/type — nơi nới luật trông như "chỉnh config"
const IS_CONFIG = /(^|\/)(package\.json|tsconfig[^/]*\.json|jsconfig\.json|(jest|vitest|vite|playwright|cypress|karma)\.config\.[cm]?[jt]s|karma\.conf\.js|\.eslintrc[^/]*|eslint\.config\.[cm]?[jt]s|biome\.jsonc?|\.nycrc[^/]*|\.c8rc[^/]*|pyproject\.toml|setup\.cfg|pytest\.ini|tox\.ini|\.coveragerc|\.golangci\.ya?ml|codecov\.ya?ml)$/;
const IS_ESLINT = /(^|\/)(\.eslintrc[^/]*|eslint\.config\.[cm]?[jt]s|biome\.jsonc?|\.golangci\.ya?ml)$/;
const IS_TEST_SETUP = /(^|\/)(setupTests|test-setup|(vitest|jest)\.setup)\.[cm]?[jt]sx?$/;
const CODE_EXT = /\.(m?[jt]sx?|cjs|py|go|rb|java|kt|cs|php|rs|swift|vue|svelte)$/;
// loại MẪU MÃ: chỉ áp cho file mã, trên dòng đã xoá nội dung chuỗi literal
const CODE_ONLY = new Set(['suppression', 'test-dodge', 'type-bypass', 'error-swallow']);
const MÃ_CHO_MẪU = /\.(m?[jt]sx?|cjs|py|go|rb|java|kt|cs|php|rs|swift|vue|svelte|html?|astro)$/;
// chuỗi '…' "…" `…` → rỗng; regex literal JS `/…/` (sau ( = , : [ ! & | ? { } ; => hoặc đầu dòng) → `/_/`
const bỏLiteral = (c) => c.replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '$1$1')
  .replace(/(^|[=(,:[!&|?{};>]\s*)\/(?![/*\s])(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\\[\n])+\/[dgimsuy]*/g, '$1/_/');
// repo toolkit gốc (canon export.srcMarker, install.js cùng cách phân biệt): sửa skill/agent là việc thường ngày ở đây
const SRC_REPO = fs.existsSync(path.join(ROOT, 'example', 'docs', '00-tracking.md')) && fs.existsSync(path.join(ROOT, '.claude', 'skills', 'ba-toolkit'));

const RULES = [
  ['suppression', /eslint-disable|@ts-(ignore|expect-error|nocheck)|#\s*noqa|#\s*type:\s*ignore|pylint:\s*disable|rubocop:\s*disable|@SuppressWarnings|\/\/\s*nolint|\bnolint:|biome-ignore|#pragma\s+warning\s*\(?\s*disable/i],
  ['test-dodge', /\b(it|test|describe|context)\s*\.\s*(only|skip)\s*\(|\b(xit|xdescribe|xtest|fit|fdescribe)\s*\(|@pytest\.mark\.skip|@unittest\.skip|\bt\.Skip\s*\(/],
  ['todo-new', /(\/\/|#|\/\*|<!--)\s*(TODO|FIXME|XXX|HACK)\b/],
  ['secret-like', /\bAKIA[0-9A-Z]{16}\b|\bsk-[A-Za-z0-9_-]{20,}|\bghp_[A-Za-z0-9]{30,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(password|passwd|pwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*["'`][^"'`]{6,}["'`]/i],
  ['tls-bypass', /rejectUnauthorized\s*:\s*false|verify\s*=\s*False|InsecureSkipVerify\s*:\s*true|NODE_TLS_REJECT_UNAUTHORIZED/],
  ['type-bypass', /\bas\s+any\b|\bas\s+unknown\s+as\b/],
  ['error-swallow', /catch\s*(\([^)]*\))?\s*\{\s*\}|except(\s+\w+)?\s*:\s*pass\b/],
  ['hook-bypass', /--no-verify\b/],
];
const TEST_DEF = /^\s*(it|test|describe|context)\s*\(/;
const ASSERT_STRICT = /\.(toBe|toEqual|toStrictEqual|toHaveLength|toContain|toMatch|toHaveBeenCalledWith)\s*\(|assert(Equal|\.equal|\.strictEqual|\.deepEqual)\s*\(/;
const ASSERT_LOOSE = /\.(toBeTruthy|toBeDefined|toBeFalsy|toBeNull|not\.toThrow|resolves\.not\.toThrow)\s*\(|assert(True|\.ok)\s*\(|expect\(true\)\.toBe\(true\)/;
// loại mới đợt 5
const PASS_NO_TESTS = /--?passWithNoTests\b|\bpassWithNoTests["']?\s*[:=]\s*true/;
const CFG_IGNORE = /["']?\b(testPathIgnorePatterns|coveragePathIgnorePatterns|modulePathIgnorePatterns|testIgnore|exclude|omit|norecursedirs|ignorePatterns)\b["']?\s*[:=]|--ignore\b|--exclude\b/;
const CFG_STRICT_OFF = /["']?\b(strict|noImplicitAny|strictNullChecks|noUncheckedIndexedAccess|strictFunctionTypes)\b["']?\s*:\s*false\b/;
const ESLINT_OFF = /:\s*\[?\s*(["']off["']|0)\s*[,\]}]?\s*,?\s*$/;
const THRESH = /["']?\b(branches|functions|lines|statements|fail[_-]under|minimum|threshold)\b["']?\s*[:=]\s*(-?\d+(?:\.\d+)?)/;
const TEST_SCRIPT = /^\s*"test"\s*:\s*"(.*)"\s*,?\s*$/;
const ENV_READ = /process\.env\.(NODE_ENV|CI)\b|process\.env\[\s*['"](NODE_ENV|CI)['"]\s*\]|import\.meta\.env\.MODE\b/;
const LIT_TEST = /['"`]test['"`]/;
const ENV_DODGE = /process\.env\.(CI|JEST_WORKER_ID|VITEST)\b|process\.env\.NODE_ENV\s*[!=]==?\s*['"`]test['"`]|['"`]test['"`]\s*[!=]==?\s*process\.env\.NODE_ENV|import\.meta\.env\.(VITEST\b|MODE\s*[!=]==?\s*['"`]test['"`])|os\.environ(\.get\(\s*|\[\s*)['"](CI|PYTEST_CURRENT_TEST)['"]|os\.Getenv\(\s*"CI"\s*\)|ENV\[\s*['"]CI['"]\s*\]|Rails\.env\.test\?/;
const PLAN_PROT = /^\s*(?:[-*]\s*)?\*\*\s*(Proof|Trace test)\s*:?\s*\*\*|(Definition of Done)/i;

// Miễn `.claude/skills|agents/` khi diff chạm manifest = "đồng bộ install.js". Trước 07/10/2026 chỉ cần CHẠM manifest là miễn —
// review đối kháng tái hiện: vá check-tc-layer.js cho im + sửa một ký tự manifest → protected-edit biến mất, accept NHẬN.
// Nay chỉ miễn khi MỌI file `.claude/skills/` đổi trong diff còn TRÙNG NGUỒN theo integrity.js (cây git repo toolkit hoặc
// manifest đã commit); không kiểm được nguồn → không miễn (hook-review 07/10/2026).
function miễnĐồngBộ(text) {
  if (!/^(\+\+\+ b|--- a)\/\.claude\/ba-toolkit\.json$/m.test(text)) return false;
  const đổi = [...new Set([...text.matchAll(/^(?:\+\+\+ b|--- a)\/(\.claude\/skills\/\S.*)$/gm)].map((m) => m[1].trim()))];
  let ig = miễnĐồngBộ.ig;
  if (ig === undefined) for (const p2 of [path.join(ROOT, '.claude', 'skills', 'ba-toolkit', 'scripts', 'integrity.js'), path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'integrity.js')]) {
    try { ig = require(p2).kiểm(ROOT); break; } catch { ig = null; }
  }
  miễnĐồngBộ.ig = ig;                                     // --per-commit gọi scanDiff nhiều lần — kiểm một lần
  if (!ig || ig.nguon === 'none') return false;
  const lệch = new Set(ig.lech.map((x) => x.file));
  return đổi.every((f) => !lệch.has(f));
}

// Loại bảo vệ của một đường dẫn: 'lines' (plan.md — chỉ dòng Proof/Trace/DoD) · 'file' (một hit mỗi file) · null
function protectedKind(p, syncTouched) {
  if (/^\.claude\/(settings(\.local)?\.json|hooks\/|ac-rules\.jsonl|ba-hook-gate\.json)/.test(p)) return 'file';
  if (/^\.claude\/(skills|agents)\//.test(p)) return SRC_REPO || syncTouched ? null : 'file';
  if (SRC_REPO && /^example\//.test(p)) return null;
  if (/(^|\/)test\.md$/.test(p)) return 'file';
  if (/(^|\/)plan\.md$/.test(p)) return 'lines';
  return null;
}

// tên test từ dòng định nghĩa (it/test/describe/context, kể cả .skip/.only/.each(...))
const TDEF_ANY = /^\s*(?:it|test|describe|context)(?:\s*\.\s*\w+(?:\s*\([^)]*\))?)*\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
/** dòng mã quanh dòng i của diff (bỏ dòng `-`, dừng ở đầu hunk/file) — nhìn literal 'test' gần chỗ đọc env */
function gần(L, i, k) {
  const out = [];
  for (const [bước, lim] of [[-1, i - k], [1, i + k]]) for (let j = i + bước; bước < 0 ? j >= lim : j <= lim; j += bước) {
    const x = L[j]; if (x === undefined || /^(@@|diff --git|\+\+\+ |--- )/.test(x)) break;
    if (!x.startsWith('-')) out.push(x.slice(1));
  }
  return out;
}
const tokens = (s) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
function dice(a, b) {
  const A = tokens(a), B = tokens(b); if (!A.length || !B.length) return 0;
  const đếm = new Map(); for (const t of A) đếm.set(t, (đếm.get(t) || 0) + 1);
  let chung = 0; for (const t of B) if (đếm.get(t) > 0) { chung++; đếm.set(t, đếm.get(t) - 1); }
  return (2 * chung) / (A.length + B.length);
}
/**
 * Ghép cặp đổi tên: mất/mới = [{name, …}] → Map(mới → mất). Thứ tự luật: trùng mã TC → tên chứa tên → chung ≥20 ký tự
 * đầu hoặc cuối → Dice từ ≥ 0,6 (lấy cặp giống nhất) → cùngChỗ(x, n) → (theoThứTự) còn lại bằng số thì ghép theo thứ tự.
 */
function ghépĐổiTên(mất, mới, cùngChỗ, theoThứTự) {
  const cặp = new Map(), dùng = new Set();
  const ids = (n) => n.match(/\bTC-[A-Z0-9]+-\d+\b/g) || [];
  const ghép = (thử) => { for (const n of mới) { if (cặp.has(n)) continue; const x = mất.find((y) => !dùng.has(y) && thử(y.name, n.name, y, n)); if (x) { cặp.set(n, x); dùng.add(x); } } };
  ghép((o, n) => ids(o).some((id) => ids(n).includes(id)));
  ghép((o, n) => o.length > 8 && n.length > 8 && (n.includes(o) || o.includes(n)));
  ghép((o, n) => { let i = 0; while (i < o.length && o[i] === n[i]) i++; let j = 0; while (j < o.length && j < n.length && o[o.length - 1 - j] === n[n.length - 1 - j]) j++; return i >= 20 || j >= 20; });
  for (;;) {                                               // Dice: cặp giống nhất trước
    let tốt = null;
    for (const n of mới) if (!cặp.has(n)) for (const x of mất) if (!dùng.has(x)) { const d = dice(x.name, n.name); if (d >= 0.6 && (!tốt || d > tốt.d)) tốt = { n, x, d }; }
    if (!tốt) break; cặp.set(tốt.n, tốt.x); dùng.add(tốt.x);
  }
  if (cùngChỗ) ghép((o, n, x, y) => cùngChỗ(x, y));
  const cònMất = mất.filter((x) => !dùng.has(x)), cònMới = mới.filter((n) => !cặp.has(n));
  if (theoThứTự && cònMất.length && cònMất.length === cònMới.length) cònMới.forEach((n, i) => cặp.set(n, cònMất[i]));
  return cặp;
}

function scanDiff(text) {
  const hits = [], mechanical = new Set(), coreFiles = new Set();
  let added = 0, removed = 0;
  let file = null, isMech = false, isTest = false, isCfg = false, isCode = false, blk = 0, newLine = 0, minusPath = null, isNew = false, prot = null, protPending = false;
  let hunk = null;                                          // { removedStrict: [], addedLoose: [], … }
  const removedTests = {};                                  // file → [{oldLine, content, name, blk}]
  const addedTests = {};                                    // file → [{name, blk}] (kể cả it.skip/.only — đổi tên kèm skip vẫn là đổi tên)
  const addedLines = {};                                    // file → Set(trimmed)
  const syncTouched = miễnĐồngBộ(text);
  const push = (h) => hits.push(h);

  function closeHunk() {
    if (hunk && hunk.removedStrict.length && hunk.addedLoose.length) {
      for (const h of hunk.addedLoose) push({ file, line: h.line, cat: 'assert-loose', content: h.content, note: `thay cho assert giá trị bị bỏ ở dòng cũ ${hunk.removedStrict[0].oldLine}` });
    }
    if (hunk && prot === 'lines' && !isNew) {
      const còn = {}; for (const r of hunk.protRemoved) còn[r.kind] = (còn[r.kind] || 0) + 1;
      for (const a of hunk.protAdded) { push({ file, line: a.line, cat: 'protected-edit', content: a.content, note: `plan.md ${a.kind} — đề của task, builder không được sửa` }); if (còn[a.kind]) còn[a.kind]--; }
      for (const r of hunk.protRemoved) if (còn[r.kind] > 0) { còn[r.kind]--; push({ file, line: 0, cat: 'protected-edit', content: r.content, note: `plan.md ${r.kind} bị XOÁ (dòng cũ ${r.oldLine})` }); }
    }
    hunk = null;
  }

  const L = text.split('\n');
  for (let i = 0; i < L.length; i++) {
    const line = L[i].replace(/\r$/, '');
    let m;
    if ((m = /^\+\+\+ (?:b\/)?(.+)$/.exec(line))) {
      closeHunk();
      file = m[1].trim();
      if (file === '/dev/null') {                           // file bị xoá: đường dẫn nằm ở `--- a/…`
        const k = minusPath && protectedKind(minusPath, syncTouched);
        if (k) push({ file: minusPath, line: 0, cat: 'protected-edit', content: `xoá file ${minusPath}`, note: 'file được bảo vệ bị xoá' });
        file = null; prot = null; protPending = false; continue;
      }
      isMech = MECHANICAL.test(file); isTest = IS_TEST.test(file); isCfg = IS_CONFIG.test(file); isCode = MÃ_CHO_MẪU.test(file);
      prot = protectedKind(file, syncTouched);
      protPending = prot === 'file' && !(isNew && /(^|\/)test\.md$/.test(file));
      if (isMech) mechanical.add(file); else coreFiles.add(file);
      continue;
    }
    // `--- ` là đầu file chỉ khi dòng kế là `+++ ` (dòng xoá `-- sql` trong hunk cũng bắt đầu bằng `--- `)
    if ((m = /^--- (?:a\/)?(.+)$/.exec(line)) && /^\+\+\+ /.test(L[i + 1] || '')) { closeHunk(); minusPath = m[1].trim(); isNew = minusPath === '/dev/null'; continue; }
    if (/^diff --git /.test(line)) { closeHunk(); minusPath = null; isNew = false; file = null; continue; }
    if (/^--- /.test(line) || /^index /.test(line) || /^(new|deleted) file mode/.test(line)) continue;
    if ((m = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line))) {
      closeHunk();
      blk++; newLine = +m[2]; hunk = { oldLine: +m[1], removedStrict: [], addedLoose: [], protAdded: [], protRemoved: [], thresh: {}, testScript: undefined };
      continue;
    }
    // protected-edit mức file: hit ở dòng đổi đầu tiên (cả file cơ giới — .claude/ nằm trong đó)
    if (file && protPending && /^[+-]/.test(line)) {
      protPending = false;
      push({ file, line: line.startsWith('+') ? newLine : 0, cat: 'protected-edit', content: `sửa ${file}`, note: /test\.md$/.test(file) ? 'test.md = đề kiểm thử; đổi phải qua ba-test/CR' : 'cấu hình/luật của agent — builder không được sửa' });
    }
    if (!file || isMech) { if (file && isMech) { if (line.startsWith('+')) newLine++; } continue; }
    if (line.startsWith('+')) {
      const c = line.slice(1); added++; let mt;
      (addedLines[file] = addedLines[file] || new Set()).add(c.trim());
      // secret-like trong file TEST với dạng `password: 'Abc12345'` là fixture, không phải bí mật — dogfood 15/09/2026:
      // 6/6 phát hiện của một màn đều là ca này. Chỉ giữ secret-like ở test khi khớp mẫu khoá THẬT (AKIA/sk-/ghp_/PRIVATE KEY).
      const cMã = isCode ? bỏLiteral(c) : null;
      for (const [cat, rx] of RULES) if (CODE_ONLY.has(cat) ? isCode && rx.test(cMã) : rx.test(c)) { if (cat === 'secret-like' && isTest && !/\bAKIA|\bsk-|\bghp_|PRIVATE KEY/.test(c)) break; push({ file, line: newLine, cat, content: c.trim().slice(0, 160) }); break; }
      if ((mt = TDEF_ANY.exec(c))) (addedTests[file] = addedTests[file] || []).push({ name: mt[2], blk });
      if (hunk && ASSERT_LOOSE.test(c)) hunk.addedLoose.push({ line: newLine, content: c.trim().slice(0, 160) });
      // config-loosen
      let cl = null;
      if (PASS_NO_TESTS.test(c)) cl = 'passWithNoTests — suite rỗng vẫn xanh';
      else if (isCfg && CFG_IGNORE.test(c)) cl = 'thêm loại trừ/bỏ qua trong cấu hình test/lint';
      else if (isCfg && CFG_STRICT_OFF.test(c)) cl = 'tắt chế độ strict của type-checker';
      else if ((IS_ESLINT.test(file) || /(^|\/)package\.json$/.test(file)) && ESLINT_OFF.test(c) && (IS_ESLINT.test(file) || /["']off["']/.test(c))) cl = 'tắt luật lint';
      else if (isCfg && hunk && (mt = THRESH.exec(c)) && hunk.thresh[mt[1]] !== undefined && +mt[2] < hunk.thresh[mt[1]]) cl = `ngưỡng ${mt[1]} hạ ${hunk.thresh[mt[1]]} → ${mt[2]}`;
      else if (/(^|\/)package\.json$/.test(file) && hunk && (mt = TEST_SCRIPT.exec(c)) && hunk.testScript !== undefined && mt[1] !== hunk.testScript) cl = `script "test" đổi: "${hunk.testScript.slice(0, 50)}" → "${mt[1].slice(0, 50)}"`;
      if (cl) push({ file, line: newLine, cat: 'config-loosen', content: c.trim().slice(0, 160), note: cl });
      if (!isTest && !isCfg && !IS_TEST_SETUP.test(file) && CODE_EXT.test(file)) {
        if (ENV_DODGE.test(c)) push({ file, line: newLine, cat: 'env-dodge', content: c.trim().slice(0, 160), note: 'code non-test rẽ nhánh theo môi trường test/CI' });
        else if (ENV_READ.test(c) && gần(L, i, 3).some((x) => LIT_TEST.test(x))) push({ file, line: newLine, cat: 'env-dodge', content: c.trim().slice(0, 160), note: "đọc NODE_ENV/CI/MODE kèm literal 'test' trong ±3 dòng (includes/switch/so sánh)" });
      }
      if (hunk && prot === 'lines' && (mt = PLAN_PROT.exec(c))) hunk.protAdded.push({ line: newLine, kind: mt[1] || 'DoD', content: c.trim().slice(0, 160) });
      newLine++;
    } else if (line.startsWith('-')) {
      const c = line.slice(1); removed++;
      if (TEST_DEF.test(c)) (removedTests[file] = removedTests[file] || []).push({ oldLine: hunk ? hunk.oldLine : 0, content: c.trim(), name: (TDEF_ANY.exec(c) || [])[2] || c.trim(), blk });
      if (hunk && ASSERT_STRICT.test(c) && !ASSERT_LOOSE.test(c)) hunk.removedStrict.push({ oldLine: hunk.oldLine, content: c.trim() });
      let mt;
      if (hunk && isCfg && (mt = THRESH.exec(c))) hunk.thresh[mt[1]] = +mt[2];
      if (hunk && /(^|\/)package\.json$/.test(file) && (mt = TEST_SCRIPT.exec(c))) hunk.testScript = mt[1];
      if (hunk && prot === 'lines' && (mt = PLAN_PROT.exec(c))) hunk.protRemoved.push({ oldLine: hunk.oldLine, kind: mt[1] || 'DoD', content: c.trim().slice(0, 160) });
      if (hunk) hunk.oldLine++;
    } else if (line.startsWith('\\')) {
      /* no newline at end of file */
    } else {
      blk++; newLine++; if (hunk) hunk.oldLine++;
    }
  }
  closeHunk();
  // test bị xoá: dòng `-` có it(/test( mà không có dòng `+` nào cùng file y nguyên (di chuyển trong file thì bỏ qua),
  // không dời sang file khác (cùng tên thêm ở file khác), không ghép được cặp đổi tên với test thêm cùng file
  const tênThêm = new Set(Object.values(addedTests).flat().map((t) => t.name));
  for (const f of Object.keys(removedTests)) {
    const re = addedLines[f] || new Set();
    const mất = removedTests[f].filter((t) => !re.has(t.content) && !tênThêm.has(t.name));
    const mới = (addedTests[f] || []).filter((t) => !removedTests[f].some((x) => x.name === t.name));
    const cặp = ghépĐổiTên(mất, mới, (x, n) => x.blk === n.blk, false);
    const đãGhép = new Set(cặp.values());
    for (const t of mất) if (!đãGhép.has(t)) hits.push({ file: f, line: 0, cat: 'test-removed', content: t.content.slice(0, 160), note: `dòng cũ ${t.oldLine}` });
  }
  return { hits, added, removed, coreFiles, mechanical };
}

// ── --per-commit: theo dõi từng test qua các commit ─────────────────────────────────────────────
const TDEF_JS = /^\s*(?:it|test)(?:\s*\.\s*(?:only|skip|concurrent|todo|each\s*\([^)]*\)))?\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const TDEF_PY = /^\s*(?:async\s+)?def\s+(test_\w+)\s*\(/;
const TDEF_GO = /^func\s+(Test\w+)\s*\(/;
function testsOf(txt) {
  const out = new Map(); let cur = null;
  const lines = (txt || '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]; let m, name = null;
    if ((m = TDEF_JS.exec(l))) name = m[2]; else if ((m = TDEF_PY.exec(l)) || (m = TDEF_GO.exec(l))) name = m[1];
    if (name !== null) {
      let k = name, n = 2; while (out.has(k)) k = `${name} #${n++}`;
      cur = { name: k, line: i + 1, def: l.trim().slice(0, 160), strict: 0, loose: 0, body: new Set() }; out.set(k, cur);
    }
    if (!cur) continue;
    cur.body.add(l.trim());
    if (ASSERT_LOOSE.test(l)) cur.loose++; else if (ASSERT_STRICT.test(l)) cur.strict++;
  }
  return out;
}
function perCommit(baseHits) {
  const [a, b] = RANGE.split('..');
  const base = (git('rev-parse', '--verify', `${a || 'HEAD'}^{commit}`).stdout || '').trim();
  const rl = git('rev-list', '--reverse', '--no-merges', RANGE);
  if (rl.status !== 0 || !base) { console.error(`git rev-list ${RANGE} thất bại: ${(rl.stderr || '').trim()}`); process.exit(2); }
  const commits = rl.stdout.split('\n').filter(Boolean);
  const show = (rev, f) => { const r = git('show', `${rev}:${f}`); return r.status === 0 ? r.stdout : null; };
  const state = new Map(), seeded = new Set(), out = [], snap = new Map();   // snap: file → tên test theo thứ tự ở ảnh trước
  const short = (s) => s.slice(0, 7);
  for (const sha of commits) {
    const files = (git('diff-tree', '--no-commit-id', '-r', '--name-only', '--root', sha).stdout || '').split('\n').filter((f) => f && IS_TEST.test(f) && !MECHANICAL.test(f));
    for (const f of files) {
      if (!seeded.has(f)) {                                   // trạng thái đầu khoảng = ảnh chụp ở base
        seeded.add(f);
        const đầu = testsOf(show(base, f)); snap.set(f, [...đầu.keys()]);
        for (const [n, t] of đầu) state.set(f + '\u0000' + n, { file: f, name: n, strict: t.strict, loose: t.loose, at: base, added: false, removedAt: null });
      }
      const now = testsOf(show(sha, f));
      // Đổi tên test (thêm mã TC vào tên, sửa câu chữ) KHÔNG phải xoá + thêm — dự án helpdesk 200 commit: 11/11 "thêm rồi xoá" đầu tiên
      // đều là đổi tên. Ghép cặp cái biến mất ↔ cái mới trong CÙNG commit + file: trùng mã TC → tên này chứa tên kia → chung ≥20 ký tự đầu → còn lại
      // bằng nhau về số thì ghép theo thứ tự (sửa tại chỗ). Không ghép được mới là xoá.
      const mất = [...state.values()].filter((x) => x.file === f && !x.removedAt && !now.has(x.name));
      const mới = [...now.keys()].filter((n) => { const x = state.get(f + '\u0000' + n); return !x || x.removedAt; }).map((name) => ({ name }));
      // cùng chỗ = cùng láng giềng còn sống (test đứng ngay trước/sau có mặt ở cả ảnh cũ lẫn mới) — viết lại tại chỗ
      const cũ = snap.get(f) || [], mớiDs = [...now.keys()];
      const sống = new Set(cũ.filter((n) => now.has(n)));
      const lg = (ds, n, bước) => { for (let i = ds.indexOf(n) + bước; i >= 0 && i < ds.length; i += bước) if (sống.has(ds[i])) return ds[i]; return null; };
      const cùngChỗ = (x, y) => { const a = lg(cũ, x.name, -1), b = lg(mớiDs, y.name, -1), c = lg(cũ, x.name, 1), d = lg(mớiDs, y.name, 1); return (a !== null && a === b) || (c !== null && c === d); };
      const cặp = ghépĐổiTên(mất, mới, cùngChỗ, true);           // mới → entry cũ
      const đãGhép = new Set(cặp.values());
      for (const [n, x] of cặp) { state.delete(f + '\u0000' + x.name); x.name = n.name; state.set(f + '\u0000' + n.name, x); }
      for (const x of mất) if (!đãGhép.has(x)) x.removedAt = sha;
      snap.set(f, mớiDs);
      for (const [n, t] of now) {
        const k = f + '\u0000' + n; const s = state.get(k);
        if (!s) { state.set(k, { file: f, name: n, strict: t.strict, loose: t.loose, at: sha, added: true, removedAt: null }); continue; }
        if (s.removedAt) s.removedAt = null;                  // xoá rồi thêm lại cùng tên = còn
        else if (s.strict > t.strict && t.loose > s.loose) {
          const trùng = baseHits.some((h) => h.cat === 'assert-loose' && h.file === f && t.body.has(h.content));
          if (!trùng) out.push({ file: f, line: t.line, cat: 'assert-loose', content: t.def, commit: short(sha), nguồn: 'qua-commit', note: `"${n.slice(0, 60)}": ${s.strict} assert giá trị ở ${short(s.at)} → ${t.strict} ở ${short(sha)}, assert lỏng ${s.loose} → ${t.loose}` });
        }
        Object.assign(s, { strict: t.strict, loose: t.loose, at: sha });
      }
    }
  }
  const cònTên = new Set([...state.values()].filter((s) => !s.removedAt).map((s) => s.name));
  for (const s of state.values()) if (s.added && s.removedAt && !cònTên.has(s.name))
    out.push({ file: s.file, line: 0, cat: 'test-removed', content: s.name.slice(0, 160), commit: short(s.removedAt), nguồn: 'qua-commit', note: `thêm rồi xoá trong khoảng (xoá ở ${short(s.removedAt)}) — diff gộp không thấy` });
  return { commits: commits.length, hits: out, b };
}

const res = scanDiff(diff);
const hits = res.hits;
let pc = null;
if (PER_COMMIT) { pc = perCommit(hits); hits.push(...pc.hits); }
hits.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line));

const { added, removed, coreFiles, mechanical } = res;
const byCat = {}; for (const h of hits) byCat[h.cat] = (byCat[h.cat] || 0) + 1;
const out = { phatHien: hits.length, theoLoai: byCat, dongLoi: { them: added, bo: removed, tong: added + removed }, fileLoi: [...coreFiles], fileCoGioi: [...mechanical], hits };
if (pc) out.perCommit = { commits: pc.commits, phatHien: pc.hits.length };
if (JSON_MODE) console.log(JSON.stringify(out, null, 2));
else {
  for (const h of hits) console.log(`${h.file}:${h.line || '-'}\t${h.cat}${h.commit ? '@' + h.commit : ''}\t${h.content}${h.note ? `\t(${h.note})` : ''}`);
  const cats = Object.entries(byCat).map(([k, v]) => `${k} ${v}`).join(' · ');
  console.log(`scan-bypasses: ${hits.length} phát hiện${cats ? ` (${cats})` : ''} · ${coreFiles.size} file lõi, ${added + removed} dòng lõi (+${added}/−${removed})${added + removed > 400 ? ' — VƯỢT ~400 dòng lõi, orchestrator nên chia theo file' : ''} · ${mechanical.size} file cơ giới bỏ qua${mechanical.size ? ': ' + [...mechanical].join(', ') : ''}${pc ? ` · per-commit: ${pc.commits} commit, ${pc.hits.length} phát hiện qua commit` : ''}`);
}
// Mồi cho agent, không phải cổng (25/09/2026): chạy được = exit 0, số phát hiện ở output. Không process.exit ngay sau
// console.log — --json > 64 KB qua pipe bị cắt (dự án helpdesk 111 hit); để Node tự thoát khi stdout xả xong.
process.exitCode = 0;
