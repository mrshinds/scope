'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const [activeTab, setActiveTab] = useState('new');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authInProgress, setAuthInProgress] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);

  // 인증 상태 변화 감지
  useEffect(() => {
    if (!authInProgress) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('인증 상태 변경:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('세션 생성 확인:', session.user.email);
          
          // 리다이렉트 실행
          if (redirectTarget) {
            toast.success('로그인 성공', {
              description: '대시보드로 이동합니다.'
            });
            
            // 페이지 리로드 방식으로 리다이렉트 (세션 적용을 위해)
            window.location.href = redirectTarget;
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [authInProgress, redirectTarget, supabase]);

  // 이미 로그인되어 있는지 확인
  useEffect(() => {
    // 이전 리다이렉트 기록이 있는지 확인
    const redirectAttempts = sessionStorage.getItem('loginRedirectAttempts');
    const attempts = redirectAttempts ? parseInt(redirectAttempts) : 0;
    
    // 리다이렉트 시도가 3회 이상이면 더 이상 리다이렉트하지 않음
    if (attempts >= 3) {
      console.log('로그인 페이지: 리다이렉트 시도가 너무 많습니다. 무한 리다이렉트 방지를 위해 중단합니다.');
      sessionStorage.removeItem('loginRedirectAttempts');
      return;
    }
    
    const checkExistingSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('세션 확인 오류:', error);
          return;
        }
        
        // 이미 로그인된 경우 대시보드로 이동
        if (session) {
          console.log('로그인 페이지: 이미 로그인된 세션 발견:', session.user.email);
          
          // 유효한 리다이렉트 경로 결정
          let redirect = '/dashboard';
          
          // URL에서 redirect 파라미터가 있고 유효한 경우에만 사용
          const redirectParam = searchParams?.get('redirect');
          if (redirectParam && redirectParam.startsWith('/') && !redirectParam.includes('//')) {
            redirect = redirectParam;
          }
          
          console.log('로그인 페이지: 리다이렉트 경로:', redirect);
          
          // 리다이렉트 시도 횟수 증가
          sessionStorage.setItem('loginRedirectAttempts', String(attempts + 1));
          
          // replace 메서드 사용하여 현재 페이지를 히스토리에서 대체
          window.location.replace(redirect);
        }
      } catch (error) {
        console.error('세션 검증 오류:', error);
      }
    };
    
    // 짧은 지연 후에 세션 확인 실행
    const timer = setTimeout(() => {
      checkExistingSession();
    }, 300);
    
    return () => {
      clearTimeout(timer);
    };
  }, [searchParams, supabase]);

  // OTP 코드 요청
  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      setShowOtpInput(true);
      toast.success('인증 코드가 전송되었습니다', {
        description: '이메일로 전송된 6자리 코드를 입력해주세요.'
      });
    } catch (error: any) {
      console.error('OTP 요청 오류:', error);
      setError(error.message);
      toast.error('인증 코드 전송 실패', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // OTP 코드 검증
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAuthInProgress(true);

    try {
      // 인증 진행
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;

      // 즉시 세션 확인
      const { data: sessionData } = await supabase.auth.getSession();
      const { data: userData } = await supabase.auth.getUser();
      
      if (!sessionData.session || !userData.user) {
        throw new Error('세션 정보를 가져올 수 없습니다. 다시 로그인해주세요.');
      }

      console.log('OTP 검증 성공, 세션 정보:', userData.user.email);
      
      // 비밀번호 설정 여부 확인
      const hasPassword = userData.user.user_metadata?.password_set;
      
      if (!hasPassword) {
        // 비밀번호 설정 페이지로 이동
        window.location.href = '/set-password';
      } else {
        // 대시보드로 이동
        const redirect = searchParams?.get('redirect') || '/dashboard';
        setRedirectTarget(redirect);
      }

    } catch (error: any) {
      console.error('OTP 검증 오류:', error);
      setError(error.message);
      toast.error('인증 실패', {
        description: error.message
      });
      setAuthInProgress(false);
    } finally {
      setLoading(false);
    }
  };

  // 기존 사용자 로그인
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAuthInProgress(true);

    try {
      // 리다이렉트 경로 미리 결정
      const redirect = searchParams?.get('redirect') || '/dashboard';
      setRedirectTarget(redirect);
      
      console.log('로그인 시도:', email);
      console.log('리다이렉트 대상:', redirect);
      
      // 인증 시도
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
        throw error;
      }
      
      // 바로 세션 확인 (onAuthStateChange 이벤트와 별개로)
      if (!data.session) {
        throw new Error('로그인은 성공했으나 세션이 생성되지 않았습니다. 다시 시도해주세요.');
      }
      
      console.log('로그인 즉시 세션 확인:', data.session.user.email);
      
      // 세션 값이 존재하는지 한번 더 확인 
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.warn('getSession()에서 세션을 찾을 수 없습니다.');
        // 여기서 에러를 발생시키지 않고 onAuthStateChange 이벤트를 기다림
      } else {
        console.log('getSession()에서 세션 확인됨:', sessionData.session.user.email);
        
        // 성공 메시지 표시
        toast.success('로그인 성공', {
          description: '대시보드로 이동합니다.'
        });
        
        // 세션이 확인되면 바로 리다이렉트
        window.location.href = redirect;
      }

    } catch (error: any) {
      console.error('로그인 오류:', error);
      setError(error.message);
      toast.error('로그인 실패', {
        description: error.message
      });
      setAuthInProgress(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="mt-2 text-gray-600">
            {activeTab === 'new' ? '새로운 계정을 만들거나 로그인하세요' : '이메일과 비밀번호로 로그인하세요'}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">최초 사용자</TabsTrigger>
            <TabsTrigger value="existing">기존 사용자</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!showOtpInput ? (
              <form onSubmit={handleOtpRequest} className="space-y-4">
                <div>
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@example.com"
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  인증 코드 요청
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpVerify} className="space-y-4">
                <div>
                  <Label htmlFor="otp">인증 코드</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6자리 코드 입력"
                    maxLength={6}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  인증 코드 확인
                </Button>
              </form>
            )}
          </TabsContent>

          <TabsContent value="existing" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@example.com"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                로그인
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 