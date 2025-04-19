import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VerifyCodeForm } from "@/components/forms/verify-code-form"

export default function VerifyPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-shinhan-gray">
      <div className="w-full max-w-md p-4">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <h1 className="text-3xl font-bold text-shinhan-blue">SCOPE</h1>
            </div>
            <CardTitle className="text-2xl text-center">인증 코드 확인</CardTitle>
            <CardDescription className="text-center">
              이메일로 전송된 8자리 인증 코드를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-center">
              <p className="text-sm text-muted-foreground">
                10분 이내에 입력해야 합니다
              </p>
            </div>
            <VerifyCodeForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 