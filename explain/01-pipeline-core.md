---
type: skill-explainer
group: pipeline-core
updated: 2026-07-15
---

# Nhóm luồng chính (pipeline) — 9 skill: 7 làm nên dây chuyền + 2 tùy chọn (`ba-test-e2e`, `ba-api-test`; checklist là chế độ của `ba-test`, wireframe lo-fi là chế độ `lofi` của `ba-html-design`, phỏng vấn làm rõ là `ba-discover brainstorm`)

> Đây là **xương sống** của BA Toolkit: bảy skill chạy nối tiếp nhau, mỗi skill nhận đầu ra của skill trước, thêm một lớp chi tiết, rồi chuyển tiếp. Chạy hết bảy bước là bạn đi từ một ý tưởng (đã làm rõ bằng `ba-discover brainstorm` nếu còn mơ hồ) tới kế hoạch code cho từng màn hình.

## Bức tranh chung — dây chuyền chạy theo thứ tự nào

```
Ý tưởng thô
   │  ba-discover brainstorm      (làm rõ, tùy chọn nhưng khuyến nghị)
   ▼  → docs/Ho-so/00-brainstorm.md
   │  ba-requirements    → docs/01-requirements.md  (+ docs/Ho-so/00-glossary.md)
   │  ba-functions       → docs/02-functions.md
   │  ba-screens         → docs/03-overview.md + khung folder màn + docs/00-tracking.md
   ▼
   ┌─── lặp cho TỪNG màn hình ─────────────────────────────┐
   │  ba-screen-spec  → 6 file phân tích cho màn            │
   │  ba-test         → test.md                            │
   │  ba-html-design  → html-design.html                   │
   └────────────────────────────────────────────────────────┘
   │  ba-build          → plan.md (mỗi màn) — dừng ở kế hoạch
   ▼
```

Ba skill đầu (`requirements → functions → screens`, cùng bước làm rõ `ba-discover brainstorm` trước đó) là **cấp hệ thống, chạy một lần** cho cả dự án. Ba skill giữa (`screen-spec → test → html-design`) là **cấp màn hình, lặp cho từng màn**. Skill cuối (`build`) lập kế hoạch code cho từng màn.

Một câu để nhớ ranh giới: **`ba-screens` là bước cuối cùng làm việc với "cả hệ thống"; từ `ba-screen-spec` trở đi mọi thứ tính theo TỪNG màn.**

---

## ba-requirements — Viết bản yêu cầu có cấu trúc

**Làm gì.** Biến ý tưởng thô (hoặc biên bản brainstorm) thành **bản yêu cầu tổng** phân loại theo chuẩn: Business Requirement (`BR`), Stakeholder Requirement (`StR`), Functional/Non-functional Requirement (`FR`/`NFR`), quy tắc nghiệp vụ (`BRule`)… mỗi yêu cầu có ưu tiên (MoSCoW), nguồn, trạng thái, truy vết. Kèm một sơ đồ **luồng nghiệp vụ chính** phân làn theo vai trò.

**Khi nào dùng.** Bước đầu tiên khi muốn có tài liệu chính thức từ một ý tưởng. Là bước 1 của pipeline.

**KHÔNG dùng khi.** Bạn chỉ muốn liệt kê chức năng (đó là `ba-functions`), hay chưa làm rõ ý tưởng phức tạp (nên chạy `ba-discover brainstorm` trước).

**Đầu vào.** `docs/Ho-so/00-brainstorm.md` (nếu có) hoặc ý tưởng thô.

**Đầu ra.** `docs/01-requirements.md` (bản yêu cầu) **và** `docs/Ho-so/00-glossary.md` — đây là skill **khởi tạo từ điển thuật ngữ** trung tâm cho cả dự án.

**Ví dụ.** Từ ý tưởng app đặt lịch → sinh `01-requirements.md` với BR-01 "tăng tỉ lệ lấp đầy lớp", các FR đặt lịch/hủy/nhắc lịch, ưu tiên MoSCoW.

---

## ba-functions — Liệt kê chức năng theo module

**Làm gì.** Đọc bản yêu cầu và **phân rã thành danh sách chức năng** (`F01`, `F02`…) gom theo module, mỗi chức năng truy vết ngược về `FR`/`BR`, có ưu tiên MoSCoW. Kèm một Ma trận CRUD (thực thể × chức năng) để soát chức năng bị bỏ sót.

