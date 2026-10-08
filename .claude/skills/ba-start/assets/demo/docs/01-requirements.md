# Tài liệu yêu cầu — TeamTasks

> Phân loại yêu cầu: Business → Stakeholder → Solution (Functional/Non-functional) → Transition.
> Thuộc tính mỗi yêu cầu: ID · Nguồn · Ưu tiên (MoSCoW) · Trạng thái · Truy vết.

## 1. Business Need

Các nhóm làm việc quy mô 10–200 người hiện theo dõi công việc bằng chat hoặc bảng tính, dẫn đến thiếu minh bạch trách nhiệm, công việc bị bỏ sót, và deadline không được nhắc nhở kịp thời. TeamTasks giải quyết vấn đề này bằng nền tảng quản lý công việc nhóm tập trung, có phân quyền rõ ràng và theo dõi tiến độ theo thời gian thực.

## 2. Business Requirements (BR)

Mục tiêu/kết quả ở cấp tổ chức.

| ID | Yêu cầu nghiệp vụ | Lý do (rationale) | Ưu tiên |
|----|-------------------|-------------------|---------|
| BR-01 | Tổ chức có thể theo dõi toàn bộ công việc của nhóm trong một hệ thống duy nhất | Loại bỏ phân tán thông tin trên nhiều kênh chat/bảng tính | Must |
| BR-02 | Trách nhiệm từng công việc phải rõ ràng (ai giao, ai làm, deadline) | Giải quyết tình trạng "không ai biết việc đó của ai" | Must |
| BR-03 | Hệ thống bảo vệ dữ liệu nội bộ của tổ chức — chỉ thành viên được duyệt mới truy cập | Dữ liệu công việc là thông tin nội bộ nhạy cảm | Must |
| BR-04 | Nhóm có thể theo dõi tiến độ tổng thể không cần họp thủ công | Tiết kiệm thời gian cập nhật trạng thái định kỳ | Should |
| BR-05 | Hệ thống nhắc nhở deadline tự động để giảm công việc bị trễ | Deadline missed là rủi ro kinh doanh chính | Should |

## 3. Stakeholder Requirements (StR)

Nhu cầu của từng nhóm liên quan, trace về BR.

| ID | Nhóm liên quan | Nhu cầu | Trace BR |
|----|----------------|---------|----------|
| StR-01 | Thành viên (Member) | Xem danh sách công việc được giao, cập nhật trạng thái dễ dàng, nhận thông báo khi có việc mới | BR-01, BR-02 |
| StR-02 | Quản lý nhóm (Team Lead) | Tạo và giao việc cho thành viên, theo dõi tiến độ cả nhóm trên dashboard, duyệt công việc hoàn thành | BR-01, BR-02, BR-04 |
| StR-03 | Admin tổ chức (Org Admin) | Quản lý thành viên (mời, vô hiệu hoá), cấu hình tổ chức, có toàn quyền can thiệp khi cần | BR-01, BR-03 |
| StR-04 | Thành viên (Member) | Không muốn nhận quá nhiều thông báo làm phân tán chú ý | BR-05 |
| StR-05 | Quản lý nhóm (Team Lead) | Quản lý hồ sơ tổ chức (tên, logo) | BR-03 |

## 4. Luồng nghiệp vụ chính & Vai trò (swimlane)

### 4.1 Nghiệp vụ: Giao và duyệt công việc
```mermaid
swimlane-beta TD
  subgraph TL[Quản lý nhóm]
    A([Bắt đầu]):::startend --> B[Tạo và giao công việc]:::task
    F{"Đạt yêu cầu?"}:::decision
    H[Đánh dấu DONE]:::task
  end
  subgraph TV[Thành viên]
    D["Nhận việc TODO sang IN_PROGRESS"]:::task --> E[Gửi duyệt IN_REVIEW]:::task
    G["Chỉnh sửa lại về IN_PROGRESS"]:::task
    P[Nhận thông báo kết quả]:::task
  end
  subgraph HT[Hệ thống]
    C[Thông báo được giao]:::task
    K[Thông báo bị trả lại]:::task
    I[Thông báo kết quả]:::task
    J([Kết thúc]):::startend
  end
  B --> C --> D
  E --> F
  F -->|Không| K --> G --> E
  F -->|Có| H --> I --> P --> J
  classDef task fill:#EEF0FF,stroke:#4F46E5,stroke-width:1.5px,color:#111827
  classDef decision fill:#FFF7ED,stroke:#F59E0B,stroke-width:1.5px,color:#92400E
  classDef startend fill:#4F46E5,stroke:#3730A3,color:#FFFFFF
```

