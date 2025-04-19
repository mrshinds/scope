'use client';

import { FormEvent, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { verifyCode } from "@/lib/auth"

export function VerifyCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("verifyEmail");
      if (!storedEmail) {
        router.push("/login");
      } else {
        setEmail(storedEmail);
      }
      
      // 개발 모드에서 자동으로 인증 코드 미리 입력
      const savedCode = localStorage.getItem("lastVerificationCode");
      if (savedCode && code === "") {
        setCode(savedCode);
      }
    }
  }, [router, code]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!code || code.length !== 8) {
      setError("유효한 8자리 인증 코드를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const success = verifyCode(email, code);

      if (success) {
        // 인증 완료 후 비밀번호 설정 페이지로 이동
        router.push("/set-password");
      } else {
        setError("인증 코드가 유효하지 않거나 만료되었습니다.");
      }
    } catch (error) {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  // 개발 모드에서 자동 인증
  function handleAutoVerify() {
    if (code && email) {
      setIsLoading(true);
      try {
        const success = verifyCode(email, code);
        if (success) {
          router.push("/set-password");
        } else {
          setError("자동 인증에 실패했습니다. 코드를 수동으로 입력해주세요.");
        }
      } catch (error) {
        console.error(error);
        setError("오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="8자리 인증 코드 입력"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={8}
          pattern="[0-9]*"
          disabled={isLoading}
          className="text-center text-lg tracking-widest"
        />
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <p className="text-sm text-muted-foreground">
          {email}로 발송된 8자리 인증 코드를 입력해주세요.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "확인 중..." : "인증 확인"}
      </Button>
      
      {code && code.length === 8 && (
        <Button 
          type="button" 
          variant="secondary" 
          className="w-full mt-2" 
          onClick={handleAutoVerify}
          disabled={isLoading}
        >
          자동 인증 (개발 모드)
        </Button>
      )}
      
      <Button 
        type="button" 
        variant="ghost" 
        className="w-full" 
        onClick={() => router.push("/login")}
      >
        이메일 다시 입력
      </Button>
    </form>
  )
} 