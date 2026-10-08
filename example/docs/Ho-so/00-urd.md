# TeamTasks — Tài liệu Yêu cầu Người dùng (URD)

> **URD (User Requirements Document)** — mô tả **người dùng cần gì** và **kết quả nào có giá trị với họ**, chưa nói hệ thống làm thế nào. "Hệ thống phải làm gì" nằm ở `docs/01-requirements.md`.
> Ngày lập: 2026-08-03 · Người lập: Nhóm BA/PM (SH-06) · Phạm vi: cả dự án · Trạng thái: Đề xuất

> ⚠️ **Thứ tự chạy trong dự án mẫu này:** URD được lập **sau** `01-requirements.md` (bổ sung ngược để hoàn thiện bộ tài liệu discovery, giống `00-personas.md`). Vì vậy mục "Truy vết xuống bước sau" **đối chiếu với `FR` đã có**; nhu cầu chưa được yêu cầu nào phủ được ghi rõ là **hở phạm vi** kèm đề xuất mở `CR`/`WI` — URD **không** tự sửa `01-requirements.md`. Dự án mới nên chạy skill này **trước** `ba-requirements`.

> **Nguồn:** `00-brainstorm.md` (mục 1, 2, 4.2, 5, 7) · `00-personas.md` (`PS-01`–`PS-03`, hành trình, ứng viên `U-01`–`U-10`) · `00-vision.md` (§1 vấn đề, §2 `BO-01`–`BO-06`, §4 phạm vi) · `04-stakeholders.md` (`SH-01`, `SH-03`, `SH-05`) · `00-cr.md` (`CR-01`) · `meetings/` (`DEC-04`). **Chưa có phỏng vấn/khảo sát người dùng thật** → mức bằng chứng cao nhất trong tài liệu này là *Quan sát*; xem Mục 8.

---

## 1. Mục đích

Các nhóm 10–200 người đang theo dõi công việc bằng chat và bảng tính. Ở quy mô đó, người làm không biết chắc hôm nay mình phải làm gì trước, người quản lý không biết nhóm đang tắc ở đâu nếu không đi hỏi từng người, và người quản trị không kiểm soát được ai còn quyền xem dữ liệu nội bộ.

Tài liệu này mô tả **nhu cầu của ba nhóm người dùng đó** — họ đang khổ ở đâu, cần đạt được gì, và nhìn vào đâu để biết là đã đạt. Tài liệu **không** mô tả màn hình, thao tác hay công nghệ: nếu đổi hoàn toàn cách hiện thực mà một dòng ở đây vẫn đúng, thì đó là nhu cầu.

### Vấn đề & trải nghiệm hiện tại

| Người dùng | Tình huống hiện tại | Vấn đề | Hậu quả với họ | Bằng chứng |
|-----------|--------------------|--------|----------------|-----------|
| Thành viên (Member) | Việc được giao rải rác trong nhiều nhóm chat, tự ghi nhớ deadline | Không biết việc nào tới hạn trước; việc trôi mất giữa các kênh | Làm sai thứ tự ưu tiên, trễ hạn, bị hỏi lại nhiều lần | Quan sát: `00-personas.md` `PS-01`; `00-vision.md` §1 |
| Thành viên (Member) | Đã cập nhật tiến độ trong chat nhưng quản lý không thấy | Cập nhật không tới được người cần biết | Phải giải trình lại bằng lời, mất niềm tin vào việc "báo cáo" | Quan sát: `00-personas.md` hành trình `PS-01`, điểm cảm xúc thấp |
| Quản lý nhóm (Team Lead) | Chat hỏi từng người để biết tiến độ; bảng tính không ai buồn sửa | Chỉ biết việc trễ khi đã trễ | Mất một buổi mỗi tuần chỉ để hỏi tiến độ; họp cập nhật định kỳ | Quan sát: `00-personas.md` `PS-02`; `00-vision.md` §1 (pain "thiếu minh bạch") |
| Quản lý nhóm (Team Lead) | Chép tay tình hình nhóm sang tài liệu báo cáo | Không lấy được bản tổng hợp từ chỗ dữ liệu đang nằm | Tốn thời gian lặp lại, số liệu báo cáo lệch thực tế | Quan sát: `00-personas.md` `PS-02` (`U-01`); kỳ vọng `SH-05` |
| Quản trị viên tổ chức (Org Admin) | Bảng tính ai cũng sửa được; người nghỉ vẫn còn quyền | Không kiểm soát được ai đang xem dữ liệu nội bộ | Rủi ro lộ thông tin nội bộ, không trả lời được "ai đã xem gì" | Quan sát: `00-personas.md` `PS-03`; `00-vision.md` §1 (pain "không có phân quyền") |

## 2. Nhóm người dùng

| Mức | Nhóm người dùng | Bối cảnh sử dụng | Mục tiêu chính | Nỗi đau |
|-----|-----------------|------------------|----------------|---------|
| chính | Thành viên — Member (`PS-01`) | Máy tính, mở nhiều lần trong ngày, xen kẽ chat và hộp thư; nhóm ~15 người | Biết hôm nay làm gì, làm xong báo được ngay, không bị hỏi lại | Việc trôi trong chat; không nhớ hạn; phải lục lại lịch sử tin nhắn |
| chính | Quản lý nhóm — Team Lead (`PS-02`) | Máy tính, vài lần mỗi ngày, hay xem trước cuộc họp; phụ trách 12–20 người | Giao việc rõ chủ rõ hạn, nhìn một lần biết nhóm tắc ở đâu | Phải hỏi từng người; đến hạn mới biết việc chưa ai làm; báo cáo chép tay |
| phụ *(nhưng là người khởi tạo)* | Quản trị viên tổ chức — Org Admin (`PS-03`) | Máy tính, dùng thưa — lúc lập tổ chức và khi có biến động nhân sự | Dựng tổ chức xong trong một buổi, kiểm soát ai vào được, dữ liệu không lọt ra ngoài | Thao tác lặp khi đưa nhiều người vào; người nghỉ vẫn còn quyền |

