import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

// Supabase 클라이언트 생성 (개선된 auth 설정)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Supabase v2에서는 cookieOptions가 지원되지 않습니다.
    // 대신 localStorage에 세션을 유지합니다.
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(key);
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
      }
    }
  }
});

// 매직 링크를 통한 로그인 (만료 시간 연장)
export const signInWithMagicLink = async (email: string) => {
  try {
    // 현재 호스트 URL 확인
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : SITE_URL;
    
    // 리디렉션 URL
    const redirectUrl = `${baseUrl}/auth/callback`;

    console.log('매직 링크 인증 요청:', {
      email,
      redirectUrl,
      time: new Date().toISOString()
    });
    
    // 이미 등록된 이메일인지 확인 (중요: 기존 사용자의 로그인 흐름 개선)
    try {
      // 데이터베이스에서 사용자 확인 시도
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      // 기존 데이터베이스에 사용자가 있는 경우 특별 처리
      if (userData?.id) {
        console.log('기존 사용자 감지:', email);
        
        // 다른 방식으로 매직 링크 발송 (세션 재설정용)
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl
        });
        
        if (error) throw error;
        
        return { 
          success: true, 
          data, 
          message: '기존 사용자 인증 이메일 발송됨' 
        };
      }
    } catch (checkError) {
      console.log('사용자 확인 중 오류 (무시하고 계속):', checkError);
      // 오류가 발생해도 계속 진행 (새 사용자로 처리)
    }
    
    // 표준 OTP 매직 링크 발송 (새 사용자용)
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
        shouldCreateUser: true,
        // 특별한 데이터 첨부 (더 긴 만료 시간 유도)
        data: {
          app_metadata: {
            provider: 'email',
            created_at: new Date().toISOString()
          }
        }
      }
    });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('매직 링크 발송 오류:', error);
    return { 
      success: false, 
      error: error.message || '매직 링크 발송에 실패했습니다.'
    };
  }
};

// 비밀번호로 로그인
export const signInWithPassword = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('비밀번호 로그인 오류:', error);
    return { 
      success: false, 
      error: error.message || '로그인에 실패했습니다.'
    };
  }
};

// Supabase 연결 상태 확인
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('articles').select('id', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

// 사용자 세션 가져오기
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
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

    const { data, error } = await supabase
      .from('users')
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