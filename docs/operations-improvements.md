# 헤르프리 AWS 비용·보안·관리 개선 실행서

2026-10-11 코드 기준. 이 변경은 AWS 적용·운영 배포 완료 증적이 아니다. 실제 AWS 상태와
청구액은 연결된 운영자 계정으로 아래 점검을 수행해 새로 기록한다. EC2 크기, 스테이징/IP,
6시간 백업, 기존 보관·로그 기준은 유지한다. 기존 RDS 생성 스크립트로 재구축하지 않는다.

## 담당과 완료 기록

운영 책임자는 관리자 등록/기기 분실 시 본인 확인, 역할 승인, 신고·문의 대응과 연락처를
관리한다. 개발 담당자는 배포, 장애 대응, 백업·복원, 비용 측정과 기술 증적을 관리한다.
각 작업 기록에 담당자 실명, 시간, 변경/백업/이미지 ID, 결과, 실패·복구 시간을 남긴다.
실제 담당자·기존 알림 수신 주소는 운영 책임자가 운영 기록에 채운다.

## 1. AWS 최신 점검과 비용 기준선

```bash
mkdir -p artifacts/aws-operations
python3 infra/scripts/aws-cost-controls.py --region ap-northeast-2 audit \
  --output artifacts/aws-operations/before.json --backup-bucket "$DB_BACKUP_S3_BUCKET"
```

조회 실패 항목이 있으면 성공으로 기록하지 않는다. 서비스별 최근 30일 비용은 Cost
Explorer의 미확정 추정치를 포함할 수 있으므로 Billing 청구서와 함께 비교한다.
콘솔에서 Basic support 유지, root·콘솔 운영자 MFA, IAM 최소 권한, EC2 종료 방지,
공개 보안그룹(3306 차단), 중지된 스테이징, S3 공개 차단/암호화·보관 규칙, DLM
일일 EBS 스냅샷 7개, SNS 이메일 구독 확인 상태와 실제 알림 도달을 기록한다.
SSM으로 연결 성공을 확인한 후 공개 SSH 규칙을 제한한다. 이 도구는 SSH 규칙을 추측해서
삭제하지 않는다. SSM 확인 전 접근 경로를 끊지 않는다.

기존 SNS topic을 사용한다. 예산은 지출 차단이나 인스턴스 중지 동작을 추가하지 않는다.

```bash
python3 infra/scripts/aws-cost-controls.py --region ap-northeast-2 budget \
  --topic "$OPERATIONS_SNS_TOPIC_ARN"
```

월 $50, 실제 비용 80%·100%, 예상 비용 100% 알림을 설정하고 SNS 게시 권한은
해당 AWS 계정의 Budgets 서비스에만 추가한다. 기존 topic policy를 보존한다.
[AWS Budgets SNS 설정](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-sns-policy.html)

30일 뒤 같은 audit를 `after.json`으로 실행한다. 서비스별 사용량, 세금·환율, 일수,
일회성 배포/복구훈련 비용을 구분해서 비교한다. 메모리 p95/최대, CPU, swap, DB 지연,
디스크 추이를 먼저 확보하고 `t3.small` 축소를 결정한다. 추가 custom metrics/alarms,
복구 secret 2개, 훈련 중 EBS/EC2 비용은 절감액과 함께 평가한다. 절감액을 보장하지 않는다.

## 2. MFA 키와 최초 등록 준비

키 준비는 신뢰된 운영자 계정으로 실행한다. 일반 스테이징 역할에는 운영 secret을 읽을
권한을 추가하지 않는다. 기존 app-config/db-app 값을 보존하며 MFA 키가 없을 때만
독립적인 32-byte 키를 만든다. 건강정보 키를 교체하지 않는다.

```bash
CONFIRM_MFA_KEY_PREPARATION=YES bash infra/scripts/prepare-mfa-recovery-keys.sh staging
CONFIRM_MFA_KEY_PREPARATION=YES bash infra/scripts/prepare-mfa-recovery-keys.sh production
```

각 환경의 app-config `adminMfaEncryptionKey`와 복구 전용
`herfree/{environment}/health-data-recovery`가 생긴다. 복구 secret은 건강정보/MFA 키와
DB 이름만 포함한다. 기존 recovery secret과 다른 키를 발견하면 회전을 거부한다.
비밀 값은 콘솔·SSM·Git·CI artifact에 남기지 않는다. 준비 전 새 서버는 public profile로
기동할 수 없으므로 키·IAM 준비가 배포보다 먼저다.

추가 IAM 정책은 실제 계정/버킷/이미지 저장소/기존 staging role 이름으로 렌더링한다.

```bash
python3 infra/scripts/render-operations-iam.py --account "$AWS_ACCOUNT_ID" \
  --region ap-northeast-2 --bucket "$DB_BACKUP_S3_BUCKET" --repository "$ECR_REPOSITORY" \
  --staging-id "$STAGING_INSTANCE_ID" --staging-role "$STAGING_ROLE_NAME" \
  --restore-role herfree-restore-drill --output-dir artifacts/aws-operations/iam
```