> Ba nhóm bám đúng ba persona của `00-personas.md`, không dựng lại chân dung ở đây. Các biến thể khác (vd Team Lead kiêm Member) chỉ là tổ hợp quyền — cùng nhu cầu, không tách nhóm mới.

## 3. Ranh giới phạm vi

### Trong phạm vi

- Người dùng vào được hệ thống bằng danh tính riêng của mình, và người ngoài tổ chức không vào được.
- Người mới lập được tổ chức của mình và đưa đồng nghiệp vào.
- Giao việc có người chịu trách nhiệm và có hạn hoàn thành rõ ràng.
- Người thực hiện theo dõi và cập nhật được tiến độ việc của mình cho tới lúc được xác nhận hoàn tất.
- Người quản lý nắm được tình hình cả nhóm mà không phải đi hỏi từng người.
- Người dùng được nhắc trước khi việc tới hạn.
- Trao đổi quanh một công việc lưu lại được, không nằm ngoài hệ thống.
- Người quản trị thu hồi được quyền truy cập khi có biến động nhân sự.
- Dữ liệu của mỗi tổ chức không lẫn sang tổ chức khác.
- Người quản lý lấy được bản tổng hợp tình hình để đưa cho cấp trên.

### Ngoài phạm vi

- **Vào hệ thống bằng danh tính của nhà cung cấp khác** (tài khoản công ty sẵn có) — *hoãn giai đoạn 2 (`OQ-01` chưa chốt; `00-vision.md` §4 Out-of-scope)*.
- **Tự khôi phục quyền truy cập khi quên cách vào** — *giai đoạn 1 nhờ người quản trị hỗ trợ (`OQ-02`); xem `UN-17` và `OQ-02` ở Mục 10*.
- **Dùng trên điện thoại như kênh chính** — *giai đoạn 1 chỉ nhắm máy tính; xem `GĐ-02`*.
- **Nhiều người cùng chịu trách nhiệm một công việc** — *giai đoạn 1 mỗi việc một người chịu trách nhiệm chính (`OQ-04`)*.
- **Thấy thay đổi của người khác ngay tức thì** — *giai đoạn 1 chấp nhận độ trễ ngắn, người dùng không cần cảm nhận được sự khác biệt*.
- **Khôi phục nội dung đang soạn dở khi mất kết nối** — *chấp nhận mất, nội dung nhập thường ngắn (`00-brainstorm.md` mục 7)*.
- **Chia sẻ công việc ra ngoài tổ chức** — *mọi người dùng đều thuộc một tổ chức; xem `GĐ-05` của `00-personas.md`*.

## 4. Nhu cầu người dùng

