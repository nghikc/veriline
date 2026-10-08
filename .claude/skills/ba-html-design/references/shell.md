# Khung dùng chung cho `html-design.html` (canon — dán nguyên, đừng chế lại)

> **Vì sao có file này.** `ba-html-design` chạy **một màn mỗi lần**, mỗi lần một phiên độc lập. Không có hợp đồng chung thì mỗi màn tự chế khung — và đó là chuyện đã xảy ra thật trong `example/`: màn thì có `app-header`, màn thì không; cùng một avatar mà ba tên class (`avatar` · `avatar xs` · `av xs`); **không màn nào có menu điều hướng**; hàng nút trạng thái chỗ 4 nút chỗ 14 nút trộn cả vai trò lẫn trạng thái nghiệp vụ. Người xem lướt qua 6 màn thấy 6 sản phẩm khác nhau.
>
> Hai khối dưới đây là **canon**. `check-shell.js` soát; lệch là gap của `ba-review <màn>`.

---

## 1. Khung ứng dụng (app shell)

### 1.1 Chọn loại khung
| Màn thuộc vùng | Khung | Ví dụ |
|---|---|---|
| **Đã đăng nhập** (có trong sơ đồ điều hướng sau khi auth) | `app-shell` — header + **menu chính** + tools | Dashboard, Chi tiết, Hồ sơ, Tổ chức |
| **Chưa đăng nhập** | `auth-shell` — chỉ brand giữa trang, **không** header app | Đăng nhập, Đăng ký, Quên mật khẩu |

**Menu chính lấy từ `docs/03-overview.md`** — đúng các màn cấp 1 của vùng đã đăng nhập, **cùng thứ tự, cùng nhãn ở MỌI màn**. Màn đang mở đánh `aria-current="page"`. Màn cấp 2 (chi tiết, sửa) **không** thêm mục menu mới — nó vẫn dùng menu ấy, chỉ thêm breadcrumb/back-link.

### 1.2 Markup canon (app shell)
```html
<header class="app-header">
  <a class="brand" href="#" aria-label="<Tên app> — về trang chính">
    <span class="brand-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span><span class="brand-name"><Tên app></span>
  </a>

  <button class="app-nav__toggle" aria-label="Mở menu" aria-expanded="false"
          aria-controls="appNav" onclick="toggleNav(this)">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
  </button>

  <nav class="app-nav" id="appNav" aria-label="Điều hướng chính">
    <!-- ĐÚNG danh sách này ở mọi màn; chỉ đổi chỗ đặt aria-current -->
    <a class="app-nav__link" href="#" aria-current="page">Bảng công việc</a>
    <a class="app-nav__link" href="#">Tổ chức</a>
    <a class="app-nav__link" href="#">Hồ sơ</a>
  </nav>

  <div class="header-tools">
    <button class="icon-btn" aria-label="Thông báo, 3 chưa đọc">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg><span class="badge-count">3</span>
    </button>
    <button class="avatar-btn" aria-label="Menu tài khoản">
      <span class="avatar avatar--sm" aria-hidden="true">L</span>
    </button>
  </div>
</header>
```

### 1.3 Tên class — danh sách ĐÓNG
`app-header` · `brand` · `brand-icon` · `brand-name` · `app-nav` · `app-nav__link` · `app-nav__toggle` · `header-tools` · `icon-btn` · `badge-count` · `avatar-btn` · `avatar` (+ biến thể `avatar--sm` / `avatar--md` / `avatar--lg`).

**Icon là inline SVG** `stroke="currentColor"` (`aria-hidden="true"`; nhãn nằm ở `aria-label` của nút) — **không emoji** (🔔 ☰ ✓ trong bản canon cũ): mỗi máy vẽ emoji một kiểu, không ăn màu token, trình đọc màn hình đọc ra tên emoji. `check-shell.js` báo emoji trong khung, `check-design.js` báo emoji trong nội dung màn.

**Cấm** (đã gây lệch thật): `av`, `av xs`, `avatar xs`, `avatar lg` (dùng `avatar--sm`/`--lg`), và `badge` cho số thông báo — `badge` **dành riêng** cho chip trạng thái nghiệp vụ trong nội dung, dùng `badge-count` cho huy hiệu đếm trên icon.

