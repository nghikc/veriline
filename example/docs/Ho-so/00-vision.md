# Tầm nhìn & Phạm vi — TeamTasks

> **Business Case / Vision & Scope** — tài liệu chiến lược cấp tổng, đầu vào cho `docs/01-requirements.md`.
> Ngày lập: 2026-07-16 · Người lập: Nhóm BA/PM (SH-06) · Trạng thái: Đề xuất

**Tầm nhìn:** Trở thành hệ thống quản lý công việc nhóm tập trung, minh bạch trách nhiệm và an toàn dữ liệu cho các tổ chức quy mô vừa tại Việt Nam — nơi mọi công việc đều có chủ, có deadline và có thể theo dõi theo thời gian thực mà không cần họp cập nhật thủ công.

**Sứ mệnh (Mission):** Loại bỏ tình trạng công việc bị bỏ sót và trách nhiệm mờ nhạt khi nhóm quản lý công việc bằng chat và bảng tính, bằng một nền tảng web có phân quyền rõ ràng.

---

## 1. Vấn đề & cơ hội

- **Bối cảnh:** Các nhóm làm việc đã vượt ngưỡng 10 người và tiếp tục mở rộng (tối đa 200 người/tổ chức). Ở quy mô này, quản lý công việc bằng chat (Zalo, Messenger) hoặc bảng tính (spreadsheet) không còn khả thi — thông tin phân tán trên nhiều kênh, không có nguồn sự thật duy nhất. Áp lực deadline sản phẩm theo quý càng làm lộ rõ nhu cầu một quy trình minh bạch hơn.
- **Vấn đề / pain:**
  - **Thiếu minh bạch trách nhiệm:** không truy vết được ai giao việc gì, cho ai, deadline khi nào và tình trạng ra sao ("không ai biết việc đó của ai").
  - **Công việc bị bỏ sót:** không có danh sách tập trung, việc rơi qua khe hở giữa các kênh chat.
  - **Deadline không được nhắc:** phụ thuộc trí nhớ cá nhân, dẫn tới trễ hạn.
  - **Không có phân quyền:** bảng tính ai cũng sửa được, dữ liệu nội bộ nhạy cảm không được bảo vệ.
- **Ai chịu ảnh hưởng:** Các nhóm/tổ chức 10–200 người. Phạm vi giai đoạn 1 nhắm tới **tối đa 5 tổ chức, mỗi tổ chức tối đa 200 thành viên** (khoảng **1 000 người dùng tổng**, **cao điểm ~200 đồng thời**). Ba nhóm người dùng trực tiếp: Thành viên (Member), Quản lý nhóm (Team Lead), Admin tổ chức (Org Admin) — xem `docs/04-stakeholders.md`.
- **Chi phí của việc KHÔNG làm:** Tiếp tục mất thời gian họp cập nhật trạng thái định kỳ, công việc trễ deadline gây rủi ro giao hàng sản phẩm theo quý, và trách nhiệm mờ nhạt làm giảm hiệu suất nhóm. *(Con số tiền/giờ cụ thể chưa có baseline định lượng → xem GĐ-02, GĐ-03.)*
- **Cơ hội:** Chuẩn hoá quy trình giao–thực hiện–duyệt công việc thành một hệ thống duy nhất giúp cắt giảm họp báo cáo, giảm trễ hạn, và tạo dữ liệu tiến độ khách quan cho ban lãnh đạo — đồng thời kiểm soát dữ liệu nội bộ trong biên giới pháp lý (Việt Nam/Singapore, tương thích PDPA).

**SWOT tóm tắt:**

| Điểm mạnh (S) | Điểm yếu (W) | Cơ hội (O) | Thách thức (T) |
|---------------|--------------|------------|----------------|
| Hiểu rõ nghiệp vụ nội bộ; kiểm soát hoàn toàn dữ liệu & phân quyền theo tenant; tự chủ lộ trình tính năng | Phải tự xây & vận hành (đội ngũ, hạ tầng); MVP gấp 3 tháng; chưa có SSO/mobile giai đoạn 1 | Yêu cầu lưu trú dữ liệu VN/Singapore (PDPA) khó với SaaS ngoại; nhu cầu số hoá quản lý công việc đang tăng | Cạnh tranh với SaaS trưởng thành (Jira/Asana/Trello); rủi ro trễ tiến độ nếu phạm vi phình |

## 2. Mục tiêu kinh doanh (SMART)

