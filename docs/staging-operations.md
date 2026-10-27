# 헤르프리 스테이징 운영 가이드

문서 갱신: 2026-10-27. 아래 리소스 식별자는 기존 기록이며 현재 AWS 실행 상태를 뜻하지 않는다.
실제 확인 결과는 [운영 적용 전 검토](preproduction-review-2026-10-23.md)에 기록한다.

## 현재 운영 기준

운영은 Amplify 프론트엔드와 EC2의 API·로컬 MySQL을 유지한다. 스테이징도 기존 EC2에서
격리된 로컬 MySQL을 사용하며 테스트 중에만 가동한다. 과거 스테이징 RDS는 암호화 수동
스냅샷을 보존한 뒤 삭제된 기록이 있다. 이 개선을 위해 RDS를 다시 만들거나 시작하지 않는다.
상세 백업 보관 기준은 [현재 런타임](cost-optimized-runtime.md)을 따른다.

| 구성 | 기존 식별자·기준 |
|---|---|
| 리전 | ap-northeast-2 |
| EC2 | herfree-staging-api / i-02cf5b8f3a7aa32da |
| API | https://api-staging.herpfree.co.kr / 기존 고정 IP 유지 |
| 데이터베이스 | disposable local MySQL 8.4.10, Docker 내부 네트워크, 호스트 3306 미공개 |
| Amplify | herfree-staging / d2bcg3vnlv5hkh / develop |
| 프론트 | https://develop.d2bcg3vnlv5hkh.amplifyapp.com, Basic 인증 필수 |
| 업로드 | 기존 staging 전용 비공개 S3, 운영 버킷과 분리 |
| GitHub | staging Environment, herfree-github-staging-deploy 역할 |
| 로그 | 기존 /herfree/staging/api, 30일 보존 |

이전 문서의 RDS 시작 명령·최신 50개 ECR 보관·DNS 리셋 절차는 기본 운영 절차에서 제외했다.
과거 장애 기록이 필요하면 Git 이력을 확인한다. 기존 도메인/고정 IP를 임의 삭제하지 않는다.

## 비밀정보와 접근

- app-config, db-app, smtp는 기존 staging 전용 Secrets Manager 값을 사용한다.
  render-release-env.sh가 /opt/herfree/config/.env.staging을 권한 600으로 생성한다.
- 로컬 DB 설정은 .env.mysql.staging이며 운영 .env.mysql.prod와 분리한다.
  DB_RUNTIME=local, JDBC sslMode=REQUIRED와 내부 mysql 호스트를 검증한다.
- Amplify Basic 인증 비밀번호는 GetBranch의 암호화된 반환값을 재사용하지 않는다.
  GitHub staging의 E2E_HTTP_USERNAME/E2E_HTTP_PASSWORD와 실제 Basic 인증을 함께 검증한다.
  원문을 Git·SSM 명령·로그·채팅에 기록하지 않는다.
- 앱 관리자 MFA는 AWS 로그인/스테이징 Basic 인증과 별개다. 최초 MFA 등록에는 운영 책임자의
  개별 본인 확인과 일회성 등록 승인이 필요하다. 관리자 일괄 승인이나 MFA 비활성화로 테스트하지 않는다.
- 서버 관리는 SSM으로 수행한다. 공개 SSH/DB 포트를 열지 않는다.

## 테스트 세션

1. 검토 브랜치의 CI·CodeQL·실제 MySQL 마이그레이션 검사 통과를 확인한다.
2. AWS 계정/리전, EC2 상태·암호화 EBS·SSM, 배포 중 작업이 없는지 읽기 전용으로 확인한다.
   기존 실행 이미지와 DB Flyway 이력을 기록한다. V43 충돌 이력이 있으면 덮어쓰거나 repair하지 않는다.
3. 후보를 develop에 반영해 기존 Amplify 스테이징 빌드를 완료한다. 최신 성공 빌드의 정확한 SHA가
   develop과 일치해야 한다. 진행 중인 빌드를 취소하거나 중복 빌드를 연달아 시작하지 않는다.
