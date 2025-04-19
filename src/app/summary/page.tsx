'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Calendar, 
  Bookmark, 
  BookmarkCheck,
  Loader2,
  AlertCircle,
  ExternalLink,
  ArrowDownUp,
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, parseISO, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SummaryPage() {
  const router = useRouter();

  // 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSource, setActiveSource] = useState('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  
  // 필터링 상태
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: subDays(new Date(), 7), // 기본값: 최근 7일
    to: new Date(),
  });

  // 태그 목록
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // 데이터 로드
  useEffect(() => {
    fetchArticles();
  }, []);
  
  // 필터링 적용
  useEffect(() => {
    applyFilters();
  }, [articles, searchTerm, activeSource, sourceFilter, dateRange, selectedTag, sortOrder]);
  
  // 기사 데이터 가져오기
  const fetchArticles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Supabase에서 데이터 가져오기
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          source_name,
          source_type,
          published_at,
          source_url,
          summaries (summary),
          article_tags (tag)
        `)
        .order('published_at', { ascending: false });
      
      if (error) {
        throw new Error('기사 데이터를 가져오는 중 오류가 발생했습니다.');
      }
      
      // 데이터 변환
      const formattedArticles = data.map((article: any) => ({
        id: article.id,
        title: article.title,
        source: article.source_name,
        source_type: article.source_type,
        published_at: article.published_at,
        source_url: article.source_url,
        summary: article.summaries?.[0]?.summary || '',
        tags: article.article_tags?.map((t: any) => t.tag) || [],
      }));
      
      setArticles(formattedArticles);
      
      // 태그 목록 수집
      const uniqueTags = new Set<string>();
      formattedArticles.forEach((article: any) => {
        article.tags.forEach((tag: string) => uniqueTags.add(tag));
      });
      
      setAvailableTags(Array.from(uniqueTags));
      
      // 개발 모드에서 데이터가 없으면 샘플 데이터 사용
      if (formattedArticles.length === 0 && process.env.NODE_ENV !== 'production') {
        useDevSampleData();
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      setError(error instanceof Error ? error.message : '데이터를 불러오는 중 오류가 발생했습니다.');
      
      // 개발 모드에서는 샘플 데이터 사용
      if (process.env.NODE_ENV !== 'production') {
        useDevSampleData();
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // 개발 환경용 샘플 데이터
  const useDevSampleData = () => {
    const sampleArticles = [
      {
        id: 'sample-1',
        title: '금융위원회, 디지털 자산 거래소 규제 가이드라인 발표',
        source: '금융위원회',
        source_type: '정부부처',
        published_at: new Date().toISOString(),
        source_url: 'https://example.com/article1',
        summary: '금융위원회가 국내 디지털 자산 거래소에 대한 규제 가이드라인을 발표했습니다. 이번 가이드라인은 투자자 보호와 시장 안정성을 높이기 위한 조치로, 내년부터 적용될 예정입니다.',
        tags: ['디지털자산', '가상화폐', '금융규제']
      },
      {
        id: 'sample-2',
        title: '한국은행, 기준금리 동결 결정',
        source: '한국은행',
        source_type: '정부부처',
        published_at: new Date(Date.now() - 86400000).toISOString(),
        source_url: 'https://example.com/article2',
        summary: '한국은행 금융통화위원회가 현재 3.5%인 기준금리를 유지하기로 결정했습니다. 위원회는 국내외 경제 불확실성과 물가 상승 압력 등을 고려해 금리 동결을 선택했다고 밝혔습니다.',
        tags: ['기준금리', '통화정책', '경제전망']
      },
      {
        id: 'sample-3',
        title: '금융감독원, 은행권 ESG 경영 평가 결과 발표',
        source: '금융감독원',
        source_type: '정부부처',
        published_at: new Date(Date.now() - 172800000).toISOString(),
        source_url: 'https://example.com/article3',
        summary: '금융감독원이 국내 은행들의 ESG 경영 현황에 대한 평가 결과를 발표했습니다. 평가 결과에 따르면 대부분의 은행들이 환경 및 사회적 책임 부문에서 개선이 필요하다는 제언이 있었습니다.',
        tags: ['ESG', '금융감독', '지속가능경영']
      },
      {
        id: 'sample-4',
        title: '보이스피싱 범죄 수법 고도화...금융사기 피해액 증가',
        source: '조선일보',
        source_type: '언론사',
        published_at: new Date(Date.now() - 259200000).toISOString(),
        source_url: 'https://example.com/article4',
        summary: '최근 보이스피싱 범죄 수법이 고도화되면서 금융 사기 피해액이 증가하고 있습니다. 특히 명의도용을 통한 대출사기와 메신저를 이용한 피싱이 급증하고 있어 소비자들의 주의가 요구됩니다.',
        tags: ['보이스피싱', '금융사기', '소비자보호']
      },
      {
        id: 'sample-5',
        title: '장애인 금융접근성 강화 법안 국회 통과',
        source: '한겨레',
        source_type: '언론사',
        published_at: new Date(Date.now() - 345600000).toISOString(),
        source_url: 'https://example.com/article5',
        summary: '장애인의 금융서비스 접근성을 강화하는 법안이 국회 본회의를 통과했습니다. 이 법안은 금융기관이 장애인을 위한 편의시설과 서비스를 의무적으로 제공하도록 규정하고 있습니다.',
        tags: ['장애인 금융', '금융접근성', '포용금융']
      }
    ];
    
    setArticles(sampleArticles);
    
    // 태그 목록 수집
    const uniqueTags = new Set<string>();
    sampleArticles.forEach((article: any) => {
      article.tags.forEach((tag: string) => uniqueTags.add(tag));
    });
    
    setAvailableTags(Array.from(uniqueTags));
  };
  
  // 필터 적용
  const applyFilters = () => {
    let filtered = [...articles];
    
    // 탭 필터 (정부부처/언론사/전체)
    if (activeSource !== 'all') {
      filtered = filtered.filter(article => 
        article.source_type === activeSource
      );
    }
    
    // 특정 소스 필터
    if (sourceFilter) {
      filtered = filtered.filter(article => 
        article.source === sourceFilter
      );
    }
    
    // 날짜 필터
    if (dateRange.from) {
      filtered = filtered.filter(article => 
        new Date(article.published_at) >= dateRange.from!
      );
    }
    
    if (dateRange.to) {
      filtered = filtered.filter(article => 
        new Date(article.published_at) <= dateRange.to!
      );
    }
    
    // 태그 필터
    if (selectedTag) {
      filtered = filtered.filter(article => 
        article.tags.includes(selectedTag)
      );
    }
    
    // 검색어 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.summary.toLowerCase().includes(searchLower) ||
        article.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // 정렬 적용
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredArticles(filtered);
  };
  
  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  // 필터 초기화
  const resetFilters = () => {
    setSearchTerm('');
    setActiveSource('all');
    setSourceFilter(null);
    setDateRange({
      from: subDays(new Date(), 7),
      to: new Date(),
    });
    setSelectedTag(null);
    setSortOrder('latest');
  };
  
  // 스크랩 토글(실제 구현은 로그인 상태 확인 후 처리)
  const toggleScrap = async (articleId: string) => {
    alert('로그인 후 이용 가능합니다.');
    router.push('/login');
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-2">요약 리포트 검색</h1>
      <p className="text-gray-500 mb-6">보도자료 및 언론기사 통합 검색</p>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* 검색 폼 */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="검색어 입력..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex gap-2 min-w-[120px]">
                  <Filter className="h-4 w-4" />
                  필터
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">출처</h4>
                    <Select 
                      value={sourceFilter || ""} 
                      onValueChange={(value) => setSourceFilter(value || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="모든 출처" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">모든 출처</SelectItem>
                        <SelectItem value="금융위원회">금융위원회</SelectItem>
                        <SelectItem value="금융감독원">금융감독원</SelectItem>
                        <SelectItem value="한국은행">한국은행</SelectItem>
                        <SelectItem value="공정거래위원회">공정거래위원회</SelectItem>
                        <SelectItem value="과학기술정보통신부">과학기술정보통신부</SelectItem>
                        <SelectItem value="조선일보">조선일보</SelectItem>
                        <SelectItem value="중앙일보">중앙일보</SelectItem>
                        <SelectItem value="동아일보">동아일보</SelectItem>
                        <SelectItem value="한겨레">한겨레</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">기간</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="from">시작일</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-full justify-start text-left font-normal mt-1"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {dateRange.from ? (
                                format(dateRange.from, 'yyyy-MM-dd')
                              ) : (
                                <span>시작일 선택</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={dateRange.from}
                              onSelect={(date) => 
                                setDateRange(prev => ({ ...prev, from: date }))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label htmlFor="to">종료일</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-full justify-start text-left font-normal mt-1"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {dateRange.to ? (
                                format(dateRange.to, 'yyyy-MM-dd')
                              ) : (
                                <span>종료일 선택</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={dateRange.to}
                              onSelect={(date) => 
                                setDateRange(prev => ({ ...prev, to: date }))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">정렬</h4>
                    <div className="flex gap-2">
                      <Button
                        variant={sortOrder === 'latest' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortOrder('latest')}
                      >
                        최신순
                      </Button>
                      <Button
                        variant={sortOrder === 'oldest' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortOrder('oldest')}
                      >
                        오래된순
                      </Button>
                    </div>
                  </div>
                  
                  <Button onClick={resetFilters} variant="outline">필터 초기화</Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button type="submit">검색</Button>
          </div>
        </form>
      </div>
      
      {/* 소스 탭 */}
      <Tabs value={activeSource} onValueChange={setActiveSource} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="정부부처">정부부처</TabsTrigger>
          <TabsTrigger value="언론사">언론사</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* 태그 필터 */}
      {availableTags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">태그 필터</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <Badge 
                key={tag} 
                variant={selectedTag === tag ? "default" : "outline"} 
                className="cursor-pointer"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* 검색 결과 통계 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          검색 결과: {filteredArticles.length}건
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" 
            size="sm"
            className="text-xs"
            onClick={() => setSortOrder(sortOrder === 'latest' ? 'oldest' : 'latest')}
          >
            <ArrowDownUp className="h-3 w-3 mr-1" /> 
            {sortOrder === 'latest' ? '최신순' : '오래된순'}
          </Button>
        </div>
      </div>
      
      <Separator className="mb-6" />
      
      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>데이터를 불러오는 중...</span>
        </div>
      )}
      
      {/* 검색 결과 */}
      {!isLoading && filteredArticles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>검색 결과가 없습니다.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={resetFilters}
          >
            필터 초기화
          </Button>
        </div>
      )}
      
      {/* 기사 목록 */}
      {!isLoading && filteredArticles.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {filteredArticles.map((article) => (
            <Card key={article.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{article.source}</Badge>
                      <span className="text-xs text-gray-500">
                        {format(new Date(article.published_at), 'yyyy.MM.dd', { locale: ko })}
                      </span>
                    </div>
                    <CardTitle className="text-lg">
                      <Link href={`/articles/${article.id}`} className="hover:underline">
                        {article.title}
                      </Link>
                    </CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => toggleScrap(article.id)}
                  >
                    <Bookmark className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  {article.summary}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {article.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Button variant="link" size="sm" className="p-0" asChild>
                    <Link href={`/articles/${article.id}`}>
                      상세 보기
                    </Link>
                  </Button>
                  {article.source_url && (
                    <Button 
                      variant="link" 
                      size="sm"
                      className="p-0"
                      asChild
                    >
                      <a 
                        href={article.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        원문 보기 <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 