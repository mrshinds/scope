import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 개발 환경에서 샘플 데이터를 반환하여 DB 오류 방지
    if (process.env.NODE_ENV === 'development' && (id.startsWith('sample-') || id.startsWith('temp-'))) {
      return NextResponse.json({
        article: {
          id: id,
          title: '샘플 기사 제목',
          source: '금융위원회',
          source_url: 'https://example.com/article',
          published_at: new Date().toISOString(),
          tags: ['금융규제', '샘플태그'],
          source_type: '금융위원회'
        },
        summary: {
          id: 'dummy-summary-id',
          article_id: id,
          summary: '이 기사는 금융 규제에 관한 샘플 기사입니다. 개발 환경에서 테스트 목적으로 생성된 데이터입니다.',
          gpt_version: 'dummy'
        }
      });
    }

    // 기사 데이터 가져오기
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
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
      source: article.source_name,
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