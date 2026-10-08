# Phân tích quy trình nghiệp vụ (AS-IS / TO-BE) — <Tên App>

> Tài liệu phân tích hiện trạng — chạy sớm (sau stakeholder/brainstorm, trước/song song `ba-requirements`). Yêu cầu phát sinh ở mục 5 là đầu vào để `ba-requirements` cấp mã chính thức.

## 1. Bối cảnh & phạm vi quy trình
- **Quy trình đang xét:** <tên quy trình nghiệp vụ, vd "Xử lý đơn đặt hàng">.
- **Hiện trạng vận hành:** <thủ công / trên giấy / Excel / hệ thống cũ …>.
- **Lý do số hóa:** <vì sao cần đưa lên hệ thống>.
- **Vai trò/tác nhân tham gia:** <Khách hàng, Nhân viên, Quản lý, Hệ thống…>.
- **Điểm bắt đầu → kết thúc (phạm vi):** <sự kiện mở đầu> → <kết quả cuối>.
- **Ngoài phạm vi:** <bước/quy trình liên quan nhưng không xét ở đây>.

## 2. Quy trình AS-IS (hiện trạng)
> Cách vận hành **hiện tại** (thủ công / hệ thống cũ). Mỗi vai trò một lane; mũi tên chéo lane = bàn giao.

```mermaid
swimlane-beta LR
  subgraph KH[Khách hàng]
    A([Bắt đầu]):::startend --> B[Gọi điện đặt hàng]:::task
  end
  subgraph NV[Nhân viên]
    C[Ghi đơn vào sổ giấy]:::task --> D[Nhập lại vào Excel]:::task
    D --> E{"Còn hàng?"}:::decision
  end
  subgraph QL[Quản lý]
    F[Ký duyệt trên giấy]:::task
  end
  B --> C
  E -->|Không| G[Gọi báo khách hết hàng]:::error
  E -->|Có| F
  F --> H([Kết thúc]):::startend
  classDef task fill:#e6fffb,stroke:#13a89e,stroke-width:1.5px,color:#134e4a
  classDef decision fill:#fff3e6,stroke:#e8820c,stroke-width:1.5px,color:#7a4a00
  classDef startend fill:#13897e,stroke:#0c6b62,color:#ffffff
  classDef error fill:#fff5f5,stroke:#d64545,color:#7a1f1f
```

**Pain point / nút thắt (theo bước):**
| Bước AS-IS | Vấn đề | Loại lãng phí (value-added analysis) |
|------------|--------|--------------------------------------|
| Ghi đơn vào sổ giấy | Chữ khó đọc, dễ mất | Lãng phí (thao tác thừa) |
| Nhập lại vào Excel | Nhập 2 lần, sai lệch số liệu | Lãng phí (làm lại) |
| Ký duyệt trên giấy | Chờ quản lý có mặt | Lãng phí (chờ đợi) |

## 3. Quy trình TO-BE (tương lai có hệ thống)
> Cách vận hành **sau khi có hệ thống**. Lane "Hệ thống" gánh phần việc số hóa/tự động hóa.

```mermaid
swimlane-beta LR
  subgraph KH[Khách hàng]
    A([Bắt đầu]):::startend --> B[Đặt hàng trên web]:::task
  end
  subgraph HT[Hệ thống]
    C[Ghi nhận đơn tự động]:::task --> D{"Còn hàng?"}:::decision
    D -->|Không| E[Báo hết hàng ngay tại chỗ]:::error
    D -->|Có| F[Tạo đơn chờ duyệt]:::task
  end
  subgraph QL[Quản lý]
    G[Duyệt đơn online]:::task
  end
  B --> C
  F --> G
  G --> H[Tự tạo hóa đơn và thông báo]:::task
  H --> I([Kết thúc]):::startend
  classDef task fill:#e6fffb,stroke:#13a89e,stroke-width:1.5px,color:#134e4a
  classDef decision fill:#fff3e6,stroke:#e8820c,stroke-width:1.5px,color:#7a4a00
  classDef startend fill:#13897e,stroke:#0c6b62,color:#ffffff
  classDef error fill:#fff5f5,stroke:#d64545,color:#7a1f1f
```

**Vai trò & thay đổi trách nhiệm (AS-IS → TO-BE):**
| Vai trò (lane) | Trước (AS-IS) | Sau (TO-BE) |
|----------------|---------------|-------------|
| Khách hàng | Gọi điện | Tự đặt trên web |
| Nhân viên | Ghi sổ + nhập Excel | (bỏ — hệ thống ghi nhận) |
| Hệ thống | (chưa có) | Ghi nhận, kiểm kho, tạo hóa đơn |
| Quản lý | Ký giấy | Duyệt online |

