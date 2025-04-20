/**
 * 브라우저 쿠키를 다루는 유틸리티 함수
 */

/**
 * 쿠키를 가져오는 함수
 * @param name 가져올 쿠키의 이름
 * @returns 쿠키 값 또는 빈 문자열
 */
export function getCookie(name: string): string {
  if (typeof document === 'undefined') {
    return '';
  }
  
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1];

  return cookieValue || '';
}

/**
 * 쿠키를 설정하는 함수
 * @param name 쿠키 이름
 * @param value 쿠키 값
 * @param options 쿠키 옵션 (만료 시간, 경로 등)
 */
export function setCookie(
  name: string,
  value: string,
  options: {
    maxAge?: number;
    path?: string;
    sameSite?: 'strict' | 'lax' | 'none';
    secure?: boolean;
  } = {}
): void {
  if (typeof document === 'undefined') {
    return;
  }

  const { maxAge = 86400, path = '/', sameSite = 'lax', secure = false } = options;
  
  let cookieString = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=${path}; SameSite=${sameSite}`;
  
  if (secure) {
    cookieString += '; Secure';
  }
  
  document.cookie = cookieString;
}

/**
 * 쿠키를 삭제하는 함수
 * @param name 삭제할 쿠키의 이름
 * @param path 쿠키 경로 (기본값: '/')
 */
export function deleteCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  document.cookie = `${name}=; Max-Age=0; path=${path};`;
} 