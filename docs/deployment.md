# Herfree Platform — 배포·운영 (확정)

> **상태:** 2026-06-10 의뢰인·개발 합의 기준 **1단계 런칭 확정안**  
> **대상 트래픽:** 런칭 일 50~200명 (여유 시 400까지 1단계 유지), 경쟁 벤치마크 일 600은 장기 참고

---

## 0. 확정 결정 요약

| 항목 | 결정 |
|------|------|
| **프론트** | Vercel (`frontend/`) |
| **API + DB** | **VPS 1대** Docker — Spring Boot + MySQL 8 |
| **게시글 이미지** | **AWS S3** (또는 비용 절감 시 Cloudflare R2, S3 호환 API) |
| **DB 버전·안전** | Flyway + prod `ddl-auto: validate` + 일일 백업 |
| **월 운영비** | **약 2~4만 원** (VPS 2GB + Vercel + S3 소량) |

### 채택하지 않음

| 대안 | 이유 |
|------|------|
| Supabase (DB/Auth/Storage 전환) | Spring+MySQL 기존 구현 대비 재작성·납기·리스크 큼 |
| AWS Free Tier EC2 1년 | t3.micro 1GB에 Spring+MySQL 부담, 1년 후 과금·설정 복잡 |
| AWS Frontier / CloudFront 단독 | CDN·AI 제품명 혼동, 전체 호스팅 해법 아님 |
| 1단계부터 RDS·EC2 | 초기 트래픽·비용 대비 과투자 |

---

## 1. 아키텍처 (1단계 — 런칭)

```
[Browser]
    │
    ├──────────────────────────────┐
    ▼                              ▼
[Vercel — Next.js]            [S3 / R2]
  화면 + /api Route 프록시       게시글 이미지 저장·조회
    │
    ▼ HTTPS api.도메인
[VPS — Docker]
  Nginx (TLS) → Spring Boot :8080 → MySQL 8 (named volume)
    │
  Flyway migration + infra/scripts/backup-db.sh (cron)
```

### 게시글 이미지 업로드

**확정 (1차 MVP):** 브라우저 → **Vercel/Next `/api` 프록시** → **Spring Boot** → **S3**  
업로드 시 **S3 CORS 설정 불필요** (브라우저가 S3에 직접 접속하지 않음).

1. 로그인 사용자 → `POST /api/posts/images/upload` (multipart)  
2. Spring → S3 `PutObject` (서버 SDK)  
3. 글 등록 시 `imageUrl`만 MySQL 저장  
4. 이미지 **조회**만 S3/CDN URL (GetObject 공개 또는 CloudFront)

> presigned URL 직접 업로드(`/upload-url`)는 확장용으로만 유지. 클라이언트는 `/upload` 사용.

---

## 2. 단계별 전략

| 단계 | 구성 | 월 비용 | 전환 조건 |
|------|------|---------|-----------|
| **1단계 (확정·시작)** | Vercel + **VPS Docker** (API+MySQL) + S3 | **2~4만 원** | 런칭 ~ 일 방문 400 전후 |
| **2단계 (확장)** | Vercel + EC2 + **RDS** + S3 (+ CloudFront 선택) | 5~10만 원 | 일 400~600+ **지속**, 동시 50+ 자주 |

**1단계가 기본값.** `docker-compose.prod.yml` + `infra/` 참고.

### 트래픽 가이드 (운영 참고)

| 일 방문 | 동시 접속(대략) | 인프라 |
|---------|-----------------|--------|
| 50~150 | 5~20 | 1단계 ✅ |
| 150~400 | 15~50 | 1단계 ✅ (모니터링) |
| 400~600+ | 40~80 | 2단계 검토 |
| 1,000+ | 80+ | 2단계 권장 |

관리자: [admin-setup.md](admin-setup.md) — bootstrap/SQL로 SUPER_ADMIN 1명.

---

## 3. 환경

| 환경 | Frontend | Backend | DB | Object Storage |
|------|----------|---------|-----|----------------|
| `local` | `npm run dev` | `./gradlew bootRun` | Docker MySQL | dev 버킷 또는 mock |
| `staging` | Vercel Preview | VPS (스테이징) | MySQL (별도 volume) | `*-staging` 버킷 |
| `production` | Vercel Production | VPS prod | MySQL prod volume | `*-prod` 버킷 |

---

## 4. 계정·역할 (소유권)

