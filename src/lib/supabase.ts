import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// 환경 변수가 없는 경우를 위한 기본값 (빌드 타임에만 사용)
const FALLBACK_SUPABASE_URL = 'https://bpojldrroyijabkzvpla.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2psZHJyb3lpamFia3p2cGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwODAzNjMsImV4cCI6MjA2MDY1NjM2M30.jedIwcKuuZHhQXzA0SO-eXrCdOGA_LvJkLLt-o6RD00';

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

// 배포 사이트 URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://scope-psi.vercel.app';

// 환경 변수 유효성 검사
let validationErrorMessage = '';

// 개발/배포 환경 확인
const isProduction = typeof process !== 'undefined' 
  && process.env 
  && (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'production');

// 배포 환경에서만 검증
if (isProduction) {
  if (!supabaseUrl) validationErrorMessage += 'NEXT_PUBLIC_SUPABASE_URL is missing. ';
  if (!supabaseAnonKey) validationErrorMessage += 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. ';
  
  if (validationErrorMessage) {
    console.error(`Supabase environment error: ${validationErrorMessage}`);
  }
}

// PKCE 코드 검증기 관리를 위한 로컬 스토리지 핸들러 생성
function createPkceStorage() {
  // 로컬 스토리지 백업본을 정기적으로 저장하는 함수
  const backupPkceVerifiers = () => {
    if (typeof window === 'undefined') return;
    
    try {
      // 로컬 스토리지에서 PKCE 관련 항목 찾기
      const pkceData: Record<string, string> = {};
      let hasAnyPkceData = false;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('pkce') || key.includes('code_verifier'))) {
          hasAnyPkceData = true;
          const value = localStorage.getItem(key);
          if (value) {
            pkceData[key] = value;
            // 타임스탬프 저장
            pkceData[key + '_time'] = Date.now().toString();
          }
        }
      }
      
      if (hasAnyPkceData) {
        localStorage.setItem('pkce_verifiers_backup', JSON.stringify(pkceData));
        console.log('[PKCE 관리] 검증기 백업 완료', Object.keys(pkceData).length);
      }
    } catch (e) {
      console.error('[PKCE 관리] 백업 실패:', e);
    }
  };

  return {
    getItem: (key: string): string | null => {
      if (typeof window === 'undefined') return null;
      
      try {
        const value = localStorage.getItem(key);
        
        // PKCE 코드 검증기와 관련된 항목인 경우 로그 출력
        if (key.includes('code_verifier') || key.includes('pkce')) {
          console.log('[PKCE 관리] 항목 가져오기:', key, value ? '있음' : '없음');
          
          // 값이 없다면 백업에서 복원 시도
          if (!value && key.includes('code_verifier')) {
            try {
              const backup = localStorage.getItem('pkce_verifiers_backup');
              if (backup) {
                const data = JSON.parse(backup);
                if (data[key]) {
                  console.log('[PKCE 관리] 백업에서 검증기 복원:', key);
                  localStorage.setItem(key, data[key]);
                  return data[key];
                }
              }
            } catch (e) {
              console.error('[PKCE 관리] 백업 복원 실패:', e);
            }
          }
        }
        
        return value;
      } catch (e) {
        console.error('[PKCE 관리] getItem 오류:', key, e);
        return null;
      }
    },
    
    setItem: (key: string, value: string): void => {
      if (typeof window === 'undefined') return;
      
      try {
        localStorage.setItem(key, value);
        
        // PKCE 관련 항목인 경우 추가 처리
        if (key.includes('code_verifier') || key.includes('pkce')) {
          console.log('[PKCE 관리] 항목 저장:', key, value.substring(0, 5) + '...');
          
          // 백업 실행
          backupPkceVerifiers();
          
          // 디버깅용 이메일 도메인 정보 저장
          try {
            const email = localStorage.getItem('auth_email');
            if (email) {
              const domain = email.split('@')[1];
              localStorage.setItem('last_pkce_email_domain', domain || 'unknown');
            }
          } catch (e) {
            console.error('[PKCE 관리] 이메일 도메인 저장 실패:', e);
          }
          
          // 브라우저 정보 저장
          try {
            localStorage.setItem('pkce_browser_info', JSON.stringify({
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              pkce_key: key
            }));
          } catch (e) {
            console.error('[PKCE 관리] 브라우저 정보 저장 실패:', e);
          }
        }
      } catch (e) {
        console.error('[PKCE 관리] setItem 오류:', key, e);
      }
    },
    
    removeItem: (key: string): void => {
      if (typeof window === 'undefined') return;
      
      try {
        // PKCE 코드 검증기와 관련된 항목인 경우 로그 출력
        if (key.includes('code_verifier') || key.includes('pkce')) {
          console.log('[PKCE 관리] 항목 삭제:', key);
          
          // 값을 백업
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const backup = localStorage.getItem('pkce_verifiers_backup') || '{}';
              const data = JSON.parse(backup);
              data[key] = value;
              data[key + '_removed_at'] = Date.now();
              localStorage.setItem('pkce_verifiers_backup', JSON.stringify(data));
            } catch (e) {
              console.error('[PKCE 관리] 삭제 항목 백업 실패:', e);
            }
          }
        }
        
        localStorage.removeItem(key);
      } catch (e) {
        console.error('[PKCE 관리] removeItem 오류:', key, e);
      }
    }
  };
}

