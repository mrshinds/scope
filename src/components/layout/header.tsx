'use client';

import Link from "next/link"
import { LogOut, Menu } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Header({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <header className={cn("border-b", className)}>
      <div className="flex h-16 items-center px-4 w-full justify-between">
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-shinhan-blue mr-1">SCOPE</span>
            <span className="text-sm text-muted-foreground">신한은행 소비자보호부</span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
} 