---
type: skill-explainer
group: tai-lieu-he-thong
updated: 2026-07-15
---

# Nhóm tài liệu cấp hệ thống — 11 skill tùy chọn

> Đây là những tài liệu **"cấp tổng"** (nhìn cả hệ thống, không tính theo từng màn) và **tùy chọn** — chạy khi dự án cần, không bắt buộc theo thứ tự pipeline. Bốn skill sinh một file đánh số trong `docs/` (04→07); `ba-architecture` (10) chốt kiến trúc nội tại một hệ, `ba-integration` (11) lo tích hợp nhiều hệ nội bộ, `ba-api-integration` (12) đánh giá & mapping API **đối tác ngoài**. Riêng `ba-figma-draw` là bước cấp màn: đẩy màn đã chốt lên Figma và giữ hai bên khớp nhau.

## Chọn cái nào? — bảng nhanh

| Bạn cần cho thấy... | Dùng | Đầu ra |
|---|---|---|
| Ai là các bên liên quan, ai quyền lực/quan tâm, ai chịu trách nhiệm việc gì | `ba-stakeholder` | `docs/Ho-so/04-stakeholders.md` |
| Hệ thống lưu những loại dữ liệu gì, chúng liên hệ ra sao | `ba-data-model` | `docs/05-data-model.md` |
| Backend có những endpoint nào, gọi vào ra dữ liệu gì | `ba-api-spec` | `docs/06-api-spec.md` |
| Bộ màu/font/khoảng cách/component chuẩn để mọi màn nhất quán | `ba-design-system` | `docs/07-design-system.md` |
| **Chốt kiến trúc kỹ thuật** (stack, phân tầng, sơ đồ ngữ cảnh/khối triển khai, cross-cutting, ADR) trước khi code | `ba-architecture` | `docs/10-architecture.md` |
| **Tích hợp NHIỀU hệ thống** (landscape, hợp đồng tích hợp, sync/async, MDM, luồng xuyên hệ) | `ba-integration` | `docs/11-integration.md` |
| **Tiêu thụ API ĐỐI TÁC/hệ ngoài** (payment/SSO/e-invoice…): build-vs-buy, digest doc đối tác, mapping field 3 tầng, readiness trước production | `ba-api-integration` | `docs/12-api-integration.md` |
| **Kiến trúc đã chốt hở ở đâu** (ranh giới tin cậy × tài sản × kẻ tấn công theo vai → `TM-..` có biện pháp trace, checklist bảo mật theo stack) | `ba-threat-model` ⚗️ *thử nghiệm* | `docs/Ho-so/00-threat-model.md` |
| **Lộ trình tách/đổi codebase cũ** (bản đồ domain từ code, ghép nối mạnh·xa·hay đổi, bước `MG` có tiêu chí đo được + quay lui, cửa một chiều → ADR) | `ba-migration` ⚗️ *thử nghiệm* | `docs/Ho-so/00-migration.md` |
| Đưa màn đã chốt lên Figma cho designer/khách xem, biết bản Figma còn khớp không | `ba-figma-draw` | frame trên Figma + sổ `Ho-so/00-figma-sync.md` + cột `figma` trong `00-tracking.md` |

Ba skill kỹ thuật (`ba-data-model`, `ba-api-spec`, `ba-design-system`) có một điểm chung: **càng có nhiều tài liệu pipeline trước đó (functions, srs, các màn) thì kết quả càng chính xác** — vì chúng đọc các tài liệu đó để rút ra thực thể/endpoint/token. Chạy được lúc chưa có nhiều tài liệu, nhưng sẽ phải giả định nhiều hơn.

---

## ba-stakeholder — Phân tích các bên liên quan

**Làm gì.** Lập bản phân tích các bên liên quan của dự án: **danh bạ stakeholder** (kể cả nhóm gián tiếp, dùng Onion Diagram), **ma trận Quyền lực × Quan tâm** (4 ô), đánh giá **mức tham gia hiện tại vs mong muốn** kèm hành động thu hẹp khoảng cách, và **bảng RACI** (ai Chịu trách nhiệm/Phê duyệt/Tư vấn/Được báo — đúng một người A cho mỗi quyết định).