// 이전 PKCE 항목 정리
const cleanupOldPkceItems = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // 오래된 PKCE 항목 찾기
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('pkce') && !key.includes('backup') && !key.includes('info')) {
        const timestamp = key.match(/(\d+)$/);
        if (timestamp && timestamp[1]) {
          const itemTime = parseInt(timestamp[1], 10);
          const now = Date.now();
          
          // 1시간 이상 지난 항목 삭제
          if (now - itemTime > 60 * 60 * 1000) {
            keysToRemove.push(key);
          }
        }
      }
    }
    
    // 항목 삭제
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('[PKCE 정리] 오래된 항목 삭제:', key);
    });
    
    if (keysToRemove.length > 0) {
      console.log('[PKCE 정리] 완료, 삭제된 항목:', keysToRemove.length);
    }
  } catch (e) {
    console.error('[PKCE 정리] 오류:', e);
  }
};

// 클라이언트 코드에서 실행
if (typeof window !== 'undefined') {
  // 페이지 로드 시 PKCE 항목 정리
  setTimeout(() => {
    cleanupOldPkceItems();
  }, 3000);
}

// 단일 Supabase 클라이언트 인스턴스 생성
let _supabase: SupabaseClient | null = null;

export const supabase = () => {
  // 이미 생성된 인스턴스가 있으면 반환
  if (_supabase !== null) {
    return _supabase;
  }

  // 환경 변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

  // 환경 변수가 설정되지 않았을 경우 경고
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase URL 또는 Anon Key가 설정되지 않았습니다. 기본값을 사용합니다.');
  }

  // SSR 최적화된 클라이언트 생성
  const isClient = typeof window !== 'undefined';
  
  if (isClient) {
    // 브라우저 환경에서는 PKCE 로컬 스토리지 핸들러 사용
    const pkceStorage = createPkceStorage();
    
    _supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce', // PKCE 흐름 사용 (보안 강화)
        storage: pkceStorage,
        debug: process.env.NODE_ENV === 'development', // 개발 환경에서만 디버깅 활성화
      },
    });
    
    console.log('[Supabase] 브라우저 클라이언트 생성됨', {
      url: supabaseUrl.substring(0, 15) + '...',
      flowType: 'pkce',
      debug: process.env.NODE_ENV === 'development'
    });
  } else {
    // 서버 환경에서는 기본 클라이언트 생성
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    console.log('[Supabase] 서버 클라이언트 생성됨');
  }

  return _supabase;
};

