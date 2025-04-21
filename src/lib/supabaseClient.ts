import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// 환경 변수에서 Supabase URL과 Anon Key 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 타입 정의 (실제 프로젝트에서는 보다 구체적인 타입 정의 필요)
export type Database = any;

// 서버 컴포넌트에서 사용할 클라이언트
export const supabaseAdmin = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 클라이언트 컴포넌트에서 사용할 클라이언트
export const createBrowserClient = () => {
  return createClientComponentClient<Database>({
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  });
};

// 이메일로 매직 링크 전송하는 함수
export const sendMagicLink = async (email: string, redirectUrl?: string) => {
  try {
    // 서버에서 호출될 경우 supabaseAdmin 사용
    if (typeof window === 'undefined') {
      const { data, error } = await supabaseAdmin.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });
      
      return { data, error };
    }
    
    // 클라이언트에서 호출될 경우 createBrowserClient 사용
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl || `${window.location.origin}/auth/callback`,
      },
    });
    
    // 디버깅을 위해 이메일 정보 저장 (옵션)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('auth_email', email);
        localStorage.setItem('auth_timestamp', new Date().toISOString());
      } catch (e) {
        console.error('로컬 스토리지 접근 오류:', e);
      }
    }
    
    return { data, error };
  } catch (error: any) {
    console.error('매직 링크 전송 오류:', error);
    return {
      data: null,
      error: {
        message: error.message || '알 수 없는 오류가 발생했습니다.',
      },
    };
  }
};

// 세션 확인 함수
export const getSession = async () => {
  const supabase = createBrowserClient();
  return await supabase.auth.getSession();
};

// 현재 사용자 확인 함수
export const getUser = async () => {
  const supabase = createBrowserClient();
  return await supabase.auth.getUser();
};

// 로그아웃 함수
export const signOut = async () => {
  const supabase = createBrowserClient();
  return await supabase.auth.signOut();
}; 