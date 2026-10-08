# Phân tích quy trình nghiệp vụ (AS-IS / TO-BE) — TeamTasks

> Tài liệu phân tích hiện trạng — chạy sớm (sau stakeholder/brainstorm, trước/song song `ba-requirements`). Yêu cầu phát sinh ở mục 5 là đầu vào để `ba-requirements` cấp mã chính thức.
>
> Trạng thái: giả định hiện trạng chưa phỏng vấn được → `🔓 Chấp nhận rủi ro` ở mục Giả định (quyết định + điều kiện rà lại ghi tại đó).

## 1. Bối cảnh & phạm vi quy trình

- **Quy trình đang xét:** Quản lý và theo dõi công việc của nhóm — từ khi quản lý nghĩ ra một việc cần giao đến khi việc được duyệt hoàn thành và tiến độ được nắm bắt.
- **Hiện trạng vận hành:** Thủ công — giao việc và trao đổi qua **chat nhóm** (Zalo, Messenger), theo dõi trạng thái trên **bảng tính** (Excel/Google Sheets) cập nhật bằng tay. Không có phần mềm quản lý việc chuyên dụng.
- **Lý do số hóa:** Nhóm đã vượt ngưỡng 10 người; quản lý bằng chat + bảng tính không còn khả thi — thiếu phân quyền, không truy vết được "ai giao việc gì cho ai, tình trạng ra sao", công việc bị bỏ sót, deadline không được nhắc, trách nhiệm mờ nhạt. TeamTasks tập trung hóa việc quản lý công việc, phân quyền rõ và theo dõi tiến độ thời gian thực.
- **Vai trò/tác nhân tham gia:** Thành viên (Member), Quản lý nhóm (Team Lead), Admin tổ chức (Org Admin), Hệ thống (TeamTasks — chỉ xuất hiện ở TO-BE; AS-IS chỉ có kênh thủ công chat + bảng tính, không phải hệ thống chủ động).
- **Điểm bắt đầu → kết thúc (phạm vi):** Quản lý xác định một công việc cần giao → công việc được duyệt DONE và tiến độ nhóm được nắm bắt.
- **Ngoài phạm vi:** Tuyển dụng/onboarding nhân sự ngoài tổ chức; báo cáo tài chính; tích hợp SSO/OAuth (giai đoạn 2); ứng dụng di động (giai đoạn 2).

## 2. Quy trình AS-IS (hiện trạng)

> Cách vận hành **hiện tại** (thủ công: chat + bảng tính). Mỗi vai trò một lane; mũi tên chéo lane = bàn giao. Lane "Kênh thủ công" là nơi dữ liệu **nằm rời rạc** (không phải hệ thống chủ động).

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#EEF0FF','primaryBorderColor':'#4F46E5','primaryTextColor':'#111827','lineColor':'#6B7280','secondaryColor':'#F3F4F6','tertiaryColor':'#F0F2F5','fontFamily':'Inter, system-ui, sans-serif'}}}%%
swimlane-beta TD
  subgraph AD[Admin tổ chức]
    A([Bắt đầu]):::startend --> AD1["Chia sẻ file bảng tính và lập nhóm chat cho thành viên"]:::task
  end
  subgraph TL[Quản lý nhóm]
    TL1["Nghĩ ra công việc cần giao"]:::task --> TL2["Đăng giao việc trong nhóm chat"]:::task
    TL3["Dò chat và bảng tính để nắm tiến độ"]:::task --> TLD{"Đạt yêu cầu?"}:::decision
    TL4["Nhắn yêu cầu làm lại"]:::task
    TL5["Tự sửa ô trạng thái sang Done trong bảng tính"]:::task --> TL6["Họp và nhắn cập nhật trạng thái định kỳ"]:::task
  end
  subgraph TV[Thành viên]
    M1["Đọc chat, tự ghi nhớ việc"]:::task --> MD{"Việc và deadline đã rõ?"}:::decision
    M2["Hỏi lại trong chat"]:::task
    M3["Thực hiện công việc"]:::task --> M4["Báo tiến độ bằng tin nhắn"]:::task
  end
  subgraph CH[Kênh thủ công Chat và Bảng tính]
    CH1["Tin nhắn giao việc lẫn trong luồng chat"]:::external
    CH2["Cập nhật bảng tính thủ công nếu còn nhớ"]:::external
  end
  AD1 --> TL1
  TL2 --> CH1 --> M1
  MD -->|Không| M2 --> TL2
  MD -->|Có| M3
  M4 --> CH2 --> TL3
  TLD -->|Không| TL4 --> M3
  TLD -->|Có| TL5
  TL6 --> Z([Kết thúc]):::startend
  classDef task fill:#EEF0FF,stroke:#4F46E5,stroke-width:1.5px,color:#111827
  classDef decision fill:#FFF7ED,stroke:#F59E0B,stroke-width:1.5px,color:#92400E
  classDef startend fill:#4F46E5,stroke:#3730A3,color:#FFFFFF
  classDef external fill:#F3F4F6,stroke:#6B7280,color:#374151
