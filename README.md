# SCOPE - 금융 정책/보도자료 모니터링 시스템

SCOPE는 금융 정책과 보도자료를 자동으로 수집하고, GPT-4를 활용해 요약하며, 관련 태그를 제공하는 모니터링 시스템입니다.

## 주요 기능

- 금융위원회, 금융감독원 등 금융당국의 정책 및 보도자료 자동 수집
- GPT-4를 활용한 자동 요약 및 태그 생성
- 태그 및 키워드 기반 검색 기능
- 관리자용 태그 및 요약 수정 기능
- 중요 정책 스크랩 기능

## 기술 스택

- **프론트엔드**: Next.js 14, TypeScript, TailwindCSS, Shadcn/UI
- **백엔드**: Next.js API Routes, Supabase
- **AI 통합**: OpenAI GPT-4
- **인프라**: Vercel, Supabase

## 개발 환경 설정

### 필수 조건

- Node.js 18+
- npm 또는 yarn
- Supabase 계정 (로컬 개발은 샘플 데이터로 가능)

### 환경 변수 설정

1. 프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수를 설정합니다:

```
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI 설정
OPENAI_API_KEY=your_openai_api_key
```

2. 환경 변수가 없는 개발 환경에서는 샘플 데이터가 자동으로 표시됩니다.

### 설치 및 실행

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

### 테스트 데이터 생성

Supabase에 테스트 데이터를 생성하려면 다음 방법 중 하나를 선택할 수 있습니다:

#### 1. API를 통한 테스트 데이터 생성
개발 서버 실행 후 다음 API를 호출합니다:

```bash
curl -X POST http://localhost:3000/api/generate-test-data
```

또는 브라우저에서 개발 툴을 열고 다음 코드를 실행합니다:

```javascript
fetch('/api/generate-test-data', {method: 'POST'})
  .then(res => res.json())
  .then(data => console.log('테스트 데이터 생성 결과:', data));
```

#### 2. SQL 스크립트를 통한 테이블 생성

Supabase 대시보드에서 SQL 편집기를 열고 프로젝트의 `src/lib/create-supabase-tables.sql` 파일 내용을 실행합니다.

## 프로젝트 구조

```
/src
  /app                  # Next.js 앱 라우터
    /api                # API 라우트
    /dashboard          # 대시보드 페이지
    /articles           # 기사 상세 페이지
  /components           # 재사용 컴포넌트
    /ui                 # UI 컴포넌트 
  /lib                  # 유틸리티 및 공통 함수
  /styles               # 전역 스타일
```

## 참고 사항

- 개발 환경에서는 기본적으로 샘플 데이터가 표시됩니다.
- Supabase 연결이 필요한 기능은 환경 변수가 설정된 경우에만 정상 작동합니다.
- 오류가 발생할 경우 콘솔에서 상세 정보를 확인할 수 있습니다. 