---
name: ba-feasible
description: Use when tài liệu BA đã qua ba-review nhưng CHƯA chắc code ra được — soát KHẢ THI trước khi sinh plan (rule có trường đỡ, mã lỗi có câu chữ, chức năng có endpoint, TC có task). Trước ba-build.
---

# ba-feasible — Soát tính khả thi trước khi sinh plan

## Mục tiêu
Trả lời **một câu hỏi mà không skill nào khác hỏi**: *tài liệu này viết ra code được chưa?*

`ba-review` soát **độ phủ** (yêu cầu nào chưa có màn, màn nào chưa có test). `ba-consistency-reviewer` soát **mâu thuẫn** giữa các tài liệu. Cả hai đọc tài liệu bằng con mắt của người **đọc**. Skill này đọc bằng con mắt của người **sắp code**, và đó là góc nhìn duy nhất thấy được một loại lỗi riêng: **tài liệu tự nhất quán nhưng chưa đủ để hiện thực**.

## Vì sao cần một cổng riêng
Ba lỗ dưới đây lọt qua cả `ba-review` lẫn `ba-consistency-reviewer`, và chỉ lộ ra khi thật sự build màn `S01` (31/08/2026):

| Lỗ | Đọc thì thấy gì | Code thì gặp gì |
|---|---|---|
| `BRule-S01-03` đếm "3 lần khoá tạm liên tiếp" | Luật rõ ràng, có trace, có TC | `05-data-model` **không trường nào** giữ số chu kỳ khoá → không lưu được, không kiểm chứng được |
| `10-architecture` §10 vẽ cây thư mục | Có mục "Cấu trúc thư mục chuẩn" ✓ | Chỉ có nhánh **backend**, trong khi ADR chốt Next.js → mọi plan tự bịa đường dẫn frontend |
| `design-spec` §5 có microcopy "Phiên đăng nhập đã hết hạn" | Câu chữ đẹp, đúng giọng | `srs` **không mã lỗi nào** mang câu đó → không ai biết nó hiện ra khi nào |

Cả ba đều **không phải thiếu tài liệu** và **không phải mâu thuẫn**. Chúng là *khoảng cách giữa mô tả và hiện thực* — thứ chỉ đo được khi hỏi ngược từ phía code.

## Cách gọi
`ba-feasible` (toàn dự án) · `ba-feasible <màn>` (một màn — nhận **mã** `S01` hoặc **tên** `Login`).

> **Lọc màn thì bỏ qua hai check cấp dự án** (chức năng ↔ endpoint, cây thư mục kiến trúc) vì chúng không thuộc scope màn nào. Script in ra điều đó mỗi lần, không bỏ im lặng — và màn không tồn tại thì thoát mã `2` kèm danh sách màn có thật, chứ không lặng lẽ quét cả dự án.

Chạy **sau `ba-review`, trước `ba-build`**. Chạy sau `ba-build` cũng được (nó soát cả plan), nhưng lúc đó plan đã viết rồi — sửa nguồn trước rẻ hơn.

## Quy trình
1. **Chạy bộ kiểm cơ giới** (zero-dep, chỉ đọc, không phán xét ngoại lệ):
   ```bash
   node .claude/skills/ba-feasible/scripts/scan-feasible.js [docsDir=docs] [--plain]
   ```
   Mặc định trả JSON `{docsDir, soMan, dem, findings[]}`; `--plain` cho người đọc. Exit `1` = có phát hiện, `0` = sạch, `2` = không đọc được tài liệu nguồn.

   Script soát 9 điều, tất cả đều **khớp chuỗi, không suy đoán** (JSON kèm `gioiHan` — điều nó không soát được):
   - `BRule-S..` viện tới trường snake_case nào thì trường đó phải có trong `05-data-model.md`;
   - mỗi `E-S..` phải có ô "Người dùng thấy gì" không rỗng;
   - trạng thái trong `stateDiagram` phải được nhắc ở đâu đó ngoài sơ đồ;
   - mỗi `F..` phải có endpoint trong `06-api-spec.md` (chức năng chạy nền thì hạ xuống 🟢, nhưng vẫn nêu để không ai quên giao nó cho một plan);
   - `10-architecture` phải có mục "Cấu trúc thư mục chuẩn", và nếu ADR chốt framework frontend thì cây phải có nhánh cho nó;
   - mỗi `TC-S..` phải có task trong `plan.md` nhắc tới;
   - đường dẫn trong dòng khai file của `plan.md` phải bám cây thư mục đã chốt;
   - microcopy trong `design-spec.md` phải có nguồn nguyên văn trong `srs.md`;
   - mục **"Quét yêu cầu ngầm"** của `srs.md` (9 chiều, mẫu ở `ba-screen-spec/assets/templates.md`): đủ 9 chiều · không ô rỗng · `n/a` có lý do · mã trỏ tới phải được khai trong srs (ngoài chính bảng quét) hoặc tài liệu màn · một mã không phủ hai chiều trừ khi ghi `dùng chung — <vì sao>` → 🟡. srs **chưa có** mục → một dòng 🟢 gộp, **không tính vào exit** (dự án cũ không đỏ loạt). Mã có quan sát *đúng* chiều không — bạn đọc, script không phán.

