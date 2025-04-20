import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase as defaultSupabaseClient } from '@/lib/supabase';

// 환경 변수가 없는 경우를 위한 기본값 (빌드 타임에만 사용)
const FALLBACK_SUPABASE_URL = 'https://bpojldrroyijabkzvpla.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2psZHJyb3lpamFia3p2cGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwODAzNjMsImV4cCI6MjA2MDY1NjM2M30.jedIwcKuuZHhQXzA0SO-eXrCdOGA_LvJkLLt-o6RD00';

export async function GET(request: NextRequest) {
  // 디버깅을 위한 요청 정보 로깅
  console.log('=== 인증 콜백 핸들러 호출됨 ===');
  console.log('요청 URL:', request.url);
  
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_code = requestUrl.searchParams.get('error_code');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const type = requestUrl.searchParams.get('type'); // 링크 타입 확인 (reset_password 또는 없음)
  
  console.log('URL 파라미터:', {
    code: code ? '존재함 (길이: ' + code.length + ')' : '없음',
    error: error || '없음',
    error_code: error_code || '없음',
    error_description: errorDescription || '없음',
    type: type || '일반 로그인',
    queryParams: Object.fromEntries(Array.from(requestUrl.searchParams.entries()))
  });
  
  // 해시 파라미터 확인 (페이지 URL의 # 뒤에 있는 파라미터)
  if (request.url.includes('#')) {
    console.log('해시 파라미터 감지됨:', request.url.split('#')[1]);
  }
  
  // 오류 파라미터가 있으면 처리
  if (error) {
    console.error('Supabase 인증 오류:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}&error_code=${encodeURIComponent(error_code || '')}&error_description=${encodeURIComponent(errorDescription || '')}`, request.url)
    );
  }

  // code가 없으면 홈 페이지로 리디렉션
  if (!code) {
    console.error('인증 코드가 없습니다. 해시 파라미터 확인 필요');
    // URL에 해시(#)가 있는지 확인하고 해당 정보를 로그로 남김
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    // 환경 변수에서 Supabase 설정 가져오기 (항상 기본값 제공)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

    console.log('Supabase 설정:', {
      urlExists: !!supabaseUrl,
      keyExists: !!supabaseAnonKey,
      url: supabaseUrl,
      isDefaultUrl: supabaseUrl === FALLBACK_SUPABASE_URL,
      env: process.env.NODE_ENV || 'unknown'
    });

    // Supabase URL이 유효하지 않은 경우
    if (!supabaseUrl || supabaseUrl.trim() === '') {
      console.error('유효한 Supabase URL이 제공되지 않았습니다. 기본값 사용 시도.');
      // 기존 클라이언트 시도
      try {
        const { data, error } = await defaultSupabaseClient.auth.exchangeCodeForSession(code);
        if (!error && data) {
          console.log('기본 클라이언트로 세션 교환 성공');
          // 성공 처리 로직으로 진행
          return handleSuccessfulAuthentication(data, type, request);
        } else {
          console.error('기본 클라이언트 세션 교환 실패:', error);
        }
      } catch (e) {
        console.error('기본 클라이언트 사용 중 오류:', e);
      }
    }

    // Supabase 클라이언트 생성 (쿠키 옵션 개선)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });

    console.log('세션 교환 시도 중...');
    
    // 인증 코드로 세션 교환 시도
    try {
      // 인증 코드로 세션 교환
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('세션 교환 오류:', error.message);
        console.error('오류 세부 정보:', JSON.stringify(error, null, 2));
        // 오류 메시지와 함께 로그인 페이지로 리디렉션
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}&error_code=${encodeURIComponent(error_code || '')}&exchange_error=true`, request.url)
        );
      }

      return handleSuccessfulAuthentication(data, type, request);
    } catch (exchangeError: any) {
      console.error('세션 교환 중 예외 발생:', exchangeError.message);
      console.error('예외 세부 정보:', JSON.stringify(exchangeError, null, 2));
      return NextResponse.redirect(
        new URL(`/login?error=exchange_error&message=${encodeURIComponent(exchangeError.message || '세션 교환 중 오류 발생')}`, request.url)
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

// 인증 성공 처리 함수 분리
function handleSuccessfulAuthentication(data: any, type: string | null, request: NextRequest) {
  console.log('인증 성공:', data ? '데이터 있음' : '데이터 없음');
  if (data?.session) {
    console.log('사용자 정보:', data.session.user.email);
    console.log('세션 만료:', new Date(data.session.expires_at! * 1000).toLocaleString());
    
    // 사용자 메타데이터 확인
    const userMetadata = data.session.user.user_metadata || {};
    console.log('사용자 메타데이터:', userMetadata);
    
    // 비밀번호가 설정되어 있는지 확인
    const hasPassword = !!(userMetadata.has_password || userMetadata.password_set || 
                         (data.session.user.app_metadata && data.session.user.app_metadata.provider !== 'email'));
    
    console.log('비밀번호 설정 여부:', hasPassword ? '설정됨' : '미설정');
  }
  
  // 세션 정보가 있는지 확인
  if (data?.session) {
    const email = data.session.user.email;
    
    // 링크 타입이 비밀번호 재설정이거나 기존 사용자인 경우 대시보드로 리디렉션
    if (type === 'recovery' || type === 'reset_password') {
      // 인증 쿠키 설정
      const response = NextResponse.redirect(new URL('/dashboard?login_success=true', request.url));
      
      // 인증 테스트용 쿠키
      response.cookies.set('auth_test', 'true', { 
        path: '/',
        maxAge: 60 * 60 * 24, // 24시간
        sameSite: 'lax'
      });
      
      console.log('기존 사용자: 대시보드로 리디렉션 중...');
      return response;
    } else {
      // 신규 사용자는 비밀번호 설정 페이지로 리디렉션
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
      
      console.log('신규 사용자: 비밀번호 설정 페이지로 리디렉션 중...');
      return response;
    }
  } else {
    console.error('세션 정보가 없습니다.');
    return NextResponse.redirect(
      new URL('/login?error=no_session_data', request.url)
    );
  }
} 