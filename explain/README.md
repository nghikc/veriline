---
type: skill-explainer-index
updated: 2026-07-15
---

# Giải thích bộ BA Toolkit — dành cho người dùng nghiệp vụ

> Tài liệu này viết cho **BA (Business Analyst) và người dùng không rành kỹ thuật**. Mục tiêu: đọc xong hiểu **mỗi skill làm gì, khi nào nên dùng, khi nào KHÔNG**, và **chọn skill nào cho tình huống của mình** — mà không cần biết bên trong nó chạy ra sao.

> ⚗️ **Thử nghiệm** = skill chưa từng chạy trên một dự án thật (`ac-jury`, `ba-atlassian`, `ba-threat-model`, `ba-migration`). Khi cài toolkit vào dự án, chúng **không được cài mặc định** — cần thêm `--with-experimental`. Dùng được, nhưng chưa có bằng chứng chúng bắt được lỗi thật; skill khác chỉ gợi chúng khi đã cài.

## 1. Bộ công cụ này là gì?

BA Toolkit là một tập hợp **skill (lệnh `/...`)** chạy trong Claude Code, biến một **ý tưởng phần mềm thô** thành **bộ tài liệu phân tích nghiệp vụ đầy đủ (tiếng Việt)** rồi tới **kế hoạch build** và cuối cùng là **code thật**. Mọi tài liệu sinh ra nằm trong thư mục `docs/` của dự án.

Hãy hình dung nó như một **dây chuyền**: mỗi skill là một trạm, nhận đầu ra của trạm trước làm đầu vào, thêm một lớp chi tiết, rồi chuyển tiếp. Bạn không cần chạy hết mọi trạm mỗi lần — có những **lệnh điều phối (orchestrator)** chạy cả một đoạn dây chuyền trong một lần gõ, và có những **lệnh tiện ích** để rà soát, xuất bản, hay cài đặt.

Toàn bộ skill chia làm **sáu nhóm**. Mỗi nhóm có một file giải thích riêng (đọc để hiểu sâu từng skill trong nhóm):

| Nhóm | File | Nội dung |
|---|---|---|
| Luồng chính (pipeline) | `01-pipeline-core.md` | 8 skill làm nên dây chuyền chính: từ ý tưởng → yêu cầu → chức năng → màn hình → đặc tả → kiểm thử → giao diện → kế hoạch build |
| Tài liệu cấp hệ thống | `02-tai-lieu-he-thong.md` | 11 skill tùy chọn cho tài liệu "cấp tổng": bên liên quan, mô hình dữ liệu, API, design system, **kiến trúc kỹ thuật**, **mô hình đe doạ**, **lộ trình tách hệ cũ**, **kiến trúc tích hợp (nhiều hệ)**, **API đối tác ngoài**, đẩy màn đã chốt lên Figma, DB schema |
| Lệnh điều phối (orchestrator) | `03-orchestrator.md` | 8 skill chạy cả một chuỗi trong một lệnh, có "chốt chặn" dò lỗ hổng giữa các bước — gồm 4 orchestrator khép vòng đời: `ba-discover`→`ba-init`→`dev-run`→**`ba-accept`**, và `ba-batch` đặc tả nhiều màn song song |
| Tiện ích | `04-tien-ich.md` | 15 skill hỗ trợ: **một cửa `ba-next` (đang ở đâu, chạy gì tiếp)**, dò gap, ma trận truy vết (per-màn + RTM), xuất cổng đọc, xuất bản online, cài toolkit (dòng lệnh `ba-export` hoặc **màn hình `ba-launcher`**), **trang luồng màn cho người dùng cuối (`ba-sitemap`)**, **prototype bấm-được (`ba-prototype`)**, tra cứu, vẽ sơ đồ, biên bản họp, sổ work item |
| Bộ dev | `05-dev.md` | 11 skill kỷ luật lập trình/QA để biến kế hoạch thành code thật |
| Phân tích & kế hoạch | `06-phan-tich-va-ke-hoach.md` | 8 skill "linh hồn BA": Vision/Business Case, phân tích quy trình AS-IS/TO-BE, chân dung người dùng, **URD — nhu cầu người dùng**, ưu tiên & lộ trình, kế hoạch nghiệm thu UAT, gói phát hành theo phase, **cẩm nang vận hành cho người dùng** |

