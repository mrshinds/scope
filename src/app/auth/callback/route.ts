import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // 디버깅을 위한 요청 정보 로깅
  console.log('=== 인증 콜백 핸들러 호출됨 ===');
  console.log('요청 URL:', request.url);
  
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  
  console.log('코드 파라미터:', code ? '존재함' : '없음');
  console.log('에러 파라미터:', error || '없음');
  console.log('에러 설명:', errorDescription || '없음');
  
  // 오류 파라미터가 있으면 처리
  if (error) {
    console.error('Supabase 인증 오류:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`, request.url)
    );
  }

  // code가 없으면 홈 페이지로 리디렉션
  if (!code) {
    console.error('인증 코드가 없습니다.');
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    // 환경 변수에서 Supabase 설정 가져오기
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    console.log('Supabase 설정:', {
      urlExists: !!supabaseUrl,
      keyExists: !!supabaseAnonKey,
      url: supabaseUrl
    });

    // Supabase 클라이언트 생성 (쿠키 옵션 개선)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });

    console.log('세션 교환 시도 중...');
    
    // 인증 코드로 세션 교환
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('세션 교환 오류:', error.message);
      // 오류 메시지와 함께 로그인 페이지로 리디렉션
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    console.log('인증 성공:', data ? '데이터 있음' : '데이터 없음');
    if (data?.session) {
      console.log('사용자 정보:', data.session.user.email);
      console.log('세션 만료:', new Date(data.session.expires_at! * 1000).toLocaleString());
    }
    
    // 세션 정보가 있는지 확인
    if (data?.session) {
      // 비밀번호 설정 페이지로 리디렉션 (대시보드 대신)
      const email = data.session.user.email;
      
      // 쿠키와 세션 스토리지에 이메일 저장 (비밀번호 설정 화면에서 사용)
      const response = NextResponse.redirect(new URL('/set-password?auth_success=true', request.url));
      
      // 쿠키에 이메일 저장 (비밀번호 설정 화면에서 사용)
      response.cookies.set('verify_email', email || '', {
        path: '/',
        maxAge: 60 * 15, // 15분
        sameSite: 'lax'
      });
      
      // 인증 테스트용 쿠키
      response.cookies.set('auth_test', 'true', { 
        path: '/',
        maxAge: 60 * 60 * 24, // 24시간
        sameSite: 'lax'
      });
      
      console.log('비밀번호 설정 페이지로 리디렉션 중...');
      return response;
    } else {
      console.error('세션 정보가 없습니다.');
      return NextResponse.redirect(
        new URL('/login?error=no_session_data', request.url)
      );
    }
  } catch (error: any) {
    console.error('인증 콜백 처리 예외:', error);
    console.error('스택 트레이스:', error.stack);

    // 오류 발생 시 로그인 페이지로 리디렉션 (오류 메시지 포함)
    return NextResponse.redirect(
      new URL(`/login?error=auth_callback_error&message=${encodeURIComponent(error.message || '')}`, request.url)
    );
  }
} 