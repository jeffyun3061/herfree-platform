# OAuth 환경별 관리 방법

Herfree는 OAuth 앱과 키를 `Dev`와 `Prod`로 분리한다. 주석을 풀고 다시 막는 방식으로 전환하지 않고, 같은 코드에 환경별 값을 외부에서 주입한다.

## 환경별 기준

| 구분 | 로컬 개발 | 운영 배포 |
| --- | --- | --- |
| OAuth 콘솔 앱 | `Herfree Dev` | `Herfree Prod` |
| 프론트 공개 Client ID | `frontend/.env.local` | 배포 플랫폼 환경변수 |
| 백엔드 Client ID/Secret | `backend/local-secrets.yml` | EC2 `.env.prod` 또는 AWS Secrets Manager |
| Redirect origin | `http://localhost:3000` | `https://www.herpfree.co.kr` |
| Git 커밋 | 예제 파일만 | 예제 파일만 |

## 개발자가 직접 변경하는 곳

로컬 OAuth 앱을 만들거나 키를 재발급했을 때 아래 두 파일만 변경한다.

1. `frontend/.env.local`
   공개 가능한 Dev Client ID와 `NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN`을 넣는다.
2. `backend/local-secrets.yml`
   Dev Client ID, Client Secret, provider별 Redirect URI를 넣는다.

키를 바꾼 뒤에는 프론트와 백엔드를 모두 재시작한다. Next.js와 Spring Boot는 시작할 때 환경변수를 읽는다.

```powershell
cd frontend
npm.cmd run check:oauth
npm.cmd run build

cd ..\backend
.\gradlew.bat test
```

`npm run build`는 `check:oauth`를 먼저 자동 실행한다. 필수 Client ID가 없거나 origin이 잘못되면 배포용 빌드를 중단한다. 백엔드는 요청의 Callback URI가 서버 설정과 정확히 다르면 외부 OAuth 서버를 호출하기 전에 `400`으로 거부한다.

## 운영 배포 방법

운영에서는 저장소의 로컬 파일을 수정하지 않는다. `.env.prod.example`을 기준표로 사용하고 실제 값은 EC2 환경변수나 AWS Secrets Manager에 입력한다.

```env
NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN=https://www.herpfree.co.kr
NEXT_PUBLIC_OAUTH_REQUIRED_PROVIDERS=kakao,google,naver

OAUTH_KAKAO_REDIRECT_URI=https://www.herpfree.co.kr/auth/callback/kakao
OAUTH_GOOGLE_REDIRECT_URI=https://www.herpfree.co.kr/auth/callback/google
OAUTH_NAVER_REDIRECT_URI=https://www.herpfree.co.kr/auth/callback/naver
```

실제 Client ID와 Client Secret은 문서나 Git에 적지 않는다.

## 보안 규칙

- `NEXT_PUBLIC_` 변수에는 Client Secret을 절대 넣지 않는다. 브라우저 번들에서 공개되는 값이다.
- Dev 키를 운영에 사용하거나 Prod 키를 로컬에 사용하지 않는다.
- Client Secret을 재발급하면 백엔드 환경변수만 교체하고 프론트 Client ID는 필요한 경우에만 바꾼다.
- 콘솔 Callback URI, 프론트 origin, 백엔드 redirect-uri는 글자 하나까지 일치시킨다.
- 실제 `.env.local`, `.env.prod`, `local-secrets.yml`은 Git에 커밋하지 않는다.

## 배포 전 확인

- Kakao, Google, Naver에 Dev/Prod 앱이 각각 존재한다.
- 운영 Callback URI가 모두 `https://www.herpfree.co.kr/auth/callback/{provider}` 형식이다.
- 로컬 빌드는 Dev 키로, CI/운영 빌드는 Prod 키로 실행된다.
- 세 provider 로그인 후 신규 가입과 기존 계정 재로그인을 각각 확인한다.
- 브라우저 네트워크와 백엔드 로그에 Client Secret, authorization code, access token이 남지 않는다.
