'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  useEffect(() => {
    // 바로 대시보드로 리다이렉트
    window.location.replace('/dashboard');
  }, []);
  
  // 리다이렉트 중에 표시할 로딩 UI
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">SCOPE</h1>
      <div className="flex items-center mt-4">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span>대시보드로 이동 중...</span>
      </div>
    </div>
  );
} 