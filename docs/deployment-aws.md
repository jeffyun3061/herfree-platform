# Herfree — AWS 배포 가이드

> **전제:** 프론트 UI 2차 통합 커밋 완료 후, **AWS 전체 스택**으로 런칭  
> **기존 문서:** [deployment.md](./deployment.md) (Vercel+VPS 1단계) · 본 문서는 **AWS 중심** 절차  
> **리전 권장:** `ap-northeast-2` (서울)

---

## 0. AWS 아키텍처 (권장 2안)

### A안 — 런칭 초기 (월 ~3~5만 원, 트래픽 일 400 이하)

```
[Browser]
    │
    ├─────────────────────────────┐
    ▼                             ▼
[Amplify — Next.js]          [S3 버킷]
  /api → API_REWRITE_TARGET     게시글 이미지
    │
    ▼ HTTPS api.도메인
[EC2 t3.small — Ubuntu]
  Nginx :443 → Docker Spring :8080 → Docker MySQL 8
  IAM Role → S3 PutObject (키 불필요)
```

- **프론트:** AWS Amplify Hosting (`frontend/`)
- **API+DB:** EC2 1대 + 기존 `docker-compose.prod.yml`
- **이미지:** S3 (`infra/aws/README.md`)

### B안 — 확장 (일 400+ 지속, 월 ~8~15만 원)

```
[Amplify] → [EC2 API only] → [RDS MySQL 8]
                ↓
           [S3 + CloudFront(선택)]
```

- **DB:** RDS로 분리 → `docker-compose.aws-api.yml` 사용
- **EC2:** API 컨테이너만, MySQL 컨테이너 제거

---

## 1. 배포 순서 (체크리스트)

| # | 단계 | 예상 | ☐ |
|---|------|------|---|
| 1 | AWS 계정·결제·IAM 사용자(또는 SSO) | 30분 | ☐ |
| 2 | **S3** 버킷 + IAM 정책 | 20분 | ☐ |
| 3 | **EC2** 생성 + 보안 그룹 + Elastic IP | 30분 | ☐ |
| 4 | EC2에 Docker·Nginx·앱 배포 | 1시간 | ☐ |
| 5 | **Route 53** + **ACM** SSL (`api.도메인`) | 30분 | ☐ |
| 6 | **Amplify** 프론트 연결 + env | 30분 | ☐ |
| 7 | SUPER_ADMIN 시드 + 스모크 테스트 | 30분 | ☐ |
| 8 | **타임존·시간 정책** 적용 (아래 §3.6) | 15분 | ☐ |
| 9 | **SMTP** 비밀번호 재설정 메일 (아래 §3.7) | 20분 | ☐ |
| 10 | (선택) RDS 전환 | 2시간 | ☐ |

**로컬 선행:** [launch-qa-checklist.md](./launch-qa-checklist.md) 완료 후 배포.

---

## 2. S3 (이미지)

`infra/aws/README.md` 그대로 진행.

| 항목 | prod 예시 |
|------|-----------|
| 버킷 | `herfree-prod-uploads` |
| 리전 | `ap-northeast-2` |
| IAM | `infra/aws/s3-iam-policy.json` → EC2 **인스턴스 역할**에 연결 (키 파일 불필요) |

`.env.prod`에서 `S3_ACCESS_KEY` / `S3_SECRET_KEY`는 **비워 두고** IAM Role 사용 권장.

---

## 3. EC2 (API + MySQL — A안)

### 3.1 인스턴스

| 항목 | 권장 |
|------|------|
| AMI | Ubuntu 22.04 LTS |
| 타입 | **t3.small** (2 vCPU, 2GB) — Spring+MySQL 최소 |
| 디스크 | 30GB gp3 |
| Elastic IP | 1개 고정 (도메인 연결용) |

### 3.2 보안 그룹

| 방향 | 포트 | 소스 | 용도 |
|------|------|------|------|
| Inbound | 22 | **내 IP만** | SSH |
| Inbound | 80 | 0.0.0.0/0 | HTTP → certbot/Nginx redirect |
| Inbound | 443 | 0.0.0.0/0 | HTTPS API |
| Inbound | 3306 | — | **열지 않음** (MySQL은 Docker 내부만) |
| Inbound | 8080 | — | **열지 않음** (127.0.0.1 바인딩) |

### 3.3 IAM 역할 (EC2)

EC2 생성 시 **IAM Role** 부여:

- `AmazonSSMManagedInstanceCore` (선택, Session Manager SSH 대체)
- 커스텀 정책: `infra/aws/s3-iam-policy.json` (버킷명 치환)

