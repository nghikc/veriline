---
name: ba-launcher
description: Use when cần MÀN HÌNH web local để duyệt các skill của bộ BA toolkit và cài cả bộ vào dự án khác bằng nút chọn thư mục, không cần nhớ lệnh install.js.
---

# ba-launcher — Màn hình duyệt skill & cài toolkit

## Mục tiêu
Một cửa **bằng giao diện** cho người không muốn gõ lệnh: mở một trang web chạy tại chỗ (`127.0.0.1`) để

1. **Duyệt toàn bộ skill** — sidebar nhóm theo họ (luồng chính · tài liệu hệ thống · phân tích & kế hoạch · orchestrator · tiện ích · dev), ô tìm kiếm, mỗi skill có tab **Nghiệp vụ** (trích từ `explain/`), tab **Chi tiết** (`SKILL.md`) và tab cho từng **file đồng hành** (`templates.md`, `conventions.md`, `rules/`, script `.js`…).
2. **Cài cả bộ vào một dự án khác** — nút *Cài vào dự án…* → hộp thoại **chọn thư mục native của macOS** → tự chạy kiểm tra → bấm **Cài đặt**. Sau đó Claude Code mở trong dự án đó có đầy đủ kiến thức BA.

Không tự render markdown riêng: mỗi trang nội dung là `ba-portal/build.js --single` (một nguồn render duy nhất cho cả toolkit). Không tự copy file: nút cài gọi thẳng `ba-export/install.js` (một nguồn chính sách cài đặt duy nhất — giữ file sửa cục bộ, manifest, `--check`).

## Cách dùng
```
node .claude/skills/ba-launcher/scripts/server.js
```
In ra URL (mặc định `http://127.0.0.1:4321`) và tự mở trình duyệt trên macOS. `Ctrl+C` để dừng.

| Cờ | Ý nghĩa |
|---|---|
| `--port <n>` | Cổng bắt đầu (mặc định `4321`); bận thì tự nhảy sang cổng kế, tối đa +20 |
| `--no-open` | Không tự mở trình duyệt |

**Khi được gọi như một skill:** chạy server **ở chế độ nền** rồi đưa URL cho người dùng — đừng chạy chặn phiên. Nhắc họ `Ctrl+C`/tắt tiến trình khi xong.

## Ba nút trong hộp thoại cài đặt
| Nút | Chạy | Ghi gì |
|---|---|---|
| **Kiểm tra** | `install.js --check` | Không ghi gì. Báo dự án đích thiếu/cũ những file nào, file nào bạn đã **sửa cục bộ** |
| **Thử khô** | `install.js --dry` | Không ghi gì. Liệt kê chính xác danh sách file sẽ copy |
| **Cài đặt** | `install.js` | Copy thật + ghi `CLAUDE.md` + manifest `.claude/ba-toolkit.json` |

Hai tùy chọn nâng cao: `--force` (ghi đè cả file đã sửa cục bộ ở đích) và `--prune` (xóa skill `ba-`/`dev-` thừa ở đích). Mặc định **không** bật — chính sách của installer là *giữ bản cục bộ, chỉ cảnh báo*.

Chọn thư mục xong, skill tự chạy **Kiểm tra** trước để bạn thấy hệ quả rồi mới bấm cài.

## Khi nào dùng
- Muốn **xem** toolkit có gì trước khi cài, hoặc giới thiệu bộ toolkit cho người khác.
- Cài toolkit vào một dự án mà **không muốn nhớ đường dẫn** `install.js`.
- Muốn tra nhanh nội dung một skill (kể cả `conventions.md`, `templates.md`) mà không phải mở IDE.

**KHÔNG dùng khi.** Bạn đang ở trong một phiên Claude Code và chỉ cần *chạy* một skill — cứ gọi thẳng `/<tên-skill>`, hoặc `ba-next` nếu chưa biết chạy gì. Cần cài bằng dòng lệnh/CI thì dùng `ba-export` trực tiếp.

## Lưu ý
- **Chỉ nghe trên `127.0.0.1`**, kiểm tra header `Host` (chặn DNS-rebinding). Mọi hành động có ghi/chạy tiến trình (chọn thư mục, cài đặt) đòi **token** sinh lúc khởi động và chỉ nhúng vào trang do chính server phát ra — trang web khác trong cùng trình duyệt không sai khiến installer được.
- **Hộp thoại chọn thư mục** dùng `osascript choose folder` → chỉ có trên **macOS**. Hệ khác: dán đường dẫn tuyệt đối vào ô nhập (mọi thứ còn lại chạy bình thường).
- Log của installer **stream trực tiếp** ra màn hình trong lúc chạy, kèm mã thoát.
- Chạy được cả trong **dự án tiêu dùng** (đã cài toolkit): tab Nghiệp vụ đọc `explain/` thay cho `explain/`; nút cài vẫn chạy vì `install.js` tự tìm nguồn qua manifest `.claude/ba-toolkit.json`.
- Zero-dependency, CommonJS, chỉ cần Node — không `npm install`.
- Trang nội dung render qua `ba-portal/build.js` nên **thừa hưởng nguyên** bảng GFM, code/ASCII, ảnh base64, Mermaid offline và lightbox của portal.
