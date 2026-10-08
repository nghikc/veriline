---
name: ba-api-spec
description: Use when cần đặc tả API của chính hệ thống — endpoint, request/response, mã trạng thái, sinh docs/06-api-spec.md; `partner` khi tiêu thụ API đối tác (build-vs-buy, mapping field 3 tầng, readiness) → docs/12-api-integration.md.
---

# ba-api-spec — Đặc tả API hệ thống

## Chế độ
| Gọi | Làm gì |
|---|---|
| `/ba-api-spec` (mặc định) | API **của mình** tự phát → `docs/06-api-spec.md` — quy trình bên dưới |
| `/ba-api-spec partner [đối tác]` | tiêu thụ API **đối tác/hệ ngoài** (payment, SSO, e-invoice…) — build-vs-buy, digest, mapping field 3 tầng, readiness → `docs/12-api-integration.md` — mục **"Chế độ `partner`"** cuối file (trước 08/10/2026 là skill `ba-api-integration`) |

## Mục tiêu
Sinh `docs/06-api-spec.md`: bảng tổng endpoint + chi tiết request/response từng endpoint.

## Quy trình
1. Đọc `conventions.md` của `ba-toolkit`, `docs/02-functions.md`, các `srs.md`, và `docs/05-data-model.md` nếu có.
2. **Suy ra endpoint có hệ thống** theo tài nguyên (REST: danh từ số nhiều + HTTP method, không động từ trong path; hành động ngoài CRUD như đăng nhập/duyệt đặt endpoint riêng theo use case) — không đặt endpoint tuỳ hứng.
3. Lập **Ma trận CRUD-to-Endpoint** (thực thể × thao tác) để soát độ phủ.
4. Mỗi endpoint ghi: method, path, mô tả, tham số/đường dẫn, request body, response, mã trạng thái, trace `F..`.
5. Định nghĩa **Error/Response envelope chuẩn** dùng chung cho mọi endpoint.
6. Viết `docs/06-api-spec.md` theo `template.md`.

## Tiêu chí chất lượng (BẮT BUỘC)
- **Trace đầy đủ:** mỗi endpoint trace về ≥1 chức năng `F..`; ngược lại mỗi thực thể CRUD trong data model phải có endpoint tương ứng (hoặc ghi rõ lý do không expose).
- **Path theo tài nguyên:** không động từ trong path; không trùng lặp ngữ nghĩa method (vd cấm `POST /tasks/delete`).
- **Nhất quán response/lỗi:** mọi endpoint dùng chung error envelope; mỗi endpoint liệt kê đủ mã trạng thái thành công + lỗi có thể xảy ra.
- Tên trường giữ tiếng Anh; mô tả tiếng Việt. Tài liệu cấp tổng, tùy chọn.

## Lưu ý
- **Văn phong & Thuật ngữ:** mở rộng từ viết tắt ở lần đầu dùng; thêm footer `## Thuật ngữ` cuối `06-api-spec.md` + bổ sung thuật ngữ mới vào `docs/Ho-so/00-glossary.md` — xem `conventions.md`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.

## Ranh giới

- API của đối tác/hệ ngoài mà hệ thống tiêu thụ → chế độ `partner` (dưới); kiểm thử API → `ba-api-test`.
- KHÁC `ba-integration` (11) = **kiến trúc tích hợp** cả cụm hệ (landscape + hợp đồng tổng + MDM). 11 quyết định "ta sẽ nối đối tác X"; `partner` (12) đặc tả *tiêu thụ X thế nào* và có thể trỏ 11 cho bức tranh tổng.

## Chế độ `partner` — đánh giá & mapping API đối tác ngoài
Sinh `docs/12-api-integration.md` theo `assets/partner-template.md` — với mỗi API đối tác/hệ ngoài hệ thống tiêu thụ: **tự xây hay mua**, **doc của họ nói gì** (digest), **field của họ khớp dữ liệu/màn của mình ra sao** (mapping 3 tầng), **đủ điều kiện lên production chưa** (readiness). Kết thúc bằng cổng CHỐT như một quyết định kiến trúc. Không tiêu thụ API ngoài nào → không cần chế độ này.

