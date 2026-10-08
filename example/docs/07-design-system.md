# Design System — TeamTasks

> Nguồn style chuẩn cho `ba-figma-draw` và `ba-html-design`. Sửa token ở đây, không sửa rải rác từng màn.
> Nguồn lập: **reverse** từ 2 màn đã có (`Authentication/Login`, `Authentication/Register` — `html-design.html`) · ngày 11/06/2026.

## 0. Ghi chú chuẩn hoá (đã gộp biến thể)
Khi reverse phát hiện các màn lệch nhau; đã chọn 1 chuẩn:
| Hạng mục | Biến thể tìm thấy | Chuẩn hoá về |
|---|---|---|
| Nền trang | `#f0f2f5` (HTML) vs `#EEF2F7` (Figma Register) | **`#f0f2f5`** |
| Text gần-đen | `#111827` (input/title) vs `#1a1a2e` (body/brand) | **`#111827`** |
| Bề rộng card | 420px (Login) vs 440px (Register) | **420px** mặc định; auth nhiều trường (≥4) dùng **440px** |
| Cỡ chữ brand | 22px (Login) vs 28px (Register) | **22px** |
| Font | system-stack (HTML) vs Inter (Figma) | **Inter** + fallback system-stack (cập nhật lại Figma/HTML cho khớp) |

## 1. Nguyên tắc thiết kế
- Rõ ràng hơn hoa mỹ; ưu tiên tốc độ hoàn thành tác vụ.
- Nhất quán token — mọi màn dùng chung 1 bộ.
- Tiếp cận được (WCAG AA): tương phản ≥ 4.5:1, focus visible, có nhãn.
- Phản hồi tức thì cho mọi hành động (loading, lỗi inline, snackbar).

## 2. Màu (Color tokens)
| Token | Hex | Dùng cho |
|---|---|---|
| `brand/primary` | `#4F46E5` | CTA chính, link, brand icon, nhấn |
| `brand/primary-hover` | `#4338CA` | hover primary |
| `brand/primary-active` | `#3730A3` | active/pressed |
| `brand/primary-loading` | `#6366F1` | nút đang loading |
| `surface/bg` | `#F0F2F5` | nền trang |
| `surface/card` | `#FFFFFF` | nền card |
| `surface/disabled` | `#F9FAFB` | input disabled |
| `border` | `#D1D5DB` | viền input, chip, đường kẻ |
| `text/primary` | `#111827` | tiêu đề, nội dung, giá trị nhập |
| `text/secondary` | `#6B7280` | tagline, helper, icon phụ |
| `text/label` | `#374151` | nhãn trường |
| `text/placeholder` | `#9CA3AF` | placeholder, footer, disabled |
| `state/danger` | `#EF4444` | viền lỗi, dấu `*`, thanh countdown |
| `state/warning` | `#F59E0B` | độ mạnh "Trung bình" |
| `state/warning-strong` | `#D97706` | nhãn cảnh báo đậm |
| `state/success` | `#10B981` | độ mạnh "Mạnh", hợp lệ |
| `state/success-strong` | `#059669` | nhãn success đậm |
| `overlay/dark` | `#1F2937` | nền snackbar/toast |
| `focus/ring` | `rgba(79,70,229,.12)` | vòng focus quanh input/nút |

**Tint thông báo (alert surfaces):**
| Loại | Nền | Viền | Chữ |
|---|---|---|---|
| Warning | `#FFF7ED` | `#FED7AA` | `#92400E` |
| Error/Locked | `#FEF2F2` | `#FECACA` | `#991B1B` |
| Success | `#ECFDF5` | — | `#059669` |

### Mermaid theme (sơ đồ) — token-derived, đè bộ mặc định toolkit
Áp cho **mọi sơ đồ node** trong `docs/` (`swimlane-beta`/`flowchart`/`stateDiagram-v2`). Có mục này → sơ đồ dùng bộ token dưới đây thay "Bộ mặc định" trong `conventions.md`.

**Màu toàn cục** — prepend `%%{init}%%` ở đầu sơ đồ (cho `sequenceDiagram`/`erDiagram`/node chưa gắn):
```
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#EEF0FF','primaryBorderColor':'#4F46E5','primaryTextColor':'#111827','lineColor':'#6B7280','secondaryColor':'#F3F4F6','tertiaryColor':'#F0F2F5','fontFamily':'Inter, system-ui, sans-serif'}}}%%
```

