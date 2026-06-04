# Herfree Platform — 개발 컨벤션

백엔드(Spring Boot)와 프론트엔드(Next.js) 공통 개발 규칙. REST API 상세는 [api-spec.md](api-spec.md), 스키마는 [erd.md](erd.md), MVP 범위는 [requirements.md](requirements.md), 기술 선택은 [decision-log.md](decision-log.md)를 따른다.

---

## Backend 규칙 (1–15)

### 1. Layer 분리

- Controller: HTTP 요청·응답·Validation 위임만.
- Service: 비즈니스 규칙·트랜잭션 경계.
- Repository: 데이터 접근만.
- Entity: 도메인 상태·행위(도메인 메서드).

### 2. 패키지 루트

- 루트 패키지: `com.herfree`
- 횡단 관심사: `global` (config, security, exception, response, common)
- 기능 단위: `domain/{도메인}` — **auth**와 **user**는 별도 패키지로 분리한다.

```txt
backend/src/main/java/com/herfree
├── domain
│   ├── auth          # signup, login, logout, reissue, JWT 연동
│   │   ├── controller
│   │   ├── service
│   │   ├── dto
│   │   │   ├── request
│   │   │   └── response
│   │   └── exception
│   ├── user          # users, user_profiles, me, nickname
│   │   ├── controller
│   │   ├── service
│   │   ├── repository
│   │   ├── entity
│   │   ├── dto
│   │   └── exception
│   ├── board
│   ├── post
│   ├── comment
│   ├── reaction
│   ├── report
│   ├── content
│   ├── video
│   └── product
└── global
    ├── config
    ├── security
    ├── exception
    ├── response
    └── common
```

### 3. Entity — Setter 남용 금지

상태 변경은 `update()`, `hide()`, `delete()` 등 도메인 메서드로 표현한다.

### 4. Soft delete

게시글·댓글·콘텐츠·회원은 `status` 값 변경(`ACTIVE`, `HIDDEN`, `DELETED`, `SUSPENDED`)을 우선한다.

### 5. DTO 분리

- Entity를 API 응답으로 직접 반환하지 않는다.
- Request: `{Domain}{Action}Request` (예: `PostCreateRequest`)
- Response: `{Domain}Response`, `{Domain}DetailResponse`

### 6. 메서드 네이밍

동사를 구체적으로 사용: `create`, `get`, `find`, `update`, `delete`, `validate`, `hide`, `process`, `extract` 등. `doPost`, `handlePost` 금지.

### 7. 예외

- `RuntimeException` 직접 throw 금지.
- `BusinessException` + `ErrorCode` + 도메인별 `*NotFoundException`, `*AccessDeniedException`.

### 8. ApiResponse

모든 REST 응답은 `success`, `message`, `data` 공통 형식 ([api-spec.md](api-spec.md)).

### 9. REST URL

- 동사 URL 금지 (`/api/createPost` ❌).
- 리소스 복수형: `/api/posts`, `/api/posts/{postId}`.
- 관리자: `/api/admin/**` prefix.

### 10. 클래스 네이밍

| 계층 | 패턴 | 예 |
|------|------|-----|
| Controller | `{Domain}Controller` | `PostController` |
| Service | `{Domain}Service` | `PostService` |
| Repository | `{Entity}Repository` | `PostRepository` |
| Entity | 단수 명사 | `Post`, `User` |

### 11. 환경·설정 파일

- **커밋 금지:** `application-local.yml`, `application-prod.yml`(실값), `.env*`, JWT·DB 실비밀.
- **커밋 허용:** `application.yml`(플레이스홀더), `application-local.yml.example`, `application-prod.yml.example`.
- 로컬: example 복사 후 `spring.profiles.active=local`로 Docker MySQL(`herfree_db`) 연결.
- 운영: `SPRING_PROFILES_ACTIVE=prod`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` 환경 변수.

### 12. Git 브랜치

```txt
main
develop
feature/*
hotfix/*
release/*
```

예: `feature/backend-auth`, `feature/docs-requirements`

### 13. 커밋 메시지

[Conventional Commits](https://www.conventionalcommits.org/) — **subject·PR 제목은 영어 only.**

```txt
feat(backend): implement post create API
docs: define initial service requirements
```

한글 subject 금지. 상세: [CONTRIBUTING.md](CONTRIBUTING.md).

### 14. 1차 구현 순서

1. global — ApiResponse, ErrorCode, GlobalExceptionHandler, BaseTimeEntity, Security
2. domain/auth — signup, login, logout, reissue
3. domain/user — profile, me, nickname, withdraw
4. board → post → comment → reaction → report
5. admin API (숨김·신고·회원)
6. content → video → product
7. SpringDoc 동기화
8. frontend 연동
9. CI/CD (`deployment.md`)

### 15. DB·마이그레이션

- 메인 DB: MySQL 8 (로컬 Docker, 운영 RDS). H2 메인 DB 사용 안 함.
- 로컬 `ddl-auto: update`는 gitignored local profile만.
- 운영: Flyway + `ddl-auto: validate` 또는 `none`.
- `erd.md` 변경 시 migration SQL 동시 갱신.

---

## 프론트엔드 (요약)

- App Router 기반 Next.js, TypeScript, Tailwind CSS
- 모바일 웹 우선 반응형 UI
- 비즈니스 규칙·타입: `src/domain/` (React/Next import 금지)
- API·상태·폼: `src/hooks/` custom hook
- 함수 컴포넌트 중심
- API 계약: [api-spec.md](api-spec.md) ↔ `src/types` 동기화
- 의료 정보 UI: [requirements.md](requirements.md) §14.3 안내 문구 상시 노출

---

## 문서 동기화

| 변경 유형 | 갱신 문서 |
|-----------|-----------|
| API 경로·DTO | `api-spec.md` |
| 테이블·컬럼·인덱스 | `erd.md` + Flyway |
| 아키텍처·의존성 | `decision-log.md` |
| MVP 범위 | `requirements.md` |
| 배포·시크릿 | `deployment.md` |
