# Herfree Platform

헤르페스·감염 불안 사용자를 위한 **익명 커뮤니티 + 비공개 증상 일지 + 운영자 큐레이션** 웹 서비스.

네이버 카페·단톡·유튜브 댓글에 흩어진 대화를 한곳으로 모으되, **게시판은 커뮤니티용**, **정보·영상은 운영자가 직접 올리는 CMS**, **일지는 본인만 보는 기록**으로 역할을 나눴습니다. 1차 MVP는 결제·네이티브 앱·영상 직접 업로드 없이, 실제 런칭 가능한 범위만 구현했습니다.

---

## 이 프로젝트에서 다룬 문제

| 상황 | 접근 |
|------|------|
| 루틴 체크 버튼이 `/journal`로 이동하면서 API·상태가 꼬여 홈에서 오류 | 별도 “일일 체크” 화면을 없애고, **하루 1건 기록(upsert)** 으로 루틴·증상을 함께 저장. 홈에서는 **시트를 그대로 열어** 저장 후 대시보드만 갱신 |
| 위저드형 기록 UI가 길고 끊김 | **단일 스크롤 폼**(`JournalRecordSheet`)으로 통합 — 수면·영양제·스트레스·전조·증상·메모를 한 번에 |
| 비회원·회원 홈 요구가 달랐음 | 비회원은 **랜딩(히어로·퀵액세스)**, 로그인 사용자는 **개인 일지 대시보드**로 분리 |
| 정보글을 커뮤니티 글쓰기처럼 다루기 어려움 | `/admin`에 **정보 올리기** 탭 — 카테고리·본문·미리보기. 커뮤니티 `write` 흐름과 분리 |
| 영상 6개 시드만 있고 이후 관리 불편 | 유튜브 URL 등록 CMS + 공개 목록 **최신 노출 6건** + 관리자 **전체 목록·숨김 복구** API |
| `public/` 경로가 컴포넌트에 흩어짐 | `domain/assets/static.ts` 단일 관리 + `PublicStaticImage` 래퍼 |
| 게시글 이미지 S3 직접 업로드 시 CORS·키 노출 | 브라우저 → Spring → S3 프록시 업로드 ([deployment.md](docs/deployment.md)) |

---

## 구현 범위 (1차 MVP)

### 커뮤니티
- 게시판·게시글·댓글·공감·신고
- 익명 게시, 게시글 이미지(S3)
- 운영자: 게시글·댓글 숨김, 신고 처리, 회원 상태·역할

### 개인 일지 (비공개)
- 날짜별 기록 upsert — 루틴(수면·영양제·컨디션)과 증상·전조·트리거를 **같은 레코드**에 저장
- 대시보드: 재발 없음 일수, 14일 타임라인, 루틴 완료율, 오늘 기록 요약
- 인사이트 탭: 최근 30일 리뷰·패턴 요약
- 커뮤니티용 **익명 집계** API (`/api/journal/insights`) — 개인 식별 데이터 미포함

### 큐레이션 (운영자 CMS)
- **정보글**: `/contents` — 카테고리 필터, 상세 읽기
- **영상**: YouTube URL만 등록, 사이트 내 iframe 재생, 추천·순서 기반 **최대 6개**
- **제품**: API·관리자 CMS는 준비됨 — **런칭 시 UI 비노출** (커뮤니티 신뢰 형성 후 `FEATURE_PRODUCTS_ENABLED`로 공개)

### 인증·권한
- JWT (Stateless), 역할: `USER` · `MODERATOR` · `ADMIN` · `SUPER_ADMIN`
- `/api/admin/**` 역할별 분리 (신고는 모더레이터부터, 콘텐츠·영상은 관리자)

---

## 기술 스택

| 영역 | 선택 |
|------|------|
| Backend | Java 17, Spring Boot 3.5.16, Spring Security, JPA, Flyway, MySQL 8 |
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| 인증 | JWT Bearer |
| 스토리지 | 게시글 이미지 AWS S3 (API 경유 업로드) |
| CI | GitHub Actions — `./gradlew test`, `npm run lint && build` |
| 배포(기준안) | Frontend Amplify/Next.js · API EC2 · private RDS MySQL · [production-architecture.md](docs/production-architecture.md) |

백엔드는 **도메인 단위 패키지**(`auth`, `user`, `post`, `journal`, `content`, `video` …) + `global`(보안·예외·공통). 프론트는 `domain/`(순수 타입·정책), `hooks/`, `components/` 분리.

---

## 저장소 구조

