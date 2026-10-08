---
type: skill-explainer
group: tien-ich
updated: 2026-07-15
---

# Nhóm tiện ích — 24 skill giữ tài liệu sạch, chia sẻ được, và cài đặt

> Những skill này **không sinh tài liệu nghiệp vụ mới**; chúng **rà soát, đồng bộ, xuất bản** tài liệu đã có, hoặc mang cả toolkit sang dự án khác. Dùng xen kẽ bất cứ lúc nào trong pipeline.

## Chọn cái nào? — bảng nhanh

| Bạn cần | Dùng | Đầu ra |
|---|---|---|
| Kiểm tra tài liệu còn thiếu/lệch chỗ nào | `ba-review` | `docs/Ho-so/00-gaps.md` + đánh ⚠️ vào tracking |
| Không nhớ dự án đang ở bước nào / chạy gì tiếp | `ba-next` | bảng trạng thái + đề xuất & chạy bước kế tiếp |
| Ma trận truy vết phản ánh đúng hiện trạng file | `ba-track` | dựng lại/đồng bộ `docs/00-tracking.md` |
| Xuất RTM đầy đủ BR→…→TC + soát độ phủ end-to-end | `ba-trace` | `docs/Ho-so/00-traceability.md` |
| Gom tài liệu thành trang đọc offline | `ba-portal` | `docs/Ho-so/portal.html` |
| Chia sẻ tài liệu qua link online | `ba-doc-public` | tài liệu trên Vercel (mỗi cái 1 URL) |
| Sổ WI/CR và Jira nói cùng một chuyện; đẩy một tài liệu lên Confluence | `ba-atlassian` ⚗️ *thử nghiệm* | cột `Jira` trong `00-backlog.md`/`00-cr.md` + trang Confluence |
| Dùng toolkit này ở một dự án khác | `ba-export` | copy skill vào `.claude/skills` của dự án đích |
| Không nhớ bước nào chạy tiếp | `ba-toolkit` | (chỉ nhắc pipeline, không sinh file) |
| Vẽ một sơ đồ từ mô tả (không biết chọn loại nào) | `ba-diagram` | khối `mermaid` đúng loại, có màu |
| Theo dõi việc phát triển (tính năng mới/task/bug/kỹ thuật) — không phải thay đổi | `ba-task` | sổ Work Item `docs/00-backlog.md` (mã `WI-01`) |

Ba cặp dễ nhầm:
- **`ba-review` vs `ba-track` vs `ba-trace`** — cùng đụng "truy vết" nhưng khác việc: **review** *phát hiện* gap (ghi `00-gaps.md`, không sửa); **track** *cập nhật trạng thái file* per-màn (ma trận `00-tracking.md`: màn nào đủ file); **trace** *xuất cả chuỗi ID* BR→…→TC (`00-traceability.md`: yêu cầu nào nối tới test nào, mồ côi ở đâu). Nhớ nhanh: review = "thiếu gì", track = "file nào có", trace = "ID nào nối tới ID nào".
- **`ba-portal` vs `ba-doc-public`** — portal xuất **offline** (một file HTML mở tại chỗ); doc-public đẩy **online** lên Vercel (có link chia sẻ). Thường chạy portal trước, rồi doc-public để đưa portal đó lên mạng.

---

## ba-next — "Một cửa": đang ở đâu, chạy gì tiếp?

**Làm gì.** Quét `docs/` bằng script (không sửa gì) → in **bảng trạng thái dự án**: giai đoạn (GĐ1 khám phá → GĐ4 nghiệm thu), tài liệu hệ thống có/thiếu, trạng thái từng màn, gap 🔴/🟡, kiến trúc đã chốt chưa, CR đang mở → **đề xuất bước kế tiếp** (kèm lý do, ❗ = gấp) → hỏi bạn rồi chạy luôn skill đó.

**Khi nào dùng.** Bất cứ lúc nào **không nhớ dự án đang ở bước nào** hoặc phân vân giữa các skill — mở phiên mới, quay lại dự án sau kỳ nghỉ, tiếp quản dự án của người khác. Đây là lệnh nên nhớ **duy nhất** nếu chỉ nhớ được một.

**Đầu vào.** `docs/` hiện có (không cần gì thêm). **Đầu ra.** Bảng trạng thái + hành động kế tiếp được chạy (nếu bạn đồng ý).

**Ví dụ.** `/ba-next` → "📍 GĐ2 — Đặc tả per-màn · 3 màn chưa bắt đầu → đề xuất `ba-batch` chạy song song; ❗ S02 đang ⚠️ lệch → `ba-track Dashboard` trước".

## ba-review — Dò lỗ hổng độ phủ & truy vết

**Làm gì.** Rà tài liệu BA tìm **gap**: yêu cầu chưa map chức năng, chức năng chưa có màn, màn chưa có test, màn đủ tài liệu nhưng thiếu plan, giả định chưa xác nhận, sơ đồ Mermaid lỗi cú pháp, CR chưa đồng bộ… Mỗi gap được phân mức **🔴 Chặn / 🟡 Quan trọng / 🟠 Nợ có hạn / 🟢 Nhỏ** kèm skill để sửa (🟠 = đúng là thiếu nhưng hạn chót nằm ở bước sau — vd giả định chưa xác nhận phải sạch trước `ba-build`, không chặn gate đang chạy). **Chỉ dò và báo — không tự sửa, không bịa gap.**

**Khi nào dùng.** Ở mỗi breakpoint của pipeline (orchestrator tự gọi ở các gate), hoặc chạy lẻ để rà soát tổng. Nhận scope tùy chọn: `requirements`, `functions`, `screens`, `<tên màn>`, `build`, `diagram`, `all` (mặc định `all`).

> **Scope `diagram <file>`** soát **độ phủ nghiệp vụ của sơ đồ** (thiếu vai trò/lane, quyết định sót nhánh, dead-end, ERD thiếu PK) — khác lint cú pháp của `ba-portal`. Sơ đồ phức tạp → gọi agent `ba-diagram-reviewer` soát độc lập. "Render được ≠ vẽ đủ nghiệp vụ."

