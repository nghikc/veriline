---
name: ba-architecture
description: Use when đặc tả giải pháp đã đủ và cần CHỐT kiến trúc kỹ thuật trước build — stack, phân tầng, component, triển khai, ADR trace NFR; sinh docs/10-architecture.md.
---

# ba-architecture — Kiến trúc giải pháp/kỹ thuật (Solution/Technical Architecture)

## Mục tiêu
Sinh `docs/10-architecture.md` — **CHỐT kiến trúc kỹ thuật trước khi build**, để `ba-build`/`dev-run` hiện thực theo một bản thiết kế có căn cứ thay vì tự chọn stack lúc code. **Nguyên tắc gốc:** mỗi quyết định kiến trúc **trace về NFR/ràng buộc** trong `01-requirements.md` — kiến trúc là **hệ quả của yêu cầu chất lượng**, không phải sở thích công nghệ. Đây là mắt còn thiếu giữa *đặc tả giải pháp* (functions/data-model/api) và *build/dev*.

## Điều kiện
- **Cần:** `01-requirements.md` (§NFR + §Ràng buộc), `02-functions.md`.
- **Nên có:** `05-data-model.md`, `06-api-spec.md`, `07-design-system.md`, `08-roadmap.md` (chia phase → kiến trúc có thể tiến hoá theo phase, đừng dựng full ngay cho MVP).
- Thiếu **NFR đo được** → chốt kiến trúc thiếu căn cứ; route `ba-requirements` bổ sung NFR trước.

