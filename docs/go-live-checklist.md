# Herfree 실서비스 배포 한방 체크리스트

기준일: 2026-07-17

이 문서 하나를 배포 기준으로 사용한다. `[x]`는 코드와 로컬 자동 검증이 끝난 항목이고, `[ ]`는 AWS·외부 콘솔·법적 검토처럼 운영자가 직접 완료해야 하는 항목이다.

> **공개 배포 원칙:** `NO-GO` 항목이 하나라도 비어 있으면 운영 공개하지 않는다. 먼저 staging에 배포하고 같은 이미지를 production으로 승격한다.
>
> **건강정보 상위 기준:** [`health-data-security-standard.md`](./health-data-security-standard.md)의 `BLOCK` 또는 `DECISION`이 남아 있으면 이 문서가 완료되어도 production 공개는 `NO-GO`다.

## 1. 환경별로 무엇이 다른가

코드는 하나이며 설정만 환경별로 분리한다. 설정을 바꾸려고 코드를 수정하거나 주석을 켰다 끄지 않는다.

| 구분 | 로컬 개발 | AWS staging | AWS production |
| --- | --- | --- | --- |
| Spring profile | `local` | `staging` | `prod` |
| DB | Docker MySQL | staging RDS | production RDS |
| 설정 위치 | 로컬 Git 제외 파일 | `/opt/herfree/config/.env.staging` | `/opt/herfree/config/.env.prod` |
| OAuth | Dev 앱/키 | Dev 또는 staging 앱/키 | Prod 앱/키 |
| S3 | 개발 버킷 | staging 버킷 | production 버킷 |
| 메일 | 개발 설정 | staging SMTP | production SMTP |
| 실행 | `backend/run-local.ps1` | GitHub Actions | GitHub Actions 승인 배포 |

일반 코드 수정 때 DB 비밀번호를 다시 입력하지 않는다. DB·SMTP·OAuth 키를 교체하거나 도메인이 바뀔 때만 해당 환경 설정을 변경한다.

## 2. 현재 완료된 코드·자동 검증

- [x] 백엔드 `clean build` 성공
- [x] 백엔드 테스트 188개 통과, 실패 0개
- [x] 프론트 lint와 production build 성공
- [x] Next.js 15.5.20 전환 후 주요 라우트와 API 흐름 검증
- [x] npm audit 취약점 0건
- [x] 데스크톱·모바일 공개 화면, health·권한 경계, 로그인 일지·마이페이지 목록 E2E 31개 통과 (중복 mutation 1개 의도적 생략)
- [ ] S3를 포함한 회원가입·게시글·댓글·일지·비공개 이미지 mutation E2E는 staging에서 통과
- [x] 로그인 계정 열거와 비밀번호 검증 타이밍 보완
- [x] 비밀번호 재설정 토큰·URL·이메일 민감 로그 방지
- [x] 비공개 게시판 소유자·관리자 조회 범위 제한
- [x] 이메일 정규화, DB unique 제약, 동시 중복 가입 409 변환
- [x] 게시글·댓글·칼럼 목록 쿼리 수 회귀 테스트와 관리자 신고 대상 일괄 조회
- [x] S3 이미지 크기·타입 제한과 삭제 정리
- [x] 민감정보 별도 동의와 Flyway V32 적용
- [x] 관리자 감사 로그와 Flyway V33 적용
- [x] `X-Request-ID`와 관리자 변경 감사 추적
- [x] Swagger 운영 비활성화
- [x] 로컬 비밀 설정이 JAR에 포함되지 않도록 빌드 차단
- [x] `.dockerignore`로 환경파일·키·로컬 설정의 Docker 빌드 전송 차단
- [x] 실제 비밀 설정 파일 Git 추적 없음
- [x] 전체 파일 비밀정보 검사 통과
- [x] local/staging/production DB 설정 분리
- [x] 활성 Spring profile 누락·중복 시 서버 시작 차단
- [x] staging에도 운영형 CORS·Swagger·SMTP 실패 정책 적용
- [x] 개발 CSP는 HMR을 허용하고 운영 CSP는 `unsafe-eval`을 차단하는 자동 회귀 검사
- [x] 운영 설정 누락·로컬 DB 주소·개발 비밀번호 사용 시 배포 차단
- [x] 읽기 전용 컨테이너, 최소 권한, CloudWatch 로그 설정
- [x] staging health 실패 시 직전 이미지 자동 rollback
- [x] staging을 통과한 동일 이미지로만 production 배포
- [x] GitHub Actions, CodeQL, Dependabot 구성
- [x] JWT를 명시적 access 용도와 OAuth 프로필 완성 용도로 분리해 중간 토큰의 일반 API 인증 거부
- [x] 회원 전용·비공개·숨김·삭제·미첨부 이미지에 서빙 시점 권한 검사와 `private, no-store` 적용
- [x] 이미지 표시 URL을 항상 권한 판정 프록시로 발급해 S3·CDN 직링크 우회 차단
- [x] 신고 관리 화면의 회원 이메일 마스킹 (MODERATOR 열람 대비)
- [x] 공개 건강 통계는 서로 다른 사용자 20명 이상, 항목별 5명 이상일 때만 공개
- [x] 건강정보 통계 활용을 선택 동의로 분리하고 동의 이력·철회 API와 Flyway V34 적용
- [x] 신고 승인·반려 처리 근거를 보존하고 Flyway V35 적용
- [x] 회원별 스크랩을 DB에 보존하고 받은 공감·스크랩 목록을 분리하며 Flyway V36 적용
- [x] 공개·관리자 건강 통계는 최신 동의가 유효한 회원의 기록만 집계
- [x] 탈퇴 시 이메일·비밀번호·OAuth·reset token·닉네임 이력 원문 제거
- [x] 이벤트·reset token·관리자/권한 감사 로그 자동 파기 스케줄과 환경별 보존기간 구성
- [x] 커뮤니티 게시판 탭 4개 고정·페이지 전환 UX (2026-07-17, `BoardTabBar`)
- [x] 운영 문의·약관·개인정보 연락처 `herpfree3@gmail.com` 통일 (2026-07-17)
- [x] 배포 준비 로컬 검사 스크립트 `scripts/verify-deploy-readiness.ps1` (2026-07-17)
- [x] preflight 재통과 (2026-07-17, commit `1bd3606` 이후)

