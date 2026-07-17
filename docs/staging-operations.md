# Herfree staging 운영 가이드

기준일: 2026-07-17
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
| Amplify | `herfree-staging` / `d2bcg3vnlv5hkh` | Next.js `WEB_COMPUTE`, Basic Auth 필수 |
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

- [ ] Gabia DNS: `api-staging.herpfree.co.kr` A 레코드를 `3.37.78.234`로 설정
- [x] Amplify `herfree-staging` 앱 생성, Next.js 빌드 설정, Basic Auth 적용
- [ ] Amplify 앱에서 GitHub 저장소 `jeffyun3061/herfree-platform`과 `develop` 브랜치 연결
- [ ] Amplify에 `staging.herpfree.co.kr` 사용자 지정 도메인을 추가하고 안내된 CNAME을 Gabia DNS에 설정
- [ ] DNS 적용 후 EC2에서 Let's Encrypt 인증서 발급
- [ ] `herpfree3@gmail.com`의 AWS SES 인증 메일 승인 (현재 `Pending`)
- [ ] OAuth Dev 콘솔 3곳에 `https://staging.herpfree.co.kr/auth/callback/{provider}` 추가
- [x] GitHub Actions가 백엔드 이미지 빌드·취약점 검사·ECR push·EC2 health 배포까지 통과
- [x] GitHub staging Environment에 Amplify Basic Auth의 `E2E_HTTP_USERNAME`, `E2E_HTTP_PASSWORD` 등록
- [x] EC2 IMDSv2 `required`, hop limit 2를 적용하고 컨테이너의 S3 instance role 접근 및 startup check 성공 확인
- [ ] DNS·프론트 연결 후 GitHub Actions 전체 E2E 통과 및 `staging-passed-<SHA>` 생성
- [ ] 자동 백업을 임시 RDS로 복원하는 연습

### Amplify GitHub 최초 연결

이 작업만 GitHub App 권한 승인이 필요하므로 AWS 콘솔에서 한 번 수행한다.

1. AWS Amplify의 `herfree-staging` 앱을 연다.
2. `Connect branch`에서 GitHub를 선택하고 `jeffyun3061/herfree-platform` 저장소 접근을 승인한다.
3. 브랜치는 `develop`만 선택한다. `main`은 production 검증 전 연결하지 않는다.
4. 저장소 루트가 아니라 monorepo 설정의 `appRoot=frontend`가 유지되는지 확인한다.
5. 연결 후 이 문서의 상태 확인 스크립트를 다시 실행한다.

### DNS 입력 순서

1. Gabia에 A 레코드 `api-staging` → `3.37.78.234`를 추가한다.
2. Amplify 사용자 지정 도메인에서 `staging.herpfree.co.kr`을 추가한다.
3. Amplify가 보여 주는 인증·호스팅 CNAME을 그대로 Gabia에 입력한다.
4. DNS가 확인된 뒤 API TLS 인증서를 발급한다. DNS 적용 전에 인증서 발급을 반복하지 않는다.

현재 `api-staging.herpfree.co.kr`과 `staging.herpfree.co.kr`은 아직 해석되지 않는다. 따라서 최근 Actions의 E2E 실패는 애플리케이션 오류가 아니라 DNS 미설정 결과다.

production은 이 목록과 `go-live-checklist.md`의 NO-GO 항목을 모두 통과한 뒤 별도로 만든다.
