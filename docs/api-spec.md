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

---

## 8.1 Auth API

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| POST | `/api/auth/signup` | 회원가입 | 비회원 |
| POST | `/api/auth/login` | 로그인 | 비회원 |
| POST | `/api/auth/logout` | 로그아웃 | 회원 |
| POST | `/api/auth/reissue` | Access Token 재발급 | 회원(유효 Refresh 또는 정책에 따른 재인증) |

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
| PATCH | `/api/admin/posts/{postId}/hide` | 게시글 숨김 처리 | 관리자 |

### 게시글 목록 조회 Query Parameter

| 이름 | 설명 |
|------|------|
| `boardId` | 게시판 ID |
| `page` | 페이지 번호 |
| `size` | 페이지 크기 |
| `keyword` | 검색어 |
| `sort` | 정렬 기준 |

---

## 8.5 Comment API

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| GET | `/api/posts/{postId}/comments` | 댓글 목록 조회 | 전체 |
| POST | `/api/posts/{postId}/comments` | 댓글 작성 | 회원 |
| DELETE | `/api/comments/{commentId}` | 댓글 삭제 | 작성자 |
| PATCH | `/api/admin/comments/{commentId}/hide` | 댓글 숨김 처리 | 관리자 |

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
| GET | `/api/contents` | 정보글 목록 조회 | 전체 |
| GET | `/api/contents/{contentId}` | 정보글 상세 조회 | 전체 |
| POST | `/api/admin/contents` | 정보글 등록 | 관리자 |
| PATCH | `/api/admin/contents/{contentId}` | 정보글 수정 | 관리자 |
| PATCH | `/api/admin/contents/{contentId}/hide` | 정보글 숨김 | 관리자 |

---

## 8.9 Video API

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| GET | `/api/videos` | 영상 목록 조회 | 전체 |
| GET | `/api/videos/{videoId}` | 영상 상세 조회 | 전체 |
| POST | `/api/admin/videos` | 영상 등록 | 관리자 |
| PATCH | `/api/admin/videos/{videoId}` | 영상 수정 | 관리자 |
| PATCH | `/api/admin/videos/{videoId}/visibility` | 영상 노출 여부 변경 | 관리자 |

---

## 8.10 Product API

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| GET | `/api/products` | 제품 목록 조회 | 전체 |
| GET | `/api/products/{productId}` | 제품 상세 조회 | 전체 |
| POST | `/api/admin/products` | 제품 등록 | 관리자 |
| PATCH | `/api/admin/products/{productId}` | 제품 수정 | 관리자 |
| PATCH | `/api/admin/products/{productId}/visibility` | 제품 노출 여부 변경 | 관리자 |

---

## 8.11 Admin API (`/api/admin`)

관리자(`ADMIN` 권한) 전용. 모든 경로는 `Authorization: Bearer` + 역할 검증이 필요하다.

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/admin/users` | 회원 목록 조회 (`page`, `size`, `status` 필터) |
| PATCH | `/api/admin/users/{userId}/status` | 회원 상태 변경 (`ACTIVE`, `SUSPENDED`, `DELETED`) |
| PATCH | `/api/admin/posts/{postId}/hide` | 게시글 숨김 |
| PATCH | `/api/admin/comments/{commentId}/hide` | 댓글 숨김 |
| GET | `/api/admin/reports` | 신고 목록 |
| PATCH | `/api/admin/reports/{reportId}/process` | 신고 승인·반려 |
| POST | `/api/admin/contents` | 정보글 등록 |
| PATCH | `/api/admin/contents/{contentId}` | 정보글 수정 |
| PATCH | `/api/admin/contents/{contentId}/hide` | 정보글 숨김 |
| POST | `/api/admin/videos` | 영상 등록 |
| PATCH | `/api/admin/videos/{videoId}` | 영상 수정 |
| PATCH | `/api/admin/videos/{videoId}/visibility` | 영상 노출 여부 |
| POST | `/api/admin/products` | 제품 등록 |
| PATCH | `/api/admin/products/{productId}` | 제품 수정 |
| PATCH | `/api/admin/products/{productId}/visibility` | 제품 노출 여부 |

**신고 처리 Body 예시**

```json
{
  "status": "ACCEPTED",
  "hideTarget": true
}
```

`status`: `ACCEPTED` | `REJECTED`. `hideTarget`이 `true`이면 신고 대상 게시글·댓글을 `HIDDEN` 처리한다.

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
| `CONTENT_NOT_FOUND` | 404 | 정보글 없음 |
| `DUPLICATE_NICKNAME` | 409 | 닉네임 중복 |
| `DUPLICATE_EMAIL` | 409 | 이메일 중복 |
| `DUPLICATE_REPORT` | 409 | 동일 대상 중복 신고 |
| `ALREADY_REACTED` | 409 | 동일 대상·동일 반응 중복 |

---

## OpenAPI

- SpringDoc: `/swagger-ui.html`, `/v3/api-docs`
- 구현 후 annotation과 본 문서를 동기화한다.
