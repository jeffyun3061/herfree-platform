# Herfree Platform — API 명세 (1차 MVP)

기준: [convention.md](convention.md), [erd.md](erd.md), [requirements.md](requirements.md), [decision-log.md](decision-log.md).

Base path: `/api` · 인증: `Authorization: Bearer {accessToken}` (공개 API 제외).

---

## 공통 응답 형식

### 성공 응답

```json
{
  "success": true,
  "message": "요청이 성공했습니다.",
  "data": {}
}
```

### 실패 응답

```json
{
  "success": false,
  "message": "게시글을 찾을 수 없습니다.",
  "data": null
}
```

### 목록 페이징 (게시글·댓글·신고 등)

| Query | 기본 | 설명 |
|-------|------|------|
| `page` | `0` | 0-based 페이지 번호 |
| `size` | `20` | 페이지 크기 (최대 100 권장) |

`data`에 목록·메타를 담을 때 예시:

```json
{
  "success": true,
  "message": "요청이 성공했습니다.",
  "data": {
    "content": [],
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5
  }
}
```

### HTTP 상태 (권장)

| 코드 | 용도 |
|------|------|
| 200 | 조회·수정 성공 |
| 201 | 생성 |
| 204 | 삭제(soft delete) 본문 없음 |
| 400 | Validation |
| 401 | 미인증 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 중복(닉네임·이메일·신고·반응 등) |
| 429 | 로그인 연속 실패 잠금·과도한 요청 |

---

## 8.1 Auth API

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| POST | `/api/auth/signup` | 회원가입 | 비회원 |
| POST | `/api/auth/login` | 로그인 | 비회원 |
| POST | `/api/auth/logout` | 로그아웃 | 회원 |
| POST | `/api/auth/reissue` | Access Token 재발급 | 회원(유효 Refresh 또는 정책에 따른 재인증) |

### Auth — 로그인 실패·잠금

| HTTP | 조건 | message (예) |
|------|------|----------------|
| 401 | 이메일 없음·비밀번호 불일치·탈퇴 계정 | 이메일 또는 비밀번호가 올바르지 않습니다. |
| 403 | 정지 계정 | 정지된 계정입니다. 운영자에게 문의하세요. |
| 429 | 동일 이메일 **10회** 연속 실패 | 로그인 시도 횟수를 초과했습니다. 30분 후 다시 시도해 주세요. |
| 400 | 필드 validation | `email: …` 등 |

### Auth — 토큰 재발급 (`POST /api/auth/reissue`)

1차 MVP는 **Access Token** 중심으로 구현한다. Refresh Token은 1.5차(ADR-002-1)에서 검토한다.

**요청 Body (1차 초안)**

```json
{
  "refreshToken": "optional-if-adopted-later"
}
```

**응답 `data` 예시**

