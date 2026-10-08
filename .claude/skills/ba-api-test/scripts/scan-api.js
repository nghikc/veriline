#!/usr/bin/env node
/*
 * ba-api-test/scan-api.js — kiểm kê CƠ GIỚI bề mặt API (zero-dependency).
 *
 * Nguyên tắc của toolkit: script làm phần ĐẾM ĐƯỢC, agent làm phần PHÁN ĐƯỢC. Ở đây script bóc
 * ra: có bao nhiêu endpoint, mỗi cái khai những mã trạng thái nào, trace về `F..` nào, có cần auth
 * không, thân request ra sao. Nó KHÔNG phán ca test nào đáng viết — đó là việc của skill.
 *
 * Đọc: docs/06-api-spec.md (API mình tự phát) · docs/12-api-integration.md (API đối tác — EXT-..)
 * Dùng:  node .claude/skills/ba-api-test/scripts/scan-api.js [docsDir=docs] [--plain]
 */
'use strict';
if (process.stdout._handle && process.stdout._handle.setBlocking) process.stdout._handle.setBlocking(true); // stdout đồng bộ: JSON > 64 KB qua pipe không bị cắt khi process.exit (lint 43)
const fs = require('fs');
const path = require('path');
const { readDoc } = require(path.join(__dirname, '..', '..', 'ba-toolkit', 'scripts', 'docpath.js'));

const argv = process.argv.slice(2).filter(a => !a.startsWith('--'));
const PLAIN = process.argv.includes('--plain');
const DOCS = path.resolve(argv[0] || 'docs');

const own = readDoc(DOCS, '06-api-spec.md');
const partner = readDoc(DOCS, '12-api-integration.md');
if (!own && !partner) {
  console.error('Không thấy 06-api-spec.md lẫn 12-api-integration.md — chạy /ba-api-spec hoặc /ba-api-integration trước.');
  process.exit(2);
}

const METHODS = 'GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS';

