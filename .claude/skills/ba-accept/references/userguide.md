# `ba-accept userguide` — Cẩm nang vận hành (BA docs → hướng dẫn sử dụng)

> Chi tiết của chế độ `userguide` (`SKILL.md` → "Chế độ `userguide`"). Trước là skill `ba-userguide`.

## Mục tiêu
Sinh **cẩm nang sử dụng cho người vận hành sản phẩm** (admin/CSKH/nội bộ/người dùng cuối) — tài liệu dạy CÁCH DÙNG phần mềm sau khi build. Đọc ngược toàn bộ tài liệu BA đã có trong `docs/` rồi dựng cẩm nang theo **xương sống Diátaxis** (6 trụ: Tổng quan · Bắt đầu nhanh · Hướng dẫn theo tác vụ · Tra cứu · Xử lý sự cố · FAQ/Thuật ngữ), qua **2 giai đoạn có chốt người ở giữa**. Nội dung **truy được về tài liệu nguồn — không bịa**.

> **Khác các skill gần kề:** `ba-portal` xuất *tài liệu BA* cho người đọc BA/dev; `ba-accept release` đóng gói *kế hoạch+nghiệm thu* cho stakeholder; **`ba-accept userguide` dạy CÁCH DÙNG** cho người vận hành — đối tượng đọc hoàn toàn khác, giọng khác, cấu trúc khác.

## Điều kiện
- **Cần:** `02-functions.md` + `00-tracking.md` + ≥1 màn trạng thái **✅/⚠️ (đã build tài liệu)** — cẩm nang chỉ viết cho màn đã có đặc tả; màn ⬜ bỏ qua (ghi chú, không OQ).
- **Nguồn đọc (map v3):**

| Trụ Diátaxis | Nguồn v3 |
|---|---|
| Tổng quan / Khái niệm | `00-vision.md`, `01-requirements.md` (BR/StR), `03-overview.md` |
| Bắt đầu nhanh (1 đường duy nhất) | `03-overview.md` (điều hướng) + `usecase.md` luồng chính của màn vào cửa |
| Hướng dẫn theo tác vụ (how-to) | mỗi `UC-S..` trong `<màn>/usecase.md` ≈ 1 trang; bổ sung từ `srs.md` (R-S, BRule) |
| Tra cứu (bảng khô) | `srs.md` (giới hạn/quy tắc BRule), `01-requirements.md` NFR liên quan người dùng |
| Xử lý sự cố | **Ma trận lỗi `E-S..` trong `srs.md`** (nguồn chuẩn: thông báo nguyên văn + **lối thoát** + mức nghiêm trọng) + ngoại lệ `usecase.md` + TC Negative `test.md`. Mỗi `E-S..` mức `blocker`/`major` nên có một mục trong trang xử lý sự cố |
| FAQ + Thuật ngữ | `00-glossary.md` (có sẵn — lọc thuật ngữ người vận hành cần) |
| Ảnh minh họa | **App THẬT** (URL + đăng nhập — nguồn chuẩn; html-design có thể outdate so với UI thực tế). Chưa có app deploy → `html-design.html`/`ascii-screen.md` làm mockup TẠM, đánh dấu thay sau |

## Quy trình