---


### Dự án nhỏ thì không phải làm hết — khai "hồ sơ dự án"

Mặc định toolkit chạy **đầy đủ**: mỗi màn 9 tài liệu, cộng sổ sách và các vòng review. Dự án 5–10 màn, một hai người thì **không cần** vậy. Viết **một dòng** ở đầu `docs/00-tracking.md` là cả bộ tự nhẹ theo:

| Khai | Nghĩa là | File mỗi màn |
|---|---|---|
| *(không khai)* | `full` — đầy đủ, mặc định | 9 |
| `> Hồ sơ dự án: \`lite\`` | bỏ sổ Work Item, nhật ký thay đổi, đối chiếu code, review agent | 9 |
| `> Hồ sơ dự án: \`mini\`` | như `lite`, **và** rút còn 5 tài liệu mỗi màn | **5** |

`mini` **không làm sơ sài đi**: use case, tiêu chí nghiệm thu và mô tả giao diện vẫn phải viết — chúng thành các mục **bên trong `srs.md`** thay vì đứng thành file riêng. Thứ thật sự bị bỏ chỉ là `brainstorm.md` (ghi chép quá trình). Chuỗi truy vết, ma trận lỗi và độ phủ test **giữ nguyên ở cả ba mức** — đó mới là phần bảo đảm chất lượng.

Đổi ý giữa chừng cứ sửa lại dòng đó; hạ mức **không xoá** tài liệu đã viết, chỉ thôi đòi thêm.

## 2. Mỗi skill làm gì — một dòng

### Nhóm luồng chính — `01-pipeline-core.md`

| Skill | Làm gì (một dòng) |
|---|---|
| `ba-brainstorm` | Phỏng vấn sâu để làm rõ một ý tưởng/tính năng còn mơ hồ, trước khi viết yêu cầu |
| `ba-requirements` | Biến ý tưởng thô thành bản yêu cầu có cấu trúc (BR/StR/FR/NFR + ưu tiên) |
| `ba-functions` | Liệt kê các chức năng chính của phần mềm theo module |
| `ba-screens` | Suy ra danh sách màn hình, sơ đồ điều hướng và khung thư mục tài liệu |
| `ba-screen-spec` | Đặc tả chi tiết một màn hình (wireframe, SRS, use case, user story, UI brief) |
| `ba-checklist` | *(khuyến nghị)* Checklist kiểm thử high-level cho một màn (mã `CL-S..`), khung cho `ba-test` |
| `ba-test` | Viết tài liệu kiểm thử cho một màn hình theo từng chức năng |
| `ba-html-design` | Dựng bản thiết kế HTML trực quan cho một màn hình |
| `ba-build` | Lập kế hoạch triển khai code (`plan.md`) cho từng màn hình |
| `ba-test-e2e` | *(tùy chọn)* Sinh script Playwright `e2e/tests/<Mã>-<Tên>.spec.ts` (gốc dự án) từ `test.md` — mỗi TC giữ nguyên mã truy vết |

### Nhóm tài liệu cấp hệ thống — `02-tai-lieu-he-thong.md`

