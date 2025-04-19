# Python 크롤러 및 스케줄러

신한은행 소비자보호부 내부 사용자용 정책 모니터링 플랫폼 'SCOPE'를 위한 Python 기반 크롤러 및 스케줄러입니다.

## 구성 요소

- `crawlers/config.py`: 크롤러 기본 설정 (URL, 헤더, 타임아웃 등)
- `crawlers/models.py`: 데이터 모델 정의 (SourceItem, NewsItem 등)
- `crawlers/press_crawler.py`: 금융위, 금감원, 한국은행, 과기정통부 보도자료 크롤러
- `crawlers/news_crawler.py`: 네이버 뉴스 및 구글 뉴스 크롤러 (Selenium 기반)
- `scheduler.py`: 1시간 간격으로 크롤링 작업을 실행하는 스케줄러

## 설치 방법

### 1. Python 가상환경 설정

```bash
# 가상환경 생성
python -m venv .venv

# 가상환경 활성화 (Windows)
.venv\Scripts\activate

# 가상환경 활성화 (macOS/Linux)
source .venv/bin/activate
```

### 2. 필요 패키지 설치

```bash
# requirements.txt 파일에서 의존성 설치
pip install -r requirements.txt
```

### 3. Chrome WebDriver 설치 (뉴스 크롤링용)

Selenium을 사용한 뉴스 크롤링을 위해 Chrome 브라우저가 필요합니다. WebDriver는 `webdriver-manager` 패키지가 자동으로 설치해 줍니다.

## 사용 방법

### 보도자료 크롤링 실행

```bash
# 보도자료 크롤러 직접 실행
python -m scripts.crawlers.press_crawler
```

### 뉴스 크롤링 실행

```bash
# 뉴스 크롤러 직접 실행
python -m scripts.crawlers.news_crawler
```

### 스케줄러 실행

```bash
# 스케줄러 실행 (1시간 간격으로 크롤링 작업 수행)
python -m scripts.scheduler
```

## 스케줄링 설정

`scheduler.py` 파일에서 크롤링 주기를 변경할 수 있습니다:

- 현재 설정: 매시 10분에 보도자료 크롤링, 매시 40분에 뉴스 크롤링
- 또는 `IntervalTrigger(hours=1)`를 사용하여 1시간 간격으로 설정 가능

## 데이터 저장

수집된 데이터는 다음 위치에 저장됩니다:

- 보도자료: `data/press_releases_YYYYMMDD_HHMM.json`
- 뉴스: `data/news_items_YYYYMMDD_HHMM.json`
- 최신 데이터: `data/latest_press_releases.json` 및 `data/latest_news_items.json`

## 로그 확인

로그 파일은 `logs/` 디렉토리에 저장됩니다:

- 보도자료 크롤러: `logs/press_crawler_YYYYMMDD.log`
- 뉴스 크롤러: `logs/news_crawler_YYYYMMDD.log`
- 스케줄러: `logs/scheduler_YYYYMMDD.log`

## 시스템 요구사항

- Python 3.8 이상
- Chrome 브라우저 (뉴스 크롤링용)
- 인터넷 연결

## 자동 실행 설정 (Linux/macOS)

crontab을 사용하여 스케줄러를 자동으로 실행할 수 있습니다:

```bash
# crontab 편집
crontab -e

# 아래 내용 추가 (매일 오전 9시에 스케줄러 시작)
0 9 * * * cd /path/to/scope && .venv/bin/python -m scripts.scheduler >> logs/cron.log 2>&1
```

## 자동 실행 설정 (Windows)

작업 스케줄러를 사용하여 스케줄러를 자동으로 실행할 수 있습니다:

1. 시작 메뉴에서 '작업 스케줄러' 실행
2. '기본 작업 만들기' 선택
3. 이름 및 설명 입력 (예: 'SCOPE 크롤러')
4. 트리거 설정 (예: '매일 오전 9시')
5. 동작 설정: '프로그램 시작'
6. 프로그램/스크립트: `C:\path\to\scope\.venv\Scripts\python.exe`
7. 인수 추가: `-m scripts.scheduler`
8. 시작 위치: `C:\path\to\scope` 