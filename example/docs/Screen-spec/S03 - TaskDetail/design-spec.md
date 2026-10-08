# Design Spec — Chi tiết công việc (Mã màn: S03)

## 1. Tổng quan UX

- **Mục tiêu UX:** *một cái nhìn là biết việc đang ở đâu, một cú nhấn là đẩy nó đi tiếp.* Màn này là nơi công việc thực sự chuyển động, nên trạng thái hiện tại và hành động kế tiếp phải là hai thứ đập vào mắt trước tiên — mọi thứ khác (lịch sử, bình luận) là bối cảnh hỗ trợ.
- **Nguyên tắc dẫn đường:** người dùng **không phải đoán mình được làm gì**. Chỉ hiển thị đúng những hành động họ có quyền và hợp lệ ở trạng thái hiện tại; không bày nút rồi chặn.
- **Thiết bị mục tiêu:** Web desktop là chính (người quản lý duyệt việc trên máy tính), nhưng phải dùng được trên mobile — người thực hiện thường cập nhật tiến độ khi đang di chuyển.
- **User flow tóm tắt:** [S02 Dashboard] hoặc [thông báo in-app] → **[S03 Chi tiết công việc]** → quay lại [S02 Dashboard].

## 2. Cấu trúc layout (anatomy)

- **Header:** giống toàn hệ thống — logo, chuông thông báo kèm badge, menu avatar. Bên dưới header là **thanh quay lại** chứa liên kết "← Quay lại Dashboard".
- **Body — chia hai tầng:**
  - **Tầng trên (khối công việc):** tiêu đề công việc cỡ lớn, ngay dưới là cặp badge trạng thái + ưu tiên; bên phải là nút "Sửa thông tin" (chỉ người duyệt). Kế đó là khối thuộc tính dạng nhãn–giá trị (người giao, người thực hiện, deadline, tạo lúc, cập nhật lúc), rồi khối mô tả. Cuối tầng là **thanh hành động** — dải nút nổi bật, tách khỏi nội dung bằng đường phân cách.
  - **Tầng dưới (hai cột):** cột trái là **dòng thời gian lịch sử**, cột phải là **khu bình luận** (rộng hơn cột trái, vì đây là nơi người dùng tương tác). Ở màn hẹp, hai cột xếp chồng thành **tab** "Bình luận / Lịch sử" với Bình luận là tab mặc định.
- **Footer:** không có footer riêng — khu bình luận với ô nhập dính đáy vùng cuộn đóng vai trò kết thúc trang.

## 3. Component & dữ liệu

| Component | Loại | Mô tả / Logic | Ràng buộc (validation) | Trace |
|-----------|------|---------------|------------------------|-------|
| Liên kết quay lại | Text link + icon | Về Dashboard, khôi phục bộ lọc người dùng đang dùng trước đó | — | R-S03-18 |
| Tiêu đề công việc | Heading | Văn bản dài quá 2 dòng thì xuống dòng đầy đủ, **không** cắt bằng "…" (tiêu đề là thông tin chính) | 1–200 ký tự | R-S03-01 |
| Badge trạng thái | Badge | 5 giá trị: Cần làm · Đang làm · Chờ duyệt · Hoàn thành · Đã huỷ | Luôn kèm **chữ**, không chỉ dựa vào màu | R-S03-01, R-S03-N05 |
| Badge ưu tiên | Badge | 4 giá trị: Thấp · Trung bình · Cao · Khẩn cấp | Luôn kèm chữ | R-S03-01 |
| Khối thuộc tính | Danh sách nhãn–giá trị | Người giao, người thực hiện (kèm avatar), deadline, tạo lúc, cập nhật lúc | Deadline quá hạn → nhấn mạnh đỏ + ⚠ | R-S03-01, R-S03-02 |
| Khối mô tả | Text block | Giữ nguyên xuống dòng; dài quá 6 dòng thì thu gọn kèm "Xem thêm" | Rỗng → hiện "Không có mô tả" | R-S03-01 |
| Nút "Bắt đầu làm" | Primary CTA | Chỉ hiện với người thực hiện khi trạng thái Cần làm | Không hợp lệ → **không render** | R-S03-07, R-S03-08 |
| Nút "Gửi duyệt" | Primary CTA | Chỉ hiện với người thực hiện khi trạng thái Đang làm | Không hợp lệ → không render | R-S03-07, R-S03-09 |
| Nút "Duyệt hoàn thành" | Primary CTA | Chỉ hiện với người duyệt khi trạng thái Chờ duyệt | Không hợp lệ → không render | R-S03-07, R-S03-10 |
| Nút "Từ chối" | Secondary CTA | Mở modal bắt buộc nhập lý do | Lý do rỗng → nút xác nhận disable | R-S03-11 |
| Nút "Huỷ công việc" | Destructive CTA | Chỉ người duyệt, mọi trạng thái trừ Hoàn thành; luôn qua hộp xác nhận | Ở Hoàn thành → không render | R-S03-12 |
| Nút "Sửa thông tin" | Secondary CTA | Mở modal 5 trường điền sẵn giá trị hiện tại | Ràng buộc y hệt modal tạo việc S02 | R-S03-14 |
| Chữ "Đang chờ duyệt" | Trạng thái tĩnh | Thay chỗ thanh hành động khi người thực hiện đã gửi duyệt | — | R-S03-09 |
| Banner "Công việc đã huỷ" | Banner | Dải cảnh báo trên cùng khối công việc khi trạng thái Đã huỷ | — | R-S03-12 |
| Dòng thời gian lịch sử | Timeline | Mới → cũ; mỗi mục: người · trường · cũ → mới · thời điểm | Mục dưới cùng luôn là "Tạo công việc" | R-S03-03 |
| Danh sách bình luận | List | Cũ → mới; mỗi mục: avatar, tên, thời điểm, nội dung | **Không** có nút sửa/xoá | R-S03-04, R-S03-06 |
| Ô nhập bình luận | Textarea + đếm ký tự | Bộ đếm `n/1000`, chuyển đỏ khi vượt | 1–1000 ký tự, không toàn khoảng trắng | R-S03-05 |
| Nút "Gửi" (bình luận) | Primary CTA | Disable khi ô nhập rỗng hoặc vượt giới hạn | — | R-S03-05 |
| Nút "Xem bình luận cũ hơn" | Text button | Hiện khi có hơn 50 bình luận | — | R-S03-N06 |

