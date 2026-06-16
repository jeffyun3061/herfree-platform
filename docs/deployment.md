# Herfree Platform — 배포·운영

## 0. 단계별 전략 (권장)

| 단계 | 구성 | 월 비용 | 용도 |
|------|------|---------|------|
| **1단계 (시작)** | Vercel + **VPS Docker**(API+MySQL) | **약 1~3만 원** | 외주 납품·초기 실운영 (DAU 수백·동시 50~80명) |
| **2단계 (확장)** | Vercel + EC2 + RDS | 약 5~10만 원 | DAU 1,000+·DB 분리·백업 자동화 |

**1단계가 기본값이다.** `docker-compose.prod.yml` + `infra/` 참고.

관리자 계정: [admin-setup.md](admin-setup.md) — bootstrap/SQL로 SUPER_ADMIN 1명, 이후 화면에서 승격.

### 1단계 빠른 시작

```bash
# VPS (Ubuntu 22.04+, RAM 2GB 권장)
cp .env.prod.example .env.prod   # 값 채우기
./infra/scripts/deploy-vps.sh

# Vercel: frontend/ 루트, NEXT_PUBLIC_API_URL=https://api.도메인
```

| 파일 | 역할 |
|------|------|
| `docker-compose.prod.yml` | MySQL + Spring Boot API |
| `.env.prod.example` | 운영 환경변수 템플릿 |
| `infra/nginx/herfree.conf` | HTTPS 리버스 프록시 (호스트 Nginx) |
| `infra/scripts/backup-db.sh` | 일일 DB 백업 (cron) |
| `.github/workflows/ci.yml` | PR/push 시 test·build |

---

## 1. 아키텍처 (2단계 — 확장 시)

```
[Browser]
    │
    ▼ HTTPS
[Vercel] ── Next.js (frontend/)
    │
    ▼ HTTPS API
[Nginx @ EC2] ── TLS, /api → upstream
    │
    ▼
[Docker] Spring Boot JAR (:8080)
    │
    ▼ 3306 (private SG)
[AWS RDS MySQL 8]
```

| 구성요소 | 플랫폼 | 1차 MVP |
|----------|--------|---------|
| Frontend | Vercel | ✅ |
| Backend | EC2 + Docker | ✅ |
| DB | RDS MySQL 8 | ✅ |
| Reverse Proxy | Nginx (EC2) | ✅ |
| Object Storage | S3 | 2차 |
| CI | GitHub Actions | ✅ |

---

## 2. 환경

| 환경 | Frontend | Backend | DB |
|------|----------|---------|-----|
| `local` | `npm run dev` | `./gradlew bootRun` | Docker MySQL |
| `staging` | Vercel Preview | EC2 staging | RDS staging |
| `production` | Vercel Production | EC2 prod | RDS prod |

---

## 3. Backend (EC2 + Docker)

### 3.1 디렉터리 (예정)

```
infra/
├── docker/
│   ├── Dockerfile.backend
│   └── docker-compose.prod.yml
├── nginx/
│   └── herfree.conf
└── scripts/
    ├── deploy-backend.sh
    └── health-check.sh
```

### 3.2 Docker

- Build: multi-stage — Gradle `bootJar` → runtime `eclipse-temurin:17-jre`
- Health: `GET /actuator/health` (Spring Actuator)
- Port: 컨테이너 `8080`, Nginx가 443 → proxy

### 3.3 환경 변수 (운영)

| 변수 | 설명 |
|------|------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | RDS JDBC (`jdbc:mysql://...`) |
| `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` | RDS 자격증명 |
| `JWT_SECRET` | 서명 키 (Secrets Manager 권장) |
| `JWT_ACCESS_EXPIRATION` | Access TTL (초) |

git 제외: `application-secret.yml`, `application-prod.yml`

### 3.4 배포 절차 (수동·자동 공통)

1. Flyway migration 적용 여부 확인
2. 이미지 빌드·레지스트리 push (ECR)
3. EC2에서 `docker compose pull && up -d`
4. Nginx reload, health check
5. 실패 시 이전 이미지 태그 롤백

---

## 4. Frontend (Vercel)

