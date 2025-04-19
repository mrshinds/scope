import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 샘플 기사 데이터
const sampleArticles = [
  {
    title: '금융위원회, 디지털 자산 거래소 규제 가이드라인 발표',
    source_name: '금융위원회',
    source_type: '금융위원회',
    published_at: new Date().toISOString(),
    source_url: 'https://example.com/fsc/article1',
  },
  {
    title: '한국은행, 기준금리 동결 결정',
    source_name: '한국은행',
    source_type: '한국은행',
    published_at: new Date(Date.now() - 86400000).toISOString(),
    source_url: 'https://example.com/bok/article2',
  },
  {
    title: '금융감독원, 은행권 ESG 경영 평가 결과 발표',
    source_name: '금융감독원',
    source_type: '금융감독원',
    published_at: new Date(Date.now() - 172800000).toISOString(),
    source_url: 'https://example.com/fss/article3',
  },
  {
    title: '금융위원회, 핀테크 산업 혁신 방안 발표',
    source_name: '금융위원회',
    source_type: '금융위원회',
    published_at: new Date(Date.now() - 259200000).toISOString(),
    source_url: 'https://example.com/fsc/article4',
  },
  {
    title: '금융감독원, 가상자산 투자자 보호 지침 공개',
    source_name: '금융감독원',
    source_type: '금융감독원',
    published_at: new Date(Date.now() - 345600000).toISOString(),
    source_url: 'https://example.com/fss/article5',
  }
];

// 샘플 요약 데이터
const generateSummary = (title: string) => {
  const summaries: Record<string, string> = {
    '금융위원회, 디지털 자산 거래소 규제 가이드라인 발표': 
      '금융위원회가 국내 디지털 자산 거래소에 대한 규제 가이드라인을 발표했습니다. 이번 가이드라인은 투자자 보호와 시장 안정성을 높이기 위한 조치로, 내년부터 적용될 예정입니다.',
    '한국은행, 기준금리 동결 결정': 
      '한국은행 금융통화위원회가 현재 3.5%인 기준금리를 유지하기로 결정했습니다. 위원회는 국내외 경제 불확실성과 물가 상승 압력 등을 고려해 금리 동결을 선택했다고 밝혔습니다.',
    '금융감독원, 은행권 ESG 경영 평가 결과 발표': 
      '금융감독원이 국내 은행들의 ESG 경영 현황에 대한 평가 결과를 발표했습니다. 평가 결과에 따르면 대부분의 은행들이 환경 및 사회적 책임 부문에서 개선이 필요하다는 제언이 있었습니다.',
    '금융위원회, 핀테크 산업 혁신 방안 발표': 
      '금융위원회가 핀테크 산업의 혁신 성장을 지원하기 위한 종합 방안을 발표했습니다. 규제 샌드박스 확대, 데이터 활용 확대 등 다양한 지원 방안이 포함되었습니다.',
    '금융감독원, 가상자산 투자자 보호 지침 공개': 
      '금융감독원이 가상자산 투자자 보호를 위한 지침을 공개했습니다. 거래소의 정보 공시 의무 강화와 투자자 교육 확대 등의 내용이 담겨 있습니다.'
  };
  
  return summaries[title] || `${title}에 관한 내용을 요약한 설명입니다. 이 문서는 테스트 목적으로 생성되었습니다.`;
};

// 샘플 태그 데이터
const getTagsForArticle = (title: string) => {
  const tagMap: Record<string, string[]> = {
    '금융위원회, 디지털 자산 거래소 규제 가이드라인 발표': ['디지털자산', '가상화폐', '금융규제'],
    '한국은행, 기준금리 동결 결정': ['기준금리', '통화정책', '경제전망'],
    '금융감독원, 은행권 ESG 경영 평가 결과 발표': ['ESG', '금융감독', '지속가능경영'],
    '금융위원회, 핀테크 산업 혁신 방안 발표': ['핀테크', '금융혁신', '규제샌드박스'],
    '금융감독원, 가상자산 투자자 보호 지침 공개': ['가상자산', '투자자보호', '금융규제']
  };
  
  return tagMap[title] || ['테스트', '샘플데이터'];
};

// 결과 인터페이스
interface TestDataResults {
  articles: Array<Record<string, any>>;
  summaries: Array<Record<string, any>>;
  tags: Array<{article_id: string; tag: string}>;
}

export async function POST(request: Request) {
  // 개발 환경에서만 작동
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: '이 API는 개발 환경에서만 사용할 수 있습니다.' },
      { status: 403 }
    );
  }

  try {
    const results: TestDataResults = {
      articles: [],
      summaries: [],
      tags: []
    };

    // 기존 데이터 확인
    const { data: existingArticles, error: checkError } = await supabase
      .from('articles')
      .select('id')
      .limit(1);
    
    // 이미 데이터가 있으면 중단
    if (!checkError && existingArticles && existingArticles.length > 0) {
      return NextResponse.json({
        message: '테스트 데이터가 이미 존재합니다. 중복 생성을 방지하기 위해 API 요청이 취소되었습니다.',
        existing_count: existingArticles.length
      });
    }

    // 기사 데이터 삽입
    for (const article of sampleArticles) {
      // 기사 정보 저장
      const { data: newArticle, error: articleError } = await supabase
        .from('articles')
        .insert(article)
        .select()
        .single();

      if (articleError) {
        console.error('기사 추가 오류:', articleError);
        continue;
      }

      results.articles.push(newArticle);

      // 요약 데이터 저장
      const summary = {
        article_id: newArticle.id,
        summary: generateSummary(newArticle.title),
        full_text: `${newArticle.title}의 전체 내용입니다. 이 텍스트는 테스트 데이터로, 실제 보도자료의 내용을 담고 있지 않습니다.`,
        manual_summary: '',
        gpt_version: 'gpt-4-test',
        created_at: new Date().toISOString()
      };

      const { data: newSummary, error: summaryError } = await supabase
        .from('summaries')
        .insert(summary)
        .select()
        .single();

      if (summaryError) {
        console.error('요약 추가 오류:', summaryError);
      } else if (newSummary) {
        results.summaries.push(newSummary);
      }

      // 태그 저장
      const tags = getTagsForArticle(newArticle.title);
      for (const tag of tags) {
        // 태그 테이블에 추가
        await supabase.from('tags').upsert({ name: tag }).select();

        // 기사-태그 연결
        const { error: tagLinkError } = await supabase
          .from('article_tags')
          .insert({
            article_id: newArticle.id,
            tag: tag
          });

        if (tagLinkError) {
          console.error('태그 연결 오류:', tagLinkError);
        } else {
          results.tags.push({ article_id: newArticle.id, tag });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '테스트 데이터가 생성되었습니다.',
      created: {
        articles: results.articles.length,
        summaries: results.summaries.length,
        tags: results.tags.length
      }
    });
  } catch (err) {
    console.error('테스트 데이터 생성 오류:', err);
    return NextResponse.json(
      { 
        error: '테스트 데이터 생성 중 오류가 발생했습니다',
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
} 