```
herfree-platform/
├── backend/                 # REST API (com.herfree)
│   └── src/main/resources/db/migration/   # Flyway V1~
├── frontend/                # Next.js
├── docs/                    # 요구사항, API, ERD, ADR, 배포
├── infra/scripts/           # AWS release 배포·검증·legacy 백업 스크립트
├── scripts/                 # 로컬 실행·데모용 PowerShell
└── docker-compose.local.yml # 로컬 MySQL 8
```

---

## 로컬 실행

**사전 요구:** JDK 17+, Node 20+, Docker(또는 MySQL 8), Git

```bash
# 1) DB
docker compose -f docker-compose.local.yml up -d

# 2) Backend — backend/application-local.yml 필요 (example 복사)
cd backend && ./gradlew bootRun

# 3) Frontend
cd frontend && npm ci && npm run dev
```

| | URL |
|---|-----|
| API | http://localhost:8080 |
| Web | http://localhost:3000 |
| 운영 화면 | http://localhost:3000/admin |
| 포트폴리오·화면 캡처 | [docs/portfolio.md](docs/portfolio.md) |

Windows에서 한 번에 안내만 보려면: `.\scripts\start-local.ps1`

### 로컬 설정

```bash
cp backend/src/main/resources/application-local.yml.example \
   backend/src/main/resources/application-local.yml
```

시크릿·DB 비밀번호는 git에 넣지 않습니다. ([convention.md](docs/convention.md))

### 개발용 관리자 계정

`application-local.yml` bootstrap으로 기동 시 `SUPER_ADMIN`이 보장됩니다.

| | |
|---|---|
| 이메일 | `ADMIN_EMAIL`에 직접 지정한 로컬 관리자 계정 |
| 비밀번호 | `ADMIN_PASSWORD`에 직접 지정한 로컬 전용 값 |

로그인 후 **정보 올리기** / **영상 등록** 탭에서 콘텐츠를 바로 등록할 수 있습니다.

### Windows 개발 경로

Git·빌드·커밋은 **`C:\dev\herfree-platform`** 기준으로 합니다. OneDrive 등 복사본과 혼용하지 않습니다.

---

## API·스키마 문서

| 문서 | 내용 |
|------|------|
| [requirements.md](docs/requirements.md) | MVP 포함/제외, 로드맵 |
| [api-spec.md](docs/api-spec.md) | REST 엔드포인트 (커뮤니티·일지·admin) |
| [erd.md](docs/erd.md) | 테이블·enum |
| [convention.md](docs/convention.md) | 코딩·커밋 규칙 |
| [deployment-aws.md](docs/deployment-aws.md) | AWS staging/production 배포 (RDS release 경로) |
| [oauth-setup.md](docs/oauth-setup.md) | 카카오·구글·네이버 Dev/Prod OAuth 설정 |
| [decision-log.md](docs/decision-log.md) | ADR (JWT, MySQL, S3 프록시 등) |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | 브랜치·PR |
| [architecture-overview.md](docs/architecture-overview.md) | 도메인·레이어·핵심 Service 맵 (코드 읽기 시작점) |
| [git-workflow.md](docs/git-workflow.md) | `develop`/`main` 브랜치·PR·GitHub 보호·배포 흐름 |
| [health-data-security-standard.md](docs/health-data-security-standard.md) | 건강정보 보안·개인정보·DB·사고 대응 상위 기준 |
| [go-live-checklist.md](docs/go-live-checklist.md) | 실서비스 production 배포 승인 체크리스트 |
| [production-service-operations.md](docs/production-service-operations.md) | 실서비스 하네스·배포·로그·장애 대응 가이드 |
| [beta-release-control-plane.md](docs/beta-release-control-plane.md) | 소규모 베타의 구조·데이터 통제·배포 승인·운영 지점 |
| [production-security-controls.md](docs/production-security-controls.md) | production 보안 불변조건과 코드 검증 위치 |
| [rds-restore-drill.md](docs/rds-restore-drill.md) | 승인형 private RDS 복구훈련과 RPO/RTO 증적 절차 |

### 실서비스 검증 하네스

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\service-harness.ps1
```

하네스 결과는 `artifacts/service-harness/latest.md`에 기록되며, 실제 AWS 자격증명·staging 브라우저 검수·백업 복원·법률/운영 승인은 별도 release gate입니다.

로컬 MySQL/API가 실행 중이면 `service-harness.ps1 -RunLocalSmoke`로 가입·일지 CRUD·삭제·집계 개인정보 smoke를 추가 실행할 수 있습니다.

로컬에서 Swagger: `http://localhost:8080/swagger-ui.html` (기동 시)

---

## 의도적으로 넣지 않은 것 (1차)

결제, PWA/네이티브 앱, 영상 파일 직접 업로드, AI 의료 상담 — [requirements.md §5](docs/requirements.md) 참고.

---

## 라이선스

비공개 프로젝트. 배포 전 라이선스 정책 확정 예정.
