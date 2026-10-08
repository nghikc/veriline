# Brainstorm — Chi tiết công việc

## Mục đích màn hình
Người dùng mở màn này từ một dòng công việc ở Dashboard (S02) hoặc từ một thông báo in-app, để:
1. Xem **đầy đủ** thông tin một công việc (thứ mà danh sách ở S02 chỉ hiển thị rút gọn).
2. **Đẩy công việc đi tiếp** trong luồng trạng thái — người thực hiện bắt đầu làm và gửi duyệt; người quản lý duyệt hoặc trả lại.
3. **Trao đổi** quanh công việc bằng bình luận, thay cho việc nhắn qua kênh chat rời rạc (`BR-01`).
4. **Truy vết** ai đã đổi gì, lúc nào — dòng thời gian lịch sử là bằng chứng trách nhiệm (`BR-02`).

Đây là màn duy nhất trong giai đoạn 1 cho phép **sửa** một công việc đã tạo (`03-overview.md` §Đủ bộ List/Detail/Create/Edit).

## Thành phần & hành vi
- **Header** → giống S02 (logo, chuông thông báo, avatar menu). Thêm **nút quay lại** về Dashboard.
- **Khối thông tin chính** → tiêu đề công việc, badge trạng thái, badge ưu tiên, deadline (tô đỏ + ⚠ nếu quá hạn), người giao, người thực hiện, thời điểm tạo / cập nhật gần nhất.
- **Khối mô tả** → mô tả chi tiết dạng văn bản dài (có thể rỗng); dài quá thì thu gọn kèm "Xem thêm".
- **Thanh hành động trạng thái** → chỉ hiện những nút **hợp lệ với trạng thái hiện tại VÀ vai trò người đang xem**:
  - Người thực hiện: "Bắt đầu làm" (TODO → IN_PROGRESS) · "Gửi duyệt" (IN_PROGRESS → IN_REVIEW).
  - Team Lead / Org Admin: "Duyệt hoàn thành" (IN_REVIEW → DONE) · "Từ chối" (IN_REVIEW → IN_PROGRESS, **bắt buộc nhập lý do**) · "Huỷ công việc" (→ CANCELLED).
- **Nút "Sửa thông tin"** (người giao / Team Lead / Org Admin) → mở modal sửa tiêu đề, mô tả, người thực hiện, deadline, ưu tiên — dùng lại đúng bộ validation của modal tạo việc ở S02.
- **Dòng thời gian lịch sử** → mới → cũ; mỗi dòng: *ai · đổi trường gì · từ giá trị nào → giá trị nào · lúc nào*.
- **Khu bình luận** → danh sách cũ → mới (đọc như hội thoại) + ô nhập ở cuối + nút "Gửi". Bình luận **bất biến**: không sửa, không xoá (`02-functions.md` §Ghi chú CRUD).

## Luồng trạng thái (trục chính của màn)
```
TODO ──"Bắt đầu làm"──> IN_PROGRESS ──"Gửi duyệt"──> IN_REVIEW ──"Duyệt"──> DONE
                             ^                            |
                             └────"Từ chối" (kèm lý do)────┘

Bất kỳ trạng thái nào (trừ DONE) ──"Huỷ công việc"──> CANCELLED
```
- `TODO → DONE` **không hợp lệ** — API trả `400` (`06-api-spec.md` §PATCH /tasks/:id/status).
- `DONE` và `CANCELLED` là **trạng thái cuối**, không đi tiếp được.

## Phân vai (ai được làm gì trên màn này)
| Hành động | Member (là người thực hiện) | Member (không liên quan) | Team Lead | Org Admin |
|---|---|---|---|---|
| Xem chi tiết | ✅ | ✅ *(cùng tổ chức)* | ✅ | ✅ |
| Bắt đầu làm / Gửi duyệt | ✅ | ⛔ | ✅ *(nếu là người thực hiện)* | ✅ *(nếu là người thực hiện)* |
| Duyệt / Từ chối | ⛔ | ⛔ | ✅ | ✅ *(giả định `GĐ-01`)* |
| Huỷ công việc | ⛔ | ⛔ | ✅ | ✅ |
| Sửa thông tin | ⛔ | ⛔ | ✅ | ✅ |
| Bình luận | ✅ | ✅ | ✅ | ✅ |