## 3. 운영 공개 전 NO-GO

### 계정과 비밀정보

- [ ] 이 대화에 노출됐던 Kakao Dev/Prod client secret을 모두 재발급하고 이전 값을 폐기했다.
- [ ] production DB·JWT·분석 salt·SMTP·OAuth 비밀값을 서로 다른 강한 값으로 만들었다.
- [ ] `/opt/herfree/config/.env.prod`만 실제 값을 가지며 GitHub와 Git에는 실제 값을 넣지 않았다.
- [ ] `.env.prod` 소유권을 운영 계정으로 제한하고 권한을 `600`으로 설정했다.
- [ ] `ADMIN_BOOTSTRAP_ENABLED=false`이고 demo 계정이 운영 DB에 없다.
- [ ] 관리자 계정은 개인별로 발급하고 공용 계정을 사용하지 않는다.
- [ ] 관리자 MFA를 적용하거나 도입 전까지 `/api/admin/**`를 VPN, Cloudflare Access 또는 고정 IP로 제한했다.

### AWS와 네트워크

- [x] staging RDS `herfree-staging-mysql` 생성: MySQL 8.0.46, `db.t4g.micro`, 단일 AZ, 20GB gp3, 저장 암호화, 삭제 보호 (2026-07-17)
- [x] staging RDS Public access 비활성화, 전용 보안 그룹 인바운드 0개, `require_secure_transport=ON` 적용
- [x] staging RDS 관리형 master secret 사용, error 로그 그룹 30일 보존, 시점 복구 가능 상태 확인
- [x] staging RDS 자동 백업 1일 적용. 현재 AWS Free plan 제한값이며 staging 검증용으로만 사용한다.
- [x] staging EC2 생성 후 EC2 보안 그룹에서 staging RDS 3306만 허용하고, 앱 전용 DB 계정을 생성했다.
- [x] staging EC2는 SSH를 열지 않고 SSM으로만 관리하며, 80/443 외 인바운드를 차단했다.
- [x] staging ECR·API 로그 그룹·OIDC 배포 role·EC2 instance role을 최소 권한으로 생성했다.
- [x] staging app/DB/SMTP secret을 분리하고 EC2 `.env.staging` 렌더링·권한 `600` 검증을 통과했다.
- [ ] production 공개 전 Paid plan에서 production RDS를 별도 생성하고 자동 백업을 7일 이상으로 설정했다.
- [ ] production과 staging의 RDS, S3, SMTP, OAuth 자격증명을 분리했다.
- [ ] RDS Public access를 끄고 EC2 보안 그룹에서만 3306 접근을 허용했다.
- [ ] staging·production에서 Flyway V36 적용과 `post_bookmarks` 유니크 제약 생성을 확인했다.
- [ ] production EC2의 8080과 RDS 3306을 인터넷에 공개하지 않았다. (staging API는 검증용 `:80` HTTP만 노출)
- [ ] 외부에는 Nginx 443만 공개하고 HTTP는 HTTPS로 전환한다.
- [ ] `herpfree.co.kr`, `api.herpfree.co.kr`과 staging 도메인의 DNS·TLS 인증서가 정상이다.
- [ ] S3 Public access block, CORS, EC2 IAM 최소 권한을 확인했다.
- [ ] EC2에 AWS access key를 파일로 넣지 않고 instance role을 사용한다.
- [ ] CloudWatch production/staging 로그 그룹을 만들고 KMS 암호화와 30일 보존을 설정했다.
- [ ] API 5xx, health, EC2 CPU·메모리·디스크, RDS CPU·연결·저장공간 알람을 만들었다.
- [ ] production RDS 자동 백업 7일 이상, 삭제 보호, 저장 암호화를 켰다.
- [ ] staging에서 백업을 새 DB로 복원하는 연습을 완료했다.

