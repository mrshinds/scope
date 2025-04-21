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

  // 디버깅 로그 함수
  const logDebug = (message: string, data?: any) => {
    console.log(`[인증 콜백] ${message}`, data || '');
    if (data) {
      setDebugInfo(prev => ({ ...prev, [message]: data }));
    }
  };

  // 코드 검증기 추출 기능
  const extractCodeVerifier = () => {
    // 모든 가능한 저장소에서 코드 검증기 찾기
    const sources = [
      { name: 'localStorage', getValue: () => localStorage.getItem('supabase.auth.pkce.code_verifier') },
      { name: 'localStorage(대체)', getValue: () => localStorage.getItem('supabase.auth.code_verifier') },
      { name: 'sessionStorage', getValue: () => sessionStorage.getItem('supabase.auth.pkce.code_verifier') },
      { name: 'sessionStorage(대체)', getValue: () => sessionStorage.getItem('supabase.auth.code_verifier') },
      { name: 'cookies', getValue: () => Cookies.get('supabase.auth.pkce.code_verifier') },
      { name: 'cookies(대체)', getValue: () => Cookies.get('supabase.auth.code_verifier') },
      { name: 'pkce_backup', getValue: () => {
        const backup = localStorage.getItem('pkce_verifiers_backup');
        if (!backup) return null;
        try {
          const data = JSON.parse(backup);
          for (const key in data) {
            if (key.includes('code_verifier') && typeof data[key] === 'string') {
              return data[key];
            }
          }
          return null;
        } catch (e) {
          console.error('백업 파싱 실패:', e);
          return null;
        }
      }}
    ];
    
    // 모든 소스를 순회하며 첫 번째 유효한 값 찾기
    for (const source of sources) {
      try {
        const value = source.getValue();
        if (value) {
          logDebug(`코드 검증기 발견: ${source.name}`, { 
            source: source.name, 
            value_preview: value.substring(0, 8) + '...' 
          });
          return value;
        }
      } catch (e) {
        logDebug(`${source.name} 액세스 오류`, e);
      }
    }
    
    return null;
  };

  useEffect(() => {
    async function processAuth() {
      try {
        console.log("🔐 인증 콜백 진입");
        logDebug('인증 처리 시작', { url: window.location.href });
        
        // URL 정보 확인
        const fullUrl = window.location.href;
        const hasHash = !!window.location.hash;
        const queryCode = searchParams.get('code');
        
        console.log("URL hash:", window.location.hash);
        
        logDebug('URL 분석 결과', {
          hasHash,
          queryCode: queryCode ? `${queryCode.substring(0, 8)}...` : '없음',
          fullUrlLength: fullUrl.length
        });

        // 1. 해시에서 액세스 토큰 확인 (해시 로그인 흐름)
        if (hasHash) {
          const hash = window.location.hash.substring(1);
          const hashParams = new URLSearchParams(hash);
          
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            logDebug('해시에서 토큰 발견', {
              accessToken: '********', // 보안상 실제 토큰 표시 안함
              refreshToken: '********'
            });
            
            return await handleTokens(accessToken, refreshToken);
          }
          
          // 해시에서 코드 확인
          const codeFromHash = hashParams.get('code');
          if (codeFromHash) {
            logDebug('해시에서 코드 발견', { code: `${codeFromHash.substring(0, 8)}...` });
            // 해시에서 코드 검증기도 확인
            const verifierFromHash = hashParams.get('code_verifier');
            if (verifierFromHash) {
              // 해시에 코드 검증기가 있으면 저장
              try {
                localStorage.setItem('supabase.auth.pkce.code_verifier', verifierFromHash);
                sessionStorage.setItem('supabase.auth.pkce.code_verifier', verifierFromHash);
                Cookies.set('supabase.auth.pkce.code_verifier', verifierFromHash);
                logDebug('해시에서 코드 검증기 발견 및 저장', { verifier: `${verifierFromHash.substring(0, 8)}...` });
              } catch (e) {
                logDebug('코드 검증기 저장 실패', e);
              }
            }
            return await handleCode(codeFromHash);
          }
          
          // 에러 체크
          const hashError = hashParams.get('error');
          const hashErrorDesc = hashParams.get('error_description');
          
          if (hashError) {
            logDebug('해시에서 오류 발견', { error: hashError, description: hashErrorDesc });
            
            if (hashError === 'access_denied' && hashParams.get('error_code') === 'otp_expired') {
              throw new Error('인증 링크가 만료되었습니다. 새 링크를 요청해주세요.');
            }
            
            throw new Error(`인증 오류: ${hashError} - ${hashErrorDesc || '알 수 없는 오류'}`);
          }
        }

        // 2. 쿼리 파라미터에서 코드 확인 (PKCE 코드 흐름)
        if (queryCode) {
          logDebug('쿼리 파라미터에서 코드 발견', { code: `${queryCode.substring(0, 8)}...` });
          
          // 쿼리 파라미터에서 코드 검증기도 확인
          const verifierFromQuery = searchParams.get('code_verifier');
          if (verifierFromQuery) {
            // 코드 검증기가 있으면 저장
            try {
              localStorage.setItem('supabase.auth.pkce.code_verifier', verifierFromQuery);
              sessionStorage.setItem('supabase.auth.pkce.code_verifier', verifierFromQuery);
              Cookies.set('supabase.auth.pkce.code_verifier', verifierFromQuery);
              logDebug('쿼리 파라미터에서 코드 검증기 발견 및 저장', { verifier: `${verifierFromQuery.substring(0, 8)}...` });
            } catch (e) {
              logDebug('코드 검증기 저장 실패', e);
            }
            return await handleCode(queryCode);
          }
          
          return await handleCode(queryCode);
        }

        // 코드와 토큰 모두 없는 경우
        logDebug('코드 또는 토큰을 찾을 수 없음');
        throw new Error('유효한 인증 정보가 없습니다. 다시 로그인해주세요.');
        
      } catch (e: any) {
        logDebug('인증 처리 오류', e.message);
        setError(e.message || '인증 처리 중 오류가 발생했습니다.');
        setLoading(false);
      }
    }

    // 토큰 기반 인증 처리
    async function handleTokens(accessToken: string, refreshToken: string) {
      try {
        logDebug('세션 설정 시작 (토큰 기반)');
        
        const client = supabase();
        const { data, error } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (error) {
          logDebug('세션 설정 오류', error);
          throw error;
        }
        
        logDebug('세션 설정 성공', { user: data.user?.email || '알 수 없음' });
        
        // 로컬 스토리지에서 리턴 경로 확인
        const returnPath = localStorage.getItem('auth_return_path') || '/';
        logDebug('리디렉션 경로', returnPath);
        
        // 인증 정보 정리
        cleanupAuthData();
        
        // 세션 설정 후 리디렉션
        router.replace(returnPath);
        
      } catch (e: any) {
        throw new Error(`세션 설정 실패: ${e.message}`);
      }
    }

    // 코드 기반 인증 처리 (PKCE)
    async function handleCode(code: string) {
      try {
        // 먼저 모든 저장소에서 코드 검증기 찾기
        const codeVerifier = extractCodeVerifier();
        
        console.log("code_verifier 앞 8자:", codeVerifier ? codeVerifier.slice(0, 8) : "없음");
        console.log("code:", code);
        
        logDebug('코드 교환 시작', { 
          code: `${code.substring(0, 8)}...`,
          verifier: codeVerifier ? `${codeVerifier.substring(0, 8)}...` : '없음'
        });
        
        if (!codeVerifier) {
          logDebug('코드 검증기를 찾을 수 없음', {
            storages_checked: ['localStorage', 'sessionStorage', 'cookies', 'backup']
          });
          // 코드 검증기 없이도 시도해 볼 수 있음
          logDebug('코드 검증기 없이 세션 교환 시도');
        }
        
        const client = supabase();
        // 코드 검증기가 있으면 전달, 없으면 생략
        const { data, error } = await client.auth.exchangeCodeForSession(code);
        
        if (error) {
          logDebug('코드 교환 오류', error);
          
          if (error.message.includes('expired')) {
            throw new Error('인증 링크가 만료되었습니다. 새 링크를 요청해주세요.');
          }
          
          throw error;
        }
        
        if (!data.session) {
          logDebug('세션 데이터 없음');
          throw new Error('세션 데이터가 없습니다. 다시 로그인해주세요.');
        }
        
        logDebug('코드 교환 성공', { user: data.session.user.email || '알 수 없음' });
        
        // 로컬 스토리지에서 리턴 경로 확인
        const returnPath = localStorage.getItem('auth_return_path') || '/';
        logDebug('리디렉션 경로', returnPath);
        
        // 인증 정보 정리
        cleanupAuthData();
        
        // 세션 설정 후 리디렉션
        router.replace(returnPath);
        
      } catch (e: any) {
        throw new Error(`코드 교환 실패: ${e.message}`);
      }
    }
    
    // 인증 관련 데이터 정리
    function cleanupAuthData() {
      try {
        // 코드 검증기 정리
        localStorage.removeItem('supabase.auth.pkce.code_verifier');
        localStorage.removeItem('supabase.auth.code_verifier');
        sessionStorage.removeItem('supabase.auth.pkce.code_verifier');
        sessionStorage.removeItem('supabase.auth.code_verifier');
        Cookies.remove('supabase.auth.pkce.code_verifier');
        Cookies.remove('supabase.auth.code_verifier');
        
        // 백업 데이터도 정리
        localStorage.removeItem('pkce_verifiers_backup');
        
        logDebug('인증 데이터 정리 완료');
      } catch (e) {
        logDebug('인증 데이터 정리 실패', e);
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