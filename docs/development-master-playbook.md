# Herfree Development Master Playbook

이 문서는 신규 기능·리팩터링·운영 변경에 공통 적용하는 단일 개발 기준이다. 기능 속도보다
환자·회원의 안전, 설명 가능한 결정, 되돌릴 수 있는 배포를 우선한다.

## 1. 기능 시작 전: Feature Design Record

```md
# FDR: 기능명
- 해결하려는 문제 / 대상 사용자 / 성공 지표 / 비목표:
- 사용자 위해와 실패 시 영향:
- 데이터 등급: 공개 / 계정 / 민감 / 건강정보
- 읽기·쓰기 권한 표:
- 동의·보존·삭제·백업 영향:
- API / DB migration / 외부 시스템 변경:
- 동시성·중복 요청·부분 실패:
- 고려한 대안과 선택 근거:
- 테스트·관측·롤백 방법:
- 법무·의료·보안 검토자와 증적:
```

건강정보는 필요한 필드만 수집한다. 공개 집계는 `HealthInsightPublicationPolicy`를 반드시
경유하며 작은 집단, 정확한 참여자 수, 알 수 없는 과거 코드를 노출하지 않는다.

## 2. 설계 규칙

- 의존 방향은 Controller → Application Service/Facade → Domain Policy/Entity → Repository다.
- Service는 하나의 사용자 목적과 트랜잭션 경계를 맡는다.
- 여러 도메인의 변경이 원자적으로 성공해야 할 때만 Facade를 둔다.
- Policy는 권한·공개 임계치처럼 모든 경로에서 같아야 하는 판단을 맡고 순수 테스트를 둔다.
- Mapper는 표현 변환만 하며 조회·권한·저장을 수행하지 않는다.
- 두 번째 실제 사례가 생기기 전에는 범용 `RecordService<T>`나 `useCrud()`를 만들지 않는다.
- feature hook은 권한·성공 후 갱신·토스트를, `useAsyncMutation`은 실행 상태만 맡는다.
- UI는 접근성 계약이 있는 primitive와 업무 의미가 있는 feature component로 구분한다.

## 3. 민감정보 체크리스트

- 목적·법적 근거·선택 동의와 철회 경로가 있는가?
- 응답·로그·분석 이벤트·URL에 건강정보가 섞이지 않는가?
- 개인 응답에 `private, no-store`가 적용되는가?
- 운영자 조회·변경이 최소 권한과 감사 로그를 거치는가?
- 탈퇴·철회가 공개 집계, 캐시, 검색색인, 백업에 미치는 영향이 정의됐는가?
- 작은 집단·희귀 조합·시간대로 개인을 추론할 수 없는가?
- 의료 콘텐츠에 출처, 검토일, 책임자, 응급 안내 승인이 있는가?

## 4. 테스트 매트릭스

| 경계 | 필수 검증 |
|---|---|
| 순수 정책·계산 | 정상, 경계값, 알 수 없는 과거 값 |
| Service | 소유권, 401/403, rollback, 중복 요청 |
| Repository/migration | MySQL Testcontainers + Flyway 전체 이력 |
| BFF | 토큰 비노출, Origin/CSRF, 헤더 allow-list, 413 |
| UI | loading/error/double-submit, keyboard/focus/aria |
| E2E | staging 제한 mutation, production read-only smoke |
| 운영 | 알람, 백업 복구, RTO/RPO, 감사 로그 실패 |

## 5. Migration / Release / Rollback

Migration은 expand → application 전환 → contract 순서로 한다. 배포 전 RDS snapshot ID,
애플리케이션 버전, Flyway 버전, 담당자를 릴리스 기록에 남긴다. canary에서 오류율·지연·
감사 실패·DB 연결 수를 확인한 뒤 확대한다. destructive migration은 복구 훈련 없이 배포하지 않는다.

## 6. ADR·위협 모델·면접 카드

ADR은 Context, Constraints, Options, Decision, Consequences, Verification, Revisit trigger를
포함한다. 위협 모델은 자산, 신뢰 경계, 공격자, 오용 시나리오, 예방·탐지·복구 통제를 적는다.

```text
문제 → 제약 → 대안 → 선택한 책임/트랜잭션 경계 → 테스트·메트릭 검증 → 결과 → 재검토 조건
```

“패턴을 적용했다”보다 “작은 집단 건강정보 추론을 막기 위해 공개 정책을 한 경계로 모았고,
임계값·반올림·표본 초과 실패를 테스트했다”처럼 문제와 검증을 설명한다.
