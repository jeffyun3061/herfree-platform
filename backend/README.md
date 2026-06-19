# Herfree Backend

## 빌드 vs 실행

| 명령 | 용도 |
|------|------|
| `./gradlew build` | 컴파일 + 테스트 (JAR 생성). **서버는 안 뜸** |
| `./run-local.ps1` | API 서버 실행 (**권장**) — 8080 점유 시 기존 프로세스 종료 |
| `./gradlew bootRun` | 직접 실행 — **8080이 이미 쓰이면 BUILD FAILED** |

`BUILD FAILED`가 `bootRun`에서만 난다면 **빌드 문제가 아니라 포트 충돌**입니다. `.\run-local.ps1`을 사용하세요.

## 로컬 실행 순서

1. 저장소 루트: `docker compose -f docker-compose.local.yml up -d`
2. `application-local.yml.example` → `application-local.yml` 복사 (gitignore)
3. (사진 업로드 테스트 시) `local-secrets.yml.example` → `local-secrets.yml` 복사 후 S3 dev 키 입력 (gitignore)
4. `cd backend && .\run-local.ps1`

## 이미지 업로드

**브라우저 → API → S3** (로컬·운영 동일).  
`local-secrets.yml`에 **bucket + access-key + secret-key** 필수. 상세: `infra/aws/README.md`

## 비밀 파일 (git 커밋 금지)

- `src/main/resources/application-local.yml`
- `local-secrets.yml`
- `.env` / OS 환경 변수의 S3·JWT 키

템플릿만 커밋: `application-local.yml.example`, `local-secrets.yml.example`, `.env.example`
