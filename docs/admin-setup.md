# Herfree — 관리자·권한 운영 가이드

## 현재 staging/production 기준 — 2026-10-24

공개 배포에서는 `ADMIN_BOOTSTRAP_ENABLED=false`를 유지한다. 아래 bootstrap 예시는 로컬 개발용이며,
관리자 접속 문제를 해결하려고 운영 bootstrap을 켜거나 계정 비밀번호를 자동 동기화하지 않는다.
배포 검증도 공개 환경의 bootstrap 활성화를 거부한다.

실제 운영 책임자의 계정을 먼저 확인한다. 이 문서에 예시로 적힌 이메일을 실제 승인된 운영자라고
간주하지 않는다. 기존 계정의 역할과 MFA 등록 상태를 확인하고, 계정별 본인 확인 뒤 일회성
등록 승인을 발급한다. 전체 관리자에게 등록을 열거나 MFA를 끄는 방식으로 복구하지 않는다.

관리 API는 역할과 서버가 검증한 15분 MFA를 함께 요구한다. 역할별 화면은
[운영자·개발자 접근 안내](operator-developer-access.md), 키 준비·최초 등록·분실 복구는
[운영 개선 실행서](operations-improvements.md#2-mfa-키와-최초-등록-준비)를 따른다.
키 준비와 계정 본인 확인은 별개이며 어느 한쪽만으로 운영 적용 완료를 판정하지 않는다.

## 로컬 개발 — 고정 관리자 (바로 로그인)

`backend/src/main/resources/application-local.yml` 에 bootstrap이 켜져 있습니다.

| 항목 | 값 |
|------|-----|
| 이메일 | 로컬 설정의 `ADMIN_EMAIL` 값 |
| 비밀번호 | 로컬 설정의 `ADMIN_PASSWORD` 값 (공유·재사용 금지) |
| role | `SUPER_ADMIN` (서버 기동 시 자동) |

1. Docker MySQL + `.\gradlew bootRun`
2. http://localhost:3000/login 에서 위 계정 로그인
3. `/admin` 접속

`sync-existing: true` 이므로 계정이 이미 있어도 **역할·비밀번호가 동기화**됩니다.

`app.demo-seed.sync-existing: true` 이면 `demo1@herfree.local` ~ `demo12@herfree.local` 비밀번호도 `DEMO_PASSWORD` 환경변수 값으로 재동기화됩니다. 값이 없으면 시드를 실행하지 않습니다.

---

## 원칙

| 규칙 | 설명 |
|------|------|
| 회원가입 | **항상 `USER`** — API·UI에서 역할 선택 없음 |
| 최초 운영자 | 본인 확인된 계정을 지정하고 승인된 운영 절차로 역할·감사 이력을 남김. 공개 환경 bootstrap 금지 |
| 추가 운영자 | **SUPER_ADMIN**이 `/admin` → **회원** 탭에서 승격 |
| 권한 변경 로그 | `role_audit_logs` 테이블에 자동 기록 |

## 역할 (Staff)

| Role | 권한 |
|------|------|
| `USER` | 일반 회원 — 글·댓글·일지 |
| `MODERATOR` | 신고 처리, 게시글/댓글 숨김 |
| `ADMIN` | 콘텐츠·영상·제품, 일지 집계, **회원 상태**(정지/해제), 회원 목록 |
| `SUPER_ADMIN` | 위 전부 + **역할 부여**(USER/MODERATOR/ADMIN) |

`SUPER_ADMIN` 승격은 UI/API로 불가하다. 공개 환경에서는 본인 확인과 승인 기록이 있는 운영 절차로만 처리한다.

---

## 1. 로컬 개발 SUPER_ADMIN — 부트스트랩 (공개 배포 금지)

서버 기동 시 1회만 계정이 없으면 생성합니다. **비밀번호는 환경변수/시크릿만** 사용하세요.

```env
ADMIN_BOOTSTRAP_ENABLED=true
ADMIN_EMAIL=herpfree3@gmail.com
ADMIN_PASSWORD=CHANGE_ME_STRONG_ADMIN_PASSWORD
ADMIN_NICKNAME=운영자
```

로컬 `application-local.yml` 예시는 `application-local.yml.example` 참고.

이미 동일 이메일이 있으면 **건너뜁니다** (기존 role 유지).

이 방법은 로컬에서만 사용합니다. staging/production에서는 처음부터 `ADMIN_BOOTSTRAP_ENABLED=false`를 유지합니다.
운영 중에는 공유 관리자 계정을 만들지 말고 각 운영자 계정을 역할별로 승인합니다.

---

## 2. 최초 SUPER_ADMIN — 방법 B (SQL)

다음은 역할 변경 구조를 설명하는 예시이며 운영 실행 명령이 아닙니다. 운영 대상 ID·본인 확인·
변경 승인·감사 이력을 확보하기 전에는 실행하지 않습니다. 예시 이메일을 그대로 사용하지 않습니다.

```sql
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'herpfree3@gmail.com';
```

가입 후 실행 → **로그아웃 → 재로그인** (JWT role 갱신).

---

## 3. 최초 SUPER_ADMIN — 방법 C (로컬 스크립트)

로컬 개발 환경용입니다. 운영 계정 본인 확인이나 MFA 등록 승인을 대신하지 않습니다.

```powershell
cd C:\dev\herfree-platform
.\infra\scripts\promote-admin.ps1 -Email "herpfree3@gmail.com"
```

`SUPER_ADMIN`으로 승격합니다.

---

## 4. 추가 관리자 / 모더레이터

1. 대상자가 **일반 회원가입** (`USER`)
2. **SUPER_ADMIN**으로 로그인 → `/admin` → **회원** 탭
3. 역할을 `MODERATOR` 또는 `ADMIN`으로 변경
4. 대상자 **재로그인** 필요

역할·계정 상태 변경은 `role_audit_logs`에 기록됩니다.

---

## 5. 하지 말 것

| 금지 | 이유 |
|------|------|
| 코드에 운영 비밀번호 하드코딩 | Git 유출 위험 |
| 회원가입에서 ADMIN 선택 | 누구나 관리자 가능 |
| Flyway에 운영자 시드 + 기본 비번 | 저장소 노출 |

---

## 6. 확인

- 마이페이지 **운영 관리 페이지** 링크 (MODERATOR 이상)
- `GET /api/admin/reports` — MODERATOR+ 및 유효한 MFA: 200
- `PATCH /api/admin/users/{id}/role` — SUPER_ADMIN 및 유효한 MFA만 200

---

## 7. 인수인계 문구

> 첫 운영자는 본인 확인과 승인 기록으로 지정하고 계정별 MFA 등록을 완료합니다. 공개 환경 bootstrap은 꺼 둡니다.
> 이후 MODERATOR/ADMIN은 MFA 인증한 SUPER_ADMIN이 관리 화면에서 승격하며, 모든 권한 변경은 감사 로그에 남습니다.