| 항목 | 값 |
|------|-----|
| Root Directory | `frontend/` |
| Build Command | `npm run build` |
| Node | 20 LTS |
| Framework | Next.js |

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_API_URL` | Production API base |

Vercel Git 연동 시 `main` push → Production, PR → Preview.

---

## 5. CI/CD — GitHub Actions

### 5.1 `ci.yml` (PR · `main` push)

```yaml
# 개요 — 구현 시 .github/workflows/ci.yml 로 추가
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: "17"
          distribution: "temurin"
      - run: cd backend && ./gradlew test bootJar
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: cd frontend && npm ci && npm run lint && npm run build
```

- PR merge 조건: `backend` + `frontend` job success
- 캐시: Gradle wrapper, `npm` (`actions/cache`)

### 5.2 `deploy-backend.yml`

트리거: `main` push 또는 `v*` tag.

1. `bootJar` + Docker build
2. Push to **Amazon ECR**
3. SSM/SSH로 EC2 배포 스크립트 실행
4. Post-deploy: `/actuator/health` 200 확인

### 5.3 Frontend 배포

- 기본: Vercel Git Integration (별도 workflow 불필요)
- 선택: `deploy-frontend.yml`에서 preview URL smoke test만 수행

### 5.4 Repository Secrets (예시)

| Secret | 용도 |
|--------|------|
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | ECR push (최소 IAM) |
| `EC2_HOST`, `EC2_SSH_KEY` 또는 SSM role | 배포 |
| `JWT_SECRET` | CI 통합 테스트용 (선택) |

---

## 6. RDS MySQL

- Engine: MySQL 8.0+, charset `utf8mb4_unicode_ci`
- Multi-AZ: production 권장
- Backup: automated snapshot 7일+
- Security Group: EC2 backend SG만 `3306` inbound
- Connection pool: HikariCP (Spring Boot 기본), max pool은 인스턴스 크기에 맞게 조정

---

## 7. Nginx

- `location /api/` → `proxy_pass http://127.0.0.1:8080`
- TLS: Let's Encrypt (certbot) 또는 ALB + ACM
- `client_max_body_size`: 1차 MVP 파일 업로드 없음 → 기본 유지
- Rate limit: 2차

---

## 8. 보안·운영 체크리스트

- [ ] CORS: Vercel production·preview origin만
- [ ] HTTPS 강제, HSTS (운영)
- [ ] JWT secret 로테이션 절차 문서화
- [ ] RDS credentials Secrets Manager
- [ ] `application-prod.yml` git 미포함
- [ ] CI green on `main` 후 배포

---

## 9. 로컬 개발 환경

로컬은 **Docker MySQL** + **Spring `local` profile** 조합을 표준으로 한다.

| 단계 | 명령 |
|------|------|
| DB 기동 | `docker compose -f docker-compose.local.yml up -d` |
| DB 중지 | `docker compose -f docker-compose.local.yml down` |
| DB 로그 | `docker logs -f herfree-mysql` |
| Backend | `cd backend && ./gradlew bootRun` (`spring.profiles.active=local`) |
| Frontend | `cd frontend && npm run dev` |

### 9.1 Spring 로컬 설정

1. `backend/src/main/resources/application-local.yml.example`를 `application-local.yml`로 복사 (gitignored)
2. JDBC: `jdbc:mysql://localhost:3306/herfree_db?serverTimezone=Asia/Seoul&characterEncoding=UTF-8`
3. `ddl-auto: update` — 스키마는 JPA가 반영 (운영 전 Flyway로 전환, `decision-log.md` ADR-005)

`application.yml`은 공통 설정만 포함하며, DB URL·비밀번호는 example 파일 또는 env에 둔다.

### 9.2 Docker MySQL 기본값

| 항목 | 값 |
|------|-----|
| Compose 파일 | `docker-compose.local.yml` (저장소 루트) |
| 컨테이너명 | `herfree-mysql` |
| DB | `herfree_db` |
| 사용자 / 비밀번호 | `herfree_user` / `herfree_pass` |
| root 비밀번호 | `root_pass` (로컬 전용) |
| 포트 | `3306:3306` |
| charset | `utf8mb4` / `utf8mb4_unicode_ci` |
| timezone | `Asia/Seoul` |
| volume | `herfree_mysql_data` |

### 9.3 운영(prod) DB

- **AWS RDS MySQL 8** — EC2 Spring 컨테이너가 private SG로 3306 접속
- 자격증명은 **환경 변수** 또는 Secrets Manager (`SPRING_DATASOURCE_*`, `JWT_SECRET`)
- `application-prod.yml.example` 참고 — 실제 `application-prod.yml`은 git에 포함하지 않음
- `ddl-auto: validate` + Flyway migration

### 9.4 포트 3306 충돌

Windows·macOS에서 **이미 호스트 MySQL·MariaDB·다른 Docker 컨테이너가 3306을 사용 중**이면 Compose 기동이 실패한다.

| 증상 | 조치 |
|------|------|
| `Bind for 0.0.0.0:3306 failed` | 기존 DB 서비스 중지 또는 Compose에서 `"3307:3306"` 등으로 호스트 포트 변경 |
| JDBC URL 변경 | `jdbc:mysql://localhost:3307/herfree_db?...` 로 `application-local.yml`만 수정 (파일은 git 제외) |

운영 RDS는 EC2 보안 그룹 내부 3306만 개방하므로 로컬 충돌과 무관하다.

---

## 10. 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-06-03 | EC2·Vercel·RDS·GitHub Actions CI/CD 운영 문서 |
| 2026-06-03 | 로컬 compose 루트 통합, MySQL start/stop/logs, Spring local·RDS env 가이드 |
