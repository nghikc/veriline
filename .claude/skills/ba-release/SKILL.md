---
name: ba-release
description: Use when cần GÓI PHÁT HÀNH một phase — gộp roadmap của phase (mục tiêu, chức năng, Gantt, rủi ro) + tiêu chí nghiệm thu UAT rồi render HTML. Gọi ba-release phase-1 hoặc full.
---

# ba-release — Gói phát hành theo phase (roadmap + nghiệm thu)

## Mục tiêu
Ghép **kế hoạch phát hành** (`08-roadmap.md`) và **nghiệm thu** (`09-uat.md`) thành một **gói phát hành** cho một phase — tài liệu stakeholder đọc để biết *phase này làm gì, khi nào, và điều kiện coi là xong/ký*. Sinh `docs/Ho-so/releases/<phase>.md`, render ra HTML tự chứa (qua `ba-portal --single`), tùy chọn đẩy online (qua `ba-doc-public`). Giữ thuần Mermaid, zero-dependency.

## Cách gọi
- `ba-release <phase>` — một phase (vd `ba-release phase-1`) → `docs/Ho-so/releases/phase-1.md` + `.html`.
- `ba-release full` — **mọi phase trong một file** (mỗi phase một mục, đều kèm tiêu chí nghiệm thu) → `docs/Ho-so/releases/all-phases.md` + `.html`.
- `ba-release --all` — **mỗi phase một file riêng** (`phase-1.md`, `phase-2.md`…), tiện đẩy mỗi phase một URL.

## Điều kiện
- **Bắt buộc `docs/Ho-so/08-roadmap.md`** (chia phase + danh sách `F..`). Thiếu → dừng, route `ba-roadmap` trước.
- `docs/Ho-so/09-uat.md` **nên có** (nguồn tiêu chí nghiệm thu). Thiếu → tiêu chí nghiệm thu rút tạm từ acceptance criteria (GWT) của `userstory.md` các màn liên quan + ghi chú "nên chạy `ba-uat` để đầy đủ".

