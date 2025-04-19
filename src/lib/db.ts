import { supabase } from './supabase';
import { SourceItem } from './types';
import { summarizeArticle, extractTags, extractOrganizations } from './openai';

/**
 * 데이터베이스에 소스(출처) 정보 저장 또는 업데이트
 * @param name 소스 이름
 * @param url 소스 URL
 * @param description 소스 설명
 * @returns 저장된 소스 ID
 */
export async function saveOrUpdateSource(name: string, url?: string, description?: string): Promise<string> {
  try {
    // 기존 소스 확인
    const { data: existingSource } = await supabase
      .from('sources')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (existingSource) {
      // 업데이트
      await supabase
        .from('sources')
        .update({
          url: url || null,
          description: description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSource.id);
      
      return existingSource.id;
    } else {
      // 새로 생성
      const { data, error } = await supabase
        .from('sources')
        .insert({
          name,
          url: url || null,
          description: description || null
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    }
  } catch (error) {
    console.error('소스 저장 중 오류 발생:', error);
    throw new Error('소스 정보 저장에 실패했습니다.');
  }
}

/**
 * SourceItem 객체를 데이터베이스에 저장하고 자동 요약 및 태그 추출 수행
 * @param item 저장할 SourceItem 객체
 * @param autoSummarize 자동 요약 진행 여부
 * @returns 저장된 기사 ID
 */
export async function saveArticle(item: SourceItem, autoSummarize: boolean = true): Promise<string | null> {
  try {
    // 1. URL 중복 체크
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('id')
      .eq('source_url', item.url)
      .maybeSingle();

    if (existingArticle) {
      console.log(`중복 기사 감지됨: ${item.title} (${item.url})`);
      return existingArticle.id;
    }

    // 2. 소스 정보 저장 또는 업데이트
    const sourceId = await saveOrUpdateSource(item.source);

    // 3. 기사 기본 정보 저장
    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        title: item.title,
        source_id: sourceId,
        source_name: item.source,
        source_url: item.url,
        published_at: new Date(item.date).toISOString(),
        content: item.summary || '', // 원본 내용
        is_scraped: item.isScrapped || false
      })
      .select('id')
      .single();

    if (error) throw error;
    const articleId = article.id;

    // 4. 자동 요약 및 태그 추출 (내용이 있고 autoSummarize가 true인 경우)
    if (autoSummarize && item.summary) {
      try {
        // 병렬로 요약, 태그, 기관 추출 진행
        const [summaryResult, tags, organizations] = await Promise.all([
          summarizeArticle(item.summary),
          extractTags(item.summary, item.title),
          extractOrganizations(item.summary, item.title)
        ]);

        // 요약 정보 저장
        await supabase
          .from('summaries')
          .insert({
            article_id: articleId,
            summary: summaryResult.summary,
            original_summary: summaryResult.originalSummary,
            model_used: 'gpt-4o'
          });

        // 태그 저장
        if (tags.length > 0) {
          // 각 태그를 데이터베이스에 저장하고 연결
          for (const tagName of tags) {
            // 태그 저장 또는 가져오기
            const { data: tagData } = await supabase
              .from('tags')
              .select('id')
              .eq('name', tagName)
              .maybeSingle();

            let tagId;
            if (tagData) {
              tagId = tagData.id;
            } else {
              // 새 태그 생성
              const { data: newTag, error: newTagError } = await supabase
                .from('tags')
                .insert({ name: tagName })
                .select('id')
                .single();
              
              if (newTagError || !newTag) {
                console.error('태그 생성 실패:', newTagError);
                continue; // 다음 태그로 넘어감
              }
              
              tagId = newTag.id;
            }

            // 기사-태그 연결
            await supabase
              .from('article_tags')
              .insert({
                article_id: articleId,
                tag_id: tagId
              });
          }
        }

        // 기사 정보 업데이트 (기관 정보)
        if (organizations.length > 0) {
          // 기관 정보는 현재 별도 필드나 테이블이 없어서 기사 테이블의 추가 필드로 저장 가능
          // 추후 별도 테이블 구성 시 변경 필요
          await supabase
            .from('articles')
            .update({
              organizations: organizations.join(',')
            })
            .eq('id', articleId);
        }
      } catch (aiError) {
        console.error('AI 처리 중 오류:', aiError);
        // AI 처리 실패 시에도 기사는 저장되어 있음
      }
    }

    return articleId;
  } catch (error) {
    console.error('기사 저장 중 오류 발생:', error);
    return null;
  }
}

/**
 * 특정 조건으로 기사 목록 조회
 * @param params 조회 조건
 * @returns 조회된 기사 목록
 */
export async function getArticles(params: {
  page?: number;
  limit?: number;
  source?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  tags?: string[];
}) {
  try {
    const { 
      page = 1, 
      limit = 20, 
      source, 
      startDate, 
      endDate, 
      search,
      tags
    } = params;

    let query = supabase
      .from('articles')
      .select(`
        *,
        summaries (*),
        sources (name),
        article_tags (
          tags (name)
        )
      `)
      .order('published_at', { ascending: false });

    // 검색어가 있는 경우
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // 소스 필터링
    if (source) {
      query = query.eq('source_name', source);
    }

    // 날짜 필터링
    if (startDate) {
      query = query.gte('published_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('published_at', endDate);
    }

    // 태그 필터링 - 복잡하므로 결과를 가져온 후 JS로 필터링
    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .limit(limit);

    if (error) throw error;

    let filteredData = data;
    
    // 태그 기반 필터링 (태그가 지정된 경우)
    if (tags && tags.length > 0) {
      filteredData = data.filter(article => {
        const articleTags = article.article_tags.map((t: any) => t.tags.name);
        // 지정된 태그 중 하나라도 포함된 기사만 선택
        return tags.some(tag => articleTags.includes(tag));
      });
    }

    // 결과 변환 (SourceItem 형식에 맞게)
    const formattedResults = filteredData.map(article => {
      return {
        id: article.id,
        title: article.title,
        source: article.source_name,
        date: article.published_at,
        url: article.source_url,
        summary: article.summaries?.[0]?.summary || article.content || '',
        tags: article.article_tags.map((t: any) => t.tags.name),
        isScrapped: article.is_scraped,
        type: 'source'
      } as SourceItem;
    });

    return {
      items: formattedResults,
      total: count || 0,
      page,
      limit,
      hasMore: (page * limit) < (count || 0)
    };
  } catch (error) {
    console.error('기사 조회 중 오류 발생:', error);
    return {
      items: [],
      total: 0,
      page: params.page || 1,
      limit: params.limit || 20,
      hasMore: false
    };
  }
}

/**
 * 기사 스크랩 상태 토글
 * @param articleId 기사 ID
 * @param userId 사용자 ID
 * @param isScrapped 스크랩 여부
 * @returns 성공 여부
 */
export async function toggleArticleScrap(
  articleId: string, 
  userId: string, 
  isScrapped: boolean
): Promise<boolean> {
  try {
    if (isScrapped) {
      // 스크랩 추가
      await supabase
        .from('user_saved_articles')
        .insert({
          user_id: userId,
          article_id: articleId
        });
    } else {
      // 스크랩 제거
      await supabase
        .from('user_saved_articles')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', articleId);
    }
    
    return true;
  } catch (error) {
    console.error('스크랩 상태 변경 중 오류 발생:', error);
    return false;
  }
} 