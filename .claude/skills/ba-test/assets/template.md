# Tài liệu kiểm thử — <Tên màn hình> (Mã màn: S0x)

> Mỗi acceptance criterion (GWT) trong userstory, mỗi yêu cầu `R-S..`, và mỗi luồng use case (kể cả ngoại lệ) → ≥1 test case.
> Phủ đủ Positive · Negative · Edge; độ sâu theo Risk Level. Suy ca bằng kỹ thuật EP/BVA/DT/ST.
> Test Data ghi **giá trị cụ thể** (cấm placeholder).

Kỹ thuật: EP = Equivalence Partitioning · BVA = Boundary Value Analysis · DT = Decision Table · ST = State Transition.
Risk: Cao / Trung bình / Thấp · Priority: Critical / High / Medium / Low.
**Trạng thái:** Chưa chạy / Đã chạy (đã thực thi chưa — mặc định `Chưa chạy`). **Kết quả:** Pass / Fail / Blocked / Skip (kết luận khi chạy; `—` khi chưa chạy). **Cách chạy:** Manual / Auto.

## Tổng hợp thực thi (roll-up)
> Cập nhật sau mỗi lần chạy test (manual hoặc automation). Đếm Pass/Fail/Blocked/Skip theo cột **Kết quả**; `Chưa chạy` theo cột **Trạng thái**.

| Tổng TC | Pass | Fail | Blocked | Skip | Chưa chạy | % Pass | Lần chạy cuối |
|---------|------|------|---------|------|-----------|--------|---------------|
| 5 | 0 | 0 | 0 | 0 | 5 | 0% | — |

## Chức năng: <tên> (F0x) — Risk: <Cao / Trung bình / Thấp>

| Mã TC | Loại | Kỹ thuật | Nguồn | Risk | Priority | Chức năng | Nội dung chức năng | Tiền điều kiện | Các bước | Test Data | Kết quả mong đợi | Cách chạy | Trạng thái | Kết quả |
|-------|------|----------|-------|------|----------|-----------|--------------------|----------------|----------|-----------|------------------|-----------|------------|---------|
| TC-S0x-01 | Positive | EP | R-S0x-01 / GWT-1 | Cao | Critical | F01 | Đăng nhập bằng email + mật khẩu | Đã ở màn <...> | 1. Nhập email + mật khẩu hợp lệ<br>2. Nhấn <Đăng nhập> | email: `user@teamtasks.vn`, mật khẩu: `Abc@1234` | Vào Dashboard, hiển thị tên người dùng | Auto | Chưa chạy | — |
| TC-S0x-02 | Negative | EP | R-S0x-01 / GWT-2 | Cao | High | F01 | Đăng nhập bằng email + mật khẩu | Như trên | 1. Nhập email sai định dạng<br>2. Nhấn <Đăng nhập> | email: `abc@` (thiếu domain) | Chặn gửi, báo "Email không hợp lệ" | Auto | Chưa chạy | — |
| TC-S0x-03 | Edge | BVA | R-S0x-02 | Trung bình | Medium | F01 | Đăng nhập bằng email + mật khẩu | Như trên | 1. Nhập mật khẩu dài quá hạn | nhập 256 ký tự (max 255) | Chặn, báo "Tối đa 255 ký tự" | Manual | Chưa chạy | — |
| TC-S0x-04 | Negative | DT | R-S0x-03 | Cao | High | F01 | Đăng nhập bằng email + mật khẩu | Như trên | 1. Bỏ trống mật khẩu<br>2. Nhấn <Đăng nhập> | email: `user@teamtasks.vn`, mật khẩu: (trống) | Nút disable / báo "Vui lòng nhập mật khẩu" | Auto | Chưa chạy | — |
| TC-S0x-05 | Edge | ST | UC-S0x-01 (ngoại lệ) | Cao | Critical | F01 | Khoá tài khoản sau 5 lần sai | Đã sai 4 lần trước đó | 1. Nhập sai lần thứ 5 | mật khẩu sai bất kỳ | Khoá tài khoản 15 phút, báo wording chính xác | Manual | Chưa chạy | — |

> Mẹo: mỗi luật/điều kiện trong `srs.md` áp 1 kỹ thuật phù hợp — input rời rạc → EP; có ngưỡng số/độ dài → BVA; tổ hợp nhiều điều kiện → DT; có luồng trạng thái → ST.
> Khi chạy test: cập nhật cột **Trạng thái** từng TC + bảng **roll-up** ở đầu file (Fail thì ghi mã lỗi/ghi chú vào cột Kết quả mong đợi hoặc cột ghi chú nếu thêm).

## Thuật ngữ
| Thuật ngữ | Giải thích |
|-----------|-----------|
| TC (Test Case) | Ca kiểm thử (TC-S0x-01…) |
| EP (Equivalence Partitioning) | Chia input thành nhóm tương đương, test 1 đại diện mỗi nhóm |
| BVA (Boundary Value Analysis) | Test giá trị biên: min, min+1, max-1, max |
| DT (Decision Table) | Bảng quyết định — liệt kê tổ hợp điều kiện → kết quả |
| ST (State Transition) | Kiểm thử chuyển trạng thái hợp lệ và không hợp lệ |
| Positive / Negative / Edge | Ca thuận / ca lỗi / ca biên |
| Risk · Priority | Mức rủi ro (Cao/TB/Thấp) · Độ ưu tiên (Critical/High/Medium/Low) |
| Roll-up | Bảng tổng hợp kết quả thực thi (Pass/Fail/…) ở đầu file |

> Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`.
