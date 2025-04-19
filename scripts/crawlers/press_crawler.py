"""
금융위, 금감원, 한국은행, 과학기술정보통신부 보도자료 크롤러

requests와 BeautifulSoup4를 사용하여 각 기관의 보도자료를 수집합니다.
"""

import os
import sys
import logging
import requests
import traceback
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Dict, Any, Optional

# 상위 경로 추가하여 모듈 임포트 가능하게 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from crawlers.config import URLS, DEFAULT_HEADERS, TIMEOUT, START_DATE, save_data, LOG_DIR
from crawlers.models import SourceItem, parse_date, generate_id

# 로깅 설정
log_file = LOG_DIR / f"press_crawler_{datetime.now().strftime('%Y%m%d')}.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('press_crawler')


def scrape_fsc(page: int = 1) -> List[SourceItem]:
    """금융위원회 보도자료 스크래핑"""
    logger.info(f"금융위원회 보도자료 스크래핑 시작 (페이지: {page})")
    items = []
    
    try:
        url = URLS['fsc']['list'].format(page=page)
        response = requests.get(url, headers=DEFAULT_HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        rows = soup.select('.boardList tbody tr')
        
        for idx, row in enumerate(rows):
            try:
                # 공지사항 제외
                notice_tag = row.select_one('.important, .notice')
                if notice_tag:
                    continue
                
                # 제목 및 URL 추출
                title_element = row.select_one('.title a')
                if not title_element:
                    continue
                    
                title = title_element.text.strip()
                if not title:
                    continue
                
                href = title_element.get('href')
                if not href:
                    continue
                    
                detail_url = f"{URLS['fsc']['base']}{href}"
                
                # 날짜 추출
                date_cell = row.select_one('td.date, td:nth-child(5)')
                if not date_cell:
                    continue
                    
                date_text = date_cell.text.strip()
                date_iso = parse_date(date_text)
                
                # 날짜 필터링
                if datetime.fromisoformat(date_iso.replace('Z', '+00:00')) < START_DATE:
                    continue
                
                # ID 생성
                item_id = generate_id('fsc', date_iso, idx)
                
                # 아이템 생성
                item = SourceItem(
                    id=item_id,
                    title=title,
                    source='금융위원회',
                    organization='금융위원회',
                    date=date_iso,
                    url=detail_url,
                    summary=f"{title} - 금융위원회 보도자료",
                    tags=['금융위원회', '보도자료']
                )
                
                items.append(item)
                
            except Exception as e:
                logger.error(f"금융위원회 아이템 파싱 오류: {str(e)}")
                traceback.print_exc()
                continue
        
        logger.info(f"금융위원회 보도자료 스크래핑 완료: {len(items)}개 항목")
        return items
        
    except Exception as e:
        logger.error(f"금융위원회 보도자료 스크래핑 오류: {str(e)}")
        traceback.print_exc()
        return []


def scrape_fss(page: int = 1) -> List[SourceItem]:
    """금융감독원 보도자료 스크래핑"""
    logger.info(f"금융감독원 보도자료 스크래핑 시작 (페이지: {page})")
    items = []
    
    try:
        url = URLS['fss']['list'].format(page=page)
        response = requests.get(url, headers=DEFAULT_HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        rows = soup.select('.boardList tbody tr')
        
        for idx, row in enumerate(rows):
            try:
                # 공지사항 제외
                notice_tag = row.select_one('.noticeTag')
                if notice_tag:
                    continue
                
                # 제목 및 URL 추출
                title_element = row.select_one('.title a')
                if not title_element:
                    continue
                    
                title = title_element.text.strip()
                if not title:
                    continue
                
                href = title_element.get('href')
                if not href:
                    continue
                    
                detail_url = f"{URLS['fss']['base']}{href}"
                
                # ID 추출
                id_match = href.split('nttId=')
                id_suffix = id_match[1].split('&')[0] if len(id_match) > 1 else str(idx)
                
                # 날짜 추출
                date_cell = row.select_one('td:nth-child(5)')
                if not date_cell:
                    continue
                    
                date_text = date_cell.text.strip()
                date_iso = parse_date(date_text)
                
                # 날짜 필터링
                if datetime.fromisoformat(date_iso.replace('Z', '+00:00')) < START_DATE:
                    continue
                
                # ID 생성
                item_id = generate_id('fss', date_iso, id_suffix)
                
                # 아이템 생성
                item = SourceItem(
                    id=item_id,
                    title=title,
                    source='금융감독원',
                    organization='금융감독원',
                    date=date_iso,
                    url=detail_url,
                    summary=f"{title} - 금융감독원 보도자료",
                    tags=['금융감독원', '보도자료']
                )
                
                items.append(item)
                
            except Exception as e:
                logger.error(f"금융감독원 아이템 파싱 오류: {str(e)}")
                traceback.print_exc()
                continue
        
        logger.info(f"금융감독원 보도자료 스크래핑 완료: {len(items)}개 항목")
        return items
        
    except Exception as e:
        logger.error(f"금융감독원 보도자료 스크래핑 오류: {str(e)}")
        traceback.print_exc()
        return []


def scrape_bok(page: int = 1) -> List[SourceItem]:
    """한국은행 보도자료 스크래핑"""
    logger.info(f"한국은행 보도자료 스크래핑 시작 (페이지: {page})")
    items = []
    
    try:
        url = URLS['bok']['list'].format(page=page)
        response = requests.get(url, headers=DEFAULT_HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        rows = soup.select('.bbs-list table tbody tr')
        
        for idx, row in enumerate(rows):
            try:
                # 공지사항 제외
                notice_tag = row.select_one('.noti')
                if notice_tag:
                    continue
                
                # 제목 및 URL 추출
                title_element = row.select_one('.bbs-subj a')
                if not title_element:
                    continue
                    
                title = title_element.text.strip()
                if not title:
                    continue
                
                href = title_element.get('href')
                if not href:
                    continue
                    
                detail_url = f"{URLS['bok']['base']}{href}"
                
                # ID 추출
                id_match = href.split('nttId=')
                id_suffix = id_match[1].split('&')[0] if len(id_match) > 1 else str(idx)
                
                # 날짜 추출
                date_cell = row.select_one('.bbs-date')
                if not date_cell:
                    continue
                    
                date_text = date_cell.text.strip()
                date_iso = parse_date(date_text)
                
                # 날짜 필터링
                if datetime.fromisoformat(date_iso.replace('Z', '+00:00')) < START_DATE:
                    continue
                
                # ID 생성
                item_id = generate_id('bok', date_iso, id_suffix)
                
                # 아이템 생성
                item = SourceItem(
                    id=item_id,
                    title=title,
                    source='한국은행',
                    organization='한국은행',
                    date=date_iso,
                    url=detail_url,
                    summary=f"{title} - 한국은행 보도자료",
                    tags=['한국은행', '보도자료']
                )
                
                items.append(item)
                
            except Exception as e:
                logger.error(f"한국은행 아이템 파싱 오류: {str(e)}")
                traceback.print_exc()
                continue
        
        logger.info(f"한국은행 보도자료 스크래핑 완료: {len(items)}개 항목")
        return items
        
    except Exception as e:
        logger.error(f"한국은행 보도자료 스크래핑 오류: {str(e)}")
        traceback.print_exc()
        return []


def scrape_msit(page: int = 1) -> List[SourceItem]:
    """과학기술정보통신부 보도자료 스크래핑"""
    logger.info(f"과학기술정보통신부 보도자료 스크래핑 시작 (페이지: {page})")
    items = []
    
    try:
        url = URLS['msit']['list'].format(page=page)
        response = requests.get(url, headers=DEFAULT_HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        rows = soup.select('.pblancList table tbody tr')
        
        for idx, row in enumerate(rows):
            try:
                # 공지사항 제외
                notice_tag = row.select_one('.noti, .notice')
                if notice_tag:
                    continue
                
                # 제목 및 URL 추출
                title_element = row.select_one('.subj a')
                if not title_element:
                    continue
                    
                title = title_element.text.strip()
                if not title:
                    continue
                
                href = title_element.get('href')
                if not href:
                    continue
                    
                detail_url = f"{URLS['msit']['base']}{href}"
                
                # ID 추출
                id_match = href.split('nttSeqNo=')
                id_suffix = id_match[1].split('&')[0] if len(id_match) > 1 else str(idx)
                
                # 날짜 추출
                date_cell = row.select_one('.date')
                if not date_cell:
                    continue
                    
                date_text = date_cell.text.strip()
                date_iso = parse_date(date_text)
                
                # 날짜 필터링
                if datetime.fromisoformat(date_iso.replace('Z', '+00:00')) < START_DATE:
                    continue
                
                # ID 생성
                item_id = generate_id('msit', date_iso, id_suffix)
                
                # 아이템 생성
                item = SourceItem(
                    id=item_id,
                    title=title,
                    source='과학기술정보통신부',
                    organization='과학기술정보통신부',
                    date=date_iso,
                    url=detail_url,
                    summary=f"{title} - 과학기술정보통신부 보도자료",
                    tags=['과학기술정보통신부', '보도자료', 'ICT']
                )
                
                items.append(item)
                
            except Exception as e:
                logger.error(f"과학기술정보통신부 아이템 파싱 오류: {str(e)}")
                traceback.print_exc()
                continue
        
        logger.info(f"과학기술정보통신부 보도자료 스크래핑 완료: {len(items)}개 항목")
        return items
        
    except Exception as e:
        logger.error(f"과학기술정보통신부 보도자료 스크래핑 오류: {str(e)}")
        traceback.print_exc()
        return []


def fetch_all_press_releases(max_pages: int = 3) -> List[SourceItem]:
    """모든 기관의 보도자료 수집"""
    logger.info(f"모든 기관 보도자료 스크래핑 시작 (최대 페이지: {max_pages})")
    all_items = []
    
    try:
        # 각 기관 첫 페이지부터 max_pages까지 스크래핑
        for page in range(1, max_pages + 1):
            fsc_items = scrape_fsc(page)
            fss_items = scrape_fss(page)
            bok_items = scrape_bok(page)
            msit_items = scrape_msit(page)
            
            all_items.extend(fsc_items)
            all_items.extend(fss_items)
            all_items.extend(bok_items)
            all_items.extend(msit_items)
        
        # 날짜 기준 내림차순 정렬
        all_items.sort(key=lambda x: x.date, reverse=True)
        
        logger.info(f"모든 기관 보도자료 스크래핑 완료: 총 {len(all_items)}개 항목")
        return all_items
        
    except Exception as e:
        logger.error(f"모든 기관 보도자료 스크래핑 오류: {str(e)}")
        traceback.print_exc()
        return []


if __name__ == "__main__":
    # 직접 실행 시 테스트
    results = fetch_all_press_releases(max_pages=1)
    
    # 결과 저장
    if results:
        filename = f"press_releases_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        saved_path = save_data([item.to_dict() for item in results], filename)
        logger.info(f"보도자료 저장 완료: {saved_path} ({len(results)}개 항목)")
    else:
        logger.warning("저장할 보도자료가 없습니다.") 