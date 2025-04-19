"""
네이버 뉴스 및 구글 뉴스 크롤러

Selenium을 사용하여 네이버 뉴스와 구글 뉴스에서 관련 기사를 수집합니다.
"""

import os
import sys
import time
import logging
import traceback
import re
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

# 상위 경로 추가하여 모듈 임포트 가능하게 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from crawlers.config import NEWS_KEYWORDS, DEFAULT_HEADERS, TIMEOUT, save_data, LOG_DIR
from crawlers.models import NewsItem, parse_date, generate_id

# 로깅 설정
log_file = LOG_DIR / f"news_crawler_{datetime.now().strftime('%Y%m%d')}.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('news_crawler')


def setup_driver():
    """셀레니움 웹드라이버 설정"""
    try:
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument(f"user-agent={DEFAULT_HEADERS['User-Agent']}")
        
        # 언어 설정
        chrome_options.add_argument("--lang=ko-KR")
        
        # 로깅 레벨 설정
        chrome_options.add_argument("--log-level=3")
        
        # ChromeDriverManager를 사용하여 최신 드라이버 자동 설치
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # 페이지 로드 타임아웃 설정
        driver.set_page_load_timeout(TIMEOUT)
        
        logger.info("셀레니움 웹드라이버 설정 완료")
        return driver
        
    except Exception as e:
        logger.error(f"셀레니움 웹드라이버 설정 오류: {str(e)}")
        traceback.print_exc()
        return None


def scrape_naver_news(keyword: str, page: int = 1, max_items: int = 10) -> List[NewsItem]:
    """네이버 뉴스 스크래핑"""
    logger.info(f"네이버 뉴스 스크래핑 시작 (키워드: {keyword}, 페이지: {page})")
    items = []
    driver = None
    
    try:
        driver = setup_driver()
        if not driver:
            return []
            
        # 검색어 인코딩 및 URL 생성
        encoded_keyword = keyword.replace(' ', '+')
        start_index = (page - 1) * 10 + 1
        url = f"https://search.naver.com/search.naver?where=news&query={encoded_keyword}&start={start_index}"
        
        logger.info(f"네이버 뉴스 URL: {url}")
        driver.get(url)
        
        # 페이지 로딩 대기
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".list_news"))
        )
        
        # 추가 로딩을 위해 스크롤
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        
        # HTML 파싱
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        news_items = soup.select(".list_news .bx")
        
        counter = 0
        for idx, item in enumerate(news_items):
            if counter >= max_items:
                break
                
            try:
                # 광고 또는 파워링크 제외
                if item.select_one(".link_ad"):
                    continue
                
                # 제목 및 URL 추출
                title_element = item.select_one(".news_tit")
                if not title_element:
                    continue
                    
                title = title_element.text.strip()
                url = title_element.get('href')
                if not title or not url:
                    continue
                
                # 언론사 추출
                publisher_element = item.select_one(".info.press")
                publisher = publisher_element.text.strip() if publisher_element else "네이버 뉴스"
                
                # 요약 추출
                summary_element = item.select_one(".dsc_txt")
                summary = summary_element.text.strip() if summary_element else ""
                
                # 이미지 URL 추출
                img_element = item.select_one("img.thumb")
                image_url = img_element.get('src') if img_element else None
                
                # 시간 추출 (네이버는 주로 "X일 전", "X시간 전" 형식)
                time_element = item.select_one(".info.time")
                date_text = time_element.text.strip() if time_element else ""
                
                # 현재 날짜로 설정 (실제로는 상대 시간을 계산해야 함)
                current_time = datetime.now()
                
                # 상대 시간을 계산
                if "분 전" in date_text:
                    minutes = int(re.search(r'(\d+)분 전', date_text).group(1))
                    date_iso = (current_time - timedelta(minutes=minutes)).isoformat()
                elif "시간 전" in date_text:
                    hours = int(re.search(r'(\d+)시간 전', date_text).group(1))
                    date_iso = (current_time - timedelta(hours=hours)).isoformat()
                elif "일 전" in date_text:
                    days = int(re.search(r'(\d+)일 전', date_text).group(1))
                    date_iso = (current_time - timedelta(days=days)).isoformat()
                else:
                    # 날짜 형식을 파싱할 수 없으면 현재 시간 사용
                    date_iso = current_time.isoformat()
                
                # 키워드 추출 (제목에서 주요 단어)
                keywords = [keyword]
                title_words = title.split()
                for word in title_words:
                    if len(word) > 1 and word not in keywords and len(keywords) < 5:
                        keywords.append(word)
                
                # 태그 생성
                tags = keywords[:3]
                
                # ID 생성
                item_id = generate_id('naver', date_iso, idx)
                
                # 아이템 생성
                news_item = NewsItem(
                    id=item_id,
                    title=title,
                    source='네이버 뉴스',
                    publisher=publisher,
                    date=date_iso,
                    url=url,
                    summary=summary,
                    tags=tags,
                    keywords=keywords,
                    isScrapped=False,
                    imageUrl=image_url
                )
                
                items.append(news_item)
                counter += 1
                
            except Exception as e:
                logger.error(f"네이버 뉴스 아이템 파싱 오류: {str(e)}")
                traceback.print_exc()
                continue
        
        logger.info(f"네이버 뉴스 스크래핑 완료: {len(items)}개 항목")
        return items
        
    except Exception as e:
        logger.error(f"네이버 뉴스 스크래핑 오류: {str(e)}")
        traceback.print_exc()
        return []
        
    finally:
        if driver:
            driver.quit()