Mỗi mục tiêu đo được, có mốc thời gian. Mốc quy chiếu: **T0 = ngày ra mắt MVP** (dự kiến Q4/2026, tối đa 3 tháng kể từ khởi động).

| Mã | Mục tiêu (SMART) | Chỉ số đo | Mốc thời gian |
|------|------------------|-----------|---------------|
| BO-01 | Tập trung công việc của nhóm vào một hệ thống duy nhất — ≥ 80% công việc của nhóm được tạo và theo dõi qua TeamTasks | Tỷ lệ % công việc quản lý trên TeamTasks (qua analytics) | T0 + 1 tháng |
| BO-02 | Xoá bỏ "công việc mồ côi" — 100% công việc có người thực hiện (assignee) và deadline | Tỷ lệ % công việc có đủ assignee + deadline | Ngay từ T0 (ràng buộc bắt buộc khi tạo) |
| BO-03 | Bảo vệ dữ liệu nội bộ theo tenant — 0 sự cố truy cập trái phép giữa các tổ chức | Số sự cố data bleed / truy cập chéo tổ chức | T0 + 6 tháng đầu vận hành |
| BO-04 | Giảm thời gian họp cập nhật trạng thái — giảm ≥ 50% số cuộc họp cập nhật hàng tuần | Số cuộc họp cập nhật/tuần (khảo sát nhóm) | T0 + 2 tháng |
| BO-05 | Giảm công việc trễ deadline — giảm ≥ 30% tỷ lệ công việc trễ hạn so với trước khi dùng hệ thống | Tỷ lệ % công việc trễ deadline | T0 + 2 tháng |
| BO-06 | Ra mắt MVP đúng hạn với phạm vi giai đoạn 1 | Ngày ra mắt bản MVP đạt tiêu chí nghiệm thu | ≤ 3 tháng kể từ khởi động (Q4/2026) |

> Các ngưỡng BO-01..BO-05 kế thừa trực tiếp mục "8. Tiêu chí thành công" của `docs/01-requirements.md`, giữ nhất quán và không đặt lại số mới.

## 3. Các phương án & đề xuất

Cân nhắc 3 phương án. Các con số chi phí dưới đây là **ước lượng định hướng chưa có báo giá chính thức** (xem GĐ-01) — dùng để so sánh tương đối giữa các option, không phải cam kết ngân sách.

| Option | Mô tả | Lợi ích | Chi phí / Rủi ro | Chọn? |
|--------|-------|---------|------------------|-------|
| A | **Giữ nguyên** — tiếp tục chat + bảng tính | Không tốn chi phí đầu tư; không cần đào tạo mới | Không giải quyết được bất kỳ pain nào; chi phí ẩn (họp, trễ hạn, việc bỏ sót) tiếp tục tích luỹ; không có phân quyền | ✗ |
| B | **Mua SaaS có sẵn** (Jira / Asana / Trello…) | Triển khai nhanh, tính năng trưởng thành, ít rủi ro kỹ thuật | Phí thuê bao theo đầu người, lâu dài tốn kém ở quy mô ~1 000 user; **khó đảm bảo lưu trú dữ liệu tại VN/Singapore (PDPA)** vì phần lớn host ở nước ngoài; khó tuỳ biến quy trình duyệt & phân quyền theo tenant nội bộ; phụ thuộc nhà cung cấp | ✗ |
| C | **Tự xây TeamTasks** (web app, cloud AWS/GCP) | Kiểm soát hoàn toàn dữ liệu & lưu trú theo PDPA; phân quyền/tenant isolation theo đúng nhu cầu; tự chủ lộ trình; chi phí biên thấp khi mở rộng người dùng | Cần đội phát triển & vận hành; rủi ro tiến độ (MVP 3 tháng); trách nhiệm bảo mật thuộc về nội bộ | ✓ |

**Đề xuất:** chọn **Option C (tự xây)**. Lý do dựa trên cost-benefit:
1. **Tuân thủ PDPA & chủ quyền dữ liệu** — yêu cầu lưu dữ liệu tại Việt Nam/Singapore (ràng buộc pháp lý, xem mục 6) khó thoả mãn bằng SaaS ngoại → loại phần lớn Option B.
2. **Chi phí dài hạn** — ở quy mô ~1 000 người dùng, phí thuê bao SaaS theo đầu người vượt chi phí tự vận hành sau khi khấu hao đầu tư ban đầu (BO gắn: giảm chi phí họp/trễ hạn ở BO-04, BO-05).
3. **Tuỳ biến quy trình lõi** — luồng giao → thực hiện → gửi duyệt → duyệt/từ chối và tenant isolation là đặc thù nội bộ, cần kiểm soát trực tiếp thay vì gò theo SaaS.
4. Option A bị loại vì không giải quyết bất kỳ mục tiêu BO nào.

