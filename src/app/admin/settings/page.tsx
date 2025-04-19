'use client';

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export default function AdminSettingsPage() {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "SCOPE",
    companyName: "신한은행 소비자보호부",
    maxUsers: "200",
    dataRetention: "365"
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpServer: "smtp.shinhan.com",
    smtpPort: "587",
    emailUsername: "no-reply@shinhan.com",
    emailPassword: "••••••••••••",
    senderName: "SCOPE 시스템"
  });

  const [apiSettings, setApiSettings] = useState({
    apiKey: "sk_live_••••••••••••••••••••••••••••",
    apiEndpoint: "https://api.scope.shinhan.com/v1",
    maxRequests: "1000",
    rateLimitPeriod: "60"
  });

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setGeneralSettings({
      ...generalSettings,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailSettings({
      ...emailSettings,
      [e.target.name]: e.target.value
    });
  };

  const handleApiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiSettings({
      ...apiSettings,
      [e.target.name]: e.target.value
    });
  };

  return (
    <DashboardLayout isAdmin={true}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">설정</h1>
          <p className="text-muted-foreground">
            시스템 설정을 관리할 수 있습니다.
          </p>
        </div>
        
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">일반 설정</TabsTrigger>
            <TabsTrigger value="email">이메일 설정</TabsTrigger>
            <TabsTrigger value="api">API 설정</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>일반 설정</CardTitle>
                <CardDescription>
                  시스템의 기본 설정을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="siteName" className="text-sm font-medium">사이트 이름</label>
                    <Input 
                      id="siteName" 
                      name="siteName"
                      value={generalSettings.siteName} 
                      onChange={handleGeneralChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="companyName" className="text-sm font-medium">회사/부서 이름</label>
                    <Input 
                      id="companyName" 
                      name="companyName"
                      value={generalSettings.companyName} 
                      onChange={handleGeneralChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="maxUsers" className="text-sm font-medium">최대 사용자 수</label>
                    <Input 
                      id="maxUsers" 
                      name="maxUsers"
                      type="number"
                      value={generalSettings.maxUsers} 
                      onChange={handleGeneralChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="dataRetention" className="text-sm font-medium">데이터 보존 기간 (일)</label>
                    <Input 
                      id="dataRetention" 
                      name="dataRetention"
                      type="number"
                      value={generalSettings.dataRetention} 
                      onChange={handleGeneralChange} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="welcomeMessage" className="text-sm font-medium">환영 메시지</label>
                  <Textarea 
                    id="welcomeMessage" 
                    name="welcomeMessage"
                    placeholder="새 사용자를 위한 환영 메시지를 입력하세요." 
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex justify-end">
                  <Button>저장</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="email" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>이메일 설정</CardTitle>
                <CardDescription>
                  이메일 알림을 위한 설정을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="smtpServer" className="text-sm font-medium">SMTP 서버</label>
                    <Input 
                      id="smtpServer" 
                      name="smtpServer"
                      value={emailSettings.smtpServer} 
                      onChange={handleEmailChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="smtpPort" className="text-sm font-medium">SMTP 포트</label>
                    <Input 
                      id="smtpPort" 
                      name="smtpPort"
                      value={emailSettings.smtpPort} 
                      onChange={handleEmailChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="emailUsername" className="text-sm font-medium">이메일 사용자명</label>
                    <Input 
                      id="emailUsername" 
                      name="emailUsername"
                      value={emailSettings.emailUsername} 
                      onChange={handleEmailChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="emailPassword" className="text-sm font-medium">이메일 비밀번호</label>
                    <Input 
                      id="emailPassword" 
                      name="emailPassword"
                      type="password"
                      value={emailSettings.emailPassword} 
                      onChange={handleEmailChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="senderName" className="text-sm font-medium">발신자 이름</label>
                    <Input 
                      id="senderName" 
                      name="senderName"
                      value={emailSettings.senderName} 
                      onChange={handleEmailChange} 
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline">테스트 이메일 보내기</Button>
                  <Button>저장</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="api" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>API 설정</CardTitle>
                <CardDescription>
                  외부 서비스 연동을 위한 API 설정을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="apiKey" className="text-sm font-medium">API 키</label>
                    <div className="flex">
                      <Input 
                        id="apiKey" 
                        name="apiKey"
                        type="password"
                        value={apiSettings.apiKey} 
                        onChange={handleApiChange} 
                        className="flex-1 rounded-r-none"
                      />
                      <Button variant="outline" className="rounded-l-none">보기</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="apiEndpoint" className="text-sm font-medium">API 엔드포인트</label>
                    <Input 
                      id="apiEndpoint" 
                      name="apiEndpoint"
                      value={apiSettings.apiEndpoint} 
                      onChange={handleApiChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="maxRequests" className="text-sm font-medium">최대 요청 수</label>
                    <Input 
                      id="maxRequests" 
                      name="maxRequests"
                      type="number"
                      value={apiSettings.maxRequests} 
                      onChange={handleApiChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="rateLimitPeriod" className="text-sm font-medium">속도 제한 기간 (초)</label>
                    <Input 
                      id="rateLimitPeriod" 
                      name="rateLimitPeriod"
                      type="number"
                      value={apiSettings.rateLimitPeriod} 
                      onChange={handleApiChange} 
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline">API 연결 테스트</Button>
                  <Button>저장</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
} 