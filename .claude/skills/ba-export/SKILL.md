---
name: ba-export
description: Use when cần cài bộ BA toolkit (skill, agent, hướng dẫn) sang dự án khác, hoặc ở dự án đã dùng toolkit muốn KIỂM TRA/KÉO bản mới về (`ba-export check|update`).
---

# ba-export — Cài BA toolkit sang dự án khác

## Mục tiêu

> ⚙️ **Bộ gọn cho dự án nhỏ: `--mini`** (`conv-gates.md` → "Hồ sơ dự án"). `node install.js --to <đích> --mini` chỉ cài bộ skill canon `profile.mini.skills` (~17 `ba-*` + `ba-toolkit` + **toàn bộ `dev-*`** — `dev-run` trỏ tới 8 skill `dev-*` khác nên framework đó không chia nhỏ được), thay vì cả 66. Script **in ra danh sách bị bỏ**, không cắt lặng lẽ. Cần lại đủ bộ về sau: chạy `ba-export update` **không** kèm `--mini`. Nhớ khai `> Hồ sơ dự án: \`mini\`` ở đầu `docs/00-tracking.md` của dự án đích — cài bộ gọn mà quên khai thì tài liệu vẫn bị đòi đủ 9 file/màn.

> ⚙️ **Dự án chỉ làm tài liệu, không dev: `--scope docs`** (`conv-gates.md` → "Hồ sơ dự án" → "Phạm vi"). `node install.js --to <đích> --scope docs` **không cài** bộ skill dev — canon `scope.dev.skills` (`ba-build` `ba-feasible` `ba-dbschema` `ba-api-test` `ba-test-e2e` `ba-prototype` `ba-conformance` `ba-auto` `ba-accept`) + toàn bộ `dev-*` — còn **56/76** skill; khối CLAUDE.md ở đích in vòng đời **3 giai đoạn** (GĐ3 = bàn giao tài liệu). Khác `--mini`, phạm vi được **ghi nhớ** trong `.claude/ba-toolkit.json`: `ba-export update` sau đó vẫn giữ `docs`; dự án đổi ý muốn dev → `--scope full` (skill dev cài thêm, không mất gì). Kết hợp được: `--mini --scope docs` = 16 skill. Nhớ khai `Phạm vi: \`docs\`` cùng dòng hồ sơ ở đầu `docs/00-tracking.md` — script in nhắc, vì cài bộ docs mà quên khai thì `ba-next` vẫn đòi `plan.md` và gợi `dev-run` (skill không có ở đích → lối đi cụt).

> ⚗️ **Skill thử nghiệm: `--with-experimental`** (canon `skills.experimental` = `ac-jury` `ba-atlassian` `ba-threat-model` `ba-migration`; agent riêng `agents.experimental` = `ac-juror` `ac-auditor` đi theo skill). Bốn skill này chưa từng chạy thật trên dự án nào (gói D, 25/09/2026) → **mặc định KHÔNG cài**; script in danh sách bị bỏ. `--with-experimental` cài. Đích **đã có** skill thử nghiệm (cài trước 25/09/2026 hoặc bằng cờ) → `update` **giữ và cập nhật**, không tự gỡ, không tính "thừa"; `--check` gắn nhãn "thử nghiệm" (đã cài / chưa cài). `--scope docs` thắng: `ac-*` thử nghiệm vẫn không cài. Skill thoát nhãn khi chạy thật trên một dự án và có bằng chứng bắt lỗi — gỡ khỏi khoá registry.
> 🔒 **Quét bảo mật nguồn trước khi chép** (đợt 7, 25/09/2026). Bản cài không chỉ là tài liệu: 3 hook gắn vào `settings.json` đích chạy ở mọi Read/Edit/Stop, và agent đích đọc mọi `SKILL.md` như chỉ thị — nguồn bị xâm nhập là code lạ ở **mọi** dự án đích (`dev-*` clone từ ngoài, `steal` kéo repo lạ, `upstream-diff.js` chỉ so hash). `install.js` chạy `ba-toolkit/scripts/scan-skills.js` trên `.claude/` của NGUỒN (injection · ký tự vô hình/bidi · tải-rồi-chạy · gọi mạng · shell ghép chuỗi · đọc khoá/credential/token · ghi ra home · base64 dài trong .md); còn hit 🔴 chưa duyệt → **DỪNG, không chép gì**, in hit. Ngoại lệ hợp lệ nằm ở `ba-toolkit/references/security-allowlist.json` (`file · loai · ly_do · nguoi_duyet · het_han`) — mục hết hạn hoặc mồ côi bị cảnh báo. Đã soi và chấp nhận rủi ro → `--allow-unsafe` (manifest ghi lại). `--check`/`--dry` chỉ in dòng tóm tắt quét, không chặn. Kiểm `.claude/` của một dự án đã cài (skill/agent sửa cục bộ): `node .claude/skills/ba-toolkit/scripts/scan-skills.js .claude`.

