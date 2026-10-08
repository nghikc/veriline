---
name: ba-api-integration
description: Use when hệ thống cần TIÊU THỤ API của ĐỐI TÁC/HỆ NGOÀI (payment, SSO, e-invoice…) — build-vs-buy, mapping field 3 tầng, checklist readiness; sinh docs/12-api-integration.md.
---

# ba-api-integration — Đánh giá & mapping API đối tác ngoài

## Mục tiêu
Sinh `docs/12-api-integration.md` — với mỗi **API đối tác/hệ ngoài** mà hệ thống tiêu thụ, trả lời: **tự xây hay mua** (build-vs-buy), **tài liệu API của họ nói gì** (digest gọn), **field của họ khớp dữ liệu/màn của mình ra sao** (mapping 3 tầng), và **đủ điều kiện lên production chưa** (readiness gate). Kết thúc bằng cổng CHỐT như một quyết định kiến trúc.

> **Phân vai — 3 skill "API" không chồng nhau:**
> - `ba-api-spec` (06) = **API của MÌNH** tự phát ra (endpoint mình expose).
> - `ba-integration` (11) = **kiến trúc tích hợp** cả cụm hệ (landscape + hợp đồng tổng + MDM).
> - `ba-api-integration` (12) = **tiêu thụ một API ĐỐI TÁC cụ thể** (đánh giá + mapping + readiness). 11 quyết định "ta sẽ nối đối tác X"; 12 đặc tả *tiêu thụ X thế nào*.

## Điều kiện
- **Cần:** `02-functions.md` (chức năng nào gọi ra ngoài) + `01-requirements.md` (§NFR/§Ràng buộc: SLA, bảo mật, chi phí). **Nên có:** `05-data-model.md` (đích mapping), `03-overview.md` (màn dùng dữ liệu), `11-integration.md` (nếu đã có landscape). **Đầu vào ngoài:** tài liệu API đối tác (link/PDF/OpenAPI) — không có thì đánh dấu `GĐ ⚠️ chưa xác nhận` cho phần đoán.
- Không tiêu thụ API ngoài nào → không cần skill này.

## Quy trình
1. Đọc `conventions.md`; `02`/`01`; `05`/`03`/`11` nếu có. Nạp tài liệu API đối tác (Read cho PDF/OpenAPI; dán nếu là trang web).
2. **Kiểm kê hệ ngoài:** mỗi đối tác một `EXT-01` — vai trò (thanh toán/SSO/…) · nhà cung cấp · mô hình giá · tài liệu ở đâu · môi trường sandbox có không.
3. **Build-vs-buy (mỗi `EXT` một ADR):** so sánh **tự xây** vs **mua/dùng dịch vụ** trên: chi phí (dev + phí/giao dịch), thời gian, rủi ro tuân thủ (PCI-DSS, hóa đơn điện tử…), năng lực đội, khóa nhà cung cấp (lock-in), độ chín. Kết luận = một **`ADR-01`** trace về `NFR`/ràng buộc; trạng thái `Draft` tới khi qua cổng chốt.
4. **Digest tài liệu API đối tác:** rút gọn về những gì DÙNG — base URL + môi trường (sandbox/prod), **auth** (OAuth2/API-key/HMAC/mTLS + cách lấy token), các **endpoint dùng** (method/path/mục đích), **webhook/callback** (sự kiện + chữ ký xác thực), **rate limit & quota**, **mã lỗi** hay gặp + ý nghĩa, **idempotency** (có key không), **versioning/deprecation**. Trích dẫn mục trong doc gốc; chỗ doc không nói rõ → `OQ`.
5. **Mapping field 3 tầng (cốt lõi):** mỗi trường dữ liệu trao đổi một dòng: **API đối tác** (tên field + kiểu + đơn vị) ↔ **Mô hình dữ liệu mình** (`05` thực thể.thuộc tính) ↔ **Màn hình** (`S..` + nhãn hiển thị). Ghi **phép biến đổi** (đổi đơn vị/định dạng/enum, VND↔cent, ISO-8601↔epoch), **bắt buộc/tùy chọn**, **giá trị mặc định**, **chiều** (gửi/nhận/cả hai). Trường không map được → nêu ra, đừng bỏ lặng.
6. **Readiness gate (checklist trước production):** sandbox đã test ✅/❌ · credential prod đã cấp · secrets ở vault (không hardcode) · **retry + timeout + idempotency** cho lời gọi ra · **circuit breaker/fallback** khi đối tác sập · webhook verify chữ ký · rate-limit tôn trọng · log/trace có correlation id · xử lý & map mã lỗi đối tác sang lỗi hệ mình · điều khoản/PII/tuân thủ OK · **kế hoạch dự phòng** khi đối tác đổi API. Mỗi mục `✅/⚠️/❌ + ghi chú`.
7. **Rủi ro & Xác nhận giả định (BẮT BUỘC):** đối tác sập/đổi contract/tăng giá → phương án. Tự đoán (SLA, giá, volume, field nghĩa gì) → `GĐ-..` + vòng "Xác nhận giả định" (`conventions.md`); batch → `⚠️ chưa xác nhận`.
8. Viết `docs/12-api-integration.md` theo `template.md`.
9. **Cổng CHỐT (BẮT BUỘC):** trình người dùng **các ADR build-vs-buy** + **bảng mapping** + **readiness** → hỏi (AskUserQuestion: **Chốt / Sửa / Hoãn**), nhấn các cam kết chi phí & tuân thủ với đối tác. Chỉ khi **Chốt** → ADR `Accepted` + ngày; `dev-run` mới được scaffold client/adapter theo bản này. **Hoãn** → giữ `Draft`, chưa cho code. *(Batch → `Draft` + `⚠️ chưa chốt`; `ba-review` báo 🟡.)*

## Tiêu chí chất lượng (BẮT BUỘC)
- Mỗi `EXT` có **một ADR build-vs-buy có kết luận** (không để lửng), trace `NFR`/ràng buộc.
- **Mọi trường trao đổi có một dòng mapping đủ** (kiểu + đơn vị + biến đổi + chiều); trường không map được phải nêu.
- Readiness **không bỏ trống** retry/idempotency/xử-lý-lỗi/fallback cho lời gọi ra ngoài (mạng luôn có thể hỏng).
- Không bịa auth/rate-limit/mã lỗi — không rõ trong doc đối tác → `OQ`/`GĐ ⚠️ chưa xác nhận`.
- Digest chỉ giữ phần **dùng thật**, không chép cả tài liệu đối tác.

## Ranh giới
- Bổ trợ `ba-integration` (kiến trúc tích hợp tổng thể) và `ba-api-spec` (API mình **tự phát**, chiều ngược lại).

## Lưu ý
- Tài liệu sống: đối tác đổi API / đổi giá → `ba-change-request` (thêm ADR "supersedes").
- **Không trùng:** `06-api-spec` = API mình phát; `11-integration` = kiến trúc cả cụm; `12` = tiêu thụ một đối tác. 12 có thể trỏ 11 cho bức tranh tổng.
- Sơ đồ luồng gọi đối tác (nếu vẽ) → `sequenceDiagram` (participant = hệ mình + đối tác), chỉ rõ sync/async + timeout.
- Văn phong & Thuật ngữ: footer `## Thuật ngữ` + bổ sung `00-glossary.md` (OAuth2, HMAC, idempotency, webhook, lock-in, PCI-DSS…).
- Tiếng Việt; tên field/endpoint/đối tác giữ nguyên.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
