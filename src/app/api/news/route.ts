import { NextResponse } from 'next/server';
import { NewsItem } from '@/lib/types';

// 네이버 뉴스 스크래핑 함수 (실제 구현에서는 서버에서 스크래핑 수행)
async function scrapeNaverNews(page: number): Promise<NewsItem[]> {
  console.log(`네이버 뉴스 스크래핑 페이지: ${page}`);
  
  // 실제 스크래핑 대신 더미 데이터 반환
  return [
    {
      id: `naver-${Date.now()}-1`,
      title: '신한금융그룹, ESG 경영 강화 위한 탄소중립 로드맵 발표',
      source: '네이버 뉴스',
      publisher: '매일경제',
      date: new Date().toISOString(),
      url: 'https://n.news.naver.com/article/009/0005124936',
      summary: '신한금융그룹이 2050년까지 탄소중립 달성을 위한 구체적인 로드맵을 발표했다. 그룹 내 모든 계열사가 참여하는 이번 계획은 금융업계에서 가장 포괄적인 탄소감축 전략으로 평가받고 있다.',
      tags: ['신한금융', 'ESG', '탄소중립'],
      keywords: ['신한금융', 'ESG 경영', '탄소중립', '기후변화'],
      isScrapped: false,
      imageUrl: 'https://via.placeholder.com/150'
    },
    {
      id: `naver-${Date.now()}-2`,
      title: '금융위, 가계부채 관리방안 발표...DSR 규제 단계적 완화',
      source: '네이버 뉴스',
      publisher: '연합뉴스',
      date: new Date(Date.now() - 86400000).toISOString(),
      url: 'https://n.news.naver.com/article/001/0014017245',
      summary: '금융위원회가 가계부채 관리방안을 발표했다. 총부채원리금상환비율(DSR) 규제를 단계적으로 완화하고, 실수요자 중심의 주택담보대출 지원을 확대하는 내용이 핵심이다.',
      tags: ['금융위원회', '가계부채', 'DSR'],
      keywords: ['가계부채', 'DSR 규제', '금융위원회', '대출규제'],
      isScrapped: false,
      imageUrl: 'https://via.placeholder.com/150'
    },
    {
      id: `naver-${Date.now()}-3`,
      title: "신한은행, 디지털 금융 플랫폼 '쏠(SOL)' 월간 활성 사용자 1000만 돌파",
      source: '네이버 뉴스',
      publisher: '한국경제',
      date: new Date(Date.now() - 172800000).toISOString(),
      url: 'https://n.news.naver.com/article/015/0004871324',
      summary: "신한은행의 모바일뱅킹 앱 '쏠(SOL)'의 월간 활성 사용자(MAU)가 1000만명을 돌파했다. 금융권 앱 중 최초로 이룬 성과로, MZ세대를 중심으로 한 사용자 증가가 주요 요인으로 분석된다.",
      tags: ['신한은행', '쏠', '디지털금융'],
      keywords: ['쏠', '모바일뱅킹', 'MAU', '디지털금융'],
      isScrapped: false,
      imageUrl: 'https://via.placeholder.com/150'
    }
  ];
}

// 구글 뉴스 스크래핑 함수 (실제 구현에서는 서버에서 스크래핑 수행)
async function scrapeGoogleNews(page: number): Promise<NewsItem[]> {
  console.log(`구글 뉴스 스크래핑 페이지: ${page}`);
  
  // 실제 스크래핑 대신 더미 데이터 반환
  return [
    {
      id: `google-${Date.now()}-1`,
      title: '한국은행, 기준금리 2년 만에 인하 전망...경기 둔화 우려 반영',
      source: '구글 뉴스',
      publisher: '조선비즈',
      date: new Date().toISOString(),
      url: 'https://biz.chosun.com/policy/policy_economy/2023/05/23/HRGVHYJ5RFBRBE3PUFBJNORBTA/',
      summary: '한국은행이 이번 달 금융통화위원회에서 기준금리를 2년 만에 인하할 것이라는 전망이 나오고 있다. 수출 부진과 내수 침체 등 경기 둔화 우려가 커진 데 따른 조치로 해석된다.',
      tags: ['한국은행', '금리인하', '통화정책'],
      keywords: ['기준금리', '한국은행', '금통위', '경기둔화'],
      isScrapped: false,
      imageUrl: 'https://via.placeholder.com/150'
    },
    {
      id: `google-${Date.now()}-2`,
      title: '금융권, 디지털 인재 확보 경쟁 치열...IT 인력 채용 대폭 확대',
      source: '구글 뉴스',
      publisher: '디지털타임스',
      date: new Date(Date.now() - 86400000).toISOString(),
      url: 'https://www.dt.co.kr/contents.html?article_no=2023052402109932036001',
      summary: '금융기관들이 디지털 전환 가속화에 따른, IT 인재 확보 경쟁에 돌입했다. 주요 은행과 금융지주사들은 올해 신입 및 경력 채용에서 IT 및 디지털 분야 인력 비중을 50% 이상으로 늘릴 계획이다.',
      tags: ['금융권', 'IT인재', '디지털전환'],
      keywords: ['IT인재', '디지털금융', '인재채용', '디지털전환'],
      isScrapped: false,
      imageUrl: 'https://via.placeholder.com/150'
    },
    {
      id: `google-${Date.now()}-3`,
      title: '금융소비자보호법 시행 2년, 민원 38% 감소...금융상품 불완전판매 개선 효과',
      source: '구글 뉴스',
      publisher: '파이낸셜뉴스',
      date: new Date(Date.now() - 172800000).toISOString(),
      url: 'https://www.fnnews.com/news/202304120917344017',
      summary: '금융소비자보호법 시행 2년 만에 금융 관련 민원이 38% 감소한 것으로 나타났다. 금융상품 판매 과정의 설명의무 강화와 청약철회권 보장 등이 금융소비자 권익 보호에 효과를 거둔 것으로 분석된다.',
      tags: ['금융소비자보호법', '민원감소', '금융감독'],
      keywords: ['금소법', '금융소비자', '불완전판매', '민원감소'],
      isScrapped: false,
      imageUrl: 'https://via.placeholder.com/150'
    }
  ];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const page = parseInt(searchParams.get('page') || '1');
    
    let results: NewsItem[] = [];
    
    if (source === 'naver') {
      results = await scrapeNaverNews(page);
    } else if (source === 'google') {
      results = await scrapeGoogleNews(page);
    } else {
      // 모든 소스 스크래핑
      const [naverResults, googleResults] = await Promise.all([
        scrapeNaverNews(page),
        scrapeGoogleNews(page)
      ]);
      
      results = [...naverResults, ...googleResults];
    }
    
    // 최신순으로 정렬
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('뉴스 API 에러:', error);
    return NextResponse.json({ error: '뉴스 스크래핑 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 