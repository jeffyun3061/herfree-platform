# Herfree 실서비스 점검 기록 (2026-07-08)

## 범위

- 프론트 빌드와 주요 라우트 응답
- 백엔드 clean build
- 관리자 계정 로그인과 운영 API 연결
- Next 프론트 프록시(`/api/*`)와 Spring API 연결

## 실행 결과

| 항목 | 명령/대상 | 결과 |
| --- | --- | --- |
| 프론트 빌드 | `frontend > npm run build` | 성공, 2026-07-08 재확인 |
| 백엔드 빌드 | `backend > .\gradlew.bat clean build`, `backend > .\gradlew.bat build` | 성공 |
| 백엔드 헬스 | `GET http://127.0.0.1:8080/api/health` | 200 |
| 프론트 프록시 헬스 | `GET http://127.0.0.1:3000/api/health` | 200 |
| 홈 라우트 | `GET http://127.0.0.1:3000/` | 200 |
| 개인일지 라우트 | `GET http://127.0.0.1:3000/journal` | 200 |
| 관리자 라우트 | `GET http://127.0.0.1:3000/admin` | 200 |
| 운영 실행 이미지 캐시 | `next start` + 브라우저 홈 캡처 | 오류 없음 |

## 관리자 API 스모크

로컬 관리자 계정:

- 이메일: `admin@herfree.local`
- 권한: `SUPER_ADMIN`

확인한 API:

| API | 결과 |
| --- | --- |
| `POST /api/auth/login` | 토큰 발급 성공 |
| `GET /api/users/me` | SUPER_ADMIN 권한 확인 |
| `GET /api/admin/stats/overview` | 운영 통계 조회 성공 |
| `GET /api/admin/reports?status=PENDING&page=0&size=3` | 신고 목록 조회 성공 |
| `GET /api/admin/notices?page=0&size=3` | 공지 목록 조회 성공 |
| `GET /api/admin/contents?page=0&size=3` | 칼럼 목록 조회 성공 |
| `GET /api/admin/videos?page=0&size=3` | 영상 목록 조회 성공 |
| `GET /api/admin/users?page=0&size=3` | 회원 목록 조회 성공 |

## 운영 기능 연결 상태

- 공지: 등록, 수정, 노출/숨김, 정렬, 상단 고정, 삭제 API가 프론트 관리자 UI와 연결됨.
- 칼럼: 등록, 수정, 이미지 URL, 카테고리, 노출/숨김, 정렬, 고정, 삭제 API가 연결됨.
- 영상: 유튜브 URL 등록, 수정, 노출/숨김, 정렬, 추천, 삭제 API가 연결됨.
- 신고: 신고 목록, 대상별 묶음 조회, 일괄 승인/반려, 게시글/댓글 숨김/삭제 API가 연결됨.
- 회원: 검색, 권한 변경, 상태 변경, 기간/영구 제재, 닉네임 초기화 API가 연결됨.
- 로그인 홈: 실제 로그인 폼으로 `admin@herfree.local` 계정 로그인 후 홈 대시보드, 공지, 커뮤니티 영역 렌더링 확인.
- 개인일지: 로그인 세션에서 `/journal` 진입 후 `기록 / 일지 / 요약` 탭과 기록 폼 렌더링 확인.
- 기록 화면: `/journal`의 `기록` 탭과 `/record` 단독 화면 모두 `기본 컨디션 → 전조증상 → 증상 기록 → 메모 → 저장` 흐름으로 정리. 기록 입력 화면에는 14일 흐름 차트를 노출하지 않음. `/record` 헤더는 디자이너 기준에 맞춰 닫기 X 대신 내부 뒤로가기형 `‹ 기록하기`로 통일.
- 뒤로가기: 통합 검색 화면의 직접 `router.back()` 호출을 공통 `navigateBack`으로 교체해 브라우저 히스토리가 없을 때 `/community`로 안전하게 이동하도록 수정.
- 대시보드 공유: 홈 대시보드 공유 메뉴는 상세 증상/메모를 제외한 PNG 이미지를 생성함. 앱/브라우저 공유는 지원 환경에서 이미지 파일 공유를 우선 사용하고, 미지원 환경에서는 문구 공유로 fallback.
- 칼럼 상세: API 조회 로직은 유지하고, 디자이너 `Article.jsx` 기준에 맞춰 히어로 이미지 이후 본문이 바로 이어지는 구조로 정리. 의료 고지와 1:1 상담 CTA는 실서비스 안전 장치로 본문 아래 유지.

## 남은 확인

- 디자이너 `herfree_preview.html` 대비 상세 페이지별 픽셀 검증은 계속 진행 필요.
- 실제 배포 도메인에서는 HTTPS 환경에서 대시보드 이미지 복사/저장/공유 기능을 다시 확인해야 함.
- 민감정보 서비스이므로 운영 전 개인정보처리방침, 민감정보 동의, 로그 보관 범위, 관리자 접근 로그 정책을 법률/운영 기준으로 재검토해야 함.
