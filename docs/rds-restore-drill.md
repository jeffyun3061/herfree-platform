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

## 실행 하네스

승인된 운영자 호스트에서만 다음 스크립트를 실행한다. 스크립트는 스냅샷의 암호화·KMS·MySQL
엔진을 확인한 뒤 명시적인 `CONFIRM_RESTORE_DRILL=YES`가 있을 때만 임시 RDS를 만든다.
private subnet/전용 SG를 사용하고, 성공·실패와 관계없이 임시 인스턴스를 삭제한다.

```bash
AWS_PROFILE=herfree-production \
AWS_REGION=ap-northeast-2 \
RDS_SNAPSHOT_ID=herfree-production-before-release-<id> \
RESTORE_DB_INSTANCE_ID=herfree-restore-drill-20260802 \
RESTORE_DB_SUBNET_GROUP=herfree-restore-private \
RESTORE_DB_SECURITY_GROUP_ID=sg-<isolated> \
CONFIRM_RESTORE_DRILL=YES \
DRILL_EVIDENCE_FILE=artifacts/rds-restore-drill-<date>.json \
./infra/scripts/restore-rds-drill.sh
```

MySQL TLS smoke까지 하려면 `MYSQL_DATABASE`, `MYSQL_USERNAME`, `RESTORE_DB_PASSWORD`,
`RDS_CA_BUNDLE`을 추가한다. 비밀번호·CA 경로·원문 데이터는 증적 파일과 로그에 기록하지 않는다.