Copy **trọn vẹn bộ skill** từ repo toolkit này sang một dự án khác để dùng được cả pipeline BA lẫn khâu dev:
- **`ba-*`** (55 skill — con số chuẩn xem `CLAUDE.md`/`lint.js`) — pipeline phân tích nghiệp vụ, kèm `conventions.md`, `lint.js`, `build.js`, `vendor/mermaid.min.js`, templates/rules.
- **`dev-*`** (11 skill) — framework dev/QA (clone superpowers + orchestrator `dev-run`), để dự án đích chạy được khâu code từ `plan.md` mà không cần cài plugin superpowers.
- Agent review `ba-*.md` (vd `ba-diagram-reviewer`).
- File hướng dẫn (README, GUIDELINE) + folder `explain/` (giải thích nghiệp vụ từng skill) → `explain/`.

## Ba cách gọi

| Lệnh | Đứng ở đâu | Làm gì |
|---|---|---|
| `ba-export` *(mặc định)* | dự án đích | **Cài mới / cài đè** toàn bộ toolkit |
| **`ba-export check`** | **dự án đang dùng toolkit** | **Chỉ so sánh, không ghi gì** — báo có bản mới không, file nào đổi, file nào mình đã sửa cục bộ |
| **`ba-export update`** | **dự án đang dùng toolkit** | Chạy `check` → trình bảng thay đổi → hỏi → kéo bản mới về |
| **`ba-export report`** | **dự án đang dùng toolkit** | **Chỉ đọc, ẩn danh** — xuất số liệu dự án này trả ngược về toolkit (xem mục dưới) |

### `ba-export check` / `ba-export update` — quy trình

1. Chạy script ngay trong dự án hiện tại (bản đã được copy về khi cài):
   ```bash
   node .claude/skills/ba-export/scripts/install.js --check          # chỉ xem
   node .claude/skills/ba-export/scripts/install.js                  # kéo bản mới
   ```
   Script **tự tìm nguồn** theo thứ tự: `--from` → **`.claude/ba-toolkit.json` của chính dự án này** → repo cạnh script → `ba-source.txt`. Nhờ manifest, dự án tiêu dùng **không cần nhớ đường dẫn repo toolkit**.
2. **Diễn giải cho người dùng** kết quả `--check`: đích đang bám commit nào ↔ nguồn đang ở commit nào · bao nhiêu file có bản mới · **danh sách file đã sửa cục bộ** (sẽ được giữ nguyên) · **skill đã gộp** (`cũ → mới`, canon `deprecated.skills`) sẽ được gỡ hay bị giữ · khối **`git log a..b`** của nguồn (skills/agents/decisions) và **tiêu đề decision mới/đổi** — đọc cái "vì sao" trước khi quyết cập nhật.
3. Có file **xung đột** (sửa cục bộ **và** nguồn cũng đổi) → nêu rõ: bản cục bộ đang **che mất** cập nhật từ nguồn. Hỏi người dùng: giữ bản cục bộ · để họ tự merge · hay `--force` lấy bản nguồn.
4. Người dùng đồng ý → chạy bản không có `--check`, rồi **nhắc khởi động lại Claude Code**.
5. Nguồn không tồn tại (repo đã di chuyển/xoá) → script báo lỗi; sửa `source.path` trong `.claude/ba-toolkit.json` hoặc chạy lại kèm `--from <đường-dẫn-mới>`.

