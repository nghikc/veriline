---
name: ba-changelog
description: Use when cần biết tài liệu ĐÃ CHỐT vừa bị sửa gì và tác động nghiệp vụ ra sao — ghi sổ docs/00-changelog.md kèm mã truy vết, cờ đổi baseline chưa có CR.
---

> **Hồ sơ `lite` tắt skill này** (`conv-gates.md` → "Hồ sơ dự án"): hook không ghi hàng đợi nên không có gì để gom. Gọi thẳng ở dự án lite → báo hàng đợi trống vì hồ sơ, **đừng** kết luận "không ai sửa tài liệu đã chốt".

# ba-changelog — Nhật ký thay đổi tài liệu đã chốt

## Mục tiêu
Trả lời câu hỏi **"tài liệu đã chốt vừa bị đổi cái gì, ai chịu ảnh hưởng?"** — thứ mà hôm nay không sổ nào ghi: sửa tài liệu **ngoài luồng skill/CR** thì `00-cr.md` không có dòng, `00-backlog.md` không có dòng, `00-tracking.md` may lắm được đổi ngày.

Sinh/cập nhật `docs/00-changelog.md`. Xem quy ước đầy đủ ở `conventions.md` → **"Nhật ký thay đổi"** (gồm bảng ranh giới với sổ CR/WI và **ba rule bắt buộc** cho mỗi dòng).

> **Không thay `ba-change-request`.** CR hỏi *"được phép đổi không?"* **trước** khi sửa; changelog ghi *"thực tế đã đổi gì"* **sau** khi sửa. Changelog phát hiện đổi baseline mà không có CR → nó **tố giác**, không hợp thức hoá.

## Ba cách gọi

| Lệnh | Làm gì |
|---|---|
| `ba-changelog` *(mặc định)* | Gom hàng đợi → diễn giải → **ghi sổ** → dọn hàng đợi |
| `ba-changelog check` | **Không ghi gì** — chỉ in ra đang tồn bao nhiêu thay đổi chưa vào sổ, màn nào |
| `ba-changelog <màn>` | Chỉ xử lý thay đổi của một màn |

## Điều kiện
- **Hàng đợi:** `.claude/spec-changes.jsonl` — do nhánh 0 của `ba-toolkit/hook-lint.js` ghi tự động mỗi lần Edit/Write một file **trong folder màn ✅ Hoàn thành** (`00-tracking.md`). Hàng đợi rỗng → báo "không có thay đổi nào" và dừng, KHÔNG tự đi quét git cho có việc.
- **Xếp ưu tiên theo `idsChanged`, KHÔNG theo `±dòng`.** Mỗi bản ghi (từ 03/09/2026) mang thêm `idsChanged: [{id, trangThai, truong}]` và `soIdChanged` — do `ba-toolkit/semdiff.js` tính cho đúng file vừa ghi. Dùng chúng để chọn việc:
  - `soIdChanged = 0` mà `±dòng` lớn → sửa văn xuôi/định dạng/sơ đồ, **không chạm baseline**. Ghi một dòng gọn, đừng gọi agent.
  - Có `idsChanged` → đọc **`truong`** để biết đổi cái gì: đổi `Trace` là chuyện truy vết, đổi `Quy tắc`/`Kích hoạt khi`/`Acceptance criteria` là **đổi baseline** → soát cờ `⚠️ chưa có CR`.
  - `banGoNoiLai: true` → bảng vừa được nối lại; các ID "thêm" ở file đó rất có thể là dòng cũ vừa hiện ra, **không phải phạm vi mới**. Đối chiếu trước khi ghi sổ.
  - Bản ghi **không có** `idsChanged` (bản cài cũ, hoặc chưa từng commit `docs/`) → quay về cách cũ, dựa `±dòng` và đọc diff.
  *(Vì sao đổi: đo trên 14 commit của repo mẫu, một commit **27 file / +240 dòng** chạm **0 ID**, còn một commit **3 file / +6 dòng** thì đổi baseline. `±dòng` xếp hạng ngược.)*
- Hàng đợi là **file cục bộ, nên gitignore** (`.claude/spec-changes.jsonl`) — nó là bộ đệm, không phải tài liệu.
- Dự án chưa từng commit `docs/` → mọi bản ghi mang `note: file-moi-chua-track`, không có diff để so → báo rõ và chỉ ghi được dòng "file mới", không suy được tác động.

## Quy trình

