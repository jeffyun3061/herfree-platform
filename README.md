# Herfree Platform

헤르페스 환우·감염 불안 사용자를 위한 **커뮤니티 중심 프라이빗 헬스케어 웹앱** 모노레포입니다.

## 개발 원본 경로 (Windows)

| 항목 | 경로 |
|------|------|
| **원본 저장소** | `C:\dev\herfree-platform` |
| Cursor/VS Code | **File → Open Folder** → 위 경로 (또는 `herfree-platform.code-workspace` 더블클릭) |
| 로컬 실행 안내 | `.\scripts\start-local.ps1` |
| Cursor 열기 | `.\scripts\open-dev.ps1` |

> OneDrive·바탕화면 등 **복사본 폴더는 사용하지 않습니다.** Git·빌드·커밋은 `C:\dev\herfree-platform`에서만 진행하세요. 익명 게시·신고·운영자 관리와 전문가 정보·YouTube 큐레이션·제품 링크를 하나의 서비스에서 제공합니다.

**로컬 DB:** `docker compose -f docker-compose.local.yml up -d` → MySQL 8 (`herfree_db` @ `localhost:3306`)

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | Java 17, Spring Boot 3.3.x, Spring Security, JWT, Spring Data JPA, MySQL 8, Flyway, Jakarta Validation, Lombok, SpringDoc OpenAPI |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| DB | MySQL 8 (로컬 Docker / 운영 RDS) |
| CI/CD | GitHub Actions |
| 배포 | Backend — EC2 + Docker + Nginx · Frontend — Vercel · DB — AWS RDS |

## 저장소 구조

```
herfree-platform/
├── backend/          # Spring Boot API (com.herfree)
├── frontend/         # Next.js 웹앱
├── docs/             # 요구사항, API, ERD, 컨벤션, 배포, ADR
└── infra/            # Docker, Nginx, 배포 스크립트 (구성 예정)
```

## 문서

| 문서 | 설명 |
|------|------|
| [requirements.md](docs/requirements.md) | MVP 범위·제외·로드맵 |
| [convention.md](docs/convention.md) | 백엔드·프론트 개발 규칙 |
| [erd.md](docs/erd.md) | DB 스키마·enum |
| [api-spec.md](docs/api-spec.md) | REST API 명세 |
| [deployment.md](docs/deployment.md) | 환경·CI/CD·배포 |
| [decision-log.md](docs/decision-log.md) | 아키텍처 의사결정(ADR) |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | 브랜치·커밋·PR 가이드 |

## 로컬 개발 사전 요구

| 항목 | 버전 |
|------|------|
| JDK | 17 이상 |
| Node.js | 20 LTS 이상 |
| MySQL | 8.0 이상 (또는 Docker Compose) |
| Git | 2.x |

## 로컬 실행 (구현 후)

```bash
# MySQL (저장소 루트 docker-compose.local.yml)
docker compose -f docker-compose.local.yml up -d

# Backend
cd backend
./gradlew bootRun

# Frontend
cd frontend
npm ci
npm run dev
```

### 로컬 고정 관리자 (개발용)

`application-local.yml` bootstrap으로 **서버 기동 시** 아래 계정이 `SUPER_ADMIN`으로 보장됩니다.

| 항목 | 값 |
|------|-----|
| 이메일 | `admin@herfree.local` |
| 비밀번호 | `HerfreeAdmin01` |
| 운영 화면 | http://localhost:3000/admin |

> `admin@naver.com` 등 예전 계정은 **일반 USER**일 수 있습니다. 로컬 관리자는 위 계정을 쓰세요.  
> 백엔드 재시작 후 로그인 → `/admin` 접속.

- API 기본 URL: `http://localhost:8080`
- 프론트 개발 서버: `http://localhost:3000` (Next.js 기본)
- 시크릿·운영 설정은 git에 포함하지 않습니다. `application-local.yml.example`을 복사해 로컬만 설정합니다. ([convention.md](docs/convention.md))

## 1차 MVP (요약)

- 회원가입·로그인(JWT)·닉네임 커뮤니티
- 게시판·게시글·댓글·공감·신고
- 관리자 숨김·신고 처리 (`/api/admin/**`)
- YouTube 영상·전문가 정보글·제품 외부 링크 큐레이션
- 모바일 웹 우선 UI

상세 포함/제외는 [requirements.md](docs/requirements.md)를 따릅니다.

## 라이선스

비공개 프로젝트 — 배포 전 라이선스 정책을 확정합니다.
