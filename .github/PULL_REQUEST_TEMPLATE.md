## 변경 요약

-

## 변경 유형

- [ ] 기능 추가
- [ ] 버그 수정
- [ ] 보안/운영 개선
- [ ] 문서 수정
- [ ] 리팩터링/정리

## 확인한 내용

- [ ] backend `.\gradlew.bat test`
- [ ] backend `.\gradlew.bat build`
- [ ] frontend `npm run lint`
- [ ] frontend `npm run build`
- [ ] `node scripts/check-secrets.mjs --all`
- [ ] API/DB/운영 설정 변경 시 문서 갱신
- [ ] 배포 후 smoke test가 필요한 항목을 적음

## 건강정보·개인정보 영향

- [ ] 개인정보·건강정보 영향 없음
- [ ] 영향 있음: 데이터 등급, 수집 목적, 조회 주체, 보유·파기 기준을 적음
- [ ] 다른 사용자 ID·역할·정지·탈퇴 계정으로 권한 실패 흐름을 확인함
- [ ] 로그·analytics·오류 응답에 이메일·token·건강정보 원문이 없음
- [ ] 공개 집계는 서로 다른 사용자 최소 표본과 소수 셀 억제 기준을 확인함
- [ ] `docs/health-data-security-standard.md`의 신규 `BLOCK` 또는 `DECISION` 여부를 확인함

## 운영 영향

-

## DB 마이그레이션

- [ ] 없음
- [ ] 있음: `V__` 번호와 rollback 기준을 적음
- [ ] 위험 migration이면 `docs/templates/data-migration-review.md` 기준 검토 기록을 첨부함

## 배포 판정

- [ ] production 배포 대상 아님
- [ ] production 배포 대상: `docs/templates/release-security-review.md` 기준 증거와 승인 필요

## 후속 작업

-