> **3 "trợ lý soát" độc lập (agent, chỉ đọc):** khi việc kiểm cần con mắt khách quan trên nội dung phức tạp (không phải người vừa tạo tự chấm), `ba-review`/`ba-reverse` gọi agent read-only: **`ba-diagram-reviewer`** (độ phủ sơ đồ), **`ba-consistency-reviewer`** (mâu thuẫn logic giữa tài liệu — lệch ưu tiên, rule chọi nhau, test kiểm sai srs; bật ở scope `functions`/`all`/màn), **`ba-inference-reviewer`** (suy luận của `ba-reverse` có đúng code thật không). Chúng chỉ **báo findings**, skill nguồn mới sửa. Màn phức tạp còn được agent `ba-srs-quality-reviewer` soát chất lượng từng yêu cầu theo 9 đặc tính ISO/IEC/IEEE 29148.

**KHÔNG dùng khi.** Bạn muốn tài liệu được **sửa** (review chỉ phát hiện; sửa bằng skill mà nó gợi ý). Nó cũng không phân tích nghiệp vụ AS-IS/TO-BE — chỉ là gate QA độ phủ/truy vết.

**Đầu vào.** Tài liệu BA hiện có trong `docs/`.

**Đầu ra.** `docs/Ho-so/00-gaps.md` (bảng gap `ID | Mức | Scope | Mô tả | Vị trí | Sửa bằng`, kèm mục "Cần xác nhận") + đánh `⚠️` vào ô tương ứng trong `00-tracking.md` + báo tóm tắt ra chat.

**Ví dụ.** `ba-review all` → phát hiện "F07 chưa map màn nào" (🔴), "màn S03 thiếu test" (🟡) → ghi `00-gaps.md`.

---

## ba-track — Dựng lại / đồng bộ ma trận truy vết

**Làm gì.** Hai chế độ. **Refresh:** quét `docs/`, dựng lại `00-tracking.md` đúng hiện trạng (ô có file = `✅`, thiếu = `⬜`; **giữ nguyên cột `dev`** do `dev-run` quản, không reset). **Sync-on-change:** với một màn vừa sửa, rà soát nhất quán giữa 9 tài liệu của màn (srs↔usecase↔test↔design-spec↔html↔plan), đánh `⚠️` chỗ lệch rồi cập nhật, kiểm bảng roll-up test khớp trạng thái từng TC.

**Khi nào dùng.** Sau khi sửa bất kỳ tài liệu nào — để ma trận phản ánh đúng. Nguyên tắc: **sửa ở đâu thì track ở đó**; luôn kết thúc một thay đổi bằng `ba-track refresh`.

**KHÔNG dùng khi.** Bạn cần phát hiện gap trace (đó là `ba-review`). Track lo **trạng thái file**, review lo **lỗ hổng logic**.

**Đầu vào.** Cấu trúc `docs/` với các folder màn.

**Đầu ra.** `docs/00-tracking.md` được dựng lại/cập nhật (✅/⬜/⚠️ + cột "Cập nhật cuối"); các tài liệu màn bị lệch được cập nhật.

**Ví dụ.** Vừa sửa `srs.md` của Login → `ba-track sync Login` đánh ⚠️ test/html lệch → cập nhật → `ba-track refresh`.

---

## ba-trace — Xuất ma trận truy vết yêu cầu (RTM)

**Làm gì.** Quét toàn bộ `docs/`, **ghép chuỗi ID** `BR → StR → FR/NFR → F → S → R-S → UC/US → TC` theo các cạnh trace đã khai trong tài liệu, dựng **ma trận truy vết** xuất ra `docs/Ho-so/00-traceability.md`: tổng quan độ phủ mỗi tầng (%), ma trận xuôi gộp theo màn (mỗi dòng một `R-S` với thượng/hạ nguồn), và mục bất thường (yêu cầu mồ côi, màn thiếu test, TC mồ côi ngược, ref tới ID không tồn tại).

**Khi nào dùng.** Cần trả lời "yêu cầu này đã xuống tới test chưa?", "test này bảo vệ yêu cầu nào?", hoặc cần một RTM như *deliverable* cho khách/audit. Chế độ `ba-trace check` chỉ in phần gap ra chat (không ghi file) — chạy nhanh trước gate/commit.

**KHÔNG dùng khi.** Chỉ cần biết *màn nào đủ file* (đó là `ba-track`), hay chỉ cần *danh sách gap để chặn gate* (đó là `ba-review`). `ba-trace` **chỉ đọc + ghi đúng `00-traceability.md`**, không sửa tài liệu nguồn — lệch thì nó chỉ tên skill sửa.

**Đầu vào.** Toàn bộ `docs/`: `01-requirements`, `02-functions`, `03-overview`, `00-tracking`, và `srs/usecase/userstory/test` của mỗi màn.

**Đầu ra.** `docs/Ho-so/00-traceability.md` (RTM đầy đủ + % độ phủ + bảng bất thường 🔴/🟡). Vào portal như doc `00-*`.

**Ví dụ.** `ba-trace` → "FR→F 12/12 (100%), R-S(CN)→TC 44/47 (94%) — 3 R-S của S05 chưa có test 🟡; `FR09` mồ côi (không màn nào cài) 🔴".

---

## ba-portal — Xuất cổng tài liệu HTML đọc offline

**Làm gì.** Chạy một script Node **không cần cài gì** để gom các `.md` do toolkit sinh trong `docs/` thành **một file HTML tự chứa**: sidebar điều hướng theo cây docs + nội dung render + scrollspy, responsive (màn nhỏ thì sidebar thành drawer). Mở được **offline**, không phụ thuộc internet — ảnh nhúng base64, sơ đồ Mermaid render nhờ file vendored. **Click ảnh/sơ đồ → phóng to (lightbox)**, Esc/nền để đóng.

**Khi nào dùng.** Tài liệu đã đủ, muốn một trang gọn để đọc/chia sẻ cho stakeholder mà không bắt họ mở từng file `.md`.

**KHÔNG dùng khi.** Bạn cần link online để gửi từ xa (đó là `ba-doc-public`). Mặc định portal chỉ gom tài liệu toolkit; folder lạ bị bỏ qua (thêm `--all` nếu muốn gom hết).

**Đầu vào.** Các `.md` trong `docs/`; Node (không npm install).

**Đầu ra.** `docs/Ho-so/portal.html` (tự chứa, offline). Có chế độ `--single <file.md>` để render một file lẻ thành HTML sạch.

**Ví dụ.** `node .claude/skills/ba-portal/scripts/build.js docs docs/Ho-so/portal.html` → mở `portal.html` trên trình duyệt thấy cả bộ tài liệu.

---

## ba-doc-public — Đẩy HTML lên Vercel (online)

