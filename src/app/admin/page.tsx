'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Database, DownloadCloud, RefreshCw, Trash } from 'lucide-react';
import axios from 'axios';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('scraping');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<any>({
    articlesCount: 0,
    sourcesCount: 0,
    tagsCount: 0,
    lastUpdated: null
  });

  // 통계 데이터 로드
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      // 실제 구현에서는 통계 API를 호출
      // const response = await axios.get('/api/admin/stats');
      // setStats(response.data);
      
      // 임시 통계 데이터 (API 구현시 삭제)
      setTimeout(() => {
        setStats({
          articlesCount: 128,
          sourcesCount: 3,
          tagsCount: 57,
          lastUpdated: new Date().toISOString()
        });
        setStatsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('통계 로드 오류:', error);
      setStatsLoading(false);
    }
  };

  // 스크래핑 실행
  const runScraping = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post('/api/scrape', null, {
        params: {
          source: sourceFilter || undefined,
          autoSummarize: true
        }
      });
      
      setResult(response.data);
      fetchStats(); // 통계 다시 로드
    } catch (error: any) {
      console.error('스크래핑 오류:', error);
      setError(error.response?.data?.error || '스크래핑에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 데이터베이스 정리 (미구현 기능)
  const cleanupDatabase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 실제 구현에서는 데이터 정리 API를 호출
      // const response = await axios.post('/api/admin/cleanup');
      // setResult(response.data);
      
      // 임시 결과 (API 구현시 삭제)
      setTimeout(() => {
        setResult({
          message: '데이터베이스 정리 완료',
          deletedCount: 5
        });
        setIsLoading(false);
        fetchStats();
      }, 2000);
    } catch (error: any) {
      console.error('데이터베이스 정리 오류:', error);
      setError(error.response?.data?.error || '데이터베이스 정리에 실패했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">관리자 페이지</h1>
      
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">기사 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <RefreshCw className="h-6 w-6 animate-spin" /> : stats.articlesCount}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">소스 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <RefreshCw className="h-6 w-6 animate-spin" /> : stats.sourcesCount}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">태그 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <RefreshCw className="h-6 w-6 animate-spin" /> : stats.tagsCount}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 탭 콘텐츠 */}
      <Tabs defaultValue="scraping" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="scraping">스크래핑 관리</TabsTrigger>
          <TabsTrigger value="database">데이터베이스 관리</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scraping">
          <Card>
            <CardHeader>
              <CardTitle>보도자료 스크래핑</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">소스 필터 (선택사항)</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="예: 금융위원회"
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                    />
                    <Button onClick={() => setSourceFilter('')} variant="outline" size="icon">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={runScraping} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        스크래핑 중...
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="mr-2 h-4 w-4" />
                        보도자료 스크래핑 실행
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            
            {error && (
              <CardFooter className="border-t pt-4 bg-red-50">
                <div className="flex items-center text-red-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span>{error}</span>
                </div>
              </CardFooter>
            )}
            
            {result && (
              <CardFooter className="border-t pt-4 bg-green-50">
                <div className="w-full">
                  <div className="flex items-center text-green-600 mb-2">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>{result.message}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-100">
                      저장됨: {result.saved || 0}
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-100">
                      중복: {result.duplicates || 0}
                    </Badge>
                    <Badge variant="outline" className="bg-red-100">
                      실패: {result.failed || 0}
                    </Badge>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>데이터베이스 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-yellow-50">
                  <h3 className="font-medium mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                    주의 사항
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    데이터베이스 정리 기능은 30일 이상 된 요약되지 않은 기사와 연결되지 않은 태그를 삭제합니다.
                    이 작업은 되돌릴 수 없으니 주의하세요.
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={cleanupDatabase} 
                    disabled={isLoading}
                    variant="destructive"
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <Trash className="mr-2 h-4 w-4" />
                        데이터베이스 정리
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={fetchStats} 
                    disabled={statsLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {statsLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        통계 갱신 중...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        통계 새로고침
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            
            {result && activeTab === 'database' && (
              <CardFooter className="border-t pt-4 bg-green-50">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>{result.message} (삭제된 항목: {result.deletedCount || 0})</span>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 