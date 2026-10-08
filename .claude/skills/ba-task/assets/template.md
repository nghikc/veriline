# Template khởi tạo `docs/00-backlog.md`

Dùng khi sổ chưa tồn tại. Mã `WI-01` là bộ đếm **toàn cục**; một dòng bảng tổng = một WI + một mục chi tiết `### WI-NN`. Không xoá dòng.

```markdown
# Sổ Work Item (Backlog phát triển)

> Nhật ký công việc phát triển **không phải Change Request** (tính năng mới trong phạm vi, task kỹ thuật, bug, spike). Do `ba-task` quản; dòng không bao giờ bị xoá — sổ là lịch sử công việc.
> Việc **THAY ĐỔI cái đã chốt** → `docs/00-cr.md` (ba-change-request), không ghi ở đây.

| Mã WI | Ngày mở | Loại | Phụ trách | Tóm tắt | Ưu tiên | Trace (FR/F/S) | Trạng thái | Cập nhật cuối |
|-------|---------|------|-----------|---------|---------|----------------|-----------|---------------|
| WI-01 | 2026-07-29 | Feature | (tên) | (tóm tắt 1 dòng) | Should | FR-15 · F15 · S07 | Backlog | 2026-07-29 |

---

### WI-01 — (tóm tắt)
- **Loại:** Feature | Task | Bug | Tech | Spike
- **Nguồn:** người dùng nêu · họp <ngày> · `ACT-..` · roadmap `08-roadmap.md` · phát hiện khi test · nợ kỹ thuật…
- **Mô tả & mục tiêu:** … (làm gì, để đạt điều gì)
- **Trace:** FR-.. → F.. → S.. (Feature) · hoặc R-S..-.. / TC.. (Bug) · hoặc NFR-.. / ràng buộc (Tech). Ghi "—" nếu thuần kỹ thuật không gắn yêu cầu.
- **Phạm vi dự kiến:** file/màn sẽ chạm; skill sẽ dùng (`ba-add-feature`/`ba-add-screen`/`dev-run`…).
- **Phụ trách:** (một người). **Ưu tiên:** Must/Should/Could (MoSCoW).
- **Phạm vi thực tế:** — (điền khi Xong: docs + file code đã đổi)
- **Commit/nhánh:** —
- **Lịch sử trạng thái:** 2026-07-29 Backlog.
```

**Vòng đời:** `Backlog → Sẵn sàng → Đang làm → Đang review → Xong` (+ nhánh **Blocked** ghi điều kiện gỡ, **Hủy** ghi lý do). Mỗi chuyển trạng thái thêm một dòng `YYYY-MM-DD <trạng thái> (người · ghi chú)` vào "Lịch sử trạng thái".