| Mã | Người dùng | Bối cảnh / Kích hoạt | Nhu cầu | Kết quả mong đợi | Mức quan trọng | Bằng chứng |
|----|-----------|----------------------|---------|------------------|----------------|-----------|
| UN-01 | Thành viên | Đầu ngày làm việc, có nhiều việc đang mở | Biết ngay việc nào của mình và việc nào tới hạn trước | Người dùng nói được thứ tự việc cần làm hôm nay mà không hỏi ai | Critical | Quan sát: `PS-01` mục tiêu + câu nói; `00-vision.md` §1 |
| UN-02 | Thành viên | Vừa làm xong hoặc vừa bắt đầu một việc | Báo tiến độ một lần, người liên quan thấy được ngay | Người giao việc thấy trạng thái mới mà không cần người thực hiện nhắn thêm | Critical | Quan sát: `PS-01` hành trình, điểm cảm xúc thấp *"vừa mới cập nhật mà"* |
| UN-03 | Thành viên | Việc sắp tới hạn | Được nhắc **trước** khi trễ, đủ sớm để còn xoay xở | Người dùng nhận nhắc khi vẫn còn thời gian xử lý, không phải lúc đã sát nút | High | Đã xác nhận: `DEC-04` (họp 2026-07-21) mở rộng nhắc T-1; nguồn gốc `U-03` |
| UN-04 | Thành viên | Đã gửi việc đi chờ xác nhận | Biết việc mình gửi đang được xử lý tới đâu | Người gửi biết việc đang chờ ai và chờ bao lâu, không rơi vào im lặng | Medium | Quan sát: `PS-01` hành trình, điểm cảm xúc thấp *"không biết sếp xem chưa"* (`U-07`) |
| UN-05 | Thành viên | Nhiều việc thay đổi trong ngày | Được báo điều thật sự cần biết, không bị làm phiền liên tục | Người dùng vẫn nắm việc quan trọng mà không thấy phiền tới mức bỏ qua thông báo | Medium | Đã xác nhận: `StR-04` + kỳ vọng `SH-03` *"kịp thời nhưng không làm phiền"* (`U-02`) |
| UN-06 | Quản lý nhóm | Đầu tuần hoặc khi phát sinh việc mới | Giao được việc mà không để sót người chịu trách nhiệm và hạn hoàn thành | Mọi việc vừa giao đều có đúng một người chịu trách nhiệm và một hạn cụ thể | Critical | Quan sát: `PS-02` nhu cầu; `00-vision.md` `BO-02` |
| UN-07 | Quản lý nhóm | Giữa tuần, trước cuộc họp | Nhìn một lần biết nhóm đang tắc ở đâu, không phải hỏi từng người | Người quản lý trả lời được "việc nào đang chậm, ai đang quá tải" mà không nhắn cho ai | Critical | Quan sát: `PS-02` câu nói *"mỗi tuần mất một buổi chỉ để hỏi"*; `BO-04` |
| UN-08 | Quản lý nhóm | Có việc của nhóm sắp/đã quá hạn | Được báo sớm thay vì tự phát hiện khi vào xem | Người quản lý biết việc trễ ngay khi nó xảy ra, không phải rà tay | High | Quan sát: `PS-02` hành trình *"sao giờ tôi mới biết"* (`U-05`) |
| UN-09 | Quản lý nhóm | Thành viên báo đã xong một việc | Xác nhận đạt, hoặc trả lại kèm lý do rõ ràng | Người thực hiện biết chính xác việc được chấp nhận hay cần sửa gì | High | Đã xác nhận: `00-brainstorm.md` §4.2 (từ chối phải có ghi chú lý do) |
| UN-10 | Quản lý nhóm | Định kỳ phải báo tình hình cho cấp trên | Lấy được bản tổng hợp từ chính chỗ dữ liệu đang nằm, không chép tay | Người quản lý đưa được tình hình nhóm cho cấp trên trong vài phút, số liệu khớp thực tế | High | Đã xác nhận: kỳ vọng `SH-05`; `CR-01` đã duyệt (`U-01`) |
| UN-11 | Quản trị viên tổ chức | Lần đầu đưa tổ chức lên hệ thống | Lập được tổ chức và mở quyền cho nhóm trong một buổi | Sau một buổi, các thành viên đã vào được và bắt đầu dùng | High | Quan sát: `PS-03` mục tiêu |
| UN-12 | Quản trị viên tổ chức | Có người nghỉ việc hoặc đổi vai trò | Thu hồi/điều chỉnh quyền truy cập ngay trong ngày | Người đã nghỉ không còn xem được dữ liệu tổ chức kể từ lúc bị thu hồi | High | Đã xác nhận: `PS-03` câu nói *"chiều nay phải hết quyền vào"*; `BR-03` |
| UN-13 | Cả ba nhóm | Nhiều tổ chức cùng dùng chung một hệ thống | Yên tâm dữ liệu tổ chức mình không ai ngoài tổ chức thấy được | Không có trường hợp người của tổ chức này nhìn thấy dữ liệu tổ chức khác | Critical | Đã xác nhận: `BR-03`; `BO-03` (0 sự cố trong 6 tháng đầu) |
| UN-14 | Quản trị viên tổ chức | Tổ chức đông (tới 200 người) cần lên hệ thống | Đưa nhiều người vào cùng lúc thay vì từng người một | Đưa được cả danh sách nhân sự vào mà thời gian không tăng theo số người | Medium | Quan sát: `PS-03` hành trình (thao tác lặp, `U-06`); quy mô ở `00-vision.md` §1 |
| UN-15 | Quản trị viên tổ chức | Có nghi vấn về truy cập hoặc thay đổi dữ liệu | Trả lời được "ai đã xem/sửa gì, lúc nào" | Người quản trị dẫn ra được dấu vết cụ thể khi cần giải trình | Medium | Quan sát: kỳ vọng kiểm soát của `SH-01` (`U-08`) |
| UN-16 | Cả ba nhóm | Mỗi lần bắt đầu phiên làm việc | Vào được hệ thống bằng danh tính riêng, người ngoài không vào được | Người dùng vào được bình thường; người không có quyền bị chặn và biết vì sao | Critical | Đã xác nhận: `00-brainstorm.md` mục 2 (gating) + §4.1 |
| UN-17 | Cả ba nhóm | Quên mất cách vào hệ thống | Lấy lại được quyền truy cập mà không mất việc đang theo dõi | Người dùng quay lại làm việc được trong thời gian chấp nhận được, giữ nguyên dữ liệu | Medium | Quan sát: rủi ro *"thiếu Quên mật khẩu gây ma sát"* — `00-vision.md` §6; `OQ-02` |
| UN-18 | Quản lý nhóm | Giao nhiều việc tương tự trong cùng một đợt | Giao cả loạt mà công sức không tăng theo số việc | Giao 10 việc tương tự không tốn gấp 10 lần công so với giao 1 việc | Low | Quan sát: `PS-02` hành trình *"lặp đi lặp lại"* (`U-09`) |

*Mã cấp theo thứ tự phát hiện và **không đánh lại số** — nhu cầu tách ra hoặc bổ sung sau luôn lấy số kế tiếp (vì vậy `UN-18` là nhu cầu của Quản lý nhóm, tách khỏi `UN-06` ở vòng rà soát).*

*Mức quan trọng: **Critical** (không có thì người dùng không hoàn tất được việc chính) · **High** (rào cản lớn) · **Medium** (đáng kể) · **Low** (nice-to-have).*

## 5. Hành trình ưu tiên

Năm hành trình then chốt — không liệt kê mọi luồng. Góc nhìn người dùng, không mô tả thao tác trên màn hình.

### Vòng đời một công việc, nhìn từ hai phía

```mermaid
swimlane-beta TD
  subgraph QL[Người giao việc]
    A([Có việc cần làm]):::startend --> B[Giao việc cho một người, đặt hạn]:::task
    E{"Đã đạt yêu cầu?"}:::decision
    G[Xác nhận hoàn tất]:::task --> H([Kết thúc]):::startend
  end
  subgraph TH[Người thực hiện]
    C[Biết mình được giao gì, hạn khi nào]:::task --> D[Làm và báo tiến độ]:::task
    F[Biết cần sửa gì và làm lại]:::task
  end
  B --> C
  D --> E
  E -->|Chưa| F --> D
  E -->|Rồi| G
  classDef task fill:#e6fffb,stroke:#13a89e,stroke-width:1.5px,color:#134e4a
  classDef decision fill:#fff3e6,stroke:#e8820c,stroke-width:1.5px,color:#7a4a00
  classDef startend fill:#13897e,stroke:#0c6b62,color:#ffffff
```

