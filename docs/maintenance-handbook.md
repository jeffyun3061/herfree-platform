# Herfree 유지보수 핸드북

기준일: 2026-07-17

이 문서는 운영 중 코드 변경, 배포, 장애 대응을 혼자서도 같은 방식으로 반복하기 위한 기준이다. 실제 AWS 리소스 ID와 점검 명령은 `staging-operations.md`, 출시 승인 항목은 `go-live-checklist.md`를 함께 본다.

## 1. 변경부터 배포까지

1. `develop`을 최신화하고 `feature/*`, `fix/*`, `chore/*` 브랜치를 만든다.
2. 작은 단위로 구현하고 로컬 테스트를 실행한다.
3. `develop` 대상 PR을 만들고 `secret-scan`, `backend`, `frontend`, CodeQL을 모두 통과시킨다.
4. squash merge 후 `Release backend`를 `target=staging`으로 실행한다.
5. staging에서 핵심 사용자 흐름과 로그를 확인한다. DB 변경이 있으면 Flyway 적용 결과도 확인한다.
6. 최소 하루 동안 오류가 없는 것을 확인한 뒤 `develop -> main` PR을 만든다.
7. production은 staging 검증으로 생성된 `staging-passed-<SHA>` 이미지만 승격한다.

운영 서버에서 `git pull`, JAR 직접 교체, 소스 수정, 임의 SQL 실행을 하지 않는다. 같은 커밋과 같은 이미지가 staging과 production을 통과해야 원인 추적과 rollback이 가능하다.

## 2. 로컬·staging·production 구분

| 환경 | 데이터 | 비밀정보 | 목적 |
| --- | --- | --- | --- |
| local | 가짜 테스트 데이터 | gitignored 로컬 설정 | 빠른 개발 |
| staging | 운영과 분리된 테스트 데이터 | AWS Secrets Manager `herfree/staging/*` | 통합·배포 검증 |
| production | 실제 사용자 데이터 | 별도 `herfree/production/*` | 실서비스 |

서로 다른 DB, S3 버킷, OAuth 앱, JWT 키, SMTP 자격증명을 사용한다. production 데이터를 local이나 staging으로 복사하지 않는다. 꼭 필요한 장애 재현은 식별자를 제거한 최소 샘플만 사용한다.

## 3. 배포 직후 확인

- GitHub Actions의 이미지 스캔, 배포, E2E 작업이 모두 성공했는지 확인한다.
- API health, 회원가입, 로그인, OAuth, 비밀번호 재설정, 게시글·댓글, 개인일지, 이미지 업로드를 확인한다.
- 일반 계정의 관리자 API 접근이 401/403인지, 비공개 글과 이미지가 타인에게 보이지 않는지 확인한다.
- CloudWatch에서 새 5xx, 반복 예외, Flyway 실패, S3·SMTP 실패를 확인한다.
- 로그에 이메일 원문, 토큰, reset URL, 상담·일지 원문이 남지 않았는지 표본 점검한다.

## 4. 정기 운영

매일:

- 최근 배포와 GitHub Actions 실패 확인
- CloudWatch 5xx 및 로그인·메일·업로드 실패 급증 확인
- EC2 상태 검사와 RDS 상태 확인

매주:

- Dependabot, CodeQL, 이미지 취약점 결과 검토
- RDS 자동 백업과 복구 가능 시각 확인
- 디스크, DB 연결 수, CPU, 메모리, S3·로그 증가량 확인
- 신고·문의 미처리 항목 확인

매월:

- 임시 DB에 최신 백업을 복원하는 연습
- 사용하지 않는 IAM 권한, OAuth 키, GitHub secret 검토
- 개인정보·건강정보 원문이 로그와 분석 이벤트에 없는지 확인
- AWS 비용과 예산 알림 확인

## 5. DB 변경 원칙