2. **Diễn giải — đây mới là phần của LLM.** Script không biết ngoại lệ chính đáng; bạn biết. Với mỗi phát hiện, xét:
   - Có thật là chặn việc code không, hay là quy ước riêng của dự án? *(vd: một `F..` chạy nền không cần endpoint — nhưng phải chỉ ra plan nào build nó.)*
   - Câu microcopy nào chỉ là gợi ý giao diện, câu nào **hàm ý một luật nghiệp vụ chưa tồn tại**? Câu thứ hai nặng hơn hẳn: *"Đổi mật khẩu sẽ đăng xuất bạn khỏi mọi thiết bị khác"* không phải câu chữ, đó là một yêu cầu chưa ai viết.
   - Trạng thái mồ côi trong sơ đồ là chi tiết kỹ thuật hay là thứ người dùng phải thấy?

3. **Xếp mức và định tuyến.** Giữ nguyên bốn mức của `conv-gates.md`:
   - 🔴 — luật không có chỗ lưu · kiến trúc thiếu cây thư mục cho một tầng đã chốt. **Chặn `ba-build`**: sinh plan trên nền này là sinh ra thứ không code được.
   - 🟡 — microcopy không nguồn · trạng thái mồ côi · TC chưa task nào phủ · plan lệch cây thư mục. Chặn **phạm vi của chính nó** (màn đó), không chặn cả dự án.
   - 🟢 — ghi nhận, không chặn.

4. **Ghi vào `docs/Ho-so/00-gaps.md`** theo luật gộp-theo-scope của `conv-gates.md` → "Ghi `00-gaps.md`": chỉ ghi đè các dòng cùng `Scope`, giữ nguyên phần còn lại, đánh dấu đóng ở **ô cuối**.

5. **Báo người dùng** bảng gọn: mỗi phát hiện một dòng · mức · scope · sửa bằng skill nào. Không dán nguyên JSON.

## Điểm dừng
- Không có `05-data-model.md` **và** không có `10-architecture.md` → dừng, nói rõ là chưa soát được gì đáng kể: hai tài liệu đó là mặt phẳng đối chiếu chính. Route `ba-data-model` / `ba-architecture`.
- Phát hiện 🔴 → **không tự sửa**. Luật thiếu chỗ lưu là đổi baseline (`ba-change-request`); kiến trúc thiếu tầng là việc của `ba-architecture` qua cổng chốt.
- Script exit `2` → báo lỗi đọc file, đừng đoán nội dung.

## Ranh giới với skill khác
| Skill | Hỏi câu gì |
|---|---|
| `ba-review` | Có **thiếu** artifact/độ phủ nào không? |
| `ba-consistency-reviewer` | Các tài liệu có **chọi nhau** không? |
| **`ba-feasible`** | **Viết ra code được chưa?** |
| `ba-conformance` | Code đã viết có **khớp** tài liệu không? *(chạy sau khi có code)* |

`ba-feasible` **cố ý không** kiểm "mỗi `E-S..` đã có TC chưa" — đó là luật của `ba-review`. Cùng một vấn đề bị hai skill báo là cách nhanh nhất khiến người dùng học cách bỏ qua cả hai.

## Lưu ý
- Tiếng Việt. Chỉ đọc, không sửa file nào.
- **Số phát hiện phải ít và đúng.** Bản đầu của script báo 86 dòng, trong đó 71 là lặp việc của `ba-review` và vài dòng là dương tính giả (bắt cả đường dẫn nằm trong câu ghi chú lịch sử). Một báo cáo ồn thì không ai đọc — khi thêm luật mới vào script, đo lại số dòng trên `example/docs` trước khi chốt.
- Phát hiện cùng một nguyên nhân thì **gộp thành một dòng** (7 trạng thái mồ côi của một màn là một vấn đề, không phải bảy).
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
