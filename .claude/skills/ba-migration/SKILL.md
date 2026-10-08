---
name: ba-migration
description: Use when tiếp quản codebase cũ, đập cũ xây mới hay tách monolith và cần LỘ TRÌNH TÁCH — bản đồ domain, ghép nối, bước MG đo được có quay lui; sinh docs/Ho-so/00-migration.md.
---

# ba-migration — Tách/đổi codebase theo ghép nối, từng lát quan sát được

> ⚗️ **Thử nghiệm** (canon `skills.experimental`, 25/09/2026) — `ba-export` mặc định không cài (`--with-experimental` để cài). Vì sao: phần LLM (lộ trình MG-..) chưa chạy trên dự án thật; `scan-coupling.js` chạy một lần ở dự án desktop và chỉ thấy 5 module, không thấy phần Rust — sai hình. Skill khác (`ba-reverse`, `ba-auto`) chỉ gợi nó *nếu đã cài*. Thoát nhãn khi: chạy thật trên một dự án tiêu dùng **và** có bằng chứng bắt được lỗi thật (commit/file:line ở dự án đó) → gỡ tên khỏi khoá registry `skills.experimental`.

## Mục tiêu
Trả lời **"tách cái gì trước, tách thế nào, biết xong khi nào, hỏng thì lùi ra sao"** cho dự án đang cầm một codebase cũ — tiếp quản, đập cũ xây mới, tách monolith, gộp service, đổi stack. Sinh **`docs/Ho-so/00-migration.md`** theo `assets/template.md`:

| § | Nội dung | Nguồn |
|---|---|---|
| 1 | **Bản đồ domain** — module thư mục → domain nghiệp vụ → `F..` (đối chiếu `02-functions.md` nếu có), Mermaid `flowchart` subgraph theo domain | script liệt kê module; LLM gán domain, đọc code |
| 2 | **Ghép nối ba chiều** — bảng cặp module: cạnh/chiều/churn/đồng-đổi (🟢 đo) + mức mạnh (đọc code) + xa (container/đội) → cân bằng; **top 5 cặp nguy hiểm** | `scan-coupling.js` + `references/ghep-noi-3-chieu.md` |
| 3 | **Lộ trình `MG-..`** — thứ tự = ghép nối cao × hay đổi cao trước, mỗi bước một **slice quan sát được**, tiêu chí xong **đo được** (số/lệnh), rủi ro, quay lui, trace `F/NFR/ADR` | `references/mau-tach.md` |
| 4 | **Cửa một chiều → ADR** — strangler/big-bang, tách DB/chung, đổi stack… mỗi cửa một ADR `Draft` trong `10-architecture.md` | khuôn §11 `ba-architecture` |
| 5 | **Rủi ro xuyên bước + quay lui tổng** | bảng chung + đồng-đổi ngầm |

Luật nền: **máy đếm, LLM phán** — số cạnh và churn là của script, "mạnh/xa/nguy hiểm" là của người đọc code có bằng chứng `file:dòng`. Không có script thì "A ghép chặt B" là cảm giác.

## Điều kiện
- **Cần:** gốc code (`--root`, mặc định cùng repo với `docs/`); có `git` thì có churn, không có thì cột trống — nói ra, không phải lỗi.
- **Nên có:** `docs/02-functions.md` (để gán `F..` — không có thì cột `F..` là `—` và đề nghị `ba-reverse` trước), `docs/10-architecture.md` (để mở ADR đúng chỗ — không có thì ADR dự kiến ghi tại §4 và route `ba-architecture`), `docs/01-requirements.md` (`NFR-..` để trace).
- **Hồ sơ dự án** (`ba-toolkit/profile.js`, `conv-gates.md` → "Hồ sơ dự án"): `full` mới phái `ba-inference-reviewer`; **`lite`/`mini` vẫn chạy trọn**, chỉ bỏ vòng agent và in `⚙️ lite: bỏ soát suy luận bằng agent — §1 giữ nhãn 🔶`. **Phạm vi `docs`** vẫn có nghĩa: lộ trình là tài liệu bàn giao cho đội build; code khi đó thường ở repo khác → truyền `--root`.
- Script báo "không thấy module code" → dừng, nói rõ; đừng bịa bản đồ domain từ tên thư mục ngoài container.

## Quy trình

