---
name: ba-toolkit
description: Use when cần bản đồ cả bộ BA toolkit — trình tự pipeline ý tưởng → tài liệu → plan → code và vai trò từng skill. Hỏi dự án đang ở bước nào thì dùng ba-next.
---

# BA Toolkit — Pipeline xây phần mềm

## Tổng quan
Bộ skill biến ý tưởng thô thành phần mềm qua một pipeline phân tích nghiệp vụ. Mỗi bước sinh tài liệu tiếng Việt trong `docs/`. Phần dev dùng bộ skill `dev-*` (clone từ superpowers, tự chứa trong toolkit).

**Trước khi chạy bất kỳ bước nào:** đọc `conventions.md` (cùng thư mục) để nắm cấu trúc thư mục và quy tắc. Bảng "Bản đồ file" ở đầu nó chỉ tiếp sang 4 phụ lục — `conv-gates.md` (cổng/gate/hồ sơ), `conv-mermaid.md` (sơ đồ), `conv-ledgers.md` (sổ CR/WI), `conv-registry.md` (canon máy-đọc) — **chỉ mở cái việc đang làm cần**, đừng nạp hết.

## Vòng đời BA — 4 giai đoạn (bức tranh tổng thể)
Toolkit phủ trọn vòng đời, mỗi giai đoạn có 1 orchestrator gói lại. "Thứ tự chạy" bên dưới là **lõi Giai đoạn 2**.

| GĐ | Tên | Orchestrator | Skill (đầu ra) |
|----|-----|--------------|----------------|
| **1** | **Discovery** — hiểu vấn đề & hiện trạng | `ba-discover` | `ba-vision` (00-vision) · `ba-stakeholder` (04) · `ba-brainstorm` (00-brainstorm) · `ba-persona` (00-personas) · `ba-urd` (00-urd — nhu cầu người dùng) · `ba-process` (00-process, *nếu số hóa*) |
| **2** | **Yêu cầu & Giải pháp** — biến vấn đề thành spec + plan | `ba-init` | `ba-requirements` (01) → `ba-functions` (02) → *(tùy chọn `ba-roadmap` 08 — ưu tiên/lộ trình)* → `ba-screens` (03) → mỗi màn: `ba-screen-spec`/(`ba-checklist`)/`ba-test`/(figma)/`ba-html-design` → `ba-build` (plan). Hệ thống tùy chọn: `ba-data-model` (05), `ba-api-spec` (06), `ba-design-system` (07), `ba-architecture` (10 — chốt kiến trúc, trước build), `ba-integration` (11 — nếu tích hợp nhiều hệ) |
| **3** | **Dev** — code thật từ plan | `dev-run` | bộ `dev-*` (TDD + review + verification) → **`ba-conformance`** (đối chiếu code vừa viết ↔ đặc tả: lệch / chưa làm / dev không có tài liệu) |
| **4** | **Nghiệm thu & Vận hành** | `ba-accept` | **`ba-conformance`** (chặn trước, đừng nghiệm thu bản code lệch) → `ba-uat` (09 — nghiệm thu) → `ba-release` (gói phát hành) → `ba-trace` (00-traceability — RTM) → `ba-track` → **`ba-dashboard`** (ảnh chụp trạng thái lúc ký) → `ba-portal`/`ba-doc-public` (xuất bản). Kèm `ba-change-request` (00-cr — thay đổi khi vận hành) |

**Phạm vi `docs`** (`conv-gates.md` → "Hồ sơ dự án" → "Phạm vi"): dự án **chỉ làm tài liệu BA**, không dev trong repo này — cài bằng `ba-export --scope docs` (56 skill, không có `ba-build`/`dev-run`/`ba-accept`/`ba-conformance`/`ba-feasible`/`ba-dbschema`/`ba-api-test`/`ba-test-e2e`/`ba-prototype`/`ba-auto` và `dev-*`), khai `Phạm vi: \`docs\`` ở đầu `00-tracking.md`. GĐ2 kết thúc ở `ba-html-design` (không `plan.md`); **GĐ3 = bàn giao tài liệu** (`ba-review all` → `ba-trace` → `ba-uat` tùy chọn → `ba-portal`/`ba-onepager`); không có GĐ4.

**Xuyên suốt:** `ba-review` (gate ở mọi breakpoint) · `ba-trace` (xuất RTM + soát độ phủ end-to-end) · **`ba-changelog`** (nhật ký thay đổi tài liệu ĐÃ CHỐT — bắt sửa baseline ngoài luồng CR; `ba-review all` gọi `check`) · **`ba-dashboard`** (báo cáo điều hành cho PM, chạy bất cứ lúc nào từ GĐ3) · `ba-diagram` (vẽ sơ đồ theo mô tả) · `ba-reverse` (chiều ngược: từ code → tài liệu, thay cho GĐ 1–2 khi đã có codebase).

