import axios from 'axios';
import cheerio from 'cheerio';
import { NewsItem } from './types';
import OpenAI from 'openai';

/**
 * 네이버 뉴스에서 신한은행 관련 뉴스를 스크래핑하는 함수
 */
export async function scrapeNaverNews(page = 1): Promise<NewsItem[]> {
  try {
    // ChatGPT API를 통한 네이버 뉴스 크롤링
    // 실제 프로덕션에서는 서버 측에서 처리되어야 합니다
    const query = encodeURIComponent('신한은행');
    const start = (page - 1) * 10 + 1;
    
    // 이 부분은 실제로 ChatGPT API 또는 직접 네이버 뉴스 API를 사용해야 합니다
    // 개발 환경에서는 더미 데이터 반환
    const items: NewsItem[] = [
      {
        id: `naver-${Date.now()}-1`,
        title: '신한은행, 대출금리 인하 검토... 금리인하 기조 속 선제적 대응',
        source: '네이버 뉴스',
        publisher: '경제신문',
        date: new Date().toISOString(),
        url: 'https://news.naver.com/article/example1',
        summary: '신한은행이 최근 금리인하 기조에 맞춰 대출금리 인하를 검토 중인 것으로 알려졌다. 한국은행의 기준금리 인하 가능성이 높아지는 가운데 이루어진 결정이다.',
        tags: ['신한은행', '금리인하', '대출금리'],
        isScrapped: false,
        imageUrl: 'https://via.placeholder.com/150'
      },
      {
        id: `naver-${Date.now()}-2`,
        title: '신한은행, 디지털 경쟁력 강화 위한 IT 인력 대규모 채용',
        source: '네이버 뉴스',
        publisher: 'IT동아',
        date: new Date(Date.now() - 86400000).toISOString(), // 하루 전
        url: 'https://news.naver.com/article/example2',
        summary: '신한은행이 디지털 전환 가속화를 위해 IT 인력을 대규모로 채용한다고 밝혔다. 빅데이터, AI, 클라우드 분야의 전문가를 중심으로 100명 이상을 선발할 예정이다.',
        tags: ['신한은행', 'IT', '채용', '디지털전환'],
        isScrapped: false,
        imageUrl: 'https://via.placeholder.com/150'
      },
      {
        id: `naver-${Date.now()}-3`,
        title: '신한은행, ESG 경영 강화... 친환경 투자 확대',
        source: '네이버 뉴스',
        publisher: '한경비즈니스',
        date: new Date(Date.now() - 172800000).toISOString(), // 이틀 전
        url: 'https://news.naver.com/article/example3',
        summary: '신한은행이 ESG 경영 강화를 위한 친환경 투자를 확대한다. 2023년부터 석탄발전 관련 프로젝트 파이낸싱을 중단하고, 신재생에너지 관련 투자를 늘릴 계획이다.',
        tags: ['신한은행', 'ESG', '친환경', '투자'],
        isScrapped: false,
        imageUrl: 'https://via.placeholder.com/150'
      }
    ];
    
    return items;
  } catch (error) {
    console.error('네이버 뉴스 스크래핑 에러:', error);
    return [];
  }
}

/**
 * 구글 뉴스에서 신한은행 관련 뉴스를 스크래핑하는 함수
 */
