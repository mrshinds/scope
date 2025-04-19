'use client';

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Bookmark,
  Clock,
  FileText,
  TrendingUp,
  Building,
  Newspaper,
  AlertTriangle,
  BookmarkPlus,
  BookmarkMinus,
} from "lucide-react"
import { todayIssues, sources, newsItems, tagTrends } from "@/lib/data"
import Link from "next/link"
import { SourceItem, NewsItem } from "@/lib/types"

export default function DashboardPage() {
  const [issues, setIssues] = useState<SourceItem[]>(todayIssues)
  const [news, setNews] = useState<NewsItem[]>(newsItems.slice(0, 3))

  // 스크랩 토글 함수
  const toggleScrap = (id: string, type: "issue" | "news") => {
    if (type === "issue") {
      setIssues(issues.map((issue) => 
        issue.id === id ? { ...issue, isScrapped: !issue.isScrapped } : issue
      ))
    } else {
      setNews(news.map((item) => 
        item.id === id ? { ...item, isScrapped: !item.isScrapped } : item
      ))
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">오늘의 이슈</h1>
          <Button variant="outline" asChild>
            <Link href="/issues">더 보기</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                오늘의 이슈
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{issues.length}</div>
              <p className="text-xs text-muted-foreground">
                최근 업데이트: 오늘
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                미확인 알림
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                최근 확인: 1시간 전
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                이슈 키워드
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tagTrends[0].name}</div>
              <p className="text-xs text-muted-foreground">
                최다 언급: {tagTrends[0].count}회
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                스크랩 자료
              </CardTitle>
              <Bookmark className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {issues.filter((i) => i.isScrapped).length + news.filter((n) => n.isScrapped).length}
              </div>
              <p className="text-xs text-muted-foreground">
                최근 스크랩: 오늘
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">주요 금융당국 보도자료</h2>
          <div className="grid gap-4">
            {issues.map((issue) => (
              <Card key={issue.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-500">
                          {issue.source}
                        </span>
                        <span className="text-xs text-gray-400">
                          {issue.date}
                        </span>
                      </div>
                      <h3 className="font-medium">{issue.title}</h3>
                      <p className="text-sm text-gray-600">{issue.summary}</p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {issue.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 mt-4 md:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleScrap(issue.id, "issue")}
                      >
                        {issue.isScrapped ? (
                          <BookmarkMinus className="h-4 w-4 mr-1" />
                        ) : (
                          <BookmarkPlus className="h-4 w-4 mr-1" />
                        )}
                        {issue.isScrapped ? "스크랩 해제" : "스크랩"}
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={issue.url} target="_blank">
                          <FileText className="h-4 w-4 mr-1" />
                          원문
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">최신 언론보도</h2>
            <Button variant="outline" asChild>
              <Link href="/news">더 보기</Link>
            </Button>
          </div>
          <div className="grid gap-4">
            {news.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Newspaper className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-500">
                          {item.source}
                        </span>
                        <span className="text-xs text-gray-400">
                          {item.date}
                        </span>
                      </div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.summary}</p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 mt-4 md:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleScrap(item.id, "news")}
                      >
                        {item.isScrapped ? (
                          <BookmarkMinus className="h-4 w-4 mr-1" />
                        ) : (
                          <BookmarkPlus className="h-4 w-4 mr-1" />
                        )}
                        {item.isScrapped ? "스크랩 해제" : "스크랩"}
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={item.url} target="_blank">
                          <FileText className="h-4 w-4 mr-1" />
                          원문
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 