> **Lưu ý bootstrap:** `install.js` đang chạy là **bản copy ở dự án đích**. Nếu chính `install.js` cũng có bản mới ở nguồn, nó sẽ được cập nhật **trong lần chạy này** nhưng logic áp dụng vẫn là bản cũ — chạy lại lần nữa nếu thấy script vừa được cập nhật. *(Thực tế đã gặp: dự án cập nhật xong có `install.js` mới nhưng **chưa có manifest**, vì lúc chạy vẫn là bản cũ chưa biết ghi manifest.)*

> **Dự án cài từ trước khi có manifest:** chạy **một lần** kèm `--from <repo>` để tạo dấu vết; từ lần sau không cần nữa. Không có manifest thì script báo lỗi rõ ("trông như một dự án ĐANG DÙNG toolkit, không phải repo nguồn") kèm đúng lệnh cần chạy — **không** tự trỏ vào chính dự án.

## Hai bẫy đã xử lý (đừng gỡ đi)

**1. Dự án đích khai `"type": "module"` → mọi script chết.** Toolkit viết theo CommonJS (`require`). Dự án dùng Vite/Next/Tauri/React thường khai `"type": "module"` ở `package.json` gốc, khiến Node coi **mọi** `.js` là ES module ⇒ cả 8 script (`build.js`, `lint.js`, `status.js`, `refresh.js`, `scan.js`, `hook-lint.js`, `deploy.js`, `install.js`) chết với `require is not defined`. Vì Node lấy `type` từ **package.json gần nhất đi ngược lên**, `install.js` ghi một `package.json` tối giản `{"type":"commonjs"}` ngay tại **`<đích>/.claude/skills/`** — mọi script bên dưới quay về CommonJS mà **không đụng** `package.json` của dự án.

**2. Dự án tiêu dùng bị nhận nhầm là repo nguồn.** Sau khi cài, dự án đích cũng đầy skill `ba-*` — nếu chỉ dựa vào dấu hiệu đó thì `--check` chạy trong dự án sẽ tự trỏ vào chính nó rồi chết ở guard "đích trùng nguồn". Dấu hiệu phân biệt: **`explain/` ở gốc chỉ có ở repo toolkit** (khi export nó thành `explain/`). Cùng dấu hiệu mà `hook-lint.js` dùng để tự tắt nhánh lint-skill ở dự án tiêu dùng.

## Dấu vết cài đặt — `.claude/ba-toolkit.json` (ở dự án đích)