**Khi nào dùng.** Đã có `01-requirements.md`, cần bước tiếp theo: "hệ thống này gồm những chức năng gì". Là bước 2.

**KHÔNG dùng khi.** Chưa có bản yêu cầu (chạy `ba-requirements` trước), hoặc bạn cần danh sách màn hình (đó là `ba-screens`). Lưu ý: **chức năng ≠ màn hình** — một chức năng có thể trải nhiều màn, một màn phục vụ nhiều chức năng.

**Đầu vào.** `docs/01-requirements.md`.

**Đầu ra.** `docs/02-functions.md`.

**Ví dụ.** Từ yêu cầu → liệt kê F01 "Đăng nhập", F02 "Đặt lịch", F03 "Hủy lịch", F04 "Nhắc lịch"… gom theo module Auth / Booking.

---

## ba-screens — Suy ra màn hình + điều hướng + khung thư mục

**Làm gì.** Từ danh sách chức năng, **suy ra các màn hình** (`S01`, `S02`…), map màn ↔ chức năng, vẽ **sơ đồ điều hướng**, rồi **tạo sẵn khung thư mục rỗng** cho từng màn và **khởi tạo ma trận truy vết** `00-tracking.md` (mỗi màn một dòng, mọi ô còn `⬜` — chưa làm).

**Khi nào dùng.** Đã có `02-functions.md`, cần biết "hệ thống gồm những màn nào, đi lại giữa chúng ra sao". Là bước 3 — và là **bước cuối** làm việc ở cấp toàn hệ thống.

**KHÔNG dùng khi.** Muốn đặc tả nội dung chi tiết bên trong một màn (đó là `ba-screen-spec`). `ba-screens` chỉ dựng **danh sách và khung**, không viết nội dung từng màn.

**Đầu vào.** `docs/02-functions.md`.

**Đầu ra.** `docs/03-overview.md` (bảng màn + ma trận CRUD-to-Screen + sơ đồ điều hướng), `docs/00-tracking.md` (ma trận truy vết), và **khung thư mục rỗng** cho mỗi màn dưới container `docs/Screen-spec/` (vd `docs/Screen-spec/Authentication/S01 - Login/`).

**Ví dụ.** Từ các chức năng → sinh S01 Login, S02 Dashboard, S03 BookingList… + sơ đồ điều hướng + tạo folder rỗng cho từng màn.

---

## ba-screen-spec — Đặc tả chi tiết MỘT màn hình

**Làm gì.** Với **một màn hình cụ thể**, sinh **6 file phân tích**: wireframe khung ASCII, brainstorm màn, SRS (yêu cầu màn + luồng + validation từng trường), use case, user story (theo GWT + INVEST), và design-spec (bản brief UI cho designer: các trạng thái, nút hành động, câu chữ, khả năng tiếp cận).

**SRS theo chuẩn ISO/IEC/IEEE 29148 + BABOK.** Mỗi yêu cầu chức năng `R-S..` ngoài acceptance còn ghi **`Kiểm chứng`** (cách sẽ chứng minh yêu cầu đạt: inspection/analysis/demonstration/test — `test` là đầu vào để `ba-test` ưu tiên sinh TC tự động) và **`Lý do`** (rationale: *vì sao* yêu cầu cần tồn tại, giúp bắt yêu cầu thừa). SRS có mục **"Giả định & Ràng buộc"** tách bạch (`GĐ-S..` giả định · `RB-S..` ràng buộc bắt buộc). **Thích ứng theo độ phức tạp màn:** màn phức tạp (≥3 vai trò / ≥5 quyết định / có trạng thái / có hệ ngoài) khai đủ và được agent **`ba-srs-quality-reviewer`** (qua `ba-review <màn>`) soi theo 9 đặc tính chất lượng của 29148 (không mơ hồ, đơn nhất, kiểm chứng được…); màn đơn giản giữ phần cốt lõi cho gọn. Điều chưa xác nhận ghi **⚠️ chưa xác nhận**, không bịa.

**Khi nào dùng.** Đã có `03-overview.md`, giờ đào sâu vào từng màn. Là bước 4 — chạy **một màn mỗi lần** (nhiều màn thì bảo Claude chạy song song).

**KHÔNG dùng khi.** Chưa có overview (chạy `ba-screens` trước), hoặc bạn muốn dựng giao diện HTML (đó là `ba-html-design`) hay viết kiểm thử (đó là `ba-test`).

**Đầu vào.** Folder màn đã tồn tại + `docs/01-requirements.md`, `02-functions.md`, `03-overview.md`.

