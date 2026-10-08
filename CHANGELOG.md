# Changelog

Mọi thay đổi đáng kể của Veriline được ghi ở đây. Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), đánh số theo [Semantic Versioning](https://semver.org/lang/vi/). Phiên bản hiện hành nằm trong file `VERSION` — lint 40 đòi mỗi phiên bản ở đó có một mục `## [x.y.z]` trong file này.

Bản `0.x`/`1.0.0-beta` còn đổi được hợp đồng (tên lệnh, cột sổ, mã kiểm) giữa các bản beta; mỗi lần đổi ghi ở mục **Đổi** kèm cách chuyển.

## [Unreleased]

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
