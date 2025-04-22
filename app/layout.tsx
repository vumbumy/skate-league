// app/layout.tsx
"use client";

import {usePathname} from 'next/navigation';
import './globals.css';
import GlobalNavigationBar from "@/components/GlobalNavigationBar";
import {useEffect, useState} from "react"; // 전역 스타일시트 (Tailwind CSS 포함)


export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // 클라이언트에서 마운트되었는지 여부를 추적하는 상태
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // 컴포넌트가 클라이언트에서 마운트되면 isMounted를 true로 설정
    setIsMounted(true);
  }, []); // 빈 배열: 컴포넌트가 마운트될 때 딱 한 번만 실행

  // '/login'과 '/signup' 경로를 모두 포함
  const pathsWithoutGnb = ['/login', '/signup'];

  // 현재 경로가 GNB를 숨길 경로 목록에 포함되는지 확인
  const hideGnb = pathsWithoutGnb.includes(pathname);

  // 클라이언트에서 마운트되지 않았으면 GNB 렌더링 결정을 하지 않음
  // 마운트된 후에 isMounted가 true가 되면 hideGnb 값에 따라 GNB 렌더링 여부를 결정
  const shouldRenderGnb = isMounted && !hideGnb;

  return (
    <html lang="ko">
    <body className="bg-gray-100 text-gray-900">
    {/* 로그인 페이지가 아니면 GNB를 렌더링 */}
    {shouldRenderGnb && <GlobalNavigationBar/>}

    {/* 하위 페이지 콘텐츠 */}
    {children}
    </body>
    </html>
  );
}
