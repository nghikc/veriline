# Tài liệu yêu cầu — <Tên App>

> Phân loại yêu cầu: Business → Stakeholder → Solution (Functional/Non-functional) → Business Rules → Transition.
> Thuộc tính mỗi yêu cầu: ID · Nguồn · Ưu tiên (MoSCoW) · Trạng thái · Truy vết.
> **Mỗi yêu cầu đạt SMART (IEEE 830):** atomic · unambiguous · testable/measurable · feasible · traceable. NFR luôn kèm số đo.

## 1. Business Need
<Vấn đề/cơ hội kinh doanh cần giải quyết; lý do làm dự án.>

## 2. Business Requirements (BR)
Mục tiêu/kết quả ở cấp tổ chức.

| ID | Yêu cầu nghiệp vụ | Lý do (rationale) | Ưu tiên |
|----|-------------------|-------------------|---------|
| BR-01 | <...> | <...> | Must |

## 3. Stakeholder Requirements (StR)
Nhu cầu của từng nhóm liên quan, trace về BR.

| ID | Nhóm liên quan | Nhu cầu | Trace BR |
|----|----------------|---------|----------|
| StR-01 | <vai trò> | <...> | BR-01 |

## 4. Luồng nghiệp vụ chính & Vai trò (swimlane)
Mô tả **một số nghiệp vụ chính** (end-to-end) — ai làm bước gì, bàn giao giữa các vai trò — bằng sơ đồ **swimlane**. Chọn 2–4 nghiệp vụ cốt lõi (vd đặt hàng, duyệt, thanh toán); mỗi nghiệp vụ một sơ đồ + một bảng vai trò/trách nhiệm.

> **BẮT BUỘC — swimlane, KHÔNG flowchart:** luồng nghiệp vụ ở mục này luôn có **nhiều vai trò** (khách hàng/nhân viên/quản lý/hệ thống…) nên **phải** vẽ bằng `swimlane-beta` để thấy rõ *ai làm gì* và *điểm bàn giao*. **Tuyệt đối không** thay bằng `flowchart` (flowchart giấu mất vai trò → sai mục đích của mục này). Chỉ khi một luồng đúng **1 tác nhân duy nhất** mới cân nhắc `flowchart` — hiếm ở cấp requirements.

> **Cách vẽ swimlane trong Mermaid:** dùng kiểu gốc **`swimlane-beta LR`**, **mỗi vai trò là một `subgraph`** (một lane). Node của bước đặt trong lane người thực hiện; mũi tên nối chéo lane = bàn giao; nhãn cạnh dùng `-->|nhãn|`. **Tô màu theo vai node** bằng `:::role` + khối `classDef` (xem "Bảng màu phân vai node" trong `conventions.md`). Cần Mermaid **≥ 11.16** để render (bản vendored của `ba-portal` đã đủ). Tuân thủ "Sơ đồ Mermaid — an toàn cú pháp" trong `conventions.md` (nhãn có ký tự đặc biệt → bọc `["..."]`).

### 4.1 Nghiệp vụ: <tên nghiệp vụ chính>
```mermaid
swimlane-beta LR
  subgraph KH[Khách hàng]
    A([Bắt đầu]):::startend --> B[Gửi yêu cầu đặt hàng]:::task
  end
  subgraph NV[Nhân viên bán hàng]
    C[Tiếp nhận đơn]:::task --> D{"Đơn trên 10 triệu?"}:::decision
  end
  subgraph QL[Quản lý]
    E[Duyệt đơn]:::task
  end
  subgraph HT[Hệ thống]
    F[Ghi nhận và tạo hóa đơn]:::task --> G([Kết thúc]):::startend
  end
  B --> C
  D -->|Không| F
  D -->|Có| E --> F
  classDef task fill:#e6fffb,stroke:#13a89e,stroke-width:1.5px,color:#134e4a
  classDef decision fill:#fff3e6,stroke:#e8820c,stroke-width:1.5px,color:#7a4a00
  classDef startend fill:#13897e,stroke:#0c6b62,color:#ffffff
```

**Vai trò & trách nhiệm** (trace về StR):

| Vai trò (lane) | Trách nhiệm trong luồng | Trace StR |
|----------------|-------------------------|-----------|
| Khách hàng | Khởi tạo đơn hàng | StR-01 |
| Nhân viên bán hàng | Tiếp nhận, phân loại đơn | StR-02 |
| Quản lý | Duyệt đơn giá trị lớn (theo `BRule-..`) | StR-03 |

*(Lặp 4.2, 4.3… cho các nghiệp vụ chính khác.)*

## 5. Solution Requirements

### 5.1 Functional (FR) — hệ thống phải làm gì
| ID | Yêu cầu chức năng | Trace StR/BR | Ưu tiên |
|----|-------------------|--------------|---------|
| FR-01 | Hệ thống cho phép <...> | StR-01 | Must |

### 5.2 Non-functional (NFR) — ràng buộc chất lượng (đo được)
| ID | Loại | Yêu cầu | Trace |
|----|------|---------|-------|
| NFR-01 | Hiệu năng | <vd: phản hồi < 2s với 1000 người dùng đồng thời> | BR-01 |
| NFR-02 | Bảo mật | <...> | BR-01 |

## 6. Business Rules (BRule)
Quy tắc/ràng buộc nghiệp vụ — tách riêng khỏi FR vì thay đổi độc lập.

| ID | Quy tắc nghiệp vụ | Trace BR/FR |
|----|-------------------|-------------|
| BRule-01 | <vd: đơn hàng > 10 triệu cần quản lý duyệt> | FR-03, BR-01 |

## 7. Transition Requirements (TR)
Yêu cầu tạm thời để chuyển từ hiện trạng sang giải pháp (di trú dữ liệu, đào tạo, chạy song song). Bỏ trống nếu không có.

| ID | Yêu cầu chuyển đổi | Trace |
|----|--------------------|-------|
| TR-01 | <vd: di trú dữ liệu người dùng cũ> | BR-01 |

## 8. Ràng buộc & Giả định
- **Ràng buộc:** <công nghệ, ngân sách, thời gian, pháp lý>
- **Giả định** (rà & xác nhận theo "Xác nhận giả định" trong `conventions.md`; trạng thái: Đề xuất / Đã xác nhận / Đã sửa / Đã bỏ / ⚠️ chưa xác nhận):

| Mã | Giả định | Vì sao cần (chỗ thiếu) | Ảnh hưởng nếu sai | Trạng thái |
|----|----------|------------------------|-------------------|-----------|
| GĐ-01 | <...> | <...> | <...> | Đề xuất |

## 9. Tiêu chí thành công
<Cách đo lường giải pháp đạt Business Need; gắn về BR.>

## Thuật ngữ
| Thuật ngữ | Giải thích |
|-----------|-----------|
| BR (Business Requirement) | Yêu cầu nghiệp vụ — mục tiêu/kết quả ở cấp tổ chức |
| StR (Stakeholder Requirement) | Yêu cầu của một nhóm liên quan, truy vết về BR |
| FR / NFR | Yêu cầu chức năng / phi chức năng (hệ thống làm gì / ràng buộc chất lượng) |
| BRule (Business Rule) | Quy tắc nghiệp vụ, tách riêng khỏi FR |
| Swimlane | Sơ đồ luồng chia làn theo vai trò — mỗi làn một bên tham gia, thể hiện ai làm bước gì và bàn giao |
| MoSCoW | Cách xếp ưu tiên: Must / Should / Could / Won't |
| SMART | Tiêu chí yêu cầu tốt: cụ thể, đo được, khả thi, liên quan, có mốc |

> Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`.