### 외부 기능

- [ ] Kakao, Naver, Google의 staging callback으로 실제 로그인했다.
- [ ] Kakao, Naver, Google의 production callback URI를 정확히 등록했다.
- [ ] production SMTP에서 비밀번호 재설정 메일 수신·1회 사용·만료를 확인했다.
- [ ] production S3에서 JPEG/PNG/WEBP 업로드·조회·삭제를 확인했다.
- [ ] 10MB 초과 파일, 잘못된 콘텐츠 타입, 허용하지 않은 URL이 거부된다.

### 개인정보와 운영 정책

- [ ] 개인정보처리방침의 운영 주체, 담당자, 주소, 연락처, 위탁업체를 실제 계약 정보로 확정했다.
- [ ] 건강·질병 관련 민감정보의 수집 항목, 목적, 보유기간, 거부권 문구를 법률 전문가가 확인했다.
- [ ] 건강정보 통계 활용 동의 문구와 실제 집계 항목·철회 효과를 법률 전문가가 확인했다.
- [ ] 회원 탈퇴, 게시글 익명화, 개인정보 삭제, 로그 보존·파기 기간을 운영 정책으로 승인했다.
- [ ] 탈퇴 후 동의 이력·감사 로그·게시물의 보존기간과 재가입 정책을 운영 책임자가 승인했다.
- [x] 공개 일지 통계가 서로 다른 사용자 20명 최소 표본과 5명 미만 소수 셀 억제를 적용한다.
- [ ] RDS JDBC 연결이 서버 인증서를 검증하는 TLS를 사용하고 비암호화 연결을 거부한다.
- [ ] 건강정보 저장 암호화와 field-level encryption 적용 범위를 승인했다.
- [ ] 자동 파기 보유기간을 운영 책임자가 승인하고 staging/production 실행 로그를 증거로 남겼다.
- [ ] 침해 신고 담당자와 사용자 공지·신고 절차를 정했다.
- [ ] `docs/templates/security-incident-record.md`로 SEV-1 모의훈련을 수행했다.
- [ ] 운영자에게 관리자 기능, 문의 처리, 신고 처리, 사고 보고 방법을 전달했다.

## 4. GitHub와 AWS 최초 1회 설정

### 4-A. 저장소·워크플로 (로컬에서 확인 가능)

- [x] `ci.yml` — push/PR 시 secret-scan, backend test/build, frontend lint/build
- [x] `release-backend.yml` — staging/production 수동 배포, ECR, SSM, staging E2E
- [x] `codeql.yml` — 정적 분석
- [x] `infra/docker/Dockerfile.backend` — Release workflow와 동일 이미지 경로
- [x] `scripts/preflight-local.ps1` · `scripts/verify-deploy-readiness.ps1`
- [x] `Dockerfile.backend` 로컬 Docker 빌드 검증 (2026-07-17, `herfree-api:local-verify`)
- [x] release E2E 주요 경로 8초 이내 로드 budget 테스트 추가 (2026-07-17)
- [ ] AWS 직전 Git: `.\scripts\pre-aws-git.ps1 -Push` 로 `main`·`develop` 원격 동기화 + CI green
- [x] 도메인별 `package-info.java`·Service JavaDoc·[`architecture-overview.md`](./architecture-overview.md) (2026-07-17)

### 4-B. GitHub·AWS 콘솔 (운영자 1회)