## Quy trình
1. Đọc `conventions.md` + `conv-gates.md`; `08-roadmap.md` (bắt buộc); `09-uat.md` (nếu có); `02-functions.md`/`01-requirements.md` để trace `F..`↔`FR..`; `00-vision.md` nếu có (tên dự án/mục tiêu).
2. **Xác định phase cần xuất** (từ `08-roadmap.md`: Now/Next/Later hoặc theo quý). `full`/`--all` → lặp cho mọi phase.
2b. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Sau khi đọc xong nguồn ở bước 1–2, trình phương án đủ 6 phần: phase nào xuất, mỗi phase gồm `F..` nào, file `docs/Ho-so/releases/*` sẽ TẠO vs GHI ĐÈ, có render HTML không, **có đẩy online qua `ba-doc-public` không (đưa tài liệu LÊN INTERNET — hỏi riêng, mặc định KHÔNG)** → `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. `full`/`--all` (nhiều phase) → luôn trên ngưỡng, phải chờ duyệt; một phase mới, chưa có file cũ → được bỏ chờ theo ngưỡng nhưng vẫn IN phương án. **Gọi từ `ba-accept` (đã qua cổng) → in phương án rút gọn rồi chạy tiếp, KHÔNG hỏi duyệt lại** (`conv-gates.md` → "Cổng cha bao phủ cổng con") — **trừ nhánh đẩy online `ba-doc-public`**, luôn phải hỏi riêng vì nó đưa tài liệu ra Internet.
3. Với **mỗi phase**, gom nội dung:
   - **Từ roadmap:** mục tiêu phase · phạm vi · danh sách `F..` (+ MoSCoW/RICE) · kế hoạch/Gantt của phase (nếu roadmap có) · phụ thuộc · rủi ro · tiêu chí ra mắt.
   - **Từ uat:** các kịch bản `UAT-..` **trace tới `FR`/ưu tiên của phase** (neo theo **FR + MoSCoW**, KHÔNG theo mã `F`) → đưa vào mục "Tiêu chí nghiệm thu" (bước nghiệp vụ + kết quả mong đợi đo được); lọc checklist ra mắt (Definition of Done) + vai trò ký theo phase. Chưa có `09-uat.md` → rút acceptance từ `userstory.md` các màn của `F..` + ghi chú.
   - **Chức năng "bị chẻ" giữa hai phase** (một `F` gộp nhiều FR khác ưu tiên — vd F gắn Should nhưng chứa một FR Must): neo kịch bản nghiệm thu theo **FR + ưu tiên**, đưa phần FR Must vào phase sớm, ghi chú rõ phần còn lại thuộc phase sau. Không loại kịch bản chỉ vì mã `F` của nó ở phase khác.
   - **Chỉ lấy phần thuộc phase** — không nhồi cả roadmap/uat toàn dự án vào một gói.
3b. **Mục 7 Chuyển đổi & Go-live:** hiện thực các `TR-..` của `01-requirements.md` cho phase (di trú dữ liệu + cutover + rollback + đào tạo — link cẩm nang `docs/Ho-so/userguide/` nếu có); không có gì chuyển đổi → ghi "Không áp dụng" kèm lý do. **Mục 8 Đo lường sau phát hành:** kéo chỉ số từ `00-vision.md` → bảng baseline/mục tiêu/cách đo/**lịch đo cụ thể** — khép vòng Solution Evaluation, `ba-accept` sẽ nhắc lịch này lúc ký.
4. **Viết `docs/Ho-so/releases/<phase>.md`** (hoặc `all-phases.md`) theo `template.md`. Sơ đồ:
   - **Gantt cắt lát + re-level theo NHÂN SỰ.** Lấy các `F..` của phase từ Gantt đa phase (§4.1 `08-roadmap.md`), NHƯNG đổi trục tổ chức: Gantt release có **`section` = track/người** (không phải phase). **Số track = năng lực nhân sự phase** (vd 2 dev → 2 track). Chia chức năng độc lập vào các track → **song song giữa track đúng số người**, tuần tự trong track; giữ `after` cho phụ thuộc thật (kể cả xuyên track). Đây là điểm khác Gantt roadmap: roadmap cho song song **lý tưởng theo phụ thuộc** (không giới hạn năng lực), release **re-level xuống năng lực thật**. Nhân sự chưa biết → hỏi người dùng (1 câu: mấy dev/track cho phase) hoặc ghi giả định `GĐ ⚠️` (vd 2 dev). Trục tương đối (tuần), "chờ PO chốt ngày", không bịa ngày lịch. `:crit` đánh đường-găng (quyết thời gian tối thiểu — thêm người không rút được).
   - **Dependency map** lọc riêng node của phase.
5. **Render HTML:** invoke `ba-portal --single docs/Ho-so/releases/<phase>.md docs/Ho-so/releases/<phase>.html` → file HTML tự chứa (offline mở được, sơ đồ render).
6. **(Tùy chọn) Đẩy online:** gợi ý `ba-doc-public docs/Ho-so/releases/<phase>.html --slug roadmap-<phase> --title "..."` → URL cố định (vd `.../roadmap-phase-1`). Slug quy ước `roadmap-<phase>` (khác **tên file** `<phase>.md`). Chỉ chạy khi người dùng muốn (thao tác online — xem `ba-doc-public`).
7. Báo người dùng: đường dẫn `.md` + `.html`, và lệnh deploy nếu cần.

## Tiêu chí chất lượng (BẮT BUỘC)
- Gói **chỉ chứa phần của phase** (F.. + UAT + kế hoạch của đúng phase đó), không lẫn phase khác (trừ `full` — nhưng vẫn tách mục rõ theo phase).
- Mỗi `F..` trong phase **trace về `02-functions.md`**; mỗi kịch bản nghiệm thu **trace về `FR` + ưu tiên của phase** (neo theo FR/MoSCoW, không theo mã `F` — xem luật "chức năng bị chẻ" ở Quy trình bước 3).
- Mục "Tiêu chí nghiệm thu" có **kết quả mong đợi đo được** (mượn từ `ba-uat`), không "chạy ổn".
- HTML render được (sơ đồ không vỡ — `ba-portal` lint/bắt lỗi); không bịa nội dung — thiếu nguồn thì ghi chú, không tự chế.

## Ranh giới
- Render qua `ba-portal`; tùy chọn đẩy online qua `ba-doc-public`.

## Lưu ý
- `docs/Ho-so/releases/` là folder **để render lẻ** (`--single`), **không** vào `docs/Ho-so/portal.html` mặc định (portal chỉ gom doc pipeline) — đúng ý: mỗi gói phát hành là một trang/URL riêng.
- Là **skill ghép** — không sinh ưu tiên/nghiệm thu mới; nguồn là `ba-roadmap` + `ba-uat`. Roadmap/UAT đổi → chạy lại `ba-release` để gói mới.
- Tiếng Việt; Văn phong & Thuật ngữ (footer `## Thuật ngữ`); **tên file/phase** kebab-case ASCII (`phase-1`); **slug đẩy online** theo quy ước `roadmap-<phase>` (vd `roadmap-phase-1`) — hai thứ khác nhau, đừng lẫn.

- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Tham chiếu
- `ba-roadmap` (nguồn phase + `F..`) · `ba-uat` (nguồn nghiệm thu) · `ba-portal --single` (render HTML) · `ba-doc-public` (đẩy online).
- `template.md` (cùng thư mục) — khung gói phát hành.