*Sơ đồ mô tả **nhu cầu hai phía trong một vòng việc** (ai cần biết gì ở bước nào), không phải luồng hệ thống — luồng nghiệp vụ có hệ thống tham gia nằm ở `01-requirements.md` §4.1.*

### Hành trình 1: Thành viên hoàn tất việc trong ngày mà không bị hỏi lại

- **Người dùng:** Thành viên (`PS-01`)
- **Mức quan trọng:** Critical
- **Kích hoạt:** Bắt đầu ngày làm việc, hoặc vừa được giao một việc mới
- **Kết quả mong đợi:** Việc được làm đúng thứ tự ưu tiên và người liên quan biết tiến độ mà không cần hỏi
- **Nhu cầu liên quan:** UN-01, UN-02, UN-04, UN-16

1. Người dùng vào hệ thống bằng danh tính của mình.
2. Nhìn thấy việc của riêng mình, biết ngay việc nào tới hạn trước.
3. Chọn một việc, nắm được yêu cầu và hạn hoàn thành.
4. Bắt đầu làm và cho biết mình đang làm việc đó.
5. Làm xong thì báo là đã xong, và biết việc đang chờ ai xác nhận.

**Kiểm chứng độc lập:** Đưa cho một thành viên chưa quen hệ thống danh sách việc của họ — trong vòng một phút họ nói được việc nào phải làm trước và vì sao. Sau khi họ báo xong một việc, hỏi người giao việc "việc đó tới đâu rồi" — người giao trả lời đúng mà không cần liên hệ lại người thực hiện.

### Hành trình 2: Quản lý nhóm nắm tiến độ tuần mà không phải đi hỏi

- **Người dùng:** Quản lý nhóm (`PS-02`)
- **Mức quan trọng:** Critical
- **Kích hoạt:** Giữa tuần, hoặc ngay trước một cuộc họp nhóm
- **Kết quả mong đợi:** Trả lời được nhóm đang tắc ở đâu, không nhắn hỏi ai
- **Nhu cầu liên quan:** UN-06, UN-07, UN-08, UN-09

1. Người quản lý giao việc cho từng người, mỗi việc có chủ và có hạn.
2. Giữa tuần, xem lại toàn cảnh: việc nào đang chậm, ai đang quá tải.
3. Thấy ngay việc đã hoặc sắp quá hạn mà không phải rà từng dòng.
4. Với việc thành viên báo đã xong: xác nhận đạt, hoặc trả lại kèm lý do cụ thể.

**Kiểm chứng độc lập:** Hỏi người quản lý "hiện nhóm có bao nhiêu việc trễ hạn và của ai" — họ trả lời đúng trong vòng một phút mà không liên hệ với thành viên nào. Đối chiếu câu trả lời với thực tế công việc của nhóm: khớp.

### Hành trình 3: Quản lý nhóm báo tình hình cho cấp trên

- **Người dùng:** Quản lý nhóm (`PS-02`)
- **Mức quan trọng:** High
- **Kích hoạt:** Đến kỳ báo cáo, hoặc cấp trên hỏi đột xuất
- **Kết quả mong đợi:** Có bản tổng hợp đưa được ngay, số liệu khớp thực tế, không chép tay
- **Nhu cầu liên quan:** UN-10, UN-07

1. Người quản lý chọn phạm vi cần báo cáo (nhóm nào, khoảng thời gian nào).
2. Lấy bản tổng hợp tình hình theo phạm vi đó.
3. Gửi cho cấp trên ở dạng người nhận mở được mà không cần vào hệ thống.

**Kiểm chứng độc lập:** Yêu cầu người quản lý cung cấp tình hình nhóm trong tuần — họ đưa được bản tổng hợp trong vài phút, và người nhận (không có quyền vào hệ thống) đọc hiểu được mà không cần giải thích thêm.

### Hành trình 4: Quản trị viên đưa tổ chức lên hệ thống

- **Người dùng:** Quản trị viên tổ chức (`PS-03`)
- **Mức quan trọng:** High
- **Kích hoạt:** Tổ chức quyết định bắt đầu dùng hệ thống
- **Kết quả mong đợi:** Sau một buổi, nhóm đã vào được và bắt đầu làm việc
- **Nhu cầu liên quan:** UN-11, UN-14, UN-16, UN-13

1. Người quản trị lập tổ chức của mình.
2. Đưa danh sách đồng nghiệp vào tổ chức, phân vai trò cho từng người.
3. Thông báo cho nhóm và xác nhận mọi người vào được.

**Kiểm chứng độc lập:** Cho một người quản trị chưa từng dùng hệ thống dựng một tổ chức 20 người — trong một buổi làm việc, cả 20 người vào được và thấy đúng phạm vi dữ liệu của tổ chức mình.

### Hành trình 5: Quản trị viên thu hồi quyền khi có biến động nhân sự

- **Người dùng:** Quản trị viên tổ chức (`PS-03`)
- **Mức quan trọng:** High
- **Kích hoạt:** Có người nghỉ việc hoặc chuyển bộ phận
- **Kết quả mong đợi:** Người đó không còn xem được dữ liệu tổ chức, việc đang mở của họ không rơi vào khoảng trống
- **Nhu cầu liên quan:** UN-12, UN-13, UN-15

1. Người quản trị thu hồi quyền của người nghỉ.
2. Xử lý các việc đang mở mà người đó chịu trách nhiệm.
3. Khi cần giải trình, dẫn ra được ai đã truy cập/thay đổi gì trước đó.

