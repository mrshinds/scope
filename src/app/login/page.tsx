'use client';

import { useState } from 'react';
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

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;

      // 사용자 정보 확인
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('사용자 정보를 가져올 수 없습니다');

      // 비밀번호 설정 여부 확인
      const hasPassword = user.user_metadata?.password_set;
      
      if (!hasPassword) {
        // 비밀번호 설정 페이지로 이동
        router.push('/set-password');
      } else {
        // 대시보드로 이동
        const redirect = searchParams.get('redirect') || '/dashboard';
        router.push(redirect);
      }

    } catch (error: any) {
      console.error('OTP 검증 오류:', error);
      setError(error.message);
      toast.error('인증 실패', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // 기존 사용자 로그인
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
      toast.success('로그인 성공');

    } catch (error: any) {
      console.error('로그인 오류:', error);
      setError(error.message);
      toast.error('로그인 실패', {
        description: error.message
      });
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