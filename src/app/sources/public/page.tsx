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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Filter,
  FileText,
  Bookmark,
  ExternalLink,
  Edit,
  Loader2,
  AlertCircle,
  Clock,
  ArrowDownUp,
  Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCurrentUser, isAdmin } from '@/lib/supabase';

// 샘플 데이터 타입
interface PressRelease {
  id: string;
  title: string;
  source: string;
  source_type: string;
  published_at: string;
  source_url: string;
  summary: string;
  tags: string[];
  attachment_url?: string;
}

export default function PublicSourcesPage() {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pressReleases, setPressReleases] = useState<PressRelease[]>([]);
  const [filteredReleases, setFilteredReleases] = useState<PressRelease[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // 관리자 관련 상태
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
  const [editSummary, setEditSummary] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // 사용자 권한 확인
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await isAdmin();
        setIsUserAdmin(adminStatus);
      } catch (error) {
        console.error('관리자 권한 확인 오류:', error);
        setIsUserAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  // 데이터 로드
  useEffect(() => {
    fetchPressReleases();
  }, []);
  
  // 필터링 적용
  useEffect(() => {
    applyFilters();
  }, [pressReleases, searchTerm, sourceFilter, selectedTags, sortOrder]);
  
  // 보도자료 데이터 가져오기
  const fetchPressReleases = async () => {
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
        .eq('source_type', '정부부처')
        .order('published_at', { ascending: false });
      
      if (error) {
        throw new Error('보도자료 데이터를 가져오는 중 오류가 발생했습니다.');
      }
      
      // 데이터 변환
      const formattedReleases = data.map((release: any) => ({
        id: release.id,
        title: release.title,
        source: release.source_name,
        source_type: release.source_type,
        published_at: release.published_at,
        source_url: release.source_url,
        summary: release.summaries?.[0]?.summary || '',
        tags: release.article_tags?.map((t: any) => t.tag) || [],
      }));
      
      setPressReleases(formattedReleases);
      
      // 태그 목록 수집
      const uniqueTags = new Set<string>();
      formattedReleases.forEach((release: PressRelease) => {
        release.tags.forEach(tag => uniqueTags.add(tag));
      });
      
      setAvailableTags(Array.from(uniqueTags));
      
      // 개발 모드에서 데이터가 없으면 샘플 데이터 사용
      if (formattedReleases.length === 0 && process.env.NODE_ENV !== 'production') {
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
    const sampleReleases: PressRelease[] = [
      {
        id: 'sample-1',
        title: '금융위원회, 디지털 자산 거래소 규제 가이드라인 발표',
        source: '금융위원회',
        source_type: '정부부처',
        published_at: new Date().toISOString(),
        source_url: 'https://example.com/fsc/article1',
        attachment_url: 'https://example.com/fsc/article1.pdf',
        summary: '금융위원회가 국내 디지털 자산 거래소에 대한 규제 가이드라인을 발표했습니다. 이번 가이드라인은 투자자 보호와 시장 안정성을 높이기 위한 조치로, 내년부터 적용될 예정입니다.',
        tags: ['디지털자산', '가상화폐', '금융규제']
      },
      {
        id: 'sample-2',
        title: '한국은행, 기준금리 동결 결정',
        source: '한국은행',
        source_type: '정부부처',
        published_at: new Date(Date.now() - 86400000).toISOString(),
        source_url: 'https://example.com/bok/article2',
        attachment_url: 'https://example.com/bok/article2.pdf',
        summary: '한국은행 금융통화위원회가 현재 3.5%인 기준금리를 유지하기로 결정했습니다. 위원회는 국내외 경제 불확실성과 물가 상승 압력 등을 고려해 금리 동결을 선택했다고 밝혔습니다.',
        tags: ['기준금리', '통화정책', '경제전망']
      },
      {
        id: 'sample-3',
        title: '금융감독원, 은행권 ESG 경영 평가 결과 발표',
        source: '금융감독원',
        source_type: '정부부처',
        published_at: new Date(Date.now() - 172800000).toISOString(),
        source_url: 'https://example.com/fss/article3',
        attachment_url: 'https://example.com/fss/article3.pdf',
        summary: '금융감독원이 국내 은행들의 ESG 경영 현황에 대한 평가 결과를 발표했습니다. 평가 결과에 따르면 대부분의 은행들이 환경 및 사회적 책임 부문에서 개선이 필요하다는 제언이 있었습니다.',
        tags: ['ESG', '금융감독', '지속가능경영']
      },
      {
        id: 'sample-4',
        title: '공정거래위원회, 온라인 플랫폼 공정화법 시행방안 마련',
        source: '공정거래위원회',
        source_type: '정부부처',
        published_at: new Date(Date.now() - 259200000).toISOString(),
        source_url: 'https://example.com/ftc/article4',
        attachment_url: 'https://example.com/ftc/article4.pdf',
        summary: '공정거래위원회가 내년 시행 예정인 온라인 플랫폼 공정화법의 세부 시행방안을 마련했습니다. 이번 방안에는 플랫폼 사업자의 의무와 판매자 보호 조치 등이 포함되어 있습니다.',
        tags: ['공정거래', '온라인플랫폼', '법률']
      },
      {
        id: 'sample-5',
        title: '과학기술정보통신부, 인공지능 윤리기준 개정안 발표',
        source: '과학기술정보통신부',
        source_type: '정부부처',
        published_at: new Date(Date.now() - 345600000).toISOString(),
        source_url: 'https://example.com/msit/article5',
        attachment_url: 'https://example.com/msit/article5.pdf',
        summary: '과학기술정보통신부가 인공지능 기술 발전에 따른 윤리기준 개정안을 발표했습니다. 개정안에는 생성형 AI에 대한 책임성 강화와 사용자 보호를 위한 내용이 추가되었습니다.',
        tags: ['인공지능', '디지털정책', '윤리']
      }
    ];
    
    setPressReleases(sampleReleases);
    
    // 태그 목록 수집
    const uniqueTags = new Set<string>();
    sampleReleases.forEach((release) => {
      release.tags.forEach(tag => uniqueTags.add(tag));
    });
    
    setAvailableTags(Array.from(uniqueTags));
  };
  
  // 필터 적용
  const applyFilters = () => {
    let filtered = [...pressReleases];
    
    // 소스 필터
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(release => release.source === sourceFilter);
    }
    
    // 태그 필터
    if (selectedTags.length > 0) {
      filtered = filtered.filter(release => 
        selectedTags.every(tag => release.tags.includes(tag))
      );
    }
    
    // 검색어 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(release =>
        release.title.toLowerCase().includes(searchLower) ||
        release.summary.toLowerCase().includes(searchLower) ||
        release.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // 정렬 적용
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredReleases(filtered);
  };
  
  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  // 태그 토글
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  // 필터 초기화
  const resetFilters = () => {
    setSearchTerm('');
    setSourceFilter('all');
    setSelectedTags([]);
    setSortOrder('latest');
  };
  
  // 요약 수정 모달 열기
  const openEditModal = (release: PressRelease) => {
    setSelectedReleaseId(release.id);
    setEditSummary(release.summary);
    setEditTags([...release.tags]);
  };
  
  // 태그 추가
  const handleAddTag = () => {
    if (newTag && !editTags.includes(newTag)) {
      setEditTags(prev => [...prev, newTag]);
      setNewTag('');
    }
  };
  
  // 태그 삭제
  const handleRemoveTag = (tag: string) => {
    setEditTags(prev => prev.filter(t => t !== tag));
  };
  
  // 요약 및 태그 저장
  const saveChanges = async () => {
    if (!selectedReleaseId) return;
    
    setIsSaving(true);
    
    try {
      // 요약 업데이트
      const { error: summaryError } = await supabase
        .from('summaries')
        .update({ summary: editSummary, manual_summary: editSummary })
        .eq('article_id', selectedReleaseId);
      
      if (summaryError) {
        throw new Error('요약 업데이트 중 오류가 발생했습니다.');
      }
      
      // 기존 태그 삭제
      const { error: deleteError } = await supabase
        .from('article_tags')
        .delete()
        .eq('article_id', selectedReleaseId);
      
      if (deleteError) {
        throw new Error('태그 삭제 중 오류가 발생했습니다.');
      }
      
      // 새 태그 추가
      for (const tag of editTags) {
        // 태그 테이블에 추가 (존재하지 않는 경우)
        await supabase
          .from('tags')
          .upsert({ name: tag })
          .select();
        
        // 기사-태그 연결
        const { error: tagError } = await supabase
          .from('article_tags')
          .insert({ article_id: selectedReleaseId, tag });
        
        if (tagError) {
          console.error('태그 추가 오류:', tagError);
        }
      }
      
      // UI 업데이트
      setPressReleases(prev => prev.map(release => 
        release.id === selectedReleaseId
          ? { ...release, summary: editSummary, tags: editTags }
          : release
      ));
      
      // 태그 목록 업데이트
      const uniqueTags = new Set<string>();
      [...pressReleases, { id: selectedReleaseId, tags: editTags } as any].forEach(release => {
        release.tags.forEach((tag: string) => uniqueTags.add(tag));
      });
      
      setAvailableTags(Array.from(uniqueTags));
      
      // 모달 닫기
      setSelectedReleaseId(null);
      
    } catch (error) {
      console.error('변경사항 저장 오류:', error);
      alert('변경사항 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-2">정부부처 보도자료</h1>
      <p className="text-gray-500 mb-6">금융위원회, 금감원, 한국은행 등 정부부처 보도자료 모음</p>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* 검색 및 필터 */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="보도자료 검색..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="기관 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 기관</SelectItem>
                <SelectItem value="금융위원회">금융위원회</SelectItem>
                <SelectItem value="금융감독원">금융감독원</SelectItem>
                <SelectItem value="한국은행">한국은행</SelectItem>
                <SelectItem value="공정거래위원회">공정거래위원회</SelectItem>
                <SelectItem value="과학기술정보통신부">과학기술정보통신부</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className="flex gap-2" 
              onClick={() => setSortOrder(sortOrder === 'latest' ? 'oldest' : 'latest')}
            >
              <ArrowDownUp className="h-4 w-4" />
              {sortOrder === 'latest' ? '최신순' : '오래된순'}
            </Button>
            <Button type="submit">검색</Button>
          </div>
        </form>
      </div>
      
      {/* 태그 필터 */}
      {availableTags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">태그 필터</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <Badge 
                key={tag} 
                variant={selectedTags.includes(tag) ? "default" : "outline"} 
                className="cursor-pointer"
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* 필터 상태 표시 */}
      {(sourceFilter !== 'all' || selectedTags.length > 0 || searchTerm) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">필터:</span>
            {sourceFilter !== 'all' && (
              <Badge variant="secondary">
                {sourceFilter}
              </Badge>
            )}
            {selectedTags.map(tag => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            {searchTerm && (
              <Badge variant="secondary">
                "{searchTerm}"
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
          >
            필터 초기화
          </Button>
        </div>
      )}
      
      <Separator className="mb-6" />
      
      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>데이터를 불러오는 중...</span>
        </div>
      )}
      
      {/* 결과 없음 */}
      {!isLoading && filteredReleases.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
      
      {/* 보도자료 목록 */}
      {!isLoading && filteredReleases.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {filteredReleases.map((release) => (
            <Card key={release.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{release.source}</Badge>
                      <span className="text-xs text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {format(new Date(release.published_at), 'yyyy.MM.dd', { locale: ko })}
                      </span>
                    </div>
                    <CardTitle className="text-xl">
                      <Link href={`/articles/${release.id}`} className="hover:underline">
                        {release.title}
                      </Link>
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    {isUserAdmin && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditModal(release)}
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>요약 및 태그 수정</DialogTitle>
                            <DialogDescription>
                              보도자료의 요약 내용과 태그를 수정합니다. 수정된 내용은 즉시 반영됩니다.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="edit-summary">요약</Label>
                              <Textarea
                                id="edit-summary"
                                value={editSummary}
                                onChange={(e) => setEditSummary(e.target.value)}
                                rows={6}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>태그</Label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {editTags.map(tag => (
                                  <Badge 
                                    key={tag} 
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {tag}
                                    <button 
                                      onClick={() => handleRemoveTag(tag)} 
                                      className="text-xs font-medium ml-1"
                                    >
                                      ✕
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="새 태그 입력"
                                  value={newTag}
                                  onChange={(e) => setNewTag(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                />
                                <Button type="button" onClick={handleAddTag}>추가</Button>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">취소</Button>
                            </DialogClose>
                            <Button 
                              onClick={saveChanges} 
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 저장 중...
                                </>
                              ) : (
                                <>
                                  <Check className="mr-2 h-4 w-4" /> 저장
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      asChild
                    >
                      <a href={release.source_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 text-gray-500" />
                      </a>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      asChild
                    >
                      <Link href={`/articles/${release.id}`}>
                        <FileText className="h-4 w-4 text-gray-500" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  {release.summary}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {release.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div>
                  {release.attachment_url && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="px-0"
                      asChild
                    >
                      <a 
                        href={release.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <FileText className="h-4 w-4 mr-1" /> 첨부파일
                      </a>
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-gray-500"
                    asChild
                  >
                    <a 
                      href={release.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      원문 보기
                    </a>
                  </Button>
                  <Button 
                    variant="link" 
                    size="sm"
                    asChild
                  >
                    <Link href={`/articles/${release.id}`}>
                      상세 보기
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 