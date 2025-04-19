import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 API 키 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수 유효성 검사
if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  } else {
    console.warn(
      '⚠️ Supabase 환경 변수가 없습니다. 일부 기능이 작동하지 않을 수 있습니다.\n' +
      '- NEXT_PUBLIC_SUPABASE_URL 및 NEXT_PUBLIC_SUPABASE_ANON_KEY를 .env.local 파일에 설정해주세요.'
    );
  }
}

// Supabase 클라이언트 생성
export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co', // 개발 환경에서 기본값 제공
  supabaseAnonKey || 'dummy-key', 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

// Supabase 연결 상태 확인
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase 연결 오류:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Supabase 연결 확인 중 예외 발생:', error);
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