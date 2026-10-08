#!/usr/bin/env node
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
/*
 * ba-index/server.js — giao diện web đọc/sửa tài liệu BA qua chỉ mục. Zero-dependency.
 *
 * Đọc từ chỉ mục (nhanh), nhưng GHI THẲNG RA `.md` rồi dựng lại chỉ mục. Không bao giờ ghi vào
 * DB: hai nguồn sự thật là cách chắc chắn nhất để chúng lệch nhau, và bên thua luôn là bên mà
 * git đang theo dõi.
 *
 * An toàn: chỉ nghe 127.0.0.1, kiểm Host, mọi POST phải kèm token sinh ngẫu nhiên mỗi lần chạy.
 *
 * Dùng:  node .claude/skills/ba-index/scripts/server.js [docsDir=docs] [--port 4322] [--no-open]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync, spawn } = require('child_process');
const { DatabaseSync } = require('node:sqlite');
const { ghiO, sha } = require(path.join(__dirname, 'write-back.js'));

const args = process.argv.slice(2);
const cờ = (t, m) => { const i = args.indexOf(t); return i >= 0 && args[i + 1] ? args[i + 1] : m; };
const DOCS = path.resolve(args.find((a) => !a.startsWith('--') && a !== cờ('--port', null)) || 'docs');
const DB = path.resolve(cờ('--db', path.join(DOCS, '..', '.claude', 'ba-index.db')));
const PORT0 = Number(cờ('--port', '4322'));
const TOKEN = crypto.randomBytes(16).toString('hex');
const BUILD = path.join(__dirname, 'build.js');

if (!fs.existsSync(DOCS)) { console.error(`Không thấy ${DOCS}`); process.exit(2); }

function dựngChỉMục() {
  const r = spawnSync(process.execPath, [BUILD, DOCS, '--out', DB], { encoding: 'utf8' });
  return r.status === 0;
}
if (!fs.existsSync(DB)) { console.log('Chưa có chỉ mục — đang dựng…'); dựngChỉMục(); }

const mở = () => new DatabaseSync(DB, { readOnly: true });

/** Lệch giữa chỉ mục và nguồn. Giao diện phải NÓI RA, không im lặng hiển thị dữ liệu cũ. */
function độTươi() {
  const db = mở();
  const rows = db.prepare('SELECT path, sha FROM doc').all();
  const meta = Object.fromEntries(db.prepare('SELECT k,v FROM meta').all().map((r) => [r.k, r.v]));
  db.close();
  const đổi = rows.filter((r) => {
    const p = path.join(DOCS, r.path);
    return !fs.existsSync(p) || sha(fs.readFileSync(p, 'utf8')) !== r.sha;
  }).map((r) => r.path);
  return { cũ: đổi.length > 0, đổi, builtAt: meta.builtAt };
}

