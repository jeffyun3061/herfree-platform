# Git 작업·배포 흐름

Herfree는 실제 운영 배포를 전제로 관리한다. 운영 서버에 올라간 코드를 직접 고치지 않고, 브랜치에서 개발한 뒤 테스트를 통과한 변경만 `main`에 합친다.

## 브랜치 기준

| 브랜치 | 용도 | 규칙 |
| --- | --- | --- |
| `main` | 운영 배포 기준 | 운영 적용 승인 후 병합. **production은 검증된 current main 커밋 기준** |
| `develop` | 통합·검증 브랜치 | `feature/*`·`fix/*` PR을 모아 CI를 통과시킨 뒤 `main`으로 승격한다 |
| `feature/*` | 새 기능 | 예: `feature/admin-user-search` |
| `fix/*` | 버그 수정 | 예: `fix/mobile-menu-layout` |
| `security/*` | 보안 수정 | 예: `security/password-reset-log` |
| `docs/*` | 문서 수정 | 예: `docs/release-runbook` |
| `hotfix/*` | 운영 긴급 수정 | 운영 장애 때만 사용한다 |

### develop 브랜치 (저장소에 포함)

CI(`ci.yml`, `codeql.yml`)는 **`main`과 `develop` 모두**에서 실행된다.

```text
feature/oauth-ui ──PR──► develop ──staging 검증──► 운영 적용 승인──PR──► main
fix/tab-ux       ──PR──► develop
hotfix/prod-*    ──PR──► main (긴급만 develop 생략 가능)
```

**develop 최초 생성·동기화 (로컬):**

```powershell
cd C:\dev\herfree-platform
.\scripts\setup-develop-branch.ps1 -Push
```

### GitHub 브랜치 보호 (Settings → Branches)

#### `main` (필수)

1. Branch name pattern: `main`
2. `Require a pull request before merging` — 켜기
3. `Require status checks to pass before merging` — 켜기
4. Required checks: **`backend`**, **`frontend`** (CI job 이름)
5. `Require branches to be up to date before merging` — 켜기
6. 운영 공개 후: `Do not allow bypassing the above settings` 권장

#### `develop` (권장)

1. Branch name pattern: `develop`
2. `Require a pull request before merging` — 켜기 (혼자 작업 시에도 습관용)
3. `Require status checks to pass before merging` — 켜기
4. Required checks: **`backend`**, **`frontend`**
5. `Require branches to be up to date before merging` — 선택 (develop은 완화 가능)

**staging / production용 코드 브랜치는 만들지 않는다.** 환경은 Spring profile + 서버 `.env`로만 구분한다. → [`go-live-checklist.md` §1](./go-live-checklist.md)

## 평소 작업 순서

```powershell
cd C:\dev\herfree-platform
git status

git checkout main
git pull origin main

git checkout develop
git pull origin develop
git checkout -b feature/example
```

수정 후 확인:

```powershell
cd C:\dev\herfree-platform\backend
.\gradlew.bat test
.\gradlew.bat build

cd C:\dev\herfree-platform\frontend
npm run lint
npm run build
```

커밋:

```powershell
cd C:\dev\herfree-platform
git status
git diff
git add 수정한파일
git commit -m "fix(frontend): 로그인 오류 메시지 정리"
git push -u origin feature/example
gh pr create --base develop --title "fix(frontend): 로그인 오류 메시지 정리"
```

`develop`이 CI를 통과하면 **Release backend** workflow를 `develop`, `target=staging`으로 실행해 먼저 검증한다.
최종 결과와 미통과 항목을 운영 책임자에게 보여준 뒤 운영 적용 승인을 받아 `main` PR을 병합한다.
병합으로 SHA가 바뀌면 current `main`의 정확한 SHA도 staging에서 검증해야 production으로 승격할 수 있다.

## 로컬 Git 설정

커밋 템플릿과 기본 브랜치 규칙을 적용하려면 한 번만 실행한다.

```powershell
cd C:\dev\herfree-platform
.\scripts\setup-git-workflow.ps1
```

이 설정은 현재 저장소에만 적용된다. 다른 프로젝트에도 같은 규칙을 쓰려면 다음 명령을 사용한다.

```powershell
.\scripts\setup-git-workflow.ps1 -Global
```

## 배포 기준

운영 배포는 **current `main` 커밋 SHA** 기준이다. 사전 검증은 current `develop`에서도 가능하다.
커밋 메시지에 “배포용”“테스트용”을 붙이지 않는다.

```text
feature/* → develop (PR, CI)
         → Amplify develop의 정확한 SHA 빌드 확인
         → Release backend (ref=develop, target=staging), smoke + 변경형 BFF E2E
         → 검토 결과 제시·운영 적용 승인 → main (PR, CI)
         → main/develop frontend tree 동일성 + Amplify develop SHA 확인
         → Release backend (ref=main, target=staging) → staging-passed-<main SHA>
         → target=production (완료 마커·키 버전이 확인된 S3 백업, 동일 이미지 digest)
         → smoke test
```

