---
name: ba-screen-spec
description: Use when cần đặc tả chi tiết MỘT màn — ascii-screen, brainstorm, srs, usecase, userstory, design-spec; bước 4, sau ba-screens. Nhiều màn cùng lúc thì dùng ba-batch.
---

# ba-screen-spec — Đặc tả 1 màn hình

## Mục tiêu
Cho một màn hình (folder `docs/Screen-spec/<Nhóm>/<Màn>/`), sinh 6 file: `ascii-screen.md`, `brainstorm.md`, `srs.md`, `usecase.md`, `userstory.md`, `design-spec.md` — **hồ sơ `mini` chỉ sinh 2 file**, xem ngay dưới.

> ⚙️ **Hồ sơ `mini` → sinh 2 file, không phải 6** (`conv-gates.md` → "Hồ sơ dự án"). Đọc dòng `> Hồ sơ dự án:` ở đầu `docs/00-tracking.md` **trước bước 1**; khai `mini` thì:
> - **Sinh:** `ascii-screen.md` + `srs.md`. Không sinh `brainstorm.md`, `usecase.md`, `userstory.md`, `design-spec.md`.
> - **`srs.md` phải nuốt trọn phần nội dung của ba file bị bỏ** — không được mất, chỉ đổi chỗ: mục **"Luồng"** (chính + **ngoại lệ**, thay `usecase.md`) · mục **"Tiêu chí chấp nhận"** dạng Given-When-Then (thay `userstory.md`, đây là thứ `ba-test`/`ba-uat` sẽ đọc) · mục **"Giao diện"** gồm UI state · CTA · microcopy · **Animation chuyển cảnh** (thay `design-spec.md`, đây là thứ `ba-html-design` sẽ đọc). Mã `R-S..`, `BRule-S..`, `E-S..` và **ma trận lỗi giữ nguyên bắt buộc** — `mini` cắt tầng diễn giải, không cắt truy vết.
> - **Cột tracking:** đánh ✅ cho `ascii`/`srs`; 4 cột kia không tồn tại ở hồ sơ này.
> - **Nói ra trong báo cáo:** `⚙️ mini: 2/2 file (ascii-screen · srs) — usecase/userstory/design-spec dồn vào srs`.

> 🅰️ **Chế độ `--ascii` (luồng prototype-trước).** Gọi `ba-screen-spec --ascii <màn>` → **CHỈ sinh `ascii-screen.md`**, bỏ 5 file còn lại (hồ sơ `mini`: bỏ 1 file — `srs` sinh ở bước 7) và bỏ cả cổng phương án (1 file = dưới ngưỡng). Dùng ở bước 3 của `ba-proto-first`: lúc đó nghiệp vụ **chưa chốt**, viết srs/usecase/userstory/design-spec ra là bịa — và bịa xong thì khách gật đầu vào bản prototype dựng trên đặc tả bịa đó. Đánh ✅ đúng ô `ascii` trong tracking, các ô khác giữ ⬜. Đặc tả đầy đủ chạy lại ở bước 7 **sau khi** có sổ `PD`.

> 🩹 **Chế độ `--bo-sung <loại> <màn>` (nâng tài liệu cũ — `thieu.js`/`ba-next` chỉ tới đây).** `<loại>` = `bang-phan-tu` (bảng phần tử srs, từ `data-el` html-design › wireframe chọn › thẻ tương tác) · `ma-tran-loi` (ma trận E srs, từ statebar lỗi + cột thông báo srs + chuỗi trong code) · `cach-chay` (cột `Cách chạy` test.md, từ test mang mã TC). **Không sinh 6 file**, chỉ vá đúng mục thiếu:
> 1. `node .claude/skills/ba-screen-spec/scripts/bo-sung.js "<folder màn>" <loại> [--root <gốc code>]` → nháp markdown (không ghi gì). Exit 1 = không có nguồn để dựng → báo người dùng, đừng bịa bảng.
> 2. **Soát nháp:** đối chiếu `ascii-screen`/`usecase`/design-spec, sửa Control type/tên sai, **thêm chỗ máy không thấy** (lỗi hệ ngoài/hết quyền, TC Manual mà thật ra có test không mang mã). Mô tả/Trace/Mức/Lối thoát chưa có nguồn → **giữ 🔶**, không tự điền cho đủ ô.
> 3. **DỪNG** — trình nháp đã soát, chờ duyệt. Vá nhiều loại/nhiều màn một lượt (>2 file) → trình đủ **Cổng phương án**.
> 4. Duyệt → chạy lại với `--write` (chỉ chèn khi mục chưa có; đã có → exit 2, sửa tay; tài liệu đã chốt → `ba-change-request`), chép phần soát vào file, rồi cập nhật cột **"Cập nhật cuối"** của màn trong `docs/00-tracking.md`. Chạy lại checker bị tắt (`check-el`, `check-tc-layer`…) để thấy nó từ "Chưa kiểm" thành có số.

