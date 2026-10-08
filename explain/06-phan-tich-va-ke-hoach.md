---
type: skill-explainer
group: phan-tich-va-ke-hoach
updated: 2026-07-15
---

# Nhóm phân tích vấn đề & kế hoạch — 11 skill "linh hồn BA"

> Các skill này lo phần **hiểu vấn đề, phân tích hiện trạng, ưu tiên, nghiệm thu** — đúng phần "Analyst" mà nhóm mô hình hóa giải pháp (requirements/screens/data…) không phủ. Đều là tài liệu cấp tổng, tùy chọn, 1 file/dự án.
>
> **`ba-brainstorm` xen kẽ để làm rõ:** các skill này KHÔNG tự hỏi hời hợt. Khi đầu vào còn mơ hồ (vấn đề chưa rõ, quy trình hiện tại chưa nắm, số Reach/Impact chưa có cơ sở, tiêu chí nghiệm thu chưa chốt) → chúng **invoke `ba-brainstorm` (phỏng vấn sâu, focused)** để elicit trước. Nhờ continuation mode, mỗi lần focused nối thêm vào `00-brainstorm.md`. Orchestrator `ba-discover` xen kẽ brainstorm trước vision, trước process, và một lần đào sâu giải pháp cuối cùng.

## Chọn cái nào? — theo giai đoạn

| Giai đoạn | Câu hỏi | Skill | Đầu ra |
|---|---|---|---|
| Trước khi làm | *Vì sao làm dự án này? Đáng làm không?* | `ba-vision` | `docs/Ho-so/00-vision.md` |
| Hiểu hiện trạng | *Quy trình đang chạy thế nào? Số hóa thì đổi gì?* | `ba-process` | `docs/Ho-so/00-process.md` |
| Hiểu người dùng | *Người dùng là ai, đi qua những bước nào?* | `ba-persona` | `docs/Ho-so/00-personas.md` |
| Chốt nhu cầu | *Người dùng CẦN GÌ, đo thành công thế nào?* | `ba-urd` | `docs/Ho-so/00-urd.md` · `docs/urd/<feature>.md` |
| Lập kế hoạch | *Làm cái nào trước? Chia release ra sao?* | `ba-roadmap` | `docs/Ho-so/08-roadmap.md` |
| Nghiệm thu | *Khi nào coi là xong và ký được?* | `ba-uat` | `docs/Ho-so/09-uat.md` |
| Phát hành | *Gói một phase (kế hoạch + nghiệm thu) ra HTML/URL* | `ba-release` | `docs/Ho-so/releases/<phase>.md` + `.html` |
| Vận hành | *Người dùng/admin dùng phần mềm này THẾ NÀO?* | `ba-userguide` | `docs/Ho-so/userguide/*.html` (cẩm nang) |

---

## ba-vision — Vision & Scope / Business Case

**Làm gì.** Làm rõ **chiến lược trước khi viết yêu cầu**: vấn đề/cơ hội, mục tiêu kinh doanh SMART (`BO-..`), các phương án + đề xuất (cost-benefit/ROI), phạm vi in/out (MoSCoW), chỉ số thành công (KPI gắn mục tiêu), ràng buộc & rủi ro.

**Khi nào dùng.** Ngay đầu dự án — trước `ba-requirements`. Trả lời "vì sao làm & đáng làm không". `ba-requirements` lấy Business Need từ đây.

**KHÔNG dùng khi.** Chỉ thêm một tính năng nhỏ vào sản phẩm đã rõ chiến lược (dùng thẳng `ba-add-feature`).

**Đầu vào.** Ý tưởng/brief; `00-brainstorm.md`/`04-stakeholders.md` nếu có.
**Đầu ra.** `docs/Ho-so/00-vision.md`.
**Ví dụ.** `ba-vision` cho ý tưởng "app quản lý công việc nhóm" → mục tiêu "giảm 50% họp cập nhật", 3 option, scope giai đoạn 1.

---

## ba-process — AS-IS / TO-BE + Gap analysis

