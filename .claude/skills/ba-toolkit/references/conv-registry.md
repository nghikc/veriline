# Phụ lục — Registry máy-đọc (BA Toolkit)

> Phụ lục của `conventions.md` (cùng thư mục). **Chỉ `lint.js` đọc file này** — không skill nào cần nạp nó, đó là lý do nó không nằm trong `conventions.md`: 55 skill từng nạp 57 dòng canon máy-đọc mà không skill nào dùng.
> Tên mục giữ nguyên văn nên tham chiếu `conventions.md` → "Registry" vẫn đúng địa chỉ.

## Registry (khối MÁY-ĐỌC — nguồn cho `lint.js`)
Khối dưới là **bản canon rút gọn** của các quy ước hay bị nhân bản: `node .claude/skills/ba-toolkit/scripts/lint.js` đọc khối này rồi đối chiếu **toàn repo** (skills, agents, explain, CLAUDE.md, README, example) — chỗ nào lệch sẽ báo lỗi kèm `file:line`. **Đổi quy ước → sửa khối này + phần văn bản tương ứng ở trên**; quên một vế thì lint sẽ nhắc.

```registry
# key = value (cách nhau bằng khoảng trắng). Dòng # là chú thích.
mermaid.versions = 11.16
id.prefixes = BR StR FR NFR BRule TR F S R UC US TC CL CR WI ADR GĐ SH BO GWT OQ UAT EXT DEC ACT PS U UN USC E RB PD ACL ATC LS J TM MG AU PO UE
doc.00 = brainstorm tracking gaps glossary cr backlog vision process traceability intake personas urd introduction changelog conformance dashboard flows decisions onepager lessons threat-model migration figma-sync
doc.01 = requirements
doc.02 = functions
doc.03 = overview
doc.04 = stakeholders
doc.05 = data-model
doc.06 = api-spec
doc.07 = design-system
doc.08 = roadmap
doc.09 = uat
doc.10 = architecture
doc.11 = integration
doc.12 = api-integration
screen.files = ascii-screen brainstorm srs usecase userstory design-spec html-design checklist test plan e2e
# Script E2E là CODE, không phải tài liệu → nằm ngoài docs/, ở gốc dự án (từ 31/08/2026).
# Script phân giải qua e2epath.js — vẫn tìm trong folder màn cho dự án cài trước mốc đó.
e2e.dir = e2e/tests
e2e.file = <Mã>-<Tên>.spec.ts
e2e.resolver = ba-toolkit/e2epath.js
e2e.legacy = docs/Screen-spec/<Màn>/e2e.spec.ts
# Thư mục chứa tài liệu KHÔNG thuộc đặc tả chính (xem mục "docs/Ho-so/"). Container trong suốt.
hoso.dir = Ho-so
# Tài liệu thuộc Ho-so/ (tên file giữ nguyên, kể cả số). Script phân giải qua docpath.js —
# vẫn tìm ở gốc docs/ cho dự án cài trước 13/08/2026.
hoso.docs = removed 00-vision.md 00-personas.md 00-process.md 00-urd.md 00-brainstorm.md 00-flows.md prototype.html 00-intake.md 00-glossary.md 04-stakeholders.md 08-roadmap.md 09-uat.md 00-traceability.md 00-gaps.md 00-conformance.md 00-introduction.md 00-onepager.md 00-onepager.html 00-dashboard.md sitemap.md sitemap-flows.md sitemap.html portal.html dev-notes.md userguide releases meetings api-test dbschema wireframe.html notes 00-lessons.md reviews eval jury 00-threat-model.md 00-migration.md audit po 00-figma-sync.md
# Skill BẮT BUỘC có "Cổng phương án" (mục cùng tên ở trên). lint.js soát: mỗi skill dưới đây
# phải có chuỗi "Cổng phương án" trong SKILL.md. Thêm orchestrator/skill ghi-nhiều-file mới
# thì thêm vào đây, không thì lint không bắt được lúc nó quên cổng.
gate.plan.skills = ac-po ba-threat-model ba-migration ba-atlassian ac-agent ac-team ac-eval ac-memory ac-jury ba-onepager ba-auto ba-init ba-discover ba-add-screen ba-add-feature ba-remove ba-batch ba-accept ba-release ba-reverse ba-reverse-doc ba-sitemap ba-prototype ba-meet ba-change-request ba-task ba-screen-spec ba-requirements ba-screens ba-architecture ba-userguide ba-conformance ba-new-skill ba-proto-first ba-proto-html ba-userguide-video
# Tập con của gate.plan.skills ĐƯỢC ORCHESTRATOR GỌI XUỐNG → phải có điều khoản miễn trừ
# "gọi từ orchestrator đã qua cổng → không hỏi duyệt lại" (xem "Cổng cha bao phủ cổng con").
# Thiếu điều khoản = người dùng bị hỏi duyệt 2 lần cho cùng một việc. lint.js soát.
# ba-change-request/ba-task CỐ Ý không nằm đây: luôn giữ cổng riêng vì đụng baseline.
# Skill NẶNG (≥ ~100k token hoặc ≥ ~5 phút mỗi lần, đo 05–06/10/2026) → phương án/lúc bắt đầu PHẢI in dòng
# "Ước tính: … (cost.js estimate …)" (conv-gates.md → "Cổng phương án" → Báo giá). lint.js (mục 11) soát: SKILL.md
# của mỗi skill dưới đây phải chứa chuỗi `cost.js estimate`. Thêm skill nặng mới thì thêm vào đây + cost-defaults.json.
gate.cost.skills = ba-html-design ba-figma-draw ba-userguide ba-userguide-video ba-batch ba-init ba-screen-spec ba-design-system ba-wireframe-lofi
gate.plan.subskills = ba-migration ac-team ac-eval ac-memory ac-jury ba-onepager ba-screen-spec ba-requirements ba-screens ba-architecture ba-conformance ba-release ba-userguide
# Skill đã ngừng dùng → skill thay thế. lint.js soát: SKILL.md nào còn nhắc skill cũ thì
# PHẢI nhắc cả skill mới trong cùng file, không thì nó là lối đi cụt cho người đọc.
deprecated.skills = ba-figma-design:ba-figma-draw ba-api-checklist:ba-api-test
# Hồ sơ dự án (xem mục "Hồ sơ dự án"). Khai ở đầu docs/00-tracking.md; không khai = full.
# profile.lite.off = cơ chế TẮT khi chạy lite; phải khớp object trả về của profile.js `off()`.
profile.values = full lite mini
profile.lite.off = backlog changelog conformance agents
# `mini` = lite + CẮT BỘ ARTIFACT. profile.mini.off = file màn bị bỏ (khớp off() của profile.js);
# profile.mini.files = bộ file còn lại, đúng thứ tự cột tracking (khớp FILES_MINI của profile.js).
profile.mini.off = usecase userstory designspec brainstorm
profile.mini.files = ascii-screen srs html-design test plan
# Bộ skill `ba-export --mini` cài (thay vì cả 66). Dự án nhỏ không dùng tới integration/
# api-integration/dashboard/userguide/figma/prototype… — ít skill thì agent chọn đúng hơn.
# `ba-toolkit` và TOÀN BỘ `dev-*` luôn được cài kèm — dev-run trỏ tới 8 skill dev-* khác nên
# framework đó không chia nhỏ được. Không cần liệt kê chúng ở đây; install.js tự thêm.
profile.mini.skills = ba-toolkit ba-next ba-requirements ba-functions ba-screens ba-screen-spec ba-test ba-html-design ba-build ba-review ba-track ba-trace ba-change-request ba-add-screen ba-remove ba-portal ba-export dev-run
# PHẠM VI dự án — trục thứ hai, độc lập với hồ sơ (xem conv-gates.md → "Hồ sơ dự án" → "Phạm vi").
# Hồ sơ = đầu tư bao nhiêu vào tài liệu; phạm vi = có DEV hay không. Khai cùng dòng trong
# 00-tracking.md: `Phạm vi: `docs``. Không khai = full. Đọc qua profile.js `readScope()`.
scope.values = full docs
# Cơ chế TẮT khi phạm vi `docs` — khớp khóa `<k>: isDocsOnly(docsDir)` trong off() của profile.js.
scope.off = dev
# Skill CHỈ có nghĩa khi dự án có dev — `ba-export --scope docs` KHÔNG cài chúng, và `dev-*` (11,
# gồm dev-run) + `ac-*` (agentcode) đi kèm theo tiền tố, không liệt kê. Giữ ở BA dù có vẻ "kỹ thuật": ba-reverse
# (tiếp quản codebase vẫn là việc BA), ba-userguide, ba-architecture/ba-api-spec/ba-data-model/
# ba-uat (tài liệu kỹ thuật là sản phẩm BA), ba-proto-html (prototype một file để chốt nghiệp
# vụ, không phải code dự án). lint.js soát: mọi tên ở đây tồn tại và không phải dev-*.
scope.dev.skills = ba-build ba-feasible ba-dbschema ba-api-test ba-test-e2e ba-prototype ba-conformance ba-auto ba-accept
# Skill THỬ NGHIỆM (đợt cắt 25/09/2026): chưa từng chạy thật trên dự án tiêu dùng nào (docs/decisions/20). `ba-export/install.js` mặc định KHÔNG cài;
# `--with-experimental` cài; đích đã có thì giữ + cập nhật; `--check` gắn nhãn. Thoát nhãn = chạy thật trên một dự án + bằng chứng bắt lỗi thật → gỡ tên.
# Khoá vắng → mọi nơi đọc quay về hành vi cũ. ac-audit-web KHÔNG ở đây: scan-html.js đã bắt thật 10 FORM-LABEL (dự án desktop) — chỉ lighthouse.js chưa chạy thật.
skills.experimental = ac-jury ba-atlassian ba-threat-model ba-migration
# Agent chỉ phục vụ một skill thử nghiệm, dạng `agent:skill` — install.js cài agent khi và chỉ khi skill chủ được cài; check-agents miễn khi skill chủ vắng.
agents.experimental = ac-juror:ac-jury
# GÓI PHÁT HÀNH (CHỐT 08/10/2026 — docs/decisions/32, release/manifest.json): skill gói Pro và skill giữ riêng (devonly) KHÔNG có
# trong repo công khai. Mọi check đọc danh sách skill/agent ở registry (gate.plan.*, gate.cost.skills, scope.dev.skills, profile.aware,
# agents.roster, po.*…) chỉ soát skill thuộc hai tập này KHI NÓ CÓ MẶT. Lint 45: file của skill KHÔNG thuộc hai tập (và agent công khai)
# mà require/đường dẫn cứng tới skill trong hai tập → lỗi, trừ chỗ có điều kiện existsSync rõ ràng. Phải khớp manifest khi file đó có.
skills.pro = ac-po ac-team ac-jury ac-eval ac-ci ac-memory ba-atlassian ba-reverse ba-reverse-doc ba-auto
skills.devonly = ba-figma-draw ba-userguide-video ba-doc-public
# Agent chỉ phục vụ skill Pro, dạng `agent:skill` — check-agents miễn "thiếu file" khi skill chủ vắng (như agents.experimental).
agents.pro = ac-evaluator:ac-eval ac-juror:ac-jury
# gói sec (đợt 7) — đề xuất khoá registry (orchestrator quyết; chưa có check lint nào đọc)
security.scan = ba-toolkit/scripts/scan-skills.js
security.allowlist = ba-toolkit/references/security-allowlist.json
security.allowlist.fields = file loai ly_do nguoi_duyet het_han
security.loai.do = injection vo-hinh tai-chay mang shell shell-ghep bi-mat ghi-ngoai persist
security.loai.vang = injection-nhe eval base64
# install.js: quét NGUỒN trước khi chép; 🔴 chưa duyệt → exit 1 (không chép), --allow-unsafe qua; --check/--dry chỉ in
# ĐỘI AGENT (từ 15/09/2026, họ `ac-*` — xem conv-gates.md → "Đội agent"). Roster là canon máy-đọc của
# `.claude/agents/*.md`: `<tên>:<loại>:<quyền>`. Loại: review (soát TÀI LIỆU, chỉ đọc) · verify (CHỨNG MINH
# code: chạy proof, không sửa) · build (viết code — GĐ2). Quyền: ro = không Write/Edit/NotebookEdit/Agent;
# review còn cấm Bash, verify BẮT BUỘC có Bash (chạy lệnh proof). Lint check 30 gọi ac-agent/check-agents.js
# soát hai chiều file ↔ roster, frontmatter, quyền khớp tools, và mỗi agent nói rõ "ai phái · trả về đâu".
agents.kinds = review verify build
agents.roster = ba-consistency-reviewer:review:ro ba-srs-quality-reviewer:review:ro ba-diagram-reviewer:review:ro ba-inference-reviewer:review:ro ba-manual-reviewer:review:ro ba-change-observer:review:ro ac-verifier:verify:ro ac-builder:build:rw ac-judge:verify:ro ac-evaluator:verify:ro ac-juror:review:ro ac-auditor:verify:ro
# Mức tự chủ của đội khi dev — khai `> Mức tự chủ: `solo`` trong 12 dòng đầu 00-tracking.md, đọc qua
# profile.js readAutonomy(); không khai = agents.autonomy. Mức chỉ đổi độ nói nhiều, KHÔNG nới luật kiểm chứng.
autonomy.values = paired solo heads-down
agents.autonomy = solo
# MODEL cho agent (người dùng chốt 17/09/2026): mặc định `opus` là đủ; việc cơ giới/không quan trọng (vá Proof, roll-up test.md,
# dựng brief, đổi định dạng) được `sonnet`; `fable` (hay bất kỳ model ngoài danh sách) PHẢI hỏi người trước khi chạy —
# không khai `inherit` vì phiên chính đổi model là agent đổi theo mà không ai thấy. check-agents.js (lint 30) soát `model:`.
agents.models = opus sonnet
# Nhãn TC verifier (validate-done.js NHÃN, verification-template, agent ac-verifier) + mục "Vế thiếu" (template có, validate-done
# soát, agent gọi ve.js) — lint 42 soát (gộp lint 35/37 ngày 25/09/2026). `_` = khoảng trắng.
verify.tc.labels = lỗi-code tc-sai-tiền-đề đúng-srs
verify.ve.section = Vế_thiếu
# DẤU HIỆU REPO NGUỒN (20/09/2026): 4 script phải hỏi cùng một câu "đây có phải repo toolkit gốc không" —
# install.js (tìm nguồn), global-bootstrap.js, report.js, hook-lint.js (tự tắt lint ở dự án tiêu dùng). Trước đây
# dấu hiệu là thư mục `explain-skills/`; khi nó đổi tên thành `explain/` — đúng tên đích cũng nhận — dấu hiệu đó
# nhận nhầm mọi dự án tiêu dùng là nguồn. `example/` không bao giờ được copy sang đích. Lint 39 soát 4 file.
export.srcMarker = example/docs/00-tracking.md
# Ô `e2e` của 00-tracking.md (20/09/2026, vá từ dự án desktop): 🔨 = màn CÓ spec E2E nhưng chỉ là spec chẻ theo
# tính năng (nhận qua mã `TC-S..` trong nội dung, `e2epath.js` → taggedSpecs), chưa phải spec trọn màn.
# Thiếu nấc này thì refresh hạ màn về ⬜ mỗi lần chạy, xoá bằng chứng phủ E2E có thật. Lint 42 soát (ex-lint 41).
e2e.states = ✅ 🔨 ⬜ ⚠️
# Cột TÙY CHỌN của 00-tracking.md (05/10/2026, figma-push): artifact không thuộc bộ file của hồ sơ — KHÔNG tính vào "Hoàn thành".
# Mỗi cột phải có dòng định nghĩa "Cột `<tên>`" ở conventions.md và refresh.js phải biết nó (ghi hoặc giữ giá trị) — không
# thì refresh coi là cột người tự thêm và dời nó ra trước `Trạng thái`. Lint 42 soát.
tracking.optional.cols = checklist e2e figma
# Ô `figma` (chủ sở hữu: ba-figma-draw/scripts/figma-sync.js; refresh.js chỉ GIỮ): ⬜ chưa · 🔲 lo-fi đã đẩy · ✅ hi-fi khớp ·
# ⚠️ html mới hơn Figma · ✋ Figma sửa tay chưa kéo về. Lint 42 soát conventions.md + figma-sync.js.
figma.states = ⬜ 🔲 ✅ ⚠️ ✋
agents.model.default = opus
# E (19/09/2026): vai CƠ GIỚI được sonnet — có đo (cost.js report theo model); vai phán/viết vẫn opus. Token = chuỗi xuất hiện nguyên văn ở SKILL chủ quản (lint 38).
agents.sonnet.roles = vá-Proof roll-up-test.md dựng-brief verifier-vòng≥2 eval-chấm-lại
# QUYỀN PO (từ 16/09/2026, skill ac-po — PO là skill ở phiên chính vì subagent không phái được subagent). Canon là bảng
# "Quyền của PO" trong ac-po/SKILL.md; hai khóa này là bản máy-đọc. `_` = khoảng trắng. Lint check 33 soát: mỗi mục po.ask
# phải có NGUYÊN VĂN trong SKILL.md (cột "phải hỏi") và trong mission.js/pick.js ít nhất một mục được máy cưỡng chế
# (TRẢ quá 2 vòng · phase suy từ tracking · CR chưa duyệt · PD Treo · WI Blocked). Nới quyền PO = sửa đây + SKILL + test.
po.may = xếp_thứ_tự_việc_trong_phase_đã_duyệt chọn_việc_kế nhận/trả_màn_theo_bằng_chứng mở_WI_kiểu_Bug/Tech gọi_lại_đội_sửa_khi_TRẢ sửa_test.md_theo_srs_khi_verifier_gắn_nhãn_tc-sai-tiền-đề
po.ask = đổi_baseline_(mở_CR) câu_hỏi_thuộc_sổ_PD thêm/bớt_việc_ngoài_phase đổi_phase push/deploy/dữ_liệu_production vượt_ngân_sách_lần_chạy TRẢ_quá_2_vòng_cùng_một_việc phase_suy_từ_tracking
# CANON ĐỢT 4–5 (24/09/2026): giá trị từng viết cứng ở ≥2 nơi — script ghi/đọc nó, SKILL/agent/template dạy agent dùng nó.
# Lint 42 soát từng khoá với từng file dùng; đổi ở script mà quên canon (hay ngược lại) là đỏ. `_` = khoảng trắng.
# Loại TRẢ của accept.js (`trảLoại`); đầu danh sách = mặc định `mission.js --loai` (nhận cả bản bỏ dấu); ac-po/SKILL.md dạy mỗi nhánh.
po.tra.loai = code tài-liệu go-live
# Nhãn PD chặn go-live (conv-ledgers → "Loại chặn go-live"): pick.js không chặn dev vì nó, accept.js route `trảLoại: go-live`.
pd.label.golive = [go-live]
# Kết quả mỗi lỗi gieo: mutate.js ghi, validate-done.js đọc (PASS bị chặn khi còn `sống`), verification-template dạy verifier.
verify.mutate.results = bắt sống lỗi-chạy
# 9 chiều quét yêu cầu ngầm (tlc-plan Sweep), đúng thứ tự: CHIỀU của scan-feasible.js (luật 9) = bảng mẫu srs của ba-screen-spec; "N chiều" trong chữ = số mục.
srs.sweep.dimensions = kiểm_dữ_liệu_vào kiểu_hỏng gửi_lặp/thử_lại phân_quyền đồng_thời/thứ_tự vòng_đời_dữ_liệu hệ_ngoài_chết chuyển_trạng_thái quan_sát/log
# Loại phát hiện của ac-judge/scan-bypasses.js — header script khai và mã phát ra phải cùng bộ này. Từ 25/09/2026 scan-bypasses
# là MỒI cho agent judge (exit 0 khi chạy được, 2 khi lỗi hạ tầng) và bỏ console-left/sync-hack/unsafe-html (0 lần bắt thật,
# console-left/unsafe-html toàn báo oan — dự án helpdesk, dự án desktop); tls-bypass/secret-like giữ vì bảo mật dù chưa có lần bắt.
bypass.cats = suppression test-dodge test-removed assert-loose todo-new secret-like type-bypass tls-bypass error-swallow hook-bypass config-loosen env-dodge protected-edit
# Tập con agent phải PHÁN (hợp lệ khi CR/ba-test mở, lách khi builder tự làm) — agents/ac-judge.md + ac-judge/SKILL.md nhắc từng loại.
bypass.cats.judged = protected-edit config-loosen env-dodge
# devserver.js `trạng-thái:exit` — "thao tác được" (ac-eval luật 9, check-eval 4b) = trạng thái đầu; ac-eval/SKILL.md ghi kèm exit.
devserver.states = của-dự-án:0 lạ:3 không-thấy:1
# Nhãn BÁO của scan-wiring.js — ac-judge/SKILL.md dạy agent phán từng nhãn. Exit = số file/export mang ba nhãn đầu;
# `chỉ-test-dùng` (export chỉ file test nhắc — setter `dat*` làm đường nối cho test) in ra 🟢, KHÔNG tính exit.
judge.wiring.labels = chỉ-nhắc-tên mồ-côi export-mồ-côi chỉ-test-dùng
# Skill/script phải tôn trọng hồ sơ (đọc qua ba-toolkit/profile.js, và nói ra khi bỏ qua).
profile.aware = ba-next ba-accept ba-review ba-task ba-changelog ba-conformance ba-screens ba-screen-spec ba-test ba-html-design ba-uat ba-checklist ba-track ba-export ba-trace ba-build ba-proto-first ba-proto-html ba-flow ac-verify ac-team ac-judge ac-eval ba-migration ba-atlassian ac-ci ac-audit-web ba-threat-model ac-po
# Skill là MỐC của gap 🟠 ("Nợ có hạn", xem "Quy ước gate") → phải có CỔNG THU NỢ trong SKILL.md
# (chuỗi "thu nợ 🟠"). Thiếu cổng này thì 🟠 không bao giờ bị thu, tức là biến thành gap bị lờ đi
# vĩnh viễn — đúng thứ mức 🟠 sinh ra để chống. Thêm mốc mới ở ba-review thì thêm skill vào đây.
gate.debt.skills = ba-build dev-run ba-html-design ba-accept
# Chủ đề được chấm 🟠 ("Nợ có hạn") + mốc phải sạch. CANON là bảng "Phân loại 🟠" trong
# ba-review/SKILL.md; khóa này chỉ là bản máy-đọc của nó. lint.js soát HAI chiều: (a) mỗi dòng
# bảng canon có đúng một mục ở đây và ngược lại; (b) không file luật nào chấm 🟡 cho các chủ đề
# này. Dạng `token:mốc`, `_` = khoảng trắng/ký tự markdown xen giữa. Thêm mốc mới ở ba-review
# thì thêm dòng ở đây, không thì lint bắt ngay.
gap.orange = Animation_chuyển_cảnh:ba-html-design chưa_xác_nhận:ba-build ADR_còn_Draft:ba-build Hợp_đồng_tích_hợp_còn_Draft:ba-build e2e_lệch_test.md:ba-accept Plan_không_đủ_dữ_liệu_đối_chiếu:ba-accept
# Phụ lục tách khỏi conventions.md (cùng thư mục ba-toolkit/). lint.js quét cả hai file này
# khi đối chiếu canon, và soát chúng có thật.
conv.appendix = conv-mermaid.md conv-ledgers.md conv-gates.md conv-registry.md
# Ngân sách MÔ TẢ skill. `description` của MỌI skill được nạp vào context ở MỌI phiên, tại MỌI
# dự án đích — trả trước khi làm bất cứ việc gì. Đo 09/09/2026: 77 skill = 18,2 KB (~4,5k token).
# Trần này là cái RÁP-XÊ chống phình, không phải cách tiết kiệm: thêm một skill mới phải là đánh
# đổi NHÌN THẤY ĐƯỢC, không phải chuyện âm thầm. Phần "KHÁC skill X…" thuộc về mục `## Ranh giới`
# trong chính SKILL.md — đó là thứ agent đọc SAU khi đã chọn skill, không phải thứ dùng để chọn.
# Đừng cắt mệnh đề `Use when …` mở đầu để lách trần: đó chính là chuỗi Claude Code khớp để
# auto-trigger, cắt nó là làm skill không bao giờ được gọi. lint.js check 25 soát.
# Trần cho CHÍNH CLAUDE.md (byte). Nó được nạp MỌI PHIÊN ở MỌI MÁY — cùng loại chi phí với mô tả
# skill nhưng lớn hơn 4 lần và không ai đo: 13 KB (03/08/2026) → 77 KB (10/09/2026) vì nó vừa là
# briefing vừa là nhật ký quyết định. Từ 11/09 nhật ký sang docs/decisions/, briefing giữ ≤ trần này.
# lint.js check 28. Muốn viết dài → viết vào docs/decisions/, trỏ một dòng từ CLAUDE.md.
claude.max = 16000
desc.max = 230
# 15/09/2026: 19 000 → 21 000. Họ ac-* (agentcode) thêm 3 skill GĐ1–2 đã chạm trần (còn 5 ký tự); GĐ3–4 thêm
# 4 skill nữa. Nâng có ý thức: trần/skill giữ 350, tổng = ~83 skill × ~250. Không nâng lần nữa mà không rút bớt.
# 15/09/2026 (lần 2): 21 000 → 23 000 — đợt 3 lấy từ agent-skills: ba-threat-model, ba-migration, ac-audit-web, ac-ci,
# ba-atlassian (5 skill). Trần/skill giữ 350. Lần nâng kế tiếp PHẢI kèm rút mô tả cũ (Track C đã chỉ chỗ).
desc.total = 15000
# Skill KHÔNG phải nối về `ba-next` ở cuối `## Lưu ý` (check 26). Miễn trừ có hai loại và
# chỉ hai loại: (a) chính `ba-next`/`ba-toolkit` — cửa và bảng chỉ đường, nối về mình là vòng
# lặp; (b) skill KHÔNG đẩy pipeline dự án đi bước nào — cài đặt toolkit, dựng trang, vẽ hình,
# tra cứu. Mọi skill còn lại phải có dòng đó: `ba-next` là "một cửa" của toolkit nhưng trước
# 09/09/2026 chỉ 11/77 skill trỏ về nó, tức là cửa tồn tại mà không lối nào dẫn tới.
next.exempt = ac-agent ba-next ba-toolkit ba-export ba-launcher ba-new-skill ba-doc-public ba-index ba-figure ba-portal ba-diagram
# Phép kiểm do HOOK cưỡng chế (xem conventions.md → "Cưỡng chế bằng hook"). Dạng `mã:script:luật`.
# Luật của toolkit là CHỮ trong SKILL.md, và người đọc chữ đó là một model — model bỏ sót được.
# Những luật ĐO ĐƯỢC thì giao cho máy; luật cần PHÁN ĐOÁN vẫn thuộc skill/agent. Mỗi mã kiểm phải
# trỏ về một luật CÓ TÊN trong conventions — tiêu chí này đã loại một phép kiểm "thứ tự mã tăng
# dần" khỏi đợt 1 vì nó chỉ là thẩm mỹ, không có luật nào đỡ.
# Mọi phép kiểm đều `exit 2` = CẢNH BÁO trả cho agent, KHÔNG chặn: lint là heuristic, chặn cứng
# một heuristic là làm hỏng những lượt hợp lệ. lint.js soát mã ở đây có hàm thật trong script.
gate.hook.checks = H1:check-md.js:bang-markdown-toan-ven H2:check-md.js:rollup-khop-bang H3:check-md.js:so-do-liet-ke-khop-bang S1:hook-gate.js:cham-man-phai-cap-nhat-tracking S2:hook-gate.js:doi-baseline-phai-mo-CR S4:hook-gate.js:goi-ba-trace-scan S5:hook-gate.js:goi-check-tc-layer H5:hook-lint.js:khong-thay-code-bang-binh-luan S8:hook-gate.js:luot-khong-gop-tool S3:hook-gate.js:chay-gate-dev-that FG:hook-guard.js:chan-doc-file-bi-mat S9a:hook-session.js:nhanh-doi-duoi-chan-phien S9b:hook-session.js:phien-khac-cung-repo
# S4/S5 KHÔNG có logic riêng — chúng GỌI `ba-trace/scan.js` và `ba-conformance/check-tc-layer.js`
# rồi lọc theo màn vừa chạm. Đây là luật chọn quan trọng nhất của cả đợt cưỡng chế: đã có
# checker thì hook chạy nó SỚM HƠN, không viết lại. Viết lại là nhân đôi nơi giữ luật.
# Hook đăng ký ở `.claude/settings.json` của dự án; `ba-export` merge tự động, GỠ TRÙNG theo tên
# file (đăng ký hai lần thì hook chạy hai lượt mỗi lần ghi — đã xảy ra thật ở chính repo nguồn).
gate.hook.events = PreToolUse:hook-guard.js PostToolUse:hook-lint.js Stop:hook-gate.js SessionStart:hook-session.js UserPromptSubmit:hook-session.js
# S9a/S9b (W7, 06/10/2026): sổ phiên `.claude/ba-session.json` — nhánh đổi dưới chân phiên / phiên khác còn sống cùng
# thư mục repo → nhắc một lần, gợi ý `git worktree`. Chạy ở SessionStart + UserPromptSubmit (stdout exit 0 vào ngữ cảnh,
# trước khi agent đụng file), không ở Stop (sau khi hỏng) hay PreToolUse (nổ mỗi tool). → docs/decisions/w7-khoa-giua-cac-phien.md
# `FG` là phép kiểm DUY NHẤT chặn cứng (ở PreToolUse, `exit 2` = từ chối lệnh gọi). Ngoại lệ
# có lý do: cảnh báo sai mất vài giây, bí mật đã vào context thì KHÔNG rút lại được. Hai phía
# cán cân không đối xứng nên ngưỡng cũng không đối xứng. `S3` mặc định TẮT (đắt — chạy bộ test
# thật của dự án); bật ở `.claude/ba-hooks.json`.
# PHÁP LÝ PHÁT HÀNH (M1, 07/10/2026 — docs/decisions/32): lõi MIT (`LICENSE`), mã/tài liệu bên thứ ba giữ giấy phép gốc
# và kê ở `THIRD_PARTY_NOTICES.md`. Lint 44 soát: hai file này có ở gốc repo nguồn · mọi thư mục `vendor/` trong
# `.claude/skills` có file `LICENSE` cạnh file vendor và mỗi file vendor được NÊU TÊN trong notices · `*.min.js` ngoài
# `vendor/` là lỗi · mọi SKILL.md có `upstream: <gói>@<bản>/…` phải có frontmatter `license:` trỏ notices, và notices
# nhắc tên skill + `<gói>` + `<bản>`. Thêm vendor/clone mới mà quên notice là đỏ.
release.notices = LICENSE THIRD_PARTY_NOTICES.md
```