**Làm gì.** Xuất bản **một file HTML** (vd `html-design.html` của một màn, hoặc `docs/Ho-so/portal.html`) lên **Vercel** để chia sẻ qua link. Gom nhiều tài liệu về **một project Vercel cố định** (cùng tên miền), mỗi tài liệu một **URL ổn định** theo slug; tự sinh trang `index.html` liệt kê link. Đẩy lại cùng slug = cập nhật đè.

**Khi nào dùng.** Cần **link online** để gửi stakeholder ở xa xem trên trình duyệt, không cần tải file.

**KHÔNG dùng khi.** Chỉ cần xem tại chỗ (dùng `ba-portal` offline), hoặc chưa đăng nhập Vercel CLI. Đây là bước **sau** khi đã có HTML tự chứa (portal hoặc html-design).

**Đầu vào.** File HTML tự chứa; Vercel CLI đã `vercel login`; Node.

**Đầu ra.** Tài liệu online: base URL `<project>.vercel.app` (mặc định `ba-docs.vercel.app`) + URL từng tài liệu theo slug (vd `/login`, `/portal`); folder staging `.ba-site/` chứa bản copy + index + manifest.

**Ví dụ.** `ba-doc-public docs/Ho-so/portal.html --slug portal` → trả về `https://<tên-project>.vercel.app/portal`.

---

## ba-atlassian — Đưa sổ việc lên Jira, kéo trạng thái về, đẩy tài liệu lên Confluence *(⚗️ thử nghiệm)*

**Làm gì:** Sổ Work Item (`00-backlog.md`) và sổ Change Request (`00-cr.md`) là nơi toolkit ghi việc và thay đổi, nhưng đội dev theo dõi việc trên Jira và sếp/khách đọc Confluence. Skill này nối hai bên: `push` tạo một issue Jira cho mỗi WI/CR chưa có, rồi ghi khoá Jira (dạng `<dự án>-<số>`) vào cột `Jira` của sổ; `pull` đọc trạng thái issue về và cập nhật cột `Trạng thái` của sổ; `publish <file.md>` biến một tài liệu BA thành một trang Confluence (lần sau đẩy lại thì cập nhật đúng trang đó). Trước khi tạo hay sửa bất cứ gì trên Atlassian, nó in bảng "sẽ tạo/sửa gì" và hỏi bạn. Nếu Jira và sổ cùng đổi một dòng theo hai hướng, nó dừng và hỏi bạn chọn — không tự đoán bên nào đúng. Không có Atlassian MCP trong phiên thì vẫn chạy được phần `plan`: bạn nhận danh sách việc cần đồng bộ để làm tay.

**Khi nào dùng:** dự án có Jira/Confluence và bạn muốn sổ trong `docs/` và Jira nói cùng một chuyện — sau khi `ba-task`/`ba-change-request` mở WI/CR, hoặc định kỳ (đầu tuần) để kéo trạng thái Jira về sổ; khi cần gửi một tài liệu (yêu cầu, chức năng, biên bản họp) cho người chỉ đọc Confluence.

**Khác skill gần kề:** `ba-task`/`ba-change-request` là chủ sổ (cấp mã, quyết vòng đời) — `ba-atlassian` chỉ chiếu sổ ra Jira và kéo trạng thái về, không cấp mã mới. `ba-doc-public` đẩy HTML lên Vercel để có link công khai; đây đẩy Markdown lên Confluence trong không gian nội bộ. `ba-portal` render tài liệu ra HTML đọc offline — `publish` dùng lại renderer đó khi Confluence đòi định dạng storage.

---

## ba-export — Cài toolkit sang dự án khác

**Làm gì.** Chạy script `install.js` (không cần cài gì) để **copy trọn bộ skill** `ba-*` + `dev-*` (kèm conventions, templates, rules, script, vendored mermaid) từ repo này sang thư mục `.claude/skills` của một **dự án khác**, để dự án đó dùng được cả pipeline BA lẫn khâu dev — **không cần cài plugin superpowers**. Kèm copy agent review, file hướng dẫn (README/GUIDELINE), folder `explain` (bộ giải thích này) và một **khối briefing** vào `CLAUDE.md` của dự án đích — tóm tắt vòng đời 4 giai đoạn, "chưa biết chạy gì thì gọi `ba-next`", và **bổn phận khi sửa tài liệu** (cập nhật ma trận, đổi cái đã chốt thì mở CR). Cần khối này vì `CLAUDE.md` là thứ agent luôn đọc: thiếu nó, những lần agent sửa tài liệu mà không chạy skill nào sẽ không theo quy ước nào cả.

**Khi nào dùng.** Muốn áp bộ toolkit này cho một dự án thật (không phải chỉ dùng trong repo mẫu này).

**KHÔNG dùng khi.** Bạn chỉ đang làm việc ngay trong repo toolkit này (đã có sẵn skill). Sau khi chạy phải **khởi động lại Claude Code** ở dự án đích để nạp skill.

**Đầu vào.** Repo BA toolkit nguồn + dự án đích; Node ≥16.7.

**Đầu ra.** Copy (ghi đè) mọi `ba-*` + `dev-*` vào `<đích>/.claude/skills/` + agent `ba-*.md`; `README.md` → `BA-TOOLKIT-README.md`; `GUIDELINE.md` → `BA-TOOLKIT-GUIDELINE.md`; `explain/` → `explain/`; cập nhật khối managed trong `CLAUDE.md` đích. Có `--dry` (xem trước), `--prune` (xóa skill thừa), `--no-claude` (bỏ ghi CLAUDE.md).

**Ví dụ.** Đứng trong dự án thật, chạy `node "$HOME/.claude/skills/ba-export/scripts/install.js"` → toolkit sẵn sàng ở đó.

---

## ba-launcher — Màn hình duyệt skill & cài toolkit (bản có giao diện của `ba-export`)

**Làm gì.** Mở một **trang web chạy tại chỗ trên máy bạn** (`http://127.0.0.1:4321`) làm "mặt tiền" của cả bộ toolkit. Cột trái liệt kê **mọi skill** chia theo nhóm, có ô tìm kiếm; chọn một skill thì bên phải hiện nội dung theo tab: **Nghiệp vụ** (chính các mô tả trong bộ giải thích này), **Chi tiết** (`SKILL.md` — đúng thứ Claude đọc), và một tab cho từng **file đồng hành** (`templates.md`, `conventions.md`, `rules/`, script…). Góc phải có nút **Cài vào dự án…**: bấm → hiện **hộp thoại chọn thư mục quen thuộc của macOS** → chọn thư mục gốc dự án → nó tự **kiểm tra** trước (dự án đó thiếu gì, bạn đã sửa tay file nào) → bấm **Cài đặt** là xong. Log chạy hiện ngay trên màn hình.

