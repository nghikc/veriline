# Quy ước — Sơ đồ Mermaid (phụ lục của `conventions.md`)

> Tách khỏi `conventions.md` để giảm chi phí nạp: chỉ những skill **sinh hoặc soát sơ đồ** mới cần đọc file này (`ba-requirements`, `ba-screens`, `ba-screen-spec`, `ba-data-model`, `ba-api-spec`, `ba-architecture`, `ba-integration`, `ba-process`, `ba-persona`, `ba-roadmap`, `ba-urd`, `ba-diagram`, `ba-reverse`, `ba-review diagram`, `ba-portal`). Vẫn là **cùng một nguồn sự thật** với `conventions.md` — mọi tham chiếu dạng `conventions.md` → "Bộ chọn sơ đồ Mermaid" trỏ về đây.

Thứ tự làm khi cần vẽ: **(1)** chọn loại → **(2)** đối chiếu coverage → **(3)** tuân an toàn cú pháp → **(4)** tô màu phân vai.

*(Ngưỡng "màn phức tạp" — dùng để quyết định có spawn agent review hay không — nằm ở `conventions.md`, không ở đây, vì nó gate cả chất lượng yêu cầu chứ không riêng sơ đồ.)*

---

## Bộ chọn sơ đồ Mermaid (dùng chung)
Chọn ĐÚNG loại sơ đồ theo bản chất thứ cần mô tả — mọi skill sinh sơ đồ tham chiếu bảng này (`ba-requirements`, `ba-screens`, `ba-screen-spec`, `ba-data-model`, `ba-api-spec`, `ba-reverse`):

**Luật ưu tiên vai trò (BẮT BUỘC):** trước khi chọn loại, **đếm số vai trò/tác nhân** trong luồng. Có **≥2 vai trò** với bàn giao giữa họ → **PHẢI dùng `swimlane-beta`** (mỗi vai trò 1 lane), **KHÔNG được vẽ bằng `flowchart`**. `flowchart` chỉ dành cho luồng **đúng 1 tác nhân**. Riêng **luồng nghiệp vụ chính ở `01-requirements.md` mặc định là đa vai trò → luôn swimlane**, không dùng flowchart cho các luồng này.

| Cần mô tả | Loại Mermaid | Dùng ở | KHÔNG dùng khi |
|---|---|---|---|
| Luồng nghiệp vụ **≥2 vai trò**, có bàn giao *(mặc định ở `01-requirements`)* | **`swimlane-beta`** (mỗi vai trò 1 lane) — **KHÔNG flowchart**. **Hướng: đếm node trước** — ≤ 8 node → `LR`; **> 8 node hoặc ≥ 4 lane → `TD`** (LR trải ngang, portal phải cuộn ngang; dự án thật 16/09/2026 đo 10–25 node/sơ đồ mà toàn LR) | `01-requirements`, `srs` | luồng đúng 1 tác nhân (→ `flowchart TD`); tương tác theo thời gian (→ `sequenceDiagram`) |
| Quy trình **1 tác nhân** duy nhất, có rẽ nhánh/quyết định | `flowchart TD` (Activity) | `srs` | có ≥2 vai trò (→ swimlane); chỉ liệt kê bước tuyến tính (dùng danh sách đánh số) |
| Tổng quan tác nhân ↔ chức năng | `flowchart LR` (Use case) | `03-overview`, `srs` | cần chi tiết luồng 1 use case (→ sequence/activity) |
| Trao đổi theo thời gian giữa các bên/hệ thống | `sequenceDiagram` | `srs`, `06-api-spec` | chỉ 1 tác nhân (→ activity); quan tâm trạng thái từng thời điểm (→ state) |
| Vòng đời trạng thái của một đối tượng/màn | `stateDiagram-v2` | `srs` | đối tượng chỉ 2 trạng thái (bảng đủ); quan tâm tương tác (→ sequence) |
| Thực thể & quan hệ dữ liệu | `erDiagram` | `05-data-model` | chỉ 1 thực thể (bảng thuộc tính đủ); quan tâm hành vi (→ state) |
| Kiến trúc — **phân tầng / khối triển khai / topo service** | **`flowchart TB` + `subgraph`** (subgraph = tầng/vùng, node = thành phần; tô `classDef`) | `10-architecture`, `11-integration` | luồng nghiệp vụ (→ swimlane); dữ liệu (→ erDiagram) |
| Kiến trúc — **ngữ cảnh** (hệ thống ↔ actor/hệ ngoài) | **`flowchart LR` + `subgraph`** (actor/System/System_Ext = node tô `classDef` theo vai) | tài liệu kiến trúc | topo service chi tiết (→ flowchart phân tầng ở trên) |
| Hành trình người dùng (cảm xúc theo bước) | `journey` | `03-overview` (tùy chọn) | cần rẽ nhánh/quyết định (→ activity/swimlane) |
| Tiến độ/timeline | `gantt` / `timeline` | kế hoạch (tùy chọn) | mô tả logic quy trình (→ activity/swimlane) |

