import { NextResponse } from 'next/server';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 인기 태그 더미 데이터
const dummyTags = [
  { name: '디지털자산', count: 15 },
  { name: '금융규제', count: 12 },
  { name: 'ESG', count: 10 },
  { name: '가상화폐', count: 8 },
  { name: '경제전망', count: 7 },
  { name: '기준금리', count: 6 },
  { name: '통화정책', count: 5 },
  { name: '금융감독', count: 5 },
  { name: '지속가능경영', count: 4 }
];

interface TagCount {
  tag: string;
  count: number;
}

// 인기 태그 조회 API
export async function GET(request: Request) {
  try {
    // 개발 환경에서 Supabase 연결 확인
    if (process.env.NODE_ENV === 'development') {
      const isConnected = await checkSupabaseConnection();
      
      if (!isConnected) {
        console.warn('Supabase 연결이 불가능합니다. 개발 환경에서 임시 데이터를 반환합니다.');
        return NextResponse.json({
          tags: dummyTags,
          _dev_note: '이 데이터는 개발 환경에서만 제공되는 임시 데이터입니다.'
        });
      }
    }

    // URL 파라미터 추출 (limit: 가져올 태그 개수, default: 20)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // 태그별 카운트 쿼리
    const { data: tagCounts, error: countError } = await supabase
      .rpc('get_popular_tags', { max_count: limit });

    // 만약 rpc가 설정되지 않았다면 대체 쿼리
    if (countError && countError.message.includes('function "get_popular_tags" does not exist')) {
      console.warn('get_popular_tags 함수가 없습니다. 대체 쿼리를 실행합니다.');
      
      // 수동으로 모든 태그를 가져온 다음 집계
      const { data: allTags, error: tagsError } = await supabase
        .from('article_tags')
        .select('tag');
      
      if (tagsError) {
        console.error('태그 조회 오류:', tagsError);
        return NextResponse.json(
          { 
            error: '태그 조회 중 오류가 발생했습니다',
            details: tagsError.message,
            code: tagsError.code
          },
          { status: 500 }
        );
      }
      
      // 태그 빈도수 계산
      const tagFrequency: Record<string, number> = {};
      allTags.forEach((item: { tag: string }) => {
        tagFrequency[item.tag] = (tagFrequency[item.tag] || 0) + 1;
      });
      
      // 빈도순으로 정렬 후 제한
      const tagsSorted = Object.entries(tagFrequency)
        .map(([tag, count]) => ({ name: tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      
      return NextResponse.json({ tags: tagsSorted });
    }

    if (countError) {
      console.error('태그 조회 오류:', countError);
      return NextResponse.json(
        { 
          error: '태그 조회 중 오류가 발생했습니다',
          details: countError.message,
          code: countError.code
        },
        { status: 500 }
      );
    }

    // 태그 정보 형식 변환
    const formattedTags = tagCounts.map((item: TagCount) => ({
      name: item.tag,
      count: item.count
    }));

    return NextResponse.json({ tags: formattedTags });
  } catch (err) {
    console.error('서버 오류:', err);
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다',
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
} 