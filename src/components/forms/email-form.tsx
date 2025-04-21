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
import { useSupabase } from '@/app/supabase-provider'
import { toast } from '../ui/use-toast'
import { isShinhanEmail } from '@/lib/email-utils'
import Cookies from 'js-cookie'

// 배포 URL 설정 (배포 환경에서는 이 값으로 수정필요)
const SITE_URL = 'https://scope-psi.vercel.app';

// 매직 링크 만료 시간 (분)
const MAGIC_LINK_EXPIRATION = 30; // 30분으로 늘림

// 이메일 도메인 체크 함수
const isNaverEmail = (email: string) => email.endsWith('@naver.com');
const isShinhanEmail = (email: string) => email.endsWith('@shinhan.com');
const isSpecialEmailDomain = (email: string) => isNaverEmail(email) || isShinhanEmail(email);

// PKCE 코드 검증기 백업 함수 (여러 장소에 저장)
const backupPkceVerifier = (codeVerifier: string) => {
  try {
    console.log('PKCE 검증기 백업 중...', codeVerifier.substring(0, 8) + '...');
    
    // 모든 가능한 저장소에 코드 검증기 저장
    localStorage.setItem('supabase.auth.pkce.code_verifier', codeVerifier);
    localStorage.setItem('supabase.auth.code_verifier', codeVerifier);
    sessionStorage.setItem('supabase.auth.pkce.code_verifier', codeVerifier);
    sessionStorage.setItem('supabase.auth.code_verifier', codeVerifier);
    
    // 쿠키에도 저장 (30분 유효)
    Cookies.set('supabase.auth.pkce.code_verifier', codeVerifier, { expires: 1/48 });
    Cookies.set('supabase.auth.code_verifier', codeVerifier, { expires: 1/48 });
    
    // 추가 백업 (디버깅 및 복구용)
    const backupData = {
      timestamp: new Date().toISOString(),
      code_verifier: codeVerifier,
      origin: window.location.origin
    };
    localStorage.setItem('pkce_verifiers_backup', JSON.stringify(backupData));
    
    return true;
  } catch (e) {
    console.error('코드 검증기 백업 실패:', e);
    return false;
  }
};