### 1.4 CSS canon
```css
.app-header{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:16px;
  padding:0 16px;height:56px;background:var(--surface-card,#fff);
  border-bottom:1px solid var(--border,#e5e7eb)}
.brand{display:inline-flex;align-items:center;gap:8px;font-weight:700;
  color:var(--text-primary,#111827);text-decoration:none;flex:0 0 auto}
.brand-icon{display:grid;place-items:center;width:24px;height:24px;border-radius:6px;
  background:var(--brand-primary,#4f46e5);color:#fff}
.app-nav{display:flex;gap:4px;flex:1 1 auto}
.app-nav__link{padding:8px 12px;border-radius:8px;font-size:14px;text-decoration:none;
  color:var(--text-secondary,#4b5563)}
.app-nav__link:hover{background:var(--surface-hover,#f3f4f6)}
.app-nav__link[aria-current="page"]{color:var(--brand-primary,#4f46e5);
  background:var(--surface-hover,#f3f4f6);font-weight:600}
.app-nav__toggle{display:none;background:none;border:0;color:var(--text-secondary,#4b5563);cursor:pointer;padding:6px}
.header-tools{display:flex;align-items:center;gap:8px;margin-left:auto;flex:0 0 auto}
.icon-btn{position:relative;display:inline-grid;place-items:center;background:none;border:0;color:var(--text-secondary,#4b5563);cursor:pointer;
  padding:6px;border-radius:8px}
.badge-count{position:absolute;top:0;right:0;min-width:16px;height:16px;padding:0 4px;
  border-radius:8px;background:var(--danger,#dc2626);color:#fff;font-size:10px;
  line-height:16px;text-align:center}
.avatar{display:grid;place-items:center;border-radius:50%;
  background:var(--brand-primary,#4f46e5);color:#fff;font-weight:600}
.avatar--sm{width:28px;height:28px;font-size:12px}
.avatar--md{width:40px;height:40px;font-size:15px}
.avatar--lg{width:72px;height:72px;font-size:26px}
.avatar-btn{background:none;border:0;cursor:pointer;padding:2px;border-radius:50%}

/* Mobile: menu xổ xuống, KHÔNG đẩy vỡ header */
@media (max-width:767px){
  .app-nav__toggle{display:block;order:-1}
  .app-nav{position:absolute;left:0;right:0;top:56px;flex-direction:column;gap:0;
    padding:8px;background:var(--surface-card,#fff);
    border-bottom:1px solid var(--border,#e5e7eb);
    transform:translateY(-8px);opacity:0;pointer-events:none;
    transition:transform .18s ease-out,opacity .18s ease-out}
  .app-header[data-nav="open"] .app-nav{transform:none;opacity:1;pointer-events:auto}
}
@media (prefers-reduced-motion:reduce){.app-nav{transition:none}}
```

```html
<script>
function toggleNav(btn){
  const h = btn.closest('.app-header');
  const open = h.getAttribute('data-nav') !== 'open';
  h.setAttribute('data-nav', open ? 'open' : 'closed');
  btn.setAttribute('aria-expanded', String(open));
}
</script>
```

### 1.5 Khung `auth-shell`
```html
<main class="auth-shell">
  <a class="brand brand--stacked" href="#">
    <span class="brand-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span><span class="brand-name"><Tên app></span>
  </a>
  <!-- card đăng nhập/đăng ký -->
</main>
```
```css
.auth-shell{min-height:100dvh;display:grid;place-items:center;gap:24px;padding:24px;
  background:var(--surface-app,#f9fafb)}
.brand--stacked{flex-direction:column;gap:8px;font-size:20px}
```

---

## 2. Thanh trạng thái demo (`statebar`)

Khối cho **người đọc tài liệu** bấm xem từng trạng thái. Không có trong production — đánh dấu rõ.

### 2.1 Bốn luật
1. **Chia NHÓM có nhãn**, không đổ một hàng nút. Đúng bốn nhóm, theo thứ tự: `ui` → `error` → `role` → `biz`. Nhóm nào màn không có thì bỏ hẳn, **không** đổi tên nhóm.
2. **Nhóm `ui` chỉ dùng nhãn trong tập cố định:** `Mặc định` · `Đang tải` · `Rỗng` · `Lỗi`. **Bắt buộc có `Mặc định`**; ba nhãn kia chỉ đưa vào khi màn **thật sự có** trạng thái đó (form đăng nhập không có trạng thái "Rỗng" — thêm nút rỗng cho đủ bộ là bịa một trạng thái không tồn tại). Cấm biến thể tên: `Idle`/`Default` → `Mặc định`, `Empty`/`Lọc rỗng` → `Rỗng`. Ca cụ thể (`Sai mật khẩu`, `Khoá tạm`, `Chưa có ảnh đại diện`) **không thuộc nhóm `ui`** — chúng là ca lỗi/ca nghiệp vụ, giữ nguyên nhãn mô tả và để ở nhóm `error`/`biz`.
3. **Ca lỗi phải có `data-trace`** trỏ mã `E-S..` trong ma trận lỗi của `srs.md`. Không có mã tương ứng → không được bịa nút.
4. **Thu gọn được.** Màn nhiều trạng thái (đã gặp: 14 nút) mà đổ hết ra thì đẩy nội dung thật xuống dưới màn hình đầu — người xem tưởng đó là giao diện.
5. **Vị trí quyết định `position` — đừng để hai thanh sticky đánh nhau.** Đặt thanh **SAU** `app-header` → `position:sticky;top:<chiều cao header>`. Đặt **TRƯỚC** header (hoặc màn `auth-shell` không có header) → **`position:static`**, cho nó cuộn đi. Hai phần tử cùng `sticky;top:0` trong một khối cuộn sẽ **chồng lên nhau** khi cuộn xuống — lỗi này chỉ lộ ra lúc kéo trang, không thấy khi mở lần đầu.
6. **Không tự đặt `position:relative` cho `.app-header`.** Header đã `position:sticky`, mà mọi phần tử `position` khác `static` đều là containing block cho con `absolute` — ghi đè thành `relative` là **giết luôn sticky**, cũng chỉ lộ ra khi cuộn.

