# Checklist bảo mật cho review code — theo stack đã chốt trong ADR

Nguồn: viết lại từ `security-best-practices` (openai/skills, MIT — 10 file spec MUST/SHOULD cho Express · Next.js · React · Vue · jQuery · Django · Flask · FastAPI · Go), giữ **cơ chế** (mỗi mục = luật + mẫu xấu + cách soi + cách sửa), bỏ prose. Mã nguồn gốc ghi ở *nguồn* để tra lại khi cần chi tiết.

**Ai dùng file này:**
- `ba-threat-model` bước 6: **chỉ chép nhóm áp cho stack** mà `scan-threat.js` phát hiện từ `10-architecture.md` §2 (in ở dòng "nhóm checklist") vào §6 của `00-threat-model.md`, nối mỗi mục với `TM` liên quan. Không có stack (chưa có `10-architecture.md`) → chỉ nhóm `chung`.
- `ac-judge` lượt B (Bảo mật): đối chiếu diff với §6 của dự án (đã cắt theo stack); không có `00-threat-model.md` thì đọc thẳng nhóm `chung` ở đây. Mục có `TM` liên quan → finding thừa kế **mức của TM**. Ngưỡng của judge giữ nguyên: chỉ báo khi khai thác được thật; **thiếu hardening không phải lỗ hổng** — checklist này để *soi có chủ đích*, không để chấm điểm đủ/thiếu.

**Ba luật xuyên suốt (từ mọi spec gốc):** (1) Không bao giờ in/log/commit bí mật — thấy trong code thì ghi *có bí mật ở file:line*, không chép giá trị. (2) Không "sửa" bảo mật bằng cách tắt bảo vệ (nới cookie, tắt CSRF, CORS `*`, tin `X-Forwarded-*` từ internet, bật debug). (3) Không báo **thiếu TLS** hay đòi `Secure` cookie/HSTS ở môi trường dev — TLS thường ở proxy ngoài phạm vi code; chỉ ghi khi `NFR` nói HTTPS bắt buộc **và** production config rõ ràng không có.

Dạng mỗi mục: `- [ ] SEC-<NHÓM>-<nn> **Tên** — luật · *xấu:* mẫu · *soi:* cách tìm · *sửa:* hướng · *nguồn:* mã gốc`.

---

## Nhóm `chung` — mọi ứng dụng web (luôn áp)

### Xác thực & phiên
- [ ] SEC-AUTH-01 **Mật khẩu băm thích nghi** — bcrypt/argon2id/scrypt với cost đúng `NFR`; so sánh hằng thời gian · *xấu:* MD5/SHA-1/SHA-256 trần, tự viết so sánh `===` · *soi:* grep `createHash(`, `md5`, `sha1`, `hashlib.sha`, chỗ đọc `mat_khau` · *sửa:* thư viện chuẩn của stack, cost là hằng đọc từ cấu hình · *nguồn:* GO-AUTH-001, FASTAPI-AUTH-003, DJANGO-AUTH-001
- [ ] SEC-AUTH-02 **Xác thực server-side cho MỌI hành động được bảo vệ** — guard chạy trước handler, không phụ thuộc client giấu nút · *xấu:* route mới quên decorator/guard; middleware auth có ngoại lệ đường dẫn rộng · *soi:* liệt kê route → guard nào; diff thêm route mà không thêm guard · *sửa:* guard mặc định toàn cục, allowlist route công khai · *nguồn:* NEXT-AUTH-001, NEXT-AUTH-002, FASTAPI-AUTH-001, REACT-AUTHZ-001
- [ ] SEC-AUTH-03 **Rate-limit + chống dò ở endpoint đăng nhập/đăng ký/quên mật khẩu/OTP** — theo tài khoản **và** theo IP/thiết bị · *xấu:* chỉ khoá tài khoản (kẻ tấn công đổi email dò tiếp) · *soi:* grep `login|dang-nhap|auth` trong router, tìm throttle/limiter bao quanh · *sửa:* limiter ở gateway hoặc middleware, ghi `BRule` khoá vào code có test · *nguồn:* EXPRESS-AUTH-001, NEXT-DOS-001
- [ ] SEC-AUTH-04 **Phiên có trần + xoay + thu hồi** — id phiên/refresh token đổi sau đăng nhập (chống fixation), hết hạn tuyệt đối, thu hồi khi đổi mật khẩu/vô hiệu hoá · *xấu:* refresh token sống mãi; đổi mật khẩu không thu hồi phiên khác · *soi:* đọc luồng `refresh`, `logout`, `change-password` đối chiếu `BRule` phiên · *nguồn:* FLASK-SESS-002, NEXT-SESS-002
- [ ] SEC-AUTH-05 **JWT kiểm chặt** — thuật toán cố định (không nhận `alg: none`/đổi HS↔RS), kiểm `exp`/`iss`/`aud`, khoá riêng ngoài repo; JWT không chứa bí mật · *soi:* grep `verify(`, `decode(` — có `algorithms:` cố định không · *nguồn:* FASTAPI-AUTH-004
- [ ] SEC-AUTH-06 **Không lộ tồn tại tài khoản** — thông báo sai email/sai mật khẩu giống nhau, thời gian phản hồi không phân biệt; quên mật khẩu luôn trả "nếu tồn tại sẽ gửi" · *soi:* nhánh lỗi ở handler đăng nhập/đăng ký · *nguồn:* rút từ `BRule` chống user enumeration của mẫu S01

