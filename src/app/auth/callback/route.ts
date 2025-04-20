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

// 해시에서 액세스 토큰 정보 추출
const extractTokenFromHash = (url: string): { 
  access_token?: string, 
  refresh_token?: string, 
  expires_in?: string,
  expires_at?: string,
  token_type?: string,
  type?: string
} => {
  try {
    if (!url.includes('#')) return {};
    
    const hashPart = url.split('#')[1];
    const params = new URLSearchParams(hashPart);
    
    return {
      access_token: params.get('access_token') || undefined,
      refresh_token: params.get('refresh_token') || undefined,
      expires_in: params.get('expires_in') || undefined,
      expires_at: params.get('expires_at') || undefined,
      token_type: params.get('token_type') || undefined,
      type: params.get('type') || undefined
    };
  } catch (e) {
    console.error('해시에서 토큰 정보 추출 실패:', e);
    return {};
  }
};

export async function GET(request: NextRequest) {
  // 디버깅을 위한 요청 정보 로깅
  console.log('=== 인증 콜백 핸들러 호출됨 ===');
  console.log('요청 URL:', request.url);
  console.log('요청 헤더:', {
    referer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent')
  });
  
  const requestUrl = new URL(request.url);
  let code = requestUrl.searchParams.get('code');
  let codeVerifier = requestUrl.searchParams.get('code_verifier');
  let error = requestUrl.searchParams.get('error');
  let error_code = requestUrl.searchParams.get('error_code');
  let errorDescription = requestUrl.searchParams.get('error_description');
  const type = requestUrl.searchParams.get('type'); // 링크 타입 확인 (reset_password 또는 없음)
  
  // URL 전체에서 코드 추출 시도 (해시 포함)
  if (!code && request.url.includes('#')) {
    code = extractCodeFromURL(request.url);
    console.log('해시에서 코드 추출 시도:', code ? '성공' : '실패');
  }
  
  // 해시에서 액세스 토큰 추출 시도
  let hashToken = null;
  if (request.url.includes('#')) {
    const tokenInfo = extractTokenFromHash(request.url);
    if (tokenInfo.access_token) {
      console.log('해시에서 액세스 토큰 감지됨');
      hashToken = tokenInfo;
    }
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
  
  // 해시에 액세스 토큰이 있지만 code가 없는 경우 토큰으로 처리 시도
  if (!code && hashToken && hashToken.access_token) {
    console.log('코드 없이 액세스 토큰 감지됨 - 직접 세션 처리 시도');
    
    try {
      // 토큰 정보 로깅
      console.log('토큰 정보:', {
        tokenExists: !!hashToken.access_token,
        tokenType: hashToken.token_type,
        expiresIn: hashToken.expires_in,
        type: hashToken.type
      });
      
      // 매직 링크 타입인 경우 클라이언트 측 처리를 위한 HTML 반환
      if (hashToken.type === 'magiclink' || hashToken.token_type === 'bearer') {
        console.log('매직 링크 토큰 감지: 클라이언트 측 처리 HTML 반환');
        
        const accessToken = hashToken.access_token || '';
        const refreshToken = hashToken.refresh_token || '';
        const expiresIn = hashToken.expires_in || '3600';
        const tokenType = hashToken.token_type || 'bearer';
        const supabaseDomain = (process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL).replace(/^https?:\/\//, '');
        
        // 토큰을 localStorage에 저장하고 사용자를 대시보드로 리디렉션하는 HTML 반환
        const htmlResponse = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>인증 처리 중...</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f5f5f5; }
            .container { text-align: center; padding: 2rem; background-color: white; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>인증 처리 중...</h2>
            <div class="spinner"></div>
            <p>잠시만 기다려주세요. 로그인 처리 중입니다.</p>
          </div>
          <script>
            (function() {
              try {
                console.log('인증 토큰 처리 중...');
                
                // 토큰 세션을 localStorage에 임시 저장
                localStorage.setItem('sb-${supabaseDomain}-auth-token', JSON.stringify({
                  access_token: '${accessToken}',
                  refresh_token: '${refreshToken}',
                  expires_at: ${Date.now() + (parseInt(expiresIn) * 1000)},
                  token_type: '${tokenType}'
                }));
                
                // 리디렉션
                setTimeout(() => {
                  window.location.href = '/dashboard?login_success=true';
                }, 1000);
              } catch (e) {
                console.error('인증 처리 오류:', e);
                window.location.href = '/login?error=token_processing_error&message=' + encodeURIComponent(e.message || '알 수 없는 오류');
              }
            })();
          </script>
        </body>
        </html>
        `;
        
        return new Response(htmlResponse, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8'
          }
        });
      }
    } catch (tokenError: any) {
      console.error('액세스 토큰 처리 중 오류:', tokenError.message);
      // 오류 시 로그인 페이지로 리디렉션 (계속 진행)
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
    url: request.url,
    hasAccessToken: !!hashToken
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

  // code와 code_verifier가 모두 있는지 확인
  if (!code || !codeVerifier) {
    console.error('인증 코드 또는 코드 검증기가 누락되었습니다.');
    return NextResponse.redirect(
      new URL('/login?error=missing_code_or_verifier&message=인증+코드+또는+코드+검증기가+누락되었습니다.', request.url)
    );
  }

  // 코드가 있는 경우 Supabase로 교환 시도
  if (code) {
    console.log('인증 코드 감지됨, 세션 교환 시도. 코드 길이:', code.length);
    
    try {
      // 백엔드에서 supabase 클라이언트 생성 (각 요청마다 새로 생성)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;
      
      // 서버 전용 Supabase 클라이언트
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      });
      
      // 코드를 세션으로 교환
      console.log('세션 교환 시작...');
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('세션 교환 오류:', exchangeError);
        
        // 오류 상세 정보 로깅
        console.error('세션 교환 오류 상세:', {
          message: exchangeError.message,
          status: exchangeError.status,
          code: exchangeError.code,
        });
        
        // 오류 종류에 따른 처리
        if (exchangeError.message.toLowerCase().includes('expired')) {
          return NextResponse.redirect(
            new URL('/login?error=link_expired&message=인증+링크가+만료되었습니다.+새+링크를+요청해주세요.', request.url)
          );
        }
        
        return NextResponse.redirect(
          new URL(`/login?error=session_exchange_error&message=${encodeURIComponent(exchangeError.message)}`, request.url)
        );
      }
      
      // 세션 교환 성공
      if (data.session) {
        console.log('세션 교환 성공! 사용자:', data.session.user.email);
        
        // 세션 데이터를 클라이언트에 저장하는 HTML 반환
        return handleSuccessfulAuthentication(data, type, request);
      } else {
        console.error('세션 교환은 성공했지만 세션 데이터가 없습니다.');
        return NextResponse.redirect(
          new URL('/login?error=no_session&message=세션+데이터를+받지+못했습니다.', request.url)
        );
      }
    } catch (error: any) {
      console.error('세션 교환 처리 중 예외 발생:', error);
      return NextResponse.redirect(
        new URL(`/login?error=unexpected_error&message=${encodeURIComponent(error.message || '알 수 없는 오류')}`, request.url)
      );
    }
  }
}

// 성공적인 인증 처리
function handleSuccessfulAuthentication(data: any, type: string | null, request: NextRequest) {
  console.log('인증 성공 처리 중...');
  
  try {
    const session = data.session;
    const user = session.user;
    const supabaseDomain = (process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL).replace(/^https?:\/\//, '');
    
    // HTML을 통한 클라이언트 측 토큰 저장
    const htmlResponse = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>인증 완료</title>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f5f5f5;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          max-width: 90%;
          width: 500px;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .debug {
          margin-top: 20px;
          font-size: 10px;
          color: #999;
          text-align: left;
          overflow: auto;
          max-height: 100px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>로그인 성공!</h2>
        <div class="spinner"></div>
        <p>잠시만 기다려주세요. 대시보드로 이동합니다...</p>
        <script>
          (function() {
            try {
              console.log('인증 토큰 저장 중...');
              
              // Supabase 토큰 저장
              const tokenData = ${JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
                token_type: session.token_type
              })};
              
              // localStorage에 저장
              localStorage.setItem('sb-${supabaseDomain}-auth-token', JSON.stringify(tokenData));
              
              // 리디렉션 대상 결정
              let redirectTo = '/dashboard';
              
              // 비밀번호 재설정 링크인 경우 비밀번호 설정 페이지로 이동
              if ('${type}' === 'recovery' || '${type}' === 'signup') {
                redirectTo = '/set-password?auth_success=true';
              }
              
              // 저장 후 리디렉션
              setTimeout(() => {
                console.log('리디렉션 중...', redirectTo);
                window.location.href = redirectTo;
              }, 1500);
            } catch (err) {
              console.error('인증 처리 오류:', err);
              document.querySelector('.container').innerHTML += 
                '<div class="error" style="color: red; margin-top: 10px;">오류가 발생했습니다: ' + 
                err.message + '<br><a href="/login">로그인 페이지로 돌아가기</a></div>';
            }
          })();
        </script>
        <div class="debug">
          <strong>디버그 정보:</strong><br>
          사용자: ${user.email}<br>
          인증 시간: ${new Date().toISOString()}<br>
          세션 만료: ${new Date((Math.floor(Date.now() / 1000) + session.expires_in) * 1000).toISOString()}<br>
        </div>
      </div>
    </body>
    </html>
    `;
    
    return new Response(htmlResponse, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } catch (error: any) {
    console.error('인증 처리 중 예외 발생:', error);
    return NextResponse.redirect(
      new URL(`/login?error=auth_handler_error&message=${encodeURIComponent(error.message || '알 수 없는 오류')}`, request.url)
    );
  }
} 