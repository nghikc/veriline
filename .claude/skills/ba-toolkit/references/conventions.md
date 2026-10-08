# Quy ước chung — BA Toolkit

## Bản đồ file — đọc mục nào, khi nào
**File này là lõi: ghi gì · ở đâu · tên gì · mã gì.** Đa số skill đọc đúng nó là đủ. Bốn cụm luật nặng và chuyên biệt nằm ở phụ lục **cùng thư mục** — chỉ mở khi việc đang làm cần tới:

| Cần gì | Đọc ở đâu |
|---|---|
| Ghi file ở đâu · đặt tên folder · mã ID + chuỗi truy vết · tracking · thuật ngữ · văn phong · animation · **xác nhận giả định** | **file này** (mục dưới) |
| **Cổng** (phương án · gate/mức gap · chốt kiến trúc) · review agent · ngưỡng màn phức tạp · hồ sơ `full`/`lite` | **`conv-gates.md`** |
| Vẽ sơ đồ: chọn loại · an toàn cú pháp · tô màu · kiểm coverage | **`conv-mermaid.md`** |
| Sổ CR · sổ Work Item · nhật ký thay đổi · đối chiếu code ↔ tài liệu | **`conv-ledgers.md`** |
| Canon máy-đọc cho `lint.js` (khối ` ```registry `) | **`conv-registry.md`** |

Phụ lục vẫn là **cùng một nguồn sự thật** — tách để giảm chi phí nạp, không phải để hạ cấp. Tham chiếu dạng `conventions.md` → "<Tên mục>" vẫn đúng: mục đó còn nguyên ở đây dưới dạng một dòng trỏ sang file chứa nội dung.

**Skill nên khai mình cần gì** ngay ở bước đọc: *"Đọc `conventions.md`"* (mặc định) hoặc *"Đọc `conventions.md` + `conv-gates.md`"* (skill có cổng). Đọc thừa không sai, nhưng skill nào cũng nạp mọi thứ thì luật thành trang trí — đúng nghịch lý mà chính toolkit này cảnh báo.

## Cấu trúc thư mục `docs/`
Gốc `docs/` chỉ giữ **đặc tả sản phẩm + công cụ điều hành**; mọi thứ còn lại nằm trong container `Ho-so/` (xem mục kế). Cây dưới là **hiện trạng chuẩn cho dự án mới**:

```
docs/
├── 01-requirements.md         # bản yêu cầu tổng
├── 02-functions.md            # danh sách chức năng
├── 03-overview.md             # tổng quan màn hình + điều hướng
├── 05-data-model.md           # mô hình dữ liệu/ERD (tùy chọn, ba-data-model)
├── 06-api-spec.md             # đặc tả API (tùy chọn, ba-api-spec)
├── 07-design-system.md        # design system / token (tùy chọn, ba-design-system) — nguồn style cho skill Figma & ba-html-design
├── 10-architecture.md         # kiến trúc kỹ thuật: stack/phân tầng/ADR (tùy chọn, ba-architecture); trước build
├── 11-integration.md          # kiến trúc tích hợp: landscape/hợp đồng/MDM (tùy chọn, ba-integration); khi nhiều hệ
├── 12-api-integration.md      # đánh giá & mapping API đối tác ngoài (tùy chọn, ba-api-spec partner)
├── 00-tracking.md             # ma trận điều hành — script đọc liên tục, nên ở gốc
├── 00-cr.md                   # SỔ change request (ba-change-request) — không xoá dòng
├── 00-backlog.md              # SỔ work item (ba-task) — không xoá dòng
├── 00-changelog.md            # SỔ nhật ký thay đổi tài liệu đã chốt (ba-changelog) — không xoá dòng
├── urd/<feature>.md           # URD theo từng feature (tùy chọn, ba-discover urd <feature>) — cùng khuôn 10 mục với 00-urd.md; KHÔNG vào portal mặc định
├── Screen-spec/               # CONTAINER gom mọi folder màn (giữ gốc docs/ gọn khi số nhóm màn tăng); TRONG SUỐT với truy vết
│   └── [<Nhóm>/]<Mã> - <MànHình>/   # 9 file BA + checklist mỗi màn (folder màn = "S01 - Login")
│       ├── ascii-screen.md
│       ├── brainstorm.md
│       ├── srs.md
│       ├── usecase.md
│       ├── userstory.md
│       ├── design-spec.md     # UI brief cho Designer (states/CTA/microcopy/a11y); có thể chứa mục "## Bản Figma (preview)"
│       ├── html-design.html
│       ├── checklist.md       # checklist kiểm thử high-level (tùy chọn/khuyến nghị, ba-test checklist) — mã CL-S..; KHÔNG tính vào 9/9
│       ├── test.md
│       └── plan.md
└── Ho-so/                     # CONTAINER tài liệu KHÔNG thuộc đặc tả chính; TRONG SUỐT với truy vết
    ├── 00-brainstorm.md       # phỏng vấn sâu IT-BA (ba-discover brainstorm) — đầu vào cho yêu cầu
    ├── 00-flows.md           # luồng nghiệp vụ + màn SƠ BỘ (ba-proto-first flow) — trước khi có 01/02/03
    ├── prototype.html        # bản bấm thử một-file để chốt nghiệp vụ (ba-proto-first html); KHÔNG vào portal — mở trực tiếp, gửi thẳng cho khách
    ├── 00-intake.md           # kiểm kê tài liệu nguồn rời + trích dẫn (tùy chọn, ba-reverse-doc)
    ├── 00-personas.md         # personas + user-journey (tùy chọn, ba-discover persona)
    ├── 00-urd.md              # Yêu cầu Người dùng cấp dự án (tùy chọn, ba-discover urd) — nhu cầu UN + tiêu chí USC
    ├── 00-vision.md           # Vision & Scope / Business Case (tùy chọn, ba-discover vision)
    ├── 00-process.md          # quy trình AS-IS/TO-BE + Gap (tùy chọn, ba-discover process) — chạy sớm
    ├── 00-glossary.md         # từ điển thuật ngữ toàn dự án (ba-requirements seed, skill sau bổ sung)
    ├── 00-gaps.md             # báo cáo gap (ba-review) — xem "Ghi 00-gaps.md" ở mục Quy ước gate
    ├── 00-traceability.md     # RTM đầy đủ (ba-trace) — ghi đè mỗi lần chạy
    ├── 00-conformance.md      # đối chiếu code ↔ tài liệu (ba-conformance) — ghi đè mỗi lần chạy
    ├── 00-introduction.md     # Introduction gộp cho portal khách (ba-portal --client)
    ├── 00-onepager.md         # cả hồ sơ gộp thành MỘT bài văn liền mạch (ba-onepager)
    ├── 00-onepager.html       # bản render tự chứa của file trên
    ├── 00-dashboard.md        # báo cáo điều hành một trang (ba-dashboard) — ảnh chụp, ghi đè
    ├── 04-stakeholders.md     # phân tích bên liên quan (tùy chọn, ba-discover stakeholder)
    ├── 08-roadmap.md          # ưu tiên + lộ trình phát hành (tùy chọn, ba-discover roadmap) — tài liệu sống
    ├── 09-uat.md              # kế hoạch nghiệm thu/UAT cấp dự án (tùy chọn, ba-accept uat)
    ├── meetings/<ngày>-<chủ-đề>.md  # biên bản họp MoM (tùy chọn, ba-discover meet); KHÔNG vào portal — feed 00-cr khi là thay đổi
    ├── releases/<phase>.md    # gói phát hành theo phase (tùy chọn, ba-accept release); render lẻ, KHÔNG vào portal
    ├── wireframe.html        # wireframe lo-fi đen trắng gom mọi màn (tùy chọn, ba-html-design lofi); KHÔNG vào portal
    ├── 00-figma-sync.md      # SỔ đối soát Figma (ba-figma-draw push/pull, `figma-sync.js`) — một dòng = màn × nấc lofi|hifi; không xoá dòng
    ├── dbschema/             # schema vật lý DBML sinh từ 05-data-model (tùy chọn, `ba-data-model dbml`)
    ├── api-test/             # kiểm thử API (tùy chọn): checklist.md + api.http (đều do ba-api-test sinh)
    ├── notes/                # sổ codebase của đội dev: INDEX.md + ghi chú luồng/pattern/gotcha (ac-memory); KHÔNG vào portal
    ├── 00-lessons.md          # sổ bài học LS candidate → confirmed (ac-memory lessons); chỉ confirmed vào brief worker
    ├── reviews/<Mã>-<ngày>.md # review diff có cổng máy (ac-judge); KHÔNG vào portal
    ├── eval/<Mã>-<ngày>.md    # bản chấm điểm đặc tả theo TC/AC (ac-eval); all-<ngày>.md cho cả dự án
    ├── jury/<mã>-<ngày>.md    # phiên hội đồng bỏ phiếu mù cho ADR/PD (ac-jury); người chốt
    ├── 00-threat-model.md     # mô hình đe doạ bám tài liệu: ranh giới × tài sản × kẻ tấn công → TM-.. (ba-threat-model); sau cổng chốt kiến trúc
    ├── 00-migration.md        # lộ trình tách/đổi codebase cũ: MG-.. có tiêu chí đo được + quay lui (ba-migration); sau ba-reverse
    ├── audit/<Mã|app>-<ngày>.md # audit giao diện WCAG/UX/CWV, AU-nn có file:line (ac-audit-web); bằng chứng NFR + TC Manual
    ├── userguide/             # cẩm nang vận hành (tùy chọn, ba-accept userguide, GĐ4); KHÔNG vào portal — đối tượng đọc riêng
    ├── sitemap.md · sitemap-flows.md · sitemap.html   # luồng màn cho người dùng cuối (ba-portal sitemap); KHÔNG vào portal
    ├── portal.html            # cổng đọc tài liệu (ba-portal)
    ├── dev-notes.md           # ghi chú kỹ thuật của dev-run — không đánh số, không vào portal
    └── removed/<Mã> - <Tên>/  # màn ĐÃ CẮT khỏi phạm vi (ba-remove) — giữ nguyên file kèm dòng CR;
                               # KHÔNG vào portal, KHÔNG bị refresh/trace/sitemap quét (đã kiểm)
```

> Cây này là **canon** cho vị trí file: `lint.js` đối chiếu nó với khóa `hoso.docs` của registry, nên đừng sửa một bên mà quên bên kia. Dự án cài **trước 13/08/2026** để mọi thứ phẳng ở gốc `docs/` — vẫn hợp lệ, xem "Tương thích ngược" ở mục kế.

### Script E2E để ở đâu (từ 31/08/2026)

`e2e.spec.ts` là **code chạy được**, không phải tài liệu — nên nó ra khỏi `docs/`:

```
<gốc dự án>/
├── docs/                    # chỉ tài liệu
│   └── Screen-spec/<Màn>/test.md      # THIẾT KẾ test: TC, dữ liệu, kết quả mong đợi
└── e2e/
    ├── playwright.config.ts
    └── tests/<Mã>-<Tên>.spec.ts       # HIỆN THỰC phần Auto, vd `S01-Login.spec.ts`
```

**Vì sao tách:** `docs/` không có `package.json`/`tsconfig` nên spec nằm đó **không chạy được tại chỗ**; cây tài liệu lẫn file `.ts` làm portal phải né; và QA sửa selector phải commit vào `docs/`, trộn lịch sử tài liệu với lịch sử code. Tách ra là **"cùng repo, khác package"** — vẫn sửa code và sửa test trong cùng một PR, nhưng build/dependency riêng.

**Truy vết không mất gì:** nó dựa vào **mã `TC-S..` trong tên test**, không dựa vào vị trí file. Đúng một luật phải giữ: tên test ghi **đủ từng mã, viết rời** (`TC-S01-09 · TC-S01-10`), không gộp `09/10` — mọi thứ đo độ phủ đều khớp chuỗi nên dạng gộp làm mã thứ hai vô hình.

**Tương thích ngược:** dự án cài trước mốc trên có spec trong folder màn; nó **vẫn chạy đúng** và toolkit **không tự dời**. Mọi script hỏi `ba-toolkit/e2epath.js` (thứ tự tìm: `e2e/tests/` → `packages/e2e/tests/` → `tests/e2e/` → folder màn).

**Quy ước đánh số doc:** `00-*` = tài liệu **input/sống** (brainstorm, intake, personas, urd, vision, process, tracking, gaps, glossary, cr, traceability) — nhiều file cùng `00-`, phân biệt bằng tên. `01`–`12` = **deliverable BA** theo dòng pipeline (01-requirements → … → 11-integration → 12-api-integration), mỗi số một deliverable, **không trùng số** (`10-architecture` = kiến trúc nội tại một hệ, chốt trước build; `11-integration` = kiến trúc tích hợp nhiều hệ nội bộ; `12-api-integration` = đánh giá & mapping API **đối tác ngoài**). File **kỹ thuật/không phải deliverable BA** (vd `dev-notes.md` của dev-run, `e2e.spec.ts` của ba-test-e2e) **KHÔNG đánh số** và không vào portal mặc định. Thêm deliverable mới → cấp số kế tiếp chưa dùng.

## `docs/Ho-so/` — tài liệu KHÔNG thuộc đặc tả chính (từ 13/08/2026)
Gốc `docs/` chỉ giữ **đặc tả sản phẩm + công cụ điều hành**. Mọi thứ còn lại vào **`docs/Ho-so/`** (thư mục phẳng, không chia nhóm con).

| Ở lại gốc `docs/` | Vào `docs/Ho-so/` |
|---|---|
| `01-requirements` · `02-functions` · `03-overview` | `00-vision` · `00-personas` · `00-process` · `00-urd` · `00-brainstorm` · `00-intake` · `00-flows` · `prototype.html` *(nền/discovery)* |
| `05-data-model` · `06-api-spec` · `07-design-system` | `00-glossary` · `04-stakeholders` |
| `10-architecture` · `11-integration` · `12-api-integration` | `08-roadmap` · `09-uat` · `meetings/` |
| `Screen-spec/` *(trái tim đặc tả)* | `00-traceability` · `00-gaps` · `00-conformance` *(báo cáo, sinh lại được)* |
| `00-tracking.md` *(ma trận điều hành — script đọc liên tục)* | `00-introduction` · `sitemap.md` · `sitemap-flows.md` · `sitemap.html` · `portal.html` *(phái sinh/xuất bản)* |
| `00-cr.md` · `00-backlog.md` · `00-changelog.md` · `00-decisions.md` *(**sổ** — không xoá dòng, là hồ sơ thay đổi/quyết định)* | `userguide/` · `releases/` · `dev-notes.md` · `removed/` *(màn đã cắt, `ba-remove`)* |

**File có số vẫn giữ số** khi chuyển (`04-stakeholders.md`, `08-roadmap.md`, `09-uat.md` nằm trong `Ho-so/` nhưng không đổi tên) — mọi tham chiếu `08-roadmap.md` trong tài liệu cũ vẫn đúng tên file. Gốc `docs/` do đó **thủng 3 số** (`01 02 03 · 05 06 07 · 10 11 12`), có chủ đích, không phải lỗi.

**`Ho-so/` là container trong suốt** — không phải nhóm nghiệp vụ, không có mã, vô hình với chuỗi truy vết, y như `Screen-spec/`.

**Tương thích ngược (BẮT BUỘC giữ):** dự án cài trước mốc này để mọi thứ ở gốc `docs/`, và người dùng có quyền không di chuyển. **Script không được hardcode một trong hai chỗ** — phải hỏi qua `ba-toolkit/docpath.js` (`resolveDoc`/`hasDoc`/`readDoc`/`writePathFor`), nó tìm `docs/Ho-so/<tên>` trước rồi mới tới `docs/<tên>`. Skill cũng vậy: tìm không thấy ở `Ho-so/` thì tìm ở gốc, **đừng báo "chưa có tài liệu"**.

**Ghi tài liệu bổ trợ mới:** mặc định vào `Ho-so/`; nhưng file đã tồn tại ở gốc thì **ghi đè tại chỗ**, không tự di chuyển tài liệu của người ta khi họ chỉ yêu cầu cập nhật nội dung.

## Đặt tên & cấu trúc nhóm
- **Folder màn hình** = `<Mã màn> - <Tên>` — mã màn (`S01`, `S06`…) + ` - ` (khoảng trắng–gạch ngang–khoảng trắng) + tên PascalCase không dấu. VD: `S01 - Login`, `S06 - Register`, `S02 - Dashboard`. Mã màn lấy đúng từ `03-overview.md`.
- **Folder nhóm** (Group): PascalCase không dấu, không khoảng trắng, **không** có tiền tố mã (nhóm không có mã màn riêng). VD `Authentication`, `Organization`.
- Tên hiển thị tiếng Việt (vd "Đăng nhập") để trong nội dung tài liệu, không dùng cho tên folder.
- **Container `Screen-spec/`**: MỌI folder màn nằm dưới `docs/Screen-spec/` để tách khỏi tài liệu hệ thống (`00-*`/`01`–`12`) và các folder khác (`meetings/`, `releases/`, `userguide/`) ở gốc `docs/` — giữ gốc gọn khi số nhóm màn tăng. Container này **TRONG SUỐT với truy vết**: KHÔNG phải nhóm nghiệp vụ, KHÔNG có mã, không xuất hiện trong chuỗi ID; chỉ là cấp thư mục gom cho gọn.
- **Nhóm nhiều màn** → lồng trong container: `docs/Screen-spec/<Nhóm>/<Mã> - <Tên>/` (vd `docs/Screen-spec/Authentication/S01 - Login/`).
- **Nhóm chỉ 1 màn** → bỏ cấp nhóm: `docs/Screen-spec/<Mã> - <Tên>/` (vd `docs/Screen-spec/S02 - Dashboard/`, `docs/Screen-spec/S04 - UserProfile/`). Không tạo `docs/Screen-spec/Dashboard/Dashboard/`.
- **Tương thích ngược:** dự án cài toolkit **trước** khi có container (folder màn đặt thẳng `docs/<Nhóm>/<màn>/` hoặc `docs/<màn>/`) vẫn chạy được — các script (`scan.js`/`refresh.js`) coi `Screen-spec/` là tùy chọn, thiếu nó thì quét y như cũ. **Dự án mới** luôn tạo dưới `Screen-spec/`.

## Ngôn ngữ
Toàn bộ nội dung tài liệu bằng tiếng Việt.

## Văn phong tài liệu (BẮT BUỘC)
Tài liệu phục vụ cả stakeholder nghiệp vụ lẫn dev — phải **chuyên nghiệp, dễ hiểu**:
- Viết rõ ràng, mạch lạc; câu ngắn, thể chủ động; tránh lan man, tránh sáo rỗng.
- **Mở rộng từ viết tắt ở lần đầu xuất hiện** trong mỗi tài liệu — vd "API (Application Programming Interface)", "ERD (Entity-Relationship Diagram)"; lần sau dùng dạng ngắn.
- Không giả định người đọc đã quen jargon kỹ thuật/nghiệp vụ — giải thích tại chỗ hoặc dẫn tới mục Thuật ngữ.

## Thuật ngữ (glossary) — mô hình hybrid (BẮT BUỘC)
1. **Từ điển trung tâm `docs/Ho-so/00-glossary.md`** — nguồn chuẩn toàn dự án: mọi từ viết tắt/thuật ngữ phương pháp (BR, StR, FR, NFR, F, S, MoSCoW, SMART, CRUD, ERD, REST, RACI, GWT, INVEST, WCAG…) + thuật ngữ nghiệp vụ đặc thù. **`ba-requirements` tạo (seed)** file này với bộ thuật ngữ phương pháp chuẩn; mỗi skill sinh tài liệu sau đó **bổ sung thuật ngữ mới mình dùng** (idempotent — không thêm dòng đã có). Một dòng = một thuật ngữ.
2. **Footer "## Thuật ngữ" trong mỗi tài liệu** — đặt cuối các doc cấp hệ thống (`01`→`07`) và `srs.md`, `test.md` của mỗi màn: liệt kê **thuật ngữ DÙNG trong chính doc đó** + giải thích ngắn 1 dòng, rồi trỏ về từ điển đầy đủ. Doc đứng riêng (chia sẻ lẻ) vẫn tự hiểu được.

Format footer dùng chung:
```
## Thuật ngữ
| Thuật ngữ | Giải thích |
|-----------|-----------|
| FR (Functional Requirement) | Yêu cầu chức năng — hệ thống phải làm gì |
| MoSCoW | Cách xếp ưu tiên: Must / Should / Could / Won't |

> Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`.
```

Thiếu footer Thuật ngữ (ở doc bắt buộc) hoặc chưa có `docs/Ho-so/00-glossary.md` → `ba-review` gắn gap **🟢 Nhỏ**.

## Mã định danh (theo phân loại yêu cầu)
Cấp nhu cầu người dùng — trong `00-urd.md` / `urd/<feature>.md` (do `ba-discover urd` cấp, **trước** khi có yêu cầu hệ thống):
- Nhu cầu người dùng (User Need): `UN-01` — *chưa phải yêu cầu hệ thống*; `ba-requirements` chuyển mỗi `UN` thành ≥1 `StR`/`FR`/`NFR` (dự án mới) hoặc đi qua `CR`/`WI` (dự án đang chạy).
- Tiêu chí thành công của người dùng: `USC-01` — đo kết quả người dùng đạt được, nên đỡ ≥1 `BO-..` của `00-vision.md`.
- Ngoại lệ phía người dùng (User Exception, URD §6): `UE-01` — tình huống hỏng/biên người dùng gặp. URD **không** trỏ xuống màn; màn xử lý nó **trích ngược** `UE-..` ở dòng xử lý (cột Trace của `E-S..`, Nguồn của `R-S..`/TC Negative). Không màn nào xử lý → cột cuối §6 ghi `n/a — lý do` hoặc `OQ-..` (mồ côi hợp lệ). `ba-trace` đo `UE→(R-S|E-S|TC)`; `UE` Critical/High mồ côi → 🟡 (`ba-review urd`).

Cấp yêu cầu — trong `01-requirements.md`:
- Business Requirement: `BR-01`
- Stakeholder Requirement: `StR-01`
- Solution Requirement — Functional: `FR-01`; Non-functional: `NFR-01`
- Business Rule (quy tắc nghiệp vụ, tách riêng khỏi FR): `BRule-01`; ở cấp màn: `BRule-S<NN>-01`
- Transition Requirement: `TR-01`

Cấp giải pháp:
- Chức năng (`02-functions.md`): `F01` — trace về ≥1 `FR`/`BR`
- Màn hình (`03-overview.md`): `S01`
- Yêu cầu màn (`srs.md`): chức năng `R-S<NN>-01` (trace `F`/`FR`); phi chức năng `R-S<NN>-N01` (trace `NFR`/`BR`)
- Use case: `UC-S<NN>-01`. User story: `US-S<NN>-01`. Test case: `TC-S<NN>-01`.
- Lỗi cấp màn (Ma trận lỗi trong `srs.md`): `E-S<NN>-01` — một cách màn hỏng, kèm mức (`blocker`/`major`/`minor`), thông báo **nguyên văn** và lối thoát. Là nguồn của `TC` Negative (`ba-test`) và mục "Xử lý sự cố" của cẩm nang (`ba-accept userguide`).
- Giả định cấp màn (`srs.md`): `GĐ-S<NN>-01` — giả định của riêng màn (dạng scoped của `GĐ`); trạng thái `Đề xuất → Đã xác nhận / Đã sửa / Đã bỏ / Chấp nhận rủi ro` như giả định cấp dự án.
- Ràng buộc cấp màn (`srs.md`): `RB-S<NN>-01` — ràng buộc thiết kế/nghiệp vụ **không** phải `BRule` (rule hệ thống *thực thi*) hay `NFR` (chất lượng *đo được*): vd "phải chạy trên trình duyệt khách đã cũ", "không được lưu PII quá 30 ngày".
- Câu hỏi mở cấp màn (mục "Quét yêu cầu ngầm" của `srs.md`): `OQ-S<NN>-01` — chiều quét mà trả lời đúng cần **hành vi mới** hay quyết định nghiệp vụ; khai ở bảng "Câu hỏi mở từ quét" (cột Chiều · Ai trả lời), ô của chiều trỏ về nó. Không tự đặt `R-S..` để lấp chiều. Mã **ngoài** màn (`UE-..` của URD) không đặt trong bảng quét — `ba-feasible` luật 9 đòi mã trong bảng khai ở tài liệu màn; `UE` trích ngược ở dòng `E-S`/`R-S` (xem `UE` ở trên).

Cấp quản trị thay đổi & công việc:
- Change Request (`00-cr.md`): **`CR-01`** — bộ đếm **toàn cục** (một CR có thể chạm nhiều màn/nhiều `F` hoặc chạm thẳng yêu cầu gốc, nên KHÔNG đếm theo màn). Marker trong tài liệu: `*(CR-07)*`.
- Work Item (`00-backlog.md`): **`WI-01`** — bộ đếm **toàn cục**. Việc phát triển **không phải CR** (tính năng mới trong phạm vi, task kỹ thuật, bug, spike). Marker: `*(WI-07)*`. Phân biệt: sửa cái **đã chốt** → CR; **thêm mới**/thuần kỹ thuật → WI.

Mã bổ trợ theo tài liệu (đầy đủ — skill KHÔNG tự bịa tiền tố mới ngoài danh sách):
- Stakeholder (`04-stakeholders.md`): `SH-01`. Mục tiêu kinh doanh (`00-vision.md`): `BO-01`. Persona (`00-personas.md`): `PS-01`. **Ứng viên yêu cầu** rút từ nỗi đau/cơ hội của persona (`00-personas.md`): `U-01` — *chưa phải yêu cầu đã chốt*; khi được duyệt sẽ thành `FR`/`StR` (dự án mới, qua `ba-requirements`) hoặc đi qua `CR` (dự án đang chạy).
- Kịch bản Given-When-Then (`test.md`/`09-uat.md`): `GWT-01`. Ca nghiệm thu UAT (`09-uat.md`): `UAT-01`.
- Mục checklist high-level (`checklist.md` mỗi màn, do `ba-test checklist`): `CL-S<NN>-01` — đánh **tuần tự toàn màn**, mỗi mục trace về `R-S`/`UC`/`US`/`E-S`. Đứng **song song `TC`** trong chuỗi (cả hai neo vào `R-S`/`UC`/`US`); `checklist` là bản high-level, `test` là ca chi tiết — mỗi `CL` nên có ≥1 `TC` phủ.
- Quyết định kiến trúc (`10-architecture.md`/`11-integration.md`/`12-api-integration.md`): `ADR-01`. Giả định: `GĐ-01`. Open Question (`ba-reverse`/`ba-reverse-doc`): `OQ-01`; cấp màn: `OQ-S<NN>-01` (xem trên).
- Hệ/đối tác ngoài (`12-api-integration.md`): `EXT-01`. Quyết định họp (`meetings/`): `DEC-01`. Action item họp (`meetings/`): `ACT-01`.
- Cần tiền tố mới → bổ sung vào đây **và** vào `registry` cuối file trước, rồi mới dùng.

**Chuỗi truy vết chuẩn:** `BR → StR → FR/NFR → F → S → R-S → UC/US → TC`.

**Nhánh đầu nguồn (discovery, nếu dự án có chạy):** `BO` (vision) · `PS`/`U` (personas) → **`UN`** (URD) → nhập vào chuỗi chuẩn ở `StR`/`FR`/`NFR`. Ngoại lệ **`UE`** (URD §6) nhập vào chuỗi ở tầng màn: `E-S`/`R-S`/`TC` trích ngược `UE-..`. `UN` là tầng *nhu cầu người dùng*, đứng **trước** `01-requirements.md`; `USC` là tiêu chí thành công đo phía người dùng, không nằm trong chuỗi triển khai.

## Thuộc tính yêu cầu (áp cho mọi yêu cầu)
Mỗi yêu cầu mang: **ID · Nguồn** (stakeholder/tài liệu) **· Ưu tiên (MoSCoW:** Must/Should/Could/Won't) **· Trạng thái** (Đề xuất/Duyệt/Cài đặt) **· Truy vết** (lên/xuống). Ghi trong cột bảng hoặc chú thích.

## Ma trận tracking (`00-tracking.md`)
Cột: Mã CN | Chức năng | Nhóm | Màn hình | Folder | ascii | brainstorm | srs | usecase | userstory | design-spec | html | test | plan | checklist | e2e | dev | Trạng thái | Cập nhật cuối.
Trạng thái mỗi tài liệu: `✅` xong / `⬜` chưa / `⚠️` cần cập nhật.
Cột `dev` = trạng thái **code** của màn, do `dev-run` quản (⚠️ đang dev / ✅ dev xong); không map ra file tài liệu — `ba-track refresh` giữ nguyên giá trị, không reset.
Cột `e2e` = có script Playwright của màn (do `ba-test-e2e` sinh) hay chưa — ✅ có / 🔨 có nhưng chưa phủ trọn màn / ⬜ chưa / ⚠️ lệch `test.md`. **Vị trí spec là `e2e/tests/<Mã>-<Tên>.spec.ts` ở GỐC DỰ ÁN, không nằm trong `docs/`** — xem "Script E2E để ở đâu" bên dưới. Script đọc vị trí qua `ba-toolkit/e2epath.js`, không hardcode.
**Màn lớn được chẻ thành nhiều spec theo tính năng** (`chatQpin.spec.ts`, `toolFilters.spec.ts`…) là hợp lệ — cái tên `<Mã>-<Tên>.spec.ts` chỉ ôm nổi một trong số đó. Những spec ấy nhận diện qua **mã `TC-S..` trong nội dung** (`e2epath.js` → `taggedSpecs`), và `ba-track refresh` ghi 🔨 cho màn chỉ có loại spec này — nếu chỉ hỏi theo tên file thì mỗi lần refresh lại hạ màn về ⬜, xoá bằng chứng phủ E2E có thật (dự án desktop 20/09/2026: S01, S17). Nhãn người/LLM đã đặt (✅ phủ đủ, ⚠️ lệch) **không bị hạ** xuống 🔨.
Cột `checklist` = có `checklist.md` (checklist kiểm thử high-level, do `ba-test checklist` sinh) hay chưa — ✅ có / ⬜ chưa / ⚠️ lệch nguồn. Là file per-màn **khuyến nghị**: **KHÔNG tính vào "9/9 hoàn thành doc"** (giống `e2e`, để dự án cũ không gãy gate), nhưng có mã `CL-S..` truy vết nên **`ba-review checklist`** soi độ phủ được. *(`ba-trace` RTM hiện chưa gồm tầng `CL` — mở rộng sau nếu cần.)*
Cột `figma` = **tùy chọn** — chỉ có khi dự án đẩy layout lên Figma (`ba-figma-draw push-lofi|push|pull`); chủ sở hữu là `ba-figma-draw/scripts/figma-sync.js` (`apply`/`verify` ghi, thêm cột ngay sau `html` ở lần đẩy đầu), `ba-track refresh` **giữ nguyên giá trị** như `dev`, **không tính vào "Hoàn thành"**. Ký hiệu: ⬜ chưa · 🔲 lo-fi đã đẩy · ✅ hi-fi khớp · ⚠️ html mới hơn Figma (sửa sau khi đẩy mà không qua pull) · ✋ Figma sửa tay chưa kéo về. Chi tiết từng frame/khối ở sổ `Ho-so/00-figma-sync.md`.

**Một dòng = một màn hình** (không phải một chức năng). Màn hình phục vụ nhiều chức năng thì cột "Mã CN" liệt kê tất cả mã, cách nhau dấu phẩy (vd `F04, F05, F06`); cột "Nhóm" để `—` nếu màn không thuộc nhóm lồng.

## Quy tắc cập nhật tracking
Mỗi skill khi tạo/sửa tài liệu của một màn hình phải cập nhật ô tương ứng và cột "Cập nhật cuối" trong `docs/00-tracking.md`.

## Change Request (CR) · Work Item (WI) · Nhật ký thay đổi · Đối chiếu code ↔ tài liệu
**Nội dung đầy đủ bốn mục này ở `conv-ledgers.md`** (cùng thư mục) — tách ra để skill không đụng tới sổ khỏi phải nạp. Tên mục giữ nguyên nên mọi tham chiếu `conventions.md` → "Change Request (CR)" / "Work Item (WI)" / "Nhật ký thay đổi" / "Đối chiếu code ↔ tài liệu" vẫn đúng địa chỉ.

Bốn thứ đó khác nhau ở **thời điểm** và **quyền phán xét** — nhớ đúng một dòng này là đủ để không lẫn:

| Sổ/báo cáo | Thời điểm | Quyền phán xét | Xoá dòng? |
|---|---|---|---|
| `00-cr.md` (CR) | **TRƯỚC** khi sửa cái đã chốt | có (Duyệt/Từ chối/Hoãn) | không |
| `00-backlog.md` (WI) | trước/trong khi làm việc **mới** | có (vòng đời) | không |
| `00-changelog.md` | **SAU** khi đã sửa | không — chỉ ghi nhận | không |
| `00-conformance.md` | sau khi có code | không — báo bằng chứng | **có, ghi đè** |

> Sửa cái **đã chốt** → CR. Việc **mới/kỹ thuật** → WI. Đã lỡ sửa mà chưa qua CR → changelog gắn cờ `⚠️ chưa có CR`.

## Xác nhận giả định (BẮT BUỘC)
Khi một skill phải **tự đưa ra giả định** (do thiếu thông tin) để tạo tài liệu, giả định đó **chưa được coi là chốt** — BA/người dùng phải rà trước khi pipeline đi tiếp. Áp cho **mọi** skill sinh giả định.

**Chế độ tương tác:**
1. **Gom & đánh số** mọi giả định vừa tạo: `GĐ-01`, `GĐ-02`… — mỗi cái ghi *nội dung* + *vì sao cần (chỗ thiếu)* + *ảnh hưởng nếu sai*.
2. **Rà — chọn cách hỏi theo SỐ LƯỢNG và MỨC ẢNH HƯỞNG**, đừng máy móc một kiểu:
   - **≤3 giả định, hoặc giả định có ảnh hưởng lớn** (đổi phạm vi, đổi quy tắc nghiệp vụ, đổi kiến trúc) → hỏi **từng cái một** bằng `AskUserQuestion`: **Đồng ý / Sửa (nhập giá trị đúng) / Bỏ (không áp dụng)**. Đây là loại phải nhìn kỹ.
   - **≥4 giả định phần lớn là chi tiết nhỏ** → **IN BẢNG trọn bộ** (`GĐ · Nội dung · Vì sao cần · Ảnh hưởng nếu sai · Đề xuất`) rồi hỏi **MỘT lượt**: *"Đồng ý tất cả / Chọn cái cần sửa / Xem lại từng cái"*. Chọn "cần sửa" → mới hỏi riêng đúng những cái đó.
   > Vì sao có nhánh gộp: `ba-requirements` một dự án cỡ vừa sinh 10–15 giả định. Hỏi 15 dialog liên tiếp thì người dùng bấm "Đồng ý" theo phản xạ từ cái thứ tư — tức là **vòng xác nhận biến thành nghi thức**, đúng thứ nó sinh ra để chống. Bảng nhìn một lượt còn được đọc thật.
3. **Summary** — rà hết thì trình **bảng tổng hợp**: `GĐ · Nội dung · Quyết định · Giá trị chốt`.
4. **Cổng quyết định** — hỏi người dùng xác nhận tổng thể; **chỉ khi người dùng đồng ý "đi tiếp"** mới chạy bước/skill kế. Còn yêu cầu sửa → cập nhật rồi mới tiếp.
5. **Cập nhật tài liệu** — ghi giá trị đã chốt; giả định bị sửa/bỏ → cập nhật mọi mục liên quan. Mục "Giả định" giữ trạng thái mỗi dòng: `Đề xuất → Đã xác nhận / Đã sửa / Đã bỏ / Chấp nhận rủi ro`.

**Trạng thái `🔓 Chấp nhận rủi ro`** — dùng khi giả định **không thể xác nhận được ở thời điểm này** (chưa có người dùng thật, chưa có dữ liệu, đối tác chưa trả lời) nhưng dự án **quyết định đi tiếp có ý thức**. Đây KHÔNG phải cách làm gate im lặng: chỉ hợp lệ khi ghi đủ **bốn** thứ ngay tại dòng/mục đó:
1. **Ai quyết** (vai trò/mã stakeholder) · 2. **Ngày quyết** · 3. **Vì sao chưa xác nhận được** · 4. **Điều gì kích hoạt rà lại** (mốc thời gian hoặc sự kiện cụ thể).

Thiếu bất kỳ vế nào → vẫn tính là `⚠️ chưa xác nhận` (gap 🟠, `Mốc = ba-build`). Khác `Đã xác nhận` ở chỗ: `Đã xác nhận` = có người khẳng định đúng; `Chấp nhận rủi ro` = **biết là chưa biết**, và chấp nhận hậu quả nếu sai. Khi điều kiện rà lại xảy ra mà chưa ai rà → quay lại `⚠️ chưa xác nhận`.

**Chế độ batch/không tương tác** (không hỏi được): giữ fallback — tự giả định hợp lý + ghi rõ — NHƯNG đánh dấu mỗi dòng **`⚠️ chưa xác nhận`**; vòng tương tác sau (hoặc `ba-review`) sẽ nhắc rà.

**Orchestrator:** coi vòng xác nhận này là **checkpoint** — sau skill sinh giả định, chạy nó trước gate/skill kế, không bỏ qua.

**ba-review:** giả định còn `⚠️ chưa xác nhận` → liệt kê ở mục "Cần xác nhận" và gắn gap **🟠 Nợ có hạn** (`Mốc = ba-build`) — gate đặc tả đang chạy **không** dừng vì nó (một giả định treo ở `00-brainstorm` không liên quan gate `screens`), nhưng `ba-build` chặn cứng: không build trên giả định chưa chốt. Phân loại canon: `ba-review` → "Phân loại 🟠". Giả định `🔓 Chấp nhận rủi ro` **đủ bốn vế** → không chấm gap, nhưng vẫn liệt kê trong mục "Rủi ro đã chấp nhận" của `00-gaps.md` để không ai quên; **thiếu vế nào → chấm gap như `⚠️`**.


## Cổng phương án · Quy ước gate · Review agent độc lập · Cổng chốt kiến trúc · Ngưỡng "màn phức tạp" · Hồ sơ dự án
**Nội dung đầy đủ sáu mục này ở `conv-gates.md`** (cùng thư mục) — tách ra để **25/55 skill không có cổng** khỏi phải nạp ~140 dòng. Tên mục giữ nguyên nên mọi tham chiếu `conv-gates.md` → "Cổng phương án" / "Quy ước gate" / "Ghi `00-gaps.md`" / "Cổng chốt kiến trúc" / "Review agent độc lập" / "Ngưỡng màn phức tạp" / "Hồ sơ dự án" vẫn đúng địa chỉ.

> **"Xác nhận giả định" cố ý ở lại file này** (mục ngay trên), dù nó là một trong bốn cổng: 9 skill sinh giả định (`ba-discover vision`, `ba-discover persona`, `ba-discover urd`, `ba-discover process`, `ba-discover brainstorm`, `ba-discover roadmap`, `ba-accept uat`, `ba-integration`, `ba-api-spec partner`) **không** dùng cổng nào khác — bắt chúng nạp cả `conv-gates.md` chỉ vì 24 dòng này thì tách file mất ý nghĩa.

**Bốn thứ phải nhớ kể cả khi không mở file kia:**
1. **Bốn cổng, không thay nhau:** cổng phương án (*trước* khi ghi file) · xác nhận giả định (sau khi doc có giả định) · gate `ba-review` (sau khi doc xong) · cổng chốt kiến trúc (chốt ADR trước build).
2. **Bốn mức gap:** 🔴 chặn mọi gate · 🟡 chặn **đúng scope của mình** · 🟠 nợ có hạn (bắt buộc ghi `Mốc`, gate của mốc đó mới chặn) · 🟢 không chặn. Phân loại 🟠 canon nằm ở `ba-review` → "Phân loại 🟠".
3. **Skill được orchestrator đã qua cổng gọi xuống thì KHÔNG hỏi duyệt lại** — in phương án rút gọn rồi chạy tiếp (3 ngoại lệ ở `conv-gates.md`).
4. **Hồ sơ `lite`** (khai ở đầu `00-tracking.md`) tắt sổ WI · changelog · `ba-conformance` · review agent; **không** tắt 9 file/màn, chuỗi ID, 4 cổng, sổ CR. Không khai = `full`.

## Animation chuyển cảnh (BẮT BUỘC)
Mọi màn hình phải đặc tả **animation in/out mượt** cho hai nhóm chuyển cảnh — không để "nếu có". Nguồn duy nhất cho mọi skill mô tả/thiết kế màn (`ba-screen-spec`, `ba-html-design`, `ba-figma-draw`, `ba-screens`):

1. **Chuyển giữa các màn (page transition):** mỗi màn mô tả cách **vào (enter)** khi điều hướng tới và **ra (exit)** khi rời đi với màn lân cận (vd slide-in/out, fade, shared-element).
2. **Chuyển section nội màn (in/out):** mọi panel/modal/tab/accordion/danh sách/toast **xuất hiện hoặc biến mất** phải có animation in **và** out mượt (fade/slide/scale).

Quy tắc chung:
- **Duration/easing lấy từ Motion token** của `docs/07-design-system.md` (nếu có); mặc định: enter `ease-out`, exit `ease-in`, chuyển màn 250–300ms, section 150–200ms.
- Hiện thực bằng `transform`/`opacity` (mượt, tránh layout-thrash); **không** nảy/giật.
- **Tôn trọng `prefers-reduced-motion`:** giảm còn fade nhẹ hoặc tắt khi người dùng bật.

Thiếu mục **Animation chuyển cảnh** trong `design-spec.md` → `ba-review` gắn gap **🟠 Nợ có hạn** (`Mốc = ba-html-design`): design-spec là đầu vào của HTML, chưa dựng HTML thì chưa hại ai — nhưng `ba-html-design` chặn. Phân loại canon: `ba-review` → "Phân loại 🟠".

## Sơ đồ Mermaid — chọn loại · an toàn cú pháp · tô màu · kiểm coverage
**Nội dung đầy đủ ở `conv-mermaid.md`** (cùng thư mục) — tách ra để skill không vẽ sơ đồ khỏi phải nạp ~100 dòng luật cú pháp. Tên mục giữ nguyên nên mọi tham chiếu `conventions.md` → "Bộ chọn sơ đồ Mermaid" / "Sơ đồ Mermaid — an toàn cú pháp" / "Bảng màu phân vai node" / "Kiểm coverage sơ đồ" / "House theme" vẫn đúng địa chỉ.

**Hai luật phải nhớ kể cả khi không mở file kia:**
1. **Luật ưu tiên vai trò** — luồng có **≥2 vai trò** và có bàn giao → **PHẢI `swimlane-beta`**, cấm `flowchart` (flowchart giấu mất ai làm gì). `flowchart` chỉ cho luồng đúng 1 tác nhân.
2. **Quy tắc vàng cú pháp** — nhãn chứa bất kỳ ký tự nào ngoài [chữ (có dấu) · số · khoảng trắng · `-`] thì **bọc trọn trong ngoặc kép**: `Z["Chặn · Mở dự án trước"]`. Nhãn cạnh thì bỏ hẳn ký tự đặc biệt (không bọc được).

Tiếng Việt trong sơ đồ **phải có dấu** (ID node thì ASCII). Sơ đồ không render được, hoặc tiếng Việt không dấu → `ba-review` gắn gap **🟡**.

## Tài liệu suy luận (từ code / từ tài liệu nguồn)
Tài liệu sinh bằng **suy luận** (không từ yêu cầu gốc do người dùng chốt) mang banner ở đầu file:
- `ba-reverse` (từ code): > 🔶 **Suy luận từ code — cần người xác nhận.**
- `ba-reverse-doc` (từ tài liệu rời): > 🔶 **Suy luận từ tài liệu — cần người xác nhận.** — mọi khẳng định phải soi được về một nguồn ở `00-intake.md`; khẳng định không nguồn = suy diễn → 🔶 + `GĐ`/`OQ`.

## Cưỡng chế bằng hook

Luật của toolkit là **chữ trong `SKILL.md`**, và người đọc chữ đó là một model — model bỏ sót được. Đo thật trong một phiên `ba-add-feature` → `dev-run`: bảy lỗi lọt qua mọi gate và chỉ bị agent đọc lại bắt sau 3–4 vòng vá, trong khi **cả bảy đều kiểm được bằng máy trong vài chục mili-giây**. Từ 10/09/2026, những luật **đo được** được giao cho hook.

**Ranh giới — và đây là phần quan trọng hơn danh sách:**

| Giao cho hook | Để lại cho skill / agent |
|---|---|
| Đếm được · so chuỗi được · tra bảng được | Cần **phán đoán nghiệp vụ** |
| Sai là sai, không ngoại lệ hợp lý | Có ngoại lệ hợp lý |
| Đã có checker thì hook **gọi** nó | — |

Ba luật con, vi phạm cái nào cũng làm hook thành phiền nhiễu:

1. **Không hook hoá Cổng phương án.** Hook không thấy được "đã trình phương án và chờ duyệt chưa"; cưỡng chế nửa vời chỗ đó chỉ đẻ cảnh báo sai.
2. **Không chặn cứng.** Mọi phép kiểm dùng `exit 2` = cảnh báo trả cho agent. Lint là heuristic; chặn cứng một heuristic là làm hỏng những lượt hợp lệ.
3. **Mỗi mã kiểm phải trỏ về một luật CÓ TÊN ở tài liệu này.** Tiêu chí này đã loại một phép kiểm "thứ tự mã tăng dần" — nó chỉ là thẩm mỹ, không luật nào đỡ.

**Đang cưỡng chế** (canon máy-đọc: `gate.hook.checks`):

| Mã | Khi nào | Kiểm gì | Luật nguồn |
|---|---|---|---|
| `H1` | sau mỗi Edit/Write vào `docs/**/*.md` | Bảng markdown toàn vẹn: đủ dòng ngăn, mọi dòng cùng số cột | định dạng bảng của tài liệu |
| `H2` | như trên, chỉ `test.md` | Roll-up khớp bảng TC đếm được | `ba-test` → "Tổng hợp thực thi (roll-up)" |
| `H3` | sau khi sửa `.md` (`PostToolUse`) | Sơ đồ Mermaid **liệt kê** một họ mã (≥3 mã, phủ ≥60% bảng trong file) mà thiếu mã bảng có → sơ đồ vẽ một lần, bảng thêm dòng sau (example 20/09/2026: `08-roadmap.md` thiếu `F14` ở cả hai sơ đồ trong khi prose ghi "đủ 13 F") | "Kiểm coverage sơ đồ" (`conv-mermaid.md`) |
| `S1` | cuối lượt (`Stop`) | Chạm tài liệu một màn mà cột "Cập nhật cuối" của màn đó trong `00-tracking.md` chưa đổi | "Bổn phận khi động vào `docs/`" |
| `S2` | cuối lượt (`Stop`) | Baseline đổi mà sổ `00-cr.md` không có dòng mới | "Change Request (CR)" ở trên |
| `S4` | cuối lượt (`Stop`) | **Gọi** `ba-trace/scan.js` → tham chiếu gãy ở màn vừa chạm | chuỗi truy vết |
| `S5` | cuối lượt (`Stop`) | **Gọi** `ba-conformance/check-tc-layer.js` → TC xanh giả ở màn vừa chạm | "TC phải được thoả ở đúng tầng" |
| `H5` | sau mỗi Edit (mọi file) | Thay ≥3 dòng code bằng ≤2 dòng bình luận | bằng chứng phải là output thật |
| `S8` | cuối lượt (`Stop`) | (a) ≥ 150 lượt gọi tool mà **< 1,5 tool/lượt** → gộp tool độc lập vào một lượt, việc dò tìm phái subagent (đo 19/09/2026: **1,00 tool/lượt trên 1.493 lượt**; nội dung cả phiên ~1,4 M token mà lặp lại thành 3,8 tỷ); (b) > 300 lượt kể từ compact cuối → mở phiên mới, trạng thái đã trên đĩa | "Kỷ luật ngữ cảnh" (`CLAUDE.md`) + "Phiên ngắn, trạng thái trên đĩa" (`conv-gates.md` → "Đội agent") |
| `S3` | cuối lượt, **mặc định TẮT** | Chạy gate dev thật (lệnh lấy từ `dev-notes.md`) | như trên |
| `FG` | trước mỗi Read/Grep/Bash | Chặn đọc `.env`, khoá, credential | — (luật phổ quát) |

**`FG` là ngoại lệ duy nhất của "không chặn cứng".** Ở `PreToolUse`, `exit 2` nghĩa là **từ chối** lệnh gọi — và ở đúng chỗ này, chặn là lựa chọn đúng: một cảnh báo sai mất vài giây, còn một bí mật đã vào context thì **không rút lại được** (nó nằm trong transcript, có thể đi vào log, không có nút hoàn tác). Hai phía cán cân không đối xứng nên ngưỡng cũng không đối xứng. Bản mẫu (`.env.example`, `.env.sample`, `.env.template`) **được cho qua** — chúng sinh ra để đọc, và chính toolkit có luật đối chiếu `.env.example` với biến `E2E_*` (lint check 22); chặn nhầm chúng là làm hỏng một cổng khác của mình.

**`S3` mặc định TẮT** vì nó chạy bộ test thật của dự án; bật ở `.claude/ba-hooks.json`. Nó chỉ chạy lệnh mà `dev-notes.md` **ghi rõ trong backtick** — dự án viết lệnh bằng văn xuôi thì S3 im, và im là đúng: đoán lệnh để chạy là cách nhanh nhất phá máy người dùng.

`S4`/`S5` **không có logic riêng** — chúng chạy checker đã có rồi lọc theo màn vừa chạm, tức chỉ đổi *thời điểm* biết, không đổi *nơi giữ luật*. Hook chỉ nói về việc người dùng vừa làm; nợ cũ ở màn khác là việc của `ba-review`.

**Miễn trừ tại chỗ:** `<!-- ba-hook: bỏ H1 · <lý do> -->` trong chính file đó, **bắt buộc ghi lý do** sau dấu `·`. Không có đường này thì một ca hợp lệ hiếm gặp sẽ khiến người ta tắt cả hook, và mất hết.

**Lint Mermaid trong `hook-lint.js` (`MER`) chỉ là gợi ý mềm** — exit 0 + `additionalContext`, không bao giờ tự gây exit 2 (25/09/2026: trên 3 dự án thật bắt 0, kêu oan 2; phép thật là CI render Chrome). Nó ở lại vì thấy thứ render không thấy (nhãn mất dấu, swimlane quá rộng). **`S6` (TODO mới) đã bỏ** — `ac-judge/scan-bypasses` loại `todo-new` giữ luật đó ở đúng chỗ (review diff).

**Bộ đếm theo luật:** mỗi lần hook chạy thật ghi `.claude/ba-hook-stats.json` (gitignore) — hook gọi mấy lần/có việc mấy lần, mỗi luật `gọi`·`bắn`·`hỏng` + lần cuối. Đọc: `node .claude/skills/ba-toolkit/scripts/hook-gate.js --stats [<gốc dự án> …]`. Trước khi cắt hay giữ một luật hook, **đọc số, không đoán**: hook `gọi 0` = không chạy ở đó; luật `bắn 0` sau nhiều lần gọi = ứng viên cắt.

**Hook không phải nơi giấu luật.** Tài liệu này vẫn là nguồn sự thật; hook chỉ **thi hành**. `lint.js` check 27 soát: mã khai trong registry phải có hàm thật trong script — thiếu thì không có lỗi runtime nào, luật chỉ lặng lẽ quay về tự nguyện.

---

## Registry (khối MÁY-ĐỌC — nguồn cho `lint.js`)
**Khối ` ```registry ` nằm ở `conv-registry.md`** (cùng thư mục) — chỉ `lint.js` đọc nó, không skill nào cần nạp. **Đổi quy ước → sửa khối đó + phần văn bản tương ứng** ở file này hoặc phụ lục; quên một vế thì `lint.js` nhắc kèm `file:line`.
