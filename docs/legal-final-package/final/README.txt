Herfree 법률 자문 제출 패키지 (최종본)
================================

폴더: docs/legal-final-package/final/   ← 변호사 제출용 PDF (최종본)

상담 목표
---------
- 01-checklist M절 「배포 가능 여부」와 P0 항목을 채워 받을 것
- P0 반영 후 바로 herpfree.co.kr 공개 가능한지 확정

상담 시작 멘트
--------------
「이 체크리스트를 기준으로 가능·불가·조건부와 반드시 수정해야 하는 사항(P0)을
  중심으로 검토 부탁드립니다.」

PDF 목록 (01~08)
----------------
01-checklist.pdf          법률 검토 체크리스트 (항목별 □ + 개선·수정란)
02-erd-simple.pdf         데이터 구조 간단 ERD
03-privacy-flow.pdf       개인정보 처리 흐름도
04-admin-roles.pdf        관리자 권한·접근 범위
05-data-retention.pdf     보관·삭제 (현행 구현, 별도 정책 문서 없음)
06-signup-consent.pdf     회원가입 동의 항목 문구
07-terms.pdf              이용약관 현행본
08-privacy-policy.pdf     개인정보처리방침 현행본

직접 추가할 자료 (screenshots/ 폴더)
----------------------------------------
- 회원가입 화면 캡처
- 개인일지 입력 화면
- 커뮤니티·비공개 게시판
- 마이페이지 통계 동의/철회
- 관리자 신고·숨김

폴더 경로: docs/legal-final-package/screenshots/  (final/ 옆에 두면 됨)

PDF 재생성
----------
cd frontend
node scripts/generate-legal-final-package-pdf.mjs
→ docs/legal-final-package/final/ 에 PDF 생성

주의
----
- 본 패키지는 기술팀 사실 정리이며 법률 자문이 아닙니다.
- 회원 DB, secret, .env는 제출하지 마세요.
