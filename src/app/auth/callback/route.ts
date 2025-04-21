import { NextResponse, NextRequest } from 'next/server'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// 환경 변수에서 Supabase URL과 Anon Key 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * URL에서 코드 추출 (쿼리 파라미터 또는 해시 파라미터에서)
 */
export function extractCodeFromURL(url: string): string | null {
  const parsedUrl = new URL(url);
  
  // 쿼리 파라미터에서 코드 추출
  const codeFromQuery = parsedUrl.searchParams.get('code');
  if (codeFromQuery) {
    console.log('코드가 쿼리 파라미터에서 추출됨:', codeFromQuery?.substring(0, 8) + '...');
    return codeFromQuery;
  }
  
  // 해시에서 코드 추출
  const hash = parsedUrl.hash.substring(1);
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    const codeFromHash = hashParams.get('code');
    if (codeFromHash) {
      console.log('코드가 해시 파라미터에서 추출됨:', codeFromHash?.substring(0, 8) + '...');
      return codeFromHash;
    }
  }
  
  console.log('코드를 찾을 수 없음');
  return null;
}

/**
 * 해시에서 특정 파라미터 추출
 */
export function extractParamFromHash(url: string, paramName: string): string | null {
  const hash = new URL(url).hash.substring(1);
  if (!hash) return null;
  
  const hashParams = new URLSearchParams(hash);
  return hashParams.get(paramName);
}

/**
 * 해시에서 code_verifier 추출
 */
export function extractCodeVerifierFromHash(url: string): string | null {
  const urlObj = new URL(url);
  
  // 1. 먼저 해시에서 확인
  const hash = urlObj.hash.substring(1);
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    const codeVerifier = hashParams.get('code_verifier');
    
    if (codeVerifier) {
      console.log('코드 검증기가 해시에서 추출됨:', codeVerifier.substring(0, 8) + '...');
      return codeVerifier;
    }
  }
  
  // 2. 쿼리 파라미터에서도 확인 (이메일 클라이언트가 주소를 변경할 수 있음)
  const codeVerifierFromQuery = urlObj.searchParams.get('code_verifier');
  
  if (codeVerifierFromQuery) {
    console.log('코드 검증기가 쿼리 파라미터에서 추출됨:', codeVerifierFromQuery.substring(0, 8) + '...');
    return codeVerifierFromQuery;
  }
  
  console.log('코드 검증기를 찾을 수 없음');
  return null;
}

/**
 * 로컬 스토리지에서 코드 검증기 찾기
 */
export function findCodeVerifier(url: string): string | null {
  // 먼저 URL에서 code_verifier 직접 추출 시도
  const codeVerifierFromUrl = extractCodeVerifierFromHash(url);
  if (codeVerifierFromUrl) {
    console.log('URL에서 직접 코드 검증기 찾음');
    return codeVerifierFromUrl;
  }
  
  // URL에서 코드 추출
  const code = extractCodeFromURL(url);
  if (!code) {
    console.log('URL에서 코드를 찾을 수 없어 코드 검증기를 찾을 수 없음');
    return null;
  }
  
  // 로컬 스토리지에서 찾기 시도
  try {
    const localPkceInfo = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('supabase.auth.pkce.code_verifier')
      : null;
    
    if (localPkceInfo) {
      console.log('로컬 스토리지에서 코드 검증기 정보 찾음');
      return localPkceInfo;
    }
  } catch (e) {
    console.error('로컬 스토리지에서 코드 검증기 액세스 오류:', e);
  }
  
  console.log('코드 검증기를 찾을 수 없음');
  return null;
}

/**
 * 코드 검증기 없음 에러 HTML 생성
 */