**Ba trục soát, đừng lẫn:** `ba-review`/`ba-trace`/`ba-consistency-reviewer` soát **tài liệu ↔ tài liệu** · `ba-conformance` soát **tài liệu ↔ code** · `ba-changelog` soát **tài liệu ↔ chính nó theo thời gian** (vừa bị đổi gì). Ba trục vuông góc, không thay nhau.

> Dự án nhỏ/rõ chiến lược → bỏ GĐ 1, chạy thẳng `ba-init`. Số hóa quy trình tay → **nên** chạy `ba-discover` (có `ba-process`) trước.

## Thứ tự chạy (lõi Giai đoạn 2)
0. `ba-brainstorm` — phỏng vấn sâu IT-BA từ ý tưởng/tính năng → `docs/Ho-so/00-brainstorm.md` (tùy chọn nhưng khuyến nghị, làm đầu vào cho bước 1)
1. `ba-requirements` — ý tưởng thô / brainstorm → `docs/01-requirements.md`
2. `ba-functions` — `01-requirements.md` → `docs/02-functions.md`
3. `ba-screens` — `02-functions.md` → `docs/03-overview.md` + khung folder màn hình + `docs/00-tracking.md`
4. `ba-screen-spec` — mỗi màn hình → 6 file phân tích (ascii, brainstorm, srs, usecase, userstory, design-spec)
4b. `ba-checklist` — *(khuyến nghị)* mỗi màn hình → `checklist.md`: checklist kiểm thử **high-level** (mã `CL-S..` trace về `R-S`/`UC`/`US`), khung cho `ba-test`. Cột `checklist` trong tracking (như `e2e`, không tính 9/9).
5. `ba-test` — mỗi màn hình → `test.md` (bám các `CL-S..` của `checklist.md` nếu có; mỗi `CL` ≥1 `TC`)
5b. `ba-test-e2e` — *(tùy chọn)* sinh script Playwright `e2e/tests/<Mã>-<Tên>.spec.ts` (gốc dự án, **ngoài** `docs/`) từ `test.md` (mỗi `TC` → 1 test, giữ mã truy vết); cột `e2e` trong tracking (như `dev`, không tính 9/9). Cầu nối BA → QA automation, chạy được sau khi app deploy.
6. `ba-figma-draw` — *(tùy chọn, cần MCP Figma riêng)* đẩy **cái đã chốt** lên Figma: `push-lofi` (phương án wireframe `data-chosen` → page Wireframe) · `push` (html-design đã duyệt → page Design; **từ đây Figma là chuẩn** giao diện màn) · `pull` (kéo sửa tay trên Figma về html, chạm srs thì CR). Đối soát bằng sổ `Ho-so/00-figma-sync.md` + cột `figma` (`figma-sync.js plan|apply|verify`, phần đĩa chạy không cần Figma). `draw` = preview từ đặc tả như cũ (không ghi sổ).
7. `ba-html-design` — mỗi màn hình → `html-design.html`
8. `ba-build` — mỗi folder → `plan.md` (kế hoạch dev, dừng ở đây)
9. `dev-run` — *(người dùng trigger)* dev các màn chỉ định từ `plan.md` bằng bộ skill `dev-*`; cập nhật trạng thái test + cột `dev` trong tracking
10. `ba-track` — refresh ma trận hoặc sync tài liệu khi sửa một chức năng

> Thứ tự test↔html linh hoạt (đều chỉ phụ thuộc screen-spec); orchestrator chạy test → html. Figma đi **sau cái đã chốt**: `push-lofi` sau khi chọn phương án wireframe, `push` sau khi html-design được duyệt.
- `ba-proto-html` — cần một PROTOTYPE BẤM ĐƯỢC trong MỘT file HTML tự chứa để demo và CHỐT NGHIỆP VỤ với khách TRƯỚC khi viết đặc tả. *(TODO: mô tả kỹ hơn)*
- `ba-api-test` — kiểm thử API hai giai đoạn trong một skill: outline `ACL-..` để review **rồi HARD STOP duyệt**, sau đó sinh `api.http` bắn được (`ATC-..` trace về `ACL-..`). Gộp từ `ba-api-checklist` ngày 09/09/2026 — bước 2 vốn không chạy một mình được, tách hai chỉ tạo ra một thứ tự mà không gì bắt buộc. *(TODO: mô tả kỹ hơn)*
- `ba-api-test` — cần biến checklist kiểm thử API thành FILE CHẠY ĐƯỢC. *(TODO: mô tả kỹ hơn)*
- `ba-wireframe-lofi` — cần bản WIREFRAME HTML LO-FI (đen trắng, khối xám, chưa bàn màu sắc/thương hiệu) để chốt BỐ CỤC màn hình. *(TODO: mô tả kỹ hơn)*

## Lệnh điều phối (orchestrator) — chạy cả chuỗi trong 1 trigger

