# Herfree 유지보수·학습 가이드

기준일: 2026-07-31

이 문서는 코드를 처음 다시 볼 때 길을 잃지 않고, 실서비스 기능을 안전하게 수정하며, 면접에서 설계 근거까지 설명하기 위한 개인 작업 노트다. 운영 절차의 기준은 `maintenance-handbook.md`, AWS 배포는 `deployment-aws.md`, API 계약은 `api-spec.md`를 우선한다.

## 1. 먼저 기억할 구조

```text
Browser
  → Next.js 화면
  → frontend/src/lib/api/client.ts
  → Next BFF /api/[...path]
  → Spring Controller
  → Service / Policy
  → Repository
  → MySQL
```

이미지는 Spring이 권한을 확인한 뒤 S3에 접근한다. 브라우저가 access token이나 S3 비공개 객체를 직접 다루지 않는 것이 현재 구조의 핵심이다.

환경은 코드 분기가 아니라 profile과 환경변수로 나눈다. 운영 문제를 고칠 때 서버 파일을 직접 수정하지 않고, 같은 커밋을 staging에서 검증한 뒤 production으로 승격한다.

## 2. 이번 안전 개선에서 바뀐 기준

### 공개 건강 통계

- `GET /api/journal/public/home-stats`는 기존 계약대로 `usersRecordingToday`, `totalUsers`를 반환한다.
- `usersRecordingToday`는 건강통계 활용에 동의한 회원의 KST 당일 기록 인원이다.
- 이 수치의 최소 표본·반올림·비공개 전환 여부는 아직 제품·법무 확정 사항이 아니다. 확정 전에는 API에서 임의로 제거하지 않는다.
- 건강 패턴 인사이트는 별도 API에서 동의 여부, 서로 다른 참여자 수, 소수 셀 억제를 적용한다.

관련 파일:

- `JournalPublicHomeStatsResponse.java`
- `JournalInsightService.java`
- `HealthInsightPublicationPolicy.java`
- `JournalInsightServiceTest.java`

### 게시글·댓글 반응

- 반응 등록과 집계는 모두 `ReactionTargetAccessService`를 거친다.
- 게시글은 `ACTIVE`, 댓글은 댓글과 부모 게시글이 모두 `ACTIVE`여야 한다.
- `MEMBERS_ONLY`, 문의, 비밀상담, 비밀사연은 게시글 열람 정책과 같은 권한을 적용한다.
- 동일 사용자 반응 토글은 사용자 행을 잠가 `존재 확인 → 저장/삭제` 경쟁을 직렬화한다.
- DB unique 제약은 마지막 방어선이며, 알려진 충돌은 409로 응답한다.

새 반응 대상 타입을 추가할 때 enum만 늘리면 안 된다. 대상 조회, 상태 판정, 열람 권한, 탈퇴·삭제 정리 정책을 `ReactionTargetAccessService`에 먼저 추가해야 한다.

### 세션과 401

- access token은 BFF의 HttpOnly cookie에만 둔다.
- CSRF cookie와 `X-Herfree-CSRF` 헤더가 일치해야 변경 요청을 전달한다.
- cookie 수명은 backend 로그인 응답의 `expiresIn`과 맞춘다.
- 보호 API가 401을 반환하면 BFF가 access/CSRF cookie를 폐기한다.
- 현재 비밀번호 확인 실패는 정상 세션까지 지우면 안 되므로 예외로 둔다.
- 브라우저에 기존 `sessionUser`가 있었다면 `session_expired`, 없었다면 `login_required`로 안내한다.

관련 파일:

- `frontend/src/lib/bff/session.ts`
- `frontend/src/lib/bff/proxy.ts`
- `frontend/src/lib/bff/security.ts`
- `frontend/src/lib/api/client.ts`
- `frontend/src/lib/auth-storage.ts`

현재 refresh token은 없다. access token 만료 시간을 무작정 늘리면 탈취 피해 시간도 늘어나므로, 장기 로그인은 refresh token rotation과 재사용 탐지를 별도 설계한 뒤 도입한다.

### 일지와 카운터 동시성

