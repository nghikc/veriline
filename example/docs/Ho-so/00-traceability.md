# Ma trận truy vết yêu cầu (RTM) — TeamTasks

> Ảnh chụp từ `docs/` bởi `ba-trace`. Chuỗi chuẩn: **BR → StR → FR/NFR → F → S → R-S → UC/US → TC**.
> Cập nhật: **2026-08-06** *(sau đợt `ba-review` lần 5/6 dọn mâu thuẫn S02–S05: thêm `R-S05-21` mở khoá `PERM_LOCKED`, `BRule-S03-13`/`BRule-S05-13`, và 5 `TC` mới TC-S02-45 · TC-S04-41 · TC-S05-54/55/56)*. Không sửa tay — chạy lại `ba-trace` khi tài liệu đổi.
> Quan hệ ghép **theo trace đã khai trong tài liệu**, không suy đoán. **Cả 6 màn đã đặc tả đủ 9/9** — RTM lần này phủ trọn chuỗi tới `TC`.
> Nhánh đầu nguồn `BO`/`PS`/`U` → `UN` (`00-urd.md`, `00-personas.md`, `00-vision.md`) **không nằm trong chuỗi RTM chuẩn** — xem đối chiếu `UN → FR` ở cuối `00-urd.md`.

## 1. Tổng quan độ phủ

| Chỉ số | Đếm | Ghi chú |
|--------|-----|---------|
| BR / StR | 5 / 5 | yêu cầu nghiệp vụ (BR-01…05) · nhu cầu bên liên quan (StR-01…05) |
| FR / NFR | **14** / 7 | chức năng FR-01…**FR-14** (`FR-14` do `CR-01`) · phi chức năng NFR-01…07 |
| F (chức năng) | **14** | F01…**F14** (`F14` Xuất báo cáo tiến độ — `CR-01`) |
| S (màn hình) | 6 | S01…S06 — **cả 6 đã đặc tả ✅** |
| R-S (yêu cầu màn) | **134** | 95 chức năng · 39 phi chức năng *(thêm `R-S05-21` mở khoá `PERM_LOCKED`)* |
| UC / US | **39 / 35** | use case *(thêm `UC-S05-10`)* · user story |
| TC (test case) | **255** | mọi `TC` neo ngược hợp lệ (0 mồ côi); phần lớn neo trực tiếp một `R-S`, còn lại qua `UC`/`BRule`/ma trận lỗi `E-S` |
| e2e (Playwright) | 6/6 màn | 208 `TC` `Auto` có `test()` mang mã · 42 `Manual` có `test.skip` · 0 mồ côi. **5 `TC` Auto mới (đợt lần 5/6) chưa sinh e2e — chạy `ba-test-e2e` để đồng bộ** |

| Cạnh phủ | Tỉ lệ | Thiếu |
|----------|-------|-------|
| FR → F | **14/14 (100%)** | — không `FR` mồ côi |
| F → S | 13/14 (93%) | `F09` (nhắc deadline qua email) — chức năng nền, không có màn riêng *(chủ ý)* |
| S → R-S | **6/6 (100%)** | — mọi màn ✅ đều có `srs.md` |
| R-S (chức năng) → TC | **95/95 (100%)** | — không yêu cầu chức năng nào thiếu test (`R-S05-21` mới có `TC-S05-55,56`) |
| TC neo ngược | **255/255 (100%)** | — không `TC` treo ngoài chuỗi |
| NFR → nơi hiện thực | 6/7 (86%) | `NFR-04` (uptime ≥ 99,5%) — ràng buộc hạ tầng, không gắn màn |
| Ref gãy (`scan.js`) | **0** | — mọi ID được tham chiếu đều tồn tại ở tầng của nó |

## 2. Ma trận xuôi (gộp theo màn)

> Mỗi dòng = một `R-S`. Cột `UC`/`US`/`TC` rút gọn phần tiền tố (`UC 01` = `UC-S0x-01`). Dòng `-N..` là yêu cầu phi chức năng. `—` = không có liên kết khai báo.

### S01 — Đăng nhập / Đăng xuất  · Mã CN: F01, F02

