import nextConfig from '../next.config.mjs';

async function contentSecurityPolicyFor(nodeEnv) {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;
  try {
    const rules = await nextConfig.headers();
    const header = rules
      .flatMap((rule) => rule.headers)
      .find(({ key }) => key.toLowerCase() === 'content-security-policy');
    if (!header?.value) throw new Error(`${nodeEnv} CSP header is missing.`);
    return header.value;
  } finally {
    process.env.NODE_ENV = previous;
  }
}

const development = await contentSecurityPolicyFor('development');
const production = await contentSecurityPolicyFor('production');

if (!development.includes("'unsafe-eval'")) {
  throw new Error('Development CSP must allow Next.js React Refresh.');
}
if (production.includes("'unsafe-eval'")) {
  throw new Error('Production CSP must not allow unsafe-eval.');
}
if (!production.includes("frame-ancestors 'none'")) {
  throw new Error('Production CSP must deny framing.');
}

console.log('[보안 헤더 확인 완료] 개발 HMR 허용 / 운영 unsafe-eval 차단');
