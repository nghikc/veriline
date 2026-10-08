/*
 * ba-toolkit/profile.js — đọc HỒ SƠ DỰ ÁN (project profile). Module, KHÔNG phải CLI.
 *
 * Toolkit có 4 cổng · 6 review agent · 3 sổ · 3 trục soát · 9 file mỗi màn. Dự án 8 màn hai
 * người không cần ngần ấy; ép dùng hết thì người ta bỏ qua cả những thứ đáng giữ. Hồ sơ dự án
 * cho phép khai MỘT LẦN mức đầu tư, rồi mọi script/skill tự nhẹ đi theo.
 *
 *   full (mặc định) — đầy đủ: 9 file/màn + sổ WI + nhật ký thay đổi + đối chiếu code + agent.
 *   lite            — cắt LỚP QUẢN TRỊ, giữ nguyên 9 file/màn + tracking + sổ CR + gate cơ giới.
 *   mini            — cắt tiếp BỘ ARTIFACT: 5 file/màn. Dự án 8 màn: 72 file → 40 file.
 *
 * Ba mức là bậc thang lồng nhau: mini tắt mọi thứ lite tắt, cộng thêm 4 file mỗi màn.
 *
 * VÌ SAO `mini` TÁCH KHỎI `lite`: `lite` cố ý KHÔNG đụng số artifact — nó nói thẳng "9 file/màn
 * là lõi, không cắt". Cắt artifact là quyết định khác hẳn về CHẤT: nó bỏ bớt tầng diễn giải
 * (use case / user story / design-spec / brainstorm) chứ không chỉ bỏ sổ sách. Gộp hai thứ đó
 * vào một mức thì người chọn `lite` vì ngại sổ sách sẽ mất luôn use case mà không hay.
 *
 * KHAI Ở ĐÂU: một dòng trong `docs/00-tracking.md` (file mà mọi script vốn đã đọc — không đẻ
 * thêm file cấu hình, không cần docpath vì tracking luôn ở gốc docs/):
 *
 *     > Hồ sơ dự án: `mini` · chốt 2026-08-17
 *
 * KHÔNG có dòng đó → `full`. Đây là mặc định CỐ Ý: mọi dự án đã cài trước 16/08/2026 giữ
 * nguyên hành vi cũ, nâng cấp toolkit không được lặng lẽ tắt bớt cơ chế — hay artifact — của ai.
 *
 * TRỤC THỨ HAI — PHẠM VI (từ 15/09/2026): hồ sơ trả lời "đầu tư bao nhiêu vào tài liệu", KHÔNG trả
 * lời "có dev hay không". Có dự án đi hết chuỗi tới code, có dự án dừng ở tài liệu BA để đội khác
 * build. Hai trục độc lập: `mini` vẫn có thể dev, `full` vẫn có thể chỉ tài liệu.
 *
 *   full (mặc định) — có dev: plan.md là file bắt buộc của màn, GĐ3 dev-run, GĐ4 ba-accept.
 *   docs            — chỉ tài liệu: bỏ `plan` khỏi bộ file, cột `dev` = `—`, ba-next không bao giờ
 *                     gợi ba-build/dev-run/ba-accept/ba-conformance, hook S3 tắt, GĐ3 = bàn giao tài liệu.
 *
 * Khai cùng dòng (hoặc dòng riêng, vẫn trong 12 dòng đầu):
 *
 *     > Hồ sơ dự án: `lite` · Phạm vi: `docs` · chốt 2026-09-15
 *
 * Không khai = `full`, cùng lý do. Bộ skill bị cắt khi `ba-export --scope docs` là canon
 * `scope.dev.skills` trong conv-registry.md — profile.js không giữ danh sách đó.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const VALUES = ['full', 'lite', 'mini'];
const SCOPES = ['full', 'docs'];
const AUTONOMY = ['paired', 'solo', 'heads-down'];

/** Bộ file mỗi màn theo hồ sơ. Thứ tự = thứ tự cột tracking. Canon: registry screen.files /
 *  profile.mini.files. `e2e` và `checklist` KHÔNG nằm đây (artifact tùy chọn, tracked riêng). */
const FILES_FULL = ['ascii-screen', 'brainstorm', 'srs', 'usecase', 'userstory', 'design-spec', 'html-design', 'test', 'plan'];
const FILES_MINI = ['ascii-screen', 'srs', 'html-design', 'test', 'plan'];

/** 12 dòng đầu của docs/00-tracking.md — chỗ duy nhất được khai hồ sơ/phạm vi. Chặn ở đây thì
 *  một ô bảng lỡ chứa chữ "lite"/"docs" cũng không thể đổi hồ sơ của cả dự án. Không đọc được → ''. */
