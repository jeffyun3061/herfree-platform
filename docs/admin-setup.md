# Herfree — 관리자 계정 설정

운영 정책: **회원가입은 항상 USER**. 관리자는 DB에서 role만 `ADMIN`으로 올린다.  
코드·가입 화면으로 ADMIN을 주지 않는다.

---

## 1. 로컬 개발 (추천 순서)

### 1단계 — 앱에서 가입

1. http://localhost:3000 접속
2. **회원가입** (운영자용 이메일·비밀번호 직접 설정)

### 2단계 — ADMIN 승격

PowerShell (프로젝트 루트):

```powershell
.\infra\scripts\promote-admin.ps1 -Email "운영자@email.com"
```

### 3단계 — 재로그인

JWT에 role이 담기므로 **로그아웃 → 다시 로그인** 후 `/admin` 접속.

---

## 2. 운영 서버 (VPS / RDS)

배포 후 동일하게 **가입 → SQL 1회 → 재로그인**.

```sql
UPDATE users SET role = 'ADMIN' WHERE email = '운영자@email.com';
```

MySQL CLI 예:

```bash
docker exec -it herfree-mysql-prod mysql -uherfree_user -p herfree_db
```

---

## 3. 하지 말 것

| 금지 | 이유 |
|------|------|
| 코드에 관리자 이메일 하드코딩 | Git 유출·변경 어려움 |
| 회원가입 API에서 ADMIN 선택 | 누구나 관리자 가능 |
| Flyway에 운영 ADMIN 시드 | 기본 비밀번호 노출 위험 |

---

## 4. 관리자 확인

- 마이페이지에 **관리자 페이지** 링크 노출
- `GET /api/admin/reports` — 403이 아니면 성공

---

## 5. 인수인계 문구 (운영자용)

> 첫 운영자는 앱에서 일반 가입 후, 개발팀이 DB에서 role을 ADMIN으로 변경합니다.  
> 이후 추가 관리자도 동일한 방식으로 승격합니다.