- [x] GitHub `staging`, `production` Environment를 만들었다.
- [x] production Environment에 required reviewer를 지정했다.
- [x] staging GitHub Actions용 AWS OIDC 배포 Role을 만들었다.
- [x] staging EC2 instance role에 SSM, ECR pull, CloudWatch Logs, 해당 S3·secret 최소 권한만 부여했다.
- [x] ECR `herfree-api` repository를 만들었다.
- [x] staging EC2에 `/opt/herfree` 배포 파일을 설치했다.
- [x] staging `.env.staging`을 secret에서 생성하고 `chmod 600`을 검증했다.
- [ ] production OIDC role·EC2·`.env.prod`는 staging 통과 후 별도로 만들었다.

GitHub Repository Variables:

| 이름 | 값 |
| --- | --- |
| `AWS_REGION` | `ap-northeast-2` |
| `ECR_REPOSITORY` | `herfree-api` |
| `STAGING_INSTANCE_ID` | staging EC2 instance ID |
| `PRODUCTION_INSTANCE_ID` | production EC2 instance ID |
| `STAGING_FRONTEND_URL` | staging frontend HTTPS URL |
| `PRODUCTION_API_URL` | `https://api.herpfree.co.kr` |

각 GitHub Environment Secret:

- `AWS_DEPLOY_ROLE_ARN`: GitHub OIDC로만 사용하는 배포 Role ARN

## 5. 코드 작업부터 운영 반영까지

1. `feature/*` 또는 `fix/*` 브랜치에서 작업한다.
2. 로컬에서 기능을 직접 확인한다.
3. 저장소 루트에서 아래 배포 전 한방 검사를 실행한다.
4. 변경 파일과 migration을 직접 검토하고 커밋한다.
5. Pull Request의 CI·CodeQL을 통과시킨다.
6. `main`에 병합한다.
7. GitHub Actions `Release backend`를 `target=staging`으로 실행한다.
8. staging 자동 E2E와 아래 수동 검사를 통과한다.
9. 생성된 `staging-passed-<commit SHA>` 태그를 확인한다.
10. production 승인 후 같은 태그로 운영 배포한다.
11. 배포 후 5분 smoke와 30분 모니터링을 수행한다.

운영 서버에서 코드를 직접 수정하거나 `git pull`로 즉석 배포하지 않는다.

## 6. 배포 직전 한방 자동 검사

저장소 루트 PowerShell에서 실행한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight-local.ps1
```

`Bypass`는 이 명령 한 번에만 적용되며 Windows의 영구 실행 정책을 변경하지 않는다.

이 명령은 다음을 검사한다.

- 백엔드 clean build와 전체 테스트
- 프론트 lint와 production build
- 실행 중인 개발 서버와 분리된 `.next-preflight` production 검증
- npm 취약점
- Git 추적 비밀 파일
- 전체 파일 비밀정보 패턴
- whitespace와 충돌 흔적

자동 검사가 성공해도 3절의 수동 `NO-GO` 항목은 별도로 완료해야 한다.

staging·GitHub Actions 배포 직전에는 아래도 실행한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-deploy-readiness.ps1
```

Docker가 없으면 `-SkipDocker`로 workflow·preflight만 검사할 수 있다.

## 7. staging 수동 사용자 흐름

- [ ] 비회원 홈 → 회원가입 → 이메일 로그인 → 로그아웃
- [ ] Kakao·Naver·Google 로그인
- [ ] 닉네임 변경과 30일 제한·동일 닉네임 안내
- [ ] 가입 시 건강정보 통계 선택 동의를 거부해도 기본 기능을 이용할 수 있다.
- [ ] 마이페이지에 현재 통계 동의 상태가 표시되고, 확인 후 철회·재동의가 되며 철회 후 공개·관리자 통계에서 제외된다.
- [ ] 게시글 작성·수정·삭제, 이미지 첨부
- [ ] 댓글·답글 작성·수정·삭제와 긴 댓글 표시
- [ ] 개인정보 일지 작성·조회·수정·삭제와 타인 접근 차단
- [ ] 문의·비밀상담 작성과 다른 일반 계정에서 미노출
- [ ] 비밀번호 찾기 메일·변경·기존 비밀번호 로그인 실패
- [ ] 관리자 사용자·게시글·댓글·칼럼·영상·신고·문의 관리
- [ ] 모바일 390px와 데스크톱 1440px에서 메뉴·모달·페이지네이션·긴 텍스트 확인
- [ ] 목록 데이터 100건 이상에서 페이지 이동·검색·정렬·성능 확인
- [ ] **화면 전환 속도:** 홈 → 커뮤니티 → 일지 → 마이페이지 → QnA → 로그인을 모바일 390px·데스크톱 1440px에서 각 **3초 이내** 체감 (Next.js 클라이언트 이동·첫 진입 모두)
- [ ] **화면 전환 속도:** 커뮤니티 탭 페이지(◀ ▶) 전환은 **즉시** (네트워크 없음) — staging에서 3페이지 모두 확인