### Giai đoạn 1 — Dựng mục lục (KHÔNG ghi file nội dung)
1. Đọc `conventions.md` + `conv-gates.md`; đọc `00-tracking.md` lấy danh sách màn ✅/⚠️ + mã CN; quét nguồn theo bảng trên. In **bảng inventory** (màn · nguồn có · nguồn thiếu) ra chat.
2. **Hỏi phạm vi (AskUserQuestion):** (a) đối tượng đọc (admin / CSKH / người dùng cuối — đề xuất theo vai trò trong `01-requirements.md`); (b) phủ luồng nào (liệt kê UC dò được, người dùng thêm/bớt); (c) giọng ("bạn" thân thiện — mặc định); (d) độ chi tiết (Vừa đủ — khuyến nghị). KHÔNG hỏi lại điều đã trả lời.
3. **Cluster → mục lục** theo 6 trụ: mỗi trang gán tiêu đề + loại (nội bộ) + nguồn + 1 dòng mục đích. Luật: tiêu đề how-to **bắt đầu bằng động từ** ("Tạo công việc", KHÔNG "Màn hình công việc"); **không trộn loại trong 1 trang**; thứ tự theo hành trình người vận hành.
4. **Gate agent (BẮT BUỘC):** spawn **`ba-manual-reviewer`** (read-only) review mục lục — **prompt phải kèm**: (a) **bản mục lục vừa dựng** (dán nguyên văn, agent không thấy nó từ phiên này), (b) **đường dẫn nguồn thật** của mỗi trang định viết (`srs.md`/`usecase.md`/`test.md` màn nào), (c) **khuôn findings** `mức · mô tả · trang liên quan · sửa thế nào`. Thiếu (a) thì agent review một mục lục nó tự tưởng tượng — đủ trụ, task-based, không trộn loại, trang tự đứng vững, nguồn rỗng → OQ. Nhận findings → chỉnh mục lục; loop ≤2 vòng nếu còn BLOCKING. Người dùng vẫn là người chốt cuối.
5. **HARD STOP — đây chính là Cổng phương án của skill này** (`conv-gates.md` → "Cổng phương án"; skill này là bản mẫu của cổng đó cho cả toolkit). In mục lục (bảng gọn 1 dòng/trang, cột Ghi chú gộp nguồn + đã-chỉnh-theo-review) + **6 phần của phương án** (Đã đọc · Hiểu · Sẽ làm = chính bảng mục lục · Giả định · Câu hỏi chặn · **Ngoài phạm vi** = màn ⬜ không có trang, việc không đụng) + dòng **`Ước tính: …`** từ `cost.js estimate ba-accept` (báo giá, `conv-gates.md` → "Cổng phương án") → **DỪNG**. Chỉ sang GĐ2 khi người dùng xác nhận (`tiếp`/`ok`). KHÔNG "tiện tay" viết trước. **Không có nhánh bỏ chờ** — cẩm nang luôn nhiều trang, luôn trên ngưỡng. Đây là **ngoại lệ CỐ Ý** của luật "Cổng cha bao phủ cổng con": gọi từ chuỗi nghiệm thu trọn `ba-accept` (đã qua cổng) vẫn phải HARD STOP, vì thứ cần duyệt ở đây là **mục lục** — cha không thể duyệt thay cái mà cha chưa nhìn thấy.

### Giai đoạn 2 — Viết chi tiết (sau xác nhận)
6. **Ghi state trước tiên:** `docs/Ho-so/userguide/<bundle>/index.md` với mục lục đã duyệt, mọi trang `status: pending` — chống mất mục lục nếu đứt phiên; phiên sau thấy index còn `pending` → đọc lại và viết tiếp, KHÔNG chạy lại GĐ1, KHÔNG hỏi lại.
   - Phạm vi toàn sản phẩm → bundle `userguide/` + cửa vào `userguide.html`; theo nhóm màn → `<slug>-userguide/` + `<slug>-userguide.html`. Cửa vào là file DUY NHẤT lộ ở `docs/Ho-so/userguide/`.
