import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase as defaultSupabaseClient } from '@/lib/supabase';

// 환경 변수가 없는 경우를 위한 기본값 (빌드 타임에만 사용)
const FALLBACK_SUPABASE_URL = 'https://bpojldrroyijabkzvpla.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2psZHJyb3lpamFia3p2cGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwODAzNjMsImV4cCI6MjA2MDY1NjM2M30.jedIwcKuuZHhQXzA0SO-eXrCdOGA_LvJkLLt-o6RD00';

// 이메일 스캔으로 인한 링크 손상 문제 해결 추가
const extractCodeFromURL = (url: string): string | null => {
  try {
    // 해시 파라미터가 있는 경우 처리
    if (url.includes('#')) {
      const hashPart = url.split('#')[1];
      // 해시에서 코드 추출 시도
      const codeMatch = hashPart.match(/code=([^&]+)/);
      if (codeMatch && codeMatch[1]) {
        console.log('해시에서 코드 추출 성공');
        return codeMatch[1];
      }
    }
    
    // 일반 쿼리 파라미터에서 코드 추출
    const urlObj = new URL(url);
    return urlObj.searchParams.get('code');
  } catch (e) {
    console.error('URL에서 코드 추출 오류:', e);
    return null;
  }
};

// 해시에서 오류 정보 추출
const extractErrorFromHash = (url: string): { error?: string, error_code?: string, error_description?: string } => {
  try {
    if (!url.includes('#')) return {};
    
    const hashPart = url.split('#')[1];
    const params = new URLSearchParams(hashPart);
    
    return {
      error: params.get('error') || undefined,
      error_code: params.get('error_code') || undefined,
      error_description: params.get('error_description') || undefined
    };
  } catch (e) {
    console.error('해시에서 오류 정보 추출 실패:', e);
    return {};
  }
};