## Quy trình
1. Đọc `conventions.md` + `conv-gates.md` của `ba-toolkit`, `docs/01-requirements.md`, `docs/02-functions.md`, `docs/03-overview.md` để lấy ngữ cảnh và chức năng (`F..`) gắn với màn này.
1b. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Sinh **6 file một lượt** cho một màn → luôn trên ngưỡng. Đọc xong ngữ cảnh ở bước 1, **trước khi ghi file nào**: trình phương án đủ 6 phần — hiểu màn này làm gì cho ai, `F..`/`FR..` nào nó phục vụ, **các luồng chính + ngoại lệ định đặc tả** (đây là phần đáng duyệt nhất: sai ở đây thì cả 6 file lệch theo), 6 file sẽ TẠO vs **màn đã có tài liệu → file nào bị GHI ĐÈ**, giả định đang dùng, câu hỏi chặn, dòng **`Ước tính: …`** từ `cost.js estimate ba-screen-spec` (báo giá). `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Được gọi từ orchestrator đã qua cổng (`ba-init`/`ba-batch`/`ba-add-screen`) → **không hỏi lại**, cổng của orchestrator đã bao phủ.
2. Sinh 6 file theo các mục trong `templates.md` (cùng thư mục), theo thứ tự: brainstorm → ascii-screen → srs → usecase → userstory → design-spec (mỗi file dựa trên file trước; design-spec đúc kết thành UI brief cho Designer).
3. Cập nhật `docs/00-tracking.md`: 6 ô ascii/brainstorm/srs/usecase/userstory/design-spec = ✅ (hồ sơ `mini`: chỉ 2 ô `ascii`/`srs` — bốn cột kia không tồn tại), cập nhật cột "Cập nhật cuối".
   - Thêm footer `## Thuật ngữ` vào cuối `srs.md` (thuật ngữ dùng trong màn) + bổ sung thuật ngữ nghiệp vụ mới của màn vào `docs/Ho-so/00-glossary.md` — xem "Thuật ngữ" trong `conventions.md`.
   - **NGOẠI LỆ khi chạy trong `ba-batch` (subagent song song):** BỎ QUA cả hai việc trên — `00-tracking.md` và `00-glossary.md` là file dùng chung, nhiều subagent ghi cùng lúc sẽ đè nhau. Thay vào đó **trả về cho main**: các ô tracking cần đánh ✅ + danh sách thuật ngữ mới. Main gom bằng `refresh.js` + merge glossary một lượt. Footer `## Thuật ngữ` trong `srs.md` **vẫn phải viết** (file riêng của màn, không tranh chấp).
4. Chạy **1 màn hình mỗi lần**. Nhiều màn: REQUIRED SUB-SKILL: Use dev-dispatching-parallel-agents.

