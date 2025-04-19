import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 뉴스 기사 내용을 요약하는 함수
 * @param content 기사 원문 내용
 * @param maxLength 최대 요약 길이 (기본값: 200자)
 * @returns 요약문과 원본 요약문
 */
export async function summarizeArticle(content: string, maxLength: number = 200): Promise<{ summary: string, originalSummary: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `당신은 금융 뉴스 요약 전문가입니다. 주어진 기사를 핵심만 간결하게 요약해주세요.
          중요한 숫자, 날짜, 기관명 등은 반드시 포함해야 합니다.
          요약은 ${maxLength}자 이내로 작성해주세요.`
        },
        {
          role: 'user',
          content: content
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const originalSummary = response.choices[0]?.message?.content || '요약 생성 실패';
    
    // 길이 제한이 있을 경우 추가 처리
    let summary = originalSummary;
    if (originalSummary.length > maxLength) {
      // 길이가 초과할 경우 다시 요약 요청
      const trimResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `다음 요약을 더 간결하게 ${maxLength}자 이내로 줄여주세요. 가장 핵심적인 정보만 포함하세요.`
          },
          {
            role: 'user',
            content: originalSummary
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
      });
      
      summary = trimResponse.choices[0]?.message?.content || originalSummary;
    }

    return { summary, originalSummary };
  } catch (error) {
    console.error('기사 요약 중 오류 발생:', error);
    throw new Error('기사 요약에 실패했습니다.');
  }
}

/**
 * 기사 내용에서 관련 태그를 추출하는 함수
 * @param content 기사 내용
 * @param title 기사 제목
 * @param maxTags 최대 태그 수 (기본값: 5)
 * @returns 추출된 태그 배열
 */
export async function extractTags(content: string, title: string, maxTags: number = 5): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `당신은 금융 뉴스 분석 전문가입니다. 
          주어진 기사 제목과 내용에서 중요한 키워드와 주제를 추출하여 태그로 만들어주세요.
          태그는 다음 규칙을 따라야 합니다:
          1. 각 태그는 1~3단어로 구성된 명사형이어야 합니다
          2. 최대 ${maxTags}개까지만 추출해주세요
          3. 금융, 경제, 정책 관련 핵심 용어를 우선시해주세요
          4. 구체적인 기관명, 상품명, 정책명 등이 있으면 포함해주세요
          5. 응답은 쉼표로 구분된 태그 목록만 작성해주세요 (예: "금리인상,한국은행,통화정책")
          `
        },
        {
          role: 'user',
          content: `제목: ${title}\n\n내용: ${content}`
        }
      ],
      temperature: 0.2,
      max_tokens: 100,
    });

    const tagsText = response.choices[0]?.message?.content || '';
    // 쉼표로 구분된 태그를 배열로 변환하고 공백 제거
    const tags = tagsText.split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);

    return tags.slice(0, maxTags); // 최대 태그 수 제한
  } catch (error) {
    console.error('태그 추출 중 오류 발생:', error);
    return [];
  }
}

/**
 * 기사 내용에서 관련 기관을 추출하는 함수
 * @param content 기사 내용
 * @param title 기사 제목
 * @returns 추출된 기관 배열
 */
export async function extractOrganizations(content: string, title: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `당신은 금융 뉴스 분석 전문가입니다. 
          주어진 기사 제목과 내용에서 언급된 모든 금융 기관, 정부 기관, 기업 등의 조직명을 추출해주세요.
          응답은 쉼표로 구분된 기관명 목록만 작성해주세요 (예: "한국은행,금융위원회,신한은행")
          `
        },
        {
          role: 'user',
          content: `제목: ${title}\n\n내용: ${content}`
        }
      ],
      temperature: 0.2,
      max_tokens: 100,
    });

    const orgsText = response.choices[0]?.message?.content || '';
    // 쉼표로 구분된 기관명을 배열로 변환하고 공백 제거
    const organizations = orgsText.split(',')
      .map((org: string) => org.trim())
      .filter((org: string) => org.length > 0);

    return organizations;
  } catch (error) {
    console.error('기관 추출 중 오류 발생:', error);
    return [];
  }
}

/**
 * 첨부파일 텍스트 추출 결과를 분석하는 함수
 * @param extractedText 첨부파일에서 추출한 텍스트
 * @returns 분석 결과 객체
 */
export async function analyzeAttachmentText(extractedText: string): Promise<{
  summary: string;
  keyPoints: string[];
  categories: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `당신은 금융 문서 분석 전문가입니다. 
          추출된 텍스트를 분석하여 다음 정보를 JSON 형식으로 제공해주세요:
          1. summary: 200자 이내의 문서 요약
          2. keyPoints: 문서의 핵심 포인트 (최대 5개 배열)
          3. categories: 문서가 속할 수 있는 카테고리 (최대 3개 배열)
          `
        },
        {
          role: 'user',
          content: extractedText.substring(0, 4000) // 텍스트가 너무 길면 앞부분만 사용
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    return {
      summary: result.summary || '요약 정보 없음',
      keyPoints: result.keyPoints || [],
      categories: result.categories || []
    };
  } catch (error) {
    console.error('첨부파일 분석 중 오류 발생:', error);
    return {
      summary: '분석 실패',
      keyPoints: [],
      categories: []
    };
  }
} 