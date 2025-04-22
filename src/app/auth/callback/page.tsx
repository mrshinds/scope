'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 코드 파라미터 추출
        const code = searchParams.get('code');
        if (!code) {
          throw new Error('인증 코드가 없습니다.');
        }

        // 코드를 세션으로 교환
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          throw error;
        }

        // 리디렉트 URL 설정
        const redirect = searchParams.get('redirect') || '/dashboard';
        router.push(redirect);

        // 성공 메시지 표시
        toast.success('인증이 완료되었습니다', {
          description: '로그인에 성공했습니다.'
        });
      } catch (error: any) {
        console.error('인증 콜백 처리 오류:', error);
        
        // 오류 메시지 설정
        let errorMessage = '인증 처리 중 오류가 발생했습니다.';
        if (error.message.includes('expired')) {
          errorMessage = '인증 링크가 만료되었습니다. 새 링크를 요청해주세요.';
        }

        // 로그인 페이지로 리디렉트
        router.push(`/login?error=${encodeURIComponent(errorMessage)}`);
      }
    };

    handleCallback();
  }, [router, searchParams, supabase]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">인증 처리 중입니다...</p>
      </div>
    </div>
  );
} 