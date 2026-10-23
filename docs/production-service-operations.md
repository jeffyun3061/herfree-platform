# 실서비스 운영·유지보수 가이드

이 문서는 건강·질병 관련 개인정보를 다루는 Herfree를 배포하고 운영할 때의 실행 순서를 고정한다. 자동 테스트가 통과해도 실제 AWS·DNS·OAuth·SMTP·S3·백업 복원 증거가 없으면 production에 공개하지 않는다.

## 1. 배포 전 하네스

저장소 루트에서 실행한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\service-harness.ps1
```

하네스는 secret scan, backend test, frontend security/architecture/lint/unit/build, npm audit, Docker Compose 문법을 검사하고 `artifacts/service-harness/latest.md`에 결과를 남긴다. Docker가 없는 개발 PC에서는 `-SkipDocker`, 외부 npm audit이 막히면 `-SkipAudit`을 사용할 수 있지만 release 승인에는 생략 사실을 기록한다.

로컬 MySQL과 API가 이미 실행 중이면 현재 가입 동의·일지 CRUD·삭제·집계 개인정보 경계를 실제 HTTP로 확인한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\service-harness.ps1 -RunLocalSmoke
```

스테이징에서는 `ADMIN_EMAIL`/`ADMIN_PASSWORD`를 일회성 환경변수로 주고
`-RequireAdminSmoke`를 추가해 관리자 집계·개인정보 비노출 검증까지 반드시 수행한다.

실제 Next/BFF와 API가 실행 중인 스테이징 또는 로컬 환경에서는
`-RunBrowserSmoke`를 추가해 공개 라우트, `/api/health`, 인증 경계를 브라우저로 검증한다.
로컬 API가 HTTP인 경우에는 `PLAYWRIGHT_USE_DEV_SERVER=true`를 함께 사용한다.
production/staging smoke는 반드시 HTTPS API origin과 `next start`로 실행한다.

Docker가 실행 중인 CI/검증 머신에서는 `-RequireDockerIntegration`도 추가해
Testcontainers MySQL에 Flyway를 적용하고 Hibernate 스키마 검증을 강제한다.

## 2. 배포 순서

1. 변경을 feature/fix 브랜치에서 PR로 올리고 CI·CodeQL·secret scan을 통과시킨다.
2. 운영 적용 승인 전에는 검토 후보와 frontend `develop` tree가 일치하는지 확인한다. 스테이징은 current `develop`에서도 검증할 수 있다.
3. Release workflow에서 staging을 배포하고 smoke·mutation E2E를 통과시킨다.
4. staging에서 실제 브라우저로 OAuth 3종, 비밀번호 재설정, 이미지 업로드/삭제, 개인 일지, 비공개 문의, 다른 계정의 401/403 차단을 확인한다.
5. 결과를 사용자에게 보여주고 운영 적용 승인을 받는다. 이후 current `main`과 정확히 일치하는 staging 검증 이미지의 immutable digest만 production에 승격한다. 병합으로 SHA가 달라지면 새 main SHA의 스테이징 검증이 필요하다.
6. production 배포 직전 로컬 MySQL S3 백업 dump/checksum/완료 metadata와 rollback 대상 image를 기록한다.
7. 배포 후 `/api/health`, Swagger 404, 일반 사용자 관리자 API 403, 로그 개인정보 미포함을 확인하고 30분 모니터링한다.

## 3. 데이터·보안 원칙

