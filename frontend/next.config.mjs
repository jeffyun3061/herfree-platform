// Next.js 14는 next.config.ts를 지원하지 않아 mjs로 작성한다 (기존 next.config.ts 설정 이관)
/** @type {import('next').NextConfig} */
const nextConfig = {
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
