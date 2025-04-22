'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let isRedirecting = false;
    
    const checkSessionAndRedirect = async () => {
      if (isRedirecting) return;
      
      const supabase = createClientComponentClient();
      
      try {
        // 세션 확인
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('세션 확인 오류:', error);
          throw error;
        }
        
        isRedirecting = true;
        
        if (session) {
          // 이미 로그인된 경우 대시보드로 이동
          console.log('홈: 이미 로그인된 세션 발견, 대시보드로 이동');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 100);
        } else {
          // 로그인되지 않은 경우 로그인 페이지로 이동
          console.log('홈: 로그인된 세션 없음, 로그인 페이지로 이동');
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      } catch (error) {
        console.error('리다이렉트 처리 오류:', error);
        
        // 오류 발생 시 기본적으로 로그인 페이지로 이동
        if (!isRedirecting) {
          isRedirecting = true;
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSessionAndRedirect();
    
    return () => {
      isRedirecting = false;
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