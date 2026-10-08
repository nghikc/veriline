# User story — Tổ chức

## US-S05-01: Tổ chức - Cập nhật tên và logo tổ chức

Là **Team Lead**, tôi muốn **sửa tên và logo tổ chức**, để **hệ thống hiển thị đúng nhận diện của đơn vị chúng tôi**.

- **Trace:** R-S05-01 … R-S05-06 / F11
- **Story point:** 3
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** tôi đăng nhập với vai trò Team Lead, **When** tôi mở màn Tổ chức, **Then** khối Thông tin tổ chức hiển thị đủ 5 mục: logo, tên, slug, ngày tạo, tổng số thành viên.
  - GWT-2: **Given** màn vừa tải xong và tôi chưa sửa gì, **When** tôi nhìn nút "Lưu thay đổi", **Then** nút ở trạng thái disable.
  - GWT-3: **Given** tôi đổi tên tổ chức từ "Acme" thành "Acme Việt Nam", **When** tôi nhấn "Lưu thay đổi", **Then** `PATCH /organizations/me` được gọi đúng một lần chỉ với trường `ten`, tên trên màn đổi theo, và toast "Đã cập nhật thông tin tổ chức" hiện ra.
  - GWT-4: **Given** màn Tổ chức đang mở, **When** tôi nhìn dòng slug, **Then** slug hiển thị dạng văn bản chỉ đọc kèm biểu tượng khoá và chú thích "không đổi được" — không có ô nhập nào cho slug.
  - GWT-5: **Given** tôi nhập đường dẫn logo bắt đầu bằng `http://`, **When** tôi rời khỏi ô nhập, **Then** lỗi "Đường dẫn logo phải bắt đầu bằng https://" hiện ra và nút Lưu disable.
  - GWT-6: **Given** tôi đã sửa tên tổ chức và mạng bị mất, **When** tôi nhấn "Lưu thay đổi", **Then** giá trị tôi đã nhập còn nguyên trong form kèm thông báo lỗi.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S05-02: Tổ chức - Xem và tra cứu danh sách thành viên

Là **Team Lead hoặc Org Admin**, tôi muốn **xem danh sách thành viên và tìm được người mình cần**, để **nắm được ai đang ở trong tổ chức và đang giữ vai trò gì**.

- **Trace:** R-S05-07 … R-S05-10, R-S05-N01 / F13
- **Story point:** 3
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** tổ chức Acme có 12 thành viên, **When** tôi mở màn Tổ chức, **Then** khối "Thành viên (12)" hiển thị mỗi dòng đủ 5 cột: họ tên, email, vai trò, trạng thái, ngày tham gia.
  - GWT-2: **Given** danh sách đang hiển thị đầy đủ, **When** tôi gõ `trần` vào ô tìm và ngừng gõ 300ms, **Then** danh sách chỉ còn thành viên có tên hoặc email chứa "trần", không phân biệt hoa thường, trang không reload.
  - GWT-3: **Given** danh sách đang hiển thị, **When** tôi chọn lọc Vai trò = "Thành viên" rồi chọn thêm Trạng thái = "Vô hiệu", **Then** danh sách chỉ còn người vừa là Thành viên vừa đang Vô hiệu (giao của hai điều kiện).
  - GWT-4: **Given** tôi gõ một từ khoá không khớp ai, **When** danh sách cập nhật, **Then** hiện "Không tìm thấy thành viên phù hợp" kèm nút "Xoá bộ lọc"; nhấn nút → danh sách đầy đủ trở lại.
  - GWT-5: **Given** tổ chức có 25 thành viên, **When** tôi mở màn Tổ chức, **Then** hiển thị đúng 20 dòng + nút "Tải thêm"; nhấn "Tải thêm" → hiện đủ 25 dòng.
  - GWT-6: **Given** tôi thuộc tổ chức Acme, **When** tôi xem danh sách thành viên, **Then** không có thành viên nào của tổ chức khác xuất hiện, kể cả khi kiểm tra thẳng response API.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S05-03: Tổ chức - Chỉ quản trị viên mới thao tác được lên thành viên

Là **Org Admin**, tôi muốn **chỉ mình tôi mời được người và đổi được vai trò**, để **Team Lead không vô tình thay đổi cơ cấu nhân sự của tổ chức**.

