# `ba-discover process` — Phân tích hiện trạng AS-IS/TO-BE + Gap analysis

> Chi tiết của chế độ `process` (`SKILL.md` → "Chế độ `process`"). Trước là skill `ba-process`.

## Mục tiêu
Sinh `docs/Ho-so/00-process.md`: mô hình quy trình nghiệp vụ **AS-IS (hiện trạng)** → **TO-BE (tương lai có hệ thống)** → **Gap analysis** → **yêu cầu/cải tiến phát sinh** (trace ra `FR`/`BR`/`TR`).

Đây là **tài liệu phân tích hiện trạng**, chạy **sớm** — sau `ba-discover stakeholder`/`ba-discover brainstorm`, **trước hoặc song song `ba-requirements`**. Tùy chọn nhưng **rất khuyến nghị** khi dự án **số hóa một quy trình đang chạy tay** (thủ công/hệ thống cũ): làm rõ *hiện tại vận hành thế nào*, *sẽ đổi ra sao khi có hệ thống*, và *khoảng cách đó đẻ ra yêu cầu gì*.

## Quy trình
1. Đọc `conventions.md` của `ba-toolkit`, `docs/Ho-so/00-brainstorm.md` và `docs/Ho-so/04-stakeholders.md` nếu có — nắm bối cảnh, vai trò/tác nhân, và các nút thắt người dùng đã than phiền.
2. **Mô hình AS-IS (hiện trạng):** vẽ **swimlane** quy trình đang chạy (thủ công hoặc hệ thống cũ) — mỗi vai trò 1 lane, thể hiện điểm bàn giao. Nêu rõ **pain point / nút thắt** (thao tác tay, chờ đợi, sai sót, làm lại, dữ liệu rời rạc) gắn vào từng bước. **Xen kẽ brainstorm:** quy trình hiện tại là kiến thức nằm ở người dùng — nếu chưa rõ các bước/tác nhân/quyết định/số liệu → **invoke `ba-discover brainstorm` (focused vào bước AS-IS · ai làm · điểm rẽ nhánh · thời gian/khối lượng)** để elicit sâu trước khi vẽ; kết quả nối vào `00-brainstorm.md`.
3. **Mô hình TO-BE (tương lai):** vẽ **swimlane** quy trình sau khi có hệ thống — bước nào hệ thống làm thay, bước nào tự động hóa, bước nào bỏ. Lane "Hệ thống" xuất hiện gánh phần việc số hóa.
4. **Gap analysis:** bảng đối chiếu **từng bước AS-IS → TO-BE** — *khác biệt* · *nguyên nhân/cơ hội* · **loại thay đổi (ESIA:** Eliminate/Simplify/Integrate/Automate — Bỏ / Đơn giản hóa / Gộp / Tự động hóa). Mỗi dòng gap **phải** có loại thay đổi + nguyên nhân.
5. **Rút yêu cầu phát sinh:** từ mỗi gap → suy ra yêu cầu, trace ra `FR`/`BR`; khi cần **di trú dữ liệu / đào tạo / chạy song song / chuyển đổi** thì đó là **`TR` (Transition Requirement)**. Mỗi yêu cầu phát sinh **phải** trace ra `FR`/`BR`/`TR` (là đầu vào để `ba-requirements` hợp thức hóa mã).
6. **Xác nhận giả định (BẮT BUỘC):** quy trình hiện trạng dễ suy đoán sai — gom mọi giả định (`GĐ-01`…), rà từng cái bằng `AskUserQuestion`, chốt rồi mới đi tiếp (theo "Xác nhận giả định" trong `conventions.md`). Chế độ batch: đánh dấu `⚠️ chưa xác nhận`.
7. **Bàn giao:** `00-process.md` là **đầu vào cho `ba-requirements`** — yêu cầu phát sinh sẽ được cấp mã chính thức và đưa vào `01-requirements.md`; luồng nghiệp vụ TO-BE tái sử dụng cho mục "Luồng nghiệp vụ" của requirements.