| Skill | Làm gì (một dòng) |
|---|---|
| `ba-stakeholder` | Phân tích các bên liên quan: danh bạ, ma trận Quyền lực/Quan tâm, RACI |
| `ba-data-model` | Thiết kế mô hình dữ liệu: ERD, từ điển dữ liệu, quan hệ |
| `ba-api-spec` | Đặc tả API: danh sách endpoint, request/response, mã trạng thái |
| `ba-design-system` | Lập bộ style chuẩn: token màu/typography/spacing, component, layout |
| `ba-architecture` | Chốt kiến trúc kỹ thuật: stack, phân tầng, C4, cross-cutting, ADR (bước có gate + cổng chốt, trước build) |
| `ba-threat-model` ⚗️ *thử nghiệm* | Mô hình đe doạ bám `10-architecture`: ranh giới tin cậy, tài sản, kẻ tấn công theo vai, đường lạm dụng `TM-..` có biện pháp trace NFR/ADR |
| `ba-migration` ⚗️ *thử nghiệm* | Lộ trình tách/đổi codebase cũ: bản đồ domain từ code, ghép nối mạnh·xa·hay đổi, bước `MG-..` đo được + quay lui, cửa một chiều → ADR |
| `ba-integration` | Kiến trúc tích hợp khi nối **nhiều hệ thống**: landscape, hợp đồng tích hợp, MDM, luồng xuyên hệ |
| `ba-api-integration` | Tiêu thụ API **đối tác ngoài**: build-vs-buy, digest doc đối tác, mapping field 3 tầng, readiness |

### Nhóm điều phối — `03-orchestrator.md`

| Skill | Làm gì (một dòng) |
|---|---|
| `ba-discover` | Giai đoạn khám phá TRƯỚC ba-init: vision → bên liên quan → phỏng vấn → quy trình hiện trạng |
| `ba-init` | Chạy trọn pipeline cho dự án mới (yêu cầu → ... → kế hoạch build) trong một lệnh |
| `ba-accept` | Giai đoạn 4 sau dev: nghiệm thu (UAT) → đóng gói phát hành → RTM → xuất bản → ký (khép vòng đời) |
| `ba-add-screen` | Thêm một màn hình mới vào dự án đã có tài liệu |
| `ba-batch` | Đặc tả **nhiều màn song song** (mỗi màn một subagent) — nhanh hơn tuần tự nhiều lần |
| `ba-add-feature` | Thêm một chức năng mới (có thể trải nhiều màn) vào dự án đã có |
| `ba-change-request` | Quản trị trọn vòng đời một yêu cầu thay đổi (CR): mở sổ → phân tích ảnh hưởng → duyệt → đồng bộ tài liệu → đóng |
| `ba-reverse` | Chiều ngược: sinh tài liệu BA từ một codebase có sẵn |

### Nhóm tiện ích — `04-tien-ich.md`

| Skill | Làm gì (một dòng) |
|---|---|
| `ba-next` | **Một cửa:** quét `docs/` → cho biết đang ở bước nào + đề xuất và chạy bước kế tiếp |
| `ba-review` | Dò lỗ hổng độ phủ & truy vết trong tài liệu → báo cáo gap |
| `ba-track` | Dựng lại / đồng bộ ma trận truy vết `00-tracking.md` (per-màn: file nào có) |
| `ba-trace` | Xuất RTM đầy đủ `BR→…→TC` → `00-traceability.md` + soát độ phủ end-to-end |
| `ba-changelog` | Nhật ký thay đổi tài liệu **đã chốt** → `00-changelog.md`: đổi gì, tác động nghiệp vụ, có cần CR không |
| `ba-conformance` | Đối chiếu **code thật ↔ tài liệu** → `00-conformance.md`: chỗ nào lệch, chưa làm, hay đã dev mà không có tài liệu |
| `ba-portal` | Xuất toàn bộ `docs/` thành một cổng HTML đọc offline |
| `ba-doc-public` | Đẩy một file HTML lên Vercel (online) vào project "tài liệu chung" |
| `ba-export` | Cài bộ BA Toolkit sang một dự án khác (dòng lệnh) |
| `ba-launcher` | **Màn hình**: duyệt nội dung mọi skill + nút chọn thư mục để cài toolkit vào dự án |
| `ba-sitemap` | Trang **cho người dùng cuối**: gom wireframe ASCII mọi màn + sơ đồ điều hướng + hành trình chính → `sitemap.html` |
| `ba-prototype` | **Prototype bấm-được**: scaffold Vite+React ghép html-design mọi màn + nối chức năng theo flow (`prototype/`, dùng lại được) |
| `ba-toolkit` | Index/tra cứu: nhắc pipeline và skill nào chạy tiếp theo |
| `ba-diagram` | Vẽ một sơ đồ Mermaid từ mô tả — tự chọn đúng loại, tô màu, soát coverage |
| `ba-reverse-doc` | Dựng tài liệu BA từ **tài liệu rời rạc** (Word/PDF/ảnh/email) — chiều ngược từ tài liệu |
| `ba-meet` | Biến ghi chú họp thô thành **biên bản họp** (MoM): tách quyết định (DEC) + action item (ACT) |
| `ba-task` | Sổ **Work Item** (WI): theo dõi việc dev không phải CR — tính năng mới/tech/bug/spike |