0. **Cổng phương án (BẮT BUỘC — `conv-gates.md` → "Cổng phương án").** Skill ghi `00-migration.md` **+ SỬA `10-architecture.md`** (mở ADR cho cửa một chiều) **+ có thể `00-backlog.md`** (WI lưới an toàn/phá vòng) → trên ngưỡng 2 file. Chạy script trước (0 token) rồi trình đủ 6 phần: **Đã đọc** (file docs + số module/cạnh/cờ script đo) · **Hiểu** (hướng đi suy từ bằng chứng: tách/gộp/đổi stack/tại chỗ — và vì sao) · **Sẽ làm** (bảng: TẠO `Ho-so/00-migration.md` · SỬA `10-architecture.md` §11 thêm ADR nào · SỬA `00-backlog.md` WI nào) · **Giả định** (`GĐ-01…`: đội/deploy/SLA chưa biết) · **Câu hỏi chặn** (ai giữ module nào, cửa sổ deploy) · **Ngoài phạm vi** (không sửa code, không chốt ADR — chốt là cổng của `ba-architecture`, không xếp ưu tiên tính năng — `ba-roadmap`). `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp (chỉ §1–2, chưa lộ trình) / Hủy**. **Gọi từ orchestrator đã qua cổng → in phương án rút gọn rồi chạy tiếp, KHÔNG hỏi duyệt lại** (`conv-gates.md` → "Cổng cha bao phủ cổng con") — trừ khi phát hiện phải đụng file ngoài phương án cha (xin duyệt phần chênh).

1. **Đọc** `conventions.md` + `conv-gates.md`; `02-functions.md`, `10-architecture.md`, `01-requirements.md` (NFR), `Ho-so/00-conformance.md`/`dev-notes.md` nếu có (stack, lệnh test). Rồi **chạy script (cơ giới):**
   ```bash
   node .claude/skills/ba-migration/scripts/scan-coupling.js --root <code> --docs docs --plain   # hoặc --json
   ```
   Đọc bảng **MODULE** (file · dòng · commit/90 ngày) và **CẶP** (cạnh mỗi chiều · ↔ vòng · khoảng cách container · churn · đồng-đổi · cờ `⚠️ ghép nối cao & hay đổi`). Ngưỡng cờ in ngay dòng 2 — lệch với quy mô dự án thì chỉnh `--nguong-canh/--nguong-churn/--ngay` và **ghi ngưỡng đã dùng vào §2**. Đọc `gioiHan` ở đầu script trước khi kết luận: alias lạ rơi vào `khôngPhânGiải`, Ruby/PHP/C#/Rust không có cạnh, vòng dài hơn 2 không tìm.

2. **§1 Bản đồ domain.** Mỗi module → **một** domain + loại (Lõi/Hỗ trợ/Chung) + `F..` thực thi + bảng dữ liệu chạm. Gán bằng cách đọc file vào/route/model của module, **ghi bằng chứng**; không gán được → `❓`, không đoán theo tên thư mục. Có `02-functions.md` → liệt kê **lệch hai chiều** (`F..` không module nào làm · module không thuộc `F..` nào) — đó là đầu vào cho `ba-reverse`/`ba-change-request`, không tự sửa. Vẽ `flowchart` subgraph theo domain, cạnh mang số import, cạnh ngược của vòng nét đứt; **tiếng Việt có dấu**, ID node ASCII (`conv-mermaid.md`).
   Ứng viên domain **Chung** (logic viết lặp giữa module — Phase 1–2 của *common domain detection*): `node .claude/skills/ba-review/scripts/scan-dup-code.js --root <code> --json` → nhóm `luat-nhieu-ban`/`nguon-doi` trải ≥2 module là ứng viên gom về một chỗ; đọc code xác nhận, ghi `file:line`, không gộp theo tên.

3. **§2 Ghép nối ba chiều** (`references/ghep-noi-3-chieu.md`). Với mỗi cặp có cờ ⚠️ hoặc ↔ (và tối đa 15 cặp cạnh cao nhất): mở file có nhiều import nhất trong cạnh, xếp **mạnh** = xâm nhập / chức năng / mô hình / hợp đồng kèm `file:dòng`; **xa** = container (script) + đội/deploy (hỏi, `❓` khi chưa); **hay đổi** = churn + loại domain. Tra bảng cân bằng → 🔴/🟠/🟡/🟢. **Đồng-đổi cao mà không có cạnh import** = ghép nối chức năng ngầm — nêu riêng, đó là loại nguy hiểm nhất vì không ai khai. Chốt **top 5** = 🔴 theo cạnh × churn, vòng lên đầu.

4. **Soát suy luận (hồ sơ `full`):** §1–2 chứa khẳng định suy từ code ("module X là domain Y", "A đọc thẳng bảng của B"). Phái **`ba-inference-reviewer` chế độ `inference`** (mặc định) — truyền `00-migration.md` nháp §1–2 + `--root` + danh sách file đã trích. Agent trả 🔴/🟡/🟢: khẳng định vượt bằng chứng, mức "mạnh" ghi chắc mà không có `file:dòng`. Còn 🔴/🟡 → hạ nhãn 🔶/`❓` hoặc bỏ khẳng định rồi mới sang §3. `lite`/`mini` → bỏ bước này, in `⚙️`, mọi dòng không có `file:dòng` mang 🔶.

5. **§3 Lộ trình `MG`** (`references/mau-tach.md`). `MG-00` **luôn là lưới an toàn** (characterization test, baseline, so sánh cũ/mới). Rồi mỗi cặp 🔴 → 🟠 một hoặc vài bước; **lá trước, lõi dùng chung sau, vòng phải phá trước khi tách** (bước phá vòng là `MG` riêng). Mỗi bước điền đủ 7 trường + mẫu tách + ước lượng S/M/L; **Tiêu chí xong phải có số hoặc lệnh** (`100% traffic 14 ngày`, `npm run test:orders` exit 0) — tính từ ("ổn định", "sạch") bị `check-migration.js` chặn. Bước không quay lui được phải **nói là không quay lui được** và trỏ cửa một chiều. Vẽ `flowchart` phụ thuộc giữa các `MG`. Không có bước nào là "tách tầng X" mà người dùng/vận hành không thấy gì.

6. **§4 Cửa một chiều → ADR.** Mỗi quyết định không đảo được rẻ (danh sách ở `mau-tach.md` §4) = một dòng bảng + **một ADR `Draft`** viết vào `10-architecture.md` §11 theo khuôn của `ba-architecture` (≥2 phương án + vì-sao-không, hệ quả xấu, trace NFR), trước bước `MG` dùng nó. Chạy `node .claude/skills/ba-architecture/scripts/check-adr.js docs --plain` sau khi thêm. **Không tự đánh Accepted** — chốt là **Cổng chốt kiến trúc** của `ba-architecture`; phân vân giữa A/B/C → đề nghị `ac-jury <ADR>`. Chưa có `10-architecture.md` → ghi ADR dự kiến ngay §4 và route `ba-architecture`; `check-migration.js` sẽ cảnh báo, không lỗi. Không có cửa nào → ghi "không có".

7. **§5 Rủi ro + quay lui tổng** — bảng dùng chung (≥2 module ghi), phụ thuộc ngoài, dữ liệu production; **trạng thái hệ thống nếu dừng ở giữa** phải chạy được (mọi bước đã xong đứng độc lập). Câu hỏi `❓` gom thành **Câu hỏi chặn**; câu chỉ người quyết được (tách DB hay không, big-bang hay strangler) → cũng ghi `PD` vào `00-decisions.md` nếu sổ đã tồn tại.

8. **Ghi `docs/Ho-so/00-migration.md`** (đường dẫn qua `ba-toolkit/docpath.js` `writePathFor` — dự án phẳng trước 13/08/2026 giữ chỗ cũ), rồi **cổng hình**:
   ```bash
   node .claude/skills/ba-migration/scripts/check-migration.js docs --plain
   ```
   Exit ≠ 0 → sửa cho tới 0 (thiếu trường, tiêu chí không đo được, phụ thuộc vòng, ADR ma). Việc chuẩn bị không đổi baseline (viết characterization test, dựng router, cấm import) → `ba-task` mở `WI` trỏ `MG-..` (hồ sơ `lite`/`mini` tắt sổ WI → ghi vào cột "Bước chạm" thôi, nói ra). **Xác nhận giả định** (`conv-gates.md`) cho `GĐ-..` về đội/deploy/SLA; batch → `⚠️ chưa xác nhận`.

9. **Báo cáo:** số module/cạnh/cờ · top 5 cặp · số bước `MG` + ước lượng · cửa một chiều + ADR đã mở (Draft) · câu hỏi chặn. Nhắc: **ảnh chụp** — code đổi hay lộ trình đi được vài bước thì chạy lại script và cập nhật §2 (churn đổi là ưu tiên đổi).

## Tiêu chí chất lượng (BẮT BUỘC)
- **Mọi số trong §1–2 là của script** (module, cạnh, churn, đồng-đổi) — không có số nào do LLM ước; ngưỡng cờ ghi rõ trong §2.
- **Mọi mức "mạnh" và mọi gán domain có bằng chứng `file:dòng`** hoặc mang 🔶/`❓`. Không có dòng nào vừa chắc chắn vừa không có bằng chứng.
- **`check-migration.js` exit 0**: mỗi `MG` đủ 7 trường, tiêu chí xong có số/lệnh, phụ thuộc không vòng, `MG-00` là lưới an toàn, mỗi cửa một chiều có `ADR-..` tồn tại (khi có `10-architecture.md`).
- **Mỗi ADR mở ra qua `check-adr.js` 0 lỗi** và ở trạng thái `Draft` — skill này không chốt kiến trúc.
- **Thứ tự bước bám §2**: cặp 🔴 xuất hiện trong `MG` sớm hơn cặp 🟠; cặp 🟡/🟢 không có bước trừ khi là phụ thuộc — nếu lệch phải ghi lý do một câu.
- Mermaid: `flowchart` cho cả bản đồ domain lẫn phụ thuộc `MG`; tiếng Việt có dấu; qua `conv-mermaid.md` "an toàn cú pháp".

## Ranh giới
- **`ba-reverse`** sinh tài liệu từ code — *cái gì đang có*. `ba-migration` nói *tách/đổi thế nào và theo thứ tự nào*; chạy **sau** `ba-reverse` (cần `F..` để gán domain) và dùng `ba-inference-reviewer` cùng chế độ `inference` để soát suy luận từ code.
- **`ba-architecture`** chốt kiến trúc **đích** và là nơi ADR sống + được Accepted. `ba-migration` chỉ **mở** ADR `Draft` cho cửa một chiều và trace về NFR; hai skill chạy cạnh nhau: migration cho biết *đường đi*, architecture cho biết *điểm đến*.
- **`ba-roadmap`** là lộ trình **tính năng theo giá trị** (MoSCoW/RICE, Now/Next/Later, `F..`). `ba-migration` là lộ trình **kỹ thuật theo ghép nối** (`MG-..`, module). Một dự án có thể có cả hai; `ba-release` cắt lát roadmap, không cắt lát migration.
- **`ba-integration`** — nhiều hệ **ngang hàng** trao đổi với nhau (landscape, hợp đồng, MDM). `ba-migration` — **một** codebase đang bị tách/đổi từ bên trong. Tách xong thành nhiều hệ thì hợp đồng giữa chúng mới sang `ba-integration`.
- **`ba-conformance`** — code có bám đặc tả không (sau dev). `ba-migration` không so code với đặc tả; nó so module với module.
- **`ac-jury`** — khi một cửa một chiều có 2–3 phương án đều có lý, đưa ADR `Draft` cho hội đồng; `ba-migration` không tự bỏ phiếu.

## Lưu ý
- **Không sửa code, không chốt ADR, không xếp ưu tiên tính năng** — ba việc đó của `dev-run`/`ac-team`, `ba-architecture`, `ba-roadmap`.
- **Hướng đi là kết luận, không phải đầu vào.** Người dùng nói "tách microservice" mà §2 cho thấy 4 module ghép chức năng qua một bảng chung và đội 3 người → nói thẳng bằng số, đề xuất hiện đại hoá tại chỗ/modular monolith trước, để người quyết (`PD`).
- **Churn thấp không có nghĩa an toàn** — module hỗ trợ ghép xâm nhập với module lõi thừa hưởng độ hay đổi của lõi (`ghep-noi-3-chieu.md` §3).
- Script bỏ `node_modules/dist/build/vendor/_ref/.claude`; container ngoài danh sách (`src/ lib/ app/ packages/ apps/ services/ modules/ internal/ pkg/ cmd/ src/main/java|kotlin`) không được nhận — nói ra khi codebase có bố cục lạ, đừng ép.
- Tiếng Việt có dấu; tên module/thư mục giữ nguyên; ngày `YYYY-MM-DD`. Footer `## Thuật ngữ` (strangler, churn, đồng-đổi, slice, cửa một chiều) + bổ sung `00-glossary.md` khi có.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
