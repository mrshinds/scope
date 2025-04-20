import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 태그 추가
export async function POST(
  request: Request,
  { params }: any
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: 'ID가 필요합니다' },
      { status: 400 }
    );
  }

  try {
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
    const { tag } = requestData;

    if (!tag) {
      return NextResponse.json(
        { error: '태그가 필요합니다' },
        { status: 400 }
      );
    }

    // 기사 존재 여부 확인
    const { data: articleExists, error: articleError } = await supabase
      .from('articles')
      .select('id')
      .eq('id', id)
      .single();

    if (articleError || !articleExists) {
      return NextResponse.json(
        { error: '기사를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 태그 테이블에 태그 추가 (없으면 생성)
    const { data: tagData, error: tagError } = await supabase
      .from('tags')
      .upsert({ name: tag })
      .select('id')
      .single();

    if (tagError) {
      console.error('태그 생성 오류:', tagError);
      return NextResponse.json(
        { error: '태그 생성에 실패했습니다' },
        { status: 500 }
      );
    }

    // 기사-태그 연결
    const { error: linkError } = await supabase
      .from('article_tags')
      .upsert({ 
        article_id: id, 
        tag: tag 
      });

    if (linkError) {
      console.error('태그 연결 오류:', linkError);
      return NextResponse.json(
        { error: '태그 연결에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, tag });
  } catch (err) {
    console.error('서버 오류:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 태그 삭제
export async function DELETE(
  request: Request,
  { params }: any
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: 'ID가 필요합니다' },
      { status: 400 }
    );
  }

  try {
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
    const { tag } = requestData;

    if (!tag) {
      return NextResponse.json(
        { error: '태그가 필요합니다' },
        { status: 400 }
      );
    }

    // 기사-태그 연결 삭제
    const { error } = await supabase
      .from('article_tags')
      .delete()
      .eq('article_id', id)
      .eq('tag', tag);

    if (error) {
      console.error('태그 삭제 오류:', error);
      return NextResponse.json(
        { error: '태그 삭제에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('서버 오류:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 