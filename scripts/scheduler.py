"""
크롤링 스케줄러

APScheduler를 사용하여 1시간 간격으로 보도자료 및 뉴스 크롤링 작업을 스케줄링합니다.
"""

import os
import sys
import logging
import json
from datetime import datetime, timedelta
from pathlib import Path
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

# 상위 경로 추가하여 모듈 임포트 가능하게 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from crawlers.config import LOG_DIR, DATA_DIR, save_data
from crawlers.press_crawler import fetch_all_press_releases
from crawlers.news_crawler import fetch_all_news

# 디렉토리 생성
os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# 로깅 설정
log_file = LOG_DIR / f"scheduler_{datetime.now().strftime('%Y%m%d')}.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('scheduler')


def crawl_press_releases():
    """보도자료 크롤링 작업"""
    logger.info("보도자료 크롤링 작업 시작")
    try:
        start_time = datetime.now()
        
        # 보도자료 수집 (최대 2페이지)
        results = fetch_all_press_releases(max_pages=2)
        
        # 결과 저장
        if results:
            filename = f"press_releases_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
            saved_path = save_data([item.to_dict() for item in results], filename)
            
            # API 데이터 업데이트를 위한 최신 파일 생성
            latest_path = DATA_DIR / "latest_press_releases.json"
            with open(latest_path, 'w', encoding='utf-8') as f:
                json.dump([item.to_dict() for item in results], f, ensure_ascii=False, indent=2)
                
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            logger.info(f"보도자료 크롤링 완료: {saved_path} ({len(results)}개 항목, 소요시간: {duration:.2f}초)")
        else:
            logger.warning("수집된 보도자료가 없습니다.")
    except Exception as e:
        logger.error(f"보도자료 크롤링 작업 오류: {str(e)}", exc_info=True)


def crawl_news():
    """뉴스 크롤링 작업"""
    logger.info("뉴스 크롤링 작업 시작")
    try:
        start_time = datetime.now()
        
        # 키워드별 뉴스 수집 (키워드당 최대 5개)
        results = fetch_all_news(max_items_per_source=5)
        
        # 결과 저장
        if results:
            filename = f"news_items_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
            saved_path = save_data([item.to_dict() for item in results], filename)
            
            # API 데이터 업데이트를 위한 최신 파일 생성
            latest_path = DATA_DIR / "latest_news_items.json"
            with open(latest_path, 'w', encoding='utf-8') as f:
                json.dump([item.to_dict() for item in results], f, ensure_ascii=False, indent=2)
                
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            logger.info(f"뉴스 크롤링 완료: {saved_path} ({len(results)}개 항목, 소요시간: {duration:.2f}초)")
        else:
            logger.warning("수집된 뉴스가 없습니다.")
    except Exception as e:
        logger.error(f"뉴스 크롤링 작업 오류: {str(e)}", exc_info=True)


def setup_scheduler():
    """스케줄러 설정"""
    logger.info("크롤링 스케줄러 설정 시작")
    scheduler = BlockingScheduler()
    
    # 보도자료 크롤링 작업 (매시 10분에 실행)
    scheduler.add_job(
        crawl_press_releases,
        CronTrigger(minute=10),
        id='press_releases_job',
        name='보도자료 크롤링',
        max_instances=1,
        replace_existing=True
    )
    
    # 뉴스 크롤링 작업 (매시 40분에 실행)
    scheduler.add_job(
        crawl_news,
        CronTrigger(minute=40),
        id='news_job',
        name='뉴스 크롤링',
        max_instances=1,
        replace_existing=True
    )
    
    # 또는 1시간 간격으로 설정할 수도 있음
    # scheduler.add_job(
    #     crawl_press_releases,
    #     IntervalTrigger(hours=1),
    #     id='press_releases_job',
    #     name='보도자료 크롤링',
    #     max_instances=1,
    #     replace_existing=True
    # )
    
    # scheduler.add_job(
    #     crawl_news,
    #     IntervalTrigger(hours=1),
    #     id='news_job',
    #     name='뉴스 크롤링', 
    #     max_instances=1,
    #     replace_existing=True
    # )
    
    logger.info("크롤링 스케줄러 설정 완료")
    return scheduler


if __name__ == "__main__":
    logger.info("===== 크롤링 스케줄러 시작 =====")
    
    # 시작 시 바로 한 번 실행
    logger.info("초기 크롤링 시작")
    crawl_press_releases()
    crawl_news()
    logger.info("초기 크롤링 완료")
    
    # 스케줄러 설정 및 시작
    scheduler = setup_scheduler()
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("스케줄러 종료")
    except Exception as e:
        logger.error(f"스케줄러 오류: {str(e)}", exc_info=True) 