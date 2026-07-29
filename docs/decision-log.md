# Herfree Platform — Architecture Decision Record (ADR)



핵심 기술 결정은 구현 전 **승인** 상태로 유지한다. 신규 의존성·인프라 변경은 ADR 추가 후 반영한다.



---



## ADR-001: Java 17 + Spring Boot 3.5.16



- **상태:** 승인

- **날짜:** 2026-06-03

- **배경:** LTS 안정성, Spring Boot 3.x Jakarta, 포트폴리오·CI·EC2 환경 통일. Java 21도 가능하나 팀·호스팅 편차를 줄이기 위해 단일 LTS 선택.

- **결정:** **Java 17** + **Spring Boot 3.5.16** (로컬·Docker·GitHub Actions·EC2 JRE 동일)

- **대안:** Java 21 단독 상향 — toolchain 변경 시 별도 ADR

- **영향:** `build.gradle.kts`, Actions `setup-java`, EC2 runtime image



---



## ADR-002: JWT 기반 Stateless 인증



- **상태:** 승인

- **날짜:** 2026-06-03

- **배경:** 모바일 웹 + API 분리, 세션 스토어 없이 수평 확장

- **결정:** JWT Access Token, Bearer 헤더 검증. `POST /api/auth/reissue`로 재발급(1차 정책은 api-spec 참고).

- **대안:** 서버 세션 + Redis, OAuth only

- **영향:** `global/security`, frontend 토큰 저장, secret은 env only



### ADR-002-1: Refresh Token (1.5차 예정)



- **상태:** 제안

- **결정 후보:** HttpOnly Cookie + rotation vs Access only

- **영향:** `/api/auth/reissue` 고도화, CORS·쿠키 정책



---



## ADR-003: MySQL 8 — H2를 메인 DB로 사용하지 않음



- **상태:** 승인

- **날짜:** 2026-06-03

- **배경:** 운영 RDS와 동일 엔진·문법·인덱스로 개발·테스트 일치. AWS RDS MySQL 8 managed offering, utf8mb4·한글·이모지, Spring Data JPA·Flyway 생태계가 성숙함.

- **결정:** **MySQL 8.x**만 메인 DB. H2는 통합 테스트 optional profile 정도만 허용(기본 아님). in-memory H2는 SQL dialect·제약·인덱스 동작이 MySQL과 달라 운영 이슈를 로컬에서 발견하기 어려움.

- **대안:** H2 in-memory로 빠른 프로토타입 — 운영 불일치로 **거부**

- **영향:** 로컬 Docker, CI testcontainers 또는 MySQL service (추후)



---



## ADR-004: 로컬 Docker MySQL + 운영 RDS



- **상태:** 승인

- **날짜:** 2026-06-03

- **배경:** 개발자마다 동일한 DB 버전·charset, 비밀번호는 example·gitignore로 분리. 호스트 MySQL 설치 편차(버전·설정)를 줄이고 `docker compose up` 한 번으로 온보딩.

- **결정:** 로컬 루트 `docker-compose.local.yml` (MySQL 8, `herfree_db` / `herfree_user` / port 3306). 운영 **AWS RDS MySQL 8** — 자동 백업·Multi-AZ·보안 그룹 격리, EC2 Spring과 private 네트워크 연동.

- **대안:** 로컬에 호스트 MySQL 직접 설치 — 가능하나 Compose를 표준으로 문서화

- **영향:** `deployment.md` §9, JDBC URL, SG 3306



---



## ADR-005: JPA ddl-auto — 로컬 update, 운영 validate/none + Flyway



- **상태:** 승인

- **날짜:** 2026-06-03

- **배경:** 초기 스캐폴딩 속도 vs 운영 스키마 안전

- **결정:**

  - 로컬(gitignored profile): `ddl-auto: update`

  - 운영: `validate` 또는 `none` + **Flyway** (`db/migration/V*.sql`)

- **대안:** 운영에서 `ddl-auto=update` — **금지**

- **영향:** `application-local.yml.example`, `application-prod.yml.example`, CI migration 검증



---



## ADR-006: 도메인 패키지 + 계층형 아키텍처 (전면 DDD 아님)



- **상태:** 승인

- **날짜:** 2026-06-03

- **배경:** MVP 속도와 팀 규모에 맞는 구조

- **결정:** `com.herfree.domain.{feature}` + Controller/Service/Repository/Entity/DTO. Aggregate·도메인 이벤트·CQRS는 1차 미채택.

- **대안:** 전면 DDD, 모놀리식 레이어 only (`controller.service.dao`)

- **영향:** `convention.md` 패키지 트리



---



## ADR-007: auth / user 도메인 패키지 분리