- **Trace:** R-S05-11, R-S05-N02, R-S05-N05 / F13; `BRule-S05-01`
- **Story point:** 3
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** tôi đăng nhập với vai trò **Team Lead**, **When** tôi mở màn Tổ chức, **Then** nút "+ Mời thành viên" và cột hành động `[⋮]` **không tồn tại trong DOM** — không phải chỉ bị làm mờ.
  - GWT-2: **Given** tình huống trên, **When** tôi nhìn khối Thông tin tổ chức, **Then** tôi **vẫn sửa được** tên và logo (F11 khác F13).
  - GWT-3: **Given** tôi có access token của một Team Lead, **When** tôi gọi thẳng `POST /organizations/me/members`, **Then** API trả `403` và không có tài khoản nào được tạo.
  - GWT-4: **Given** tôi đăng nhập với vai trò **Member**, **When** tôi mở thẳng URL `/organization`, **Then** tôi bị chặn ngay và danh sách thành viên không kịp render dù chỉ trong khoảnh khắc.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S05-04: Tổ chức - Mời thành viên mới vào tổ chức

Là **Org Admin**, tôi muốn **tạo tài khoản cho người mới và nhận mật khẩu tạm để chuyển cho họ**, để **họ vào làm được ngay mà không phải chờ tôi cấu hình gì thêm**.

- **Trace:** R-S05-12, R-S05-13, R-S05-14, R-S05-N03, R-S05-N04 / F13
- **Story point:** 5
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** tôi là Org Admin, **When** tôi nhấn "+ Mời thành viên", **Then** modal mở với 4 trường Email, Họ tên, Vai trò (mặc định "Thành viên"), Mật khẩu tạm.
  - GWT-2: **Given** modal đang mở, **When** tôi điền đủ thông tin hợp lệ và nhấn "Tạo tài khoản", **Then** API trả `201`, người mới xuất hiện trong danh sách và tổng số thành viên tăng 1.
  - GWT-3: **Given** tài khoản vừa tạo thành công, **When** hộp xác nhận hiện ra, **Then** mật khẩu tạm hiển thị kèm nút "Sao chép" và cảnh báo rằng nó sẽ không hiển thị lại.
  - GWT-4: **Given** tôi đã đóng hộp xác nhận, **When** tôi tìm cách xem lại mật khẩu tạm, **Then** không có đường nào trong giao diện lẫn API đọc lại được nó.
  - GWT-5: **Given** tôi nhập một email đã tồn tại trong hệ thống, **When** tôi nhấn "Tạo tài khoản", **Then** API trả `409`, lỗi "Email này đã được sử dụng." hiện dưới trường Email, và **ba trường còn lại giữ nguyên giá trị** — modal không đóng.
  - GWT-6: **Given** tôi nhập mật khẩu tạm 7 ký tự, **When** tôi rời khỏi ô nhập, **Then** lỗi "Mật khẩu tối thiểu 8 ký tự gồm chữ và số" hiện ra và nút "Tạo tài khoản" disable.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S05-05: Tổ chức - Đổi vai trò và vô hiệu hoá thành viên

Là **Org Admin**, tôi muốn **nâng/hạ vai trò và khoá tài khoản người đã nghỉ**, để **quyền truy cập luôn khớp với thực tế nhân sự**.

- **Trace:** R-S05-15, R-S05-16, R-S05-17, R-S05-18, R-S05-20 / F13
- **Story point:** 5
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** Trần B đang là Thành viên, **When** tôi đổi vai trò của Trần B thành "Quản lý nhóm", **Then** badge vai trò trên dòng đó đổi ngay và quyền mới có hiệu lực ở lời gọi API kế tiếp của Trần B — không cần Trần B đăng nhập lại.
  - GWT-2: **Given** Lê C đang hoạt động và có 4 công việc được giao, **When** tôi chọn "Vô hiệu hoá tài khoản", **Then** hộp xác nhận nêu ba hệ quả **kèm đúng con số 4 công việc** trước khi tôi bấm.
  - GWT-3: **Given** hộp xác nhận đang mở, **When** tôi xác nhận, **Then** badge trạng thái đổi thành "Vô hiệu", dòng của Lê C **vẫn còn** trong danh sách (không bị xoá), và Lê C bị đăng xuất khỏi mọi thiết bị.
  - GWT-4: **Given** Lê C vừa bị vô hiệu hoá, **When** tôi mở dropdown "Người thực hiện" ở màn S02 hoặc S03, **Then** Lê C không còn xuất hiện trong danh sách chọn.
  - GWT-5: **Given** Lê C vừa bị vô hiệu hoá và có 4 công việc đang giao, **When** tôi mở các công việc đó, **Then** người thực hiện **vẫn là Lê C** — hệ thống không tự chuyển cho ai khác.
  - GWT-6: **Given** Phạm D đang ở trạng thái Vô hiệu, **When** tôi mở menu hành động của Phạm D, **Then** menu **chỉ có** mục "Kích hoạt lại"; chọn nó → trạng thái về "Hoạt động" và Phạm D đăng nhập lại được bằng mật khẩu cũ.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

