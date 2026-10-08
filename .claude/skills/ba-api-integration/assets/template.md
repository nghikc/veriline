# Template — `docs/12-api-integration.md`

```markdown
# Tích hợp API đối tác ngoài

> Đánh giá & đặc tả tiêu thụ API của các hệ ngoài. Bổ trợ `11-integration.md` (kiến trúc tích hợp) và `06-api-spec.md` (API tự phát).

## 1. Kiểm kê hệ ngoài
| Mã | Đối tác / Dịch vụ | Vai trò | Nhà cung cấp | Mô hình giá | Tài liệu | Sandbox |
|----|-------------------|---------|--------------|-------------|----------|---------|
| EXT-01 | VNPAY | Cổng thanh toán | VNPAY | %/giao dịch | portal.vnpay.vn | Có |
| EXT-02 | Google OAuth | Đăng nhập SSO | Google | Miễn phí | developers.google.com | Có |

## 2. Build-vs-buy (ADR mỗi hệ)
### ADR-01 — EXT-01 (Thanh toán): Mua (tích hợp VNPAY) thay vì tự xây
- **Bối cảnh & ràng buộc:** trace NFR-03 (PCI-DSS), NFR-05 (time-to-market 2 tháng).
- **Phương án:** (A) tự xây cổng thẻ · (B) tích hợp VNPAY.
- **So sánh:** chi phí (A cao + gánh PCI-DSS · B phí/giao dịch) · thời gian (A ~6 tháng · B ~2 tuần) · rủi ro tuân thủ (A tự gánh · B đẩy sang đối tác) · lock-in (B trung bình).
- **Quyết định:** **B — tích hợp VNPAY.** Lý do: tránh gánh PCI-DSS, kịp deadline.
- **Trạng thái:** Draft → *(Accepted + ngày sau cổng chốt)*.

## 3. Digest tài liệu API đối tác — EXT-01
- **Base URL / môi trường:** sandbox `...` · prod `...`
- **Auth:** HMAC-SHA512 chữ ký `vnp_SecureHash` (cách tạo: …). Nguồn: doc mục 3.1.
- **Endpoint dùng:** `GET /paymentv2/vpcpay.html` (tạo URL thanh toán) · `POST /merchant_webapi/api/transaction` (truy vấn).
- **Webhook/IPN:** `GET <return_url>` + verify chữ ký. Sự kiện: thành công/thất bại/hủy.
- **Rate limit:** … · **Idempotency:** `vnp_TxnRef` duy nhất mỗi đơn.
- **Mã lỗi hay gặp:** `24` = khách hủy · `51` = không đủ số dư · … (map sang lỗi hệ mình ở §5).
- **Versioning:** API v2. **Open Question:** OQ-01 — doc không nói TTL của URL thanh toán.

## 4. Mapping field 3 tầng — EXT-01
| API đối tác (field · kiểu · đơn vị) | Mô hình dữ liệu (05) | Màn hình (S..) | Biến đổi | Bắt buộc | Chiều |
|-------------------------------------|----------------------|----------------|----------|----------|-------|
| `vnp_Amount` · int · **xu (×100)** | Order.total · decimal · VND | S03 · "Tổng tiền" | ×100 khi gửi, ÷100 khi nhận | ✅ | Cả hai |
| `vnp_TxnRef` · string | Order.code | — | 1-1 | ✅ | Gửi |
| `vnp_ResponseCode` · string | Payment.status (enum) | S03 · badge | map bảng §5 | ✅ | Nhận |
| `vnp_PayDate` · yyyyMMddHHmmss | Payment.paidAt · datetime | S03 · "Thời điểm" | parse → ISO-8601 | ❌ | Nhận |

*Trường không map được:* `vnp_BankCode` — hệ mình chưa lưu ngân hàng → *bỏ qua hay bổ sung cột? → OQ-02.*

## 5. Readiness gate — trước production
| Hạng mục | EXT-01 | Ghi chú |
|----------|--------|---------|
| Test sandbox pass | ⚠️ | còn ca hủy |
| Credential prod | ❌ | chờ hợp đồng |
| Secrets ở vault (không hardcode) | ✅ | |
| Retry + timeout lời gọi ra | ⚠️ | chưa đặt timeout |
| Circuit breaker / fallback khi sập | ❌ | cần hàng đợi retry |
| Verify chữ ký webhook | ✅ | |
| Tôn trọng rate-limit | ✅ | |
| Correlation id trong log | ✅ | |
| Map mã lỗi đối tác → lỗi hệ mình | ✅ | bảng §5 |
| PII/tuân thủ (PCI-DSS) | ✅ | không lưu số thẻ |
| Dự phòng khi đối tác đổi API | ⚠️ | theo dõi changelog |

## 6. Rủi ro & Giả định
- **Rủi ro:** VNPAY bảo trì → đơn treo → *hàng đợi retry + trạng thái "chờ đối soát".*
- **GĐ-01** ⚠️ chưa xác nhận — phí/giao dịch giả định 1.1% (chờ hợp đồng).

## Thuật ngữ
| Thuật ngữ | Giải thích |
|-----------|-----------|
| Build-vs-buy | Quyết định tự xây hay mua/dùng dịch vụ có sẵn |
| Idempotency | Gọi lại nhiều lần cho cùng kết quả, không nhân đôi giao dịch |
| Webhook / IPN | Đối tác chủ động gọi ngược về hệ mình để báo kết quả |

> Từ điển đầy đủ toàn dự án: `docs/Ho-so/00-glossary.md`.
```