**Kiểm chứng độc lập:** Sau khi thu hồi, người đã nghỉ thử vào lại — bị chặn. Người quản lý kiểm tra: không có việc nào của người đó bị bỏ lửng không ai theo dõi.

## 6. Ngoại lệ & tình huống biên

Mỗi ngoại lệ mang mã `UE-..` (cấp theo thứ tự, không đánh lại số — như `UN`). URD **không** trỏ xuống màn hình: chính đặc tả màn **trích ngược** `UE-..` ở dòng xử lý nó (cột Trace của `E-S..`, cột Nguồn của `R-S..`). Cột cuối chỉ điền khi **chưa màn nào xử lý** — ghi `n/a — lý do` hoặc câu hỏi mở `OQ-..`; `ba-trace` coi đó là mồ côi hợp lệ.

| Mã | Tình huống | Ảnh hưởng tới người dùng | Kết quả người dùng cần thấy | Mức | Hành trình / Nhu cầu | Chưa màn nào xử lý (lý do / OQ) |
|----|-----------|--------------------------|-----------------------------|-----|----------------------|--------------------------------|
| UE-01 | Nhập sai thông tin đăng nhập nhiều lần liên tiếp | Không vào được, và bị chặn tạm | Biết còn bao nhiêu lần thử; khi bị chặn thì biết rõ chờ bao lâu mới thử lại được | High | Hành trình 1 / UN-16 | — |
| UE-02 | Bị chặn kéo dài, không tự mở lại được | Không làm việc được cho tới khi có người hỗ trợ | Biết phải liên hệ ai để được mở lại | High | Hành trình 1 / UN-16, UN-17 | — |
| UE-03 | Quên mất cách vào hệ thống | Kẹt hoàn toàn ở cửa vào | Biết cách lấy lại quyền truy cập và mất khoảng bao lâu | Medium | Hành trình 1 / UN-17 | n/a — tự khôi phục đã chốt ngoài phạm vi giai đoạn 1 (Mục 3), người quản trị hỗ trợ thủ công; rà lại khi chốt `OQ-02` |
| UE-04 | Phiên làm việc kết thúc giữa chừng | Đang làm dở thì bị đưa về cửa vào | Được cho biết vì sao, vào lại được ngay và không mất việc đã lưu | High | Hành trình 1 / UN-16 | — |
| UE-05 | Mất kết nối khi đang nhập nội dung | Nội dung vừa nhập có nguy cơ mất | Biết là chưa lưu được và thử lại được ngay, không mất phần đã gõ | High | Hành trình 1, 2 / UN-02 | — |
| UE-06 | Hai người cùng sửa một công việc | Thay đổi của người này đè lên người kia | Nhìn được ai vừa thay đổi gì và lúc nào, để tự nhận ra xung đột | Medium | Hành trình 2 / UN-02, UN-15 | — |
| UE-07 | Việc gửi đi chờ xác nhận nhưng bị treo lâu | Người gửi không biết chờ tới bao giờ | Thấy việc đang chờ ai; người có trách nhiệm được nhắc | Medium | Hành trình 1, 2 / UN-04, UN-09 | — *(màn chỉ đáp ứng vế "thấy việc đang chờ ai"; vế "được nhắc" nằm ở `08-roadmap.md` Later — `U-07`)* |
| UE-08 | Việc bị trả lại nhưng không rõ vì sao | Làm lại sai hướng, mất thêm một vòng | Biết chính xác cần sửa gì | High | Hành trình 2 / UN-09 | — |
| UE-09 | Người chịu trách nhiệm nghỉ, việc còn đang mở | Việc không ai theo dõi | Người quản lý thấy được các việc "mất chủ" và chuyển cho người khác | High | Hành trình 5 / UN-12, UN-07 | — |
| UE-10 | Tổ chức ngừng sử dụng khi còn việc đang mở | Nguy cơ mất dữ liệu đã tích luỹ | Được cảnh báo trước và dữ liệu không biến mất không dấu vết | Medium | Hành trình 5 / UN-13, UN-15 | `OQ-06` — chưa có quyết định về vòng đời dữ liệu khi tổ chức ngừng dùng |
| UE-11 | Không nhận được nhắc hạn (kênh nhắc không tới nơi) | Trễ hạn dù hệ thống "đã nhắc" | Vẫn thấy được việc sắp tới hạn khi vào hệ thống, không phụ thuộc một kênh duy nhất | High | Hành trình 1 / UN-01, UN-03 | — |
| UE-12 | Nhận quá nhiều thông báo trong ngày | Bỏ qua tất cả, kể cả cái quan trọng | Chỉ bị làm phiền bởi việc thật sự cần biết | Medium | Hành trình 1 / UN-05 | `OQ-03` — chưa có ngưỡng "bao nhiêu là làm phiền" |

*Mức: cùng thang với Mục 4. `UE` **Critical/High** mà không màn nào trích và cột cuối trống → `ba-review urd` báo 🟡.*

## 7. Ràng buộc phía người dùng

- **Ngôn ngữ & cách diễn đạt:** Giao diện và mọi thông báo bằng tiếng Việt; câu chữ đời thường, không dùng thuật ngữ kỹ thuật với người dùng cuối.
- **Thiết bị & kênh chính:** Máy tính với trình duyệt phổ thông là kênh chính trong giai đoạn 1; người dùng không phải cài thêm gì. Điện thoại chưa phải kênh được thiết kế cho (xem `GĐ-02`).
- **Năng lực số & bối cảnh sử dụng:** Người dùng ở mức trung bình — quen web/app phổ thông, ngại quy trình nhiều bước; Thành viên dùng xen kẽ giữa các việc khác, Quản trị viên dùng thưa nên không nhớ được thao tác giữa hai lần dùng.
- **Quy mô nhóm ảnh hưởng trải nghiệm:** Một tổ chức có thể tới 200 người — thao tác nào phải lặp theo từng người sẽ không dùng được ở quy mô này.
- **Pháp lý & quyền riêng tư ảnh hưởng tới trải nghiệm:** Dữ liệu công việc là thông tin nội bộ, phải lưu trong phạm vi pháp lý Việt Nam/Singapore (tương thích PDPA) — người dùng cần biết dữ liệu của mình nằm ở đâu và ai xem được.