### Nhóm dev — `05-dev.md`

| Skill | Làm gì (một dòng) |
|---|---|
| `dev-run` | Điều phối khâu dev: biến `plan.md` thành code thật (bước 8 của pipeline) |
| 10 skill `dev-*` còn lại | Bộ kỷ luật lập trình/QA (viết plan, TDD, debug, review, verify...) mà `dev-run` sử dụng |

### Nhóm phân tích & kế hoạch — `06-phan-tich-va-ke-hoach.md`

| Skill | Làm gì (một dòng) |
|---|---|
| `ba-vision` | Vision & Scope / Business Case: vấn đề, mục tiêu SMART, phạm vi, phương án, KPI |
| `ba-process` | Phân tích quy trình AS-IS → TO-BE → Gap → rút yêu cầu phát sinh |
| `ba-persona` | Chân dung người dùng (personas) + bản đồ hành trình theo cảm xúc |
| `ba-urd` | Tài liệu Yêu cầu Người dùng (URD) solution-free: nhu cầu `UN`, hành trình ưu tiên, tiêu chí `USC` |
| `ba-roadmap` | Ưu tiên (MoSCoW + RICE + Kano) + lộ trình phát hành Now/Next/Later |
| `ba-uat` | Kế hoạch nghiệm thu người dùng (UAT) cấp dự án + ma trận truy vết yêu cầu → UAT |
| `ba-release` | Gói phát hành theo phase = roadmap(phase) + nghiệm thu UAT(phase) → HTML |
| `ba-userguide` | Cẩm nang sử dụng/vận hành từ tài liệu BA (Diátaxis + ảnh app thật có callout) |
| `ba-userguide-video` | Clip hướng dẫn từ trang how-to đã duyệt — quay app thật từng bước, giọng đọc TTS, phụ đề khớp lời |
| `ba-new-skill` | cần tạo một skill MỚI cho chính bộ BA toolkit này |
| `ba-dashboard` | PM/Project Lead cần một BÁO CÁO ĐIỀU HÀNH một trang về tình trạng dự án |
| `ba-figma-draw` | Đẩy màn **đã chốt** (bố cục wireframe đã chọn, bản html đã duyệt) lên Figma cho designer/khách xem; máy theo dõi bản Figma còn khớp không, ai sửa trên Figma thì kéo về. Dự án chưa có html thì vẫn vẽ được bản xem trước như cũ |
| `ba-remove` | cần CẮT BỚT phạm vi đã có |
| `ba-proto-first` | muốn CHỐT NGHIỆP VỤ BẰNG PROTOTYPE BẤM ĐƯỢC trước rồi mới viết đặc tả |
| `ba-flow` | cần LUỒNG NGHIỆP VỤ + DANH SÁCH MÀN SƠ BỘ ngay từ ý tưởng thô, TRƯỚC khi có 01-requirements/02-functions |
| `ba-proto-html` | cần một PROTOTYPE BẤM ĐƯỢC trong MỘT file HTML tự chứa để demo và CHỐT NGHIỆP VỤ với khách TRƯỚC khi viết đặc tả |
| `ba-api-test` | Kiểm thử API: liệt kê kịch bản `ACL-..` để duyệt, rồi sinh tệp `.http` bắn được |
| `ba-api-test` | cần biến checklist kiểm thử API thành FILE CHẠY ĐƯỢC |
| `ba-dbschema` | cần chuyển MÔ HÌNH DỮ LIỆU NGHIỆP VỤ thành SCHEMA VẬT LÝ cho dev |
| `ba-wireframe-lofi` | cần bản WIREFRAME HTML LO-FI (đen trắng, khối xám, chưa bàn màu sắc/thương hiệu) để chốt BỐ CỤC màn hình |
| `ba-feasible` | tài liệu BA đã đủ theo ba-review nhưng CHƯA chắc viết code ra được |
| `ba-index` | cần TRA CỨU tài liệu BA mà không muốn đọc cả file |
| `ba-figure` | cần một sơ đồ Mermaid thành HÌNH ĐEM ĐI DÙNG |
| `ba-auto` | muốn chạy trọn chuỗi từ codebase có sẵn ra MVP trong một trigger |
| `ba-onepager` | cần MỘT tài liệu văn liền mạch về cả dự án, gói trong một trang HTML tự chứa để gửi cho lãnh đạo/khách/đối tác |
| `ac-agent` | cần TẠO hoặc SỬA một agent (subagent) trong `.claude/agents/` của bộ toolkit |
| `ac-verify` | một màn đã dev xong mọi task của plan.md và cần CHỨNG MINH độc lập trước khi đánh dev = ✅ |
| `ac-team` | plan.md của một màn có nhiều task (>8) và muốn một ĐỘI agent dev thay vì một agent |
| `ac-judge` | diff của một màn (hoặc khoảng `<base>..HEAD`, PR qua gh) cần REVIEW như senior engineer khắt khe |
| `ac-eval` | cần CHẤM ĐIỂM mức code hoàn thành đặc tả của một màn hoặc cả dự án |
| `ac-memory` | đội agent dev cần TRÍ NHỚ ngoài hội thoại |
| `ac-jury` ⚗️ *thử nghiệm* | một quyết định cần NHIỀU góc nhìn trước khi chốt |
| `ac-po` | muốn đội agent TỰ CHẠY một phase: PO chọn việc, giao đội, nhận bằng bằng chứng, dừng ở chỗ thuộc quyền người |
| `ac-audit-web` | soát giao diện người dùng thấy theo WCAG 2.1 AA · UX · Core Web Vitals, ra `AU-nn` có `file:line` |
| `ac-ci` | PR đã mở mà CI đỏ: cắt log, đoán loại, lô sửa cho `ac-builder`, canh tới xanh |
| `ba-atlassian` ⚗️ *thử nghiệm* | sổ WI/CR ↔ Jira (push khoá, pull trạng thái) và đẩy `.md` lên Confluence qua Atlassian MCP |