```

**Pain point / nút thắt (theo bước):**

| Bước AS-IS | Vấn đề | Loại lãng phí (value-added analysis) |
|------------|--------|--------------------------------------|
| Đăng giao việc trong nhóm chat | Tin nhắn trôi lẫn trong luồng chat, không có mã việc, dễ bỏ sót; không rõ ai chịu trách nhiệm | Lãng phí (thao tác thừa, thất thoát thông tin) |
| Thành viên tự ghi nhớ việc | Không có nguồn chuẩn — mỗi người hiểu một kiểu, hỏi đi hỏi lại | Lãng phí (làm lại, chờ đợi) |
| Cập nhật bảng tính thủ công nếu còn nhớ | Nhập tay, dễ quên, dễ lệch số liệu; dữ liệu rời rạc khỏi nội dung trao đổi | Lãng phí (nhập trùng, sai sót) |
| Dò chat và bảng tính để nắm tiến độ | Quản lý phải ghép thủ công 2 nguồn, tốn thời gian, dễ sai | Lãng phí (thao tác thừa) |
| Họp và nhắn cập nhật trạng thái định kỳ | Họp chỉ để đồng bộ trạng thái — không tạo giá trị trực tiếp | Lãng phí (chờ đợi, họp thừa) |
| Nhắc deadline thủ công | Quản lý tự rà bảng tính tìm việc đến hạn; hay quên → việc trễ | Lãng phí (giám sát thủ công), rủi ro nghiệp vụ |
| Chia sẻ file bảng tính cho thành viên | Ai có link đều xem/sửa được — không phân quyền, dữ liệu nội bộ hở | Lãng phí + rủi ro bảo mật |

## 3. Quy trình TO-BE (tương lai có hệ thống)

> Cách vận hành **sau khi có TeamTasks**. Lane "Hệ thống TeamTasks" gánh phần lưu trữ tập trung, thông báo tự động, dashboard thời gian thực và nhắc deadline theo lịch. Vòng nhắc deadline (cron 08:00) là luồng nền, có điểm bắt đầu–kết thúc riêng.

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#EEF0FF','primaryBorderColor':'#4F46E5','primaryTextColor':'#111827','lineColor':'#6B7280','secondaryColor':'#F3F4F6','tertiaryColor':'#F0F2F5','fontFamily':'Inter, system-ui, sans-serif'}}}%%
swimlane-beta TD
  subgraph AD[Admin tổ chức]
    A([Bắt đầu]):::startend --> AD1["Mời, cấp tài khoản và phân quyền thành viên theo vai trò"]:::task
  end
  subgraph TL[Quản lý nhóm]
    TL1["Đăng nhập và mở Dashboard"]:::task --> TL2["Tạo công việc, chọn người nhận, deadline, mức ưu tiên"]:::task
    TL3["Xem yêu cầu duyệt trên Dashboard"]:::task --> TLD{"Đạt yêu cầu?"}:::decision
    TL4["Đánh dấu DONE"]:::task
    TL5["Từ chối kèm ghi chú lý do"]:::task
    TL6["Theo dõi tiến độ thời gian thực trên Dashboard"]:::task --> Z([Kết thúc]):::startend
  end
  subgraph TV[Thành viên]
    M1["Nhận thông báo được giao việc"]:::task --> M2["Mở chi tiết công việc"]:::task
    M2 --> M3["Thực hiện, cập nhật trạng thái IN_PROGRESS"]:::task
    M3 --> M4["Gửi duyệt IN_REVIEW"]:::task
    M5["Nhận nhắc deadline"]:::task --> M3
  end
  subgraph HT[Hệ thống TeamTasks]
    S1["Lưu công việc và gửi thông báo in-app cho người nhận"]:::task
    S2["Thông báo yêu cầu duyệt cho quản lý"]:::task
    S3["Thông báo hoàn thành và cập nhật Dashboard"]:::task
    S4["Thông báo bị từ chối cho thành viên"]:::task
    SC([Cron 08:00 hằng ngày]):::startend --> SD{"Có việc đến hạn hôm nay?"}:::decision
    S5["Gửi email và thông báo nhắc deadline"]:::error
    S6["Kết thúc vòng nhắc"]:::task --> ZC([Kết thúc]):::startend
  end
  AD1 --> TL1
  TL2 --> S1 --> M1
  M4 --> S2 --> TL3
  TLD -->|Có| TL4 --> S3 --> TL6
  TLD -->|Không| TL5 --> S4 --> M3
  SD -->|Có| S5 --> M5
  SD -->|Không| S6
  classDef task fill:#EEF0FF,stroke:#4F46E5,stroke-width:1.5px,color:#111827
  classDef decision fill:#FFF7ED,stroke:#F59E0B,stroke-width:1.5px,color:#92400E
  classDef startend fill:#4F46E5,stroke:#3730A3,color:#FFFFFF
  classDef external fill:#F3F4F6,stroke:#6B7280,color:#374151
  classDef error fill:#FEF2F2,stroke:#EF4444,color:#991B1B
```

