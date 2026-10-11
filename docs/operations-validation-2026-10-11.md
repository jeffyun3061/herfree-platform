# 비용·보안 개선 배포 검증 기록

2026-10-11. 운영 EC2 크기, 기능, 스테이징/IP, 6시간 백업 및 보관·로그 기준을 유지한다.
이 문서는 AWS 적용 및 운영 배포 완료 기록과 구분한다.

## 로컬 최종 검사

| 검사 | 결과 |
|---|---|
| Backend test/build | 265 통과, 1 생략, 실패 0 |
| Frontend 단위 테스트 | 38 통과 |
| Frontend lint·보안 헤더·OAuth 설정·의존 경계·production build | 통과 |
| 실제 브라우저 PC·모바일 화면, FAQ, 회원가입 검증 | 36 통과 |
| 비용·복구·배포 설정 회귀 검사 | 8 통과 |
| 모든 release shell scripts 구문·비밀 파일·민감 로그·diff 검사 | 통과 |
| Frontend 운영 의존성 취약점 | 0 |
| Frontend 전체 의존성 critical 취약점 | 0; 개발 도구 high 8/moderate 4는 ADR-025로 추적 |

브라우저 로컬 검사는 회원가입 입력 검증과 페이지 표시를 확인한다. 실제 AWS DB를
사용한 로그인·일지·게시글·관리자 등록/복구 검증의 대체 증적은 아니다.
MySQL Testcontainers 검사는 로컬 Docker 엔진에 연결되지 않아 생략됐다. GitHub CI에서
실제 MySQL 8.4.10 Flyway/ORM 검사를 확인한 뒤 스테이징 검증을 수행한다.

추가 검토 중 발견한 운영 `.env.mysql.prod`와 `.env.mysql.production` 불일치를 준비·검증·
배포 스크립트에서 `.env.mysql.prod`로 통일했다. 실제 스크립트 실행을 통해 준비한 파일과
배포 검증에 전달하는 파일이 같은지 확인하며 Linux CI에서는 파일 권한 0600도 검사한다.
Amplify 새 배포 역할이 없으면 기존 자동 빌드를 유지하고, 수동 검증은 구성 누락을 실패로
처리한다. 새 경로의 성공을 검증하기 전 자동 빌드를 끄지 않는다.

## 현재 운영 서비스 읽기 전용 검사

`https://www.herpfree.co.kr`과 `https://api.herpfree.co.kr`에서 기존 배포를 검사했다.
HTTP/API 보안 경계 9개와 실제 PC·모바일 브라우저 검사 34개가 모두 통과했다.
주요 화면, FAQ, 8초 탐색 예산, frontend same-origin API 연결, 공개 목록, 비로그인
관리 API 차단을 확인했다. 회원가입·로그인·일지·게시글 변경 요청은 운영에 보내지 않았다.
이 결과는 새 후보 버전의 AWS 배포·MFA 검증을 대신하지 않는다.

공개 통계는 현재 backend 계약대로 비음수 정수 `activeMemberCount`, `postsToday`만
허용하고 추가 개인정보·건강정보 필드를 거부하도록 오래된 검사 코드를 수정했다.
운영 검사 및 설정 예시의 도메인을 기존 canonical `www.herpfree.co.kr`에 맞췄다.
실제 AWS secret/OAuth 제공자 설정은 별도 확인하며 이 수정으로 변경하지 않았다.
운영 변경 테스트는 계속 local/승인된 staging에서만 허용한다. 보안·비밀·정책 정합성
검사 5개와 frontend lint도 통과했다.

## 배포 전 필수 증적

- [ ] AWS 기존 운영 계정 세션 갱신 및 최신 비용·리소스 감사
- [ ] 독립 MFA 키·복구 키 보존 및 필요한 IAM 권한 준비
- [ ] 실제 MySQL 마이그레이션 CI 성공
- [ ] 동일 frontend/backend 스테이징 배포 및 핵심 기능·MFA 정상/실패 검증
- [ ] 운영 배포 전 백업 완료 마커·체크섬 및 직전 정상 이미지 확보
- [ ] 운영 배포 후 핵심 기능·알림·격리 복구훈련 성공
- [ ] 임시 복구 자원 정리 및 스테이징 중지

AWS `herfree-staging` 기존 로그인 세션의 만료를 확인했고, 공식 `aws login`으로 갱신을
요청했다. 세션 갱신 전에는 AWS 변경과 운영 배포 성공을 기록하지 않는다.
실행 절차는 [개선 실행서](operations-improvements.md)를 따른다.
