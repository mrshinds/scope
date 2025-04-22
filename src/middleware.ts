import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 모든 요청을 인증 체크 없이 그대로 통과시킴
  console.log('미들웨어 실행 - 인증 체크 없이 접근 허용:', request.nextUrl.pathname);
  return NextResponse.next();
}

// 미들웨어가 실행될 경로 구성 (필요한 경우에만 설정)
export const config = {
  matcher: []
}; 