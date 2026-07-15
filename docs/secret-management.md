# 비밀정보와 운영 보안 관리

이 문서는 Herfree를 개발·배포·운영하면서 API 키, 비밀번호, 토큰을 어디에 보관하고 어떻게 교체할지 정한 기준이다.

## 무엇이 비밀정보인가

| 항목 | 공개 여부 | 보관 위치 |
| --- | --- | --- |
| OAuth Client ID | 브라우저에 공개 가능 | 프론트 환경변수 |
| OAuth Client Secret | 비공개 | 로컬 제외 파일, AWS Secrets Manager 또는 EC2 환경변수 |
| JWT Secret | 비공개 | AWS Secrets Manager 또는 EC2 환경변수 |
| DB 비밀번호 | 비공개 | AWS Secrets Manager 또는 EC2 환경변수 |
| SMTP 비밀번호 | 비공개 | AWS Secrets Manager 또는 EC2 환경변수 |
| AWS Access/Secret Key | 비공개 | 가능하면 발급하지 않고 EC2 IAM Role 사용 |
| OAuth code/access token | 비공개·단기 | 저장하거나 로그에 남기지 않음 |

`NEXT_PUBLIC_`으로 시작하는 변수는 브라우저 번들에 포함된다. 이 변수에는 Client Secret, DB 비밀번호, JWT Secret을 절대 넣지 않는다.

## 환경별 보관 위치

### 로컬 개발

- 프론트 공개값: `frontend/.env.local`
- 백엔드 비밀값: `backend/local-secrets.yml`
- 두 파일은 Git에서 제외되며 다른 개발자에게 메신저나 문서로 전달하지 않는다.
- 팀 공유가 필요하면 승인된 비밀번호 관리 도구를 사용한다.

### 운영

- 우선순위 1: AWS Secrets Manager
- 우선순위 2: 권한을 제한한 EC2 운영 환경변수
- AWS 접근은 장기 Access Key보다 EC2 IAM Role을 우선한다.
- 운영 비밀값을 Vercel의 `NEXT_PUBLIC_` 변수에 넣지 않는다.
- `.env.prod.example`에는 변수 이름만 두며 실제 값은 넣지 않는다.

## Git 차단 장치

저장소에는 세 단계 검사가 있다.

1. `.gitignore`가 `.env`, `local-secrets.yml`, 인증서와 개인키를 제외한다.
2. `.githooks/pre-commit`이 커밋할 파일에서 비밀값 패턴을 검사한다.
3. GitHub Actions의 `secret-scan` 작업이 push된 전체 추적 파일을 다시 검사한다.

현재 작업 전체를 직접 검사할 때:

```powershell
node scripts/check-secrets.mjs --all
```

Git 훅을 새 PC에서 활성화할 때:

```powershell
.\scripts\setup-git-workflow.ps1
git config --get core.hooksPath
```

출력이 `.githooks`이면 활성화된 상태다. `git add -f`로 비밀 파일을 강제 추가하지 않는다.

## 키 교체 절차

1. 공급자 콘솔에서 새 Secret을 발급한다.
2. 운영 Secrets Manager 또는 환경변수에 새 값을 넣는다.
3. 백엔드를 재배포하고 health 및 해당 로그인·메일·DB 기능을 확인한다.
4. 새 값이 정상인 것을 확인한 뒤 이전 Secret을 폐기한다.
5. 교체 일시, 담당자, 대상 시스템만 운영 기록에 남긴다. Secret 값은 기록하지 않는다.

노출이 의심되면 정상 배포 확인을 기다리지 말고 해당 키를 즉시 폐기·재발급한다.

## Git에 실수로 올렸을 때

파일 삭제나 새 커밋만으로는 과거 Git 기록에서 값이 사라지지 않는다.

1. 유출된 Secret을 즉시 폐기하고 새로 발급한다.
2. 서비스 환경변수를 새 값으로 교체하고 재배포한다.
3. GitHub 저장소 공개 범위와 Actions 로그·빌드 산출물을 확인한다.
4. 필요한 경우 팀과 협의해 `git filter-repo`로 기록을 정리한다.
5. 기록을 강제 변경했다면 모든 작업자가 저장소를 다시 동기화하도록 공지한다.

기록 정리보다 Secret 폐기와 교체가 먼저다. 과거 기록을 지워도 이미 복제된 값은 회수할 수 없기 때문이다.

## 로그 금지 항목

- 로그인 비밀번호
- JWT와 refresh token
- OAuth authorization code와 access token
- OAuth Client Secret
- 비밀번호 재설정 토큰과 전체 URL
- 이메일 원문, 상담·일지·게시글 원문
- AWS Secret Key, DB·SMTP 비밀번호

장애 로그에는 request ID, 상태 코드, provider 이름, 내부 오류 분류만 남긴다.

## 운영자가 정기적으로 확인할 것

- 매주: GitHub Actions 실패, 로그인 실패율, 401/403/5xx 급증
- 매월: IAM 사용자·역할, 퇴사자·외주 인력 접근 권한, 사용하지 않는 OAuth 앱
- 배포 전: `node scripts/check-secrets.mjs --all`, 전체 테스트, 운영 환경변수 누락
- 키 교체 후: 이전 키 폐기 여부와 운영 스모크 테스트 결과
