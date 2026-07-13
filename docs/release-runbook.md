# Herfree 배포/롤백 런북

## 브랜치와 커밋

- `main`: 운영 배포 기준
- 작업 브랜치: 기능/보안 수정
- 운영 배포 전에는 백엔드 build와 프론트 lint/build가 모두 통과해야 한다.

## 배포 전 체크

```bash
cd backend
./gradlew build

cd ../frontend
npm run lint
npm run build
```

확인 항목:

- `.env.prod`가 git에 포함되지 않았는지
- `JWT_SECRET`, DB 비밀번호, SMTP 비밀번호, S3 키가 git에 없는지
- `APP_MAIL_MODE=smtp`
- `TRUSTED_PROXY_CIDRS`가 실제 프록시 CIDR만 가리키는지
- `CORS_ALLOWED_ORIGINS`가 실제 프론트 도메인인지

## 배포 후 smoke test

| 순서 | 테스트 | 기대 결과 |
|------|--------|-----------|
| 1 | `/actuator/health` | 200 |
| 2 | 회원가입/로그인 | access token 발급 |
| 3 | 비밀번호 재설정 | 실제 메일 수신 |
| 4 | 게시글 작성/수정/삭제 | 정상 처리 |
| 5 | 이미지 업로드/조회 | S3 저장 및 API 프록시 조회 |
| 6 | 문의/상담 게시판 | 본인 또는 운영자만 조회 |
| 7 | 관리자 신고 처리 | 숨김/복구 정상 |

## 롤백

1. 현재 장애 증상을 기록한다.
2. 직전 정상 배포 커밋을 확인한다.
3. 서버에서 직전 이미지/커밋으로 재배포한다.
4. DB migration이 포함된 배포라면 롤백 전 개발자가 migration 영향을 확인한다.
5. smoke test를 다시 수행한다.

## 장애 시 우선순위

1. 인증/로그인 장애
2. DB 연결 장애
3. 비밀번호 재설정 메일 장애
4. 이미지 업로드/조회 장애
5. 관리자 기능 장애

사용자 개인정보나 토큰이 로그에 노출된 정황이 있으면 즉시 배포를 중단하고 로그 접근 범위를 제한한다.

