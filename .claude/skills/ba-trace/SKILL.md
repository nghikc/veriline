---
name: ba-trace
description: Use when cần xuất ma trận truy vết RTM đầy đủ BR→…→TC thành Ho-so/00-traceability.md, hoặc soát độ phủ đầu-cuối (yêu cầu mồ côi, TC không gốc). Khác ba-track và ba-review.
---

# ba-trace — Ma trận truy vết yêu cầu (RTM)

## Mục tiêu
Quét toàn bộ `docs/`, ghép chuỗi ID **BR → StR → FR/NFR → F → S → R-S → UC/US → TC** thành một **ma trận truy vết (RTM)** xuất ra `docs/Ho-so/00-traceability.md`. Trả lời được: yêu cầu nào chưa xuống tới màn/test? test nào không truy được về yêu cầu gốc? độ phủ mỗi tầng bao nhiêu %?

> ⚙️ **Hồ sơ `mini` → chuỗi KHÔNG có tầng UC/US** (`conv-gates.md` → "Hồ sơ dự án"). Dự án khai `mini` bỏ `usecase.md`/`userstory.md`, nên chuỗi là **BR→StR→FR/NFR→F→S→R-S→TC**; `TC` neo thẳng về `R-S` (và `BRule`). `scan.js` tự đọc hồ sơ, trả `hồSơ` + `chuỗi` trong JSON và **không** tính ref tới `UC`/`US` là gãy — chúng nằm ở trường riêng `bỏTheoHồSơ`. Đọc trường đó là **việc dọn dẹp** (mã `UC-` còn sót từ hồi dự án chạy `full`), **không phải gap chặn gate** — đừng chấm 🔴 cho nó. RTM sinh ra ở `mini` bỏ luôn hai cột UC/US thay vì để cột rỗng.

> **Khác `ba-track`** (dựng `00-tracking.md` — mỗi dòng một *màn*, theo dõi *file nào đã có*). **Khác `ba-review`** (sinh `00-gaps.md` — chỉ liệt kê *findings* để chặn gate). `ba-trace` xuất **cả ma trận** như một *deliverable* đọc được, kèm mục gap rút gọn. Ba cái bổ trợ, không thay nhau.

## Cách gọi
`ba-trace` (mặc định: quét `docs/`, ghi `docs/Ho-so/00-traceability.md`) · `ba-trace check` (chỉ in phần Gap ra chat, **không** ghi file — dùng trước gate/commit).

## Nguồn ID (quét ở đâu)
Đọc `conventions.md` của `ba-toolkit` để nắm sơ đồ ID, rồi thu từng tầng:
| Tầng | ID | File nguồn |
|------|----|-----------|
| Business / Stakeholder Req | `BR..` `StR..` | `docs/01-requirements.md` (mục yêu cầu nghiệp vụ), `docs/Ho-so/04-stakeholders.md` nếu có |
| Functional / Non-func Req | `FR..` `NFR..` | `docs/01-requirements.md` |
| Chức năng | `F..` | `docs/02-functions.md` (mỗi F ghi trace về FR/BR) |
| Màn hình | `S..` | `docs/03-overview.md` + cột "Mã CN" của `docs/00-tracking.md` (map F↔S) |
| Yêu cầu màn | `R-S<NN>-..` (chức năng) · `R-S<NN>-N..` (phi CN) | mỗi `<màn>/srs.md` (mỗi R-S ghi trace về F/FR) |
| **Quyết định sản phẩm** *(luồng prototype-trước)* | `PD-01` | `docs/00-decisions.md` — tầng **đầu nguồn**, đứng TRƯỚC `BR`: điều khách chốt khi bấm prototype |
| **Nhu cầu / ngoại lệ người dùng** *(nếu có URD)* | `UN-01` · `UE-01` | `docs/Ho-so/00-urd.md` + `docs/urd/*.md` (qua `docpath.js`) — chỉ ô ĐẦU dòng bảng là định nghĩa. `UN` nhập chuỗi ở `StR/FR/NFR`; `UE` (URD §6) được màn **trích ngược** ở dòng `E-S`/`R-S`/`TC` xử lý nó |
| Use case / User story | `UC-S<NN>-..` `US-S<NN>-..` | mỗi `<màn>/usecase.md`, `<màn>/userstory.md` — **tầng này KHÔNG có ở hồ sơ `mini`** |
| Test case | `TC-S<NN>-..` | mỗi `<màn>/test.md` (mỗi TC ghi cột trace về R-S/UC) |

