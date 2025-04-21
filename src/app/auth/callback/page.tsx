'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processToken() {
      try {
        const hash = window.location.hash.substring(1);
        if (!hash) {
          setError('유효한 토큰 정보가 없습니다.');
          setLoading(false);
          return;
        }

        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const expiresIn = hashParams.get('expires_in');
        const tokenType = hashParams.get('token_type');

        if (!accessToken || !refreshToken) {
          setError('유효한 토큰이 없습니다.');
          setLoading(false);
          return;
        }

        console.log('토큰 발견:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          expiresIn,
          tokenType
        });

        // 토큰으로 Supabase 세션 설정
        const client = supabase();
        const { error } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error('세션 설정 오류:', error);
          setError(`로그인 처리 중 오류가 발생했습니다: ${error.message}`);
          setLoading(false);
          return;
        }

        // 로그인 성공, 홈으로 리디렉션
        console.log('로그인 성공, 홈으로 리디렉션');
        router.replace('/');
      } catch (e: any) {
        console.error('인증 콜백 처리 오류:', e);
        setError(`인증 처리 중 오류가 발생했습니다: ${e.message}`);
        setLoading(false);
      }
    }

    processToken();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-xl font-bold mb-4 text-red-600">인증 오류</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-xl font-bold mb-4">인증 처리 중...</h1>
        {loading && (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
} 