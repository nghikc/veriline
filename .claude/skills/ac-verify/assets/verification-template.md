# Chứng minh — <Tên màn> (Mã màn: S0x)

> model: <model id của ac-verifier>
> diff: <base>..<HEAD sha>
> ngày: YYYY-MM-DD · hồ sơ: <full|lite|mini> · gốc code: <--root>

## Từng task (một dòng mỗi `## Task N` của plan.md)
<!-- "Đã chạy" = số chép từ output Proof, NGAY TRÊN DÒNG (output dán trong khối ``` không được máy đọc): `N passed / M skipped`
     hoặc nguyên hình runner (`Tests: 3 passed, 1 skipped` · `✓ 5 tests` · `5 passed in 0.3s`). N = 0 / "no tests ran" = filter
     không trúng test nào → đỏ. Cột TC ghi ĐỦ từng mã của `Trace test` (viết rời, không `01, 02`) — mã nào vắng là đỏ.
     Vòng ≥ 2 "phủ bởi full suite <sha>": sha = đầu `diff:` (HEAD lúc verify), khác là đỏ. -->

| Task | Proof (lệnh đã chạy y nguyên) | exit | Đã chạy (passed / skipped) | TC phủ / TC lệch | Bằng chứng (file:line) | Kết luận |
|---|---|---|---|---|---|---|
| 1 | `npx jest tests/… -t "TC-S0x-01\|TC-S0x-02"` | 0 | 2 passed / 0 skipped | TC-S0x-01, TC-S0x-02 / — | `tests/….test.ts:12` assert 401 khớp test.md dòng TC-S0x-01 | đạt |
| 2 | `npx jest tests/…` | 1 | 3 passed / 0 skipped · 1 failed | TC-S0x-05 / TC-S0x-06 | `tests/….test.ts:40` chỉ assert không ném lỗi, test.md đòi thông báo inline | **fail** |

## Vế thiếu
<!-- Mỗi TC có vế trong "Kết quả mong đợi" (ve.js tách) mà KHÔNG có assert riêng: một dòng. LOẠI thiếu-test = phải viết thêm test
     (→ verdict FAIL); ngoài-tầng = vế không kiểm được ở tầng test này (nêu tầng + lý do) VÀ lần thử thật sau dấu —:
     `đã thử: <lệnh> → <trích lỗi>` (lý do không có lần thử = lời khai → đỏ), TC vẫn tính phủ.
     Vế `kết-quả` (ve.js) mà test chỉ assert `toHaveBeenCalled*` trên mock → thiếu-test (lời gọi ≠ trạng thái); vế `gọi-ngoài`
     thì spy/mock là bằng chứng đúng. Không có → "- không có". -->
- `TC-S0x-05 · vế thiếu "không cuộn về đầu trang" · LOẠI: thiếu-test · tests/….test.tsx:118` — test chỉ assert ngăn mở
- `TC-S0x-07 · vế thiếu "đơn chuyển trạng thái Đã huỷ" · LOẠI: thiếu-test · tests/….test.ts:66` — chỉ `expect(repo.save).toHaveBeenCalled()` trên mock, không assert trạng thái
- `TC-S0x-09 · vế thiếu "bản in chỉ có danh sách rút gọn" · LOẠI: ngoài-tầng · jsdom không dựng bản in; TC Manual` — đã thử: npx playwright test --grep TC-S0x-09 → Error: browserType.launch: Executable doesn't exist

## Cổng tầng TC
`node .claude/skills/ba-conformance/scripts/check-tc-layer.js docs --root <root> --plain` → exit <n> · <tóm 1 dòng>

## Lint · typecheck
`<lệnh lint>` → exit <n> · `<lệnh typecheck>` → exit <n> · *(hoặc "không có lệnh" — ghi rõ, không đoán)*

## Lỗi gieo
<!-- Sau khi mọi Proof xanh: ≤5 lỗi mức hành vi (lật điều kiện · lệch biên 1 · đổi giá trị trả/mã trạng thái · bỏ side effect),
     mỗi lỗi nhắm MỘT assert khác nhau. Chạy `node .claude/skills/ac-verify/scripts/mutate.js <loi.json> --root <root>` rồi dán
     nguyên bảng nó in. `sống` = finding (verdict FAIL); toàn `lỗi-chạy` = chưa chứng minh gì. Màn không có code logic (chỉ markup
     tĩnh) → thay bảng bằng một dòng `n/a — <lý do>`. validate-done chặn PASS khi thiếu mục / bảng rỗng / còn `sống`. -->
| # | file:line | đột biến | proof | kết quả |
|---|---|---|---|---|
| M1 | `src/….ts:40` | `tuoi >= 18` → `tuoi > 18` — nhắm TC-S0x-01 | `npx jest tests/….test.ts` (exit 1) | bắt |
| M2 | `src/….ts:77` | `await ghiLog(x)` → `null` — nhắm TC-S0x-05 | `npx jest tests/….test.ts` (exit 1) | bắt |

## TC ngoài code màn / sai tiền đề
<!-- Mỗi TC mà chỗ đỏ KHÔNG nằm ở code: một dòng, nhãn máy-đọc (canon `verify.tc.labels`), bằng chứng file:line.
     lỗi-code = code sai đặc tả (trả builder) · tc-sai-tiền-đề = test.md đòi điều srs/design-spec không nói hoặc nói khác
     (PHẢI trích srs.md:/design-spec.md:/E-/R-/BRule — không trích = nhãn không hợp lệ) · đúng-srs = code đúng, chỉ ghi chú.
     Không có TC nào như vậy → bỏ mục này. -->
- `TC-S0x-06 · LOẠI: lỗi-code · src/….ts:40` — thiếu nhánh thông báo inline mà `E-S0x-03` đòi
- `TC-S0x-16 · LOẠI: tc-sai-tiền-đề · src/….tsx:303` — test.md đòi "nút bấm được khi lỗi" nhưng `design-spec.md:47` nói nút vô hiệu khi còn lỗi nhập liệu

## FAIL (mỗi dòng: task · vì sao · chỗ — nhắc mã TC nếu chỗ đỏ thuộc một TC)
- Task 2 · TC-S0x-06 test không assert điều test.md nói · `tests/….test.ts:40`

**Verdict:** FAIL