**Khi nào dùng.** Bạn muốn **xem toolkit có những gì** trước khi dùng, hoặc muốn **cài toolkit cho một dự án mà không phải gõ lệnh** — không cần nhớ đường dẫn `install.js`, không cần mở terminal ngoài một câu lệnh khởi động. Cũng tiện khi giới thiệu bộ toolkit cho đồng nghiệp.

**KHÔNG dùng khi.** Bạn đang ở trong phiên Claude Code và chỉ cần *chạy* một skill — gọi thẳng `ba-<tên>` (hoặc `ba-next` nếu chưa biết chạy gì) nhanh hơn nhiều. Cài đặt tự động trong CI/script thì dùng `ba-export` bằng dòng lệnh.

**Đầu vào.** Node (không cần cài gì thêm). Hộp thoại chọn thư mục chỉ có trên macOS — hệ khác thì dán đường dẫn vào ô nhập, mọi thứ còn lại như nhau.

**Đầu ra.** Không sinh tài liệu. Kết quả là **trang xem** (tạm thời, tắt server là hết) và — nếu bấm cài — **đúng những gì `ba-export` tạo ra** ở dự án đích.

**Ví dụ.** `node .claude/skills/ba-launcher/scripts/server.js` → mở trình duyệt → gõ "test" ở ô tìm kiếm để xem `ba-test`/`ba-test-e2e` khác nhau ra sao → bấm **Cài vào dự án…** → chọn thư mục dự án thật → **Cài đặt** → khởi động lại Claude Code ở dự án đó.

**Nó KHÔNG tự làm gì cả.** Trang render nội dung bằng `ba-portal`, cài đặt bằng `ba-export` — nên chính sách "giữ nguyên file bạn đã sửa cục bộ" và cách hiển thị tài liệu giống hệt khi chạy bằng lệnh.

---

## ba-sitemap — Trang luồng màn hình cho người dùng cuối

**Làm gì.** Gom **wireframe ASCII của mọi màn** về một trang, kèm **sơ đồ điều hướng** (lấy từ `03-overview.md`) và **các hành trình người dùng chính** (rút từ `usecase.md`), rồi sinh `docs/Ho-so/sitemap.html` tự chứa để **người dùng cuối/khách hàng** hiểu nhanh "làm việc gì thì đi qua những màn nào". Phần cơ giới (gom ascii, trích sơ đồ, xếp màn) do script `build.js` lo; phần phán đoán (viết hành trình) do skill viết vào `docs/Ho-so/sitemap-flows.md`. Không tự render — assemble một markdown rồi gọi `ba-portal --single`.

**Có gate (orchestrator nhẹ).** Trước khi build, `build.js --check` dò điều kiện và **CHẶN** nếu thiếu thứ cốt lõi: (1) `03-overview.md` không có sơ đồ điều hướng → dừng, chạy `ba-screens` trước; (2) hành trình nhắc mã màn `S..` không tồn tại → sửa `sitemap-flows.md`. Màn thiếu `ascii-screen.md` là gap **mềm** — hỏi bạn chạy `ba-screen-spec` cho màn đó hay build với ô trống (không tự bịa wireframe). Skill điều phối: gate readiness → lấp gap → viết hành trình → gate tham chiếu → build.

**Khi nào dùng.** Các màn đã có `ascii-screen.md` và `03-overview.md` có sơ đồ điều hướng; cần đưa cho người dùng cuối xem toàn cảnh flow (trước build hoặc lúc nghiệm thu).

**KHÔNG dùng khi.** Cần cẩm nang thao tác chi tiết (dùng `ba-userguide`); cần cổng đọc **mọi** tài liệu (dùng `ba-portal`). Chưa có `03-overview.md` → chạy `ba-screens` trước.

**Đầu vào.** `03-overview.md`, `ascii-screen.md` mỗi màn, `usecase.md`, `00-tracking.md`.

**Đầu ra.** `docs/Ho-so/sitemap.html` (bản end user) + nguồn `docs/Ho-so/sitemap.md`, `docs/Ho-so/sitemap-flows.md`.

**Ví dụ.** Sau khi 6 màn có wireframe → `ba-sitemap` → mở `docs/Ho-so/sitemap.html` thấy bản đồ điều hướng, 3 hành trình chính, và khung từng màn nối theo flow.

---

## ba-prototype — Prototype bấm-được (Vite + React) từ html-design + flow

**Làm gì.** Scaffold một **project Vite + React + React Router** ở `prototype/` làm **prototype tương tác**: ghép `html-design.html` của mọi màn (giữ nguyên high-fi bằng `<iframe>`) và **nối các chức năng theo flow** — bấm nút trên màn sẽ điều hướng sang màn đích. Điều hướng nhờ iframe same-origin (parent bắt được click) đối chiếu `src/wiring.json` (nút → màn), mà `wiring.json` được rút tự động từ các cạnh Mermaid `Sxx -->|nhãn| Syy` trong `sitemap-flows.md`. Script scaffold lo phần cơ giới; LLM tinh chỉnh `wiring.json` cho khớp chữ trên nút thật. Khung project luôn có 3 phần chuẩn: **thanh menu list màn hình** bên trái (liệt kê mọi màn, **ẩn/hiện được** qua nút `‹`/`›`), **popup trạng thái** góc phải (gom bộ nút Default/Loading/Empty/Error… — **kéo-thả** + **thu gọn/mở**, thay cho thanh trên đầu), và **khung iframe** giữ html-design high-fi.

**Khi nào dùng.** Đã có `html-design.html` các màn (`ba-html-design`) + `sitemap-flows.md` (`ba-sitemap`); cần **demo bấm-được** cho khách hàng, hoặc **hạt giống frontend** để dev phát triển tiếp.

**KHÔNG dùng khi.** Chỉ cần trang tài liệu flow để đọc (`ba-sitemap`). Chưa có html-design (chạy `ba-html-design`). Cần code sản phẩm thật đầy đủ (`dev-run` theo `plan.md`).

**Đầu vào.** `html-design.html` mỗi màn, `docs/Ho-so/sitemap-flows.md` (cạnh wiring), `03-overview.md` (tên màn). *Không* đọc trực tiếp file system design (`07-design-system.md`/`10-architecture.md`): độ trung thực UI đến từ `html-design.html` — vốn đã được `ba-html-design` dựng theo `07-design-system.md`. Đổi giao diện chuẩn → sửa design-system rồi chạy lại `ba-html-design`, không sửa trong prototype.

