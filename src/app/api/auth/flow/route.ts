import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 환경 변수가 없는 경우를 위한 기본값
const FALLBACK_SUPABASE_URL = 'https://bpojldrroyijabkzvpla.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2psZHJyb3lpamFia3p2cGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwODAzNjMsImV4cCI6MjA2MDY1NjM2M30.jedIwcKuuZHhQXzA0SO-eXrCdOGA_LvJkLLt-o6RD00';

/**
 * 신한 메일 스캔으로 인한 링크 손상 문제를 해결하기 위한 인증 플로우 API 엔드포인트
 * /api/auth/flow 라우트는 OAuth 플로우 대신 커스텀 인증 로직을 처리합니다.
 */
export async function POST(request: NextRequest) {
  console.log('=== 커스텀 인증 플로우 API 호출됨 ===');
  
  try {
    // 요청 본문에서 이메일 추출
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: '이메일이 제공되지 않았습니다.' }, 
        { status: 400 }
      );
    }
    
    console.log('인증 요청 처리:', email);
    
    // Supabase 설정
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;
    
    // 대체 플로우 방식 Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'implicit' // code verifier 문제 해결을 위해 implicit 플로우 사용
      }
    });
    
    // 배포 사이트 URL
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://scope-psi.vercel.app';
    const baseUrl = SITE_URL;
    const redirectUrl = `${baseUrl}/auth/callback`;

    // 이메일이 신한 도메인인지 확인
    const isShinhanMail = email.toLowerCase().includes('@shinhan.com');
    
    // 이미 등록된 이메일인지 확인 (기존 사용자는 다른 메서드로 처리)
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (userData?.id) {
        console.log('기존 사용자 감지 - 비밀번호 재설정 방식 사용:', email);
        
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl
        });
        
        if (error) {
          console.error('비밀번호 재설정 이메일 발송 오류:', error);
          return NextResponse.json(
            { error: error.message }, 
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: '기존 사용자용 인증 이메일이 발송되었습니다.',
          isShinhanMail
        });
      }
    } catch (error) {
      console.error('사용자 확인 오류 (계속 진행):', error);
      // 에러가 발생해도 계속 진행
    }
    
    // 새 사용자 - OTP 이메일 발송
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true,
          data: {
            auth_flow: 'implicit',
            is_shinhan_mail: isShinhanMail
          }
        }
      });
      
      if (error) {
        console.error('OTP 이메일 발송 오류:', error);
        return NextResponse.json(
          { error: error.message }, 
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: '인증 이메일이 발송되었습니다.',
        isShinhanMail,
        flowType: 'implicit'
      });
    } catch (error: any) {
      console.error('인증 처리 중 예외 발생:', error);
      return NextResponse.json(
        { error: error.message || '알 수 없는 오류' }, 
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API 처리 중 예외 발생:', error);
    return NextResponse.json(
      { error: error.message || '내부 서버 오류' }, 
      { status: 500 }
    );
  }
} 