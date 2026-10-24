# Production security controls reference

이 문서는 운영자가 코드 변경 후 확인해야 하는 보안 불변조건을 한 곳에 모은다.

| 영역 | 강제 조건 | 검증 위치 |
| --- | --- | --- |
| 건강정보 DB | `journal_records.memo` AES-GCM, public profile에서 `HEALTH_DATA_ENCRYPTION_KEY` 필수 | `RuntimeProfilePolicy`, `HealthDataStringAttributeConverter` |
| 기존 평문 전환 | staging에서만 `HEALTH_DATA_REKEY_ON_STARTUP=true` 허용, production은 기동 거부 | `HealthDataRekeyRunner` |
| S3 | public access block·BucketOwnerEnforced·AES256 encryption을 기존 버킷에도 재적용 | `scripts/setup-production-aws.ps1` |
| S3 credentials | staging/production은 static access key 금지, EC2 IAM role만 사용 | `RuntimeProfilePolicy`, `.env.*.example` |
| BFF CSRF | production은 `NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN` allowlist와 exact Origin 비교 | `frontend/src/lib/bff/security.ts` |
| 관리자 MFA | staging/prod `/api/admin/**`는 기존 역할 + 로그인에 연결된 15분 MFA 필수, 해제/키 누락 시 기동 거부 | `AdminAccessGateFilter`, `AdminMfaService`, `RuntimeProfilePolicy` |
| MFA 등록·분실 복구 | 운영 책임자 본인 확인 후 15분 일회용 승인, 암호화 TOTP secret, 해시된 일회용 복구 코드, 5회 실패 시 15분 잠금·TOTP 재사용 차단 | `V43`, `approve-admin-mfa-enrollment.sh`, MFA 테스트 |
| 인증 rate limit | IP/email 공격자 입력 맵에 만료·상한·정리 적용 | `AuthRateLimitFilter`, `LoginLockoutService` |
| forwarded IP | 신뢰된 proxy CIDR에서만 전달 헤더 사용, DNS hostname은 IP로 인정하지 않음 | `ClientIpExtractor` |
| 배포 | 이번 보안 변경은 staging 검증 후 immutable ECR digest, 배포 전 S3 백업, rollback mode | `release-backend.yml`, `deploy-release.sh` |
| TLS/로그 | 인증서 갱신 실패는 배포 실패, CloudWatch retention 30일 재적용 | `setup-*-tls.sh`, `setup-production-aws.ps1` |
| 복구훈련 | 기존 stopped staging, 일시적 제한 IAM profile, 임시 암호화 EBS, 내부 Docker network, 실제 복호화·읽기/쓰기, 임시 자원 삭제·중지 | `run-staging-restore-drill.py`, `restore-local-db-drill.sh`, `RestoreDrillVerifier` |
| 추적성 | 응답과 콘솔 로그에 안전한 `X-Request-ID`만 연결하고 본문·건강정보는 기록하지 않음 | `RequestCorrelationFilter`, `application.yml`, `check-sensitive-logging.mjs` |

운영 공개 판정은 코드 검증만으로 끝나지 않는다. 실제 AWS 비공개 DB/S3, 암호화 EBS,
AWS root·운영자 MFA, 제한된 IAM/보안그룹, SSM 접속, Secrets Manager, OAuth·SMTP,
브라우저 흐름, 알림 도달과 복구훈련 증적을 기록한다. 건강정보 키는 단순 교체하지 않는다.
새 MFA 키는 건강정보 키와 독립적이며 복구 전용 secret에는 운영 DB 비밀번호를 넣지 않는다.
일반 스테이징 역할에 운영 app-config/db-app/smtp 읽기 권한을 추가하지 않는다.
