# Ma trận truy vết tài liệu — <Tên App>

Trạng thái: ✅ xong · ⬜ chưa làm · ⚠️ cần cập nhật
Một dòng = một màn hình. Màn phục vụ nhiều chức năng → cột "Mã CN" liệt kê nhiều mã (`F04, F05`); nhóm 1 màn → cột "Nhóm" để `—`.
Cột `dev` = trạng thái code của màn (do `dev-run` quản: ⚠️ đang dev, ✅ dev xong); không map ra file tài liệu.
Cột `e2e` = có script Playwright của màn (`e2e/tests/<Mã>-<Tên>.spec.ts`, do `ba-test-e2e` sinh) hay chưa; là artifact code như `dev`, KHÔNG tính vào "9/9 hoàn thành doc".

> ⚙️ **Khuôn này là của hồ sơ `full`/`lite` (9 cột tài liệu).** Dự án khai hồ sơ `mini` chỉ có **5 cột** — `ascii · srs · html · test · plan` (`conv-gates.md` → "Hồ sơ dự án"). Đừng sửa tay: ghi dòng khai hồ sơ rồi chạy `node .claude/skills/ba-track/scripts/refresh.js docs`, script dựng cột theo đúng hồ sơ và giữ nguyên dòng khai.

| Mã CN | Chức năng | Nhóm | Màn hình | Folder | ascii | brainstorm | srs | usecase | userstory | design-spec | html | test | plan | e2e | dev | Trạng thái | Cập nhật cuối |
|-------|-----------|------|----------|--------|-------|------------|-----|---------|-----------|-------------|------|------|------|-----|-----|-----------|---------------|
| F01 | Đăng nhập | Authentication | Login | `docs/Screen-spec/Authentication/S01 - Login/` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Chưa bắt đầu | — |
| F04, F05, F06 | Bảng điều khiển | — | Dashboard | `docs/Screen-spec/S02 - Dashboard/` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Chưa bắt đầu | — |
