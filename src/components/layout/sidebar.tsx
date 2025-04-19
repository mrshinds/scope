'use client';

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Archive, Newspaper, FileText, Home, Building, Settings, Users, Activity, BarChart2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isAdmin?: boolean
}

export function Sidebar({ className, isAdmin = false }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12 border-r h-full", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            메뉴
          </h2>
          <div className="space-y-1">
            <Button
              variant={pathname === "/dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                대시보드
              </Link>
            </Button>
            <Button
              variant={pathname === "/press" ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href="/press">
                <Building className="mr-2 h-4 w-4" />
                기관보도
              </Link>
            </Button>
            <Button
              variant={pathname === "/news" ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href="/news">
                <Newspaper className="mr-2 h-4 w-4" />
                언론보도
              </Link>
            </Button>
            <Button
              variant={pathname === "/scraps" ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href="/scraps">
                <Archive className="mr-2 h-4 w-4" />
                스크랩
              </Link>
            </Button>
            <Button
              variant={pathname === "/activity" ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href="/activity">
                <Activity className="mr-2 h-4 w-4" />
                활동 로그
              </Link>
            </Button>
          </div>
        </div>
        {isAdmin && (
          <div className="px-4 py-2">
            <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
              관리자
            </h2>
            <div className="space-y-1">
              <Button
                variant={pathname === "/admin/dashboard" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/admin/dashboard">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  통계
                </Link>
              </Button>
              <Button
                variant={pathname === "/admin/users" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  사용자 관리
                </Link>
              </Button>
              <Button
                variant={pathname === "/admin/settings" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  설정
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 