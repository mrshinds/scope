"""
데이터 모델 정의
TypeScript 타입과 일치하는 Python 클래스 정의
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import List, Optional


@dataclass
class SourceItem:
    """보도자료 아이템 모델"""
    id: str
    title: str
    source: str
    date: str
    url: str
    summary: str
    tags: List[str] = field(default_factory=list)
    isScrapped: bool = False
    type: str = "source"
    organization: Optional[str] = None
    memo: Optional[str] = None

    def to_dict(self):
        """모델을 딕셔너리로 변환"""
        return asdict(self)


@dataclass
class NewsItem:
    """뉴스 아이템 모델"""
    id: str
    title: str
    source: str
    date: str
    url: str
    summary: str
    publisher: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)
    isScrapped: bool = False
    type: str = "news"
    imageUrl: Optional[str] = None

    def to_dict(self):
        """모델을 딕셔너리로 변환"""
        return asdict(self)


# 날짜 처리 및 ID 생성 유틸리티 함수
def parse_date(date_str: str) -> str:
    """다양한 형식의 날짜 문자열을 ISO 형식으로 변환"""
    formats = [
        "%Y-%m-%d",
        "%Y.%m.%d",
        "%Y/%m/%d",
        "%Y년 %m월 %d일",
        "%Y-%m-%d %H:%M:%S",
        "%Y.%m.%d %H:%M:%S",
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            return dt.isoformat()
        except ValueError:
            continue
    
    # 모든 형식이 실패하면 현재 시간 반환
    return datetime.now().isoformat()


def generate_id(source: str, date_str: str, counter: int = 0) -> str:
    """고유 ID 생성"""
    date_part = date_str.split('T')[0] if 'T' in date_str else date_str
    date_part = date_part.replace('-', '')
    return f"{source.lower()}-{date_part}-{counter}" 