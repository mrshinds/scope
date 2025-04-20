import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 보호된 경로 배열
const protectedRoutes = ['/dashboard', '/admin', '/my', '/scraps'];

// 인증이 필요없는 공개 API 경로
const publicApiRoutes = ['/api/news', '/api/press'];

// 인증 API 관련 경로
const authRoutes = ['/auth/callback', '/login', '/verify', '/set-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 인증 콜백 URL은 그대로 통과
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next();
  }

  // 로그인, 회원가입 등 인증 관련 페이지는 그대로 통과
  if (authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 공개 API는 인증 없이 허용
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 보호된 경로에만 인증 적용
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Supabase 클라이언트 초기화
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    // 쿠키에서 세션 정보 가져오기
    const { data: { session } } = await supabase.auth.getSession();

    // 인증되지 않은 사용자면 로그인 페이지로 리디렉션
    if (!session) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 그 외 모든 요청은 계속 진행
  return NextResponse.next();
}

// 미들웨어가 실행될 경로 구성
export const config = {
  matcher: [
    /*
     * 다음 경로에 미들웨어 실행
     * - 모든 API 경로 (/api/*)
     * - 대시보드와 관리자 페이지 (/dashboard/*, /admin/*)
     * - 인증 콜백 등 (/auth/*)
     * - 개인 페이지 (/my/*)
     * - 스크랩 페이지 (/scraps/*)
     */
    '/api/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/my/:path*',
    '/scraps/:path*',
  ],
}; 