## Kỹ thuật áp dụng
- **Business Process Modeling (swimlane):** mô hình hóa quy trình theo lane — **mỗi vai trò/tác nhân một lane** — để thấy rõ *ai làm gì* và *điểm bàn giao*. Áp cho cả AS-IS lẫn TO-BE.
- **Gap Analysis (AS-IS vs TO-BE):** đặt hiện trạng cạnh tương lai, đối chiếu từng bước để lộ khoảng cách cần lấp — mỗi khoảng cách là một cơ hội cải tiến hoặc một yêu cầu.
- **Phân loại thay đổi ESIA** (Eliminate / Simplify / Integrate / Automate): xếp mỗi thay đổi vào một loại để định hướng giải pháp — bước nào **bỏ hẳn**, bước nào **đơn giản hóa**, bước nào **gộp** với bước khác, bước nào **tự động hóa** bằng hệ thống.
- **Value-added analysis:** soi mỗi bước là **tạo giá trị** (khách hàng sẵn lòng "trả tiền") hay **lãng phí** (chờ, làm lại, thao tác thừa) → ưu tiên xử lý bước lãng phí trong TO-BE.

## Sơ đồ
- Dùng **`swimlane-beta`** cho **cả AS-IS và TO-BE** (luồng đa vai trò, có bàn giao) — mỗi vai trò một `subgraph` (lane). Tuân **"Bộ chọn sơ đồ Mermaid"** (đa vai trò → bắt buộc swimlane, không dùng flowchart) trong `conventions.md`.
- Tuân **"Sơ đồ Mermaid — an toàn cú pháp"**: nhãn có ký tự đặc biệt `( ) " [ ] { }` → bọc trọn `["..."]`; không `;`; ID node chỉ chữ-số.
- **Tô màu phân vai:** gắn `:::role` sau node + dán khối `classDef` ở cuối mỗi sơ đồ (xem "Bảng màu phân vai node"). Có `docs/07-design-system.md` → dùng bộ `classDef` theo token; chưa có → dùng **bộ mặc định** (teal/cam).
- Sau khi vẽ → **đối chiếu coverage** (mỗi vai trò có lane, mỗi quyết định ≥2 nhánh có nhãn, không dead-end/orphan). Sơ đồ **phức tạp** (≥3 lane HOẶC ≥5 quyết định HOẶC lồng ≥2 tầng HOẶC có loop) → chạy **`ba-review diagram docs/Ho-so/00-process.md`**.

## Tiêu chí chất lượng (BẮT BUỘC)
- **AS-IS và TO-BE đều có swimlane render được + có tô màu phân vai** (`:::role` + `classDef`).
- **Mỗi dòng gap có loại thay đổi (ESIA) + nguyên nhân/cơ hội** — không để trống cột nào.
- **Mỗi yêu cầu phát sinh trace ra `FR`/`BR`/`TR`** (transition requirement cho di trú/đào tạo/chạy song song).
- **Không bịa:** quy trình hiện trạng thiếu thông tin thì **hỏi** người dùng; chế độ batch thì tự giả định hợp lý + ghi rõ + đánh dấu `⚠️ chưa xác nhận`, không âm thầm coi là chốt.

## Lưu ý
- Tiếng Việt. Tài liệu **cấp tổng, tùy chọn, 1 file/dự án** (`docs/Ho-so/00-process.md`).
- **Văn phong & Thuật ngữ:** mở rộng từ viết tắt ở lần đầu dùng (vd "ESIA (Eliminate/Simplify/Integrate/Automate)"); thêm footer `## Thuật ngữ` cuối `00-process.md` + bổ sung thuật ngữ mới vào `docs/Ho-so/00-glossary.md` — xem `conventions.md`.
- Viết `00-process.md` theo `assets/process-template.md`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
