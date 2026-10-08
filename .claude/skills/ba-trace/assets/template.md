# Ma trận truy vết yêu cầu (RTM) — <Tên dự án>

> Ảnh chụp từ `docs/` bởi `ba-trace`. Chuỗi chuẩn: **BR → StR → FR/NFR → F → S → R-S → UC/US → TC**.
> Cập nhật: <YYYY-MM-DD>. Không sửa tay — chạy lại `ba-trace` khi tài liệu đổi.

## 1. Tổng quan độ phủ

| Chỉ số | Đếm | Ghi chú |
|--------|-----|---------|
| BR / StR | – / – | yêu cầu nghiệp vụ · nhu cầu bên liên quan |
| FR / NFR | – / – | chức năng · phi chức năng |
| F (chức năng) | – | |
| S (màn hình) | – | |
| R-S (yêu cầu màn) | – | (– chức năng · – phi CN) |
| UC / US | – / – | |
| TC (test case) | – | |

| Cạnh phủ | Tỉ lệ | Thiếu |
|----------|-------|-------|
| FR → F | x/y (z%) | (FR mồ côi: …) |
| F → S | x/y (z%) | |
| S → R-S | x/y (z%) | |
| R-S(CN) → TC | x/y (z%) | (R-S thiếu test: …) |
| NFR → R-S phi CN | x/y (z%) | |

## 2. Ma trận xuôi (gộp theo màn)

> Mỗi dòng = một `R-S`. Ô thượng nguồn (BR/FR/F) và hạ nguồn (UC/US/TC) liệt kê ID cách nhau dấu phẩy; `—` nếu trống.

### S01 — <Tên màn>  · Mã CN: F..  · Trạng thái: ✅ đã build

| R-S | ⬆ FR/BR | ⬆ F | UC | US | TC | Phủ | Ghi chú |
|-----|---------|-----|----|----|----|-----|---------|
| R-S01-01 | FR03 | F02 | UC-S01-01 | US-S01-01 | TC-S01-01, TC-S01-02 | 🟢 | |
| R-S01-N01 | NFR01 | — | — | — | TC-S01-05 | 🟢 | phi CN |
| R-S01-06 | NFR03 | F01 | — | — | — | 🟢 | khoá TK — kiểm qua BRule-Login |

*(lặp block cho mỗi màn. Màn ⬜ chưa build → ghi 1 dòng "planned, chưa có srs — 🟢 không chặn".)*

## 3. Độ phủ mỗi tầng (%)
- **FR→F:** x/y (z%). Mồ côi: `FR..`.
- **F→S:** x/y (z%).
- **S→R-S:** x/y (z%).
- **R-S(CN)→TC:** x/y (z%). Thiếu test: `R-S..`.
- **NFR→R-S phi CN:** x/y (z%).

## 4. Bất thường & gap

> Chỉ 🔴/🟡 mới chặn gate. Màn ⬜ chưa build, chức năng nền không màn, R-S phi CN kiểm ngoài, NFR phủ gián tiếp → **🟢 chấp nhận** (liệt kê ở mục dưới, không chặn).

| Mức | Loại | ID | Mô tả | Đề xuất |
|-----|------|----|-------|---------|
| 🔴 | Yêu cầu mồ côi | FR.. | Không có chức năng/màn nào cài đặt | `ba-functions`/`ba-add-feature` |
| 🔴 | Ref gãy | R-S..-.. → F99 | Trace tới ID không tồn tại | Sửa `srs.md` |
| 🔴 | Màn ✅ thiếu srs | S.. | **Đã build** nhưng chưa có yêu cầu màn | `ba-screen-spec` |
| 🟡 | Màn ✅ thiếu test | S.. | Đã build, có srs nhưng chưa TC | `ba-test` |
| 🟡 | TC mồ côi ngược | TC-S..-.. | Không neo vào **bất kỳ** R-S/UC/BRule nào | Sửa `test.md` |

**🟢 Chấp nhận (không chặn) — ghi chú minh bạch:**
- Màn ⬜ planned chưa có srs/test: `S03`, `S04`… (theo lộ trình, chưa tới lượt).
- Chức năng nền không màn: `F09` (cron nhắc email) — khai ở `03-overview.md`.
- R-S phi CN kiểm bằng công cụ ngoài (load test/axe): `R-S..-N..`.
- NFR phủ gián tiếp: `NFR03` qua R-S đăng nhập; `NFR04` ràng buộc hạ tầng.

*(Không bất thường 🔴/🟡 → ghi "🟢 Mọi tầng nối liền mạch — không có yêu cầu mồ côi, không ref gãy, không TC mồ côi.")*