const json = (res, code, o) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(o));
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const host = (req.headers.host || '').split(':')[0];
  if (host && !['127.0.0.1', 'localhost'].includes(host)) { res.writeHead(403); return res.end('chỉ 127.0.0.1'); }

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(TRANG());
  }

  if (req.method === 'GET' && url.pathname === '/api/tree') {
    const db = mở();
    const màn = db.prepare(`SELECT man, COUNT(DISTINCT path) files, COUNT(*) ents FROM ent
                            WHERE man IS NOT NULL GROUP BY man ORDER BY man`).all();
    const duAn = db.prepare(`SELECT path, COUNT(*) ents FROM ent WHERE man IS NULL
                             GROUP BY path ORDER BY path`).all();
    db.close();
    return json(res, 200, { man: màn, duAn, tuoi: độTươi() });
  }

  if (req.method === 'GET' && url.pathname === '/api/items') {
    const db = mở();
    const man = url.searchParams.get('man');
    const p = url.searchParams.get('path');
    const rows = man
      ? db.prepare('SELECT id,path,kind,fields FROM ent WHERE man = ? ORDER BY path, id').all(man)
      : db.prepare('SELECT id,path,kind,fields FROM ent WHERE path = ? ORDER BY id').all(p || '');
    db.close();
    return json(res, 200, {
      items: rows.map((r) => ({ ...r, fields: JSON.parse(r.fields) })),
      tuoi: độTươi(),
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/find') {
    const q = (url.searchParams.get('q') || '').trim();
    if (!q) return json(res, 200, { hits: [] });
    const db = mở();
    let rows = [];
    try {
      rows = db.prepare(`SELECT f.id id, f.path path, e.man man,
                                snippet(ent_fts,2,'«','»','…',12) snip
                         FROM ent_fts f JOIN ent e ON e.id=f.id AND e.path=f.path
                         WHERE ent_fts MATCH ? ORDER BY rank LIMIT 30`).all(q);
    } catch { rows = []; } // cú pháp FTS sai → trả rỗng, đừng ném 500 vào mặt người gõ
    db.close();
    return json(res, 200, { hits: rows });
  }

  // Mọi thao tác GHI đều đòi token — chống trang web khác gọi lén vào localhost.
  if (req.method === 'POST' && url.pathname === '/api/edit') {
    if (req.headers['x-ba-token'] !== TOKEN) return json(res, 403, { ok: false, loi: 'token sai' });
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    return req.on('end', () => {
      let d;
      try { d = JSON.parse(body); } catch { return json(res, 400, { ok: false, loi: 'JSON hỏng' }); }
      const file = path.join(DOCS, d.path || '');
      // Chặn thoát khỏi docsDir: `d.path` đến từ trình duyệt, không được tin.
      if (!path.resolve(file).startsWith(path.resolve(DOCS) + path.sep)) {
        return json(res, 400, { ok: false, loi: 'đường dẫn ngoài docs/' });
      }
      const kq = ghiO(file, d.id, d.cot, d.giaTri, d.sha || null);
      if (!kq.ok) return json(res, 409, kq);
      dựngChỉMục();
      return json(res, 200, { ok: true, sha: kq.sha });
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/rebuild') {
    if (req.headers['x-ba-token'] !== TOKEN) return json(res, 403, { ok: false });
    return json(res, 200, { ok: dựngChỉMục(), tuoi: độTươi() });
  }

  if (req.method === 'GET' && url.pathname === '/api/sha') {
    const p = path.join(DOCS, url.searchParams.get('path') || '');
    if (!path.resolve(p).startsWith(path.resolve(DOCS) + path.sep) || !fs.existsSync(p)) {
      return json(res, 404, {});
    }
    return json(res, 200, { sha: sha(fs.readFileSync(p, 'utf8')) });
  }

  res.writeHead(404); res.end('không có');
});

function TRANG() {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<title>BA Docs — ${path.basename(path.dirname(DOCS))}</title>
<style>
:root{--bg:#0f1115;--pn:#171a21;--bd:#2a2f3a;--tx:#e6e8ee;--mu:#9aa3b2;--ac:#7c9cff;--ok:#4ade80;--wn:#fbbf24}
@media(prefers-color-scheme:light){:root{--bg:#fff;--pn:#f6f7f9;--bd:#e2e5ea;--tx:#1a1d23;--mu:#667;--ac:#3b5bdb}}
*{box-sizing:border-box}body{margin:0;font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--tx)}
header{display:flex;gap:12px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--bd);position:sticky;top:0;background:var(--bg);z-index:5}
header b{font-size:15px}input[type=search]{flex:1;max-width:420px;padding:7px 10px;border:1px solid var(--bd);border-radius:8px;background:var(--pn);color:var(--tx)}
#stale{display:none;padding:6px 16px;background:#3b2f0b;color:var(--wn);border-bottom:1px solid var(--bd)}
main{display:grid;grid-template-columns:230px 1fr;min-height:calc(100vh - 49px)}
nav{border-right:1px solid var(--bd);padding:10px;overflow:auto}
nav h4{margin:12px 6px 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mu)}
nav a{display:block;padding:6px 8px;border-radius:6px;color:var(--tx);text-decoration:none;cursor:pointer;font-size:13px}
nav a:hover{background:var(--pn)}nav a.on{background:var(--ac);color:#fff}
nav a span{float:right;color:var(--mu);font-size:11px}nav a.on span{color:#dfe6ff}
section{padding:14px 18px;overflow:auto}
.card{border:1px solid var(--bd);border-radius:10px;margin:0 0 12px;background:var(--pn)}
.card>h3{margin:0;padding:9px 12px;font-size:13px;border-bottom:1px solid var(--bd);display:flex;gap:10px;align-items:center}
.card>h3 code{color:var(--ac);font-size:13px}.card>h3 small{color:var(--mu);font-weight:400;margin-left:auto}
.f{display:grid;grid-template-columns:150px 1fr;gap:10px;padding:7px 12px;border-top:1px solid var(--bd)}
.f:first-of-type{border-top:0}.f k{color:var(--mu);font-size:12px;padding-top:3px}
.f d{white-space:pre-wrap;cursor:text;padding:2px 4px;border-radius:5px;border:1px solid transparent}
.f d:hover{border-color:var(--bd)}.f d:focus{outline:0;border-color:var(--ac);background:var(--bg)}
.msg{padding:8px 12px;border-radius:8px;margin-bottom:10px;font-size:13px}
.msg.e{background:#3b1414;color:#ffb4b4}.msg.k{background:#10331d;color:var(--ok)}
.hint{color:var(--mu);font-size:12px;margin:0 0 12px}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}
.chips b{padding:4px 10px;border:1px solid var(--bd);border-radius:999px;font-size:12px;font-weight:500;cursor:pointer;background:var(--pn)}
.chips b.on{background:var(--ac);color:#fff;border-color:var(--ac)}
</style></head><body>
<header><b>BA Docs</b><input type="search" id="q" placeholder="Tìm toàn văn… (vd: mật khẩu tạm)"><span id="cnt" style="color:var(--mu);font-size:12px"></span></header>
<div id="stale"></div>
<main><nav id="nav"></nav><section id="sec"><p class="hint">Chọn một màn ở bên trái.</p></section></main>
<script>
var TOKEN=${JSON.stringify(TOKEN)}, cur=null;
function el(t,a,c){var e=document.createElement(t);if(a)for(var k in a)e.setAttribute(k,a[k]);if(c!=null)e.textContent=c;return e}
function msg(s,cls){var d=document.getElementById('sec');var m=el('div',{class:'msg '+cls},s);d.insertBefore(m,d.firstChild);setTimeout(function(){m.remove()},cls==='e'?9000:2500)}
function stale(t){var b=document.getElementById('stale');if(t&&t.cu){b.style.display='block';b.textContent='⚠️ Chỉ mục cũ hơn tài liệu ('+t.doi.length+' file đổi) — bấm để dựng lại';b.onclick=rebuild}else b.style.display='none'}
function rebuild(){fetch('/api/rebuild',{method:'POST',headers:{'x-ba-token':TOKEN}}).then(function(r){return r.json()}).then(function(d){stale(d.tuoi&&{cu:d.tuoi.cũ,doi:d.tuoi.đổi});load()})}
function tree(){fetch('/api/tree').then(function(r){return r.json()}).then(function(d){
  stale(d.tuoi&&{cu:d.tuoi.cũ,doi:d.tuoi.đổi});
  var n=document.getElementById('nav');n.innerHTML='';
  n.appendChild(el('h4',null,'Màn hình'));
  d.man.forEach(function(m){var a=el('a',{'data-man':m.man},m.man);a.appendChild(el('span',null,m.ents));a.onclick=function(){pick(a,{man:m.man})};n.appendChild(a)});
  n.appendChild(el('h4',null,'Tài liệu dự án'));
  d.duAn.forEach(function(f){var t=f.path.split('/').pop();var a=el('a',{'data-p':f.path},t);a.appendChild(el('span',null,f.ents));a.onclick=function(){pick(a,{path:f.path})};n.appendChild(a)});
  var t0=tuHash();if(t0){var sel=t0.man?('nav a[data-man="'+t0.man+'"]'):('nav a[data-p="'+t0.path.replace(/"/g,'\\"')+'"]');var a0=document.querySelector(sel);if(a0)pick(a0,t0)}})}
function pick(a,arg){[].forEach.call(document.querySelectorAll('nav a'),function(x){x.classList.remove('on')});a.classList.add('on');cur=arg;loc=null;
  // Link sâu: một trình duyệt tài liệu mà không chia sẻ được đường dẫn tới đúng chỗ đang xem
  // thì người ta sẽ quay lại chụp màn hình gửi nhau.
  location.hash=arg.man?('man='+arg.man):('path='+encodeURIComponent(arg.path));load()}
function tuHash(){var h=location.hash.slice(1);if(!h)return null;
  if(h.indexOf('man=')===0)return{man:h.slice(4)};
  if(h.indexOf('path=')===0)return{path:decodeURIComponent(h.slice(5))};return null}
function load(){if(!cur)return;var u='/api/items?'+(cur.man?'man='+encodeURIComponent(cur.man):'path='+encodeURIComponent(cur.path));
  fetch(u).then(function(r){return r.json()}).then(function(d){render(d.items);stale(d.tuoi&&{cu:d.tuoi.cũ,doi:d.tuoi.đổi})})}
var loc=null;
function render(items){var s=document.getElementById('sec');s.innerHTML='';
  if(!items.length){document.getElementById('cnt').textContent='0 mục';s.appendChild(el('p',{class:'hint'},'Không có mục nào.'));return}
  // Một màn có tới 185 mục trộn đủ loại; không lọc thì phải cuộn rất lâu mới tới thứ cần.
  var loai={};items.forEach(function(i){loai[i.kind]=(loai[i.kind]||0)+1});
  var ch=el('div',{class:'chips'});
  var all=el('b',null,'tất cả '+items.length);if(!loc)all.className='on';
  all.onclick=function(){loc=null;render(items)};ch.appendChild(all);
  Object.keys(loai).sort().forEach(function(k){var b2=el('b',null,k+' '+loai[k]);
    if(loc===k)b2.className='on';b2.onclick=function(){loc=k;render(items)};ch.appendChild(b2)});
  s.appendChild(ch);
  var show=loc?items.filter(function(i){return i.kind===loc}):items;
  document.getElementById('cnt').textContent=show.length+' / '+items.length+' mục';
  s.appendChild(el('p',{class:'hint'},'Bấm vào giá trị để sửa. Rời ô là lưu THẲNG ra file .md rồi dựng lại chỉ mục — không ghi vào database.'));
  items=show;
  items.forEach(function(it){
    var c=el('div',{class:'card'});var h=el('h3');h.appendChild(el('code',null,it.id));
    h.appendChild(el('small',null,it.path));c.appendChild(h);
    Object.keys(it.fields).forEach(function(k){
      var row=el('div',{class:'f'});row.appendChild(el('k',null,k));
      var d=el('d',{contenteditable:'true',spellcheck:'false'},it.fields[k]);
      d.dataset.old=it.fields[k];
      d.onblur=function(){save(it,k,d)};
      row.appendChild(d);c.appendChild(row)});
    s.appendChild(c)})}
function save(it,cot,d){var v=d.textContent;if(v===d.dataset.old)return;
  fetch('/api/sha?path='+encodeURIComponent(it.path)).then(function(r){return r.json()}).then(function(x){
    return fetch('/api/edit',{method:'POST',headers:{'content-type':'application/json','x-ba-token':TOKEN},
      body:JSON.stringify({path:it.path,id:it.id,cot:cot,giaTri:v,sha:x.sha})})})
   .then(function(r){return r.json()}).then(function(res){
     if(res.ok){d.dataset.old=v;msg('Đã lưu '+it.id+' · '+cot+' vào '+it.path,'k')}
     else{d.textContent=d.dataset.old;msg('KHÔNG lưu: '+res.loi,'e')}})}
document.getElementById('q').oninput=function(e){var q=e.target.value.trim();
  if(q.length<2){load();return}
  fetch('/api/find?q='+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(d){
    var s=document.getElementById('sec');s.innerHTML='';
    document.getElementById('cnt').textContent=d.hits.length+' kết quả';
    d.hits.forEach(function(h){var c=el('div',{class:'card'});var t=el('h3');t.appendChild(el('code',null,h.id));
      t.appendChild(el('small',null,h.path));c.appendChild(t);
      var r2=el('div',{class:'f'});r2.appendChild(el('k',null,'khớp'));r2.appendChild(el('d',null,h.snip));
      c.appendChild(r2);s.appendChild(c)})})}
tree();
window.onhashchange=function(){var t=tuHash();if(!t)return;
  var sel=t.man?('nav a[data-man="'+t.man+'"]'):('nav a[data-p="'+t.path.replace(/"/g,'\\"')+'"]');
  var a=document.querySelector(sel);if(a)pick(a,t)};
</script></body></html>`;
}

function nghe(port, còn) {
  server.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && còn > 0) return nghe(port + 1, còn - 1);
    console.error(e.message); process.exit(2);
  });
  server.listen(port, '127.0.0.1', () => {
    const u = `http://127.0.0.1:${port}/`;
    console.log(`BA Docs · ${DOCS}\n  ${u}\n  Ctrl-C để dừng. Sửa ở giao diện ghi THẲNG ra .md (không ghi vào DB).`);
    if (!args.includes('--no-open')) {
      try { spawn('open', [u], { stdio: 'ignore', detached: true }).unref(); } catch { /* không mở được thì thôi */ }
    }
  });
}
nghe(PORT0, 10);
