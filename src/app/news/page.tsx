'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookmarkIcon, Search, ExternalLink, Filter } from 'lucide-react';
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
            onClick={() => {
              const url = item.url;
              if (url && url.startsWith('http')) {
                window.open(url, '_blank', 'noopener,noreferrer');
              } else {
                alert('유효한 URL이 없습니다.');
              }
            }}
          >
            <ExternalLink className="h-5 w-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// 언론보도 페이지 컴포넌트
export default function NewsPage() {
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
  useEffect(() => {
    const fetchNewsData = async () => {
      setIsLoading(true);
      try {
        let results: NewsItem[] = [];
        
        if (activeTab === 'naver') {
          const response = await axios.get(`/api/news?source=naver&page=${currentPage}`);
          results = response.data || [];
        } else if (activeTab === 'google') {
          const response = await axios.get(`/api/news?source=google&page=${currentPage}`);
          results = response.data || [];
        } else {
          // 전체 뉴스
          const response = await axios.get(`/api/news?page=${currentPage}`);
          results = response.data || [];
        }
        
        console.log('뉴스 데이터 로드 결과:', results);
        
        // 중복 뉴스 제거
        if (currentPage > 1) {
          const existingIds = new Set(newsItems.map(item => item.id));
          const uniqueNewItems = results.filter(item => !existingIds.has(item.id));
          setNewsItems(prev => [...prev, ...uniqueNewItems]);
        } else {
          setNewsItems(results);
        }
      } catch (err) {
        console.error('뉴스 데이터 로드 중 오류 발생:', err);
        setError('뉴스 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewsData();
  }, [activeTab, currentPage]);

  // 언론사 필터링을 위한 고유 언론사 목록 추출
  useEffect(() => {
    const uniquePublishers = Array.from(new Set(newsItems.map(item => item.publisher)));
    setPublishers(uniquePublishers);
  }, [newsItems]);

  // 검색 및 필터링 적용
  useEffect(() => {
    let filtered = [...newsItems];
    
    // 검색어 적용
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.summary.toLowerCase().includes(query)
      );
    }
    
    // 언론사 필터 적용
    if (filterPublisher.length > 0) {
      filtered = filtered.filter(item => filterPublisher.includes(item.publisher));
    }
    
    setFilteredItems(filtered);
  }, [newsItems, searchQuery, filterPublisher]);

  // 필터 초기화
  const resetFilters = () => {
    setSearchQuery('');
    setFilterPublisher([]);
  };

  // 언론사 필터 토글 함수
  const togglePublisherFilter = (publisher: string) => {
    setFilterPublisher(prev => 
      prev.includes(publisher)
        ? prev.filter(p => p !== publisher)
        : [...prev, publisher]
    );
  };

  return (
    <DashboardLayout>
      <div className="container p-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">언론보도</h1>
            <div className="flex items-center gap-2">
              <div className="relative w-60">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="뉴스 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>언론사 필터</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-56 overflow-y-auto">
                    {publishers.map((publisher) => (
                      <DropdownMenuItem key={publisher} onSelect={(e) => {
                        e.preventDefault();
                        togglePublisherFilter(publisher);
                      }}>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id={`publisher-${publisher}`}
                            checked={filterPublisher.includes(publisher)}
                            onCheckedChange={() => togglePublisherFilter(publisher)}
                          />
                          <label 
                            htmlFor={`publisher-${publisher}`} 
                            className="text-sm cursor-pointer flex-1"
                          >
                            {publisher}
                          </label>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={(e) => {
                    e.preventDefault();
                    resetFilters();
                  }}>
                    <Button variant="ghost" size="sm" className="w-full">
                      필터 초기화
                    </Button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="naver">네이버 뉴스</TabsTrigger>
              <TabsTrigger value="google">구글 뉴스</TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              {filterPublisher.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">필터: </span>
                  {filterPublisher.map((publisher) => (
                    <Badge 
                      key={publisher} 
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {publisher}
                      <button 
                        onClick={() => togglePublisherFilter(publisher)}
                        className="ml-1 text-xs hover:text-destructive"
                      >
                        ✕
                      </button>
                    </Badge>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters}
                    className="text-xs h-auto py-1"
                  >
                    초기화
                  </Button>
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-center my-12">
                  <div className="animate-pulse text-center">
                    <p className="text-muted-foreground">뉴스를 불러오는 중...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center my-12">
                  <p className="text-destructive">{error}</p>
                </div>
              ) : (
                <TabsContent value={activeTab} className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <NewsItemCard 
                          key={item.id} 
                          item={item} 
                          onToggleScrap={toggleScrap} 
                        />
                      ))
                    ) : (
                      <div className="col-span-full text-center my-12">
                        <p className="text-muted-foreground">검색 결과가 없습니다.</p>
                      </div>
                    )}
                  </div>
                  
                  {filteredItems.length > 0 && (
                    <div className="flex justify-center mt-8">
                      <Button 
                        variant="outline"
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={isLoading}
                      >
                        더 보기
                      </Button>
                    </div>
                  )}
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
} 