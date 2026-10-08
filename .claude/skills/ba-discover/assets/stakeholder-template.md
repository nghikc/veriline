# Phân tích các bên liên quan — <Tên App>

## 1. Danh bạ stakeholder
> Cột **Tham gia**: mức hiện tại → mong muốn (Không biết / Phản đối / Trung lập / Ủng hộ / Dẫn dắt).

| ID | Bên liên quan | Vai trò | Lớp Onion | Kỳ vọng | Ảnh hưởng | Tham gia (hiện tại→mong muốn) | Trace StR |
|----|---------------|---------|-----------|---------|-----------|-------------------------------|-----------|
| SH-01 | <...> | <...> | Lõi/Hệ thống/Tổ chức/Ngoài | <...> | Cao/TB/Thấp | Trung lập → Ủng hộ | StR-01 |

## 2. Onion Diagram (nhận diện theo độ gần giải pháp)
```
( Ngoài: cơ quan, đối tác, khách hàng cuối
  ( Tổ chức: nhà tài trợ, quản lý
    ( Hệ thống: vận hành, hỗ trợ
      ( Lõi: người dùng trực tiếp ) ) ) )
```
- **Lõi:** <...> · **Hệ thống:** <...> · **Tổ chức:** <...> · **Ngoài:** <...>

## 3. Ma trận Quyền lực / Quan tâm
Điền ID stakeholder vào ô phù hợp.

| | Quan tâm THẤP | Quan tâm CAO |
|---|---|---|
| **Quyền lực CAO** | Giữ hài lòng: <...> | Quản lý sát: <...> |
| **Quyền lực THẤP** | Theo dõi: <...> | Thông tin đầy đủ: <...> |

## 4. Ma trận RACI
R = Thực hiện · A = Chịu trách nhiệm cuối · C = Tham vấn · I = Thông báo
> Mỗi hàng có **đúng 1 A** và ≥1 R.

| Hạng mục / Quyết định | SH-01 | SH-02 | SH-03 |
|-----------------------|-------|-------|-------|
| <...> | A | C | I |

## 5. Kế hoạch giao tiếp
| Bên liên quan | Nội dung trao đổi | Kênh | Tần suất |
|---------------|-------------------|------|----------|
| <...> | <...> | email / họp / báo cáo | <...> |

## Thuật ngữ
| Thuật ngữ | Giải thích |
|-----------|-----------|
| Stakeholder | Bên liên quan — cá nhân/nhóm chịu ảnh hưởng hoặc tác động tới dự án |
| Onion Diagram | Sơ đồ phân lớp các bên liên quan theo độ gần giải pháp (lõi → ngoài) |
| Power/Interest Grid | Ma trận 2×2 xếp bên liên quan theo Quyền lực × Quan tâm |
| RACI | Ma trận trách nhiệm: Responsible / Accountable / Consulted / Informed |
| StR (Stakeholder Requirement) | Yêu cầu của một nhóm liên quan |

> Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`.
