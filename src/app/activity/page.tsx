'use client';

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Calendar, DownloadCloud } from "lucide-react"
import { activityLogs } from "@/lib/data"
import { useState } from "react"
import { Input } from "@/components/ui/input"

export default function ActivityPage() {
  const [logs, setLogs] = useState(activityLogs);
  const [searchQuery, setSearchQuery] = useState("");

  // 검색 필터링
  const filteredLogs = logs.filter(log => 
    searchQuery === "" || 
    log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.timestamp.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">활동 로그</h1>
          <p className="text-muted-foreground">
            사용자 활동 기록을 확인할 수 있습니다.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="사용자, 활동 검색..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-1" />
              날짜 필터
            </Button>
            <Button variant="outline" size="sm">
              <DownloadCloud className="h-4 w-4 mr-1" />
              내보내기
            </Button>
          </div>
        </div>
        
        {filteredLogs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">활동 로그가 없습니다.</p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              필터 초기화
            </Button>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>활동 내역</CardTitle>
              <CardDescription>
                최근 활동 기록을 확인합니다. (최대 100개)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 gap-4 py-3 px-4 text-sm font-medium text-muted-foreground bg-muted">
                    <div className="col-span-2">시간</div>
                    <div className="col-span-3">사용자</div>
                    <div className="col-span-7">활동</div>
                  </div>
                  <div className="divide-y">
                    {filteredLogs.map((log) => (
                      <div key={log.id} className="grid grid-cols-12 gap-4 py-3 px-4 hover:bg-muted/50">
                        <div className="col-span-2 text-sm text-muted-foreground">
                          {log.timestamp.split(' ')[1]}
                        </div>
                        <div className="col-span-3 text-sm font-medium">
                          {log.user}
                        </div>
                        <div className="col-span-7 text-sm">
                          {log.action}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button variant="outline">더 보기</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
} 