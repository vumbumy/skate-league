// components/GnbRenderer.tsx
"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/Avatar"; // Link 사용 시 필요

// AdminGlobalNavigationBar 컴포넌트의 내용은 이 파일 안으로 통합됩니다.
// import AdminGlobalNavigationBar from "@/components/AdminGlobalNavigationBar"; // 이 import는 더 이상 필요 없습니다.

// 이제 GnbRenderer 컴포넌트가 GNB 렌더링 로직과 Admin GNB의 UI를 모두 담당합니다.
const GnbRenderer = () => {
  const { userData } = useAuth(); // authLoading으로 이름 변경

  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []); // 클라이언트 마운트 시 한 번만 실행

  // GNB를 숨길 페이지 경로 목록
  const pathsWithoutGnb = ["/login", "/signup"];

  // 현재 경로가 숨김 목록에 있는지 확인
  const hideGnb = pathsWithoutGnb.includes(pathname);

  // 현재 경로가 관리자 영역 경로인지 확인
  const isAdminArea = pathname.startsWith("/admin");

  // 클라이언트에서 마운트되었고 숨김 경로가 아닐 때만 GNB 렌더링 결정
  const shouldRenderAnyGnb = isMounted && !hideGnb;

  // 클라이언트에서 마운트되지 않았거나 GNB를 숨겨야 하는 경우 null 반환
  if (!shouldRenderAnyGnb) {
    return null;
  }

  // 그 외 경로인 경우 일반 GNB 컴포넌트 렌더링
  return (
    <header className="text-white w-full">
      {isAdminArea ? (
        <nav className="bg-blue-800 px-6 py-4 text-white w-full">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/">홈</Link>
            <span>스케이터 리그 관리</span>
          </div>
        </nav>
      ) : (
        <nav className="relative bg-black px-6 py-4 text-white w-full flex gap-6">
          <div className="flex gap-6 mx-auto md:ml-0">
            <Link href="/">홈</Link>
            <Link href="/league">리그 일정</Link>
            <Link href="/more">선수 목록</Link>
          </div>

          <div className="absolute flex gap-6 ml-auto right-6">
            {userData && <Avatar email={userData.email} size={24} />}
          </div>
        </nav>
      )}
    </header>
  ); // ★ 사용자 본인의 GNB 컴포넌트 사용
};

export default GnbRenderer;