> **Phạm vi sơ đồ.** Sơ đồ này vẽ **một luồng tuần tự**: giao việc → làm → duyệt → xong. Hai thứ **cố ý không vẽ** vì chúng là **sự kiện ngoài luồng**, vẽ thành bước tuần tự sẽ mô tả sai bản chất:
> - **Nhắc deadline** (`FR-10`/`BR-05`) — tác vụ định kỳ của Hệ thống, chạy song song với mọi trạng thái chưa `DONE`, không phải một bước nằm sau bước nào.
> - **`Org Admin`** (`StR-03`) — can thiệp ở màn quản trị tổ chức `S05`, không tham gia luồng giao/duyệt.
>
> **Bổ sung 31/08** *(từ soát độ phủ)*: `K` thông báo khi bị trả lại — `FR-09` đòi báo **mọi** lần đổi trạng thái, trước đó nhánh từ chối im lặng; `P` khép bàn giao thông báo về lại lane Thành viên; nhãn `D`/`G` ghi đủ chuỗi trạng thái `FR-06`.

> ⚠️ **Câu hỏi mở — CHƯA quyết, không tự vẽ vào sơ đồ:**
> | # | Câu hỏi | Vì sao chưa vẽ |
> |---|---|---|
> | 1 | Huỷ công việc (`CANCELLED` có trong mô hình dữ liệu): ai được huỷ, huỷ ở trạng thái nào, có cần duyệt không? | Vẽ nhánh huỷ mà chưa chốt luật là **bịa chính sách**. Cần chốt rồi mới thêm nhánh + thông báo huỷ theo `FR-09` |

> ✅ **Đã chốt 2026-08-31 (`CR-06`)** — hai câu hỏi từng nằm trong bảng trên:
> - **Ai đặt `DONE`:** **người duyệt**, không phải thành viên. Sơ đồ giữ nguyên (`H` ở lane Quản lý nhóm); `FR-06` được sửa câu chữ cho khớp. Đây là dọn chữ về đúng điều `R-S03-10`, `CL-S03-07`, `09-uat.md` và `00-personas.md` đã nói sẵn — không đổi hành vi hệ thống.
> - **Vòng trả lại `F → K → G → E → F`:** **không giới hạn số lần, có chủ đích**. Trả lại nhiều lượt là diễn tiến bình thường của review; đặt trần sẽ đẻ ra năng lực mới (leo thang, thông báo, màn theo dõi) không tương xứng giá trị. Ghi rõ ở đây để lần soát sau không đọc thành bỏ sót.

**Vai trò & trách nhiệm** (trace về StR):

| Vai trò (lane) | Trách nhiệm trong luồng | Trace StR |
|----------------|-------------------------|-----------|
| Quản lý nhóm (Team Lead) | Tạo, giao và duyệt công việc | StR-02 |
| Thành viên (Member) | Thực hiện, cập nhật trạng thái, gửi duyệt | StR-01 |
| Hệ thống | Gửi thông báo giao việc, **bị trả lại** (`K`) & kết quả duyệt; nhắc deadline định kỳ *(ngoài luồng tuần tự)* | StR-04 / BR-05 |

## 5. Solution Requirements

### 5.1 Functional (FR) — hệ thống phải làm gì

