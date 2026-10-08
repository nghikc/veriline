# `ba-discover urd` — User Requirements Document (nhu cầu người dùng, solution-free)

> Chi tiết của chế độ `urd` (`SKILL.md` → "Chế độ `urd`"). Trước là skill `ba-urd`.

## Mục tiêu
Chốt **người dùng cần gì và kết quả nào có giá trị với họ** — *trước* khi ai đó quyết định hệ thống sẽ làm thế nào. Sinh một **URD (User Requirements Document)** gồm 10 mục (xem `assets/urd-template.md`), trong đó lõi là:
- **`UN-01` — Nhu cầu người dùng:** ai · trong bối cảnh nào · cần gì · kết quả mong đợi · mức quan trọng · bằng chứng.
- **`UE-01` — Ngoại lệ phía người dùng (Mục 6):** tình huống hỏng/biên + kết quả người dùng cần thấy; màn xử lý trích ngược mã này.
- **`USC-01` — Tiêu chí thành công của người dùng:** đo bằng kết quả người dùng đạt được, không đo bằng tính năng đã build.

URD là **tầng yêu cầu người dùng** trong chuỗi: `BO/PS/U → UN → StR/FR/NFR → F → S → …`. Nó trả lời "cần gì", `01-requirements.md` mới trả lời "hệ thống phải làm gì".

> **Phân vai với các skill lân cận** — đừng gộp:
> - `ba-discover persona` (`00-personas.md`) = **người dùng là AI, họ đi qua những bước nào, cảm xúc ra sao** (chân dung + journey map + ứng viên `U-..`). Là **đầu vào** của `ba-discover urd`.
> - `ba-discover urd` (`00-urd.md`) = **họ CẦN GÌ, đo thành công thế nào** (nhu cầu `UN-..` có bằng chứng + ranh giới phạm vi + ngoại lệ + `USC-..`).
> - `ba-requirements` (`01-requirements.md`) = **hệ thống PHẢI LÀM GÌ** (`FR`/`NFR`/`BRule`) — bắt đầu có giải pháp.
> - `ba-discover vision` (`00-vision.md`) = **vì sao doanh nghiệp làm** (`BO-..`, ROI). URD nhìn từ phía người dùng, vision nhìn từ phía doanh nghiệp.

## Phạm vi (tham số)
- `ba-discover urd` (không tham số) → **URD cấp dự án** → `docs/Ho-so/00-urd.md`.
- `ba-discover urd <tên-feature>` → **URD của một feature** → `docs/urd/<feature>.md` (tên file kebab-case không dấu, vd `authentication`, `thanh-toan`). Dùng khi dự án đã chạy và đang thêm/đào sâu một mảng — thường đi kèm `ba-add-screen feature`.
- File đã tồn tại → **chế độ cập nhật**: giữ mã `UN`/`USC` cũ (mã đã cấp không tái sử dụng cho nhu cầu khác), thêm mã mới nối tiếp, ghi mục "Lịch sử cập nhật" cuối file.

## Điều kiện
- **Nên có:** `00-brainstorm.md` (nguồn bằng chứng chính), `00-personas.md`, `00-vision.md`, `00-process.md`, `00-intake.md` — cái nào có thì đọc, không có thì thôi.
- **Không có nguồn nào** → phải phỏng vấn trước: invoke `ba-discover brainstorm` (focused vào *ai dùng · làm việc gì · hiện đang khổ ở đâu · thế nào là xong việc*) rồi mới viết URD. **Không** viết URD từ suy đoán thuần.

## LUẬT VÀNG — solution-free (BẮT BUỘC)
URD mô tả **nhu cầu**, không mô tả **giải pháp**. Mỗi dòng viết ra tự soi: *nếu đổi hoàn toàn cách hiện thực, câu này còn đúng không?* Còn đúng → là nhu cầu. Sai → là giải pháp, phải viết lại.

