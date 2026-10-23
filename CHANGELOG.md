# Changelog

Mọi thay đổi đáng kể của Veriline được ghi ở đây. Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), đánh số theo [Semantic Versioning](https://semver.org/lang/vi/). Phiên bản hiện hành nằm trong file `VERSION` — lint 40 đòi mỗi phiên bản ở đó có một mục `## [x.y.z]` trong file này.

Bản `0.x`/`1.0.0-beta` còn đổi được hợp đồng (tên lệnh, cột sổ, mã kiểm) giữa các bản beta; mỗi lần đổi ghi ở mục **Đổi** kèm cách chuyển.

## [Unreleased]

### Thêm
- **Audit một ảnh chụp màn.** `ac-audit-web <ảnh.png>` chấm màn không có file hay URL (màn của đối tác, ảnh Figma xuất ra, ảnh dán) theo phiếu 6 tiêu chí: thứ bậc, nhóm và khoảng cách, dễ đọc, câu chữ, nhất quán, trạng thái. Mỗi lỗi chỉ vùng trên ảnh, nói vì sao không phải cố ý, và cách sửa cụ thể; không cho điểm, không số px. Ảnh mờ hoặc quá ít thứ để chấm thì kết luận "chưa đủ ảnh" và xin ảnh rõ hơn. Mẫu: `ac-audit-web/assets/audit-anh-template.md`.
- `check-state.js` báo thêm trạng thái không đi tới được từ điểm bắt đầu (`ST-TOI`), kể cả ở sơ đồ chưa có bảng chuyển. Bộ mẫu `example`: cả 6 sơ đồ State có bảng chuyển; bảng của S05 làm lộ vòng đời tài khoản vẽ lệch với S01 (gap G70).
- Sơ đồ swimlane: mũi tên giữa hai vai trò phải nói thứ được giao (`Đơn nghỉ phép đã điền`, không `Tiếp theo`) — bảng ví dụ sai → đúng trong `ba-diagram/references/recipes.md`, agent soát sơ đồ báo 🟡. `ba-diagram` hỏi tối đa 2 vòng, mỗi câu kèm đề xuất; hết 2 vòng thì vẽ với giả định ghi dưới sơ đồ.
- **Bảng chuyển trạng thái dưới mỗi sơ đồ State.** `ba-screen-spec` ghi kèm sơ đồ `stateDiagram` hai bảng: trạng thái (tên · mã lưu ở CSDL · đầu/giữa/cuối) và chuyển (từ · sự kiện · điều kiện · sang · **ai thực hiện**). `check-state.js` so sơ đồ với bảng và mã với enum ở `05-data-model.md` — bắt mũi tên thiếu/thừa, dòng không ghi ai chuyển, mã không có trong enum, giá trị enum mà vòng đời không vẽ. `ba-test` suy ca chuyển hợp lệ/không hợp lệ từ bảng. Sơ đồ cũ chưa có bảng thì không bị báo. Phân tích ảnh hưởng CR thêm hai dòng: **Phá tương thích** (schema/enum/API) và **TC phải viết lại**. Ma trận lỗi có hai cột tuỳ chọn `HTTP` và `Khoá dịch`.
- **Gantt thành bảng kế hoạch.** Sơ đồ `gantt` trong portal và `ba-diagram export` giờ có cột *Công việc · Người làm · Bắt đầu · Số ngày* cạnh thanh thời gian: mỗi `section` là một nhóm có thanh tổng và tổng số ngày, đường nối cho việc phụ thuộc, mốc hình thoi, cuối tuần và ngày lễ tô nền. Người làm không bắt buộc — ghi sau ` · ` trong tên việc (`API · Nam`). Số ngày là ngày làm theo `excludes`. Lộ trình trục tuần (`axisFormat Tuan %W`) in "Tuần N" chứ không in ngày. Nguồn vẫn là khối Mermaid; cú pháp chưa hỗ trợ thì Mermaid vẽ như cũ. Xem trước bảng: `node .claude/skills/ba-toolkit/scripts/gantt.js <file.md>`. Mẫu lộ trình (`ba-discover`) và mẫu phát hành (`ba-accept`) viết theo cú pháp này: `excludes weekends`, số ngày tính bằng `Nd` (`5d` = 1 tuần), tên việc có dấu, mẫu phát hành ghi người làm.
- **Máy soát cấu trúc sơ đồ luồng.** `ba-diagram` và `ba-review diagram` chạy `check-flow.js` trên `swimlane-beta`/`flowchart`: điểm quyết định chỉ một lối ra hoặc lối ra không nhãn, bước cụt không tới điểm kết, bước không có đường vào, lane rỗng — mỗi phát hiện kèm `file:dòng`. Trước đây các lỗi này chỉ được soát bằng mắt; chạy trên 6 lát dự án thật bắt 12 bước cụt, trong đó có sơ đồ tự ghi "không dead-end". `ba-diagram` báo kết quả tách bốn mức (cú pháp · quy ước · cấu trúc · đúng nghiệp vụ) và nói rõ mức nào máy không kiểm.
- **Phân tích ảnh hưởng CR ra danh sách tài liệu phải sửa.** Bước 1 của `ba-change-request` in khối "Đổi X → N tài liệu phải sửa": mỗi tài liệu một dòng (yêu cầu, chức năng, từng tài liệu màn, e2e, hồ sơ) kèm ID bị chạm, sửa gì, độ lớn, rủi ro 🔴🟠🟢 — chép vào mục chi tiết CR và trình ở cổng duyệt. Danh sách do `impact.js` lần chuỗi truy vết lập; `--term "<chữ>"` bắt thêm các tệp chỉ chép con số bằng lời (NFR gốc, màn khác "cùng ngưỡng", userguide) — chạy thử đổi ngưỡng khoá 5 → 7 trên `example`: 12 tệp theo mã, 34 ứng viên khi thêm cụm chữ, 24 phải sửa thật.
- **Design Figma làm nguồn giao diện cho `ba-html-design`.** Có file Figma của designer mà chưa có app: bản dựng dùng **đúng ảnh, icon và phông** của design — xuất về `docs/Ho-so/figma-assets/` (kèm `manifest.json`), nhúng vào html bằng `embed-assets.js`; phông miễn phí nhúng bằng `figma-fonts.js`, phông thương mại dùng phông thay dưới một bí danh cho tới khi có tệp. Wireframe lo-fi đánh dấu khối "Design cần bổ sung". Hướng dẫn: `references/figma-source.md`.
- **`/ba-html-design prototype` — bản bấm được để show khách.** Gom mọi `html-design.html` thành một tệp `docs/Ho-so/prototype-hifi.html` mở offline; điều hướng tự lập từ cột Mô tả của bảng phần tử srs ("mở S06", "chạm → S13"…), bổ sung chỗ thiếu bằng `Ho-so/prototype-nav.json`; có nút gợi ý vùng bấm, danh sách màn, `#Sxx` mở thẳng một màn.
- **Cài qua plugin của Claude Code.** Repo vừa là marketplace vừa là plugin `veriline`: `claude plugin marketplace add` → `claude plugin install veriline@veriline` → trong dự án gõ `/veriline:veriline-setup` (hoặc nói "cài Veriline"). Skill hỏi một câu chọn gói rồi chạy đúng `install.js` từ bản plugin đã tải; cài xong mọi thứ như cách cài từ bản clone. Briefing cho người đóng góp dời sang `.claude/CLAUDE.md`.
- **Bảng "Thuật ngữ bạn sẽ gặp"** ở `explain/README.md`: cổng, Cổng phương án, nợ có hạn chót, các mã BR/FR/F/S/TC/CR/WI/PD, và cách phân biệt `GĐ-01` (giả định) với `GĐ1` (giai đoạn).

### Đổi
- Gói trả phí đổi tên **Pro → Advance** (README, thông báo của script, nhãn issue `advance`). Mô tả gói bỏ hai dòng: đồng bộ Jira/Confluence và sinh tài liệu ngược; báo cáo điều hành, bài tổng quan cho lãnh đạo và nhật ký thay đổi tài liệu đã chốt. `ba-start` không còn quảng cáo skill viết tài liệu ngược khi dự án có code.
- `scan-html.js` dùng được như thư viện (`require(...).contrast`) — trước đây thoát ngay vì thiếu tham số dòng lệnh, nên agent audit phải tự tính tương phản.
- `report.js` không còn báo nhầm "sửa tại đích" cho file có dấu cách trong đường dẫn khi cài từ nguồn còn thay đổi chưa commit.
- Góc phải portal in `Ngày tạo: 20/10/2026 10:16` theo giờ máy thay cho `Generated: 2026-10-20T03:16:47.966Z` (giờ UTC, lệch 7 tiếng với giờ Việt Nam).
- **Thông báo viết cho người dùng (M8).** Hook, `ba-next`, bộ cài và script của bộ lõi bỏ từ lóng nội bộ ("oan", "lách", "vế", "TRẢ", "canon", "gate", tên file cấu hình) — vd "bộ kiểm báo sai", "bị trả lại", "nợ có hạn chót", "bản đã chốt". Nhắc của hook nay mở bằng việc cần làm: `[Veriline · tracking chưa cập nhật] … (S1)` — mã cũ ở cuối dòng trong ngoặc; ai lọc log theo `[ba-toolkit hook · S1]` thì đổi sang `(S1)`. Thông báo lỗi kèm một dòng `Sửa: <lệnh>`; "Error:" thành "Lỗi:". Ước tính chi phí nói rõ "ước theo bảng mặc định — cần ≥3 lần chạy thật để ước theo dự án này".
- Cài từ bản công khai không còn báo thiếu `site/huong-dan.md`; gói `core` (không có `ba-index`) không còn được gợi lệnh dựng chỉ mục. README: `claude plugin marketplace add <chủ>/<repo>` (dạng ngắn).

## [1.0.0-beta.2] — 2026-10-08

Bản beta thứ hai: cài gọn mặc định, cửa vào `ba-start` cho người mới, và gộp skill cùng họ (69 → 49 skill công khai). **Có đổi tên lệnh** — xem mục *Đổi*.

### Thêm
- **`ba-start` — cửa vào cho người mới.** Skill nhận diện dự án (chỉ có ý tưởng, có tài liệu rời Word/PDF/ảnh, hay đã có code) rồi cho xem demo 10 phút trên app mẫu TeamTasks: một cổng tài liệu thật, sau đó AI đặc tả một màn ngay trước mắt. Tiếp theo nó hỏi mức tài liệu (`lite`/`mini`/`full`) và gọi đúng skill bắt đầu. Demo nằm riêng trong `veriline-demo/` (tự thêm vào `.gitignore`).
- `report.js` thêm mục `vàoCửa`: số phút từ lúc cài tới portal demo và tới portal dự án thật.
- `ba-next` gợi `/ba-start` khi dự án chưa có `docs/`.
- **Bộ cài gọn (M6).** Lần cài đầu mặc định chỉ chép **lõi BA**: từ ý tưởng tới yêu cầu, màn hình, đặc tả, test case, thiết kế HTML và cổng tài liệu. `--dev` thêm bộ viết code: lập kế hoạch build, TDD, kiểm chứng độc lập. `--profile full` cài mọi skill; `--profile mini` cho dự án nhỏ. Lựa chọn được ghi nhớ khi cập nhật. `ba-next` gợi skill chưa cài kèm lệnh cài.

### Đổi
- **Gộp skill cùng họ (M6 đợt 3): bản công khai 69 → 49 skill.** Skill cũ thành **chế độ** của skill cùng họ, gọi bằng đối số đầu; gọi không đối số giữ hành vi cũ. Cách chuyển — đổi lệnh:
  `ba-figure` → `/ba-diagram export` · `ba-checklist` → `/ba-test checklist` · `ba-add-feature` → `/ba-add-screen feature` · `ba-api-integration` → `/ba-api-spec partner` · `ba-flow`/`ba-proto-html` → `/ba-proto-first flow|html` · `ba-uat`/`ba-release`/`ba-userguide` → `/ba-accept uat|release [phase]|userguide` · `ba-vision`/`ba-stakeholder`/`ba-persona`/`ba-process`/`ba-urd`/`ba-brainstorm`/`ba-meet`/`ba-roadmap` → `/ba-discover <chế độ>` · `ba-dbschema` → `/ba-data-model dbml` · `ba-sitemap` → `/ba-portal sitemap` · `ba-wireframe-lofi` → `/ba-html-design lofi`.
  Tài liệu sinh ra giữ nguyên tên và chỗ. `install.js` tự gỡ thư mục skill cũ ở dự án khi chưa sửa tay; có sửa tay thì GIỮ kèm cảnh báo — chuyển phần sửa sang skill mới rồi chạy lại với `--force`. Dự án `Phạm vi: docs` giờ được cài `ba-accept` (chế độ `uat`/`release`/`userguide`); `ba-accept` trọn và `ba-data-model dbml` tự từ chối khi phạm vi là docs.
- `scan-html.js` dời từ `ac-audit-web` sang `ba-toolkit`, vì thiết kế HTML của gói lõi luôn chạy nó. Lệnh cập nhật tự dọn bản cũ.
- Dự án đã cài trước bản này giữ nguyên **đủ bộ** khi cập nhật. Muốn gọn lại thì chạy `--profile core --prune`.
- **Bản công khai gọn lại: 78 → 69 skill.**
  - Chuyển sang gói Pro: kiến trúc tích hợp, mô hình đe doạ, lộ trình tách hệ thống cũ, báo cáo điều hành, bài tổng quan một trang, nhật ký thay đổi tài liệu đã chốt.
  - Ba công cụ dành cho người phát triển bộ skill không còn phát hành.
  - Change request và cảnh báo sửa tài liệu đã chốt vẫn ở bản miễn phí.
- `check-agents.js` dời sang `ba-toolkit`, vì bộ kiểm cấu trúc dùng nó.

### Sửa
- Chạy nhiều lệnh `claude -p` nối nhau (cả `ac-po run`) không còn bị cảnh báo giả "phiên Claude khác đang mở": phiên đóng thì tự xoá khỏi sổ phiên (hook `SessionEnd`). Dự án đã cài: chạy `ba-export update` để thêm hook.
- `node .claude/skills/ba-toolkit/scripts/profile.js docs` in hồ sơ và phạm vi dự án trên một dòng; các skill giờ ghi lệnh đầy đủ thay vì đường dẫn tắt không chạy được.
- Mô tả `ba-discover` khớp với bảng chế độ: `brainstorm` là bước đầu của chuỗi, và vẫn chạy lẻ được.
- Agent chỉ ghi `cost.js record` khi có số token đo được; không có số đo thì bỏ qua, không ước.
- `cost.js estimate` nhận tên skill cũ (đã gộp) và báo tên mới; `ba-wireframe-lofi` dùng đúng giá của chế độ lofi.
- `ba-review` chỉ gọi script của `ba-api-test` khi skill đó đã được cài (bản `--scope docs` không có).

## [1.0.0-beta.1] — 2026-10-08

Bản beta công khai đầu tiên. Trước bản này bộ skill chỉ dùng nội bộ (đánh nhãn v3.0/v3.1, không semver).

### Thêm
- **Pipeline BA tiếng Việt có truy vết** `BR → StR → FR/NFR → F → S → R-S → UC/US → TC`: yêu cầu, chức năng, danh sách màn, đặc tả từng màn (ascii, srs, use case, user story, design-spec), test case, bản thiết kế HTML, kế hoạch build; cổng `ba-review` dò gap ở mỗi breakpoint; `ba-next` một cửa cho "làm gì tiếp".
- **Cổng chống PASS giả** (`ac-verify`): agent kiểm chứng độc lập chạy lại từng Proof của `plan.md`, gieo lỗi (`mutate.js`) xem test có bắt, đòi biên lai chạy (`evidence.js run`) mới hơn code; `ac-judge` review diff theo bằng chứng.
- **Kho hình thật**: lát cắt ẩn danh từ dự án thật làm fixture, `real-run.js` chạy mọi checker trên đó với bánh cóc `expect.json` — checker không được tốt dần trên ví dụ chuẩn mà tệ dần trên dự án thật.
- **Dò tài liệu cũ thiếu gì** (`thieu.js`, `ba-screen-spec --bo-sung`, `ba-design-system --reverse-4b`): dự án có tài liệu đời cũ được chỉ rõ tính năng nào tắt vì thiếu file, và dựng ngược phần thiếu.
- **Hook cho Claude Code**: chặn đọc file bí mật, đối soát git ở cuối phiên (ma trận theo dõi, đổi baseline chưa có CR), cảnh báo hai phiên cùng thư mục.
- **Báo giá trước khi chạy** (`cost.js estimate`) ở các skill nặng; **sổ báo oan** (`oan.js`) khi checker phán sai thay vì lách.
- **Phát hành**: giấy phép MIT cho lõi, `THIRD_PARTY_NOTICES.md` (superpowers, Mermaid và thư viện đi kèm, Lucide); `install.js` chép kèm giấy phép sang dự án đích; portal chèn bản quyền Mermaid.
- **Phiên bản một nguồn**: file `VERSION`; `install.js` ghi phiên bản vào manifest của dự án đích và in khi cập nhật ("đích đang ở 1.0.0-beta.1 (abc1234) → nguồn …").

### Đổi
- Tên sản phẩm **Veriline**; tiền tố `ba-*`/`dev-*`/`ac-*` giữ nguyên nên không phải đổi lệnh.
- Chia gói: lõi + mở rộng công khai (MIT); đội agent tự chạy, đồng bộ Jira/Confluence và sinh tài liệu ngược thuộc gói Pro. Lint 44 chặn skill công khai phụ thuộc cứng vào skill Pro.
- `check-tc-layer`: TC trong bảng thiếu cột `Cách chạy` báo **Chưa kiểm** thay vì coi như đạt; mã exit giữ nguyên.
- README không còn số skill viết tay: số nằm trong một câu chuẩn được lint 40 soát với thư mục skill thật, còn lại do lệnh cài tự in.

### Sửa
- Hook: đóng nhiều đường lọt của hook-guard (realpath, glob của Grep, lệnh Bash ghép), đối soát Stop theo git nên ghi bằng Bash cũng được tính.
- Checker: tám ca báo oan tìm được trên kho hình thật (khung demo của `check-design`, Playwright/pytest trong `check-tc-layer`, bố cục `src/<gói>` của `scan-feasible`…).

### Giới hạn đã biết
- Biên lai Proof vẫn là file agent ghi được; hook-guard chưa chặn hết mọi đường đọc biến môi trường; file mốc của hook Stop nằm trong `.gitignore` nên xoá được.
- Chưa kiểm trên Windows.
