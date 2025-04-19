-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기사 테이블
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  source_name VARCHAR(255),
  source_type VARCHAR(100),
  published_at TIMESTAMP WITH TIME ZONE,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 요약 테이블
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  summary TEXT,
  full_text TEXT,
  manual_summary TEXT,
  gpt_version VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 태그 테이블
CREATE TABLE IF NOT EXISTS tags (
  name VARCHAR(100) PRIMARY KEY,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기사-태그 연결 테이블
CREATE TABLE IF NOT EXISTS article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag VARCHAR(100) REFERENCES tags(name) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag)
);

-- 스크랩 테이블
CREATE TABLE IF NOT EXISTS scraps (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, article_id)
);

-- 사용자 관심 키워드 테이블
CREATE TABLE IF NOT EXISTS user_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  keyword VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, keyword)
);

-- 활동 로그 테이블
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인기 태그 조회 함수
CREATE OR REPLACE FUNCTION get_popular_tags(max_count INTEGER DEFAULT 20)
RETURNS TABLE (tag VARCHAR, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT at.tag, COUNT(*) as count
  FROM article_tags at
  GROUP BY at.tag
  ORDER BY count DESC
  LIMIT max_count;
END;
$$ LANGUAGE plpgsql; 