### 2.2 Markup canon
```html
<!-- ▼ UI-STATE-BAR — chỉ có trong html-design, KHÔNG có trong production -->
<div class="statebar" id="statebar" data-open="true">
  <button class="statebar__toggle" aria-expanded="true" aria-controls="statebarBody"
          onclick="statebarToggle(this)">◆ Trạng thái giao diện <span aria-hidden="true">▾</span></button>
  <div class="statebar__body" id="statebarBody">

    <div class="statebar__group" data-group="ui">
      <span class="statebar__label">Trạng thái UI</span>
      <button class="statebar__btn is-active" data-state="default" onclick="setState('default',this)">Mặc định</button>
      <button class="statebar__btn" data-state="loading" onclick="setState('loading',this)">Đang tải</button>
      <button class="statebar__btn" data-state="empty"   onclick="setState('empty',this)">Rỗng</button>
      <button class="statebar__btn" data-state="error"   onclick="setState('error',this)">Lỗi</button>
    </div>

    <div class="statebar__group" data-group="error">
      <span class="statebar__label">Ca lỗi</span>
      <button class="statebar__btn" data-state="e-s02-01" data-trace="E-S02-01"
              onclick="setState('e-s02-01',this)">Mất kết nối</button>
    </div>

    <!-- data-group="role" khi màn đổi theo vai trò · data-group="biz" cho trạng thái nghiệp vụ -->
  </div>
</div>
<!-- ▲ UI-STATE-BAR -->
```

### 2.3 CSS + JS canon
```css
.statebar{position:sticky;top:56px;z-index:40;background:var(--surface-app,#f9fafb);
  border-bottom:1px dashed var(--border,#e5e7eb);font-size:12px}
.statebar__toggle{display:block;width:100%;text-align:left;padding:6px 16px;background:none;
  border:0;color:var(--text-placeholder,#9ca3af);cursor:pointer;font-size:11px;
  letter-spacing:.02em}
.statebar__body{display:none;padding:0 16px 8px;flex-direction:column;gap:6px}
.statebar[data-open="true"] .statebar__body{display:flex}
.statebar__group{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.statebar__label{flex:0 0 96px;color:var(--text-placeholder,#9ca3af);font-size:11px}
.statebar__btn{padding:4px 10px;border:1px solid var(--border,#d1d5db);border-radius:999px;
  background:var(--surface-card,#fff);color:var(--text-secondary,#4b5563);
  font-size:12px;cursor:pointer}
.statebar__btn.is-active{background:var(--brand-primary,#4f46e5);border-color:var(--brand-primary,#4f46e5);color:#fff}
@media (max-width:767px){.statebar__label{flex-basis:100%}}
```
```html
<script>
function statebarToggle(btn){
  const box = btn.closest('.statebar');
  const open = box.dataset.open !== 'true';
  box.dataset.open = String(open);
  btn.setAttribute('aria-expanded', String(open));
}
function setState(state, btn){
  if (btn){                                   // chỉ bỏ active TRONG nhóm của nút vừa bấm —
    const g = btn.closest('.statebar__group'); // nhóm vai trò và nhóm trạng thái UI độc lập nhau
    g.querySelectorAll('.statebar__btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
  }
  document.body.dataset.state = state;        // CSS bám [data-state] để hiện/ẩn khối
}
</script>
```

Ẩn/hiện theo trạng thái bằng thuộc tính trên `<body>` (một cơ chế duy nhất, không trộn `hidden` với `.visible`):
```css
[data-state] .state-block{display:none}
body[data-state="default"] .state-default,
body[data-state="loading"] .state-loading,
body[data-state="empty"]   .state-empty,
body[data-state="error"]   .state-error{display:block}
```

---

## 3. Tự soát trước khi báo xong
Chạy `node .claude/skills/ba-html-design/scripts/check-shell.js docs` — nó so **mọi màn với nhau**, việc mà một phiên dựng-một-màn không tự thấy được:
- màn vùng đã đăng nhập thiếu `app-header` hoặc `app-nav`;
- danh sách mục menu **khác nhau giữa các màn**;
- class ngoài danh sách đóng (§1.3);
- thanh `statebar` thiếu nhóm/nhãn chuẩn, hoặc ca lỗi thiếu `data-trace`.