- 스키마는 Flyway 새 버전 파일로만 변경하고 적용된 migration 파일은 수정하지 않는다.
- 먼저 새 컬럼·테이블을 추가하고, 코드가 새 구조를 사용하도록 배포한 뒤, 충분히 지난 다음 옛 구조를 제거한다.
- 데이터 삭제, 타입 축소, 대량 UPDATE 전에는 수동 snapshot을 만들고 staging에서 실행 시간과 복구를 검증한다.
- 애플리케이션 rollback은 DB rollback이 아니다. 호환되지 않는 migration이면 배포를 중단하고 별도 DB에 snapshot/PITR 복원 후 검증한다.
- production DB에 개발자 PC나 인터넷에서 직접 접속할 수 있게 열지 않는다.
- AWS의 RDS CA 교체 공지가 오면 `infra/certs/rds-global-bundle.pem`을 공식 truststore 주소에서 갱신하고, 새 이미지의 TLS 연결을 staging에서 먼저 검증한다. 인증서 검증을 끄는 방식으로 우회하지 않는다.

## 6. 비밀정보와 개인정보

- 키와 비밀번호는 Git, 이슈, 채팅, 문서, Actions 로그에 넣지 않는다.
- 유출이 의심되면 삭제만 하지 말고 즉시 재발급하고 이전 값을 폐기한다.
- staging과 production의 키를 공유하지 않는다.
- 운영자도 업무에 필요하지 않은 이메일·건강 기록 원문을 조회하지 않도록 최소 권한을 유지한다.
- 분석 이벤트에는 이벤트명, 익명 식별자, 시각, 필요한 최소 분류값만 저장한다.

## 7. 장애 대응

1. 추가 배포와 수동 데이터 변경을 멈춘다.
2. 발생 시각, 영향 기능, 배포 SHA, request ID를 기록한다.
3. CloudWatch와 Actions에서 최초 원인을 찾되 민감정보를 복사하지 않는다.
4. 이미지 문제이고 DB가 호환되면 직전 정상 이미지로 rollback한다.
5. 데이터 손상 가능성이 있으면 쓰기 기능을 먼저 제한하고 snapshot/PITR 복원을 별도 DB에서 검증한다.
6. 키 유출이면 관련 키를 모두 교체하고 접근 로그와 감사 로그를 보존한다.
7. 복구 후 원인, 영향, 조치, 재발 방지 테스트를 짧게 기록한다.

## 8. 의존성 업데이트

- Dependabot PR은 자동 병합하지 않는다.
- patch/minor도 release note, 전체 테스트, 이미지 스캔, staging 검증을 거친다.
- major 업그레이드는 별도 작업으로 만들고 API·DB 호환성을 먼저 조사한다.
- 지원 종료 버전은 방치하지 않는다. Spring Boot 3.5 계열 이후 업그레이드는 별도 staging 검증 계획으로 진행한다.
- Docker 베이스 이미지는 digest로 고정하고 Dependabot이 갱신한 PR을 같은 절차로 검증한다.

## 9. 비용을 아끼는 staging 운영

- 사용하지 않을 때 EC2와 RDS를 중지한다. S3, EBS, snapshot, Elastic IP 등 일부 비용은 계속 발생할 수 있다.
- staging에는 Multi-AZ, NAT Gateway, 상시 ALB를 두지 않는다.
- 중지 전 진행 중인 배포와 DB 작업이 없는지 확인하고, 시작할 때 RDS를 먼저 시작한 뒤 EC2를 시작한다.
- 비용 절감을 이유로 백업, 암호화, 비공개 네트워크, 로그 보존을 끄지 않는다.

## 10. 배포 판단

자동 테스트 통과는 필요한 조건이지 충분한 조건은 아니다. GitHub Actions, staging 수동 QA, DNS·TLS, SES, OAuth 콘솔, 백업 복원, 개인정보처리방침 검토가 모두 끝나야 production 배포를 승인한다. 하나라도 확인하지 못한 항목은 추측으로 체크하지 않고 NO-GO로 남긴다.