## 4. Trạng thái giao diện (UI States)

- ⚪ **Empty:** khu bình luận chưa có bình luận nào → biểu tượng nhẹ + "Chưa có bình luận nào. Hãy là người đầu tiên trao đổi về công việc này." Dòng thời gian lịch sử **không có trạng thái rỗng** (luôn có ít nhất mục "Tạo công việc"). Mô tả rỗng → "Không có mô tả" bằng chữ mờ.
- 🔄 **Loading:** skeleton **theo từng khối, hiện dần** — khối công việc, dòng thời gian và khu bình luận tải từ ba lời gọi riêng nên khối nào xong hiện khối đó, không chờ cả ba. Khi đang gửi một thao tác: nút vừa nhấn chuyển sang spinner nội nút và bị khoá, các nút còn lại disable để tránh nhấn kép.
- 🔴 **Error:**
  - Lỗi tải chi tiết (`5xx`) → khối lỗi giữa trang + nút "Thử lại", header vẫn còn.
  - Lỗi tải riêng bình luận → lỗi **cục bộ trong khu bình luận**, phần còn lại của màn vẫn dùng được.
  - Lỗi khi đổi trạng thái → badge **bật lại giá trị cũ**, toast lỗi ở góc, không để giao diện nói dối là đã đổi.
  - Lỗi gửi bình luận → thông báo ngay dưới ô nhập, **giữ nguyên nội dung đã gõ**, kèm "Thử lại".
  - Không tìm thấy / không có quyền → trang trống chuyên dụng "Không tìm thấy công việc" + "Về Dashboard".
- 🟢 **Success:** đổi trạng thái xong → badge đổi kèm hiệu ứng nhấn một lần, dòng lịch sử mới trượt vào đầu timeline, toast xác nhận ngắn. Gửi bình luận xong → bình luận mới xuất hiện cuối danh sách với hiệu ứng nhấn một lần, ô nhập trống lại và giữ focus để gõ tiếp.

## 5. CTA & Copywriting (microcopy)

