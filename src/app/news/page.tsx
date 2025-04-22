'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookmarkIcon, Search, ExternalLink, Filter, RefreshCw, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { NewsItem } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// 날짜 포맷 함수
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

interface NewsItemCardProps {
  item: NewsItem;
  onToggleScrap: (id: string) => void;
}

// 뉴스 카드 아이템 컴포넌트
function NewsItemCard({ item, onToggleScrap }: NewsItemCardProps) {
  // URL 유효성 검사 및 원문 열기 함수
  const handleViewOriginal = (url: string) => {
    if (url && typeof url === 'string') {
      try {
        // URL 형식 확인 및 보정
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        
        // URL 유효성 검사
        new URL(url);
        
        // 콘솔에 URL 기록 (디버깅용)
        console.log('열려는 URL:', url);
        
        // 새 탭에서 URL 열기
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.error('유효하지 않은 URL:', url, error);
        alert('유효하지 않은 URL입니다: ' + url);
      }
    } else {
      alert('원문 링크가 없습니다.');
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{item.source}</Badge>
              <span className="text-xs text-muted-foreground">{item.publisher}</span>
            </div>
            <CardTitle className="text-lg line-clamp-2 leading-tight">
              {item.title}
            </CardTitle>
          </div>
          {item.imageUrl && item.imageUrl.startsWith('http') ? (
            <div className="ml-4 w-20 h-20 relative flex-shrink-0 rounded-md overflow-hidden">
              <Image 
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="py-2 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {item.summary}
        </p>
        <div className="flex flex-wrap gap-1 mt-3">
          {item.keywords?.slice(0, 3).map((keyword, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">{keyword}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onToggleScrap(item.id)}
            className={item.isScrapped ? "text-yellow-500" : ""}
          >
            <BookmarkIcon className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleViewOriginal(item.url)}
          >
            <ExternalLink className="h-5 w-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// 뉴스 페이지 콘텐츠 컴포넌트 - useSearchParams 사용
function NewsPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPublisher, setFilterPublisher] = useState<string[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [publishers, setPublishers] = useState<string[]>([]);

  // 스크랩 토글 함수
  const toggleScrap = (id: string) => {
    setNewsItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, isScrapped: !item.isScrapped } : item
      )
    );
  };

  // 뉴스 데이터 가져오기
  const fetchNewsData = async (page: number = 1, resetData: boolean = false) => {
    setIsLoading(true);
    setError('');
    
    try {
      let results: NewsItem[] = [];
      
      if (activeTab === 'naver') {
        const response = await axios.get(`/api/news?source=naver&page=${page}`);
        results = response.data || [];
      } else if (activeTab === 'google') {
        const response = await axios.get(`/api/news?source=google&page=${page}`);
        results = response.data || [];
      } else {
        // 전체 뉴스
        const response = await axios.get(`/api/news?page=${page}`);
        results = response.data || [];
      }
      
      console.log('뉴스 데이터 로드 결과:', results);
      
      // 데이터가 없는 경우
      if (results.length === 0 && page === 1) {
        setError('해당 조건에 맞는 뉴스를 찾을 수 없습니다.');
      }
      
      // 중복 뉴스 제거 및 이전 데이터와 병합
      if (page > 1 && !resetData) {
        const existingIds = new Set(newsItems.map(item => item.id));
        const uniqueNewItems = results.filter(item => !existingIds.has(item.id));
        setNewsItems(prev => [...prev, ...uniqueNewItems]);
      } else {
        setNewsItems(results);
      }
    } catch (err) {
      console.error('뉴스 데이터 로드 중 오류 발생:', err);
      setError('뉴스 데이터를 불러오는 중 오류가 발생했습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 탭 변경 시 데이터 다시 로드
  useEffect(() => {
    setCurrentPage(1);
    fetchNewsData(1, true);
  }, [activeTab]);

  // 페이지 변경 시 추가 데이터 로드
  useEffect(() => {
    if (currentPage > 1) {
      fetchNewsData(currentPage, false);
    }
  }, [currentPage]);

  // 언론사 필터링을 위한 고유 언론사 목록 추출
  useEffect(() => {
    const uniquePublishers = Array.from(new Set(newsItems.map(item => item.publisher)))
      .filter(publisher => publisher && publisher.trim() !== '');
    setPublishers(uniquePublishers);
  }, [newsItems]);

  // 검색 및 필터링 적용
  useEffect(() => {
    let filtered = [...newsItems];
    
    // 검색어 적용
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.title?.toLowerCase().includes(query) || false) || 
        (item.summary?.toLowerCase().includes(query) || false)
      );
    }
    
    // 언론사 필터 적용
    if (filterPublisher.length > 0) {
      filtered = filtered.filter(item => filterPublisher.includes(item.publisher || ''));
    }
    
    setFilteredItems(filtered);
  }, [newsItems, searchQuery, filterPublisher]);

  // 필터 초기화
  const resetFilters = () => {
    setSearchQuery('');
    setFilterPublisher([]);
  };

  // 언론사 필터 토글
  const togglePublisherFilter = (publisher: string) => {
    setFilterPublisher(prev => 
      prev.includes(publisher)
        ? prev.filter(p => p !== publisher)
        : [...prev, publisher]
    );
  };

  // 새로고침 처리
  const handleRefresh = () => {
    setCurrentPage(1);
    fetchNewsData(1, true);
  };

  // 더 불러오기
  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  // 검색 제출 처리
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 검색 상태가 변경되면 useEffect에서 필터링이 자동으로 적용됨
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">언론보도</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="naver">네이버 뉴스</TabsTrigger>
          <TabsTrigger value="google">구글 뉴스</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-auto flex gap-2 md:flex-1">
          <Input 
            placeholder="뉴스 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:max-w-md"
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            검색
          </Button>
        </form>

        <div className="flex justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                필터
                {filterPublisher.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{filterPublisher.length}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>언론사 필터</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto p-2">
                {publishers.length > 0 ? (
                  publishers.map((publisher) => (
                    <DropdownMenuItem key={publisher} className="p-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`publisher-${publisher}`}
                          checked={filterPublisher.includes(publisher)}
                          onCheckedChange={() => togglePublisherFilter(publisher)}
                        />
                        <label
                          htmlFor={`publisher-${publisher}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                        >
                          {publisher}
                        </label>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-muted-foreground">
                    언론사 목록이 없습니다
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetFilters} className="justify-center">
                필터 초기화
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>
      )}

      {filteredItems.length === 0 && !isLoading ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-muted-foreground">검색 결과가 없습니다</p>
          <Button variant="outline" className="mt-4" onClick={resetFilters}>
            필터 초기화
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredItems.map((item) => (
              <NewsItemCard 
                key={item.id} 
                item={item} 
                onToggleScrap={toggleScrap} 
              />
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            filteredItems.length > 0 && (
              <div className="flex justify-center mb-8">
                <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                  더 불러오기
                </Button>
              </div>
            )
          )}
        </>
      )}
    </DashboardLayout>
  );
}

// 메인 뉴스 페이지 컴포넌트
export default function NewsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>페이지를 불러오는 중...</span>
      </div>
    }>
      <NewsPageContent />
    </Suspense>
  );
} 