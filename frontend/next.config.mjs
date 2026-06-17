// Next.js 14는 next.config.ts를 지원하지 않아 mjs로 작성한다 (기존 next.config.ts 설정 이관)
/** @type {import('next').NextConfig} */
// 브라우저는 same-origin /api 사용. rewrite 대상만 서버 env로 지정 (Vercel 배포 시 필수).
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  images: {
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
