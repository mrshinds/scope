import { NextResponse } from 'next/server';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';

// 임시 기사 데이터
const dummyArticles = [
  {
    id: 'dummy-1',
    title: '금융위원회, 디지털 자산 거래소 규제 가이드라인 발표',
    source: '금융위원회',
    source_type: '금융위원회',
    published_at: new Date().toISOString(),
    source_url: 'https://example.com/article1',
    tags: ['디지털자산', '가상화폐', '금융규제'],
    summary: '금융위원회가 국내 디지털 자산 거래소에 대한 규제 가이드라인을 발표했습니다. 이번 가이드라인은 투자자 보호와 시장 안정성을 높이기 위한 조치로, 내년부터 적용될 예정입니다.',
    isScrapped: false
  },
  {
    id: 'dummy-2',
    title: '한국은행, 기준금리 동결 결정',
    source: '한국은행',
    source_type: '한국은행',
    published_at: new Date(Date.now() - 86400000).toISOString(),
    source_url: 'https://example.com/article2',
    tags: ['기준금리', '통화정책', '경제전망'],
    summary: '한국은행 금융통화위원회가 현재 3.5%인 기준금리를 유지하기로 결정했습니다. 위원회는 국내외 경제 불확실성과 물가 상승 압력 등을 고려해 금리 동결을 선택했다고 밝혔습니다.',
    isScrapped: false
  },
  {
    id: 'dummy-3',
    title: '금융감독원, 은행권 ESG 경영 평가 결과 발표',
    source: '금융감독원',
    source_type: '금융감독원',
    published_at: new Date(Date.now() - 172800000).toISOString(),
    source_url: 'https://example.com/article3',
    tags: ['ESG', '금융감독', '지속가능경영'],
    summary: '금융감독원이 국내 은행들의 ESG 경영 현황에 대한 평가 결과를 발표했습니다. 평가 결과에 따르면, 대부분의 은행들이 환경 및 사회적 책임 부문에서 개선이 필요한 것으로 나타났습니다.',
    isScrapped: false
  }
];

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // URL 파라미터 추출
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const source = searchParams.get('source') || '';
    const tag = searchParams.get('tag') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 개발 환경에서 Supabase 연결 확인
    if (process.env.NODE_ENV === 'development') {
      const isConnected = await checkSupabaseConnection();
      
      if (!isConnected) {
        console.warn('Supabase 연결이 불가능합니다. 개발 환경에서 임시 데이터를 반환합니다.');
        
        // 임시 데이터에 검색/필터링 적용
        let filteredArticles = [...dummyArticles];
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredArticles = filteredArticles.filter(article => 
            article.title.toLowerCase().includes(searchLower) || 
            article.summary.toLowerCase().includes(searchLower)
          );
        }
        
        if (source) {
          filteredArticles = filteredArticles.filter(article => 
            article.source_type === source
          );
        }
        
        if (tag) {
          filteredArticles = filteredArticles.filter(article => 
            article.tags.some(t => t.toLowerCase() === tag.toLowerCase())
          );
        }
        
        // 페이지네이션 적용
        const paginatedArticles = filteredArticles.slice(offset, offset + limit);
        
        return NextResponse.json({
          items: paginatedArticles,
          total: filteredArticles.length,
          page,
          limit,
          hasMore: filteredArticles.length > offset + limit,
          _dev_note: '이 데이터는 개발 환경에서만 제공되는 임시 데이터입니다.'
        });
      }
    }

    // Supabase 쿼리 시작
    let query = supabase
      .from('articles')
      .select('*, summaries(*)', { count: 'exact' });

    // 검색어 필터링
    if (search) {
      query = query.or(`title.ilike.%${search}%, summaries.summary.ilike.%${search}%`);
    }

    // 소스 필터링
    if (source) {
      query = query.eq('source_type', source);
    }

    // 태그 필터링 - 태그가 있는 경우 태그 관련 아티클만 가져옴
    if (tag) {
      try {
        const { data: taggedArticleIds, error: tagError } = await supabase
          .from('article_tags')
          .select('article_id')
          .eq('tag', tag);
        
        if (tagError) {
          console.error('태그 조회 오류:', tagError);
          return NextResponse.json(
            { 
              error: '태그 필터링 중 오류가 발생했습니다',
              details: tagError.message,
              code: tagError.code 
            },
            { status: 500 }
          );
        }
        
        if (taggedArticleIds && taggedArticleIds.length > 0) {
          const ids = taggedArticleIds.map(item => item.article_id);
          query = query.in('id', ids);
        } else {
          // 태그 검색 결과가 없으면 빈 배열 반환
          return NextResponse.json({
            items: [],
            total: 0,
            page,
            limit,
            hasMore: false,
            message: '해당 태그의 기사가 없습니다.'
          });
        }
      } catch (tagErr) {
        console.error('태그 필터링 예외:', tagErr);
        return NextResponse.json(
          { 
            error: '태그 처리 중 예외가 발생했습니다',
            details: tagErr instanceof Error ? tagErr.message : String(tagErr)
          },
          { status: 500 }
        );
      }
    }

    // 정렬 및 페이지네이션
    query = query.order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 쿼리 실행
    const { data, error, count } = await query;

    if (error) {
      console.error('기사 조회 오류:', error);
      return NextResponse.json(
        { 
          error: '기사를 불러오는데 실패했습니다', 
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    // 빈 결과 처리
    if (!data || data.length === 0) {
      return NextResponse.json({
        items: [],
        total: 0,
        page,
        limit,
        hasMore: false,
        message: '검색 결과가 없습니다.'
      });
    }

    try {
      // 태그 데이터 가져오기
      const articleIds = data.map((article: any) => article.id);
      
      const { data: tagData, error: tagError } = await supabase
        .from('article_tags')
        .select('article_id, tag')
        .in('article_id', articleIds);

      if (tagError) {
        console.error('태그 조회 오류:', tagError);
      }

      // 태그 데이터를 기사별로 매핑
      const tagsByArticle = tagData ? tagData.reduce((acc: any, item: any) => {
        if (!acc[item.article_id]) {
          acc[item.article_id] = [];
        }
        acc[item.article_id].push(item.tag);
        return acc;
      }, {}) : {};

      // 기사 데이터 가공
      const processedArticles = data.map((article: any) => {
        return {
          id: article.id,
          title: article.title,
          source: article.source_name,
          source_type: article.source_type,
          published_at: article.published_at,
          source_url: article.source_url,
          tags: tagsByArticle[article.id] || [],
          summary: article.summaries?.summary || null,
          isScrapped: false // 클라이언트에서 사용자별로 처리
        };
      });

      return NextResponse.json({
        items: processedArticles,
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > offset + limit
      });
    } catch (processErr) {
      console.error('데이터 가공 중 오류:', processErr);
      return NextResponse.json(
        { 
          error: '데이터 처리 중 오류가 발생했습니다',
          details: processErr instanceof Error ? processErr.message : String(processErr)
        },
        { status: 500 }
      );
    }
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