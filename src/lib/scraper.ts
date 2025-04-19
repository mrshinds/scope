import axios from 'axios';
import * as cheerio from 'cheerio';
import { SourceItem } from './types';

/**
 * 금융위원회 보도자료 스크래핑 함수
 */
export async function scrapeFSC(page: number = 1): Promise<SourceItem[]> {
  try {
    // 금융위원회 보도자료 URL
    const url = `https://www.fsc.go.kr/no010101?curPage=${page}`;
    
    console.log(`금융위원회 보도자료 스크래핑 시작: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const items: SourceItem[] = [];

    // 보도자료 목록 추출
    $('.boardList tbody tr').each((index, element) => {
      try {
        // 공지사항 제외 (중요 또는 공지 테그가 있는 행 건너뜀)
        const isNotice = $(element).find('.important, .notice').length > 0;
        if (isNotice) return;
        
        // 제목 추출
        const titleElement = $(element).find('.title a');
        if (!titleElement || !titleElement.length) return;
        
        const title = titleElement.text().trim();
        if (!title) return;
        
        // 상세 페이지 URL 추출
        const hrefAttr = titleElement.attr('href');
        if (!hrefAttr) return;
        
        // URL에서 고유 번호 추출
        let idSuffix = index.toString();
        const idMatch = hrefAttr.match(/bbsId=(\d+)/);
        if (idMatch) {
          idSuffix = idMatch[1];
        }
        
        // 상세 페이지 URL 생성
        const link = `https://www.fsc.go.kr${hrefAttr}`;
        
        // 날짜 추출 - 게시일자 열에서 데이터 추출
        const dateCell = $(element).find('td.date, td:nth-child(5)');
        const dateText = dateCell.text().trim();
        if (!dateText) return;
        
        // 날짜 형식 정리 (YYYY-MM-DD 형식으로 변환)
        const dateMatch = dateText.match(/(\d{4})[\.\-](\d{1,2})[\.\-](\d{1,2})/);
        let formattedDate = dateText;
        
        if (dateMatch) {
          const [_, year, month, day] = dateMatch;
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // 고유 ID 생성
        const id = `fsc-${formattedDate}-${idSuffix}`;

        items.push({
          id,
          title,
          source: '금융위원회',
          organization: '금융위원회',
          date: formattedDate,
          url: link,
          summary: `${title} - 금융위원회 보도자료`,
          tags: ['금융위원회', '보도자료'],
          isScrapped: false,
          type: 'source'
        });
      } catch (itemError) {
        console.error('금융위원회 보도자료 항목 파싱 오류:', itemError);
      }
    });

    console.log(`금융위원회 보도자료 스크래핑 완료: ${items.length}개 항목 추출`);
    return items;
  } catch (error) {
    console.error('금융위원회 보도자료 스크래핑 오류:', error);
    return [];
  }
}

/**
 * 금융감독원 보도자료 스크래핑 함수
 */