function head(docsDir) {
  try { return fs.readFileSync(path.join(docsDir, '00-tracking.md'), 'utf8').split('\n').slice(0, 12).join('\n'); }
  catch { return ''; }
}

/** Đọc hồ sơ từ docs/00-tracking.md. Trả 'full' | 'lite' | 'mini'. Không đọc được → 'full'. */
function readProfile(docsDir) {
  const m = head(docsDir).match(/Hồ sơ dự án:\s*`?([a-z]+)`?/i);
  const v = m && m[1].toLowerCase();
  return VALUES.includes(v) ? v : 'full';
}

/** Đọc phạm vi. Trả 'full' | 'docs'. Không khai / không đọc được → 'full' (có dev). */
function readScope(docsDir) {
  const m = head(docsDir).match(/Phạm vi:\s*`?([a-z]+)`?/i);
  const v = m && m[1].toLowerCase();
  return SCOPES.includes(v) ? v : 'full';
}

/** Mức tự chủ của đội agent khi dev (conv-gates.md → "Đội agent"): 'paired' | 'solo' | 'heads-down'.
 *  Khai `> Mức tự chủ: \`solo\`` cùng chỗ với hồ sơ; không khai → mặc định registry `agents.autonomy` (solo).
 *  Mức chỉ đổi độ nói nhiều của orchestrator — KHÔNG nới luật kiểm chứng. */
function readAutonomy(docsDir) {
  const m = head(docsDir).match(/Mức tự chủ:\s*`?([a-z-]+)`?/i);
  const v = m && m[1].toLowerCase();
  return AUTONOMY.includes(v) ? v : 'solo';
}

/** true khi dự án CHỈ làm tài liệu — không plan.md, không dev-run, không nghiệm thu code. */
const isDocsOnly = (docsDir) => readScope(docsDir) === 'docs';

/** true khi dự án chạy chế độ rút gọn (lite HOẶC mini — mini là lite + cắt artifact). */
const isLite = (docsDir) => readProfile(docsDir) !== 'full';

/** true khi dự án cắt cả bộ artifact. */
const isMini = (docsDir) => readProfile(docsDir) === 'mini';

/**
 * Bộ file BA của MỘT màn theo hồ sơ đang khai — dùng thay cho mọi danh sách 9 file hardcode.
 * Script hỏi `screenFiles(docsDir)`, không tự nhớ.
 */
const screenFiles = (docsDir) => {
  const files = (isMini(docsDir) ? FILES_MINI : FILES_FULL).slice();
  // Phạm vi docs: plan.md không tồn tại theo thiết kế — giữ nó trong bộ file thì màn không bao giờ
  // "Hoàn thành" và ba-review chấm thiếu plan là gap ở một dự án không có ai viết code.
  return isDocsOnly(docsDir) ? files.filter(f => f !== 'plan') : files;
};

/**
 * Cơ chế nào TẮT ở chế độ rút gọn. Skill/script hỏi `off(docsDir).backlog` thay vì tự nhớ danh sách.
 * Giữ đúng danh sách này khớp mục "Hồ sơ dự án" của conv-gates.md — lint.js soát.
 */
function off(docsDir) {
  const lite = isLite(docsDir);
  const mini = isMini(docsDir);
  return {
    backlog: lite,      // sổ Work Item 00-backlog.md — việc dev bám cột `dev` + sổ CR
    changelog: lite,    // 00-changelog.md + nhánh change-watch của hook
    conformance: lite,  // đối chiếu code ↔ tài liệu (vẫn chạy tay được khi cần)
    agents: lite,       // review agent — gate chỉ kiểm cơ giới
    usecase: mini,      // usecase.md — luồng chính/ngoại lệ mô tả ngay trong srs.md
    userstory: mini,    // userstory.md — tiêu chí AC (Given-When-Then) nằm trong srs.md
    designspec: mini,   // design-spec.md — ba-html-design đọc thẳng srs + ascii-screen
    brainstorm: mini,   // brainstorm.md — artifact quá trình, không ai tiêu thụ bắt buộc
    dev: isDocsOnly(docsDir), // plan.md · dev-run · ba-accept · S3 · cột `dev` — dự án chỉ tài liệu
  };
}

module.exports = { readProfile, readScope, readAutonomy, isLite, isMini, isDocsOnly, off, screenFiles, VALUES, SCOPES, AUTONOMY, FILES_FULL, FILES_MINI };