**Đầu ra.** Project `prototype/` (Vite + React + Router). Chạy: `cd prototype && npm install && npm run dev`.

**Lưu ý.** Script scaffold zero-dependency, nhưng **project sinh ra cần npm** (Vite/React) — ngoại lệ có chủ đích so với các artifact tự-chứa khác, vì mục tiêu là **dùng lại được**. Phần dùng lại = khung project (routing/nav/wiring); phần prototype = màn còn là HTML tĩnh, thay dần bằng component React. Đã kiểm: project sinh ra `npm install && npm run build` chạy được.

---

## ba-toolkit — Index / tra cứu pipeline

**Làm gì.** Không sinh file gì — nó là **bảng chỉ mục**: nhắc trình tự các bước BA, skill nào chạy tiếp theo, và trỏ tới `conventions.md`. Đóng vai "dispatcher" khi bạn không nhớ đang ở đâu trong quy trình.

**Khi nào dùng.** Bắt đầu xây phần mềm mới và muốn định hướng, hoặc giữa chừng quên bước kế tiếp là gì.

**KHÔNG dùng khi.** Bạn đã biết chính xác skill cần gọi — cứ gọi thẳng.

**Đầu vào.** —

**Đầu ra.** — (chỉ hiển thị hướng dẫn/định hướng ra chat).

**Ví dụ.** `ba-toolkit` → "bạn vừa xong `ba-functions`, bước tiếp theo là `ba-screens`".

---

## ba-diagram — Cửa vào vẽ sơ đồ (tự chọn loại)

**Làm gì.** Nhận một mô tả ("vẽ sơ đồ cho luồng duyệt đơn / vòng đời đơn hàng / quan hệ dữ liệu…") → **tự quyết định loại sơ đồ Mermaid hợp lý** (swimlane đa vai / flowchart / sequence / state / erDiagram / flowchart+subgraph cho kiến trúc / journey / gantt) → **vẽ đạt chuẩn**: an toàn cú pháp (render được), tô màu phân vai (theo design system nếu có, không thì bộ mặc định), đối chiếu độ phủ nghiệp vụ.

**Khi nào dùng.** Cần một sơ đồ nhưng **không chắc chọn loại nào**, hoặc yêu cầu vẽ diagram **không nằm trong một skill có sẵn** (ba-requirements/ba-screen-spec/ba-data-model đã tự vẽ sơ đồ của mình). Giải đúng tình huống "nhờ vẽ diagram mà bị vẽ nhầm flowchart cho luồng đa vai".

**KHÔNG dùng khi.** Sơ đồ đã thuộc một skill cụ thể (vd luồng nghiệp vụ trong `01-requirements` → `ba-requirements` tự vẽ). Việc đơn giản 3–4 bước tuyến tính → danh sách đánh số, không cần sơ đồ.

**Đầu vào.** Mô tả nghiệp vụ (luồng/trạng thái/dữ liệu/kiến trúc…). Thiếu thì skill hỏi 1–2 câu.

**Đầu ra.** Khối ```mermaid``` đúng loại, đã tô màu; chèn vào tài liệu liên quan hoặc trả về để bạn lưu (`recipes.md` trong skill là "sách công thức" cách vẽ từng loại).

**Ví dụ.** `ba-diagram "luồng khách đặt hàng, nhân viên duyệt, hệ thống tạo hóa đơn"` → nhận ra 3 vai trò → chọn **swimlane-beta** (không phải flowchart) → vẽ có màu.

---

## ba-reverse-doc — Dựng tài liệu BA từ tài liệu rời rạc

**Làm gì.** Khách đưa một đống tài liệu lộn xộn (đặc tả cũ, PDF, ảnh chụp email/chat, biên bản, Excel) → skill kiểm kê nguồn vào `docs/Ho-so/00-intake.md` (mỗi khẳng định kèm **trích dẫn** file/trang, phân loại "trích trực tiếp" vs "suy diễn", nêu **mâu thuẫn giữa nguồn**) rồi seed `docs/01-requirements.md` — phần trích trực tiếp ghi rõ nguồn, phần suy diễn/lấp chỗ trống nằm dưới banner 🔶 chờ xác nhận. Đọc được PDF và ảnh trực tiếp; Word/PowerPoint thì nhờ xuất PDF hoặc dán nội dung.

**Khi nào dùng.** Đã có tài liệu yêu cầu nhưng chưa có bộ `docs/` chuẩn. Là **chiều ngược từ TÀI LIỆU** — song sinh với `ba-reverse` (chiều ngược từ **CODE**).

## ba-meet — Biên bản họp (Minutes of Meeting)

**Làm gì.** Ghi chú họp thô / transcript → một biên bản chỉn chu `docs/Ho-so/meetings/<ngày>-<chủ-đề>.md`: ai họp, bàn gì, tách rõ **QUYẾT ĐỊNH** (`DEC`) khỏi **VIỆC CẦN LÀM** (`ACT` — mỗi việc một người phụ trách + một hạn), câu hỏi còn mở. Việc/quyết định nào là **thay đổi** tài liệu/chức năng đã chốt → skill mở luôn một **CR** trong sổ `00-cr.md`, nối cuộc họp vào pipeline thay vì để trôi.

**Khi nào dùng.** Sau mỗi cuộc họp có quyết định/giao việc. Mang các `ACT` còn mở từ biên bản trước sang để theo dõi liên tục.

## ba-task — Sổ Work Item (theo dõi công việc phát triển)

**Làm gì.** Cho **việc phát triển KHÔNG phải Change Request** một chỗ theo dõi có vòng đời, giống sổ CR nhưng cho *việc mới/kỹ thuật*: cấp mã `WI-01` vào sổ `docs/00-backlog.md`, ghi loại (Feature/Task/Bug/Tech/Spike), ai làm, đang tới đâu (`Backlog → Đang làm → Đang review → Xong`, hoặc `Blocked`/`Hủy`), nối trace `FR/F/S` và commit. Dùng `ba-task <mô tả>` để mở, `ba-task list` để xem, `ba-task status <mã>` để chuyển trạng thái.

**Khi nào dùng.** Bạn làm một việc dev — dựng tính năng mới đã lên kế hoạch, refactor, dựng CI, sửa bug, khảo sát (spike) — mà **không phải sửa cái đã chốt**. Trước đây các việc này chỉ để lại dấu ở tài liệu BA + git commit, không có chỗ theo dõi "đang làm tới đâu, xong chưa" như CR. `ba-task` lấp đúng chỗ đó.

