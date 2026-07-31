# ADR-024: Next BFF HttpOnly 세션

- 상태: 승인
- 날짜: 2026-07-29

## Context

Bearer token을 `sessionStorage`에서 읽는 구조는 XSS가 발생할 때 토큰 자체가 탈취된다.

## Decision

Next BFF가 로그인/OAuth 응답의 토큰을 제거해 `__Host-herfree-access` HttpOnly·Secure·
SameSite=Strict 쿠키에 1시간 보관한다. 브라우저는 같은 origin의 BFF만 호출하며 BFF만
Spring 요청에 Bearer를 주입한다. 변경 요청은 Origin과 double-submit CSRF를 검증한다.
refresh token은 장기 로그인 요구가 확인될 때까지 만들지 않는다.

프록시는 요청 헤더 allow-list, JSON 1 MiB, 이미지 10 MiB 제한을 적용하고 브라우저의
Cookie·Forwarded 계열 헤더를 백엔드에 전달하지 않는다.

## Consequences

XSS의 영향이 사라지는 것은 아니지만 토큰 직접 유출 경로가 제거된다. BFF가 인증 가용성과
CSRF 경계를 책임지므로 회귀 테스트와 관측이 필요하다.
