'use client';

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building,
  FileText,
  SearchIcon,
  BookmarkPlus,
  BookmarkMinus,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { todayIssues } from "@/lib/data";
import { SourceItem } from "@/lib/types";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function IssuesPage() {
  const [issues, setIssues] = useState<SourceItem[]>(todayIssues);
  const [searchQuery, setSearchQuery] = useState("");

  // 검색 필터링된 이슈
  const filteredIssues = issues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      issue.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 스크랩 토글 함수
  const toggleScrap = (id: string) => {
    setIssues(
      issues.map((issue) =>
        issue.id === id ? { ...issue, isScrapped: !issue.isScrapped } : issue
      )
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">금융 이슈</h1>
          <p className="text-muted-foreground">
            금융당국 및 관련기관에서 발표한 주요 이슈를 확인하세요.
          </p>
        </div>

        <div className="flex w-full max-w-sm items-center space-x-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="이슈 검색..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredIssues.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500 mb-4" />
              <p className="text-muted-foreground mb-2">검색 결과가 없습니다.</p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                필터 초기화
              </Button>
            </Card>
          ) : (
            filteredIssues.map((issue) => (
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
                        onClick={() => toggleScrap(issue.id)}
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
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 