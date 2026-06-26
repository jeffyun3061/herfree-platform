# AWS S3 — 게시글 이미지 (로컬·운영 공통)

로컬과 운영 모두 **브라우저 → API → S3** 구조입니다. S3 업로드용 CORS는 필요 없습니다.

## 1. 버킷 생성 (필수)

AWS 콘솔 → S3 → 버킷 만들기

| 항목 | 값 |
|------|-----|
| 리전 | `ap-northeast-2` |
| 이름 예 (dev) | `herfree-dev-uploads` |
| 이름 예 (prod) | `herfree-prod-uploads` |

퍼블릭 **쓰기**는 금지. API 서버 IAM으로만 PutObject 합니다.

`herfree-dev-s3-user` 등 업로드 전용 IAM 사용자에는 **CreateBucket 권한이 없습니다**.  
버킷은 **루트/관리자 계정**으로 콘솔에서 만들고, S3 화면 우측 상단 **계정 ID**가 IAM 사용자와 같은지 확인하세요.

## 2. IAM 정책 연결 (필수)

`infra/aws/s3-iam-policy.json`에서 `HERFREE_BUCKET_NAME`을 실제 버킷명으로 바꾼 뒤,  
S3용 IAM 사용자에 정책을 연결합니다.

## 3. 로컬 설정 — `backend/local-secrets.yml`

```yaml
app:
  s3:
    bucket: "herfree-dev-uploads"   # AWS에 만든 이름과 동일
    access-key: "..."
    secret-key: "..."
```

`application-local.yml`에는 **bucket·키를 넣지 마세요** (덮어쓰기 버그 방지).

## 4. 운영 — `.env.prod`

```env
S3_BUCKET=herfree-prod-uploads
S3_REGION=ap-northeast-2
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

## 5. 이미지 조회 (GetObject)

글에 표시할 이미지 URL은 S3 HTTPS 주소입니다.  
`posts/*` 경로에 GetObject 읽기 권한(버킷 정책 또는 CloudFront)이 필요합니다.

## 6. 오류 메시지

| 메시지 | 조치 |
|--------|------|
| S3 버킷을 찾을 수 없습니다 | 버킷 생성·`bucket` 이름 일치 확인 |
| S3 업로드 권한이 없습니다 | IAM `s3:PutObject` on `posts/*` + `s3:ListBucket`(prefix `posts/*`) |
| S3 키를 확인해 주세요 | `local-secrets.yml` 키·버킷 확인 |
