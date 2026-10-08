---
name: ba-proto-html
description: Use when cần prototype bấm được trong MỘT file HTML tự chứa để demo chốt nghiệp vụ TRƯỚC khi đặc tả — gộp mọi màn theo 00-flows.md vào Ho-so/prototype.html, gửi qua email/Zalo.
---

# ba-proto-html — Prototype một-file để chốt nghiệp vụ

## Mục tiêu
Một file **`docs/Ho-so/prototype.html`** tự chứa: mọi màn nằm trong cùng file, bấm nút là chuyển màn theo đúng `00-flows.md`. Khách **double-click là xem**, không cài gì, không cần server — đó là điều kiện để buổi chốt nghiệp vụ diễn ra được.

Vì sao dựng trước khi viết đặc tả: **chỗ mơ hồ tự lộ ra bằng hình ảnh thay vì bằng suy đoán.** Khách nhìn nút "Duyệt" mới nhớ ra là có hai cấp duyệt — điều họ sẽ không nghĩ ra khi đọc một bảng `FR`.

Ranh giới — **ba artifact HTML, ba việc khác nhau, đừng gộp:**

| Skill | Ra cái gì | Cho ai | Khi nào |
|---|---|---|---|
| **`ba-proto-html`** | **1 file** bấm được, mọi màn | **khách**, để CHỐT nghiệp vụ | **trước** đặc tả |
| `ba-html-design` | 1 file **mỗi màn**, high-fi | dev/designer | sau đặc tả màn |
| `ba-prototype` | project **Vite+React** (iframe) | dev, làm seed frontend | sau khi đã có `html-design` |
| `ba-sitemap` | trang **đọc** (wireframe + hành trình) | người dùng cuối | sau khi có wireframe |

## Điều kiện (CHẶN nếu thiếu)
1. `docs/Ho-so/00-flows.md` — lấy danh sách màn + **sơ đồ điều hướng có nhãn cạnh**.
2. **Mọi màn trong bảng màn sơ bộ đều có `ascii-screen.md`.**

**Thiếu bất kỳ cái nào → DỪNG, KHÔNG dựng file rỗng.** Báo đúng cái thiếu và route: thiếu `00-flows.md` → `ba-flow`; thiếu wireframe → `ba-screen-spec --ascii <màn>`. Prototype dựng từ wireframe trống là bịa giao diện, mà đây lại chính là artifact khách sẽ gật đầu — bịa ở đây là đắt nhất trong cả pipeline.

## Quy trình
1. Đọc `conventions.md` + `conv-gates.md` của `ba-toolkit`, `ba-html-design/shell.md` (**khung dùng chung — bắt buộc**), `docs/Ho-so/00-flows.md`, mọi `ascii-screen.md`, và `docs/07-design-system.md` nếu có (token màu/typography).
2. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Ghi **một file khách sẽ nhìn** → luôn trên ngưỡng. Trình 6 phần, trong đó "Sẽ làm" nêu **danh sách màn sẽ dựng + số cạnh điều hướng sẽ nối**. Được `ba-proto-first` (đã qua cổng) gọi xuống → **không hỏi lại**, in phương án rút gọn rồi chạy.
3. Dựng `docs/Ho-so/prototype.html`:
   - Mỗi màn = một `<section class="screen" id="S01" data-screen="S01">`, **chỉ một section hiện tại một thời điểm**.
   - **Khung dùng chung theo `shell.md`**: `app-shell` cho màn đã đăng nhập, `auth-shell` cho màn ngoài; **menu chính giống hệt nhau ở mọi màn**, chỉ `aria-current` đổi.
   - Nút điều hướng: `data-goto="S02"` + nhãn **đúng nguyên văn nhãn cạnh** trong `00-flows.md`.
   - **Bảng điều khiển demo** cố định: danh sách màn để nhảy thẳng + nút "Bắt đầu lại". Người demo phải nhảy được tới bất kỳ màn nào, không bắt khách bấm lại từ đầu.
   - **Dữ liệu mẫu như thật** (tên người Việt, số tiền có đơn vị) — `Lorem ipsum` làm khách không hình dung được nghiệp vụ.
4. Chạy `node .claude/skills/ba-proto-html/scripts/check-proto.js docs` → sửa hết lỗi rồi mới báo xong.
5. Ghi vào `00-flows.md` mục "Prototype": đường dẫn + ngày + số màn/số cạnh đã dựng.

## Luật cứng của file (script soát — xem `check-proto.js`)
- **Tự chứa**: không `<script src>`/`<link href>` ra ngoài, **không `<iframe>`**, không gọi mạng. Gửi qua email vẫn chạy.
- **Đủ màn**: mọi màn trong bảng màn sơ bộ có đúng một `section.screen`.
- **Nút không dẫn vào hư không**: mọi `data-goto` trỏ tới `id` có thật.
- **Không cạnh chết**: mọi cạnh trong sơ đồ điều hướng có ít nhất một nút tương ứng.
- **Khung đồng nhất**: mọi màn `app-shell` có cùng tập mục menu (đây là luật xuyên màn — chỉ lộ khi đặt các màn cạnh nhau).
- Không dùng `100vw` (sinh thanh cuộn ngang), không emoji thay icon nghiệp vụ.

## Điểm dừng
- Màn có wireframe nhưng **không có cạnh nào dẫn tới** → vẫn dựng, nhưng báo rõ ở cuối: *"S05 không bấm tới được — kiểm lại `00-flows.md`"*.
- Nhãn cạnh mơ hồ (`-->|tiếp|`) → hỏi lại, đừng tự đặt tên nút.

## Đầu ra
`docs/Ho-so/prototype.html` + báo cáo: số màn · số cạnh nối · màn không tới được · kết quả `check-proto.js`.

## Ranh giới
- Dựng từ wireframe ASCII + `00-flows.md`. KHÁC `ba-prototype` (Vite+React, seed frontend, chạy **sau** khi nghiệp vụ đã chốt).

## Lưu ý
- Tiếng Việt. **Hồ sơ dự án** (`conv-gates.md` → "Hồ sơ dự án"): không đổi theo hồ sơ — prototype luôn là 1 file, ở cả `full`/`lite`/`mini`.
- **Đây là bản DÙNG MỘT LẦN để chốt.** Chốt xong, bản high-fi cho dev là `ba-html-design` từng màn; seed frontend là `ba-prototype`. Đừng nuôi file này thành sản phẩm.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
