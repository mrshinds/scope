/**
 * 강제 로그인 API를 호출하는 클라이언트 유틸리티
 * 개발 환경에서는 간편하게 사용할 수 있으며, 운영 환경에서는 관리자 토큰이 필요합니다.
 */

interface ForceLoginOptions {
  adminToken?: string;
}

/**
 * 이메일을 사용하여 강제 로그인을 처리합니다.
 * @param email 로그인할 사용자 이메일
 * @param options 로그인 옵션 (운영 환경에서는 adminToken 필요)
 * @returns 로그인 처리 결과
 */
export async function forceLogin(email: string, options: ForceLoginOptions = {}) {
  try {
    // 로그인 요청 데이터 준비
    const requestData = {
      email,
      adminToken: options.adminToken || undefined
    };
    
    // 요청 헤더 설정
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // 운영 환경에서는 Authorization 헤더에 토큰 추가
    if (process.env.NODE_ENV === 'production' && options.adminToken) {
      headers['Authorization'] = `Bearer ${options.adminToken}`;
    }
    
    // API 호출
    const response = await fetch('/api/auth/force-login', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });
    
    // JSON 응답 변환
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `요청 오류: ${response.status}`,
        status: response.status
      };
    }
    
    return {
      success: true,
      data: data.data,
      message: data.message,
      isNewUser: data.isNewUser
    };
  } catch (error: any) {
    console.error('강제 로그인 API 호출 오류:', error);
    return {
      success: false,
      error: error.message || '알 수 없는 오류'
    };
  }
}

/**
 * 개발 환경에서 빠르게 테스트 로그인을 수행합니다.
 * 운영 환경에서는 작동하지 않습니다.
 */
export async function devQuickLogin(email: string = 'test@example.com') {
  // 개발 환경인지 확인
  if (process.env.NODE_ENV !== 'development') {
    console.warn('이 함수는 개발 환경에서만 사용할 수 있습니다.');
    return {
      success: false,
      error: '개발 환경에서만 사용 가능합니다.'
    };
  }
  
  return forceLogin(email);
} 