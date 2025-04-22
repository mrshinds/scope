'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import EmailForm from '@/components/forms/email-form';

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session) {
          const redirect = searchParams.get('redirect') || '/dashboard';
          router.push(redirect);
          return;
        }

        const errorMessage = searchParams.get('error');
        if (errorMessage) {
          toast.error('로그인 오류', {
            description: decodeURIComponent(errorMessage)
          });
        }
      } catch (error: any) {
        console.error('세션 검증 오류:', error);
        toast.error('세션 검증 중 오류가 발생했습니다');
      }
    };

    checkSession();
  }, [router, searchParams, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="mt-2 text-gray-600">
            이메일로 전송된 인증 링크를 통해 로그인하세요
          </p>
        </div>
        <EmailForm />
      </div>
    </div>
  );
} 