# Kế hoạch nghiệm thu người dùng (UAT) — <Tên App>

> Nghiệm thu **nghiệp vụ, xuyên màn, do người dùng/PO/khách hàng chạy** — bổ trợ (không thay) test kỹ thuật per màn ở các `test.md`.

## 1. Phạm vi & mục tiêu nghiệm thu
- **Mục tiêu:** xác nhận hệ thống đáp ứng nhu cầu nghiệp vụ trước khi ra mắt.
- **Phạm vi nghiệm thu:** <các luồng nghiệp vụ / nhóm chức năng được nghiệm thu>.
- **Ngoài phạm vi:** <phần không nghiệm thu ở đợt này, nếu có>.
- **Người tham gia:** PO · BA · đại diện người dùng/khách hàng · QA lead.
- **Môi trường & dữ liệu:** <môi trường UAT, bộ dữ liệu mẫu, tài khoản test>.
- **Điều kiện vào (Entry):** tất cả màn đã có tài liệu + code, test kỹ thuật per màn đạt mức tối thiểu.

## 2. Kịch bản UAT (end-to-end, theo luồng nghiệp vụ)

### UAT-01 — <Tên luồng nghiệp vụ, vd Đăng ký và kích hoạt tài khoản>
| Mục | Nội dung |
|-----|----------|
| **Tiền điều kiện** | <trạng thái hệ thống/dữ liệu/vai trò trước khi chạy> |
| **Vai trò chạy** | <vd Người dùng cuối / Quản trị viên> |
| **Trace FR/BR** | FR-01, FR-03, BR-02 |
| **Trace UC** | UC-S01-01, UC-S06-02 |
| **Màn đi qua** | S06 → S01 → S02 |
| **Dữ liệu mẫu** | email `an.nguyen@vd.vn`, mật khẩu `Matkhau@123`, gói `Dùng thử 30 ngày` |
| **Trạng thái** | Chưa chạy |

**Các bước nghiệp vụ:**
1. Người dùng mở màn Đăng ký (S06), nhập email và mật khẩu mẫu, bấm "Tạo tài khoản".
2. Người dùng mở email kích hoạt và bấm liên kết xác nhận.
3. Người dùng đăng nhập (S01) bằng tài khoản vừa tạo.
4. …

**Kết quả mong đợi (đo được):**
- Sau bước 1: hệ thống hiển thị "Đã gửi email kích hoạt tới an.nguyen@vd.vn" và tạo 1 bản ghi tài khoản trạng thái `Chờ kích hoạt`.
- Sau bước 3: đăng nhập thành công, chuyển tới Dashboard (S02) hiển thị tên "An Nguyen" và gói "Dùng thử 30 ngày".
- <mỗi kết quả là số/trạng thái/thông báo cụ thể — KHÔNG viết "chạy ổn">

---

### UAT-02 — <Tên luồng nghiệp vụ tiếp theo>
| Mục | Nội dung |
|-----|----------|
| **Tiền điều kiện** | … |
| **Vai trò chạy** | … |
| **Trace FR/BR** | … |
| **Trace UC** | … |
| **Màn đi qua** | … |
| **Dữ liệu mẫu** | … |
| **Trạng thái** | Chưa chạy |

**Các bước nghiệp vụ:** 1. … 2. …
**Kết quả mong đợi (đo được):** …

## 3. Ma trận truy vết yêu cầu → UAT (RTM)
> Soát hai chiều: mỗi `FR` Must có ≥1 UAT; mỗi UAT trace ngược về ≥1 FR/BR (không kịch bản mồ côi).

| Yêu cầu (FR/BR) | Ưu tiên (MoSCoW) | Use case (UC) | Kịch bản UAT | Trạng thái |
|-----------------|------------------|---------------|--------------|------------|
| FR-01 | Must | UC-S06-02 | UAT-01 | Chưa chạy |
| FR-03 | Must | UC-S01-01 | UAT-01 | Chưa chạy |
| BR-02 | Must | UC-S01-01 | UAT-01 | Chưa chạy |
| FR-05 | Should | UC-S02-01 | UAT-02 | Chưa chạy |

**Kiểm độ phủ:**
- FR Must chưa có UAT: <liệt kê hoặc "không">.
- UAT chưa trace ngược yêu cầu: <liệt kê hoặc "không">.

## 4. Checklist ký nghiệm thu

### 4.1. Tiêu chí ra mắt (Definition of Done / Release readiness — đo được)
| # | Tiêu chí | Cách kiểm | Đạt? |
|---|----------|-----------|------|
| 1 | Mọi FR ưu tiên **Must** có ≥1 UAT trạng thái `Đạt` | Đối chiếu mục 3 | ☐ |
| 2 | Không còn lỗi nghiêm trọng (Critical/High) đang mở | Sổ lỗi/bug tracker | ☐ |
| 3 | Dữ liệu di trú đã kiểm & khớp nguồn | Báo cáo đối soát dữ liệu | ☐ |
| 4 | `NFR` then chốt (hiệu năng/bảo mật) đạt ngưỡng đã định | Kết quả đo `NFR` | ☐ |
| 5 | Tài liệu hướng dẫn người dùng sẵn sàng | Kiểm tài liệu | ☐ |

### 4.2. Vai trò ký nghiệm thu
| Vai trò | Họ tên | Ngày | Kết luận (Chấp nhận / Chấp nhận có điều kiện / Từ chối) | Ghi chú/điều kiện |
|---------|--------|------|--------------------------------------------------------|-------------------|
| Product Owner (PO) | | | | |
| Business Analyst (BA) | | | | |
| Đại diện khách hàng/người dùng | | | | |
| QA Lead | | | | |

## Giả định
| Mã | Nội dung giả định | Vì sao cần (chỗ thiếu) | Ảnh hưởng nếu sai | Trạng thái |
|----|-------------------|------------------------|-------------------|------------|
| GĐ-01 | <vd tiêu chí hiệu năng là <2s tải trang> | Chưa có ngưỡng NFR chốt | Sai ngưỡng nghiệm thu | ⚠️ chưa xác nhận |

> Trạng thái mỗi dòng: `Đề xuất → Đã xác nhận / Đã sửa / Đã bỏ`. Còn `⚠️ chưa xác nhận` → `ba-review` gắn gap 🟠 Nợ có hạn (`Mốc = ba-build`).

## Thuật ngữ
| Thuật ngữ | Giải thích |
|-----------|-----------|
| UAT (User Acceptance Testing) | Nghiệm thu người dùng — người dùng/PO xác nhận hệ thống đáp ứng nghiệp vụ trước khi ra mắt |
| GWT (Given-When-Then) | Cấu trúc mô tả tiêu chí chấp nhận: bối cảnh — hành động — kết quả mong đợi |
| RTM (Requirements Traceability Matrix) | Ma trận truy vết yêu cầu ↔ use case ↔ UAT, chứng minh độ phủ hai chiều |
| DoD (Definition of Done) | Bộ tiêu chí đo được xác định "được coi là hoàn thành / được ra mắt" |
| MoSCoW | Cách xếp ưu tiên: Must / Should / Could / Won't |
| FR / BR | Yêu cầu chức năng (Functional Requirement) / Yêu cầu nghiệp vụ (Business Requirement) |
| NFR (Non-functional Requirement) | Yêu cầu phi chức năng — hiệu năng, bảo mật, khả dụng… |

> Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`.