export function createVerifierErrorHtml(code: string): string {
  const html = `
  <!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>인증 오류</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      h1 {
        color: #e53e3e;
        margin-top: 40px;
      }
      .error-box {
        background-color: #fff5f5;
        border-left: 4px solid #e53e3e;
        padding: 16px;
        margin-bottom: 20px;
        border-radius: 4px;
      }
      .info-box {
        background-color: #ebf8ff;
        border-left: 4px solid #4299e1;
        padding: 16px;
        margin-bottom: 20px;
        border-radius: 4px;
      }
      .debug-box {
        background-color: #f0fff4;
        border-left: 4px solid #48bb78;
        padding: 16px;
        margin-bottom: 20px;
        border-radius: 4px;
        font-family: monospace;
        white-space: pre-wrap;
        font-size: 14px;
      }
      button {
        background-color: #4299e1;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }
      button:hover {
        background-color: #3182ce;
      }
    </style>
  </head>
  <body>
    <h1>인증 오류</h1>
    <div class="error-box">
      <p><strong>오류:</strong> 코드 검증기를 찾을 수 없습니다. 이메일 링크가 변경되었을 수 있습니다.</p>
    </div>
    
    <div class="info-box">
      <p><strong>권장 조치:</strong></p>
      <ol>
        <li>이메일을 받은 즉시 링크를 클릭해주세요.</li>
        <li>이메일 클라이언트에서 링크 스캔 기능을 비활성화하는 것이 좋습니다.</li>
        <li>다시 로그인을 시도하고 새 이메일 링크를 요청하세요.</li>
      </ol>
    </div>
    
    <button onclick="window.location.href='/'">홈으로 돌아가기</button>
    
    <div class="debug-box">
      <p><strong>디버그 정보:</strong></p>
      <p>인증 코드: ${code}</p>
      <div id="pkce-info"></div>
    </div>
    
    <script>
      // 로컬 스토리지에서 PKCE 정보 확인
      document.addEventListener('DOMContentLoaded', function() {
        const pkceInfoElement = document.getElementById('pkce-info');
        try {
          const pkceInfo = localStorage.getItem('supabase.auth.pkce.code_verifier');
          if (pkceInfo) {
            pkceInfoElement.innerHTML = '<p>로컬 스토리지 PKCE 정보: ' + pkceInfo.substring(0, 8) + '...</p>';
          } else {
            pkceInfoElement.innerHTML = '<p>로컬 스토리지 PKCE 정보: 없음</p>';
          }
        } catch (e) {
          pkceInfoElement.innerHTML = '<p>로컬 스토리지 접근 오류: ' + e.message + '</p>';
        }
      });
    </script>
  </body>
  </html>
  `;
  return html;
}

