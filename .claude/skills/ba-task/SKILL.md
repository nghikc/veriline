---
name: ba-task
description: Use when cần theo dõi việc dev KHÔNG phải Change Request — tính năng trong phạm vi, task kỹ thuật, bug, spike; cấp mã WI vào 00-backlog.md, nối trace và commit. Có ba-task list|status.
---

> **Hồ sơ `lite` tắt skill này** (`conv-gates.md` → "Hồ sơ dự án"): dự án lite không dùng sổ Work Item — việc dev bám cột `dev` của tracking, còn thay đổi baseline đi qua `ba-change-request`. Người dùng gọi thẳng `ba-task` ở dự án lite → nói rõ điều đó và hỏi: mở sổ WI luôn (tức chuyển sang `full`) hay ghi thành CR.

# ba-task — Sổ Work Item (backlog phát triển)

## Mục tiêu
Cho **mọi việc phát triển KHÔNG phải Change Request** một chỗ theo dõi có vòng đời — giống sổ CR nhưng cho *việc mới/kỹ thuật*: cấp mã `WI-01` vào **sổ trung tâm `docs/00-backlog.md`**, ghi ai làm / khi nào / đang tới đâu / xong chưa / nối vào đâu trong chuỗi truy vết. Sổ là **nhật ký công việc** của dự án, bổ khuyết cho cột `dev` của `00-tracking.md` (cột đó chỉ roll-up trạng thái code **theo màn**, không ghi được việc phi-màn lẫn xuất xứ).

> **Phân vai — đừng nhầm với CR:**
> - `ba-change-request` (`00-cr.md`) = **THAY ĐỔI cái đã chốt** (baseline): cần phân tích ảnh hưởng + cổng duyệt. Vd đổi rule đã có, thêm field vào màn đã build.
> - `ba-task` (`00-backlog.md`) = **VIỆC MỚI trong phạm vi** hoặc **việc kỹ thuật**: dựng màn/tính năng đã lên kế hoạch, refactor, dựng CI, sửa bug, spike. Không đổi baseline mà *tạo* baseline mới.
> - Nghi ngờ "đây là thay đổi hay việc mới?" → nếu nó **sửa một FR/F/S/rule ĐÃ CHỐT** thì là CR; nếu nó **thêm mới** hoặc **thuần kỹ thuật (không đụng yêu cầu)** thì là WI.

## Cách gọi
- `ba-task <mô tả> [--loai Feature|Task|Bug|Tech|Spike]` — mở một WI mới rồi (tùy chọn) chạy tiếp.
- `ba-task list` — đọc sổ, gom WI theo trạng thái (đang mở vs đã xong), highlight `Blocked`.
- `ba-task status <mã>` — xem hoặc **chuyển trạng thái** một WI (Đang làm/Đang review/Xong/Blocked/Hủy) kèm ngày + ghi chú.

## Đọc sổ bằng script — KHÔNG Read cả file (tiết kiệm token)
Sổ backlog phình theo thời gian; **đừng Read nguyên `00-backlog.md`** cho thao tác cơ giới. Dùng `ledger.js` (zero-dep) trả lát compact:
```bash
node .claude/skills/ba-toolkit/scripts/ledger.js docs/00-backlog.md summary   # đếm + danh sách WI đang mở (cho `list`)
node .claude/skills/ba-toolkit/scripts/ledger.js docs/00-backlog.md next       # mã WI kế tiếp (cho bước 0)
node .claude/skills/ba-toolkit/scripts/ledger.js docs/00-backlog.md get WI-07  # chỉ block chi tiết WI-07 (cho `status`/tra cứu)
node .claude/skills/ba-toolkit/scripts/ledger.js docs/00-backlog.md ids        # [{id,status,open}] — cross-check marker
```
Chỉ Read/Edit trực tiếp file khi **thêm hoặc sửa** một WI (append dòng bảng + block, hoặc đổi ô trạng thái) — chạm đúng vùng liên quan, không nạp toàn bộ.

## Loại Work Item (`Loại`)
| Loại | Dùng cho | Ghi chú trace |
|---|---|---|
| **Feature** | Tính năng/màn mới **trong phạm vi** (không phải CR) | Đi qua `ba-add-screen [feature]` để cấp `FR`/`F`/`S`; WI là lớp theo dõi việc bọc ngoài |
| **Task** | Việc triển khai thường (không sinh yêu cầu mới) | Trace về `F`/`S`/`R-S` liên quan nếu có |
| **Bug** | Cái đã build nhưng sai so với đặc tả | Trace về `R-S..`/`TC..` bị vi phạm; sửa xong nhớ cập nhật/chạy lại TC |
| **Tech** | Nợ kỹ thuật, refactor, hạ tầng, CI, bảo mật nền | Trace về `NFR`/ràng buộc nếu có; thường không có `S` |
| **Spike** | Khảo sát/POC có thời hạn để giảm bất định | Kết quả = quyết định/`ADR`/`OQ` đóng; không giao code sản phẩm |

## Vòng đời (trạng thái)
`Backlog → Sẵn sàng → Đang làm → Đang review → Xong`, với hai nhánh rẽ: **Blocked** (ghi chặn ở đâu + điều kiện gỡ) và **Hủy** (không làm nữa, ghi lý do). **Không xoá dòng** — WI Xong/Hủy đều giữ lại (sổ là lịch sử công việc). Mỗi chuyển trạng thái ghi **ngày + người + ghi chú** vào mục chi tiết.

