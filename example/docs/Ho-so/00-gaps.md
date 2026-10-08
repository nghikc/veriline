# Báo cáo gap — TeamTasks

> Scope lần chạy gần nhất: `all` · Ngày: `2026-09-14` · Đã phủ: `all` · Sinh bởi `ba-review`.
> Bổ sung 15/09/2026: G64–G69 từ dogfood `ac-judge`/`ac-jury` trên code S06 (không phải lần chạy `ba-review`) — giữ làm fixture, chưa mở CR.
> Lần phủ toàn dự án trước: `all` ngày `2026-08-04` (lần 4); các lần 5–9 soát hẹp. **Lần này ghi đè cả file** (scope `all`); lịch sử các lần trước còn trong git.

**Vì sao chạy lại `all`:** ba review agent chạy 11/09 để ghi golden đã tìm ra 4 mâu thuẫn thật mà bảng gap lúc đó khai sạch. Tài liệu đã đổi nhiều sau lần `all` gần nhất (04/08): CR-02..06, ADR, `F14`. "Sạch" của gaps là sạch theo lần soát cũ.

## Độ phủ (cơ giới)

| Kiểm | Kết quả |
|---|---|
| Ref gãy (`ba-trace`) | 0 |
| FR→F · F→S · S→R-S · R-S→TC · TC neo ngược | 14/14 · 13/14 (`F09` nền, có chủ đích) · 6/6 · 95/96 (`R-S02-19`) · 262/262 |
| Bảng markdown gãy · roll-up lệch (`check-md`) | 0/97 file |
| Mermaid lint · CR/WI marker ↔ sổ · ADR Draft | 0 · khớp 6/6 + 6/6 · 0 |
| Shell HTML (`check-shell`) | 0 lỗi · 1 cảnh báo (S03) |
| Khả thi (`scan-feasible`) | 2 (1 🟡 · 1 🟢) |
| Luật lặp (`scan-dup-rules`) | 7 cặp — **đều trùng, không chọi** |
| Giả định `⚠️ chưa xác nhận` | 10 dòng thật |
| Agent | `ba-consistency-reviewer` (project) · `ba-srs-quality-reviewer` (S01 — màn phức tạp) · `ba-diagram-reviewer` (sơ đồ 4.1). **Đã soát sâu 1/6 màn** (S01); 5 màn còn lại chỉ kiểm cơ giới — dưới trần 8 agent, chưa chạy screen-mode vì đây là lượt tái lập baseline |

## Gap: 69 — 🔴 5 · 🟡 29 · 🟠 10 · 🟢 25

