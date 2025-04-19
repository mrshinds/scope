import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SetPasswordForm } from "@/components/forms/set-password-form"

export default function SetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-shinhan-gray">
      <div className="w-full max-w-md p-4">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <h1 className="text-3xl font-bold text-shinhan-blue">SCOPE</h1>
            </div>
            <CardTitle className="text-2xl text-center">비밀번호 설정</CardTitle>
            <CardDescription className="text-center">
              사용할 비밀번호를 설정하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-center">
              <p className="text-sm text-muted-foreground">
                안전한 비밀번호를 사용하시기 바랍니다
              </p>
            </div>
            <SetPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 