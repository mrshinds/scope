'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { SourceItem } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { BookmarkIcon, ExternalLinkIcon, SearchIcon, FilterIcon } from 'lucide-react';
import { sources as dummyData } from '@/lib/data'; // 임시 데이터로 사용
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function PressPage() {
  const [pressReleases, setPressReleases] = useState<SourceItem[]>([]);
  const [filteredReleases, setFilteredReleases] = useState<SourceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchPressReleases = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // API 호출
        const response = await axios.get('/api/press', {
          params: { page: currentPage }
        });
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          if (currentPage === 1) {
            setPressReleases(response.data);
          } else {
            // 더 불러온 데이터 추가
            setPressReleases(prev => [...prev, ...response.data]);
          }
        } else {
          // API 응답이 비어있을 경우 임시 데이터 사용
          console.log('API 응답이 비어있어 임시 데이터를 사용합니다.');
          if (currentPage === 1) {
            setPressReleases(dummyData);
          }
        }
      } catch (err) {
        console.error('보도자료 가져오기 오류:', err);
        setError('보도자료를 불러오는 중 오류가 발생했습니다.');
        // 에러 발생 시 임시 데이터 사용
        if (currentPage === 1) {
          setPressReleases(dummyData);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPressReleases();
  }, [currentPage]);

  // 검색어나 필터가 변경될 때마다 필터링 수행
  useEffect(() => {
    let filtered = [...pressReleases];
    
    // 기관별 필터링
    if (activeTab !== 'all') {
      filtered = filtered.filter(item => 
        item.organization?.toLowerCase() === activeTab.toLowerCase() ||
        item.source?.toLowerCase() === activeTab.toLowerCase()
      );
    }
    
    // 검색어 필터링
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.summary?.toLowerCase().includes(term) ||
        item.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    setFilteredReleases(filtered);
  }, [pressReleases, searchTerm, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 검색 로직은 useEffect에서 처리
  };

  const handleToggleScrap = (id: string) => {
    setPressReleases(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, isScrapped: !item.isScrapped } : item
      )
    );
  };

  const handleViewOriginal = (url: string) => {
    if (url && typeof url === 'string') {
      // URL이 유효한지 확인
      try {
        // 유효한 URL 형식인지 확인
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        new URL(url); // URL이 유효하지 않으면 에러가 발생합니다
        window.open(url, '_blank', 'noopener,noreferrer');
        console.log('열린 URL:', url);
      } catch (error) {
        console.error('유효하지 않은 URL:', url, error);
        alert('유효하지 않은 URL입니다: ' + url);
      }
    } else {
      alert('원문 링크가 없습니다.');
    }
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold">보도자료</h1>
          <p className="text-muted-foreground">
            금융위원회, 금융감독원, 한국은행의 최신 보도자료를 확인하세요.
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <form onSubmit={handleSearch} className="flex w-full max-w-lg items-center space-x-2">
            <Input
              placeholder="제목, 내용, 태그로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="outline">
              <SearchIcon className="h-4 w-4 mr-2" />
              검색
            </Button>
          </form>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="FSC">금융위원회</TabsTrigger>
              <TabsTrigger value="FSS">금융감독원</TabsTrigger>
              <TabsTrigger value="BOK">한국은행</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Separator />

        {error && (
          <div className="bg-red-50 p-4 rounded-md text-red-500">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && currentPage === 1 ? (
            Array(6).fill(0).map((_, index) => (
              <Card key={`skeleton-${index}`} className="animate-pulse">
                <CardHeader className="h-20 bg-gray-100"></CardHeader>
                <CardContent className="py-4">
                  <div className="h-4 bg-gray-100 rounded mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredReleases.length > 0 ? (
            filteredReleases.map(item => (
              <Card key={item.id} className="flex flex-col h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="mb-2">
                      {item.organization || item.source}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleToggleScrap(item.id)}
                    >
                      <BookmarkIcon 
                        className={`h-5 w-5 ${item.isScrapped ? 'fill-yellow-400 text-yellow-400' : ''}`} 
                      />
                    </Button>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {new Date(item.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm line-clamp-3">{item.summary}</p>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-1">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleViewOriginal(item.url)}
                  >
                    <ExternalLinkIcon className="h-4 w-4 mr-2" />
                    원본 보기
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        {!isLoading && filteredReleases.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleLoadMore}
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? '불러오는 중...' : '더 보기'}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 