**Khi nào dùng.** Khởi động dự án (kickoff) — muốn nắm ai là ai và lập kế hoạch giao tiếp **trước khi** đào sâu yêu cầu.

**KHÔNG dùng khi.** Bạn cần yêu cầu chức năng hay màn hình — đây là tài liệu quản trị/giao tiếp, không mô tả sản phẩm.

**Đầu vào.** `docs/01-requirements.md` (mục Stakeholder Requirements) và `docs/Ho-so/00-brainstorm.md` nếu có; chạy được cả khi chưa có (sẽ hỏi thêm).

**Đầu ra.** `docs/Ho-so/04-stakeholders.md`.

**Ví dụ.** Dự án nội bộ công ty → liệt kê Ban giám đốc, Trưởng phòng vận hành, Nhân viên nhập liệu, Bộ phận IT… + xếp Quyền lực/Quan tâm + RACI cho quyết định "chốt phạm vi".

---

## ba-data-model — Mô hình dữ liệu & ERD

**Làm gì.** Thiết kế **mô hình dữ liệu**: xác định các thực thể, thuộc tính, khóa chính/khóa ngoại, quan hệ (1-1, 1-n, n-n); chuẩn hóa tới 3NF; vẽ **sơ đồ quan hệ ERD** (bằng Mermaid) và viết **từ điển dữ liệu**; lập Ma trận CRUD để soát thực thể "mồ côi" (không chức năng nào đụng tới).

**Khi nào dùng.** Cần bức tranh dữ liệu — trước khi dựng cơ sở dữ liệu hoặc bàn giao cho dev. Đọc `02-functions.md` và các `srs.md` để rút thực thể; nếu đã có sẵn schema SQL thì dựng ERD trực tiếp từ đó.

**KHÔNG dùng khi.** Cần đặc tả cách gọi dữ liệu qua mạng (đó là `ba-api-spec` — API mô tả "cửa ra vào", data-model mô tả "kho chứa").

**Đầu vào.** `docs/02-functions.md`, các `srs.md` (mục Yêu cầu dữ liệu); tùy chọn schema SQL hoặc kết quả `ba-reverse`.

**Đầu ra.** `docs/05-data-model.md`.

**Ví dụ.** App đặt lịch → thực thể HocVien, GiaoVien, BuoiHoc, LichTrong + ERD + từ điển dữ liệu cho từng trường.

---

## ba-api-spec — Đặc tả API

**Làm gì.** Đặc tả **API (giao diện lập trình ứng dụng)** theo hướng tài nguyên (REST): suy ra danh sách endpoint có hệ thống, lập Ma trận CRUD-to-Endpoint để soát độ phủ, và với mỗi endpoint ghi rõ method, đường dẫn, tham số, request body, response, **mã trạng thái**, truy vết về chức năng `F..`. Định nghĩa một khuôn lỗi/response chuẩn dùng chung.

**Khi nào dùng.** Cần bàn giao "hợp đồng" giữa frontend và backend, hoặc trước khi dev backend. Đọc functions, các srs và (nếu có) data-model để suy ra endpoint.

**KHÔNG dùng khi.** Chưa cần tới tầng kỹ thuật gọi dữ liệu, hay bạn chỉ cần mô hình dữ liệu (đó là `ba-data-model`). Nên chạy **sau** `ba-data-model` để endpoint bám đúng thực thể.

**Đầu vào.** `docs/02-functions.md`, các `srs.md`, `docs/05-data-model.md` (nếu có).

**Đầu ra.** `docs/06-api-spec.md`.

**Ví dụ.** `POST /bookings` (đặt lịch), `DELETE /bookings/{id}` (hủy), `GET /teachers/{id}/slots` (lịch trống) + request/response + mã 200/400/409.

---

## ba-design-system — Bộ style chuẩn của dự án

**Làm gì.** Lập **nguồn style chuẩn duy nhất** cho cả dự án: token màu/typography/spacing/elevation, component, layout pattern, responsive/breakpoint, motion. Mục đích là để `ba-html-design` (và bản đẩy lên Figma) **bám theo file này**, tránh mỗi màn tự chế màu/font khác nhau. Chạy theo hai kiểu: **reverse** (đã có màn → quét html-design/design-spec, gom token, chuẩn hóa chỗ lệch) hoặc **brief** (chưa có màn → hỏi 3-4 câu về màu thương hiệu/tông/font rồi sinh token).

