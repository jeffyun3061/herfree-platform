# Herfree 로그/감사 정책

Herfree는 건강·개인정보 맥락의 커뮤니티 서비스이므로 로그는 문제 해결에 필요한 최소 정보만 남긴다.

## 절대 로그에 남기지 않는 값

- 비밀번호
- JWT access token
- 비밀번호 재설정 원문 token 또는 reset URL
- OAuth authorization code/access token
- 게시글/댓글/일지 본문 전문
- 주민번호·연락처 등 사용자가 올린 민감 개인정보
- SMTP/S3/DB secret

## 남겨도 되는 값

| 대상 | 방식 |
|------|------|
| 사용자 식별 | 내부 userId 또는 해시 |
| 이메일 | 필요 시 마스킹 또는 장애 대응용 최소 노출 |
| IP | 해시 또는 마스킹 |
| User-Agent | 해시 |
| 게시글/댓글 | id만 |
| S3 객체 | 허용 prefix와 object key, secret 제외 |

## 운영 로그 보존

- 애플리케이션 로그: 30~90일
- 관리자 감사 로그: 최소 1년 권장
- 신고/제재 이력: 운영 정책 기간 동안 보존
- 탈퇴 사용자의 건강 일지: 탈퇴 시 물리 삭제

## 알림 대상

- 5xx 오류 급증
- SMTP 발송 실패 반복
- S3 AccessDenied/NoSuchBucket
- 로그인 rate limit 급증
- 관리자 권한 변경
- 계정 정지/해제

## 구현 상태

- 비밀번호 재설정 원문 token/reset URL 로그 금지 완료
- analytics IP/User-Agent/session은 해시 저장
- X-Forwarded-For는 신뢰 프록시 CIDR에서 온 요청만 반영
- 역할/계정 상태/닉네임 초기화 감사 로그 존재
- 이메일/OAuth 가입 시 필수 약관·개인정보·연령 확인과 선택 마케팅 동의 이력 저장

## 남은 보강

- 관리자 로그인 별도 알림
- SUPER_ADMIN MFA
- refresh token rotation 및 서버 측 폐기
