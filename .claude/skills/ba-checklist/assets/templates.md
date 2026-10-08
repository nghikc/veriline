# Template — checklist.md (high-level test checklist cho 1 màn)

> Thay `<...>`. Bỏ nhóm không áp dụng (ghi 1 dòng lý do). Mã `CL-S<NN>-..` đánh **tuần tự toàn màn**. Mỗi mục **một dòng** — không bước/test data (đó là `test.md`).

```markdown
# Checklist kiểm thử (high-level) — <Tên màn hiển thị> (<Mã, vd S01>)

> Nguồn: `srs.md` · `usecase.md` · `userstory.md` · `design-spec.md` của màn.
> Bổ trợ `test.md` (ca chi tiết). Mỗi mục có mã `CL-S..`; `ba-test` bám các mã này để sinh `TC` (mỗi `CL` ≥1 `TC`).

| Tổng mục | Pass | Fail | N/A | Chưa kiểm | Ưu tiên Critical/High | Cập nhật cuối |
|---:|---:|---:|---:|---:|:--|:--|
| <n> | 0 | 0 | 0 | <n> | <c>/<h> | <YYYY-MM-DD> |

## G1. Chức năng chính (happy path)
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S<NN>-01 | <điểm kiểm ngắn> | <điều kiện đạt 1 dòng> | High | UC-S<NN>-01 | — |  |

## G2. Nhập liệu & Validation
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S<NN>-02 | <field> — bắt buộc/định dạng/min-max | <luật được thực thi, KHÔNG ghi test data> | Medium | R-S<NN>-03 | — |  |

## G3. Trạng thái giao diện
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S<NN>-03 | State <loading/empty/error/success/disabled> | <hiển thị đúng theo design-spec> | Medium | design-spec §<x> | — |  |

## G4. Lỗi & Ngoại lệ
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S<NN>-04 | <tình huống lỗi> | <thông báo/hành vi NGUYÊN VĂN cột "Người dùng thấy gì"> | High | E-S<NN>-01 | — |  |

## G5. Phân quyền & Vai trò  *(bỏ nếu màn 1 vai trò — ghi lý do)*
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S<NN>-05 | Vai trò <X> với hành vi <Y> | <được phép / bị chặn đúng ma trận> | Critical | BRule-S<NN>-.. | — |  |

## G6. Phi chức năng (hiệu năng/bảo mật/a11y)  *(bỏ nếu không có — ghi lý do)*
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S<NN>-06 | <hiệu năng/bảo mật/a11y> | <ngưỡng số / tiêu chí a11y cụ thể> | High | R-S<NN>-N01 / NFR-.. | — |  |

## G7. Tương thích & Liên màn  *(bỏ nếu không có — ghi lý do)*
| Mã | Hạng mục kiểm | Điều kiện đạt (quan sát được) | Ưu tiên | Truy vết | Kết quả | Ghi chú |
|---|---|---|:--:|---|:--:|---|
| CL-S<NN>-07 | Điều hướng CTA → <màn đích> | <đi đúng màn theo overview/sitemap> | Medium | UC-S<NN>-.. | — |  |

## Cần làm rõ  *(để trống nếu không có)*
- <điểm nguồn thiếu/mâu thuẫn, chưa suy đoán — chờ người dùng chốt hoặc ba-screen-spec bổ sung>

## Thuật ngữ
- **Checklist high-level:** danh mục điểm cần kiểm ở mức cao (một dòng/điểm), chưa phải test case chi tiết.
- **N/A:** hạng mục không áp dụng cho màn này.
- *(bổ sung thuật ngữ nghiệp vụ xuất hiện trong file; đồng bộ `docs/Ho-so/00-glossary.md`)*
```

## Ghi chú áp dụng
- **Điều kiện đạt** phải **quan sát được** (thấy gì / hành vi gì), không dùng tính từ mơ hồ ("chạy tốt", "hợp lý").
- Thông báo lỗi ở G4 phải **khớp nguyên văn** `srs` Ma trận lỗi và `html-design` — lệch chữ là gap (ba-review bắt).
- Cột **Truy vết** chỉ dùng mã **có thật** trong nguồn; nhiều mã cách nhau dấu phẩy.
- **Ưu tiên** theo rủi ro: tiền/bảo mật/phân quyền/mất dữ liệu → Critical/High.
