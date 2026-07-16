# Herfree 개발 컨벤션

Herfree는 Spring Boot 백엔드와 Next.js 프론트엔드가 함께 있는 서비스다.
코드는 기능보다 운영 중 문제가 생겼을 때 추적하고 고칠 수 있는 구조를 우선한다.

## 공통

- 도메인 규칙은 한 곳에 모으고, 화면이나 컨트롤러에 흩뿌리지 않는다.
- 사용자 입력은 DTO와 validation에서 먼저 거른다.
- 예외는 의미 있는 도메인 예외와 `ErrorCode`로 표현한다.
- 운영 설정, 비밀값, 로컬 설정은 커밋하지 않는다.
- 큰 변경은 문서와 테스트를 같이 남긴다.

## 백엔드

### 패키지 구조

```txt
backend/src/main/java/com/herfree
├─ domain
│  ├─ auth
│  ├─ user
│  ├─ board
│  ├─ post
│  ├─ comment
│  ├─ reaction
│  ├─ report
│  ├─ content
│  └─ video
└─ global
   ├─ config
   ├─ security
   ├─ exception
   ├─ response
   └─ storage
```

### 계층 역할

- Controller: HTTP 요청, 응답, validation만 담당한다.
- Service: 비즈니스 규칙과 트랜잭션 경계를 담당한다.
- Repository: 데이터 조회와 저장만 담당한다.
- Entity: 도메인 상태와 상태 변경 메서드를 가진다.

Controller에서 권한, 상태 변경, 복잡한 조회 조건을 직접 처리하지 않는다.

### 예외와 응답

- `RuntimeException`을 직접 던지지 않는다.
- 사용자에게 보여줄 수 있는 오류는 `BusinessException`과 `ErrorCode`로 관리한다.
- 내부 원인과 외부 응답 메시지를 분리한다.
- 인증, 개인정보, 토큰 관련 오류는 계정 존재 여부나 내부 상태를 과하게 드러내지 않는다.

### 데이터와 마이그레이션

- 운영 DB 변경은 Flyway migration으로 남긴다.
- 테이블, 인덱스, enum 의미가 바뀌면 `docs/erd.md` 또는 관련 문서를 갱신한다.
- 운영에서는 `ddl-auto`에 의존하지 않는다.
- 건강정보·개인정보를 바꾸는 migration은 `docs/templates/data-migration-review.md`로 권한, 파기, lock, 복구 영향을 검토한다.

### 보안 기준

- 비밀번호, JWT, refresh token, reset token, presigned URL은 로그에 남기지 않는다.
- 비공개 게시판과 개인 기록은 항상 소유자 또는 운영자 권한을 확인한다.
- 프록시 헤더는 신뢰 가능한 프록시에서 온 요청일 때만 사용한다.
- 외부 저장소에서 파일을 읽을 때는 content type과 크기를 먼저 확인한다.
- 운영 환경의 메일, 저장소, DB 오류는 조용히 성공으로 처리하지 않는다.
- 건강정보는 `docs/health-data-security-standard.md`의 D3로 분류하고, 수집 전 목적·접근·보유·파기·집계 기준을 승인받는다.
- 공개 통계는 기록 수만으로 공개하지 않고 서로 다른 사용자 수와 소수 셀 억제를 적용한다.

## 프론트엔드

### 구조

- `src/app`: 라우트와 페이지 조립
- `src/components`: 재사용 UI 컴포넌트
- `src/domain`: 도메인 타입, validation, 순수 로직
- `src/hooks`: API 호출과 화면 상태를 연결하는 hook
- `src/lib`: API client, storage, 공통 유틸

### 작성 기준

- 화면 컴포넌트에는 가능한 한 도메인 규칙을 넣지 않는다.
- API 요청/응답 타입은 `src/domain` 또는 관련 타입 파일과 맞춘다.
- 토큰과 사용자 세션은 필요한 범위만 저장한다.
- 접근 제한 화면은 단순히 숨기는 것에 그치지 않고 API 권한과 맞춘다.
- 버튼, 입력, 오류 메시지는 로딩/실패 상태를 함께 고려한다.

## 문서 갱신 기준

| 변경 내용 | 같이 볼 문서 |
| --- | --- |
| API 경로, 요청, 응답 변경 | `docs/api-spec.md` |
| 테이블, 컬럼, 인덱스 변경 | `docs/erd.md`, Flyway migration |
| 운영 설정 변경 | `docs/deployment-aws.md`, `docs/operator-manual.md` |
| 보안 정책 변경 | `docs/ops-security-checklist.md`, `docs/logging-policy.md` |
| 건강정보·개인정보·사고 대응 | `docs/health-data-security-standard.md`, `docs/templates/` |
| 큰 기술 결정 | `docs/decision-log.md` |

## 로컬 확인 명령

```powershell
cd backend
.\gradlew.bat test
.\gradlew.bat build
```

```powershell
cd frontend
npm run lint
npm run build
```

작업 범위가 작더라도 배포 전에는 백엔드와 프론트 전체 빌드를 모두 확인한다.
