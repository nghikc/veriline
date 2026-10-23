/* ba-canvas — runtime dùng chung (ba-html-design/scripts/canvas.js chép NGUYÊN VĂN file này vào trang đích).
 * Hai kiểu trang:
 *   - wireframe   : Ho-so/wireframe.html — dựng canvas từ BẢN SAO các section `data-screen`; hàng "Bản chốt" rồi một hàng
 *                   mỗi chữ phương án; nút "Chọn phương án này"; kết quả `S02: B`.
 *   - gallery     : Ho-so/design-canvas.html — đọc JSON `#cv-data` (mỗi màn một html-design nhúng); nút Duyệt / Cần sửa;
 *                   kết quả `S03: duyệt` / `S04: cần sửa — <ghi chú>`.
 * Luật khi sửa file này: CHỈ màu thang xám, không đổ bóng, không dải màu chuyển, không ký tự biểu tượng/emoji, không
 * tham chiếu tài nguyên ngoài — nó nằm trong wireframe lo-fi và check-wireframe soát cả khối này.
 * Không đụng DOM gốc của trang: canvas là một lớp phủ; "Danh sách" gỡ lớp phủ là trang cũ nguyên vẹn. */
(function () {
  'use strict';
  if (window.__baCanvas) return;
  window.__baCanvas = true;
  var D = document;

  var DATA_EL = D.getElementById('cv-data');
  var MODE = DATA_EL ? 'gallery' : 'wireframe';
  var KEY = 'ba-canvas:' + MODE + ':' + location.pathname;
  function loadPick() { try { var v = JSON.parse(localStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
  function savePick() { try { localStorage.setItem(KEY, JSON.stringify(pick)); } catch (e) { /* không có bộ nhớ trình duyệt thì vẫn chạy */ } }
  var pick = loadPick();

  var GAP_X = 120, ROW_GAP = 640, FIRST_TOP = 0, SPEC_GAP = 48, SPEC_W = 560;
  var SPECS = {};       // mã màn → nội dung khung Spec (máy lấy theo truy vết lúc sinh — canvas.js), không có thì {}
  try { var sj = D.getElementById('cv-spec'); if (sj) SPECS = JSON.parse(sj.textContent) || {}; } catch (e) { SPECS = {}; }
  var ZMIN = 0.04, ZMAX = 4;

  function el(tag, attrs, kids) {
    var n = D.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'cls') n.className = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? D.createTextNode(c) : c); });
    return n;
  }
  function btn(text, attrs) { var a = attrs || {}; a.type = 'button'; return el('button', a, [text]); }

  /* ───────────── Mô hình: hàng · khung ───────────── */
  var rows = [];        // [{title, note, cells:[{col, frame|null}]}]
  var cols = [];        // wireframe: một cột mỗi màn (giữ thẳng cột qua các hàng)
  var screens = [];

  function headStyles() {
    var out = [];
    D.querySelectorAll('style, link[rel~="stylesheet"]').forEach(function (n) { if (n.id !== 'cv-style') out.push(n.outerHTML); });
    return out.join('\n');
  }
  var FRAME_CSS = '<style>html,body{margin:0 !important;min-height:0 !important;height:auto !important}body{padding:24px !important;background:#fff !important}.wf-screen{margin:0 !important;max-width:none !important}</style>';

  var LEGEND_SEL = 'table, [class*="legend"], [class*="chu-giai"]';
  function findLegend(root) { // bảng chú giải # dưới màn: bảng/khối "legend" không chứa khối data-el, nằm ngoài phương án
    var c = Array.prototype.slice.call(root.querySelectorAll(LEGEND_SEL)).filter(function (t) {
      return !t.querySelector('[data-el]') && !t.closest('[data-el]') && !t.closest('.wf-variant');
    });
    c = c.filter(function (t) { return !c.some(function (o) { return o !== t && o.contains(t); }); });
    return c.length ? c[c.length - 1] : null;
  }
  function screenName(sec, code) {
    var h = sec.querySelector('h1, h2, h3, h4');
    if (!h) return code;
    var c = h.cloneNode(true);
    c.querySelectorAll('a, small, .wf-links, nav').forEach(function (x) { x.remove(); });
    var t = c.textContent.replace(/\s+/g, ' ').trim();
    t = t.replace(new RegExp('^' + code + '\\s*[—–:\\-]\\s*'), '').replace(/[\s·|]+$/, '').trim();
    return t || code;
  }

  function buildWireframe() {
    var secs = Array.prototype.slice.call(D.querySelectorAll('section[data-screen]')).filter(function (s) { return !s.closest('#cv-root'); });
    screens = secs.map(function (sec) {
      var code = sec.getAttribute('data-screen');
      var vEls = Array.prototype.slice.call(sec.querySelectorAll('.wf-variant')).filter(function (v) { return v.closest('section[data-screen]') === sec; });
      var variants = vEls.length >= 2 ? vEls.map(function (v) {
        return { letter: (v.getAttribute('data-variant') || '?').trim(), reason: v.getAttribute('data-reason') || '', rec: v.hasAttribute('data-recommended'), chosen: v.hasAttribute('data-chosen') };
      }) : [];
      var lg = findLegend(sec);
      return { code: code, name: screenName(sec, code), width: parseInt(sec.getAttribute('data-width'), 10) || 1280, sec: sec, variants: variants, legend: lg ? lg.outerHTML : '', spec: SPECS[code] || null };
    });
    cols = screens.map(function (s) { return { width: s.width + (s.spec ? SPEC_GAP + SPEC_W : 0) }; });
    var final = { title: 'Bản chốt', note: 'mỗi màn một bố cục — đã chốt, đang chọn hoặc khuyên dùng', cells: [] };
    screens.forEach(function (s, i) { final.cells.push({ col: i, frame: finalFrame(s) }); });
    rows = [final];
    var letters = [];
    screens.forEach(function (s) { s.variants.forEach(function (v) { if (letters.indexOf(v.letter) < 0) letters.push(v.letter); }); });
    letters.sort();
    letters.forEach(function (L) {
      var r = { title: 'Phương án ' + L, note: '', cells: [] };
      screens.forEach(function (s, i) {
        var v = s.variants.filter(function (x) { return x.letter === L; })[0];
        r.cells.push({ col: i, frame: v ? variantFrame(s, v) : null });
      });
      rows.push(r);
    });
  }
  function effChoice(s) { // dòng kết quả: lựa chọn trên trình duyệt > data-chosen > khuyên dùng
    var p = pick[s.code];
    if (p && s.variants.some(function (v) { return v.letter === p; })) return p;
    var c = s.variants.filter(function (v) { return v.chosen; })[0] || s.variants.filter(function (v) { return v.rec; })[0] || s.variants[0];
    return c ? c.letter : '';
  }
  function finalVariant(s) { // hàng Bản chốt: data-chosen > đang chọn > khuyên dùng
    if (!s.variants.length) return null;
    var c = s.variants.filter(function (v) { return v.chosen; })[0];
    if (c) return { v: c, how: 'đã chốt' };
    var p = s.variants.filter(function (v) { return v.letter === pick[s.code]; })[0];
    if (p) return { v: p, how: 'đang chọn — chưa ghi' };
    var r = s.variants.filter(function (v) { return v.rec; })[0];
    return r ? { v: r, how: 'khuyên dùng' } : { v: s.variants[0], how: 'phương án đầu' };
  }
  function frameHtml(s, letter) {
    var c = s.sec.cloneNode(true);
    c.querySelectorAll('script').forEach(function (x) { x.remove(); });
    if (letter !== null) c.querySelectorAll('.wf-variant').forEach(function (x) { if ((x.getAttribute('data-variant') || '?').trim() !== letter) x.remove(); });
    Array.prototype.slice.call(c.children).forEach(function (ch) { if (/^H[1-4]$/.test(ch.tagName)) ch.remove(); });
    var lg = findLegend(c); if (lg) lg.remove();
    c.querySelectorAll('a[href*="' + s.code + '="]').forEach(function (a) {
      var p = a.parentElement; a.remove();
      if (p && p !== c && !p.querySelector('[data-el]') && !p.textContent.replace(/[\s·|,]/g, '')) p.remove();
    });
    c.querySelectorAll('.wf-variant').forEach(function (x) { x.hidden = false; x.style.removeProperty('display'); });
    c.removeAttribute('hidden'); c.style.removeProperty('display');
    return '<!doctype html><html lang="vi"><head><meta charset="utf-8">' + headStyles() + FRAME_CSS + '<' + '/head><body class="cv-in">' + c.outerHTML + '<' + '/body><' + '/html>';
  }
  function finalFrame(s) {
    var f = finalVariant(s);
    var tag = f ? ['Phương án ' + f.v.letter, f.how] : [];
    var p = pick[s.code];
    if (f && f.how === 'đã chốt' && p && p !== f.v.letter && s.variants.some(function (v) { return v.letter === p; })) tag.push('đang chọn ' + p + ' — chưa ghi');
    return { kind: 'final', s: s, code: s.code, name: s.name, width: s.width, letter: f ? f.v.letter : null, reason: f ? f.v.reason : '', tags: tag, html: frameHtml(s, f ? f.v.letter : null), legend: s.legend, spec: s.spec, specCol: true };
  }
  function variantFrame(s, v) {
    var tags = ['Phương án ' + v.letter];
    if (v.rec) tags.push('khuyên dùng');
    if (v.chosen) tags.push('đã chốt');
    return { kind: 'variant', s: s, code: s.code, name: s.name, width: s.width, letter: v.letter, reason: v.reason, tags: tags, html: frameHtml(s, v.letter), legend: s.legend, spec: s.spec, specCol: false };
  }

  var GD = null;
  function buildGallery() {
    try { GD = JSON.parse(DATA_EL.textContent); } catch (e) { GD = { rows: [] }; }
    rows = (GD.rows || []).map(function (r) {
      return { title: r.title, note: r.screens.length + ' màn', cells: r.screens.map(function (sc, i) {
        return { col: i, frame: { kind: 'hifi', code: sc.code, name: sc.name, width: sc.width || 1280, letter: null, reason: sc.path || '', tags: [], html: sc.html, legend: '', spec: sc.spec || null, specCol: true } };
      }) };
    });
    cols = null;
  }

  /* ───────────── Dựng khung DOM ───────────── */
  var root, stage, world, labels, zoomOut, outPre, outHead, msgEl, copyBox, copyBtn, fab, focusEl;
  var tx = 40, ty = 90, k = 0.25, touched = false;
  var frames = [];      // thứ tự đọc: hàng trên xuống, cột trái qua

  function title() {
    var t = (GD && GD.title) || D.title || 'Thiết kế';
    return t.replace(/\s+/g, ' ').trim();
  }

  function buildShell() {
    zoomOut = el('span', { cls: 'cv-zoom', 'aria-live': 'polite' }, ['25%']);
    var bar = el('div', { cls: 'cv-bar', role: 'toolbar', 'aria-label': 'Điều khiển canvas' }, [
      el('div', { cls: 'cv-title' }, [title(), el('small', { text: MODE === 'gallery' ? 'Duyệt thiết kế high-fi' : 'Wireframe — chọn phương án' })]),
      btn('−', { 'aria-label': 'Thu nhỏ', title: 'Thu nhỏ (−)', onclick: function () { zoomAt(viewCenter(), k / 1.25); } }),
      zoomOut,
      btn('+', { 'aria-label': 'Phóng to', title: 'Phóng to (+)', onclick: function () { zoomAt(viewCenter(), k * 1.25); } }),
      btn('Vừa khung', { onclick: fit }),
      btn('100%', { onclick: function () { zoomAt(viewCenter(), 1); } }),
      el('span', { cls: 'cv-sep', 'aria-hidden': 'true' }),
      btn('Chú thích', { 'aria-pressed': 'true', title: 'Bật/tắt viền nét đứt và chấm số của phần tử (#) trên màn', onclick: function (e) {
        var on = root.classList.toggle('cv-ann-off'); e.currentTarget.setAttribute('aria-pressed', on ? 'false' : 'true'); } }),
      btn('Danh sách', { title: 'Trở về trang gốc dạng danh sách', onclick: function () { setCanvas(false); } })
    ]);
    world = el('div', { cls: 'cv-world' });
    labels = el('div', { cls: 'cv-labels' });
    stage = el('div', { cls: 'cv-stage', role: 'region', 'aria-label': 'Mặt phẳng thiết kế — kéo để trượt, Ctrl hoặc ⌘ cùng lăn chuột để thu phóng' }, [world, labels]);
    outHead = el('div', { cls: 'cv-foot-h' });
    outPre = el('pre', { cls: 'cv-out', 'aria-label': 'Kết quả để dán lại cho Claude' });
    copyBox = el('textarea', { cls: 'cv-copybox', hidden: true, readonly: true, 'aria-label': 'Kết quả, đã chọn sẵn để chép' });
    msgEl = el('div', { cls: 'cv-msg', role: 'status', 'aria-live': 'polite' });
    copyBtn = btn('Chép', { onclick: copyResult });
    var foot = el('div', { cls: 'cv-foot' }, [el('div', { cls: 'cv-foot-l' }, [outHead, outPre, copyBox, msgEl]), copyBtn]);
    focusEl = el('div', { id: 'cv-focus', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Xem tập trung', hidden: true });
    root = el('div', { id: 'cv-root' }, [bar, stage, foot, focusEl]);
    D.body.appendChild(root);
    fab = btn('Xem dạng canvas', { id: 'cv-fab', onclick: function () { setCanvas(true); } });
    D.body.appendChild(fab);
    bindStage();
  }

  function render() {
    world.textContent = ''; labels.textContent = ''; frames = [];
    rows.forEach(function (r, ri) {
      r.rt = el('div', { cls: 'cv-rowtitle' }, [r.title, r.note ? el('small', { text: r.note }) : null]);
      labels.appendChild(r.rt);
      r.cells.forEach(function (c) {
        if (!c.frame) return;
        var f = c.frame; f.row = ri; f.col = c.col;
        f.h = f.width < 768 ? 812 : 900;
        f.box = el('div', { cls: 'cv-frame' + (f.kind === 'final' ? ' cv-final' : ''), 'data-cv': String(frames.length) });
        f.box.style.width = f.width + 'px';
        f.ifr = el('iframe', { title: f.code + ' — ' + f.name + (f.letter ? ' · Phương án ' + f.letter : ''), tabindex: '-1', loading: 'eager' });
        f.ifr.style.height = f.h + 'px';
        f.ann = el('div', { cls: 'cv-ann' });
        f.ifr.addEventListener('load', function () { hideStatebar(f.ifr); measure(f); annotate(f.ifr, f.ann, f); setTimeout(function () { measure(f); annotate(f.ifr, f.ann, f); }, 500); });
        f.ifr.srcdoc = f.html;
        f.box.appendChild(f.ifr);
        f.box.appendChild(f.ann);
        world.appendChild(f.box);
        if (f.spec && f.specCol) { f.specBox = specEl(f, false); world.appendChild(f.specBox); }
        f.label = el('div', { cls: 'cv-label' });
        labels.appendChild(f.label);
        fillLabel(f);
        frames.push(f);
      });
    });
    layout();
  }

  /* ───────────── Chú thích phần tử (#) + khung Spec ───────────── */
  var DEMO_SEL = '.statebar, [data-demo], .demo-nav, #statebar';
  // Gallery: ẩn thanh trạng thái demo TRONG khung (cùng dấu nhận với shell.md/check-el: .statebar/#statebar, kiểu cũ
  // .demo-nav/[data-demo]) — file html-design không đổi, mở lẻ vẫn thấy thanh. Đổi trạng thái qua thẻ "Trạng thái giao
  // diện" của khung Spec: runtime bấm hộ nút `.statebar__btn` thứ i (display:none vẫn bấm được bằng click()).
  var STATEBAR_HIDE = '.statebar, #statebar, .demo-nav, [data-demo] { display: none !important; }';
  function hideStatebar(ifr) {
    if (MODE !== 'gallery') return;
    try { var d = ifr.contentDocument; if (d && !d.getElementById('cv-hide-statebar')) { var st = d.createElement('style'); st.id = 'cv-hide-statebar'; st.textContent = STATEBAR_HIDE; (d.head || d.documentElement).appendChild(st); } } catch (e) { /* khác nguồn: giữ thanh */ }
  }
  function pressState(ifr, i) { try { var b = ifr.contentDocument.querySelectorAll('.statebar__btn')[i]; if (b) { b.click(); return true; } } catch (e) { /* bỏ */ } return false; }
  function setState(f, i) {
    f.stateIdx = i;
    pressState(f.ifr, i);
    if (focusIdx >= 0 && frames[focusIdx] === f && focusIfr) pressState(focusIfr, i);
    D.querySelectorAll('#cv-root [data-st-code="' + f.code + '"]').forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-st') === i ? 'true' : 'false'); });
    setTimeout(function () { measure(f); annotate(f.ifr, f.ann, f); }, 300);
  }
  function annotate(ifr, layer, f) { // viền nét đứt + chấm số đặt ở lớp phủ NGOÀI iframe (không sửa DOM của bản dựng)
    layer.textContent = '';
    var d; try { d = ifr.contentDocument; } catch (e) { return; }
    if (!d) return;
    var w = d.defaultView, seen = {};
    d.querySelectorAll('[data-el]').forEach(function (n) {
      if (n.closest(DEMO_SEL)) return;
      var r = n.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || w.getComputedStyle(n).visibility === 'hidden') return;
      var num = (n.getAttribute('data-el') || '').trim();
      var key = num + ':' + Math.round(r.left) + ':' + Math.round(r.top);
      if (!num || seen[key]) return; seen[key] = 1;
      var x = r.left + w.scrollX, y = r.top + w.scrollY;
      var b = el('div', { cls: 'cv-ab' }); b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.width = r.width + 'px'; b.style.height = r.height + 'px';
      var dot = btn(num, { cls: 'cv-dot', 'aria-label': 'Phần tử #' + num + ' — xem thẻ spec', onclick: function () { showCard(f, num); } });
      dot.style.left = Math.max(0, x - 10) + 'px'; dot.style.top = Math.max(0, y - 10) + 'px';
      layer.appendChild(b); layer.appendChild(dot);
    });
  }
  var SPEC_MAX = 3; // trên canvas mỗi nhãn tối đa 3 dòng (đủ thấy bố cục thẻ); xem tập trung hiện đủ
  function specLi(t) { // `~~chữ~~` (story/tiêu chí lỗi thời trong md) → <s>, không hiện dấu ~~ thô
    if (t.indexOf('~~') < 0) return el('li', { cls: /^chưa có/.test(t) ? 'cv-miss' : null, text: t });
    var li = el('li', { cls: 'cv-old' });
    t.split(/~~(.+?)~~/).forEach(function (p, i) { if (p) li.appendChild(i % 2 ? el('s', { text: p }) : D.createTextNode(p)); });
    return li;
  }
  function specList(lab, items, compact) {
    var ul = el('ul'), all = items && items.length ? items : ['chưa có'];
    var show = compact && all.length > SPEC_MAX ? all.slice(0, SPEC_MAX - 1) : all;
    show.forEach(function (t) { ul.appendChild(specLi(t)); });
    if (show.length < all.length) ul.appendChild(el('li', { cls: 'cv-more', text: '+' + (all.length - show.length) + ' dòng nữa — nhấp đúp khung màn để xem đủ' }));
    return [el('div', { cls: 'cv-lab', text: lab }), ul];
  }
  function specEl(f, inFocus) {
    var sp = f.spec || {}, box = el('div', { cls: 'cv-spec' + (inFocus ? ' cv-spec-in' : ''), role: inFocus ? 'complementary' : null, 'aria-label': 'Spec ' + f.code });
    box.appendChild(el('div', { cls: 'cv-spec-h', text: 'Spec — ' + f.code + ' · ' + f.name }));
    var md = sp.mucDich || {};
    var c0 = el('section', { cls: 'cv-card', 'data-n': '0' }, [el('div', { cls: 'cv-card-h' }, [el('span', { cls: 'cv-num cv-num0', 'aria-hidden': 'true', text: '·' }), 'Mục đích màn'])]);
    specList('HÀNH VI', md.hanhVi, !inFocus).concat(specList('USER STORY', md.userStory, !inFocus), specList('TIÊU CHÍ NGHIỆM THU', md.tieuChi, !inFocus)).forEach(function (n) { c0.appendChild(n); });
    box.appendChild(c0);
    if (sp.trangThai && sp.trangThai.length) {
      if (f.stateIdx === undefined) sp.trangThai.forEach(function (g) { g.nut.forEach(function (b) { if (b.active && f.stateIdx === undefined) f.stateIdx = b.i; }); });
      var cs = el('section', { cls: 'cv-card cv-states', 'data-n': 'st' }, [el('div', { cls: 'cv-card-h' }, [el('span', { cls: 'cv-num cv-num0', 'aria-hidden': 'true', text: '·' }), 'Trạng thái giao diện'])]);
      sp.trangThai.forEach(function (g) {
        cs.appendChild(el('div', { cls: 'cv-lab', text: g.ten.toUpperCase() }));
        var ul = el('ul', { cls: 'cv-stlist' + (inFocus ? '' : ' cv-chips') });
        g.nut.forEach(function (b) {
          var bt = btn(b.ten, { cls: 'cv-st', 'data-st': String(b.i), 'data-st-code': f.code, 'aria-pressed': f.stateIdx === b.i ? 'true' : 'false', title: 'Chuyển khung màn sang trạng thái này', onclick: function () { setState(f, b.i); } });
          if (!inFocus && b.moTa) bt.title = b.moTa;
          ul.appendChild(el('li', null, [bt, inFocus && b.moTa ? el('span', { cls: 'cv-stdesc', text: b.moTa }) : null]));
        });
        cs.appendChild(ul);
      });
      box.appendChild(cs);
    }
    (sp.phanTu || []).forEach(function (p) {
      if (!inFocus) { // canvas: MỘT hàng mỗi phần tử (màn 26 phần tử vẫn ≈ 600px) — đủ chữ nằm ở xem tập trung
        var hv = (p.hanhVi || [])[0] || '', nq = (p.quyTac || []).length, nt = (p.tieuChi || []).length;
        box.appendChild(el('section', { cls: 'cv-card cv-row', 'data-n': String(p.n), title: [p.ten + (p.loai ? ' (' + p.loai + ')' : ''), hv, nq + ' quy tắc/lỗi · ' + nt + ' tiêu chí — nhấp tên màn để xem đủ'].filter(Boolean).join('\n') }, [
          el('span', { cls: 'cv-num', text: String(p.n) }), el('b', { text: p.ten }), hv ? el('span', { cls: 'cv-one', text: ' — ' + hv }) : null]));
        return;
      }
      var c = el('section', { cls: 'cv-card', 'data-n': String(p.n) }, [el('div', { cls: 'cv-card-h' }, [el('span', { cls: 'cv-num', text: String(p.n) }), '#' + p.n + ' · ' + p.ten + (p.loai ? ' (' + p.loai + ')' : '')])]);
      if (inFocus) specList('HÀNH VI', p.hanhVi, false).concat(specList('QUY TẮC / LỖI', p.quyTac, false), specList('TIÊU CHÍ NGHIỆM THU', p.tieuChi, false)).forEach(function (n) { c.appendChild(n); });
      box.appendChild(c);
    });
    if (!sp.phanTu || !sp.phanTu.length) box.appendChild(el('p', { cls: 'cv-miss', text: 'chưa có "Bảng mô tả chi tiết phần tử màn hình" trong srs — không có thẻ phần tử' }));
    return box;
  }
  function flash(card) { card.classList.add('cv-hot'); setTimeout(function () { card.classList.remove('cv-hot'); }, 1800); }
  function showCard(f, num) {
    if (focusIdx >= 0) {
      var panel = focusEl.querySelector('.cv-spec'), c = panel && panel.querySelector('.cv-card[data-n="' + num + '"]');
      if (c) { c.scrollIntoView({ block: 'center' }); flash(c); }
      return;
    }
    var sb = f.specBox;
    if (!sb) { // hàng không có cột spec (hàng phương án) → khung spec của cùng màn ở hàng trên cùng
      var o = frames.filter(function (x) { return x.code === f.code && x.specBox; })[0]; sb = o && o.specBox;
    }
    var card = sb && sb.querySelector('.cv-card[data-n="' + num + '"]');
    if (!card) return;
    touched = true;
    var v = viewSize(), z = Math.max(k, 0.7);
    var wx = sb.offsetLeft + card.offsetLeft + card.offsetWidth / 2, wy = sb.offsetTop + card.offsetTop + card.offsetHeight / 2;
    k = clampK(z); tx = v.w / 2 - wx * k; ty = v.h / 2 - wy * k; apply();
    flash(card);
  }

  function contentHeight(d) { // chiều cao NỘI DUNG, không phải khung nhìn: scrollHeight của <html> không bao giờ nhỏ hơn iframe
    var r = d.documentElement.getBoundingClientRect().height;
    return Math.ceil(Math.max(r, d.body ? d.body.scrollHeight : 0));
  }
  function measure(f) {
    var h = null;
    try {
      var d = f.ifr.contentDocument, w = f.ifr.contentWindow;
      if (MODE === 'wireframe') d.querySelectorAll('.wf-variant').forEach(function (v) { if (w.getComputedStyle(v).display === 'none') v.style.display = 'block'; });
      h = contentHeight(d);
    } catch (e) { h = null; }  // không đo được (trình duyệt chặn) → giữ chiều cao mặc định
    if (h && Math.abs(h - f.h) > 2) { f.h = Math.min(Math.max(h, 160), 8000); f.ifr.style.height = f.h + 'px'; layout(); }
  }

  function flowSpec(fr) { // khung Spec MỘT cột, cao theo nội dung (thẻ phần tử đã gọn một dòng) — chia nhiều cột thì
    // màn 26 phần tử (dự án e-learning, S09) ra 7 cột rộng gấp 3 khung màn, "Vừa khung" co còn 6% không đọc được
    fr.specBox.style.width = SPEC_W + 'px';
    fr.specW = SPEC_W;
  }
  var rowGap = ROW_GAP;
  function layout(again) {
    var y = FIRST_TOP, maxX = 0;
    frames.forEach(function (fr) { if (fr.specBox) flowSpec(fr); });
    if (cols) cols.forEach(function (c, i) {
      var s = screens[i], w = s.width;
      frames.forEach(function (fr) { if (fr.s === s && fr.specBox) w = Math.max(w, s.width + SPEC_GAP + fr.specW); });
      c.width = w;
    });
    rows.forEach(function (r) {
      var x = 0, rowH = 0;
      r.y = y;
      r.cells.forEach(function (c, i) {
        var w = cols ? cols[c.col].width : (c.frame ? c.frame.width : 0);
        var fr = c.frame;
        if (fr) {
          fr.x = x; fr.y = y; fr.box.style.left = x + 'px'; fr.box.style.top = y + 'px'; rowH = Math.max(rowH, fr.h);
          if (fr.specBox) { fr.specBox.style.left = (x + fr.width + SPEC_GAP) + 'px'; fr.specBox.style.top = y + 'px'; rowH = Math.max(rowH, fr.specBox.offsetHeight); }
          if (!cols) w = fr.width + (fr.specBox ? SPEC_GAP + fr.specW : 0);
          fr.slotW = w;
        }
        x += w + GAP_X;
      });
      if (!r.cells.length) rowH = 200;
      maxX = Math.max(maxX, x - GAP_X);
      r.h = rowH;
      y += rowH + rowGap;
    });
    bounds = { w: Math.max(maxX, 400), h: Math.max(y - rowGap, 200) };
    if (!touched && (again || 0) < 3) { // khoảng hở giữa hàng phải đủ chỗ cho tiêu đề hàng + nhãn khung (~150px MÀN HÌNH) ở mức "Vừa khung"
      var v = viewSize(), kf = clampK(Math.min((v.w - 64) / bounds.w, (v.h - 140) / bounds.h, 1)), need = Math.ceil(150 / kf);
      if (need > rowGap + 8) { rowGap = need; return layout((again || 0) + 1); }
    }
    if (!touched) fit(true); else apply();
  }
  var bounds = { w: 1, h: 1 };

  /* ───────────── Nhãn khung + nút chọn ───────────── */
  function fillLabel(f) {
    var L = f.label; L.textContent = '';
    var parts = [f.code + ' — ' + f.name].concat(f.tags || []);
    var name = btn('', { cls: 'cv-name', title: 'Xem tập trung 100% — ' + parts.join(' · '), onclick: function () { openFocus(frames.indexOf(f)); } });
    // mã màn không bao giờ bị cắt (nhãn hẹp từng chỉ còn "…"); phần tên dài co lại trước
    name.appendChild(el('span', { cls: 'cv-code', text: f.code }));
    name.appendChild(el('span', { cls: 'cv-long', text: '— ' + [f.name].concat(f.tags || []).join(' · ') }));
    if (f.letter) name.appendChild(el('span', { cls: 'cv-short', text: '· ' + f.letter }));
    var top = el('div', { cls: 'cv-ltop' }, [name]);
    controls(f).forEach(function (b) { top.appendChild(b); });
    L.appendChild(top);
    if (f.reason) L.appendChild(el('div', { cls: 'cv-reason', title: f.reason, text: f.reason }));
    if (f.kind === 'hifi') { var n = noteInput(f); if (n) L.appendChild(n); }
  }
  function controls(f, inFocus) {
    if (f.kind === 'variant') {
      var on = effChoice(f.s) === f.letter;
      var b = btn('', { 'aria-pressed': on ? 'true' : 'false', 'aria-label': (on ? 'Đang chọn' : 'Chọn') + ' phương án ' + f.letter + ' cho ' + f.code, onclick: function () { choose(f); } });
      b.appendChild(el('span', { cls: 'cv-long', text: on ? 'Đang chọn' : 'Chọn phương án này' }));
      if (!inFocus) b.appendChild(el('span', { cls: 'cv-short', text: on ? 'Đang chọn' : 'Chọn' }));
      return [b];
    }
    if (f.kind === 'hifi') {
      var cur = (pick[f.code] || {}).v;
      return [
        btn('Duyệt', { 'aria-pressed': cur === 'duyệt' ? 'true' : 'false', 'aria-label': 'Duyệt ' + f.code, onclick: function () { verdict(f, 'duyệt'); } }),
        btn('Cần sửa', { 'aria-pressed': cur === 'cần sửa' ? 'true' : 'false', 'aria-label': 'Đánh dấu cần sửa ' + f.code, onclick: function () { verdict(f, 'cần sửa'); } })
      ];
    }
    return [];
  }
  function noteInput(f) {
    var p = pick[f.code];
    if (!p || p.v !== 'cần sửa') return null;
    return el('input', { cls: 'cv-note', type: 'text', value: p.note || '', placeholder: 'Ghi chú: cần sửa gì', 'aria-label': 'Ghi chú cần sửa cho ' + f.code,
      oninput: function (e) { p.note = e.target.value; savePick(); updateResult(); syncInputs(f, e.target); } });
  }
  function syncInputs(f, src) { D.querySelectorAll('#cv-root .cv-note').forEach(function (i) { if (i !== src && i.getAttribute('aria-label') === src.getAttribute('aria-label')) i.value = src.value; }); }

  function choose(f) {
    pick[f.code] = f.letter; savePick();
    refreshScreen(f.code);
  }
  function verdict(f, v) {
    var p = pick[f.code];
    if (p && p.v === v) delete pick[f.code]; else pick[f.code] = { v: v, note: (p && p.note) || '' };
    savePick();
    refreshScreen(f.code);
    if (v === 'cần sửa' && pick[f.code]) { var i = (focusIdx >= 0 ? focusEl : f.label).querySelector('.cv-note'); if (i) i.focus(); }
  }
  function refreshScreen(code) {
    frames.forEach(function (f, i) {
      if (f.code !== code) return;
      if (f.kind === 'final') {
        var nf = finalFrame(f.s);
        if (nf.letter !== f.letter) { f.letter = nf.letter; f.html = nf.html; f.ifr.srcdoc = f.html; }
        f.tags = nf.tags; f.reason = nf.reason;
      }
      fillLabel(f);
      if (focusIdx === i) fillFocusHead(f);
    });
    placeLabels(); updateResult();
  }

  /* ───────────── Kết quả + Chép ───────────── */
  function resultLines() {
    if (MODE === 'wireframe') return screens.filter(function (s) { return s.variants.length; }).map(function (s) { return s.code + ': ' + effChoice(s); });
    var out = [];
    frames.forEach(function (f) {
      var p = pick[f.code];
      if (!p || out.some(function (l) { return l.indexOf(f.code + ':') === 0; })) return;
      out.push(f.code + ': ' + p.v + (p.v === 'cần sửa' && p.note && p.note.trim() ? ' — ' + p.note.trim().replace(/\s+/g, ' ') : ''));
    });
    return out;
  }
  function updateResult() {
    var lines = resultLines();
    if (MODE === 'wireframe') {
      var vs = screens.filter(function (s) { return s.variants.length; });
      var tay = vs.filter(function (s) { return pick[s.code] && s.variants.some(function (v) { return v.letter === pick[s.code]; }); }).length;
      outHead.textContent = vs.length ? 'Kết quả — mỗi màn một dòng, dán lại cho Claude (đã chọn tay ' + tay + '/' + vs.length + ' màn; màn chưa chọn lấy bản đã chốt hoặc khuyên dùng)' : 'Không màn nào có từ 2 phương án — không có gì để chọn.';
    } else {
      outHead.textContent = 'Kết quả — mỗi màn một dòng, dán lại cho Claude (' + lines.length + '/' + frames.length + ' màn đã duyệt hoặc đánh dấu cần sửa)';
    }
    outPre.textContent = lines.length ? lines.join('\n') : (MODE === 'gallery' ? 'Chưa duyệt màn nào.' : '—');
    copyBtn.disabled = !lines.length;
    copyBox.hidden = true;
  }
  function copyResult() {
    var text = resultLines().join('\n');
    if (!text) return;
    function fallback() {
      copyBox.hidden = false; copyBox.value = text; copyBox.focus(); copyBox.select();
      var ok = false; try { ok = D.execCommand('copy'); } catch (e) { ok = false; }
      msgEl.textContent = ok ? 'Đã chép ' + text.split('\n').length + ' dòng.' : 'Không chép tự động được — văn bản đã được chọn sẵn, bấm Ctrl+C (hoặc ⌘+C).';
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { copyBox.hidden = true; msgEl.textContent = 'Đã chép ' + text.split('\n').length + ' dòng — dán vào cuộc trò chuyện với Claude.'; }, fallback);
      } else fallback();
    } catch (e) { fallback(); }
  }

  /* ───────────── Điều hướng: trượt · thu phóng ───────────── */
  function viewSize() { return { w: stage.clientWidth || 800, h: stage.clientHeight || 600 }; }
  function viewCenter() { var v = viewSize(); return { x: v.w / 2, y: v.h / 2 }; }
  function clampK(z) { return Math.min(ZMAX, Math.max(ZMIN, z)); }
  function zoomAt(p, z) {
    touched = true;
    z = clampK(z);
    var wx = (p.x - tx) / k, wy = (p.y - ty) / k;
    k = z; tx = p.x - wx * k; ty = p.y - wy * k;
    apply();
  }
  function fit(auto) {
    if (auto !== true) touched = true;
    var v = viewSize(), pad = 32, lab = 0;
    frames.forEach(function (f) { if (f.row === 0 && f.label) lab = Math.max(lab, f.label.offsetHeight); });
    var padTop = Math.max(96, lab + 52);   // chừa chỗ cho dải nhãn cao nhất + tiêu đề hàng đầu
    k = clampK(Math.min((v.w - pad * 2) / bounds.w, (v.h - padTop - pad) / bounds.h, 1));
    tx = (v.w - bounds.w * k) / 2; ty = padTop;
    apply();
  }
  function apply() {
    world.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + k + ')';
    zoomOut.textContent = Math.round(k * 100) + '%';
    placeLabels();
  }
  function placeLabels() {
    var v = viewSize(), lh = {};
    frames.forEach(function (f) {
      var sx = f.x * k + tx, sy = f.y * k + ty, w = ((f.slotW || f.width) + GAP_X) * k - 12;
      var off = sx > v.w + 20 || sx + w < -20 || sy < -400 || sy - 80 > v.h;
      f.label.hidden = off;
      if (off) return;
      f.label.style.left = sx + 'px'; f.label.style.top = sy + 'px';
      f.label.style.width = Math.max(w, 60) + 'px';
      f.label.classList.toggle('cv-tight', w < 280);
      f.label.classList.toggle('cv-xtight', w < 190); // chỉ còn mã màn — nút Duyệt/Chọn vẫn có ở xem tập trung
      lh[f.row] = Math.max(lh[f.row] || 0, f.label.offsetHeight);
    });
    rows.forEach(function (r, ri) { // tiêu đề hàng nằm ngay trên dải nhãn cao nhất của hàng
      if (!r.rt) return;
      r.rt.style.left = Math.max(8, tx) + 'px';
      r.rt.style.top = (r.y * k + ty - (lh[ri] || 30) - 6) + 'px';
    });
  }

  var drag = null, pts = {}, pinch = null;
  function bindStage() {
    stage.addEventListener('wheel', function (e) {
      if (focusIdx >= 0) return;
      e.preventDefault();
      var r = stage.getBoundingClientRect(), p = { x: e.clientX - r.left, y: e.clientY - r.top };
      var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY, dx = e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX;
      if (e.ctrlKey || e.metaKey) zoomAt(p, k * Math.exp(-dy * 0.0025 * (e.ctrlKey && !e.metaKey && Math.abs(dy) < 50 ? 4 : 1)));
      else { touched = true; tx -= (e.shiftKey && !dx ? dy : dx); ty -= (e.shiftKey && !dx ? 0 : dy); apply(); }
    }, { passive: false });
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('button, input, textarea, select, a, label')) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts);
      if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: k }; drag = null; return; }
      drag = { x: e.clientX, y: e.clientY, tx: tx, ty: ty, moved: false };
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ }
    });
    stage.addEventListener('pointermove', function (e) {
      if (pts[e.pointerId]) pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts);
      if (pinch && ids.length === 2) {
        var a = pts[ids[0]], b = pts[ids[1]], r = stage.getBoundingClientRect();
        zoomAt({ x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top }, pinch.k * Math.hypot(a.x - b.x, a.y - b.y) / (pinch.d || 1));
        return;
      }
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      drag.moved = true; touched = true; stage.classList.add('cv-drag');
      tx = drag.tx + dx; ty = drag.ty + dy; apply();
    });
    function end(e) { delete pts[e.pointerId]; if (Object.keys(pts).length < 2) pinch = null; drag = null; stage.classList.remove('cv-drag'); }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('dblclick', function (e) {
      var b = e.target.closest('.cv-frame');
      if (b) openFocus(+b.getAttribute('data-cv'));
    });
    window.addEventListener('resize', function () { if (!touched) fit(true); else apply(); });
    D.addEventListener('keydown', onKey);
  }
  function onKey(e) {
    if (!D.body.classList.contains('cv-on')) return;
    var typing = e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if (focusIdx >= 0) {
      if (e.key === 'Escape') { e.preventDefault(); closeFocus(); }
      else if (!typing && e.key === 'ArrowLeft') { e.preventDefault(); openFocus((focusIdx - 1 + frames.length) % frames.length); }
      else if (!typing && e.key === 'ArrowRight') { e.preventDefault(); openFocus((focusIdx + 1) % frames.length); }
      return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '+' || e.key === '=') zoomAt(viewCenter(), k * 1.25);
    else if (e.key === '-') zoomAt(viewCenter(), k / 1.25);
    else if (e.key === '0') zoomAt(viewCenter(), 1);
  }

  /* ───────────── Xem tập trung ───────────── */
  var focusIdx = -1, focusHead = null, lastFocus = null, focusIfr = null;
  function fillFocusHead(f) {
    focusHead.textContent = '';
    var parts = [f.code + ' — ' + f.name].concat(f.tags || []);
    focusHead.appendChild(el('div', { cls: 'cv-fhead-t' }, [el('strong', { text: parts.join(' · ') }), f.reason ? el('span', { text: f.reason }) : null]));
    controls(f, true).forEach(function (b) { focusHead.appendChild(b); });
    if (f.kind === 'hifi') { var n = noteInput(f); if (n) focusHead.appendChild(n); }
    focusHead.appendChild(btn(focusFit ? 'Cỡ thật 100%' : 'Vừa bề ngang', { 'aria-label': focusFit ? 'Xem khung ở cỡ thật 100%' : 'Co khung vừa bề ngang', onclick: function () { focusFit = !focusFit; openFocus(focusIdx); } }));
    focusHead.appendChild(btn('← Khung trước', { onclick: function () { openFocus((focusIdx - 1 + frames.length) % frames.length); } }));
    focusHead.appendChild(btn('Khung sau →', { onclick: function () { openFocus((focusIdx + 1) % frames.length); } }));
    focusHead.appendChild(btn('Đóng', { 'aria-label': 'Đóng xem tập trung (Esc)', cls: 'cv-close', onclick: closeFocus }));
  }
  var focusFit = true; // xem tập trung: khung rộng hơn chỗ trống thì co vừa bề ngang (nút chuyển cỡ thật)
  function openFocus(i) {
    if (i < 0 || i >= frames.length) return;
    if (focusIdx < 0) lastFocus = D.activeElement;
    focusIdx = i;
    var f = frames[i];
    focusEl.textContent = '';
    focusHead = el('div', { cls: 'cv-fhead' });
    fillFocusHead(f);
    var ifr = el('iframe', { title: f.code + ' — ' + f.name });
    ifr.style.height = f.h + 'px';
    var ann = el('div', { cls: 'cv-ann' });
    focusIfr = ifr;
    ifr.addEventListener('load', function () {
      hideStatebar(ifr);
      if (f.stateIdx !== undefined) pressState(ifr, f.stateIdx);
      var go = function () { try { ifr.style.height = Math.max(contentHeight(ifr.contentDocument), 200) + 'px'; } catch (e) { /* giữ chiều cao cũ */ } annotate(ifr, ann, f); };
      try {
        var w = ifr.contentWindow;
        if (MODE === 'wireframe') ifr.contentDocument.querySelectorAll('.wf-variant').forEach(function (v) { if (w.getComputedStyle(v).display === 'none') v.style.display = 'block'; });
        w.addEventListener('click', function () { setTimeout(function () { go(); }, 300); }); // bấm thanh trạng thái → bố cục đổi → vẽ lại chú thích
        w.addEventListener('resize', function () { annotate(ifr, ann, f); });
        w.addEventListener('keydown', function (e) { if (e.key === 'Escape' || ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) onKey(e); });
      } catch (e) { /* khác nguồn: bỏ */ }
      go(); setTimeout(go, 400);
    });
    ifr.srcdoc = f.html;
    var box = el('div', { cls: 'cv-fframe' }, [ifr, ann]);
    box.style.width = f.width + 'px';
    var body = el('div', { cls: 'cv-fbody' }, [el('div', { cls: 'cv-fmain' }, [box])]);
    if (f.spec) body.appendChild(specEl(f, true));
    else if (f.legend) {
      var lg = el('div', { cls: 'cv-legend', role: 'complementary', 'aria-label': 'Chú giải phần tử ' + f.code }, [el('h3', { text: 'Chú giải # — ' + f.code })]);
      var holder = el('div'); holder.innerHTML = f.legend; lg.appendChild(holder);
      body.appendChild(lg);
    }
    focusEl.appendChild(focusHead); focusEl.appendChild(body);
    focusEl.hidden = false;
    var main = body.firstChild, avail = main.clientWidth - 48; // 48 = padding hai bên của .cv-fmain
    box.style.zoom = focusFit && avail > 0 && f.width > avail ? String(avail / f.width) : '';
    var c = focusEl.querySelector('.cv-close'); if (c) c.focus();
  }
  function closeFocus() {
    var f = frames[focusIdx];
    focusIdx = -1; focusEl.hidden = true; focusEl.textContent = '';
    var n = (f && f.label.querySelector('.cv-name')) || lastFocus;
    if (n && n.focus) n.focus();
  }

  /* ───────────── Bật / tắt ───────────── */
  var built = false;
  function setCanvas(on) {
    if (on && !built) { built = true; D.body.classList.add('cv-on'); render(); updateResult(); return; }
    D.body.classList.toggle('cv-on', on);
    if (on) { if (!touched) fit(true); else apply(); var n = root.querySelector('.cv-bar button'); if (n) n.focus(); }
    else { if (focusIdx >= 0) closeFocus(); fab.focus(); }
  }
  function init() {
    if (MODE === 'wireframe') buildWireframe(); else buildGallery();
    buildShell();
    setCanvas(true);
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})();
