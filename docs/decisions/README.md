# Quyết định thiết kế lõi

Trang này giải thích **vì sao** Veriline được thiết kế như hiện tại, để người đóng góp sửa đúng chỗ mà không phá thứ đã có lý do tồn tại. `.claude/CLAUDE.md` nói *quy ước là gì*; trang này nói *vì sao*. Một quyết định đổi thì thêm mục mới ở cuối và ghi rõ nó thay mục nào, không viết lại lịch sử.

## 1. Skill là prompt, script là phép đếm

Mỗi skill là một `SKILL.md` (prompt cho agent) kèm `scripts/`, `references/`, `assets/`. Phần **phán đoán** (đọc nghiệp vụ, viết đặc tả, chọn phương án) để cho agent và người. Phần **đo được** (mã ID có nối không, bảng có lệch cột không, test có chạy không) giao cho script Node không phụ thuộc thư viện ngoài.

- **Vì sao:** agent tự báo "đã đủ" là thứ dễ sai nhất. Script đếm thì không nịnh.
- **Cái giá:** script chỉ thấy cái khớp mẫu. Mỗi script khai giới hạn của nó (`gioiHan`) và không tự xưng là bằng chứng "đúng".

## 2. Một nguồn sự thật cho quy ước

`conventions.md` (và các phần `conv-*.md`) là nơi duy nhất định nghĩa quy ước. Khối `registry` trong `conv-registry.md` là bản máy đọc; `lint.js` so mọi skill với nó.

- **Vì sao:** quy ước chép tay vào nhiều skill sẽ trôi mỗi nơi một kiểu. Lint bắt độ trôi ngay khi sửa.
- **Cái giá:** thêm một quy ước tốn nhiều bước hơn (khoá registry, check lint, ca test đối kháng, một dòng trong `CLAUDE.md`). Chủ ý: quy ước rẻ thì sinh sôi.

## 3. Chuỗi truy vết cố định

`BR → StR → FR/NFR → F → S → R-S → UC/US → TC`. Mọi skill sinh mã đều theo chuỗi này; `ba-trace` và `ba-review` đếm chỗ đứt.

- **Vì sao:** hồ sơ giao khách phải trả lời được "yêu cầu này được test ở đâu" và "test này kiểm yêu cầu nào". Không có chuỗi cố định thì câu trả lời là đoán.
- **Cái giá:** dự án nhỏ thấy nặng. Hồ sơ `lite`/`mini` bớt tài liệu nhưng giữ chuỗi.

## 4. Cổng phương án trước khi ghi

Skill sửa nhiều file phải đọc hết nguồn, trình phương án (đã đọc gì, hiểu gì, sẽ làm gì, giả định, câu hỏi chặn) và chờ duyệt rồi mới ghi.

- **Vì sao:** sửa loạt tài liệu theo một hiểu lầm thì dọn tốn hơn nhiều so với hỏi trước một câu.
- **Cái giá:** thêm một lượt chờ. Việc nhỏ (≤ 2 file) vẫn in phương án nhưng không chờ.

## 5. "Xong" nghĩa là đã kiểm chứng độc lập

Một màn chỉ được đánh "xong" khi một agent kiểm chứng **mới** (không phải agent viết code) chạy lại từng bằng chứng trong `plan.md`, đối chiếu từng vế của test case, và gieo lỗi vào code (`mutate.js`) để xem test có bắt không. `accept.js` chỉ nhận khi mọi điều kiện máy đọc được đều qua.

- **Vì sao:** lời than lớn nhất về agent lập trình là báo PASS trong khi code làm sai đặc tả. Người viết code tự chấm thì luôn thấy mình đúng; test chỉ "xanh" mà không bắt được lỗi gieo thì chưa chứng minh gì.
- **Cái giá:** mỗi màn tốn thêm một lượt agent và thời gian chạy test. Đây là phần không được cắt.

## 6. Mỗi checker có ca đối kháng

`test.js` nạp cho mỗi checker một fixture cố tình hỏng và đòi nó phải báo. Checker mới còn phải im trên `example/docs`.

