'use client';

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isValidEmail } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function EmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      // Supabase Auth를 이용한 이메일 인증 코드 발송
      const { data, error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify`,
        },
      });

      if (authError) {
        setError(`인증 코드 발송 실패: ${authError.message}`);
        console.error("인증 코드 발송 오류:", authError);
        return;
      }

      // 인증 코드 발송 성공
      setSuccess("인증 코드가 이메일로 발송되었습니다. 이메일을 확인해주세요.");
      
      // 이메일 세션 저장
      sessionStorage.setItem("pendingAuthEmail", email);
      
      // 인증 코드 확인 페이지로 이동
      setTimeout(() => {
        router.push("/verify");
      }, 1500);
    } catch (error) {
      console.error("이메일 인증 처리 오류:", error);
      setError("인증 코드 발송 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  // 개발 환경에서 테스트 인증 처리
  const handleDevAuth = async () => {
    if (process.env.NODE_ENV === 'production') return;
    
    setIsLoading(true);
    try {
      // 개발 환경에서는 인증을 건너뛰고 테스트 코드 생성
      sessionStorage.setItem("pendingAuthEmail", "test@example.com");
      sessionStorage.setItem("verificationCode", "123456");
      router.push("/verify");
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
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 인증 코드 발송 중...
          </>
        ) : (
          "인증 코드 발송"
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