---

## 3. Chọn skill nào theo tình huống?

> Đây là **bàn chỉ đường** nhanh. Mô tả tình huống của bạn, tìm hàng gần nhất, rồi đọc file nhóm tương ứng để hiểu sâu.

| Tình huống bạn đang gặp | Nên dùng | File nhóm |
|---|---|---|
| **Không nhớ dự án đang ở bước nào / chạy gì tiếp** | `ba-next` | `04-tien-ich.md` |
| Còn nhiều màn (≥3) chưa đặc tả, muốn làm cùng lúc | `ba-batch` | `03-orchestrator.md` |
| Khởi động dự án đúng bài — hiểu vấn đề & hiện trạng trước | `ba-discover` | `03-orchestrator.md` |
| Có một ý tưởng phần mềm mới, muốn làm từ đầu tới cuối | `ba-init` | `03-orchestrator.md` |
| Muốn làm rõ *vì sao làm dự án & đáng làm không* (business case) | `ba-vision` | `06-phan-tich-va-ke-hoach.md` |
| Số hóa một quy trình đang chạy tay (cần phân tích hiện trạng) | `ba-process` | `06-phan-tich-va-ke-hoach.md` |
| Cần chốt *người dùng CẦN GÌ* (không phải hệ thống làm gì) trước khi viết yêu cầu | `ba-urd` | `06-phan-tich-va-ke-hoach.md` |
| Nhiều chức năng, cần quyết *làm cái nào trước* + chia release | `ba-roadmap` | `06-phan-tich-va-ke-hoach.md` |
| Chuẩn bị nghiệm thu / ký bàn giao cho khách | `ba-uat` | `06-phan-tich-va-ke-hoach.md` |
| Xuất gói phát hành một phase (kế hoạch + nghiệm thu) ra HTML/URL | `ba-release` | `06-phan-tich-va-ke-hoach.md` |
| Viết cẩm nang sử dụng cho admin/CSKH/người dùng cuối | `ba-userguide` | `06-phan-tich-va-ke-hoach.md` |
| Làm clip hướng dẫn có giọng đọc từ cẩm nang | `ba-userguide-video` | `06-phan-tich-va-ke-hoach.md` |
| Cần vẽ một sơ đồ mà không biết chọn loại nào | `ba-diagram` | `04-tien-ich.md` |
| Ý tưởng/tính năng còn mơ hồ, muốn làm rõ trước khi viết yêu cầu | `ba-brainstorm` | `01-pipeline-core.md` |
| Muốn viết bản yêu cầu có cấu trúc từ ý tưởng | `ba-requirements` | `01-pipeline-core.md` |
| Đã có yêu cầu, muốn liệt kê chức năng | `ba-functions` | `01-pipeline-core.md` |
| Đã có chức năng, muốn suy ra danh sách màn hình + điều hướng | `ba-screens` | `01-pipeline-core.md` |
| Muốn đặc tả chi tiết MỘT màn hình | `ba-screen-spec` | `01-pipeline-core.md` |
| Muốn checklist kiểm thử high-level (rà độ phủ) cho một màn | `ba-checklist` | `01-pipeline-core.md` |
| Muốn viết kiểm thử cho một màn | `ba-test` | `01-pipeline-core.md` |
| Muốn có bản HTML trực quan cho một màn | `ba-html-design` | `01-pipeline-core.md` |
| Muốn đưa màn đã chốt lên Figma (và giữ Figma khớp với tài liệu) | `ba-figma-draw` | `02-tai-lieu-he-thong.md` |
| Muốn lập kế hoạch code cho các màn | `ba-build` | `01-pipeline-core.md` |
| Muốn viết code thật từ kế hoạch | `dev-run` | `05-dev.md` |
| Dev xong một phase, cần **nghiệm thu & phát hành** | `ba-accept` | `03-orchestrator.md` |
| Thêm MỘT màn hình vào dự án đã có | `ba-add-screen` | `03-orchestrator.md` |
| Thêm MỘT chức năng (nhiều màn) vào dự án đã có | `ba-add-feature` | `03-orchestrator.md` |
| Có yêu cầu thay đổi một chức năng/màn đã có | `ba-change-request` | `03-orchestrator.md` |
| Đã có code sẵn, muốn sinh tài liệu ngược | `ba-reverse` | `03-orchestrator.md` |
| Kickoff dự án, muốn nắm các bên liên quan trước | `ba-stakeholder` | `02-tai-lieu-he-thong.md` |
| Cần mô hình dữ liệu / ERD | `ba-data-model` | `02-tai-lieu-he-thong.md` |
| Cần đặc tả API cho dev | `ba-api-spec` | `02-tai-lieu-he-thong.md` |
| Muốn bộ style chuẩn cho toàn dự án | `ba-design-system` | `02-tai-lieu-he-thong.md` |
| **Chốt kiến trúc kỹ thuật** (stack/phân tầng/C4/ADR) trước khi code | `ba-architecture` | `02-tai-lieu-he-thong.md` |
| Phần mềm **tích hợp nhiều hệ thống** (ERP/CRM/payment…) | `ba-integration` | `02-tai-lieu-he-thong.md` |
| Muốn kiểm tra tài liệu còn thiếu chỗ nào | `ba-review` | `04-tien-ich.md` |
| Vừa sửa gì đó, muốn ma trận truy vết cập nhật đúng | `ba-track` | `04-tien-ich.md` |
| Muốn RTM đầy đủ / soát yêu cầu mồ côi, màn thiếu test | `ba-trace` | `04-tien-ich.md` |
| Tài liệu đã chốt bị ai đó sửa, muốn biết đổi gì & có cần CR không | `ba-changelog` | `04-tien-ich.md` |
| Dev xong rồi, muốn biết code có đúng tài liệu không / thiếu gì / thừa gì | `ba-conformance` | `04-tien-ich.md` |
| Muốn gom tài liệu thành trang đọc được (offline) | `ba-portal` | `04-tien-ich.md` |
| Muốn chia sẻ tài liệu qua link online | `ba-doc-public` | `04-tien-ich.md` |
| Muốn dùng bộ toolkit này ở một dự án khác | `ba-export` | `04-tien-ich.md` |
| Muốn XEM toolkit có gì / cài bằng cách bấm nút, không gõ lệnh | `ba-launcher` | `04-tien-ich.md` |
| Muốn cho **người dùng cuối** xem toàn cảnh luồng màn hình (wireframe + điều hướng + hành trình) | `ba-sitemap` | `04-tien-ich.md` |
| Muốn **prototype bấm-được** (click qua các màn theo flow) / seed frontend để dev tiếp | `ba-prototype` | `04-tien-ich.md` |
| Không nhớ bước nào chạy tiếp theo | `ba-toolkit` | `04-tien-ich.md` |

