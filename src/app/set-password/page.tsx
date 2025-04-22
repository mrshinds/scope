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

export default function SetPassword() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  // 세션 확인 및 인증 상태 변화 감지
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error
        
        if (!session) {
          console.log('세션이 없음, 로그인 페이지로 리다이렉트')
          window.location.href = '/login'
          return
        }

        // 사용자 정보 설정
        setUser(session.user)
        
        // 이미 비밀번호가 설정된 경우
        const hasPassword = session.user.user_metadata?.password_set
        if (hasPassword) {
          console.log('이미 비밀번호가 설정됨, 대시보드로 이동')
          window.location.href = '/dashboard'
          return
        }
      } catch (error: any) {
        console.error('세션 확인 오류:', error)
        window.location.href = '/login'
        toast.error('세션 확인 중 오류가 발생했습니다')
      }
    }

    // 인증 상태 변경 리스너 설정
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('인증 상태 변경:', event)
        
        if (event === 'SIGNED_OUT') {
          // 로그아웃 시 로그인 페이지로 리다이렉트
          window.location.href = '/login'
        } else if (session) {
          // 세션 존재 시 사용자 정보 업데이트
          setUser(session.user)
        }
      }
    )

    // 초기 세션 확인
    checkSession()

    // 리스너 정리
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  // 비밀번호 설정
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('사용자 정보를 찾을 수 없습니다')
      window.location.href = '/login'
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      // 비밀번호 유효성 검사
      if (password.length < 6) {
        throw new Error('비밀번호는 6자 이상이어야 합니다')
      }

      if (password !== confirmPassword) {
        throw new Error('비밀번호가 일치하지 않습니다')
      }

      console.log('비밀번호 업데이트 중...')
      
      // 비밀번호 업데이트
      const { error } = await supabase.auth.updateUser({
        password,
        data: { password_set: true }
      })

      if (error) throw error

      console.log('비밀번호 설정 완료')
      
      // 세션 다시 확인
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.warn('비밀번호 설정 후 세션을 찾을 수 없음')
      } else {
        console.log('세션 확인됨:', session.user.email)
      }

      // 성공 메시지
      toast.success('비밀번호가 설정되었습니다', {
        description: '대시보드로 이동합니다'
      })
      
      // 페이지 리로드 방식으로 리다이렉트
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 500)

    } catch (error: any) {
      console.error('비밀번호 설정 오류:', error)
      setError(error.message)
      toast.error('비밀번호 설정 실패', {
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
          <h1 className="text-2xl font-bold">비밀번호 설정</h1>
          <p className="mt-2 text-gray-600">
            계정 보안을 위해 비밀번호를 설정해주세요
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSetPassword} className="space-y-4">
          <div>
            <Label htmlFor="password">새 비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상의 비밀번호"
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            비밀번호 설정
          </Button>
        </form>
      </div>
    </div>
  )
} 