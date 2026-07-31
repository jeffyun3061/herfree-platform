# RDS Restore Drill

월 1회 production snapshot을 격리된 restore subnet과 임시 security group으로 복원한다.

기록할 증적:

- 원본 snapshot ID, KMS key, 실행자, 승인 티켓
- restore 시작/완료 시각과 측정 RTO
- Flyway schema validation, 핵심 테이블 row count 범위, 읽기 전용 smoke 결과
- 애플리케이션 연결 테스트(`VERIFY_IDENTITY`)
- 측정 RPO와 목표 초과 여부
- 임시 인스턴스 삭제 승인과 완료 시각

복원 DB는 인터넷과 production application SG에 연결하지 않는다. 민감 데이터 접근자는
최소화하고 drill 종료 후 CloudTrail·감사 기록을 보존한다.
