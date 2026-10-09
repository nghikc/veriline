#!/usr/bin/env node
/*
 * ba-toolkit/hook-guard.js — hook `PreToolUse`: chặn ĐỌC file chứa bí mật, và chặn SỬA file hook của toolkit.
 *
 * Dùng (Claude Code tự gọi):  echo '<json>' | node hook-guard.js     (matcher Read|Grep|Glob|Bash|Edit|Write|NotebookEdit)
 * Thủ công:                   node hook-guard.js --check <đường-dẫn>
 *                             node hook-guard.js --check-cmd '<lệnh bash>'
 *
 * ─── VÌ SAO CÓ — và vì sao đây là NGOẠI LỆ DUY NHẤT của luật "không chặn cứng" ─────────────────
 * Mọi phép kiểm khác của toolkit dùng `exit 2` như một CẢNH BÁO: lint là heuristic, chặn cứng
 * một heuristic là làm hỏng những lượt hợp lệ. Ở `PreToolUse`, `exit 2` mang nghĩa khác — Claude
 * Code TỪ CHỐI lệnh gọi đó. Và ở đúng chỗ này, chặn là lựa chọn đúng:
 *
 *   Một cảnh báo sai làm mất vài giây. Một bí mật đã vào context thì KHÔNG rút lại được —
 *   nó nằm trong transcript, có thể đi vào log, và không có nút hoàn tác nào.
 *
 * Hai phía của cán cân không đối xứng, nên ngưỡng cũng không đối xứng.
 *
 * Phần thứ hai (hook-review 07/10/2026): Edit|Write|NotebookEdit lên `hook-*.js`, `settings*.json`,
 * `.claude/ba-toolkit-local.json`, `.claude/ba-hooks.json` bị TỪ CHỐI ở dự án đích. Agent tự tắt được
 * hook kiểm mình (sửa `hook-gate.js` thành `exit 0`, gỡ khối hooks, `disableAllHooks`) thì mọi cổng
 * phía sau mù. Repo nguồn (`example/docs/00-tracking.md` có mặt, canon `export.srcMarker`) được qua —
 * ở đó sửa hook chính là việc.
 *
 * ─── Chống kêu oan ─────────────────────────────────────────────────────────────────────────
 * Chặn theo TÊN FILE, và cố ý CHO QUA các bản mẫu: `.env.example`, `.env.sample`, `.env.template`
 * — chúng sinh ra để đọc, và toolkit còn có luật riêng bắt đối chiếu `.env.example` với biến
 * `E2E_*` (lint check 22). Chặn nhầm chúng là làm hỏng một cổng khác của chính toolkit.
 * `cert.pem`/`public.pem`/`chain.pem` là chứng chỉ công khai — cho qua; `server.pem`, `k.pem` thì chặn.
 *
 * Bash (hook-review 07/10/2026): bản cũ chỉ soi tham số của ~25 động từ "đọc" → `base64 .env`,
 * `sort .env`, `python3 -c "open('.env')"`, `git show HEAD:.env`, `. .env`, `$(cat .env)`… lọt (161 ca
 * review: ~90 lọt). Bản này đảo chiều: soi chuỗi con tên bí mật ở MỌI token, TRỪ (a) danh sách động từ
 * không đọc nội dung (`ls`, `rm`, `test`, `echo`, `git add/commit`…), (b) tham số ĐÍCH của `cp`/`mv`,
 * (c) đích ghi `>`/`>>`, (d) tham số MẪU của grep/rg/sed/awk/jq (`grep .env` là tìm chữ, không đọc file).
 * Lệnh được tách bằng một lexer nhỏ tôn trọng nháy, `\`, chú thích `#`, heredoc, `$(…)`/backtick (soi
 * đệ quy) — nên `git commit -m "…cat .env…"`, `cat README.md # .env`, `echo "x; cat .env"` vẫn qua.
 * Thân heredoc là DỮ LIỆU (giữ ca 3n: `python3 - <<'EOF'` có chuỗi ".env") — trừ khi động từ là shell
 * (`bash <<EOF`) hoặc heredoc không nháy có `$(…)`.
 *
 * Toolkit được `ba-export` phát sang dự án lạ nên phép kiểm này có giá trị phổ quát — nó không
 * biết gì về nghiệp vụ BA, chỉ biết một luật đúng ở mọi repo.
 *
 * ─── gioiHan (nói thẳng) ───────────────────────────────────────────────────────────────────
 * HOOK KHÔNG CHỨNG MINH ĐƯỢC MỘT LỆNH BASH KHÔNG ĐỌC BÍ MẬT. Lớp chặn thật là `permissions.deny`
 * (install.js ghi `Read(<mọi-cấp>/.env)`, `~/.ssh`…) — hook này là lớp thứ hai, bắt lỗi vô ý và mẹo rẻ. Còn lọt, đã biết:
 *  - tên ghép lúc chạy: `cat "$(echo .e)nv"`, `X=.env; cat $X`, `cat $(ls -a | grep en)`, base64/hex giải ngược;
 *  - đọc gián tiếp không nêu tên: `grep -r KEY .` (grep -r có vào file ẩn), `git log -p`, `git grep KEY`,
 *    `docker compose config`, `dotenv -- env`, `env`/`printenv` (biến môi trường không phải file);
 *  - mã trong thân heredoc của trình thông dịch (`python3 - <<EOF … open('.env') … EOF`), mã trong
 *    chương trình awk/sed (`awk '{system("cat .env")}'`), script trong file (`node leak.js`);
 *  - glob quá rộng bị bỏ qua để khỏi oan: `cat *`, `cat *.json` (khớp cả `credentials.json`);
 *  - Grep tool không `path`/`glob` (rg mặc định bỏ file ẩn & gitignore — nhưng không bảo đảm);
 *  - tên không nằm trong danh sách (`config/database.yml`, `wp-config.php`, `.git/config` có token…).
 * Chặn oan, đã biết và chấp nhận: lệnh truyền file bí mật cho chương trình khác (`docker compose
 * --env-file .env up`, `node app.js --env .env`), `sed -i … .env`, `diff .env.example .env` (in nội
 * dung). Ai cần → người dùng chạy tay.
 * Phần sửa hook: chỉ chặn tool Edit|Write|NotebookEdit; `sed -i`/`echo >` qua Bash lên file hook KHÔNG
 * chặn (hook-gate/integrity.js đối soát hash sau) — matcher còn tuỳ settings.json của dự án đích.
 * Hiệu năng: không tiến trình con; vài lstat/realpath mỗi token; < 30 ms.
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const os = require('os');

// Bản mẫu — CHO QUA. Đặt trước danh sách chặn vì thứ tự quyết định kết quả.
const CHO_QUA = /(^|[.\/\\])(env|secrets?|credentials?)\.(example|sample|template|dist)$|\.(example|sample|template)$/i;

// Chứng chỉ công khai đuôi .pem — cho qua (hook-review 07/10/2026: `cert.pem` bị chặn oan).
const PEM_CÔNG_KHAI = /(^|[._-])(cert|certificate|crt|pub|public|chain|fullchain|ca|cacert|bundle)([._-]|$)/i;

const CHẶN = [
  { re: /(^|\/)\.env(\.|~|$)/i, vì: 'file biến môi trường — thường chứa khoá API, chuỗi kết nối CSDL, token' },
  { re: /(^|\/)(\.envrc|\.dev\.vars)$/i, vì: 'file biến môi trường (direnv / wrangler) — chứa khoá' },
  { re: /(^|\/)\.(npmrc|pypirc|netrc|dockercfg|pgpass)$/i, vì: 'file cấu hình mang token/mật khẩu registry hoặc CSDL' },
  { re: /(^|\/)\.aws\/credentials$/i, vì: 'khoá truy cập AWS' },
  { re: /(^|\/)\.ssh\/(id_[a-z0-9]+|.*_key|config)$/i, vì: 'khoá riêng / cấu hình SSH' },
  { re: /(^|\/)(\.docker\/config\.json|\.kube\/config|\.config\/gh\/hosts\.ya?ml)$/i, vì: 'token đăng nhập docker/kubernetes/gh' },
  { re: /(^|\/)(secrets?|\.?credentials)\.(json|ya?ml|toml)$/i, vì: 'file khoá/mật khẩu (secrets/credentials — gồm `~/.claude/.credentials.json`)' },
  { re: /\.tfstate(\.backup)?$/i, vì: 'trạng thái terraform — chứa mật khẩu tài nguyên dạng rõ' },
  { re: /\.pem$/i, trừ: PEM_CÔNG_KHAI, vì: 'khoá riêng (.pem)' },
  { re: /\.(key|p12|pfx|keystore|jks)$/i, vì: 'khoá riêng / kho chứng chỉ' },
  { re: /(^|\/)(service-account|gcp-key|firebase-adminsdk)[^\/]*\.json$/i, vì: 'khoá tài khoản dịch vụ đám mây' },
  { re: /(^|\/)\.git-credentials$/i, vì: 'mật khẩu git lưu sẵn' },
  { re: /(^|\/)(id_rsa|id_ed25519|id_ecdsa|id_dsa)$/i, vì: 'khoá riêng SSH' },
];
// Thư mục mà tìm/đọc cả cụm là đọc khoá (Grep path=~/.ssh, `grep -r x ~/.aws`, `cp -r ~/.ssh b`).
const THƯ_MỤC_MẬT = /(^|\/)(\.ssh|\.aws|\.gnupg|\.kube|\.docker|\.env\.d|\.config\/gh|\.password-store)\/?$/i;
const VÌ_THƯ_MỤC = 'thư mục khoá (ssh/aws/gnupg/kube/docker)';

function soát(fp) {
  if (!fp) return null;
  const p = String(fp).replace(/\\/g, '/');
  const tên = path.basename(p);
  if (CHO_QUA.test(tên) || CHO_QUA.test(p)) return null;      // bản mẫu → cho qua
  for (const c of CHẶN) if (c.re.test(p) && !(c.trừ && c.trừ.test(tên))) return c.vì;
  return null;
}

const NHÀ = os.homedir();
function mởNhà(p) { return p === '~' ? NHÀ : p.startsWith('~/') ? NHÀ + p.slice(1) : p; }

// realpath (hook-review 07/10/2026): `ln -s .env a.txt` rồi Read a.txt lọt vì chỉ soát TÊN. Soát cả tên gốc,
// đường tuyệt đối đã chuẩn hoá (`x/.env.example/../.env`) và đích symlink. File chưa tồn tại → realpath thư mục cha.
function soátThật(fp, cwd, thưMục) {
  if (!fp) return null;
  const s = String(fp);
  let v = soát(s); if (v) return v;
  if (thưMục && THƯ_MỤC_MẬT.test(s.replace(/\\/g, '/'))) return VÌ_THƯ_MỤC;
  const tuyệt = path.resolve(cwd || process.cwd(), mởNhà(s));
  const ứng = [tuyệt];
  try { ứng.push(fs.realpathSync(tuyệt)); }
  catch { try { ứng.push(path.join(fs.realpathSync(path.dirname(tuyệt)), path.basename(tuyệt))); } catch { /* cha cũng vắng */ } }
  for (const u of ứng) {
    v = soát(u); if (v) return v;
    if (thưMục && THƯ_MỤC_MẬT.test(u.replace(/\\/g, '/'))) return VÌ_THƯ_MỤC;
  }
  return null;
}

