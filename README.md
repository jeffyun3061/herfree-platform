# Herfree Platform

헤르페스·감염 불안 사용자를 위한 익명 커뮤니티와 비공개 증상 일지를 한곳에서 제공하는 모바일 중심 웹 서비스입니다.

게시판은 서로의 경험을 나누는 공간으로, 개인 일지는 본인만 확인하는 기록으로 분리했습니다. 운영자는 정보글과 영상을 CMS에서 관리하고, 신고·숨김 처리로 커뮤니티를 운영할 수 있도록 구성했습니다.

## 프로젝트 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | Herfree Platform |
| 형태 | 풀스택 개인 프로젝트 |
| 대상 | 헤르페스·감염 불안을 겪는 사용자 |
| 핵심 기능 | 익명 커뮤니티, 비공개 증상 일지, 운영자 콘텐츠 관리 |
| 저장소 | [jeffyun3061/herfree-platform](https://github.com/jeffyun3061/herfree-platform) |

## 해결하려는 문제

- 정보가 카페, 단톡방, 영상 댓글에 흩어져 필요한 내용을 찾기 어려웠습니다.
- 공개 게시글과 개인적인 건강 기록을 같은 방식으로 다루면 사생활 보호가 어렵습니다.
- 운영자가 정보글과 영상을 관리할 별도 공간이 필요했습니다.

이를 해결하기 위해 커뮤니티, 개인 일지, 운영자 CMS를 각각의 도메인으로 나누고 접근 권한도 분리했습니다.

## 주요 기능

### 커뮤니티

- 게시판별 게시글·댓글 조회 및 작성
- 익명 게시와 익명 댓글
- 공감 반응, 스크랩, 신고
- 작성자와 운영자 권한에 따른 수정·삭제·숨김 처리
- 게시글 이미지 업로드 및 S3 저장

### 개인 일지

- 날짜별 수면, 영양제, 컨디션, 전조, 증상, 메모 기록
- 같은 날짜의 기록은 upsert하여 하루 한 건으로 관리
- 개인 대시보드와 최근 기록 리뷰
- 건강정보 동의가 유효한 사용자만 기록 API 사용
- 공개 인사이트는 개인 식별이 불가능한 집계만 제공

### 운영자 CMS

- 공지사항과 정보글 등록·수정·숨김
- YouTube URL 기반 영상 등록·정렬·노출 관리
- 신고 처리와 회원 상태 관리

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| Backend | Java 17, Spring Boot, Spring Security, Spring Data JPA |
| Database | MySQL 8, Flyway |
| Authentication | JWT, OAuth(Kakao·Google·Naver) |
| Storage | AWS S3, Spring API 프록시 업로드 |
| Deploy | AWS Amplify/Next.js, EC2, Nginx, private RDS |
| CI | GitHub Actions |

## 시스템 아키텍처

브라우저는 Next.js 화면과 `/api` 프록시를 사용하고, Spring Boot가 인증·권한·도메인 로직을 처리합니다. 데이터는 MySQL에 저장하며 게시글 이미지는 Spring API를 거쳐 S3에 보관합니다.

[draw.io 아키텍처 파일](./herfree_architecture.drawio)

```text
Browser
  -> Next.js App Router / BFF
  -> Spring Boot REST API
       -> MySQL 8
       -> AWS S3
       -> OAuth Provider / SMTP
```

## 사용자 주요 흐름

### 회원가입과 개인 일지

1. 이메일 또는 OAuth로 가입합니다.
2. 서버가 사용자, 프로필, 약관 동의 이력을 저장하고 JWT를 발급합니다.
3. 개인 일지를 처음 저장할 때 건강정보 동의 여부를 확인합니다.
4. `recordDate` 기준으로 기록을 생성하거나 기존 기록을 갱신합니다.
5. 대시보드는 개인 기록만 조회하고, 공개 인사이트는 동의 회원의 비식별 집계만 사용합니다.

### 게시글 이미지

1. 클라이언트가 Spring API에 이미지를 전송합니다.
2. API가 파일 형식과 크기를 검증합니다.
3. 서버가 S3에 저장하고 게시글 이미지 메타데이터를 `post_images`에 기록합니다.
4. 이미지 조회 시 게시글 공개 범위와 권한을 다시 확인합니다.

[draw.io 사용자 흐름 파일](./herfree_flow.drawio)

## ERD

ERD는 포트폴리오 설명에 필요한 핵심 테이블만 표현했습니다. 관리자 감사 로그, 비밀번호 재설정 토큰, 운영 이벤트 로그처럼 운영에 필요한 보조 테이블은 도식에서 제외했습니다.

[draw.io ERD 파일](./herfree_erd.drawio)

핵심 관계는 다음과 같습니다.

- `users` 1 : 1 `user_profiles`
- `users` 1 : N `posts`, `comments`, `journal_records`
- `boards` 1 : N `posts`
- `posts` 1 : N `comments`, `post_images`
- `users` N : N `posts` through `post_bookmarks`
- `contents`와 `videos`는 운영자가 등록하고 공개 여부를 별도로 관리합니다.

## API 명세

Base path는 `/api`이며 공개 API를 제외한 요청은 `Authorization: Bearer {accessToken}`을 사용합니다.

| 영역 | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| Auth | POST | `/auth/signup` | 이메일 회원가입 |
| Auth | POST | `/auth/login` | 로그인 및 JWT 발급 |
| User | GET | `/users/me` | 내 정보 조회 |
| Board | GET | `/boards` | 게시판 목록 조회 |
| Post | GET/POST | `/posts` | 게시글 조회·작성 |
| Comment | GET/POST | `/posts/{postId}/comments` | 댓글 조회·작성 |
| Reaction | POST/DELETE | `/reactions` | 공감 등록·취소 |
| Report | POST | `/reports` | 게시글·댓글 신고 |
| Journal | POST | `/journal/records` | 날짜별 일지 upsert |
| Journal | GET | `/journal/dashboard` | 개인 대시보드 조회 |
| Content | GET | `/contents` | 정보글 목록 조회 |
| Video | GET | `/videos` | 공개 영상 목록 조회 |
| Admin | PATCH | `/admin/posts/{postId}/hide` | 게시글 숨김 |
| Admin | POST | `/admin/contents` | 정보글 등록 |
| Admin | POST | `/admin/videos` | 영상 등록 |

전체 명세는 저장소의 [`docs/api-spec.md`](https://github.com/jeffyun3061/herfree-platform/blob/main/docs/api-spec.md)에서 확인할 수 있습니다.

## 보안과 데이터 처리

- `users`와 `user_profiles`를 분리해 인증 정보와 노출 정보를 나눴습니다.
- 게시글·댓글·회원은 상태값으로 숨김과 탈퇴를 관리합니다.
- 익명 게시글도 내부적으로 작성자 ID를 유지해 신고와 권한 검증을 수행합니다.
- 개인 일지는 본인 user ID를 기준으로 조회하며, 탈퇴 시 건강 기록을 삭제합니다.
- 브라우저가 S3에 직접 접근하지 않고 Spring API가 업로드를 중계합니다.

## 프로젝트 구조

```text
herfree-platform/
├── backend/       # Spring Boot REST API
├── frontend/      # Next.js App Router
├── docs/          # 요구사항·API·ERD·배포 문서
├── infra/         # AWS·Nginx·배포 스크립트
└── scripts/       # 로컬 실행·검증 스크립트
```

## 실행 방법

```bash
# MySQL
docker compose -f docker-compose.local.yml up -d

# Backend
cd backend
./gradlew bootRun

# Frontend
cd frontend
npm ci
npm run dev
```

| 서비스 | 주소 |
| --- | --- |
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:8080` |
| Admin | `http://localhost:3000/admin` |

## 정리

이 프로젝트에서 가장 중요하게 본 부분은 기능을 많이 넣는 것보다 데이터의 공개 범위를 나누는 일이었습니다. 커뮤니티 데이터는 운영 정책에 따라 숨김 처리하고, 개인 일지는 사용자 본인만 접근하게 하여 서비스 성격에 맞는 권한 경계를 구현했습니다.
