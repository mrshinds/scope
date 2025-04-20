'use client';

import { FormEvent, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isValidEmail } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { supabase, signInWithMagicLink } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Info } from "lucide-react"

// 배포 URL 설정 (배포 환경에서는 이 값으로 수정필요)
const SITE_URL = 'https://scope-psi.vercel.app';

// 매직 링크 만료 시간 (분)
const MAGIC_LINK_EXPIRATION = 30; // 30분으로 늘림

export function EmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // URL 파라미터에서 오류 메시지 확인 및 auth.url 파라미터 확인
  useEffect(() => {
    if (searchParams) {
      // URL에서 auth.url 파라미터 확인
      const authUrl = searchParams.get('auth.url');
      if (authUrl) {
        console.log('인증 URL 감지:', authUrl);
        handleAuthUrl(authUrl);
      }
      
      // 에러 메시지 확인
      const errorParam = searchParams.get('error');
      const errorMessage = searchParams.get('message') || searchParams.get('error_description');
      
      if (errorParam) {
        setError(`인증 오류: ${errorParam}${errorMessage ? ` - ${errorMessage}` : ''}`);
        
        // 디버그 정보 저장
        setDebugInfo({
          error: errorParam,
          message: errorMessage,
          time: new Date().toISOString()
        });
      }
    }
  }, [searchParams]);

  // auth.url 파라미터 처리 함수
  const handleAuthUrl = async (authUrl: string) => {
    try {
      console.log('인증 URL 처리 중:', authUrl);
      // URL에서 code 파라미터 추출
      const url = new URL(authUrl);
      const code = url.searchParams.get('code');
      
      if (!code) {
        console.error('인증 URL에 코드 파라미터가 없습니다.');
        setError('인증 URL이 유효하지 않습니다.');
        return;
      }
      
      setIsLoading(true);
      
      // Supabase를 통해 코드 교환
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('세션 교환 오류:', error);
        
        // 오류 특성에 따라 다른 메시지 표시
        if (error.message.includes('expired')) {
          setError(`인증 링크가 만료되었습니다. 새 링크를 요청해주세요. (유효 시간: ${MAGIC_LINK_EXPIRATION}분)`);
        } else {
          setError(`인증 오류: ${error.message}`);
        }
        
        setIsLoading(false);
        return;
      }
      
      if (data?.session) {
        console.log('세션 교환 성공:', data.session.user.email);
        // 세션 저장 및 비밀번호 설정 페이지로 이동
        sessionStorage.setItem('pendingAuthEmail', data.session.user.email || '');
        router.push('/set-password?auth_success=true');
      } else {
        setError('세션 데이터를 받지 못했습니다.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('인증 URL 처리 오류:', err);
      setError(`인증 처리 중 오류 발생: ${err.message}`);
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트시 API URL 결정
  useEffect(() => {
    // 개발 환경에서는 window.location.origin 사용, 배포 환경에서는 SITE_URL 사용
    const baseUrl = process.env.NODE_ENV === 'production'
      ? SITE_URL
      : window.location.origin;
    
    setApiUrl(baseUrl);
    console.log('사이트 URL 설정:', baseUrl);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // 환경 변수 확인
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      
      console.log('환경 설정:', {
        supabaseUrl: supabaseUrl ? '설정됨' : '미설정',
        siteUrl,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV
      });
      
      if (!supabaseUrl) {
        console.error('Supabase URL이 설정되지 않았습니다.');
        setError('서버 설정 오류가 발생했습니다. 관리자에게 문의하세요.');
        setIsLoading(false);
        return;
      }
      
      // 이메일 검증
      if (!isValidEmail(email)) {
        setError('유효한 이메일 주소를 입력해 주세요.');
        setIsLoading(false);
        return;
      }

      const result = await signInWithMagicLink(email);
      
      if (result.success) {
        setSuccess(`인증 링크가 ${email}로 발송되었습니다. 이메일을 확인하고 링크를 클릭해주세요. (${MAGIC_LINK_EXPIRATION}분 이내)`);
        
        // 디버깅 정보 표시
        console.log('이메일 인증 요청 성공:', {
          email,
          timestamp: new Date().toISOString(),
          redirectUrl: `${siteUrl}/auth/callback`
        });
      } else {
        console.error('인증 이메일 발송 실패:', result.error);
        setError('인증 이메일을 발송하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } catch (error: any) {
      console.error('인증 처리 중 예외 발생:', error);
      setError(`인증 처리 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 개발 환경에서 테스트 인증 처리
  const handleDevAuth = async () => {
    if (process.env.NODE_ENV === 'production') return;
    
    setIsLoading(true);
    try {
      // 개선된 매직 링크 함수 사용 (테스트)
      const result = await signInWithMagicLink('test@example.com');

      if (!result.success) {
        console.error('테스트 인증 오류:', result.error);
        setError(`테스트 인증 실패: ${result.error}`);
        return;
      }

      console.log('테스트 인증 성공:', result.data);
      setSuccess('테스트 인증 이메일이 발송되었습니다. 터미널에서 매직 링크를 확인하세요.');
    } catch (error: any) {
      console.error("개발 환경 인증 오류:", error);
      setError(`개발 환경 인증 오류: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 직접 콜백 테스트
  const handleTestCallback = () => {
    // 테스트 코드로 콜백 URL 직접 방문
    const testUrl = `${apiUrl}/auth/callback?code=test`;
    window.location.href = testUrl;
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
      
      {/* 인증 링크 만료 시간 안내 */}
      <div className="text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          인증 링크는 보안을 위해 발송 후 {MAGIC_LINK_EXPIRATION}분 동안만 유효합니다. 
          시간이 경과한 경우 새 링크를 요청해주세요.
        </span>
      </div>
      
      {/* 디버그 정보 표시 (개발 모드에서만) */}
      {debugInfo && process.env.NODE_ENV !== 'production' && (
        <div className="p-2 bg-gray-100 text-xs font-mono overflow-x-auto">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
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
        <>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full mt-2" 
            onClick={handleDevAuth}
            disabled={isLoading}
          >
            테스트 인증 메일 발송
          </Button>
          
          <Button 
            type="button" 
            variant="secondary" 
            className="w-full mt-2" 
            onClick={handleTestCallback}
          >
            콜백 URL 테스트
          </Button>
        </>
      )}
    </form>
  )
} 