**Đầu ra.** 6 file trong folder màn: `ascii-screen.md`, `brainstorm.md`, `srs.md`, `usecase.md`, `userstory.md`, `design-spec.md`. Đồng thời cập nhật 6 ô của màn trong `00-tracking.md` thành `✅`.

**Ví dụ.** `ba-screen-spec Login` → viết đầy đủ 6 file cho màn `S01 - Login`.

---

## ba-test — Viết tài liệu kiểm thử cho một màn

**Làm gì.** Từ `srs.md` và `usecase.md` của một màn (và `checklist.md` nếu có — mỗi `CL-S..` phải có ≥1 `TC` phủ), thiết kế **bộ test case** theo từng chức năng, dùng các kỹ thuật chuẩn (phân lớp tương đương EP, giá trị biên BVA, bảng quyết định DT, chuyển trạng thái ST). Mỗi test case có mã `TC-…`, loại, độ rủi ro, ưu tiên, **dữ liệu test cụ thể**, kết quả mong đợi, cách chạy và cột trạng thái để theo dõi thực thi. Kèm bảng roll-up ở đầu file. **Đọc cột `Kiểm chứng` của SRS**: yêu cầu ghi `test` bắt buộc có ≥1 TC (ứng viên chạy tự động cho `ba-test-e2e`); `inspection`/`analysis` thì kiểm bằng soi/suy luận, không ép ca chạy.

**Khi nào dùng.** Đã có đặc tả (`srs`/`usecase`) của màn, cần bộ kiểm thử. Là bước 6.

**KHÔNG dùng khi.** Chưa đặc tả màn (chạy `ba-screen-spec` trước). Đây là tài liệu test **thiết kế**, không phải chạy test tự động.

**Đầu vào.** `srs.md` và `usecase.md` của màn.

**Đầu ra.** `test.md` trong folder màn (+ cập nhật ô `test` trong tracking).

**Ví dụ.** `ba-test Login` → sinh các TC cho đăng nhập đúng/sai mật khẩu, khóa tài khoản sau N lần, để trống trường…

### Chế độ `checklist` — Checklist kiểm thử high-level cho một màn *(khuyến nghị; trước là `ba-checklist`)*

**Làm gì.** Từ `srs`/`usecase`/`userstory`/`design-spec` của một màn, rút **danh mục điểm cần kiểm ở mức cao** — mỗi mục **một dòng** (điểm kiểm + điều kiện đạt quan sát được), gom theo 7 nhóm (chức năng chính, validation, trạng thái UI, lỗi & ngoại lệ, phân quyền, phi chức năng, liên màn). Mỗi mục có mã `CL-S..` **truy vết** về `R-S`/`UC`/`US`/`E-S`. Khác chế độ mặc định: đây là **high-level, không bước/test data** — là bản để BA/QC rà nhanh độ phủ và làm **khung cho test case** (mỗi `CL` sẽ có ≥1 `TC` chi tiết bám theo).

**Khi nào dùng.** Sau `ba-screen-spec`, trước `ba-test` mặc định. Muốn một bản checklist gọn cho QC review độ phủ trước khi viết test case chi tiết.

**KHÔNG dùng khi.** Chưa đặc tả màn (`ba-screen-spec` trước). Cần ca chi tiết có bước/test data → đó là `ba-test` mặc định.

**Đầu vào.** `srs.md`, `usecase.md`, `userstory.md`, `design-spec.md` của màn.

**Đầu ra.** `checklist.md` trong folder màn (+ cột `checklist` trong tracking — như `e2e`, không tính 9/9).

**Ví dụ.** `ba-test checklist Login` → `CL-S01-01` đăng nhập đúng → vào dashboard; `CL-S01-05` sai mật khẩu 5 lần → khoá tạm, đúng thông báo (trace `E-S01-03`).

---

## ba-html-design — Dựng bản thiết kế HTML trực quan

**Làm gì.** Từ wireframe ASCII + SRS + design-spec của một màn, dựng **một file HTML tĩnh tự chứa** (CSS nhúng, dữ liệu mẫu) để bạn mở trên trình duyệt xem giao diện thật của màn — mobile-first, đủ các trạng thái UI, đạt chuẩn tiếp cận WCAG AA, bám theo design token nếu có.

