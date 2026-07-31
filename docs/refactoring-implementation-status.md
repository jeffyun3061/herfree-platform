# 실서비스·포트폴리오 개선 구현 상태

기준일: 2026-07-29

## 구현 완료

- Journal 책임 분리와 순수 Calculator/Policy 테스트
- 공개 홈에서 당일 일지 작성 인원 제거
- 공개 건강 집계 20명/셀 5명, 5% 반올림, 500건 초과 fail-closed
- 미래 일자·수면·메모·목록·코드·증상 일관성 write validation
- 동의 PATCH의 `@NotNull Boolean` 검증과 최신 동의 즉시 제외
- Journal/계정/관리 건강 통계 `private, no-store`
- Next BFF HttpOnly 세션, Origin/CSRF, 헤더 allow-list, 1/10 MiB 제한
- 내부 복귀 URL 검증과 분석 route query 제거
- 익명 analytics 애플리케이션/Nginx rate limit과 event allow-list
- 신고 상태 변경+대상 숨김/삭제 원자적 `ReportModerationFacade`
- Modal focus trap/Escape/복귀 focus/aria와 Input 오류 연결
- admin API 모듈 분할, 게시글 상세 feature 경계, `useAsyncMutation`
- CI unit test와 실제 제한 Playwright 실행
- AWS 단일 운영 토폴로지, snapshot/restore drill, Terraform import-first 기준

## 코드 후속 작업

- `PostService`의 command/query/moderation 물리 분리는 아직 남아 있다. 이번 변경에서
  신고 운영 트랜잭션과 이미지 서빙 경계는 먼저 분리했지만, 기존 대형 서비스 자체는 다음
  작은 PR에서 기존 `PostServiceTest`를 행위 테스트로 보존하며 이동해야 한다.
- 작성 화면의 일반 작성/관리자 편집 feature 분리와 Textarea용 FormField 계약을 이어서 적용한다.
- 관리자 민감 통계의 “조회 감사” 범위는 운영자 역할표와 법무 판단 후 ADR로 확정한다.

## 외부 증적이 필요한 공개 차단 조건

코드로 대신할 수 없는 아래 항목은 완료 증적 전까지 NO-GO다.

- 실제 RDS private subnet/TLS/KMS, S3/IAM, backup 설정과 restore drill
- CloudWatch 알람 전달 시험과 `herfree.admin.audit.failures` 알람
- 관리자 MFA/step-up
- 보존기간 법무/DPO 승인
- 의료 콘텐츠 출처·검토일·책임자·응급 안내 승인
- Docker가 있는 CI에서 MySQL Testcontainers/Flyway schema 검증

이 문서는 “구현됨”과 “설계만 있음”, “외부 승인 필요”를 섞어 포트폴리오에서 과장하지 않기
위한 상태표다.
