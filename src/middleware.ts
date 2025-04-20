import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 보호된 경로 배열
const protectedRoutes = ['/dashboard', '/admin', '/my', '/scraps'];

// 인증이 필요없는 공개 API 경로
const publicApiRoutes = ['/api/news', '/api/press'];

// 인증 API 관련 경로
const authRoutes = ['/auth/callback', '/login', '/verify', '/set-password'];

// 운영 환경 확인
const isProd = process.env.NODE_ENV === 'production';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 디버깅 로그 추가
  console.log('미들웨어 실행:', pathname);

  // API 요청 처리
  if (pathname.startsWith('/api/')) {
    // 강제 로그인 API 보호
    if (pathname === '/api/auth/force-login' && isProd) {
      console.log('관리자 API 인증 확인:', pathname);
      
      // 인증 토큰 가져오기
      const authHeader = request.headers.get('authorization');
      const adminToken = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;
      
      // 운영 환경에서 토큰이 유효하지 않은 경우
      if (!adminToken || adminToken !== process.env.ADMIN_ACCESS_TOKEN) {
        console.error('관리자 API 접근 거부:', pathname);
        return NextResponse.json(
          { error: '인증되지 않은 접근입니다.' },
          { status: 403 }
        );
      }
    }
    
    // 공개 API는 인증 없이 허용
    if (publicApiRoutes.some(route => pathname.startsWith(route))) {
      console.log('공개 API 경로 감지:', pathname);
      return NextResponse.next();
    }
    
    // 그 외 API 요청은 기본 처리
    return NextResponse.next();
  }

  // 인증 콜백 URL은 그대로 통과
  if (pathname.startsWith('/auth/callback')) {
    console.log('인증 콜백 경로 감지:', pathname);
    console.log('쿼리 파라미터:', request.nextUrl.searchParams.toString());
    return NextResponse.next();
  }

  // 로그인, 회원가입 등 인증 관련 페이지는 그대로 통과
  if (authRoutes.some(route => pathname.startsWith(route))) {
    console.log('인증 관련 경로 감지:', pathname);
    return NextResponse.next();
  }

  // 보호된 경로에만 인증 적용
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    console.log('보호된 경로 감지:', pathname);
    
    // Supabase 클라이언트 초기화
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    // 쿠키에서 세션 정보 가져오기
    const { data: { session } } = await supabase.auth.getSession();

    console.log('세션 상태:', session ? '인증됨' : '인증되지 않음');

    // 인증되지 않은 사용자면 로그인 페이지로 리디렉션
    if (!session) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      console.log('인증되지 않음, 리디렉션:', redirectUrl.toString());
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 그 외 모든 요청은 계속 진행
  console.log('일반 경로 통과:', pathname);
  return NextResponse.next();
}

// 미들웨어가 실행될 경로 구성
export const config = {
  matcher: [
    /*
     * 다음 경로에 미들웨어 실행
     * - 모든 경로 ('/(.*)')
     * - 관리자 API 경로 명시적 포함
     */
    '/(.*)',
    '/api/auth/force-login'
  ],
}; 