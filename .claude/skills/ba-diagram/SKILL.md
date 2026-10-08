---
name: ba-diagram
description: Use when cần VẼ một sơ đồ từ mô tả nghiệp vụ — tự chọn đúng loại Mermaid (swimlane đa vai, flowchart, sequence, state, ER, journey, gantt) và vẽ đạt chuẩn. Cửa vào cho mọi "vẽ sơ đồ cho X".
---

# ba-diagram — Chọn & vẽ sơ đồ Mermaid

## Mục tiêu
Nhận một mô tả ("vẽ sơ đồ cho luồng X / dữ liệu Y / trạng thái Z") → **tự chọn đúng loại sơ đồ Mermaid** → **vẽ đạt chuẩn toolkit** (render được + đủ nghiệp vụ + có màu). Là cửa vào khi yêu cầu vẽ diagram **không gắn với một skill có sẵn** (ba-requirements/ba-screen-spec/ba-data-model đã tự vẽ sơ đồ của mình). Giữ thuần Mermaid, zero-dependency.

## Quy trình

### 1. Đọc mô tả & phân loại (làm rõ nếu thiếu)
Xác định bản chất thứ cần mô tả + **đếm số vai trò/tác nhân**. Thiếu thông tin cốt lõi → hỏi 1–2 câu **nghiệp vụ** (không kỹ thuật): các bước / vai trò nào làm gì / điểm rẽ nhánh / trạng thái / thực thể.

### 2. CHỌN loại sơ đồ
Nguồn quyết định = **"Bộ chọn sơ đồ Mermaid"** trong `conventions.md` (bảng "khi nào / KHÔNG dùng"). Luật nhanh:

| Mô tả là… | Loại |
|---|---|
| Luồng nghiệp vụ **≥2 vai trò** có bàn giao | **`swimlane-beta`** (KHÔNG flowchart) — ≤ 8 node `LR`, **> 8 node hoặc ≥ 4 lane `TD`** |
| Quy trình **1 tác nhân**, có rẽ nhánh/quyết định | `flowchart TD` (Activity) |
| Tổng quan tác nhân ↔ chức năng | `flowchart LR` (Use case) |
| Tương tác **theo thời gian** giữa các bên/hệ thống | `sequenceDiagram` |
| **Vòng đời trạng thái** của một đối tượng | `stateDiagram-v2` |
| **Thực thể & quan hệ** dữ liệu | `erDiagram` |
| **Kiến trúc — phân tầng / triển khai / topo service** | **`flowchart TB` + `subgraph`** (tô `classDef`; KHÔNG architecture-beta) |
| **Kiến trúc — ngữ cảnh** hệ thống | **`flowchart LR` + `subgraph`** (KHÔNG C4Context) |
| Hành trình người dùng (cảm xúc theo bước) | `journey` |
| Tiến độ/timeline | `gantt` / `timeline` |

> **Lỗi hay gặp:** mặc định `flowchart` cho luồng đa vai → SAI. **Đếm vai trò trước**; ≥2 vai → swimlane. Cách vẽ chi tiết từng loại: `recipes.md` (cùng thư mục).

### 3. Trích fact-list
Ghi lại: **vai trò/tác nhân · điểm quyết định + nhánh · loop · outcome mỗi nhánh · thực thể/quan hệ** — nền để vẽ đủ và đối chiếu ở bước 5.

