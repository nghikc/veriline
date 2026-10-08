# Audit giao diện — <Tên màn> (Mã màn: S0x)

> model: <model id của ac-auditor>
> ngày: YYYY-MM-DD · màn: S0x *(ghi `app` khi audit URL app thật nhiều màn)* · hồ sơ: <full|lite|mini> · tầng: <html-design | prototype | app>
> đầu vào: `docs/Screen-spec/<…>/html-design.html` *(hoặc `docs/Ho-so/prototype.html`, hoặc `https://…`)*
> máy: scan-html <n> lỗi · <m> cảnh báo · lighthouse <Lighthouse 12.x · 2026-09-15T10:00:00Z | không đo được: lý do>
> đối chiếu: srs.md · design-spec.md (<có | không — hồ sơ mini>) · 01-requirements.md (NFR-..) · test.md (TC Manual về giao diện)

**Verdict:** ĐẠT | CHƯA ĐẠT — <a> 🔴 · <b> 🟠 · <c> 🟡 *(có 🔴 = CHƯA ĐẠT; không 🔴 = ĐẠT, 🟠 là nợ sửa trước release)*

## Core Web Vitals
> Chỉ có số khi `lighthouse.js` đo được trên URL http(s). File tĩnh (html-design, prototype) → mọi dòng ghi `không đo được: file tĩnh, không có URL`. **Không điền số ước lượng.**

| Chỉ số | Giá trị | Ngưỡng tốt | Xếp | Nguồn |
|---|---|---|---|---|
| LCP | 2,81 s | ≤ 2,5 s | cần cải thiện | Lighthouse 12.6.0 · 2026-09-15T10:00:00Z · mobile |
| INP | không đo được | ≤ 200 ms | — | lab không có INP; TBT 150 ms (tốt) làm proxy · cùng run |
| CLS | 0,040 | ≤ 0,1 | tốt | Lighthouse 12.6.0 · 2026-09-15T10:00:00Z · mobile |

Điểm Lighthouse: performance <n> · accessibility <n> · best-practices <n> *(hoặc "không đo được")*

## Phát hiện
> Mức: 🔴 chặn bàn giao (người dùng có khuyết tật KHÔNG dùng được: input không nhãn, nút không tên, tương phản < 3:1, bẫy bàn phím, tắt zoom) · 🟠 sửa trước release (dùng được nhưng khó: tương phản 3–4.5, heading lộn, thiếu focus-visible, touch target nhỏ, LCP/CLS "kém") · 🟡 nên (link chung chung, transition:all, thiếu reduced-motion, CWV "cần cải thiện"). Mỗi dòng: vị trí ĐÃ MỞ ĐỌC (`file:line`, hoặc URL + selector), tiêu chí WCAG dạng `x.y.z` / tên guideline UX / chỉ số CWV, cách sửa cụ thể, trace về `R-S..`/`NFR-..`/`design-spec §n`/`TC-S..` khi có (không có → `—`).

| Mã | Trục | Mức | Vị trí | Tiêu chí | Vấn đề | Cách sửa | Trace |
|---|---|---|---|---|---|---|---|
| AU-01 | WCAG | 🔴 | `html-design.html:214` | 3.3.2 | `<input name="email">` không có label — screen reader đọc "edit text" | `<label for="email">Email</label>` (design-spec §3 đã ghi nhãn "Email") | R-S01-02 · design-spec §3 |
| AU-02 | WCAG | 🟠 | `html-design.html:88` | 1.4.3 | `.hint` `#9ca3af` trên `#fff` = 2,54:1 | đổi sang `#6b7280` (4,83:1) — token `--text-secondary` của 07-design-system | NFR-08 |
| AU-03 | UX | 🟠 | `html-design.html:302` | Touch target ≥ 44×44 | nút "×" đóng toast cao 20px | `min-width:44px;min-height:44px` hoặc padding | design-spec §4 |
| AU-04 | CWV | 🟠 | `https://app.example.test/login` `img.hero` | LCP | LCP 2,81 s do ảnh hero 1,2 MB không preload | `fetchpriority="high"` + WebP ≤ 200 KB | NFR-01 |
| AU-05 | UX | 🟡 | `html-design.html:7` | Animation · prefers-reduced-motion | có transition, không có `prefers-reduced-motion` | thêm media query theo conventions "Animation chuyển cảnh" | design-spec §7 |

## Đã kiểm, không lỗi (bằng chứng cho NFR / TC Manual)
> Mỗi dòng là một thứ ĐÃ MỞ XEM và thấy đúng — `ac-eval` dùng làm bằng chứng cho TC `Manual` về giao diện; `ba-accept` dùng cho NFR accessibility/performance. Không liệt kê thứ chưa xem.

- 1.1.1: 4/4 `<img>` có `alt` mô tả (`html-design.html:120, 131, 140, 155`)
- 2.4.7: `:focus-visible{outline:2px solid #4f46e5}` (`html-design.html:41`) áp mọi nút/link
- 4.1.3: thông báo lỗi trong `role="alert"` (`html-design.html:301`) → TC-S01-12 (Manual, "lỗi hiển thị inline") có bằng chứng tĩnh
- Trạng thái `Đang tải`/`Rỗng`/`Lỗi` đều có khối riêng (`html-design.html:260–330`) → design-spec §4 đủ

## Máy nói gì
- `scan-html.js`: <n> lỗi · <m> cảnh báo — dán nguyên văn dòng có ❌/⚠️, rồi ghi mỗi dòng → thành `AU-nn` nào hoặc bỏ vì sao
- `lighthouse.js`: <run id + điểm | không đo được: lý do> — audit không đạt → thành `AU-nn` nào

## Ngoài phạm vi · không đo được
- Thứ tự tab thật / screen reader thật: chưa chạy NVDA/VoiceOver — ghi rõ, không suy đoán
- Trang sau đăng nhập: Lighthouse không có cookie — người dùng chạy tay với `--extra-headers` rồi đưa `--from`
