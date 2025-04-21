import { NextResponse, NextRequest } from 'next/server'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { isShinhanEmail, isNaverEmail } from "@/lib/utils";
import { createClient } from '@supabase/supabase-js'
import Cookies from 'js-cookie'

// 환경 변수에서 Supabase URL과 Anon Key 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 임시 Database 타입 정의
type Database = any;

// PKCE 정보 인터페이스 정의
interface PkceInfo {
  code: string | null;
  code_verifier: string | null;
  error: string | null;
  token: string | null;
}

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
export function findCodeVerifier(request: NextRequest): PkceInfo {
  // URL 가져오기
  const url = request.nextUrl.toString();
  
  // URL에서 코드 추출
  const code = extractCodeFromURL(url);
  
  // URL에서 직접 code_verifier 추출 시도 (네이버/신한 메일 사용자용)
  const codeVerifierFromURL = extractCodeVerifierFromHash(url);
  
  // 코드가 없으면 에러 정보 반환
  if (!code) {
    const errorInfo = extractErrorFromHash(url) || 'missing_code';
    return { code: null, code_verifier: null, error: errorInfo, token: null };
  }
  
  // 쿠키에서 code_verifier 가져오기 시도
  const cookies = request.cookies;
  const pkceVerifierKey = `code_verifier_${code}`;
  const codeVerifierFromCookie = cookies.get(pkceVerifierKey)?.value;
  
  // 전체 URL 길이 기록 (150자까지만 표시)
  const urlPreview = url.length > 150 ? `${url.substring(0, 150)}...` : url;
  console.log(`[인증 콜백] URL 처리: ${urlPreview}`);
  console.log(`[인증 콜백] code_verifier URL에서 찾음: ${!!codeVerifierFromURL}`);
  console.log(`[인증 콜백] code_verifier 쿠키에서 찾음: ${!!codeVerifierFromCookie}`);
  
  // URL에서 code_verifier를 찾았으면 사용 (네이버/신한 메일 처리용)
  if (codeVerifierFromURL) {
    console.log('[인증 콜백] URL에서 code_verifier를 찾아 사용합니다');
    
    // 로컬 스토리지에 code_verifier 저장 시도 (향후 참조용, 임시 솔루션)
    try {
      // 쿠키에 저장 (이 방법은 서버에서 작동하지 않으므로 주석 처리)
      // cookies.set(pkceVerifierKey, codeVerifierFromURL, { path: '/' });
      console.log(`[인증 콜백] code_verifier를 임시 저장 시도 (코드: ${code.substring(0, 5)}...)`);
    } catch (e) {
      console.error('[인증 콜백] code_verifier 저장 실패:', e);
    }
    
    return { code, code_verifier: codeVerifierFromURL, error: null, token: null };
  }
  
  // 쿠키에서 code_verifier를 찾았으면 사용
  if (codeVerifierFromCookie) {
    return { code, code_verifier: codeVerifierFromCookie, error: null, token: null };
  }
  
  // code_verifier를 찾지 못했지만 토큰이 있는 경우 (ID 토큰 플로우)
  const token = extractTokenFromHash(url);
  if (token) {
    return { code, code_verifier: null, error: null, token };
  }
  
  // code_verifier를 찾지 못하고 토큰도 없는 경우
  return { code, code_verifier: null, error: null, token: null };
}

// 해시에서 에러 정보 추출
function extractErrorFromHash(url: string): string | null {
  if (!url) return null;

  try {
    const hash = url.split('#')[1];
    if (!hash) return null;

    const hashParams = new URLSearchParams(hash);
    const error = hashParams.get('error');
    
    if (!error) return null;
    
    // 문자열로 반환
    return error;
  } catch (error) {
    console.error('해시에서 에러 추출 중 오류:', error);
    return null;
  }
}

