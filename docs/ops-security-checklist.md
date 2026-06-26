# Herfree 운영 보안 · 환경변수 체크리스트

> 배포 전 **복사해서 ✅ 채우기** · 상세 배포: [`deployment.md`](./deployment.md)  
> 검증일 기준: 코드·`docker-compose.prod.yml` 대조 (자동화 아님 — 배포 직전 사람이 확인)

---

## 1. 한눈에: 코드에 이미 잘 되어 있는 것

| 항목 | 코드/설정 | 판정 |
|------|-----------|------|
| API 권한 서버 고정 | `SecurityConfig` — URL·역할별 `hasRole` | ✅ |
| JWT Stateless + BCrypt | `JwtAuthenticationFilter`, `PasswordEncoder` | ✅ |
| 로그인 잠금 (10회/30분) | `LoginLockoutService` | ✅ (인메모리) |
| 로그인·가입 IP 제한 | `AuthRateLimitFilter` (분당 20회) | ✅ (인메모리) |
| prod `ddl-auto: validate` | `application.yml` prod 프로필 | ✅ |
| Flyway clean 금지 | `clean-disabled: true` | ✅ |
| prod Swagger 끔 | `springdoc.enabled: false` | ✅ |
| prod 데모 시드 끔 | `app.demo-seed.enabled: false` + `@Profile("local")` | ✅ |
| API **127.0.0.1 바인딩** | `docker-compose.prod.yml` `127.0.0.1:8080:8080` | ✅ |
| Nginx → 로컬 Spring | `infra/nginx/herfree.conf` | ✅ |
| 이미지 URL 화이트리스트 | `PostImageStorageService.assertImageUrlAllowed` | ✅ |
| 비공개 게시판 정책 | `PrivateBoardPolicy` + 테스트 | ✅ |
| 프론트 same-origin API | Vercel `API_REWRITE_TARGET`, `NEXT_PUBLIC_API_URL` 비움 | ✅ 설계 |
| CI 시크릿 git 없음 | `JWT_SECRET` CI env만 | ✅ |

---

## 2. 배포 시 **반드시** 사람이 넣어야 하는 것 (env)

아래를 안 하면 **운영에서 깨지거나 보안 구멍**이 납니다.

### VPS `.env.prod` (`.env.prod.example` 복사)

| # | 변수 | 올바른 값 | 확인 방법 | ☐ |
|---|------|-----------|-----------|---|
| 1 | `SPRING_PROFILES_ACTIVE` | `prod` | docker-compose에 설정됨 | ☐ |
| 2 | `JWT_SECRET` | 32자+ 랜덤 (`openssl rand -base64 32`) | git·YAML에 없음 | ☐ |
| 3 | `MYSQL_PASSWORD` / `MYSQL_ROOT_PASSWORD` | 강한 비밀번호 | `.env.prod`만 | ☐ |
| 4 | `CORS_ALLOWED_ORIGINS` | `https://실제-vercel-도메인` (쉼표로 preview 추가 가능) | 빈 값이면 prod CORS **전부 차단** | ☐ |
| 5 | `ADMIN_BOOTSTRAP_ENABLED` | **`false`** | compose 기본 `false` — env 덮어쓰지 않기 | ☐ |
| 6 | `S3_BUCKET` / `S3_REGION` | 운영 버킷 | 이미지 업로드 smoke | ☐ |
| 7 | `S3_ACCESS_KEY` / `S3_SECRET_KEY` | IAM 최소권한 또는 **비우고** VPS IAM 역할 | 키 git 없음 | ☐ |
| 8 | MySQL 포트 | **외부 미개방** (compose 내부망만) | VPS `ufw`/보안그룹 | ☐ |
| 9 | API 8080 | **외부 미개방**, Nginx 443만 공개 | `ss -tlnp` → 127.0.0.1:8080 | ☐ |
| 10 | HTTPS | `api.도메인` certbot/Let's Encrypt | 브라우저 자물쇠 | ☐ |

### Vercel (Production)

| # | 변수 | 값 | ☐ |
|---|------|-----|---|
| 11 | `API_REWRITE_TARGET` | `https://api.도메인` (끝 `/` 없음) | ☐ |
| 12 | `NEXT_PUBLIC_API_URL` | **비움** (same-origin `/api` 사용) | ☐ |

---

## 3. 배포 후 5분 스모크 (보안·연동)

| # | 테스트 | 기대 | ☐ |
|---|--------|------|---|
| S1 | `GET https://api.도메인/api/health` | 200 | ☐ |
| S2 | 시크릿 창 가입 → 로그인 | 200 + 토큰 | ☐ |
| S3 | 비로그인 `POST /api/posts` | **401** | ☐ |
| S4 | 일반 계정 `GET /api/admin/reports` | **403** | ☐ |
| S5 | 이미지 글 작성·상세 표시 | 200, 깨진 이미지 없음 | ☐ |
| S6 | 로그인 11회 틀리기 | 429 잠금 메시지 | ☐ |
| S7 | 운영 DB에 `demo@herfree.local` 등 **없음** | — | ☐ |
| S8 | `/swagger-ui.html` | **404/비활성** | ☐ |

---

## 4. 알려진 MVP 한계 (지금 단계에서 정상)

| 항목 | 설명 | 나중에 |
|------|------|--------|
| 로그인 잠금·IP 제한 | 서버 **메모리** — 재시작 시 초기화 | Redis |
| JWT refresh / 블랙리스트 | 없음 | reissue API |
| 전역 API rate limit | 로그인·가입만 | API Gateway |
| WAF | 없음 | Cloudflare 등 |

---

## 5. 빠른 자가 진단 (로컬에서 코드만)

```bash
# 백엔드 테스트 (보안 관련 포함)
cd backend && ./gradlew test

# prod 프로필 키워드 확인 (소스에 시크릿 없어야 함)
rg "JWT_SECRET|change_me" backend/src/main/resources --glob '!*.example'
```

- `docker-compose.prod.yml`에 `127.0.0.1:8080` 있는지
- `.env.prod`가 `.gitignore`에 있는지

---

## 6. 결과 기록 (포폴·인수인계)

| 항목 | 내용 |
|------|------|
| 점검일 | |
| 점검자 | |
| 환경 | staging / production |
| §2 통과 | /10 |
| §3 통과 | /8 |
| 미통과 번호 | |
| 서명 | |

---

## 부록: CORS가 비어 있으면?

`CorsConfig`: prod에서 `CORS_ALLOWED_ORIGINS`·`CORS_ALLOWED_ORIGIN_PATTERNS` 둘 다 비면 **허용 origin 0개**.

- **Vercel → Next `/api` 프록시만** 쓰면 브라우저 UX는 대부분 동작
- **`api.도메인`을 브라우저가 직접 호출**하면 CORS 설정 **필수**

운영에서는 **#4 반드시 설정** 권장.
