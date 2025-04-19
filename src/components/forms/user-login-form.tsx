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

export function UserLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("유효한 이메일 주소를 입력해주세요.");
      return;
    }

    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // Supabase Auth를 이용한 로그인
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        if (loginError.message.includes('Invalid login credentials')) {
          setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else {
          setError(`로그인 오류: ${loginError.message}`);
        }
        console.error("로그인 오류:", loginError);
        return;
      }

      if (!data.user) {
        setError("사용자 정보를 찾을 수 없습니다.");
        return;
      }

      // 사용자 정보 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name, is_admin')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error("사용자 정보 조회 오류:", userError);
        // 사용자 정보가 없으면 기본 사용자로 생성
        if (userError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: email,
              name: email.split('@')[0],
              is_admin: false
            });

          if (insertError) {
            console.error("사용자 생성 오류:", insertError);
            setError("사용자 정보 생성 중 오류가 발생했습니다.");
            return;
          }
        } else {
          setError("사용자 정보 조회 중 오류가 발생했습니다.");
          return;
        }
      }

      // 로그인 성공 시 리다이렉트
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("로그인 처리 중 예외 발생:", error);
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleForgotPassword() {
    // 비밀번호 재설정 요청으로 신규 사용자 탭으로 이동
    router.push("/login?tab=new");
  }

  // 개발 환경에서 테스트 로그인 처리
  const handleDevLogin = async () => {
    if (process.env.NODE_ENV === 'production') return;
    
    setIsLoading(true);
    try {
      // 개발 환경에서는 테스트 계정으로 로그인
      sessionStorage.setItem("userEmail", "test@example.com");
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userRole", "admin"); // 테스트 목적으로 어드민 권한 부여
      router.push("/dashboard");
    } catch (error) {
      console.error("개발 환경 로그인 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="space-y-2">
        <Label htmlFor="email-login">이메일</Label>
        <Input
          id="email-login"
          placeholder="이메일 입력"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password-login">비밀번호</Label>
          <Button 
            variant="link" 
            className="p-0 h-auto text-xs" 
            type="button"
            onClick={handleForgotPassword}
          >
            비밀번호 찾기
          </Button>
        </div>
        <Input
          id="password-login"
          placeholder="비밀번호 입력"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 로그인 중...
          </>
        ) : (
          "로그인"
        )}
      </Button>

      {process.env.NODE_ENV !== 'production' && (
        <Button 
          type="button" 
          variant="outline" 
          className="w-full mt-2" 
          onClick={handleDevLogin}
        >
          개발 환경 테스트 로그인
        </Button>
      )}
    </form>
  )
} 