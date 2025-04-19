'use client';

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, UserPlus, MoreHorizontal, Edit, Trash2, Check, X } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function AdminUsersPage() {
  // 샘플 사용자 데이터
  const [users, setUsers] = useState([
    {
      id: "1",
      email: "kim.manager@shinhan.com",
      role: "user",
      lastActive: "2025-04-19 13:45:22",
      status: "active"
    },
    {
      id: "2",
      email: "park.analyst@shinhan.com",
      role: "user",
      lastActive: "2025-04-19 11:32:15",
      status: "active"
    },
    {
      id: "3",
      email: "lee.admin@shinhan.com",
      role: "admin",
      lastActive: "2025-04-19 14:22:08",
      status: "active"
    },
    {
      id: "4",
      email: "jung.user@shinhan.com",
      role: "user",
      lastActive: "2025-04-18 17:05:43",
      status: "inactive"
    },
    {
      id: "5",
      email: "choi.analyst@shinhan.com",
      role: "user",
      lastActive: "2025-04-19 09:12:30",
      status: "active"
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");

  // 검색 필터링
  const filteredUsers = users.filter(user => 
    searchQuery === "" || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 사용자 상태 토글
  const toggleUserStatus = (id: string) => {
    setUsers(users.map(user => 
      user.id === id 
        ? { ...user, status: user.status === "active" ? "inactive" : "active" } 
        : user
    ));
  };

  return (
    <DashboardLayout isAdmin={true}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">사용자 관리</h1>
            <p className="text-muted-foreground">
              시스템 사용자를 관리할 수 있습니다.
            </p>
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            새 사용자 추가
          </Button>
        </div>
        
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이메일, 역할로 검색..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>사용자 목록</CardTitle>
            <CardDescription>
              시스템에 등록된 사용자 목록입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-4 py-3 px-4 text-sm font-medium text-muted-foreground bg-muted">
                <div className="col-span-5">이메일</div>
                <div className="col-span-2">역할</div>
                <div className="col-span-2">상태</div>
                <div className="col-span-2">최근 활동</div>
                <div className="col-span-1 text-right">관리</div>
              </div>
              <div className="divide-y">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="grid grid-cols-12 gap-4 py-3 px-4 hover:bg-muted/50 items-center">
                    <div className="col-span-5 font-medium">{user.email}</div>
                    <div className="col-span-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? '관리자' : '사용자'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className={`flex items-center space-x-1 ${
                        user.status === 'active' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {user.status === 'active' ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>활성</span>
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4" />
                            <span>비활성</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {user.lastActive.split(' ')[0]}
                    </div>
                    <div className="col-span-1 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleUserStatus(user.id)}>
                            {user.status === 'active' ? (
                              <>
                                <X className="mr-2 h-4 w-4" />
                                비활성화
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                활성화
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 