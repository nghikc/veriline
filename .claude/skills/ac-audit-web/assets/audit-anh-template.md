# Audit giao diện — Đăng nhập (Mã màn: S01) · từ một ảnh chụp

> model: claude-opus-5-5
> ngày: 2026-10-22 · màn: S01 · hồ sơ: full · tầng: ảnh
> đầu vào: `docs/Ho-so/audit/anh/s01-login.png` *(một ảnh; ảnh trưng bày có khung máy/logo → chỉ chấm phần giao diện bên trong và nói ra)*
> việc chính: người dùng đã có tài khoản vào đây để đăng nhập bằng email + mật khẩu. Sai thì nói.
> máy: không chạy — ảnh không có DOM, scan-html/Lighthouse không áp được
> đối chiếu: srs.md (bảng phần tử, ma trận E-S01) · design-spec.md §4

**Verdict:** ĐẠT — 0 🔴 · 0 🟠 · 2 🟡 *(trong phạm vi ảnh này; có 🔴 = CHƯA ĐẠT; ≥ 3 tiêu chí "—" hoặc ảnh mờ = CHƯA ĐỦ ẢNH, không chấm)*

## Phiếu 6 tiêu chí
> Mức: **Tốt** = không phát hiện (vẫn nói đã thấy gì, ở đâu) · **Tạm** = chỉ 🟡 · **Cần sửa** = có 🔴/🟠 · **—** = ảnh không có gì để chấm (không có chữ → Câu chữ; không trạng thái nào hiện → Trạng thái; mỗi loại phần tử chỉ một → Nhất quán). Trước khi chấm: chép lại một chữ nhỏ (ô bảng, chú thích) đúng từng ký tự — chép không chắc thì ảnh mờ → CHƯA ĐỦ ẢNH.

| Tiêu chí | Mức | Vì sao (vùng trên ảnh) |
|---|---|---|
| Thứ bậc | Tốt | "Đăng nhập" là nút tô màu duy nhất (giữa khung) |
| Nhóm, khoảng cách | Tốt | nhãn sát ô của nó, hai cụm Email/Mật khẩu cách nhau rõ hơn (giữa khung) |
| Dễ đọc | Tạm | (AU-01) |
| Câu chữ | Tạm | (AU-02) |
| Nhất quán | — | mỗi loại phần tử chỉ có một (một nút, một link) |
| Trạng thái, phản hồi | Tốt | ô Email đang focus có viền đậm khác ô còn lại (giữa khung) |

## Core Web Vitals
| Chỉ số | Giá trị | Ngưỡng tốt | Xếp | Nguồn |
|---|---|---|---|---|
| LCP | không đo được | ≤ 2,5 s | — | ảnh chụp, không có URL |
| INP | không đo được | ≤ 200 ms | — | ảnh chụp, không có URL |
| CLS | không đo được | ≤ 0,1 | — | ảnh chụp, không có URL |

## Phát hiện
> Một phát hiện = một tiêu chí (tiêu chí của cái hại); dòng khác nhắc lại thì ghi "xem AU-nn". **Cố ý nếu** trả lời bằng thứ THẤY trên ảnh: "→ không, vì …" (thấy điều bác bỏ) hoặc "dù cố ý, …" (không bác được nhưng hại vẫn thấy). Không bác được và không thấy hại → không phải phát hiện, đưa sang "Cần thêm ảnh / cần hỏi". 🔴/🟠 chỉ khi cột Vấn đề nói hại cho **việc chính** ở header. Không số px (ảnh dán đã mất tỉ lệ — so tương đối), không "cải thiện/tối ưu/trực quan/hiện đại/chuyên nghiệp/thoáng hơn/đẹp hơn" — nói phần tử nào đổi thành gì. Chữ nhỏ/IN HOA: ảnh hay rơi dấu (Đ→D, ơ→o) — đừng kết luận sai chính tả.

| Mã | Trục | Mức | Vị trí | Tiêu chí | Cố ý nếu | Vấn đề | Cách sửa | Trace |
|---|---|---|---|---|---|---|---|---|
| AU-01 | UX | 🟡 | `s01-login.png` (dưới nút Đăng nhập) | Dễ đọc | là chú thích phụ → dù cố ý, chữ xám nhạt cỡ khoảng một nửa chữ nhãn phải căng mắt mới đọc | dòng "Quên mật khẩu?" khó đọc, người quên mật khẩu dễ không thấy lối ra | đổi link "Quên mật khẩu?" sang màu chữ phụ của 07-design-system, cỡ bằng chữ nhãn | R-S01-05 |
| AU-02 | UX | 🟡 | `s01-login.png` (tiêu đề khung) | Câu chữ | tên sản phẩm tiếng Anh → không, vì nhãn ô và nút cùng màn đều tiếng Việt | tiêu đề "Sign in" lệch ngôn ngữ với nút "Đăng nhập" | tiêu đề đổi thành "Đăng nhập" | design-spec §3 |

## Nên giữ
- Một nút chính duy nhất; nhãn nằm trên ô, không chỉ là chữ mờ bên trong ô.

## Cần thêm ảnh / cần hỏi
- Trạng thái lỗi (sai mật khẩu, E-S01-02) không có trên ảnh — cần ảnh lúc báo lỗi.

## Ngoài phạm vi · không đo được
- Từ một ảnh không chấm được: cuộn trang, cỡ cửa sổ khác, trạng thái khác, vùng bấm, bấm vào thì ra gì, tương phản tính bằng số (WCAG 1.4.3 cần mã màu — audit tầng html-design).