> **Mọi orchestrator (và skill ghi nhiều file: `ba-screen-spec`/`ba-requirements`/`ba-screens`/`ba-architecture`/`ba-userguide`) BẮT BUỘC qua "Cổng phương án" trước khi ghi file đầu tiên** — đọc nguồn → trình 6 phần (Đã đọc · Hiểu · Sẽ làm · Giả định · Câu hỏi chặn · Ngoài phạm vi) → chờ duyệt. Xem `conv-gates.md` → "Cổng phương án"; danh sách canon ở khóa `gate.plan.skills` của khối registry (`lint.js` soát).
- `ba-next` — **"một cửa" khi không nhớ đang ở bước nào**: script `status.js` quét `docs/` → tính giai đoạn (GĐ1→GĐ4) + trạng thái màn + gap/ADR/CR → đề xuất bước kế tiếp và chạy luôn (sau khi hỏi). Phân vân giữa các skill → cứ gọi `ba-next`.
- `ba-discover` — **giai đoạn discovery ĐỨNG TRƯỚC ba-init**: vision → bên liên quan → phỏng vấn sâu → (nếu số hóa) phân tích quy trình AS-IS/TO-BE, kèm gate. Hiểu vấn đề & hiện trạng trước khi viết yêu cầu.
- `ba-init` — khởi tạo dự án mới: chạy trọn pipeline yêu cầu→build (bước 1→8) kèm gate dò gap. Chạy sau `ba-discover` (hoặc thẳng nếu bỏ discovery).
- `dev-run` — chạy khâu dev cho các màn đã có plan: TDD + review + verification bằng bộ skill `dev-*`, cập nhật `test.md` (Trạng thái/roll-up) + cột `dev`.
- `ba-accept` — **Giai đoạn 4 (nghiệm thu & phát hành)**, chạy sau `dev-run`: `ba-uat` → chạy UAT (Pass/Fail) → `ba-release <phase>` → `ba-trace` (RTM) → `ba-track` → gate → `ba-portal`/`ba-doc-public` → ký nghiệm thu. Khép vòng đời BA.
- `ba-add-screen` — thêm 1 màn hình vào dự án đã có.
- `ba-batch` — đặc tả **nhiều màn song song**: ≥3 màn ⬜ → mỗi màn một subagent (screen-spec → test → html), main gom glossary/giả định + refresh tracking bằng script + gate một lần cuối. 1–2 màn → dùng `ba-add-screen`.
- `ba-add-feature` — thêm 1 chức năng (có thể trải nhiều màn).
- `ba-remove` — **chiều ngược**: cắt phạm vi (bỏ 1 màn · gộp 2 màn · bỏ 1 chức năng). Soi ảnh hưởng NGƯỢC (ai đang trỏ tới thứ sắp bỏ: `F`/`FR` mồ côi, cạnh điều hướng cụt, màn khác nhắc tên, UAT/CR đang mở, code đã build) → **luôn mở CR** → dọn tham chiếu TRƯỚC rồi mới bỏ → chuyển folder vào `docs/Ho-so/removed/` (không `rm`) → chứng minh sạch bằng `scan.js`.
- `ba-change-request` — quản lý trọn vòng đời một thay đổi: cấp mã vào sổ `docs/00-cr.md` → phân tích ảnh hưởng theo chuỗi truy vết → duyệt → đồng bộ mọi tài liệu → đóng CR với trace commit. Cũng dùng `list`/`status <mã>` để xem/chuyển trạng thái.
- `ba-task` — sổ **Work Item** (`docs/00-backlog.md`): theo dõi việc phát triển **KHÔNG phải CR** (tính năng mới trong phạm vi, task kỹ thuật, bug, spike) qua vòng đời `Backlog → Đang làm → Xong` (+ Blocked/Hủy), mã `WI-01`, nối trace `FR/F/S` + commit. `list`/`status <mã>`. Khác `ba-change-request` (đổi cái **đã chốt**) — đây là **việc mới/kỹ thuật**; bổ khuyết cột `dev` của tracking (chỉ roll-up theo màn).
- `ba-atlassian` ⚗️ *(thử nghiệm)* — đồng bộ sổ WI/CR ↔ **Jira** (`push` tạo issue + ghi khoá vào cột `Jira`, `pull` kéo trạng thái về, xung đột hai bên cùng đổi thì hỏi người) và đẩy một `.md` lên **Confluence** (`publish`, lần sau cập nhật đúng trang) qua Atlassian MCP; `ledger-sync.js plan` chạy được không cần MCP. Không cấp mã — chủ sổ vẫn là `ba-task`/`ba-change-request`.
- `ba-meet` — ghi chú họp thô/transcript → **biên bản họp (MoM)**: tách **quyết định `DEC`** + **action item `ACT`** (người phụ trách + hạn), mở **CR** khi action là thay đổi → `docs/Ho-so/meetings/<ngày>-<chủ-đề>.md`. Mảnh elicitation nối cuộc họp vào pipeline.
- `ba-reverse` — chiều ngược: sinh tài liệu BA **từ codebase có sẵn** (data-model/api/màn/chức năng rút từ code; requirements suy luận có đánh dấu 🔶).
- `ba-migration` ⚗️ *(thử nghiệm)* — **lộ trình tách/đổi codebase cũ** (`docs/Ho-so/00-migration.md`): `scan-coupling.js` đếm module · cạnh import · churn 90 ngày · đồng-đổi → bản đồ domain từ code (đối chiếu `F..`) → ghép nối ba chiều **mạnh · xa · hay đổi** (mức mạnh đọc code có `file:dòng`) → lộ trình `MG-..` thứ tự ghép nối cao × hay đổi cao trước, mỗi bước một slice quan sát được + tiêu chí xong đo được + quay lui → cửa một chiều mở ADR `Draft` trong `10-architecture.md`; `check-migration.js` soát hình. Sau `ba-reverse`, cạnh `ba-architecture`; khác `ba-roadmap` (tính năng theo giá trị).
- `ba-review` — bộ dò gap (độ phủ + truy vết); được orchestrator gọi ở mỗi breakpoint, hoặc chạy lẻ để rà soát. Sinh `docs/Ho-so/00-gaps.md`. Scope `diagram <file>` soát **độ phủ nghiệp vụ của sơ đồ** (thiếu vai trò/nhánh/dead-end) qua agent `ba-diagram-reviewer` — khác lint cú pháp của `ba-portal`.
- `ba-conformance` — **đối chiếu code thật ↔ tài liệu** (`docs/Ho-so/00-conformance.md`): `scan-code.js` đếm phần cơ giới (plan.md khai file gì → có trên đĩa không · TC trạng thái nào · file code nào không plan nào khai) → agent `ba-inference-reviewer` **chế độ `conformance`** đọc code phán ba hướng: **chưa làm** · **lệch** · **có code không có tài liệu**. Trục CODE — mọi skill soát khác chỉ chạy trong trục tài liệu; cột `dev` của tracking chỉ nói "đã code", không nói "code đúng đặc tả". Chạy sau `dev-run`, trước `ba-accept`.
- `ba-changelog` — **nhật ký thay đổi tài liệu ĐÃ CHỐT** (`docs/00-changelog.md`): gom hàng đợi `.claude/spec-changes.jsonl` (nhánh 0 của `hook-lint.js` ghi tự động khi file trong màn ✅ bị sửa) → `git diff` → agent `ba-change-observer` diễn giải theo **tác động nghiệp vụ** (không chép diff) + gán mã truy vết → ghi sổ, gắn cờ **`⚠️ chưa có CR`** khi đổi baseline ngoài luồng. `check` = chỉ xem. Lấp khoảng hở "sửa tài liệu mà không chạy skill nào"; **không thay** `ba-change-request` (CR duyệt TRƯỚC, changelog ghi SAU).
- `ba-trace` — xuất **ma trận truy vết (RTM)** đầy đủ `BR→StR→FR/NFR→F→S→R-S→UC/US→TC` ra `docs/Ho-so/00-traceability.md` (kèm % độ phủ mỗi tầng + yêu cầu mồ côi/màn thiếu test/ref gãy). Khác `ba-track` (ma trận *file* per-màn) và `ba-review` (chỉ findings). `ba-trace check` in gap ra chat, không ghi file.
- `ba-diagram` — **cửa vào vẽ sơ đồ**: nhận mô tả → tự CHỌN đúng loại Mermaid (swimlane/flowchart/sequence/state/erDiagram/flowchart+subgraph cho kiến trúc/journey/gantt) → vẽ đạt chuẩn (an toàn cú pháp + tô màu phân vai + đối chiếu coverage). Dùng khi yêu cầu vẽ diagram không gắn với skill có sẵn.
- `ba-userguide` — viết **cẩm nang sử dụng/vận hành** cho admin/CSKH/người dùng cuối từ tài liệu BA đã có (đọc ngược requirements/srs/usecase/test/glossary): dựng mục lục theo Diátaxis → agent `ba-manual-reviewer` soát → HARD STOP chờ duyệt → viết từng trang + **ảnh chụp APP THẬT** có callout (engine Playwright: đăng nhập + chụp + che PII; html-design chỉ là mockup tạm khi app chưa deploy, phải đánh dấu thay sau) → `docs/Ho-so/userguide/*.html` tự chứa. Bước tùy chọn GĐ4, sau UAT.
- `ba-userguide-video` — biến trang how-to **đã duyệt** thành **clip 16:9 có giọng đọc**: kịch bản `video/<slug>.script.json` (mỗi bước một cảnh, lời viết cho tai nghe, trace UC/TC) → `tts.mjs` (CLI TTS riêng) → `record.mjs` (Playwright quay app thật, ghi mốc thật) → `compose.mjs` (ffmpeg ghép tiếng theo mốc) → `check-video.js`. Media ở `.ba-video/` (gitignore).
- `ba-portal` — xuất toàn bộ `docs/` thành cổng HTML đọc được (`docs/Ho-so/portal.html`, offline) để xem/chia sẻ.
- `ba-doc-public` — đẩy một file HTML (màn hình hoặc portal) lên Vercel vào một project "tài liệu chung"; gom folder staging + index tự sinh, mỗi tài liệu một URL cố định (online, khác `ba-portal` offline).
- `ba-export` — cài toàn bộ toolkit (mọi `ba-*` + `dev-*` + agent + file hướng dẫn + folder `explain` → `explain/`) sang một dự án khác; script `install.js` zero-dependency, tự ghi khối briefing (vòng đời + bổn phận cập nhật tracking/CR) vào `CLAUDE.md` đích.
- `ba-launcher` — **màn hình (web local)** duyệt mọi skill (tab Nghiệp vụ / SKILL.md / file đồng hành, có tìm kiếm) + nút **Cài vào dự án…** mở hộp thoại chọn thư mục native rồi chạy `ba-export` (Kiểm tra → Thử khô → Cài đặt, log stream tại chỗ). Bản có giao diện của `ba-export`, cho người không muốn gõ lệnh: `node .claude/skills/ba-launcher/scripts/server.js`.
- `ba-sitemap` — trang **cho người dùng cuối** hiểu luồng màn hình: gom wireframe ASCII mọi màn + sơ đồ điều hướng (`03-overview`) + hành trình người dùng chính (rút từ `usecase`) → `docs/Ho-so/sitemap.html` tự chứa. **Orchestrator có gate**: `build.js --check` dò readiness (chặn nếu thiếu sơ đồ điều hướng / hành trình trỏ màn ma; màn thiếu ascii = gap mềm → `ba-screen-spec`) → viết hành trình → build (render qua `ba-portal --single`).
- `ba-prototype` — **prototype bấm-được** cho end user: scaffold project **Vite + React + Router** ở `prototype/`, ghép `html-design.html` mọi màn (giữ high-fi trong `<iframe>`) và nối chức năng theo `sitemap-flows` (wiring rút từ cạnh Mermaid). Chạy sau `ba-html-design` + `ba-sitemap`; script scaffold zero-dep nhưng project sinh ra cần `npm install` — hạt giống frontend dùng lại được.
- `ba-proto-first` — muốn CHỐT NGHIỆP VỤ BẰNG PROTOTYPE BẤM ĐƯỢC trước rồi mới viết đặc tả. *(TODO: mô tả kỹ hơn)*
- `ba-auto` — muốn chạy trọn chuỗi từ codebase có sẵn ra MVP trong một trigger. *(TODO: mô tả kỹ hơn)*