## Trạng thái & edge case
- **Loading:** skeleton cho khối thông tin, lịch sử và bình luận (ba khối tải từ ba lời gọi khác nhau — hiện dần, không chờ cả ba).
- **Rỗng:** chưa có bình luận → "Chưa có bình luận nào. Hãy là người đầu tiên trao đổi về công việc này."; lịch sử luôn có ít nhất 1 dòng (lúc tạo) nên không có trạng thái rỗng.
- **Lỗi:** API chi tiết lỗi → khối lỗi + "Thử lại"; gửi bình luận lỗi → **giữ nguyên nội dung đã gõ**, báo lỗi cạnh ô nhập; đổi trạng thái lỗi → badge trở về giá trị cũ, toast lỗi.
- **Không tìm thấy:** id không tồn tại, đã bị xoá, **hoặc thuộc tổ chức khác** → cùng một trang "Không tìm thấy công việc" (không phân biệt, tránh lộ sự tồn tại của dữ liệu tổ chức khác).
- **Không có quyền:** nút không hợp lệ **không render** (không phải chỉ disable); server vẫn kiểm lại và trả `403`.
- **Quá hạn:** deadline < hiện tại và trạng thái ∉ {DONE, CANCELLED} → deadline tô đỏ + ⚠ (đồng nhất với `BRule-S02-02`).
- **Đua thao tác (race):** hai người cùng mở một việc, một người đổi trạng thái trước → người sau nhấn nút sẽ nhận `400`/`409`, màn tự tải lại trạng thái mới và báo "Công việc vừa được cập nhật bởi người khác".
- **Bình luận rất nhiều:** > 50 bình luận → tải 50 cái mới nhất, nút "Xem bình luận cũ hơn".
- **Mô tả rỗng:** hiện "Không có mô tả" chứ không để khoảng trắng.

## Giả định

> **Đã rà với người dùng ngày 2026-07-22 — cả 7 giả định được giữ nguyên (Đồng ý).** Trạng thái: `Đề xuất ⚠️ chưa xác nhận` → `Đã xác nhận` / `Đã sửa` / `Đã bỏ`.

