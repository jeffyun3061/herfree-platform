# frontend/src/domain

React·Next.js에 **의존하지 않는** 순수 레이어다. 면접·코드 리뷰 시 “화면 없이 정책만” 읽을 수 있다.

## 역할

| 하위 폴더 | 예시 |
| --- | --- |
| `auth/` | 가입·OAuth 타입, `validate.ts` |
| `board/` | 게시판 타입, `privateBoard.ts` — 비밀사연·문의 마스킹·탭 라벨 |
| `journal/` | 일지 타입, 기록 폼·루틴·공유 정책 |
| `post/`, `comment/`, `report/` | API DTO 대응 타입·정렬·검색 |
| `content/`, `video/`, `product/` | CMS 목록 타입 |
| `site/` | 사이트 공통 상수 (예: `contact.ts` 운영 메일) |
| `featureFlags.ts` | 런칭 후 공개 기능 (예: 제품 탭) |

## 규칙

- `import` from `react` / `next/*` **금지**
- API 호출은 `hooks/` · `lib/`에 둔다
- 화면 컴포넌트에 비즈니스 if/else를 길게 쓰지 말고, 여기로 옮긴다

전체 구조: [`docs/architecture-overview.md`](../../../docs/architecture-overview.md)
