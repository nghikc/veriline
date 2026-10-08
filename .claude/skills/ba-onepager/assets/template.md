# [Tên dự án] — Đặc tả tổng thể

> Phiên bản [x.y] — [DD/MM/YYYY] · Tài liệu sinh từ bộ hồ sơ BA của dự án.
> [Một câu: tài liệu này dành cho ai đọc và trả lời câu hỏi gì.]

**Mục lục:** [1. Tóm tắt](#sec1) · [2. Bối cảnh](#sec2) · [3. Mục tiêu](#sec3) · … · [Phụ lục](#appA)

---

<!--
  LUẬT VIẾT — đọc trước khi điền, đây là chỗ bản nháp hay hỏng nhất:

  1. VĂN LIỀN MẠCH, không phải bảng nối bảng. Nguồn là tài liệu dạng bảng; ở đây phải chuyển
     thành câu. Bảng chỉ giữ khi bản chất dữ liệu là bảng (so sánh phương án, lộ trình theo
     giai đoạn, danh mục chức năng) — không bê nguyên bảng đặc tả sang.

  2. KHÔNG MÃ ID TRONG THÂN BÀI. Mọi `FR-01`, `F03`, `S02`, `BRule-S01-01` sống ở Phụ lục B.
     Trong thân bài viết bằng lời: "khoá tài khoản sau năm lần sai trong mười lăm phút".
     `scan-sources.js --check` bắt lỗi này — nó là thứ mắt người lướt qua không thấy.

  3. THIẾU NGUỒN THÌ BỎ MỤC, không viết chay. Mục có tiêu đề mà không có gì bên dưới là lời
     hứa suông; script đếm mục dưới 25 chữ và báo lỗi.

  4. KHÔNG BỊA: số liệu/KPI không có trong `00-vision`; quyết định kiến trúc không có ADR;
     ngày tháng không có trong `08-roadmap`; quy tắc nghiệp vụ không có `BRule` sau lưng.

  Ưu tiên khi hai luật đánh nhau: Đúng nguồn > Truy vết đủ > Mạch văn > Đủ 15 mục.
-->

## 1. Tóm tắt điều hành {#sec1}

[3–5 đoạn. Vấn đề đang có → cách giải → giá trị kỳ vọng → phạm vi lần này. Người chỉ đọc mục
này phải nắm được dự án làm gì và vì sao đáng làm. Nguồn: `00-vision.md`.]

## 2. Bối cảnh và hiện trạng {#sec2}

[Quy trình đang chạy thế nào và hỏng ở đâu. Nguồn: `00-process.md` (AS-IS) + phần bối cảnh của
`00-vision.md`. Có sơ đồ AS-IS thì mang sang — đây là chỗ sơ đồ swimlane có giá trị nhất.]

```mermaid
[dán nguyên khối mermaid từ nguồn — không vẽ lại]
```

## 3. Mục tiêu và phạm vi {#sec3}

[Mục tiêu kinh doanh, viết thành câu chứ không phải danh sách mã. Kèm **ngoài phạm vi** —
mục này quan trọng ngang mục tiêu và hay bị bỏ. Nguồn: `00-vision.md`, `00-urd.md`.]

## 4. Người dùng và nhu cầu {#sec4}

[Ai dùng, cần gì, đau ở đâu. Nguồn: `00-personas.md`, `00-urd.md`. Viết theo vai trò, không
chép nguyên bảng persona.]

## 5. Kiến trúc tổng thể {#sec5}

[Stack, phân tầng, các thành phần chính và lý do chọn. Mỗi quyết định lớn nêu **đánh đổi**, không
chỉ kết luận. Nguồn: `10-architecture.md` + ADR của nó.]

```mermaid
[sơ đồ kiến trúc từ nguồn]
```

## 6. Mô hình dữ liệu {#sec6}

[Các thực thể chính và quan hệ, viết thành đoạn; ERD mang từ `05-data-model.md` sang.]

## 7. Danh mục chức năng {#sec7}

[Đây là chỗ bảng ĐƯỢC PHÉP tồn tại — danh mục vốn là bảng. Bỏ cột mã, giữ cột nghiệp vụ:]

| Nhóm | Chức năng | Mức ưu tiên | Ghi chú |
|---|---|---|---|
| [Nhóm] | [Chức năng, viết bằng lời người dùng] | Must / Should / Could | [ràng buộc đáng nói] |

## 8. Đặc tả chức năng theo màn {#sec8}

[Mỗi màn 1–3 đoạn: màn này để làm gì, ai vào được, quy tắc nghiệp vụ đáng chú ý (viết bằng lời),
lỗi người dùng có thể gặp. Nguồn: `03-overview.md` + `srs.md` từng màn. Dự án nhiều màn thì gom
theo nhóm chức năng, không liệt kê phẳng.]

## 9. Giao diện và hệ thống thiết kế {#sec9}

[Nguyên tắc thiết kế, token màu/chữ, mẫu bố cục. Nguồn: `07-design-system.md`.]

## 10. Tích hợp và API {#sec10}

[Hệ ngoài nào, trao đổi gì, ai sở hữu dữ liệu nào, hỏng thì xử ra sao. Nguồn: `06-api-spec.md`,
`11-integration.md`, `12-api-integration.md`.]

## 11. Yêu cầu phi chức năng và tuân thủ {#sec11}

[Hiệu năng, bảo mật, khả dụng, pháp lý — kèm **ngưỡng số**, không phải tính từ. Nguồn: phần NFR
của `01-requirements.md`. Không có ngưỡng trong nguồn thì ghi "chưa đặt ngưỡng", đừng tự chế.]

## 12. Lộ trình triển khai {#sec12}

| Giai đoạn | Nội dung | Điều kiện hoàn thành | Phụ thuộc |
|---|---|---|---|
| [GĐ1] | [làm gì] | [đo bằng gì] | [chờ gì] |

[Nguồn: `08-roadmap.md`. Ngày tháng chỉ ghi khi nguồn có — không suy ra.]

## 13. Chỉ số đo lường {#sec13}

[Mỗi chỉ số: đo cái gì · ngưỡng · đo bằng cách nào · bao lâu rà một lần. Nguồn: KPI của
`00-vision.md`. Chỉ số không có ngưỡng số thì không phải chỉ số — bỏ hoặc ghi rõ là định tính.]

## 14. Rủi ro chính {#sec14}

| Rủi ro | Khả năng | Tác động | Cách giảm |
|---|---|---|---|

## 15. Quyết định cần chốt {#sec15}

[Thứ **chưa ai quyết**, kèm người quyết được và hạn. Nguồn: sổ `PD` trong `00-decisions.md`
(dòng `Treo`) + gap 🔴/🟡 còn mở trong `00-gaps.md`. Đây là mục người ký duyệt đọc kỹ nhất —
đừng làm nó ngắn cho gọn.]

| Cần chốt | Vì sao chưa chốt được | Ai quyết | Hạn |
|---|---|---|---|

---

## Phụ lục A · Nguồn {#appA}

[Bảng: tài liệu nào trong `docs/` đã dùng, phiên bản/ngày cập nhật. Để người đọc biết bản này
chụp lại hồ sơ ở thời điểm nào.]

| Mục | Tài liệu nguồn |
|---|---|
| §1, §3, §13, §14 | `docs/Ho-so/00-vision.md` |

## Phụ lục B · Ánh xạ truy vết {#appB}

[**Bắt buộc.** Đây là thứ giữ đường quay về `docs/` sau khi đã ẩn mã khỏi thân bài. Không có
phụ lục này thì sáu tháng nữa đổi một quy tắc sẽ không biết nó chạm tới đâu.]

| Đoạn | Mã nguồn |
|---|---|
| §7.1 Đăng nhập | `FR-01` · `BRule-S01-01` · `BRule-S01-03` |
| §12 Giai đoạn 1 | `F01` · `F02` · `S01` |
