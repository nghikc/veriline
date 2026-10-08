---
name: ba-screens
description: Use when đã có 02-functions.md và cần suy ra DANH SÁCH màn, sơ đồ điều hướng, khung folder màn; bước 3, sinh 03-overview.md và 00-tracking.md. Đặc tả từng màn là ba-screen-spec.
---

# ba-screens — Chức năng → Màn hình + khung tài liệu

## Mục tiêu
Từ `docs/02-functions.md`: liệt kê màn hình, viết `docs/03-overview.md`, tạo khung folder mỗi màn hình, khởi tạo `docs/00-tracking.md`.

## Quy trình
1. Đọc `conventions.md` + `conv-gates.md` của `ba-toolkit` và `docs/02-functions.md`.
2. **Suy ra màn hình có hệ thống** bằng các kỹ thuật bên dưới; gom theo Nhóm. Gán mã `S01..` và map mỗi màn ↔ các chức năng (`F..`).
2b. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Suy ra danh sách màn xong nhưng **chưa ghi file, chưa tạo folder**: trình phương án đủ 6 phần — **bảng màn dự kiến** (`mã S · tên · nhóm · F.. phục vụ`) + cấu trúc folder sẽ tạo + `03-overview.md`/`00-tracking.md` TẠO hay GHI ĐÈ. `AskUserQuestion` **Chạy / Sửa phương án (thêm/bớt/gộp màn) / Thu hẹp phạm vi / Hủy**. Đây là cổng **rẻ nhất và đáng giá nhất của cả pipeline**: mã `S..` và cách chia màn một khi đã ghi ra thì mọi tài liệu phía sau bám theo, sửa sau rất đắt. Gọi từ `ba-init` (đã qua cổng tổng) → vẫn trình bảng màn để duyệt, nhưng gộp vào một lượt hỏi.
3. Viết `docs/03-overview.md` theo `overview-template.md` (bảng màn hình + **ma trận CRUD-to-Screen** + sơ đồ điều hướng + map chức năng↔màn hình).
4. Tạo khung thư mục rỗng dưới container `Screen-spec/`: với mỗi màn hình, `mkdir -p "docs/Screen-spec/<Nhóm>/<Mã> - <MànHình>/"` (nhóm 1 màn thì bỏ cấp `<Nhóm>`: `docs/Screen-spec/<Mã> - <MànHình>/`). Folder màn = `<Mã màn> - <Tên>`, vd `S01 - Login`; đặt tên theo `conventions.md`. Container `Screen-spec/` gom mọi folder màn cho gọn gốc `docs/`, trong suốt với truy vết.
5. Khởi tạo `docs/00-tracking.md` theo `tracking-template.md`: mỗi màn hình 1 dòng, mọi cột tài liệu = `⬜`.
   - **Chốt hồ sơ dự án (một lần, ngay đây — BA MỨC):** dự án đã đi qua `ba-start` (`.claude/ba-start.json` có `hồSơ`) → lấy giá trị đó làm mặc định, chỉ xác nhận một câu thay vì hỏi lại từ đầu. Chưa có → hỏi người dùng **`full`** (đầy đủ: 9 file/màn + sổ WI + nhật ký thay đổi + đối chiếu code + review agent) · **`lite`** (vẫn 9 file/màn, bỏ sổ WI/nhật ký/đối chiếu code/review agent) · **`mini`** (như `lite`, **và** rút còn **5 file/màn**: `ascii-screen · srs · html-design · test · plan` — hợp dự án 5–10 màn, 1–3 người) — kèm bảng so sánh ở `conv-gates.md` → "Hồ sơ dự án". Rồi ghi **một dòng** ngay dưới tiêu đề tracking: `> Hồ sơ dự án: \`lite\` · chốt <ngày>`. **Chốt `mini` thì chạy ngay `node .claude/skills/ba-track/scripts/refresh.js docs`** để bảng tracking dựng đúng 5 cột — `tracking-template.md` viết sẵn theo `full` (9 cột), `refresh.js` mới là canon của cột. Không hỏi được (batch) → **bỏ trống = `full`**, đừng tự chọn `lite` thay người dùng. Đây là chỗ duy nhất hồ sơ được khai; đổi sau chỉ cần sửa dòng đó.
6. Xác nhận với người dùng.

## Kỹ thuật áp dụng
- **User Journey Mapping:** đi theo hành trình của từng vai trò người dùng (từ điểm vào → mục tiêu) để phát hiện màn còn thiếu trong luồng, không chỉ liệt kê màn theo chức năng rời.
- **CRUD-to-Screen Coverage:** với mỗi thực thể/đối tượng quản lý chính, soát đủ bộ màn theo thao tác — List (danh sách/tìm kiếm), Detail (xem), Create (thêm), Edit (sửa); xác nhận xoá thường là dialog trong màn List/Detail.
- **Navigation / Sitemap:** vẽ sơ đồ điều hướng (Mermaid) thể hiện mọi đường đi giữa các màn; mỗi màn phải có ≥1 đường vào. **Ghi kèm kiểu chuyển cảnh** trên mỗi cạnh (vd fade/slide/modal) — chi tiết in/out để `ba-screen-spec` đặc tả ở design-spec (xem "Animation chuyển cảnh" trong `conventions.md`). **Không đặt ký tự đặc biệt trong text node/nhãn cạnh** (gây lỗi gen ảnh) — xem "Sơ đồ Mermaid — an toàn cú pháp" trong `conventions.md`.

## Tiêu chí chất lượng (BẮT BUỘC)
- **Phủ chức năng:** mỗi `F..` map về ≥1 màn; không chức năng nào không có nơi thực thi.
- **CRUD đủ bộ màn:** thực thể quản lý chính có đủ List/Detail/Create/Edit (hoặc ghi rõ lý do gộp/bỏ, vd "Create & Edit dùng chung 1 form").
- **Không màn mồ côi:** mọi màn trong danh sách phải xuất hiện trên sơ đồ điều hướng và có đường vào; ngược lại sơ đồ không tham chiếu màn chưa khai báo.

## Lưu ý
- Không tạo nội dung các file trong folder — chỉ tạo khung. Việc đó do `ba-screen-spec`/`ba-html-design`/`ba-test` làm.
- Tiếng Việt. Folder màn = `<Mã> - <Tên>` (tên PascalCase không dấu, vd `S01 - Login`); folder nhóm PascalCase không dấu — xem `conventions.md`.
- **Văn phong & Thuật ngữ:** mở rộng từ viết tắt ở lần đầu dùng; thêm footer `## Thuật ngữ` cuối `03-overview.md` + bổ sung thuật ngữ mới vào `docs/Ho-so/00-glossary.md` — xem `conventions.md`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
