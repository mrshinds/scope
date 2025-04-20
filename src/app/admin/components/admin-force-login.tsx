'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { forceLogin } from '@/app/api/auth/force-login/client';
import { isValidEmail } from '@/lib/utils';

interface AdminForceLoginProps {
  adminToken?: string;
}

/**
 * 관리자 전용 강제 로그인 컴포넌트
 * 관리자 패널에서 특정 사용자로 로그인할 수 있는 기능 제공
 */
export function AdminForceLogin({ adminToken }: AdminForceLoginProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string }>({});
  const [showTokenInput, setShowTokenInput] = useState(!adminToken);
  const [manualToken, setManualToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult({});

    // 이메일 검증
    if (!isValidEmail(email)) {
      setResult({
        success: false,
        error: '유효한 이메일 주소를 입력해주세요.'
      });
      setIsLoading(false);
      return;
    }

    try {
      // 토큰 결정 (prop으로 전달된 것 또는 수동 입력)
      const token = adminToken || manualToken;

      // 강제 로그인 API 호출
      const loginResult = await forceLogin(email, { adminToken: token });

      if (loginResult.success) {
        setResult({
          success: true,
          message: `${email}로 로그인 요청을 보냈습니다. ${loginResult.isNewUser ? '새로운 사용자로 등록되었습니다.' : '기존 사용자로 로그인합니다.'}`
        });
      } else {
        setResult({
          success: false,
          error: loginResult.error || '알 수 없는 오류가 발생했습니다.'
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || '요청 처리 중 오류가 발생했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border p-4 my-4">
      <h3 className="text-lg font-medium mb-4">관리자 강제 로그인</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="force-login-email">사용자 이메일</Label>
          <Input
            id="force-login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="로그인할 이메일 주소"
            disabled={isLoading}
            required
          />
        </div>

        {showTokenInput && (
          <div className="space-y-2">
            <Label htmlFor="admin-token">관리자 토큰</Label>
            <Input
              id="admin-token"
              type="password"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="관리자 액세스 토큰"
              disabled={isLoading}
              required
            />
          </div>
        )}

        {result.error && (
          <Alert variant="destructive">
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        )}

        {result.success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 처리 중...
            </>
          ) : (
            '사용자로 로그인'
          )}
        </Button>
      </form>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>이 기능은 관리자 전용이며, 지정된 이메일로 로그인 링크를 발송합니다.</p>
        <p>프로덕션 환경에서는 관리자 토큰이 필요합니다.</p>
      </div>
    </div>
  );
} 