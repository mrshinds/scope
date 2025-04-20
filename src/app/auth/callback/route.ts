import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  console.log('인증 콜백 호출됨, code 파라미터:', code ? '존재함' : '없음');

  // code가 없으면 홈 페이지로 리디렉션
  if (!code) {
    console.error('인증 코드가 없습니다.');
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    // 환경 변수에서 Supabase 설정 가져오기
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    console.log('Supabase 설정 확인:', {
      urlExists: !!supabaseUrl,
      keyExists: !!supabaseAnonKey
    });

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    });

    // 인증 코드로 세션 교환
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('세션 교환 오류:', error.message);
      // 오류 메시지와 함께 로그인 페이지로 리디렉션
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    console.log('인증 성공, 세션 정보:', data ? '존재함' : '없음');
    
    // 세션 정보가 있는지 확인
    if (data?.session) {
      console.log('사용자 인증 완료:', data.session.user.email);
      
      // 성공 메시지와 함께 대시보드로 리디렉션
      const successUrl = new URL('/dashboard', request.url);
      successUrl.searchParams.set('login_success', 'true');
      
      return NextResponse.redirect(successUrl);
    } else {
      console.error('세션 정보가 없습니다.');
      return NextResponse.redirect(
        new URL('/login?error=no_session_data', request.url)
      );
    }
  } catch (error: any) {
    console.error('인증 콜백 처리 예외:', error);

    // 오류 발생 시 로그인 페이지로 리디렉션 (오류 메시지 포함)
    return NextResponse.redirect(
      new URL(`/login?error=auth_callback_error&message=${encodeURIComponent(error.message || '')}`, request.url)
    );
  }
} 