- **상태:** 승인

- **날짜:** 2026-06-03

- **배경:** 인증(JWT·로그인)과 프로필(닉네임·마이페이지) 변경 주기·의존성 분리

- **결정:** `domain/auth` (signup, login, logout, reissue) / `domain/user` (`users`, `user_profiles`, me API)

- **대안:** 단일 `user` 패키지에 auth 포함 — 혼잡도 증가로 **거부**

- **영향:** Security 설정, api-spec Auth vs User 섹션



---



## ADR-008: API 문서 (SpringDoc)



- **상태:** 승인

- **결정:** SpringDoc OpenAPI 3 — `/swagger-ui.html`, `/v3/api-docs`

- **영향:** Controller annotation ↔ `api-spec.md` 동기화



---



## ADR-009: 목록 API Offset 페이징



- **상태:** 승인

- **결정:** `page`(0-based), `size`(기본 20, 최대 100)

- **영향:** `PageResponse`, Repository `Pageable`



---



## ADR-010: Frontend — Next.js + TypeScript + Tailwind



- **상태:** 승인

- **결정:** App Router Next.js, Vercel 배포

- **영향:** `frontend/` 구조, `NEXT_PUBLIC_API_URL`



---



## ADR-011: Backend 배포 — EC2 Docker + Nginx



- **상태:** 승인

- **결정:** Spring Boot JAR in Docker on EC2, Nginx `/api` 프록시, GitHub Actions → ECR

- **영향:** `infra/docker/`, `deploy-backend.yml`



---



## ADR-012: MVP 1에서 PostgreSQL 미채택



- **상태:** 승인

- **날짜:** 2026-06-03

- **배경:** MVP 1은 커뮤니티·인증·콘텐츠 CRUD에 집중. 팀·호스팅·RDS 운영 경험이 MySQL 중심이며, pgvector 등 PostgreSQL 전용 기능은 1차 범위에 없음.

- **결정:** **PostgreSQL은 MVP 1 메인 DB로 사용하지 않음.** 운영·로컬 모두 MySQL 8 유지.

- **대안:** PostgreSQL + pgvector로 AI·벡터 검색 통합 — 벡터 DB는 별도 서비스로 분리하고 MySQL은 트랜잭션·커뮤니티 데이터에 전담 (ADR-013 참고)

- **영향:** RDS MySQL 8, JDBC 드라이버, Flyway migration dialect



---



## ADR-013: AI 기능 확장 — FastAPI 분리 + Vector DB (후속)



- **상태:** 승인 (로드맵)

- **날짜:** 2026-06-03

- **배경:** AI 의료 상담·RAG 기반 지식 검색은 MVP 1 범위 밖. 추후 LLM·임베딩 파이프라인은 Python 생태계가 유리하고, 메인 API·트랜잭션 DB와 분리해 장애·배포 주기를 독립시킬 필요가 있음.

- **결정:**

  - **Spring Boot:** 메인 REST API, 인증, 커뮤니티·콘텐츠·제품 등 핵심 도메인, **MySQL 8** 유지

  - **FastAPI (별도 서버):** AI 기능 전용 — RAG, 임베딩, LLM 호출, 대화 세션 처리

  - **Vector DB (후속):** Chroma, FAISS, Pinecone, Qdrant 등 후보 — **pgvector는 MVP 1·초기 AI 단계에서 채택하지 않음**

  - **MySQL 선택적 `ai_*` 테이블:** 대화 메타·피드백·감사 로그 등 관계형 데이터만 저장 (본문 임베딩은 Vector DB)

- **대안:** Spring 단일 모놀리스에 AI 통합 — Python ML 스택·GPU 워크로드 분리 어려움으로 **거부**

- **영향:** `erd.md` §9, `deployment.md` AI 서비스 섹션(예정), EC2 또는 별도 컨테이너로 FastAPI 배포



---



## ADR-014: Spring vs FastAPI 역할 분담



- **상태:** 승인 (로드맵)

- **날짜:** 2026-06-03

- **배경:** 단일 프레임워크로 모든 기능을 처리하면 AI 실험·모델 교체 시 메인 API 배포 리스크가 커짐.

- **결정:**

  | 역할 | Spring Boot | FastAPI |
  |------|-------------|---------|
  | 사용자·JWT·커뮤니티 API | ✅ | — |
  | Flyway·JPA·MySQL 트랜잭션 | ✅ | — |
  | LLM·RAG·임베딩 파이프라인 | — | ✅ |
  | Vector 검색 | — | ✅ (전용 Vector DB) |
  | 프론트 연동 | `/api/*` (Nginx) | `/ai/*` 또는 내부 전용 (추후 공개 범위 결정) |