> **Nguyên tắc:** *sơ đồ phục vụ truyền đạt, không để phô diễn* — chỉ vẽ sơ đồ thật sự làm rõ được điều mà chữ/bảng diễn đạt kém. Luồng 3-4 bước tuyến tính → danh sách đánh số, đừng vẽ.

`ba-portal` **lint lúc build** (cảnh báo pattern dễ vỡ kèm `file:dòng`) và **bắt lỗi render lúc mở** (sơ đồ vỡ hiện hộp đỏ tại chỗ + `console.error`, không biến mất im lặng).

### House theme cho sơ đồ
`ba-portal` áp một **house theme** trung tính, tương phản đủ (thay theme thô mặc định). Muốn sơ đồ đồng bộ màu với `07-design-system`: prepend khối `%%{init: {'theme':'base','themeVariables':{...}}}%%` ở **đầu** sơ đồ (Mermaid ưu tiên init nội tuyến hơn theme toàn cục).

### Bảng màu phân vai node (tô màu trực quan)
Sơ đồ **node** (`swimlane-beta`, `flowchart`, `stateDiagram-v2`) nên **tô màu theo vai trò node** để đọc nhanh — bước xử lý / điểm quyết định / bắt đầu-kết thúc / dịch vụ-ngoài / lỗi. Cách dùng: gắn `:::role` sau node (`A[Xử lý đơn]:::task`, `D{"Hợp lệ?"}:::decision`, `S([Bắt đầu]):::startend`) rồi **paste khối `classDef` vào CUỐI sơ đồ**.

**Nguồn màu — chọn theo hiện trạng dự án (fallback):**
1. **Có `docs/07-design-system.md`** → dùng khối `classDef` **theo token** của design system (`ba-design-system` phát sẵn khối này) — sơ đồ đồng bộ màu với UI.
2. **CHƯA có design system** → dùng **BỘ MẶC ĐỊNH** dưới đây (không cần cấu hình gì). Đây là màu chuẩn của toolkit; mọi skill sinh sơ đồ dùng nó khi dự án chưa có `07-design-system.md`.

Bộ mặc định (teal/cam, hợp house theme):
```
  classDef task fill:#e6fffb,stroke:#13a89e,stroke-width:1.5px,color:#134e4a
  classDef decision fill:#fff3e6,stroke:#e8820c,stroke-width:1.5px,color:#7a4a00
  classDef startend fill:#13897e,stroke:#0c6b62,color:#ffffff
  classDef external fill:#eef0ff,stroke:#5b5bd6,color:#2e2e7a
  classDef error fill:#fff5f5,stroke:#d64545,color:#7a1f1f
```

Biến thể **colorblind-safe** (Okabe-Ito — thay khối trên khi làm báo cáo/stakeholder):
```
  classDef task fill:#e8f4fb,stroke:#0072B2,color:#04304d
  classDef decision fill:#fdf0d5,stroke:#E69F00,color:#5a3d00
  classDef startend fill:#009E73,stroke:#00674c,color:#ffffff
  classDef external fill:#eef0ff,stroke:#3b3b9e,color:#20205a
  classDef error fill:#fde8de,stroke:#D55E00,color:#5a2600
```

