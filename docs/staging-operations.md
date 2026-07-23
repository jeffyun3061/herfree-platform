# Herfree staging 운영 가이드

기준일: 2026-07-21
대상: AWS Seoul (`ap-northeast-2`), 계정 `439777528445`

이 문서는 staging을 배포·중지·복구할 때 사용하는 운영 기준이다. 리소스 ID와 ARN은 식별자이며 비밀번호가 아니지만, 외부 문서에는 불필요하게 공개하지 않는다.

## 1. 현재 리소스

| 구분 | 이름 또는 ID | 운영 기준 |
| --- | --- | --- |
| EC2 | `herfree-staging-api` / `i-02cf5b8f3a7aa32da` | `t3.micro`, 16GB 암호화 gp3, 1GB swap |
| 고정 IP | `3.37.78.234` | `api-staging.herpfree.co.kr` A 레코드 대상 |
| API SG | `sg-0375887f3e16abf82` | 80/443만 공개, SSH 22 미개방 |
| RDS | `herfree-staging-mysql` | MySQL 8.0.46, `db.t4g.micro`, 20GB gp3 |
| RDS SG | `sg-0b9fb633cccc74303` | API SG에서 오는 3306만 허용 |
| S3 | `herfree-staging-uploads-439777528445-ap-northeast-2-an` | Public access block, API instance role만 객체 접근 |
| ECR | `herfree-api` | push scan, 미태그 이미지 7일 후 삭제, 최신 50개 보관 |
| Amplify | `herfree-staging` / `d2bcg3vnlv5hkh` | Next.js `WEB_COMPUTE`, Basic Auth 필수. **기본 URL:** `https://develop.d2bcg3vnlv5hkh.amplifyapp.com` |
| API 로그 | `/herfree/staging/api` | CloudWatch 30일 보존 |
| RDS 오류 로그 | `/aws/rds/instance/herfree-staging-mysql/error` | CloudWatch 30일 보존 |
| EC2 role | `herfree-staging-ec2` | SSM, ECR pull, staging S3·secret·로그 최소 권한 |
| GitHub role | `herfree-github-staging-deploy` | 해당 저장소의 staging Environment만 assume 가능 |

## 2. 비밀정보 구조

Secrets Manager에는 다음 세 secret이 있다.

| 이름 | 내용 | 교체 시 영향 |
| --- | --- | --- |
| `herfree/staging/app-config` | JWT, 분석 salt, OAuth, URL, S3·로그 설정 | API 재배포 필요 |
| `herfree/staging/db-app` | 앱 전용 DB 사용자와 비밀번호 | DB 사용자 비밀번호 동기화 후 재배포 |
| `herfree/staging/smtp` | SES SMTP 사용자와 비밀번호 | API 재배포 필요 |
| `herfree/staging/frontend-basic-auth` | Amplify staging 접근 보호 | Amplify와 GitHub Environment 값을 함께 교체 |

RDS master 비밀번호는 RDS 관리형 secret에 있고 앱이 사용하지 않는다. 원문 secret을 GitHub, Git, 문서, 채팅, SSM command 문자열에 넣지 않는다.

EC2의 `/opt/herfree/config/.env.staging`은 `render-release-env.sh`가 세 secret을 합쳐 생성하며 권한은 `600`이다. 값을 수정하려고 서버 파일을 직접 편집하지 않는다. Secrets Manager 값을 바꾼 뒤 staging Actions를 다시 실행한다.

## 3. Git과 배포 흐름

1. `feature/*`, `fix/*`, `chore/*` 브랜치에서 작업한다.
2. `develop` 대상 PR을 만들고 `secret-scan`, `backend`, `frontend` CI를 통과시킨다.
3. squash merge 후 `Release backend`를 `target=staging`으로 실행한다.
4. Actions가 이미지를 빌드·검사해 ECR에 올리고 SSM으로 EC2에 배포한다.
5. EC2는 최대 5분 동안 health를 확인한다. 실패하면 상태 파일에 기록된 마지막 정상 이미지로만 자동 rollback한다.
6. staging 사용자 흐름을 통과한 후에만 `develop`에서 `main`으로 PR을 만든다.
7. production은 `main`과 본인 Environment 승인, `staging-passed-<SHA>` 이미지가 모두 필요하다.

