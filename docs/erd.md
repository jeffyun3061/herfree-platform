# Herfree Platform — ERD 설계서

## 1. DB 설계 원칙

Herfree Platform의 데이터베이스는 커뮤니티 중심 서비스 운영을 기준으로 설계한다. 민감 질환 커뮤니티 특성을 고려하여 사용자 인증 정보와 커뮤니티 노출 정보를 분리하고, 게시글/댓글/신고/반응/콘텐츠/제품 데이터를 도메인별로 관리한다.

주요 원칙은 다음과 같다.

1. 인증 정보와 프로필 정보를 분리한다.
2. 게시글과 댓글은 완전 삭제보다 `status` 기반 soft delete를 우선한다.
3. 게시글 작성자는 익명 표시를 선택할 수 있다.
4. 신고 대상은 게시글, 댓글, 사용자로 확장 가능하게 설계한다.
5. 유튜브 영상은 직접 업로드하지 않고 URL 기반으로 관리한다.
6. 제품은 1차에서 외부 구매 링크 기반으로 관리한다.
7. 추후 증상 기록, 북마크, 알림, 결제, 앱 확장을 고려한다.
8. MySQL 8.x 타입·charset `utf8mb4_unicode_ci`를 기준으로 한다.

## 1.1 MySQL 타입 기준

| 용도 | MySQL 타입 | 비고 |
|------|------------|------|
| PK / FK | `BIGINT` | `AUTO_INCREMENT` |
| 이메일·닉네임·제목 | `VARCHAR(255)` | 필요 시 길이 조정 |
| 본문·상세 | `TEXT` | 게시글·댓글·신고 상세 |
| enum성 코드 | `VARCHAR(50)` | role, status, board_type 등 |
| 불리언 | `TINYINT(1)` 또는 `BOOLEAN` | JPA `boolean` 매핑 |
| 일시 | `DATETIME(6)` | `created_at`, `updated_at` |
| 금액(원) | `INT` | 제품 `price` |

## 1.2 Soft delete

`posts`, `comments`, `contents`는 물리 삭제 대신 `status`로 관리한다.

| status | 의미 |
|--------|------|
| `ACTIVE` | 정상 노출 |
| `HIDDEN` | 관리자·신고 처리에 의한 숨김 |
| `DELETED` | 작성자 삭제 또는 탈퇴 연동 |

회원은 `users.status` (`ACTIVE`, `SUSPENDED`, `DELETED`)로 계정 상태를 표현한다.

## 1.3 익명 정책

- `posts.is_anonymous`, `comments.is_anonymous`가 `true`이면 API 응답의 작성자 표시명은 **「익명」** 등으로 마스킹한다.
- `user_id`는 DB에 유지한다(본인 수정·삭제, 신고, 관리자 숨김, 감사 목적).
- 익명 글도 작성자 본인·`ADMIN`/`MODERATOR`는 식별 가능한 내부 정책을 Service 계층에서 적용한다.

## 1.4 Unique 제약 (필수)

| 테이블 | 제약명 (권장) | 컬럼 | 목적 |
|--------|---------------|------|------|
| `reports` | `uk_reports_reporter_target` | `reporter_id`, `target_type`, `target_id` | 동일 대상 중복 신고 방지 |
| `reactions` | `uk_reactions_user_target_type` | `user_id`, `target_type`, `target_id`, `reaction_type` | 동일 반응 중복 방지 |
| `users` | (unique) | `email` | 로그인 식별 |
| `user_profiles` | (unique) | `user_id`, `nickname` | 1:1 프로필·닉네임 유일 |

## 2. 1차 핵심 테이블

- `users`
- `user_profiles`
- `boards`
- `posts`
- `comments`
- `reactions`
- `reports`
- `contents`
- `videos`
- `post_images`
- `products`

## 3. 1.5차 확장 테이블

- `symptom_records`
- `bookmarks`
- `notifications`

## 4. 2차 확장 테이블

- `product_reviews`
- `orders`
- `payments`
- `expert_profiles`
- `attachments`

## 4.1 MVP 1 범위 — AI 테이블 미포함

**MVP 1 ERD에는 AI 관련 테이블을 포함하지 않는다.** AI 의료 상담·RAG 기능은 로드맵 항목이며, 메인 DB는 커뮤니티·인증·콘텐츠 도메인에 집중한다.

## 5. AI 기능 확장 테이블 (후속 — MySQL 메타 + Vector DB)

AI 기능 도입 시 **메인 DB는 MySQL 8을 유지**한다. 대화 메타·피드백 등 관계형 데이터는 MySQL `ai_*` 테이블에, **문서 임베딩·유사도 검색**은 별도 Vector DB(Chroma, FAISS, Pinecone, Qdrant 등)에 둔다. pgvector·PostgreSQL 전환은 채택하지 않는다 (`decision-log.md` ADR-012~013).

