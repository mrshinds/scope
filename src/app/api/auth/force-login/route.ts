import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// 환경 변수가 없는 경우를 위한 기본값
const FALLBACK_SUPABASE_URL = 'https://bpojldrroyijabkzvpla.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2psZHJyb3lpamFia3p2cGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwODAzNjMsImV4cCI6MjA2MDY1NjM2M30.jedIwcKuuZHhQXzA0SO-eXrCdOGA_LvJkLLt-o6RD00';

/**
 * 강제 로그인 API - 보안 강화 버전
 * 개발 환경: 이메일만으로 간편 로그인
 * 프로덕션 환경: 관리자 액세스 토큰 확인 후 로그인 처리
 */
export async function POST(request: Request) {
  try {
    // 요청 데이터 파싱
    const { email, adminToken } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 환경 확인
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 프로덕션 환경에서는 관리자 토큰 검증
    if (!isDevelopment) {
      // 관리자 액세스 토큰 확인
      const adminAccessToken = process.env.ADMIN_ACCESS_TOKEN;
      
      if (!adminToken || adminToken !== adminAccessToken) {
        console.error('프로덕션 환경에서 유효하지 않은 관리자 토큰으로 강제 로그인 시도:', email);
        return NextResponse.json(
          { error: '관리자 인증이 필요합니다.' },
          { status: 403 }
        );
      }
      
      console.log('관리자 권한으로 강제 로그인 시도:', email);
    } else {
      console.log('개발 환경에서 강제 로그인 시도:', email);
    }
    
    // Supabase 설정
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;
    
    // 서버 측 Supabase 클라이언트 생성
    const adminSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 사용자 확인 (이미 존재하는 사용자인지)
    const { data: userData } = await adminSupabase
      .from('users')
      .select('id, email, is_admin')
      .eq('email', email)
      .maybeSingle();
    
    // 로그인 처리 방법 결정
    let sessionData;
    let error;
    
    if (userData?.id) {
      // 기존 사용자 - 관리자 세션으로 직접 로그인 처리
      console.log('기존 사용자 감지 - 관리자 로그인 생성:', email);
      
      // 관리자 권한으로 세션 생성 (서버 측)
      const { data, error: signInError } = await adminSupabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: `${supabaseUrl}/auth/v1/callback`
        }
      });
      
      if (signInError) {
        error = signInError;
      } else {
        sessionData = data;
      }
    } else {
      // 신규 사용자
      console.log('신규 사용자 - OTP 인증 발송:', email);
      
      const { data, error: signUpError } = await adminSupabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${supabaseUrl}/auth/v1/callback`,
          data: {
            app_metadata: {
              provider: 'email',
              force_login: true,
              created_at: new Date().toISOString(),
              admin_generated: !isDevelopment
            }
          }
        },
      });
      
      if (signUpError) {
        error = signUpError;
      } else {
        sessionData = data;
      }
    }
    
    if (error) {
      console.error('강제 로그인 처리 오류:', error);
      return NextResponse.json(
        { error: `로그인 처리 중 오류가 발생했습니다: ${error.message}` },
        { status: 500 }
      );
    }
    
    // 성공 응답
    return NextResponse.json({ 
      success: true, 
      message: '로그인 처리가 완료되었습니다. 이메일을 확인하세요.',
      data: sessionData,
      isNewUser: !userData?.id
    });
    
  } catch (error: any) {
    console.error('강제 로그인 처리 중 예외 발생:', error);
    return NextResponse.json(
      { error: `서버 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}` },
      { status: 500 }
    );
  }
} 