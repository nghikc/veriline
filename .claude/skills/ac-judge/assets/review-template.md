# Review — <Tên màn hoặc nhánh/PR> (Mã màn: S0x)

> model: <model id của ac-judge>
> diff: <base>..<HEAD sha>  ·  vòng: 1
> ngày: YYYY-MM-DD · gốc code: <--root> · hồ sơ: <full|lite|mini>

## TL;DR
<1–3 câu: diff làm gì, verdict và lý do. PHẢI chứa nguyên văn token APPROVE | COMMENT | REQUEST_CHANGES.>

## Findings
| Mã | Mức | file:line | Vấn đề | Bằng chứng | Cách sửa |
|---|---|---|---|---|---|
| J-01 | 🔴 | `src/…/x.ts:42` | <câu đầu nói thẳng vấn đề và hệ quả cụ thể> | `src/…/x.ts:42` đã đọc · lệnh tái hiện `npx jest -t "…"` → exit 1 · https://… (nguồn chính thức) | <cách sửa lười nhất mà đúng — helper có sẵn trong repo → thư viện chuẩn → 1 dòng → code mới> |
| J-02 | 🟠 | `src/…/y.ts:10` | <lỗi thật nhưng không chặn merge> | `src/…/y.ts:10` · `src/…/z.ts:88` (nơi gọi) | <…> |
| J-03 | 🟡 | `src/…/w.ts:7` | <nit — tối đa 5 dòng 🟡 trong bảng> | — | <…> |

## Nit vượt ngân sách · pre-existing
- <N> nit khác không ghi riêng: <liệt kê ngắn theo file, không thành finding>.
- 🟣 <lỗi có sẵn trước diff này — chỉ tóm tắt, không bao giờ vào bảng Findings>: `src/…/old.ts:120` <một dòng>.

## Bậc thang cơ giới (chạy trước khi đọc diff — thứ lint/typecheck đã bắt KHÔNG thành finding)
- lint: `<lệnh>` → exit <n> · typecheck: `<lệnh>` → exit <n> · test: `<lệnh>` → <passed/failed/skipped> *(hoặc "không có lệnh" — ghi rõ, không đoán)*
- `scan-bypasses.js`: <n> phát hiện (<loại n · loại n>) · <n> dòng lõi — <ứng viên nào thành finding, ứng viên nào bỏ và vì sao>

## Nguồn ngoài đã tra
- <URL nguồn chính thức · khẳng định nó đỡ hoặc bác> *(hoặc "không đụng thư viện/API ngoài")*

## Chuyển thành luật lint
- <finding nào deterministic → một dòng luật máy; `rules.js from-review` đọc khối dưới> *(hoặc "không có" — bỏ khối)*
```rules
{"từ":"J-01","loại":"thieu","glob":"**/screens/*/api.ts","khi":"!\\s*res\\.ok","mẫu":"baoHetPhien","mức":"🟠","lýDo":"cổng API riêng xét res.ok mà không báo hết phiên","sửa":"gọi baoHetPhien()"}
```

## File cơ giới bỏ qua
- <lockfile, snapshot, dist/… — hoặc "không có">

**Verdict:** REQUEST_CHANGES

<!--
Vòng ≥ 2: đổi `vòng: N`, giữ header; thêm mục sau TRƯỚC bảng Findings (bảng Findings vòng 2+ chỉ chứa 🔴 MỚI, thường rỗng):

## Giải quyết (theo bảng mã vòng trước)
| Mã | Mức | Trạng thái | Ghi chú |
|---|---|---|---|
| J-01 | 🔴 | đã sửa a1b2c3d | guard rỗng ở `src/…/x.ts:44` |
| J-02 | 🟠 | còn mở | — |
| J-03 | 🟡 | từ chối — chấp nhận | lý do tác giả đứng vững |

Verdict vòng 2+ = mức của các mã "còn mở" + 🔴 mới. Tới vòng 3 mọi mã còn mở phải sửa, chuyển WI (`ba-task`) hoặc thoát khỏi review.
-->
