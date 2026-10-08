# Nhật ký thay đổi tài liệu — <Tên dự án>

> Ghi lại **tài liệu ĐÃ CHỐT** (màn ✅ trong `00-tracking.md`) đã bị sửa những gì và tác động nghiệp vụ ra sao. Sổ do `ba-changelog` quản; nguồn là hàng đợi `.claude/spec-changes.jsonl` do hook ghi tự động.
>
> **Sổ này KHÔNG thay `00-cr.md`.** CR trả lời *"được phép đổi không?"* (trước khi sửa); sổ này trả lời *"thực tế đã đổi gì?"* (sau khi sửa). Dòng 🔴 mang cờ `⚠️ chưa có CR` là **cảnh báo cần mở CR**, không phải sự cho phép.
>
> **Không xoá dòng.** Ghi sai → thêm dòng đính chính ở trên, giữ nguyên dòng cũ.

**Mức:** 🔴 đổi baseline (quy tắc/điều kiện chấp nhận/phạm vi/quyền) · 🟡 đáng chú ý (trường, wording, luồng phụ) · 🟢 nhỏ (chính tả, định dạng, làm rõ)

## Nhật ký

| Ngày | Màn | File | Mức | Thay đổi (tác động nghiệp vụ) | Mã chạm | CR/WI | Người ghi |
|---|---|---|---|---|---|---|---|
| 2026-01-01 | Login | `srs.md` | 🔴 | *(ví dụ)* Siết quy tắc khoá tài khoản từ 5 lần sai còn 3 lần — người dùng dễ bị khoá hơn, CSKH sẽ nhận nhiều yêu cầu mở khoá hơn | `BRule-S01-01`, `FR-01` | ⚠️ chưa có CR | ba-changelog |

## Cờ đang treo

> Dòng 🔴 chưa có CR phủ — cần xử lý, không để trôi. Xử lý xong (đã mở CR / đã xác nhận chấp nhận) thì chuyển xuống mục dưới kèm ngày.

| Ngày phát hiện | Màn | Vấn đề | Đề xuất |
|---|---|---|---|
| — | — | *(chưa có)* | — |

## Cờ đã xử lý

| Ngày phát hiện | Ngày xử lý | Vấn đề | Cách xử lý |
|---|---|---|---|
| — | — | *(chưa có)* | — |

## Mâu thuẫn đã phát hiện qua nhật ký

> Thay đổi làm lệch tài liệu khác (srs sửa quy tắc mà test giữ expected cũ…). Soát mâu thuẫn toàn cục vẫn là việc của `ba-review`/`ba-consistency-reviewer`; đây chỉ ghi cái lộ ra khi quan sát thay đổi.

| Ngày | Màn | Mâu thuẫn | Trạng thái |
|---|---|---|---|
| — | — | *(chưa có)* | — |

## Thuật ngữ
| Thuật ngữ | Giải thích |
|---|---|
| Baseline | Tài liệu đã chốt — ở đây là tài liệu của màn ✅ Hoàn thành trong `00-tracking.md` |
| Hàng đợi | `.claude/spec-changes.jsonl` — bộ đệm ghi vết thay đổi do hook sinh, không phải tài liệu |
| Cờ `⚠️ chưa có CR` | Thay đổi baseline không có Change Request nào phủ — cần mở CR hoặc xác nhận chấp nhận |

> Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`.