---

## 4. Trình tự chạy chuẩn (để dễ hình dung)

```
Ý tưởng thô
   │  ba-brainstorm   (tùy chọn, khuyến nghị)
   ▼
00-brainstorm.md
   │  ba-requirements → 01-requirements.md
   │  ba-functions    → 02-functions.md
   │  ba-screens      → 03-overview.md + khung folder + 00-tracking.md
   ▼
   ┌───────────────────────────── lặp cho từng màn hình ─────────────────────────────┐
   │ ba-screen-spec → [ba-checklist] → ba-test → [ba-wireframe-lofi] → [Figma lo-fi] │
   │ → ba-html-design → duyệt → [ba-figma-draw push] ◀─ [pull] sửa trên Figma        │
   └─────────────────────────────────────────────────────────────────────────────────┘
   │  [ba-architecture] → 10-architecture.md  (chốt kiến trúc: gate + cổng chốt)
   │  [ba-integration]  → 11-integration.md   (nếu tích hợp nhiều hệ)
   │  ba-build   → plan.md (mỗi màn, bám kiến trúc đã chốt)
   ▼
   dev-run  → CODE thật
   │  ba-accept → nghiệm thu (UAT) → phát hành → RTM → xuất bản → ký
   ▼
   Khép vòng đời
```

Tài liệu cấp hệ thống (`ba-stakeholder`, `ba-data-model`, `ba-api-spec`, `ba-design-system`, `ba-architecture`, `ba-integration`) chạy **khi cần**, không bắt buộc theo thứ tự — riêng `ba-architecture`/`ba-integration` là **bước có gate + cổng chốt** (build/dev chỉ bám bản đã chốt). Các tiện ích (`ba-review`, `ba-track`, `ba-portal`...) chạy xen kẽ bất cứ lúc nào.

> Một câu để nhớ: **skill nguyên tử** làm một việc; **orchestrator** ghép nhiều việc lại (4 cái khép vòng đời discover→init→dev-run→accept); **tiện ích** giữ cho tài liệu sạch và chia sẻ được; **dev** biến kế hoạch thành code.