- **Vì sao:** một checker hỏng thành "luôn exit 0" vẫn làm CI xanh, và mọi cổng dựa vào nó mù mà không ai biết. Ca đối kháng là thứ duy nhất phân biệt "sạch" với "không nhìn".
- **Cái giá:** viết checker tốn gấp đôi (checker + fixture hỏng). Báo sai trên dự án thật vẫn có thể xảy ra vì `example/` theo đúng chuẩn còn dự án thật thì không; khi đó sửa checker và thêm ca, không lách.

## 7. Hook đo, skill phán

Luật đo được thì đặt ở hook và script (chặn đọc file bí mật, nhắc cập nhật ma trận theo dõi, cảnh báo sửa tài liệu đã chốt mà chưa có change request). Luật cần phán đoán thì đặt trong skill. Chỉ có một chặn cứng: đọc bí mật.

- **Vì sao:** bí mật đã lọt vào ngữ cảnh thì không rút lại được; mọi thứ khác sửa sau được nên chỉ cảnh báo.
- **Cái giá:** cảnh báo có thể bị bỏ qua. Bù lại, cổng nghiệm thu đọc lại cùng các luật đó bằng máy.

## 8. Tài liệu tiếng Việt, sơ đồ có dấu

Tài liệu sinh ra viết tiếng Việt; nhãn sơ đồ Mermaid có dấu đầy đủ, chỉ ID node để ASCII. Luồng nhiều vai trò dùng `swimlane-beta`, không dùng `flowchart`.

- **Vì sao:** người đọc là khách hàng và người dùng nghiệp vụ. Bỏ dấu "cho an toàn" làm sơ đồ khó đọc mà không sửa được lỗi nào (sơ đồ vỡ vì ký tự đặc biệt, không vì dấu). `flowchart` giấu mất ai làm bước nào.
- **Cái giá:** cần Mermaid ≥ 11.16 cho `swimlane-beta`; bản đi kèm portal đã đủ mới.

## 9. Lõi mở, gói tuỳ chọn có thể vắng

Repo này là lõi (MIT). Một số skill thuộc gói khác (khai trong registry `skills.pro`/`skills.devonly`) không có mặt ở đây. File lõi không được gọi cứng tới chúng (lint check 44); `test.js --public` bỏ qua đúng danh sách ca phụ thuộc gói đó.

- **Vì sao:** một registry cho mọi bản phát hành, không có bước nào sinh ra quy ước lệch nhau; thiếu skill tuỳ chọn là hợp lệ, xoá nhầm skill lõi vẫn đỏ.
- **Cái giá:** registry và một số mô tả vẫn nhắc tên skill không có trong repo này.

## 10. Phản hồi ẩn danh từ dự án dùng thật

`report.js` chạy trong dự án tiêu dùng, ghi số đếm, mã ID, tên skill và các file của bộ skill đã bị sửa tại chỗ. Không tên dự án, không nội dung tài liệu.

- **Vì sao:** một file mà nhiều dự án cùng phải tự sửa nghĩa là mặc định sai. Đó là tín hiệu mạnh hơn mọi suy đoán từ bên trong repo.
- **Cái giá:** người dùng phải tự gửi file; không có thu thập tự động, và đó là chủ ý.

## 11. Thông báo viết cho người dùng, không cho người bảo trì

Chuỗi mà script lõi và hook in ra dùng chữ người dùng hiểu: "bộ kiểm báo sai" chứ không "checker oan", "bị trả lại" chứ không "TRẢ", "bản đã chốt" chứ không "baseline". Nhắc của hook mở bằng việc cần làm (`[Veriline · tracking chưa cập nhật]`), mã luật để cuối dòng trong ngoặc; lỗi nào cũng kèm một dòng `Sửa: <lệnh>`. Chữ "cổng" được giữ và giải nghĩa trong `explain/README.md` → "Thuật ngữ bạn sẽ gặp". Lint 45 (`lang.internal.terms`) chặn từ lóng quay lại.

- **Vì sao:** người dùng đầu tiên đọc thông báo trước khi đọc tài liệu. Từ lóng chỉ cần lọt một lần là lan khắp nơi, vì thông báo mới hay được chép từ thông báo cũ.
- **Cái giá:** lint chỉ thấy chuỗi viết thẳng trong lời gọi in; câu dựng sẵn ở biến rồi mới in, và lời trong `SKILL.md`, vẫn cần người soát.