## 8. 운영 배포 후 5분 smoke

- [ ] `GET /api/health`가 200이고 `X-Request-ID`가 있다.
- [ ] `/swagger-ui.html`이 404다.
- [ ] 비로그인 글 작성은 401이다.
- [ ] 일반 사용자의 관리자 API 접근은 403이다.
- [ ] 회원가입·일반 로그인·OAuth 3종 로그인이 된다.
- [ ] 이미지 게시글 작성·조회·삭제가 된다.
- [ ] 비공개 문의와 개인일지를 다른 계정에서 볼 수 없다.
- [ ] 비밀번호 재설정 메일과 변경 로그인이 된다.
- [ ] 관리자 변경 후 `admin_audit_logs`에 request ID와 결과가 기록된다.
- [ ] CloudWatch 로그에 이메일·토큰·reset URL·게시글 원문·건강 메모가 없다.
- [ ] 건강 통계 응답에 사용자 ID·닉네임·메모·희소 집단 값이 노출되지 않는다.

## 9. 즉시 rollback 기준

다음 중 하나라도 발생하면 신규 기능을 고치면서 버티지 말고 직전 이미지로 rollback한다.

- 로그인·회원가입·비밀번호 재설정이 반복 실패한다.
- 일반 사용자가 타인의 비공개 문의·상담·개인일지를 볼 수 있다.
- DB migration 오류 또는 데이터 손실이 발생한다.
- health check 실패 또는 5xx가 평소보다 급증한다.
- 이미지 저장이 반복 실패한다.
- 로그에 이메일·OAuth token·reset URL·건강 기록 원문이 남는다.

DB migration은 이미지 rollback만으로 되돌아가지 않는다. 파괴적 migration은 백업·복원 계획과 별도 승인 없이 배포하지 않는다.

## 10. 앞으로 개발할 때 지킬 규칙

- 코드는 동일하게 유지하고 local/staging/prod 설정만 분리한다.
- 실제 secret은 Git, 코드, Dockerfile, 이미지, 채팅, 로그에 넣지 않는다.
- 운영 DB 데이터를 로컬로 복사하지 않는다. 필요하면 익명화한 staging 데이터를 사용한다.
- Flyway migration은 적용한 파일을 수정하지 않고 다음 버전 파일을 추가한다.
- DB 컬럼 삭제·타입 축소·대량 UPDATE는 백업과 rollback 계획을 먼저 작성한다.
- 의존성·프레임워크 버전 업그레이드는 기능 개발과 분리하고 전체 테스트를 다시 한다.
- 권한, 개인정보, 결제, 파일 업로드 변경은 정상 흐름뿐 아니라 401·403·실패 흐름도 테스트한다.
- production 장애를 조사할 때 DB 원문보다 `X-Request-ID`, 사용자 내부 ID, 발생 시각을 사용한다.
- 배포마다 commit SHA, 배포 시각, 담당자, migration, 결과, rollback 여부를 기록한다.

## 11. 운영 주기

매일:

- CloudWatch 5xx·health·자원 알람 확인
- 문의·신고·비공개 상담 대기열 확인
- 로그인·비밀번호 재설정·이미지 업로드 실패 급증 확인

매주:

- 가입·로그인·게시글·일지 퍼널 확인
- 관리자 권한 변경과 감사 로그 확인
- Dependabot·CodeQL 경고 검토
- RDS 백업 성공과 저장공간 확인

매월:

- staging 복원 테스트와 복구 시간 기록
- 사용하지 않는 관리자·OAuth·AWS 자격증명 회수
- 로그의 개인정보 원문 포함 여부 표본 검사
- 개인정보 보유기간이 지난 데이터 파기 확인
- Next.js·Spring Boot·JDK·MySQL 지원 종료 일정 확인

## 최종 판정

- 코드와 자동 검증: **2026-07-17 preflight + commit `1bd3606` 통과** (새 배포마다 `verify-deploy-readiness.ps1` 재실행)
- staging 배포: **4-B·7절 완료 후 가능** (GitHub/AWS 원격 설정 필요)
- production 공개: **3절 NO-GO, 7절 staging 검수, 건강정보 상위 기준의 BLOCK·DECISION을 모두 완료한 뒤 가능**

자동 테스트 통과는 무결점 보증이 아니다. 새 기능·설정·의존성·migration이 바뀌면 이 판정은 만료되며, 같은 검증과 staging 승인을 다시 수행한다.