**Làm gì.** Mô hình hóa **quy trình hiện tại (AS-IS)** → **quy trình tương lai có hệ thống (TO-BE)** bằng swimlane, rồi **Gap analysis** (khác biệt từng bước, loại thay đổi bỏ/gộp/tự động hóa/thêm — ESIA) → rút **yêu cầu phát sinh** trace ra `FR`/`BR`/`TR`.

**Khi nào dùng.** **Rất khuyến nghị khi số hóa quy trình đang chạy tay** (hoặc thay hệ thống cũ). Chạy sớm, sau stakeholder/brainstorm, trước/song song `ba-requirements`.

**KHÔNG dùng khi.** Sản phẩm hoàn toàn mới không có quy trình AS-IS (bỏ AS-IS, chỉ cần TO-BE trong requirements là đủ).

**Đầu vào.** `00-brainstorm.md`/`04-stakeholders.md`; mô tả quy trình hiện tại.
**Đầu ra.** `docs/Ho-so/00-process.md` (2 swimlane có màu + bảng gap + yêu cầu phát sinh).
**Ví dụ.** Duyệt hoàn tiền đang làm qua email/Excel → AS-IS swimlane, TO-BE swimlane có hệ thống → gap "tự động hóa bước tính toán" → FR mới.

---

## ba-roadmap — Ưu tiên & Lộ trình phát hành

**Làm gì.** Xếp **ưu tiên** các chức năng (**MoSCoW + RICE + Kano**) rồi chia thành **release Now/Next/Later** kèm **sơ đồ phụ thuộc**. Cho PO/PM quyết làm cái nào trước.

**Khi nào dùng.** Sau `ba-functions` (cần danh sách `F..`), khi có nhiều chức năng/feature và cần lập kế hoạch phát hành theo giai đoạn.

**KHÔNG dùng khi.** Dự án nhỏ làm một lần, không chia release.

**Đầu vào.** `02-functions.md` (các `F..`), `01-requirements.md` (MoSCoW), `00-vision.md` nếu có.
**Đầu ra.** `docs/Ho-so/08-roadmap.md` (bảng ưu tiên RICE + lộ trình + sơ đồ phụ thuộc). Tài liệu **sống** — cập nhật khi ưu tiên đổi.
**Ví dụ.** 13 chức năng → RICE xếp hạng → Now: đăng nhập + dashboard; Next: giao việc + thông báo; Later: báo cáo.

---

## ba-uat — Kế hoạch nghiệm thu (UAT) cấp dự án

**Làm gì.** Gom acceptance criteria xuyên các user story thành **kịch bản UAT end-to-end** (theo luồng nghiệp vụ, người dùng chạy) + **ma trận truy vết** requirement→UAT + **checklist ký nghiệm thu** (tiêu chí ra mắt + vai trò ký).

**Khi nào dùng.** Trước nghiệm thu/ra mắt, khi cần bằng chứng "đủ điều kiện ký". **Khác `ba-test`** (ca test kỹ thuật per màn) — đây là nghiệm thu **nghiệp vụ, xuyên màn, do người dùng/PO**. Thường không gọi lẻ: orchestrator **`ba-accept`** (Giai đoạn 4, sau `dev-run`) tự chạy `ba-uat` → chạy UAT → `ba-release` → `ba-trace` → xuất bản → ký.

**KHÔNG dùng khi.** Chỉ cần test kỹ thuật một màn (dùng `ba-test`).

**Đầu vào.** `01-requirements.md` (FR/BR), `userstory.md`/`usecase.md`/`test.md` các màn.
**Đầu ra.** `docs/Ho-so/09-uat.md` (kịch bản UAT + RTM + checklist ký).
**Ví dụ.** Kịch bản "Team Lead giao việc → Member nhận thông báo → cập nhật xong → Team Lead duyệt" xuyên 3 màn, trace về FR-04/05/06/09.

---

## ba-release — Gói phát hành theo phase (roadmap + nghiệm thu → HTML)

**Làm gì.** Ghép **kế hoạch của một phase** (từ `ba-roadmap`: mục tiêu, chức năng, Gantt, phụ thuộc, rủi ro) + **tiêu chí nghiệm thu của phase đó** (từ `ba-uat`: kịch bản UAT + checklist ký) thành **một tài liệu gói phát hành**, rồi render ra **HTML tự chứa** (qua `ba-portal --single`) và tùy chọn đẩy online (qua `ba-doc-public`).

