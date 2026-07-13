# Herfree 작업 관리 규칙

이 문서는 Herfree를 혼자 개발하더라도 팀 프로젝트처럼 관리하기 위한 기준이다.
기록은 과하게 꾸미기보다, 왜 바꿨고 어떻게 확인했는지가 남도록 작성한다.

## 기본 원칙

- `main`은 배포 가능한 상태만 유지한다.
- 기능, 버그, 문서, 운영 변경은 가능한 한 작은 단위로 나눈다.
- 커밋 하나에는 한 가지 목적만 담는다.
- API, DB, 운영 설정이 바뀌면 관련 문서를 같이 갱신한다.
- 테스트를 돌리지 못했다면 커밋이나 PR 본문에 이유를 남긴다.
- 운영, 보안, DB 변경에서 개발자가 직접 결정해야 하는 항목은 `docs/developer-decision-checklist.md`에 남긴다.
- 배포 전 운영·퍼널·UX 판단은 `docs/prelaunch-operations-plan.md`를 기준으로 확인한다.

## 브랜치 규칙

| 구분 | 형식 | 예시 |
| --- | --- | --- |
| 기능 | `feature/{작업명}` | `feature/oauth-login` |
| 버그 수정 | `fix/{작업명}` | `fix/password-reset-mail` |
| 보안/운영 | `chore/{작업명}` | `chore/security-hardening` |
| 문서 | `docs/{작업명}` | `docs/release-runbook` |
| 긴급 수정 | `hotfix/{작업명}` | `hotfix/prod-login-error` |

개인 작업 중에는 바로 `main`에서 작업할 수 있지만, 배포 직전에는 아래 순서로 확인한다.

1. `git status`로 의도하지 않은 파일이 섞였는지 확인한다.
2. 백엔드 테스트와 프론트 빌드를 실행한다.
3. 운영 설정, 마이그레이션, 문서 변경 여부를 확인한다.
4. 커밋 메시지에 작업 범위와 검증 내용을 짧게 남긴다.

## 커밋 메시지

커밋 메시지는 Conventional Commits 형식을 사용한다. 이 프로젝트는 한글 설명을 허용한다.

```txt
<type>(<scope>): <요약>

본문은 필요한 경우에만 작성한다.
무엇을 바꿨는지보다 왜 바꿨는지, 어떤 영향이 있는지를 적는다.
```

### type

| type | 의미 |
| --- | --- |
| `feat` | 사용자 기능 추가 |
| `fix` | 버그 수정 |
| `security` | 보안 위험 완화 |
| `refactor` | 동작 변경 없는 구조 개선 |
| `test` | 테스트 추가/수정 |
| `docs` | 문서 수정 |
| `chore` | 빌드, 설정, 운영성 개선 |
| `ci` | GitHub Actions 등 자동화 |

### scope

scope는 선택이지만 가능하면 남긴다.

- `auth`, `post`, `user`, `admin`, `storage`, `frontend`, `backend`, `docs`, `ci`, `ops`

### 좋은 예시

```txt
security(auth): 로그인 계정 열거 가능성 완화
fix(frontend): 회원가입 요청에 약관 동의값 포함
docs(ops): 운영 로그 관리 기준 정리
test(storage): S3 이미지 조회 크기 제한 검증 추가
ci: 백엔드 빌드와 프론트 빌드 검증 추가
```

### 피할 예시

```txt
수정
마지막
보안 작업
feat: 이것저것 수정
fix: 오류 해결
```

## 커밋 전 확인

백엔드 변경이 있으면:

```powershell
cd backend
.\gradlew.bat test
.\gradlew.bat build
```

프론트 변경이 있으면:

```powershell
cd frontend
npm run lint
npm run build
```

보안 관련 변경이 있으면 다음 항목도 확인한다.

- 토큰, 비밀번호, 비밀번호 재설정 URL이 로그에 남지 않는가
- 인증/인가 실패 응답이 계정 존재 여부를 노출하지 않는가
- 일반 사용자가 타인의 비공개 데이터를 조회하거나 검색으로 추론할 수 없는가
- 운영 환경의 실패가 조용히 성공 처리되지 않는가
- 설정 예시는 실제 비밀값이 아닌 placeholder만 포함하는가
- DB, 로그, 배포, 개인정보 정책처럼 운영 판단이 필요한 내용은 결정 근거를 남겼는가

## PR 본문 기준

PR이나 작업 메모에는 아래 네 가지를 남긴다.

- 변경 요약
- 확인한 테스트
- 운영 영향
- 남은 위험이나 후속 작업

예시:

```md
## 변경 요약
- 비밀번호 재설정 메일 발송 실패를 도메인 예외로 처리
- 운영 환경에서 콘솔 발송 fallback 차단

## 확인
- backend `.\gradlew.bat test`
- backend `.\gradlew.bat build`

## 운영 영향
- SMTP 설정 누락 시 재설정 요청이 실패 응답을 반환함

## 후속 작업
- 운영 SMTP 계정과 알림 채널 점검 필요
```

## 이력 관리

이미 원격에 올라간 커밋은 원칙적으로 메시지를 바꾸거나 재작성하지 않는다.
포트폴리오용으로 정리할 때도 실제 작업 흐름을 보존하고, 이후 커밋부터 규칙을 맞춘다.
