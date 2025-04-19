'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Bookmark, Tag, Trash2, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrappedArticles, setScrappedArticles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('scraps');
  const [interestKeywords, setInterestKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  
  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session) {
          // 개발 환경에서는 테스트 로그인 상태 확인
          const isDevLogin = process.env.NODE_ENV !== 'production' && 
                           sessionStorage.getItem('isLoggedIn') === 'true';
                           
          if (!isDevLogin) {
            // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
            router.push('/login');
            return;
          }
        }
        
        fetchUserData();
      } catch (error) {
        console.error('인증 확인 오류:', error);
        setError('인증 상태를 확인하는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // 사용자 데이터 로드
  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 사용자 정보 가져오기
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      
      // 개발 환경에서는 임시 데이터 사용
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      if (!userId && !isDevelopment) {
        setError('사용자 정보를 찾을 수 없습니다.');
        return;
      }
      
      // 사용자가 스크랩한 기사 가져오기
      if (userId) {
        // Supabase로 스크랩 목록 조회
        const { data: scraps, error: scrapsError } = await supabase
          .from('scraps')
          .select(`
            article_id,
            created_at,
            articles (
              id,
              title,
              source_name,
              source_type,
              published_at,
              source_url,
              summaries (summary),
              article_tags (tag)
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (scrapsError) {
          console.error('스크랩 조회 오류:', scrapsError);
          throw new Error('스크랩 목록을 가져오는 중 오류가 발생했습니다.');
        }
        
        // 데이터 변환
        const formattedScraps = scraps.map((scrap: any) => ({
          id: scrap.articles.id,
          title: scrap.articles.title,
          source: scrap.articles.source_name,
          source_type: scrap.articles.source_type,
          published_at: scrap.articles.published_at,
          source_url: scrap.articles.source_url,
          summary: scrap.articles.summaries?.[0]?.summary || '',
          tags: scrap.articles.article_tags?.map((t: any) => t.tag) || [],
          scrapped_at: scrap.created_at
        }));
        
        setScrappedArticles(formattedScraps);
        
        // 관심 키워드 가져오기
        const { data: keywords, error: keywordsError } = await supabase
          .from('user_keywords')
          .select('keyword')
          .eq('user_id', userId);
          
        if (keywordsError) {
          console.error('관심 키워드 조회 오류:', keywordsError);
        } else {
          setInterestKeywords(keywords.map(k => k.keyword));
        }
      } else if (isDevelopment) {
        // 개발 환경에서 샘플 데이터 사용
        setScrappedArticles([
          {
            id: 'sample-1',
            title: '금융위원회, 디지털 자산 거래소 규제 가이드라인 발표',
            source: '금융위원회',
            source_type: '금융위원회',
            published_at: new Date().toISOString(),
            source_url: 'https://example.com/article1',
            summary: '금융위원회가 국내 디지털 자산 거래소에 대한 규제 가이드라인을 발표했습니다.',
            tags: ['디지털자산', '가상화폐', '금융규제'],
            scrapped_at: new Date().toISOString()
          },
          {
            id: 'sample-2',
            title: '한국은행, 기준금리 동결 결정',
            source: '한국은행',
            source_type: '한국은행',
            published_at: new Date(Date.now() - 86400000).toISOString(),
            source_url: 'https://example.com/article2',
            summary: '한국은행 금융통화위원회가 현재 3.5%인 기준금리를 유지하기로 결정했습니다.',
            tags: ['기준금리', '통화정책', '경제전망'],
            scrapped_at: new Date(Date.now() - 1000000).toISOString()
          },
        ]);
        
        setInterestKeywords(['금융규제', '디지털금융', '소비자보호']);
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      setError(error instanceof Error ? error.message : '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 스크랩 삭제
  const handleRemoveScrap = async (articleId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      
      if (!userId) {
        // 개발 환경에서는 UI만 업데이트
        if (process.env.NODE_ENV !== 'production') {
          setScrappedArticles(prev => prev.filter(article => article.id !== articleId));
          return;
        }
        throw new Error('로그인이 필요합니다.');
      }
      
      const { error } = await supabase
        .from('scraps')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', articleId);
        
      if (error) {
        throw new Error('스크랩 삭제 중 오류가 발생했습니다.');
      }
      
      // UI 업데이트
      setScrappedArticles(prev => prev.filter(article => article.id !== articleId));
    } catch (error) {
      console.error('스크랩 삭제 오류:', error);
      setError(error instanceof Error ? error.message : '작업 처리 중 오류가 발생했습니다.');
    }
  };
  
  // 키워드 추가
  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    
    try {
      // 중복 체크
      if (interestKeywords.includes(newKeyword.trim())) {
        setError('이미 등록된 키워드입니다.');
        return;
      }
      
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      
      if (!userId) {
        // 개발 환경에서는 UI만 업데이트
        if (process.env.NODE_ENV !== 'production') {
          setInterestKeywords(prev => [...prev, newKeyword.trim()]);
          setNewKeyword('');
          return;
        }
        throw new Error('로그인이 필요합니다.');
      }
      
      const { error } = await supabase
        .from('user_keywords')
        .insert({
          user_id: userId,
          keyword: newKeyword.trim()
        });
        
      if (error) {
        throw new Error('키워드 추가 중 오류가 발생했습니다.');
      }
      
      // UI 업데이트
      setInterestKeywords(prev => [...prev, newKeyword.trim()]);
      setNewKeyword('');
    } catch (error) {
      console.error('키워드 추가 오류:', error);
      setError(error instanceof Error ? error.message : '작업 처리 중 오류가 발생했습니다.');
    }
  };
  
  // 키워드 삭제
  const handleRemoveKeyword = async (keyword: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      
      if (!userId) {
        // 개발 환경에서는 UI만 업데이트
        if (process.env.NODE_ENV !== 'production') {
          setInterestKeywords(prev => prev.filter(k => k !== keyword));
          return;
        }
        throw new Error('로그인이 필요합니다.');
      }
      
      const { error } = await supabase
        .from('user_keywords')
        .delete()
        .eq('user_id', userId)
        .eq('keyword', keyword);
        
      if (error) {
        throw new Error('키워드 삭제 중 오류가 발생했습니다.');
      }
      
      // UI 업데이트
      setInterestKeywords(prev => prev.filter(k => k !== keyword));
    } catch (error) {
      console.error('키워드 삭제 오류:', error);
      setError(error instanceof Error ? error.message : '작업 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-2">마이페이지</h1>
      <p className="text-gray-500 mb-6">내 스크랩 보도자료 및 관심 키워드 관리</p>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchUserData}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 로딩 중...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> 새로고침
            </>
          )}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="scraps">스크랩 보도자료</TabsTrigger>
          <TabsTrigger value="keywords">관심 키워드 설정</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scraps" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>데이터를 불러오는 중...</span>
            </div>
          ) : scrappedArticles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>스크랩한 보도자료가 없습니다.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/dashboard')}
              >
                대시보드로 이동
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {scrappedArticles.map((article) => (
                <Card key={article.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {article.source || article.source_type}
                        </Badge>
                        <CardTitle className="text-lg">
                          <Link href={`/articles/${article.id}`} className="hover:underline">
                            {article.title}
                          </Link>
                        </CardTitle>
                        <CardDescription>
                          스크랩: {format(new Date(article.scrapped_at), 'yyyy.MM.dd', { locale: ko })}
                          {article.published_at && (
                            <> • 발행: {format(new Date(article.published_at), 'yyyy.MM.dd', { locale: ko })}</>
                          )}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveScrap(article.id)}
                      >
                        <Trash2 className="h-4 w-4 text-gray-500 hover:text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {article.summary}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {article.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-xs"
                        asChild
                      >
                        <a href={article.source_url} target="_blank" rel="noopener noreferrer">
                          원문 보기 
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">관심 키워드 설정</CardTitle>
              <CardDescription>
                관심 있는 키워드를 등록하면 관련 보도자료를 쉽게 찾을 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <div className="flex-grow">
                  <Input
                    placeholder="키워드 입력 (예: 디지털금융)"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  />
                </div>
                <Button onClick={handleAddKeyword}>
                  <Plus className="h-4 w-4 mr-1" /> 추가
                </Button>
              </div>
              
              <Separator className="mb-4" />
              
              <div className="flex flex-wrap gap-2">
                {interestKeywords.length === 0 ? (
                  <div className="text-center w-full py-4 text-gray-500">
                    <Tag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>등록된 관심 키워드가 없습니다.</p>
                  </div>
                ) : (
                  interestKeywords.map((keyword) => (
                    <div 
                      key={keyword}
                      className="flex items-center gap-1 bg-muted rounded-full px-3 py-1"
                    >
                      <span className="text-sm">{keyword}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 rounded-full"
                        onClick={() => handleRemoveKeyword(keyword)}
                      >
                        <Trash2 className="h-3 w-3 text-gray-500 hover:text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">추천 키워드</CardTitle>
              <CardDescription>
                자주 사용되는 키워드를 참고하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['디지털금융', '소비자보호', '금융규제', 'ESG', '핀테크', '가상자산', '기준금리', '인공지능', '보이스피싱'].map((keyword) => (
                  <Badge 
                    key={keyword} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => {
                      if (!interestKeywords.includes(keyword)) {
                        setNewKeyword(keyword);
                      }
                    }}
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 