```json
{
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

- 만료·위조 토큰: `401` + `UNAUTHORIZED`
- 재발급 정책은 구현 시 Spring Security 필터와 동기화한다.

---

## 8.2 User API

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| GET | `/api/users/me` | 내 정보 조회 | 회원 |
| PATCH | `/api/users/me/profile` | 프로필 수정 | 회원 |
| DELETE | `/api/users/me` | 회원 탈퇴 | 회원 |
| GET | `/api/users/me/posts` | 내가 작성한 글 조회 | 회원 |

---

## 8.3 Board API

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| GET | `/api/boards` | 게시판 목록 조회 | 전체 |

---

## 8.4 Post API

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| GET | `/api/posts` | 게시글 목록 조회 | 전체 |
| POST | `/api/posts` | 게시글 작성 | 회원 |
| GET | `/api/posts/{postId}` | 게시글 상세 조회 | 전체 |
| PATCH | `/api/posts/{postId}` | 게시글 수정 | 작성자 |
| DELETE | `/api/posts/{postId}` | 게시글 삭제 | 작성자 |
| POST | `/api/posts/images/upload` | 게시글 이미지 업로드 (API→S3, **기본**) | 회원 |
| POST | `/api/posts/images/upload-url` | presigned URL (확장용, 클라이언트 미사용) | 회원 |
| PATCH | `/api/admin/posts/{postId}` | 커뮤니티 게시글 수정 (NOTICE 제외) | 모더레이터+ |
| PATCH | `/api/admin/posts/{postId}/hide` | 게시글 숨김 처리 | 모더레이터+ |
| PATCH | `/api/admin/posts/{postId}/restore` | 게시글 복구 (숨김→노출) | 모더레이터+ |
| GET | `/api/admin/posts` | 커뮤니티 게시글 모더레이션 목록 (NOTICE 제외) | 모더레이터+ |

### Admin 커뮤니티 게시글 목록 Query Parameter

| 이름 | 설명 |
|------|------|
| `keyword` | 제목 검색 (선택) |
| `status` | `ACTIVE` 또는 `HIDDEN` (선택, 미지정 시 둘 다) |
| `page` | 페이지 번호 (0-based) |
| `size` | 페이지 크기 (기본 20) |

### 게시글 목록 조회 Query Parameter

| 이름 | 설명 |
|------|------|
| `boardId` | 게시판 ID |
| `page` | 페이지 번호 |
| `size` | 페이지 크기 |
| `keyword` | 제목·내용 검색 (선택, 빈 값이면 전체 목록) |
| `sort` | 정렬 기준 |

### 게시글 이미지 업로드 (`POST /api/posts/images/upload`) — **기본**

브라우저 → Next `/api` 프록시 → Spring → S3. **S3 CORS 불필요.** 익명 글 작성 시에도 이미지 첨부 가능.

**요청:** `multipart/form-data`, 필드 `file` (JPEG/PNG/WEBP, 최대 10MB)

**응답 data**

```json
{
  "imageUrl": "/api/posts/images/object/posts/{userId}/{uuid}.jpg"
}
```

**이미지 조회:** `GET /api/posts/images/object/posts/{userId}/{uuid}.{ext}` — API가 S3에서 읽어 스트리밍(버킷 비공개 OK). 비로그인 조회 가능.

업로드 순서: (1) 이미지 업로드 API 호출 → (2) 게시글 작성/수정 시 `imageUrl` 전달

**보안:** `imageUrl`은 API 프록시 경로 또는 HTTPS S3/CDN + `posts/{본인 userId}/` prefix만 서버에서 수락한다.

### (확장용) presigned URL (`POST /api/posts/images/upload-url`)

1차 MVP 클라이언트는 사용하지 않음. 대량 트래픽·서버 부하 분산 시 검토.

### PostCreateRequest / PostUpdateRequest / PostDetailResponse

| 필드 | 설명 |
|------|------|
| `imageUrl` | 선택. S3 업로드 완료 후 공개 URL. 수정 시 `null`이면 기존 이미지 유지, 빈 문자열이면 제거 |
| `readable` | **상세 응답 전용.** 현재 사용자가 본문 전체를 열람할 수 있으면 `true`, 아니면 `false`. 비밀사연·문의·1:1 상담 등 마스킹 대상 게시판에서 권한 없을 때 `false` |

#### 비밀사연(`SECRET_STORY`)·비공개 게시판 마스킹

| 게시판 | 목록·상세 제목 (권한 없음) | 상세 본문 (권한 없음) | 열람 가능 주체 |
|--------|---------------------------|----------------------|----------------|
| `SECRET_STORY` | `******` | `비밀 사연 입니다.` | **운영자만** (작성자 포함 일반 회원 불가) |
| `INQUIRY`, `PRIVATE_CONSULT` | `******` | `비밀 사연 입니다.` | 작성자 본인·운영자 |

- 마스킹 시 `readable: false`, `imageUrl`은 `null`.
- 댓글은 마스킹 대상 글에서 **운영자·작성자(문의·상담만)** 만 조회 가능. 비밀사연은 운영자만.

---

## 8.5 Comment API

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| GET | `/api/posts/{postId}/comments` | 댓글 목록 조회 | 전체 |
| POST | `/api/posts/{postId}/comments` | 댓글 작성 | 회원 |
| DELETE | `/api/comments/{commentId}` | 댓글 삭제 | 작성자 |
| PATCH | `/api/admin/comments/{commentId}/hide` | 댓글 숨김 처리 | 모더레이터+ |
| PATCH | `/api/admin/comments/{commentId}/restore` | 댓글 복구 (숨김→노출) | 모더레이터+ |
| GET | `/api/admin/comments` | 댓글 모더레이션 목록 | 모더레이터+ |

### Admin 댓글 목록 Query Parameter

| 이름 | 설명 |
|------|------|
| `keyword` | 댓글 내용 검색 (선택) |
| `status` | `ACTIVE` 또는 `HIDDEN` (선택) |
| `page` | 페이지 번호 |
| `size` | 페이지 크기 (기본 20) |

댓글 목록은 `page`, `size` 페이징을 적용한다.

---

## 8.6 Reaction API

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| POST | `/api/reactions` | 반응 등록 | 회원 |
| DELETE | `/api/reactions/{reactionId}` | 반응 취소 | 회원 |

**요청 Body 예시**

```json
{
  "targetType": "POST",
  "targetId": 1,
  "reactionType": "EMPATHY"
}
```

`reactionType`: `EMPATHY`, `COMFORT`, `HELPFUL`, `SUPPORT`, `SAME` (`erd.md` 참고)

---

## 8.7 Report API

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| POST | `/api/reports` | 신고 등록 | 회원 |
| GET | `/api/admin/reports` | 신고 목록 조회 | 관리자 |
| PATCH | `/api/admin/reports/{reportId}/process` | 신고 처리 | 관리자 |

**신고 등록 Body 예시**

```json
{
  "targetType": "POST",
  "targetId": 1,
  "reason": "SPAM",
  "detail": "상세 사유 (선택)"
}
```

관리자 신고 목록은 `page`, `size`, `status` 필터를 지원한다.

---

## 8.8 Content API

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| GET | `/api/contents` | 칼럼 목록 조회 | 전체 |
| GET | `/api/contents/{contentId}` | 칼럼 상세 조회 | 전체 |
| GET | `/api/admin/contents` | 칼럼 전체 목록 (노출·숨김 포함) | 관리자 |
| POST | `/api/admin/contents` | 칼럼 등록 | 관리자 |
| PATCH | `/api/admin/contents/{contentId}` | 칼럼 수정 | 관리자 |
| PATCH | `/api/admin/contents/{contentId}/hide` | 칼럼 숨김 | 관리자 |
| PATCH | `/api/admin/contents/{contentId}/visibility` | 칼럼 노출 여부 변경 | 관리자 |
| PATCH | `/api/admin/contents/{contentId}/curation` | 칼럼 큐레이션 (정렬·고정) | 관리자 |
| DELETE | `/api/admin/contents/{contentId}` | 칼럼 삭제 (soft delete) | 관리자 |

> **칼럼 작성 권한:** `POST /api/admin/contents` 및 공개 칼럼 작성 API는 **운영자(ADMIN·MODERATOR·SUPER_ADMIN)·DOCTOR·CREATOR**만 허용한다. 일반 회원(`USER`)은 403.

### Admin 칼럼 목록 Query Parameter

| 이름 | 설명 |
|------|------|
| `keyword` | 제목 검색 (선택) |
| `status` | `ACTIVE` 또는 `HIDDEN` (선택) |
| `category` | 카테고리 필터 (선택) |
| `page` | 페이지 번호 |
| `size` | 페이지 크기 (기본 20) |

---

## 8.8.1 Admin Notice API

커뮤니티 **공지사항** 게시판(`NOTICE`) 전용. 일반 회원 글쓰기 불가.

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| GET | `/api/admin/notices` | 공지 목록 (노출·숨김) | 관리자 |
| POST | `/api/admin/notices` | 공지 등록 | 관리자 |
| PATCH | `/api/admin/notices/{postId}` | 공지 수정 | 관리자 |
| PATCH | `/api/admin/notices/{postId}/visibility` | 공지 노출/숨김 | 관리자 |
| PATCH | `/api/admin/notices/{postId}/curation` | 공지 큐레이션 (정렬·고정) | 관리자 |
| DELETE | `/api/admin/notices/{postId}` | 공지 삭제 (soft delete) | 관리자 |

### Admin 공지 목록 Query Parameter

| 이름 | 설명 |
|------|------|
| `keyword` | 제목 검색 (선택) |
| `status` | `ACTIVE` 또는 `HIDDEN` (선택) |
| `page` | 페이지 번호 |
| `size` | 페이지 크기 (기본 20) |

---

## 8.9 Video API

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| GET | `/api/videos` | 영상 목록 조회 (노출·추천, `sort_order` 순, 기본 `size=6`) | 전체 |
| GET | `/api/videos/{videoId}` | 영상 상세 조회 | 전체 |
| GET | `/api/admin/videos` | 영상 전체 목록 (노출·숨김 포함) | 관리자 |
| POST | `/api/admin/videos` | 영상 등록 | 관리자 |
| PATCH | `/api/admin/videos/{videoId}` | 영상 수정 | 관리자 |
| PATCH | `/api/admin/videos/{videoId}/visibility` | 영상 노출 여부 변경 | 관리자 |
| PATCH | `/api/admin/videos/{videoId}/curation` | 영상 큐레이션 (정렬·추천·노출) | 관리자 |
| DELETE | `/api/admin/videos/{videoId}` | 영상 삭제 | 관리자 |

### Admin 영상 목록 Query Parameter

| 이름 | 설명 |
|------|------|
| `keyword` | 제목 검색 (선택) |
| `visible` | `true`(노출) / `false`(숨김), 미지정 시 전체 |
| `page` | 페이지 번호 |
| `size` | 페이지 크기 (기본 20) |

### Frontend 영상 라우트

| 경로 | 설명 |
|------|------|
| `/videos` | 영상 목록 (최신 노출 6개 그리드) |
| `/videos/{videoId}` | 사이트 내 YouTube iframe 재생 |
| `/lounge` | `/videos`로 리다이렉트 (레거시) |

---

## 8.10 Product API

> **런칭 정책:** API·DB는 구현되어 있으나, 1차 공개 UI에서는 제품 탭·`/products` 페이지를 **비노출**한다. 운영 안정 후 `FEATURE_PRODUCTS_ENABLED`로 켠다.

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| GET | `/api/products` | 제품 목록 조회 | 전체 |
| GET | `/api/products/{productId}` | 제품 상세 조회 | 전체 |
| POST | `/api/admin/products` | 제품 등록 | 관리자 |
| PATCH | `/api/admin/products/{productId}` | 제품 수정 | 관리자 |
| PATCH | `/api/admin/products/{productId}/visibility` | 제품 노출 여부 변경 | 관리자 |
| DELETE | `/api/admin/products/{productId}` | 제품 삭제 | 관리자 |

---

## 8.11 Admin API (`/api/admin`)

관리자·모더레이터 전용. `/api/admin/posts/**`, `/api/admin/comments/**`는 `MODERATOR` 이상, 나머지 `/api/admin/**`는 `ADMIN` 이상.

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/admin/users` | 회원 목록 조회 (`page`, `size`, `status` 필터) |
| PATCH | `/api/admin/users/{userId}/status` | 회원 상태 변경 (`ACTIVE`, `SUSPENDED`, `DELETED`) |
| GET | `/api/admin/posts` | 커뮤니티 게시글 모더레이션 목록 (`keyword`, `status`, `page`, `size`) |
| PATCH | `/api/admin/posts/{postId}` | 커뮤니티 게시글 수정 (NOTICE 제외) |
| PATCH | `/api/admin/posts/{postId}/hide` | 게시글 숨김 |
| PATCH | `/api/admin/posts/{postId}/restore` | 게시글 복구 |
| GET | `/api/admin/comments` | 댓글 모더레이션 목록 (`keyword`, `status`, `page`, `size`) |
| PATCH | `/api/admin/comments/{commentId}/hide` | 댓글 숨김 |
| PATCH | `/api/admin/comments/{commentId}/restore` | 댓글 복구 |
| GET | `/api/admin/reports` | 신고 목록 |
| PATCH | `/api/admin/reports/{reportId}/process` | 신고 승인·반려 |
| POST | `/api/admin/contents` | 칼럼 등록 |
| GET | `/api/admin/contents` | 칼럼 목록 (`keyword`, `status`, `category`, `page`, `size`) |
| PATCH | `/api/admin/contents/{contentId}` | 칼럼 수정 |
| PATCH | `/api/admin/contents/{contentId}/hide` | 칼럼 숨김 |
| PATCH | `/api/admin/contents/{contentId}/visibility` | 칼럼 노출 여부 |
| PATCH | `/api/admin/contents/{contentId}/curation` | 칼럼 큐레이션 (정렬·고정) |
| DELETE | `/api/admin/contents/{contentId}` | 칼럼 삭제 |
| GET | `/api/admin/notices` | 공지 목록 (`keyword`, `status`, `page`, `size`) |
| POST | `/api/admin/notices` | 공지 등록 |
| PATCH | `/api/admin/notices/{postId}` | 공지 수정 |
| PATCH | `/api/admin/notices/{postId}/visibility` | 공지 노출 여부 |
| PATCH | `/api/admin/notices/{postId}/curation` | 공지 큐레이션 (정렬·고정) |
| DELETE | `/api/admin/notices/{postId}` | 공지 삭제 |
| POST | `/api/admin/videos` | 영상 등록 |
| GET | `/api/admin/videos` | 영상 목록 (`keyword`, `visible`, `page`, `size`) |
| PATCH | `/api/admin/videos/{videoId}` | 영상 수정 |
| PATCH | `/api/admin/videos/{videoId}/visibility` | 영상 노출 여부 |
| PATCH | `/api/admin/videos/{videoId}/curation` | 영상 큐레이션 (정렬·추천·노출) |
| DELETE | `/api/admin/videos/{videoId}` | 영상 삭제 |
| POST | `/api/admin/products` | 제품 등록 |
| PATCH | `/api/admin/products/{productId}` | 제품 수정 |
| PATCH | `/api/admin/products/{productId}/visibility` | 제품 노출 여부 |
| DELETE | `/api/admin/products/{productId}` | 제품 삭제 |

**신고 처리 Body 예시**

```json
{
  "status": "ACCEPTED",
  "hideTarget": true
}
```

`status`: `ACCEPTED` | `REJECTED`. `hideTarget`이 `true`이면 신고 대상 게시글·댓글을 `HIDDEN` 처리한다.

### 큐레이션 PATCH Body (부분 갱신)

| 대상 | URL | Body 필드 |
|------|-----|-----------|
| 영상 | `/api/admin/videos/{videoId}/curation` | `sortOrder`, `isFeatured`, `isVisible` |
| 칼럼 | `/api/admin/contents/{contentId}/curation` | `sortOrder`, `isPinned` |
| 공지 | `/api/admin/notices/{postId}/curation` | `sortOrder`, `isPinned` |

공개 목록: `sort_order DESC` → `created_at DESC`. 공지·칼럼은 `is_pinned` 우선.

---

## 개인 일지 (Journal)

**프라이버시:** 개인 기록 API는 **본인(`userId`)만** 조회·수정·삭제 가능. 타인 기록 접근 시 `404`로 응답(존재 여부 비공개).  
**관리자**는 `GET /api/admin/journal/stats` **익명 집계만** 조회(개별 메모·userId·이메일 미포함).

### 날짜·시간 형식

| 필드 | 형식 | 예시 |
|------|------|------|
| `recordDate`, `date` | ISO-8601 **날짜 문자열** (`JournalRecordResponse.recordDate`) | `"2026-06-16"` |
| `createdAt`, `updatedAt` | ISO-8601 로컬 문자열 | `"2026-06-16T14:30:00"` |

응답 DTO는 `LocalDate` 대신 **문자열**로 내려 배열 직렬화(`[2026,6,16]`)를 방지한다.

### 회원 전용

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/journal/records` | 일지 upsert (동일 `recordDate`면 갱신) |
| GET | `/api/journal/records` | 내 기록 목록 (`hadSymptoms` 필터 가능) |
| GET | `/api/journal/records/{recordId}` | 내 기록 단건 |
| GET | `/api/journal/records/by-date?date=YYYY-MM-DD` | 날짜별 조회 (없으면 `data: null`) |
| **DELETE** | `/api/journal/records/{recordId}` | **내 기록 영구 삭제** (`204 No Content`) |
| GET | `/api/journal/dashboard` | 코치형 대시보드 (타임라인·패턴·재발 요약) |
| GET | `/api/journal/review-summary` | **최근 30일** 증상 확인·상담 리포트용 집계 (메모·닉네임 **미포함**) |

#### `GET /api/journal/dashboard` 응답 (`JournalDashboardResponse`)

| 필드 | 타입 | 설명 |
|------|------|------|
| `relapseFreeDays` | number | 마지막 재발 이후 무재발 일수 (재발 기록 없으면 첫 기록일 기준) |
| `totalRelapses` | number | 전체 누적 재발 횟수 |
| `monthRelapses` | number | 이번 달 재발 횟수 |
| `yearRelapses` | number | 올해(1/1~12/31) 재발 횟수 |
| `lastRelapseDate` | string \| null | 마지막 재발일 (`YYYY-MM-DD`), 없으면 `null` |
| `routineCompletedToday` | number | 오늘 완료한 루틴 항목 수 (수면·영양제·스트레스, 최대 3) |
| `routineTotalToday` | number | 루틴 항목 총 개수 (항상 `3`) |
| `todayRecord` | `JournalRecordResponse` \| null | 오늘 기록 |
| `recentRelapses` | `JournalRecordResponse[]` | 최근 재발 기록 (최대 5건) |
| `todayStatusSummary` | string | 오늘 상태 한 줄 요약 |
| `todayStatusLevel` | enum | `NOT_RECORDED` \| `STABLE` \| `ATTENTION` \| `RELAPSE` |
| `trendDirection` | enum | `IMPROVING` \| `STABLE` \| `WORSENING` \| `UNKNOWN` |
| `personalPatternLine` | string | 개인 패턴 한 줄 문구 |
| `timelineDays` | `JournalTimelineDayResponse[]` | 최근 14일 타임라인 |

**루틴 완료 기준 (`routineCompletedToday`, 총 3항목)** — 대시보드·위저드와 동일:

| 항목 | 완료 조건 |
|------|-----------|
| 수면 | `avgSleep === H7_PLUS` 또는 `sleepHours >= 7` |
| 영양제 | `supplementTaken === true` |
| 컨디션 | `mood` 또는 `stressLevel` 또는 `memo`(비어 있지 않음) |

`avgSleep` 저장 시 `sleepHours`는 구간 대표값(4.5~7.5)으로 자동 채워질 수 있다. 운동(`exerciseDone`)·약 상태(`medicationStatus`)는 루틴 카드에 포함하지 않는다.

### 공개 (비로그인)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/journal/insights` | **익명** 커뮤니티 집계 인사이트 (개인 식별 불가) |

### 관리자 (ADMIN+)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/admin/journal/stats` | 기록 수·증상 비율·신고 집계 등 **통계만** |

`DELETE`는 본인 소유 검증 후 물리 삭제한다. 민감 건강 기록이므로 클라이언트는 삭제 전 확인 모달을 표시한다.

---

## Error Code (구현 시 확정)

구현 단계에서 `ErrorCode` enum과 HTTP 상태를 매핑한다. 초안:

| Code | HTTP | 설명 |
|------|------|------|
| `VALIDATION_ERROR` | 400 | 요청 값 검증 실패 |
| `UNAUTHORIZED` | 401 | 인증 필요 또는 토큰 만료 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `USER_NOT_FOUND` | 404 | 사용자 없음 |
| `POST_NOT_FOUND` | 404 | 게시글 없음 |
| `COMMENT_NOT_FOUND` | 404 | 댓글 없음 |
| `CONTENT_NOT_FOUND` | 404 | 칼럼 없음 |
| `DUPLICATE_NICKNAME` | 409 | 닉네임 중복 |
| `DUPLICATE_EMAIL` | 409 | 이메일 중복 |
| `DUPLICATE_REPORT` | 409 | 동일 대상 중복 신고 |
| `ALREADY_REACTED` | 409 | 동일 대상·동일 반응 중복 |

---

## OpenAPI

- SpringDoc: `/swagger-ui.html`, `/v3/api-docs`
- 구현 후 annotation과 본 문서를 동기화한다.