## 8. Giả định & cách kiểm chứng

Chưa có phỏng vấn/khảo sát người dùng thật, nên phần lớn nhu cầu ở Mục 4 dựa trên quan sát gián tiếp. Các giả định dưới đây là những chỗ **nếu sai thì URD lệch**.

| Mã | Giả định | Ảnh hưởng nếu sai | Trạng thái | Việc kế tiếp |
|----|----------|-------------------|-----------|--------------|
| GĐ-01 | Ba nhóm người dùng (Thành viên / Quản lý nhóm / Quản trị viên) phản ánh đúng cách người dùng thật tự phân vai | Chia nhóm sai → nhu cầu gán nhầm người, ưu tiên lệch | 🔓 Chấp nhận rủi ro | Phỏng vấn 2–3 người mỗi nhóm trước khi chốt phạm vi giai đoạn 2 (kế thừa `GĐ-01` của `00-personas.md`) |
| GĐ-02 | Kênh chính là máy tính, không phải điện thoại | Nếu thực tế dùng điện thoại nhiều → toàn bộ hành trình phải thiết kế lại cho màn hình nhỏ | 🔓 Chấp nhận rủi ro | Khảo sát thiết bị thực tế của nhóm trong tháng đầu vận hành |
| GĐ-03 | Nỗi đau lớn nhất của Quản lý nhóm là **theo dõi tiến độ**, không phải giao việc | Nếu sai → `UN-07` không đáng ưu tiên Critical, đầu tư sai chỗ | 🔓 Chấp nhận rủi ro | Hỏi trực tiếp 2–3 quản lý nhóm; đối chiếu `BO-04` sau 2 tháng vận hành |
| GĐ-04 | Người dùng chấp nhận **nhờ người quản trị** để lấy lại quyền truy cập trong giai đoạn 1 (`UN-17` chỉ được đáp ứng gián tiếp) | Nếu không chấp nhận → ma sát ở cửa vào, người dùng bỏ dùng ngay tuần đầu | 🔓 Chấp nhận rủi ro | Chốt cùng `OQ-02`; đo số lần nhờ hỗ trợ trong tháng đầu |
| GĐ-05 | Người dùng coi độ trễ ngắn khi xem tiến độ là chấp nhận được (không cần thấy thay đổi tức thì) | Nếu người dùng cảm nhận được độ trễ → `UN-02`/`UN-07` không đạt dù đã làm | 🔓 Chấp nhận rủi ro | Quan sát phản hồi trong 2 tuần đầu vận hành |
| GĐ-06 | Mỗi công việc có đúng một người chịu trách nhiệm chính là đủ với cách nhóm làm việc thật | Nếu nhóm hay làm việc đôi/nhóm nhỏ → mô hình trách nhiệm sai, `UN-06`/`UN-09` không dùng được | 🔓 Chấp nhận rủi ro | Chốt cùng `OQ-04` trước khi mở rộng giai đoạn 2 |
| GĐ-07 | Chưa có số nền (baseline) cho các tiêu chí ở Mục 9 — sẽ khảo sát ở đầu dự án | Không chứng minh được cải thiện, `USC` thành khẩu hiệu | 🔓 Chấp nhận rủi ro | Khảo sát baseline trước ngày ra mắt (kế thừa `GĐ-02`/`GĐ-03` của `00-vision.md`) |

> **🔓 Quyết định chấp nhận rủi ro — 2026-08-04, SH-06 (BA/PM) — chủ sở hữu dự án mẫu.**
> *Vì sao chưa xác nhận được:* Mọi nhu cầu ở Mục 4 dựa trên **quan sát gián tiếp**, chưa có phỏng vấn người dùng thật — dự án mẫu không có người dùng để hỏi.
> *Điều kiện rà lại:* có phỏng vấn 2–3 người mỗi nhóm, **hoặc** trước khi mở rộng phạm vi Phase 2 dựa trên các nhu cầu này — khi điều đó xảy ra, các dòng dưới quay lại `⚠️ chưa xác nhận` và phải rà theo vòng "Xác nhận giả định" (`conventions.md`).


## 9. Tiêu chí thành công của người dùng

Đo **kết quả người dùng đạt được**, không đo "đã làm xong tính năng". Mỗi tiêu chí đỡ ít nhất một mục tiêu kinh doanh `BO-..` của `00-vision.md`.

