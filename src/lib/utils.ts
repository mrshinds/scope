import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 이메일 형식이 유효한지 검사하는 함수
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// 특정 이메일 도메인인지 확인하는 함수
export const isSpecificEmailDomain = (email: string, domain: string): boolean => {
  if (!email) return false;
  const emailDomain = email.split('@')[1];
  return emailDomain?.toLowerCase() === domain.toLowerCase();
};

// 신한 이메일 도메인인지 확인
export const isShinhanEmail = (email: string): boolean => {
  return isSpecificEmailDomain(email, 'shinhan.com');
};

// 네이버 이메일 도메인인지 확인
export const isNaverEmail = (email: string): boolean => {
  return isSpecificEmailDomain(email, 'naver.com');
};