- 일지 upsert는 사용자 행을 잠근 뒤 같은 날짜 기록을 조회한다.
- 조회수와 댓글 수는 엔티티 값을 읽어 `++/--` 하지 않고 DB 원자 UPDATE를 사용한다.
- 댓글 수 감소는 0 아래로 내려가지 않는다.

관련 파일:

- `UserRepository.findByIdForUpdate`
- `JournalRecordService.upsertRecord`
- `PostRepository.incrementViewCount`
- `PostRepository.incrementCommentCount`
- `PostRepository.decrementCommentCount`

사용자 행 잠금은 같은 사용자의 요청을 직렬화한다. 현재 규모에서는 단순하고 안전한 선택이지만, 한 계정에서 쓰기 요청이 매우 많아지면 lock wait와 transaction 시간을 측정하고 더 좁은 잠금 또는 별도 멱등성 키를 검토한다.

### production 승격

- 입력은 `staging-passed-<40자리 SHA>`만 허용한다.
- SHA가 `main` 이력에 포함되는지 확인한다.
- 승격 태그를 ECR digest로 해석하고, ECR repository가 immutable tag 정책인지 확인한다.
- 원본 commit SHA 태그와 `staging-passed-*` 태그의 digest가 같은지 검증한다.
- production bundle도 승격 SHA를 다시 checkout해 만든다.
- 배포 이미지는 mutable tag가 아니라 `repository@sha256:...` 형식을 사용한다.

이렇게 해야 staging에서 검증한 이미지는 과거 SHA인데 Compose, Nginx, 배포 script만 최신 HEAD인 혼합 배포를 막을 수 있다.

## 3. 기능별로 같이 볼 파일

### 인증·회원·세션

| 목적 | Backend | Frontend |
| --- | --- | --- |
| 로그인·가입 | `domain/auth` | `lib/api/auth.ts`, 로그인/가입 feature |
| JWT 인증 | `global/security` | BFF `session.ts`, `proxy.ts` |
| 사용자 복원 | `/api/users/me` | auth context/hook, `auth-storage.ts` |
| 401 안내 | `ErrorCode`, security filter | `lib/api/client.ts`, `app-notice.ts` |
| 탈퇴 | `UserService` 및 연관 정리 | 마이페이지 계정 화면 |

변경 시 확인할 계약:

- 로그인 JSON에 token을 브라우저 JavaScript가 읽을 수 있게 다시 넣지 않는다.
- cookie는 production에서 `Secure`, `SameSite=Strict`, access token은 `HttpOnly`다.
- 401, 403, 정지 계정, 비밀번호 불일치를 같은 오류로 처리하지 않는다.
- 로그아웃과 탈퇴는 서버 처리 성공 여부와 무관하게 로컬 세션 정리 경계를 검토한다.

### 개인 일지·건강 인사이트

| 목적 | 파일 |
| --- | --- |
| 기록 CRUD·소유권 | `JournalRecordService` |
| 입력 검증 | `JournalRecordInputValidator` |
| 개인 대시보드 | `JournalDashboardService`, Calculator |
| 30일 리뷰 | `JournalReviewService`, Calculator |
| 공개 인사이트 | `JournalInsightService`, `HealthInsightPublicationPolicy` |
| DB | `JournalRecordRepository`, journal Flyway migration |
| 화면 | `frontend/src/features/journal`, `lib/api/journal.ts` |

불변식:

- 날짜는 KST 기준 `LocalDate`다.
- 타인 기록은 존재 여부를 숨기기 위해 404를 유지한다.
- 메모와 userId는 공개 집계에 사용하지 않는다.
- 동의 철회, 탈퇴, 과거 미등록 코드가 집계에 미치는 영향을 먼저 확인한다.
- 기존 `usersRecordingToday`는 현재 제품 계약으로 유지한다. 최소 표본·반올림 정책이 확정되면 backend DTO, frontend type, E2E, production smoke를 한 번에 변경한다.
- 새로운 공개 건강 지표나 희귀 조합은 제품·법무·개인정보 검토 없이 추가하지 않는다.

### 커뮤니티

