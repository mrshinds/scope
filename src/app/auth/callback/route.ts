import { NextResponse, NextRequest } from 'next/server'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// 환경 변수에서 Supabase URL과 Anon Key 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * 해시와 쿼리 파라미터에서 코드 추출
 */
function extractCodeFromURL(url: string): string | undefined {
  try {
    const urlObj = new URL(url);
    
    // 쿼리 파라미터에서 코드 추출
    if (urlObj.searchParams.has('code')) {
      return urlObj.searchParams.get('code') || undefined;
    }
    
    // 해시에서 코드 추출
    const hash = urlObj.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    
    if (hashParams.has('code')) {
      return hashParams.get('code') || undefined;
    }
    
    return undefined;
  } catch (e) {
    console.error('[AUTH] URL 파싱 오류:', e);
    return undefined;
  }
}

/**
 * 인증 콜백 처리 핸들러
 * 이메일 링크를 통해 인증 후 리디렉션되는 엔드포인트
 */
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    console.log('[인증 콜백] 전체 URL:', request.url);

    // 다양한 방식으로 코드 추출 시도
    const codeFromParams = requestUrl.searchParams.get('code');
    const codeFromHash = extractCodeFromURL(request.url);
    const code = codeFromParams || codeFromHash;
    
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