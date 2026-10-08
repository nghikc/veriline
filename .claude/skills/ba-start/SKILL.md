---
name: ba-start
description: Use when lần đầu dùng Veriline hay chưa biết bắt đầu từ đâu — nhận diện dự án, chạy demo 10 phút rồi vào dự án thật.
---

# ba-start — Cửa vào cho người mới

## Mục tiêu
Người vừa cài xong, chưa biết gõ gì: trong **≤ 15 phút** họ thấy được bộ skill làm ra cái gì (một cổng tài liệu thật, một màn được AI đặc tả ngay trước mắt), rồi được dẫn vào **đúng cửa** cho dự án của họ — không phải đọc cả pipeline trước.

Người đọc là **người mới**: mọi câu in ra viết cho họ. Không dùng mã nội bộ (GĐ, gate, CR, WI, srs…) khi chưa giải nghĩa; thuật ngữ BA lần đầu xuất hiện kèm nửa câu giải thích ("test case — các ca kiểm thử từng tình huống").

## Quy trình

### 0. Nhận diện dự án
```bash
node .claude/skills/ba-start/scripts/detect.js --json
```
Trả `loại` (một trong `có-docs` · `code-và-tài-liệu` · `có-code` · `tài-liệu-rời` · `ý-tưởng`) + dấu hiệu đã thấy + `đềXuất`.
- **`có-docs`** → dự án đã dùng bộ skill: in một câu ("dự án đã có tài liệu — xem đang ở bước nào") rồi **chuyển sang `ba-next`**, dừng ở đây.
- Còn lại → nói lại cho người dùng bằng lời thường thấy gì ("thấy `package.json` và thư mục `src/` — dự án đã có code", "thấy 4 file PDF/Word") — đây là gợi ý, **người dùng chốt**.
- Ghi loại người dùng chốt: `node .claude/skills/ba-start/scripts/ledger.js set loại=<loại>` (ghi đè được, chạy lại vô hại).

### 1. Một câu hỏi
**AskUserQuestion**: **Xem demo 10 phút trước (Khuyến nghị)** — thấy bộ skill làm gì trên một app mẫu · **Vào thẳng dự án của tôi** → bước 3.

### 2. Demo (~10 phút)
**Cổng phương án (in rồi làm, không chờ duyệt):** demo chỉ ghi vào `veriline-demo/` (thư mục riêng, được thêm vào `.gitignore`) và `.claude/ba-start.json` — in một dòng "Sẽ tạo `veriline-demo/` (app mẫu TeamTasks — tài liệu ~260 KB, cổng tài liệu HTML ~4 MB), thêm 1 dòng `.gitignore`" rồi chạy luôn. Người mới không nên bị hỏi duyệt một bảng phương án ngay lượt đầu; mọi bước ghi vào `docs/` THẬT vẫn đi qua cổng của skill tương ứng.

**2a. Xem thành phẩm (~2 phút, không tốn token):**
```bash
node .claude/skills/ba-start/scripts/demo.js
```
Tạo `veriline-demo/docs/` (TeamTasks — app quản lý công việc nhóm, 6 màn: màn S03 làm xong đủ bộ, màn S04 mới có phác thảo, 4 màn chưa làm), dựng cổng tài liệu `veriline-demo/docs/Ho-so/portal.html`, ghi mốc `demoPortalAt`. Bảo người dùng **mở portal** (lệnh `open`/`xdg-open` script đã in) và chỉ cho họ ba chỗ: yêu cầu + chức năng · màn S03 (đặc tả, test case, bản thiết kế HTML) · ma trận theo dõi.

**2b. Xem AI đặc tả một màn (~7–11 phút):** báo trước chi phí bằng `node .claude/skills/ba-toolkit/scripts/cost.js estimate ba-screen-spec`, nói lại bằng lời thường ("khoảng 200 nghìn token — chạy thử 08/10 trên Opus hết ~2,5 USD, ~7 phút") rồi hỏi một câu **Chạy / Bỏ qua**. Chạy → gọi **`ba-screen-spec` cho S04** với **gốc tài liệu là `veriline-demo/docs`**:
- mọi đường dẫn `docs/…` của skill đó hiểu là `veriline-demo/docs/…`; KHÔNG ghi vào `docs/` của dự án;
- câu **Chạy** ở trên chính là lời duyệt: Cổng phương án của `ba-screen-spec` ở demo **in phương án rồi làm** (chỉ ghi trong `veriline-demo/`) — không bắt người mới duyệt bảng mã ngay lượt thứ hai;
- `ascii-screen.md` của S04 đã có → giữ nguyên, sinh 5 file còn lại; demo không có `00-glossary.md`, `05`/`06`/`07` → thuật ngữ để ở footer srs, endpoint/trường dữ liệu ghi là đề xuất; câu hỏi nghiệp vụ → tự trả lời theo `01-requirements` của demo và đánh dấu giả định.

