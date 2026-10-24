# 법률 문서 게시 전 필수 확인 게이트

이 파일은 `kimlawtech/korean-privacy-terms`의 한국 PIPA 템플릿이 요구하는 사실 확인 항목을 Herpfree의 실제 운영에 맞게 고정한 내부 체크리스트입니다. 해당 오픈소스는 Apache-2.0이며, 문안은 그대로 복사하지 않고 서비스 사실관계에 맞춰 재작성했습니다.

## 무료·비영리 베타 공개 표기

- [ ] 실제 운영 주체가 헤르프리(유튜브 채널 운영자) 본인인지 확인했다.
- [ ] `herpfree3@gmail.com`에서 개인정보 열람·삭제·침해 신고 요청을 실제로 처리할 수 있다.
- [ ] 공개 화면에는 `헤르프리 개인정보 보호 담당`이라는 담당 부서/역할을 표시한다.
- [ ] 무료·비영리 베타 동안 결제·유료 광고·상품 판매·제휴 수익화를 활성화하지 않는다.

## 수익화·상업 운영 전 차단 항목

- [ ] 운영자 법적 명칭(개인사업자/법인), 대표자, 사업장 주소, 전화번호를 확정했다.
- [ ] 개인정보 보호책임자 성명·직책·전화·이메일을 확정했다.
- [ ] AWS 계정의 실제 리전, RDS/S3/CloudWatch/Secrets Manager 사용 여부와 국외 접근·재위탁 조건을 확인했다.
- [ ] 실제 메일 발송 사업자와 국가·보유기간을 확인했다. `console` 메일 모드는 운영에 사용하지 않는다.
- [ ] `NEXT_PUBLIC_POSTHOG_KEY`가 설정되어 있는지 확인하고, 설정되어 있으면 PostHog 국가·보유기간·옵트아웃을 방침에 반영했다.
- [ ] 게시물 공개범위 안내와 `PUBLIC`/`MEMBERS_ONLY` 선택 UI가 실제 배포 빌드에 포함되어 있다.
- [ ] 커뮤니티 가입과 개인일지 민감정보 동의가 분리되고, `health_data_consents` 최신 동의가 개인일지 API 접근을 제어한다.
- [ ] 탈퇴 시 계정·개인일지·S3 이미지 삭제 및 게시물 익명화 결과를 스테이징과 운영에서 각각 확인했다.
- [ ] 약관·처리방침 변경 시 동의 버전과 재동의 전략을 정했다.

## 문구를 바꾸면 함께 바꿔야 하는 코드

| 문서 내용 | 코드/운영 기준 |
|---|---|
| 약관 버전 | `UserConsentAgreementService.TERMS_VERSION` 및 가입 동의 기록 |
| 개인정보처리방침 버전 | `UserConsentAgreementService.PRIVACY_VERSION` 및 가입 동의 기록 |
| 건강통계 정책 버전 | `HealthStatisticsConsentService`의 정책 버전 |
| 개인일지 건강정보 정책 버전 | `HealthDataConsentService.POLICY_VERSION` 및 `health_data_consents` |
| 보유기간 | `application.yml`의 `app.retention.*` 및 실제 스케줄 실행 |
| 수탁자·국외이전 | 배포 환경 변수, AWS·메일·분석 계약과 운영 증적 |

## 오픈소스 고지

사용한 참고 프로젝트: [kimlawtech/korean-privacy-terms](https://github.com/kimlawtech/korean-privacy-terms)  
라이선스: Apache License 2.0  
저작권 고지: Copyright 2026 kimlawtech (SpeciAI)

이 프로젝트의 DISCLAIMER에 따라 생성 문서는 법률 자문이 아니며, 실서비스 공개 전 변호사 검토가 필요합니다.

## 검토 기준 원문

- [개인정보 보호위원회 개인정보 처리 통합 안내서(2025.7.)](https://www.pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS217&mCode=D010030000&nttId=11352)
- [개인정보 보호위원회 개인정보 처리방침 작성지침(2026.4. 개정)](https://www.pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS217&mCode=D010030000&nttId=12018)
- [개인정보 보호법 제15조·제17조·제18조](https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1020399013)
- [개인정보 보호법 제23조(민감정보)](https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1027416043)
- [약관의 규제에 관한 법률 제3조](https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1025032403)
