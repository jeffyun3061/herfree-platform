# Contributing — Herfree Platform

팀 규모가 작더라도 동일한 브랜치·커밋·PR 규칙을 유지한다.

---

## 브랜치

| 패턴 | 용도 | 예시 |
|------|------|------|
| `main` | 배포 가능 기준선 | — |
| `feature/{ticket-or-topic}` | 기능 | `feature/post-anonymous` |
| `fix/{topic}` | 버그 | `fix/report-validation` |
| `docs/{topic}` | 문서만 | `docs/api-spec-reports` |
| `chore/{topic}` | 빌드·CI·의존성 | `chore/ci-backend` |

- `main`에 직접 push 지양 — PR + CI 통과 후 merge
- 장기 브랜치는 주기적으로 `main` rebase 또는 merge

---

## 커밋 메시지 (Conventional Commits)

**커밋 메시지는 영어로만 작성한다.** 한글 subject는 일부 터미널·CI·git log 환경에서 깨지거나 인코딩 문제를 일으킬 수 있다. PR 제목도 동일하게 **영어 필수**다.

형식 ([Conventional Commits](https://www.conventionalcommits.org/)):

```
<type>(<scope>): <subject in English>

[optional body — English or Korean OK]
```

| type | 용도 |
|------|------|
| `feat` | 기능 |
| `fix` | 버그 |
| `docs` | 문서 |
| `refactor` | 동작 동일 리팩터 |
| `test` | 테스트 |
| `chore` | 빌드·설정 |
| `ci` | GitHub Actions |

**좋은 예시 (영어 subject)**

```
feat(post): add anonymous flag on create
fix(auth): return 401 for expired JWT
docs(erd): define reports table indexes
refactor(comment): extract hide logic to domain method
chore(deps): bump spring boot to 3.3.5
```

**나쁜 예시**

```
feat: 익명 게시글 추가          # 한글 subject — 사용 금지
fix bug                        # type/scope 형식 없음, subject 모호
FEAT(POST): Add Anonymous      # 대문자·과도한 scope 표기 지양
```

- **subject:** 영어, 명령형(imperative), 50자 내외, 마침표 생략
- **body:** 선택. 팀 협의에 따라 한국어 가능 (리뷰 설명·체크리스트 등)
- **한 커밋 = 하나의 논리 단위** (API + migration + 테스트가 한 기능이면 함께 가능)

---

## Pull Request

### PR 제목

- **영어 필수** — 커밋과 동일한 Conventional Commits 형식 (`feat(scope): ...`)
- 예: `feat(post): add anonymous create option`

### PR 본문

- 제목·커밋과 달리 **본문은 한국어 가능** (팀이 한국어 리뷰를 선호하는 경우)
- git log·GitHub 목록에 노출되는 **제목(subject)은 영어**를 권장해 이력 검색·CI 로그를 안정적으로 유지한다

### PR 본문 체크리스트

- [ ] `docs/api-spec.md` / `erd.md` 변경 시 문서 선행·동기화
- [ ] 신규 의존성 → `docs/decision-log.md` ADR
- [ ] `backend`: `./gradlew test` 통과
- [ ] `frontend`: `npm run lint && npm run build` 통과
- [ ] 1차 MVP 제외 기능 미포함 (`requirements.md` 5절)
- [ ] 민감 정보·시크릿 파일 미커밋

### 리뷰 기준

- `docs/convention.md` 12절 체크리스트
- Controller에 비즈니스 로직 없음, Entity API 미노출
- 프론트: 클래스 컴포넌트 없음, hook 분리

---

## 로컬 검증 (구현 단계)

```bash
cd backend && ./gradlew test
cd frontend && npm ci && npm run lint && npm run build
```

---

## 문의

이슈·PR 설명에 재현 경로, 기대/실제 동작, 스크린샷(UI)을 포함한다.