| Mã | Kết quả người dùng | Hiện trạng (baseline) | Mục tiêu | Cách đo | Kỳ rà soát | Đỡ mục tiêu |
|----|--------------------|----------------------|----------|---------|-----------|-------------|
| USC-01 | Thành viên biết được việc cần làm hôm nay mà không phải hỏi ai | Chưa có — khảo sát trong 2 tuần đầu sau ra mắt | ≥ 80% thành viên trả lời "biết rõ" trong khảo sát ngắn | Khảo sát 3 câu hàng tháng cho nhóm đang dùng | Hàng tháng | BO-01 |
| USC-02 | Việc của thành viên hoàn tất trước hạn | Chưa có — khảo sát baseline trước ra mắt (`GĐ-07`) | Giảm ≥ 30% tỷ lệ việc trễ hạn so với trước khi dùng | So sánh tỷ lệ việc quá hạn trước/sau khi dùng hệ thống | Hàng tháng | BO-05 |
| USC-03 | Quản lý nhóm nắm được tiến độ mà không cần họp hỏi | Chưa có — khảo sát số buổi họp cập nhật/tuần trước ra mắt | Giảm ≥ 50% số buổi họp chỉ để cập nhật trạng thái | Khảo sát nhóm định kỳ | Hàng tháng | BO-04 |
| USC-04 | Quản lý nhóm đưa được tình hình cho cấp trên mà không chép tay | Hiện chép tay, mất khoảng nửa buổi mỗi kỳ *(ước lượng, chưa đo — `GĐ-07`)* | Bản tổng hợp lấy được trong ≤ 5 phút | Đo thời gian thực hiện với 3 quản lý nhóm | Hàng quý | BO-04 |
| USC-05 | Người nghỉ việc không còn xem được dữ liệu tổ chức | Hiện quyền tồn tại vô thời hạn trên bảng tính | 100% trường hợp thu hồi có hiệu lực trong ngày | Đối chiếu ngày nghỉ việc với ngày thu hồi quyền | Hàng quý | BO-03 |
| USC-06 | Không ai nhìn thấy dữ liệu của tổ chức khác | 0 (kỳ vọng) | 0 trường hợp trong 6 tháng đầu | Ghi nhận sự cố + phản ánh của người dùng | Hàng quý | BO-03 |
| USC-07 | Mọi việc đang chạy đều có người chịu trách nhiệm và hạn rõ ràng | Chưa có — hiện việc nằm rải trong chat | 100% việc đang mở có đủ người chịu trách nhiệm và hạn | Rà soát định kỳ danh sách việc đang mở | Hàng tháng | BO-02 |

## 10. Câu hỏi mở

| Mã | Câu hỏi | Cần ai trả lời | Chặn bước nào |
|----|---------|----------------|---------------|
| OQ-01 | `UN-16` hiện buộc người dùng nhớ thêm một cách vào riêng. Nhóm có sẵn danh tính công ty dùng chung không, và việc phải nhớ thêm có phải rào cản thật không? | `SH-01` (chủ sở hữu) + đại diện người dùng | Chưa chặn giai đoạn 1 (đã chốt ngoài phạm vi); ảnh hưởng phạm vi giai đoạn 2 |
| OQ-02 | `UN-17` giai đoạn 1 chỉ được đáp ứng gián tiếp qua người quản trị. Người dùng chấp nhận chờ bao lâu là hợp lý, và người quản trị có sẵn sàng nhận việc này không? | `SH-01` + `PS-03` | Chặn việc chốt `GĐ-04`; nếu không chấp nhận thì phải mở lại phạm vi giai đoạn 1 |
| OQ-03 | `UN-05` — ngưỡng "bao nhiêu là làm phiền" chưa có số. Người dùng chịu được mấy thông báo mỗi ngày trước khi bắt đầu bỏ qua? | Đại diện người dùng (`PS-01`) | Chặn việc đặt mục tiêu đo được cho `UN-05`; chưa chặn giai đoạn 1 |
| OQ-04 | `UN-06`/`UN-09` giả định mỗi việc một người chịu trách nhiệm (`GĐ-06`). Nhóm có kiểu việc cần nhiều người cùng chịu trách nhiệm không? | Đại diện `PS-02` | Chặn phạm vi giai đoạn 2; giai đoạn 1 đã chốt một người |
| OQ-05 | `UN-15` — mức chi tiết nào của dấu vết truy cập là đủ để người quản trị giải trình? | `SH-01` + `PS-03` | Chặn việc quyết định `UN-15` có vào phạm vi hay không |
| OQ-06 | `UE-10` — khi một tổ chức ngừng dùng mà còn việc đang mở: dữ liệu được giữ bao lâu, ai được lấy ra, và người dùng được báo trước bao lâu? Chưa tài liệu nào nói tới vòng đời dữ liệu ở mức tổ chức | `SH-01` | Chưa chặn giai đoạn 1; chặn việc cam kết `BO-03` khi có tổ chức đầu tiên rời đi |

## Truy vết xuống bước sau

Dự án đã có `01-requirements.md` → đối chiếu từng nhu cầu theo **bốn nơi**: `01-requirements.md` → `08-roadmap.md` (Now/Next/Later) → sổ `00-cr.md`/`00-backlog.md` → quyết định ngoài phạm vi (`00-vision.md` §4 hoặc Mục 3 tài liệu này). Qua cả bốn mà vẫn trống mới là **hở phạm vi thật**. **URD không sửa tài liệu nào** — chỉ ghi hiện trạng và đề xuất.