/** Bóc endpoint từ các mục `### METHOD /path — Tên (F..)` + phần thân tới mục kế. */
function parseEndpoints(txt, nguồn) {
  if (!txt) return [];
  const lines = txt.split('\n');
  const heads = [];
  lines.forEach((l, i) => {
    const m = l.match(new RegExp(`^###\\s+(${METHODS})\\s+(\\S+)\\s*(?:[—-]\\s*(.*))?$`));
    if (m) heads.push({ i, method: m[1], path: m[2], title: (m[3] || '').trim() });
  });
  return heads.map((h, k) => {
    const body = lines.slice(h.i + 1, k + 1 < heads.length ? heads[k + 1].i : lines.length).join('\n');
    // Mã trạng thái khai trong mục "Mã trạng thái" — đây là NGUỒN của ca test negative.
    const codes = [...new Set([...body.matchAll(/^\s*[-*]\s*`(\d{3})`\s*[—-]\s*(.+)$/gm)]
      .map(m => ({ code: m[1], nghĩa: m[2].replace(/`[^`]*`/g, '').trim() })).map(o => JSON.stringify(o)))].map(JSON.parse);
    const fr = [...new Set([...(h.title + body).matchAll(/\bF\d{2}\b/g)].map(m => m[0]))];
    const ext = [...new Set([...(h.title + body).matchAll(/\bEXT-\d+\b/g)].map(m => m[0]))];
    return {
      nguồn, method: h.method, path: h.path,
      tên: h.title.replace(/\s*\([^)]*\)\s*$/, '').trim(),
      trace: fr, ext,
      cầnAuth: /Authorization|Bearer|\bAuth\b\s*\|?\s*Có/i.test(body) || undefined,
      cóBody: /\*\*Request body/i.test(body),
      mãTrạngThái: codes,
      dòng: h.i + 1,
    };
  });
}

const eps = [...parseEndpoints(own, '06-api-spec.md'), ...parseEndpoints(partner, '12-api-integration.md')];

/** Bảng tổng endpoint (mục "1. Bảng tổng endpoint") — nguồn khai BỀ MẶT đầy đủ.
 *  Đặc tả hay khai đủ ở bảng rồi chỉ viết chi tiết cho một phần. Không đối chiếu thì người viết
 *  test phủ đúng phần CÓ CHI TIẾT và tưởng là đã phủ hết — đo thật trên dự án mẫu: bảng 23,
 *  chi tiết 11. Đây là cảnh báo cơ giới, không phải phán xét: có thể 12 cái kia cố ý để sau. */
function parseBảngTổng(txt) {
  if (!txt) return [];
  const rows = [...txt.matchAll(new RegExp(`^\\|\\s*(${METHODS})\\s*\\|\\s*(\\S+)\\s*\\|`, 'gm'))];
  return rows.map(m => `${m[1]} ${m[2]}`);
}
const khaiBảng = [...new Set([...parseBảngTổng(own), ...parseBảngTổng(partner)])];
const cóChiTiết = new Set(eps.map(e => `${e.method} ${e.path}`));
const thiếuChiTiết = khaiBảng.filter(k => !cóChiTiết.has(k));
const ngoàiBảng = khaiBảng.length ? [...cóChiTiết].filter(k => !khaiBảng.includes(k)) : [];

// Cảnh báo cơ giới: endpoint KHÔNG khai mã lỗi nào → không có gốc để viết ca negative.
const thiếuMã = eps.filter(e => !e.mãTrạngThái.some(c => +c.code >= 400)).map(e => `${e.method} ${e.path}`);
const thiếuTrace = eps.filter(e => !e.trace.length && !e.ext.length).map(e => `${e.method} ${e.path}`);
const tổngMã = eps.reduce((s, e) => s + e.mãTrạngThái.length, 0);

const out = {
  docs: path.relative(process.cwd(), DOCS),
  nguồn: { '06-api-spec.md': !!own, '12-api-integration.md': !!partner },
  tổngEndpoint: eps.length, tổngMãTrạngThái: tổngMã,
  tổngKhaiỞBảng: khaiBảng.length,
  cảnhBáo: { endpointKhôngKhaiMãLỗi: thiếuMã, endpointKhôngTrace: thiếuTrace, khaiBảngNhưngKhôngCóChiTiết: thiếuChiTiết, cóChiTiếtNhưngKhôngKhaiỞBảng: ngoàiBảng },
  endpoints: eps,
};

if (!PLAIN) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log(`\n=== Kiểm kê API (${out.docs}) ===`);
console.log(`   ${eps.length} endpoint CÓ CHI TIẾT / ${khaiBảng.length} khai ở bảng tổng · ${tổngMã} mã trạng thái`);
for (const e of eps) console.log(`   ${e.method.padEnd(6)} ${e.path.padEnd(34)} ${String(e.mãTrạngThái.length).padStart(2)} mã · ${(e.trace.concat(e.ext).join(',') || '—')}`);
if (thiếuMã.length) console.log(`\n  ⚠️  ${thiếuMã.length} endpoint KHÔNG khai mã lỗi nào — không có gốc để viết ca negative:\n     ${thiếuMã.join('\n     ')}`);
if (thiếuTrace.length) console.log(`\n  ⚠️  ${thiếuTrace.length} endpoint không trace về F../EXT-..:\n     ${thiếuTrace.join('\n     ')}`);
if (thiếuChiTiết.length) console.log(`\n  ❗ ${thiếuChiTiết.length} endpoint khai ở BẢNG TỔNG nhưng KHÔNG có mục chi tiết — viết test từ đây là phủ thiếu mà không biết:\n     ${thiếuChiTiết.join('\n     ')}`);
if (ngoàiBảng.length) console.log(`\n  ⚠️  ${ngoàiBảng.length} endpoint có chi tiết nhưng thiếu ở bảng tổng:\n     ${ngoàiBảng.join('\n     ')}`);