| 목적 | 파일 |
| --- | --- |
| 게시글 CRUD·목록 | `PostService`, `PostRepository` |
| 게시판별 비공개 정책 | `PrivateBoardPolicy`, `PostVisibilityPolicy` |
| 댓글 | `CommentService`, `CommentRepository` |
| 반응 | `ReactionService`, `ReactionTargetAccessService` |
| 신고 | `ReportService` |
| 이미지 | `PostImageStorageService`, Access/Serving/Cleanup service |
| 화면 | `frontend/src/features/community`, `lib/api/posts.ts` 등 |

비공개 게시판은 목록 마스킹, 상세 열람, 댓글, 반응, 이미지 다운로드를 모두 확인한다. 화면에서 숨기는 것만으로는 권한 제어가 되지 않는다.

### 관리자·분석

- 관리자 Controller와 Service뿐 아니라 `SecurityConfig`, `AdminAuditFilter`, 역할 변경 감사를 같이 본다.
- 운영 통계를 위해 여러 도메인을 조합해야 할 때만 이름이 분명한 facade를 둔다.
- 분석 이벤트에는 이메일, 닉네임, 게시글·댓글·일지 원문, 검색 query를 넣지 않는다.
- 관리자 기능은 일반 계정 401/403, 운영자 역할, 감사 로그 실패까지 확인한다.

## 4. 코드를 안전하게 바꾸는 순서

1. 문제를 한 문장으로 적는다.
2. REST URL, DTO, 상태 코드, 권한, DB 제약, transaction을 현재 계약으로 적는다.
3. 호출부와 기존 테스트를 먼저 찾는다.
4. 권한·동의·공개 여부처럼 모든 경로에서 같아야 하는 판단은 Policy/Access Service 한곳으로 모은다.
5. DB 변경이 없으면 Service와 Repository의 작은 변경으로 끝낼 수 있는지 먼저 본다.
6. DB 변경이 필요하면 기존 migration을 수정하지 않고 새 Flyway 파일을 만든다.
7. backend 단위 테스트, frontend 테스트, lint, 보안 헤더, build를 실행한다.
8. `git diff --check`와 전체 diff에서 비밀값, 운영 URL, 불필요한 로그를 확인한다.
9. staging에서 권한 경계와 실제 DB migration을 검증한다.
10. production은 승인된 승격 SHA만 사용한다.

리팩터링과 동작 변경은 가능한 한 분리한다. 단, 개인정보 노출·권한 우회·데이터 유실은 작은 긴급 수정으로 먼저 차단한다.

## 5. DB 변경과 동시성 판단

### 선조회 후 저장

아래 형태는 동시 요청에서 둘 다 “없음”을 보고 INSERT할 수 있다.

```text
exists/find → 없으면 save
```

대응 방법은 상황별로 선택한다.

- 같은 사용자 단위 작업: 사용자 행 pessimistic lock
- 중복 요청 자체가 같은 명령: idempotency key
- 단순 숫자 증가: `UPDATE ... SET count = count + 1`
- 상태 전이 경쟁: 조건부 UPDATE 또는 `@Version`
- 최종 중복 방지: DB unique 제약

사전 중복 검사는 사용자 안내용이고, 최종 정합성은 DB가 보장해야 한다.

### Flyway 원칙

- 이미 운영에 적용된 `V*.sql`은 수정하지 않는다.
- expand → application 전환 → contract 순서로 진행한다.
- 대형 ALTER와 전체 UPDATE는 staging에서 실행 시간과 lock 영향을 측정한다.
- 애플리케이션 rollback과 DB rollback은 다르다.
- 삭제·타입 축소 전에는 snapshot/PITR와 별도 DB 복원 절차를 먼저 확인한다.

## 6. 보안 점검표

기능 PR마다 최소한 아래를 확인한다.

- [ ] 비로그인, 일반 회원, 작성자, 운영자 권한을 각각 확인했는가?
- [ ] 삭제·숨김 대상이 다른 API나 집계에서 다시 노출되지 않는가?
- [ ] 토큰, cookie, reset URL, 이메일, 건강 원문이 로그에 남지 않는가?
- [ ] 변경 요청은 Origin과 CSRF 검증을 통과하는가?
- [ ] 오류 메시지가 계정 존재 여부나 비공개 대상 존재 여부를 드러내지 않는가?
- [ ] 공개 통계가 작은 집단과 시간대 행동을 추론하게 하지 않는가?
- [ ] 업로드 파일의 크기, MIME, 실제 파일 시그니처를 확인하는가?
- [ ] 외부 시스템 실패가 DB transaction과 어긋날 때 복구 경로가 있는가?