**classDef phân vai node** — paste vào **cuối** sơ đồ node, gắn `:::role` sau mỗi node:
```
  classDef task fill:#EEF0FF,stroke:#4F46E5,stroke-width:1.5px,color:#111827
  classDef decision fill:#FFF7ED,stroke:#F59E0B,stroke-width:1.5px,color:#92400E
  classDef startend fill:#4F46E5,stroke:#3730A3,color:#FFFFFF
  classDef external fill:#F3F4F6,stroke:#6B7280,color:#374151
  classDef error fill:#FEF2F2,stroke:#EF4444,color:#991B1B
```
- `task` = bước xử lý (indigo/brand) · `decision` = quyết định (warning `#F59E0B`) · `startend` = bắt đầu/kết thúc (brand đặc) · `external` = dịch vụ ngoài như Google OAuth (xám) · `error` = lỗi/khoá (danger `#EF4444`).

**Biến thể colorblind-safe** (Okabe-Ito — báo cáo/stakeholder): task fill `#e8f4fb` stroke `#0072B2` · decision fill `#fdf0d5` stroke `#E69F00` · startend `#009E73` · external `#3b3b9e` · error fill `#fde8de` stroke `#D55E00`.

## 3. Typography
- **Font family:** `Inter`, fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.

| Cấp | Size | Weight | Dùng cho |
|---|---|---|---|
| `brand` | 22 | 700 | tên thương hiệu |
| `h1/card-title` | 20 | 700 | tiêu đề card |
| `body/input` | 15 | 400 | nội dung, giá trị nhập |
| `tagline/footer-link` | 14 | 400 | tagline, text phụ lớn |
| `label` | 13 | 600 | nhãn trường |
| `caption/error` | 12 | 400 | helper, lỗi inline, footer |
| `numeric` | — | 700 | đếm ngược — dùng `tabular-nums` |

## 4. Spacing, Radius, Elevation
- **Spacing** (gốc 4px): `xxs 4 · xs 8 · sm 12 · md 16 · 20 · lg 24 · xl 32 · 2xl 40` *(chuẩn hoá 05/10/2026: bỏ 10/14/18/28/36 lẻ — về bậc gần nhất)*.
- **Radius:** `xs 4` (thanh bar) · `sm 8` (input/nút/alert/brand icon) · `lg 16` (card) · `pill 999` (chip, avatar) *(bỏ `md 10` — brand icon về `sm`)*.
- **Elevation:**
| Token | Giá trị | Dùng cho |
|---|---|---|
| `shadow/card` | `0 4px 24px rgba(0,0,0,.08)` | card |
| `shadow/overlay` | `0 4px 16px rgba(0,0,0,.25)` | snackbar/toast |
| `focus/ring` | `0 0 0 3px rgba(79,70,229,.12)` | focus input/nút |

### 4b. Ngân sách đếm được
| Khoá | Trần | Ghi chú |
|---|---|---|
| `accent` | 1 | `brand/primary` — màu trạng thái lấy từ 6b, không tính |
| `font-family` | 1 | Inter + fallback system-stack |
| `font-size` | 6 | `22 · 20 · 15 · 14 · 13 · 12` — đúng thang mục 3 |
| `radius` | 4 | `4 · 8 · 16 · pill` |
| `shadow` | 2 | `shadow/card` + `shadow/overlay`; focus ring không tính |
| `nesting` | 2 | card trong trang; không card trong card |
| `spacing` | `4 8 12 16 20 24 32 40` | |

## 5. Iconography
- **Inline SVG** nét kiểu Lucide (`stroke="currentColor"`, `stroke-width 2`), cỡ `16` (alert, chip) · `20` (nút icon, header) · `24` (trạng thái rỗng). Icon trang trí `aria-hidden="true"`; icon-only **phải** có `aria-label` trên nút (vd nút hiện/ẩn mật khẩu: mắt / mắt gạch). **Không emoji** *(bỏ emoji 👁/🙈/🔔/🔒 ngày 05/10/2026 — mỗi máy vẽ một kiểu, không ăn màu token)*.

## 6. Component
States chuẩn: default / hover / focus / disabled / error.
- **Button (primary):** nền `brand/primary`, chữ trắng 15/600, radius `sm`, padding 12, full-width. Hover `primary-hover`, active `primary-active`, disabled `text/placeholder` + opacity .75, loading `primary-loading` + spinner (border 2.5px, quay `spin 0.7s linear`).
- **Input:** padding `12×16`, viền 1.5px `border`, radius `sm`, chữ 15. Focus = viền `brand/primary` + `focus/ring`. Error = viền `danger`. Disabled = nền `surface/disabled`, chữ `placeholder`. Mật khẩu chừa `padding-right 40` cho nút mắt.
- **Toggle mật khẩu:** icon button trong input, phải 12px, màu `text/secondary`, hover `text/label`.
- **Inline error:** 12px màu `danger`, ẩn mặc định, hiện khi lỗi (`role="alert"`).
- **Alert banner:** radius `sm`, padding `12×16`, icon + text; biến thể warning/error/locked theo tint mục 2.
- **Progress bar:** track cao 4px nền nhạt (`#E5E7EB` / `#FECACA`), fill bo `xs`; dùng cho **độ mạnh mật khẩu** (Yếu `danger` → Trung bình `warning` → Mạnh `success`) và **đếm ngược khoá** (`danger`).
- **Chip / Badge:** radius `pill`, viền `border`, padding `4×12`, 12px; active = nền `brand/primary` chữ trắng.
- **Snackbar/Toast:** cố định đáy giữa, nền `overlay/dark` chữ trắng, radius `sm`, `shadow/overlay`; trượt lên `transform .25s ease`.

