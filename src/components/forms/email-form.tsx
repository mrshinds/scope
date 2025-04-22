'use client';

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'

export default function EmailForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 이메일 검증
      if (!email.trim()) {
        throw new Error('이메일을 입력해주세요.')
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('유효한 이메일 형식이 아닙니다.')
      }

      // 리디렉트 URL 설정
      const redirect = searchParams.get('redirect') || '/dashboard'
      const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`

      // Supabase 매직 링크 인증 요청
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl
        }
      })

      if (error) {
        throw error
      }

      // 성공 토스트 메시지
      toast.success('인증 링크가 전송되었습니다', {
        description: `${email}로 전송된 링크를 확인하세요.`
      })

    } catch (err: any) {
      console.error('이메일 인증 오류:', err)
      setError(err.message)
      toast.error('인증 링크 전송 실패', {
        description: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          이메일
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@example.com"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>
      
      <button
        type="submit"
        className={`w-full p-2 rounded-md bg-blue-600 text-white font-medium ${
          loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
        }`}
        disabled={loading}
      >
        {loading ? '처리 중...' : '인증 링크 전송'}
      </button>
    </form>
  )
} 