- **CTA Primary** (một tại một thời điểm, đổi theo trạng thái): `Bắt đầu làm` · `Gửi duyệt` · `Duyệt hoàn thành`
- **CTA Secondary:** `Từ chối` · `Sửa thông tin` · `Xem bình luận cũ hơn`
- **CTA Destructive:** `Huỷ công việc`
- **Title khu vực:** `Mô tả` · `Lịch sử thay đổi` · `Bình luận (4)`
- **Helper text:** ô bình luận — `Nhấn Gửi để đăng. Bình luận đã đăng không sửa hoặc xoá được.`
- **Xác nhận huỷ:** tiêu đề `Huỷ công việc này?` · nội dung `Thao tác không hoàn tác được. Người thực hiện sẽ nhận được thông báo.` · nút `Huỷ công việc` / `Không`
- **Modal từ chối:** tiêu đề `Từ chối công việc` · mô tả `Công việc sẽ quay lại trạng thái Đang làm.` · nhãn `Lý do từ chối *` · nút `Xác nhận từ chối` / `Huỷ bỏ`
- **Wording lỗi:**
  - `Vui lòng nhập nội dung bình luận` · `Bình luận tối đa 1000 ký tự`
  - `Vui lòng nhập lý do từ chối` · `Lý do tối đa 1000 ký tự`
  - `Không thể chuyển trạng thái này` (chuyển không hợp lệ)
  - `Bạn không có quyền thực hiện thao tác này` (sai vai trò)
  - `Công việc vừa được cập nhật bởi người khác` (đua thao tác)
  - `Lỗi kết nối — thử lại` (mất mạng)
  - `Không tìm thấy công việc` / `Công việc không tồn tại hoặc bạn không có quyền truy cập.`
- **Wording thành công:** `Đã chuyển sang Đang làm` · `Đã gửi duyệt` · `Đã duyệt hoàn thành` · `Đã trả lại công việc` · `Đã huỷ công việc` · `Đã cập nhật thông tin`

## 6. Edge case (xử lý UX)

- **Đua thao tác:** hai người cùng mở một việc, người B nhấn nút sau khi người A đã đổi trạng thái → hiện `Công việc vừa được cập nhật bởi người khác`, màn **tự nạp lại** dữ liệu mới và vẽ lại thanh hành động theo trạng thái mới. Không để người B nhấn tiếp vào nút đã lỗi thời.
- **Nhấn kép:** khoá nút đang xử lý và disable các nút hành động còn lại cho tới khi có phản hồi — tránh tạo hai bản ghi lịch sử cho một thao tác.
- **Từ chối nửa chừng:** bình luận lý do đã tạo nhưng chuyển trạng thái lỗi → báo lỗi và nạp lại; khi người duyệt thao tác lại thì **không bắt nhập lý do lần hai** (lý do cũ đã nằm trong khu bình luận).
- **Mất mạng khi gõ bình luận dài:** nội dung không bao giờ bị xoá khỏi ô nhập cho tới khi gửi thành công.
- **Mô tả rất dài (tới 5000 ký tự):** thu gọn còn 6 dòng + "Xem thêm"; mở rộng không đẩy khu bình luận ra khỏi tầm nhìn đột ngột.
- **Tiêu đề rất dài (200 ký tự):** hiện đầy đủ, không thu gọn tiêu đề (xuống dòng đầy đủ, không cắt bằng "…").
- **Bình luận chứa mã hoặc thẻ HTML:** hiển thị nguyên văn dạng văn bản thuần, không thực thi, không vỡ layout.
- **Công việc đã huỷ:** vẫn đọc được toàn bộ lịch sử và bình luận (giá trị lưu trữ), nhưng ô nhập bình luận vô hiệu hoá kèm chú thích `Công việc đã huỷ — không thể bình luận thêm.`
- **Người xem chỉ đọc (Member không liên quan):** thanh hành động ẩn hoàn toàn, không hiện nút xám — nút xám gợi ý "có thể mở khoá được", gây hiểu nhầm.
- **Quay lại từ trình duyệt (nút Back):** trở về Dashboard giữ nguyên vị trí cuộn và bộ lọc, dùng hiệu ứng vào nhanh (không dịch chuyển).

## 7. Animation & chuyển cảnh (BẮT BUỘC)

> Mọi giá trị lấy từ **Motion token** của `07-design-system.md` §10.1 — không đặt số riêng. Tôn trọng `prefers-reduced-motion`.

**Chuyển màn (page transition) — vào/ra khi điều hướng:**

| Hướng | Màn lân cận | Hiệu ứng | Thời lượng · easing |
|-------|-------------|----------|---------------------|
| Vào (enter) | ← [S02 Dashboard] (nhấn một dòng công việc) | `motion.page-enter` — fade-in + dịch lên 8px | 200ms · ease-out |
| Vào (enter) | ← [thông báo in-app] hoặc mở URL trực tiếp / nút Back | `motion.page-enter.quick` — fade-in, **không** dịch chuyển (giữ nguyên vị trí cuộn) | 150ms · ease-out |
| Ra (exit) | → [S02 Dashboard] (nhấn "← Quay lại Dashboard") | `motion.page-exit` — fade-out | 100ms · ease-in |

