---
name: ba-integration
description: Use when phần mềm tích hợp NHIỀU hệ thống và cần chốt KIẾN TRÚC TÍCH HỢP — landscape, hợp đồng tích hợp, sync/async/event, sở hữu dữ liệu, resilience; sinh docs/11-integration.md.
---

# ba-integration — Kiến trúc tích hợp (Integration Architecture)

## Mục tiêu
Sinh `docs/11-integration.md` — **bức tranh nối nhiều hệ thống** khi integration là mối quan tâm chính (nhiều hệ nội bộ + đối tác ngoài, hoặc landscape microservice). Trả lời: hệ nào nối hệ nào, qua **hợp đồng** gì (giao thức/dữ liệu/SLA), **đồng bộ hay bất đồng bộ**, hệ nào **sở hữu** dữ liệu nào, và khi một hệ **hỏng** thì sao.

> **Phân vai với `ba-architecture`:** `ba-architecture` (10) lo **nội tại từng hệ** (stack/phân tầng/khối triển khai). `ba-integration` (11) lo **giữa các hệ** (landscape/hợp đồng/luồng xuyên hệ). Sơ đồ **ngữ cảnh** của `10-architecture.md` là zoom-in một hệ; **System Landscape** của `11-integration.md` là zoom-out cả cụm. Dự án **ít tích hợp** (vài hệ) → không cần skill này, khai §7 của `ba-architecture` là đủ.

## Điều kiện
- **Cần:** `02-functions.md` (chức năng nào chạm hệ ngoài), `01-requirements.md` (§NFR + §Ràng buộc: SLA, bảo mật, dữ liệu ở đâu). **Nên có:** `05-data-model.md` (thực thể → sở hữu dữ liệu), `06-api-spec.md`, `10-architecture.md`.
- Chỉ tích hợp 1–2 hệ đơn giản → route về `ba-architecture` §7 thay vì dựng doc riêng.

## Quy trình
1. Đọc `conventions.md`; `02-functions.md`, `01-requirements.md`; `05`/`06`/`10` nếu có. Có `07-design-system.md` → token màu cho sơ đồ.
2. **Kiểm kê hệ thống:** liệt kê mọi hệ tham gia — **tự xây** (hệ đang làm + subsystem) và **hệ ngoài/đối tác** (ERP, CRM, payment, SSO, email, kho, BI…). Mỗi hệ: vai trò + chủ sở hữu + tin cậy/SLA.
3. **Bảng hợp đồng tích hợp** — mỗi cặp tích hợp một dòng: Nguồn→Đích · **giao thức** (REST/SOAP/gRPC/GraphQL/file/DB/webhook) · **sync/async** (request-reply / event / queue / batch) · dữ liệu (thực thể + chiều) · trigger/tần suất/volume · **SLA/latency** · **auth** (mTLS/OAuth2/API-key/JWT) · **lỗi + retry + idempotency** · chủ sở hữu. Mỗi tích hợp trace về `FR`/`NFR`.
4. **Chọn mẫu tích hợp** (có lý do, khớp quy mô): điểm-điểm vs **API gateway** vs **ESB** vs **event-bus (pub/sub)** vs batch-file vs **CDC**; **orchestration vs choreography** (saga cho giao dịch xuyên hệ). Đừng dựng ESB/Kafka nếu 3 tích hợp đơn giản.
5. **Sở hữu dữ liệu & Master Data (MDM):** mỗi thực thể chính → **hệ nguồn-sự-thật (system of record)** · chiều đồng bộ · độ trễ chấp nhận · **xử lý xung đột/trùng**. Tránh hai hệ cùng "sở hữu" một dữ liệu.
6. **Luồng xuyên hệ then chốt:** với mỗi quy trình end-to-end qua nhiều hệ → **`sequenceDiagram`** (participant = hệ; chỉ rõ sync/async, timeout, bù trừ). Đối chiếu coverage; phức tạp → `ba-review diagram docs/11-integration.md`.
7. **Resilience & vận hành biên:** circuit breaker, **DLQ** (dead-letter), backpressure, timeout/retry với backoff, **idempotency key**, **contract/versioning** (backward-compat, deprecation), observability xuyên hệ (correlation/trace id), rate-limit.
8. **Rủi ro tích hợp + dự phòng:** hệ ngoài sập/chậm, contract drift, lệch dữ liệu, đối tác đổi API → phương án (degrade, cache, hàng đợi, thủ công).
9. **Xác nhận giả định (BẮT BUỘC)** khi tự đoán (SLA đối tác, volume, ai sở hữu dữ liệu) → `GĐ-..` + vòng xác nhận; batch → `⚠️ chưa xác nhận`.
10. Viết `docs/11-integration.md` theo `template.md`.
11. **Cổng CHỐT tích hợp (BẮT BUỘC):** trình người dùng **bảng hợp đồng tích hợp** + mẫu tích hợp + **sở hữu dữ liệu (MDM)** → hỏi xác nhận (AskUserQuestion: **Chốt / Sửa / Hoãn**), đặc biệt các cam kết với **đối tác ngoài** (SLA · auth · contract). Chỉ khi **Chốt** → đánh dấu hợp đồng **Accepted** + ngày; build/dev bám bản đã chốt. **Hoãn** → giữ **Draft**, không cho scaffold adapter. *(Batch → Draft + `⚠️ chưa chốt`; gate `ba-review integration` báo 🟡.)*
12. **Bàn giao:** chỉ dùng bản **đã chốt** — `ba-architecture` §7 trỏ sang; `ba-api-spec` chi tiết hợp đồng API tự phát; `dev-run` scaffold adapter/stub theo bảng hợp đồng.

