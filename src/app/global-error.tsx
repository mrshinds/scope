'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 오류를 로깅 서비스에 보고
    console.error(error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">문제가 발생했습니다</h1>
        <p className="mt-4 text-lg text-gray-600">
          서버에 오류가 발생했습니다. 다시 시도해 주세요.
        </p>
        <Button 
          onClick={reset} 
          className="mt-6"
          variant="default"
        >
          다시 시도
        </Button>
      </div>
    </div>
  )
} 