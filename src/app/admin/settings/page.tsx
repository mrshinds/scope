'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { AdminForceLogin } from '../components/admin-force-login';
import { Separator } from "@/components/ui/separator"
import { useAdminToken } from '../components/admin-token-provider';

export default function AdminSettingsPage() {
  // useAdminToken 훅을 통해 관리자 토큰 가져오기
  const { adminToken, isTokenLoaded } = useAdminToken();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">설정</h3>
          <p className="text-sm text-muted-foreground">
            관리자 설정을 관리합니다.
          </p>
        </div>
        
        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="general">일반</TabsTrigger>
            <TabsTrigger value="notifications">알림</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <Label htmlFor="site-title">사이트 제목</Label>
                <Input id="site-title" placeholder="사이트 제목" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-description">사이트 설명</Label>
                <Textarea id="site-description" placeholder="사이트 설명" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>변경사항 저장</Button>
            </div>
          </TabsContent>
          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <Label htmlFor="email-notifications">이메일 알림</Label>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="email-notifications" />
                  <label htmlFor="email-notifications">활성화</label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-template">이메일 템플릿</Label>
                <Textarea id="email-template" placeholder="이메일 템플릿" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>변경사항 저장</Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* 관리자 설정 섹션 이후에 강제 로그인 컴포넌트 추가 */}
        <div className="space-y-6 mt-6">
          <div>
            <h3 className="text-lg font-medium">사용자 관리</h3>
            <p className="text-sm text-muted-foreground">
              사용자 계정 관리 및 강제 로그인 기능
            </p>
          </div>
          <Separator />
          
          {/* 토큰이 로드된 경우에만 컴포넌트 표시 */}
          {isTokenLoaded && <AdminForceLogin adminToken={adminToken} />}
        </div>
      </div>
    </DashboardLayout>
  )
} 