Ngoài token, file còn chốt ba thứ mà máy đọc được: **ngân sách** (tối đa bao nhiêu cỡ chữ, bo góc, đổ bóng, màu nhấn), **hợp đồng 7 thành phần gốc** (nút, nhãn, ô nhập, thẻ, dòng danh sách, hộp thoại, trạng thái rỗng) chốt trước màn đầu tiên, và **một bảng trạng thái nghiệp vụ** dùng chung cho mọi màn. Các khối đặc thù đã duyệt ở một màn được ghi lại ở đây để màn sau dùng lại.

**Khi nào dùng.** Muốn giao diện toàn dự án nhất quán — lý tưởng là làm sớm (brief) hoặc sau khi có vài màn (reverse để đồng bộ hóa).

**KHÔNG dùng khi.** Chỉ có một màn đơn giản, không cần chuẩn hóa. Đây **không** phải bản thiết kế một màn (đó là `ba-figma-draw`/`ba-html-design`).

**Đầu vào.** Các `html-design.html`/`design-spec.md` đã có (kiểu reverse) hoặc câu trả lời của bạn (kiểu brief).

**Đầu ra.** `docs/07-design-system.md` (không có dòng riêng trong ma trận tracking cấp màn). Tùy chọn đẩy token sang Figma.

**Ví dụ.** Chốt màu chủ đạo #2563EB, font Inter, spacing 4/8/12/16, breakpoint 768/1024 → mọi màn sau đó dùng chung.

---

## ba-architecture — Chốt kiến trúc kỹ thuật (trước khi code)

**Làm gì.** Sinh `docs/10-architecture.md` — bản **thiết kế kỹ thuật** chốt trước khi build: **stack** (ngôn ngữ/framework/DB/cache), **kiểu kiến trúc** (monolith/modular-monolith/microservices…), **phân tầng** + quy tắc phụ thuộc, **phân rã component/service** (map về `F`), **lưu trữ + cách ly tenant**, **API/auth**, **cross-cutting** (bảo mật/logging/lỗi/cache), **triển khai** (cloud/CI-CD), **cấu trúc thư mục chuẩn**, và **sơ đồ kiến trúc** (ngữ cảnh + khối triển khai, vẽ bằng `flowchart` + `subgraph`). Điểm cốt lõi: **mỗi quyết định là một ADR trace về một `NFR`/ràng buộc** — kiến trúc suy từ yêu cầu chất lượng, không chọn theo trend.

**Khi nào dùng.** Sau khi có `02-functions` (+ `05-data-model`/`06-api-spec` càng tốt), **trước `ba-build`/`dev-run`**. Đây là mắt lấp khoảng trống "ai chốt kiến trúc": trước kia stack chỉ được `dev-run` hỏi 1 câu lúc code — giờ chốt có chủ đích, có căn cứ.

> **Là BƯỚC CÓ GATE + CỔNG CHỐT**, không phải tài liệu tùy tiện: chạy → gate `ba-review architecture` (dò gap) → **cổng chốt** (bạn xác nhận quyết định → ADR chuyển *Accepted*). `ba-build`/`dev-run` **chỉ bám bản đã chốt**; còn *Draft* thì chưa được build dùng. Đổi kiến trúc sau khi chốt phải qua `ba-change-request`.

**KHÔNG dùng khi.** Dự án siêu nhỏ/1 màn rõ ràng, hoặc đã có codebase (dùng `ba-reverse` để rút kiến trúc ngược). Đừng over-engineer — MVP đừng vẽ microservices nếu không cần.

**Đầu vào.** `01-requirements` (§NFR + §Ràng buộc — driver chính), `02-functions`, và `05`/`06`/`07` nếu có.

**Đầu ra.** `docs/10-architecture.md`. `ba-build` đọc §cấu trúc thư mục để viết file path; `dev-run` đọc §stack để scaffold **không cần hỏi lại**.