### 3.4 서버 초기 세팅

```bash
# EC2 SSH 접속 후
git clone https://github.com/YOUR_ORG/herfree-platform.git
cd herfree-platform
chmod +x infra/scripts/ec2-bootstrap.sh infra/scripts/deploy-vps.sh
./infra/scripts/ec2-bootstrap.sh
```

`.env.prod` 작성:

```bash
cp .env.prod.example .env.prod
# 편집: MYSQL_*, JWT_SECRET, CORS_ALLOWED_ORIGINS, S3_BUCKET
# CORS_ALLOWED_ORIGINS = Amplify production URL (예: https://main.xxxxx.amplifyapp.com)
# S3 키는 IAM Role 사용 시 비움
./infra/scripts/deploy-vps.sh
```

### 3.5 Nginx + SSL

```bash
sudo cp infra/nginx/herfree.conf /etc/nginx/sites-available/herfree-api
sudo ln -sf /etc/nginx/sites-available/herfree-api /etc/nginx/sites-enabled/
# server_name 을 api.실제도메인 으로 수정
sudo certbot --nginx -d api.실제도메인
sudo nginx -t && sudo systemctl reload nginx
```

헬스 확인: `curl -s https://api.실제도메인/actuator/health`

### 3.6 타임존·시간 정책 (필수)

Herfree는 **DB·API 타임스탬프는 UTC**, **운영자·일지 달력 날짜는 KST** 로 분리한다.

| 대상 | 설정 | 값 |
|------|------|-----|
| EC2 **호스트** (SSH·cron·로그 가독성) | `/etc/timezone` 또는 `timedatectl` | `Asia/Seoul` |
| API **Docker 컨테이너** | `TZ` + JVM | `UTC` (`-Duser.timezone=UTC`) |
| MySQL **컨테이너** (A안) | `TZ` | `UTC` |
| JDBC URL | `serverTimezone` | `UTC` |
| 개인일지 `record_date` | 앱 코드 `AppTimeZone.todayKst()` | KST 달력 날짜 (DB `DATE`) |

**EC2 호스트 KST 고정 (배포 직후 1회):**

```bash
sudo timedatectl set-timezone Asia/Seoul
timedatectl   # Time zone: Asia/Seoul 확인
```

**API·DB는 UTC** — `docker-compose.prod.yml` / `docker-compose.aws-api.yml` / `.env.prod` 에 이미 반영됨.  
기존 DB가 KST 벽시계로 쌓였다면 Flyway `V27__migrate_timestamps_to_utc.sql` 이 자동 적용된다. **배포 전 mysqldump 백업 필수.**

API 응답 `createdAt` 등은 ISO-8601 UTC (`…Z`) — 프론트는 브라우저 로컬(KST)로 표시.

### 3.7 SMTP (비밀번호 재설정, 필수)

운영에서 `APP_MAIL_MODE=console` 이면 재설정 URL이 **서버 로그에 평문**으로 남는다. 반드시 SMTP를 설정한다.

| 환경변수 | 예시 (AWS SES SMTP) |
|----------|---------------------|
| `APP_MAIL_MODE` | `smtp` |
| `APP_MAIL_FROM` | `noreply@herfree.kr` (SES에서 검증된 발신 주소) |
| `SPRING_MAIL_HOST` | `email-smtp.ap-northeast-2.amazonaws.com` |
| `SPRING_MAIL_PORT` | `587` |
| `SPRING_MAIL_USERNAME` | SES SMTP 사용자 |
| `SPRING_MAIL_PASSWORD` | SES SMTP 비밀번호 |
| `PASSWORD_RESET_FRONTEND_BASE_URL` | `https://www.herfree.kr` (Amplify/Vercel 프로덕션 URL) |

`.env.prod` 에 값을 채운 뒤 `docker compose` 재기동. 배포 후 **비밀번호 찾기** 1회로 실제 수신을 확인한다.

---

## 4. Amplify (프론트)

| 설정 | 값 |
|------|-----|
| Repository | GitHub `herfree-platform` |
| Branch | `main` |
| Root directory | `frontend` |
| Build | `npm ci && npm run build` |
| Node | 20 |

**Environment variables (Production):**

| 변수 | 값 |
|------|-----|
| `API_REWRITE_TARGET` | `https://api.실제도메인` (끝 `/` 없음) |
| `NEXT_PUBLIC_API_URL` | **비움** |

배포 후 Amplify URL을 EC2 `.env.prod`의 `CORS_ALLOWED_ORIGINS`에 추가하고 API 재기동:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

커스텀 도메인(`www.도메인`)은 Amplify → Domain management + Route 53.

