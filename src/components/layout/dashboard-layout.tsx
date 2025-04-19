'use client';

import { ReactNode } from "react"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

interface DashboardLayoutProps {
  children: ReactNode
  isAdmin?: boolean
}

export function DashboardLayout({ children, isAdmin = false }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar className="w-64 hidden md:block" isAdmin={isAdmin} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 