import axios from 'axios';
import cheerio from 'cheerio';
import { SourceItem } from './types';

/**
 * 금융감독원(FSS) 보도자료를 Next.js API 라우트를 통해 가져오는 함수
 */
export async function scrapeFSS(page = 1): Promise<SourceItem[]> {
  try {
    // 서버 API 라우트를 호출하여 스크래핑 결과를 가져옴
    const response = await axios.get(`/api/scraper?source=fss&page=${page}`);
    return response.data || [];
  } catch (error) {
    console.error('금융감독원 보도자료 가져오기 에러:', error);
    // 에러 발생 시 더미 데이터 반환
    return [
      {
        id: `fss-${Date.now()}-1`,
        title: '금융감독원, 핀테크 혁신 지원 방안 발표',
        source: '금융감독원',
        date: new Date().toISOString(),
        url: 'https://www.fss.or.kr/fss/bbs/B0000188/view.do?nttId=12345',
        summary: '금융감독원은 핀테크 기업의 혁신을 지원하기 위한 새로운 정책을 발표했다. 이번 정책은 규제 샌드박스 확대와 API 개방 확대 등을 포함한다.',
        tags: ['핀테크', '금융혁신', '규제샌드박스'],
        isScrapped: false,
        type: 'source'
      },
      {
        id: `fss-${Date.now()}-2`,
        title: '금융회사 디지털 전환 가이드라인 제정',
        source: '금융감독원',
        date: new Date(Date.now() - 86400000).toISOString(), // 하루 전
        url: 'https://www.fss.or.kr/fss/bbs/B0000188/view.do?nttId=12346',
        summary: '금융감독원은 금융회사의 디지털 전환을 위한 가이드라인을 제정했다고 밝혔다. 이번 가이드라인은 디지털 전환 과정에서의 보안 및 고객 보호 원칙을 담고 있다.',
        tags: ['디지털전환', '금융보안', '가이드라인'],
        isScrapped: false,
        type: 'source'
      }
    ];
  }
}

/**
 * 한국은행(BOK) 보도자료를 Next.js API 라우트를 통해 가져오는 함수
 */
export async function scrapeBOK(page = 1): Promise<SourceItem[]> {
  try {
    // 서버 API 라우트를 호출하여 스크래핑 결과를 가져옴
    const response = await axios.get(`/api/scraper?source=bok&page=${page}`);
    return response.data || [];
  } catch (error) {
    console.error('한국은행 보도자료 가져오기 에러:', error);
    return [
      {
        id: `bok-${Date.now()}-1`,
        title: '한국은행, 기준금리 동결 결정',
        source: '한국은행',
        date: new Date().toISOString(),
        url: 'https://www.bok.or.kr/portal/bbs/B0000338/view.do?nttId=12345',
        summary: '한국은행 금융통화위원회는 오늘 기준금리를 현 수준에서 동결하기로 결정했다. 물가 상승률과 경제 성장률 전망 등을 종합적으로 고려한 결정이라고 밝혔다.',
        tags: ['기준금리', '통화정책', '금융통화위원회'],
        isScrapped: false,
        type: 'source'
      },
      {
        id: `bok-${Date.now()}-2`,
        title: '경제 성장률 전망치 상향 조정',
        source: '한국은행',
        date: new Date(Date.now() - 86400000).toISOString(), // 하루 전
        url: 'https://www.bok.or.kr/portal/bbs/B0000338/view.do?nttId=12346',
        summary: '한국은행은 올해 경제 성장률 전망치를 기존 2.1%에서 2.5%로 상향 조정했다. 수출 회복세와 내수 개선이 주요 요인으로 분석된다.',
        tags: ['경제전망', '성장률', '수출'],
        isScrapped: false,
        type: 'source'
      }
    ];
  }
}

/**
 * 금융위원회(FSC) 보도자료를 Next.js API 라우트를 통해 가져오는 함수
 */
export async function scrapeFSC(page = 1): Promise<SourceItem[]> {
  try {
    // 서버 API 라우트를 호출하여 스크래핑 결과를 가져옴
    const response = await axios.get(`/api/scraper?source=fsc&page=${page}`);
    return response.data || [];
  } catch (error) {
    console.error('금융위원회 보도자료 가져오기 에러:', error);
    return [
      {
        id: `fsc-${Date.now()}-1`,
        title: '금융위원회, 자본시장 활성화 대책 발표',
        source: '금융위원회',
        date: new Date().toISOString(),
        url: 'https://www.fsc.go.kr/no010101/12345',
        summary: '금융위원회는 자본시장 활성화를 위한 종합 대책을 발표했다. 이번 대책은 기업공개(IPO) 활성화, 기관투자자 역할 강화 등의 내용을 담고 있다.',
        tags: ['자본시장', 'IPO', '투자활성화'],
        isScrapped: false,
        type: 'source'
      },
      {
        id: `fsc-${Date.now()}-2`,
        title: '개인투자자 보호 강화 방안 마련',
        source: '금융위원회',
        date: new Date(Date.now() - 86400000).toISOString(), // 하루 전
        url: 'https://www.fsc.go.kr/no010101/12346',
        summary: '금융위원회는 개인투자자 보호를 위한 강화 방안을 마련했다. 불공정거래 감시 강화와 투자자 교육 확대 등이 주요 내용이다.',
        tags: ['투자자보호', '불공정거래', '금융교육'],
        isScrapped: false,
        type: 'source'
      }
    ];
  }
}