**Ví dụ.** `ba-architecture` → chốt modular-monolith Next.js+NestJS+PostgreSQL+Redis, region ap-southeast-1 (PDPA), tenant row-level `org_id`, JWT RS256 — mỗi cái ADR trace NFR-01/02/06.

---

## ba-threat-model — Mô hình đe doạ: kiến trúc đã chốt bị tấn công ở đâu *(⚗️ thử nghiệm)*

**Làm gì.** Đọc kiến trúc, mô hình dữ liệu, yêu cầu và quy tắc phân quyền của từng màn rồi trả lời ba câu: hệ thống có những "cửa" nào giữa các vùng tin cậy khác nhau (trình duyệt ↔ API, API ↔ cơ sở dữ liệu, hệ mình ↔ đối tác), thứ gì đáng bị lấy/sửa/làm ngưng (mật khẩu, token, dữ liệu của tổ chức khác…), và ai — kẻ lạ, thành viên thường, quản trị, người vận hành — có thể đi qua cửa nào để làm hại thứ gì. Mỗi kịch bản là một dòng `TM-..` có mức, có biện pháp trỏ về yêu cầu/quy tắc/quyết định kiến trúc đã chốt, hoặc mở việc (WI/PD) khi chưa có. Kèm checklist bảo mật đúng stack để đội review code soi có chủ đích. Máy gom nguyên liệu và soát hình; người/LLM chỉ ghép thành kịch bản.

**Khi nào dùng.** Ngay sau `ba-architecture` chốt ADR, trước `ba-build`; chạy lại khi đổi kiến trúc, thêm hệ ngoài, thêm màn có phân quyền. Dự án chỉ bàn giao tài liệu vẫn dùng — đây là tài liệu đội build cần.

**Khác skill gần kề.** `ba-architecture` quyết dựng thế nào; skill này hỏi dựng thế thì hở chỗ nào. `ba-review` soát tài liệu đủ/thiếu, không soát bảo mật. `ac-judge` review code — dùng checklist §6 của tài liệu này. `ba-api-integration` có readiness cho từng đối tác; ở đây đối tác chỉ là một cửa trong bức tranh chung.

---

## ba-migration — Lộ trình tách/đổi một codebase cũ, đi từng lát *(⚗️ thử nghiệm)*

**Làm gì.** Nhìn vào code đang có và trả lời bốn câu: *code đang chia thành những mảng nghiệp vụ nào* (bản đồ domain, đối chiếu với danh sách chức năng `F..`), *mảng nào dính mảng nào và dính chặt tới đâu* (máy đếm số chỗ gọi nhau và số lần sửa trong 90 ngày; người đọc code xếp mức nặng/nhẹ, có bằng chứng dòng code), *tách theo thứ tự nào* (lộ trình `MG-01…`, mỗi bước là một thứ người dùng/vận hành thấy được — ví dụ "màn đơn hàng đã chạy trên hệ mới" — kèm tiêu chí xong bằng con số, rủi ro và cách quay lui), và *quyết định nào không quay lại được* (tách cơ sở dữ liệu hay giữ chung, làm lại từ đầu hay chuyển dần…) — mỗi cái mở một ADR nháp để `ba-architecture` chốt. Ghi `docs/Ho-so/00-migration.md`; máy soát lộ trình có đủ hình trước khi bàn giao.

**Khi nào dùng.** Tiếp quản một hệ thống cũ, đập cũ xây mới, tách hệ thống lớn thành nhiều phần hay gộp lại, đổi công nghệ nền — sau khi `ba-reverse` đã dựng tài liệu từ code, trước hoặc song song với `ba-architecture`.

**Khác skill gần kề.** `ba-reverse` mô tả *cái đang có*; `ba-migration` nói *đổi thế nào và theo thứ tự nào*. `ba-architecture` chốt *điểm đến*; `ba-migration` vẽ *đường đi* và chỉ mở ADR nháp. `ba-roadmap` xếp *tính năng* theo giá trị cho PO; `ba-migration` xếp *mảng code* theo độ dính cho đội kỹ thuật. `ba-integration` lo nhiều hệ thống ngang hàng nói chuyện với nhau; `ba-migration` lo một hệ thống đang bị tách từ bên trong.

---

## ba-integration — Kiến trúc tích hợp (khi nối nhiều hệ thống)

