'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient, getSession } from '@/lib/supabaseClient';
import { isValidEmail } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' | null }>({ text: '', type: null });
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  // 컴포넌트 마운트 시 세션 확인
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await getSession();
      if (data.session) {
        setSession(data.session);
        // 이미 로그인되어 있으면 메인 페이지로 리다이렉션
        router.push('/');
      }
    };

    checkSession();

    // Supabase 인증 상태 변경 리스너 설정
    const supabase = createBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setSession(session);
        router.push('/');
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
      }
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 입력값 검증
    if (!email.trim()) {
      setMessage({ text: '이메일을 입력해주세요.', type: 'error' });
      return;
    }

    if (!isValidEmail(email)) {
      setMessage({ text: '유효한 이메일 형식이 아닙니다.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: null });

    try {
      // API 호출로 이메일 인증 링크 전송 요청
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '인증 메일 전송 중 오류가 발생했습니다.');
      }

      setMessage({ 
        text: data.message || '이메일로 인증 링크가 전송되었습니다. 이메일을 확인해주세요.', 
        type: 'success' 
      });
      
      // 추가 안내 메시지가 있는 경우 표시
      if (data.additionalInfo) {
        setTimeout(() => {
          setMessage({ 
            text: data.additionalInfo, 
            type: 'info' 
          });
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('로그인 오류:', error);
      setMessage({ 
        text: error.message || '인증 메일 전송 중 오류가 발생했습니다.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">로그인</h1>
        
        {message.text && (
          <div className={`mb-4 p-3 rounded ${
            message.type === 'error' ? 'bg-red-100 text-red-700' : 
            message.type === 'success' ? 'bg-green-100 text-green-700' : 
            'bg-blue-100 text-blue-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@example.com"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            className={`w-full p-2 rounded-md bg-blue-600 text-white font-medium ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '인증 링크 전송'}
          </button>
        </form>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>이메일로 인증 링크가 전송됩니다.</p>
          <p className="mt-1">링크를 클릭하여 로그인을 완료해주세요.</p>
        </div>
      </div>
    </div>
  );
} 