| ❌ Giải pháp (không thuộc URD) | ✅ Nhu cầu (thuộc URD) |
|---|---|
| "Màn hình đăng nhập có nút *Đăng nhập với Google*" | "Người dùng cần vào được app mà không phải tạo thêm mật khẩu mới" |
| "Hệ thống gửi email chứa link xác nhận hết hạn sau 24 giờ" | "Người dùng cần xác nhận được danh tính của mình dễ dàng để mở khoá nội dung" |
| "Lưu token vào cookie HttpOnly 30 ngày" | "Người dùng không muốn phải đăng nhập lại mỗi lần quay lại app trên máy của mình" |
| "Bảng `users` có cột `google_id`" | "Người dùng không muốn bị tách thành hai tài khoản khi đổi cách đăng nhập" |

Ngoại lệ hợp lệ: **ràng buộc do người dùng/bối cảnh áp đặt** (Mục 7 — thiết bị, ngôn ngữ, pháp lý) và **ngưỡng người dùng cảm nhận được** (vd "sau nhiều lần sai bị chặn tạm và được báo rõ khi nào thử lại") — cái này là *kết quả người dùng thấy*, không phải cách hiện thực.

## Quy trình
1. Đọc `conventions.md` của `ba-toolkit`; đọc các nguồn có sẵn ở "Điều kiện". Nếu có `01-requirements.md` → đọc luôn (dự án đang chạy, xem bước 8).
2. **Trích bằng chứng, không trích ý kiến.** Lập bảng thô: mỗi phát biểu về người dùng ↔ nguồn (`00-brainstorm.md` mục N, `00-personas.md` `PS-02`, biên bản họp `DEC-03`, phỏng vấn ngày…). Ba mức bằng chứng dùng suốt tài liệu:
   - **Đã xác nhận** — người dùng/khách nói rõ, có trong nguồn.
   - **Quan sát** — rút từ mô tả hiện trạng/quy trình/analytics.
   - **Giả định** — chưa có nguồn → phải vào Mục 8 và mang `GĐ-..`.
3. **Mục 1–2:** viết Mục đích + bảng *Vấn đề & trải nghiệm hiện tại* (người dùng · tình huống hiện tại · vấn đề · hậu quả với họ · bằng chứng) và *Nhóm người dùng* (chính/phụ · bối cảnh · mục tiêu chính · nỗi đau). Có `00-personas.md` → nhóm người dùng bám `PS-..`, ghi mã để truy vết; đừng dựng lại persona.
4. **Mục 3 — Ranh giới phạm vi:** liệt kê **Trong phạm vi** và **Ngoài phạm vi** bằng ngôn ngữ nhu cầu. *Mục "Ngoài phạm vi" quan trọng ngang mục trong* — mỗi dòng ngoài phạm vi nên kèm lý do ngắn (để sau, thuộc feature khác, không áp dụng với thị trường này).
5. **Mục 4 — Nhu cầu `UN-..`** (lõi tài liệu): mỗi dòng = **một** nhu cầu nguyên tử, có đủ *Người dùng · Bối cảnh/kích hoạt · Nhu cầu · Kết quả mong đợi · Mức quan trọng (Critical/High/Medium/Low) · Bằng chứng*. Kiểm mỗi `UN`:
   - Viết theo lời người dùng, không lời hệ thống (Luật vàng).
   - **Nguyên tử** — "và" trong câu nhu cầu thường là dấu hiệu phải tách hai `UN`.
   - **Mã không đánh lại số:** cấp theo thứ tự phát hiện; nhu cầu tách ra hoặc bổ sung ở vòng rà soát lấy **số kế tiếp** (không chèn `UN-06b`, không renumber cả bảng — mã đã cấp là mã vĩnh viễn, như `CR`/`WI`). Bảng có thể gom theo nhóm người dùng dù mã không liên tục; ghi một dòng chú thích khi thứ tự mã bị gãy.
   - **Kết quả mong đợi quan sát được** — người ngoài nhìn vào biết là đã đạt hay chưa.
   - Có **≥1 nguồn**; không nguồn → hoặc hỏi người dùng, hoặc hạ xuống Mục 8 (giả định), **không** ghi như sự thật.
