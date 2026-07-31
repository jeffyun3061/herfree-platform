# Herfree Terraform security baseline

목표는 기존 AWS를 한 번에 재생성하는 것이 아니라 보안 핵심 리소스의 drift를 검토 가능하게
만드는 것이다. 첫 실행에서 `apply`하지 않는다.

1. `terraform init`
2. AWS 콘솔/CLI inventory와 state 백업
3. 기존 RDS/KMS/S3/IAM/Security Group/Secrets/alarms/AWS Backup을 `terraform import`
4. `terraform plan -detailed-exitcode` 결과를 두 명이 검토
5. 태그·암호화·private network·retention 차이를 작은 변경으로 분리

state는 KMS 암호화 S3 backend와 DynamoDB locking을 사용하고 CI role에는 plan 권한만
부여한다. apply role은 승인된 production environment에서만 assume한다. DB snapshot과
restore drill 없이 RDS 교체·삭제 계획을 승인하지 않는다.

이 디렉터리의 초기 파일은 provider와 보호 규칙만 고정한다. 실제 resource block은 import할
AWS inventory ID와 네트워크 설계가 확정된 후 FDR/ADR 단위로 추가한다. 추측한 subnet·ARN을
코드에 넣는 것보다 이 순서가 안전하다.