| 테이블 | 용도 (예정) |
|--------|-------------|
| `ai_conversations` | 사용자별 AI 대화 세션 (user_id, title, status, created_at) |
| `ai_messages` | 세션 내 메시지 (conversation_id, role, content, token_count) |
| `ai_feedbacks` | 응답 품질 피드백 (message_id, rating, comment) |
| `knowledge_documents` | RAG 지식 문서 메타 (title, source_url, vector_ref, status) |

- FastAPI AI 서비스가 Vector DB와 연동; Spring은 필요 시 `ai_*` CRUD·감사 API만 제공
- 상세 스키마·인덱스는 AI 기능 착수 시 별도 migration으로 추가

## 6. 테이블 상세

### 6.1 users

사용자 인증과 권한 정보를 저장한다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGINT PK | 사용자 ID |
| `email` | VARCHAR UNIQUE | 로그인 이메일 |
| `password` | VARCHAR | 암호화된 비밀번호 |
| `role` | VARCHAR | USER, CREATOR, DOCTOR, MODERATOR, ADMIN |
| `status` | VARCHAR | ACTIVE, SUSPENDED, DELETED |
| `created_at` | DATETIME | 생성일 |
| `updated_at` | DATETIME | 수정일 |

### 6.2 user_profiles

사용자의 커뮤니티 노출 정보를 저장한다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGINT PK | 프로필 ID |
| `user_id` | BIGINT FK | 사용자 ID |
| `nickname` | VARCHAR UNIQUE | 닉네임 |
| `profile_image_url` | VARCHAR | 프로필 이미지 URL |
| `bio` | VARCHAR | 자기소개 |
| `is_public` | BOOLEAN | 프로필 공개 여부 |
| `created_at` | DATETIME | 생성일 |
| `updated_at` | DATETIME | 수정일 |

### 6.3 boards

게시판 정보를 저장한다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGINT PK | 게시판 ID |
| `name` | VARCHAR | 게시판 이름 |
| `description` | VARCHAR | 게시판 설명 |
| `board_type` | VARCHAR | 게시판 타입 |
| `sort_order` | INT | 노출 순서 |
| `is_active` | BOOLEAN | 사용 여부 |
| `created_at` | DATETIME | 생성일 |
| `updated_at` | DATETIME | 수정일 |

`board_type` 예시:

- NOTICE
- PHOBIA
- SYMPTOM
- EXPERIENCE
- RELATIONSHIP
- SUPPORT
- EXPERT
- PRODUCT_REVIEW
- FREE

### 6.4 posts

게시글 정보를 저장한다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGINT PK | 게시글 ID |
| `board_id` | BIGINT FK | 게시판 ID |
| `user_id` | BIGINT FK | 작성자 ID |
| `title` | VARCHAR | 제목 |
| `content` | TEXT | 내용 |
| `view_count` | INT | 조회수 |
| `status` | VARCHAR | ACTIVE, HIDDEN, DELETED |
| `visibility` | VARCHAR | PUBLIC, MEMBERS_ONLY, PRIVATE |
| `is_anonymous` | BOOLEAN | 익명 여부 |
| `sort_order` | INT | 관리자 수동 정렬 (DESC, 공지 큐레이션) |
| `is_pinned` | BOOLEAN | 공지 상단 고정 |
| `created_at` | DATETIME | 생성일 |
| `updated_at` | DATETIME | 수정일 |

### 6.5 comments

댓글 정보를 저장한다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGINT PK | 댓글 ID |
| `post_id` | BIGINT FK | 게시글 ID |
| `user_id` | BIGINT FK | 작성자 ID |
| `parent_id` | BIGINT FK NULL | 부모 댓글 ID |
| `content` | TEXT | 댓글 내용 |
| `status` | VARCHAR | ACTIVE, HIDDEN, DELETED |
| `is_anonymous` | BOOLEAN | 익명 여부 |
| `created_at` | DATETIME | 생성일 |
| `updated_at` | DATETIME | 수정일 |

`parent_id`는 대댓글 확장을 위해 설계한다. 1차 MVP에서는 대댓글을 구현하지 않아도 된다.

### 6.6 reactions

게시글 또는 댓글에 대한 공감 반응을 저장한다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGINT PK | 반응 ID |
| `user_id` | BIGINT FK | 사용자 ID |
| `target_type` | VARCHAR | POST, COMMENT |
| `target_id` | BIGINT | 대상 ID |
| `reaction_type` | VARCHAR | 반응 타입 |
| `created_at` | DATETIME | 생성일 |