def scrape_google_news(keyword: str, page: int = 1, max_items: int = 10) -> List[NewsItem]:
    """구글 뉴스 스크래핑"""
    logger.info(f"구글 뉴스 스크래핑 시작 (키워드: {keyword}, 페이지: {page})")
    items = []
    driver = None
    
    try:
        driver = setup_driver()
        if not driver:
            return []
            
        # 검색어 인코딩 및 URL 생성
        encoded_keyword = keyword.replace(' ', '+')
        url = f"https://news.google.com/search?q={encoded_keyword}&hl=ko&gl=KR&ceid=KR:ko"
        
        logger.info(f"구글 뉴스 URL: {url}")
        driver.get(url)
        
        # 페이지 로딩 대기
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "article"))
        )
        
        # 페이지 스크롤을 위한 로직
        # 첫 페이지는 기본적으로 로드되므로 2페이지부터는 스크롤이 필요
        if page > 1:
            for _ in range(page - 1):
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)  # 스크롤 후 로딩 대기
        
        # HTML 파싱
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        news_items = soup.select("article")
        
        counter = 0
        for idx, item in enumerate(news_items):
            if counter >= max_items:
                break
                
            try:
                # 제목 및 URL 추출
                title_element = item.select_one("h3 a")
                if not title_element:
                    continue
                    
                title = title_element.text.strip()
                href = title_element.get('href')
                if not title or not href:
                    continue
                
                # 구글 뉴스의 URL은 상대 경로이므로 절대 경로로 변환
                if href.startswith('./'):
                    url = f"https://news.google.com{href[1:]}"
                else:
                    url = f"https://news.google.com{href}"
                
                # 언론사 추출
                publisher_element = item.select_one("div[data-n-tid] a")
                publisher = publisher_element.text.strip() if publisher_element else "구글 뉴스"
                
                # 시간 추출
                time_element = item.select_one("div[data-n-tid] time")
                date_text = time_element.get('datetime') if time_element else ""
                
                if date_text:
                    date_iso = date_text
                else:
                    date_iso = datetime.now().isoformat()
                
                # 요약은 구글 뉴스에서 제공되지 않음
                summary = f"{title} - {publisher}"
                
                # 이미지 URL 추출
                img_element = item.select_one("img[src^='https']")
                image_url = img_element.get('src') if img_element else None
                
                # 키워드 추출
                keywords = [keyword]
                title_words = title.split()
                for word in title_words:
                    if len(word) > 1 and word not in keywords and len(keywords) < 5:
                        keywords.append(word)
                
                # 태그 생성
                tags = keywords[:3]
                
                # ID 생성
                item_id = generate_id('google', date_iso, idx)
                
                # 아이템 생성
                news_item = NewsItem(
                    id=item_id,
                    title=title,
                    source='구글 뉴스',
                    publisher=publisher,
                    date=date_iso,
                    url=url,
                    summary=summary,
                    tags=tags,
                    keywords=keywords,
                    isScrapped=False,
                    imageUrl=image_url
                )
                
                items.append(news_item)
                counter += 1
                
            except Exception as e:
                logger.error(f"구글 뉴스 아이템 파싱 오류: {str(e)}")
                traceback.print_exc()
                continue
        
        logger.info(f"구글 뉴스 스크래핑 완료: {len(items)}개 항목")
        return items
        
    except Exception as e:
        logger.error(f"구글 뉴스 스크래핑 오류: {str(e)}")
        traceback.print_exc()
        return []
        
    finally:
        if driver:
            driver.quit()


def fetch_all_news(max_items_per_source: int = 10) -> List[NewsItem]:
    """모든 키워드에 대해 뉴스 수집"""
    logger.info(f"모든 키워드 뉴스 스크래핑 시작 (키워드 수: {len(NEWS_KEYWORDS)})")
    all_items = []
    
    try:
        for keyword in NEWS_KEYWORDS:
            logger.info(f"키워드 '{keyword}' 뉴스 스크래핑 시작")
            
            # 네이버 뉴스 스크래핑
            naver_items = scrape_naver_news(keyword, page=1, max_items=max_items_per_source)
            all_items.extend(naver_items)
            
            # 구글 뉴스 스크래핑
            google_items = scrape_google_news(keyword, page=1, max_items=max_items_per_source)
            all_items.extend(google_items)
            
            logger.info(f"키워드 '{keyword}' 뉴스 스크래핑 완료: {len(naver_items) + len(google_items)}개 항목")
            
            # 중복 제거 (URL 기준)
            unique_urls = set()
            unique_items = []
            
            for item in all_items:
                if item.url not in unique_urls:
                    unique_urls.add(item.url)
                    unique_items.append(item)
            
            all_items = unique_items
        
        # 날짜 기준 내림차순 정렬
        all_items.sort(key=lambda x: x.date, reverse=True)
        
        logger.info(f"모든 키워드 뉴스 스크래핑 완료: 총 {len(all_items)}개 항목")
        return all_items
        
    except Exception as e:
        logger.error(f"모든 키워드 뉴스 스크래핑 오류: {str(e)}")
        traceback.print_exc()
        return []


if __name__ == "__main__":
    # 직접 실행 시 테스트
    results = fetch_all_news(max_items_per_source=5)
    
    # 결과 저장
    if results:
        filename = f"news_items_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        saved_path = save_data([item.to_dict() for item in results], filename)
        logger.info(f"뉴스 저장 완료: {saved_path} ({len(results)}개 항목)")
    else:
        logger.warning("저장할 뉴스가 없습니다.") 