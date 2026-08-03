# Production security controls reference

이 문서는 운영자가 코드 변경 후 확인해야 하는 보안 불변조건을 한 곳에 모은다.

| 영역 | 강제 조건 | 검증 위치 |
| --- | --- | --- |
| 건강정보 DB | `journal_records.memo` AES-GCM, public profile에서 `HEALTH_DATA_ENCRYPTION_KEY` 필수 | `RuntimeProfilePolicy`, `HealthDataStringAttributeConverter` |
| 기존 평문 전환 | staging에서만 `HEALTH_DATA_REKEY_ON_STARTUP=true` 허용, production은 기동 거부 | `HealthDataRekeyRunner` |
| S3 | public access block·BucketOwnerEnforced·AES256 encryption을 기존 버킷에도 재적용 | `scripts/setup-production-aws.ps1` |
| S3 credentials | staging/production은 static access key 금지, EC2 IAM role만 사용 | `RuntimeProfilePolicy`, `.env.*.example` |
| BFF CSRF | production은 `NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN` allowlist와 exact Origin 비교 | `frontend/src/lib/bff/security.ts` |
| 관리자 접근 게이트 | staging/prod `/api/admin/**`는 운영자 VPN/고정망 CIDR 밖에서 403, public profile은 CIDR 없으면 기동 거부 | `AdminAccessGateFilter`, `ADMIN_ACCESS_ALLOWED_CIDRS` |
| 인증 rate limit | IP/email 공격자 입력 맵에 만료·상한·정리 적용 | `AuthRateLimitFilter`, `LoginLockoutService` |
| forwarded IP | 신뢰된 proxy CIDR에서만 전달 헤더 사용, DNS hostname은 IP로 인정하지 않음 | `ClientIpExtractor` |
| 배포 | staging strict 통과, immutable ECR digest, RDS snapshot, rollback mode | `go-live-production.ps1`, `deploy-release.sh` |
| TLS/로그 | 인증서 갱신 실패는 배포 실패, CloudWatch retention 30일 재적용 | `setup-*-tls.sh`, `setup-production-aws.ps1` |
| 복구훈련 | 승인 플래그·암호화 snapshot·private restore SG·TLS smoke·자동 cleanup | `infra/scripts/restore-rds-drill.sh`, `docs/rds-restore-drill.md` |
| 추적성 | 응답과 콘솔 로그에 안전한 `X-Request-ID`만 연결하고 본문·건강정보는 기록하지 않음 | `RequestCorrelationFilter`, `application.yml`, `check-sensitive-logging.mjs` |

운영 공개 판정은 이 표의 코드 검증만으로 끝나지 않는다. 실제 AWS private RDS/S3, Secrets Manager, OAuth·SMTP, 브라우저 흐름, 백업 복구 drill의 증적이 없으면 `NO-GO`다.