### Phân quyền
- [ ] SEC-AUTHZ-01 **Phân quyền theo từng đối tượng, không chỉ theo route** — mọi truy vấn lấy `tenant_id`/`org_id`/`user_id` từ **token**, không từ request; so khớp chủ sở hữu trước khi đọc/sửi · *xấu:* `findById(req.params.id)` không lọc tenant; `/users/:id` nhận id người khác · *soi:* grep repository/ORM call không có điều kiện tenant; diff sửa `where` · *sửa:* guard tenant ở tầng repository (một chỗ), test 404/403 cho id tổ chức khác · *nguồn:* FASTAPI-AUTHZ-001, DJANGO-AUTHZ-001, REACT-AUTHZ-001
- [ ] SEC-AUTHZ-02 **Chống mass assignment / trường cấm** — body → DTO/schema allowlist; trường quyền (`vai_tro`, `role`, `is_admin`, `trang_thai`, giá, số dư) **không** nhận từ client ở endpoint tự phục vụ · *xấu:* `Object.assign(entity, req.body)`, `Model(**payload)`, `.update(request.data)` · *soi:* grep spread/assign body vào entity · *nguồn:* FASTAPI-VALID-001, EXPRESS-INPUT-001
- [ ] SEC-AUTHZ-03 **Không dựa vào giao diện để phân quyền** — ẩn nút không phải kiểm quyền; route guard phía client chỉ là UX · *soi:* mỗi `BRule` "chỉ X được" có test gọi thẳng API bằng vai khác nhận 403/404 · *nguồn:* REACT-AUTHZ-001, VUE-ROUTER-001
- [ ] SEC-AUTHZ-04 **Không lộ dữ liệu thừa trong response** — trả theo response model/DTO rõ trường; không trả hash mật khẩu, token, trường nội bộ · *soi:* grep `return user`/`res.json(entity)` không qua serializer · *nguồn:* FASTAPI-RESP-001

