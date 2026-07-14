# Git 작업·배포 흐름

Herfree는 실제 운영 배포를 전제로 관리한다. 운영 서버에 올라간 코드를 직접 고치지 않고, 브랜치에서 개발한 뒤 테스트를 통과한 변경만 `main`에 합친다.

## 브랜치 기준

| 브랜치 | 용도 | 규칙 |
| --- | --- | --- |
| `main` | 운영 배포 기준 | 항상 배포 가능한 상태를 유지한다 |
| `develop` | 다음 배포 후보 | 선택 사항. 기능이 많아질 때 사용한다 |
| `feature/*` | 새 기능 | 예: `feature/admin-user-search` |
| `fix/*` | 버그 수정 | 예: `fix/mobile-menu-layout` |
| `security/*` | 보안 수정 | 예: `security/password-reset-log` |
| `docs/*` | 문서 수정 | 예: `docs/release-runbook` |
| `hotfix/*` | 운영 긴급 수정 | 운영 장애 때만 사용한다 |

첫 운영 전에는 `main` + 작업 브랜치만으로 충분하다. 기능이 여러 개 동시에 진행되기 시작하면 `develop`을 추가한다.

## 평소 작업 순서

```powershell
cd C:\dev\herfree-platform
git status

git checkout main
git pull origin main

git checkout -b fix/example
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
git commit -m "fix: 로그인 오류 메시지 정리"
```

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

## GitHub 보호 설정

GitHub 저장소에서 직접 켠다.

1. `Settings` > `Branches` > `Add branch protection rule`
2. Branch name pattern: `main`
3. `Require a pull request before merging` 켜기
4. `Require status checks to pass before merging` 켜기
5. 필수 체크: `backend`, `frontend`
6. `Require branches to be up to date before merging` 켜기
7. 혼자 작업하더라도 `Do not allow bypassing the above settings`는 운영 시작 후 켜기

처음에는 혼자 개발 속도가 중요하므로 PR 필수와 CI 필수만 켜도 충분하다.

## 배포 기준

배포는 `main` 기준으로만 한다.

```text
작업 브랜치
→ 테스트 통과
→ PR 생성
→ CI 통과
→ main merge
→ main 기준 배포
→ smoke test
```

배포 후 smoke test는 `docs/release-runbook.md`와 `docs/ops-security-checklist.md`를 기준으로 확인한다.

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