**Khi nào dùng.** Cần một trang/URL gọn cho **một phase** để stakeholder duyệt: *phase này làm gì, khi nào, điều kiện coi là xong & ký*. Hỗ trợ `ba-release phase-1` (một phase), `full` (mọi phase một file), `--all` (mỗi phase một file/URL).

**KHÔNG dùng khi.** Chưa có `08-roadmap.md` (chạy `ba-roadmap` trước). Đây là skill **ghép**, không sinh ưu tiên/nghiệm thu mới.

**Đầu vào.** `08-roadmap.md` (bắt buộc) + `09-uat.md` (nên có).
**Đầu ra.** `docs/Ho-so/releases/<phase>.md` + `.html` (render lẻ, không vào portal). Tùy chọn URL qua `ba-doc-public` (vd `.../roadmap-phase-1`).
**Ví dụ.** `ba-release phase-1` → gói Phase 1 (chức năng Must + Gantt + UAT của Phase 1) → `phase-1.html` → `ba-doc-public --slug roadmap-phase-1`.

---

## ba-userguide — Cẩm nang sử dụng / vận hành (BA docs → hướng dẫn)

**Làm gì.** Đọc ngược tài liệu BA đã có (requirements, srs/usecase/test từng màn, glossary) rồi viết **cẩm nang dạy CÁCH DÙNG phần mềm** cho admin/CSKH/người dùng cuối — tổ chức theo 6 trụ (Tổng quan · Bắt đầu nhanh · Hướng dẫn theo tác vụ · Tra cứu · Xử lý sự cố · FAQ/Thuật ngữ). Chạy 2 giai đoạn: dựng **mục lục** (có agent `ba-manual-reviewer` soát cấu trúc) → **DỪNG chờ bạn duyệt** → mới viết từng trang + **ảnh chụp từ APP THẬT** có đánh số callout (engine tự đăng nhập, chụp, che thông tin nhạy cảm — bạn cấp URL/tài khoản; không muốn cấp quyền thì tự chụp theo brief có sẵn). App chưa deploy → tạm dùng ảnh mockup nhưng luôn ghi chú "(mockup)" và có danh sách thay sau. Ra **1 file HTML double-click là mở**.

**Khi nào dùng.** Sau khi build/nghiệm thu xong (GĐ4 — `ba-accept` sẽ hỏi), hoặc bất cứ lúc nào cần tài liệu bàn giao cho người vận hành. Tài liệu nguồn đổi → gọi lại, skill tự vào chế độ cập nhật.

**KHÔNG dùng khi.** Cần trang đọc *tài liệu BA* cho team (đó là `ba-portal`); cần gói *kế hoạch + nghiệm thu* cho stakeholder (đó là `ba-release`). Cẩm nang là cho người DÙNG phần mềm, không phải người làm dự án.

**Đầu vào.** `02-functions.md` + `00-tracking.md` + các màn đã ✅ (srs/usecase/test/html-design) + `00-glossary.md`. **Đầu ra.** `docs/Ho-so/userguide/<tên>.html` + bundle (pages/ảnh/index) — không vào portal, chia sẻ online bằng `ba-doc-public`.

**Ví dụ.** `/ba-userguide` → mục lục 12 trang (2 tổng quan, 1 bắt đầu nhanh, 6 how-to theo UC, 1 tra cứu, 1 xử lý sự cố từ TC Negative, 1 FAQ+thuật ngữ) → duyệt → 12 trang + 8 ảnh callout → `docs/Ho-so/userguide/userguide.html`.


## ba-userguide-video — Clip hướng dẫn có giọng đọc

**Làm gì.** Từ các trang hướng dẫn thao tác (how-to) **đã duyệt** của cẩm nang, dựng **clip hướng dẫn** khổ ngang: máy mở app thật, thao tác lần lượt từng bước (có con trỏ và khung khoanh chỗ cần bấm), một giọng đọc tiếng Việt đọc lời giải thích, phụ đề chạy khớp từng chữ, mỗi trang một chương. Giọng đọc lấy từ công cụ TTS riêng.