### Đầu vào & sink nguy hiểm
- [ ] SEC-INPUT-01 **Validate + chuẩn hoá ở biên** — schema (zod/joi/class-validator/pydantic/serializer) cho body/query/params; ép kiểu (id là số/UUID, không nhận mảng khi mong chuỗi) · *xấu:* `req.query.x` dùng thẳng; TypeScript coi là validate · *nguồn:* EXPRESS-INPUT-001, EXPRESS-INPUT-002, NEXT-INPUT-001
- [ ] SEC-INJECT-01 **SQL/NoSQL: tham số hoá** — không nối chuỗi vào query, không truyền object từ body vào filter Mongo (`$gt`, `$where`) · *soi:* grep `` `SELECT … ${`` , `.raw(`, `.query(` với template string; `find(req.body)` · *nguồn:* EXPRESS-INJECT-001/002, GO-INJECT-001, DJANGO-SQL-001
- [ ] SEC-INJECT-02 **Không chạy lệnh hệ thống với đầu vào người dùng** — `child_process.exec`, `os.system`, `subprocess(shell=True)`, `exec.Command` với chuỗi ghép · *sửa:* API có tham số tách, allowlist · *nguồn:* EXPRESS-CMD-001, FLASK-INJECT-002, GO-INJECT-002
- [ ] SEC-INJECT-03 **Không render template/code từ chuỗi người dùng** (SSTI, `eval`, `new Function`, `render_template_string`) · *nguồn:* EXPRESS-TEMPLATE-001, FLASK-SSTI-001, GO-SSTI-001, NEXT-INJECT-003
- [ ] SEC-XSS-01 **Không chèn HTML chưa sanitize** — `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, `|safe`, `mark_safe`, `template.HTML` với dữ liệu người dùng; markdown render phải sanitize · *soi:* grep các sink trên · *nguồn:* REACT-XSS-001, VUE-XSS-001, DJANGO-XSS-001, GO-XSS-001, JS-XSS-001
- [ ] SEC-URL-01 **URL từ người dùng: allowlist scheme** — `href`/`src`/redirect chỉ nhận `https://` (và đường dẫn tương đối cho redirect); chặn `javascript:`, `data:`, `//host` · *soi:* grep `redirect(`, `href={`, `window.location =` với biến · *nguồn:* EXPRESS-REDIRECT-001, REACT-URL-001, NEXT-REDIRECT-001, JS-URL-001
- [ ] SEC-SSRF-01 **Gọi ra ngoài với URL do người dùng ảnh hưởng: allowlist host + chặn IP nội bộ + timeout** · *soi:* grep `fetch(`/`axios(`/`http.Get(` với URL từ input · *nguồn:* EXPRESS-SSRF-001, GO-SSRF-001, NEXT-SSRF-001
- [ ] SEC-FILE-01 **Upload & phục vụ file** — kiểm loại theo nội dung (không tin `mimetype`/đuôi), giới hạn kích thước, tên file sinh lại, lưu ngoài web root, phục vụ với `Content-Disposition`/`nosniff`, không phục vụ upload như HTML/JS; chặn path traversal (`..`, đường tuyệt đối) ở `sendFile`/`send_from_directory`/`http.ServeFile` · *nguồn:* EXPRESS-UPLOAD-001, EXPRESS-FILES-001, DJANGO-UPLOAD-001, GO-PATH-001, FASTAPI-FILES-001

### Bí mật, lỗi, log
- [ ] SEC-SECRET-01 **Bí mật chỉ từ biến môi trường/secret manager** — không trong repo, không trong bundle client, không trong log/URL · *soi:* grep `PRIVATE_KEY|SECRET|password=|apiKey` trong `src/` và file cấu hình commit; `.env` có trong `.gitignore` · *nguồn:* GO-CONFIG-001, REACT-CONFIG-001, VUE-SECRETS-001, NEXT-SECRETS-001
- [ ] SEC-ERROR-01 **Lỗi production không lộ stack/SQL/đường dẫn** — envelope lỗi thống nhất, handler 404/500 riêng, debug tắt · *soi:* error middleware; grep `stack` trong response · *nguồn:* EXPRESS-ERROR-001, NEXT-ERROR-001, FLASK-DEPLOY-002, DJANGO-DEPLOY-002
- [ ] SEC-LOG-01 **Log không chứa bí mật/PII** — mật khẩu, token, header `Authorization`/`Cookie`, số thẻ; có correlation id để truy vết · *soi:* grep `console.log(req`, `logger.info(body` · *nguồn:* NEXT-LOG-001, DJANGO-LOG-001
- [ ] SEC-ID-01 **ID công khai không đếm được** — tài nguyên lộ ra URL dùng UUID/ngẫu nhiên, không auto-increment nhỏ · *nguồn:* security-best-practices "General Security Advice"

### Vận chuyển & cấu hình HTTP
- [ ] SEC-HTTP-01 **Header bảo mật** — `X-Content-Type-Options: nosniff`, chống clickjacking (`frame-ancestors`/`X-Frame-Options`), CSP ít nhất có `script-src` khi render nội dung người dùng; đặt ở app hoặc edge (ghi rõ ở đâu) · *nguồn:* EXPRESS-HEADERS-001, GO-HTTP-004, DJANGO-HEADERS-001, JS-CSP-001
- [ ] SEC-HTTP-02 **CORS tường minh, tối thiểu** — origin allowlist, không `*` kèm credentials · *soi:* grep `cors(`, `Access-Control-Allow-Origin` · *nguồn:* EXPRESS-CORS-001, FASTAPI-CORS-001, GO-HTTP-007
- [ ] SEC-HTTP-03 **CSRF khi xác thực bằng cookie** — token đồng bộ hoặc `SameSite` + kiểm `Origin`; không cần nếu chỉ Bearer header (ghi rõ trong ADR) · *nguồn:* EXPRESS-CSRF-001, NEXT-CSRF-001, DJANGO-CSRF-001, GO-HTTP-006
- [ ] SEC-HTTP-04 **Cookie phiên** — `HttpOnly`, `SameSite=Lax/Strict`, `Secure` ở production (qua cờ môi trường), tên không mặc định, không lưu bí mật trong cookie client đọc được · *nguồn:* EXPRESS-COOKIE-001, EXPRESS-SESS-001/002, GO-HTTP-005
- [ ] SEC-HTTP-05 **Giới hạn body/timeout** — kích thước body, số tham số, timeout đọc/ghi; ghi rõ nếu do proxy đảm nhiệm · *nguồn:* EXPRESS-BODY-001, EXPRESS-DOS-001, GO-HTTP-001/002, FASTAPI-LIMITS-001
- [ ] SEC-HTTP-06 **Tin proxy đúng topo** — `trust proxy`/`SECURE_PROXY_SSL_HEADER`/`ProxyFix` khớp số tầng proxy thật, không `true` trần; Host header validate (`ALLOWED_HOSTS`) · *nguồn:* EXPRESS-PROXY-001, DJANGO-PROXY-001, DJANGO-HOST-001, FLASK-HOST-001, GO-HTTP-003
- [ ] SEC-DEPS-01 **Dependency có lockfile + audit trong CI**; không chạy dev server/debug ở production · *soi:* CI có `npm audit`/`pip-audit`/`govulncheck`; Dockerfile/entrypoint · *nguồn:* EXPRESS-DEPS-001, VUE-DEPLOY-001, FASTAPI-DEPLOY-001, GO-DEPLOY-001

## Nhóm `node-backend` — Express · NestJS · Fastify
- [ ] SEC-NODE-01 **helmet() (hoặc tương đương) + tắt `x-powered-by`** — CSP cấu hình thật, không copy mẫu · *nguồn:* EXPRESS-HEADERS-001, EXPRESS-FINGERPRINT-001
- [ ] SEC-NODE-02 **Parser có giới hạn** — `express.json({ limit })`, `urlencoded({ limit, parameterLimit })`; NestJS: `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` toàn cục · *nguồn:* EXPRESS-BODY-001, FASTAPI-VALID-001 (tương đương)
- [ ] SEC-NODE-03 **`req.query` có thể là mảng/object** — ép kiểu trước khi dùng trong so sánh/query (HPP, type confusion) · *nguồn:* EXPRESS-INPUT-002
- [ ] SEC-NODE-04 **Session store production** — không MemoryStore; Redis/DB có TTL · *nguồn:* EXPRESS-SESS-002
- [ ] SEC-NODE-05 **`express.static` không trỏ thư mục upload**; `sendFile` với `root` cố định + kiểm path · *nguồn:* EXPRESS-STATIC-001, EXPRESS-FILES-001
- [ ] SEC-NODE-06 **Không `child_process` với chuỗi ghép; không `eval`/`vm.runInNewContext` với input** · *nguồn:* EXPRESS-CMD-001
- [ ] SEC-NODE-07 **Thứ tự middleware đúng** — parser → auth → CSRF/limiter → route; guard toàn cục trước controller (NestJS `APP_GUARD`) · *nguồn:* EXPRESS "audit order" §1.3

## Nhóm `nextjs` — Next.js (App Router / Pages)
- [ ] SEC-NEXT-01 **Ranh giới server/client là ranh giới bảo mật** — biến `NEXT_PUBLIC_*` là công khai; module server-only đánh dấu `server-only`; không import secret vào component client · *soi:* grep `NEXT_PUBLIC_` chứa secret; `process.env` trong file `"use client"` · *nguồn:* NEXT-SECRETS-001/002
- [ ] SEC-NEXT-02 **Server Action = endpoint công khai** — validate input + kiểm auth/authz trong mỗi action; không tin đối số bind chứa dữ liệu nhạy cảm · *nguồn:* NEXT-ACTION-001/002
- [ ] SEC-NEXT-03 **middleware.ts không được là guard duy nhất** — `matcher` có lỗ (route mới, `/api`, rewrite) → mỗi route/handler kiểm lại · *nguồn:* NEXT-AUTH-002
- [ ] SEC-NEXT-04 **Cache/static không rò dữ liệu theo người dùng** — trang cá nhân hoá không `force-static`/ISR chia sẻ; `fetch` có `cache: 'no-store'` khi kèm cookie · *nguồn:* NEXT-CACHE-001
- [ ] SEC-NEXT-05 **Webhook kiểm chữ ký trên raw body**; Host/Origin để dựng URL phải allowlist · *nguồn:* NEXT-WEBHOOK-001, NEXT-HOST-001
- [ ] SEC-NEXT-06 **Không chạy `next dev` ở production; giữ bản Next có hỗ trợ** (advisory middleware bypass từng có) · *nguồn:* NEXT-DEPLOY-001, NEXT-SUPPLY-001

## Nhóm `react-frontend` — React · Vue · Angular · jQuery · JS thuần
- [ ] SEC-FE-01 **Không có secret trong bundle** — API key trả phí, khoá ký, chuỗi kết nối · *soi:* grep `VITE_`/`REACT_APP_`/`NEXT_PUBLIC_` · *nguồn:* REACT-CONFIG-001, VUE-SECRETS-001/002
- [ ] SEC-FE-02 **Token không nằm ở `localStorage`/`sessionStorage`** khi có thể — cookie `HttpOnly` hoặc memory; giả định XSS sẽ xảy ra · *nguồn:* REACT-AUTH-001, VUE-AUTH-001, JS-STORAGE-001
- [ ] SEC-FE-03 **Sink DOM** — `dangerouslySetInnerHTML`/`v-html`/`innerHTML`/`$(html)`/`.load()`/`document.write`/`setAttribute('on…')` chỉ với nội dung đã sanitize (DOMPurify) · *nguồn:* REACT-XSS-001, REACT-DOM-001, VUE-XSS-001..006, JQ-XSS-001..004, JS-XSS-001..004
- [ ] SEC-FE-04 **URL binding** — `href`/`src`/`router.push(next)` allowlist scheme + cùng site; `return_to`/`next` không nhận URL tuyệt đối · *nguồn:* REACT-URL-001, REACT-REDIRECT-001, VUE-ROUTER-002, JS-URL-001/002
- [ ] SEC-FE-05 **`postMessage` kiểm `origin` + `targetOrigin` cụ thể** · *nguồn:* REACT-POSTMSG-001, JS-MSG-001
- [ ] SEC-FE-06 **Script bên thứ ba: tối thiểu, self-host hoặc SRI; CSP có `script-src`** · *nguồn:* REACT-SRI-001, JS-SUPPLY-001, JS-SRI-001, VUE-SRI-001
- [ ] SEC-FE-07 **Route guard client chỉ là UX**; mọi quyết định quyền ở server (xem SEC-AUTHZ-03) · *nguồn:* VUE-ROUTER-001, REACT-AUTHZ-001
- [ ] SEC-FE-08 **File preview/upload không tạo nội dung chủ động** — không render SVG/HTML người dùng inline; `Object URL` cho ảnh đã kiểm · *nguồn:* REACT-FILE-001
- [ ] SEC-FE-09 **jQuery đã vá** (≥3.5) và không `$(untrustedString)`; `escapeSelector` cho selector từ input; không deep-merge object người dùng (prototype pollution) · *nguồn:* JQ-SUPPLY-001, JQ-SELECTOR-001, JQ-PROTOTYPE-001

## Nhóm `python` — Django · Flask · FastAPI
- [ ] SEC-PY-01 **`DEBUG=False`, không dev server, `SECRET_KEY` từ môi trường và xoay được** · *nguồn:* DJANGO-DEPLOY-001/002, DJANGO-CONFIG-001, FLASK-DEPLOY-001/002, FLASK-CONFIG-001
- [ ] SEC-PY-02 **`ALLOWED_HOSTS`/Host validate + `SECURE_PROXY_SSL_HEADER`/`ProxyFix` đúng số proxy** · *nguồn:* DJANGO-HOST-001, DJANGO-PROXY-001, FLASK-HOST-001, FLASK-PROXY-001, FASTAPI-HOST-001, FASTAPI-PROXY-001
- [ ] SEC-PY-03 **ORM/parameterized; không `.raw(f"…")`, `.extra(`, `cursor.execute(f"…")`** · *nguồn:* DJANGO-SQL-001, FLASK-INJECT-001, FASTAPI-INJECT-001
- [ ] SEC-PY-04 **Template: không `|safe`/`mark_safe`/`Markup(` với input; không `render_template_string(user)`** · *nguồn:* DJANGO-XSS-001, DJANGO-TEMPLATE-001, FLASK-XSS-001, FLASK-SSTI-001, FASTAPI-SSTI-001
- [ ] SEC-PY-05 **FastAPI: `/docs`/`/openapi.json` tắt hoặc bảo vệ ở production; auth qua `Depends` nhất quán; pydantic model riêng cho input (không nhận trường quyền) và `response_model` cho output** · *nguồn:* FASTAPI-OPENAPI-001, FASTAPI-AUTH-001, FASTAPI-VALID-001, FASTAPI-RESP-001
- [ ] SEC-PY-06 **Django admin = mục tiêu giá trị cao** — đường dẫn không mặc định, 2FA/IP allowlist, tài khoản staff tối thiểu · *nguồn:* DJANGO-ADMIN-001
- [ ] SEC-PY-07 **`MAX_CONTENT_LENGTH`/`DATA_UPLOAD_MAX_MEMORY_SIZE`, multipart limit; WebSocket có auth + kiểm Origin** · *nguồn:* FLASK-LIMITS-001, FASTAPI-LIMITS-001, FASTAPI-WS-001
- [ ] SEC-PY-08 **Không đổi trạng thái qua GET; không bí mật trong URL** · *nguồn:* FLASK-HTTP-001, FASTAPI-AUTH-002

## Nhóm `go` — Go backend
- [ ] SEC-GO-01 **`http.Server` có `ReadHeaderTimeout`/`ReadTimeout`/`WriteTimeout`/`IdleTimeout` + `MaxHeaderBytes`; body qua `http.MaxBytesReader`; multipart `ParseMultipartForm` có trần** · *nguồn:* GO-HTTP-001/002
- [ ] SEC-GO-02 **`/debug/pprof`, `expvar`, metrics không public** · *nguồn:* GO-DEPLOY-002
- [ ] SEC-GO-03 **`html/template` (không `text/template`) cho HTML; không `template.HTML(userInput)`; không parse template từ input** · *nguồn:* GO-XSS-001, GO-SSTI-001
- [ ] SEC-GO-04 **`crypto/rand` cho token/id; bcrypt/argon2id cho mật khẩu; `subtle.ConstantTimeCompare`** · *nguồn:* GO-CRYPTO-001, GO-AUTH-001
- [ ] SEC-GO-05 **Client HTTP ra ngoài có timeout, đóng body; SSRF allowlist** · *nguồn:* GO-HTTPCLIENT-001, GO-SSRF-001
- [ ] SEC-GO-06 **`GONOSUMDB`/`GOFLAGS=-mod=mod` không tắt xác thực module; toolchain cập nhật; `go test -race` trong CI; `unsafe`/cgo audit riêng** · *nguồn:* GO-SUPPLY-001, GO-DEPLOY-001, GO-CONC-001, GO-UNSAFE-001
- [ ] SEC-GO-07 **`filepath.Clean` + kiểm prefix trước `http.ServeFile`/`os.Open` với tên từ input** · *nguồn:* GO-PATH-001, GO-UPLOAD-001

## Nhóm `data` — PostgreSQL · MySQL · MongoDB · Redis
- [ ] SEC-DATA-01 **Guard tenant ở MỘT chỗ** (repository base/ORM scope/RLS) — mọi truy vấn bảng nghiệp vụ có `tenant_id` từ ngữ cảnh xác thực; test đọc chéo tổ chức trả 404 · *soi:* grep query bảng nghiệp vụ không qua base repository · *nguồn:* NFR cách ly tenant của mẫu + FASTAPI-AUTHZ-001
- [ ] SEC-DATA-02 **Tài khoản DB ứng dụng tối thiểu quyền** — không superuser, không `DROP`; migration chạy bằng vai riêng · *soi:* chuỗi kết nối, script migration
- [ ] SEC-DATA-03 **Redis/cache không mở ra internet, có auth; không lưu bí mật/PII dạng rõ trong cache; bộ đếm brute-force có TTL** · *nguồn:* ADR đếm brute-force ở Redis (mẫu) + EXPRESS-SESS-002
- [ ] SEC-DATA-04 **Backup mã hoá, nơi lưu đúng ràng buộc pháp lý (residency), kiểm khôi phục định kỳ** · *soi:* `10-architecture.md` §6/§9 ↔ script backup thật
- [ ] SEC-DATA-05 **Migration/seed không chứa mật khẩu thật, không tắt ràng buộc FK "cho nhanh"** · *soi:* diff `migrations/`, `seed*`

## Nhóm `external` — tích hợp hệ ngoài `EXT-..`
- [ ] SEC-EXT-01 **Credential nhà cung cấp** — ngoài repo, xoay được, tách sandbox/production, tối thiểu scope (SES: chỉ `SendEmail`) · *nguồn:* GO-CONFIG-001 + readiness `12-api-integration.md` §6
- [ ] SEC-EXT-02 **Webhook vào: kiểm chữ ký trên raw body + chống replay (timestamp/nonce)**; không tin IP nguồn · *nguồn:* NEXT-WEBHOOK-001
- [ ] SEC-EXT-03 **Gọi ra: timeout, retry có giới hạn + idempotency key, circuit breaker; lỗi hệ ngoài không làm sập luồng chính** · *nguồn:* GO-HTTPCLIENT-001 + luồng lỗi `12-api-integration.md` §5
- [ ] SEC-EXT-04 **Dữ liệu gửi ra ngoài tối thiểu** — chỉ trường mapping §4 của `12-api-integration.md` (không gửi mô tả/PII thừa); PII ra khỏi region phải có ràng buộc pháp lý cho phép · *soi:* payload builder ↔ bảng mapping
- [ ] SEC-EXT-05 **SDK/dependency nhà cung cấp ghim version, cập nhật theo advisory** · *nguồn:* EXPRESS-DEPS-001

---

## Cách cắt vào §6 của `00-threat-model.md`
1. Lấy dòng `nhóm checklist:` từ `scan-threat.js` (vd `chung, nextjs, react-frontend, node-backend, data, external`).
2. Với mỗi nhóm, chọn các mục **có tài sản/ranh giới tương ứng trong §1–§2** — không có upload thì bỏ SEC-FILE-01, không có cookie session thì ghi SEC-HTTP-03 là "không áp — Bearer header, `ADR-..`".
3. Mỗi mục giữ mã `SEC-…`, viết lại cột "Soi ở đâu" theo **cấu trúc thư mục của `10-architecture.md` §10** (đường dẫn thật của dự án), nối `TM` liên quan.
4. Mục nào không nối `TM` nào và không có tài sản đứng sau → cân nhắc bỏ; §6 dài hơn 25 mục là chưa cắt.
