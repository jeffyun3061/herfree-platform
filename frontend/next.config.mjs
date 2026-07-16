// Next.js 14는 next.config.ts를 지원하지 않아 mjs로 작성한다 (기존 next.config.ts 설정 이관)
/** @type {import('next').NextConfig} */
// 브라우저는 same-origin /api 사용. rewrite 대상만 서버 env로 지정 (Vercel 배포 시 필수).
const nextConfig = {
  // 개발 서버와 배포 전 검증 빌드가 동시에 실행돼도 산출물이 충돌하지 않게 한다.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async headers() {
    const developmentScriptPolicy =
      process.env.NODE_ENV === 'development'
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'";
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      // Next 개발 서버의 React Refresh만 eval이 필요하며 운영 빌드에서는 허용하지 않는다.
      developmentScriptPolicy,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