검토 후 `production-operations-addition.json`을 기존 운영 EC2 role에 **추가**한다.
기존 S3 백업/CloudWatch/SSM 정책을 덮어쓰지 않는다. 복구용 role·instance profile을
생성해 `ec2-trust.json`, `restore-instance.json`과 `AmazonSSMManagedInstanceCore`를
적용한다. 별도 GitHub OIDC 운영 role에는 `restore-workflow.json`을 적용하고 trust를
이 저장소의 `environment:production` subject에 제한한다. KMS customer key를 쓰는
secret/bucket이라면 해당 키의 필요한 decrypt 권한만 별도로 추가한다.

독립적인 본인 확인이 끝난 관리자 계정마다 대상 서버에서 등록 승인을 만든다.

```bash
sudo env DEPLOY_ENV=staging CONFIRM_MFA_IDENTITY_VERIFIED=YES \
  /opt/herfree/infra/scripts/approve-admin-mfa-enrollment.sh "$VERIFIED_ADMIN_USER_ID"
```

15분 일회용 승인 코드는 owner-only 파일에 저장된다. 운영 책임자가 안전한 경로로 전달하고
파일을 지운다. `/admin`에서 인증앱에 표시된 키를 등록한 후 6자리 번호로 확인한다.
복구 코드 8개는 한 번만 표시되고 DB에는 해시만 남는다. 분실 시 복구 코드로 인증하거나
같은 본인 확인·승인 절차로 재등록한다. 운영에서는 `DEPLOY_ENV=production`을 사용한다.

MFA가 필요한 역할은 MODERATOR/ADMIN/SUPER_ADMIN/DOCTOR/CREATOR다. 실제 endpoint의
기존 권한은 유지한다. 15분 뒤 재인증하며 동일 TOTP/복구 코드 재사용을 막고 5회 실패 시
15분 잠근다. 로그인 변경·비밀번호 변경·역할 변경·정지·로그아웃은 기존 MFA 증명을
무효화한다. 미등록자는 등록/인증·복구 경로만 사용하고 관리 API는 차단된다.

## 3. 스테이징 검증과 배포

1. 기존 staging을 가동하고 frontend/backend를 같은 변경으로 배포한다. MFA 승인 코드를
   준비해 관리자 등록, 인증, 기기 분실 복구, 15분 만료, 번호 재사용, 반복 실패를 확인한다.
2. 일반 회원·의사 계정의 역할별 401/403, 권한 변경 후 기존 로그인 폐기, CSRF, MFA 쿠키
   HttpOnly/Secure/Strict와 JSON에서 MFA token이 제거되는지 확인한다.
3. 회원가입·로그인/OAuth·일지·게시글·관리자 흐름을 확인하고 staging을 중지한다.
4. production 배포 전 `backup-db.sh predeploy`가 완료된 S3 dump/checksum/metadata와
   직전 정상 immutable image를 기록한다. 배포 후 같은 핵심 흐름을 다시 확인한다.
5. 실패 시 기존 `deploy-release.sh ... rollback` 절차로 직전 정상 이미지를 복구한다.
   V43은 추가 테이블만 만든다. 이전 서버로 돌아가면 이전 MFA 보호 수준으로 돌아가므로
   관리 기능 노출을 제한하고 수정 배포할 때까지 운영 책임자에게 그 상태를 기록한다.

## 4. 모니터링과 월간 격리 복원

운영 API 배포와 첫 성공 백업 후 아래를 적용한다. 기존 백업 주기는 6시간이고 빈번 8일,
일일 32일, 배포 전/수동 15일, DLM snapshot 7개를 유지한다. 새 백업 metadata는 업로드
완료 후 생성되며 복구 secret version과 보수적인 백업 시작 시각을 기록한다.

```bash
sudo env CONFIRM_LOCAL_DB_OPS_INSTALL=YES /opt/herfree/infra/scripts/install-local-db-ops.sh
OPERATIONS_SNS_TOPIC_ARN="$OPERATIONS_SNS_TOPIC_ARN" PRODUCTION_INSTANCE_ID="$PRODUCTION_INSTANCE_ID" \
  bash infra/scripts/setup-operations-alarms.sh
```

메모리/루트·DB 디스크 80% 이상 15분, 외부 HTTPS 실패, DB 상태·백업 지연,
복구 실패/35일 미실행, 지표 중단을 알린다. 기존 SNS로 alarm/OK를 연결한다.
HTTPS는 운영 서버에서 실제 공개 frontend HTTPS를 요청하며 같은 서버 장애는 EC2
StatusCheckFailed/지표 중단으로 감지한다. 독립 지역의 완전한 외부 감시 서비스는 아니다.
수신자와 정한 점검 시간에 알람 상태 테스트·지표 수집 중단·백업 실패·HTTPS 실패를
재현하고 이메일 도달/복구를 기록한다. 위험한 운영 DB 장애를 고의로 만들지 않는다.