`reaction_type` 예시:

- EMPATHY
- COMFORT
- HELPFUL
- SUPPORT
- SAME

**Unique:** `(user_id, target_type, target_id, reaction_type)` — `uk_reactions_user_target_type`

### 6.7 reports

신고 정보를 저장한다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGINT PK | 신고 ID |
| `reporter_id` | BIGINT FK | 신고자 ID |
| `target_type` | VARCHAR | POST, COMMENT, USER |
| `target_id` | BIGINT | 신고 대상 ID |
| `reason` | VARCHAR | 신고 사유 |
| `detail` | TEXT | 상세 내용 |
| `status` | VARCHAR | PENDING, ACCEPTED, REJECTED |
| `processed_by` | BIGINT FK NULL | 처리 관리자 ID |
| `processed_at` | DATETIME NULL | 처리일 |
| `created_at` | DATETIME | 신고일 |

**Unique:** `(reporter_id, target_type, target_id)` — `uk_reports_reporter_target`

### 6.8 contents

운영자, 유튜버, 전문가가 작성하는 정보 콘텐츠를 저장한다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGINT PK | 콘텐츠 ID |
| `author_id` | BIGINT FK | 작성자 ID |
| `title` | VARCHAR | 제목 |
| `content` | TEXT | 내용 |
| `category` | VARCHAR | 콘텐츠 카테고리 |
| `content_type` | VARCHAR | CREATOR, DOCTOR, ADMIN |
| `status` | VARCHAR | ACTIVE, HIDDEN, DELETED |
| `sort_order` | INT | 관리자 수동 정렬 (DESC) |
| `is_pinned` | BOOLEAN | 카테고리 내 상단 고정 |
| `created_at` | DATETIME | 생성일 |
| `updated_at` | DATETIME | 수정일 |

`category` 예시:

- BASIC
- TEST
- RECURRENCE
- PREVENTION
- RELATIONSHIP
- FAQ

### 6.9 videos

유튜브 영상 정보를 저장한다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGINT PK | 영상 ID |
| `title` | VARCHAR | 영상 제목 |
| `youtube_url` | VARCHAR | 유튜브 URL |
| `youtube_video_id` | VARCHAR | 유튜브 videoId |
| `thumbnail_url` | VARCHAR | 썸네일 URL |
| `description` | TEXT | 영상 설명 |
| `related_board_id` | BIGINT FK NULL | 연결 게시판 ID |
| `is_visible` | BOOLEAN | 노출 여부 |
| `sort_order` | INT | 관리자 수동 정렬 (DESC) |
| `is_featured` | BOOLEAN | 공개 목록 추천 노출 |
| `created_at` | DATETIME | 생성일 |
| `updated_at` | DATETIME | 수정일 |

### 6.11 post_images

게시글 첨부 이미지. 1차는 게시글당 1장이지만 `sort_order`로 다중 이미지 확장을 열어 둔다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGINT PK | 이미지 ID |
| `post_id` | BIGINT FK | 게시글 ID |
| `image_url` | VARCHAR | S3 공개 URL |
| `sort_order` | INT | 정렬 순서 (0부터) |
| `created_at` | DATETIME | 생성일 |
| `updated_at` | DATETIME | 수정일 |

### 6.12 products

제품 큐레이션 정보를 저장한다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGINT PK | 제품 ID |
| `name` | VARCHAR | 제품명 |
| `category` | VARCHAR | 제품 카테고리 |
| `image_url` | VARCHAR | 제품 이미지 URL |
| `description` | TEXT | 제품 설명 |
| `price` | INT | 가격 |
| `external_url` | VARCHAR | 외부 구매 링크 |
| `is_visible` | BOOLEAN | 노출 여부 |
| `sort_order` | INT | 노출 순서 (큰 값이 위) |
| `is_featured` | BOOLEAN | 공개 목록(`/videos`) 추천·우선 노출 |
| `created_at` | DATETIME | 생성일 |
| `updated_at` | DATETIME | 수정일 |

## 7. 주요 관계

- users 1 : 1 user_profiles
- users 1 : N posts
- users 1 : N comments
- users 1 : N reactions
- users 1 : N reports
- boards 1 : N posts
- posts 1 : N comments
- users 1 : N contents
- boards 1 : N videos
- posts 1 : N post_images

## 8. dbdiagram 초안