코드·아키텍처 맵: [`architecture-overview.md`](./architecture-overview.md)

배포 후 smoke test는 `docs/release-runbook.md`와 `docs/ops-security-checklist.md`를 기준으로 확인한다.

### 운영 정책 확인과 기존 인프라 보호

운영 백엔드·프론트엔드의 GitHub 배포 경로는 AWS 변경 전에
`verify-legal-policy-alignment.ps1 -StrictOperationalFacts`를 실행한다. `production`
환경의 secret에 다음 운영 검토 기록을 준비한다. 값은 작업 로그에 출력하지 않는다.

| 이름 | 확인 내용 |
| --- | --- |
| `LEGAL_OPERATOR_CONFIRMED` | 공개된 운영 주체 표기가 실제 운영자와 일치하면 `true` |
| `PRIVACY_CONTACT_CONFIRMED` | 공개된 개인정보 담당 부서·이메일이 실제 요청을 처리하면 `true` |
| `LEGAL_MAIL_PROVIDER`, `LEGAL_MAIL_PROVIDER_COUNTRY` | 실제 메일 수탁자와 처리 국가. 웹·문서 방침 두 곳에 같은 사실을 게시 |
| `LEGAL_AWS_REGION` | 실제 배포 `AWS_REGION`과 일치하는 확인된 리전 |
| `LEGAL_AWS_CROSS_BORDER_ACCESS_REVIEWED` | 계약·지원·재위탁·국외 접근 검토 기록이 있으면 `true` |
| `LEGAL_POLICY_REVIEWED_VERSION` | 검토한 현재 개인정보처리방침 버전 |
| `LEGAL_OPERATIONAL_REVIEW_REFERENCE` | 기존 비공개 문서의 절대 경로, HTTPS 링크 또는 `record:기록ID` |

이 선언은 사실과 검토 기록을 연결하는 운영 통제이며 법률상 적합성 인증이 아니다.
개인 주거지 주소나 개인정보 담당자 개인 성명을 일괄 수집하지 않는다. 담당 부서·연락처를
사용하는 경우 그 부서가 실제 지정돼 요청을 처리하는지 확인한다. 게시될 방침에 수탁자·국외
접근 사실이 아직 배포 전 확인 대상으로 남아 있으면 비밀값을 채워도 배포가 차단된다.
실제 분석 설정과 AWS·메일 계약도 함께 검토해야 한다.

Amplify `main` 자동 빌드는 GitHub 배포 게이트와 독립적으로 실행될 수 있다. 운영 적용 전
중단점을 보장하려면 `main`을 병합하기 전에 기존 자동 빌드 상태를 확인하고, 승인된 경로별
릴리스 역할을 검증한 뒤 자동 빌드를 끄는 전환 절차를 완료한다. 그 전에는 `main` 병합을
운영 프론트엔드 적용으로 취급한다.

`go-live-production.ps1`은 기본적으로 기존 EC2·로컬 MySQL을 읽기 전용 점검하며 RDS를
만들지 않는다. 검증된 운영 인스턴스·DB 볼륨 ID를 전달한다. 과거
`setup-production-aws.ps1`은 현재 릴리스 경로에서 분리됐으며, 별도 승인된 RDS 신규 구축에만
`-ConfirmLegacyRdsProvisioning`을 명시해 사용한다.

## 커밋 메시지

형식:

```text
<type>(<scope>): <요약>
```

예시:

```text
feat(admin): 회원 검색 필터 추가
fix(frontend): 모바일 메뉴 높이 조정
security(auth): 비밀번호 재설정 로그 개인정보 제거
docs(ops): 운영자 계정 복구 안내 추가
ci: 백엔드와 프론트 빌드 검증 분리
```

권장 type:

| type | 의미 |
| --- | --- |
| `feat` | 기능 추가 |
| `fix` | 버그 수정 |
| `security` | 보안 개선 |
| `refactor` | 동작 변경 없는 구조 개선 |
| `test` | 테스트 추가·수정 |
| `docs` | 문서 변경 |
| `chore` | 설정·정리 |
| `ci` | GitHub Actions 등 자동화 |

## 주의할 점

- 운영 DB에 테스트 데이터를 넣지 않는다.
- `.env.prod`, JWT secret, DB 비밀번호, SMTP 비밀번호, S3 키는 커밋하지 않는다.
- 마이그레이션 파일은 이미 배포된 번호를 수정하지 않고 새 번호로 추가한다.
- 운영 장애 수정은 원인을 짧게 기록하고, 배포 후 같은 문제가 반복되지 않도록 테스트나 문서를 남긴다.
