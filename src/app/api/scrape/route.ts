import { NextRequest, NextResponse } from 'next/server';
import { fetchAllPressReleases } from '@/lib/scraper';
import { saveArticle } from '@/lib/db';
import OpenAI from 'openai';

// 환경 변수에서 API 키 가져오기
const apiKey = process.env.OPENAI_API_KEY;

/**
 * 보도자료 스크래핑 및 저장 API
 * @param req Request 객체
 * @returns JSON 응답
 */
export async function POST(req: NextRequest) {
  try {
    // API 키 확인
    if (!apiKey) {
      console.warn("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다. 테스트 모드로 실행합니다.");
      return NextResponse.json({ error: "테스트 모드로 실행합니다." });
    }

    // OpenAI 클라이언트 초기화
    const openai = new OpenAI({
      apiKey: apiKey
    });

    // 필요한 경우 인증 체크
    // 예: const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    // }

    // URL 파라미터 추출
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const source = searchParams.get('source') || undefined;
    const autoSummarize = searchParams.get('autoSummarize') !== 'false';

    // 스크래핑 실행
    const pressReleases = await fetchAllPressReleases(page);
    
    // 소스 필터링
    const filteredReleases = source 
      ? pressReleases.filter(item => item.source?.toLowerCase() === source.toLowerCase())
      : pressReleases;
    
    // 최대 항목 수 제한
    const limitedReleases = filteredReleases.slice(0, limit);

    // 데이터베이스에 저장
    const savedResults = await Promise.allSettled(
      limitedReleases.map(item => saveArticle(item, autoSummarize))
    );

    // 결과 분석
    const savedCount = savedResults.filter(r => r.status === 'fulfilled' && r.value).length;
    const failedCount = savedResults.filter(r => r.status === 'rejected').length;
    const duplicateCount = savedResults.filter(r => r.status === 'fulfilled' && !r.value).length;

    return NextResponse.json({
      success: true,
      message: `스크래핑 완료: ${savedCount}개 저장, ${duplicateCount}개 중복, ${failedCount}개 실패`,
      total: limitedReleases.length,
      saved: savedCount,
      duplicates: duplicateCount,
      failed: failedCount
    });
  } catch (error) {
    console.error('스크래핑 API 오류:', error);
    return NextResponse.json(
      { error: '보도자료 스크래핑 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 수동 스크랩 입력 API
 */
export async function PUT(req: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await req.json();
    const { title, source, url, content, date } = body;

    // 필수 필드 검증
    if (!title || !url || !source) {
      return NextResponse.json(
        { error: '제목, URL, 출처는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // SourceItem 객체 생성
    const item = {
      id: '',  // 데이터베이스에서 자동 생성
      title,
      source,
      date: date || new Date().toISOString(),
      url,
      summary: content || '',
      tags: [],
      isScrapped: true,
      type: 'source' as const
    };

    // 데이터베이스에 저장
    const savedId = await saveArticle(item, true);

    if (savedId) {
      return NextResponse.json({
        success: true,
        message: '보도자료가 성공적으로 저장되었습니다.',
        id: savedId
      });
    } else {
      return NextResponse.json(
        { error: '보도자료 저장에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('수동 스크랩 API 오류:', error);
    return NextResponse.json(
      { error: '보도자료 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "GET method not allowed" }, { status: 405 });
} 