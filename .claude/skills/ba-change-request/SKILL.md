---
name: ba-change-request
description: Use when có yêu cầu thay đổi (CR) cho chức năng/màn ĐÃ CHỐT — cấp mã CR vào docs/00-cr.md, phân tích ảnh hưởng theo truy vết, đồng bộ tài liệu, đóng CR. Cũng `ba-change-request list|status`.
---

# ba-change-request — Quản lý & thực thi change request

## Mục tiêu
Quản lý **trọn vòng đời** một thay đổi vào chức năng/màn đã có: **cấp mã → phân tích ảnh hưởng → duyệt → áp dụng (đồng bộ docs + code) → đóng với trace commit**. Mọi CR đều nằm trong sổ trung tâm `docs/00-cr.md` — nguồn sự thật về lịch sử thay đổi và quyết định của dự án; truy vết không gãy.

## Cách gọi
- `ba-change-request <màn/phạm vi> — <mô tả thay đổi>` — mở một CR mới rồi chạy quy trình dưới.
- `ba-change-request list` — đọc sổ, báo các CR gom theo trạng thái (còn mở vs đã đóng).
- `ba-change-request status <mã>` — xem hoặc **chuyển trạng thái** một CR (vd Đề xuất→Đã duyệt, hoặc Từ chối/Hoãn kèm lý do). Không đụng docs/code khi chỉ đổi trạng thái quyết định.

## Đọc sổ bằng script — KHÔNG Read cả file (tiết kiệm token)
Sổ CR phình theo thời gian; **đừng Read nguyên `00-cr.md`** cho thao tác cơ giới. Dùng `ledger.js` (zero-dep) trả lát compact:
```bash
node .claude/skills/ba-toolkit/scripts/ledger.js docs/00-cr.md summary   # đếm + danh sách CR đang mở (cho `list`)
node .claude/skills/ba-toolkit/scripts/ledger.js docs/00-cr.md next       # mã CR kế tiếp (cho bước 0, khỏi đọc cả sổ)
node .claude/skills/ba-toolkit/scripts/ledger.js docs/00-cr.md get CR-07  # chỉ block chi tiết CR-07 (cho `status`/tra cứu)
node .claude/skills/ba-toolkit/scripts/ledger.js docs/00-cr.md ids        # [{id,status,open}] — cross-check marker
```
Chỉ Read/Edit trực tiếp file khi **thêm hoặc sửa** một mục (append dòng bảng + block, hoặc đổi ô trạng thái) — và khi đó chỉ chạm đúng vùng liên quan, không cần nạp toàn bộ.

## Sổ CR — `docs/00-cr.md` (nguồn sự thật)
Quy ước mã, cột và vòng đời ở mục **"Change Request (CR)"** trong `conventions.md`. Tóm tắt:
- Mã **toàn cục `CR-01`, `CR-02`…** (một bộ đếm cho cả dự án — một CR có thể chạm nhiều màn hoặc chạm thẳng yêu cầu gốc, nên không đếm theo màn).
- Một dòng bảng tổng = một CR; kèm một mục chi tiết `### CR-NN — …` bên dưới.
- Trạng thái cập nhật **tại chỗ, KHÔNG xoá dòng** — CR Từ chối/Hoãn/Đóng đều giữ lại (sổ là lịch sử quyết định).
- Marker trong tài liệu dùng đúng mã này, vd `*(CR-07)*` cạnh yêu cầu/ô bảng bị đổi.

## Vòng đời CR (bắt buộc theo dõi)
`Đề xuất → Đang phân tích → Đã duyệt → Đang triển khai → Đã triển khai → Đóng`
với hai nhánh rẽ ở khâu quyết định: **Từ chối** (không làm) và **Hoãn** (để sau, ghi điều kiện mở lại). Mỗi lần đổi trạng thái ghi ngày + người quyết + lý do vào mục chi tiết của CR.

## Quy trình (mở + phân tích + áp một CR)
Đọc `conventions.md` + `conv-gates.md`. Làm rõ với người dùng: đổi cái gì, ở màn/chức năng nào — **chốt phạm vi trước khi cấp mã** (AskUserQuestion nếu mơ hồ, theo "Xác nhận giả định").