- **대안:** FastAPI만으로 전체 백엔드 — 기존 Spring·JPA·팀 Java 역량과 MVP 일정상 **거부**

- **영향:** API 게이트웨이·CORS 정책, 서비스 간 인증(내부 API key 또는 JWT 위임) 설계



---



## ADR-015: YouTube URL whitelist



- **상태:** 승인

- **결정:** `youtube.com`, `www.youtube.com`, `youtu.be`만 허용

- **영향:** Video create validation, `extractYoutubeVideoId()`



---



## ADR-017: AWS S3 SDK — 게시글 이미지 업로드

> **식별자 정정(2026-07-28):** 검색 ADR은 `V18__add_posts_fulltext_ngram.sql`의 참조를 보존하기 위해 ADR-016으로 유지한다. 이 ADR과 이후 UTC·OAuth ADR은 중복 번호를 제거해 각각 ADR-017·018·019로 정정했다.



- **상태:** 승인

- **날짜:** 2026-06-18

- **배경:** 커뮤니티 게시글에 사진 1장 첨부가 필요하다. 서버 경유 multipart 업로드 대신 presigned PUT으로 클라이언트→S3 직접 업로드하면 API 서버 부하를 줄이고 확장에 유리하다.

- **결정:** `software.amazon.awssdk:s3` 의존성 추가. `PostImageStorageService`가 presigned PUT URL 발급, DB에는 `post_images.image_url`만 저장.

- **대안:** 서버 multipart 업로드, Cloudinary 등 SaaS

- **영향:** `build.gradle.kts`, `app.s3.*` 설정, S3 버킷 CORS·퍼블릭 읽기 정책, `POST /api/posts/images/upload-url`



---



## ADR 템플릿 (신규)



```markdown

## ADR-NNN: {제목}

- **상태:** 제안 | 승인 | 폐기

- **날짜:** YYYY-MM-DD

- **배경:**

- **결정:**

- **대안:**

- **영향:**

```



---



## ADR-016: 커뮤니티 검색 — MySQL FULLTEXT ngram

- **상태:** 승인
- **날짜:** 2026-06-10
- **배경:** 일 방문 ~600 규모 MVP에 Elasticsearch는 과함. 한글 2글자 이상 검색이 필요하다.
- **결정:** MySQL 8 **FULLTEXT + ngram** 인덱스, API·UI **최소 2글자** 검증. 검색어 있을 때만 FULLTEXT, 없으면 기존 목록 쿼리.
- **대안:** Elasticsearch(폐기), Meilisearch(성장 후), LIKE 유지(품질·성능 한계).
- **영향:** `V18__add_posts_fulltext_ngram.sql`, `PostFulltextSearchRepository`, `PostSearchKeywordPolicy`.

---

## ADR-018: API·DB 타임스탬프 UTC 저장

- **상태:** 승인
- **날짜:** 2026-07-10
- **배경:** 게시글·회원·신고·백업 등 시각을 DB에서 일관 관리하려면 단일 기준(UTC)이 필요. EC2/RDS/로컬 간 혼선 방지.
- **결정:**
  - `created_at` / `updated_at` 등 **시각 필드** → Java `Instant`, MySQL `DATETIME(6)` **UTC** 저장, API 응답 `…Z`
  - JDBC `serverTimezone=UTC`, API 컨테이너 `TZ=UTC`, JVM `-Duser.timezone=UTC`
  - **개인일지 `record_date`** 는 사용자 달력 날짜 → `LocalDate` + `AppTimeZone.todayKst()` (KST)
  - EC2 **호스트** OS 타임존은 운영 가독성을 위해 `Asia/Seoul` (앱 로직과 분리)
  - 기존 KST 벽시계 데이터 → Flyway `V27__migrate_timestamps_to_utc.sql`
- **대안:** 전역 KST `LocalDateTime` 유지(다중 리전·백업 비교에 불리)
- **영향:** `AppTimeZone`, `BaseTimeEntity`, DTO·Repository·`deployment-aws.md`, docker JDBC URL

---

## ADR-019: 소셜 로그인 (카카오·구글·네이버)

- **상태:** 승인
- **날짜:** 2026-07-10
- **배경:** 이메일 가입만으로는 진입 장벽이 높다. 키는 준비됐으며 MVP 이후 1.5차로 소셜 로그인을 추가한다.
- **결정:**
  - OAuth 2.0 **Authorization Code** — callback은 Next.js `/auth/callback/{provider}`, code 교환·secret은 **Spring Boot**
  - provider 사용자 식별은 `user_oauth_accounts(provider, provider_user_id)` 에 저장
  - 성공 시 기존과 동일한 **Herfree JWT** 발급 (브라우저 세션 저장소)
  - 닉네임 미확정 시 `profileCompletionToken` (15분) → `/signup/oauth`
  - 동일 **실이메일**로 이미 이메일 가입한 경우 409 (계정 연동은 2차)