4. 중지된 기존 스테이징 EC2만 시작한다. 아래 재개 절차로 정상 역할과 기존 MySQL/API 상태를
   확인한 뒤 상태 점검을 실행한다. 운영 데이터·운영 키를 일반 스테이징에 복사하지 않는다.
5. Release backend를 develop, target=staging으로 실행한다. 기존 역할의 권한이 부족하면 해당
   작업을 멈추고 필요한 범위를 확인한다. 운영 권한이나 Environment 정책을 자동 확대하지 않는다.
6. GitHub smoke·mutation 테스트에 더해 공개/비공개 글·댓글·이미지·공유 미리보기, 계정별 권한,
   MFA 만료·재사용, 로그인·일지·기존 글·풍부한 편집·운영 화면을 확인한다.
7. 실물 iPhone Safari와 Android Chrome/앱 WebView에서 키보드, 확대, safe area, 긴 글을 확인한다.
   Playwright의 모바일 에뮬레이션은 실물 검증으로 기록하지 않는다.
8. 합성 테스트 계정/데이터를 정리하고 스테이징 EC2를 중지한다. 중지 상태를 AWS에서 다시 확인한다.
   실패·중단 시에도 가동 자원과 정리 결과를 남긴다.

현재 backend workflow는 EC2 시작/중지를 자동 수행하지 않는다. 테스트 담당자가 끝까지 확인한다.
운영용 main 병합·production 배포는 검토 결과를 보여준 뒤 사용자 승인 이후에 진행한다.

## 격리 복원 후 스테이징 앱 재개

복원훈련은 일반 스테이징 컨테이너를 명시적으로 중지한다. Docker의 `restart: unless-stopped`는
이 상태를 EC2 재시작 뒤에도 유지하므로, 서버를 켜는 것만으로 API가 돌아온다고 가정하지 않는다.
복원훈련의 정리가 끝난 뒤 다음 테스트 세션에서 아래 절차를 수행한다.

1. 복원 상태 파일의 `cleaned=true`, 임시 복원 볼륨 삭제, 원래 인스턴스 프로필 연결을 AWS에서
   확인한다. 실행 중인 복원훈련이나 배포가 없어야 한다.
2. 기존 스테이징 EC2를 시작하고 SSM 온라인을 확인한다. `resume-staging-apps.py`를 승인된
   후보 버전에서 `/opt/herfree/infra/scripts/`에 배치한다.
3. SSM의 스테이징 호스트에서 다음 명령을 실행한다. 정상 역할·프로필 ARN은 복원 역할이 아닌
   기존 스테이징 연결값을 사용한다. 아래 값은 비밀번호가 아니며 실제 리소스 식별자로 바꾼다.

```bash
sudo python3 /opt/herfree/infra/scripts/resume-staging-apps.py \
  --instance-id '<staging-instance-id>' \
  --normal-role-arn 'arn:aws:iam::<account-id>:role/herfree-staging-ec2' \
  --normal-profile-arn 'arn:aws:iam::<account-id>:instance-profile/herfree-staging-ec2'
```

이 helper는 IMDS의 인스턴스·프로필과 STS의 실제 역할, 복원 마운트/컨테이너 잔존,
미완료 배포, 기존 컨테이너의 staging 프로필·로컬 DB·데이터 마운트를 검사한다.
허용하는 정상 역할·프로필 이름은 코드에서 각각 `herfree-staging-ec2`로 고정하고 두 ARN의
계정 일치도 검사한다. 복원 역할 ARN을 두 인자로 전달해 정상 역할이라고 지정할 수 없다.
향후 정상 역할·프로필 이름을 바꾸려면 helper 코드와 이 runbook을 함께 검토·수정한다.
모든 검사 후 **기존 MySQL 시작 → DB healthy → 정상 역할 재확인 → 기존 API 시작 → health 200**
순서로만 처리한다. 이미지를 내려받거나 컨테이너를 재생성하지 않고 환경값·회원 데이터·원문 로그도
출력하지 않는다. 배포와 같은 lock을 사용하며 복원훈련과 동시에 실행하지 않는다.

