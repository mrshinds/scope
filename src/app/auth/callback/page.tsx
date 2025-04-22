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
      // URL 파라미터에서 필요한 값 추출
      const code = searchParams.get('code');
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      
      // 해시에서 토큰 추출
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      // code_verifier 복원 시도
      const codeVerifier =
        localStorage.getItem('supabase.auth.code_verifier') ||
        sessionStorage.getItem('supabase.auth.code_verifier') ||
        Cookies.get('supabase.auth.code_verifier');

      // 디버깅을 위한 로그
      console.log('hash:', window.location.hash);
      console.log('redirectTo:', redirectTo);
      console.log('code:', code);
      console.log('code_verifier:', codeVerifier?.slice(0, 8));
      console.log('access_token:', access_token?.slice(0, 8));
      console.log('refresh_token:', refresh_token?.slice(0, 8));

      try {
        if (code && codeVerifier) {
          // PKCE 흐름으로 세션 교환
          const { error } = await supabase.auth.exchangeCodeForSession(code, codeVerifier);
          
          if (error) {
            throw error;
          }

          // code_verifier 정리
          localStorage.removeItem('supabase.auth.code_verifier');
          sessionStorage.removeItem('supabase.auth.code_verifier');
          Cookies.remove('supabase.auth.code_verifier');

          router.push(redirectTo);
        } else if (access_token && refresh_token) {
          // 토큰으로 직접 세션 설정
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (error) {
            throw error;
          }

          router.push(redirectTo);
        } else {
          throw new Error('인증에 필요한 파라미터가 없습니다');
        }
      } catch (error) {
        console.error('인증 처리 오류:', error);
        router.push(`/login?error=exchange_failed&redirect=${encodeURIComponent(redirectTo)}`);
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