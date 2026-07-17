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

## 8. 최초 staging 공개 전 남은 수동 작업

- [ ] Gabia DNS: `api-staging.herpfree.co.kr` A 레코드를 `3.37.78.234`로 설정
- [ ] staging 프론트 호스팅을 만들고 `staging.herpfree.co.kr` 연결
- [ ] DNS 적용 후 EC2에서 Let's Encrypt 인증서 발급
- [ ] `herpfree3@gmail.com`의 AWS SES 인증 메일 승인
- [ ] OAuth Dev 콘솔 3곳에 `https://staging.herpfree.co.kr/auth/callback/{provider}` 추가
- [ ] GitHub Actions staging 배포와 전체 E2E 통과
- [ ] 자동 백업을 임시 RDS로 복원하는 연습

production은 이 목록과 `go-live-checklist.md`의 NO-GO 항목을 모두 통과한 뒤 별도로 만든다.
