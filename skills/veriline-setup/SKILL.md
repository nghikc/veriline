---
name: veriline-setup
description: Use when người dùng muốn CÀI hay CẬP NHẬT Veriline (bộ BA toolkit) vào dự án đang mở sau khi cài plugin — chạy install.js từ cache plugin, chọn gói core/dev/full/mini/docs.
---

# veriline-setup — cửa cài Veriline từ plugin

Plugin `veriline` chỉ mang **một** skill này. Việc của nó: chép bộ toolkit (skill `ba-*`/`dev-*`/`ac-*`, agent, hook, khối luật trong `CLAUDE.md`) từ cache plugin vào **dự án đang mở**, đúng như lệnh `install.js --to .` của cách cài bằng git clone. Sau khi cài, mọi thứ chạy từ `.claude/` của dự án — plugin không còn vai trò gì cho tới lần cập nhật sau.

## Bước 0 — định vị nguồn (cache plugin)

Nguồn = `${CLAUDE_PLUGIN_ROOT}` — Claude Code thay chuỗi này bằng thư mục cache của plugin khi nạp skill (đã kiểm 08/10/2026); dưới đây gọi là **NGUỒN**. Cache nằm NGOÀI thư mục dự án, nên mọi lệnh chạm vào nó đều làm Claude Code hỏi quyền: **đừng `ls`/Read dò cache** — chỉ chạy đúng MỘT lệnh `node … install.js` ở Bước 3 (người dùng duyệt một lần), install.js tự báo khi nguồn thiếu file.

- Chữ `CLAUDE_PLUGIN_ROOT` còn nguyên trong lệnh (bản Claude Code không thay) → nguồn là thư mục mới nhất dạng `<thư mục cấu hình Claude>/plugins/cache/<marketplace>/veriline/<phiên bản>/`; hỏi người dùng đường dẫn nếu không chắc.
- install.js báo "nguồn không phải repo BA toolkit" → DỪNG, báo "cache plugin không đủ bộ — chạy `claude plugin update veriline` rồi thử lại". Không tự tải gì khác.

## Bước 1 — dự án đích và chế độ

- **ĐÍCH** = thư mục làm việc hiện tại (`pwd`, đường dẫn tuyệt đối). Từ chối nếu ĐÍCH là thư mục home hoặc nằm trong NGUỒN — hỏi lại người dùng thư mục dự án.
- Đích đã có `.claude/ba-toolkit.json` → **chế độ cập nhật**: bỏ Bước 2 (install.js nhớ gói đã chọn), chạy Bước 3 với `--check` trước, in tóm tắt, rồi chạy thật không cờ gói.

## Bước 2 — chọn gói (MỘT câu hỏi, có mặc định)

Đoán trước: đích có `package.json`/`pyproject.toml`/`go.mod`/`pom.xml`/`src/` → gợi ý thêm `--dev`. Hỏi một câu (AskUserQuestion nếu có), mặc định in đậm:

| Lựa chọn | Cờ |
|---|---|
| **Lõi BA (mặc định)** — ý tưởng → yêu cầu → màn → đặc tả → test → thiết kế HTML → portal | *(không cờ)* |
| Lõi + bộ viết code (dự án sẽ code) | `--dev` |
| Đủ mọi skill | `--profile full` |
| Gọn cho dự án 5–10 màn | `--profile mini` |
| Chỉ làm tài liệu, không code | `--scope docs` |

Người dùng đã nói rõ ("gói mặc định", "đủ bộ", "chỉ tài liệu"…) → không hỏi, dùng luôn.

## Bước 3 — chạy install.js

```bash
node "${CLAUDE_PLUGIN_ROOT}/.claude/skills/ba-export/scripts/install.js" --to "<ĐÍCH>" --from "${CLAUDE_PLUGIN_ROOT}" <cờ gói>
```

- Thay `<ĐÍCH>` bằng đường dẫn tuyệt đối từ `pwd`. `--from` là BẮT BUỘC: manifest của đích ghi đường dẫn nguồn lần trước (thư mục cache của bản plugin cũ) — không có `--from` thì lần cập nhật sẽ cài lại bản cũ.
- install.js từ chối (quét bảo mật 🔴, file đích đã sửa tay…) → in nguyên văn lý do, KHÔNG tự thêm `--force`/`--allow-unsafe`; hỏi người dùng.

## Bước 4 — báo và bàn giao

In 3–5 dòng: số skill đã cài (lấy từ output install.js, không tự đếm), gói đã chọn, rồi:

> Đã cài Veriline vào dự án. **Mở phiên Claude Code mới** trong thư mục này (skill và hook của dự án chỉ nạp lúc khởi động), rồi gõ `/ba-start`. Cập nhật về sau: `claude plugin update veriline` rồi gọi lại skill này.

## Ranh giới

- Khác `ba-export`: `ba-export` chạy **trong repo nguồn** hoặc trong dự án đã cài (`check`/`update`); skill này là cửa vào từ plugin, khi dự án chưa có gì.
- Không sửa `docs/`, không chạy skill BA nào — bước kế là `/ba-start` (người mới) hoặc `/ba-next` ở phiên mới.