## 4. Phạm vi (Scope)

### In-scope

| Hạng mục | Mô tả | Ưu tiên (MoSCoW) |
|----------|-------|------------------|
| Xác thực & phân quyền theo vai trò | Đăng nhập email/mật khẩu, khoá tài khoản khi brute force (5 lần sai/15 phút), JWT session; 3 vai trò Member/Team Lead/Org Admin | Must |
| Đăng ký & tạo tổ chức | Người dùng mới tự đăng ký, tạo tổ chức mới và trở thành Org Admin (email duy nhất toàn hệ thống) | Must |
| Quản lý công việc | Tạo, giao, xem chi tiết công việc; vòng đời trạng thái TODO → IN_PROGRESS → IN_REVIEW → DONE (+ CANCELLED, từ chối) | Must |
| Dashboard tổng quan | Danh sách công việc theo trạng thái + thẻ thống kê nhanh theo vai trò | Must |
| Cô lập dữ liệu theo tenant | Dữ liệu mỗi tổ chức tách biệt, không data bleed | Must |
| Thông báo in-app | Badge + panel thông báo khi được giao việc / trạng thái đổi | Must |
| Quản trị thành viên tổ chức | Mời, sửa vai trò, vô hiệu hoá thành viên (F13) | Must (Phase 1) |
| Bình luận công việc | Thêm comment văn bản vào công việc | Should |
| Nhắc deadline qua email | Cron 08:00 hàng ngày nhắc công việc đến hạn/quá hạn | Should |
| Quản lý hồ sơ cá nhân & tổ chức | Cập nhật họ tên/ảnh/mật khẩu; tên/logo tổ chức | Should |
| Import thành viên qua CSV | Admin import danh sách thành viên (tháng đầu ra mắt) | Could |

### Out-of-scope

