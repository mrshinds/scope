import { NextRequest, NextResponse } from 'next/server';
import { getArticles } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * 프레스 릴리즈 API 핸들러
 * @param req Request 객체
 * @returns JSON 응답
 */
export async function GET(req: NextRequest) {
  try {
    // URL 파라미터 추출
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const source = searchParams.get('source') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const search = searchParams.get('search') || undefined;
    const tags = searchParams.get('tags')?.split(',') || undefined;

    // 데이터베이스에서 보도자료 조회
    const result = await getArticles({
      page,
      limit,
      source,
      startDate,
      endDate,
      search,
      tags
    });

    // 응답 반환
    return NextResponse.json({
      items: result.items,
      total: result.total,
      page,
      limit,
      hasMore: result.hasMore
    });
  } catch (error) {
    console.error('보도자료 API 오류:', error);
    return NextResponse.json(
      { error: '보도자료를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 