| R-S | ⬆ FR/NFR · BR | ⬆ F | UC | US | TC | Phủ |
|-----|---------------|-----|----|----|----|-----|
| R-S01-01 | FR-01 | F01 | 01 | 01 | TC-S01-07,08,09,10,11,12,13,14 | 🟢 |
| R-S01-02 | FR-01 | F01 | — | — | TC-S01-03,05,06,09,10 | 🟢 |
| R-S01-03 | FR-01 | F01 | 01 | 01 | TC-S01-01,02,25 | 🟢 |
| R-S01-04 | FR-01 | F01 | 01 | 01 | TC-S01-01,02,04 | 🟢 |
| R-S01-05 | FR-01 | F01 | 02 | 02 | TC-S01-15,16,17 | 🟢 |
| R-S01-06 | FR-01 | F01 | 03 | 03 | TC-S01-18,19,20 | 🟢 |
| R-S01-07 | FR-01 | F01 | 04 | 04 | TC-S01-21 | 🟢 |
| R-S01-08 | FR-01 | F01 | 05 | 05 | TC-S01-23,24 | 🟢 |
| R-S01-09 | FR-01 | F02 | 06 | 06 | TC-S01-30,31,32 | 🟢 |
| R-S01-10 | FR-01 | F01 | — | 07 | TC-S01-29 | 🟢 |
| R-S01-11 | FR-01 · BR-03 | F01 | 07 | — | TC-S01-33,34,35,36 | 🟢 |
| R-S01-N01 | NFR-02 · BR-03 | — | — | — | TC-S01-26 | 🟢 |
| R-S01-N02 | NFR-02 · BR-03 | — | — | — | TC-S01-27 | 🟢 |
| R-S01-N03 | NFR-01 · BR-01 | — | — | — | — | 🟢 |
| R-S01-N04 | NFR-05 · BR-04 | — | — | — | TC-S01-28 | 🟢 |
| R-S01-N05 | NFR-07 · BR-01 | — | — | — | — | 🟢 |

### S02 — Dashboard  · Mã CN: F03, F04, F08, F14

| R-S | ⬆ FR/NFR · BR | ⬆ F | UC | US | TC | Phủ |
|-----|---------------|-----|----|----|----|-----|
| R-S02-01 | FR-03 | F03 | 01 | 01 | TC-S02-01,02 | 🟢 |
| R-S02-02 | FR-03 | F03 | 01 | 01 | TC-S02-37 | 🟢 |
| R-S02-03 | FR-03 | F03 | 01 | 02 | TC-S02-06,07,38 | 🟢 |
| R-S02-04 | FR-03 | F03 | 01 | 02 | TC-S02-08 | 🟢 |
| R-S02-05 | FR-03 | F03 | 01 | 01 | TC-S02-04 | 🟢 |
| R-S02-06 | FR-03 | F03 | 01 | — | TC-S02-09 | 🟢 |
| R-S02-07 | FR-04 | F04 | 02 | 03 | TC-S02-16 | 🟢 |
| R-S02-08 | FR-04 | F04 | 02 | 03 | TC-S02-18,19,20,21,25,26 | 🟢 |
| R-S02-09 | FR-05 | F04 | 02 | 03 | TC-S02-24 | 🟢 |
| R-S02-10 | FR-04 | F04 | 02 | 03 | TC-S02-15 | 🟢 |
| R-S02-11 | FR-04 | F04 | 02 | 03 | TC-S02-27 | 🟢 |
| R-S02-12 | FR-09 | F08 | 03 | 04 | TC-S02-30 | 🟢 |
| R-S02-13 | FR-09 | F08 | 03 | 04 | TC-S02-31 | 🟢 |
| R-S02-14 | FR-09 | F08 | 03 | 04 | TC-S02-31 | 🟢 |
| R-S02-15 | FR-09 | F08 | 03 | 04 | TC-S02-32 | 🟢 |
| R-S02-16 | FR-09 | F08 | 03 | 04 | TC-S02-33 | 🟢 |
| R-S02-17 | FR-14 | F14 | 04 | — | TC-S02-42 | 🟢 |
| R-S02-18 | FR-14 | F14 | 04 | — | TC-S02-40,41,45 | 🟢 |
| R-S02-N01 | NFR-01 · BR-01 | — | 01 | — | — | 🟢 |
| R-S02-N02 | NFR-05 · BR-04 | — | 02 | — | — | 🟢 |
| R-S02-N03 | NFR-06 · BR-03 | — | 01 | — | TC-S02-03 | 🟢 |
| R-S02-N04 | NFR-02 · BR-03 | — | 02 | — | TC-S02-12,17 | 🟢 |
| R-S02-N05 | NFR-07 · BR-01 | — | — | — | TC-S02-36 | 🟢 |
| R-S02-N06 | NFR-01 · BR-01 | — | — | — | TC-S02-14 | 🟢 |
| R-S02-N07 | NFR-02 · BR-03 | — | 04 | — | TC-S02-43 | 🟢 |