## Kỹ thuật áp dụng
- **Use Case Narrative + Flow Modeling:** mỗi luồng mô tả đủ Tác nhân/Trigger/Tiền điều kiện/Luồng chính/Luồng thay thế-ngoại lệ/Hậu điều kiện; chọn loại sơ đồ Mermaid theo bản chất (Use case/Activity/Sequence/State/Swimlane) — bảng chọn trong `templates.md` (và "Bộ chọn sơ đồ Mermaid" của `conventions.md`). Sơ đồ node (swimlane/flowchart/state) **tô màu theo vai** (`:::role` + `classDef`, xem "Bảng màu phân vai node").
- **Đối chiếu coverage sơ đồ:** sau khi vẽ, đối chiếu fact-list (đủ tác nhân, mỗi luồng thay thế/ngoại lệ có nhánh, không dead-end — xem "Kiểm coverage sơ đồ" trong `conventions.md`). Sơ đồ luồng phức tạp (≥3 lane / ≥5 quyết định / có loop) → `ba-review diagram <srs.md của màn>` (agent `ba-diagram-reviewer`).
- **User Story + Given-When-Then + INVEST:** tiêu chí chấp nhận viết GWT đo được; story đạt checklist INVEST.
- **Field-level Validation Spec:** mỗi input có bảng rule cụ thể (kiểu, bắt buộc, định dạng/regex, min/max, thông báo lỗi) — không để "validate hợp lệ" chung chung.
- **Error Matrix (`E-S..`):** gom **mọi cách màn hỏng**, không chỉ lỗi nhập liệu — hết hạn/đã dùng, thiếu quyền, hệ ngoài chết, mất mạng, vượt hạn mức, xung đột dữ liệu. Mỗi dòng có *điều kiện kích hoạt · mức (blocker/major/minor) · trace · thông báo **nguyên văn** · **lối thoát***. Đây là nguồn trực tiếp của `TC` Negative (`ba-test`) và mục "Xử lý sự cố" (`ba-userguide`) — thiếu nó thì hai bước sau phải tự đoán rồi bịa wording.
- **Business Rules tách bảng riêng** (`BRule-S..`) có cột **Kích hoạt khi**, trace về yêu cầu — không trộn vào mô tả chức năng. Rule không nêu trigger thì `ba-test` dễ kiểm sai thời điểm.
- **Nguồn yêu cầu tách khỏi Trace:** cột *Trace* = phục vụ `F`/`FR` nào; cột *Nguồn* = ai/đâu nói ra (brainstorm mục N, `DEC-..`, `CR-..`). Yêu cầu không có nguồn = tự nghĩ ra → hỏi lại, đừng ghi như đã chốt.
- **Trích ngược `UE-..` của URD:** dự án có URD (`docs/Ho-so/00-urd.md` hoặc `docs/urd/`) → đọc §6 Ngoại lệ; mỗi `UE-..` màn này xử lý được ghi ở cột *Trace* của dòng `E-S..` (hoặc *Nguồn* của `R-S..`) — URD giữ solution-free, không trỏ xuống màn. **Không** đặt `UE-..` trong bảng "Quét yêu cầu ngầm": ô quét trỏ mã của màn (`E-S..` đã trích `UE`), vì `ba-feasible` luật 9 chỉ nhận mã của màn (ô chỉ có `UE` bị coi là rỗng). Chiều quét cần hành vi mới → `OQ-S<NN>-..` (bảng mã: `conventions.md`).
- **Ranh giới màn + phụ thuộc ngoài:** mục "Phạm vi màn" ghi rõ **màn KHÔNG lo gì** (kèm nơi xử lý thay) để chống scope creep tại chỗ; mục "Phụ thuộc ngoài" ghi thứ do bên khác sở hữu + **chặn gì nếu chưa sẵn sàng** (không đặc tả cách tích hợp — việc của `ba-integration`/`ba-api-integration`).
- **Quét yêu cầu ngầm (9 chiều, tlc-plan):** viết xong các bảng R-S/BRule/E-S/GĐ thì đi đủ 9 dòng của mục "Quét yêu cầu ngầm" trong `templates.md` — mỗi chiều *rơi vào* mã đã viết · `n/a — lý do` · `OQ-S..`. Không bịa yêu cầu để lấp ô; một mã không phủ hai chiều trừ khi ghi `dùng chung — <vì sao>`. Hồ sơ `mini` vẫn giữ mục này (nó là truy vết, không phải diễn giải). `ba-feasible` luật 9 soát hình.
- **UI States completeness:** design-spec liệt kê đủ Empty/Loading/Error/Success.
- **Animation chuyển cảnh (BẮT BUỘC):** design-spec đặc tả chuyển màn (vào/ra) + chuyển section nội màn (in/out) mượt theo Motion token — điền mục 7 template, không để "nếu có". Quy ước ở "Animation chuyển cảnh" trong `conventions.md`.

