# Sổ Work Item (Backlog phát triển)

> Nhật ký công việc phát triển **không phải Change Request** (tính năng mới trong phạm vi, task kỹ thuật, bug, spike). Do `ba-task` quản; dòng không bao giờ bị xoá — sổ là lịch sử công việc.
> Việc **THAY ĐỔI cái đã chốt** → `docs/00-cr.md` (ba-change-request), không ghi ở đây.

| Mã WI | Ngày mở | Loại | Phụ trách | Tóm tắt | Ưu tiên | Trace (FR/F/S) | Trạng thái | Cập nhật cuối |
|-------|---------|------|-----------|---------|---------|----------------|-----------|---------------|
| WI-01 | 2026-07-29 | Task | SH-04 (IT/DevOps) | Scaffold khung dự án NestJS + Next.js theo 10-architecture §10 trước khi dev-run các màn | Must | — (nền, không màn) | Đang review | 2026-07-29 |
| WI-02 | 2026-07-29 | Tech | SH-04 (IT/DevOps) | Dựng CI/CD pipeline `test → lint → typecheck → build → deploy` (10-architecture §9) | Should | NFR-04 | Backlog | 2026-07-29 |
| WI-03 | 2026-07-29 | Spike | SH-06 (BA) | Khảo sát ngưỡng rate-limit + quy trình thoát sandbox Amazon SES trước khi code F09 | Should | F09 · NFR-04 | Blocked | 2026-07-29 |
| WI-04 | 2026-07-29 | Tech | SH-04 (IT/DevOps) | Thêm structured logging + correlation id cho toàn API | Should | NFR-04 | Backlog | 2026-07-29 |
| WI-05 | 2026-08-04 | Tech | SH-04 (IT/DevOps) | Cấu hình SPF/DKIM cho domain gửi mail trên staging (từ `ACT-03` quá hạn) | Must | F09, NFR-04 | Đang làm | 2026-08-04 |
| WI-06 | 2026-08-31 | Feature | — (chưa giao) | Hiện thực `F09` — cron 08:00 gửi email nhắc deadline (việc **phi-màn**: không màn nào chứa nó nên không `plan.md` nào build) | Must | F09 · FR-10 · NFR-04 | Backlog | 2026-08-31 |

---

### WI-01 — Scaffold khung dự án NestJS + Next.js
- **Loại:** Task
- **Nguồn:** chuẩn bị cho `dev-run` — dự án đang ở GĐ3 (tài liệu + plan đủ, kiến trúc đã chốt).
- **Mô tả & mục tiêu:** dựng bộ khung repo theo `10-architecture.md` §10 (`src/modules/{auth,task,notify,org}/`, `domain/`, `infrastructure/`, `shared/`, `tests/`) + khung Next.js (`web/app/…`) để các plan per-màn có chỗ đặt code. **Không** viết logic nghiệp vụ ở bước này.
- **Trace:** — (việc nền, không gắn `FR`/`S` cụ thể; đặt móng cho mọi màn).
- **Phạm vi dự kiến:** khung thư mục backend + frontend, config lint/typecheck, chưa đụng tài liệu BA.
- **Phụ trách:** SH-04. **Ưu tiên:** Must (chặn `dev-run`).
- **Phạm vi thực tế:** — *(điền khi Xong)*
- **Commit/nhánh:** —
- **Lịch sử trạng thái:** 2026-07-29 Backlog → 2026-07-29 Đang làm (SH-04 · bắt đầu dựng monorepo) → 2026-07-29 Đang review (SH-04 · khung repo + config lint/typecheck xong, chờ review trước khi dev-run bám).

---

### WI-02 — Dựng CI/CD pipeline
- **Loại:** Tech
- **Nguồn:** `10-architecture.md` §9 (CI/CD: `test → lint → typecheck → build → deploy`); nợ hạ tầng cần có trước khi merge code màn đầu tiên.
- **Mô tả & mục tiêu:** pipeline chạy tự động trên mỗi PR, chặn merge khi test đỏ/lint lỗi — làm nền cho gate `dev = ✅` của `dev-run`.
- **Trace:** NFR-04 (observability/CI). Không gắn màn.
- **Phạm vi dự kiến:** workflow CI, cấu hình môi trường dev/staging/prod (region `ap-southeast-1`).
- **Phụ trách:** SH-04. **Ưu tiên:** Should. **Phụ thuộc:** sau WI-01 (cần khung repo).
- **Phạm vi thực tế:** — *(điền khi Xong)*
- **Commit/nhánh:** —
- **Lịch sử trạng thái:** 2026-07-29 Backlog.

---