> **Cổng phương án ở skill này nằm ở bước 2 (Cổng duyệt)** — xem `conv-gates.md` → "Cổng phương án". Bước 1 chỉ ĐỌC và phân tích ảnh hưởng (được phép chạy ngay, chưa đụng tài liệu nghiệp vụ); bảng ảnh hưởng ở bước 2 chính là phần "Sẽ làm" của phương án, và phải đủ 6 phần trước khi hỏi Duyệt/Từ chối/Hoãn. **Không có nhánh bỏ chờ ở đây**: CR luôn đổi thứ đã chốt (baseline).

0. **Mở CR (Đề xuất):** lấy mã kế tiếp bằng `ledger.js … next` (chưa có sổ → tạo theo template trong conventions) → cấp `CR-<NN>` → **append** dòng bảng tổng + mục chi tiết với: ngày, người yêu cầu, tóm tắt, phạm vi dự kiến. Trạng thái = **Đề xuất**. *(Không Read cả sổ — xem "Đọc sổ bằng script".)*
   - **Ghi NGUỒN của CR** (bắt buộc, để truy vết ngược): người dùng nêu trực tiếp · UAT Fail (`UAT-..` ở `09-uat.md`, do `ba-accept` chuyển sang) · **biên bản họp** (`ba-meet`: ghi `họp <ngày> · DEC-.. / ACT-..` + link `docs/Ho-so/meetings/<file>.md`) · đo lường sau phát hành lệch mục tiêu. CR mở từ MoM → quay lại biên bản ghi chéo `→ CR-NN` cạnh `DEC`/`ACT` đó, để hai chiều khớp nhau.

1. **Phân tích ảnh hưởng (Đang phân tích).** Trước khi lần theo chuỗi bằng mắt, **chạy diff ngữ nghĩa** để biết CHÍNH XÁC ID nào đã bị chạm và ở trường nào — `git diff` chỉ nói "dòng 62 đổi", nó không nói "`BRule-S01-06` đổi *điều kiện kích hoạt*":
   ```bash
   node .claude/skills/ba-toolkit/scripts/semdiff.js docs --base <rev trước khi sửa> --plain
   ```
   Đầu ra là điểm KHỞI ĐẦU của phân tích, không phải kết luận: nó chỉ thấy bảng markdown có ô đầu là ID canon, và **không suy ra tác động** — hai ID cùng đổi không có nghĩa chúng liên quan. Script tự in mục "Không thấy được"; đọc mục đó trước khi kết luận. Có cảnh báo **bảng bị cắt đôi** thì sửa file rồi chạy lại, đừng tin con số.
   *(Vì sao bắt buộc: ngày 31/08/2026 một CR trong repo mẫu đã sửa **2 trong 5** tài liệu cùng nói về một vấn đề, biến mâu thuẫn hai chiều thành ba chiều — và còn sửa theo phe thiểu số. Lần theo chuỗi bằng mắt trượt đúng kiểu đó.)*
   Rồi mới lần theo **chuỗi truy vết chuẩn**: lần theo **chuỗi truy vết chuẩn** `BR → StR → FR/NFR → F → S → R-S → UC/US → TC` — liệt kê mọi ID bị chạm ở từng cấp (không chỉ màn/CN): yêu cầu gốc nào đổi, chức năng `F..` nào, màn `S..` nào, `R-S..`/`UC..`/`TC..` nào. Ghi **ước lượng** (docs cần sửa + độ lớn code) và **rủi ro**. Kèm một dòng **Không đổi:** — các ID người đọc *tưởng* sẽ đổi mà không đổi (cùng màn, cùng thực thể, tên na ná), mỗi cái một lý do ngắn; để không ai lần tìm, và để người duyệt thấy ranh giới đã được xét chứ không phải bị quên. Điền hết vào mục chi tiết CR → trạng thái **Đang phân tích**.

2. **Cổng duyệt:** trình người dùng bảng ảnh hưởng + ước lượng, hỏi quyết định (AskUserQuestion): **Duyệt / Từ chối / Hoãn**.
   - **Từ chối** → ghi lý do, trạng thái **Từ chối**, dừng (không đụng docs/code).
   - **Hoãn** → ghi điều kiện mở lại, trạng thái **Hoãn**, dừng.
   - **Duyệt** → trạng thái **Đã duyệt**, đi tiếp bước 3.

3. **Bắt đầu áp (Đang triển khai).** Sửa nguồn: cập nhật yêu cầu trong `01-requirements.md` / `02-functions.md` nếu CR đổi phạm vi (gắn marker `*(CR-NN)*` cạnh mục đổi).
   - **Nếu đổi phạm vi yêu cầu/chức năng:** invoke `ba-review functions` → bắt gap truy vết chức năng↔màn trước khi đi tiếp.