운영 서버에서 `git pull`, 소스 수정, 직접 JAR 실행을 하지 않는다.

## 4. 평소 확인

먼저 저장소 루트에서 아래 명령을 실행한다. AWS·GitHub·DNS·SES·Amplify 상태와 최근 배포를 확인하되 secret 값은 출력하지 않는다.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-staging-status.ps1
```

CI나 점검표에서 미완료 상태를 실패 코드로 받아야 할 때만 `-Strict`를 붙인다.

매일:

- GitHub Actions 최근 staging 배포 성공 여부
- CloudWatch `/herfree/staging/api`의 5xx와 반복 예외
- EC2 상태 검사와 RDS `available` 상태
- 문의·로그인·이미지 업로드 실패 급증

매주:

- RDS 자동 백업과 최신 복구 가능 시각
- ECR 오래된 이미지 정리 상태
- EC2 디스크 사용률과 RDS 여유 저장공간
- Dependabot·CodeQL·CI 실패

매월:

- 최신 RDS 백업을 임시 DB로 복원하는 연습
- 사용하지 않는 IAM access key·GitHub secret·OAuth 키 회수
- 로그에 이메일·토큰·건강 기록 원문이 없는지 표본 확인
- 실제 지출과 예산 알림 확인

## 5. 비용 관리

- staging을 며칠 사용하지 않으면 EC2와 RDS를 중지할 수 있다.
- RDS는 중지 후 최대 7일이 지나면 AWS가 자동으로 다시 시작할 수 있다.
- 중지 중에도 EBS, RDS 저장소, snapshot, Elastic IP 같은 저장·주소 비용은 남을 수 있다.
- ECR은 미태그 7일·최신 50개 정책으로 무한 증가를 막는다.
- 로그는 30일 뒤 자동 삭제한다.
- staging에는 Multi-AZ, ALB, NAT Gateway, 읽기 복제본, 고급 모니터링을 사용하지 않는다.

중지:

```powershell
aws ec2 stop-instances --profile herfree-staging --region ap-northeast-2 --instance-ids i-02cf5b8f3a7aa32da
aws rds stop-db-instance --profile herfree-staging --region ap-northeast-2 --db-instance-identifier herfree-staging-mysql
```

시작:

```powershell
aws rds start-db-instance --profile herfree-staging --region ap-northeast-2 --db-instance-identifier herfree-staging-mysql
aws ec2 start-instances --profile herfree-staging --region ap-northeast-2 --instance-ids i-02cf5b8f3a7aa32da
```

## 6. 배포 전 DB snapshot

Flyway migration, 대량 UPDATE, 컬럼 변경 전에는 수동 snapshot을 만든다.

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
aws rds create-db-snapshot `
  --profile herfree-staging `
  --region ap-northeast-2 `
  --db-instance-identifier herfree-staging-mysql `
  --db-snapshot-identifier "herfree-staging-before-deploy-$stamp"
```

현재 AWS Free plan 제한으로 staging 자동 백업은 1일이다. production은 Paid plan에서 별도 RDS를 만들고 최소 7일로 설정한다.

## 7. 장애와 rollback

1. GitHub Actions의 SSM command 출력과 CloudWatch request ID를 확인한다.
2. 로그인, 비공개 정보 노출, migration 실패, 지속적인 5xx면 즉시 rollback한다.
3. 이미지 문제는 `rollback-release.sh` 또는 직전 ECR 이미지로 되돌린다.
4. DB migration은 이미지 rollback으로 취소되지 않는다. 데이터 손상이 있으면 신규 쓰기를 멈추고 snapshot/PITR 복원을 검토한다.
5. secret 유출이면 새 값을 발급하고 이전 값을 폐기한 뒤 재배포한다.