| ID | Yêu cầu chức năng | Trace StR/BR | Ưu tiên |
|----|-------------------|--------------|---------|
| FR-01 | Hệ thống cho phép người dùng đăng nhập bằng email và mật khẩu, khoá tài khoản sau 5 lần nhập sai trong 15 phút | StR-01, StR-02, StR-03, BR-03 | Must |
| FR-02 | Hệ thống cho phép Admin tạo, sửa, vô hiệu hoá tài khoản thành viên | StR-03, BR-03 | Must |
| FR-03 | Hệ thống hiển thị dashboard tổng quan công việc của người dùng (theo vai trò) và thống kê nhanh | StR-01, StR-02, BR-01, BR-04 | Must |
| FR-04 | Hệ thống cho phép tạo công việc mới với tiêu đề, mô tả, người thực hiện, deadline và mức ưu tiên | StR-02, BR-01, BR-02 | Must |
| FR-05 | Hệ thống cho phép giao công việc cho thành viên trong cùng tổ chức | StR-02, BR-02 | Must |
| FR-06 | *(CR-06)* Hệ thống cho phép **thành viên** đưa công việc qua `TODO → IN_PROGRESS → IN_REVIEW`, và **người duyệt** (Team Lead / Org Admin) chốt `IN_REVIEW → DONE` hoặc trả lại `IN_REVIEW → IN_PROGRESS` | StR-01, StR-02, BR-01, BR-02 | Must |
| FR-07 | Hệ thống hiển thị chi tiết công việc gồm lịch sử thay đổi và comment | StR-01, StR-02, BR-01 | Must |
| FR-08 | Hệ thống cho phép thêm comment vào công việc | StR-01, StR-02, BR-01 | Should |
| FR-09 | Hệ thống gửi thông báo in-app khi người dùng được giao công việc mới hoặc trạng thái thay đổi | StR-01, StR-04, BR-05 | Must |
| FR-10 | Hệ thống gửi email nhắc nhở deadline hàng ngày (08:00) cho công việc **đến hạn trong ngày, đến hạn vào ngày hôm sau (T-1)**, hoặc đã quá hạn chưa hoàn thành *(làm rõ theo `DEC-04` — họp 2026-07-21; không cấp `FR` mới, không mở CR)* | StR-04, BR-05 | Should |
| FR-11 | Hệ thống cho phép người dùng xem và cập nhật hồ sơ cá nhân (họ tên, ảnh đại diện, mật khẩu) | StR-01, StR-02, StR-03 | Should |
| FR-12 | Hệ thống cho phép Team Lead/Admin xem và cập nhật thông tin tổ chức (tên, logo) | StR-03, StR-05, BR-03 | Should |
| FR-13 | Hệ thống cho phép người dùng mới tự đăng ký bằng email + mật khẩu và tạo một tổ chức mới, trở thành Org Admin của tổ chức đó; email phải duy nhất toàn hệ thống | StR-03, BR-01, BR-03 | Must |
| FR-14 | *(CR-01)* Hệ thống cho phép Team Lead/Org Admin **xuất báo cáo tiến độ** từ dashboard ra tệp PDF hoặc Excel (thống kê + danh sách công việc theo bộ lọc đang xem) | StR-02, BR-04 | Should |

### 5.2 Non-functional (NFR) — ràng buộc chất lượng (đo được)

| ID | Loại | Yêu cầu | Trace |
|----|------|---------|-------|
| NFR-01 | Hiệu năng | Thời gian phản hồi API ≤ 2 giây ở p95 với 200 người dùng đồng thời | BR-01, BR-04 |
| NFR-02 | Bảo mật | Mật khẩu lưu dưới dạng bcrypt hash (cost ≥ 12); JWT dùng RS256; HTTPS bắt buộc | BR-03 |
| NFR-03 | Bảo mật | Khoá tài khoản sau 5 lần đăng nhập sai trong 15 phút; khoá tạm 15 phút | BR-03, FR-01 |
| NFR-04 | Tính khả dụng | Uptime ≥ 99,5%/tháng (không tính bảo trì có lịch) | BR-01 |
| NFR-05 | Khả năng sử dụng | Hoàn thành luồng "tạo và giao công việc" trong ≤ 3 bước từ Dashboard | BR-04 |
| NFR-06 | Dữ liệu | Dữ liệu tổ chức lưu riêng biệt theo tenant — không có data bleed giữa các tổ chức | BR-03 |
| NFR-07 | Tương thích | Hỗ trợ Chrome ≥ 110, Firefox ≥ 110, Safari ≥ 16, Edge ≥ 110 | BR-01 |

