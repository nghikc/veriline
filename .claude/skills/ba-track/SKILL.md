---
name: ba-track
description: Use when cần dựng lại docs/00-tracking.md (mỗi màn một dòng) theo file hiện có, hoặc vừa sửa một màn/chức năng và cần rà, cập nhật mọi tài liệu liên quan màn đó.
---

# ba-track — Truy vết & đồng bộ tài liệu

## Hai chế độ

> ⚙️ **Hồ sơ dự án quyết định số cột** (`conv-gates.md` → "Hồ sơ dự án"). `full`/`lite` → 9 cột tài liệu, "Hoàn thành" = 9/9. **`mini` → 5 cột** (`ascii · srs · html · test · plan`), "Hoàn thành" = **5/5** — `refresh.js` tự đọc hồ sơ và in `⚙️ mini: …`. Đừng đọc màn `mini` ✅ 5/5 thành "thiếu 4 tài liệu": 4 file kia không tồn tại theo thiết kế. Đổi hồ sơ rồi chạy refresh thì cột đổi theo, **file cũ trên đĩa không bị xoá**.

### Refresh — CHẠY SCRIPT, không làm tay
```bash
node .claude/skills/ba-track/scripts/refresh.js [docsDir=docs] [--dry] [--force]

**Chạy `--dry` trước, luôn.** Script GHI ĐÈ `00-tracking.md`. Nếu bảng sẽ **mất dòng**, script **từ chối ghi** (exit 2) và bắt xác nhận bằng `--force` — vì nguyên nhân thường gặp không phải màn bị xoá thật mà là script quét trượt (sai `docsDir`, folder đặt tên khác quy ước). Hợp nhất từ dự án desktop 11/09/2026: ở đó nó suýt xoá trắng 32 dòng viết tay.
```
Script (zero-dep) quét folder màn, dựng lại bảng đúng hiện trạng file: có file = ✅, thiếu = ⬜; **giữ nguyên** `⚠️` hiện có, cột `dev` (dev-run quản), Mã CN/Chức năng/Nhóm; cột `e2e` map ra `e2e.spec.ts` (ba-test-e2e sinh) nhưng KHÔNG tính vào bộ file hoàn thành của hồ sơ (9/9 ở `full`/`lite` · 5/5 ở `mini`); "Cập nhật cuối" = mtime mới nhất; folder mới → thêm dòng với Mã CN = `?`. KHÔNG tự dựng bảng bằng tay — script nhanh hơn và không sót ô.
**Phần của LLM sau khi script chạy:** (1) điền "Mã CN" cho dòng mới script để `?` (tra `02-functions.md`); (2) hạ `⚠️` → `✅` chỉ khi đã rà nội dung thật (chế độ Sync-on-change dưới); (3) xử lý cảnh báo folder biến mất.

### Sync-on-change (khi sửa 1 chức năng)
1. Người dùng chỉ định màn hình vừa đổi (vd `Login`).
2. Liệt kê toàn bộ 9 tài liệu của folder màn đó.
3. Rà soát nhất quán giữa các tài liệu: `srs` ↔ `usecase` ↔ `test` ↔ `design-spec` ↔ `html-design` ↔ `plan` (yêu cầu mới/đổi có phản ánh ở use case, test case, UI brief, HTML, plan không); nếu `design-spec` có mục "Bản Figma (preview)" thì kiểm cả Figma có lệch không. Riêng `test.md`: kiểm **bảng roll-up khớp từng TC** (đếm Pass/Fail/Blocked/Skip theo cột **Kết quả** + `Chưa chạy` theo cột **Trạng thái**), và TC bị sửa nội dung phải có **Trạng thái = `Chưa chạy`, Kết quả = `—`**.
4. Đánh dấu `⚠️` các tài liệu bị lệch trong tracking, rồi cập nhật từng tài liệu cho khớp (gọi lại skill tương ứng nếu cần: `ba-screen-spec` / `ba-figma-draw` / `ba-html-design` / `ba-test` / **`ba-build`** khi màn thiếu `plan.md`).
5. Khi đã đồng bộ, đổi `⚠️` → `✅` và cập nhật cột "Cập nhật cuối".

## Lưu ý
- Đọc `conventions.md` của `ba-toolkit` để biết cấu trúc và cột tracking.
- Tiếng Việt. Báo rõ tài liệu nào đã đổi.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Ranh giới

- Khác `ba-trace` (xuất RTM thành tài liệu) và `ba-review` (gate dò gap, ghi 00-gaps.md); `ba-track` chỉ dựng lại 00-tracking.md, mỗi màn một dòng.