## Bộ skill `dev-*` (framework dev — clone từ superpowers, tự chứa)
10 skill kỷ luật dev/QA mà `ba-build`/`dev-run` dùng: `dev-writing-plans`, `dev-executing-plans`, `dev-subagent-driven-development`, `dev-dispatching-parallel-agents`, `dev-test-driven-development`, `dev-systematic-debugging`, `dev-requesting-code-review`, `dev-verification-before-completion`, `dev-finishing-a-development-branch`, `dev-using-git-worktrees`. Nội dung tiếng Anh gốc (superpowers v5.1.0), tham chiếu nội bộ đã đổi sang `dev-*` — export được cùng toolkit, không phụ thuộc plugin.
- **Họ `ac-*` (agentcode — đội agent viết code, xem `conv-gates.md` → "Đội agent"):**
- `ac-agent` — tạo/sửa một agent trong `.claude/agents/` theo hợp đồng (ai phái · nhận gì · trả về đâu · quyền), đăng ký `agents.roster`, soát bằng `check-agents.js`. Cửa vào duy nhất để thêm agent.
- `ac-verify` — chứng minh "xong" của một màn bằng agent MỚI `ac-verifier` (chạy từng `Proof` của plan, đối chiếu test ↔ test.md, cổng tầng TC) → `verification.md` → `validate-done.js` PASS/FAIL. `dev-run` bước 7b gọi; PASS mới được `dev = ✅`.
- `ac-team` — động cơ thực thi plan lớn (> 8 task) bằng ĐỘI: `batch-plan.js` chia lô nguyên tầng ~7 task, một `ac-builder` mỗi lô tuần tự, tóm tắt 4 trường, `state.js` giữ `.claude/ac-state.json` (resume đối chiếu git), hết lô → `ac-verify`. `dev-run` bước 2 đề nghị khi plan lớn.
- `ac-judge` — review diff một màn/khoảng commit/PR có cổng máy: bậc thang cơ giới (lint/typecheck/test + `scan-bypasses.js`) chạy trước, agent MỚI `ac-judge` ghi finding có `file:line` và mức 🔴🟠🟡 → verdict APPROVE/COMMENT/REQUEST_CHANGES, `review-gate.js` chặn review mơ hồ → `docs/Ho-so/reviews/`. `dev-run` bước 6 gọi thay `dev-requesting-code-review`.
- `ac-eval` — chấm điểm mức code hoàn thành đặc tả: `scan-eval.js` gom TC/AC của màn, agent MỚI `ac-evaluator` cho mỗi ca 2/1/0/— có bằng chứng, `check-eval.js` soát hình và tính lại điểm % → `docs/Ho-so/eval/<Mã>-<ngày>.md` (`all` cho cả dự án). Số so sánh được giữa lần chạy/màn/nhánh.
- `ac-memory` — trí nhớ đội dev: sổ codebase `docs/Ho-so/notes/` (INDEX đọc trước mission, Debrief ghi sau mỗi lô; `notes.js` soát mồ côi/INDEX lệch/có thể cũ) + sổ bài học `docs/Ho-so/00-lessons.md` (`lessons.js` add → candidate, người confirm, chỉ confirmed nạp vào brief `ac-builder`/`ac-team`).
- `ac-jury` ⚗️ *(thử nghiệm)* — hội đồng 3–5 `ac-juror` bỏ phiếu mù rồi nghị án cho ADR Draft / PD treo / mâu thuẫn tài liệu; `tally.js` đếm phiếu, bắt đồng thuận sớm và đổi phiếu không luận điểm; đề xuất + tin cậy + giả định phá vỡ → `docs/Ho-so/jury/`; người chốt.
- `ac-audit-web` — audit giao diện WCAG 2.1 AA · UX · Core Web Vitals cho html-design/prototype/app thật: `scan-html.js` quét tĩnh (bỏ qua shell), `lighthouse.js` đo CWV khi có Chrome (không có → "không đo được"), agent MỚI `ac-auditor` mở file/trang ghi `AU-nn` có `file:line` + tiêu chí + trace, `check-audit.js` soát hình → `docs/Ho-so/audit/<Mã|app>-<ngày>.md`. Bằng chứng cho NFR và TC Manual giao diện.
- `ac-po` — **PO đứng đầu đội tự chạy** (skill ở phiên chính, phái agent hiện có): `pick.js` xếp hàng đợi 🔴 → CR đã duyệt → màn của phase (08-roadmap) → WI, cột tự làm/HỎI; mỗi việc chạy `ba-*` → `dev-run` → `ac-eval` → `accept.js` (NHẬN chỉ khi verify PASS · review không REQUEST_CHANGES · eval ≥ 80 · tầng TC); `mission.js` giữ `.claude/ac-mission.json` (TRẢ 2 vòng → chờ người, resume đối chiếu tracking) → `docs/Ho-so/po/mission-<ngày>.md` = % việc tự chạy. Quyền PO máy-đọc `po.may`/`po.ask` (lint 33).
- `ac-ci` — PR đã mở mà CI đỏ → `inspect-checks.js` cắt log quanh dấu hiệu lỗi + đoán loại (test/lint/typecheck/build/infra) + Proof tái hiện từ workflow, lô sửa `CI-<vòng>.<n>` cho `ac-builder` theo mức tự chủ, `watch-checks.js` canh tới xanh; flaky ghi dev-notes, infra hỏi người. Chỉ đọc `gh`, không push/mở PR.

