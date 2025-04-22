import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SCOPE - 금융 규제 정보 플랫폼',
  description: '최신 금융 규제 및 정책 정보를 한 곳에서 확인하세요.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <main>{children}</main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
} 