export async function signInWithMagicLink({
  email,
  redirectUrl,
  metadata = {},
}: {
  email: string;
  redirectUrl: string;
  metadata?: Record<string, any>;
}) {
  try {
    // 시작 시간 기록
    const startTime = Date.now();
    // 현재 타임스탬프 저장 (디버깅용)
    const timestamp = new Date().toISOString();
    
    if (typeof window !== 'undefined') {
      // 이메일 정보 저장 (디버깅용)
      localStorage.setItem('auth_email', email);
      localStorage.setItem('auth_timestamp', timestamp);
      
      // 리디렉션 경로 저장
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/auth/callback')) {
        localStorage.setItem('auth_return_path', currentPath);
      }
    }
    
    const supabaseClient = supabase();
    
    // URL에 타임스탬프 추가 (캐싱 방지 및 디버깅용)
    const redirectUrlWithParams = new URL(redirectUrl);
    redirectUrlWithParams.searchParams.append('t', Date.now().toString());
    
    // 전체 메타데이터 설정
    const fullMetadata = {
      ...metadata,
      timestamp,
      email_domain: email.split('@')[1],
      browser: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    };
    
    // 이메일 주소 검사 (신한 메일인 경우 처리)
    const isShinhanMail = email.toLowerCase().endsWith('@shinhan.com');
    
    // PKCE 흐름 사용
    const options = {
      emailRedirectTo: redirectUrlWithParams.toString(),
      shouldCreateUser: true, // 필요시 사용자 생성
      captchaToken: undefined as string | undefined,
      metadata: fullMetadata
    };
    
    // 현재 사용자 확인 (이미 존재하는 사용자인지)
    try {
      const { data: userData, error: userError } = await supabaseClient.auth.getUser();
      
      // 이미 로그인된 사용자이고 이메일이 다른 경우, 로그아웃 먼저 수행
      if (userData?.user && userData.user.email !== email) {
        console.log('[인증] 다른 사용자로 로그인 시도, 로그아웃 수행', {
          currentEmail: userData.user.email,
          newEmail: email
        });
        await supabaseClient.auth.signOut();
      }
    } catch (userError) {
      console.error('[인증] 사용자 정보 확인 오류:', userError);
    }
    
    // OTP 이메일 전송
    const { data, error } = await supabaseClient.auth.signInWithOtp({
      email,
      options
    });
    
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    
    // 결과 로깅
    console.log('[인증] OTP 이메일 전송 요청 완료', {
      email: email.substring(0, 3) + '***@' + email.split('@')[1],
      success: !error,
      elapsedMs: elapsedTime,
      isShinhanMail
    });
    
    // 오류 처리
    if (error) {
      if (typeof window !== 'undefined') {
        // 오류 정보 저장 (디버깅용)
        localStorage.setItem('auth_last_error', JSON.stringify({
          message: error.message,
          code: error.code,
          timestamp: new Date().toISOString()
        }));
      }
      
      throw error;
    }
    
    // 성공 정보 저장 (디버깅용)
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_last_success', JSON.stringify({
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        timestamp: new Date().toISOString(),
        elapsedMs: elapsedTime
      }));
    }
    
    return { data, error: null, timestamp };
  } catch (err: any) {
    console.error('[인증] OTP 이메일 전송 오류:', err.message);
    
    return {
      data: null,
      error: {
        message: err.message,
        status: err.status || 500
      },
      timestamp: new Date().toISOString()
    };
  }
}

// 비밀번호 기반 로그인
export async function signInWithPassword({
  email,
  password,
  metadata = {},
}: {
  email: string;
  password: string;
  metadata?: Record<string, any>;
}) {
  try {
    // 시작 시간 기록
    const startTime = Date.now();
    
    // 현재 타임스탬프 저장 (디버깅용)
    const timestamp = new Date().toISOString();
    
    if (typeof window !== 'undefined') {
      // 이메일 정보 저장 (디버깅용)
      localStorage.setItem('auth_email', email);
      localStorage.setItem('auth_timestamp', timestamp);
      
      // 리디렉션 경로 저장
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/auth/callback')) {
        localStorage.setItem('auth_return_path', currentPath);
      }
    }
    
    const supabaseClient = supabase();
    
    // 전체 메타데이터 설정
    const fullMetadata = {
      ...metadata,
      timestamp,
      email_domain: email.split('@')[1],
      browser: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    };
    
    // 비밀번호 로그인 수행
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    
    // 결과 로깅
    console.log('[인증] 비밀번호 로그인 요청 완료', {
      email: email.substring(0, 3) + '***@' + email.split('@')[1],
      success: !error,
      elapsedMs: elapsedTime
    });
    
    // 오류 처리
    if (error) {
      if (typeof window !== 'undefined') {
        // 오류 정보 저장 (디버깅용)
        localStorage.setItem('auth_last_error', JSON.stringify({
          message: error.message,
          code: error.code,
          timestamp: new Date().toISOString()
        }));
      }
      
      throw error;
    }
    
    // 성공 정보 저장 (디버깅용)
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_last_success', JSON.stringify({
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        timestamp: new Date().toISOString(),
        elapsedMs: elapsedTime
      }));
    }
    
    return { data, error: null, timestamp };
  } catch (err: any) {
    console.error('[인증] 비밀번호 로그인 오류:', err.message);
    
    return {
      data: null,
      error: {
        message: err.message,
        status: err.status || 500
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Supabase 연결 상태 확인
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase().from('articles').select('id', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

// 사용자 세션 가져오기
export const getSession = async () => {
  try {
    const { data, error } = await supabase().auth.getSession();
    if (error) {
      console.error('세션 가져오기 오류:', error);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error('세션 가져오기 예외:', error);
    return null;
  }
};

// 현재 사용자 가져오기
export const getCurrentUser = async () => {
  try {
    const session = await getSession();
    if (!session) return null;

    const { data, error } = await supabase().from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('사용자 정보 가져오기 오류:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('사용자 정보 가져오기 예외:', error);
    return null;
  }
};

// 관리자 권한 확인
export const isAdmin = async () => {
  try {
    const user = await getCurrentUser();
    return user?.is_admin || false;
  } catch (error) {
    console.error('관리자 권한 확인 오류:', error);
    return false;
  }
}; 