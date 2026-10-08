---
name: ba-proto-first
description: Use when nghiệp vụ còn mơ hồ và muốn CHỐT BẰNG PROTOTYPE BẤM ĐƯỢC trước rồi mới đặc tả — orchestrator thay ba-init — luồng màn → prototype → demo chốt PD → đặc tả.
---

# ba-proto-first — Luồng "dựng thấy được trước, đặc tả sau"

## Mục tiêu
`ba-init` đi xuôi: yêu cầu → chức năng → màn → đặc tả → HTML. Luồng này **đảo lại**: dựng thứ **nhìn thấy và bấm được** trước, đem chốt với khách, rồi mới viết đặc tả **từ những gì đã chốt**.

Dùng khi: nghiệp vụ còn mơ hồ · khách **không đọc nổi** bảng `FR` nhưng nhìn màn hình là có ý kiến ngay · cần chốt phạm vi trước khi báo giá.

**Vì sao đáng đổi thứ tự:** chỗ mơ hồ tự lộ ra bằng hình ảnh thay vì bằng suy đoán. Khách nhìn nút "Duyệt" mới nhớ ra có hai cấp duyệt — điều họ không nghĩ ra khi đọc một bảng yêu cầu.

**Cái giá phải trả, nói thẳng:** prototype dựng khi chưa có yêu cầu thì **mọi thứ trên đó đều là giả định**. Luồng này chỉ an toàn nhờ **bước 5 — cổng chốt có ghi sổ**. Bỏ bước 5 thì nó thành "AI vẽ đại rồi tự tin viết spec theo hình mình vẽ", tệ hơn `ba-init`.

## Điều kiện
Một ý tưởng thô là đủ. Đã có `01-requirements.md` **đã chốt** → **không dùng luồng này** (nghiệp vụ chốt rồi, prototype giờ là việc của `ba-html-design`/`ba-prototype`); đổi baseline thì đi `ba-change-request`.

## Quy trình

### 0. Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án")
Đọc xong đầu vào, **trước khi ghi file nào**: trình phương án đủ 6 phần — trong "Sẽ làm" nêu rõ **số màn dự kiến** và **dừng ở bước 5 để demo**. `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**.

### 1–4. Dựng thứ thấy được
1. `ba-brainstorm` — phỏng vấn ý tưởng *(bỏ qua nếu đã có `Ho-so/00-brainstorm.md`)*.
2. **`ba-flow`** → `Ho-so/00-flows.md`: luồng theo vai trò + **bảng màn sơ bộ** (mã `S..` **tạm**) + sơ đồ điều hướng có nhãn cạnh.
3. **`ba-screen-spec --ascii <màn>`** cho từng màn → chỉ `ascii-screen.md`. **Không** sinh srs/usecase/userstory/design-spec ở đây (hồ sơ `mini`: không sinh `srs`) — chưa chốt nghiệp vụ thì đặc tả viết ra là bịa.
4. **`ba-proto-html`** → `Ho-so/prototype.html` + `check-proto.js` phải sạch.

### 5. ★ CỔNG CHỐT NGHIỆP VỤ (HARD STOP — lý do luồng này tồn tại)
**Không được tự vượt qua bước này.** Đưa `prototype.html` cho người dùng/khách, rồi:

1. **Dẫn demo theo luồng**, không theo màn: mỗi luồng `L..` trong `00-flows.md` là một kịch bản bấm từ đầu đến hết.
2. **Hỏi có mục tiêu** ở mỗi màn — bốn câu, hỏi thiếu thì buổi demo thành buổi khen giao diện:
   - Thiếu gì để **xong việc** trên màn này?
   - Nút nào **không nên có** (ngoài phạm vi)?
   - Ai được thấy/được bấm cái gì (**quyền**)?
   - Sai thì hệ thống phải làm gì (**ngoại lệ**)?
3. **Ghi mọi điểm chốt vào `docs/00-decisions.md`** — mã `PD-01…` toàn cục, theo mẫu ở `conv-ledgers.md` → "Sổ quyết định sản phẩm (PD)". Mỗi dòng: nội dung chốt · ai chốt · ngày · màn/luồng liên quan · trạng thái.
4. **Không chốt được thì ghi `PD` trạng thái `Treo`** kèm câu hỏi còn mở — **không** tự quyết thay khách.
5. `AskUserQuestion`: **Đã chốt, viết đặc tả / Sửa prototype rồi demo lại / Dừng ở đây**.

> **Điều kiện đi tiếp:** mọi màn trong bảng màn sơ bộ có **≥1 `PD`** ở trạng thái `Chốt`. Còn màn chưa ai có ý kiến → **quay lại bước 5 cho riêng màn đó**, đừng viết đặc tả cho phần chưa ai xác nhận.

### 6–9. Viết đặc tả TỪ bản đã chốt
6. `ba-requirements` → `ba-functions` → `ba-screens`. **Mỗi `FR` phải trace ≥1 `PD`**; `FR` không có `PD` nào đỡ = thứ chưa ai chốt → hỏi lại, đừng viết vào. `ba-screens` cấp mã `S..` **baseline** (mã ở `00-flows.md` chỉ là tạm) và tạo `00-tracking.md` + **chốt hồ sơ dự án** `full`/`lite`/`mini`.
7. `ba-screen-spec` đầy đủ cho từng màn *(≥3 màn → `ba-batch`)*. `ascii-screen.md` đã có từ bước 3 — **dùng lại, không vẽ lại**.
8. `ba-checklist` → `ba-test`.
9. `ba-review all` → gate. Còn 🔴 → dừng, sửa.

## Cổng lồng nhau
Skill con được gọi từ đây (`ba-flow`, `ba-screen-spec`, `ba-proto-html`, `ba-requirements`, `ba-screens`) **không hỏi duyệt lại** — cổng ở bước 0 đã bao phủ (`conv-gates.md` → "Cổng cha bao phủ cổng con"). Ba ngoại lệ vẫn giữ nguyên: việc ngoài phương án · `ba-change-request`/`ba-task` · bảng màn của `ba-screens`.

## Điểm dừng
- Không suy ra được luồng nào → dừng ở bước 2, hỏi việc chính của hệ thống.
- Prototype còn lỗi `check-proto.js` → **không** đem demo (nút dẫn vào hư không trước mặt khách là mất uy tín).
- Bước 5 chưa xong → **không** chạy bước 6 dù người dùng giục; giục thì hỏi thẳng: *"chốt miệng cũng được, nhưng tôi vẫn ghi `PD` để spec có gốc — đồng ý không?"*.

## Đầu ra
`Ho-so/00-flows.md` · `ascii-screen.md` mỗi màn · `Ho-so/prototype.html` · **`00-decisions.md`** · rồi bộ tài liệu chuẩn như `ba-init` (`01`/`02`/`03`, folder màn, `00-tracking.md`).

## Lưu ý
- Tiếng Việt. **Hồ sơ dự án** (`conv-gates.md` → "Hồ sơ dự án"): bước 6 chốt `full`/`lite`/`mini`; bước 7 sinh 5 hay 6 file mỗi màn là theo hồ sơ đó.
- **Đứt phiên → `ba-next`**, đừng gọi lại `ba-proto-first`: nó là chuỗi tuyến tính không giữ trạng thái, gọi lại là về bước 0.
- **Không chạy song song `ba-init`** trên cùng dự án — hai orchestrator cùng ghi `01`/`02`/`03` sẽ giẫm nhau.
- Chốt xong và đã có `html-design.html` từng màn thì seed frontend là `ba-prototype`; `prototype.html` là bản **dùng một lần để chốt**, đừng nuôi thành sản phẩm.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
