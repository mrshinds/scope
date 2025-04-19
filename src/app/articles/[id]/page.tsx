'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ExternalLink, Pencil, Save, Check, Tag, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

export default function ArticleDetailPage() {
  const { id } = useParams();
  
  const [article, setArticle] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [manualSummary, setManualSummary] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const fetchArticleData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);

        // 기사 데이터 가져오기
        const response = await fetch(`/api/articles/${id}`);
        
        if (!response.ok) {
          throw new Error('기사를 불러오는데 실패했습니다');
        }

        const data = await response.json();
        setArticle(data.article);
        setSummary(data.summary);
        setTags(data.article?.tags || []);
        setManualSummary(data.summary?.manual_summary || '');
        
        // 세션 정보 확인 (Supabase Auth)
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          // 사용자 정보 가져오기
          const { data: userData } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', sessionData.session.user.id)
            .single();
          
          setIsAdmin(userData?.is_admin || false);
        }
      } catch (err: any) {
        console.error('기사 데이터 로드 오류:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticleData();
  }, [id]);

  // 수동 요약문 저장
  const saveManualSummary = async () => {
    if (!id || !summary) return;
    
    try {
      setSaving(true);
      setSaveError(null);
      
      const response = await fetch(`/api/summaries/${summary.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ manual_summary: manualSummary }),
      });

      if (!response.ok) {
        throw new Error('요약문 저장에 실패했습니다');
      }

      // 요약 데이터 업데이트
      const updatedSummary = await response.json();
      setSummary({...summary, manual_summary: manualSummary});
      setEditingSummary(false);
      setIsSaved(true);
      
      // 저장 성공 표시 3초 후 제거
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error('요약문 저장 오류:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 태그 추가
  const addTag = async () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) {
      setNewTag('');
      return;
    }
    
    try {
      setSaving(true);
      
      // 임시 UI 업데이트
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setNewTag('');
      
      // API 호출로 태그 저장
      const response = await fetch(`/api/articles/${id}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tag: newTag.trim() }),
      });

      if (!response.ok) {
        // 실패 시 태그 제거
        setTags(tags);
        throw new Error('태그 추가에 실패했습니다');
      }
    } catch (err: any) {
      console.error('태그 추가 오류:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 태그 삭제
  const removeTag = async (tagToRemove: string) => {
    try {
      setSaving(true);
      
      // 임시 UI 업데이트
      const updatedTags = tags.filter(tag => tag !== tagToRemove);
      setTags(updatedTags);
      
      // API 호출로 태그 삭제
      const response = await fetch(`/api/articles/${id}/tags`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tag: tagToRemove }),
      });

      if (!response.ok) {
        // 실패 시 태그 복원
        setTags(tags);
        throw new Error('태그 삭제에 실패했습니다');
      }
    } catch (err: any) {
      console.error('태그 삭제 오류:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 날짜 포맷팅
  const formattedDate = article?.published_at ? 
    format(parseISO(article.published_at), 'yyyy년 MM월 dd일', { locale: ko }) : '';

  if (loading) {
    return (
      <div className="container py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>기사 정보를 불러오는 중...</span>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <AlertDescription>
            {error || '기사를 찾을 수 없습니다'}
          </AlertDescription>
        </Alert>
        <Button variant="ghost" className="mt-4" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            대시보드로 돌아가기
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            대시보드로 돌아가기
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>{article.source || article.source_type}</Badge>
                <span className="text-sm text-gray-500">{formattedDate}</span>
              </div>
              <CardTitle className="text-2xl font-bold">{article.title}</CardTitle>
            </div>
            
            {article.source_url && (
              <Button variant="outline" asChild>
                <Link href={article.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  원문 보기
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* 태그 섹션 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                태그
              </h3>
              {isAdmin && !editingTags && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setEditingTags(true)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  태그 편집
                </Button>
              )}
              {isAdmin && editingTags && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setEditingTags(false)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  완료
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge 
                  key={tag} 
                  variant={editingTags ? "outline" : "secondary"}
                  className={editingTags ? "pr-1" : ""}
                >
                  {tag}
                  {editingTags && (
                    <button 
                      className="ml-1 hover:text-destructive" 
                      onClick={() => removeTag(tag)}
                    >
                      ✕
                    </button>
                  )}
                </Badge>
              ))}
              
              {editingTags && (
                <div className="flex items-center gap-2 mt-2 w-full">
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder="새 태그 추가"
                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    onKeyDown={e => e.key === 'Enter' && addTag()}
                  />
                  <Button size="sm" onClick={addTag} disabled={saving}>
                    추가
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* 요약 섹션 */}
          <Tabs defaultValue="gpt">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="gpt">AI 요약</TabsTrigger>
                <TabsTrigger value="manual">수동 요약</TabsTrigger>
                {summary?.full_text && <TabsTrigger value="full">전체 내용</TabsTrigger>}
              </TabsList>

              {isAdmin && !editingSummary && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setEditingSummary(true)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  요약 편집
                </Button>
              )}
            </div>

            <TabsContent value="gpt" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>
                    GPT-4 모델로 자동 생성된 요약
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{summary?.summary || '자동 요약이 없습니다.'}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>
                    관리자가 직접 작성한 수동 요약
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {editingSummary ? (
                    <div className="space-y-4">
                      <Textarea
                        value={manualSummary}
                        onChange={e => setManualSummary(e.target.value)}
                        placeholder="수동 요약을 입력하세요..."
                        className="min-h-[150px]"
                      />
                      {saveError && (
                        <Alert variant="destructive">
                          <AlertDescription>{saveError}</AlertDescription>
                        </Alert>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setManualSummary(summary?.manual_summary || '');
                            setEditingSummary(false);
                          }}
                        >
                          취소
                        </Button>
                        <Button 
                          onClick={saveManualSummary} 
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              저장 중...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              저장
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {summary?.manual_summary ? (
                        <p>{summary.manual_summary}</p>
                      ) : (
                        <p className="text-gray-500 italic">수동 요약이 없습니다.</p>
                      )}
                      {isSaved && (
                        <div className="mt-4 text-green-600 flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          성공적으로 저장되었습니다.
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {summary?.full_text && (
              <TabsContent value="full" className="mt-0">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>
                      전체 내용
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap">{summary.full_text}</div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 