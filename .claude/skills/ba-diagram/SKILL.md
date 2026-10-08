---
name: ba-diagram
description: Use when cần VẼ sơ đồ từ mô tả nghiệp vụ — tự chọn loại Mermaid (swimlane, flowchart, sequence, state, ER…) và vẽ đạt chuẩn; `export` biên dịch sơ đồ có sẵn thành .svg + HTML tương tác đem đi dùng.
---

# ba-diagram — Chọn & vẽ sơ đồ Mermaid

## Chế độ
| Gọi | Làm gì |
|---|---|
| `/ba-diagram <mô tả>` (mặc định) | chọn loại + vẽ sơ đồ — quy trình bên dưới |
| `/ba-diagram export <file.md> [--index N] [--all]` | biên dịch sơ đồ **đã có** thành `.svg` tĩnh + trang HTML tự chứa — mục **"Chế độ `export`"** cuối file (trước 08/10/2026 là skill `ba-figure`) |

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
- Cần xuất sơ đồ thành .svg hoặc HTML tương tác để đem đi dùng → chế độ `export` (dưới).
- KHÁC `ba-portal`: portal dựng **cả bộ** tài liệu và nhúng 3,4 MB mermaid để vẽ lúc mở; `export` là **một** hình biên dịch sẵn, nhẹ hơn ~290 lần. Không thay `ba-portal sitemap` (một trang gộp luồng màn).

## Lưu ý
- **Yêu cầu loại cần ENGINE NGOÀI** (BPMN chuẩn OMG, DBML/export SQL, D2, use-case UML native) — Mermaid không có gốc. **Giải thích + vẽ bản Mermaid tương đương** (swimlane cho BPMN, erDiagram cho DBML/D2-ERD, flowchart cho D2-activity, flowchart+subgraph cho D2-architect) theo **mục 10 của `recipes.md`**; nếu bắt buộc chuẩn gốc (import Camunda / export SQL chạy được) → báo rõ phải dùng công cụ ngoài, không im lặng vẽ sai.
- **Một mô tả có thể cần >1 sơ đồ bổ trợ** (vd luồng + trạng thái + ERD) — đề xuất bộ sơ đồ, không nhồi tất cả vào 1 hình.
- Chỉ vẽ khi sơ đồ **thật sự làm rõ hơn** chữ/bảng ("phục vụ truyền đạt, không phô diễn"); luồng 3–4 bước tuyến tính → danh sách đánh số là đủ.
- Tiếng Việt; nhãn tự nhiên, mở rộng viết tắt ở lần đầu.

## Tham chiếu
- `.claude/skills/ba-toolkit/references/conventions.md` → **"Bộ chọn sơ đồ Mermaid"** (quyết định) · **"Kiểm coverage sơ đồ"** · **"Sơ đồ Mermaid — an toàn cú pháp"** · **"Bảng màu phân vai node"**.
- `recipes.md` (cùng thư mục) — cách vẽ + template + tô màu từng loại.
- Agent `ba-diagram-reviewer` — soát coverage cho sơ đồ phức tạp (qua `ba-review diagram`).

## Chế độ `export` — một sơ đồ → SVG tĩnh + trang tương tác
Dùng khi cần *một hình* để đưa vào slide, Word hay gửi khách. `ba-portal` vẽ lúc mở trang (runtime, 3,4 MB); `export` biên dịch **lúc build** (~12–190 KB, không runtime, có file `.svg`, sơ đồ hỏng thì biết ngay ở đây). Nguồn vẫn là Mermaid trong `.md` — ý tưởng compile-sẵn lấy từ Archify (`research/04-archify.md`), không chép IR của họ.

```bash
node .claude/skills/ba-diagram/scripts/figure.js <file.md> [--index N] [--all] [--out <thư mục>] [--title "..."]
node .claude/skills/ba-diagram/scripts/figure.js <file.mmd> [--out <thư mục>]
```
- `--index N` — sơ đồ thứ N (mặc định 1). `--all` — mọi sơ đồ, **một lần mở Chrome** cho cả lô. Tên file lấy từ **tiêu đề gần nhất phía trên** sơ đồ.
- Đầu ra: `<tên>.svg` + `<tên>.html` (tự chứa, nhúng lại nguồn Mermaid trong comment để sửa sau). Chỉ đọc `.md` nguồn, ghi ra `--out`.
- **Cần Chrome/Chromium** — không có thì báo lỗi và dừng; cố ý không có đường "nhúng runtime cho xong" (đó là đúng thứ `ba-portal` đã làm).
- Sơ đồ hỏng cú pháp → **dừng mã 1**, không ghi file nửa vời.
- **Tương tác chỉ có với `flowchart`/`graph`/`swimlane-beta`** (bấm node soi luồng, lọc theo tên, sáng/tối, tải SVG/PNG). ERD/sequence/state ra SVG đẹp nhưng không bấm được — dòng kết quả nói thẳng và trang ẩn các nút tương tác.
- Giới hạn: id node có `_` làm cạnh `L_a_b_n` mơ hồ → chỉ nhận cạnh khi **cả hai** nửa là node thật, cạnh không phân giải được thì **đếm và báo**; nhãn cạnh không mờ theo khi chọn node; đổi sáng/tối chỉ đổi nền trang.
- Hay dùng: sau `ba-architecture`/`ba-proto-first flow`/`ba-screens` khi có sơ đồ ưng ý; trước buổi trình bày — `--all` trên `01-requirements.md` để có bộ hình rời.
