'use client';

import { FormEvent, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isValidEmail } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { supabase, signInWithMagicLink } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Info, AlertTriangle } from "lucide-react"
import axios from "axios"

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
        let errorText = '';
        
        // 오류 유형에 따른 메시지 설정
        if (errorParam === 'link_expired' || errorParam === 'otp_expired') {
          errorText = '인증 링크가 만료되었습니다. 아래에서 새 링크를 요청해주세요.';
        } else if (errorParam === 'code_verifier_error' || errorParam === 'invalid_link') {
          errorText = '이메일 링크가 손상되었습니다. 이메일 프로그램의 보안 검사로 인해 발생한 문제일 수 있습니다. 새 인증 링크를 요청해주세요.';
          
          if (errorMessage && errorMessage.length > 10) {
            errorText += `\n\n상세: ${errorMessage}`;
          }
          
          errorText += '\n\n신한 메일 사용자는 원본 반입 후 링크를 클릭해주세요.';
        } else {
          errorText = `인증 오류: ${errorParam}${errorMessage ? ` - ${errorMessage}` : ''}`;
        }
        
        setError(errorText);
        
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
    
    // 주소창의 파라미터 확인 및 직접 진단 정보 표시
    const debugInformation = {
      environment: process.env.NODE_ENV,
      browserURL: window.location.href,
      currentTime: new Date().toISOString(),
      siteUrl: baseUrl,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      searchParams: Object.fromEntries(new URLSearchParams(window.location.search).entries())
    };
    
    console.log('매직 링크 디버그 정보:', debugInformation);
    setDebugInfo(debugInformation);
  }, []);

  // 신한 메일 전용 대체 인증 플로우 사용
  const useAlternativeAuthFlow = async (email: string) => {
    try {
      console.log('신한 메일 대체 인증 플로우 시작:', email);
      const response = await axios.post('/api/auth/flow', { email });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data,
          isShinhanMail: true,
          message: '대체 인증 플로우 사용: ' + response.data.message
        };
      } else {
        console.error('대체 인증 플로우 오류:', response.data.error);
        return {
          success: false,
          error: response.data.error || '대체 인증 처리 중 오류가 발생했습니다.'
        };
      }
    } catch (error: any) {
      console.error('대체 인증 플로우 예외:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || '대체 인증 플로우 처리 중 오류가 발생했습니다.'
      };
    }
  };

  // 이메일 도메인 확인 함수 추가
  const getEmailDomain = (email: string): string => {
    const parts = email.split('@');
    return parts.length > 1 ? parts[1].toLowerCase() : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    
    try {
      // 환경 변수 확인
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      
      console.log('환경 설정:', {
        supabaseUrl: supabaseUrl ? '설정됨' : '미설정',
        siteUrl,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
        redirectUrl: `${siteUrl}/auth/callback`,
        flowType: 'pkce', // 인증 플로우 타입 표시
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

      // 이메일 도메인 확인
      const domain = getEmailDomain(email);
      
      // 신한 이메일 여부 확인
      const isShinhanMail = domain === 'shinhan.com';
      const isNaverMail = domain === 'naver.com';
      
      // 결과 객체 초기화
      let result;
      
      // 신한 메일인 경우 대체 인증 플로우 사용
      if (isShinhanMail) {
        console.log('신한 메일 감지 - 대체 인증 플로우 사용');
        result = await useAlternativeAuthFlow(email);
      } else {
        // 일반 메일은 기존 방식 사용
        result = await signInWithMagicLink(email);
      }
      
      if (result.success) {
        let successMessage = `인증 링크가 ${email}로 발송되었습니다. 이메일을 확인하고 링크를 클릭해주세요. (${MAGIC_LINK_EXPIRATION}분 이내)`;
        
        // 도메인별 추가 안내
        if (isShinhanMail || result.isShinhanMail) {
          successMessage += '\n\n⚠️ **신한 메일 사용자 필독**:\n1. 인증 메일이 스팸함에 이미지 형태로 수신될 수 있습니다.\n2. 원본 반입 후 **즉시** 링크를 클릭해 주세요.\n3. 링크 클릭 시 "code_verifier" 오류가 발생한다면 개인 이메일 사용을 권장합니다.';
        } else if (isNaverMail) {
          successMessage += '\n\n⚠️ **네이버 메일 사용자 안내**:\n1. 링크 클릭 시 "code_verifier" 오류가 발생할 수 있습니다.\n2. 이 경우 다른 브라우저에서 링크를 열거나 다른 이메일 계정 사용을 권장합니다.';
        } else {
          successMessage += '\n\n💡 **알림**: 만약 로그인 링크 클릭 후 오류가 발생한다면, 다른 브라우저에서 링크를 열어보세요.';
        }
        
        setSuccess(successMessage);
        
        // 이메일 세션 저장
        sessionStorage.setItem("pendingAuthEmail", email);
        
        // 디버깅 정보 표시 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          console.log('이메일 인증 요청 성공:', {
            email,
            timestamp: new Date().toISOString(),
            redirectUrl: `${siteUrl}/auth/callback`,
            domain,
            isShinhanMail,
            isNaverMail,
            useAlternativeFlow: isShinhanMail
          });
          
          // 개발 환경에서 추가 디버깅 정보
          setDebugInfo({
            email,
            timestamp: new Date().toISOString(),
            domain,
            emailType: isShinhanMail ? 'shinhan' : isNaverMail ? 'naver' : 'other',
            authFlow: isShinhanMail ? 'alternative' : 'standard'
          });
        }
      } else {
        console.error('인증 이메일 발송 실패:', result.error);
        setError('인증 이메일을 발송하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } catch (error: any) {
      console.error('인증 처리 오류:', error);
      setError('인증 처리 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
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
    <div className="grid gap-6">
      {/* 알림 영역 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="mt-1 whitespace-pre-line">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Info className="h-4 w-4 text-green-600" />
          <AlertDescription className="mt-1 whitespace-pre-line">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* 신한 메일 사용자 주의사항 */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="mt-1">
          <strong>신한 메일 사용자 필수 안내:</strong>
          <ol className="list-decimal pl-5 mt-1 space-y-1 text-sm">
            <li>인증 메일이 <strong>이미지 형태의 스팸 메일</strong>로 수신됩니다.</li>
            <li>메일함에서 해당 메일을 찾아 <strong>원본 반입 즉시</strong> 링크를 클릭하세요.</li>
            <li>원본 반입 후 시간이 지나면 링크가 만료될 수 있습니다.</li>
            <li>만약 "OTP 만료" 또는 "code_verifier 누락" 오류가 발생하면, 아래 버튼으로 새 인증 링크를 요청하세요.</li>
            <li>가능하면 <strong>개인 이메일</strong>을 사용하면 이 문제를 피할 수 있습니다.</li>
          </ol>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              이메일
            </Label>
            <Input
              id="email"
              placeholder="이메일 주소를 입력하세요"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            인증 메일 발송
          </Button>
        </div>
      </form>
      
      <div className="text-sm text-gray-500">
        인증 링크는 보안을 위해 발송 후 {MAGIC_LINK_EXPIRATION}분 동안만 유효합니다. 시간이 경과한 경우 새 링크를 요청해주세요.
      </div>

      {/* 개발 환경에서만 표시되는 디버깅 정보 */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="mt-4 p-2 border border-gray-200 rounded text-xs overflow-auto bg-gray-50">
          <strong>디버그 정보:</strong>
          <pre className="mt-1">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
} 