| Mã | Nội dung giả định | Vì sao cần (chỗ thiếu) | Ảnh hưởng nếu sai | Trạng thái |
|---|---|---|---|---|
| GĐ-01 | **Org Admin có quyền duyệt/từ chối** như Team Lead | `02-functions.md` §Ma trận phân quyền để `❓` ở ô F06 × Org Admin, ghi rõ "chốt khi S03" | Sai → Org Admin thấy nút không được phép dùng, hoặc bị chặn oan khi Team Lead vắng mặt | **Đã xác nhận** (2026-07-22) — ô `❓` trong `02-functions.md` đã cập nhật thành ✅ |
| GĐ-02 | Chỉ **người thực hiện** được "Bắt đầu làm" và "Gửi duyệt"; người giao không làm thay | `FR-06` ghi "thành viên cập nhật trạng thái" nhưng không nói rõ có phải đúng người thực hiện không | Sai → Team Lead tự đẩy trạng thái hộ, lịch sử mất ý nghĩa trách nhiệm (`BR-02`) | **Đã xác nhận** (2026-07-22) |
| GĐ-03 | **Từ chối bắt buộc nhập lý do**, lý do lưu thành **một bình luận** của người từ chối | `LichSuCongViec` chỉ có `gia_tri_cu`/`gia_tri_moi`, **không có chỗ chứa lý do**; tái dùng `BinhLuan` tránh đổi mô hình dữ liệu | Sai (nếu muốn lý do là trường riêng) → phải bổ sung cột vào `LichSuCongViec` hoặc bảng mới → chạm `05-data-model.md` | **Đã xác nhận** (2026-07-22) — không đổi `05-data-model.md` |
| GĐ-04 | **Sửa thông tin công việc** dành cho Team Lead / Org Admin (không cho người thực hiện tự sửa deadline/ưu tiên của mình) | `F06` mô tả "cập nhật thông tin công việc" nhưng không nêu vai trò; `06-api-spec.md` có `PATCH /tasks/:id` mà không ghi quyền | Sai → hoặc người thực hiện tự nới deadline (mất kiểm soát), hoặc Lead phải sửa hộ mọi thứ | **Đã xác nhận** (2026-07-22) |
| GĐ-05 | **DONE và CANCELLED là trạng thái cuối** — giai đoạn 1 không có "mở lại" (reopen) | `06-api-spec.md` chỉ liệt kê luồng tiến; không nói gì về chiều ngược từ DONE | Sai → cần thêm chuyển trạng thái `DONE → IN_PROGRESS` + luật ai được mở lại | **Đã xác nhận** (2026-07-22) |
| GĐ-06 | **Huỷ công việc không hồi lại được**; việc đã DONE thì không huỷ | Cùng lý do `GĐ-05` | Sai → huỷ nhầm là mất việc, phải tạo lại từ đầu | **Đã xác nhận** (2026-07-22) |
| GĐ-07 | Mọi người trong **cùng tổ chức** đều xem được chi tiết mọi công việc (kể cả việc không liên quan mình) | `F07` ghi "mọi thành viên trong tổ chức có thể đọc comment" → suy ra chi tiết việc cũng mở trong tổ chức; nhưng `BRule-S02-01` lại **giới hạn danh sách** của Member | Sai → Member vào thẳng URL `/tasks/:id` của việc không liên quan sẽ xem được thứ đáng lẽ bị chặn | **Đã xác nhận** (2026-07-22) — ghi chú vào `02-functions.md`: `BRule-S02-01` chỉ giới hạn **danh sách**, không giới hạn **chi tiết** |

## Câu hỏi mở
- ~~**`OQ-S03-01` — "File đính kèm" không có chỗ dựa dữ liệu.**~~ **ĐÃ ĐÓNG (2026-07-22).** `02-functions.md` mô tả `F05` gồm *"…comment, file đính kèm"*, nhưng `05-data-model.md` không có thực thể tệp đính kèm nào và `06-api-spec.md` không có endpoint tải lên/tải xuống. **Quyết định: bỏ cụm "file đính kèm" khỏi mô tả `F05`** — đính kèm không thuộc phạm vi giai đoạn 1. `02-functions.md` đã được sửa; `F05` và `S03` hết lệch. Muốn đưa đính kèm vào sau này → mở `CR` (phải bổ sung thực thể + endpoint + quy tắc dung lượng/loại tệp).
- Thông báo `STATUS_CHANGED` gửi cho **những ai**? Đề xuất: người thực hiện + người giao, trừ chính người vừa thao tác. `05-data-model.md` có sẵn loại thông báo này nhưng không ghi tập người nhận.
- Bình luận có cần `@mention` để kéo người khác vào không? Giai đoạn 1 đề xuất **không** — `ThongBao` chưa có loại tương ứng cho mention ngoài `COMMENT_ADDED`.
- Lịch sử có ghi cả thay đổi **thông tin** (tiêu đề/deadline/ưu tiên/người thực hiện) hay chỉ thay đổi **trạng thái**? Đề xuất: ghi **cả hai** — `LichSuCongViec.truong_thay_doi` là chuỗi tự do nên chứa được, và `05-data-model.md` mô tả thực thể này là "mỗi lần trạng thái/thông tin công việc thay đổi".
