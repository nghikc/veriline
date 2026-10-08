# Changelog

Mọi thay đổi đáng kể của Veriline được ghi ở đây. Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), đánh số theo [Semantic Versioning](https://semver.org/lang/vi/). Phiên bản hiện hành nằm trong file `VERSION` — lint 40 đòi mỗi phiên bản ở đó có một mục `## [x.y.z]` trong file này.

Bản `0.x`/`1.0.0-beta` còn đổi được hợp đồng (tên lệnh, cột sổ, mã kiểm) giữa các bản beta; mỗi lần đổi ghi ở mục **Đổi** kèm cách chuyển.

## [Unreleased]

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