- **OAuth / SSO (Google/Microsoft)** — hoãn sang giai đoạn 2 *(Won't lần này; OQ-01 chưa chốt)*.
- **App mobile native** — giai đoạn 1 chỉ có web *(Won't lần này)*.
- **"Quên mật khẩu" tự phục vụ** — giai đoạn 1 do Admin reset thủ công *(Won't lần này; OQ-02)*.
- **Real-time WebSocket** — giai đoạn 1 chấp nhận polling ~60 giây, không đẩy real-time *(Won't lần này)*.
- **Nhiều người thực hiện cho một công việc** — giai đoạn 1 mỗi công việc chỉ 1 assignee chính *(Won't lần này; OQ-04)*.
- **Auto-draft / khôi phục form khi mất kết nối** — chấp nhận mất dữ liệu form chưa lưu *(Won't lần này)*.
- **On-premise deployment** — chỉ triển khai cloud (AWS/GCP).

## 5. Chỉ số thành công (Success Metrics / KPI)

Mỗi KPI gắn 1 mục tiêu `BO-..` và có ngưỡng số. Baseline định lượng của môi trường hiện tại (chat/bảng tính) chưa được đo → đánh dấu `⚠️ chưa có` và sẽ khảo sát ở đầu dự án.

| KPI | Gắn mục tiêu | Baseline | Ngưỡng mục tiêu | Cách đo |
|-----|--------------|----------|-----------------|---------|
| Tỷ lệ công việc được quản lý trên TeamTasks | BO-01 | ⚠️ chưa có (0% — chưa có hệ thống) | ≥ 80% sau 1 tháng | Analytics nội bộ (đếm công việc tạo trên hệ thống / tổng công việc nhóm) |
| Tỷ lệ công việc có đủ assignee + deadline | BO-02 | ⚠️ chưa có | 100% | Ràng buộc bắt buộc khi tạo (FR-04) + truy vấn DB |
| Số sự cố truy cập chéo tổ chức | BO-03 | 0 (kỳ vọng) | 0 sự cố trong 6 tháng | Log bảo mật + audit truy cập theo tenant (NFR-06) |
| Số cuộc họp cập nhật trạng thái/tuần | BO-04 | ⚠️ chưa có (khảo sát đầu dự án) | Giảm ≥ 50% sau 2 tháng | Khảo sát nhóm định kỳ |
| Tỷ lệ công việc trễ deadline | BO-05 | ⚠️ chưa có (khảo sát đầu dự án) | Giảm ≥ 30% sau 2 tháng | So sánh dữ liệu trễ hạn trên hệ thống trước/sau |
| Ngày ra mắt MVP đạt nghiệm thu | BO-06 | — | ≤ 3 tháng kể từ khởi động | Cột mốc dự án + tiêu chí nghiệm thu UAT |

*(KPI vận hành hỗ trợ, không phải mục tiêu kinh doanh cấp tổng nhưng ràng buộc chất lượng theo NFR: p95 API ≤ 2s @ 200 user đồng thời — NFR-01; uptime ≥ 99,5%/tháng — NFR-04.)*

## 6. Ràng buộc & Rủi ro

### Ràng buộc

- **Ngân sách:** Hạ tầng cloud provider thông thường (AWS/GCP), **không on-premise**. Ngân sách phát triển cụ thể 🔓 Chấp nhận rủi ro (GĐ-01).
- **Thời hạn:** MVP ra mắt trong **3 tháng**; phạm vi giai đoạn 1 theo `docs/01-requirements.md`.
- **Công nghệ:** Web app; xác thực email/mật khẩu nội bộ (**không OAuth/SSO giai đoạn 1**); mật khẩu bcrypt (cost ≥ 12), JWT RS256, HTTPS bắt buộc; hỗ trợ Chrome/Firefox/Safari/Edge phiên bản gần đây (NFR-07).
- **Pháp lý/tuân thủ:** Dữ liệu lưu tại **Việt Nam hoặc Singapore** (tương thích PDPA — Personal Data Protection Act); cô lập dữ liệu theo tenant (NFR-06).

### Rủi ro cấp dự án

| Rủi ro | Khả năng | Ảnh hưởng | Hướng giảm thiểu |
|--------|----------|-----------|------------------|
| Phạm vi phình (scope creep) làm trễ MVP 3 tháng | TB | Cao | Khoá phạm vi theo mục 4 (In/Out-of-scope + MoSCoW); mọi thay đổi đi qua sổ Change Request `docs/00-cr.md` |
| Thiếu baseline định lượng để chứng minh ROI (BO-04, BO-05) | Cao | TB | Khảo sát baseline ngay đầu dự án trước ra mắt; chốt lại GĐ-02, GĐ-03 |
| Rủi ro bảo mật / rò rỉ dữ liệu chéo tổ chức | Thấp | Cao | Tenant isolation (NFR-06), khoá brute force (NFR-03), bcrypt + JWT RS256 (NFR-02); audit 6 tháng đầu (BO-03) |
| Thiếu SSO/"Quên mật khẩu" gây ma sát đăng nhập giai đoạn 1 | TB | TB | Admin reset thủ công; ghi nhận OQ-01/OQ-02 để cân nhắc giai đoạn 2 |
| Người dùng vẫn quay lại chat, không nhập việc lên hệ thống (rủi ro adoption) | TB | Cao | Đào tạo & tài liệu hướng dẫn trước ra mắt (TR-01); nhắc deadline qua email/in-app để tạo thói quen; đo BO-01 sau 1 tháng |
| Tài khoản bị khoá vĩnh viễn nhưng không có tự phục hồi | Thấp | TB | Quy trình Admin mở khoá thủ công; ghi log rõ ràng |

## 7. Giả định

Trạng thái mỗi dòng: `Đề xuất → Đã xác nhận / Đã sửa / Đã bỏ` (xem "Xác nhận giả định" trong `conventions.md`). Tài liệu lập ở chế độ batch (chưa rà tương tác) → các dòng thiếu số liệu mang dấu `🔓 Chấp nhận rủi ro`.

| Mã | Nội dung giả định | Vì sao cần (chỗ thiếu) | Ảnh hưởng nếu sai | Trạng thái |
|------|-------------------|------------------------|-------------------|-----------|
| GĐ-01 | Con số chi phí trong so sánh phương án (mục 3) là ước lượng định hướng, chưa có báo giá chính thức cho hạ tầng cloud và đội phát triển | `01-requirements.md` chỉ nêu "cloud thông thường, không on-premise", không có ngân sách cụ thể | Đề xuất Option C có thể phải cân nhắc lại nếu chi phí tự xây/vận hành thực tế cao hơn nhiều | 🔓 Chấp nhận rủi ro |
| GĐ-02 | Số cuộc họp cập nhật trạng thái hiện tại (baseline BO-04) sẽ được khảo sát ở đầu dự án | Không có baseline định lượng trong tài liệu gốc | Không đo được mức giảm ≥ 50% nếu thiếu baseline | 🔓 Chấp nhận rủi ro |
| GĐ-03 | Tỷ lệ công việc trễ deadline hiện tại (baseline BO-05) sẽ được khảo sát ở đầu dự án | Không có baseline định lượng trong tài liệu gốc | Không chứng minh được mức giảm ≥ 30% | 🔓 Chấp nhận rủi ro |
| GĐ-04 | Quy mô giai đoạn 1: tối đa 5 tổ chức × 200 thành viên (~1 000 người dùng tổng, cao điểm ~200 đồng thời) | Lấy từ `00-brainstorm.md` mục 2 (Quy mô dự kiến) | Sai quy mô ảnh hưởng thiết kế hiệu năng (NFR-01) và tính toán chi phí hạ tầng | Đề xuất |
| GĐ-05 | Ra mắt MVP dự kiến Q4/2026 (mốc T0 cho các KPI theo thời gian) | Suy ra từ ràng buộc "MVP trong 3 tháng" + ngày lập tài liệu | Lệch mốc T0 làm dời toàn bộ mốc đo KPI BO-01..BO-05 | Đề xuất |
| GĐ-06 | Mỗi công việc chỉ có 1 người thực hiện chính; không có đăng ký tự do ngoài luồng tạo tổ chức mới (FR-13) | `01-requirements.md` mục 7 + OQ-04 chưa chốt | Thay đổi mô hình dữ liệu công việc và luồng phân công nếu cho phép nhiều assignee | Đề xuất |

> **🔓 Quyết định chấp nhận rủi ro — 2026-08-04, SH-06 (BA/PM) — chủ sở hữu dự án mẫu.**
> *Vì sao chưa xác nhận được:* TeamTasks là **dự án mẫu của BA Toolkit**, không có ban lãnh đạo/bộ phận tài chính thật để hỏi. Con số ngân sách (`GĐ-01`) và baseline họp/trễ hạn (`GĐ-02`, `GĐ-03`) chỉ đo được trên một tổ chức thật.
> *Điều kiện rà lại:* dự án được dùng cho một khách hàng thật, **hoặc** trước khi bất kỳ quyết định đầu tư nào bám vào con số ở §3 — khi điều đó xảy ra, các dòng dưới quay lại `⚠️ chưa xác nhận` và phải rà theo vòng "Xác nhận giả định" (`conventions.md`).


---

## Bàn giao

Tài liệu này là **đầu vào cho `ba-requirements`** (`docs/01-requirements.md`): mục "Business Need" và "Tiêu chí thành công" của bản yêu cầu lấy từ đây (Vấn đề & cơ hội → Business Need; BO-01..BO-06 + KPI → Tiêu chí thành công; mục 4 Phạm vi → khung MoSCoW cho BR/FR; mục 6 → Ràng buộc & Giả định). Các mã `BR-01..BR-05` trong `01-requirements.md` ánh xạ 1–1 với `BO-01..BO-05` ở đây.

## Thuật ngữ

| Thuật ngữ | Giải thích |
|-----------|-----------|
| SMART | Tiêu chí mục tiêu tốt: Specific/Measurable/Achievable/Relevant/Time-bound |
| MoSCoW | Cách xếp ưu tiên: Must / Should / Could / Won't |
| KPI (Key Performance Indicator) | Chỉ số đo lường mức đạt mục tiêu |
| ROI (Return on Investment) | Tỷ suất lợi ích thu được trên chi phí bỏ ra |
| SWOT | Khung phân tích Điểm mạnh/Yếu (nội bộ) · Cơ hội/Thách thức (bên ngoài) |
| BO (Business Objective) | Mục tiêu kinh doanh cấp dự án |
| MVP (Minimum Viable Product) | Bản khả dụng tối thiểu — phạm vi đủ dùng cho lần ra mắt đầu |
| Tenant / Tenant isolation | Mỗi tổ chức là một tenant; dữ liệu cô lập, không lẫn giữa các tổ chức |
| PDPA (Personal Data Protection Act) | Luật bảo vệ dữ liệu cá nhân (áp dụng ở Singapore; ràng buộc lưu trú dữ liệu) |
| SSO (Single Sign-On) / OAuth | Đăng nhập một lần qua nhà cung cấp danh tính (Google/Microsoft) — ngoài phạm vi giai đoạn 1 |
| SaaS (Software as a Service) | Phần mềm thuê bao theo dịch vụ (vd Jira/Asana/Trello) |

> Từ điển đầy đủ toàn dự án: `docs/00-glossary.md`.