Ghép quan hệ **theo trace đã khai trong tài liệu** (cột/chú thích "Truy vết"), không suy đoán. ID xuất hiện trong trace nhưng không tồn tại ở tầng của nó → đánh dấu **ref gãy** (🔴).

> ⚙️ **Dự án chạy luồng prototype-trước** (`ba-proto-first`): chuỗi có thêm tầng đầu nguồn **`PD → FR/BR`**, và `scan.js` trả thêm độ phủ **"FR/BR neo về PD"**. `FR` không neo về `PD` nào = **thứ chưa ai chốt mà đã đặc tả** → gap 🟡, sửa bằng cách quay lại cổng chốt (`ba-proto-first` bước 5) hoặc bỏ khỏi phạm vi. Dự án chuỗi xuôi không có `PD` thì metric này **không xuất hiện** — đừng đo tầng không tồn tại rồi báo 0%.
>
> ⚙️ **Nhánh URD** (trường `urd` + hai độ phủ): **`UE→(R-S|E-S|TC)`** — mỗi `UE-..` có ≥1 dòng srs/test trích nó cùng một mã `R-S`/`E-S`/`TC` (`urd.nơiXửLý` chỉ `tệp:dòng`); **`UN→FR/NFR/StR`**. Mồ côi có `n/a — lý do`/`OQ-..` ở dòng URD của mã → nằm ở `hợpLệ`, không phải gap. `urd.mồCôiNặng` = `UE` Critical/High mồ côi không lý do → **🟡** (luật `urd` của `ba-review`). Màn trích `UE-..` không có trong URD → **ref gãy 🔴** ("UE ma"). URD kiểu cũ (§6 chưa có cột mã) hoặc chưa có srs nào → `urd.trạngThái` 🟢, **không** có metric, **không** đỏ; ref UN/UE khi URD chưa cấp mã nằm ở `urd.refKhôngKiểm`, không vào `brokenRefs`.
>
> Trường **`mãSơBộ`** trong JSON: ref tới mã `S..` **tạm** khai ở `00-flows.md` khi `03-overview.md` chưa ra đời (bước 2–5). **Không phải trace gãy** — chưa tới lượt `ba-screens` cấp baseline. Đừng chấm gap cho nó; nó tự hết khi sang bước 6.

## Quy trình
1. **Quét bằng script** (zero-dep — KHÔNG quét tay từng file):
   ```bash
   node .claude/skills/ba-trace/scripts/scan.js [docsDir=docs] --pretty     # --plain: tóm tắt chữ
   ```
   Script trả JSON: tập ID mỗi tầng, số cạnh trace (mảng `edges` cần `--full`), độ phủ thô từng cạnh + danh sách mồ côi, ref gãy (`file:line`), trạng thái build mỗi màn từ tracking. Đọc `conventions.md` để nắm sơ đồ ID khi diễn giải.
2. Dựng **ma trận xuôi** từ `layers`+`edges` của JSON (`edges` chỉ có khi chạy `--full`; mặc định script ẩn nó vì ở dự án mẫu nó chiếm ~94% đầu ra — cần một mã thôi thì `--for <ID>`): gộp theo màn (`S`), mỗi dòng một `R-S` với các ô BR/FR/F ở thượng nguồn và UC/US/TC ở hạ nguồn (ID cách nhau dấu phẩy; `—` nếu trống).
3. **PHÁN XÉT** số thô của script: mẫu số coverage là mẫu số ĐỦ — trừ đi các ngoại lệ hợp lệ (mục "Neo trace hợp lệ" + màn ⬜ planned) rồi mới ra % cuối. Script không phán xét — đó là việc của bước này.
4. Dò **bất thường** từ `brokenRefs` + danh sách `mồCôi`: cái nào là gap thật (🔴/🟡), cái nào là ngoại lệ hợp lệ (🟢 kèm ghi chú).
5. Ghi `docs/Ho-so/00-traceability.md` theo `template.md` (chế độ `check`: chỉ in mục 3–4 ra chat).
6. Cập nhật ô ngày trong `docs/00-tracking.md`? Không — RTM là ảnh chụp, không thuộc per-màn. Chỉ tự ghi "Cập nhật" trong chính file RTM.

