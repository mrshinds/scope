'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

// 컨텍스트 타입 정의
interface AdminTokenContextType {
  adminToken: string;
  isTokenLoaded: boolean;
}

// 기본 컨텍스트 값
const defaultContext: AdminTokenContextType = {
  adminToken: '',
  isTokenLoaded: false
};

// 컨텍스트 생성
const AdminTokenContext = createContext<AdminTokenContextType>(defaultContext);

// 컨텍스트 사용을 위한 훅
export const useAdminToken = () => useContext(AdminTokenContext);

// Props 타입 정의
interface AdminTokenProviderProps {
  children: ReactNode;
}

/**
 * 관리자 토큰을 관리하는 Provider 컴포넌트
 * 서버 컴포넌트로부터 안전하게 토큰을 전달받아 클라이언트 컴포넌트에 제공
 */
export function AdminTokenProvider({ children }: AdminTokenProviderProps) {
  const [adminToken, setAdminToken] = useState('');
  const [isTokenLoaded, setIsTokenLoaded] = useState(false);

  // 마운트 시 부모 레이아웃의 data-admin-token 속성에서 토큰 가져오기
  useEffect(() => {
    const adminElement = document.querySelector('[data-admin-token]');
    if (adminElement) {
      const token = adminElement.getAttribute('data-admin-token') || '';
      setAdminToken(token);
    }
    setIsTokenLoaded(true);
  }, []);

  // 컨텍스트 값
  const contextValue: AdminTokenContextType = {
    adminToken,
    isTokenLoaded
  };

  return (
    <AdminTokenContext.Provider value={contextValue}>
      {children}
    </AdminTokenContext.Provider>
  );
} 