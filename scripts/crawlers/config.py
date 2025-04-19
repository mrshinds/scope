"""
크롤러 설정 파일
URL, 헤더, 타임아웃 등 공통 설정 정의
"""

import os
import json
from datetime import datetime, timedelta
from pathlib import Path

# 기본 경로 설정
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
LOG_DIR = BASE_DIR / "logs"

# 디렉토리가 없으면 생성
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)

# 검색 시작 날짜 설정 (기본: 3개월 전)
START_DATE = datetime.now() - timedelta(days=90)

# 기본 헤더 설정
DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
}

# 타임아웃 설정
TIMEOUT = 30  # 초

# URL 설정
URLS = {
    'fsc': {
        'base': 'https://www.fsc.go.kr',
        'list': 'https://www.fsc.go.kr/no010101?curPage={page}'
    },
    'fss': {
        'base': 'https://www.fss.or.kr',
        'list': 'https://www.fss.or.kr/fss/bbs/B0000188/list.do?menuNo=200218&bbsId=B0000188&pageIndex={page}'
    },
    'bok': {
        'base': 'https://www.bok.or.kr',
        'list': 'https://www.bok.or.kr/portal/bbs/B0000338/list.do?menuNo=200761&pageIndex={page}'
    },
    'msit': {
        'base': 'https://www.msit.go.kr',
        'list': 'https://www.msit.go.kr/bbs/list.do?sCode=user&mId=129&mPid=112&bbsSeqNo=94&pageIndex={page}'
    }
}

# 뉴스 검색 키워드 설정
NEWS_KEYWORDS = [
    '신한은행',
    '보이스피싱',
    '디지털금융',
    '금융소비자보호',
    '장애인 금융',
    '금융 사기'
]

# 데이터 저장 함수
def save_data(data, filename):
    """데이터를 JSON 파일로 저장"""
    filepath = DATA_DIR / filename
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return filepath 