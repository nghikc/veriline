'use strict';
/*
 * ba-index/write-back.js — ghi một ô bảng markdown NGƯỢC ra file `.md`. Module, không phải CLI.
 *
 * Đây là chỗ nguy hiểm nhất của cả tính năng giao diện web: sai một lần là hỏng tài liệu nguồn,
 * và nguồn thì không có bản sao nào khác ngoài git. Nên mọi thứ ở đây đều là chốt chặn, và hàm
 * TỪ CHỐI thay vì đoán bất cứ khi nào không chắc.
 *
 * Nguyên tắc: chỉ đổi ĐÚNG một ô. Mọi byte khác của file phải nguyên vẹn — kể cả khoảng trắng,
 * xuống dòng cuối file, và các dòng bảng khác.
 */
const fs = require('fs');
const crypto = require('crypto');

const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 16);
const chuẩnHoá = (s) => String(s).replace(/\s+/g, ' ').replace(/[`*]/g, '').trim();

/**
 * @returns {{ok:true, sha:string} | {ok:false, loi:string}}
 * @param {string} file  đường dẫn tuyệt đối tới .md
 * @param {string} id    mã ở ô đầu dòng, vd 'BRule-S01-06'
 * @param {string} cot   tên cột (đúng như tiêu đề bảng)
 * @param {string} giaTri giá trị mới
 * @param {string|null} shaKyVong  sha lúc đọc — lệch nghĩa là file đã đổi từ lúc đó
 */
function ghiO(file, id, cot, giaTri, shaKyVong = null) {
  if (typeof giaTri !== 'string') return { ok: false, loi: 'Giá trị phải là chuỗi' };
  // `|` sẽ cắt ô làm đôi và làm lệch toàn bộ bảng. Không tự escape: người dùng phải biết mình
  // đang gõ vào một bảng markdown, im lặng đổi ký tự của họ là một kiểu nói dối.
  if (giaTri.includes('|')) return { ok: false, loi: 'Giá trị không được chứa ký tự `|` — nó cắt ô bảng làm đôi' };
  if (/[\r\n]/.test(giaTri)) return { ok: false, loi: 'Xuống dòng không hợp lệ trong ô bảng — dùng `<br>`' };

  let nội;
  try { nội = fs.readFileSync(file, 'utf8'); } catch (e) { return { ok: false, loi: `Không đọc được file: ${e.message}` }; }
  // Ghi đè lên một file đã đổi từ lúc đọc = xoá mất thay đổi của người khác, hoặc ghi vào đúng
  // vị trí cũ của một dòng đã dịch chuyển. Từ chối, không cố hoà giải.
  if (shaKyVong && sha(nội) !== shaKyVong) {
    return { ok: false, loi: 'File đã thay đổi kể từ lúc mở — tải lại rồi sửa tiếp (không ghi đè)' };
  }

  const dòng = nội.split('\n');
  let cột = null; let chỉSố = -1; let dòngKhớp = -1; let soKhớp = 0;
  for (let i = 0; i < dòng.length; i++) {
    const l = dòng[i];
    if (!l.trim().startsWith('|')) { cột = null; continue; }
    const ô = l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|');
    if (ô.every((c) => /^\s*:?-{2,}:?\s*$/.test(c))) {
      const trên = dòng[i - 1];
      cột = trên && trên.trim().startsWith('|')
        ? trên.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((x) => chuẩnHoá(x))
        : null;
      continue;
    }
    if (!cột) continue;
    if (chuẩnHoá(ô[0]) !== chuẩnHoá(id)) continue;
    soKhớp++;
    const j = cột.indexOf(chuẩnHoá(cot));
    if (j > 0) { dòngKhớp = i; chỉSố = j; }
  }

  if (soKhớp === 0) return { ok: false, loi: `Không thấy dòng \`${id}\` trong file` };
  // Cùng một ID ở hai bảng khác nhau trong một file: không đoán bảng nào là đúng.
  if (soKhớp > 1) return { ok: false, loi: `\`${id}\` xuất hiện ${soKhớp} lần trong file — không rõ sửa dòng nào, sửa tay` };
  if (dòngKhớp < 0) return { ok: false, loi: `Bảng chứa \`${id}\` không có cột \`${cot}\`` };

  const l = dòng[dòngKhớp];
  const đuôi = /\|\s*$/.test(l);
  const ô = l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|');
  if (chỉSố >= ô.length) return { ok: false, loi: `Dòng \`${id}\` không có đủ ${chỉSố + 1} ô` };
  ô[chỉSố] = ` ${giaTri.trim()} `;
  dòng[dòngKhớp] = '|' + ô.join('|') + (đuôi ? '|' : '');

  const mới = dòng.join('\n');
  fs.writeFileSync(file, mới, 'utf8');
  return { ok: true, sha: sha(mới) };
}

module.exports = { ghiO, sha };
