import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

const providers = {
  kakao: 'NEXT_PUBLIC_OAUTH_KAKAO_CLIENT_ID',
  google: 'NEXT_PUBLIC_OAUTH_GOOGLE_CLIENT_ID',
  naver: 'NEXT_PUBLIC_OAUTH_NAVER_CLIENT_ID',
};

const requiredProviders = (process.env.NEXT_PUBLIC_OAUTH_REQUIRED_PROVIDERS || 'kakao,google,naver')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const errors = [];

for (const provider of requiredProviders) {
  const envName = providers[provider];
  if (!envName) {
    errors.push(`지원하지 않는 OAuth provider가 설정되어 있습니다: ${provider}`);
    continue;
  }
  const value = process.env[envName]?.trim();
  if (!value || /^(your_|change_me)/i.test(value)) {
    errors.push(`${envName} 값이 비어 있거나 예제 값입니다.`);
  }
}

const originValue = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN?.trim();
if (!originValue) {
  errors.push('NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN 값이 없습니다.');
} else {
  try {
    const origin = new URL(originValue);
    const isLocalhost = origin.hostname === 'localhost';
    if (origin.pathname !== '/' || origin.search || origin.hash) {
      errors.push('NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN에는 도메인만 입력해야 합니다.');
    }
    if (isLocalhost && origin.protocol !== 'http:') {
      errors.push('로컬 OAuth origin은 http://localhost:3000을 사용해야 합니다.');
    }
    if (!isLocalhost && origin.protocol !== 'https:') {
      errors.push('운영 OAuth origin은 HTTPS여야 합니다.');
    }
  } catch {
    errors.push('NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN이 올바른 URL이 아닙니다.');
  }
}

if (errors.length > 0) {
  console.error('\n[OAuth 환경 설정 오류]');
  for (const error of errors) console.error(`- ${error}`);
  console.error('- docs/oauth-setup.md의 Local/Prod 표를 확인하세요.\n');
  process.exit(1);
}

console.log(`[OAuth 환경 확인 완료] ${requiredProviders.join(', ')} / ${originValue}`);