export function EmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase } = useSupabase();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [debug, setDebugState] = useState<Record<string, any>>({});

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
    setError(null);
    setDebugState({});

    // 이메일 검증
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('유효한 이메일 형식이 아닙니다.');
      return;
    }

    setIsLoading(true);

    // 신한은행 이메일 도메인인지 확인
    const isShinhan = isShinhanEmail(email);

    // 디버깅 정보를 로컬 스토리지에 저장
    const saveDebugInfo = (data: Record<string, any>) => {
      try {
        // 로컬 스토리지에 이메일 저장
        localStorage.setItem('auth_email', email);
        localStorage.setItem('auth_timestamp', new Date().toISOString());
        
        // 디버깅 정보 저장
        localStorage.setItem('email_debug_info', JSON.stringify({
          email,
          isShinhan,
          timestamp: new Date().toISOString(),
          ...data
        }));
        
        // PKCE 백업 상태 확인
        const pkceBackup = localStorage.getItem('pkce_verifiers_backup');
        setDebugState(prev => ({
          ...prev,
          email,
          isShinhan,
          has_pkce_backup: !!pkceBackup,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {
        console.error('디버깅 정보 저장 실패:', e);
      }
    };

    // 백업된 PKCE 정보가 있는지 확인하고, 이전에 실패한 인증 시도가 있다면 정보 저장
    const checkPreviousAuthAttempts = () => {
      try {
        // 모든 PKCE 관련 항목 찾기
        const pkceItems: Record<string, any> = {};
        let foundVerifiers = false;
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('pkce') || key.includes('code_verifier'))) {
            const value = localStorage.getItem(key);
            pkceItems[key] = value ? (value.length > 10 ? `${value.substring(0, 10)}...` : value) : null;
            foundVerifiers = true;
          }
        }
        
        // 이전 인증 시도 정보
        const lastError = localStorage.getItem('auth_last_error');
        
        setDebugState(prev => ({
          ...prev,
          found_pkce_items: foundVerifiers,
          pkce_items_count: Object.keys(pkceItems).length,
          has_previous_error: !!lastError
        }));
        
        return {
          hasPkceItems: foundVerifiers,
          lastError: lastError ? JSON.parse(lastError) : null
        };
      } catch (e) {
        console.error('이전 인증 시도 확인 오류:', e);
        return { hasPkceItems: false, lastError: null };
      }
    };

    // PKCE 백업 생성
    const backupPkceVerifiers = () => {
      try {
        const pkceData: Record<string, any> = {};
        let foundVerifiers = false;
        
        // 모든 PKCE 관련 정보 수집
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('pkce') || key.includes('code_verifier'))) {
            const value = localStorage.getItem(key);
            if (value) {
              pkceData[key] = value;
              pkceData[key + '_time'] = Date.now();
              foundVerifiers = true;
              
              // code_verifier 발견 시 세션스토리지와 쿠키에도 백업
              if (key === 'supabase.auth.pkce.code_verifier' || key === 'supabase.auth.code_verifier') {
                try {
                  // 세션스토리지에 백업
                  sessionStorage.setItem(key, value);
                  
                  // 쿠키에 백업 (1일 만료)
                  Cookies.set(key, value, { expires: 1, path: '/' });
                  
                  console.log(`[PKCE 백업] ${key} 다중 저장소에 백업 완료`);
                } catch (backupError) {
                  console.error('[PKCE 백업] 다중 저장소 백업 실패:', backupError);
                }
              }
            }
          }
        }
        
        // 백업 데이터에 메타데이터 추가
        if (foundVerifiers) {
          pkceData['_meta'] = {
            email,
            created_at: new Date().toISOString(),
            backup_version: '1.0.2'
          };
          
          // 백업 저장
          localStorage.setItem('pkce_verifiers_backup', JSON.stringify(pkceData));
          console.log('PKCE 검증기 백업 완료:', Object.keys(pkceData).length - 1, '개 항목');
          
          return true;
        }
        
        return false;
      } catch (e) {
        console.error('PKCE 백업 생성 실패:', e);
        return false;
      }
    };

    try {
      // 이전 인증 시도 확인
      const { hasPkceItems } = checkPreviousAuthAttempts();
      
      // PKCE 데이터 백업
      if (hasPkceItems) {
        backupPkceVerifiers();
      }

      // 리다이렉트 URL 설정
      const origin = window.location.origin;
      const callbackUrl = `${origin}/auth/callback`;
      
      // auth.url 파라미터 (이메일 클라이언트에 표시될 URL) 설정
      const authUrlParams = isShinhan
        ? {
            emailRedirectTo: callbackUrl,
            auth: { 
              url: callbackUrl,
              redirectUrl: callbackUrl
            }
          }
        : { emailRedirectTo: callbackUrl };
      
      // 디버깅을 위해 브라우저 정보 저장
      const browserInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      };
      
      // 로컬 스토리지에 리다이렉트 경로 저장
      localStorage.setItem('auth_return_path', window.location.pathname);
      
      // 디버깅 정보 저장
      saveDebugInfo({
        callbackUrl,
        isShinhan,
        authUrlParams: JSON.stringify(authUrlParams),
        browserInfo
      });

      console.log('인증 링크 전송 시도:', {
        email,
        callbackUrl,
        isShinhan,
        pkceBackedUp: hasPkceItems
      });

      // 개발 환경에서만 디버깅 정보 표시
      if (process.env.NODE_ENV === 'development') {
        setDebugState(prev => ({
          ...prev,
          auth_params: authUrlParams,
          callback_url: callbackUrl,
          is_shinhan: isShinhan,
          browser_info: browserInfo
        }));
      }

      // Supabase 매직 링크 인증 요청
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: authUrlParams,
      });

      // 에러 처리
      if (error) {
        console.error('인증 링크 전송 오류:', error);
        setError(`인증 링크 전송 중 오류가 발생했습니다: ${error.message}`);
        return;
      }

      // 성공 토스트 메시지
      toast({
        title: '인증 링크가 전송되었습니다',
        description: `${email}로 전송된 링크를 확인하세요.`,
      });
      
      // PKCE 백업 수행
      backupPkceVerifiers();
      
      // 추가 디버깅 정보 기록
      saveDebugInfo({
        status: 'success',
        auth_request_completed: true
      });

    } catch (err: any) {
      console.error('이메일 인증 오류:', err);
      setError(`오류가 발생했습니다: ${err.message}`);
      
      // 오류 디버깅 정보 저장
      saveDebugInfo({
        status: 'error',
        error: err.message
      });
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

      {/* 개발 환경에서만 디버깅 정보 표시 */}
      {process.env.NODE_ENV === 'development' && Object.keys(debug).length > 0 && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono">
          <p className="font-bold mb-1">디버깅 정보:</p>
          <pre className="whitespace-pre-wrap break-all">
            {JSON.stringify(debug, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 