**Vai trò & thay đổi trách nhiệm (AS-IS → TO-BE):**

| Vai trò (lane) | Trước (AS-IS) | Sau (TO-BE) |
|----------------|---------------|-------------|
| Admin tổ chức | Chia sẻ file bảng tính cho ai cũng sửa được | Mời, cấp tài khoản, phân quyền theo vai trò, dữ liệu tách theo tổ chức |
| Quản lý nhóm | Đăng việc trong chat, dò chat + bảng tính, họp cập nhật | Tạo/giao việc có cấu trúc, duyệt online, theo dõi tiến độ thời gian thực trên Dashboard |
| Thành viên | Tự ghi nhớ việc từ chat, cập nhật bảng tính thủ công | Nhận thông báo tự động, cập nhật trạng thái ngay trên công việc |
| Hệ thống TeamTasks | (chưa có — chỉ có chat + bảng tính rời rạc) | Lưu tập trung, thông báo tự động, cập nhật Dashboard, nhắc deadline theo lịch |

## 4. Gap analysis (AS-IS → TO-BE)

> Đối chiếu từng bước. **ESIA:** E=Eliminate (bỏ) · S=Simplify (đơn giản hóa) · I=Integrate (gộp) · A=Automate (tự động hóa). Mỗi dòng có loại thay đổi + cơ hội/nguyên nhân.

| Bước / Khía cạnh | AS-IS | TO-BE | Loại thay đổi (ESIA) | Cơ hội / nguyên nhân |
|------------------|-------|-------|----------------------|----------------------|
| Giao việc | Đăng trong nhóm chat, tin nhắn trôi lẫn, không mã việc | Tạo công việc có cấu trúc, gán người nhận + deadline + ưu tiên | A — Automate | Không còn việc trôi trong chat, gán trách nhiệm rõ ràng (BR-02) |
| Ghi nhận & cập nhật trạng thái | Sửa ô bảng tính thủ công "nếu còn nhớ" | Cập nhật trạng thái theo luồng TODO → IN_PROGRESS → IN_REVIEW → DONE ngay trên việc | E — Eliminate | Bỏ khâu nhập tay bảng tính → hết lệch số liệu, dữ liệu tập trung (BR-01) |
| Phân quyền & truy cập | Chia sẻ file bảng tính, ai có link đều sửa | Phân quyền theo vai trò, dữ liệu tách theo tổ chức (tenant) | S — Simplify | Bảo vệ dữ liệu nội bộ, chỉ thành viên được duyệt truy cập (BR-03) |
| Thông báo giao việc | Người nhận tự đọc chat, dễ bỏ sót | Thông báo in-app tự động khi được giao/đổi trạng thái | A — Automate | Không bỏ sót việc, nhận biết kịp thời (BR-02, BR-05) |
| Nhắc deadline | Quản lý tự rà bảng tính tìm việc đến hạn | Cron 08:00 gửi email + thông báo nhắc tự động | A — Automate | Giảm việc trễ deadline, bỏ giám sát thủ công (BR-05) |
| Nắm tiến độ nhóm | Ghép thủ công chat + bảng tính, họp định kỳ | Dashboard thời gian thực + thẻ thống kê nhanh | A — Automate | Bỏ họp cập nhật trạng thái thủ công, minh bạch tức thì (BR-04) |
| Duyệt kết quả | Nhắn "ok" trong chat, không lưu vết | Luồng IN_REVIEW → DONE / từ chối kèm ghi chú, lưu lịch sử | I — Integrate | Truy vết ai duyệt, khi nào, vì sao từ chối (BR-02) |
| Trao đổi quanh việc | Rải rác nhiều nơi trong chat | Comment gắn trực tiếp vào công việc | I — Integrate | Ngữ cảnh tập trung theo từng việc, không thất lạc (BR-01) |
| Đưa thành viên vào hệ thống | Thêm dòng vào bảng tính, gửi link | Admin mời/cấp tài khoản; hoặc người dùng tự đăng ký và tạo tổ chức | S — Simplify | Onboarding có kiểm soát, gắn phân quyền ngay (BR-01, BR-03) |

