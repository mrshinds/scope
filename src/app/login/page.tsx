'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { EmailForm } from "@/components/forms/email-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserLoginForm } from "@/components/forms/user-login-form"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function LoginPage({ 
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const clientSearchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [errorDescription, setErrorDescription] = useState<string | null>(null);
  
  // URL 해시에서 오류 확인 (client-side에서만 가능)
  useEffect(() => {
    // URL 해시에서 오류 정보 추출
    const hashError = window.location.hash.includes('error=');
    
    if (hashError) {
      try {
        // 해시에서 오류 정보 파싱
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1) // # 기호 제거
        );
        
        const hashErrorType = hashParams.get('error');
        const hashErrorCode = hashParams.get('error_code');
        const hashErrorDesc = hashParams.get('error_description');
        
        // 오류 정보 설정 (hash 오류 우선)
        if (hashErrorType) {
          if (hashErrorType === 'access_denied' && hashErrorCode === 'otp_expired') {
            setError('매직 링크가 만료되었습니다');
            setErrorDescription('보안을 위해 인증 링크는 10분 동안만 유효합니다. 로그인 페이지에서 새 링크를 요청해주세요.');
          } else {
            setError(hashErrorType);
            setErrorDescription(hashErrorDesc || '오류가 발생했습니다. 다시 시도해주세요.');
          }
        }
        
        // 해시 제거 (오류 처리 후)
        window.history.replaceState(
          null, 
          document.title, 
          window.location.pathname + window.location.search
        );
      } catch (e) {
        console.error('URL 해시 파싱 오류:', e);
      }
    }
    
    // URL 쿼리 파라미터에서 오류 정보 확인 (hash 없을 경우)
    if (!error && clientSearchParams) {
      const queryError = clientSearchParams.get('error');
      const queryErrorDesc = clientSearchParams.get('error_description');
      
      if (queryError === 'no_code') {
        setError('인증 코드가 없습니다');
        setErrorDescription('유효하지 않은 링크입니다. 로그인 페이지에서 새 링크를 요청해주세요.');
      } else if (queryError) {
        setError(queryError);
        setErrorDescription(queryErrorDesc || '오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  }, [clientSearchParams]);
  
  // URL에서 auth.url 파라미터 확인
  const hasAuthUrl = searchParams && 'auth.url' in searchParams;
  const authMessage = hasAuthUrl 
    ? "인증 링크를 처리하고 있습니다. 자동으로 비밀번호 설정 페이지로 이동합니다." 
    : null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-shinhan-gray">
      <div className="w-full max-w-md p-4">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <h1 className="text-3xl font-bold text-shinhan-blue">SCOPE</h1>
            </div>
            <CardTitle className="text-2xl text-center">로그인</CardTitle>
            <CardDescription className="text-center">
              신한은행 소비자보호부 이슈 감지 플랫폼
            </CardDescription>
          </CardHeader>
          
          {authMessage && (
            <div className="px-6 pb-2">
              <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                <AlertDescription>{authMessage}</AlertDescription>
              </Alert>
            </div>
          )}
          
          {error && (
            <div className="px-6 pb-2">
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>{error}</strong>
                  {errorDescription && <p className="text-sm mt-1">{errorDescription}</p>}
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <Tabs defaultValue="new" className="w-full">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new">신규 사용자</TabsTrigger>
                <TabsTrigger value="existing">기존 사용자</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="new">
              <CardContent className="grid gap-4 pt-6">
                <div className="grid gap-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    인증 코드를 받을 신한은행 이메일 주소를 입력하세요.
                  </p>
                </div>
                <EmailForm />
              </CardContent>
            </TabsContent>
            
            <TabsContent value="existing">
              <CardContent className="grid gap-4 pt-6">
                <div className="grid gap-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    이메일과 비밀번호를 입력하여 로그인하세요.
                  </p>
                </div>
                <UserLoginForm />
              </CardContent>
            </TabsContent>
          </Tabs>
          
          <CardFooter className="flex flex-col space-y-4 mt-4">
            <Separator />
            <div className="text-xs text-center text-muted-foreground">
              © 2024 신한은행 소비자보호부. 모든 권리 보유.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 