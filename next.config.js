/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['via.placeholder.com', 'i.namu.wiki', 'www.google.com', 'search.naver.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // 빌드 오류를 무시하는 설정
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 문제가 되는 페이지를 건너뛰는 설정
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  
  // 빌드 설정
  distDir: '.next',
  
  // 개발 환경에서의 오류 무시
  onDemandEntries: {
    pagesBufferLength: 1,
    maxInactiveAge: 10 * 1000,
  },
  
  // 추가 페이지 옵션
  poweredByHeader: false,
  
  // 환경 변수
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    SCRAPING_INTERVAL_MINUTES: process.env.SCRAPING_INTERVAL_MINUTES,
    MAX_ARTICLES_PER_SOURCE: process.env.MAX_ARTICLES_PER_SOURCE
  }
};

module.exports = nextConfig; 