import { SourceItem, NewsItem } from "./types";

// 오늘의 이슈 데이터
export const todayIssues: SourceItem[] = [
  {
    id: "1",
    title: "금융위, 자영업자 채무조정 금융권 협의 요청",
    source: "금융위원회",
    date: "2025-01-15",
    url: "https://www.fsc.go.kr/no010101",
    summary: "금융위원회는 자영업자 대상 채무조정 방안에 대해 금융권과 협의를 시작했습니다. 코로나19 이후 경영난을 겪는 자영업자를 위한 추가 지원책으로, 원금 상환 유예 및 금리 인하 방안을 논의 중입니다.",
    tags: ["채무조정", "자영업자", "금융지원"],
    isScrapped: false,
    type: "issue",
    organization: "금융위원회"
  },
  {
    id: "2",
    title: "금감원, 은행 대출 금리 산정방식 점검 결과 발표",
    source: "금융감독원",
    date: "2025-01-12",
    url: "https://www.fss.or.kr/fss/bbs/B0000188/list.do?menuNo=200218",
    summary: "금융감독원이 시중은행의 대출 금리 산정방식에 대한 특별 점검 결과를 발표했습니다. 일부 은행에서 가산금리 산정 과정의 불투명성과 과도한 이익 추구가 확인되어 시정 조치를 요구했습니다.",
    tags: ["대출금리", "금리산정", "은행감독"],
    isScrapped: true,
    type: "issue",
    organization: "금융감독원"
  },
  {
    id: "3",
    title: "한국은행, 기준금리 동결 결정",
    source: "한국은행",
    date: "2025-01-10",
    url: "https://www.bok.or.kr/portal/bbs/P0000559/list.do?menuNo=200690",
    summary: "한국은행 금융통화위원회는 현재 3.0%인 기준금리를 유지하기로 결정했습니다. 물가 상승세 둔화와 경기 회복 지연을 고려한 결정으로, 향후 경제 상황에 따라 금리 인하 가능성을 시사했습니다.",
    tags: ["기준금리", "통화정책", "인플레이션"],
    isScrapped: false,
    type: "issue",
    organization: "한국은행"
  }
];

// 금융위원회 보도자료
export const fscSources: SourceItem[] = [
  {
    id: "fsc1",
    title: "금융위, 핀테크 산업 육성 위한 규제 완화 방안 발표",
    source: "금융위원회",
    date: "2025-02-05",
    url: "https://www.fsc.go.kr/no010101",
    summary: "금융위원회는 핀테크 산업 활성화를 위한 규제 완화 방안을 발표했습니다. 디지털 금융혁신을 위한 규제 샌드박스 확대와 인허가 절차 간소화가 주요 내용입니다.",
    tags: ["핀테크", "규제완화", "금융혁신"],
    isScrapped: false,
    type: "source",
    organization: "금융위원회"
  },
  {
    id: "fsc2",
    title: "금융위, 금융소비자보호법 개정안 입법예고",
    source: "금융위원회",
    date: "2025-01-28",
    url: "https://www.fsc.go.kr/no010101",
    summary: "금융위원회는 금융소비자보호법 개정안을 입법예고했습니다. 금융상품 판매과정에서 소비자 권익 보호를 강화하고 불완전판매에 대한 제재를 강화하는 내용을 담고 있습니다.",
    tags: ["금융소비자보호", "법률개정", "불완전판매"],
    isScrapped: true,
    type: "source",
    organization: "금융위원회"
  },
  {
    id: "fsc3",
    title: "2025년 제1차 금융위원회 정례회의 개최",
    source: "금융위원회",
    date: "2025-01-18",
    url: "https://www.fsc.go.kr/no010101",
    summary: "금융위원회는 2025년 제1차 정례회의를 개최하여 금융시장 안정화 방안과 가계부채 관리방안을 논의했습니다. 서민금융 지원 확대 계획도 함께 발표되었습니다.",
    tags: ["금융정책", "가계부채", "서민금융"],
    isScrapped: false,
    type: "source",
    organization: "금융위원회"
  }
];