### 6a. Hợp đồng nguyên tố
| Nguyên tố | Class canon | Biến thể được phép | Trạng thái bắt buộc |
|---|---|---|---|
| Nút | `btn` + `btn-primary` · `btn-secondary` · `btn-ghost` · `btn-danger` | 4 dạng; nút icon dùng `icon-btn` (shell) | default · hover · focus · disabled · loading |
| Badge | `badge` + `st-<mã>` (trạng thái, 6b) · `pr-<mã>` (ưu tiên, 6b) | 2 họ | — |
| Ô nhập | `field` · `field-error` (lỗi inline, `role="alert"`) · `form-error` (lỗi cả form) | text · password · select · textarea | default · focus · error · disabled |
| Card | `card` | thường · auth (420/440px) | default |
| Dòng danh sách | `task-row` | bảng (≥768) · thẻ xếp chồng (<768, `data-th`) | default · hover · chọn |
| Modal | `modal` + `backdrop` | form · xác nhận (nút huỷ diệt `btn-danger`, đặt xa "Huỷ bỏ") | mở · đóng (in/out) |
| Trạng thái rỗng | `empty` | chưa có dữ liệu · lọc không ra | — (luôn kèm hành động kế) |

### 6b. Bảng trạng thái nghiệp vụ `STATUS`
| Mã | Nhãn | Token màu (chữ / nền) | Icon (SVG) | Hiển thị |
|---|---|---|---|---|
| `todo` | Cần làm | `text/secondary` `#6B7280` / `surface/disabled` `#F9FAFB` | vòng tròn rỗng | pill trong ô · icon + tên + số ở tiêu đề cột |
| `doing` | Đang làm | `brand/primary` `#4F46E5` / `brand/tint` `#EEF2FF` | vòng nửa | như trên |
| `review` | Chờ duyệt | `state/warning-strong` `#D97706` / `#FFF7ED` | đồng hồ | như trên |
| `done` | Hoàn thành | chữ `text/label` `#374151` · icon `state/success-strong` `#059669` / nền `#ECFDF5` *(chữ xanh trên nền xanh nhạt chỉ 3,6:1 — dưới AA)* | dấu tích | như trên |
| `cancelled` | Đã huỷ | `#991B1B` / `#FEF2F2` | dấu gạch chéo | chỉ ở màn chi tiết, kèm banner |
| `active` · `inactive` · `locked` · `banned` *(tài khoản thành viên, S05)* | Hoạt động · Ngừng · Tạm khoá · Cấm | tint Success · `text/secondary` trên `surface/disabled` · tint Warning · tint Error (mục 2) | dấu tích · vòng rỗng · tạm dừng · dấu gạch chéo | pill trong ô |
| `pr-urgent` · `pr-high` · `pr-medium` · `pr-low` | Khẩn · Cao · Trung bình · Thấp | `state/danger` · `state/warning-strong` · `state/warning` · `text/secondary` | cờ | pill trong ô |

> Token bổ sung cho 6b: `brand/tint` `#EEF2FF` (nền nhạt của trạng thái nhấn) · `border/subtle` `#E5E7EB` (đường kẻ trong bảng, fallback của shell) · `surface/hover` `#F3F4F6` (hover hàng/nav).

## 7. Composite / domain components
- **Auth card:** brand (icon + tên + tagline) → card (title → form-group* → CTA → link phụ) → footer phiên bản. Dùng chung Login/Register.

## 8. Layout pattern / page template
- **Trang auth (1 card giữa màn):** body flex column, căn giữa cả 2 trục, padding `24×16`; card `surface/card` radius `lg` + `shadow/card`, max-width 420 (440 nếu ≥4 trường); footer dưới card.

## 9. Grid & Responsive
- **Breakpoints (đề xuất thống nhất toàn app):** `desktop ≥1200 · laptop ≥992 · tablet ≥768 · mobile <768`.
- **Auth:** card luôn `width:100%` + `max-width`; trên mobile chiếm gần hết bề ngang với padding ngoài 16px.
- **Quy tắc mobile:** touch target ≥ 44×44px; input `font-size ≥16px` (tránh iOS auto-zoom — *hiện 15px, nên nâng 16px*); dùng **`100dvh`** thay `100vh` (*HTML hiện dùng `100vh` — nên đổi*); ưu tiên `transform` cho animation.