| 계정 | 소유 | 비고 |
|------|------|------|
| Vercel | **의뢰인** | 결제·도메인 |
| VPS | **의뢰인** | Ubuntu 22.04+, **RAM 2GB** 권장 |
| AWS (S3 IAM) | **의뢰인** | 이미지 전용 최소 권한 키 |
| 도메인 | **의뢰인** | `www.` + `api.` |
| 초기 세팅·배포 | 개발자 | 문서·스크립트 인수인계 |
| 일상 운영 (신고·콘텐츠) | **의뢰인** | `/admin` |

---

## 5. 환경 변수

### Vercel (Production)

| 변수 | 값 |
|------|-----|
| `API_REWRITE_TARGET` | `https://api.도메인` (끝에 `/` 없음) |
| `NEXT_PUBLIC_API_URL` | **비움** — 브라우저는 same-origin `/api` 사용 |

### VPS `.env.prod` (git 커밋 금지)

`.env.prod.example` 복사 후 설정.

| 변수 | 설명 |
|------|------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `MYSQL_*` | Docker MySQL |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `JWT_ACCESS_EXPIRATION` | `3600` 등 |
| `CORS_ALLOWED_ORIGINS` | Vercel production URL (필요 시 preview 추가) |
| `S3_BUCKET` | `herfree-prod-uploads` (의뢰인 AWS 계정) |
| `S3_REGION` | `ap-northeast-2` |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | S3 전용 IAM (**VPS IAM 역할 권장**, 키 비우면 역할 사용) |
| `S3_PUBLIC_BASE_URL` | CloudFront URL (선택) |
| `ADMIN_BOOTSTRAP_ENABLED` | **`false`** (운영 필수) |

> **운영 보안 체크리스트:** [`ops-security-checklist.md`](ops-security-checklist.md) — env 10항 + 스모크 8항

> **비밀 관리:** JWT·DB·S3 키는 `.env.prod`·VPS 환경 변수만. git·YAML·프론트 env에 넣지 않는다.  
> IAM 정책 예시: `infra/aws/s3-iam-policy.json`

---

## 6. 1단계 빠른 시작

```bash
# VPS (Ubuntu 22.04+, RAM 2GB 권장)
cp .env.prod.example .env.prod   # 값 채우기
./infra/scripts/deploy-vps.sh

# Vercel: Root Directory = frontend/
# env: API_REWRITE_TARGET=https://api.도메인
```

| 파일 | 역할 |
|------|------|
| `docker-compose.prod.yml` | MySQL + Spring Boot API |
| `.env.prod.example` | 운영 환경변수 템플릿 |
| `infra/nginx/herfree.conf` | HTTPS, `/api` → Spring |
| `infra/scripts/backup-db.sh` | 일일 DB 백업 (cron) |
| `infra/scripts/deploy-vps.sh` | VPS 초기 배포 |
| `.github/workflows/ci.yml` | PR/push 시 test·build |

---

## 7. DB 안전·버전 관리 (필수)

| 항목 | 정책 |
|------|------|
| 스키마 변경 | **Flyway `V*` SQL만** — 기존 테이블 `DROP` 금지 |
| prod JPA | `ddl-auto: validate` |
| Flyway | `clean-disabled: true`, `validate-on-migrate: true` |
| 로컬 | `ddl-auto: update` — gitignored `application-local.yml`만 |
| 배포 전 | `mysqldump` 백업 1회 |
| 운영 | cron 일일 백업, 7일 보관 (`backup-db.sh`) |
| (선택) | 주 1회 백업 파일 S3 업로드 |

**금지:** prod `create` / `create-drop`, `docker volume rm`, `flyway clean`

---

## 8. 배포 절차 (매 릴리스)

1. 로컬·CI green (`./gradlew test`, `npm run build`)
2. prod DB 백업
3. 신규 Flyway migration 확인
4. backend Docker 이미지 빌드·재기동 (`docker compose up -d`)
5. Nginx reload
6. frontend 변경 시 Vercel production deploy
7. **Smoke 5분:** 가입 → 로그인(모바일) → 이미지 글쓰기 → admin 신고
8. 실패 시 이전 이미지·백업 롤백

---

## 9. Go/No-Go (소프트 런칭)

- [ ] PC·모바일 가입/로그인 (**시크릿 창**에서 `POST /api/auth/login` → `200` + `accessToken` 확인)
- [ ] Vercel `API_REWRITE_TARGET` = VPS API URL (502 「백엔드에 연결…」 없음)
- [ ] 이미지 포함 글쓰기·목록·상세
- [ ] 신고 → admin 처리·숨김/복구
- [ ] `GET /api/health` 또는 `/actuator/health` → 200
- [ ] DB 백업 파일 생성 확인
- [ ] prod `ddl-auto: validate` · `ADMIN_BOOTSTRAP_ENABLED=false`
- [ ] CORS·JWT·DB 비밀 env만 (git 없음)
- [ ] 배포 DB 관리자 계정 SQL 시드 ([admin-setup.md](admin-setup.md))
- [ ] 시드 콘텐츠 (공지·게시글·정보 최소 1세트)
- [ ] **제품 큐레이션 UI 비노출** 확인 (`FEATURE_PRODUCTS_ENABLED=false`)