**Khác `ba-change-request`.** CR = **thay đổi baseline** (sửa FR/F/S/rule đã chốt, cần cổng duyệt). WI = **việc mới trong phạm vi** hoặc **việc thuần kỹ thuật** (không đổi baseline mà tạo cái mới). Nghi ngờ: sửa yêu cầu đã chốt → CR; thêm mới/kỹ thuật → WI. Trong PM, đây là **work item / backlog item / issue**; bảng trạng thái là **Kanban**. Sổ này bổ khuyết cột `dev` của `00-tracking.md` (cột đó chỉ roll-up code theo màn, không ghi việc phi-màn hay xuất xứ).

## ba-changelog — Nhật ký thay đổi tài liệu đã chốt

**Làm gì.** Trả lời câu hỏi *"tài liệu đã chốt vừa bị đổi cái gì, ai chịu ảnh hưởng?"*. Mỗi lần một file trong màn **✅ Hoàn thành** bị sửa, một **hook** tự ghi lại dấu vết (file nào, to nhỏ ra sao) vào hàng đợi — không tốn gì, không làm phiền ai. Khi bạn gọi `ba-changelog`, nó gom các dấu vết đó thành **thay đổi trọn vẹn**, lấy diff từ git, rồi nhờ một **nhân viên chuyên trách** (agent `ba-change-observer`) đọc và viết lại **bằng ngôn ngữ nghiệp vụ**: *"siết quy tắc khoá tài khoản từ 5 lần sai còn 3 lần — người dùng dễ bị khoá hơn"*, kèm mã truy vết bị chạm. Kết quả vào sổ `docs/00-changelog.md`. `ba-changelog check` = chỉ xem có gì tồn đọng, không ghi.

**Khi nào dùng.** Định kỳ (cuối tuần/trước nghiệm thu), hoặc khi bạn nghi *"hình như tài liệu bị ai sửa mà không ai báo"*. `ba-accept` nên chạy nó trước khi nghiệm thu để sổ không còn tồn đọng.

**Điểm đắt giá — nó tố giác, không hợp thức hoá.** Thấy một thay đổi **đổi baseline** (quy tắc nghiệp vụ, điều kiện chấp nhận, phạm vi, quyền) mà **không có CR nào phủ**, nó gắn cờ `⚠️ chưa có CR` và đề xuất mở CR. Đây chính là lỗ hổng lớn nhất còn lại: sửa tài liệu **ngoài luồng skill** thì trước đây không sổ nào ghi — `00-cr.md` trống, `00-backlog.md` trống, `00-tracking.md` may lắm đổi được cái ngày.

**Khác `ba-change-request`.** CR hỏi *"được phép đổi không?"* **trước** khi sửa. Changelog ghi *"thực tế đã đổi gì"* **sau** khi sửa. Hai sổ không thay nhau: sửa đúng luồng (qua CR) thì changelog chỉ ghi mã `CR-NN` và im lặng; sửa lén thì changelog là nơi việc đó lộ ra.

**Ba rule cứng cho mỗi dòng nhật ký:** tiếng Việt theo **tác động nghiệp vụ** · **không chép diff** (muốn xem diff thì đã có git) · **bắt buộc gán mã truy vết**, không suy được thì ghi `⚠️ chưa map` chứ không bịa.

## ba-conformance — Đối chiếu code thật với tài liệu

**Làm gì.** Trả lời ba câu sau khi dev đã code: **chỗ nào lệch** (code làm khác đặc tả), **chỗ nào chưa làm** (tài liệu có mà code không có), **chỗ nào đã dev nhưng không mô tả trong tài liệu**. Kết quả vào `docs/00-conformance.md`.

**Nó dựa vào đâu để biết file code nào ứng với màn nào.** Không phải đoán — `plan.md` mà `ba-build` sinh ra đã khai sẵn: task này tạo file nào, phục vụ test case nào, bước nào đã tick. Một script đọc bảng đó rồi đối chiếu với ổ đĩa thật (miễn phí, không tốn AI); phần phải **đọc code để so hành vi** mới giao cho một nhân viên chuyên trách đọc.

**Khi nào dùng.** Ngay sau khi `dev-run` xong một màn, và **trước khi nghiệm thu** (`ba-accept`) — nghiệm thu một bản code lệch đặc tả là nghiệm thu nhầm.

**Vì sao cần, khi đã có cột `dev` trong `00-tracking.md`.** Cột đó do `dev-run` **tự khai**, nó chỉ nói *"màn này đã code"* — không nói *"code có đúng đặc tả không"*. Mọi cơ chế soát khác của toolkit (`ba-review`, `ba-trace`, `ba-changelog`) đều chỉ chạy **trong trục tài liệu**: tài liệu so với tài liệu. Đây là skill duy nhất bước qua ranh giới sang code.

**Luật quan trọng nhất — nó không tự phán ai đúng.** Thấy code khác tài liệu, nó **không** kết luận "code sai" cũng **không** kết luận "tài liệu lỗi thời". Code mới hơn tài liệu không có nghĩa code đúng. Nó nêu cả hai khả năng kèm bằng chứng (file, hàm), rồi bạn chốt: tài liệu đúng → sửa code; code đúng → **mở CR** cập nhật tài liệu. **Cấm sửa lén tài liệu cho khớp code** — làm vậy là hợp thức hoá một thay đổi không ai duyệt.

**Khác `ba-reverse`.** `ba-reverse` đi chiều ngược: **sinh tài liệu mới** từ code, dùng khi dự án chưa có tài liệu. `ba-conformance` dùng khi **đã có** tài liệu và muốn biết code có bám theo không.

## ba-new-skill — Xưởng làm ra skill mới cho chính bộ toolkit

**Làm gì.** Biến một ý tưởng thô (*"tôi muốn skill sản xuất dashboard"*) thành một skill **đúng chuẩn, đã test, đã đăng ký**. Nó phỏng vấn bạn theo **8 câu**, soát xem ý tưởng có **trùng với 55 skill sẵn có** không, **dừng lại cho bạn duyệt khung** trước khi tạo file nào, rồi sinh `SKILL.md` + template (+ script nếu có phần đếm được), tự điền 4 chỗ đăng ký, và **chạy thử 2 ca** trước khi báo xong.

**Khi nào dùng.** Bạn thấy mình làm đi làm lại một việc mà toolkit chưa có skill nào lo — và muốn đóng gói nó cho cả team dùng chung.