- **대안:** Spring OAuth2 Client only(카카오·네이버 커스텀 필요), provider JWT를 그대로 API에 사용(권한·탈퇴 정책 분리 어려움)
- **영향:** `V28__user_oauth_accounts.sql`, `OAuthAuthService`, 로그인/가입 UI, `local-secrets.yml` / `.env.local`

---

## ADR-020: 변경 이유 기준의 Journal application service와 운영 facade

- **상태:** 승인
- **날짜:** 2026-07-28
- **배경:** 하나의 JournalService가 개인 기록 CRUD, 개인 대시보드, 30일 리뷰, 동의 기반 공개 통계, 관리자 운영 통계를 함께 처리하면 변경과 권한 검토 범위가 불필요하게 커진다.
- **결정:** 기록·대시보드·리뷰·공개 인사이트를 별도 application service로 나누고, 계산 규칙은 Spring 의존성이 없는 Calculator/Policy로 추출한다. 신고·게시글·댓글을 함께 읽는 관리자 수치는 `AdminJournalStatisticsFacade`에만 둔다.
- **대안:** 범용 BaseService 또는 모든 도메인 Repository를 JournalService에 유지 — 책임과 개인정보 검토 경계가 흐려져 거부.
- **영향:** Controller는 목적별 service만 의존한다. 개인 일지 service는 다른 도메인 Repository를 직접 의존하지 않으며, facade만 운영 read-model 조합의 예외가 된다.

---

## ADR-021: 프론트 feature 경계와 저수준 비동기 primitive

- **상태:** 승인
- **날짜:** 2026-07-28
- **배경:** 페이지와 큰 컴포넌트에 조회·권한·확인·mutation·렌더링이 섞여 있고, 기존 feature hook마다 성공/실패 반환 계약이 다르다.
- **결정:** page는 route 조립, feature container/hook은 상태와 API orchestration, view는 표시를 담당한다. `useAsyncMutation`은 pending/error/중복 실행 방지까지만 공통화하고, 각 feature hook이 기존 업무 의미를 유지한다. UI는 기존 Modal·ConfirmModal·Pagination·Input을 우선 재사용한다.
- **대안:** `useCrud()`와 범용 CRUD Form으로 모든 화면을 통합 — 관리자 제재·신고·일지처럼 규칙이 다른 흐름을 숨기므로 거부.
- **영향:** raw API import는 page에서 제거하고 feature hook으로 이관한다. Vitest/RTL은 순수 정책, hook, 표시 컴포넌트의 빠른 회귀 검증에 사용하며 Playwright는 사용자 여정에 유지한다.

---

## ADR-022: 실제 공통성이 확인될 때만 건강 기록 추상화

- **상태:** 승인
- **날짜:** 2026-07-28
- **배경:** Health Card·Medication 등 미래 기능을 이유로 지금 `RecordService<T>`나 상속 계층을 만들면 Journal 고유의 동의·익명 집계·날짜 규칙까지 잘못 일반화할 위험이 있다.
- **결정:** 현재는 Journal 내부 책임과 vocabulary/consent 경계만 명확히 한다. 두 번째 기록 도메인이 도입되어 소유자, 날짜, 보존, 동의, 집계 규칙이 실제로 공통임이 테스트와 요구사항으로 확인될 때 공통 정책 또는 port를 추출한다.
- **대안:** 선제적 범용 Record 모델 — 추측 기반 추상화와 불필요한 상속으로 거부.
- **영향:** 새 기록 기능은 Journal을 수정하지 않고 자체 feature로 시작하며, 중복이 검증된 축만 공통 모듈로 승격한다.

---

## 변경 이력



| 날짜 | 변경 내용 |

|------|-----------|

| 2026-07-10 | ADR-019: 카카오·구글·네이버 소셜 로그인 (Authorization Code → Herfree JWT) |
| 2026-07-10 | ADR: API·DB 타임스탬프 UTC, 일지 record_date KST 유지 |
| 2026-06-03 | ADR-001~012: Java 17, JWT, MySQL/H2, Docker/RDS, ddl-auto, 패키지·auth/user 분리, 배포·프론트 |
| 2026-06-03 | ADR-012~014: PostgreSQL 미채택, AI FastAPI·Vector DB 로드맵, Spring/FastAPI 역할; compose 경로 루트 통합 |