// 과학기술정보통신부 보도자료
export const msitSources: SourceItem[] = [
  {
    id: "msit1",
    title: "과기정통부, AI 기술 표준화 로드맵 발표",
    source: "과학기술정보통신부",
    date: "2025-02-04",
    url: "https://www.msit.go.kr/bbs/list.do?sCode=user&mId=129&mPid=112",
    summary: "과학기술정보통신부는 인공지능 기술의 국제 표준화를 위한 로드맵을 발표했습니다. 특히 금융분야에서의 AI 활용을 위한 표준화 작업이 강조되었습니다.",
    tags: ["인공지능", "표준화", "금융기술"],
    isScrapped: false,
    type: "source",
    organization: "과학기술정보통신부"
  },
  {
    id: "msit2",
    title: "디지털 트랜스포메이션 촉진 지원사업 공고",
    source: "과학기술정보통신부",
    date: "2025-01-30",
    url: "https://www.msit.go.kr/bbs/list.do?sCode=user&mId=129&mPid=112",
    summary: "과학기술정보통신부는 기업의 디지털 전환을 지원하기 위한 사업을 공고했습니다. 금융기관을 포함한 다양한 산업 분야의 디지털 혁신을 위한 기술 지원이 이루어질 예정입니다.",
    tags: ["디지털전환", "기술지원", "금융혁신"],
    isScrapped: false,
    type: "source",
    organization: "과학기술정보통신부"
  }
];

// 한국은행 보도자료
export const bokSources: SourceItem[] = [
  {
    id: "bok1",
    title: "한국은행, 디지털 화폐(CBDC) 시범사업 결과 발표",
    source: "한국은행",
    date: "2025-02-03",
    url: "https://www.bok.or.kr/portal/bbs/P0000559/list.do?menuNo=200690",
    summary: "한국은행은 중앙은행 디지털 화폐(CBDC) 시범사업의 1단계 결과를 발표했습니다. 기술적 가능성이 확인되었으며, 2단계 테스트를 준비 중입니다.",
    tags: ["CBDC", "디지털화폐", "결제시스템"],
    isScrapped: true,
    type: "source",
    organization: "한국은행"
  },
  {
    id: "bok2",
    title: "2024년 4분기 국내총생산(GDP) 발표",
    source: "한국은행",
    date: "2025-01-26",
    url: "https://www.bok.or.kr/portal/bbs/P0000559/list.do?menuNo=200690",
    summary: "한국은행은 2024년 4분기 실질 국내총생산(GDP)이 전기 대비 0.7% 성장했다고 발표했습니다. 수출 증가와 소비 회복이 주요 성장 요인으로 분석되었습니다.",
    tags: ["경제성장", "GDP", "경제지표"],
    isScrapped: false,
    type: "source",
    organization: "한국은행"
  }
];

// 인권위원회 보도자료
export const nhrcSources: SourceItem[] = [
  {
    id: "nhrc1",
    title: "인권위, 금융기관 정보접근성 개선 권고",
    source: "국가인권위원회",
    date: "2025-02-02",
    url: "https://www.humanrights.go.kr/site/program/board/basicboard/list?boardtypeid=24&menuid=001004002001",
    summary: "국가인권위원회는 금융기관들에게 장애인과 고령자의 금융서비스 정보접근성 개선을 권고했습니다. 특히 디지털 금융 서비스 이용 시 정보 격차 해소를 위한 대책 마련을 요구했습니다.",
    tags: ["정보접근성", "금융포용", "장애인권리"],
    isScrapped: false,
    type: "source",
    organization: "국가인권위원회"
  }
];

// 공정위 보도자료
export const ftcSources: SourceItem[] = [
  {
    id: "ftc1",
    title: "공정위, 금융약관 불공정 조항 시정 조치",
    source: "공정거래위원회",
    date: "2025-01-21",
    url: "https://www.ftc.go.kr/www/selectReportUserList.do?key=10&rpttype=1",
    summary: "공정거래위원회는 주요 시중은행의 대출약관 중 소비자에게 불리한 조항에 대해 시정 조치를 내렸습니다. 일방적인 금리 인상 조항과 과도한 위약금 조항이 주요 대상입니다.",
    tags: ["불공정약관", "소비자보호", "금융감독"],
    isScrapped: true,
    type: "source",
    organization: "공정거래위원회"
  },
  {
    id: "ftc2",
    title: "카드사 마케팅 관행 실태조사 결과 발표",
    source: "공정거래위원회",
    date: "2025-01-16",
    url: "https://www.ftc.go.kr/www/selectReportUserList.do?key=10&rpttype=1",
    summary: "공정거래위원회는 신용카드사들의 마케팅 관행에 대한 실태조사 결과를 발표했습니다. 일부 카드사의 부당한 경품 제공과 허위 광고에 대해 시정명령과 과징금을 부과했습니다.",
    tags: ["카드마케팅", "소비자오도", "불공정거래"],
    isScrapped: false,
    type: "source",
    organization: "공정거래위원회"
  }
];

// 전체 보도자료 통합
export const sources: SourceItem[] = [
  ...fscSources,
  ...msitSources,
  ...bokSources,
  ...nhrcSources,
  ...ftcSources
];