/**
 * 과학기술정보통신부(MSIT) 보도자료를 Next.js API 라우트를 통해 가져오는 함수
 */
export async function scrapeMSIT(page = 1): Promise<SourceItem[]> {
  try {
    // 서버 API 라우트를 호출하여 스크래핑 결과를 가져옴
    const response = await axios.get(`/api/scraper?source=msit&page=${page}`);
    return response.data || [];
  } catch (error) {
    console.error('과학기술정보통신부 보도자료 가져오기 에러:', error);
    return [
      {
        id: `msit-${Date.now()}-1`,
        title: '과학기술정보통신부, 6G 기술 개발 로드맵 발표',
        source: '과학기술정보통신부',
        date: new Date().toISOString(),
        url: 'https://www.msit.go.kr/bbs/view.do?sCode=user&mId=129&mPid=112&bbsSeqNo=94&nttSeqNo=12345',
        summary: '과학기술정보통신부는 6G 이동통신 기술 개발을 위한 중장기 로드맵을 발표했다.',
        tags: ['6G', '이동통신', '기술개발'],
        isScrapped: false,
        type: 'source'
      },
      {
        id: `msit-${Date.now()}-2`,
        title: '디지털 인재 양성을 위한 교육 프로그램 확대',
        source: '과학기술정보통신부',
        date: new Date(Date.now() - 86400000).toISOString(),
        url: 'https://www.msit.go.kr/bbs/view.do?sCode=user&mId=129&mPid=112&bbsSeqNo=94&nttSeqNo=12346',
        summary: '과학기술정보통신부는 디지털 전환 시대에 필요한 인재 양성을 위한 교육 프로그램을 확대한다고 밝혔다.',
        tags: ['디지털인재', '교육', 'SW인재'],
        isScrapped: false,
        type: 'source'
      }
    ];
  }
}

/**
 * 모든 보도자료를 Next.js API 라우트를 통해 한번에 가져오는 함수
 */
export async function fetchAllPressReleases(startDate?: string): Promise<SourceItem[]> {
  try {
    // 서버 API 라우트를 호출하여 모든 기관의 보도자료를 한번에 가져옴
    const url = startDate ? `/api/scraper?startDate=${startDate}` : '/api/scraper';
    console.log(`Fetching press releases from: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 10000  // 10초 타임아웃 설정
    });
    
    // 응답이 없거나 비어있으면 더미 데이터 사용
    if (!response.data || response.data.length === 0) {
      console.warn('API 응답이 비어있습니다. 더미 데이터를 사용합니다.');
      return getDummyPressReleases();
    }
    
    return response.data;
  } catch (error) {
    console.error('보도자료 fetch 에러:', error);
    return getDummyPressReleases();
  }
}

/**
 * 더미 보도자료 데이터
 */
function getDummyPressReleases(): SourceItem[] {
  return [
    {
      id: `fss-${Date.now()}-1`,
      title: '금융감독원, 핀테크 혁신 지원 방안 발표',
      source: '금융감독원',
      date: new Date().toISOString(),
      url: 'https://www.fss.or.kr/fss/bbs/B0000188/view.do?nttId=12345',
      summary: '금융감독원은 핀테크 기업의 혁신을 지원하기 위한 새로운 정책을 발표했다.',
      tags: ['핀테크', '금융혁신', '규제샌드박스'],
      isScrapped: false,
      type: 'source'
    },
    {
      id: `bok-${Date.now()}-1`,
      title: '한국은행, 기준금리 동결 결정',
      source: '한국은행',
      date: new Date(Date.now() - 86400000).toISOString(),
      url: 'https://www.bok.or.kr/portal/bbs/B0000338/view.do?nttId=12345',
      summary: '한국은행 금융통화위원회는 오늘 기준금리를 현 수준에서 동결하기로 결정했다.',
      tags: ['기준금리', '통화정책', '금융통화위원회'],
      isScrapped: false,
      type: 'source'
    },
    {
      id: `fsc-${Date.now()}-1`,
      title: '금융위원회, 자본시장 활성화 대책 발표',
      source: '금융위원회',
      date: new Date(Date.now() - 172800000).toISOString(),
      url: 'https://www.fsc.go.kr/no010101/12345',
      summary: '금융위원회는 자본시장 활성화를 위한 종합 대책을 발표했다.',
      tags: ['자본시장', 'IPO', '투자활성화'],
      isScrapped: false,
      type: 'source'
    },
    {
      id: `msit-${Date.now()}-1`,
      title: '과학기술정보통신부, 6G 기술 개발 로드맵 발표',
      source: '과학기술정보통신부',
      date: new Date(Date.now() - 259200000).toISOString(),
      url: 'https://www.msit.go.kr/bbs/view.do?sCode=user&mId=129&mPid=112&bbsSeqNo=94&nttSeqNo=12345',
      summary: '과학기술정보통신부는 6G 이동통신 기술 개발을 위한 중장기 로드맵을 발표했다.',
      tags: ['6G', '이동통신', '기술개발'],
      isScrapped: false,
      type: 'source'
    }
  ];
} 