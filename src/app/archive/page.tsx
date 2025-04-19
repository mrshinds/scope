import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bookmark, ExternalLink, Pencil } from "lucide-react"

// 샘플 데이터
const scrappedItems = [
  {
    id: "1",
    title: "디지털금융 소비자보호 강화 방안 연구",
    source: "금융감독원",
    date: "2025-04-18",
    url: "#",
    summary: "디지털 전환 시대에 금융소비자보호를 강화하기 위한 연구 결과를 발표했습니다.",
    tags: ["금융감독원", "디지털금융", "소비자보호"],
    isScrapped: true,
    memo: "디지털 전환 관련 부서와 공유 필요",
  },
  {
    id: "2",
    title: "고령층 금융소비자보호를 위한 가이드라인",
    source: "금융위원회",
    date: "2025-04-15",
    url: "#",
    summary: "고령층 금융소비자를 보호하기 위한 금융회사 가이드라인을 발표했습니다.",
    tags: ["금융위원회", "고령층", "소비자보호"],
    isScrapped: true,
    memo: "고령자 금융서비스 개발 시 참고",
  },
]

export default function ArchivePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">스크랩 자료</h1>
          <p className="text-muted-foreground">
            저장한 자료와 메모를 확인할 수 있습니다.
          </p>
        </div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">최신순</Button>
            <Button variant="outline" size="sm">전체 태그</Button>
          </div>
          <div>
            <Button variant="outline" size="sm">내보내기</Button>
          </div>
        </div>
        {scrappedItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-center mb-4">
                스크랩한 자료가 없습니다.
              </p>
              <Button variant="outline">보도자료 보기</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {scrappedItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between">
                    <div>
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription>
                        {item.source} | {item.date}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Bookmark className="h-5 w-5 fill-shinhan-blue text-shinhan-blue" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {item.summary}
                  </p>
                  {item.memo && (
                    <div className="bg-muted p-3 rounded-md mb-4">
                      <p className="text-sm font-medium mb-1">메모</p>
                      <p className="text-sm text-muted-foreground">{item.memo}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      원문 보기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 