### S03 — Chi tiết công việc  · Mã CN: F05, F06, F07

| R-S | ⬆ FR/NFR · BR | ⬆ F | UC | US | TC | Phủ |
|-----|---------------|-----|----|----|----|-----|
| R-S03-01 | FR-07 | F05 | 01 | 01 | TC-S03-01,02,15 | 🟢 |
| R-S03-02 | FR-07 | F05 | 01 | 01 | TC-S03-03,04 | 🟢 |
| R-S03-03 | FR-07 | F05 | 01 | 01 | TC-S03-05 | 🟢 |
| R-S03-04 | FR-08 | F07 | 01, 04 | 01, 04 | TC-S03-06 | 🟢 |
| R-S03-05 | FR-08 | F07 | 04 | 04 | TC-S03-44,45,46,47,55 | 🟢 |
| R-S03-06 | — | F07 | 04 | 04 | TC-S03-49 | 🟢 |
| R-S03-07 | FR-06 | F06 | 01 | 02 | TC-S03-26,28 | 🟢 |
| R-S03-08 | FR-06 | F06 | 02 | 02 | TC-S03-16 | 🟢 |
| R-S03-09 | FR-06 | F06 | 02 | 02 | TC-S03-17 | 🟢 |
| R-S03-10 | FR-06 | F06 | 03 | 03 | TC-S03-18 | 🟢 |
| R-S03-11 | FR-06 | F06 | 03 | 03 | TC-S03-19,20,21,22 | 🟢 |
| R-S03-12 | FR-06 | F06 | 06 | 06 | TC-S03-29,31,51 | 🟢 |
| R-S03-13 | FR-06 | F06 | 02, 06 | 06 | TC-S03-23,24,25 | 🟢 |
| R-S03-14 | FR-06 | F06 | 05 | 05 | TC-S03-38,40 | 🟢 |
| R-S03-15 | FR-06, FR-07 | F05, F06 | 02, 03, 05, 07 | 02, 05 | TC-S03-32 | 🟢 |
| R-S03-16 | FR-06, FR-09 | F06, F08 | 02, 03, 06, 07 | 03, 06 | TC-S03-33 | 🟢 |
| R-S03-17 | FR-07 | F05 | 01 | 01 | TC-S03-08 | 🟢 |
| R-S03-18 | FR-07 | F05 | — | — | TC-S03-14 | 🟢 |
| R-S03-N01 | NFR-01 · BR-01 | — | — | — | TC-S03-53 | 🟢 |
| R-S03-N02 | NFR-06 · BR-03 | — | 01 | — | TC-S03-09 | 🟢 |
| R-S03-N03 | NFR-02 · BR-03 | — | 01 | — | TC-S03-10 | 🟢 |
| R-S03-N04 | NFR-02 · BR-03 | — | 02, 03 | — | TC-S03-27 | 🟢 |
| R-S03-N05 | NFR-07 · BR-01 | — | — | — | TC-S03-52 | 🟢 |
| R-S03-N06 | NFR-01 · BR-01 | — | — | 04 | TC-S03-13 | 🟢 |

### S04 — Hồ sơ cá nhân  · Mã CN: F10