**Vì sao 6 câu quen thuộc là chưa đủ.** Khung 6 câu (mục đích · input · context · cách xử lý · điểm dừng · output) đủ để *mô tả* một skill. Nhưng skill sống trong bộ này còn phải trả lời hai câu nữa, và đây đúng là hai chỗ hay hỏng nhất:

- **Câu 7 — ranh giới:** skill mới khác skill nào sẵn có ở điểm nào? Không nói được một câu ranh giới rõ ràng thì đừng làm skill mới, hãy mở rộng skill cũ. Bộ này đã 55 skill; thêm một cái trùng việc làm cả bộ *khó dùng hơn*, không dễ hơn.
- **Câu 8 — phần nào đếm được?** Việc đếm được (file có tồn tại không, còn bao nhiêu test chưa chạy) nên giao cho một đoạn script chạy miễn phí, không nên để AI làm — vừa chậm vừa sót. Mấy script `status.js`, `ledger.js`, `scan-code.js` đều ra đời từ câu hỏi này.

**Ba chốt trong quy trình.** (1) Soát trùng lặp — trùng nhiều quá thì nó **dừng** và khuyên mở rộng skill cũ. (2) **HARD STOP** duyệt khung — bạn xem trước skill sẽ có mục gì, tạo file nào, rồi mới cho chạy. (3) **Test 2 ca** — một ca đủ thông tin, một ca **cố tình thiếu** để xem skill có chịu dừng lại hỏi không; nó tự bịa là hỏng ở đúng chỗ nguy hiểm nhất.

**Khác skill gần kề.** `ba-toolkit` chỉ *tra cứu* pipeline có sẵn; `ba-export` *mang* bộ skill sang dự án khác; **`ba-new-skill` làm ra skill mới**. Và nó chỉ sinh skill cho **chính repo toolkit** — skill cho dự án ngoài không chịu ràng buộc quy ước ở đây, dùng prompt mẫu trong tài liệu hướng dẫn thay vì skill này.

## ba-dashboard — Báo cáo một trang cho người quản lý

**Làm gì.** Gom mọi con số rải rác trong dự án thành **một trang duy nhất**: tài liệu đã xong bao nhiêu màn, code tới đâu, còn bao nhiêu yêu cầu thay đổi đang mở, việc nào bị chặn hay trễ hạn, kết quả nghiệm thu ra sao. Dành cho người quản lý cần nắm tình hình trong hai phút mà không phải mở mười tệp.

**Khi nào dùng.** Trước buổi họp tiến độ, hoặc khi cần báo cáo cho khách.

**Điều đáng lưu ý.** Phần **đếm** do script làm nên con số luôn khớp thực tế; phần **nhận định** mới do AI viết. Nghĩa là bạn có thể tin các con số, còn lời bình thì đọc như ý kiến.

**Khác skill gần kề.** Trang đầu của `ba-portal` cũng có vài con số nhưng chỉ đo độ phủ tài liệu; skill này nhìn cả tiến độ, thay đổi, rủi ro và nghiệm thu.


## ba-index — Tra cứu tài liệu mà không phải đọc cả tập

**Làm gì.** Dựng một cuốn mục lục tra cứu cho toàn bộ tài liệu dự án, rồi trả lời câu hỏi hẹp bằng đúng đoạn cần thiết. Hỏi *"quy tắc BRule-S05-07 nói gì"* thì nhận về đúng ba dòng của quy tắc đó, thay vì phải mở cả tập hồ sơ của màn Tổ chức.

Con số đo trên bộ tài liệu mẫu: mở cả hồ sơ một màn tốn khoảng **46.500 token**, hỏi qua mục lục tốn khoảng **115**. Với trợ lý AI, token là thời gian và tiền — và quan trọng hơn, là chỗ trong trí nhớ làm việc. Đọc thừa 46.000 token nghĩa là còn ít chỗ cho việc thật.

**Khi nào dùng.** Bất cứ lúc nào cần *một mẩu* thông tin: một quy tắc, một yêu cầu, một ca kiểm thử, hoặc câu hỏi *"ai đang phụ thuộc vào cái này"*. Cần đọc hiểu cả một màn thì vẫn mở tài liệu như thường.

**Điều quan trọng nhất phải nhớ.** Mục lục là bản **sinh ra**, tài liệu `.md` vẫn là bản gốc. Không ai sửa nội dung trong mục lục; sửa tài liệu rồi dựng lại mục lục (mất khoảng 0,15 giây). Nhờ vậy toàn bộ lịch sử thay đổi, việc so sánh phiên bản và quy trình duyệt thay đổi vẫn nguyên vẹn.

**Khác skill gần kề.** `ba-trace` dựng **toàn bộ** đồ thị truy vết để đo độ phủ — nó trả lời "còn chỗ nào hở". `ba-index` trả lời "cái này nói gì" cho **một** mã cụ thể. Một cái vẽ bản đồ, một cái chỉ đường tới một địa chỉ.

## ba-figure — Lấy một sơ đồ ra khỏi tài liệu để đem đi dùng

**Làm gì.** Biến một sơ đồ trong tài liệu thành hai thứ mang đi được: một **file ảnh vector** (`.svg`) thả thẳng vào slide, README hay Confluence, và một **trang web tự chứa** để gửi cho người khác mở — bấm vào một khối trên sơ đồ thì chỉ còn khối đó và những gì nối trực tiếp với nó, phần còn lại mờ đi. Có ô lọc theo tên, nút đổi nền sáng/tối, và nút tải ảnh.

**Khi nào dùng.** Sắp họp và cần hình để trình bày. Viết tài liệu ở nơi khác (Confluence, Notion, slide) và cần chèn sơ đồ vào. Hoặc muốn gửi riêng một sơ đồ cho khách xem mà không phải gửi cả bộ tài liệu.

**Vì sao không dùng cổng đọc.** Cổng đọc (`ba-portal`) dựng cả bộ tài liệu và mang theo một thư viện vẽ nặng 3,4 MB để vẽ sơ đồ mỗi lần ai đó mở trang. Cho một tấm hình, đó là mang cả nhà máy đi giao một cái bánh: bản của `ba-figure` nhẹ hơn khoảng **290 lần**, và nếu sơ đồ có lỗi thì lỗi hiện ra **lúc bạn dựng hình**, chứ không phải lúc khách mở ra xem.