**Điểm hay.** Lời đọc bám đúng trang đã duyệt và ghi rõ trang đó đến từ use case/test case nào — clip không nói gì cẩm nang không nói. Máy đọc trước rồi mới quay, nên dù máy chạy nhanh hay chậm, tiếng vẫn khớp hình. Trang cẩm nang sửa sau khi đã dựng clip → máy báo "clip cũ", dựng lại thì chỉ đọc lại những câu đã đổi.

**Khi nào dùng.** Cẩm nang đã xong và duyệt, app đã chạy được, muốn có video cho người dùng mới/CSKH tự học.

**KHÔNG dùng khi.** Cẩm nang chưa duyệt (sửa nội dung ở `ba-userguide` trước); chưa có app chạy được; cần video dọc cho mạng xã hội (chưa hỗ trợ).

**Đầu ra.** Kịch bản từng clip trong `docs/Ho-so/userguide/<bundle>/video/` (để đối soát); file video `.mp4` + phụ đề ở thư mục `.ba-video/` của dự án (không đưa lên git).
## ba-persona — Chân dung người dùng & Hành trình

**Làm gì.** Trả lời "làm cho AI, họ đi qua những bước nào" trước khi viết yêu cầu. Dựng `docs/Ho-so/00-personas.md`: các **persona** (chân dung đại diện mỗi nhóm người dùng — mục tiêu, nỗi đau, độ rành công nghệ, bối cảnh dùng) + **bản đồ hành trình** (các bước + cảm xúc lên/xuống khi họ đạt mục tiêu). Mỗi nỗi đau/cơ hội được nối thành một **ứng viên `U-..`** cho `ba-urd`/`ba-requirements` — đó là giá trị chính: biến hiểu-biết-người-dùng thành nhu cầu rồi thành yêu cầu.

**Khi nào dùng.** Giai đoạn discovery, chạy sớm (trước/song song requirements), nhất là khi cần thiết kế xoay quanh trải nghiệm người dùng. Khác `ba-stakeholder` (ai *có quyền lợi/quyền lực* với dự án) — đây là *người thật sự DÙNG app*. Khác `ba-urd` (*họ cần gì*) — đây là *họ là ai*.

## ba-urd — Tài liệu Yêu cầu Người dùng (URD)

**Làm gì.** Chốt **người dùng CẦN GÌ** trước khi ai đó quyết định hệ thống làm thế nào. Dựng `docs/Ho-so/00-urd.md` (cả dự án) hoặc `docs/urd/<feature>.md` (một mảng) gồm 10 mục: mục đích + vấn đề hiện tại · nhóm người dùng · **ranh giới phạm vi (trong/ngoài)** · **nhu cầu `UN-..`** (ai · bối cảnh · cần gì · kết quả mong đợi · mức quan trọng · **bằng chứng lấy từ đâu**) · hành trình ưu tiên (mỗi hành trình kèm câu *kiểm chứng độc lập*) · ngoại lệ & tình huống biên · ràng buộc phía người dùng · giả định + cách kiểm chứng · **tiêu chí thành công `USC-..`** (đo kết quả người dùng đạt được, không đo "đã build xong") · câu hỏi mở.

**Luật vàng.** Tài liệu **solution-free** — không tên màn, không nút, không API, không bảng dữ liệu. Cách tự soi: *đổi hoàn toàn cách hiện thực thì câu này còn đúng không?* Còn đúng là nhu cầu, sai là giải pháp (đã lạc sang `ba-requirements`). `ba-review urd` bắt lỗi này ở mức 🔴.

**Khi nào dùng.** Cuối giai đoạn discovery, ngay trước `ba-requirements` — nơi gom mọi thứ vừa đào được (brainstorm, personas, vision, quy trình) thành một danh sách nhu cầu có bằng chứng. Dự án đã chạy mà thêm mảng mới → `/ba-urd <tên-feature>`; nhu cầu chưa được `FR` hiện có phủ sẽ thành đề xuất mở `CR`/`WI`, không sửa thẳng yêu cầu.