### 4. Vẽ (theo `recipes.md`)
Dùng template + cách vẽ của loại đã chọn trong `recipes.md`, đồng thời tuân:
- **An toàn cú pháp** — "Sơ đồ Mermaid — an toàn cú pháp" trong `conventions.md` (render ra ảnh được, không vỡ).
- **Tiếng Việt PHẢI CÓ DẤU** (quy tắc 8 của mục đó) — mọi nhãn node/cạnh, tên lane, tiêu đề, message: `Đăng nhập`, KHÔNG `Dang nhap`. Chỉ **ID node** mới để ASCII: `S01[Đăng nhập]` ✅ · `S01[Dang nhap]` ❌. Diacritics **không bao giờ** làm vỡ Mermaid — vỡ là do ký tự đặc biệt; bỏ dấu "cho an toàn" là chữa sai bệnh. Sơ đồ tiếng Anh chỉ đúng khi tài liệu là tiếng Anh, hoặc nhãn là thuật ngữ kỹ thuật/tên sản phẩm (`Redis`, `UI Controller`, `Org Admin`).
- **Tô màu phân vai** — gắn `:::role` + khối `classDef`:
  - Có `docs/07-design-system.md` → dùng khối **theo token** (mục "Mermaid theme" của design system).
  - Chưa có → dùng **bộ mặc định** ("Bảng màu phân vai node" trong `conventions.md`).
  - `sequenceDiagram`/`erDiagram` không nhận `classDef` → chỉ house theme.

### 5. Đối chiếu coverage + gate
Đối chiếu sơ đồ với fact-list ("Kiểm coverage sơ đồ" trong `conventions.md`): đủ vai trò↔lane; mỗi quyết định **≥2 nhánh có nhãn**; **không dead-end**; không orphan branch; (ERD) thực thể có PK + quan hệ có cardinality. Sơ đồ **phức tạp** (≥3 vai trò **HOẶC** ≥5 quyết định **HOẶC** lồng ≥2 tầng **HOẶC** có loop) → chạy **`ba-review diagram <file>`** (agent `ba-diagram-reviewer`) trước khi chốt.

### 6. Đặt sơ đồ
- Gắn với tài liệu (srs/overview/requirements/data-model…) → chèn đúng chỗ + cập nhật `00-tracking.md` ("Cập nhật cuối") nếu là tài liệu của một màn.
- Vẽ lẻ → trả về khối ```mermaid``` + gợi ý nơi lưu; muốn xem hình → nhắc chạy `ba-portal --single <file>` để render offline.

## Ranh giới
- Kiến trúc & ngữ cảnh dùng `flowchart` + `subgraph`.
- Cần xuất sơ đồ thành .svg hoặc HTML tương tác để đem đi dùng → `ba-figure`.

## Lưu ý
- **Yêu cầu loại cần ENGINE NGOÀI** (BPMN chuẩn OMG, DBML/export SQL, D2, use-case UML native) — Mermaid không có gốc. **Giải thích + vẽ bản Mermaid tương đương** (swimlane cho BPMN, erDiagram cho DBML/D2-ERD, flowchart cho D2-activity, flowchart+subgraph cho D2-architect) theo **mục 10 của `recipes.md`**; nếu bắt buộc chuẩn gốc (import Camunda / export SQL chạy được) → báo rõ phải dùng công cụ ngoài, không im lặng vẽ sai.
- **Một mô tả có thể cần >1 sơ đồ bổ trợ** (vd luồng + trạng thái + ERD) — đề xuất bộ sơ đồ, không nhồi tất cả vào 1 hình.
- Chỉ vẽ khi sơ đồ **thật sự làm rõ hơn** chữ/bảng ("phục vụ truyền đạt, không phô diễn"); luồng 3–4 bước tuyến tính → danh sách đánh số là đủ.
- Tiếng Việt; nhãn tự nhiên, mở rộng viết tắt ở lần đầu.

## Tham chiếu
- `.claude/skills/ba-toolkit/references/conventions.md` → **"Bộ chọn sơ đồ Mermaid"** (quyết định) · **"Kiểm coverage sơ đồ"** · **"Sơ đồ Mermaid — an toàn cú pháp"** · **"Bảng màu phân vai node"**.
- `recipes.md` (cùng thư mục) — cách vẽ + template + tô màu từng loại.
- Agent `ba-diagram-reviewer` — soát coverage cho sơ đồ phức tạp (qua `ba-review diagram`).