## 6. Transition Requirements (TR)

| ID | Yêu cầu chuyển đổi | Trace |
|----|--------------------|-------|
| TR-01 | Cung cấp hướng dẫn sử dụng (video + tài liệu) cho thành viên trước khi ra mắt | BR-01, BR-04 |
| TR-02 | Admin có thể import danh sách thành viên qua file CSV trong tháng đầu tiên | BR-03, FR-02 |

## 7. Ràng buộc & Giả định

- **Ràng buộc:**
  - Ngân sách hosting: cloud provider thông thường (AWS/GCP), không on-premise.
  - Timeline: MVP ra mắt trong 3 tháng; phạm vi giai đoạn 1 theo tài liệu này.
  - Không tích hợp OAuth/SSO giai đoạn 1.
  - Pháp lý: dữ liệu lưu tại Việt Nam hoặc Singapore (PDPA tương thích).

- **Giả định:**
  - Mỗi công việc chỉ có 1 người thực hiện chính.
  - Org Admin tạo tài khoản cho thành viên trong tổ chức; ngoài ra người dùng mới có thể **tự đăng ký** để tạo một tổ chức mới và trở thành Org Admin của tổ chức đó (xem FR-13). *(Cập nhật khi thêm màn Đăng ký — trước đó giả định không có đăng ký tự do.)*
  - Không có tính năng "Quên mật khẩu" tự phục vụ; Admin reset thủ công.
  - Hệ thống web; không có app mobile trong giai đoạn 1.

## 8. Tiêu chí thành công

- **BR-01:** Sau 1 tháng ra mắt, ≥ 80% công việc của nhóm được tạo và theo dõi qua TeamTasks (đo qua analytics).
- **BR-02:** Không còn "công việc mồ côi" (không có người thực hiện) trong hệ thống — 100% công việc có assignee và deadline.
- **BR-03:** Không có sự cố truy cập trái phép giữa các tổ chức trong 6 tháng đầu vận hành.
- **BR-04:** Giảm ≥ 50% số cuộc họp cập nhật trạng thái hàng tuần (đo qua khảo sát nhóm sau 2 tháng).
- **BR-05:** Tỷ lệ công việc trễ deadline giảm ≥ 30% so với trước khi dùng hệ thống (đo sau 2 tháng).

## Thuật ngữ
| Thuật ngữ | Giải thích |
|---|---|
| BR (Business Requirement) | Yêu cầu nghiệp vụ — điều tổ chức muốn đạt được |
| StR (Stakeholder Requirement) | Yêu cầu ở góc nhìn một bên liên quan cụ thể |
| FR (Functional Requirement) | Yêu cầu chức năng — điều hệ thống phải làm |
| NFR (Non-Functional Requirement) | Yêu cầu phi chức năng — hệ thống phải làm tốt tới mức nào (hiệu năng, bảo mật…) |
| BRule (Business Rule) | Quy tắc nghiệp vụ ràng buộc hành vi hệ thống |
| TR (Transition Requirement) | Yêu cầu chuyển đổi — chỉ cần trong giai đoạn go-live (di trú dữ liệu, đào tạo) |
| MoSCoW | Cách xếp ưu tiên: Must / Should / Could / Won't |
| MVP (Minimum Viable Product) | Bản đủ nhỏ để dùng được và kiểm chứng giả thuyết |
| PDPA | Luật bảo vệ dữ liệu cá nhân (Personal Data Protection Act) — ràng buộc nơi lưu dữ liệu |

> Từ điển đầy đủ toàn dự án: `docs/00-glossary.md`.
