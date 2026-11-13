# Production Architecture (Canonical)

```text
Browser → AWS Amplify / Next.js BFF → EC2 Nginx → Spring Boot
                                                → internal Docker MySQL / private S3
```

브라우저는 Spring Boot 주소나 bearer token을 직접 알지 않는다. BFF는 HttpOnly·Secure·
SameSite=Strict 세션 쿠키를 Bearer 헤더로 변환하며 Origin/CSRF, 헤더 allow-list, 요청 크기
제한을 적용한다. 현재 구성은 `t3.small` EC2 한 대의 API + MySQL 8.4.10이다.
MySQL은 Docker 내부 네트워크에서만 접근하며 호스트 3306 포트를 공개하지 않는다.
API는 `sslMode=REQUIRED`로 연결하고 DB 데이터는 `/var/lib/herfree`의 별도 암호화
10 GiB gp3 EBS에 저장한다. RDS 절차는 과거 스냅샷 복원용으로 남아 있다.

관리 API는 기존 역할 권한과 서버에 저장된 15분 MFA 증명을 모두 요구한다. BFF는
전용 Secure·HttpOnly·SameSite=Strict 쿠키를 내부 헤더로 변환한다. MFA 증명은 로그인,
사용자, 역할, credential version에 연결되어 있으며 Bearer만으로 게이트를 통과할 수 없다.
현재 구현은 관리자 네트워크를 제한한다는 보장을 하지 않는다.

스테이징 EC2와 고정 IP는 유지하며 테스트 후 중지한다. 월간 복구훈련은 기존 스테이징에
암호화된 임시 EBS를 붙여 내부 네트워크에서만 수행하고 데이터·볼륨을 삭제한 뒤 중지한다.
운영 서버에서 복원하거나 운영/기존 스테이징 DB를 덮어쓰지 않는다.

## 공개 전 운영 증적

- EC2/EBS/S3/Security Group/IAM/Secrets Manager의 최신 실제 설정 증적
- 배포 전 S3 백업 완료 마커와 월간 restore drill 결과(RTO/RPO 및 정리·중지 포함)
- CloudWatch 오류율·지연·DB·디스크·감사 실패 알람
- 관리자 MFA/step-up
- 보존기간 법무/DPO 승인과 의료 콘텐츠 책임자 승인

설정 존재를 문서로 주장하는 것은 증적이 아니다. 위 항목이 확인되지 않으면 공개 GO로
판정하지 않는다. `backup-db.sh`는 현재 로컬 MySQL 운영 백업 도구다.

2026-10-11 코드 기준 문서이며 AWS 실제 상태/비용을 재검증했다는 의미는 아니다.
적용 순서와 담당은 [운영 개선 실행서](operations-improvements.md)를 따른다.