/**
 * 인증 콜백 처리 핸들러
 * 이메일 링크를 통해 인증 후 리디렉션되는 엔드포인트
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const requestUrl = new URL(request.url);
    console.log('인증 콜백 처리 시작, URL 길이:', request.url.length);
    console.log('URL (최대 150자):', request.url.substring(0, 150) + (request.url.length > 150 ? '...' : ''));

    // 코드 추출
    const code = extractCodeFromURL(request.url);
    console.log('추출된 코드:', code ? '있음' : '없음');
    
    // URL에서 코드 검증기 직접 확인
    const codeVerifier = extractCodeVerifierFromHash(request.url);
    console.log('URL에서 코드 검증기 상태:', codeVerifier ? '있음' : '없음', 
      codeVerifier ? `(처음 8자: ${codeVerifier.substring(0, 8)}...)` : '');
    
    // 해시에서 access_token 및 refresh_token 확인
    const accessToken = extractParamFromHash(request.url, 'access_token');
    const refreshToken = extractParamFromHash(request.url, 'refresh_token');
    console.log('토큰 검색 결과:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });
    
    // 코드는 있지만 코드 검증기가 없는 경우 특별 처리
    // 이메일 클라이언트 (네이버, 신한)에서의 링크 변경을 처리
    if (code && !accessToken && !refreshToken) {
      console.log('코드는 있지만 토큰이 없음, 코드 검증기 확인');
      
      // 네이버/신한 이메일 사용자를 위한 임시 조치
      // URL에 code와 code_verifier가 모두 있는 경우 로컬 스토리지에 저장 시도
      try {
        if (code && codeVerifier) {
          console.log('코드와 코드 검증기가 모두 URL에 있음 - 로컬 스토리지에 저장 시도');
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('supabase.auth.pkce.code_verifier', codeVerifier);
            console.log('코드 검증기가 로컬 스토리지에 저장됨');
          } else {
            console.log('로컬 스토리지를 사용할 수 없어 코드 검증기를 저장할 수 없음');
          }
        }
      } catch (e) {
        console.error('코드 검증기 저장 중 오류:', e);
      }
      
      if (!codeVerifier) {
        // 로컬 스토리지에 저장된 코드 검증기 확인
        const storedVerifier = typeof localStorage !== 'undefined'
          ? localStorage.getItem('supabase.auth.pkce.code_verifier')
          : null;
        
        if (!storedVerifier) {
          console.error('코드 검증기를 찾을 수 없음 - 에러 페이지 표시');
          return new NextResponse(
            createVerifierErrorHtml(code),
            { status: 400, headers: { 'Content-Type': 'text/html' } }
          );
        }
      }
    }
    
    // 요청 URL의 해시 부분 확인 (오류가 해시에 있을 수 있음)
    const hashError = request.url.includes('#error=');
    
    // 해시에 오류가 있는지 확인
    if (hashError) {
      console.error('[인증 콜백] 해시에 오류 발견');
      // URL에서 해시 부분 추출해 분석
      const hashPart = request.url.split('#')[1] || '';
      const hashParams = new URLSearchParams(hashPart);
      
      const errorType = hashParams.get('error') || 'unknown_error';
      const errorCode = hashParams.get('error_code');
      const errorDesc = hashParams.get('error_description') || '알 수 없는 오류';
      
      console.error('[인증 콜백] 오류 상세:', { errorType, errorCode, errorDesc });
      
      if (errorType === 'access_denied' && errorCode === 'otp_expired') {
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=link_expired&message=${encodeURIComponent('인증 링크가 만료되었습니다. 새 링크를 요청해주세요.')}`
        );
      }
      
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${errorType}&message=${encodeURIComponent(errorDesc)}`
      );
    }
    
    // code 파라미터가 없으면 오류 응답
    if (!code) {
      console.error('[인증 콜백] 인증 코드 없음');
      
      // 오류 페이지로 리디렉션
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code&message=인증 코드가 없습니다.`);
    }
    
    try {
      // Supabase 클라이언트 생성
      const supabase = createClientComponentClient({
        supabaseUrl,
        supabaseKey: supabaseAnonKey
      });
      
      console.log('[인증 콜백] 세션 교환 시도', { code: code.substring(0, 10) + '...' });
      
      // 코드를 사용하여 세션 교환
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('[인증 콜백] 세션 교환 오류:', error);
        
        // 오류 유형에 따라 적절한 메시지와 함께 로그인 페이지로 리디렉션
        if (error.message.includes('expired')) {
          return NextResponse.redirect(
            `${requestUrl.origin}/login?error=link_expired&message=인증 링크가 만료되었습니다. 새 링크를 요청해주세요.`
          );
        }
        
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${error.name}&message=${encodeURIComponent(error.message)}`
        );
      }
      
      if (!data.session) {
        console.error('[인증 콜백] 세션 없음');
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=no_session&message=세션을 받지 못했습니다. 다시 시도해주세요.`
        );
      }
      
      console.log('[인증 콜백] 세션 교환 성공', { 
        user: data.session.user.email,
        expires_at: new Date(data.session.expires_at! * 1000).toISOString()
      });
      
      // 성공적으로 인증된 경우 메인 페이지로 리디렉션
      // 만약 비밀번호 설정이 필요한 경우 비밀번호 설정 페이지로 리디렉션할 수 있음
      return NextResponse.redirect(`${requestUrl.origin}/`);
      
    } catch (error: any) {
      console.error('[인증 콜백] 내부 오류:', error);
      
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=internal_error&message=${encodeURIComponent(
          error.message || '인증 처리 중 내부 오류가 발생했습니다.'
        )}`
      );
    }
  } catch (error: any) {
    console.error('[인증 콜백] 예외 발생:', error);
    
    // 모든 오류에 대한 기본 처리
    return NextResponse.redirect(
      `/login?error=unexpected&message=${encodeURIComponent(
        error.message || '예상치 못한 오류가 발생했습니다.'
      )}`
    );
  }
} 