GitHub production 환경에 `AWS_OPERATIONS_ROLE_ARN` secret, `RESTORE_STAGING_INSTANCE_ID`,
`RESTORE_INSTANCE_PROFILE_ARN`, `RESTORE_API_IMAGE`(이 변경이 포함된 staging-tested digest),
`DB_BACKUP_S3_BUCKET`, `AWS_REGION` variables를 설정한다. 첫 수동 `Monthly staging restore
drill` 성공 후 매월 1일 04:30 UTC 예약 실행을 사용한다. 환경 승인 규칙이 있는 경우 월간
작업이 승인 대기로 남지 않도록 실제 운영 정책을 확인한다. backend staging 배포와 같은
GitHub concurrency group을 사용하므로 두 작업이 겹치지 않는다. 수동 SSM/Compose 작업도
훈련 시간에는 시작하지 않는다.

복원은 stopped staging만 허용하며 생산 instance/tag나 가동 중인 staging을 거부한다.
일반 staging role로 먼저 기동해 staging 앱을 중지한 후 제한된 복구용 IAM profile을
일시 연결한다. STS로 복구 role 활성화를 확인하고 새 암호화 EBS 10 GiB를 생성한다. NVMe serial로
새 volume ID를 확인한 후 그 디스크만 포맷한다. DB/검증 API는 외부 포트 없는 내부
Docker network에서 실행하며 운영/기존 staging DB를 덮어쓰지 않는다. Flyway 이력·테이블,
평문 메모 잔존, 실제 건강정보/MFA 복호화, 암호화 write/read rollback을 검증한다.
운영 데이터·키·SQL 오류를 CI 로그에 출력하지 않는다.

성공/실패 메타데이터는 private S3 `operations/production/restore-drill/`에 저장한다.
기동을 포함한 검증 시간 4시간, 시작 시점과 백업 시점 차이 6시간 이내를 목표로 검사한다.
백업 실패가 지속되면 RPO는 커질 수 있다. 복원 DB 검사와 실제 운영 브라우저 기능 검사는
각각 기록한다. 종료/실패 시 해당 run tag의 볼륨만 삭제하고 원래 IAM profile을 복원한 뒤
staging을 중지한다. 다음 staging 테스트 시 기존 배포/Compose 절차로 앱을 다시 가동한다.
권한 오류로 정리가 실패하면 state artifact와 GitHub 실패를 확인하고:

```bash
python3 infra/scripts/run-staging-restore-drill.py cleanup --region ap-northeast-2 \
  --state "$DOWNLOADED_DRILL_STATE_FILE"
```

을 재실행한다. 다른 볼륨은 삭제하지 않는다. 기존 운영 서버의 restore timer는 비활성화된다.
월간 workflow·첫 실제 성공을 확인하지 않고 복구훈련 완료로 기록하지 않는다.

## 5. 이미지·Amplify 빌드 정리

검증한 manifest는 `currentDigest`, 서로 다른 직전 정상 `rollbackDigests` 최소 3개,
`stagingDigests`(현재/보존할 staging 이미지)를 포함한다. 이미지 digest와 실행 중/복구
이미지 기록을 먼저 대조한다. 정상 이미지 3개가 없다면 삭제하지 않는다.

```bash
python3 infra/scripts/aws-cost-controls.py ecr-cleanup --repository "$ECR_REPOSITORY" \
  --protected-manifest "$VERIFIED_MANIFEST_FILE"
# 후보 검토 후에만 동일 명령에 --apply를 추가한다.
```

30일 이상 된 미사용 후보만 삭제한다. 최근 pull, 알 수 없는 tag, 시각 정보 누락,
보호 digest는 보존한다. 저장소 전체를 지우는 lifecycle rule은 추가하지 않는다.

GitHub staging/production 환경에 `AWS_AMPLIFY_RELEASE_ROLE_ARN`과 기존 Amplify app ID를
설정한다. OIDC role은 해당 app/branch의 GetBranch/StartJob/GetJob/StopJob만 허용한다.
자동 빌드를 켠 상태에서 각 branch의 `Release changed frontend`를 수동 검증한다.
정확한 commit의 성공 job을 확인한 후 `enable-amplify-path-releases.sh`에
`AMPLIFY_APP_ID`, `AMPLIFY_BRANCH`, `VERIFIED_JOB_ID`, `VERIFIED_COMMIT_SHA`,
`CONFIRM_PATH_RELEASE_WORKFLOW_READY=YES`를 전달한다. 그 branch 자동 빌드만 끈다.
이후 frontend/**·amplify.yml·배포 workflow 변경은 빌드하고 backend 전용 변경은 건너뛴다.
Amplify 콘솔의 환경 변수만 바꾼 경우 수동 실행한다. 실패 시 기존 branch 자동 빌드를
다시 켜 복구할 수 있다. 다른 branch/스테이징을 삭제하지 않는다.