## 7. 기능 확장 예시

### 새 일지 필드 추가

1. 민감도, 수집 목적, 동의, 보유·파기 기준을 정한다.
2. 새 nullable 컬럼 migration을 추가한다.
3. Entity와 Request/Response DTO를 확장한다.
4. validator와 기존 과거 레코드 기본 동작을 정한다.
5. frontend type, form, API payload를 맞춘다.
6. 공개 집계에는 자동 포함하지 않는다. 별도 공개 기준 승인이 필요하다.
7. 구버전 frontend 요청도 정상 처리되는지 확인한다.

### 새 게시판 타입 추가

1. 공개/회원/작성자/운영자 권한표를 먼저 만든다.
2. `PrivateBoardPolicy`, 목록 query, 상세, 댓글, 반응, 이미지 접근을 함께 수정한다.
3. frontend의 게시판 label·route·마스킹 정책을 맞춘다.
4. 검색과 관리자 목록에서 원문이 새지 않는지 확인한다.

### 새 API 추가

1. Controller는 HTTP와 validation만 담당한다.
2. Service에 transaction과 비즈니스 규칙을 둔다.
3. 응답은 Entity가 아닌 DTO로 제한한다.
4. `frontend/src/lib/api/*.ts`에 호출을 모은다.
5. `api-spec.md`와 권한표를 갱신한다.

## 8. 장애를 찾는 순서

### 로그인이 자꾸 풀릴 때

1. backend 로그인 응답의 `expiresIn`을 확인한다.
2. BFF 응답의 access cookie `Max-Age`, `HttpOnly`, `Secure`를 확인한다.
3. `/api/users/me`가 401인지, 네트워크 오류인지 구분한다.
4. 401 응답이 cookie를 폐기하는지 확인한다.
5. 비밀번호 확인 API의 401이 정상 세션까지 지우지 않는지 확인한다.

### 반응 수가 이상할 때

1. 대상이 POST인지 COMMENT인지 확인한다.
2. `reaction_type`까지 포함해 집계하는지 확인한다.
3. 대상과 부모 게시글이 ACTIVE인지 확인한다.
4. 비공개 대상의 summary가 차단되는지 확인한다.
5. unique 제약 충돌과 lock wait 로그를 확인한다.

### 댓글 수·조회수가 맞지 않을 때

1. entity `++/--` 호출이 다시 생기지 않았는지 찾는다.
2. 원자 UPDATE의 영향 행 수가 1인지 확인한다.
3. 댓글 상태 ACTIVE/HIDDEN/DELETED 전이마다 증감이 한 번만 실행되는지 본다.
4. 기존 데이터가 이미 어긋났다면 운영 중 즉시 전체 UPDATE하지 말고, 검증 query와 보정 migration을 별도 설계한다.

## 9. 로컬 검증 명령

백엔드:

```powershell
cd backend
.\gradlew.bat test --rerun-tasks --no-daemon --console=plain
.\gradlew.bat check --no-daemon --console=plain
```

프론트엔드:

```powershell
cd frontend
npm test
npm run lint
npm run check:security-headers
npm run build
```

저장소:

```powershell
git diff --check
git status --short
```

E2E mutation은 운영에서 실행하지 않는다. 격리된 staging과 `E2E_ALLOW_MUTATION=true`가 있을 때만 실행하고, 생성한 계정·일지·게시글을 정리한다.

## 10. 면접에서 설명하는 방식

### BFF 세션

> 브라우저가 JWT를 직접 저장하지 않도록 Next BFF가 로그인 응답의 token을 제거하고 HttpOnly cookie로 보관했습니다. 변경 요청에는 same-origin과 double-submit CSRF를 적용했고, backend TTL과 cookie TTL을 맞췄습니다. 401도 단순 리다이렉트가 아니라 cookie 폐기와 사용자 안내를 분리했습니다.

### 건강정보 공개 정책