## 10. Motion / Animation
- **Duration:** micro `100ms` (chip) · thường `150ms` (border/bg/opacity) · overlay `250ms ease` (snackbar) · spinner `700ms linear` · countdown `1s linear`.
- **Easing:** `ease-out` xuất hiện, `ease` cho overlay. Tôn trọng `prefers-reduced-motion`.

### 10.1 Token chuyển cảnh (page / section) — nguồn chuẩn cho design-spec mỗi màn

Mọi mục "Animation & chuyển cảnh" trong `design-spec.md` của các màn **phải lấy số từ bảng này**, không tự đặt số riêng.

| Token | Giá trị | Dùng cho |
|---|---|---|
| `motion.page-enter` | `200ms · ease-out` — fade-in + dịch lên `8px` | Vào một màn qua điều hướng (S01→S02, S01→S06…) |
| `motion.page-enter.quick` | `150ms · ease-out` — fade-in, **không** dịch chuyển | Vào màn khi quay lại (back) hoặc mở URL trực tiếp — giữ nguyên vị trí cuộn |
| `motion.page-exit` | `100ms · ease-in` — fade-out | Rời màn; luôn nhanh hơn enter để không tạo cảm giác trễ |
| `motion.section-in` | `150ms · ease-out` — fade-in | Alert/lỗi inline/banner/skeleton xuất hiện trong màn |
| `motion.section-out` | `150ms · ease-in` — fade-out | Các thành phần trên biến mất |
| `motion.overlay-in` | `250ms · ease` — slide-up + fade từ đáy | Snackbar/toast |
| `motion.modal-in` | `200ms · ease-out` — fade + scale `0.98 → 1` | Modal/dialog (backdrop fade riêng) |
| `motion.crossfade` | `150ms · ease` | Đổi nội dung tại chỗ: nhãn ↔ spinner, đổi bộ lọc bảng, đổi nhãn trạng thái |
| `motion.highlight-once` | `~2s · ease-out`, chạy **một lần** | Làm nổi dòng vừa thêm/vừa đổi trong bảng |

**Luật kèm theo:**
- **Exit luôn ngắn hơn enter** (100ms vs 200ms) — người dùng đã quyết định rời đi, đừng bắt họ chờ.
- **Không stagger** hiệu ứng cho nhóm phần tử hiển thị cùng lúc (vd 5 thẻ thống kê) — nhấp nháy dây chuyền gây phân tán (StR-04).
- **Không animation lặp vô hạn** trên màn người dùng nhìn lâu; nhấn mạnh thì dùng `motion.highlight-once`.
- `prefers-reduced-motion: reduce` → mọi token dịch chuyển/scale rút về **fade thuần**, `motion.highlight-once` tắt hẳn.

## 11. Accessibility
- Tương phản ≥ 4.5:1; focus visible (`focus/ring`); mọi input có `<label for/id>`; lỗi/alert dùng `role="alert"`/`aria-live`; nút icon có `aria-label`; `aria-required` cho trường bắt buộc; thứ tự Tab: trường → CTA → link.

## 12. Figma mapping (tùy chọn — chưa tạo)
Chưa đẩy token sang Figma. Khi cần, `ba-design-system` sẽ tạo: collection `TeamTasks/Tokens` + paint styles (color mục 2) + text styles (typography mục 3) qua `figma-mcp-go`, rồi `ba-figma-draw` dùng lại thay vì hardcode hex.

## Thuật ngữ
| Thuật ngữ | Giải thích |
|---|---|
| Design token | Giá trị thiết kế đặt tên được (màu, khoảng cách, thời lượng) dùng chung toàn hệ thống |
| Typography | Hệ chữ: cỡ, độ đậm, chiều cao dòng |
| Spacing / Radius / Elevation | Khoảng cách · bo góc · độ nổi (đổ bóng) |
| Breakpoint | Ngưỡng bề rộng màn hình để đổi bố cục (responsive) |
| Easing | Cách gia/giảm tốc của chuyển động (`ease-out`, `ease-in`…) |
| Motion token | Token quy định thời lượng + easing cho một loại chuyển cảnh |
| prefers-reduced-motion | Thiết lập hệ điều hành báo người dùng muốn giảm hiệu ứng chuyển động |
| WCAG AA | Mức chuẩn tiếp cận: tương phản chữ/nền tối thiểu 4.5:1 |
| Stagger | Cho các phần tử xuất hiện lệch nhau theo dây chuyền |

> Từ điển đầy đủ toàn dự án: `docs/00-glossary.md`.