| ID | Mức | Scope | Mô tả | Vị trí | Mốc | Sửa bằng |
|---|---|---|---|---|---|---|
| G01 | 🔴 | functions | `FR-10` nhắc T-1 (theo `DEC-04`) nhưng `F09` chỉ "đến hạn/quá hạn"; `08-roadmap` §3 vừa nói đã gộp T-1 vừa mô tả chưa gộp — dev đọc `F09` sẽ thiếu một nhánh cron | 02-functions.md F09 · 08-roadmap.md §3 | — | ba-functions · ba-discover roadmap |
| G02 | 🔴 | roadmap | Polling **~30 s** (`08-roadmap` §3 Next) vs **~60 s** (`00-vision` §4 Out-of-scope) cho cùng cơ chế; không NFR nào chốt — 30 s gấp đôi tải `F07`, đụng `NFR-01` | 08-roadmap.md §3 · 00-vision.md §4 | — | ba-discover roadmap (đổi vision → ba-change-request) |
| G03 | 🔴 | requirements | `CANCELLED`: `01-requirements` §4.1 ghi **chưa chốt** ("vẽ nhánh huỷ chưa chốt luật là bịa"), `FR-06` không có; nhưng `F06` và vision §4 coi là **Must** Phase 1 → dev tự đặt luật huỷ | 01-requirements.md §4.1/FR-06 · 02-functions.md F06 · 00-vision.md §4 | — | ba-requirements · ba-change-request |
| G04 | 🔴 | diagram | Sơ đồ 4.1: `FR-06` (CR-06) nói người duyệt = Team Lead **/ Org Admin**, nhưng `F`/`H` nằm lane `TL[Quản lý nhóm]` và ghi chú dòng 66 vẫn nói Org Admin không tham gia — lane hẹp hơn `FR` | 01-requirements.md §4.1 lane TL, node F/H, ghi chú dòng 66 | — | ba-requirements |
| G05 | 🔴 | S01 | `R-S01-04` chuyển hướng Dashboard **vô điều kiện** sau 200, chọi `R-S01-11`/`BRule-S01-07` (`phai_doi_mat_khau=true` cũng trả 200 mà bị cấm vào) — CR-02 chỉ vá `R-S01-08`, bỏ sót `R-S01-04` | srs.md R-S01-04, BRule-S01-07 | — | ba-screen-spec |
| G06 | 🟡 | screens | `F14` có ở `02-functions`/`08-roadmap` nhưng **vắng** trong bảng màn (S02 chỉ ghi F03,F04,F08) và bảng map của `03-overview`. *(Vế sơ đồ roadmap đã đóng 20/09/2026: Gantt + sơ đồ phụ thuộc nay đủ 14 `F`, ghi chú sửa theo; hook `H3` canh từ nay.)* | 03-overview.md · 08-roadmap.md §4 | — | ba-screens · ba-discover roadmap |
| G07 | 🟡 | S02 | `R-S02-19` (hỏi xác nhận trước khi đóng modal đã nhập) chưa có `TC` nào phủ | srs.md R-S02-19 · test.md | — | ba-test |
| G08 | 🟡 | S01 | `E-S01-09` (429 vượt hạn mức) chưa có câu chữ người dùng thấy — design-spec ghi "chưa có", srs chỉ quy định mã HTTP | srs.md E-S01-09 | — | ba-screen-spec |
| G09 | 🟡 | functions | `FR-02`/§7 nói Admin **tạo** tài khoản; `F13`, roadmap, vision nói **mời** — hai cơ chế khác phạm vi build (ai đặt mật khẩu đầu?) | 01-requirements.md FR-02 §7 · 02-functions.md F13 | — | ba-requirements |
| G10 | 🟡 | functions | `F06` cột Nguồn ghi "Team Lead (duyệt)" trong khi ma trận phân quyền cùng file và `FR-06` có Org Admin duyệt | 02-functions.md F06 | — | ba-functions |
| G11 | 🟡 | requirements | `NFR-03` khoá **tạm 15 phút** vs vision §6 "khoá **vĩnh viễn**, Admin mở thủ công"; và `F13` không có mở khoá/reset mật khẩu dù vision §4/§6 dựa vào đó | 01-requirements.md NFR-03 · 00-vision.md §4 §6 · 02-functions.md F13 | — | ba-requirements · ba-functions |
| G12 | 🟡 | roadmap | Import CSV: vision **Could** + `TR-02` "tháng đầu", nhưng không có `F`, roadmap khẳng định "không có Could" — cam kết không ai chịu | 00-vision.md §4 · 01-requirements.md TR-02 · 08-roadmap.md §2 | — | ba-functions · ba-discover roadmap |
| G13 | 🟡 | requirements | `StR-04` (đừng thông báo quá nhiều) được trace bởi `FR-09` (báo **mọi** lần đổi trạng thái); biện pháp `U-02` ở Later — trace trỏ vào điều làm ngược lại | 01-requirements.md StR-04, FR-09 · 08-roadmap.md §3 | — | ba-requirements |
| G14 | 🟡 | requirements | KPI `BO-02` 100% assignee+deadline dựa vào "ràng buộc bắt buộc (FR-04)" nhưng `FR-04`/`F04` chỉ liệt kê trường, không nói **bắt buộc** | 00-vision.md §5 · 01-requirements.md FR-04 | — | ba-requirements |
| G15 | 🟡 | diagram | Sơ đồ 4.1: `FR-09` đòi báo mọi lần đổi trạng thái nhưng `D` (TODO→IN_PROGRESS) và `E` (→IN_REVIEW) không có node lane `HT`; ghi chú 31/08 tự nhận "đã phủ" sau khi chỉ vá nhánh trả lại | 01-requirements.md §4.1 node D, E | — | ba-requirements |
| G16 | 🟡 | diagram | Sơ đồ 4.1: cạnh `E → F` nhảy thẳng TV→TL không qua Hệ thống — người duyệt không có sự kiện kích hoạt (mọi bàn giao khác đều qua `HT`) | 01-requirements.md §4.1 cạnh E→F | — | ba-requirements |
| G17 | 🟡 | diagram | Sơ đồ 4.1: lane `HT` trace `StR-04` nhưng chỉ có 3 node phát thông báo, vòng trả lại không giới hạn → thông báo không giới hạn; chưa có luật để vẽ → đưa vào câu hỏi mở | 01-requirements.md §4.1 lane HT | — | ba-requirements |
| G18 | 🟡 | S01 | `R-S01-04`: "(hoặc URL gốc trước redirect)" — không luật nào nói lưu ở đâu, chọn khi nào, có chống open-redirect | srs.md | — | ba-screen-spec |
| G19 | 🟡 | S01 | `R-S01-01`: `E-S01-02`/`E-S01-04` trace về đây nhưng nó chỉ đòi hiển thị form; không `R-S` nào đặt luật validate bắt buộc/độ dài 8–128 client-side | srs.md | — | ba-screen-spec |
| G20 | 🟡 | S01 | `R-S01-02`: "RFC 5321" không xác định tập chấp nhận; AC chỉ 2 ca; luật trim chỉ ở `E-S01-01`; "xuất hiện ngay" không mốc đo | srs.md | — | ba-screen-spec |
| G21 | 🟡 | S01 | `R-S01-03`: gộp 3 hành vi (gọi API · nhận token · loading + disable) — loading chỉ có ở AC, người đọc câu yêu cầu sẽ không cài | srs.md | — | ba-screen-spec |
| G22 | 🟡 | S01 | `R-S01-07`: chỉ phủ `403 PERM_LOCKED`, nhưng `BRule-S01-08`/`E-S01-13` (`INACTIVE` cũng 403, câu khác) trace về đây → INACTIVE hiện sai thông báo | srs.md | — | ba-screen-spec |
| G23 | 🟡 | S01 | `R-S01-08`: một ô chứa luật redirect + định nghĩa session + lý giải + ngoại lệ cờ — không kiểm chứng như một yêu cầu | srs.md | — | ba-screen-spec |
| G24 | 🟡 | S01 | `R-S01-09`: "đăng xuất từ bất kỳ màn nào" là hành vi app shell, nhốt trong srs S01 — sai tầm | srs.md | — | ba-screen-spec |
| G25 | 🟡 | S01 | `R-S01-N01..N05`: bảng NFR thiếu cột `Kiểm chứng`/`Nguồn`/`Lý do` (bảng FR có đủ) | srs.md | — | ba-screen-spec |
| G26 | 🟡 | S01 | `R-S01-N03`: "≤ 2 giây ở mạng bình thường" — không p95, không tải đồng thời; `NFR-01` đo p95@200 user | srs.md | — | ba-screen-spec |
| G27 | 🟡 | S01 | `R-S01-N04, N05`: trace sai nguồn: `N04` → `NFR-05` (3 bước tạo việc), `N05` → `NFR-07` (trình duyệt); không có NFR accessibility thượng nguồn | srs.md | — | ba-screen-spec |
| G28 | 🟡 | S01 | `BRule-S01-05`: ô luật tự khai "xung đột CHƯA giải quyết — đừng viết code theo bên nào" nhưng bảng Giả định ghi "không có" và không CR nào mở | srs.md | — | ba-screen-spec |
| G29 | 🟡 | S01 | `BRule-S01-03 · E-S01-07`: mốc khoá vĩnh viễn: BRule nói lần sai thứ **16**, `E-S01-07` + sơ đồ trạng thái nói **15** | srs.md | — | ba-screen-spec |
| G30 | 🟡 | S01 | `BRule-S01-06`: gộp ≥5 luật (TTL 8h · 30 ngày · silent refresh · 7 ngày · blocklist jti) — "Kích hoạt khi" phải liệt 3 điều kiện rời | srs.md | — | ba-screen-spec |
| G31 | 🟡 | S01 | `BRule-S01-03/06/07, R-S01-11`: ERD màn thiếu `so_lan_khoa_tam`, `lan_dung_cuoi`, `phai_doi_mat_khau` mà 3 luật đọc/ghi (05-data-model có đủ → ERD màn cũ) | srs.md | — | ba-screen-spec |
| G32 | 🟠 | roadmap | Giả định `GĐ-01` còn `⚠️ chưa xác nhận` | Ho-so/08-roadmap.md | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G33 | 🟠 | roadmap | Giả định `GĐ-02` còn `⚠️ chưa xác nhận` | Ho-so/08-roadmap.md | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G34 | 🟠 | roadmap | Giả định `GĐ-03` còn `⚠️ chưa xác nhận` | Ho-so/08-roadmap.md | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G35 | 🟠 | roadmap | Giả định `GĐ-04` còn `⚠️ chưa xác nhận` | Ho-so/08-roadmap.md | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G36 | 🟠 | roadmap | Giả định `GĐ-05` còn `⚠️ chưa xác nhận` | Ho-so/08-roadmap.md | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G37 | 🟠 | roadmap | Giả định `GĐ-06` còn `⚠️ chưa xác nhận` | Ho-so/08-roadmap.md | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G38 | 🟠 | S02 | Giả định `GĐ-S02-01` còn `⚠️ chưa xác nhận` | S02/srs.md | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G39 | 🟠 | S02 | Giả định `GĐ-S02-02` còn `⚠️ chưa xác nhận` | S02/srs.md | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G40 | 🟠 | S02 | Giả định `GĐ-S02-03` còn `⚠️ chưa xác nhận` | S02/srs.md | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G41 | 🟠 | S06 | Giả định `GĐ-S06-01` còn `⚠️ chưa xác nhận` | S06/srs.md | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G42 | 🟢 | luật-lặp | Luật `PERM_LOCKED` phát biểu lại ở 2 màn (**trùng**, không chọi): BRule-S01-05/08 · S05-13 — nâng lên luật cấp dự án ở `01-requirements`, màn trỏ tới | srs.md các màn | — | ba-requirements |
| G43 | 🟢 | luật-lặp | Luật `CR-04 TTL token` phát biểu lại ở 2 màn (**trùng**, không chọi): BRule-S01-06 · S06-06 — nâng lên luật cấp dự án ở `01-requirements`, màn trỏ tới | srs.md các màn | — | ba-requirements |
| G44 | 🟢 | luật-lặp | Luật `INACTIVE` phát biểu lại ở 2 màn (**trùng**, không chọi): BRule-S01-08 · S05-09 — nâng lên luật cấp dự án ở `01-requirements`, màn trỏ tới | srs.md các màn | — | ba-requirements |
| G45 | 🟢 | luật-lặp | Luật `CR-02 phai_doi_mat_khau` phát biểu lại ở 2 màn (**trùng**, không chọi): BRule-S01-07 · S05-07 — nâng lên luật cấp dự án ở `01-requirements`, màn trỏ tới | srs.md các màn | — | ba-requirements |
| G46 | 🟢 | luật-lặp | Luật `FR-13 email duy nhất` phát biểu lại ở 2 màn (**trùng**, không chọi): BRule-S04-02 · S05-06 — nâng lên luật cấp dự án ở `01-requirements`, màn trỏ tới | srs.md các màn | — | ba-requirements |
| G47 | 🟢 | luật-lặp | Luật `F13 đổi vai trò` phát biểu lại ở 2 màn (**trùng**, không chọi): BRule-S04-03 · S05-01 — nâng lên luật cấp dự án ở `01-requirements`, màn trỏ tới | srs.md các màn | — | ba-requirements |
| G48 | 🟢 | luật-lặp | Luật `https:// ảnh/logo` phát biểu lại ở 2 màn (**trùng**, không chọi): BRule-S04-08 · S05-10 — nâng lên luật cấp dự án ở `01-requirements`, màn trỏ tới | srs.md các màn | — | ba-requirements |
| G49 | 🟢 | S01 | 4 `E-S` đầu bảng được TC phủ theo **nội dung** (qua `R-S`/GWT) nhưng cột Nguồn không ghi mã `E-S` — máy (`ba-trace`, hook S4) không đo được | test.md cột Nguồn | — | ba-test |
| G50 | 🟢 | S02 | 4 `E-S` đầu bảng được TC phủ theo **nội dung** (qua `R-S`/GWT) nhưng cột Nguồn không ghi mã `E-S` — máy (`ba-trace`, hook S4) không đo được | test.md cột Nguồn | — | ba-test |
| G51 | 🟢 | S03 | 4 `E-S` đầu bảng được TC phủ theo **nội dung** (qua `R-S`/GWT) nhưng cột Nguồn không ghi mã `E-S` — máy (`ba-trace`, hook S4) không đo được | test.md cột Nguồn | — | ba-test |
| G52 | 🟢 | S04 | 4 `E-S` đầu bảng được TC phủ theo **nội dung** (qua `R-S`/GWT) nhưng cột Nguồn không ghi mã `E-S` — máy (`ba-trace`, hook S4) không đo được | test.md cột Nguồn | — | ba-test |
| G53 | 🟢 | S05 | 4 `E-S` đầu bảng được TC phủ theo **nội dung** (qua `R-S`/GWT) nhưng cột Nguồn không ghi mã `E-S` — máy (`ba-trace`, hook S4) không đo được | test.md cột Nguồn | — | ba-test |
| G54 | 🟢 | S06 | 4 `E-S` đầu bảng được TC phủ theo **nội dung** (qua `R-S`/GWT) nhưng cột Nguồn không ghi mã `E-S` — máy (`ba-trace`, hook S4) không đo được | test.md cột Nguồn | — | ba-test |
| G55 | 🟢 | requirements | `NFR-06` "không data bleed" không có số đo | 01-requirements.md NFR-06 | — | ba-requirements |
| G56 | 🟢 | functions | `F09` không có endpoint — chạy nền, xác nhận là có chủ đích (scan-feasible) | 02-functions.md F09 | — | ba-api-spec |
| G57 | 🟢 | S03 | `html-design` có 14 nút trạng thái — cân nhắc tách nhóm statebar (check-shell) | html-design.html | — | ba-html-design |
| G58 | 🟢 | screens | `F02` đăng xuất: bảng màn ghi thuộc S01, bảng map ghi S02 — để một màn chủ; và `F02` mượn `FR-01` vốn không nói huỷ session | 03-overview.md · 02-functions.md F02 | — | ba-screens · ba-requirements |
| G59 | 🟢 | vision | SSO "hoãn sang **giai đoạn 2**" (vision) vs Later/**Phase 3** (roadmap) — trùng tên với Phase 2 | 00-vision.md §4 | — | ba-change-request |
| G60 | 🟢 | S01 | `R-S01-10` Nguồn = design-spec (hạ nguồn) — nguồn vòng tròn | srs.md R-S01-10 | — | ba-screen-spec |
| G61 | 🟢 | S01 | `R-S01-N01` rate-limit "ở tầng API" — yêu cầu backend nhốt trong srs màn | srs.md R-S01-N01 | — | ba-screen-spec |
| G62 | 🟢 | S01 | `BRule-S01-08` đứng trước `-07`; ma trận lỗi `E-S01-13 → 12 → 11` — lệch thứ tự, dễ tưởng thiếu mã | srs.md | — | ba-screen-spec |
| G63 | 🟢 | diagram | Sơ đồ 4.1: node kết thúc `J` ở lane Hệ thống (kết thúc không phải việc Hệ thống làm); `A` không nêu tác nhân khởi phát | 01-requirements.md §4.1 | — | ba-requirements |
| G64 | 🟡 | S06 | Nút "Tạo tài khoản" khi form trống: `srs.md` bảng trạng thái `TRONG`/`DANG_NHAP` nói **disable**, `design-spec.md` §Empty nói **active**, TC-S06-04/13/14/15 cần bấm được; bảng trạng thái còn sai trace 3/7 dòng. Hội đồng `ac-jury` (15/09) đề xuất theo `design-spec.md:45` — người chốt (giữ làm fixture) | srs.md :259-267 · design-spec.md :45,:50 · test.md | — | ba-change-request (CR sửa 2 ô bảng trạng thái) |
| G65 | 🟡 | S06 | `06-api-spec.md` vs `srs.md`: tên trường `mat_khau`/`password`, `nguoi_dung.vai_tro` `ORG_ADMIN`/`OrgAdmin`, mã lỗi dữ liệu sai 400 vs 422 (plan theo 422) | 06-api-spec.md :91-105 · srs.md :80-86 | — | ba-change-request |
| G66 | 🟢 | S06 | Hai câu thông báo email trùng: `srs.md:265` "Email này đã được đăng ký." vs `E-S06-03` "Email đã được sử dụng. Vui lòng dùng địa chỉ khác hoặc đăng nhập." (code/test theo E-S06-03) | srs.md :98,:265 | — | ba-screen-spec |
| G67 | 🟢 | S06 | `plan.md` Task 3 ghi "Edit `src/middleware/auth-guard.ts` — mở rộng middleware hiện có" nhưng plan S01 Task 3 mới tạo file đó; đứng một mình S06 thì file chưa tồn tại | plan.md Task 3 | — | ba-build |
| G68 | 🟡 | S06 | `R-S06-N03` rate limit 429 (>10 req/phút/IP) không task nào trong `plan.md` nhận, không TC nào phủ | srs.md :46 · plan.md | ba-build | ba-build (thêm task) |
| G69 | 🟢 | S06 | `R-S06-N06` "đúng 4 Tab tới nút" buộc hai nút icon mắt `tabIndex=-1` → người dùng bàn phím không tới được toggle; `R-S06-N07` trace `NFR-07` nhưng NFR-07 là tương thích trình duyệt, dự án không có NFR tiếp cận | srs.md :49-50 · 01-requirements.md :118 | — | ba-requirements (NFR tiếp cận) hoặc PD |

## Nợ có hạn (🟠)

| ID | Mô tả | Mốc | Sửa bằng |
|---|---|---|---|
| G32 | Giả định `GĐ-01` còn `⚠️ chưa xác nhận` | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G33 | Giả định `GĐ-02` còn `⚠️ chưa xác nhận` | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G34 | Giả định `GĐ-03` còn `⚠️ chưa xác nhận` | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G35 | Giả định `GĐ-04` còn `⚠️ chưa xác nhận` | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G36 | Giả định `GĐ-05` còn `⚠️ chưa xác nhận` | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G37 | Giả định `GĐ-06` còn `⚠️ chưa xác nhận` | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G38 | Giả định `GĐ-S02-01` còn `⚠️ chưa xác nhận` | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G39 | Giả định `GĐ-S02-02` còn `⚠️ chưa xác nhận` | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G40 | Giả định `GĐ-S02-03` còn `⚠️ chưa xác nhận` | ba-build | skill nguồn — vòng "Xác nhận giả định" |
| G41 | Giả định `GĐ-S06-01` còn `⚠️ chưa xác nhận` | ba-build | skill nguồn — vòng "Xác nhận giả định" |

## Cần xác nhận (không phải gap theo luật)

- `NFR-04` uptime ≥ 99,5%: `ba-trace` không thấy nơi hiện thực ở tầng màn — đúng, vì đó là NFR hạ tầng; `10-architecture` §1 đã có driver (1 region, health-check, backup). Xác nhận là đủ hay cần mục vận hành riêng.
- 5 màn S02–S06 chưa soát screen-mode bằng `ba-consistency-reviewer` (srs↔usecase↔test) trong lượt này.

## Rủi ro đã chấp nhận (không phải gap — 2026-08-04, SH-06)

Bảy gap giả định trước đây là **một vấn đề duy nhất**: không có stakeholder/người dùng thật để chạy vòng xác nhận, vì TeamTasks là **dự án mẫu của BA Toolkit**. Đánh dấu "Đã xác nhận" sẽ là xác nhận hình thức (tệ hơn để nguyên); để `⚠️ chưa xác nhận` mãi thì gate kẹt vĩnh viễn và số gap mất ý nghĩa.

Giải pháp: dùng trạng thái thứ tư **`🔓 Chấp nhận rủi ro`** (bổ sung vào `conventions.md` cùng ngày) — hợp lệ **chỉ khi** ghi đủ *ai quyết · ngày · vì sao chưa xác nhận được · điều gì kích hoạt rà lại*. Đây là **chấp nhận rủi ro có ghi nhận**, không phải làm gate im lặng: điều kiện rà lại xảy ra mà chưa ai rà thì `ba-review` chấm 🟡 trở lại.

| Tài liệu | Số giả định | Điều kiện rà lại (khi xảy ra → quay lại 🟡) |
|---|---|---|
| `00-vision.md` | 6 | Dự án dùng cho khách hàng thật, **hoặc** trước khi có quyết định đầu tư bám vào con số §3 |
| `00-process.md` | 7 | Có nhóm thật dùng thử, hoặc có buổi quan sát/phỏng vấn quy trình hiện tại |
| `09-uat.md` | 4 | **Lên lịch buổi UAT đầu tiên** — phải chốt người ký + môi trường/dữ liệu trước khi chạy kịch bản |
| `00-personas.md` | 5 | MVP chạy 1 tháng (có analytics), hoặc phỏng vấn được 2–3 người mỗi nhóm |
| `12-api-integration.md` | 5 | **Trước khi `dev-run` viết client email cho F09** — bắt buộc đối chiếu tài liệu API chính thức |
| `08-roadmap.md` | 1 | Cam kết lịch phát hành với khách hàng — PO phải xác nhận lại số RICE |
| `00-urd.md` | 8 | Phỏng vấn 2–3 người mỗi nhóm, **hoặc** trước khi mở rộng phạm vi Phase 2 dựa trên các nhu cầu này |

**Điều kiện gần nhất sẽ kích hoạt:** `12-api-integration.md` — chạm ngay khi `dev-run` bắt đầu làm F09 (Phase 2). `09-uat.md` chạm khi `ba-accept` lên lịch UAT.

> Với **dự án thật**, cách xử đúng không phải bảng này mà là chạy vòng "Xác nhận giả định" với người thật — `🔓 Chấp nhận rủi ro` chỉ dành cho thứ *thật sự không xác nhận được lúc này*.

## Ghi chú độ tin

- Lượt này là **lần golden check thật đầu tiên** cho review agent (cùng file, cùng prompt với golden 11/09). Kết quả: diagram mã 1,0 · srs-quality 0,82 · consistency **0,52** — ba 🔴 của consistency giống hệt hai lần, đuôi 🟡/🟢 dao động (thêm 2, rớt 4). Mức 🔴 **đổi chỗ** giữa hai lần ở 2/3 agent dù tổng 🔴 không đổi. Bảng trên lấy theo lần chạy 14/09.
- Cơ chế golden đã chỉnh hai lần trong lượt này theo số đo: chỉ so mã canon (bỏ nhãn node tự do), chủ đề không tính điểm. Xem `docs/decisions/08` của toolkit.