Xong → `demo.js` lần nữa (chỉ dựng lại cổng tài liệu, giữ mọi thay đổi) rồi chỉ màn S04 vừa có. Đừng chạy `ba-next` cho demo (gốc `docs/` thật chưa có).

**2c. Kết:** hai câu — "thứ bạn vừa thấy là cái bộ skill sẽ làm cho dự án của bạn: mỗi màn có đặc tả, test case, thiết kế, kế hoạch code, nối truy vết từ yêu cầu tới test"; muốn xoá demo: `rm -rf veriline-demo` — **xoá là mất cả màn S04 vừa đặc tả**; giữ lại để xem tiếp cũng không ảnh hưởng dự án (đã nằm trong `.gitignore`).

### 3. Vào dự án thật
1. **Hồ sơ dự án — không hỏi, mặc định `lite`** (chạy thử 08/10: hỏi `lite`/`mini`/`full` trước khi có dự án là hỏi điều người mới chưa hiểu). Ghi `node .claude/skills/ba-start/scripts/ledger.js set hồSơ=lite` và nói một câu: "mặc định mức `lite` — đủ tài liệu cho mỗi màn, bỏ bớt sổ sách quản lý; dự án nhỏ 5–10 màn muốn gọn hơn (`mini`) hay cần đủ sổ sách (`full`) thì nói, hoặc đổi khi bước tạo danh sách màn hỏi xác nhận". Người dùng tự nêu mức khác → ghi mức đó. Bảng đầy đủ: `conv-gates.md` → "Hồ sơ dự án".
2. **Cửa vào theo loại** (lấy `đềXuất` của detect.js):
   - `ý-tưởng` → **`ba-init`** (từ ý tưởng tới kế hoạch build, dừng hỏi ở mỗi chặng). Ý tưởng còn mơ hồ, muốn chốt bằng bản bấm thử trước → nhắc `ba-proto-first`.
   - `tài-liệu-rời` → **`ba-reverse-doc`** với các file detect.js đã thấy (Word nên xuất PDF trước).
   - `có-code` → một dòng trước: "dự án đã có code — khi tới bước lập kế hoạch code cần bộ dev: `ba-export update --dev`". Rồi `đềXuất` của script: có `ba-reverse` (gói Pro) thì đề xuất nó; không có → **`ba-init`**, Claude đọc code sẵn làm ngữ cảnh tham khảo, kèm một dòng "gói Pro có skill viết tài liệu ngược thẳng từ code".
   - `code-và-tài-liệu` → hỏi một câu: nguồn chính là **tài liệu khách gửi** (→ `ba-reverse-doc`) hay **code đang chạy** (→ như `có-code`).
3. Người dùng chọn → **invoke skill đó luôn** (Skill tool). Không chọn → dừng, để lại lệnh gợi ý.

## Đo "≤ 15 phút"
`.claude/ba-start.json` (`ledger.js`): `batĐầu` · `demoPortalAt` (demo.js) · `firstPortalAt` (ba-portal/build.js đóng khi dựng portal cho `docs/` thật lần đầu) · `loại` · `hồSơ`. `ba-export/scripts/report.js` tính số phút từ lúc cài → mục `vàoCửa`. Mốc ghi một lần, không ghi đè.

## Lưu ý
- **Hồ sơ dự án** (`lite`/`mini`/`full`) chỉ được ghi vào sổ vào cửa ở đây; dòng khai chính thức vẫn nằm đầu `docs/00-tracking.md` do `ba-screens` viết. Đừng tự tạo `00-tracking.md` từ `ba-start`.
- Repo nguồn của bộ skill (`detect.js` báo `nguồnToolkit`) → demo vẫn chạy được; đừng đề xuất `ba-init` trên chính repo nguồn.
- Bộ demo (`assets/demo/`) cắt tự động từ `example/docs` bằng `scripts/build-demo.js --write`; `--check` nằm trong bộ kiểm — sửa `example/` thì cắt lại.
- Tiếng Việt.
- Xong bước này → chạy `ba-next` (khi dự án thật đã có `docs/`; demo thì không).

## Ranh giới
- `ba-next` đọc `docs/` đã có để chỉ bước kế; `ba-start` dùng **trước khi có `docs/`** — nhìn dự án (code, tài liệu rời), cho xem demo, chọn cửa vào. Dự án đã có tài liệu → ba-start chuyển ngay sang `ba-next`.
- `ba-toolkit` là bản đồ cả bộ skill cho người muốn hiểu pipeline; `ba-start` dẫn người mới đi một đường, không giảng pipeline.
- `ba-init`/`ba-reverse-doc`/`ba-discover` là cửa vào thật; `ba-start` chỉ chọn và gọi chúng.
