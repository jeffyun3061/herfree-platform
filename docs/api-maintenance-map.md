# Herfree API 유지보수 맵

이 문서는 백엔드 API와 프론트 API 클라이언트를 같이 볼 때 길을 잃지 않기 위한 운영용 메모입니다.
민감한 건강 기록을 다루므로, API를 추가할 때는 기능보다 먼저 개인정보 노출 범위를 확인합니다.

## 공통 흐름

브라우저는 직접 Spring API를 호출하지 않고 Next `/api` 프록시를 거칩니다.

```text
React page/component
  -> frontend/src/lib/api/*.ts
  -> frontend/src/lib/api/client.ts
  -> frontend/src/app/api/[...path]/route.ts
  -> Spring /api/**
  -> Service
  -> Repository
  -> DB
```

이 구조 덕분에 모바일, ngrok, 운영 도메인에서 CORS 문제를 줄이고 API 주소를 한 곳에서 관리할 수 있습니다.

## 프론트 API 파일

| 파일 | 담당 |
|---|---|
| `frontend/src/lib/api/client.ts` | 공통 request, 토큰 첨부, 401 처리, 에러 메시지 표준화 |
| `frontend/src/app/api/[...path]/route.ts` | Next 서버 프록시. 브라우저 Origin을 제거해 백엔드 CORS 문제를 줄임 |
| `frontend/src/lib/api/auth.ts` | 회원가입, 로그인, 로그아웃 |
| `frontend/src/lib/api/users.ts` | 내 정보, 마이페이지 활동, 프로필 수정 |
| `frontend/src/lib/api/boards.ts` | 게시판 목록 |
| `frontend/src/lib/api/posts.ts` | 커뮤니티 글, 이미지 업로드 |
| `frontend/src/lib/api/comments.ts` | 댓글 |
| `frontend/src/lib/api/reactions.ts` | 공감/반응 |
| `frontend/src/lib/api/reports.ts` | 신고 |
| `frontend/src/lib/api/journal.ts` | 개인 일지, 대시보드, 리뷰 요약 |
| `frontend/src/lib/api/contents.ts` | 칼럼 |
| `frontend/src/lib/api/videos.ts` | 영상 |
| `frontend/src/lib/api/products.ts` | 상품 API. 현재 공개 UI는 feature flag로 제한 |
| `frontend/src/lib/api/admin.ts` | 관리자 신고, 숨김, 콘텐츠, 회원, 통계 |
| `frontend/src/lib/analytics.ts` | 개인정보 최소화 이벤트 수집. PostHog 키가 없으면 내부 로그만 사용 |

## 백엔드 API 도메인

| 패키지 | 담당 |
|---|---|
| `domain.auth` | 회원가입, 로그인, 로그인 잠금 |
| `domain.user` | 회원, 프로필, 관리자 회원 관리 |
| `domain.board` | 게시판 |
| `domain.post` | 커뮤니티 글, 공지, 이미지 |
| `domain.comment` | 댓글 |
| `domain.reaction` | 공감/반응 |
| `domain.report` | 신고와 처리 |
| `domain.journal` | 개인 일지, 익명 통계 |
| `domain.content` | 칼럼 |
| `domain.video` | 영상 |
| `domain.product` | 상품 |
| `domain.analytics` | 행동 이벤트 로그, 관리자 운영 통계 |

## 개인정보 기준

분석 이벤트에는 아래 값을 넣지 않습니다.

- 이메일
- 닉네임
- 게시글 본문
- 댓글 본문
- 일지 메모
- 증상 상세 설명
- 검색어가 포함된 query string

분석에 필요한 값은 이벤트명, route path, 로그인 user id, 익명 세션 해시, IP/UA 해시 정도로 제한합니다.

## API 추가 체크리스트

- 새 API는 `docs/api-spec.md`에 Method, URL, 권한, 요청/응답 예시를 추가합니다.
- 프론트 호출은 반드시 `frontend/src/lib/api/*.ts`에 모읍니다.
- 자유입력값은 관리자 목록에서도 preview 수준으로 제한합니다.
- 운영자 API는 `SecurityConfig`의 권한 매핑을 먼저 확인합니다.
- DB 변경은 Flyway migration으로 남깁니다.
- 민감 데이터가 로그, 이벤트, 외부 분석 도구로 나가지 않는지 확인합니다.
