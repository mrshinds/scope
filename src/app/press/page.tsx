'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { DateRangePicker } from '@/components/date-range-picker';
import { Calendar, ChevronDown, ChevronRight, ExternalLink, Filter, Loader2, Search, Star, Tag } from 'lucide-react';
import axios from 'axios';
import { SourceItem } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function PressPage() {
  // URL 파라미터
  const searchParams = useSearchParams();
  const router = useRouter();
  const initPage = Number(searchParams?.get('page') || '1');
  const initSource = searchParams?.get('source') || '';
  const initSearch = searchParams?.get('search') || '';

  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pressReleases, setPressReleases] = useState<SourceItem[]>([]);
  const [page, setPage] = useState(initPage);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initSearch);
  const [sourceFilter, setSourceFilter] = useState(initSource);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeSource, setActiveSource] = useState<string | null>(null);

  // 한 페이지에 표시할 항목 수
  const itemsPerPage = 10;

  // 검색어 디바운스 (타이핑 완료 후 검색)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // URL 파라미터 업데이트
  const updateUrlParams = useCallback((newParams: Record<string, string | number | null>) => {
    if (!searchParams) return;
    
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  // 데이터 불러오기
  const fetchPressReleases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 쿼리 파라미터 구성
      const params: Record<string, string | number> = {
        page,
        limit: itemsPerPage
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (sourceFilter) params.source = sourceFilter;
      if (dateRange?.from) params.startDate = format(dateRange.from, 'yyyy-MM-dd');
      if (dateRange?.to) params.endDate = format(dateRange.to, 'yyyy-MM-dd');
      if (selectedTags.length > 0) params.tags = selectedTags.join(',');

      const response = await axios.get('/api/press', { params });
      
      setPressReleases(response.data.items || []);
      setTotalItems(response.data.total || 0);
      setHasMore(response.data.hasMore || false);
      
      // 태그 수집
      const tags = new Set<string>();
      response.data.items.forEach((item: SourceItem) => {
        if (item.tags) {
          item.tags.forEach(tag => tags.add(tag));
        }
      });
      setAvailableTags(Array.from(tags));
      
    } catch (error) {
      console.error('보도자료 조회 오류:', error);
      setError('보도자료를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, sourceFilter, dateRange, selectedTags]);

  // 페이지 변경 시 데이터 불러오기
  useEffect(() => {
    fetchPressReleases();
  }, [fetchPressReleases]);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrlParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 검색 핸들러
  const handleSearch = () => {
    setPage(1);
    updateUrlParams({ search: searchTerm, page: 1 });
  };

  // 필터 적용 핸들러
  const applyFilters = () => {
    setPage(1);
    updateUrlParams({ 
      source: sourceFilter, 
      page: 1,
      // 날짜와 태그는 URL에 포함하지 않고 상태로만 관리
    });
  };

  // 필터 초기화 핸들러
  const resetFilters = () => {
    setSourceFilter('');
    setDateRange(undefined);
    setSelectedTags([]);
    setPage(1);
    updateUrlParams({ source: null, page: 1 });
  };

  // 스크랩 토글 핸들러
  const toggleScrap = async (item: SourceItem) => {
    try {
      // 임시로 UI만 업데이트 (API 연동 필요)
      setPressReleases(prevItems => 
        prevItems.map(prevItem => 
          prevItem.id === item.id 
            ? { ...prevItem, isScrapped: !prevItem.isScrapped } 
            : prevItem
        )
      );
      
      // API 호출은 추후 구현
      // await axios.put(`/api/press/scrap`, { 
      //   id: item.id, 
      //   isScraped: !item.isScrapped 
      // });
    } catch (error) {
      console.error('스크랩 상태 변경 오류:', error);
      // 에러 시 원상태로 복구
      setPressReleases(prevItems => 
        prevItems.map(prevItem => 
          prevItem.id === item.id 
            ? { ...prevItem, isScrapped: item.isScrapped } 
            : prevItem
        )
      );
    }
  };

  // 소스별 분류 탭
  const sources = ['전체', '금융위원회', '금융감독원', '한국은행'];

  // 태그 선택 토글
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  // 소스 아이템 렌더링
  const renderPressReleaseItem = (item: SourceItem) => (
    <Card key={item.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg">
            {item.title}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => toggleScrap(item)}
            className={item.isScrapped ? "text-yellow-500" : "text-gray-300"}
          >
            <Star className="h-5 w-5" fill={item.isScrapped ? "currentColor" : "none"} />
          </Button>
        </div>
        <CardDescription className="flex items-center gap-2 text-sm">
          <span className="font-medium">{item.source}</span>
          <span>•</span>
          <time dateTime={item.date}>{format(parseISO(item.date), 'yyyy-MM-dd')}</time>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        <p className="text-sm text-gray-600 mb-2">{item.summary}</p>
        
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="text-xs cursor-pointer hover:bg-slate-100"
                onClick={() => toggleTag(tag)}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex justify-between w-full">
          <Button variant="link" className="p-0 h-auto" asChild>
            <Link href={item.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              원문 보기
            </Link>
          </Button>
          
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href={`/press/${item.id}`}>
              상세보기
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">기관보도</h2>
            <p className="text-muted-foreground">
              최신 금융 규제 기관 보도자료를 확인하세요.
            </p>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex w-full md:w-auto gap-2">
            <Input
              placeholder="검색어 입력..."
              className="w-full md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
          </form>
        </div>
        
        {/* 검색 및 필터 */}
        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="보도자료 검색..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="shrink-0">검색</Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              <Filter className="h-4 w-4 mr-2" />
              필터
              <ChevronDown className={`h-4 w-4 ml-1 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          
          {showFilters && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">출처</h3>
                    <select
                      className="w-full border rounded p-2"
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                    >
                      <option value="">모든 출처</option>
                      <option value="금융위원회">금융위원회</option>
                      <option value="금융감독원">금융감독원</option>
                      <option value="한국은행">한국은행</option>
                    </select>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">날짜 범위</h3>
                    <DateRangePicker
                      value={dateRange}
                      onChange={setDateRange}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">태그</h3>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {availableTags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant={selectedTags.includes(tag) ? "default" : "outline"} 
                          className="cursor-pointer"
                          onClick={() => toggleTag(tag)}
                        >
                          #{tag}
                        </Badge>
                      ))}
                      {availableTags.length === 0 && (
                        <span className="text-sm text-gray-500">검색 결과에서 선택 가능</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 gap-2">
                  <Button variant="outline" onClick={resetFilters}>초기화</Button>
                  <Button onClick={applyFilters}>필터 적용</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* 소스 탭 */}
        <Tabs defaultValue="전체" className="mb-6">
          <TabsList className="mb-2">
            {sources.map(source => (
              <TabsTrigger 
                key={source} 
                value={source}
                onClick={() => {
                  setSourceFilter(source === '전체' ? '' : source);
                  setPage(1);
                  updateUrlParams({ 
                    source: source === '전체' ? null : source, 
                    page: 1 
                  });
                }}
              >
                {source}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <Separator />
        </Tabs>
        
        {/* 에러 표시 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>오류 발생</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* 로딩 상태 */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">로딩 중...</span>
          </div>
        )}
        
        {/* 결과가 없는 경우 */}
        {!loading && pressReleases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">검색 결과가 없습니다</p>
            {(debouncedSearch || sourceFilter || dateRange?.from || selectedTags.length > 0) && (
              <Button variant="outline" className="mt-4" onClick={resetFilters}>
                필터 초기화
              </Button>
            )}
          </div>
        )}
        
        {/* 보도자료 목록 */}
        <div className="space-y-4">
          {pressReleases.map(renderPressReleaseItem)}
        </div>
        
        {/* 페이지네이션 */}
        {totalItems > 0 && (
          <Pagination className="mt-8">
            <PaginationContent>
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
                </PaginationItem>
              )}
              
              {Array.from({ length: Math.min(5, Math.ceil(totalItems / itemsPerPage)) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={page === pageNum}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {hasMore && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext onClick={() => handlePageChange(page + 1)} />
                  </PaginationItem>
                </>
              )}
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </DashboardLayout>
  );
} 