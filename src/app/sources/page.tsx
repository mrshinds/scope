'use client';

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bookmark, ExternalLink, Search, Filter } from "lucide-react"
import { sources } from "@/lib/data"
import { useState } from "react"
import { Input } from "@/components/ui/input"

export default function SourcesPage() {
  const [sourceItems, setSourceItems] = useState(sources);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  // 스크랩 토글 함수
  const toggleScrap = (id: string) => {
    setSourceItems(sourceItems.map(item => 
      item.id === id ? { ...item, isScrapped: !item.isScrapped } : item
    ));
  };

  // 검색 함수
  const filteredSources = sourceItems.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSource = !sourceFilter || item.source === sourceFilter;
    
    return matchesSearch && matchesSource;
  });

  // 고유한 기관 목록 생성
  const uniqueSources = Array.from(new Set(sourceItems.map(item => item.source)));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">보도자료</h1>
          <p className="text-muted-foreground">
            기관별/언론사별 보도자료를 확인할 수 있습니다.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="키워드, 기관명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex overflow-x-auto pb-2 md:pb-0 space-x-2">
              <Button 
                variant={!sourceFilter ? "secondary" : "outline"} 
                size="sm"
                onClick={() => setSourceFilter(null)}
              >
                전체 기관
              </Button>
              
              {uniqueSources.map(source => (
                <Button
                  key={source}
                  variant={sourceFilter === source ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setSourceFilter(source)}
                >
                  {source}
                </Button>
              ))}
            </div>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              필터
            </Button>
          </div>
        </div>
        
        {filteredSources.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">검색 결과가 없습니다.</p>
            <Button variant="outline" onClick={() => {setSearchQuery(""); setSourceFilter(null)}}>
              필터 초기화
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredSources.map((source) => (
              <Card key={source.id} className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex justify-between">
                    <div>
                      <CardTitle>{source.title}</CardTitle>
                      <CardDescription>
                        {source.source} | {source.date}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleScrap(source.id)}
                    >
                      <Bookmark className={`h-5 w-5 ${source.isScrapped ? 'fill-shinhan-blue text-shinhan-blue' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {source.summary}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                      {source.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      원문 보기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 