| Mã nhu cầu | Đã phủ bởi | Xử lý |
|-----------|-----------|-------|
| UN-01 | `FR-03` *(một phần — hiện có danh sách + thống kê nhanh, chưa sắp theo mức gấp)* | Hở nhỏ = ứng viên `U-04`. Đề xuất mở **`WI`** (mở rộng trong phạm vi `FR-03`) |
| UN-02 | `FR-06`, `FR-09` | Đã phủ |
| UN-03 | `FR-10` *(đã mở rộng nhắc T-1 theo `DEC-04`)* | Đã phủ |
| UN-04 | `08-roadmap.md` Later — `U-07` | **Đã theo dõi**, không phải hở. Giữ ở Later; kéo lên khi có phản ánh thật về việc treo chờ duyệt |
| UN-05 | `StR-04` (chưa có `FR`) · `08-roadmap.md` Later — `U-02` | **Đã theo dõi**, không phải hở. Cần chốt `OQ-03` (ngưỡng "bao nhiêu là làm phiền") trước khi kéo lên phase |
| UN-06 | `FR-04`, `FR-05`, `NFR-05` | Đã phủ |
| UN-07 | `FR-03` *(một phần — như UN-01)* | Cùng `WI` với UN-01 |
| UN-08 | `08-roadmap.md` Later — `U-05` *(`FR-10` chỉ nhắc người thực hiện)* | **Đã theo dõi**, không phải hở. Là mở rộng của `F09`; cân nhắc kéo lên Phase 2 cùng `UN-03` |
| UN-09 | `FR-06` | Đã phủ |
| UN-10 | `FR-14` *(`CR-01` đã duyệt, đã triển khai tài liệu)* | Đã phủ — theo dõi tới khi `CR-01` đóng |
| UN-11 | `FR-13`, `FR-02` | Đã phủ |
| UN-12 | `FR-02` | Đã phủ |
| UN-13 | `BR-03`, `NFR-06` | Đã phủ |
| UN-14 | `TR-02` *(nhập danh sách, tháng đầu ra mắt — Could)* · `08-roadmap.md` Later — `U-06` | Phủ một phần + đã theo dõi phần còn lại. Kéo lên sớm nếu có tổ chức > 50 người trước khi ra mắt |
| UN-15 | `08-roadmap.md` Later — `U-08` | **Đã theo dõi**, không phải hở. Cần chốt `OQ-05` (mức chi tiết dấu vết) trước khi ước lượng |
| UN-16 | `FR-01`, `NFR-02`, `NFR-03` | Đã phủ |
| UN-17 | — chưa *(đã chốt ngoài phạm vi giai đoạn 1, người quản trị hỗ trợ thủ công)* | Không phải hở ngoài ý muốn — là **quyết định phạm vi**. Rà lại khi chốt `OQ-02`/`GĐ-04` |
| UN-18 | `08-roadmap.md` Later — `U-09` | **Đã theo dõi**, không phải hở. Ưu tiên thấp, gom vào đợt cải thiện trải nghiệm giao việc |

**Tóm tắt:** 11/18 nhu cầu được `FR` hiện có phủ · 2 phủ một phần (`UN-01`/`UN-07` — hở nhỏ trong `FR-03`; `UN-14`) · **6 đã có chỗ theo dõi ở `08-roadmap.md` mục Later** (`UN-04`, `UN-05`, `UN-08`, `UN-14` phần còn lại, `UN-15`, `UN-18`) · 1 chủ động ngoài phạm vi (`UN-17`).

**Không có hở phạm vi nào chưa ai theo dõi** — nghĩa là *không cần mở `CR`/`WI` mới từ tài liệu này*. Điểm duy nhất nên chốt: `U-04` (sắp xếp theo mức gấp — nền của `UN-01`/`UN-07`) đang được `08-roadmap.md` ghi lửng *"ứng viên kéo lên Phase 2 nếu còn dư năng lực"*; nên quyết vào hay không thay vì để treo. Không nhu cầu **Critical** nào bị hở.

## Lịch sử cập nhật

| Ngày | Thay đổi | Nguồn |
|------|----------|-------|
| 2026-08-03 | Tạo mới — 18 nhu cầu `UN-01`–`UN-18`, 5 hành trình, 7 tiêu chí `USC-01`–`USC-07`, đối chiếu `FR` hiện có | `00-brainstorm.md`, `00-personas.md`, `00-vision.md`, `04-stakeholders.md`, `CR-01`, `DEC-04` |
| 2026-08-03 | Rà soát `ba-review urd`: tách `UN-06` (gộp hai nhu cầu) → nhu cầu "giao hàng loạt" thành `UN-18` | Gate `ba-review urd` |
| 2026-08-04 | Sửa **G34**: 6 nhu cầu bị gọi nhầm là "hở, cần mở CR/WI" trong khi đã nằm ở `08-roadmap.md` mục Later (`DEC-05`/`ACT-04`). Bổ sung luật đối chiếu **bốn nơi** trước khi kết luận hở | Gate `ba-review all` (2026-08-04) |
| 2026-09-24 | Mục 6: cấp mã `UE-01`–`UE-12` + cột Mức + cột "Chưa màn nào xử lý"; đặc tả màn `S01`–`S05` trích ngược `UE-..` ở dòng xử lý; thêm `OQ-06` cho `UE-10` (không màn nào xử lý) | Đợt 5 gói 4 — truy vết ngoại lệ người dùng xuống màn |

## Thuật ngữ

| Thuật ngữ | Giải thích |
|-----------|-----------|
| URD (User Requirements Document) | Tài liệu yêu cầu người dùng — mô tả người dùng cần gì, chưa nói hệ thống làm thế nào |
| UN (User Need) | Nhu cầu người dùng — một nhu cầu nguyên tử có bối cảnh và kết quả mong đợi |
| UE (User Exception) | Ngoại lệ/tình huống biên phía người dùng (Mục 6) — màn xử lý nó trích ngược mã này |
| USC (User Success Criteria) | Tiêu chí thành công đo bằng kết quả người dùng đạt được |
| Baseline (số nền) | Mức hiện tại trước khi có hệ thống, làm mốc so sánh cho mục tiêu |
| Solution-free (không giải pháp) | Cách viết chỉ nêu nhu cầu, không nêu màn hình/thao tác/công nghệ đáp ứng nhu cầu đó |
| PS (Persona) | Chân dung người dùng đại diện, định nghĩa ở `docs/00-personas.md` |
| BO (Business Objective) | Mục tiêu kinh doanh cấp dự án, định nghĩa ở `docs/00-vision.md` |
| CR (Change Request) / WI (Work Item) | Yêu cầu thay đổi cái đã chốt / việc mới trong phạm vi — sổ `00-cr.md` và `00-backlog.md` |

> Từ điển đầy đủ toàn dự án: `docs/00-glossary.md`.
