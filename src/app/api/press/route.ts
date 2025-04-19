import { NextResponse } from 'next/server';
import { sources } from '@/lib/data';
import { SourceItem } from '@/lib/types';

// 가상의 페이지네이션 함수 (실제 API 연동 시 대체 필요)
function paginateData(data: SourceItem[], page: number, pageSize: number = 10): SourceItem[] {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return data.slice(startIndex, endIndex);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const source = searchParams.get('source');
    
    // 데이터 필터링 (source 파라미터가 있는 경우)
    let filteredData = sources;
    if (source) {
      filteredData = sources.filter(item => 
        item.source?.toLowerCase() === source.toLowerCase() ||
        item.organization?.toLowerCase() === source.toLowerCase()
      );
    }
    
    // 날짜순으로 정렬 (최신순)
    filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // 페이지네이션 적용
    const paginatedData = paginateData(filteredData, page, pageSize);
    
    return NextResponse.json(paginatedData);
  } catch (error) {
    console.error('보도자료 API 에러:', error);
    return NextResponse.json(
      { error: '보도자료를 불러오는 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
} 