import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { EmailForm } from "@/components/forms/email-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserLoginForm } from "@/components/forms/user-login-form"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage({ 
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
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