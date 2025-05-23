// components/GnbRenderer.tsx
"use client";

import { usePathname } from "next/navigation";
import React from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar"; // Link 사용 시 필요

const PATHS_WITHOUT_GNB = ["/login", "/signup"];

// 이제 GnbRenderer 컴포넌트가 GNB 렌더링 로직과 Admin GNB의 UI를 모두 담당합니다.
const GnbRenderer = () => {
  const pathname = usePathname();
  if (PATHS_WITHOUT_GNB.includes(pathname)) {
    return null; // GNB 숨기기
  }

  // 현재 경로가 관리자 영역 경로인지 확인
  const isAdminArea = pathname.startsWith("/admin");

  // 그 외 경로인 경우 일반 GNB 컴포넌트 렌더링
  return (
    <header className="text-white w-full">
      {isAdminArea ? (
        <nav className="bg-blue-800 px-6 py-4 text-white w-full">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/">
              <img src="/logo.webp" width={33} height={56} />
            </Link>
            <span>스케이터 리그 관리</span>
          </div>
        </nav>
      ) : (
        <nav className="relative bg-black px-6 py-4 text-white w-full flex gap-6">
          <div className="flex gap-6 ml-0">
            <Link href="/">
              <img src="/logo.webp" width={33} height={56} />
            </Link>
          </div>

          <div className="absolute flex gap-6 ml-auto right-6">
            <Avatar size={24} />
          </div>
        </nav>
      )}
    </header>
  ); // ★ 사용자 본인의 GNB 컴포넌트 사용
};

export default GnbRenderer;