6. **Mục 5 — Hành trình ưu tiên:** chọn **3–6 hành trình then chốt** (không liệt kê mọi luồng). Mỗi hành trình: người dùng · mức quan trọng · kích hoạt · kết quả mong đợi · **`UN` liên quan** · các bước theo góc nhìn người dùng · **"Kiểm chứng độc lập"** — một câu mô tả cách *quan sát được* rằng hành trình này đã đạt, **không phụ thuộc hành trình khác**. Hành trình không viết nổi câu kiểm chứng độc lập = chưa phải hành trình hoàn chỉnh, gộp hoặc tách lại.
   - Cần vẽ sơ đồ thì theo "Bộ chọn sơ đồ Mermaid" (`conventions.md`): ≥2 vai trò có bàn giao → `swimlane-beta`; cảm xúc theo bước là việc của `ba-discover persona` (`journey`), đừng nhân bản ở đây.
7. **Mục 6–7:** *Ngoại lệ & tình huống biên* — mỗi dòng một mã **`UE-..`** (cột đầu, không đánh lại số) · tình huống · ảnh hưởng tới người dùng · **kết quả người dùng thấy** · **mức** (Critical/High/Medium/Low) · hành trình/`UN` liên quan · cột cuối *"Chưa màn nào xử lý"* — đây là nơi bắt "chuyện gì khi hỏng", nguồn quý cho `E-S`/`TC` Negative sau này. URD **không** trỏ xuống màn (giữ solution-free): chính `ba-screen-spec` trích ngược `UE-..` ở dòng `E-S`/`R-S` xử lý nó. Biết chắc không màn nào xử lý (ngoài phạm vi, hoãn) → cột cuối ghi `n/a — lý do` hoặc `OQ-..` của Mục 10; `ba-trace` coi đó là mồ côi hợp lệ, `UE` Critical/High mồ côi không lý do → 🟡. Rồi *Ràng buộc phía người dùng* (ngôn ngữ, thiết bị/kênh chính, năng lực số, pháp lý/quyền riêng tư áp lên trải nghiệm).
8. **Mục 8 — Giả định & cách kiểm chứng:** mỗi giả định có *Ảnh hưởng nếu sai · Trạng thái · Việc kế tiếp (ai xác nhận, ở bước nào)*. Chạy vòng **"Xác nhận giả định"** của `conventions.md` (hỏi từng `GĐ-..` bằng `AskUserQuestion` → bảng tổng hợp → cổng quyết định); batch → `⚠️ chưa xác nhận`.
9. **Mục 9 — `USC-..`:** *Kết quả người dùng · Hiện trạng (baseline) · Mục tiêu · Cách đo · Kỳ rà soát*. Đo **kết quả người dùng đạt được** (hoàn tất được việc, khôi phục được truy cập), **không** đo "đã build xong tính năng". Chưa có số nền → ghi thẳng "Chưa có — xác lập trong N tuần sau ra mắt", đừng bịa baseline. Có `00-vision.md` → mỗi `USC` nên đỡ được ≥1 `BO-..`.
10. **Mục 10 — Câu hỏi mở `OQ-..`:** cái chưa quyết được, kèm *cần ai trả lời* + *chặn bước nào*. Hết câu hỏi thì ghi rõ là hết (và chỉ sang Mục 8), không để mục trống.
11. **Nối xuống bước sau:**
    - **Dự án mới** → báo người dùng danh sách `UN-..` theo mức quan trọng; đây là đầu vào trực tiếp của `ba-requirements` (mỗi `UN` sinh ≥1 `StR`/`FR`/`NFR`; `UN` Critical **phải** thành yêu cầu Must hoặc được ghi lý do loại).
    - **Dự án đã có `01-requirements.md`** → đối chiếu từng `UN` theo **bốn nơi, đúng thứ tự** — đừng dừng ở nơi đầu tiên:
      1. **`01-requirements.md`** — có `FR`/`NFR`/`TR` phủ chưa? Có → ghi mã, xong.
      2. **`08-roadmap.md`** (nếu có) — nhu cầu đã được **park ở Now/Next/Later** chưa? Có → **KHÔNG phải hở**, ghi "đã theo dõi ở roadmap `<mục>`" + mã `U-..` tương ứng. Đây là lỗi hay gặp nhất: gọi "hở" một thứ đã có chỗ theo dõi rồi → mở `CR`/`WI` trùng.
      3. **`00-cr.md` / `00-backlog.md`** — đã có `CR`/`WI` đang mở cho nhu cầu đó chưa? (dùng `ledger.js … ids`, đừng Read cả sổ). Có → ghi mã, xong.
      4. **Ngoài phạm vi có chủ đích** — nhu cầu đã bị chốt loại ở `00-vision.md` §Out-of-scope hoặc Mục 3 của chính URD? Có → ghi "quyết định phạm vi", **không** phải hở.
      Qua cả bốn mà vẫn trống → **mới là hở phạm vi thật** → đề xuất mở **`CR`** qua `ba-change-request` (đổi baseline) hoặc **`WI`** qua `ba-task` (việc mới/kỹ thuật trong phạm vi).
    - **Không** sửa thẳng `01-requirements.md`/`08-roadmap.md`/sổ nào từ skill này — chỉ đề xuất.