**Làm gì.** Sinh `docs/11-integration.md` — bức tranh **nối nhiều hệ**: **system landscape** (flowchart + subgraph, zoom-out cả cụm), **bảng hợp đồng tích hợp** (mỗi tích hợp: nguồn→đích, giao thức, **sync/async**, dữ liệu, SLA, auth, **lỗi+retry+idempotency**, chủ sở hữu), **mẫu tích hợp** (API gateway/ESB/event-bus/batch), **sở hữu dữ liệu & master data** (hệ nào là nguồn-sự-thật), **luồng xuyên hệ** (`sequenceDiagram`), **resilience** (circuit breaker/DLQ/versioning) và rủi ro tích hợp.

**Khi nào dùng.** Phần mềm **tích hợp nhiều hệ thống** — nhiều hệ nội bộ + đối tác ngoài (ERP/CRM/payment/SSO…) hoặc landscape microservice, khi integration là mối quan tâm chính. Bổ trợ `ba-architecture`: architecture lo *nội tại từng hệ*, integration lo *nối các hệ*. Cũng là **bước có gate + cổng chốt** (hợp đồng tích hợp *Accepted* mới cho build/dev bám), nhất là cam kết với đối tác ngoài.

**KHÔNG dùng khi.** Chỉ tích hợp 1–2 hệ đơn giản → khai §7 (API/tích hợp) của `ba-architecture` là đủ, khỏi dựng doc riêng. Đừng over-engineer (ESB/Kafka cho vài tích hợp đơn giản).

**Đầu vào.** `02-functions` (chức năng chạm hệ ngoài), `01-requirements` (SLA/bảo mật/dữ liệu ở đâu), + `05`/`06`/`10` nếu có.

**Đầu ra.** `docs/11-integration.md`. `ba-api-spec` chi tiết endpoint tự phát; `dev-run` scaffold adapter/stub theo bảng hợp đồng.

**Ví dụ.** Hệ bán hàng nối ERP (tồn kho, sync REST), Payment (webhook async + idempotency), SSO (OIDC), DWH (event) → landscape + bảng hợp đồng + sequence đặt-hàng→thanh-toán→trừ-kho + MDM (ERP sở hữu tồn kho, Hệ sở hữu đơn hàng).

---

## So sánh nhanh: data-model vs api-spec vs design-system

Ba tài liệu kỹ thuật này dễ nhầm — mỗi cái trả lời một câu hỏi khác nhau:

- **`ba-data-model`** — "hệ thống **lưu** cái gì?" (kho dữ liệu, thực thể, quan hệ).
- **`ba-api-spec`** — "làm sao **lấy ra / ghi vào** dữ liệu đó qua mạng?" (endpoint, request/response). Bám lên data-model.
- **`ba-design-system`** — "mọi màn **trông** thế nào cho nhất quán?" (màu, font, component). Không liên quan dữ liệu.

Một dự án đầy đủ thường cần cả ba, không phải chọn một.

---

## ba-api-integration — Đánh giá & mapping API đối tác ngoài

**Làm gì.** Khi phần mềm phải gọi API của bên thứ ba (thanh toán, đăng nhập Google, hóa đơn điện tử, vận chuyển…), skill này dựng `docs/12-api-integration.md`: (1) **tự xây hay mua** — so chi phí/thời gian/rủi ro tuân thủ rồi chốt bằng một quyết định ADR; (2) **tóm tắt tài liệu API của đối tác** — chỉ phần dùng thật (auth, endpoint, webhook, mã lỗi, rate-limit); (3) **bảng mapping 3 tầng** — field của đối tác ↔ dữ liệu của mình ↔ chỗ hiển thị trên màn, kèm phép đổi đơn vị/định dạng; (4) **checklist sẵn sàng production** (retry, idempotency, fallback khi đối tác sập…). Kết bằng cổng CHỐT như một quyết định kiến trúc.

**Khi nào dùng.** Có tích hợp API bên ngoài cần cân nhắc mua/xây và cần đặc tả rõ cách tiêu thụ. Khác `ba-api-spec` (API *mình* phát ra) và `ba-integration` (kiến trúc *cả cụm* hệ thống).

