'use client';

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isValidEmail } from "@/lib/utils"
import { sendVerificationCode } from "@/lib/auth"

export function EmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setShowCodePreview(false);

    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("유효한 이메일 주소를 입력해주세요.");
      return;
    }

    if (!email.endsWith("@shinhan.com")) {
      setError("신한은행 이메일(@shinhan.com)만 사용 가능합니다.");
      return;
    }

    setIsLoading(true);

    try {
      const success = await sendVerificationCode(email);

      if (success) {
        // 이메일 주소를 세션에 저장 (실제 구현에서는 세션/쿠키 사용)
        sessionStorage.setItem("verifyEmail", email);
        
        // 개발 모드에서 인증 코드 표시
        if (typeof window !== 'undefined') {
          const code = localStorage.getItem('lastVerificationCode');
          if (code) {
            setVerificationCode(code);
            setShowCodePreview(true);
          } else {
            router.push("/verify");
          }
        } else {
          router.push("/verify");
        }
      } else {
        setError("인증 코드 발송에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleContinue() {
    router.push("/verify");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="space-y-2">
        <Input
          id="email"
          placeholder="이메일 입력 (@shinhan.com)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "처리 중..." : "인증 코드 받기"}
      </Button>
      
      {showCodePreview && (
        <div className="mt-4 p-4 bg-muted rounded-md">
          <p className="text-sm font-medium mb-2">개발 모드 - 인증 코드 미리보기:</p>
          <div className="text-lg font-bold mb-2 text-center bg-background p-2 rounded">{verificationCode}</div>
          <Button 
            className="w-full mt-2" 
            variant="secondary"
            type="button"
            onClick={handleContinue}
          >
            다음으로 계속
          </Button>
        </div>
      )}
    </form>
  )
} 