## Quy trình
1. Đọc `conventions.md` + `conv-gates.md`; `01-requirements.md` (§NFR + §Ràng buộc), `02-functions.md`; `05`/`06`/`07`/`08` nếu có. Có `07-design-system.md` → lấy token màu cho sơ đồ.
1b. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Khác **Cổng chốt kiến trúc** ở cuối (chốt *quyết định* trong doc đã viết): cổng này chạy **trước khi viết**, để duyệt *cách tiếp cận*. Đọc xong nguồn ở bước 1 → trình phương án đủ 6 phần: các **driver kiến trúc** rút được từ NFR/ràng buộc, **2–3 hướng kiến trúc đang cân nhắc** (monolith/modular/service; managed vs self-host…) kèm đánh đổi, doc sẽ TẠO (`10` + có `11`/`12` không), ADR dự kiến, câu hỏi chặn (ngân sách/đội ngũ/hạ tầng sẵn có). `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy**. Duyệt hướng trước rồi mới viết — rẻ hơn nhiều so với viết xong cả `10-architecture.md` mới phát hiện chọn sai hướng. **Gọi từ `ba-init` (đã qua cổng tổng) → in phương án rút gọn rồi chạy tiếp, KHÔNG hỏi duyệt lại** (`conv-gates.md` → "Cổng cha bao phủ cổng con"); **Cổng chốt kiến trúc ở cuối thì KHÔNG bao giờ được bỏ** — đó là cổng *quyết định*, không phải cổng *phương án*.
2. **Rút DRIVERS kiến trúc:** mỗi `NFR`/ràng buộc → một yêu cầu kiến trúc cụ thể. Vd: `NFR-01 p95≤2s@200` → caching + index + connection pool; `NFR-06 tenant isolation` → schema/row-level tách tenant; ràng buộc "dữ liệu VN/SG (PDPA)" → chọn region; "MVP 3 tháng" → tránh over-engineer.
3. **Chốt quyết định — mỗi quyết định lớn là 1 ADR** theo khuôn §11 của `template.md` (Bối cảnh → Driver → ≥2 Phương án → Quyết định + *vì sao không* từng phương án bị loại → Hệ quả **tách tốt/xấu, ≥1 xấu** → Người quyết `SH-..` → Liên kết). **Tên ADR là cụm danh từ nêu điều đã chọn**, không phải câu hỏi. Quyết định nhỏ → **ADR gọn** một đoạn (Y-statement) trong cùng mục. Các quyết định phải có ADR:
   - **Stack:** ngôn ngữ/framework FE + BE, DB, cache, queue, storage… + lý do.
   - **Kiểu kiến trúc:** monolith / modular-monolith / microservices / serverless — **khớp quy mô & ràng buộc**, đừng over-engineer MVP.
   - **Phân tầng** (presentation / application / domain / infrastructure) + **quy tắc phụ thuộc** (tầng trong không biết tầng ngoài).
   - **Phân rã component/service:** map về `F`/module, ranh giới rõ.
   - **Dữ liệu:** lưu trữ chính, cách ly tenant, migration, backup/retention (link `05-data-model.md`).
   - **API/tích hợp:** kiểu (REST/GraphQL/RPC), **auth/authz** (JWT/session/RBAC), versioning, hệ ngoài (link `06-api-spec.md`).
   - **Cross-cutting:** xác thực/phân quyền, logging & observability, xử lý lỗi thống nhất, cache, bảo mật (map `NFR-02/03/06`), i18n, rate-limit.
   - **Triển khai:** topo (cloud theo ràng buộc), môi trường dev/staging/prod, CI/CD, IaC, giám sát.
   - **Cấu trúc thư mục chuẩn** (`src/` layout) — **nguồn cho file path** trong `ba-build` plan và scaffold `dev-run`.
4. **Sơ đồ kiến trúc (Mermaid):**
   - **Phân tầng + Container/khối triển khai** → **`flowchart TB` + `subgraph`**: mỗi `subgraph` = một tầng/vùng (presentation/application/domain/infra), node = thành phần, tô `classDef` theo vai. Node database dùng dạng trụ `id[("PostgreSQL")]`, hàng đợi/cache `id[/"Redis"/]`. **KHÔNG dùng `architecture-beta`** (render `-beta` không ổn định, vỡ với ký tự `+ . - / ( ) :`, không tô `classDef`). Nhãn bọc `"..."` cho an toàn cú pháp.
   - **Context** (hệ thống ↔ actor/hệ ngoài) → **`flowchart LR` + `subgraph`**: actor người dùng, hệ thống mình, hệ ngoài mỗi cái một node, tô `classDef` theo vai (`:::startend` người dùng · `:::task` hệ mình · `:::external` hệ ngoài); cạnh có nhãn mô tả quan hệ. **KHÔNG dùng `C4Context`** (render kém ổn định). Tùy chọn zoom sâu thành phần chính bằng một `flowchart` phân tầng riêng.
   - An toàn cú pháp; sơ đồ phức tạp (≥3 vùng/lồng sâu) → `ba-review diagram docs/10-architecture.md` (agent coverage).
5. **Rủi ro kiến trúc + đánh đổi (trade-offs)** + phương án dự phòng (vd đổi DB nếu quy mô vượt).
6. **Xác nhận giả định (BẮT BUỘC)** khi tự đoán (stack chưa chốt, quy mô thật, ngân sách) → đánh số `GĐ-..` + chạy vòng "Xác nhận giả định" (`conventions.md`); batch → `⚠️ chưa xác nhận`.
7. Viết `docs/10-architecture.md` theo `template.md`.
7b. **Soát hình ADR (cơ giới, trước cổng chốt):** `node .claude/skills/ba-architecture/scripts/check-adr.js docs --plain` — tiêu đề không phải câu hỏi · có Trạng thái + Ngày khi Accepted · ≥2 phương án + "vì sao không" · **có hệ quả xấu** · trace ≥1 NFR/ràng buộc · Superseded trỏ ADR có thật · ≤ 500 từ. Sửa hết lỗi rồi mới trình cổng chốt; script chỉ đo hình, không phán quyết định.
8. **Cổng CHỐT kiến trúc (BẮT BUỘC):** trình người dùng **bảng quyết định lớn** (stack · kiểu kiến trúc · lưu trữ/tenant · auth · tích hợp chính) + danh sách **ADR** → hỏi xác nhận (AskUserQuestion: **Chốt / Sửa / Hoãn**). **Chỉ khi Chốt** → đánh mọi ADR trạng thái **Accepted** + ngày; đây là mốc `ba-build`/`dev-run` được phép bám. **Sửa** → cập nhật quyết định rồi chốt lại. **Hoãn** → giữ ADR **Draft**, KHÔNG cho build/dev dùng; hoãn vì *chưa đủ tin* (không phải thiếu dữ liệu) → nếu đã cài `ac-jury` (skill thử nghiệm, không cài mặc định) thì đề nghị `ac-jury <ADR>` (hội đồng bỏ phiếu mù, trả đề xuất + giả định phá vỡ, người vẫn chốt) — không có thì người chốt thẳng, không phải bước bắt buộc. *(Chế độ batch không hỏi được → giữ **Draft** + đánh dấu `⚠️ chưa chốt`; gate `ba-review architecture` sẽ báo 🟡 để nhắc chốt.)*
9. **Bàn giao:** chỉ dùng bản **ADR Accepted** — `ba-build` đọc §cấu trúc thư mục + phân tầng để viết file path; `dev-run` đọc §stack (không hỏi ad-hoc nữa).

## Kỹ thuật áp dụng
- **Quality-Attribute-Driven Design (ATAM-lite):** kiến trúc suy từ NFR (thuộc tính chất lượng), không chọn công nghệ theo trend.
- **ADR (Architecture Decision Record):** mỗi quyết định lớn ghi Bối cảnh (lực ép) → Driver → Phương án → Quyết định → Hệ quả tốt/xấu; **bất biến** — đổi ý thì ADR mới `Superseded bởi`, không sửa ADR cũ (quyết định cũ vẫn đúng với những gì biết lúc đó); sửa qua CR. Khuôn đối chiếu với MADR/Nygard/Y-statement (create-adr, tech-leads-club) — lấy phần *hình* (driver có chữ, mặt xấu bắt buộc, vì-sao-không), **không** lấy phần tách mỗi ADR một file (`docs/adr/NNN-*.md`): toolkit giữ ADR trong `10-architecture.md` §11 vì bảng số tài liệu cố định và portal render theo tài liệu.
- **Kiến trúc nhiều mức (tinh thần C4):** ngữ cảnh → phân tầng/khối triển khai → (thành phần) — mô tả nhiều mức trừu tượng, dễ đọc cho cả kỹ thuật lẫn nghiệp vụ. **Render bằng `flowchart` + `subgraph`** (không dùng notation `C4Context`).
- **YAGNI / Fitness for purpose:** khớp quy mô & ràng buộc — MVP đừng microservices/K8s nếu chưa cần; ghi rõ chỗ cố ý chừa mở rộng.

## Tiêu chí chất lượng (BẮT BUỘC)
- **Mỗi quyết định kiến trúc lớn có ADR + trace ≥1 `NFR`/ràng buộc** — không "chọn X vì thích/quen".
- **Mỗi ADR qua `check-adr.js` 0 lỗi:** tên là điều đã chọn · ≥2 phương án thật + vì sao không · **có ít nhất một hệ quả xấu** · có ngày khi Accepted. ADR không có mặt xấu là ADR không ai tin — và người sau sẽ đụng mặt xấu đó dù có ghi hay không.
- **Stack + cấu trúc thư mục cụ thể** đủ để `ba-build` viết file path và `dev-run` scaffold **KHÔNG cần hỏi lại**.
- Có **≥ sơ đồ ngữ cảnh + sơ đồ phân tầng/khối triển khai render được** (`flowchart` + `subgraph`); mục cross-cutting **phủ NFR bảo mật/hiệu năng/khả dụng**.
- **Không over-engineer:** kiểu kiến trúc khớp quy mô MVP/ràng buộc; over-engineer = gap chất lượng.
- **Không bịa:** thiếu thông tin (quy mô thật, ngân sách, SLA) → `GĐ ⚠️ chưa xác nhận`, không chốt như thật.

## Ranh giới
- Chạy sau `ba-functions`/`ba-data-model`/`ba-api-spec`, trước `ba-build`/`dev-run`.
- **ADR ≠ RFC.** ADR ghi quyết định **đã chốt** (hoặc đang chốt ở cổng); phần *đề xuất để bàn* của toolkit là **Cổng phương án** (bước 1b) và sổ `PD` (`00-decisions.md`) — không có skill RFC riêng. Quyết định chưa ai chốt → ADR ở `Draft`, hoặc ghi vào sổ `PD` với người quyết, chứ không viết ADR Accepted.

## Lưu ý
- **Tích hợp NHIỀU hệ thống:** §7 (API/tích hợp) chỉ đủ cho vài hệ. Integration là mối quan tâm chính (nhiều hệ nội bộ + đối tác) → dựng riêng **`ba-integration`** → `docs/11-integration.md` (system landscape + hợp đồng + MDM + luồng xuyên hệ); sơ đồ ngữ cảnh ở đây là zoom-in một hệ, landscape ở đó là zoom-out cả cụm.
- **Tài liệu sống:** kiến trúc đổi → qua `ba-change-request` (thêm ADR mới / đánh dấu ADR cũ "superseded"), không sửa lịch sử ADR.
- **`dev-run`:** có `10-architecture.md` → đọc stack/cấu trúc từ đây, **KHÔNG hỏi 1-câu ad-hoc**; chỉ ghi *lệnh thực tế* (test/lint/typecheck) vào `dev-notes.md`. Thiếu file này → `dev-run` fallback hỏi stack như cũ.
- **Văn phong & Thuật ngữ:** footer `## Thuật ngữ` + bổ sung `00-glossary.md` (ADR, tenant, IaC, sơ đồ ngữ cảnh…). Mở rộng viết tắt lần đầu.
- Tiếng Việt; tên kỹ thuật (framework/service) giữ nguyên.
- **Sau cổng chốt** (ADR Accepted), *nếu đã cài* (skill thử nghiệm, tùy chọn) → `ba-threat-model`: kiến trúc vừa chốt hở ở đâu — ranh giới tin cậy × tài sản × kẻ tấn công theo vai → `docs/Ho-so/00-threat-model.md`, checklist bảo mật theo stack cho `ac-judge`. Mỗi `TM` bám NFR/BRule/ADR có thật; chưa có biện pháp thì mở WI/PD, không bịa.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