**Cách làm.** Trước khi dựng, liệt kê mọi trạng thái của màn kèm nguồn và cài dữ liệu mẫu có ca biên (tên rất dài, số 0, danh sách rỗng). Màn được **ráp** từ khung chung và các khối đã duyệt, không vẽ lại từ đầu. Dựng xong, máy tự soát tối đa 3 vòng: khung, ngân sách thiết kế (số cỡ chữ, bo góc, màu ngoài token, emoji làm icon), WCAG, và mở trang thật ở khổ điện thoại lẫn màn rộng, theo từng trạng thái, để bắt chỗ cuộn ngang hay chữ bị cắt. Lúc giao, việc đầu tiên là nói rõ máy đã tự quyết thay bạn những gì, cái gì chưa kiểm được, rồi kết bằng vài điểm cần bạn chốt (*trả lời `ok` hoặc `sửa 1, 3`*).

**Khi nào dùng.** Đã có `ascii-screen`, `srs`, `design-spec` của màn và muốn xem trực quan. Là bước 5 (thứ tự test↔html linh hoạt).

**KHÔNG dùng khi.** Chưa có đặc tả màn. Đây là **bản dựng tĩnh để xem**, không phải code chạy thật của sản phẩm (code thật do `dev-run` làm).

**Đầu vào.** `ascii-screen.md`, `srs.md`, `design-spec.md` của màn; tùy chọn `docs/07-design-system.md` để bám token.

**Đầu ra.** `html-design.html` trong folder màn (+ cập nhật ô `html` trong tracking).

**Ví dụ.** `ba-html-design Login` → sinh `html-design.html` mở trên trình duyệt thấy form đăng nhập đúng bố cục ascii.

---

### Chế độ `lofi` — Bản phác đen trắng để chốt bố cục (trước là `ba-wireframe-lofi`)

**Làm gì.** Dựng một trang **đen trắng, khối xám** cho các màn hình — không màu thương hiệu, không icon, không trang trí. Mục đích rất cụ thể: khi đưa bản đẹp ra, người xem hay sa vào bàn **màu nút và font chữ**, trong khi thứ cần chốt là **bố cục và thứ tự thông tin**. Bản này không có gì để khen đẹp, nên buộc người xem nhìn đúng chỗ: *thiếu gì, cái nào nên nằm trên*.

**Điểm hay nhất.** Mỗi khối trên hình mang **đúng số thứ tự** của bảng mô tả phần tử trong tài liệu đặc tả màn. Nhìn khối số 4 rồi tra thẳng dòng 4 của bảng — không phải đoán "cái nút đó là phần tử nào". Có script kiểm hai chiều: khối nào không có trong bảng, dòng nào chưa được vẽ, đều bị chỉ ra.

**Nhiều phương án.** Màn có hơn một cách bố cục hợp lý thì đưa 2–3 phương án khác nhau thật sự về cách sắp xếp, mỗi phương án ghi việc chính nằm đâu và đánh đổi gì, đánh dấu một phương án khuyên dùng. Bạn trả lời `S02: B` (hoặc `ok` để nhận phương án khuyên dùng), và bản giao diện đầy đủ sẽ dựng theo đúng phương án đã chọn.

**Khi nào dùng.** Sau khi đã có bảng phần tử màn hình, trước khi dựng bản giao diện đầy đủ.

**Khác skill gần kề.** `ascii-screen` là phác bằng ký tự cho BA tự dùng; `ba-html-design` không đối số là bản đầy đủ có màu cho designer và dev; `ba-proto-first html` là bản **bấm được** để chốt nghiệp vụ. Bản lo-fi này nằm giữa, và chỉ dùng một lần rồi thôi.

## ba-build — Lập kế hoạch triển khai code

**Làm gì.** Với mỗi màn đã đủ tài liệu (srs/usecase/test/html), viết một **kế hoạch triển khai** `plan.md` (theo lát cắt dọc Vertical Slice + TDD + Definition of Done + thứ tự phụ thuộc). **Dừng ở kế hoạch — không tự viết code.**

**Khi nào dùng.** Tài liệu các màn đã đủ, chuẩn bị chuyển sang code. Là bước 7.

**KHÔNG dùng khi.** Màn chưa đủ tài liệu (nó sẽ bỏ qua). Muốn viết code thật thì đó là bước tiếp theo — `dev-run` (xem `05-dev.md`).

**Đầu vào.** `docs/00-tracking.md` + (mỗi màn đủ điều kiện) `srs.md`, `usecase.md`, `test.md`, `html-design.html`.

**Đầu ra.** `plan.md` trong mỗi folder màn đủ điều kiện (+ cập nhật ô `plan` trong tracking).