export async function GET(request: NextRequest) {
  // 디버깅을 위한 요청 정보 로깅
  console.log('=== 인증 콜백 핸들러 호출됨 ===');
  console.log('요청 URL:', request.url);
  
  const requestUrl = new URL(request.url);
  let code = requestUrl.searchParams.get('code');
  let error = requestUrl.searchParams.get('error');
  let error_code = requestUrl.searchParams.get('error_code');
  let errorDescription = requestUrl.searchParams.get('error_description');
  const type = requestUrl.searchParams.get('type'); // 링크 타입 확인 (reset_password 또는 없음)
  
  // URL 전체에서 코드 추출 시도 (해시 포함)
  if (!code && request.url.includes('#')) {
    code = extractCodeFromURL(request.url);
    console.log('해시에서 코드 추출 시도:', code ? '성공' : '실패');
  }
  
  // 해시에서 오류 정보 추출 시도
  if (request.url.includes('#')) {
    const hashErrors = extractErrorFromHash(request.url);
    if (hashErrors.error) {
      console.log('해시에서 오류 정보 추출:', hashErrors);
      error = hashErrors.error || error;
      error_code = hashErrors.error_code || error_code;
      errorDescription = hashErrors.error_description || errorDescription;
    }
  }
  
  // 만료된 링크 오류 특별 처리
  const isExpiredLink = error === 'access_denied' && 
                       (error_code === 'otp_expired' || 
                        (errorDescription && errorDescription.toLowerCase().includes('expired')));
  
  if (isExpiredLink) {
    console.log('만료된 인증 링크 감지됨');
    return NextResponse.redirect(
      new URL('/login?error=link_expired&message=인증+링크가+만료되었습니다.+새+링크를+요청해주세요.', request.url)
    );
  }
  
  console.log('URL 파라미터:', {
    code: code ? '존재함 (길이: ' + code.length + ')' : '없음',
    error: error || '없음',
    error_code: error_code || '없음',
    error_description: errorDescription || '없음',
    type: type || '일반 로그인',
    queryParams: Object.fromEntries(Array.from(requestUrl.searchParams.entries())),
    url: request.url
  });
  
  // URL이 이미지 스캔이나 프리뷰에 의해 손상되었는지 확인
  const isTamperedURL = request.url.includes('utm_') || request.url.includes('safelink') || 
                       request.url.includes('xid=') || request.url.includes('xss=');
  
  if (isTamperedURL) {
    console.error('URL이 수정된 것으로 의심됩니다 (이메일 스캔 또는 프리뷰로 인해)');
  }
  
  // 해시 파라미터 확인 (페이지 URL의 # 뒤에 있는 파라미터)
  if (request.url.includes('#')) {
    console.log('해시 파라미터 감지됨:', request.url.split('#')[1]);
  }
  
  // 오류 파라미터가 있으면 처리
  if (error) {
    console.error('Supabase 인증 오류:', error, errorDescription);
    
    // 링크 만료 오류인 경우 특별 메시지
    if (error === 'access_denied' && errorDescription && errorDescription.toLowerCase().includes('expired')) {
      return NextResponse.redirect(
        new URL('/login?error=link_expired&message=인증+링크가+만료되었습니다.+새+링크를+요청해주세요.', request.url)
      );
    }
    
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}&error_code=${encodeURIComponent(error_code || '')}&error_description=${encodeURIComponent(errorDescription || '')}&email_tampered=${isTamperedURL ? 'true' : 'false'}`, request.url)
    );
  }

  // code가 없으면 홈 페이지로 리디렉션
  if (!code) {
    console.error('인증 코드가 없습니다. 해시 파라미터 확인 필요');
    // URL에 해시(#)가 있는지 확인하고 해당 정보를 로그로 남김
    return NextResponse.redirect(
      new URL(`/?error=no_code&email_tampered=${isTamperedURL ? 'true' : 'false'}`, request.url)
    );
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

    // PKCE 사용하지 않는 기본 클라이언트 설정으로 교체
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // URL에서 세션 감지 비활성화
        flowType: 'implicit' // PKCE 대신 implicit 플로우 사용
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
        
        // 코드 검증기 오류인 경우 특별 처리
        if (error.message.includes('code verifier')) {
          console.log('코드 검증기 오류 감지 - 이메일 스캔으로 인한 문제일 가능성 높음');
          
          return NextResponse.redirect(
            new URL(`/login?error=code_verifier_error&message=${encodeURIComponent('이메일 링크가 스캔 또는 미리보기에 의해 손상되었습니다. 새 인증 링크를 요청하고, 원본 이메일에서 직접 링크를 클릭해주세요.')}&email_tampered=true`, request.url)
          );
        }
        
        // 오류 메시지와 함께 로그인 페이지로 리디렉션
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}&error_code=${encodeURIComponent(error_code || '')}&exchange_error=true&email_tampered=${isTamperedURL ? 'true' : 'false'}`, request.url)
        );
      }

      return handleSuccessfulAuthentication(data, type, request);
    } catch (exchangeError: any) {
      console.error('세션 교환 중 예외 발생:', exchangeError.message);
      console.error('예외 세부 정보:', JSON.stringify(exchangeError, null, 2));
      
      // 메일 스캔 문제인 경우 특별 처리
      if (exchangeError.message && (
          exchangeError.message.includes('code verifier') || 
          exchangeError.message.includes('auth code')
      )) {
        return NextResponse.redirect(
          new URL(`/login?error=invalid_link&message=${encodeURIComponent('이메일 링크가 손상되었습니다. 이메일 프로그램의 보안 검사로 인해 발생한 문제일 수 있습니다. 새 인증 링크를 요청해주세요.')}&email_tampered=true`, request.url)
        );
      }
      
      return NextResponse.redirect(
        new URL(`/login?error=exchange_error&message=${encodeURIComponent(exchangeError.message || '세션 교환 중 오류 발생')}&email_tampered=${isTamperedURL ? 'true' : 'false'}`, request.url)
      );
    }
  } catch (error: any) {
    console.error('인증 콜백 처리 예외:', error);
    console.error('스택 트레이스:', error.stack);

    // 오류 발생 시 로그인 페이지로 리디렉션 (오류 메시지 포함)
    return NextResponse.redirect(
      new URL(`/login?error=auth_callback_error&message=${encodeURIComponent(error.message || '')}&email_tampered=${isTamperedURL ? 'true' : 'false'}`, request.url)
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