export async function scrapeFSS(page: number = 1): Promise<SourceItem[]> {
  try {
    // 금융감독원 보도자료 URL
    const url = `https://www.fss.or.kr/fss/bbs/B0000188/list.do?menuNo=200218&bbsId=B0000188&pageIndex=${page}`;
    
    console.log(`금융감독원 보도자료 스크래핑 시작: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const items: SourceItem[] = [];

    // 보도자료 목록 추출
    $('.boardList tbody tr').each((index, element) => {
      try {
        // 제목 추출
        const titleElement = $(element).find('.title a');
        if (!titleElement || !titleElement.length) return;
        
        const title = titleElement.text().trim();
        if (!title) return;
        
        // 공지사항 제외
        const noticeTag = $(element).find('.noticeTag');
        if (noticeTag && noticeTag.length > 0) return;
        
        // 상세 페이지 URL 추출
        const hrefAttr = titleElement.attr('href');
        if (!hrefAttr) return;
        
        // URL에서 고유 번호 추출
        const idMatch = hrefAttr.match(/nttId=(\d+)/);
        const idSuffix = idMatch ? idMatch[1] : index.toString();
        
        // 상세 페이지 URL 생성
        const link = `https://www.fss.or.kr${hrefAttr}`;
        
        // 날짜 추출
        const dateText = $(element).find('td:nth-child(5)').text().trim();
        if (!dateText) return;
        
        // 날짜 형식 정리 (YYYY.MM.DD 형식을 YYYY-MM-DD 형식으로 변환)
        const dateMatch = dateText.match(/(\d{4})[\.\-](\d{1,2})[\.\-](\d{1,2})/);
        let formattedDate = dateText;
        
        if (dateMatch) {
          const [_, year, month, day] = dateMatch;
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // 고유 ID 생성
        const id = `fss-${formattedDate}-${idSuffix}`;

        items.push({
          id,
          title,
          source: '금융감독원',
          organization: '금융감독원',
          date: formattedDate,
          url: link,
          summary: `${title} - 금융감독원 보도자료`,
          tags: ['금융감독원', '보도자료'],
          isScrapped: false,
          type: 'source'
        });
      } catch (itemError) {
        console.error('금융감독원 보도자료 항목 파싱 오류:', itemError);
      }
    });

    console.log(`금융감독원 보도자료 스크래핑 완료: ${items.length}개 항목 추출`);
    return items;
  } catch (error) {
    console.error('금융감독원 보도자료 스크래핑 오류:', error);
    return [];
  }
}

/**
 * 한국은행 보도자료 스크래핑 함수
 */
export async function scrapeBOK(page: number = 1): Promise<SourceItem[]> {
  try {
    // 한국은행 보도자료 URL
    const url = `https://www.bok.or.kr/portal/bbs/B0000338/list.do?menuNo=200761&pageIndex=${page}`;
    
    console.log(`한국은행 보도자료 스크래핑 시작: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const items: SourceItem[] = [];

    // 보도자료 목록 추출
    $('.bbs-list table tbody tr').each((index, element) => {
      try {
        // 공지사항 제외 (공지사항 아이콘이 있는 행 건너뜀)
        const noticeIcon = $(element).find('.noti');
        if (noticeIcon && noticeIcon.length > 0) return;
        
        // 제목 추출
        const titleElement = $(element).find('.bbs-subj a');
        if (!titleElement || !titleElement.length) return;
        
        const title = titleElement.text().trim();
        if (!title) return;
        
        // 상세 페이지 URL 추출
        const hrefAttr = titleElement.attr('href');
        if (!hrefAttr) return;
        
        // URL에서 고유 번호 추출
        const idMatch = hrefAttr.match(/nttId=(\d+)/);
        const idSuffix = idMatch ? idMatch[1] : index.toString();
        
        // 상세 페이지 URL 생성
        const link = `https://www.bok.or.kr${hrefAttr}`;
        
        // 날짜 추출
        const dateText = $(element).find('.bbs-date').text().trim();
        if (!dateText) return;
        
        // 날짜 형식 정리 (YYYY.MM.DD 형식을 YYYY-MM-DD 형식으로 변환)
        const dateMatch = dateText.match(/(\d{4})[\.\-](\d{1,2})[\.\-](\d{1,2})/);
        let formattedDate = dateText;
        
        if (dateMatch) {
          const [_, year, month, day] = dateMatch;
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // 고유 ID 생성
        const id = `bok-${formattedDate}-${idSuffix}`;

        items.push({
          id,
          title,
          source: '한국은행',
          organization: '한국은행',
          date: formattedDate,
          url: link,
          summary: `${title} - 한국은행 보도자료`,
          tags: ['한국은행', '보도자료'],
          isScrapped: false,
          type: 'source'
        });
      } catch (itemError) {
        console.error('한국은행 보도자료 항목 파싱 오류:', itemError);
      }
    });

    console.log(`한국은행 보도자료 스크래핑 완료: ${items.length}개 항목 추출`);
    return items;
  } catch (error) {
    console.error('한국은행 보도자료 스크래핑 오류:', error);
    return [];
  }
}

