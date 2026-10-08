/*
 * ba-toolkit/testcode.js — gom MÃ TC trong test code của dự án. Module, KHÔNG phải CLI.
 *
 *   const { gomTestCode, TEST_DIRS, TEST_FILE } = require('.../ba-toolkit/scripts/testcode.js');
 *   gomTestCode(root)  →  Map<'TC-S01-07', [{ file: 'tests/…/x.test.ts', line: 12 }, …]>
 *
 * Vì sao có (15/09/2026): luật "test nào mang mã TC nào" từng nằm ở hai chỗ — check-tc-layer.js (cổng tầng
 * TC) và scan-eval.js (chấm điểm) mirror nhau ~15 dòng vì script cũ chạy ngay khi require. Hai bản chép
 * là hai chỗ trôi: đổi thư mục test hay đuôi file ở một bên là bên kia đếm thiếu mà không ai thấy.
 * Đây là nơi giữ luật duy nhất; scan-code.js/ba-trace vẫn tự gom theo cách riêng (nợ, gom dần).
 *
 * gioiHan: chỉ khớp chuỗi `TC-S..-..` (viết rời — dạng gộp `09/10` cố ý KHÔNG khớp, xem dev-run bước 3);
 * bỏ qua node_modules và thư mục ẩn; không hiểu alias/import. File test nhận: `*.test|spec.(ts|js…)` và pytest
 * `test_*.py`/`*_test.py` — Python thì mã đọc ở docstring/comment/chuỗi (cùng luật dòng) hoặc tên hàm
 * `def test_tc_s07_01…` (gạch dưới thay gạch nối). Ngôn ngữ khác (Go `_test.go`, JUnit…) chưa nhận.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// Quét TOÀN gốc (bỏ node_modules/dist/build/.git…) thay vì danh sách thư mục: dự án helpdesk 16/09/2026 có test giao diện ở
// `app/web/src/screens/S15/__tests__` — nằm ngoài `src`/`tests` nên check-tc-layer báo 40 TC UI "chỉ có service" (im oan).
// `opts.dirs` vẫn nhận để giới hạn khi repo quá lớn.
const TEST_DIRS = null;
const BỎ_DIR = /^(node_modules|dist|build|out|coverage|vendor|target|\.venv|venv|__pycache__|\.next|\.nuxt|\.turbo|\.cache)$/;
// W2 OAN-3 07/10/2026: pytest gom `test_*.py`/`*_test.py` — thiếu mẫu này thì P5 (Python, mã TC trong docstring
// `tests/test_settings_page.py:61`) báo 163 TC Auto "chưa test nào mang mã" trong khi 104 mã có test; scan-eval cùng mù.
const TEST_FILE = /(\.(test|spec)\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)|^test_[^/]*\.py|_test\.py)$/;
const TC_RE = /TC-[A-Z]*\d+-\d+/g;
// Tên hàm pytest không chứa được `-`: `def test_tc_s07_01_…` ⇒ TC-S07-01. Chỉ áp cho .py, chỉ ở `def`.
const PY_DEF_TC = /^\s*(?:async\s+)?def\s+test_tc_([a-z]*\d+)_(\d+)(?![0-9])/i;

function gomTestCode(root, opts = {}) {
  const dirs = opts.dirs || TEST_DIRS || ['.'];
  const map = new Map();
  const đi = (d) => {
    let es = [];
    try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      if (BỎ_DIR.test(e.name) || e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) { đi(p); continue; }
      if (!TEST_FILE.test(e.name)) continue;
      const rel = path.relative(root, p).split(path.sep).join('/');
      let txt = ''; try { txt = fs.readFileSync(p, 'utf8'); } catch { continue; }
      const py = e.name.endsWith('.py');
      const ghi = (id, line) => { if (!map.has(id)) map.set(id, []); map.get(id).push({ file: rel, line }); };
      txt.split('\n').forEach((l, i) => {
        for (const m of l.matchAll(TC_RE)) ghi(m[0], i + 1);
        const d = py && PY_DEF_TC.exec(l);
        if (d) ghi(`TC-${d[1].toUpperCase()}-${d[2]}`, i + 1);
      });
    }
  };
  for (const d of dirs) đi(path.join(root, d));
  return map;
}

module.exports = { gomTestCode, TEST_DIRS, TEST_FILE, TC_RE };
