# Herfree 운영 DNS 전환 런북

목표는 `www.herpfree.co.kr`를 운영 canonical 주소로 유지하고, 루트 주소
`herpfree.co.kr`를 `www`로 연결하는 것이다. DNS 변경 전에는 현재 레코드를
백업하고, 메일 레코드를 포함해 누락 없이 복사한다.

## 현재 기준

| 이름 | 역할 | 변경 원칙 |
| --- | --- | --- |
| `www.herpfree.co.kr` | Amplify/CloudFront 프론트 | Amplify 콘솔이 현재 제시하는 CNAME 사용 |
| `api.herpfree.co.kr` | EC2 API | 현재 A 레코드를 먼저 확인하고 원본 IP를 문서화 |
| `herpfree.co.kr` | 루트 주소 | 전환 완료 후 `www`로 301/리디렉션 확인 |

## 변경 전 중단 조건

- Gabia의 A/CNAME/MX/TXT/CAA 전체 목록을 백업하지 못한 경우
- Amplify 도메인 상태가 `AVAILABLE`이 아니거나 인증 CNAME을 확인하지 못한 경우
- 메일의 MX, SPF, DKIM, DMARC 레코드가 식별되지 않은 경우
- API 원본 IP와 TLS 인증서 상태를 확인하지 못한 경우
- 롤백할 기존 DNS 값과 변경 담당자가 정해지지 않은 경우

## 순서

1. `powershell -ExecutionPolicy Bypass -File scripts/check-production-dns.ps1` 실행
2. Gabia DNS 전체 레코드를 캡처/내보내기
3. Cloudflare에 zone을 추가하고 기존 레코드를 먼저 입력
4. Amplify 인증용 CNAME은 **DNS-only**로 입력한다. 프록시를 켜지 않는다.
5. 네임서버를 Cloudflare가 제공한 값으로 변경한다.
6. 전파 후 `www`, API health, OAuth callback, 로그인, 게시글 작성/이미지 조회를 확인한다.
7. 루트 주소가 `www`로 연결되는지 확인한다.
8. 이상이 없을 때만 API 원본 보호와 WAF/rate limiting을 단계적으로 켠다.

## 롤백

DNS 응답이나 메일이 이상하면 Cloudflare 레코드를 추측해서 고치지 말고,
백업한 기존 네임서버/DNS 값을 기준으로 되돌린 뒤 원인과 시간을 기록한다.
변경 직후에도 기존 DNS를 삭제하지 말고 최소 48시간 보존한다.

## 확인 명령

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-production-dns.ps1
powershell -ExecutionPolicy Bypass -File scripts/verify-production-live.ps1 -RequireFrontend
```

두 번째 명령이 실패하면 배포를 재시도하지 말고, 보고서의 실패 항목부터 확인한다.