## ba-figma-draw — Đưa màn đã chốt lên Figma và giữ hai bên khớp nhau

**Làm gì.** Đẩy lên Figma **cái đã chốt**, không phải bản nháp: designer và khách mở Figma là thấy đúng thứ đội đã duyệt. Có hai nấc:

| Nấc | Đẩy cái gì | Lên đâu | Khi nào |
|---|---|---|---|
| `push-lofi` | Phương án bố cục đen trắng mà người đã chọn ở `ba-wireframe-lofi` | page **Wireframe** (xám) | sau khi chọn phương án (vd "S05: B") |
| `push` | Bản `html-design` đã duyệt, mỗi trạng thái (mặc định, đang tải, rỗng, lỗi…) một khung | page **Design** | sau khi người trả "ok" ở bước `ba-html-design` |

**Sau nấc 2, Figma thành bản chuẩn của giao diện màn đó.** Từ đây ai muốn đổi giao diện thì sửa trên Figma, rồi chạy `pull` để **kéo phần sửa về** bản html. Khi kéo về, skill tự phân loại: chỉ đổi cách trình bày (màu, khoảng cách) → ghi một việc vào sổ backlog; còn thêm/bớt khối, đổi nhãn, câu thông báo, quy tắc nghiệp vụ → đó là đổi bản đã chốt, phải **mở Change Request** trước. `srs.md` vẫn là chuẩn của **nghiệp vụ** — Figma không được đổi nghiệp vụ lặng lẽ.

**Máy theo dõi bản Figma còn khớp không.** Mỗi lần đẩy, skill ghi vào sổ `docs/Ho-so/00-figma-sync.md` (khung nào, khớp với bản html nào, ngày nào) và cột `figma` trong `00-tracking.md`: `⬜` chưa đẩy · `🔲` đã đẩy bản đen trắng · `✅` bản hoàn chỉnh đang khớp · `⚠️` html bị sửa sau khi đẩy mà không qua Figma (cố ý đổi thì đẩy lại, không thì hoàn tác) · `✋` có người sửa tay trên Figma, chưa kéo về. Việc so phía tài liệu chạy **không cần mở Figma** (`figma-sync.js plan docs` báo màn nào chưa đẩy, màn nào html đã đổi); việc dò ai sửa gì trên Figma thì cần plugin Figma đang mở. Đối soát đi tới **từng khối** trên màn — mỗi khối mang cùng số với bảng phần tử trong `srs.md`.

**Đường cũ vẫn còn.** Dự án chưa dựng html-design thì chế độ `draw` vẽ một bản **xem trước** từ đặc tả lên page Preview như trước, ghi node vào mục `## Bản Figma (preview)` của `design-spec.md` — không ghi sổ, không tính là bản đã chốt.

**Cách vẽ.** Vẽ **bằng JavaScript trong sandbox** qua một tool `figma_write` duy nhất của MCP Figma riêng, thay vì hàng chục tool nhỏ. Skill lo phần **nối vào pipeline BA** (đẩy nguồn nào · ghi lại vào đâu · đối soát · điểm dừng chống bịa số liệu); phần **kỹ thuật vẽ** thì trỏ sang `figma_docs` của MCP thay vì chép lại.

**Hai backend, một skill.** Trước 09/09/2026 đây là hai skill riêng — `ba-figma-draw` cho MCP Figma riêng, `ba-figma-design` cho `figma-mcp-go`. Chúng **cùng mục tiêu, cùng đầu vào, cùng chỗ ghi kết quả**; khác đúng một thứ là bộ tool MCP. Tách làm hai buộc mọi skill khác phải mang theo câu "dùng cái này hay cái kia", trong khi `figma_status` trả lời được trong một lệnh. Nay skill tự dò rồi chọn — nhưng **chỉ backend A đẩy/kéo/đối soát được** (cần dữ liệu gắn vào khung Figma mà bản Go không có); backend B chỉ còn vẽ xem trước:

| | Backend A | Backend B |
|---|---|---|
| MCP | MCP Figma riêng *(mặc định)* | `figma-mcp-go` (bản Go) |
| Cách vẽ | một tool `figma_write` + JavaScript trong sandbox | nhiều tool nhỏ (`create_frame`, `set_auto_layout`…) |
| Chế độ | `push-lofi` · `push` · `pull` · `draw` | chỉ `draw` |
| Không có MCP nào | bỏ qua bước Figma, đi thẳng `ba-html-design` — không chặn pipeline | |