## 8. 최초 staging 공개 전 남은 작업

### 프론트 URL 정책 (2026-07-21)

커스텀 도메인 `staging.herpfree.co.kr` 연결은 Amplify SSL·CloudFront CNAME 충돌로 **일시 보류**한다.
staging 검증·E2E·OAuth는 **Amplify 기본 URL**을 canonical로 사용한다.

| 구분 | URL | 상태 |
| --- | --- | --- |
| **프론트 (staging)** | `https://develop.d2bcg3vnlv5hkh.amplifyapp.com` | 사용 |
| API (staging) | `http://api-staging.herpfree.co.kr` | Gabia A → `3.37.78.234`, Docker `:80` 직접 |
| 프론트 커스텀 | `https://staging.herpfree.co.kr` | **보류** — DNS 리셋 후 재연결 (§9) |

GitHub staging Environment·Secrets Manager `app-config`·OAuth Dev 콘솔·CORS는 위 **프론트 기본 URL** 기준으로 맞춘다.

- [ ] Gabia DNS: `api-staging` A → `3.37.78.234` (유지)
- [x] Amplify `herfree-staging` 앱 생성, Next.js 빌드 설정, Basic Auth 적용
- [ ] Amplify GitHub `develop` 브랜치 연결 (§8.1)
- [ ] **커스텀 도메인:** Amplify에서 제거·Gabia 정리 완료 (§9) — **재추가 전까지 보류**
- [ ] Secrets / CORS / OAuth를 `develop.d2bcg3vnlv5hkh.amplifyapp.com` 기준으로 반영
- [ ] `herpfree3@gmail.com` AWS SES 인증 메일 승인
- [ ] OAuth Dev 3곳: `https://develop.d2bcg3vnlv5hkh.amplifyapp.com/auth/callback/{provider}`
- [x] GitHub Actions 백엔드 ECR push·EC2 health 배포
- [x] GitHub staging Environment `E2E_HTTP_USERNAME` / `E2E_HTTP_PASSWORD`
- [x] EC2 IMDSv2·S3 instance role startup check
- [ ] Amplify 기본 URL + API HTTP 연결 후 release smoke 통과 및 `staging-passed-<SHA>`
- [ ] RDS snapshot 복원 연습

### 8.1 Amplify GitHub 최초 연결

이 작업만 GitHub App 권한 승인이 필요하므로 AWS 콘솔에서 한 번 수행한다.

1. AWS Amplify의 `herfree-staging` 앱을 연다.
2. `Connect branch`에서 GitHub를 선택하고 `jeffyun3061/herfree-platform` 저장소 접근을 승인한다.
3. 브랜치는 `develop`만 선택한다. `main`은 production 검증 전 연결하지 않는다.
4. 저장소 루트가 아니라 monorepo 설정의 `appRoot=frontend`가 유지되는지 확인한다.
5. 연결 후 `scripts/check-staging-status.ps1`을 다시 실행한다.

### 8.2 API DNS·배포 (가비아 + Docker)

staging API는 **nginx 없이** EC2에서 Docker가 **80번 포트**로 Spring Boot를 직접 노출한다.
Amplify(프론트)는 서버 사이드에서 `http://api-staging.herpfree.co.kr` 로 프록시한다.

1. A 레코드 `api-staging` → `3.37.78.234` 유지
2. `Release backend` (staging)가 `deploy-release.sh`로 컨테이너를 `:80`에 올린다
3. 확인: `http://api-staging.herpfree.co.kr/api/health` → 200

production은 별도로 ALB+ACM 또는 nginx+TLS를 쓴다 (`infra/nginx/herfree.conf` 참고).

---

