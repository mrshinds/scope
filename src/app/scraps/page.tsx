'use client';

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bookmark, ExternalLink, Search, Edit, Trash2, Save } from "lucide-react"
import { scrappedItems } from "@/lib/data"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

export default function ScrapsPage() {
  const [items, setItems] = useState(scrappedItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemo, setEditMemo] = useState("");

  // 스크랩 제거 함수
  const removeScrap = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // 메모 편집 시작
  const startEditing = (id: string, currentMemo: string) => {
    setEditingId(id);
    setEditMemo(currentMemo);
  };

  // 메모 저장
  const saveMemo = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, memo: editMemo } : item
    ));
    setEditingId(null);
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingId(null);
  };

  // 검색 필터링
  const filteredItems = items.filter(item => 
    searchQuery === "" || 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.memo?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">스크랩</h1>
          <p className="text-muted-foreground">
            스크랩한 보도자료와 이슈를 확인하고 관리할 수 있습니다.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="스크랩 내용, 메모 검색..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="issue">이슈</TabsTrigger>
            <TabsTrigger value="source">보도자료</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            {filteredItems.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">스크랩한 항목이 없습니다.</p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  필터 초기화
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="transition-all hover:shadow-md">
                    <CardHeader>
                      <div className="flex justify-between">
                        <div>
                          <CardTitle>{item.title}</CardTitle>
                          <CardDescription>
                            {item.source} | {item.date}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEditing(item.id, item.memo || "")}>
                              <Edit className="mr-2 h-4 w-4" />
                              메모 편집
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => removeScrap(item.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              스크랩 삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {item.summary}
                      </p>
                      
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">메모:</p>
                          <Textarea
                            value={editMemo}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditMemo(e.target.value)}
                            placeholder="스크랩에 대한 메모를 입력하세요..."
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <Button variant="outline" size="sm" onClick={cancelEditing}>
                              취소
                            </Button>
                            <Button size="sm" onClick={() => saveMemo(item.id)}>
                              <Save className="mr-2 h-4 w-4" />
                              저장
                            </Button>
                          </div>
                        </div>
                      ) : item.memo ? (
                        <div className="mb-4">
                          <p className="text-sm font-medium">메모:</p>
                          <p className="text-sm p-3 bg-muted rounded-md">{item.memo}</p>
                        </div>
                      ) : null}
                      
                      <div className="flex justify-between items-center">
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
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
          </TabsContent>
          <TabsContent value="issue" className="mt-4">
            {filteredItems.filter(item => item.type === 'issue').length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">스크랩한 이슈가 없습니다.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredItems.filter(item => item.type === 'issue').map((item) => (
                  <Card key={item.id} className="transition-all hover:shadow-md">
                    <CardHeader>
                      <div className="flex justify-between">
                        <div>
                          <CardTitle>{item.title}</CardTitle>
                          <CardDescription>
                            {item.source} | {item.date}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEditing(item.id, item.memo || "")}>
                              <Edit className="mr-2 h-4 w-4" />
                              메모 편집
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => removeScrap(item.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              스크랩 삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {item.summary}
                      </p>
                      
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">메모:</p>
                          <Textarea
                            value={editMemo}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditMemo(e.target.value)}
                            placeholder="스크랩에 대한 메모를 입력하세요..."
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <Button variant="outline" size="sm" onClick={cancelEditing}>
                              취소
                            </Button>
                            <Button size="sm" onClick={() => saveMemo(item.id)}>
                              <Save className="mr-2 h-4 w-4" />
                              저장
                            </Button>
                          </div>
                        </div>
                      ) : item.memo ? (
                        <div className="mb-4">
                          <p className="text-sm font-medium">메모:</p>
                          <p className="text-sm p-3 bg-muted rounded-md">{item.memo}</p>
                        </div>
                      ) : null}
                      
                      <div className="flex justify-between items-center">
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
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
          </TabsContent>
          <TabsContent value="source" className="mt-4">
            {filteredItems.filter(item => item.type === 'source').length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">스크랩한 보도자료가 없습니다.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredItems.filter(item => item.type === 'source').map((item) => (
                  <Card key={item.id} className="transition-all hover:shadow-md">
                    <CardHeader>
                      <div className="flex justify-between">
                        <div>
                          <CardTitle>{item.title}</CardTitle>
                          <CardDescription>
                            {item.source} | {item.date}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEditing(item.id, item.memo || "")}>
                              <Edit className="mr-2 h-4 w-4" />
                              메모 편집
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => removeScrap(item.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              스크랩 삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {item.summary}
                      </p>
                      
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">메모:</p>
                          <Textarea
                            value={editMemo}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditMemo(e.target.value)}
                            placeholder="스크랩에 대한 메모를 입력하세요..."
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <Button variant="outline" size="sm" onClick={cancelEditing}>
                              취소
                            </Button>
                            <Button size="sm" onClick={() => saveMemo(item.id)}>
                              <Save className="mr-2 h-4 w-4" />
                              저장
                            </Button>
                          </div>
                        </div>
                      ) : item.memo ? (
                        <div className="mb-4">
                          <p className="text-sm font-medium">메모:</p>
                          <p className="text-sm p-3 bg-muted rounded-md">{item.memo}</p>
                        </div>
                      ) : null}
                      
                      <div className="flex justify-between items-center">
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
} 