**Đầu vào.** `00-brainstorm.md` (nguồn bằng chứng chính) + `00-personas.md` + `00-vision.md` + `00-process.md` (cái nào có). Không có nguồn nào → phỏng vấn (`ba-brainstorm`) trước, đừng viết URD từ suy đoán. **Đầu ra.** `docs/Ho-so/00-urd.md` / `docs/urd/<feature>.md` → `ba-requirements` biến mỗi `UN` thành ≥1 `FR`/`StR`/`NFR`.

## ba-flow — Người dùng đi qua những màn nào để xong việc

**Làm gì.** Từ một ý tưởng thô, rút ra **các luồng làm việc** (ai, làm gì, qua những màn nào) và một **danh sách màn sơ bộ** kèm sơ đồ điều hướng — trước khi có bất kỳ tài liệu yêu cầu nào.

**Khi nào dùng.** Khi cần dựng bản bấm thử để chốt nghiệp vụ: muốn vẽ giao diện thì phải biết có màn gì và bấm đi đâu, mà cách làm xuôi lại bắt viết yêu cầu xong mới suy ra được màn. Đây là mảnh gỡ nút thắt đó.

**Lưu ý.** Mã màn ở đây là **tạm**. Mã chính thức do `ba-screens` cấp sau khi nghiệp vụ đã chốt — đừng dẫn chiếu tài liệu vào mã tạm.

**Khác skill gần kề.** `ba-process` mô tả quy trình của **tổ chức** (ai làm gì, thủ công hay máy); `ba-persona` đi theo **cảm xúc** của một chân dung người dùng; `ba-flow` đi theo **màn hình**; `ba-screens` mới là bản chính thức.


## ba-feasible — Tài liệu này viết ra phần mềm được chưa?

**Làm gì.** Đọc lại toàn bộ tài liệu bằng con mắt của người sắp ngồi xuống code, rồi chỉ ra những chỗ **đọc thì xuôi mà làm thì không làm được**. Ba ví dụ có thật:

- Một quy tắc ghi *"sai quá ba lần khoá tạm liên tiếp thì khoá vĩnh viễn"* — nghe rất rõ ràng. Nhưng mô hình dữ liệu không có chỗ nào ghi *"đây là lần khoá thứ mấy"*. Quy tắc đó không lưu được, nên cũng không làm được, và cũng không ai kiểm được.
- Tài liệu kiến trúc có mục "cấu trúc thư mục chuẩn", nhưng chỉ vẽ phần máy chủ. Phần giao diện thì không nói gì, dù đã chốt dùng React. Mỗi người làm một màn sẽ tự đặt chỗ để file, và cuối cùng dự án có vài kiểu sắp xếp khác nhau.
- Bản thiết kế có câu thông báo *"Đổi mật khẩu sẽ đăng xuất bạn khỏi mọi thiết bị khác."* — nhưng không tài liệu nào nói hệ thống thật sự làm việc đó. Câu chữ đó không phải câu chữ: nó là một yêu cầu chưa ai viết ra.

**Khi nào dùng.** Ngay sau khi `ba-review` báo tài liệu đã đủ, và **trước** khi `ba-build` sinh kế hoạch triển khai. Đây là chỗ rẻ nhất để phát hiện: sửa một dòng trong tài liệu lúc này tốn vài phút, còn phát hiện lúc đang code thì phải dừng lại, mở yêu cầu thay đổi, và chờ.

**Khác skill gần kề.** `ba-review` hỏi *"có thiếu tài liệu nào không"*. `ba-conformance` hỏi *"code đã viết có đúng tài liệu không"* — nhưng phải có code rồi mới hỏi được. `ba-feasible` nằm giữa hai câu đó, và hỏi câu mà không ai hỏi: *"chưa có code, vậy tài liệu này đủ để viết ra code chưa?"*

## Xem thêm
- `01-pipeline-core.md` — các skill mô hình hóa giải pháp mà nhóm này bổ trợ đầu/cuối.
- `README.md` — index + bảng chọn theo tình huống.