// ─── glob: `cat .en*`, `.[e]nv`, Grep glob=.env* ─────────────────────────────────────────────
const MẪU_MẬT = ['.env', '.env.local', '.env.production', '.envrc', '.dev.vars', '.npmrc', '.netrc', '.pypirc', '.pgpass',
  '.git-credentials', 'id_rsa', 'id_ed25519', 'server.key', 'server.pem', 'credentials.json', 'secrets.json', 'secrets.yml',
  'terraform.tfstate', 'service-account.json', 'store.p12'];
// glob khớp cả file thường → quá rộng, bỏ qua (chặn `cat *.json` là oan; ghi ở gioiHan).
const VÔ_HẠI = ['package.json', 'README.md', 'index.ts', 'app.js', 'a.txt', 'config.yml', 'main.py', 'style.css',
  'tsconfig.json', '.gitignore', '.eslintrc.json', 'Makefile', 'index.html', 'data.csv', 'x.spec.ts', 'notes'];
function globRe(g) {
  let r = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') r += '.*';
    else if (c === '?') r += '.';
    else if (c === '[') {
      const j = g.indexOf(']', i + 2);
      if (j < 0) { r += '\\['; continue; }
      let lớp = g.slice(i + 1, j); if (lớp[0] === '!') lớp = '^' + lớp.slice(1);
      r += '[' + lớp.replace(/\\/g, '\\\\') + ']'; i = j;
    } else r += c.replace(/[.+^${}()|\\]/g, '\\$&');
  }
  try { return new RegExp('^' + r + '$', 'i'); } catch { return null; }
}
function kiểmGlob(g) {
  const k = g.lastIndexOf('/');
  const dir = k >= 0 ? g.slice(0, k) : '', base = g.slice(k + 1);
  if (dir && !/[*?[]/.test(dir) && THƯ_MỤC_MẬT.test(dir)) return VÌ_THƯ_MỤC;
  if (!base) return null;
  const re = globRe(base); if (!re) return null;
  if (VÔ_HẠI.some((n) => re.test(n))) return null;
  for (const n of MẪU_MẬT) if (re.test(n)) { const v = soát(n); if (v) return v; }
  return null;
}
// Mở ngoặc nhọn một tầng: `.{env,x}` → `.env`, `.x` (tối đa 32 bản).
function mởNgoặc(w) {
  const m = /^(.*?)\{([^{}]*,[^{}]*)\}(.*)$/.exec(w);
  if (!m) return [w];
  return m[2].split(',').slice(0, 32).flatMap((x) => mởNgoặc(m[1] + x + m[3])).slice(0, 32);
}
// Một token → các mảnh đường dẫn (`HEAD:.env`, `--file=.env`, `open('.env')`, `$HOME/.env`).
function kiểmMảnh(w, ctx) {
  for (const bản of mởNgoặc(String(w))) {
    for (const m of bản.split(/[\s:=,;'"()<>{}|&$`\u0000]+/)) {
      if (!m || m[0] === '-') continue;
      const v = /[*?[]/.test(m) ? kiểmGlob(m) : soátThật(m, ctx.cwd, true);
      if (v) return { vì: v, fp: m };
    }
  }
  return null;
}

// ─── lexer bash tối giản ─────────────────────────────────────────────────────────────────────
// Trả { lệnh: [{ từ, chuyển: [{op, t}], ống, heredoc: [{thân, nháy}] }], con: [chuỗi $(…)/`…`] }.
function bắtNgoặc(s, i) { // s[i] ngay sau '(' — trả [nội dung, chỉ số sau ')']
  let sâu = 1, j = i;
  for (; j < s.length; j++) {
    const c = s[j];
    if (c === '\\') { j++; continue; }
    if (c === "'") { const k = s.indexOf("'", j + 1); j = k < 0 ? s.length : k; continue; }
    if (c === '"') { for (j++; j < s.length && s[j] !== '"'; j++) if (s[j] === '\\') j++; continue; }
    if (c === '(') sâu++;
    else if (c === ')' && --sâu === 0) return [s.slice(i, j), j + 1];
  }
  return [s.slice(i), s.length];
}
function bắtHuyền(s, i) { // s[i] ngay sau '`'
  let j = i; for (; j < s.length && s[j] !== '`'; j++) if (s[j] === '\\') j++;
  return [s.slice(i, j), j + 1];
}
function conTrongChuỗi(s, con) { // heredoc không nháy: `$(…)` và backtick vẫn chạy
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\') { i++; continue; }
    if (s[i] === '$' && s[i + 1] === '(') { const [t, j] = bắtNgoặc(s, i + 2); con.push(t); i = j - 1; }
    else if (s[i] === '`') { const [t, j] = bắtHuyền(s, i + 1); con.push(t); i = j - 1; }
  }
}
function lex(s) {
  const lệnh = [], con = [];
  let ống = 0, cur = { từ: [], chuyển: [], ống, heredoc: [] }, từ = null, nháy = false, chờChuyển = null;
  const chờHd = [];
  const hếtTừ = () => {
    if (từ === null) return;
    if (chờChuyển) {
      cur.chuyển.push({ op: chờChuyển, t: từ });
      if (chờChuyển === '<<' || chờChuyển === '<<-') chờHd.push({ cmd: cur, delim: từ, nháy, bỏTab: chờChuyển === '<<-' });
      chờChuyển = null;
    } else cur.từ.push(từ);
    từ = null; nháy = false;
  };
  const hếtLệnh = (sep) => {
    hếtTừ();
    if (cur.từ.length || cur.chuyển.length) lệnh.push(cur);
    if (sep !== '|') ống++;
    cur = { từ: [], chuyển: [], ống, heredoc: [] };
  };
  const thêm = (x) => { từ = (từ === null ? '' : từ) + x; };
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s[i];
    if (c === ' ' || c === '\t') { hếtTừ(); i++; continue; }
    if (c === '\n') {
      hếtLệnh('\n'); i++;
      while (chờHd.length) {                                            // thân heredoc: từ dòng kế tới dòng delimiter
        const hd = chờHd.shift(); const dòng = [];
        while (i < n) {
          let e = s.indexOf('\n', i); if (e < 0) e = n;
          const l = s.slice(i, e); i = e + 1;
          if ((hd.bỏTab ? l.replace(/^\t+/, '') : l) === hd.delim) break;
          dòng.push(l);
        }
        hd.cmd.heredoc.push({ thân: dòng.join('\n'), nháy: hd.nháy });
      }
      continue;
    }
    if (c === '#' && từ === null) { while (i < n && s[i] !== '\n') i++; continue; }
    if (c === '\\') { if (s[i + 1] === '\n') { i += 2; continue; } thêm(s[i + 1] || ''); nháy = true; i += 2; continue; }
    if (c === "'") { const k = s.indexOf("'", i + 1); const e = k < 0 ? n : k; thêm(s.slice(i + 1, e)); nháy = true; i = e + 1; continue; }
    if (c === '"') {
      nháy = true; thêm(''); i++;
      while (i < n && s[i] !== '"') {
        if (s[i] === '\\' && /[$`"\\\n]/.test(s[i + 1] || '')) { if (s[i + 1] !== '\n') thêm(s[i + 1]); i += 2; continue; }
        if (s[i] === '$' && s[i + 1] === '(') { const [t, j] = bắtNgoặc(s, i + 2); con.push(t); thêm('\u0000'); i = j; continue; }
        if (s[i] === '`') { const [t, j] = bắtHuyền(s, i + 1); con.push(t); thêm('\u0000'); i = j; continue; }
        thêm(s[i]); i++;
      }
      i++; continue;
    }
    if (c === '$' && s[i + 1] === '(') { const [t, j] = bắtNgoặc(s, i + 2); con.push(t); thêm('\u0000'); i = j; continue; }
    if (c === '`') { const [t, j] = bắtHuyền(s, i + 1); con.push(t); thêm('\u0000'); i = j; continue; }
    if ((c === '<' || c === '>') && s[i + 1] === '(' && từ === null) { const [t, j] = bắtNgoặc(s, i + 2); con.push(t); thêm('\u0000'); i = j; continue; }
    if (c === '<' || c === '>' || (c === '&' && s[i + 1] === '>')) {
      if (từ !== null && /^\d+$/.test(từ) && !nháy) từ = null;        // `2>` — số là fd, không phải từ
      hếtTừ();
      const op = /^(<<<|<<-|<<|<>|<&|<|&>>|&>|>>|>&|>\||>)/.exec(s.slice(i))[1];
      chờChuyển = op; i += op.length; continue;
    }
    if (c === ';' || c === '&' || c === '|' || c === '(' || c === ')') {
      const op = /^(&&|\|\||;;|\|&|[;&|()])/.exec(s.slice(i))[1];
      hếtLệnh(op === '|' || op === '|&' ? '|' : op); i += op.length; continue;
    }
    thêm(c); i++;
  }
  hếtLệnh('');
  return { lệnh, con };
}

// ─── phân loại động từ ───────────────────────────────────────────────────────────────────────
// Không đọc nội dung file → tham số của chúng không soát (đích `>` cũng không). `<` vẫn soát.
const KHÔNG_ĐỌC = new Set(['ls', 'll', 'la', 'exa', 'eza', 'stat', 'test', '[', '[[', 'rm', 'rmdir', 'unlink', 'trash', 'touch', 'mkdir',
  'chmod', 'chown', 'chgrp', 'ln', 'wc', 'du', 'df', 'file', 'realpath', 'readlink', 'basename', 'dirname', 'which', 'type', 'whence',
  'true', 'false', ':', 'cd', 'pushd', 'popd', 'pwd', 'echo', 'printf', 'export', 'unset', 'sleep', 'exit', 'return', 'set', 'shopt',
  'mkfifo', 'tree', 'lsof', 'kill', 'pkill', 'ps']);
const GIT_KHÔNG_ĐỌC = new Set(['add', 'commit', 'rm', 'mv', 'status', 'check-ignore', 'ls-files', 'restore', 'switch', 'checkout', 'branch',
  'push', 'pull', 'fetch', 'init', 'clone', 'tag', 'reset', 'merge', 'rebase', 'remote', 'worktree', 'clean', 'revert', 'cherry-pick',
  'rev-parse', 'log', 'stash', 'config', 'update-index']);
const TỪ_KHOÁ = /^(if|then|else|elif|fi|do|done|while|until|for|in|case|esac|select|function|\{|\}|!|coproc)$/;
const TIỀN_TỐ = /^(sudo|env|nohup|nice|time|command|builtin|exec|timeout|stdbuf|caffeinate|doas)$/;
const GÁN = /^[A-Za-z_][A-Za-z0-9_]*\+?=/;
const SHELL = /^(bash|sh|zsh|dash|ksh|fish)$/;

// Tham số của grep/rg/sed/awk/jq: tham số vị trí ĐẦU là mẫu/chương trình, không phải file — trừ khi đã có -e/-f.
const KIỂU_MẪU = {
  grep: { mẫu: ['-e', '--regexp'], file: ['-f', '--file'], giáTrị: ['-A', '-B', '-C', '-m', '-d', '-D', '--max-count', '--context', '--color', '--colour', '--label'], glob: ['--include'], bỏGlob: ['--exclude', '--exclude-dir', '--exclude-from'] },
  rg: { mẫu: ['-e', '--regexp'], file: ['-f', '--file'], giáTrị: ['-A', '-B', '-C', '-m', '-j', '-M', '-t', '-T', '--type', '--type-not', '--max-depth', '--max-count', '--color', '--colors', '-r', '--replace', '-E', '--encoding', '--sort', '--sortr'], glob: ['-g', '--glob', '--iglob'], bỏGlob: [] },
  sed: { mẫu: ['-e', '--expression'], file: ['-f', '--file'], giáTrị: ['-l'], glob: [], bỏGlob: [] },
  awk: { mẫu: [], file: ['-f'], giáTrị: ['-v', '-F'], glob: [], bỏGlob: [] },
  jq: { mẫu: [], file: ['-f', '--from-file', '--slurpfile', '--rawfile'], giáTrị: ['--arg', '--argjson', '--indent'], glob: [], bỏGlob: [] },
};
const HỌ_MẪU = { grep: 'grep', egrep: 'grep', fgrep: 'grep', zgrep: 'grep', ggrep: 'grep', rg: 'rg', ag: 'rg', ack: 'rg', sed: 'sed', gsed: 'sed', awk: 'awk', gawk: 'awk', mawk: 'awk', nawk: 'awk', jq: 'jq', yq: 'jq' };

function soátKiểu(t) { return t && /^(env|dotenv|secrets?|pem|keys?|certs?|credentials?)$/i.test(String(t)) ? 'loại file khoá (`type`)' : null; }
function soátTham(họ, args, ctx) {
  const k = KIỂU_MẪU[họ];
  let cóMẫu = false, vịTríĐầu = true, hếtTuỳChọn = false;
  const cần = [];                                                    // token phải soát
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!hếtTuỳChọn && a === '--') { hếtTuỳChọn = true; continue; }
    if (!hếtTuỳChọn && a.length > 1 && a[0] === '-') {
      const [tên, giá] = a.startsWith('--') && a.includes('=') ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a, null];
      const lấy = () => (giá !== null ? giá : args[++i]);
      if (k.mẫu.includes(tên)) { cóMẫu = true; lấy(); }
      else if (k.file.includes(tên)) { cóMẫu = true; cần.push(lấy() || ''); }
      else if (k.glob.includes(tên)) { const g = lấy() || ''; if (g[0] !== '!') cần.push(g); }
      else if ((tên === '-t' || tên === '--type') && họ === 'rg') { const t = lấy(); if (soátKiểu(t)) return { vì: soátKiểu(t), fp: 'type ' + t }; }
      else if (k.bỏGlob.includes(tên) || k.giáTrị.includes(tên)) lấy();
      else if (họ === 'grep' && /^-[A-Za-z]*e$/.test(a)) { cóMẫu = true; i++; }  // `-re PAT`
      else if (họ === 'grep' && /^-[A-Za-z]*f$/.test(a)) { cóMẫu = true; cần.push(args[++i] || ''); }
      else if (giá !== null) cần.push(giá);
      continue;
    }
    if (vịTríĐầu && !cóMẫu) { vịTríĐầu = false; continue; }          // mẫu/chương trình — không phải file
    vịTríĐầu = false;
    cần.push(a);
  }
  for (const a of cần) { const r = kiểmMảnh(a, ctx); if (r) return r; }
  return null;
}

function bỏĐầu(từ) { // bỏ từ khoá, phép gán, tiền tố (sudo -u x, env -i A=1, timeout 5, nice -n 5)
  let i = 0;
  while (i < từ.length) {
    const w = từ[i];
    if (TỪ_KHOÁ.test(w) || GÁN.test(w)) { i++; continue; }
    if (TIỀN_TỐ.test(path.basename(w)) && i + 1 < từ.length) {
      const tt = path.basename(w); i++;
      while (i < từ.length && (từ[i][0] === '-' || GÁN.test(từ[i]) || (tt === 'timeout' && /^\d/.test(từ[i])))) {
        if (/^-(u|g|n|C|p|h)$/.test(từ[i]) && tt !== 'command') i++;
        i++;
      }
      continue;
    }
    break;
  }
  return i;
}

function soátMộtLệnh(cmd, ctx, sâu) {
  for (const r of cmd.chuyển) {                                       // `cat < .env`, `while …; done < .env`
    if (r.op === '<' || r.op === '<>') { const v = kiểmMảnh(r.t, ctx); if (v) return v; }
  }
  const từ = cmd.từ;
  const k = bỏĐầu(từ);
  if (k >= từ.length) return null;
  const động = path.basename(từ[k]);
  let args = từ.slice(k + 1);
  for (const hd of cmd.heredoc) {                                     // thân heredoc = dữ liệu, trừ shell đọc nó như script
    if (SHELL.test(động)) { const v = soátLệnh(hd.thân, ctx, sâu + 1); if (v) return v; }
  }
  if (KHÔNG_ĐỌC.has(động)) return null;
  if (động === 'find' && !args.some((a) => /^-(exec|execdir|ok|okdir)$/.test(a))) return null;
  if (động === 'git') {
    let i = 0;
    while (i < args.length && args[i][0] === '-') { if (/^-(C|c)$/.test(args[i])) i++; i++; }
    const sub = args[i] || '';
    const rest = args.slice(i + 1);
    if (sub === 'grep') return soátTham('grep', rest, ctx);
    const inNộiDung = (sub === 'log' && rest.some((a) => /^(-p|-u|--patch|-L.*|--full-diff)$/.test(a))) || (sub === 'stash' && rest[0] === 'show');
    if (GIT_KHÔNG_ĐỌC.has(sub) && !inNộiDung) return null;
  }
  if (động === 'cp' || động === 'mv' || động === 'install') {        // tham số ĐÍCH không soát: `cp .env.example .env`
    const tIdx = args.findIndex((a) => a === '-t' || a.startsWith('--target-directory'));
    if (tIdx >= 0) args = args.filter((_, i) => i !== tIdx && !(args[tIdx] === '-t' && i === tIdx + 1));
    else { const vt = args.map((a, i) => (a[0] === '-' ? -1 : i)).filter((i) => i >= 0); if (vt.length >= 2) args = args.filter((_, i) => i !== vt[vt.length - 1]); }
  }
  for (const r of cmd.chuyển) if (r.op === '<<<') { const v = kiểmMảnh(r.t, ctx); if (v) return v; }
  if (HỌ_MẪU[động]) return soátTham(HỌ_MẪU[động], args, ctx);
  for (const a of args) { const v = kiểmMảnh(a, ctx); if (v) return v; }
  return null;
}

function soátLệnh(src, ctx, sâu = 0) {
  if (sâu > 6 || !src) return null;
  const { lệnh, con } = lex(String(src));
  for (const c of con) { const v = soátLệnh(c, ctx, sâu + 1); if (v) return v; }      // `$(cat .env)`, `echo \`cat .env\``
  for (const cmd of lệnh) {
    for (const hd of cmd.heredoc) if (!hd.nháy) { const cc = []; conTrongChuỗi(hd.thân, cc); for (const c of cc) { const v = soátLệnh(c, ctx, sâu + 1); if (v) return v; } }
  }
  // `echo .env | xargs cat`: có xargs trong ống → mọi token của cả ống đều có thể thành tên file được đọc.
  const ống = new Map();
  for (const cmd of lệnh) { if (!ống.has(cmd.ống)) ống.set(cmd.ống, []); ống.get(cmd.ống).push(cmd); }
  for (const nhóm of ống.values()) {
    if (nhóm.length < 2 || !nhóm.some((c) => path.basename(c.từ[bỏĐầu(c.từ)] || '') === 'xargs')) continue;
    for (const c of nhóm) for (const w of c.từ.slice(bỏĐầu(c.từ) + 1)) { const v = kiểmMảnh(w, ctx); if (v) return v; }
  }
  for (const cmd of lệnh) { const v = soátMộtLệnh(cmd, ctx, sâu); if (v) return v; }
  return null;
}

// ─── sửa file hook (Edit|Write|NotebookEdit) ─────────────────────────────────────────────────
const FILE_HOOK = /(^|\/)\.claude\/((.*\/)?hook-[^\/]*\.js|settings[^\/]*\.json|ba-toolkit-local\.json|ba-hooks\.json)$/i;
function làNguồn(dir) { try { return !!dir && fs.existsSync(path.join(dir, 'example', 'docs', '00-tracking.md')); } catch { return false; } } // canon export.srcMarker
function soátSửa(fp, ctx) {
  if (!fp) return null;
  const tuyệt = path.resolve(ctx.cwd, mởNhà(String(fp)));
  let thật = tuyệt; try { thật = fs.realpathSync(tuyệt); } catch { /* file mới */ }
  const hit = [tuyệt, thật].map((x) => x.replace(/\\/g, '/')).find((x) => FILE_HOOK.test(x));
  if (!hit) return null;
  const gốcFile = hit.slice(0, hit.lastIndexOf('/.claude/'));
  if (làNguồn(ctx.gốc) || làNguồn(gốcFile)) return null;            // repo nguồn: sửa hook chính là việc
  return 'file hook/cấu hình hook của toolkit — agent sửa được nó là tắt được cổng kiểm chính mình';
}

module.exports = { soát, soátThật, soátLệnh, soátSửa, lex };

if (require.main === module) {
  const ctx0 = { cwd: process.cwd(), gốc: process.env.CLAUDE_PROJECT_DIR || process.cwd() };
  if (process.argv.includes('--check')) {
    const fp = process.argv[process.argv.indexOf('--check') + 1];
    const v = soátThật(fp, ctx0.cwd);
    console.log(v ? `CHẶN — ${v}` : 'cho qua');
    process.exit(v ? 2 : 0);
  }
  if (process.argv.includes('--check-cmd')) {
    const r = soátLệnh(process.argv[process.argv.indexOf('--check-cmd') + 1], ctx0);
    console.log(r ? `CHẶN \`${r.fp}\` — ${r.vì}` : 'cho qua');
    process.exit(r ? 2 : 0);
  }

  let raw = '';
  process.stdin.on('data', (c) => { raw += c; });
  process.stdin.on('end', () => {
    // Bộ đếm FG (dùng chung `ghiThốngKê` của hook-gate.js): gọi = có đường dẫn/lệnh để soát, bắn = đã từ chối.
    // Hook này nổ ở MỌI Read/Grep/Bash nên chỉ một lần đọc-ghi JSON nhỏ lúc thoát; hỏng → im.
    const cờ = {};
    process.on('exit', () => { try { require('./hook-gate.js').ghiThốngKê('hook-guard', !!cờ.goi, cờ.goi ? { FG: cờ } : {}); } catch { /* phụ */ } });
    let j, ti;
    try { j = JSON.parse(raw); ti = (j && j.tool_input) || {}; } catch { process.exit(0); }
    const tool = j.tool_name || '';
    const cwd = (typeof j.cwd === 'string' && j.cwd) || process.cwd();
    const ctx = { cwd, gốc: process.env.CLAUDE_PROJECT_DIR || cwd };
    const fp = ti.file_path || ti.notebook_path || ti.path || '';
    const cmd = ti.command || '';
    if (fp || cmd || ti.glob) cờ.goi = true;

    let vì = null, đích = fp, sửa = false;
    if (/^(Edit|Write|NotebookEdit|MultiEdit)$/.test(tool)) { vì = soátSửa(fp, ctx); sửa = !!vì; }
    // Write ghi đè, không đưa nội dung cũ vào context → không soát bí mật; Edit/NotebookEdit trả trích đoạn file → soát.
    if (!vì && tool !== 'Write') vì = soátThật(fp, cwd, tool === 'Grep');
    if (!vì && tool === 'Grep') {                                     // hook-review 07/10/2026: glob/type từng lọt
      for (const g of mởNgoặc(String(ti.glob || ''))) { if (g && (vì = kiểmGlob(g))) { đích = g; break; } }
      if (!vì && (vì = soátKiểu(ti.type))) đích = 'type=' + ti.type;
    }
    if (!vì && cmd) { const r = soátLệnh(cmd, ctx); if (r) { vì = r.vì; đích = r.fp; } }

    if (!vì) process.exit(0);
    cờ.ban = true;
    if (sửa) {
      process.stderr.write(
        `[Veriline · chặn sửa cấu hình hook] TỪ CHỐI sửa \`${đích}\` — ${vì} (FG).\n`
        + '  Đổi hook/cấu hình hook ở dự án đích là việc của NGƯỜI: sửa tay, hoặc cập nhật toolkit bằng\n'
        + '  `ba-export` (install.js). Ngưỡng/công tắc riêng → nhờ người dùng sửa `.claude/ba-hooks.json`.\n');
    } else {
      process.stderr.write(
        `[Veriline · chặn đọc file bí mật] TỪ CHỐI đọc \`${đích}\` — ${vì} (FG).\n`
        + '  Đây là phép kiểm DUY NHẤT của toolkit chặn cứng thay vì cảnh báo: một cảnh báo sai mất vài\n'
        + '  giây, còn một bí mật đã vào context thì không rút lại được.\n'
        + '  Cần giá trị trong đó → hỏi người dùng, hoặc đọc bản mẫu (`.env.example`) vốn được cho qua.\n');
    }
    process.exit(2);
  });
}
