import { NextResponse } from 'next/server';
import { NewsItem } from '@/lib/types';
import axios from 'axios';
import * as cheerio from 'cheerio';

// 네이버 뉴스 스크래핑 함수 (금융, 경제 관련 뉴스 검색)
async function scrapeNaverNews(page: number = 1): Promise<NewsItem[]> {
  console.log(`네이버 뉴스 스크래핑 페이지: ${page}`);
  try {
    const searchQuery = encodeURIComponent('금융 경제');
    const startIndex = (page - 1) * 10;
    const url = `https://search.naver.com/search.naver?where=news&query=${searchQuery}&start=${startIndex + 1}`;
    
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const newsItems: NewsItem[] = [];
    
    $('.news_wrap').each((index, element) => {
      try {
        const title = $(element).find('.news_tit').text().trim();
        const url = $(element).find('.news_tit').attr('href') || '';
        const publisher = $(element).find('.info.press').text().trim();
        const summary = $(element).find('.news_dsc').text().trim();
        const dateStr = $(element).find('.info.time').text().trim();
        
        // 이미지 URL 추출
        const imageUrl = $(element).find('img.thumb').attr('src') || 'https://via.placeholder.com/150';
        
        // 날짜 문자열을 Date 객체로 변환 (실제 날짜 포맷에 따라 수정 필요)
        const date = new Date().toISOString();
        
        // 키워드 추출 (기사 제목에서 주요 단어 추출)
        const keywords = title.split(' ')
          .filter(word => word.length > 1)
          .slice(0, 3);
          
        // 태그 생성 (키워드에서 일부 선택)
        const tags = keywords.slice(0, 2);
        
        if (title && url) {
          newsItems.push({
            id: `naver-${Date.now()}-${index}`,
            title,
            source: '네이버 뉴스',
            publisher,
            date,
            url,
            summary,
            tags,
            keywords,
            isScrapped: false,
            imageUrl
          });
        }
      } catch (error) {
        console.error('네이버 뉴스 아이템 파싱 오류:', error);
      }
    });
    
    return newsItems;
  } catch (error) {
    console.error('네이버 뉴스 스크래핑 오류:', error);
    return [];
  }
}

// 구글 뉴스 스크래핑 함수 (금융, 경제 관련 뉴스 검색)
async function scrapeGoogleNews(page: number = 1): Promise<NewsItem[]> {
  console.log(`구글 뉴스 스크래핑 페이지: ${page}`);
  try {
    const searchQuery = encodeURIComponent('금융 경제 site:kr');
    const startIndex = (page - 1) * 10;
    // 참고: 실제로 구글은 CORS 제약이 있어 서버사이드에서 요청해야 함
    const url = `https://news.google.com/search?q=${searchQuery}&hl=ko&gl=KR&ceid=KR:ko`;
    
    // 예시용 더미 데이터
    return [
      {
        id: `google-${Date.now()}-1`,
        title: '한국은행, 금융시장 안정을 위한 새로운 정책 발표',
        source: '구글 뉴스',
        publisher: '조선비즈',
        date: new Date().toISOString(),
        url: 'https://biz.chosun.com/',
        summary: '한국은행이 금융시장 안정을 위한 새로운 정책을 발표했습니다. 이 정책은 최근의 경제 불황에 대응하기 위한 조치입니다.',
        tags: ['한국은행', '금융정책', '경제안정'],
        keywords: ['한국은행', '금융정책', '시장안정', '경제'],
        isScrapped: false,
        imageUrl: 'https://via.placeholder.com/150'
      },
      {
        id: `google-${Date.now()}-2`,
        title: '금융위원회, 핀테크 산업 지원 방안 확대',
        source: '구글 뉴스',
        publisher: '한국경제',
        date: new Date(Date.now() - 86400000).toISOString(),
        url: 'https://www.hankyung.com/',
        summary: '금융위원회가 핀테크 산업 지원 방안을 확대한다고 발표했습니다. 이는 디지털 금융 혁신을 가속화하기 위한 조치입니다.',
        tags: ['금융위원회', '핀테크', '디지털금융'],
        keywords: ['금융위원회', '핀테크', '디지털혁신', '지원정책'],
        isScrapped: false,
        imageUrl: 'https://via.placeholder.com/150'
      }
    ];
  } catch (error) {
    console.error('구글 뉴스 스크래핑 오류:', error);
    return [];
  }
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