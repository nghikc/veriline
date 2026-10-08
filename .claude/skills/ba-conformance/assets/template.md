# Đối chiếu code ↔ tài liệu — <Tên dự án>

> **Ảnh chụp tại thời điểm chạy** `ba-conformance` ngày `<YYYY-MM-DD>`. Code đổi thì phải chạy lại — đừng đọc file này như trạng thái hiện tại.
> Nguồn: `scan-code.js` (phần đếm được) + agent `ba-inference-reviewer` chế độ `conformance` (phần đọc code).
>
> **Không phải sổ.** Đây là báo cáo ghi đè mỗi lần chạy — khác `00-cr.md`/`00-backlog.md`/`00-changelog.md` (sổ, không xoá dòng). Chỉ **cột "Xử lý"** được giữ lại giữa các lần chạy.

**Mức:** 🔴 chặn (quy tắc nghiệp vụ/phân quyền/dữ liệu lệch · hành vi nghiệp vụ không ai duyệt · AC của Must không thoả) · 🟡 quan trọng (wording, giá trị mặc định, nhánh lỗi chưa xử lý) · 🟢 nhỏ (không đổi hành vi người dùng)

## Tổng quan

| | Số lượng |
|---|---|
| Màn có `plan.md` | — |
| File `plan.md` khai / thiếu trên đĩa | — / — |
| Bước đã tick | — / — |
| Test case · đã Pass | — · — |
| File code không plan nào khai | — |

| Màn | dev | Chưa làm | Lệch | Không có tài liệu | Kết luận |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

## 1. CHƯA LÀM — đặc tả có, code không có

> Nguồn cơ giới: `plan.md` khai file mà file không tồn tại · bước chưa tick · TC chưa Pass. Cộng phần agent đọc được: file có nhưng nội dung rỗng/TODO/thiếu nhánh.

| Màn | Mã chạm | Đặc tả yêu cầu gì | Bằng chứng thiếu | Mức | Xử lý |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

## 2. LỆCH — cả hai có, hành vi khác nhau

> Mỗi dòng phải có đủ **doc nói gì · code làm gì · bằng chứng ở đâu**. Không neo được bằng chứng thì xuống mục "Không đủ căn cứ", không đưa vào đây.

| Màn | Mã chạm | Tài liệu nói | Code làm | Bằng chứng (file/hàm) | Mức | Khả năng | Xử lý |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | *(code sai / tài liệu lỗi thời — chưa chốt)* | — |

> **Cột "Khả năng" không được để agent tự quyết.** Code mới hơn tài liệu **không** có nghĩa code đúng. BA/PO chốt: tài liệu đúng → sửa code (`ba-task` kiểu Bug); code đúng → **`ba-change-request`** để cập nhật baseline, không sửa lén tài liệu cho khớp code.

## 3. KHÔNG CÓ TÀI LIỆU — code có, đặc tả không mô tả

> Chỉ tính **hành vi nghiệp vụ** (validation, giới hạn, guard phân quyền, nhánh lỗi, tác dụng phụ như gửi mail/ghi log nghiệp vụ). **Không tính** hạ tầng/helper/config/style — file lạc không đồng nghĩa dev lậu.

| Màn/vùng code | Code làm gì | Bằng chứng | Mức chắc chắn | Mức | Xử lý |
|---|---|---|---|---|---|
| — | — | — | *(chắc chắn / có thể)* | — | — |

## 4. Lỗi của chính `plan.md`

> Không phải lệch code — là plan viết thiếu, khiến dev không có đường biết phải làm gì. Sửa bằng cách chạy lại `ba-build` cho màn đó.

| Màn | Vấn đề | Chi tiết |
|---|---|---|
| — | Task không khai `Trace test` | — |
| — | TC không task nào trace tới | — |
| — | Plan trace tới TC không có trong `test.md` | — |
| — | Ô `Files:` viết văn xuôi thay vì đường dẫn | — |

## Không đủ căn cứ

> Chỗ không kết luận được và **vì sao** — thiếu quyền đọc, code sinh tự động, logic nằm ở hệ ngoài, đặc tả mơ hồ không kiểm được.

- —

## Việc đề xuất

| Ưu tiên | Việc | Skill |
|---|---|---|
| — | — | — |

## Thuật ngữ
| Thuật ngữ | Giải thích |
|---|---|
| Lệch (drift) | Code và tài liệu cùng mô tả một thứ nhưng nội dung khác nhau |
| File lạc | File code không `plan.md` nào khai — ứng viên "dev không có tài liệu", chưa phải kết luận |
| Ảnh chụp | Báo cáo phản ánh trạng thái đúng lúc chạy, không tự cập nhật |

> Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`.
