import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json(
      { error: 'ID가 필요합니다' },
      { status: 400 }
    );
  }

  try {
    // 기사 데이터 가져오기
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*, sources(name, url)')
      .eq('id', id)
      .single();

    if (articleError) {
      console.error('기사 조회 오류:', articleError);
      return NextResponse.json(
        { error: '기사를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 요약 데이터 가져오기
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .select('*')
      .eq('article_id', id)
      .single();

    // 태그 데이터 가져오기
    const { data: tags, error: tagsError } = await supabase
      .from('article_tags')
      .select('tag')
      .eq('article_id', id);

    // 태그 배열로 변환
    const tagArray = tags ? tags.map(t => t.tag) : [];

    // 소스 정보 처리
    let processedArticle = {
      ...article,
      source: article.sources?.name || article.source_name,
      source_url: article.sources?.url || article.source_url,
      tags: tagArray
    };

    return NextResponse.json({
      article: processedArticle,
      summary: summary || null
    });
  } catch (err) {
    console.error('서버 오류:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 