## Tiêu chí chất lượng (BẮT BUỘC)
- **Mọi input field có rule cụ thể** (kiểu/bắt buộc/định dạng/min-max/thông báo lỗi); cấm "nhập hợp lệ" mơ hồ.
- **Bảng phần tử màn hình đầy đủ:** `srs.md` có mục **"Bảng mô tả chi tiết phần tử màn hình"** liệt kê **mọi** phần tử nhìn thấy/tương tác được (không chỉ ô nhập liệu — cả Table, Button, Tab), mỗi dòng có `Control type`/`Data Type` **lấy từ danh sách đóng trong `templates.md`** (tự chế loại mới = mỗi màn một kiểu, dev đọc không biết dựng gì) và **trace về ≥1 `R-S..`**. Bảng phải **khớp `ascii-screen.md`** hai chiều: vẽ trong wireframe mà không có dòng, hoặc có dòng mà không vẽ, đều là lệch.
- **Ma trận lỗi phủ hết luồng ngoại lệ:** mọi luồng thay thế/ngoại lệ trong `usecase.md` (hồ sơ `mini`: mục "Luồng" của `srs.md`) có ≥1 dòng `E-S..`; **mọi dòng `E-S..` có lối thoát** (không để người dùng kẹt); thông báo ghi **nguyên văn** để `test.md` và `html-design.html` dùng lại đúng chữ. Màn có hệ thống ngoài mà ma trận **không có dòng nào cho "hệ ngoài không phản hồi"** = thiếu.
- **Mục "Phạm vi màn" có phần KHÔNG lo** và mục "Phụ thuộc ngoài" không bỏ trống (không có thì ghi "Không có"); mỗi hệ thống ngoài ở bảng Tác nhân có dòng tương ứng ở Phụ thuộc ngoài.
- Mỗi yêu cầu `R-S..` có **acceptance criteria đo được**; usecase & userstory **khớp các luồng trong srs**.
- **Chuẩn 29148 (mới):** mỗi `R-S..` có cột **`Kiểm chứng`** (inspection/analysis/demonstration/test) và **`Lý do`** (rationale); srs có mục **"Giả định & Ràng buộc"** (`GĐ-S..`/`RB-S..`). Điều chưa xác nhận → `⚠️ chưa xác nhận`, KHÔNG bịa.
- **Thích ứng theo độ phức tạp** (định nghĩa "màn phức tạp" ở `conventions.md`): màn **phức tạp** → đủ 4 phần và sau khi viết `srs.md` chạy `ba-review <tên màn>` (nhánh leo thang spawn `ba-srs-quality-reviewer`); màn **đơn giản** → giữ cốt lõi (Kiểm chứng + tối thiểu Giả định), có thể bỏ cột `Lý do`, không spawn agent gate.
- Mỗi luồng trong srs có **1 sơ đồ Mermaid đúng loại**; design-spec đủ 4 UI state **và mục Animation chuyển cảnh** (chuyển màn vào/ra + ≥1 section in/out).
- **`usecase.md` có sơ đồ Use case tổng quan** ở đầu file — **hồ sơ `mini` bỏ yêu cầu này** (không có `usecase.md`; luồng mô tả bằng lời trong `srs.md`) — (`flowchart LR`: actor `((...))` ↔ mọi `UC-S..` node stadium, kèm `include`/`extend` nếu có, **tô màu**) — nhìn nhanh phạm vi màn; mọi UC trong sơ đồ phải có mục narrative bên dưới và ngược lại.

## Lưu ý
- srs: yêu cầu chức năng `R-S..` trace `F`/`FR`; phi chức năng `R-S..-N..` trace `NFR`/`BR`; mỗi yêu cầu có acceptance criteria đo được.
- srs còn 2 mục sơ đồ (Mermaid): **Sơ đồ luồng** — vẽ MỌI luồng của màn, mỗi luồng chọn loại phù hợp (Use case/Activity/Sequence/State); và **ERD** (mục riêng) — thực thể màn đụng tới.
- userstory: heading mỗi story theo format `US-S0x-NN: <Tên màn hình> - <Nội dung title>`; tiêu chí chấp nhận viết **Given-When-Then**, có kiểm INVEST và story point.
- design-spec: UI brief cho Designer — bắt buộc liệt kê UI States (Empty/Loading/Error/Success), CTA (Primary/Secondary), microcopy, edge case UX, **Animation chuyển cảnh** (chuyển màn vào/ra + section in/out); **không** vẽ ASCII, **không** quy định mã màu/font.
- usecase và userstory phải khớp các luồng trong srs.
- design-spec là **đầu vào của skill Figma** (bước tùy chọn): xong design-spec, có thể invoke `ba-figma-draw <màn>` (tự chọn backend theo MCP đang cài) để preview Figma trước khi ra HTML.
- Tiếng Việt.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Ranh giới

- Chạy sau `ba-screens`; từ 3 màn ⬜ trở lên thì dùng `ba-batch`.