## 5. Yêu cầu phát sinh (từ gap)

> Mỗi gap đẻ ra ≥1 yêu cầu. **Trace ra `FR`/`BR`/`TR`** — `ba-requirements` sẽ cấp/hợp thức hóa mã chính thức. `TR` = Transition Requirement (di trú dữ liệu / đào tạo / chạy song song / chuyển đổi). Các mã `TR` đánh dấu *(mới)* là đề xuất, `ba-requirements` sẽ cấp số kế tiếp.

| # | Yêu cầu phát sinh | Từ gap (bước) | Trace (FR/BR/TR) | Ghi chú |
|---|-------------------|---------------|------------------|---------|
| 1 | Đăng nhập bằng email/mật khẩu và phân quyền theo vai trò; quản lý tài khoản thành viên | Phân quyền & truy cập | FR-01, FR-02, BR-03 | Cổng vào bắt buộc + kiểm soát truy cập |
| 2 | Cách ly dữ liệu theo tổ chức (multi-tenant), không rò rỉ giữa các tổ chức | Phân quyền & truy cập | NFR-06, BR-03 | Ràng buộc dữ liệu |
| 3 | Tạo và giao công việc có cấu trúc (tiêu đề, mô tả, người nhận, deadline, ưu tiên) | Giao việc | FR-04, FR-05, BR-01, BR-02 | Chức năng cốt lõi TO-BE |
| 4 | Cập nhật trạng thái công việc theo luồng TODO → IN_PROGRESS → IN_REVIEW → DONE (có nhánh từ chối) | Ghi nhận & cập nhật trạng thái, Duyệt kết quả | FR-06, BR-01, BR-02 | Thay việc sửa bảng tính tay |
| 5 | Xem chi tiết công việc gồm lịch sử thay đổi và comment gắn theo việc | Trao đổi quanh việc, Duyệt kết quả | FR-07, FR-08, BR-01 | Gộp trao đổi vào ngữ cảnh việc |
| 6 | Thông báo in-app tự động khi được giao việc/đổi trạng thái/có comment | Thông báo giao việc | FR-09, BR-05 | Không bỏ sót việc |
| 7 | Email nhắc deadline tự động lúc 08:00 hằng ngày cho việc đến hạn/quá hạn | Nhắc deadline | FR-10, BR-05 | Cron nền |
| 8 | Dashboard tổng quan công việc theo vai trò + thẻ thống kê nhanh | Nắm tiến độ nhóm | FR-03, BR-01, BR-04 | Bỏ họp cập nhật thủ công |
| 9 | Người dùng mới tự đăng ký, tạo tổ chức và trở thành Org Admin | Đưa thành viên vào hệ thống | FR-13, BR-01, BR-03 | Onboarding tự phục vụ |
| 10 | Di trú danh sách thành viên từ bảng tính sang hệ thống (import CSV) | Đưa thành viên vào hệ thống | TR-02 | Làm sạch + import trong tháng đầu |
| 11 | Di trú các công việc đang mở từ bảng tính sang hệ thống trước go-live | Ghi nhận & cập nhật trạng thái | TR *(mới)* | Tránh mất công việc tồn đọng |
| 12 | Đào tạo/hướng dẫn thành viên dùng hệ thống mới (video + tài liệu) | Toàn quy trình | TR-01 | Trước go-live |
| 13 | Chạy song song chat/bảng tính + TeamTasks trong giai đoạn chuyển đổi | Toàn quy trình | TR *(mới)* | Giảm rủi ro chuyển đổi, gỡ dần kênh cũ |