// 해시에서 토큰 정보 추출
function extractTokenFromHash(url: string): string | null {
  if (!url) return null;

  try {
    const hash = url.split('#')[1];
    if (!hash) return null;

    const hashParams = new URLSearchParams(hash);
    const accessToken = hashParams.get('access_token');
    
    if (!accessToken) return null;
    
    // 액세스 토큰만 문자열로 반환
    return accessToken;
  } catch (error) {
    console.error('해시에서 토큰 추출 중 오류:', error);
    return null;
  }
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
  const requestUrl = request.url
  console.log(`[GET] Processing authentication callback: ${requestUrl.slice(0, 150)}${requestUrl.length > 150 ? '...' : ''}`)

  const pkceInfo = recoverPkceInfo(requestUrl)
  console.log(`[GET] PKCE info recovered:`, {
    codePresent: !!pkceInfo.code,
    verifierPresent: !!pkceInfo.code_verifier,
    errorPresent: !!pkceInfo.error,
    tokenPresent: !!pkceInfo.token
  })

  // Check for errors first
  if (pkceInfo.error) {
    console.error(`[GET] Error found in URL: ${pkceInfo.error}`)
    return new NextResponse(createErrorHtml(pkceInfo.error), {
      headers: { 'content-type': 'text/html' },
    })
  }

  // ID Token flow
  if (pkceInfo.token) {
    console.log(`[GET] ID token found, redirecting to /`)
    return NextResponse.redirect(new URL('/', requestUrl))
  }

  // Handle no code scenario
  if (!pkceInfo.code) {
    console.error(`[GET] No code found in URL`)
    return new NextResponse(createErrorHtml('No code found in URL'), {
      headers: { 'content-type': 'text/html' },
    })
  }

  // Handle missing code verifier scenario
  if (!pkceInfo.code_verifier) {
    console.error(`[GET] No code verifier found for code: ${pkceInfo.code}`)
    return new NextResponse(createVerifierErrorHtml(pkceInfo.code), {
      headers: { 'content-type': 'text/html' },
    })
  }

  // Now we have both code and code_verifier, proceed with session exchange
  try {
    console.log(`[GET] Attempting to exchange session with code and verifier`)
    const supabase = createClient<Database>(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
          storage: {
            getItem: (key) => {
              // PKCE 관련 항목인 경우 code_verifier 우선 반환
              if (key.includes('code_verifier') && pkceInfo.code_verifier) {
                console.log(`[Storage] Using provided code_verifier for key: ${key}`);
                return pkceInfo.code_verifier;
              }
              return null;
            },
            setItem: () => {},
            removeItem: () => {}
          }
        },
      }
    )

    // Supabase v2 API에서는 exchangeCodeForSession이 단일 인자만 받음
    const { data, error } = await supabase.auth.exchangeCodeForSession(pkceInfo.code)

    if (error) {
      console.error(`[GET] Session exchange error:`, error)
      
      if (error.message.includes('expired')) {
        return new NextResponse(createErrorHtml('Link expired or invalid'), {
          headers: { 'content-type': 'text/html' },
        })
      }
      
      return new NextResponse(createErrorHtml(error.message), {
        headers: { 'content-type': 'text/html' },
      })
    }

    if (data.session) {
      console.log(`[GET] Session exchange successful, redirecting to /`)
      // Clear the PKCE cookie after successful authentication
      if (typeof window !== 'undefined') {
        Cookies.remove('supabase_pkce_verifier', { path: '/' })
        console.log(`[GET] Removed PKCE cookie after successful authentication`)
      }
      
      return new NextResponse(createClientResponseHtml(), {
        headers: { 'content-type': 'text/html' },
      })
    } else {
      console.error(`[GET] No session data returned`)
      return new NextResponse(createErrorHtml('Authentication failed'), {
        headers: { 'content-type': 'text/html' },
      })
    }
  } catch (err) {
    console.error(`[GET] Unexpected error during authentication:`, err)
    return new NextResponse(createErrorHtml('An unexpected error occurred'), {
      headers: { 'content-type': 'text/html' },
    })
  }
}

function recoverPkceInfo(url: string): PkceInfo {
  console.log(`[recoverPkceInfo] Recovering PKCE info from URL: ${url.slice(0, 150)}${url.length > 150 ? '...' : ''}`)
  
  const code = extractCodeFromURL(url)
  console.log(`[recoverPkceInfo] Code present in URL: ${!!code}`)
  
  const codeVerifierFromHash = extractCodeVerifierFromHash(url)
  console.log(`[recoverPkceInfo] Code verifier present in URL: ${!!codeVerifierFromHash}`)
  
  const error = extractErrorFromHash(url)
  console.log(`[recoverPkceInfo] Error present in URL: ${!!error}`)
  
  const token = extractTokenFromHash(url)
  console.log(`[recoverPkceInfo] Token present in URL: ${!!token}`)
  
  // Special handling for Naver Mail and Shinhan Mail
  if (code && codeVerifierFromHash) {
    try {
      console.log(`[recoverPkceInfo] Both code and code_verifier found in URL, attempting to save code_verifier to cookie`)
      
      // Store the code_verifier in a cookie that will be available in the client
      if (typeof window !== 'undefined') {
        Cookies.set('supabase_pkce_verifier', codeVerifierFromHash, { 
          expires: 1, // expires in 1 day
          path: '/',
          sameSite: 'Lax'
        })
        console.log(`[recoverPkceInfo] Successfully saved code_verifier to cookie`)
      } else {
        console.log(`[recoverPkceInfo] Cannot save to cookie - window is not defined (server-side)`)
      }
    } catch (error) {
      console.error(`[recoverPkceInfo] Failed to save code_verifier to cookie:`, error)
    }
  }
  
  let codeVerifier = codeVerifierFromHash
  
  if (!codeVerifier) {
    // Check cookies for code_verifier if not in URL
    try {
      if (typeof window !== 'undefined') {
        const cookieVerifier = Cookies.get('supabase_pkce_verifier')
        if (cookieVerifier) {
          console.log(`[recoverPkceInfo] Found code_verifier in cookie`)
          codeVerifier = cookieVerifier
        } else {
          console.log(`[recoverPkceInfo] No code_verifier found in cookie`)
        }
      }
    } catch (error) {
      console.error(`[recoverPkceInfo] Error retrieving code_verifier from cookie:`, error)
    }
  }
  
  return {
    code,
    code_verifier: codeVerifier,
    error,
    token
  }
}

function createErrorHtml(message: string): string {
  return `
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
      <p><strong>오류:</strong> ${message}</p>
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
}

function createClientResponseHtml(): string {
  return `
  <!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>인증 성공</title>
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
        color: #48bb78;
        margin-top: 40px;
      }
      .success-box {
        background-color: #f0fff4;
        border-left: 4px solid #48bb78;
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
    <h1>인증 성공</h1>
    <div class="success-box">
      <p><strong>성공:</strong> 인증이 성공적으로 완료되었습니다.</p>
    </div>
    
    <div class="info-box">
      <p><strong>다음 조치:</strong></p>
      <ol>
        <li>인증된 페이지로 리디렉션됩니다.</li>
        <li>인증 후 페이지에서 로그아웃을 할 수 있습니다.</li>
      </ol>
    </div>
    
    <button onclick="window.location.href='/'">홈으로 돌아가기</button>
    
    <div class="debug-box">
      <p><strong>디버그 정보:</strong></p>
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
} 