## Phân tích vấn đề & hiện trạng (tùy chọn — chạy SỚM, trước/song song requirements)
- `ba-vision` — Vision & Scope / Business Case: vấn đề, mục tiêu SMART, options + ROI, phạm vi, KPI → `docs/Ho-so/00-vision.md`; đầu vào cho `ba-requirements`.
- `ba-process` — phân tích quy trình **AS-IS → TO-BE → Gap** → yêu cầu phát sinh → `docs/Ho-so/00-process.md`; rất khuyến nghị khi số hóa quy trình chạy tay.
- `ba-persona` — **chân dung người dùng (personas) + hành trình (user journey)** → `docs/Ho-so/00-personas.md`; rút nỗi đau/nhu cầu thành ứng viên `U-..` cho `ba-urd`/`ba-requirements`. Khác `ba-stakeholder` (ai có quyền lợi/quyền lực) — đây là *người DÙNG app*.
- `ba-urd` — **Tài liệu Yêu cầu Người dùng (URD)**, solution-free: nhu cầu `UN-..` (bối cảnh · nhu cầu · kết quả mong đợi · mức quan trọng · bằng chứng) + ranh giới phạm vi + hành trình ưu tiên (có câu kiểm chứng độc lập) + ngoại lệ + ràng buộc phía người dùng + giả định + tiêu chí thành công `USC-..` → `docs/Ho-so/00-urd.md`, hoặc `ba-urd <feature>` → `docs/urd/<feature>.md`. Tầng **"người dùng cần gì"** đứng giữa discovery và `ba-requirements` (*"hệ thống phải làm gì"*); khác `ba-persona` (*người dùng là ai, đi qua bước nào, cảm xúc ra sao*).
- `ba-reverse-doc` — **chiều ngược từ TÀI LIỆU rời** (Word/PDF/ảnh/biên bản): kiểm kê nguồn → `docs/Ho-so/00-intake.md` → seed `01-requirements.md` (yêu cầu suy luận 🔶 có trích dẫn). Cửa vào khi đã có tài liệu nhưng chưa có `01`. Khác `ba-reverse` (chiều ngược từ CODE).
- `ba-flow` — cần LUỒNG NGHIỆP VỤ + DANH SÁCH MÀN SƠ BỘ ngay từ ý tưởng thô, TRƯỚC khi có 01-requirements/02-functions. *(TODO: mô tả kỹ hơn)*
- `ba-feasible` — tài liệu BA đã đủ theo ba-review nhưng CHƯA chắc viết code ra được. *(TODO: mô tả kỹ hơn)*

