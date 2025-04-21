import { NextResponse, NextRequest } from 'next/server';
import { isValidEmail } from '@/lib/utils'; // 이메일 유효성 검사 함수 (필요한 경우 구현)
import { sendMagicLink } from '@/lib/supabaseClient';

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

    // 이메일 형식 검증 (isValidEmail 함수 필요)
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: '유효한 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 이메일 특수한 케이스 처리 (옵션)
    const isShinhanEmail = email.toLowerCase().endsWith('@shinhan.com');
    const isNaverEmail = email.toLowerCase().endsWith('@naver.com');
    
    // 특정 이메일 도메인에 대한 안내 메시지
    let additionalInfo = '';
    if (isShinhanEmail) {
      additionalInfo = '신한 메일은 보안 정책으로 인해 링크가 변경될 수 있습니다. 메일 수신 즉시 링크를 클릭해주세요.';
    } else if (isNaverEmail) {
      additionalInfo = '네이버 메일은 링크 스캔으로 인해 인증 문제가 발생할 수 있습니다. 메일 수신 즉시 링크를 클릭해주세요.';
    }
    
    // Supabase API를 통해 인증 메일 전송
    const { data, error } = await sendMagicLink(email, redirectUrl);
    
    // 오류 응답 처리
    if (error) {
      console.error('인증 메일 전송 오류:', error);
      return NextResponse.json(
        { error: error.message || '인증 메일 전송 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '인증 메일이 전송되었습니다. 이메일을 확인해주세요.',
      additionalInfo: additionalInfo || undefined,
      email: email,
    });
    
  } catch (error: any) {
    console.error('인증 API 오류:', error);
    
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
    
    // 이 부분은 실제 인증 상태를 확인하는 로직을 추가할 수 있음
    // 예: 데이터베이스에서 사용자의 인증 상태 확인 등
    
    return NextResponse.json({
      email,
      status: 'pending',
      message: '인증 링크가 전송되었습니다. 이메일을 확인해주세요.'
    });
    
  } catch (error) {
    console.error('인증 상태 확인 오류:', error);
    return NextResponse.json(
      { error: '인증 상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 