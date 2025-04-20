import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PUT 라우트 핸들러 - params.id로 동적 경로 세그먼트 접근
export async function PUT(
  request: Request,
  { params }: any
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 세션 확인
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', sessionData.session.user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    // 요청 데이터 파싱
    const requestData = await request.json();
    const { manual_summary } = requestData;

    if (manual_summary === undefined) {
      return NextResponse.json(
        { error: '요약문이 필요합니다' },
        { status: 400 }
      );
    }

    // 요약 존재 여부 확인
    const { data: summaryExists, error: checkError } = await supabase
      .from('summaries')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !summaryExists) {
      return NextResponse.json(
        { error: '요약을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 요약 업데이트
    const { data, error } = await supabase
      .from('summaries')
      .update({
        manual_summary,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('요약 업데이트 오류:', error);
      return NextResponse.json(
        { error: '요약 업데이트에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('서버 오류:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 