## Giả định

> **🔓 Quyết định chấp nhận rủi ro — 2026-08-04, SH-06 (BA/PM) — chủ sở hữu dự án mẫu.**
> *Vì sao chưa xác nhận được:* Quy trình AS-IS được suy từ mô tả ý tưởng, **chưa quan sát nhóm thật làm việc**. Không có người vận hành để phỏng vấn trong dự án mẫu.
> *Điều kiện rà lại:* có nhóm thật dùng thử, hoặc có buổi quan sát/phỏng vấn quy trình hiện tại — khi điều đó xảy ra, các dòng dưới quay lại `⚠️ chưa xác nhận` và phải rà theo vòng "Xác nhận giả định" (`conventions.md`).


| GĐ | Nội dung | Vì sao cần (chỗ thiếu) | Ảnh hưởng nếu sai | Trạng thái |
|----|----------|------------------------|-------------------|-----------|
| GĐ-01 | Hiện trạng giao việc/trao đổi qua chat (Zalo/Messenger) và theo dõi bằng bảng tính (Excel/Google Sheets) | Brainstorm mô tả "chat hoặc bảng tính" nhưng chưa xác nhận công cụ chính xác từng nhóm | Sơ đồ và pain point AS-IS lệch nếu công cụ khác | 🔓 Chấp nhận rủi ro |
| GĐ-02 | Nhóm chưa dùng phần mềm quản lý việc chuyên dụng nào (Trello/Jira/Asana…) — AS-IS là thủ công thuần | Nếu đã có hệ thống cũ thì AS-IS phải mô hình theo "hệ thống cũ", không phải thủ công | Gap analysis và loại thay đổi ESIA thay đổi | 🔓 Chấp nhận rủi ro |
| GĐ-03 | Có lượng công việc đang mở đáng kể trong bảng tính cần di trú sang hệ thống trước go-live | Chưa biết khối lượng tồn đọng | Nếu không có, TR di trú công việc (#11) là thừa | 🔓 Chấp nhận rủi ro |
| GĐ-04 | Chấp nhận chạy song song hệ cũ + TeamTasks một khoảng (đề xuất ~2 tuần) khi chuyển đổi | Chưa chốt chiến lược cắt chuyển (big-bang hay song song) | Ảnh hưởng TR chạy song song (#13) và kế hoạch go-live | 🔓 Chấp nhận rủi ro |
| GĐ-05 | Quy trình duyệt việc do Quản lý nhóm/người giao thực hiện (khớp state machine công việc trong brainstorm) | Cần xác nhận ai có quyền duyệt/mở lại việc | Nhánh duyệt trong sơ đồ TO-BE lệch nếu vai trò khác | 🔓 Chấp nhận rủi ro |

## Thuật ngữ

| Thuật ngữ | Giải thích |
|-----------|-----------|
| AS-IS | Mô hình quy trình **hiện trạng** — cách vận hành hiện tại (chat + bảng tính) |
| TO-BE | Mô hình quy trình **tương lai** — cách vận hành sau khi có TeamTasks |
| Gap Analysis | Phân tích khoảng cách giữa hiện trạng và tương lai để rút yêu cầu/cải tiến |
| ESIA | Phân loại thay đổi: Eliminate (bỏ) / Simplify (đơn giản hóa) / Integrate (gộp) / Automate (tự động hóa) |
| Swimlane | Sơ đồ quy trình chia lane theo vai trò — thấy rõ ai làm gì và điểm bàn giao |
| Value-added analysis | Soi mỗi bước là tạo giá trị hay lãng phí (chờ/làm lại/thao tác thừa) |
| Multi-tenant | Kiến trúc dữ liệu tách riêng theo từng tổ chức, không rò rỉ chéo |
| Cron | Tác vụ nền chạy theo lịch định sẵn (ở đây: 08:00 hằng ngày) |
| TR (Transition Requirement) | Yêu cầu chuyển đổi — di trú dữ liệu, đào tạo, chạy song song khi go-live |
| FR (Functional Requirement) | Yêu cầu chức năng — hệ thống phải làm gì |
| BR (Business Requirement) | Yêu cầu nghiệp vụ cấp doanh nghiệp |
| NFR (Non-functional Requirement) | Yêu cầu phi chức năng — ràng buộc chất lượng đo được |

> Từ điển đầy đủ toàn dự án: `docs/00-glossary.md`.
</content>
</invoke>
