'use client';

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isValidEmail } from "@/lib/utils"
import { Label } from "@/components/ui/label"

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

    if (!email.endsWith("@shinhan.com")) {
      setError("신한은행 이메일(@shinhan.com)만 사용 가능합니다.");
      return;
    }

    setIsLoading(true);

    try {
      // 실제 구현에서는 백엔드 API 호출하여 로그인 처리
      // 개발 환경에서는 모든 로그인 시도가 성공하도록 설정
      const loginSuccess = true;

      if (loginSuccess) {
        // 로그인 성공 시 세션 저장 및 리다이렉트
        sessionStorage.setItem("userEmail", email);
        sessionStorage.setItem("isLoggedIn", "true");
        router.push("/dashboard");
      } else {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (error) {
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleForgotPassword() {
    // 비밀번호 재설정 페이지로 이동
    // 현재는 신규 사용자 프로세스와 동일하게 처리
    router.push("/login?tab=new");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="space-y-2">
        <Label htmlFor="email-login">이메일</Label>
        <Input
          id="email-login"
          placeholder="이메일 입력 (@shinhan.com)"
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
      
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "로그인 중..." : "로그인"}
      </Button>
    </form>
  )
} 