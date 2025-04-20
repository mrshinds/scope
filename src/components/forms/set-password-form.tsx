'use client';

import { FormEvent, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { setPassword as setUserPassword } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCookie } from "@/lib/cookies"

export function SetPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    const getEmailFromCookie = async () => {
      try {
        // 쿠키에서 이메일 가져오기 시도
        const emailFromCookie = getCookie('verify_email');
        
        if (emailFromCookie) {
          console.log('쿠키에서 이메일 찾음:', emailFromCookie);
          setEmail(emailFromCookie);
          return;
        }
        
        // 세션 스토리지에서 이메일 가져오기 시도
        const storedEmail = sessionStorage.getItem("pendingAuthEmail");
        if (storedEmail) {
          console.log('세션 스토리지에서 이메일 찾음:', storedEmail);
          setEmail(storedEmail);
          return;
        }
        
        // Supabase 세션에서 이메일 가져오기 시도
        const { data } = await supabase.auth.getSession();
        if (data.session?.user?.email) {
          console.log('Supabase 세션에서 이메일 찾음:', data.session.user.email);
          setEmail(data.session.user.email);
          return;
        }
        
        console.error('이메일 정보를 찾을 수 없음');
        router.push("/login?error=email_not_found");
      } catch (err) {
        console.error('이메일 확인 오류:', err);
        router.push("/login?error=session_error");
      }
    };

    getEmailFromCookie();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("이메일 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    if (password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    try {
      // Supabase를 이용한 비밀번호 업데이트
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        console.error('비밀번호 설정 오류:', error);
        setError(`비밀번호 설정에 실패했습니다: ${error.message}`);
        return;
      }

      // 비밀번호 설정 성공
      setSuccess("비밀번호가 성공적으로 설정되었습니다.");
      
      // 쿠키와 세션 스토리지 정리
      document.cookie = 'verify_email=; Max-Age=0; path=/;';
      sessionStorage.removeItem("pendingAuthEmail");
      
      // 대시보드로 이동 (약간의 딜레이 추가)
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("비밀번호 설정 처리 오류:", error);
      setError("비밀번호 설정 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="space-y-2">
        <Input
          type="password"
          placeholder="새 비밀번호 (8자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Input
          type="password"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 설정 중...
          </>
        ) : (
          "비밀번호 설정 완료"
        )}
      </Button>
      
      {email && (
        <p className="text-sm text-muted-foreground text-center">
          {email}에 대한 비밀번호를 설정합니다.
        </p>
      )}
    </form>
  )
} 