## Tài liệu cấp hệ thống (tùy chọn — chạy khi cần)
- `ba-stakeholder` — phân tích bên liên quan + Quyền lực/Quan tâm + RACI → `docs/Ho-so/04-stakeholders.md`.
- `ba-data-model` — mô hình dữ liệu + ERD + từ điển dữ liệu → `docs/05-data-model.md`.
- `ba-api-spec` — đặc tả API (endpoint + request/response) → `docs/06-api-spec.md`.
- `ba-design-system` — token màu/typography/spacing + component + layout + responsive → `docs/07-design-system.md`; nguồn style chuẩn cho `ba-figma-draw` và `ba-html-design`.
- `ba-architecture` — **chốt kiến trúc kỹ thuật** (stack + phân tầng + sơ đồ ngữ cảnh/khối triển khai + lưu trữ + triển khai + cross-cutting + ADR, mỗi quyết định trace `NFR`/ràng buộc) → `docs/10-architecture.md`; chạy sau `ba-functions`/`ba-data-model`/`ba-api-spec`, **trước `ba-build`/`dev-run`**. Có nó thì `dev-run` không phải hỏi stack ad-hoc.
- `ba-threat-model` ⚗️ *(thử nghiệm)* — **mô hình đe doạ bám tài liệu** (`docs/Ho-so/00-threat-model.md`): `scan-threat.js` gom tài sản nhạy cảm (05) · NFR bảo mật (01) · BRule phân quyền (srs) · `EXT` · cạnh xuyên vùng của flowchart (10/11) · nhóm checklist theo stack → ranh giới tin cậy `B..` × tài sản `A..` × kẻ tấn công theo vai → `TM-..` (STRIDE, mức, đường lạm dụng có `→`) có biện pháp trace NFR/BRule/ADR hoặc mở WI/PD; §6 checklist `SEC-<NHÓM>-nn` cho `ac-judge`; `check-threat.js` soát hình. Sau cổng chốt `ba-architecture`, trước `ba-build`; chạy lại khi đổi kiến trúc/thêm hệ ngoài.
- `ba-integration` — **kiến trúc tích hợp** khi PM nối **nhiều hệ thống** (system landscape + bảng hợp đồng tích hợp + mẫu sync/async/ESB + sở hữu dữ liệu/MDM + luồng xuyên hệ + resilience) → `docs/11-integration.md`; bổ trợ `ba-architecture` (nội tại từng hệ). Ít tích hợp → dùng §7 của `ba-architecture`, khỏi cần.
- `ba-api-integration` — **tiêu thụ API đối tác ngoài**: build-vs-buy (tự xây hay mua) + digest tài liệu API đối tác + **mapping field 3 tầng** (API đối tác ↔ mô hình dữ liệu ↔ màn) + readiness gate trước production, có cổng CHỐT (ADR) → `docs/12-api-integration.md`. Khác `ba-api-spec` (API mình phát) và `ba-integration` (kiến trúc cả cụm).
- `ba-figma-draw` — đẩy màn **đã chốt** lên Figma qua MCP Figma riêng (`push-lofi`/`push`/`pull`, sổ `Ho-so/00-figma-sync.md`, cột `figma`, plugin data + `check_drift` tới từng khối `data-el`); `draw` vẽ preview từ đặc tả (backend B `figma-mcp-go` chỉ `draw`). Gộp từ `ba-figma-design` ngày 09/09/2026.
- `ba-dbschema` — cần chuyển MÔ HÌNH DỮ LIỆU NGHIỆP VỤ thành SCHEMA VẬT LÝ cho dev. *(TODO: mô tả kỹ hơn)*

