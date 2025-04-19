import axios from 'axios';
import { NewsItem } from './types';

/**
 * 네이버 뉴스를 가져오는 함수
 */
export async function fetchNaverNews(page = 1): Promise<NewsItem[]> {
  try {
    console.log(`Fetching Naver news, page: ${page}`);
    const response = await axios.get(`/api/news?source=naver&page=${page}`, {
      timeout: 10000 // 10초 타임아웃
    });
    
    if (!response.data || response.data.length === 0) {
      console.warn('네이버 뉴스 API 응답이 비어있습니다.');
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error('네이버 뉴스 가져오기 에러:', error);
    return [];
  }
}

/**
 * 구글 뉴스를 가져오는 함수
 */
export async function fetchGoogleNews(page = 1): Promise<NewsItem[]> {
  try {
    console.log(`Fetching Google news, page: ${page}`);
    const response = await axios.get(`/api/news?source=google&page=${page}`, {
      timeout: 10000 // 10초 타임아웃
    });
    
    if (!response.data || response.data.length === 0) {
      console.warn('구글 뉴스 API 응답이 비어있습니다.');
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error('구글 뉴스 가져오기 에러:', error);
    return [];
  }
}

/**
 * 모든 뉴스를 가져오는 함수
 */
export async function fetchAllNews(page = 1): Promise<NewsItem[]> {
  try {
    console.log(`Fetching all news, page: ${page}`);
    const response = await axios.get(`/api/news?page=${page}`, {
      timeout: 15000 // 15초 타임아웃
    });
    
    if (!response.data || response.data.length === 0) {
      console.warn('뉴스 API 응답이 비어있습니다. 더미 데이터를 사용합니다.');
      return getDummyNews();
    }
    
    return response.data;
  } catch (error) {
    console.error('뉴스 가져오기 에러:', error);
    return getDummyNews();
  }
}

/**
 * 더미 뉴스 데이터
 */
function getDummyNews(): NewsItem[] {
  return [
    {
      id: `naver-${Date.now()}-1`,
      title: '신한은행, 대출금리 인하 검토... 금리인하 기조 속 선제적 대응',
      source: '네이버 뉴스',
      publisher: '경제신문',
      date: new Date().toISOString(),
      url: 'https://news.naver.com/article/example1',
      summary: '신한은행이 최근 금리인하 기조에 맞춰 대출금리 인하를 검토 중인 것으로 알려졌다. 한국은행의 기준금리 인하 가능성이 높아지는 가운데 이루어진 결정이다.',
      tags: ['신한은행', '금리인하', '대출금리'],
      keywords: ['대출금리', '인하', '기준금리'],
      isScrapped: false,
      imageUrl: 'https://via.placeholder.com/150'
    },
    {
      id: `google-${Date.now()}-1`,
      title: '신한은행, MZ세대 겨냥한 특화 금융상품 출시',
      source: '구글 뉴스',
      publisher: '머니투데이',
      date: new Date(Date.now() - 86400000).toISOString(),
      url: 'https://news.google.com/articles/example1',
      summary: '신한은행이 MZ세대를 타겟으로 한 특화 금융상품을 출시했다. 모바일 앱을 통한 간편 가입과 함께 커피, 영화 등 라이프스타일 혜택을 제공하는 것이 특징이다.',
      tags: ['신한은행', 'MZ세대', '금융상품'],
      keywords: ['MZ세대', '금융상품', '혜택'],
      isScrapped: false,
      imageUrl: 'https://via.placeholder.com/150'
    },
    {
      id: `naver-${Date.now()}-2`,
      title: '신한은행, 디지털 경쟁력 강화 위한 IT 인력 대규모 채용',
      source: '네이버 뉴스',
      publisher: 'IT동아',
      date: new Date(Date.now() - 172800000).toISOString(),
      url: 'https://news.naver.com/article/example2',
      summary: '신한은행이 디지털 전환 가속화를 위해 IT 인력을 대규모로 채용한다고 밝혔다. 빅데이터, AI, 클라우드 분야의 전문가를 중심으로 100명 이상을 선발할 예정이다.',
      tags: ['신한은행', 'IT', '채용', '디지털전환'],
      keywords: ['IT인력', '채용', '디지털'],
      isScrapped: false,
      imageUrl: 'https://via.placeholder.com/150'
    }
  ];
} 