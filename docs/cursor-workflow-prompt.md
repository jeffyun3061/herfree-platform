# Cursor 작업 지시문

Cursor에서 Herfree 작업을 맡길 때 아래 내용을 그대로 붙여넣는다.
작업 내용만 마지막 줄에 구체적으로 바꿔서 사용한다.

```txt
이 저장소는 C:\dev\herfree-platform 의 Herfree 실서비스 코드입니다.

작업 전 반드시 git status를 확인하고, 이미 수정된 파일은 사용자의 변경으로 보고 되돌리지 마세요.
작업 범위와 관계없는 파일은 수정하거나 stage하지 마세요.

프로젝트 규칙은 아래 문서를 기준으로 따르세요.
- docs/CONTRIBUTING.md
- docs/convention.md
- docs/api-spec.md
- docs/ops-security-checklist.md
- docs/logging-policy.md
- docs/release-runbook.md

커밋 메시지는 Conventional Commits 형식을 사용하고, 한글 요약을 허용합니다.
예: security(auth): 로그인 계정 열거 가능성 완화
예: fix(frontend): 회원가입 요청에 약관 동의값 포함
예: docs(ops): 운영 로그 관리 기준 정리

보안 관련 작업에서는 특히 아래를 확인하세요.
- 비밀번호, JWT, refresh token, reset token, reset URL, presigned URL을 로그에 남기지 않기
- 로그인/비밀번호 재설정 응답에서 계정 존재 여부가 드러나지 않기
- 비공개 게시판과 개인 기록은 소유자 또는 운영자만 조회 가능하게 하기
- 운영 환경의 메일, DB, 저장소 실패를 조용히 성공 처리하지 않기
- 실제 시크릿이나 운영 비밀번호를 커밋하지 않기

백엔드 변경 후:
cd backend
.\gradlew.bat test
.\gradlew.bat build

프론트 변경 후:
cd frontend
npm run lint
npm run build

작업이 끝나면 아래 형식으로 보고하세요.
1. 변경 요약
2. 확인한 테스트
3. 운영 영향
4. 남은 위험 또는 후속 작업

이번 작업:
여기에 원하는 작업을 적으세요.
```

## 짧게 맡길 때

```txt
Herfree 작업입니다. docs/CONTRIBUTING.md와 docs/convention.md를 지키고, git status 먼저 확인한 뒤 사용자 변경은 되돌리지 마세요. 작업 후 테스트 결과와 운영 영향을 짧게 정리해 주세요. 이번 작업: ...
```

## 커밋까지 맡길 때

```txt
Herfree 작업입니다. 변경 범위 확인 후 관련 파일만 stage하고 Conventional Commits 형식의 한글 커밋 메시지로 커밋해 주세요. 커밋 전 git diff --cached --name-only로 staged 파일 목록을 보여 주세요. 이번 작업: ...
```