## Kỹ thuật áp dụng
- **System Landscape:** mức trên ngữ cảnh — vẽ cả cụm hệ + kết nối tổng bằng `flowchart` + `subgraph` (mỗi hệ một node/nhóm, tô `classDef` phân vai nội bộ/đối tác ngoài).
- **Enterprise Integration Patterns (EIP):** message channel/router/translator, pub-sub, request-reply, DLQ… — gọi tên mẫu, không mô tả chung chung.
- **Contract-first integration:** chốt hợp đồng (schema + SLA + lỗi) trước khi code adapter.
- **Data ownership / MDM:** một nguồn-sự-thật mỗi thực thể; đồng bộ có chiều.
- **Saga / orchestration-choreography:** giao dịch xuyên hệ không dùng 2PC → bù trừ (compensation).

## Tiêu chí chất lượng (BẮT BUỘC)
- **Mọi tích hợp có một dòng hợp đồng đủ cột** (giao thức + sync/async + auth + lỗi/retry/idempotency + SLA); mỗi tích hợp trace `FR`/`NFR`.
- **Mỗi thực thể chia sẻ có đúng một hệ nguồn-sự-thật** (không hai hệ cùng sở hữu — nếu có, ghi cơ chế hoà giải).
- Có **System Landscape render được** + **≥1 `sequenceDiagram`** cho luồng xuyên hệ quan trọng nhất.
- Mẫu tích hợp **khớp quy mô** — over-engineer (ESB/Kafka cho vài tích hợp đơn giản) = gap chất lượng.
- Async/đối tác ngoài → **phải có** retry + idempotency + xử lý lỗi (không giả định "luôn thành công").
- Không bịa SLA/volume/quyền sở hữu → `GĐ ⚠️ chưa xác nhận`.

## Ranh giới
- Bổ trợ `ba-architecture` (kiến trúc **nội tại** từng hệ); chỉ chạy khi tích hợp là mối quan tâm chính của dự án.

## Lưu ý
- Tài liệu sống: đổi tích hợp/đối tác → `ba-change-request`.
- **Không trùng `ba-api-spec`:** api-spec đặc tả *endpoint của hệ mình*; integration đặc tả *hợp đồng & luồng giữa các hệ* (có thể trỏ tới api-spec cho chi tiết).
- Văn phong & Thuật ngữ: footer `## Thuật ngữ` + bổ sung `00-glossary.md` (ESB, DLQ, MDM, idempotency, saga, CDC…).
- Tiếng Việt; tên hệ/giao thức giữ nguyên.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