| R-S | ⬆ FR/NFR · BR | ⬆ F | UC | US | TC | Phủ |
|-----|---------------|-----|----|----|----|-----|
| R-S04-01 | FR-11 | F10 | 01 | 01 | TC-S04-01 | 🟢 |
| R-S04-02 | FR-11 | F10 | 01 | 01 | TC-S04-02 | 🟢 |
| R-S04-03 | FR-11 | F10 | 02 | 02 | TC-S04-09,11,12,13,14 | 🟢 |
| R-S04-04 | FR-11 | F10 | 02 | 02 | TC-S04-15,16,17 | 🟢 |
| R-S04-05 | FR-11 | F10 | 01 | 01 | TC-S04-04 | 🟢 |
| R-S04-06 | FR-11 | F10 | 01, 02 | 02 | TC-S04-08,10 | 🟢 |
| R-S04-07 | FR-11 | F10 | 02 | 02 | TC-S04-09 | 🟢 |
| R-S04-08 | FR-11 | F10 | 02 | 02 | TC-S04-18 | 🟢 |
| R-S04-09 | FR-11 | F10 | 05 | 05 | TC-S04-20 | 🟢 |
| R-S04-10 | FR-11 | F10 | 03 | 03 | TC-S04-23 | 🟢 |
| R-S04-11 | FR-11 | F10 | 03 | 03 | TC-S04-28 | 🟢 |
| R-S04-12 | FR-11 | F10 | 03 | 03 | TC-S04-27 | 🟢 |
| R-S04-13 | FR-11 | F10 | 03 | 03 | TC-S04-26 | 🟢 |
| R-S04-14 | FR-11 | F10 | 03 | 03 | TC-S04-24,25 | 🟢 |
| R-S04-15 | FR-11 | F10 | 03, 04 | 04 | TC-S04-33,35 | 🟢 |
| R-S04-16 | FR-11 | F10 | 03 | 03 | TC-S04-24 | 🟢 |
| R-S04-17 | FR-11 | F10 | 03 | 03 | TC-S04-32 | 🟢 |
| R-S04-N01 | NFR-02 · BR-03 | — | 03 | — | TC-S04-37 | 🟢 |
| R-S04-N02 | NFR-02 · BR-03 | — | 03 | 03 | TC-S04-29,30,31 | 🟢 |
| R-S04-N03 | NFR-02 · BR-03 | — | 03 | — | TC-S04-38 | 🟢 |
| R-S04-N04 | NFR-03 · BR-03 | — | 03 | — | TC-S04-36,41 | 🟢 |
| R-S04-N05 | NFR-06 · BR-03 | — | 01 | — | TC-S04-05,07 | 🟢 |
| R-S04-N06 | NFR-07 · BR-01 | — | — | — | TC-S04-39 | 🟢 |
| R-S04-N07 | NFR-01 · BR-01 | — | 01 | — | TC-S04-40 | 🟢 |

### S05 — Tổ chức  · Mã CN: F11, F13