1. **Đọc hàng đợi.** Không có file / rỗng → báo và dừng. Đọc `conventions.md` + `conv-gates.md` → "Nhật ký thay đổi".
2. **Gom thành thay đổi TRỌN VẸN.** Nhiều dòng cùng `file` → gộp làm một (chỉ giữ mốc thời gian đầu–cuối). Nhiều file cùng `folder` trong **cùng một cụm thời gian** → gom thành **một lô của màn đó**. Đây là lý do hook chỉ ghi vết chứ không phân tích: phân tích từng lần lưu file là phân tích trạng thái viết dở.
3. **Lấy diff (skill làm, KHÔNG phải agent).** Với mỗi file: `git diff -- <file>`; file `file-moi-chua-track` → không có diff, đánh dấu "file mới". Agent `ba-change-observer` cố tình **không có Bash** (đồng bộ 5 agent còn lại: `Read, Grep, Glob`) — giữ đảm bảo chỉ-đọc, nên khâu chạy lệnh là của skill.
4. **Đọc sổ CR/WI bằng script** (đừng Read cả sổ): `node .claude/skills/ba-toolkit/scripts/ledger.js docs/00-cr.md summary` + `… ids` → danh sách CR đang mở để agent đối chiếu.
5. **Spawn `ba-change-observer`** — một lần cho cả lô (không phải mỗi file một agent). Truyền: danh sách thay đổi + nội dung diff + danh sách CR/WI đang mở.
   - **Trần kích thước lô: 8 file.** Quá 8 → chia nhiều lượt **theo màn** (không cắt giữa chừng một màn: các file cùng màn phải nằm cùng lượt, không thì agent mất ngữ cảnh chéo srs↔test). Lô lớn mà không chia thì một lượt vừa chậm vừa đắt, và agent dễ bỏ sót file cuối.
   - **Nhắc lại phạm vi quét trong prompt** (agent đã có trong định nghĩa, nhưng nhắc để không trôi): chỉ **folder màn của lô** + **`03-overview.md`** + **`NN-*.md` cấp tổng (01–12)**; màn khác chỉ được **trỏ**, không đọc.
   - Nhận về: bảng dòng nhật ký + mức 🔴/🟡/🟢 + mã truy vết + cờ `⚠️ chưa có CR` + mâu thuẫn + mục "có thể lan rộng" + cờ `BLOCKING`.
6. **`BLOCKING` = HARD STOP.** Agent trả `BLOCKING: có` → **dừng, KHÔNG ghi sổ**, báo BA/PO ngay: lý do + danh sách thay đổi liên quan + đề xuất (mở CR / hoàn nguyên / rà lại). Chỉ ghi sổ sau khi người dùng xử lý hoặc xác nhận "cứ ghi nhận, tôi biết rồi".
7. **Ghi sổ `docs/00-changelog.md`** (chưa có → tạo theo `template.md` cùng thư mục): **append** vào đầu bảng (mới nhất lên trên), mỗi thay đổi một dòng. **Không xoá, không sửa dòng cũ** — ghi sai thì thêm dòng đính chính.
8. **Định tuyến (BẮT BUỘC nêu, không tự làm):**
   - Dòng 🔴 kèm `⚠️ chưa có CR` → **đề xuất** `ba-change-request` cho đúng phạm vi đó. Người dùng đồng ý mới chạy; skill này **không tự mở CR**.
   - Mâu thuẫn giữa doc → đề xuất `ba-review <màn>` hoặc `ba-consistency-reviewer`.
   - Mục **"có thể lan rộng"** của agent (màn khác dùng chung mã vừa bị chạm — agent chỉ trỏ, cố ý không đọc) → đề xuất `ba-consistency-reviewer` để xác nhận. Đây là **ranh giới có chủ đích**, đừng "tiện tay" tự đi đọc màn đó thay agent.
   - Màn bị đổi mà `00-tracking.md` chưa đổi "Cập nhật cuối" → nhắc `ba-track`.
9. **Dọn hàng đợi.** Ghi sổ xong → xoá các dòng đã xử lý khỏi `.claude/spec-changes.jsonl` (giữ lại dòng chưa xử lý nếu chạy theo màn). `check` thì **không dọn**.
10. **Báo cáo:** số thay đổi đã ghi (theo mức) · số cờ `⚠️ chưa có CR` · mâu thuẫn phát hiện · việc đề xuất tiếp theo.

## Nối luồng
- **`ba-review`** — chạy scope `all` thì nên gọi `ba-changelog check` trước để biết có thay đổi ngoài luồng chưa vào sổ; còn tồn → gap **🟡 Quan trọng** (tài liệu đã chốt bị đổi mà không ai ghi nhận).
- **`ba-change-request`** — CR áp xong sẽ sửa tài liệu, hook ghi vết như mọi thay đổi khác; agent thấy có `CR-NN` phủ đúng phạm vi → ghi mã vào cột Truy vết, **không** gắn cờ. Đây là đường đi đúng, không phải lỗi.
- **`ba-accept`** — trước khi nghiệm thu một phase, chạy `ba-changelog` để sổ không còn tồn đọng; nhật ký là bằng chứng "tài liệu nghiệm thu đúng bản đã duyệt".
- **`ba-track`** — sau khi ghi sổ, màn nào có thay đổi thì "Cập nhật cuối" phải khớp.

## Ranh giới
- `ba-changelog check` chỉ xem, không ghi.

## Lưu ý
- **Chỉ theo dõi màn ✅ Hoàn thành** (định nghĩa baseline hiện tại). Muốn phủ cả tài liệu cấp dự án (`01-requirements.md`, `02-functions.md`…) thì mở rộng ở `recordSpecChange()` trong `hook-lint.js` — cố ý để hẹp trước, tránh nhiễu.
- **Hook không gọi được agent.** Hook là lệnh shell; nó chỉ ghi vết. Mọi phân tích chạy ở skill này. Đừng "cải tiến" bằng cách cho hook exit 2 để ép agent chính phân tích ngay — một lần `ba-batch` sẽ nổ hàng chục lượt LLM trên trạng thái viết dở.
- **Không chép diff vào sổ** — rule cứng. Sổ để BA/PO đọc, không phải để dev đọc; muốn xem diff thì đã có git.
- Tiếng Việt; ngày dạng `YYYY-MM-DD`.
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