**Vì sao skill này cố ý MỎNG.** Tri thức *vẽ* (quy trình, các bẫy API, tiêu chí "đẹp") **không nằm trong skill** — nó nằm trong `figma_docs` của chính MCP, và skill chỉ ra lệnh đọc nó ở dòng đầu tiên. Lý do: `figma_docs` đi theo MCP nên luôn khớp phiên bản đang chạy và tới được mọi dự án, còn một `SKILL.md` chép lại sẽ trôi lệch ngay khi MCP sửa. Skill chỉ giữ thứ MCP không thể biết: **màn này thuộc dự án BA nào, đọc đặc tả nào, ghi kết quả về đâu, khi nào phải dừng lại hỏi**.

**Bài học đắt nhất — và nó không phải "audit không đáng tin".** Từng có hai màn hỏng thật (một tràn khung, năm bề mặt không padding) mà vẫn được báo "0 vấn đề". Nguyên nhân **không phải** audit bỏ sót: nó **có** bắt, nhưng kết quả nằm ở `a.summary.issues`, còn người gọi đọc `a.issues` — trả về `undefined`, nhìn y hệt một màn sạch. Rút ra hai điều tách bạch: (1) **đọc đúng trường** thì audit bắt được mọi lỗi đo được; (2) audit vẫn **không biết thế nào là xấu**, nên bắt buộc thêm vòng **chụp ảnh và nhìn bằng mắt** — một màn dày thường cần 2–5 vòng.

**Hai cái bẫy vận hành mà người dùng toolkit hay dính.** `setupTokens` **upsert theo tên vào collection đang có**, nên lập token cho dự án mình có thể **ghi đè im lặng biến của dự án khác trong cùng file Figma** (đo thật: mất 3 biến màu, chỉ khôi phục được bằng version history) — vì vậy skill bắt tạo collection riêng `<Dự án>/Tokens`. Và **MCP dò design system theo cwd**: vẽ màn của dự án nào thì phải mở phiên trong thư mục dự án đó, chạy sai chỗ là lấy nhầm hệ màu.

## ba-dbschema — Từ mô hình dữ liệu xuống bản thiết kế cơ sở dữ liệu

**Làm gì.** `ba-data-model` mô tả dữ liệu bằng **ngôn ngữ nghiệp vụ**: có thực thể "Công việc", có thuộc tính "deadline kiểu ngày giờ, bắt buộc". Lập trình viên thì cần biết chính xác hơn: lưu kiểu gì, dài bao nhiêu, đánh chỉ mục ở cột nào. Skill này bắc cây cầu đó — sinh ra **bản thiết kế cơ sở dữ liệu** mở được trên dbdiagram.io để cả nhóm nhìn và duyệt **trước khi ai đó gõ lệnh tạo bảng thật**.

**Khi nào dùng.** Sau khi mô hình dữ liệu đã ổn, trước hoặc song song với bước lập kế hoạch code.

**Nó tự chặn khi nào.** Không biết một trường có bắt buộc hay không, không biết danh sách giá trị của một trường lựa chọn → **hỏi, không đoán**. Giá trị bịa ra ở bước này sẽ chui thẳng vào cơ sở dữ liệu thật rồi rất khó gỡ.

**Điều đáng lưu ý.** Skill có kiểm lại hai chiều: mọi thực thể và thuộc tính trong tài liệu đều phải có mặt trong bản thiết kế, và ngược lại bản thiết kế không được có bảng nào tài liệu chưa nhắc tới. Nó cũng bắt vài lỗi kinh điển — ví dụ lưu tiền bằng kiểu số thực (làm tròn sai tiền).

**Khác skill gần kề.** `ba-data-model` là tầng nghiệp vụ; `ba-build`/`dev-run` mới là tầng code thật.


## Xem thêm

- `01-pipeline-core.md` — dây chuyền chính mà các tài liệu này bổ trợ.
- `README.md` — index + bảng chọn theo tình huống.