> 공개 홈의 당일 기록자 수는 기존 API와 화면 계약을 유지했습니다. 다만 소수 집단 추론 가능성을 기술 위험으로 기록하고, 최소 표본·반올림·비공개 여부는 제품·법무 결정 후 backend DTO, frontend type, E2E, production smoke를 함께 바꾸도록 경계를 정리했습니다. 별도 패턴 인사이트에는 기존 최소 표본과 소수 셀 억제를 계속 적용합니다.

### 동시성

> 일지와 반응은 선조회 후 저장 구조라 동시 요청이 unique 충돌이나 중복 토글을 만들 수 있었습니다. 현재 트래픽과 구현 복잡도를 고려해 사용자 행 pessimistic lock으로 직렬화했고, 단순 카운터는 DB 원자 UPDATE로 lost update를 막았습니다. DB unique 제약은 최종 방어선으로 유지했습니다.

### 배포 재현성

> staging 검증 이미지만 승격해도 production에서 최신 workflow bundle을 섞으면 재현성이 깨질 수 있었습니다. 승격 태그에서 commit SHA와 image digest를 확정하고, 같은 SHA의 배포 bundle을 checkout해 digest URI로 배포하도록 바꿨습니다.

답변은 항상 `문제 → 위험 → 대안 → 선택 → 검증 → 남은 한계` 순서로 말한다. “완벽하게 만들었다”보다 어떤 위험을 코드로 줄였고 어떤 항목은 운영 증적이 필요한지 구분하는 편이 더 신뢰를 준다.

## 11. 공부 순서

### 1주차: 요청 흐름

- 로그인 한 번을 Browser → BFF → Spring → DB 순서로 따라간다.
- Controller, Service, Repository 역할을 직접 메모한다.
- 401과 403 차이, cookie 속성, CSRF 이유를 설명해 본다.

### 2주차: transaction과 DB

- Journal upsert와 Reaction toggle의 SQL 순서를 그린다.
- lost update, unique constraint, pessimistic/optimistic lock 차이를 실습한다.
- Flyway migration과 application rollback 차이를 정리한다.

### 3주차: 권한과 개인정보

- 공개/회원/작성자/운영자 권한표를 만든다.
- 비밀사연 상세·댓글·반응·이미지 경로를 각각 따라간다.
- 건강정보 최소 표본과 소수 셀 억제 이유를 설명한다.

### 4주차: 배포와 장애 대응

- staging build SHA, ECR tag/digest, production checkout 관계를 그린다.
- RDS snapshot, PITR, restore drill, RTO/RPO 차이를 정리한다.
- 가상의 401 급증·DB migration 실패 장애 보고서를 작성한다.

## 12. 아직 코드만으로 끝나지 않은 항목

다음은 중요하지만 이번 작은 수정에 억지로 섞지 않았다.

- S3 삭제와 DB transaction 사이의 원자성: outbox와 재시도 worker 검토
- 이미지 MIME 외 magic byte 검증과 업로드 finalize 수명주기
- refresh token rotation, 재사용 탐지, 강제 로그아웃
- reaction 다형 대상의 DB FK 부재에 대한 정리 job 또는 구조 재설계
- runtime DB 계정과 Flyway DDL 계정 분리
- 실제 AWS MFA, secret rotation, RDS 자동 백업/PITR 확인
- 최신 snapshot을 별도 DB에 복원하는 정기 restore drill
- CloudWatch alarm과 운영 로그의 실제 증적
- GitHub Actions workflow의 `actionlint` 자동 검사

이 항목은 “코드가 빌드된다”로 완료 처리하면 안 된다. 담당자, 실행일, 결과, 복구 시간, 증적 링크가 있어야 운영 완료다.

## 13. 관련 문서

- 구조: `architecture-overview.md`
- 개발 규칙: `convention.md`, `development-master-playbook.md`
- API 지도: `api-maintenance-map.md`, `api-spec.md`
- DB: `erd.md`, `rds-restore-drill.md`
- 보안: `health-data-security-standard.md`, `ops-security-checklist.md`, `secret-management.md`
- 운영: `maintenance-handbook.md`, `operations-handbook.md`
- 배포: `deployment-aws.md`, `release-runbook.md`
- 면접 사례: `refactoring-case-study.md`, `portfolio.md`