7. **Viết từng trang** vào `<bundle>/pages/<slug>.md` — slug kebab không dấu, **KHÔNG tiền tố số `NN-`** (đụng hệ đánh số canon `01-11` → lint báo lệch; thứ tự trang do index/data.js quyết, không cần số) — theo `assets/userguide-section.md` (khung A How-to · B Tra cứu · C Xử lý sự cố · D Tổng quan · E FAQ · F Thuật ngữ):
   - Điền tối đa từ nguồn: UC → các bước (mỗi bước 1 hành động + "*Kết quả:*"); TC Negative → bảng sự cố (triệu chứng · nguyên nhân · cách xử lý — wording lỗi lấy từ expected của TC, KHÔNG tự chế); BRule/giới hạn → bảng tra cứu; `00-glossary.md` → thuật ngữ.
   - **Every Page Is Page One:** mỗi trang tự đứng vững — 1-2 câu context đầu trang + liên kết chéo `[Trang X](./x.md)`, không giả định đã đọc trang trước.
   - Nguồn thiếu wording/số liệu → `<!-- TBD OQ-n -->`, KHÔNG bịa. Xong mỗi trang → cập nhật `status: written` trong index.
8. **Ảnh minh họa — nguồn chuẩn là APP THẬT** (html-design là mockup, có thể outdate so với UI đã dev). Hỏi chọn 1 trong 3 (AskUserQuestion):
   - **(A) Engine tự chụp APP THẬT** (khuyến nghị khi app đã deploy + người dùng cấp URL/đăng nhập): Playwright vào app (login steps) → chụp từng màn + vẽ callout số/mũi tên khớp bảng thao tác + **che PII** (hỏi selector cần mask). Kiểm trước: `node .claude/skills/ba-accept/scripts/engine/check-playwright.mjs`; thiếu → **hỏi** rồi mới `npm install`/`npx playwright install chromium` (engine là phần DUY NHẤT của toolkit cần npm — tùy chọn). Hỏi thêm phạm vi chụp (đúng luồng / kèm màn dự phòng).
   - **(B) Người dùng tự chụp app thật** (không muốn cấp quyền cho engine): giữ placeholder `![...](images/<slug>.png)` + brief HTML-comment (chụp màn nào, bước nào, đánh dấu vùng (1)(2)(3)) — bảng callout viết sẵn, chỉ việc thả file đúng tên. Báo cáo cuối liệt kê đủ danh sách ảnh chờ thả.
   - **(C) Mockup tạm — CHỈ khi app chưa deploy:** chụp `html-design.html` local hoặc nhúng `ascii-screen.md`. **BẮT BUỘC đánh dấu**: caption ảnh ghi `(mockup — thay bằng ảnh app thật khi phát hành)` + index giữ mục "Ảnh mockup cần thay" để lần update sau đổi sang (A)/(B). KHÔNG giao cẩm nang bản chính thức với ảnh mockup mà không ghi chú.
   - Nhánh (A)/(C-chụp): dựng `job.json` theo header `scripts/engine/capture.mjs` (slug/url+login hoặc html/callouts/mask) → chạy → đọc report JSON + tự soi 1-2 PNG kiểm callout đúng chỗ. Lỗi → rơi về (B).
9. **Render cửa vào:** sinh `<bundle>/data.js` (`window.GUIDE = {…, sections:[{slug,title,group,file,md}]}` — **KHÔNG kèm field `diataxis`**: template sẽ in nó ra sidebar → lộ thuật ngữ nội bộ; loại trang chỉ sống trong `index.md`. Nội dung trang strip comment TBD, path ảnh rewrite `](images/` → `](<bundle>/images/`) + copy `assets/userguide-preview.html` → `docs/Ho-so/userguide/<cửa vào>.html`, sửa `<script src>` trỏ data.js. HTML **tự chứa, light-only** (docs-style), không CDN. Liên kết chéo giữa trang là chuyển section nội bộ, không mở file.
10. **Gom OQ + báo cáo:** grep `TBD OQ-` các trang → chạy vòng **"Xác nhận giả định"** (`conventions.md`): hỏi từng OQ (Trả lời/Bỏ qua) → điền vào trang (bỏ marker) hoặc giữ trong index mục "Open Questions". Nếu câu trả lời **mâu thuẫn tài liệu nguồn** → KHÔNG sửa ngược nguồn, ghi nhận + gợi `ba-change-request`. Báo cáo cuối: số trang theo loại · ảnh (đã chụp/chờ thả) · OQ còn treo · đường dẫn file mở. Muốn chia sẻ online → `ba-doc-public` (slug `userguide`).

