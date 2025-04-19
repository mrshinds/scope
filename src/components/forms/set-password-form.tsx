'use client';

import { FormEvent, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { setPassword as setUserPassword } from "@/lib/auth"

export function SetPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    }
  }, [router]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

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
      const success = setUserPassword(email, password);

      if (success) {
        // 비밀번호 설정 완료 후 대시보드로 이동
        sessionStorage.removeItem("verifyEmail");
        router.push("/dashboard");
      } else {
        setError("비밀번호 설정에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
      console.error(error);
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
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "설정 중..." : "비밀번호 설정 완료"}
      </Button>
      <p className="text-sm text-muted-foreground text-center">
        {email}에 대한 비밀번호를 설정합니다.
      </p>
    </form>
  )
} 