export async function scrapeGoogleNews(page = 1): Promise<NewsItem[]> {
  try {
    // ChatGPT API를 통한 구글 뉴스 크롤링
    // 실제 프로덕션에서는 서버 측에서 처리되어야 합니다
    const query = encodeURIComponent('신한은행');
    
    // 이 부분은 실제로 ChatGPT API 또는 직접 구글 뉴스 API를 사용해야 합니다
    // 개발 환경에서는 더미 데이터 반환
    const items: NewsItem[] = [
      {
        id: `google-${Date.now()}-1`,
        title: '신한은행, MZ세대 겨냥한 특화 금융상품 출시',
        source: '구글 뉴스',
        publisher: '머니투데이',
        date: new Date().toISOString(),
        url: 'https://news.google.com/articles/example1',
        summary: '신한은행이 MZ세대를 타겟으로 한 특화 금융상품을 출시했다. 모바일 앱을 통한 간편 가입과 함께 커피, 영화 등 라이프스타일 혜택을 제공하는 것이 특징이다.',
        tags: ['신한은행', 'MZ세대', '금융상품'],
        isScrapped: false,
        imageUrl: 'https://via.placeholder.com/150'
      },
      {
        id: `google-${Date.now()}-2`,
        title: '신한은행-구글 클라우드, 금융 클라우드 전환 협력 발표',
        source: '구글 뉴스',
        publisher: '디지털타임스',
        date: new Date(Date.now() - 86400000).toISOString(), // 하루 전
        url: 'https://news.google.com/articles/example2',
        summary: '신한은행과 구글 클라우드가 금융 클라우드 전환을 위한 전략적 파트너십을 체결했다. 이번 협력을 통해 신한은행은 핵심 금융 시스템의 클라우드 전환을 가속화할 예정이다.',
        tags: ['신한은행', '구글', '클라우드', '디지털전환'],
        isScrapped: false,
        imageUrl: 'https://via.placeholder.com/150'
      },
      {
        id: `google-${Date.now()}-3`,
        title: '신한은행, 글로벌 시장 진출 확대... 동남아 법인 추가 설립',
        source: '구글 뉴스',
        publisher: '아시아경제',
        date: new Date(Date.now() - 172800000).toISOString(), // 이틀 전
        url: 'https://news.google.com/articles/example3',
        summary: '신한은행이 동남아 시장 진출을 위해 베트남과 인도네시아에 이어 필리핀과 말레이시아에도 현지 법인을 설립할 계획이다. 글로벌 뱅킹 사업 확대를 위한 전략의 일환이다.',
        tags: ['신한은행', '글로벌', '동남아', '해외진출'],
        isScrapped: false,
        imageUrl: 'https://via.placeholder.com/150'
      }
    ];
    
    return items;
  } catch (error) {
    console.error('구글 뉴스 스크래핑 에러:', error);
    return [];
  }
}

/**
 * ChatGPT API를 활용한 뉴스 스크래핑 함수
 * 제품 환경에서 실제 API 연동이 필요합니다
 */
export async function scrapeNewsWithChatGPT(query: string, source: string): Promise<NewsItem[]> {
  try {
    // 실제 구현 시에는 OpenAI API를 호출해야 합니다
    // const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    //   model: "gpt-4",
    //   messages: [
    //     {
    //       role: "system",
    //       content: `최신 ${source} 뉴스에서 "${query}" 관련 기사를 5개 찾아서 JSON 형태로 정리해주세요.`
    //     }
    //   ]
    // }, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   }
    // });
    
    // const result = response.data.choices[0].message.content;
    // return JSON.parse(result);
    
    // 개발 환경에서는 더미 데이터 반환
    return [];
  } catch (error) {
    console.error('ChatGPT API 뉴스 스크래핑 에러:', error);
    return [];
  }
}

/**
 * 모든 뉴스 소스에서 뉴스를 가져오는 함수
 */
export async function fetchAllNews(): Promise<NewsItem[]> {
  try {
    const [naverNews, googleNews] = await Promise.all([
      scrapeNaverNews(),
      scrapeGoogleNews()
    ]);
    
    return [...naverNews, ...googleNews];
  } catch (error) {
    console.error('뉴스 fetch 에러:', error);
    return [];
  }
}

// API 키 확인
const apiKey = process.env.OPENAI_API_KEY;

// 안전한 OpenAI 클라이언트 생성
const createOpenAI = () => {
  if (!apiKey) {
    console.warn("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.");
    return null;
  }
  return new OpenAI({
    apiKey: apiKey
  });
};

export async function summarizeWithGPT(text: string) {
  const openai = createOpenAI();
  if (!openai) {
    return { summary: "API 키가 설정되지 않아 요약을 생성할 수 없습니다.", tags: [] };
  }
  
  try {
    // 여기서 OpenAI API 호출
    // ...
  } catch (error) {
    console.error("OpenAI API 호출 중 오류:", error);
    return { summary: "요약 생성 중 오류가 발생했습니다.", tags: [] };
  }
} 