**Lưu ý:**
- `erDiagram`, `sequenceDiagram`, `gantt`, `journey` **KHÔNG nhận `classDef` per-node** → chỉ theo house theme (house theme cũng là "màu default" cấp toàn cục, luôn có sẵn dù chưa có design system).
- **Sơ đồ kiến trúc & ngữ cảnh dùng `flowchart` + `subgraph`** (KHÔNG dùng `architecture-beta`/`C4Context` — hai loại `-beta`/C4 render không ổn định, hay vỡ, và không tô `classDef` được). Cách vẽ: `subgraph <id>["<Tên tầng/vùng>"]` gom các node thành phần, node **tô `classDef`** như mọi sơ đồ node khác. Muốn gợi hình khối lưu trữ: node database dùng dạng trụ `id[("PostgreSQL")]`; hàng đợi/đĩa dùng `id[/"Redis"/]` hoặc `id[("...")]`. **KHÔNG cần icon** — nhãn chữ + màu phân vai đủ rõ và **an toàn cú pháp** (bọc `"..."` cứu được mọi ký tự đặc biệt, khác hẳn `architecture-beta` vốn vỡ với `+ . - / ( ) :`). Sơ đồ **ngữ cảnh** (context): mỗi actor/System/System_Ext là một node, tô theo vai (`:::startend` cho người dùng, `:::task` cho hệ mình, `:::external` cho hệ ngoài).
- Bộ mặc định trên là fallback; **có `07-design-system.md` thì bộ token-derived đè lên** (đừng dùng cả hai).
- Màu `:::` **đè** house theme cho node được gắn; node không gắn giữ house theme. `ba-portal` lint không cản `classDef`.

## Kiểm coverage sơ đồ (BẮT BUỘC)
**Render được KHÔNG có nghĩa là đúng.** Lint/render của `ba-portal` chỉ bắt lỗi **cú pháp**; nó KHÔNG bắt lỗi **thiếu nghiệp vụ** (thiếu vai trò, sót nhánh, cụt đường). Vì vậy mọi skill sinh sơ đồ phải làm thêm bước **đối chiếu coverage** trước khi báo xong.

**Cách làm — fact-list → đối chiếu:**
1. **Trước khi vẽ, trích fact-list** từ nguồn nghiệp vụ (brainstorm/requirements/srs/usecase): danh sách **vai trò/tác nhân** · mỗi **điểm quyết định** + các nhánh · **loop/lặp** · **outcome** mỗi nhánh · (ERD) **thực thể + quan hệ**.
2. **Sau khi vẽ, đối chiếu từng mục:**
   - Mỗi **vai trò** trong fact-list → có 1 lane (`swimlane`) / `participant` (sequence) / cột (use case) trong sơ đồ.
   - Mỗi **điểm quyết định** → 1 nhánh rẽ có **≥2 hướng ra CÓ NHÃN** (không có quyết định 1 nhánh, không nhánh vô nhãn).
   - **Không dead-end / loose-end:** mọi đường dẫn tới một điểm kết (`stop`/end/state cuối). Không node "treo".
   - **Không orphan branch:** nhánh trong sơ đồ mà fact-list KHÔNG có = có thể bịa → hỏi lại người dùng, không tự coi là đúng.
   - (ERD) mỗi thực thể có **PK**; mỗi quan hệ có **cardinality**.
3. Thiếu mục nào → bổ sung sơ đồ, không âm thầm báo "xong".

**Ngưỡng dùng gate:** sơ đồ **phức tạp** (≥3 vai trò/lane **HOẶC** ≥5 điểm quyết định **HOẶC** rẽ nhánh lồng ≥2 tầng **HOẶC** có loop) → chạy **`ba-review diagram <file>`** (dùng agent `ba-diagram-reviewer`) để soát coverage độc lập trước khi chốt. Dưới ngưỡng → skill tự đối chiếu theo checklist trên là đủ (khỏi tốn 1 lần review).

Thiếu đối chiếu coverage ở sơ đồ phức tạp → `ba-review` gắn gap (xem scope `diagram`).

## Sơ đồ Mermaid — an toàn cú pháp (BẮT BUỘC)
Mọi skill sinh sơ đồ Mermaid (`ba-requirements` swimlane, `ba-screens`, `ba-screen-spec`, `ba-data-model`, `ba-api-spec`, `ba-reverse`…) phải viết sao cho **render ra ảnh được**, không lỗi `Lexical error / Unrecognized text` khi `ba-portal` xuất HTML.

**Quy tắc vàng:** nếu nhãn node/cạnh chứa **bất kỳ ký tự nào ngoài** [chữ cái (kể cả tiếng Việt có dấu) · số · khoảng trắng · gạch `-`] → **bọc TRỌN nhãn trong dấu ngoặc kép**: `Z["Chặn · Mở một dự án trước"]`. Bọc trọn là cách an toàn nhất, khỏi phải nhớ ký tự nào vỡ ở đâu.

