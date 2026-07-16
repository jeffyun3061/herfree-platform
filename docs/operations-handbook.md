# Herfree 운영·유지보수 핸드북

건강정보 사고, DB 변경, production 승인에는 [`health-data-security-standard.md`](./health-data-security-standard.md)를 우선 적용한다.

## 매일

- CloudWatch 5xx, health, 디스크, RDS 연결 알람을 확인한다.
- 문의·비밀상담·신고 대기열을 확인한다.
- 로그인·비밀번호 재설정·이미지 업로드 실패 급증을 확인한다.

## 매주

- 퍼널 `signup_started → signup_completed → login_succeeded → post_created/journal_created`를 집계한다.
- 퍼널에는 이메일, 닉네임, 게시글·상담·일지 본문을 넣지 않는다.
- 관리자 계정과 권한 변경 이력을 검토한다.
- Dependabot PR과 CodeQL 경고를 검토하고 staging에서 회귀 테스트한다.
- 백업 성공 여부와 RDS 여유 공간을 확인한다.

## 매월

- staging에서 복원 테스트를 하고 복구 소요시간을 기록한다.
- 사용하지 않는 관리자·OAuth·AWS 자격증명을 회수한다.
- CloudWatch 로그 표본에서 개인정보 원문이 없는지 확인한다.
- 개인정보 보유기간이 지난 데이터의 파기 작업과 결과를 기록한다.
- Next.js, Spring Boot, JDK, MySQL의 지원 종료 일정을 확인한다.

## 배포 원칙

`feature/fix/security 브랜치 → PR → CI → staging → E2E → production 승인` 순서를 지킨다. 운영 서버에서 코드를 직접 고치지 않는다. production은 staging을 통과한 동일 ECR 이미지 태그만 사용한다.

긴급 수정도 `hotfix/*` 브랜치에서 테스트하고, 배포 후 main에 반드시 반영한다. DB migration은 이미 배포된 버전을 수정하지 않고 새 버전 파일을 추가한다.

## 로그 구분

- 장애 로그: CloudWatch, 기본 30일 보존
- 제품 퍼널: `app_event_logs`, 식별자는 salt hash, 본문 저장 금지
- 관리자 변경 감사: `admin_audit_logs`, 수행자·경로·상태·request id만 저장
- 권한·회원 제재 감사: `role_audit_logs`

운영 로그에 request/response body를 통째로 남기지 않는다. 고객 문의를 조사할 때도 `X-Request-ID`, 사용자 내부 ID, 발생 시각으로 좁혀 찾는다.

## 장애 대응

1. 배포와 관리자 변경을 중지한다.
2. 발생 시각, 영향 기능, request id, 이미지 태그를 기록한다.
3. 노출 가능성이 있으면 관련 자격증명을 회전하고 접근을 제한한다.
4. 직전 정상 이미지로 롤백한다.
5. 개인정보 침해 가능성은 운영 책임자와 법률 담당자에게 즉시 알리고 법정 통지·신고 시한을 확인한다.
6. 원인, 영향, 복구, 재발 방지, 데이터 정합성 확인 결과를 사후 기록한다.

## 확장 순서

1. 사용자·트래픽이 늘면 DB를 RDS로 분리하고 Redis로 rate limit·세션 무효화를 중앙화한다.
2. 관리자 MFA는 production 공개 전에 적용하고, refresh token rotation은 승인된 기한 안에 도입한다.
3. CloudFront/WAF, 다중 AZ, ALB, Auto Scaling을 트래픽과 장애 요구에 맞춰 도입한다.
4. 느린 쿼리는 RDS Performance Insights와 실제 query count로 확인한다. 게시글·댓글 목록은 현재 사용자 프로필을 일괄 조회하므로 `user_profiles where user_id=?`가 목록 건수만큼 반복되면 회귀로 본다.
5. 기능 확장은 production DB 복사본이 아닌 익명화된 staging 데이터로 부하·페이지네이션을 검증한다.