## 4. Gap analysis (AS-IS → TO-BE)
> Đối chiếu từng bước. **ESIA:** E=Eliminate (bỏ) · S=Simplify (đơn giản hóa) · I=Integrate (gộp) · A=Automate (tự động hóa). Mỗi dòng **phải** có loại thay đổi + cơ hội/nguyên nhân.

| Bước / Khía cạnh | AS-IS | TO-BE | Loại thay đổi (ESIA) | Cơ hội / nguyên nhân |
|------------------|-------|-------|----------------------|----------------------|
| Tiếp nhận đơn | Gọi điện, ghi sổ | Khách tự đặt trên web | A — Automate | Bỏ khâu trung gian, giảm sai sót nhập tay |
| Nhập liệu | Nhập 2 lần (sổ→Excel) | Hệ thống ghi nhận 1 lần | E — Eliminate | Xóa bước nhập lại → hết lệch số liệu |
| Kiểm tồn kho | Nhân viên tra thủ công | Kiểm tự động khi đặt | A — Automate | Phản hồi tức thì cho khách |
| Duyệt đơn | Ký giấy, chờ có mặt | Duyệt online mọi lúc | S — Simplify | Rút thời gian chờ |
| Lập hóa đơn | Viết tay | Sinh tự động | A — Automate | Chuẩn hóa, giảm sai |

## 5. Yêu cầu phát sinh (từ gap)
> Mỗi gap đẻ ra ≥1 yêu cầu. **Trace ra `FR`/`BR`/`TR`** — `ba-requirements` sẽ cấp mã chính thức. `TR` = Transition Requirement (di trú dữ liệu / đào tạo / chạy song song / chuyển đổi).

| # | Yêu cầu phát sinh | Từ gap (bước) | Trace (FR/BR/TR) | Ghi chú |
|---|-------------------|---------------|------------------|---------|
| 1 | Khách hàng đặt hàng trực tuyến | Tiếp nhận đơn | FR-.. | Chức năng cốt lõi TO-BE |
| 2 | Kiểm tồn kho tự động khi đặt | Kiểm tồn kho | FR-.. | — |
| 3 | Quy tắc: đơn > 10 triệu cần quản lý duyệt | Duyệt đơn | BR-.. (BRule-..) | Giữ luật nghiệp vụ cũ |
| 4 | Di trú dữ liệu khách hàng từ Excel sang hệ thống | Nhập liệu | TR-.. | Làm sạch + import 1 lần |
| 5 | Đào tạo nhân viên dùng hệ thống mới | Toàn quy trình | TR-.. | Trước go-live |
| 6 | Chạy song song hệ cũ + mới 2 tuần | Toàn quy trình | TR-.. | Giảm rủi ro chuyển đổi |

## Giả định
> Trạng thái mỗi dòng: `Đề xuất → Đã xác nhận / Đã sửa / Đã bỏ`. Chế độ batch chưa hỏi được → đánh dấu `⚠️ chưa xác nhận`. Xem "Xác nhận giả định" trong `conventions.md`.

| GĐ | Nội dung | Vì sao cần (chỗ thiếu) | Ảnh hưởng nếu sai | Trạng thái |
|----|----------|------------------------|-------------------|-----------|
| GĐ-01 | <giả định về bước hiện trạng> | <thiếu mô tả quy trình tay> | <lệch gap> | Đề xuất |

## Thuật ngữ
| Thuật ngữ | Giải thích |
|-----------|-----------|
| AS-IS | Mô hình quy trình **hiện trạng** — cách vận hành hiện tại |
| TO-BE | Mô hình quy trình **tương lai** — cách vận hành sau khi có hệ thống |
| Gap Analysis | Phân tích khoảng cách giữa hiện trạng và tương lai để rút yêu cầu/cải tiến |
| ESIA | Phân loại thay đổi: Eliminate (bỏ) / Simplify (đơn giản hóa) / Integrate (gộp) / Automate (tự động hóa) |
| Swimlane | Sơ đồ quy trình chia lane theo vai trò — thấy rõ ai làm gì và điểm bàn giao |
| Value-added analysis | Soi mỗi bước là tạo giá trị hay lãng phí (chờ/làm lại/thao tác thừa) |
| TR (Transition Requirement) | Yêu cầu chuyển đổi — di trú dữ liệu, đào tạo, chạy song song khi go-live |
| FR (Functional Requirement) | Yêu cầu chức năng — hệ thống phải làm gì |
| BR (Business Requirement) | Yêu cầu nghiệp vụ cấp doanh nghiệp |

> Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`.
