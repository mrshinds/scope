'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/login');
  }, [router]);
  
  // 리다이렉트 중에 표시할 로딩 UI
  return (
    <div className="flex items-center justify-center min-h-screen bg-shinhan-gray">
      <h1 className="text-3xl font-bold text-shinhan-blue">SCOPE</h1>
    </div>
  );
} 