**Điều cần biết trước.** Phần bấm-để-soi chỉ chạy với sơ đồ dạng lưu đồ và sơ đồ theo làn vai trò. Sơ đồ quan hệ dữ liệu, sơ đồ tuần tự và sơ đồ trạng thái vẫn ra ảnh đẹp nhưng không bấm được — công cụ nói rõ điều đó và ẩn luôn các nút tương tác, thay vì đưa bạn một trang bấm không ăn.

**Khác skill gần kề.** `ba-portal` = cổng đọc cả bộ tài liệu. `ba-sitemap` = một trang gộp luồng đi giữa các màn cho người dùng cuối. `ba-figure` = **một** hình, để đem ra khỏi tài liệu.

## ba-onepager — Gộp cả hồ sơ thành một tài liệu gửi đi được

**Làm gì.** Đọc toàn bộ hồ sơ trong `docs/` — vì sao làm dự án, quy trình hiện nay, người dùng là ai, chức năng gì, màn nào, dữ liệu ra sao, kiến trúc thế nào, lộ trình đến đâu, còn gì chưa chốt — rồi **viết lại thành một bài văn liền mạch**, không phải xếp các file cạnh nhau. Kết quả là **một trang HTML tự chứa**, double-click là mở, gửi qua email được.

Hai điều làm nó khác một bản in hồ sơ:

1. **Xoá ranh giới file.** Hồ sơ BA viết cho người làm: mỗi tài liệu một mục đích, đọc theo kiểu tra cứu. Bài này viết cho người **quyết**: đọc một mạch từ đầu đến cuối, cái sau nối tiếp cái trước. Bảng trong nguồn được chuyển thành câu, trừ chỗ bản chất dữ liệu vốn là bảng (danh mục chức năng, lộ trình, rủi ro).
2. **Mã truy vết ẩn khỏi thân bài.** Trong hồ sơ, `FR-01`, `BRule-S01-03` là công cụ làm việc; trong một bản trình bày, chúng làm vỡ mạch đọc. Nên thân bài viết bằng lời — *"khoá tài khoản sau năm lần sai trong mười lăm phút"* — còn mã dồn hết về **Phụ lục B · Ánh xạ truy vết** ở cuối. Đường quay về `docs/` vẫn còn nguyên, chỉ không nằm giữa câu văn.

**Khi nào dùng.** Cần một file duy nhất gửi cho lãnh đạo, khách hàng, hoặc đối tác thẩm định — người sẽ đọc để **quyết**, không phải để tra.

**KHÔNG dùng khi.** Người đọc cần tra cứu theo màn/theo tài liệu (dùng `ba-portal`); cần biết dự án đang chạy tới đâu (dùng `ba-dashboard`); chỉ cần gói của một phase (dùng `ba-release`).

**Điểm dừng quan trọng.** Skill **dừng lại trình mục lục và chờ duyệt** trước khi viết một chữ nào. Mục lục là chỗ duy nhất quyết định bài dài bao nhiêu và bỏ mục nào — duyệt sau khi đã viết mười lăm nghìn chữ thì không ai bảo bỏ mục nữa. Mục lục lấy khung mười lăm mục làm mặc định nhưng **co giãn theo hồ sơ có thật**: mục không có nguồn thì bỏ và nói rõ lý do, dự án có tài liệu mà khung không phủ thì đề xuất thêm mục.

**Không bịa là luật cứng.** Số liệu không có trong tài liệu tầm nhìn, quyết định kiến trúc không có ADR đỡ, ngày tháng không có trong lộ trình, quy tắc nghiệp vụ không có `BRule` sau lưng — đều **không được viết**. Thiếu thì ghi *"chưa đặt ngưỡng"* / *"chưa chốt"*, hoặc bỏ mục. Thứ tự ưu tiên khi hai luật đánh nhau: **đúng nguồn > truy vết đủ > mạch văn > đủ mười lăm mục** — mục cuối xếp bét là cố ý, vì cám dỗ lớn nhất của một tài liệu trình bày là viết cho đầy khung.

**Đầu ra.** `docs/Ho-so/00-onepager.md` + `docs/Ho-so/00-onepager.html`. Đây là bản **sinh ra**, không phải nguồn sự thật — sửa nội dung thì sửa ở `docs/` rồi chạy lại, đừng vá tay vào bản đã sinh.

**Khác skill gần kề.** `ba-portal` render cả bộ tài liệu nhưng **giữ ranh giới file** (sidebar, đọc như hồ sơ); `ba-onepager` **xoá ranh giới file** (một mạch, đọc như bản trình bày). `ba-dashboard` nói **tình trạng** dự án; `ba-onepager` nói **nội dung**, không mang số tiến độ nào. `ba-release` gộp **một phase**; `ba-onepager` gộp **cả dự án**.

## ba-start — Cửa vào cho người mới: xem demo rồi vào đúng cửa

**Làm gì.** Nhìn dự án bạn đang mở (đã có code chưa, có tài liệu khách gửi như Word/PDF/ảnh không, hay chỉ có ý tưởng) → cho xem **demo 10 phút** trên app mẫu TeamTasks: một cổng tài liệu thật mở bằng trình duyệt, rồi tận mắt thấy AI đặc tả một màn (mô tả nghiệp vụ, ca sử dụng, test case, thiết kế) → hỏi bạn chọn mức tài liệu (`lite` khuyến nghị / `mini` / `full`) → dẫn vào đúng skill bắt đầu cho dự án của bạn.

**Khi nào dùng.** Vừa cài bộ skill, chưa biết gõ gì; hoặc muốn cho đồng nghiệp xem bộ skill làm được gì trước khi dùng thật. Demo nằm riêng trong `veriline-demo/` (tự thêm vào `.gitignore`), không đụng `docs/` của bạn.

**Đầu vào.** Thư mục dự án (không cần gì thêm). **Đầu ra.** `veriline-demo/` + cổng tài liệu demo · sổ vào cửa `.claude/ba-start.json` (lựa chọn + mốc thời gian) · skill bắt đầu được chạy.

**Khác skill gần kề.** `ba-next` đọc `docs/` đã có để chỉ bước kế — dùng sau khi dự án đã có tài liệu (ba-start tự chuyển sang nó khi thấy `docs/`); `ba-toolkit` là bản đồ cả pipeline, ba-start dẫn đi một đường.

## Xem thêm

- `03-orchestrator.md` — orchestrator gọi `ba-review` ở mỗi gate và `ba-portal` ở bước cuối.
- `01-pipeline-core.md` — các skill sinh tài liệu mà nhóm này rà soát/xuất bản.
- `README.md` — index + bảng chọn theo tình huống.