## Quy trình (mở + theo dõi một WI)
Đọc `conventions.md` + `conv-gates.md` (mục "Work Item (WI)"). Làm rõ với người dùng: việc gì, thuộc `Loại` nào, chạm `F`/`S` nào — nếu mơ hồ "đây là thay đổi hay việc mới" thì hỏi (AskUserQuestion) rồi route sang `ba-change-request` nếu thực chất là CR.

0. **Mở WI (Backlog):** lấy mã kế tiếp bằng `ledger.js … next` (chưa có sổ → tạo theo `template.md`) → cấp `WI-<NN>` (bộ đếm **toàn cục**) → **append** dòng bảng tổng + mục chi tiết `### WI-NN` với: ngày, loại, người phụ trách, tóm tắt, ưu tiên (MoSCoW), trace dự kiến (`FR`/`F`/`S`), **nguồn** (người dùng nêu · biên bản họp `ACT-..` · roadmap · phát hiện khi test…). Trạng thái = **Backlog**. *(Không Read cả sổ — xem "Đọc sổ bằng script".)*
1b. **Cổng phương án (BẮT BUỘC khi WI chạm tài liệu — `conv-gates.md` → "Cổng phương án").** WI kiểu **Feature** (sẽ gọi `ba-add-screen [feature]`/`ba-screen-spec` → sinh loạt file) → trình phương án đủ 6 phần rồi `AskUserQuestion` **Chạy / Sửa phương án / Thu hẹp phạm vi / Hủy** trước khi gọi skill con. WI chỉ **mở sổ để theo dõi** (Tech/Bug/Spike thuần code, chỉ ghi `00-backlog.md`) → dưới ngưỡng: IN phương án ngắn rồi chạy thẳng, không chờ.
1. **Trace & phạm vi:** nối WI vào chuỗi truy vết ở mức phù hợp — Feature → `FR`/`F`/`S` (qua `ba-add-screen [feature]`); Bug → `R-S..`/`TC..` bị vi phạm; Tech → `NFR`/ràng buộc. Ghi rõ file/màn sẽ chạm.
2. **Bắt đầu làm:** khi khởi động → **Đang làm** (ghi người + ngày). Việc Feature chạm tài liệu BA thì chạy skill tương ứng (`ba-add-screen [feature]`/`ba-screen-spec`…); việc Tech/Bug thuần code thì để `dev-run` làm, WI chỉ theo dõi.
3. **Review → Xong:** code xong + test xanh → **Đang review**; nghiệm thu/merge xong → **Xong** + ngày, điền **Phạm vi thực tế** (docs + file code) và **Commit/nhánh**. Bị chặn giữa chừng → **Blocked** (ghi chặn ở đâu, WI/điều kiện gỡ). Bỏ → **Hủy** + lý do.
4. **Đồng bộ tracking:** WI kiểu Feature/Bug chạm một màn → nhắc cập nhật `00-tracking.md` (ô tài liệu + cột `dev` do `dev-run` quản, cột "Cập nhật cuối").

## Nối luồng (BẮT BUỘC rà)
- **`dev-run`** khi build một màn/việc → cập nhật WI liên quan (Đang làm → Xong) song song cột `dev` của tracking.
- **`ba-discover meet`**: `ACT` họp là **việc mới/kỹ thuật** (không phải thay đổi) → mở WI (ghi nguồn `họp <ngày> · ACT-..`); nếu là **thay đổi baseline** → mở CR. Biên bản ghi chéo `→ WI-NN`.
- **`ba-next`** liệt kê WI đang mở (Backlog/Đang làm/Blocked) như đang làm với CR/ACT; `Blocked` là tín hiệu gấp.
- **`ba-add-screen [feature]`**: khi mở một tính năng/màn mới ngoài kế hoạch gốc → nên mở WI kèm để có vòng đời theo dõi (không bắt buộc, nhưng khuyến nghị cho việc lớn).

## Tiêu chí chất lượng (BẮT BUỘC)
- Mỗi WI có **Loại + người phụ trách + trạng thái + nguồn**; việc không chủ = việc sẽ trôi → hỏi để chốt, đừng để trống.
- **Không nhầm CR vào đây:** việc sửa baseline phải qua `ba-change-request` (có cổng duyệt), không ghi lẫn vào backlog.
- WI **Xong** phải điền Phạm vi thực tế + Commit; **Blocked** phải ghi điều kiện gỡ.
- **Không xoá dòng** — sổ là lịch sử; đổi trạng thái tại chỗ.

## Ranh giới
- KHÁC `ba-change-request`: CR đổi cái **đã chốt** (baseline), WI là **việc mới** hoặc việc kỹ thuật.

## Lưu ý
- Sổ `docs/00-backlog.md` thuộc họ `00-` (living), **vào portal** như `00-cr.md` (là lịch sử dự án, stakeholder đọc được).
- Bug: mặc định **gộp chung sổ này** (cột `Loại = Bug`). Dự án nhiều lỗi muốn sổ defect riêng thì tách sau — quy ước mặc định là một sổ cho gọn.
- Văn phong & Thuật ngữ: bổ sung `00-glossary.md` (Work Item, Backlog, Kanban, Spike, Tech-debt) khi cần.
- Tiếng Việt; mã/loại giữ nguyên (`WI-01`, `Feature`…).
- **Xong bước này → chạy `ba-next`** — nó quét lại `docs/` để tính vị trí pipeline và đề xuất bước kế. Đừng tự đoán bước tiếp theo, cũng đừng nhảy cóc.
