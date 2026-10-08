# Veriline

> **Kiểm chứng từ ý tưởng tới code** — *Verified from idea to code.*

<!-- so-sinh: mọi con số trong file này do release/export-public.js điền từ bản xuất — lint 40 bỏ qua file có dấu này -->
Phiên bản **1.0.0-beta.1** (beta) · thay đổi theo bản: [`CHANGELOG.md`](CHANGELOG.md)

Veriline là bộ skill cho [Claude Code](https://claude.com/claude-code) làm **tầng phân tích nghiệp vụ (BA) có truy vết**: từ một ý tưởng thô tới yêu cầu, chức năng, màn hình, đặc tả, test case, kế hoạch build rồi tới code thật. Mỗi bước sinh mã định danh nối thành chuỗi `BR → StR → FR/NFR → F → S → R-S → UC/US → TC`, và script đếm được chỗ nào đứt. Phần code đi qua **cổng chống PASS giả**: một agent kiểm chứng độc lập (không phải agent viết code) chạy lại từng bằng chứng, gieo lỗi vào code xem test có bắt không, rồi mới cho đánh "xong". Toàn bộ hồ sơ viết **tiếng Việt**, đủ chuẩn để giao khách: SRS, use case, test case, ma trận truy vết, kế hoạch nghiệm thu, cổng tài liệu HTML mở offline.

## Trong bộ có gì

- **49 skill** (35 `ba-*` phân tích nghiệp vụ · 11 `dev-*` kỷ luật code/QA · 3 `ac-*` kiểm chứng và review), **9 agent** review chuyên trách, **88 script** Node không phụ thuộc thư viện ngoài.
- **Lõi** (32 skill): pipeline BA chính, cổng review, truy vết, change request, portal, cổng kiểm chứng và bộ `dev-*`.
- **Mở rộng** (17 skill): discovery (vision, persona, quy trình AS-IS/TO-BE), kiến trúc, API, dữ liệu, prototype, nghiệm thu, cẩm nang… Một số skill gắn nhãn *thử nghiệm* chỉ cài khi bạn chọn.
- Hook cho Claude Code: chặn đọc file bí mật (`.env`, khoá), nhắc cập nhật ma trận theo dõi, cảnh báo sửa tài liệu đã chốt mà chưa có change request.

## Yêu cầu hệ thống

| | |
|---|---|
| Hệ điều hành | macOS hoặc Linux (Windows chưa được kiểm) |
| Node.js | **≥ 22.13** khuyến nghị (bộ kiểm chạy trên Node 22). Node 20 chạy được mọi skill trừ chỉ mục tra cứu `ba-index` (cần `node:sqlite`); khi thiếu, lệnh cài tự bỏ qua bước dựng chỉ mục |
| Claude Code | bản CLI hoặc ứng dụng desktop |
| git | dự án đích nên là một git repo (hook và cổng đọc lịch sử commit) |
| Tuỳ chọn | Chrome/Chromium để kiểm render sơ đồ và chụp màn hình thiết kế |

## Cài đặt

```bash
git clone https://github.com/nghikc/veriline.git ~/veriline
cd ~/du-an-cua-ban
node ~/veriline/.claude/skills/ba-export/scripts/install.js --to .
```

Lệnh cài chép skill, agent và hook vào `.claude/` của dự án, ghi một khối luật ngắn vào `CLAUDE.md` (giữ nguyên phần bạn tự viết) và lưu dấu vân tay từng file để lần cập nhật sau không ghi đè chỗ bạn đã sửa.

Mặc định lệnh cài chỉ chép **bộ lõi** (19 skill): từ ý tưởng tới yêu cầu, màn hình, đặc tả, test case, thiết kế HTML và cổng tài liệu. Thêm cờ khi cần:

| Cờ | Thêm gì |
|---|---|
| `--dev` | bộ dev (17 skill): lập kế hoạch build, viết code theo TDD, kiểm chứng độc lập — cho dự án sẽ viết code |
| `--profile full` | mọi skill: khám phá (vision, persona, quy trình), kiến trúc, API, dữ liệu, prototype, nghiệm thu, cẩm nang… |
| `--profile mini` | bộ gọn hơn lõi cho dự án 5–10 màn, 1–3 người |
| `--scope docs` | dự án chỉ làm tài liệu, không code |

Lựa chọn được ghi nhớ: lần cập nhật sau giữ nguyên bộ đã chọn. `/ba-next` gợi skill chưa cài kèm lệnh cài.
- Kiểm tra bản mới: `git -C ~/veriline pull`, rồi chạy lại lệnh cài với `--check` (chỉ báo, không ghi) hoặc không cờ (cập nhật).

> **Sắp có:** cài qua plugin marketplace của Claude Code (`claude plugin install`).

## Bắt đầu

Mở Claude Code trong dự án và gõ:

```
/ba-next
```

`ba-next` quét `docs/`, cho biết dự án đang ở giai đoạn nào và đề xuất bước kế. Không cần nhớ tên skill. Dự án mới từ ý tưởng thô thì bắt đầu bằng `/ba-init`; cần làm rõ vấn đề trước thì `/ba-discover`.

| Giai đoạn | Việc | Lệnh chính |
|---|---|---|
| 1. Discovery | hiểu vấn đề, người dùng, quy trình hiện tại | `/ba-discover` |
| 2. Yêu cầu & giải pháp | yêu cầu → chức năng → màn → đặc tả → test → kế hoạch build | `/ba-init` |
| 3. Dev | code theo kế hoạch, test trước, kiểm chứng độc lập | `/dev-run` |
| 4. Nghiệm thu | UAT, ma trận truy vết, gói phát hành | `/ba-accept` |

### Xem ví dụ trước khi dùng thật

Thư mục `example/` là một dự án mẫu hoàn chỉnh (**TeamTasks**, ứng dụng quản lý công việc nhóm, 6 màn). Ngay trong repo này:

```bash
node .claude/skills/ba-next/scripts/status.js example/docs
node .claude/skills/ba-portal/scripts/build.js example/docs example/docs/Ho-so/portal.html
open example/docs/Ho-so/portal.html        # Linux: xdg-open
```

Bản phát hành không kèm các trang HTML sinh ra (portal, sitemap, onepager); lệnh dựng lại nằm ở `example/GUIDELINE.md` mục 0. Hướng dẫn từng bước trên ví dụ: `example/GUIDELINE.md`. Giải thích từng skill bằng ngôn ngữ nghiệp vụ: `explain/README.md`.

## Gói Cộng đồng và Pro

| | **Cộng đồng** (repo này, MIT) | **Pro** (liên hệ) |
|---|---|---|
| Pipeline BA đầy đủ, hồ sơ tiếng Việt, portal offline | ✅ | ✅ |
| Truy vết, cổng review, change request, backlog | ✅ | ✅ |
| Cổng chống PASS giả: kiểm chứng độc lập, gieo lỗi, review theo bằng chứng | ✅ | ✅ |
| Đội agent tự chạy cả một phase (điều phối, chia lô, hội đồng bỏ phiếu, chấm điểm) | | ✅ |
| Đồng bộ Jira/Confluence, sinh tài liệu ngược từ code hay tài liệu cũ | | ✅ |
| Kiến trúc tích hợp nhiều hệ, mô hình đe doạ, lộ trình tách hệ thống cũ | | ✅ |
| Báo cáo điều hành, bài tổng quan cho lãnh đạo, nhật ký thay đổi tài liệu đã chốt | | ✅ |
| Mẫu hồ sơ theo ngành, xuất Word theo mẫu công ty, hỗ trợ triển khai | | ✅ |

Quan tâm gói Pro: mở một issue gắn nhãn `pro`.

## Tài liệu bạn sinh ra thuộc về bạn

Mọi thứ Veriline tạo trong dự án của bạn (tài liệu trong `docs/`, test trong `e2e/`, code, sơ đồ, portal) **thuộc về bạn** (hoặc khách hàng của bạn, theo hợp đồng giữa hai bên). Giấy phép MIT của Veriline áp cho bộ skill, không áp cho sản phẩm đầu ra. Bộ skill chạy cục bộ trong Claude Code của bạn; Veriline không thu thập hay gửi tài liệu của bạn đi đâu.

## Giấy phép

Lõi phát hành theo giấy phép **MIT**, xem [`LICENSE`](LICENSE). Mã và tài liệu của bên thứ ba (bộ `dev-*` phỏng theo dự án superpowers, Mermaid và các thư viện đi kèm, bộ icon) giữ nguyên giấy phép gốc, liệt kê trong [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Phản hồi

Gặp lỗi hoặc phải tự sửa file của bộ skill trong dự án? Chạy trong dự án của bạn:

```bash
node .claude/skills/ba-export/scripts/report.js --plain
```

Lệnh ghi `.claude/ba-toolkit-report.json`: **ẩn danh theo thiết kế**, chỉ có số đếm, mã ID, tên skill và đường dẫn file của bộ skill (không tên dự án, không nội dung tài liệu). Bạn đọc lại file rồi đính kèm vào issue. Một file mà nhiều dự án cùng phải sửa nghĩa là mặc định của Veriline sai, và đó là thứ được sửa trước.

## Đóng góp

Đọc `CLAUDE.md` (cấu trúc skill, quy ước phải giữ) và `docs/decisions/README.md` (vì sao thiết kế như vậy). Trước khi mở pull request:

```bash
node .claude/skills/ba-toolkit/scripts/test.js --public   # bộ kiểm của chính toolkit, gồm nhóm đối kháng
node .claude/skills/ba-toolkit/scripts/lint.js            # kiểm cấu trúc và độ lệch quy ước
```