```dbml
Table users {
  id bigint [pk, increment]
  email varchar [not null, unique]
  password varchar [not null]
  role varchar [not null]
  status varchar [not null]
  created_at datetime
  updated_at datetime
}

Table user_profiles {
  id bigint [pk, increment]
  user_id bigint [not null, unique]
  nickname varchar [not null, unique]
  profile_image_url varchar
  bio varchar
  is_public boolean [not null, default: true]
  created_at datetime
  updated_at datetime
}

Table boards {
  id bigint [pk, increment]
  name varchar [not null]
  description varchar
  board_type varchar [not null]
  sort_order int [not null]
  is_active boolean [not null, default: true]
  created_at datetime
  updated_at datetime
}

Table posts {
  id bigint [pk, increment]
  board_id bigint [not null]
  user_id bigint [not null]
  title varchar [not null]
  content text [not null]
  view_count int [not null, default: 0]
  status varchar [not null]
  visibility varchar [not null]
  is_anonymous boolean [not null, default: false]
  sort_order int [not null, default: 0]
  is_pinned boolean [not null, default: false]
  created_at datetime
  updated_at datetime
}

Table comments {
  id bigint [pk, increment]
  post_id bigint [not null]
  user_id bigint [not null]
  parent_id bigint
  content text [not null]
  status varchar [not null]
  is_anonymous boolean [not null, default: false]
  created_at datetime
  updated_at datetime
}

Table reactions {
  id bigint [pk, increment]
  user_id bigint [not null]
  target_type varchar [not null]
  target_id bigint [not null]
  reaction_type varchar [not null]
  created_at datetime

  indexes {
    (user_id, target_type, target_id, reaction_type) [unique, name: 'uk_reactions_user_target_type']
    (target_type, target_id)
  }
}

Table reports {
  id bigint [pk, increment]
  reporter_id bigint [not null]
  target_type varchar [not null]
  target_id bigint [not null]
  reason varchar [not null]
  detail text
  status varchar [not null]
  processed_by bigint
  processed_at datetime
  created_at datetime

  indexes {
    (reporter_id, target_type, target_id) [unique, name: 'uk_reports_reporter_target']
    (status)
    (target_type, target_id)
  }
}

Table contents {
  id bigint [pk, increment]
  author_id bigint [not null]
  title varchar [not null]
  content text [not null]
  category varchar [not null]
  content_type varchar [not null]
  status varchar [not null]
  sort_order int [not null, default: 0]
  is_pinned boolean [not null, default: false]
  created_at datetime
  updated_at datetime
}

Table videos {
  id bigint [pk, increment]
  title varchar [not null]
  youtube_url varchar [not null]
  youtube_video_id varchar [not null]
  thumbnail_url varchar
  description text
  related_board_id bigint
  is_visible boolean [not null, default: true]
  sort_order int [not null, default: 0]
  is_featured boolean [not null, default: false]
  created_at datetime
  updated_at datetime
}

Table post_images {
  id bigint [pk, increment]
  post_id bigint [not null]
  image_url varchar [not null]
  sort_order int [not null, default: 0]
  created_at datetime
  updated_at datetime
}

Table products {
  id bigint [pk, increment]
  name varchar [not null]
  category varchar [not null]
  image_url varchar
  description text
  price int
  external_url varchar
  is_visible boolean [not null, default: true]
  created_at datetime
  updated_at datetime
}

Ref: user_profiles.user_id > users.id
Ref: posts.board_id > boards.id
Ref: posts.user_id > users.id
Ref: comments.post_id > posts.id
Ref: comments.user_id > users.id
Ref: comments.parent_id > comments.id
Ref: reactions.user_id > users.id
Ref: reports.reporter_id > users.id
Ref: reports.processed_by > users.id
Ref: contents.author_id > users.id
Ref: videos.related_board_id > boards.id
Ref: post_images.post_id > posts.id
```

## 9. 인덱스·제약 요약

| 대상 | 유형 | 이름(권장) |
|------|------|------------|
| `reports (reporter_id, target_type, target_id)` | UNIQUE | `uk_reports_reporter_target` |
| `reactions (user_id, target_type, target_id, reaction_type)` | UNIQUE | `uk_reactions_user_target_type` |
| `users.email` | UNIQUE | — |
| `user_profiles.nickname` | UNIQUE | — |
| `user_profiles.user_id` | UNIQUE | — |

추가 조회용 인덱스:

- `users.email`
- `user_profiles.nickname`
- `posts.board_id`
- `posts.user_id`
- `posts.status`
- `posts.created_at`
- `comments.post_id`
- `comments.user_id`
- `reports.status`
- `reports.target_type`, `reports.target_id`
- `reactions.target_type`, `reactions.target_id`
- `contents.category`
- `videos.is_visible`
- `post_images.post_id`
- `products.is_visible`

---

## 관련 문서

| 문서 | 용도 |
|------|------|
| [requirements.md](requirements.md) | MVP 범위·운영 정책 |
| [api-spec.md](api-spec.md) | REST API |
| [convention.md](convention.md) | 구현·네이밍 규칙 |