---

## 5. RDS 전환 (B안, 선택)

1. RDS MySQL 8.0 생성 (`utf8mb4_unicode_ci`)
2. 보안 그룹: **EC2 SG → RDS 3306** 만 허용
3. `.env.prod`에 JDBC URL 추가:

```env
SPRING_DATASOURCE_URL=jdbc:mysql://herfree.xxxxx.ap-northeast-2.rds.amazonaws.com:3306/herfree_db?serverTimezone=UTC&characterEncoding=UTF-8
SPRING_DATASOURCE_USERNAME=herfree_user
SPRING_DATASOURCE_PASSWORD=...
```

4. API만 기동:

```bash
docker compose -f docker-compose.aws-api.yml --env-file .env.prod up -d --build
```

5. Flyway migration은 API 기동 시 자동 적용. **배포 전 mysqldump 백업 필수.**

---

## 6. 운영자 계정

운영에서 `ADMIN_BOOTSTRAP_ENABLED=false` (**필수**).

최초 SUPER_ADMIN: [admin-setup.md](./admin-setup.md) — SQL 시드 또는 1회 bootstrap 후 즉시 `false`.

```bash
# EC2에서 MySQL 컨테이너 접속 예시 (A안)
docker exec -it herfree-mysql-prod mysql -uherfree_user -p herfree_db
# infra/scripts/promote-admin.sql 참고
```

---

## 7. 배포 후 스모크 (5분)

[ops-security-checklist.md](./ops-security-checklist.md) §3 + [deployment.md](./deployment.md) §9 Go/No-Go.

| # | 테스트 | 기대 |
|---|--------|------|
| 1 | Amplify `/` | 200, 비로그인 홈 |
| 2 | Amplify `/login` → 로그인 | 200 + 토큰 |
| 3 | `/api/users/me` (Amplify 경유) | 200 |
| 4 | 커뮤니티 이미지 글 작성 | S3 URL 저장 |
| 5 | `/admin` SUPER_ADMIN | 접속 |
| 6 | `GET https://api.../actuator/health` | 200 |

---

## 8. CI/CD (선택)

현재: `.github/workflows/ci.yml` — test + build만.

| 구성요소 | 1차 | 확장 |
|----------|-----|------|
| Frontend | Amplify Git 연동 (push → auto deploy) | — |
| Backend | EC2 SSH + `deploy-vps.sh` | GitHub Actions → SSM Run Command |
| DB backup | `infra/scripts/backup-db.sh` cron | S3 업로드 추가 |

---

## 9. 비용 가이드 (서울 리전, 대략)

| A안 (런칭) | 월 |
|------------|-----|
| EC2 t3.small | ~2.5만 원 |
| Elastic IP (연결 시) | ~0.5만 원 |
| Amplify (빌드+호스팅 소량) | ~0~1만 원 |
| S3 + 전송 소량 | ~0.5만 원 |
| Route 53 hosted zone | ~0.7만 원 |
| **합계** | **~3~5만 원** |

| B안 (+ RDS) | 월 |
|-------------|-----|
| 위 + db.t4g.micro RDS | +~2~3만 원 |

---

## 10. Vercel 대신 Amplify를 쓰는 이유 (AWS 통합)

- 같은 AWS 계정·빌링·IAM 체계
- Next.js SSR/App Router 공식 지원
- `API_REWRITE_TARGET` 패턴은 Vercel과 **동일** (`frontend/src/app/api/[...path]/route.ts`)
- 기존 `docker-compose.prod.yml`·Nginx·S3 설정 **재사용**

---

## 11. 관련 파일

| 파일 | 용도 |
|------|------|
| `docker-compose.prod.yml` | EC2 — API + MySQL (A안) |
| `docker-compose.aws-api.yml` | EC2 — API only + RDS (B안) |
| `.env.prod.example` | 운영 env 템플릿 |
| `infra/scripts/ec2-bootstrap.sh` | EC2 Docker·Nginx 초기 설치 |
| `infra/scripts/deploy-vps.sh` | API 컨테이너 빌드·기동 |
| `infra/nginx/herfree.conf` | API 역프록시 |
| `infra/aws/README.md` | S3·IAM |

---

## 12. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-10 | §3.7 SMTP 체크리스트, 탈퇴 시 일지 삭제·S3 IAM Role 업로드 정책 반영 |
| 2026-07-10 | §3.6 타임존 정책 추가 (EC2 KST, API·DB UTC), 체크리스트 #8 |
| 2026-07-09 | AWS 배포 가이드 초안 (Amplify + EC2 + S3, RDS 선택) |
