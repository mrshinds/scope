import { NextResponse, NextRequest } from 'next/server';
import { isValidEmail, isShinhanEmail, isNaverEmail } from '@/lib/utils';
import { sendMagicLink } from '@/lib/supabaseClient';

// 환경 변수에서 사이트 URL 가져오기
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://scope-psi.vercel.app';

/**
 * 인증 이메일 전송 API 핸들러
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문에서 이메일 추출
    const { email, redirectUrl } = await request.json();
    
    // 이메일 유효성 검사
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: '유효한 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 로그 출력
    console.log(`[AUTH API] 인증 요청 처리 중: ${email.substring(0, 3)}***@${email.split('@')[1]}`);

    // 특정 이메일 도메인 확인 (신한, 네이버)
    const isShinhan = isShinhanEmail(email);
    const isNaver = isNaverEmail(email);
    
    // 특정 이메일 도메인에 대한 안내 메시지
    let additionalInfo = '';
    if (isShinhan) {
      additionalInfo = '신한 메일은 보안 정책으로 인해 링크가 변경될 수 있습니다. 메일 수신 즉시 링크를 클릭해주세요.';
      console.log('[AUTH API] 신한 메일 감지: 특별 안내 메시지 추가됨');
    } else if (isNaver) {
      additionalInfo = '네이버 메일은 링크 스캔으로 인해 인증 문제가 발생할 수 있습니다. 메일 수신 즉시 링크를 클릭해주세요.';
      console.log('[AUTH API] 네이버 메일 감지: 특별 안내 메시지 추가됨');
    }
    
    // 명시적인 리디렉션 URL 설정
    const callbackUrl = `${siteUrl}/auth/callback`;
    console.log('[AUTH API] 설정된 콜백 URL:', callbackUrl);
    
    // Supabase API를 통해 인증 메일 전송
    const { data, error } = await sendMagicLink(email, callbackUrl);
    
    // 오류 응답 처리
    if (error) {
      console.error('[AUTH API] 인증 메일 전송 오류:', error);
      return NextResponse.json(
        { error: error.message || '인증 메일 전송 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
    
    console.log('[AUTH API] 인증 메일 전송 성공');
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '인증 메일이 전송되었습니다. 이메일을 확인해주세요.',
      additionalInfo: additionalInfo || undefined,
      email: email,
      callbackUrl: callbackUrl, // 디버깅용으로 사용된 콜백 URL 반환
    });
    
  } catch (error: any) {
    console.error('[AUTH API] 서버 오류:', error);
    
    // 일반 오류 응답
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 인증 상태 확인 API
 */
export async function GET(request: NextRequest) {
  try {
    // URL 파라미터에서 이메일 추출
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    // 이메일 없이 호출된 경우
    if (!email) {
      return NextResponse.json(
        { message: '인증 시스템이 정상 작동 중입니다.' }
      );
    }
    
    console.log(`[AUTH API] 인증 상태 확인: ${email.substring(0, 3)}***@${email.split('@')[1]}`);
    
    // 이 부분은 실제 인증 상태를 확인하는 로직을 추가할 수 있음
    // 예: 데이터베이스에서 사용자의 인증 상태 확인 등
    
    return NextResponse.json({
      email,
      status: 'pending',
      message: '인증 링크가 전송되었습니다. 이메일을 확인해주세요.',
      callbackUrl: `${siteUrl}/auth/callback` // 디버깅용으로 설정된 콜백 URL 반환
    });
    
  } catch (error) {
    console.error('[AUTH API] 인증 상태 확인 오류:', error);
    return NextResponse.json(
      { error: '인증 상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 