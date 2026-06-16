# Herfree — 관리자·권한 운영 가이드

## 원칙

| 규칙 | 설명 |
|------|------|
| 회원가입 | **항상 `USER`** — API·UI에서 역할 선택 없음 |
| 최초 운영자 | DB seed / 부트스트랩 / 운영 스크립트로 **1명** 생성 |
| 추가 운영자 | **SUPER_ADMIN**이 `/admin` → **회원** 탭에서 승격 |
| 권한 변경 로그 | `role_audit_logs` 테이블에 자동 기록 |

## 역할 (Staff)

| Role | 권한 |
|------|------|
| `USER` | 일반 회원 — 글·댓글·일지 |
| `MODERATOR` | 신고 처리, 게시글/댓글 숨김 |
| `ADMIN` | 콘텐츠·영상·제품, 일지 집계, **회원 상태**(정지/해제), 회원 목록 |
| `SUPER_ADMIN` | 위 전부 + **역할 부여**(USER/MODERATOR/ADMIN) |

`SUPER_ADMIN` 승격은 UI/API로 불가 — bootstrap 또는 DB 스크립트만.

---

## 1. 최초 SUPER_ADMIN — 방법 A (부트스트랩, 권장)

서버 기동 시 1회만 계정이 없으면 생성합니다. **비밀번호는 환경변수/시크릿만** 사용하세요.

```env
ADMIN_BOOTSTRAP_ENABLED=true
ADMIN_EMAIL=admin@herfree.kr
ADMIN_PASSWORD=강력한-비밀번호
ADMIN_NICKNAME=운영자
```

로컬 `application-local.yml` 예시는 `application-local.yml.example` 참고.

이미 동일 이메일이 있으면 **건너뜁니다** (기존 role 유지).

---

## 2. 최초 SUPER_ADMIN — 방법 B (SQL)

```sql
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = '운영자@email.com';
```

가입 후 실행 → **로그아웃 → 재로그인** (JWT role 갱신).

---

## 3. 최초 SUPER_ADMIN — 방법 C (로컬 스크립트)

```powershell
cd C:\dev\herfree-platform
.\infra\scripts\promote-admin.ps1 -Email "운영자@email.com"
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
- `GET /api/admin/reports` — MODERATOR+: 200
- `PATCH /api/admin/users/{id}/role` — SUPER_ADMIN만 200

---

## 7. 인수인계 문구

> 첫 운영자는 환경변수 bootstrap 또는 DB에서 `SUPER_ADMIN`으로 1명만 만듭니다.  
> 이후 MODERATOR/ADMIN은 SUPER_ADMIN이 관리 화면에서 승격하며, 모든 권한 변경은 감사 로그에 남습니다.
