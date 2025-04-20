import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 환경 변수가 없는 경우를 위한 기본값 (빌드 타임에만 사용)
const FALLBACK_SUPABASE_URL = 'https://bpojldrroyijabkzvpla.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2psZHJyb3lpamFia3p2cGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwODAzNjMsImV4cCI6MjA2MDY1NjM2M30.jedIwcKuuZHhQXzA0SO-eXrCdOGA_LvJkLLt-o6RD00';

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

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

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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