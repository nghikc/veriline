# Mẫu tách (strangler) · pha triển khai · cửa một chiều

Nguyên tắc chung: **dựng cái mới vòng quanh cái cũ, chuyển từng lát quan sát được, cái cũ teo dần rồi mới bỏ**. Code chuyển tiếp (facade, adapter, dual-write) là chi phí *cố ý* — rẻ hơn big-bang. Mẫu áp dụng **cả hai chiều** (monolith → service và service → monolith, đổi framework, đổi DB).

## 1. Sáu mẫu — chọn theo đường nối (seam)

| Đường nối | Mẫu | Cách chạy | Quay lui | Dùng khi |
|---|---|---|---|---|
| **HTTP/API** | Strangler qua gateway | Đặt router/proxy trước hệ cũ; route mới đăng ký từng endpoint; chia traffic theo cờ / % / phân khúc (sticky theo user khi canary) | Đặt % về 0 — tức thì, không deploy | Có route rõ; muốn canary từng endpoint |
| **Ranh giới module** | Tách service có adapter | Rút interface → adapter bọc code cũ → cài bản mới sau cùng interface → chọn bản qua DI/cờ | Đổi binding về adapter cũ | Module có ranh giới nhưng còn gọi hàm trực tiếp |
| **Dữ liệu** | Dual-write DB | Ghi mới vào DB mới (nguồn sự thật) + đồng bộ không đồng bộ về DB cũ; đọc mới trước, fallback cũ; migrate lười khi đọc + backfill dữ liệu lạnh; đối chiếu liên tục | Còn dual-write thì đổi nguồn đọc về cũ; **tắt dual-write rồi thì không quay lui** | Tách DB chung, đổi loại DB, đổi schema |
| **Giao diện** | Strangler UI | Hai framework cùng trang; component bọc cờ chọn bản render; migrate theo **route/trang**, không theo component lẻ; cầu state chung | Tắt cờ | Đổi framework FE, gộp/tách micro-frontend |
| **Sự kiện** | Chặn sự kiện | Bọc producer cũ để phát thêm lên bus mới; consumer cũ và mới cùng nhận; cần idempotent (một sự kiện xử lý hai lần trong chuyển tiếp) | Tắt consumer mới | Hệ chạy bằng queue/webhook; đổi hạ tầng message |
| **Trong một deploy** | Branch by abstraction | Tạo abstraction → sửa mọi call-site dùng abstraction → bọc bản cũ → viết bản mới → cờ chọn → xoá cũ | Cờ về bản cũ | Thay thư viện/thuật toán/SDK quá lớn cho một PR; monolith → modular monolith |

Ma trận nhanh: cần route giữa cũ/mới → **gateway** (+ tách service từng endpoint) · module thành service riêng → **adapter** (+ branch by abstraction cho phụ thuộc nội bộ) · schema đổi → **dual-write** (+ gateway cho đọc/ghi) · đổi FE → **strangler UI** · thay thư viện nội bộ → **branch by abstraction** · nhiều service → monolith → gateway *ngược* + adapter *ngược* (hút vào).

## 2. Pha trong mỗi bước có traffic thật

| Pha | Traffic sang mới | Đạt khi | Quay lui khi |
|---|---|---|---|
| Dựng | 0% | smoke test xanh | — |
| **Bóng** | 0% (chạy song song, so kết quả) | kết quả trùng ≥ 99% trong 1–2 tuần | lệch > 5% |
| **Canary** | 5–10% | lỗi ≤ baseline + 0,1% | lỗi > baseline + 1% |
| Tăng dần | 25 → 50 → 75% | hiệu năng ngang cũ mỗi nấc | p95 > 2× baseline |
| **100%** | 100% | mọi chỉ số xanh ≥ 30 ngày | bất kỳ chỉ số xấu đi |
| **Dọn** | 100%, xoá code cũ | code cũ không được gọi ≥ 30 ngày | **không quay lui được** — đây là cửa một chiều |

Luật: chưa đạt tiêu chí pha này thì không sang pha sau; quay lui thì lùi **một** pha, không lùi về 0. Các con số là mặc định — dự án ghi số của mình vào `**Tiêu chí xong:**`, script chỉ đòi *có số*.

## 3. Thứ tự tách theo đồ thị phụ thuộc

1. **Bước 0 luôn là lưới an toàn**: characterization test (ghi lại hành vi hiện tại, kể cả hành vi sai đã biết — ghi vào `00-backlog.md`), baseline hiệu năng, log so sánh cũ/mới. Không có lưới → mọi bước là big-bang trá hình.
2. **Lá trước** — module không ai import (script: không có cạnh `→` vào nó) tách trước: rủi ro thấp, luyện cơ chế.
3. **Lõi dùng chung sau** — module nhiều cạnh vào (auth, user, org) tách cuối, khi facade đã quen.
4. **Vòng phải phá trước khi tách** — cặp ↔ không tách được bên nào; bước phá vòng (đảo chiều một cạnh qua interface/sự kiện) là một `MG` riêng, có slice quan sát được (ví dụ "billing không còn import orders; test cấm import xanh").
5. **Bảng dùng chung** — mỗi bảng bị ≥2 module ghi là một dòng ở §5 rủi ro và một quyết định dual-write/sở hữu dữ liệu.

## 4. Cửa một chiều — danh sách phải mở ADR

Quyết định mà *quay lại* tốn hơn nhiều *đi tiếp*. Mỗi cái là một dòng ở §4 của `00-migration.md` và một ADR theo khuôn §11 của `ba-architecture` (`10-architecture.md`), `Draft` cho tới cổng chốt kiến trúc, **trước** bước `MG` dùng nó:

- Strangler từng lát **hay** big-bang (viết lại rồi cutover một lần)
- Tách DB theo module **hay** giữ DB chung (schema riêng / DB riêng / chung)
- Đổi ngôn ngữ/framework **hay** hiện đại hoá tại chỗ
- Cắt/đổi hợp đồng API công khai (khách ngoài đang gọi)
- Đổi mô hình tenant/cách ly dữ liệu
- Xoá code cũ / tắt dual-write (pha Dọn)
- Gộp service về monolith (chiều ngược cũng là cửa)

Không có cửa nào → §4 ghi "không có" — `check-migration.js` chỉ đòi mục tồn tại và mỗi dòng có `ADR-..`.
