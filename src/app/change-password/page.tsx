'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function ChangePassword() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 세션 확인
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error
        if (!session) {
          router.push('/login')
          toast.error('로그인이 필요합니다')
          return
        }

      } catch (error: any) {
        console.error('세션 확인 오류:', error)
        router.push('/login')
        toast.error('세션 확인 중 오류가 발생했습니다')
      }
    }

    checkSession()
  }, [router, supabase])

  // 비밀번호 변경
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 비밀번호 유효성 검사
      if (newPassword.length < 6) {
        throw new Error('새 비밀번호는 6자 이상이어야 합니다')
      }

      if (newPassword !== confirmPassword) {
        throw new Error('새 비밀번호가 일치하지 않습니다')
      }

      // 현재 비밀번호 확인
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: currentPassword
      })

      if (signInError) {
        throw new Error('현재 비밀번호가 올바르지 않습니다')
      }

      // 비밀번호 업데이트
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      toast.success('비밀번호가 변경되었습니다')
      router.push('/dashboard')

    } catch (error: any) {
      console.error('비밀번호 변경 오류:', error)
      setError(error.message)
      toast.error('비밀번호 변경 실패', {
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold">비밀번호 변경</h1>
          <p className="mt-2 text-gray-600">
            계정 보안을 위해 비밀번호를 변경하세요
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">현재 비밀번호</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="현재 비밀번호 입력"
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="newPassword">새 비밀번호</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="6자 이상의 새 비밀번호"
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호를 다시 입력하세요"
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            비밀번호 변경
          </Button>
        </form>
      </div>
    </div>
  )
} 