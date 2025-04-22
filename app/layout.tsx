// app/layout.tsx
"use client";

import {usePathname} from 'next/navigation';
import './globals.css';
import {useEffect, useState} from "react";
import {Inter} from 'next/font/google';
import {AuthProvider} from "@/context/AuthContext";
import GnbRenderer from "@/components/GNBRenderer";

const inter = Inter({subsets: ['latin']});

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // '/login'과 '/signup' 경로를 모두 포함
  const pathsWithoutGnb = ['/login', '/signup'];

  // 현재 경로가 GNB를 숨길 경로 목록에 포함되는지 확인
  const hideGnb = pathsWithoutGnb.includes(pathname);

  return (
    <html lang="ko">
    <body
      className="bg-gray-100 text-gray-900 min-h-screen flex flex-col"> {/* body에 flex 및 min-h-screen 추가 (전체 높이 확보 및 flex 컨테이너화) */}
    {/* AuthProvider로 앱 전체를 감싸서 인증 정보를 전역적으로 제공 */}
    <AuthProvider>
      {/* GNB를 감싸는 고정 컨테이너 */}
      {/* GnbRenderer가 GNB 또는 null을 렌더링하도록 합니다. */}
      {/* GNB의 실제 높이에 맞게 아래 pt- 클래스를 조정해야 합니다. */}
      {/* GNB 높이를 예를 들어 56px (Tailwind p-4)으로 가정하고 pt-14 (56px) 사용 */}
      <div className="fixed top-0 left-0 w-full z-50 bg-gray-800"> {/* GNB 배경색도 고정 컨테이너에 주는 것이 좋습니다 */}
        {/* GnbRenderer는 이 고정 컨테이너 안에서 렌더링될지 말지를 결정 */}
        <GnbRenderer/>
      </div>

      {/* 하위 페이지 콘텐츠 영역 */}
      {/* GNB 높이만큼 상단 여백 (pt-14 예시), flex-grow로 남은 공간 채우기 */}
      {/* ★flex, flex-col, justify-center, h-full 추가하여 세로 중앙 정렬 */}
      <div className={`flex-grow flex flex-col justify-center h-full ${hideGnb || 'pt-14'}`}>
        <div className="container mx-auto"> {/* 콘텐츠의 max-width 및 가로 중앙 정렬, 좌우 여백 */}
          {children} {/* children은 이제 이 flex/justify-center 컨테이너의 자식으로 렌더링 */}
        </div>
      </div>
    </AuthProvider>
    </body>
    </html>
  );
}