## Đọc trạng thái build từ tracking (QUAN TRỌNG — tránh báo nhầm)
Trước khi chấm gap, đọc cột trạng thái mỗi màn trong `docs/00-tracking.md` (`✅ đã có` / `⬜ chưa bắt đầu` / `⚠️ cần cập nhật`). **Màn chưa tới lượt xây (⬜) thiếu srs/test là ĐÚNG KẾ HOẠCH, không phải lỗi** → xếp 🟢 "planned", KHÔNG chấm 🔴. Chỉ 🔴 khi màn đã build (✅) mà vẫn thiếu srs/test — đó mới là đứt truy vết thật. Không có bước này, mọi dự án đang xây dở sẽ luôn 🔴 và gate không bao giờ qua.

## Neo trace hợp lệ ngoài chuỗi lõi (đừng chấm gap)
- **BRule (business rule)** — `BRule-Login`, `BRule-S02-..` không nằm trong sơ đồ ID lõi nhưng là mắt neo phổ biến: một `TC`/`R-S` trace tới `BRule` vẫn **hợp lệ**. Ghi ở cột ghi chú, không coi là mồ côi.
- **TC neo qua UC/BRule** — chuỗi cho phép `TC → UC → R-S`; TC chỉ ghi nguồn là UC hoặc BRule vẫn hợp lệ. Chỉ **mồ côi ngược** khi TC không neo vào *bất kỳ* R-S/UC/BRule nào.
- **Chức năng nền không màn** — vd F09 (cron nhắc email) khai rõ "không có màn" ở `03-overview.md`: F→S "thiếu" nhưng là 🟢 chủ ý, ghi chú, không chấm gap.
- **NFR hiện thực gián tiếp** — một NFR có thể phủ qua R-S **chức năng** (vd khoá tài khoản trong R-S đăng nhập) hoặc là ràng buộc **hạ tầng** không gắn màn (uptime). Cả hai là 🟢 "phủ gián tiếp/ngoài phạm vi màn", ghi chú rõ.

## Tiêu chí độ phủ (báo % + đếm)
- **FR→F:** % FR có ≥1 chức năng cài đặt. FR không có F = mồ côi 🔴.
- **F→S:** % chức năng đã lên ít nhất một màn (trừ chức năng nền không màn đã khai — không tính thiếu).
- **S→R-S:** % màn **đã build (✅)** có ≥1 yêu cầu màn. Màn ⬜ chưa tính vào mẫu số "cần có srs".
- **R-S(CN)→TC:** % yêu cầu **chức năng** của màn đã build có ≥1 test case. R-S chức năng thiếu TC 🟡. *(R-S phi CN — hiệu năng/bảo mật/a11y — thường kiểm bằng load test/công cụ ngoài bảng chức năng: 🟢 chấp nhận, dẫn chiếu cách kiểm, không đòi TC.)*
- **NFR→R-S phi CN:** đo theo **mỗi NFR có ≥1 nơi hiện thực** (R-S phi CN, hoặc R-S chức năng, hoặc ràng buộc hạ tầng đã ghi chú). NFR không có nơi nào nhận = 🟡.
- Mỗi chỉ số ghi `x/y (z%)`.

## Mức đánh dấu gap
- 🔴 **Chặn:** yêu cầu (BR/FR) mồ côi hoàn toàn · ref trace tới ID không tồn tại · **màn ĐÃ BUILD (✅)** có chức năng nhưng **không** srs · TC không neo vào bất kỳ mắt xích nào.
- 🟡 **Quan trọng:** R-S chức năng (màn ✅) không có TC · màn ✅ không có UC · NFR không có nơi hiện thực nào · `UE` Critical/High không màn nào trích và URD không ghi `n/a — lý do`/`OQ`.
- 🟢 **Sạch / chấp nhận:** mọi tầng nối liền mạch · màn ⬜ planned thiếu srs/test · chức năng nền không màn · R-S phi CN kiểm bằng công cụ ngoài · NFR phủ gián tiếp — đều 🟢 kèm ghi chú.

Khi gọi từ gate/`ba-review`, còn 🔴/🟡 → báo để dừng (chính sách gate ở `conventions.md`). 🟢 planned không chặn.

## Lưu ý
- Chỉ đọc + ghi đúng `docs/Ho-so/00-traceability.md`; không sửa tài liệu nguồn. Lệch phát hiện được thì đề xuất skill sửa (`ba-screen-spec`/`ba-test`/`ba-change-request`), không tự vá.
- RTM vào portal như doc `00-*` (living). `ba-portal` gom tự động.
- Tiếng Việt. ID giữ nguyên định dạng `conventions.md`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