## Kế hoạch & nghiệm thu (tùy chọn — `ba-accept` điều phối GĐ4)
- `ba-roadmap` — ưu tiên chức năng (MoSCoW + RICE + Kano) + lộ trình release Now/Next/Later + **Gantt đa phase** + sơ đồ phụ thuộc → `docs/Ho-so/08-roadmap.md`; chạy sau `ba-functions` (bước 5b của `ba-init`).
- `ba-uat` — kế hoạch nghiệm thu người dùng cấp dự án (kịch bản UAT + ma trận truy vết requirement→UAT + checklist ký) → `docs/Ho-so/09-uat.md`; bổ trợ `ba-test` (per màn). Do `ba-accept` gọi ở GĐ4.
- `ba-release` — **gói phát hành theo phase**: ghép roadmap(phase) + nghiệm thu UAT(phase) → `docs/Ho-so/releases/<phase>.md`, render HTML qua `ba-portal --single` + tùy chọn đẩy `ba-doc-public`. Do `ba-accept` gọi ở GĐ4. `ba-release phase-1` / `full` / `--all`.

## Thử nghiệm ⚗️ (chưa từng chạy thật — 25/09/2026)

Canon `skills.experimental`: `ac-jury` · `ba-atlassian` · `ba-threat-model` · `ba-migration` — `ba-export` **mặc định không cài** (`--with-experimental` để cài; đích đã có thì giữ). Skill khác chỉ gợi chúng *nếu đã cài*, không phải bước bắt buộc. Cùng nhãn nhưng không phải skill: `ac-ci/scripts/inspect-comments.js` (nhánh comment của `ac-ci`, tùy chọn) và `ba-toolkit/scripts/agent-golden.js` (chỉ chạy trong toolkit). Thoát nhãn: chạy thật trên một dự án tiêu dùng và có bằng chứng bắt được lỗi thật → gỡ khỏi khoá.