**Chuyển section nội màn (in/out):**

| Thành phần | Sự kiện | Hiệu ứng IN | Hiệu ứng OUT | Thời lượng · easing |
|-----------|---------|-------------|--------------|---------------------|
| Modal "Từ chối" / "Sửa thông tin" | mở / đóng | `motion.modal-in` — fade + scale 0.98 → 1 (backdrop fade riêng) | fade + scale 1 → 0.98 | 200ms · ease-out / ease-in |
| Hộp xác nhận "Huỷ công việc" | mở / đóng | `motion.modal-in` | fade + scale xuống | 200ms · ease-out / ease-in |
| Badge trạng thái | sau khi đổi trạng thái | `motion.crossfade` đổi nhãn tại chỗ, rồi `motion.highlight-once` nhấn **một lần** | — | 150ms · ease, nhấn ~2s |
| Dòng lịch sử mới | thêm vào đầu timeline | fade + trượt xuống từ trên, kèm `motion.highlight-once` | — | 150ms · ease-out |
| Bình luận mới | gửi thành công | fade + trượt lên từ dưới, kèm `motion.highlight-once` | — | 150ms · ease-out |
| Thanh hành động | đổi bộ nút theo trạng thái mới | `motion.crossfade` — bộ nút cũ mờ đi, bộ mới hiện tại chỗ, **không** trượt (tránh nhấn nhầm nút đang di chuyển) | `motion.crossfade` | 150ms · ease |
| Skeleton → nội dung | từng khối tải xong | `motion.section-in` — fade-in | `motion.section-out` | 150ms · ease-out / ease-in |
| Lỗi inline (bình luận, modal) | xuất hiện / biến mất | `motion.section-in` | `motion.section-out` | 150ms · ease-out / ease-in |
| Toast xác nhận / lỗi | hiện / tắt | `motion.overlay-in` — trượt lên + fade từ đáy | fade-out | 250ms · ease |
| Khối mô tả "Xem thêm" | mở rộng / thu gọn | giãn chiều cao + fade phần thêm | ngược lại | 150ms · ease-out / ease-in |
| Tab Bình luận ↔ Lịch sử (mobile) | đổi tab | `motion.crossfade` | `motion.crossfade` | 150ms · ease |

**Luật riêng của màn:**
- **Không stagger** cho danh sách bình luận và các mục lịch sử khi tải lần đầu — nhấp nháy dây chuyền trên danh sách dài gây phân tán (`07-design-system.md` §10.1).
- `motion.highlight-once` chỉ dùng cho **mục vừa được thêm hoặc vừa đổi**, chạy đúng một lần, không lặp.
- `prefers-reduced-motion: reduce` → mọi dịch chuyển và scale rút về fade thuần; `motion.highlight-once` tắt hẳn.

## 8. Ghi chú cho Designer

- **Accessibility:**
  - Badge trạng thái, badge ưu tiên và cảnh báo quá hạn **không được chỉ phân biệt bằng màu** — luôn kèm chữ hoặc biểu tượng (`R-S03-N05`).
  - Tương phản chữ/nền ≥ 4.5:1 ở mọi badge, kể cả badge "Đã huỷ" trên nền mờ.
  - Thứ tự Tab: liên kết quay lại → nút "Sửa thông tin" → các nút thanh hành động → ô nhập bình luận → nút "Gửi".
  - Thay đổi trạng thái phải được công bố qua vùng `aria-live` để trình đọc màn hình biết ("Công việc đã chuyển sang Đang làm").
  - Modal: bẫy focus bên trong, Esc để đóng, trả focus về nút đã mở nó.
  - Nút biểu tượng (nếu có) phải có nhãn văn bản thay thế.
- **Ưu tiên thị giác:** trạng thái > hành động kế tiếp > deadline > mọi thứ còn lại. Nếu phải hy sinh sự nổi bật của thứ gì trên màn hẹp, hy sinh khối thuộc tính phụ (tạo lúc / cập nhật lúc) trước.
- **Đừng** thiết kế nút xám disable cho hành động người dùng không có quyền — quy tắc của màn này là **ẩn hẳn** (`R-S03-07`).
- Bộ trường của modal "Sửa thông tin" phải trông **giống hệt** modal tạo việc ở S02 — người dùng đã học một lần thì không phải học lại.