**Ví dụ.** `ba-build` → sinh `plan.md` cho các màn Login, Dashboard… rồi báo "chạy `dev-run <màn>` để build".

---

## ba-test-e2e — Sinh script kiểm thử tự động (tùy chọn, cấp màn)

**Làm gì.** Sau khi màn đã có `test.md`, skill biến các test case thành **script Playwright chạy được** `e2e/tests/<Mã>-<Tên>.spec.ts` ở **gốc dự án** (spec là code, không nằm trong `docs/`) ngay trong folder màn — mỗi `TC-S..` thành một `test(...)` giữ nguyên mã để truy vết ngược. Ưu tiên selector theo nhãn/vai trò (bền), lấy tài khoản test từ biến môi trường (không hardcode), giữ đúng test data cụ thể trong `test.md`. Ca thủ công thì để `test.skip` kèm lý do.

**Khi nào dùng.** Muốn có bộ test tự động chạy trên trình duyệt từ tài liệu kiểm thử, làm cầu nối BA → QA automation. Đây là **code**, không phải tài liệu: hiện trong cột `e2e` của tracking (như cột `dev`), KHÔNG tính vào "9/9 hoàn thành doc". Chạy thật cần app đã deploy.

## ba-api-test — Kiểm thử tầng API: liệt kê để duyệt, rồi thành tệp chạy được

**Làm gì.** Đọc tài liệu API rồi liệt kê **các tình huống cần kiểm** cho từng đường dẫn: gọi đúng thì sao, gọi sai thì sao, ai được gọi, dữ liệu ở giới hạn thì sao. Đây là bản **outline để duyệt trước** — một trang nhìn là thấy thiếu tình huống nào, thay vì phải đọc hàng trăm dòng chi tiết mới nhận ra.

**Khi nào dùng.** Sau khi có tài liệu API (của mình tự phát hoặc của đối tác), trước khi viết ca kiểm thử chi tiết.

**Nó tự chặn khi nào.** Đường dẫn nào chỉ có tên trong bảng tổng mà chưa có mô tả chi tiết thì **không viết tình huống kiểm cho nó** — ghi vào mục "chưa đủ đặc tả" và chỉ ra ai phải bổ sung. Đặc tả không nói mã lỗi thì **không tự nghĩ ra**.

**Điều đáng lưu ý.** Script đi kèm đối chiếu bảng tổng với phần chi tiết. Trên chính dự án mẫu, nó phát hiện tài liệu khai 23 đường dẫn nhưng chỉ 11 cái có mô tả đầy đủ — ai viết kiểm thử từ đó sẽ phủ đúng 11 cái và **tưởng là đã phủ hết**.

**Khác skill gần kề.** `ba-test checklist` là checklist cho **một màn hình**; skill này cho **API**, không qua giao diện.


### Giai đoạn 2 của `ba-api-test` — Biến danh sách kiểm thành file bắn thử được

**Làm gì.** Chuyển outline (giai đoạn 1 của chính skill này) thành **một tệp chạy được**: mở trong VS Code hay JetBrains là bấm gửi từng lời gọi API, xem kết quả trả về ngay. Không cần cài phần mềm riêng, tệp là văn bản thuần nên xem lịch sử thay đổi cũng dễ.

**Khi nào dùng.** Ngay sau khi outline kiểm thử API được duyệt.

**Nó tự chặn khi nào.** Chưa có outline thì không sinh — bỏ qua bước duyệt thì không ai biết thiếu tình huống nào. Ngoài ra script còn **soát rò rỉ**: mật khẩu hay khoá truy cập viết thẳng vào tệp sẽ bị chặn, vì tệp này được lưu vào lịch sử dự án.

**Khác skill gần kề.** `ba-test-e2e` kiểm qua **giao diện** (bấm chuột như người dùng); skill này kiểm **thẳng API**, phát hiện được lỗi mà giao diện che mất.


## Xem thêm

- `README.md` — index toàn bộ skill + bảng chọn theo tình huống.
- `02-tai-lieu-he-thong.md` — tài liệu cấp tổng tùy chọn (bên liên quan, dữ liệu, API, design system, Figma) bổ trợ cho pipeline này.
- `03-orchestrator.md` — nếu muốn chạy cả chuỗi trên trong **một lệnh** (`ba-init`) thay vì gõ từng bước.
- `05-dev.md` — bước sau `ba-build`: biến `plan.md` thành code thật.
