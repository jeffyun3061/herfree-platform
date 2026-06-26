# Herfree Platform — Architecture Decision Record (ADR)



핵심 기술 결정은 구현 전 **승인** 상태로 유지한다. 신규 의존성·인프라 변경은 ADR 추가 후 반영한다.



---



## ADR-001: Java 17 + Spring Boot 3.3.x



- **상태:** 승인

- **날짜:** 2026-06-03

- **배경:** LTS 안정성, Spring Boot 3.x Jakarta, 포트폴리오·CI·EC2 환경 통일. Java 21도 가능하나 팀·호스팅 편차를 줄이기 위해 단일 LTS 선택.

- **결정:** **Java 17** + **Spring Boot 3.3.x** (로컬·Docker·GitHub Actions·EC2 JRE 동일)

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



## ADR-016: AWS S3 SDK — 게시글 이미지 업로드



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

## 변경 이력



| 날짜 | 변경 내용 |

|------|-----------|

| 2026-06-03 | ADR-001~012: Java 17, JWT, MySQL/H2, Docker/RDS, ddl-auto, 패키지·auth/user 분리, 배포·프론트 |
| 2026-06-03 | ADR-012~014: PostgreSQL 미채택, AI FastAPI·Vector DB 로드맵, Spring/FastAPI 역할; compose 경로 루트 통합 |


