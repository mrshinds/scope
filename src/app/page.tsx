'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // 이전 리다이렉트 기록이 있는지 확인
    const redirectAttempts = sessionStorage.getItem('redirectAttempts');
    const attempts = redirectAttempts ? parseInt(redirectAttempts) : 0;
    
    // 리다이렉트 시도가 3회 이상이면 더 이상 리다이렉트하지 않음
    if (attempts >= 3) {
      console.log('리다이렉트 시도가 너무 많습니다. 무한 리다이렉트 방지를 위해 중단합니다.');
      sessionStorage.removeItem('redirectAttempts');
      setIsLoading(false);
      return;
    }
    
    const checkSessionAndRedirect = async () => {
      const supabase = createClientComponentClient();
      
      try {
        // 브라우저 저장소의 Supabase 데이터를 확인
        const storageData = localStorage.getItem('supabase.auth.token');
        console.log('Supabase 로컬 스토레지 데이터 존재:', !!storageData);
        
        // 세션 확인
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('세션 확인 오류:', error);
          throw error;
        }
        
        if (session) {
          // 이미 로그인된 경우 대시보드로 이동
          console.log('홈: 이미 로그인된 세션 발견, 대시보드로 이동합니다');
          // 리다이렉트 시도 횟수 증가
          sessionStorage.setItem('redirectAttempts', String(attempts + 1));
          // replace 메서드 사용하여 현재 페이지를 히스토리에서 대체
          window.location.replace('/dashboard');
        } else {
          // 로그인되지 않은 경우 로그인 페이지로 이동
          console.log('홈: 로그인된 세션 없음, 로그인 페이지로 이동합니다');
          // 로컬 스토레지의 Supabase 인증 데이터 정리
          try {
            localStorage.removeItem('supabase.auth.token');
            console.log('로컬 스토레지 정리 완료');
          } catch (e) {
            console.error('로컬 스토레지 정리 실패:', e);
          }
          
          // 리다이렉트 시도 횟수 증가
          sessionStorage.setItem('redirectAttempts', String(attempts + 1));
          // replace 메서드 사용하여 현재 페이지를 히스토리에서 대체
          window.location.replace('/login');
        }
      } catch (error) {
        console.error('리다이렉트 처리 오류:', error);
        // 오류 발생 시 기본적으로 로그인 페이지로 이동
        try {
          localStorage.removeItem('supabase.auth.token');
          console.log('오류 발생으로 로컬 스토레지 정리 완료');
        } catch (e) {
          console.error('로컬 스토레지 정리 실패:', e);
        }
        
        // 리다이렉트 시도 횟수 증가
        sessionStorage.setItem('redirectAttempts', String(attempts + 1));
        window.location.replace('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    // 짧은 지연 후에 세션 확인 및 리다이렉트 실행
    const timer = setTimeout(() => {
      checkSessionAndRedirect();
    }, 300);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);
  
  // 리다이렉트 중에 표시할 로딩 UI
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">SCOPE</h1>
      {isLoading && (
        <div className="flex items-center mt-4">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span>로딩 중...</span>
        </div>
      )}
    </div>
  );
} 