4. Invoke `ba-track sync <màn>` → đánh ⚠️ các tài liệu lệch (srs, usecase, test, html, plan) cho **mọi màn** trong phạm vi ảnh hưởng.
5. **Gate:** invoke `ba-review <màn>` (xem "Quy ước gate" trong conventions) → liệt kê chính xác gap/lệch theo mức 🔴/🟡/🟢.
6. Cập nhật từng tài liệu ⚠️:
   - đổi nghiệp vụ/yêu cầu → invoke `ba-screen-spec <màn>`.
   - đổi ca kiểm thử → invoke `ba-test <màn>` (TC bị sửa nội dung → reset Trạng thái=`Chưa chạy`, Kết quả=`—` theo luật).
   - đổi giao diện → *(tùy chọn)* invoke `ba-figma-draw` để preview, rồi invoke `ba-html-design <màn>`.
7. **Gate:** invoke `ba-review <màn>` lần nữa → còn 🔴/🟡 (gap/lệch) → quay lại bước 6; chỉ 🟢/sạch → tiếp (ghi nhận 🟢 để xử lý sau).
8. Invoke `ba-build` → cập nhật `plan.md` của các màn ảnh hưởng.
9. Code phần đổi (dev-run hoặc theo plan; nhánh `feat/`/`fix/` theo quy ước git của repo).
10. Invoke `ba-track refresh`.
11. **Gate chốt (nhất quán chéo doc):** invoke `ba-review all`. Ngoài soát sổ CR (marker `CR-NN` có dòng, CR đóng không còn ⚠️), gate này chạy **`ba-consistency-reviewer` project-mode** — bắt **residue chéo doc** do CR gây: đổi ưu tiên/tách chức năng làm lệch `00-vision`/`08-roadmap`/`NFR`, "chức năng bị chẻ" chưa dọn ở FR/StR cha, rule/định lượng chọi nhau. *(CR là nguồn residue lớn nhất vì sửa mô hình đã có — luôn soát project-mode ở đây.)* Còn 🔴/🟡 → sửa nguồn (quay bước 3/6) rồi chạy lại; chỉ 🟢/sạch → tiếp.
12. **Đã triển khai:** khi docs đồng bộ + code xong, cập nhật CR → **Đã triển khai**, điền Phạm vi thực tế (danh sách docs + file code chính đã đổi) và Commit/nhánh.
13. **Đóng CR:** sau nghiệm thu (test xanh, người dùng chấp nhận) → trạng thái **Đóng** + ngày đóng. CR dừng giữa chừng → giữ **Đang triển khai** kèm ghi chú việc còn lại.
14. *(Tùy chọn)* nếu dự án có `docs/Ho-so/portal.html`, invoke `ba-portal` để cổng đọc phản ánh thay đổi.
15. Báo người dùng: mã CR + trạng thái + bảng ảnh hưởng đã đồng bộ.

## Ranh giới
- Có gate kiểm tra sạch trước khi đóng CR. Việc mới / kỹ thuật không đụng baseline thì dùng `ba-task`.

## Lưu ý
- Trọng tâm là truy vết: sau CR, mọi srs↔usecase↔test↔html↔plan phải khớp VÀ sổ CR phản ánh đúng trạng thái + phạm vi thực tế.
- **Phân tích ảnh hưởng đi hết chuỗi**, không dừng ở màn: một CR đổi 1 `FR` có thể lan xuống nhiều `F`/`S`; liệt kê đủ để không sót màn cần đồng bộ.
- Gate chốt bước 11 (`ba-review all`) làm **hai việc**: (a) soát sổ CR — marker `CR-NN` có dòng, CR **Đóng/Đã triển khai** không còn tài liệu ⚠️ (thiếu → gap 🟢); (b) chạy `ba-consistency-reviewer` project-mode bắt residue chéo doc do CR (lệch ưu tiên/phạm vi/rule giữa vision↔requirements↔functions↔roadmap). Đừng bỏ gate này — CR sửa mô hình đã có nên dễ để lại mâu thuẫn mà kiểm truy vết cơ học không thấy.
- Một CR chạm nhiều màn → cột "Ảnh hưởng" liệt kê tất cả `S..`/`F..`; mã CR vẫn là một (toàn cục).
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