1. **Dấu nháy kép `"` chỉ được dùng để BAO TRỌN nhãn — không bao giờ để `"` lẻ giữa nhãn.** `Z[Chặn · "Mở một dự án trước"]` ❌ (Mermaid hiểu `"..."` là token chuỗi sai chỗ → `Parse error … got 'STR'`). Muốn hiển thị dấu nháy: bọc trọn rồi dùng nháy đơn bên trong `Z["Chặn — 'Mở một dự án trước'"]` ✅, hoặc dùng entity `Z[Chặn · #quot;Mở...#quot;]` ✅.
2. **Ký tự vỡ trong nhãn NODE nếu để thô — phải bọc ngoặc kép:** `(` `)` `[` `]` `{` `}` `"` `<` `>`. VD `B[Lưu (md)]` ❌ → `B["Lưu (md)"]` ✅. (Ngược lại `& : / . →` trong nhãn node thì thường không sao, nhưng cứ bọc cho chắc.)
3. **Nhãn CẠNH chặt hơn nhãn node** — nhất là cạnh dotted `A -. text .-> B`: dấu `.` (vd `.md`), `&`, `()` trong nhãn cạnh dễ vỡ và **không bọc ngoặc kép được**. Phải **bỏ hẳn KÝ TỰ ĐẶC BIỆT** (chỉ ký tự đặc biệt — **giữ nguyên dấu tiếng Việt**): `S29 -.lưu biên bản .md.-> S10` ❌ → `S29 -.lưu biên bản md.-> S10` ✅. *(Thủ phạm là dấu chấm của `.md`, không phải diacritics — bỏ dấu tiếng Việt ở đây là chữa quá tay, xem quy tắc 8.)*
4. **Chỉ dùng các kiểu cạnh chuẩn:** `-->`, `-.->`, `--x`, `--o`, `==>` (kèm `==x`, `==o` nếu cần). **Không ghép dotted với cross/circle kiểu `-.x` / `-.o`** — sai cú pháp, vỡ khi render; dạng dotted có đầu mũi tên cross/circle hợp lệ là `-.-x` / `-.-o` (có thêm gạch giữa).
5. **Không dùng `;`** trong bất kỳ text nào (Mermaid coi là dấu kết thúc câu lệnh → vỡ); trong `sequenceDiagram` cũng tránh `:` trong nội dung message (đã là dấu phân tách actor↔text). Dùng `,` hoặc ` — ` thay thế.
6. **ID node chỉ gồm chữ-số** (`S01`, `uc1`, `nd`); phần hiển thị để trong `[...]` / `([...])` / `{...}`.
7. **Xuống dòng** trong nhãn dùng `<br/>` (hoặc `\n`); không chèn ký tự lạ.
8. **Tiếng Việt trong sơ đồ PHẢI CÓ DẤU (BẮT BUỘC).** Mọi text người đọc nhìn thấy — nhãn node, nhãn cạnh, tên lane/section, tiêu đề, chú thích, message trong `sequenceDiagram`, nhãn trạng thái trong `stateDiagram` — viết **tiếng Việt có dấu đầy đủ**: `Đăng nhập`, `Người dùng`, `Duyệt yêu cầu`. **KHÔNG** `Dang nhap`, `Nguoi dung`. Mermaid nhận UTF-8, diacritics **không bao giờ** là nguyên nhân vỡ render — vỡ là do ký tự đặc biệt (quy tắc 1–3). Bỏ dấu để "cho an toàn" là chữa sai bệnh, và tạo ra sơ đồ mà stakeholder đọc không nổi.

   **Phân biệt ID và NHÃN — đây là chỗ hay nhầm:**
   ```
   S01[Đăng nhập]              ✅  ID ASCII · nhãn có dấu
   DangNhap[Dang nhap]         ❌  cả hai đều sai kiểu
   S01[Dang nhap]              ❌  nhãn bỏ dấu
   ```
   - **ID node / tên biến / khoá kỹ thuật**: ASCII không dấu (quy tắc 6) — vì đây là định danh máy đọc.
   - **Mọi thứ hiển thị cho người đọc**: tiếng Việt có dấu.

   Cùng nguyên tắc với quy ước đặt tên chung của toolkit: **tên file/folder không dấu, nội dung hiển thị có dấu**. Sơ đồ tiếng Việt không dấu → `ba-review` gắn gap **🟡 Quan trọng** (đọc được nhưng sai chuẩn tài liệu bàn giao).

> Mẹo chốt nhanh: thấy nhãn có dấu `( ) " [ ] { }` hoặc bất kỳ ký tự lạ → bọc trọn `["..."]` (và đảm bảo không còn `"` lẻ bên trong); nhãn cạnh thì viết chữ thuần. Sơ đồ Mermaid không parse được (không render) → `ba-review` gắn gap **🟡 Quan trọng**.