## Kỹ thuật áp dụng
- **Diátaxis (Procida):** 4 loại tài liệu (Tutorial/How-to/Reference/Explanation) + 2 mục đặc thù manual (Troubleshooting, FAQ/Glossary) — mỗi trang đúng 1 loại; thuật ngữ "Diátaxis" chỉ là metadata nội bộ, KHÔNG lộ trong output.
- **Every Page Is Page One (Mark Baker):** người đọc đáp xuống từ tìm kiếm/link — mỗi trang tự đứng vững.
- **Task-based writing:** tiêu đề = việc cần làm xong, điều kiện đặt TRƯỚC hành động ("Để xuất file, chọn…"), ngôi "bạn", thì hiện tại, chủ động.
- **Report-first + HARD STOP:** duyệt cấu trúc trước khi tốn công viết — cùng triết lý cổng chốt kiến trúc của `ba-architecture`.

## Tiêu chí chất lượng (BẮT BUỘC)
- **Mỗi trang truy được về nguồn** (màn/file BA) ghi trong index; trang nguồn rỗng = OQ, không phải trang bịa.
- **Wording lỗi/giới hạn/số liệu lấy từ nguồn thật** (test.md expected, BRule, NFR) — tự chế = lỗi nặng.
- **How-to tiêu đề động từ · Tutorial 1 đường duy nhất · Reference bảng khô** — trộn loại = gap.
- **Màn ⬜ không có trang** (đúng kế hoạch, ghi chú); màn ✅ có UC mà không có trang how-to → thiếu phủ.
- **Ảnh = app thật.** Ảnh mockup (html-design/ascii) chỉ được xuất hiện khi app chưa deploy, PHẢI ghi chú `(mockup)` trong caption + nằm trong danh sách "Ảnh mockup cần thay" của index — cẩm nang bản chính thức không ghi chú mockup = lỗi.
- Cửa vào HTML mở offline được, ảnh/callout khớp bảng thao tác.

## Ranh giới
- Nguồn đọc ngược: requirements/srs/usecase/test/glossary. Ảnh chụp qua engine Playwright (đăng nhập + chụp + che PII); output là HTML tự chứa, double-click mở.

## Lưu ý
- **URL app + tài khoản demo cho nhánh (A):** tìm trước trong `dev-notes.md` (dev-run ghi) và `10-architecture.md` Mục Triển khai (môi trường staging/prod) — có thì đề xuất, chỉ hỏi khi thiếu. Dùng tài khoản demo/test, KHÔNG dùng tài khoản thật của người dùng; dữ liệu thật lộ trên ảnh → mask.
- **FORWARD từ tài liệu đã chốt** — cẩm nang phản ánh đặc tả, KHÔNG sửa nghiệp vụ; phát hiện lệch → OQ + gợi `ba-change-request`, không tự đổi.
- `docs/Ho-so/userguide/` **không vào portal** (như `releases/`) — nó có cửa vào HTML riêng cho đối tượng đọc riêng. `ba-portal` bỏ qua folder này sẵn.
- Chạy lại khi tài liệu nguồn đổi → update mode: đọc index cũ, đối chiếu trang thêm/bớt, hiện diff từng trang trước khi ghi đè.
- Vị trí trong vòng đời: bước tùy chọn của **GĐ4** — chuỗi nghiệm thu trọn `ba-accept` gọi ở bước 7b sau khi UAT pass (người dùng chọn có/không); chạy lẻ bất cứ lúc nào đủ điều kiện.
- Tiếng Việt (hoặc ngôn ngữ người dùng chọn ở bước 2); "Mục N" không dùng `§`; `→` chỉ trong bảng/flow.
- Cẩm nang đã duyệt, muốn **clip hướng dẫn có giọng đọc** → `ba-userguide-video` (quay app thật theo từng bước how-to).
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