---

## 10. Frontend (Vercel)

| 항목 | 값 |
|------|-----|
| Root Directory | `frontend/` |
| Build Command | `npm run build` |
| Node | 20 LTS |
| Framework | Next.js |

- Git `main` push → Production, PR → Preview
- API 프록시: `frontend/src/app/api/[...path]/route.ts`

---

## 11. Backend (VPS Docker)

- Build: multi-stage — Gradle `bootJar` → `eclipse-temurin:17-jre`
- Health: `GET /actuator/health`
- Nginx: `location /api/` → `127.0.0.1:8080`
- TLS: Let's Encrypt (certbot)
- API 본문 업로드: 이미지는 S3 직접 — Nginx `client_max_body_size`는 JSON API 기준 유지

`deploy-backend.yml`(ECR·EC2)은 **2단계**에서 도입. 1단계는 SSH + `deploy-vps.sh`.

---

## 12. Nginx

- `infra/nginx/herfree.conf` 참고
- `api.도메인` — `/api/`, `/actuator/health` 프록시

---

## 13. CI/CD

- **ci.yml:** PR·`main` — backend test + frontend build
- **Frontend 배포:** Vercel Git Integration
- **Backend 배포 (1단계):** VPS SSH + docker compose (수동 또는 추후 workflow)

---

## 14. 2단계 — RDS·EC2 (확장 시)

```
[Browser] → [Vercel] → [Nginx @ EC2] → [Spring Docker] → [RDS MySQL 8]
                                              ↓
                                         [S3 + CloudFront?]
```

- Engine: MySQL 8.0+, `utf8mb4_unicode_ci`
- RDS: 자동 스냅샷, EC2 SG만 3306 inbound
- Flyway·백업 정책 **1단계와 동일**

---

## 15. 보안·운영 체크리스트

- [ ] CORS: Vercel production·preview origin만
- [ ] HTTPS 강제
- [ ] JWT·DB·AWS 키 **git·YAML·프론트 env 미포함** (VPS `.env.prod` 또는 IAM 역할만)
- [ ] S3 버킷 **공개 쓰기 금지** — API 서버 IAM으로만 PutObject
- [ ] S3 **업로드용 CORS 불필요** (API 경유 업로드)
- [ ] S3 **조회**: `posts/*` GetObject 공개 또는 CloudFront
- [ ] 글 등록 시 `imageUrl`은 **본인 버킷·prefix만** 허용 (서버 검증)
- [ ] 노출된 dev 키는 **폐기·재발급** 후 의뢰인 prod IAM으로 교체
- [ ] `ADMIN_BOOTSTRAP_ENABLED=false` (운영)
- [ ] CI green 후 prod 배포

### S3 버킷 정책 (요약)

| 항목 | 정책 |
|------|------|
| 쓰기 | Spring API → S3 PutObject (IAM 키 또는 역할) |
| 읽기 | `posts/*` GetObject 공개 또는 CloudFront |
| 업로드 CORS | **불필요** (브라우저→API만) |
| IAM | `s3:PutObject` on `posts/*`만 (`infra/aws/s3-iam-policy.json`) |
| 키 보관 | 로컬: OS env / IDE Run Config. 운영: VPS env 또는 IAM 역할 |

---

## 16. 로컬 개발 환경

| 단계 | 명령 |
|------|------|
| DB 기동 | `docker compose -f docker-compose.local.yml up -d` |
| Backend | `cd backend && ./gradlew bootRun` |
| Frontend | `cd frontend && npm run dev` |

- `application-local.yml` — example 복사, gitignore
- JDBC: `localhost:3306/herfree_db`
- `NEXT_PUBLIC_API_URL` 비움 → `/api` 프록시

상세: §9 (이전 문서) — Docker MySQL 기본값·3306 충돌은 `docker-compose.local.yml` 주석 참고.

---

## 17. 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-06-03 | EC2·Vercel·RDS·CI/CD 초안 |
| 2026-06-10 | **1단계 확정:** Vercel+VPS+S3, Supabase/AWS Free Tier 미채택, 이미지 presigned, 트래픽·Go/No-Go·계정 소유권 반영 |
