# 건강정보 memo 암호화 운영 규칙

`journal_records.memo`는 `HEALTH_DATA_ENCRYPTION_KEY`를 사용한 AES-GCM field-level 암호화 대상이다.

현재 범위는 자유 서술형 memo다. 증상·수면·스트레스·복용 여부 등 구조화된 journal 컬럼은
RDS 저장 암호화, private subnet, 애플리케이션↔RDS 인증서 검증 TLS, 접근권한 최소화로 보호한다.
이들은 아직 컬럼별 application-level 암호화 대상이 아니므로, threat model 또는 고객 요구가
강화되면 별도 schema migration·검색/집계 영향 검토 후 추가 암호화해야 한다.

## 키 생성과 저장

```bash
openssl rand -base64 32
```

생성한 값은 JWT secret·분석 salt와 절대 재사용하지 않는다. staging과 production에 서로 다른 키를 사용하고, AWS Secrets Manager의 `herfree/<env>/app-config` JSON에 `healthDataEncryptionKey`로 저장한다. `infra/scripts/render-release-env.sh`가 이를 `HEALTH_DATA_ENCRYPTION_KEY`로 주입한다. 키가 없거나 32-byte base64/64자리 hex가 아니면 public profile은 시작하지 않는다.

## 기존 데이터 전환

기존 평문 memo는 호환성을 위해 읽을 수 있지만 production 공개 전 staging snapshot에서 re-key를 완료해야 한다. re-key는 백업과 복구 확인 후 수행하고, 원문이나 키를 로그·티켓·셸 히스토리에 남기지 않는다. 변환 건수와 실행 시각만 운영 기록에 남긴다.

staging에서만 임시로 `HEALTH_DATA_REKEY_ON_STARTUP=true`를 주입해 API를 한 번 재기동하면 `HealthDataRekeyRunner`가 평문 행만 암호화한다. 로그의 처리 건수를 확인한 뒤 즉시 `false`로 되돌리고 재기동한다. runner는 production profile에서 의도적으로 시작을 거부하며, 이미 `v1:`인 행은 다시 암호화하지 않는다.

키 분실 시 암호화 memo는 복구할 수 없으므로 Secrets Manager 접근권한, KMS/백업 정책, 키 교체 절차를 별도로 검토한다. 키 교체는 기존 키로 읽고 새 키로 다시 쓰는 migration window를 거친 뒤에만 수행한다.

`scripts/setup-production-aws.ps1`는 `herfree/production/app-config`, `db-app`, `smtp`가 미리 존재하는지 확인하고 staging secret을 복사하지 않는다. production OAuth·DB·SMTP 자격증명과 분석 salt는 별도로 발급·검증한 뒤 인프라 설정 스크립트를 실행한다.
