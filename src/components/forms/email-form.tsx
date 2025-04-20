'use client';

import { FormEvent, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isValidEmail } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

// 배포 URL 설정 (배포 환경에서는 이 값으로 수정필요)
const SITE_URL = 'https://scope-psi.vercel.app';

export function EmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState("");

  // URL 파라미터에서 오류 메시지 확인
  useEffect(() => {
    if (searchParams) {
      const errorParam = searchParams.get('error');
      const errorMessage = searchParams.get('message');
      
      if (errorParam) {
        setError(`인증 오류: ${errorParam}${errorMessage ? ` - ${errorMessage}` : ''}`);
      }
    }
  }, [searchParams]);

  // 컴포넌트 마운트시 API URL 결정
  useEffect(() => {
    // 개발 환경에서는 window.location.origin 사용, 배포 환경에서는 SITE_URL 사용
    const baseUrl = process.env.NODE_ENV === 'production'
      ? SITE_URL
      : window.location.origin;
    
    setApiUrl(baseUrl);
    console.log('사이트 URL 설정:', baseUrl);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("유효한 이메일 주소를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // 리디렉션 URL 확인 및 로깅 (디버깅용)
      const redirectUrl = `${apiUrl}/auth/callback`;
      console.log('이메일 인증 리디렉션 URL:', redirectUrl);
      
      // Supabase Auth를 이용한 매직 링크 발송 (OTP 대신 매직 링크 사용)
      const { data, error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true, // 사용자가 없으면 자동 생성
        },
      });

      if (authError) {
        setError(`인증 메일 발송 실패: ${authError.message}`);
        console.error("인증 메일 발송 오류:", authError);
        return;
      }

      console.log('인증 메일 발송 응답:', JSON.stringify(data));

      // 인증 코드 발송 성공
      setSuccess("인증 링크가 이메일로 발송되었습니다. 이메일을 확인하고 'Log In' 링크를 클릭해주세요.");
      
      // 이메일 세션 저장
      sessionStorage.setItem("pendingAuthEmail", email);
    } catch (error) {
      console.error("이메일 인증 처리 오류:", error);
      setError("인증 메일 발송 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  // 개발 환경에서 테스트 인증 처리
  const handleDevAuth = async () => {
    if (process.env.NODE_ENV === 'production') return;
    
    setIsLoading(true);
    try {
      // 개발 환경에서 매직 링크 대신 직접 세션 생성
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      if (error) {
        console.error('테스트 로그인 오류:', error);
        return;
      }

      console.log('테스트 로그인 성공:', data.session ? '세션 있음' : '세션 없음');
      router.push('/dashboard');
    } catch (error) {
      console.error("개발 환경 인증 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          placeholder="이메일 입력"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 인증 메일 발송 중...
          </>
        ) : (
          "인증 메일 발송"
        )}
      </Button>

      {process.env.NODE_ENV !== 'production' && (
        <Button 
          type="button" 
          variant="outline" 
          className="w-full mt-2" 
          onClick={handleDevAuth}
        >
          개발 환경 테스트 인증
        </Button>
      )}
    </form>
  )
} 