## 9. Amplify 커스텀 도메인 — DNS 리셋 (2026-07-21)

### 지금 따라하기 (순서 고정)

아래는 **지금 당장** 할 일이다. 한 단계 끝날 때까지 다음 단계로 넘어가지 않는다.

| # | 누가 | 할 일 | 완료 기준 |
| --- | --- | --- | --- |
| **0** | 우리 | GitHub `STAGING_FRONTEND_URL` → amplifyapp.com | `gh variable list -e staging` 에 amplify URL |
| **1** | 우리 | Amplify **커스텀 도메인 제거** | 콘솔에 `herpfree.co.kr` 없음 |
| **2** | 의뢰인 | Gabia **삭제만** (§9.3 문구 전달) | `staging` CNAME·ACM `_0dc`/`_0de` 없음, `api-staging` A 유지 |
| **3** | 우리 | **24시간 대기** | Amplify 도메인 재추가·재시도 금지 |
| **4** | 우리 | Amplify **환경 변수** (develop) | `API_REWRITE_TARGET=http://api-staging.herpfree.co.kr`, `NEXT_PUBLIC_API_URL`은 비움, `NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN=https://develop.d2bcg3vnlv5hkh.amplifyapp.com` |
| **5** | 우리 | Secrets Manager + API 재배포 | 아래 스크립트 |
| **6** | 우리 | `Release backend` (staging) | `http://api-staging.herpfree.co.kr/api/health` → 200 |
| **7** | 의뢰인 | SES 인증 메일 클릭 | SES `Success` |
| **8** | 우리 | OAuth Dev redirect 3곳 추가 | amplify URL callback |
| **9** | 우리 | Release backend (staging) + smoke E2E | Actions success, `staging-passed-*` (mutation QA는 별도 job, 실패해도 release gate 아님) |

**로컬에서 자동/반자동:**

```powershell
# 상태 점검 (AWS는 먼저 로그인)
aws sso login --profile herfree-staging
powershell -ExecutionPolicy Bypass -File scripts/check-staging-status.ps1

# GitHub URL + 안내 (Secrets는 -UpdateSecretsManager 로)
powershell -ExecutionPolicy Bypass -File scripts/apply-staging-amplify-url.ps1 -UpdateSecretsManager

# API 재배포
gh workflow run release-backend.yml -f target=staging
```

**브라우저 smoke (지금 가능):**  
`https://develop.d2bcg3vnlv5hkh.amplifyapp.com` — Basic Auth(Amplify 설정값) 입력 후 홈·로그인 화면 확인.

**E2E가 실패했던 이유:** GitHub `STAGING_FRONTEND_URL`이 `staging.herpfree.co.kr`(DNS 없음)을 가리켰음. amplify URL로 바꾸면 smoke는 통과 가능.

---

### 9.1 왜 꼬였는지

- Amplify **「재시도」** 를 DNS 전파 전·CNAME 불일치 상태에서 반복하면 CloudFront 주소(`d2…` / `d3…`)가 바뀐다.
- Gabia에 넣은 CNAME과 Amplify가 기대하는 배포가 어긋나 **「다른 CloudFront를 가리킨다」**, **「CNAME 전파 시간 초과」** 가 반복된다.
- Route 53 호스팅 영역은 **이 AWS 계정(439777528445)에 없음**. staging DNS는 **Gabia**에서 관리한다. Route 53 「시작하기」로 새 영역을 만들지 않는다 (이중 관리 방지).

### 9.2 지금 정책

1. **staging 프론트:** `https://develop.d2bcg3vnlv5hkh.amplifyapp.com` 만 사용.
2. **Amplify 커스텀 도메인:** 제거한 뒤 **24시간 이상** 재추가하지 않는다.
3. **의뢰인 DNS 요청:** §9.3 **삭제 1회**만. 새 CNAME 요청은 **DNS 권한 확보 후** (§9.6).

### 9.3 DNS 정리 — 의뢰인(Gabia) **마지막 1회**