Mỗi lần cài, script ghi manifest gồm: **nguồn** (đường dẫn + git remote/branch/**commit**), ngày cài, số skill/agent, và **hash từng file đã copy**. Đây là thứ nối dự án tiêu dùng với repo toolkit:

- Biết **đang dùng bản nào** (commit) và nguồn ở đâu → `check`/`update` chạy được từ phía dự án.
- Phân biệt được ba trạng thái mỗi file: **đổi ở nguồn** · **sửa cục bộ ở đích** · **xung đột** (cả hai).
- **Chính sách khi có sửa cục bộ: GIỮ BẢN CỤC BỘ, chỉ cảnh báo** — không bao giờ âm thầm nuốt sửa đổi của dự án. Muốn lấy bản nguồn thì thêm `--force`.
- Mốc lưu trong manifest là **hash bản NGUỒN**, không phải bản cục bộ → cảnh báo "file này đã sửa cục bộ" **lặp lại ở mọi lần chạy** cho tới khi xử lý, không tự im sau một lần.
- Nên **commit** file này vào git của dự án đích (nó là hồ sơ phiên bản toolkit đang dùng).

## Cách dùng (cài mới)
Skill này có thể đặt **toàn cục** (`~/.claude/skills/ba-export`) để mọi dự án gọi được.
Khi đó script đọc đường dẫn repo nguồn từ `ba-source.txt` (ghi lúc cài global).
Nếu chạy ngay trong repo toolkit, nó tự định vị nguồn = repo chứa nó.

### Bản GLOBAL là BOOTSTRAP MỎNG — đừng copy `install.js` lên đó nữa

`~/.claude/skills/ba-export/scripts/install.js` **không phải** bản copy của installer. Nó là bootstrap
(bản gốc giữ trong repo tại **`global-bootstrap.js`**): đọc `ba-source.txt` → **gọi thẳng
`install.js` của repo nguồn** với nguyên tham số, giữ nguyên thư mục hiện tại.

**Vì sao đổi (12/08/2026):** trước đó bản global là snapshot chép tay, sửa logic ở repo không
lan sang nó ⇒ nó lặng lẽ cũ dần. Sự cố thật: dự án cài 12/08 nhận khối `BA-TOOLKIT:diagram-rule`
đời cũ thay vì `BA-TOOLKIT:briefing` đầy đủ, nên agent ở dự án đích **không biết pipeline/gate/bổn
phận cập nhật `docs/`** — biểu hiện ra ngoài là "gọi khởi tạo mà không chạy full skill". File
copy được thì vẫn đủ (logic copy không đổi), chỉ khối briefing hụt. Bootstrap thì không có gì để cũ.

Dựng lại bản global (khi mất `~/.claude`, hoặc máy mới):
```bash
mkdir -p ~/.claude/skills/ba-export
cp .claude/skills/ba-export/scripts/global-bootstrap.js ~/.claude/skills/ba-export/scripts/install.js
cp .claude/skills/ba-export/SKILL.md            ~/.claude/skills/ba-export/SKILL.md
pwd > ~/.claude/skills/ba-export/ba-source.txt   # chạy từ gốc repo toolkit
```
Repo nguồn di chuyển/đổi tên → sửa **một chỗ duy nhất**: `ba-source.txt`.

Đứng trong **dự án đích** và chạy (bản global):
```
node "$HOME/.claude/skills/ba-export/scripts/install.js"
```
Hoặc trỏ thẳng tới repo nguồn:
```
node "<đường-dẫn-tuyệt-đối>/BA_toolkit_v3.0/.claude/skills/ba-export/scripts/install.js"
```
Tham số tùy chọn:
- `--to <đích>` — thư mục dự án đích (mặc định = thư mục hiện tại).
- `--from <nguồn>` — repo BA toolkit nguồn (mặc định: **manifest của đích** → repo cạnh script → `ba-source.txt`).
- `--check` — **không ghi gì**, chỉ so đích với nguồn rồi báo. Exit code `0` = đang mới nhất · `1` = có cập nhật (dùng được trong CI).
- `--force` — ghi đè **cả** file đã sửa cục bộ ở đích (mặc định: giữ bản cục bộ).
- `--dry` — chỉ in danh sách sẽ copy, không ghi gì (xem trước).
- `--prune` — xoá skill `ba-*`/`dev-*` **thừa** ở đích (có ở đích nhưng không còn ở nguồn, vd skill đã đổi tên/gỡ). Mặc định chỉ cảnh báo, không xoá.
- **Skill đã gộp** (canon `deprecated.skills`, đọc từ khối ```registry như `lint.js`) **không cần `--prune`**: update tự gỡ bản cũ nếu mọi file của nó còn đúng hash trong manifest; có file sửa/thêm cục bộ → **GIỮ + cảnh báo** (chuyển phần sửa sang skill mới rồi chạy kèm `--force`). `--check` báo `cũ → mới` và tính vào exit 1.
- `--allow-dirty` — cho cài khi nguồn còn thay đổi **chưa commit** trong phần sẽ copy (`.claude/skills`, `.claude/agents`, `explain/`, file hướng dẫn). Mặc định **từ chối** khi đích là dự án thật (có `.git`); đích không phải git repo chỉ bị cảnh báo. Manifest ghi `source.dirtyFiles/dirtyCount/allowDirty` — bản cài từ nguồn dirty không khớp commit nào, lần update sau cần biết điều đó. Thay đổi NGOÀI phần copy (`workshop/`, spec nháp) không tính dirty ở đâu cả — cả dòng "Phiên bản … (nguồn có thay đổi chưa commit)" lẫn `git.dirty` trong manifest.
- **Ghi an toàn:** `settings.json`, `CLAUDE.md`, manifest ghi qua tệp tạm + rename, bản trước giữ ở `.bak` (`.claude/*.bak`, `CLAUDE.md.bak` được thêm vào `.gitignore` nếu dự án có file đó).
- `--no-claude` — **bỏ qua** bước ghi directive vào `CLAUDE.md` của đích (xem dưới).

> ⚠️ Nếu di chuyển/đổi tên repo BA_toolkit gốc, sửa lại đường dẫn trong
> `~/.claude/skills/ba-export/ba-source.txt` cho khớp.

## `ba-export report` — vòng phản hồi từ dự án thật

Toolkit có đủ ba vai **bên trong** một dự án: `ba-*` viết đặc tả · `dev-run` thực thi · `ba-review`/agent chấm. Nhưng **không vai nào chấm chính toolkit** trên nhiều dự án. Thứ duy nhất từng đo được là `usage.js`, mà nó chỉ đọc transcript của **một máy** — nên mọi câu "skill X ít dùng", "cổng Y hay đỏ", "nên gộp skill Z" đều là suy đoán từ đồ thị tham chiếu **tĩnh** giữa các `SKILL.md`. Đồ thị đó đo **thiết kế**, không đo **thực tế**.

```bash
node .claude/skills/ba-export/scripts/report.js [--project <dir>] [--docs <dir>] [--plain] [--with-name]
```

Ghi `.claude/ba-toolkit-report.json`. Gồm: hồ sơ dự án · phiên bản toolkit đang cài · **file toolkit bị sửa tại đích** · tiến độ theo màn · gap theo mức · sổ CR/WI/PD · số lần baseline bị sửa · tần suất skill.

**Tín hiệu mạnh nhất không phải số lần gọi skill, mà là file toolkit bị SỬA TẠI ĐÍCH.** `install.js` đã lưu hash từng file lúc cài, nên chỗ nào lệch hash là chỗ người dùng phải **tự tay chữa mặc định của toolkit**. Một file mà nhiều dự án cùng sửa nghĩa là **mặc định đó sai**, không phải người dùng lạc lối — và đó là thứ không đồ thị tham chiếu nào nhìn ra được.

**Ẩn danh theo thiết kế:** chỉ số đếm, mã ID, tên skill và đường dẫn file **của toolkit**. Không tên tài liệu nghiệp vụ, không nội dung, không tên dự án (trừ `--with-name`). Mặc định phải an toàn khi gửi đi.

**Không phải cổng.** Exit luôn 0, kể cả khi thiếu dữ liệu; thiếu gì thì ghi vào `gioiHan` chứ không đoán thay. Để nó chặn được `ba-accept` là biến một phép đo thành chướng ngại vật — và cái bị bỏ đầu tiên khi vội luôn là phép đo.

**Chạy trong chính repo nguồn thì nó tự nhận ra và bỏ qua phần so sánh** (dấu hiệu: `explain/` ở gốc). Bẫy này sập ngay lần chạy thử đầu: manifest ở repo nguồn là dấu vết một lần tự-cài cũ, nên mỗi commit sau đó biến thành một "file bị người dùng sửa" — 66 file báo nhầm.

## Sẽ copy (ghi đè)
- Mọi `.claude/skills/ba-*` **và** `.claude/skills/dev-*` → `<đích>/.claude/skills/` (toàn bộ — hiện 55 `ba-*` + 11 `dev-*`; con số chuẩn xem `CLAUDE.md`/lint), copy đệ quy nên kèm hết file companion (`conventions.md`, `lint.js`, `hook-lint.js`, `build.js`, `refresh.js`, `scan.js`, `status.js`, `vendor/mermaid.min.js`…).
- Mọi agent `.claude/agents/ba-*.md` → `<đích>/.claude/agents/` (vd `ba-diagram-reviewer` — gate soát coverage sơ đồ). Chỉ file `ba-*`, KHÔNG đụng agent riêng của đích.
- `README.md` → `<đích>/BA-TOOLKIT-README.md`.
- `example/GUIDELINE.md` → `<đích>/BA-TOOLKIT-GUIDELINE.md`.
- Folder `explain/*.md` (hướng dẫn nghiệp vụ từng skill) → `<đích>/explain/`.
- Mọi file hướng dẫn được thêm banner đầu file (báo đã import; thư mục `example/` không kèm theo).
- **`CLAUDE.md` của đích** — ghi/cập nhật một **khối managed** (giữa marker `<!-- BA-TOOLKIT:briefing ... -->`) chứa **bản briefing** của toolkit: vòng đời 4 giai đoạn + thứ tự lõi GĐ2, "không chắc đang ở bước nào → `ba-next`", **bổn phận khi động vào `docs/`** (cập nhật `00-tracking.md`; đổi baseline phải mở CR; việc dev mới ghi WI), layout folder `<Mã> - <Tên>` + chuỗi ID, luật swimlane, và trỏ `conventions.md` làm nguồn sự thật.

  **Vì sao cần khối này.** Ở dự án đích, agent chỉ tự nạp (a) dòng `description` của từng skill và (b) `CLAUDE.md`. `conventions.md` chỉ được đọc khi một skill bảo nó đọc — nên mọi lần agent sửa tài liệu mà **không chạy skill nào** (rất phổ biến: *"thêm ràng buộc X vào srs màn Login"*) nó không biết luật nào cả: không cập nhật tracking, không mở CR khi đổi baseline, đặt tên folder/mã sai. Khối này lấp đúng khoảng đó — tóm tắt luật hay bị vi phạm nhất, **không** chép cả `conventions.md`.

  Idempotent (chạy lại chỉ cập nhật, không nhân bản); chưa có `CLAUDE.md` → tạo mới; giữ nguyên nội dung cũ ngoài khối. Bản cài đời trước dùng marker `BA-TOOLKIT:diagram-rule` (chỉ có luật sơ đồ) — installer **tự gỡ khối cũ** rồi ghi khối mới, không để dự án ôm cả hai. Bỏ qua bằng `--no-claude`.
- **`.claude/settings.json` của đích** — merge **hook PostToolUse** (`node .claude/skills/ba-toolkit/scripts/hook-lint.js`): sửa `docs/**/*.md` → lint Mermaid tự chạy, cảnh báo trả ngay cho agent. Idempotent (nhận diện bằng chuỗi lệnh); settings hỏng JSON → bỏ qua kèm hướng dẫn thêm tay; giữ nguyên hook khác của đích.

## Lưu ý
- **Ghi đè** skill `ba-*`/`dev-*` trùng tên ở đích — **trừ file đã sửa cục bộ** (giữ nguyên + cảnh báo; `--force` để ép).
- Skill thừa ở đích (đổi tên/gỡ ở nguồn) **không tự xoá** — script liệt kê và gợi ý `--prune` để dọn cho sạch. Ngoại lệ: skill **đã gộp** trong `deprecated.skills` được gỡ tự động khi không bị sửa cục bộ (xem tham số).
- Từ chối nếu đích trùng nguồn (không tự cài đè chính mình).
- KHÔNG copy thư mục `example/` → các link `example/...` trong guideline chỉ có ở repo gốc.
- Chỉ cần Node (≥16.7 cho `fs.cpSync`), không cần `npm install`.
- Sau khi chạy: **khởi động lại Claude Code** trong dự án đích để nạp skill.
