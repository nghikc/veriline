# Template — `docs/Ho-so/sitemap-flows.md`

> File này chứa **các hành trình người dùng chính** (phần LLM viết), được `scripts/sitemap.js` của `ba-portal` nhúng vào mục "Hành trình người dùng chính" của `sitemap.html`. Văn phong cho **người dùng cuối**: không thuật ngữ dev, mỗi bước nói rõ *người dùng làm gì → thấy gì → sang màn nào*. Mỗi hành trình khớp một luồng có thật trong `usecase.md` — không bịa.

```
### Hành trình 1: <Tên hành trình, vd "Đăng ký & vào việc lần đầu">

*Ai:* <vai trò, vd Người dùng mới> · *Mục tiêu:* <việc muốn đạt>

1. **[S06 — Đăng ký]** Người dùng nhập email/mật khẩu, đặt tên tổ chức → bấm Đăng ký.
2. Hệ thống tạo tài khoản + tổ chức, tự đăng nhập → chuyển **[S02 — Dashboard]**.
3. **[S02 — Dashboard]** Thấy bảng công việc trống + nút "Tạo công việc" → …
4. …

> *Điều kiện/nhánh phụ (nếu có):* vd email đã tồn tại → báo lỗi tại chỗ, ở lại S06.

### Hành trình 2: <vd "Tạo và giao một công việc">
…

### Hành trình 3: <vd "Xem & cập nhật một công việc">
…
```

## Biến thể Mermaid (tùy chọn — trực quan hơn cho end user)
`sitemap-flows.md` được render qua `ba-portal` nên **vẽ hành trình bằng Mermaid là chạy được**. Có thể thay (hoặc bổ sung) các bước đánh số bằng một sơ đồ — mỗi màn một node, cạnh là hành động chuyển màn:

```
​```mermaid
flowchart TD
    S06["S06 · Đăng ký"] -->|Đăng ký thành công| S02["S02 · Dashboard"]
    S02 -->|Nhấn công việc| S03["S03 · Chi tiết công việc"]
    S03 -->|Quay lại| S02
​```
```

- **Chọn loại đúng** (theo `conventions.md` → "Bộ chọn sơ đồ Mermaid"): hành trình **một vai** → `flowchart`; hành trình **≥2 vai trò có bàn giao** → `swimlane-beta` (mỗi vai một lane). Đừng dùng flowchart cho luồng đa vai (giấu vai trò).
- **An toàn cú pháp:** bọc nhãn node trong `"…"`; tránh `()`/`"` lẻ trong nhãn cạnh (`ba-portal` sẽ báo lỗi lint và bọc try/catch từng sơ đồ).
- **Giữ mã `S..` trong nhãn node** (vd `S02["S02 · Dashboard"]`) — để cổng `--check` kiểm màn ma và để khớp phần Wireframe bên dưới trong trang.
- Nên **kèm cả text lẫn sơ đồ**: sơ đồ cho cái nhìn tổng, các bước đánh số cho chi tiết "thấy gì / nhánh phụ".

## Quy tắc
- **2–4 hành trình** bao các tác vụ quan trọng nhất (đừng liệt kê mọi thao tác — đó là việc của `ba-accept userguide`).
- Mỗi bước/nút neo **mã màn `S..`** (để khớp phần Wireframe bên dưới trong trang) và bám đúng luồng chính/ngoại lệ trong `usecase.md`.
- Nêu điều kiện rẽ nhánh quan trọng (quyền, lỗi) ngắn gọn; chi tiết để `usecase`/`srs` lo.