| R-S | ⬆ FR/NFR · BR | ⬆ F | UC | US | TC | Phủ |
|-----|---------------|-----|----|----|----|-----|
| R-S05-01 | FR-12 | F11 | 01 | 01 | TC-S05-01 | 🟢 |
| R-S05-02 | FR-12 | F11 | 01 | 01 | TC-S05-04,05,06 | 🟢 |
| R-S05-03 | FR-12 | F11 | 01 | 01 | TC-S05-07,08 | 🟢 |
| R-S05-04 | FR-12 | F11 | 01 | 01 | TC-S05-03 | 🟢 |
| R-S05-05 | FR-12 | F11 | 01 | 01 | TC-S05-02,04,10 | 🟢 |
| R-S05-06 | FR-12 | F11 | 01 | 01 | TC-S05-09 | 🟢 |
| R-S05-07 | FR-02 | F13 | 02 | 02 | TC-S05-13 | 🟢 |
| R-S05-08 | FR-02 | F13 | 02 | 02 | TC-S05-14,15 | 🟢 |
| R-S05-09 | FR-02 | F13 | 02 | 02 | TC-S05-16 | 🟢 |
| R-S05-10 | FR-02 | F13 | 02 | 02 | TC-S05-17 | 🟢 |
| R-S05-11 | FR-02 | F13 | 02 | 03 | TC-S05-18,53 | 🟢 |
| R-S05-12 | FR-02 | F13 | 03 | 04 | TC-S05-22,23,28,29,54 | 🟢 |
| R-S05-13 | FR-02 | F13 | 03, 04 | 04 | TC-S05-24 | 🟢 |
| R-S05-14 | FR-02 | F13 | 03 | 04 | TC-S05-26 | 🟢 |
| R-S05-15 | FR-02 | F13 | 05 | 05 | TC-S05-32 | 🟢 |
| R-S05-16 | FR-02 | F13 | 06 | 05 | TC-S05-35,36 | 🟢 |
| R-S05-17 | FR-02 | F13 | 06, 09 | 05 | TC-S05-37 | 🟢 |
| R-S05-18 | FR-02 | F13 | 08 | 05 | TC-S05-40 | 🟢 |
| R-S05-19 | FR-02 | F13 | 05, 06, 07 | 06 | TC-S05-45,46,47,48,49 | 🟢 |
| R-S05-20 | FR-02 | F13 | 06, 08 | 05 | TC-S05-39,41 | 🟢 |
| R-S05-21 | FR-02 | F13 | 10 | — | TC-S05-55,56 | 🟢 |
| R-S05-N01 | NFR-06 · BR-03 | — | 02 | 02 | TC-S05-21 | 🟢 |
| R-S05-N02 | NFR-02 · BR-03 | — | 03, 05 | 03 | TC-S05-31,33,42,53 | 🟢 |
| R-S05-N03 | NFR-02 · BR-03 | — | 03 | 04 | TC-S05-30 | 🟢 |
| R-S05-N04 | NFR-02 · BR-03 | — | 03, 04 | 04 | TC-S05-25 | 🟢 |
| R-S05-N05 | NFR-02 · BR-03 | — | 01 | 03 | TC-S05-20 | 🟢 |
| R-S05-N06 | NFR-01 · BR-01 | — | 01 | — | TC-S05-51 | 🟢 |
| R-S05-N07 | NFR-07 · BR-01 | — | — | — | TC-S05-52 | 🟢 |

### S06 — Đăng ký  · Mã CN: F12

| R-S | ⬆ FR/NFR · BR | ⬆ F | UC | US | TC | Phủ |
|-----|---------------|-----|----|----|----|-----|
| R-S06-01 | FR-13 | F12 | 01 | 01, 06 | TC-S06-14,15 | 🟢 |
| R-S06-02 | FR-13 | F12 | — | — | TC-S06-03,06 | 🟢 |
| R-S06-03 | FR-13 | F12 | 03 | 03 | TC-S06-16,21,22 | 🟢 |
| R-S06-04 | FR-13 | F12 | 03, 04 | 04 | TC-S06-11,12 | 🟢 |
| R-S06-05 | FR-13 | F12 | — | 05 | TC-S06-13,20 | 🟢 |
| R-S06-06 | FR-13 | F12 | 01, 05 | 01 | TC-S06-01,02,18 | 🟢 |
| R-S06-07 | FR-13 | F12 | 02 | 02 | TC-S06-07,08 | 🟢 |
| R-S06-08 | FR-13 | F12 | 01 | 01 | TC-S06-01,02,05 | 🟢 |
| R-S06-09 | FR-13 | F12 | 06 | — | TC-S06-17 | 🟢 |
| R-S06-10 | FR-13 | F12 | — | 07 | TC-S06-19 | 🟢 |
| R-S06-N01 | NFR-02 · BR-03 | — | — | — | — | 🟢 |
| R-S06-N02 | NFR-02 · BR-03 | — | 03 | 03 | TC-S06-09,10 | 🟢 |
| R-S06-N03 | NFR-02 · BR-01 | — | — | — | — | 🟢 |
| R-S06-N04 | NFR-02 · BR-03 | — | — | — | — | 🟢 |
| R-S06-N05 | NFR-01 · BR-01 | — | — | — | — | 🟢 |
| R-S06-N06 | NFR-05 · BR-01 | — | — | — | TC-S06-04 | 🟢 |
| R-S06-N07 | NFR-07 · BR-01 | — | — | — | — | 🟢 |

## 3. Độ phủ mỗi tầng