### WI-03 — Spike: rate-limit & thoát sandbox Amazon SES
- **Loại:** Spike
- **Nguồn:** hệ quả cổng chốt `ADR-02` (`12-api-integration.md` §7) + `ACT-06` của họp 2026-07-21 (nộp đơn thoát sandbox). Câu hỏi mở `OQ-03` (hạn mức gửi) chưa có lời.
- **Mô tả & mục tiêu:** làm rõ hạn mức gửi thực tế của SES sau khi thoát sandbox + thời gian chờ duyệt, để chốt thiết kế chia lô (`GĐ-03` ~1000 email/ngày) trước khi code F09 ở Phase 2. Kết quả = đóng `OQ-03` + cập nhật digest §3 của `12-api-integration.md`.
- **Trace:** F09 (nhắc deadline email) · NFR-04.
- **Phạm vi dự kiến:** không giao code sản phẩm — chỉ tài liệu kết luận + cập nhật `12-api-integration.md`.
- **Phụ trách:** SH-06. **Ưu tiên:** Should.
- **Blocked:** chờ `ACT-06` (SH-04 nộp đơn thoát sandbox, hạn 2026-08-04) — chưa có tài khoản SES production để đo thật. **Điều kiện gỡ:** đơn thoát sandbox được duyệt.
- **Phạm vi thực tế:** — *(điền khi Xong)*
- **Commit/nhánh:** —
- **Lịch sử trạng thái:** 2026-07-29 Backlog → 2026-07-29 Blocked (chờ ACT-06).

---

### WI-04 — Structured logging + correlation id cho toàn API
- **Loại:** Tech
- **Nguồn:** `10-architecture.md` §8 Cross-cutting ("Logging & observability | Structured log + correlation id + health-check | NFR-04"); nợ hạ tầng nền cho mọi module. Cũng gỡ vướng cho readiness `12-api-integration.md` §6 ("Correlation id trong log — cần bổ sung id phiên cron").
- **Mô tả & mục tiêu:** chuẩn hoá log dạng structured (JSON) + gắn `correlation_id` xuyên suốt mỗi request/phiên cron, để truy vết lỗi end-to-end và đo được deliverability email (F09) sau này. Làm ở tầng `shared/` dùng chung cho `auth·task·notify·org`.
- **Trace:** NFR-04 (observability). Không gắn màn cụ thể (cross-cutting).
- **Phạm vi dự kiến:** `src/shared/logger.ts` + middleware gắn correlation id; không đụng tài liệu BA.
- **Phụ trách:** SH-04 (mặc định — việc hạ tầng; đổi được). **Ưu tiên:** Should.
- **Phạm vi thực tế:** — *(điền khi Xong)*
- **Commit/nhánh:** —
- **Lịch sử trạng thái:** 2026-07-29 Backlog.

### WI-05 — Cấu hình SPF/DKIM cho domain gửi mail (staging)
- **Loại:** Tech
- **Nguồn:** **`ACT-03`** của họp 2026-07-21 (`DEC-02`) — hạn 2026-07-30, **quá hạn mà vẫn `Mở`** ở biên bản. Chuyển thành Work Item để có vòng đời theo dõi thật thay vì nằm im trong biên bản họp (gap `G35`, `ba-review` 2026-08-04).
- **Mô tả & mục tiêu:** cấu hình bản ghi SPF và DKIM cho domain gửi mail trên môi trường staging, để email của `F09` (nhắc deadline) không bị xếp vào thư rác khi thử nghiệm. Xong = gửi thử từ staging nhận được ở hộp thư chính, kèm kết quả kiểm SPF/DKIM đạt.
- **Trace:** F09 (nhắc deadline qua email) · NFR-04. Là **điều kiện kỹ thuật để thử nghiệm F09** ở Phase 2.
- **Phạm vi dự kiến:** cấu hình DNS + xác minh domain phía nhà cung cấp; không đụng code sản phẩm, không đụng tài liệu BA.
- **Phụ trách:** SH-04 (IT/DevOps). **Ưu tiên:** Must *(nâng lên — đang chặn đường thử nghiệm F09)*.
- **Quan hệ:** độc lập với `WI-03` (spike SES, đang Blocked chờ `ACT-06`) nhưng cùng phục vụ F09 — `WI-05` không chờ gì, làm được ngay.
- **Phạm vi thực tế:** — *(điền khi Xong)*
- **Commit/nhánh:** —
- **Lịch sử trạng thái:** 2026-08-04 Backlog → 2026-08-04 Đang làm (chuyển từ `ACT-03` quá hạn, giao lại hạn 2026-08-07).

---

### WI-06 — Hiện thực F09: cron nhắc deadline qua email

- **Nguồn:** `ba-feasible` 31/08/2026 — soát khả thi phát hiện `F09` **không có endpoint và không thuộc màn nào**, nên không `plan.md` nào build nó. Đây không phải lỗi tài liệu: cron chạy nền thì đúng là không cần endpoint. Vấn đề là mọi thứ trong toolkit đều đi qua màn → `plan.md`, nên việc phi-màn sẽ rơi ra ngoài nếu không có ai giữ.
- **Mô tả & mục tiêu:** job 08:00 hằng ngày, quét công việc đến hạn trong ngày hoặc quá hạn chưa hoàn thành, gửi email cho người thực hiện và người giao. Theo `ADR-04`: cron **in-process**, chưa dựng message queue.
- **Trace:** `F09` · `FR-10` · `NFR-04` · `ADR-04`.
- **Phụ thuộc (đang chặn):** `WI-03` (Spike SES — `Blocked`, chờ `ACT-06` thoát sandbox) và `WI-05` (SPF/DKIM trên staging). Không có hai cái đó thì code xong cũng không gửi được thư thật.
- **Rủi ro đã biết:** `ADR-04` ghi rõ cron in-process **trùng lịch khi chạy nhiều instance** → cần khoá phân tán ở Redis + idempotency theo `(người dùng, ngày)`; bỏ qua là người dùng nhận email trùng.
- **Lịch sử trạng thái:** 2026-08-31 **Backlog**.
