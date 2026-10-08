# Ghép nối ba chiều — mạnh · xa · hay đổi

Mô hình lấy từ *Balancing Coupling in Software Design* (Vlad Khononov), viết lại cho việc quyết **tách cái gì trước**. Ba câu hỏi cho mỗi cặp module A–B:

| Chiều | Câu hỏi | Ai đo |
|---|---|---|
| **Mạnh** (integration strength) | A phải biết *bao nhiêu* về ruột của B để chạy đúng? | LLM đọc code — script không đo được |
| **Xa** (distance) | Đổi cả A lẫn B tốn *bao nhiêu phối hợp*? | script đo cấu trúc (cùng/khác container); đội/deploy → hỏi người |
| **Hay đổi** (volatility) | A/B đổi *bao nhiêu lần* và *vì sao*? | script đo churn + đồng-đổi; loại domain → LLM |

Công thức cân bằng: **chi phí bảo trì ≈ mạnh × xa × hay đổi** — một chiều bằng 0 thì cặp đó rẻ. Lộ trình tách nhắm vào cặp mà **cả ba đều cao**.

## 1. Mạnh — bốn mức, từ tệ nhất

| Mức | Dấu hiệu trong code | Hậu quả |
|---|---|---|
| **Xâm nhập** (intrusive) | A đọc thẳng bảng/DB của B · A đụng biến/hàm nội bộ của B không được thiết kế để dùng ngoài · reflection/monkey-patch · A phụ thuộc cấu trúc file/config nội bộ của B | B đổi *bất cứ gì* bên trong là A gãy — B không biết mình đang bị nhìn |
| **Chức năng** (functional) | Cùng một rule nghiệp vụ viết ở cả A và B ("nhớ sửa X khi đổi Y") · A và B phải deploy cùng lúc · transaction trải hai module · thứ tự gọi bắt buộc | Đổi một rule phải sửa hai chỗ; sót một chỗ là lệch nghiệp vụ. **Không cần import cũng có** — script không thấy, chỉ đồng-đổi cao mới lộ |
| **Mô hình** (model) | A dùng thẳng entity/enum/DTO nội bộ của B (`from crm.models import Customer`) · A biết tên field, kiểu, ý nghĩa giá trị của B | B đổi model là A đổi theo, dù A chỉ cần 2 trong 30 field |
| **Hợp đồng** (contract) — *mức lý tưởng* | B lộ ra một DTO/API riêng cho tích hợp, có phiên bản, kiểu nguyên thuỷ; A chỉ biết hợp đồng đó | B đổi ruột thoải mái; đổi hợp đồng thì có version |

Xếp mức cho một cặp: đọc **file có nhiều import nhất** trong cạnh (script trả `files`), tìm dấu hiệu theo bảng trên, ghi bằng chứng `file:dòng`. Không có bằng chứng → ghi `🔶 mô hình (suy đoán)`, không ghi chắc.

## 2. Xa — bậc thang khoảng cách

Tổ tiên chung gần nhất của A và B quyết khoảng cách: cùng file < cùng thư mục/package < cùng container (`src/`) < khác container (`apps/` ↔ `packages/`) < khác tiến trình deploy < khác đội/khác tổ chức. **Khác đội = cộng thêm một bậc** (Conway). Script chỉ nhìn thấy tới "container"; hai bậc cuối phải hỏi — ghi `❓` khi chưa hỏi.

## 3. Hay đổi — số + loại domain

- **Số:** churn `N` ngày (commit chạm module) và đồng-đổi (cùng commit với module khác). Đồng-đổi cao mà **không** có cạnh import = ghép nối chức năng ngầm — đáng sợ hơn cạnh import, vì không ai khai.
- **Loại domain** (DDD chiến lược) cho biết *sẽ* đổi thế nào dù lịch sử chưa nói: **Lõi** (lợi thế cạnh tranh — sẽ đổi mãi) · **Hỗ trợ** (nghiệp vụ riêng, ít đổi) · **Chung** (auth, mail, log — gần như không đổi, mua/ngoài được). Module hỗ trợ mà ghép xâm nhập/chức năng với lõi thì **thừa hưởng** độ hay đổi của lõi.

## 4. Bảng cân bằng — quyết định tách

| Mạnh | Xa | Hay đổi | Kết luận |
|---|---|---|---|
| cao | xa | cao | 🔴 **tách trước** — phức tạp toàn cục + chi phí đổi cao |
| cao | xa | thấp | 🟡 chấp nhận — mạnh nhưng ổn định (tích hợp legacy điển hình); ghi rõ, không tách vội |
| cao | gần | cao | 🟢 nếu cùng domain (đổi cùng, ở cùng = gắn kết) · 🟠 nếu **khác domain** (trộn thứ không liên quan vào một chỗ) |
| cao | gần | thấp | 🟢 mạnh nhưng tĩnh |
| thấp | xa | * | 🟢 ghép lỏng đúng nghĩa |
| thấp | gần | cao | 🟠 phức tạp cục bộ — module chứa thứ không liên quan; cân nhắc tách bên trong |

**Thứ tự lộ trình** = 🔴 theo (cạnh × churn) giảm dần → 🟠 → dừng; 🟡/🟢 không vào lộ trình trừ khi là bước phụ thuộc. Vòng (↔) luôn lên đầu trong cùng mức: vòng là lý do lớn nhất khiến một module không tách ra được.

## 5. Bốn câu hỏi nhanh khi phân vân

- Đổi một chi tiết bên trong B, bao nhiêu module khác phải sửa? (→ mạnh)
- Hợp đồng giữa A–B được *thiết kế* để công khai, hay là ngẫu nhiên? (→ mạnh)
- Hai đội giữ A và B có phải hẹn nhau deploy không? (→ xa)
- Nghiệp vụ có hay đòi đổi vùng này không — hay 2 năm không ai đụng? (→ hay đổi)
