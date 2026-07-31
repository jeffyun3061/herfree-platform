# Production Architecture (Canonical)

```text
Browser → AWS Amplify / Next.js BFF → EC2 Nginx → Spring Boot
                                                → private RDS MySQL / private S3
```

브라우저는 Spring Boot 주소나 bearer token을 직접 알지 않는다. BFF는 HttpOnly·Secure·
SameSite=Strict 세션 쿠키를 Bearer 헤더로 변환하며 Origin/CSRF, 헤더 allow-list, 요청 크기
제한을 적용한다. EC2만 RDS 보안 그룹에 접근하며 RDS는 private subnet,
`VERIFY_IDENTITY`, KMS 암호화, 암호화 snapshot을 사용한다.

## 공개 전 운영 증적

- RDS/S3/KMS/Security Group/IAM/Secrets Manager 설정 캡처 또는 Terraform plan
- 배포 전 snapshot ID와 월간 restore drill 결과(RTO/RPO 포함)
- CloudWatch 오류율·지연·DB·디스크·감사 실패 알람
- 관리자 MFA/step-up
- 보존기간 법무/DPO 승인과 의료 콘텐츠 책임자 승인

설정 존재를 문서로 주장하는 것은 증적이 아니다. 위 항목이 확인되지 않으면 공개 GO로
판정하지 않는다. 기존 VPS/Docker MySQL 절차와 `backup-db.sh`는 legacy다.