12. Ghi file theo `assets/urd-template.md` (footer `## Thuật ngữ` + bổ sung `00-glossary.md`: URD, User Need, Baseline, Critical/High/Medium/Low…). Có `docs/00-tracking.md` thì URD **không** thêm dòng (không phải tài liệu theo màn) — chỉ báo trong tổng kết.

## Tiêu chí chất lượng
- **Zero giải pháp** — quét lại toàn văn tìm tên màn/nút/API/bảng/công nghệ; thấy là viết lại (ngoại lệ ở Luật vàng).
- Mọi `UN` **có bằng chứng**; số nhu cầu Critical ít và thật sự sống-còn (Critical mà cái gì cũng Critical = chưa ưu tiên).
- Mỗi hành trình có **câu kiểm chứng độc lập**; mọi hành trình đều trỏ về ≥1 `UN`, và mọi `UN` Critical/High xuất hiện trong ≥1 hành trình hoặc ngoại lệ.
- Mục **Ngoài phạm vi** không rỗng (dự án nào cũng có ranh giới; rỗng = chưa nghĩ tới).
- Mỗi `USC` đo **kết quả người dùng**, có cách đo cụ thể + kỳ rà soát; không có "cải thiện trải nghiệm" chung chung.
- Giả định tách khỏi sự thật rõ ràng — người đọc phân biệt được ngay cái nào chắc, cái nào chờ xác nhận.

## Ranh giới
- KHÁC `ba-discover persona` (chân dung người dùng + journey theo cảm xúc).

## Lưu ý
- **Tài liệu sống:** hiểu thêm về người dùng → cập nhật URD; URD đã kéo theo `FR` mà đổi nhu cầu → đi qua `ba-change-request`.
- URD **không** thay `01-requirements.md` và không cấp mã `FR`. Thấy mình đang viết `FR` là đã đi quá — dừng, để `ba-requirements` làm.
- Gate: `ba-review urd` (độ phủ + soi rò rỉ giải pháp). Chạy trước khi sang `ba-requirements`.
- **Xuất bản:** `00-urd.md` vào `ba-portal` như mọi doc `NN-*`; `docs/urd/<feature>.md` **không** vào portal mặc định (như `meetings/`, `releases/`) — cần thì `ba-portal --single docs/urd/<feature>.md` rồi `ba-doc-public` nếu muốn chia sẻ link.
- **Văn phong & Thuật ngữ:** theo `conventions.md` — mở rộng từ viết tắt lần đầu, footer `## Thuật ngữ`.
- Tiếng Việt.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