**Điều kiện.** Cần `02-functions.md` (chức năng gọi ra ngoài) + `01-requirements.md` (§NFR/§Ràng buộc: SLA, bảo mật, chi phí). Nên có `05-data-model.md` (đích mapping), `03-overview.md`, `11-integration.md`. Đầu vào ngoài: tài liệu API đối tác (link/PDF/OpenAPI) — không có thì phần đoán đánh `GĐ ⚠️ chưa xác nhận`.

**Quy trình.**
1. Đọc `conventions.md`; `02`/`01`; `05`/`03`/`11` nếu có. Nạp tài liệu API đối tác (Read cho PDF/OpenAPI; dán nếu là trang web).
2. **Kiểm kê hệ ngoài:** mỗi đối tác một `EXT-01` — vai trò · nhà cung cấp · mô hình giá · tài liệu ở đâu · có sandbox không.
3. **Build-vs-buy — mỗi `EXT` một ADR:** so tự xây vs mua trên chi phí (dev + phí/giao dịch), thời gian, rủi ro tuân thủ (PCI-DSS, hoá đơn điện tử…), năng lực đội, lock-in, độ chín. Kết luận = `ADR-01` trace `NFR`/ràng buộc, `Draft` tới khi qua cổng chốt.
4. **Digest:** chỉ phần DÙNG — base URL + môi trường, **auth** (OAuth2/API-key/HMAC/mTLS + cách lấy token), **endpoint dùng**, **webhook/callback** (sự kiện + chữ ký), **rate limit & quota**, **mã lỗi** hay gặp, **idempotency**, **versioning/deprecation**. Trích mục doc gốc; chỗ doc không rõ → `OQ`.
5. **Mapping field 3 tầng (cốt lõi):** mỗi trường một dòng **API đối tác** (field + kiểu + đơn vị) ↔ **`05` thực thể.thuộc tính** ↔ **màn `S..` + nhãn**; ghi **phép biến đổi** (đơn vị/định dạng/enum, VND↔cent, ISO-8601↔epoch), bắt buộc/tuỳ chọn, mặc định, **chiều** (gửi/nhận/cả hai). Trường không map được → nêu ra, không bỏ lặng.
6. **Readiness gate:** sandbox đã test · credential prod · secrets ở vault · **retry + timeout + idempotency** · **circuit breaker/fallback** · webhook verify chữ ký · tôn trọng rate-limit · log có correlation id · map mã lỗi đối tác sang lỗi mình · điều khoản/PII/tuân thủ · **kế hoạch khi đối tác đổi API**. Mỗi mục `✅/⚠️/❌ + ghi chú`.
7. **Rủi ro & Xác nhận giả định (BẮT BUỘC):** đối tác sập/đổi contract/tăng giá → phương án. Tự đoán (SLA, giá, volume, nghĩa field) → `GĐ-..` + vòng "Xác nhận giả định" (`conventions.md`); batch → `⚠️ chưa xác nhận`.
8. Viết `docs/12-api-integration.md` theo `assets/partner-template.md`.
9. **Cổng CHỐT (BẮT BUỘC):** trình **các ADR build-vs-buy** + **bảng mapping** + **readiness** → AskUserQuestion **Chốt / Sửa / Hoãn**, nhấn cam kết chi phí & tuân thủ. Chỉ **Chốt** → ADR `Accepted` + ngày; `dev-run` mới được scaffold client/adapter. **Hoãn** → giữ `Draft`, chưa cho code. *(Batch → `Draft` + `⚠️ chưa chốt`; `ba-review` báo 🟡.)*

**Tiêu chí (BẮT BUỘC).** Mỗi `EXT` có một ADR build-vs-buy **có kết luận**, trace `NFR`. Mọi trường trao đổi có dòng mapping đủ (kiểu + đơn vị + biến đổi + chiều). Readiness không bỏ trống retry/idempotency/xử-lý-lỗi/fallback. Không bịa auth/rate-limit/mã lỗi → `OQ`/`GĐ ⚠️`. Digest chỉ giữ phần dùng thật.

**Lưu ý.** Đối tác đổi API/giá → `ba-change-request` (ADR "supersedes"). Sơ đồ luồng gọi đối tác → `sequenceDiagram` (participant = hệ mình + đối tác), rõ sync/async + timeout. Footer `## Thuật ngữ` + `00-glossary.md` (OAuth2, HMAC, idempotency, webhook, lock-in, PCI-DSS…). Tên field/endpoint/đối tác giữ nguyên. **Xong → chạy `ba-next`.**
