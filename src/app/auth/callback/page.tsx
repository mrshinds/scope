'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Cookies from 'js-cookie';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams() || new URLSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    async function processAuth() {
      try {
        console.log("🔐 인증 콜백 진입");
        
        // 1. URL에서 코드 추출 (해시 또는 쿼리 파라미터에서)
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        
        // 해시나 쿼리 파라미터에서 코드 찾기
        const code = hashParams.get('code') || searchParams.get('code');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        console.log('window.location.hash:', hash);
        console.log('code:', code);
        
        // 2. code_verifier 복원 (지시사항에 따라 순서대로 확인)
        const codeVerifier = 
          localStorage.getItem('supabase.auth.code_verifier') ||
          sessionStorage.getItem('supabase.auth.code_verifier') ||
          Cookies.get('supabase.auth.code_verifier') ||
          localStorage.getItem('supabase.auth.pkce.code_verifier') ||
          sessionStorage.getItem('supabase.auth.pkce.code_verifier') ||
          Cookies.get('supabase.auth.pkce.code_verifier');
        
        console.log('code_verifier:', codeVerifier ? `${codeVerifier.substring(0, 8)}...` : "없음");
        
        // 디버그 정보 기록
        setDebugInfo({
          hash,
          code: code ? `${code.substring(0, 8)}...` : "없음",
          code_verifier: codeVerifier ? `${codeVerifier.substring(0, 8)}...` : "없음",
          has_access_token: !!accessToken,
          has_refresh_token: !!refreshToken
        });
        
        // 토큰이 있는 경우 직접 세션 설정
        if (accessToken && refreshToken) {
          const { data, error } = await supabase().auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            throw new Error(`세션 설정 실패: ${error.message}`);
          }
          
          router.push('/dashboard');
          return;
        }
        
        // 코드가 없는 경우
        if (!code) {
          console.warn('인증 코드가 없습니다');
          router.push('/login?error=no_code');
          return;
        }
        
        // code_verifier가 없는 경우에도 세션 교환 시도
        if (!codeVerifier) {
          console.warn('code_verifier를 찾을 수 없습니다. 세션 교환에 실패할 수 있습니다.');
        }
        
        // 3. code와 code_verifier가 있을 경우 세션 교환
        const client = supabase();
        const { data, error } = await client.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('코드 교환 오류:', error);
          
          if (error.message.includes('expired')) {
            router.push('/login?error=session_exchange_failed&message=link_expired');
            return;
          }
          
          router.push(`/login?error=session_exchange_failed&message=${encodeURIComponent(error.message)}`);
          return;
        }
        
        if (!data.session) {
          console.error('세션 데이터가 없습니다');
          router.push('/login?error=no_session_data');
          return;
        }
        
        console.log('코드 교환 성공:', data.session.user.email);
        router.push('/dashboard');
        
      } catch (e: any) {
        console.error('인증 처리 오류:', e);
        setError(e.message || '인증 처리 중 오류가 발생했습니다.');
        setLoading(false);
      }
    }

    processAuth();
  }, [router, searchParams]);

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
          
          {/* 개발 환경에서만 디버그 정보 표시 */}
          {process.env.NODE_ENV === 'development' && Object.keys(debugInfo).length > 0 && (
            <div className="mt-4 p-2 border border-gray-200 rounded text-xs overflow-auto bg-gray-50">
              <details>
                <summary className="cursor-pointer">디버그 정보</summary>
                <pre className="mt-1 text-xs overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}
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
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {/* 개발 환경에서만 디버그 정보 표시 */}
        {process.env.NODE_ENV === 'development' && Object.keys(debugInfo).length > 0 && (
          <div className="mt-4 p-2 border border-gray-200 rounded text-xs overflow-auto bg-gray-50">
            <details>
              <summary className="cursor-pointer">디버그 정보</summary>
              <pre className="mt-1 text-xs overflow-auto whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
} 