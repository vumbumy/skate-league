// components/GnbRenderer.tsx
"use client";

import {usePathname} from 'next/navigation';
import React, {useEffect, useState} from 'react';
import Link from 'next/link'; // Link 사용 시 필요

// AdminGlobalNavigationBar 컴포넌트의 내용은 이 파일 안으로 통합됩니다.
// import AdminGlobalNavigationBar from "@/components/AdminGlobalNavigationBar"; // 이 import는 더 이상 필요 없습니다.

// 이제 GnbRenderer 컴포넌트가 GNB 렌더링 로직과 Admin GNB의 UI를 모두 담당합니다.
const GnbRenderer = () => {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []); // 클라이언트 마운트 시 한 번만 실행

  // GNB를 숨길 페이지 경로 목록
  const pathsWithoutGnb = ['/login', '/signup'];

  // 현재 경로가 숨김 목록에 있는지 확인
  const hideGnb = pathsWithoutGnb.includes(pathname);

  // 현재 경로가 관리자 영역 경로인지 확인
  const isAdminArea = pathname.startsWith('/admin');

  // 클라이언트에서 마운트되었고 숨김 경로가 아닐 때만 GNB 렌더링 결정
  const shouldRenderAnyGnb = isMounted && !hideGnb;

  // 클라이언트에서 마운트되지 않았거나 GNB를 숨겨야 하는 경우 null 반환
  if (!shouldRenderAnyGnb) {
    return null;
  }

  // 그 외 경로인 경우 일반 GNB 컴포넌트 렌더링
  return <header className="text-white w-full"> {
    isAdminArea ?
      <nav className="bg-blue-800 p-4 text-white w-full">
        <div className="container mx-auto flex justify-between items-center">
          <div className="font-bold text-lg">스케이터 리그 관리</div>
          <div>
            {/* TODO: 관리자 메뉴 항목 (Link 컴포넌트 사용 권장) */}
            <Link href="/admin" className="mr-4 hover:underline">대시보드</Link>
            <Link href="/admin/leagues" className="mr-4 hover:underline">리그 관리</Link>
            <Link href="/admin/skaters" className="hover:underline">스케이터 관리</Link>
            {/* TODO: 로그아웃 버튼 로직 추가 (useAuth 훅 사용) */}
            {/*
               import { useAuth } from '@/context/AuthContext';
               import { signOut } from 'firebase/auth';
               import { auth } from '@/firebase/config';
               const { user } = useAuth();
               const handleLogout = async () => { try { await signOut(auth); } catch (e) { console.error(e); } };
               {user && <button onClick={handleLogout}>로그아웃</button>}
               */}
          </div>
        </div>
      </nav> :
      <nav className="bg-black p-4 text-white w-full">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          <Link href="/">홈</Link>
          <Link href="/league">리그 일정</Link>
          <Link href="/results">경기 결과</Link>
          <Link href="/more">더보기</Link>
        </div>
      </nav>
  }
  </header>; // ★ 사용자 본인의 GNB 컴포넌트 사용
};

export default GnbRenderer;