/**
 * 모든 출처에서 보도자료를 가져오는 함수
 */
export async function fetchAllPressReleases(page = 1): Promise<SourceItem[]> {
  try {
    console.log('모든 기관 보도자료 스크래핑 시작');
    // Promise.all을 사용하여 병렬로 모든 출처에서 데이터 가져오기
    const [fssData, bokData, fscData, msitData] = await Promise.all([
      scrapeFSS(page),
      scrapeBOK(page),
      scrapeFSC(page),
      scrapeMSIT(page)
    ]);

    // 모든 데이터 결합
    const allData = [...fssData, ...bokData, ...fscData, ...msitData];

    // 날짜 기준으로 내림차순 정렬
    allData.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    console.log(`모든 기관 보도자료 스크래핑 완료: 총 ${allData.length}개 항목`);
    return allData;
  } catch (error) {
    console.error('보도자료 통합 스크래핑 오류:', error);
    return [];
  }
}

/**
 * 과학기술정보통신부 보도자료 스크래핑 함수
 */
export async function scrapeMSIT(page: number = 1): Promise<SourceItem[]> {
  try {
    // 과학기술정보통신부 보도자료 URL
    const url = `https://www.msit.go.kr/bbs/list.do?sCode=user&mId=129&mPid=112&bbsSeqNo=94&pageIndex=${page}`;
    
    console.log(`과학기술정보통신부 보도자료 스크래핑 시작: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const items: SourceItem[] = [];

    // 보도자료 목록 추출
    $('.pblancList table tbody tr').each((index, element) => {
      try {
        // 공지사항 제외 (공지아이콘이 있는 행은 건너뜀)
        const noticeTag = $(element).find('.noti, .notice');
        if (noticeTag && noticeTag.length > 0) return;
        
        // 제목 추출
        const titleElement = $(element).find('.subj a');
        if (!titleElement || !titleElement.length) return;
        
        const title = titleElement.text().trim();
        if (!title) return;
        
        // 상세 페이지 URL 추출
        const hrefAttr = titleElement.attr('href');
        if (!hrefAttr) return;
        
        // URL에서 고유 번호 추출
        const idMatch = hrefAttr.match(/nttSeqNo=(\d+)/);
        const idSuffix = idMatch ? idMatch[1] : index.toString();
        
        // 상세 페이지 URL 생성
        const link = `https://www.msit.go.kr${hrefAttr}`;
        
        // 날짜 추출
        const dateText = $(element).find('.date').text().trim();
        if (!dateText) return;
        
        // 날짜 형식 정리 (YYYY.MM.DD 형식을 YYYY-MM-DD 형식으로 변환)
        const dateMatch = dateText.match(/(\d{4})[\.\-](\d{1,2})[\.\-](\d{1,2})/);
        let formattedDate = dateText;
        
        if (dateMatch) {
          const [_, year, month, day] = dateMatch;
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // 고유 ID 생성
        const id = `msit-${formattedDate}-${idSuffix}`;

        items.push({
          id,
          title,
          source: '과학기술정보통신부',
          organization: '과학기술정보통신부',
          date: formattedDate,
          url: link,
          summary: `${title} - 과학기술정보통신부 보도자료`,
          tags: ['과학기술정보통신부', '보도자료', 'ICT'],
          isScrapped: false,
          type: 'source'
        });
      } catch (itemError) {
        console.error('과학기술정보통신부 보도자료 항목 파싱 오류:', itemError);
      }
    });

    console.log(`과학기술정보통신부 보도자료 스크래핑 완료: ${items.length}개 항목 추출`);
    return items;
  } catch (error) {
    console.error('과학기술정보통신부 보도자료 스크래핑 오류:', error);
    return [];
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