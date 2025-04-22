'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import EmailForm from '@/components/forms/email-form';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const redirectTo = searchParams.get('redirect') || '/dashboard';
          console.log('세션 확인됨, 리디렉션:', redirectTo);
          router.replace(redirectTo);
        } else {
          console.log('세션 없음, 로그인 페이지 유지');
        }
      } catch (error) {
        console.error('세션 확인 오류:', error);
      }
    };

    checkSession();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">🔐 로그인</h1>
          <p className="text-gray-600">이메일을 입력하여 인증을 진행해 주세요.</p>
        </div>
        <EmailForm />
      </div>
    </div>
  );
} 