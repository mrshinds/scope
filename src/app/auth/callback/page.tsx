'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Cookies from 'js-cookie';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const redirectTo = searchParams.get('redirect') || '/dashboard';

      // code_verifier 복원 시도
      const codeVerifier =
        localStorage.getItem('supabase.auth.code_verifier') ||
        sessionStorage.getItem('supabase.auth.code_verifier') ||
        Cookies.get('supabase.auth.code_verifier');

      // 디버깅을 위한 로그
      console.log('code:', code);
      console.log('code_verifier:', codeVerifier?.slice(0, 8));
      console.log('redirectTo:', redirectTo);

      if (code && codeVerifier) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code, codeVerifier);
          
          if (error) {
            throw error;
          }

          // code_verifier 정리
          localStorage.removeItem('supabase.auth.code_verifier');
          sessionStorage.removeItem('supabase.auth.code_verifier');
          Cookies.remove('supabase.auth.code_verifier');

          // 성공적인 인증 후 리디렉션
          router.push(redirectTo);
        } catch (error) {
          console.error('Session exchange error:', error);
          router.push(`/login?error=exchange_failed&redirect=${encodeURIComponent(redirectTo)}`);
        }
      } else {
        console.error('Missing code or code_verifier');
        router.push(`/login?error=missing_params&redirect=${encodeURIComponent(redirectTo)}`);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">인증 처리 중...</h2>
        <p className="text-sm text-gray-500">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
} 