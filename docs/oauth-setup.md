# OAuth 설정 기준

Herfree는 OAuth 앱을 개발용과 운영용으로 분리한다. 로컬 테스트 때문에 운영 OAuth 설정을 바꾸지 않고, 운영 배포 때문에 로컬 secret을 바꾸지 않는다.

## 기본 원칙

| 환경 | OAuth 앱 | Redirect origin | 값이 들어가는 곳 |
| --- | --- | --- | --- |
| Local | Herfree Dev | `http://localhost:3000` | `frontend/.env.local`, `backend/local-secrets.yml` |
| Production | Herfree Prod | 실제 프론트 도메인 | 프론트 배포 환경변수, 백엔드 운영 환경변수 |

- 로컬 파일에는 Dev 값만 둔다.
- 운영 Client Secret은 로컬 파일에 적지 않는다.
- OAuth 콘솔의 Redirect URI와 앱 환경변수의 Redirect URI는 글자 하나까지 같아야 한다.
- `localhost`와 `127.0.0.1`은 다른 주소다. 로컬 OAuth 테스트는 `http://localhost:3000`으로 접속한다.

## 로컬 개발 설정

### 프론트 `frontend/.env.local`

```env
NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN=http://localhost:3000

NEXT_PUBLIC_OAUTH_KAKAO_CLIENT_ID=카카오_DEV_REST_API_KEY
NEXT_PUBLIC_OAUTH_GOOGLE_CLIENT_ID=구글_DEV_CLIENT_ID
NEXT_PUBLIC_OAUTH_NAVER_CLIENT_ID=네이버_DEV_CLIENT_ID
```

프론트에는 공개 Client ID만 둔다. Client Secret은 넣지 않는다.

### 백엔드 `backend/local-secrets.yml`

```yaml
app:
  oauth:
    kakao:
      client-id: 카카오_DEV_REST_API_KEY
      client-secret: 카카오_DEV_CLIENT_SECRET
      redirect-uri: http://localhost:3000/auth/callback/kakao
    google:
      client-id: 구글_DEV_CLIENT_ID
      client-secret: 구글_DEV_CLIENT_SECRET
      redirect-uri: http://localhost:3000/auth/callback/google
    naver:
      client-id: 네이버_DEV_CLIENT_ID
      client-secret: 네이버_DEV_CLIENT_SECRET
      redirect-uri: http://localhost:3000/auth/callback/naver
```

`backend/local-secrets.yml`은 git에 커밋하지 않는다.

## 운영 배포 설정

운영 도메인이 `https://www.herfree.kr`라면 다음처럼 맞춘다.

### 프론트 운영 환경변수

```env
NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN=https://www.herfree.kr

NEXT_PUBLIC_OAUTH_KAKAO_CLIENT_ID=카카오_PROD_REST_API_KEY
NEXT_PUBLIC_OAUTH_GOOGLE_CLIENT_ID=구글_PROD_CLIENT_ID
NEXT_PUBLIC_OAUTH_NAVER_CLIENT_ID=네이버_PROD_CLIENT_ID
```

### 백엔드 운영 환경변수

```env
OAUTH_KAKAO_CLIENT_ID=카카오_PROD_REST_API_KEY
OAUTH_KAKAO_CLIENT_SECRET=카카오_PROD_CLIENT_SECRET
OAUTH_KAKAO_REDIRECT_URI=https://www.herfree.kr/auth/callback/kakao

OAUTH_GOOGLE_CLIENT_ID=구글_PROD_CLIENT_ID
OAUTH_GOOGLE_CLIENT_SECRET=구글_PROD_CLIENT_SECRET
OAUTH_GOOGLE_REDIRECT_URI=https://www.herfree.kr/auth/callback/google

OAUTH_NAVER_CLIENT_ID=네이버_PROD_CLIENT_ID
OAUTH_NAVER_CLIENT_SECRET=네이버_PROD_CLIENT_SECRET
OAUTH_NAVER_REDIRECT_URI=https://www.herfree.kr/auth/callback/naver
```

운영 값은 EC2 `.env.prod`, AWS Secrets Manager, 배포 플랫폼 환경변수처럼 코드 밖에서 주입한다.

## Provider 콘솔 입력값

### 카카오 Dev

| 항목 | 값 |
| --- | --- |
| Web 플랫폼 사이트 도메인 | `http://localhost:3000` |
| Redirect URI | `http://localhost:3000/auth/callback/kakao` |

### 카카오 Prod

| 항목 | 값 |
| --- | --- |
| Web 플랫폼 사이트 도메인 | `https://www.herfree.kr` |
| Redirect URI | `https://www.herfree.kr/auth/callback/kakao` |

### 구글 Dev

| 항목 | 값 |
| --- | --- |
| 승인된 JavaScript 원본 | `http://localhost:3000` |
| 승인된 리디렉션 URI | `http://localhost:3000/auth/callback/google` |

### 구글 Prod

| 항목 | 값 |
| --- | --- |
| 승인된 JavaScript 원본 | `https://www.herfree.kr` |
| 승인된 리디렉션 URI | `https://www.herfree.kr/auth/callback/google` |

### 네이버 Dev

| 항목 | 값 |
| --- | --- |
| 서비스 URL | `http://localhost:3000` |
| Callback URL | `http://localhost:3000/auth/callback/naver` |

### 네이버 Prod

| 항목 | 값 |
| --- | --- |
| 서비스 URL | `https://www.herfree.kr` |
| Callback URL | `https://www.herfree.kr/auth/callback/naver` |

## 테스트 순서

1. 로컬은 Dev OAuth 앱 값으로 `frontend/.env.local`, `backend/local-secrets.yml`을 맞춘다.
2. 프론트와 백엔드를 재시작한다.
3. 브라우저에서 `http://localhost:3000`으로 접속한다.
4. 카카오, 구글, 네이버 로그인 버튼을 각각 확인한다.
5. 운영 배포 전에는 Prod OAuth 앱 값이 배포 환경변수에 들어갔는지 확인한다.
6. 운영 배포 후 실제 도메인에서 소셜 로그인 smoke test를 진행한다.

## 자주 나는 오류

| 오류 | 의미 | 확인할 것 |
| --- | --- | --- |
| Kakao `KOE006` | Redirect URI 불일치 | 카카오 콘솔 Redirect URI와 프론트 origin |
| Google `redirect_uri_mismatch` | Redirect URI 불일치 | 구글 승인된 리디렉션 URI |
| Naver 서비스 설정 오류 | 서비스 URL 또는 Callback URL 불일치 | 네이버 서비스 URL, Callback URL |
| 백엔드 401 | code 교환 실패 | 백엔드 Client Secret, redirect-uri, code 재사용 여부 |
