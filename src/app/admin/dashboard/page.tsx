'use client';

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { activityLogs, tagTrends } from "@/lib/data"
import { useState } from "react"
import { BarChart, LineChart, PieChart } from "lucide-react"

export default function AdminDashboardPage() {
  return (
    <DashboardLayout isAdmin={true}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">관리자 대시보드</h1>
          <p className="text-muted-foreground">
            시스템 현황과 사용자 활동을 모니터링할 수 있습니다.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">등록 사용자</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">143</div>
              <p className="text-xs text-muted-foreground">
                +5 사용자 (지난주 대비)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">일일 활성 사용자</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">72</div>
              <p className="text-xs text-muted-foreground">
                +12% (전월 대비)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">수집된 총 자료</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,457</div>
              <p className="text-xs text-muted-foreground">
                오늘 25개 추가
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">스크랩 건수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">782</div>
              <p className="text-xs text-muted-foreground">
                +8% (전월 대비)
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>인기 태그</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>
                가장 많이 사용된 태그 (최근 30일)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tagTrends.map((tag) => (
                  <div key={tag.name} className="flex items-center">
                    <div className="w-1/3 text-sm font-medium">{tag.name}</div>
                    <div className="w-2/3 flex items-center gap-2">
                      <div 
                        className="h-2 bg-shinhan-blue rounded"
                        style={{ width: `${(tag.count / tagTrends[0].count) * 100}%` }}
                      />
                      <span className="text-sm text-muted-foreground">{tag.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>최근 활동</CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>
                최근 사용자 활동 내역
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="text-sm font-medium">{log.user}</p>
                      <p className="text-xs text-muted-foreground">{log.action}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                  </div>
                ))}
                <div className="flex justify-center">
                  <Button variant="outline" size="sm">모든 활동 보기</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>월간 사용자 활동</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>
              사용자 활동 추이 (최근 30일)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between gap-2">
              {Array.from({ length: 14 }).map((_, i) => {
                const height = Math.floor(Math.random() * 70) + 30;
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div 
                      className="w-10 bg-shinhan-blue rounded-t"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-muted-foreground">{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 