'use client';

import { useState, useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Filter, Loader2, CalendarIcon, ExternalLink, LogOut } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import ArticleCard from '@/components/article-card';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

// SearchParams 사용 컴포넌트를 별도로 분리
import { useSearchParams } from 'next/navigation';

function DashboardContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tagFilter = searchParams ? searchParams.get('tag') : null;
  const loginSuccess = searchParams ? searchParams.get('login_success') === 'true' : false;
  
  const supabase = createClientComponentClient();
  
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [tags, setTags] = useState<string[]>([]);
  const [user, setUser] = useState<any>({ email: 'demo@example.com' }); // 기본 사용자 정보 설정
  const [showLoginSuccess, setShowLoginSuccess] = useState(loginSuccess);

  // 로그인 성공 메시지 표시 후 자동으로 숨김
  useEffect(() => {
    if (showLoginSuccess) {
      const timer = setTimeout(() => {
        setShowLoginSuccess(false);
        // URL에서 login_success 파라미터 제거
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showLoginSuccess]);

  // 로그아웃 함수 (기능 제거)
  const handleLogout = async () => {
    console.log('로그아웃 기능이 비활성화되었습니다.');
    toast.info('로그아웃 기능이 비활성화되었습니다.');
  };

  // 테스트 데이터
  const sampleArticles = [
    {
      id: 'sample-1',
      title: '금융위원회, 디지털 자산 거래소 규제 가이드라인 발표',
      source: '금융위원회',
      source_type: '금융위원회',
      published_at: new Date().toISOString(),
      source_url: 'https://example.com/article1',
      tags: ['디지털자산', '가상화폐', '금융규제'],
      summary: '금융위원회가 국내 디지털 자산 거래소에 대한 규제 가이드라인을 발표했습니다. 이번 가이드라인은 투자자 보호와 시장 안정성을 높이기 위한 조치로, 내년부터 적용될 예정입니다.',
      isScrapped: false
    },
    {
      id: 'sample-2',
      title: '한국은행, 기준금리 동결 결정',
      source: '한국은행',
      source_type: '한국은행',
      published_at: new Date(Date.now() - 86400000).toISOString(),
      source_url: 'https://example.com/article2',
      tags: ['기준금리', '통화정책', '경제전망'],
      summary: '한국은행 금융통화위원회가 현재 3.5%인 기준금리를 유지하기로 결정했습니다. 위원회는 국내외 경제 불확실성과 물가 상승 압력 등을 고려해 금리 동결을 선택했다고 밝혔습니다.',
      isScrapped: false
    },
    {
      id: 'sample-3',
      title: '금융감독원, 은행권 ESG 경영 평가 결과 발표',
      source: '금융감독원',
      source_type: '금융감독원',
      published_at: new Date(Date.now() - 172800000).toISOString(),
      source_url: 'https://example.com/article3',
      tags: ['ESG', '금융감독', '지속가능경영'],
      summary: '금융감독원이 국내 은행들의 ESG 경영 현황에 대한 평가 결과를 발표했습니다. 평가 결과에 따르면 대부분의 은행들이 환경 및 사회적 책임 부문에서 개선이 필요하다는 제언이 있었습니다.',
      isScrapped: false
    }
  ];

  // 데이터 로드
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(null);

        // 개발 환경에서 샘플 데이터 사용 (API가 안정화될 때까지)
        // 이 코드는 API가 안정화되면 제거할 수 있습니다
        const isDevelopment = process.env.NODE_ENV !== 'production';
        if (isDevelopment) {
          console.info('개발 환경에서 내장 샘플 데이터를 사용합니다.');

          // 태그 필터링 적용
          let filteredArticles = [...sampleArticles];
          
          if (tagFilter) {
            filteredArticles = filteredArticles.filter(article => 
              article.tags.some(tag => tag.toLowerCase() === tagFilter.toLowerCase())
            );
          }
          
          // 소스 필터링 적용
          if (activeTab !== 'all') {
            filteredArticles = filteredArticles.filter(article =>
              article.source_type === activeTab
            );
          }
          
          // 검색어 필터링 적용
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filteredArticles = filteredArticles.filter(article =>
              article.title.toLowerCase().includes(searchLower) ||
              (article.summary && article.summary.toLowerCase().includes(searchLower))
            );
          }
          
          // 데이터 설정
          setArticles(filteredArticles);
          
          // 태그 수집
          const uniqueTags = new Set<string>();
          filteredArticles.forEach(article => {
            article.tags.forEach(tag => uniqueTags.add(tag));
          });
          setTags(Array.from(uniqueTags));
          
          setLoading(false);
          return; // API 호출 스킵
        }

        // 실제 API 호출
        try {
          const response = await fetch('/api/articles?' + new URLSearchParams({
            tag: tagFilter || '',
            source: activeTab !== 'all' ? activeTab : '',
            search: searchTerm
          }));

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `서버 오류 (${response.status})`;
            console.error('API 오류 상세:', { status: response.status, message: errorMessage, data: errorData });
            throw new Error(errorMessage);
          }

          const data = await response.json();
          
          // 유효한 데이터 확인
          if (!data || !Array.isArray(data.items)) {
            console.warn('API 응답에 유효한 items 배열이 없습니다:', data);
            setArticles([]);
            setTags([]);
            return;
          }
          
          setArticles(data.items);
          
          // 태그 수집
          const uniqueTags = new Set<string>();
          data.items.forEach((article: any) => {
            article.tags?.forEach((tag: string) => uniqueTags.add(tag));
          });
          setTags(Array.from(uniqueTags));
          
        } catch (fetchError) {
          console.error('API 요청 실패:', fetchError);
          
          // API 서버가 실행되지 않았을 수 있음
          if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
            setError('API 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
          } else {
            setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
          }
          
          // 개발 환경에서는 임시 데이터 사용
          if (isDevelopment) {
            console.info('개발 환경에서 임시 데이터를 사용합니다.');
            const dummyArticles = [
              {
                id: 'temp-1',
                title: '금융위원회, 디지털 자산 거래소 규제 가이드라인 발표',
                source: '금융위원회',
                source_type: '금융위원회',
                published_at: new Date().toISOString(),
                tags: ['디지털자산', '가상화폐', '금융규제'],
                summary: '금융위원회가 국내 디지털 자산 거래소에 대한 규제 가이드라인을 발표했습니다. 이번 가이드라인은 투자자 보호와 시장 안정성을 높이기 위한 조치로, 내년부터 적용될 예정입니다.'
              },
              {
                id: 'temp-2',
                title: '한국은행, 기준금리 동결 결정',
                source: '한국은행',
                source_type: '한국은행',
                published_at: new Date(Date.now() - 86400000).toISOString(),
                tags: ['기준금리', '통화정책', '경제전망'],
                summary: '한국은행 금융통화위원회가 현재 3.5%인 기준금리를 유지하기로 결정했습니다. 위원회는 국내외 경제 불확실성과 물가 상승 압력 등을 고려해 금리 동결을 선택했다고 밝혔습니다.'
              },
              {
                id: 'temp-3',
                title: '금융감독원, 은행권 ESG 경영 평가 결과 발표',
                source: '금융감독원',
                source_type: '금융감독원',
                published_at: new Date(Date.now() - 172800000).toISOString(),
                tags: ['ESG', '금융감독', '지속가능경영'],
                summary: '금융감독원이 국내 은행들의 ESG 경영 현황에 대한 평가 결과를 발표했습니다. 평가 결과에 따르면 대부분의 은행들이 환경 및 사회적 책임 부문에서 개선이 필요하다는 제언이 있었습니다.'
              }
            ];
            
            // 태그 및 소스 필터링을 적용한 임시 데이터
            let filteredArticles = [...dummyArticles];
            
            if (tagFilter) {
              filteredArticles = filteredArticles.filter(article => 
                article.tags.some(tag => tag.toLowerCase() === tagFilter.toLowerCase())
              );
            }
            
            if (activeTab !== 'all') {
              filteredArticles = filteredArticles.filter(article =>
                article.source_type === activeTab
              );
            }
            
            if (searchTerm) {
              const searchLower = searchTerm.toLowerCase();
              filteredArticles = filteredArticles.filter(article =>
                article.title.toLowerCase().includes(searchLower) ||
                article.summary.toLowerCase().includes(searchLower)
              );
            }
            
            setArticles(filteredArticles);
            
            // 임시 태그 설정
            const uniqueTags = new Set<string>();
            filteredArticles.forEach(article => {
              article.tags.forEach(tag => uniqueTags.add(tag));
            });
            setTags(Array.from(uniqueTags));
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [tagFilter, activeTab, searchTerm]);

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 이미 useEffect에서 searchTerm의 변경을 감지하여 데이터를 다시 불러옴
  };

  const handleTagClick = (tag: string) => {
    // 태그 페이지로 이동
    window.location.href = `/dashboard?tag=${encodeURIComponent(tag)}`;
  };

  return (
    <DashboardLayout>
      {/* 로그인 성공 알림 */}
      {showLoginSuccess && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <AlertDescription>로그인에 성공했습니다.</AlertDescription>
        </Alert>
      )}

      {/* 사용자 정보 표시 */}
      {user && (
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{user.email}</span>님 환영합니다
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">대시보드</h2>
            <p className="text-muted-foreground">
              최신 금융 규제 및 정책 정보를 확인하세요.
            </p>
          </div>
          
          <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
            <Input
              placeholder="검색어 입력..."
              className="w-full md:w-[300px]"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
          </form>
        </div>

        {/* 소스 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="금융위원회">금융위</TabsTrigger>
            <TabsTrigger value="금융감독원">금감원</TabsTrigger>
          </TabsList>
          <Separator className="my-4" />
        </Tabs>

        {/* 태그 리스트 */}
        {tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">인기 태그</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-slate-100"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>데이터를 불러오는 중...</span>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* 기사 목록 */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            검색 결과가 없습니다.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

// 메인 대시보드 페이지 컴포넌트
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>페이지를 불러오는 중...</span>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
} 