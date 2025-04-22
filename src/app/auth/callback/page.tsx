'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL 파라미터에서 필요한 값 추출
        const code = searchParams.get('code');
        const redirectTo = searchParams.get('redirect') || '/dashboard';
        
        // 해시에서 토큰 추출
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        // 디버깅을 위한 로그
        console.log('인증 콜백 처리 시작:', {
          hash: window.location.hash,
          redirectTo,
          code: code?.slice(0, 8),
          access_token: access_token?.slice(0, 8),
          refresh_token: refresh_token?.slice(0, 8)
        });

        if (access_token && refresh_token) {
          // 토큰으로 직접 세션 설정
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (error) {
            throw error;
          }

          // 세션 설정 성공 후 리디렉션
          console.log('세션 설정 성공, 리디렉션:', redirectTo);
          router.replace(redirectTo);
        } else if (code) {
          // PKCE 흐름으로 세션 교환
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            throw error;
          }

          // 세션 교환 성공 후 리디렉션
          console.log('세션 교환 성공, 리디렉션:', redirectTo);
          router.replace(redirectTo);
        } else {
          throw new Error('인증에 필요한 토큰이 없습니다');
        }
      } catch (error: any) {
        console.error('인증 처리 오류:', error);
        const redirectTo = searchParams.get('redirect') || '/dashboard';
        router.replace(`/login?error=auth_failed&redirect=${encodeURIComponent(redirectTo)}`);
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