아래만 **삭제**한다. **새 값을 넣지 않는다.**

| 호스트 | 조치 |
| --- | --- |
| `staging` | CNAME **삭제** |
| `_0dc192722679034dab370f00d2871bf8` | CNAME **삭제** (있으면) |
| `_0de192722679034dab370f00d2871bf8` | CNAME **삭제** (있으면) |
| `api-staging` | A → `3.37.78.234` **유지** |

**의뢰인 전달 문구 (복사용):**

> DNS 정리만 부탁드립니다. 새 레코드는 넣지 않아도 됩니다.  
> - `staging` CNAME 삭제  
> - `_0dc…` / `_0de…` 로 시작하는 ACM 검증 CNAME 삭제  
> - `api-staging` A(`3.37.78.234`)는 그대로 유지  
> 저장 후 알려 주세요.

### 9.4 AWS(우리) — Amplify 커스텀 도메인 제거

1. Amplify → `herfree-staging` → **호스팅** → **사용자 지정 도메인 관리**
2. `herpfree.co.kr` → **작업** → **도메인 제거**
3. **24시간** 동안 커스텀 도메인 **추가·재시도 금지**
4. develop 브랜치 배포·Basic Auth·`amplifyapp.com` URL은 **그대로** 사용

### 9.5 Secrets / OAuth / CORS (amplifyapp.com 기준)

staging Environment·Secrets Manager `herfree/staging/app-config` 에 반영할 값 예시:

| 항목 | 값 |
| --- | --- |
| 프론트 origin | `https://develop.d2bcg3vnlv5hkh.amplifyapp.com` |
| `CORS_ALLOWED_ORIGINS` | 위 origin (필요 시 API health 확인용 origin 추가) |
| `PASSWORD_RESET_FRONTEND_BASE_URL` | 위 origin |
| OAuth redirect | `https://develop.d2bcg3vnlv5hkh.amplifyapp.com/auth/callback/{kakao,google,naver}` |

변경 후 `Release backend` (staging)로 API를 재배포한다. Amplify는 `develop` push 시 자동 빌드.

### 9.6 나중에 `staging.herpfree.co.kr` 다시 쓸 때

의뢰인에게 **CNAME 수정을 반복 요청하지 않으려면** 아래 중 **한 번만** 선택한다.

| 방법 | 의뢰인 | 우리 |
| --- | --- | --- |
| **A. Gabia DNS 계정 공유/위임** | 1회 | 이후 CNAME 직접 수정 |
| **B. Route 53 + staging NS 위임** | Gabia에 NS 1회 | 이후 Route 53에서만 관리 |
| **C. 커스텀 도메인 없이 amplifyapp.com** | 0 | staging은 계속 기본 URL |

재연결 절차 (A 또는 B 확보 후):

1. Gabia(또는 Route 53)에 **아직** `staging` CNAME이 없는지 확인
2. Amplify → **도메인 추가** → `staging.herpfree.co.kr` only, 브랜치 `develop`
3. 화면의 **CNAME + ACM 검증** 값을 **복붙**으로 DNS에 반영 (타이핑 금지)
4. **30~60분** [dnschecker.org](https://dnschecker.org) 전파 확인
5. **「재시도」 연타 금지** — 활성화될 때까지 새로고침만. 1시간 후에도 실패면 **재시도 1번**

### 9.7 금지 (루프 재발 방지)

- DNS 맞추기 전·전파 전 Amplify **「재시도」** 연타
- 실패 상태에서 **도메인 삭제·재추가** 를 하루에 여러 번
- Gabia와 Route 53 **동시에** staging 레코드 유지
- 예전 스크린샷의 `d2g72…` / `d3dluo…` 등 **과거 CloudFront 값** 재사용

---

production은 §8과 `go-live-checklist.md`의 NO-GO 항목을 모두 통과한 뒤 별도로 만든다.