// 언론보도 데이터
export const newsItems: NewsItem[] = [
  {
    id: "news1",
    title: "신한은행, 고령자 대상 디지털 금융교육 확대",
    source: "경제신문",
    publisher: "매일경제",
    date: "2025-02-05",
    url: "https://www.mk.co.kr/news/",
    summary: "신한은행이 디지털 소외계층인 고령자를 대상으로 한 금융교육 프로그램을 확대한다. 전국 영업점과 노인복지센터를 통해 스마트폰 뱅킹 이용법 등을 교육할 예정이다.",
    tags: ["신한은행", "금융교육", "디지털포용"],
    isScrapped: false,
    type: "news",
    keywords: ["신한은행", "고령자", "금융교육"],
    imageUrl: "https://via.placeholder.com/150"
  },
  {
    id: "news2",
    title: "금융소비자보호법 시행 효과, 소비자 권익 향상됐나",
    source: "뉴스포털",
    publisher: "연합뉴스",
    date: "2025-01-28",
    url: "https://www.yna.co.kr/view/AKR20230412051600002",
    summary: "금융소비자보호법 시행 효과에 대한 분석 결과가 발표됐다. 불완전판매 감소 등 긍정적 효과가 있었으나, 복잡한 구제절차로 인한 소비자 불편이 여전히 과제로 남아있다.",
    tags: ["금융소비자보호법", "소비자권익", "금융감독"],
    isScrapped: true,
    type: "news",
    keywords: ["금융소비자보호법", "소비자보호", "금융정책"],
    imageUrl: "https://via.placeholder.com/150"
  },
  {
    id: "news3",
    title: "신한은행, 새로운 모바일뱅킹 서비스 출시",
    source: "IT뉴스",
    publisher: "전자신문",
    date: "2025-01-22",
    url: "https://www.etnews.com/",
    summary: "신한은행이 AI 기술을 활용한 새로운 모바일뱅킹 서비스를 출시했다. 개인 맞춤형 금융상품 추천과 간편한 자산관리 기능이 강화되었다.",
    tags: ["모바일뱅킹", "핀테크", "신한은행"],
    isScrapped: false,
    type: "news",
    keywords: ["신한은행", "모바일뱅킹", "AI"],
    imageUrl: "https://via.placeholder.com/150"
  },
  {
    id: "news4",
    title: "금융당국, 은행권 소비자보호 실태점검 실시",
    source: "경제방송",
    publisher: "한국경제TV",
    date: "2025-01-10",
    url: "https://www.wowtv.co.kr/NewsCenter/News/Read",
    summary: "금융감독원이 주요 은행을 대상으로 소비자보호 실태점검을 실시한다. 대출 상품 판매 과정과 민원처리 절차에 중점을 둔 이번 점검은 2월까지 진행될 예정이다.",
    tags: ["금융감독", "소비자보호", "은행점검"],
    isScrapped: true,
    type: "news",
    keywords: ["금융감독원", "소비자보호", "실태점검"],
    imageUrl: "https://via.placeholder.com/150"
  }
];

// 스크랩된 아이템
export const scrappedItems = [
  ...todayIssues.filter(item => item.isScrapped),
  ...sources.filter(item => item.isScrapped),
  ...newsItems.filter(item => item.isScrapped)
];

// 유저 활동 로그
export const activityLogs = [
  {
    id: "1",
    user: "user@shinhan.com",
    action: "로그인",
    timestamp: "2023-11-10T09:25:00Z"
  },
  {
    id: "2",
    user: "user@shinhan.com",
    action: "자료 스크랩: 금감원, 은행 대출 금리 산정방식 점검 결과 발표",
    timestamp: "2023-11-10T09:30:15Z"
  },
  {
    id: "3",
    user: "user@shinhan.com",
    action: "자료 검색: 금융소비자보호",
    timestamp: "2023-11-10T09:45:20Z"
  },
  {
    id: "4",
    user: "user@shinhan.com",
    action: "보고서 생성: 2023년 소비자보호 동향 분석",
    timestamp: "2023-11-10T10:15:45Z"
  },
  {
    id: "5",
    user: "user@shinhan.com",
    action: "로그아웃",
    timestamp: "2023-11-10T11:30:10Z"
  }
];

// 태그 트렌드 데이터
export const tagTrends = [
  { name: "소비자보호", count: 28 },
  { name: "금융혁신", count: 24 },
  { name: "디지털금융", count: 22 },
  { name: "금리정책", count: 18 },
  { name: "가계부채", count: 16 },
  { name: "핀테크", count: 15 },
  { name: "ESG경영", count: 14 },
  { name: "자금세탁방지", count: 12 },
  { name: "금융포용", count: 10 },
  { name: "금융교육", count: 9 }
]; 