## US-S05-06: Tổ chức - Không bao giờ khoá chết tổ chức

Là **Org Admin**, tôi muốn **hệ thống chặn tôi lại khi tôi sắp gỡ bỏ quản trị viên cuối cùng**, để **tổ chức không rơi vào tình trạng không ai còn quyền quản trị**.

- **Trace:** R-S05-19 / F13; `BRule-S05-05`, `BRule-S05-12`
- **Story point:** 5
- **Tiêu chí chấp nhận (Given-When-Then):**
  - GWT-1: **Given** tôi là Org Admin **đang hoạt động duy nhất** của tổ chức, **When** tôi mở menu hành động của chính mình, **Then** cả "Đổi vai trò" lẫn "Vô hiệu hoá tài khoản" đều bị khoá, kèm câu giải thích hiện **ngay trong menu** — không phải bấm rồi mới báo lỗi.
  - GWT-2: **Given** tình huống trên, **When** tôi gọi thẳng `PATCH /organizations/me/members/<id của tôi>` để hạ vai trò, **Then** API trả `409` với thông báo "Không thể hạ vai trò quản trị viên duy nhất của tổ chức." và vai trò không đổi.
  - GWT-3: **Given** tổ chức có hai Org Admin nhưng một người đang ở trạng thái **Vô hiệu**, **When** tôi thử hạ vai trò Org Admin còn lại, **Then** thao tác vẫn bị chặn — người Vô hiệu **không được tính** là quản trị viên đang hoạt động.
  - GWT-4: **Given** tổ chức có hai Org Admin **đều đang hoạt động**, **When** tôi tự vô hiệu hoá tài khoản của mình, **Then** thao tác được chấp nhận và tôi bị đăng xuất ngay về `/login`.
  - GWT-5: **Given** hai Org Admin cùng lúc thử tự hạ vai trò ở hai phiên khác nhau, **When** cả hai gửi yêu cầu gần như đồng thời, **Then** đúng **một** người thành công và người kia nhận `409` — không bao giờ có chuyện cả hai cùng thành công.
- **INVEST:** [x] Independent [x] Negotiable [x] Valuable [x] Estimable [x] Small [x] Testable

---

## Tổng hợp

| Story | Trace R-S05 | Point | Use case liên quan |
|---|---|---|---|
| US-S05-01 Cập nhật tên và logo tổ chức | 01–06 | 3 | UC-S05-01 |
| US-S05-02 Xem và tra cứu danh sách thành viên | 07–10, N01 | 3 | UC-S05-02 |
| US-S05-03 Chỉ quản trị viên mới thao tác được | 11, N02, N05 | 3 | UC-S05-02, UC-S05-03 |
| US-S05-04 Mời thành viên mới vào tổ chức | 12, 13, 14, N03, N04 | 5 | UC-S05-03, UC-S05-04 |
| US-S05-05 Đổi vai trò và vô hiệu hoá thành viên | 15, 16, 17, 18, 20 | 5 | UC-S05-05, UC-S05-06, UC-S05-08, UC-S05-09 |
| US-S05-06 Không bao giờ khoá chết tổ chức | 19 | 5 | UC-S05-07 |
| **Tổng** | | **24** | |

> `US-S05-06` tuy chỉ trace đúng một yêu cầu (`R-S05-19`) nhưng vẫn được **5 điểm** vì luật này phải cài ở **hai tầng độc lập** (giao diện + máy chủ) và phải an toàn với thao tác đồng thời (GWT-5) — chi phí nằm ở độ khó, không ở số lượng yêu cầu.
> Các yêu cầu phi chức năng `R-S05-N06`, `R-S05-N07` được kiểm qua test case chuyên biệt trong `test.md`, không tách story riêng.
