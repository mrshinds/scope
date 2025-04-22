import { NextResponse } from 'next/server';

// 모든 API 요청에 대해 인증 검사 없이 접근 허용
export async function GET(request: Request) {
  return NextResponse.json({ 
    message: "API is accessible without authentication" 
  });
}

export async function POST(request: Request) {
  return NextResponse.json({ 
    message: "API is accessible without authentication" 
  });
}

export async function PUT(request: Request) {
  return NextResponse.json({ 
    message: "API is accessible without authentication" 
  });
}

export async function DELETE(request: Request) {
  return NextResponse.json({ 
    message: "API is accessible without authentication" 
  });
} 