- 건강 기록, 메모, 상담·문의 본문, 이메일, OAuth secret, JWT, reset token, presigned URL을 로그·분석 이벤트·오류 응답에 남기지 않는다.
- production DB·S3·SMTP·OAuth·JWT·분석 salt는 staging과 모두 다른 값을 Secrets Manager와 IAM role로 관리한다.
- 현재 DB는 EC2 내부 Docker MySQL이며 호스트 3306 비공개, 별도 암호화 EBS, 필수 TLS를 사용한다. 6시간 S3 백업과 일일 EBS snapshot을 유지한다. RDS 절차는 과거 스냅샷 복구용이다.
- API 8080과 DB 3306은 인터넷에 공개하지 않고 Nginx 443만 외부에 노출한다. `TRUSTED_PROXY_CIDRS`에 `0.0.0.0/0`을 넣지 않는다.
- 관리자 기능은 개인 계정과 TOTP MFA를 사용한다. public profile은 독립 MFA 키 누락·MFA 비활성화 시 기동하지 않는다. 역할과 15분 MFA 증명을 모두 검증하며 관리자 VPN/고정망 제한을 보장하지 않는다. 공용 관리자 계정과 bootstrap 계정은 production에서 금지한다.
- Flyway migration은 이미 적용된 파일을 수정하지 않고 새 버전을 추가한다. 파괴적 변경은 snapshot, dry-run, 복원 계획 없이는 배포하지 않는다.
- 배포 스크립트는 ECR URI만 허용하며 production은 `@sha256:` digest만 허용한다. 수동으로 임의 레지스트리나 mutable tag를 전달하지 않는다.
- staging/prod 애플리케이션은 JWT·SMTP·HTTPS CORS·S3·DB TLS·독립 MFA 키 설정이 없으면 시작 단계에서 fail-closed 한다. 로컬 MySQL은 REQUIRED, RDS 복구 모드는 VERIFY_IDENTITY를 요구한다.
- 개인 일지 memo는 `HEALTH_DATA_ENCRYPTION_KEY`로 AES-GCM 암호화한다. 키는 JWT·분석 salt와 다른 Secrets Manager 값으로 생성한다(`openssl rand -base64 32`).
- 기존 평문 memo가 있는 환경은 먼저 staging snapshot을 만들고 re-key 작업을 완료한 뒤 production으로 승격한다. 암호화 키를 잃으면 memo를 복구할 수 없으므로 키 백업·접근권한·교체 절차를 별도로 기록한다.
- 월간 복구훈련은 [`infra/scripts/run-staging-restore-drill.py`](../infra/scripts/run-staging-restore-drill.py)로 기존 스테이징과 암호화 임시 EBS를 사용한다. [`infra/scripts/restore-local-db-drill.sh`](../infra/scripts/restore-local-db-drill.sh)가 격리 MySQL에 복원하고 실제 복호화·핵심 기능을 확인한다. `restore-rds-drill.sh`는 과거 RDS snapshot이 필요한 별도 복구에만 사용한다.

## 4. 로그·디버깅

모든 장애 조사에는 UTC 시각, release SHA, endpoint/method/status, `X-Request-ID`, 내부 사용자 ID(필요한 경우)를 사용한다. 원문 개인정보를 복사해 이슈·채팅·로컬 파일에 남기지 않는다.

- 401/403/429/5xx 급증, Flyway 실패, S3/SMTP 실패, 관리자 감사 저장 실패를 우선 확인한다.
- 관리자 변경은 `admin_audit_logs`와 `role_audit_logs`의 request ID·actor·결과를 대조한다.
- 관리자 API의 읽기 요청도 `admin_audit_logs`에 경로·상태·request ID만 남기며, query/body 원문은 저장하지 않는다.
- 세션 문제는 브라우저 저장소보다 `/api/users/me`와 HttpOnly cookie의 실제 상태를 먼저 확인한다.
- 장애 중에는 새 기능 배포와 수동 SQL을 멈추고, 영향 범위를 축소한 뒤 직전 이미지 rollback 또는 검증된 백업 복원을 선택한다.
- `app_event_logs` lock timeout이 보여도 핵심 요청을 재시도하기 전에 사용자/일지 transaction을 확인한다. backend analytics는 business transaction commit 이후 best-effort로 기록되며, 분석 로그 실패가 건강정보 저장을 500으로 만들면 안 된다.

## 5. 정기 점검

- 매일: health/5xx/인증 실패/디스크·메모리/MySQL 연결/백업 완료·지연/문의·신고 대기열 확인
- 매주: Dependabot·CodeQL·Trivy, IAM 변경, 관리자 감사 로그, 백업 성공 확인
- 매월: [운영 개선 실행서](operations-improvements.md)의 stopped staging 격리 복원 workflow, 실제 복호화·읽기/쓰기·RPO/RTO와 임시 자원 정리·중지를 기록한다. 로그 개인정보 표본 검사와 만료 데이터 파기도 확인한다.

## 6. 배포 차단 항목

다음 중 하나라도 증거가 없으면 기능이 동작하더라도 production 공개를 보류한다: 유효한 secret 복구 경로, 비공개 MySQL/S3·암호화 EBS, DB TLS, 백업 복원 drill, 관리자 MFA, OAuth·SMTP·S3 실검증, 독립 DAST/권한 테스트, 개인정보·건강정보 처리 정책 승인. 법률 자문 후 약관을 바꾸는 것은 가능하지만, 현재 데이터 처리 방식과 실제 고지·동의가 불일치하는 상태는 기술적으로도 배포 차단 사유다.
