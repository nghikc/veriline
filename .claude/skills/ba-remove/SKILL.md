---
name: ba-remove
description: Use when cần CẮT phạm vi — bỏ màn, gộp hai màn, loại chức năng — dò ai đang trỏ tới, mở CR, dọn mọi tham chiếu, dời folder vào Ho-so/removed. Ngược ba-add-screen.
---

# ba-remove — Cắt phạm vi (bỏ màn · gộp màn · bỏ chức năng)

## Mục tiêu
Mọi orchestrator khác của toolkit đi **xuôi**: thêm yêu cầu, thêm chức năng, thêm màn. Nhưng cắt phạm vi là việc BA làm thường xuyên — khách bỏ tính năng, hai màn hoá ra là một, một chức năng chuyển sang phase sau. Làm tay thì để lại đúng loại rác mà toolkit sinh ra để chống: `03-overview.md` còn trỏ màn đã xoá, `00-tracking.md` còn dòng ma, `TC` mồ côi, `plan.md` khai file không ai build, sổ CR không có dòng nào giải thích vì sao mất.

Skill này làm phần đó **có kỷ luật**: soi ngược ai đang phụ thuộc → mở CR → dọn → chứng minh đã sạch.

> **Đây LUÔN là thay đổi baseline.** Thứ sắp bỏ đã được duyệt, đã có người lập kế hoạch dựa trên nó. Vì vậy skill này **không có nhánh bỏ chờ** và **luôn đi qua `ba-change-request`** — không có chế độ "xoá nhanh".

## Cách gọi
- `ba-remove màn <Mã|Tên>` — bỏ hẳn một màn hình.
- `ba-remove gộp <MãA> vào <MãB>` — gộp màn A vào màn B (A biến mất, chức năng của A về B).
- `ba-remove chức năng <F..>` — loại một chức năng khỏi phạm vi (có thể kéo theo màn nào đó rỗng).

## Quy trình

### 0. Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án")
**Đọc trước khi trình:** `01-requirements.md`, `02-functions.md`, `03-overview.md`, `00-tracking.md`, và toàn bộ folder của (các) màn liên quan.

Phần **"Sẽ làm"** phải là **bảng ảnh hưởng ngược** (mục 1 dưới), không phải danh sách file xoá. Phần **"Ngoài phạm vi"** nêu rõ: **không** đụng code (việc của `dev-run`/`ba-task` kiểu Bug), **không** xoá dòng sổ CR/WI/changelog (sổ là lịch sử).

`AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Cắt phạm vi luôn trên ngưỡng → **không có nhánh bỏ chờ**, kể cả khi người dùng nói "chạy thẳng" và kể cả khi được orchestrator gọi xuống (ngoại lệ (b) của "Cổng cha bao phủ cổng con": đây là cửa vào thay đổi baseline).

### 1. Phân tích ảnh hưởng NGƯỢC (đặc trưng của skill này)
Các skill khác lần theo chuỗi truy vết **xuôi** (`FR → F → S → TC`). Ở đây phải đi **ngược**: *ai đang trỏ tới thứ sắp bỏ?* Chạy `node .claude/skills/ba-trace/scripts/scan.js` lấy đồ thị ID, rồi lập bảng:

| Loại phụ thuộc | Tìm ở đâu | Xử lý |
|---|---|---|
| **Chức năng mồ côi** | `F..` của màn bị bỏ có màn nào khác phục vụ không | Không còn màn nào → `F` cũng phải bỏ, hoặc chuyển cho màn khác. **Không để `F` treo.** |
| **Yêu cầu mồ côi** | `FR`/`BR` chỉ được hiện thực bởi `F` sắp bỏ | Nêu ra để người dùng chốt: bỏ luôn yêu cầu, hay dời sang phase sau (`08-roadmap.md`) |
| **Đường điều hướng** | sơ đồ trong `03-overview.md`, `sitemap-flows.md` | Màn khác có cạnh trỏ tới màn bị bỏ → **phải nối lại**, không để cạnh trỏ vào hư không |
| **Tham chiếu chéo trong srs** | `grep` mã `S..`/`R-S..` bị bỏ trong mọi `srs.md`/`usecase.md`/`test.md` | Sửa từng chỗ; màn khác mô tả "chuyển sang màn X" mà X biến mất là dead-end nghiệp vụ |
| **Kế hoạch & code** | `plan.md` các màn, cột `dev` trong tracking | `dev = ✅` → **code đã tồn tại**: nêu ở "Câu hỏi chặn", mở `ba-task` kiểu `Tech` để gỡ code, đừng chỉ xoá tài liệu |
| **UAT / roadmap / CR đang mở** | `09-uat.md`, `08-roadmap.md`, `00-cr.md` | Kịch bản UAT hoặc CR đang mở trỏ tới thứ sắp bỏ → xử trước, không bỏ qua |

**Luật chặn:** còn bất kỳ dòng nào chưa có cách xử lý → **DỪNG**, hỏi người dùng. Cắt phạm vi mà để lại mã treo còn tệ hơn không cắt.

### 2. Mở CR (BẮT BUỘC)
Invoke `ba-change-request` với mô tả = phạm vi cắt + bảng ảnh hưởng ngược ở bước 1. CR đi hết vòng đời của nó (`Đề xuất → Đang phân tích → cổng duyệt`). **Từ chối/Hoãn → dừng hẳn ở đây, chưa đụng file nào.** Duyệt → tiếp bước 3.

### 3. Dọn — theo đúng thứ tự này
Thứ tự quan trọng: dọn tham chiếu **trước**, xoá thứ được trỏ tới **sau**. Ngược lại thì mất luôn manh mối để tìm chỗ cần sửa.

1. **`01-requirements.md` / `02-functions.md`** — bỏ hoặc đánh dấu `FR`/`F` không còn trong phạm vi. **Không xoá mã, ghi trạng thái** `Won't (CR-NN)` — mã đã bị trích dẫn ở nơi khác, xoá hẳn là làm gãy lịch sử. Cập nhật ma trận CRUD + ma trận phân quyền.
2. **`03-overview.md`** — bỏ dòng màn, sửa map chức năng↔màn, **vẽ lại sơ đồ điều hướng** (nối lại các cạnh đi qua màn bị bỏ), cập nhật ma trận CRUD-to-Screen.
3. **Màn khác bị chạm** — sửa `srs.md`/`usecase.md`/`test.md` chỗ trỏ tới thứ bị bỏ. **Gộp màn:** chuyển `R-S`/`UC`/`US`/`TC` của A sang B — **cấp mã mới theo B**, giữ bảng ánh xạ `mã cũ → mã mới` trong mục chi tiết của CR để truy vết không đứt.
4. **Folder màn bị bỏ** — **KHÔNG `rm` thẳng.** Di chuyển sang `docs/Ho-so/removed/<Mã> - <Tên>/` kèm một dòng đầu mỗi file: `> 🗑️ Đã cắt khỏi phạm vi theo CR-NN, ngày …`. Lịch sử giữ được, portal không gom (nằm ngoài `Screen-spec/`), và khôi phục được nếu khách đổi ý — chuyện rất hay xảy ra.
5. **`08-roadmap.md` / `09-uat.md`** nếu có trỏ tới.

### 4. Refresh & chứng minh đã sạch
1. `node .claude/skills/ba-track/scripts/refresh.js` — dòng ma biến mất theo hiện trạng file.
2. `node .claude/skills/ba-trace/scripts/scan.js docs --for <mã vừa bỏ>` — **so với kết quả bước 1**: lát cắt phải rỗng (`cạnh: []`, `cóTrongTàiLiệu: false`) và **không phát sinh** `brokenRefs` mới. (`--for` thay cho việc xả cả `edges`: hỏi đúng một mã thì đọc vài dòng, không phải cả trăm KB.) Còn ref gãy → quay lại bước 3, chưa xong.
3. **Gate:** `ba-review all`. Còn 🔴/🟡 → sửa rồi chạy lại.
4. Đóng CR (`Đã triển khai` → `Đóng`), điền Phạm vi thực tế = danh sách file đã sửa/di chuyển.

### 5. Báo cáo
Bảng: thứ đã cắt · CR · file đã sửa · folder đã chuyển vào `removed/` · mã đã đổi (nếu gộp) · việc còn lại (WI gỡ code nếu có). Nhắc: **code chưa được gỡ** nếu màn từng `dev = ✅`.

## Lưu ý
- **Không xoá dòng sổ** (`00-cr.md`/`00-backlog.md`/`00-changelog.md`) — sổ là lịch sử, kể cả lịch sử của thứ đã bị bỏ.
- **Không đụng code.** Skill này dọn tài liệu; gỡ code là `ba-task` kiểu `Tech` + `dev-run`.
- **Gộp màn ≠ bỏ màn:** gộp phải **chuyển** yêu cầu/test sang màn đích và giữ bảng ánh xạ mã; bỏ thì mới được để chúng biến mất (sau khi đã chốt là không còn cần).
- Cắt cả một **nhóm màn** → làm từng màn một, đừng gộp một CR khổng lồ; mỗi màn một lượt bước 1–4 cho dễ rà.
- Tiếng Việt; tuân toàn bộ quy ước `conventions.md` (ID, folder, tracking) + `conv-gates.md` (cổng).
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Ranh giới

- Chiều ngược của `ba-add-screen`/`ba-add-feature`.
