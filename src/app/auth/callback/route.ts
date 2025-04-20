import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // code가 없으면 홈 페이지로 리디렉션
  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    // 환경 변수에서 Supabase 설정 가져오기
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 인증 코드로 세션 교환
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('세션 교환 오류:', error.message);
      // 오류 메시지와 함께 로그인 페이지로 리디렉션
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    // 인증 성공 후 대시보드로 리디렉션
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error: any) {
    console.error('인증 콜백 처리 오류:', error);

    // 오류 발생 시 로그인 페이지로 리디렉션
    return NextResponse.redirect(
      new URL('/login?error=auth_callback_error', request.url)
    );
  }
} 