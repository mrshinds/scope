-- 스키마 초기화 (개발 환경에서만 사용, 프로덕션에서는 주의)
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;

-- 확장 프로그램 설치
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 텍스트 검색 기능 향상을 위한 확장

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'superadmin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 소스(출처) 테이블
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기사 테이블
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  source_id UUID REFERENCES sources(id),
  source_name TEXT NOT NULL, -- 소스 이름 (직접 저장)
  source_url TEXT UNIQUE NOT NULL, -- 원본 URL (중복 감지용)
  published_at TIMESTAMP WITH TIME ZONE,
  content TEXT,
  is_scraped BOOLEAN DEFAULT FALSE,
  has_attachment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 첨부파일 테이블
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 요약 테이블
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  original_summary TEXT, -- GPT가 생성한 원본 요약
  model_used TEXT, -- 어떤 모델로 요약했는지
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id) -- 한 기사당 하나의 요약만 가능
);

-- 태그 테이블
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기사-태그 연결 테이블 (다대다 관계)
CREATE TABLE IF NOT EXISTS article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (article_id, tag_id)
);

-- 사용자 저장 기사 테이블
CREATE TABLE IF NOT EXISTS user_saved_articles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, article_id)
);

-- 메모 테이블
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_articles_title ON articles USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_articles_content ON articles USING GIN (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_articles_source_url ON articles(source_url);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- 통계 및 분석을 위한 뷰
CREATE OR REPLACE VIEW article_stats AS
SELECT
  s.name AS source_name,
  COUNT(a.id) AS article_count,
  MIN(a.published_at) AS oldest_article,
  MAX(a.published_at) AS newest_article
FROM articles a
JOIN sources s ON a.source_id = s.id
GROUP BY s.name;

-- 태그 통계 뷰
CREATE OR REPLACE VIEW tag_stats AS
SELECT
  t.name AS tag_name,
  COUNT(at.article_id) AS usage_count,
  MAX(a.published_at) AS last_used
FROM tags t
LEFT JOIN article_tags at ON t.id = at.tag_id
LEFT JOIN articles a ON at.article_id = a.id
GROUP BY t.name
ORDER BY usage_count DESC;

-- 기간별 기사 수 통계 뷰
CREATE OR REPLACE VIEW article_time_stats AS
SELECT
  DATE_TRUNC('day', published_at) AS day,
  COUNT(*) AS article_count
FROM articles
WHERE published_at IS NOT NULL
GROUP BY DATE_TRUNC('day', published_at)
ORDER BY day DESC; 