실패하면 출력 문구를 근거로 역할 연결·복원 정리·배포 상태를 확인한다. 복원 역할이 연결된 상태에서
`docker start`로 건너뛰지 않는다. 성공 후 `Staging preflight`와 후보 기능 테스트를 수행하고,
세션이 끝나면 EC2를 다시 중지해 AWS 상태를 확인한다. 복원 cleanup 자체는 계속 스테이징을
중지한 상태로 끝나며, 정상 앱을 복원 역할 아래에서 시작하지 않는다.

## 상태 점검

`Staging preflight` workflow는 기존 GitHub `staging` Environment와 배포 역할로 실행한다.
`develop`의 점검 스크립트 변경 시 또는 수동 실행으로 고정된 기존 스테이징만 조사한다.
EC2/EBS/SSM·Amplify Basic 보호·실제 Basic 로그인·API 상태를 확인하고, SSM에서는
환경값의 존재/안전 여부와 Flyway 버전·스크립트·체크섬만 읽는다. 비밀번호, 키 원문,
회원·건강정보, 전체 환경 파일과 AWS/SSM 원문 오류를 로그에 출력하지 않는다.
리소스 시작/중지·생성·배포·DB 수정·IAM/secret 변경은 하지 않으며 권한 부족도 실패로 남긴다.
이 점검 통과는 후보 배포·실제 MFA·E2E·복원 성공을 대신하지 않는다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-staging-status.ps1 -DatabaseRuntime local
```

이 스크립트는 테스트 세션 중 인프라 확인용이다. 중지 상태의 연결 실패는 테스트 전 시작이
필요하다는 뜻이며 상시 가동하라는 뜻이 아니다. DB 실제 쿼리/마이그레이션/복구·정확한 후보 SHA의
기능 테스트까지 통과했다는 판정으로 사용하지 않는다. 과거 RDS 복구 환경에서만 명시적으로
-DatabaseRuntime rds를 지정한다.

## 월간 격리 복원과 비용

[운영 개선 실행서](operations-improvements.md)의 restore-drill.yml을 사용한다. 일반 스테이징
앱을 중지하고 새 암호화 임시 EBS·내부 Docker 네트워크에 복원한다. 백업 체크섬, 완료 마커,
해당 백업의 키 버전, 평문 잔존, 복호화, Flyway, 가입·로그인·글·댓글·일지 서비스 검증을 수행한다.
훈련 후 임시 데이터/볼륨/컨테이너를 정리하고 원래 인스턴스 역할을 복구한 뒤 중지한다.
실제 운영 백업은 민감정보이므로 일반 QA 환경이나 공개 CI artifact로 옮기지 않는다.

- 6시간 백업과 8/32/15일 논리 백업·일일 EBS 7개 보관을 유지한다.
- 운영 EC2 크기는 30일 자원 측정 전 줄이지 않는다.
- ECR 정리는 현재 운영+직전 정상 3개+스테이징 이미지 보호 목록을 확인하고 dry-run 후 시행한다.
- 중지 중에도 기존 EBS·고정 IP·백업 저장 비용은 발생한다. 추가 비용/순절감액은 실제 청구로 확인한다.

## 장애 대응

담당자·UTC 시각·release SHA·request ID·조치/복구 결과를 기록한다. 개인정보 원문은 복사하지 않는다.
배포 실패는 직전 정상 이미지로 복구한다. 추가형 Flyway 파일을 삭제/수정하거나 임의 역마이그레이션하지 않는다.
데이터 손상이 의심되면 쓰기를 멈추고 검증된 격리 복원 절차로 판단한다. 암호화 키를 단순 교체하지 않는다.
