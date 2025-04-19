import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ExternalLink, ChevronRight } from 'lucide-react';

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    source?: string;
    source_type?: string;
    published_at: string;
    source_url?: string;
    summary?: string;
    tags?: string[];
    isScrapped?: boolean;
  };
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const [isScrapped, setIsScrapped] = useState(article.isScrapped || false);
  
  const handleToggleScrap = async () => {
    try {
      setIsScrapped(!isScrapped);
      
      // API 호출
      const response = await fetch(`/api/articles/${article.id}/scrap`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isScrapped: !isScrapped 
        }),
      });
      
      if (!response.ok) {
        // API 호출이 실패하면 상태를 원래대로 되돌림
        setIsScrapped(isScrapped);
        console.error('스크랩 상태 변경 실패');
      }
    } catch (error) {
      setIsScrapped(isScrapped);
      console.error('스크랩 API 호출 오류:', error);
    }
  };
  
  // 날짜 포맷팅
  const formattedDate = article.published_at ? 
    format(parseISO(article.published_at), 'yyyy년 MM월 dd일', { locale: ko }) : '';
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold line-clamp-2">{article.title}</CardTitle>
            <CardDescription className="mt-1 flex items-center">
              <span className="font-medium">{article.source || article.source_type || '알 수 없는 출처'}</span>
              <span className="mx-2">•</span>
              <time dateTime={article.published_at}>{formattedDate}</time>
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleToggleScrap}
            className={isScrapped ? "text-yellow-500" : "text-gray-300"}
          >
            <Star className="h-5 w-5" fill={isScrapped ? "currentColor" : "none"} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        {article.summary && (
          <p className="text-gray-600 mb-4">{article.summary}</p>
        )}
        
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="text-xs hover:bg-secondary"
              >
                <Link href={`/dashboard?tag=${encodeURIComponent(tag)}`}>
                  {tag}
                </Link>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-between">
        <Button variant="ghost" size="sm" className="text-gray-500 px-0 hover:text-gray-800" asChild>
          <Link href={article.source_url || '#'} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" /> 
            원문 보기
          </Link>
        </Button>
        
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/articles/${article.id}`}>
            상세 정보
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 