## Bảo trì toolkit (dành cho người sửa skill)
- `node .claude/skills/ba-toolkit/scripts/test.js` — **bộ kiểm của chính toolkit** (zero-dep, cũng là bước 1 của CI): 3 nhóm — tự lint · mọi script chạy được trên `example/docs` · **nhóm đối kháng** nạp cho từng checker một fixture cố tình hỏng và bắt nó phải báo lỗi. Nhóm 3 mới là lý do nó tồn tại: chỉ kiểm "chạy có trơn không" thì một checker hỏng thành luôn-trả-0 vẫn làm CI xanh, và mọi gate tin nó đều mù. Chạy sau khi sửa bất kỳ script `.js` nào. Exit code = số ca hỏng.
- `node .claude/skills/ba-toolkit/scripts/trigger-eval.js --runs 3 [--only <cụm>]` — **mô tả skill có kích hoạt đúng không**: router mô phỏng (`claude -p`, đọc frontmatter thật) chấm câu trong `references/trigger-golden.jsonl`, ra độ chính xác theo cụm + ma trận nhầm; so với `trigger-golden.baseline.json`. Chạy sau khi sửa `description`. Exit = số câu sai.
- `node .claude/skills/ba-toolkit/scripts/usage.js` — **skill nào thật sự được dùng** (đọc transcript phiên trên máy, chỉ đếm tên + số lượt, không đụng nội dung hội thoại). Dùng khi cần quyết định dựa trên thói quen dùng thật thay vì cảm giác. Đọc kèm cảnh báo của chính script: số đó là thói quen **trên máy đó**.
- `node .claude/skills/ba-toolkit/scripts/lint.js` — kiểm nhất quán bộ kit (zero-dep): đếm skill khớp `CLAUDE.md`, mọi `ba-*` có trong index này + `explain/`, không ref skill/agent gãy, không trùng số doc `01–11`; **và drift nội dung** so với khối ` ```registry ` cuối `conventions.md` (canon máy-đọc): tên doc `NN-*.md` toàn repo khớp canon (số chưa khai như `12-*` cũng bị bắt), phiên bản Mermaid, tiền tố ID trong canon. Exit code = số lỗi. Chạy sau khi thêm/xóa/đổi tên skill **hoặc đổi quy ước**.
- `ba-new-skill` — cần tạo một skill MỚI cho chính bộ BA toolkit này. *(TODO: mô tả kỹ hơn)*
- `ba-dashboard` — PM/Project Lead cần một BÁO CÁO ĐIỀU HÀNH một trang về tình trạng dự án. *(TODO: mô tả kỹ hơn)*
- `ba-index` — cần TRA CỨU tài liệu BA mà không muốn đọc cả file. *(TODO: mô tả kỹ hơn)*
- `ba-figure` — cần một sơ đồ Mermaid thành HÌNH ĐEM ĐI DÙNG. *(TODO: mô tả kỹ hơn)*
- `ba-onepager` — cần MỘT tài liệu văn liền mạch về cả dự án, gói trong một trang HTML tự chứa để gửi cho lãnh đạo/khách/đối tác. *(TODO: mô tả kỹ hơn)*

## Quy tắc
- Mỗi bước đọc tài liệu cấp trên làm ngữ cảnh để giữ nhất quán.
- Sau khi tạo/sửa tài liệu một màn hình, cập nhật dòng tương ứng trong `docs/00-tracking.md`.
- Tài liệu luôn viết bằng tiếng Việt.
- Nhiều màn hình: chạy bước 4–6 cho từng màn; cần nhanh thì dùng dev-dispatching-parallel-agents.