- **FR→F: 14/14 (100%).** Không `FR` mồ côi. `FR-14` (xuất báo cáo tiến độ, do `CR-01`) đã có `F14` và xuống tới `R-S02-17/18` + `TC` — dư chấn của `CR-01` đã dọn ở tầng tài liệu.
- **F→S: 13/14 (93%).** Không có màn: `F09` (nhắc deadline qua email) — chủ ý là chức năng nền, kết quả nhìn thấy qua hộp thư, không dựng màn riêng (khai rõ trong `03-overview.md`).
- **S→R-S: 6/6 (100%).** Ba màn `S03`/`S04`/`S05` — lần chạy trước còn ⬜ — nay đã đủ `srs`/`usecase`/`userstory`/`test`, nên chuỗi liền mạch tới `TC` cho toàn bộ hệ.
- **R-S(chức năng)→TC: 95/95 (100%).** Không yêu cầu chức năng nào thiếu test. `R-S05-21` (mở khoá `PERM_LOCKED`, thêm khi `ba-review` lần 6 vá gap S01↔S05) có `TC-S05-55` (Positive) + `TC-S05-56` (Negative — chỉ Org Admin, `BRule-S05-13`).
- **NFR→nơi hiện thực: 6/7 (86%).** Đã xuống `R-S` phi chức năng: `NFR-01`, `NFR-02`, `NFR-03`, `NFR-05`, `NFR-06`, `NFR-07`. Chưa xuống: `NFR-04` (uptime ≥ 99,5%/tháng) — ràng buộc hạ tầng vận hành, không gắn màn nào.

## 4. Bất thường & gap

> Chỉ 🔴/🟡 chặn gate. Chức năng nền không màn, `R-S` phi chức năng kiểm ngoài UI, `NFR` phủ gián tiếp → **🟢 chấp nhận**.

| Mức | Loại | ID | Mô tả | Đề xuất |
|-----|------|----|-------|---------|
| 🟢 | Chức năng nền không có màn | `F09` | Nhắc deadline qua email — không có màn riêng (chủ ý, khai ở `03-overview.md`) | Không cần sửa |
| 🟢 | NFR ràng buộc hạ tầng | `NFR-04` | Uptime ≥ 99,5%/tháng — theo dõi ở vận hành, không gắn màn | Chấp nhận, ngoài phạm vi màn |
| 🟢 | `R-S` chức năng không có `UC` lẫn `US` khai trực tiếp | `R-S01-02`, `R-S03-18`, `R-S06-02` | Là ràng buộc/hành vi nền của màn (không thành một use case kể được), **nhưng đều có `TC` phủ** nên chuỗi xuống test không đứt | Chấp nhận; hoặc gắn vào một `UC` sẵn có cho tường minh |
| 🟢 | `R-S` phi chức năng chưa có `TC` riêng | các dòng `-N..` không có `TC` | Yêu cầu hiệu năng/bảo mật/a11y — kiểm bằng load test, kiểm thử bảo mật hoặc công cụ a11y, ngoài bảng `TC` chức năng | Bổ sung `TC` phi chức năng hoặc dẫn chiếu phương thức kiểm riêng |
| 🟢 | Lệch nhỏ vị trí đặc tả | `F02` | `03-overview.md` map `F02` → `S02`, nhưng `F02` (Đăng xuất) thực chất đặc tả tại `S01` qua `R-S01-09`; Dashboard chỉ đặt điểm truy cập | Không cản; giữ nguyên hoặc ghi chú thống nhất |

**Kiểm ref gãy:** `scan.js` báo **0** — mọi ID xuất hiện trong cột "Truy vết"/"Nguồn" đều tồn tại ở tầng của nó.
**TC mồ côi ngược:** không có — 255/255 `TC` neo vào `R-S`, `UC` hoặc `BRule` hợp lệ.

---

> **Kết luận: 🟢 không có gap chặn.** Chuỗi `BR→StR→FR/NFR→F→S→R-S→UC/US→TC` liền mạch cho **cả 6 màn**: không yêu cầu mồ côi, không ref gãy, không `TC` treo. Các điểm 🟢 còn lại (chức năng nền `F09`, `NFR-04` hạ tầng, `R-S` phi chức năng kiểm ngoài UI) đều là ngoại lệ có chủ đích.
