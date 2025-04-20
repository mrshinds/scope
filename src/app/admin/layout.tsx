import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/supabase';
import { AdminTokenProvider } from './components/admin-token-provider';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 관리자 권한 확인 
  const isUserAdmin = await isAdmin();
  
  // 관리자가 아닌 경우 리디렉션
  if (!isUserAdmin) {
    redirect('/login?error=unauthorized&message=관리자+권한이+필요합니다.');
  }
  
  // 관리자 토큰 가져오기 (서버 컴포넌트에서만 안전하게 접근)
  const adminToken = process.env.ADMIN_ACCESS_TOKEN || '';
  
  return (
    <>
      {/* 관리자 토큰을 데이터 속성으로 전달 */}
      <div data-admin-token={adminToken}>
        <AdminTokenProvider>
          {children}
        </AdminTokenProvider>
      </div>
    </>
  );
} 